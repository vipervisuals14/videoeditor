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
// VFXKIT_HOME lets the whole Resolve path chain be redirected, which is what
// the end-to-end simulator (tools/e2e_sim.py) uses to stand in for a real Mac.
const HOME_DIR = process.env.VFXKIT_HOME || os.homedir();
const STATE_DIR = process.env.VFXKIT_STATE_DIR || path.join(HOME_DIR, '.vfxkit-resolve-free');
const REQ_FILE = path.join(STATE_DIR, 'request.lua');
const RECIPES_FILE = path.join(__dirname, 'resolve-bridge', 'preset-recipes.json');

// Native Fusion graphs per preset (tools/gen-recipes.js). The bridge is a dumb
// interpreter of this table, so graphs are re-tunable without reinstalling Lua
// into Resolve.
let PRESET_RECIPES = { recipes: {} };
try {
  PRESET_RECIPES = JSON.parse(fs.readFileSync(RECIPES_FILE, 'utf8'));
} catch (err) {
  console.warn('[pulse] preset-recipes.json missing or invalid:', err.message);
}

function recipeFor(presetId, category) {
  const hit = presetId && PRESET_RECIPES.recipes && PRESET_RECIPES.recipes[presetId];
  if (hit) return hit;
  // Generic fallback so even an unknown/new card still produces a real graph
  if (!category) return null;
  return {
    label: presetId || category,
    category,
    family: 'generic',
    chain: [
      { tool: 'BrightnessContrast', bg: true, key: true, input: 'Gain', scale: 1.0 }
    ],
    marker: 'Fuchsia'
  };
}

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
// Snippet generation lives in public/lua-export.js so the static web build and
// this server emit byte-identical Lua. One implementation, not two.
const LuaExport = require('./public/lua-export.js');

function generateResolveLuaSnippet(action, payload) {
  return LuaExport.generate(action, payload);
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
  '.lua': 'text/plain; charset=utf-8',
  // Needed by the depth engine: the worker is an ES module (.mjs), ONNX Runtime
  // streams a .wasm backend, and the model itself is a .onnx file. A wrong type
  // on the .mjs makes the browser refuse to start the module worker at all.
  '.mjs': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.onnx': 'application/octet-stream'
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
      bridgeSession: sessionPref ? sessionPref.data : null,
      recipeCoverage: {
        presets: Object.keys(PRESET_RECIPES.recipes || {}).length,
        families: PRESET_RECIPES.families || []
      }
    });
  }

  // API: native Fusion graph recipes (one per preset)
  if (pathname === '/api/recipes' && req.method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      target: PRESET_RECIPES.target || 'DaVinci Resolve Free 21.1.1',
      count: Object.keys(PRESET_RECIPES.recipes || {}).length,
      families: PRESET_RECIPES.families || [],
      recipes: PRESET_RECIPES.recipes || {}
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
    const wirePayload = { ...payload };
    if (action === 'apply_vfx') {
      const recipe = recipeFor(payload.presetId, payload.category);
      if (recipe) wirePayload.recipe = recipe;
    }
    if (action === 'add_captions_lyrics') {
      // caption ids arrive bare ("redline"); the LYRC recipes ship as lyrc_*
      const recipe = recipeFor('lyrc_' + payload.presetId, payload.category)
        || recipeFor(payload.presetId, payload.category);
      if (recipe) wirePayload.recipe = recipe;
    }
    const bridgeResult = await sendBridgeCommand(action, wirePayload, 700);
    const luaSnippet = generateResolveLuaSnippet(action, wirePayload);
    return sendJson(res, 200, {
      ok: true,
      action,
      liveBridgeConnected: bridgeResult.liveBridge,
      bridgeReason: bridgeResult.reason || null,
      bridgeResponse: bridgeResult.response || null,
      recipe: wirePayload.recipe || null,
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
