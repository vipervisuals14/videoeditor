/* ============================================================================
 * Cut it here — the in-app silence cutter
 * ----------------------------------------------------------------------------
 * Three things are proven here, all against the shipped code:
 *
 *   1. the arithmetic: which slices survive, how long the result is, and how a
 *      moment maps between the source and the cut (public/silence-cut.js);
 *   2. the page: Detect → plan → Preview skips the pauses on the monitor;
 *   3. the render: a fake browser (canvas stream, MediaRecorder, a video element
 *      that seeks and plays) drives the real render loop, and the download the
 *      user would click ends up holding a real Blob with the right name.
 *
 *   node tools/dom/cut.mjs
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';
import { boot, makeCheck, PUB } from './harness.mjs';

const check = makeCheck();
const { window, document } = boot({ beforeScripts: (w) => { w.__PULSE_TEST__ = true; } });
const P = window.PulseTest;
const S = window.SILENCE_CUT;
const $ = (sel) => document.querySelector(sel);

// ============================================================================
// 1. The arithmetic
// ============================================================================
check('the cutter module actually loaded with the page', () => {
  const src = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');
  return [!!S && typeof S.render === 'function' && /silence-cut\.js/.test(src),
    S ? `v${S.VERSION}` : 'window.SILENCE_CUT missing'];
});

const SEGS = [
  { id: 1, start: 0, end: 2, type: 'speech', db: -14, label: 'Talking 1' },
  { id: 2, start: 2, end: 5, type: 'silence', db: -52, label: 'Dead air (3.0s)' },
  { id: 3, start: 5, end: 9, type: 'speech', db: -14, label: 'Talking 2' },
  { id: 4, start: 9, end: 11.5, type: 'silence', db: -50, label: 'Dead air (2.5s)' },
  { id: 5, start: 11.5, end: 14, type: 'speech', db: -14, label: 'Talking 3' }
];

check('it keeps the talking and drops the pauses', () => {
  const p = S.plan(SEGS);
  const kept = p.ranges.map((r) => `${r.start}-${r.end}`).join(' ');
  return [kept === '0-2 5-9 11.5-14' && p.removedSec === 5.5 && p.keptSec === 8.5,
    `kept ${kept}, removed ${p.removedSec}s`];
});

check('a cut is reported as the gap it leaves, not as a guess', () => {
  const p = S.plan(SEGS);
  const cuts = p.cuts.map((c) => `${c.start}-${c.end}`).join(' ');
  return [cuts === '2-5 9-11.5', `cuts ${cuts}`];
});

check('a pause the user chose to keep is not cut', () => {
  const segs = SEGS.map((s) => (s.id === 2 ? Object.assign({}, s, { forceKeep: true }) : s));
  const p = S.plan(segs);
  const kept = p.ranges.map((r) => `${r.start}-${r.end}`).join(' ');
  return [kept === '0-9 11.5-14' && p.removedSec === 2.5, `kept ${kept}`];
});

check('a sliver between two pauses is not left as a stutter', () => {
  const p = S.plan([
    { start: 0, end: 3, type: 'speech' },
    { start: 3, end: 4, type: 'silence' },
    { start: 4, end: 4.05, type: 'speech' },      // 50 ms of "speech": a click
    { start: 4.05, end: 7, type: 'silence' },
    { start: 7, end: 9, type: 'speech' }
  ]);
  return [p.ranges.length === 2 && p.dropped > 0,
    `${p.ranges.length} pieces, dropped ${p.dropped}s of click`];
});

check('a moment in the cut maps back to the frame it came from', () => {
  const p = S.plan(SEGS);
  return [S.toSource(p.ranges, 0) === 0 && S.toSource(p.ranges, 3) === 6 && S.toSource(p.ranges, 8.4) === 13.9,
    `cut 0s → src 0s, cut 3s → src ${S.toSource(p.ranges, 3)}s, cut 8.4s → src ${S.toSource(p.ranges, 8.4)}s`];
});

check('a moment that was removed has no place in the cut', () => {
  const p = S.plan(SEGS);
  return [S.toOutput(p.ranges, 3) === null && S.toOutput(p.ranges, 6) === 3,
    `src 3s → ${S.toOutput(p.ranges, 3)}, src 6s → ${S.toOutput(p.ranges, 6)}s`];
});

check('all-silence input keeps nothing instead of inventing a clip', () => {
  const p = S.plan([{ start: 0, end: 10, type: 'silence' }, { start: 10, end: 12, type: 'silence' }]);
  return [p.ranges.length === 0 && p.keptSec === 0, `${p.ranges.length} pieces kept`];
});

check('the audio splice is sample accurate', () => {
  const rate = 48000;
  const src = [];
  for (let i = 0; i < rate * 14; i++) src.push(i);
  const fakeBuffer = {
    sampleRate: rate,
    numberOfChannels: 1,
    length: src.length,
    getChannelData: () => Float32Array.from(src)
  };
  const made = [];
  const ctx = { createBuffer: (ch, frames, sr) => { const b = { numberOfChannels: ch, length: frames, sampleRate: sr, data: [] }; made.push(b); return b; } };
  // give the new buffer channel storage
  ctx.createBuffer = (ch, frames, sr) => {
    const data = new Float32Array(frames);
    const b = { numberOfChannels: ch, length: frames, sampleRate: sr, getChannelData: () => data, data };
    made.push(b);
    return b;
  };
  const p = S.plan(SEGS);
  const out = S.spliceAudio(ctx, fakeBuffer, p.ranges, rate);
  const d = out.getChannelData(0);
  const expectFrames = Math.round(p.keptSec * rate);
  // the first sample of the second kept piece must be source time 5.0s
  const boundary = d[Math.round(2 * rate)];
  return [Math.abs(out.length - expectFrames) <= 2 && Math.abs(boundary - 5 * rate) <= 2,
    `${out.length} frames (want ~${expectFrames}), sample at the join = ${boundary} (want ${5 * rate})`];
});

check('it prefers MP4 and falls back honestly', () => {
  const all = { isTypeSupported: () => true };
  const webmOnly = { isTypeSupported: (m) => /webm/.test(m) };
  const none = { isTypeSupported: () => false };
  const a = S.pickFormat(all, true);
  const b = S.pickFormat(webmOnly, true);
  const c = S.pickFormat(none, true);
  return [a && a.ext === 'mp4' && b && b.ext === 'webm' && c === null,
    `all→${a && a.label}, webm-only→${b && b.label}, none→${c}`];
});

check('output size is capped at 4K and kept even', () => {
  const big = S.fitSize(7680, 4320, 3840);
  const small = S.fitSize(1280, 720, 3840);
  return [big.width === 3840 && big.height === 2160 && small.width === 1280 && small.height === 720,
    `8K → ${big.width}×${big.height}, 720p → ${small.width}×${small.height}`];
});

// ============================================================================
// 2. The page: detect → plan → preview
// ============================================================================
check('with no measurement the button is disabled and says why', () => {
  P.state.silenceSegments = [];
  P.renderSilenceSegments();
  const btn = $('#silenceRenderBtn');
  const summary = $('#silenceCutSummary').textContent;
  return [btn.disabled === true && /Detect the pauses first/.test(summary),
    `disabled=${btn.disabled} "${summary.slice(0, 46)}"`];
});

check('detected pauses become a cut plan on the panel', () => {
  P.state.silenceSegments = SEGS.map((s) => Object.assign({}, s));
  P.renderSilenceSegments();
  const p = P.state.silencePlan;
  const summary = $('#silenceCutSummary').textContent;
  return [!!p && p.ranges.length === 3 && $('#silenceRenderBtn').disabled === false
    && /removed/.test(summary) && /8\.5s/.test(summary),
    `${summary}`];
});

check('a pause that survives keeps the count honest', () => {
  P.state.silenceSegments = SEGS.map((s) => (s.id === 4 ? Object.assign({}, s, { forceKeep: true }) : Object.assign({}, s)));
  P.renderSilenceSegments();
  const p = P.state.silencePlan;
  // keeping one 2.5s pause merges its neighbours: the surviving block is 5→14
  return [p.cuts.length === 1 && Math.abs(p.keptSec - 11) < 0.01 && Math.abs(p.removedSec - 3) < 0.01,
    `${p.cuts.length} cut, kept ${p.keptSec}s, removed ${p.removedSec}s`];
});

check('preview skips a pause while the transport plays', () => {
  P.state.silenceSegments = SEGS.map((s) => Object.assign({}, s));
  P.renderSilenceSegments();
  $('#silencePreviewToggle').checked = true;
  $('#silencePreviewToggle').dispatchEvent(new window.Event('change', { bubbles: true }));
  P.state.isPlaying = true;
  P.state.playheadSec = 3.2;                 // inside the first pause
  const moved = P.silenceSkipTick();
  const after = P.state.playheadSec;
  P.state.playheadSec = 6.0;                 // inside talking
  const movedAgain = P.silenceSkipTick();
  P.state.isPlaying = false;
  return [moved === true && Math.abs(after - 5) < 0.01 && movedAgain === false,
    `3.2s → ${after}s, 6.0s untouched (${movedAgain})`];
});

check('preview does nothing when it is off or paused', () => {
  P.state.silencePreview = false;
  P.state.isPlaying = true;
  P.state.playheadSec = 3.2;
  const a = P.silenceSkipTick();
  P.state.silencePreview = true;
  P.state.isPlaying = false;
  const b = P.silenceSkipTick();
  P.state.silencePreview = false;
  P.state.isPlaying = false;
  return [a === false && b === false, `off=${a} paused=${b}`];
});

check('loading a new clip throws the old cut away', () => {
  P.state.silenceSegments = [];
  P.resetSilenceCut();
  const card = $('#silenceCutResult');
  return [P.state.silencePlan === null && P.state.silenceCut === null && card.hidden === true
    && $('#silenceRenderBtn').disabled === true,
  `plan=${P.state.silencePlan} cut=${P.state.silenceCut} hidden=${card.hidden}`];
});

// ============================================================================
// 3. The render, driven through a fake browser
// ============================================================================
function installFakeBrowser() {
  const vid = document.getElementById('customVideoElement');
  const log = { seeks: [], played: [], paused: 0, recorded: 0 };

  // a clip on the stage, 14 seconds long at 1920x1080
  vid.setAttribute('src', 'blob:fake-clip');
  Object.defineProperty(vid, 'videoWidth', { configurable: true, get: () => 1920 });
  Object.defineProperty(vid, 'videoHeight', { configurable: true, get: () => 1080 });
  Object.defineProperty(vid, 'duration', { configurable: true, get: () => 14 });
  Object.defineProperty(vid, 'readyState', { configurable: true, get: () => 4 });
  Object.defineProperty(vid, 'ended', { configurable: true, get: () => false });

  let ct = 0;
  let playing = false;
  Object.defineProperty(vid, 'currentTime', {
    configurable: true,
    get: () => ct,
    set: (v) => {
      ct = Number(v) || 0;
      log.seeks.push(+ct.toFixed(2));
      setTimeout(() => vid.dispatchEvent(new window.Event('seeked')), 0);
    }
  });
  Object.defineProperty(vid, 'paused', { configurable: true, get: () => !playing });
  vid.play = () => { playing = true; log.played.push(+ct.toFixed(2)); return Promise.resolve(); };
  vid.pause = () => { playing = false; log.paused++; };
  vid.load = () => {};

  // the element plays itself forward while "playing", so the slices end
  const ticker = setInterval(() => { if (playing) ct += 0.05; }, 5);

  // canvas → a stream the recorder can hold
  const stream = {
    tracks: [],
    getTracks: () => stream.tracks,
    getAudioTracks: () => stream.tracks,
    addTrack: (t) => stream.tracks.push(t)
  };
  window.HTMLCanvasElement.prototype.captureStream = function () { return stream; };

  // MediaRecorder: WebM is the only container in this fake browser
  const chunks = [];
  class FakeRecorder {
    static isTypeSupported(mime) { return /webm/.test(mime); }
    constructor(s, opts) {
      this.stream = s;
      this.mimeType = opts.mimeType;
      this.state = 'inactive';
      this.onstop = null;
      this.ondataavailable = null;
    }
    start() { this.state = 'recording'; log.recorded++; }
    pause() { this.state = 'paused'; }
    resume() { this.state = 'recording'; }
    stop() {
      this.state = 'inactive';
      const data = new window.Blob([new Uint8Array(2048)], { type: this.mimeType.split(';')[0] });
      chunks.push(data);
      if (this.ondataavailable) this.ondataavailable({ data });
      setTimeout(() => { if (this.onstop) this.onstop(); }, 0);
    }
  }
  window.MediaRecorder = FakeRecorder;

  let url = 0;
  window.URL.createObjectURL = () => `blob:cut-${++url}`;
  window.URL.revokeObjectURL = () => {};

  window.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 8);

  return { vid, log, ticker, chunks };
}

let fakeBrowser = null;

await check('one button renders a cut file and offers the download', async () => {
  const fake = installFakeBrowser();
  fakeBrowser = fake;
  P.state.scene = 'custom_video';
  P.state.totalDurSec = 14;
  P.state.silenceSegments = SEGS.map((s) => Object.assign({}, s));
  P.renderSilenceSegments();
  P.state.plateFile = null;             // video-only path: no decode to wait for

  const result = await Promise.race([
    P.renderInAppCut(),
    new Promise((resolve) => setTimeout(() => resolve('timeout'), 12000))
  ]);
  clearInterval(fake.ticker);

  const link = $('#silenceDownloadLink');
  const card = $('#silenceCutResult');
  const info = $('#silenceCutFileInfo').textContent;
  const name = $('#silenceCutFileName').textContent;
  const ok = result && result !== 'timeout' && card.hidden === false
    && /^blob:cut-/.test(link.getAttribute('href')) && /\.webm$/.test(link.getAttribute('download'))
    && P.state.silenceCut && P.state.silenceCut.blob.size > 0;
  return [ok, result === 'timeout'
    ? 'the render never finished'
    : `${name} · ${info} · href=${link.getAttribute('href')}`];
});

check('it seeks to each kept piece and to nothing else', () => {
  const seeks = fakeBrowser ? fakeBrowser.log.seeks : [];
  const starts = S.plan(SEGS).ranges.map((r) => +r.start.toFixed(2));
  const hitAll = starts.every((t) => seeks.some((v) => Math.abs(v - t) < 0.02));
  const neverIntoAPause = !seeks.some((v) => (v > 2.02 && v < 4.98) || (v > 9.02 && v < 11.48));
  return [hitAll && neverIntoAPause, `seeks ${seeks.join(', ')} (planned starts ${starts.join(', ')})`];
});

check('the download is a real file with the cut length in its info', () => {
  const cut = P.state.silenceCut;
  const info = $('#silenceCutFileInfo').textContent;
  return [!!cut && cut.blob instanceof window.Blob && cut.blob.size > 0
    && Math.abs(cut.seconds - 8.5) < 0.2 && /8\.5s/.test(info),
    cut ? `${(cut.blob.size / 1024).toFixed(0)} KB, ${cut.seconds}s, "${info}"` : 'no cut'];
});

check('the stat boxes agree with the plan the file is built from', () => {
  const p = P.state.silencePlan;
  const tight = $('#silenceNewDur').textContent;
  const saved = $('#silenceSavedPct').textContent;
  const cuts = $('#silenceCutCount').textContent;
  const expectClock = `00:${p.keptSec < 10 ? '0' : ''}${p.keptSec.toFixed(1)}s`;
  return [tight === expectClock && /-5\.5s/.test(saved) && cuts === '2 cuts',
    `tight=${tight} (want ${expectClock}) saved=${saved} cuts=${cuts}`];
});

check('the draw loop runs once, however many pieces there are', async () => {
  const p = S.plan(SEGS);
  const result = await S.render({
    videoEl: document.getElementById('customVideoElement'),
    ranges: p.ranges,
    MediaRecorderClass: window.MediaRecorder,
    fps: 30,
    cancelled: () => false
  });
  // three slices, one loop: a per-slice loop would stack up and draw the same
  // frame three times over at the end of the clip
  return [result.maxLoops === 1 && result.frames > 0,
    `${result.frames} draws across ${p.ranges.length} pieces, max concurrent loops ${result.maxLoops}`];
});

check('the sound is spliced too, not just the picture', async () => {
  // a fake AudioContext that records the graph the renderer builds
  const built = { buffers: 0, sources: 0, starts: [], tracks: 0 };
  class FakeCtx {
    constructor() { this.currentTime = 0; }
    createBuffer(ch, frames, rate) {
      const data = new Float32Array(frames);
      return { numberOfChannels: ch, length: frames, sampleRate: rate, getChannelData: () => data };
    }
    createMediaStreamDestination() {
      built.tracks++;
      return { stream: { getAudioTracks: () => [{ kind: 'audio' }] } };
    }
    createGain() { return { gain: { value: 1 }, connect() {} }; }
    createBufferSource() {
      built.sources++;
      return { buffer: null, connect() {}, start: (when, offset, dur) => built.starts.push({ when, offset, dur }) };
    }
    close() {}
  }
  const audioBuffer = {
    sampleRate: 48000, numberOfChannels: 1, length: 48000 * 14,
    getChannelData: () => new Float32Array(48000 * 14)
  };
  const p = S.plan(SEGS);
  const before = fakeBrowser.log.seeks.length;
  const result = await S.render({
    videoEl: document.getElementById('customVideoElement'),
    ranges: p.ranges,
    audioBuffer,
    audioContext: new FakeCtx(),
    MediaRecorderClass: window.MediaRecorder,
    fps: 30,
    cancelled: () => false
  });
  return [result.blob.size > 0 && built.sources === 3 && built.starts.length === 3
    && built.starts.every((st) => st.dur > 0) && fakeBrowser.log.seeks.length > before,
    `${built.sources} audio pieces scheduled, offsets ${built.starts.map((s) => s.offset.toFixed(1)).join(', ')}`];
});

check('the status line reports what was removed, not that it "worked"', () => {
  const text = $('#silenceCutStatus').textContent;
  return [/pause/.test(text) && /Download|Done/.test(text), `"${text}"`];
});

check('a render with no clip on the stage explains itself', async () => {
  P.state.scene = 'empty';
  P.state.silenceSegments = SEGS.map((s) => Object.assign({}, s));
  P.renderSilenceSegments();
  const out = await P.renderInAppCut();
  const text = $('#silenceCutStatus').textContent;
  return [!out && /Load a video clip/.test(text), `"${text.slice(0, 60)}"`];
});

check('the Resolve hand-off is still there, as a second choice', () => {
  const html = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');
  const btn = /<button class="btn-secondary" id="applySilenceCutBtn"[\s\S]{0,200}Send cuts to Resolve/.test(html);
  const app = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8');
  const dispatch = /dispatchToResolve\('cut_silences'/.test(app);
  return [btn && dispatch, `button=${btn} dispatch=${dispatch}`];
});

check('nothing is cut until the user asks for it', () => {
  const app = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8');
  // the render can only be started by the button, and the button starts disabled
  const guarded = /id="silenceRenderBtn"[^>]*disabled/.test(fs.readFileSync(path.join(PUB, 'index.html'), 'utf8'));
  const onlyOnClick = (app.match(/renderInAppCut\(/g) || []).length <= 3;
  return [guarded && onlyOnClick, `button starts disabled=${guarded}`];
});

check.summary('in-app silence cut');
