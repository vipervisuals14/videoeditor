#!/usr/bin/env node
/* ============================================================================
 * asr_browser_check.mjs — runs the code the browser will actually run
 * ----------------------------------------------------------------------------
 * The speech engine is three moving parts: the ES-module runtime, the wasm
 * backend, and the model files fetched by relative path. A test that stubs any
 * of them proves nothing, which is how a missing <script type="module"> shipped.
 *
 * This loads the real vendored bundle, the real asr.js and the real weights,
 * with fetch pointed at public/, and transcribes a known recording. The one
 * trick: the bundle picks onnxruntime-node when it sees `process`, so `process`
 * is hidden during the import to make it take the browser path (ort-web + wasm),
 * which is exactly what Chrome does.
 *
 *   node tools/asr_browser_check.mjs
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROOT, 'public');
const ASR = path.join(PUB, 'vendor', 'asr');
const WAV = path.join(ROOT, 'tools', 'fixtures', 'jfk.wav');

const checks = [];
const check = (label, ok, detail) => {
  checks.push({ label, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n        - ${detail}` : ''}`);
};

if (!fs.existsSync(WAV)) {
  console.log(`skip: no speech sample at ${WAV}`);
  process.exit(0);
}

// ---- what a browser has that Node does not ---------------------------------
globalThis.self = globalThis;
globalThis.window = globalThis;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  const raw = String(url);
  if (!/^https?:/.test(raw)) {
    const rel = raw.replace(/^\.?\//, '').replace(/^vendor\/asr\//, '');
    const file = path.join(ASR, rel.split('?')[0]);
    if (fs.existsSync(file)) {
      return new Response(fs.readFileSync(file), {
        status: 200,
        headers: { 'content-type': file.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream' }
      });
    }
    return new Response('missing', { status: 404 });
  }
  return realFetch(url, opts);
};

// ---- 1. the runtime, loaded the way index.html loads it -------------------
// It is a plain IIFE bundle (no modules), so evaluating it like a <script> tag
// is exactly what the browser does.
let T = null;
{
  const code = fs.readFileSync(path.join(ASR, 'transformers.bundle.js'), 'utf8');
  const saved = globalThis.process;
  globalThis.process = undefined;     // make the bundle pick the browser backend
  try {
    (0, eval)(code);
    T = globalThis.transformers;
  } catch (err) {
    check('the vendored bundle evaluates like a classic script', false, err.message);
  } finally {
    globalThis.process = saved;
  }
}
check('the vendored bundle evaluates like a classic script and defines a global',
  !!T && typeof T.pipeline === 'function',
  T ? `pipeline=${typeof T.pipeline} v=${T.env && T.env.version}` : 'no window.transformers');
{
  const html = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');
  const tag = /<script src="\/?vendor\/asr\/transformers\.bundle\.js/.test(html);
  check('the page ships that bundle as a plain script tag', tag, tag ? 'classic tag present' : 'no tag');
}
check('its browser backend is present (wasm, not the node binding)',
  !!(T && T.env.backends && T.env.backends.onnx && T.env.backends.onnx.wasm),
  T && T.env.backends ? `backends=${Object.keys(T.env.backends).join(',')}` : 'no env');

if (T) {
  globalThis.transformers = T;
  globalThis.PULSE_ASR_BASE = 'vendor/asr/';
}

// ---- 2. asr.js, pointed at the real files ---------------------------------
await import('file://' + path.join(PUB, 'asr.js'));
const Asr = globalThis.AsrLab;
check('the page-side engine is wired to that runtime', !!Asr && typeof Asr.transcribe === 'function');

const phases = [];
if (Asr && Asr.onState) Asr.onState((i) => phases.push(i.phase));

function readWav(file) {
  const buf = fs.readFileSync(file);
  let pos = 12, fmt = null, data = null;
  while (pos + 8 <= buf.length) {
    const id = buf.toString('ascii', pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    const body = pos + 8;
    if (id === 'fmt ') fmt = { ch: buf.readUInt16LE(body + 2), rate: buf.readUInt32LE(body + 4) };
    else if (id === 'data') data = buf.subarray(body, body + size);
    pos = body + size + (size % 2);
  }
  const n = data.length / 2 / fmt.ch;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = data.readInt16LE(i * fmt.ch * 2) / 32768;
  return { samples: out, rate: fmt.rate };
}

if (Asr) {
  const { samples, rate } = readWav(WAV);
  let out = null;
  let err = null;
  const t0 = Date.now();
  try {
    out = await Asr.transcribe(samples, rate, { maxSec: 60 });
  } catch (e) {
    err = e;
  }
  const ms = Date.now() - t0;
  check('it transcribes real audio through the browser backend', !!out && out.words.length > 0,
    err ? err.message : (out ? `${out.words.length} words` : 'no output'));
  if (out) {
    const words = out.words.map((w) => w.text.toLowerCase().replace(/[^a-z']/g, ''));
    const want = ['ask', 'not', 'what', 'your', 'country', 'can', 'do', 'for', 'you'];
    const hits = want.filter((w) => words.includes(w)).length;
    check('the words are the words that were spoken', hits / want.length >= 0.8,
      `${hits}/${want.length}: "${out.text.slice(0, 70)}"`);
    check('every word carries a real timestamp', out.words.every((w) => Number.isFinite(w.startSec) && w.endSec > w.startSec),
      `${out.words.length} words`);
    check('nothing runs past the end of the clip', out.words.every((w) => w.endSec <= out.durationSec + 0.01),
      `clip ${out.durationSec.toFixed(2)}s`);
    console.log(`\ntranscript: "${out.text}"`);
    console.log(`${out.words.length} words from ${out.durationSec.toFixed(1)}s of audio in ${(ms / 1000).toFixed(1)}s`);
  }
  check('the loader reported progress before finishing', phases.includes('loading') && phases.includes('done'),
    phases.join(' -> '));
}

const failed = checks.filter((c) => !c.ok);
console.log('');
if (failed.length) {
  console.log(`${failed.length}/${checks.length} browser-path speech checks FAILED`);
  process.exitCode = 1;
} else {
  console.log(`all ${checks.length} browser-path speech checks passed`);
}
