#!/usr/bin/env node
/* ============================================================================
 * render-type-sheet.mjs — draw every LYRC look to a PNG contact sheet
 * ----------------------------------------------------------------------------
 * The renderer is exercised through the shipped page in jsdom and painted with
 * a real Skia canvas, so this is what the looks actually look like rather than
 * what they are supposed to look like.
 *
 *   node tools/render-type-sheet.mjs [out.png]
 *
 * Needs @napi-rs/canvas (development only):
 *   npm i --ignore-scripts @napi-rs/canvas
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { boot } from './dom/harness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || path.join(ROOT, 'style-sheet.png');

let createCanvas;
for (const spec of [process.env.CANVAS_MODULES ? path.join(process.env.CANVAS_MODULES, '@napi-rs/canvas') : null, '@napi-rs/canvas']) {
  if (!spec) continue;
  try {
    const mod = await import(spec.startsWith('/') ? `file://${path.join(spec, 'index.js')}` : spec);
    createCanvas = mod.createCanvas;
    break;
  } catch (_e) { /* try the next location */ }
}
if (!createCanvas) {
  console.log('skip: @napi-rs/canvas is not installed (development only)');
  console.log('      npm i --ignore-scripts @napi-rs/canvas');
  process.exit(0);
}

const { window } = boot({ beforeScripts: (w) => { w.__PULSE_TEST__ = true; } });
const P = window.PulseTest;
const W = 1280;
const H = 720;
const SAMPLE = 'we were never late for anything worth waiting for';
const shows = P.CAPTION_STYLES.filter((s) => s.kind === 'block');

const tiles = [];
shows.forEach((st) => {
  P.selectLyrcPreset(st);
  const words = SAMPLE.split(/\s+/).map((w, i) => ({ text: w, startSec: i * 0.33, endSec: i * 0.33 + 0.3 }));
  P.state.cues = [{ index: 1, text: SAMPLE, startSec: 0, endSec: 8, timed: true, words }];
  P.state.playheadSec = 1.0;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#55636e');
  grad.addColorStop(1, '#101619');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  P.drawLyrcStudioTypography(ctx, W, H, P.state.playheadSec, 0.2);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, 260, 26);
  ctx.fillStyle = '#9fe3ff';
  ctx.font = '15px monospace';
  ctx.fillText(`${st.id}`, 8, 18);
  tiles.push(canvas);
});

const CW = W / 2;
const CH = H / 2;
const cols = 2;
const sheet = createCanvas(CW * cols, CH * Math.ceil(tiles.length / cols));
const sctx = sheet.getContext('2d');
tiles.forEach((tile, i) => sctx.drawImage(tile, (i % cols) * CW, Math.floor(i / cols) * CH, CW, CH));
fs.writeFileSync(out, sheet.toBuffer('image/png'));
console.log(`wrote ${out} — ${tiles.length} looks, ${sheet.width}x${sheet.height}`);
