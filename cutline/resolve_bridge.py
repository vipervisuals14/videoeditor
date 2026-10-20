"""Bridge into DaVinci Resolve's own Scripts menu.

Resolve Free 21.1 removed Python scripting and blocks the UIManager, but it
still lists and runs Lua files from `Workspace > Scripts`. That is the only
supported door left on the free edition, so Cutline uses it for one job:
pulling a finished cut into the project you already have open, without a file
dialog.

The heavy lifting stays in the local engine. `cutline watch` runs headless
(optionally as a launch agent) and writes every new cut to a stable `latest/`
folder; the Lua script imports that folder on a menu click.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from .config import normalize_config
from .ffmpeg import probe
from .kit import bundle
from .pipeline import run_build
from .settings import ALLOWED_AUDIO, ALLOWED_CAPTION, ALLOWED_VIDEO
from .store import ProjectStore

SCRIPT_NAME = "Cutline - import latest.lua"
DIAG_NAME = "Cutline - check bridge.lua"
STUDIO_NAME = "Cutline - import latest (Studio).py"
LEGACY_NAMES = ("cutline_import.lua", "cutline_diag.lua", "cutline_import.py")
AGENT_LABEL = "com.cutline.watch"

RESOLVE_SCRIPTS = {
    "darwin": Path.home() / "Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Scripts/Utility",
    "win32": Path.home() / "AppData/Roaming/Blackmagic Design/DaVinci Resolve/Support/Fusion/Scripts/Utility",
    "linux": Path.home() / ".local/share/DaVinciResolve/Fusion/Scripts/Utility",
}


def default_root() -> Path:
    """Where the engine keeps its inbox, builds, and logs."""
    home = Path.home()
    if sys.platform == "darwin":
        return home / "Movies/Cutline"
    if sys.platform == "win32":
        return home / "Videos/Cutline"
    return home / "Videos/Cutline"


def scripts_dir(target: str | Path | None = None) -> Path:
    if target:
        return Path(target).expanduser()
    return RESOLVE_SCRIPTS.get(sys.platform, RESOLVE_SCRIPTS["linux"])


# ---------------------------------------------------------------------------
# Lua
# ---------------------------------------------------------------------------

IMPORT_TEMPLATE = """-- Cutline - import the newest finished cut.
-- Installed by `cutline resolve-install`. Paths are baked in on purpose: the
-- free edition's Lua sandbox cannot be relied on for environment lookups.
--
-- Resolve Free: Workspace > Scripts > Cutline - import latest
--
-- Everything below is wrapped in pcall. A menu script that raises is a script
-- that silently does nothing, and a silent failure is worse than a visible
-- "nothing built yet" timeline.

local OTIO = [[{otio}]]
local MEDIA = [[{media}]]
local NAME = [[{name}]]

-- Resolve hands menu scripts a `resolve` global on most builds, but on the free
-- 21.1 build that global is nil and the live handle hangs off `app`. Reusing the
-- app's own connection is the only one the free edition allows; asking for a new
-- one (bmd.scriptapp) returns nil and the script silently does nothing.
local function cutline_resolver()
  local ok, app_resolve = pcall(function() return app:GetResolve() end)
  if ok and app_resolve then return app_resolve end
  return resolve
end

local function main()
  local r = cutline_resolver()
  if not r then return end
  local ok_manager, manager = pcall(function() return r:GetProjectManager() end)
  if not ok_manager or not manager then return end
  local project = manager:GetCurrentProject()
  if not project then return end
  local pool = project:GetMediaPool()
  if not pool then return end

  local ok_import, timeline = pcall(function()
    return pool:ImportTimelineFromFile(OTIO, {{
      timelineName = NAME,
      importSourceClips = true,
      sourceClipsPath = MEDIA,
    }})
  end)

  if ok_import and timeline then
    pcall(function() project:SetCurrentTimeline(timeline) end)
    pcall(function() r:OpenPage("edit") end)
    return
  end

  -- Nothing waiting, or this build cannot import. Leave a readable marker
  -- instead of failing without a trace.
  pcall(function() pool:CreateEmptyTimeline("Cutline: nothing imported (run resolve-status)") end)
end

main()
"""


DIAG_TEMPLATE = """-- Cutline - bridge self-check.
-- Workspace > Scripts > Cutline - check bridge
--
-- The free edition mutes print() in menu scripts, so this reports through the
-- one channel that is always visible: a timeline name in the Media Pool.

local NAME = [[{name}]]
local MEDIA = [[{media}]]

-- Same free-edition rule as the import script: `resolve` is nil on 21.1 Free,
-- the live connection is reachable through `app:GetResolve()`.
local function cutline_resolver()
  local ok, app_resolve = pcall(function() return app:GetResolve() end)
  if ok and app_resolve then return app_resolve end
  return resolve
end

local function main()
  local r = cutline_resolver()
  if not r then return end
  local ok_manager, manager = pcall(function() return r:GetProjectManager() end)
  if not ok_manager or not manager then return end
  local project = manager:GetCurrentProject()
  if not project then return end
  local pool = project:GetMediaPool()
  if not pool then return end

  -- An import of an empty string fails cheaply and proves the call exists.
  local ok_api = pcall(function()
    return pool.ImportTimelineFromFile ~= nil
  end)

  local label
  if not ok_api then
    label = "Cutline: timeline import unavailable"
  else
    label = "Cutline: bridge ready (" .. NAME .. ")"
  end
  pcall(function() pool:CreateEmptyTimeline(label) end)
end

main()
"""


STUDIO_TEMPLATE = """\"\"\"Cutline — import the newest finished cut (Resolve Studio).

Studio only: Resolve 21.1 removed Python from the free edition's Scripts menu.
On Free, use "Cutline - import latest" (Lua) instead.

Workspace > Scripts > Cutline - import latest (Studio)
\"\"\"

OTIO = {otio!r}
MEDIA = {media!r}
NAME = {name!r}


def _resolve():
    # Resolve injects `resolve` into menu scripts; fall back to the module.
    import builtins
    app = getattr(builtins, "resolve", None) or globals().get("resolve")
    if app is not None:
        return app
    import DaVinciResolveScript as dvr_script
    return dvr_script.scriptapp("Resolve")


def main():
    app = _resolve()
    manager = app.GetProjectManager()
    project = manager.GetCurrentProject() if manager else None
    if not project:
        print("Cutline: open a project first.")
        return

    pool = project.GetMediaPool()
    timeline = pool.ImportTimelineFromFile(OTIO, {{
        "timelineName": NAME,
        "importSourceClips": True,
        "sourceClipsPath": MEDIA,
    }})
    if not timeline:
        print("Cutline: nothing to import yet — drop footage in the inbox and let the watcher build.")
        return
    project.SetCurrentTimeline(timeline)
    print(f"Cutline: imported {{NAME}}")


main()
"""


def render_script(template: str, otio: Path, media: Path, name: str) -> str:
    return template.format(otio=str(otio), media=str(media), name=str(name))


DROP_README = """Cutline drop folder
===================

1. Put clips in  inbox/
   (optional: an .srt named like a clip becomes the captions)

2. The watcher builds a cut and publishes it to  latest/

3. In DaVinci Resolve:  Workspace > Scripts > Cutline - import latest

Settings live in config.json in this folder. Edit it in any text editor;
changes apply on the next build.

Check the last build:   cutline resolve-status
Force a build now:      cutline resolve-build
Watch in a terminal:    cutline resolve-watch
"""


def write_drop_readme(root: Path) -> Path:
    root.mkdir(parents=True, exist_ok=True)
    path = root / "READ-ME.txt"
    path.write_text(DROP_README, encoding="utf-8")
    return path


def latest_state(root: str | Path | None = None) -> dict:
    root = Path(root).expanduser() if root else default_root()
    path = root / "latest" / "state.json"
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def install_scripts(root: str | Path | None = None, target: str | Path | None = None) -> dict:
    """Write the menu scripts into Resolve's user scripts folder."""
    root = Path(root).expanduser() if root else default_root()
    write_drop_readme(root)
    destination = scripts_dir(target)
    existed = destination.exists()
    destination.mkdir(parents=True, exist_ok=True)

    latest = root / "latest"
    otio = latest / "timeline.otio"
    media = latest / "media"
    name = "Cutline import"

    import_path = destination / SCRIPT_NAME
    diag_path = destination / DIAG_NAME
    studio_path = destination / STUDIO_NAME
    import_path.write_text(render_script(IMPORT_TEMPLATE, otio, media, name), encoding="utf-8")
    diag_path.write_text(render_script(DIAG_TEMPLATE, otio, media, name), encoding="utf-8")
    studio_path.write_text(render_script(STUDIO_TEMPLATE, otio, media, name), encoding="utf-8")
    for legacy in LEGACY_NAMES:
        try:
            (destination / legacy).unlink()
        except OSError:
            pass
    return {"folder": str(destination), "scripts": [str(import_path), str(diag_path), str(studio_path)],
            "otio": str(otio), "root": str(root), "readme": str(root / "READ-ME.txt"),
            "agent": str(launch_agent_path()), "folder_existed": existed}


# ---------------------------------------------------------------------------
# Headless engine
# ---------------------------------------------------------------------------

MEDIA_SUFFIXES = ALLOWED_VIDEO | ALLOWED_AUDIO | ALLOWED_CAPTION


@dataclass
class WatchState:
    built: int = 0
    last_signature: str = ""
    errors: list[str] = field(default_factory=list)


def inbox_media(inbox: Path) -> list[Path]:
    if not inbox.exists():
        return []
    return sorted(
        path for path in inbox.iterdir()
        if path.is_file() and not path.name.startswith(".") and path.suffix.lower() in MEDIA_SUFFIXES
    )


def inbox_signature(inbox: Path) -> str:
    parts = []
    for path in inbox_media(inbox):
        try:
            stat = path.stat()
        except OSError:
            continue
        parts.append(f"{path.name}:{stat.st_size}:{int(stat.st_mtime)}")
    return "|".join(parts)


def _signature_path(root: Path) -> Path:
    return root / "engine" / "signature.txt"


def last_built_signature(root: str | Path | None = None) -> str:
    path = _signature_path(Path(root).expanduser() if root else default_root())
    try:
        return path.read_text(encoding="utf-8").strip()
    except OSError:
        return ""


def default_config() -> dict:
    return normalize_config({
        "mode": "vlog",
        "name": "Cutline drop",
        "vlog": {"look": "viewfinder", "location": "", "hud": True, "collage": True},
        # The drop box is usually one long take, so transitions land on the
        # silence cuts rather than waiting for a source change that never comes.
        "transitions": {"scope": "cuts", "frequency": 2},
    }, "vlog")


def load_watch_config(root: Path) -> dict:
    """The drop folder's settings live in one JSON file next to the inbox."""
    config_path = root / "config.json"
    if not config_path.exists():
        config = default_config()
        config_path.parent.mkdir(parents=True, exist_ok=True)
        config_path.write_text(json.dumps(config, indent=2), encoding="utf-8")
        return config
    try:
        raw = json.loads(config_path.read_text(encoding="utf-8"))
    except Exception:
        return default_config()
    return normalize_config(raw, str(raw.get("mode") or "vlog"))


def _sources(paths: list[Path]) -> tuple[list[dict], list[Path], list[Path]]:
    sources, videos, errors = [], [], []
    for index, path in enumerate(paths):
        try:
            info = probe(path)
        except Exception as exc:
            errors.append(f"{path.name}: {exc}")
            continue
        if not info.has_video:
            continue
        videos.append(path)
        sources.append({
            "id": f"src{index + 1:02d}{hashlib.md5(path.name.encode()).hexdigest()[:6]}",
            "path": str(path), "name": path.name,
            "duration": round(info.duration, 3), "width": info.width, "height": info.height,
            "fps": info.fps, "has_video": info.has_video, "has_audio": info.has_audio,
            "size": info.size,
        })
    return sources, videos, errors


def _match_captions(captions: list[Path], videos: list[Path]) -> Path | None:
    """Prefer an SRT named like a clip; otherwise take the only one present."""
    if not captions:
        return None
    stems = {path.stem.lower() for path in videos}
    for path in captions:
        if path.stem.lower() in stems:
            return path
    return captions[0] if len(captions) == 1 else None


def build_from_inbox(root: str | Path | None = None) -> dict:
    """Build one cut from whatever sits in the inbox and publish it to latest/."""
    root = Path(root).expanduser() if root else default_root()
    inbox = root / "inbox"
    latest = root / "latest"
    inbox.mkdir(parents=True, exist_ok=True)
    latest.mkdir(parents=True, exist_ok=True)

    config = load_watch_config(root)
    # Snapshot before the build: clips that arrive mid-build stay "pending" and
    # trigger the next pass instead of being folded into a cut that ignored them.
    signature = inbox_signature(inbox)
    media = inbox_media(inbox)
    clips = [path for path in media if path.suffix.lower() in ALLOWED_VIDEO]
    captions = [path for path in media if path.suffix.lower() in (".srt", ".vtt")]
    music = [path for path in media if path.suffix.lower() in ALLOWED_AUDIO]

    sources, videos, errors = _sources(clips)
    if not sources:
        raise RuntimeError("The inbox has no clips Cutline can read yet.")

    # A caption file dropped beside the footage wins over machine transcription.
    srt_path = _match_captions(captions, videos)
    if srt_path and config["captions"].get("enabled", True):
        config["captions"]["source"] = "file"

    # One audio file is the score; the planner cuts the picture to its beat.
    music_path = music[0] if (config["mode"] == "music" and music) else None

    store = ProjectStore(root / "engine" / "projects")
    name = f"{config.get('name') or 'Cutline drop'} {datetime.now().strftime('%H:%M')}"
    project = store.create(
        config, sources, name=name,
        srt_path=str(srt_path) if srt_path else None,
        music_path=str(music_path) if music_path else None,
    )
    run_build(store, project["id"])

    finished = store.load(project["id"])
    if finished.get("status") != "done":
        raise RuntimeError(finished.get("error") or "The build did not finish.")

    # Hand Resolve a folder it can open in place: rewritten timeline + media/.
    if latest.exists():
        shutil.rmtree(latest, ignore_errors=True)
    packaged = bundle(store, project["id"], dst_dir=latest)

    summary = finished.get("summary") or {}
    state = {
        "built": datetime.now(timezone.utc).isoformat(),
        "project": project["id"],
        "name": finished.get("name"),
        "mode": summary.get("mode_label") or finished.get("mode"),
        "status": finished.get("status"),
        "timeline": summary.get("timeline_seconds"),
        "clips": summary.get("clips"),
        "captions": summary.get("captions"),
        "transitions": summary.get("transitions"),
        "tracks": _tracks(latest / "timeline.otio"),
        "portable": packaged.portable,
        "linked": packaged.linked,
        "warnings": list(dict.fromkeys((summary.get("warnings") or []) + (finished.get("warnings") or []))),
        "errors": errors,
    }
    marker = _signature_path(root)
    marker.parent.mkdir(parents=True, exist_ok=True)
    marker.write_text(signature, encoding="utf-8")
    (latest / "state.json").write_text(json.dumps(state, indent=2), encoding="utf-8")
    return state


def _tracks(otio: Path) -> list[str]:
    try:
        from opentimelineio import adapters

        timeline = adapters.read_from_file(str(otio))
        return [track.name for track in timeline.tracks]
    except Exception:
        return []


def watch(root: str | Path | None = None, once: bool = False, interval: float = 3.0,
          on_build=None) -> WatchState:
    """Rebuild whenever the inbox changes. Runs until interrupted."""
    root = Path(root).expanduser() if root else default_root()
    inbox = root / "inbox"
    logs = root / "logs"
    inbox.mkdir(parents=True, exist_ok=True)
    logs.mkdir(parents=True, exist_ok=True)
    log_path = logs / "watch.log"
    state = WatchState(last_signature=last_built_signature(root))

    def log(message: str) -> None:
        line = f"{datetime.now().isoformat(timespec='seconds')}  {message}"
        with log_path.open("a", encoding="utf-8") as handle:
            handle.write(line + "\n")

    log(f"watching {inbox}")
    while True:
        signature = inbox_signature(inbox)
        if signature and signature != state.last_signature:
            try:
                result = build_from_inbox(root)
                state.built += 1
                state.last_signature = signature
                log(f"built {result.get('name')} — {result.get('timeline')}s, "
                    f"{len(result.get('tracks') or [])} tracks")
                if on_build:
                    on_build(result)
            except Exception as exc:
                state.errors.append(str(exc))
                log(f"build failed: {exc}")
                state.last_signature = signature
        if once:
            return state
        time.sleep(max(0.5, interval))


# ---------------------------------------------------------------------------
# launchd (macOS): keep the watcher alive at login
# ---------------------------------------------------------------------------

AGENT_TEMPLATE = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>{label}</string>
  <key>ProgramArguments</key>
  <array>
    <string>{python}</string>
    <string>-m</string>
    <string>cutline</string>
    <string>resolve-watch</string>
    <string>--root</string>
    <string>{root}</string>
  </array>
  <key>WorkingDirectory</key><string>{cwd}</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>{log}</string>
  <key>StandardErrorPath</key><string>{log}</string>
</dict>
</plist>
"""


def launch_agent_path(home: Path | None = None) -> Path:
    return (home or Path.home()) / "Library/LaunchAgents" / f"{AGENT_LABEL}.plist"


def render_agent(root: Path, python: str | None = None, cwd: str | None = None) -> str:
    log = root / "logs" / "agent.log"
    log.parent.mkdir(parents=True, exist_ok=True)
    return AGENT_TEMPLATE.format(
        label=AGENT_LABEL,
        python=python or sys.executable,
        root=str(root),
        cwd=cwd or str(Path(__file__).resolve().parent.parent),
        log=str(log),
    )


def write_agent(root: Path, python: str | None = None, cwd: str | None = None) -> Path:
    path = launch_agent_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(render_agent(root, python, cwd), encoding="utf-8")
    return path


def load_agent(path: Path | None = None) -> tuple[bool, str]:
    """(Re)start the login item now so nobody has to copy launchctl by hand."""
    import os
    import subprocess

    path = path or launch_agent_path()
    if not path.exists():
        return False, f"No login item at {path}."
    subprocess.run(["launchctl", "unload", str(path)], capture_output=True, text=True)
    result = subprocess.run(["launchctl", "load", str(path)], capture_output=True, text=True)
    if result.returncode == 0:
        return True, "Login item loaded."
    # macOS 13+ prefers bootstrap; try it when the legacy verb is refused.
    domain = f"gui/{os.getuid()}"
    retry = subprocess.run(["launchctl", "bootstrap", domain, str(path)],
                           capture_output=True, text=True)
    if retry.returncode == 0:
        return True, "Login item bootstrapped."
    detail = (retry.stderr or result.stderr or "").strip()
    return False, detail or "launchctl refused the login item."


def agent_running(label: str = AGENT_LABEL) -> bool:
    import subprocess

    result = subprocess.run(["launchctl", "list", label], capture_output=True, text=True)
    return result.returncode == 0
