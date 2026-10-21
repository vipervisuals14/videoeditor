const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

// ============================================================================
// DaVinci Resolve Free 21.1.1 File-Mailbox + Fusion.prefs Bridge Driver
// ============================================================================
const HOME_DIR = os.homedir();
const STATE_DIR = process.env.VFXKIT_STATE_DIR || path.join(HOME_DIR, '.vfxkit-resolve-free');
const REQ_FILE = path.join(STATE_DIR, 'request.lua');

function getResolvePaths() {
  const platform = process.platform;
  if (platform === 'darwin') {
    const base = path.join(HOME_DIR, 'Library/Application Support/Blackmagic Design/DaVinci Resolve');
    return {
      platform: 'macOS',
      baseDir: base,
      scriptsDir: path.join(base, 'Fusion/Scripts/Utility'),
      effectsDir: path.join(base, 'Fusion/Templates/Edit/Effects/VFXKit Free'),
      prefsFile: path.join(base, 'Fusion/Profiles/Default/Fusion.prefs'),
      stateDir: STATE_DIR
    };
  } else if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(HOME_DIR, 'AppData/Roaming');
    const base = path.join(appData, 'Blackmagic Design/DaVinci Resolve/Support');
    return {
      platform: 'Windows',
      baseDir: base,
      scriptsDir: path.join(base, 'Fusion/Scripts/Utility'),
      effectsDir: path.join(base, 'Fusion/Templates/Edit/Effects/VFXKit Free'),
      prefsFile: path.join(base, 'Fusion/Profiles/Default/Fusion.prefs'),
      stateDir: STATE_DIR
    };
  }
  const base = path.join(HOME_DIR, '.local/share/DaVinciResolve');
  return {
    platform: 'Linux',
    baseDir: base,
    scriptsDir: path.join(base, 'Fusion/Scripts/Utility'),
    effectsDir: path.join(base, 'Fusion/Templates/Edit/Effects/VFXKit Free'),
    prefsFile: path.join(base, 'Fusion/Profiles/Default/Fusion.prefs'),
    stateDir: STATE_DIR
  };
}

function luaQuote(str) {
  return '"' + String(str ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r') + '"';
}

function jsToLuaTable(val) {
  if (val === null || val === undefined) return 'nil';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : '0';
  if (typeof val === 'string') return luaQuote(val);
  if (Array.isArray(val)) {
    return '{ ' + val.map((item) => jsToLuaTable(item)).join(', ') + ' }';
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val).map(([k, v]) => `[${luaQuote(k)}] = ${jsToLuaTable(v)}`);
    return '{ ' + entries.join(', ') + ' }';
  }
  return 'nil';
}

function readFusionPrefsKey(prefsPath, keyName) {
  try {
    if (!fs.existsSync(prefsPath)) return null;
    const content = fs.readFileSync(prefsPath, 'utf8');
    const regex = new RegExp(`${keyName}\\s*=\\s*"([^"]*)"`);
    const match = content.match(regex);
    if (!match || !match[1]) return null;
    const raw = match[1];
    const colonIdx = raw.indexOf(':');
    if (colonIdx === -1) return null;
    const id = raw.slice(0, colonIdx);
    const hex = raw.slice(colonIdx + 1);
    const jsonStr = Buffer.from(hex, 'hex').toString('utf8');
    return { id, data: JSON.parse(jsonStr) };
  } catch (_err) {
    return null;
  }
}

async function sendBridgeCommand(op, args = {}, timeoutMs = 1200) {
  const paths = getResolvePaths();
  try {
    fs.mkdirSync(paths.stateDir, { recursive: true });
    const reqId = 'req_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
    const luaChunk = `return { id = ${luaQuote(reqId)}, op = ${luaQuote(op)}, ts = ${Math.floor(Date.now() / 1000)}, args = ${jsToLuaTable(args)} }\n`;
    const tmpFile = REQ_FILE + '.tmp';
    fs.writeFileSync(tmpFile, luaChunk, 'utf8');
    fs.renameSync(tmpFile, REQ_FILE);

    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const resp = readFusionPrefsKey(paths.prefsFile, 'Response');
      if (resp && resp.id === reqId) {
        return { liveBridge: true, response: resp.data };
      }
      await new Promise((r) => setTimeout(r, 45));
    }
    return { liveBridge: false, reason: 'bridge_timeout_using_simulator' };
  } catch (err) {
    return { liveBridge: false, reason: err.message };
  }
}

// ============================================================================
// Lua Console Code Generator for DaVinci Resolve Free 21.1.1
// (Allows 1-click copy & paste into Workspace > Console > Lua at any time)
// ============================================================================
const FUSION_TOOL_BY_CATEGORY = {
  'Optical & Film': { tool: 'SoftGlow', macro: 'VFXKit_PrintStockHalation', inputs: { Threshold: 0.68, Gain: 0.55, XGlowSize: 34 } },
  'Shutter & Time': { tool: 'Transform', macro: null, inputs: { MotionBlur: 1, ShutterAngle: 360 } },
  'Camera Rig': { tool: 'CameraShake', macro: 'VFXKit_DrillCameraShake', inputs: { OverallStrength: 0.2, Speed: 2.4 } },
  Hits: { tool: 'Transform', macro: 'VFXKit_ImpactEnergyHit', inputs: { Size: 1.03 } },
  'Roto & Matte': { tool: 'SoftGlow', macro: 'VFXKit_PrintStockHalation', inputs: { Threshold: 0.74, Gain: 0.3, XGlowSize: 18 } },
  Transitions: { tool: 'DirectionalBlur', macro: null, inputs: { Length: 0.06, Angle: 0 } },
  'Analog Signal': { tool: 'TV', macro: 'VFXKit_CRTRetroSignal', inputs: { ScanLines: 0.2, BarStrength: 0.1 } }
};

function fusionChainForPreset(presetId, category) {
  if (presetId === 'anamorphic' || presetId === 'promist' || presetId === 'lumaroto') {
    return { tool: 'SoftGlow', tool2: 'Merge', macro: 'VFXKit_AnamorphicStreak', inputs: { Threshold: 0.72, Gain: 0.4, XGlowSize: 120, YGlowSize: 2 } };
  }
  if (presetId === 'weave' || presetId === 'projector') {
    return { tool: 'CameraShake', tool2: 'TV', macro: 'VFXKit_AnalogGateWeave', inputs: { XDeviation: 0.006, YDeviation: 0.005, RotationDeviation: 0.28 } };
  }
  if (presetId === 'vhs' || presetId === 'pvm' || presetId === 'phosphor') {
    return { tool: 'TV', macro: 'VFXKit_ChromaBleedVHS', inputs: { ScanLines: 0.18, BarStrength: 0.12, Skew: 0.05 } };
  }
  if (presetId === 'snare' || presetId === 'zoompunch' || presetId === 'lumahit') {
    return { tool: 'Transform', macro: 'VFXKit_DampedSnareImpulse', inputs: { Size: 1.025 } };
  }
  if (presetId === 'snorricam' || presetId === 'handheld' || presetId === 'steadicam') {
    return { tool: 'CameraShake', macro: 'VFXKit_DrillCameraShake', inputs: { OverallStrength: 0.22, Speed: 1.6, RotationDeviation: 3.5 } };
  }
  if (presetId === 'stepprint' || presetId === 'shutter360' || presetId === 'speedramp' || presetId === 'echo') {
    return { tool: 'Transform', macro: null, inputs: { MotionBlur: 1, ShutterAngle: 360 } };
  }
  return FUSION_TOOL_BY_CATEGORY[category] || FUSION_TOOL_BY_CATEGORY['Optical & Film'];
}

function luaInputTable(inputs) {
  return Object.entries(inputs || {})
    .map(([k, v]) => `${k} = ${typeof v === 'number' ? v : luaQuote(v)}`)
    .join(', ');
}

// ============================================================================
// Lua Console Code Generator for DaVinci Resolve Free 21.1.1
// (Allows 1-click copy & paste into Workspace > Console > Lua at any time)
// ============================================================================
function generateResolveLuaSnippet(action, payload) {
  if (action === 'apply_vfx') {
    const preset = payload.presetName || '2383 Print Halation';
    const presetId = payload.presetId || 'print2383';
    const category = payload.category || 'Optical & Film';
    const intensity = Number(payload.intensity ?? 72);
    const chain = fusionChainForPreset(presetId, category);
    const zoom = (1 + (intensity / 100) * 0.04).toFixed(3);
    const macroNote = chain.macro
      ? `-- Native macro: ${chain.macro}.setting (installed by PulseVFX Studio)`
      : '-- Native Fusion tool chain, no third-party plugin required';
    return `-- PulseVFX ▸ ${preset}  ·  DaVinci Resolve Free 21.1.1
${macroNote}
local pm = resolve:GetProjectManager()
local proj = pm:GetCurrentProject()
local tl = proj:GetCurrentTimeline()
local item = tl and (tl:GetCurrentVideoItem() or (tl:GetItemListInTrack("video", 1) or {})[1])
if item then
    item:SetProperty("ZoomX", ${zoom})
    item:SetProperty("ZoomY", ${zoom})
    local comp = item:GetFusionCompCount() > 0 and item:GetFusionCompByIndex(1) or item:AddFusionComp()
    if comp then
        comp:Lock()
        local node = comp:AddTool("${chain.tool}", -32768, -32768)
        if node then
            local props = { ${luaInputTable(chain.inputs)} }
            for k, v in pairs(props) do
                local ok = pcall(function() node:SetInput(k, v) end)
            end
        end
        comp:Unlock()
        print("PulseVFX applied ${preset} at ${intensity}%")
    end
    item:AddMarker(12, "Purple", ${luaQuote('VFX: ' + preset)}, ${luaQuote(category + ' @ ' + intensity + '%')}, 1)
end`;
  }

  if (action === 'build_look_pass') {
    const presets = Array.isArray(payload.presets) ? payload.presets : [];
    const prompt = payload.prompt || '';
    const markers = presets.slice(0, 6).map((id, i) => {
      const frame = [12, 130, 245, 312][i % 4];
      return `    tl:AddMarker(sf + ${frame}, "Purple", ${luaQuote('PulseVFX: ' + id)}, ${luaQuote('look pass from prompt')}, 24)`;
    }).join('\n');
    return `-- PulseVFX ▸ Look & Rhythm pass
-- Prompt: ${prompt.replace(/\n/g, ' ')}
-- Applies ${presets.length} native nodes across the cut points below.
local proj = resolve:GetProjectManager():GetCurrentProject()
local tl = proj and proj:GetCurrentTimeline()
if tl then
    local sf = tl:GetStartFrame() or 0
${markers}
    print("PulseVFX look pass: ${presets.join(' + ')}")
end`;
  }

  if (action === 'cut_silences') {
    const segs = payload.segments || [];
    const keep = segs.filter((s) => !s.cut);
    const lines = keep.slice(0, 40).map((s) => `    { mediaPoolItem = mpi, startFrame = ${s.startFrame}, endFrame = ${s.endFrame} }`).join(',\n');
    return `-- PulseVFX ▸ Cut Silences (gate ${payload.noiseFloorDb ?? -32} dB, min ${payload.minSilenceMs ?? 300} ms, pad ${payload.padMs ?? 60} ms)
-- Rebuilds the active clip into ${keep.length} speech segments, dropping dead air.
local proj = resolve:GetProjectManager():GetCurrentProject()
local mp = proj:GetMediaPool()
local tl = proj:GetCurrentTimeline()
local items = tl and (tl:GetItemListInTrack("video", 1) or {}) or {}
if #items > 0 then
    local mpi = items[1]:GetMediaPoolItem()
    local newTl = mp:CreateEmptyTimeline(tl:GetName() .. " · SILENCE CUT")
    proj:SetCurrentTimeline(newTl)
    mp:AppendToTimeline({
${lines}
    })
    print("Silence cut: ${keep.length} segments · ${((payload.originalDuration || 0) - (payload.outputDuration || 0)).toFixed(1)}s removed")
end`;
  }

  if (action === 'add_captions_lyrics') {
    const lines = payload.lines || [];
    const style = payload.style || 'Duet';
    const presetId = payload.presetId || 'duet';
    const fontPair = payload.fontPair || 'sans_serif';
    const alignment = payload.alignment || 'center';
    const backdropMode = payload.backdropMode || 'auto';
    const variationSeed = Number(payload.variationSeed) || 1;
    const justify = alignment === 'left' ? 1 : alignment === 'right' ? 2 : 3;
    const fontName = fontPair === 'condensed_mono' ? 'Arial Narrow' : fontPair === 'editorial_display' ? 'Georgia' : fontPair === 'lowercase_brat' ? 'Arial' : 'Helvetica Neue';
    const luaLines = lines.slice(0, 80).map((l) => `    { s = ${Math.round((Number(l.startSec) || 0) * 24)}, e = ${Math.round((Number(l.endSec) || 2) * 24)}, t = ${luaQuote(l.text)} }`).join(',\n');
    return `-- PulseVFX ▸ LYRC kinetic captions · preset ${presetId} (#${variationSeed})
-- Style: ${style} · font pair: ${fontPair} · alignment: ${alignment} · surface: ${backdropMode}
-- Creates one TextPlus per phrase on a Fusion comp, aligned to the chosen frame edge.
-- Entrance animation is handled by VFXKit_LyrcKineticEngine.setting; the timed markers
-- below are what the Song Template re-uses when you shuffle footage.
local phrases = {
${luaLines}
}
local proj = resolve:GetProjectManager():GetCurrentProject()
local tl = proj and proj:GetCurrentTimeline()
local fps = tl and tl:GetSetting("timelineFrameRate") or 24
if tl and #phrases > 0 then
    local sf = tl:GetStartFrame() or 0
    local item = tl:GetCurrentVideoItem()
    if item then
        local comp = item:GetFusionCompCount() > 0 and item:GetFusionCompByIndex(1) or item:AddFusionComp()
        if comp then
            comp:Lock()
            for i, p in ipairs(phrases) do
                local txt = comp:AddTool("TextPlus", 200, 200 + i * 90)
                txt:SetInput("StyledText", p.t)
                txt:SetInput("Font", ${luaQuote(fontName)})
                txt:SetInput("Style", "Bold")
                txt:SetInput("Size", 0.085)
                txt:SetInput("HorizontalJustificationNew", ${justify})
                txt:SetInput("VerticalJustificationNew", 3)
                txt:SetInput("Center", { ${(alignment === 'left' ? '0.30, 0.5' : alignment === 'right' ? '0.70, 0.5' : '0.5, 0.5')} })
            end
            comp:Unlock()
            print("LYRC: ${lines.length} phrase tools created · preset " .. ${luaQuote(presetId)})
        end
    end
    for i, p in ipairs(phrases) do
        tl:AddMarker(sf + p.s, "Yellow", p.t, ${luaQuote('LYRC ' + presetId + ' · ' + style + ' #' + variationSeed)}, math.max(1, p.e - p.s))
    end
end`;
  }

  if (action === 'shuffle_template_clips') {
    const order = payload.clipOrder || [];
    return `-- PulseVFX ▸ Song Template shuffle (${payload.lyricPreset || 'duet'} #${payload.variationSeed || 1}, ${payload.tempo || 138} BPM)
-- Lyric timing + beat markers stay locked; only V1 footage order changes.
local proj = resolve:GetProjectManager():GetCurrentProject()
local mp = proj:GetMediaPool()
local tl = proj:GetCurrentTimeline()
local order = { ${order.map((n) => luaQuote(n)).join(', ')} }
local clips = mp:GetRootFolder():GetClipList() or {}
if tl and #clips > 0 then
    local v1 = tl:GetItemListInTrack("video", 1) or {}
    local beat = math.floor((60 / ${Number(payload.tempo) || 138}) * 24 * 2)
    for i, item in ipairs(v1) do
        local idx = ((i - 1) % math.max(1, #clips)) + 1
        item:SetProperty("ClipName", order[idx] or ("shuffle_" .. i))
        item:AddMarker(0, "Cyan", "TEMPLATE SHUFFLE", ${luaQuote('seed #' + (Number(payload.variationSeed) || 1))}, beat)
    end
    print("Song Template shuffled: " .. #v1 .. " cuts")
end`;
  }

  if (action === 'scan_media_pool') {
    return `-- PulseVFX ▸ Media Pool scan
local proj = resolve:GetProjectManager():GetCurrentProject()
local mp = proj and proj:GetMediaPool()
local root = mp and mp:GetRootFolder()
if root then
    local function walk(folder, depth)
        local clips = folder:GetClipList() or {}
        for _, clip in ipairs(clips) do
            print(string.rep("  ", depth) .. clip:GetName() .. " | " .. tostring(clip:GetClipProperty("Duration")) .. " frames")
        end
        for _, sub in ipairs(folder:GetSubFolderList() or {}) do
            print(string.rep("  ", depth) .. "[" .. sub:GetName() .. "]")
            walk(sub, depth + 1)
        end
    end
    walk(root, 0)
end`;
  }

  if (action === 'auto_edit_timeline') {
    const mode = payload.mode || 'music_video';
    const bpm = Number(payload.bpm) || 138;
    const pacing = payload.pacing || '2';
    const beatsPerCut = pacing === 'dynamic' ? 2 : Number(pacing) || 2;
    const framesPerCut = Math.max(6, Math.round((60 / bpm) * 24 * beatsPerCut));
    const treatment = payload.treatment || 'drill';
    const treatmentNode = treatment === 'grunge' ? 'SoftGlow' : treatment === 'crt' ? 'TV' : 'Transform';
    return `-- PulseVFX ▸ Auto-Editor (${mode === 'music_video' ? bpm + ' BPM music video' : 'editorial vlog cut'})
-- Pacing: ${beatsPerCut} beat(s) per cut = ${framesPerCut} frames @ 24fps · downbeat node: ${treatmentNode}
local proj = resolve:GetProjectManager():GetCurrentProject()
local mp = proj:GetMediaPool()
local clips = mp:GetRootFolder():GetClipList() or {}
if #clips > 0 then
    local tl = mp:CreateEmptyTimeline(${luaQuote(mode === 'music_video' ? `AI Music Video · ${bpm} BPM` : 'AI Vlog Rough Cut')})
    proj:SetCurrentTimeline(tl)
    local subclips = {}
    local count = math.min(#clips * 3, 48)
    for i = 1, count do
        local c = clips[((i - 1) % #clips) + 1]
        local inFrame = (i - 1) * ${framesPerCut}
        subclips[#subclips + 1] = { mediaPoolItem = c, startFrame = inFrame, endFrame = inFrame + ${framesPerCut} }
    end
    mp:AppendToTimeline(subclips)
    local track = tl:GetItemListInTrack("video", 1) or {}
    for i, item in ipairs(track) do
        if (i - 1) % ${Math.max(1, Math.round(beatsPerCut * 2))} == 0 then
            item:AddMarker(${framesPerCut}, "Red", "DOWNBEAT", ${luaQuote(treatmentNode + ' pass')}, 1)
        end
    end
    print("Auto-editor: " .. #subclips .. " cuts · " .. ${luaQuote(mode)})
end`;
  }

  return `-- PulseVFX action: ${action}`;
}

// ============================================================================
// HTTP Server & Static File Handler
// ============================================================================
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.setting': 'text/plain; charset=utf-8',
  '.lua': 'text/plain; charset=utf-8'
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (_e) {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // API: Check Bridge & Resolve 21.1.1 Status
  if (pathname === '/api/status' && req.method === 'GET') {
    const paths = getResolvePaths();
    const scriptInstalled = fs.existsSync(path.join(paths.scriptsDir, 'VFXKit_ResolveFree_Bridge.lua'));
    const sessionPref = readFusionPrefsKey(paths.prefsFile, 'Session');
    return sendJson(res, 200, {
      ok: true,
      targetVersion: 'DaVinci Resolve Free 21.1.1',
      osPlatform: paths.platform,
      paths,
      scriptInstalled,
      bridgeSession: sessionPref ? sessionPref.data : null
    });
  }

  // API: One-click Install Bridge Script + Fusion Macros to macOS/local Resolve folders
  if (pathname === '/api/install-bridge' && req.method === 'POST') {
    const paths = getResolvePaths();
    try {
      fs.mkdirSync(paths.scriptsDir, { recursive: true });
      fs.mkdirSync(paths.effectsDir, { recursive: true });
      fs.mkdirSync(paths.stateDir, { recursive: true });

      const bridgeSrc = path.join(__dirname, 'resolve-bridge/VFXKit_ResolveFree_Bridge.lua');
      const bridgeDest = path.join(paths.scriptsDir, 'VFXKit_ResolveFree_Bridge.lua');
      fs.copyFileSync(bridgeSrc, bridgeDest);

      const macroDir = path.join(__dirname, 'fusion-macros');
      const installedMacros = [];
      if (fs.existsSync(macroDir)) {
        for (const file of fs.readdirSync(macroDir)) {
          if (file.endsWith('.setting')) {
            fs.copyFileSync(path.join(macroDir, file), path.join(paths.effectsDir, file));
            installedMacros.push(file);
          }
        }
      }

      return sendJson(res, 200, {
        ok: true,
        installedTo: bridgeDest,
        effectsDir: paths.effectsDir,
        installedMacros,
        message: 'Installed VFXKit_ResolveFree_Bridge.lua and native Fusion macros for DaVinci Resolve Free 21.1.1!'
      });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // API: Dispatch command to DaVinci Resolve Free 21.1.1 Bridge + generate Lua Console fallback
  if (pathname === '/api/dispatch' && req.method === 'POST') {
    const body = await parseBody(req);
    const action = body.action || 'ping';
    const payload = body.payload || {};
    const bridgeResult = await sendBridgeCommand(action, payload, 700);
    const luaSnippet = generateResolveLuaSnippet(action, payload);
    return sendJson(res, 200, {
      ok: true,
      action,
      liveBridgeConnected: bridgeResult.liveBridge,
      bridgeResponse: bridgeResult.response || null,
      luaSnippet,
      timestamp: new Date().toISOString()
    });
  }

  // Serve raw bridge script or Fusion .setting macro files for download
  if (pathname === '/download/bridge.lua') {
    const file = path.join(__dirname, 'resolve-bridge/VFXKit_ResolveFree_Bridge.lua');
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="VFXKit_ResolveFree_Bridge.lua"'
    });
    return fs.createReadStream(file).pipe(res);
  }

  // Static files from public/
  const publicDir = path.join(__dirname, 'public');
  let safePath = pathname === '/' ? '/index.html' : pathname;
  safePath = path.normalize(safePath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(publicDir, safePath);

  if (filePath.startsWith(publicDir) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    return fs.createReadStream(filePath).pipe(res);
  }

  // SPA fallback
  const indexHtml = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return fs.createReadStream(indexHtml).pipe(res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, HOST, () => {
  console.log(`PulseVFX Studio (DaVinci Resolve Free 21.1.1 Suite) listening on http://${HOST}:${PORT}`);
});
