/* ============================================================================
 * asr.js — speech to text, on this machine
 * ----------------------------------------------------------------------------
 * Whisper (tiny, int8) running in the page with ONNX Runtime Web. The weights
 * ship with the site: vendor/asr/models/Xenova/whisper-tiny. Nothing is uploaded,
 * there is no API key, and after the first load the browser caches the model.
 *
 * Why tiny: it is the smallest Whisper that is actually usable, and on a Mac it
 * transcribes about a minute of speech in a few seconds. Everything here is
 * synchronous-ish and single threaded on purpose -- GitHub Pages cannot send the
 * cross-origin isolation headers that multithreaded WASM needs.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var BASE = (global.PULSE_ASR_BASE || 'vendor/asr/').replace(/\/?$/, '/');
  var MODEL = 'Xenova/whisper-tiny';
  var loaded = null;          // the pipeline, once it is up
  var loading = null;         // the in-flight promise, so two clicks share one load
  var failed = null;          // the reason it could not load, if it could not
  var listeners = [];

  function state() {
    if (loaded) return 'ready';
    if (failed) return 'failed';
    if (loading) return 'loading';
    return 'idle';
  }

  function notify(info) {
    listeners.forEach(function (fn) {
      try { fn(info); } catch (e) { /* a listener must never break the loader */ }
    });
  }

  function report(phase, pct, detail) {
    notify({ phase: phase, pct: pct === undefined ? null : pct, detail: detail || '' });
  }

  // transformers.js needs to be pointed at the copy on this site. Remote models
  // are switched off entirely: a page that silently downloads a model from a CDN
  // is exactly what this project avoids.
  function configure(lib) {
    var env = lib.env;
    env.allowRemoteModels = false;
    env.allowLocalModels = true;
    // the Cache API is what makes the second visit instant; not every context has
    // it (private windows, embedded webviews), and it is not required to work
    env.useBrowserCache = !!(global.caches && global.caches.open);
    env.localModelPath = BASE + 'models/';
    if (env.backends && env.backends.onnx && env.backends.onnx.wasm) {
      env.backends.onnx.wasm.wasmPaths = BASE;
      env.backends.onnx.wasm.numThreads = 1;   // no cross-origin isolation on Pages
      env.backends.onnx.wasm.proxy = false;
    }
    if (env.backends && env.backends.onnx) {
      env.backends.onnx.logLevel = 'error';
    }
  }

  function getLib() {
    if (global.transformers && global.transformers.pipeline) return global.transformers;
    return null;
  }

  function load() {
    if (loaded) return Promise.resolve(loaded);
    if (loading) return loading;
    var lib = getLib();
    if (!lib) {
      failed = 'the speech engine script did not load';
      return Promise.reject(new Error(failed));
    }
    configure(lib);
    report('loading', 0.05, 'Loading the speech model (41 MB, cached after the first run)…');
    loading = lib.pipeline('automatic-speech-recognition', MODEL, {
      quantized: true,
      progress_callback: function (p) {
        if (!p) return;
        if (p.status === 'progress' && p.total) {
          report('loading', Math.min(0.95, (p.loaded || 0) / p.total), 'Loading the speech model…');
        } else if (p.status === 'done') {
          report('loading', 0.96, 'Speech model ready.');
        }
      }
    }).then(function (pipe) {
      loaded = pipe;
      loading = null;
      report('ready', 1, 'Speech model ready.');
      return pipe;
    }).catch(function (err) {
      loading = null;
      failed = (err && err.message) ? err.message : 'the model could not be loaded';
      report('failed', null, failed);
      throw new Error(failed);
    });
    return loading;
  }

  // Whisper wants 16 kHz mono floats. AudioLab already resamples; this is the
  // local guard so the module works even if it is handed something else.
  function to16k(samples, rate) {
    if (!samples || !samples.length) return new Float32Array(0);
    if (!rate || Math.abs(rate - 16000) < 1) return samples;
    var ratio = rate / 16000;
    var n = Math.max(1, Math.floor(samples.length / ratio));
    var out = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var pos = i * ratio;
      var i0 = Math.floor(pos);
      var f = pos - i0;
      var a = samples[i0] || 0;
      var b = samples[i0 + 1] === undefined ? a : samples[i0 + 1];
      out[i] = a + (b - a) * f;
    }
    return out;
  }

  // Whisper's word chunks carry their own leading space and punctuation. Keep
  // the words, keep the punctuation attached, drop the pure-symbol chunks.
  var WORD_FIX = /^[\s]+|[\s]+$/g;
  function cleanWord(text) {
    return String(text || '').replace(/\u2581/g, ' ').replace(/^\s+/, '').replace(/\s+$/, '');
  }

  function wordsFromChunks(chunks, durationSec) {
    var out = [];
    var hardEnd = typeof durationSec === 'number' && durationSec > 0 ? durationSec : Infinity;
    (chunks || []).forEach(function (c) {
      var text = cleanWord(c.text);
      if (!text) return;
      if (!/[A-Za-z0-9\u00C0-\u024F'’]/.test(text)) return;   // pure punctuation
      var ts = c.timestamp || [];
      var start = typeof ts[0] === 'number' ? ts[0] : null;
      var end = typeof ts[1] === 'number' ? ts[1] : null;
      if (start === null) return;
      // Whisper sometimes ends the final token at the end of its 30 s window,
      // which is past the end of the file. A single word is never longer than a
      // couple of seconds either -- both are clamped here, once, for everything.
      var stop = end === null ? start + 0.2 : Math.max(start + 0.08, end);
      stop = Math.min(stop, start + 1.6, hardEnd);
      if (stop <= start) stop = Math.min(start + 0.08, hardEnd);
      if (start >= hardEnd) return;
      out.push({ text: text, startSec: start, endSec: stop });
    });
    // a word can never run past the next one
    for (var i = 0; i < out.length - 1; i++) {
      if (out[i].endSec > out[i + 1].startSec) out[i].endSec = out[i + 1].startSec;
    }
    return out;
  }

  function transcribe(samples, rate, opts) {
    var o = opts || {};
    var maxSec = o.maxSec || 300;
    return load().then(function (pipe) {
      var pcm = to16k(samples, rate);
      var truncated = false;
      if (pcm.length > maxSec * 16000) {
        pcm = pcm.subarray(0, maxSec * 16000);
        truncated = true;
      }
      report('transcribing', 0.05, 'Transcribing…');
      var t0 = Date.now();
      return pipe(pcm, {
        language: o.language || 'en',
        task: 'transcribe',
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: 'word',
        condition_on_previous_text: false
      }).then(function (out) {
        var words = wordsFromChunks(out.chunks, pcm.length / 16000);
        var text = String(out.text || '').replace(/^\s+/, '').replace(/\s+$/, '');
        report('done', 1, 'Transcribed.');
        return {
          text: text,
          words: words,
          truncated: truncated,
          durationSec: pcm.length / 16000,
          tookMs: Date.now() - t0,
          language: o.language || 'en'
        };
      });
    });
  }

  // Group whispered words into the spans the VAD measured. Each word goes to the
  // span it overlaps most; a span with no confident word is left empty rather
  // than being given a neighbour's sentence.
  function wordsIntoSegments(words, segments) {
    var segs = (segments || []).map(function (s) {
      return { startSec: s.startSec, endSec: s.endSec, words: [] };
    });
    if (!segs.length) return [];
    (words || []).forEach(function (w) {
      var mid = (w.startSec + w.endSec) / 2;
      var best = -1;
      var bestOverlap = 0;
      for (var i = 0; i < segs.length; i++) {
        var s = segs[i];
        var overlap = Math.min(w.endSec, s.endSec) - Math.max(w.startSec, s.startSec);
        if (overlap > bestOverlap) { bestOverlap = overlap; best = i; }
        else if (best < 0 && mid >= s.startSec && mid <= s.endSec) { best = i; }
      }
      if (best < 0) {
        // outside every span (a word that landed in a pause): attach to the
        // nearest span in time so nothing is silently dropped
        var nearest = 0;
        var dist = Infinity;
        segs.forEach(function (s, i2) {
          var d = Math.min(Math.abs(w.startSec - s.endSec), Math.abs(s.startSec - w.endSec));
          if (d < dist) { dist = d; nearest = i2; }
        });
        best = nearest;
      }
      segs[best].words.push(w);
    });
    return segs.map(function (s) {
      var text = s.words.map(function (w) { return w.text; }).join(' ')
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
      // A caption has to contain its own words: if the machine heard a word
      // running past the measured phrase, the phrase grows rather than the word
      // being cut off mid-syllable.
      var first = s.words.length ? s.words[0].startSec : s.startSec;
      var last = s.words.length ? s.words[s.words.length - 1].endSec : s.endSec;
      return {
        startSec: Math.min(s.startSec, first),
        endSec: Math.max(s.endSec, last),
        text: text,
        words: s.words.map(function (w) { return { text: w.text, startSec: w.startSec, endSec: w.endSec }; })
      };
    });
  }

  var AsrLab = {
    version: '1.0',
    base: BASE,
    model: MODEL,
    state: state,
    load: load,
    transcribe: transcribe,
    wordsIntoSegments: wordsIntoSegments,
    wordsFromChunks: wordsFromChunks,
    onState: function (fn) { listeners.push(fn); },
    reset: function () { loaded = null; loading = null; failed = null; }
  };

  global.AsrLab = AsrLab;
  if (typeof module !== 'undefined' && module.exports) module.exports = AsrLab;
})(typeof window !== 'undefined' ? window : globalThis);
