#!/usr/bin/env python3
"""
Full-stack integration test for the Resolve Free 21.1.1 path, without Resolve.

    panel HTTP  ->  server.js  ->  request.lua mailbox  ->  bridge (LuaJIT)
                <-  Fusion.prefs  <-  bridge response      <-

Starts the mock Resolve daemon (real bridge, mock API) plus a throwaway instance
of server.js pointed at a fake Mac home, then drives the same /api/dispatch
calls the panel makes and asserts the Fusion graphs come back.

    python3 tools/e2e_sim.py               # expects lupa in the active venv
    python3 tools/e2e_sim.py --verbose
"""
import json
import os
import pathlib
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
PY = sys.executable
VERBOSE = "--verbose" in sys.argv
PORT = 3411


def free_port(start=3411, tries=40):
    for p in range(start, start + tries):
        with socket.socket() as s:
            try:
                s.bind(("127.0.0.1", p))
                return p
            except OSError:
                continue
    raise SystemExit("no free port")


def run_console_snippet(code_text):
    """Execute a generated Workspace > Console Lua snippet against the mock."""
    try:
        from lupa import luajit21 as lua_mod
    except Exception:
        from lupa import lua51 as lua_mod
    rt = lua_mod.LuaRuntime()
    mock = rt.execute((ROOT / "tools" / "mock_resolve.lua").read_text())
    mock.install()
    try:
        rt.execute(code_text)
    except Exception as exc:
        return False, f"lua error: {exc}"
    links = rt.eval("""
    (function()
      local n = 0
      for _, tl in ipairs(__mock_tbl.timelines) do
        for _, it in ipairs(tl.items or {}) do
          for _, c in ipairs(it.comps or {}) do
            n = n + #(c.links or {})
          end
        end
      end
      return n
    end)()
    """)
    if int(links) < 2:
        return False, f"only {links} graph links created"
    return True, ""


def post(path, payload):
    req = urllib.request.Request(
        f"http://127.0.0.1:{PORT}{path}",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode())


def get(path):
    with urllib.request.urlopen(f"http://127.0.0.1:{PORT}{path}", timeout=10) as r:
        return json.loads(r.read().decode())


def wait_port(port, timeout=25):
    end = time.time() + timeout
    while time.time() < end:
        with socket.socket() as s:
            if s.connect_ex(("127.0.0.1", port)) == 0:
                return True
        time.sleep(0.15)
    return False


def main():
    global PORT
    PORT = free_port()
    home = pathlib.Path(tempfile.mkdtemp(prefix="vfxkit-e2e-"))
    state_dir = home / ".vfxkit-resolve-free"
    # mirror server.js getResolvePaths() for this platform
    if sys.platform == "darwin":
        base = home / "Library/Application Support/Blackmagic Design/DaVinci Resolve"
    elif sys.platform.startswith("win"):
        base = home / "AppData/Roaming/Blackmagic Design/DaVinci Resolve/Support"
    else:
        base = home / ".local/share/DaVinciResolve"
    prefs = base / "Fusion/Profiles/Default/Fusion.prefs"
    state_dir.mkdir(parents=True, exist_ok=True)
    prefs.parent.mkdir(parents=True, exist_ok=True)

    env = dict(os.environ)
    env["VFXKIT_HOME"] = str(home)
    env["VFXKIT_STATE_DIR"] = str(state_dir)
    env["PORT"] = str(PORT)

    logs = []
    def log(msg):
        logs.append(msg)
        if VERBOSE:
            print("   " + msg)

    daemon = subprocess.Popen(
        [PY, str(ROOT / "tools/mock_resolve_daemon.py"), str(prefs), str(home), str(state_dir)],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, env=env,
    )
    server = subprocess.Popen(
        ["node", str(ROOT / "server.js")], cwd=str(ROOT), env=env,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
    )

    failures = []
    checks = []

    def check(label, fn):
        try:
            ok, detail = fn()
        except Exception as exc:
            ok, detail = False, f"raised {exc}"
        checks.append((label, ok, detail))
        if not ok:
            failures.append(f"{label}: {detail}")

    try:
        if not wait_port(PORT):
            print("FAIL  server never came up")
            return 1
        # give the bridge a moment to announce its Session pref
        session = None
        for _ in range(60):
            st = get("/api/status")
            session = st.get("bridgeSession")
            if session:
                break
            time.sleep(0.15)
        log("paths: " + json.dumps(get("/api/status")["paths"])[:220])

        check("bridge announced a session", lambda: (
            bool(session), f"no bridgeSession pref; daemon said: {logs}"))
        check("session reports Resolve 21.1.1", lambda: (
            (session or {}).get("version") == "21.1.1",
            f"version={(session or {}).get('version')!r}"))
        check("session reports the target product", lambda: (
            "Resolve" in str((session or {}).get("product", "")),
            f"product={(session or {}).get('product')!r}"))
        check("session names the open project", lambda: (
            (session or {}).get("projectName") == "Client Music Video",
            f"projectName={(session or {}).get('projectName')!r}"))

        status = get("/api/status")
        check("recipe coverage exposed", lambda: (
            status.get("recipeCoverage", {}).get("presets", 0) >= 50,
            f"coverage={status.get('recipeCoverage')}"))

        # ---- ping through the live mailbox
        res = post("/api/dispatch", {"action": "ping", "payload": {}})
        check("ping is answered by the live bridge", lambda: (
            res.get("liveBridgeConnected") is True,
            f"liveBridgeConnected={res.get('liveBridgeConnected')} reason={res.get('bridgeReason')}"))
        r = (res.get("bridgeResponse") or {}).get("result") or {}
        check("live project name", lambda: (r.get("projectName") == "Client Music Video",
                                            f"projectName={r.get('projectName')!r}"))
        check("live timeline name", lambda: (r.get("timelineName") == "Timeline 1",
                                             f"timelineName={r.get('timelineName')!r}"))
        check("ping names the clip an Apply will hit", lambda: (
            (r.get("targetClip") or {}).get("name") == "A001_C003",
            f"targetClip={r.get('targetClip')}"))
        check("ping reports the playhead frame", lambda: (
            isinstance(r.get("playheadFrame"), (int, float)), f"playheadFrame={r.get('playheadFrame')!r}"))

        # ---- apply a preset with keyframes
        res = post("/api/dispatch", {
            "action": "apply_vfx",
            "payload": {
                "presetId": "td_bandslice",
                "presetName": "Band-Split Slice Cabinet",
                "category": "Data & Print TOPs",
                "intensity": 140,
                "keyframes": [{"timeSec": 0, "value": 0}, {"timeSec": 0.6, "value": 140}],
            },
        })
        check("apply_vfx answered live", lambda: (
            res.get("liveBridgeConnected") is True,
            f"reason={res.get('bridgeReason')}"))
        result = (res.get("bridgeResponse") or {}).get("result") or {}
        node = str(result.get("fusionNode", ""))
        check("graph built: print chain", lambda: (
            "ColorCorrector" in node and "BrightnessContrast" in node, f"fusionNode={node!r}"))
        check("graph keyframed", lambda: ("BezierSpline" in node, f"fusionNode={node!r}"))
        check("graph spliced into MediaOut1", lambda: (
            "MediaOut1" in node, f"fusionNode={node!r}"))
        check("applied to a clip", lambda: (result.get("applied") is True, f"result={result}"))
        check("lua fallback mirrors the graph", lambda: (
            "ColorCorrector" in res.get("luaSnippet", ""),
            "lua snippet does not mention the recipe chain"))

        # ---- media pool + auto edit
        res = post("/api/dispatch", {"action": "get_media_pool", "payload": {}})
        clips = ((res.get("bridgeResponse") or {}).get("result") or {}).get("clips") or []
        check("media pool scanned live", lambda: (len(clips) >= 3, f"clips={len(clips)}"))

        res = post("/api/dispatch", {"action": "auto_edit_timeline", "payload": {"mode": "music_video", "bpm": 128}})
        auto = (res.get("bridgeResponse") or {}).get("result") or {}
        check("auto-editor built a timeline", lambda: (auto.get("ok") is True, f"result={auto}"))

        # ---- the copy-paste Console fallback must be runnable too
        res = post("/api/dispatch", {
            "action": "apply_vfx",
            "payload": {"presetId": "td_bandslice", "presetName": "Band-Split Slice Cabinet",
                        "category": "Data & Print TOPs", "intensity": 140},
        })
        check("console snippet for apply_vfx runs in Resolve Lua", lambda: run_console_snippet(res.get("luaSnippet", "")))

        res = post("/api/dispatch", {
            "action": "add_captions_lyrics",
            "payload": {"presetId": "redline", "style": "Redline (Var #3)", "intensity": 110,
                        "lines": [{"text": "first line", "startSec": 0.2, "endSec": 1.4},
                                  {"text": "second line", "startSec": 1.6, "endSec": 2.8}]},
        })
        check("lyric dispatch carries a text recipe", lambda: (
            (res.get("recipe") or {}).get("family") == "text", f"recipe={res.get('recipe')}"))
        check("console snippet for lyrics runs in Resolve Lua", lambda: run_console_snippet(res.get("luaSnippet", "")))
        check("lyric snippet builds TextPlus cards", lambda: (
            res.get("luaSnippet", "").count("TextPlus") >= 2, "no TextPlus in snippet"))

        # ---- capabilities endpoint
        rec = get("/api/recipes")
        check("recipes endpoint lists graphs", lambda: (rec.get("count", 0) >= 50, f"count={rec.get('count')}"))
        sample = rec.get("recipes", {}).get("td_bandslice", {})
        check("recipe has a tool chain", lambda: (
            [s["tool"] for s in sample.get("chain", [])] == ["ColorCorrector", "BrightnessContrast", "Bitmap"],
            f"chain={sample.get('chain')}"))

    finally:
        for p in (server, daemon):
            try:
                p.terminate()
                p.wait(timeout=5)
            except Exception:
                p.kill()

    for label, ok, detail in checks:
        print(("PASS  " if ok else "FAIL  ") + label + ("" if ok else "\n        - " + str(detail)))
    print()
    print(f"{len(checks) - len(failures)}/{len(checks)} end-to-end checks passed")
    shutil.rmtree(home, ignore_errors=True)
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
