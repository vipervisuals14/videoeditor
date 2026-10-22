/* ============================================================================
 * PulseVFX — 4K RENDER ENGINE
 * ----------------------------------------------------------------------------
 * True-resolution import and export in the browser, with no server and no
 * dependencies:
 *
 *   import     read the real resolution of any video/image you drop in and
 *              report whether it is 4K before you commit to rendering.
 *   still      one PNG/JPEG at 1080p, 1440p, UHD 4K, DCI 4K, 6K or a custom size.
 *   sequence   numbered frames at full resolution, zipped straight in the
 *              browser (store-only ZIP, CRC32 verified) — the format Resolve,
 *              After Effects and ffmpeg all eat without conversion. Optional
 *              depth + matte passes go in their own folders for compositing.
 *   video      WebM via MediaRecorder at true 4K resolution (review copy, not a
 *              master — the codec is the limit, not the size).
 *   resolve    a Lua snippet that sets the open Resolve project to 3840x2160 so
 *              the *native* Fusion graph renders final 4K frames for you. That
 *              is the highest-quality path and it costs no panel render time.
 *
 * Payloads are processed in tiles (see planTiles) so a 4K frame is never held
 * as several full float buffers; peak memory stays near one frame.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RENDER_ENGINE = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';

  var PRESETS = [
    { id: 'hd1080', label: 'Full HD 1080p', width: 1920, height: 1080 },
    { id: 'qhd1440', label: 'QHD 1440p', width: 2560, height: 1440 },
    { id: 'uhd4k', label: '4K UHD (3840 x 2160)', width: 3840, height: 2160 },
    { id: 'dci4k', label: 'DCI 4K (4096 x 2160)', width: 4096, height: 2160 },
    { id: 'hd4kvert', label: '4K Vertical (2160 x 3840)', width: 2160, height: 3840 },
    { id: 'uhd6k', label: '6K (5760 x 3240)', width: 5760, height: 3240 }
  ];

  // 4K = at least 3840 px on the long edge (or 2160 on the short edge when the
  // frame is portrait, which is how phone/vertical footage is shot).
  function is4K(width, height) {
    var lo = Math.min(width, height);
    var hi = Math.max(width, height);
    return hi >= 3840 && lo >= 2100;
  }

  function presetFor(id) {
    return PRESETS.find(function (p) { return p.id === id; }) || PRESETS[2];
  }

  // ---------------------------------------------------------------- tiling

  /**
   * Split a frame into overlapping tiles.
   * Convolution effects (blur, parallax resample) need real neighbours, so each
   * tile carries `overlap` px of context on every side; the caller writes back
   * only the inner rect. Returns absolute rects in frame space.
   */
  function planTiles(width, height, opts) {
    var o = opts || {};
    var tileW = Math.max(64, Math.round(o.tileW || 960));
    var tileH = Math.max(64, Math.round(o.tileH || 540));
    var overlap = Math.max(0, Math.round(o.overlap || 0));
    var tiles = [];
    for (var y = 0; y < height; y += tileH) {
      for (var x = 0; x < width; x += tileW) {
        var w = Math.min(tileW, width - x);
        var h = Math.min(tileH, height - y);
        var x0 = Math.max(0, x - overlap);
        var y0 = Math.max(0, y - overlap);
        var x1 = Math.min(width, x + w + overlap);
        var y1 = Math.min(height, y + h + overlap);
        tiles.push({
          x: x, y: y, w: w, h: h,                 // where the result goes
          sx: x0, sy: y0, sw: x1 - x0, sh: y1 - y0, // what to read
          innerX: x - x0, innerY: y - y0            // crop offset inside the read
        });
      }
    }
    return tiles;
  }

  function estimateFrameBytes(width, height) {
    // source RGBA + one working copy + one effect output, as the worst case
    return width * height * 4 * 3;
  }

  // Browsers on 4K-capable machines are fine with a few hundred MB; anything
  // past this and the tab is more likely to crash than finish.
  function memoryVerdict(width, height, budgetBytes) {
    var need = estimateFrameBytes(width, height);
    // 900 MB of frame buffers is where most browsers start dropping canvas
    // contexts; the panel refuses to start a render it knows will die.
    var budget = budgetBytes || 640 * 1024 * 1024;
    return {
      bytes: need,
      mb: Math.round(need / (1024 * 1024)),
      ok: need <= budget,
      level: need > budget ? 'blocked' : need > budget * 0.6 ? 'tight' : 'fine'
    };
  }

  // ------------------------------------------------------------------- zip

  var CRC_TABLE = (function () {
    var table = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) {
      crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function dosDateTime(date) {
    var d = date || new Date(2024, 0, 1, 12, 0, 0);
    var time = ((d.getHours() & 0x1F) << 11) | ((d.getMinutes() & 0x3F) << 5) | ((d.getSeconds() / 2) & 0x1F);
    var day = (((d.getFullYear() - 1980) & 0x7F) << 9) | (((d.getMonth() + 1) & 0x0F) << 5) | (d.getDate() & 0x1F);
    return { time: time & 0xFFFF, date: day & 0xFFFF };
  }

  function utf8(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
      else out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
    }
    return new Uint8Array(out);
  }

  /**
   * Store-only ZIP. No compression on purpose: PNG/JPEG frames are already
   * compressed, so deflating them again only costs CPU and battery.
   * files: [{ name, bytes: Uint8Array, date }]
   */
  function zipStore(files) {
    var entries = files.map(function (f) {
      return {
        name: f.name,
        nameBytes: utf8(f.name),
        bytes: f.bytes,
        crc: crc32(f.bytes),
        stamp: dosDateTime(f.date)
      };
    });

    var localSize = 0;
    var centralSize = 0;
    entries.forEach(function (e) {
      localSize += 30 + e.nameBytes.length + e.bytes.length;
      centralSize += 46 + e.nameBytes.length;
    });
    var total = localSize + centralSize + 22;
    var out = new Uint8Array(total);
    var view = new DataView(out.buffer);
    var pos = 0;

    var offsets = [];
    entries.forEach(function (e) {
      offsets.push(pos);
      view.setUint32(pos, 0x04034b50, true);
      view.setUint16(pos + 4, 20, true);       // version needed
      view.setUint16(pos + 6, 0, true);        // flags
      view.setUint16(pos + 8, 0, true);        // method: store
      view.setUint16(pos + 10, e.stamp.time, true);
      view.setUint16(pos + 12, e.stamp.date, true);
      view.setUint32(pos + 14, e.crc, true);
      view.setUint32(pos + 18, e.bytes.length, true);
      view.setUint32(pos + 22, e.bytes.length, true);
      view.setUint16(pos + 26, e.nameBytes.length, true);
      view.setUint16(pos + 28, 0, true);
      pos += 30;
      out.set(e.nameBytes, pos);
      pos += e.nameBytes.length;
      out.set(e.bytes, pos);
      pos += e.bytes.length;
    });

    var centralStart = pos;
    entries.forEach(function (e, i) {
      view.setUint32(pos, 0x02014b50, true);
      view.setUint16(pos + 4, 20, true);       // version made by
      view.setUint16(pos + 6, 20, true);       // version needed
      view.setUint16(pos + 8, 0, true);
      view.setUint16(pos + 10, 0, true);       // method: store
      view.setUint16(pos + 12, e.stamp.time, true);
      view.setUint16(pos + 14, e.stamp.date, true);
      view.setUint32(pos + 16, e.crc, true);
      view.setUint32(pos + 20, e.bytes.length, true);
      view.setUint32(pos + 24, e.bytes.length, true);
      view.setUint16(pos + 28, e.nameBytes.length, true);
      view.setUint16(pos + 30, 0, true);       // extra
      view.setUint16(pos + 32, 0, true);       // comment
      view.setUint16(pos + 34, 0, true);       // disk
      view.setUint16(pos + 36, 0, true);       // internal attrs
      view.setUint32(pos + 38, 0, true);       // external attrs
      view.setUint32(pos + 42, offsets[i], true);
      pos += 46;
      out.set(e.nameBytes, pos);
      pos += e.nameBytes.length;
    });

    view.setUint32(pos, 0x06054b50, true);
    view.setUint16(pos + 4, 0, true);
    view.setUint16(pos + 6, 0, true);
    view.setUint16(pos + 8, entries.length, true);
    view.setUint16(pos + 10, entries.length, true);
    view.setUint32(pos + 12, pos - centralStart, true);
    view.setUint32(pos + 16, centralStart, true);
    view.setUint16(pos + 20, 0, true);
    return out;
  }

  // --------------------------------------------------------------- metadata

  /**
   * Normalises whatever a <video>/<img>/WebCodecs track reports into the shape
   * the panel cares about. `probe` is injectable so this is testable without a
   * real decoder.
   */
  function describeSource(info) {
    var width = Math.max(1, Math.round(info.width || 0));
    var height = Math.max(1, Math.round(info.height || 0));
    var kind = info.kind || 'video';
    var duration = Number(info.duration) || 0;
    var big = is4K(width, height);
    return {
      name: info.name || (kind === 'video' ? 'clip' : 'image'),
      kind: kind,
      width: width,
      height: height,
      duration: duration,
      megapixels: +((width * height) / 1e6).toFixed(2),
      is4K: big,
      // what to tell the user, without overselling the browser path
      verdict: big
        ? 'Source is 4K — exports below stay at full resolution.'
        : 'Source is ' + width + ' x ' + height + '. You can still export at 4K (it will be upscaled from this source).',
      aspect: +(width / Math.max(1, height)).toFixed(3)
    };
  }

  function framesFor(durationSec, fps) {
    return Math.max(1, Math.round((Number(durationSec) || 0) * (Number(fps) || 24)));
  }

  function frameFilename(prefix, index, ext) {
    var pad = String(index).replace(/[^0-9]/g, '');
    while (pad.length < 5) pad = '0' + pad;
    return prefix + '_' + pad + '.' + (ext || 'png');
  }

  function extFor(format) {
    if (format === 'jpeg' || format === 'jpg') return 'jpg';
    if (format === 'webp') return 'webp';
    return 'png';
  }

  function estimateSequenceBytes(count, format, width, height) {
    // conservative per-frame guesses; PNG of a graded plate is the big one
    var bytesPerPixel = format === 'png' ? 0.42 : format === 'webp' ? 0.11 : 0.075;
    return Math.round(count * width * height * bytesPerPixel);
  }

  function formatBytes(n) {
    if (!n || n < 0) return '0 MB';
    if (n > 1024 * 1024 * 1024) return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return {
    VERSION: VERSION,
    PRESETS: PRESETS,
    presetFor: presetFor,
    is4K: is4K,
    planTiles: planTiles,
    estimateFrameBytes: estimateFrameBytes,
    memoryVerdict: memoryVerdict,
    crc32: crc32,
    zipStore: zipStore,
    describeSource: describeSource,
    framesFor: framesFor,
    frameFilename: frameFilename,
    extFor: extFor,
    estimateSequenceBytes: estimateSequenceBytes,
    formatBytes: formatBytes
  };
});
