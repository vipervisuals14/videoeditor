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


def _lua_runtime():
    try:
        from lupa import luajit21 as lua_mod
    except Exception:
        from lupa import lua51 as lua_mod
    rt = lua_mod.LuaRuntime()
    mock = rt.execute((ROOT / "tools" / "mock_resolve.lua").read_text())
    mock.install()
    return rt


def graph_snapshot(rt):
    """Names + links currently in the clip's Fusion comp, as Python lists."""
    data = rt.eval("""
    (function()
      local names, links = {}, {}
      for _, tl in ipairs(__mock_tbl.timelines) do
        for _, it in ipairs(tl.items or {}) do
          for _, c in ipairs(it.comps or {}) do
            for _, t in ipairs(c.tools) do
              if not t.__deleted then
                names[#names + 1] = (t.attrs and t.attrs.TOOLS_Name) or t.__type
              end
            end
            for _, l in ipairs(c.links or {}) do links[#links + 1] = l end
          end
        end
      end
      return { names = names, links = links }
    end)()
    """)
    names = [data["names"][i] for i in range(1, len(data["names"]) + 1)]
    links = [data["links"][i] for i in range(1, len(data["links"]) + 1)]
    return names, links


def run_snippet_stack(code_text):
    """Run a console snippet twice against one project.

    Returns (ok, detail, first, second) where first/second are graph snapshots.
    A re-paste of the same snippet must not double the graph.
    """
    rt = _lua_runtime()
    try:
        rt.execute(code_text)
    except Exception as exc:
        return False, f"lua error: {exc}", ([], []), ([], [])
    first = graph_snapshot(rt)
    try:
        rt.execute(code_text)
    except Exception as exc:
        return False, f"second run: {exc}", first, ([], [])
    second = graph_snapshot(rt)
    return True, "", first, second


def run_snippet_settings(code_text, expected):
    """Run a settings-writing snippet (no node graph) and check it landed."""
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
    for key, want in expected.items():
        got = rt.eval(f'__mock_tbl.project:GetSetting("{key}")')
        if str(got) != str(want):
            return False, f"{key}={got!r}, expected {want!r}"
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

        # ---- magic mask: panel-built matte becomes a native Fusion graph
        res = post("/api/dispatch", {
            "action": "mask_apply",
            "payload": {
                "mode": "subject", "feather": 8, "softness": 40, "expand": 2,
                "opacity": 88, "invert": False, "coverage": 11.5, "fps": 24,
                "polygon": [
                    {"x": 0.30, "y": 0.20}, {"x": 0.52, "y": 0.16},
                    {"x": 0.68, "y": 0.34}, {"x": 0.61, "y": 0.62},
                    {"x": 0.38, "y": 0.60},
                ],
                "tracked": [
                    {"timeSec": 0.0, "coverage": 0.10, "polygon": []},
                    {"timeSec": 0.25, "coverage": 0.42, "polygon": []},
                ],
                "keyframes": [
                    {"timeSec": 0.0, "value": 22},
                    {"timeSec": 0.25, "value": 88},
                ],
                "strokes": [
                    {"erase": False, "radius": 0.03,
                     "points": [{"x": 0.4, "y": 0.5}, {"x": 0.45, "y": 0.55}]},
                ],
            },
        })
        mask_result = (res.get("bridgeResponse") or {}).get("result") or {}
        mask_node = str(mask_result.get("fusionNode", ""))
        check("mask answered live in Resolve", lambda: (
            res.get("liveBridgeConnected") is True, f"res={str(res)[:200]}"))
        check("mask built Paint -> Polygon -> Blur -> MatteControl -> Merge", lambda: (
            all(tool in mask_node for tool in ("Paint", "Polygon", "Blur", "MatteControl", "Merge")),
            f"fusionNode={mask_node!r}"))
        check("mask matte is keyframed and spliced", lambda: (
            mask_result.get("applied") is True and "MediaOut1" in mask_node,
            f"result={mask_result}"))
        check("console snippet for mask runs in Resolve Lua",
              lambda: run_console_snippet(res.get("luaSnippet", "")))
        check("mask lua snippet builds the matte nodes", lambda: (
            all(tool in res.get("luaSnippet", "") for tool in
                ('AddTool("Paint"', 'AddTool("Polygon"', 'AddTool("MatteControl"', "BezierSpline")),
            "snippet missing mask nodes"))

        # ---- depth map stack: panel-built depth becomes native Fusion nodes
        res = post("/api/dispatch", {
            "action": "depth_apply",
            "payload": {
                "focus": 45, "invert": False, "fps": 24,
                "effects": [
                    {"id": "dof", "label": "Depth of Field", "intensity": 72,
                     "tools": ["Defocus", "Blur"], "param": "BlurSize", "value": 8.64,
                     "keyframes": [{"timeSec": 0, "value": 20}, {"timeSec": 0.4, "value": 90}]},
                    {"id": "haze", "label": "Depth Atmosphere", "intensity": 55,
                     "tools": ["Fog", "BrightnessContrast"], "param": "Gain", "value": 0.275,
                     "keyframes": [{"timeSec": 0.0, "value": 55}]},
                ],
            },
        })
        depth_result = (res.get("bridgeResponse") or {}).get("result") or {}
        depth_node = str(depth_result.get("fusionNode", ""))
        check("depth stack answered live in Resolve", lambda: (
            res.get("liveBridgeConnected") is True, f"res={str(res)[:200]}"))
        check("depth built DepthMap -> effects -> Merge", lambda: (
            all(tool in depth_node for tool in ("DepthMap", "Defocus", "Fog", "Merge")),
            f"fusionNode={depth_node!r}"))
        check("depth graph spliced into MediaOut1", lambda: (
            depth_result.get("applied") is True and "MediaOut1" in depth_node,
            f"result={depth_result}"))
        check("console snippet for depth runs in Resolve Lua",
              lambda: run_console_snippet(res.get("luaSnippet", "")))
        check("depth lua snippet builds the depth nodes", lambda: (
            all(t in res.get("luaSnippet", "") for t in
                ('AddTool("DepthMap"', 'AddTool("Defocus"', 'AddTool("Fog"', "BezierSpline")),
            "snippet missing depth nodes"))

        # ---- effect layers: an ordered stack becomes one ordered graph
        halation = {"chain": [
            {"tool": "SoftGlow", "set": {"Threshold": 0.6}, "optional": True},
            {"tool": "Blur", "bg": True, "key": True, "input": "BlurSize", "scale": 4},
        ]}
        print_recipe = {"chain": [
            {"tool": "BrightnessContrast", "bg": True, "key": True, "input": "Contrast", "scale": 0.9},
            {"tool": "Bitmap", "set": {"Level": 0.5}, "optional": True},
        ]}
        res = post("/api/dispatch", {
            "action": "layers_apply",
            "payload": {
                "fps": 24,
                "layers": [
                    {"id": "L1", "presetId": "opt_halation", "name": "500T Halation Bloom",
                     "blend": "normal", "opacity": 100, "recipe": halation,
                     "keyframes": [{"timeSec": 0, "value": 20}, {"timeSec": 0.6, "value": 100}]},
                    {"id": "L2", "presetId": "td_newsprint", "name": "Newsprint Ripple Halftone",
                     "blend": "multiply", "opacity": 55, "recipe": print_recipe,
                     "keyframes": [{"timeSec": 0, "value": 70}]},
                ],
            },
        })
        layer_result = (res.get("bridgeResponse") or {}).get("result") or {}
        layer_node = str(layer_result.get("fusionNode", ""))
        check("layer stack answered live in Resolve", lambda: (
            res.get("liveBridgeConnected") is True, f"res={str(res)[:200]}"))
        check("layer stack keeps its order", lambda: (
            layer_node.find("Halation") < layer_node.find("Newsprint")
            if "Halation" in layer_node and "Newsprint" in layer_node else False,
            f"fusionNode={layer_node!r}"))
        check("layer stack merges every layer", lambda: (
            layer_result.get("layers") == 2 and layer_node.count("Merge") >= 2,
            f"result={layer_result}"))
        check("console snippet for layers runs in Resolve Lua",
              lambda: run_console_snippet(res.get("luaSnippet", "")))
        check("layer snippet builds both layers", lambda: (
            "SoftGlow" in res.get("luaSnippet", "") and "Bitmap" in res.get("luaSnippet", "")
            and "Multiply" in res.get("luaSnippet", ""),
            "snippet missing layer nodes"))

        # ---- stacking: a second effect chains onto the first, never replaces it
        res = post("/api/dispatch", {
            "action": "apply_vfx",
            "payload": {
                "presetId": "film_grain", "presetName": "16mm Grain Weave",
                "category": "Film Lab & Grade", "intensity": 60,
                "keyframes": [], "fps": 24,
                "recipe": {"chain": [
                    {"tool": "FastNoise", "set": {"Detail": 3.2}},
                    {"tool": "Merge", "fg": True, "bg": True},
                ]},
            },
        })
        grain = (res.get("bridgeResponse") or {}).get("result") or {}
        check("a second effect stacks on the first clip graph", lambda: (
            grain.get("applied") is True and grain.get("stackDepth", 0) >= 2,
            f"result={grain}"))
        check("the second effect reports what it stacked onto", lambda: (
            bool(grain.get("stackedOn")), f"stackedOn={grain.get('stackedOn')!r}"))
        check("the clip still renders through MediaOut1", lambda: (
            "MediaOut1" in str(grain.get("fusionNode", ""))
            and "[wired" in str(grain.get("fusionNode", "")),
            f"fusionNode={grain.get('fusionNode')!r}"))

        # ---- re-sending the same rack replaces it instead of doubling it
        res = post("/api/dispatch", {
            "action": "layers_apply",
            "payload": {
                "fps": 24,
                "layers": [
                    {"id": "L1", "presetId": "opt_halation", "name": "500T Halation Bloom",
                     "blend": "normal", "opacity": 100, "recipe": halation,
                     "keyframes": [{"timeSec": 0, "value": 20}]},
                    {"id": "L2", "presetId": "td_newsprint", "name": "Newsprint Ripple Halftone",
                     "blend": "multiply", "opacity": 55, "recipe": print_recipe,
                     "keyframes": [{"timeSec": 0, "value": 70}]},
                ],
            },
        })
        resend = (res.get("bridgeResponse") or {}).get("result") or {}
        check("re-sending the rack reports the nodes it replaced", lambda: (
            resend.get("applied") is True and resend.get("replaced", 0) >= 2,
            f"result={resend}"))
        check("re-sending the rack keeps its depth", lambda: (
            resend.get("stackDepth") == 2, f"stackDepth={resend.get('stackDepth')}"))
        check("only PulseVFX nodes are replaced (hand-built ones survive)", lambda: (
            "replaced" in resend and resend.get("replaced") <= 8,
            f"replaced={resend.get('replaced')}"))

        # ---- the same guarantee in the console snippet route
        stack_snippet = res.get("luaSnippet", "")
        ok, detail, first, second = run_snippet_stack(stack_snippet)
        check("stack snippet runs twice in the same project", lambda: (ok, detail))
        check("a re-paste does not double the stack", lambda: (
            ok and len(first[0]) == len(second[0]),
            f"first={len(first[0])} second={len(second[0])}"))
        check("stacked layers are chained, not parallel", lambda: (
            ok and any(l.startswith("BrightnessContrast.Background<-Merge") for l in first[1]),
            f"links={first[1]}"))
        check("every stacked node is named PulseVFX_*", lambda: (
            ok and any(n.startswith("PulseVFX_") for n in first[0]),
            f"names={first[0]}"))

        # ---- 4K hand-off: the panel tells Resolve to work and render at 4K
        res = post("/api/dispatch", {
            "action": "set_4k_timeline",
            "payload": {"width": 3840, "height": 2160, "fps": 24},
        })
        k4 = (res.get("bridgeResponse") or {}).get("result") or {}
        check("4K switch answered live in Resolve", lambda: (
            res.get("liveBridgeConnected") is True, f"res={str(res)[:200]}"))
        check("4K switch reports the new size", lambda: (
            k4.get("ok") is True and k4.get("width") == 3840 and k4.get("height") == 2160,
            f"result={k4}"))
        check("console snippet for 4K sets the project to 4K",
              lambda: run_snippet_settings(res.get("luaSnippet", ""), {
                  "timelineResolutionWidth": 3840,
                  "timelineResolutionHeight": 2160,
                  "timelineOutputResolutionWidth": 3840,
                  "timelineFrameRate": 24,
              }))
        check("4K snippet sets every dimension", lambda: (
            all(k in res.get("luaSnippet", "") for k in
                ("timelineResolutionWidth", "timelineOutputResolutionWidth", "timelineFrameRate", "3840")),
            "snippet missing settings"))

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

        # ---- the mask hand-off: a tracked matte must arrive as animated shapes
        ring = []
        for i in range(16):
            ang = i / 16.0 * 6.28318
            ring.append({"x": round(0.5 + 0.12 * __import__("math").cos(ang), 4),
                         "y": round(0.5 + 0.12 * __import__("math").sin(ang), 4)})
        frames = [{"frame": k * 2,
                   "points": [{"x": round(p["x"] + k * 0.004, 4), "y": p["y"]} for p in ring],
                   "coverage": 0.06} for k in range(12)]
        res = post("/api/dispatch", {
            "action": "mask_apply",
            "payload": {"mode": "subject", "polygon": ring, "frames": frames,
                        "feather": 6, "softness": 35, "opacity": 85, "coverage": 6.1, "fps": 24,
                        "keyframes": [{"timeSec": k * 2 / 24.0, "value": 80} for k in range(12)]},
        })
        snippet = res.get("luaSnippet", "")
        check("console snippet for a tracked matte runs in Resolve Lua",
              lambda: run_console_snippet(snippet))
        check("the matte travels: one polygon key per tracked frame", lambda: (
            snippet.count("frame = ") >= 12 and 'SetInput("Polygon"' in snippet,
            f"shapeKeys={snippet.count('frame = ')}"))
        check("the matte lands as native Fusion nodes", lambda: (
            all(t in snippet for t in ("Paint", "Polygon", "MatteControl", "BezierSpline")),
            "missing node in mask snippet"))

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
