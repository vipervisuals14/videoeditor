/* ============================================================================
 * PulseVFX — DEPTH ENGINE
 * ----------------------------------------------------------------------------
 * Two jobs, both done on the CPU so they work in any browser with no model
 * download, no WebGL2 requirement and no server:
 *
 *   1. estimate()  builds a plausible depth map from a single plate using the
 *                  cues a colourist actually reads: haze, vertical position,
 *                  local detail (defocus), saturation — then edge-aware
 *                  smoothing, and finally your Magic Mask as a hard "subject is
 *                  near" constraint. If you have a real depth map (iPhone LiDAR,
 *                  Depth Anything, MiDaS, Resolve's own Depth Map export), load
 *                  it instead and every effect becomes production-accurate.
 *
 *   2. apply()     runs the depth-driven effect stack on an RGBA buffer:
 *                  depth of field, tilt-shift, atmosphere, depth grade,
 *                  parallax, anaglyph, slices, relight, contours, point cloud,
 *                  echo. Each effect takes an intensity 0..1 and they compose.
 *
 * Depth value convention: 0.0 = closest to camera, 1.0 = furthest away.
 * Everything is pure functions over typed arrays so it is unit-testable
 * without a canvas.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DEPTH_ENGINE = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';

  // The effect rack, in the order the panel lists it. `tool` is the native
  // Fusion node the Lua exporter reaches for.
  var EFFECTS = [
    { id: 'dof', label: 'Depth of Field', tool: 'Defocus',
      desc: 'Real lens blur that grows with distance from the focus plane — the thing that makes a 2D plate read as 3D.' },
    { id: 'tilt', label: 'Tilt-Shift Miniature', tool: 'Defocus',
      desc: 'A narrow sharp band with soft depth falloff — miniature / architectural look without the fake blur.' },
    { id: 'haze', label: 'Depth Atmosphere', tool: 'Fog',
      desc: 'Distance fog with a height falloff. Replaces flat haze with air that actually sits between the layers.' },
    { id: 'grade', label: 'Depth Grade', tool: 'ColorCorrector',
      desc: 'Near/far split grade: cooler, desaturated distance and richer foreground, like real aerial perspective.' },
    { id: 'parallax', label: 'Depth Parallax Push', tool: 'Displace',
      desc: '2.5D camera move — every depth layer slides a different amount, so a locked-off shot gains a camera.' },
    { id: 'relight', label: 'Depth Relight', tool: 'SoftGlow',
      desc: 'A raking light computed from the depth surface. Catches geometry edges instead of smearing a glow.' },
    { id: 'slices', label: 'Depth Slice Offset', tool: 'Displace',
      desc: 'Quantised depth bands offset sideways — printed-data slab look, not a glitch filter.' },
    { id: 'contours', label: 'Depth Contours', tool: 'Bitmap',
      desc: 'Topographic contour lines from the depth surface. Reads as technical print, survives 4K.' },
    { id: 'pointcloud', label: 'Depth Point Cloud', tool: 'Bitmap',
      desc: 'Depth-scaled stipple dots on black. The monochrome print-data family, driven by real depth.' },
    { id: 'anaglyph', label: 'Stereo Anaglyph', tool: 'Merge',
      desc: 'Red/cyan stereo preview built from depth parallax. Check your depth before you commit.' },
    { id: 'echo', label: 'Depth Echo', tool: 'Trails',
      desc: 'Depth-weighted ghost copies — editorial motion echo that respects which layer is in front.' }
  ];

  // ------------------------------------------------------------------ helpers

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function lumaAt(data, i) {
    return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  }

  // Separable box blur with running window sums: O(n) instead of O(n*r), which
  // is what keeps a three-layer depth-of-field pass inside one frame budget.
  function boxBlurRGB(src, w, h, radius) {
    var r = Math.max(0, Math.round(radius));
    if (!r) {
      var copy = new Float32Array(w * h * 3);
      for (var q = 0, n0 = w * h; q < n0; q++) {
        copy[q * 3] = src[q * 4];
        copy[q * 3 + 1] = src[q * 4 + 1];
        copy[q * 3 + 2] = src[q * 4 + 2];
      }
      return copy;
    }
    var span = r * 2 + 1;
    var tmp = new Float32Array(w * h * 3);
    var out = new Float32Array(w * h * 3);
    var x, y, k, p, s0, s1, s2;
    for (y = 0; y < h; y++) {
      var row = y * w;
      s0 = s1 = s2 = 0;
      for (k = -r; k <= r; k++) {
        p = (row + clamp(k, 0, w - 1)) * 4;
        s0 += src[p]; s1 += src[p + 1]; s2 += src[p + 2];
      }
      for (x = 0; x < w; x++) {
        p = (row + x) * 3;
        tmp[p] = s0 / span;
        tmp[p + 1] = s1 / span;
        tmp[p + 2] = s2 / span;
        var outIdx = (row + clamp(x - r, 0, w - 1)) * 4;
        var inIdx = (row + clamp(x + r + 1, 0, w - 1)) * 4;
        s0 += src[inIdx] - src[outIdx];
        s1 += src[inIdx + 1] - src[outIdx + 1];
        s2 += src[inIdx + 2] - src[outIdx + 2];
      }
    }
    for (x = 0; x < w; x++) {
      s0 = s1 = s2 = 0;
      for (k = -r; k <= r; k++) {
        p = (clamp(k, 0, h - 1) * w + x) * 3;
        s0 += tmp[p]; s1 += tmp[p + 1]; s2 += tmp[p + 2];
      }
      for (y = 0; y < h; y++) {
        p = (y * w + x) * 3;
        out[p] = s0 / span;
        out[p + 1] = s1 / span;
        out[p + 2] = s2 / span;
        var o2 = (clamp(y - r, 0, h - 1) * w + x) * 3;
        var i2 = (clamp(y + r + 1, 0, h - 1) * w + x) * 3;
        s0 += tmp[i2] - tmp[o2];
        s1 += tmp[i2 + 1] - tmp[o2 + 1];
        s2 += tmp[i2 + 2] - tmp[o2 + 2];
      }
    }
    return out;
  }

  function blitRGB(src, w, h, target) {
    for (var i = 0, n = w * h; i < n; i++) {
      var p = i * 4;
      var q = i * 3;
      target[p] = src[q];
      target[p + 1] = src[q + 1];
      target[p + 2] = src[q + 2];
      target[p + 3] = 255;
    }
    return target;
  }

  // Joint bilateral pass guided by luma: smooths the depth estimate inside a
  // surface but keeps the step at a real edge.
  function guidedSmooth(depth, luma, w, h, radius, sigma) {
    var out = new Float32Array(depth.length);
    var inv = 1 / (2 * sigma * sigma);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = y * w + x;
        var base = depth[i];
        var ref = luma[i];
        var acc = 0;
        var wsum = 0;
        for (var dy = -radius; dy <= radius; dy++) {
          var yy = y + dy;
          if (yy < 0 || yy >= h) continue;
          for (var dx = -radius; dx <= radius; dx++) {
            var xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            var j = yy * w + xx;
            var dl = luma[j] - ref;
            var weight = Math.exp(-dl * dl * inv);
            acc += depth[j] * weight;
            wsum += weight;
          }
        }
        out[i] = wsum > 0 ? acc / wsum : base;
      }
    }
    return out;
  }

  function percentileStretch(depth, loPct, hiPct) {
    var n = depth.length;
    var sorted = Float32Array.from(depth);
    sorted.sort();
    var lo = sorted[clamp(Math.floor(n * loPct), 0, n - 1)];
    var hi = sorted[clamp(Math.floor(n * hiPct), 0, n - 1)];
    var span = hi - lo;
    var out = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      out[i] = span > 1e-5 ? clamp01((depth[i] - lo) / span) : 0.5;
    }
    return out;
  }

  // Pull a sub-rectangle of a depth map at an arbitrary size. Used by the 4K
  // renderer, which processes frames tile by tile so a 3840x2160 frame never
  // needs a full 33 MB float buffer per pass.
  function sampleDepthRect(depth, mw, mh, x0, y0, rw, rh, frameW, frameH) {
    var fw = Math.max(1, frameW || mw);
    var fh = Math.max(1, frameH || mh);
    var out = new Float32Array(rw * rh);
    for (var y = 0; y < rh; y++) {
      var ny = (y0 + y) / Math.max(1, fh - 1);
      var sy = clamp(Math.round(ny * (mh - 1)), 0, mh - 1);
      for (var x = 0; x < rw; x++) {
        var nx = (x0 + x) / Math.max(1, fw - 1);
        var sx = clamp(Math.round(nx * (mw - 1)), 0, mw - 1);
        out[y * rw + x] = depth[sy * mw + sx];
      }
    }
    return out;
  }

  function resizeDepth(depth, sw, sh, dw, dh) {
    var out = new Float32Array(dw * dh);
    for (var y = 0; y < dh; y++) {
      var sy = clamp(Math.round((y / Math.max(1, dh - 1)) * (sh - 1)), 0, sh - 1);
      for (var x = 0; x < dw; x++) {
        var sx = clamp(Math.round((x / Math.max(1, dw - 1)) * (sw - 1)), 0, sw - 1);
        out[y * dw + x] = depth[sy * sw + sx];
      }
    }
    return out;
  }

  // --------------------------------------------------------------- estimation

  /**
   * estimate(img, opts)
   *   img  : { data: RGBA, width, height }
   *   opts : { smooth=2, contrast=50, nearBias=50, mask, maskW, maskH, invert }
   * returns Float32Array(w*h) of depth 0 (near) .. 1 (far)
   */
  function estimate(img, opts) {
    var o = opts || {};
    var w = img.width;
    var h = img.height;
    var data = img.data;
    var n = w * h;

    var luma = new Float32Array(n);
    var sat = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var p = i * 4;
      var r = data[p];
      var g = data[p + 1];
      var b = data[p + 2];
      luma[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      var mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
      var mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
      sat[i] = mx > 0 ? (mx - mn) / mx : 0;
    }

    // Local energy in a 5x5 window. Haze eats high-frequency detail, so a flat
    // area is only "far" when its whole neighbourhood is flat — a subject's
    // smooth cheek next to a sharp outline still reads as sharp.
    var detail = new Float32Array(n);
    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        var idx = y * w + x;
        var gx = luma[idx + 1] - luma[idx - 1];
        var gy = luma[idx + w] - luma[idx - w];
        detail[idx] = Math.sqrt(gx * gx + gy * gy);
      }
    }
    var energy = new Float32Array(n);
    for (var yb = 0; yb < h; yb++) {
      for (var xb = 0; xb < w; xb++) {
        var best = 0;
        for (var wy = -2; wy <= 2; wy++) {
          var yy = yb + wy;
          if (yy < 0 || yy >= h) continue;
          for (var wx = -2; wx <= 2; wx++) {
            var xx = xb + wx;
            if (xx < 0 || xx >= w) continue;
            var d2 = detail[yy * w + xx];
            if (d2 > best) best = d2;
          }
        }
        energy[yb * w + xb] = best;
      }
    }

    // normalise detail to 0..1 using the 95th percentile so one hot edge
    // cannot flatten the whole map
    var sortedDetail = Float32Array.from(energy);
    sortedDetail.sort();
    var dMax = Math.max(1, sortedDetail[Math.floor(n * 0.95)]);

    var nearBias = clamp01((o.nearBias === undefined ? 50 : o.nearBias) / 100);
    var base = new Float32Array(n);
    for (var y2 = 0; y2 < h; y2++) {
      var yn = h > 1 ? y2 / (h - 1) : 1;
      for (var x2 = 0; x2 < w; x2++) {
        var j = y2 * w + x2;
        var detailN = clamp01(energy[j] / dMax);
        var satN = clamp01(sat[j] * 2.2);
        var lumaN = clamp01(luma[j] / 255);
        // Aerial perspective, the cues a colourist actually reads:
        //   ground low in frame is near, distance is hazy / desaturated /
        //   lifted, and sharp detailed areas are close.
        var far = 0.50 * (1 - yn)
          + 0.20 * (1 - detailN)
          + 0.20 * (1 - satN)
          + 0.10 * lumaN;
        base[j] = clamp01(far);
      }
    }

    var smoothRadius = clamp(Math.round(o.smooth === undefined ? 2 : o.smooth), 0, 4);
    var work = base;
    for (var pass = 0; pass < 2; pass++) {
      if (!smoothRadius) break;
      work = guidedSmooth(work, luma, w, h, smoothRadius, 18);
    }

    // Magic Mask (or an uploaded matte) as a hard "this is the subject" cue.
    if (o.mask && o.mask.length) {
      var mw = o.maskW || w;
      var mh = o.maskH || h;
      for (var y3 = 0; y3 < h; y3++) {
        var my = clamp(Math.round((y3 / Math.max(1, h - 1)) * (mh - 1)), 0, mh - 1);
        for (var x3 = 0; x3 < w; x3++) {
          var mx2 = clamp(Math.round((x3 / Math.max(1, w - 1)) * (mw - 1)), 0, mw - 1);
          var m = o.mask[my * mw + mx2] / 255;
          if (m <= 0) continue;
          var k = y3 * w + x3;
          var subjectDepth = 0.04 + (1 - m) * 0.35;
          work[k] = work[k] * (1 - m) + subjectDepth * m;
        }
      }
    }

    var stretched = percentileStretch(work, 0.02, 0.98);

    // contrast + near bias, then invert if asked
    var contrast = clamp((o.contrast === undefined ? 50 : o.contrast) / 100, 0, 1);
    var gamma = 1 / (0.35 + contrast * 1.6);
    var out = new Float32Array(n);
    for (var i2 = 0; i2 < n; i2++) {
      var v = Math.pow(clamp01(stretched[i2]), gamma);
      v = clamp01(v * (0.85 + nearBias * 0.3));
      out[i2] = o.invert ? 1 - v : v;
    }
    return out;
  }

  // Depth straight from a Magic Mask: subject near, everything else far. The
  // matte is already feathered, so its edge becomes a soft depth ramp for free.
  function fromMask(mask, w, h, softness) {
    var soft = clamp01(softness === undefined ? 0.35 : softness);
    var subjectDepth = 0.08 + soft * 0.12;
    var out = new Float32Array(w * h);
    for (var i = 0; i < out.length; i++) {
      var m = clamp01(mask[i] / 255);
      out[i] = clamp01(1 - m * (1 - subjectDepth));
    }
    return out;
  }

  // A loaded grayscale depth image (white = near by default, like most tools).
  function fromGray(img, invert) {
    var w = img.width;
    var h = img.height;
    var out = new Float32Array(w * h);
    for (var i = 0; i < w * h; i++) {
      var p = i * 4;
      var v = clamp01(lumaAt(img.data, p) / 255);
      out[i] = invert ? v : 1 - v;
    }
    return out;
  }

  // ------------------------------------------------------------- effect stack

  function depthSample(depth, w, h, x, y) {
    var xi = clamp(x | 0, 0, w - 1);
    var yi = clamp(y | 0, 0, h - 1);
    return depth[yi * w + xi];
  }

  function bilinearRGBA(src, w, h, x, y, out) {
    var x0 = Math.floor(x);
    var y0 = Math.floor(y);
    var fx = x - x0;
    var fy = y - y0;
    var x1 = clamp(x0 + 1, 0, w - 1);
    var y1 = clamp(y0 + 1, 0, h - 1);
    x0 = clamp(x0, 0, w - 1);
    y0 = clamp(y0, 0, h - 1);
    var p00 = (y0 * w + x0) * 4;
    var p10 = (y0 * w + x1) * 4;
    var p01 = (y1 * w + x0) * 4;
    var p11 = (y1 * w + x1) * 4;
    for (var c = 0; c < 3; c++) {
      var a = src[p00 + c] * (1 - fx) + src[p10 + c] * fx;
      var b = src[p01 + c] * (1 - fx) + src[p11 + c] * fx;
      out[c] = a * (1 - fy) + b * fy;
    }
    return out;
  }

  /**
   * apply(img, depth, effects, opts)
   *   img     : { data, width, height } (RGBA, will not be mutated)
   *   depth   : Float32Array(w*h)
   *   effects : { dof: 0..1, haze: 0..1, ... } only enabled keys are applied
   *   opts    : { focus=0.45, aperture=100, time=0 }
   * returns { data, width, height, passes }
   */
  function apply(img, depth, effects, opts) {
    var o = opts || {};
    var w = img.width;
    var h = img.height;
    var n = w * h;
    var fx = effects || {};
    var work = new Uint8ClampedArray(img.data); // copy, never mutate the caller
    var passes = [];
    var focus = clamp01(o.focus === undefined ? 0.45 : o.focus);
    var aperture = clamp(o.aperture === undefined ? 100 : o.aperture, 0, 200) / 100;

    function on(id) { return (fx[id] || 0) > 0.001; }

    // ---- depth of field: three blurred copies, blended by circle of confusion
    if (on('dof')) {
      var amount = fx.dof;
      var radii = [1, 3, 6];
      var blurred = radii.map(function (r) {
        return boxBlurRGB(work, w, h, Math.max(1, Math.round(r * (0.6 + amount))));
      });
      var coc = new Float32Array(n);
      for (var i = 0; i < n; i++) {
        coc[i] = clamp01(Math.abs(depth[i] - focus) * 1.8 * amount * aperture);
      }
      var outDof = new Uint8ClampedArray(work);
      for (var i2 = 0; i2 < n; i2++) {
        var t = coc[i2] * 2.999;
        var a = clamp(Math.floor(t), 0, 2);
        var b = clamp(a + 1, 0, 2);
        var f = t - a;
        var p = i2 * 4;
        for (var c = 0; c < 3; c++) {
          var va = blurred[a][i2 * 3 + c];
          var vb = blurred[b][i2 * 3 + c];
          outDof[p + c] = va * (1 - f) + vb * f;
        }
      }
      work = outDof;
      passes.push('dof');
    }

    // ---- tilt-shift: blur grows away from a horizontal focus band
    if (on('tilt')) {
      var tAmount = fx.tilt;
      var band = 0.12 + tAmount * 0.12;
      var blurs = [boxBlurRGB(work, w, h, 2), boxBlurRGB(work, w, h, 5), boxBlurRGB(work, w, h, 9)];
      var outTilt = new Uint8ClampedArray(work);
      for (var y = 0; y < h; y++) {
        var yn = h > 1 ? y / (h - 1) : 0.5;
        var dist = Math.max(0, Math.abs(yn - 0.5) - band) / Math.max(0.001, 0.5 - band);
        for (var x = 0; x < w; x++) {
          var idx = y * w + x;
          var k = clamp01(dist * tAmount * 1.4 + Math.abs(depth[idx] - focus) * 0.35 * tAmount) * 2.999;
          var a2 = clamp(Math.floor(k), 0, 2);
          var b2 = clamp(a2 + 1, 0, 2);
          var f2 = k - a2;
          var p2 = idx * 4;
          for (var c2 = 0; c2 < 3; c2++) {
            var va2 = blurs[a2][idx * 3 + c2];
            var vb2 = blurs[b2][idx * 3 + c2];
            outTilt[p2 + c2] = va2 * (1 - f2) + vb2 * f2;
          }
        }
      }
      work = outTilt;
      passes.push('tilt');
    }

    // ---- atmosphere: distance fog with a height falloff
    if (on('haze')) {
      var hazeAmt = fx.haze;
      var fogR = 116;
      var fogG = 126;
      var fogB = 142;
      for (var y2 = 0; y2 < h; y2++) {
        var hN = h > 1 ? y2 / (h - 1) : 0;
        var heightFalloff = 0.55 + 0.45 * (1 - hN);
        for (var x2 = 0; x2 < w; x2++) {
          var i3 = y2 * w + x2;
          var mi = Math.pow(clamp01(depth[i3]), 1.7) * hazeAmt * heightFalloff * 0.92;
          if (mi <= 0.001) continue;
          var p3 = i3 * 4;
          // aerial perspective also lifts the blacks toward the haze colour
          work[p3] = work[p3] * (1 - mi) + fogR * mi;
          work[p3 + 1] = work[p3 + 1] * (1 - mi) + fogG * mi;
          work[p3 + 2] = work[p3 + 2] * (1 - mi) + fogB * mi;
        }
      }
      passes.push('haze');
    }

    // ---- depth grade: cool desaturated distance, richer foreground
    if (on('grade')) {
      var gradeAmt = fx.grade;
      for (var i4 = 0; i4 < n; i4++) {
        var d4 = clamp01(depth[i4]);
        var p4 = i4 * 4;
        var r4 = work[p4];
        var g4 = work[p4 + 1];
        var b4 = work[p4 + 2];
        var l4 = 0.2126 * r4 + 0.7152 * g4 + 0.0722 * b4;
        var far = Math.pow(d4, 1.35) * gradeAmt;
        var near = (1 - d4) * gradeAmt;
        // distance: desaturate + cool
        var r5 = (r4 * (1 - far * 0.45) + l4 * far * 0.45) * (1 - far * 0.06);
        var g5 = (g4 * (1 - far * 0.45) + l4 * far * 0.45) * (1 - far * 0.02);
        var b5 = (b4 * (1 - far * 0.45) + l4 * far * 0.45) * (1 + far * 0.1);
        // foreground: a touch more contrast and warmth
        r5 = r5 + near * 10;
        g5 = g5 + near * 6;
        b5 = b5 + near * 2;
        work[p4] = clamp(r5, 0, 255);
        work[p4 + 1] = clamp(g5, 0, 255);
        work[p4 + 2] = clamp(b5, 0, 255);
      }
      passes.push('grade');
    }

    // ---- echo: depth-weighted ghost copies (before geometry effects)
    if (on('echo')) {
      var echoAmt = fx.echo;
      var srcEcho = new Uint8ClampedArray(work);
      var tmp = [0, 0, 0];
      for (var y5 = 0; y5 < h; y5++) {
        for (var x5 = 0; x5 < w; x5++) {
          var i5 = y5 * w + x5;
          var d5 = depth[i5];
          var off = (d5 - 0.5) * w * 0.05 * echoAmt;
          bilinearRGBA(srcEcho, w, h, x5 + off, y5, tmp);
          var p5 = i5 * 4;
          var mixA = 0.45 * echoAmt;
          work[p5] = work[p5] * (1 - mixA) + tmp[0] * mixA;
          work[p5 + 1] = work[p5 + 1] * (1 - mixA) + tmp[1] * mixA;
          work[p5 + 2] = work[p5 + 2] * (1 - mixA) + tmp[2] * mixA;
        }
      }
      passes.push('echo');
    }

    // ---- parallax: 2.5D push, each depth layer slides a different amount
    if (on('parallax')) {
      var parAmt = fx.parallax;
      var srcPar = new Uint8ClampedArray(work);
      var tSec = o.time || 0;
      var sway = Math.sin(tSec * 0.9) * 0.55 + 0.45;
      var tmp2 = [0, 0, 0];
      for (var y6 = 0; y6 < h; y6++) {
        for (var x6 = 0; x6 < w; x6++) {
          var i6 = y6 * w + x6;
          var d6 = depth[i6];
          var dx = (d6 - 0.5) * w * 0.045 * parAmt * sway;
          var dy = (d6 - 0.5) * h * 0.02 * parAmt;
          bilinearRGBA(srcPar, w, h, x6 + dx, y6 + dy, tmp2);
          var p6 = i6 * 4;
          work[p6] = tmp2[0];
          work[p6 + 1] = tmp2[1];
          work[p6 + 2] = tmp2[2];
        }
      }
      passes.push('parallax');
    }

    // ---- slices: quantised depth bands offset sideways
    if (on('slices')) {
      var sliceAmt = fx.slices;
      var bands = 9;
      var srcSlice = new Uint8ClampedArray(work);
      var tmp3 = [0, 0, 0];
      for (var y7 = 0; y7 < h; y7++) {
        for (var x7 = 0; x7 < w; x7++) {
          var i7 = y7 * w + x7;
          var q = Math.floor(depth[i7] * bands) / bands;
          var dx2 = (q - 0.5) * w * 0.06 * sliceAmt;
          bilinearRGBA(srcSlice, w, h, x7 + dx2, y7, tmp3);
          var p7 = i7 * 4;
          work[p7] = tmp3[0];
          work[p7 + 1] = tmp3[1];
          work[p7 + 2] = tmp3[2];
        }
      }
      passes.push('slices');
    }

    // ---- relight: raking light from the depth surface normals
    if (on('relight')) {
      var relAmt = fx.relight;
      var lx = 0.62;
      var ly = -0.48;
      var lz = 0.62;
      for (var y8 = 1; y8 < h - 1; y8++) {
        for (var x8 = 1; x8 < w - 1; x8++) {
          var i8 = y8 * w + x8;
          var dzdx = (depth[i8 + 1] - depth[i8 - 1]) * 42;
          var dzdy = (depth[i8 + w] - depth[i8 - w]) * 42;
          var nx = -dzdx;
          var ny = -dzdy;
          var nz = 1;
          var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
          var dot = (nx * lx + ny * ly + nz * lz) / len;
          var light = clamp(dot, 0, 1.4);
          var add = (light - 0.62) * 120 * relAmt;
          var p8 = i8 * 4;
          work[p8] = clamp(work[p8] + add, 0, 255);
          work[p8 + 1] = clamp(work[p8 + 1] + add * 0.97, 0, 255);
          work[p8 + 2] = clamp(work[p8 + 2] + add * 0.9, 0, 255);
        }
      }
      passes.push('relight');
    }

    // ---- anaglyph: red/cyan from depth parallax
    if (on('anaglyph')) {
      var anaAmt = fx.anaglyph;
      var srcAna = new Uint8ClampedArray(work);
      var tmp4 = [0, 0, 0];
      for (var y9 = 0; y9 < h; y9++) {
        for (var x9 = 0; x9 < w; x9++) {
          var i9 = y9 * w + x9;
          var d9 = depth[i9];
          var shift = (d9 - 0.5) * w * 0.02 * anaAmt;
          bilinearRGBA(srcAna, w, h, x9 + shift, y9, tmp4);
          var p9 = i9 * 4;
          work[p9] = tmp4[0];
          bilinearRGBA(srcAna, w, h, x9 - shift, y9, tmp4);
          work[p9 + 1] = tmp4[1];
          work[p9 + 2] = tmp4[2];
        }
      }
      passes.push('anaglyph');
    }

    // ---- contours: topographic lines from the depth surface
    if (on('contours')) {
      var cAmt = fx.contours;
      var lines = 22;
      for (var i10 = 0; i10 < n; i10++) {
        var frac = depth[i10] * lines;
        var dist2 = Math.abs(frac - Math.round(frac));
        if (dist2 > 0.09) continue;
        var strength = (1 - dist2 / 0.09) * cAmt;
        var p10 = i10 * 4;
        var l10 = 0.2126 * work[p10] + 0.7152 * work[p10 + 1] + 0.0722 * work[p10 + 2];
        var ink = l10 > 110 ? 0 : 255; // dark lines on light ground, light on dark
        work[p10] = work[p10] * (1 - strength) + ink * strength;
        work[p10 + 1] = work[p10 + 1] * (1 - strength) + ink * strength;
        work[p10 + 2] = work[p10 + 2] * (1 - strength) + ink * strength;
      }
      passes.push('contours');
    }

    // ---- point cloud: depth-scaled stipple on black
    if (on('pointcloud')) {
      var pcAmt = fx.pointcloud;
      var srcPc = new Uint8ClampedArray(work);
      var outPc = new Uint8ClampedArray(n * 4);
      var tPc = o.time || 0;
      for (var i11 = 0; i11 < n; i11++) {
        var p11 = i11 * 4;
        outPc[p11 + 3] = 255;
        outPc[p11] = 4;
        outPc[p11 + 1] = 5;
        outPc[p11 + 2] = 9;
      }
      for (var y11 = 0; y11 < h; y11++) {
        for (var x11 = 0; x11 < w; x11++) {
          var i12 = y11 * w + x11;
          var d11 = clamp01(depth[i12]);
          var cell = 3 + Math.round(d11 * 6);
          if ((x11 % cell) !== 0 || (y11 % cell) !== 0) continue;
          var jitter = ((i12 * 2654435761) % 1000) / 1000;
          if (jitter > 0.55 + pcAmt * 0.4) continue;
          var radius = Math.max(1, Math.round((1 - d11) * 2 + (1 - pcAmt) * 0.8));
          var l11 = 0.2126 * srcPc[i12 * 4] + 0.7152 * srcPc[i12 * 4 + 1] + 0.0722 * srcPc[i12 * 4 + 2];
          var inkAmt = clamp01((l11 / 255) * (0.35 + pcAmt * 0.9));
          for (var oy = -radius; oy <= radius; oy++) {
            for (var ox = -radius; ox <= radius; ox++) {
              if (ox * ox + oy * oy > radius * radius + 1) continue;
              var xx2 = x11 + ox;
              var yy2 = y11 + oy;
              if (xx2 < 0 || yy2 < 0 || xx2 >= w || yy2 >= h) continue;
              var p12 = (yy2 * w + xx2) * 4;
              outPc[p12] = 4 + inkAmt * 248;
              outPc[p12 + 1] = 5 + inkAmt * 248;
              outPc[p12 + 2] = 9 + inkAmt * 244;
            }
          }
        }
      }
      work = outPc;
      passes.push('pointcloud');
    }

    return { data: work, width: w, height: h, passes: passes };
  }

  // Grayscale RGBA of a depth map (white = near, the usual depth-map convention)
  function toGray(depth, w, h, invert) {
    var out = new Uint8ClampedArray(w * h * 4);
    for (var i = 0; i < w * h; i++) {
      var v = clamp01(depth[i]);
      var g = (invert ? v : 1 - v) * 255;
      var p = i * 4;
      out[p] = g;
      out[p + 1] = g;
      out[p + 2] = g;
      out[p + 3] = 255;
    }
    return out;
  }

  return {
    VERSION: VERSION,
    EFFECTS: EFFECTS,
    estimate: estimate,
    fromMask: fromMask,
    fromGray: fromGray,
    apply: apply,
    toGray: toGray,
    resizeDepth: resizeDepth,
    sampleDepthRect: sampleDepthRect,
    boxBlurRGB: boxBlurRGB,
    guidedSmooth: guidedSmooth,
    percentileStretch: percentileStretch,
    clamp01: clamp01
  };
});
