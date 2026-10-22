-- ============================================================================
-- Mock DaVinci Resolve Free 21.1.1 / Fusion environment for bridge tests
-- ============================================================================
-- Runs under LuaJIT 2.1 (the exact VM Resolve Free embeds) so the bridge is
-- exercised against the same language semantics it will meet in the host.
--
-- Deliberately mimics the RESOLVE FREE 21.1.1 sandbox:
--   * `io` and `os.execute` are nil
--   * `require` and `package` are nil
--   * `loadfile`, `bmd.*`, `resolve`, `fusion` exist
-- Anything the bridge touches outside that surface is a real-world failure and
-- should fail here first.
-- ============================================================================

local M = {
  calls = {},
  prefs = {},
  responses = {},
  caps = {},
  fail_save_prefs_times = 0
}

local function rec(name, detail)
  M.calls[#M.calls + 1] = detail and (name .. " " .. detail) or name
end
M.rec = rec

-- Fusion generators have no image input; wiring one is an error in Resolve, so
-- the mock raises the same way and the bridge's pcall sees the failure.
local GENERATORS = {
  Bitmap = true, Background = true, TextPlus = true, Text = true,
  FastNoise = true, ColorSolid = true, Rectangle = true, Ellipse = true
}

local function str_serial(n) return "_" .. tostring(n) end

local function new_tool(comp, tool_type, x, y)
  -- raw fields, because the metatable's __index returns a callable proxy for any
  -- unknown key: a missing flag would read as truthy and hide the tool
  local t = { __type = tool_type, __inputs = {}, Output = { __out = tool_type },
              attrs = { TOOLS_Type = tool_type }, __deleted = false }
  local serial = (comp.__serial or 0) + 1
  comp.__serial = serial
  t.attrs.TOOLS_Name = tool_type .. str_serial(serial)
  t.Name = t.attrs.TOOLS_Name
  -- Fusion's Output objects know which tool produced them. pvfx_tail() reads
  -- MediaOut1.Input:GetTool() to find the end of the stack.
  t.Output.GetTool = function() return t end
  t.SetInput = function(self, name, value) self.__inputs[name] = value; rec("SetInput", tool_type .. "." .. tostring(name)); return true end
  t.GetInput = function(self, name) return self.__inputs[name] end
  t.SetAttrs = function(self, tbl)
    for k, v in pairs(tbl or {}) do self.attrs[k] = v end
    if self.attrs.TOOLS_Name then
      self.Name = self.attrs.TOOLS_Name
      if comp.by_name then comp.by_name[self.attrs.TOOLS_Name] = self end
    end
    rec("tool:SetAttrs", tostring(tool_type) .. "=" .. tostring(self.attrs.TOOLS_Name))
    return true
  end
  t.GetAttrs = function(self) return self.attrs end
  t.Delete = function(self)
    rawset(self, "__deleted", true)
    for _, other in ipairs(comp.tools) do
      for name, val in pairs(other.__inputs) do
        if val == self.Output then other.__inputs[name] = nil end
      end
    end
    rec("tool:Delete", tool_type)
    return true
  end
  t.__index_fallback = true
  setmetatable(t, {
    __newindex = function(tbl, k, v)
      if k == "Input" and GENERATORS[tool_type] then
        error(tool_type .. " has no Input")
      end
      if type(v) == "table" and v.__out then
        rec("Link", tool_type .. "." .. tostring(k) .. "<-" .. tostring(v.__out))
        comp.links[#comp.links + 1] = tool_type .. "." .. tostring(k) .. "<-" .. tostring(v.__out)
      end
      -- Image inputs stay in __inputs only. Fusion lets you re-assign the same
      -- input repeatedly, which is exactly how an effect is stacked, so the mock
      -- must not freeze the first value as a raw field (that would skip
      -- __newindex on the second assignment).
      if tbl.__inputs and type(v) == "table" and v.__out then
        tbl.__inputs[k] = v
        return
      end
      if tbl.__inputs then tbl.__inputs[k] = v end
      rawset(tbl, k, v)
      rec("ToolSet", tool_type .. "." .. tostring(k))
    end,
    __index = function(tbl, k)
      local v = rawget(tbl, k)
      if v ~= nil then return v end
      if tbl.__inputs[k] ~= nil then return tbl.__inputs[k] end
      if k == "Output" then return { __out = tool_type } end
      -- Unknown members act like Fusion methods (Paint:ApplyBrush, Tracker:Track…):
      -- keep them addressable and record the call so the harness can assert on it.
      local proxy = { __tool = tool_type, __input = k }
      setmetatable(proxy, {
        __call = function(_self, ...)
          rec("Method", tool_type .. ":" .. tostring(k) .. "(" .. tostring(select("#", ...)) .. ")")
          return true
        end
      })
      rawset(tbl, k, proxy)
      return proxy
    end
  })
  comp.tools[#comp.tools + 1] = t
  if not comp.by_name then comp.by_name = {} end
  comp.by_name[tool_type] = comp.by_name[tool_type] or t
  return t
end

local function new_comp(item)
  local comp = {
    __type = "Composition",
    tools = {},
    branches = {},
    splines = {},
    links = {},
    by_name = {},
    locked = false
  }
  comp.Lock = function(self) rec("comp:Lock"); self.locked = true; return true end
  comp.Unlock = function(self) rec("comp:Unlock"); self.locked = false; return true end
  comp.AddTool = function(self, tool_type, x, y)
    local forbidden = (M.caps.forbid and M.caps.forbid[tool_type])
      or (type(_G.MOCK_FORBID) == "table" and _G.MOCK_FORBID[tool_type])
    if forbidden then
      rec("comp:AddTool FAILED", tool_type)
      return nil
    end
    rec("comp:AddTool", tool_type)
    return new_tool(self, tool_type, x, y)
  end
  comp.FindTool = function(self, name)
    if name == "MediaIn1" or name == "MediaIn" then return self.media_in end
    if name == "MediaOut1" or name == "MediaOut" then return self.media_out end
    return self.by_name[name]
  end
  comp.GetToolList = function(self, selected, regid)
    local list = {}
    for _, tool in ipairs(self.tools) do
      if not rawget(tool, "__deleted") then list[#list + 1] = tool end
    end
    return list
  end
  comp.BezierSpline = function(self)
    local sp = { __type = "BezierSpline", frames = {} }
    sp.SetKeyFrames = function(self2, tbl)
      local n = 0
      for k, v in pairs(tbl) do
        self2.frames[k] = v
        n = n + 1
      end
      rec("spline:SetKeyFrames", tostring(n) .. " keys")
      return true
    end
    comp.splines[#comp.splines + 1] = sp
    rec("comp:BezierSpline")
    return sp
  end

  -- Resolve pre-populates a clip comp with a source and an output node
  comp.media_in = new_tool(comp, "MediaIn", -400, 0)
  comp.media_out = new_tool(comp, "MediaOut", 400, 0)
  comp.media_in.__out = "MediaIn1"
  comp.by_name["MediaIn1"] = comp.media_in
  comp.by_name["MediaOut1"] = comp.media_out
  return comp
end

local function new_item(name, start_f, end_f)
  local item = {
    __type = "TimelineItem",
    name = name,
    startFrame = start_f,
    endFrame = end_f,
    markers = {},
    props = {},
    comps = {},
    clipColor = "Blue"
  }
  item.GetName = function(self) return self.name end
  item.GetStart = function(self) return self.startFrame end
  item.GetEnd = function(self) return self.endFrame end
  item.GetDuration = function(self) return self.endFrame - self.startFrame end
  item.GetClipColor = function(self) return self.clipColor end
  item.SetProperty = function(self, k, v) self.props[k] = v; rec("item:SetProperty", k .. "=" .. tostring(v)); return true end
  item.GetFusionCompCount = function(self) return #self.comps end
  item.AddFusionComp = function(self)
    local c = new_comp(self)
    self.comps[#self.comps + 1] = c
    rec("item:AddFusionComp")
    return c
  end
  item.GetFusionCompByIndex = function(self, i) return self.comps[i] end
  item.GetMediaPoolItem = function(self) return M.pool_items and M.pool_items[1] or nil end
  item.AddMarker = function(self, frame, color, name2, note, dur)
    self.markers[#self.markers + 1] = { frame = frame, color = color, name = name2, note = note, dur = dur }
    rec("item:AddMarker", tostring(color) .. " @" .. tostring(frame))
    return true
  end
  return item
end
M.new_item = new_item

local function new_timeline(name, items)
  local tl = {
    __type = "Timeline",
    name = name,
    items = items or {},
    markers = {},
    startFrame = 0
  }
  tl.GetName = function(self) return self.name end
  tl.GetTrackCount = function(self, kind)
    if kind == "audio" then return 2 end
    if kind == "subtitle" then return 0 end
    return 1
  end
  tl.GetItemListInTrack = function(self, kind, idx)
    if kind == "video" and (idx == 1 or idx == nil) then return self.items end
    return {}
  end
  tl.GetMarkers = function(self) return self.markers end
  tl.AddMarker = function(self, frame, color, name2, note, dur)
    self.markers[frame] = { color = color, name = name2, note = note, duration = dur }
    rec("tl:AddMarker", tostring(color) .. " @" .. tostring(frame) .. " " .. tostring(name2))
    return true
  end
  tl.GetCurrentVideoItem = function(self) return self.items[1] end
  tl.GetStartFrame = function(self) return self.startFrame end
  tl.GetCurrentFrame = function(self) return self.startFrame + 4 end
  tl.GetTrackName = function(self, kind, idx) return tostring(kind) .. " " .. tostring(idx) end
  tl.GetStartTimecode = function(self) return "01:00:00:00" end
  tl.GetCurrentTimecode = function(self) return "01:00:04:12" end
  tl.GetName = function(self) return self.name end
  return tl
end

local function new_folder(name, clips, subs)
  local f = { __type = "Folder", name = name, clips = clips or {}, subs = subs or {} }
  f.GetName = function(self) return self.name end
  f.GetClipList = function(self) return self.clips end
  f.GetSubFolderList = function(self) return self.subs end
  return f
end

local function new_media_pool_item(name, frames)
  local c = {
    __type = "MediaPoolItem",
    name = name,
    props = {
      ["Clip Name"] = name,
      ["Duration"] = "00:00:06:00",
      ["Frames"] = tostring(frames or 144),
      ["FPS"] = "24",
      ["Resolution"] = "3840x2160",
      ["File Path"] = "/Volumes/Footage/" .. name .. ".mov",
      ["Type"] = "Video + Audio"
    }
  }
  c.GetName = function(self) return self.name end
  c.GetUniqueId = function(self) return "uid_" .. self.name end
  c.GetClipProperty = function(self, key)
    if key == nil then return self.props end
    return self.props[key]
  end
  c.GetClipColor = function(self) return "Blue" end
  return c
end
M.new_media_pool_item = new_media_pool_item

-- ---------------------------------------------------------------- build world
function M.install()
  local runtime = _G
  -- keep a reference before we strip io to emulate the Free sandbox
  M._open = io and io.open

  M.pool_items = { new_media_pool_item("A001_C003", 192), new_media_pool_item("A001_C007", 240) }

  local root = new_folder("Master", M.pool_items, { new_folder("B-Roll", { new_media_pool_item("B002_C001", 96) }, {}) })

  local timeline = new_timeline("Timeline 1", {
    new_item("A001_C003", 0, 96),
    new_item("A001_C007", 96, 240)
  })
  M.timelines = { timeline }
  M.current_timeline = timeline

  local media_pool = {
    __type = "MediaPool",
    GetRootFolder = function(self) return root end,
    CreateEmptyTimeline = function(self, name)
      local tl = new_timeline(name, {})
      M.timelines[#M.timelines + 1] = tl
      rec("mp:CreateEmptyTimeline", name)
      return tl
    end,
    AppendToTimeline = function(self, subclips)
      rec("mp:AppendToTimeline", tostring(#subclips) .. " subclips")
      local placed = {}
      for i = 1, #subclips do
        placed[i] = subclips[i].mediaPoolItem
        M.current_timeline.items[#M.current_timeline.items + 1] =
          new_item("appended_" .. i, subclips[i].startFrame, subclips[i].endFrame)
      end
      return placed
    end
  }

  local project_settings = {
    timelineFrameRate = "24",
    timelineResolutionWidth = "1920",
    timelineResolutionHeight = "1080"
  }
  local project = {
    __type = "Project",
    GetName = function(self) return "Client Music Video" end,
    -- Resolve stores these as strings; the mock does the same so a handler that
    -- writes numbers instead of strings is caught by the readback.
    SetSetting = function(self, k, v)
      project_settings[k] = tostring(v)
      rec("proj:SetSetting", tostring(k) .. "=" .. tostring(v))
      return true
    end,
    GetSetting = function(self, k)
      if project_settings[k] ~= nil then return project_settings[k] end
      if k == "timelineFrameRate" then return "24" end
      return nil
    end,
    GetCurrentTimeline = function(self) return M.current_timeline end,
    SetCurrentTimeline = function(self, tl) M.current_timeline = tl; rec("proj:SetCurrentTimeline", tl:GetName()); return true end,
    GetMediaPool = function(self) return media_pool end
  }

  local project_manager = {
    GetCurrentProject = function(self) return project end
  }

  local resolve = {
    __type = "Resolve",
    GetProductName = function(self) return "DaVinci Resolve" end,
    GetVersionString = function(self) return "21.1.1" end,
    GetProjectManager = function(self) return project_manager end,
    Fusion = function(self) return M.fusion end
  }
  M.resolve = resolve
  M.project = project
  M.media_pool = media_pool
  M.project_manager = project_manager

  local fusion = {
    __type = "Fusion",
    SetPrefs = function(self, key, value)
      M.prefs[key] = value
      if key:sub(-8) == "Response" then
        M.responses[#M.responses + 1] = value
        local colon = tostring(value):find(":", 1, true)
        if colon then M.last_resp_id = tostring(value):sub(1, colon - 1) end
      end
      rec("fusion:SetPrefs", key)
      return true
    end,
    SavePrefs = function(self)
      M.persist()
      if M.fail_save_prefs_times > 0 then
        M.fail_save_prefs_times = M.fail_save_prefs_times - 1
        rec("fusion:SavePrefs FAILED")
        return false
      end
      rec("fusion:SavePrefs")
      return true
    end,
    MapPath = function(self, p)
      local base = M.profile_base or "/Users/editor"
      return base .. "/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/"
    end
  }
  M.fusion = fusion

  M.wait_count = 0
  local bmd = {
    fileexists = function(p) if M.fileexists_hook then return M.fileexists_hook(p) end; return true end,
    wait = function(s)
      M.wait_count = M.wait_count + 1
      if M.wait_hook then M.wait_hook(s) end
      return true
    end,
    scriptapp = function(name) return resolve end
  }
  M.bmd = bmd

  -- Hard-stop escape hatch for the test harness: once the wait budget is blown,
  -- make loadfile hand back a stop command wherever the bridge looks, so a
  -- mis-targeted mailbox fails the test instead of looping forever.
  local real_loadfile = loadfile
  loadfile = function(path)
    if M.force_stop_after and M.wait_count > M.force_stop_after then
      M.forced_stop = true
      return function() return { id = "forced_stop", op = "stop", args = {} } end
    end
    return real_loadfile(path)
  end
  runtime.loadfile = loadfile

  runtime.resolve = resolve
  runtime.fusion = fusion
  runtime.bmd = bmd
  -- handles the Python harness asserts against
  runtime.__mock_prefs = M.prefs
  runtime.__mock_calls = M.calls
  runtime.__mock_responses = M.responses
  runtime.__mock_tbl = M

  -- Resolve Free 21.1.1 sandbox: these are gone
  runtime.io = nil
  runtime.require = nil
  runtime.package = nil
  runtime.dofile = runtime.dofile            -- kept: used by the harness only
  if type(runtime.os) == "table" then
    runtime.os.execute = nil
    runtime.os.remove = nil
    runtime.os.rename = nil
    runtime.os.tmpname = nil
  end

  return M
end

-- Persist the prefs table the way Resolve flushes Fusion.prefs to disk
function M.persist()
  if not M.prefs_path or not M._open then return end
  local f = M._open(M.prefs_path, "w")
  if not f then return end
  f:write("{\n\tGlobal = {\n")
  for k, v in pairs(M.prefs) do
    local sub = tostring(k):gsub("^Global%\\.", "")
    f:write(string.format('\t\t%s = "%s",\n', sub, tostring(v)))
  end
  f:write("\t},\n}\n")
  f:close()
end

-- Decode "id:hex" prefs payload back into the JSON string
function M.decode_pref(value)
  if type(value) ~= "string" then return nil end
  local colon = value:find(":", 1, true)
  if not colon then return nil end
  local id = value:sub(1, colon - 1)
  local hex = value:sub(colon + 1)
  local out = {}
  for i = 1, #hex, 2 do
    out[#out + 1] = string.char(tonumber(hex:sub(i, i + 1), 16))
  end
  return id, table.concat(out)
end

return M
