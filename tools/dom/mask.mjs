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
  const solved = /maskSolveFromPixels\(/.test(body);
  const drift = /drift|0\.0016/.test(body);
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
verify('tracking stops when the subject leaves the frame',
  () => [m.tracked.length === 0 && /could not follow/i.test(emptyStatus),
    `tracked=${m.tracked.length} status="${emptyStatus}"`]);

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

verify('the mask panel gives four numbered steps', () => {
  const steps = [...document.querySelectorAll('.mask-steps li')];
  return [steps.length === 4, `steps=${steps.length}`];
});

check.summary('mask');
window.close();
process.exit(process.exitCode || 0);
