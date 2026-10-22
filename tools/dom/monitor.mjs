/* ============================================================================
 * The monitor — it shows a frame, it does not stretch to fit
 * ----------------------------------------------------------------------------
 * What went wrong: the stage was `aspect-ratio: 16/9; width: 100%` inside a
 * column that also had to hold the keyframe panel and the timeline. The ratio
 * won, the stage overflowed the card, the transport bar fell off the page, and
 * the only part of the picture left on screen was a thin band. A portrait clip
 * (2160 × 3840) was cover-cropped into a wide, short box, i.e. a letterbox
 * strip through the middle of the frame.
 *
 * So: the stage fills what is left, and the canvas draws the output frame
 * letterboxed inside itself. These checks are about that geometry.
 *
 *   node tools/dom/monitor.mjs
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';
import { boot, makeCheck, PUB } from './harness.mjs';

const check = makeCheck();
const { window, document } = boot({ beforeScripts: (w) => { w.__PULSE_TEST__ = true; } });
const P = window.PulseTest;

const near = (a, b, tol = 1) => Math.abs(a - b) <= tol;

// ============================================================================
// 1. The frame inside the canvas
// ============================================================================
check('a 16:9 canvas is filled exactly, with no bars', () => {
  const f = P.outputFrameRect(1600, 900);
  return [f.x === 0 && f.y === 0 && near(f.w, 1600) && near(f.h, 900),
    `x${f.x} y${f.y} w${f.w} h${f.h}`];
});

check('a wide short stage letterboxes instead of cropping the picture', () => {
  const f = P.outputFrameRect(1600, 280);
  const aspect = f.w / f.h;
  return [f.h === 280 && near(f.w, 498, 3) && near(aspect, 16 / 9, 0.02) && f.y === 0,
    `${f.w}×${f.h} centred at x${f.x} (aspect ${aspect.toFixed(3)})`];
});

check('a tall narrow stage letterboxes the other way', () => {
  const f = P.outputFrameRect(420, 900);
  return [f.w === 420 && near(f.h, 236, 3) && f.x === 0,
    `${f.w}×${f.h} centred at y${f.y}`];
});

check('vertical mode puts a 9:16 frame on the monitor', () => {
  P.state.vertical916 = true;
  const f = P.outputFrameRect(1600, 900);
  P.state.vertical916 = false;
  return [near(f.h, 900) && near(f.w, 506, 3),
    `${f.w}×${f.h} (9:16 inside 1600×900)`];
});

check('the frame can never be bigger than the canvas', () => {
  const sizes = [[320, 180], [1600, 280], [420, 900], [1000, 1000], [1280, 720]];
  const bad = sizes.filter(([w, h]) => {
    const f = P.outputFrameRect(w, h);
    return f.x < 0 || f.y < 0 || f.x + f.w > w + 1 || f.y + f.h > h + 1;
  });
  return [bad.length === 0, bad.length ? `overflow at ${JSON.stringify(bad)}` : 'all inside'];
});

check('the frame keeps its shape whatever the window does', () => {
  const boxes = [[1600, 280], [900, 300], [500, 900], [1920, 1080]];
  const off = boxes.filter(([w, h]) => {
    const f = P.outputFrameRect(w, h);
    return Math.abs(f.w / f.h - 16 / 9) > 0.03;
  });
  return [off.length === 0, off.length ? `wrong aspect at ${JSON.stringify(off)}` : '16:9 throughout'];
});

// ============================================================================
// 2. The backing store follows the box
// ============================================================================
check('the canvas is re-sized to the box it is displayed in', () => {
  const c = document.getElementById('livePreviewCanvas');
  c.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1200, height: 675, right: 1200, bottom: 675 });
  c.width = 640; c.height = 360;
  P.syncPreviewCanvasSize(c);
  const ok = c.width > 640 && near(c.width / c.height, 1200 / 675, 0.02);
  return [ok, `${c.width}×${c.height} for a 1200×675 box`];
});

check('a huge window does not make the shader render 4K every frame', () => {
  const c = document.getElementById('livePreviewCanvas');
  c.getBoundingClientRect = () => ({ left: 0, top: 0, width: 3000, height: 1700, right: 3000, bottom: 1700 });
  P.syncPreviewCanvasSize(c);
  return [Math.max(c.width, c.height) <= 1600, `long edge ${Math.max(c.width, c.height)} px`];
});

check('a hidden or zero-size stage is left alone', () => {
  const c = document.getElementById('livePreviewCanvas');
  c.getBoundingClientRect = () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 });
  c.width = 640; c.height = 360;
  P.syncPreviewCanvasSize(c);
  return [c.width === 640 && c.height === 360, `${c.width}×${c.height} unchanged`];
});

// ============================================================================
// 3. The layout that caused it
// ============================================================================
check('the stage may not force a 16:9 height any more', () => {
  const css = fs.readFileSync(path.join(PUB, 'styles.css'), 'utf8');
  const rules = [...css.matchAll(/\.stage-wrap \.canvas-stage\s*\{[^}]*\}/g)].map((m) => m[0]);
  const last = rules[rules.length - 1] || '';
  const noRatio = /aspect-ratio:\s*auto/.test(last);
  const shrinks = /min-height:\s*(0|120px)/.test(last);
  return [noRatio && shrinks, `${rules.length} stage rules, last drops the ratio=${noRatio}`];
});

check('the transport bar comes after the canvas and cannot be squeezed out', () => {
  const html = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');
  const card = html.slice(html.indexOf('class="viewer-card"'), html.indexOf('class="timeline-card"'));
  const canvasAt = card.indexOf('id="livePreviewCanvas"');
  const transportAt = card.indexOf('class="transport-bar"');
  const css = fs.readFileSync(path.join(PUB, 'styles.css'), 'utf8');
  const pinned = /\.stage-wrap \.transport-bar\s*\{[^}]*flex:\s*0 0 auto/.test(css);
  return [canvasAt > 0 && transportAt > canvasAt && pinned,
    `canvas ${canvasAt} < transport ${transportAt}, pinned=${pinned}`];
});

check('the timeline row cannot grow into the picture', () => {
  const css = fs.readFileSync(path.join(PUB, 'styles.css'), 'utf8');
  const rules = [...css.matchAll(/\.stage-wrap > \.timeline-card\s*\{[^}]*\}/g)].map((m) => m[0]);
  const last = rules[rules.length - 1] || '';
  const joined = rules.join('\n');
  const fixed = /flex:\s*0 0 auto/.test(joined) && /max-height:\s*\d+vh/.test(joined);
  // and no later rule lets it grow back
  const grows = /flex:\s*1/.test(rules[rules.length - 1] || '');
  return [fixed && !grows, `${rules.length} rules, fixed-height=${fixed}, grows=${grows}`];
});

check('the plate is drawn into the framed rect, not the raw canvas', () => {
  const src = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8');
  const fn = src.slice(src.indexOf('function drawMonitorFrame'), src.indexOf('function syncPreviewCanvasSize'));
  const framed = /outputFrameRect\(cw, ch\)/.test(fn) && /ctx\.translate\(frame\.x, frame\.y\)/.test(fn);
  const restored = (fn.match(/ctx\.restore\(\)/g) || []).length >= 3;
  return [framed && restored, `letterbox applied=${framed}, restores balanced=${restored}`];
});

// ============================================================================
// 4. The hint that stops a crop looking like a bug
// ============================================================================
check('a portrait clip says why it looks cropped, and stops once framed', () => {
  const vid = document.getElementById('customVideoElement');
  Object.defineProperty(vid, 'videoWidth', { configurable: true, get: () => 2160 });
  Object.defineProperty(vid, 'videoHeight', { configurable: true, get: () => 3840 });
  P.state.scene = 'custom_video';
  P.state.vertical916 = false;
  P.syncStageHint();
  const note = document.getElementById('stageHint');
  const shown = !note.classList.contains('hidden') && /9:16/.test(note.textContent);
  const said = note.textContent;
  P.state.vertical916 = true;
  P.syncStageHint();
  const gone = note.classList.contains('hidden');
  P.state.vertical916 = false;
  P.syncStageHint();
  return [shown && gone, `"${said}" then hidden=${gone}`];
});

check('a landscape clip warns the other way round', () => {
  const vid = document.getElementById('customVideoElement');
  Object.defineProperty(vid, 'videoWidth', { configurable: true, get: () => 1920 });
  Object.defineProperty(vid, 'videoHeight', { configurable: true, get: () => 1080 });
  P.state.vertical916 = true;
  P.syncStageHint();
  const note = document.getElementById('stageHint');
  const ok = /crops the sides/.test(note.textContent);
  P.state.vertical916 = false;
  P.syncStageHint();
  return [ok, `"${note.textContent}"`];
});

check('with nothing on the stage the hint stays out of the way', () => {
  P.state.scene = 'empty';
  P.syncStageHint();
  const note = document.getElementById('stageHint');
  return [note.classList.contains('hidden'), `hidden=${note.classList.contains('hidden')}`];
});

check.summary('monitor framing');
