// ============================================================================
// TOUCHDESIGNER-STYLE GENERATIVE TOP ENGINE (12 DISTORTION PRESETS)
// + 8 TRANSITION / MORPH PRESETS + REAL-TIME CANVAS SHADER RUNTIME
// Runs 100% client-side on macOS / any browser, zero plugins, Resolve Free safe.
// ============================================================================

const TD_PRESETS = [
  {
    id: 'td_displace_top',
    name: 'TD Simplex UV Displace TOP',
    category: 'TouchDesigner TOPs',
    spec: 'UV ±0.18',
    node: 'Noise TOP (Simplex 4D) ▸ Displace TOP',
    desc: '4D simplex noise driving a 2-axis UV refraction field — the canonical TouchDesigner Displace TOP look.',
    effectType: 'td_displace',
    accent: '#e11d48'
  },
  {
    id: 'td_feedback_loop',
    name: 'Feedback Slope Loop TOP',
    category: 'TouchDesigner TOPs',
    spec: 'Decay 0.94',
    node: 'Feedback TOP ▸ Transform (Zoom 1.03) ▸ Level',
    desc: 'Recursive frame feedback with a slow zoom + micro-rotate slope, building infinite tunnel trails from real motion.',
    effectType: 'td_feedback',
    accent: '#f43f5e'
  },
  {
    id: 'td_blob_track',
    name: 'Blob Track CV Telemetry',
    category: 'TouchDesigner TOPs',
    spec: 'Threshold 0.55',
    node: 'Threshold TOP ▸ Blob Track TOP ▸ Info CHOP',
    desc: 'Luma-threshold blob detection with live bounding boxes, centroid crosshairs and velocity vectors.',
    effectType: 'td_blobtrack',
    accent: '#22d3ee'
  },
  {
    id: 'td_rutt_etra',
    name: 'Rutt-Etra Z-Scanline Extrusion',
    category: 'TouchDesigner TOPs',
    spec: 'Z 0–255',
    node: 'Rutti-Etra TOP ▸ Luma-to-Z ▸ Subtract',
    desc: 'The 1978 Rutt-Etra scan processor: every horizontal scanline is displaced in X and extruded in Z by its own luma.',
    effectType: 'td_ruttetra',
    accent: '#38bdf8'
  },
  {
    id: 'td_pixel_sort',
    name: 'Luma Pixel-Sort Slicer',
    category: 'TouchDesigner TOPs',
    spec: 'Sort 0.35–1.0',
    node: 'Analyze TOP ▸ Sort DAT ▸ Cache TOP',
    desc: 'Vertical luma-threshold pixel sorting that drags highlights into silky data-streaks along the scan axis.',
    effectType: 'td_pixelsort',
    accent: '#a855f7'
  },
  {
    id: 'td_slit_scan',
    name: 'Slit-Scan Time Machine',
    category: 'TouchDesigner TOPs',
    spec: '1px / frame',
    node: 'Slit Scan TOP (Time Slice)',
    desc: 'Each pixel column is sampled from a different moment in time, smearing motion into a temporal curtain.',
    effectType: 'td_slitscan',
    accent: '#f59e0b'
  },
  {
    id: 'td_rd_melt',
    name: 'Reaction-Diffusion Edge Melt',
    category: 'TouchDesigner TOPs',
    spec: 'Gray-Scott',
    node: 'Feedback ▸ Edge TOP ▸ Composite (Add)',
    desc: 'Gray-Scott style activator/inhibitor growth that eats the frame edges and bleeds colour into the melt.',
    effectType: 'td_rdmelt',
    accent: '#10b981'
  },
  {
    id: 'td_ascii_matrix',
    name: 'ASCII Matrix Raster',
    category: 'TouchDesigner TOPs',
    spec: '68 × 38 cells',
    node: 'Resolution TOP ▸ CHOP to DAT ▸ Text TOP',
    desc: 'Downsampled luma re-typed as a monospace glyph raster over a dimmed plate — green-phosphor or accent tinted.',
    effectType: 'td_ascii',
    accent: '#4ade80'
  },
  {
    id: 'td_kaleido',
    name: 'Kaleidoscope Mirror TOP',
    category: 'TouchDesigner TOPs',
    spec: '8 slices',
    node: 'Kaleidoscope TOP (Mirror) ▸ Transform',
    desc: 'Polar mirroring across 8 rotating wedges with an alternating flip — kaleidoscopic symmetry with live drift.',
    effectType: 'td_kaleido',
    accent: '#c084fc'
  },
  {
    id: 'td_flow_warp',
    name: 'Optical Flow Vector Warp',
    category: 'TouchDesigner TOPs',
    spec: 'Curl 0.42',
    node: 'Optical Flow TOP ▸ Vector Field ▸ Displace',
    desc: 'Curl-noise advection field with drawn motion vectors — the warped, dragging look of an Optical Flow TOP pass.',
    effectType: 'td_flowwarp',
    accent: '#60a5fa'
  },
  {
    id: 'td_chladni',
    name: 'Chladni Cymatic Plate',
    category: 'TouchDesigner TOPs',
    spec: 'n=3 m=5',
    node: 'Math CHOP ▸ CHOP to TOP ▸ Displace',
    desc: 'Standing-wave nodal patterns from the Chladni equation used as a displacement + glow map, pulsing on the downbeat.',
    effectType: 'td_chladni',
    accent: '#facc15'
  },
  {
    id: 'td_datamosh',
    name: 'Datamosh Macroblock Drift',
    category: 'TouchDesigner TOPs',
    spec: '16×9 blocks',
    node: 'Cache TOP ▸ Resolution TOP ▸ Feedback',
    desc: 'P-frame style macroblock displacement: motion vectors leak into neighbouring blocks while stale blocks hold previous frames.',
    effectType: 'td_datamosh',
    accent: '#fb7185'
  },

  // ---------------------------------------------------------------------------
  // TRANSITIONS & MORPHS (8) — each carries its own intensity slider + keyframes
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // GLITCH & BITMAP TOPs — degraded-signal / printed-bitmap family
  // (ink stipple, luma-key silhouette streaks, palette mosaic, directional
  //  smear, datamosh text echo, newsprint ripple, window slice, chroma bleed)
  // ---------------------------------------------------------------------------
  {
    id: 'td_inkstipple',
    name: 'Ink Stipple Print',
    category: 'Glitch & Bitmap TOPs',
    spec: 'Ink on Paper',
    node: 'Threshold TOP ▸ Scatter SOP ▸ Over TOP (Invert)',
    desc: 'Inverted stipple plate: sparse black ink specks on white newsprint stock, density and size driven by shadow tone.',
    effectType: 'td_inkstipple',
    accent: '#111827'
  },
  {
    id: 'td_lumakey_streak',
    name: 'Luma-Key Silhouette Streak',
    category: 'Glitch & Bitmap TOPs',
    spec: 'Key 0.62',
    node: 'Luma Level TOP ▸ Threshold ▸ Trail (X)',
    desc: 'Hard luma-key cut-out to pure white, then horizontal trail streaks tear off the silhouette edges into the black.',
    effectType: 'td_lumakey',
    accent: '#f8fafc'
  },
  {
    id: 'td_palette_mosaic',
    name: 'Palette Mosaic Quantize',
    category: 'Glitch & Bitmap TOPs',
    spec: '5 Colours',
    node: 'Resolution TOP ▸ Level ▸ Palette MAT',
    desc: 'Resolution-crushed blocks recoloured to a hard five-colour palette (white / cobalt / magenta / green / ink) — bitmap-era poster look.',
    effectType: 'td_palette',
    accent: '#ec4899'
  },
  {
    id: 'td_dir_smear',
    name: 'Directional Zoom Smear',
    category: 'Glitch & Bitmap TOPs',
    spec: '18 Taps',
    node: 'Transform ×N ▸ Composite (Add) ▸ Monochrome',
    desc: 'Multi-tap zoom smear pulling every highlight radially outward, finished with a single-hue green monochrome grade.',
    effectType: 'td_dirsmear',
    accent: '#22c55e'
  },
  {
    id: 'td_datamosh_echo',
    name: 'Datamosh Text Echo',
    category: 'Glitch & Bitmap TOPs',
    spec: 'P-Frame',
    node: 'Cache TOP ▸ Displace (Macroblock) ▸ Duotone',
    desc: 'Broken P-frame blocks smear horizontally while a purple ghost echo of the high-contrast detail floats over a rust duotone field.',
    effectType: 'td_datamosh_echo',
    accent: '#a855f7'
  },
  {
    id: 'td_newsprint_ripple',
    name: 'Newsprint Ripple Halftone',
    category: 'Glitch & Bitmap TOPs',
    spec: '85 LPI',
    node: 'Halftone MAT ▸ Wave TOP ▸ Film Grain',
    desc: 'Archival newsprint dot screen with a slow ripple warp travelling through the plate and heavy letterpress grain.',
    effectType: 'td_newsprint',
    accent: '#e5e7eb'
  },
  {
    id: 'td_window_slice',
    name: 'Window Slice Displace',
    category: 'Glitch & Bitmap TOPs',
    spec: 'Rect 0.42',
    node: 'Rectangle TOP (Mask) ▸ Slice ▸ Composite',
    desc: 'A hard rectangular window is carved out of the frame and re-filled with horizontally sliced, colour-boosted duplicates of itself.',
    effectType: 'td_windowslice',
    accent: '#84cc16'
  },
  {
    id: 'td_chroma_bleed',
    name: 'Chroma Bleed Ghost',
    category: 'Glitch & Bitmap TOPs',
    spec: 'RGB ±28px',
    node: 'ChannelBooleans ▸ Transform (R/G/B) ▸ Add',
    desc: 'True channel separation: red, green and blue are bled apart at different rates and re-added, leaving coloured ghost edges.',
    effectType: 'td_chromableed',
    accent: '#f472b6'
  },

  {
    id: 'tr_luma_wipe',
    name: 'Luma-Wipe Exposure Dissolve',
    category: 'Transitions & Morphs',
    spec: '4f Soft',
    node: 'Luma Matte ▸ Dissolve ▸ SoftGlow',
    desc: 'Transition through the highlights: a rolling luma matte sweeps blown-out exposure across into the incoming shot.',
    effectType: 'tr_lumawipe',
    accent: '#fda4af',
    isTransition: true
  },
  {
    id: 'tr_feedback_zoom',
    name: 'Feedback Zoom Morph',
    category: 'Transitions & Morphs',
    spec: 'Recursive',
    node: 'Feedback TOP ▸ Dissolve ▸ Transform',
    desc: 'Recursive zoom crossfade — the outgoing frame tunnels into itself as the incoming plate inflates from the centre.',
    effectType: 'tr_feedbackzoom',
    accent: '#f43f5e',
    isTransition: true
  },
  {
    id: 'tr_slit_curtain',
    name: 'Slit-Scan Curtain Wipe',
    category: 'Transitions & Morphs',
    spec: '24 Strips',
    node: 'Slice ▸ Transform ▸ Merge',
    desc: 'Staggered vertical slit strips that hand off to the next shot like a curtain of time slices.',
    effectType: 'tr_slitwipe',
    accent: '#fbbf24',
    isTransition: true
  },
  {
    id: 'tr_glass_push',
    name: 'Refractive Glass Push',
    category: 'Transitions & Morphs',
    spec: 'Refract 1.4',
    node: 'Displace TOP ▸ Transform ▸ Merge',
    desc: 'A physical glass push: the outgoing frame refracts and slides out while the incoming plate warps through the seam.',
    effectType: 'tr_glasspush',
    accent: '#38bdf8',
    isTransition: true
  },
  {
    id: 'tr_mirror_fold',
    name: 'Mirror Fold Flip',
    category: 'Transitions & Morphs',
    spec: 'Fold 90°',
    node: 'Mirror ▸ Transform (3D) ▸ Merge',
    desc: 'The frame folds on itself along a moving crease, collapsing flat before the next shot unfolds into place.',
    effectType: 'tr_mirrorfold',
    accent: '#a78bfa',
    isTransition: true
  },
  {
    id: 'tr_chroma_slide',
    name: 'Chromatic Split Slide',
    category: 'Transitions & Morphs',
    spec: 'R/G/B ±22px',
    node: 'ChannelBooleans ▸ Transform ▸ Merge',
    desc: 'Channels slide apart at different rates, smear the cut, then re-register on the incoming shot.',
    effectType: 'tr_chromaslide',
    accent: '#22d3ee',
    isTransition: true
  },
  {
    id: 'tr_rolling_shutter',
    name: 'Rolling Shutter Skew Wipe',
    category: 'Transitions & Morphs',
    spec: 'Row Skew',
    node: 'Grid Warp ▸ TimeOffset ▸ Merge',
    desc: 'CMOS rolling-shutter row skew that wipes the cut diagonally, top rows leading bottom rows by 3 frames.',
    effectType: 'tr_rollershutter',
    accent: '#fb923c',
    isTransition: true
  },
  // ---------------------------------------------------------------------------
  // DATA & PRINT TOPs — monochrome generative print/data treatments
  // (band-split slice cabinets, lenticular rib screens, barcode halftone,
  //  1-bit ordered dither, flow-field stipple, contour stipple, engrave hatch)
  // ---------------------------------------------------------------------------
  {
    id: 'td_bandslice',
    name: 'Band-Split Slice Cabinet',
    category: 'Data & Print TOPs',
    spec: '24 Bands',
    node: 'Slice TOP ×N ▸ Transform ▸ Rib Screen (Multiply)',
    desc: 'Frame decomposed into horizontal slabs, each shifted by its own noise value and re-ribbed with a lenticular line screen over a dark plinth.',
    effectType: 'td_bandslice',
    accent: '#94a3b8'
  },
  {
    id: 'td_lenticular',
    name: 'Lenticular Rib Line-Screen',
    category: 'Data & Print TOPs',
    spec: '3px Pitch',
    node: 'Resolution TOP ▸ Line Screen MAT ▸ Multiply',
    desc: 'Full-frame lenticular rib screen: luminance survives only inside thin vertical ribs, collapsing the plate into a printed lenticular sheet.',
    effectType: 'td_lenticular',
    accent: '#cbd5e1'
  },
  {
    id: 'td_barcode',
    name: 'Barcode Block Halftone',
    category: 'Data & Print TOPs',
    spec: '56 × 40 Cells',
    node: 'Resolution TOP ▸ Level ▸ Rectangle DAT',
    desc: 'Each cell becomes a crisp white horizontal bar whose length is its luminance — pure 1-bit barcode typography on black.',
    effectType: 'td_barcode',
    accent: '#f8fafc'
  },
  {
    id: 'td_bayer',
    name: 'Bayer 8×8 Ordered Dither',
    category: 'Data & Print TOPs',
    spec: '1-Bit Print',
    node: 'Dither TOP ▸ Bayer MAT ▸ Resolution',
    desc: 'True ordered-dither print conversion — an 8×8 Bayer matrix quantises the frame to pure black and white dots that hold the grain.',
    effectType: 'td_bayer',
    accent: '#e2e8f0'
  },
  {
    id: 'td_stipple',
    name: 'Flow-Field Stipple Portrait',
    category: 'Data & Print TOPs',
    spec: '1.6k Points',
    node: 'Scatter TOP ▸ Copy SOP ▸ Render TOP',
    desc: 'Dots drift on a curl-noise field, sized and brightened by the luma beneath them — the stippled point-cloud portrait look.',
    effectType: 'td_stipple',
    accent: '#e5e7eb'
  },
  {
    id: 'td_ringstipple',
    name: 'Contour Ring Stipple',
    category: 'Data & Print TOPs',
    spec: '28 Rings',
    node: 'Circle TOP ×N ▸ Noise Displace ▸ Copy',
    desc: 'Concentric rings of stipple points propagate outward from the subject, bending around luma like a topographic contour plot.',
    effectType: 'td_ringstipple',
    accent: '#d1d5db'
  },
  {
    id: 'td_engrave',
    name: 'Copperplate Engrave Hatch',
    category: 'Data & Print TOPs',
    spec: '35° Hatch',
    node: 'Hatch MAT ▸ Luma Remap ▸ Multiply',
    desc: 'Diagonal intaglio hatch strokes thicken in the shadows and thin to nothing in the highlights — an engraved plate made from the plate.',
    effectType: 'td_engrave',
    accent: '#cbd5e1'
  },
  {
    id: 'td_dashfield',
    name: 'Flow Dash Glyph Field',
    category: 'Data & Print TOPs',
    spec: '900 Dashes',
    node: 'Trace SOP ▸ Dashed Line ▸ Over TOP',
    desc: 'Short oriented dashes flow along the image gradient, dash length tracking luma — the data-stream glyph field look.',
    effectType: 'td_dashfield',
    accent: '#f1f5f9'
  },

  {
    id: 'tr_blob_morph',
    name: 'Blob Track Contour Morph',
    category: 'Transitions & Morphs',
    spec: 'Contour 12pt',
    node: 'Blob Track ▸ Trace ▸ Morph',
    desc: 'A noisy organic contour opens from the detected subject and morphs the whole frame into the next shot.',
    effectType: 'tr_blobmorph',
    accent: '#34d399',
    isTransition: true
  }
];

// ============================================================================
// CANVAS RUNTIME
// ============================================================================
const TD_ENGINE = (() => {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function mkCanvas(w = 2, h = 2) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  function fit(c, w, h) {
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
  }

  // Persistent buffers (allocated lazily, reset on size change)
  let SRC = null, SCTX = null;
  let TMP1 = null, T1 = null;
  let TMP2 = null, T2 = null;
  let SMALL = null, SMCTX = null;
  let LOW = null, LOWCTX = null;
  let FB = null, FBCTX = null, fbW = 0, fbH = 0;
  let SLIT = null, SLCTX = null, slitW = 0, slitH = 0;
  let INC = null, INCCTX = null, incW = 0, incH = 0;
  let MASK = null, MASKCTX = null;
  let ATLAS = null, ATLASCTX = null, atlasTint = '';
  let HATCH = null, HATCHCTX = null;
  let PLATE = null, PLATECTX = null;
  let HATCH2 = null, HATCH2CTX = null;
  let TINT = null, TINTCTX = null;
  let CAB = null, CABV = null, CABW = 0, CABH = 0;
  let blockState = null;
  let stippleBuf = null;
  let CHROMA = null;
  let CHROMA_CTX = null;
  let SMALL2 = null, SMALL2_CTX = null;

  // ---- resolution model ---------------------------------------------------
  // Every shader is authored against a 640x360 reference frame. RS is the
  // ratio of the current frame's short edge to that reference, so all pixel
  // constants scale with the render size and 4K output composes identically
  // to the preview (just with 6x the detail).
  let RS = 1;
  let LAST_W = 0, LAST_H = 0, LAST_FN = null;
  let QUALITY = 'preview';     // 'preview' | 'export'
  const REF_SHORT = 360;
  function rpx(v) { return v * RS; }
  function rpxMin(v) { return Math.max(1, v * RS); }
  function detailScale() { return QUALITY === 'export' ? 2 : 1; }

  function buffers(w, h) {
    if (!SRC) { SRC = mkCanvas(w, h); SCTX = SRC.getContext('2d', { willReadFrequently: true }); }
    fit(SRC, w, h);
    if (!TMP1) { TMP1 = mkCanvas(w, h); T1 = TMP1.getContext('2d'); }
    fit(TMP1, w, h);
    if (!TMP2) { TMP2 = mkCanvas(w, h); T2 = TMP2.getContext('2d'); }
    fit(TMP2, w, h);
  }

  function capture(canvas) {
    buffers(canvas.width, canvas.height);
    SCTX.setTransform(1, 0, 0, 1, 0, 0);
    SCTX.clearRect(0, 0, SRC.width, SRC.height);
    SCTX.drawImage(canvas, 0, 0);
    return SRC;
  }

  // --- value noise --------------------------------------------------------
  function hash2(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi), b = hash2(xi + 1, yi);
    const c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }
  function fbm(x, y, oct = 3) {
    let s = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      s += vnoise(x * f, y * f) * amp;
      norm += amp;
      amp *= 0.5;
      f *= 2.03;
    }
    return s / norm;
  }

  function sampleSmall(w = 96, h = 54) {
    if (!SMALL) { SMALL = mkCanvas(w, h); SMCTX = SMALL.getContext('2d', { willReadFrequently: true }); }
    fit(SMALL, w, h);
    SMCTX.clearRect(0, 0, w, h);
    SMCTX.drawImage(SRC, 0, 0, w, h);
    return SMCTX.getImageData(0, 0, w, h);
  }

  function lowRes(pw, ph, fn) {
    if (!LOW) { LOW = mkCanvas(pw, ph); LOWCTX = LOW.getContext('2d', { willReadFrequently: true }); }
    fit(LOW, pw, ph);
    LOWCTX.clearRect(0, 0, pw, ph);
    LOWCTX.drawImage(SRC, 0, 0, pw, ph);
    const img = LOWCTX.getImageData(0, 0, pw, ph);
    fn(img.data, pw, ph);
    LOWCTX.putImageData(img, 0, 0);
    return LOW;
  }

  function bandWarp(ctx, src, w, h, field, amp, opts = {}) {
    const step = Math.max(4, Math.round((opts.step || 4) * Math.max(1, RS * 0.9)));
    buffers(w, h);
    T1.setTransform(1, 0, 0, 1, 0, 0);
    T1.clearRect(0, 0, w, h);
    T1.fillStyle = '#06070c';
    T1.fillRect(0, 0, w, h);
    for (let x = -step; x < w + step; x += step) {
      const d = field(x / w, 0.5, 0) * amp;
      T1.drawImage(src, Math.max(0, x), 0, step + 2, h, x + d, 0, step + 2, h);
    }
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    for (let y = -step; y < h + step; y += step) {
      const d = field(0.5, y / h, 1) * amp * (opts.yScale === undefined ? 0.55 : opts.yScale);
      ctx.drawImage(TMP1, 0, Math.max(0, y), w, step + 2, 0, y + d, w, step + 2);
    }
    ctx.restore();
  }

  // --- incoming (B-shot) plate for transitions ---------------------------
  function incomingPlate(ctx, w, h, t) {
    if (!INC) { INC = mkCanvas(w, h); INCCTX = INC.getContext('2d'); }
    fit(INC, w, h);
    if (incW !== w || incH !== h) {
      incW = w; incH = h;
    }
    const c = INCCTX;
    const sky = c.createLinearGradient(0, 0, w * 0.4, h);
    sky.addColorStop(0, '#0a2a3f');
    sky.addColorStop(0.45, '#10485c');
    sky.addColorStop(0.72, '#c2703a');
    sky.addColorStop(1, '#160b16');
    c.fillStyle = sky;
    c.fillRect(0, 0, w, h);

    // sun / practical
    const sunX = w * 0.68, sunY = h * 0.52;
    const g = c.createRadialGradient(sunX, sunY, 2, sunX, sunY, w * 0.3);
    g.addColorStop(0, 'rgba(255,238,206,0.95)');
    g.addColorStop(0.18, 'rgba(255,168,88,0.55)');
    g.addColorStop(0.6, 'rgba(210,80,60,0.18)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);

    // soft horizon: a curved landmass + one standing figure, so the B plate
    // reads as "another shot" instead of a bar-chart of rectangles
    c.fillStyle = 'rgba(8,12,20,0.93)';
    c.beginPath();
    c.moveTo(0, h * 0.86);
    c.quadraticCurveTo(w * 0.32, h * 0.72, w * 0.62, h * 0.88);
    c.quadraticCurveTo(w * 0.84, h * 0.97, w, h * 0.9);
    c.lineTo(w, h);
    c.lineTo(0, h);
    c.closePath();
    c.fill();
    // a lone figure on the ridge
    c.fillStyle = 'rgba(6,9,15,0.96)';
    c.beginPath();
    c.ellipse(w * 0.33, h * 0.86, w * 0.035, h * 0.16, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(w * 0.33, h * 0.66, w * 0.016, 0, Math.PI * 2);
    c.fill();
    // bokeh practicals catching the sun
    c.fillStyle = 'rgba(255,206,150,0.5)';
    for (let i = 0; i < 9; i++) {
      const bx = w * (0.08 + ((i * 37) % 88) / 100);
      const by = h * (0.30 + ((i * 53) % 40) / 100);
      c.beginPath();
      c.arc(bx, by, Math.max(2, rpx(0.8 + (i % 3) * 0.5)), 0, Math.PI * 2);
      c.fill();
    }
    // drifting haze bar
    const hazeY = h * (0.35 + Math.sin(t * 0.6) * 0.04);
    const haze = c.createLinearGradient(0, hazeY - h * 0.06, 0, hazeY + h * 0.06);
    haze.addColorStop(0, 'rgba(255,170,120,0)');
    haze.addColorStop(0.5, 'rgba(255,190,140,0.16)');
    haze.addColorStop(1, 'rgba(255,170,120,0)');
    c.fillStyle = haze;
    c.fillRect(0, hazeY - h * 0.06, w, h * 0.12);
    return INC;
  }

  function maskedLayer(w, h, layer, maskFn) {
    if (!MASK) { MASK = mkCanvas(w, h); MASKCTX = MASK.getContext('2d'); }
    fit(MASK, w, h);
    MASKCTX.setTransform(1, 0, 0, 1, 0, 0);
    MASKCTX.globalCompositeOperation = 'source-over';
    MASKCTX.clearRect(0, 0, w, h);
    MASKCTX.drawImage(layer, 0, 0, w, h);
    MASKCTX.globalCompositeOperation = 'destination-in';
    maskFn(MASKCTX, w, h);
    MASKCTX.globalCompositeOperation = 'source-over';
    return MASK;
  }

  // --- print / halftone helpers -------------------------------------------
  const patternBank = new Map();
  function hatchCanvas(spacing, lw, angle, lineColor, bgColor) {
    const key = [spacing, lw, angle, lineColor, bgColor].join('|');
    if (patternBank.has(key)) return patternBank.get(key);
    const size = Math.max(24, Math.round(spacing * 8));
    const c = mkCanvas(size, size);
    const g = c.getContext('2d');
    g.fillStyle = bgColor;
    g.fillRect(0, 0, size, size);
    g.strokeStyle = lineColor;
    g.lineWidth = lw;
    g.save();
    g.translate(size / 2, size / 2);
    g.rotate((angle * Math.PI) / 180);
    for (let x = -size; x <= size; x += spacing) {
      g.beginPath();
      g.moveTo(x, -size);
      g.lineTo(x, size);
      g.stroke();
    }
    g.restore();
    patternBank.set(key, c);
    return c;
  }

  // Fill an area with a rib/hatch screen using a blend mode (Multiply / Lighter)
  function screenFill(ctx, w, h, spacing, lw, angle, lineColor, bgColor, alpha, composite) {
    const pat = ctx.createPattern(hatchCanvas(spacing, lw, angle, lineColor, bgColor), 'repeat');
    if (!pat) return;
    ctx.save();
    ctx.globalCompositeOperation = composite || 'multiply';
    ctx.globalAlpha = Math.min(1, Math.max(0, alpha));
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Lenticular rib screen drawn with explicit strokes (pattern-fill independent)
  // Lenticular rib screen: a repeating lens-shading tile instead of flat bars.
  // Overlay compositing keeps mid-grey neutral, so the ribs read as curved
  // glass over whatever is underneath rather than a barcode of black lines.
  let RIB_TILE = null, RIB_P = 0;
  // Bounded optical-feedback step.
  // Drawing the feedback buffer onto itself through a transform is undefined
  // behaviour in canvas and produced stair-step garbage the moment the source
  // moved. This transforms the previous buffer into TMP1 first, then rebuilds
  //     FB = transform(FB) * decay + src * (1 - decay) * gain
  // a true exponential moving average — always bounded, always stable.
  function feedbackStep(w, h, src, opts) {
    if (!FB) { FB = mkCanvas(w, h); FBCTX = FB.getContext('2d'); }
    fit(FB, w, h);
    buffers(w, h);
    const o = opts || {};
    const zoom = o.zoom === undefined ? 1 : o.zoom;
    const rot = o.rot || 0;
    const dx = o.dx || 0;
    const dy = o.dy || 0;

    T1.setTransform(1, 0, 0, 1, 0, 0);
    T1.globalCompositeOperation = 'source-over';
    T1.globalAlpha = 1;
    T1.clearRect(0, 0, w, h);
    T1.translate(w / 2 + dx, h / 2 + dy);
    T1.rotate(rot);
    T1.scale(zoom, zoom);
    T1.translate(-w / 2, -h / 2);
    T1.drawImage(FB, 0, 0);
    T1.setTransform(1, 0, 0, 1, 0, 0);

    const decay = clamp(o.decay === undefined ? 0.93 : o.decay, 0.4, 0.985);
    const gain = o.gain === undefined ? 1 : o.gain;

    FBCTX.setTransform(1, 0, 0, 1, 0, 0);
    FBCTX.globalCompositeOperation = 'source-over';
    FBCTX.globalAlpha = 1;
    FBCTX.clearRect(0, 0, w, h);
    FBCTX.drawImage(TMP1, 0, 0);

    const dv = Math.round(decay * 255);
    FBCTX.globalCompositeOperation = 'multiply';
    FBCTX.fillStyle = `rgb(${dv},${dv},${dv})`;
    FBCTX.fillRect(0, 0, w, h);

    FBCTX.globalCompositeOperation = 'lighter';
    FBCTX.globalAlpha = clamp((1 - decay) * gain, 0, 1);
    FBCTX.drawImage(src, 0, 0, w, h);

    FBCTX.globalCompositeOperation = 'source-over';
    FBCTX.globalAlpha = 1;
    return FB;
  }

  function ribScreen(t, w, h, pitch, strength, lift, phase) {
    const p = Math.max(6, Math.round(pitch));
    if (!RIB_TILE || RIB_P !== p) {
      RIB_TILE = mkCanvas(p, 8);
      const rc = RIB_TILE.getContext('2d');
      for (let x = 0; x < p; x++) {
        const u = x / p;
        // 0 at the valley, 1 at the lens crest
        const s2 = 0.5 - 0.5 * Math.cos(u * Math.PI * 2);
        const shade = Math.pow(s2, 0.8);
        const v = Math.round(118 + shade * 137);
        rc.fillStyle = `rgb(${v},${v},${v})`;
        rc.fillRect(x, 0, 1, 8);
      }
      RIB_P = p;
    }
    const pat = t.createPattern(RIB_TILE, 'repeat');
    if (!pat) return;
    if (pat.setTransform && typeof DOMMatrix !== 'undefined') {
      try { pat.setTransform(new DOMMatrix().translate(phase || 0, 0)); } catch (_e) { /* ignore */ }
    }
    t.save();
    // multiply the lens ramp: valleys darken, crests stay put, so the rib
    // structure survives even inside blown highlights (overlay erased them)
    t.globalCompositeOperation = 'multiply';
    t.globalAlpha = clamp(0.3 + strength * 0.9, 0, 1);
    t.fillStyle = pat;
    t.fillRect(0, 0, w, h);
    t.restore();

    // a thin specular crest so the sheet catches light like a real panel
    if (lift > 0.01) {
      t.save();
      t.globalCompositeOperation = 'screen';
      t.strokeStyle = '#e8f0fb';
      t.lineWidth = Math.max(1, p * 0.10);
      t.globalAlpha = clamp(lift, 0, 0.24);
      t.beginPath();
      for (let x = -p; x < w + p; x += p) {
        const xx = Math.round(x + p * 0.5 + (phase || 0) % p) + 0.5;
        t.moveTo(xx, 0);
        t.lineTo(xx, h);
      }
      t.stroke();
      t.restore();
    }
  }

  function grayInto(t, src, w, h) {
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.globalCompositeOperation = 'source-over';
    t.globalAlpha = 1;
    t.clearRect(0, 0, w, h);
    t.drawImage(src, 0, 0, w, h);
    t.globalCompositeOperation = 'saturation';
    t.fillStyle = 'hsl(0, 0%, 50%)';
    t.fillRect(0, 0, w, h);
    t.globalCompositeOperation = 'source-over';
    t.globalAlpha = 1;
  }

  function lumaAt(data, pw, ph, u, v) {
    const x = clamp(Math.round(u * (pw - 1)), 0, pw - 1);
    const y = clamp(Math.round(v * (ph - 1)), 0, ph - 1);
    const i = (y * pw + x) * 4;
    return (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
  }

  // ---- auto levels --------------------------------------------------------
  // Print / stipple / halftone looks die on low-key footage (everything lands
  // under the ink threshold and the frame goes black). Every tonal shader
  // normalises the current plate to a 5-98 percentile window first, so a dark
  // night plate and a bright sky plate both land in the effect's sweet spot.
  let PLATE_MIN = 0;
  let PLATE_MAX = 1;
  let PLATE_MIX = 0;
  function autoLevels(data, loPct, hiPct, mix) {
    PLATE_MIX = mix === undefined ? 0 : mix;
    const hist = new Uint32Array(64);
    const n = data.length >> 2;
    if (!n) return;
    for (let i = 0; i < data.length; i += 4) {
      const l = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      hist[Math.min(63, (l * 64) | 0)]++;
    }
    const q = (pct) => {
      const target = n * pct;
      let acc = 0;
      for (let b = 0; b < 64; b++) {
        acc += hist[b];
        if (acc >= target) return b / 64;
      }
      return 1;
    };
    const lo = q(loPct === undefined ? 0.05 : loPct);
    let hi = q(hiPct === undefined ? 0.98 : hiPct);
    // flat / near-black plates must not get their sensor noise amplified
    if (hi - lo < 0.12) hi = lo + 0.12;
    PLATE_MIN = lo;
    PLATE_MAX = hi;
  }
  function nl(v) {
    const n = clamp((v - PLATE_MIN) / (PLATE_MAX - PLATE_MIN), 0, 1);
    // an optional blend back toward the untouched plate keeps normalised
    // footage from turning into a hard black/white poster
    return PLATE_MIX > 0 ? n * (1 - PLATE_MIX) + clamp(v, 0, 1) * PLATE_MIX : n;
  }

  const DOT_CACHE = new Map();
  function dotCloud(n, seed) {
    const key = n + '|' + seed;
    if (DOT_CACHE.has(key)) return DOT_CACHE.get(key);
    const arr = new Array(n);
    for (let i = 0; i < n; i++) {
      arr[i] = {
        u: hash2(i * 1.37 + seed, 3.71),
        v: hash2(i * 2.11 + seed, 9.37),
        s: hash2(i * 0.77 + seed, 5.13)
      };
    }
    DOT_CACHE.set(key, arr);
    return arr;
  }

  // Mono "print" plate: luminance → contrast S-curve + gamma, rendered into TMP2
  function monoPrintPlate(w, h, contrast, gamma) {
    buffers(w, h);
    autoLevels(sampleSmall(80, 45).data);
    // render the mono plate at ~60% of frame width so 4K plates keep real
    // micro-detail instead of a soft 1400px blow-up
    const pw = Math.round(clamp(w * 0.45, 320, 1900));
    const ph = Math.max(8, Math.round((pw * h) / w));
    const low = lowRes(pw, ph, (d) => {
      for (let i = 0; i < d.length; i += 4) {
        let l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
        l = nl(l);
        // gentle S-curve with a filmic shoulder — print contrast without
        // clipping every highlight into a white blob
        l = clamp((l - 0.46) * contrast + 0.46, 0, 1);
        l = l * l * (3 - 2 * l) * 0.72 + l * 0.28;
        l = Math.pow(clamp(l, 0, 1), gamma);
        const v = l * 255;
        d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
      }
    });
    // dedicated plate buffer: callers composite from here, so they never have
    // to copy a full 4K frame between scratch canvases
    if (!PLATE) { PLATE = mkCanvas(w, h); PLATECTX = PLATE.getContext('2d'); }
    fit(PLATE, w, h);
    PLATECTX.setTransform(1, 0, 0, 1, 0, 0);
    PLATECTX.globalCompositeOperation = 'source-over';
    PLATECTX.globalAlpha = 1;
    PLATECTX.clearRect(0, 0, w, h);
    PLATECTX.drawImage(low, 0, 0, w, h);
    return PLATE;
  }

  // Cached "cabinet" lighting: plinth glow (screen) over a lens vignette.
  // Static for a given frame size, so it is built once and blitted.
  function cabinetLight(ctx, w, h, glow, vig) {
    if (!CAB || CABW !== w || CABH !== h) {
      CAB = mkCanvas(w, h);
      CABW = w; CABH = h;
      const c = CAB.getContext('2d');
      // plinth glow (screen layer)
      const g = c.createRadialGradient(w * 0.5, h * 1.04, 4, w * 0.5, h * 1.04, w * 0.7);
      g.addColorStop(0, 'rgba(150,175,215,1)');
      g.addColorStop(0.5, 'rgba(80,100,140,0.42)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = 'destination-out';
      // keep only the glow part of this canvas (vignette lives below)
      const vgClear = c.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.2, w * 0.5, h * 0.5, w * 0.62);
      vgClear.addColorStop(0, 'rgba(0,0,0,0)');
      vgClear.addColorStop(1, 'rgba(0,0,0,0.35)');
      c.fillStyle = vgClear;
      c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = 'source-over';

      CABV = mkCanvas(w, h);
      const v = CABV.getContext('2d');
      const vg = v.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.2, w * 0.5, h * 0.5, w * 0.62);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,1)');
      v.fillStyle = vg;
      v.fillRect(0, 0, w, h);
    }
    if (glow > 0.005) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = clamp(glow, 0, 1);
      ctx.drawImage(CAB, 0, 0);
      ctx.restore();
    }
    if (vig > 0.005) {
      ctx.save();
      ctx.globalAlpha = clamp(vig, 0, 0.95);
      ctx.drawImage(CABV, 0, 0);
      ctx.restore();
    }
  }

  function printBackdrop(ctx, w, h, I, darkness) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = Math.min(1, darkness === undefined ? 0.2 + I * 0.8 : darkness);
    ctx.fillStyle = '#03040a';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function accentGlow(ctx, w, h, color, alpha) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(w * 0.5, h * 0.5, 4, w * 0.5, h * 0.5, w * 0.62);
    g.addColorStop(0, color + Math.round(Math.min(1, alpha) * 255).toString(16).padStart(2, '0'));
    g.addColorStop(1, color + '00');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // =========================================================================
  // 12 TOUCHDESIGNER TOP SHADERS
  // =========================================================================
  const SHADERS = {
    td_displace(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const amp = (16 + 26 * I) * (1 + beat * 0.35);
      const field = (u, v, axis) => {
        if (axis === 0) return (fbm(u * 3.4 + t * 0.42, 0.31 + t * 0.16, 3) - 0.5) * 2;
        return (fbm(0.27, v * 3.0 - t * 0.3, 3) - 0.5) * 2;
      };
      bandWarp(ctx, src, w, h, field, amp, { step: 4, yScale: 0.6 });

      // chroma refraction fringe
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.16 * Math.min(1, I);
      ctx.drawImage(SRC, -6 * I, 0, w, h);
      ctx.globalAlpha = 0.12 * Math.min(1, I);
      ctx.drawImage(SRC, 6 * I, 0, w, h);
      ctx.restore();

      // UV field telemetry
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = 'rgba(255,255,255,0.075)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        const yy = (i / 16) * h;
        for (let x = 0; x <= w; x += 12) {
          const n = fbm((x / w) * 3.4 + t * 0.42, 0.31 + t * 0.16, 3) - 0.5;
          const py = yy + n * amp * 0.5;
          if (x === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
        }
        ctx.stroke();
      }
      ctx.restore();
      accentGlow(ctx, w, h, preset.accent || '#e11d48', 0.05 * I);
    },

    td_feedback(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const zoom = 1 + (0.010 + 0.030 * I) * (1 + beat * 0.4);
      const rot = (0.0015 + 0.004 * I) * Math.sin(t * 0.7);
      const drift = (0.4 + 1.2 * I) * RS;
      const decay = clamp(0.90 + 0.05 * Math.min(1, I), 0.85, 0.965);

      const fb = feedbackStep(w, h, src, { zoom, rot, dy: drift, decay, gain: 1.15 });

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = Math.min(1, 0.45 + 0.4 * Math.min(1, I));
      ctx.drawImage(fb, 0, 0, w, h);
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.55;
      ctx.drawImage(src, 0, 0, w, h);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `rgba(244,63,94,${0.10 + 0.10 * Math.min(1, I)})`;
      ctx.lineWidth = Math.max(1, rpx(0.35));
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, Math.min(w, h) * (0.18 + 0.05 * Math.sin(t * 1.6)), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      accentGlow(ctx, w, h, preset.accent || '#f43f5e', 0.04 * I);
    },

    td_blobtrack(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.drawImage(src, 0, 0, w, h);
      ctx.restore();

      const sw = 96, sh = 54;
      const img = sampleSmall(sw, sh);
      const d = img.data;
      const cell = 6;
      const cols = Math.floor(sw / cell), rows = Math.floor(sh / cell);
      const on = new Uint8Array(cols * rows);
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          let sum = 0;
          for (let y = 0; y < cell; y++) {
            for (let x = 0; x < cell; x++) {
              const px = gx * cell + x, py = gy * cell + y;
              const i = (py * sw + px) * 4;
              sum += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
            }
          }
          on[gy * cols + gx] = sum / (cell * cell) > 0.55 ? 1 : 0;
        }
      }

      // flood fill blobs
      const seen = new Uint8Array(cols * rows);
      const blobs = [];
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const idx = gy * cols + gx;
          if (!on[idx] || seen[idx]) continue;
          const stack = [[gx, gy]];
          seen[idx] = 1;
          let minX = gx, maxX = gx, minY = gy, maxY = gy, count = 0;
          while (stack.length) {
            const [cx, cy] = stack.pop();
            count++;
            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;
            for (let oy = -1; oy <= 1; oy++) {
              for (let ox = -1; ox <= 1; ox++) {
                const nx = cx + ox, ny = cy + oy;
                if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
                const ni = ny * cols + nx;
                if (on[ni] && !seen[ni]) { seen[ni] = 1; stack.push([nx, ny]); }
              }
            }
          }
          if (count >= 3) {
            blobs.push({
              x: (minX / cols) * w,
              y: (minY / rows) * h,
              w: ((maxX - minX + 1) / cols) * w,
              h: ((maxY - minY + 1) / rows) * h,
              cx: ((minX + maxX + 1) / 2 / cols) * w,
              cy: ((minY + maxY + 1) / 2 / rows) * h,
              area: count
            });
          }
        }
      }

      const accent = preset.accent || '#22d3ee';
      ctx.save();
      ctx.strokeStyle = accent;
      ctx.fillStyle = accent;
      ctx.lineWidth = rpxMin(1.4);
      ctx.font = `700 ${Math.max(9, Math.round(rpx(9)))}px "SF Mono", monospace`;
      blobs.slice(0, 6).forEach((b, i) => {
        const pad = rpx(4 + I * 4);
        ctx.globalAlpha = 0.9;
        ctx.strokeRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2);
        // corner ticks
        const c = rpx(6);
        ctx.beginPath();
        ctx.moveTo(b.x - pad, b.y - pad + c); ctx.lineTo(b.x - pad, b.y - pad); ctx.lineTo(b.x - pad + c, b.y - pad);
        ctx.moveTo(b.x + b.w + pad - c, b.y - pad); ctx.lineTo(b.x + b.w + pad, b.y - pad); ctx.lineTo(b.x + b.w + pad, b.y - pad + c);
        ctx.moveTo(b.x - pad, b.y + b.h + pad - c); ctx.lineTo(b.x - pad, b.y + b.h + pad); ctx.lineTo(b.x - pad + c, b.y + b.h + pad);
        ctx.moveTo(b.x + b.w + pad - c, b.y + b.h + pad); ctx.lineTo(b.x + b.w + pad, b.y + b.h + pad); ctx.lineTo(b.x + b.w + pad, b.y + b.h + pad - c);
        ctx.stroke();

        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.moveTo(b.cx - 7, b.cy); ctx.lineTo(b.cx + 7, b.cy);
        ctx.moveTo(b.cx, b.cy - 7); ctx.lineTo(b.cx, b.cy + 7);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(b.cx, b.cy, rpx(3 + Math.sin(t * 4 + i) * 1.2), 0, Math.PI * 2);
        ctx.fill();

        // velocity vector
        const vx = rpx(Math.cos(t * 1.3 + i * 1.7) * 22 * I);
        const vy = rpx(Math.sin(t * 1.1 + i) * 12 * I);
        ctx.beginPath();
        ctx.moveTo(b.cx, b.cy);
        ctx.lineTo(b.cx + vx, b.cy + vy);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(b.cx + vx, b.cy + vy, rpxMin(2), 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.85;
        ctx.fillText(`ID:${String(i + 1).padStart(2, '0')}  CX:${Math.round(b.cx)} CY:${Math.round(b.cy)}  A:${b.area}`, b.x - pad + 2, b.y - pad - 4 > 10 ? b.y - pad - 4 : b.y + b.h + pad + 10);
      });

      // HUD
      ctx.globalAlpha = 0.8;
      ctx.font = `700 ${Math.max(9, Math.round(rpx(9)))}px "SF Mono", monospace`;
      ctx.fillStyle = 'rgba(9,12,18,0.72)';
      ctx.fillRect(rpx(8), rpx(8), rpx(132), rpx(17));
      ctx.fillStyle = accent;
      ctx.fillText(`BLOB TRACK  ${blobs.length} BLOBS`, rpx(13), rpx(19));
      ctx.restore();
    },

    td_ruttetra(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const pw = Math.round(clamp(168 * RS, 168, 620));
      const ph = Math.max(14, Math.round((pw * h) / w));
      const amp = (10 + 46 * I) * RS;
      const low = lowRes(pw, ph, (data) => {
        const out = new Uint8ClampedArray(data);
        for (let y = 0; y < ph; y++) {
          for (let x = 0; x < pw; x++) {
            const li = (y * pw + x) * 4;
            const lum = (0.2126 * data[li] + 0.7152 * data[li + 1] + 0.0722 * data[li + 2]) / 255;
            const shift = (lum - 0.5) * amp;
            const sx = clamp(Math.round(x + shift), 0, pw - 1);
            const si = (y * pw + sx) * 4;
            const di = li;
            out[di] = data[si] * (0.75 + lum * 0.5);
            out[di + 1] = data[si + 1] * (0.8 + lum * 0.45);
            out[di + 2] = data[si + 2] * (0.95 + lum * 0.35);
            out[di + 3] = 255;
          }
        }
        data.set(out);
      });

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#04050a';
      ctx.fillRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = 0.96;
      ctx.drawImage(low, 0, 0, w, h);
      ctx.restore();

      // scanline gaps => extrusion read
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      const gap = Math.max(2, Math.round(h / 150));
      for (let y = 0; y < h; y += gap * 2) ctx.fillRect(0, y, w, gap);
      ctx.restore();

      // Z-extrusion echo
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.16 * Math.min(1, I);
      ctx.drawImage(low, 3 * I, 0, w, h);
      ctx.restore();
      accentGlow(ctx, w, h, preset.accent || '#38bdf8', 0.045 * I);
    },

    td_pixelsort(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.drawImage(src, 0, 0, w, h);
      ctx.restore();

      const pw = Math.round(clamp(220 * RS, 220, 760));
      const ph = Math.max(16, Math.round((pw * h) / w));
      const thresh = 0.34 + (1 - Math.min(1, I)) * 0.35;
      const low = lowRes(pw, ph, (data) => {
        for (let x = 0; x < pw; x++) {
          let y = 0;
          while (y < ph) {
            const i0 = (y * pw + x) * 4;
            const l0 = (0.2126 * data[i0] + 0.7152 * data[i0 + 1] + 0.0722 * data[i0 + 2]) / 255;
            if (l0 < thresh) { y++; continue; }
            let end = y;
            while (end < ph) {
              const ie = (end * pw + x) * 4;
              const le = (0.2126 * data[ie] + 0.7152 * data[ie + 1] + 0.0722 * data[ie + 2]) / 255;
              if (le < thresh) break;
              end++;
            }
            const run = [];
            for (let k = y; k < end; k++) {
              const ik = (k * pw + x) * 4;
              const lk = 0.2126 * data[ik] + 0.7152 * data[ik + 1] + 0.0722 * data[ik + 2];
              run.push([data[ik], data[ik + 1], data[ik + 2], lk]);
            }
            run.sort((a, b) => a[3] - b[3]);
            for (let k = 0; k < run.length; k++) {
              const ik = ((y + k) * pw + x) * 4;
              const c = run[k];
              data[ik] = c[0]; data[ik + 1] = c[1]; data[ik + 2] = c[2];
            }
            y = end;
          }
        }
      });

      ctx.save();
      ctx.globalAlpha = 0.55 + 0.4 * Math.min(1, I);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(low, 0, 0, w, h);
      ctx.restore();
      accentGlow(ctx, w, h, preset.accent || '#a855f7', 0.06 * I);
    },

    td_slitscan(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      if (!SLIT) { SLIT = mkCanvas(w, h); SLCTX = SLIT.getContext('2d'); }
      fit(SLIT, w, h);
      if (slitW !== w || slitH !== h) {
        slitW = w; slitH = h;
        SLCTX.clearRect(0, 0, w, h);
        SLCTX.drawImage(SRC, 0, 0);
      }
      const k = Math.max(1, Math.round(1 + 7 * I));
      SLCTX.save();
      SLCTX.globalCompositeOperation = 'copy';
      SLCTX.drawImage(SLIT, -k, 0);
      SLCTX.globalCompositeOperation = 'source-over';
      SLCTX.drawImage(SRC, w - k, 0, k, h, w - k, 0, k, h);
      SLCTX.restore();

      ctx.save();
      ctx.globalAlpha = 1;
      ctx.drawImage(SRC, 0, 0, w, h);
      ctx.globalAlpha = 0.35 + 0.6 * Math.min(1, I);
      ctx.drawImage(SLIT, 0, 0, w, h);
      ctx.restore();

      // slit seams
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = 'rgba(251,191,36,0.22)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const x = ((i / 12) * w + (t * 22 * I) % (w / 12)) % w;
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.restore();
    },

    td_rdmelt(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const amp = 6 + 30 * I;
      const field = (u, v) => (fbm(u * 2.2 + t * 0.2, v * 2.2 - t * 0.14, 3) - 0.5) * 2;
      bandWarp(ctx, src, w, h, field, amp, { step: 4, yScale: 0.85 });

      // growing melt cells (destination-out + rim light)
      const cells = 7;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < cells; i++) {
        const px = w * (0.12 + 0.76 * vnoise(i * 3.1 + t * 0.16, 0.5));
        const py = h * (0.12 + 0.76 * vnoise(0.7, i * 2.3 - t * 0.13));
        const r = (0.04 + 0.09 * I) * Math.min(w, h) * (0.7 + vnoise(i * 1.7, t * 0.5));
        const g = ctx.createRadialGradient(px, py, r * 0.15, px, py, r);
        g.addColorStop(0, 'rgba(0,0,0,0.95)');
        g.addColorStop(0.62, 'rgba(0,0,0,0.6)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.lineWidth = 1.6;
      for (let i = 0; i < cells; i++) {
        const px = w * (0.12 + 0.76 * vnoise(i * 3.1 + t * 0.16, 0.5));
        const py = h * (0.12 + 0.76 * vnoise(0.7, i * 2.3 - t * 0.13));
        const r = (0.04 + 0.09 * I) * Math.min(w, h) * (0.7 + vnoise(i * 1.7, t * 0.5));
        ctx.strokeStyle = `rgba(16,185,129,${0.16 + 0.28 * Math.min(1, I)})`;
        ctx.beginPath();
        ctx.arc(px, py, r * 0.92, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      accentGlow(ctx, w, h, preset.accent || '#10b981', 0.06 * I);
    },

    td_ascii(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const SH0 = Math.max(20, Math.round((160 * h) / w));
      const data = sampleSmall(160, SH0).data;
      autoLevels(data, 0.04, 0.99, 0.20);
      const SW = 160, SH = SH0;

      // dark ground with a ghost of the plate so the raster reads as the image
      ctx.save();
      ctx.fillStyle = '#03060a';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.18;
      ctx.drawImage(src, 0, 0, w, h);
      ctx.restore();

      const ramp = ' .:-=+*#%@';
      const cols = Math.round(clamp(64 * Math.pow(Math.min(w, h) / 1080, 0.35), 48, 96));
      const cellW = w / cols;
      const cellH = cellW * 0.58;
      const rows = Math.ceil(h / cellH);

      const accent = preset.accent || '#4ade80';
      const glyphCell = Math.min(96, Math.max(20, Math.round(cellW)));
      const atlasKey = accent + '|' + glyphCell + '|' + Math.round(cellH);
      if (!ATLAS || atlasTint !== atlasKey) {
        ATLAS = mkCanvas(glyphCell * ramp.length, Math.ceil(cellH) + 2);
        ATLASCTX = ATLAS.getContext('2d');
        ATLASCTX.clearRect(0, 0, ATLAS.width, ATLAS.height);
        ATLASCTX.font = `700 ${Math.max(8, Math.round(cellH * 0.92))}px "SF Mono", Menlo, monospace`;
        ATLASCTX.textBaseline = 'middle';
        ATLASCTX.textAlign = 'center';
        ATLASCTX.fillStyle = accent;
        for (let i = 0; i < ramp.length; i++) {
          ATLASCTX.fillText(ramp[i], i * glyphCell + glyphCell * 0.5, ATLAS.height * 0.52);
        }
        atlasTint = atlasKey;
      }

      const AY = ATLAS.height;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const u = (gx + 0.5) / cols, v = (gy + 0.5) / rows;
          const sx = clamp(Math.round(u * (SW - 1)), 0, SW - 1);
          const sy = clamp(Math.round(v * (SH - 1)), 0, SH - 1);
          const i = (sy * SW + sx) * 4;
          const lum = nl((0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255);
          // a gamma lift on the ramp index keeps the mid-tones as denser glyphs,
          // otherwise a low-key plate renders as almost empty space
          const gi = Math.min(ramp.length - 1, Math.floor(Math.pow(lum, 0.72) * (ramp.length - 0.001)));
          if (gi === 0) continue;
          ctx.globalAlpha = Math.min(1, (0.22 + Math.pow(lum, 0.8) * 0.9) * (0.45 + I * 0.55));
          ctx.drawImage(ATLAS, gi * glyphCell, 0, glyphCell, AY,
            gx * cellW, gy * cellH, cellW, cellH);
        }
      }
      ctx.restore();

      // phosphor scan sweep
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const sweepY = ((t * 120) % (h + 200)) - 100;
      const g = ctx.createLinearGradient(0, sweepY - rpx(30), 0, sweepY + rpx(30));
      g.addColorStop(0, 'rgba(74,222,128,0)');
      g.addColorStop(0.5, `rgba(74,222,128,${0.06 * Math.min(1, I)})`);
      g.addColorStop(1, 'rgba(74,222,128,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, sweepY - rpx(30), w, rpx(60));
      ctx.restore();
    },

    td_kaleido(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const slices = 8;
      const cx = w / 2, cy = h / 2;
      const rot = t * 0.12 * (0.4 + I) + beat * 0.12 * I;
      const radius = Math.hypot(w, h);

      ctx.save();
      ctx.fillStyle = '#05060b';
      ctx.fillRect(0, 0, w, h);
      ctx.translate(cx, cy);
      for (let i = 0; i < slices; i++) {
        ctx.save();
        ctx.rotate(rot + (i * Math.PI * 2) / slices);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, -Math.PI / slices, Math.PI / slices);
        ctx.closePath();
        ctx.clip();
        const zoom = 1.08 + 0.22 * I;
        ctx.scale(i % 2 === 0 ? zoom : -zoom, zoom);
        ctx.drawImage(src, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
      ctx.restore();

      // mirrored centre bloom + wedge wires
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `rgba(192,132,252,${0.10 + 0.2 * Math.min(1, I)})`;
      ctx.lineWidth = rpxMin(1);
      for (let i = 0; i < slices; i++) {
        const a = rot + (i * Math.PI * 2) / slices;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
        ctx.stroke();
      }
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, Math.min(w, h) * 0.3);
      g.addColorStop(0, `rgba(230,190,255,${0.18 * Math.min(1, I)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    },

    td_flowwarp(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      ctx.save();
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, w, h);

      // mesh + displacement scale with the frame, so the warp reads exactly
      // the same at 1080p and 4K (fixed 14x8 tiles vanish into 4K pixels)
      const cols = Math.round(clamp(14 * (RS / 3), 8, 44));
      const rows = Math.round(clamp(8 * (RS / 3), 5, 26));
      const tileW = w / cols, tileH = h / rows;
      const ax = rpx(14.7) * Math.min(1.8, I);
      const ay = rpx(8.7) * Math.min(1.8, I);
      for (let gy = -1; gy <= rows; gy++) {
        for (let gx = -1; gx <= cols; gx++) {
          const u = gx / cols, v = gy / rows;
          const n1 = fbm(u * 2.6 + t * 0.22, v * 2.6 - t * 0.15, 3) - 0.5;
          const n2 = fbm(u * 2.6 + 4.7 + t * 0.22, v * 2.6 + 9.1 - t * 0.15, 3) - 0.5;
          const dx = n1 * ax;
          const dy = n2 * ay;
          const ov = Math.max(2, rpx(1.5));
          ctx.drawImage(src, gx * tileW, gy * tileH, tileW + ov, tileH + ov,
            gx * tileW + dx, gy * tileH + dy, tileW + ov, tileH + ov);
        }
      }
      ctx.restore();

      // vector field glyphs
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `rgba(96,165,250,${0.10 + 0.22 * Math.min(1, I)})`;
      ctx.lineWidth = Math.max(1, rpx(0.34));
      for (let gy = 1; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const u = gx / cols, v = gy / rows;
          const n1 = fbm(u * 2.6 + t * 0.22, v * 2.6 - t * 0.15, 3) - 0.5;
          const n2 = fbm(u * 2.6 + 4.7 + t * 0.22, v * 2.6 + 9.1 - t * 0.15, 3) - 0.5;
          const px = u * w, py = v * h;
          const len = rpx(4 + 8 * Math.min(1, I));
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + n1 * len * 2, py + n2 * len * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
      accentGlow(ctx, w, h, preset.accent || '#60a5fa', 0.05 * I);
    },

    td_chladni(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const n = 3, m = 5 + Math.round(beat * 2);
      const amp = rpx(1.3 + 10 * I);
      const field = (u, v, axis) => {
        const a = Math.cos(n * Math.PI * u) * Math.cos(m * Math.PI * v);
        const b = Math.cos(m * Math.PI * u) * Math.cos(n * Math.PI * v);
        return (a - b) * Math.sin(t * 0.6 + v * 2);
      };
      bandWarp(ctx, src, w, h, field, amp, { step: 4, yScale: 1 });

      // nodal overlay, computed at low res
      const pw = Math.round(clamp(128 * RS, 128, 480));
      const ph = Math.max(12, Math.round((pw * h) / w));
      const img = lowRes(pw, ph, (data) => {
        const out = new Uint8ClampedArray(data);
        for (let y = 0; y < ph; y++) {
          for (let x = 0; x < pw; x++) {
            const u = x / pw, v = y / ph;
            const a = Math.cos(n * Math.PI * u) * Math.cos(m * Math.PI * v);
            const b = Math.cos(m * Math.PI * u) * Math.cos(n * Math.PI * v);
            const val = Math.abs(a - b);
            const edge = Math.pow(clamp(1 - val * 3.2, 0, 1), 2.2);
            const i = (y * pw + x) * 4;
            out[i] = 250;
            out[i + 1] = 200;
            out[i + 2] = 60;
            out[i + 3] = edge * 255;
          }
        }
        data.set(out);
      });
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.28 + 0.4 * Math.min(1, I);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();
      accentGlow(ctx, w, h, preset.accent || '#facc15', 0.05 * I);
    },

    td_datamosh(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      if (!FB) { FB = mkCanvas(w, h); FBCTX = FB.getContext('2d'); }
      fit(FB, w, h);
      if (!blockState || blockState.length !== 16 * 9) {
        blockState = [];
        for (let i = 0; i < 16 * 9; i++) {
          blockState.push({ dx: 0, dy: 0, stale: 0, seed: Math.random() * 100 });
        }
      }

      const bw = w / 16, bh = h / 9;
      ctx.save();
      ctx.fillStyle = '#05060b';
      ctx.fillRect(0, 0, w, h);
      for (let gy = 0; gy < 9; gy++) {
        for (let gx = 0; gx < 16; gx++) {
          const idx = gy * 16 + gx;
          const st = blockState[idx];
          const tick = Math.floor(t * 8 + st.seed);
          const r = hash2(gx * 3.1 + tick * 0.7, gy * 5.3 + tick * 0.3);
          const stale = r > 0.78 - 0.1 * I;
          if (stale) {
            // stale macroblock: hold the previous frame
            ctx.globalAlpha = 0.9;
            ctx.drawImage(FB, gx * bw, gy * bh, bw, bh, gx * bw, gy * bh, bw, bh);
            continue;
          }
          const dx = (hash2(gx + tick, gy * 2.7) - 0.5) * 34 * I;
          const dy = (hash2(gy + tick * 1.3, gx) - 0.5) * 20 * I;
          ctx.globalAlpha = 1;
          ctx.drawImage(src, gx * bw - dx, gy * bh - dy, bw, bh, gx * bw, gy * bh, bw, bh);
        }
      }
      ctx.restore();

      // motion vector overlay
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `rgba(251,113,133,${0.10 + 0.26 * Math.min(1, I)})`;
      ctx.lineWidth = 1;
      for (let gy = 0; gy < 9; gy += 2) {
        for (let gx = 0; gx < 16; gx += 2) {
          const idx = gy * 16 + gx;
          const st = blockState[idx];
          const tick = Math.floor(t * 8 + st.seed);
          const dx = (hash2(gx + tick, gy * 2.7) - 0.5) * 34 * I;
          const dy = (hash2(gy + tick * 1.3, gx) - 0.5) * 20 * I;
          const px = gx * bw + bw / 2, py = gy * bh + bh / 2;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + dx * 0.9, py + dy * 0.9);
          ctx.stroke();
        }
      }
      ctx.restore();

      // refresh the hold buffer
      FBCTX.clearRect(0, 0, w, h);
      FBCTX.drawImage(ctx.canvas, 0, 0);
    },

    // =====================================================================
    // DATA & PRINT TOPs — monochrome generative print/data treatments
    // =====================================================================

    // Reference look 1: horizontal slab decomposition + lenticular rib screen
    td_bandslice(ctx, w, h, t, I, beat, preset) {
      capture(ctx.canvas);
      buffers(w, h);
      const drive = Math.min(1.6, 0.3 + I * 1.1);
      const bands = Math.round(14 + 12 * Math.min(1, I));
      const step = h / bands;

      // 1. mono print plate → PLATE (dedicated buffer, no 4K copy needed)
      const plate = monoPrintPlate(w, h, 1.45 + I * 0.45, 1.02);

      // 2. slab decomposition onto black, each slab shoved by its own noise
      T2.setTransform(1, 0, 0, 1, 0, 0);
      T2.globalCompositeOperation = 'source-over';
      T2.globalAlpha = 1;
      T2.fillStyle = '#03040a';
      T2.fillRect(0, 0, w, h);

      const slabs = [];
      for (let i = 0; i < bands; i++) {
        const seed = i * 13.71;
        const y = i * step;
        if (y >= h) break;
        const rowH = Math.min(step * (0.82 + hash2(seed, 2.3) * 0.7), h - y);
        const n = fbm(seed * 0.07 + t * 0.09 * drive, 4.2, 2) - 0.5;
        const cascade = Math.sin((i / bands) * Math.PI) * (i % 2 === 0 ? 1 : -0.5);
        const dx = (n * 1.2 + cascade * 0.6) * w * 0.36 * drive;
        slabs.push({ y, rowH, dx });
        // source rect already confines the slab to its band, so no clip() —
        // 24 full-frame clips were most of this shader's 4K budget
        T2.drawImage(plate, 0, y, w, rowH, dx, y, w, rowH);
      }

      // 3. lenticular rib screen inside the slabs
      T2.globalCompositeOperation = 'source-over';
      T2.globalAlpha = 1;
      const ribPitch = Math.round(clamp(rpx(9), 8, 120));
      ribScreen(T2, w, h, ribPitch, Math.min(1, 0.40 + I * 0.55), 0, 0);

      // 4. bright step edges where slabs were displaced
      T2.globalCompositeOperation = 'screen';
      slabs.forEach((sl) => {
        const edge = Math.min(1, Math.abs(sl.dx) / (w * 0.14));
        if (edge < 0.04) return;
        T2.globalAlpha = 0.05 + 0.22 * edge * Math.min(1, I);
        T2.fillStyle = '#dbe4f2';
        T2.fillRect(Math.max(0, sl.dx), sl.y, Math.max(1.5, w * 0.008), sl.rowH);
      });
      T2.globalCompositeOperation = 'source-over';
      T2.globalAlpha = 1;

      // 5. composite: black cabinet + a whisper of the original colour plate
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#03040a';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = Math.min(1, 0.06 + I * 0.30);
      ctx.drawImage(SRC, 0, 0, w, h);
      ctx.globalAlpha = Math.min(0.9, 0.18 + I * 0.62);
      ctx.drawImage(TMP2, 0, 0, w, h);
      ctx.restore();

      cabinetLight(ctx, w, h, 0.18 * Math.min(1, I), 0.5 * Math.min(1, 0.5 + I));
    },

    // Reference look 1 (texture): full-frame lenticular rib sheet
    td_lenticular(ctx, w, h, t, I, beat, preset) {
      capture(ctx.canvas);
      buffers(w, h);
      const k = 1.02 + 0.05 * Math.min(1.4, I);

      // mono print plate, overscanned so the rib sheet can parallax
      const plate = monoPrintPlate(w, h, 1.30 + I * 0.40, 1.0);
      T1.setTransform(1, 0, 0, 1, 0, 0);
      T1.globalCompositeOperation = 'source-over';
      T1.globalAlpha = 1;
      T1.clearRect(0, 0, w, h);
      T1.drawImage(plate, -(k - 1) * w * 0.5, -(k - 1) * h * 0.5, w * k, h * k);

      // the lenticular rib screen rides directly on the plate buffer
      const basePitch = Math.round(clamp(rpx(8.5), 7, 110));
      const pitch = Math.max(6, Math.round(basePitch * (1.2 - Math.min(0.5, I * 0.4))));
      ribScreen(T1, w, h, pitch, Math.min(1, 0.45 + I * 0.5), Math.min(0.10, 0.02 + I * 0.06), 0);

      ctx.save();
      ctx.fillStyle = '#03040a';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.55 + 0.42 * Math.min(1, I);
      ctx.drawImage(TMP1, 0, 0, w, h);
      ctx.restore();

      // sheet sheen so the rib sheet reads as a physical panel
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const sheen = ctx.createLinearGradient(0, 0, w, h);
      sheen.addColorStop(0, `rgba(170,195,235,${0.10 * Math.min(1, I)})`);
      sheen.addColorStop(0.55, 'rgba(120,150,200,0.02)');
      sheen.addColorStop(1, `rgba(200,220,255,${0.09 * Math.min(1, I)})`);
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      cabinetLight(ctx, w, h, 0.10 * Math.min(1, I), 0.4 * Math.min(1, 0.5 + I));
    },

    // Reference look 2: crisp barcode-block halftone on black
    td_barcode(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const pw = 48, ph = 30;
      const data = sampleSmall(pw, ph).data;
      const cw = w / pw, chh = h / ph;
      const amt = Math.min(1, 0.25 + I * 0.9);

      printBackdrop(ctx, w, h, I, amt);
      ctx.save();
      ctx.globalAlpha = Math.min(1, 0.35 + I * 0.65);
      ctx.fillStyle = '#f8fafc';
      const tick = Math.floor(t * 6);
      for (let gy = 0; gy < ph; gy++) {
        for (let gx = 0; gx < pw; gx++) {
          const lum = Math.pow(lumaAt(data, pw, ph, (gx + 0.5) / pw, (gy + 0.5) / ph), 0.75);
          if (lum < 0.14) continue;
          const rnd = hash2(gx * 3.7 + tick * 0.13, gy * 5.1);
          const span = lum > 0.6 ? 2.6 : lum > 0.32 ? 1.8 : 1.1;
          const barW = Math.min(cw * 0.92, Math.max(cw * 0.18, lum * cw * span * (0.8 + rnd * 0.2)));
          const barH = chh * (0.3 + lum * 0.34);
          ctx.fillRect(gx * cw + cw * 0.04, gy * chh + (chh - barH) / 2, barW, barH);
        }
      }
      ctx.restore();
    },

    // 1-bit ordered dither (Bayer 8×8)
    td_bayer(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const pw = Math.round(clamp(240 * RS, 240, 1440));
      const ph = Math.max(24, Math.round((pw * h) / w));
      autoLevels(sampleSmall(64, 36).data, 0.03, 0.99, 0.0);
      const BAYER = [
        0, 32, 8, 40, 2, 34, 10, 42,
        48, 16, 56, 24, 50, 18, 58, 26,
        12, 44, 4, 36, 14, 46, 6, 38,
        60, 28, 52, 20, 62, 30, 54, 22,
        3, 35, 11, 43, 1, 33, 9, 41,
        51, 19, 59, 27, 49, 17, 57, 25,
        15, 47, 7, 39, 13, 45, 5, 37,
        63, 31, 55, 23, 61, 29, 53, 21
      ];
      const dither = lowRes(pw, ph, (d) => {
        for (let y = 0; y < ph; y++) {
          for (let x = 0; x < pw; x++) {
            const i = (y * pw + x) * 4;
            const lum = nl((0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255);
            const th = (BAYER[(y & 7) * 8 + (x & 7)] + 0.5) / 64;
            const on = lum > th;
            const v = on ? 255 : 0;
            d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
          }
        }
      });

      printBackdrop(ctx, w, h, I, 0.16 + I * 0.6);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, 0.25 + I * 0.85);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(dither, 0, 0, w, h);
      ctx.restore();
    },

    // Reference look 3: fine-grain stipple portrait (dot density follows luma)
    // Rendered into a half-res ImageData buffer (pure JS writes = fast grain)
    td_stipple(ctx, w, h, t, I, beat, preset) {
      capture(ctx.canvas);
      const pw = 150, ph = Math.round((150 * h) / w);
      const data = sampleSmall(pw, ph).data;

      const bufScale = QUALITY === 'export' ? 0.75 : 0.5;
      const BW = Math.max(64, Math.round(w * bufScale));
      const BH = Math.max(36, Math.round(h * bufScale));
      if (!LOW || LOW.width !== BW || LOW.height !== BH) {
        LOW = mkCanvas(BW, BH);
        LOWCTX = LOW.getContext('2d', { willReadFrequently: true });
      }
      const SW = LOW.width, SH = LOW.height;
      if (!stippleBuf || stippleBuf.width !== SW || stippleBuf.height !== SH) {
        stippleBuf = { width: SW, height: SH, data: new Uint8ClampedArray(SW * SH * 4) };
      }
      const buf = stippleBuf.data;
      buf.fill(0);

      // pre-pass: luma + contour tangent on a coarse grid
      const GW = 64, GH = Math.max(16, Math.round((64 * h) / w));
      autoLevels(data, 0.04, 0.98, 0.18);
      const lumGrid = new Float32Array(GW * GH);
      const tanGrid = new Float32Array(GW * GH);
      for (let gy = 0; gy < GH; gy++) {
        for (let gx = 0; gx < GW; gx++) {
          const idx = gy * GW + gx;
          const u = (gx + 0.5) / GW, v = (gy + 0.5) / GH;
          const raw = nl(lumaAt(data, pw, ph, u, v));
          lumGrid[idx] = clamp((Math.pow(raw, 0.6) - 0.16) / 0.84, 0, 1);
          const eps = 0.012;
          const gxx = Math.pow(nl(lumaAt(data, pw, ph, Math.min(0.999, u + eps), v)), 0.6)
                    - Math.pow(nl(lumaAt(data, pw, ph, Math.max(0, u - eps), v)), 0.6);
          const gyy = Math.pow(nl(lumaAt(data, pw, ph, u, Math.min(0.999, v + eps))), 0.6)
                    - Math.pow(nl(lumaAt(data, pw, ph, u, Math.max(0, v - eps))), 0.6);
          const drift = (fbm(u * 3.1 + t * 0.06, v * 3.1 - t * 0.045, 2) - 0.5) * 2.2;
          tanGrid[idx] = Math.atan2(gxx, -gyy) + drift;
        }
      }

      // grain lattice: pitch is authored in FRAME pixels (2.1 ref px) so the
      // stipple keeps the same visible grain from 1080p through 4K instead of
      // turning into sub-pixel noise; dots grow with the pitch.
      const pitch = Math.max(2.0, rpx(1.56) * bufScale);
      const cols = Math.floor(SW / pitch), rows = Math.floor(SH / pitch);
      const density = 0.9 + Math.min(1, I) * 0.35;
      const shearK = (1.1 * Math.min(1.5, I)) * bufScale;
      const dotBase = Math.max(1, Math.round(pitch * 0.56));

      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const seed = cx * 12.9898 + cy * 78.233;
          const jx = hash2(seed, 1.7);
          const jy = hash2(seed, 9.1);
          let px = cx * pitch + jx * pitch;
          let py = cy * pitch + jy * pitch;
          const u = px / SW, v = py / SH;
          const gx = clamp((u * GW) | 0, 0, GW - 1);
          const gy = clamp((v * GH) | 0, 0, GH - 1);
          const gidx = gy * GW + gx;
          const lum = lumGrid[gidx];
          // tone → ink: shadows stay empty (a stipple print has real blacks),
          // the probability climbs with tone so midtones read as texture and
          // highlights as solid grains rather than an even wash everywhere
          const tone = clamp((lum - 0.10) / 0.90, 0, 1);
          if (tone < 0.02) continue;
          const rnd = hash2(seed, 4.3);
          if (rnd > clamp(0.10 + Math.pow(tone, 0.95) * 1.12, 0, 1) * density) continue;
          const tang = tanGrid[gidx];
          const sh = (rnd - 0.5) * shearK;
          px += Math.cos(tang) * sh;
          py += Math.sin(tang) * sh;
          const ix = px | 0, iy = py | 0;
          if (ix < 0 || iy < 0 || ix >= SW || iy >= SH) continue;
          const rad = Math.max(1, Math.round(dotBase * (0.55 + tone * 0.85)));
          const val = 150 + tone * 105;
          const alpha = Math.min(242, (0.30 + tone * 0.68) * 255);
          for (let oy = 0; oy < rad; oy++) {
            const yy = iy + oy;
            if (yy >= SH) break;
            for (let ox = 0; ox < rad; ox++) {
              const xx = ix + ox;
              if (xx >= SW) break;
              const o = (yy * SW + xx) * 4;
              buf[o] = val; buf[o + 1] = val; buf[o + 2] = val; buf[o + 3] = alpha;
            }
          }
        }
      }

      const imgData = LOWCTX.createImageData(SW, SH);
      imgData.data.set(buf);
      LOWCTX.putImageData(imgData, 0, 0);

      printBackdrop(ctx, w, h, I, 0.08 + I * 0.85);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, 0.55 + I * 0.45);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(LOW, 0, 0, w, h);
      ctx.restore();
    },

    // Concentric contour stipple
    td_ringstipple(ctx, w, h, t, I, beat, preset) {
      capture(ctx.canvas);
      const pw = 200, ph = Math.max(24, Math.round((200 * h) / w));
      const data = sampleSmall(pw, ph).data;
      autoLevels(data, 0.03, 0.99, 0.15);

      // luma field with bilinear lookup: dots are placed where the image
      // crosses an iso-luma contour, so the field literally traces the subject
      const GW = pw, GH = ph;
      const field = new Float32Array(GW * GH);
      for (let gy = 0; gy < GH; gy++) {
        for (let gx = 0; gx < GW; gx++) {
          field[gy * GW + gx] = Math.pow(nl(lumaAt(data, pw, ph, (gx + 0.5) / GW, (gy + 0.5) / GH)), 0.75);
        }
      }
      const sampleField = (u, v) => {
        const fx = clamp(u * GW - 0.5, 0, GW - 1.001), fy = clamp(v * GH - 0.5, 0, GH - 1.001);
        const x0 = fx | 0, y0 = fy | 0, tx = fx - x0, ty = fy - y0;
        const a = field[y0 * GW + x0], b = field[y0 * GW + x0 + 1];
        const c = field[(y0 + 1) * GW + x0], d = field[(y0 + 1) * GW + x0 + 1];
        return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
      };

      const bs = QUALITY === 'export' ? 0.75 : 0.5;
      const BW = Math.max(96, Math.round(w * bs));
      const BH = Math.max(54, Math.round(h * bs));
      if (!LOW || LOW.width !== BW || LOW.height !== BH) {
        LOW = mkCanvas(BW, BH);
        LOWCTX = LOW.getContext('2d', { willReadFrequently: true });
      }
      const SW = LOW.width, SH = LOW.height;
      if (!stippleBuf || stippleBuf.width !== SW || stippleBuf.height !== SH) {
        stippleBuf = { width: SW, height: SH, data: new Uint8ClampedArray(SW * SH * 4) };
      }
      const buf = stippleBuf.data;
      buf.fill(0);

      // iso-luma contour count rises with intensity; the contour ring drifts
      const ISO = 4 + 5 * Math.min(1, I);
      const drift = t * 0.35;
      const pitch = Math.max(1.8, rpx(1.35) * bs);
      const cols = Math.floor(SW / pitch), rows = Math.floor(SH / pitch);
      const dotR = Math.max(1, Math.round(pitch * 0.42));
      const width = 0.24;
      const strength = 0.55 + Math.min(1, I) * 0.6;

      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const seed = cx * 12.9898 + cy * 78.233;
          const jx = hash2(seed, 1.7) * pitch;
          const jy = hash2(seed, 9.1) * pitch;
          const px = cx * pitch + jx;
          const py = cy * pitch + jy;
          const u = px / SW, v = py / SH;
          const lum = sampleField(u, v);
          if (lum < 0.02) continue;
          // distance to the nearest contour of the tone field
          const phase = lum * ISO + drift;
          let dphase = Math.abs(phase - Math.round(phase));
          if (dphase > width) continue;
          const prox = 1 - dphase / width;
          const ix = px | 0, iy = py | 0;
          if (ix < 0 || iy < 0 || ix + dotR >= SW || iy + dotR >= SH) continue;
          const r = Math.max(1, Math.round(dotR * (0.5 + prox * 0.8)));
          const val = 170 + prox * 85;
          const alpha = Math.min(240, (0.12 + prox * 0.72) * strength * 255);
          for (let oy = 0; oy < r; oy++) {
            const yy = iy + oy;
            for (let ox = 0; ox < r; ox++) {
              const o = (yy * SW + ix + ox) * 4;
              buf[o] = val; buf[o + 1] = val; buf[o + 2] = val; buf[o + 3] = alpha;
            }
          }
        }
      }

      const imgData = LOWCTX.createImageData(SW, SH);
      imgData.data.set(buf);
      LOWCTX.putImageData(imgData, 0, 0);

      printBackdrop(ctx, w, h, I, 0.10 + I * 0.85);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, 0.6 + I * 0.4);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(LOW, 0, 0, w, h);
      ctx.restore();
    },

    // Diagonal intaglio hatch plate (tiled: one stroke pass per tone level)
    td_engrave(ctx, w, h, t, I, beat, preset) {
      capture(ctx.canvas);
      const pw = 200, ph = Math.max(24, Math.round((200 * h) / w));
      const data = sampleSmall(pw, ph).data;
      autoLevels(data, 0.04, 0.99, 0.16);

      // Half-res hatch work surface. Lines are >=2px, so half res upscales
      // cleanly and costs a quarter of a full 4K stroke pass.
      const HW = Math.max(320, Math.round(w * 0.5));
      const HH = Math.max(180, Math.round(h * 0.5));
      if (!HATCH || HATCH.width !== HW || HATCH.height !== HH) {
        HATCH = mkCanvas(HW, HH);
        HATCHCTX = HATCH.getContext('2d');
      }
      // four tone bands → four stroke widths on ONE line field. A burin plate
      // builds tone by line weight, not by stacking extra line sets on top.
      const BANDS = [[0.14, 0.42], [0.42, 0.68], [0.68, 1.01]];
      const masks = [];
      for (let k = 0; k < BANDS.length; k++) {
        const c = mkCanvas(pw, ph);
        const cx = c.getContext('2d');
        const img = cx.createImageData(pw, ph);
        const out = img.data;
        for (let gy = 0; gy < ph; gy++) {
          for (let gx = 0; gx < pw; gx++) {
            const raw = nl(lumaAt(data, pw, ph, (gx + 0.5) / pw, (gy + 0.5) / ph));
            const tone = Math.pow(clamp((raw - 0.10) / 0.90, 0, 1), 0.85);
            const a = clamp((tone - BANDS[k][0]) / (BANDS[k][1] - BANDS[k][0]), 0, 1);
            const i = (gy * pw + gx) * 4;
            out[i] = 255; out[i + 1] = 255; out[i + 2] = 255; out[i + 3] = Math.round(a * 255);
          }
        }
        cx.putImageData(img, 0, 0);
        masks.push(c);
      }

      printBackdrop(ctx, w, h, I, 0.06 + I * 0.9);

      const wob = Math.sin(t * 1.1) * rpx(0.8);
      // coarse → fine, each pass masked by its own tone band. This is how a
      // burin plate builds tone: more line sets as the shadow deepens.
      const spH = Math.max(3.2, rpx(2.7) * 0.5);
      // bands 2-3 cross-hatch at the opposite rake, the way a burin plate
      // builds its darkest tones
      const passes = [
        { sp: spH, lw: Math.max(0.6, rpx(0.30) * 0.5), m: 0, a: 0.62, ang: 1 },
        { sp: spH * 0.9, lw: Math.max(0.8, rpx(0.62) * 0.5), m: 1, a: 0.70, ang: 1 },
        { sp: spH * 1.15, lw: Math.max(0.9, rpx(0.85) * 0.5), m: 2, a: 0.78, ang: -1 }
      ];
      if (!HATCH2 || HATCH2.width !== HW || HATCH2.height !== HH) {
        HATCH2 = mkCanvas(HW, HH);
        HATCH2CTX = HATCH2.getContext('2d');
      }
      HATCH2CTX.setTransform(1, 0, 0, 1, 0, 0);
      HATCH2CTX.globalCompositeOperation = 'source-over';
      HATCH2CTX.globalAlpha = 1;
      HATCH2CTX.clearRect(0, 0, HW, HH);

      for (let pi = 0; pi < passes.length; pi++) {
        const ps = passes[pi];
        const slope = Math.tan(((ps.ang > 0 ? 34 : -28) * Math.PI) / 180);
        HATCHCTX.setTransform(1, 0, 0, 1, 0, 0);
        HATCHCTX.globalCompositeOperation = 'source-over';
        HATCHCTX.globalAlpha = 1;
        HATCHCTX.clearRect(0, 0, HW, HH);
        HATCHCTX.strokeStyle = '#eef2f8';
        HATCHCTX.lineWidth = ps.lw;
        HATCHCTX.lineCap = 'round';
        HATCHCTX.beginPath();
        // intercepts sweep far enough past both edges that the diagonal field
        // covers the whole canvas (an intercept-clamped loop only paints a
        // sliver in the top-right corner)
        for (let c = -HW * slope - ps.sp; c < HH + ps.sp; c += ps.sp) {
          const jitter = (hash2(pi * 3.1 + c * 0.71, 7.3) - 0.5) * ps.sp * 0.16;
          const base = c + jitter + wob;
          HATCHCTX.moveTo(-2, base);
          HATCHCTX.lineTo(HW + 2, base + HW * slope);
        }
        HATCHCTX.stroke();
        // keep only where the plate is this dark
        HATCHCTX.globalCompositeOperation = 'destination-in';
        HATCHCTX.drawImage(masks[ps.m], 0, 0, pw, ph, 0, 0, HW, HH);
        HATCHCTX.globalAlpha = 1;

        HATCH2CTX.globalCompositeOperation = 'lighter';
        HATCH2CTX.globalAlpha = Math.min(1, ps.a * (0.70 + I * 0.45));
        HATCH2CTX.drawImage(HATCH, 0, 0);
        HATCH2CTX.globalCompositeOperation = 'source-over';
        HATCH2CTX.globalAlpha = 1;
      }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 1;
      ctx.drawImage(HATCH2, 0, 0, HW, HH, 0, 0, w, h);
      ctx.restore();

      // a breath of the original plate keeps the figure legible under the hatch
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.05 + 0.07 * Math.min(1, I);
      ctx.drawImage(SRC, 0, 0, w, h);
      ctx.restore();
    },

    // Flow-oriented dash glyph field
    td_dashfield(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const pw = 96, ph = 54;
      const data = sampleSmall(pw, ph).data;
      // dash count follows FRAME area / a frame-space cell, so the field thins
      // out identically at every resolution (no 26k-mark soup at 4K)
      const n = Math.round(clamp(2600 * (w * h) / (1920 * 1080), 900, 12000));
      autoLevels(data);
      const cloud = dotCloud(n, 21.7);
      const scale = Math.max(0.55, rpx(1.05));

      printBackdrop(ctx, w, h, I, 0.12 + I * 0.8);
      ctx.save();
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = Math.max(0.8, 1.1 * scale);
      ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const d = cloud[i];
        const n1 = (fbm(d.u * 2.6 + t * 0.09, d.v * 2.6 - t * 0.06, 2) - 0.5) * 2;
        const lum = Math.pow(nl(lumaAt(data, pw, ph, d.u, d.v)), 0.6);
        const tone = clamp((lum - 0.12) / 0.88, 0, 1);
        if (tone < 0.03 || hash2(d.u * 91.3, d.v * 47.7) > 0.2 + tone * 0.85) continue;
        const ang = n1 * Math.PI * (0.6 + 0.5 * Math.min(1, I));
        const len = (1.6 + tone * 8.5) * scale * (0.6 + 0.6 * Math.min(1, I));
        const px = d.u * w, py = d.v * h;
        ctx.globalAlpha = Math.min(1, (0.12 + tone * 0.95) * (0.45 + I * 0.55));
        ctx.beginPath();
        ctx.moveTo(px - Math.cos(ang) * len * 0.5, py - Math.sin(ang) * len * 0.5);
        ctx.lineTo(px + Math.cos(ang) * len * 0.5, py + Math.sin(ang) * len * 0.5);
        ctx.stroke();
      }
      ctx.restore();
    },

    // =====================================================================
    // GLITCH & BITMAP TOPs — degraded-signal / printed-bitmap family
    // =====================================================================

    // Reference: sparse black ink specks on white stock
    td_inkstipple(ctx, w, h, t, I, beat, preset) {
      capture(ctx.canvas);
      const pw = 180, ph = Math.max(20, Math.round((180 * h) / w));
      const data = sampleSmall(pw, ph).data;

      // work at half frame resolution: the marks are several pixels wide even
      // at 4K, so a half-res ink plate upscales invisibly and costs a quarter
      const bs = QUALITY === 'export' ? 0.75 : 0.5;
      const BW = Math.max(64, Math.round(w * bs));
      const BH = Math.max(36, Math.round(h * bs));
      if (!LOW || LOW.width !== BW || LOW.height !== BH) {
        LOW = mkCanvas(BW, BH);
        LOWCTX = LOW.getContext('2d', { willReadFrequently: true });
      }
      const SW = LOW.width, SH = LOW.height;
      if (!stippleBuf || stippleBuf.width !== SW || stippleBuf.height !== SH) {
        stippleBuf = { width: SW, height: SH, data: new Uint8ClampedArray(SW * SH * 4) };
      }
      const buf = stippleBuf.data;
      for (let i = 0; i < buf.length; i += 4) {
        buf[i] = 249; buf[i + 1] = 247; buf[i + 2] = 242; buf[i + 3] = 255;
      }

      autoLevels(data, 0.04, 0.99, 0.22);
      // ink density grid: lit plate → ink, with contour emphasis so the figure
      // keeps a crisp edge the way a real stipple engraving does
      const GW = 120, GH = Math.max(24, Math.round((120 * h) / w));
      const inkGrid = new Float32Array(GW * GH);
      for (let gy = 0; gy < GH; gy++) {
        for (let gx = 0; gx < GW; gx++) {
          const u = (gx + 0.5) / GW, v = (gy + 0.5) / GH;
          const raw = nl(lumaAt(data, pw, ph, u, v));
          const ex = nl(lumaAt(data, pw, ph, Math.min(0.999, u + 1 / GW), v))
                   - nl(lumaAt(data, pw, ph, Math.max(0, u - 1 / GW), v));
          const ey = nl(lumaAt(data, pw, ph, u, Math.min(0.999, v + 1 / GH)))
                   - nl(lumaAt(data, pw, ph, u, Math.max(0, v - 1 / GH)));
          const tone = clamp((raw - 0.26) / 0.54, 0, 1);
          const edge = Math.min(1, Math.hypot(ex, ey) * 2.6);
          inkGrid[gy * GW + gx] = clamp(tone * 0.82 + edge * 0.62, 0, 1);
        }
      }
      const inkAt = (u, v) => {
        // bilinear so the ink figure has soft contours instead of 80px blocks
        const fx = clamp(u * GW - 0.5, 0, GW - 1.001), fy = clamp(v * GH - 0.5, 0, GH - 1.001);
        const x0 = fx | 0, y0 = fy | 0, tx = fx - x0, ty = fy - y0;
        const i00 = inkGrid[y0 * GW + x0], i10 = inkGrid[y0 * GW + x0 + 1];
        const i01 = inkGrid[(y0 + 1) * GW + x0], i11 = inkGrid[(y0 + 1) * GW + x0 + 1];
        return (i00 * (1 - tx) + i10 * tx) * (1 - ty) + (i01 * (1 - tx) + i11 * tx) * ty;
      };

      const pitch = Math.max(1.6, rpx(1.7) * bs);
      const cols = Math.floor(SW / pitch), rows = Math.floor(SH / pitch);
      const dotBase = Math.max(1, Math.round(pitch * 0.60));
      const strength = 0.95 + Math.min(1, I) * 0.75;

      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const seed = cx * 12.9898 + cy * 78.233;
          const rnd = hash2(seed, 4.3);
          const px = cx * pitch + hash2(seed, 1.7) * pitch;
          const py = cy * pitch + hash2(seed, 9.1) * pitch;
          const ink = inkAt(px / SW, py / SH);
          // a whisper of paper tooth, never a uniform speckle field
          if (ink < 0.04 && rnd < 0.9955) continue;
          if (ink >= 0.04 && rnd > Math.pow(ink, 1.05) * 1.30 * strength) continue;
          const ix = px | 0, iy = py | 0;
          if (ix < 0 || iy < 0 || ix >= SW || iy >= SH) continue;
          const drag = ink > 0.2 && hash2(seed, 6.7) > 0.9 ? 1 + ((hash2(seed, 8.2) * 3) | 0) : 0;
          const shade = 12 + (1 - Math.min(1, ink * 1.35)) * 62;
          const mark = Math.max(1, Math.round(dotBase * (0.72 + ink * 0.85)));
          const runLen = mark * (1 + drag);
          for (let oy = 0; oy < mark; oy++) {
            const yy = iy + oy;
            if (yy >= SH) break;
            for (let ox = 0; ox < runLen; ox++) {
              const xx = ix + ox;
              if (xx >= SW) break;
              const o = (yy * SW + xx) * 4;
              buf[o] = shade; buf[o + 1] = shade; buf[o + 2] = shade + 5;
            }
          }
        }
      }

      const imgData = LOWCTX.createImageData(SW, SH);
      imgData.data.set(buf);
      LOWCTX.putImageData(imgData, 0, 0);

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#f8f6f1';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = Math.min(1, 0.55 + I * 0.45);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(LOW, 0, 0, w, h);
      ctx.restore();
    },

    // Reference: hard luma-key silhouette + horizontal edge streaks
    td_lumakey(ctx, w, h, t, I, beat, preset) {
      capture(ctx.canvas);
      const pw = 150, ph = Math.round((150 * h) / w);
      const data = sampleSmall(pw, ph).data;
      const thr = 0.6 - Math.min(0.45, I * 0.28);
      const bw = Math.round(clamp(220 * RS, 220, 900));
      const bh = Math.max(20, Math.round((bw * h) / w));

      const mono = lowRes(bw, bh, (d) => {
        for (let i = 0; i < d.length; i += 4) {
          const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
          const v = l > thr ? 255 : 0;
          d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
        }
      });

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = Math.min(1, 0.45 + I * 0.7);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(mono, 0, 0, w, h);

      // horizontal trail streaks tearing off the key edges
      ctx.globalCompositeOperation = 'lighter';
      const bands = 26;
      const bh2 = h / bands;
      for (let i = 0; i < bands; i++) {
        const n = fbm(i * 0.42 + t * 0.5, 3.1, 2) - 0.5;
        const dx = n * w * 0.22 * Math.min(1.6, 0.4 + I);
        ctx.globalAlpha = 0.16 + 0.28 * Math.min(1, I) * Math.abs(n) * 2;
        ctx.drawImage(mono, 0, i * bh2, bw, Math.max(1, bh2 * 0.55), dx, i * bh2, w * 1.02, bh2);
      }
      ctx.restore();

      // sensor grain
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      const dots = Math.round(260 * Math.min(1.4, 0.4 + I) * Math.min(6, RS * RS) * 0.55);
      for (let i = 0; i < dots; i++) {
        const s1 = hash2(i * 3.1, Math.floor(t * 20));
        const s2 = hash2(i * 7.7, Math.floor(t * 18));
        ctx.globalAlpha = 0.05 + s1 * 0.35;
        ctx.fillRect(s2 * w, s1 * h, rpxMin(1.4), rpxMin(1.4));
      }
      ctx.restore();
    },

    // Reference: hard 5-colour bitmap mosaic
    td_palette(ctx, w, h, t, I, beat, preset) {
      capture(ctx.canvas);
      const cellsX = Math.round(clamp((44 - I * 10) * Math.pow(Math.min(w, h) / 1080, 0.8), 24, 110));
      const cellsY = Math.max(8, Math.round((cellsX * h) / w));
      const SS = 3;
      const img = sampleSmall(cellsX * SS, cellsY * SS);
      const d = img.data;
      autoLevels(d, 0.03, 0.99, 0.12);

      // five-colour poster palette (paper / cobalt / magenta / green / ink)
      const PALETTE = [
        [248, 247, 243],
        [40, 78, 208],
        [230, 66, 148],
        [36, 158, 88],
        [22, 20, 30]
      ];

      if (!LOW || LOW.width !== cellsX || LOW.height !== cellsY) {
        LOW = mkCanvas(cellsX, cellsY);
        LOWCTX = LOW.getContext('2d', { willReadFrequently: true });
      }
      const out = LOWCTX.createImageData(cellsX, cellsY);
      const o = out.data;

      for (let cy = 0; cy < cellsY; cy++) {
        for (let cx = 0; cx < cellsX; cx++) {
          let r = 0, g = 0, b = 0, n = 0;
          for (let sy = 0; sy < SS; sy++) {
            for (let sx = 0; sx < SS; sx++) {
              const i = ((cy * SS + sy) * (cellsX * SS) + (cx * SS + sx)) * 4;
              r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
            }
          }
          r /= n; g /= n; b /= n;
          const lum = nl((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255);
          // posterised banding: darkest → ink, brightest → paper, mids cycle through chroma
          const jitter = hash2(cx * 3.7 + Math.floor(t * 2) * 0.11, cy * 5.3);
          let idx;
          if (lum < 0.16) idx = 4;
          else if (lum > 0.72) idx = 0;
          else {
            const band = Math.floor((lum - 0.16) / 0.56 * 3);
            idx = [1, 2, 3][clamp(band, 0, 2)];
            if (jitter > 0.88) idx = [1, 2, 3][(band + 1) % 3];
          }
          const p4 = (cy * cellsX + cx) * 4;
          o[p4] = PALETTE[idx][0]; o[p4 + 1] = PALETTE[idx][1];
          o[p4 + 2] = PALETTE[idx][2]; o[p4 + 3] = 255;
        }
      }
      LOWCTX.putImageData(out, 0, 0);

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#f8f7f3';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = Math.min(1, 0.35 + I * 0.8);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(LOW, 0, 0, w, h);
      ctx.restore();

      // block seams, like the reference's printed grid
      // faint print registration lines only at higher intensity
      if (I > 1.5) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(0.1, (I - 1.5) * 0.4);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        const cw = w / cellsX;
        ctx.beginPath();
        for (let x = 0; x <= cellsX; x += 4) { ctx.moveTo(Math.round(x * cw) + 0.5, 0); ctx.lineTo(Math.round(x * cw) + 0.5, h); }
        ctx.stroke();
        ctx.restore();
      }
    },

    // Reference: single-hue directional zoom smear
    td_dirsmear(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const amt = Math.min(1.7, 0.25 + I);
      const taps = QUALITY === 'export' ? 28 : 16;
      const cx = w * 0.5, cy = h * 0.56;

      // taps accumulated at half resolution — a 16-28 tap smear is pure
      // low-pass, so this is visually identical and ~4x cheaper at 4K
      const smW = Math.max(160, Math.round(w * 0.5));
      const smH = Math.max(90, Math.round(h * 0.5));
      if (!SMALL2 || SMALL2.width !== smW || SMALL2.height !== smH) {
        SMALL2 = mkCanvas(smW, smH);
        SMALL2_CTX = SMALL2.getContext('2d');
      }
      const t2 = SMALL2_CTX;
      t2.setTransform(1, 0, 0, 1, 0, 0);
      t2.globalCompositeOperation = 'source-over';
      t2.globalAlpha = 1;
      t2.fillStyle = '#03060a';
      t2.fillRect(0, 0, smW, smH);
      t2.globalCompositeOperation = 'lighter';
      const tapAlpha = 1.55 / taps;
      const scx = smW * 0.5, scy = smH * 0.56;
      for (let i = 0; i < taps; i++) {
        const k = (i / (taps - 1)) * 0.3 * amt;
        const s = 1 + k;
        const ang = Math.sin(t * 0.3) * 0.015 * amt;
        t2.save();
        t2.globalAlpha = tapAlpha;
        t2.translate(scx, scy);
        t2.rotate(ang);
        t2.scale(s, s);
        t2.translate(-scx, -scy);
        t2.drawImage(SRC, 0, 0, smW, smH);
        t2.restore();
      }
      t2.globalCompositeOperation = 'source-over';
      t2.globalAlpha = 1;

      buffers(w, h);
      T1.setTransform(1, 0, 0, 1, 0, 0);
      T1.globalCompositeOperation = 'source-over';
      T1.globalAlpha = 1;
      T1.imageSmoothingEnabled = true;
      T1.imageSmoothingQuality = 'high';
      T1.drawImage(SMALL2, 0, 0, w, h);

      // monochrome + green duotone (multiply keeps the highlights intact)
      T1.globalCompositeOperation = 'saturation';
      T1.fillStyle = 'hsl(0,0%,50%)';
      T1.fillRect(0, 0, w, h);
      T1.globalCompositeOperation = 'multiply';
      T1.fillStyle = 'rgb(150,255,175)';
      T1.fillRect(0, 0, w, h);
      T1.globalCompositeOperation = 'source-over';

      ctx.save();
      ctx.fillStyle = '#02060a';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = Math.min(1, 0.45 + I * 0.55);
      ctx.drawImage(TMP1, 0, 0, w, h);
      ctx.restore();

      // deep-forest falloff so only the lit core glows
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      const vg = ctx.createRadialGradient(w * 0.5, h * 0.55, Math.min(w, h) * 0.12, w * 0.5, h * 0.55, w * 0.66);
      vg.addColorStop(0, 'rgba(255,255,255,1)');
      vg.addColorStop(0.6, 'rgba(120,170,120,1)');
      vg.addColorStop(1, 'rgba(20,45,25,1)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    },

    // Reference: datamosh macroblock smear with duotone ghost echo
    td_datamosh_echo(ctx, w, h, t, I, beat, preset) {
      capture(ctx.canvas);
      buffers(w, h);
      const amt = Math.min(1.8, 0.4 + I);
      const blocks = Math.round(clamp(12 * Math.pow(Math.min(w, h) / 1080, 0.5), 10, 26));
      const bh = h / blocks;

      // 1. high-contrast mono plate: detail survives the smear as ink
      const plate = monoPrintPlate(w, h, 1.8 + I * 0.4, 0.92);

      // 2. black ground + rust wash only in the mid band (not a full veil)
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#05060a';
      ctx.fillRect(0, 0, w, h);
      const rust = ctx.createLinearGradient(0, 0, 0, h);
      rust.addColorStop(0, 'rgba(120,44,22,0)');
      rust.addColorStop(0.45, 'rgba(120,44,22,0.55)');
      rust.addColorStop(1, 'rgba(60,18,10,0.25)');
      ctx.fillStyle = rust;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // 3. block smear: each slab is displaced and re-entered additively, so
      // the image streaks like a codec keyframe died
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < blocks; i++) {
        const seed = i * 7.13;
        const drift = (fbm(seed * 0.11 + t * 0.45, 2.7, 2) - 0.5) * 2;
        const dx = drift * w * 0.22 * amt;
        const tearRoll = hash2(seed, Math.floor(t * 6) * 0.37);
        const tear = tearRoll > 0.84 ? (hash2(seed, 4.1) - 0.5) * w * 0.34 * amt : 0;
        ctx.globalAlpha = Math.min(1, 0.34 + Math.abs(drift) * 0.34);
        ctx.drawImage(plate, 0, i * bh, w, bh, dx + tear, i * bh, w, bh);
      }
      ctx.restore();

      // 4. chromatic echo: two offset ghost copies, red / cyan
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const off = rpx(2.2) * amt;
      ctx.globalAlpha = 0.22 * Math.min(1, I);
      ctx.fillStyle = 'rgba(255,70,40,1)';
      ctx.globalCompositeOperation = 'source-over';
      // tint through multiply-free trick: draw plate, then tint with 'source-in'
      if (!TINT) { TINT = mkCanvas(w, h); TINTCTX = TINT.getContext('2d'); }
      fit(TINT, w, h);
      TINTCTX.setTransform(1, 0, 0, 1, 0, 0);
      TINTCTX.globalCompositeOperation = 'source-over';
      TINTCTX.globalAlpha = 1;
      TINTCTX.clearRect(0, 0, w, h);
      TINTCTX.drawImage(plate, 0, 0);
      TINTCTX.globalCompositeOperation = 'multiply';
      TINTCTX.fillStyle = '#ff5a36';
      TINTCTX.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.30 * Math.min(1.2, I);
      ctx.drawImage(TINT, -off, 0);
      TINTCTX.globalCompositeOperation = 'multiply';
      TINTCTX.fillStyle = '#2ec8e6';
      TINTCTX.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.24 * Math.min(1.2, I);
      ctx.drawImage(TINT, off, 0);
      ctx.restore();

      // 5. horizontal data lines where the plate is bright
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `rgba(255,196,150,${0.10 + 0.16 * Math.min(1, I)})`;
      ctx.lineWidth = Math.max(1, rpx(0.4));
      ctx.beginPath();
      for (let i = 0; i < blocks * 3; i++) {
        const y = (hash2(i * 3.7, Math.floor(t * 4) * 0.11) * h) | 0;
        if (hash2(i * 1.3, 7.7) > 0.55) continue;
        ctx.moveTo(0, y);
        ctx.lineTo(w * (0.3 + hash2(i * 2.1, 3.3) * 0.7), y);
      }
      ctx.stroke();
      ctx.restore();
    },

    td_newsprint(ctx, w, h, t, I, beat, preset) {
      capture(ctx.canvas);
      // halftone screen pitch grows with the render size: same tone, but at 4K
      // the dots stay a visible screen instead of collapsing into dither noise
      const cell = Math.round(clamp(2 * Math.pow(Math.min(w, h) / 1080, 0.9), 2, 20));
      const gw = Math.max(48, Math.round(w / cell));
      const gh = Math.max(14, Math.round(h / cell));
      const img = sampleSmall(gw, gh);
      const d = img.data;
      autoLevels(d, 0.03, 0.99, 0.25);

      // halftone plate is gw*cell × gh*cell pixels
      const PW = gw * cell, PH = gh * cell;
      if (!LOW || LOW.width !== PW || LOW.height !== PH) {
        LOW = mkCanvas(PW, PH);
        LOWCTX = LOW.getContext('2d', { willReadFrequently: true });
      }
      const out = LOWCTX.createImageData(PW, PH);
      const o = out.data;
      for (let i = 0; i < o.length; i += 4) { o[i] = 250; o[i + 1] = 249; o[i + 2] = 245; o[i + 3] = 255; }

      const half = cell / 2;
      for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
          const si = (gy * gw + gx) * 4;
          const lum = nl((0.2126 * d[si] + 0.7152 * d[si + 1] + 0.0722 * d[si + 2]) / 255);
          const tone = Math.pow(clamp((lum - 0.012) / 0.988, 0, 1), 0.92);
          // at tone 0 the dot must seal the whole cell (radius > half-diagonal)
          // or the paper shows through as a grey wash on every shadow
          const rad = Math.pow(1 - tone, 0.62) * cell * 0.76;
          if (rad < cell * 0.10) continue;
          const px0 = gx * cell, py0 = gy * cell;
          for (let yy = 0; yy < cell; yy++) {
            for (let xx = 0; xx < cell; xx++) {
              const dxp = xx - half + 0.35, dyp = yy - half + 0.35;
              if (dxp * dxp + dyp * dyp > rad * rad) continue;
              const oi = ((py0 + yy) * PW + (px0 + xx)) * 4;
              o[oi] = 18; o[oi + 1] = 16; o[oi + 2] = 20;
            }
          }
        }
      }
      LOWCTX.putImageData(out, 0, 0);

      // ripple: slice the halftone into horizontal bands and offset them
      ctx.save();
      ctx.fillStyle = '#f7f6f1';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.imageSmoothingEnabled = false;
      const bands = 70;
      const bandH = h / bands;
      const amp = 4 + 20 * Math.min(1.4, I);
      for (let i = 0; i < bands; i++) {
        const v = i / bands;
        const off = Math.sin(v * 8 + t * 1.15) * amp
                  + (fbm(v * 3.2 + t * 0.25, 1.7, 2) - 0.5) * amp * 0.8;
        const sy = Math.floor(v * PH);
        const sh = Math.max(2, Math.ceil(PH / bands) + 1);
        // over-extend by 2*amp each side: the shifted band can never expose the
        // bare paper underneath at the frame edges
        const pad = Math.abs(off) + 2;
        ctx.drawImage(LOW, 0, sy, PW, sh, off - pad, i * bandH, w + pad * 2, bandH + 0.8);
      }
      ctx.restore();

      // letterpress edge falloff + paper grain
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      const vg = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.26, w * 0.5, h * 0.5, w * 0.66);
      vg.addColorStop(0, 'rgba(255,255,255,1)');
      vg.addColorStop(1, `rgba(140,140,140,${0.5 * Math.min(1, 0.4 + I)})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < 160; i++) {
        const s1 = hash2(i * 3.7, Math.floor(t * 8));
        const s2 = hash2(i * 9.1, Math.floor(t * 7));
        ctx.fillStyle = `rgba(120,115,110,${0.25 + s1 * 0.5})`;
        ctx.fillRect(s2 * w, s1 * h, rpxMin(1.6), rpxMin(1.6));
      }
      ctx.restore();
    },

    // Reference: hard rectangular window slice re-filled with shifted copies
    td_windowslice(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const amt = Math.min(1.6, 0.3 + I);

      ctx.save();
      ctx.drawImage(src, 0, 0, w, h);
      ctx.restore();

      // colour boost like the reference's chroma bleed
      ctx.save();
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = `hsl(0, ${Math.round(clamp(45 + I * 30, 0, 100))}%, 50%)`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      const winW = w * (0.26 + 0.16 * Math.min(1, I));
      const winH = h * (0.46 + 0.2 * Math.min(1, I));
      const winX = w * 0.34 + Math.sin(t * 0.45) * w * 0.06 * amt;
      const winY = h * 0.2 + Math.cos(t * 0.37) * h * 0.05 * amt;
      const slices = 26;
      const sh = winH / slices;

      ctx.save();
      ctx.beginPath();
      ctx.rect(winX, winY, winW, winH);
      ctx.clip();
      ctx.fillStyle = '#05070b';
      ctx.fillRect(winX, winY, winW, winH);
      for (let i = 0; i < slices; i++) {
        const v = i / slices;
        const n = fbm(v * 4.1 + t * 0.35, 6.3, 2) - 0.5;
        const dx = n * winW * 0.55 * amt;
        const sx = winX + dx;
        const sy = winY + v * winH;
        ctx.globalAlpha = 0.92;
        ctx.drawImage(SRC, 0, (v * SRC.height) | 0, SRC.width, Math.max(1, SRC.height / slices + 1),
          sx - winW * 0.2, sy, winW * 1.4, sh + 0.6);
      }
      ctx.restore();

      // window frame
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `rgba(190,230,255,${0.25 + 0.35 * Math.min(1, I)})`;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(winX, winY, winW, winH);
      ctx.restore();

      // chromatic edge fringe on the window
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.28 * Math.min(1, I);
      ctx.drawImage(SRC, winX - 5 * amt * RS, winY, winW, winH, winX, winY, winW, winH);
      ctx.globalAlpha = 0.22 * Math.min(1, I);
      ctx.drawImage(SRC, winX + 5 * amt * RS, winY, winW, winH, winX, winY, winW, winH);
      ctx.restore();

      // vignette
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      const vg = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.28, w * 0.5, h * 0.5, w * 0.62);
      vg.addColorStop(0, 'rgba(255,255,255,1)');
      vg.addColorStop(1, 'rgba(120,130,140,0.85)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    },

    // Reference: chroma ghost / RGB bleed over a duotone field
    td_chromableed(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const amt = Math.min(1.8, 0.3 + I);
      const sep = (4 + 13 * amt) * RS;

      buffers(w, h);

      // 1. duotone plate (rust field, as in the reference)
      T2.setTransform(1, 0, 0, 1, 0, 0);
      T2.globalCompositeOperation = 'source-over';
      T2.globalAlpha = 1;
      T2.drawImage(SRC, 0, 0, w, h);
      T2.globalCompositeOperation = 'saturation';
      T2.fillStyle = 'hsl(0,0%,50%)';
      T2.fillRect(0, 0, w, h);
      T2.globalCompositeOperation = 'multiply';
      T2.fillStyle = 'rgb(196,96,54)';
      T2.fillRect(0, 0, w, h);
      T2.globalCompositeOperation = 'source-over';

      ctx.save();
      ctx.fillStyle = '#4e1d0c';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = Math.min(1, 0.45 + I * 0.55);
      ctx.drawImage(TMP2, 0, 0, w, h);
      ctx.restore();

      // 2. edge mask via difference of two offsets
      const buildEdges = (offset) => {
        T1.setTransform(1, 0, 0, 1, 0, 0);
        T1.globalCompositeOperation = 'source-over';
        T1.globalAlpha = 1;
        T1.fillStyle = '#000000';
        T1.fillRect(0, 0, w, h);
        T1.drawImage(SRC, offset, 0, w, h);
        T1.globalCompositeOperation = 'difference';
        T1.drawImage(SRC, 0, 0, w, h);
        T1.globalCompositeOperation = 'lighter';
        T1.drawImage(TMP1, 0, 0, w, h);           // boost the edge signal
        T1.globalCompositeOperation = 'source-over';
        // tint, keeping the edge as the mask
        T1.globalCompositeOperation = 'multiply';
        T1.fillStyle = offset < 0 ? 'rgb(205,70,255)' : 'rgb(70,190,255)';
        T1.fillRect(0, 0, w, h);
        T1.globalCompositeOperation = 'source-over';
        return TMP1;
      };

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.4 + 0.35 * Math.min(1, I);
      ctx.drawImage(buildEdges(-Math.round(sep)), 0, 0, w, h);
      ctx.globalAlpha = 0.3 + 0.3 * Math.min(1, I);
      ctx.drawImage(buildEdges(Math.round(sep * 1.2)), 0, 0, w, h);
      ctx.restore();

      // 3. horizontal chroma tear bands
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const bands = 12;
      const bh = h / bands;
      for (let i = 0; i < bands; i++) {
        const n = fbm(i * 0.53 + t * 0.3, 8.1, 2) - 0.5;
        if (Math.abs(n) < 0.32) continue;
        ctx.globalAlpha = 0.04 + Math.abs(n) * 0.1 * Math.min(1, I);
        ctx.drawImage(SRC, 0, i * bh, w, bh * 0.5, n * w * 0.12 * amt, i * bh, w, bh * 0.5);
      }
      ctx.restore();

      // 4. scanline raster + edge falloff
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(120,70,50,0.35)';
      const gap = Math.max(2, Math.round(h / 180));
      for (let y = 0; y < h; y += gap * 2) ctx.fillRect(0, y, w, gap);
      const vg = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.3, w * 0.5, h * 0.5, w * 0.68);
      vg.addColorStop(0, 'rgba(255,255,255,1)');
      vg.addColorStop(1, 'rgba(120,70,70,1)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    },

    // =====================================================================
    // TRANSITIONS & MORPHS (progress derived from the playhead)
    // =====================================================================
    tr_lumawipe(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const inc = incomingPlate(ctx, w, h, t);
      const raw = (t * 0.42) % 1;
      const p = I < 0.02 ? 0 : raw;                 // intensity 0% = hold on A
      const fade = Math.sin(p * Math.PI);            // 0 at ends

      ctx.save();
      ctx.globalAlpha = 1 - p * 0.85;
      ctx.drawImage(src, 0, 0, w, h);
      ctx.restore();

      const masked = maskedLayer(w, h, inc, (m, ww, hh) => {
        const g = m.createLinearGradient(0, 0, ww * 0.35, hh);
        const edge = clamp(p * 1.5, 0, 1);
        g.addColorStop(0, `rgba(255,255,255,${edge})`);
        g.addColorStop(Math.max(0.001, edge - 0.28), `rgba(255,255,255,${Math.max(0, edge - 0.08)})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        m.fillStyle = g;
        m.fillRect(0, 0, ww, hh);
      });

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 1;
      ctx.drawImage(masked, 0, 0, w, h);
      ctx.restore();

      // blow-out exposure at the seam
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.55 * fade * Math.min(1, I + 0.4);
      const g = ctx.createRadialGradient(w * 0.4, h * 0.45, 4, w * 0.4, h * 0.45, w * 0.5);
      g.addColorStop(0, 'rgba(255,244,232,0.85)');
      g.addColorStop(0.4, 'rgba(255,178,120,0.35)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    },

    tr_feedbackzoom(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const inc = incomingPlate(ctx, w, h, t);
      const raw = (t * 0.4) % 1;
      const ease = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      const p = I < 0.02 ? 0 : ease;

      // outgoing frame tunnels inward while its echo amplifies
      if (p <= 0.999) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p * 0.45);
        ctx.drawImage(src, 0, 0, w, h);
        ctx.restore();
      }

      const zoom = 1 + 0.05 * p * (0.5 + Math.min(1.6, I));
      const decay = 0.90 + 0.04 * Math.min(1, I);
      const fb = feedbackStep(w, h, src, { zoom, decay, gain: 1.2 });

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.45 * (1 - p) * Math.min(1, I);
      ctx.drawImage(fb, 0, 0, w, h);
      ctx.restore();

      // incoming inflates from centre
      ctx.save();
      ctx.globalAlpha = clamp(p * 1.4 - 0.15, 0, 1);
      const s2 = 0.55 + 0.45 * Math.min(1, p * 1.2);
      ctx.translate(w / 2, h / 2);
      ctx.scale(s2, s2);
      ctx.translate(-w / 2, -h / 2);
      ctx.drawImage(inc, 0, 0, w, h);
      ctx.restore();
    },

    tr_slitwipe(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const inc = incomingPlate(ctx, w, h, t);
      const raw = (t * 0.5) % 1;
      const p = I < 0.02 ? 0 : raw;
      const strips = 24;
      const sw = w / strips;

      ctx.save();
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < strips; i++) {
        const delay = (i / strips) * 0.42 + ((i * 37) % 7) * 0.012;
        const local = clamp((p - delay) / 0.5, 0, 1);
        const eased = local * local * (3 - 2 * local);
        const x = i * sw;
        ctx.globalAlpha = 1;
        ctx.drawImage(src, x, 0, sw + 0.6, h, x, -eased * h * 0.12, sw + 0.6, h);
        if (local > 0) {
          ctx.globalAlpha = eased;
          ctx.drawImage(inc, x, 0, sw + 0.6, h, x, (1 - eased) * h * 0.12, sw + 0.6, h);
        }
      }
      ctx.restore();

      // slit separators
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(251,191,36,${0.06 + 0.1 * Math.min(1, I)})`;
      for (let i = 0; i < strips; i++) ctx.fillRect(i * sw, 0, 1, h);
      ctx.restore();
    },

    tr_glasspush(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const inc = incomingPlate(ctx, w, h, t);
      const raw = (t * 0.44) % 1;
      const p = I < 0.02 ? 0 : raw;
      const push = p * w * 0.55;

      ctx.save();
      ctx.fillStyle = '#04060b';
      ctx.fillRect(0, 0, w, h);

      // outgoing refracts + slides left
      const amp = 26 * Math.min(1, I) * Math.sin(p * Math.PI);
      const step = 5;
      ctx.globalAlpha = 1 - p * 0.35;
      for (let x = 0; x < w; x += step) {
        const n = (fbm((x / w) * 3 + t * 0.4, 1.3, 2) - 0.5) * 2;
        ctx.drawImage(src, x, 0, step + 2, h, x - push + n * amp, 0, step + 2, h);
      }

      // incoming refracts in from the right
      ctx.globalAlpha = clamp(p * 1.25, 0, 1);
      for (let x = 0; x < w; x += step) {
        const n = (fbm((x / w) * 3 - t * 0.4, 5.1, 2) - 0.5) * 2;
        ctx.drawImage(inc, x, 0, step + 2, h, x + (1 - p) * w * 0.6 + n * amp, 0, step + 2, h);
      }
      ctx.restore();

      // glass seam glint
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const seamX = w * (1 - p) * 0.55 + w * 0.05;
      const g = ctx.createLinearGradient(seamX - 40, 0, seamX + 40, 0);
      g.addColorStop(0, 'rgba(186,230,253,0)');
      g.addColorStop(0.5, `rgba(200,240,255,${0.35 * Math.sin(p * Math.PI) * Math.min(1.4, I + 0.3)})`);
      g.addColorStop(1, 'rgba(186,230,253,0)');
      ctx.fillStyle = g;
      ctx.fillRect(seamX - 40, 0, 80, h);
      ctx.restore();
    },

    tr_mirrorfold(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const inc = incomingPlate(ctx, w, h, t);
      const raw = (t * 0.46) % 1;
      const p = I < 0.02 ? 0 : raw;
      const fold = Math.abs(1 - p * 2);      // 1 → 0 → 1
      const creaseX = w * 0.5;

      ctx.save();
      ctx.fillStyle = '#04060b';
      ctx.fillRect(0, 0, w, h);

      // left half folding
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, creaseX, h);
      ctx.clip();
      ctx.translate(creaseX, 0);
      ctx.scale(Math.max(0.001, fold), 1);
      ctx.translate(-creaseX, 0);
      ctx.drawImage(src, 0, 0, w, h);
      ctx.restore();

      // right half unfolding, mirrored
      ctx.save();
      ctx.beginPath();
      ctx.rect(creaseX, 0, creaseX, h);
      ctx.clip();
      ctx.translate(creaseX, 0);
      ctx.scale(-Math.max(0.001, fold), 1);
      ctx.drawImage(p > 0.5 ? inc : src, 0, 0, w, h);
      ctx.restore();

      // incoming revealed once the fold passes 50%
      if (p > 0.5) {
        ctx.save();
        ctx.globalAlpha = clamp((p - 0.5) * 3.2, 0, 1);
        ctx.drawImage(inc, 0, 0, w, h);
        ctx.restore();
      }
      ctx.restore();

      // crease light
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createLinearGradient(creaseX - 10, 0, creaseX + 10, 0);
      g.addColorStop(0, 'rgba(167,139,250,0)');
      g.addColorStop(0.5, `rgba(196,181,253,${0.3 * Math.min(1.3, I + 0.3)})`);
      g.addColorStop(1, 'rgba(167,139,250,0)');
      ctx.fillStyle = g;
      ctx.fillRect(creaseX - 10, 0, 20, h);
      ctx.restore();
    },

    tr_chromaslide(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const inc = incomingPlate(ctx, w, h, t);
      const raw = (t * 0.5) % 1;
      const p = I < 0.02 ? 0 : raw;
      const spread = Math.sin(p * Math.PI) * (14 + 26 * I);

      ctx.save();
      ctx.fillStyle = '#04060b';
      ctx.fillRect(0, 0, w, h);

      // outgoing slides left, incoming right
      ctx.globalAlpha = 1 - p * 0.9;
      ctx.drawImage(src, -p * w * 0.5, 0, w, h);
      ctx.globalAlpha = clamp(p * 1.1, 0, 1);
      ctx.drawImage(inc, (1 - p) * w * 0.5, 0, w, h);
      ctx.restore();

      // channel ghosts (screen blends of the same plate at different offsets)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.3 * Math.min(1, I + 0.2);
      ctx.drawImage(p > 0.5 ? inc : src, -spread, 0, w, h);
      ctx.globalAlpha = 0.22 * Math.min(1, I + 0.2);
      ctx.drawImage(p > 0.5 ? inc : src, spread, 0, w, h);
      ctx.restore();

      // registration reticle
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `rgba(34,211,238,${0.14 + 0.22 * Math.min(1, I)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w - 30, h / 2 - 12); ctx.lineTo(w - 30, h / 2 + 12);
      ctx.moveTo(w / 2 - 12, 30); ctx.lineTo(w / 2 + 12, 30);
      ctx.stroke();
      ctx.restore();
    },

    tr_rollershutter(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const inc = incomingPlate(ctx, w, h, t);
      const raw = (t * 0.48) % 1;
      const p = I < 0.02 ? 0 : raw;
      const skew = Math.sin(p * Math.PI) * (18 + 40 * I);
      const rowH = Math.max(2, Math.round(h / 160));

      ctx.save();
      ctx.fillStyle = '#04060b';
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += rowH) {
        const v = y / h;
        const local = clamp((p - v * 0.35) / 0.55, 0, 1);
        const eased = local * local * (3 - 2 * local);
        ctx.globalAlpha = 1;
        ctx.drawImage(src, 0, y, w, rowH + 1,
          -skew * (1 - local) + v * skew * 0.4, y, w, rowH + 1);
        if (local > 0) {
          ctx.globalAlpha = eased;
          ctx.drawImage(inc, 0, y, w, rowH + 1,
            (1 - local) * skew * 1.4 - v * skew * 0.4, y, w, rowH + 1);
        }
      }
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(251,146,60,${0.05 + 0.08 * Math.min(1, I)})`;
      for (let y = 0; y < h; y += rowH * 4) ctx.fillRect(0, y, w, 1);
      ctx.restore();
    },

    tr_blobmorph(ctx, w, h, t, I, beat, preset) {
      const src = capture(ctx.canvas);
      const inc = incomingPlate(ctx, w, h, t);
      const raw = (t * 0.44) % 1;
      const p = I < 0.02 ? 0 : raw;
      const cx = w * 0.52, cy = h * 0.48;

      ctx.save();
      ctx.drawImage(src, 0, 0, w, h);
      ctx.restore();

      const maxR = Math.hypot(w, h) * 0.62;
      const r = Math.max(1, p * maxR * 1.15);
      const masked = maskedLayer(w, h, inc, (m) => {
        m.beginPath();
        const pts = 64;
        for (let i = 0; i <= pts; i++) {
          const a = (i / pts) * Math.PI * 2;
          const wob = 1 + (fbm(Math.cos(a) * 1.6 + t * 0.5, Math.sin(a) * 1.6 - t * 0.3, 3) - 0.5) * 0.42 * Math.min(1, I + 0.3);
          const rr = r * wob;
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr * 0.92;
          if (i === 0) m.moveTo(x, y); else m.lineTo(x, y);
        }
        m.closePath();
        m.fillStyle = '#fff';
        m.fill();
      });

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(masked, 0, 0, w, h);
      ctx.restore();

      // contour trace + soft bleed at the edge
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `rgba(52,211,153,${0.30 + 0.35 * Math.min(1, I)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const pts = 64;
      for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const wob = 1 + (fbm(Math.cos(a) * 1.6 + t * 0.5, Math.sin(a) * 1.6 - t * 0.3, 3) - 0.5) * 0.42 * Math.min(1, I + 0.3);
        const rr = r * wob;
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr * 0.92;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
  };

  // -------------------------------------------------------------------------
  // Temporal effects build their look over successive real frames (as they do
  // in TouchDesigner). When the effect changes we seed their buffers with the
  // current frame so the very first rendered frame already has content.
  const TEMPORAL = new Set([
    'td_feedback', 'tr_feedbackzoom', 'td_slitscan', 'td_datamosh',
    'td_datamosh_echo', 'td_rdmelt'
  ]);

  function seedTemporal(effectType, w, h, src) {
    if (!TEMPORAL.has(effectType)) return;
    if (effectType === 'td_slitscan') {
      if (!SLIT) { SLIT = mkCanvas(w, h); SLCTX = SLIT.getContext('2d'); }
      fit(SLIT, w, h);
      SLCTX.clearRect(0, 0, w, h);
      SLCTX.drawImage(src, 0, 0);
      slitW = w; slitH = h;
    } else {
      if (!FB) { FB = mkCanvas(w, h); FBCTX = FB.getContext('2d'); }
      fit(FB, w, h);
      FBCTX.setTransform(1, 0, 0, 1, 0, 0);
      FBCTX.globalCompositeOperation = 'source-over';
      FBCTX.globalAlpha = 1;
      FBCTX.clearRect(0, 0, w, h);
      FBCTX.drawImage(src, 0, 0, w, h);
    }
  }

  function render(ctx, w, h, t, effectType, intensity, beat, preset) {
    const I = clamp(intensity, 0, 2.2);
    const fn = SHADERS[effectType];
    if (!fn) return false;
    RS = clamp(Math.min(w, h) / REF_SHORT, 0.28, 24);
    // buffers re-fit themselves on size change; no need to thrash allocations
    if (LAST_W !== w || LAST_H !== h) { LAST_W = w; LAST_H = h; }
    // feedback / slit-scan are temporal: reset them when the effect changes
    if (LAST_FN !== effectType) {
      LAST_FN = effectType;
      blockState = null;
      try { seedTemporal(effectType, w, h, ctx.canvas); } catch (_e) { /* first frame */ }
    }
    ctx.save();
    try {
      fn(ctx, w, h, t, I, beat || 0, preset || {});
    } finally {
      ctx.restore();
    }
    return true;
  }

  function setQuality(q) { QUALITY = q === 'export' ? 'export' : 'preview'; }
  function getQuality() { return QUALITY; }

  function hasShader(effectType) {
    return !!SHADERS[effectType];
  }

  // Quick synthetic plate used by the mini card thumbnails
  function thumbPlate(ctx, w, h, t, accent) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#101826');
    g.addColorStop(0.45, '#1b2a3d');
    g.addColorStop(0.75, '#3a2431');
    g.addColorStop(1, '#0b0d14');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // practical light
    const lg = ctx.createRadialGradient(w * 0.66, h * 0.42, 1, w * 0.66, h * 0.42, h * 0.85);
    lg.addColorStop(0, 'rgba(255,232,196,0.95)');
    lg.addColorStop(0.25, 'rgba(255,170,95,0.45)');
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, w, h);

    // subject silhouette
    ctx.fillStyle = 'rgba(6,9,14,0.9)';
    ctx.beginPath();
    ctx.ellipse(w * 0.42, h * 1.02, w * 0.22, h * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.42, h * 0.44, h * 0.17, 0, Math.PI * 2);
    ctx.fill();

    // bokeh
    ctx.fillStyle = accent || '#f43f5e';
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(w * (0.1 + i * 0.19), h * (0.74 - (i % 3) * 0.12), 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawThumb(canvas, effectType, accent, t) {
    if (!hasShader(effectType)) return false;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const time = t === undefined ? 1.7 : t;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    thumbPlate(ctx, w, h, time, accent);
    // keep thumbnails legible: run shaders at a mild intensity
    const fake = { accent };
    RS = clamp(Math.min(w, h) / REF_SHORT, 0.28, 24);
    SHADERS[effectType](ctx, w, h, time, 0.85, 0.2, fake);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return true;
  }

  return { render, hasShader, drawThumb, setQuality, getQuality, presets: TD_PRESETS };
})();

window.TD_PRESETS = TD_PRESETS;
window.TRANSITION_PRESETS = TD_PRESETS.filter((p) => p.isTransition);
window.TD_ENGINE = TD_ENGINE;
