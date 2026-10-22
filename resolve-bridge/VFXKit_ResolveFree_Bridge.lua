-- ============================================================================
-- PULSE STUDIO / VFX KIT — DaVinci Resolve Free 21.1.1 Lua Mailbox Bridge
-- ============================================================================
-- Designed specifically for DaVinci Resolve Free 21.1 / 21.1.1+ (macOS/Win/Linux)
-- where Blackmagic disabled Python (.py) scripts, UIManager, io.*, os.execute,
-- and package/require, leaving LuaJIT in Workspace > Scripts with:
--   - `resolve` and `fusion` API globals
--   - `loadfile()` (used to read mailbox commands from ~/.vfxkit-resolve-free/request.lua)
--   - `bmd.fileexists()` and `bmd.wait()`
--   - `fusion:SetPrefs()` and `fusion:SavePrefs()` (flushes responses to Fusion.prefs)
--
-- HOW TO USE IN DAVINCI RESOLVE FREE 21.1.1:
--   1. Place this file in:
--      ~/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Scripts/Utility/
--   2. Open a project in DaVinci Resolve Free 21.1.1
--   3. Click: Workspace > Scripts > VFXKit_ResolveFree_Bridge
--   4. The bridge runs quietly in the background (~50ms latency) and connects
--      your floating VFX Kit / Pulse Studio panel directly to your live timeline!
-- ============================================================================

local BRIDGE_VERSION = "1.0.0-resolve21.1.1"
local PREF_PREFIX = "Global.VFXKitBridge."
local POLL_INTERVAL = 0.05 -- 50ms polling via bmd.wait

-- Safe global lookup
local function gread(name)
    local ok, v = pcall(function() return _G[name] end)
    if ok then return v end
    return nil
end

local function bmd_call(fn, ...)
    if type(bmd) == "table" and type(bmd[fn]) == "function" then
        local ok, res = pcall(bmd[fn], ...)
        if ok then return res end
    end
    return nil
end

local function wait_sec(s)
    bmd_call("wait", s)
end

local function file_exists(p)
    return bmd_call("fileexists", p) == true
end

-- Hex encoder so Fusion.prefs never mangles quotes, newlines, or UTF-8 bytes
local HEX_MAP = {}
for i = 0, 255 do
    HEX_MAP[string.char(i)] = string.format("%02x", i)
end
local function to_hex(s)
    return (tostring(s or ""):gsub(".", HEX_MAP))
end

-- Minimal pure-Lua JSON serializer (no `require` allowed in Resolve 21.1 Free)
local function json_str(s)
    local escaped = tostring(s):gsub('[%c"\\]', function(c)
        if c == '"' then return '\\"'
        elseif c == '\\' then return '\\\\'
        elseif c == '\n' then return '\\n'
        elseif c == '\r' then return '\\r'
        elseif c == '\t' then return '\\t'
        end
        return string.format('\\u%04x', c:byte())
    end)
    return '"' .. escaped .. '"'
end

local encode_json
encode_json = function(val, depth)
    depth = (depth or 0) + 1
    if depth > 14 then return '"<max_depth>"' end
    local t = type(val)
    if val == nil then return "null"
    elseif t == "boolean" then return val and "true" or "false"
    elseif t == "number" then
        if val ~= val or val == math.huge or val == -math.huge then return "0" end
        if val == math.floor(val) then return string.format("%.0f", val) end
        return string.format("%.6g", val)
    elseif t == "string" then
        return json_str(val)
    elseif t == "table" then
        -- Check if 1-indexed array
        local is_arr = true
        local max_idx = 0
        local count = 0
        for k, _ in pairs(val) do
            if k ~= "__flags" then
                count = count + 1
                if type(k) ~= "number" or k < 1 or k ~= math.floor(k) then
                    is_arr = false
                    break
                end
                if k > max_idx then max_idx = k end
            end
        end
        if is_arr and max_idx == count then
            local items = {}
            for i = 1, max_idx do
                items[i] = encode_json(val[i], depth)
            end
            return "[" .. table.concat(items, ",") .. "]"
        else
            local parts = {}
            for k, v in pairs(val) do
                if k ~= "__flags" then
                    parts[#parts + 1] = json_str(tostring(k)) .. ":" .. encode_json(v, depth)
                end
            end
            return "{" .. table.concat(parts, ",") .. "}"
        end
    end
    return json_str("<" .. t .. ">")
end

-- Acquire Resolve & Fusion objects in Resolve Free 21.1.1
local function get_resolve()
    local r = gread("resolve")
    if r then return r end
    local Rf = gread("Resolve")
    if type(Rf) == "function" then
        local ok, obj = pcall(Rf)
        if ok and obj then return obj end
    end
    return bmd_call("scriptapp", "Resolve")
end

local function get_fusion(res)
    local names = { "fusion", "fu", "app" }
    for i = 1, #names do
        local obj = gread(names[i])
        if obj then return obj end
    end
    if res then
        local ok, f = pcall(function() return res:Fusion() end)
        if ok and f then return f end
    end
    return nil
end

-- Resolve Free has been seen with `os` partially or fully stripped, so every
-- os.* access goes through these guards instead of assuming the table exists.
local function os_getenv(name)
    if type(os) ~= "table" or type(os.getenv) ~= "function" then return nil end
    local ok, v = pcall(os.getenv, name)
    if ok and type(v) == "string" and #v > 0 then return v end
    return nil
end

local FALLBACK_CLOCK = 1728000000
local function os_time()
    if type(os) == "table" and type(os.time) == "function" then
        local ok, v = pcall(os.time)
        if ok and type(v) == "number" then return v end
    end
    -- deterministic fallback when os.time is missing: a monotonically
    -- increasing counter, still usable as a unique-ish name suffix
    FALLBACK_CLOCK = FALLBACK_CLOCK + 1
    return FALLBACK_CLOCK
end

local function get_state_dir(fus)
    local env_dir = os_getenv("VFXKIT_STATE_DIR")
    if env_dir then return (env_dir:gsub("[/\\]+$", "")) end
    local home = os_getenv("HOME") or os_getenv("USERPROFILE")
    if home then
        return (home:gsub("[/\\]+$", "")) .. "/.vfxkit-resolve-free"
    end
    if fus then
        local ok, prof = pcall(function() return fus:MapPath("Profile:") end)
        if ok and type(prof) == "string" then
            local pre = prof:match("^(.-)/Library/") or prof:match("^(.-)[/\\]AppData[/\\]")
            if pre then return pre .. "/.vfxkit-resolve-free" end
        end
    end
    return "/tmp/.vfxkit-resolve-free"
end

-- Save response into Fusion.prefs
local function write_pref_response(fus, key, payload_table)
    local raw = encode_json(payload_table)
    local hex_str = (payload_table.id or "0") .. ":" .. to_hex(raw)
    pcall(function() fus:SetPrefs(PREF_PREFIX .. key, hex_str) end)
    for _ = 1, 4 do
        local ok, r = pcall(function() return fus:SavePrefs() end)
        if ok and r ~= false then return true end
        wait_sec(0.04)
    end
    return false
end

-- ============================================================================
-- RESOLVE 21.1.1 ACTION HANDLERS
-- ============================================================================

local Handlers = {}

-- 1. Get open project & timeline status
Handlers.get_project_state = function(res, _fus, _args)
    local pm = res:GetProjectManager()
    local proj = pm and pm:GetCurrentProject()
    if not proj then
        return { connected = true, hasProject = false, message = "No project currently open in Resolve" }
    end
    local tl = proj:GetCurrentTimeline()
    local video_items = {}
    local markers_out = {}
    local v_tracks = 0
    local a_tracks = 0
    local s_tracks = 0
    local tl_name = "None"
    local start_tc = "01:00:00:00"
    local cur_tc = "01:00:00:00"
    local target_clip = nil
    local playhead_frame = nil

    if tl then
        tl_name = tl:GetName() or "Timeline 1"
        v_tracks = tl:GetTrackCount("video") or 0
        a_tracks = tl:GetTrackCount("audio") or 0
        s_tracks = tl:GetTrackCount("subtitle") or 0
        pcall(function() start_tc = tl:GetStartTimecode() or start_tc end)
        pcall(function() cur_tc = tl:GetCurrentTimecode() or cur_tc end)

        local items = tl:GetItemListInTrack("video", 1) or {}
        for i = 1, math.min(#items, 60) do
            local it = items[i]
            video_items[#video_items + 1] = {
                index = i,
                name = it:GetName() or ("Clip " .. i),
                startFrame = it:GetStart() or 0,
                endFrame = it:GetEnd() or 0,
                duration = it:GetDuration() or 0,
                color = it:GetClipColor() or "Blue"
            }
        end

        -- what an Apply will actually hit: the clip under the playhead,
        -- falling back to the first clip on V1 exactly like apply_vfx does
        pcall(function()
            local it = tl:GetCurrentVideoItem()
            if not it then
                local list = tl:GetItemListInTrack("video", 1) or {}
                it = list[1]
            end
            if it then
                target_clip = {
                    name = it:GetName() or "Clip",
                    startFrame = it:GetStart() or 0,
                    duration = it:GetDuration() or 0,
                    underPlayhead = (tl:GetCurrentVideoItem() ~= nil),
                    fusionComps = it:GetFusionCompCount() or 0
                }
            end
            playhead_frame = tl:GetCurrentFrame()
        end)

        local mks = tl:GetMarkers() or {}
        for frame_id, mk in pairs(mks) do
            if frame_id ~= "__flags" and type(mk) == "table" then
                markers_out[#markers_out + 1] = {
                    frame = tonumber(frame_id) or 0,
                    color = mk.color or "Blue",
                    name = mk.name or "",
                    note = mk.note or ""
                }
            end
        end
    end

    return {
        connected = true,
        hasProject = true,
        product = res:GetProductName() or "DaVinci Resolve",
        version = res:GetVersionString() or "21.1.1",
        projectName = proj:GetName() or "Untitled Project",
        fps = proj:GetSetting("timelineFrameRate") or "24",
        width = proj:GetSetting("timelineResolutionWidth") or "1920",
        height = proj:GetSetting("timelineResolutionHeight") or "1080",
        timelineName = tl_name,
        currentTimecode = cur_tc,
        startTimecode = start_tc,
        videoTracks = v_tracks,
        audioTracks = a_tracks,
        subtitleTracks = s_tracks,
        timelineClips = video_items,
        targetClip = target_clip,
        playheadFrame = playhead_frame,
        markers = markers_out
    }
end

-- 2. Scan Media Pool bins & clips (for Vlog / Music Video Auto-Editor)
Handlers.get_media_pool = function(res, _fus, _args)
    local pm = res:GetProjectManager()
    local proj = pm and pm:GetCurrentProject()
    if not proj then return { clips = {}, error = "No project open" } end
    local mp = proj:GetMediaPool()
    local root = mp and mp:GetRootFolder()
    if not root then return { clips = {}, error = "Media Pool unavailable" } end

    local out = {}
    local function scan_folder(folder, path_prefix)
        local fname = folder:GetName() or "Master"
        local cur_path = path_prefix == "" and fname or (path_prefix .. "/" .. fname)
        local clips = folder:GetClipList() or {}
        for i = 1, #clips do
            local c = clips[i]
            local props = c:GetClipProperty() or {}
            out[#out + 1] = {
                id = c:GetUniqueId() or ("mp_" .. #out),
                name = c:GetName() or props["Clip Name"] or ("Clip " .. i),
                bin = cur_path,
                duration = props["Duration"] or "00:00:05:00",
                frames = tonumber(props["Frames"]) or 120,
                fps = tonumber(props["FPS"]) or 24,
                resolution = props["Resolution"] or "1920x1080",
                filePath = props["File Path"] or "",
                clipType = props["Type"] or "Video + Audio",
                color = c:GetClipColor() or "Blue"
            }
        end
        local subs = folder:GetSubFolderList() or {}
        for j = 1, #subs do
            scan_folder(subs[j], cur_path)
        end
    end

    scan_folder(root, "")
    return { clips = out, total = #out }
end

-- 3. Apply a VFX Preset to the clip under playhead or selected clip
Handlers.apply_vfx = function(res, _fus, args)
    local pm = res:GetProjectManager()
    local proj = pm and pm:GetCurrentProject()
    if not proj then return { applied = false, error = "No project open" } end
    local tl = proj:GetCurrentTimeline()
    if not tl then return { applied = false, error = "No active timeline" } end

    local item = tl:GetCurrentVideoItem()
    if not item then
        local list = tl:GetItemListInTrack("video", 1) or {}
        item = list[1]
    end
    if not item then
        return { applied = false, error = "No video clip found on timeline" }
    end

    local preset_name = args.presetName or "Camera Shake"
    local category = args.category or "Shakes"
    local intensity = tonumber(args.intensity) or 80
    local scale_boost = 1.0 + (intensity / 100.0) * 0.12

    -- Apply immediate non-destructive Inspector adjustments + Fusion comp node
    pcall(function()
        if category == "Shakes" or category == "Hits" or category == "Speed Ramps" then
            item:SetProperty("ZoomX", scale_boost)
            item:SetProperty("ZoomY", scale_boost)
        end
    end)

    -- Create or access Fusion Comp on the clip and inject native VFX nodes
    local comp = nil
    pcall(function()
        if item:GetFusionCompCount() == 0 then
            comp = item:AddFusionComp()
        else
            comp = item:GetFusionCompByIndex(1)
        end
    end)

    local node_added = "InspectorZoom+Marker"
    local keyframes = type(args.keyframes) == "table" and args.keyframes or {}
    local recipe = args.recipe

    if comp then
        pcall(function()
            comp:Lock()

            -- ---------------------------------------------------------------
            -- Recipe path: the panel ships a native-Fusion node graph per preset
            -- (resolve-bridge/preset-recipes.json), so graphs can be re-tuned in
            -- JS without reinstalling this file into Resolve. The bridge is only
            -- an interpreter: create tools, wire Background, key the primary
            -- input, and never fail hard when an optional Free-edition tool is
            -- missing from the build.
            -- ---------------------------------------------------------------
            if type(recipe) == "table" and type(recipe.chain) == "table" and #recipe.chain > 0 then
                local built = {}
                local skipped = {}
                local keyed_tool = nil
                local keyed_input = nil
                local keyed_scale = 1.0

                -- The comp Resolve created for this clip already owns MediaIn1 /
                -- MediaOut1. A graph that is not spliced between them renders
                -- nothing, so every recipe is wired source -> chain -> output.
                local src = nil
                local dst = nil
                pcall(function()
                    src = comp:FindTool("MediaIn1") or comp:FindTool("MediaIn")
                    dst = comp:FindTool("MediaOut1") or comp:FindTool("MediaOut")
                end)
                local prev = src      -- last node created (Background/Foreground semantics)
                local image = src     -- last node that actually carries an image
                local wired = 0

                for step_i = 1, #recipe.chain do
                    local step = recipe.chain[step_i]
                    local tool = nil
                    if type(step) == "table" and type(step.tool) == "string" then
                        tool = comp:AddTool(step.tool, -32768, -32768)
                        if not tool and not step.optional then
                            -- universal fallback: BrightnessContrast ships with
                            -- every Resolve Free build
                            tool = comp:AddTool("BrightnessContrast", -32768, -32768)
                            if tool then
                                skipped[#skipped + 1] = step.tool .. "->BrightnessContrast"
                                step = { tool = "BrightnessContrast", bg = step.bg,
                                         key = step.key, input = "Gain",
                                         scale = step.scale or 1.0 }
                            end
                        end
                    end

                    if tool then
                        if type(step.set) == "table" then
                            for k, v in pairs(step.set) do
                                pcall(function() tool[k] = v end)
                            end
                        end
                        -- image plumbing: explicit Background / Foreground / source
                        -- first, then a plain Input for filter-style nodes.
                        local linked = false
                        if step.fg and prev then
                            if pcall(function() tool.Foreground = prev.Output end) then linked = true end
                        end
                        if step.source and src then
                            if pcall(function() tool.Background = src.Output end) then linked = true end
                        elseif step.bg and prev then
                            if pcall(function() tool.Background = prev.Output end) then linked = true end
                        elseif not step.fg and not step.source and image then
                            if pcall(function() tool.Input = image.Output end) then linked = true end
                        end
                        if linked then
                            wired = wired + 1
                            image = tool
                        end
                        if step.key then
                            keyed_tool = tool
                            keyed_input = step.input or "Gain"
                            keyed_scale = tonumber(step.scale) or 1.0
                        end
                        built[#built + 1] = step.tool
                        prev = tool
                    elseif step.optional then
                        skipped[#skipped + 1] = step.tool
                    end
                end

                if keyed_tool and keyed_input then
                    if #keyframes > 0 then
                        local spline = comp:BezierSpline()
                        keyed_tool[keyed_input] = spline
                        local kf_table = {}
                        for k_i = 1, #keyframes do
                            local kf = keyframes[k_i]
                            local f_num = math.floor((tonumber(kf.timeSec) or 0) * 24)
                            local v_num = ((tonumber(kf.value) or intensity) / 100.0) * keyed_scale
                            kf_table[f_num] = { v_num }
                        end
                        spline:SetKeyFrames(kf_table)
                        built[#built + 1] = "BezierSpline(" .. #keyframes .. " KF)"
                    else
                        keyed_tool[keyed_input] = (intensity / 100.0) * keyed_scale
                    end
                end

                -- splice the tail into MediaOut1 so the clip actually renders
                -- through the new graph
                local spliced = false
                if dst and image and image ~= src then
                    spliced = pcall(function() dst.Input = image.Output end)
                    if spliced then wired = wired + 1 end
                end

                node_added = (#built > 0) and table.concat(built, " -> ") or "no nodes"
                if #skipped > 0 then
                    node_added = node_added .. " [skipped: " .. table.concat(skipped, ", ") .. "]"
                end
                if spliced then
                    node_added = node_added .. " [wired " .. wired .. " links to MediaOut1]"
                end
                comp:Unlock()
                return
            end

            local tool = nil
            local param_name = nil
            local scale_mult = 1.0

            if category == "TouchDesigner TOPs" or category == "Transitions & Morphs" then
                local noise = comp:AddTool("FastNoise", -32768, -32768)
                tool = comp:AddTool("Displace", -32768, -32768)
                if noise and tool then
                    noise.Detail = 4.5
                    noise.XScale = 6.5
                    noise.SeetheRate = 0.42
                    tool.Foreground = noise.Output
                    param_name = "XRefraction"
                    scale_mult = 0.14
                    node_added = "FastNoise+Displace (TouchDesigner TOP)"
                end
            elseif category == "Data & Print TOPs" or category == "Glitch & Bitmap TOPs" then
                -- mono 1-bit print family: desaturate → hard contrast (keyframed),
                -- then an optional Bitmap threshold stage if the build has it.
                local bw = comp:AddTool("ColorCorrector", -32768, -32768)
                if bw then
                    pcall(function() bw.Saturation = 0.0 end)
                    pcall(function() bw.Gain = 1.05 end)
                end
                tool = comp:AddTool("BrightnessContrast", -32768, -32768)
                if tool then
                    pcall(function() tool.Contrast = 0.35 + (intensity / 100.0) * 0.5 end)
                    if bw then pcall(function() tool.Background = bw.Output end) end
                    param_name = "Gain"
                    scale_mult = 1.3
                    node_added = "ColorCorrector+BrightnessContrast (Data & Print TOP)"
                    local bmp = comp:AddTool("Bitmap", -32768, -32768)
                    if bmp then
                        pcall(function() bmp.Level = 0.5 end)
                        pcall(function() bmp.Background = tool.Output end)
                        node_added = node_added .. "+Bitmap 1-bit"
                    end
                end
            elseif category == "Optical & Glass" or category == "Depth & Subject" then
                tool = comp:AddTool("SoftGlow", -32768, -32768)
                param_name = "Gain"
                scale_mult = 2.0
                node_added = "SoftGlow (Optical Bloom)"
            elseif category == "Shutter & Time" then
                tool = comp:AddTool("Trails", -32768, -32768)
                param_name = "Gain"
                scale_mult = 0.85
                node_added = "Trails (360 Shutter Smear)"
            elseif category == "Camera Weight" or category == "Shakes" then
                tool = comp:AddTool("CameraShake", -32768, -32768)
                param_name = "OverallStrength"
                scale_mult = 0.65
                node_added = "CameraShake (Weighted Rig)"
            else
                tool = comp:AddTool("BrightnessContrast", -32768, -32768)
                param_name = "Gain"
                scale_mult = 1.4
                node_added = "BrightnessContrast (Film Lab Grade)"
            end

            if tool and param_name then
                if #keyframes > 0 then
                    local spline = comp:BezierSpline()
                    tool[param_name] = spline
                    local kf_table = {}
                    for k_i = 1, #keyframes do
                        local kf = keyframes[k_i]
                        local f_num = math.floor((tonumber(kf.timeSec) or 0) * 24)
                        local v_num = ((tonumber(kf.value) or intensity) / 100.0) * scale_mult
                        kf_table[f_num] = { v_num }
                    end
                    spline:SetKeyFrames(kf_table)
                    node_added = node_added .. " + BezierSpline (" .. #keyframes .. " KFs)"
                else
                    tool[param_name] = (intensity / 100.0) * scale_mult
                end
            end
            comp:Unlock()
        end)
    end

    -- Stamp a colored marker on the clip & timeline so the editor sees the VFX tag
    local color_map = {
        ["Roto FX"] = "Purple",
        ["TouchDesigner TOPs"] = "Purple",
        ["Data & Print TOPs"] = "Slate",
        ["Glitch & Bitmap TOPs"] = "Slate",
        ["Transitions & Morphs"] = "Cyan",
        ["Shakes"] = "Red",
        ["Grunge FX"] = "Sand",
        ["Transitions"] = "Cyan",
        ["Hits"] = "Yellow",
        ["Speed Ramps"] = "Green",
        ["CRT"] = "Pink"
    }
    local m_color = color_map[category] or "Fuchsia"
    local offset_frame = math.floor((item:GetDuration() or 24) / 4)
    pcall(function()
        item:AddMarker(offset_frame, m_color, "VFX: " .. preset_name, "Category: " .. category .. " | Intensity: " .. intensity .. "%", 1)
    end)

    return {
        applied = true,
        clipName = item:GetName() or "Selected Clip",
        presetName = preset_name,
        category = category,
        intensity = intensity,
        fusionNode = node_added
    }
end

-- 4. AI Prompt VFX Pass across the timeline
-- ---------------------------------------------------------------------------
-- mask_apply — Magic-Mask style matte built in the panel (Resolve Free has no
-- Magic Mask; that tool is Studio-only). The panel does the click-to-select,
-- add/subtract strokes, feather and frame tracking in the browser, then this
-- writes the result as native Fusion nodes:
--     Paint -> Polygon -> Blur -> MatteControl -> Merge -> MediaOut1
-- ---------------------------------------------------------------------------
Handlers.mask_apply = function(res, _fus, args)
    local pm = res:GetProjectManager()
    local proj = pm and pm:GetCurrentProject()
    if not proj then return { applied = false, error = "No project open" } end
    local tl = proj:GetCurrentTimeline()
    if not tl then return { applied = false, error = "No active timeline" } end

    local item = tl:GetCurrentVideoItem()
    if not item then
        local list = tl:GetItemListInTrack("video", 1) or {}
        item = list[1]
    end
    if not item then
        return { applied = false, error = "No video clip found on timeline" }
    end

    local a = args or {}
    local poly = type(a.polygon) == "table" and a.polygon or {}
    if #poly < 3 then
        return { applied = false, error = "Mask needs at least 3 points (build the matte in the panel first)" }
    end
    local tracked = type(a.tracked) == "table" and a.tracked or {}
    local keyframes = type(a.keyframes) == "table" and a.keyframes or {}
    local strokes = type(a.strokes) == "table" and a.strokes or {}
    local feather = tonumber(a.feather) or 0
    local softness = tonumber(a.softness) or 0
    local expand = tonumber(a.expand) or 0
    local opacity = (tonumber(a.opacity) or 85) / 100.0
    local invert = a.invert == true
    local mode = tostring(a.mode or "subject")
    local coverage = tonumber(a.coverage) or 0
    local fps = tonumber(a.fps) or 24

    local comp = nil
    pcall(function()
        if item:GetFusionCompCount() == 0 then
            comp = item:AddFusionComp()
        else
            comp = item:GetFusionCompByIndex(1)
        end
    end)

    local built = {}
    local shape_points = 0
    if comp then
        pcall(function()
            comp:Lock()
            local src = comp:FindTool("MediaIn1")
            local dst = comp:FindTool("MediaOut1")
            local paint = comp:AddTool("Paint", -32768, -32768)
            local pn = comp:AddTool("Polygon", -32768, -32768)
            local softn = comp:AddTool("Blur", -32768, -32768)
            local matte = comp:AddTool("MatteControl", -32768, -32768)
            local merge = comp:AddTool("Merge", -32768, -32768)

            -- Fusion's Polygon takes { {x=..,y=..}, .. } in 0..1 frame space.
            local shape = {}
            for i = 1, #poly do
                local p = poly[i]
                if type(p) == "table" then
                    shape[#shape + 1] = { x = tonumber(p.x) or 0, y = tonumber(p.y) or 0 }
                end
            end
            shape_points = #shape

            if paint then
                pcall(function() paint.Background = src.Output end)
                pcall(function() paint.BrushControls = 1 end)
                for si = 1, math.min(#strokes, 12) do
                    local stroke = strokes[si]
                    if type(stroke) == "table" and type(stroke.points) == "table" then
                        local r = tonumber(stroke.radius) or 0.02
                        local dir = stroke.erase and -1 or 1
                        for pi = 1, math.min(#stroke.points, 40) do
                            local pt = stroke.points[pi]
                            if type(pt) == "table" then
                                pcall(function()
                                    paint:ApplyBrush(tonumber(pt.x) or 0, tonumber(pt.y) or 0, r, dir)
                                end)
                            end
                        end
                    end
                end
                built[#built + 1] = "Paint"
            end

            if pn and shape_points >= 3 then
                pcall(function() pn.Polygon = shape end)
                pcall(function() pn.BorderWidth = math.max(0, math.floor(expand * 0.5 + 0.5)) end)
                built[#built + 1] = "Polygon(" .. shape_points .. "pts)"
            end

            if softn then
                local blur_size = feather + softness * 0.12
                pcall(function() softn.BlurSize = blur_size end)
                pcall(function() softn.PassThrough = false end)
                if pn then pcall(function() softn.Background = pn.Output end) end
                built[#built + 1] = "Blur(" .. string.format("%.1f", blur_size) .. "px)"
            end

            if matte then
                pcall(function() matte.Background = src.Output end)
                if softn then pcall(function() matte.Foreground = softn.Output end) end
                pcall(function() matte.Invert = invert end)
                pcall(function() matte.CombineOp = 0 end)
                built[#built + 1] = "MatteControl"
            end

            if merge then
                pcall(function() merge.Background = src.Output end)
                if matte then pcall(function() merge.Foreground = matte.Output end) end
                pcall(function() merge.Blend = opacity end)

                -- BezierSpline keyframes: the matte strength follows each tracked frame
                local kf_source = keyframes
                if #kf_source == 0 and #tracked > 0 then
                    kf_source = {}
                    for i = 1, #tracked do
                        local f = tracked[i]
                        kf_source[#kf_source + 1] = {
                            timeSec = tonumber(f.timeSec) or 0,
                            value = math.min(100, (tonumber(f.coverage) or 0) * 220)
                        }
                    end
                end
                if #kf_source > 0 then
                    local spline = comp:BezierSpline()
                    if spline then
                        local kf_table = {}
                        for i = 1, math.min(#kf_source, 32) do
                            local kf = kf_source[i]
                            local frame_no = math.floor((tonumber(kf.timeSec) or 0) * fps)
                            local v = math.max(0, math.min(1, (tonumber(kf.value) or 0) / 100.0))
                            kf_table[frame_no] = { v }
                        end
                        pcall(function() merge.Blend = spline end)
                        pcall(function() spline:SetKeyFrames(kf_table) end)
                    end
                end
                built[#built + 1] = "Merge"
            end

            if dst and merge then
                pcall(function() dst.Input = merge.Output end)
                built[#built + 1] = "MediaOut1"
            end
            comp:Unlock()
        end)
    end

    -- Stamp every tracked frame so the editor can see where the matte lives.
    for i = 1, math.min(#tracked, 12) do
        local f = tracked[i]
        if type(f) == "table" then
            pcall(function()
                item:AddMarker(
                    math.floor((tonumber(f.timeSec) or 0) * fps),
                    "Red",
                    "MASK TRACK",
                    mode .. " | " .. string.format("%.1f", (tonumber(f.coverage) or 0) * 100) .. "% of frame",
                    1
                )
            end)
        end
    end

    return {
        applied = true,
        clipName = item:GetName(),
        fusionNode = table.concat(built, " -> "),
        points = shape_points,
        trackedFrames = #tracked,
        keyframes = #keyframes,
        mode = mode,
        invert = invert,
        feather = feather,
        coverage = coverage
    }
end

-- ---------------------------------------------------------------------------
-- depth_apply — depth-driven effect stack from the panel. Resolve gets a real
-- DepthMap node plus one native tool per effect, each with a BezierSpline on
-- Blend so intensity animates exactly like the panel preview.
--     MediaIn -> DepthMap -> <effect tools> -> Merge -> MediaOut
-- The tool list is chosen in the panel (tools[1] preferred, tools[2] fallback),
-- so missing nodes in a Free install degrade instead of failing.
-- ---------------------------------------------------------------------------
Handlers.depth_apply = function(res, _fus, args)
    local pm = res:GetProjectManager()
    local proj = pm and pm:GetCurrentProject()
    if not proj then return { applied = false, error = "No project open" } end
    local tl = proj:GetCurrentTimeline()
    if not tl then return { applied = false, error = "No active timeline" } end

    local item = tl:GetCurrentVideoItem()
    if not item then
        local list = tl:GetItemListInTrack("video", 1) or {}
        item = list[1]
    end
    if not item then
        return { applied = false, error = "No video clip found on timeline" }
    end

    local a = args or {}
    local effects = type(a.effects) == "table" and a.effects or {}
    if #effects == 0 then
        return { applied = false, error = "No depth effect selected" }
    end
    local fps = tonumber(a.fps) or 24
    local focus = (tonumber(a.focus) or 45) / 100.0

    local comp = nil
    pcall(function()
        if item:GetFusionCompCount() == 0 then
            comp = item:AddFusionComp()
        else
            comp = item:GetFusionCompByIndex(1)
        end
    end)

    local built = {}
    local skipped = {}
    local tool_names = {}

    if comp then
        pcall(function()
            comp:Lock()
            local src = comp:FindTool("MediaIn1")
            local dst = comp:FindTool("MediaOut1")
            local depthNode = comp:AddTool("DepthMap", -32768, -32768)
            local merge = comp:AddTool("Merge", -32768, -32768)
            local prev = depthNode or src

            if depthNode then
                built[#built + 1] = "DepthMap"
                if src then pcall(function() depthNode.Input = src.Output end) end
                if a.invert == true then
                    pcall(function() depthNode.Invert = true end)
                end
                pcall(function() depthNode.DepthFocus = focus end)
                pcall(function() depthNode.Blend = 1 end)
            else
                skipped[#skipped + 1] = "DepthMap"
            end

            for i = 1, #effects do
                local ef = effects[i]
                if type(ef) == "table" then
                    local tool = nil
                    local wanted = type(ef.tools) == "table" and ef.tools or { "BrightnessContrast" }
                    local used_name = nil
                    for t = 1, #wanted do
                        local name = tostring(wanted[t])
                        local ok_add, made = pcall(function()
                            return comp:AddTool(name, -32768, -32768)
                        end)
                        if ok_add and made then
                            tool = made
                            used_name = name
                            break
                        end
                        skipped[#skipped + 1] = name
                    end

                    if tool then
                        local label = tostring(ef.label or used_name)
                        local param = ef.param and tostring(ef.param) or nil
                        local value = tonumber(ef.value)
                        if param and value then
                            pcall(function() tool[param] = value end)
                        end
                        if ef.id == "dof" or ef.id == "tilt" then
                            pcall(function() tool.DepthFocus = focus end)
                        end
                        if prev then pcall(function() tool.Background = prev.Output end) end

                        -- BezierSpline on Blend: intensity that actually animates
                        local keys = type(ef.keyframes) == "table" and ef.keyframes or {}
                        if #keys > 0 then
                            local spline = comp:BezierSpline()
                            if spline then
                                local kf_table = {}
                                for k = 1, math.min(#keys, 32) do
                                    local kf = keys[k]
                                    local frame_no = math.floor((tonumber(kf.timeSec) or 0) * fps)
                                    local v = math.max(0, math.min(1, (tonumber(kf.value) or 0) / 100.0))
                                    kf_table[frame_no] = { v }
                                end
                                pcall(function() tool.Blend = spline end)
                                pcall(function() spline:SetKeyFrames(kf_table) end)
                            end
                        end

                        prev = tool
                        built[#built + 1] = label .. "(" .. used_name
                            .. " " .. tostring(math.floor(tonumber(ef.intensity) or 0)) .. "%)"
                        tool_names[#tool_names + 1] = used_name
                    end
                end
            end

            if merge and prev then
                if src then pcall(function() merge.Background = src.Output end) end
                pcall(function() merge.Foreground = prev.Output end)
                pcall(function() merge.Blend = 1 end)
                built[#built + 1] = "Merge"
            end
            if dst and merge then
                pcall(function() dst.Input = merge.Output end)
                built[#built + 1] = "MediaOut1"
            end
            comp:Unlock()
        end)
    end

    pcall(function()
        item:AddMarker(
            math.floor(fps * 0.5),
            "Cyan",
            "DEPTH: " .. tostring((effects[1] or {}).label or "stack"),
            tostring(#effects) .. " depth effect(s) | DepthMap -> " .. table.concat(tool_names, " -> "),
            1
        )
    end)

    return {
        applied = true,
        clipName = item:GetName(),
        fusionNode = table.concat(built, " -> "),
        effects = #effects,
        skipped = table.concat(skipped, ","),
        focus = focus
    }
end

-- ---------------------------------------------------------------------------
-- layers_apply — ordered effect stack. Each layer is built from its own native
-- recipe, wired off the same MediaIn, then merged over the layers below it with
-- that layer's blend mode, opacity and BezierSpline keyframes.
--     MediaIn -> layer 1 -> layer 2 -> ... -> MediaOut
-- Optional tools that a Free install lacks are skipped instead of failing.
-- ---------------------------------------------------------------------------
Handlers.layers_apply = function(res, _fus, args)
    local pm = res:GetProjectManager()
    local proj = pm and pm:GetCurrentProject()
    if not proj then return { applied = false, error = "No project open" } end
    local tl = proj:GetCurrentTimeline()
    if not tl then return { applied = false, error = "No active timeline" } end

    local item = tl:GetCurrentVideoItem()
    if not item then
        local list = tl:GetItemListInTrack("video", 1) or {}
        item = list[1]
    end
    if not item then
        return { applied = false, error = "No video clip found on timeline" }
    end

    local a = args or {}
    local layers = type(a.layers) == "table" and a.layers or {}
    if #layers == 0 then
        return { applied = false, error = "No effect layers to build" }
    end
    local fps = tonumber(a.fps) or 24

    local comp = nil
    pcall(function()
        if item:GetFusionCompCount() == 0 then
            comp = item:AddFusionComp()
        else
            comp = item:GetFusionCompByIndex(1)
        end
    end)

    local built = {}
    local order = {}
    local skipped = {}
    local OPERATORS = {
        screen = "Screen", multiply = "Multiply", overlay = "Overlay",
        lighten = "Lighten", difference = "Difference", softlight = "Soft Light"
    }

    if comp then
        pcall(function()
            comp:Lock()
            local src = comp:FindTool("MediaIn1")
            local dst = comp:FindTool("MediaOut1")
            local prev = src

            for li = 1, #layers do
                local layer = layers[li]
                if type(layer) == "table" and layer.enabled ~= false then
                    local label = tostring(layer.name or layer.presetId or ("layer " .. li))
                    local img = src
                    local names = {}
                    local chain = (type(layer.recipe) == "table" and type(layer.recipe.chain) == "table")
                        and layer.recipe.chain or {}

                    for si = 1, #chain do
                        local step = chain[si]
                        local tool_name = type(step) == "table" and step.tool or step
                        local made = nil
                        if tool_name then
                            local ok_add, tool = pcall(function()
                                return comp:AddTool(tostring(tool_name), -32768, -32768)
                            end)
                            if ok_add and tool then made = tool else skipped[#skipped + 1] = tostring(tool_name) end
                        end
                        if made then
                            names[#names + 1] = tostring(tool_name)
                            if type(step) == "table" and type(step.set) == "table" then
                                for k, v in pairs(step.set) do
                                    pcall(function() made[k] = v end)
                                end
                            end
                            if type(step) == "table" and step.key and step.input then
                                local keys = type(layer.keyframes) == "table" and layer.keyframes or {}
                                if #keys > 0 then
                                    local spline = comp:BezierSpline()
                                    if spline then
                                        local kf_table = {}
                                        for k = 1, math.min(#keys, 32) do
                                            local kf = keys[k]
                                            local frame_no = math.floor((tonumber(kf.timeSec) or 0) * fps)
                                            local scale = tonumber(step.scale) or 1.0
                                            local v = (tonumber(kf.value) or 0) / 100.0 * scale
                                            kf_table[frame_no] = { v }
                                        end
                                        pcall(function() made[step.input] = spline end)
                                        pcall(function() spline:SetKeyFrames(kf_table) end)
                                    end
                                end
                            end
                            if img then pcall(function() made.Background = img.Output end) end
                            img = made
                        end
                    end

                    local merge = comp:AddTool("Merge", -32768, -32768)
                    if merge and img and prev then
                        pcall(function() merge.Background = prev.Output end)
                        pcall(function() merge.Foreground = img.Output end)
                        local opacity = (tonumber(layer.opacity) or 100) / 100.0
                        pcall(function() merge.Blend = opacity end)
                        local op = OPERATORS[tostring(layer.blend or "normal")]
                        if op then pcall(function() merge.Operator = op end) end

                        local keys = type(layer.keyframes) == "table" and layer.keyframes or {}
                        if #keys > 0 then
                            local spline = comp:BezierSpline()
                            if spline then
                                local kf_table = {}
                                for k = 1, math.min(#keys, 32) do
                                    local kf = keys[k]
                                    local frame_no = math.floor((tonumber(kf.timeSec) or 0) * fps)
                                    local v = math.max(0, math.min(1,
                                        (tonumber(kf.value) or 0) / 100.0 * opacity))
                                    kf_table[frame_no] = { v }
                                end
                                pcall(function() merge.Blend = spline end)
                                pcall(function() spline:SetKeyFrames(kf_table) end)
                            end
                        end
                        prev = merge
                        built[#built + 1] = label .. "[" .. table.concat(names, "->")
                            .. "->Merge] "
                            .. tostring(layer.blend or "normal")
                            .. " " .. tostring(math.floor(tonumber(layer.opacity) or 100)) .. "%"
                        order[#order + 1] = label
                    end
                end
            end

            if dst and prev and prev ~= src then
                pcall(function() dst.Input = prev.Output end)
                built[#built + 1] = "MediaOut1"
            end
            comp:Unlock()
        end)
    end

    pcall(function()
        item:AddMarker(
            math.floor(fps * 0.5),
            "Fuchsia",
            "LAYERS: " .. tostring(#order) .. " stacked",
            table.concat(order, " + "),
            1
        )
    end)

    return {
        applied = true,
        clipName = item:GetName(),
        fusionNode = table.concat(built, " -> "),
        layers = #order,
        skipped = table.concat(skipped, ",")
    }
end

Handlers.batch_ai_vfx = function(res, fus, args)
    local pm = res:GetProjectManager()
    local proj = pm and pm:GetCurrentProject()
    if not proj then return { applied = false, error = "No project open" } end
    local tl = proj:GetCurrentTimeline()
    if not tl then return { applied = false, error = "No active timeline" } end

    local items = tl:GetItemListInTrack("video", 1) or {}
    local prompt = args.prompt or "High energy music video edit"
    local count = 0
    local start_frame = tl:GetStartFrame() or 0

    for i = 1, #items do
        local it = items[i]
        local f_pos = (it:GetStart() or start_frame) - start_frame
        pcall(function()
            tl:AddMarker(f_pos, "Purple", "AI VFX: " .. prompt, "Auto-placed on cut #" .. i, 1)
        end)
        count = count + 1
    end

    return {
        applied = true,
        clipsProcessed = count,
        prompt = prompt
    }
end

-- 5. Cut Silences: rebuilds a tight cut on the timeline from kept speech segments
Handlers.cut_silences = function(res, _fus, args)
    local pm = res:GetProjectManager()
    local proj = pm and pm:GetCurrentProject()
    if not proj then return { ok = false, error = "No project open" } end
    local mp = proj:GetMediaPool()
    local tl = proj:GetCurrentTimeline()
    if not tl then return { ok = false, error = "No active timeline" } end

    local segments = args.segments or {}
    local items = tl:GetItemListInTrack("video", 1) or {}
    if #items == 0 then
        return { ok = false, error = "No clip on Video Track 1 to cut silences from" }
    end

    local base_item = items[1]
    local mpi = base_item:GetMediaPoolItem()
    if not mpi or #segments == 0 then
        -- Fallback: mark silence cut points on timeline
        local start_f = tl:GetStartFrame() or 0
        for i = 1, #segments do
            local seg = segments[i]
            pcall(function()
                tl:AddMarker(start_f + (seg.startFrame or (i * 48)), "Mint", "Keep Segment #" .. i, "Silence Cutter", 1)
            end)
        end
        return { ok = true, mode = "markers", segmentsPlaced = #segments }
    end

    local subclips = {}
    for i = 1, #segments do
        local s = segments[i]
        subclips[#subclips + 1] = {
            mediaPoolItem = mpi,
            startFrame = tonumber(s.startFrame) or 0,
            endFrame = tonumber(s.endFrame) or 48
        }
    end

    local new_tl_name = (tl:GetName() or "Timeline") .. " - Silence Cut (" .. os_time() .. ")"
    local new_tl = mp:CreateEmptyTimeline(new_tl_name)
    if new_tl then
        proj:SetCurrentTimeline(new_tl)
        mp:AppendToTimeline(subclips)
        return { ok = true, mode = "new_timeline", timelineName = new_tl_name, segmentsPlaced = #subclips }
    else
        mp:AppendToTimeline(subclips)
        return { ok = true, mode = "appended", segmentsPlaced = #subclips }
    end
end

-- 6. Add Subtitles / Music Video Lyrics
-- Builds a real kinetic-type Fusion comp: one TextPlus card per cue, each
-- opacity-keyed with a native BezierSpline, merged over the clip's source.
-- Markers are still stamped so the editor can navigate the lyric sheet.
local MAX_LYRIC_NODES = 16

Handlers.add_captions_lyrics = function(res, _fus, args)
    local pm = res:GetProjectManager()
    local proj = pm and pm:GetCurrentProject()
    if not proj then return { ok = false, error = "No project open" } end
    local tl = proj:GetCurrentTimeline()
    if not tl then return { ok = false, error = "No active timeline" } end

    local lines = args.lines or {}
    local style = args.style or "TikTok Kinetic Pop"
    local start_f = tl:GetStartFrame() or 0
    local fps = tonumber(proj:GetSetting("timelineFrameRate")) or 24
    local intensity = tonumber(args.intensity) or 100

    for i = 1, #lines do
        local line = lines[i]
        local frame_offset = math.floor((tonumber(line.startSec) or ((i - 1) * 2.0)) * fps)
        pcall(function()
            tl:AddMarker(
                start_f + frame_offset,
                "Yellow",
                line.text or ("Lyric #" .. i),
                "Style: " .. style .. " | End: " .. tostring(line.endSec or "") .. "s",
                math.max(1, math.floor(((tonumber(line.endSec) or (i * 2.0)) - (tonumber(line.startSec) or ((i - 1) * 2.0))) * fps))
            )
        end)
    end

    -- ---- native Fusion lyric comp -----------------------------------------
    local item = tl:GetCurrentVideoItem()
    if not item then
        local list = tl:GetItemListInTrack("video", 1) or {}
        item = list[1]
    end
    if not item or #lines == 0 then
        return { ok = true, linesAdded = #lines, style = style, fusionNode = "markers only" }
    end

    local comp = nil
    pcall(function()
        if item:GetFusionCompCount() == 0 then
            comp = item:AddFusionComp()
        else
            comp = item:GetFusionCompByIndex(1)
        end
    end)
    if not comp then
        return { ok = true, linesAdded = #lines, style = style, fusionNode = "markers only (no comp)" }
    end

    local built, keys_added = {}, 0
    local merged = 0
    pcall(function()
        comp:Lock()
        local src = comp:FindTool("MediaIn1") or comp:FindTool("MediaIn")
        local dst = comp:FindTool("MediaOut1") or comp:FindTool("MediaOut")
        local plate = src

        local count = math.min(#lines, MAX_LYRIC_NODES)
        for i = 1, count do
            local line = lines[i]
            local t0 = tonumber(line.startSec) or ((i - 1) * 2.0)
            local t1 = tonumber(line.endSec) or (t0 + 2.0)
            if t1 <= t0 then t1 = t0 + 0.4 end

            local text = comp:AddTool("TextPlus", -32768, -32768)
            if text then
                pcall(function() text.Text = tostring(line.text or ("Lyric " .. i)) end)
                pcall(function() text.Size = tonumber(args.fontSize) or 0.11 end)
                pcall(function() text.Style = "Bold" end)
                -- stacked vertical layout so every cue stays inspectable
                pcall(function() text.Center = { 0.5, 0.78 - (i - 1) * 0.02 } end)
                built[#built + 1] = "TextPlus"

                -- punch-in / punch-out opacity, native BezierSpline
                local spline = comp:BezierSpline()
                if spline then
                    local f_in = math.floor((t0 - 0.12) * fps)
                    local f_on = math.floor(t0 * fps)
                    local f_out = math.floor(t1 * fps)
                    local peak = math.min(1.0, math.max(0.05, intensity / 100.0))
                    if f_in < 0 then f_in = 0 end
                    if f_on <= f_in then f_on = f_in + 1 end
                    if f_out <= f_on then f_out = f_on + 1 end
                    local kf = {}
                    kf[f_in] = { 0 }
                    kf[f_on] = { peak }
                    kf[f_out] = { 0 }
                    pcall(function() spline:SetKeyFrames(kf) end)
                    pcall(function() text.Opacity = spline end)
                    keys_added = keys_added + 3
                    built[#built + 1] = "BezierSpline(3 KF)"
                end

                if plate then
                    local merge = comp:AddTool("Merge", -32768, -32768)
                    if merge then
                        pcall(function() merge.Foreground = text.Output end)
                        pcall(function() merge.Background = plate.Output end)
                        plate = merge
                        merged = merged + 1
                        built[#built + 1] = "Merge"
                    end
                end
            end
        end

        if dst and plate and plate ~= src then
            if pcall(function() dst.Input = plate.Output end) then
                built[#built + 1] = "MediaOut1"
            end
        end
        comp:Unlock()
    end)

    return {
        ok = true,
        linesAdded = #lines,
        style = style,
        fusionNode = (#built > 0) and table.concat(built, " -> ") or "markers only",
        lyricNodes = merged,
        keyframes = keys_added
    }
end

-- 7. Auto-Assemble Vlog or Music Video from Media Pool Clips
Handlers.auto_edit_timeline = function(res, _fus, args)
    local pm = res:GetProjectManager()
    local proj = pm and pm:GetCurrentProject()
    if not proj then return { ok = false, error = "No project open" } end
    local mp = proj:GetMediaPool()
    local root = mp and mp:GetRootFolder()
    if not root then return { ok = false, error = "Media Pool unavailable" } end

    -- Collect all MediaPoolItem handles keyed by name or index
    local pool_items = {}
    local function collect(folder)
        local list = folder:GetClipList() or {}
        for i = 1, #list do
            pool_items[#pool_items + 1] = list[i]
        end
        local subs = folder:GetSubFolderList() or {}
        for j = 1, #subs do collect(subs[j]) end
    end
    collect(root)

    if #pool_items == 0 then
        return { ok = false, error = "Media Pool is empty — import footage into Resolve first" }
    end

    local edit_mode = args.mode or "music_video"
    local bpm = tonumber(args.bpm) or 140
    local fps = tonumber(proj:GetSetting("timelineFrameRate")) or 24
    local frames_per_beat = math.max(12, math.floor((60.0 / bpm) * fps * 2)) -- 2-beat cuts by default
    if edit_mode == "vlog" then
        frames_per_beat = fps * 4 -- 4-second talking head / b-roll segments
    end

    local plan = args.cuts or {}
    local subclips = {}
    local num_cuts = math.max(#plan, math.min(#pool_items * 2, 16))

    for i = 1, num_cuts do
        local mpi = pool_items[((i - 1) % #pool_items) + 1]
        local dur_frames = frames_per_beat
        if plan[i] and plan[i].durationFrames then
            dur_frames = tonumber(plan[i].durationFrames) or frames_per_beat
        end
        local in_frame = (i - 1) * 12
        subclips[#subclips + 1] = {
            mediaPoolItem = mpi,
            startFrame = in_frame,
            endFrame = in_frame + dur_frames
        }
    end

    local tl_name = (edit_mode == "music_video" and "AI Music Video Cut " or "AI Vlog Cut ") .. os_time()
    local new_tl = mp:CreateEmptyTimeline(tl_name)
    if new_tl then
        proj:SetCurrentTimeline(new_tl)
    end
    local appended = mp:AppendToTimeline(subclips)
    local active_tl = proj:GetCurrentTimeline()

    -- Drop beat markers on the new timeline
    if active_tl then
        local sf = active_tl:GetStartFrame() or 0
        local cursor = 0
        for i = 1, #subclips do
            local len = subclips[i].endFrame - subclips[i].startFrame
            pcall(function()
                active_tl:AddMarker(
                    sf + cursor,
                    edit_mode == "music_video" and "Fuchsia" or "Cyan",
                    edit_mode == "music_video" and ("Beat Cut #" .. i .. " (" .. bpm .. " BPM)") or ("Scene #" .. i),
                    "Auto-assembled from Media Pool",
                    1
                )
            end)
            cursor = cursor + len
        end
    end

    return {
        ok = true,
        timelineName = tl_name,
        clipsAssembled = #subclips,
        poolCount = #pool_items,
        appendedCount = type(appended) == "table" and #appended or #subclips
    }
end

-- ============================================================================
-- MAIN RESIDENT MAILBOX LOOP
-- ============================================================================

local function main()
    local res = get_resolve()
    local fus = get_fusion(res)
    if not res or not fus then
        return
    end

    local state_dir = get_state_dir(fus)
    local req_path = state_dir .. "/request.lua"
    local last_id = ""

    -- Announce active session in Fusion.prefs. The panel polls /api/status,
    -- which reads this record, so the header can name the open project.
    local project_name, timeline_name = nil, nil
    pcall(function()
        local pm = res:GetProjectManager()
        local proj = pm and pm:GetCurrentProject()
        if proj then
            project_name = proj:GetName()
            local tl = proj:GetCurrentTimeline()
            timeline_name = tl and tl:GetName() or nil
        end
    end)

    write_pref_response(fus, "Session", {
        id = "init",
        ok = true,
        bridge = BRIDGE_VERSION,
        product = res:GetProductName() or "DaVinci Resolve",
        version = res:GetVersionString() or "21.1.1",
        projectName = project_name or "No project open",
        timelineName = timeline_name or "",
        stateDir = state_dir,
        startedAt = os_time()
    })

    while true do
        wait_sec(POLL_INTERVAL)
        if file_exists(req_path) then
            local ok_load, chunk = pcall(loadfile, req_path)
            if ok_load and type(chunk) == "function" then
                if type(setfenv) == "function" then pcall(setfenv, chunk, {}) end
                local ok_exec, req = pcall(chunk)
                if ok_exec and type(req) == "table" and type(req.id) == "string" and req.id ~= last_id then
                    last_id = req.id
                    if req.op == "stop" then
                        write_pref_response(fus, "Response", { id = req.id, ok = true, stopped = true })
                        break
                    elseif req.op == "ping" then
                        write_pref_response(fus, "Response", {
                            id = req.id,
                            ok = true,
                            result = Handlers.get_project_state(res, fus, {})
                        })
                    elseif Handlers[req.op] then
                        local ok_h, result = pcall(Handlers[req.op], res, fus, req.args or {})
                        write_pref_response(fus, "Response", {
                            id = req.id,
                            ok = ok_h,
                            result = ok_h and result or nil,
                            error = (not ok_h) and tostring(result) or nil
                        })
                    else
                        write_pref_response(fus, "Response", {
                            id = req.id,
                            ok = false,
                            error = "Unknown operation: " .. tostring(req.op)
                        })
                    end
                end
            end
        end
    end
end

main()
