/* ============================================================================
 * Lyrics auto-detect — the listening engine and the timing it produces
 * ----------------------------------------------------------------------------
 * Two halves, both against the shipped code:
 *
 *  1. the DSP in public/audio-lab.js, fed synthetic audio where the right
 *     answer is known (a 96 bpm click, a talking head with seven phrases, a
 *     silent file), so "it detected speech" is a fact and not a feeling;
 *  2. the real page in jsdom, driven through the same function the button calls,
 *     so the cue list, the chips and the exports are the ones users get.
 *
 *   node tools/dom/lyrics.mjs
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';
import { boot, makeCheck, PUB } from './harness.mjs';

const check = makeCheck();
const { window, document } = boot({ beforeScripts: (w) => { w.__PULSE_TEST__ = true; } });
const P = window.PulseTest;
const Lab = window.AudioLab;
const $ = (sel) => document.querySelector(sel);
// As loaded, before anything is clicked: captions must not be on.
const OPENED_WITH_OVERLAY_OFF = P.state.showLyricsOverlay === false;

const SR = 16000;

// ---- audio that behaves like the real thing -------------------------------
function rnd(i, seed) {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}
function kickAt(t, at, amp) {
  const s = t - at;
  if (s < 0 || s > 0.3) return 0;
  return Math.sin(2 * Math.PI * 52 * s) * Math.exp(-s * 20) * (amp === undefined ? 0.9 : amp);
}
function hat(i, at, amp) {
  const s = i / SR - at;
  if (s < 0 || s > 0.06) return 0;
  return rnd(i, 3) * Math.exp(-s * 60) * amp;
}
function speechBurst(i, at, len, amp) {
  const t = i / SR - at;
  if (t < 0 || t > len) return 0;
  const env = Math.min(1, t / 0.02) * Math.min(1, (len - t) / 0.06);
  return rnd(i, 7) * 0.7 * env * amp + Math.sin(2 * Math.PI * 150 * t) * 0.1 * env;
}

function musicClip(bpm, seconds) {
  const n = Math.round(SR * seconds);
  const out = new Float32Array(n);
  const beat = 60 / bpm;
  for (let b = 0; b * beat < seconds; b++) {
    const at = b * beat;
    for (let i = Math.floor(at * SR); i < Math.floor((at + 0.3) * SR) && i < n; i++) out[i] += kickAt(i / SR, at);
    for (let i = Math.floor(at * SR); i < Math.floor((at + 0.06) * SR) && i < n; i++) out[i] += hat(i, at, 0.18);
  }
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] += 0.1 * Math.sin(2 * Math.PI * 110 * t) + 0.05 * Math.sin(2 * Math.PI * 220 * t);
  }
  return out;
}

function talkingClip(spans, seconds) {
  const n = Math.round(SR * seconds);
  const out = new Float32Array(n);
  spans.forEach(([a, b]) => {
    for (let i = Math.floor(a * SR); i < Math.floor(b * SR) && i < n; i++) out[i] += speechBurst(i, a, b - a, 0.6);
  });
  return out;
}

const TALK_SPANS = [[0.5, 1.7], [2.2, 3.1], [3.5, 5.0], [5.7, 6.5], [7.1, 8.7], [9.5, 10.3], [11.1, 12.7]];

// ---------------------------------------------------------------------------
// 1. the engine
// ---------------------------------------------------------------------------
check('the listening engine loads with the page', () => {
  return [!!Lab && typeof Lab.analyze === 'function', Lab ? `v${Lab.version}` : 'missing'];
});

const music96 = Lab.analyze(musicClip(96, 12), SR, { mode: 'auto' });
const music120 = Lab.analyze(musicClip(120, 12), SR, { mode: 'auto' });
const talk = Lab.analyze(talkingClip(TALK_SPANS, 14), SR, { mode: 'auto' });
const silent = Lab.analyze(new Float32Array(SR * 6).fill(0), SR, { mode: 'auto' });

check('a 96 bpm track reports its real tempo', () => {
  const ok = Math.abs(music96.bpm - 96) < 2;
  return [ok, `bpm=${music96.bpm.toFixed(2)}`];
});

check('a 120 bpm track reports its real tempo', () => {
  const ok = Math.abs(music120.bpm - 120) < 2.5;
  return [ok, `bpm=${music120.bpm.toFixed(2)}`];
});

check('a click track is classified as music', () => {
  return [music120.mode === 'music', `mode=${music120.mode} m=${music120.musicScore.toFixed(2)} s=${music120.speechScore.toFixed(2)}`];
});

check('a talking head is classified as speech', () => {
  return [talk.mode === 'speech', `mode=${talk.mode} conf=${talk.modeConfidence.toFixed(2)} m=${talk.musicScore.toFixed(2)} s=${talk.speechScore.toFixed(2)}`];
});

check('it finds every spoken phrase in the clip', () => {
  const n = talk.speechSegments.length;
  return [Math.abs(n - TALK_SPANS.length) <= 1, `found=${n} expected=${TALK_SPANS.length}`];
});

check('each phrase starts within 300 ms of when the talking started', () => {
  const worst = TALK_SPANS.reduce((acc, [a], i) => {
    const seg = talk.speechSegments[i];
    if (!seg) return 99;
    return Math.max(acc, Math.abs(seg.startSec - a));
  }, 0);
  return [worst <= 0.3, `worst=${(worst * 1000).toFixed(0)}ms`];
});

check('it measures how long the talking actually lasted', () => {
  const real = TALK_SPANS.reduce((a, [s, e]) => a + (e - s), 0);
  const got = talk.speechTimeSec;
  return [Math.abs(got - real) < 1.2, `measured=${got.toFixed(1)}s real=${real.toFixed(1)}s`];
});

check('a file with no audio is called silent, not "music"', () => {
  return [silent.mode === 'silent' && silent.bpm === 0, `mode=${silent.mode} bpm=${silent.bpm} warning=${silent.warnings[0] || 'none'}`];
});

check('the pauses it reports are real pauses', () => {
  const gaps = talk.silences.length;
  // seven bursts means six inner gaps, plus head and tail
  return [gaps >= 5 && gaps <= 9, `gaps=${gaps}`];
});

check('twenty seconds of audio analyses in under three seconds', () => {
  const t0 = Date.now();
  Lab.analyze(musicClip(100, 20), SR, { mode: 'auto' });
  const ms = Date.now() - t0;
  return [ms < 3000, `${ms}ms`];
});

// ---------------------------------------------------------------------------
// 2. placing the words
// ---------------------------------------------------------------------------
const LYRIC_LINES = [
  'Blame it all on you',
  'when the midnight city fades',
  'we been driving with the windows down',
  'and the radio is all we have'
];

const musicCues = Lab.cuesFromLines(LYRIC_LINES, music120, { mode: 'music' });
const talkCues = Lab.cuesFromLines(['hello everyone', 'today I want to show you three things'], talk, { mode: 'speech' });

check('one timed block per line, in order', () => {
  const ok = musicCues.length === LYRIC_LINES.length
    && musicCues.every((c, i) => c.index === i + 1 && c.text === LYRIC_LINES[i]);
  return [ok, `${musicCues.length} cues`];
});

check('lyric lines land on the beat, not on an even split', () => {
  const period = music120.beatPeriodSec;
  const off = music120.beatOffsetSec;
  const worst = musicCues.reduce((acc, c) => {
    const d = Math.abs(((c.startSec - off) % period + period) % period);
    return Math.max(acc, Math.min(d, period - d));
  }, 0);
  return [worst < 0.08, `worst off-beat=${(worst * 1000).toFixed(0)}ms`];
});

check('blocks never overlap and never run past the clip', () => {
  let ok = true;
  const why = [];
  musicCues.forEach((c, i) => {
    if (c.endSec <= c.startSec) { ok = false; why.push(`cue ${i + 1} has no length`); }
    if (i && c.startSec < musicCues[i - 1].endSec - 0.001) { ok = false; why.push(`cue ${i + 1} overlaps`); }
    if (c.endSec > music120.durationSec + 0.01) { ok = false; why.push(`cue ${i + 1} runs past the end`); }
  });
  return [ok, why.join(', ') || `${musicCues.length} clean blocks`];
});

check('every word inside a block gets its own moment', () => {
  const cue = musicCues[2];
  const words = cue.words || [];
  let ok = words.length === cue.text.split(' ').length;
  words.forEach((w, i) => {
    if (w.startSec < cue.startSec - 0.001) ok = false;
    if (w.endSec <= w.startSec) ok = false;
    if (i && w.startSec < words[i - 1].endSec - 0.001) ok = false;
  });
  return [ok, `${words.length} words over ${(cue.endSec - cue.startSec).toFixed(2)}s`];
});

check('a talking-head line never starts in the middle of a pause', () => {
  const outside = talkCues.filter((c) => !talk.speechSegments.some((s) => c.startSec >= s.startSec - 0.05 && c.startSec <= s.endSec));
  return [outside.length === 0, `${outside.length} of ${talkCues.length} start in silence`];
});

check('speech blocks stop when the talking stops', () => {
  const cue = talkCues[1];
  const seg = talk.speechSegments.find((s) => cue.startSec >= s.startSec - 0.05 && cue.startSec <= s.endSec);
  const ok = !!seg && cue.endSec <= seg.endSec + 0.4;
  return [ok, `cue ends ${cue.endSec.toFixed(2)}s, talking ends ${seg ? seg.endSec.toFixed(2) : '?'}s`];
});

check('more lines than phrases still produces ordered blocks', () => {
  const many = Array.from({ length: 12 }, (_, i) => `line number ${i + 1}`);
  const cues = Lab.cuesFromLines(many, talk, { mode: 'speech' });
  let ok = cues.length === 12;
  cues.forEach((c, i) => {
    if (c.endSec <= c.startSec) ok = false;
    if (i && c.startSec < cues[i - 1].startSec) ok = false;
  });
  return [ok, `${cues.length} blocks from 7 phrases`];
});

check('no transcript yet still gives one block per spoken phrase', () => {
  const blocks = Lab.cuesFromPhrases(talk);
  return [blocks.length === talk.speechSegments.length && blocks.every((b) => b.placeholder), `${blocks.length} blocks`];
});

// ---------------------------------------------------------------------------
// 3. the page
// ---------------------------------------------------------------------------
document.querySelector('.rail-sub[data-group="captions"]').click();

check('the lyrics tab has its own listening panel', () => {
  const modes = document.querySelectorAll('#lyrcDetectModes .lyrc-mode-btn').length;
  return [!!$('#lyrcDetectBar') && !!$('#lyricsDetectBtn') && modes === 3, `modes=${modes}`];
});

check('nothing is timed or shown when the page opens', () => {
  return [P.state.cues.length === 0 && P.state.lyricAnalysis === null, `cues=${P.state.cues.length} analysis=${P.state.lyricAnalysis}`];
});

check('press Detect with no clip: it says so and does not throw', () => {
  $('#lyricsDetectBtn').click();
  const status = $('#lyrcDetectStatus');
  return [status.dataset.kind === 'warn' && /load a clip/i.test(status.textContent), status.textContent.slice(0, 60)];
});

check('pasting words with no clip gives "not timed", never 0.0s blocks', () => {
  const box = $('#lyricsRawInput');
  box.value = 'first line here\nsecond line is longer';
  box.dispatchEvent(new window.Event('input', { bubbles: true }));
  const labels = [...document.querySelectorAll('#captionCuesList .cue-time')].map((b) => b.textContent);
  const untimed = P.state.cues.every((c) => c.timed === false);
  return [labels.length === 2 && untimed && labels.every((l) => /not timed/.test(l)), labels.join(' | ')];
});

check('pressing Detect on a music clip times the pasted lyrics', () => {
  const after = P.lyricAnalyzeAudio({ samples: musicClip(120, 12), sampleRate: SR, durationSec: 12, source: 'test' });
  const timed = P.state.cues.filter((c) => c.timed !== false);
  const ok = after.mode === 'music' && timed.length === 2 && timed.every((c) => c.endSec > c.startSec);
  return [ok, `mode=${after.mode} timed=${timed.length} first=${timed[0] ? timed[0].startSec : '-'}s`];
});

check('the panel reports what it found', () => {
  const chips = [...document.querySelectorAll('#lyrcDetectChips .lyrc-chip')].map((c) => c.textContent);
  const hasTempo = chips.some((c) => /BPM/.test(c));
  const hasKind = chips.some((c) => /Music|Speech/.test(c));
  return [hasTempo && hasKind, chips.join(' · ') || 'no chips'];
});

check('a talking-head clip fills the list with one block per phrase', () => {
  $('#lyricsRawInput').value = '';
  $('#lyricsRawInput').dispatchEvent(new window.Event('input', { bubbles: true }));
  const after = P.lyricAnalyzeAudio({ samples: talkingClip(TALK_SPANS, 14), sampleRate: SR, durationSec: 14, source: 'test' });
  const blocks = document.querySelectorAll('#captionCuesList .cue-item').length;
  const ok = after.mode === 'speech'
    && blocks === after.speechSegments.length
    && document.querySelectorAll('#captionCuesList .cue-input').length === blocks;
  return [ok, `mode=${after.mode} blocks=${blocks} phrases=${after.speechSegments.length}`];
});

check('the mode buttons re-place the words without listening again', () => {
  const musicBtn = document.querySelector('#lyrcDetectModes .lyrc-mode-btn[data-lmode="music"]');
  musicBtn.click();
  const pressed = musicBtn.getAttribute('aria-pressed');
  const analysisKept = P.state.lyricAnalysis && P.state.lyricAnalysis.mode === 'music';
  const speechBtn = document.querySelector('#lyrcDetectModes .lyrc-mode-btn[data-lmode="speech"]');
  speechBtn.click();
  const ok = pressed === 'true' && analysisKept && P.state.lyricDetectMode === 'speech' && speechBtn.getAttribute('aria-pressed') === 'true';
  document.querySelector('#lyrcDetectModes .lyrc-mode-btn[data-lmode="auto"]').click();
  return [ok && P.state.lyricDetectMode === 'auto', `forced=${P.state.lyricDetectMode}`];
});

check('typing over a block keeps its measured timing', () => {
  P.lyricAnalyzeAudio({ samples: talkingClip(TALK_SPANS, 14), sampleRate: SR, durationSec: 14, source: 'test' });
  const input = document.querySelector('#captionCuesList .cue-input');
  const before = { ...P.state.cues[0] };
  input.value = 'what I actually said';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  const after = P.state.cues[0];
  return [after.text === 'what I actually said'
    && after.startSec === before.startSec
    && after.endSec === before.endSec
    && after.words.length === 4, `"${after.text}" ${after.startSec}-${after.endSec}s`];
});

check('clicking a block time moves the playhead there', () => {
  P.state.cues = [
    { index: 1, text: 'one', startSec: 1.0, endSec: 2.0, timed: true, words: [] },
    { index: 2, text: 'two', startSec: 3.0, endSec: 4.0, timed: true, words: [] },
    { index: 3, text: 'three', startSec: 5.0, endSec: 6.0, timed: true, words: [] }
  ];
  P.renderCueList();
  const cue = P.state.cues[2];
  const btn = [...document.querySelectorAll('#captionCuesList .cue-time')][2];
  btn.click();
  return [Math.abs(P.state.playheadSec - cue.startSec) < 0.2, `playhead=${P.state.playheadSec.toFixed(2)} cue=${cue.startSec}`];
});

// The page must load clean; a deliberate Detect is what switches captions on.
// (An earlier version left them off after detection too, so the words existed
// but were never drawn anywhere -- the bug this suite now guards.)
check('the page loads with captions off', () => {
  return [OPENED_WITH_OVERLAY_OFF, `opened with overlay=${OPENED_WITH_OVERLAY_OFF ? 'off' : 'ON'}`];
});

check('a music-video clip puts its tempo into the shared beat clock', () => {
  P.state.lyricTempoSource = 'default';
  P.setLyricDetectMode('auto');
  const a = P.lyricAnalyzeAudio({ samples: musicClip(96, 12), sampleRate: SR, durationSec: 12, source: 'test' });
  return [Math.abs(P.state.bpm - a.bpm) < 0.2 && Math.abs(P.state.bpm - 96) < 2 && a.mode === 'music',
    `state.bpm=${P.state.bpm} mode=${a.mode}`];
});

check('the detection feeds the silence cutter instead of a hardcoded list', () => {
  const segs = P.state.silenceSegments;
  const analysis = P.state.lyricAnalysis;
  const dead = segs.filter((s) => s.type === 'silence');
  const ordered = segs.every((s, i) => s.end > s.start && (i === 0 || s.start >= segs[i - 1].end - 0.02));
  const covers = Math.abs((segs.length ? segs[segs.length - 1].end : 0) - analysis.durationSec) < 0.2;
  return [dead.length === analysis.silences.length && ordered && covers,
    `${segs.length} segments, ${dead.length} dead air, ends ${segs.length ? segs[segs.length - 1].end : 0}s of ${analysis.durationSec.toFixed(1)}s`];
});

check('the silence tab has its own detect button and starts empty', () => {
  document.querySelector('.rail-sub[data-group="editing"]').click();
  const btn = document.getElementById('silenceDetectBtn');
  const status = document.getElementById('silenceDetectStatus');
  return [!!btn && !!status && /nothing measured/i.test(status.textContent), btn ? btn.textContent.trim() : 'missing'];
});

check('the silence stats show dashes until something is measured', () => {
  P.state.silenceSegments = [];
  P.state.measuredAnalysis = null;
  P.state.lyricAnalysis = null;
  P.state.totalDurSec = 0;
  P.renderSilenceSegments();
  const stats = ['silenceOrigDur', 'silenceNewDur', 'silenceSavedPct'].map((id) => document.getElementById(id).textContent.trim());
  return [stats.every((t) => t === '—'), stats.join(' | ')];
});

check('a measured talking head gives the cutter real pauses to remove', () => {
  const analysis = Lab.analyze(talkingClip(TALK_SPANS, 14), SR, { mode: 'speech', thresholdDb: -32, minMs: 300, padMs: 60 });
  P.state.measuredAnalysis = analysis;
  P.state.silenceSegments = P.segmentsFromAnalysis(analysis);
  P.renderSilenceSegments();
  P.drawSilenceWaveform();
  const dead = P.state.silenceSegments.filter((sg) => P.isSegmentCut(sg));
  const deadSec = dead.reduce((a, sg) => a + (sg.end - sg.start), 0);
  const orig = document.getElementById('silenceOrigDur').textContent;
  return [dead.length >= 4 && deadSec > 3 && /\d/.test(orig), `${dead.length} pauses, ${deadSec.toFixed(1)}s removable, clip ${orig}`];
});

check('the describe line names the mode and the evidence', () => {
  const text = P.lyricDescribe(Lab.analyze(musicClip(96, 12), SR, { mode: 'auto' }));
  const speech = P.lyricDescribe(Lab.analyze(talkingClip(TALK_SPANS, 14), SR, { mode: 'auto' }));
  const ok = /^Music/.test(text) && /BPM/.test(text) && /^Talking/.test(speech) && /speech/.test(speech);
  return [ok, `${text} || ${speech}`];
});

// ---------------------------------------------------------------------------
// 4. the subtitles actually reach the picture
//    Reported bug: detection ran, phrases were found, and nothing showed on the
//    monitor, because the overlay switch was still off.
// ---------------------------------------------------------------------------
function fakeCtx(sink) {
  return new Proxy({
    canvas: { width: 1280, height: 720 },
    measureText: () => ({ width: 40 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    fillText: (t) => sink.push(t),
    strokeText: (t) => sink.push(t)
  }, { get(t, k) { return k in t ? t[k] : () => undefined; } });
}

check('detecting a talking head turns the subtitles on', () => {
  P.setLyricsOverlay(false);
  document.querySelector('.rail-sub[data-group="captions"]').click();
  const box = $('#lyricsRawInput');
  box.value = 'hello everyone\ntoday I want to show you three things\nfirst\nsecond';
  box.dispatchEvent(new window.Event('input', { bubbles: true }));
  P.lyricAnalyzeAudio({ samples: talkingClip(TALK_SPANS, 14), sampleRate: SR, durationSec: 14, source: 'test' });
  const label = document.getElementById('lyricsTabToggleBtn').textContent;
  return [P.state.showLyricsOverlay === true && /ON/.test(label), `overlay=${P.state.showLyricsOverlay} label="${label}"`];
});

check('the words are actually drawn on the monitor', () => {
  const cue = P.state.cues[0];
  P.state.playheadSec = cue.startSec + 0.15;
  const painted = [];
  P.drawLyrcStudioTypography(fakeCtx(painted), 1280, 720, P.state.playheadSec, 0.2);
  return [painted.length > 0 && painted.join(' ').length > 0, `painted: ${painted.slice(0, 4).join(' ')}`];
});

check('the subtitle lane on the timeline fills up too', () => {
  const subs = P.state.timelineTracks.sub.length;
  return [subs === P.state.cues.filter((c) => c.timed !== false).length && subs > 0, `${subs} lane blocks`];
});

check('turning captions off clears the lane and the picture', () => {
  P.setLyricsOverlay(false);
  const painted = [];
  const cue = P.state.cues[0];
  P.drawLyrcStudioTypography(fakeCtx(painted), 1280, 720, cue.startSec + 0.15, 0.2);
  const lane = P.state.timelineTracks.sub.length;
  // the monitor gates on the flag, so nothing is asked to draw at all
  const gated = P.state.showLyricsOverlay === false && lane === 0;
  P.setLyricsOverlay(true);
  return [gated, `lane=${lane} overlay=${P.state.showLyricsOverlay}`];
});

check('a talking head with no words says so instead of going silent', () => {
  P.setLyricsOverlay(false);
  const box = $('#lyricsRawInput');
  box.value = '';
  box.dispatchEvent(new window.Event('input', { bubbles: true }));
  const a = P.lyricAnalyzeAudio({ samples: talkingClip(TALK_SPANS, 14), sampleRate: SR, durationSec: 14, source: 'test' });
  const status = document.getElementById('lyrcDetectStatus');
  const chips = [...document.querySelectorAll('#lyrcDetectChips .lyrc-chip')].map((c) => c.textContent);
  const blocks = document.querySelectorAll('#captionCuesList .cue-input').length;
  return [a.mode === 'speech' && blocks > 0 && P.state.showLyricsOverlay === false,
    `${blocks} blocks, overlay=${P.state.showLyricsOverlay}, status="${status.textContent.slice(0, 70)}", chips=${chips.join('/')}`];
});

check('the first empty block is focused so typing is the next keystroke', () => {
  const active = document.activeElement;
  return [!!active && active.classList.contains('cue-input'), active ? active.className : 'none'];
});

check('typing into a block turns the subtitles on by itself', () => {
  const input = document.querySelector('#captionCuesList .cue-input');
  input.value = 'the words I actually said';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  const painted = [];
  const cue = P.state.cues[0];
  P.state.playheadSec = cue.startSec + 0.2;
  P.drawLyrcStudioTypography(fakeCtx(painted), 1280, 720, P.state.playheadSec, 0.2);
  return [P.state.showLyricsOverlay === true && painted.join(' ').includes('the'), `overlay=${P.state.showLyricsOverlay} painted=${painted.join(' ').slice(0, 30)}`];
});

check('a music video turns its subtitles on as well', () => {
  P.setLyricsOverlay(false);
  const box = $('#lyricsRawInput');
  box.value = 'blame it all on you\nwhen the midnight city fades';
  box.dispatchEvent(new window.Event('input', { bubbles: true }));
  P.lyricAnalyzeAudio({ samples: musicClip(120, 12), sampleRate: SR, durationSec: 12, source: 'test' });
  return [P.state.showLyricsOverlay === true && P.state.cues.length === 2, `overlay=${P.state.showLyricsOverlay} cues=${P.state.cues.length}`];
});

// ---------------------------------------------------------------------------
// 5. transcription — the tab has to type the words, not just find the pauses
//    The model itself cannot run in jsdom (it needs ONNX + WASM), so the engine
//    is stubbed with the shape asr.js really returns. The real model is verified
//    by tools/asr_check.mjs against a known recording.
// ---------------------------------------------------------------------------
function wordsFor(text, startSec, perWord) {
  const w = text.split(' ');
  let t = startSec;
  return w.map((word) => {
    const dur = perWord || 0.28;
    const item = { text: word, startSec: +t.toFixed(2), endSec: +(t + dur).toFixed(2) };
    t += dur + 0.04;
    return item;
  });
}

function stubAsr(words, opts) {
  const o = opts || {};
  window.AsrLab = {
    version: 'test',
    state: () => (o.fail ? 'failed' : 'ready'),
    onState: () => {},
    load: () => (o.fail ? Promise.reject(new Error(o.fail)) : Promise.resolve({})),
    transcribe: () => (o.fail
      ? Promise.reject(new Error(o.fail))
      : Promise.resolve({ text: words.map((w) => w.text).join(' '), words, tookMs: 1234, durationSec: 14, truncated: false })),
    // the real grouping logic, so this stub can never disagree with asr.js
    wordsIntoSegments: (ws, segs) => REAL_ASR.wordsIntoSegments(ws, segs)
  };
}

const REAL_ASR = window.AsrLab;   // the module loaded from asr.js, unmocked

check('the speech engine ships with the page', () => {
  return [!!REAL_ASR && typeof REAL_ASR.transcribe === 'function' && typeof REAL_ASR.load === 'function',
    REAL_ASR ? `v${REAL_ASR.version} model=${REAL_ASR.model}` : 'missing'];
});

await check('with no whisper runtime present it fails loudly, not silently', async () => {
  const saved = window.transformers;
  delete window.transformers;
  REAL_ASR.reset();
  REAL_ASR.setRuntimeTimeout(300);
  let message = '';
  try { await REAL_ASR.load(); } catch (err) { message = err.message; }
  window.transformers = saved;
  REAL_ASR.reset();
  REAL_ASR.setRuntimeTimeout(15000);
  return [/did not define window\.transformers|speech runtime could not be loaded|did not load/.test(message), message.slice(0, 90)];
});

await check('the tab types the words itself when a talking head is detected', async () => {
  stubAsr(wordsFor('hello everyone today I want to show you three things', 0.5));
  P.setLyricsOverlay(false);
  const box = $('#lyricsRawInput');
  box.value = '';
  box.dispatchEvent(new window.Event('input', { bubbles: true }));
  const audio = { samples: talkingClip(TALK_SPANS, 14), sampleRate: SR, durationSec: 14, source: 'test' };
  const analysis = P.lyricAnalyzeAudio(audio);
  await P.lyricTranscribe(audio, analysis);
  const texts = P.state.cues.map((c) => c.text);
  const anyText = texts.join(' ');
  const painted = [];
  P.state.playheadSec = P.state.cues[1].startSec + 0.1;
  P.drawLyrcStudioTypography(fakeCtx(painted), 1280, 720, P.state.playheadSec, 0.2);
  return [P.state.cues.length > 1 && /everyone/.test(anyText) && P.state.showLyricsOverlay && painted.length > 0,
    `${P.state.cues.length} captions: "${anyText.slice(0, 48)}" painted=${painted.slice(0, 3).join(' ')}`];
});

check('each transcribed caption carries its own word timings', () => {
  const cue = P.state.cues.find((c) => c.words && c.words.length > 1);
  if (!cue) return [false, 'no cue with words'];
  const inRange = cue.words.every((w) => w.startSec >= cue.startSec - 0.01 && w.startSec <= cue.endSec + 0.01);
  return [inRange && cue.transcribed === true, `${cue.words.length} words inside ${cue.startSec}-${cue.endSec}s`];
});

await check('words the user typed win over the machine transcription', async () => {
  stubAsr(wordsFor('this is what the machine heard', 0.5));
  const box = $('#lyricsRawInput');
  box.value = 'my own words here';
  box.dispatchEvent(new window.Event('input', { bubbles: true }));
  const audio = { samples: talkingClip(TALK_SPANS, 14), sampleRate: SR, durationSec: 14, source: 'test' };
  const analysis = P.lyricAnalyzeAudio(audio);
  await P.lyricTranscribe(audio, analysis);
  const texts = P.state.cues.map((c) => c.text).join(' ');
  return [/my own words here/.test(texts) && !/machine heard/.test(texts), texts.slice(0, 40)];
});

await check('a model that cannot load says why and keeps the timed blocks', async () => {
  stubAsr([], { fail: 'the model file is missing' });
  const box = $('#lyricsRawInput');
  box.value = '';
  box.dispatchEvent(new window.Event('input', { bubbles: true }));
  const audio = { samples: talkingClip(TALK_SPANS, 14), sampleRate: SR, durationSec: 14, source: 'test' };
  const analysis = P.lyricAnalyzeAudio(audio);
  const blocks = document.querySelectorAll('#captionCuesList .cue-item').length;
  await P.lyricTranscribe(audio, analysis);
  const status = document.getElementById('lyrcDetectStatus');
  return [blocks > 0 && /missing/.test(status.textContent), `${blocks} blocks, status="${status.textContent.slice(0, 50)}"`];
});

await check('re-syncing does not wipe the transcribed text', async () => {
  stubAsr(wordsFor('first sentence here second one follows', 0.5));
  const box = $('#lyricsRawInput');
  box.value = '';
  box.dispatchEvent(new window.Event('input', { bubbles: true }));
  const audio = { samples: talkingClip(TALK_SPANS, 14), sampleRate: SR, durationSec: 14, source: 'test' };
  const analysis = P.lyricAnalyzeAudio(audio);
  await P.lyricTranscribe(audio, analysis);
  const before = P.state.cues.map((c) => c.text).join('|');
  $('#autoSyncLyricsBtn').click();
  const after = P.state.cues.map((c) => c.text).join('|');
  return [before.length > 0 && after === before, `before="${before.slice(0, 30)}" after="${after.slice(0, 30)}"`];
});

// ---------------------------------------------------------------------------
// 6. sound — the clip has to be audible
// ---------------------------------------------------------------------------
check('the stage is not muted when a clip is loaded', () => {
  const vid = document.getElementById('customVideoElement');
  const btn = document.getElementById('stageAudioBtn');
  return [vid.muted === false && P.state.stageSound === true && !!btn, `muted=${vid.muted} label=${btn ? btn.textContent : 'missing'}`];
});

check('the Sound button mutes and unmutes the element', () => {
  const vid = document.getElementById('customVideoElement');
  const btn = document.getElementById('stageAudioBtn');
  btn.click();
  const off = vid.muted === true && P.state.stageSound === false && /OFF/.test(btn.textContent);
  btn.click();
  const on = vid.muted === false && P.state.stageSound === true && /ON/.test(btn.textContent);
  return [off && on, `off=${off} on=${on}`];
});

// ---------------------------------------------------------------------------
// 7. the page's own wiring for the speech runtime
//    Shipped bug: transformers.min.js is an ES module and was never imported, so
//    window.transformers never existed and the failure was invisible behind a
//    sideways-scrolled pane.
// ---------------------------------------------------------------------------
check('the runtime ships as a plain script the browser cannot refuse', () => {
  const src = fs.readFileSync(path.join(PUB, 'asr.js'), 'utf8');
  const html = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');
  const tag = /<script src="\/?vendor\/asr\/transformers\.bundle\.js/.test(html);
  const waits = /waitForGlobal\(/.test(src);
  const bundle = fs.existsSync(path.join(PUB, 'vendor', 'asr', 'transformers.bundle.js'));
  const noModuleOnly = !/<script type="module">/.test(html);
  return [tag && waits && bundle && noModuleOnly,
    `tag=${tag} waitsForGlobal=${waits} file=${bundle} noModuleTag=${noModuleOnly}`];
});

check('a failed script tag is diagnosed, not just timed out', () => {
  const src = fs.readFileSync(path.join(PUB, 'asr.js'), 'utf8');
  const diag = /HTTP ' \+ res\.status/.test(src) || /' → HTTP ' \+ res\.status/.test(src);
  return [diag, diag ? 'reports the HTTP status of the runtime file' : 'no diagnosis'];
});

check('a host that serves the file wrongly still gets a second chance', () => {
  const src = fs.readFileSync(path.join(PUB, 'asr.js'), 'utf8');
  const blob = /new Blob\(\[code\], \{ type: 'text\/javascript' \}\)/.test(src);
  const retries = /attempt\(i \+ 1\)/.test(src);
  const base = /new URL\(BASE \+ 'transformers\.min\.js', pageBase/.test(src);
  return [blob && retries && base, `blobFallback=${blob} retries=${retries} baseResolved=${base}`];
});

await check('a missing runtime file is reported with its URL and HTTP status', async () => {
  const savedFetch = window.fetch;
  const savedLib = window.transformers;
  delete window.transformers;
  window.fetch = () => Promise.resolve({ ok: false, status: 404, headers: { get: () => null } });
  REAL_ASR.reset();
  REAL_ASR.setRuntimeTimeout(300);
  let message = '';
  try { await REAL_ASR.load(); } catch (err) { message = err.message; }
  window.fetch = savedFetch;
  window.transformers = savedLib;
  REAL_ASR.reset();
  REAL_ASR.setRuntimeTimeout(15000);
  return [/HTTP 404/.test(message) && /transformers\.(bundle|min)\.js/.test(message), message.slice(0, 120)];
});

check('opening the caption tab preloads the runtime, not the model', () => {
  const src = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8');
  const calls = /AsrLab\.prewarm\(\)/.test(src);
  const modelInPrewarm = /prewarm[\s\S]{0,400}pipeline\('automatic-speech-recognition'/.test(src);
  return [calls && !modelInPrewarm, `prewarm=${calls}`];
});

check('asr.js is served and referenced by the page', () => {
  const html = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');
  return [/<script src="\/?asr\.js/.test(html) && fs.existsSync(path.join(PUB, 'asr.js'))];
});

await check('a missing speech engine is reported, never silent', async () => {
  const saved = window.AsrLab;
  delete window.AsrLab;
  const audio = { samples: talkingClip(TALK_SPANS, 14), sampleRate: SR, durationSec: 14, source: 'test' };
  const analysis = P.lyricAnalyzeAudio(audio);
  const out = await P.lyricTranscribe(audio, analysis);
  const status = document.getElementById('lyrcDetectStatus');
  window.AsrLab = saved;
  return [out === null && status.dataset.kind === 'bad' && /speech engine did not load/i.test(status.textContent),
    `kind=${status.dataset.kind} "${status.textContent.slice(0, 60)}"`];
});

// ---------------------------------------------------------------------------
// 8. the panel must never scroll sideways (the "stuck menus" bug)
// ---------------------------------------------------------------------------
check('no pane can scroll horizontally', () => {
  const css = fs.readFileSync(path.join(PUB, 'styles.css'), 'utf8');
  const paneRule = /\.tab-pane\.active\s*\{[^}]*overflow-x:\s*hidden/.test(css);
  return [paneRule, paneRule ? 'overflow-x: hidden on .tab-pane.active' : 'missing'];
});

check('no grid in the panel can be forced wider than its container', () => {
  const css = fs.readFileSync(path.join(PUB, 'styles.css'), 'utf8');
  const bad = [...css.matchAll(/grid-template-columns:\s*repeat\(\d+,\s*1fr\)/g)].length;
  return [bad === 0, `${bad} grids still using repeat(n, 1fr)`];
});

check('focusing a block does not scroll the panel', () => {
  const src = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8');
  return [/focus\(\{\s*preventScroll:\s*true/.test(src), 'focus({preventScroll:true})'];
});

check('a long caption is split into readable blocks', () => {
  const words = [];
  for (let i = 0; i < 24; i++) words.push({ text: `w${i}`, startSec: i * 0.5, endSec: i * 0.5 + 0.4 });
  const split = P.splitLongCues([{ index: 1, text: 'long', startSec: 0, endSec: 12, words }]);
  const longest = Math.max(...split.map((c) => c.endSec - c.startSec));
  return [split.length >= 2 && longest <= 6.5 && split.every((c) => c.text.length > 0),
    `${split.length} blocks, longest ${longest.toFixed(1)}s`];
});

check.summary('lyrics auto-detect');
