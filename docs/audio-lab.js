/* ============================================================================
 * audio-lab.js — the part that actually listens.
 * ----------------------------------------------------------------------------
 * The lyrics tab used to split whatever you pasted into N equal slices. That is
 * not timing, it is arithmetic. This module reads the clip's own audio and
 * measures where words are:
 *
 *   decodeFile()        → mono PCM from the file you dropped on the stage
 *   captureFromElement()→ fallback: listen through the video element once, 1×
 *   analyze()           → energy, ZCR, spectral flux, low band, vocal band
 *                         + beat grid, speech phrases, silences, mode decision
 *   cuesFromLines()     → your words placed on those measured positions
 *
 * Everything is plain DSP: no model download, no network, no upload. A talking
 * head comes out as speech phrases; a music video comes out as a beat grid with
 * vocal entries. Both feed the same timed cue list.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var TARGET_RATE = 16000;   // plenty for speech/vocal bands, 3× cheaper than 48k
  var WIN = 512;             // 32 ms analysis window
  var HOP = 160;             // 10 ms hop
  var FRAME_SEC = HOP / TARGET_RATE;

  // ---------------------------------------------------------------- utilities
  function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }
  function clamp01(x) { return clamp(x, 0, 1); }
  function dbOf(x) { return 20 * Math.log10(Math.max(1e-8, x)); }

  function percentile(arr, p) {
    if (!arr.length) return 0;
    var copy = Array.prototype.slice.call(arr).sort(function (a, b) { return a - b; });
    var idx = clamp(Math.round((copy.length - 1) * p), 0, copy.length - 1);
    return copy[idx];
  }
  function median(arr) { return percentile(arr, 0.5); }

  // ---------------------------------------------------------------- FFT (radix-2, in place)
  function makeFFT(n) {
    var levels = Math.round(Math.log(n) / Math.LN2);
    var cos = new Float32Array(n / 2);
    var sin = new Float32Array(n / 2);
    for (var i = 0; i < n / 2; i++) {
      cos[i] = Math.cos((2 * Math.PI * i) / n);
      sin[i] = Math.sin((2 * Math.PI * i) / n);
    }
    var rev = new Uint16Array(n);
    for (var k = 0; k < n; k++) {
      var x = k, r = 0;
      for (var j = 0; j < levels; j++) { r = (r << 1) | (x & 1); x >>= 1; }
      rev[k] = r;
    }
    return function fft(re, im) {
      for (var a = 0; a < n; a++) {
        var b = rev[a];
        if (b > a) {
          var t = re[a]; re[a] = re[b]; re[b] = t;
          t = im[a]; im[a] = im[b]; im[b] = t;
        }
      }
      for (var size = 2; size <= n; size <<= 1) {
        var half = size >> 1, step = n / size;
        for (var s = 0; s < n; s += size) {
          for (var p = s, tw = 0; p < s + half; p++, tw += step) {
            var q = p + half;
            var tre = re[q] * cos[tw] + im[q] * sin[tw];
            var tim = im[q] * cos[tw] - re[q] * sin[tw];
            re[q] = re[p] - tre; im[q] = im[p] - tim;
            re[p] += tre; im[p] += tim;
          }
        }
      }
    };
  }

  var fft512 = makeFFT(WIN);
  var hann = (function () {
    var w = new Float32Array(WIN);
    for (var i = 0; i < WIN; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (WIN - 1));
    return w;
  })();

  // ------------------------------------------------------------------ resample
  // Linear interpolation with a small box pre-filter, so a 48 kHz source does not
  // alias its cymbals down into the vocal band and fool the classifier.
  function resample(input, inRate, outRate) {
    if (!input || !input.length) return new Float32Array(0);
    if (Math.abs(inRate - outRate) < 1) return input;
    var src = input;
    if (inRate > outRate) {
      var taps = Math.max(2, Math.round(inRate / outRate));
      var pre = new Float32Array(input.length);
      var acc = 0;
      for (var i = 0; i < input.length; i++) {
        acc += input[i];
        if (i >= taps) acc -= input[i - taps];
        pre[i] = acc / Math.min(taps, i + 1);
      }
      src = pre;
    }
    var outLen = Math.max(1, Math.floor((src.length * outRate) / inRate));
    var out = new Float32Array(outLen);
    var step = inRate / outRate;
    for (var o = 0; o < outLen; o++) {
      var pos = o * step;
      var i0 = Math.floor(pos);
      var frac = pos - i0;
      var a = src[i0] || 0;
      var b = src[i0 + 1] === undefined ? a : src[i0 + 1];
      out[o] = a + (b - a) * frac;
    }
    return out;
  }

  function toMono(buffer) {
    var ch = buffer.numberOfChannels || 1;
    var len = buffer.length;
    if (ch === 1) return Float32Array.from(buffer.getChannelData(0));
    var out = new Float32Array(len);
    for (var c = 0; c < ch; c++) {
      var data = buffer.getChannelData(c);
      for (var i = 0; i < len; i++) out[i] += data[i] / ch;
    }
    return out;
  }

  // ------------------------------------------------------------------ features
  // One pass, ~10 ms frames. Everything downstream reads these arrays, so a
  // slider change never has to touch the audio again.
  function features(samples) {
    var n = samples.length;
    var frames = Math.max(1, Math.floor((n - WIN) / HOP) + 1);
    var times = new Float32Array(frames);
    var db = new Float32Array(frames);
    var zcr = new Float32Array(frames);
    var flux = new Float32Array(frames);
    var low = new Float32Array(frames);
    var vocal = new Float32Array(frames);
    var centroid = new Float32Array(frames);
    var re = new Float32Array(WIN);
    var im = new Float32Array(WIN);
    var prevMag = new Float32Array(WIN / 2);
    var mag = new Float32Array(WIN / 2);
    var binHz = TARGET_RATE / WIN;
    var lowA = Math.max(1, Math.round(30 / binHz));
    var lowB = Math.max(lowA + 1, Math.round(180 / binHz));
    var vocA = Math.max(1, Math.round(250 / binHz));
    var vocB = Math.max(vocA + 1, Math.round(3600 / binHz));
    var nyq = WIN / 2;

    for (var f = 0; f < frames; f++) {
      var start = f * HOP;
      var sum = 0, crossings = 0, prev = 0;
      for (var i = 0; i < WIN; i++) {
        var s = samples[start + i] || 0;
        sum += s * s;
        if (i > 0 && ((s >= 0) !== (prev >= 0))) crossings++;
        prev = s;
        re[i] = s * hann[i];
        im[i] = 0;
      }
      times[f] = (start + WIN / 2) / TARGET_RATE;
      var rms = Math.sqrt(sum / WIN);
      db[f] = dbOf(rms);
      zcr[f] = crossings / WIN;

      fft512(re, im);
      var loE = 0, vocE = 0, total = 0, wsum = 0;
      for (var b = 1; b < nyq; b++) {
        var m = Math.sqrt(re[b] * re[b] + im[b] * im[b]);
        mag[b] = m;
        total += m;
        wsum += m * b;
        if (b >= lowA && b <= lowB) loE += m;
        if (b >= vocA && b <= vocB) vocE += m;
      }
      low[f] = dbOf(loE / (lowB - lowA + 1));
      vocal[f] = dbOf(vocE / (vocB - vocA + 1));
      centroid[f] = total > 0 ? (wsum / total) * binHz : 0;

      var fl = 0;
      for (var k = 1; k < nyq; k++) {
        var d = mag[k] - prevMag[k];
        if (d > 0) fl += d;
        prevMag[k] = mag[k];
      }
      flux[f] = total > 0 ? fl / total : 0;
    }
    return {
      frameSec: FRAME_SEC,
      times: times, db: db, zcr: zcr, flux: flux,
      low: low, vocal: vocal, centroid: centroid,
      durationSec: n / TARGET_RATE
    };
  }

  // ------------------------------------------------------------- onset envelope
  // Flux with its slow average removed: what is left is "something just hit".
  function onsetEnvelope(feat) {
    var db = feat.flux, n = db.length;
    var out = new Float32Array(n);
    var win = 15;                       // 150 ms local mean
    for (var i = 0; i < n; i++) {
      var a = Math.max(0, i - win), b = Math.min(n - 1, i + win);
      var sum = 0;
      for (var j = a; j <= b; j++) sum += db[j];
      var mean = sum / (b - a + 1);
      var v = db[i] - mean;
      out[i] = v > 0 ? v : 0;
    }
    return out;
  }

  // ---------------------------------------------------------------- beat grid
  function detectBeats(env, feat) {
    var n = env.length;
    var mean = 0;
    for (var i = 0; i < n; i++) mean += env[i];
    mean /= Math.max(1, n);
    if (mean <= 1e-6) return { bpm: 0, periodSec: 0, offsetSec: 0, strength: 0, clarity: 0 };

    var minLag = Math.round(0.28 / FRAME_SEC);   // 214 bpm
    var maxLag = Math.round(1.6 / FRAME_SEC);    // 37 bpm
    var bestLag = 0, bestScore = 0, scores = new Float32Array(maxLag + 1);
    var energy = 0;
    for (var e = 0; e < n; e++) energy += env[e] * env[e];
    for (var lag = minLag; lag <= maxLag && lag < n; lag++) {
      var ac = 0;
      for (var k = lag; k < n; k++) ac += env[k] * env[k - lag];
      var norm = ac / Math.max(1e-9, energy - (lag > 0 ? 0 : 0));
      scores[lag] = norm;
      if (norm > bestScore) { bestScore = norm; bestLag = lag; }
    }
    if (!bestLag) return { bpm: 0, periodSec: 0, offsetSec: 0, strength: 0, clarity: 0 };
    // Octave correction. Autocorrelation happily locks onto the hi-hat instead
    // of the kick, which reports 192 bpm for a 96 bpm track. Keep the tempo in a
    // musical window and only double/halve when the related lag still explains
    // a good share of the onsets.
    var bpmGuess = 60 / (bestLag * FRAME_SEC);
    var doubleLag = bestLag * 2;
    var halfLag = Math.round(bestLag / 2);
    if (bpmGuess > 150 && doubleLag <= maxLag && scores[doubleLag] > bestScore * 0.55) {
      bestLag = doubleLag;
    } else if (bpmGuess < 68 && halfLag >= minLag && scores[halfLag] > bestScore * 0.7) {
      bestLag = halfLag;
    }

    // parabolic refinement for a fractional period
    var refined = bestLag;
    if (bestLag > minLag && bestLag < maxLag) {
      var y0 = scores[bestLag - 1], y1 = scores[bestLag], y2 = scores[bestLag + 1];
      var denom = (y0 - 2 * y1 + y2);
      if (Math.abs(denom) > 1e-9) refined = bestLag + (0.5 * (y0 - y2)) / denom;
    }
    var period = refined * FRAME_SEC;

    // phase: which fraction of the period do the strongest onsets sit on?
    var phases = new Float32Array(24);
    for (var f2 = 0; f2 < n; f2++) {
      if (env[f2] <= 0) continue;
      var ph = (f2 * FRAME_SEC) % period;
      var bin = Math.floor((ph / period) * 24) % 24;
      phases[bin] += env[f2];
    }
    var bestBin = 0;
    for (var p2 = 1; p2 < 24; p2++) if (phases[p2] > phases[bestBin]) bestBin = p2;
    var offset = ((bestBin + 0.5) / 24) * period;

    // clarity: share of onset energy landing within 50 ms of a grid line
    var near = 0, total = 0;
    for (var f3 = 0; f3 < n; f3++) {
      if (env[f3] <= 0) continue;
      total += env[f3];
      var t = f3 * FRAME_SEC;
      var dist = Math.abs(((t - offset) % period + period) % period);
      if (dist < 0.05 || period - dist < 0.05) near += env[f3];
    }
    return {
      bpm: 60 / period,
      periodSec: period,
      offsetSec: offset,
      strength: bestScore,
      clarity: total > 0 ? near / total : 0
    };
  }

  // ------------------------------------------------------------- phrase finding
  // Hysteresis VAD: open on a clear rise, only close after real quiet, so a
  // breath mid-sentence does not cut the caption in half.
  function findSegments(level, times, opts) {
    var o = opts || {};
    var floor = Math.max(percentile(level, 0.15), -90);
    var peak = percentile(level, 0.97);
    var span = Math.max(3, peak - floor);
    var open = floor + span * (o.openFrac === undefined ? 0.42 : o.openFrac);
    var close = floor + span * (o.closeFrac === undefined ? 0.24 : o.closeFrac);
    var minSec = o.minSec === undefined ? 0.16 : o.minSec;
    var gapSec = o.gapSec === undefined ? 0.22 : o.gapSec;
    var padSec = o.padSec === undefined ? 0.06 : o.padSec;
    var limit = o.maxSec || 12;
    var segs = [];
    var inSeg = false, startT = 0, lastLoud = 0;
    for (var i = 0; i < level.length; i++) {
      var t = times[i];
      if (!inSeg) {
        if (level[i] >= open) { inSeg = true; startT = t; lastLoud = t; }
      } else if (level[i] >= close) {
        lastLoud = t;
        if (t - startT > limit) { segs.push([startT, t]); startT = t; }
      } else if (t - lastLoud > gapSec) {
        segs.push([startT, lastLoud]);
        inSeg = false;
      }
    }
    if (inSeg) segs.push([startT, lastLoud]);
    return segs
      .map(function (s) { return [Math.max(0, s[0] - padSec), s[1] + padSec]; })
      .filter(function (s) { return s[1] - s[0] >= minSec; })
      .map(function (s) { return { startSec: s[0], endSec: s[1] }; });
  }

  function findSilences(feat, opts) {
    var o = opts || {};
    var thresholdDb = o.thresholdDb === undefined ? -38 : o.thresholdDb;
    var minMs = o.minMs === undefined ? 320 : o.minMs;
    var padMs = o.padMs === undefined ? 60 : o.padMs;
    var times = feat.times, db = feat.db;
    var out = [];
    var runStart = -1;
    for (var i = 0; i < db.length; i++) {
      if (db[i] <= thresholdDb) {
        if (runStart < 0) runStart = i;
      } else if (runStart >= 0) {
        pushRun(runStart, i - 1);
        runStart = -1;
      }
    }
    if (runStart >= 0) pushRun(runStart, db.length - 1);
    function pushRun(a, b) {
      var start = times[a] - FRAME_SEC / 2;
      var end = times[b] + FRAME_SEC / 2;
      if ((end - start) * 1000 < minMs) return;
      var sum = 0;
      for (var k = a; k <= b; k++) sum += db[k];
      out.push({
        startSec: Math.max(0, start + padMs / 1000),
        endSec: Math.max(start + padMs / 1000 + 0.05, end - padMs / 1000),
        avgDb: sum / (b - a + 1)
      });
    }
    return out;
  }

  // ------------------------------------------------------------------ analysis
  // Bring a quiet or hot file into a sane range so dB thresholds mean the same
  // thing everywhere -- but only if it actually has signal. A silent clip must
  // stay silent, not be amplified into room tone.
  var lastSourcePeak = 0;
  function normalize(samples) {
    var peak = 0;
    for (var i = 0; i < samples.length; i++) {
      var v = samples[i] < 0 ? -samples[i] : samples[i];
      if (v > peak) peak = v;
    }
    lastSourcePeak = peak;
    if (peak > 0.02 && (peak > 1 || peak < 0.5)) {
      var gain = 0.95 / peak;
      for (var k = 0; k < samples.length; k++) samples[k] *= gain;
    }
    return samples;
  }

  function analyze(samples, sampleRate, opts) {
    var o = opts || {};
    var pcm = normalize(resample(samples, sampleRate || TARGET_RATE, TARGET_RATE));
    var feat = features(pcm);
    var env = onsetEnvelope(feat);
    var beats = detectBeats(env, feat);

    var speechSegs = findSegments(feat.db, feat.times, { openFrac: 0.4, closeFrac: 0.22 });
    var vocalSegs = findSegments(feat.vocal, feat.times, {
      openFrac: 0.52, closeFrac: 0.3, minSec: 0.22, gapSec: 0.28
    });

    // "true quiet" is measured against this clip's own noise floor, not a
    // fixed dB number: a phone recording and a mastered track do not share one.
    var quiet = 0;
    var floorDb = percentile(feat.db, 0.1);
    var loudDb = percentile(feat.db, 0.95);
    var quietThr = Math.min(loudDb - 12, floorDb + 14);
    for (var i = 0; i < feat.db.length; i++) if (feat.db[i] <= quietThr) quiet++;
    var silenceFraction = quiet / Math.max(1, feat.db.length);

    var speechTime = speechSegs.reduce(function (a, s) { return a + (s.endSec - s.startSec); }, 0);
    var segLens = speechSegs.map(function (s) { return s.endSec - s.startSec; });
    var segMedian = segLens.length ? median(segLens) : 0;

    // --- mode decision -----------------------------------------------------
    // Music: a periodic pulse explains the onsets, and there is little true quiet.
    // Speech: energy arrives in bursts with gaps, and the pulse explains nothing.
    var bassEmphasis = clamp01((median(feat.low) - median(feat.vocal) + 18) / 30);
    var pulse = 0.45 * clamp01((beats.strength - 0.35) / 0.55)
      + 0.55 * clamp01((beats.clarity - 0.1) / 0.65);
    // gappiness: how much of the clip has nobody talking in it. Speech is full
    // of holes; a music bed is not.
    var gap = clamp01(1 - speechTime / Math.max(0.5, feat.durationSec));
    var burst = clamp01((segMedian - 0.35) / 1.3);
    var musicScore = 0
      + 2.2 * pulse
      + 0.6 * bassEmphasis
      + 0.35 * clamp01((0.25 - gap) / 0.25);
    var speechScore = 0
      + 1.6 * (1 - pulse) * clamp01((gap - 0.06) / 0.28)
      + 1.2 * burst
      + 0.8 * clamp01((speechSegs.length - 2) / 8);

    var warnings = [];
    var loudest = percentile(feat.db, 0.98);
    var isSilent = lastSourcePeak < 0.02 || loudest < -50;
    if (isSilent) { beats.bpm = 0; beats.periodSec = 0; beats.strength = 0; }
    var chosenEarly = o.mode || 'auto';

    var chosen = o.mode || 'auto';
    var decided = chosen;
    var confidence = 0;
    if (isSilent) {
      decided = chosenEarly === 'auto' ? 'silent' : chosenEarly;
      confidence = 1;
      warnings.push('this clip has no audible audio — nothing to detect');
    } else if (chosen === 'auto') {
      if (musicScore - speechScore > 0.3) { decided = 'music'; confidence = clamp01((musicScore - speechScore) / 1.6); }
      else if (speechScore - musicScore > 0.3) { decided = 'speech'; confidence = clamp01((speechScore - musicScore) / 1.6); }
      else {
        decided = gap > 0.18 ? 'speech' : 'music';
        confidence = 0.25;
      }
    } else {
      confidence = 1;
    }

    var vocalPhrases = vocalSegs.filter(function (s) { return s.endSec - s.startSec >= 0.3; });
    if (chosen === 'music' && !beats.bpm) warnings.push('no steady pulse found — lines were spread over the clip');
    if (chosen === 'speech' && speechSegs.length < 2) warnings.push('very little speech found — check the clip has audio');

    // Only claim a tempo when there is a pulse worth counting.
    var reportedBpm = (beats.strength >= 0.5 && beats.clarity >= 0.33) ? beats.bpm : 0;
    if (!reportedBpm) { beats.bpm = 0; beats.periodSec = 0; }

    return {
      durationSec: feat.durationSec,
      sampleRate: TARGET_RATE,
      features: feat,
      beats: beats,
      silent: isSilent,
      gap,
      burst,
      bpm: reportedBpm,
      beatOffsetSec: beats.offsetSec,
      beatPeriodSec: beats.periodSec,
      beatStrength: beats.strength,
      beatClarity: beats.clarity,
      speechSegments: speechSegs,
      vocalSegments: vocalPhrases,
      silences: findSilences(feat, o),
      silenceFraction: silenceFraction,
      speechTimeSec: speechTime,
      segMedianSec: segMedian,
      musicScore: musicScore,
      speechScore: speechScore,
      pulseScore: pulse,
      bassEmphasis: bassEmphasis,
      quietThresholdDb: quietThr,
      mode: decided,
      modeConfidence: confidence,
      requestedMode: chosen,
      warnings: warnings
    };
  }

  // ------------------------------------------------------------- cue building
  function splitWords(text) {
    return String(text || '').split(/\s+/).filter(Boolean);
  }

  function nextBeatAfter(t, analysis) {
    var period = analysis.beatPeriodSec;
    if (!period) return t;
    var off = analysis.beatOffsetSec || 0;
    var k = Math.round((t - off) / period);
    return Math.max(0, off + k * period);
  }

  // Where each line starts, measured from the audio.
  function lineStarts(lines, analysis, mode) {
    var n = lines.length;
    var weights = lines.map(function (l) { return Math.max(1, splitWords(l).length); });
    var totalW = weights.reduce(function (a, b) { return a + b; }, 0);
    var dur = analysis.durationSec || 0;
    var starts = [];
    var i;

    if (mode === 'speech') {
      // Words fill the speech, not the silence: walk the talking stretches.
      var segs = analysis.speechSegments || [];
      var speechSpan = segs.reduce(function (a, s) { return a + (s.endSec - s.startSec); }, 0);
      if (segs.length >= n && n > 0 && segs.length >= 2) {
        // One line per phrase: a new sentence is a new caption block.
        for (i = 0; i < n; i++) {
          var si = n === 1 ? 0 : Math.round((i * (segs.length - 1)) / (n - 1));
          starts.push(segs[si].startSec);
        }
        return starts;
      }
      if (segs.length && speechSpan > 0.5) {
        var cum = 0;
        for (i = 0; i < n; i++) {
          var at0 = speechTimeToReal((cum / totalW) * speechSpan, segs);
          starts.push(snapToSpeech(at0, segs));
          cum += weights[i];
        }
        for (i = 1; i < starts.length; i++) if (starts[i] <= starts[i - 1]) starts[i] = starts[i - 1] + 0.05;
        return starts;
      }
      var span = dur || 1;
      var acc = 0;
      for (i = 0; i < n; i++) { starts.push((acc / totalW) * span); acc += weights[i]; }
      return starts;
    }

    // Music: land lines on the vocal entries; if there are fewer entries than
    // lines, spread by word count from the first entry and snap to the pulse.
    var vocals = (analysis.vocalSegments || []).slice();
    if (vocals.length >= n && n > 0) {
      for (i = 0; i < n; i++) {
        var idx = n === 1 ? 0 : Math.round((i * (vocals.length - 1)) / (n - 1));
        starts.push(nextBeatAfter(vocals[idx].startSec, analysis));
      }
      // a beat snap must never reorder the lines
      for (i = 1; i < starts.length; i++) if (starts[i] <= starts[i - 1]) starts[i] = starts[i - 1] + 0.05;
      return starts;
    }

    var from = vocals.length ? vocals[0].startSec : 0;
    var to = vocals.length ? vocals[vocals.length - 1].endSec : (dur || 1);
    if (!(to > from)) { from = 0; to = dur || 1; }
    var cum2 = 0;
    for (i = 0; i < n; i++) {
      var at = from + (cum2 / totalW) * (to - from);
      starts.push(analysis.beatPeriodSec ? nextBeatAfter(at, analysis) : at);
      cum2 += weights[i];
    }
    for (i = 1; i < starts.length; i++) if (starts[i] <= starts[i - 1]) starts[i] = starts[i - 1] + 0.05;
    return starts;
  }

  // A caption that starts in the middle of a pause looks broken. If the word
  // lands in a gap, walk forward to the next thing that was actually said.
  function snapToSpeech(t, segs) {
    if (!segs || !segs.length) return t;
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      if (t >= s.startSec && t <= s.endSec) return t;
      if (t < s.startSec) return s.startSec;
    }
    var last = segs[segs.length - 1];
    return Math.max(last.startSec, Math.min(t, last.endSec - 0.15));
  }

  // The last spoken frame after t: a cue should end when the talking stops, not
  // when the next line eventually arrives across three seconds of room tone.
  function speechEndCap(t, segs) {
    if (!segs || !segs.length) return Infinity;
    for (var i = 0; i < segs.length; i++) {
      if (t >= segs[i].startSec - 0.02 && t <= segs[i].endSec) return segs[i].endSec + 0.32;
    }
    return Infinity;
  }

  function speechTimeToReal(t, segs) {
    var acc = 0;
    for (var i = 0; i < segs.length; i++) {
      var len = segs[i].endSec - segs[i].startSec;
      if (t <= acc + len) return segs[i].startSec + (t - acc);
      acc += len;
    }
    return segs.length ? segs[segs.length - 1].endSec : t;
  }

  // Word timings inside one cue, so the kinetic typography can land each word.
  function wordTimes(text, startSec, endSec, emphasisFrac) {
    var words = splitWords(text);
    if (!words.length) return [];
    var total = words.reduce(function (a, w) { return a + Math.max(1, Math.min(9, w.length / 3)); }, 0);
    var span = Math.max(0.12, endSec - startSec);
    var t = startSec;
    return words.map(function (w) {
      var wgt = Math.max(1, Math.min(9, w.length / 3));
      var d = (wgt / total) * span;
      var item = { text: w, startSec: +t.toFixed(3), endSec: +(t + d).toFixed(3) };
      t += d;
      return item;
    });
  }

  function cuesFromLines(lines, analysis, opts) {
    var o = opts || {};
    var clean = (lines || []).map(function (l) { return String(l).replace(/\s+/g, ' ').trim(); })
      .filter(function (l) { return l.length > 0; });
    if (!clean.length) return [];
    var mode = o.mode || analysis.mode || 'music';
    var starts = lineStarts(clean, analysis, mode === 'speech' ? 'speech' : 'music');
    var dur = analysis.durationSec || 0;
    var minSec = o.minSec === undefined ? 0.55 : o.minSec;
    var cues = [];
    var segs = mode === 'speech' ? (analysis.speechSegments || []) : null;
    for (var i = 0; i < clean.length; i++) {
      var start = Math.max(0, starts[i]);
      var end = i + 1 < clean.length ? starts[i + 1] : Math.max(start + minSec, dur || start + 2);
      if (segs && segs.length) end = Math.min(end, speechEndCap(start, segs));
      if (end - start < minSec) end = start + minSec;
      if (dur > 0) end = Math.min(end, dur);
      if (end <= start) end = start + minSec;
      cues.push({
        index: i + 1,
        startSec: +start.toFixed(2),
        endSec: +end.toFixed(2),
        text: clean[i],
        words: wordTimes(clean[i], start, end, 0.25)
      });
    }
    return cues;
  }

  // No transcript yet: one block per measured phrase, ready to type over.
  function cuesFromPhrases(analysis) {
    var segs = analysis.mode === 'speech' ? analysis.speechSegments : analysis.vocalSegments;
    if (!segs || !segs.length) segs = analysis.speechSegments || [];
    return segs.map(function (s, i) {
      return {
        index: i + 1,
        startSec: +s.startSec.toFixed(2),
        endSec: +s.endSec.toFixed(2),
        text: '',
        placeholder: true,
        words: []
      };
    });
  }

  // --------------------------------------------------------------- decoding
  function audioContext() {
    var Ctx = global.AudioContext || global.webkitAudioContext;
    return Ctx ? new Ctx() : null;
  }

  // decodeAudioData is promise-based in current browsers and callback-based in
  // older Safari. Support both instead of betting on one.
  function decodeBuffer(ctx, buf) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var ok = function (audio) { if (!settled) { settled = true; resolve(audio); } };
      var bad = function (err) { if (!settled) { settled = true; reject(err || new Error('decode failed')); } };
      var maybe = null;
      try {
        maybe = ctx.decodeAudioData(buf, ok, bad);
      } catch (err) { bad(err); return; }
      if (maybe && typeof maybe.then === 'function') maybe.then(ok, bad);
    });
  }

  // A MediaElementSourceNode can only be created once per element, and it dies
  // with its context -- so keep one capture context and one source per element
  // for the life of the page. Pressing Detect twice must not throw.
  var capCtx = null;
  var capSink = null;
  var capSources = new Map();
  var monitorGain = 1;                 // what the user hears after a capture
  function captureGraph(el) {
    var Ctx = global.AudioContext || global.webkitAudioContext;
    if (!Ctx) throw new Error('This browser has no Web Audio support.');
    if (!capCtx) {
      capCtx = new Ctx();
      capSink = capCtx.createGain();
      capSink.gain.value = monitorGain; // pass-through by default, silenced only while capturing
      capSink.connect(capCtx.destination);
    }
    var src = capSources.get(el);
    if (!src) {
      src = capCtx.createMediaElementSource(el);
      src.connect(capSink);
      capSources.set(el, src);
    }
    return { ctx: capCtx, src: src };
  }

  // Decode the file the user dropped. Chrome and Safari both hand an MP4/MOV's
  // AAC track to decodeAudioData, which is why the video file itself is enough.
  function decodeFile(file, onProgress) {
    return new Promise(function (resolve, reject) {
      var ctx = audioContext();
      if (!ctx) { reject(new Error('This browser has no Web Audio support.')); return; }
      if (file && file.size > 700 * 1024 * 1024) {
        ctx.close();
        reject(new Error('that file is over 700 MB — trim it to the section you are captioning first'));
        return;
      }
      if (onProgress) onProgress({ phase: 'reading', pct: 0.05 });
      var reader = new FileReader();
      reader.onerror = function () { ctx.close(); reject(new Error('Could not read the file.')); };
      reader.onload = function () {
        if (onProgress) onProgress({ phase: 'decoding', pct: 0.25 });
        var buf = reader.result;
        decodeBuffer(ctx, buf).then(function (audio) {
          if (onProgress) onProgress({ phase: 'decoding', pct: 0.55 });
          var mono = toMono(audio);
          var out = {
            samples: mono,
            sampleRate: audio.sampleRate,
            durationSec: audio.duration,
            source: 'decoded',
            channels: audio.numberOfChannels
          };
          try { ctx.close(); } catch (e) { /* already closed */ }
          resolve(out);
        }).catch(function (err) {
          try { ctx.close(); } catch (e) { }
          reject(new Error('This file has no readable audio track (' + (err && err.message ? err.message : 'decode failed') + ').'));
        });
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // Fallback for sources we cannot decode (a streamed clip, an exotic codec):
  // listen through the video element once while it plays at normal speed.
  function captureFromElement(el, onProgress) {
    return new Promise(function (resolve, reject) {
      if (!el) { reject(new Error('No video element to listen to.')); return; }
      var graph;
      try {
        graph = captureGraph(el);
      } catch (err) {
        reject(new Error('This browser cannot listen to the player directly (' + err.message + ').'));
        return;
      }
      var ctx = graph.ctx;
      var proc = ctx.createScriptProcessor(4096, 1, 1);
      var chunks = [];
      var total = 0;
      var dur = el.duration || 0;
      proc.onaudioprocess = function (e) {
        var d = e.inputBuffer.getChannelData(0);
        chunks.push(Float32Array.from(d));
        total += d.length;
        if (onProgress) {
          onProgress({ phase: 'listening', pct: Math.min(0.95, total / Math.max(1, dur * ctx.sampleRate)) });
        }
      };
      // Once an element is routed into WebAudio its own output goes through this
      // graph, so the sink is the volume control. Zero while listening (nobody
      // wants a clip blaring during a scan), restored the instant it finishes.
      if (capSink) capSink.gain.value = 0;
      graph.src.connect(proc);
      proc.connect(capSink);
      var wasMuted = el.muted;
      var wasAt = el.currentTime;
      el.muted = false;
      try { el.currentTime = 0; } catch (e) { /* not seekable yet */ }
      var played = el.play();
      if (played && typeof played.catch === 'function') played.catch(function () { });
      var done = false;
      var finish = function () {
        if (done) return;
        done = true;
        try { el.pause(); } catch (e) { /* ignore */ }
        el.muted = wasMuted;
        try { graph.src.disconnect(proc); } catch (e) { /* already gone */ }
        try { proc.disconnect(); } catch (e) { /* already gone */ }
        var merged = new Float32Array(total);
        var at = 0;
        chunks.forEach(function (c) { merged.set(c, at); at += c.length; });
        if (capSink) capSink.gain.value = monitorGain;
        var rate = ctx.sampleRate;
        resolve({
          samples: merged,
          sampleRate: rate,
          durationSec: merged.length / rate,
          source: 'captured',
          channels: 1,
          playedFrom: 0,
          restoredTo: wasAt
        });
      };
      el.addEventListener('ended', finish, { once: true });
      setTimeout(finish, Math.min(600000, ((dur || 30) * 1000) + 1500));
    });
  }

  // A stream of the element's own audio, for recording. The element keeps
  // playing into this graph, so the recorded sound *is* the picture's sound:
  // no scheduling, no splicing, no drift, and it works for any codec the
  // browser can play even when it cannot decode the file for analysis.
  function captureStreamFrom(el) {
    var graph = captureGraph(el);
    var dest = graph.ctx.createMediaStreamDestination();
    graph.src.connect(dest);
    if (graph.ctx.state === 'suspended' && graph.ctx.resume) {
      try { graph.ctx.resume(); } catch (e) { /* ignore */ }
    }
    return {
      stream: dest.stream,
      context: graph.ctx,
      release: function () {
        try { graph.src.disconnect(dest); } catch (e) { /* already gone */ }
      }
    };
  }

  // The panel's Sound switch: 0 mutes the monitor, 1 restores it.
  function setMonitorLevel(level) {
    monitorGain = Math.max(0, Math.min(1, Number(level)));
    if (capSink) capSink.gain.value = monitorGain;
  }

  var AudioLab = {
    version: '1.0',
    setMonitorLevel: setMonitorLevel,
    captureStreamFrom: captureStreamFrom,
    TARGET_RATE: TARGET_RATE,
    FRAME_SEC: FRAME_SEC,
    features: features,
    onsetEnvelope: onsetEnvelope,
    detectBeats: detectBeats,
    findSegments: findSegments,
    findSilences: findSilences,
    analyze: analyze,
    cuesFromLines: cuesFromLines,
    cuesFromPhrases: cuesFromPhrases,
    wordTimes: wordTimes,
    resample: resample,
    decodeFile: decodeFile,
    captureFromElement: captureFromElement,
    _fft: makeFFT
  };

  global.AudioLab = AudioLab;
  if (typeof module !== 'undefined' && module.exports) module.exports = AudioLab;
})(typeof window !== 'undefined' ? window : globalThis);
