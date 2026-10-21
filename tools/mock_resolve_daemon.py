#!/usr/bin/env python3
"""
Runs resolve-bridge/VFXKit_ResolveFree_Bridge.lua as a resident "Resolve"
process for end-to-end testing.

The real bridge is executed unmodified inside LuaJIT 2.1 against the mock
Resolve/Fusion API, and fusion:SavePrefs is backed by a real Fusion.prefs file
on disk — exactly the channel the Node server watches. That makes it possible
to test panel -> server -> mailbox -> bridge -> prefs -> panel without a Mac or
a Resolve install.

Usage:
    python3 tools/mock_resolve_daemon.py <prefs_path> <fake_home> <state_dir>
"""
import pathlib
import sys
import time

try:
    from lupa import luajit21 as lua_mod
except Exception:                                    # pragma: no cover
    from lupa import lua51 as lua_mod

ROOT = pathlib.Path(__file__).resolve().parent.parent
MOCK = ROOT / "tools" / "mock_resolve.lua"
BRIDGE = ROOT / "resolve-bridge" / "VFXKit_ResolveFree_Bridge.lua"


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        return 2
    prefs_path, fake_home, state_dir = sys.argv[1:4]
    pathlib.Path(prefs_path).parent.mkdir(parents=True, exist_ok=True)
    pathlib.Path(state_dir).mkdir(parents=True, exist_ok=True)

    rt = lua_mod.LuaRuntime()
    mock = rt.execute(MOCK.read_text(encoding="utf-8"))
    mock.install()
    mock.prefs_path = prefs_path
    mock.profile_base = fake_home
    mock.fileexists_hook = lambda p: pathlib.Path(str(p)).exists()
    mock.wait_hook = lambda _s: time.sleep(0.01)

    print("mock resolve: prefs=%s state=%s" % (prefs_path, state_dir), flush=True)
    try:
        rt.execute(BRIDGE.read_text(encoding="utf-8"))
    except Exception as exc:                         # pragma: no cover
        print("bridge exited: %s" % exc, file=sys.stderr, flush=True)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
