/* ============================================================================
 * PulseVFX — IN-APP SILENCE CUTTER
 * ----------------------------------------------------------------------------
 * Cuts the pauses out of a clip inside this page and hands back a finished
 * file. No Resolve, no upload, no server.
 *
 * Two halves:
 *
 *   plan()   pure arithmetic over the measured segments: which slices of the
 *            source survive, how long the result is, and how a moment in the
 *            cut maps back to a moment in the source. No DOM, so it is testable.
 *
 *   render() the real thing: a canvas the size of the source, a MediaRecorder
 *            on that canvas plus the audio track, and the source <video>
 *            played through each surviving slice in turn. Between slices the
 *            recorder *and* the audio clock are paused, so a slow seek cannot
 *            stretch the file or slide the sound out of sync.
 *
 * Declared limits, said out loud in the UI:
 *   - it records in real time (a 3-minute cut takes about 3 minutes);
 *   - the container is whatever this browser can encode (MP4/H.264 or
 *     WebM/VP9+Opus), reported as `format` so the page can be honest about it;
 *   - a still frame is only as good as the browser's encoder at the bitrate
 *     set here, so this is a delivery file, not a grading master.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SILENCE_CUT = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';
  var DEFAULT_MIN_SLICE = 0.12;   // shorter than this is a click, not a word
  var JOIN_GAP = 0.02;            // slices closer than this are really one slice

  // ---------------------------------------------------------------- planning

  /**
   * Which slices of the source survive the cut.
   *
   * @param {Array} segments  [{start, end, type, forceKeep}] in source seconds,
   *                          covering the whole clip (see segmentsFromAnalysis)
   * @param {Object} opts     {minSliceSec, padSec}
   * @returns {{ranges, cuts, keptSec, removedSec, sourceSec, dropped}}
   */
  function plan(segments, opts) {
    var o = opts || {};
    var minSlice = Number(o.minSliceSec) > 0 ? Number(o.minSliceSec) : DEFAULT_MIN_SLICE;
    var pad = Math.max(0, Number(o.padSec) || 0);
    var list = (segments || [])
      .map(function (s) {
        return {
          start: Math.max(0, Number(s.start) || 0),
          end: Math.max(0, Number(s.end) || 0),
          cut: s.type === 'silence' && !s.forceKeep
        };
      })
      .filter(function (s) { return s.end - s.start > 0.001; })
      .sort(function (a, b) { return a.start - b.start; });

    // keep only the slices that are not silence
    var ranges = [];
    var dropped = 0;
    list.forEach(function (s) {
      if (s.cut) return;
      var start = Math.max(0, s.start - pad);
      var end = s.end + pad;
      if (end - start < minSlice) { dropped += end - start; return; }
      var last = ranges[ranges.length - 1];
      if (last && start - last.end <= JOIN_GAP) {
        last.end = Math.max(last.end, end);      // contiguous: one slice
      } else {
        ranges.push({ start: start, end: end });
      }
    });

    // padding must never make a slice overlap the next one
    for (var i = 0; i < ranges.length - 1; i++) {
      if (ranges[i].end > ranges[i + 1].start) {
        ranges[i].end = Math.max(ranges[i].start + 0.02, ranges[i + 1].start);
      }
    }

    var keptSec = ranges.reduce(function (a, r) { return a + (r.end - r.start); }, 0);
    var sourceSec = list.length ? list[list.length - 1].end : 0;
    var cuts = [];
    var cursor = 0;
    ranges.forEach(function (r) {
      if (r.start - cursor > 0.001) cuts.push({ start: cursor, end: r.start });
      cursor = r.end;
    });
    if (sourceSec - cursor > 0.001) cuts.push({ start: cursor, end: sourceSec });

    return {
      ranges: ranges,
      cuts: cuts,
      keptSec: +keptSec.toFixed(3),
      removedSec: +Math.max(0, sourceSec - keptSec).toFixed(3),
      sourceSec: +sourceSec.toFixed(3),
      dropped: +dropped.toFixed(3),
      cutCount: cuts.length
    };
  }

  /** Where a moment of the finished cut came from in the source. */
  function toSource(ranges, outSec) {
    var t = Math.max(0, Number(outSec) || 0);
    var walked = 0;
    for (var i = 0; i < ranges.length; i++) {
      var len = ranges[i].end - ranges[i].start;
      if (t < walked + len || i === ranges.length - 1) {
        return Math.min(ranges[i].end, ranges[i].start + (t - walked));
      }
      walked += len;
    }
    return ranges.length ? ranges[ranges.length - 1].end : 0;
  }

  /** Where a moment of the source landed in the cut, or null if it was removed. */
  function toOutput(ranges, srcSec) {
    var t = Number(srcSec) || 0;
    var walked = 0;
    for (var i = 0; i < ranges.length; i++) {
      var r = ranges[i];
      if (t < r.start) return null;                 // inside a removed pause
      if (t <= r.end) return walked + (t - r.start);
      walked += r.end - r.start;
    }
    return null;
  }

  function planSummary(p) {
    if (!p || !p.ranges.length) return 'nothing to keep';
    var pct = p.sourceSec > 0 ? Math.round((p.removedSec / p.sourceSec) * 100) : 0;
    return p.ranges.length + ' piece' + (p.ranges.length === 1 ? '' : 's')
      + ', ' + p.keptSec.toFixed(1) + 's from ' + p.sourceSec.toFixed(1) + 's ('
      + pct + '% removed)';
  }

  // ---------------------------------------------------------------- audio

  /**
   * Splice the kept slices of an AudioBuffer into one continuous buffer.
   * Sample-accurate, so no drift is possible however many cuts there are.
   */
  function spliceAudio(ctx, buffer, ranges, sampleRate) {
    if (!buffer || !ranges || !ranges.length) return null;
    var rate = sampleRate || buffer.sampleRate;
    var total = 0;
    ranges.forEach(function (r) { total += Math.max(0, r.end - r.start); });
    var frames = Math.max(1, Math.round(total * rate));
    var out = ctx.createBuffer(buffer.numberOfChannels || 1, frames, rate);
    var channels = buffer.numberOfChannels || 1;
    for (var c = 0; c < channels; c++) {
      var src = buffer.getChannelData(c);
      var dst = out.getChannelData(c);
      var at = 0;
      for (var i = 0; i < ranges.length; i++) {
        var start = Math.max(0, Math.min(src.length, Math.round(ranges[i].start * buffer.sampleRate)));
        var end = Math.max(start, Math.min(src.length, Math.round(ranges[i].end * buffer.sampleRate)));
        var len = end - start;
        if (len <= 0) continue;
        dst.set(src.subarray(start, end), at);
        at += len;
      }
      // a rounding shortfall leaves digital silence, never a stretched tail
      for (; at < dst.length; at++) dst[at] = 0;
    }
    return out;
  }

  // ---------------------------------------------------------------- formats

  // Most-preferred first. A browser that can only do WebM still gets a file;
  // the page prints whichever one it got instead of promising MP4.
  var CANDIDATES = [
    { mime: 'video/mp4;codecs="avc1.42E01E,mp4a.40.2"', ext: 'mp4', label: 'MP4 · H.264 + AAC' },
    { mime: 'video/mp4;codecs=avc1,mp4a.40.2', ext: 'mp4', label: 'MP4 · H.264 + AAC' },
    { mime: 'video/mp4', ext: 'mp4', label: 'MP4' },
    { mime: 'video/webm;codecs="vp9,opus"', ext: 'webm', label: 'WebM · VP9 + Opus' },
    { mime: 'video/webm;codecs=vp9,opus', ext: 'webm', label: 'WebM · VP9 + Opus' },
    { mime: 'video/webm;codecs="vp8,opus"', ext: 'webm', label: 'WebM · VP8 + Opus' },
    { mime: 'video/webm', ext: 'webm', label: 'WebM' }
  ];

  function pickFormat(Recorder, withAudio) {
    var R = Recorder || (typeof MediaRecorder !== 'undefined' ? MediaRecorder : null);
    if (!R) return null;
    var canCheck = typeof R.isTypeSupported === 'function';
    for (var i = 0; i < CANDIDATES.length; i++) {
      var c = CANDIDATES[i];
      if (withAudio && /webm$|video\/mp4$/.test(c.mime)) continue;  // be explicit about codecs
      if (!canCheck || R.isTypeSupported(c.mime)) {
        return { mime: c.mime, ext: c.ext, label: c.label };
      }
    }
    return null;
  }

  function bitrateFor(width, height, fps) {
    var px = Math.max(1, width * height);
    var bits = px * Math.max(1, fps) * 0.11;              // ~0.11 bits/pixel/frame
    return Math.round(Math.max(2e6, Math.min(80e6, bits)));
  }

  function fitSize(width, height, maxLongEdge) {
    var cap = Number(maxLongEdge) || 3840;
    var w = Math.max(2, Math.round(width || 1920));
    var h = Math.max(2, Math.round(height || 1080));
    var longEdge = Math.max(w, h);
    if (longEdge <= cap) return { width: w, height: h };
    var k = cap / longEdge;
    // encoders want even dimensions
    return { width: Math.max(2, Math.round((w * k) / 2) * 2), height: Math.max(2, Math.round((h * k) / 2) * 2) };
  }

  // ---------------------------------------------------------------- rendering

  function nowMs() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }

  function seekTo(el, timeSec) {
    return new Promise(function (resolve) {
      var landed = function () { resolve(true); };
      el.addEventListener('seeked', landed, { once: true });
      try { el.currentTime = Math.max(0, timeSec); } catch (_e) { resolve(false); }
      setTimeout(landed, 2000);           // a stubborn element must not wedge the render
    });
  }

  /**
   * Cut the clip and hand back a Blob.
   *
   * @param {Object} o
   *   videoEl     the <video> holding the source (required)
   *   ranges      from plan().ranges (required)
   *   audioBuffer decoded source audio, for sample-accurate sound (optional)
   *   audioContext AudioContext to build the spliced buffer in (optional)
   *   fps         output frame rate (default 30)
   *   maxLongEdge cap on the output's long edge (default 3840)
   *   onProgress  ({pct, phase, detail}) => void
   *   cancelled   () => boolean
   * @returns {Promise<{blob, mime, ext, label, seconds, width, height, frames, fps}>}
   */
  async function render(o) {
    var opts = o || {};
    var videoEl = opts.videoEl;
    if (!videoEl) throw new Error('there is no clip loaded to cut');
    var ranges = (opts.ranges || []).filter(function (r) { return r.end - r.start > 0.02; });
    if (!ranges.length) throw new Error('nothing survived the cut — every second was silence');

    var say = opts.onProgress || function () {};
    var stopped = function () { return !!(opts.cancelled && opts.cancelled()); };

    var srcW = videoEl.videoWidth || videoEl.clientWidth || 1920;
    var srcH = videoEl.videoHeight || videoEl.clientHeight || 1080;
    var size = fitSize(srcW, srcH, opts.maxLongEdge);
    var fps = Math.max(1, Math.min(60, Number(opts.fps) || 30));

    var canvas = (opts.canvasFactory || function (w, h) {
      var c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    })(size.width, size.height);
    var ctx = canvas.getContext('2d');

    var Ctx = opts.AudioContextClass
      || (typeof AudioContext !== 'undefined' ? AudioContext : null)
      || (typeof webkitAudioContext !== 'undefined' ? webkitAudioContext : null);

    // Three ways to get sound into the file, best first:
    //   1. a live stream of the element's own audio — exact sync by construction;
    //   2. a decoded buffer spliced around the cuts — sample accurate, but only
    //      possible when the browser can decode the file;
    //   3. none (picture only), said out loud instead of shipping a silent file.
    var actx = null;
    var cutBuffer = null;
    var live = opts.audioStream || null;
    if (!live && opts.audioBuffer && Ctx) {
      say({ pct: 0.02, phase: 'audio', detail: 'Splicing the audio around the cuts…' });
      actx = opts.audioContext || new Ctx();
      cutBuffer = spliceAudio(actx, opts.audioBuffer, ranges, opts.sampleRate);
    }

    var hasAudio = !!(live || cutBuffer);
    var format = pickFormat(opts.MediaRecorderClass, hasAudio);
    if (!format && hasAudio) {
      // a browser that can record picture but not a muxed sound track still
      // gets a file; it just says the sound was dropped
      format = pickFormat(opts.MediaRecorderClass, false);
      if (format) format.droppedAudio = true;
    }
    if (!format) {
      throw new Error('this browser cannot record video (MediaRecorder is unavailable) — use the PNG sequence in the render bay');
    }

    var stream = canvas.captureStream ? canvas.captureStream(fps) : null;
    if (!stream) throw new Error('this browser cannot record a canvas');

    var dest = null;
    var gain = null;
    if (live && !format.droppedAudio) {
      var liveTracks = live.getAudioTracks ? live.getAudioTracks() : [];
      liveTracks.forEach(function (t) { if (t) stream.addTrack(t); });
      hasAudio = stream.getAudioTracks().length > 0;
    }
    if (cutBuffer && actx && !format.droppedAudio) {
      dest = actx.createMediaStreamDestination();
      gain = actx.createGain();
      gain.gain.value = 1;
      gain.connect(dest);
      cutBuffer.__dest = dest;                    // for the test seam / debugging
      stream.addTrack(dest.stream.getAudioTracks()[0]);
    }

    var Recorder = opts.MediaRecorderClass
      || (typeof MediaRecorder !== 'undefined' ? MediaRecorder : null);
    var chunks = [];
    var rec = new Recorder(stream, {
      mimeType: format.mime,
      videoBitsPerSecond: bitrateFor(size.width, size.height, fps),
      audioBitsPerSecond: 160000
    });
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    var stoppedRecorder = new Promise(function (resolve) { rec.onstop = resolve; });

    // MediaRecorder.pause() is what makes this exact: a seek that takes 400 ms
    // records nothing at all, so the file is the cut and not the cut plus a
    // freeze-frame. If the browser lacks it, recording simply keeps running and
    // the render is still correct, just less tidy at the joins.
    var canPause = typeof rec.pause === 'function' && typeof rec.resume === 'function';
    var paused = false;
    var pauseRec = function () {
      if (!canPause || paused) return;
      try { rec.pause(); paused = true; } catch (_e) { canPause = false; }
    };
    var resumeRec = function () {
      if (!canPause || !paused) return;
      try { rec.resume(); paused = false; } catch (_e) { canPause = false; }
    };

    var drewAny = false;
    var drawNow = function () {
      try {
        ctx.drawImage(videoEl, 0, 0, size.width, size.height);
        drewAny = true;
      } catch (_e) { /* frame not decodable yet */ }
    };

    var totalSec = ranges.reduce(function (a, r) { return a + (r.end - r.start); }, 0);
    var played = 0;          // seconds of the cut finished
    var frames = 0;
    var rafStop = true;
    var looping = false;     // exactly one draw loop, however many slices there are
    var activeLoops = 0;     // reported, so a check can prove it never doubles
    var maxLoops = 0;
    var tick = function () {
      if (rafStop) { looping = false; activeLoops = 0; return; }
      drawNow();
      frames++;
      var pct = totalSec > 0 ? Math.min(0.99, played / totalSec) : 0;
      say({
        pct: 0.06 + pct * 0.92,
        phase: 'recording',
        detail: 'Cutting ' + played.toFixed(1) + 's of ' + totalSec.toFixed(1) + 's'
      });
      requestAnimationFrame(tick);
    };
    var startLoop = function () {
      rafStop = false;
      if (looping) return;
      looping = true;
      activeLoops++;
      maxLoops = Math.max(maxLoops, activeLoops);
      requestAnimationFrame(tick);
    };

    var wasMuted = videoEl.muted;
    var wasAt = videoEl.currentTime;
    var wasPlaying = !videoEl.paused;
    var wasLoop = videoEl.loop;
    videoEl.loop = false;          // a loop would restart mid-slice and hang the render
    if (!live) videoEl.muted = true;   // picture only: the sound comes from the buffer, if any

    try {
      rec.start();
      if (videoEl.pause) videoEl.pause();
      for (var i = 0; i < ranges.length; i++) {
        if (stopped()) break;
        var r = ranges[i];
        pauseRec();
        await seekTo(videoEl, r.start);
        drawNow();

        var src = null;
        if (cutBuffer && actx) {
          src = actx.createBufferSource();
          src.buffer = cutBuffer;
          src.connect(gain);
          // start exactly where this slice begins inside the spliced buffer
          var offset = 0;
          for (var k = 0; k < i; k++) offset += ranges[k].end - ranges[k].start;
          if (src.start) src.start(actx.currentTime + 0.03, offset, (r.end - r.start));
        }
        resumeRec();
        startLoop();
        var playing = videoEl.play ? videoEl.play() : null;
        var blocked = false;
        if (playing && playing.catch) {
          playing.catch(function (err) {
            blocked = true;
            opts.__playError = err && err.message ? err.message : 'playback was blocked';
          });
        }

        // play this slice out, then stop it dead at the out-point
        var doneBefore = played;
        await new Promise(function (resolve) {
          var startWall = nowMs();
          var poll = function () {
            var nowT = videoEl.currentTime;
            played = doneBefore + Math.max(0, Math.min(r.end - r.start, nowT - r.start));
            if (stopped() || videoEl.ended || nowT >= r.end - 0.01) return resolve();
            if (blocked) return resolve();
            if ((nowMs() - startWall) / 1000 > (r.end - r.start) + 2) return resolve(); // element stuck
            setTimeout(poll, 25);
          };
          setTimeout(poll, 25);
        });

        if (videoEl.pause) videoEl.pause();
        if (src && src.stop) { try { src.stop(); } catch (_e) { } }
        played = doneBefore + (r.end - r.start);
      }

      rafStop = true;
      if (opts.__playError) {
        throw new Error('this browser would not start the clip playing (' + opts.__playError
          + ') — click once on the page, then press Render again');
      }
      // give the encoder the last frame before closing the file
      await new Promise(function (res) { setTimeout(res, 120); });
      rec.stop();
      await stoppedRecorder;
    } catch (err) {
      rafStop = true;
      try { if (rec.state !== 'inactive') rec.stop(); } catch (_e) { }
      throw err;
    } finally {
      rafStop = true;
      videoEl.loop = wasLoop;
      videoEl.muted = wasMuted;
      try { videoEl.currentTime = wasAt; } catch (_e) { }
      if (wasPlaying && videoEl.play) { var p2 = videoEl.play(); if (p2 && p2.catch) p2.catch(function () { }); }
      stream.getTracks().forEach(function (t) { try { t.stop(); } catch (_e) { } });
      if (actx && opts.audioContext !== actx) { try { actx.close(); } catch (_e) { } }
    }

    var blob = new Blob(chunks, { type: format.mime.split(';')[0] });
    if (!blob.size) throw new Error('the recorder produced no data — try again, or use the PNG sequence');
    say({ pct: 1, phase: 'done', detail: 'Cut written — ' + (blob.size / 1048576).toFixed(1) + ' MB' });
    return {
      blob: blob,
      mime: format.mime,
      ext: format.ext,
      label: format.label,
      seconds: +totalSec.toFixed(3),
      width: size.width,
      height: size.height,
      fps: fps,
      frames: frames,
      drewFrames: drewAny,
      maxLoops: maxLoops,
      audio: !!(hasAudio && !format.droppedAudio),
      droppedAudio: !!format.droppedAudio
    };
  }

  return {
    VERSION: VERSION,
    DEFAULT_MIN_SLICE: DEFAULT_MIN_SLICE,
    plan: plan,
    planSummary: planSummary,
    toSource: toSource,
    toOutput: toOutput,
    spliceAudio: spliceAudio,
    pickFormat: pickFormat,
    bitrateFor: bitrateFor,
    fitSize: fitSize,
    CANDIDATES: CANDIDATES,
    render: render
  };
});
