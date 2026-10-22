#!/usr/bin/env node
/* ============================================================================
 * asr_check.mjs — proves the shipped speech engine actually transcribes
 * ----------------------------------------------------------------------------
 * Runs public/asr.js against the real vendored Whisper weights, in Node, with a
 * recording whose words are known. This is the check that matters for "it types
 * the words for me": it is the real model, the real 41 MB files, real timings.
 *
 * It needs two things that are development-only (never shipped with the site):
 *
 *   npm i --ignore-scripts @xenova/transformers onnxruntime-node
 *   a short spoken .wav of known words at 16 kHz mono
 *
 * Usage:
 *   node tools/asr_check.mjs /path/to/speech.wav "the words you expect"
 *
 * With no argument it looks for tools/fixtures/jfk.wav (JFK's "ask not" line,
 * the sample whisper.cpp ships) and checks a few known words.
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wavPath = process.argv[2] || path.join(ROOT, 'tools', 'fixtures', 'jfk.wav');
const expected = process.argv[3] || 'ask not what your country can do for you';

if (!fs.existsSync(wavPath)) {
  console.log(`skip: no speech sample at ${wavPath}`);
  console.log('      pass one: node tools/asr_check.mjs /path/to/speech.wav "expected words"');
  process.exit(0);
}

// The runtime lives outside the repo (it is 200 MB and only used by this
// check). Point ASR_MODULES at a node_modules that has it if the local one does
// not, then the bare import below is tried as a fallback.
const deps = process.env.ASR_MODULES || '';
let transformers;
for (const spec of [deps ? path.join(deps, '@xenova/transformers') : null, '@xenova/transformers']) {
  if (!spec) continue;
  try {
    if (spec.startsWith('/')) {
      // a package directory: honour its own entry point
      const pkg = JSON.parse(fs.readFileSync(path.join(spec, 'package.json'), 'utf8'));
      const entry = path.join(spec, pkg.module || pkg.main || 'index.js');
      transformers = await import(`file://${entry}`);
    } else {
      transformers = await import(spec);
    }
    break;
  } catch (err) { /* try the next one */ }
}
if (!transformers) {
  console.log('skip: the development runtime is not installed.');
  console.log('      npm i --ignore-scripts @xenova/transformers onnxruntime-node');
  console.log('      or: ASR_MODULES=/path/to/node_modules node tools/asr_check.mjs');
  process.exit(0);
}

globalThis.transformers = transformers;
globalThis.PULSE_ASR_BASE = path.join(ROOT, 'public', 'vendor', 'asr') + path.sep;
await import(path.join(ROOT, 'public', 'asr.js'));
const Asr = globalThis.AsrLab;

function readWav(file) {
  const buf = fs.readFileSync(file);
  let pos = 12, fmt = null, data = null;
  while (pos + 8 <= buf.length) {
    const id = buf.toString('ascii', pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    const body = pos + 8;
    if (id === 'fmt ') fmt = { channels: buf.readUInt16LE(body + 2), rate: buf.readUInt32LE(body + 4), bits: buf.readUInt16LE(body + 14) };
    else if (id === 'data') data = buf.subarray(body, body + size);
    pos = body + size + (size % 2);
  }
  if (!fmt || !data) throw new Error('not a RIFF wav');
  const frames = data.length / (fmt.bits / 8) / fmt.channels;
  const out = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    const at = i * fmt.channels * (fmt.bits / 8);
    out[i] = fmt.bits === 16 ? data.readInt16LE(at) / 32768 : data.readFloatLE(at);
  }
  return { samples: out, rate: fmt.rate };
}

const { samples, rate } = readWav(wavPath);
console.log(`audio: ${(samples.length / rate).toFixed(2)}s @ ${rate} Hz`);

const t0 = Date.now();
const out = await Asr.transcribe(samples, rate, { maxSec: 120 });
const ms = Date.now() - t0;

const words = out.words.map((w) => w.text.toLowerCase().replace(/[^a-z']/g, ''));
const want = expected.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z']/g, '')).filter(Boolean);
const hits = want.filter((w) => words.includes(w)).length;
const lastWord = out.words[out.words.length - 1];

const checks = [
  ['a transcript came back', out.text.length > 0, `${out.text.length} chars`],
  ['most expected words are present', hits / Math.max(1, want.length) >= 0.8, `${hits}/${want.length} words`],
  ['every word has a start time', out.words.every((w) => Number.isFinite(w.startSec)), `${out.words.length} words`],
  ['no word runs past the end of the clip', out.words.every((w) => w.endSec <= out.durationSec + 0.01), `last ends ${lastWord ? lastWord.endSec.toFixed(2) : '?'}s of ${out.durationSec.toFixed(2)}s`],
  ['no word is absurdly long', out.words.every((w) => w.endSec - w.startSec <= 1.6), 'clamped to 1.6s']
];

let failed = 0;
for (const [label, ok, detail] of checks) {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `\n        - ${detail}`}`);
}
console.log(`\ntranscript: "${out.text}"`);
console.log(`${out.words.length} words in ${(ms / 1000).toFixed(1)}s (${(out.durationSec / (ms / 1000)).toFixed(1)}× realtime)`);
if (failed) {
  console.log(`\n${failed}/${checks.length} speech checks FAILED`);
  process.exitCode = 1;
} else {
  console.log(`\nall ${checks.length} speech checks passed`);
}
