/* ============================================================================
 * PulseVFX — AI DEPTH WORKER (Depth Anything V2 Small, int8 ONNX)
 * ----------------------------------------------------------------------------
 * Runs the real model off the main thread. A module worker so ONNX Runtime's
 * ESM build can be imported directly; the runtime and the model both live under
 * vendor/depth/ next to this file.
 *
 * Protocol
 *   in : { type:'init' }                        -> { type:'init', ok, ms }
 *        { type:'infer', id, data, width, height, mapW, mapH }
 *   out: { type:'progress', phase, loaded, total }
 *        { type:'infer', id, map: Float32Array, width, height, ms }
 *        { type:'error', id, message }
 *
 * Depth convention out: 0 = near, 1 = far (the panel's convention). The model
 * itself outputs "higher = nearer", so the result is inverted on the way back.
 * ==========================================================================*/

// The wasm-only build: pairs with ort-wasm-simd-threaded.{mjs,wasm}. The full
// build would drag in the 25 MB WebGPU/JSEP backend, which this tool never uses.
import * as ort from './vendor/depth/ort.wasm.min.mjs';

const MODEL_URL = 'vendor/depth/depth-anything-v2-small-fp16.onnx';
const WASM_DIR = 'vendor/depth/';
const INPUT_SIZE = 518;      // long side at standard quality
const INPUT_SIZE_HQ = 1036;  // 2x long side for the high-detail pass (~4x compute)
const SIZE_MULTIPLE = 14;    // patch size of the ViT backbone

// A host may provide an explicit path (used by the test harness); browsers
// just resolve it relative to the page.
ort.env.wasm.wasmPaths = (typeof self !== 'undefined' && self.__ORT_WASM_DIR) || WASM_DIR;
// One thread unless the page is cross-origin isolated (threads need
// SharedArrayBuffer, which needs COOP/COEP headers we cannot assume on
// GitHub Pages). Single-threaded WASM is slower but always works.
ort.env.wasm.numThreads = (typeof self !== 'undefined' && self.crossOriginIsolated)
  ? Math.max(1, Math.min(4, (self.navigator && self.navigator.hardwareConcurrency) || 1))
  : 1;
ort.env.wasm.simd = true;
ort.env.wasm.proxy = false;

let sessionPromise = null;
let modelBytes = null;

function post(msg, transfer) {
  self.postMessage(msg, transfer || []);
}

// Fetch the model with progress so the panel can show a real download bar
// instead of a spinner that lies about being "working".
async function fetchModel() {
  if (modelBytes) return modelBytes;
  const res = await fetch(MODEL_URL);
  if (!res.ok) throw new Error(`model download failed (${res.status})`);
  const total = Number(res.headers.get('content-length')) || 0;
  if (!res.body || !res.body.getReader) {
    modelBytes = await res.arrayBuffer();
    return modelBytes;
  }
  const reader = res.body.getReader();
  const chunks = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    post({ type: 'progress', phase: 'download', loaded, total });
  }
  const out = new Uint8Array(loaded);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  modelBytes = out.buffer;
  return modelBytes;
}

async function ensureSession() {
  if (sessionPromise) return sessionPromise;
  sessionPromise = (async () => {
    post({ type: 'progress', phase: 'runtime', loaded: 0, total: 0 });
    const bytes = await fetchModel();
    post({ type: 'progress', phase: 'compile', loaded: 0, total: 0 });
    return ort.InferenceSession.create(bytes, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all'
    });
  })();
  try {
    return await sessionPromise;
  } catch (e) {
    sessionPromise = null;
    throw e;
  }
}

// Aspect-preserving size with both dimensions a multiple of 14. `quality` is
// 'high' for the 2x-resolution pass: same model, more spatial detail, ~4x the
// compute — which is why it is a separate choice rather than the default.
function modelSize(w, h, quality) {
  const target = quality === 'high' ? INPUT_SIZE_HQ : INPUT_SIZE;
  const s = target / Math.max(w, h);
  const nw = Math.max(SIZE_MULTIPLE, Math.round((w * s) / SIZE_MULTIPLE) * SIZE_MULTIPLE);
  const nh = Math.max(SIZE_MULTIPLE, Math.round((h * s) / SIZE_MULTIPLE) * SIZE_MULTIPLE);
  return { nw, nh };
}

// Bilinear resample of an RGBA buffer to nw x nh, in model input layout:
// planar float32, ImageNet normalised, NCHW.
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

function toInputTensor(rgba, w, h, nw, nh) {
  const plane = nw * nh;
  const out = new Float32Array(3 * plane);
  const xScale = w / nw;
  const yScale = h / nh;
  for (let y = 0; y < nh; y++) {
    const sy = Math.min(h - 1, Math.max(0, (y + 0.5) * yScale - 0.5));
    const y0 = Math.floor(sy);
    const y1 = Math.min(h - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < nw; x++) {
      const sx = Math.min(w - 1, Math.max(0, (x + 0.5) * xScale - 0.5));
      const x0 = Math.floor(sx);
      const x1 = Math.min(w - 1, x0 + 1);
      const fx = sx - x0;
      const i00 = (y0 * w + x0) * 4;
      const i10 = (y0 * w + x1) * 4;
      const i01 = (y1 * w + x0) * 4;
      const i11 = (y1 * w + x1) * 4;
      const o = y * nw + x;
      for (let c = 0; c < 3; c++) {
        const top = rgba[i00 + c] * (1 - fx) + rgba[i10 + c] * fx;
        const bot = rgba[i01 + c] * (1 - fx) + rgba[i11 + c] * fx;
        const v = (top * (1 - fy) + bot * fy) / 255;
        out[c * plane + o] = (v - MEAN[c]) / STD[c];
      }
    }
  }
  return out;
}

// Percentile stretch + invert, so the map fills 0..1 with 0 = near.
function normalise(raw, count) {
  const sample = [];
  const step = Math.max(1, Math.floor(count / 20000));
  for (let i = 0; i < count; i += step) sample.push(raw[i]);
  sample.sort((a, b) => a - b);
  const lo = sample[Math.floor(sample.length * 0.02)];
  const hi = sample[Math.floor(sample.length * 0.98)];
  const span = Math.max(1e-6, hi - lo);
  const out = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const v = (raw[i] - lo) / span;
    const c = v < 0 ? 0 : v > 1 ? 1 : v;
    out[i] = 1 - c;   // model says higher = nearer; the panel says 0 = near
  }
  return out;
}

// Resample the model's output grid to the map size the panel wants.
function resampleTo(src, sw, sh, dw, dh) {
  if (sw === dw && sh === dh) return src;
  const out = new Float32Array(dw * dh);
  const xScale = sw / dw;
  const yScale = sh / dh;
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(sh - 1, Math.max(0, (y + 0.5) * yScale - 0.5));
    const y0 = Math.floor(sy);
    const y1 = Math.min(sh - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sw - 1, Math.max(0, (x + 0.5) * xScale - 0.5));
      const x0 = Math.floor(sx);
      const x1 = Math.min(sw - 1, x0 + 1);
      const fx = sx - x0;
      const a = src[y0 * sw + x0] * (1 - fx) + src[y0 * sw + x1] * fx;
      const b = src[y1 * sw + x0] * (1 - fx) + src[y1 * sw + x1] * fx;
      out[y * dw + x] = a * (1 - fy) + b * fy;
    }
  }
  return out;
}

async function infer(msg) {
  const t0 = Date.now();
  const session = await ensureSession();
  const { nw, nh } = modelSize(msg.width, msg.height, msg.quality);
  const input = toInputTensor(new Uint8ClampedArray(msg.data), msg.width, msg.height, nw, nh);
  const feeds = { pixel_values: new ort.Tensor('float32', input, [1, 3, nh, nw]) };
  const result = await session.run(feeds);
  const first = result[Object.keys(result)[0]];
  // This export returns [1, H, W] (3 dims). Read the last two rather than
  // assuming a channel dim, which silently produced NaN for every pixel.
  const dims = first.dims;
  const oh = dims[dims.length - 2];
  const ow = dims[dims.length - 1];
  const map = normalise(first.data, ow * oh);
  const sized = resampleTo(map, ow, oh, msg.mapW || ow, msg.mapH || oh);
  post({
    type: 'infer',
    id: msg.id,
    map: sized,
    width: msg.mapW || ow,
    height: msg.mapH || oh,
    ms: Date.now() - t0,
    quality: msg.quality || 'standard',
    modelW: nw,
    modelH: nh
  }, [sized.buffer]);
}

self.onmessage = async (e) => {
  const msg = e.data || {};
  try {
    if (msg.type === 'init') {
      const t0 = Date.now();
      await ensureSession();
      post({ type: 'init', ok: true, ms: Date.now() - t0 });
      return;
    }
    if (msg.type === 'infer') {
      await infer(msg);
      return;
    }
    post({ type: 'error', id: msg.id, message: 'unknown message' });
  } catch (err) {
    post({ type: 'error', id: msg.id, message: String((err && err.message) || err), phase: msg.type });
  }
};
