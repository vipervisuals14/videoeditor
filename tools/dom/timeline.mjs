/* ============================================================================
 * Timeline — dragging clips to trim and move them
 * ----------------------------------------------------------------------------
 * The point of this suite: a drag has to change the edit *and* the picture.
 *
 *   - the model: every op returns what it actually applied, clamped by the
 *     source, so an edge cannot be dragged past the end of the footage;
 *   - the page: real pointer events on the real lane element, with the lane
 *     measured the way a browser would measure it;
 *   - the monitor: timeline time → source time, which is how a trim becomes a
 *     different frame on screen.
 *
 *   node tools/dom/timeline.mjs
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';
import { boot, makeCheck, PUB } from './harness.mjs';

const check = makeCheck();
const { window, document } = boot({ beforeScripts: (w) => { w.__PULSE_TEST__ = true; } });
const P = window.PulseTest;
const T = window.TIMELINE;
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// A lane 600 px wide starting at x=100: what a real browser would report, and
// what makes a 100 px drag mean a known number of seconds.
const LANE = { left: 100, width: 600 };
const LANE_TOP = 500;
const LANE_HEIGHT = 38;

function stageVideo(seconds) {
  const vid = document.getElementById('customVideoElement');
  vid.setAttribute('src', 'blob:timeline-clip');
  Object.defineProperty(vid, 'videoWidth', { configurable: true, get: () => 1920 });
  Object.defineProperty(vid, 'videoHeight', { configurable: true, get: () => 1080 });
  Object.defineProperty(vid, 'duration', { configurable: true, get: () => seconds });
  Object.defineProperty(vid, 'readyState', { configurable: true, get: () => 4 });
  let ct = 0;
  Object.defineProperty(vid, 'currentTime', {
    configurable: true,
    get: () => ct,
    set: (v) => { ct = Number(v) || 0; }
  });
  Object.defineProperty(vid, 'paused', { configurable: true, get: () => false });
  vid.play = () => Promise.resolve();
  vid.pause = () => {};
  vid.load = () => {};
  P.state.scene = 'custom_video';
  P.state.plateFile = { name: 'interview_a_cam.mov', size: 1000 };
  return vid;
}

const lane = () => document.getElementById('laneV1');
lane().getBoundingClientRect = () => ({ left: LANE.left, top: LANE_TOP, width: LANE.width, height: LANE_HEIGHT, right: LANE.left + LANE.width, bottom: LANE_TOP + LANE_HEIGHT });

function clipEls() {
  return $$('#laneV1 .tl-clip');
}

// The clip element's own rect, derived from the geometry the renderer wrote
function clipRect(el) {
  const left = parseFloat(/left:\s*([\d.]+)px/.exec(el.getAttribute('style'))[1]);
  const width = parseFloat(/width:\s*([\d.]+)px/.exec(el.getAttribute('style'))[1]);
  return { left: LANE.left + left, width, top: LANE_TOP, right: LANE.left + left + width };
}

// A browser lays these out; jsdom does not. Report the rect the renderer just
// wrote, so the hit test and the drag both see a real element.
window.Element.prototype.getBoundingClientRect = function () {
  if (this === lane()) return { left: LANE.left, top: LANE_TOP, width: LANE.width, height: LANE_HEIGHT, right: LANE.left + LANE.width, bottom: LANE_TOP + LANE_HEIGHT };
  if (this.classList && this.classList.contains('tl-clip')) {
    const r = clipRect(this);
    return { left: r.left, top: r.top, width: r.width, height: LANE_HEIGHT, right: r.right, bottom: r.top + LANE_HEIGHT };
  }
  return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
};

function pointer(type, clientX, clientY) {
  return new window.PointerEvent(type, { clientX, clientY, bubbles: true, pointerId: 1 });
}

function drag(el, fromX, toX) {
  const rect = clipRect(el);
  el.dispatchEvent(pointer('pointerdown', rect.left + fromX, LANE_TOP + 10));
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    const x = rect.left + fromX + ((toX - fromX) * i) / steps;
    document.dispatchEvent(pointer('pointermove', x, LANE_TOP + 10));
  }
  document.dispatchEvent(pointer('pointerup', rect.left + toX, LANE_TOP + 10));
}

function resetTimeline(clips) {
  P.state.tl.selectedId = null;
  P.state.tl.drag = null;
  P.tlSetClips(clips);
}

// ============================================================================
// 1. The model
// ============================================================================
check('the timeline module loads with the page', () => {
  const html = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');
  return [!!T && typeof T.trimIn === 'function' && /timeline\.js/.test(html), T ? `v${T.VERSION}` : 'missing'];
});

const base = () => [T.makeClip({ id: 'a', name: 'A', startSec: 0, srcIn: 0, srcOut: 6, srcDur: 20 })];

check('a clip is a window on the source, so its length is out − in', () => {
  const c = base()[0];
  return [T.len(c) === 6 && T.endOf(c) === 6, `len ${T.len(c)}, end ${T.endOf(c)}`];
});

check('trimming the left edge moves the picture as well as the box', () => {
  const r = T.trimIn(base(), 'a', 2);
  return [Math.abs(r.clip.startSec - 2) < 1e-6 && Math.abs(r.clip.srcIn - 2) < 1e-6 && T.len(r.clip) === 4,
    `start ${r.clip.startSec}, srcIn ${r.clip.srcIn}, len ${T.len(r.clip)}`];
});

check('trimming the right edge lengthens and shortens the same window', () => {
  const longer = T.trimOut(base(), 'a', 3);
  const shorter = T.trimOut(longer.clips, 'a', -4);
  return [Math.abs(longer.applied - 3) < 1e-6 && Math.abs(T.len(shorter.clip) - 5) < 1e-6,
    `6s → ${T.len(longer.clip)}s → ${T.len(shorter.clip)}s`];
});

check('an edge cannot be dragged past the end of the footage', () => {
  const clips = [T.makeClip({ id: 'a', startSec: 0, srcIn: 8, srcOut: 18, srcDur: 20 })];
  const r = T.trimOut(clips, 'a', 99);
  return [Math.abs(r.applied - 2) < 1e-6 && Math.abs(r.clip.srcOut - 20) < 1e-6,
    `asked for +99s, applied +${r.applied}s (srcOut ${r.clip.srcOut} of 20)`];
});

check('an edge cannot be dragged before the first frame', () => {
  const clips = [T.makeClip({ id: 'a', startSec: 3, srcIn: 1, srcOut: 5, srcDur: 20 })];
  const r = T.trimIn(clips, 'a', -4);
  return [Math.abs(r.applied + 1) < 1e-6 && r.clip.srcIn === 0 && Math.abs(r.clip.startSec - 2) < 1e-6,
    `applied ${r.applied}s: srcIn ${r.clip.srcIn}, start ${r.clip.startSec}`];
});

check('a clip cannot be trimmed to nothing', () => {
  const r = T.trimOut(base(), 'a', -100);
  return [T.len(r.clip) >= T.MIN_LEN - 1e-9 && Math.abs(r.clip.srcOut - T.MIN_LEN) < 1e-6,
    `left ${T.len(r.clip).toFixed(2)}s (floor ${T.MIN_LEN}s)`];
});

check('moving a clip keeps its window and cannot go before zero', () => {
  const clips = [T.makeClip({ id: 'a', startSec: 2, srcIn: 1, srcOut: 5, srcDur: 20 })];
  const right = T.move(clips, 'a', 3);
  const left = T.move(right.clips, 'a', -99);
  return [right.clip.startSec === 5 && right.clip.srcIn === 1 && left.clip.startSec === 0,
    `2s → ${right.clip.startSec}s → ${left.clip.startSec}s, srcIn unchanged at ${left.clip.srcIn}`];
});

check('a drag snaps onto a neighbouring edge', () => {
  const clips = T.normalise([
    { id: 'a', startSec: 0, srcIn: 0, srcOut: 4, srcDur: 20 },
    { id: 'b', startSec: 5, srcIn: 0, srcOut: 4, srcDur: 20 }
  ]);
  const targets = T.snapTargets(clips, 'a', []);
  const snapped = T.snap(4.9, targets, 0.25);
  const free = T.snap(6.5, targets, 0.25);
  return [snapped === 5 && free === 6.5, `4.9 → ${snapped} (b starts at 5), 6.5 stays ${free}`];
});

check('splitting a clip cuts the source window in the right place', () => {
  const clips = [T.makeClip({ id: 'a', startSec: 2, srcIn: 4, srcOut: 10, srcDur: 20 })];
  const res = T.splitAt(clips, 'a', 5);
  const [a, b] = res.made;
  return [res.made.length === 2 && a.srcOut === 7 && b.srcIn === 7 && b.startSec === 5,
    `cut at timeline 5s → source 7s (${a.srcIn}-${a.srcOut} | ${b.srcIn}-${b.srcOut})`];
});

// ============================================================================
// 2. The page: adding a clip
// ============================================================================
const vid = stageVideo(14);

check('a loaded clip can be put on the timeline', () => {
  resetTimeline([]);
  const clip = P.tlAddClipFromStage();
  return [!!clip && P.tlClips().length === 1 && Math.abs(T.len(clip) - 14) < 1e-6
    && clipEls().length === 1,
    clip ? `“${clip.name}” ${T.len(clip)}s, ${clipEls().length} clip on V1` : 'nothing added'];
});

check('the timeline owns the transport clock once it has clips', () => {
  return [Math.abs(P.state.totalDurSec - 14) < 1e-6 && P.tlDuration() === 14,
    `totalDurSec ${P.state.totalDurSec}, tlDuration ${P.tlDuration()}`];
});

check('adding a second clip appends it instead of stacking on top', () => {
  const second = P.tlAddClipFromStage();
  return [P.tlClips().length === 2 && Math.abs(second.startSec - 14) < 1e-6,
    `${P.tlClips().length} clips, second starts at ${second.startSec}s`];
});

check('a clip that has not finished loading lands on V1 by itself', () => {
  resetTimeline([]);
  let d = 0;
  Object.defineProperty(vid, 'duration', { configurable: true, get: () => d });
  const refused = P.tlAddClipFromStage();
  const waited = P.state.tl.waitingForMeta === true && P.tlClips().length === 0;
  d = 9;
  vid.dispatchEvent(new window.Event('loadedmetadata'));
  const clip = P.tlClips()[0];
  const added = !!clip && Math.abs(T.len(clip) - 9) < 1e-6;
  Object.defineProperty(vid, 'duration', { configurable: true, get: () => 14 });
  return [refused === null && waited && added,
    `click did nothing but waited=${waited}, then ${added ? T.len(clip) + 's clip' : 'nothing'} appeared`];
});

check('every refused click says something', () => {
  const src = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8');
  const body = src.slice(src.indexOf('function tlAddClipFromStage()'), src.indexOf('function tlRenderRuler'));
  const returns = (body.match(/return null;/g) || []).length;
  const toasts = (body.match(/showToast\(/g) || []).length;
  return [toasts >= returns, `${returns} early returns, ${toasts} messages`];
});

check('the empty-state note disappears once there is an edit', () => {
  return [$('#tlEmptyNote').classList.contains('hidden'), `hidden=${$('#tlEmptyNote').classList.contains('hidden')}`];
});

// ============================================================================
// 3. The page: dragging
// ============================================================================
const SPAN = 28;   // two 14s clips, span = 28 * 1.02 ≈ 28.6

check('dragging the right edge shortens the clip', () => {
  resetTimeline([T.makeClip({ id: 'a', name: 'A', startSec: 0, srcIn: 0, srcOut: 10, srcDur: 20 })]);
  const before = P.tlClips()[0];
  const el = clipEls()[0];
  const rect = clipRect(el);
  const pxPerSec = rect.width / T.len(before);
  drag(el, rect.width - 2, rect.width - 2 - pxPerSec * 3);   // 3 seconds shorter
  const after = P.tlClips()[0];
  return [Math.abs(T.len(after) - 7) < 0.4 && after.srcIn === 0,
    `${T.len(before).toFixed(2)}s → ${T.len(after).toFixed(2)}s (wanted ~7s)`];
});

check('dragging the left edge trims into the footage', () => {
  resetTimeline([T.makeClip({ id: 'a', name: 'A', startSec: 0, srcIn: 0, srcOut: 10, srcDur: 20 })]);
  const el = clipEls()[0];
  const rect = clipRect(el);
  const pxPerSec = rect.width / 10;
  drag(el, 2, 2 + pxPerSec * 2.5);
  const after = P.tlClips()[0];
  return [Math.abs(after.srcIn - 2.5) < 0.4 && Math.abs(after.startSec - 2.5) < 0.4
    && Math.abs(T.len(after) - 7.5) < 0.5,
    `srcIn ${after.srcIn.toFixed(2)}, start ${after.startSec.toFixed(2)}, len ${T.len(after).toFixed(2)}`];
});

check('dragging an edge longer than the footage exists stops at the end', () => {
  resetTimeline([T.makeClip({ id: 'a', name: 'A', startSec: 0, srcIn: 10, srcOut: 14, srcDur: 20 })]);
  const el = clipEls()[0];
  const rect = clipRect(el);
  const pxPerSec = rect.width / 4;                   // 4s clip
  drag(el, rect.width - 2, rect.width - 2 + pxPerSec * 18);   // ask for +18s, only 6 exist
  const after = P.tlClips()[0];
  return [Math.abs(after.srcOut - 20) < 0.05 && Math.abs(T.len(after) - 10) < 0.05,
    `srcOut ${after.srcOut.toFixed(2)} of 20 (len ${T.len(after).toFixed(2)}s)`];
});

check('dragging the middle moves the clip, keeping the same footage', () => {
  resetTimeline([T.makeClip({ id: 'a', name: 'A', startSec: 0, srcIn: 3, srcOut: 9, srcDur: 20 })]);
  const el = clipEls()[0];
  const rect = clipRect(el);
  const pxPerSec = rect.width / 6;
  drag(el, rect.width / 2, rect.width / 2 + pxPerSec * 2);
  const after = P.tlClips()[0];
  return [Math.abs(after.startSec - 2) < 0.4 && Math.abs(after.srcIn - 3) < 1e-6,
    `start ${after.startSec.toFixed(2)}s, srcIn still ${after.srcIn}`];
});

check('a drag cannot end with a clip before zero', () => {
  resetTimeline([T.makeClip({ id: 'a', name: 'A', startSec: 1, srcIn: 0, srcOut: 4, srcDur: 20 })]);
  const el = clipEls()[0];
  const rect = clipRect(el);
  drag(el, rect.width / 2, rect.width / 2 - 500);
  const after = P.tlClips()[0];
  return [after.startSec >= 0, `start ${after.startSec.toFixed(3)}s`];
});

check('the clip on screen matches the numbers in the model', () => {
  const before = P.tlClips()[0];
  const el = clipEls()[0];
  const rect = clipRect(el);
  const pxPerSec = rect.width / T.len(before);
  drag(el, rect.width - 2, rect.width - 2 - pxPerSec * 1.5);
  const after = P.tlClips()[0];
  const r2 = clipRect(clipEls()[0]);
  const drawnLen = r2.width * (P.tlSpan() / LANE.width);
  return [Math.abs(drawnLen - T.len(after)) < 0.25,
    `model ${T.len(after).toFixed(2)}s, drawn ${drawnLen.toFixed(2)}s`];
});

// ============================================================================
// 4. The page: the monitor follows the timeline
// ============================================================================
check('timeline time maps to source time through the trims', () => {
  resetTimeline([
    T.makeClip({ id: 'a', name: 'A', startSec: 0, srcIn: 5, srcOut: 9, srcDur: 20 }),
    T.makeClip({ id: 'b', name: 'B', startSec: 4, srcIn: 12, srcOut: 16, srcDur: 20 })
  ]);
  const a = P.stageSourceTime(0);
  const mid = P.stageSourceTime(3.5);
  const b = P.stageSourceTime(5);
  return [a === 5 && Math.abs(mid - 8.5) < 1e-6 && b === 13,
    `t=0 → src ${a}, t=3.5 → src ${mid}, t=5 → src ${b}`];
});

check('a gap between clips holds the picture instead of guessing', () => {
  resetTimeline([
    T.makeClip({ id: 'a', startSec: 0, srcIn: 0, srcOut: 3, srcDur: 20 }),
    T.makeClip({ id: 'b', startSec: 6, srcIn: 10, srcOut: 13, srcDur: 20 })
  ]);
  return [P.stageSourceTime(4) === null && P.stageSourceTime(7) === 11,
    `gap at t=4 → ${P.stageSourceTime(4)}, t=7 → ${P.stageSourceTime(7)}`];
});

check('seeking moves the element to the trimmed frame', () => {
  resetTimeline([T.makeClip({ id: 'a', startSec: 0, srcIn: 4, srcOut: 10, srcDur: 20 })]);
  P.seekTo(2);
  return [Math.abs(vid.currentTime - 6) < 1e-6,
    `playhead 2s → element ${vid.currentTime}s (clip starts at source 4s)`];
});

check('playback stops at the end of the timeline instead of looping', () => {
  resetTimeline([T.makeClip({ id: 'a', startSec: 0, srcIn: 0, srcOut: 4, srcDur: 20 })]);
  P.state.playheadSec = 4;
  P.state.isPlaying = true;
  P.tlPlaybackTick();
  const stopped = P.state.isPlaying === false && P.state.playheadSec === 4;
  return [stopped, `isPlaying=${P.state.isPlaying}, playhead=${P.state.playheadSec}`];
});

// ============================================================================
// 5. The page: split, delete, and honesty
// ============================================================================
check('split at the playhead makes two trimmable clips', () => {
  resetTimeline([T.makeClip({ id: 'a', name: 'A', startSec: 0, srcIn: 0, srcOut: 8, srcDur: 20 })]);
  P.state.playheadSec = 3;
  const made = P.tlSplitAtPlayhead();
  const clips = P.tlClips();
  return [!!made && clips.length === 2 && clips[1].srcIn === 3 && clips[0].srcOut === 3,
    `${clips.length} clips: ${clips.map((c) => `${c.startSec}s(${c.srcIn}-${c.srcOut})`).join(' | ')}`];
});

check('delete removes the selected clip and nothing else', () => {
  const before = P.tlClips().length;
  P.state.tl.selectedId = P.tlClips()[0].id;
  const ok = P.tlDeleteSelected();
  return [ok && P.tlClips().length === before - 1, `${before} → ${P.tlClips().length} clips`];
});

check('nothing lands on the timeline by itself', () => {
  const src = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8');
  // adding a clip may only be triggered by the button (and the test seam)
  const calls = (src.match(/[^.\w]tlAddClipFromStage\(\)/g) || []).length;
  const bound = /getElementById\('tlAddClipBtn'\)[\s\S]{0,80}addEventListener\('click'[\s\S]{0,60}tlAddClipFromStage/.test(src);
  const note = /getElementById\('tlEmptyNote'\)[\s\S]{0,120}addEventListener\('click'[\s\S]{0,60}tlAddClipFromStage/.test(src);
  // and the boot sequence never seeds the lane on its own
  const seeded = /DOMContentLoaded[\s\S]{0,900}tlSetClips/.test(src);
  return [calls <= 4 && bound && note && !seeded,
    `${calls} calls, add button=${bound}, empty note=${note}, seeded at boot=${seeded}`];
});

check('a new clip clears an edit that pointed at the old footage', () => {
  const src = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8');
  const guards = (src.match(/New clip loaded — the old timeline edit cleared with it/g) || []).length;
  const clears = /changedMedia && tlClips\(\)\.length/.test(src);
  return [guards >= 1 && clears, `${guards} guard(s), compares the file name=${clears}`];
});

check('the timeline is keyboard-operable, not just draggable', () => {
  const src = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8');
  const del = /e\.key === 'Delete' \|\| e\.key === 'Backspace'/.test(src);
  const split = /e\.key === 's' \|\| e\.key === 'S'/.test(src);
  return [del && split, `delete key=${del}, split key=${split}`];
});

check('the drag never leaves a clip selected with stale numbers', () => {
  resetTimeline([T.makeClip({ id: 'a', name: 'Interview', startSec: 0, srcIn: 0, srcOut: 6, srcDur: 20 })]);
  const el = clipEls()[0];
  const rect = clipRect(el);
  drag(el, rect.width - 2, rect.width - 2 - 60);
  const readout = $('#tlSelection').textContent;
  const c = P.tlClips()[0];
  const shown = /length ([\d.]+)s/.exec(readout);
  const ok = shown && Math.abs(Number(shown[1]) - T.len(c)) < 0.06;
  return [ok, `readout "${readout.replace(/\s+/g, ' ').trim().slice(0, 80)}"`];
});

check('the timeline is not inside a column that narrow windows hide', () => {
  const html = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(PUB, 'styles.css'), 'utf8');
  const inMonitor = /monitor-column[\s\S]{0,400}timeline-card/.test(html);
  const hidden = /monitor-column[^{]*\{\s*display:\s*none/.test(css);
  const ownRow = /stage-wrap > \.timeline-card/.test(css);
  return [!inMonitor && !hidden && ownRow,
    `in monitor column=${inMonitor}, a rule hides that column=${hidden}, has its own row=${ownRow}`];
});

check('a connected Resolve timeline cannot take the editable lane', () => {
  resetTimeline([T.makeClip({ id: 'a', name: 'A', startSec: 0, srcIn: 0, srcOut: 4, srcDur: 20 })]);
  P.state.liveTimeline = { name: 'V1', clips: [{ name: 'Resolve clip', startFrame: 0, endFrame: 100 }] };
  P.renderTimelineTracks();
  const el = clipEls()[0];
  const ok = !!el && el.dataset.clipid === 'a';
  P.state.liveTimeline = null;
  P.renderTimelineTracks();
  return [ok, ok ? 'the editable clip is still the one on V1' : 'Resolve overwrote V1'];
});

check('grabbing a clip keeps the element the pointer is holding', () => {
  resetTimeline([T.makeClip({ id: 'a', name: 'A', startSec: 0, srcIn: 0, srcOut: 5, srcDur: 20 })]);
  const el = clipEls()[0];
  const rect = clipRect(el);
  el.dispatchEvent(pointer('pointerdown', rect.left + 4, LANE_TOP + 10));
  const stillThere = clipEls()[0] === el && !!P.state.tl.drag;
  const selected = el.classList.contains('is-selected');
  document.dispatchEvent(pointer('pointerup', rect.left + 4, LANE_TOP + 10));
  return [stillThere && selected, `same node=${stillThere}, selected=${selected}`];
});

check('a clip waiting on the stage makes the Add button impossible to miss', () => {
  resetTimeline([]);
  P.renderTimelineTracks();
  const btn = document.getElementById('tlAddClipBtn');
  const note = document.getElementById('tlEmptyNote').textContent;
  const ok = btn.classList.contains('is-cta') && /press/i.test(note);
  return [ok, `cta=${btn.classList.contains('is-cta')}, note="${note.replace(/\s+/g, ' ').trim().slice(0, 70)}"`];
});

check('the empty state is a button, not just a label', () => {
  const note = document.getElementById('tlEmptyNote');
  return [note.classList.contains('is-actionable'),
    `actionable=${note.classList.contains('is-actionable')}`];
});

check.summary('editable timeline');
