from __future__ import annotations

import json
import subprocess
import wave
from pathlib import Path

import numpy as np
import pytest
from opentimelineio import adapters

from cutline.ffmpeg import ffmpeg_exe
from cutline.resolve_bridge import (
    AGENT_LABEL,
    DIAG_TEMPLATE,
    IMPORT_TEMPLATE,
    build_from_inbox,
    install_scripts,
    render_agent,
    render_script,
    watch,
)

lupa = pytest.importorskip("lupa", reason="lupa is only needed to exercise the Lua menu scripts")

PRELUDE = """
LOG = { touches = 0 }
IMPORT_RESULT = {marker = true}
resolve = {
  GetProjectManager = function()
    return {
      GetCurrentProject = function()
        return {
          GetMediaPool = function()
            return {
              ImportTimelineFromFile = function(self, path, options)
                LOG.touches = LOG.touches + 1
                LOG.path = path
                LOG.options = options
                OPTIONS_SEEN = options
                return IMPORT_RESULT
              end,
              CreateEmptyTimeline = function(self, name)
                LOG.empty = name
                return {name = name}
              end,
            }
          end,
          SetCurrentTimeline = function(self, timeline)
            LOG.current = timeline
          end,
        }
      end,
    }
  end,
  OpenPage = function(self, page)
    LOG.page = page
  end,
}
"""


def _run_lua(script: str, import_ok: bool):
    runtime = lupa.LuaRuntime(unpack_returned_tuples=True)
    runtime.execute(PRELUDE)
    if not import_ok:
        runtime.execute("IMPORT_RESULT = nil")
    runtime.execute(script)
    return runtime.globals().LOG


def test_render_bakes_absolute_paths_and_balanced_braces(tmp_path: Path):
    otio = tmp_path / "latest" / "timeline.otio"
    media = tmp_path / "latest" / "media"
    text = render_script(IMPORT_TEMPLATE, otio, media, "Cutline import")

    assert str(otio) in text
    assert str(media) in text
    assert "{{" not in text and "}}" not in text
    assert "timelineName = NAME" in text
    assert "sourceClipsPath = MEDIA" in text
    # The free Lua sandbox has no io library; the script must not need it.
    assert "io.open" not in text


def test_install_scripts_targets_the_resolve_menu(tmp_path: Path):
    scripts = tmp_path / "Utility"
    root = tmp_path / "Cutline"
    result = install_scripts(root=root, target=scripts)

    assert Path(result["folder"]) == scripts
    names = sorted(Path(path).name for path in result["scripts"])
    assert names == ["Cutline - check bridge.lua", "Cutline - import latest (Studio).py",
                     "Cutline - import latest.lua"]
    for path in result["scripts"]:
        text = Path(path).read_text(encoding="utf-8")
        assert "function main()" in text or "def main()" in text
    assert result["otio"].endswith("latest/timeline.otio")


def test_install_writes_a_drop_folder_readme(tmp_path: Path):
    result = install_scripts(root=tmp_path / "Cutline", target=tmp_path / "Utility")
    readme = Path(result["readme"])
    assert readme.exists()
    text = readme.read_text(encoding="utf-8")
    assert "inbox/" in text and "Cutline - import latest" in text


def test_install_removes_pre_rename_scripts(tmp_path: Path):
    scripts = tmp_path / "Utility"
    scripts.mkdir()
    for legacy in ("cutline_import.lua", "cutline_diag.lua", "cutline_import.py"):
        (scripts / legacy).write_text("-- old", encoding="utf-8")

    install_scripts(root=tmp_path / "Cutline", target=scripts)

    assert not any((scripts / name).exists() for name in ("cutline_import.lua", "cutline_diag.lua"))
    assert (scripts / "Cutline - import latest.lua").exists()


def test_login_item_install_is_refused_off_macos(tmp_path: Path, monkeypatch):
    import sys

    from cutline.cli import main

    monkeypatch.setattr(sys, "platform", "linux")
    assert main(["resolve-agent", "--root", str(tmp_path)]) == 1


def test_load_agent_reports_a_missing_plist(tmp_path: Path):
    from cutline.resolve_bridge import load_agent

    ok, message = load_agent(tmp_path / "missing.plist")
    assert ok is False
    assert "No login item" in message


def test_status_command_reports_before_and_after_a_build(tmp_path: Path, drop_media, capsys):
    from cutline.cli import main

    root = tmp_path / "Cutline"
    assert main(["resolve-status", "--root", str(root)]) == 1
    assert "nothing built yet" in capsys.readouterr().out

    inbox = root / "inbox"
    inbox.mkdir(parents=True)
    (inbox / "take.mp4").write_bytes(drop_media["clip"].read_bytes())
    assert main(["resolve-build", "--root", str(root)]) == 0
    capsys.readouterr()
    assert main(["resolve-status", "--root", str(root)]) == 0
    out = capsys.readouterr().out
    assert "V1 — Program" in out
    assert "mode: vlog" in out


def test_studio_python_entry_compiles(tmp_path: Path):
    from cutline.resolve_bridge import STUDIO_TEMPLATE

    text = render_script(STUDIO_TEMPLATE, tmp_path / "latest/timeline.otio",
                         tmp_path / "latest/media", 'Cutline "import"')
    compiled = compile(text, "cutline_import.py", "exec")
    assert compiled
    assert "ImportTimelineFromFile" in text
    assert '"timelineName": NAME' in text
    # The quoted name must survive repr so a quote in a folder name cannot break it.
    assert '\'Cutline "import"\'' in text


def test_lua_import_calls_the_resolve_api(tmp_path: Path):
    otio = tmp_path / "latest/timeline.otio"
    otio.parent.mkdir(parents=True)
    otio.write_text("{}", encoding="utf-8")
    media = tmp_path / "latest/media"
    media.mkdir()
    script = render_script(IMPORT_TEMPLATE, otio, media, "Cutline import")

    log = _run_lua(script, import_ok=True)

    assert log.touches == 1
    assert log.path == str(otio)
    assert log.options.timelineName == "Cutline import"
    assert log.options.sourceClipsPath == str(media)
    assert log.options.importSourceClips is True
    assert log.page == "edit"
    assert log.current is not None
    assert log.empty is None


def test_lua_leaves_a_marker_when_nothing_is_ready(tmp_path: Path):
    otio = tmp_path / "latest/timeline.otio"
    script = render_script(IMPORT_TEMPLATE, otio, tmp_path / "latest/media", "Cutline import")

    log = _run_lua(script, import_ok=False)

    assert log.touches == 1
    assert log.empty is not None
    assert "Cutline" in log.empty


def test_lua_diagnostic_reports_through_the_media_pool(tmp_path: Path):
    script = render_script(DIAG_TEMPLATE, tmp_path / "t", tmp_path / "m", "Cutline import")
    log = _run_lua(script, import_ok=True)

    assert log.empty.startswith("Cutline:")
    assert "Cutline import" in log.empty


def test_launch_agent_is_valid_plist(tmp_path: Path):
    import plistlib

    text = render_agent(tmp_path / "Cutline", python="/usr/bin/python3", cwd="/opt/cutline")
    assert f"<string>{AGENT_LABEL}</string>" in text
    data = plistlib.loads(text.encode("utf-8"))
    assert data["Label"] == AGENT_LABEL
    assert data["ProgramArguments"][-1] == str(tmp_path / "Cutline")
    assert "resolve-watch" in data["ProgramArguments"]
    assert data["KeepAlive"] is True


@pytest.fixture(scope="module")
def drop_media(tmp_path_factory):
    folder = tmp_path_factory.mktemp("drop")
    wav = folder / "voice.wav"
    sample_rate = 44100
    duration = 7.0
    t = np.arange(int(sample_rate * duration)) / sample_rate
    amplitude = np.zeros_like(t)
    for start, end in ((0.2, 2.2), (2.8, 4.4), (5.0, 6.6)):
        mask = (t >= start) & (t < end)
        amplitude[mask] = 0.3 * (0.7 + 0.3 * np.sin(2 * np.pi * 3.4 * t[mask]))
    signal = np.clip(amplitude * np.sin(2 * np.pi * 160 * t), -1, 1)
    with wave.open(str(wav), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes((signal * 32767).astype(np.int16).tobytes())

    clip = folder / "take.mp4"
    proc = subprocess.run([
        ffmpeg_exe(), "-hide_banner", "-nostdin", "-loglevel", "error", "-y",
        "-f", "lavfi", "-i", "testsrc2=size=480x270:rate=30:duration=7",
        "-i", str(wav), "-c:v", "libx264", "-preset", "veryfast", "-crf", "28",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-shortest", str(clip),
    ], capture_output=True)
    assert proc.returncode == 0, proc.stderr.decode()[-800:]

    srt = folder / "take.srt"
    srt.write_text(
        "1\n00:00:00,400 --> 00:00:02,000\nWe just landed and the light is unreal.\n\n"
        "2\n00:00:03,000 --> 00:00:04,200\nCome see this street.\n\n",
        encoding="utf-8",
    )
    return {"clip": clip, "srt": srt}


def test_drop_box_builds_a_ready_to_import_folder(tmp_path: Path, drop_media):
    root = tmp_path / "Cutline"
    inbox = root / "inbox"
    inbox.mkdir(parents=True)
    clip = inbox / "take.mp4"
    clip.write_bytes(drop_media["clip"].read_bytes())
    (inbox / "take.srt").write_bytes(drop_media["srt"].read_bytes())

    state = build_from_inbox(root=root)

    assert state["status"] == "done"
    assert state["project"]
    assert state["timeline"] > 3
    assert "V1 — Program" in state["tracks"]
    assert "V3 — Captions" in state["tracks"]
    assert state["captions"] >= 1
    assert state["portable"] is True

    latest = root / "latest"
    otio = latest / "timeline.otio"
    assert otio.exists()
    assert (latest / "media").is_dir()
    assert (latest / "state.json").exists()

    timeline = adapters.read_from_file(str(otio))
    targets = []
    for track in timeline.tracks:
        for item in track:
            reference = getattr(item, "media_reference", None)
            target = getattr(reference, "target_url", "") or ""
            if target:
                targets.append(target)
                assert (latest / target).exists(), target
    assert targets


def test_drop_box_refuses_an_empty_inbox(tmp_path: Path):
    with pytest.raises(RuntimeError):
        build_from_inbox(root=tmp_path / "empty")


def test_watch_once_builds_then_reports_no_change(tmp_path: Path, drop_media):
    root = tmp_path / "Cutline"
    inbox = root / "inbox"
    inbox.mkdir(parents=True)
    (inbox / "take.mp4").write_bytes(drop_media["clip"].read_bytes())

    first = watch(root=root, once=True)
    assert first.built == 1

    second = watch(root=root, once=True)
    assert second.built == 0

    (inbox / "second.mp4").write_bytes(drop_media["clip"].read_bytes())
    third = watch(root=root, once=True)
    assert third.built == 1
    state = json.loads((root / "latest" / "state.json").read_text(encoding="utf-8"))
    assert state["clips"] >= 2 or state["timeline"] > 0
