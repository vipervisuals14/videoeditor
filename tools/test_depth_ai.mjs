#!/usr/bin/env node
/**
 * Depth Anything V2 smoke test — no npm dependencies.
 *
 *   node tools/test_depth_ai.mjs
 *
 * Loads the vendored int8 model through the vendored ONNX Runtime (the same
 * files the website ships), feeds it a synthetic "scene" whose depth is known
 * by construction, and checks that the map is finite, in range, correctly
 * oriented, and genuinely describes the scene. It also proves the runtime and
 * model pair up: a mismatched build fails here, not in someone's browser.
 *
 * Runs the worker module in-process (no Worker API in Node); the browser-only
 * message plumbing is exercised by the DOM suites instead.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VENDOR = path.join(ROOT, 'public', 'vendor', 'depth');

let fails = 0;
function check(name, ok, detail) {
  console.log((ok ? 'PASS  ' : 'FAIL  ') + name + (ok ? '' : '  -> ' + (detail === undefined ? '' : detail)));
  if (!ok) fails++;
}

function requireFile(name, minBytes) {
  const p = path.join(VENDOR, name);
  if (!fs.existsSync(p)) { check(`vendored file present: ${name}`, false, 'missing'); return false; }
  const size = fs.statSync(p).size;
  check(`vendored file present: ${name} (${(size / 1048576).toFixed(1)} MB)`, size >= minBytes, size);
  return true;
}

console.log('— assets —');
const haveModel = requireFile('depth-anything-v2-small-int8.onnx', 20 * 1048576);
requireFile('ort.wasm.min.mjs', 20000);
requireFile('ort-wasm-simd-threaded.mjs', 10000);
requireFile('ort-wasm-simd-threaded.wasm', 10 * 1048576);
if (!haveModel) process.exit(1);

// the worker imports './vendor/depth/ort.wasm.min.mjs' relative to itself;
// in-process it resolves relative to this file, so load the runtime directly
// and reuse the worker's own preprocessing by evaluating it with a shim.
const ort = await import(path.join(VENDOR, 'ort.wasm.min.mjs'));
ort.env.wasm.wasmPaths = VENDOR + path.sep;
ort.env.wasm.numThreads = 1;

console.log('\n— model —');
const t0 = Date.now();
const session = await ort.InferenceSession.create(fs.readFileSync(path.join(VENDOR, 'depth-anything-v2-small-int8.onnx')), {
  executionProviders: ['wasm'],
  graphOptimizationLevel: 'all'
});
const loadMs = Date.now() - t0;
check(`session loads (${loadMs} ms)`, true);
const inputMeta = session.inputNames;
check('model takes pixel_values', inputMeta.includes('pixel_values'), inputMeta.join(','));
const outNames = session.outputNames;
check('model returns predicted_depth', outNames.includes('predicted_depth'), outNames.join(','));

// ---- a synthetic perspective scene: receding checkered floor, an occluding
// foreground block, and sky at infinity. Drawn with plain pixel maths so the
// test needs no image library. The model must order it near-block > near-floor
// > sky, which is exactly the check a flat grey rectangle cannot make (Depth
// Anything reads photographic geometry, not gradients).
function makeScene(W, H) {
  const rgba = new Uint8ClampedArray(W * H * 4);
  const horizon = H * 0.38;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      let r, g, b;
      if (y < horizon) {
        // sky: brighter toward the horizon, like haze at infinity
        const t = y / horizon;
        r = 143 + 58 * t; g = 176 + 38 * t; b = 207 + 17 * t;
      } else {
        // floor: perspective checker, tiles shrink with distance
        const depthT = (y - horizon) / (H - horizon);          // 0 far .. 1 near
        const persp = Math.pow(depthT, 0.45);
        const spread = (W * 0.9) * (0.12 + persp * 0.88);
        const col = Math.floor(((x - W / 2) / Math.max(1, spread)) * 14 + 0.5);
        const row = Math.floor(persp * 26);
        const shade = ((row + col) & 1) ? 86 : 128;
        r = shade; g = shade + 4; b = shade + 10;
      }
      // foreground block: low in frame, occludes the floor
      const inBlock = x > W * 0.58 && x < W * 0.94 && y > H * 0.52;
      const inBlockTop = x > W * 0.58 && x < W * 0.94 && y > H * 0.52 && y < H * 0.58;
      if (inBlockTop) { r = 141; g = 106; b = 73; }
      else if (inBlock) { r = 122; g = 91; b = 63; }
      rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = 255;
    }
  }
  return rgba;
}

const MW = 518;
const MH = 364;            // 26 * 14
const rgba = makeScene(MW, MH);

const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
const plane = MW * MH;
const input = new Float32Array(3 * plane);
for (let i = 0; i < plane; i++) {
  for (let c = 0; c < 3; c++) {
    input[c * plane + i] = (rgba[i * 4 + c] / 255 - MEAN[c]) / STD[c];
  }
}
let nonFinite = 0;
for (let i = 0; i < input.length; i++) if (!Number.isFinite(input[i])) nonFinite++;
check('input tensor is finite and normalised', nonFinite === 0, nonFinite + ' non-finite');

const t1 = Date.now();
const result = await session.run({ pixel_values: new ort.Tensor('float32', input, [1, 3, MH, MW]) });
const inferMs = Date.now() - t1;
const first = result[outNames[0]];
const dims = first.dims;
check(`inference runs (${inferMs} ms, dims ${JSON.stringify(dims)})`, true);
check('output is a 3-D [1,H,W] map', dims.length === 3 && dims[0] === 1, JSON.stringify(dims));
check('output matches the input grid', dims[1] === MH && dims[2] === MW, JSON.stringify(dims));

const raw = first.data;
let mn = Infinity, mx = -Infinity, bad = 0;
for (let i = 0; i < raw.length; i++) {
  const v = raw[i];
  if (!Number.isFinite(v)) bad++;
  if (v < mn) mn = v;
  if (v > mx) mx = v;
}
check('every output value is finite', bad === 0, bad + ' non-finite (this is what a 3-D vs 4-D dim mismatch looks like)');
check('output has real dynamic range', mx - mn > 0.5, `${mn.toFixed(3)}..${mx.toFixed(3)}`);

// ---- orientation: the model says higher = nearer. Order the three planes.
const at = (x, y) => raw[Math.round(y) * MW + Math.round(x)];
const block = (at(MW * 0.75, MH * 0.80) + at(MW * 0.80, MH * 0.70)) / 2;
const floorNear = (at(MW * 0.30, MH * 0.92) + at(MW * 0.20, MH * 0.95)) / 2;
const sky = (at(MW * 0.50, MH * 0.10) + at(MW * 0.20, MH * 0.15)) / 2;
console.log(`      block ${block.toFixed(2)} · near floor ${floorNear.toFixed(2)} · sky ${sky.toFixed(2)}`);
check('foreground block reads nearer than the floor at its base', block > floorNear, `${block.toFixed(2)} vs ${floorNear.toFixed(2)}`);
check('near floor reads nearer than the sky', floorNear > sky, `${floorNear.toFixed(2)} vs ${sky.toFixed(2)}`);

// ---- the panel-facing convention: 0 = near, 1 = far
function toPanelConvention(values, count) {
  const sample = [];
  const step = Math.max(1, Math.floor(count / 20000));
  for (let i = 0; i < count; i += step) sample.push(values[i]);
  sample.sort((a, b) => a - b);
  const lo = sample[Math.floor(sample.length * 0.02)];
  const hi = sample[Math.floor(sample.length * 0.98)];
  const span = Math.max(1e-6, hi - lo);
  const out = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const c = Math.min(1, Math.max(0, (values[i] - lo) / span));
    out[i] = 1 - c;
  }
  return out;
}
const mapped = toPanelConvention(raw, raw.length);
check('panel map stays inside 0..1', mapped.every((v) => v >= 0 && v <= 1), 'out of range');
const at2 = (arr, x, y) => arr[Math.round(y) * MW + Math.round(x)];
const blockP = (at2(mapped, MW * 0.75, MH * 0.80) + at2(mapped, MW * 0.80, MH * 0.70)) / 2;
const skyP = (at2(mapped, MW * 0.50, MH * 0.10) + at2(mapped, MW * 0.20, MH * 0.15)) / 2;
console.log(`      panel convention: block ${blockP.toFixed(3)} (want low) · sky ${skyP.toFixed(3)} (want high)`);
check('after inversion the block is near (low) and the sky is far (high)', blockP < skyP - 0.25, `${blockP.toFixed(3)} vs ${skyP.toFixed(3)}`);


// ---- phase 2: run the shipped worker module itself ------------------------
// The worker imports the vendored runtime by relative path and talks over
// postMessage. Node has no Worker API, so the message port is shimmed; the
// module graph, preprocessing, inference and postprocessing are all real.
console.log('\n— shipped worker module —');
{
  const replies = [];
  globalThis.self = globalThis;
  globalThis.postMessage = (m, transfer) => replies.push({ m, transfer });
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const file = path.join(ROOT, 'public', String(url).replace(/^\.\//, ''));
    if (!fs.existsSync(file)) return { ok: false, status: 404, headers: { get: () => '0' } };
    const buf = fs.readFileSync(file);
    return {
      ok: true,
      status: 200,
      headers: { get: () => String(buf.length) },
      arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    };
  };
  // the worker defaults its wasm path relative to the page; point it at disk
  self.__ORT_WASM_DIR = VENDOR + path.sep;
  await import(path.join(ROOT, 'public', 'depth-ai-worker.js'));

  const waitForReply = new Promise((resolve, reject) => {
    const started = Date.now();
    const iv = setInterval(() => {
      const hit = replies.find((r) => r.m && (r.m.type === 'infer' || r.m.type === 'error' || r.m.type === 'init'));
      if (hit) { clearInterval(iv); resolve(hit.m); }
      else if (Date.now() - started > 120000) { clearInterval(iv); reject(new Error('worker timed out')); }
    }, 50);
  });

  const frame = new Uint8ClampedArray(rgba);   // same perspective scene
  globalThis.onmessage({ data: { type: 'infer', id: 99, data: frame.buffer, width: MW, height: MH, mapW: 480, mapH: 270 } });
  const reply = await waitForReply;

  check('worker answers the request id', reply.id === 99, reply.id);
  check('worker reports no error', reply.type !== 'error', reply.message);
  check('worker returns the requested map size', reply.width === 480 && reply.height === 270, `${reply.width}x${reply.height}`);
  const wm = reply.map instanceof Float32Array ? reply.map : new Float32Array(reply.map);
  let wbad = 0, wmn = Infinity, wmx = -Infinity;
  for (const v of wm) { if (!Number.isFinite(v)) wbad++; if (v < wmn) wmn = v; if (v > wmx) wmx = v; }
  check('worker map is finite everywhere', wbad === 0, wbad + ' non-finite');
  check('worker map spans the full 0..1 range', wmn < 0.05 && wmx > 0.95, `${wmn.toFixed(3)}..${wmx.toFixed(3)}`);
  const wat = (x, y) => wm[Math.round(y) * 480 + Math.round(x)];
  const wBlock = (wat(360, 216) + wat(384, 190)) / 2;
  const wSky = (wat(240, 27) + wat(96, 40)) / 2;
  check('worker keeps the near object nearest', wBlock < wSky, `${wBlock.toFixed(3)} vs ${wSky.toFixed(3)}`);
  console.log(`      worker round trip ${reply.ms} ms`);
  globalThis.fetch = realFetch;
}

console.log(`\nmodel ${(fs.statSync(path.join(VENDOR, 'depth-anything-v2-small-int8.onnx')).size / 1048576).toFixed(0)} MB · load ${loadMs} ms · infer ${inferMs} ms (single WASM thread)`);
console.log(fails === 0 ? '\nall AI depth checks passed' : `\n${fails} AI depth check(s) failed`);
process.exit(fails === 0 ? 0 : 1);
