from __future__ import annotations

import argparse
import shutil
import sys
import threading
import time
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
