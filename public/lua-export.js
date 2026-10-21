/* ============================================================================
 * PulseVFX — Lua exporter
 * ----------------------------------------------------------------------------
 * Turns a panel action + a resolved recipe into a self-contained Lua snippet
 * that can be pasted into DaVinci Resolve Free 21.1.1:
 *
 *     Workspace ▸ Console ▸ Lua  →  paste  →  Enter
 *
 * This file is the single source of truth for snippet generation. It is loaded
 * by server.js (CommonJS) for the local bridge build AND straight from the page
 * in the static web build, so the browser version and the bridge version emit
 * byte-identical Lua.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LUA_EXPORT = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function luaQuote(value) {
    return '"' + String(value == null ? '' : value)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r') + '"';
  }

  var HEADER = [
    '-- Paste in DaVinci Resolve Free 21.1.1: Workspace > Console > Lua',
    '-- (Resolve Studio not required.) Press Enter after pasting.'
  ].join('\n');

  function applyVfx(payload) {
    var preset = payload.presetName || 'TD Simplex UV Displace TOP';
    var category = payload.category || 'TouchDesigner TOPs';
    var intensity = Number(payload.intensity == null ? 85 : payload.intensity);
    var keyframes = Array.isArray(payload.keyframes) ? payload.keyframes : [];
    var recipe = payload.recipe || null;
    var chain = (recipe && Array.isArray(recipe.chain)) ? recipe.chain : [];
    var markerColor = (recipe && recipe.marker) || 'Purple';
    var fps = Number(payload.fps) || 24;

    var lines = [];
    var prevVar = null;      // last created node (bg/fg semantics)
    var keyVar = null;
    var keyInput = 'Gain';
    var keyScale = 1;
    var graphNames = [];

    // `img` is emitted as a live Lua variable so generators (Bitmap, TextPlus,
    // FastNoise) drop out of the image path instead of blacking the frame out.
    var srcVar = 'src';
    chain.forEach(function (step, i) {
      var v = 'n' + (i + 1);
      graphNames.push(step.tool);
      lines.push('        local ' + v + ' = comp:AddTool(' + luaQuote(step.tool) + ', -32768, -32768)');
      lines.push('        if ' + v + ' then');
      if (step.set && typeof step.set === 'object') {
        Object.keys(step.set).forEach(function (k) {
          var val = step.set[k];
          var lit = typeof val === 'number' ? String(val) : luaQuote(String(val));
          lines.push('            pcall(function() ' + v + '.' + k + ' = ' + lit + ' end)');
        });
      }
      if (step.fg && prevVar) {
        lines.push('            if pcall(function() ' + v + '.Foreground = ' + prevVar + '.Output end) then img = ' + v + ' end');
      } else if (step.source) {
        lines.push('            if pcall(function() ' + v + '.Background = ' + srcVar + '.Output end) then img = ' + v + ' end');
      } else if (step.bg && prevVar) {
        lines.push('            if pcall(function() ' + v + '.Background = ' + prevVar + '.Output end) then img = ' + v + ' end');
      } else {
        lines.push('            if img and pcall(function() ' + v + '.Input = img.Output end) then img = ' + v + ' end');
      }
      lines.push('        end');
      if (step.key) {
        keyVar = v;
        keyInput = step.input || 'Gain';
        keyScale = Number(step.scale) || 1;
      }
      prevVar = v;
    });

    var kfBody = keyframes.length
      ? keyframes.map(function (kf) {
          var frame = Math.round((Number(kf.timeSec) || 0) * fps);
          var val = (Number(kf.value) || 0) / 100 * keyScale;
          return '            [' + frame + '] = { ' + val.toFixed(4) + ' }';
        }).join(',\n')
      : '            [0] = { 0.0000 },\n'
        + '            [' + Math.round(fps / 2) + '] = { ' + (intensity / 100 * keyScale).toFixed(4) + ' },\n'
        + '            [' + fps + '] = { 0.0000 }';

    var keyBlock = keyVar
      ? '        local spline = comp:BezierSpline()\n'
        + '        ' + keyVar + '.' + keyInput + ' = spline\n'
        + '        spline:SetKeyFrames({\n' + kfBody + '\n        })'
      : '        -- (no keyframable input in this graph)';

    return HEADER + '\n'
      + '-- "' + preset + '" (' + category + ') at ' + intensity + '% with '
      + (keyframes.length || 3) + ' BezierSpline keyframes\n'
      + '-- native graph: MediaIn1 -> ' + (graphNames.join(' -> ') || '(none)') + ' -> MediaOut1\n'
      + 'local proj = resolve:GetProjectManager():GetCurrentProject()\n'
      + 'local tl = proj and proj:GetCurrentTimeline()\n'
      + 'local item = tl and (tl:GetCurrentVideoItem() or (tl:GetItemListInTrack("video", 1) or {})[1])\n'
      + 'if item then\n'
      + '    local comp = item:GetFusionCompCount() > 0 and item:GetFusionCompByIndex(1) or item:AddFusionComp()\n'
      + '    if comp then\n'
      + '        comp:Lock()\n'
      + '        local src = comp:FindTool("MediaIn1")\n'
      + '        local dst = comp:FindTool("MediaOut1")\n'
      + '        local img = src\n'
      + lines.join('\n') + '\n'
      + keyBlock + '\n'
      + '        if dst and img and img ~= src then pcall(function() dst.Input = img.Output end) end\n'
      + '        comp:Unlock()\n'
      + '    end\n'
      + '    item:AddMarker(12, ' + luaQuote(markerColor) + ', ' + luaQuote('VFX: ' + preset) + ', '
      + luaQuote(category + ' @ ' + intensity + '%') + ', 1)\n'
      + 'end';
  }

  function cutSilences(payload) {
    var segs = payload.segments || [];
    var rows = segs.slice(0, 40).map(function (s) {
      return '    { mediaPoolItem = mpi, startFrame = ' + (Number(s.startFrame) || 0)
        + ', endFrame = ' + (Number(s.endFrame) || 0) + ' }';
    }).join(',\n');
    return HEADER + '\n'
      + '-- Rebuilds the timeline with ' + segs.length + ' speech segments (silences removed)\n'
      + 'local proj = resolve:GetProjectManager():GetCurrentProject()\n'
      + 'local mp = proj:GetMediaPool()\n'
      + 'local tl = proj:GetCurrentTimeline()\n'
      + 'local items = tl:GetItemListInTrack("video", 1) or {}\n'
      + 'if #items > 0 then\n'
      + '    local mpi = items[1]:GetMediaPoolItem()\n'
      + '    local newTl = mp:CreateEmptyTimeline(tl:GetName() .. " - Silence Cut")\n'
      + '    proj:SetCurrentTimeline(newTl)\n'
      + '    mp:AppendToTimeline({\n' + rows + '\n    })\n'
      + 'end';
  }

  function captions(payload) {
    var lines = (payload.lines || []).slice(0, 16);
    var style = payload.style || 'Kinetic Pop';
    var intensity = Number(payload.intensity == null ? 100 : payload.intensity);
    var fps = Number(payload.fps) || 24;

    var markerCalls = lines.map(function (l) {
      var f = Math.round((Number(l.startSec) || 0) * 24);
      var dur = Math.max(1, Math.round(((Number(l.endSec) || 2) - (Number(l.startSec) || 0)) * 24));
      return '    tl:AddMarker(sf + ' + f + ', "Yellow", ' + luaQuote(l.text) + ', '
        + luaQuote('Style: ' + style) + ', ' + dur + ')';
    }).join('\n');

    var nodeLines = [];
    lines.forEach(function (l, i) {
      var t0 = Number(l.startSec) || i * 2;
      var t1 = Math.max(t0 + 0.4, Number(l.endSec) || t0 + 2);
      var fIn = Math.max(0, Math.round((t0 - 0.12) * fps));
      var fOn = Math.max(fIn + 1, Math.round(t0 * fps));
      var fOut = Math.max(fOn + 1, Math.round(t1 * fps));
      var peak = Math.min(1, Math.max(0.05, intensity / 100)).toFixed(3);
      var n = i + 1;
      nodeLines.push(
        '        local t' + n + ' = comp:AddTool("TextPlus", -32768, -32768)\n'
        + '        if t' + n + ' then\n'
        + '            pcall(function() t' + n + '.Text = ' + luaQuote(String(l.text || 'Lyric ' + n)) + ' end)\n'
        + '            pcall(function() t' + n + '.Size = 0.110 end)\n'
        + '            pcall(function() t' + n + '.Style = "Bold" end)\n'
        + '            local s' + n + ' = comp:BezierSpline()\n'
        + '            s' + n + ':SetKeyFrames({ [' + fIn + '] = { 0 }, [' + fOn + '] = { ' + peak
        + ' }, [' + fOut + '] = { 0 } })\n'
        + '            pcall(function() t' + n + '.Opacity = s' + n + ' end)\n'
        + '            local m' + n + ' = comp:AddTool("Merge", -32768, -32768)\n'
        + '            if m' + n + ' then\n'
        + '                pcall(function() m' + n + '.Foreground = t' + n + '.Output end)\n'
        + '                pcall(function() m' + n + '.Background = plate.Output end)\n'
        + '                plate = m' + n + '\n'
        + '            end\n'
        + '        end');
    });

    return HEADER + '\n'
      + '-- LYRC "' + style + '" — ' + lines.length + ' kinetic type cards, '
      + (lines.length * 3) + ' native BezierSpline keys\n'
      + '-- each cue is a TextPlus merged over MediaIn1, spliced into MediaOut1\n'
      + 'local proj = resolve:GetProjectManager():GetCurrentProject()\n'
      + 'local tl = proj and proj:GetCurrentTimeline()\n'
      + 'local sf = tl and tl:GetStartFrame() or 0\n'
      + 'if tl then\n' + markerCalls + '\nend\n'
      + 'local item = tl and (tl:GetCurrentVideoItem() or (tl:GetItemListInTrack("video", 1) or {})[1])\n'
      + 'if item then\n'
      + '    local comp = item:GetFusionCompCount() > 0 and item:GetFusionCompByIndex(1) or item:AddFusionComp()\n'
      + '    if comp then\n'
      + '        comp:Lock()\n'
      + '        local src = comp:FindTool("MediaIn1")\n'
      + '        local dst = comp:FindTool("MediaOut1")\n'
      + '        local plate = src\n'
      + nodeLines.join('\n') + '\n'
      + '        if dst and plate and plate ~= src then pcall(function() dst.Input = plate.Output end) end\n'
      + '        comp:Unlock()\n'
      + '    end\n'
      + 'end';
  }

  function autoEdit(payload) {
    var mode = payload.mode || 'music_video';
    var bpm = Number(payload.bpm) || 140;
    var fps = Number(payload.fps) || 24;
    var framesPerCut = mode === 'music_video'
      ? Math.max(12, Math.round((60 / bpm) * fps * 2))
      : 96;
    return HEADER + '\n'
      + '-- Auto-assembles a ' + (mode === 'music_video' ? bpm + ' BPM Music Video' : 'Talking Head / Vlog') + ' cut from the Media Pool\n'
      + 'local proj = resolve:GetProjectManager():GetCurrentProject()\n'
      + 'local mp = proj:GetMediaPool()\n'
      + 'local clips = mp:GetRootFolder():GetClipList() or {}\n'
      + 'if #clips > 0 then\n'
      + '    local tl = mp:CreateEmptyTimeline(' + luaQuote(mode === 'music_video'
        ? 'AI Music Video (' + bpm + ' BPM)' : 'AI Vlog Rough Cut') + ')\n'
      + '    proj:SetCurrentTimeline(tl)\n'
      + '    local subclips = {}\n'
      + '    for i = 1, math.min(#clips * 2, 16) do\n'
      + '        local c = clips[((i - 1) % #clips) + 1]\n'
      + '        subclips[#subclips + 1] = { mediaPoolItem = c, startFrame = (i - 1) * 10, endFrame = (i - 1) * 10 + '
      + framesPerCut + ' }\n'
      + '    end\n'
      + '    mp:AppendToTimeline(subclips)\n'
      + 'end';
  }

  function generate(action, payload) {
    var p = payload || {};
    if (action === 'apply_vfx' || action === 'batch_ai_vfx') return applyVfx(p);
    if (action === 'cut_silences') return cutSilences(p);
    if (action === 'add_captions_lyrics') return captions(p);
    if (action === 'auto_edit_timeline') return autoEdit(p);
    return '-- Resolve 21.1.1 Lua Action: ' + action;
  }

  // Which actions produce something worth pasting into the Console
  var CONSOLE_ACTIONS = {
    apply_vfx: true,
    add_captions_lyrics: true,
    cut_silences: true,
    auto_edit_timeline: true,
    batch_ai_vfx: true
  };

  return {
    generate: generate,
    luaQuote: luaQuote,
    consoleActions: CONSOLE_ACTIONS,
    isConsoleAction: function (action) { return !!CONSOLE_ACTIONS[action]; }
  };
});
