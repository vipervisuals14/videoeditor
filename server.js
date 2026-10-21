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
function generateResolveLuaSnippet(action, payload) {
  if (action === 'apply_vfx') {
    const preset = payload.presetName || 'TD Simplex UV Displace TOP';
    const category = payload.category || 'TouchDesigner TOPs';
    const intensity = Number(payload.intensity ?? 85);
    const keyframes = Array.isArray(payload.keyframes) ? payload.keyframes : [];
    const zoom = (1 + (intensity / 100) * 0.08).toFixed(3);
    const fusionToolName =
      category === 'TouchDesigner TOPs' ? 'Displace' :
      category === 'Transitions & Morphs' ? 'Displace' :
      category === 'Data & Print TOPs' ? 'BrightnessContrast' :
      category === 'Glitch & Bitmap TOPs' ? 'BrightnessContrast' :
      category === 'Optical & Glass' ? 'SoftGlow' :
      category === 'Shutter & Time' ? 'Trails' :
      category === 'Camera Weight' ? 'CameraShake' : 'ColorCorrector';
    const paramName =
      fusionToolName === 'Displace' ? 'XRefraction' :
      fusionToolName === 'SoftGlow' ? 'Gain' :
      fusionToolName === 'Trails' ? 'Gain' :
      fusionToolName === 'BrightnessContrast' ? 'Gain' :
      fusionToolName === 'CameraShake' ? 'OverallStrength' : 'MasterRGBGain';
    // Data & Print TOPs are a mono 1-bit family: build the chain in the snippet
    const printChain = (category === 'Data & Print TOPs' || category === 'Glitch & Bitmap TOPs')
      ? `
        -- Data & Print TOPs: desaturate → hard print contrast (intensity keyframed)
        local bw = comp:AddTool("ColorCorrector", -32768, -32768)
        pcall(function() bw.Saturation = 0 end)
        pcall(function() tool.Background = bw.Output end)`
      : '';

    const kfLuaLines = keyframes.length > 0
      ? keyframes.map((kf) => {
          const frame = Math.round((Number(kf.timeSec) || 0) * 24);
          const kfScale = fusionToolName === 'Displace' ? 0.14 : 1.3;
          const normVal = ((Number(kf.value) || 0) / 100 * kfScale).toFixed(4);
          return `            [${frame}] = { ${normVal} }`;
        }).join(',\n')
      : `            [0] = { 0.0 },\n            [12] = { ${(intensity / 100 * 0.09).toFixed(4)} },\n            [24] = { 0.0 }`;

    return `-- Paste in DaVinci Resolve Free 21.1.1: Workspace > Console > Lua
-- Applies "${preset}" (${category}) with ${keyframes.length || 3} BezierSpline Intensity Keyframes
local pm = resolve:GetProjectManager()
local proj = pm:GetCurrentProject()
local tl = proj:GetCurrentTimeline()
local item = tl:GetCurrentVideoItem() or (tl:GetItemListInTrack("video", 1) or {})[1]
if item then
    item:SetProperty("ZoomX", ${zoom})
    item:SetProperty("ZoomY", ${zoom})
    local comp = item:GetFusionCompCount() > 0 and item:GetFusionCompByIndex(1) or item:AddFusionComp()
    if comp then
        comp:Lock()
        local tool = comp:AddTool(${luaQuote(fusionToolName)}, -32768, -32768)
${printChain}
        if ${luaQuote(fusionToolName)} == "Displace" then
            local noise = comp:AddTool("FastNoise", -32768, -32768)
            noise.Detail = 4.5
            noise.XScale = 6.5
            noise.SeetheRate = 0.42
            tool.Foreground = noise.Output
        end
        local spline = comp:BezierSpline()
        tool[${luaQuote(paramName)}] = spline
        spline:SetKeyFrames({
${kfLuaLines}
        })
        comp:Unlock()
    end
    item:AddMarker(12, "Purple", ${luaQuote('VFX: ' + preset)}, ${luaQuote(category + ' @ ' + intensity + '% (' + (keyframes.length || 3) + ' Keyframes)')}, 1)
end`;
  }

  if (action === 'cut_silences') {
    const segs = payload.segments || [];
    const lines = segs.slice(0, 12).map((s) => `    { mediaPoolItem = mpi, startFrame = ${s.startFrame}, endFrame = ${s.endFrame} }`).join(',\n');
    return `-- Paste in DaVinci Resolve Free 21.1.1: Workspace > Console > Lua
-- Rebuilds timeline with ${segs.length} speech segments (silences removed)
local proj = resolve:GetProjectManager():GetCurrentProject()
local mp = proj:GetMediaPool()
local tl = proj:GetCurrentTimeline()
local items = tl:GetItemListInTrack("video", 1) or {}
if #items > 0 then
    local mpi = items[1]:GetMediaPoolItem()
    local newTl = mp:CreateEmptyTimeline(tl:GetName() .. " - Silence Cut")
    proj:SetCurrentTimeline(newTl)
    mp:AppendToTimeline({
${lines}
    })
end`;
  }

  if (action === 'add_captions_lyrics') {
    const lines = payload.lines || [];
    const style = payload.style || 'Kinetic Pop';
    const markerCalls = lines.slice(0, 15).map((l) => {
      const f = Math.round((Number(l.startSec) || 0) * 24);
      const dur = Math.max(1, Math.round(((Number(l.endSec) || 2) - (Number(l.startSec) || 0)) * 24));
      return `    tl:AddMarker(sf + ${f}, "Yellow", ${luaQuote(l.text)}, ${luaQuote('Style: ' + style)}, ${dur})`;
    }).join('\n');
    return `-- Paste in DaVinci Resolve Free 21.1.1: Workspace > Console > Lua
-- Places ${lines.length} synced Lyric / Caption markers & ranges on active timeline
local proj = resolve:GetProjectManager():GetCurrentProject()
local tl = proj:GetCurrentTimeline()
if tl then
    local sf = tl:GetStartFrame() or 0
${markerCalls}
end`;
  }

  if (action === 'auto_edit_timeline') {
    const mode = payload.mode || 'music_video';
    const bpm = Number(payload.bpm) || 140;
    const framesPerCut = mode === 'music_video' ? Math.max(12, Math.round((60 / bpm) * 24 * 2)) : 96;
    return `-- Paste in DaVinci Resolve Free 21.1.1: Workspace > Console > Lua
-- Auto-assembles a ${mode === 'music_video' ? bpm + ' BPM Music Video' : 'Talking Head / Vlog'} cut from Media Pool
local proj = resolve:GetProjectManager():GetCurrentProject()
local mp = proj:GetMediaPool()
local clips = mp:GetRootFolder():GetClipList() or {}
if #clips > 0 then
    local tl = mp:CreateEmptyTimeline(${luaQuote(mode === 'music_video' ? `AI Music Video (${bpm} BPM)` : 'AI Vlog Rough Cut')})
    proj:SetCurrentTimeline(tl)
    local subclips = {}
    for i = 1, math.min(#clips * 2, 16) do
        local c = clips[((i - 1) % #clips) + 1]
        subclips[#subclips + 1] = { mediaPoolItem = c, startFrame = (i - 1) * 10, endFrame = (i - 1) * 10 + ${framesPerCut} }
    end
    mp:AppendToTimeline(subclips)
end`;
  }

  return `-- Resolve 21.1.1 Lua Action: ${action}`;
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
