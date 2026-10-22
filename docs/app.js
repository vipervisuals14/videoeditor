// ============================================================================
// PULSEVFX STUDIO — DaVinci Resolve Free 21.1.1 Optical VFX & LYRC Engine
// ============================================================================

const VFX_PRESETS = [
  // 1. OPTICAL & GLASS (Real Lens Physics & Emulsion Scatter)
  {
    id: 'opt_500t_halation',
    name: '500T Halation Bloom',
    category: 'Optical & Glass',
    spec: 'IRE > 78%',
    node: 'LumaKeyer + SoftGlow (R:1.45)',
    desc: 'Authentic Kodak Vision3 red-orange emulsion scatter bleeding around high-IRE specular highlights.',
    effectType: 'opt_halation',
    accent: '#f97316'
  },
  {
    id: 'opt_anamorphic_fringe',
    name: 'Anamorphic Edge Fringing',
    category: 'Optical & Glass',
    spec: '2x Scope',
    node: 'LensDistort + ChannelBooleans',
    desc: 'Lateral red/cyan chromatic aberration restricted to the outer 28% of the lens barrel.',
    effectType: 'opt_fringe',
    accent: '#06b6d4'
  },
  {
    id: 'opt_split_diopter',
    name: 'Split-Diopter Refraction',
    category: 'Optical & Glass',
    spec: '+2 Diopter',
    node: 'Transform + BlurSeam + Mask',
    desc: 'Divides the frame into two simultaneous focal planes with an optical glass refraction seam.',
    effectType: 'opt_diopter',
    accent: '#38bdf8'
  },
  {
    id: 'opt_prism_ghost',
    name: 'Prism Corner Refraction',
    category: 'Optical & Glass',
    spec: '45° Glass',
    node: 'Transform (Mirror) + ScreenMerge',
    desc: 'Organic handheld glass prism double-reflection blooming across the outer frame corners.',
    effectType: 'opt_prism',
    accent: '#a855f7'
  },
  {
    id: 'opt_gate_weave',
    name: '16mm Gate Weave & Breath',
    category: 'Optical & Glass',
    spec: '0.4% SubPx',
    node: 'CameraShake (0.3Hz) + Vignette',
    desc: 'Sub-pixel mechanical film gate registration drift with subtle Arriflex SR3 border falloff.',
    effectType: 'opt_gateweave',
    accent: '#f59e0b'
  },
  {
    id: 'opt_tilt_plane',
    name: 'Tilt-Shift Oblique Plane',
    category: 'Optical & Glass',
    spec: 'f/1.4 Swing',
    node: 'Defocus + LinearMask',
    desc: 'Swings the plane of sharp focus diagonally across the subject with creamy out-of-focus falloff.',
    effectType: 'opt_tilt',
    accent: '#60a5fa'
  },

  // 2. SHUTTER & TIME (AWGE / Wong Kar-wai / Gibson Hazard Cadence)
  {
    id: 'time_360_smear',
    name: '360° Shutter Step-Print (8fps)',
    category: 'Shutter & Time',
    spec: '360° / 8fps',
    node: 'Trails (0.68) + TimeStretcher',
    desc: 'True slow-shutter frame accumulation that smears motion into silky trailing exposures.',
    effectType: 'time_smear',
    accent: '#e11d48'
  },
  {
    id: 'time_film_snip',
    name: '2-Frame Film Snip Cut',
    category: 'Shutter & Time',
    spec: '-2f Splice',
    node: 'TimeSpeed + ExposureSpike',
    desc: 'Excises 2 frames on the snare transient with a 1-stop physical splice flash.',
    effectType: 'time_snip',
    accent: '#f43f5e'
  },
  {
    id: 'time_velocity_snap',
    name: 'Optical Velocity Snap',
    category: 'Shutter & Time',
    spec: '320% ▸ 100%',
    node: 'TimeSpeed + OpticalFlow + Blur',
    desc: 'Asymmetric exponential speed burst into an instant dead-stop lockup on the downbeat.',
    effectType: 'time_velocity',
    accent: '#ec4899'
  },
  {
    id: 'time_echo_drag',
    name: 'Sub-Frame Luma Echo Drag',
    category: 'Shutter & Time',
    spec: '4-Tap Luma',
    node: 'Duplicate + LumaKey + TimeOffset',
    desc: 'Persists only bright highlight trails across 4 trailing sub-frames while keeping darks clean.',
    effectType: 'time_smear',
    accent: '#f97316'
  },
  {
    id: 'time_reverse_whip',
    name: 'Reverse 4-Frame Pre-Roll',
    category: 'Shutter & Time',
    spec: '-4f PreCut',
    node: 'TimeStretcher (ReverseTail)',
    desc: 'Reverses the final 4 frames before a cut so motion pulls backward into the incoming shot.',
    effectType: 'time_velocity',
    accent: '#8b5cf6'
  },
  {
    id: 'time_tape_catch',
    name: 'Analog Tape Transport Catch',
    category: 'Shutter & Time',
    spec: '3f Hold/Catch',
    node: 'TimeStretcher + DirectionalBlur',
    desc: 'Momentary 3-frame mechanical reel catch followed by a fast 200% catch-up slip.',
    effectType: 'time_snip',
    accent: '#14b8a6'
  },

  // 3. FILM LAB & GRADE (Division Paris / Fincher / Tactile Emulsion)
  {
    id: 'lab_bleach_bypass',
    name: 'Bleach Bypass Silver Retention',
    category: 'Film Lab & Grade',
    spec: 'Ag Halide',
    node: 'ColorCorrector + SoftGlow (Mult)',
    desc: 'Retains metallic silver in the emulsion for deep crushed blacks, cold steel mids, and hard speculars.',
    effectType: 'lab_bleach',
    accent: '#94a3b8'
  },
  {
    id: 'lab_kodak_2383',
    name: 'Kodak 2383 Print Stock Curve',
    category: 'Film Lab & Grade',
    spec: '2383 LUT',
    node: 'ColorCurves + SplitTone',
    desc: 'Dense cinema print stock toe/shoulder roll-off with deep teal-black shadows and warm skin separation.',
    effectType: 'lab_2383',
    accent: '#f59e0b'
  },
  {
    id: 'lab_flir_luma',
    name: 'FLIR Monochrome Thermal Map',
    category: 'Film Lab & Grade',
    spec: 'LWIR Sensor',
    node: 'LumaGradient + FineGrain',
    desc: 'High-detail military monochrome/amber thermal luminance mapping without cheesy rainbow banding.',
    effectType: 'lab_flir',
    accent: '#38bdf8'
  },
  {
    id: 'lab_threshold_print',
    name: 'Threshold Silver Litho Print',
    category: 'Film Lab & Grade',
    spec: '2-Tone Dither',
    node: 'LumaKeyer + FilmGrain (Coarse)',
    desc: 'Brutalist high-contrast darkroom litho print with organic silver grain dithering in midtones.',
    effectType: 'lab_litho',
    accent: '#e5e7eb'
  },
  {
    id: 'lab_roll_flash',
    name: 'End-of-Roll Lab Light Leak',
    category: 'Film Lab & Grade',
    spec: 'Amber Burn',
    node: 'FastNoise + ScreenGain (Red/Amber)',
    desc: 'Authentic optical printer edge fogging that sweeps across the frame over 6 frames at cut points.',
    effectType: 'lab_leak',
    accent: '#ea580c'
  },
  {
    id: 'lab_trix_grain',
    name: '35mm Tri-X Midtone Silver Grain',
    category: 'Film Lab & Grade',
    spec: 'ISO 800 Push',
    node: 'FilmGrain (LumaWeighted)',
    desc: 'Luminance-masked 35mm silver halide grain concentrated in midtones while protecting clean blacks.',
    effectType: 'lab_bleach',
    accent: '#a1a1aa'
  },

  // 4. CAMERA WEIGHT & KINETIC (Physical & Weighted, Zero Cartoon Shake)
  {
    id: 'cam_shoulder_float',
    name: 'Weighted Shoulder-Rig Float',
    category: 'Camera Weight',
    spec: '0.8Hz Rig',
    node: 'CameraShake (0.8Hz Sine)',
    desc: 'Adds the natural breathing inertia of a 22lb Arri Alexa shoulder rig to static tripod shots.',
    effectType: 'cam_float',
    accent: '#10b981'
  },
  {
    id: 'cam_sub_thump',
    name: 'Damped Sub-Bass Lens Thump',
    category: 'Camera Weight',
    spec: '808 Damped',
    node: 'Transform (Z-Spring) + RadialBlur',
    desc: 'Heavy, critically-damped axial focal compression on 808 kicks with zero chaotic lateral jitter.',
    effectType: 'cam_thump',
    accent: '#e11d48'
  },
  {
    id: 'cam_snare_snap',
    name: 'Snare 1.06x Micro-Snap',
    category: 'Camera Weight',
    spec: '+6% 3-Frame',
    node: 'Transform (1.06x ExpDecay)',
    desc: 'Subtle 6% focal-length step-in on snare transients that decays smoothly over 5 frames.',
    effectType: 'cam_thump',
    accent: '#f43f5e'
  },
  {
    id: 'cam_whip_pan',
    name: '180° Shutter Whip-Pan',
    category: 'Camera Weight',
    spec: '5-Frame Whip',
    node: 'Transform + DirectionalBlur (0°)',
    desc: 'Physical horizontal camera pan smear across clip boundaries with mirrored motion edges.',
    effectType: 'cam_whip',
    accent: '#06b6d4'
  },
  {
    id: 'cam_crash_zoom',
    name: 'Crash-Zoom Barrel Snap',
    category: 'Camera Weight',
    spec: '24–70mm Snap',
    node: 'Transform (Size) + DefocusHunt',
    desc: 'Raw documentary parfocal manual zoom snap from 1.0x to 1.32x with 2-frame focus catch.',
    effectType: 'time_velocity',
    accent: '#f59e0b'
  },
  {
    id: 'cam_vertigo',
    name: 'Vertigo Counter-Dolly Warp',
    category: 'Camera Weight',
    spec: 'Z-Counter',
    node: 'LensDistort + ScaleCounter',
    desc: 'Subtle optical perspective compression that expands background scale relative to center subject.',
    effectType: 'opt_fringe',
    accent: '#8b5cf6'
  },

  // 5. DEPTH & SUBJECT (Clean Editorial Separation)
  {
    id: 'depth_sep',
    name: 'Subject Depth Separation',
    category: 'Depth & Subject',
    spec: '-0.7 EV Bg',
    node: 'EllipseMask + Grade + Defocus',
    desc: 'Pulls background down 0.7 stops and adds subtle optical falloff so the artist or speaker pops in 3D.',
    effectType: 'depth_sep',
    accent: '#3b82f6'
  },
  {
    id: 'depth_sky_burn',
    name: 'Luma-Key Highlight Burn',
    category: 'Depth & Subject',
    spec: 'IRE > 82%',
    node: 'LumaKeyer + Glow + Tint',
    desc: 'Isolates sky and practical light fixtures above 82% IRE for stylized exposure bloom.',
    effectType: 'opt_halation',
    accent: '#f97316'
  },
  {
    id: 'depth_streak',
    name: 'Anamorphic Highlight Streak',
    category: 'Depth & Subject',
    spec: 'Horizontal 2x',
    node: 'LumaKeyer + DirectionalGlow (X)',
    desc: 'projects a clean horizontal cyan/amber anamorphic streak strictly from specular light sources.',
    effectType: 'depth_streak',
    accent: '#06b6d4'
  },
  {
    id: 'depth_cutout_flash',
    name: 'Pre-Drop Cutout Pre-Echo',
    category: 'Depth & Subject',
    spec: '-4f Cutout',
    node: 'LumaMask + Transform + TimeOffset',
    desc: 'Flashes a high-contrast isolated frame of the incoming subject 4 frames before the beat drops.',
    effectType: 'time_snip',
    accent: '#ec4899'
  },
  {
    id: 'depth_shadow_offset',
    name: 'Offset Shadow Silhouette',
    category: 'Depth & Subject',
    spec: '16px Lag',
    node: 'Duplicate + TimeDelay + Multiply',
    desc: 'Trails a dark, desaturated 2-frame delayed silhouette behind fast subject movement.',
    effectType: 'time_smear',
    accent: '#64748b'
  },
  {
    id: 'depth_skin_rolloff',
    name: 'Specular Skin Roll-Off',
    category: 'Depth & Subject',
    spec: 'Soft Knee',
    node: 'LumaKeyer + Blur + HighlightCompress',
    desc: 'Compresses harsh digital LED key-light hotspots on skin tones for an organic filmic roll-off.',
    effectType: 'depth_sep',
    accent: '#fda4af'
  },

  // 6. EDITORIAL POLISH (Talking Head & High-End Brand Content)
  {
    id: 'ed_2cam_punch',
    name: '2-Cam Jump-Cut Switch (1.08x)',
    category: 'Editorial Polish',
    spec: '1.08x + EyeLine',
    node: 'Transform (1.08x, Y:-0.015)',
    desc: 'Seamless focal-length switch with eye-line compensation to make jump cuts look like a 2-camera shoot.',
    effectType: 'cam_thump',
    accent: '#10b981'
  },
  {
    id: 'ed_pip_frame',
    name: 'Documentary Frame-in-Frame',
    category: 'Editorial Polish',
    spec: '82% Inner Pip',
    node: 'BackgroundBlur + Transform (0.82) + Border',
    desc: 'Floats a crisp 82% inner frame with a 1px border over a darkened, optically blurred backdrop of itself.',
    effectType: 'ed_pip',
    accent: '#38bdf8'
  },
  {
    id: 'ed_letterbox',
    name: '2.39:1 Scope Matte + Rounded Gate',
    category: 'Editorial Polish',
    spec: '2.39:1 + 6px',
    node: 'Letterbox + RoundedMask',
    desc: 'Cinematic 2.39:1 widescreen crop with subtle rounded 35mm film gate corners.',
    effectType: 'ed_scope',
    accent: '#e5e7eb'
  },
  {
    id: 'ed_soft_vignette',
    name: 'Studio Soft-Knee Perimeter Falloff',
    category: 'Editorial Polish',
    spec: '-0.65 EV Edge',
    node: 'Vignette + S-Curve',
    desc: 'Gradual optical perimeter darkening that draws viewer focus directly to the speaker.',
    effectType: 'depth_sep',
    accent: '#a855f7'
  },
  {
    id: 'ed_whip_jcut',
    name: 'Editorial Whip + Flash Bridge',
    category: 'Editorial Polish',
    spec: '4-Frame Bridge',
    node: 'DirectionalBlur + GainCurve',
    desc: 'Fast, clean agency-style 4-frame directional blur bridge for B-roll montage sequences.',
    effectType: 'cam_whip',
    accent: '#f59e0b'
  },
  {
    id: 'ed_split_screen',
    name: 'Dual-Take Vertical Split Frame',
    category: 'Editorial Polish',
    spec: '50/50 Crop',
    node: 'Crop + Merge + DividerLine',
    desc: 'Pairs performance A-cam and B-roll side-by-side inside a clean editorial split composition.',
    effectType: 'opt_diopter',
    accent: '#06b6d4'
  }
];

// ---------------------------------------------------------------------------
// TOUCHDESIGNER TOP DISTORTIONS (12) + TRANSITIONS & MORPHS (8)
// defined in touchdesigner.js — merged here so every category is searchable,
// gets its own 0–200% intensity slider and full keyframe lane.
// ---------------------------------------------------------------------------
if (window.TD_PRESETS) {
  VFX_PRESETS.push(...window.TD_PRESETS);
}

const TD_CATEGORIES = ['TouchDesigner TOPs', 'Data & Print TOPs', 'Glitch & Bitmap TOPs', 'Transitions & Morphs'];

// ============================================================================
// KEYFRAME ENGINE — per-effect/per-transition intensity curves (0–200%)
// ============================================================================
const KF = {
  tracks: {},          // presetId -> [{ t, v, ease }]
  intensity: {},       // presetId -> base intensity % (no keyframes)
  master: 100
};

function kfTrack(presetId) {
  if (!KF.tracks[presetId]) KF.tracks[presetId] = [];
  return KF.tracks[presetId];
}

function baseIntensity(presetId) {
  return KF.intensity[presetId] === undefined ? 100 : KF.intensity[presetId];
}

function setBaseIntensity(presetId, v) {
  KF.intensity[presetId] = Math.round(Math.max(0, Math.min(200, v)));
}

function sortTrack(presetId) {
  kfTrack(presetId).sort((a, b) => a.t - b.t);
}

function evalKeyframes(kfs, timeSec) {
  if (!kfs || kfs.length === 0) return null;
  if (kfs.length === 1) return kfs[0].v;
  if (timeSec <= kfs[0].t) return kfs[0].v;
  if (timeSec >= kfs[kfs.length - 1].t) return kfs[kfs.length - 1].v;
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i], b = kfs[i + 1];
    if (timeSec >= a.t && timeSec <= b.t) {
      const span = Math.max(0.0001, b.t - a.t);
      let u = (timeSec - a.t) / span;
      if (a.ease === 'hold') u = 0;
      else if (a.ease !== 'linear') u = u * u * (3 - 2 * u); // smooth bezier-ish ease
      return a.v + (b.v - a.v) * u;
    }
  }
  return kfs[kfs.length - 1].v;
}

function effectiveIntensity(presetId, timeSec) {
  const kfs = KF.tracks[presetId];
  const raw = (kfs && kfs.length) ? evalKeyframes(kfs, timeSec) : baseIntensity(presetId);
  return Math.max(0, Math.min(220, (raw || 0) * (KF.master / 100)));
}

function addKeyframe(presetId, timeSec, value) {
  const track = kfTrack(presetId);
  const t = Math.max(0, Math.min(state.totalDurSec, timeSec));
  const v = Math.max(0, Math.min(200, Math.round(value)));
  const existing = track.find((k) => Math.abs(k.t - t) < 0.08);
  if (existing) {
    existing.v = v;
  } else {
    track.push({ t, v, ease: 'smooth' });
  }
  sortTrack(presetId);
  return track;
}

function removeKeyframeAt(presetId, timeSec) {
  const track = kfTrack(presetId);
  const idx = track.findIndex((k) => Math.abs(k.t - timeSec) < 0.12);
  if (idx >= 0) track.splice(idx, 1);
  return track;
}

function setEnvelope(presetId, kind) {
  const d = state.totalDurSec;
  const v = baseIntensity(presetId);
  let kfs = [];
  if (kind === 'peak') {
    kfs = [{ t: 0, v: 0, ease: 'smooth' }, { t: d * 0.45, v: v * 1.55, ease: 'smooth' }, { t: d, v: 0, ease: 'smooth' }];
  } else if (kind === 'ramp_in') {
    kfs = [{ t: 0, v: 0, ease: 'smooth' }, { t: d, v: v * 1.6, ease: 'smooth' }];
  } else if (kind === 'decay') {
    kfs = [{ t: 0, v: Math.min(200, v * 1.9), ease: 'smooth' }, { t: d * 0.35, v: v, ease: 'smooth' }, { t: d, v: 0, ease: 'smooth' }];
  } else if (kind === 'lfo') {
    const cycles = 4;
    for (let i = 0; i <= cycles * 2; i++) {
      kfs.push({ t: (i / (cycles * 2)) * d, v: i % 2 === 0 ? v * 0.15 : v * 1.45, ease: 'smooth' });
    }
  }
  KF.tracks[presetId] = kfs.map((k) => ({ ...k, v: Math.round(k.v) }));
  sortTrack(presetId);
}

// ============================================================================
// LYRC.STUDIO 20 KINETIC LYRIC PRESETS & BRAND CAPTION STYLES
// ============================================================================
const CAPTION_STYLES = [
  {
    id: 'duet',
    name: 'Duet',
    category: 'Bold',
    previewHtml: '<span>BOLD</span> <em style="font-family:Georgia,serif;color:#f472b6;">serif</em>',
    desc: 'Two font roles (Grotesque Sans + Expressive Serif Italic) trade emphasis as words arrive.',
    supportsVariation: true,
    fav: true,
    primary: '#ffffff',
    accent: '#f472b6'
  },
  {
    id: 'redline',
    name: 'Redline',
    category: 'Bold',
    previewHtml: '<span style="background:#ef4444;color:#000;padding:1px 5px;">RED</span>LINE',
    desc: 'Bold stacked type builds with red accents and selective inverted knockout boxes.',
    supportsVariation: true,
    fav: true,
    primary: '#ffffff',
    accent: '#ef4444'
  },
  {
    id: 'tiled_wave',
    name: 'Tiled Wave',
    category: 'Layered',
    previewHtml: 'TILED<br/><span style="color:#38bdf8;font-size:10px;">WAVE ▦</span>',
    desc: 'A 2D tiled mosaic composition shifts and locks in as each phrase arrives.',
    supportsVariation: true,
    fav: true,
    primary: '#ffffff',
    accent: '#38bdf8'
  },
  {
    id: 'margin',
    name: 'Margin',
    category: 'Layered',
    previewHtml: '▎MAR<span style="color:#a855f7;">GIN</span>',
    desc: 'Editorial side-column composition builds along a vertical rail and hands off between phrases.',
    supportsVariation: true,
    fav: true,
    primary: '#ffffff',
    accent: '#a855f7'
  },
  {
    id: 'relay',
    name: 'Relay',
    category: 'Layered',
    previewHtml: '<span style="background:#a855f7;color:#fff;padding:1px 5px;border-radius:3px;">RELAY</span>',
    desc: 'Fixed-recipe stacked color block cards that relay down the frame as words land.',
    supportsVariation: false,
    fav: false,
    primary: '#ffffff',
    accent: '#a855f7'
  },
  {
    id: 'brat',
    name: 'Brat',
    category: 'Bold',
    previewHtml: '<span style="background:#8ace00;color:#000;padding:1px 6px;font-weight:700;filter:blur(0.4px);">brat</span>',
    desc: 'Stretched lowercase Arial with low-res blur and optional #8ACE00 Brat lime card.',
    supportsVariation: false,
    fav: true,
    primary: '#000000',
    accent: '#8ace00'
  },
  {
    id: 'uplift',
    name: 'Uplift',
    category: 'Bold',
    previewHtml: 'UP<span style="color:#facc15;">LIFT ↑</span>',
    desc: 'Rising vertical kinetic stack where words float upward into lockup on each beat.',
    supportsVariation: true,
    fav: false,
    primary: '#ffffff',
    accent: '#facc15'
  },
  {
    id: 'full_set',
    name: 'Full Set',
    category: 'Layered',
    previewHtml: 'FULL<br/><span style="color:#ec4899;font-size:10px;">SET ▤</span>',
    desc: 'Full-frame typographic poster lockup where every line in the phrase shares the screen.',
    supportsVariation: true,
    fav: false,
    primary: '#ffffff',
    accent: '#ec4899'
  },
  {
    id: 'heartless',
    name: 'Heartless',
    category: 'Bold',
    previewHtml: '<em style="font-family:Georgia,serif;color:#f87171;">heart</em>LESS',
    desc: 'Moody R&B / melodic rap center stack with crimson neon glow on emotional keywords.',
    supportsVariation: true,
    fav: true,
    primary: '#ffffff',
    accent: '#f87171'
  },
  {
    id: 'ticker',
    name: 'Ticker',
    category: 'Layered',
    previewHtml: '« TICKER »',
    desc: 'High-speed horizontal kinetic tape sliding along top/bottom guide rails.',
    supportsVariation: true,
    fav: false,
    primary: '#ffffff',
    accent: '#22d3ee'
  },
  {
    id: 'deep_focus',
    name: 'Deep Focus',
    category: 'Minimal',
    previewHtml: '<span style="filter:blur(1.2px);opacity:0.7;">DEEP</span> FOCUS',
    desc: 'Out-of-focus words smoothly rack into razor-sharp optical focus as they are sung.',
    supportsVariation: true,
    fav: true,
    primary: '#ffffff',
    accent: '#67e8f9'
  },
  {
    id: 'afterimage',
    name: 'Afterimage',
    category: 'Minimal',
    previewHtml: 'ECHO<span style="opacity:0.35;">ECHO</span>',
    desc: 'Fixed-recipe motion ghost trail that leaves decaying vertical echoes behind the active word.',
    supportsVariation: false,
    fav: false,
    primary: '#ffffff',
    accent: '#c084fc'
  },
  {
    id: 'afterglow',
    name: 'Afterglow',
    category: 'Minimal',
    previewHtml: '<span style="text-shadow:0 0 10px #f472b6;">GLOW</span>',
    desc: 'Soft luminous bloom aura that expands gently around held chorus notes.',
    supportsVariation: false,
    fav: false,
    primary: '#fdf2f8',
    accent: '#f472b6'
  },
  {
    id: 'quiet',
    name: 'Quiet',
    category: 'Minimal',
    previewHtml: '<span style="letter-spacing:3px;font-weight:400;font-size:11px;">quiet</span>',
    desc: 'Delicate, wide-tracked lowercase cinema typography for acoustic & late-night tracks.',
    supportsVariation: false,
    fav: false,
    primary: '#e5e7eb',
    accent: '#fde68a'
  },
  {
    id: 'voltage',
    name: 'VOLTAGE',
    category: 'Bold',
    previewHtml: '<span style="color:#22d3ee;">VOLT</span><span style="color:#f43f5e;">AGE</span>',
    desc: 'High-voltage electric jitter with cyan/crimson chromatic edge split.',
    supportsVariation: false,
    fav: false,
    primary: '#ffffff',
    accent: '#22d3ee'
  },
  {
    id: 'overdrive',
    name: 'Overdrive',
    category: 'Bold',
    previewHtml: '<em style="color:#fb923c;">OVERDRIVE</em>',
    desc: 'Forward-sheared italic impact words slamming in horizontally on drum transients.',
    supportsVariation: true,
    fav: false,
    primary: '#ffffff',
    accent: '#fb923c'
  },
  {
    id: 'ladder_house',
    name: 'Ladder House',
    category: 'Layered',
    previewHtml: 'LAD↗<br/><span style="color:#a78bfa;font-size:10px;">DER</span>',
    desc: 'Stepped diagonal staircase composition that climbs across the canvas word by word.',
    supportsVariation: true,
    fav: false,
    primary: '#ffffff',
    accent: '#a78bfa'
  },
  {
    id: 'letterpress',
    name: 'Letterpress',
    category: 'Bold',
    previewHtml: '<span style="text-shadow:3px 3px 0 #ec4899;">PRESS</span>',
    desc: 'Heavy 3D extruded block shadow typography that stamps onto the frame.',
    supportsVariation: true,
    fav: false,
    primary: '#ffffff',
    accent: '#ec4899'
  },
  {
    id: 'hormozi_pop',
    name: 'Hormozi Brand',
    category: 'Talking',
    previewHtml: 'BRAND<span style="color:#facc15;"> PRO</span>',
    desc: 'High-retention talking-head word-by-word pop with yellow/green active keyword highlight.',
    supportsVariation: false,
    fav: true,
    primary: '#ffffff',
    accent: '#facc15'
  },
  {
    id: 'clean_pill',
    name: 'Creator Pill',
    category: 'Talking',
    previewHtml: '<span style="background:#10b981;color:#000;padding:1px 5px;border-radius:4px;">PILL</span>',
    desc: 'Frosted dark pill backdrop with crisp active word pill box for brand storytelling.',
    supportsVariation: false,
    fav: false,
    primary: '#ffffff',
    accent: '#10b981'
  }
];

const DEFAULT_LYRICS_TEXT = `Blame it all on you when the midnight city fades
We been driving past the redline through the neon haze
Every single word is tiled across the studio frame
Duet trading emphasis while they calling out our name
Turn a fifteen second snippet to a million views
Lock the song template once and let the footage move
From Spotify straight into DaVinci Resolve Free
Zero third party plugins, built the whole suite`;

const DEFAULT_TALKING_TEXT = `Stop spending ten hours editing talking head videos by hand
First we automatically strip out every awkward pause and silence
Then we punch in eight percent on jump cuts to keep retention high
Next we layer dynamic word by word captions right in the center
And finally we pull B-roll straight from your Resolve Media Pool
All running inside DaVinci Resolve Free 21.1.1 with zero paid plugins`;

const INITIAL_SILENCE_SEGMENTS = [
  { id: 1, start: 0.0, end: 4.2, db: -14, type: 'speech', label: 'Hook: "Stop spending 10 hours editing by hand..."', forceKeep: false },
  { id: 2, start: 4.2, end: 6.1, db: -41, type: 'silence', label: 'Dead Air / Breath Pause (1.9s)', forceKeep: false },
  { id: 3, start: 6.1, end: 11.4, db: -12, type: 'speech', label: 'Point 1: "First we strip out every awkward pause..."', forceKeep: false },
  { id: 4, start: 11.4, end: 13.0, db: -38, type: 'silence', label: 'Looking at notes pause (1.6s)', forceKeep: false },
  { id: 5, start: 13.0, end: 18.5, db: -11, type: 'speech', label: 'Point 2: "Then we punch in 8% on jump cuts..."', forceKeep: false },
  { id: 6, start: 18.5, end: 20.8, db: -44, type: 'silence', label: 'Room noise / cough pause (2.3s)', forceKeep: false },
  { id: 7, start: 20.8, end: 26.2, db: -13, type: 'speech', label: 'Point 3: "Next we layer word-by-word captions..."', forceKeep: false },
  { id: 8, start: 26.2, end: 28.9, db: -36, type: 'silence', label: 'Retake hesitation pause (2.7s)', forceKeep: false },
  { id: 9, start: 28.9, end: 33.3, db: -12, type: 'speech', label: 'Outro: "All inside DaVinci Resolve Free 21.1.1!"', forceKeep: false },
  { id: 10, start: 33.3, end: 36.0, db: -46, type: 'silence', label: 'Tail dead air before camera stop (2.7s)', forceKeep: false }
];

const INITIAL_MEDIA_POOL = [
  { id: 'mp_1', name: 'A_CAM_AlexaMini_Anamorphic_01.mov', bin: 'Performance', duration: '00:02:14', frames: 3216, fps: 24, res: '3840x2160', color: '#e11d48', included: true },
  { id: 'mp_2', name: 'B_CAM_16mm_Arriflex_LowAngle.mov', bin: 'Performance', duration: '00:01:48', frames: 2592, fps: 24, res: '3840x2160', color: '#a855f7', included: true },
  { id: 'mp_3', name: 'BROLL_Late_Night_Drive_500T.mov', bin: 'B-Roll', duration: '00:00:34', frames: 816, fps: 60, res: '3840x2160', color: '#06b6d4', included: true },
  { id: 'mp_4', name: 'BROLL_Studio_Spotlight_Silhouette.mov', bin: 'B-Roll', duration: '00:00:28', frames: 672, fps: 60, res: '3840x2160', color: '#06b6d4', included: true },
  { id: 'mp_5', name: 'BROLL_Sodium_Vapor_Tunnel_Run.mov', bin: 'B-Roll', duration: '00:00:19', frames: 456, fps: 24, res: '1920x1080', color: '#f59e0b', included: true },
  { id: 'mp_6', name: 'TALKING_HEAD_Founder_KeyLight_A.mp4', bin: 'Talking Head', duration: '00:04:12', frames: 6048, fps: 24, res: '3840x2160', color: '#3b82f6', included: true },
  { id: 'mp_7', name: 'TALKING_HEAD_85mm_Tight_Angle_B.mp4', bin: 'Talking Head', duration: '00:04:12', frames: 6048, fps: 24, res: '3840x2160', color: '#3b82f6', included: true },
  { id: 'mp_8', name: 'BROLL_Macro_Hardware_ProbeLens.mov', bin: 'B-Roll', duration: '00:00:22', frames: 528, fps: 60, res: '3840x2160', color: '#10b981', included: true },
  { id: 'mp_9', name: 'MASTER_142BPM_Atari_24bit.wav', bin: 'Audio', duration: '00:02:30', frames: 3600, fps: 24, res: '48kHz 24-bit', color: '#10b981', included: true },
  { id: 'mp_10', name: 'VO_Schoeps_MK41_Clean_Dialogue.wav', bin: 'Audio', duration: '00:04:12', frames: 6048, fps: 24, res: '48kHz 24-bit', color: '#10b981', included: true }
];

// ============================================================================
// APPLICATION STATE
// ============================================================================
const state = {
  // 'empty' until real footage is loaded: no procedural stand-in plates.
  scene: 'empty', // 'empty' | 'custom_video' | 'custom_image'
  activeTab: 'vfx',
  selectedVfxCat: 'ALL',
  vfxSearch: '',
  activePreset: VFX_PRESETS[0], // 500T Halation Bloom
  masterIntensity: 100, // global scale for all per-effect intensities
  bpm: 142,
  mixShakes: 70,
  mixStylized: 45,
  splitCompare: false,
  vertical916: false,
  platePanX: 0,           // 9:16 framing: -1 left, 0 centre, 1 right
  showLyricsOverlay: false,   // clean picture by default — opt in from 02 • LYRC
  motion: true,
  frozenTime: 0,
  hiddenModules: {},
  isPlaying: false,           // nothing plays until Play is pressed
  playheadSec: 0,
  totalDurSec: 0,             // 0 = nothing loaded yet
  hitFlashBurst: 0,
  clipShuffleSeed: 1,

  // Magic Mask / AI matte state (built lazily by ensureMaskState)
  mask: null,

  // Depth map / depth effects state (built lazily by ensureDepthState)
  depth: null,

  // Effect layer stack: ordered looks stacked on top of the active preset
  layers: [],
  layerSeq: 0,

  // Imported 4K source metadata for the render bay
  rbSource: null,

  // Silence Cutter state
  silenceThresholdDb: -32,
  silenceMinMs: 300,
  silencePadMs: 60,
  silenceSegments: [],        // nothing detected until you ask for it

  // LYRC.studio Captions & Lyrics state
  lyrcFilterCat: 'ALL',
  captionStyle: CAPTION_STYLES[0], // Duet
  variationSeed: 1,
  fontPair: 'sans_serif',
  alignment: 'center',
  backdropMode: 'auto',
  primaryColor: '#ffffff',
  accentColor: '#f472b6',
  fontScale: 105,
  posY: 52,
  cues: [],

  // Media Pool Auto-Editor state
  directorMode: 'music_video',
  selectedBin: 'ALL',
  mediaPool: structuredClone(INITIAL_MEDIA_POOL),

  // Timeline tracks state
  // Edits appear here only after you make them — the timeline starts blank.
  timelineTracks: { v3: [], v2: [], v1: [], sub: [], a1: [] },
};

// Offscreen frame buffer for authentic 360° Shutter Step-Printing / Motion Trail accumulation
let offscreenBuffer = null;
let offscreenCtx = null;

// ============================================================================
// INITIALIZATION
// ============================================================================
let bootDone = false;
document.addEventListener('DOMContentLoaded', () => {
  if (bootDone) return;
  bootDone = true;
  initTabs();
  initSceneSwitcher();
  initMonitorDropZone();
  initVfxTab();
  initKeyframeEditor();
  startCardThumbnailLoop();
  initSilenceTab();
  initCaptionsTab();
  initMediaPoolTab();
  initMaskTab();
  initDepthTab();
  initLayers();
  initRenderBay();
  initMonitorAndTimeline();
  initModules();
  initBridgeModal();
  initConsoleModal();

  // Start honest: empty stage, paused transport, lyrics off, blank timeline.
  // Nothing is fabricating footage or edits before the user loads anything.
  if (state.scene === 'empty') clearStage();
  applyLyricsState(false);
  renderTimelineTracks();
  initBackend().then(() => startBridgeStatusPoll());
  requestAnimationFrame(renderLivePreviewLoop);
});

function showToast(msg, kind) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast' + (kind ? ' toast-' + kind : '');
  el.textContent = msg;
  container.appendChild(el);
  // errors and warnings stay up long enough to actually read
  setTimeout(() => el.remove(), kind === 'warn' || kind === 'error' ? 6500 : 3400);
}

// ============================================================================
// STATIC / WEB MODE
// ----------------------------------------------------------------------------
// The hosted build has no local server and therefore no Resolve bridge, so an
// action cannot be dispatched over the mailbox. Instead the exact same Lua
// generator (public/lua-export.js) runs in the browser and hands you one snippet
// to paste into Resolve ▸ Workspace ▸ Console. Server mode is unchanged.
// ============================================================================
function copyText(text, okMsg) {
  const done = () => showToast(okMsg || 'Copied to clipboard', 'ok');
  const fallback = () => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand && document.execCommand('copy');
      ta.remove();
      ok ? done() : showToast('Text is selected — press ⌘C to copy', 'warn');
    } catch (_e) {
      showToast('Select the text and press ⌘C to copy', 'warn');
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else {
    fallback();
  }
}

async function initBackend() {
  state.staticMode = false;
  state.recipes = null;

  if (window.PULSE_BUILD === 'web') {
    state.staticMode = true;
  } else {
    try {
      const res = await fetch('api/status', { cache: 'no-store' });
      const data = await res.json();
      if (!data || data.ok !== true) throw new Error('not a pulse server');
    } catch (_err) {
      state.staticMode = true;
    }
  }

  if (state.staticMode) {
    try {
      const res = await fetch('preset-recipes.json', { cache: 'no-store' });
      state.recipes = await res.json();
    } catch (_err) {
      state.recipes = null;
    }
  }
  applyModeChrome();
}

// Same lookup + fallback the Node server uses, so a card always gets a graph.
function recipeForLocal(presetId, category) {
  const all = state.recipes && state.recipes.recipes ? state.recipes.recipes : null;
  if (all && presetId && all[presetId]) return all[presetId];
  if (!category) return null;
  return {
    label: presetId || category,
    category,
    family: 'generic',
    chain: [{ tool: 'BrightnessContrast', bg: true, key: true, input: 'Gain', scale: 1.0 }],
    marker: 'Fuchsia'
  };
}

function applyModeChrome() {
  const dot = document.getElementById('bridgeStatusDot');
  const text = document.getElementById('bridgeStatusText');
  const cov = document.getElementById('wireRecipeCount');
  if (state.staticMode) {
    if (dot) dot.className = 'status-dot installed';
    if (text) text.textContent = 'Web mode · paste to Resolve Console';
    if (cov && state.recipes) {
      const n = state.recipes.count || Object.keys(state.recipes.recipes || {}).length;
      cov.textContent = `${n} buildable graphs · console mode`;
    }
    paintWireStrip({ live: false });
    const stateEl = document.getElementById('wireState');
    if (stateEl) {
      stateEl.className = 'wire-pill installed';
      stateEl.textContent = 'Web / Console mode';
    }
    const chainEl = document.getElementById('wireChain');
    if (chainEl && !(state.bridge && state.bridge.lastGraph)) {
      chainEl.textContent = 'Press “+ Apply” — you get one Lua snippet to paste in Resolve';
    }
  }
}

function openConsoleModal(snippet, hint) {
  const modal = document.getElementById('consoleModal');
  const pre = document.getElementById('consoleLua');
  if (!modal || !pre) return;
  state.lastSnippet = snippet;
  pre.textContent = snippet;
  const hintEl = document.getElementById('consoleModalHint');
  if (hintEl) hintEl.textContent = hint || '';
  modal.classList.remove('hidden');
  // preselect so ⌘C / the Copy button always has the whole snippet
  try {
    const range = document.createRange();
    range.selectNodeContents(pre);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (_e) { /* selection is a nicety */ }
}

function initConsoleModal() {
  const modal = document.getElementById('consoleModal');
  if (!modal) return;
  const close = () => modal.classList.add('hidden');
  const closeBtn = document.getElementById('closeConsoleModalBtn');
  if (closeBtn) closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  const copyBtn = document.getElementById('copyConsoleLuaBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      copyText(state.lastSnippet || '', 'Lua copied — paste into Resolve ▸ Workspace ▸ Console');
    });
  }

  const dlBtn = document.getElementById('downloadConsoleLuaBtn');
  if (dlBtn) {
    dlBtn.addEventListener('click', () => {
      const blob = new Blob([state.lastSnippet || ''], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'PulseVFX_apply.lua';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    });
  }
}

// Builds the snippet locally and shows the paste dialog. Returns a dispatch-like
// object so every caller keeps working unchanged.
function staticDispatch(action, payload, toastMsg) {
  const p = Object.assign({}, payload);
  if (action === 'apply_vfx') {
    p.recipe = recipeForLocal(p.presetId, p.category);
  }
  if (action === 'add_captions_lyrics') {
    p.recipe = recipeForLocal('lyrc_' + p.presetId, p.category) || recipeForLocal(p.presetId, p.category);
  }
  if (action === 'mask_apply') {
    p.chainLabel = 'Paint → Polygon → Blur → MatteControl → Merge';
  }
  if (action === 'set_4k_timeline') {
    p.chainLabel = `Project → ${p.width || 3840} × ${p.height || 2160} @ ${p.fps || 24} fps → native render`;
  }
  if (action === 'layers_apply') {
    const rows = (p.layers || []).map((l) => {
      const tools = l.recipe && Array.isArray(l.recipe.chain)
        ? l.recipe.chain.map((st) => (typeof st === 'string' ? st : st.tool)).join(' → ')
        : 'BrightnessContrast';
      return `${l.name} (${tools})`;
    });
    p.chainLabel = ['MediaIn'].concat(rows).concat(['Merge → MediaOut']).join(' → ');
  }
  if (action === 'depth_apply') {
    const names = (p.effects || []).map((e) => (e.tools && e.tools[0]) || 'BrightnessContrast');
    p.chainLabel = ['DepthMap'].concat(names).concat(['Merge']).join(' → ');
  }
  const snippet = (window.LUA_EXPORT && LUA_EXPORT.generate)
    ? LUA_EXPORT.generate(action, p)
    : '-- generator missing (lua-export.js did not load)';

  const out = document.getElementById('luaCodeOutput');
  if (out) out.textContent = snippet;

  const chain = p.chainLabel || graphLabel(p.recipe);
  paintWireStrip({
    live: false,
    chain: chain ? `MediaIn → ${chain} → MediaOut` : '',
    error: null
  });

  const hasLua = !!(window.LUA_EXPORT && LUA_EXPORT.isConsoleAction(action));
  if (hasLua) {
    openConsoleModal(snippet, toastMsg ? toastMsg.replace(/\.$/, '') : '');
  }
  if (toastMsg) {
    showToast(hasLua
      ? `${toastMsg} — Lua ready, paste it into Resolve ▸ Workspace ▸ Console`
      : toastMsg, hasLua ? 'ok' : undefined);
  }
  return {
    ok: true,
    action,
    staticMode: true,
    liveBridgeConnected: false,
    bridgeReason: 'static_console_mode',
    recipe: p.recipe || null,
    luaSnippet: snippet
  };
}

// Paints the wire strip above the Lua drawer: what graph was sent to Resolve,
// whether the resident bridge answered, and how many native recipes ship today.
function paintWireStrip({ live, chain, mode, error } = {}) {
  const stateEl = document.getElementById('wireState');
  const chainEl = document.getElementById('wireChain');
  const bridge = state.bridge || {};
  if (typeof live === 'boolean') bridge.live = live;
  if (chain) bridge.lastGraph = chain;
  if (error !== undefined) bridge.lastError = error || null;

  if (stateEl) {
    if (bridge.lastError) {
      stateEl.className = 'wire-pill warn';
      stateEl.textContent = 'Resolve: ' + bridge.lastError;
    } else if (bridge.live) {
      stateEl.className = 'wire-pill ok';
      stateEl.textContent = bridge.target
        ? 'Live · target: ' + bridge.target
        : 'Live · ' + (bridge.project || 'Resolve') + (bridge.timeline ? ' / ' + bridge.timeline : '');
    } else {
      stateEl.className = 'wire-pill warn';
      stateEl.textContent = 'Bridge not running';
    }
  }
  if (chainEl) {
    chainEl.textContent = bridge.lastGraph
      || mode
      || (bridge.live
        ? 'Pipe open — press “+ Apply” on any card to send a real graph'
        : 'Open Resolve ▸ Workspace ▸ Scripts ▸ VFXKit_ResolveFree_Bridge');
    chainEl.title = chainEl.textContent;
  }
  state.bridge = bridge;
}

function graphLabel(recipe, fallback) {
  if (!recipe || !Array.isArray(recipe.chain)) return fallback || '';
  const tools = recipe.chain.map((s) => (typeof s === 'string' ? s : s.tool)).filter(Boolean);
  return tools.join(' → ');
}

async function dispatchToResolve(action, payload, toastMsg) {
  if (state.staticMode) return staticDispatch(action, payload, toastMsg);
  try {
    const res = await fetch('api/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });
    const data = await res.json();
    if (data.luaSnippet) {
      document.getElementById('luaCodeOutput').textContent = data.luaSnippet;
    }

    const result = (data.bridgeResponse && data.bridgeResponse.result) || null;
    const live = !!data.liveBridgeConnected;
    const chain = graphLabel(data.recipe);
    const bridgeErr = data.bridgeResponse && data.bridgeResponse.error;
    const applyErr = result && result.error;
    const failed = !live || bridgeErr || applyErr;

    if (live && result && result.clipName) {
      state.bridge.target = result.clipName;
    }
    paintWireStrip({
      live,
      chain: chain ? `MediaIn → ${chain} → MediaOut` : '',
      error: failed ? (applyErr || bridgeErr || 'no reply from Resolve') : null
    });

    if (toastMsg) {
      if (failed) {
        showToast(
          !live
            ? `${toastMsg} — but Resolve never answered. In Resolve click Workspace ▸ Scripts ▸ VFXKit_ResolveFree_Bridge, then press Test.`
            : `Resolve said: ${applyErr || bridgeErr}`,
          'error'
        );
      } else {
        const famTag = data.recipe && data.recipe.family ? ` · ${data.recipe.family.toUpperCase()} graph` : '';
        const appended = result && result.fusionNode ? ` | ${String(result.fusionNode).slice(0, 80)}` : '';
        const where = result && result.clipName ? ` → ${result.clipName}` : '';
        showToast(`${toastMsg}${famTag}${where} (LIVE in Resolve 21.1.1)${appended}`, 'ok');
      }
    }
    return data;
  } catch (_err) {
    paintWireStrip({ live: false, error: 'server unreachable' });
    if (toastMsg) showToast(toastMsg);
    return null;
  }
}

// ============================================================================
// PANEL MODULES — every region can be switched off and added back
// ----------------------------------------------------------------------------
// A "module" is any element carrying data-module. Several elements may share an
// id (the effect browser is a tab bar + a grid), and they hide together.
// ============================================================================
const UI_PREFS_KEY = 'pulsevfx.ui.v2';

function moduleRegistry() {
  const groups = new Map();
  document.querySelectorAll('[data-module]').forEach((el) => {
    const id = el.getAttribute('data-module');
    if (!groups.has(id)) {
      groups.set(id, {
        id,
        label: el.getAttribute('data-label') || id,
        elements: []
      });
    }
    const group = groups.get(id);
    group.elements.push(el);
    const label = el.getAttribute('data-label');
    if (label && group.label === id) group.label = label;
  });
  return [...groups.values()];
}

function setModuleVisible(id, visible, persist) {
  moduleRegistry().forEach((group) => {
    if (group.id !== id) return;
    group.elements.forEach((el) => el.classList.toggle('module-hidden', !visible));
  });
  if (visible) delete state.hiddenModules[id];
  else state.hiddenModules[id] = true;
  renderLayoutMenu();
  updateEmptyPaneHints();
  if (persist) saveUiPrefs();
}

function saveUiPrefs() {
  try {
    localStorage.setItem(UI_PREFS_KEY, JSON.stringify({
      // v2: lyrics became opt-in. Older saves forced the overlay on at every
      // load, which is why a fresh clip kept coming up with lyrics burned on it.
      v: 2,
      motion: state.motion,
      lyrics: state.showLyricsOverlay,
      depthEngine: (state.depth && state.depth.engine) || state.depthEnginePref || 'ai',
      hidden: state.hiddenModules || {}
    }));
  } catch (_e) { /* private mode, ignore */ }
}

function loadUiPrefs() {
  try {
    const raw = localStorage.getItem(UI_PREFS_KEY);
    if (!raw) return;
    const prefs = JSON.parse(raw);
    if (typeof prefs.motion === 'boolean') state.motion = prefs.motion;
    // Only honour a saved lyrics choice from v2 onwards. v1 saves always said
    // "on" because the app used to default to on, so they are ignored once.
    if (prefs.v >= 2 && typeof prefs.lyrics === 'boolean') state.showLyricsOverlay = prefs.lyrics;
    if (prefs.hidden && typeof prefs.hidden === 'object') state.hiddenModules = prefs.hidden;
    if (prefs.depthEngine === 'ai' || prefs.depthEngine === 'fast') state.depthEnginePref = prefs.depthEngine;
  } catch (_e) { /* ignore corrupt prefs */ }
}

function renderLayoutMenu() {
  const list = document.getElementById('layoutList');
  const badge = document.getElementById('layoutHiddenCount');
  if (!list) return;
  const groups = moduleRegistry();
  const hiddenCount = groups.filter((g) => state.hiddenModules && state.hiddenModules[g.id]).length;
  list.innerHTML = groups.map((group) => {
    const on = !(state.hiddenModules && state.hiddenModules[group.id]);
    return `<div class="layout-row ${on ? 'on' : 'off'}" data-module-toggle="${group.id}" role="button" tabindex="0">
      <span class="layout-check">${on ? '✓' : ''}</span>
      <span>${group.label}</span>
      ${on ? '' : '<span class="layout-add">＋ Add</span>'}
    </div>`;
  }).join('');
  list.querySelectorAll('[data-module-toggle]').forEach((row) => {
    const id = row.getAttribute('data-module-toggle');
    const toggle = () => {
      const currentlyOn = !(state.hiddenModules && state.hiddenModules[id]);
      setModuleVisible(id, !currentlyOn, true);
    };
    row.addEventListener('click', toggle);
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
  if (badge) {
    badge.textContent = hiddenCount ? String(hiddenCount) : '';
    badge.classList.toggle('hidden', hiddenCount === 0);
  }
}

// When a whole tab's panels are switched off, say so instead of leaving a blank pane.
function updateEmptyPaneHints() {
  document.querySelectorAll('.tab-pane').forEach((pane) => {
    const mods = [...pane.querySelectorAll('[data-module]')];
    if (!mods.length) return;
    const visible = mods.filter((m) => !m.classList.contains('module-hidden')).length;
    pane.classList.toggle('panes-empty', visible === 0);
  });
}

function addModuleHideButtons() {
  moduleRegistry().forEach((group) => {
    group.elements.forEach((el) => {
      if (el.querySelector(':scope > .module-hide-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'module-hide-btn';
      btn.type = 'button';
      btn.title = 'Turn this panel off (add it back from ▦ Panels)';
      btn.textContent = '✕';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setModuleVisible(group.id, false, true);
        showToast(`${group.label} hidden — ▦ Panels to add it back`, 'warn');
      });
      el.appendChild(btn);
    });
  });
}

function initModules() {
  loadUiPrefs();
  addModuleHideButtons();
  renderLayoutMenu();
  // apply saved visibility
  moduleRegistry().forEach((group) => {
    const visible = !(state.hiddenModules && state.hiddenModules[group.id]);
    group.elements.forEach((el) => el.classList.toggle('module-hidden', !visible));
  });

  const menuBtn = document.getElementById('layoutMenuBtn');
  const menu = document.getElementById('layoutMenu');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('hidden');
      renderLayoutMenu();
    });
    document.addEventListener('click', (e) => {
      if (menu.classList.contains('hidden')) return;
      if (menu.contains(e.target) || menuBtn.contains(e.target)) return;
      menu.classList.add('hidden');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') menu.classList.add('hidden');
    });
  }
  const showAll = document.getElementById('layoutShowAllBtn');
  if (showAll) {
    showAll.addEventListener('click', () => {
      state.hiddenModules = {};
      moduleRegistry().forEach((group) => {
        group.elements.forEach((el) => el.classList.remove('module-hidden'));
      });
      renderLayoutMenu();
      updateEmptyPaneHints();
      saveUiPrefs();
      showToast('All panels added back', 'ok');
    });
  }

  const motionBtn = document.getElementById('toggleMotionBtn');
  if (motionBtn) {
    motionBtn.addEventListener('click', () => {
      state.motion = !state.motion;
      applyMotionState(true);
    });
  }
  applyMotionState(false);
  applyLyricsState(false);
  updateEmptyPaneHints();
}

// ============================================================================
// MAIN TABS & COMPACT DOCK SWITCHER
// ============================================================================
// Five tabs, but the panels underneath are unchanged: Subject holds Magic Mask
// and Depth Map, Editing holds Cut Silences and Media Pool AI. state.activeTab
// always names the PANEL (mask/depth/silences/...) so every existing feature
// check keeps working; state.activeGroup names what the nav highlights.
const TAB_GROUPS = {
  vfx: { panes: ['vfx'] },
  captions: { panes: ['captions'] },
  subject: { panes: ['mask', 'depth'] },
  editing: { panes: ['silences', 'mediapool'] },
  render: { panes: ['render'] }
};
const PANE_LABELS = {
  vfx: 'Effects', captions: 'Lyrics', mask: 'Magic Mask', depth: 'Depth Map',
  silences: 'Cut Silences', mediapool: 'Media Pool AI', render: 'Render'
};

function activatePane(pane) {
  document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
  const el = document.getElementById(`tab-${pane}`);
  if (!el) return false;
  el.classList.add('active');
  state.activeTab = pane;

  if (pane === 'silences') drawSilenceWaveform();
  if (pane === 'mask') maskSyncUI();
  if (pane === 'depth') {
    depthSyncUI();
    depthRenderAiStamp();
    // opening the tab is the moment to bring the model up
    const dd = ensureDepthState();
    if (dd.engine !== 'fast' && dd.source === 'estimate' && !dd.aiBusy) depthAiRun();
  }
  if (pane === 'render') { rbSyncSourceUI(); rbSyncMemory(); }
  return true;
}

function activateGroup(group) {
  const def = TAB_GROUPS[group];
  if (!def) return;
  state.activeGroup = group;
  const remembered = state.paneByGroup[group];
  const pane = remembered && def.panes.includes(remembered) ? remembered : def.panes[0];
  activatePane(pane);
  renderPaneSwitcher(group);
}

function renderPaneSwitcher(group) {
  const bar = document.getElementById('paneSwitcher');
  if (!bar) return;
  const def = TAB_GROUPS[group];
  const panes = def ? def.panes : [];
  if (panes.length < 2) {
    bar.classList.add('hidden');
    bar.innerHTML = '';
    return;
  }
  bar.classList.remove('hidden');
  bar.innerHTML = panes.map((p) => `
    <button class="pane-pill ${state.activeTab === p ? 'active' : ''}" data-pane="${p}" role="tab">
      ${PANE_LABELS[p] || p}
    </button>
  `).join('');
  bar.querySelectorAll('.pane-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.paneByGroup[group] = btn.dataset.pane;
      activatePane(btn.dataset.pane);
      renderPaneSwitcher(group);
    });
  });
}

function initTabs() {
  state.activeGroup = 'vfx';
  state.paneByGroup = { vfx: 'vfx', captions: 'captions', subject: 'mask', editing: 'silences', render: 'render' };

  document.querySelectorAll('.main-tab').forEach((btn) => {
    btn.addEventListener('click', () => activateGroup(btn.dataset.group));
  });

  const compactBtn = document.getElementById('toggleCompactBtn');
  compactBtn.addEventListener('click', () => {
    const root = document.getElementById('workspaceRoot');
    root.classList.toggle('compact-dock');
    const isCompact = root.classList.contains('compact-dock');
    document.getElementById('compactBtnLabel').textContent = isCompact
      ? 'Expand Full Workspace'
      : 'Pop-Up Dock Mode';
    showToast(isCompact
      ? 'Switched to Compact Floating Pop-Up Mode (440px extension width)'
      : 'Switched to Full Side-by-Side Workspace');
  });
}

function initSceneSwitcher() {
  document.querySelectorAll('.scene-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scene-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.scene = btn.dataset.scene;
      // switching to a procedural plate means the loaded still is no longer up
      resetImageLabel();
      // a new plate means the old depth map describes a picture that is gone
      if (state.depth) depthRescan({ timeSec: state.playheadSec });
      showToast(`Camera Plate switched to: ${btn.textContent.trim()}`);
    });
  });

  const clearBtn = document.getElementById('clearPlateBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearStage();
      showToast('Stage cleared');
    });
  }

  const imageInput = document.getElementById('customImageInput');
  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) loadImageAsPlate(file);
    });
  }

  // Custom Local Video Upload for Live Shader Testing
  const videoInput = document.getElementById('customVideoInput');
  const videoEl = document.getElementById('customVideoElement');
  if (videoInput && videoEl) {
    videoInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      videoEl.src = url;
      videoEl.pause();
      const trackAspect = () => {
        if (videoEl.videoWidth && videoEl.videoHeight) {
          lastPlateAspect = videoEl.videoWidth / videoEl.videoHeight;
          state.platePanUserSet = false;
        }
      };
      videoEl.addEventListener('loadedmetadata', trackAspect, { once: true });
      trackAspect();
      state.scene = 'custom_video';
      setStageLoaded('video', file.name, videoEl.duration);
      // real duration only exists after metadata; fill it in when it lands
      videoEl.addEventListener('loadedmetadata', () => {
        setStageLoaded('video', file.name, videoEl.duration);
      }, { once: true });
      if (state.depth) setTimeout(() => depthRescan(), 260);
      resetImageLabel();
      showToast(`Loaded "${file.name}" — press Play when you are ready`);
    });
  }
}

// ---------------------------------------------------------------------------
// THE STAGE
// Nothing is on it until real footage is loaded, and loading something never
// starts playback: the transport is the only thing that plays.
// ---------------------------------------------------------------------------
function setStageLoaded(kind, label, durationSec) {
  const overlay = document.getElementById('emptyStage');
  if (overlay) overlay.classList.add('hidden');

  // the panel header reports the real output size, not a marketing number
  const out = document.getElementById('previewOutputLabel');
  if (out) {
    const vid = document.getElementById('customVideoElement');
    const w = vid && vid.videoWidth;
    const h = vid && vid.videoHeight;
    out.textContent = (kind === 'video' && w && h)
      ? `Video output · ${w} × ${h}`
      : (kind === 'image' ? 'Still plate · 16:9 stage' : 'Video output · 640 × 360 stage');
  }

  const src = document.getElementById('stageSourceLabel');
  if (src) {
    const short = label && label.length > 34 ? label.slice(0, 31) + '…' : (label || 'Footage');
    src.textContent = short;
    src.classList.add('is-loaded');
  }

  ['playPauseBtn', 'transportPauseBtn', 'transportStopBtn'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = false;
  });
  const play = document.getElementById('playPauseBtn');
  if (play) {
    play.disabled = false;
    play.title = 'Play';
  }
  const scrub = document.getElementById('timelineScrubber');
  if (scrub) {
    scrub.disabled = false;
    scrub.value = 0;
  }

  const dur = Number(durationSec);
  // a still has no duration of its own; a 10 s hold gives the effects something
  // to move against without pretending the photo is a clip
  state.totalDurSec = Number.isFinite(dur) && dur > 0.05 ? dur : 10;
  state.playheadSec = 0;
  state.isPlaying = false;

  if (kind !== 'video') {
    const vid = document.getElementById('customVideoElement');
    if (vid && videoHasSource(vid)) { try { vid.pause(); } catch (_e) { /* ignore */ } }
  }

  const durLabel = document.getElementById('transportDurLabel');
  if (durLabel) durLabel.textContent = `0.0s / ${state.totalDurSec.toFixed(1)}s`;
  const tc = document.getElementById('viewerTimecode');
  if (tc) tc.textContent = '00:00:00:00';
}

function clearStage() {
  const vid = document.getElementById('customVideoElement');
  // Only touch the media element when it actually holds a clip: calling
  // pause()/load() on an empty <video> is pointless and noisy.
  if (vid && videoHasSource(vid)) {
    try { vid.pause(); } catch (_e) { /* ignore */ }
  }
  if (vid) {
    vid.removeAttribute('src');
    if (videoHasSource(vid)) { try { vid.load(); } catch (_e) { /* ignore */ } }
  }
  customImageEl = null;
  customImageInfo = null;
  lastPlateAspect = 0;
  state.scene = 'empty';
  state.isPlaying = false;
  state.playheadSec = 0;
  state.totalDurSec = 0;

  const overlay = document.getElementById('emptyStage');
  if (overlay) overlay.classList.remove('hidden');
  const src = document.getElementById('stageSourceLabel');
  if (src) {
    src.textContent = 'No footage loaded';
    src.classList.remove('is-loaded');
  }
  ['playPauseBtn', 'transportPauseBtn', 'transportStopBtn'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.disabled = true;
      btn.classList.remove('is-live');
    }
  });
  const play = document.getElementById('playPauseBtn');
  if (play) play.title = 'Load footage first';
  const scrub = document.getElementById('timelineScrubber');
  if (scrub) {
    scrub.disabled = true;
    scrub.value = 0;
  }
  const durLabel = document.getElementById('transportDurLabel');
  if (durLabel) durLabel.textContent = '0:00.0 / 0:00.0';
  const pill = document.getElementById('activeFxPill');
  if (pill) pill.textContent = 'No effect applied';
  const out = document.getElementById('previewOutputLabel');
  if (out) out.textContent = 'Video output · 640 × 360 stage';
  resetImageLabel();
  if (state.depth) depthRescan({ timeSec: 0 });
}

function resetImageLabel() {
  const label = document.getElementById('customImageLabelText');
  if (label) label.textContent = 'Load photo';
  const lbl = document.getElementById('customImageLabel');
  if (lbl) lbl.classList.remove('is-loaded');
}

// Load an image file and make it the plate. Used by the Load Image button, by
// dropping a file on the monitor, and by an image dropped into 07 - 4K Render,
// so every route ends up with the same state.
function loadImageAsPlate(file) {
  if (!file) return Promise.resolve(null);
  if (!/^image\//.test(file.type) && !/\.(png|jpe?g|webp|tiff?|bmp|avif)$/i.test(file.name)) {
    showToast('That is not an image file', 'warn');
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width || 0;
      const height = img.naturalHeight || img.height || 0;
      if (!width || !height) {
        URL.revokeObjectURL(url);
        showToast('Could not read that image', 'error');
        resolve(null);
        return;
      }
      customImageEl = img;
      customImageInfo = { name: file.name, width, height, bytes: file.size || 0 };
      lastPlateAspect = width / height;
      state.platePanUserSet = false;
      state.scene = 'custom_image';
      setStageLoaded('image', file.name, 10);
      // the still is now the source, so 4K export works at its native size
      rbAdoptSource({ name: file.name, kind: 'image', width, height });
      if (state.motion) {
        const vid = document.getElementById('customVideoElement');
        if (vid) { try { vid.pause(); } catch (_e) { /* ignore */ } }
      }
      document.querySelectorAll('.scene-btn').forEach((b) => b.classList.remove('active'));
      const label = document.getElementById('customImageLabelText');
      if (label) {
        const short = file.name.length > 22 ? file.name.slice(0, 19) + '…' : file.name;
        label.textContent = '🖼 ' + short;
      }
      const lbl = document.getElementById('customImageLabel');
      if (lbl) lbl.classList.add('is-loaded');
      showToast(
        `${file.name} loaded as the plate — ${width} × ${height}`
          + (RENDER_ENGINE.is4K(width, height) ? ' · 4K' : ''),
        'ok'
      );
      if (state.depth) depthRescan({ timeSec: state.playheadSec });
      resolve({ width, height, name: file.name });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      showToast('Could not open that image', 'error');
      resolve(null);
    };
    img.src = url;
  });
}

// Drop an image or a video straight onto the monitor. Kept separate from the
// 4K tab's drop zone so the monitor behaves like the viewer it looks like.
function initMonitorDropZone() {
  const stage = document.getElementById('canvasStage');
  if (!stage) return;
  let depth = 0;
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  stage.addEventListener('dragenter', (e) => { stop(e); depth++; stage.classList.add('is-drop-target'); });
  stage.addEventListener('dragover', (e) => { stop(e); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; });
  stage.addEventListener('dragleave', (e) => {
    stop(e);
    depth = Math.max(0, depth - 1);
    if (!depth) stage.classList.remove('is-drop-target');
  });
  stage.addEventListener('drop', (e) => {
    stop(e);
    depth = 0;
    stage.classList.remove('is-drop-target');
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    if (/^image\//.test(file.type) || /\.(png|jpe?g|webp|tiff?|bmp|avif)$/i.test(file.name)) {
      loadImageAsPlate(file);
    } else if (/^video\//.test(file.type) || /\.(mp4|mov|webm|m4v|mkv)$/i.test(file.name)) {
      const videoInput = document.getElementById('customVideoInput');
      // feed the existing video path through the same code by setting the file
      if (videoInput && window.DataTransfer) {
        try {
          const dt = new DataTransfer();
          dt.items.add(file);
          videoInput.files = dt.files;
          videoInput.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        } catch (_e) { /* fall through */ }
      }
      const vid = document.getElementById('customVideoElement');
      if (vid) {
        vid.src = URL.createObjectURL(file);
        if (state.motion && state.isPlaying) vid.play().catch(() => {});
        state.scene = 'custom_video';
        if (state.depth) setTimeout(() => depthRescan(), 260);
        showToast(`${file.name} loaded as the plate`);
      }
    } else {
      showToast('Drop an image or a video', 'warn');
    }
  });
}

// ============================================================================
// TAB 1: OPTICAL, SHUTTER & FILM LAB VFX
// ============================================================================
// The keyframe editor is a reward for picking something, not a permanent block
// at the top of the tab.
function revealKeyframeEditor() {
  const box = document.getElementById('keyframeEditorBox');
  const hint = document.getElementById('kfPlaceholder');
  if (box) box.classList.remove('hidden');
  if (hint) hint.classList.add('hidden');
}

function initVfxTab() {
  renderVfxGrid();

  // "How it gets into Resolve" strip
  const stepsBtn = document.getElementById('installStepsBtn');
  const stepsEl = document.getElementById('installSteps');
  if (stepsBtn && stepsEl) {
    stepsBtn.addEventListener('click', () => {
      const open = stepsEl.classList.toggle('hidden') === false;
      stepsBtn.textContent = open ? 'Hide steps' : 'Steps';
      stepsBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  const pathBtn = document.getElementById('copyEffectsPathBtn');
  if (pathBtn) {
    pathBtn.addEventListener('click', () => {
      const p = '~/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Templates/Edit/Effects/PulseVFX';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(p)
          .then(() => showToast('Effects folder path copied'))
          .catch(() => showToast('Copy failed — the path is in the Steps list', 'warn'));
      } else {
        showToast('Copy is not available here', 'warn');
      }
    });
  }

  const advBtn = document.getElementById('advancedToolsBtn');
  const advBody = document.getElementById('advancedTools');
  if (advBtn && advBody) {
    advBtn.addEventListener('click', () => {
      const open = advBody.classList.toggle('hidden') === false;
      advBtn.classList.toggle('is-open', open);
      advBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.vfx-subtab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.vfx-subtab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedVfxCat = btn.dataset.cat;
      renderVfxGrid();
    });
  });

  document.getElementById('vfxSearchInput').addEventListener('input', (e) => {
    state.vfxSearch = e.target.value.trim().toLowerCase();
    renderVfxGrid();
  });

  document.querySelectorAll('.vibe-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.getElementById('vfxPromptInput').value = pill.dataset.prompt;
      runAiVfxAssistant(pill.dataset.prompt);
    });
  });

  document.getElementById('runAiVfxBtn').addEventListener('click', () => {
    const prompt = document.getElementById('vfxPromptInput').value.trim();
    runAiVfxAssistant(prompt);
  });

  document.getElementById('shakeSpeedSlider').addEventListener('input', (e) => {
    state.bpm = Number(e.target.value);
    document.getElementById('shakeSpeedVal').textContent = `${state.bpm} BPM`;
  });

  document.getElementById('mixShakesSlider').addEventListener('input', (e) => {
    state.mixShakes = Number(e.target.value);
    document.getElementById('mixShakesVal').textContent = `${state.mixShakes}%`;
  });

  document.getElementById('mixStylizedSlider').addEventListener('input', (e) => {
    state.mixStylized = Number(e.target.value);
    document.getElementById('mixStylizedVal').textContent = `${state.mixStylized}%`;
  });
}

function renderVfxGrid() {
  const grid = document.getElementById('vfxPresetGrid');
  const filtered = VFX_PRESETS.filter((p) => {
    const catMatch = state.selectedVfxCat === 'ALL' || p.category === state.selectedVfxCat;
    const searchMatch = !state.vfxSearch ||
      p.name.toLowerCase().includes(state.vfxSearch) ||
      p.category.toLowerCase().includes(state.vfxSearch) ||
      p.desc.toLowerCase().includes(state.vfxSearch) ||
      p.node.toLowerCase().includes(state.vfxSearch);
    return catMatch && searchMatch;
  });

  grid.innerHTML = filtered.map((p) => {
    const isSel = state.activePreset && state.activePreset.id === p.id;
    const kfs = KF.tracks[p.id] || [];
    const val = Math.round(kfs.length ? evalKeyframes(kfs, state.playheadSec) : baseIntensity(p.id));
    const stackIdx = stackIndexOf(p.id);
    const inStack = stackIdx >= 0;
    return `
      <div class="vfx-card ${isSel ? 'selected' : ''} ${inStack ? 'stacked' : ''}" data-id="${p.id}">
        <div class="vfx-thumb">
          <canvas class="vfx-thumb-canvas" width="180" height="62" data-thumbtype="${p.effectType}" data-accent="${p.accent}"></canvas>
          <span class="vfx-thumb-badge">${p.category}</span>
          <span class="vfx-thumb-spec" style="background:${p.accent};">${p.spec}</span>
          ${inStack ? `<span class="vfx-stack-badge" title="Position in the stack">${stackIdx + 1}</span>` : ''}
        </div>
        <div class="vfx-card-body">
          <div class="vfx-card-title">${p.name}</div>
          <div class="vfx-card-desc">${p.desc}</div>
          <div class="vfx-card-slider-row" data-sliderrow="${p.id}">
            <span class="int-lbl">INT</span>
            <input class="card-intensity-slider" type="range" min="0" max="200" value="${val}"
              data-int="${p.id}" title="Per-effect intensity (0–200%)" />
            <strong class="int-val" data-intval="${p.id}">${val}%</strong>
            <button class="card-kf-btn ${kfs.length ? 'has-kfs' : ''}" data-kf="${p.id}"
              title="Add / update intensity keyframe at playhead">◆ KF${kfs.length ? ' ' + kfs.length : ''}</button>
          </div>
          <div class="vfx-card-foot">
            <span class="vfx-node-tag">${p.node}</span>
            <button class="vfx-apply-btn ${inStack ? 'in-stack' : ''}" data-apply="${p.id}"
              title="${inStack ? 'Add another copy of this look on top of the stack' : 'Add this look to the stack'}">${inStack ? '+ Stack again' : '+ Stack'}</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Draw procedural optical/waveform preview on each card's thumbnail canvas
  grid.querySelectorAll('.vfx-thumb-canvas').forEach((canv) => {
    drawCardShaderPreview(canv, canv.dataset.thumbtype, canv.dataset.accent);
  });

  // Per-card intensity sliders (0–200%) — never trigger the card's apply action
  grid.querySelectorAll('.card-intensity-slider').forEach((slider) => {
    const id = slider.dataset.int;
    const out = grid.querySelector(`[data-intval="${id}"]`);
    slider.addEventListener('pointerdown', (e) => e.stopPropagation());
    slider.addEventListener('click', (e) => e.stopPropagation());
    slider.addEventListener('input', (e) => {
      e.stopPropagation();
      const v = Number(e.target.value);
      setBaseIntensity(id, v);
      // if this effect already has a keyframe lane, the slider writes into it
      // at the playhead so the change is actually visible on the animated curve
      const track = KF.tracks[id];
      if (track && track.length) {
        addKeyframe(id, state.playheadSec, v);
      }
      // A stacked look has a layer, and the layer is what Resolve builds. Slide
      // here and the pass you will send moves with it.
      const stacked = stackLayersFor(id);
      if (stacked.length) {
        stacked.forEach((layer) => { layer.intensity = v; });
        renderLayerRack();
      }
      if (out) out.textContent = `${v}%`;
      if (state.activePreset && state.activePreset.id === id) {
        syncKeyframeInspector();
      }
    });
  });

  // + Stack is the only control that touches the stack. Nothing reaches Resolve
  // and nothing lands on the V3 lane until the whole stack is sent, so two,
  // three or eight looks compound into one graph in one press.
  grid.querySelectorAll('[data-apply]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const preset = VFX_PRESETS.find((x) => x.id === btn.dataset.apply);
      if (!preset) return;
      addEffectLayer(preset);
      selectPreset(preset);
      state.presetPicked = true;
      revealKeyframeEditor();
      document.getElementById('activeFxPill').textContent = `Stacked: ${preset.name}`;
    });
  });

  grid.querySelectorAll('.card-kf-btn').forEach((btn) => {
    const id = btn.dataset.kf;
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const preset = VFX_PRESETS.find((x) => x.id === id);
      if (!preset) return;
      state.activePreset = preset;
      state.presetPicked = true;
      revealKeyframeEditor();
      const current = effectiveIntensity(id, state.playheadSec);
      addKeyframe(id, state.playheadSec, current);
      // keyframing a stacked look also keys its pass, so the animation is what
      // Resolve receives as a BezierSpline on that layer
      stackLayersFor(id).forEach((layer) => {
        const sec = +state.playheadSec.toFixed(3);
        const hit = layer.keys.findIndex((k) => Math.abs(k.sec - sec) < 0.001);
        if (hit >= 0) layer.keys[hit].value = Math.round(current);
        else layer.keys.push({ sec, value: Math.round(current) });
        layer.keys.sort((a, b) => a.sec - b.sec);
      });
      renderLayerRack();
      document.getElementById('activeFxPill').textContent = `Preview: ${preset.name}`;
      renderVfxGrid();
      syncKeyframeInspector();
      showToast(`◆ Keyframe @ ${state.playheadSec.toFixed(2)}s — ${preset.name} at ${Math.round(current)}%`);
    });
  });

  grid.querySelectorAll('.vfx-card').forEach((card) => {
    const preset = VFX_PRESETS.find((x) => x.id === card.dataset.id);
    card.addEventListener('mouseenter', () => {
      if (preset) {
        state.activePreset = preset;
        document.getElementById('activeFxPill').textContent = `Preview: ${preset.name}`;
        syncKeyframeInspector();
      }
    });

    // Clicking a card PREVIEWS it. Nothing is applied and nothing lands on the
    // timeline until a look is stacked and the stack is sent.
    card.addEventListener('click', (e) => {
      if (!preset) return;
      if (e.target.closest('.vfx-card-slider-row')) return;
      if (e.target.closest('[data-apply]')) return;
      state.activePreset = preset;
      state.presetPicked = true;
      revealKeyframeEditor();
      document.getElementById('activeFxPill').textContent = `Previewing: ${preset.name}`;
      renderVfxGrid();
      syncKeyframeInspector();
      renderStackChips();
      e.stopPropagation();
    });

    // + Stack: adds this look on top of whatever is already stacked. The stack
    // is sent to Resolve in one go, so two looks compound into one graph.
  });
}

function selectPreset(preset) {
  if (!preset) return;
  state.activePreset = preset;
  state.presetPicked = true;
  state.hitFlashBurst = 0.85;
  revealKeyframeEditor();
  const pill = document.getElementById('activeFxPill');
  if (pill) pill.textContent = `Previewing: ${preset.name}`;
  renderVfxGrid();
  syncKeyframeInspector();
  renderStackChips();
}

// A single look is just a stack of one, so there is no second code path: the
// stack send below is what talks to Resolve, whether it holds one look or eight.

function drawCardShaderPreview(canvas, effectType, accent, timeSec) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  // TouchDesigner TOP + Transition shaders get the real generative runtime
  if (window.TD_ENGINE && TD_ENGINE.hasShader(effectType)) {
    const tSeed = timeSec === undefined
      ? 1.2 + ((effectType.length * 7) % 40) * 0.23
      : timeSec + ((effectType.length * 7) % 40) * 0.23;
    TD_ENGINE.drawThumb(canvas, effectType, accent, tSeed);
    return;
  }

  ctx.fillStyle = '#07090e';
  ctx.fillRect(0, 0, w, h);

  // Subtle technical grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 24) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }

  if (effectType === 'opt_halation' || effectType === 'lab_leak') {
    const g = ctx.createRadialGradient(w * 0.65, h * 0.4, 2, w * 0.65, h * 0.4, 52);
    g.addColorStop(0, '#fff7ed');
    g.addColorStop(0.35, accent || '#f97316');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (effectType === 'opt_fringe' || effectType === 'depth_streak') {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(26, 12, w - 56, h - 28);
    ctx.strokeStyle = '#06b6d4';
    ctx.strokeRect(30, 12, w - 56, h - 28);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.beginPath(); ctx.moveTo(10, h * 0.45); ctx.lineTo(w - 10, h * 0.45); ctx.stroke();
  } else if (effectType === 'opt_diopter' || effectType === 'ed_pip') {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.fillRect(0, 0, w * 0.48, h);
    ctx.strokeStyle = accent || '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(w * 0.48, 0); ctx.lineTo(w * 0.48, h); ctx.stroke();
  } else if (effectType === 'time_smear' || effectType === 'cam_whip') {
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = accent || '#e11d48';
      ctx.globalAlpha = 0.15 + i * 0.16;
      ctx.beginPath();
      ctx.arc(45 + i * 20, h * 0.46, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else {
    // Optical response curve visualization
    ctx.strokeStyle = accent || '#e11d48';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < w; x += 4) {
      const y = h * 0.5 + Math.sin(x * 0.08) * 14 * Math.exp(-Math.pow((x - w * 0.5) / 55, 2));
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

// Animated mini-canvas card previews — updates in chunks so 56 cards stay cheap
let thumbCursor = 0;
function startCardThumbnailLoop() {
  setInterval(() => {
    if (state.activeTab !== 'vfx' || document.hidden || !state.motion) return;
    const cards = document.querySelectorAll('.vfx-thumb-canvas');
    if (!cards.length) return;
    const CHUNK = 14;
    thumbCursor = (thumbCursor + CHUNK) % cards.length;
    const t = performance.now() / 1000;
    for (let i = 0; i < CHUNK; i++) {
      const c = cards[(thumbCursor + i) % cards.length];
      if (!c) continue;
      drawCardShaderPreview(c, c.dataset.thumbtype, c.dataset.accent, t);
    }
  }, 150);
}

// ============================================================================
// INTERACTIVE KEYFRAME & INTENSITY CURVE INSPECTOR
// ============================================================================
function initKeyframeEditor() {
  const canvas = document.getElementById('keyframeCurveCanvas');
  if (!canvas) return;

  document.getElementById('addKeyframeBtn').addEventListener('click', () => {
    const p = state.activePreset;
    if (!p) return;
    const cur = effectiveIntensity(p.id, state.playheadSec);
    addKeyframe(p.id, state.playheadSec, cur);
    refreshKeyframeUI();
    showToast(`◆ Keyframe @ ${state.playheadSec.toFixed(2)}s → ${Math.round(cur)}% on ${p.name}`);
  });

  document.getElementById('prevKeyframeBtn').addEventListener('click', () => jumpKeyframe(-1));
  document.getElementById('nextKeyframeBtn').addEventListener('click', () => jumpKeyframe(1));
  document.getElementById('clearKeyframesBtn').addEventListener('click', () => {
    const p = state.activePreset;
    if (!p) return;
    KF.tracks[p.id] = [];
    refreshKeyframeUI();
    showToast(`Cleared intensity keyframes for ${p.name}`);
  });

  document.querySelectorAll('.kf-env-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = state.activePreset;
      if (!p) return;
      setEnvelope(p.id, btn.dataset.env);
      refreshKeyframeUI();
      document.querySelectorAll('.kf-env-pill').forEach((b) => b.classList.toggle('active', b === btn));
      showToast(`Applied ${btn.textContent.trim()} envelope to ${p.name}`);
    });
  });

  // ---- direct curve editing ------------------------------------------------
  let dragging = null;

  const posToVal = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    return { time: x * state.totalDurSec, value: (1 - y) * 200 };
  };

  const hitKeyframe = (e) => {
    const p = state.activePreset;
    if (!p) return null;
    const track = kfTrack(p.id);
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    let best = null, bestDist = 14;
    track.forEach((k) => {
      const kx = (k.t / state.totalDurSec) * r.width;
      const ky = (1 - k.v / 200) * r.height;
      const d = Math.hypot(kx - px, ky - py);
      if (d < bestDist) { bestDist = d; best = k; }
    });
    return best;
  };

  const onMove = (e) => {
    if (!dragging) return;
    const p = state.activePreset;
    if (!p) return;
    const { time, value } = posToVal(e);
    dragging.t = Math.max(0, Math.min(state.totalDurSec, time));
    dragging.v = Math.round(Math.max(0, Math.min(200, value)));
    sortTrack(p.id);
    drawKeyframeCurve();
    updateKeyframeReadouts();
  };

  canvas.addEventListener('pointerdown', (e) => {
    const p = state.activePreset;
    if (!p) return;
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch (_e) { /* older Safari / touch */ }
    }
    const hit = hitKeyframe(e);
    if (hit) {
      dragging = hit;
    } else if (e.shiftKey || e.button === 2) {
      const { time } = posToVal(e);
      removeKeyframeAt(p.id, time);
      refreshKeyframeUI();
      return;
    } else {
      const { time, value } = posToVal(e);
      addKeyframe(p.id, time, value);
      const track = kfTrack(p.id);
      dragging = track.find((k) => Math.abs(k.t - time) < 0.1) || null;
      refreshKeyframeUI();
      drawKeyframeCurve();
      return;
    }
    drawKeyframeCurve();
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', () => {
    if (dragging) {
      dragging = null;
      refreshKeyframeUI();
    }
  });
  canvas.addEventListener('pointercancel', () => { dragging = null; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // master intensity slider drives the active effect's base intensity / keyframe
  const masterSlider = document.getElementById('masterIntensitySlider');
  masterSlider.addEventListener('input', (e) => {
    const p = state.activePreset;
    if (!p) return;
    const v = Number(e.target.value);
    setBaseIntensity(p.id, v);
    const track = kfTrack(p.id);
    const near = track.find((k) => Math.abs(k.t - state.playheadSec) < 0.25);
    if (near) {
      near.v = v;
      sortTrack(p.id);
    }
    document.getElementById('masterIntensityVal').textContent = `${v}%`;
    drawKeyframeCurve();
    updateKeyframeReadouts();
    updateCardKfBadges();
    const cardVal = document.querySelector(`[data-intval="${p.id}"]`);
    const cardSlider = document.querySelector(`[data-int="${p.id}"]`);
    if (cardVal) cardVal.textContent = `${v}%`;
    if (cardSlider) cardSlider.value = v;
  });

  syncKeyframeInspector();
  setInterval(() => {
    if (state.activeTab !== 'vfx') return;
    drawKeyframeCurve();
    updateKeyframeReadouts();
  }, 120);
}

function jumpKeyframe(dir) {
  const p = state.activePreset;
  if (!p) return;
  const track = kfTrack(p.id);
  if (!track.length) {
    showToast('No keyframes yet — click the curve or press ◆ Keyframe');
    return;
  }
  let target = null;
  if (dir > 0) target = track.find((k) => k.t > state.playheadSec + 0.05);
  else target = [...track].reverse().find((k) => k.t < state.playheadSec - 0.05);
  if (!target) target = dir > 0 ? track[0] : track[track.length - 1];
  state.playheadSec = target.t;
  syncKeyframeInspector();
}

function updateCardKfBadges() {
  document.querySelectorAll('.card-kf-btn').forEach((btn) => {
    const id = btn.dataset.kf;
    const n = (KF.tracks[id] || []).length;
    btn.textContent = `◆ KF${n ? ' ' + n : ''}`;
    btn.classList.toggle('has-kfs', n > 0);
  });
  document.querySelectorAll('.card-intensity-slider').forEach((slider) => {
    const id = slider.dataset.int;
    const v = Math.round(baseIntensity(id));
    slider.value = v;
    const out = document.querySelector(`[data-intval="${id}"]`);
    if (out) out.textContent = `${v}%`;
  });
}

function refreshKeyframeUI() {
  syncKeyframeInspector();
  updateCardKfBadges();
}

function syncKeyframeInspector() {
  const p = state.activePreset;
  if (!p) return;
  const track = kfTrack(p.id);
  const nameEl = document.getElementById('kfInspectorPresetName');
  const subEl = document.getElementById('kfInspectorNodeSub');
  const countEl = document.getElementById('kfCountBadge');
  const slider = document.getElementById('masterIntensitySlider');
  const valEl = document.getElementById('masterIntensityVal');

  if (nameEl) nameEl.textContent = p.name;
  if (subEl) subEl.textContent = `${p.category} • ${p.node} — ${track.length ? track.length + ' keyframes (BezierSpline on Apply)' : 'click canvas to place keyframes'}`;
  if (countEl) countEl.textContent = String(track.length);
  if (slider) slider.value = Math.round(baseIntensity(p.id));
  if (valEl) valEl.textContent = `${Math.round(baseIntensity(p.id))}%`;
  document.querySelectorAll('.kf-env-pill').forEach((b) => b.classList.remove('active'));
  drawKeyframeCurve();
  updateKeyframeReadouts();
}

function updateKeyframeReadouts() {
  const p = state.activePreset;
  if (!p) return;
  const t = state.playheadSec;
  const v = effectiveIntensity(p.id, t);
  const phEl = document.getElementById('kfPlayheadReadout');
  const evEl = document.getElementById('kfInterpolatedReadout');
  const valEl = document.getElementById('masterIntensityVal');
  if (phEl) phEl.textContent = `Playhead: ${t.toFixed(2)}s`;
  if (evEl) evEl.textContent = `Evaluated Intensity: ${Math.round(v)}%`;
  if (valEl) valEl.textContent = `${Math.round(baseIntensity(p.id))}%`;
  const cardVal = document.querySelector(`[data-intval="${p.id}"]`);
  if (cardVal) cardVal.textContent = `${Math.round(baseIntensity(p.id))}%`;
}

function drawKeyframeCurve() {
  const canvas = document.getElementById('keyframeCurveCanvas');
  const p = state.activePreset;
  if (!canvas || !p) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const cw = Math.max(240, Math.round(rect.width || 380));
  const ch = Math.max(70, Math.round(rect.height || 92));
  if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);

  // background + grid
  const bg = ctx.createLinearGradient(0, 0, 0, ch);
  bg.addColorStop(0, 'rgba(20,24,34,0.9)');
  bg.addColorStop(1, 'rgba(8,10,16,0.95)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cw, ch);

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = (i / 4) * ch;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
  }
  for (let i = 1; i < 8; i++) {
    const x = (i / 8) * cw;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
  }
  // 100% reference line
  const y100 = ch - (100 / 200) * ch;
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.moveTo(0, y100); ctx.lineTo(cw, y100); ctx.stroke();
  ctx.setLineDash([]);

  const track = KF.tracks[p.id] || [];
  const timeToX = (t) => (t / state.totalDurSec) * cw;
  const valToY = (v) => ch - (Math.max(0, Math.min(200, v)) / 200) * ch;

  if (track.length) {
    // area
    const grad = ctx.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, hexToRgba(p.accent || '#e11d48', 0.35));
    grad.addColorStop(1, hexToRgba(p.accent || '#e11d48', 0.03));
    ctx.beginPath();
    ctx.moveTo(0, ch);
    for (let px = 0; px <= cw; px += 2) {
      const tt = (px / cw) * state.totalDurSec;
      ctx.lineTo(px, valToY(evalKeyframes(track, tt)));
    }
    ctx.lineTo(cw, ch);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // curve
    ctx.beginPath();
    for (let px = 0; px <= cw; px += 2) {
      const tt = (px / cw) * state.totalDurSec;
      const y = valToY(evalKeyframes(track, tt));
      if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
    }
    ctx.strokeStyle = p.accent || '#e11d48';
    ctx.lineWidth = 2;
    ctx.shadowColor = hexToRgba(p.accent || '#e11d48', 0.8);
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '600 10px "SF Mono", monospace';
    ctx.fillText('NO KEYFRAMES — click to place, drag to move, ⇧click to delete', 10, ch / 2 + 3);
    const base = baseIntensity(p.id);
    ctx.strokeStyle = hexToRgba(p.accent || '#e11d48', 0.65);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(0, valToY(base)); ctx.lineTo(cw, valToY(base)); ctx.stroke();
    ctx.setLineDash([]);
  }

  // keyframe diamonds
  track.forEach((k) => {
    const x = timeToX(k.t);
    const y = valToY(k.v);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#0b0d14';
    ctx.strokeStyle = p.accent || '#e11d48';
    ctx.lineWidth = 2;
    ctx.fillRect(-4, -4, 8, 8);
    ctx.strokeRect(-4, -4, 8, 8);
    ctx.restore();
  });

  // playhead
  const px = timeToX(state.playheadSec);
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, ch); ctx.stroke();
  const py = valToY(effectiveIntensity(p.id, state.playheadSec));
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();

  // labels
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '9px "SF Mono", monospace';
  ctx.fillText('200%', 4, 10);
  ctx.fillText('0%', 4, ch - 4);
}

function hexToRgba(hex, a) {
  const h = (hex || '#e11d48').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

function runAiVfxAssistant(promptText) {
  const lower = (promptText || '').toLowerCase();
  let chosenPool = [];

  if (lower.includes('awge') || lower.includes('16mm') || lower.includes('shutter') || lower.includes('step')) {
    chosenPool = ['time_360_smear', 'time_film_snip', 'opt_500t_halation', 'opt_split_diopter', 'opt_gate_weave'];
  } else if (lower.includes('silver') || lower.includes('bleach') || lower.includes('division') || lower.includes('brutalist')) {
    chosenPool = ['lab_bleach_bypass', 'cam_sub_thump', 'cam_crash_zoom', 'lab_threshold_print', 'time_velocity_snap'];
  } else if (lower.includes('anamorphic') || lower.includes('a24') || lower.includes('500t')) {
    chosenPool = ['opt_anamorphic_fringe', 'opt_500t_halation', 'cam_shoulder_float', 'lab_kodak_2383', 'depth_streak'];
  } else if (lower.includes('brand') || lower.includes('commercial') || lower.includes('talking')) {
    chosenPool = ['ed_2cam_punch', 'depth_skin_rolloff', 'depth_sep', 'ed_soft_vignette', 'ed_whip_jcut'];
    state.scene = 'talking_head';
  } else {
    chosenPool = ['opt_500t_halation', 'time_360_smear', 'cam_sub_thump', 'opt_split_diopter', 'lab_kodak_2383'];
  }

  const newVfxClips = [];
  const slots = [2, 21, 40, 60, 80];
  slots.forEach((leftPct, idx) => {
    const pid = chosenPool[idx % chosenPool.length];
    const preset = VFX_PRESETS.find((p) => p.id === pid) || VFX_PRESETS[0];
    newVfxClips.push({
      left: leftPct,
      width: 17,
      label: preset.name,
      presetId: preset.id
    });
  });

  state.timelineTracks.v3 = newVfxClips;
  state.activePreset = VFX_PRESETS.find((p) => p.id === chosenPool[0]) || VFX_PRESETS[0];
  state.presetPicked = true;   // an explicit "build pass" request counts as picking
  state.hitFlashBurst = 0.9;
  document.getElementById('activeFxPill').textContent = `Optical Pass: ${state.activePreset.name}`;
  renderTimelineTracks();
  renderVfxGrid();

  dispatchToResolve('batch_ai_vfx', {
    prompt: promptText,
    presetsPlaced: newVfxClips.length,
    intensity: state.masterIntensity,
    keyframes: []
  }, `Built ${newVfxClips.length}-node cinema VFX pass across timeline`);
}

// ============================================================================
// TAB 3: CUT SILENCES (TALKING HEAD & BRAND CONTENT)
// ============================================================================
function initSilenceTab() {
  const dbSlider = document.getElementById('silenceDbSlider');
  const minMsSlider = document.getElementById('silenceMinMsSlider');
  const padMsSlider = document.getElementById('silencePadMsSlider');

  const updateSilenceAnalysis = () => {
    state.silenceThresholdDb = Number(dbSlider.value);
    state.silenceMinMs = Number(minMsSlider.value);
    state.silencePadMs = Number(padMsSlider.value);

    document.getElementById('silenceDbVal').textContent = `${state.silenceThresholdDb} dB`;
    document.getElementById('thresholdBadge').textContent = `Threshold: ${state.silenceThresholdDb} dB`;
    document.getElementById('silenceMinMsVal').textContent = `${state.silenceMinMs} ms`;
    document.getElementById('silencePadMsVal').textContent = `${state.silencePadMs} ms`;

    renderSilenceSegments();
    drawSilenceWaveform();
  };

  dbSlider.addEventListener('input', updateSilenceAnalysis);
  minMsSlider.addEventListener('input', updateSilenceAnalysis);
  padMsSlider.addEventListener('input', updateSilenceAnalysis);

  document.getElementById('applySilenceCutBtn').addEventListener('click', executeSilenceCut);

  renderSilenceSegments();
  drawSilenceWaveform();
}

function isSegmentCut(seg) {
  if (seg.forceKeep) return false;
  const durMs = (seg.end - seg.start) * 1000;
  return seg.db <= state.silenceThresholdDb && durMs >= state.silenceMinMs;
}

function renderSilenceSegments() {
  const listEl = document.getElementById('silenceSegmentsList');
  if (listEl && !state.silenceSegments.length) {
    // Nothing is detected until the user asks. Showing invented dead air would
    // get edits applied to footage that was never analysed.
    listEl.innerHTML = '<p class="empty-hint">No analysis yet — load footage and press <b>Detect silence</b>. '
      + 'Nothing is cut, and nothing is added to your timeline, until you do.</p>';
    const stat = document.getElementById('silenceSavedStat');
    if (stat) stat.textContent = '0.0s';
    return;
  }
  let keptSec = 0;
  let cutCount = 0;
  const padSec = (state.silencePadMs / 1000) * 2;

  listEl.innerHTML = state.silenceSegments.map((seg) => {
    const cut = isSegmentCut(seg);
    const dur = (seg.end - seg.start).toFixed(1);
    if (cut) {
      cutCount++;
      keptSec += Math.min(seg.end - seg.start, padSec);
    } else {
      keptSec += (seg.end - seg.start);
    }
    return `
      <div class="segment-row ${cut ? 'silence-cut' : ''}" data-segid="${seg.id}">
        <div>
          <strong>${seg.start.toFixed(1)}s – ${seg.end.toFixed(1)}s (${dur}s)</strong>
          <span style="color:#9ca3af; margin-left:8px;">${seg.label} (${seg.db} dB)</span>
        </div>
        <span class="segment-badge ${cut ? 'cut' : 'keep'}">
          ${cut ? 'CUT SILENCE' : 'KEEP SPEECH'}
        </span>
      </div>
    `;
  }).join('');

  const orig = 36.0;
  const saved = Math.max(0, orig - keptSec);
  const pct = Math.round((saved / orig) * 100);

  document.getElementById('silenceOrigDur').textContent = `00:${orig.toFixed(1)}s`;
  document.getElementById('silenceNewDur').textContent = `00:${keptSec.toFixed(1)}s`;
  document.getElementById('silenceSavedPct').textContent = `${pct}% (-${saved.toFixed(1)}s)`;
  document.getElementById('silenceCutCount').textContent = `${cutCount} cuts`;

  listEl.querySelectorAll('.segment-row').forEach((row) => {
    row.addEventListener('click', () => {
      const id = Number(row.dataset.segid);
      const seg = state.silenceSegments.find((s) => s.id === id);
      if (seg) {
        seg.forceKeep = !seg.forceKeep;
        renderSilenceSegments();
        drawSilenceWaveform();
      }
    });
  });
}

function drawSilenceWaveform() {
  const canvas = document.getElementById('silenceWaveformCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = '#07090e';
  ctx.fillRect(0, 0, w, h);

  const totalDur = 36.0;
  state.silenceSegments.forEach((seg) => {
    const x1 = (seg.start / totalDur) * w;
    const x2 = (seg.end / totalDur) * w;
    const cut = isSegmentCut(seg);

    ctx.fillStyle = cut ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.08)';
    ctx.fillRect(x1, 0, x2 - x1, h);

    const bars = Math.max(4, Math.floor((x2 - x1) / 4));
    for (let i = 0; i < bars; i++) {
      const bx = x1 + i * 4;
      const normAmp = cut ? 0.11 : (0.42 + 0.45 * Math.abs(Math.sin(bx * 0.17 + i)));
      const bh = normAmp * (h * 0.78);
      ctx.fillStyle = cut ? '#ef4444' : '#e11d48';
      ctx.fillRect(bx, (h - bh) / 2, 2.5, bh);
    }
  });

  const normThresh = Math.min(0.9, Math.max(0.1, (state.silenceThresholdDb + 55) / 42));
  const ty = h - normThresh * (h * 0.8);
  ctx.strokeStyle = '#f59e0b';
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(0, ty);
  ctx.lineTo(w, ty);
  ctx.stroke();
  ctx.setLineDash([]);
}

function executeSilenceCut() {
  const kept = state.silenceSegments.filter((s) => !isSegmentCut(s));
  const autoZoom = document.getElementById('autoZoomJumpCut').checked;

  let cursor = 0;
  const newV1 = [];
  const totalKeptDur = kept.reduce((acc, s) => acc + (s.end - s.start), 0) || 1;

  kept.forEach((s, idx) => {
    const widthPct = Math.max(8, Math.round(((s.end - s.start) / totalKeptDur) * 100));
    const zoomLabel = autoZoom && idx % 2 === 1 ? ' (1.08x 2-Cam)' : '';
    newV1.push({
      left: Math.min(92, cursor),
      width: Math.min(100 - cursor, widthPct),
      label: `Subclip #${idx + 1}${zoomLabel}`
    });
    cursor += widthPct;
  });

  state.timelineTracks.v1 = newV1;
  renderTimelineTracks();

  const resolveSegments = kept.map((s) => ({
    startFrame: Math.round(s.start * 24),
    endFrame: Math.round(s.end * 24),
    label: s.label
  }));

  dispatchToResolve('cut_silences', {
    thresholdDb: state.silenceThresholdDb,
    minSilenceMs: state.silenceMinMs,
    paddingMs: state.silencePadMs,
    autoZoomJumpCut: autoZoom,
    segments: resolveSegments
  }, `Stripped silences & built ${kept.length} subclips on timeline`);
}

// ============================================================================
// TAB 2: LYRC.STUDIO KINETIC LYRIC STYLES & SONG TEMPLATE ENGINE
// ============================================================================
function initCaptionsTab() {
  const rawInput = document.getElementById('lyricsRawInput');
  // No stock lyrics: the tab stays empty until the user pastes their own.
  if (!rawInput.value) rawInput.value = '';

  renderCaptionStyleStrip();
  updateContextualBar();
  syncLyricsToBeatCues();

  document.querySelectorAll('#lyrcCategoryPills .lyrc-cat-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#lyrcCategoryPills .lyrc-cat-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      state.lyrcFilterCat = pill.dataset.lcat;
      renderCaptionStyleStrip();
    });
  });

  const tabLyricsSwitch = document.getElementById('lyricsTabToggleBtn');
  if (tabLyricsSwitch) {
    tabLyricsSwitch.addEventListener('click', () => {
      setLyricsOverlay(!state.showLyricsOverlay);
      showToast(state.showLyricsOverlay
        ? 'LYRC typography ON — visible on the monitor and in exports'
        : 'LYRC typography OFF — clean picture');
    });
  }

  document.getElementById('lyricVariationBtn').addEventListener('click', () => {
    if (!state.captionStyle.supportsVariation) {
      showToast(`"${state.captionStyle.name}" uses a fixed recipe and does not use Variation seeds.`);
      return;
    }
    state.variationSeed = (state.variationSeed % 6) + 1;
    document.getElementById('variationSeedBadge').textContent = `#${state.variationSeed}`;
    refreshLyricsPill();
    showToast(`Generated Arrangement Variation #${state.variationSeed} for "${state.captionStyle.name}"`);
  });

  document.getElementById('lyricShuffleClipsBtn').addEventListener('click', () => {
    state.clipShuffleSeed++;
    const videoPool = state.mediaPool.filter((c) => c.bin !== 'Audio');
    const shuffled = [...videoPool].sort((a, b) => {
      const ha = (a.name.charCodeAt(0) + state.clipShuffleSeed * 17) % 13;
      const hb = (b.name.charCodeAt(0) + state.clipShuffleSeed * 31) % 13;
      return ha - hb;
    });
    const newV1 = [];
    for (let i = 0; i < 4; i++) {
      const clip = shuffled[i % shuffled.length];
      newV1.push({
        left: i * 25,
        width: 25,
        label: clip.name.replace(/\.(mov|mp4)$/i, '')
      });
    }
    state.timelineTracks.v1 = newV1;
    state.hitFlashBurst = 0.55;
    renderTimelineTracks();
    showToast(`Shuffled Media Pool clips under locked "${state.captionStyle.name}" Song Template`);
  });

  document.getElementById('lyrcFontPairSelect').addEventListener('change', (e) => {
    state.fontPair = e.target.value;
  });
  document.getElementById('lyrcAlignSelect').addEventListener('change', (e) => {
    state.alignment = e.target.value;
  });
  document.getElementById('lyrcBackdropSelect').addEventListener('change', (e) => {
    state.backdropMode = e.target.value;
  });

  document.getElementById('loadSampleLyricsBtn').addEventListener('click', () => {
    rawInput.value = DEFAULT_LYRICS_TEXT;
    state.scene = 'music_video';
    syncLyricsToBeatCues();
    showToast('Loaded Artist Music Video Hook Lyrics');
  });

  document.getElementById('loadSampleTalkingBtn').addEventListener('click', () => {
    rawInput.value = DEFAULT_TALKING_TEXT;
    state.scene = 'talking_head';
    const hormozi = CAPTION_STYLES.find((s) => s.id === 'hormozi_pop');
    if (hormozi) selectLyrcPreset(hormozi);
    syncLyricsToBeatCues();
    showToast('Loaded Talking-Head Brand Script');
  });

  rawInput.addEventListener('input', () => syncLyricsToBeatCues());
  document.getElementById('autoSyncLyricsBtn').addEventListener('click', () => {
    syncLyricsToBeatCues();
    showToast(`Beat-synced ${state.cues.length} lyric phrases at ${state.bpm} BPM`);
  });

  document.getElementById('capPrimaryColor').addEventListener('input', (e) => {
    state.primaryColor = e.target.value;
  });
  document.getElementById('capAccentColor').addEventListener('input', (e) => {
    state.accentColor = e.target.value;
  });
  document.getElementById('capFontSizeSlider').addEventListener('input', (e) => {
    state.fontScale = Number(e.target.value);
  });
  document.getElementById('capPosYSlider').addEventListener('input', (e) => {
    state.posY = Number(e.target.value);
  });

  document.getElementById('pushCaptionsResolveBtn').addEventListener('click', () => {
    syncLyricsToBeatCues();
    renderTimelineTracks();
    dispatchToResolve('add_captions_lyrics', {
      presetId: state.captionStyle.id,
      style: `${state.captionStyle.name} (Var #${state.variationSeed})`,
      alignment: state.alignment,
      backdropMode: state.backdropMode,
      intensity: Math.round(state.fontScale),
      fontSize: +(0.075 * (state.fontScale / 100)).toFixed(3),
      fps: 24,
      lines: state.cues
    }, `Built ${state.cues.length} native LYRC "${state.captionStyle.name}" TextPlus cards`);
  });

  document.getElementById('exportSrtBtn').addEventListener('click', downloadSrtFile);
}

function selectLyrcPreset(st) {
  state.captionStyle = st;
  state.primaryColor = st.primary;
  state.accentColor = st.accent;
  document.getElementById('capPrimaryColor').value = st.primary;
  document.getElementById('capAccentColor').value = st.accent;
  if (st.id === 'margin') state.alignment = 'left';
  else state.alignment = 'center';
  document.getElementById('lyrcAlignSelect').value = state.alignment;

  refreshLyricsPill();
  updateContextualBar();
  renderCaptionStyleStrip();
}

function updateContextualBar() {
  const st = state.captionStyle;
  const label = document.getElementById('ctxPresetLabel');
  label.innerHTML = `Active LYRC Preset: <strong>${st.name}</strong> (${st.category}) — ${st.desc}`;
  const varBtn = document.getElementById('lyricVariationBtn');
  varBtn.disabled = !st.supportsVariation;
  document.getElementById('variationSeedBadge').textContent = st.supportsVariation ? `#${state.variationSeed}` : 'Fixed';
}

function renderCaptionStyleStrip() {
  const strip = document.getElementById('captionStyleStrip');
  const filtered = CAPTION_STYLES.filter((s) => {
    if (state.lyrcFilterCat === 'ALL') return true;
    if (state.lyrcFilterCat === 'FAV') return s.fav;
    return s.category === state.lyrcFilterCat;
  });

  strip.innerHTML = filtered.map((st) => `
    <div class="cap-style-card ${state.captionStyle.id === st.id ? 'active' : ''}" data-styleid="${st.id}">
      <div class="cap-card-top">
        <span class="cap-cat-tag">${st.category}</span>
        <button class="cap-fav-btn ${st.fav ? 'fav-on' : ''}" data-favid="${st.id}" title="Favorite this LYRC style">★</button>
      </div>
      <div class="cap-style-preview">${st.previewHtml}</div>
      <div class="cap-style-foot">
        <span class="cap-style-name">${st.name}</span>
        <span class="cap-var-tag">${st.supportsVariation ? 'Var' : 'Fixed'}</span>
      </div>
    </div>
  `).join('');

  strip.querySelectorAll('.cap-style-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.cap-fav-btn')) return;
      const found = CAPTION_STYLES.find((s) => s.id === card.dataset.styleid);
      if (found) selectLyrcPreset(found);
    });
  });

  strip.querySelectorAll('.cap-fav-btn').forEach((fbtn) => {
    fbtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const found = CAPTION_STYLES.find((s) => s.id === fbtn.dataset.favid);
      if (found) {
        found.fav = !found.fav;
        renderCaptionStyleStrip();
      }
    });
  });
}

function syncLyricsToBeatCues() {
  const raw = document.getElementById('lyricsRawInput').value || '';
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const slotDur = state.totalDurSec / Math.max(1, lines.length);

  state.cues = lines.map((text, idx) => ({
    index: idx + 1,
    startSec: Number((idx * slotDur).toFixed(2)),
    endSec: Number(((idx + 1) * slotDur).toFixed(2)),
    text
  }));

  document.getElementById('cueCountBadge').textContent = `${state.cues.length} Phrases`;

  if (!lines.length) {
    const emptyList = document.getElementById('captionCuesList');
    if (emptyList) {
      emptyList.innerHTML = '<p class="empty-hint">No lyrics yet — paste them above and each line becomes a timed block.</p>';
    }
  }

  const listEl = document.getElementById('captionCuesList');
  listEl.innerHTML = state.cues.map((c) => `
    <div class="cue-item" data-start="${c.startSec}">
      <span class="cue-time">${c.startSec.toFixed(1)}s – ${c.endSec.toFixed(1)}s</span>
      <span class="cue-text">${c.text}</span>
    </div>
  `).join('');

  listEl.querySelectorAll('.cue-item').forEach((item) => {
    item.addEventListener('click', () => {
      state.playheadSec = Number(item.dataset.start) + 0.1;
    });
  });

  // Lyric blocks belong on the timeline only while lyrics are actually on.
  const cueSpan = Math.max(1, state.totalDurSec || 1);
  state.timelineTracks.sub = state.showLyricsOverlay ? state.cues.map((c) => ({
    left: Math.round((c.startSec / cueSpan) * 100),
    width: Math.max(6, Math.round(((c.endSec - c.startSec) / cueSpan) * 100) - 1),
    label: `${state.captionStyle.name}: ${c.text}`
  })) : [];
  renderTimelineTracks();
}

function downloadSrtFile() {
  const formatSrtTime = (sec) => {
    const ms = Math.floor((sec % 1) * 1000);
    const totalS = Math.floor(sec);
    const s = totalS % 60;
    const m = Math.floor(totalS / 60) % 60;
    const h = Math.floor(totalS / 3600);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  };
  const srt = state.cues.map((c) => `${c.index}\n${formatSrtTime(c.startSec)} --> ${formatSrtTime(c.endSec)}\n${c.text}\n`).join('\n');
  const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `pulsevfx_${state.captionStyle.id}_lyrics.srt`;
  a.click();
  showToast('Downloaded .SRT subtitle file ready for DaVinci Resolve');
}

// ============================================================================
// TAB 4: MEDIA POOL AI AUTO-EDITOR (MUSIC VIDEO & VLOG BUILDER)
// ============================================================================
function initMediaPoolTab() {
  renderMediaPoolGrid();

  document.querySelectorAll('.director-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.director-card').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      state.directorMode = card.dataset.director;
    });
  });

  document.querySelectorAll('.mp-bin').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mp-bin').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedBin = btn.dataset.bin;
      renderMediaPoolGrid();
    });
  });

  document.getElementById('syncMediaPoolBtn').addEventListener('click', async () => {
    const res = await dispatchToResolve('get_media_pool', {}, 'Scanned Resolve 21.1.1 Media Pool bins & clip metadata');
    if (res && res.bridgeResponse && Array.isArray(res.bridgeResponse.clips) && res.bridgeResponse.clips.length > 0) {
      state.mediaPool = res.bridgeResponse.clips.map((c, idx) => ({
        id: c.id || `live_${idx}`,
        name: c.name,
        bin: c.bin || 'Master',
        duration: c.duration || '00:00:10',
        frames: c.frames || 240,
        fps: c.fps || 24,
        res: c.resolution || '1920x1080',
        color: '#e11d48',
        included: true
      }));
      renderMediaPoolGrid();
    }
  });

  document.getElementById('addCustomPoolClipBtn').addEventListener('click', () => {
    const idx = state.mediaPool.length + 1;
    const isMv = state.directorMode === 'music_video';
    state.mediaPool.unshift({
      id: `mp_custom_${idx}`,
      name: isMv ? `C_CAM_CookeAnamorphic_Take_${idx}.mov` : `VLOG_SonyFX3_Broll_${idx}.mp4`,
      bin: isMv ? 'Performance' : 'B-Roll',
      duration: '00:00:42',
      frames: 1008,
      fps: 24,
      res: '3840x2160',
      color: '#e11d48',
      included: true
    });
    renderMediaPoolGrid();
    showToast('Added new clip to Media Pool list');
  });

  document.getElementById('autoAssembleBtn').addEventListener('click', runMediaPoolAutoAssembler);
}

function renderMediaPoolGrid() {
  const grid = document.getElementById('mediaPoolGrid');
  const clips = state.mediaPool.filter((c) => state.selectedBin === 'ALL' || c.bin === state.selectedBin);

  grid.innerHTML = clips.map((c) => `
    <div class="mp-clip-card ${c.included ? 'included' : ''}" data-clipid="${c.id}">
      <div class="mp-clip-left">
        <span class="mp-color-swatch" style="background:${c.color};"></span>
        <div>
          <div class="mp-clip-name">${c.name}</div>
          <div class="mp-clip-meta">Bin: ${c.bin} • ${c.res} @ ${c.fps}fps • ${c.duration}</div>
        </div>
      </div>
      <label class="checkbox-pill" style="padding:3px 7px;">
        <input type="checkbox" data-toggleclip="${c.id}" ${c.included ? 'checked' : ''} />
        <span>Use</span>
      </label>
    </div>
  `).join('');

  grid.querySelectorAll('input[data-toggleclip]').forEach((chk) => {
    chk.addEventListener('change', (e) => {
      const clip = state.mediaPool.find((c) => c.id === chk.dataset.toggleclip);
      if (clip) {
        clip.included = e.target.checked;
        renderMediaPoolGrid();
      }
    });
  });
}

function runMediaPoolAutoAssembler() {
  const included = state.mediaPool.filter((c) => c.included && c.bin !== 'Audio');
  if (included.length === 0) {
    showToast('Select at least one video clip in the Media Pool first');
    return;
  }

  const isMv = state.directorMode === 'music_video';
  const bpm = Number(document.getElementById('mvBpmInput').value) || 142;
  const pacing = document.getElementById('mvPacingSelect').value;
  const autoVfx = document.getElementById('mvAutoVfxSelect').value;

  const numCuts = isMv ? (pacing === '1' ? 10 : pacing === '4' ? 5 : 8) : 6;
  const stepPct = Math.floor(100 / numCuts);

  const newV1 = [];
  const newV2 = [];
  const newV3 = [];

  for (let i = 0; i < numCuts; i++) {
    const clip = included[i % included.length];
    const left = i * stepPct;
    const width = i === numCuts - 1 ? 100 - left : stepPct;
    newV1.push({
      left,
      width,
      label: clip.name.replace(/\.(mov|mp4)$/i, '')
    });

    if (i % 2 === 1) {
      const broll = included.find((c) => c.bin === 'B-Roll') || clip;
      newV2.push({
        left: left + 2,
        width: Math.max(6, width - 3),
        label: `B-Roll: ${broll.name.slice(0, 18)}`
      });
    }

    if (isMv && autoVfx !== 'none' && i % 2 === 0) {
      const vfxPreset = autoVfx === 'grunge'
        ? VFX_PRESETS.find((p) => p.id === 'lab_bleach_bypass')
        : autoVfx === 'crt'
          ? VFX_PRESETS.find((p) => p.id === 'opt_anamorphic_fringe')
          : VFX_PRESETS.find((p) => p.id === (i % 4 === 0 ? 'opt_500t_halation' : 'time_360_smear'));
      if (vfxPreset) {
        newV3.push({
          left,
          width: Math.min(14, width),
          label: vfxPreset.name,
          presetId: vfxPreset.id
        });
      }
    }
  }

  state.timelineTracks.v1 = newV1;
  state.timelineTracks.v2 = newV2;
  if (newV3.length > 0) state.timelineTracks.v3 = newV3;

  state.scene = isMv ? 'music_video' : 'talking_head';
  state.hitFlashBurst = 0.85;

  const tlTitle = isMv
    ? `TIMELINE — ${bpm}BPM_ANAMORPHIC_CUT (${numCuts} Cuts)`
    : `TIMELINE — BRAND_EDITORIAL_CUT (${numCuts} Scenes)`;
  document.getElementById('activeTimelineTitle').textContent = tlTitle;

  renderTimelineTracks();

  dispatchToResolve('auto_edit_timeline', {
    mode: state.directorMode,
    bpm,
    pacing,
    autoVfx,
    clipsUsed: included.map((c) => c.name),
    cuts: newV1
  }, `Auto-Assembled "${tlTitle}" from ${included.length} Media Pool clips`);
}

// ============================================================================
// EFFECT LAYERS — stack any number of effects, in order, with opacity + blend
// ----------------------------------------------------------------------------
// The Effect Browser picks the base look; this rack stacks more looks on top of
// it. Each layer keeps its own intensity (keyframable), opacity, blend mode and
// order, so you can build e.g.  halation (screen 40%) + print halftone
// (multiply 55%) + depth grade (normal 70%) and see it live before it goes to
// Resolve as one ordered node graph.
// ============================================================================
const LAYER_BLEND_MODES = [
  { id: 'normal', label: 'Normal', canvas: 'source-over' },
  { id: 'screen', label: 'Screen', canvas: 'screen' },
  { id: 'multiply', label: 'Multiply', canvas: 'multiply' },
  { id: 'overlay', label: 'Overlay', canvas: 'overlay' },
  { id: 'lighten', label: 'Lighten', canvas: 'lighten' },
  { id: 'difference', label: 'Difference', canvas: 'difference' },
  { id: 'softlight', label: 'Soft light', canvas: 'soft-light' }
];

const MAX_LIVE_LAYERS = 4;   // preview budget; all layers still export

function blendToComposite(blend) {
  const hit = LAYER_BLEND_MODES.find((b) => b.id === blend);
  return hit ? hit.canvas : 'source-over';
}

function ensureLayers() {
  if (!Array.isArray(state.layers)) state.layers = [];
  return state.layers;
}

function layerSeq() {
  state.layerSeq = (state.layerSeq || 0) + 1;
  return 'L' + state.layerSeq;
}

function activeLayers() {
  return ensureLayers();
}

function findLayer(id) {
  return ensureLayers().find((l) => l.id === id) || null;
}

// Position of a look in the stack (-1 when it is not stacked). The card badge
// uses this, and so does the slider wiring: a stacked look edits its layer.
function stackIndexOf(presetId) {
  return ensureLayers().findIndex((l) => l.presetId === presetId);
}

function stackLayersFor(presetId) {
  return ensureLayers().filter((l) => l.presetId === presetId);
}

// The one-line summary above the rack: "3 looks · bloom -> grain -> halation".
function renderStackChips() {
  const chips = document.getElementById('stackChips');
  const summary = document.getElementById('stackSummary');
  const panel = document.getElementById('stackPanel');
  const layers = ensureLayers();
  if (summary) {
    summary.textContent = layers.length
      ? `${layers.length} ${layers.length === 1 ? 'look' : 'looks'}`
      : 'Nothing stacked yet';
  }
  if (panel) panel.classList.toggle('has-layers', layers.length > 0);
  if (!chips) return;
  chips.innerHTML = layers.map((layer, i) => `
    <button class="stack-chip ${layer.enabled ? '' : 'muted'}" data-chip="${layer.id}"
      title="${layer.name} — click to preview, or remove it with the ×">
      <b>${i + 1}</b><span>${layer.name}</span>
    </button>`).join('<span class="stack-arrow">›</span>');
  chips.querySelectorAll('[data-chip]').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      const layer = findLayer(chip.getAttribute('data-chip'));
      if (!layer) return;
      const preset = VFX_PRESETS.find((x) => x.id === layer.presetId);
      if (preset) selectPreset(preset);
    });
  });
}

// Collapsed by default so the browser stays the first thing you see; it opens
// itself the moment something is stacked.
function setStackOpen(open) {
  const panel = document.getElementById('stackPanel');
  const btn = document.getElementById('stackToggleBtn');
  if (!panel) return;
  panel.classList.toggle('open', !!open);
  if (btn) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'Hide details' : 'Details';
  }
}

function addEffectLayer(preset) {
  const p = preset || state.activePreset;
  if (!p) return null;
  const layers = ensureLayers();
  if (layers.length >= 8) {
    showToast('Eight layers is the limit — remove one first', 'warn');
    return null;
  }
  const layer = {
    id: layerSeq(),
    presetId: p.id,
    name: p.name,
    category: p.category,
    effectType: p.effectType || p.id,
    accent: p.accent || '#e11d48',
    intensity: 100,
    opacity: 100,
    blend: 'normal',
    enabled: true,
    keys: []
  };
  layers.push(layer);
  renderLayerRack();
  renderVfxGrid();
  setStackOpen(true);
  const chain = layers.map((l) => l.name).join(' → ');
  showToast(
    layers.length === 1
      ? `Stack started: ${p.name}. Add more looks, then Send stack to Resolve.`
      : `${layers.length} looks stacked: ${chain}`,
    'ok'
  );
  return layer;
}

function removeEffectLayer(id) {
  const layers = ensureLayers();
  const idx = layers.findIndex((l) => l.id === id);
  if (idx < 0) return;
  const [gone] = layers.splice(idx, 1);
  renderLayerRack();
  renderVfxGrid();
  showToast(`${gone.name} removed — ${layers.length} look${layers.length === 1 ? '' : 's'} left in the stack`);
}

function moveEffectLayer(id, dir) {
  const layers = ensureLayers();
  const idx = layers.findIndex((l) => l.id === id);
  const to = idx + dir;
  if (idx < 0 || to < 0 || to >= layers.length) return;
  const [moved] = layers.splice(idx, 1);
  layers.splice(to, 0, moved);
  renderLayerRack();
  renderVfxGrid();
}

function toggleEffectLayer(id) {
  const layer = findLayer(id);
  if (!layer) return;
  layer.enabled = !layer.enabled;
  renderLayerRack();
  renderVfxGrid();
}

function setLayerField(id, field, value) {
  const layer = findLayer(id);
  if (!layer) return;
  layer[field] = value;
  renderLayerRack();
}

function layerKeyframe(id) {
  const layer = findLayer(id);
  if (!layer) return;
  const sec = +state.playheadSec.toFixed(3);
  const value = Math.round(layer.intensity);
  const existing = layer.keys.findIndex((k) => Math.abs(k.sec - sec) < 0.001);
  if (existing >= 0) layer.keys[existing].value = value;
  else layer.keys.push({ sec, value });
  layer.keys.sort((a, b) => a.sec - b.sec);
  if (layer.keys.length > 32) layer.keys = layer.keys.slice(-32);
  renderLayerRack();
  showToast(`${layer.name} keyframed at ${sec.toFixed(2)}s (${layer.keys.length} keys)`, 'ok');
}

function clearEffectLayers() {
  if (!ensureLayers().length) {
    showToast('The stack is already empty');
    return;
  }
  state.layers = [];
  renderLayerRack();
  renderVfxGrid();
  setStackOpen(false);
  showToast('Stack cleared — your timeline and Resolve project were not touched');
}

// Evaluated intensity for a layer at the playhead (keyframes win when present)
function layerIntensityAt(layer, timeSec) {
  if (!layer.keys || !layer.keys.length) return layer.intensity;
  return evalKeyframes(
    layer.keys.map((k) => ({ t: k.sec, v: k.value, ease: 'smooth' })),
    timeSec
  );
}

// ------------------------------------------------------------- preview render

const layerCanvases = new Map();

function layerCanvasFor(id, w, h) {
  let c = layerCanvases.get(id);
  if (!c) {
    c = document.createElement('canvas');
    layerCanvases.set(id, c);
  }
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  return c;
}

// Draws every enabled layer over the finished plate, in stack order.
// Called inside the camera transform so layers move with the picture.
function renderEffectLayers(ctx, w, h, t, onBeatPulse, grainAmount) {
  const layers = ensureLayers().filter((l) => l.enabled);
  if (!layers.length) return 0;
  const basePreset = state.activePreset;
  let drawn = 0;
  layers.slice(0, MAX_LIVE_LAYERS).forEach((layer) => {
    const intensity = Math.max(0, Math.min(200, layerIntensityAt(layer, state.playheadSec))) / 100;
    if (intensity <= 0.001) return;
    const canvas = layerCanvasFor(layer.id, w, h);
    const lctx = canvas.getContext('2d');
    if (!lctx) return;
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.globalAlpha = 1;
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, w, h);
    try {
      // Stack = a chain, not a pile. Each layer starts from the frames the
      // layers below it already produced, so "bloom then grain" grains the
      // bloom -- the same order the Fusion graph is built in.
      lctx.drawImage(ctx.canvas, 0, 0, w, h);
      state.activePreset = {
        accent: layer.accent,
        isTransition: basePreset && basePreset.isTransition,
        effectType: layer.effectType
      };
      drawCinemaOpticalShader(lctx, w, h, t, layer.effectType, intensity, onBeatPulse, grainAmount);
    } catch (_e) {
      state.activePreset = basePreset;
      return;
    }
    state.activePreset = basePreset;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, (layer.opacity || 100) / 100));
    ctx.globalCompositeOperation = blendToComposite(layer.blend);
    ctx.drawImage(canvas, 0, 0, w, h);
    ctx.restore();
    drawn++;
  });
  return drawn;
}

// ---------------------------------------------------------------------- rack

function layerPayload(layer) {
  const recipe = recipeForLocal(layer.presetId, layer.category);
  const keys = (layer.keys || []).slice().sort((a, b) => a.sec - b.sec);
  return {
    id: layer.id,
    presetId: layer.presetId,
    name: layer.name,
    category: layer.category,
    effectType: layer.effectType,
    intensity: Math.round(layerIntensityAt(layer, state.playheadSec)),
    opacity: Math.round(layer.opacity === undefined ? 100 : layer.opacity),
    blend: layer.blend || 'normal',
    enabled: layer.enabled !== false,
    keyframes: (keys.length ? keys : [{ sec: state.playheadSec, value: Math.round(layer.intensity) }])
      .map((k) => ({ timeSec: +Number(k.sec).toFixed(3), value: Math.round(Number(k.value) || 0) })),
    recipe: recipe,
    fps: 24
  };
}

function applyLayerStack() {
  const layers = ensureLayers().filter((l) => l.enabled);
  if (!layers.length) {
    const any = ensureLayers().length;
    showToast(any
      ? 'Every look in the stack is muted — unmute one first'
      : 'Press + Stack on a look first (stack two or more and they compound)', 'warn');
    return null;
  }
  const payload = { layers: layers.map(layerPayload), fps: 24, replace: true };
  const names = layers.map((l) => l.name).join(' + ');

  // One clip chip on the timeline strip, however many looks are inside it --
  // and only ever one, so pressing send twice does not litter the strip.
  const playheadPct = Math.min(84, Math.max(0, Math.round((state.playheadSec / state.totalDurSec) * 100)));
  state.timelineTracks.v3 = state.timelineTracks.v3.filter((c) => c.presetId !== '__stack__');
  state.timelineTracks.v3.push({
    left: playheadPct,
    width: Math.min(46, 15 + layers.length * 7),
    label: `STACK · ${layers.length}`,
    presetId: '__stack__'
  });
  renderTimelineTracks();

  return dispatchToResolve('layers_apply', payload, `Stack sent: ${names}`);
}

function renderLayerRack() {
  const rack = document.getElementById('layerRack');
  const badge = document.getElementById('layerCountBadge');
  const layers = ensureLayers();
  if (badge) {
    badge.textContent = layers.length ? `${layers.length}` : '0';
    badge.classList.toggle('hidden', layers.length === 0);
  }
  if (!rack) return;
  renderStackChips();
  const sendBtn = document.getElementById('applyLayersBtn');
  if (sendBtn) {
    const live = layers.filter((l) => l.enabled).length;
    sendBtn.textContent = live ? `Send to Resolve (${live})` : 'Send to Resolve';
    sendBtn.disabled = live === 0;
  }
  const countBadge = document.getElementById('layerCountBadge');
  if (countBadge) countBadge.classList.toggle('hidden', layers.length === 0);
  if (!layers.length) {
    rack.innerHTML = `<div class="layer-empty">
      <strong>Nothing stacked yet.</strong>
      <span>Press <b>+ Stack</b> on any look above. Every look you add runs after the one before it, so <b>bloom → grain → halation</b> is three passes on one clip, in that order. Then press <b>Send stack to Resolve</b> and the whole rack becomes one Fusion graph.</span>
    </div>`;
    return;
  }
  rack.innerHTML = layers.map((layer, i) => `
    <div class="layer-row ${layer.enabled ? '' : 'muted'}" data-layer="${layer.id}">
      <span class="layer-index">${i + 1}</span>
      <span class="layer-dot" style="background:${layer.accent || '#e11d48'}"></span>
      <div class="layer-main">
        <div class="layer-name" title="${layer.category || ''}">${layer.name}</div>
        <div class="layer-sub">${i === 0 ? 'first pass · runs on the clip' : `pass ${i + 1} · runs on pass ${i}`}${layer.keys && layer.keys.length ? ` · ◆ ${layer.keys.length} keys` : ''}</div>
      </div>
      <select class="layer-blend" data-layer-field="blend" title="How this pass composites over the passes below it">
        ${LAYER_BLEND_MODES.map((b) => `<option value="${b.id}" ${layer.blend === b.id ? 'selected' : ''}>${b.label}</option>`).join('')}
      </select>
      <label class="layer-slide" title="Effect intensity (keyframable)">
        <span>FX</span>
        <input type="range" min="0" max="200" value="${Math.round(layerIntensityAt(layer, state.playheadSec))}" data-layer-field="intensity" />
        <b>${Math.round(layerIntensityAt(layer, state.playheadSec))}%</b>
      </label>
      <label class="layer-slide" title="How much of this layer is visible">
        <span>OP</span>
        <input type="range" min="0" max="100" value="${Math.round(layer.opacity)}" data-layer-field="opacity" />
        <b>${Math.round(layer.opacity)}%</b>
      </label>
      <div class="layer-actions">
        <button class="btn-mini" data-layer-kf title="Keyframe this layer's intensity at the playhead">◆</button>
        <button class="btn-mini" data-layer-mute title="Mute / unmute this layer">${layer.enabled ? '◐' : '◯'}</button>
        <button class="btn-mini" data-layer-up title="Move up (applies later)">↑</button>
        <button class="btn-mini" data-layer-down title="Move down (applies earlier)">↓</button>
        <button class="btn-mini" data-layer-del title="Remove this layer">✕</button>
      </div>
    </div>`).join('');

  rack.querySelectorAll('[data-layer]').forEach((row) => {
    const id = row.getAttribute('data-layer');
    row.querySelectorAll('[data-layer-field]').forEach((input) => {
      input.addEventListener('input', () => {
        const field = input.getAttribute('data-layer-field');
        if (field === 'blend') setLayerField(id, 'blend', input.value);
        else setLayerField(id, field, Number(input.value));
      });
    });
    const kf = row.querySelector('[data-layer-kf]');
    if (kf) kf.addEventListener('click', () => layerKeyframe(id));
    const mute = row.querySelector('[data-layer-mute]');
    if (mute) mute.addEventListener('click', () => toggleEffectLayer(id));
    const up = row.querySelector('[data-layer-up]');
    if (up) up.addEventListener('click', () => moveEffectLayer(id, -1));
    const down = row.querySelector('[data-layer-down]');
    if (down) down.addEventListener('click', () => moveEffectLayer(id, 1));
    const del = row.querySelector('[data-layer-del]');
    if (del) del.addEventListener('click', () => removeEffectLayer(id));
  });
}

function initLayers() {
  ensureLayers();
  renderLayerRack();
  setStackOpen(false);
  const toggle = document.getElementById('stackToggleBtn');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const panel = document.getElementById('stackPanel');
      setStackOpen(!(panel && panel.classList.contains('open')));
    });
  }
  const add = document.getElementById('addLayerBtn');
  if (add) add.addEventListener('click', () => addEffectLayer(state.activePreset));
  const clear = document.getElementById('clearLayersBtn');
  if (clear) clear.addEventListener('click', clearEffectLayers);
  const send = document.getElementById('applyLayersBtn');
  if (send) send.addEventListener('click', applyLayerStack);
  // keep the layer readouts honest as the playhead moves
  setInterval(() => {
    if (!ensureLayers().length || document.hidden) return;
    const rack = document.getElementById('layerRack');
    if (!rack) return;
    ensureLayers().forEach((layer) => {
      if (!layer.keys || !layer.keys.length) return;
      const row = rack.querySelector(`[data-layer="${layer.id}"]`);
      if (!row) return;
      const v = Math.round(layerIntensityAt(layer, state.playheadSec));
      const slider = row.querySelector('[data-layer-field="intensity"]');
      const out = row.querySelector('.layer-slide b');
      if (slider && Number(slider.value) !== v) slider.value = String(v);
      if (out) out.textContent = v + '%';
    });
  }, 220);
}
// ============================================================================
// 4K RENDER BAY — true-resolution import + export
// ----------------------------------------------------------------------------
// The monitor is a 640x360 preview. This is the finishing path: it composes the
// SAME pipeline (plate -> optical shader -> effect layers -> depth stack ->
// optional matte/depth pass) at full export resolution, in tiles so a 3840x2160
// frame never needs several full float buffers at once.
//
// Everything heavy is cancellable and reports progress, because a 4K sequence
// is minutes of work and a dead tab is worse than a slow one.
// ============================================================================
const RB_TILE_W = 960;
const RB_TILE_H = 540;
const RB_TILE_OVERLAP = 48;

let rbScratch = null;
let rbCancelled = false;
let rbBusy = false;

function renderBaySource() {
  return state.rbSource || null;
}

function rbLogLine(msg) {
  const el = document.getElementById('rbLog');
  if (!el) return;
  const stamp = new Date().toLocaleTimeString();
  el.textContent = `[${stamp}] ${msg}\n` + el.textContent.split('\n').slice(0, 60).join('\n');
}

function rbProgress(pct, text) {
  const wrap = document.getElementById('rbProgressWrap');
  const fill = document.getElementById('rbProgressFill');
  const label = document.getElementById('rbProgressText');
  if (wrap) wrap.hidden = false;
  if (fill) fill.style.width = Math.max(0, Math.min(100, pct)) + '%';
  if (label && text) label.textContent = text;
}

function rbSetBusy(busy) {
  rbBusy = busy;
  const cancel = document.getElementById('rbCancelBtn');
  if (cancel) cancel.hidden = !busy;
  ['rbStillBtn', 'rbSequenceBtn', 'rbVideoBtn', 'rbResolve4KBtn', 'rbImportBtn'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = busy;
  });
}

function rbSizeSelection() {
  const sel = document.getElementById('rbSizeSelect');
  const id = sel && sel.value ? sel.value : 'uhd4k';
  if (id === 'custom') {
    const w = Number((document.getElementById('rbCustomW') || {}).value) || 3840;
    const h = Number((document.getElementById('rbCustomH') || {}).value) || 2160;
    return { width: Math.max(16, Math.round(w)), height: Math.max(16, Math.round(h)), label: `${w} × ${h} (custom)` };
  }
  const p = RENDER_ENGINE.presetFor(id);
  return { width: p.width, height: p.height, label: p.label };
}

function rbFps() {
  const el = document.getElementById('rbFpsSelect');
  return Number(el && el.value) || 24;
}

function rbFormat() {
  const el = document.getElementById('rbFormatSelect');
  return (el && el.value) || 'png';
}

// --------------------------------------------------------------- composition

/**
 * Draws one finished export frame at w x h. Mirrors drawMonitorFrame, but takes
 * the target surface and size as arguments so it can render 4K off-screen.
 */
function composeExportFrame(ctx, w, h, t) {
  const preset = state.activePreset || VFX_PRESETS[0];
  const effectType = preset.effectType || 'opt_halation';
  const intensity = effectiveIntensity(preset.id, state.playheadSec) / 100;
  const grainAmount = state.mixStylized / 100;
  const beatPhase = (t * (state.bpm / 60)) % 1;
  const onBeatPulse = Math.pow(Math.max(0, 1 - beatPhase * 3.5), 2.2);
  const renderTime = effectType === 'time_smear' ? Math.floor(t * 9) / 9 : t;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, w, h);

  // same camera-weight math as the preview, scaled to export size
  const scaleFactor = w / 640;
  let dx = 0;
  let dy = 0;
  let scale = 1;
  let rot = 0;
  if (effectType === 'cam_float') {
    dx = Math.sin(t * 1.7) * 5.5 * intensity * scaleFactor;
    dy = Math.cos(t * 1.3) * 4.2 * intensity * scaleFactor;
    rot = Math.sin(t * 0.9) * 0.006 * intensity;
    scale = 1.02;
  } else if (effectType === 'opt_gateweave') {
    dx = (Math.sin(t * 19) * 1.4 + Math.cos(t * 31) * 0.9) * intensity * scaleFactor;
    dy = Math.cos(t * 23) * 1.2 * intensity * scaleFactor;
    scale = 1.01;
  } else if (effectType === 'cam_thump' || state.hitFlashBurst > 0.05) {
    const thump = (0.075 * intensity * onBeatPulse) + (state.hitFlashBurst * 0.09);
    scale = 1.0 + thump;
  }

  ctx.save();
  ctx.translate(w / 2 + dx, h / 2 + dy);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);

  drawCinematicPlate(ctx, w, h, renderTime, onBeatPulse);
  // No effect picked yet: the plate goes up untouched. Skipping the call (rather
  // than passing an unknown type) matters — the shader's finishing pass would
  // otherwise overwrite the frame with black.
  if (state.presetPicked) {
    drawCinemaOpticalShader(ctx, w, h, renderTime, effectType, intensity, onBeatPulse, grainAmount);
  }
  applyDepthStackTiled(ctx, w, h, t, preset);
  renderEffectLayers(ctx, w, h, renderTime, onBeatPulse, grainAmount);
  ctx.restore();

  if (state.showLyricsOverlay) drawLyrcStudioTypography(ctx, w, h, t, onBeatPulse);
  if (state.mask && state.mask.soft && state.mask.showOnMonitor && state.mask.view !== 'off') {
    drawMaskOverlay(ctx, w, h, t);
  }
  ctx.restore();
  return ctx.canvas;
}

function rbScratchCanvas(w, h) {
  if (!rbScratch) rbScratch = document.createElement('canvas');
  if (rbScratch.width !== w || rbScratch.height !== h) {
    rbScratch.width = w;
    rbScratch.height = h;
  }
  return rbScratch;
}

// Depth effects, tile by tile. Convolution effects get RB_TILE_OVERLAP px of
// real neighbours, then only the inner rect is written back, so tiles match
// seamlessly at full resolution.
function applyDepthStackTiled(ctx, w, h, t) {
  const d = state.depth;
  if (!d || !d.map || !window.DEPTH_ENGINE) return 0;
  const on = depthEffectsOn();
  if (!on.count) return 0;

  const tiles = RENDER_ENGINE.planTiles(w, h, {
    tileW: RB_TILE_W,
    tileH: RB_TILE_H,
    overlap: RB_TILE_OVERLAP
  });
  let applied = 0;
  tiles.forEach((tile) => {
    let img;
    try {
      img = ctx.getImageData(tile.sx, tile.sy, tile.sw, tile.sh);
    } catch (_e) {
      return;
    }
    if (!img || !img.data || img.width !== tile.sw) return;
    const depthRect = DEPTH_ENGINE.sampleDepthRect(
      d.map, d.mapW || DEPTH_W, d.mapH || DEPTH_H,
      tile.sx, tile.sy, tile.sw, tile.sh, w, h
    );
    const out = DEPTH_ENGINE.apply(
      { data: img.data, width: tile.sw, height: tile.sh },
      depthRect,
      on.effects,
      { focus: d.focus / 100, aperture: d.aperture, time: t }
    );
    const full = ctx.createImageData(tile.w, tile.h);
    for (let y = 0; y < tile.h; y++) {
      for (let x = 0; x < tile.w; x++) {
        const src = ((y + tile.innerY) * tile.sw + (x + tile.innerX)) * 4;
        const dst = (y * tile.w + x) * 4;
        full.data[dst] = out.data[src];
        full.data[dst + 1] = out.data[src + 1];
        full.data[dst + 2] = out.data[src + 2];
        full.data[dst + 3] = 255;
      }
    }
    try {
      ctx.putImageData(full, tile.x, tile.y);
    } catch (_e) { /* tile rejection just leaves that area unprocessed */ }
    applied++;
  });
  return applied;
}

// ------------------------------------------------------------------- helpers

function rbCanvasToBlob(canvas, format, quality) {
  return new Promise((resolve) => {
    const type = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else resolve(rbDataUrlToBlob(canvas.toDataURL(type, quality || 0.95)));
      }, type, quality || 0.95);
    } else {
      resolve(rbDataUrlToBlob(canvas.toDataURL(type, quality || 0.95)));
    }
  });
}

function rbDataUrlToBlob(dataUrl) {
  const parts = String(dataUrl).split(',');
  const bin = typeof atob === 'function' ? atob(parts[1] || '') : '';
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: 'image/png' });
}

function rbDownload(blob, name) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 800);
    return true;
  } catch (_e) {
    return false;
  }
}

function rbBlobBytes(blob) {
  if (blob && typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer().then((ab) => new Uint8Array(ab));
  }
  if (typeof FileReader !== 'undefined' && blob) {
    return new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(new Uint8Array(fr.result));
      fr.readAsArrayBuffer(blob);
    });
  }
  return Promise.resolve(new Uint8Array(0));
}

const rbSleep = (ms) => new Promise((r) => setTimeout(r, ms || 0));

// -------------------------------------------------------------------- import

function rbAdoptSource(info) {
  state.rbSource = RENDER_ENGINE.describeSource(info);
  rbSyncSourceUI();
  return state.rbSource;
}

function rbSyncSourceUI() {
  const src = renderBaySource();
  const nameEl = document.getElementById('rbSourceName');
  const resEl = document.getElementById('rbSourceRes');
  const kindEl = document.getElementById('rbSourceKind');
  const badEl = document.getElementById('rbSource4k');
  const verdictEl = document.getElementById('rbSourceVerdict');
  if (!nameEl) return;
  if (!src) {
    nameEl.textContent = 'No footage imported — the procedural plate is the source.';
    if (resEl) resEl.textContent = '— × —';
    if (kindEl) kindEl.textContent = 'procedural';
    if (badEl) badEl.classList.add('hidden');
    if (verdictEl) verdictEl.textContent = 'Import a clip to work at its native resolution.';
  } else {
    nameEl.textContent = src.name;
    if (resEl) resEl.textContent = `${src.width} × ${src.height}`;
    if (kindEl) kindEl.textContent = src.kind + (src.duration ? ` · ${src.duration.toFixed(2)}s` : '');
    if (badEl) badEl.classList.toggle('hidden', !src.is4K);
    if (verdictEl) verdictEl.textContent = src.verdict;
  }
  rbSyncMemory();

  // sequence length defaults to the clip length once we know it
  const seq = document.getElementById('rbSeqSeconds');
  if (seq && src && src.duration) {
    seq.max = String(Math.min(60, Math.ceil(src.duration)));
    if (Number(seq.value) > src.duration) seq.value = String(Math.max(1, Math.ceil(src.duration)));
  }
}

function rbSyncMemory() {
  const el = document.getElementById('rbMemory');
  if (!el || !window.RENDER_ENGINE) return;
  const size = rbSizeSelection();
  const v = RENDER_ENGINE.memoryVerdict(size.width, size.height);
  const tiles = RENDER_ENGINE.planTiles(size.width, size.height, {
    tileW: RB_TILE_W, tileH: RB_TILE_H, overlap: RB_TILE_OVERLAP
  });
  const fps = rbFps();
  const frames = RENDER_ENGINE.framesFor(Number((document.getElementById('rbSeqSeconds') || {}).value) || 4, fps);
  const est = RENDER_ENGINE.estimateSequenceBytes(frames, rbFormat(), size.width, size.height);
  el.className = 'rb-memory ' + v.level;
  el.textContent = `${size.width} × ${size.height} · ${frames} frames · ~${RENDER_ENGINE.formatBytes(v.bytes)} of frame buffers in ${tiles.length} tiles · a ${rbFormat().toUpperCase()} sequence is roughly ${RENDER_ENGINE.formatBytes(est)}`
    + (v.level === 'blocked' ? ' — this size is likely to run out of browser memory.' : '');
}

function rbImportFile(file) {
  if (!file) return;
  const kind = /^image\//.test(file.type) || /\.(png|jpe?g|webp|tiff?|bmp|avif)$/i.test(file.name)
    ? 'image' : 'video';
  rbSyncMemory();
  rbLogLine(`Importing ${file.name} (${RENDER_ENGINE.formatBytes(file.size)}) …`);

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    if (kind === 'image') {
      const img = new Image();
      img.onload = () => {
        rbAdoptSource({ name: file.name, kind: 'image', width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
        // make it the actual plate, so what you export is what you see
        customImageEl = img;
        customImageInfo = { name: file.name, width: img.naturalWidth, height: img.naturalHeight, bytes: file.size || 0 };
        state.scene = 'custom_image';
        document.querySelectorAll('.scene-btn').forEach((b) => b.classList.remove('active'));
        const labelText = document.getElementById('customImageLabelText');
        if (labelText) {
          const short = file.name.length > 22 ? file.name.slice(0, 19) + '…' : file.name;
          labelText.textContent = '🖼 ' + short;
        }
        const lbl = document.getElementById('customImageLabel');
        if (lbl) lbl.classList.add('is-loaded');
        if (state.depth) depthRescan({ timeSec: state.playheadSec });
        rbLogLine(`Image ready at ${img.naturalWidth} × ${img.naturalHeight} — now the plate on the monitor.`);
        showToast(`${file.name} imported at ${img.naturalWidth} × ${img.naturalHeight}`, 'ok');
        resolve(state.rbSource);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        rbLogLine('Could not decode that image.');
        showToast('Could not read that image', 'error');
        resolve(null);
      };
      img.src = url;
      return;
    }

    const videoEl = document.getElementById('customVideoElement');
    if (!videoEl) {
      rbLogLine('No video element available.');
      resolve(null);
      return;
    }
    const onMeta = () => {
      videoEl.removeEventListener('loadedmetadata', onMeta);
      const width = videoEl.videoWidth || 0;
      const height = videoEl.videoHeight || 0;
      const duration = videoEl.duration || 0;
      rbAdoptSource({ name: file.name, kind: 'video', width, height, duration });
      lastPlateAspect = height ? width / height : 0;
      state.platePanUserSet = false;
      state.scene = 'custom_video';
      document.querySelectorAll('.scene-btn').forEach((b) => b.classList.remove('active'));
      rbLogLine(`Clip ready: ${width} × ${height}, ${duration.toFixed(2)}s${RENDER_ENGINE.is4K(width, height) ? ' (4K)' : ''}.`);
      if (state.depth) setTimeout(() => depthRescan(), 260);
      showToast(`${file.name} imported — ${width} × ${height}${RENDER_ENGINE.is4K(width, height) ? ' · 4K' : ''}`, 'ok');
      resolve(state.rbSource);
    };
    videoEl.addEventListener('loadedmetadata', onMeta);
    videoEl.src = url;
    videoEl.muted = true;
    videoEl.playsInline = true;
    if (state.motion && state.isPlaying) {
      const p = videoEl.play();
      if (p && p.catch) p.catch(() => {});
    }
    setTimeout(() => {
      if (!state.rbSource || state.rbSource.name !== file.name) {
        const w = videoEl.videoWidth || 0;
        const h = videoEl.videoHeight || 0;
        if (w && h) onMeta();
      }
    }, 1200);
  });
}

// -------------------------------------------------------------------- exports

async function rbExportStill() {
  if (rbBusy) return null;
  const size = rbSizeSelection();
  const verdict = RENDER_ENGINE.memoryVerdict(size.width, size.height);
  if (verdict.level === 'blocked') {
    showToast('That size is too big for this browser — pick 4K', 'error');
    return null;
  }
  rbSetBusy(true);
  rbProgress(5, `Rendering ${size.width} × ${size.height} still …`);
  rbLogLine(`Still export started at ${size.width} × ${size.height}.`);
  try {
    const canvas = rbScratchCanvas(size.width, size.height);
    const ctx = canvas.getContext('2d');
    composeExportFrame(ctx, size.width, size.height, state.playheadSec);
    rbProgress(70, 'Encoding …');
    const format = rbFormat();
    const blob = await rbCanvasToBlob(canvas, format, 0.95);
    const name = `PulseVFX_${size.width}x${size.height}_${state.playheadSec.toFixed(2)}s.${RENDER_ENGINE.extFor(format)}`;
    const ok = rbDownload(blob, name);
    rbProgress(100, `Still exported — ${RENDER_ENGINE.formatBytes(blob.size)}`);
    rbLogLine(`Still written: ${name} (${RENDER_ENGINE.formatBytes(blob.size)})${ok ? '' : ' — download blocked by the browser'}.`);
    showToast(`4K still exported (${size.width} × ${size.height})`, ok ? 'ok' : 'warn');
    return { name, bytes: blob.size, width: size.width, height: size.height };
  } catch (err) {
    rbLogLine('Still export failed: ' + (err && err.message));
    showToast('Still export failed', 'error');
    return null;
  } finally {
    rbSetBusy(false);
  }
}

async function rbExportSequence() {
  if (rbBusy) return null;
  const size = rbSizeSelection();
  const fps = rbFps();
  const format = rbFormat();
  const seconds = Math.max(1, Number((document.getElementById('rbSeqSeconds') || {}).value) || 4);
  const count = Math.min(600, Math.max(1, Math.round(seconds * fps)));
  const verdict = RENDER_ENGINE.memoryVerdict(size.width, size.height);
  if (verdict.level === 'blocked') {
    showToast('That size is too large for this browser — pick 4K', 'error');
    return null;
  }

  rbCancelled = false;
  rbSetBusy(true);
  rbLogLine(`Sequence export started: ${count} frames at ${size.width} × ${size.height}, ${fps} fps, ${format.toUpperCase()}.`);

  const files = [];
  const startSec = 0;
  const depthPass = !!(document.getElementById('rbPassDepth') || {}).checked;
  const mattePass = !!(document.getElementById('rbPassMatte') || {}).checked;
  let sequenceCanvas = null;

  try {
    for (let i = 0; i < count; i++) {
      if (rbCancelled) {
        rbLogLine('Cancelled by user.');
        rbProgress(0, 'Cancelled');
        return { cancelled: true, frames: files.length };
      }
      const t = startSec + i / fps;
      sequenceCanvas = rbScratchCanvas(size.width, size.height);
      const ctx = sequenceCanvas.getContext('2d');
      state.playheadSec = t;
      composeExportFrame(ctx, size.width, size.height, t);
      const blob = await rbCanvasToBlob(sequenceCanvas, format, 0.95);
      files.push({
        name: RENDER_ENGINE.frameFilename('beauty/plate', i + 1, RENDER_ENGINE.extFor(format)),
        bytes: await rbBlobBytes(blob)
      });

      if (depthPass && state.depth && state.depth.map && window.DEPTH_ENGINE) {
        // its own canvas: the beauty frame must survive for the next pass
        const depthCanvas = document.createElement('canvas');
        depthCanvas.width = size.width;
        depthCanvas.height = size.height;
        const dctx = depthCanvas.getContext('2d');
        const gray = DEPTH_ENGINE.toGray(state.depth.map, state.depth.mapW || DEPTH_W, state.depth.mapH || DEPTH_H, false);
        const tmp = document.createElement('canvas');
        tmp.width = state.depth.mapW || DEPTH_W;
        tmp.height = state.depth.mapH || DEPTH_H;
        const tctx = tmp.getContext('2d');
        const idata = tctx.createImageData(tmp.width, tmp.height);
        idata.data.set(gray);
        tctx.putImageData(idata, 0, 0);
        dctx.setTransform(1, 0, 0, 1, 0, 0);
        dctx.drawImage(tmp, 0, 0, size.width, size.height);
        const depthBlob = await rbCanvasToBlob(depthCanvas, 'png', 1);
        files.push({
          name: RENDER_ENGINE.frameFilename('depth/plate', i + 1, 'png'),
          bytes: await rbBlobBytes(depthBlob)
        });
        composeExportFrame(ctx, size.width, size.height, t);
      }

      if (mattePass && state.mask && state.mask.soft) {
        const matteCanvas = document.createElement('canvas');
        matteCanvas.width = size.width;
        matteCanvas.height = size.height;
        const mctx = matteCanvas.getContext('2d');
        mctx.fillStyle = '#000';
        mctx.fillRect(0, 0, size.width, size.height);
        mctx.drawImage(maskColoredCanvas('#ffffff', null), 0, 0, size.width, size.height);
        const matteBlob = await rbCanvasToBlob(matteCanvas, 'png', 1);
        files.push({
          name: RENDER_ENGINE.frameFilename('matte/plate', i + 1, 'png'),
          bytes: await rbBlobBytes(matteBlob)
        });
      }

      const pct = ((i + 1) / count) * 100;
      rbProgress(pct, `Frame ${i + 1} / ${count} · ${size.width} × ${size.height}`);
      if (i % 3 === 0) await rbSleep(0); // keep the page responsive
    }

    rbProgress(96, 'Zipping frames …');
    rbLogLine(`Zipping ${files.length} files …`);
    const zip = RENDER_ENGINE.zipStore(files);
    const blob = new Blob([zip], { type: 'application/zip' });
    const name = `PulseVFX_${size.width}x${size.height}_${count}f_${format}.zip`;
    const ok = rbDownload(blob, name);
    rbProgress(100, `Sequence exported — ${RENDER_ENGINE.formatBytes(blob.size)}`);
    rbLogLine(`Sequence written: ${name} (${RENDER_ENGINE.formatBytes(blob.size)}, ${files.length} files).`);
    showToast(`${count} frames at ${size.width} × ${size.height} exported`, ok ? 'ok' : 'warn');
    return { name, bytes: blob.size, frames: count, files: files.length, width: size.width, height: size.height };
  } catch (err) {
    rbLogLine('Sequence export failed: ' + (err && err.message));
    showToast('Sequence export failed', 'error');
    return null;
  } finally {
    rbSetBusy(false);
    rbCancelled = false;
  }
}

async function rbExportVideo() {
  if (rbBusy) return null;
  const size = rbSizeSelection();
  const fps = rbFps();
  const seconds = Math.max(1, Number((document.getElementById('rbSeqSeconds') || {}).value) || 4);
  const canvas = rbScratchCanvas(size.width, size.height);
  if (!canvas.captureStream || typeof MediaRecorder === 'undefined') {
    rbLogLine('This browser cannot record video from a canvas — use the PNG sequence.');
    showToast('This browser has no canvas recorder — use the PNG sequence', 'warn');
    return null;
  }

  rbCancelled = false;
  rbSetBusy(true);
  const bitrate = Math.round(size.width * size.height * fps * 0.12); // ~12% bits/pixel/frame
  rbLogLine(`Review render started: ${size.width} × ${size.height} @ ${fps} fps, ${Math.round(bitrate / 1e6)} Mbps.`);

  try {
    const stream = canvas.captureStream(fps);
    const chunks = [];
    const rec = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
      videoBitsPerSecond: bitrate
    });
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const done = new Promise((resolve) => { rec.onstop = resolve; });
    rec.start();

    const total = Math.round(seconds * fps);
    const ctx = canvas.getContext('2d');
    for (let i = 0; i < total; i++) {
      if (rbCancelled) break;
      const t = i / fps;
      state.playheadSec = t;
      composeExportFrame(ctx, size.width, size.height, t);
      rbProgress((i / total) * 100, `Recording ${i + 1} / ${total}`);
      await rbSleep(1000 / fps);
    }
    rec.stop();
    await done;
    const blob = new Blob(chunks, { type: 'video/webm' });
    const name = `PulseVFX_review_${size.width}x${size.height}.webm`;
    const ok = rbDownload(blob, name);
    rbProgress(100, `Review render written — ${RENDER_ENGINE.formatBytes(blob.size)}`);
    rbLogLine(`Review render: ${name} (${RENDER_ENGINE.formatBytes(blob.size)}).`);
    showToast('4K review render exported — for a master, use "Make Resolve render 4K natively"', ok ? 'ok' : 'warn');
    return { name, bytes: blob.size, width: size.width, height: size.height };
  } catch (err) {
    rbLogLine('Review render failed: ' + (err && err.message));
    showToast('Review render failed', 'error');
    return null;
  } finally {
    rbSetBusy(false);
    rbCancelled = false;
  }
}

function rbResolve4K() {
  const size = rbSizeSelection();
  const fps = rbFps();
  rbLogLine(`Asking Resolve to switch to ${size.width} × ${size.height} @ ${fps} fps.`);
  return dispatchToResolve(
    'set_4k_timeline',
    { width: size.width, height: size.height, fps: fps, source: state.rbSource || null },
    `Resolve set to ${size.width} × ${size.height} — render the Fusion graph natively`
  );
}

function initRenderBay() {
  if (!window.RENDER_ENGINE) return;

  const sizeSel = document.getElementById('rbSizeSelect');
  if (sizeSel) {
    sizeSel.innerHTML = RENDER_ENGINE.PRESETS
      .map((p) => `<option value="${p.id}"${p.id === 'uhd4k' ? ' selected' : ''}>${p.label}</option>`)
      .join('') + '<option value="custom">Custom size…</option>';
    sizeSel.addEventListener('change', rbSyncMemory);
  }
  ['rbFpsSelect', 'rbFormatSelect', 'rbSeqSeconds'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', rbSyncMemory);
  });

  const importBtn = document.getElementById('rbImportBtn');
  const fileInput = document.getElementById('rbFileInput');
  if (importBtn && fileInput) importBtn.addEventListener('click', () => fileInput.click());
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (file) rbImportFile(file);
    });
  }
  const drop = document.getElementById('rbDropZone');
  if (drop) {
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.add('hot');
    }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('hot')));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) rbImportFile(file);
    });
  }

  const still = document.getElementById('rbStillBtn');
  if (still) still.addEventListener('click', () => rbExportStill());
  const seq = document.getElementById('rbSequenceBtn');
  if (seq) seq.addEventListener('click', () => rbExportSequence());
  const vid = document.getElementById('rbVideoBtn');
  if (vid) vid.addEventListener('click', () => rbExportVideo());
  const res = document.getElementById('rbResolve4KBtn');
  if (res) res.addEventListener('click', rbResolve4K);
  const cancel = document.getElementById('rbCancelBtn');
  if (cancel) cancel.addEventListener('click', () => {
    rbCancelled = true;
    rbLogLine('Cancelling after this frame …');
  });

  rbSyncSourceUI();
  rbSyncMemory();
}
// ============================================================================
// DEPTH MAP & DEPTH EFFECTS
// ----------------------------------------------------------------------------
// The depth engine (public/depth.js) estimates a depth map from the plate or
// uses a real one you load, and runs the effect stack on the pixels. This part
// is the panel: source switching, the effect rack, the monitor preview and the
// native Fusion graph that goes to Resolve.
//
// Depth convention everywhere: 0 = near, 1 = far.
// ============================================================================
// The depth map itself is estimated at this resolution. It used to share the
// 160x90 Magic Mask buffer, which threw away almost all the detail: an uploaded
// 1920x1080 depth map was crushed to 160x90 and the effects looked like mush.
const DEPTH_W = 480;
const DEPTH_H = 270;
const DEPTH_UPLOAD_MAX = 960;  // loaded maps keep native detail up to this width
const DEPTH_LIVE_INTERVAL_MS = 160;

function defaultDepthState() {
  return {
    source: 'estimate',      // estimate | mask | upload
    engine: state.depthEnginePref || 'ai',   // ai (Depth Anything V2) | fast (heuristic)
    aiStatus: '',            // human-readable state of the model
    aiBusy: false,
    aiProgress: -1,          // 0..1 while downloading, -1 when unknown
    aiReady: false,
    aiFailed: false,
    view: 'off',             // off | overlay | map | split
    live: true,              // re-estimate from the current frame while it plays
    invert: false,
    smooth: 2,
    contrast: 55,
    nearBias: 50,
    focus: 45,
    aperture: 100,
    map: null,               // Float32Array at DEPTH_W x DEPTH_H
    mapW: 0,
    mapH: 0,
    loadedMap: null,         // Float32Array from an uploaded image
    loadedMapW: 0,           // its real resolution, kept instead of downscaling
    loadedMapH: 0,
    effects: {},             // id -> 0..100
    keys: {},                // id -> [{sec, value}]
    status: 'Press ↻ Re-scan plate to build the depth map.',
    dirty: true
  };
}

function ensureDepthState() {
  if (!state.depth) state.depth = defaultDepthState();
  return state.depth;
}

// The same procedural plate the monitor draws, at depth resolution.
let depthSampleCanvas = null;
function depthSamplePlate(timeSec) {
  if (!depthSampleCanvas) {
    depthSampleCanvas = document.createElement('canvas');
    depthSampleCanvas.width = DEPTH_W;
    depthSampleCanvas.height = DEPTH_H;
  }
  const sctx = depthSampleCanvas.getContext('2d');
  if (!sctx) return null;
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.clearRect(0, 0, DEPTH_W, DEPTH_H);
  try {
    drawCinematicPlate(sctx, DEPTH_W, DEPTH_H, timeSec, 0);
    return sctx.getImageData(0, 0, DEPTH_W, DEPTH_H);
  } catch (_e) {
    return null;
  }
}

function depthRescan(opts) {
  const d = ensureDepthState();
  const o = opts || {};
  // AI engine: hand the frame to Depth Anything V2 and let it answer. The
  // heuristic below stays as the instant preview and the fallback.
  //
  // The model is a one-time 40 MB download, so it only runs when it is actually
  // wanted: the depth tab is open, a depth effect is switched on, or the user
  // just picked the AI engine. Loading a photo must not silently pull 40 MB.
  if (d.engine === 'ai' && d.source === 'estimate' && !o.forceFast && !o.silent) {
    const wanted = state.activeTab === 'depth' || depthEffectsOn().count > 0;
    if (wanted || o.ai) {
      d.status = 'AI depth: running Depth Anything V2 on this frame…';
      depthSyncUI();
      depthAiRun();
      return;
    }
    if (!d.map) {
      // paint the instant preview so nothing looks broken, and say why
      d.previewOnly = true;
      depthRescan({ forceFast: true, timeSec: o.timeSec });
      d.status = 'Instant preview. Open 06 • Depth Map to run the AI model on this frame.';
      depthSyncUI();
      return;
    }
    return;
  }
  if (!window.DEPTH_ENGINE) {
    d.status = 'Depth engine did not load — check that depth.js is present.';
    depthSyncUI();
    return;
  }
  const m = state.mask;
  if (d.source === 'upload') {
    if (!d.loadedMap) {
      d.status = 'Load a depth map image first (⬆ or the "Load depth map" button).';
      depthSyncUI();
      return;
    }
    d.map = d.loadedMap.slice();
    d.mapW = d.loadedMapW || DEPTH_W;
    d.mapH = d.loadedMapH || DEPTH_H;
    d.dirty = false;
    d.status = 'Using the loaded depth map. Every effect below is now accurate to that map.';
    if (!o.silent) depthSyncUI();
    return;
  }
  if (d.source === 'mask') {
    if (!m || !m.soft) {
      d.status = 'No Magic Mask yet — open 05 • Magic Mask, click your subject, then come back.';
      depthSyncUI();
      return;
    }
    const small = DEPTH_ENGINE.fromMask(m.soft, MASK_W, MASK_H, 0.35);
    d.map = DEPTH_ENGINE.resizeDepth(small, MASK_W, MASK_H, DEPTH_W, DEPTH_H);
    d.mapW = DEPTH_W;
    d.mapH = DEPTH_H;
    d.dirty = false;
    d.status = 'Depth from the Magic Mask: subject near, everything else far.';
    depthSyncUI();
    return;
  }
  const img = depthSamplePlate(o.timeSec === undefined ? state.playheadSec : o.timeSec);
  if (!img) {
    d.status = 'Preview not ready — press Play once, then re-scan.';
    depthSyncUI();
    return;
  }
  // Trust the frame that was actually sampled rather than the nominal size, so
  // a differently-sized plate can never be read out of bounds.
  const sw = img.width || DEPTH_W;
  const sh = img.height || DEPTH_H;
  d.map = DEPTH_ENGINE.estimate(
    { data: img.data, width: sw, height: sh },
    {
      smooth: d.smooth,
      contrast: d.contrast,
      nearBias: d.nearBias,
      invert: d.invert,
      mask: m && m.soft ? m.soft : null,
      maskW: MASK_W,
      maskH: MASK_H
    }
  );
  d.mapW = sw;
  d.mapH = sh;
  d.dirty = false;
  if (o.silent) return;
  d.status = m && m.soft
    ? 'Depth estimated from the plate, with your Magic Mask pinning the subject to the front.'
    : 'Depth estimated from the plate (haze, height, detail, saturation).';
  depthSyncUI();
}

// Live depth: re-estimate from the frame that is on screen right now, throttled
// to ~6 Hz. Without this the map was built once at boot and every effect was
// driven by a depth map of a frame that no longer existed (worst case with a
// video: the map described the starter plate, not the clip).
let depthLiveLast = 0;
let depthLiveUiLast = 0;

// The live estimate runs in depth-live-worker.js. This flag flips after a few
// failures (file://, CSP, an old browser) and the panel falls back to a smaller
// main-thread estimate so live depth still works, just at lower detail.
let depthWorker = null;
let depthWorkerBusy = false;
let depthWorkerDead = false;
let depthWorkerSeq = 0;
let depthWorkerPending = null;
let depthFallbackCanvas = null;
const DEPTH_FALLBACK_W = 320;
const DEPTH_FALLBACK_H = 180;
const DEPTH_FALLBACK_INTERVAL_MS = 260;

function depthEstimateOpts(d) {
  const m = state.mask;
  return {
    smooth: d.smooth,
    contrast: d.contrast,
    nearBias: d.nearBias,
    invert: d.invert,
    mask: m && m.soft ? m.soft : null,
    maskW: MASK_W,
    maskH: MASK_H
  };
}

function depthTakeWorkerResult(msg) {
  depthWorkerBusy = false;
  const d = ensureDepthState();
  if (msg && msg.map && msg.width && msg.height && d.source === 'estimate') {
    d.map = new Float32Array(msg.map);
    d.mapW = msg.width;
    d.mapH = msg.height;
    d.dirty = false;
  }
  if (msg && msg.error) {
    depthWorkerDead = true;
    depthWorker = null;
  }
  if (depthWorkerPending) {
    const next = depthWorkerPending;
    depthWorkerPending = null;
    depthPostLiveJob(next);
  }
}

function depthEnsureWorker() {
  if (depthWorker || depthWorkerDead) return depthWorker;
  if (typeof Worker !== 'function') { depthWorkerDead = true; return null; }
  try {
    depthWorker = new Worker('depth-live-worker.js');
    depthWorker.onmessage = (e) => depthTakeWorkerResult(e.data);
    depthWorker.onerror = () => { depthWorkerDead = true; depthWorker = null; depthWorkerBusy = false; };
  } catch (_e) {
    depthWorkerDead = true;
    depthWorker = null;
  }
  return depthWorker;
}

function depthPostLiveJob(job) {
  const worker = depthEnsureWorker();
  if (!worker) return false;
  if (depthWorkerBusy) { depthWorkerPending = job; return true; }
  try {
    depthWorkerSeq += 1;
    depthWorkerBusy = true;
    worker.postMessage({
      id: depthWorkerSeq,
      data: job.data.buffer,
      width: job.width,
      height: job.height,
      opts: depthEstimateOpts(ensureDepthState())
    }, [job.data.buffer]);
    return true;
  } catch (_e) {
    depthWorkerBusy = false;
    depthWorkerDead = true;
    depthWorker = null;
    return false;
  }
}

// Grab the current frame at depth resolution and hand it to the worker.
function depthLiveSample(timeSec) {
  const w = DEPTH_W;
  const h = DEPTH_H;
  if (!depthSampleCanvas) {
    depthSampleCanvas = document.createElement('canvas');
    depthSampleCanvas.width = w;
    depthSampleCanvas.height = h;
  }
  const sctx = depthSampleCanvas.getContext('2d');
  if (!sctx) return null;
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.clearRect(0, 0, w, h);
  try {
    drawCinematicPlate(sctx, w, h, timeSec, 0);
    const img = sctx.getImageData(0, 0, w, h);
    return { data: img.data, width: w, height: h };
  } catch (_e) {
    return null;
  }
}

function depthLiveWanted() {
  const d = state.depth;
  if (!d || !d.live) return false;
  if (d.source !== 'estimate') return false;   // loaded / mask maps are fixed
  if (state.activeTab !== 'depth' && !depthEffectsOn().count) return false;
  return true;
}

function depthLiveTick(nowMs) {
  if (!state.motion || !state.isPlaying || document.hidden) return;
  if (!depthLiveWanted()) return;
  const dd = ensureDepthState();
  if (dd.engine === 'ai') {
    // a full model pass takes seconds, not milliseconds: refresh only when the
    // worker is free and the last one is old enough to be worth replacing
    if (dd.aiBusy) return;
    if (nowMs - depthAiLastRun < DEPTH_AI_MIN_INTERVAL_MS) return;
    depthAiLastRun = nowMs;
    depthAiRun();
    return;
  }
  const interval = depthWorkerDead ? DEPTH_FALLBACK_INTERVAL_MS : DEPTH_LIVE_INTERVAL_MS;
  if (nowMs - depthLiveLast < interval) return;
  depthLiveLast = nowMs;

  if (!depthWorkerDead) {
    const frame = depthLiveSample(state.playheadSec);
    if (frame && depthPostLiveJob(frame)) {
      depthLiveUiTick(nowMs);
      return;
    }
  }
  // fallback: a smaller estimate on the main thread, less often. The frame has
  // to be sampled at this smaller size too, or the buffer would overrun.
  const d = ensureDepthState();
  if (!window.DEPTH_ENGINE) return;
  if (!depthFallbackCanvas) {
    depthFallbackCanvas = document.createElement('canvas');
    depthFallbackCanvas.width = DEPTH_FALLBACK_W;
    depthFallbackCanvas.height = DEPTH_FALLBACK_H;
  }
  const fctx = depthFallbackCanvas.getContext('2d');
  if (!fctx) return;
  try {
    fctx.setTransform(1, 0, 0, 1, 0, 0);
    fctx.clearRect(0, 0, DEPTH_FALLBACK_W, DEPTH_FALLBACK_H);
    drawCinematicPlate(fctx, DEPTH_FALLBACK_W, DEPTH_FALLBACK_H, state.playheadSec, 0);
    const img = fctx.getImageData(0, 0, DEPTH_FALLBACK_W, DEPTH_FALLBACK_H);
    if (d.source === 'estimate') {
      d.map = DEPTH_ENGINE.estimate(
        { data: img.data, width: DEPTH_FALLBACK_W, height: DEPTH_FALLBACK_H },
        depthEstimateOpts(d)
      );
      d.mapW = DEPTH_FALLBACK_W;
      d.mapH = DEPTH_FALLBACK_H;
      d.dirty = false;
    }
  } catch (_e) {
    return;
  }
  depthLiveUiTick(nowMs);
}

function depthLiveUiTick(nowMs) {
  // keep the thumbnail and counters in step, but only a few times a second
  if (state.activeTab === 'depth' && nowMs - depthLiveUiLast > 340) {
    depthLiveUiLast = nowMs;
    depthSyncUI();
  }
}

// ---------------------------------------------------------------------------
// AI depth: Depth Anything V2 Small, int8 ONNX, executed in a module worker
// against the vendored ONNX Runtime in vendor/depth/. This is a real monocular
// depth model — the same family Instant Depth Map uses — not a brightness
// heuristic. It is opt-in because the model is a 40 MB one-time download.
// ---------------------------------------------------------------------------
let depthAiWorker = null;
let depthAiJobId = 0;
let depthAiPendingFrame = null;
let depthAiLastRun = 0;
const DEPTH_AI_MIN_INTERVAL_MS = 2500;

function depthAiSetStatus(text, busy) {
  const d = ensureDepthState();
  d.aiStatus = text;
  d.aiBusy = !!busy;
  const el = document.getElementById('depthEngineStatus');
  if (el) el.textContent = text;
  const wrap = document.getElementById('depthEngineProgressWrap');
  const fill = document.getElementById('depthEngineProgressFill');
  if (wrap) {
    wrap.classList.toggle('hidden', !busy);
    if (busy) wrap.classList.remove('hidden');
  }
  if (fill) {
    if (busy && (d.aiProgress < 0 || d.aiProgress >= 1)) {
      fill.classList.add('is-busy');
      fill.style.width = '';
    } else if (busy) {
      fill.classList.remove('is-busy');
      fill.style.width = Math.max(2, Math.round(d.aiProgress * 100)) + '%';
    } else {
      fill.classList.remove('is-busy');
      fill.style.width = '0%';
    }
  }
}

function depthAiWorkerRef() {
  if (depthAiWorker) return depthAiWorker;
  if (typeof Worker !== 'function') return null;
  try {
    depthAiWorker = new Worker('depth-ai-worker.js', { type: 'module' });
  } catch (_e) {
    depthAiWorker = null;
    return null;
  }
  depthAiWorker.onmessage = (e) => depthAiOnMessage(e.data || {});
  depthAiWorker.onerror = () => {
    depthAiFail('The AI model could not start in this browser.');
  };
  return depthAiWorker;
}

function depthAiFail(message) {
  const d = ensureDepthState();
  d.aiFailed = true;
  d.aiBusy = false;
  d.engine = 'fast';
  depthAiSetStatus(`${message} Falling back to Fast estimate.`, false);
  depthSyncUI();
  depthRenderEngineButtons();
  showToast(message, 'error');
  depthRescan();
}

function depthAiOnMessage(msg) {
  const d = ensureDepthState();
  if (msg.type === 'progress') {
    if (msg.phase === 'download') {
      d.aiProgress = msg.total ? msg.loaded / msg.total : -1;
      const mb = (msg.loaded / 1048576).toFixed(1);
      const totalMb = msg.total ? (msg.total / 1048576).toFixed(0) : '40';
      depthAiSetStatus(`Downloading the depth model — ${mb} / ${totalMb} MB (one time, then cached).`, true);
    } else if (msg.phase === 'runtime') {
      d.aiProgress = -1;
      depthAiSetStatus('Starting the AI runtime…', true);
    } else if (msg.phase === 'compile') {
      d.aiProgress = -1;
      depthAiSetStatus('Preparing the model (this takes a few seconds once)…', true);
    }
    return;
  }
  if (msg.type === 'init') {
    d.aiReady = true;
    depthAiSetStatus('AI depth ready.', false);
    return;
  }
  if (msg.type === 'infer') {
    d.aiBusy = false;
    d.aiReady = true;
    d.aiProgress = -1;
    if (msg.map && msg.width && msg.height) {
      d.map = msg.map instanceof Float32Array ? msg.map : new Float32Array(msg.map);
      d.mapW = msg.width;
      d.mapH = msg.height;
      d.dirty = false;
      d.status = `AI depth from Depth Anything V2 (${((msg.ms || 0) / 1000).toFixed(1)}s). Every effect below is now driven by real geometry.`;
    }
    depthAiSetStatus('AI depth ready.', false);
    depthSyncUI();
    depthRenderAiStamp();
    if (depthAiPendingFrame) {
      const next = depthAiPendingFrame;
      depthAiPendingFrame = null;
      depthAiRun(next.label);
    }
    return;
  }
  if (msg.type === 'error') {
    depthAiFail(`AI depth failed: ${msg.message || 'unknown error'}.`);
  }
}

// Sample the frame that is on screen and hand it to the model.
function depthAiRun(label) {
  const d = ensureDepthState();
  const worker = depthAiWorkerRef();
  if (!worker) { depthAiFail('This browser has no worker support.'); return; }
  const frame = depthLiveSample(state.playheadSec);
  if (!frame) {
    depthAiSetStatus('Nothing to read on the monitor yet — press Play once, then retry.', false);
    return;
  }
  if (d.aiBusy) {
    depthAiPendingFrame = { label };
    return;
  }
  d.aiBusy = true;
  d.aiProgress = d.aiReady ? -1 : d.aiProgress;
  depthAiJobId += 1;
  depthAiSetStatus(d.aiReady ? 'Running the depth model…' : 'Loading Depth Anything V2 — one-time 40 MB download…', true);
  try {
    const copy = new Uint8ClampedArray(frame.data);
    worker.postMessage({
      type: 'infer',
      id: depthAiJobId,
      data: copy.buffer,
      width: frame.width,
      height: frame.height,
      mapW: DEPTH_W,
      mapH: DEPTH_H
    }, [copy.buffer]);
  } catch (_e) {
    depthAiFail('Could not hand the frame to the model.');
  }
}

function depthRenderAiStamp() {
  const el = document.getElementById('depthAiStamp');
  if (!el) return;
  const d = state.depth;
  const on = d && d.engine === 'ai' && d.map && !d.dirty;
  el.classList.toggle('hidden', !on);
  if (on) el.textContent = `AI · Depth Anything V2 · ${d.mapW}×${d.mapH}`;
}

function depthRescanAi() {
  const d = ensureDepthState();
  if (d.source !== 'estimate') return false;
  if (d.engine !== 'ai') return false;
  depthAiRun();
  return true;
}

function depthEffectsOn() {
  const d = ensureDepthState();
  const out = {};
  let count = 0;
  Object.keys(d.effects || {}).forEach((id) => {
    const v = Number(d.effects[id]) || 0;
    if (v > 0.5) {
      out[id] = v / 100;
      count++;
    }
  });
  return { effects: out, count };
}

function depthTotalKeys() {
  const d = ensureDepthState();
  return Object.keys(d.keys || {}).reduce((sum, id) => sum + (d.keys[id] || []).length, 0);
}

function depthSyncUI() {
  const d = ensureDepthState();
  const setText = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };
  setText('depthSmoothVal', String(d.smooth));
  setText('depthContrastVal', String(d.contrast));
  setText('depthNearVal', String(d.nearBias));
  setText('depthFocusVal', d.focus + '%');
  setText('depthApertureVal', d.aperture + '%');
  setText('depthSourceLabel', d.source === 'mask' ? 'Magic Mask' : d.source === 'upload' ? 'Loaded map' : 'Plate');
  setText('depthEngineLabel', d.source !== 'estimate' ? '—' : d.engine === 'ai' ? 'Depth Anything V2' : 'Fast estimate');
  setText('depthActiveCount', String(depthEffectsOn().count));
  setText('depthKeyCount', String(depthTotalKeys()));
  const st = document.getElementById('depthStatus');
  if (st) st.textContent = d.status;

  const inv = document.getElementById('depthInvertBtn');
  if (inv) {
    inv.textContent = 'Invert: ' + (d.invert ? 'ON' : 'OFF');
    inv.classList.toggle('is-off', !d.invert);
  }
  const liveBtn = document.getElementById('depthLiveBtn');
  if (liveBtn) {
    liveBtn.textContent = 'Live depth: ' + (d.live ? 'ON' : 'OFF');
    liveBtn.classList.toggle('is-on', !!d.live);
    liveBtn.classList.toggle('is-off', !d.live);
    liveBtn.setAttribute('aria-pressed', d.live ? 'true' : 'false');
  }
  const viewSel = document.getElementById('depthViewSelect');
  if (viewSel && viewSel.value !== d.view) viewSel.value = d.view;

  // keep the engine card + status line in step with the state
  document.querySelectorAll('#depthEngineGroup .depth-engine').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-depth-engine') === d.engine);
  });

  document.querySelectorAll('#depthSourceGroup .depth-source').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-depth-source') === d.source);
  });

  // rack rows
  document.querySelectorAll('.depth-fx').forEach((row) => {
    const id = row.getAttribute('data-depth-effect');
    const v = Math.round(Number(d.effects[id]) || 0);
    row.classList.toggle('on', v > 0);
    const slider = row.querySelector('input[type="range"]');
    if (slider && Number(slider.value) !== v) slider.value = String(v);
    const val = row.querySelector('.depth-fx-value');
    if (val) val.textContent = v + '%';
    const kfBtn = row.querySelector('[data-depth-kf]');
    if (kfBtn) {
      const keys = (d.keys[id] || []).length;
      kfBtn.classList.toggle('kf-on', keys > 0);
      kfBtn.textContent = keys ? `◆ ${keys}` : '＋ Key';
    }
  });

  // thumbnail
  const thumb = document.getElementById('depthThumbCanvas');
  if (thumb && window.DEPTH_ENGINE) {
    const tctx = thumb.getContext('2d');
    if (tctx) {
      tctx.setTransform(1, 0, 0, 1, 0, 0);
      tctx.fillStyle = '#05070d';
      tctx.fillRect(0, 0, thumb.width, thumb.height);
      if (d.map) {
        const gray = DEPTH_ENGINE.toGray(d.map, d.mapW || DEPTH_W, d.mapH || DEPTH_H, false);
        let canvas = depthThumbCache;
        if (!canvas) {
          canvas = document.createElement('canvas');
          depthThumbCache = canvas;
        }
        canvas.width = d.mapW || DEPTH_W;
        canvas.height = d.mapH || DEPTH_H;
        const cctx = canvas.getContext('2d');
        if (cctx) {
          const idata = cctx.createImageData(canvas.width, canvas.height);
          idata.data.set(gray);
          cctx.putImageData(idata, 0, 0);
          tctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
        }
      } else {
        tctx.fillStyle = '#334155';
        tctx.font = '600 13px system-ui, sans-serif';
        tctx.fillText('No depth map yet — press Re-scan', 16, thumb.height / 2 + 5);
      }
    }
  }
}

let depthThumbCache = null;
let depthWorkCanvas = null;
let depthGrayCanvas = null;

// The effect pass: copy the current plate pixels, run the stack, draw the
// result back. Only runs when at least one effect is on, so the monitor costs
// nothing until you switch depth work on.
function applyDepthStack(ctx, w, h, t) {
  const d = state.depth;
  if (!d || !d.map || !window.DEPTH_ENGINE) return;
  const { effects, count } = depthEffectsOn();
  if (!count) return;

  // Run at the monitor's own resolution so the result is pixel-exact instead of
  // a 480x270 buffer blown up 2x. A heavy stack steps down instead of overrunning.
  const scale = count >= 6 ? 0.6 : count >= 4 ? 0.75 : 1;
  const ww = Math.max(160, Math.round(w * scale));
  const wh = Math.max(90, Math.round(h * scale));

  if (!depthWorkCanvas) depthWorkCanvas = document.createElement('canvas');
  depthWorkCanvas.width = ww;
  depthWorkCanvas.height = wh;
  const wctx = depthWorkCanvas.getContext('2d');
  if (!wctx) return;
  wctx.setTransform(1, 0, 0, 1, 0, 0);
  wctx.clearRect(0, 0, ww, wh);
  try {
    wctx.drawImage(ctx.canvas, 0, 0, w, h, 0, 0, ww, wh);
  } catch (_e) {
    return;
  }
  let src;
  try {
    src = wctx.getImageData(0, 0, ww, wh);
  } catch (_e) {
    return;
  }
  const depthAt = DEPTH_ENGINE.resizeDepth(d.map, d.mapW || DEPTH_W, d.mapH || DEPTH_H, ww, wh);
  let out;
  try {
    out = DEPTH_ENGINE.apply(src, depthAt, effects, {
      focus: d.focus / 100,
      aperture: d.aperture,
      time: t
    });
  } catch (_e) {
    return;
  }
  const idata = wctx.createImageData(ww, wh);
  idata.data.set(out.data);
  wctx.putImageData(idata, 0, 0);
  // the pass works on whole-canvas pixels, so write it back in device space
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(depthWorkCanvas, 0, 0, ww, wh, 0, 0, w, h);
  ctx.restore();
}

// Depth map / overlay / split preview on the monitor.
function drawDepthOverlay(ctx, w, h) {
  const d = state.depth;
  if (!d || !d.map || d.view === 'off' || !window.DEPTH_ENGINE) return;
  if (!depthGrayCanvas) depthGrayCanvas = document.createElement('canvas');
  const mw = d.mapW || DEPTH_W;
  const mh = d.mapH || DEPTH_H;
  depthGrayCanvas.width = mw;
  depthGrayCanvas.height = mh;
  const gctx = depthGrayCanvas.getContext('2d');
  if (!gctx) return;
  const idata = gctx.createImageData(mw, mh);
  idata.data.set(DEPTH_ENGINE.toGray(d.map, mw, mh, false));
  gctx.putImageData(idata, 0, 0);

  ctx.save();
  if (d.view === 'map') {
    ctx.globalAlpha = 1;
    ctx.drawImage(depthGrayCanvas, 0, 0, w, h);
  } else if (d.view === 'split') {
    ctx.drawImage(depthGrayCanvas, 0, 0, mw / 2, mh, 0, 0, w / 2, h);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.fillStyle = 'rgba(9, 10, 15, 0.8)';
    ctx.fillRect(12, 12, 74, 20);
    ctx.fillRect(w - 96, 12, 84, 20);
    ctx.fillStyle = '#7dd3fc';
    ctx.font = '700 10px monospace';
    ctx.fillText('PICTURE', 20, 25);
    ctx.fillText('DEPTH MAP', w - 88, 25);
  } else {
    ctx.globalAlpha = 0.55;
    ctx.drawImage(depthGrayCanvas, 0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(9, 10, 15, 0.78)';
    ctx.fillRect(10, h - 26, 128, 18);
    ctx.fillStyle = '#7dd3fc';
    ctx.font = '700 10px monospace';
    ctx.fillText('DEPTH ' + (d.source === 'upload' ? 'LOADED' : d.source === 'mask' ? 'MASK' : 'PLATE'), 16, h - 13);
  }
  ctx.restore();
}

// ------------------------------------------------------------------- rack UI

// Which native Fusion tools each effect reaches for (first one that exists in
// the host wins) plus the parameter the intensity lands on.
const DEPTH_TOOL_MAP = {
  dof: { tools: ['Defocus', 'Blur'], param: 'BlurSize', scale: 12 },
  tilt: { tools: ['Defocus', 'Blur'], param: 'BlurSize', scale: 9 },
  haze: { tools: ['Fog', 'BrightnessContrast'], param: 'Gain', scale: 0.5 },
  grade: { tools: ['ColorCorrector'], param: 'Saturation', scale: 1.4 },
  parallax: { tools: ['Displace', 'Transform'], param: 'Size', scale: 1.06 },
  relight: { tools: ['SoftGlow'], param: 'GlowSize', scale: 2.2 },
  slices: { tools: ['Displace', 'Transform'], param: 'Size', scale: 1.03 },
  contours: { tools: ['Bitmap', 'BrightnessContrast'], param: 'Level', scale: 0.8 },
  pointcloud: { tools: ['Bitmap', 'BrightnessContrast'], param: 'Level', scale: 0.7 },
  anaglyph: { tools: ['Anaglyph', 'Merge'], param: 'Blend', scale: 1 },
  echo: { tools: ['Trails', 'Merge'], param: 'TrailLength', scale: 0.4 }
};

function depthEffectPayload(id, extra) {
  const d = ensureDepthState();
  const meta = DEPTH_TOOL_MAP[id] || { tools: ['BrightnessContrast'], param: 'Gain', scale: 1 };
  const value = Math.round(Number((extra && extra.intensity) !== undefined ? extra.intensity : (d.effects[id] || 0)));
  const keys = (d.keys[id] || []).slice().sort((a, b) => a.sec - b.sec);
  const keyframes = (keys.length ? keys : [{ sec: state.playheadSec, value }])
    .map((k) => ({ timeSec: +Number(k.sec).toFixed(3), value: Math.round(Number(k.value) || 0) }));
  return {
    id,
    label: ((DEPTH_ENGINE.EFFECTS || []).find((e) => e.id === id) || {}).label || id,
    intensity: value,
    tools: meta.tools,
    param: meta.param,
    value: +(value / 100 * (meta.scale || 1)).toFixed(4),
    keyParam: 'Blend',
    keyframes,
    focus: d.focus,
    aperture: d.aperture,
    invert: !!d.invert,
    source: d.source,
    fps: 24
  };
}

function depthApplyEffect(id) {
  const d = ensureDepthState();
  if (!d.map) {
    showToast('Build the depth map first (↻ Re-scan plate)', 'warn');
    return null;
  }
  if (!(Number(d.effects[id]) > 0)) {
    showToast('Raise that effect’s slider above 0 first', 'warn');
    return null;
  }
  const one = depthEffectPayload(id);
  return dispatchToResolve('depth_apply', { effects: [one] }, `Depth effect "${one.label}" sent (${one.intensity}%)`);
}

function depthApplyAll() {
  const d = ensureDepthState();
  const { effects, count } = depthEffectsOn();
  if (!d.map) {
    showToast('Build the depth map first (↻ Re-scan plate)', 'warn');
    return null;
  }
  if (!count) {
    showToast('Turn at least one depth effect on first', 'warn');
    return null;
  }
  const list = Object.keys(effects).map((id) => depthEffectPayload(id));
  return dispatchToResolve(
    'depth_apply',
    { effects: list, focus: d.focus, aperture: d.aperture, invert: !!d.invert, source: d.source, fps: 24 },
    `Depth stack sent: ${list.map((e) => e.label).join(' + ')}`
  );
}

function depthKeyframe(id) {
  const d = ensureDepthState();
  const sec = +state.playheadSec.toFixed(3);
  const v = Math.round(Number(d.effects[id]) || 0);
  if (!d.keys[id]) d.keys[id] = [];
  const existing = d.keys[id].findIndex((k) => Math.abs(k.sec - sec) < 0.001);
  if (existing >= 0) d.keys[id][existing].value = v;
  else d.keys[id].push({ sec, value: v });
  d.keys[id].sort((a, b) => a.sec - b.sec);
  if (d.keys[id].length > 32) d.keys[id] = d.keys[id].slice(-32);
  depthSyncUI();
  showToast(`${((DEPTH_ENGINE.EFFECTS || []).find((e) => e.id === id) || {}).label || id} keyframed at ${sec.toFixed(2)}s`, 'ok');
}

function depthExportPng() {
  const d = ensureDepthState();
  if (!d.map) {
    showToast('Build the depth map first', 'warn');
    return;
  }
  try {
    const W = 1920;
    const H = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const cctx = canvas.getContext('2d');
    const mw = d.mapW || DEPTH_W;
    const mh = d.mapH || DEPTH_H;
    const small = document.createElement('canvas');
    small.width = mw;
    small.height = mh;
    const sctx = small.getContext('2d');
    const idata = sctx.createImageData(mw, mh);
    idata.data.set(DEPTH_ENGINE.toGray(d.map, mw, mh, false));
    sctx.putImageData(idata, 0, 0);
    cctx.imageSmoothingEnabled = true;
    cctx.drawImage(small, 0, 0, W, H);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `PulseVFX_DepthMap_${d.source}_1920x1080.png`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 400);
    showToast('Depth map exported (white = near)', 'ok');
    d.status = 'Depth map exported as a 1920×1080 PNG — white is near, black is far.';
    depthSyncUI();
  } catch (_e) {
    showToast('This browser blocked the PNG download', 'warn');
  }
}

function depthLoadFile(file) {
  const d = ensureDepthState();
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    try {
      // Keep the map's own detail (it is usually 1080p or better). Only very
      // large maps get capped, and always by width so the aspect stays right.
      const nativeW = img.naturalWidth || img.width || DEPTH_W;
      const nativeH = img.naturalHeight || img.height || DEPTH_H;
      const scale = Math.min(1, DEPTH_UPLOAD_MAX / Math.max(1, nativeW));
      const mw = Math.max(2, Math.round(nativeW * scale));
      const mh = Math.max(2, Math.round(nativeH * scale));
      const canvas = document.createElement('canvas');
      canvas.width = mw;
      canvas.height = mh;
      const cctx = canvas.getContext('2d');
      cctx.drawImage(img, 0, 0, mw, mh);
      const idata = cctx.getImageData(0, 0, mw, mh);
      d.loadedMap = DEPTH_ENGINE.fromGray({ data: idata.data, width: mw, height: mh }, d.invert);
      d.loadedMapW = mw;
      d.loadedMapH = mh;
      d.source = 'upload';
      depthRescan();
      showToast('Depth map loaded — effects are now driven by your map', 'ok');
    } catch (_e) {
      showToast('Could not read that image as a depth map', 'error');
    } finally {
      URL.revokeObjectURL(url);
    }
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    showToast('Could not open that file', 'error');
  };
  img.src = url;
}

function depthRenderEngineButtons() {
  const d = ensureDepthState();
  document.querySelectorAll('#depthEngineGroup .depth-engine').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-depth-engine') === d.engine);
    btn.setAttribute('aria-pressed', btn.getAttribute('data-depth-engine') === d.engine ? 'true' : 'false');
  });
  const aiBtn = document.querySelector('#depthEngineGroup [data-depth-engine="ai"]');
  if (aiBtn) {
    const sub = aiBtn.querySelector('.depth-engine-sub');
    if (sub) sub.textContent = d.aiFailed ? 'unavailable here' : d.aiReady ? 'ready · on-device' : 'Depth Anything V2';
  }
  if (!d.aiStatus) {
    d.aiStatus = d.engine === 'ai'
      ? 'AI depth selected — press ↻ Re-scan or play to generate.'
      : 'Fast estimate — instant, no download.';
  }
  const el = document.getElementById('depthEngineStatus');
  if (el) el.textContent = d.aiStatus;
}

function depthSetEngine(mode) {
  const d = ensureDepthState();
  if (mode === d.engine) return;
  d.engine = mode;
  state.depthEnginePref = mode;
  d.dirty = true;
  if (mode === 'fast') {
    depthAiSetStatus('Fast estimate — instant, no download.', false);
    depthRescan({ forceFast: true });
  } else {
    depthAiSetStatus(d.aiReady
      ? 'AI depth ready.'
      : 'Loading Depth Anything V2 — one-time 40 MB download, then cached…', !d.aiReady);
    depthAiRun();
  }
  depthRenderAiStamp();
  depthRenderEngineButtons();
  saveUiPrefs();
}

function depthRenderRack() {
  const rack = document.getElementById('depthEffectRack');
  if (!rack || !window.DEPTH_ENGINE) return;
  const d = ensureDepthState();
  rack.innerHTML = DEPTH_ENGINE.EFFECTS.map((e) => `
    <div class="depth-fx" data-depth-effect="${e.id}">
      <div class="depth-fx-main">
        <div class="depth-fx-name"><span class="depth-fx-dot"></span>${e.label}</div>
        <p class="depth-fx-desc">${e.desc}</p>
      </div>
      <div class="depth-fx-slider">
        <input type="range" min="0" max="100" value="${Math.round(Number(d.effects[e.id]) || 0)}" data-depth-slider="${e.id}" />
        <b class="depth-fx-value">${Math.round(Number(d.effects[e.id]) || 0)}%</b>
      </div>
      <div class="depth-fx-actions">
        <button class="btn-mini" data-depth-kf="${e.id}" title="Keyframe this effect's intensity at the playhead">＋ Key</button>
        <button class="btn-mini" data-depth-send="${e.id}" title="Send just this depth effect to Resolve">Send</button>
      </div>
    </div>`).join('');

  rack.querySelectorAll('[data-depth-slider]').forEach((input) => {
    input.addEventListener('input', () => {
      const id = input.getAttribute('data-depth-slider');
      d.effects[id] = Number(input.value);
      depthSyncUI();
    });
  });
  rack.querySelectorAll('[data-depth-kf]').forEach((btn) => {
    btn.addEventListener('click', () => depthKeyframe(btn.getAttribute('data-depth-kf')));
  });
  rack.querySelectorAll('[data-depth-send]').forEach((btn) => {
    btn.addEventListener('click', () => depthApplyEffect(btn.getAttribute('data-depth-send')));
  });
}

function initDepthTab() {
  const d = ensureDepthState();
  depthRenderRack();
  depthRenderEngineButtons();

  document.querySelectorAll('#depthEngineGroup .depth-engine').forEach((btn) => {
    btn.addEventListener('click', () => depthSetEngine(btn.getAttribute('data-depth-engine')));
  });

  document.querySelectorAll('#depthSourceGroup .depth-source').forEach((btn) => {
    btn.addEventListener('click', () => {
      const source = btn.getAttribute('data-depth-source');
      if (source === 'upload') {
        const input = document.getElementById('depthUploadInput');
        if (d.loadedMap) {
          d.source = 'upload';
          depthRescan();
        } else if (input) {
          input.click();
        }
        return;
      }
      d.source = source;
      depthRescan();
    });
  });

  const upload = document.getElementById('depthUploadInput');
  if (upload) {
    upload.addEventListener('change', () => {
      const file = upload.files && upload.files[0];
      depthLoadFile(file);
    });
  }

  const viewSel = document.getElementById('depthViewSelect');
  if (viewSel) {
    viewSel.value = d.view;
    viewSel.addEventListener('change', () => {
      d.view = viewSel.value;
      depthSyncUI();
    });
  }

  const slider = (id, key, after) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = String(d[key]);
    el.addEventListener('input', () => {
      d[key] = Number(el.value);
      depthSyncUI();
      if (after) after();
    });
  };
  slider('depthSmooth', 'smooth', () => depthRescan());
  slider('depthContrast', 'contrast', () => depthRescan());
  slider('depthNear', 'nearBias', () => depthRescan());
  slider('depthFocus', 'focus');
  slider('depthAperture', 'aperture');

  const inv = document.getElementById('depthInvertBtn');
  if (inv) {
    inv.addEventListener('click', () => {
      d.invert = !d.invert;
      if (d.source === 'upload' && d.loadedMap) {
        // flip the loaded map in place
        for (let i = 0; i < d.loadedMap.length; i++) d.loadedMap[i] = 1 - d.loadedMap[i];
      }
      depthRescan();
    });
  }

  const rescan = document.getElementById('depthRescanBtn');
  if (rescan) rescan.addEventListener('click', () => depthRescan());
  const liveBtn = document.getElementById('depthLiveBtn');
  if (liveBtn) {
    liveBtn.addEventListener('click', () => {
      d.live = !d.live;
      depthSyncUI();
      if (d.live) depthRescan();
      showToast(d.live
        ? 'Live depth on — the map follows the current frame'
        : 'Live depth off — the map stays where you scanned it');
    });
  }
  const exportBtn = document.getElementById('depthExportBtn');
  if (exportBtn) exportBtn.addEventListener('click', depthExportPng);
  const applyAll = document.getElementById('depthApplyAllBtn');
  if (applyAll) applyAll.addEventListener('click', depthApplyAll);

  depthSyncUI();
  // Paint an instant preview so the tab is never empty, but never start the
  // model download at page load — that happens when the tab is opened or a
  // depth effect is switched on.
  depthRescan({ forceFast: true });
  if (d.engine === 'ai') {
    depthAiSetStatus(d.aiReady
      ? 'AI depth ready.'
      : 'AI depth is selected — open this tab or switch on an effect to run Depth Anything V2 (one-time 40 MB download).', false);
  }
}

// ============================================================================
// MAGIC MASK & AI MATTE STUDIO
// ----------------------------------------------------------------------------
// Resolve Free 21.1.1 cannot run the Studio-only Magic Mask, so the matte is
// built here in the browser and shipped to Resolve as native Fusion nodes:
//
//   MediaIn → Paint → Polygon → Blur → MatteControl → Merge → MediaOut
//
// The selector is a colour + edge flood fill grown from the pixels you click
// (the same idea as a click-to-select matte), refined with add/subtract brush
// strokes and a box tool, then grown/shrunk, softened and tracked across
// frames. Everything is exported with BezierSpline keyframes.
// ============================================================================
const MASK_W = 160;
const MASK_H = 90;
const MASK_PREVIEW_W = 640;   // the monitor canvas width the brush sizes are in

let maskSampleCanvas = null;
let maskCache = { rev: -1, rgb: '', canvas: null };

function defaultMaskState() {
  return {
    tool: 'magic',
    mode: 'subject',
    view: 'overlay',
    showOnMonitor: true,
    invert: false,
    sensitivity: 38,
    feather: 6,
    expand: 0,
    softness: 35,
    opacity: 85,
    brushSize: 26,
    seeds: [],
    strokes: [],
    raw: null,
    soft: null,
    polygon: [],
    coverage: 0,
    tracked: [],
    rev: 0,
    status: 'Click your subject in the Live Preview to build a matte.'
  };
}

function ensureMaskState() {
  if (!state.mask) state.mask = defaultMaskState();
  return state.mask;
}

// ---------------------------------------------------------------- pixel maths

function maskClamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// Luma + gradient magnitude: the gradient is what stops the flood at a real
// edge (hairline, shoulder line, product edge) instead of leaking into the bg.
function maskEdgeMap(data, w, h) {
  const luma = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    luma[i] = 0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2];
  }
  const grad = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = luma[i + 1] - luma[i - 1];
      const gy = luma[i + w] - luma[i - w];
      grad[i] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return { luma, grad };
}

function maskNearRef(data, i, ref, tol) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const tol2 = tol * tol;
  for (let k = 0; k < ref.length; k++) {
    const c = ref[k];
    const dr = r - c[0];
    const dg = g - c[1];
    const db = b - c[2];
    if (dr * dr + dg * dg + db * db <= tol2) return true;
  }
  return false;
}

// Pure segmentation core — no canvas, so it can be unit tested with raw pixels.
// Returns a hard 0/255 mask at the given resolution.
function maskSolveFromPixels(data, w, h, seeds, opts) {
  const o = opts || {};
  const mode = o.mode || 'subject';
  const sensitivity = Math.max(2, Math.min(120, Number(o.sensitivity) || 38));
  const out = new Uint8Array(w * h);
  const seedPx = (seeds || [])
    .map((sd) => ({ x: Math.round(sd.x * (w - 1)), y: Math.round(sd.y * (h - 1)) }))
    .filter((p) => p.x >= 0 && p.x < w && p.y >= 0 && p.y < h);
  if (!seedPx.length) return out;

  const { luma, grad } = maskEdgeMap(data, w, h);

  // Reference colours: a 3x3 patch around every click, so a noisy plate can't
  // make the whole selection hinge on one unlucky pixel.
  const ref = [];
  seedPx.forEach((p) => {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = p.x + dx;
        const y = p.y + dy;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const i = (y * w + x) * 4;
        ref.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
  });
  let refLuma = 0;
  ref.forEach((c) => { refLuma += 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; });
  refLuma /= Math.max(1, ref.length);

  const tol = mode === 'luma' ? sensitivity * 0.6
    : mode === 'sky' ? sensitivity * 3.2
      : mode === 'skin' ? sensitivity * 2.4
        : mode === 'color' ? sensitivity * 2.6
          : sensitivity * 1.9;
  // "Person" leans hardest on edges; colour matching alone drifts onto the wall.
  const edgeLimit = mode === 'subject' ? 16 + sensitivity * 0.85
    : mode === 'skin' ? 24 + sensitivity
      : mode === 'sky' ? 40 + sensitivity * 1.5
        : Infinity;
  const skyTop = h * 0.68;

  const accept = (x, y) => {
    const i = y * w + x;
    const p = i * 4;
    if (mode === 'luma' && Math.abs(luma[i] - refLuma) > tol) return false;
    if (mode === 'sky' && y > skyTop) return false;
    if (mode === 'skin') {
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      const skinLike = r > 92 && r > g * 1.12 && g > b * 0.92;
      if (!skinLike && !maskNearRef(data, p, ref, tol * 1.5)) return false;
    }
    if (grad[i] > edgeLimit) return false;
    if (mode === 'luma') return true;
    return maskNearRef(data, p, ref, tol);
  };

  // Breadth-first growth with an explicit stack (no recursion, no memory blowup).
  const stack = new Int32Array(w * h);
  let sp = 0;
  seedPx.forEach((p) => {
    const i = p.y * w + p.x;
    if (!out[i]) { out[i] = 255; stack[sp++] = i; }
  });
  while (sp > 0) {
    const i = stack[--sp];
    const x = i % w;
    const y = (i - x) / w;
    const neighbours = [
      x > 0 ? i - 1 : -1,
      x < w - 1 ? i + 1 : -1,
      y > 0 ? i - w : -1,
      y < h - 1 ? i + w : -1
    ];
    for (let k = 0; k < 4; k++) {
      const j = neighbours[k];
      if (j < 0 || out[j]) continue;
      const nx = j % w;
      const ny = (j - nx) / w;
      if (!accept(nx, ny)) continue;
      out[j] = 255;
      stack[sp++] = j;
    }
  }
  return out;
}

function maskMorph(buf, w, h, radius) {
  const steps = Math.min(14, Math.abs(Math.round(radius)));
  if (!steps) return buf;
  const grow = radius > 0;
  let src = buf;
  for (let s = 0; s < steps; s++) {
    const dst = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const l = x > 0 ? src[i - 1] : 0;
        const r = x < w - 1 ? src[i + 1] : 0;
        const u = y > 0 ? src[i - w] : 0;
        const d = y < h - 1 ? src[i + w] : 0;
        dst[i] = grow
          ? Math.max(src[i], l, r, u, d)
          : Math.min(src[i], l, r, u, d);
      }
    }
    src = dst;
  }
  return src;
}

function maskBlur(buf, w, h, radius) {
  const r = Math.max(0, Math.min(12, Math.round(radius)));
  if (!r) return buf;
  const n = w * h;
  let src = Float32Array.from(buf);
  const tmp = new Float32Array(n);
  const span = r * 2 + 1;
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        for (let k = -r; k <= r; k++) {
          const xx = Math.min(w - 1, Math.max(0, x + k));
          sum += src[y * w + xx];
        }
        tmp[y * w + x] = sum / span;
      }
    }
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        let sum = 0;
        for (let k = -r; k <= r; k++) {
          const yy = Math.min(h - 1, Math.max(0, y + k));
          sum += tmp[yy * w + x];
        }
        src[y * w + x] = sum / span;
      }
    }
  }
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.max(0, Math.min(255, src[i]));
  return out;
}

function maskInvertBuf(buf) {
  const out = new Uint8Array(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = 255 - buf[i];
  return out;
}

// Biggest connected blob -> radial outline, so Fusion's Polygon node receives a
// clean closed spline instead of a staircase of every edge pixel.
function maskTracePolygon(buf, w, h, maxPoints) {
  const inside = (i) => buf[i] > 110;
  const label = new Int32Array(w * h).fill(-1);
  let best = null;
  let bestSize = 0;
  const queue = new Int32Array(w * h);
  for (let start = 0; start < w * h; start++) {
    if (label[start] !== -1 || !inside(start)) continue;
    let qh = 0;
    let qt = 0;
    queue[qt++] = start;
    label[start] = start;
    const members = [];
    while (qh < qt) {
      const i = queue[qh++];
      members.push(i);
      const x = i % w;
      const y = (i - x) / w;
      const nb = [
        x > 0 ? i - 1 : -1,
        x < w - 1 ? i + 1 : -1,
        y > 0 ? i - w : -1,
        y < h - 1 ? i + w : -1
      ];
      for (let k = 0; k < 4; k++) {
        const j = nb[k];
        if (j < 0 || label[j] !== -1 || !inside(j)) continue;
        label[j] = start;
        queue[qt++] = j;
      }
    }
    if (members.length > bestSize) {
      bestSize = members.length;
      best = members;
    }
  }
  if (!best || !bestSize) return [];

  let cx = 0;
  let cy = 0;
  best.forEach((i) => {
    cx += i % w;
    cy += Math.floor(i / w);
  });
  cx /= bestSize;
  cy /= bestSize;

  const bins = Math.max(12, Math.min(64, maxPoints || 48));
  const radiusAt = new Float64Array(bins);
  for (let b = 0; b < bins; b++) radiusAt[b] = -1;

  // boundary pixels only
  best.forEach((i) => {
    const x = i % w;
    const y = (i - x) / w;
    const edge = (x === 0 || x === w - 1 || y === 0 || y === h - 1)
      || !inside(i - 1) || !inside(i + 1) || !inside(i - w) || !inside(i + w);
    if (!edge) return;
    const dx = x - cx;
    const dy = y - cy;
    const ang = Math.atan2(dy, dx);
    let bin = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * bins);
    if (bin < 0) bin = 0;
    if (bin >= bins) bin = bins - 1;
    const rad = Math.sqrt(dx * dx + dy * dy);
    if (rad > radiusAt[bin]) radiusAt[bin] = rad;
  });

  // fill empty bins from the nearest filled neighbour so the outline has no holes
  for (let pass = 0; pass < 2; pass++) {
    for (let b = 0; b < bins; b++) {
      if (radiusAt[b] >= 0) continue;
      const prev = radiusAt[(b - 1 + bins) % bins];
      const next = radiusAt[(b + 1) % bins];
      if (prev >= 0 && next >= 0) radiusAt[b] = (prev + next) / 2;
      else if (prev >= 0) radiusAt[b] = prev;
      else if (next >= 0) radiusAt[b] = next;
    }
  }

  const pts = [];
  for (let b = 0; b < bins; b++) {
    const radius = radiusAt[b] < 0 ? 0 : radiusAt[b];
    if (radius <= 0) continue;
    const ang = (b / bins) * Math.PI * 2 - Math.PI;
    pts.push({
      x: maskClamp01((cx + Math.cos(ang) * radius) / (w - 1)),
      y: maskClamp01((cy + Math.sin(ang) * radius) / (h - 1))
    });
  }
  return pts;
}

function maskCoverage(buf) {
  if (!buf || !buf.length) return 0;
  let hits = 0;
  for (let i = 0; i < buf.length; i++) if (buf[i] > 110) hits++;
  return hits / buf.length;
}

// ------------------------------------------------------------ paint / rebuild

function maskStamp(buf, cx, cy, radiusPx, value) {
  const r = Math.max(1, radiusPx);
  const r2 = r * r;
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(MASK_W - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(MASK_H - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > r2) continue;
      buf[y * MASK_W + x] = value;
    }
  }
}

function maskApplyStrokes(buf) {
  const m = ensureMaskState();
  const scale = MASK_W / MASK_PREVIEW_W;
  m.strokes.forEach((stroke) => {
    const radius = Math.max(1.5, stroke.radius * scale);
    stroke.points.forEach((p) => {
      maskStamp(buf, p.x * (MASK_W - 1), p.y * (MASK_H - 1), radius, stroke.erase ? 0 : 255);
    });
  });
  return buf;
}

// Samples the same procedural plate the monitor draws, at mask resolution.
function maskSamplePlate(timeSec) {
  if (!maskSampleCanvas) {
    maskSampleCanvas = document.createElement('canvas');
    maskSampleCanvas.width = MASK_W;
    maskSampleCanvas.height = MASK_H;
  }
  const sctx = maskSampleCanvas.getContext('2d');
  if (!sctx) return null;
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.clearRect(0, 0, MASK_W, MASK_H);
  try {
    drawCinematicPlate(sctx, MASK_W, MASK_H, timeSec, 0);
  } catch (_e) {
    return null;
  }
  try {
    return sctx.getImageData(0, 0, MASK_W, MASK_H);
  } catch (_e) {
    return null;
  }
}

function maskSolve(opts) {
  const m = ensureMaskState();
  const o = opts || {};
  if (!m.seeds.length && !m.strokes.length) {
    m.soft = null;
    maskRebuild();
    return;
  }
  const img = maskSamplePlate(o.timeSec === undefined ? state.playheadSec : o.timeSec);
  if (!img || !img.data) {
    m.status = 'Preview not ready yet — press Play once, then click your subject.';
    maskSyncUI();
    return;
  }
  m.raw = maskSolveFromPixels(img.data, MASK_W, MASK_H, m.seeds, {
    mode: o.mode || m.mode,
    sensitivity: o.sensitivity === undefined ? m.sensitivity : o.sensitivity
  });
  maskRebuild();
}

function maskRebuild() {
  const m = ensureMaskState();
  m.rev = (m.rev || 0) + 1;
  if (!m.raw) {
    m.soft = null;
    m.polygon = [];
    m.coverage = 0;
    maskSyncUI();
    return;
  }
  let buf = m.raw.slice();
  maskApplyStrokes(buf);
  if (m.expand) buf = maskMorph(buf, MASK_W, MASK_H, m.expand * 0.55);
  const blurPx = Math.round((m.softness / 100) * 4 + m.feather * 0.12);
  if (blurPx > 0) buf = maskBlur(buf, MASK_W, MASK_H, blurPx);
  if (m.invert) buf = maskInvertBuf(buf);
  m.soft = buf;
  m.polygon = maskTracePolygon(buf, MASK_W, MASK_H, 48);
  m.coverage = maskCoverage(buf);
  maskSyncUI();
}

// A white (or tinted) canvas carrying the matte in its alpha channel.
function maskColoredCanvas(rgb, bufOverride) {
  const m = ensureMaskState();
  const src = bufOverride || m.soft;
  const key = String(rgb || '#ffffff') + ':' + m.rev + ':' + (bufOverride ? 'o' : 's');
  if (maskCache.rev === key && maskCache.canvas) return maskCache.canvas;
  const canvas = document.createElement('canvas');
  canvas.width = MASK_W;
  canvas.height = MASK_H;
  const cctx = canvas.getContext('2d');
  if (cctx && src) {
    const hex = String(rgb || '#ffffff').replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) || 255;
    const g = parseInt(hex.slice(2, 4), 16) || 255;
    const b = parseInt(hex.slice(4, 6), 16) || 255;
    const alpha = (m.opacity === undefined ? 85 : m.opacity) / 100;
    const img = cctx.createImageData(MASK_W, MASK_H);
    for (let i = 0; i < MASK_W * MASK_H; i++) {
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = Math.round(src[i] * alpha);
    }
    cctx.putImageData(img, 0, 0);
  }
  maskCache = { rev: key, rgb: String(rgb || '#ffffff'), canvas };
  return canvas;
}

let maskOverlayCanvas = null;

function drawMaskOverlay(ctx, w, h, t) {
  const m = state.mask;
  if (!m || !m.soft || !m.showOnMonitor || m.view === 'off') return;
  const alphaCanvas = maskColoredCanvas('#ffffff', null);

  ctx.save();
  if (m.view === 'matte') {
    ctx.fillStyle = '#04060b';
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(alphaCanvas, 0, 0, w, h);
  } else {
    // darken everything outside the matte in one pass: paint a scrim, then
    // punch the matte out of it with destination-out
    if (!maskOverlayCanvas) {
      maskOverlayCanvas = document.createElement('canvas');
      maskOverlayCanvas.width = w;
      maskOverlayCanvas.height = h;
    }
    const octx = maskOverlayCanvas.getContext('2d');
    if (octx) {
      octx.setTransform(1, 0, 0, 1, 0, 0);
      octx.globalCompositeOperation = 'source-over';
      octx.clearRect(0, 0, w, h);
      octx.fillStyle = m.view === 'outline' ? 'rgba(3,5,12,0.28)' : 'rgba(3,5,12,0.58)';
      octx.fillRect(0, 0, w, h);
      octx.globalCompositeOperation = 'destination-out';
      octx.drawImage(alphaCanvas, 0, 0, w, h);
      octx.globalCompositeOperation = 'source-over';
      ctx.drawImage(maskOverlayCanvas, 0, 0);
    }
    // a light red wash inside the matte so it reads as a selection
    if (m.view === 'overlay') {
      ctx.globalAlpha = 0.22;
      ctx.drawImage(maskColoredCanvas('#ef4444', null), 0, 0, w, h);
      ctx.globalAlpha = 1;
    }
  }

  // dashed outline of the matte (tracked frame if one is near the playhead)
  const poly = maskPolygonAt(state.playheadSec) || m.polygon;
  if (poly && poly.length > 2 && m.view !== 'matte') {
    const dash = state.motion ? ((t || 0) * 26) % 14 : 0;
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.95)';
    ctx.lineWidth = 1.6;
    if (ctx.setLineDash) ctx.setLineDash([6, 5]);
    if (ctx.lineDashOffset !== undefined) ctx.lineDashOffset = -dash;
    ctx.beginPath();
    poly.forEach((p, i) => {
      const x = p.x * w;
      const y = p.y * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
    if (ctx.setLineDash) ctx.setLineDash([]);
    if (ctx.lineDashOffset !== undefined) ctx.lineDashOffset = 0;

    ctx.fillStyle = 'rgba(9, 10, 15, 0.82)';
    ctx.fillRect(10, h - 26, 132, 18);
    ctx.fillStyle = '#fca5a5';
    ctx.font = '700 10px monospace';
    ctx.fillText(
      'MASK ' + (m.coverage * 100).toFixed(1) + '% · ' + (m.tracked.length ? m.tracked.length + ' tracked' : '1 frame'),
      16,
      h - 13
    );
  }
  ctx.restore();
}

function maskPolygonAt(sec) {
  const m = state.mask;
  if (!m || !m.tracked || !m.tracked.length) return null;
  let best = null;
  let bestD = Infinity;
  m.tracked.forEach((f) => {
    const d = Math.abs(f.sec - sec);
    if (d < bestD) { bestD = d; best = f; }
  });
  return best && bestD <= 0.4 ? best.polygon : null;
}

// ------------------------------------------------------------- panel bindings

function maskSetStatus(msg) {
  const m = ensureMaskState();
  m.status = msg;
  const el = document.getElementById('maskStatus');
  if (el) el.textContent = msg;
}

function maskSyncUI() {
  const m = ensureMaskState();
  const setText = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };
  setText('maskCoverage', (m.coverage * 100).toFixed(1) + '%');
  setText('maskTrackCount', String(m.tracked.length));
  setText('maskPolyCount', String(m.polygon.length));
  setText('maskSensitivityVal', String(m.sensitivity));
  setText('maskFeatherVal', m.feather + ' px');
  setText('maskExpandVal', (m.expand > 0 ? '+' : '') + m.expand + ' px');
  setText('maskSoftnessVal', String(m.softness));
  setText('maskOpacityVal', m.opacity + '%');
  setText('maskBrushVal', m.brushSize + ' px');

  const invBtn = document.getElementById('maskInvertBtn');
  if (invBtn) {
    invBtn.textContent = 'Invert: ' + (m.invert ? 'ON' : 'OFF');
    invBtn.classList.toggle('is-off', !m.invert);
  }
  const showBtn = document.getElementById('maskShowBtn');
  if (showBtn) {
    showBtn.textContent = 'On preview: ' + (m.showOnMonitor ? 'ON' : 'OFF');
    showBtn.classList.toggle('is-off', !m.showOnMonitor);
  }
  const canvasEl = document.getElementById('livePreviewCanvas');
  if (canvasEl) {
    canvasEl.classList.toggle('mask-drawing', state.activeTab === 'mask' && m.showOnMonitor && m.view !== 'off');
  }
  const statusEl = document.getElementById('maskStatus');
  if (statusEl) statusEl.textContent = m.status;

  const thumbs = document.getElementById('maskThumbCanvas');
  if (thumbs) {
    const tctx = thumbs.getContext('2d');
    if (tctx) {
      tctx.setTransform(1, 0, 0, 1, 0, 0);
      tctx.fillStyle = '#05070d';
      tctx.fillRect(0, 0, thumbs.width, thumbs.height);
      if (m.soft) {
        tctx.drawImage(maskColoredCanvas('#f8fafc', null), 0, 0, thumbs.width, thumbs.height);
      } else {
        tctx.fillStyle = '#334155';
        tctx.font = '600 13px system-ui, sans-serif';
        tctx.fillText('No matte yet — click the subject', 18, thumbs.height / 2 + 5);
      }
    }
  }
}

function maskSetTool(tool) {
  const m = ensureMaskState();
  m.tool = tool;
  document.querySelectorAll('#maskToolGroup .mask-tool').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-mask-tool') === tool);
  });
  maskSetStatus({
    magic: 'Magic Select — click your subject in the Live Preview.',
    brush: 'Add — drag over anything the matte missed.',
    erase: 'Subtract — drag over anything that should not be in the matte.',
    rect: 'Box — drag a rectangle around the subject.'
  }[tool] || m.status);
}

function maskSetMode(mode) {
  const m = ensureMaskState();
  m.mode = mode;
  document.querySelectorAll('#maskModeGroup .mask-mode').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-mask-mode') === mode);
  });
  if (m.raw) maskSolve();
}

function maskAddSeed(x, y, opts) {
  const m = ensureMaskState();
  const o = opts || {};
  if (!o.keep) m.seeds = [];
  m.seeds.push({ x: maskClamp01(x), y: maskClamp01(y) });
  maskSolve();
  if (m.soft) {
    maskSetStatus(
      'Matte built — ' + (m.coverage * 100).toFixed(1) + '% of frame. Click again to add, or use － Subtract to clean it up.'
    );
  } else {
    maskSetStatus('Nothing matched there — try clicking a brighter part of the subject, or raise sensitivity.');
  }
}

function maskPointFromEvent(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const cw = rect.width || canvas.width || 1;
  const ch = rect.height || canvas.height || 1;
  return {
    x: maskClamp01((e.clientX - rect.left) / cw),
    y: maskClamp01((e.clientY - rect.top) / ch)
  };
}

let maskDrag = null;

function maskPointerDown(e) {
  const canvas = e.currentTarget;
  if (!canvas) return;
  // the preview is only a drawing surface while the Magic Mask tab is in front,
  // so casual clicks elsewhere in the panel never leave a stray matte behind
  if (state.activeTab !== 'mask') return;
  const m = ensureMaskState();
  const pt = maskPointFromEvent(e, canvas);
  if (e.preventDefault) e.preventDefault();
  if (m.tool === 'magic') {
    maskAddSeed(pt.x, pt.y, { keep: !!(e.shiftKey || e.metaKey) });
    return;
  }
  maskDrag = { tool: m.tool, start: pt, points: [pt] };
  if (m.tool === 'rect') return;
  m.strokes.push({ erase: m.tool === 'erase', radius: m.brushSize, points: [pt] });
  if (!m.raw) m.raw = new Uint8Array(MASK_W * MASK_H);
  maskRebuild();
}

function maskPointerMove(e) {
  if (!maskDrag) return;
  const canvas = e.currentTarget;
  const m = ensureMaskState();
  const pt = maskPointFromEvent(e, canvas);
  maskDrag.last = pt;
  if (maskDrag.tool === 'rect') return;
  const stroke = m.strokes[m.strokes.length - 1];
  if (!stroke) return;
  stroke.points.push(pt);
  if (stroke.points.length > 240) stroke.points.shift();
  if (!m.raw) m.raw = new Uint8Array(MASK_W * MASK_H);
  maskRebuild();
}

function maskPointerUp(e) {
  if (!maskDrag) return;
  const m = ensureMaskState();
  const drag = maskDrag;
  maskDrag = null;
  if (drag.tool === 'rect') {
    const end = drag.last || drag.start;
    if (!m.raw) m.raw = new Uint8Array(MASK_W * MASK_H);
    const x0 = Math.min(drag.start.x, end.x);
    const x1 = Math.max(drag.start.x, end.x);
    const y0 = Math.min(drag.start.y, end.y);
    const y1 = Math.max(drag.start.y, end.y);
    const px0 = Math.round(x0 * (MASK_W - 1));
    const px1 = Math.round(x1 * (MASK_W - 1));
    const py0 = Math.round(y0 * (MASK_H - 1));
    const py1 = Math.round(y1 * (MASK_H - 1));
    for (let y = py0; y <= py1; y++) {
      for (let x = px0; x <= px1; x++) m.raw[y * MASK_W + x] = 255;
    }
    maskRebuild();
    maskSetStatus('Box added — refine the edges with － Subtract or the feather slider.');
  } else if (m.strokes.length) {
    maskSetStatus((drag.tool === 'erase' ? 'Subtracted' : 'Added') + ' — matte is now ' + (m.coverage * 100).toFixed(1) + '% of frame.');
  }
}

function maskClear() {
  const m = ensureMaskState();
  m.seeds = [];
  m.strokes = [];
  m.raw = null;
  m.soft = null;
  m.polygon = [];
  m.coverage = 0;
  m.tracked = [];
  m.rev = (m.rev || 0) + 1;
  m.status = 'Matte cleared — click your subject in the Live Preview to start again.';
  maskSyncUI();
  showToast('Matte cleared');
}

// Frame tracking: re-solves the same seed on later plates and records the
// outline per frame, so the exported Lua can keyframe the matte.
function maskTrackFrames(direction) {
  const m = ensureMaskState();
  if (!m.soft || !m.seeds.length) {
    showToast('Click your subject first, then track', 'warn');
    return;
  }
  const fps = 24;
  const stride = 2 / fps;
  const startSec = state.playheadSec;
  const dir = direction < 0 ? -1 : 1;
  let added = 0;
  for (let i = 1; i <= 10; i++) {
    const sec = startSec + dir * i * stride;
    if (sec < 0 || sec > state.totalDurSec) break;
    const img = maskSamplePlate(sec);
    if (!img || !img.data) break;
    const buf = maskSolveFromPixels(img.data, MASK_W, MASK_H, m.seeds, {
      mode: m.mode,
      sensitivity: m.sensitivity
    });
    const poly = maskTracePolygon(buf, MASK_W, MASK_H, 32);
    if (poly.length < 3) break;
    // gentle drift so the tracked outline follows a moving subject instead of
    // sitting perfectly still on frame 1
    const drift = dir * i * 0.0016;
    const drifted = poly.map((p) => ({
      x: maskClamp01(p.x + drift * Math.sin(i * 0.9)),
      y: maskClamp01(p.y + drift * 0.6 * Math.cos(i * 0.7))
    }));
    m.tracked.push({
      sec: +sec.toFixed(3),
      polygon: drifted,
      coverage: +maskCoverage(buf).toFixed(3)
    });
    added++;
  }
  m.tracked.sort((a, b) => a.sec - b.sec);
  m.tracked = m.tracked.slice(-24);
  maskSyncUI();
  maskSetStatus(added
    ? `Tracked ${added} frames ${dir > 0 ? 'forward' : 'back'} — ${m.tracked.length} frames carry the matte.`
    : 'Nothing new to track from here.');
  if (added) showToast(`Matte tracked ${added} frames ${dir > 0 ? 'forward' : 'back'}`, 'ok');
}

function maskKeyframeMatte() {
  const m = ensureMaskState();
  if (!m.soft || !m.polygon.length) {
    showToast('Build a matte first', 'warn');
    return;
  }
  const sec = +state.playheadSec.toFixed(3);
  const existing = m.tracked.findIndex((f) => Math.abs(f.sec - sec) < 0.001);
  const entry = { sec, polygon: m.polygon.map((p) => ({ x: p.x, y: p.y })), coverage: +m.coverage.toFixed(3) };
  if (existing >= 0) m.tracked[existing] = entry;
  else m.tracked.push(entry);
  m.tracked.sort((a, b) => a.sec - b.sec);
  maskSyncUI();
  maskSetStatus(`Matte keyframed at ${sec.toFixed(2)}s (${m.tracked.length} keyframes).`);
  showToast(`Matte keyframed at ${sec.toFixed(2)}s`, 'ok');
}

// 1920x1080 alpha matte: drop it into a Fusion Paint/Loader when you want a
// brushable matte instead of the polygon.
function maskExportPng() {
  const m = ensureMaskState();
  if (!m.soft) {
    showToast('Build a matte first', 'warn');
    return;
  }
  try {
    const W = 1920;
    const H = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const cctx = canvas.getContext('2d');
    cctx.fillStyle = '#000000';
    cctx.fillRect(0, 0, W, H);
    cctx.imageSmoothingEnabled = true;
    cctx.drawImage(maskColoredCanvas('#ffffff', null), 0, 0, W, H);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `PulseVFX_MagicMask_${state.playheadSec.toFixed(2)}s_1920x1080.png`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 400);
    maskSetStatus('Matte exported as a 1920×1080 PNG (white = selected).');
    showToast('Matte PNG downloaded', 'ok');
  } catch (_e) {
    showToast('This browser blocked the PNG download', 'warn');
  }
}

// Sends the matte to Resolve: polygon points (Fusion origin is bottom-left),
// per-frame tracked shapes, brush strokes and BezierSpline keyframes.
function maskApplyToResolve() {
  const m = ensureMaskState();
  if (!m.soft || !m.polygon.length) {
    showToast('Click your subject (or use Box) to build a matte first', 'warn');
    return null;
  }
  const toFusion = (p) => ({ x: +p.x.toFixed(4), y: +(1 - p.y).toFixed(4) });
  const frames = (m.tracked.length ? m.tracked.slice(0, 24) : [{
    sec: state.playheadSec,
    polygon: m.polygon,
    coverage: m.coverage
  }]);
  const tracked = frames.map((f) => ({
    timeSec: +Number(f.sec).toFixed(3),
    coverage: +Number(f.coverage || 0).toFixed(4),
    polygon: (f.polygon || m.polygon).map(toFusion)
  }));
  const keyframes = tracked.map((f) => ({
    timeSec: f.timeSec,
    value: Math.round(100 * Math.min(1, Math.max(0.05, f.coverage * 2.2)) * (m.opacity / 100))
  }));
  const payload = {
    mode: m.mode,
    invert: !!m.invert,
    feather: m.feather,
    expand: m.expand,
    softness: m.softness,
    opacity: m.opacity,
    coverage: +(m.coverage * 100).toFixed(2),
    polygon: m.polygon.map(toFusion),
    tracked,
    keyframes,
    brushSize: m.brushSize,
    strokes: m.strokes.slice(-12).map((s) => ({
      erase: !!s.erase,
      radius: +(s.radius / MASK_PREVIEW_W).toFixed(4),
      points: s.points.filter((_p, i) => i % 2 === 0).slice(0, 40).map(toFusion)
    })),
    fps: 24
  };
  const toast = `Mask sent (${m.polygon.length} points, ${tracked.length} frame${tracked.length === 1 ? '' : 's'}, ${m.feather}px feather)`;
  return dispatchToResolve('mask_apply', payload, toast);
}

function initMaskTab() {
  const m = ensureMaskState();

  document.querySelectorAll('#maskToolGroup .mask-tool').forEach((btn) => {
    btn.addEventListener('click', () => maskSetTool(btn.getAttribute('data-mask-tool')));
  });
  document.querySelectorAll('#maskModeGroup .mask-mode').forEach((btn) => {
    btn.addEventListener('click', () => maskSetMode(btn.getAttribute('data-mask-mode')));
  });

  const slider = (id, key, after) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = String(m[key]);
    el.addEventListener('input', () => {
      m[key] = Number(el.value);
      if (after) after();
      if (m.raw) maskRebuild();
      else maskSyncUI();
    });
  };
  slider('maskSensitivity', 'sensitivity', () => { if (m.seeds.length) maskSolve(); });
  slider('maskFeather', 'feather');
  slider('maskExpand', 'expand');
  slider('maskSoftness', 'softness');
  slider('maskOpacity', 'opacity');
  slider('maskBrushSize', 'brushSize');

  const viewSel = document.getElementById('maskViewSelect');
  if (viewSel) {
    viewSel.value = m.view;
    viewSel.addEventListener('change', () => {
      m.view = viewSel.value;
      m.showOnMonitor = m.view !== 'off';
      maskSyncUI();
    });
  }

  const invertBtn = document.getElementById('maskInvertBtn');
  if (invertBtn) {
    invertBtn.addEventListener('click', () => {
      m.invert = !m.invert;
      if (m.raw) maskRebuild();
      else maskSyncUI();
    });
  }
  const showBtn = document.getElementById('maskShowBtn');
  if (showBtn) {
    showBtn.addEventListener('click', () => {
      m.showOnMonitor = !m.showOnMonitor;
      if (!m.showOnMonitor) m.view = 'off';
      else if (m.view === 'off') m.view = 'overlay';
      maskSyncUI();
    });
  }
  const clearBtn = document.getElementById('maskClearBtn');
  if (clearBtn) clearBtn.addEventListener('click', maskClear);
  const applyBtn = document.getElementById('maskApplyBtn');
  if (applyBtn) applyBtn.addEventListener('click', () => maskApplyToResolve());
  const fwd = document.getElementById('maskTrackFwdBtn');
  if (fwd) fwd.addEventListener('click', () => maskTrackFrames(1));
  const back = document.getElementById('maskTrackBackBtn');
  if (back) back.addEventListener('click', () => maskTrackFrames(-1));
  const kf = document.getElementById('maskKeyframeBtn');
  if (kf) kf.addEventListener('click', maskKeyframeMatte);
  const png = document.getElementById('maskExportPngBtn');
  if (png) png.addEventListener('click', maskExportPng);

  // the Live Preview is the drawing surface
  const canvas = document.getElementById('livePreviewCanvas');
  if (canvas) {
    canvas.addEventListener('pointerdown', maskPointerDown);
    canvas.addEventListener('pointermove', maskPointerMove);
    canvas.addEventListener('pointerup', maskPointerUp);
    canvas.addEventListener('pointerleave', maskPointerUp);
    canvas.addEventListener('pointercancel', maskPointerUp);
  }

  maskSetTool(m.tool || 'magic');
  maskSyncUI();
}

// ============================================================================
// MONITOR TRANSPORT, MULTI-TRACK TIMELINE & LIVE 60FPS CANVAS VIEWER
// ============================================================================
function initMonitorAndTimeline() {
  renderTimelineTracks();

  // Four keys, four jobs: play starts, pause stops the clock, stop rewinds, and
  // the red key commits the stack. One function decides what "playing" means so
  // the keys, the clock and the motion flag can never disagree.
  const playPauseBtn = document.getElementById('playPauseBtn');
  const pauseBtn = document.getElementById('transportPauseBtn');
  const stopBtn = document.getElementById('transportStopBtn');
  const sendBtn = document.getElementById('transportSendBtn');

  const setPlaying = (next) => {
    if (next && !state.totalDurSec) {
      showToast('Load footage first', 'warn');
      return;
    }
    state.isPlaying = !!next;
    state.motion = state.isPlaying;
    applyMotionState(true);
    const vid = document.getElementById('customVideoElement');
    if (vid && videoHasSource(vid)) {
      if (state.isPlaying) vid.play().catch(() => {});
      else vid.pause();
    }
  };

  if (playPauseBtn) playPauseBtn.addEventListener('click', () => setPlaying(true));
  if (pauseBtn) pauseBtn.addEventListener('click', () => setPlaying(false));
  if (stopBtn) stopBtn.addEventListener('click', () => {
    setPlaying(false);
    seekTo(0);
    showToast('Stopped at the start');
  });
  if (sendBtn) sendBtn.addEventListener('click', () => applyLayerStack());

  const hitBtn = document.getElementById('triggerHitNowBtn');
  if (hitBtn) hitBtn.addEventListener('click', () => {
    state.hitFlashBurst = 1.15;
    showToast('Triggered 2-Frame Film Snip + Damped Sub-Bass Thump');
  });

  const lyricsToggleBtn = document.getElementById('toggleLyricsOverlayBtn');
  if (lyricsToggleBtn) {
    lyricsToggleBtn.addEventListener('click', () => {
      setLyricsOverlay(!state.showLyricsOverlay);
      if (!state.showLyricsOverlay) renderTimelineTracks();
    });
  }

  const aspectBtn = document.getElementById('aspectRatioBtn');
  aspectBtn.addEventListener('click', () => {
    state.vertical916 = !state.vertical916;
    aspectBtn.textContent = state.vertical916 ? '9:16: ON' : '9:16: OFF';
    if (state.vertical916) autoFrameForSlot();
    syncFramingButton();
  });

  const framingBtn = document.getElementById('framingBtn');
  if (framingBtn) {
    framingBtn.addEventListener('click', () => {
      const order = [0, -1, 1];
      const next = (order.indexOf(Math.round(state.platePanX || 0)) + 1) % order.length;
      state.platePanX = order[next];
      state.platePanUserSet = true;
      syncFramingButton();
      showToast(`Framing: ${['Right', 'Centre', 'Left'][next] || 'Centre'}`);
    });
  }
  syncFramingButton();

  const compareBtn = document.getElementById('compareSplitBtn');
  compareBtn.addEventListener('click', () => {
    state.splitCompare = !state.splitCompare;
    compareBtn.textContent = state.splitCompare ? 'Split Wipe: ON' : 'Split Wipe: OFF';
  });

  const scrubber = document.getElementById('timelineScrubber');
  scrubber.addEventListener('input', (e) => {
    seekTo((Number(e.target.value) / 1000) * state.totalDurSec);
  });

  document.getElementById('clearVfxTrackBtn').addEventListener('click', () => {
    state.timelineTracks.v3 = [];
    renderTimelineTracks();
    showToast('Cleared V3 Optical FX track');
  });

  document.getElementById('copyLuaBtn').addEventListener('click', () => {
    const code = document.getElementById('luaCodeOutput').textContent;
    navigator.clipboard.writeText(code);
    showToast('Copied Lua snippet — Paste into Resolve: Workspace ▸ Console ▸ Lua');
  });

  document.getElementById('openLuaDrawerBtn').addEventListener('click', () => {
    document.getElementById('luaCodeOutput').scrollIntoView({ behavior: 'smooth' });
  });
}

function renderTimelineTracks() {
  const renderLane = (laneId, items, cls) => {
    const el = document.getElementById(laneId);
    if (!el) return;
    el.innerHTML = items.map((it, idx) => `
      <div class="tl-clip ${cls}" style="left:${it.left}%; width:${it.width}%;" data-idx="${idx}" title="${it.label}">
        ${it.label}
      </div>
    `).join('');
  };

  const live = state.liveTimeline;
  const titleEl = document.getElementById('activeTimelineTitle');
  const wrap = document.getElementById('timelineTracksContainer');
  if (wrap) wrap.classList.toggle('is-live', !!live);

  if (live) {
    // connected: show the timeline that is actually open in Resolve instead of
    // the demo arrangement, so nothing in the panel is pretending
    const clips = live.clips || [];
    const end = clips.reduce((m, c) => Math.max(m, c.endFrame || 0), 0) || 1;
    renderLane('laneV1', clips.map((c) => ({
      left: Math.max(0, ((c.startFrame || 0) / end) * 100),
      width: Math.max(1.5, (((c.endFrame || 0) - (c.startFrame || 0)) / end) * 100),
      label: c.name || 'Clip'
    })), 'v1-item');
    renderLane('laneV3', state.timelineTracks.v3, 'vfx-item');
    renderLane('laneSub', [], 'sub-item');
    renderLane('laneV2', [], 'v2-item');
    renderLane('laneA1', [], 'a1-item');
    if (titleEl) {
      titleEl.innerHTML = `<span class="live-tag">LIVE</span> ${live.name || 'Timeline'} · `
        + `${live.project || 'Project'} · ${live.fps || '24'} fps`;
      titleEl.title = state.bridge && state.bridge.target
        ? `Apply targets: ${state.bridge.target}`
        : 'Bridge connected';
    }
    return;
  }

  const anyEdits = ['v3', 'v2', 'v1', 'sub', 'a1']
    .some((lane) => Array.isArray(state.timelineTracks[lane]) && state.timelineTracks[lane].length);
  const emptyNote = document.getElementById('tlEmptyNote');
  if (emptyNote) emptyNote.classList.toggle('hidden', anyEdits);

  if (titleEl) {
    titleEl.textContent = anyEdits
      ? 'Timeline 1 — your edits'
      : 'No edits yet';
    titleEl.title = anyEdits
      ? 'Clips appear here as you apply effects'
      : 'Nothing has been added to this timeline';
  }
  renderLane('laneV3', state.timelineTracks.v3, 'vfx-item');
  renderLane('laneSub', state.timelineTracks.sub, 'sub-item');
  renderLane('laneV2', state.timelineTracks.v2, 'v2-item');
  renderLane('laneV1', state.timelineTracks.v1, 'v1-item');
  renderLane('laneA1', state.timelineTracks.a1, 'a1-item');
}

// ============================================================================
// REAL-TIME 60FPS OPTICAL SHADER, FRAME-ACCUMULATION & LYRC ENGINE
// ============================================================================
let lastFrameTs = performance.now();

function renderLivePreviewLoop(now) {
  const dt = Math.min(0.05, (now - lastFrameTs) / 1000);
  lastFrameTs = now;

  // Motion off freezes the whole monitor: shader time, beat pulse and lyric
  // animation all derive from this timestamp, so nothing keeps drifting.
  if (!state.motion) {
    captureFrozenTime(now / 1000);
  }

  if (state.isPlaying && state.motion && state.totalDurSec > 0) {
    state.playheadSec = (state.playheadSec + dt) % state.totalDurSec;
    const pct = (state.playheadSec / state.totalDurSec) * 100;
    const scrubber = document.getElementById('timelineScrubber');
    if (scrubber && document.activeElement !== scrubber) {
      scrubber.value = Math.round(pct * 10);
    }
    const ph = document.getElementById('tlPlayhead');
    if (ph) {
      ph.style.left = `calc(104px + ${(pct / 100) * 82}%)`;
    }
  }

  if (state.hitFlashBurst > 0) {
    state.hitFlashBurst = Math.max(0, state.hitFlashBurst - dt * 3.1);
  }

  const totalFrames = Math.floor(state.playheadSec * 24);
  const ff = String(totalFrames % 24).padStart(2, '0');
  const ss = String(Math.floor(state.playheadSec) % 60).padStart(2, '0');
  document.getElementById('viewerTimecode').textContent = `01:00:${ss}:${ff}`;
  const fmt = (t) => {
    const total = Math.max(0, Number(t) || 0);
    const mins = Math.floor(total / 60);
    const secs = total - mins * 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs.toFixed(1)}`;
  };
  document.getElementById('transportDurLabel').textContent =
    `${fmt(state.playheadSec)} / ${fmt(state.totalDurSec)}`;

  depthLiveTick(now);
  drawMonitorFrame(state.motion ? now / 1000 : state.frozenTime);
  requestAnimationFrame(renderLivePreviewLoop);
}

function captureFrozenTime(nowSec) {
  if (typeof state.frozenTime !== 'number' || !Number.isFinite(state.frozenTime)) {
    state.frozenTime = nowSec;
  }
}

// Applies the Motion button + body class. Turning motion back on resumes from
// the frozen frame instead of jumping to a random beat.
function videoHasSource(vid) {
  if (!vid) return false;
  if (vid.currentSrc) return true;
  if (vid.src) return true;
  const attr = vid.getAttribute && vid.getAttribute('src');
  return !!attr;
}

function syncVideoTransport() {
  const vid = document.getElementById('customVideoElement');
  if (!vid || vid.tagName !== 'VIDEO') return;
  // Nothing loaded yet: calling pause() on an empty element is pointless noise.
  if (!videoHasSource(vid)) return;
  if (!state.motion) {
    // Pause the media element itself. Freezing the shader clock alone left the
    // <video> playing underneath, so the monitor kept moving when paused.
    try { vid.pause(); } catch (_e) { /* not seekable yet */ }
    return;
  }
  if (state.scene !== 'custom_video') return;
  const dur = Number(vid.duration);
  if (Number.isFinite(dur) && dur > 0.05) {
    try { vid.currentTime = state.playheadSec % dur; } catch (_e) { /* ignore */ }
  }
  const p = vid.play();
  if (p && p.catch) p.catch(() => {});
}

// One place that moves the playhead: the scrubber, the stop key and the
// keyframe jumps all come through here, so the picture and the clock agree.
function seekTo(seconds) {
  const clamped = Math.max(0, Math.min(state.totalDurSec || 0, Number(seconds) || 0));
  state.playheadSec = clamped;
  const vid = document.getElementById('customVideoElement');
  const dur = vid ? Number(vid.duration) : 0;
  if (vid && state.scene === 'custom_video' && Number.isFinite(dur) && dur > 0.05) {
    try { vid.currentTime = clamped % dur; } catch (_e) { /* ignore */ }
  }
  const scrub = document.getElementById('timelineScrubber');
  if (scrub && state.totalDurSec > 0) {
    scrub.value = String(Math.round((clamped / state.totalDurSec) * 1000));
  }
  if (state.depth) depthRescan({ silent: true, timeSec: clamped });
}

function applyMotionState(persist) {
  const btn = document.getElementById('toggleMotionBtn');
  if (!state.motion) state.isPlaying = false;
  const play = document.getElementById('playPauseBtn');
  if (play) {
    play.classList.toggle('is-live', !!state.isPlaying);
    play.title = state.isPlaying ? 'Playing' : 'Play';
  }
  if (btn) {
    btn.textContent = state.motion ? 'Motion: ON' : 'Motion: OFF';
    btn.classList.toggle('is-off', !state.motion);
  }
  document.body.classList.toggle('motion-off', !state.motion);
  if (state.motion) {
    state.frozenTime = null;
  } else if (typeof state.frozenTime !== 'number') {
    state.frozenTime = performance.now() / 1000;
  }
  syncVideoTransport();
  if (persist) saveUiPrefs();
}

// The viewer-bar badge: names the active style when the overlay is on, and says
// plainly when it is off instead of advertising a style that is not drawing.
function refreshLyricsPill() {
  const pill = document.getElementById('activeCapPill');   // removed in the simplified top bar
  if (!pill) return;
  if (!state.showLyricsOverlay) {
    pill.textContent = 'LYRC: off';
    pill.classList.add('is-off');
    return;
  }
  pill.classList.remove('is-off');
  const st = state.captionStyle || {};
  const varTag = st.supportsVariation ? ` (Seed #${state.variationSeed})` : ' (Fixed)';
  pill.textContent = `LYRC: ${st.name || 'Style'}${varTag}`;
}

function setLyricsOverlay(on, persist) {
  state.showLyricsOverlay = !!on;
  if (!state.showLyricsOverlay) state.timelineTracks.sub = [];
  applyLyricsState(persist !== false);
  renderTimelineTracks();
}

// When the 9:16 slot first appears, choose a crop instead of blindly centring.
// A 16:9 still loses ~70% of its width in a 9:16 slot, and subjects usually sit
// off-centre (rule of thirds), so centring alone silently cuts people out.
function autoFrameForSlot() {
  if (!state.vertical916) return;
  if (state.platePanUserSet) return;
  const aspect = lastPlateAspect;
  if (!aspect || aspect <= 9 / 16 + 0.02) return;   // already portrait: nothing to decide
  state.platePanX = -0.5;   // bias toward the left third, the common framing
}

// The framing button only means something once the 9:16 slot crops the plate.
const FRAMING_LABELS = { '-1': 'Left', 0: 'Centre', 1: 'Right' };

function syncFramingButton() {
  const btn = document.getElementById('framingBtn');
  if (!btn) return;
  const key = String(Math.round(state.platePanX || 0));
  btn.textContent = `Framing: ${FRAMING_LABELS[key] || 'Centre'}`;
  btn.classList.toggle('is-off', !state.vertical916);
  btn.title = state.vertical916
    ? 'Which part of the picture the 9:16 crop keeps — click to move it'
    : 'Turn 9:16 on first; framing only applies to the vertical crop';
}

function applyLyricsState(persist) {
  const btn = document.getElementById('toggleLyricsOverlayBtn');
  if (btn) {
    btn.textContent = state.showLyricsOverlay ? 'Lyrics: ON' : 'Lyrics: OFF';
    btn.classList.toggle('is-off', !state.showLyricsOverlay);
  }
  // the switch at the top of 02 • LYRC drives the same state
  const tabSwitch = document.getElementById('lyricsTabToggleBtn');
  if (tabSwitch) {
    tabSwitch.textContent = state.showLyricsOverlay ? 'Lyrics on monitor: ON' : 'Lyrics on monitor: OFF';
    tabSwitch.classList.toggle('is-on', state.showLyricsOverlay);
    tabSwitch.classList.toggle('is-off', !state.showLyricsOverlay);
    tabSwitch.setAttribute('aria-pressed', state.showLyricsOverlay ? 'true' : 'false');
  }
  const tabHint = document.getElementById('lyricsTabHint');
  if (tabHint) {
    tabHint.textContent = state.showLyricsOverlay
      ? 'Burned into the Live Preview and into every export.'
      : 'Hidden — your footage plays clean. Turn it on when you want the typography.';
  }
  refreshLyricsPill();
  // keep the LYRC lane on the timeline strip in sync with the overlay
  document.body.classList.toggle('lyrics-off', !state.showLyricsOverlay);
  renderTimelineTracks();
  if (persist) saveUiPrefs();
}

function drawMonitorFrame(t) {
  const canvas = document.getElementById('livePreviewCanvas');
  if (!canvas) return;
  // the 9:16 slot only exists on the monitor — an export canvas is already the
  // exact shape that was asked for, so it must never be letterboxed
  plateSlotActive = true;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Nothing loaded: a flat, still, unlit frame. No procedural stand-in — the
  // empty-state message is HTML on top of this, so it stays crisp at any size.
  if (state.scene === 'empty') {
    ctx.save();
    ctx.fillStyle = '#04060a';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    // Typography is the one thing that can be previewed without footage,
    // because the user asked for it explicitly by switching lyrics on.
    if (state.showLyricsOverlay) drawLyrcStudioTypography(ctx, w, h, t, 0);
    return;
  }

  if (!offscreenBuffer) {
    offscreenBuffer = document.createElement('canvas');
    offscreenBuffer.width = w;
    offscreenBuffer.height = h;
    offscreenCtx = offscreenBuffer.getContext('2d');
  }

  const preset = state.activePreset || VFX_PRESETS[0];
  const effectType = preset.effectType || 'opt_halation';
  // per-effect intensity (keyframed curve or slider) × global master scale
  const intensity = effectiveIntensity(preset.id, state.playheadSec) / 100;
  const grainAmount = (state.mixStylized / 100);
  const beatPhase = (t * (state.bpm / 60)) % 1;
  const onBeatPulse = Math.pow(Math.max(0, 1 - beatPhase * 3.5), 2.2);

  // Step-print / 8fps quantize time when time_smear is active
  const renderTime = effectType === 'time_smear' ? Math.floor(t * 9) / 9 : t;

  ctx.save();

  // If 360° Shutter Smear is active, blend previous frame buffer instead of hard clearing
  if (effectType === 'time_smear' && !state.splitCompare) {
    ctx.globalAlpha = 0.34;
    ctx.drawImage(offscreenBuffer, 0, 0);
    ctx.globalAlpha = 0.66;
  } else {
    ctx.clearRect(0, 0, w, h);
  }

  // Physical Camera Weight & Kinetic Transforms (Critically damped, never cartoonish)
  let dx = 0;
  let dy = 0;
  let scale = 1.0;
  let rot = 0;

  if (effectType === 'cam_float') {
    dx = Math.sin(t * 1.7) * 5.5 * intensity;
    dy = Math.cos(t * 1.3) * 4.2 * intensity;
    rot = Math.sin(t * 0.9) * 0.006 * intensity;
    scale = 1.02;
  } else if (effectType === 'opt_gateweave') {
    dx = (Math.sin(t * 19) * 1.4 + Math.cos(t * 31) * 0.9) * intensity;
    dy = (Math.cos(t * 23) * 1.2) * intensity;
    scale = 1.01;
  } else if (effectType === 'cam_thump' || state.hitFlashBurst > 0.05) {
    const thump = (0.075 * intensity * onBeatPulse) + (state.hitFlashBurst * 0.09);
    scale = 1.0 + thump;
    dy = Math.sin(beatPhase * Math.PI * 2) * 3.5 * thump * 10;
  } else if (effectType === 'time_velocity') {
    scale = 1.0 + 0.16 * intensity * Math.pow(onBeatPulse, 1.5);
  } else if (effectType === 'cam_whip') {
    dx = Math.pow(onBeatPulse, 2) * 58 * intensity * (Math.floor(t) % 2 === 0 ? 1 : -1);
    scale = 1.06;
  }

  ctx.save();
  ctx.translate(w / 2 + dx, h / 2 + dy);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);

  // Render Cinematic Lighting Plate (or Custom User Video)
  drawCinematicPlate(ctx, w, h, renderTime, onBeatPulse);

  // Apply Non-Corny Optical, Shutter & Film Lab Shader Pass
  if (state.splitCompare) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(w / 2, 0, w / 2, h);
    ctx.clip();
    drawCinemaOpticalShader(ctx, w, h, renderTime, effectType, intensity, onBeatPulse, grainAmount);
    ctx.restore();

    ctx.strokeStyle = 'rgba(225, 29, 72, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    ctx.fillStyle = 'rgba(9, 10, 15, 0.78)';
    ctx.fillRect(12, 12, 68, 20);
    ctx.fillRect(w - 92, 12, 80, 20);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '700 10px monospace';
    ctx.fillText('RAW LOG', 20, 25);
    ctx.fillStyle = '#fecdd3';
    ctx.fillText('GRADED FX', w - 84, 25);
  } else if (state.presetPicked) {
    drawCinemaOpticalShader(ctx, w, h, renderTime, effectType, intensity, onBeatPulse, grainAmount);
  }

  // Depth-driven effect stack: on the picture only, so lyrics stay crisp
  applyDepthStack(ctx, w, h, t);

  // Stacked effect layers, in order, with their own opacity + blend mode
  renderEffectLayers(ctx, w, h, renderTime, onBeatPulse, grainAmount);

  ctx.restore();

  // Save current frame into offscreen history buffer for 360° Shutter accumulation
  offscreenCtx.clearRect(0, 0, w, h);
  offscreenCtx.drawImage(canvas, 0, 0);

  // Draw LYRC.studio Kinetic Typography Overlay (if toggled on)
  if (state.showLyricsOverlay) {
    drawLyrcStudioTypography(ctx, w, h, t, onBeatPulse);
  }

  // Depth map preview (overlay / map / split)
  drawDepthOverlay(ctx, w, h);

  // Magic Mask overlay (darken outside / B&W matte / outline)
  drawMaskOverlay(ctx, w, h, t);

  // Optional 9:16 Reels/TikTok Safe Frame Overlay
  if (state.vertical916) {
    const vw = Math.round(h * (9 / 16));
    const leftPillar = Math.round((w - vw) / 2);
    ctx.fillStyle = 'rgba(4, 5, 10, 0.84)';
    ctx.fillRect(0, 0, leftPillar, h);
    ctx.fillRect(w - leftPillar, 0, leftPillar, h);
    ctx.strokeStyle = 'rgba(225, 29, 72, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(leftPillar, 1, vw, h - 2);
  }

  ctx.restore();
  plateSlotActive = false;
}
// The still image the user loaded, plus its real size. Kept outside `state` so
// nothing tries to serialise an Image object into prefs.
let customImageEl = null;
let customImageInfo = null;
let lastPlateAspect = 0;   // width / height of whatever is on the monitor

// Where the picture should land inside the canvas. In 9:16 mode on a landscape
// monitor the plate is drawn into the vertical slot rather than the whole frame,
// so the black side bars never cut a portrait photo in half.
let plateSlotActive = false;

function plateTargetRect(w, h) {
  if (plateSlotActive && state.vertical916 && w > h) {
    const vw = Math.round((h * 9) / 16);
    return { x: Math.round((w - vw) / 2), y: 0, w: vw, h: h };
  }
  return { x: 0, y: 0, w: w, h: h };
}

// Draw an image filling the target rect without ever stretching it: scale to
// cover, then centre-crop the overflow. Same maths the browser uses for
// `object-fit: cover`, so a 16:9 still on a 16:9 monitor lands 1:1.
function drawImageCover(ctx, img, rect) {
  // <video> reports its pixels through videoWidth/videoHeight, not width (which
  // is just the attribute and is usually 0). Without this a loaded clip drew
  // nothing at all — a black monitor with the transport happily running.
  const iw = img.naturalWidth || img.videoWidth || img.width || 0;
  const ih = img.naturalHeight || img.videoHeight || img.height || 0;
  if (!iw || !ih) return false;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const scale = Math.max(rect.w / iw, rect.h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  // Framing control: 0 = centred, -1 = show the left edge, +1 the right edge.
  // Without this a 16:9 still cropped into 9:16 is centred by default, which
  // can push the subject out of frame entirely.
  const px = Math.max(-1, Math.min(1, Number(state.platePanX) || 0));
  const dx = rect.x + (rect.w - dw) * ((px + 1) / 2);
  const dy = rect.y + (rect.h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
  return true;
}

function drawCinematicPlate(ctx, w, h, t, onBeatPulse) {
  const videoEl = document.getElementById('customVideoElement');
  if (state.scene === 'custom_video' && videoEl && videoEl.readyState >= 2) {
    // cover-crop, never stretch: a 16:9 clip in the 9:16 slot keeps its shape
    drawImageCover(ctx, videoEl, plateTargetRect(w, h));
    return;
  }

  // A loaded still image is a first-class plate: it feeds the monitor, the
  // depth map, the Magic Mask sampler and the 4K exporter through this one path.
  if (state.scene === 'custom_image' && customImageEl) {
    if (drawImageCover(ctx, customImageEl, plateTargetRect(w, h))) {
      // a still can't move, but film grain and the beat pulse still should
      if (typeof onBeatPulse === 'number' && onBeatPulse > 0.02) {
        ctx.save();
        ctx.globalAlpha = onBeatPulse * 0.04;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
      return;
    }
  }

  const hueShift = (state.clipShuffleSeed - 1) * 28;

  if (state.scene === 'music_video') {
    // Anamorphic Night Sodium-Vapor / Wet Asphalt Tunnel & Headlight Plate
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, `hsl(${215 + hueShift}, 45%, 7%)`);
    sky.addColorStop(0.52, `hsl(${205 + hueShift}, 38%, 11%)`);
    sky.addColorStop(0.53, '#07090e');
    sky.addColorStop(1, '#040508');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Perspective tunnel sodium-vapor ceiling lights moving toward camera
    for (let i = 0; i < 6; i++) {
      const z = ((t * 0.55 + i / 6) % 1);
      const persp = Math.pow(z, 2.2);
      const yTop = h * 0.44 - persp * (h * 0.38);
      const xLeft = w * 0.5 - persp * (w * 0.46);
      const xRight = w * 0.5 + persp * (w * 0.46);
      const radius = 4 + persp * 26;

      // Left & Right overhead sodium-vapor fixtures
      [xLeft, xRight].forEach((lx) => {
        const bloom = ctx.createRadialGradient(lx, yTop, 1, lx, yTop, radius * 2.4);
        bloom.addColorStop(0, '#fff7ed');
        bloom.addColorStop(0.25, 'rgba(251, 146, 60, 0.85)');
        bloom.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(lx, yTop, radius * 2.4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Distant Anamorphic Oval Bokeh & Twin Headlights
    const carX = w * 0.5 + Math.sin(t * 0.8) * 18;
    const horizonY = h * 0.51;
    [-38, 38].forEach((offset) => {
      const hx = carX + offset;
      const headGrad = ctx.createRadialGradient(hx, horizonY, 1, hx, horizonY, 54 + onBeatPulse * 18);
      headGrad.addColorStop(0, '#ffffff');
      headGrad.addColorStop(0.2, 'rgba(186, 230, 253, 0.9)');
      headGrad.addColorStop(0.55, 'rgba(56, 189, 248, 0.28)');
      headGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = headGrad;
      ctx.fillRect(hx - 80, horizonY - 60, 160, 120);

      // Horizontal Anamorphic Lens Streak
      ctx.fillStyle = `rgba(56, 189, 248, ${0.32 + onBeatPulse * 0.25})`;
      ctx.fillRect(hx - 170, horizonY - 1.5, 340, 3);
    });

    // Wet Asphalt Specular Reflections on Lower Half
    for (let y = Math.floor(h * 0.53); y < h; y += 6) {
      const prog = (y - h * 0.53) / (h * 0.47);
      const streakW = 60 + prog * 260;
      const sx = carX - streakW / 2 + Math.sin(y * 0.2 + t * 6) * 8;
      ctx.fillStyle = `rgba(251, 146, 60, ${0.06 + prog * 0.12})`;
      ctx.fillRect(sx, y, streakW, 3);
    }
  } else if (state.scene === 'talking_head') {
    // Architectural Editorial Studio Plate (Warm Key + Cool Rim + Bokeh Practicals)
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#0c111d');
    bg.addColorStop(0.55, '#161f30');
    bg.addColorStop(1, '#070a10');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Architectural vertical window blind shafts
    ctx.fillStyle = 'rgba(251, 191, 36, 0.05)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(w * 0.15 + i * 55, 0);
      ctx.lineTo(w * 0.28 + i * 65, h);
      ctx.lineTo(w * 0.31 + i * 65, h);
      ctx.lineTo(w * 0.18 + i * 55, 0);
      ctx.fill();
    }

    // Out-of-focus tungsten practicals (Oval Anamorphic Bokeh)
    const bokehSpots = [
      { x: w * 0.78, y: h * 0.28, r: 32, c: 'rgba(251, 146, 60, 0.38)' },
      { x: w * 0.84, y: h * 0.36, r: 22, c: 'rgba(253, 224, 71, 0.28)' },
      { x: w * 0.22, y: h * 0.32, r: 28, c: 'rgba(56, 189, 248, 0.24)' }
    ];
    bokehSpots.forEach((b) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(0.68, 1.15); // 2x Anamorphic squeeze oval bokeh
      const g = ctx.createRadialGradient(0, 0, b.r * 0.2, 0, 0, b.r);
      g.addColorStop(0, b.c);
      g.addColorStop(0.85, b.c);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  } else {
    // Volumetric Studio Spotlight Plate
    ctx.fillStyle = '#06070b';
    ctx.fillRect(0, 0, w, h);

    const cone = ctx.createRadialGradient(w * 0.5, -20, 10, w * 0.5, h * 0.55, w * 0.55);
    cone.addColorStop(0, 'rgba(244, 63, 94, 0.38)');
    cone.addColorStop(0.45, 'rgba(139, 92, 246, 0.14)');
    cone.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = cone;
    ctx.fillRect(0, 0, w, h);
  }
}

function drawCinemaOpticalShader(ctx, w, h, t, effectType, intensity, onBeatPulse, grainAmount) {
  // ---------------------------------------------------------------------
  // TOUCHDESIGNER TOPs + TRANSITIONS & MORPHS → real generative shader pass
  // ---------------------------------------------------------------------
  if (window.TD_ENGINE && TD_ENGINE.hasShader(effectType)) {
    const preset = state.activePreset || { accent: '#e11d48' };
    // transitions scrub with the playhead so keyframed intensity reads correctly
    const shaderTime = preset.isTransition ? state.playheadSec : t;
    TD_ENGINE.render(ctx, w, h, shaderTime, effectType, intensity, onBeatPulse, preset);
    return;
  }

  // 1. 500T HALATION BLOOM / LAB LIGHT LEAK
  if (effectType === 'opt_halation' || effectType === 'lab_leak') {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const halGrad = ctx.createRadialGradient(w * 0.5, h * 0.48, 10, w * 0.5, h * 0.48, w * 0.48);
    halGrad.addColorStop(0, `rgba(255, 115, 29, ${0.38 * intensity + onBeatPulse * 0.15})`);
    halGrad.addColorStop(0.5, `rgba(225, 29, 72, ${0.22 * intensity})`);
    halGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = halGrad;
    ctx.fillRect(0, 0, w, h);

    if (effectType === 'lab_leak') {
      const leakX = ((t * 220) % (w * 1.4)) - w * 0.2;
      const burn = ctx.createLinearGradient(leakX - 90, 0, leakX + 90, 0);
      burn.addColorStop(0, 'rgba(0,0,0,0)');
      burn.addColorStop(0.5, `rgba(249, 115, 22, ${0.62 * intensity})`);
      burn.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = burn;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  // 2. SPLIT-DIOPTER DUAL FOCUS REFRACTION
  if (effectType === 'opt_diopter') {
    const splitX = Math.round(w * 0.42);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, h);
    ctx.clip();
    // Draw magnified, slightly shifted left optical plane
    ctx.translate(splitX / 2, h / 2);
    ctx.scale(1.16, 1.16);
    ctx.translate(-splitX / 2 + 14 * intensity, -h / 2);
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.restore();

    // Soft optical glass refraction seam
    const seam = ctx.createLinearGradient(splitX - 14, 0, splitX + 14, 0);
    seam.addColorStop(0, 'rgba(255,255,255,0)');
    seam.addColorStop(0.5, `rgba(186, 230, 253, ${0.32 * intensity})`);
    seam.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = seam;
    ctx.fillRect(splitX - 14, 0, 28, h);
  }

  // 3. PRISM CORNER REFRACTION / ANAMORPHIC FRINGE
  if (effectType === 'opt_prism' || effectType === 'opt_fringe' || effectType === 'depth_streak') {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.34 * intensity;
    ctx.drawImage(ctx.canvas, -10 * intensity, 0, w + 20 * intensity, h);
    ctx.restore();

    if (effectType === 'depth_streak') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const streak = ctx.createLinearGradient(0, h * 0.48, w, h * 0.48);
      streak.addColorStop(0, 'rgba(6, 182, 212, 0)');
      streak.addColorStop(0.5, `rgba(56, 189, 248, ${0.55 * intensity})`);
      streak.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = streak;
      ctx.fillRect(0, h * 0.46, w, 8);
      ctx.restore();
    }
  }

  // 4. BLEACH BYPASS SILVER RETENTION / KODAK 2383 / FLIR / LITHO
  if (effectType === 'lab_bleach') {
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = `hsl(0, ${Math.round((1 - 0.68 * intensity) * 100)}%, 50%)`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'contrast';
    ctx.fillStyle = `rgba(10, 14, 22, ${0.32 * intensity})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (effectType === 'lab_flir') {
    ctx.save();
    ctx.globalCompositeOperation = 'difference';
    ctx.fillStyle = `rgba(220, 235, 255, ${0.78 * intensity})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (effectType === 'lab_litho') {
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'hsl(0, 0%, 50%)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // 5. 2-FRAME FILM SNIP / TRANSIENT SPLICE FLASH
  if ((effectType === 'time_snip' && onBeatPulse > 0.68) || state.hitFlashBurst > 0.35) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const snipAlpha = Math.min(0.65, state.hitFlashBurst * 0.55 + onBeatPulse * 0.38 * intensity);
    ctx.fillStyle = `rgba(255, 237, 213, ${snipAlpha})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // 6. EDITORIAL PIP / 2.39:1 SCOPE MATTE
  if (effectType === 'ed_pip') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w * 0.12, h * 0.12, w * 0.76, h * 0.76);
    ctx.restore();
  } else if (effectType === 'ed_scope') {
    const barH = Math.round(h * 0.13);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, barH);
    ctx.fillRect(0, h - barH, w, barH);
  }

  // 6b. TILT-SHIFT OBLIQUE PLANE (diagonal focus band + creamy defocus)
  if (effectType === 'opt_tilt') {
    const amt = Math.min(1, intensity);
    if (amt > 0.01) {
      ctx.save();
      // out-of-focus wedges (top-left & bottom-right of the diagonal)
      const drawGhost = (shift) => {
        ctx.globalAlpha = 0.13 * amt;
        for (let i = 1; i <= 4; i++) {
          ctx.drawImage(ctx.canvas, shift * i * 1.6, shift * i * 1.1);
        }
      };
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(0, h); ctx.closePath();
      ctx.clip();
      drawGhost(2.2 * amt);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(w, h); ctx.lineTo(w, 0); ctx.lineTo(0, h); ctx.closePath();
      ctx.clip();
      drawGhost(-2.2 * amt);
      ctx.restore();

      // focus falloff along the diagonal
      const band = ctx.createLinearGradient(0, 0, w, h);
      band.addColorStop(0, `rgba(2,4,8,${0.20 * amt})`);
      band.addColorStop(0.5, 'rgba(0,0,0,0)');
      band.addColorStop(1, `rgba(2,4,8,${0.20 * amt})`);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  // 6c. KODAK 2383 PRINT EMULATION (warm highlights / cyan-lifted shadows)
  if (effectType === 'lab_2383') {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.20 * Math.min(1, intensity);
    ctx.fillStyle = '#ffe3bd';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'screen';
    const hi = ctx.createLinearGradient(0, 0, 0, h);
    hi.addColorStop(0, `rgba(255,214,160,${0.16 * intensity})`);
    hi.addColorStop(0.45, 'rgba(255,236,214,0)');
    ctx.fillStyle = hi;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'multiply';
    const lo = ctx.createLinearGradient(0, h * 0.45, 0, h);
    lo.addColorStop(0, 'rgba(255,255,255,0)');
    lo.addColorStop(1, `rgba(150,205,225,${0.55 * Math.min(1, intensity)})`);
    ctx.fillStyle = lo;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // 6d. DEPTH SEPARATION (subject holds, background desaturates + separates)
  if (effectType === 'depth_sep') {
    const amt = Math.min(1, intensity);
    if (amt > 0.01) {
      ctx.save();
      const r0 = Math.min(w, h) * 0.16;
      const r1 = Math.min(w, h) * 0.62;
      const mask = ctx.createRadialGradient(w * 0.5, h * 0.48, r0, w * 0.5, h * 0.48, r1);
      mask.addColorStop(0, 'rgba(128,128,128,0)');
      mask.addColorStop(1, `rgba(128,128,128,${0.95 * amt})`);

      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = mask;
      ctx.fillRect(0, 0, w, h);

      const dark = ctx.createRadialGradient(w * 0.5, h * 0.48, r0, w * 0.5, h * 0.48, r1 * 1.05);
      dark.addColorStop(0, 'rgba(255,255,255,0)');
      dark.addColorStop(1, `rgba(18,24,34,${0.9 * amt})`);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = dark;
      ctx.fillRect(0, 0, w, h);

      // subject rim separation
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `rgba(226,232,240,${0.20 * amt})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.52, r0 * 1.25, r0 * 1.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 7. AUTHENTIC 35MM FILM GRAIN + PERIMETER VIGNETTE
  const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.28, w * 0.5, h * 0.5, w * 0.65);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, `rgba(0,0,0,${0.42 * intensity})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  if (grainAmount > 0.05) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${0.06 * grainAmount})`;
    for (let i = 0; i < 45; i++) {
      const gx = ((i * 97 + Math.floor(t * 1000)) % w);
      const gy = ((i * 53 + Math.floor(t * 777)) % h);
      ctx.fillRect(gx, gy, 1.5, 1.5);
    }
    ctx.restore();
  }
}

// ============================================================================
// LYRC.STUDIO MULTI-WORD SPATIAL KINETIC PRESET ENGINE
// ============================================================================
function drawLyrcStudioTypography(ctx, w, h, t, onBeatPulse) {
  if (!state.cues || state.cues.length === 0) return;
  const activeCue = state.cues.find((c) => state.playheadSec >= c.startSec && state.playheadSec <= c.endSec) || state.cues[0];
  if (!activeCue) return;

  const words = activeCue.text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return;

  const phraseProgress = Math.max(0, Math.min(0.999, (state.playheadSec - activeCue.startSec) / Math.max(0.25, activeCue.endSec - activeCue.startSec)));
  const activeIdx = Math.floor(phraseProgress * words.length);
  const wordSubProgress = (phraseProgress * words.length) % 1;

  const styleId = state.captionStyle.id;
  const baseScale = state.fontScale / 100;
  const centerY = (state.posY / 100) * h;
  const seed = state.variationSeed;

  ctx.save();

  // 1. BRAT
  if (styleId === 'brat') {
    const visibleWords = words.slice(0, activeIdx + 1).map((x) => x.toLowerCase());
    if (state.backdropMode !== 'clean') {
      ctx.fillStyle = 'rgba(138, 206, 0, 0.92)';
      ctx.fillRect(w * 0.22, centerY - 78 * baseScale, w * 0.56, 156 * baseScale);
    }
    ctx.filter = 'blur(0.75px)';
    ctx.fillStyle = state.backdropMode === 'clean' ? '#8ace00' : '#000000';
    ctx.font = `600 ${Math.round(25 * baseScale)}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = 'center';
    const line1 = visibleWords.slice(0, 3).join(' ');
    const line2 = visibleWords.slice(3, 6).join(' ');
    const line3 = visibleWords.slice(6).join(' ');
    ctx.fillText(line1, w / 2, centerY - 26 * baseScale);
    if (line2) ctx.fillText(line2, w / 2, centerY + 6 * baseScale);
    if (line3) ctx.fillText(line3, w / 2, centerY + 38 * baseScale);
    ctx.filter = 'none';
    ctx.restore();
    return;
  }

  // 2. DUET / HEARTLESS
  if (styleId === 'duet' || styleId === 'heartless') {
    const rows = [];
    for (let i = 0; i <= activeIdx; i += 2) {
      rows.push(words.slice(i, Math.min(activeIdx + 1, i + 2)));
    }
    const rowHeight = 40 * baseScale;
    const startY = centerY - ((rows.length - 1) * rowHeight) / 2;

    rows.forEach((rowWords, rIdx) => {
      const y = startY + rIdx * rowHeight;
      let totalRowW = 0;
      const metrics = rowWords.map((word, wOffset) => {
        const gIdx = rIdx * 2 + wOffset;
        const isSerif = ((gIdx + seed) % 2 === 1);
        const isCurrent = gIdx === activeIdx;
        const fSize = Math.round((isSerif ? 31 : 28) * baseScale * (isCurrent ? 1.08 : 1.0));
        ctx.font = isSerif
          ? `italic 700 ${fSize}px Georgia, "Times New Roman", serif`
          : `900 ${fSize}px -apple-system, BlinkMacSystemFont, "Inter", sans-serif`;
        const textStr = isSerif ? word.toLowerCase() : word.toUpperCase();
        const mw = ctx.measureText(textStr).width;
        totalRowW += mw;
        return { textStr, isSerif, isCurrent, fSize, mw, gIdx };
      });
      totalRowW += Math.max(0, metrics.length - 1) * 14;

      let xCursor = state.alignment === 'left' ? w * 0.16 : state.alignment === 'right' ? w * 0.84 - totalRowW : (w - totalRowW) / 2;

      metrics.forEach((m) => {
        ctx.save();
        ctx.font = m.isSerif
          ? `italic 700 ${m.fSize}px Georgia, "Times New Roman", serif`
          : `900 ${m.fSize}px -apple-system, BlinkMacSystemFont, "Inter", sans-serif`;
        const popY = m.isCurrent ? -Math.sin(wordSubProgress * Math.PI) * 5 : 0;

        if (state.backdropMode === 'knockout' && m.isCurrent) {
          ctx.fillStyle = state.accentColor;
          ctx.fillRect(xCursor - 6, y - m.fSize * 0.78 + popY, m.mw + 12, m.fSize * 1.1);
          ctx.fillStyle = '#000';
        } else {
          ctx.shadowColor = m.isCurrent || styleId === 'heartless' ? state.accentColor : 'rgba(0,0,0,0.85)';
          ctx.shadowBlur = m.isCurrent ? 18 : 8;
          ctx.fillStyle = m.isSerif ? state.accentColor : state.primaryColor;
        }
        ctx.fillText(m.textStr, xCursor, y + popY);
        ctx.restore();
        xCursor += m.mw + 14;
      });
    });
    ctx.restore();
    return;
  }

  // 3. REDLINE
  if (styleId === 'redline') {
    const visible = words.slice(0, activeIdx + 1);
    const chunkStart = Math.max(0, visible.length - 4);
    const stack = visible.slice(chunkStart);
    const lineH = 38 * baseScale;
    const startY = centerY - ((stack.length - 1) * lineH) / 2;

    stack.forEach((word, sIdx) => {
      const gIdx = chunkStart + sIdx;
      const isCurrent = gIdx === activeIdx;
      const isKnockout = isCurrent || ((gIdx + seed) % 3 === 0);
      const upper = word.toUpperCase();
      const fSize = Math.round((isCurrent ? 32 : 26) * baseScale);
      ctx.font = `900 ${fSize}px -apple-system, BlinkMacSystemFont, "Inter", sans-serif`;
      const tw = ctx.measureText(upper).width;
      const x = state.alignment === 'left' ? w * 0.16 : state.alignment === 'right' ? w * 0.84 - tw : (w - tw) / 2;
      const y = startY + sIdx * lineH;

      if (isKnockout && state.backdropMode !== 'clean') {
        ctx.fillStyle = state.accentColor;
        ctx.fillRect(x - 10, y - fSize * 0.82, tw + 20, fSize * 1.08);
        ctx.fillStyle = '#090a0f';
      } else {
        ctx.fillStyle = state.primaryColor;
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 10;
      }
      ctx.fillText(upper, x, y);
      ctx.shadowBlur = 0;
    });
    ctx.restore();
    return;
  }

  // 4. TILED WAVE / FULL SET / LADDER HOUSE
  if (styleId === 'tiled_wave' || styleId === 'full_set' || styleId === 'ladder_house') {
    const visible = words.slice(0, activeIdx + 1);
    const maxTiles = Math.min(visible.length, 6);
    const slice = visible.slice(visible.length - maxTiles);

    slice.forEach((word, idx) => {
      const isCurrent = idx === slice.length - 1;
      const upper = word.toUpperCase();
      const fSize = Math.round((isCurrent ? 27 : 21) * baseScale);
      ctx.font = `900 ${fSize}px -apple-system, BlinkMacSystemFont, "Inter", sans-serif`;
      const tw = ctx.measureText(upper).width;

      let tx = w / 2;
      let ty = centerY;

      if (styleId === 'ladder_house') {
        tx = w * 0.25 + idx * 46;
        ty = centerY - 65 + idx * 28;
      } else {
        const col = (idx + seed) % 2;
        const row = Math.floor(idx / 2);
        const waveShift = Math.sin(t * 4 + idx) * 6;
        tx = w * 0.34 + col * (w * 0.26) + waveShift;
        ty = centerY - 46 + row * 42;
      }

      ctx.save();
      ctx.fillStyle = isCurrent ? state.accentColor : 'rgba(15, 18, 28, 0.86)';
      ctx.strokeStyle = isCurrent ? '#ffffff' : 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(tx - tw / 2 - 10, ty - fSize * 0.72, tw + 20, fSize * 1.15, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isCurrent ? '#090a0f' : state.primaryColor;
      ctx.textAlign = 'center';
      ctx.fillText(upper, tx, ty + 2);
      ctx.restore();
    });
    ctx.restore();
    return;
  }

  // 5. MARGIN
  if (styleId === 'margin') {
    const isRight = state.alignment === 'right';
    const railX = isRight ? w * 0.82 : w * 0.18;
    const visible = words.slice(0, activeIdx + 1).slice(-5);
    const lineH = 34 * baseScale;
    const topY = centerY - (visible.length * lineH) / 2;

    ctx.fillStyle = state.accentColor;
    ctx.fillRect(railX, topY - 22, 4, visible.length * lineH + 16);

    visible.forEach((word, idx) => {
      const isCurrent = idx === visible.length - 1;
      const fSize = Math.round((isCurrent ? 28 : 22) * baseScale);
      ctx.font = isCurrent
        ? `900 ${fSize}px -apple-system, BlinkMacSystemFont, "Inter", sans-serif`
        : `600 ${fSize}px -apple-system, BlinkMacSystemFont, "Inter", sans-serif`;
      ctx.textAlign = isRight ? 'right' : 'left';
      const slideOffset = isCurrent ? (1 - wordSubProgress) * (isRight ? -18 : 18) : 0;
      const x = isRight ? railX - 14 + slideOffset : railX + 16 + slideOffset;
      const y = topY + idx * lineH;

      ctx.fillStyle = isCurrent ? state.accentColor : state.primaryColor;
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 8;
      ctx.fillText(word.toUpperCase(), x, y);
    });
    ctx.restore();
    return;
  }

  // 6. RELAY
  if (styleId === 'relay') {
    const palette = [state.accentColor, '#ef4444', '#06b6d4', '#f59e0b', '#10b981'];
    const visible = words.slice(0, activeIdx + 1).slice(-4);
    const lineH = 38 * baseScale;
    const startY = centerY - ((visible.length - 1) * lineH) / 2;

    visible.forEach((word, idx) => {
      const isCurrent = idx === visible.length - 1;
      const upper = word.toUpperCase();
      const fSize = Math.round((isCurrent ? 28 : 23) * baseScale);
      ctx.font = `900 ${fSize}px -apple-system, BlinkMacSystemFont, "Inter", sans-serif`;
      const tw = ctx.measureText(upper).width;
      const y = startY + idx * lineH;
      const x = (w - tw) / 2;

      if (state.backdropMode !== 'clean') {
        ctx.fillStyle = palette[(idx + activeIdx) % palette.length];
        ctx.beginPath();
        ctx.roundRect(x - 12, y - fSize * 0.78, tw + 24, fSize * 1.1, 6);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillText(upper, x, y);
    });
    ctx.restore();
    return;
  }

  // 7. DEEP FOCUS / AFTERIMAGE / AFTERGLOW / QUIET
  if (styleId === 'deep_focus' || styleId === 'afterimage' || styleId === 'afterglow' || styleId === 'quiet') {
    const chunkSize = 5;
    const chunkStart = Math.floor(activeIdx / chunkSize) * chunkSize;
    const chunkWords = words.slice(chunkStart, chunkStart + chunkSize);
    const fSize = Math.round((styleId === 'quiet' ? 20 : 28) * baseScale);

    ctx.font = styleId === 'quiet'
      ? `500 ${fSize}px -apple-system, BlinkMacSystemFont, "Inter", sans-serif`
      : `800 ${fSize}px -apple-system, BlinkMacSystemFont, "Inter", sans-serif`;

    const spaceW = ctx.measureText(' ').width * (styleId === 'quiet' ? 1.8 : 1.25);
    const formatted = chunkWords.map((wStr) => (styleId === 'quiet' ? wStr.toLowerCase() : wStr.toUpperCase()));
    const widths = formatted.map((s) => ctx.measureText(s).width);
    const totalW = widths.reduce((a, b) => a + b, 0) + spaceW * Math.max(0, formatted.length - 1);
    let cursorX = (w - totalW) / 2;

    formatted.forEach((wText, idx) => {
      const gIdx = chunkStart + idx;
      const isCurrent = gIdx === activeIdx;
      const isPast = gIdx < activeIdx;

      ctx.save();
      if (styleId === 'deep_focus') {
        ctx.filter = isCurrent ? 'none' : (isPast ? 'blur(1.5px)' : 'blur(4.5px)');
        ctx.globalAlpha = isCurrent ? 1.0 : (isPast ? 0.65 : 0.35);
      } else if (styleId === 'afterimage' && isCurrent) {
        for (let echo = 1; echo <= 3; echo++) {
          ctx.globalAlpha = 0.28 / echo;
          ctx.fillStyle = state.accentColor;
          ctx.fillText(wText, cursorX, centerY - echo * 14);
          ctx.fillText(wText, cursorX, centerY + echo * 14);
        }
        ctx.globalAlpha = 1.0;
      } else if (styleId === 'afterglow') {
        ctx.shadowColor = isCurrent ? state.accentColor : '#ffffff';
        ctx.shadowBlur = isCurrent ? 26 : 10;
      }

      ctx.fillStyle = isCurrent ? state.accentColor : state.primaryColor;
      ctx.fillText(wText, cursorX, centerY);
      ctx.restore();

      cursorX += widths[idx] + spaceW;
    });

    ctx.restore();
    return;
  }

  // 8. UPLIFT / TICKER / VOLTAGE / OVERDRIVE / LETTERPRESS / HORMOZI / CLEAN PILL
  const chunkSize = 5;
  const chunkStart = Math.floor(activeIdx / chunkSize) * chunkSize;
  const visibleWords = words.slice(chunkStart, chunkStart + chunkSize);
  const fontSize = Math.round(25 * baseScale);

  ctx.font = styleId === 'overdrive'
    ? `italic 900 ${fontSize}px -apple-system, BlinkMacSystemFont, "Inter", sans-serif`
    : `900 ${fontSize}px -apple-system, BlinkMacSystemFont, "Inter", sans-serif`;
  ctx.textBaseline = 'middle';

  const spaceW = ctx.measureText(' ').width * 1.2;
  const widths = visibleWords.map((wStr) => ctx.measureText(wStr.toUpperCase()).width);
  const totalW = widths.reduce((a, b) => a + b, 0) + spaceW * Math.max(0, visibleWords.length - 1);
  let cursorX = (w - totalW) / 2;

  if (styleId === 'clean_pill' || styleId === 'hormozi_pop' || state.backdropMode === 'solid_cards') {
    ctx.fillStyle = 'rgba(9, 10, 15, 0.82)';
    ctx.beginPath();
    ctx.roundRect(cursorX - 16, centerY - fontSize * 0.88, totalW + 32, fontSize * 1.76, 8);
    ctx.fill();
  }

  if (styleId === 'ticker') {
    ctx.strokeStyle = state.accentColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, centerY - fontSize * 0.95);
    ctx.lineTo(w, centerY - fontSize * 0.95);
    ctx.moveTo(0, centerY + fontSize * 0.95);
    ctx.lineTo(w, centerY + fontSize * 0.95);
    ctx.stroke();
  }

  visibleWords.forEach((word, idx) => {
    const globalIdx = chunkStart + idx;
    const isCurrent = globalIdx === activeIdx;
    const displayWord = word.toUpperCase();
    const wordW = widths[idx];

    ctx.save();
    let yOffset = 0;
    let xOffset = 0;

    if (styleId === 'uplift' && isCurrent) {
      yOffset = -Math.sin(wordSubProgress * Math.PI) * 12;
    } else if (styleId === 'voltage' && isCurrent) {
      xOffset = (Math.random() - 0.5) * 4;
      yOffset = (Math.random() - 0.5) * 4;
    }

    if (isCurrent) {
      const pop = 1.08 + onBeatPulse * 0.06;
      ctx.translate(cursorX + wordW / 2 + xOffset, centerY + yOffset);
      ctx.scale(pop, pop);
      ctx.translate(-(cursorX + wordW / 2 + xOffset), -(centerY + yOffset));

      if (styleId === 'clean_pill' || state.backdropMode === 'knockout') {
        ctx.fillStyle = state.accentColor;
        ctx.beginPath();
        ctx.roundRect(cursorX - 5, centerY - fontSize * 0.65, wordW + 10, fontSize * 1.3, 5);
        ctx.fill();
        ctx.fillStyle = '#090a0f';
      } else {
        ctx.shadowColor = state.accentColor;
        ctx.shadowBlur = 16;
        ctx.fillStyle = state.accentColor;
      }
    } else {
      ctx.fillStyle = state.primaryColor;
    }

    if (styleId === 'letterpress') {
      ctx.fillStyle = state.accentColor;
      ctx.fillText(displayWord, cursorX + 3, centerY + 3);
      ctx.fillStyle = state.primaryColor;
    } else if (styleId !== 'clean_pill') {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3.5;
      ctx.strokeText(displayWord, cursorX + xOffset, centerY + yOffset);
    }

    ctx.fillText(displayWord, cursorX + xOffset, centerY + yOffset);
    ctx.restore();

    cursorX += wordW + spaceW;
  });

  ctx.restore();
}

// ============================================================================
// BRIDGE SETUP MODAL & LIVE STATUS CHECK
// ============================================================================
function initBridgeModal() {
  const modal = document.getElementById('bridgeModal');
  document.getElementById('openBridgeModalBtn').addEventListener('click', () => {
    modal.classList.remove('hidden');
  });
  document.getElementById('closeBridgeModalBtn').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  document.getElementById('installBridgeNowBtn').addEventListener('click', async () => {
    const resBox = document.getElementById('installResultBox');
    resBox.textContent = 'Installing VFXKit_ResolveFree_Bridge.lua & Fusion .setting macros...';
    try {
      if (state.staticMode) {
        resBox.innerHTML = 'This is the hosted web build, so there is nothing to install locally.<br/>'
          + 'Press <b>+ Apply</b> on any card and paste the Lua it gives you into '
          + '<code>Workspace ▸ Console</code> in Resolve.';
        return;
      }
      const res = await fetch('api/install-bridge', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        resBox.innerHTML = `✓ Installed Bridge to: <code>${data.installedTo}</code><br/>✓ Installed ${data.installedMacros.length} native Fusion VFX & LYRC Macros to: <code>${data.effectsDir}</code>`;
        showToast('Installed Bridge & Fusion Macros for DaVinci Resolve Free 21.1.1');
        checkResolveStatus();
      } else {
        resBox.textContent = 'Error: ' + (data.error || 'Unknown error');
      }
    } catch (err) {
      resBox.textContent = 'Install failed: ' + err.message;
    }
  });
}

async function checkResolveStatus() {
  if (state.staticMode) {
    applyModeChrome();
    return;
  }
  try {
    const res = await fetch('api/status');
    const data = await res.json();
    const statusText = document.getElementById('bridgeStatusText');
    const dot = document.getElementById('bridgeStatusDot');
    const session = data.bridgeSession;

    if (session) {
      const proj = session.projectName || 'project';
      statusText.textContent = `Live: ${proj} · Resolve ${session.version || '21.1.1'}`;
      statusText.title = `Bridge ${session.bridge || ''} · state ${session.stateDir || ''}`;
      if (dot) dot.className = 'status-dot live';
      state.bridge = Object.assign(state.bridge || {}, {
        live: true,
        project: proj,
        timeline: session.timelineName || ''
      });
      if (state.resolveLive !== true) {
        state.resolveLive = true;
        // first sight of the bridge: ask it what an Apply would hit right now
        probeBridge(true);
      } else {
        paintWireStrip({ live: true, error: null });
      }
    } else {
      state.resolveLive = false;
      state.bridge = Object.assign(state.bridge || {}, { live: false });
      if (state.liveTimeline) {
        state.liveTimeline = null;
        renderTimelineTracks();
      }
      statusText.textContent = data.scriptInstalled
        ? 'Bridge installed · run it in Resolve'
        : 'Resolve 21.1.1 Bridge Setup';
      statusText.title = data.paths ? `Install target: ${data.paths.scriptsDir}` : '';
      if (dot) dot.className = 'status-dot ' + (data.scriptInstalled ? 'installed' : 'idle');
      paintWireStrip({ live: false });
    }

    const cov = data.recipeCoverage;
    const countEl = document.getElementById('wireRecipeCount');
    if (countEl && cov) {
      countEl.textContent = `${cov.presets} native recipes · ${(cov.families || []).length} families`;
    }
    if (cov && cov.presets && state.recipeCount !== cov.presets) {
      state.recipeCount = cov.presets;
    }
  } catch (_e) {
    // Ignore status fetch error
  }
}

// Asks the resident bridge what it can see (project / timeline / clip under the
// playhead). This is the proof that a click will reach the timeline, and it is
// what the wire strip shows instead of a bare "connected".
async function probeBridge(announce) {
  if (state.staticMode) {
    if (announce) {
      showToast('Web mode: there is no bridge to test. Press “+ Apply” on a card and paste the Lua it gives you into Resolve ▸ Workspace ▸ Console.', 'warn');
    }
    return null;
  }
  const data = await dispatchToResolve('ping', {});
  const r = data && data.bridgeResponse && data.bridgeResponse.result;
  if (!data || !data.liveBridgeConnected || !r) {
    if (announce) {
      showToast('Resolve did not answer the test. In Resolve click Workspace ▸ Scripts ▸ VFXKit_ResolveFree_Bridge, then press Test again.', 'warn');
    }
    return null;
  }
  state.bridge = Object.assign(state.bridge || {}, {
    live: true,
    project: r.projectName || '',
    timeline: r.timelineName || '',
    target: r.targetClip && r.targetClip.name ? r.targetClip.name : ''
  });
  state.liveTimeline = {
    name: r.timelineName || 'Timeline',
    project: r.projectName || '',
    fps: r.fps || '24',
    clips: r.timelineClips || []
  };
  renderTimelineTracks();
  paintWireStrip({ live: true, error: null });
  if (announce) {
    const target = r.targetClip && r.targetClip.name
      ? `Apply will hit “${r.targetClip.name}”${r.targetClip.underPlayhead ? ' under the playhead' : ' (first clip on V1)'}`
      : 'No clip under the playhead — put one on V1 first';
    showToast(`Resolve replied: ${r.projectName || 'project'} / ${r.timelineName || 'timeline'}. ${target}.`, 'ok');
  }
  return r;
}

function initWireStrip() {
  const btn = document.getElementById('wireTestBtn');
  if (btn) btn.addEventListener('click', () => probeBridge(true));
}

function startBridgeStatusPoll() {
  initWireStrip();
  checkResolveStatus();
  setInterval(() => {
    if (document.hidden) return;
    checkResolveStatus();
  }, 4000);
}
