from __future__ import annotations

import argparse
import shutil
import sys
import threading
import time
from pathlib import Path
import webbrowser


def _print_banner(url: str) -> None:
    line = "─" * 58
    print(f"\n{line}")
    print("  CUTLINE — first cuts for DaVinci Resolve")
    print(f"{line}")
    print(f"  Studio:  {url}")
    print("  Stop:    Ctrl+C")
    print(f"{line}\n")


def _open_browser_when_ready(url: str, timeout: float = 25.0) -> None:
    import urllib.request

    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"{url}/api/health", timeout=1.5) as response:
                if response.status == 200:
                    webbrowser.open(url)
                    return
        except Exception:
            time.sleep(0.4)


def command_serve(args: argparse.Namespace) -> int:
    import uvicorn

    from .settings import HOST, PORT, ensure_dirs

    ensure_dirs()
    host = args.host or HOST
    port = int(args.port or PORT)
    display_host = "127.0.0.1" if host in ("0.0.0.0", "::") else host
    url = f"http://{display_host}:{port}"
    _print_banner(url)
    if not args.no_browser:
        threading.Thread(target=_open_browser_when_ready, args=(url,), daemon=True).start()
    uvicorn.run(
        "cutline.app:app",
        host=host,
        port=port,
        log_level="warning" if not args.verbose else "info",
        access_log=bool(args.verbose),
    )
    return 0


def command_demo(args: argparse.Namespace) -> int:
    from .demo import ensure_demo

    print("Rendering the demo footage (one time, ~15 seconds)…")
    demo = ensure_demo(force=args.force)
    print("\nDemo media:")
    for key, value in demo.items():
        print(f"  {key:<15} {value}")
    print("\nOpen Cutline and press “Add demo footage”.")
    return 0


def command_doctor(args: argparse.Namespace) -> int:
    from .ffmpeg import ffmpeg_exe, ffmpeg_version
    from .settings import DATA_DIR, ensure_dirs
    from .styles import FONT_LIBRARY
    from .transcribe import capabilities

    ensure_dirs()
    ok = True
    print("\nCutline doctor")
    print("─" * 58)
    print(f"Python          {sys.version.split()[0]}")
    print(f"Data folder     {DATA_DIR}")
    try:
        print(f"FFmpeg          {ffmpeg_version()}")
        print(f"FFmpeg binary   {ffmpeg_exe()}")
    except Exception as exc:
        ok = False
        print(f"FFmpeg          MISSING ({exc})")
    try:
        from PIL import features

        print(f"Pillow          OK (raqm={features.check('raqm')})")
    except Exception as exc:
        ok = False
        print(f"Pillow          MISSING ({exc})")
    try:
        import opentimelineio as otio

        print(f"OpenTimelineIO  {otio.__version__}")
    except Exception as exc:
        ok = False
        print(f"OpenTimelineIO  MISSING ({exc})")
    missing_fonts = []
    from .settings import FONTS_DIR

    for name, info in FONT_LIBRARY.items():
        for weight, filename in info["weights"].items():
            if not (FONTS_DIR / filename).exists():
                missing_fonts.append(filename)
    if missing_fonts:
        ok = False
        print(f"Fonts           MISSING {', '.join(missing_fonts)}")
    else:
        print("Fonts           all bundled families present")
    asr = capabilities()
    print(f"Speech model    {'ready' if asr['available'] else 'not installed (optional — upload SRT instead)'}")
    try:
        import uvicorn

        print(f"Web engine      FastAPI + uvicorn {uvicorn.__version__}")
    except Exception as exc:
        ok = False
        print(f"Web engine      MISSING ({exc})")
    print("─" * 58)
    print("All good. Run `cutline serve`." if ok else "Fix the items above, then run the doctor again.")
    print()
    return 0 if ok else 1


def command_kit(args: argparse.Namespace) -> int:
    from .kit import build_kit
    from .settings import PROJECTS_DIR
    from .store import ProjectStore

    store = ProjectStore(PROJECTS_DIR)
    project_id = args.project
    if not project_id:
        projects = sorted(store.list(), key=lambda item: item.get("updated") or "", reverse=True)
        ready = [item for item in projects if item.get("status") == "done"]
        if not ready:
            print("No finished cuts yet. Build one in the studio first.")
            return 1
        project_id = ready[0]["id"]
        print(f"Using the most recent cut: {ready[0].get('name') or project_id}")
    if not store.exists(project_id):
        print(f"No project with id {project_id}.")
        return 1
    try:
        result = build_kit(store, project_id, dst_dir=args.out)
    except FileNotFoundError as exc:
        print(str(exc))
        return 1
    data = result.summary()
    print("─" * 58)
    print(f"  Test kit:  {data['zip']}")
    print(f"  Size:      {data['bytes'] / 1e6:.1f} MB")
    print(f"  Media:     {data['copied']} copied, {data['linked']} linked, {data['missing'] or 'nothing'} missing")
    print("─" * 58)
    print("  Unzip it, then File → Import → Timeline in Resolve.")
    if not result.portable:
        print("  Some media was too large to copy and stayed linked — see READ-ME-FIRST.md.")
    return 0


def _bridge_root(args: argparse.Namespace):
    from .resolve_bridge import default_root

    return args.root or str(default_root())


def command_resolve_install(args: argparse.Namespace) -> int:
    from .resolve_bridge import install_scripts

    try:
        result = install_scripts(root=_bridge_root(args), target=args.scripts_dir)
    except OSError as exc:
        print(f"Could not write the Resolve scripts folder: {exc}")
        return 1
    line = "─" * 62
    print(line)
    print("  Cutline is now in Resolve's Scripts menu")
    print(line)
    print(f"  Scripts:  {result['folder']}")
    print(f"  Drop box: {result['root']}/inbox")
    print(f"  Import:   {result['otio']}")
    print(line)
    print("  In Resolve, open Workspace → Scripts →")
    print("    Cutline - import latest     pulls the newest cut into the project")
    print("    Cutline - check bridge      proves the menu entry can talk to Resolve")
    print()
    print("  Now keep the engine running so cuts are waiting when you look:")
    print("    cutline resolve-watch")
    print("  …or install it as a login item that keeps running in the background:")
    print("    cutline resolve-agent")
    print()
    print("  Drop footage into the inbox folder; each change builds a cut and")
    print("  publishes it to latest/. The menu entry imports whatever is there.")
    print()
    print("  Known limit: on Resolve 21.1 Free, menu scripts run but the project")
    print("  API is gated to Studio, so the menu item can do nothing. The cut is")
    print("  still built; import it with File → Import → Timeline.")
    print("  File → Import → Timeline works on every edition and version.")
    if not result.get("folder_existed", True):
        print()
        print("  That folder did not exist yet, which usually means Resolve has never")
        print("  been launched on this account. Open Resolve once, quit it, and run")
        print("  this command again so the entries are certainly in the right place.")
    if not args.quiet:
        print()
        print("  Resolve only reads the Scripts folder at launch — restart it once.")
    return 0


def command_resolve_watch(args: argparse.Namespace) -> int:
    from .resolve_bridge import watch

    root = _bridge_root(args)

    def report(result: dict) -> None:
        print(f"  built: {result.get('name')}  ·  {result.get('timeline')}s  ·  "
              f"{len(result.get('tracks') or [])} tracks  ·  {result.get('captions')} captions")

    print("Cutline is watching the drop box. Ctrl+C to stop.")
    print(f"  inbox: {root}/inbox")
    print("  In Resolve: Workspace → Scripts → Cutline - import latest")
    try:
        state = watch(root=root, once=args.once, interval=args.interval, on_build=report)
    except KeyboardInterrupt:
        print("\nStopped.")
        return 0
    if args.once:
        if state.errors:
            for error in state.errors:
                print(f"  {error}")
            return 1
        print("Nothing to build (inbox empty or unchanged)." if not state.built else "Done.")
    return 0


def command_resolve_build(args: argparse.Namespace) -> int:
    from .resolve_bridge import build_from_inbox

    try:
        state = build_from_inbox(root=_bridge_root(args))
    except Exception as exc:
        print(f"Build failed: {exc}")
        return 1
    print(f"Built {state['name']} — {state['timeline']}s, {len(state['tracks'])} tracks")
    for track in state["tracks"]:
        print(f"  {track}")
    print(f"Waiting in {_bridge_root(args)}/latest/timeline.otio")
    print("Import it from Resolve: Workspace → Scripts → Cutline - import latest")
    return 0


def command_resolve_status(args: argparse.Namespace) -> int:
    from .resolve_bridge import (
        agent_running,
        inbox_signature,
        last_built_signature,
        latest_state,
        load_watch_config,
    )

    root = Path(_bridge_root(args))
    state = latest_state(root)
    config = load_watch_config(root)
    inbox = root / "inbox"
    pending = inbox_signature(inbox) != last_built_signature(root)
    line = "─" * 62
    print(line)
    print("  Cutline drop box")
    print(line)
    print(f"  Root:    {root}")
    count = sum(1 for path in inbox.glob("*") if path.is_file()) if inbox.exists() else 0
    print(f"  Inbox:   {count} file(s){'  ·  waiting to build' if pending and count else ''}")
    if not state:
        print("  Latest:  nothing built yet — drop footage in the inbox")
        print(line)
        return 1
    print(f"  Latest:  {state.get('name')}")
    print(f"  Built:   {state.get('built')}")
    print(f"  Cut:     {state.get('timeline')}s · {state.get('clips')} clips · "
          f"{state.get('captions')} captions · {state.get('transitions')} transitions")
    tracks = state.get("tracks") or []
    if tracks:
        print(f"  Tracks:  {', '.join(tracks)}")
    if state.get("portable") is False:
        print("  Media:   some originals stayed linked — keep them online for import")
    look = (config.get("vlog") or {}).get("look") if config.get("mode") == "vlog" else None
    print(f"  Config:  {root / 'config.json'}  (mode: {config.get('mode')}"
          + (f", look: {look}" if look else "") + ")")
    if __import__("sys").platform == "darwin":
        print(f"  Watcher: {'running' if agent_running() else 'not running (cutline resolve-agent)'}")
    for warning in (state.get("warnings") or [])[:4]:
        print(f"  note:    {warning}")
    for error in state.get("errors") or []:
        print(f"  error:   {error}")
    print(line)
    print("  Import: Workspace → Scripts → Cutline - import latest")
    return 0


def command_resolve_agent(args: argparse.Namespace) -> int:
    from .resolve_bridge import load_agent, render_agent, write_agent

    if __import__("sys").platform != "darwin" and not args.print_only:
        print("The login item is macOS-only. On Windows or Linux, keep the watcher")
        print("running yourself:  cutline resolve-watch")
        return 1

    root = _bridge_root(args)
    if args.print_only:
        print(render_agent(Path(root)))
        return 0
    try:
        path = write_agent(Path(root))
    except OSError as exc:
        print(f"Could not write the login item: {exc}")
        return 1
    print(f"Login item written: {path}")
    if args.no_load:
        print("Load it when you want:")
        print(f"  launchctl load {path}")
    else:
        ok, message = load_agent(path)
        print(message)
        if ok:
            print("The watcher is running now and starts again at every login.")
        else:
            print("Load it by hand:")
            print(f"  launchctl load {path}")
    print("Stop it:")
    print(f"  launchctl unload {path}")
    return 0


def command_clean(args: argparse.Namespace) -> int:
    from .settings import DATA_DIR, PROJECTS_DIR, DEMO_DIR

    targets = []
    if args.uploads:
        targets.append(DATA_DIR / "uploads")
    if args.demo:
        targets.append(DEMO_DIR)
    if args.all:
        targets = [PROJECTS_DIR, DATA_DIR / "uploads", DEMO_DIR]
    freed = 0
    for target in targets:
        if not target.exists():
            continue
        for path in target.rglob("*"):
            if path.is_file():
                freed += path.stat().st_size
        shutil.rmtree(target, ignore_errors=True)
    print(f"Removed {len(targets)} folder(s), about {freed / 1e6:.1f} MB.")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="cutline",
        description="Cutline — silence cuts, captions, titles, and beat-synced edits for DaVinci Resolve.",
    )
    sub = parser.add_subparsers(dest="command")

    serve = sub.add_parser("serve", help="Start the Cutline studio (default)")
    serve.add_argument("--port", type=int, default=None)
    serve.add_argument("--host", type=str, default=None)
    serve.add_argument("--no-browser", action="store_true", help="Do not open a browser window")
    serve.add_argument("--verbose", action="store_true", help="Print request logs")
    serve.set_defaults(func=command_serve)

    demo = sub.add_parser("demo", help="Generate the local demo footage")
    demo.add_argument("--force", action="store_true", help="Rebuild the demo even if it exists")
    demo.set_defaults(func=command_demo)

    doctor = sub.add_parser("doctor", help="Check the local install")
    doctor.set_defaults(func=command_doctor)

    kit = sub.add_parser("kit", help="Package a cut for a Resolve import on another machine")
    kit.add_argument("project", nargs="?", help="Project id (defaults to the newest finished cut)")
    kit.add_argument("--out", type=str, default=None, help="Folder to write the kit into")
    kit.set_defaults(func=command_kit)

    install = sub.add_parser("resolve-install", help="Add Cutline to Resolve's Workspace > Scripts menu")
    install.add_argument("--root", type=str, default=None, help="Drop-box folder (default ~/Movies/Cutline)")
    install.add_argument("--scripts-dir", type=str, default=None, help="Override the Resolve scripts folder")
    install.add_argument("--quiet", action="store_true", help="Skip the restart reminder")
    install.set_defaults(func=command_resolve_install)

    watch_cmd = sub.add_parser("resolve-watch", help="Watch the drop box and rebuild on every change")
    watch_cmd.add_argument("--root", type=str, default=None, help="Drop-box folder (default ~/Movies/Cutline)")
    watch_cmd.add_argument("--once", action="store_true", help="Build once if the inbox changed, then exit")
    watch_cmd.add_argument("--interval", type=float, default=3.0, help="Seconds between checks")
    watch_cmd.set_defaults(func=command_resolve_watch)

    build_cmd = sub.add_parser("resolve-build", help="Build the drop box once, right now")
    build_cmd.add_argument("--root", type=str, default=None, help="Drop-box folder (default ~/Movies/Cutline)")
    build_cmd.set_defaults(func=command_resolve_build)

    status = sub.add_parser("resolve-status", help="Show the last drop-box build")
    status.add_argument("--root", type=str, default=None, help="Drop-box folder (default ~/Movies/Cutline)")
    status.set_defaults(func=command_resolve_status)

    agent = sub.add_parser("resolve-agent", help="Install the macOS login item for the watcher")
    agent.add_argument("--root", type=str, default=None, help="Drop-box folder (default ~/Movies/Cutline)")
    agent.add_argument("--print", dest="print_only", action="store_true", help="Print the plist instead of writing it")
    agent.add_argument("--no-load", action="store_true", help="Write the login item but do not start it now")
    agent.set_defaults(func=command_resolve_agent)

    clean = sub.add_parser("clean", help="Remove generated files")
    clean.add_argument("--uploads", action="store_true", help="Delete uploaded media copies")
    clean.add_argument("--demo", action="store_true", help="Delete the generated demo footage")
    clean.add_argument("--all", action="store_true", help="Delete projects, uploads and demo media")
    clean.set_defaults(func=command_clean)

    args = parser.parse_args(argv)
    if not getattr(args, "func", None):
        args = parser.parse_args(["serve"] + (argv or []))
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
