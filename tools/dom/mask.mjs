/* ============================================================================
 * Magic Mask checks — the matte maths and the tracking loop, in jsdom
 * ----------------------------------------------------------------------------
 *   node tools/dom/mask.mjs
 *
 * The panel failed in two ways an editor could see: a click on real footage
 * matched nothing, and Track refused every hand-built matte with "click your
 * subject first". Both are behaviour here, not comments: the solver is fed
 * synthetic frames and the tracker is fed a moving subject.
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';
import { boot, makeCheck, PUB } from './harness.mjs';
import { readPng } from './png.mjs';

const { window, document } = boot({ beforeScripts: (w) => { w.__PULSE_TEST__ = true; } });
const check = makeCheck();
const T = window.PulseTest;

// every assertion answers [ok, detail]: a returned string would be truthy and
// quietly pass, which is how a broken check hides
const verify = (label, fn) => check(label, () => {
  if (!T) return [false, 'PulseTest seam missing'];
  try {
    const out = fn();
    if (Array.isArray(out)) return out;
    return [!!out, ''];
  } catch (err) {
    return [false, (err && err.message) || String(err)];
  }
});

if (!T) {
  check('the mask test seam is exposed', () => false, 'window.PulseTest missing');
  check.summary('mask');
  process.exit(1);
}

const W = 320;
const H = 180;

// ---- a synthetic frame: a bright, shaded subject on a dark graded room ------
function frameWithSubject({ cx = 150, cy = 100, r = 38, hole = 0, bg = 26 } = {}) {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      // a vertical gradient in the background: the flood cannot cross it for
      // free, which is the situation on a real set
      const v = bg + Math.round((y / H) * 16);
      data[i] = v;
      data[i + 1] = v + 3;
      data[i + 2] = v + 6;
      data[i + 3] = 255;
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r) {
        const shade = 1 - d / (r * 3.2);
        data[i] = Math.round(214 * shade);
        data[i + 1] = Math.round(198 * shade);
        data[i + 2] = Math.round(178 * shade);
      }
      if (hole && d <= hole) {
        data[i] = 30;
        data[i + 1] = 32;
        data[i + 2] = 36;
      }
    }
  }
  return data;
}

function centroidOf(poly) {
  if (!poly || !poly.length) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  poly.forEach((p) => { x += p.x; y += p.y; });
  return { x: x / poly.length, y: y / poly.length };
}

// ---- one click builds a usable matte ---------------------------------------
const plate = frameWithSubject();
const seed = [{ x: 150 / (W - 1), y: 100 / (H - 1) }];
const matte = T.maskSolveFromPixels(plate, W, H, seed, { mode: 'subject', sensitivity: 38 });
const cov = T.maskCoverage(matte);

verify('one click on the subject builds a matte',
  () => [cov > 0.01 && cov < 0.45, `coverage=${(cov * 100).toFixed(1)}%`]);

const at = (buf, x, y) => buf[y * W + x];
verify('the matte stops at the subject, it does not take the room',
  () => [at(matte, 4, 4) < 110 && at(matte, W - 5, H - 5) < 110 && at(matte, 150, 100) > 110,
    `corner=${at(matte, 4, 4)} centre=${at(matte, 150, 100)}`]);

const poly = T.maskTracePolygon(matte, W, H, 48);
const c = centroidOf(poly);
verify('the outline lands on the subject, not on the click pixel',
  () => [poly.length >= 8 && Math.abs(c.x - 150 / W) < 0.06 && Math.abs(c.y - 100 / H) < 0.06,
    `points=${poly.length} centroid=${c.x.toFixed(3)},${c.y.toFixed(3)}`]);

verify('a shape larger than the click patch still solves (auto-tune, not a slider hunt)', () => {
  const out = T.maskSolveFromPixels(frameWithSubject({ r: 62 }), W, H, seed, { mode: 'subject', sensitivity: 6 });
  const cv = T.maskCoverage(out);
  return [cv > 0.02 && cv < 0.5, `coverage at sensitivity 6 = ${(cv * 100).toFixed(1)}%`];
});

verify('a hole inside the subject belongs to the matte', () => {
  const out = T.maskSolveFromPixels(frameWithSubject({ hole: 12 }), W, H, seed, { mode: 'subject', sensitivity: 38 });
  return [out[100 * W + 150] > 110, 'the inner pocket stayed unselected'];
});

// ---- a hand-drawn matte can be tracked -------------------------------------
verify('seeds come from an existing matte, so painting works as a starting point', () => {
  const box = new Uint8Array(W * H);
  for (let y = 60; y < 140; y++) for (let x = 110; x < 190; x++) box[y * W + x] = 255;
  const seeds = T.maskSeedsFromBuffer(box, 8);
  const inside = seeds.every((s) => s.x > 0.3 && s.x < 0.62 && s.y > 0.3 && s.y < 0.8);
  return [seeds.length >= 3 && inside, `seeds=${seeds.length} inside=${inside}`];
});

verify('the masker samples the frame on screen, not a demo plate', () => {
  const src = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8');
  const body = src.slice(src.indexOf('async function maskSampleFrame'), src.indexOf('async function maskSolve('));
  return [/customVideoElement/.test(body), 'maskSampleFrame does not read the loaded clip'];
});

verify('the matte is solved from the real per-frame pixels, not a drift offset', () => {
  const src = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8');
  const body = src.slice(src.indexOf('async function maskTrackFrames'), src.indexOf('function maskKeyframeMatte'));
  const solved = /maskTemplateAt\(/.test(body) && /maskShiftMaskSub\(/.test(body);
  // the old implementation moved the matte by a fixed trigonometric offset that
  // had nothing to do with the picture
  const drift = /\*\s*0\.0016|Math\.(sin|cos)\([^)]*\)\s*\*\s*[0-9.]+\)?\s*;\s*\/\/ drift/.test(body);
  return [solved && !drift, `solves=${solved} fakeDrift=${drift}`];
});

verify('Track is not gated on a magic-select click', () => {
  const src = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8');
  const body = src.slice(src.indexOf('async function maskTrackFrames'), src.indexOf('function maskKeyframeMatte'));
  const gated = /if \(\!m\.seeds\.length\)\s*\{\s*showToast/.test(body)
    || /click your subject first/i.test(body);
  const fromMatte = /maskSeedsFromBuffer\(m\.soft/.test(body);
  return [!gated && fromMatte, `gated=${gated} seedsFromMatte=${fromMatte}`];
});

// ---- the tracker, on a moving subject --------------------------------------
const frames = [];
// subject centred inside the hand-drawn box at the playhead (1 s), then walking
// right at ~22 px/s of frame width
const subjectAt = (sec) => ({ cx: 122 + (sec - 1) * 22, cy: 96, r: 30, bg: 26 });
window.maskSampleFrame = (sec) => {
  frames.push(+Number(sec).toFixed(3));
  return Promise.resolve({ data: frameWithSubject(subjectAt(Number(sec) || 0)), width: W, height: H });
};

const st = T.state;
st.scene = 'custom_video';
st.totalDurSec = 10;
st.playheadSec = 1;
const m = T.ensureMaskState();
m.soft = null;
m.raw = null;
m.polygon = [];
m.coverage = 0;
m.tracked = [];
m.seeds = [];
m.strokes = [];
m.tool = 'rect';
m.mode = 'subject';
m.view = 'overlay';

const boxBuf = new Uint8Array(W * H);
for (let y = 66; y < 126; y++) for (let x = 92; x < 152; x++) boxBuf[y * W + x] = 255;
m.raw = boxBuf;
T.maskRebuild();
const handBuilt = T.maskHasMatte();

await T.maskTrackFrames(1);
const statusText = String(document.getElementById('maskStatus').textContent || '');
const tracked = m.tracked.slice();

verify('a hand-drawn matte counts as a matte', () => [handBuilt === true, 'maskHasMatte refused a painted matte']);

verify('Track forward works with zero magic-select seeds',
  () => [tracked.length >= 5, `tracked=${tracked.length} status="${statusText}"`]);

verify('tracking follows the subject instead of nudging a fixed shape', () => {
  if (tracked.length < 5) return [false, 'nothing tracked'];
  const first = centroidOf(tracked[0].polygon);
  const last = centroidOf(tracked[tracked.length - 1].polygon);
  const moved = last.x - first.x;
  return [moved > 0.1, `outline moved ${moved.toFixed(3)} of frame over ${tracked.length} frames`];
});

verify('each tracked frame holds a solved outline and a real coverage',
  () => [tracked.every((f) => f.polygon.length >= 8 && f.coverage > 0.002),
    `${tracked.filter((f) => f.polygon.length < 8).length} frames without an outline`]);

verify('the panel never answers "click your subject first" for a painted matte',
  () => [!/click your subject first/i.test(statusText) && !/select your subject/i.test(statusText),
    `status="${statusText}"`]);

verify('tracking puts its buttons back and stops cleanly', () => {
  const btn = document.getElementById('maskTrackFwdBtn');
  return [m.tracking === false && btn && btn.disabled === false,
    `tracking=${m.tracking} disabled=${btn && btn.disabled}`];
});

verify('tracking does not move the playhead', () => [st.playheadSec === 1, `playhead=${st.playheadSec}`]);

verify('the matte survives a slider change without re-clicking', () => {
  m.feather = 14;
  T.maskRebuild();
  return [T.maskHasMatte() && m.polygon.length >= 8, `polygon=${m.polygon.length}`];
});

// the subject walks out of shot: the tracker must stop instead of inventing
// shapes for the empty room
window.maskSampleFrame = () => Promise.resolve({
  data: frameWithSubject({ cx: 900, cy: 96, r: 30 }),
  width: W,
  height: H
});
m.tracked = [];
T.maskRebuild();
await T.maskTrackFrames(1);
const emptyStatus = String(document.getElementById('maskStatus').textContent || '');
verify('tracking stops when the subject leaves the frame, keeping the frame you drew',
  // it coasts for half a second before admitting the subject is gone
  () => [m.tracked.length <= 14 && /lost it|could not follow|could not be followed|stopped handing/i.test(emptyStatus),
    `tracked=${m.tracked.length} status="${emptyStatus}"`]);

// ---- a harder scene: textured room, walking subject, drifting exposure ----
// (a flood-fill tracker leaks here; the colour model should hold the shape)
function hardFrame(sec) {
  const data = new Uint8ClampedArray(W * H * 4);
  const cx = 58 + sec * 20;
  const cy = 96;
  const r = 26;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      // cool, striped wall with a deterministic dither: not a flat colour
      const stripe = (y % 7 === 0) ? 9 : 0;
      const dither = ((x * 37 + y * 61) % 11) - 5;
      let rC = 34 + stripe + dither;
      let gC = 44 + stripe + dither;
      let bC = 62 + stripe + dither;
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r) {
        // warm face, exposure drifts slowly as the clip runs
        const shade = (1 - d / (r * 3.4)) * (1 + 0.1 * Math.sin(sec * 0.9));
        rC = Math.round(196 * shade);
        gC = Math.round(150 * shade);
        bC = Math.round(118 * shade);
      }
      data[i] = Math.max(0, Math.min(255, rC));
      data[i + 1] = Math.max(0, Math.min(255, gC));
      data[i + 2] = Math.max(0, Math.min(255, bC));
      data[i + 3] = 255;
    }
  }
  return data;
}

st.playheadSec = 1;
window.maskSampleFrame = (sec) => Promise.resolve({ data: hardFrame(Number(sec) || 0), width: W, height: H });
const hardBox = new Uint8Array(W * H);
for (let y = 70; y < 122; y++) for (let x = 66; x < 102; x++) hardBox[y * W + x] = 255;
m.raw = hardBox;
m.soft = null;
m.polygon = [];
m.coverage = 0;
m.tracked = [];
m.seeds = [];
m.strokes = [];
m.feather = 6;
m.mode = 'subject';
T.maskRebuild();
await T.maskTrackFrames(1);
const hardTracked = m.tracked.slice();
const errs = hardTracked.map((f) => Math.abs((centroidOf(f.polygon).x * W) - (58 + f.sec * 20)));
const meanErr = errs.length ? errs.reduce((a, b) => a + b, 0) / errs.length : 999;
const covs = hardTracked.map((f) => f.coverage);
const trueArea = (Math.PI * 26 * 26) / (W * H);

verify('a textured, drifting scene is followed without leaking',
  () => [hardTracked.length >= 40, `tracked=${hardTracked.length} status="${m.status}"`]);

verify('the outline stays on the subject (mean error under 3% of frame width)',
  () => [meanErr / W < 0.03, `mean error ${(meanErr / W * 100).toFixed(2)}% of width`]);

verify('the matte keeps the subject size instead of creeping over the scene',
  () => [covs.every((c) => c > trueArea * 0.6 && c < trueArea * 1.7),
    `coverage ${(Math.min(...covs) / trueArea).toFixed(2)}-${(Math.max(...covs) / trueArea).toFixed(2)}x true area, n=${covs.length}`]);

// ---- tracking backwards, from the clip's end -------------------------------
st.playheadSec = 4;
m.tracked = [];
m.raw = hardBox;
m.polygon = [];
m.coverage = 0;
T.maskRebuild();
// put the matte where the subject actually is at 4 s
const atFour = hardFrame(4);
const seedFour = T.maskSolveFromPixels(atFour, W, H, [{ x: (58 + 80) / (W - 1), y: 96 / (H - 1) }], { mode: 'subject', sensitivity: 38 });
m.raw = seedFour;
T.maskRebuild();
await T.maskTrackFrames(-1);
const backTracked = m.tracked.slice();
verify('Track back follows the subject into earlier frames',
  () => [backTracked.length >= 40 && backTracked[0].sec < backTracked[backTracked.length - 1].sec,
    `tracked=${backTracked.length} first=${backTracked[0] && backTracked[0].sec}`]);

// ---- it must not jump: a look-alike object, and an occluded face ------------
function sceneFrame(sec, opts = {}) {
  const { distractor = false, hidden = false } = opts;
  const data = new Uint8ClampedArray(W * H * 4);
  const cx = 60 + sec * 18;
  const cy = 92;
  const r = 25;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const dither = ((x * 29 + y * 53) % 9) - 4;
      let R = 30 + dither;
      let G = 38 + dither;
      let B = 54 + dither;
      const d = Math.hypot(x - cx, y - cy);
      if (!hidden && d <= r) {
        const shade = 1 - d / (r * 3.6);
        R = Math.round(198 * shade);
        G = Math.round(152 * shade);
        B = Math.round(120 * shade);
      }
      // a warm lamp on the far side of frame, same colours as the subject
      if (distractor) {
        const dx = x - (256 + Math.sin(sec) * 10);
        const dy = y - 46;
        if (Math.hypot(dx, dy) <= 16) {
          R = Math.min(255, R + 190);
          G = Math.min(255, G + 140);
          B = Math.min(255, B + 110);
        }
      }
      data[i] = R;
      data[i + 1] = G;
      data[i + 2] = B;
      data[i + 3] = 255;
    }
  }
  return data;
}

function runScene(opts, seedX) {
  st.scene = 'custom_video';
  st.totalDurSec = 8;
  st.playheadSec = 1;
  const mm = T.ensureMaskState();
  mm.seeds = [];
  mm.strokes = [];
  mm.tracked = [];
  mm.soft = null;
  mm.raw = null;
  mm.mode = 'subject';
  mm.feather = 6;
  // one click on the subject, exactly what an editor would do
  window.maskSampleFrame = (sec) => Promise.resolve({ data: sceneFrame(Number(sec) || 0, opts), width: W, height: H });
  const first = sceneFrame(1, opts);
  const clicked = T.maskSolveFromPixels(first, W, H, [{ x: seedX / W, y: 92 / H }], { mode: 'subject', sensitivity: 38 });
  mm.raw = clicked;
  T.maskRebuild();
  return mm;
}

const seedX = 60 + 18;
const mmA = runScene({ distractor: true }, seedX);
await T.maskTrackFrames(1);
const distractTracked = mmA.tracked.slice();
const distractErr = distractTracked.map((f) => Math.abs(centroidOf(f.polygon).x * W - (60 + f.sec * 18)));
const worstErr = distractErr.length ? Math.max(...distractErr) : 999;
const steps = [];
for (let i = 1; i < distractTracked.length; i++) {
  const a = centroidOf(distractTracked[i - 1].polygon);
  const b = centroidOf(distractTracked[i].polygon);
  steps.push(Math.hypot((b.x - a.x) * W, (b.y - a.y) * H));
}
const worstStep = steps.length ? Math.max(...steps) : 999;

verify('a look-alike object elsewhere does not steal the matte',
  () => [distractTracked.length > 30 && worstErr < 9,
    `tracked=${distractTracked.length} worst error=${worstErr.toFixed(1)}px`]);

verify('the outline never jumps: no frame moves more than 6px',
  () => [worstStep < 6, `largest step=${worstStep.toFixed(1)}px`]);

// occluded: two frames with nobody in them, then the subject returns
const mmB = runScene({ hidden: false }, seedX);
window.maskSampleFrame = (sec) => {
  const t = Number(sec) || 0;
  const hidden = t > 2.0 && t < 2.25;
  return Promise.resolve({ data: sceneFrame(t, { hidden }), width: W, height: H });
};
await T.maskTrackFrames(1);
const occl = mmB.tracked.slice();
const afterOcc = occl.filter((f) => f.sec >= 2.4);
const occlErr = afterOcc.map((f) => Math.abs(centroidOf(f.polygon).x * W - (60 + f.sec * 18)));
verify('a couple of occluded frames do not throw the matte off',
  () => [occl.length > 30 && (!occlErr.length || Math.max(...occlErr) < 12),
    `tracked=${occl.length} worst after occlusion=${occlErr.length ? Math.max(...occlErr).toFixed(1) : 'n/a'}px`]);

// a browser that will not hand over frames: say so, do not blame the matte
window.maskSampleFrame = (sec) => Promise.resolve({
  data: hardFrame(Number(sec) || 0),
  width: W,
  height: H,
  seekOk: false
});
st.playheadSec = 1;
m.raw = hardBox;
m.polygon = [];
m.coverage = 0;
m.tracked = [];
T.maskRebuild();
await T.maskTrackFrames(1);
const stuckMsg = String(document.getElementById('maskStatus').textContent || '');
verify('a clip that will not seek is reported as a decode problem, not a lost subject',
  () => [/not giving new frames|stopped handing over frames/i.test(stuckMsg), `status="${stuckMsg}"`]);

verify('Clear empties the matte and the tracked frames', () => {
  document.getElementById('maskClearBtn').click();
  return [!m.soft && m.tracked.length === 0 && m.seeds.length === 0,
    `soft=${!!m.soft} tracked=${m.tracked.length} seeds=${m.seeds.length}`];
});

// the monitor draws with object-fit: contain, so a click must be mapped to the
// picture, not to the element box (which includes the bars)
verify('a click on the monitor maps to the picture, bars and all', () => {
  const canvas = document.getElementById('livePreviewCanvas');
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 400, right: 400, bottom: 400 });
  const centre = T.maskPointFromEvent({ clientX: 200, clientY: 200 }, canvas);
  const bar = T.maskPointFromEvent({ clientX: 200, clientY: 20 }, canvas);
  return [Math.abs(centre.x - 0.5) < 0.02 && Math.abs(centre.y - 0.5) < 0.02 && bar.y < 0.02,
    `centre=${centre.x.toFixed(3)},${centre.y.toFixed(3)} bar=${bar.y.toFixed(3)}`];
});

st.scene = 'empty';
m.seeds = [{ x: 0.4, y: 0.5 }];
await T.maskSolve({ announce: true });
const emptyMsg = String(document.getElementById('maskStatus').textContent || '');
verify('a click with nothing loaded asks for footage instead of matting a demo plate',
  () => [/load a clip or a photo/i.test(emptyMsg), `status="${emptyMsg}"`]);
st.scene = 'custom_video';

verify('the panel sells a real tracker instead of "buy Studio"', () => {
  const hint = String(document.querySelector('.mask-hint').textContent || '');
  const bad = /can't run|Studio-only|Studio only|upgrade/i.test(hint);
  return [!bad && /tracker|follow/i.test(String(document.querySelector('#tab-mask').textContent || '')),
    `hint="${hint.slice(0, 90)}…"`];
});

verify('the mask panel gives four numbered steps', () => {
  const steps = [...document.querySelectorAll('.mask-steps li')];
  return [steps.length === 4, `steps=${steps.length}`];
});
// ---- real footage: the frame the editor reported the bug on ------------------
// A dark-graded stage shot with a person in it, a bright blurry stage area on
// the left, and the subject's clothes almost the same colour as the room.
const fixture = readPng(path.join(PUB, '..', 'tools/dom/fixtures/click-subject.png'));
const FW = fixture.width;
const FH = fixture.height;
const shifted = (dx) => {
  const d = new Uint8ClampedArray(FW * FH * 4);
  for (let y = 0; y < FH; y++) {
    for (let x = 0; x < FW; x++) {
      const sx = Math.min(FW - 1, Math.max(0, x - dx));
      const s = (y * FW + sx) * 4;
      const i = (y * FW + x) * 4;
      d[i] = fixture.data[s];
      d[i + 1] = fixture.data[s + 1];
      d[i + 2] = fixture.data[s + 2];
      d[i + 3] = 255;
    }
  }
  return d;
};
const boxOf = (buf) => {
  let n = 0;
  let x0 = FW;
  let y0 = FH;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < FH; y++) {
    for (let x = 0; x < FW; x++) {
      if (buf[y * FW + x] <= 110) continue;
      n++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return { n, cov: n / (FW * FH), x0, y0, x1, y1 };
};

verify('on real footage, one click selects the subject and not the frame', () => {
  const out = T.maskClickSelect(fixture.data, { x: 165 / (FW - 1), y: 120 / (FH - 1) });
  const b = boxOf(out);
  const onSubject = out[120 * FW + 165] > 110;
  const blob = out[55 * FW + 60] > 110;
  return [b.cov > 0.02 && b.cov < 0.25 && onSubject && !blob,
    `cov=${(b.cov * 100).toFixed(1)}% onSubject=${onSubject} blob=${blob}`];
});

verify('the click works anywhere on the subject, not just one lucky pixel', () => {
  const pts = [[158, 88], [165, 95], [172, 105], [160, 120], [170, 130], [165, 145]];
  const bad = [];
  pts.forEach(([x, y]) => {
    const out = T.maskClickSelect(fixture.data, { x: x / (FW - 1), y: y / (FH - 1) });
    const b = boxOf(out);
    const tall = (b.y1 - b.y0) > (b.x1 - b.x0) * 0.9;
    if (!(b.cov > 0.02 && b.cov < 0.25 && tall && out[55 * FW + 60] <= 110)) {
      bad.push(`${x},${y}:${(b.cov * 100).toFixed(1)}%`);
    }
  });
  return [bad.length === 0, 'failed clicks: ' + bad.join(' ')];
});

// the same footage, panning 5px a frame — the matte must ride with it
const rm = T.ensureMaskState();
rm.seeds = [];
rm.strokes = [];
rm.tracked = [];
rm.soft = null;
rm.raw = null;
rm.mode = 'subject';
rm.feather = 4;
st.scene = 'custom_video';
st.totalDurSec = 6;
st.playheadSec = 0;
rm.raw = T.maskClickSelect(fixture.data, { x: 165 / (FW - 1), y: 120 / (FH - 1) });
T.maskRebuild();
const startX = centroidOf(rm.polygon).x * FW;
const realFirstCov = rm.coverage;
window.maskSampleFrame = (sec) => Promise.resolve({
  data: shifted(Math.round((Number(sec) || 0) * 5)),
  width: FW,
  height: FH
});
await T.maskTrackFrames(1);
const realTracked = rm.tracked.slice();
const realErr = realTracked.map((f) => Math.abs(centroidOf(f.polygon).x * FW - (startX + f.sec * 5)));
const realSteps = [];
for (let i = 1; i < realTracked.length; i++) {
  const a = centroidOf(realTracked[i - 1].polygon);
  const b = centroidOf(realTracked[i].polygon);
  realSteps.push(Math.hypot((b.x - a.x) * FW, (b.y - a.y) * FH));
}

verify('on real footage the matte rides a pan instead of drifting off',
  () => [realTracked.length > 40 && realErr.length > 0 && Math.max(...realErr) < 12,
    `tracked=${realTracked.length} worst drift=${realErr.length ? Math.max(...realErr).toFixed(1) : 'n/a'}px`]);

verify('on real footage no frame jumps',
  () => [realSteps.length > 20 && Math.max(...realSteps) < 14,
    `largest step=${realSteps.length ? Math.max(...realSteps).toFixed(1) : 'n/a'}px`]);

verify('on real footage the matte keeps its size while following',
  () => {
    const covs = realTracked.map((f) => f.coverage);
    const lo = Math.min(...covs);
    const hi = Math.max(...covs);
    return [lo > realFirstCov * 0.55 && hi < realFirstCov * 1.6,
      `coverage ${(lo * 100).toFixed(1)}-${(hi * 100).toFixed(1)}% vs first ${(realFirstCov * 100).toFixed(1)}%`];
  });

verify('the matte is person-shaped: taller than it is wide, centred on the click',
  () => {
    const out = T.maskClickSelect(fixture.data, { x: 165 / (FW - 1), y: 120 / (FH - 1) });
    const bb = boxOf(out);
    const w = bb.x1 - bb.x0;
    const h = bb.y1 - bb.y0;
    return [h > w * 1.1 && Math.abs((bb.x0 + bb.x1) / 2 - 165) < 40,
      `box=${bb.x0},${bb.y0}-${bb.x1},${bb.y1}`];
  });


// ---- full clip, strokes that travel, and edges that snap --------------------
check('the tracker is not capped at a couple of seconds', () => {
  const src = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8');
  const body = src.slice(src.indexOf('async function maskTrackFrames'), src.indexOf('function maskKeyframeMatte'));
  const frameStep = /const stride = 1 \/ fps/.test(body);
  const longRun = /Math\.min\(2400/.test(body);
  const cancel = /trackCancel/.test(body);
  return [frameStep && longRun && cancel, `frameStep=${frameStep} longRun=${longRun} cancel=${cancel}`];
});

check('the panel offers a stop button while following', () =>
  !!document.getElementById('maskTrackCancelBtn'));

check('strokes are carried with the subject, not painted once', () => {
  const src = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8');
  const body = src.slice(src.indexOf('async function maskTrackFrames'), src.indexOf('function maskKeyframeMatte'));
  return [/maskEnforceStrokes\(refined, m, sdx, sdy\)/.test(body),
    'strokes are not enforced per frame'];
});

verify('a painted correction overrides the auto-select', () => {
  // the subject's colours plus a stroke marking the lamp as background
  const mm = T.ensureMaskState();
  mm.seeds = [];
  mm.tracked = [];
  mm.mode = 'subject';
  mm.raw = T.maskClickSelect(fixture.data, { x: 165 / (FW - 1), y: 120 / (FH - 1) });
  T.maskRebuild();
  const before = T.maskCoverage(mm.soft);
  mm.strokes = [{ erase: true, radius: 90, points: [{ x: 60 / FW, y: 55 / FH }, { x: 80 / FW, y: 60 / FH }] }];
  T.maskRebuild();
  const after = T.maskCoverage(mm.soft);
  mm.strokes = [];
  T.maskRebuild();
  return [after <= before + 0.0001, `coverage ${(before * 100).toFixed(1)}% -> ${(after * 100).toFixed(1)}%`];
});

verify('the outline snaps onto the silhouette', () => {
  // a rectangle whose right side sits just inside a hard vertical edge
  const ring = [];
  const x0 = 0.35;
  const x1 = 0.60;
  const y0 = 0.35;
  const y1 = 0.65;
  for (let k = 0; k < 6; k++) ring.push({ x: x0 + ((x1 - x0) * k) / 5, y: y0 });
  for (let k = 0; k < 6; k++) ring.push({ x: x1, y: y0 + ((y1 - y0) * k) / 5 });
  for (let k = 0; k < 6; k++) ring.push({ x: x1 - ((x1 - x0) * k) / 5, y: y1 });
  for (let k = 0; k < 6; k++) ring.push({ x: x0, y: y1 - ((y1 - y0) * k) / 5 });
  const edgeX = Math.round(x1 * (W - 1)) + 2;   // 2px outside the ring
  const luma = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) luma[y * W + x] = x < edgeX ? 20 : 200;
  }
  const snapped = T.maskSnapRing(ring, luma, 3);
  const rightSide = ring.map((p, i) => ({ p, s: snapped[i] })).filter((o) => o.p.x > x1 - 0.005);
  const moved = rightSide.filter((o) => Math.abs(o.s.x * (W - 1) - edgeX) < 2.5).length;
  return [moved >= rightSide.length * 0.7,
    `${moved}/${rightSide.length} right-edge points landed on the edge`];
});

verify('snapping raises the image detail under the outline on real footage', () => {
  const luma = T.maskLuma(fixture.data, FW, FH);
  const before = T.maskClickSelect(fixture.data, { x: 165 / (FW - 1), y: 120 / (FH - 1) });
  const ring = T.maskResamplePolygon ? T.maskResamplePolygon(T.maskTracePolygon
    ? T.maskTracePolygon(before, FW, FH, 24) : [], 24) : [];
  if (!ring.length) return [false, 'no ring to test'];
  const gradAt = (pts) => {
    let sum = 0;
    pts.forEach((p) => {
      const xi = Math.round(p.x * (FW - 1));
      const yi = Math.round(p.y * (FH - 1));
      if (xi < 1 || yi < 1 || xi >= FW - 1 || yi >= FH - 1) return;
      const i = yi * FW + xi;
      const gx = luma[i + 1] - luma[i - 1];
      const gy = luma[i + FW] - luma[i - FW];
      sum += Math.hypot(gx, gy);
    });
    return sum / pts.length;
  };
  const snapped = T.maskSnapRing(ring, luma, 3);
  const a = gradAt(ring);
  const b = gradAt(snapped);
  return [b >= a * 1.05, `edge strength ${a.toFixed(1)} -> ${b.toFixed(1)}`];
});

verify('the outline cannot shimmer while the subject is still', () => {
  const a = [];
  const b = [];
  for (let k = 0; k < 24; k++) {
    const ang = (k / 24) * Math.PI * 2;
    a.push({ x: 0.5 + Math.cos(ang) * 0.1, y: 0.5 + Math.sin(ang) * 0.1 });
    b.push({ x: 0.5 + Math.cos(ang) * 0.1 + 0.05, y: 0.5 + Math.sin(ang) * 0.1 });
  }
  const calmed = T.maskCalmRing(b, a, 0.014);
  const moved = Math.max(...calmed.map((p, i) => Math.hypot(p.x - a[i].x, p.y - a[i].y)));
  return [moved <= 0.0141, `largest per-point move=${moved.toFixed(4)}`];
});

check.summary('mask');
window.close();
process.exit(process.exitCode || 0);
