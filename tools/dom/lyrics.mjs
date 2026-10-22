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
import { boot, makeCheck } from './harness.mjs';

const check = makeCheck();
const { window, document } = boot({ beforeScripts: (w) => { w.__PULSE_TEST__ = true; } });
const P = window.PulseTest;
const Lab = window.AudioLab;
const $ = (sel) => document.querySelector(sel);

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
  const cue = P.state.cues[2];
  const btn = [...document.querySelectorAll('#captionCuesList .cue-time')][2];
  btn.click();
  return [Math.abs(P.state.playheadSec - cue.startSec) < 0.2, `playhead=${P.state.playheadSec.toFixed(2)} cue=${cue.startSec}`];
});

check('the lyrics overlay stays off until it is switched on', () => {
  return [P.state.showLyricsOverlay === false, `overlay=${P.state.showLyricsOverlay}`];
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

check.summary('lyrics auto-detect');
