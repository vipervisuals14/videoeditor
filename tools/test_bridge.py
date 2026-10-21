#!/usr/bin/env python3
"""
End-to-end harness for resolve-bridge/VFXKit_ResolveFree_Bridge.lua.

Runs the *real* bridge file, unmodified, inside LuaJIT 2.1 (the VM Resolve Free
21.1.1 embeds) against a mock Resolve/Fusion API that mimics the Free sandbox
(no io, no os.execute, no require).

It drives the actual mailbox protocol: writes ~/.vfxkit-resolve-free/request.lua,
lets the bridge pick it up, and decodes the hex payload the bridge writes back
through fusion:SetPrefs("Global.VFXKitBridge.Response", ...).

Usage:
    python3 tools/test_bridge.py            # run every scenario
    python3 tools/test_bridge.py --verbose
"""
import json
import os
import pathlib
import shutil
import sys
import tempfile

try:
    from lupa import luajit21 as lua_mod
except Exception:                                    # pragma: no cover
    try:
        from lupa import lua51 as lua_mod
    except Exception:
        lua_mod = None

ROOT = pathlib.Path(__file__).resolve().parent.parent
BRIDGE = ROOT / "resolve-bridge" / "VFXKit_ResolveFree_Bridge.lua"
RECIPES = ROOT / "resolve-bridge" / "preset-recipes.json"
MOCK = ROOT / "tools" / "mock_resolve.lua"

VERBOSE = "--verbose" in sys.argv


def lua_quote(s):
    return '"' + str(s).replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'


def js_to_lua(value):
    if value is None:
        return "nil"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, str):
        return lua_quote(value)
    if isinstance(value, (list, tuple)):
        return "{ " + ", ".join(js_to_lua(v) for v in value) + " }"
    if isinstance(value, dict):
        return "{ " + ", ".join(f"[{lua_quote(k)}] = {js_to_lua(v)}" for k, v in value.items()) + " }"
    return "nil"


class Harness:
    def __init__(self):
        if lua_mod is None:
            raise SystemExit("lupa is required:  python3 -m venv /tmp/luaenv && /tmp/luaenv/bin/pip install lupa")
        # Mimic the real layout: <home>/.vfxkit-resolve-free next to
        # <home>/Library/Application Support/Blackmagic Design/...
        self.home = pathlib.Path(tempfile.mkdtemp(prefix="vfxkit-home-"))
        self.state_dir = self.home / ".vfxkit-resolve-free"
        self.state_dir.mkdir(parents=True, exist_ok=True)
        os.environ["VFXKIT_STATE_DIR"] = str(self.state_dir)
        self.req_path = self.state_dir / "request.lua"
        self.queue = []
        self.current = None
        self.waits = 0
        self.rt = None
        self.bridge_error = None
        self.forced_stop = False
        self.mock = None

    # ---------------------------------------------------------------- mailbox
    def _write_request(self, cmd):
        self.req_path.write_text(
            "return { id = %s, op = %s, ts = 0, args = %s }\n"
            % (lua_quote(cmd["id"]), lua_quote(cmd["op"]), js_to_lua(cmd.get("args", {}))),
            encoding="utf-8",
        )

    def _answered(self):
        """True once the bridge has written a Response for the in-flight id."""
        if self.rt is None:
            return False
        try:
            return str(self.rt.eval("_G.__mock_tbl.last_resp_id or ''")) == self.current["id"]
        except Exception:
            return False

    MAX_WAITS = 4000

    def _wait_hook(self, _seconds):
        self.waits += 1
        if self.waits > self.MAX_WAITS:
            # hard stop so a stuck handshake fails the test instead of hanging
            self.forced_stop = True
            self.current = {"id": "forced_stop", "op": "stop", "args": {}}
            self.queue = []
            self._write_request(self.current)
            return
        # The real server is serial: it writes one request, waits for the
        # matching response, then writes the next. Never overwrite a request
        # the bridge has not answered yet.
        if self.current is None:
            if not self.queue:
                return
            self.current = self.queue.pop(0)
            self._write_request(self.current)
            return
        if not self._answered():
            return
        if self.queue:
            self.current = self.queue.pop(0)
        else:
            self.current = {"id": "stop_1", "op": "stop", "args": {}}
            self.queue = []
        self._write_request(self.current)

    def _fileexists_hook(self, path):
        return pathlib.Path(str(path)).exists()

    # ------------------------------------------------------------------- run
    def run(self, commands, kill_os=False, save_prefs_fails=0, forbid=()):
        self.queue = list(commands)
        self.waits = 0
        rt = lua_mod.LuaRuntime(unpack_returned_tuples=True)
        self.rt = rt
        mock = rt.execute(MOCK.read_text(encoding="utf-8"))
        self.mock = mock
        mock.install()
        mock.profile_base = str(self.home)
        mock.force_stop_after = self.MAX_WAITS
        mock.wait_hook = self._wait_hook
        mock.fileexists_hook = self._fileexists_hook
        if save_prefs_fails:
            mock.fail_save_prefs_times = save_prefs_fails
        if forbid:
            rt.execute("local f = {} for _, n in ipairs({%s}) do f[n] = true end _G.MOCK_FORBID = f"
                       % ", ".join(js_to_lua(x) for x in forbid))
            rt.execute("local cap = rawget(_G, 'MOCK_CAPS') or {} _G.MOCK_CAPS = cap")
        if kill_os:
            # Resolve Free 21.1.1 has been observed with parts of `os` stripped;
            # the bridge must survive even if the whole table is missing.
            rt.execute("os = nil collectgarbage()")
        try:
            rt.execute(BRIDGE.read_text(encoding="utf-8"))
        except Exception as exc:                     # Lua runtime error
            self.bridge_error = str(exc)
        return rt

    def response(self, rt):
        prefs = rt.globals().fusion and None
        raw = rt.eval('_G.__prefs_response')
        return raw

    def decode_all(self, rt):
        """Every response payload the bridge wrote, decoded from its hex form."""
        out = []
        raw_list = rt.eval("_G.__mock_responses")
        if raw_list is None:
            return out
        for i in range(1, len(raw_list) + 1):
            encoded = raw_list[i]
            if not encoded:
                continue
            colon = str(encoded).find(":")
            if colon == -1:
                continue
            try:
                payload = bytes.fromhex(str(encoded)[colon + 1:]).decode("utf-8")
                out.append(json.loads(payload))
            except Exception:
                continue
        return out

    def decode(self, rt, req_id=None):
        responses = self.decode_all(rt)
        if not responses:
            return None
        if req_id is None:
            return responses[0]
        for r in responses:
            if r.get("id") == req_id:
                return r
        return None


def scenario(name, commands, checks, **run_opts):
    h = Harness()
    rt = h.run(commands, **run_opts)
    errors = []
    if h.bridge_error:
        errors.append("Lua error: " + h.bridge_error)
    if h.forced_stop or rt.eval("_G.__mock_tbl.forced_stop") is True:
        errors.append("bridge never answered within %d polls (harness forced a stop)" % h.MAX_WAITS)
    for label, fn in checks:
        try:
            ok, detail = fn(rt, h)
            if not ok:
                errors.append(f"{label}: {detail}")
        except Exception as exc:
            errors.append(f"{label}: raised {exc}")
    status = "PASS" if not errors else "FAIL"
    print(f"{status}  {name}")
    if errors:
        for e in errors:
            print("        - " + e)
    if VERBOSE and not errors:
        print("        waits:", h.waits)
    shutil.rmtree(h.home, ignore_errors=True)
    return not errors


# --------------------------------------------------------------------- checks
def chk_response(field, expected=None, req_id=None):
    def _fn(rt, h):
        data = h.decode(rt, req_id)
        if data is None:
            return False, "no Response pref written by the bridge"
        if field not in data:
            return False, f"missing '{field}' in {json.dumps(data)[:200]}"
        if expected is not None and data[field] != expected:
            return False, f"{field}={data[field]!r}, expected {expected!r}"
        return True, ""
    return ("response." + field, _fn)


def chk_nested(*path, expected=None, req_id=None):
    def _fn(rt, h):
        data = h.decode(rt, req_id)
        if data is None:
            return False, "no Response pref written"
        cur = data
        for key in path:
            if not isinstance(cur, dict) or key not in cur:
                return False, f"missing {'.'.join(map(str, path))} in {json.dumps(data)[:220]}"
            cur = cur[key]
        if expected is not None and cur != expected:
            return False, f"{'.'.join(map(str, path))}={cur!r}, expected {expected!r}"
        return True, ""
    return ("nested." + ".".join(map(str, path)), _fn)


def _calls(rt):
    """Lua sequence tables iterate as keys in lupa, so index them explicitly."""
    n = int(rt.eval("#(_G.__mock_calls or {})"))
    return [str(rt.eval(f"_G.__mock_calls[{i}]")) for i in range(1, n + 1)]


def chk_calls(predicate, label):
    def _fn(rt, h):
        calls = _calls(rt)
        if not any(predicate(c) for c in calls):
            joined = "\n".join(calls[-25:])
            return False, f"{label} not observed. last calls:\n{joined}"
        return True, ""
    return ("calls." + label, _fn)


def chk_no_error(rt, h, req_id=None):
    data = h.decode(rt, req_id)
    if data is None:
        return False, "no Response pref written"
    if data.get("error"):
        return False, "bridge reported error: " + str(data["error"])[:300]
    return True, ""


def chk_error_contains(needle, req_id=None):
    def _fn(rt, h):
        data = h.decode(rt, req_id)
        if data is None:
            return False, "no Response pref written"
        err = str(data.get("error", ""))
        if needle not in err:
            return False, f"error {err!r} does not mention {needle!r}"
        return True, ""
    return ("error_contains." + needle, _fn)




def _has_call(rt, needle):
    calls = _calls(rt)
    for c in calls:
        if needle in c:
            return True, ""
    return False, f"no call containing {needle!r}; last: " + " | ".join(calls[-12:])


def _bin_tree(rt, h):
    data = h.decode(rt, "mp1")
    if data is None:
        return False, "no response for mp1"
    clips = data.get("result", {}).get("clips", [])
    bins = sorted({c.get("bin") for c in clips})
    if not any(b.endswith("/B-Roll") for b in bins):
        return False, "nested bin not surfaced: " + repr(bins)
    return True, ""




def _call_order(rt, tools):
    calls = _calls(rt)
    idx = []
    for tool in tools:
        try:
            idx.append(next(i for i, c in enumerate(calls) if c == "comp:AddTool " + tool))
        except StopIteration:
            return False, f"{tool} was never added; calls: " + " | ".join(calls)
    if idx != sorted(idx):
        return False, f"nodes created out of order: {list(zip(tools, idx))}"
    return True, ""


def _graph_links(rt):
    """Return (links, connections into MediaOut) across every mock comp."""
    lua = """
    (function()
      local n, outs = 0, 0
      for _, tl in ipairs(__mock_tbl.timelines) do
        for _, it in ipairs(tl.items or {}) do
          for _, c in ipairs(it.comps or {}) do
            for _, l in ipairs(c.links or {}) do
              n = n + 1
              if l:find("MediaOut", 1, true) then outs = outs + 1 end
            end
          end
        end
      end
      return { n = n, outs = outs }
    end)()
    """
    t = rt.eval(lua)
    return int(t["n"]), int(t["outs"])


def _wired_report(rt, h, req_id):
    data = h.decode(rt, req_id)
    if data is None:
        return False, f"no response for {req_id}"
    node = str((data.get("result") or {}).get("fusionNode", ""))
    if "MediaOut1" not in node:
        return False, f"fusionNode {node!r} was never spliced into MediaOut1"
    links, outs = _graph_links(rt)
    if links < 2 or outs < 1:
        return False, f"graph links={links} mediaOut={outs}"
    return True, ""


def _node_report(rt, h, req_id, expected, must_skip=None):
    data = h.decode(rt, req_id)
    if data is None:
        return False, f"no response for {req_id}"
    node = str((data.get("result") or {}).get("fusionNode", ""))
    for tool in expected:
        if tool not in node:
            return False, f"fusionNode {node!r} missing {tool}"
    if must_skip and must_skip not in node:
        return False, f"fusionNode {node!r} does not mention skipped {must_skip}"
    return True, ""


# ------------------------------------------------------------------ scenarios
def main():
    if not BRIDGE.exists():
        raise SystemExit(f"bridge not found: {BRIDGE}")

    results = []

    results.append(scenario(
        "ping → project state",
        [{"id": "r1", "op": "ping"}],
        [
            chk_response("ok", True),
            chk_response("id", "r1"),
            chk_nested("result", "projectName", expected="Client Music Video"),
            chk_nested("result", "fps", expected="24"),
            chk_nested("result", "timelineName", expected="Timeline 1"),
            ("no_error", chk_no_error),
        ],
    ))

    results.append(scenario(
        "unknown op reports an error, does not crash",
        [{"id": "r2", "op": "does_not_exist"}],
        [
            chk_response("ok", False),
            chk_error_contains("Unknown operation"),
        ],
    ))


    results.append(scenario(
        "get_media_pool → scans bins recursively",
        [{"id": "mp1", "op": "get_media_pool"}],
        [
            chk_response("ok", True),
            chk_nested("result", "total", expected=3),
            ("bin tree", lambda rt, h: _bin_tree(rt, h)),
        ],
    ))

    results.append(scenario(
        "apply_vfx → fusion comp, node chain, marker, keyframes",
        [{
            "id": "ap1", "op": "apply_vfx",
            "args": {
                "presetName": "Band-Split Slice Cabinet",
                "category": "Data & Print TOPs",
                "intensity": 140,
                "keyframes": [
                    {"timeSec": 0.0, "value": 0},
                    {"timeSec": 0.75, "value": 140},
                    {"timeSec": 1.5, "value": 40},
                ],
            },
        }],
        [
            chk_response("ok", True),
            chk_nested("result", "applied", expected=True),
            ("calls.comp", lambda rt, h: _has_call(rt, "item:AddFusionComp")),
            ("calls.node", lambda rt, h: _has_call(rt, "comp:AddTool")),
            ("calls.spline", lambda rt, h: _has_call(rt, "spline:SetKeyFrames 3 keys")),
            ("calls.marker", lambda rt, h: _has_call(rt, "item:AddMarker")),
        ],
    ))

    results.append(scenario(
        "auto_edit_timeline → new timeline + appended subclips + beat markers",
        [{"id": "ae1", "op": "auto_edit_timeline", "args": {"mode": "music_video", "bpm": 128}}],
        [
            chk_response("ok", True),
            chk_nested("result", "ok", expected=True),
            ("calls.timeline", lambda rt, h: _has_call(rt, "mp:CreateEmptyTimeline")),
            ("calls.append", lambda rt, h: _has_call(rt, "mp:AppendToTimeline")),
            ("calls.markers", lambda rt, h: _has_call(rt, "tl:AddMarker")),
        ],
    ))

    results.append(scenario(
        "cut_silences → new timeline from kept segments",
        [{"id": "cs1", "op": "cut_silences", "args": {"segments": [
            {"startFrame": 0, "endFrame": 48},
            {"startFrame": 120, "endFrame": 168},
        ]}}],
        [
            chk_response("ok", True),
            chk_nested("result", "ok", expected=True),
            chk_nested("result", "segmentsPlaced", expected=2),
        ],
    ))

    results.append(scenario(
        "add_captions_lyrics → marker per lyric line",
        [{"id": "ly1", "op": "add_captions_lyrics", "args": {
            "style": "Bold Kinetic Pop",
            "lines": [
                {"text": "first line", "startSec": 0.0, "endSec": 1.2},
                {"text": "second line", "startSec": 1.2, "endSec": 2.4},
            ],
        }}],
        [
            chk_response("ok", True),
            chk_nested("result", "linesAdded", expected=2),
            chk_nested("result", "style", expected="Bold Kinetic Pop"),
            # 2 cues -> 2 TextPlus cards, 2 merges, 6 opacity keys
            chk_nested("result", "lyricNodes", expected=2),
            chk_nested("result", "keyframes", expected=6),
            ("graph", lambda rt, h: _node_report(rt, h, "ly1",
                                                 ["TextPlus", "Merge"],
                                                 must_skip="BezierSpline", )),
            ("spliced", lambda rt, h: _wired_report(rt, h, "ly1")),
        ],
    ))

    results.append(scenario(
        "batch_ai_vfx → marker per cut",
        [{"id": "ai1", "op": "batch_ai_vfx", "args": {"prompt": "drill 808 shakes"}}],
        [
            chk_response("ok", True),
            chk_nested("result", "applied", expected=True),
            chk_nested("result", "clipsProcessed", expected=2),
        ],
    ))


    results.append(scenario(
        "sandbox without `os` at all",
        [
            {"id": "o1", "op": "ping"},
            {"id": "o2", "op": "auto_edit_timeline", "args": {"mode": "vlog"}},
            {"id": "o3", "op": "cut_silences", "args": {"segments": [{"startFrame": 0, "endFrame": 48}]}},
        ],
        [
            chk_nested("result", "projectName", expected="Client Music Video", req_id="o1"),
            chk_response("ok", True, req_id="o2"),
            chk_response("ok", True, req_id="o3"),
        ],
        kill_os=True,
    ))

    results.append(scenario(
        "fusion:SavePrefs fails twice before succeeding",
        [{"id": "sp1", "op": "ping"}],
        [
            chk_response("id", "sp1"),
            chk_nested("result", "projectName", expected="Client Music Video"),
        ],
        save_prefs_fails=2,
    ))

    results.append(scenario(
        "host lacks Trails / Bitmap / FastNoise nodes",
        [
            {"id": "n1", "op": "apply_vfx", "args": {"presetName": "Slit-Scan Time Machine",
                                                     "category": "Shutter & Time", "intensity": 100}},
            {"id": "n2", "op": "apply_vfx", "args": {"presetName": "Band-Split Slice Cabinet",
                                                     "category": "Data & Print TOPs", "intensity": 100}},
            {"id": "n3", "op": "apply_vfx", "args": {"presetName": "TD Simplex UV Displace TOP",
                                                     "category": "TouchDesigner TOPs", "intensity": 100}},
        ],
        [
            chk_response("ok", True, req_id="n1"),
            chk_response("ok", True, req_id="n2"),
            chk_response("ok", True, req_id="n3"),
        ],
        forbid=["Trails", "Bitmap", "FastNoise"],
    ))


    # ---------------------------------------------------------- recipe graphs
    recipes = json.loads(RECIPES.read_text(encoding="utf-8"))["recipes"]
    print_recipe = recipes["td_bandslice"]

    results.append(scenario(
        "recipe → builds the shipped print graph in order",
        [{
            "id": "rc1", "op": "apply_vfx",
            "args": {
                "presetName": "Band-Split Slice Cabinet",
                "category": "Data & Print TOPs",
                "intensity": 150,
                "recipe": print_recipe,
                "keyframes": [{"timeSec": 0, "value": 0}, {"timeSec": 0.5, "value": 150}],
            },
        }],
        [
            chk_response("ok", True),
            chk_nested("result", "applied", expected=True),
            ("order", lambda rt, h: _call_order(rt, ["ColorCorrector", "BrightnessContrast", "Bitmap"])),
            ("wiring", lambda rt, h: _has_call(rt, "comp:AddTool Bitmap")),
            ("spline", lambda rt, h: _has_call(rt, "spline:SetKeyFrames 2 keys")),
            ("report", lambda rt, h: _node_report(rt, h, "rc1", ["ColorCorrector", "BrightnessContrast", "Bitmap"])),
        ],
    ))

    results.append(scenario(
        "recipe → optional node missing is skipped, graph still applies",
        [{
            "id": "rc2", "op": "apply_vfx",
            "args": {
                "presetName": "Band-Split Slice Cabinet",
                "category": "Data & Print TOPs",
                "intensity": 100,
                "recipe": print_recipe,
            },
        }],
        [
            chk_response("ok", True, req_id="rc2"),
            ("report", lambda rt, h: _node_report(rt, h, "rc2", ["ColorCorrector", "BrightnessContrast"], must_skip="Bitmap")),
        ],
        forbid=["Bitmap"],
    ))

    results.append(scenario(
        "recipe → primary tool missing falls back instead of failing",
        [{
            "id": "rc3", "op": "apply_vfx",
            "args": {
                "presetName": "Slit-Scan Time Machine",
                "category": "Shutter & Time",
                "intensity": 100,
                "recipe": {"chain": [{"tool": "Trails", "optional": False},
                                     {"tool": "MotionBlur", "bg": True, "key": True,
                                      "input": "Length", "scale": 0.3}]},
            },
        }],
        [
            chk_response("ok", True, req_id="rc3"),
            ("report", lambda rt, h: _node_report(rt, h, "rc3", ["BrightnessContrast"])),
        ],
        forbid=["Trails"],
    ))

    results.append(scenario(
        "recipe → graph is spliced MediaIn → chain → MediaOut",
        [{
            "id": "rc4", "op": "apply_vfx",
            "args": {
                "presetName": "Band-Split Slice Cabinet",
                "category": "Data & Print TOPs",
                "intensity": 150,
                "recipe": print_recipe,
            },
        }],
        [
            chk_response("ok", True, req_id="rc4"),
            ("spliced", lambda rt, h: _wired_report(rt, h, "rc4")),
        ],
    ))

    results.append(scenario(
        "recipe → kinetic text merges over the source plate",
        [{
            "id": "rc5", "op": "apply_vfx",
            "args": {
                "presetName": "Redline",
                "category": "Bold",
                "intensity": 120,
                "recipe": {"chain": [
                    {"tool": "TextPlus", "set": {"Size": 0.12}},
                    {"tool": "Glow", "set": {"Glow": 1.0}, "optional": False},
                    {"tool": "Merge", "fg": True, "source": True, "key": True,
                     "input": "Blend", "scale": 0.01},
                ]},
                "keyframes": [{"timeSec": 0, "value": 0}, {"timeSec": 1.2, "value": 120}],
            },
        }],
        [
            chk_response("ok", True, req_id="rc5"),
            ("report", lambda rt, h: _node_report(rt, h, "rc5", ["TextPlus", "Glow", "Merge"])),
            ("spliced", lambda rt, h: _wired_report(rt, h, "rc5")),
            ("spline", lambda rt, h: _has_call(rt, "spline:SetKeyFrames 2 keys")),
        ],
    ))

    print()
    print(f"{sum(results)}/{len(results)} scenarios passed")
    return 0 if all(results) else 1


if __name__ == "__main__":
    sys.exit(main())
