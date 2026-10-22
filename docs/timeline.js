/* ============================================================================
 * PulseVFX — EDITABLE TIMELINE MODEL
 * ----------------------------------------------------------------------------
 * A clip here is a window onto source media:
 *
 *   startSec    where it begins on the timeline
 *   srcIn       first frame of the source that plays
 *   srcOut      last frame of the source that plays
 *   srcDur      how long the whole source is (the hard limit on extending)
 *
 * so length = srcOut - srcIn, and dragging the left edge changes srcIn *and*
 * startSec together — which is what makes a trim show a different part of the
 * footage instead of just sliding a box around.
 *
 * Everything is seconds, everything is pure, and every operation returns what it
 * actually applied, because a drag must be able to stop at the source's end
 * rather than lie about where the pointer is.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TIMELINE = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';
  var MIN_LEN = 0.10;          // a clip shorter than 4 frames is not a clip

  function num(v, dflt) {
    var n = Number(v);
    return isFinite(n) ? n : dflt;
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  /** Normalise a clip: fill the gaps, then make the window sane. */
  function makeClip(o) {
    var srcIn = Math.max(0, num(o.srcIn, 0));
    var srcDur = num(o.srcDur, 0);
    var srcOut = num(o.srcOut, srcDur > 0 ? srcDur : srcIn + 1);
    if (srcDur > 0) srcOut = Math.min(srcOut, srcDur);
    if (srcOut - srcIn < MIN_LEN) srcOut = srcIn + MIN_LEN;
    return {
      id: String(o.id || ('c' + Math.random().toString(36).slice(2, 8))),
      track: o.track || 'V1',
      name: o.name || 'Clip',
      startSec: Math.max(0, num(o.startSec, 0)),
      srcIn: srcIn,
      srcOut: srcOut,
      srcDur: srcDur,
      mediaKey: o.mediaKey || '',
      color: o.color || ''
    };
  }

  function len(c) {
    return Math.max(0, c.srcOut - c.srcIn);
  }

  function endOf(c) {
    return c.startSec + len(c);
  }

  function duration(clips) {
    return (clips || []).reduce(function (m, c) { return Math.max(m, endOf(c)); }, 0);
  }

  function byStart(a, b) {
    return a.startSec - b.startSec;
  }

  /** Sorted by timeline position. Unknown ids are dropped, never guessed. */
  function normalise(clips) {
    return (clips || [])
      .filter(function (c) { return c && c.id; })
      .map(function (c) { return makeClip(c); })
      .sort(byStart);
  }

  /** The clip under a moment, or null. Later clips win when two overlap. */
  function clipAt(clips, t) {
    var found = null;
    (clips || []).forEach(function (c) {
      if (t >= c.startSec && t < endOf(c)) found = c;
    });
    return found;
  }

  /**
   * Timeline time → source time. This is the mapping the monitor uses, so a
   * trim is visible in the picture, not just in a box.
   */
  function sourceAt(clips, t) {
    var c = clipAt(clips, t);
    if (!c) return null;
    return { clip: c, sourceSec: c.srcIn + (t - c.startSec) };
  }

  /** Where a source moment lives on the timeline, if anywhere. */
  function timelineAt(clips, sourceSec) {
    var found = null;
    (clips || []).forEach(function (c) {
      if (sourceSec >= c.srcIn && sourceSec < c.srcOut) {
        found = c.startSec + (sourceSec - c.srcIn);
      }
    });
    return found;
  }

  function find(clips, id) {
    for (var i = 0; i < (clips || []).length; i++) if (clips[i].id === id) return clips[i];
    return null;
  }

  // ------------------------------------------------------------ editing ops
  // Each op returns { clips, clip, applied } — `applied` is the change that
  // really happened after clamping, so a drag can stay under the pointer.

  /** Drag the left edge by `delta` seconds (+ later, − earlier). */
  function trimIn(clips, id, delta) {
    var c = find(clips, id);
    if (!c) return { clips: clips, clip: null, applied: 0 };
    var d = num(delta, 0);
    // can't expose before the source starts, can't shrink below MIN_LEN
    var lo = -c.srcIn;
    var hi = len(c) - MIN_LEN;
    var applied = clamp(d, lo, Math.max(lo, hi));
    var next = makeClip(Object.assign({}, c, {
      startSec: Math.max(0, c.startSec + applied),
      srcIn: c.srcIn + applied
    }));
    // a start clamped at 0 means the edge could not move that far
    var real = next.startSec - c.startSec;
    if (real !== applied) {
      next = makeClip(Object.assign({}, c, { startSec: c.startSec, srcIn: c.srcIn }));
      applied = 0;
    }
    return replace(clips, next, applied);
  }

  /** Drag the right edge by `delta` seconds (+ longer, − shorter). */
  function trimOut(clips, id, delta) {
    var c = find(clips, id);
    if (!c) return { clips: clips, clip: null, applied: 0 };
    var d = num(delta, 0);
    var hi = (c.srcDur > 0 ? c.srcDur : Infinity) - c.srcOut;
    var lo = -(len(c) - MIN_LEN);
    var applied = clamp(d, lo, hi);
    var next = makeClip(Object.assign({}, c, { srcOut: c.srcOut + applied }));
    var real = len(next) - len(c);
    if (Math.abs(real - applied) > 1e-6) applied = real;
    return replace(clips, next, applied);
  }

  /** Slide the whole clip along the timeline. It keeps its window on the source. */
  function move(clips, id, delta) {
    var c = find(clips, id);
    if (!c) return { clips: clips, clip: null, applied: 0 };
    var applied = clamp(num(delta, 0), -c.startSec, Infinity);
    var next = makeClip(Object.assign({}, c, { startSec: Math.max(0, c.startSec + applied) }));
    return replace(clips, next, applied);
  }

  /** Cut a clip in two at a timeline moment. Returns one clip if the cut misses. */
  function splitAt(clips, id, t) {
    var c = find(clips, id);
    if (!c || t <= c.startSec + MIN_LEN || t >= endOf(c) - MIN_LEN) {
      return { clips: clips, clip: null, applied: 0, made: [] };
    }
    var cutSrc = c.srcIn + (t - c.startSec);
    var a = makeClip(Object.assign({}, c, { srcOut: cutSrc }));
    var b = makeClip(Object.assign({}, c, {
      id: c.id + '_b' + Math.random().toString(36).slice(2, 6),
      startSec: t,
      srcIn: cutSrc
    }));
    var out = (clips || []).filter(function (x) { return x.id !== c.id; }).concat([a, b]).sort(byStart);
    return { clips: out, clip: a, applied: 0, made: [a, b] };
  }

  function remove(clips, id) {
    return (clips || []).filter(function (c) { return c.id !== id; });
  }

  function replace(clips, next, applied) {
    var out = (clips || []).map(function (c) { return c.id === next.id ? next : c; }).sort(byStart);
    return { clips: out, clip: next, applied: applied };
  }

  // -------------------------------------------------------------- snapping
  /** Every edge a drag can lock onto: the other clips, the playhead, zero. */
  function snapTargets(clips, exceptId, extra) {
    var t = [0];
    (clips || []).forEach(function (c) {
      if (c.id === exceptId) return;
      t.push(c.startSec, endOf(c));
    });
    (extra || []).forEach(function (v) { if (isFinite(v)) t.push(v); });
    return t;
  }

  /** The nearest target within tolerance, else the value unchanged. */
  function snap(value, targets, toleranceSec) {
    var best = value;
    var bestD = Math.abs(toleranceSec);
    (targets || []).forEach(function (t) {
      var d = Math.abs(value - t);
      if (d <= bestD) { bestD = d; best = t; }
    });
    return best;
  }

  // ------------------------------------------------------------- geometry
  function spanFor(clips, minSpan) {
    return Math.max(num(minSpan, 3), duration(clips) * 1.02);
  }

  function timeToX(t, spanSec, widthPx) {
    if (!(widthPx > 0) || !(spanSec > 0)) return 0;
    return clamp((t / spanSec) * widthPx, 0, widthPx);
  }

  function xToTime(x, spanSec, widthPx) {
    if (!(widthPx > 0) || !(spanSec > 0)) return 0;
    return clamp((x / widthPx) * spanSec, 0, spanSec);
  }

  function formatTime(sec) {
    var s = Math.max(0, num(sec, 0));
    var m = Math.floor(s / 60);
    var r = s - m * 60;
    return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1);
  }

  function formatLen(sec) {
    var s = Math.max(0, num(sec, 0));
    if (s < 10) return s.toFixed(2) + 's';
    if (s < 60) return s.toFixed(1) + 's';
    return formatTime(s);
  }

  return {
    VERSION: VERSION,
    MIN_LEN: MIN_LEN,
    makeClip: makeClip,
    len: len,
    endOf: endOf,
    duration: duration,
    normalise: normalise,
    clipAt: clipAt,
    sourceAt: sourceAt,
    timelineAt: timelineAt,
    find: find,
    trimIn: trimIn,
    trimOut: trimOut,
    move: move,
    splitAt: splitAt,
    remove: remove,
    snapTargets: snapTargets,
    snap: snap,
    spanFor: spanFor,
    timeToX: timeToX,
    xToTime: xToTime,
    formatTime: formatTime,
    formatLen: formatLen
  };
});
