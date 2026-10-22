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
  },

  // ------------------------------------------------------------------
  // SECOND SET — twelve more looks, each with a full rack of controls.
  // ------------------------------------------------------------------
  {
    id: 'opt_ana_streak',
    name: 'Anamorphic Flare Streak',
    category: 'Optical & Glass',
    spec: '2x Oval Aperture',
    node: 'StreakFilter + HighlightThreshold',
    desc: 'A 2x oval aperture squeezes a highlight into one horizontal blue line — the honest anamorphic signature, not a lens-flare sticker.',
    effectType: 'opt_anamorphic_streak',
    accent: '#38bdf8'
  },
  {
    id: 'opt_dirty_glass',
    name: 'Dirty Front Element',
    category: 'Optical & Glass',
    spec: 'Seeded Smudges',
    node: 'LensDirt + DustPass',
    desc: 'Smudges and dust on the front element, lit by whatever is behind them. Fixed positions, so the dirt never crawls between frames.',
    effectType: 'opt_lens_dirt',
    accent: '#f2b880'
  },
  {
    id: 'lab_cross_process',
    name: 'Cross-Process E6',
    category: 'Film Lab & Grade',
    spec: 'E6 in C41',
    node: 'ColorCurves + HueShift',
    desc: 'Slide film developed in the wrong chemistry: cool lifted shadows, sulphur-yellow highlights, colours that go strange instead of pretty.',
    effectType: 'lab_xprocess',
    accent: '#22d3ee'
  },
  {
    id: 'lab_duotone_print',
    name: 'Two-Ink Duotone',
    category: 'Film Lab & Grade',
    spec: 'Pantone 2-Ink',
    node: 'LUT + GradientMap',
    desc: 'Two printing inks and no greys: the shadow ink holds the darks, the highlight ink the lights, with a real print contrast curve.',
    effectType: 'lab_duotone',
    accent: '#c084fc'
  },
  {
    id: 'time_echo_delay',
    name: 'Delayed Echo',
    category: 'Shutter & Time',
    spec: '8 Frame Delay',
    node: 'TimeOffset + Merge',
    desc: 'A copy of an earlier frame, offset and scaled like a shutter that never quite closed. Delay, opacity and offset are all yours.',
    effectType: 'time_echo',
    accent: '#a3e635'
  },
  {
    id: 'time_gate_stutter',
    name: 'Gate Stutter',
    category: 'Shutter & Time',
    spec: '6 Hz Gate',
    node: 'TimeStretcher + Scanline',
    desc: 'A film gate that does not hold steady: dark chops at the stutter rate, torn scanlines and a dropout smear.',
    effectType: 'time_gate_stutter',
    accent: '#fb7185'
  },
  {
    id: 'cam_handheld_doc',
    name: 'Handheld Documentary',
    category: 'Camera Weight',
    spec: '3-Frequency Sway',
    node: 'Transform + NoiseCHOP',
    desc: 'A long slow sway, a short micro jitter and a breath — three separate frequencies, which is what makes it read as a person holding the camera.',
    effectType: 'cam_handheld',
    accent: '#7dd3fc'
  },
  {
    id: 'cam_dolly_punch',
    name: 'Dolly Punch',
    category: 'Camera Weight',
    spec: 'Beat Locked',
    node: 'Transform + EaseCurve',
    desc: 'A real dolly move into the subject on the beat, then an eased settle. Punch depth, ease-back and drift are separate controls.',
    effectType: 'cam_dolly_punch',
    accent: '#f59e0b'
  },
  {
    id: 'depth_atmos_haze',
    name: 'Atmospheric Haze',
    category: 'Depth & Subject',
    spec: 'Distance Wash',
    node: 'DepthMap + Fog + Merge',
    desc: 'Air between the lens and the subject: the further back a thing sits, the more the frame washes out towards the haze colour.',
    effectType: 'depth_haze',
    accent: '#93c5fd'
  },
  {
    id: 'depth_rim_separation',
    name: 'Depth Rim Light',
    category: 'Depth & Subject',
    spec: 'Edge Sep',
    node: 'DepthMap + EdgeDetect + Glow',
    desc: 'A light edge behind the subject — the oldest trick there is for pulling a person off the wall behind them.',
    effectType: 'depth_rim',
    accent: '#fda4af'
  },
  {
    id: 'ed_letterbox_239',
    name: '2.39 Scope Frame',
    category: 'Editorial Polish',
    spec: '2.39:1',
    node: 'Crop + Fade + Matte',
    desc: 'A true 2.39:1 frame cut into the picture, feathered at the edge, with the shot nudged up or down inside it.',
    effectType: 'ed_letterbox',
    accent: '#e5e7eb'
  },
  {
    id: 'ed_focus_rack',
    name: 'Focus Rack',
    category: 'Editorial Polish',
    spec: 'Rack Cycle',
    node: 'Blur + EaseCurve',
    desc: 'The lens racks between soft and sharp on a cycle you set: how deep the defocus goes, how often it racks, how long it holds sharp.',
    effectType: 'ed_focus_pull',
    accent: '#cbd5e1'
  },

  // ------------------------------------------------------------------
  // THIRD SET — lens faults, print chemistry, long exposure, reframing.
  // ------------------------------------------------------------------
  {
    id: 'opt_veiling_glare',
    name: 'Veiling Glare',
    category: 'Optical & Glass',
    spec: 'Window Wash',
    node: 'Glow + Level (Lift)',
    desc: 'Light that never forms an image: a bright window throws a flat wash across the frame and lifts the blacks with it.',
    effectType: 'opt_veiling_glare',
    accent: '#fef3c7'
  },
  {
    id: 'opt_lens_bulge',
    name: 'Lens Barrel Bulge',
    category: 'Optical & Glass',
    spec: 'Wide Open',
    node: 'LensDistort + Vignette',
    desc: 'Wide-end glass bending the frame: the middle magnifies, the edges stay put, the corners fall off and fringe as they turn.',
    effectType: 'opt_lens_distort',
    accent: '#67e8f9'
  },
  {
    id: 'lab_negative',
    name: 'Camera Negative',
    category: 'Film Lab & Grade',
    spec: 'ECN-2',
    node: 'Invert + ColorCorrect',
    desc: 'The frame as an unprinted negative — inverted, with the orange base mask and print density sitting where they really sit.',
    effectType: 'lab_negative',
    accent: '#fb923c'
  },
  {
    id: 'lab_technicolor',
    name: 'Three-Strip Technicolor',
    category: 'Film Lab & Grade',
    spec: '3 Dye Layers',
    node: 'ColorCorrect + ChannelBooleans',
    desc: 'Separated dye layers, deep contrast and a warm bias, because the red strip always ran hot. Not a saturation slider.',
    effectType: 'lab_technicolor',
    accent: '#f43f5e'
  },
  {
    id: 'lab_print_screen',
    name: 'Print Halftone Screen',
    category: 'Film Lab & Grade',
    spec: 'Angled Screen',
    node: 'Halftone + Merge (Multiply)',
    desc: 'A halftone dot screen laid over the picture at a real press angle — dot pitch, screen angle, dot gain and ink strength on four dials.',
    effectType: 'lab_print_screen',
    accent: '#a3a3a3'
  },
  {
    id: 'time_long_exposure',
    name: 'Long Exposure',
    category: 'Shutter & Time',
    spec: 'Accumulated',
    node: 'Feedback + Merge (Add)',
    desc: 'True accumulation: every frame is added to a buffer that fades, so movement paints a trail instead of leaving one ghost.',
    effectType: 'time_light_trail',
    accent: '#fde047'
  },
  {
    id: 'time_freeze_hold',
    name: 'Freeze and Push',
    category: 'Shutter & Time',
    spec: 'Hold Frame',
    node: 'FreezeFrame + Transform',
    desc: 'The frame holds for a set number of frames with a slow push into it, then releases. Editorial punctuation, no jitter.',
    effectType: 'time_freeze_push',
    accent: '#e2e8f0'
  },
  {
    id: 'cam_truck_left',
    name: 'Dolly Truck',
    category: 'Camera Weight',
    spec: 'Lateral Move',
    node: 'Transform + EaseCurve',
    desc: 'A lateral dolly move, not a pan: the frame slides sideways while the lens keeps pointing the same way.',
    effectType: 'cam_truck',
    accent: '#38bdf8'
  },
  {
    id: 'cam_dutch_roll',
    name: 'Dutch Roll Pulse',
    category: 'Camera Weight',
    spec: 'Beat Locked',
    node: 'Transform (Rotate) + EaseCurve',
    desc: 'A dutch roll that snaps in on the beat and settles back — attack and settle are separate controls, so it never wobbles.',
    effectType: 'cam_roll_pulse',
    accent: '#fbbf24'
  },
  {
    id: 'depth_field_falloff',
    name: 'Depth of Field',
    category: 'Depth & Subject',
    spec: 'Focus Zone',
    node: 'DepthMap + Defocus',
    desc: 'A real defocus band: the frame is blurred, then masked back in around the focus zone. Focus size, blur and falloff are separate.',
    effectType: 'depth_dof',
    accent: '#c4b5fd'
  },
  {
    id: 'depth_split_grade',
    name: 'Background Split Grade',
    category: 'Depth & Subject',
    spec: 'Subject Isolated',
    node: 'DepthMap + ColorCorrect',
    desc: 'The subject keeps its own grade while the background is pushed to a hue you choose. Zone size, hue and push strength are all on dials.',
    effectType: 'depth_grade_split',
    accent: '#f0abfc'
  },
  {
    id: 'ed_punch_in_reframe',
    name: 'Punch-In Reframe',
    category: 'Editorial Polish',
    spec: 'Reframe',
    node: 'Transform + Crop',
    desc: 'Punch into the shot and pan within it, the way an editor reframes instead of re-cutting. Zoom and both pan axes on their own dials.',
    effectType: 'ed_punch_in',
    accent: '#94a3b8'
  },

  // ------------------------------------------------------------------
  // FOURTH SET — the last twelve, all on the same rule: named dials.
  // ------------------------------------------------------------------
  {
    id: 'opt_bokeh_rings',
    name: 'Bokeh Rings',
    category: 'Optical & Glass',
    spec: 'Wide Open',
    node: 'Bokeh + Glow',
    desc: 'Out-of-focus highlights are rings with a bright rim, not soft blobs. Size, count, colour and rim glow all move independently.',
    effectType: 'opt_bokeh_ring',
    accent: '#fcd34d'
  },
  {
    id: 'opt_ghost_reflection',
    name: 'Internal Ghost',
    category: 'Optical & Glass',
    spec: 'Element Bounce',
    node: 'Transform (Mirror) + Screen',
    desc: 'The second reflection a big front element throws back down the barrel: offset, scaled, sometimes mirrored, always faint.',
    effectType: 'opt_ghost_double',
    accent: '#bae6fd'
  },
  {
    id: 'lab_sabattier',
    name: 'Solarised Print',
    category: 'Film Lab & Grade',
    spec: 'Sabattier',
    node: 'Invert + ColorCurves',
    desc: 'The image turns over partway up the curve, so the brightest areas invert first and a halo forms along the boundary.',
    effectType: 'lab_solarise',
    accent: '#e879f9'
  },
  {
    id: 'lab_cyanotype',
    name: 'Cyanotype Print',
    category: 'Film Lab & Grade',
    spec: 'Iron Blue',
    node: 'ChannelMixer + Merge',
    desc: 'Iron-blue print chemistry on warm paper — density, paper warmth and print contrast, not a blue colour filter.',
    effectType: 'lab_cyanotype',
    accent: '#1d4ed8'
  },
  {
    id: 'time_strobe',
    name: 'Strobe Shutter',
    category: 'Shutter & Time',
    spec: 'Chopped Light',
    node: 'TimeStretcher + Merge',
    desc: 'The shutter opens and closes at a rate you set, with afterglow so the last lit frame survives instead of snapping to black.',
    effectType: 'time_strobe',
    accent: '#fef08a'
  },
  {
    id: 'time_slit_scan',
    name: 'Slit Scan Curtain',
    category: 'Shutter & Time',
    spec: 'Column Time',
    node: 'SlitScan + Cache',
    desc: 'Each column is sampled from a different moment, so movement stretches into a temporal curtain. Slice width and spread are yours.',
    effectType: 'time_slit',
    accent: '#f59e0b'
  },
  {
    id: 'cam_vertigo_zoom',
    name: 'Dolly Zoom',
    category: 'Camera Weight',
    spec: 'Vertigo',
    node: 'Transform + LensDistort',
    desc: 'The vertigo move: the lens pulls while the frame widens, so the subject holds its size and the walls stretch instead.',
    effectType: 'cam_vertigo',
    accent: '#22d3ee'
  },
  {
    id: 'cam_push_drift_slow',
    name: 'Slow Push Drift',
    category: 'Camera Weight',
    spec: 'Perpetual Push',
    node: 'Transform + EaseCurve',
    desc: 'A slow push that never quite stops, with a drift on the other axis so it reads as a camera move and not a zoom button.',
    effectType: 'cam_push_drift',
    accent: '#a5b4fc'
  },
  {
    id: 'depth_parallax_push',
    name: 'Parallax Push',
    category: 'Depth & Subject',
    spec: 'Subject Held',
    node: 'DepthMap + Transform',
    desc: 'The background moves and the subject does not — that gap is what reads as depth. Zone size and feather keep the seam soft.',
    effectType: 'depth_push_pull',
    accent: '#f472b6'
  },
  {
    id: 'depth_shadow_fall',
    name: 'Shadow Falloff',
    category: 'Depth & Subject',
    spec: 'Distance Shade',
    node: 'DepthMap + Merge (Multiply)',
    desc: 'The background sinks into shadow while the subject stays lit. Density, clear zone and shadow colour are one dial each.',
    effectType: 'depth_shadow_fall',
    accent: '#818cf8'
  },
  {
    id: 'ed_frame_guides',
    name: 'Viewfinder Guides',
    category: 'Editorial Polish',
    spec: 'Guides + Ticks',
    node: 'Text (Overlay) + Merge',
    desc: 'Thin guide lines, a centre cross and corner ticks, the way a viewfinder overlays them. Inset, weight, opacity and marks separate.',
    effectType: 'ed_frame_guides',
    accent: '#e5e7eb'
  },
  {
    id: 'ed_square_crop',
    name: 'Square Crop Matte',
    category: 'Editorial Polish',
    spec: '1:1 Feed',
    node: 'Crop + Fade',
    desc: 'The opposite of a letterbox: square framing with the sides matted off, feathered at the edge — what a 1:1 feed really looks like.',
    effectType: 'ed_square_matte',
    accent: '#cbd5e1'
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
// ---------------------------------------------------------------------------
// LYRC typography
// ---------------------------------------------------------------------------
// Stacks, not downloads: every family below is already on macOS, so the 4K
// export matches the preview and nothing has to be fetched before you type.
// `stack` is the canvas font-family list; `face` is what Resolve/Fusion gets.
const LYRC_FONTS = [
  { id: 'grotesque', label: 'Grotesque — Helvetica / Inter', stack: '"Helvetica Neue", Helvetica, Arial, sans-serif', face: 'Helvetica Neue' },
  { id: 'black', label: 'Black — heavy display', stack: '"Arial Black", "Helvetica Neue", Impact, sans-serif', face: 'Arial Black' },
  { id: 'condensed', label: 'Condensed — narrow impact', stack: '"HelveticaNeue-CondensedBold", "Arial Narrow", Impact, sans-serif', face: 'Arial Narrow' },
  { id: 'rounded', label: 'Rounded — friendly', stack: '"SF Pro Rounded", "Avenir Next", Verdana, sans-serif', face: 'Avenir Next' },
  { id: 'grotesk', label: 'Neo-grotesk — Avenir', stack: '"Avenir Next", Avenir, "Helvetica Neue", sans-serif', face: 'Avenir Next' },
  { id: 'serif', label: 'Editorial — Baskerville', stack: 'Baskerville, "Times New Roman", Georgia, serif', face: 'Baskerville' },
  { id: 'didone', label: 'Didone — Didot display', stack: 'Didot, "Bodoni 72", Baskerville, serif', face: 'Didot' },
  { id: 'slab', label: 'Slab — American Typewriter', stack: '"American Typewriter", Rockwell, Georgia, serif', face: 'American Typewriter' },
  { id: 'mono', label: 'Mono — SF Mono / Menlo', stack: '"SF Mono", Menlo, Consolas, monospace', face: 'Menlo' },
  { id: 'script', label: 'Script — handwritten', stack: '"Snell Roundhand", "Brush Script MT", cursive', face: 'Snell Roundhand' }
];

// One source of truth for every typographic knob. Sizes are a percentage of
// frame HEIGHT, so 1080p and 4K are the same design; spacing is em-relative, so
// it scales with the size for free.
const LYRC_TYPE_DEFAULTS = {
  font: 'grotesque',
  weight: 900,
  italic: false,
  caseMode: 'upper',      // upper | lower | title | asis
  sizePct: 3.6,           // % of frame height (3.6 = the old kinetic default)
  tracking: 0,            // thousandths of an em, 25 = 0.025 em
  leading: 1.05,          // line spacing multiplier
  align: 'center',        // left | center | right
  xPct: 50,
  yPct: 52,
  maxWidthPct: 86,
  outline: 3,             // px at 1080p, scales with the frame
  shadow: 55,             // 0-100 strength
  opacity: 100,
  boxOpacity: 0,
  boxColor: '#090a0f',
  boxPad: 16,
  boxRadius: 8
};

const LYRC_WEIGHT_OPTIONS = [300, 400, 500, 600, 700, 800, 900];

function lyrcFont(id) {
  return LYRC_FONTS.find((f) => f.id === id) || LYRC_FONTS[0];
}

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
  },
  // -------------------------------------------------------------------------
  // Subtitle family. These are text blocks, not word dances: their whole job is
  // legibility on a real cut, and every one of them is driven by the typography
  // panel (font, size, tracking, leading, placement, box). They wrap onto as many
  // lines as the words need, so a 12-word cue no longer runs off the frame.
  // -------------------------------------------------------------------------
  {
    id: 'subtitle_clean',
    name: 'Subtitle Clean',
    category: 'Subtitles',
    kind: 'block',
    previewHtml: '<span style="font-weight:600;">Clean</span> subtitle',
    desc: 'Broadcast subtitle block: sentence case, soft drop shadow, lower third safe area.',
    supportsVariation: false,
    fav: true,
    primary: '#ffffff',
    accent: '#ffd166',
    type: { font: 'grotesque', weight: 600, caseMode: 'asis', sizePct: 4.4, tracking: 0, leading: 1.24, yPct: 87, outline: 0, shadow: 70, boxOpacity: 0 },
    look: { activeWord: 'none' }
  },
  {
    id: 'subtitle_box',
    name: 'Subtitle Box',
    category: 'Subtitles',
    kind: 'block',
    previewHtml: '<span style="background:#000;padding:0 3px;">BOXED</span>',
    desc: 'Hard black caption box behind the text: works over any footage without an outline.',
    supportsVariation: false,
    fav: true,
    primary: '#ffffff',
    accent: '#ffffff',
    type: { font: 'grotesque', weight: 600, caseMode: 'asis', sizePct: 4.2, tracking: 0, leading: 1.22, yPct: 86, outline: 0, shadow: 0, boxOpacity: 80, boxRadius: 4, boxPad: 34 },
    look: { activeWord: 'none', boxShape: 'block' }
  },
  {
    id: 'streaming_pill',
    name: 'Streaming Pill',
    category: 'Subtitles',
    kind: 'block',
    previewHtml: '<span style="background:#111;border-radius:9px;padding:1px 6px;">PILL</span>',
    desc: 'Frosted rounded pill, the streaming-service look: centred, medium weight, no outline.',
    supportsVariation: false,
    fav: true,
    primary: '#ffffff',
    accent: '#e2e7ea',
    type: { font: 'grotesk', weight: 600, caseMode: 'asis', sizePct: 4.0, tracking: 0, leading: 1.2, yPct: 88, outline: 0, shadow: 0, boxOpacity: 72, boxRadius: 22, boxPad: 45 },
    look: { activeWord: 'none', boxShape: 'pill' }
  },
  {
    id: 'tiktok_word',
    name: 'TikTok Word',
    category: 'Subtitles',
    kind: 'block',
    previewHtml: '<b style="font-size:11px;">WORD</b><span style="color:#facc15;">POP</span>',
    desc: 'Huge uppercase centre-screen word, the current word lit in your accent colour.',
    supportsVariation: false,
    fav: true,
    primary: '#ffffff',
    accent: '#facc15',
    type: { font: 'black', weight: 900, caseMode: 'upper', sizePct: 7.4, tracking: -1, leading: 1.02, yPct: 74, outline: 7, shadow: 40, maxWidthPct: 80 },
    look: { activeWord: 'accent', perWord: true }
  },
  {
    id: 'reels_hook',
    name: 'Reels Hook',
    category: 'Subtitles',
    kind: 'block',
    previewHtml: '<span style="background:#111;color:#f97316;border-radius:5px;padding:0 4px;">HOOK</span>',
    desc: 'Two-line hook card on a dark plate, accent on the word under the voice.',
    supportsVariation: false,
    fav: false,
    primary: '#ffffff',
    accent: '#f97316',
    type: { font: 'black', weight: 900, caseMode: 'upper', sizePct: 6.4, tracking: 0, leading: 1.08, yPct: 70, outline: 3, shadow: 30, boxOpacity: 55, boxRadius: 8, boxPad: 34 },
    look: { activeWord: 'accent', boxShape: 'block' }
  },
  {
    id: 'karaoke_line',
    name: 'Karaoke Line',
    category: 'Subtitles',
    kind: 'block',
    previewHtml: '<span style="color:#22d3ee;">KA</span>RA<span style="opacity:.45;">OKE</span>',
    desc: 'The words fill with your accent colour in time with the vocal — the classic sing-along sweep.',
    supportsVariation: false,
    fav: true,
    primary: '#ffffff',
    accent: '#22d3ee',
    type: { font: 'grotesque', weight: 800, caseMode: 'asis', sizePct: 5.2, tracking: 1, leading: 1.12, yPct: 82, outline: 4, shadow: 50 },
    look: { activeWord: 'sweep' }
  },
  {
    id: 'lower_third',
    name: 'Lower Third',
    category: 'Subtitles',
    kind: 'block',
    previewHtml: '<span style="border-left:3px solid #38bdf8;padding-left:4px;">Name</span>',
    desc: 'Left-anchored name / caption bar with an accent rule — interviews and talking heads.',
    supportsVariation: false,
    fav: false,
    primary: '#ffffff',
    accent: '#38bdf8',
    type: { font: 'grotesk', weight: 600, caseMode: 'asis', sizePct: 3.8, tracking: 2, leading: 1.3, yPct: 79, xPct: 8, align: 'left', outline: 0, shadow: 65, boxOpacity: 45, boxRadius: 3, boxPad: 60, maxWidthPct: 60 },
    look: { activeWord: 'none', rule: true, boxShape: 'block' }
  },
  {
    id: 'outline_type',
    name: 'Outline Type',
    category: 'Subtitles',
    kind: 'block',
    previewHtml: '<span style="-webkit-text-stroke:1px #fff;color:transparent;">OUTLINE</span>',
    desc: 'Hollow stroked letterforms — reads on busy footage without covering it up.',
    supportsVariation: false,
    fav: false,
    primary: '#ffffff',
    accent: '#ffffff',
    type: { font: 'black', weight: 900, caseMode: 'upper', sizePct: 8.0, tracking: 5, leading: 1.0, yPct: 62, outline: 2, shadow: 0, boxOpacity: 0 },
    look: { activeWord: 'none', outlineOnly: true }
  },
  {
    id: 'serif_cinema',
    name: 'Cinema Serif',
    category: 'Subtitles',
    kind: 'block',
    previewHtml: '<i style="font-family:Didot,serif;">Cinema</i> serif',
    desc: 'Wide-tracked Didone in lower third — documentary and title-card restraint.',
    supportsVariation: false,
    fav: false,
    primary: '#f4efe6',
    accent: '#c9a227',
    type: { font: 'didone', weight: 400, caseMode: 'asis', sizePct: 4.4, tracking: 7, leading: 1.34, yPct: 85, outline: 0, shadow: 50, boxOpacity: 0 },
    look: { activeWord: 'none' }
  },
  {
    id: 'mono_terminal',
    name: 'Terminal Mono',
    category: 'Subtitles',
    kind: 'block',
    previewHtml: '<span style="font-family:Menlo,monospace;color:#6ac465;">&gt; MONO_</span>',
    desc: 'Fixed-width caption on a dark plate with a typed-on cursor: log, code and archive looks.',
    supportsVariation: false,
    fav: false,
    primary: '#d9f2c9',
    accent: '#6ac465',
    type: { font: 'mono', weight: 500, caseMode: 'upper', sizePct: 3.4, tracking: 2, leading: 1.28, yPct: 84, outline: 0, shadow: 0, boxOpacity: 62, boxRadius: 2, boxPad: 34, align: 'left', xPct: 10 },
    look: { activeWord: 'accent', boxShape: 'block', cursor: true }
  },
  {
    id: 'tape_label',
    name: 'Tape Label',
    category: 'Subtitles',
    kind: 'block',
    previewHtml: '<span style="background:#e8e4d8;color:#111;padding:0 4px;transform:rotate(-1.5deg);display:inline-block;">TAPE</span>',
    desc: 'Light label tape pasted on the frame, slightly rotated, dark ink — printed-ephemera look.',
    supportsVariation: false,
    fav: false,
    primary: '#111111',
    accent: '#a8443b',
    type: { font: 'mono', weight: 700, caseMode: 'upper', sizePct: 3.6, tracking: 3, leading: 1.18, yPct: 46, outline: 0, shadow: 35, boxOpacity: 100, boxColor: '#e8e4d8', boxRadius: 0, boxPad: 28 },
    look: { activeWord: 'none', boxShape: 'block', rotate: -1.5 }
  },
  {
    id: 'duotone_stack',
    name: 'Duotone Stack',
    category: 'Subtitles',
    kind: 'block',
    previewHtml: '<span style="color:#ffffff;">DUO</span><span style="color:#f472b6;">TONE</span>',
    desc: 'Tight stacked uppercase with the live word in the second colour — poster-weight lockup.',
    supportsVariation: false,
    fav: false,
    primary: '#ffffff',
    accent: '#f472b6',
    type: { font: 'condensed', weight: 900, caseMode: 'upper', sizePct: 6.8, tracking: -3, leading: 0.96, yPct: 52, outline: 0, shadow: 40, maxWidthPct: 72 },
    look: { activeWord: 'accent' }
  },
  {
    id: 'highlight_bar',
    name: 'Highlighter',
    category: 'Subtitles',
    kind: 'block',
    previewHtml: '<span style="background:#facc15;color:#111;padding:0 3px;">MARK</span>ER',
    desc: 'Dark ink on a highlighter bar that follows the sentence, one line at a time.',
    supportsVariation: false,
    fav: false,
    primary: '#ffffff',
    accent: '#facc15',
    type: { font: 'black', weight: 800, caseMode: 'asis', sizePct: 5.0, tracking: 0, leading: 1.18, yPct: 84, outline: 0, shadow: 30, boxOpacity: 0 },
    look: { activeWord: 'bar' }
  },
  {
    id: 'press_caption',
    name: 'Press Caption',
    category: 'Subtitles',
    kind: 'block',
    previewHtml: '<span style="text-shadow:2px 2px 0 #a8443b;">PRESS</span>',
    desc: 'Hard offset second-colour shadow, like a misregistered print plate.',
    supportsVariation: false,
    fav: false,
    primary: '#f2ede4',
    accent: '#a8443b',
    type: { font: 'slab', weight: 800, caseMode: 'upper', sizePct: 5.4, tracking: 1, leading: 1.14, yPct: 80, outline: 0, shadow: 0, boxOpacity: 0 },
    look: { activeWord: 'none', hardShadow: 1 }
  }
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
  // Which section of the browser is open. null = the six section buttons.
  // One section at a time keeps the list short instead of 72 rows deep.
  vfxSection: null,
  vfxSearch: '',
  activePreset: null,          // nothing is picked until you press Stack or a card
  presetPicked: false,         // false = the monitor shows the plate untouched
  masterIntensity: 100, // global scale for all per-effect intensities
  bpm: 142,
  mixShakes: 70,
  mixStylized: 45,
  splitCompare: false,
  vertical916: false,
  platePanX: 0,           // 9:16 framing: -1 left, 0 centre, 1 right
  showLyricsOverlay: false,   // clean picture by default — opt in from 02 • LYRC
  stageSound: true,           // the clip's own audio, audible while you work
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
  // In-app cutter: the plan derived from those segments, whether the monitor is
  // previewing it, and the file it produced (if any).
  silencePlan: null,
  silencePreview: false,
  silenceRendering: false,
  silenceCancel: false,
  silenceCut: null,           // {url, name, info, blob, seconds, label}

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
  posX: 50,
  // Every typographic knob, one object. sizePct/tracking/leading are relative to
  // the frame, so the preview and the 4K export are the same design.
  lyrcType: Object.assign({}, LYRC_TYPE_DEFAULTS),
  // Tweaks stick per style: switching to another look and back does not throw
  // your font, size or placement away.
  lyrcTypeByStyle: {},
  cues: [],
  // Auto-detect: measured from the clip's own audio, not guessed from a BPM box
  lyricAnalysis: null,
  lyricDetectMode: 'auto',   // auto | speech | music
  lyricDetecting: false,
  lyricTempoSource: 'default',
  measuredAnalysis: null,   // last measurement from either tab
  plateFile: null,

  // Media Pool Auto-Editor state
  directorMode: 'music_video',
  selectedBin: 'ALL',
  mediaPool: structuredClone(INITIAL_MEDIA_POOL),

  // Timeline tracks state
  // Edits appear here only after you make them — the timeline starts blank.
  timelineTracks: { v3: [], v2: [], v1: [], sub: [], a1: [] },
  // The editable timeline: clips with a real window on the source (see
  // public/timeline.js). `spanSec` is the visible time span; it is frozen while
  // a drag is in progress so the scale under the pointer never shifts.
  tl: {
    clips: [],
    spanSec: 6,
    selectedId: null,
    drag: null,
    scrubbing: false
  },
};

// Offscreen frame buffer for authentic 360° Shutter Step-Printing / Motion Trail accumulation
let offscreenBuffer = null;
let offscreenCtx = null;

// ============================================================================
// INITIALIZATION
// ============================================================================
// One panel failing to start must not take the rest of the page with it. This
// used to be a straight list of calls: an exception anywhere in it stopped
// every initialisation after it, so a single broken tab left a dead page.
const bootFailures = [];
function safeInit(name, fn) {
  try {
    fn();
  } catch (err) {
    bootFailures.push({ name, err });
    if (window.console && console.error) console.error(`[boot] ${name} failed to start`, err);
  }
}

let bootDone = false;
document.addEventListener('DOMContentLoaded', () => {
  if (bootDone) return;
  bootDone = true;

  // The stage and the timeline come first: they are what everything else is
  // drawn on top of, and the transport has to work even if a tab does not.
  safeInit('timeline', initMonitorAndTimeline);
  safeInit('timeline editing', initTimelineEditing);
  safeInit('tabs', initTabs);
  safeInit('scene switcher', initSceneSwitcher);
  safeInit('drop zone', initMonitorDropZone);
  safeInit('vfx tab', initVfxTab);
  safeInit('keyframe editor', initKeyframeEditor);
  safeInit('card previews', startCardThumbnailLoop);
  safeInit('silence tab', initSilenceTab);
  safeInit('captions tab', initCaptionsTab);
  safeInit('media pool tab', initMediaPoolTab);
  safeInit('mask tab', initMaskTab);
  safeInit('depth tab', initDepthTab);
  safeInit('effect layers', initLayers);
  safeInit('render bay', initRenderBay);
  safeInit('modules', initModules);
  safeInit('bridge modal', initBridgeModal);
  safeInit('console modal', initConsoleModal);

  // Start honest: empty stage, paused transport, lyrics off, blank timeline.
  // Nothing is fabricating footage or edits before the user loads anything.
  safeInit('clear stage', () => { if (state.scene === 'empty') clearStage(); });
  safeInit('effect controls', renderFxParamRack);
  safeInit('lyrics state', () => applyLyricsState(false));
  safeInit('timeline paint', renderTimelineTracks);
  safeInit('backend', () => initBackend().then(() => startBridgeStatusPoll()));

  if (bootFailures.length) {
    const names = [...new Set(bootFailures.map((f) => f.name))];
    showToast(`Part of the panel did not start: ${names.join(', ')}. `
      + 'The rest still works — reload if a control is missing.', 'warn');
  }

  // the monitor keeps drawing whatever else happened
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
  // The graph table is keyed by effectType (opt_halation), while a card carries
  // its own id (opt_500t_halation). Both are tried before falling back.
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
// v3: v2 stored which panels were hidden, and an old build let "Effect Layers"
// be hidden -- which would now hide the stack bar and look like a bug. Bumping
// the key starts everyone from "everything visible" once.
const UI_PREFS_KEY = 'pulsevfx.ui.v3';

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
      sound: state.stageSound,
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
    if (typeof prefs.sound === 'boolean') state.stageSound = prefs.sound;
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
  const soundBtn = document.getElementById('stageAudioBtn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => setStageSound(!state.stageSound));
  }
  applyMotionState(false);
  applyLyricsState(false);
  applyStageSound();
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
  // The left menu names Masking and Depth maps directly, so the two-up switcher
  // would be a second, redundant control. Keep it hidden whenever it is not
  // needed, and never render it for the subject group.
  if (group === 'subject') {
    bar.classList.add('hidden');
    bar.innerHTML = '';
    return;
  }
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

// The four things the left menu actually points at. "Transitions" is not a tab
// of its own: it is FX styles filtered to that family, which keeps one list.
const NAV_TARGETS = {
  fx: { group: 'vfx', cat: 'ALL' },
  depth: { group: 'subject', pane: 'depth' },
  mask: { group: 'subject', pane: 'mask' },
  transitions: { group: 'vfx', cat: 'Transitions & Morphs' }
};

function setNav(name) {
  const target = NAV_TARGETS[name];
  if (!target) return;
  state.activeNav = name;
  if (target.pane) state.paneByGroup[target.group] = target.pane;
  activateGroup(target.group);

  if (target.cat) {
    // FX styles is the landing screen (six sections); Transitions opens that
    // one section directly.
    state.selectedVfxCat = target.cat;
    state.vfxSection = target.cat === 'ALL' ? null : target.cat;
    state.vfxSearch = '';
    const searchEl = document.getElementById('vfxSearchInput');
    if (searchEl) searchEl.value = '';
    renderVfxGrid();
  }

  document.querySelectorAll('.rail-item').forEach((btn) => {
    const on = btn.dataset.nav === name;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  document.querySelectorAll('.rail-sub').forEach((btn) => btn.classList.remove('active'));
}

function initTabs() {
  state.activeGroup = 'vfx';
  state.activeNav = 'fx';
  state.paneByGroup = { vfx: 'vfx', captions: 'captions', subject: 'mask', editing: 'silences', render: 'render' };

  document.querySelectorAll('.rail-item').forEach((btn) => {
    btn.addEventListener('click', () => setNav(btn.dataset.nav));
  });
  document.querySelectorAll('.rail-sub').forEach((btn) => {
    btn.addEventListener('click', () => {
      activateGroup(btn.dataset.group);
      document.querySelectorAll('.rail-item').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.rail-sub').forEach((b) => b.classList.toggle('active', b === btn));
      if (btn.dataset.group === 'captions') state.activeNav = 'lyrics';
      else state.activeNav = btn.dataset.group;
    });
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
      const changedMedia = !state.plateFile || state.plateFile.name !== file.name;
      state.plateFile = file;      // kept so the lyrics tab can listen to it
      state.lyricAnalysis = null;  // a new clip means the old timing is gone
      if (changedMedia && tlClips().length) {
        // the clips pointed at the old footage: keeping them would show trims of
        // a file that is no longer on the stage
        tlSetClips([]);
        showToast('New clip loaded — the old timeline edit cleared with it', 'warn');
      }
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
        syncStageHint();
      }, { once: true });
      syncStageHint();
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

  // Loading footage must not bring a look with it. The only exception is a
  // stack the editor has already built, which keeps rendering on the new clip.
  resetLookToNone();

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
  state.plateFile = null;
  state.lyricAnalysis = null;
  resetSilenceCut();
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
  resetLookToNone();
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
  // A still has no audio: drop the previous clip's track so nothing is timed
  // against footage that is no longer on the stage.
  state.plateFile = null;
  state.lyricAnalysis = null;
  state.measuredAnalysis = null;
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
        if ((!state.plateFile || state.plateFile.name !== file.name) && tlClips().length) {
          tlSetClips([]);
          showToast('New clip loaded — the old timeline edit cleared with it', 'warn');
        }
        state.plateFile = file;
        state.lyricAnalysis = null;
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

// The detail strip goes back to its "pick a look" state, so a fresh upload
// never leaves the previous look's curve on screen.
function hideKeyframeEditor() {
  const box = document.getElementById('keyframeEditorBox');
  const hint = document.getElementById('kfPlaceholder');
  if (box) box.classList.add('hidden');
  if (hint) hint.classList.remove('hidden');
}

// Back to a clean monitor: no look selected, nothing applied, unless the editor
// has already stacked looks -- a stack belongs to the edit, not to one clip.
function resetLookToNone() {
  const live = ensureLayers().filter((l) => l.enabled);
  state.activePreset = null;
  state.presetPicked = live.length > 0;
  hideKeyframeEditor();
  const pill = document.getElementById('activeFxPill');
  if (pill) {
    pill.textContent = live.length
      ? `${live.length} stacked look${live.length === 1 ? '' : 's'}`
      : 'No look picked';
  }
  renderVfxGrid();
  renderStackChips();
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

  // Sections, not a select: six buttons, one open at a time, each with its
  // count. This is the whole "the list is too long" fix.
  const sectionBar = document.getElementById('fxSectionBar');
  if (sectionBar) {
    sectionBar.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest ? e.target.closest('[data-fx-section]') : null;
      if (!btn) return;
      const name = btn.dataset.fxSection;
      state.vfxSection = state.vfxSection === name ? null : name;
      state.selectedVfxCat = state.vfxSection || 'ALL';
      renderVfxGrid();
    });
  }

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

  const fxReset = document.getElementById('fxParamResetBtn');
  if (fxReset) {
    fxReset.addEventListener('click', () => {
      const p = state.activePreset;
      if (!p) return;
      fxResetParams(p);
      renderFxParamRack();
    });
  }

  const rack = document.getElementById('fxParamRack');
  if (rack) {
    // One delegated listener: the rack is rebuilt every time the effect
    // changes, so binding per-slider would leak and go stale.
    const onRackInput = (e) => {
      const input = e.target;
      if (!input || !input.dataset || !input.dataset.fxparam) return;
      const p = state.activePreset;
      if (!p) return;
      const key = input.dataset.fxparam;
      setFxParam(p, key, Number(input.value));
      const readout = input.parentElement && input.parentElement.querySelector('.fx-param-val');
      if (readout) readout.textContent = fxParamText(p, key, Number(input.value));
    };
    rack.addEventListener('input', onRackInput);
    rack.addEventListener('change', onRackInput);
    rack.addEventListener('dblclick', (e) => {
      const input = e.target;
      if (!input || !input.dataset || !input.dataset.fxparam) return;
      const p = state.activePreset;
      if (!p) return;
      const defs = fxParamDefs(p.effectType);
      const def = defs.find((d) => d.k === input.dataset.fxparam);
      if (!def) return;
      setFxParam(p, def.k, def.def);
      renderFxParamRack();
    });
  }
}

// Value as the user reads it: "180 px", "78%", "-12 K".
function fxParamText(preset, key, value) {
  const defs = fxParamDefs(preset && preset.effectType);
  const def = defs.find((d) => d.k === key);
  const v = Math.round(Number(value));
  if (!def) return String(v);
  if (!def.unit) return String(v);
  if (def.unit === '%') return `${v}%`;
  return `${v} ${def.unit}`;
}

// The rack: every parameter this effect actually reads, with its live value.
// Rebuilt (never re-bound) whenever the effect changes.
function renderFxParamRack() {
  const rack = document.getElementById('fxParamRack');
  if (!rack) return;
  const titleEl = document.getElementById('fxParamTitle');
  const resetBtn = document.getElementById('fxParamResetBtn');
  const preset = state.activePreset;

  rack.textContent = '';
  if (!preset) {
    if (titleEl) titleEl.textContent = 'Effect Controls';
    if (resetBtn) resetBtn.hidden = true;
    const empty = document.createElement('p');
    empty.className = 'fx-param-empty';
    empty.textContent = 'Pick an effect from FX styles to unlock its controls.';
    rack.appendChild(empty);
    return;
  }

  const defs = fxParamDefs(preset.effectType);
  const ownCount = defs.length - FX_FINISH_PARAMS.length;
  // Say plainly how much depth this look has: its own dials, plus the three
  // every look shares. No mystery meat, no single bar.
  if (titleEl) titleEl.textContent = `${ownCount} effect controls + 3 shared`;
  if (resetBtn) resetBtn.hidden = false;

  defs.forEach((def, i) => {
    if (i === defs.length - FX_FINISH_PARAMS.length) {
      const div = document.createElement('div');
      div.className = 'fx-param-divider';
      div.textContent = 'Look finish';
      rack.appendChild(div);
    }
    const row = document.createElement('div');
    row.className = 'fx-param';
    row.dataset.key = def.k;

    const head = document.createElement('div');
    head.className = 'fx-param-head';
    const name = document.createElement('span');
    name.className = 'fx-param-name';
    name.textContent = def.label;
    const val = document.createElement('strong');
    val.className = 'fx-param-val';
    const current = fxParam(preset, def.k);
    val.textContent = fxParamText(preset, def.k, current);
    head.appendChild(name);
    head.appendChild(val);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(def.min);
    input.max = String(def.max);
    input.step = def.max - def.min > 40 ? '1' : '0.5';
    input.value = String(current);
    input.dataset.fxparam = def.k;
    input.title = `${def.label}: drag, double-click to reset`;

    row.appendChild(head);
    row.appendChild(input);
    rack.appendChild(row);
  });
}

// The six sections, in the order the looks are authored, with real counts.
function fxSections() {
  const order = [];
  const counts = new Map();
  VFX_PRESETS.forEach((p) => {
    if (!counts.has(p.category)) {
      counts.set(p.category, 0);
      order.push(p.category);
    }
    counts.set(p.category, counts.get(p.category) + 1);
  });
  return order.map((name) => ({ name, count: counts.get(name) }));
}

function renderFxSectionBar() {
  const bar = document.getElementById('fxSectionBar');
  if (!bar) return;
  const searching = !!state.vfxSearch;
  bar.textContent = '';
  fxSections().forEach((section) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fx-section-btn';
    btn.dataset.fxSection = section.name;
    const open = state.vfxSection === section.name;
    btn.classList.toggle('is-open', open && !searching);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    const label = document.createElement('span');
    label.className = 'fx-section-name';
    label.textContent = section.name;
    const count = document.createElement('span');
    count.className = 'fx-section-count';
    count.textContent = String(section.count);
    btn.appendChild(label);
    btn.appendChild(count);
    bar.appendChild(btn);
  });
}

function renderVfxGrid() {
  const grid = document.getElementById('vfxPresetGrid');
  renderFxSectionBar();
  const note = document.getElementById('fxResultsNote');
  const searching = !!state.vfxSearch;
  const allowed = (p) => {
    if (searching) {
      return p.name.toLowerCase().includes(state.vfxSearch) ||
        p.category.toLowerCase().includes(state.vfxSearch) ||
        p.desc.toLowerCase().includes(state.vfxSearch) ||
        p.node.toLowerCase().includes(state.vfxSearch);
    }
    return state.vfxSection ? p.category === state.vfxSection : false;
  };
  const filtered = VFX_PRESETS.filter(allowed);
  if (note) {
    if (searching) {
      note.textContent = `${filtered.length} match${filtered.length === 1 ? '' : 'es'}`;
    } else if (state.vfxSection) {
      note.textContent = `${filtered.length} looks`;
    } else {
      note.textContent = 'Pick a section';
    }
  }
  grid.classList.toggle('is-section-landing', !searching && !state.vfxSection);
  if (!filtered.length && !searching && !state.vfxSection) {
    grid.innerHTML = '<p class="fx-empty-hint">Six sections, 72 looks. Pick one above — nothing is applied until you stack a look.</p>';
    return;
  }
  if (!filtered.length) {
    grid.innerHTML = '<p class="fx-empty-hint">No look matches that search. Try “halation”, “print”, “depth” or “shutter”.</p>';
    return;
  }

  grid.innerHTML = filtered.map((p, i) => {
    const isSel = state.activePreset && state.activePreset.id === p.id;
    const kfs = KF.tracks[p.id] || [];
    const val = Math.round(kfs.length ? evalKeyframes(kfs, state.playheadSec) : baseIntensity(p.id));
    const stackIdx = stackIndexOf(p.id);
    const inStack = stackIdx >= 0;
    // A look is a name. No thumbnail: the browser is a list you can read at a
    // glance, and the picture you are judging it on is already on screen.
    return `
      <div class="vfx-card ${isSel ? 'selected' : ''} ${inStack ? 'stacked' : ''}" data-id="${p.id}">
        <span class="fx-num">${String(VFX_PRESETS.indexOf(p) + 1).padStart(2, '0')}</span>
        <span class="fx-name">${p.name}</span>
        ${inStack ? `<span class="vfx-stack-badge" title="Position in the stack">${stackIdx + 1}</span>` : ''}
        <div class="fx-tools">
          <span class="int-lbl">INT</span>
          <input class="card-intensity-slider" type="range" min="0" max="200" value="${val}"
            data-int="${p.id}" title="Per-effect intensity (0–200%)" />
          <strong class="int-val" data-intval="${p.id}">${val}%</strong>
          <button class="card-kf-btn ${kfs.length ? 'has-kfs' : ''}" data-kf="${p.id}"
            title="Add / update intensity keyframe at playhead">◆${kfs.length ? ' ' + kfs.length : ''}</button>
        </div>
        <button class="vfx-apply-btn ${inStack ? 'in-stack' : ''}" data-apply="${p.id}"
          title="${inStack ? 'Add another copy of this look on top of the stack' : 'Add this look to the stack'}">${inStack ? 'Stack +' : 'Stack'}</button>
      </div>
    `;
  }).join('');

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
    // No hover preview: moving the pointer down a list of 72 looks must not
    // repaint the monitor. Only a click or a Stack press changes what renders.
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

// The look list is text only, so this loop usually finds nothing and returns.
// It stays because the thumbnail renderer is still used elsewhere (depth / lyrc).
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

let rackEffectType = null;
let rackPresetId = null;

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
  // The rack follows the selected effect: its sliders belong to the look, not
  // to the app, so switching styles swaps the whole control set.
  if (rackEffectType !== p.effectType || rackPresetId !== p.id) {
    rackEffectType = p.effectType;
    rackPresetId = p.id;
    renderFxParamRack();
  }
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

    // Re-measure from the level envelope we already have instead of making the
    // user press Detect again: moving a slider has to visibly change the cut.
    // The envelope is the same one the detector used, so the numbers stay real.
    remeasureSilenceSegments();

    renderSilenceSegments();
    drawSilenceWaveform();
  };

  dbSlider.addEventListener('input', updateSilenceAnalysis);
  minMsSlider.addEventListener('input', updateSilenceAnalysis);
  padMsSlider.addEventListener('input', updateSilenceAnalysis);

  document.getElementById('applySilenceCutBtn').addEventListener('click', executeSilenceCut);

  const renderBtn = document.getElementById('silenceRenderBtn');
  if (renderBtn) renderBtn.addEventListener('click', () => { renderInAppCut(); });

  const previewToggle = document.getElementById('silencePreviewToggle');
  if (previewToggle) {
    previewToggle.addEventListener('change', () => {
      state.silencePreview = previewToggle.checked;
      if (state.silencePreview) {
        const plan = state.silencePlan;
        const skipped = plan ? plan.removedSec : 0;
        showToast(skipped > 0
          ? `Preview on — the monitor now skips ${skipped.toFixed(1)}s of pause`
          : 'Preview on — nothing to skip at this threshold', skipped > 0 ? 'ok' : 'warn');
        // Jump out of a pause immediately, so pressing Play does not start on silence.
        const here = silenceCutAt(state.playheadSec);
        if (here) seekTo(here.end);
      } else {
        showToast('Preview off — the monitor plays the whole clip again');
      }
    });
  }

  const detectBtn = document.getElementById('silenceDetectBtn');
  if (detectBtn) {
    detectBtn.addEventListener('click', async () => {
      const status = document.getElementById('silenceDetectStatus');
      const say = (msg, kind) => {
        if (status) { status.textContent = msg; status.dataset.kind = kind || 'idle'; }
      };
      if (!window.AudioLab) { say('The listening engine did not load — reload the page.', 'bad'); return; }
      if (!lyricHasSource()) { say('Load a clip on the stage first — then I can hear where the talking stops.', 'warn'); showToast('Load a clip first'); return; }
      detectBtn.disabled = true;
      const label = detectBtn.textContent;
      detectBtn.textContent = '◉ Listening…';
      try {
        say('Reading the clip…', 'busy');
        const audio = await readPlateAudio((p) => {
          if (p.phase === 'fallback') say('No decodable audio track — listening through the player once…', 'busy');
          else say(p.phase === 'listening' ? `Listening… ${Math.round((p.pct || 0) * 100)}%` : 'Decoding the audio track…', 'busy');
        });
        const analysis = window.AudioLab.analyze(audio.samples, audio.sampleRate, {
          mode: 'speech',
          thresholdDb: state.silenceThresholdDb,
          minMs: state.silenceMinMs,
          padMs: state.silencePadMs
        });
        state.measuredAnalysis = analysis;
        state.silenceSegments = segmentsFromAnalysis(analysis);
        if (!state.totalDurSec) state.totalDurSec = analysis.durationSec;
        renderSilenceSegments();
        drawSilenceWaveform();
        const dead = state.silenceSegments.filter((sg) => isSegmentCut(sg));
        const deadSec = dead.reduce((a, sg) => a + (sg.end - sg.start), 0);
        say(analysis.mode === 'silent'
          ? 'That clip has no audible audio — there is nothing to cut.'
          : `Measured ${analysis.speechSegments.length} talking runs and ${dead.length} pause${dead.length === 1 ? '' : 's'} (${deadSec.toFixed(1)}s of dead air at ${state.silenceThresholdDb} dB).`,
        analysis.mode === 'silent' ? 'warn' : 'good');
        showToast(dead.length ? `Found ${dead.length} pauses to cut` : 'No pauses longer than your minimum');
      } catch (err) {
        say(`Could not read that clip: ${err && err.message ? err.message : err}`, 'bad');
        showToast('Could not read that clip');
      } finally {
        detectBtn.disabled = false;
        detectBtn.textContent = label;
      }
    });
  }

  renderSilenceSegments();
  drawSilenceWaveform();
}

function silenceTimelineDuration() {
  const a = state.measuredAnalysis || state.lyricAnalysis;
  if (a && a.durationSec > 0) return a.durationSec;
  if (state.totalDurSec > 0) return state.totalDurSec;
  const last = state.silenceSegments.reduce((a, s) => Math.max(a, s.end || 0), 0);
  return last;
}

function formatClock(sec) {
  const s = Math.max(0, Number(sec) || 0);
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${String(m).padStart(2, '0')}:${r.toFixed(1).padStart(4, '0')}s`;
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
    listEl.innerHTML = '<p class="empty-hint">No analysis yet — load footage and press <b>◉ Detect pauses</b>. '
      + 'Nothing is cut, and nothing is added to your timeline, until you do.</p>';
    const stat = document.getElementById('silenceSavedStat');
    if (stat) stat.textContent = '0.0s';
    ['silenceOrigDur', 'silenceNewDur', 'silenceSavedPct'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
    const count = document.getElementById('silenceCutCount');
    if (count) count.textContent = '0 cuts';
    refreshSilencePlan();
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

  const orig = silenceTimelineDuration();
  const saved = Math.max(0, orig - keptSec);
  const pct = orig > 0 ? Math.round((saved / orig) * 100) : 0;

  // Never print a number this clip did not produce.
  document.getElementById('silenceOrigDur').textContent = orig > 0 ? formatClock(orig) : '—';
  document.getElementById('silenceNewDur').textContent = orig > 0 ? formatClock(keptSec) : '—';
  document.getElementById('silenceSavedPct').textContent = orig > 0 ? `${pct}% (-${saved.toFixed(1)}s)` : '—';
  document.getElementById('silenceCutCount').textContent = `${cutCount} cut${cutCount === 1 ? '' : 's'}`;
  refreshSilencePlan();

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

  const totalDur = silenceTimelineDuration();
  if (!totalDur || !state.silenceSegments.length) {
    ctx.fillStyle = '#5d676c';
    ctx.font = '600 11px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('No measurement yet — press ◉ Detect pauses above', w / 2, h / 2 + 4);
    ctx.textAlign = 'left';
    return;
  }

  // Cut / keep zones first, then the measured level on top of them.
  state.silenceSegments.forEach((seg) => {
    const x1 = (seg.start / totalDur) * w;
    const x2 = (seg.end / totalDur) * w;
    const cut = isSegmentCut(seg);
    ctx.fillStyle = cut ? 'rgba(168, 68, 59, 0.22)' : 'rgba(106, 196, 101, 0.07)';
    ctx.fillRect(x1, 0, x2 - x1, h);
  });

  const measured = state.measuredAnalysis || state.lyricAnalysis;
  const db = measured && measured.features && measured.features.db;
  if (db && db.length) {
    // the shape is the clip's own level envelope, frame by frame
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < db.length; i++) { if (db[i] < lo) lo = db[i]; if (db[i] > hi) hi = db[i]; }
    const span = Math.max(6, hi - lo);
    const step = Math.max(1, Math.floor(db.length / Math.max(1, w)));
    for (let x = 0; x < w; x++) {
      const idx = Math.min(db.length - 1, Math.floor((x / w) * db.length));
      const norm = Math.max(0.02, Math.min(1, (db[idx] - lo) / span));
      const bh = norm * (h * 0.82);
      const t = (x / w) * totalDur;
      const seg = state.silenceSegments.find((sg) => t >= sg.start && t <= sg.end);
      ctx.fillStyle = seg && isSegmentCut(seg) ? 'rgba(216, 118, 108, 0.55)' : '#e2e7ea';
      ctx.fillRect(x, (h - bh) / 2, Math.max(1, w / Math.max(1, step)), bh);
    }
  }

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

  // The cut becomes real clips on V1: each kept run is a window on the source,
  // back to back, so every join can be trimmed or moved afterwards. That is the
  // whole difference between a picture of an edit and an edit.
  const t = tlModel();
  const srcDur = sourceDuration();
  const totalKeptDur = kept.reduce((acc, s) => acc + (s.end - s.start), 0) || 1;
  const baseName = (state.plateFile && state.plateFile.name)
    ? state.plateFile.name.replace(/\.[^.]+$/, '')
    : 'Clip';
  let cursor = 0;
  const newClips = kept.map((s, idx) => {
    const lenSec = Math.max(0.1, s.end - s.start);
    const clip = t.makeClip({
      id: 'sc' + (idx + 1) + '_' + Math.random().toString(36).slice(2, 6),
      track: 'V1',
      name: `${baseName} ${idx + 1}`,
      startSec: cursor,
      srcIn: s.start,
      srcOut: s.end,
      srcDur: srcDur > 0 ? srcDur : s.end,
      mediaKey: baseName
    });
    cursor += lenSec;
    return clip;
  });

  state.timelineTracks.v1 = newClips.map((c, idx) => ({
    left: Math.min(92, (c.startSec / totalKeptDur) * 100),
    width: Math.max(3, (t.len(c) / totalKeptDur) * 100),
    label: `Subclip #${idx + 1}${autoZoom && idx % 2 === 1 ? ' (1.08x 2-Cam)' : ''}`
  }));

  if (newClips.length) {
    tlSetClips(newClips);
    state.tl.selectedId = newClips[0].id;
    renderTimelineSelection();
    showToast(`${newClips.length} trimmed clip${newClips.length === 1 ? '' : 's'} on V1 — drag the edges to adjust`, 'ok');
  } else {
    renderTimelineTracks();
  }

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
// CUT IT HERE — the finished file, made in this page
// ----------------------------------------------------------------------------
// "Send cuts to Resolve" is still there for anyone who wants to edit natively,
// but the point of this panel is that you do not have to: press one button and
// the pauses are gone from a new file you can download and use anywhere.
//
// Three pieces:
//   silenceKeptPlan()      which slices survive, from the measured segments
//   silenceSkipTick()      preview: play the monitor with the pauses skipped
//   renderInAppCut()       the real render, in real time, to a downloadable file
// ============================================================================
const CUT_MIME_NOTE = 'MP4 or WebM — whatever this browser can encode';

// Re-derive the pauses from the stored level envelope, with the sliders as they
// are now. No listening, no decoding: analysis.features is the measurement the
// detector already made.
function remeasureSilenceSegments() {
  const a = state.measuredAnalysis;
  if (!a || !a.features || !window.AudioLab || !window.AudioLab.findSilences) return false;
  a.silences = window.AudioLab.findSilences(a.features, {
    thresholdDb: state.silenceThresholdDb,
    minMs: state.silenceMinMs,
    padMs: state.silencePadMs
  });
  // Keep/Cut overrides were tied to the old boundaries, so they go with them.
  state.silenceSegments = segmentsFromAnalysis(a);
  return true;
}

function silenceKeptPlan() {
  if (!window.SILENCE_CUT || !state.silenceSegments || !state.silenceSegments.length) return null;
  // The padding slider has already been applied by the detector, but a user may
  // move it after measuring, so the plan is always rebuilt from the segments as
  // they are on screen (including any Keep/Cut overrides).
  return window.SILENCE_CUT.plan(state.silenceSegments, { minSliceSec: 0.12 });
}

// A cut belongs to the clip it was measured from: loading another clip must not
// leave a download button pointing at footage that is no longer on the stage.
function resetSilenceCut() {
  state.silencePlan = null;
  state.silencePreview = false;
  state.silenceRendering = false;
  state.silenceCancel = false;
  if (state.silenceCut && state.silenceCut.url) {
    try { URL.revokeObjectURL(state.silenceCut.url); } catch (_e) { /* ignore */ }
  }
  state.silenceCut = null;
  const card = document.getElementById('silenceCutResult');
  if (card) card.hidden = true;
  const bar = document.getElementById('silenceCutProgress');
  if (bar) bar.style.width = '0%';
  const toggle = document.getElementById('silencePreviewToggle');
  if (toggle) { toggle.checked = false; toggle.disabled = true; }
  const btn = document.getElementById('silenceRenderBtn');
  if (btn) { btn.disabled = true; btn.textContent = '✂ Render the cut file'; }
}

function silenceCutStatus(text, kind) {
  const el = document.getElementById('silenceCutStatus');
  if (el) {
    el.textContent = text;
    el.dataset.kind = kind || 'idle';
  }
}

function refreshSilencePlan() {
  const plan = silenceKeptPlan();
  state.silencePlan = plan;

  const summary = document.getElementById('silenceCutSummary');
  const btn = document.getElementById('silenceRenderBtn');
  const previewToggle = document.getElementById('silencePreviewToggle');

  if (!plan) {
    if (summary) summary.textContent = 'Detect the pauses first, then this renders a new file with the dead air already gone.';
    if (btn) { btn.disabled = true; }
    if (previewToggle) { previewToggle.checked = false; previewToggle.disabled = true; }
    state.silencePreview = false;
    silenceCutStatus('Waiting for a measurement.', 'idle');
    return;
  }

  const removed = plan.removedSec;
  const pct = plan.sourceSec > 0 ? Math.round((removed / plan.sourceSec) * 100) : 0;
  if (summary) {
    summary.textContent = plan.ranges.length
      ? `${plan.ranges.length} piece${plan.ranges.length === 1 ? '' : 's'} kept · ${plan.keptSec.toFixed(1)}s from ${plan.sourceSec.toFixed(1)}s · ${removed.toFixed(1)}s (${pct}%) of pause removed`
      : 'Every second was silence — nothing to keep. Move the threshold and try again.';
  }
  // The four stat boxes are the same arithmetic the renderer will use, so the
  // number on screen and the length of the file cannot disagree.
  const setStat = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  setStat('silenceOrigDur', formatClock(plan.sourceSec));
  setStat('silenceNewDur', formatClock(plan.keptSec));
  setStat('silenceSavedPct', plan.sourceSec > 0
    ? `${plan.sourceSec > 0 ? Math.round((plan.removedSec / plan.sourceSec) * 100) : 0}% (-${plan.removedSec.toFixed(1)}s)`
    : '—');
  setStat('silenceCutCount', `${plan.cuts.length} cut${plan.cuts.length === 1 ? '' : 's'}`);

  const canCut = plan.ranges.length > 0;
  if (btn && !state.silenceRendering) btn.disabled = !canCut;
  if (previewToggle) previewToggle.disabled = !canCut;
  if (!canCut) silenceCutStatus('Nothing survives the cut at this threshold.', 'warn');
  else if (!state.silenceRendering && !state.silenceCut) {
    silenceCutStatus(`Ready — ${plan.keptSec.toFixed(1)}s of finished cut, ${plan.cuts.length} pause${plan.cuts.length === 1 ? '' : 's'} removed.`, 'good');
  }
}

function silenceCutAt(t) {
  const plan = state.silencePlan;
  if (!plan || !plan.cuts) return null;
  for (let i = 0; i < plan.cuts.length; i++) {
    const c = plan.cuts[i];
    if (t >= c.start && t < c.end) return c;
  }
  return null;
}

// Called from the monitor loop: while Preview is on, the playhead never sits
// inside a pause, so the monitor plays the finished cut.
function silenceSkipTick() {
  if (!state.silencePreview || !state.silencePlan || !state.isPlaying) return false;
  const cut = silenceCutAt(state.playheadSec);
  if (!cut) return false;
  state.playheadSec = Math.min(state.totalDurSec || cut.end, cut.end);
  const vid = document.getElementById('customVideoElement');
  if (vid && state.scene === 'custom_video') {
    const dur = Number(vid.duration);
    try { vid.currentTime = Number.isFinite(dur) && dur > 0.05 ? state.playheadSec % dur : state.playheadSec; } catch (_e) { /* ignore */ }
  }
  return true;
}

// decodeAudioData gives every channel; AudioLab's decode is mono because the
// analyser only needs mono. A deliverable needs the real sound.
async function decodePlateAudioBuffer() {
  const file = state.plateFile;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!file || !Ctx) return null;
  if (file.size > 700 * 1024 * 1024) return null;
  const ctx = new Ctx();
  try {
    const bytes = await file.arrayBuffer();
    const buf = await ctx.decodeAudioData(bytes);
    return { buffer: buf, ctx };
  } catch (_e) {
    try { ctx.close(); } catch (_e2) { /* ignore */ }
    return null;
  }
}

function silenceSetCutResult(result, plan) {
  if (state.silenceCut && state.silenceCut.url) {
    try { URL.revokeObjectURL(state.silenceCut.url); } catch (_e) { /* ignore */ }
  }
  const base = (state.plateFile && state.plateFile.name
    ? state.plateFile.name.replace(/\.[^.]+$/, '')
    : 'PulseVFX_cut').replace(/[^\w\-. ]+/g, '_');
  const name = `${base}_silence-cut.${result.ext}`;
  const url = URL.createObjectURL(result.blob);
  state.silenceCut = {
    url,
    name,
    blob: result.blob,
    seconds: result.seconds,
    label: result.label,
    width: result.width,
    height: result.height
  };
  const card = document.getElementById('silenceCutResult');
  const fileName = document.getElementById('silenceCutFileName');
  const info = document.getElementById('silenceCutFileInfo');
  const link = document.getElementById('silenceDownloadLink');
  if (fileName) fileName.textContent = name;
  if (info) {
    info.textContent = `${result.width} × ${result.height} · ${result.seconds.toFixed(1)}s · `
      + `${(result.blob.size / 1048576).toFixed(1)} MB · ${result.label}`;
  }
  if (link) {
    link.href = url;
    link.download = name;
  }
  if (card) card.hidden = false;
  saveUiPrefs();
  return state.silenceCut;
}

async function renderInAppCut() {
  const btn = document.getElementById('silenceRenderBtn');
  const bar = document.getElementById('silenceCutProgress');

  if (state.silenceRendering) {
    state.silenceCancel = true;
    silenceCutStatus('Stopping after this piece…', 'warn');
    if (btn) btn.disabled = true;
    return;
  }

  const plan = state.silencePlan || silenceKeptPlan();
  if (!plan || !plan.ranges.length) {
    silenceCutStatus('Nothing to cut — detect the pauses first.', 'warn');
    showToast('Detect the pauses first', 'warn');
    return;
  }
  const vid = document.getElementById('customVideoElement');
  if (!vid || state.scene !== 'custom_video' || !videoHasSource(vid)) {
    silenceCutStatus('Load a video clip on the stage first — the cutter works on the clip it can hear.', 'warn');
    showToast('Load a video clip first', 'warn');
    return;
  }
  if (!window.SILENCE_CUT) {
    silenceCutStatus('The cutter did not load — reload the page.', 'bad');
    return;
  }

  state.silenceRendering = true;
  state.silenceCancel = false;
  if (btn) { btn.disabled = false; btn.textContent = '◼ Stop'; }
  if (bar) bar.style.width = '0%';
  silenceCutStatus('Reading the clip…', 'busy');

  // Nothing else may touch the element while it renders, and nobody wants the
  // monitor playing the raw clip over the top of it.
  const wasMuted = vid.muted;
  const wasPlaying = state.isPlaying;
  const wasMonitor = state.stageSound;
  state.isPlaying = false;
  if (window.AudioLab && window.AudioLab.setMonitorLevel) {
    window.AudioLab.setMonitorLevel(0);      // record it, don't play it at the user
  }

  // Sound, best source first: the element's own live output (exact sync, works
  // for any codec the browser can play), then a decoded buffer spliced around
  // the cuts, then picture only — and if it comes to that, the user is told.
  let live = null;
  try {
    if (window.AudioLab && window.AudioLab.captureStreamFrom) {
      silenceCutStatus('Connecting the sound…', 'busy');
      live = window.AudioLab.captureStreamFrom(vid);
    }
  } catch (_e) { live = null; }

  let audio = null;
  if (!live) {
    try {
      silenceCutStatus('Preparing the sound…', 'busy');
      audio = await decodePlateAudioBuffer();
    } catch (_e) { audio = null; }
  }

  try {
    const result = await window.SILENCE_CUT.render({
      videoEl: vid,
      ranges: plan.ranges,
      audioStream: live ? live.stream : null,
      audioBuffer: audio ? audio.buffer : null,
      audioContext: audio ? audio.ctx : null,
      fps: 30,
      maxLongEdge: 3840,
      onProgress: (p) => {
        if (bar) bar.style.width = `${Math.round((p.pct || 0) * 100)}%`;
        if (p.detail) silenceCutStatus(p.detail, 'busy');
      },
      cancelled: () => state.silenceCancel
    });

    const cut = silenceSetCutResult(result, plan);
    const noise = (live || audio) ? (result.droppedAudio
      ? ' This browser could not mux the sound, so the file is picture only.'
      : '')
      : ' (no audio could be read from this clip — the file is picture only)';
    silenceCutStatus(`Done — ${cut.seconds.toFixed(1)}s, ${plan.cuts.length} pause${plan.cuts.length === 1 ? '' : 's'} removed. Press Download.${noise}`,
      ((live || audio) && !result.droppedAudio) ? 'good' : 'warn');
    showToast(`Cut rendered: ${cut.name}`, 'ok');
    return cut;
  } catch (err) {
    const msg = (err && err.message) ? err.message : String(err);
    silenceCutStatus(state.silenceCancel ? 'Stopped — nothing was written.' : `Could not render the cut: ${msg}`, state.silenceCancel ? 'warn' : 'bad');
    showToast(state.silenceCancel ? 'Cut cancelled' : 'Could not render the cut', state.silenceCancel ? 'warn' : 'error');
    return null;
  } finally {
    state.silenceRendering = false;
    state.silenceCancel = false;
    if (bar) bar.style.width = state.silenceCut ? '100%' : '0%';
    if (btn) { btn.textContent = '✂ Render the cut file'; btn.disabled = !(state.silencePlan && state.silencePlan.ranges.length); }
    vid.muted = wasMuted;
    if (live && live.release) { try { live.release(); } catch (_e) { /* ignore */ } }
    if (window.AudioLab && window.AudioLab.setMonitorLevel && wasMonitor) {
      window.AudioLab.setMonitorLevel(1);
    }
    // Leave the transport paused rather than restarting playback under them.
    if (wasPlaying) state.isPlaying = false;
    refreshSilencePlan();
    if (state.silenceCut) {
      silenceCutStatus(silenceCutStatusText(), state.silenceCut ? 'good' : 'idle');
    }
  }
}

function silenceCutStatusText() {
  const c = state.silenceCut;
  const p = state.silencePlan;
  if (!c || !p) return 'Ready.';
  return `Done — ${c.seconds.toFixed(1)}s, ${p.cuts.length} pause${p.cuts.length === 1 ? '' : 's'} removed. Press Download.`;
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

  // category pills are built from the style list in buildLyrcCategoryPills()

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

  document.getElementById('lyrcBackdropSelect').addEventListener('change', (e) => {
    state.backdropMode = e.target.value;
    saveLyrcType();
  });

  loadLyrcType();
  initLyrcTypePanel();
  buildLyrcCategoryPills();

  // The speech runtime is 900 KB of JavaScript: fetch it when the tab opens so
  // the first Detect is not waiting on it. The 41 MB model still waits for a click.
  if (window.AsrLab && window.AsrLab.prewarm) {
    window.AsrLab.prewarm().catch(() => {});
  }

  // the speech model reports its own progress; show it in the same status line
  if (window.AsrLab && window.AsrLab.onState) {
    window.AsrLab.onState((info) => {
      if (!state.lyricDetecting) return;
      if (info.phase === 'loading' || info.phase === 'transcribing') {
        lyricSetStatus(info.detail || 'Working…', 'busy', info.pct);
        const b = document.getElementById('lyricsDetectBtn');
        if (b) b.textContent = info.phase === 'transcribing' ? '◉ Transcribing…' : '◉ Loading model…';
      }
    });
  }

  // ---- auto-detect: the listening controls ------------------------------
  const detectBtn = document.getElementById('lyricsDetectBtn');
  if (detectBtn) detectBtn.addEventListener('click', () => { lyricsDetect(); });

  const modeRow = document.getElementById('lyrcDetectModes');
  if (modeRow) {
    modeRow.addEventListener('click', (e) => {
      const btn = e.target.closest('.lyrc-mode-btn');
      if (!btn) return;
      setLyricDetectMode(btn.dataset.lmode);
    });
  }

  const transcriptBtn = document.getElementById('lyricsTranscriptBtn');
  const transcriptInput = document.getElementById('lyricsTranscriptInput');
  if (transcriptBtn && transcriptInput) {
    transcriptBtn.addEventListener('click', () => transcriptInput.click());
    transcriptInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      loadTranscriptFile(file);
      e.target.value = '';
    });
  }

  rawInput.addEventListener('input', () => syncLyricsToBeatCues());
  document.getElementById('autoSyncLyricsBtn').addEventListener('click', () => {
    if (!state.lyricAnalysis) {
      lyricSetStatus('Press ◉ Detect from clip first — that measures the beat and the phrase positions on this clip.', 'warn');
      showToast('Press Detect from clip first');
      if (typeof syncLyricsToBeatCues === 'function') syncLyricsToBeatCues();
      return;
    }
    syncLyricsToBeatCues();
    const a = state.lyricAnalysis;
    showToast(a.bpm
      ? `Re-synced ${state.cues.length} blocks to ${a.bpm.toFixed(1)} BPM${state.lyricDetectMode === 'speech' ? '' : ' grid'}`
      : `Re-synced ${state.cues.length} blocks to the speech positions`);
  });

  // colours, size, spacing and placement are wired once, in initLyrcTypePanel()

  document.getElementById('pushCaptionsResolveBtn').addEventListener('click', () => {
    syncLyricsToBeatCues();
    if (!state.cues.some((c) => c.timed !== false && String(c.text || '').trim())) {
      lyricSetStatus('Nothing timed to send yet — load a clip, press ◉ Detect from clip, then place it on the timeline.', 'warn');
      showToast('Nothing timed to send yet');
      return;
    }
    renderTimelineTracks();
    const t = lyrcTypeOf();
    const face = lyrcFont(t.font);
    // The typography travels with the payload: Resolve gets the same font, size,
    // tracking, leading and anchor the monitor is showing, and the text arrives
    // already cased so it cannot disagree with the preview.
    const typography = {
      fontId: t.font,
      font: face.face,
      weight: Number(t.weight) || 400,
      italic: !!t.italic,
      caseMode: t.caseMode,
      sizePct: Number(t.sizePct) || 3.6,
      sizeAt1080: lyrcSizePx(t),
      tracking: Number(t.tracking) || 0,
      leading: Number(t.leading) || 1.05,
      align: t.align || 'center',
      xPct: Number(t.xPct) || 50,
      yPct: Number(t.yPct) || 52,
      maxWidthPct: Number(t.maxWidthPct) || 86,
      outline: Number(t.outline) || 0,
      shadow: Number(t.shadow) || 0,
      opacity: Number(t.opacity) || 100,
      boxOpacity: Number(t.boxOpacity) || 0,
      boxColor: t.boxColor || '#090a0f',
      boxRadius: Number(t.boxRadius) || 0,
      boxPad: Number(t.boxPad) || 0,
      primary: state.primaryColor,
      accent: state.accentColor,
      kind: state.captionStyle.kind || 'kinetic'
    };
    const casedLines = state.cues.map((c) => Object.assign({}, c, {
      text: lyrcApplyCase(c.text, t.caseMode)
    }));
    dispatchToResolve('add_captions_lyrics', {
      presetId: state.captionStyle.id,
      style: `${state.captionStyle.name} (Var #${state.variationSeed})`,
      alignment: state.alignment,
      backdropMode: state.backdropMode,
      intensity: Math.round(state.fontScale),
      fontSize: +((Number(t.sizePct) || 3.6) / 100).toFixed(4),
      typography,
      fps: 24,
      lines: casedLines
    }, `Built ${state.cues.length} native LYRC "${state.captionStyle.name}" TextPlus cards`);
  });

  document.getElementById('exportSrtBtn').addEventListener('click', downloadSrtFile);
}

// ============================================================================
// LYRC TYPOGRAPHY PANEL
// ----------------------------------------------------------------------------
// The panel never guesses: it writes one value into state.lyrcType, then pushes
// the whole model back into the controls, the specimen and the preview. Because
// the preview and the 4K export read the same function, what you set here is
// what renders.
// ============================================================================
const LYRC_STORE_KEY = 'pulsevfx.lyrc.v1';

function saveLyrcType() {
  try {
    localStorage.setItem(LYRC_STORE_KEY, JSON.stringify({
      v: 1,
      styleId: state.captionStyle && state.captionStyle.id,
      type: state.lyrcType,
      byStyle: state.lyrcTypeByStyle,
      colors: { primary: state.primaryColor, accent: state.accentColor, box: state.lyrcType.boxColor },
      backdrop: state.backdropMode,
      seed: state.variationSeed
    }));
  } catch (_e) { /* private mode */ }
}

function loadLyrcType() {
  let prefs = null;
  try { prefs = JSON.parse(localStorage.getItem(LYRC_STORE_KEY) || 'null'); } catch (_e) { prefs = null; }
  if (!prefs || prefs.v !== 1) return false;
  if (prefs.type && typeof prefs.type === 'object') {
    state.lyrcType = Object.assign({}, LYRC_TYPE_DEFAULTS, prefs.type);
  }
  if (prefs.byStyle && typeof prefs.byStyle === 'object') state.lyrcTypeByStyle = prefs.byStyle;
  if (prefs.colors) {
    if (prefs.colors.primary) state.primaryColor = prefs.colors.primary;
    if (prefs.colors.accent) state.accentColor = prefs.colors.accent;
    if (prefs.colors.box) state.lyrcType.boxColor = prefs.colors.box;
  }
  if (prefs.backdrop) state.backdropMode = prefs.backdrop;
  if (Number(prefs.seed) > 0) state.variationSeed = Number(prefs.seed);
  const found = CAPTION_STYLES.find((st) => st.id === prefs.styleId);
  if (found) state.captionStyle = found;
  return true;
}

// Size is authored as a share of the frame height; showing it in pixels at
// 1080p is what makes it a number a person can reason about.
function lyrcSizePx(t) {
  return Math.round((1080 * (Number(t.sizePct) || 3.6)) / 100);
}

function lyrcTrackingEm(t) {
  return ((Number(t.tracking) || 0) / 1000).toFixed(3).replace(/0$/, '').replace(/\.$/, '.0');
}

function setLyrcType(patch, opts) {
  const st = state.captionStyle || CAPTION_STYLES[0];
  state.lyrcType = Object.assign({}, state.lyrcType, patch || {});
  // remember the edit against this look, so switching away and back is lossless
  if (!opts || opts.remember !== false) {
    state.lyrcTypeByStyle = state.lyrcTypeByStyle || {};
    state.lyrcTypeByStyle[st.id] = Object.assign({}, state.lyrcTypeByStyle[st.id] || {}, patch || {});
  }
  // the kinetic renderers still read these two mirrors
  state.posY = Number(state.lyrcType.yPct) || 52;
  state.posX = Number(state.lyrcType.xPct) || 50;
  state.alignment = state.lyrcType.align || 'center';
  state.fontScale = Math.round(((Number(state.lyrcType.sizePct) || 3.6) / LYRC_TYPE_DEFAULTS.sizePct) * 100);
  if (state.lyrcType.font) state.fontPair = state.lyrcType.font;
  syncLyrcTypePanel();
  if (!opts || opts.persist !== false) saveLyrcType();
}

// Adopt a look's own typography, dropping edits made to a different look.
function applyLyrcStyleDefaults(style) {
  const base = lyrcTypeBase(style);
  const saved = (state.lyrcTypeByStyle && state.lyrcTypeByStyle[style.id]) || null;
  state.lyrcType = Object.assign({}, base, saved || {});
  state.posY = Number(state.lyrcType.yPct) || 52;
  state.posX = Number(state.lyrcType.xPct) || 50;
  state.alignment = state.lyrcType.align || 'center';
  state.fontScale = Math.round(((Number(state.lyrcType.sizePct) || 3.6) / LYRC_TYPE_DEFAULTS.sizePct) * 100);
  syncLyrcTypePanel();
}

function fillLyrcTypeOptions() {
  const fontSel = document.getElementById('lyrcFontSelect');
  if (fontSel && !fontSel.options.length) {
    fontSel.innerHTML = LYRC_FONTS
      .map((f) => `<option value="${f.id}">${f.label}</option>`).join('');
  }
  const weightSel = document.getElementById('lyrcWeightSelect');
  if (weightSel && !weightSel.options.length) {
    const labels = { 300: '300 Light', 400: '400 Regular', 500: '500 Medium', 600: '600 Semibold', 700: '700 Bold', 800: '800 Heavy', 900: '900 Black' };
    weightSel.innerHTML = LYRC_WEIGHT_OPTIONS
      .map((w) => `<option value="${w}">${labels[w] || w}</option>`).join('');
  }
}

const LYRC_SLIDERS = [
  { id: 'lyrcSizeSlider', key: 'sizePct', read: 'lyrcSizeReadout', from: (v) => Number(v), to: (t) => t.sizePct, text: (t) => `${lyrcSizePx(t)} px` },
  { id: 'lyrcTrackingSlider', key: 'tracking', read: 'lyrcTrackingReadout', from: Number, to: (t) => t.tracking, text: (t) => `${lyrcTrackingEm(t)} em` },
  { id: 'lyrcLeadingSlider', key: 'leading', read: 'lyrcLeadingReadout', from: (v) => Number(v) / 100, to: (t) => Math.round(t.leading * 100), text: (t) => Number(t.leading).toFixed(2) },
  { id: 'lyrcWidthSlider', key: 'maxWidthPct', read: 'lyrcWidthReadout', from: Number, to: (t) => t.maxWidthPct, text: (t) => `${t.maxWidthPct}%` },
  { id: 'lyrcOutlineSlider', key: 'outline', read: 'lyrcOutlineReadout', from: Number, to: (t) => t.outline, text: (t) => `${t.outline}` },
  { id: 'lyrcShadowSlider', key: 'shadow', read: 'lyrcShadowReadout', from: Number, to: (t) => t.shadow, text: (t) => `${t.shadow}%` },
  { id: 'lyrcBoxSlider', key: 'boxOpacity', read: 'lyrcBoxReadout', from: Number, to: (t) => t.boxOpacity, text: (t) => `${t.boxOpacity}%` },
  { id: 'lyrcBoxPadSlider', key: 'boxPad', read: 'lyrcBoxPadReadout', from: Number, to: (t) => t.boxPad, text: (t) => `${t.boxPad}` },
  { id: 'lyrcOpacitySlider', key: 'opacity', read: 'lyrcOpacityReadout', from: Number, to: (t) => t.opacity, text: (t) => `${t.opacity}%` },
  { id: 'lyrcPosXSlider', key: 'xPct', read: 'lyrcPosXReadout', from: Number, to: (t) => t.xPct, text: (t) => `${t.xPct}%` },
  { id: 'lyrcPosYSlider', key: 'yPct', read: 'lyrcPosYReadout', from: Number, to: (t) => t.yPct, text: (t) => `${t.yPct}%` }
];

function syncLyrcTypePanel() {
  const t = lyrcTypeOf();
  const setVal = (id, value) => {
    const el = document.getElementById(id);
    if (el && el.value !== String(value)) el.value = String(value);
  };
  fillLyrcTypeOptions();
  setVal('lyrcFontSelect', t.font);
  setVal('lyrcWeightSelect', t.weight);
  setVal('lyrcCaseSelect', t.caseMode);
  setVal('lyrcBackdropSelect', state.backdropMode);
  LYRC_SLIDERS.forEach((slider) => {
    const el = document.getElementById(slider.id);
    if (el) el.value = String(slider.to(t));
    const read = document.getElementById(slider.read);
    if (read) read.textContent = slider.text(t);
  });
  const color = (id, value) => { const el = document.getElementById(id); if (el) el.value = value; };
  color('capPrimaryColor', state.primaryColor);
  color('capAccentColor', state.accentColor);
  color('capBoxColor', t.boxColor);

  const italic = document.getElementById('lyrcItalicBtn');
  if (italic) {
    italic.classList.toggle('on', !!t.italic);
    italic.setAttribute('aria-pressed', t.italic ? 'true' : 'false');
  }
  const hollow = document.getElementById('lyrcOutlineBtn');
  const look = (state.captionStyle && state.captionStyle.look) || {};
  if (hollow) {
    hollow.classList.toggle('on', !!look.outlineOnly);
    hollow.setAttribute('aria-pressed', look.outlineOnly ? 'true' : 'false');
  }
  const heavy = document.getElementById('lyrcBoldBtn');
  if (heavy) {
    heavy.classList.toggle('on', Number(t.weight) >= 800);
    heavy.setAttribute('aria-pressed', Number(t.weight) >= 800 ? 'true' : 'false');
  }

  document.querySelectorAll('#lyrcAlignRow .align-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.align === (t.align || 'center'));
  });
  document.querySelectorAll('#lyrcPlacementPad .place-dot').forEach((dot) => {
    const [v, hz] = [dot.dataset.place[0], dot.dataset.place[1]];
    const yWant = v === 't' ? 15 : v === 'm' ? 50 : 85;
    const xWant = hz === 'l' ? 12 : hz === 'c' ? 50 : 88;
    dot.classList.toggle('active', Math.abs(Number(t.yPct) - yWant) <= 2 && Math.abs(Number(t.xPct) - xWant) <= 2);
  });

  // specimen: the real font at the real size, with the real spacing
  const face = lyrcFont(t.font);
  const spec = document.getElementById('lyrcTypeSpecimen');
  const main = document.getElementById('lyrcSpecimenText');
  const meta = document.getElementById('lyrcSpecimenMeta');
  if (main) {
    main.style.fontFamily = face.stack;
    main.style.fontWeight = String(t.weight || 400);
    main.style.fontStyle = t.italic ? 'italic' : 'normal';
    main.style.letterSpacing = `${(Number(t.tracking) || 0) / 1000}em`;
    main.style.lineHeight = String(t.leading || 1.05);
    main.style.fontSize = `${Math.max(18, Math.min(46, lyrcSizePx(t) * 0.62))}px`;
  }
  if (meta) meta.textContent = `${face.label.split(' — ')[0]} · ${t.weight} · ${lyrcSizePx(t)}px · ${t.align}`;
  if (spec) spec.style.color = state.primaryColor;

  const count = document.getElementById('lyrcStyleCount');
  if (count) count.textContent = `${CAPTION_STYLES.length} looks`;
  const label = document.getElementById('ctxPresetLabel');
  const st = state.captionStyle || CAPTION_STYLES[0];
  if (label) label.innerHTML = `Active LYRC Preset: <strong>${st.name}</strong> <span class="type-count">${st.category}</span>`;
}

function initLyrcTypePanel() {
  fillLyrcTypeOptions();
  const on = (id, evt, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(evt, fn);
  };

  LYRC_SLIDERS.forEach((slider) => {
    on(slider.id, 'input', (e) => {
      const patch = {};
      patch[slider.key] = slider.from(e.target.value);
      setLyrcType(patch);
    });
  });

  on('lyrcFontSelect', 'change', (e) => setLyrcType({ font: e.target.value }));
  on('lyrcWeightSelect', 'change', (e) => setLyrcType({ weight: Number(e.target.value) }));
  on('lyrcCaseSelect', 'change', (e) => setLyrcType({ caseMode: e.target.value }));

  on('lyrcItalicBtn', 'click', () => setLyrcType({ italic: !lyrcTypeOf().italic }));
  on('lyrcBoldBtn', 'click', () => {
    const t = lyrcTypeOf();
    setLyrcType({ weight: Number(t.weight) >= 800 ? 400 : 900 });
  });
  // "Hollow" is a look property, not a typographic one: it belongs to the style,
  // so it is written onto the style object and the strip is re-rendered.
  on('lyrcOutlineBtn', 'click', () => {
    const st = state.captionStyle;
    st.look = Object.assign({}, st.look || {}, { outlineOnly: !(st.look && st.look.outlineOnly) });
    state.lyrcTypeByStyle[st.id] = Object.assign({}, state.lyrcTypeByStyle[st.id] || {}, { hollow: !!(st.look && st.look.outlineOnly) });
    syncLyrcTypePanel();
    saveLyrcType();
    showToast(st.look.outlineOnly ? 'Outline type ON — letters are stroked, not filled' : 'Filled type ON');
  });

  document.querySelectorAll('#lyrcAlignRow .align-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLyrcType({ align: btn.dataset.align }));
  });

  document.querySelectorAll('#lyrcPlacementPad .place-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      const v = dot.dataset.place[0];
      const hz = dot.dataset.place[1];
      setLyrcType({
        yPct: v === 't' ? 15 : v === 'm' ? 50 : 85,
        xPct: hz === 'l' ? 12 : hz === 'c' ? 50 : 88,
        align: hz === 'l' ? 'left' : hz === 'r' ? 'right' : 'center'
      });
    });
  });

  on('capPrimaryColor', 'input', (e) => { state.primaryColor = e.target.value; syncLyrcTypePanel(); saveLyrcType(); });
  on('capAccentColor', 'input', (e) => { state.accentColor = e.target.value; syncLyrcTypePanel(); saveLyrcType(); });
  on('capBoxColor', 'input', (e) => setLyrcType({ boxColor: e.target.value }));
  on('lyrcTypeResetBtn', 'click', () => {
    const st = state.captionStyle;
    delete state.lyrcTypeByStyle[st.id];
    applyLyrcStyleDefaults(st);
    state.primaryColor = st.primary;
    state.accentColor = st.accent;
    syncLyrcTypePanel();
    saveLyrcType();
    showToast(`Reset “${st.name}” to its own typography`);
  });

  syncLyrcTypePanel();
}

function buildLyrcCategoryPills() {
  const wrap = document.getElementById('lyrcCategoryPills');
  if (!wrap) return;
  const cats = [];
  CAPTION_STYLES.forEach((st) => { if (cats.indexOf(st.category) < 0) cats.push(st.category); });
  const countOf = (cat) => CAPTION_STYLES.filter((st) => cat === 'ALL' || (cat === 'FAV' ? st.fav : st.category === cat)).length;
  const label = (cat) => (cat === 'ALL' ? 'All looks' : cat === 'FAV' ? '★ Favourites' : cat);
  wrap.innerHTML = ['ALL'].concat(cats).concat(['FAV']).map((cat) => `
    <button class="lyrc-cat-pill ${state.lyrcFilterCat === cat ? 'active' : ''}" data-lcat="${cat}">
      ${label(cat)} (${countOf(cat)})
    </button>`).join('');
  wrap.querySelectorAll('.lyrc-cat-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      state.lyrcFilterCat = pill.dataset.lcat;
      wrap.querySelectorAll('.lyrc-cat-pill').forEach((p) => p.classList.toggle('active', p === pill));
      renderCaptionStyleStrip();
    });
  });
}

function selectLyrcPreset(st) {
  state.captionStyle = st;
  state.primaryColor = st.primary;
  state.accentColor = st.accent;
  // A look carries its own typography (font, size, spacing, placement). Your
  // edits to that look are restored if you come back to it.
  applyLyrcStyleDefaults(st);
  syncLyrcTypePanel();
  saveLyrcType();

  refreshLyricsPill();
  updateContextualBar();
  renderCaptionStyleStrip();
}

function updateContextualBar() {
  const st = state.captionStyle;
  const label = document.getElementById('ctxPresetLabel');
  if (label) {
    label.innerHTML = `Active LYRC Preset: <strong>${st.name}</strong>`
      + ` <span class="type-count">${st.category}</span>`;
    label.title = st.desc;
  }
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
        buildLyrcCategoryPills();
        renderCaptionStyleStrip();
        syncLyrcTypePanel();
      }
    });
  });
}

// ---------------------------------------------------------------------------
// The cue list — real times, editable in place
// ---------------------------------------------------------------------------
function cueTimeLabel(c) {
  if (c.timed === false) return 'not timed';
  return `${c.startSec.toFixed(1)}–${c.endSec.toFixed(1)}s`;
}

function escapeAttr(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderCueList() {
  const listEl = document.getElementById('captionCuesList');
  if (!listEl) return;
  const badge = document.getElementById('cueCountBadge');
  const n = state.cues.length;
  if (badge) badge.textContent = `${n} ${n === 1 ? 'Block' : 'Blocks'}`;

  if (!n) {
    listEl.innerHTML = '<p class="empty-hint">Nothing timed yet. Load a clip on the stage and press <strong>◉ Detect from clip</strong>, or type your lines on the left — one line per phrase.</p>';
    return;
  }

  listEl.innerHTML = state.cues.map((c) => `
    <div class="cue-item${c.placeholder ? ' is-empty' : ''}${c.timed === false ? ' is-untimed' : ''}"
         data-index="${c.index}" data-start="${c.startSec}">
      <button class="cue-time" data-start="${c.startSec}" ${c.timed === false ? 'disabled' : ''}
              title="${c.timed === false ? 'No timing yet' : 'Jump the playhead to this block'}">${cueTimeLabel(c)}</button>
      <input class="cue-input" data-index="${c.index}" value="${escapeAttr(c.text)}"
             placeholder="${c.placeholder ? 'type what was said here' : 'caption text'}"
             title="Type over this block — the timing stays" />
      <span class="cue-dur">${c.timed === false ? '—' : `${Math.max(0, c.endSec - c.startSec).toFixed(1)}s`}</span>
    </div>
  `).join('');

  listEl.querySelectorAll('.cue-time').forEach((btn) => {
    btn.addEventListener('click', () => {
      const at = Number(btn.dataset.start);
      if (!Number.isFinite(at)) return;
      if (typeof seekTo === 'function') seekTo(at + 0.03);
      else state.playheadSec = at + 0.03;
    });
  });

  listEl.querySelectorAll('.cue-input').forEach((input) => {
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('input', () => {
      const cue = state.cues.find((c) => String(c.index) === input.dataset.index);
      if (!cue) return;
      cue.text = input.value;
      cue.placeholder = false;
      // There is now a caption to show: put it on the monitor instead of leaving
      // the user typing into a panel that draws nothing.
      if (String(cue.text).trim() && !state.showLyricsOverlay) setLyricsOverlay(true);
      // keep the word timings in step with what was typed
      if (window.AudioLab && cue.timed !== false) {
        cue.words = window.AudioLab.wordTimes(cue.text, cue.startSec, cue.endSec, 0.25);
      }
      lyricPushTimeline();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    });
  });
}

// A reel caption that stays up for eleven seconds is not a caption. Anything
// longer than this is split at the word boundaries the transcription measured.
const LYRIC_MAX_CUE_SEC = 6;

function splitLongCues(cues) {
  const out = [];
  cues.forEach((cue) => {
    const span = cue.endSec - cue.startSec;
    if (span <= LYRIC_MAX_CUE_SEC || !cue.words || cue.words.length < 4) {
      out.push(cue);
      return;
    }
    const parts = Math.ceil(span / LYRIC_MAX_CUE_SEC);
    const per = Math.ceil(cue.words.length / parts);
    for (let i = 0; i < cue.words.length; i += per) {
      const slice = cue.words.slice(i, i + per);
      if (!slice.length) continue;
      out.push({
        ...cue,
        text: slice.map((w) => w.text).join(' ').replace(/\s+([,.;:!?])/g, '$1'),
        startSec: +slice[0].startSec.toFixed(2),
        endSec: +(slice[slice.length - 1].endSec + 0.12).toFixed(2),
        words: slice
      });
    }
  });
  return out.map((c, i) => ({ ...c, index: i + 1 }));
}

function lyricPushTimeline() {
  const cueSpan = Math.max(1, state.totalDurSec || 1);
  state.timelineTracks.sub = state.showLyricsOverlay ? state.cues
    .filter((c) => c.timed !== false)
    .map((c) => ({
      left: Math.round((c.startSec / cueSpan) * 100),
      width: Math.max(6, Math.round(((c.endSec - c.startSec) / cueSpan) * 100) - 1),
      label: `${state.captionStyle.name}: ${c.text || '(untitled block)'}`
    })) : [];
  renderTimelineTracks();
}

// ---------------------------------------------------------------------------
// Timing: measured when there is audio, honest when there is not
// ---------------------------------------------------------------------------
function lyricLines(opts) {
  const raw = (document.getElementById('lyricsRawInput').value || '');
  const typed = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  if (typed.length) return typed;
  if (opts && opts.fresh) return [];
  // No typed lines: keep whatever is already written in the blocks (transcribed
  // or hand-typed there) so Re-sync retimes it instead of erasing it.
  return state.cues.map((c) => String(c.text || '').trim()).filter(Boolean);
}

// Only what is in the box. Used to decide whether the user's own wording is
// authoritative over the machine's.
function typedLines() {
  const raw = (document.getElementById('lyricsRawInput').value || '');
  return raw.split('\n').map((l) => l.trim()).filter(Boolean);
}

function syncLyricsToBeatCues(opts) {
  const fresh = opts && opts.fresh;
  const lines = lyricLines({ fresh });
  const Lib = window.AudioLab;
  const a = state.lyricAnalysis;
  const fallbackMode = state.scene === 'talking_head' ? 'speech' : 'music';

  if (Lib && a && a.mode !== 'silent') {
    const mode = a.mode === 'speech' ? 'speech' : 'music';
    if (lines.length) {
      state.cues = Lib.cuesFromLines(lines, a, { mode });
    } else {
      // No transcript yet: one block per thing that was actually said.
      state.cues = Lib.cuesFromPhrases(a).map((c) => ({ ...c, timed: true }));
    }
    if (a.bpm && state.lyricTempoSource !== 'detected') {
      state.bpm = Math.round(a.bpm * 10) / 10;
      state.lyricTempoSource = 'detected';
    }
  } else if (lines.length) {
    // No analysis: spread evenly, over a real duration. Never invent 0.0s blocks.
    const span = state.totalDurSec > 0 ? state.totalDurSec : 0;
    const weighted = lines.map((text) => Math.max(1, text.split(/\s+/).filter(Boolean).length));
    const totalW = weighted.reduce((x, y) => x + y, 0);
    let cursor = 0;
    state.cues = lines.map((text, idx) => {
      const share = weighted[idx] / totalW;
      const cue = {
        index: idx + 1,
        text,
        startSec: span > 0 ? +(cursor * span).toFixed(2) : 0,
        endSec: span > 0 ? +((cursor + share) * span).toFixed(2) : 0,
        timed: span > 0,
        words: []
      };
      if (span > 0 && Lib) cue.words = Lib.wordTimes(text, cue.startSec, cue.endSec, 0.25);
      cursor += share;
      return cue;
    });
  } else {
    state.cues = [];
  }

  renderCueList();
  lyricPushTimeline();
  const hint = document.getElementById('lyricsTabHint');
  if (hint && state.cues.length) {
    const timed = state.cues.filter((c) => c.timed !== false);
    hint.textContent = timed.length
      ? `${timed.length} timed block${timed.length === 1 ? '' : 's'} from this clip${state.lyricAnalysis && state.lyricAnalysis.bpm ? ` · ${state.lyricAnalysis.bpm.toFixed(1)} BPM` : ''}`
      : `Hidden — your footage plays clean. Turn it on when you want the typography.`;
  }
}

// ---------------------------------------------------------------------------
// Auto-detect — the listening itself
// ---------------------------------------------------------------------------
function lyricSetStatus(message, kind, pct) {
  const el = document.getElementById('lyrcDetectStatus');
  if (el) {
    el.textContent = message;
    el.dataset.kind = kind || 'idle';
  }
  const bar = document.getElementById('lyrcDetectProgress');
  if (bar) bar.style.width = `${pct === undefined || pct === null ? 0 : Math.round(Math.max(0, Math.min(1, pct)) * 100)}%`;
}

function lyricSetChips(items) {
  const box = document.getElementById('lyrcDetectChips');
  if (!box) return;
  box.innerHTML = (items || [])
    .map((c) => `<span class="lyrc-chip${c.tone ? ` is-${c.tone}` : ''}">${c.text}</span>`)
    .join('');
}

function lyricHasSource() {
  if (state.plateFile) return true;
  const vid = document.getElementById('customVideoElement');
  return !!(vid && typeof videoHasSource === 'function' && videoHasSource(vid));
}

function lyricDescribe(a) {
  const bits = [];
  if (a.mode === 'silent') return 'That clip has no audible audio — nothing to detect.';
  if (a.mode === 'music') {
    bits.push(a.bpm ? `Music, ${a.bpm.toFixed(1)} BPM` : 'Music, no steady pulse');
    bits.push(`${a.vocalSegments.length} vocal entr${a.vocalSegments.length === 1 ? 'y' : 'ies'}`);
  } else {
    bits.push('Talking');
    bits.push(`${a.speechSegments.length} speech phrase${a.speechSegments.length === 1 ? '' : 's'}`);
    bits.push(`${a.speechTimeSec.toFixed(1)} s of speech`);
  }
  bits.push(`${a.silences.length} pause${a.silences.length === 1 ? '' : 's'}`);
  return bits.join(' · ');
}

// Measure the clip and place the words. Split out from the file plumbing so the
// same path runs whether the audio was decoded from a file or captured live.
function lyricAnalyzeAudio(audio) {
  const Lib = window.AudioLab;
  // A 60-minute file would lock the page while it crunched. Cap the pass and say
  // so, rather than silently hanging: the first 15 minutes are what a reel needs.
  const MAX_ANALYSIS_SEC = 900;
  let truncated = false;
  if (audio.samples.length > MAX_ANALYSIS_SEC * audio.sampleRate) {
    audio = {
      ...audio,
      samples: audio.samples.subarray(0, MAX_ANALYSIS_SEC * audio.sampleRate),
      durationSec: MAX_ANALYSIS_SEC
    };
    truncated = true;
  }
  const analysis = Lib.analyze(audio.samples, audio.sampleRate, {
    mode: state.lyricDetectMode,
    thresholdDb: state.silenceThresholdDb,
    minMs: state.silenceMinMs,
    padMs: state.silencePadMs
  });
  analysis.source = audio.source || 'decoded';
  analysis.truncated = truncated;
  analysis.analyzedAt = Date.now();
  state.lyricAnalysis = analysis;
  state.measuredAnalysis = analysis;

  if (analysis.durationSec > 0 && (!state.totalDurSec || state.totalDurSec < 0.1)) {
    state.totalDurSec = analysis.durationSec;
  }
  if (analysis.bpm) {
    state.bpm = Math.round(analysis.bpm * 10) / 10;
    state.lyricTempoSource = 'detected';
  }

  // The cut tools read the same measurement instead of their own guess.
  state.silenceSegments = segmentsFromAnalysis(analysis);
  renderSilenceSegments();
  drawSilenceWaveform();

  const chips = [];
  if (analysis.mode === 'silent') {
    chips.push({ text: 'No audio', tone: 'bad' });
  } else {
    chips.push({ text: analysis.mode === 'music' ? 'Music' : 'Speech', tone: 'good' });
    if (analysis.bpm) chips.push({ text: `${analysis.bpm.toFixed(1)} BPM` });
    if (analysis.mode === 'music') chips.push({ text: `${analysis.vocalSegments.length} vocal entries` });
    else chips.push({ text: `${analysis.speechSegments.length} phrases` });
    chips.push({ text: `${analysis.silences.length} pauses` });
    chips.push({ text: `${analysis.durationSec.toFixed(1)} s` });
    if (analysis.truncated) chips.push({ text: 'first 15 min only', tone: 'warn' });
    if (analysis.requestedMode === 'auto' && analysis.modeConfidence < 0.5) {
      chips.push({ text: 'not sure — pick a mode', tone: 'warn' });
    }
  }
  lyricSetChips(chips);

  const hadLines = lyricLines({ fresh: true }).length > 0;
  syncLyricsToBeatCues({ fresh: true });
  // now that the blocks exist, say plainly whether they have words in them
  if (analysis.mode !== 'silent' && state.cues.length
      && !state.cues.some((c) => String(c.text || '').trim())) {
    lyricSetChips(chips.concat([{ text: 'needs the words — type in the blocks', tone: 'warn' }]));
  }

  const spoken = hadLines ? state.cues.filter((c) => String(c.text || '').trim()) : [];
  let note;
  if (analysis.mode === 'silent') {
    note = '';
  } else if (spoken.length) {
    // Asking for subtitles and then being shown nothing is the bug this fixes:
    // a measuring pass that produces captions turns them on.
    if (!state.showLyricsOverlay) {
      setLyricsOverlay(true);
      note = ' Subtitles are ON — the monitor shows them now.';
    }
    if (!state.isPlaying && typeof seekTo === 'function') {
      seekTo(Math.max(0, spoken[0].startSec + 0.05));
    }
    note = note || '';
  } else {
    note = ' No words yet: each block is a place you spoke — type into it (or paste your script and press Re-sync). The monitor stays clean until there is text to draw.';
    // A block you cannot type into is a dead end: focus the first one so the
    // next keystroke is the transcript.
    const first = document.querySelector('#captionCuesList .cue-input');
    if (first) {
      // preventScroll: focusing an input inside a scroll container used to drag
      // the whole panel sideways, which then looked frozen.
      try { first.focus({ preventScroll: true }); } catch (_e) { first.focus(); }
      if (first.select) first.select();
    }
    const box = document.getElementById('lyricsRawInput');
    if (box && !box.value) box.setAttribute('placeholder', 'Type here instead if you prefer one line at a time — or paste your script and press Re-sync to grid.');
  }

  lyricSetStatus(
    !note
      ? lyricDescribe(analysis)
      : `${lyricDescribe(analysis)}.${hadLines ? '' : ''}${note}`,
    analysis.mode === 'silent' ? 'warn' : (spoken.length ? 'good' : 'warn'),
    1
  );
  return analysis;
}

// One place that knows how to get audio out of the stage: decode the file the
// user dropped, and if that is impossible, listen through the player once.
async function readPlateAudio(onPhase) {
  const Lib = window.AudioLab;
  if (state.plateFile) {
    try {
      return await Lib.decodeFile(state.plateFile, onPhase);
    } catch (err) {
      onPhase({ phase: 'fallback', pct: 0.2 });
    }
  }
  return Lib.captureFromElement(document.getElementById('customVideoElement'), onPhase);
}

// Whole-clip segment map: talking runs and dead air, in order, covering the
// entire clip. The silence cutter reads this instead of inventing segments.
function segmentsFromAnalysis(analysis) {
  const total = analysis.durationSec || 0;
  const out = [];
  let cursor = 0;
  (analysis.silences || []).forEach((seg) => {
    const s = Math.max(cursor, Math.min(total, seg.startSec));
    const e = Math.max(s, Math.min(total, seg.endSec));
    if (s - cursor > 0.04) out.push({ type: 'speech', start: +cursor.toFixed(2), end: +s.toFixed(2), db: -14 });
    if (e - s > 0.04) out.push({ type: 'silence', start: +s.toFixed(2), end: +e.toFixed(2), db: Math.round(seg.avgDb) });
    cursor = e;
  });
  if (total - cursor > 0.04) out.push({ type: 'speech', start: +cursor.toFixed(2), end: +total.toFixed(2), db: -14 });
  return out.map((seg, i) => ({
    id: i + 1,
    start: seg.start,
    end: seg.end,
    db: seg.db,
    type: seg.type,
    forceKeep: false,
    label: seg.type === 'silence'
      ? `Dead air (${(seg.end - seg.start).toFixed(1)}s)`
      : `Talking ${out.slice(0, i + 1).filter((x) => x.type === 'speech').length}`
  }));
}

// ---------------------------------------------------------------------------
// Speech to text — the part that types it for you
// ---------------------------------------------------------------------------
// Whisper runs in this page against weights shipped with the site (asr.js). It
// returns words with real timings; those words are grouped into the phrases the
// VAD already found, so a caption starts when the sentence starts, not when a
// 30-second window happened to begin.
async function lyricTranscribe(audio, analysis) {
  const Asr = window.AsrLab;
  if (Asr && Asr.state && Asr.state() === 'failed' && Asr.reset) Asr.reset();
  // Never fail quietly: an empty caption list with no explanation is the worst
  // possible outcome, so every early exit says something the user can read.
  if (!Asr) {
    lyricSetStatus('The speech engine did not load, so the words cannot be typed. The blocks are still timed — reload the page and press Detect again.', 'bad', 0);
    showToast('Speech engine did not load');
    return null;
  }
  if (!audio || !audio.samples || !audio.samples.length) {
    lyricSetStatus('No audio came out of that clip, so there is nothing to transcribe. The blocks are still timed.', 'warn', 0);
    return null;
  }

  const speech = analysis && analysis.mode !== 'music';
  const setStatus = (msg, kind, pct) => lyricSetStatus(msg, kind, pct);
  const chip = { text: 'transcribing…', tone: 'warn' };
  lyricSetChips([chip]);

  let result;
  try {
    result = await Asr.transcribe(audio.samples, audio.sampleRate, { language: 'en', maxSec: 300 });
  } catch (err) {
    const why = err && err.message ? err.message : 'the speech model could not run';
    lyricSetStatus(
      `${why}. The blocks are still timed — type into them, or paste your script and press Re-sync to grid.`,
      'warn', 0
    );
    return null;
  }
  if (!result || !result.words.length) {
    lyricSetStatus('The model heard no words in this clip — the blocks are timed but empty.', 'warn', 1);
    return null;
  }

  // Which spans should become captions: what was actually said.
  const spans = speech ? (analysis.speechSegments || []) : (analysis.vocalSegments || []);
  const grouped = Asr.wordsIntoSegments(result.words, spans.length ? spans : [{
    startSec: 0, endSec: analysis.durationSec || result.durationSec
  }]);

  // The words the user typed win: they are the lyric, the model is only a guess
  // at the same thing. Transcription fills what is empty.
  const typed = typedLines();
  const cues = [];
  grouped.forEach((g) => {
    const text = String(g.text || '').trim();
    if (!text) return;
    cues.push({
      index: cues.length + 1,
      text,
      startSec: +g.startSec.toFixed(2),
      endSec: +g.endSec.toFixed(2),
      timed: true,
      words: g.words,
      transcribed: true
    });
  });

  if (!cues.length) {
    lyricSetStatus('The model heard words but none landed inside a measured phrase — try Detect again with Music video or Talking head picked explicitly.', 'warn', 1);
    return null;
  }

  if (typed.length) {
    // keep the user's wording, but note that the machine heard it too
    state.lyricAsr = { text: result.text, words: result.words, tookMs: result.tookMs, ignored: true };
    lyricSetStatus(
      `${result.words.length} words heard and matched to your ${state.cues.length} blocks (your own wording kept).`,
      'good', 1
    );
    return result;
  }

  state.cues = splitLongCues(cues);
  state.lyricAsr = { text: result.text, words: result.words, tookMs: result.tookMs, ignored: false };
  renderCueList();
  if (!state.showLyricsOverlay) setLyricsOverlay(true);
  lyricPushTimeline();
  if (!state.isPlaying && typeof seekTo === 'function') seekTo(Math.max(0, cues[0].startSec + 0.05));

  const secs = (result.tookMs / 1000).toFixed(1);
  lyricSetStatus(
    `Transcribed ${result.words.length} words into ${cues.length} timed captions in ${secs}s${result.truncated ? ' (first 5 minutes)' : ''}. Captions are ON — fix any word by clicking it.`,
    'good', 1
  );
  lyricSetChips([
    { text: analysis.mode === 'music' ? 'Music' : 'Speech', tone: 'good' },
    ...(analysis.bpm ? [{ text: `${analysis.bpm.toFixed(1)} BPM` }] : []),
    { text: `${cues.length} captions`, tone: 'good' },
    { text: `${result.words.length} words` },
    { text: `whisper-tiny · local` }
  ]);
  return result;
}

async function lyricsDetect() {
  const Lib = window.AudioLab;
  if (state.lyricDetecting) return;
  if (!Lib) {
    lyricSetStatus('The listening engine did not load — reload the page.', 'bad');
    return;
  }
  if (!lyricHasSource()) {
    lyricSetStatus('Load a clip on the stage first, then press Detect — I need something to listen to.', 'warn');
    showToast('Load a clip on the stage first');
    return;
  }

  state.lyricDetecting = true;
  const btn = document.getElementById('lyricsDetectBtn');
  if (btn) {
    btn.disabled = true;
    btn.classList.add('is-busy');
    btn.textContent = '◉ Listening…';
  }
  const relabel = () => {
    if (btn && state.lyricDetecting && state.cues.length === 0 && !state.lyricAsr) btn.textContent = '◉ Listening…';
  };
  relabel();
  lyricSetChips([]);
  const wasPlaying = !!state.isPlaying;
  const wasAt = state.playheadSec;

  try {
    lyricSetStatus('Reading the clip…', 'busy', 0.06);
    const audio = await readPlateAudio((p) => {
      if (p.phase === 'reading') lyricSetStatus('Reading the clip…', 'busy', p.pct);
      else if (p.phase === 'decoding') lyricSetStatus('Decoding the audio track…', 'busy', p.pct);
      else if (p.phase === 'fallback') lyricSetStatus('No decodable audio track — listening through the player once instead…', 'busy', 0.2);
      else lyricSetStatus('Listening through the player…', 'busy', 0.2 + (p.pct || 0) * 0.6);
    });

    if (!audio || !audio.samples || !audio.samples.length) {
      throw new Error('no audio samples came out of that clip');
    }

    lyricSetStatus('Finding words, beats and pauses…', 'busy', 0.82);
    await new Promise((r) => setTimeout(r, 16));
    const analysis = lyricAnalyzeAudio(audio);
    state.isPlaying = wasPlaying;
    state.playheadSec = wasAt;

    // Then type it. This is the step that used to not exist.
    if (analysis.mode !== 'silent') {
      await lyricTranscribe(audio, analysis);
    }

    showToast(analysis.mode === 'silent'
      ? 'No audio in that clip'
      : (state.lyricAsr && !state.lyricAsr.ignored
        ? `Transcribed ${state.lyricAsr.words.length} words into ${state.cues.length} captions`
        : `Detected ${state.cues.length} timed block${state.cues.length === 1 ? '' : 's'}`));
  } catch (err) {
    lyricSetStatus(`Could not read that clip: ${err && err.message ? err.message : err}. If it is a very large file, trim it first.`, 'bad');
    showToast('Auto-detect could not read that clip');
  } finally {
    state.lyricDetecting = false;
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('is-busy');
      btn.textContent = '◉ Detect & type captions';
    }
  }
}

function setLyricDetectMode(mode) {
  state.lyricDetectMode = mode;
  document.querySelectorAll('#lyrcDetectModes .lyrc-mode-btn').forEach((b) => {
    const on = b.dataset.lmode === mode;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  if (state.lyricAnalysis) {
    // re-run only the placement, not the listening
    const a = state.lyricAnalysis;
    a.mode = mode === 'auto' ? a.mode : mode;
    a.requestedMode = mode;
    syncLyricsToBeatCues();
    lyricSetStatus(lyricDescribe(a), 'good', 1);
  }
}

function loadTranscriptFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result || '');
    const looksSrt = /-->/.test(text);
    const lines = looksSrt
      ? text.split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !/^\d+$/.test(l) && !/-->/.test(l) && !/^WEBVTT/i.test(l))
      : text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) {
      lyricSetStatus('That file had no lines in it.', 'warn');
      return;
    }
    document.getElementById('lyricsRawInput').value = lines.join('\n');
    syncLyricsToBeatCues();
    lyricSetStatus(looksSrt
      ? `Loaded ${lines.length} subtitle lines from "${file.name}". Press ◉ Detect from clip to retime them to this clip.`
      : `Loaded ${lines.length} lines from "${file.name}". Press ◉ Detect from clip to time them to the audio.`,
      'good', state.lyricAnalysis ? 1 : 0);
    showToast(`Loaded ${lines.length} lines from ${file.name}`);
  };
  reader.readAsText(file);
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
  const timed = state.cues.filter((c) => c.timed !== false && String(c.text || '').trim());
  if (!timed.length) {
    lyricSetStatus('There is nothing timed to export yet — load a clip, press ◉ Detect from clip, then export.', 'warn');
    showToast('Nothing timed to export yet');
    return;
  }
  const srt = timed.map((c, i) => `${i + 1}\n${formatSrtTime(c.startSec)} --> ${formatSrtTime(c.endSec)}\n${c.text}\n`).join('\n');
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
      const layerParams = fxParamsOf({
        id: layer.id || layer.presetId || layer.effectType,
        effectType: layer.effectType,
        params: layer.params
      });
      drawCinemaOpticalShader(lctx, w, h, t, layer.effectType, intensity, onBeatPulse, grainAmount, layerParams);
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
  const recipe = recipeForLocal(layer.effectType || layer.presetId, layer.category)
    || recipeForLocal(layer.presetId, layer.category);
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
  const preset = state.activePreset;
  const effectType = preset ? (preset.effectType || 'opt_halation') : null;
  const intensity = preset ? effectiveIntensity(preset.id, state.playheadSec) / 100 : 0;
  const grainAmount = state.mixStylized / 100;
  const beatPhase = (t * (state.bpm / 60)) % 1;
  const onBeatPulse = Math.pow(Math.max(0, 1 - beatPhase * 3.5), 2.2);
  const fxP = preset ? fxParamsOf(preset) : {};
  const fxv = (key, fallback) => (fxP[key] === undefined ? fallback : fxP[key]);
  const smearFps = Math.max(1, fxv('quantise', 9));
  const renderTime = effectType === 'time_smear' ? Math.floor(t * smearFps) / smearFps : t;

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
    const drift = fxv('drift', 55) / 100;
    const rate = Math.max(0.1, fxv('rate', 17) / 10);
    const roll = fxv('roll', 40) / 100;
    dx = Math.sin(t * rate) * 9 * drift * intensity * scaleFactor;
    dy = Math.cos(t * rate * 0.76) * 7 * drift * intensity * scaleFactor;
    rot = Math.sin(t * rate * 0.53) * 0.012 * roll * intensity;
    scale = 1.02;
  } else if (effectType === 'opt_gateweave') {
    const amp = fxv('amplitude', 40) / 100;
    const speed = Math.max(1, fxv('speed', 19));
    const breath = fxv('breath', 30) / 100;
    dx = (Math.sin(t * speed) * 1.4 + Math.cos(t * speed * 1.6) * 0.9) * amp * intensity * scaleFactor;
    dy = Math.cos(t * speed * 1.2) * 1.2 * amp * intensity * scaleFactor;
    scale = 1 + breath * 0.03 * intensity;
  } else if (effectType === 'cam_thump' || state.hitFlashBurst > 0.05) {
    const impact = fxv('impact', 100) / 100;
    const shakeP = fxv('shake', 35) / 100;
    const thump = (0.075 * intensity * onBeatPulse * impact) + (state.hitFlashBurst * 0.09);
    scale = 1.0 + thump;
    dx = Math.cos(beatPhase * Math.PI * 2) * 2.2 * thump * 10 * shakeP * scaleFactor;
  } else if (effectType === 'time_velocity') {
    scale = 1.0 + 0.16 * intensity * Math.pow(onBeatPulse, 1.5) * (0.4 + fxv('exposure', 60) / 100);
  } else if (effectType === 'cam_whip') {
    const dist = fxv('distance', 60) / 100;
    const settle = fxv('settle', 40) / 100;
    dx = Math.pow(onBeatPulse, 2 + settle) * 58 * intensity * (Math.floor(t) % 2 === 0 ? 1 : -1) * (0.4 + dist) * scaleFactor;
    scale = 1 + 0.06 * (0.5 + dist);
  } else if (effectType === 'cam_handheld') {
    const sway = fxv('sway', 50) / 100;
    const speed = Math.max(0.2, fxv('speed', 12) / 10);
    const jitter = fxv('jitter', 30) / 100;
    const breathe = fxv('breathe', 25) / 100;
    dx = (Math.sin(t * speed) * 8 * sway + Math.sin(t * speed * 7.3) * 1.6 * jitter) * intensity * scaleFactor;
    dy = (Math.cos(t * speed * 0.81) * 6 * sway + Math.cos(t * speed * 9.1) * 1.4 * jitter) * intensity * scaleFactor;
    rot = Math.sin(t * speed * 0.6) * 0.008 * sway * intensity;
    scale = 1.03 + Math.sin(t * speed * 0.45) * 0.004 * breathe;
  } else if (effectType === 'cam_dolly_punch') {
    const punch = fxv('punch', 100) / 100;
    const ease = fxv('ease', 50) / 100;
    const settleDrift = fxv('settle', 40) / 100;
    scale = 1.01 + Math.pow(onBeatPulse, 1 + (1 - ease) * 3) * 0.18 * punch * intensity;
    dy = Math.sin(t * 0.35) * 2.5 * settleDrift * intensity * scaleFactor;
  } else if (effectType === 'cam_truck') {
    const dist = fxv('distance', 45) / 100;
    const rate = Math.max(0.1, fxv('rate', 8) / 10);
    dx = Math.sin(t * rate) * w * 0.05 * dist * intensity;
    scale = Math.max(1, fxv('zoom', 108) / 100);
  } else if (effectType === 'cam_roll_pulse') {
    const amt = fxv('roll', 45) / 100;
    const attack = fxv('attack', 20) / 100;
    const settleP = fxv('settle', 55) / 100;
    const env = Math.pow(onBeatPulse, 1 + attack * 3) * (1 - settleP * 0.6);
    rot = env * amt * 0.09 * intensity;
    scale = 1.02;
  } else if (effectType === 'ed_punch_in') {
    const zoomP = Math.max(1, fxv('zoom', 118) / 100);
    scale = 1 + (zoomP - 1) * Math.min(1, intensity);
    dx = (fxv('panX', 0) / 100) * w * 0.25;
    dy = (fxv('panY', 0) / 100) * h * 0.25;
  } else if (effectType === 'cam_push_drift') {
    const pushP = fxv('push', 45) / 100;
    const rateP = Math.max(0.1, fxv('rate', 6) / 10);
    const driftP = fxv('drift', 30) / 100;
    const cycle = 0.5 - 0.5 * Math.cos(t * rateP);
    scale = 1 + pushP * 0.12 * cycle * intensity;
    dx = Math.sin(t * rateP * 0.5) * w * 0.02 * driftP * intensity;
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
  if (state.presetPicked && effectType) {
    drawCinemaOpticalShader(ctx, w, h, renderTime, effectType, intensity, onBeatPulse, grainAmount, fxP);
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
      {
        focus: d.focus / 100,
        aperture: d.aperture,
        time: t,
        // the slice reads the panel's depth range, so near/far are set once
        near: (d.nearPoint || 0) / 100,
        far: (d.farPoint === undefined ? 100 : d.farPoint) / 100,
        feather: Math.max(0.01, (100 - (d.sliceFeather === undefined ? 15 : d.sliceFeather)) / 100 * 0.4)
      }
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
  // the render bay is another door a clip can come in through; the caption tab
  // decodes this file, so it has to know about it
  if (!file) return;
  const kind = /^image\//.test(file.type) || /\.(png|jpe?g|webp|tiff?|bmp|avif)$/i.test(file.name)
    ? 'image' : 'video';
  rbSyncMemory();
  rbLogLine(`Importing ${file.name} (${RENDER_ENGINE.formatBytes(file.size)}) …`);
  if (kind === 'video') {
    state.plateFile = file;      // the caption tab decodes this same file
    state.lyricAnalysis = null;
  }

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
    videoEl.muted = !state.stageSound;
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
    // A depth map belongs to a shot, not to a frame. Default: analyse once,
    // then use it until the footage or the frame range changes.
    live: false,
    follow: false,           // re-run the model while the clip plays
    invert: false,
    smooth: 2,
    contrast: 55,
    nearBias: 50,
    // ---- the map itself (the part that makes it usable, not decorative) ---
    nearPoint: 0,            // 0..1 — clip the near end of the raw map
    farPoint: 100,           // 0..100 — clip the far end
    gamma: 100,              // 40..220, % — shape the falloff
    refine: 35,              // 0..100 — edge refinement against the picture
    palette: 'gray',         // gray | ice | ember | viridis | cobalt | mono
    raw: null,               // Float32Array straight from the model / file
    rawW: 0,
    rawH: 0,
    mapSec: null,            // which moment of the clip this map describes
    mapLabel: '',            // 'AI' | 'Fast' | 'Loaded' | 'Mask'
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

// The raw model output is kept untouched; everything the user changes on the
// panel (near point, far point, gamma, invert, edge refine) is a *derivation*.
// That means dragging a slider re-shapes the map instantly — no second model
// run, no 3-second wait to see what a control does.
function depthDerive(optReason) {
  const d = ensureDepthState();
  if (!d.raw || !d.rawW || !d.rawH) return false;
  const w = d.rawW;
  const h = d.rawH;
  let map = DEPTH_ENGINE.remap(d.raw, {
    near: (d.nearPoint || 0) / 100,
    far: (d.farPoint === undefined ? 100 : d.farPoint) / 100,
    gamma: Math.max(0.2, (d.gamma || 100) / 100),
    invert: !!d.invert
  });
  if (d.refine > 0.5) {
    // refine against the frame the map was built from, not the current one
    const luma = depthRefineLuma;
    if (luma && luma.w === w && luma.h === h) {
      map = DEPTH_ENGINE.refine(map, luma.data, w, h, d.refine, d.invert);
    }
  }
  d.map = map;
  d.mapW = w;
  d.mapH = h;
  d.dirty = false;
  if (optReason) d.status = optReason;
  return true;
}

// Keep a copy of the frame that produced the map, so edge refinement has the
// right picture to snap to even after the clip has moved on.
let depthRefineLuma = null;
function depthStoreFrame(img) {
  if (!img) { depthRefineLuma = null; return; }
  depthRefineLuma = {
    data: new Uint8ClampedArray(img.data),
    w: img.width,
    h: img.height
  };
}

function depthSetRaw(raw, w, h, label) {
  const d = ensureDepthState();
  d.raw = raw;
  d.rawW = w;
  d.rawH = h;
  d.mapLabel = label || d.mapLabel;
  d.mapSec = state.playheadSec;
  depthRefineLuma = null;
  return d;
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
    depthSetRaw(d.loadedMap.slice(), d.loadedMapW || DEPTH_W, d.loadedMapH || DEPTH_H, 'Loaded');
    depthDerive('Using the loaded depth map. Every effect below is now accurate to that map.');
    if (!o.silent) depthSyncUI();
    return;
  }
  if (d.source === 'mask') {
    if (!m || !m.soft) {
      d.status = 'No Magic Mask yet — open Masking in the left menu, click your subject, then come back.';
      depthSyncUI();
      return;
    }
    const small = DEPTH_ENGINE.fromMask(m.soft, MASK_W, MASK_H, 0.35);
    const full = DEPTH_ENGINE.resizeDepth(small, MASK_W, MASK_H, DEPTH_W, DEPTH_H);
    depthSetRaw(full, DEPTH_W, DEPTH_H, 'Mask');
    depthDerive('Depth from the Magic Mask: subject near, everything else far.');
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
  const est = DEPTH_ENGINE.estimate(
    { data: img.data, width: sw, height: sh },
    {
      smooth: d.smooth,
      contrast: d.contrast,
      nearBias: d.nearBias,
      invert: false,
      mask: m && m.soft ? m.soft : null,
      maskW: MASK_W,
      maskH: MASK_H
    }
  );
  depthSetRaw(est, sw, sh, 'Fast');
  depthStoreFrame({ data: img.data, width: sw, height: sh });
  depthDerive();
  if (o.silent) { depthSyncUI(); return; }
  d.status = m && m.soft
    ? 'Depth estimated from the plate, with your Magic Mask pinning the subject to the front.'
    : 'Depth estimated from the plate (haze, height, detail, saturation). Switch to AI depth for real geometry.';
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
  if (d.engine === 'ai' && !d.follow) return false;  // locked to the shot
  if (state.activeTab !== 'depth' && !depthEffectsOn().count) return false;
  return true;
}

function depthLiveTick(nowMs) {
  if (!state.motion || !state.isPlaying || document.hidden) return;
  if (!depthLiveWanted()) return;
  const dd = ensureDepthState();
  if (dd.engine === 'ai') {
    // A model pass takes seconds, so by default the map is *locked to the
    // shot*: the effects keep using it while the clip plays and nothing
    // flickers. Follow mode opts into re-running, and the result is blended.
    if (!dd.follow) return;
    if (dd.aiBusy) return;
    if (nowMs - depthAiLastRun < DEPTH_AI_FOLLOW_MS) return;
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
// How much of a new map a follow-mode pass is allowed to contribute. Low
// enough that consecutive passes settle instead of popping.
const DEPTH_AI_BLEND = 0.4;
// Follow mode is slow on purpose: one pass every few seconds keeps the depth
// roughly on the subject without hammering a single WASM thread.
const DEPTH_AI_FOLLOW_MS = 4200;

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
      const fresh = msg.map instanceof Float32Array ? msg.map : new Float32Array(msg.map);
      // Following motion? Blend the new map into the old one instead of
      // replacing it, so a per-frame model run cannot make the effects flicker.
      const prev = d.raw;
      if (d.follow && prev && prev.length === fresh.length) {
        const a = DEPTH_AI_BLEND;
        for (let i = 0; i < fresh.length; i++) fresh[i] = prev[i] * (1 - a) + fresh[i] * a;
      }
      depthSetRaw(fresh, msg.width, msg.height, 'AI');
      depthDerive();
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
  depthStoreFrame(frame);
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
  setText('depthFocusVal', d.focus + '%');
  setText('depthApertureVal', d.aperture + '%');
  setText('depthSliceFeatherVal', (d.sliceFeather === undefined ? 15 : d.sliceFeather) + '%');
  setText('depthNearPtVal', Math.round(d.nearPoint || 0) + '%');
  setText('depthFarPtVal', Math.round(d.farPoint === undefined ? 100 : d.farPoint) + '%');
  setText('depthGammaVal', (Math.max(0.2, (d.gamma || 100) / 100)).toFixed(2));
  setText('depthRefineVal', Math.round(d.refine || 0) + '%');
  setText('depthRangeReadout', `${Math.round(d.nearPoint || 0)} – ${Math.round(d.farPoint === undefined ? 100 : d.farPoint)}`);
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
    liveBtn.textContent = 'Follow motion: ' + (d.follow ? 'ON' : 'OFF');
    liveBtn.classList.toggle('is-on', !!d.follow);
    liveBtn.classList.toggle('is-off', !d.follow);
    liveBtn.setAttribute('aria-pressed', d.follow ? 'true' : 'false');
  }
  const palSel = document.getElementById('depthPaletteSelect');
  if (palSel && palSel.value !== (d.palette || 'gray')) palSel.value = d.palette || 'gray';
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
        const gray = DEPTH_ENGINE.toPalette
          ? DEPTH_ENGINE.toPalette(d.map, d.mapW || DEPTH_W, d.mapH || DEPTH_H, {
            invert: !!d.invert,
            palette: d.palette || 'gray'
          })
          : DEPTH_ENGINE.toGray(d.map, d.mapW || DEPTH_W, d.mapH || DEPTH_H, false);
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
  idata.data.set(DEPTH_ENGINE.toPalette ? DEPTH_ENGINE.toPalette(d.map, mw, mh, {
    invert: !!d.invert,
    palette: d.palette || 'gray'
  }) : DEPTH_ENGINE.toGray(d.map, mw, mh, false));
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
    // The export follows the palette on screen, but a colourised map is not a
    // depth map: quantise it to grayscale for anything downstream, and say so.
    const colourised = (d.palette || 'gray') !== 'gray';
    idata.data.set(colourised
      ? DEPTH_ENGINE.toPalette(d.map, mw, mh, { invert: !!d.invert, palette: d.palette })
      : DEPTH_ENGINE.toGray(d.map, mw, mh, !!d.invert));
    sctx.putImageData(idata, 0, 0);
    cctx.imageSmoothingEnabled = true;
    cctx.drawImage(small, 0, 0, W, H);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `PulseVFX_DepthMap_${colourised ? d.palette : 'gray'}_${d.source}_1920x1080.png`;
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
  slider('depthFocus', 'focus');
  slider('depthAperture', 'aperture');
  slider('depthSliceFeather', 'sliceFeather');
  // These four reshape the map that already exists — instant, no model run.
  slider('depthNearPoint', 'nearPoint', () => depthDerive());
  slider('depthFarPoint', 'farPoint', () => depthDerive());
  slider('depthGamma', 'gamma', () => depthDerive());
  slider('depthRefine', 'refine', () => depthDerive());

  const paletteSel = document.getElementById('depthPaletteSelect');
  if (paletteSel) {
    paletteSel.addEventListener('change', () => {
      d.palette = paletteSel.value || 'gray';
      depthSyncUI();
    });
  }

  const inv = document.getElementById('depthInvertBtn');
  if (inv) {
    inv.addEventListener('click', () => {
      d.invert = !d.invert;
      // Invert is a view of the map, not a rewrite of it: flipping the raw
      // buffer meant pressing it twice gave you an unusable map.
      if (!depthDerive()) depthRescan();
    });
  }

  const rescan = document.getElementById('depthRescanBtn');
  if (rescan) rescan.addEventListener('click', () => depthRescan());
  const liveBtn = document.getElementById('depthLiveBtn');
  if (liveBtn) {
    liveBtn.addEventListener('click', () => {
      d.follow = !d.follow;
      d.live = d.follow;
      depthSyncUI();
      if (d.follow) depthRescan();
      showToast(d.follow
        ? 'Follow motion on — the map re-reads every few seconds and blends, so it will not flicker'
        : 'Follow motion off — the map stays locked to the shot you analysed');
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
const MASK_W = 320;
const MASK_H = 180;
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
// ---------------------------------------------------------------- smart select
// A magic wand needs more than one colour threshold. On a real frame a single
// threshold either leaks into the wall or misses the subject's own shadows,
// which is exactly why "click the subject" used to select nothing (or the room).
// This grows the selection in three passes instead:
//
//   1. hysteresis   — a loose limit to travel through, a tight one to be trusted
//   2. local follow — a pixel far from the clicked colour but close to the pixel
//                     it touches is still the same surface (folds, shading)
//   3. cleanup      — pinholes filled, so the traced polygon is not swiss cheese
//
// The edge map is the wall: growth stops at a hard luminance step, so a subject
// cannot spill into a background it is silhouetted against.
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

  // Reference colours: a 3x3 patch around every click, so a noisy plate cannot
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

  // mode-specific limits (0..255 colour space)
  const base = mode === 'luma' ? sensitivity * 0.7
    : mode === 'sky' ? sensitivity * 3.4
      : mode === 'skin' ? sensitivity * 2.6
        : mode === 'color' ? sensitivity * 2.2
          : sensitivity * 2.0;
  const edgeLimit = mode === 'subject' ? 30 + sensitivity * 1.15
    : mode === 'skin' ? 34 + sensitivity * 1.2
      : mode === 'sky' ? 60 + sensitivity * 1.6
        : mode === 'color' ? 90 + sensitivity
          : Infinity;
  const localTol = 12 + sensitivity * 0.6;
  const skyTop = h * 0.68;

  // distance from every pixel to the closest clicked colour, computed once
  const dist = new Float32Array(w * h);
  for (let i = 0, n = w * h; i < n; i++) {
    const p = i * 4;
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    let best = Infinity;
    for (let k = 0; k < ref.length; k++) {
      const c = ref[k];
      const dr = r - c[0];
      const dg = g - c[1];
      const db = b - c[2];
      const d2 = dr * dr + dg * dg + db * db;
      if (d2 < best) best = d2;
    }
    dist[i] = Math.sqrt(best);
  }

  const near = (p, q) => {
    const dr = data[p] - data[q];
    const dg = data[p + 1] - data[q + 1];
    const db = data[p + 2] - data[q + 2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  const run = (hi) => {
    const buf = new Uint8Array(w * h);
    const stack = new Int32Array(w * h);
    let sp = 0;
    seedPx.forEach((p) => {
      const i = p.y * w + p.x;
      if (!buf[i]) { buf[i] = 255; stack[sp++] = i; }
    });
    while (sp > 0) {
      const i = stack[--sp];
      const x = i % w;
      const y = (i - x) / w;
      const p = i * 4;
      for (let k = 0; k < 4; k++) {
        const j = k === 0 ? (x > 0 ? i - 1 : -1)
          : k === 1 ? (x < w - 1 ? i + 1 : -1)
            : k === 2 ? (y > 0 ? i - w : -1)
              : (y < h - 1 ? i + w : -1);
        if (j < 0 || buf[j]) continue;
        const nx = j % w;
        const ny = (j - nx) / w;
        const q = j * 4;

        // hard walls first
        if (grad[j] > edgeLimit) continue;
        if (mode === 'sky' && ny > skyTop) continue;
        if (mode === 'luma') {
          if (Math.abs(luma[j] - refLuma) > hi) continue;
          buf[j] = 255; stack[sp++] = j;
          continue;
        }
        if (mode === 'skin') {
          const r = data[q];
          const g = data[q + 1];
          const b = data[q + 2];
          const skinLike = r > 92 && r > g * 1.12 && g > b * 0.92;
          const close = dist[j] <= hi;
          const local = dist[j] <= hi * 4 && near(p, q) <= localTol;
          if (!skinLike && !close && !local) continue;
          buf[j] = 255; stack[sp++] = j;
          continue;
        }

        const close = dist[j] <= hi;
        // follow the surface: far from the click, but continuous with its parent
        const local = dist[j] <= hi * 4 && near(p, q) <= localTol;
        if (!close && !local) continue;
        buf[j] = 255;
        stack[sp++] = j;
      }
    }
    return maskFillHoles(buf, w, h);
  };

  let buf = run(base);
  const frac = maskCoverage(buf);
  // Nothing matched, or the whole frame did: one corrective pass at a sane
  // limit is far better than telling the editor to go hunting through sliders.
  if (o.autoTune !== false) {
    if (frac < 0.004) buf = run(base * 1.8);
    else if (frac > 0.9) buf = run(base * 0.5);
  }
  out.set(buf);
  return out;
}

// Any unselected pocket the border cannot reach is a hole inside the subject
// (a logo, a shadow, a highlight) and belongs to the matte.
function maskFillHoles(buf, w, h) {
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let sp = 0;
  const push = (i) => { if (!seen[i] && buf[i] < 110) { seen[i] = 1; stack[sp++] = i; } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (sp > 0) {
    const i = stack[--sp];
    const x = i % w;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (i >= w) push(i - w);
    if (i < w * (h - 1)) push(i + w);
  }
  const filled = Uint8Array.from(buf);
  for (let i = 0, n = w * h; i < n; i++) {
    if (!seen[i] && filled[i] < 110) filled[i] = 255;
  }
  return filled;
}

// ------------------------------------------------------------- click select
// A colour flood asks "is this pixel like the one I clicked?", and on a dark,
// graded frame the answer is yes almost everywhere: the frame above selected
// 99.9% of the picture. A person also does not fill the frame — so the region
// grows from the click, learns the subject from a small patch and the
// background from a ring around it, and is bounded by distance, area and the
// click itself. That is what keeps a matte on a subject instead of on a wall.
function maskClickSelect(data, seed, opts) {
  const o = opts || {};
  const w = MASK_W;
  const h = MASK_H;
  const sx = Math.round(maskClamp01(seed.x) * (w - 1));
  const sy = Math.round(maskClamp01(seed.y) * (h - 1));
  const out = new Uint8Array(w * h);
  if (!data || !data.length) return out;

  const minWH = Math.min(w, h);
  const fgR = Math.max(5, Math.round(minWH * 0.045));
  const bgR0 = Math.round(fgR * 2.1);
  const bgR1 = Math.round(fgR * 5.2);
  const winW = Math.round(w * 0.34);
  const winH = Math.round(h * 0.82);
  const wx0 = Math.max(0, sx - (winW >> 1));
  const wx1 = Math.min(w - 1, sx + (winW >> 1));
  const wy0 = Math.max(0, sy - (winH >> 1));
  const wy1 = Math.min(h - 1, sy + (winH >> 1));

  const fg = new Float64Array(MASK_HIST_BINS);
  const bg = new Float64Array(MASK_HIST_BINS);
  let fgN = 0;
  let bgN = 0;
  for (let y = wy0; y <= wy1; y++) {
    for (let x = wx0; x <= wx1; x++) {
      const d = Math.hypot(x - sx, y - sy);
      if (d > bgR1 && d > fgR) continue;
      const p = (y * w + x) * 4;
      const b = maskHistIndex(data[p], data[p + 1], data[p + 2]);
      if (d <= fgR) { fg[b] += 1; fgN++; } else if (d >= bgR0) { bg[b] += 1; bgN++; }
    }
  }
  if (!fgN) return out;
  for (let i = 0; i < MASK_HIST_BINS; i++) {
    fg[i] /= fgN;
    if (bgN) bg[i] /= bgN;
  }
  const lo = o.lo === undefined ? -0.05 : o.lo;
  const hi = o.hi === undefined ? 0.4 : o.hi;
  const maxDepth = o.maxDepth || Math.round(h * 0.62);
  const maxArea = o.maxArea || Math.round(w * h * 0.18);

  // travel only through pixels that look more like the subject than the
  // background; start from the click and keep whatever the click can reach
  const seen = new Int32Array(w * h).fill(-1);
  const queue = new Int32Array(w * h);
  const start = sy * w + sx;
  if (start < 0 || start >= w * h) return out;
  queue[0] = start;
  seen[start] = 0;
  let head = 0;
  let tail = 1;
  let area = 0;
  const p0 = start * 4;
  const startScore = Math.log((fg[maskHistIndex(data[p0], data[p0 + 1], data[p0 + 2])] + 0.003)
    / (bg[maskHistIndex(data[p0], data[p0 + 1], data[p0 + 2])] + 0.003));
  // clicking on something the model scores as background still has to select
  // something, so the start pixel is always accepted
  void startScore;
  while (head < tail) {
    const i = queue[head++];
    area++;
    if (area > maxArea) break;
    const depth = seen[i];
    if (depth >= maxDepth) continue;
    const x = i % w;
    const y = (i - x) / w;
    const nb = [
      x > wx0 ? i - 1 : -1,
      x < wx1 ? i + 1 : -1,
      y > wy0 ? i - w : -1,
      y < wy1 ? i + w : -1
    ];
    for (let k = 0; k < 4; k++) {
      const j = nb[k];
      if (j < 0 || seen[j] >= 0) continue;
      const q = j * 4;
      const sc = Math.log((fg[maskHistIndex(data[q], data[q + 1], data[q + 2])] + 0.003)
        / (bg[maskHistIndex(data[q], data[q + 1], data[q + 2])] + 0.003));
      if (sc <= lo) continue;
      if (sc <= hi && depth > maxDepth * 0.55) continue;   // only strong beyond halfway
      seen[j] = depth + 1;
      queue[tail++] = j;
    }
  }
  for (let k = 0; k < tail; k++) out[queue[k]] = 255;

  // A matte that swallowed most of the frame is not a subject: retry tighter,
  // then give up rather than hand back the wall.
  const cov = maskCoverage(out);
  if (cov > 0.45 && o.retry !== false) {
    return maskClickSelect(data, seed, Object.assign({}, o, {
      lo: lo - 0.5,
      hi: hi - 0.3,
      maxArea: Math.round(maxArea * 0.35),
      retry: false
    }));
  }
  if (cov > 0.45) return new Uint8Array(w * h);
  return maskFillHoles(out, w, h);
}

// ----------------------------------------------------------- colour-model track
// A tracker needs a memory of what the subject looks like, not just where the
// last outline was. This builds a small 8x8x8 colour model of the subject and of
// its immediate surroundings, so every later frame can be scored as "subject" or
// "background" — the same idea Magic Mask uses, done here on the browser's own
// pixels so it works with Resolve Free and with anything else.
const MASK_HIST_BINS = 512;

function maskHistIndex(r, g, b) {
  return ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
}

// Bounding box of everything the matte selects, or null when it is empty.
function maskBBox(buf, w, h) {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      if (buf[row + x] <= 110) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null;
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function maskPolyCentroid(poly) {
  if (!poly || !poly.length) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  poly.forEach((p) => { x += p.x; y += p.y; });
  return { x: x / poly.length, y: y / poly.length };
}

// Normalised subject/background histograms from one frame plus a matte. The
// background is sampled from a ring around the matte, so a bright wall far away
// cannot drag the model off.
// The middle of the matte, with its rim shaved off. A box around a person is
// half background: learning from the rim teaches the model that the wall is the
// subject, and then every frame it picks a different piece of the wall. That is
// exactly what made the outline jump.
function maskCoreOf(buf, w, h) {
  const bb = maskBBox(buf, w, h);
  if (!bb) return null;
  const shrink = Math.max(2, Math.min(9, Math.round(Math.min(bb.w, bb.h) * 0.2)));
  // erosion by a small square keeps the interior and drops the boundary
  let core = buf;
  for (let s = 0; s < shrink; s++) {
    const next = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      const row = y * w;
      for (let x = 1; x < w - 1; x++) {
        const i = row + x;
        if (core[i] <= 110) continue;
        next[i] = Math.min(
          core[i - 1], core[i + 1], core[i - w], core[i + w],
          core[i - w - 1], core[i - w + 1], core[i + w - 1], core[i + w + 1]
        ) > 110 ? 255 : 0;
      }
    }
    core = next;
  }
  let area = 0;
  for (let i = 0; i < core.length; i++) if (core[i] > 110) area++;
  // a thin matte (a hand-drawn outline, a sliver) has no interior to speak of
  if (area < 20) return { buf, weight: 0.35 };
  return { buf: core, weight: 1 };
}

function maskBuildColorModel(data, w, h, buf, prev, extra) {
  if (!data || !buf) return prev || null;
  const bb = maskBBox(buf, w, h);
  if (!bb) return prev || null;
  const core = maskCoreOf(buf, w, h) || { buf, weight: 0.35 };
  const pad = Math.max(8, Math.round(Math.max(bb.w, bb.h) * 0.45));
  const x0 = Math.max(0, bb.x0 - pad);
  const x1 = Math.min(w - 1, bb.x1 + pad);
  const y0 = Math.max(0, bb.y0 - pad);
  const y1 = Math.min(h - 1, bb.y1 + pad);
  const fg = new Float64Array(MASK_HIST_BINS);
  const bg = new Float64Array(MASK_HIST_BINS);
  let fgN = 0;
  let bgN = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = y * w + x;
      const p = i * 4;
      const idx = maskHistIndex(data[p], data[p + 1], data[p + 2]);
      // the "background" sample is the ring around the matte, never the rim
      // inside it, so a box's corners do not get counted as subject
      const insideCore = core.buf[i] > 110;
      const insideMatte = buf[i] > 110;
      if (insideCore) { fg[idx] += core.weight; fgN += core.weight; }
      else if (!insideMatte) { bg[idx] += 1; bgN += 1; }
    }
  }
  // Strokes are explicit instructions: sample them first and hard, so one
  // correction outweighs thousands of pixels the auto-select got wrong.
  if (extra) {
    const weigh = (pts, hist, isFg) => {
      (pts || []).forEach((p) => {
        const x = Math.round(maskClamp01(p.x) * (w - 1));
        const y = Math.round(maskClamp01(p.y) * (h - 1));
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const q = (ny * w + nx) * 4;
            const b = maskHistIndex(data[q], data[q + 1], data[q + 2]);
            // weight=6 is "listen to this", not "ignore the picture"
            hist[b] += 6;
            if (isFg) fgN += 6; else bgN += 6;
          }
        }
      });
    };
    weigh(extra.fg, fg, true);
    weigh(extra.bg, bg, false);
  }
  if (!fgN || !bgN) return prev || null;
  // Slow adaptation only: a light change should not rewrite what the subject is.
  const mix = (mine, mineN, theirs) => {
    for (let i = 0; i < MASK_HIST_BINS; i++) {
      const share = mine[i] / mineN;
      mine[i] = theirs ? share * 0.78 + theirs[i] * 0.22 : share;
    }
  };
  mix(fg, fgN, prev && prev.fg);
  mix(bg, bgN, prev && prev.bg);
  // The model from the frame you drew is kept for good. Without this the matte
  // learns from its own shrinking result: each frame it selects a little less,
  // the next model is a little narrower, and the outline collapses inwards.
  const refFg = (prev && prev.refFg) || fg;
  const refBg = (prev && prev.refBg) || bg;
  return { fg, bg, refFg, refBg };
}

// How much more likely this colour is to belong to the subject than to the
// background: positive means subject, negative means background.
function maskModelScore(model, data, p) {
  if (!model) return 0;
  const idx = maskHistIndex(data[p], data[p + 1], data[p + 2]);
  const refFg = model.refFg || model.fg;
  const refBg = model.refBg || model.bg;
  // 60% what the subject looked like when it was picked, 40% what it looks like
  // now — steady against drift, still able to follow a light change
  const pf = (refFg[idx] * 0.6 + model.fg[idx] * 0.4) + 0.0025;
  const pb = (refBg[idx] * 0.6 + model.bg[idx] * 0.4) + 0.0025;
  return Math.log(pf / pb);
}

// Where the subject should be next: last box, moved by the measured velocity and
// opened up so a fast move is still inside the search window.
function maskPredictBox(prev, vel, grow) {
  const w = MASK_W;
  const h = MASK_H;
  const bb = prev.box || { x0: 0, y0: 0, x1: w - 1, y1: h - 1, w, h };
  const cx = (bb.x0 + bb.x1) / 2 + (vel ? vel.x : 0);
  const cy = (bb.y0 + bb.y1) / 2 + (vel ? vel.y : 0);
  const bw = Math.max(14, bb.w * (1 + grow));
  const bh = Math.max(14, bb.h * (1 + grow));
  return {
    x0: Math.max(0, Math.round(cx - bw / 2)),
    y0: Math.max(0, Math.round(cy - bh / 2)),
    x1: Math.min(w - 1, Math.round(cx + bw / 2)),
    y1: Math.min(h - 1, Math.round(cy + bh / 2))
  };
}

// Classify the search window with the colour model, grow only from pixels that
// are strongly subject-like, then keep the blob nearest the prediction. This is
// what stops the matte either freezing in place or swallowing the room.
function maskSolveModel(data, model, box, hi, lo) {
  const w = MASK_W;
  const h = MASK_H;
  if (!box || box.x1 < box.x0 || box.y1 < box.y0) return null;

  const weak = new Uint8Array(w * h);
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let count = 0;
  const seeds = [];
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      const i = y * w + x;
      const score = maskModelScore(model, data, i * 4);
      if (score > lo) weak[i] = 1;
      if (score > hi) seeds.push(i);
    }
  }
  if (!seeds.length) return null;

  // hysteresis flood: travel through subject-likely pixels, start only from
  // confident ones
  seeds.forEach((i) => {
    if (seen[i] || !weak[i]) return;
    seen[i] = 1;
    stack[count++] = i;
  });
  let sp = 0;
  while (sp < count) {
    const i = stack[sp++];
    const x = i % w;
    const y = (i - x) / w;
    const nb = [
      x > box.x0 ? i - 1 : -1,
      x < box.x1 ? i + 1 : -1,
      y > box.y0 ? i - w : -1,
      y < box.y1 ? i + w : -1
    ];
    for (let t = 0; t < 4; t++) {
      const j = nb[t];
      if (j < 0 || seen[j] || !weak[j]) continue;
      seen[j] = 1;
      stack[count++] = j;
    }
  }
  if (!count) return null;

  // split into connected blobs and keep the one nearest the prediction: a
  // same-coloured lamp behind the subject must not get bolted onto the matte
  const label = new Int32Array(w * h);
  const comps = [];
  const cx = (box.x0 + box.x1) / 2;
  const cy = (box.y0 + box.y1) / 2;
  for (let k = 0; k < count; k++) {
    const start = stack[k];
    if (label[start]) continue;
    const id = comps.length + 1;
    let head = 0;
    const queue = [start];
    label[start] = id;
    let area = 0;
    let sx = 0;
    let sy = 0;
    while (head < queue.length) {
      const i = queue[head++];
      const x = i % w;
      const y = (i - x) / w;
      area++;
      sx += x;
      sy += y;
      const nb = [
        x > box.x0 ? i - 1 : -1,
        x < box.x1 ? i + 1 : -1,
        y > box.y0 ? i - w : -1,
        y < box.y1 ? i + w : -1
      ];
      for (let t = 0; t < 4; t++) {
        const j = nb[t];
        if (j < 0 || label[j] || !seen[j]) continue;
        label[j] = id;
        queue.push(j);
      }
    }
    const mx = sx / Math.max(1, area);
    const my = sy / Math.max(1, area);
    comps.push({ id, area, dist: Math.hypot(mx - cx, my - cy) });
  }
  if (!comps.length) return null;
  // Proximity dominates: a big blob on the other side of the frame is a
  // distractor, not the subject. Blobs that barely touch the prediction are out.
  const wantArea = Math.max(20, (box.x1 - box.x0) * (box.y1 - box.y0) * 0.12);
  let best = null;
  let bestScore = -Infinity;
  comps.forEach((info) => {
    if (info.area < wantArea * 0.25) return;
    const score = Math.log(1 + info.area) * 0.5 - info.dist * 5.5;
    if (score > bestScore) { bestScore = score; best = info.id; }
  });
  if (!best) return null;

  const out = new Uint8Array(w * h);
  let kept = 0;
  let border = 0;
  const bw = box.x1 - box.x0;
  const bh = box.y1 - box.y0;
  const perimeter = Math.max(1, 2 * (bw + bh));
  for (let k = 0; k < count; k++) {
    const i = stack[k];
    if (label[i] !== best) continue;
    out[i] = 255;
    kept++;
    const x = i % w;
    const y = (i - x) / w;
    if (x === box.x0 || x === box.x1 || y === box.y0 || y === box.y1) border++;
  }
  if (!kept) return null;
  // A blob that fills its own search window, or runs along most of the window
  // edge, means the classifier matched everything — that is a lost subject, not
  // a subject that suddenly grew. Refuse it instead of painting the room.
  if (kept > w * h * 0.55) return null;
  if (border / perimeter > 0.5) return null;
  return maskFillHoles(out, w, h);
}

// The search window may move, but it must not shrink below the subject's own
// size: a window built from last frame's mask shrinks the mask, which shrinks
// the window — that feedback is what walked the matte down to a bright dot.
function maskBoxWithFloor(box, minW, minH) {
  if (!box) return box;
  const cx = (box.x0 + box.x1) / 2;
  const cy = (box.y0 + box.y1) / 2;
  const w = Math.max(box.x1 - box.x0, minW || 0);
  const h = Math.max(box.y1 - box.y0, minH || 0);
  return {
    x0: Math.max(0, Math.round(cx - w / 2)),
    y0: Math.max(0, Math.round(cy - h / 2)),
    x1: Math.min(MASK_W - 1, Math.round(cx + w / 2)),
    y1: Math.min(MASK_H - 1, Math.round(cy + h / 2))
  };
}

// ------------------------------------------------------- template matching
// The reliable way to follow a subject between two frames is to find where the
// last frame's picture went. That is a bounded, local search — it cannot jump
// across the frame the way a recolour can — and it does not care what colour
// the subject is, which matters when the clothes and the room are both black.
function maskLuma(data, w, h) {
  const out = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    out[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }
  return out;
}

// Absolute template search: the reference patch is compared against the current
// frame at every candidate position near a guess, and the best match is refined
// to sub-pixel precision. Because the comparison is always against the same
// reference picture, small measurement errors cannot accumulate into drift.
function maskTemplateAt(refLuma, curLuma, refMask, guess, limit) {
  const w = MASK_W;
  const h = MASK_H;
  const lim = Math.max(2, Math.min(16, limit || 10));
  const base = { x: guess ? guess.x : 0, y: guess ? guess.y : 0 };
  if (!refLuma || !curLuma || !refMask) return { x: base.x, y: base.y, score: 0 };
  const bb = maskBBox(refMask, w, h);
  if (!bb) return { x: base.x, y: base.y, score: 0 };
  const stepX = Math.max(1, Math.round(bb.w / 24));
  const stepY = Math.max(1, Math.round(bb.h / 24));
  const samples = [];
  for (let y = bb.y0; y <= bb.y1; y += stepY) {
    for (let x = bb.x0; x <= bb.x1; x += stepX) {
      if (refMask[y * w + x] > 110) samples.push(y * w + x);
    }
  }
  if (samples.length < 20) return { x: base.x, y: base.y, score: 0 };
  let mean = 0;
  samples.forEach((i) => { mean += refLuma[i]; });
  mean /= samples.length;
  let varP = 0;
  samples.forEach((i) => { varP += (refLuma[i] - mean) ** 2; });
  varP /= samples.length;
  if (varP < 3) return { x: base.x, y: base.y, score: 0 };

  const bx = Math.round(base.x);
  const by = Math.round(base.y);
  const surface = new Map();
  let best = { x: bx, y: by, score: -2 };
  for (let oy = -lim; oy <= lim; oy++) {
    for (let ox = -lim; ox <= lim; ox++) {
      const dx = bx + ox;
      const dy = by + oy;
      let sumC = 0;
      let sumC2 = 0;
      let sumPC = 0;
      let n = 0;
      for (let k = 0; k < samples.length; k++) {
        const i = samples[k];
        const x = (i % w) + dx;
        const y = ((i - (i % w)) / w) + dy;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const c = curLuma[y * w + x];
        sumC += c;
        sumC2 += c * c;
        sumPC += (refLuma[i] - mean) * c;
        n++;
      }
      if (n < samples.length * 0.8) continue;
      const meanC = sumC / n;
      const varC = sumC2 / n - meanC * meanC;
      if (varC < 1) continue;
      const score = (sumPC / n) / Math.sqrt(varP * varC);
      surface.set(ox + ',' + oy, score);
      if (score > best.score) best = { x: dx, y: dy, score, ox, oy };
    }
  }
  const at = (ox, oy) => {
    const v = surface.get(ox + ',' + oy);
    return v === undefined ? null : v;
  };
  const refine = (axis) => {
    const m = axis === 'x' ? at(best.ox - 1, best.oy) : at(best.ox, best.oy - 1);
    const p = axis === 'x' ? at(best.ox + 1, best.oy) : at(best.ox, best.oy + 1);
    if (m === null || p === null) return 0;
    const denom = m - 2 * best.score + p;
    if (Math.abs(denom) < 1e-6) return 0;
    return Math.max(-0.5, Math.min(0.5, (0.5 * (m - p)) / denom));
  };
  return { x: best.x + refine('x'), y: best.y + refine('y'), score: best.score };
}

// Sub-pixel shift. Rounding a 1.6px move to 2px every frame makes the matte
// outrun the subject; sampling the mask at its true position keeps the template
// where the picture actually is.
function maskShiftMaskSub(mask, fx, fy) {
  const w = MASK_W;
  const h = MASK_H;
  const out = new Uint8Array(w * h);
  if (!mask) return out;
  for (let y = 0; y < h; y++) {
    const sy = y - fy;
    const y0 = Math.floor(sy);
    const ry = sy - y0;
    if (y0 < -1 || y0 >= h) continue;
    for (let x = 0; x < w; x++) {
      const sx = x - fx;
      const x0 = Math.floor(sx);
      const rx = sx - x0;
      if (x0 < -1 || x0 >= w) continue;
      const s = (yy, xx) => (yy < 0 || yy >= h || xx < 0 || xx >= w)
        ? 0
        : (mask[yy * w + xx] > 110 ? 1 : 0);
      const v = s(y0, x0) * (1 - rx) * (1 - ry)
        + s(y0, x0 + 1) * rx * (1 - ry)
        + s(y0 + 1, x0) * (1 - rx) * ry
        + s(y0 + 1, x0 + 1) * rx * ry;
      if (v >= 0.5) out[y * w + x] = 255;
    }
  }
  return out;
}

// Grow the shifted matte back onto this frame, but only inside a narrow band
// around where it already is: the shape may breathe, it may not relocate.
function maskGrowInBand(data, model, seeds, allowed, lo) {
  const w = MASK_W;
  const h = MASK_H;
  const out = new Uint8Array(w * h);
  if (!data || !seeds || !seeds.length || !allowed) return out;
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let sp = 0;
  seeds.forEach((sd) => {
    const x = Math.round(sd.x * (w - 1));
    const y = Math.round(sd.y * (h - 1));
    const i = y * w + x;
    if (i < 0 || i >= w * h || seen[i] || !allowed[i]) return;
    seen[i] = 1;
    stack[sp++] = i;
  });
  let head = 0;
  while (head < sp) {
    const i = stack[head++];
    out[i] = 255;
    const x = i % w;
    const y = (i - x) / w;
    const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
    for (let k = 0; k < 4; k++) {
      const j = nb[k];
      if (j < 0 || seen[j] || !allowed[j]) continue;
      if (model && maskModelScore(model, data, j * 4) <= lo) continue;
      seen[j] = 1;
      stack[sp++] = j;
    }
  }
  return maskFillHoles(out, w, h);
}

// ------------------------------------------------------------- edge snapping
// Roto Brush and Magic Mask both end up with a boundary that sits on the actual
// silhouette, not on the edge of a colour blob. Each outline point is allowed to
// slide a few pixels along its own normal to the strongest image edge nearby;
// along its normal only, so the shape cannot collapse or balloon.
function maskSnapRing(ring, luma, maxSlide) {
  const w = MASK_W;
  const h = MASK_H;
  if (!ring || ring.length < 8 || !luma) return ring;
  const slide = Math.max(1, Math.min(6, maxSlide || 3));
  const grad = (x, y) => {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 1 || yi < 1 || xi >= w - 1 || yi >= h - 1) return 0;
    const i = yi * w + xi;
    const gx = luma[i + 1] - luma[i - 1];
    const gy = luma[i + w] - luma[i - w];
    return Math.sqrt(gx * gx + gy * gy);
  };
  return ring.map((p, k) => {
    const prev = ring[(k - 1 + ring.length) % ring.length];
    const next = ring[(k + 1) % ring.length];
    // outward normal of the ring at this point
    let nx = (next.y - prev.y);
    let ny = -(next.x - prev.x);
    const len = Math.hypot(nx, ny);
    if (len < 1e-6) return p;
    nx /= len;
    ny /= len;
    const px = p.x * (w - 1);
    const py = p.y * (h - 1);
    let bestScore = grad(px, py);
    let bestT = 0;
    for (let t = -slide; t <= slide; t += 0.5) {
      if (Math.abs(t) < 0.4) continue;
      const score = grad(px + nx * t, py + ny * t);
      // prefer the nearest strong edge when two are similar
      const biased = score * (1 - Math.abs(t) * 0.04);
      if (biased > bestScore * 1.06) {
        bestScore = biased;
        bestT = t;
      }
    }
    if (!bestT) return p;
    return {
      x: maskClamp01(p.x + (nx * bestT) / (w - 1)),
      y: maskClamp01(p.y + (ny * bestT) / (h - 1))
    };
  });
}

// Reduce chatter: a point may not wander frame to frame more than a little, so
// the outline does not shimmer while the subject is still.
function maskCalmRing(ring, prevRing, maxMove) {
  if (!ring || !prevRing || ring.length !== prevRing.length) return ring;
  const cap = maxMove || 0.012;
  return ring.map((p, i) => {
    const dx = p.x - prevRing[i].x;
    const dy = p.y - prevRing[i].y;
    const d = Math.hypot(dx, dy);
    if (d <= cap) return p;
    return { x: prevRing[i].x + (dx / d) * cap, y: prevRing[i].y + (dy / d) * cap };
  });
}

// Shape helpers for the follow. Every stored frame uses the same ring length and
// the same starting point, so the outline eases from one frame to the next
// instead of flickering between different point orders and different radii.
function maskTranslateRing(ring, dx, dy) {
  return ring.map((p) => ({ x: maskClamp01(p.x + dx), y: maskClamp01(p.y + dy) }));
}

function maskBlendRing(a, b, t, maxStep) {
  const n = Math.min(a.length, b.length);
  const out = [];
  for (let i = 0; i < n; i++) {
    let dx = b[i].x - a[i].x;
    let dy = b[i].y - a[i].y;
    const d = Math.hypot(dx, dy);
    if (maxStep && d > maxStep) {
      dx = (dx / d) * maxStep;
      dy = (dy / d) * maxStep;
    }
    out.push({
      x: maskClamp01(a[i].x + dx * t),
      y: maskClamp01(a[i].y + dy * t)
    });
  }
  return out;
}

function maskRingBBox(ring) {
  if (!ring || !ring.length) return null;
  let x0 = 1;
  let y0 = 1;
  let x1 = 0;
  let y1 = 0;
  ring.forEach((p) => {
    if (p.x < x0) x0 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x;
    if (p.y > y1) y1 = p.y;
  });
  return {
    x0: x0 * (MASK_W - 1),
    y0: y0 * (MASK_H - 1),
    x1: x1 * (MASK_W - 1),
    y1: y1 * (MASK_H - 1)
  };
}

// One frame of the follow, with looser retries instead of an instant surrender.
function maskTrackOneFrame(data, model, prev, vel, minW, minH) {
  const tries = [
    { grow: 0.5, hi: 0.7, lo: 0.02 },
    { grow: 0.95, hi: 0.42, lo: -0.12 },
    { grow: 1.6, hi: 0.18, lo: -0.3 }
  ];
  for (let t = 0; t < tries.length; t++) {
    const box = maskBoxWithFloor(maskPredictBox(prev, vel, tries[t].grow), minW, minH);
    const buf = maskSolveModel(data, model, box, tries[t].hi, tries[t].lo);
    if (!buf) continue;
    const cov = maskCoverage(buf);
    if (cov < 0.0006 || cov > 0.82) continue;
    const poly = maskTracePolygon(buf, MASK_W, MASK_H, 40);
    if (poly.length < 3) continue;
    const at = maskPolyCentroid(poly);
    const ratio = cov / Math.max(1e-6, prev.cov);
    const loose = t === tries.length - 1;
    if (!loose && (ratio < 0.35 || ratio > 2.6)) continue;
    const jump = Math.hypot(at.x - prev.at.x, at.y - prev.at.y);
    if (!loose && jump > 0.18) continue;
    return { mask: buf, poly, cov, at, box: maskBBox(buf, MASK_W, MASK_H) };
  }
  return null;
}

// Points sampled from inside an existing matte: that is what lets a hand-drawn
// matte be tracked instead of tracking demanding a magic-select click. A box
// matte is a rectangle, so its corners can sit on the background — pixels are
// used (when available) to keep the seeds on the subject's own colour, and
// points near the centre win, which is where the subject actually is.
function maskSeedsFromBuffer(buf, count, pixels) {
  const want = Math.max(1, Math.min(16, count || 8));
  const pts = [];
  if (!buf || !buf.length) return pts;

  // candidate inside-points, spaced out, so a matte over a whole frame still
  // produces a handful rather than thousands
  const step = Math.max(2, Math.floor(Math.sqrt(buf.length) / 40));
  const cand = [];
  let cx = 0;
  let cy = 0;
  let n = 0;
  for (let i = 0; i < buf.length; i += step) {
    if (buf[i] <= 110) continue;
    const x = i % MASK_W;
    const y = (i - x) / MASK_W;
    // interior only: a point on the matte's rim is half background, and one
    // background seed is enough to flood the whole room
    if (x < 2 || y < 2 || x > MASK_W - 3 || y > MASK_H - 3) continue;
    if (buf[i - 1] <= 110 || buf[i + 1] <= 110 || buf[i - MASK_W] <= 110 || buf[i + MASK_W] <= 110) continue;
    if (buf[i - 2] <= 110 || buf[i + 2] <= 110 || buf[i - 2 * MASK_W] <= 110 || buf[i + 2 * MASK_W] <= 110) continue;
    cand.push(i);
    cx += x;
    cy += y;
    n++;
  }
  if (!cand.length) return pts;
  cx /= n;
  cy /= n;

  let keep = cand;
  if (pixels && pixels.length >= buf.length * 4) {
    // median colour of everything inside the matte: with a subject filling most
    // of it, that is the subject's colour, and the background corners drop out
    const rs = [];
    const gs = [];
    const bs = [];
    cand.forEach((i) => {
      const p = i * 4;
      rs.push(pixels[p]);
      gs.push(pixels[p + 1]);
      bs.push(pixels[p + 2]);
    });
    const mid = (arr) => arr.sort((a, b) => a - b)[arr.length >> 1];
    const mr = mid(rs);
    const mg = mid(gs);
    const mb = mid(bs);
    const tol = 62;
    const filtered = cand.filter((i) => {
      const p = i * 4;
      const dr = pixels[p] - mr;
      const dg = pixels[p + 1] - mg;
      const db = pixels[p + 2] - mb;
      return Math.sqrt(dr * dr + dg * dg + db * db) <= tol;
    });
    if (filtered.length >= 2) keep = filtered;
  }

  // centre-first, so a torso seed does not land on a shoulder edge
  keep = keep.slice().sort((a, b) => {
    const ax = (a % MASK_W) - cx;
    const ay = ((a - (a % MASK_W)) / MASK_W) - cy;
    const bx = (b % MASK_W) - cx;
    const by = ((b - (b % MASK_W)) / MASK_W) - cy;
    return (ax * ax + ay * ay) - (bx * bx + by * by);
  });

  for (let k = 0; k < keep.length && pts.length < want; k++) {
    const i = keep[k];
    const x = (i % MASK_W) / (MASK_W - 1);
    const y = Math.floor(i / MASK_W) / (MASK_H - 1);
    if (pts.some((p) => Math.abs(p.x - x) < 0.07 && Math.abs(p.y - y) < 0.07)) continue;
    pts.push({ x, y });
  }
  return pts;
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

// ------------------------------------------------------------------ strokes
// In Magic Mask a stroke is a persistent eyedropper, not a paint mark: it keeps
// sampling the subject on every frame and it travels with the subject. These
// helpers turn strokes into foreground/background evidence for the colour model
// and carry them by whatever motion the tracker measured.
function maskStrokePoints(m, erase, dx, dy) {
  const pts = [];
  (m.strokes || []).forEach((stroke) => {
    if (!!stroke.erase !== !!erase) return;
    stroke.points.forEach((p) => {
      const x = p.x + (dx || 0);
      const y = p.y + (dy || 0);
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      pts.push({ x, y });
    });
  });
  return pts;
}

// Lock the strokes onto a solved matte: add-strokes are forced in,
// subtract-strokes forced out, so a correction cannot be argued with.
function maskEnforceStrokes(buf, m, dx, dy) {
  if (!buf || !m) return buf;
  const scale = MASK_W / MASK_PREVIEW_W;
  const stamp = (pts, value) => {
    pts.forEach((p) => {
      const radius = Math.max(1.5, (26 * scale));
      maskStamp(buf, p.x * (MASK_W - 1), p.y * (MASK_H - 1), radius, value);
    });
  };
  stamp(maskStrokePoints(m, false, dx, dy), 255);
  stamp(maskStrokePoints(m, true, dx, dy), 0);
  return buf;
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

// Ask a <video> for a specific moment and wait for it, with a hard timeout so a
// codec that refuses to seek can never hang the panel.
function maskSeekVideo(vid, timeSec) {
  return new Promise((resolve) => {
    if (!vid || !videoHasSource(vid)) { resolve(false); return; }
    const dur = Number(vid.duration);
    const target = Number.isFinite(dur) && dur > 0.05
      ? Math.max(0, Math.min(timeSec, dur - 0.02))
      : 0;
    if (vid.readyState >= 2 && Math.abs(Number(vid.currentTime) - target) < 0.03) {
      resolve(true);
      return;
    }
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      vid.removeEventListener('seeked', done);
      const landed = Math.abs(Number(vid.currentTime) - target) < 0.08;
      resolve(vid.readyState >= 2 && landed);
    };
    vid.addEventListener('seeked', done, { once: true });
    try { vid.currentTime = target; } catch (_e) { done(); }
    setTimeout(done, 260);
  });
}

// Samples the frame the mask should follow. This used to draw the procedural
// demo plate no matter what was loaded, so a click on your own footage solved
// against a picture that was not on screen — the matte landed somewhere else.
// Wait for a media event with a ceiling, so a codec that never fires one cannot
// freeze the panel.
function maskWaitForMedia(el, eventName, ms) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.removeEventListener(eventName, finish);
      resolve();
    };
    el.addEventListener(eventName, finish, { once: true });
    setTimeout(finish, ms);
  });
}

async function maskSampleFrame(timeSec) {
  const t = Math.max(0, Number(timeSec) || 0);
  const vid = document.getElementById('customVideoElement');
  let seekOk = true;
  if (state.scene === 'custom_video') {
    // A clip in the scene must provide the pixels. Sampling the fallback plate
    // here is what made the matte line up with a picture that was not on screen.
    if (!vid || !videoHasSource(vid)) return null;
    if (vid.paused) seekOk = await maskSeekVideo(vid, t);
    if (vid.readyState < 2) await maskWaitForMedia(vid, 'loadeddata', 1200);
    if (vid.readyState < 2) return null;
  }
  if (!maskSampleCanvas) {
    maskSampleCanvas = document.createElement('canvas');
    maskSampleCanvas.width = MASK_W;
    maskSampleCanvas.height = MASK_H;
  }
  const sctx = maskSampleCanvas.getContext('2d');
  if (!sctx) return null;
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.clearRect(0, 0, MASK_W, MASK_H);
  // sample in exactly the geometry the monitor draws, pillarbox slot included,
  // so a matte traced here lands on the same pixels the editor clicked
  plateSlotActive = true;
  try {
    drawCinematicPlate(sctx, MASK_W, MASK_H, t, 0);
  } catch (_e) {
    return null;
  }
  try {
    const frame = sctx.getImageData(0, 0, MASK_W, MASK_H);
    // carried through so the tracker can tell "the subject moved" from "the
    // browser stopped handing over frames"
    try { frame.seekOk = seekOk; } catch (_e) { /* ImageData can be sealed */ }
    return frame;
  } catch (_e) {
    return null;
  }
}

let maskSolveToken = 0;

async function maskSolve(opts) {
  const m = ensureMaskState();
  const o = opts || {};
  if (!m.seeds.length) {
    // No click to solve from: keep a hand-drawn matte and rebuild it from the
    // brush work instead of wiping it.
    if (!m.raw) m.raw = new Uint8Array(MASK_W * MASK_H);
    maskRebuild();
    return;
  }
  if (state.scene === 'empty') {
    // there is no frame to read: solving would sample the demo plate and hand
    // back a matte of a picture that is not on screen
    maskSetStatus('Load a clip or a photo first — Magic Select reads the frame in the Preview.');
    showToast('Load footage first, then click your subject', 'warn');
    return;
  }
  const token = ++maskSolveToken;
  const sec = o.timeSec === undefined ? state.playheadSec : o.timeSec;
  maskSetStatus('Reading the frame…');
  m.solving = true;
  const img = await maskSampleFrame(sec);
  if (token !== maskSolveToken) return;          // a newer click already won
  m.solving = false;
  if (!img || !img.data) {
    maskSetStatus('Could not read this frame — press Play once, pause, then click again.');
    return;
  }
  const solveMode = o.mode || m.mode;
  if (solveMode === 'subject' || solveMode === 'skin') {
    // one click, one subject: bounded region growth instead of a colour flood
    m.raw = maskClickSelect(img.data, m.seeds[m.seeds.length - 1], {
      lo: -0.05 - (m.sensitivity - 38) * 0.004
    });
    if (maskSeedsFromBuffer(m.raw, 1).length === 0) {
      m.raw = maskSolveFromPixels(img.data, MASK_W, MASK_H, m.seeds, {
        mode: solveMode,
        sensitivity: o.sensitivity === undefined ? m.sensitivity : o.sensitivity
      });
    }
  } else {
    m.raw = maskSolveFromPixels(img.data, MASK_W, MASK_H, m.seeds, {
      mode: solveMode,
      sensitivity: o.sensitivity === undefined ? m.sensitivity : o.sensitivity
    });
  }
  maskRebuild();
  if (o.announce) maskAnnounceMatte();
}

// Says what actually happened, in the terms an editor uses, because "nothing
// matched" and "everything matched" need opposite fixes.
function maskAnnounceMatte() {
  const m = ensureMaskState();
  const pct = (m.coverage * 100);
  if (!m.soft || pct <= 0.05) {
    maskSetStatus('Nothing matched there. Click a flatter, more distinct part of the subject, or raise Select sensitivity.');
    return;
  }
  if (pct > 92) {
    maskSetStatus('That covered ' + pct.toFixed(0) + '% of the frame — lower Select sensitivity, or click a more distinct part.');
    return;
  }
  maskSetStatus(
    'Matte built — ' + pct.toFixed(1) + '% of frame, '
    + m.polygon.length + ' outline points. Click again to add, or use － Subtract to clean it up.'
  );
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
  const trackedPoly = maskPolygonAt(state.playheadSec);

  ctx.save();

  // A tracked frame has an outline but no pixels of its own, so draw the wash
  // from that outline: otherwise the picture clearly follows the subject while
  // the red shape sits still, which reads as "tracking did nothing".
  if (trackedPoly && trackedPoly.length > 2 && m.view !== 'matte') {
    const tracePath = () => {
      ctx.beginPath();
      trackedPoly.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x * w, p.y * h);
        else ctx.lineTo(p.x * w, p.y * h);
      });
      ctx.closePath();
    };
    ctx.fillStyle = m.view === 'outline' ? 'rgba(3,5,12,0.28)' : 'rgba(3,5,12,0.58)';
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    trackedPoly.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x * w, p.y * h);
      else ctx.lineTo(p.x * w, p.y * h);
    });
    ctx.closePath();
    if (typeof ctx.fill === 'function') ctx.fill('evenodd');
    if (m.view === 'overlay') {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#ef4444';
      tracePath();
      ctx.fill();
      ctx.restore();
    }
    drawMaskOutline(ctx, w, h, trackedPoly, t);
    ctx.restore();
    return;
  }

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
  drawMaskOutline(ctx, w, h, maskPolygonAt(state.playheadSec) || m.polygon, t);
  ctx.restore();
}

// the dashed selection line plus the little read-out chip
function drawMaskOutline(ctx, w, h, poly, t) {
  const m = state.mask;
  if (!m || !poly || poly.length < 3 || m.view === 'matte') return;
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
  if (m.seeds.length) maskSolve();
}

function maskAddSeed(x, y, opts) {
  const m = ensureMaskState();
  const o = opts || {};
  if (!o.keep) m.seeds = [];
  m.seeds.push({ x: maskClamp01(x), y: maskClamp01(y) });
  // a click always shows something: if the matte overlay was switched off, put
  // it back, otherwise the click looks like it did nothing
  if (m.view === 'off') {
    m.view = 'overlay';
    const sel = document.getElementById('maskViewSelect');
    if (sel) sel.value = 'overlay';
  }
  m.showOnMonitor = true;
  maskSolve({ announce: true });
}

// Where the picture actually sits inside the element. The monitor canvas is
// drawn with `object-fit: contain`, so the element box is not the frame: on a
// stage that is not exactly 16:9 there are bars, and clicking without removing
// them put every matte a little off the subject.
function maskContentRect(canvas) {
  const rect = canvas.getBoundingClientRect();
  const cw = rect.width || 1;
  const ch = rect.height || 1;
  const iw = canvas.width || 16;
  const ih = canvas.height || 9;
  const scale = Math.min(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  return { left: rect.left + (cw - dw) / 2, top: rect.top + (ch - dh) / 2, width: dw, height: dh };
}

function maskPointFromEvent(e, canvas) {
  const rect = maskContentRect(canvas);
  return {
    x: maskClamp01((e.clientX - rect.left) / (rect.width || 1)),
    y: maskClamp01((e.clientY - rect.top) / (rect.height || 1))
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
  // while the clip is being followed, a stray click would replace the shape
  if (m.tracking) return;
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

// Frame tracking. It used to demand magic-select seeds, which is why a matte
// you painted by hand answered "click your subject first"; it also re-solved
// against the same demo plate on every frame. Now it starts from any matte
// (click, box or brush), seeks the real frame, and re-seeds from the previous
// frame's result so the outline follows the subject instead of sitting still.
function maskHasMatte() {
  const m = ensureMaskState();
  return !!(m.soft && m.coverage > 0.0005);
}

async function maskTrackFrames(direction) {
  const m = ensureMaskState();
  if (m.tracking) return;
  if (!maskHasMatte()) {
    showToast('Build a matte first — click the subject, drag a box, or paint with ＋ Add', 'warn');
    maskSetStatus('Nothing to track yet: make a matte first.');
    return;
  }
  if (state.scene === 'custom_image') {
    maskKeyframeMatte();
    maskSetStatus('This is a still photo, so there is one frame. Matte keyframed — load a clip to follow it.');
    return;
  }
  const total = Math.max(0, Number(state.totalDurSec) || 0);
  if (!total) {
    showToast('Load a clip first — tracking needs frames to follow', 'warn');
    return;
  }
  const dir = direction < 0 ? -1 : 1;
  if (dir < 0 && Number(state.playheadSec) <= 0.05) {
    maskSetStatus('Nothing before the playhead — press ▶ or scrub a few seconds forward, then Track back.');
    showToast('Move the playhead forward first, then Track back', 'warn');
    return;
  }
  // tracking reads exact frames, so the clip cannot be rolling while it works
  if (state.isPlaying) {
    state.isPlaying = false;
    state.motion = false;
    applyMotionState(true);
    const playingVid = document.getElementById('customVideoElement');
    if (playingVid && videoHasSource(playingVid)) playingVid.pause();
  }

  const fps = 24;
  // Frame by frame for the whole clip, not a 2.5 second sample. A matte is
  // judged on the shots you scrub past, not on the one you clicked.
  const stride = 1 / fps;
  const startSec = Number(state.playheadSec) || 0;
  const remaining = Math.abs(dir > 0 ? total - startSec : startSec);
  const limit = Math.max(1, Math.min(2400, Math.round(remaining / stride) + 1));

  m.tracking = true;
  m.trackCancel = false;
  const buttons = ['maskTrackFwdBtn', 'maskTrackBackBtn', 'maskApplyBtn', 'maskClearBtn'];
  buttons.forEach((id) => { const b = document.getElementById(id); if (b) b.disabled = true; });
  const stopBtn = document.getElementById('maskTrackCancelBtn');
  if (stopBtn) {
    stopBtn.disabled = false;
    stopBtn.classList.remove('hidden');
    stopBtn.textContent = 'Stop tracking';
  }

  let added = 0;
  let lostAt = null;
  let stuck = false;
  let staleFrames = 0;
  let misses = 0;
  let settledCov = null;
  let prev = {
    cov: m.coverage,
    at: maskPolyCentroid(m.polygon),
    box: maskBBox(m.soft, MASK_W, MASK_H),
    poly: m.polygon.map((p) => ({ x: p.x, y: p.y })),
    mask: m.soft,
    luma: null
  };
  // the size of the subject as committed on the frame you built the matte:
  // every later window is at least this big
  const startBox0 = prev.box || maskBBox(m.soft, MASK_W, MASK_H);
  const minW = startBox0 ? Math.max(16, startBox0.w * 1.15) : 24;
  const minH = startBox0 ? Math.max(16, startBox0.h * 1.15) : 24;
  const startCov0 = Math.max(0.0008, prev.cov);
  let vel = { x: 0, y: 0 };
  let model = null;

  try {
    // The frame you built the matte on is already truth: it becomes frame one,
    // so a clip always keeps the shape you drew.
    const base = await maskSampleFrame(startSec);
    if (base && base.data) {
      model = maskBuildColorModel(base.data, MASK_W, MASK_H, m.soft, null);
      // the frame the matte was built on is the template the follow locks onto
      prev.luma = maskLuma(base.data, MASK_W, MASK_H);
    }
    if (base && base.data && (!prev.mask || !prev.box)) {
      // no usable matte pixels (a ring left by a previous run): rebuild them
      // from the click, bounded, rather than flooding the frame
      const seedBuf = m.seeds.length
        ? maskClickSelect(base.data, m.seeds[0], {})
        : maskSolveFromPixels(base.data, MASK_W, MASK_H, maskSeedsFromBuffer(m.soft, 10, base.data), {
          mode: m.mode,
          sensitivity: m.sensitivity
        });
      if (maskCoverage(seedBuf) > 0.0006) {
        prev.mask = seedBuf;
        prev.box = maskBBox(seedBuf, MASK_W, MASK_H);
        prev.poly = maskResamplePolygon(maskTracePolygon(seedBuf, MASK_W, MASK_H, 24), 24);
        prev.cov = maskCoverage(seedBuf);
        prev.at = maskPolyCentroid(prev.poly);
        model = maskBuildColorModel(base.data, MASK_W, MASK_H, seedBuf, null);
      }
    }
    // every stored frame uses the same ring length, so the sequence is one
    // shape moving rather than a new shape each frame
    if (prev.poly && prev.poly.length) prev.poly = maskResamplePolygon(prev.poly, 24);
    m.tracked = m.tracked.filter((f) => Math.abs(f.sec - startSec) > 0.001);
    m.tracked.push({
      sec: +startSec.toFixed(3),
      polygon: prev.poly.map((p) => ({ x: p.x, y: p.y })),
      coverage: +prev.cov.toFixed(3)
    });
    added = 1;
    let lastAt = prev.at;

    // Absolute matching against the frame the matte was built on. Matching the
    // previous frame accumulates a half-pixel error every frame, which is what
    // walked the outline off the subject; an absolute search cannot integrate.
    let refLuma = prev.luma;
    let refMask = prev.mask;
    let refCov = prev.cov;
    let pos = { x: 0, y: 0 };
    let scoreMisses = 0;

    for (let i = 1; i <= limit && !m.trackCancel; i++) {
      const sec = startSec + dir * i * stride;
      if (sec < -0.001 || sec > total + 0.001) break;
      maskSetStatus('Following the subject — frame ' + i + ' of ' + limit
        + ' (' + Math.min(100, Math.round((i / limit) * 100)) + '%)');
      const img = await maskSampleFrame(sec);
      if (!img || !img.data) break;

      if (img.seekOk === false) {
        staleFrames++;
        if (staleFrames >= 4) { stuck = true; lostAt = sec; break; }
      } else {
        staleFrames = 0;
      }
      if (!model) model = maskBuildColorModel(img.data, MASK_W, MASK_H, refMask, null);
      const curLuma = maskLuma(img.data, MASK_W, MASK_H);
      const prevRing = maskResamplePolygon(prev.poly, 24);

      // 1) where is the reference patch now? searched around the predicted spot
      const guess = { x: pos.x + vel.x * dir * MASK_W, y: pos.y + vel.y * dir * MASK_H };
      const found = maskTemplateAt(refLuma, curLuma, refMask, guess, 10);
      if (found.score < 0.34) {
        // nothing that looks like the subject: it is hidden, it left, or the
        // shot changed. Coast on the last motion for a few frames.
        scoreMisses++;
        // half a second of occlusion is normal (a hand, a pole, a cutaway); the
        // matte rides on its own motion and picks the subject up again
        if (scoreMisses > 12) { lostAt = sec; break; }
        vel = { x: vel.x * 0.92, y: vel.y * 0.92 };
        const coast = maskTranslateRing(prevRing, vel.x * dir, vel.y * dir);
        m.tracked = m.tracked.filter((f) => Math.abs(f.sec - sec) > 0.001);
        m.tracked.push({ sec: +sec.toFixed(3), polygon: coast, coverage: +prev.cov.toFixed(3) });
        prev = { cov: prev.cov, at: maskPolyCentroid(coast), box: prev.box, mask: prev.mask, poly: coast, luma: prev.luma };
        added++;
        continue;
      }
      scoreMisses = 0;
      pos = { x: found.x, y: found.y };

      // 2) the matte at that position, then a small, guarded tidy-up
      const moved = maskShiftMaskSub(refMask, pos.x, pos.y);
      // the strokes travel with the subject, exactly like the matte
      const sdx = pos.x / (MASK_W - 1);
      const sdy = pos.y / (MASK_H - 1);
      const band = maskMorph(moved, MASK_W, MASK_H, 3);
      const seeds = maskSeedsFromBuffer(moved, 8, img.data);
      let refined = seeds.length
        ? maskGrowInBand(img.data, model, seeds, band, -0.25)
        : new Uint8Array(MASK_W * MASK_H);
      maskEnforceStrokes(refined, m, sdx, sdy);
      const cMoved = maskPolyCentroid(maskTracePolygon(moved, MASK_W, MASK_H, 16));
      const cRef = maskPolyCentroid(maskTracePolygon(refined, MASK_W, MASK_H, 16));
      if (Math.hypot(cRef.x - cMoved.x, cRef.y - cMoved.y) > 2.5 / MASK_W) refined = moved;

      let cov = maskCoverage(refined);
      // the reference size is the subject's size: the matte may not eat into it
      if (!settledCov) settledCov = refCov;
      const lo = refCov * 0.7;
      const hi = Math.max(refCov, settledCov) * 1.35;
      if (!(cov > lo && cov < hi)) {
        refined = moved;
        cov = maskCoverage(refined);
      }
      if (!(cov > lo * 0.9 && cov < hi * 1.1)) {
        misses++;
        if (misses > 8) { lostAt = sec; break; }
        const coast = maskTranslateRing(prevRing, vel.x * dir, vel.y * dir);
        m.tracked = m.tracked.filter((f) => Math.abs(f.sec - sec) > 0.001);
        m.tracked.push({ sec: +sec.toFixed(3), polygon: coast, coverage: +prev.cov.toFixed(3) });
        prev = { cov: prev.cov, at: maskPolyCentroid(coast), box: prev.box, mask: moved, poly: coast, luma: refLuma };
        pos = { x: pos.x - vel.x * dir * MASK_W, y: pos.y - vel.y * dir * MASK_H };
        added++;
        continue;
      }
      misses = 0;

      // 3) the outline handed back: resampled to a fixed ring, snapped to the
      //    silhouette, eased, then calmed against the previous frame
      const rawRing = maskResamplePolygon(maskTracePolygon(refined, MASK_W, MASK_H, 24), 24);
      const snapped = maskSnapRing(rawRing, curLuma, 3);
      let ring = snapped.length === prevRing.length
        ? maskBlendRing(prevRing, snapped, 0.6, 0.03)
        : snapped;
      ring = maskCalmRing(ring, prevRing, 0.014);
      const at = maskPolyCentroid(ring);

      const move = { x: at.x - prev.at.x, y: at.y - prev.at.y };
      vel = { x: vel.x * 0.45 + move.x * 0.55, y: vel.y * 0.45 + move.y * 0.55 };
      const vmag = Math.hypot(vel.x, vel.y);
      const vmax = 0.05;
      if (vmag > vmax) { vel.x = (vel.x / vmag) * vmax; vel.y = (vel.y / vmag) * vmax; }

      if (cov > refCov * 0.8 && cov < refCov * 1.3) {
        model = maskBuildColorModel(img.data, MASK_W, MASK_H, refined, model);
      }
      m.tracked = m.tracked.filter((f) => Math.abs(f.sec - sec) > 0.001);
      m.tracked.push({ sec: +sec.toFixed(3), polygon: ring, coverage: +cov.toFixed(3) });
      prev = { cov, at, box: maskBBox(refined, MASK_W, MASK_H), mask: refined, poly: ring, luma: refLuma };
      added++;

      // 4) if the subject's own appearance has changed a lot (it turned, the
      //    light shifted), re-anchor the reference to the current frame
      if (found.score > 0.72 && i % 6 === 0) {
        refLuma = curLuma;
        refMask = refined;
        refCov = cov;
        pos = { x: 0, y: 0 };
      }
    }
  } finally {
    m.tracking = false;
    const vid = document.getElementById('customVideoElement');
    if (vid && videoHasSource(vid) && vid.paused) await maskSeekVideo(vid, startSec);
    buttons.forEach((id) => { const b = document.getElementById(id); if (b) b.disabled = false; });
    if (stopBtn) {
      stopBtn.classList.add('hidden');
      stopBtn.disabled = false;
    }
    m.tracked.sort((a, b) => a.sec - b.sec);
    if (m.tracked.length > 400) m.tracked = m.tracked.slice(-400);
    maskSyncUI();
  }

  if (stuck) {
    maskSetStatus(added > 1
      ? 'The clip stopped handing over frames after ' + (added - 1) + ' followed — press ▶ for a second, pause, then Track again. What was followed is kept.'
      : 'The clip is not giving new frames to the panel — press ▶ for a second, pause, then Track again. The matte you drew is kept.');
  } else if (added > 1) {
    maskSetStatus('Followed the subject for ' + added + ' frames'
      + (lostAt ? ' and lost it at ' + lostAt.toFixed(2) + 's' : '')
      + ' — ' + m.tracked.length + ' frames carry the matte. Send Mask to Resolve when it looks right.');
    showToast('Matte followed ' + added + ' frames ' + (dir > 0 ? 'forward' : 'back'), 'ok');
  } else if (added === 1) {
    maskSetStatus('The matte is on this frame but the subject could not be followed from here'
      + (lostAt ? ' (lost at ' + lostAt.toFixed(2) + 's)' : '')
      + '. Try Track back, widen the matte with ＋ Add, or click the subject again on a clearer frame.');
  } else {
    maskSetStatus('Could not follow the subject from this frame.');
  }
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

// Fusion needs the same number of points on every frame to animate one shape,
// so each tracked outline is resampled to a fixed ring, starting from its
// top-most point: no point scrambling, no jumping between frames.
function maskResamplePolygon(poly, count) {
  const n = Math.max(8, Math.min(48, count || 16));
  if (!poly || poly.length < 3) return [];
  const pts = poly.slice();
  let start = 0;
  pts.forEach((p, i) => { if (p.y < pts[start].y) start = i; });
  const ring = pts.slice(start).concat(pts.slice(0, start));
  const seg = [];
  let total = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    seg.push({ a, b, len, at: total });
    total += len;
  }
  if (total <= 0) return ring.slice(0, n);
  const out = [];
  for (let k = 0; k < n; k++) {
    const target = (k / n) * total;
    let s = seg[0];
    for (let i = 0; i < seg.length; i++) {
      if (seg[i].at <= target) s = seg[i];
      else break;
    }
    const f = s.len > 0 ? (target - s.at) / s.len : 0;
    out.push({
      x: +(s.a.x + (s.b.x - s.a.x) * f).toFixed(5),
      y: +(s.a.y + (s.b.y - s.a.y) * f).toFixed(5)
    });
  }
  return out;
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
  const fps = 24;
  const baseSec = m.tracked.length ? m.tracked[0].sec : state.playheadSec;
  const all = m.tracked.length ? m.tracked : [{
    sec: state.playheadSec,
    polygon: m.polygon,
    coverage: m.coverage
  }];
  // at most 40 shape keys: enough for a smooth travel, small enough to paste
  // into the Console without a fight
  const frames = all.length <= 40 ? all : all.filter((_f, i) => i % Math.ceil(all.length / 40) === 0);
  // one ring per frame, same point count, so Resolve animates the mask instead
  // of swapping shapes: this is the matte travelling with the clip
  const shapeFrames = frames.map((f) => ({
    frame: Math.max(0, Math.round((Number(f.sec) - baseSec) * fps)),
    timeSec: +Number(f.sec).toFixed(3),
    coverage: +Number(f.coverage || 0).toFixed(4),
    points: maskResamplePolygon(f.polygon || m.polygon, 16).map(toFusion)
  })).filter((f) => f.points.length >= 8);
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
    frames: shapeFrames,
    baseTimeSec: +baseSec.toFixed(3),
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
  const stop = document.getElementById('maskTrackCancelBtn');
  if (stop) {
    stop.addEventListener('click', () => {
      const mm = ensureMaskState();
      if (!mm.tracking) return;
      mm.trackCancel = true;
      stop.textContent = 'Stopping…';
      stop.disabled = true;
    });
  }

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
    syncStageHint();
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

// ============================================================================
// THE TIMELINE
// ----------------------------------------------------------------------------
// V1 is the editable track: clips carry a window on the source, so dragging an
// edge trims the footage instead of sliding a box. The other lanes show what
// the rest of the panel has put on the timeline (FX badges, the lyric lane,
// b-roll, audio) and are deliberately not draggable — nothing here pretends an
// edit happened that the user did not make.
// ============================================================================
const TL_GUTTER = 64;          // px of label column, matches --tl-gutter in CSS
const TL_PAD = 10;             // #timelineTracksContainer horizontal padding
const TL_GAP = 6;              // gap between the label column and the lane

function tlModel() {
  return window.TIMELINE || null;
}

function tlClips() {
  return (state.tl && state.tl.clips) || [];
}

function tlLaneEl() {
  return document.getElementById('laneV1');
}

function tlLaneWidth(el) {
  const lane = el || tlLaneEl();
  if (!lane) return 0;
  const rect = lane.getBoundingClientRect ? lane.getBoundingClientRect() : null;
  const w = rect && rect.width ? rect.width : lane.clientWidth;
  // jsdom and a hidden panel both report 0; fall back to the laid-out width so
  // the maths is still sane and the checks do not divide by zero.
  return Math.max(1, Math.round(w || 300));
}

function tlSpan() {
  const t = tlModel();
  if (!t) return 6;
  // Frozen for the duration of a drag, so the scale under the pointer never
  // shifts mid-gesture; otherwise the whole timeline always fits the lane.
  if (state.tl && state.tl.drag && state.tl.drag.spanSec) return state.tl.drag.spanSec;
  return t.spanFor(tlClips(), 4);
}

function tlDuration() {
  const t = tlModel();
  return t ? t.duration(tlClips()) : 0;
}

/** Timeline time → the time in the source clip the monitor should show. */
function stageSourceTime(timelineSec) {
  const t = tlModel();
  const clips = tlClips();
  if (!t || !clips.length) return timelineSec;
  const m = t.sourceAt(clips, timelineSec);
  return m ? m.sourceSec : null;      // null = a gap in the timeline
}

/** Fetch public/timeline.js once if the page somehow booted without it. */
function tlLoadModelOnce() {
  if (window.TIMELINE || tlLoadModelOnce.tried) return;
  tlLoadModelOnce.tried = true;
  const s = document.createElement('script');
  s.src = '/timeline.js?v=7';
  s.onload = () => {
    showToast('Timeline ready — press ＋ Add clip', 'ok');
    renderTimelineTracks();
  };
  s.onerror = () => showToast('The timeline file could not be fetched — reload the page', 'error');
  document.head.appendChild(s);
}

/** The source's own length, so a trim can never run past the footage. */
function sourceDuration() {
  const vid = document.getElementById('customVideoElement');
  const d = vid ? Number(vid.duration) : 0;
  if (Number.isFinite(d) && d > 0.05) return d;
  if (state.totalDurSec > 0) return state.totalDurSec;
  return state.measuredAnalysis ? state.measuredAnalysis.durationSec : 0;
}

function tlSelected() {
  const t = tlModel();
  return t && state.tl.selectedId ? t.find(tlClips(), state.tl.selectedId) : null;
}

function tlSetClips(clips) {
  const t = tlModel();
  state.tl.clips = t ? t.normalise(clips) : clips;
  // The transport runs on the timeline now, not on the raw clip.
  const dur = tlDuration();
  state.totalDurSec = dur > 0 ? dur : (state.scene === 'custom_video' ? sourceDuration() : 0);
  if (state.playheadSec > state.totalDurSec) state.playheadSec = state.totalDurSec;
  renderTimelineTracks();
  renderTimelineSelection();
  updateTransportEnabled();
}

function updateTransportEnabled() {
  const dur = state.totalDurSec || 0;
  ['playPauseBtn', 'transportPauseBtn', 'transportStopBtn'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = !(dur > 0);
  });
  const scrub = document.getElementById('timelineScrubber');
  if (scrub) scrub.disabled = !(dur > 0);
}

function tlAddClipFromStage() {
  let t = tlModel();
  if (!t) {
    // The model is a separate file. If it is missing (a stale cache, a partial
    // deploy) fetch it once and carry on, rather than doing nothing.
    tlLoadModelOnce();
    showToast('Starting the timeline — press ＋ Add clip again in a second', 'warn');
    return null;
  }
  const vid = document.getElementById('customVideoElement');
  if (!vid || !videoHasSource(vid)) {
    showToast('No clip on the stage yet — press “Upload clip” in the viewer first', 'warn');
    const upload = document.getElementById('customVideoInput');
    if (upload) upload.click();
    return null;
  }
  // A loaded video is enough; the scene flag has been wrong in the past when a
  // clip arrived by drag-and-drop, and that used to make this button do nothing.
  if (state.scene !== 'custom_video') state.scene = 'custom_video';
  // The element's own length is the only honest source for a clip window. The
  // stage-wide fallback belongs to older paths and would let a not-yet-loaded
  // file borrow the length of a clip that is no longer on the stage.
  const elDur = vid ? Number(vid.duration) : NaN;
  const srcDur = Number.isFinite(elDur) && elDur > 0.05 ? elDur : 0;
  if (!(srcDur > 0.05)) {
    // Metadata may not have landed yet. Wait for it instead of asking the user
    // to press the button again — and say so, so the click never looks ignored.
    if (!state.tl.waitingForMeta) {
      state.tl.waitingForMeta = true;
      showToast('Reading the clip’s length — it will drop onto V1 by itself in a moment', 'warn');
      const retry = () => {
        state.tl.waitingForMeta = false;
        if (!tlClips().length) tlAddClipFromStage();
      };
      vid.addEventListener('loadedmetadata', retry, { once: true });
      vid.addEventListener('durationchange', retry, { once: true });
      // and a last look, in case the events already fired before we listened
      setTimeout(() => {
        if (!state.tl.waitingForMeta) return;
        if (sourceDuration() > 0.05) retry();
      }, 1200);
    }
    return null;
  }
  const name = (state.plateFile && state.plateFile.name) || 'Clip';
  const at = tlDuration();
  const clip = t.makeClip({
    id: 'tl' + (state.tl.clips.length + 1) + '_' + Math.random().toString(36).slice(2, 6),
    track: 'V1',
    name: name.replace(/\.[^.]+$/, ''),
    startSec: at,
    srcIn: 0,
    srcOut: srcDur,
    srcDur,
    mediaKey: name
  });
  tlSetClips(tlClips().concat([clip]));
  state.tl.selectedId = clip.id;
  renderTimelineSelection();
  showToast(`Added “${clip.name}” to V1 — drag its edges to trim`, 'ok');
  return clip;
}

function tlRenderRuler(span, widthPx) {
  const ruler = document.getElementById('tlRuler');
  if (!ruler) return;
  const t = tlModel();
  const steps = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
  let step = steps[steps.length - 1];
  for (let i = 0; i < steps.length; i++) {
    if ((widthPx / (span / steps[i])) >= 46) { step = steps[i]; break; }
  }
  let html = '';
  for (let s = 0; s <= span + 1e-6; s += step) {
    const x = t ? t.timeToX(s, span, widthPx) : 0;
    html += `<span class="tl-tick" style="left:${x.toFixed(1)}px"></span>`;
    if (x < widthPx - 22) {
      html += `<span class="tl-tick-label" style="left:${x.toFixed(1)}px">${t ? t.formatTime(s) : s}</span>`;
    }
  }
  ruler.innerHTML = html;
  ruler.dataset.span = String(span);
  ruler.dataset.width = String(widthPx);
}

function tlPlayheadX(span, widthPx) {
  const t = tlModel();
  if (!t) return 0;
  return t.timeToX(state.playheadSec || 0, span, widthPx);
}

/** Everything that has to move when the playhead moves. */
function tlSyncPlayhead() {
  const head = document.getElementById('tlPlayhead');
  const lane = tlLaneEl();
  if (!head || !lane) return;
  const span = tlSpan();
  const width = tlLaneWidth(lane);
  const x = tlPlayheadX(span, width);
  head.style.left = `${TL_PAD + TL_GUTTER + TL_GAP + x}px`;
  head.dataset.x = String(Math.round(x));
}

// Keeps the element in step with the timeline while it plays: same clip, same
// source time, and a real stop at the end instead of a jump back to zero.
function tlPlaybackTick() {
  const clips = tlClips();
  if (!clips.length) return false;
  const dur = tlDuration();
  if (state.playheadSec >= dur - 1e-3) {
    state.playheadSec = dur;
    state.isPlaying = false;
    const play = document.getElementById('playPauseBtn');
    if (play) { play.classList.remove('is-live'); play.title = 'Play'; }
    const vid = document.getElementById('customVideoElement');
    if (vid && !vid.paused) { try { vid.pause(); } catch (_e) { /* ignore */ } }
    return true;
  }
  const vid = document.getElementById('customVideoElement');
  if (!vid || state.scene !== 'custom_video') return false;
  const mapped = stageSourceTime(state.playheadSec);
  if (mapped == null) {
    if (!vid.paused) { try { vid.pause(); } catch (_e) { /* ignore */ } }
    return true;
  }
  if (Math.abs(Number(vid.currentTime) - mapped) > 0.22) {
    try { vid.currentTime = mapped; } catch (_e) { /* ignore */ }
  }
  if (vid.paused) {
    const p = vid.play();
    if (p && p.catch) p.catch(() => {});
  }
  return true;
}

function renderTimelineSelection() {
  const el = document.getElementById('tlSelection');
  if (!el) return;
  const c = tlSelected();
  const t = tlModel();
  if (typeof tlUpdateButtons === 'function') tlUpdateButtons();
  if (!c || !t) {
    el.innerHTML = '<span class="tl-selection-hint">Click a clip to select it. '
      + 'Drag its edges to trim, drag the middle to move.</span>';
    return;
  }
  el.innerHTML = `<strong>${escapeAttr(c.name)}</strong> · `
    + `<span class="tl-sel-num">in ${t.formatTime(c.srcIn)}</span> · `
    + `<span class="tl-sel-num">out ${t.formatTime(c.srcOut)}</span> · `
    + `<span class="tl-sel-num">length ${t.formatLen(t.len(c))}</span> · `
    + `<span class="tl-sel-num">starts ${t.formatTime(c.startSec)}</span>`;
}

function renderTimelineV1(clips, span, width) {
  const lane = tlLaneEl();
  const t = tlModel();
  if (!lane || !t) return;
  lane.innerHTML = clips.map((c) => {
    const left = t.timeToX(c.startSec, span, width);
    const w = Math.max(2, (t.len(c) / span) * width);
    const sel = c.id === state.tl.selectedId ? ' is-selected' : '';
    return `<div class="tl-clip v1-item${sel}" data-clipid="${escapeAttr(c.id)}" `
      + `data-left="${left.toFixed(1)}" data-width="${Math.min(w, width - left).toFixed(1)}" `
      + `style="left:${left.toFixed(1)}px; width:${Math.min(w, width - left).toFixed(1)}px" `
      + `title="${escapeAttr(c.name)} — drag the edges to trim, drag the middle to move">`
      + `<span class="tl-clip-label">${escapeAttr(c.name)}</span></div>`;
  }).join('');
  lane.dataset.span = String(span);
  lane.dataset.width = String(width);
}

function renderTimelineTracks() {
  const t = tlModel();
  const lane = tlLaneEl();
  const clips = tlClips();
  const span = tlSpan();
  const width = tlLaneWidth(lane);

  // ---- the editable track ------------------------------------------------
  if (lane) renderTimelineV1(clips, span, width);

  // ---- the read-only lanes ----------------------------------------------
  const renderLane = (laneId, items, cls) => {
    const el = document.getElementById(laneId);
    if (!el) return;
    el.innerHTML = (items || []).map((it) => `
      <div class="tl-clip ${cls}" style="left:${it.left}%; width:${it.width}%;" title="${escapeAttr(it.label || '')}">
        ${escapeAttr(it.label || '')}
      </div>
    `).join('');
  };

  const live = state.liveTimeline;
  const titleEl = document.getElementById('activeTimelineTitle');
  const wrap = document.getElementById('timelineTracksContainer');
  if (wrap) wrap.classList.toggle('is-live', !!live);

  if (live && !clips.length) {
    const liveClips = live.clips || [];
    const end = liveClips.reduce((m, c) => Math.max(m, c.endFrame || 0), 0) || 1;
    renderLane('laneV1', liveClips.map((c) => ({
      left: Math.max(0, ((c.startFrame || 0) / end) * 100),
      width: Math.max(1.5, (((c.endFrame || 0) - (c.startFrame || 0)) / end) * 100),
      label: c.name || 'Clip'
    })), 'v1-item');
    renderLane('laneV3', state.timelineTracks.v3, 'vfx-item');
    renderLane('laneSub', [], 'sub-item');
    renderLane('laneV2', [], 'v2-item');
    renderLane('laneA1', [], 'a1-item');
    // clips on V1 are yours: a connected Resolve timeline must not overwrite
    // them with a read-only copy, or the edges stop answering the pointer
    if (clips.length) renderTimelineV1(clips, span, width);
    if (titleEl) {
      titleEl.innerHTML = `<span class="live-tag">LIVE</span> ${live.name || 'Timeline'} · `
        + `${live.project || 'Project'} · ${live.fps || '24'} fps`;
      titleEl.title = state.bridge && state.bridge.target
        ? `Apply targets: ${state.bridge.target}`
        : 'Bridge connected';
    }
  } else {
    const anyEdits = ['v3', 'v2', 'v1', 'sub', 'a1']
      .some((k) => Array.isArray(state.timelineTracks[k]) && state.timelineTracks[k].length);
    const emptyNote = document.getElementById('tlEmptyNote');
    if (emptyNote) emptyNote.classList.toggle('hidden', clips.length > 0 || anyEdits);
    // A clip on the stage is not on the timeline until it is added. Say that,
    // loudly enough to be found, without ever adding it for them.
    const vid = document.getElementById('customVideoElement');
    const waiting = !clips.length && !!vid && videoHasSource(vid);
    const addBtn = document.getElementById('tlAddClipBtn');
    if (addBtn) addBtn.classList.toggle('is-cta', waiting);
    if (emptyNote && waiting) {
      emptyNote.innerHTML = 'Your clip is on the stage — press <b>＋ Add clip</b> to put it on V1, '
        + 'then drag its left or right edge to shorten or lengthen it.';
    } else if (emptyNote && !clips.length && !anyEdits) {
      emptyNote.innerHTML = 'Nothing on the timeline yet — load a video, then press '
        + '<b>＋ Add clip</b> to put it on V1 and drag its edges to trim it.';
    }

    if (titleEl) {
      titleEl.textContent = clips.length
        ? `Timeline 1 — ${clips.length} clip${clips.length === 1 ? '' : 's'}`
        : anyEdits ? 'Timeline 1 — your edits' : 'No edits yet';
      titleEl.title = clips.length
        ? 'Drag a clip edge to trim it, drag the middle to move it'
        : 'Nothing has been added to this timeline';
    }
    renderLane('laneV3', state.timelineTracks.v3, 'vfx-item');
    renderLane('laneSub', state.timelineTracks.sub, 'sub-item');
    renderLane('laneV2', state.timelineTracks.v2, 'v2-item');
    renderLane('laneA1', state.timelineTracks.a1, 'a1-item');
  }

  const durLabel = document.getElementById('tlDurationLabel');
  if (durLabel) durLabel.textContent = t ? t.formatTime(tlDuration()) : '';
  tlRenderRuler(span, width);
  tlSyncPlayhead();
}

// ---------------------------------------------------------------- dragging
function tlPointX(e) {
  if (e && typeof e.clientX === 'number') return e.clientX;
  if (e && e.touches && e.touches[0]) return e.touches[0].clientX;
  return 0;
}

function tlClipOffsetX(e, clipEl) {
  const rect = clipEl.getBoundingClientRect ? clipEl.getBoundingClientRect() : { left: 0, width: 0 };
  return tlPointX(e) - rect.left;
}

const TL_EDGE_PX = 8;          // how near an edge counts as grabbing it

function tlHitMode(e, clipEl, clip) {
  const rect = clipEl.getBoundingClientRect ? clipEl.getBoundingClientRect() : { width: 0 };
  // A zero-width rect means the element is not laid out yet (or there is no
  // layout at all): fall back to the width the renderer just wrote.
  const styleW = el => {
    const m = /width:\s*([\d.]+)px/.exec((el && el.getAttribute && el.getAttribute('style')) || '');
    return m ? Number(m[1]) : 0;
  };
  const w = rect.width || clipEl.offsetWidth || styleW(clipEl) || 100;
  const left = rect.width ? rect.left : Number(clipEl.dataset && clipEl.dataset.left) || 0;
  const off = tlPointX(e) - left;
  // a narrow clip is all handles; a wide one reserves the middle for moving
  if (off <= Math.min(TL_EDGE_PX, w * 0.34)) return 'in';
  if (off >= w - Math.min(TL_EDGE_PX, w * 0.34)) return 'out';
  return 'move';
}

function tlBeginDrag(e, clipId, mode, clipEl) {
  const t = tlModel();
  const clip = t.find(tlClips(), clipId);
  if (!clip) return;
  state.tl.selectedId = clipId;
  state.tl.drag = {
    id: clipId,
    mode,
    startX: tlPointX(e),
    spanSec: tlSpan(),                 // frozen: the scale must not move mid-drag
    width: tlLaneWidth(clipEl ? clipEl.parentElement : null),
    origin: { startSec: clip.startSec, srcIn: clip.srcIn, srcOut: clip.srcOut },
    applied: 0,
    moved: false
  };
  if (clipEl) clipEl.classList.add('is-dragging');
  document.body.classList.add('tl-dragging');
}

function tlDragTo(e) {
  const drag = state.tl && state.tl.drag;
  if (!drag) return false;
  const t = tlModel();
  const dx = tlPointX(e) - drag.startX;
  const dSec = (dx / Math.max(1, drag.width)) * drag.spanSec;
  if (Math.abs(dx) > 1) drag.moved = true;

  const clips = tlClips();
  if (!t.find(clips, drag.id)) return false;

  // Every move is measured from where the clip was when the drag started, not
  // from where the last move left it: otherwise each pointer event compounds
  // and a 3-second trim runs away to nothing.
  const restored = t.normalise(clips.map((c) => (c.id === drag.id
    ? Object.assign({}, c, drag.origin)
    : c)));
  const clip = t.find(restored, drag.id);

  // snap the edge being dragged, not the pointer: an edge landing exactly on
  // another clip's edge is the whole point of snapping
  const targets = t.snapTargets(restored, drag.id, [state.playheadSec]);
  const tol = (6 / Math.max(1, drag.width)) * drag.spanSec;

  let result;
  if (drag.mode === 'in') {
    const wantStart = t.snap(Math.max(0, clip.startSec + dSec), targets, tol);
    result = t.trimIn(restored, drag.id, wantStart - clip.startSec);
  } else if (drag.mode === 'out') {
    const wantEnd = t.snap(clip.startSec + t.len(clip) + dSec, targets, tol);
    result = t.trimOut(restored, drag.id, wantEnd - (clip.startSec + t.len(clip)));
  } else {
    const wantStart = t.snap(Math.max(0, clip.startSec + dSec), targets, tol);
    result = t.move(restored, drag.id, wantStart - clip.startSec);
  }

  state.tl.clips = result.clips;
  drag.applied += result.applied || 0;
  tlPaintClip(result.clip);
  tlShowTrimBadge(result.clip);
  renderTimelineSelection();
  return true;
}

/** Move just this clip's box. Cheap enough to run on every pointer event. */
function tlPaintClip(clip) {
  const t = tlModel();
  const el = document.querySelector(`#laneV1 .tl-clip[data-clipid="${clip.id}"]`);
  if (!t || !el) { renderTimelineTracks(); return; }
  const span = tlSpan();
  const width = tlLaneWidth(tlLaneEl());
  const left = t.timeToX(clip.startSec, span, width);
  const w = Math.max(2, Math.min((t.len(clip) / span) * width, width - left));
  el.style.left = `${left.toFixed(1)}px`;
  el.style.width = `${w.toFixed(1)}px`;
  el.dataset.left = left.toFixed(1);
  el.dataset.width = w.toFixed(1);
  const label = document.getElementById('tlDurationLabel');
  if (label) label.textContent = t.formatTime(tlDuration());
}

function tlEndDrag() {
  const drag = state.tl && state.tl.drag;
  if (!drag) return false;
  state.tl.drag = null;
  tlHideTrimBadge();
  document.body.classList.remove('tl-dragging');
  const clip = tlModel().find(tlClips(), drag.id);
  state.totalDurSec = Math.max(tlDuration(), 0) || state.totalDurSec;
  renderTimelineTracks();
  renderTimelineSelection();
  tlUpdateButtons();
  // show the frame the new cut lands on, so the trim is visible immediately
  if (clip && drag.moved) {
    state.playheadSec = Math.min(clip.startSec, Math.max(0, tlDuration() - 0.01));
    seekTo(state.playheadSec);
    showToast(`${clip.name} — in ${tlModel().formatTime(clip.srcIn)}, out ${tlModel().formatTime(clip.srcOut)}, `
      + `length ${tlModel().formatLen(tlModel().len(clip))}`, 'ok');
  }
  return true;
}

function tlSplitAtPlayhead() {
  const t = tlModel();
  const clips = tlClips();
  const sel = tlSelected();
  const under = t.clipAt(clips, state.playheadSec) || sel;
  if (!under) {
    showToast('Put the playhead inside a clip first', 'warn');
    return null;
  }
  const res = t.splitAt(clips, under.id, state.playheadSec);
  if (!res.made.length) {
    showToast('The playhead is at the clip edge — move it inside the clip', 'warn');
    return null;
  }
  tlSetClips(res.clips);
  state.tl.selectedId = res.made[1].id;
  renderTimelineSelection();
  showToast('Split into two clips you can trim independently', 'ok');
  return res.made;
}

function tlDeleteSelected() {
  const sel = tlSelected();
  if (!sel) {
    showToast('Select a clip first', 'warn');
    return false;
  }
  const t = tlModel();
  tlSetClips(t.remove(tlClips(), sel.id));
  state.tl.selectedId = null;
  renderTimelineSelection();
  showToast(`Removed “${sel.name}”`);
  return true;
}

function tlScrubTo(e) {
  const t = tlModel();
  const ruler = document.getElementById('tlRuler');
  if (!t || !ruler) return;
  const rect = ruler.getBoundingClientRect ? ruler.getBoundingClientRect() : { left: 0, width: 0 };
  const width = tlLaneWidth(tlLaneEl());
  const x = Math.max(0, Math.min(width, tlPointX(e) - rect.left));
  const span = tlSpan();
  seekTo(t.xToTime(x, span, width));
}

function initTimelineEditing() {
  const lane = tlLaneEl();
  // Safari, Chrome and Firefox all have PointerEvent; the mouse/touch fallback
  // is for anything that does not, because a timeline that silently does
  // nothing is worse than one with an old event name.
  const hasPointer = typeof window.PointerEvent === 'function';
  const DOWN = hasPointer ? 'pointerdown' : 'mousedown';
  const MOVE = hasPointer ? 'pointermove' : 'mousemove';
  const UP = hasPointer ? 'pointerup' : 'mouseup';

  // ---- grab a clip -------------------------------------------------------
  if (lane) {
    lane.addEventListener(DOWN, (e) => {
      const el = e.target && e.target.closest ? e.target.closest('.tl-clip') : null;
      if (!el) {
        // a click on the empty lane clears the selection
        state.tl.selectedId = null;
        renderTimelineSelection();
        tlHighlightSelection();
        return;
      }
      if (!el.dataset.clipid) return;
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      const mode = tlHitMode(e, el);
      tlBeginDrag(e, el.dataset.clipid, mode, el);
      // Select the clip in place. Rebuilding the lane here would delete the
      // element the pointer is holding — the drag then dies on touch, and it
      // flickers on every click.
      tlHighlightSelection();
      renderTimelineSelection();
    });
  }

  // ---- scrub on the ruler -------------------------------------------------
  const ruler = document.getElementById('tlRuler');
  if (ruler) {
    ruler.addEventListener(DOWN, (e) => {
      if (e.preventDefault) e.preventDefault();
      state.tl.scrubbing = true;
      tlScrubTo(e);
    });
  }

  const onMove = (e) => {
    if (state.tl.drag) { tlDragTo(e); return; }
    if (state.tl.scrubbing) tlScrubTo(e);
  };
  const onUp = () => {
    if (state.tl.drag) tlEndDrag();
    state.tl.scrubbing = false;
    tlHideTrimBadge();
  };
  // window, not document: a fast drag can leave the document over an iframe
  window.addEventListener(MOVE, onMove, { passive: true });
  window.addEventListener(UP, onUp);
  window.addEventListener(hasPointer ? 'pointercancel' : 'blur', onUp);
  // a drag that ends outside the page still has to end
  window.addEventListener('blur', onUp);

  // ---- buttons ------------------------------------------------------------
  const addBtn = document.getElementById('tlAddClipBtn');
  if (addBtn) addBtn.addEventListener('click', () => tlAddClipFromStage());
  const splitBtn = document.getElementById('tlSplitBtn');
  if (splitBtn) splitBtn.addEventListener('click', () => tlSplitAtPlayhead());
  const delBtn = document.getElementById('tlDeleteBtn');
  if (delBtn) delBtn.addEventListener('click', () => tlDeleteSelected());

  // the empty note is the invitation: clicking it does what it says
  const note = document.getElementById('tlEmptyNote');
  if (note) {
    note.classList.add('is-actionable');
    note.addEventListener('click', () => tlAddClipFromStage());
  }

  // ---- keys ---------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && state.tl.selectedId) {
      e.preventDefault();
      tlDeleteSelected();
    } else if ((e.key === 's' || e.key === 'S') && !e.metaKey && !e.ctrlKey && state.tl.selectedId) {
      e.preventDefault();
      tlSplitAtPlayhead();
    } else if (e.key === 'Escape' && state.tl.drag) {
      tlEndDrag();
    }
  });

  window.addEventListener('resize', () => renderTimelineTracks());
  tlUpdateButtons();
}

/** Selection class without re-rendering: the drag must keep its element. */
function tlHighlightSelection() {
  const lane = tlLaneEl();
  if (!lane || !lane.querySelectorAll) return;
  lane.querySelectorAll('.tl-clip').forEach((el) => {
    const on = !!state.tl.selectedId && el.dataset.clipid === state.tl.selectedId;
    el.classList.toggle('is-selected', on);
    if (!on) el.classList.remove('is-dragging');
    if (on && state.tl.drag) el.classList.add('is-dragging');
  });
}

/** Split and Delete only light up when they have something to work on. */
function tlUpdateButtons() {
  const hasSel = !!tlSelected();
  const dur = tlDuration();
  const split = document.getElementById('tlSplitBtn');
  const del = document.getElementById('tlDeleteBtn');
  if (split) {
    const inside = hasSel && state.playheadSec > 0.001 && state.playheadSec < dur - 0.001;
    split.disabled = !(inside || (!!tlModel() && !!tlModel().clipAt(tlClips(), state.playheadSec)));
    split.title = 'Cut the clip under the playhead in two (S)';
  }
  if (del) {
    del.disabled = !hasSel;
    del.title = hasSel ? 'Remove the selected clip (Delete)' : 'Select a clip first';
  }
}

/** A small readout that follows the pointer while an edge is being dragged. */
function tlShowTrimBadge(clip) {
  const t = tlModel();
  const lane = tlLaneEl();
  if (!t || !lane || !lane.parentElement) return;
  let badge = document.getElementById('tlTrimBadge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'tlTrimBadge';
    badge.className = 'tl-trim-badge';
    lane.parentElement.appendChild(badge);
  }
  const laneRect = lane.getBoundingClientRect ? lane.getBoundingClientRect() : { left: 0, top: 0 };
  const x = t.timeToX(clip.startSec + t.len(clip), tlSpan(), tlLaneWidth(lane));
  badge.textContent = t.formatLen(t.len(clip));
  badge.style.left = `${(laneRect.left || 0) - (lane.parentElement.getBoundingClientRect().left || 0) + x}px`;
  badge.style.top = `${(laneRect.top || 0) - (lane.parentElement.getBoundingClientRect().top || 0) - 2}px`;
  badge.style.display = 'block';
}

function tlHideTrimBadge() {
  const badge = document.getElementById('tlTrimBadge');
  if (badge) badge.style.display = 'none';
}

// ============================================================================
// REAL-TIME 60FPS OPTICAL SHADER, FRAME-ACCUMULATION & LYRC ENGINE
// ============================================================================
let lastFrameTs = performance.now();

function renderLivePreviewLoop(now) {
  try {
    renderLivePreviewFrame(now);
  } catch (err) {
    // A throw inside requestAnimationFrame used to stop the loop forever: the
    // monitor froze and nothing said why. Draw again next frame instead.
    if (!renderLivePreviewLoop.warned) {
      renderLivePreviewLoop.warned = true;
      if (window.console && console.error) console.error('[monitor] frame failed', err);
    }
  }
  requestAnimationFrame(renderLivePreviewLoop);
}

function renderLivePreviewFrame(now) {
  const dt = Math.min(0.05, (now - lastFrameTs) / 1000);
  lastFrameTs = now;

  // Motion off freezes the whole monitor: shader time, beat pulse and lyric
  // animation all derive from this timestamp, so nothing keeps drifting.
  if (!state.motion) {
    captureFrozenTime(now / 1000);
  }

  if (state.isPlaying && state.motion && state.totalDurSec > 0) {
    if (tlClips().length) {
      // A timeline ends. It does not loop back to the start mid-sentence.
      state.playheadSec = Math.min(state.totalDurSec, state.playheadSec + dt);
    } else {
      state.playheadSec = (state.playheadSec + dt) % state.totalDurSec;
    }
    silenceSkipTick();
    tlPlaybackTick();
    const pct = (state.playheadSec / state.totalDurSec) * 100;
    const scrubber = document.getElementById('timelineScrubber');
    if (scrubber && document.activeElement !== scrubber) {
      scrubber.value = Math.round(pct * 10);
    }
    tlSyncPlayhead();
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
  // While the cutter is rendering it drives the element slice by slice; a
  // transport sync here would yank the picture back to the playhead mid-record.
  if (state.silenceRendering) return;
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
  const mapped = stageSourceTime(state.playheadSec);
  const dur = Number(vid.duration);
  if (mapped == null) {
    // the playhead is over a gap in the timeline: nothing to show, so hold
    try { vid.pause(); } catch (_e) { /* ignore */ }
    return;
  }
  if (Number.isFinite(dur) && dur > 0.05) {
    try { vid.currentTime = mapped % dur; } catch (_e) { /* ignore */ }
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
  // With clips on the timeline the playhead is timeline time and the element
  // needs source time: this is what makes a trim change the picture.
  const mapped = stageSourceTime(clamped);
  if (vid && state.scene === 'custom_video' && Number.isFinite(dur) && dur > 0.05) {
    if (mapped == null) {
      try { vid.pause(); } catch (_e) { /* ignore */ }
    } else {
      try { vid.currentTime = mapped % dur; } catch (_e) { /* ignore */ }
    }
  }
  const scrub = document.getElementById('timelineScrubber');
  if (scrub && state.totalDurSec > 0) {
    scrub.value = String(Math.round((clamped / state.totalDurSec) * 1000));
  }
  if (state.depth) depthRescan({ silent: true, timeSec: clamped });
}

// The stage has real audio. It was muted everywhere (so the monitor stayed quiet
// and, worse, transcription captured nothing but silence), with no way to hear
// the clip you were working on.
function applyStageSound() {
  const vid = document.getElementById('customVideoElement');
  if (vid) vid.muted = !state.stageSound;
  const btn = document.getElementById('stageAudioBtn');
  if (btn) {
    btn.textContent = state.stageSound ? 'Sound: ON' : 'Sound: OFF';
    btn.classList.toggle('is-off', !state.stageSound);
    btn.title = state.stageSound
      ? 'The clip is audible — click to mute the monitor (transcription still hears it)'
      : 'Monitor muted — click to hear the clip again';
  }
  if (window.AudioLab && window.AudioLab.setMonitorLevel) {
    window.AudioLab.setMonitorLevel(state.stageSound ? 1 : 0);
  }
}

function setStageSound(on) {
  state.stageSound = !!on;
  applyStageSound();
  saveUiPrefs();
  if (state.stageSound) showToast('Sound on — you will hear the clip as it plays');
  else showToast('Monitor muted — detection and transcription still hear the clip');
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
  applyLyricsState(persist !== false);
  // The subtitle lane on the timeline strip follows the same switch, so it is
  // rebuilt here rather than only cleared: turning captions on has to show them
  // everywhere they are drawn.
  if (typeof lyricPushTimeline === 'function') lyricPushTimeline();
  else renderTimelineTracks();
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
  syncPreviewCanvasSize(canvas);
  const ctx = canvas.getContext('2d');
  const cw = canvas.width;
  const ch = canvas.height;

  // The monitor is a frame, not a stretch target. Whatever shape the window
  // gives the canvas, the picture is letterboxed into a 16:9 (or 9:16) frame
  // and the rest stays black — the way a viewer behaves in any NLE. Without
  // this, a wide short stage turned a portrait clip into a thin band.
  const frame = outputFrameRect(cw, ch);
  ctx.save();
  ctx.fillStyle = '#04060a';
  ctx.fillRect(0, 0, cw, ch);
  if (frame.w < cw || frame.h < ch) {
    ctx.beginPath();
    ctx.rect(frame.x, frame.y, frame.w, frame.h);
    ctx.clip();
  }
  ctx.translate(frame.x, frame.y);
  const w = frame.w;
  const h = frame.h;

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
    ctx.restore();
    plateSlotActive = false;
    return;
  }

  if (!offscreenBuffer) {
    offscreenBuffer = document.createElement('canvas');
    offscreenBuffer.width = w;
    offscreenBuffer.height = h;
    offscreenCtx = offscreenBuffer.getContext('2d');
  }
  // the window can be resized mid-session: the history buffer has to follow
  if (offscreenBuffer.width !== w || offscreenBuffer.height !== h) {
    offscreenBuffer.width = w;
    offscreenBuffer.height = h;
  }

  const preset = state.activePreset;
  const effectType = preset ? (preset.effectType || 'opt_halation') : null;
  // per-effect intensity (keyframed curve or slider) × global master scale
  const intensity = preset ? effectiveIntensity(preset.id, state.playheadSec) / 100 : 0;
  const grainAmount = (state.mixStylized / 100);
  const beatPhase = (t * (state.bpm / 60)) % 1;
  const onBeatPulse = Math.pow(Math.max(0, 1 - beatPhase * 3.5), 2.2);
  const fxP = preset ? fxParamsOf(preset) : {};
  const fxv = (key, fallback) => (fxP[key] === undefined ? fallback : fxP[key]);

  // Step-print / 8fps quantize time when time_smear is active
  const smearFps = Math.max(1, fxv('quantise', 9));
  const renderTime = effectType === 'time_smear' ? Math.floor(t * smearFps) / smearFps : t;

  ctx.save();

  // If 360° Shutter Smear is active, blend previous frame buffer instead of hard clearing
  if (effectType === 'time_smear' && !state.splitCompare) {
    // Decay is how much of the previous frame survives; Trails repeats the
    // echo so long shutters stack instead of ghosting once.
    const decay = fxv('decay', 55) / 100;
    const trails = Math.max(1, Math.round(fxv('trails', 8) / 2));
    ctx.globalAlpha = 0.2 + decay * 0.5;
    for (let i = 0; i < trails; i++) ctx.drawImage(offscreenBuffer, 0, 0);
    ctx.globalAlpha = 1 - decay * 0.6;
  } else {
    ctx.clearRect(0, 0, w, h);
  }

  // Physical Camera Weight & Kinetic Transforms (Critically damped, never cartoonish)
  let dx = 0;
  let dy = 0;
  let scale = 1.0;
  let rot = 0;

  if (effectType === 'cam_float') {
    // Drift is the amplitude of the handheld float, Rate its frequency and Roll
    // how much the horizon breathes — a tripod does none of these.
    const drift = fxv('drift', 55) / 100;
    const rate = Math.max(0.1, fxv('rate', 17) / 10);
    const roll = fxv('roll', 40) / 100;
    dx = Math.sin(t * rate) * 9 * drift * intensity;
    dy = Math.cos(t * rate * 0.76) * 7 * drift * intensity;
    rot = Math.sin(t * rate * 0.53) * 0.012 * roll * intensity;
    scale = 1.02;
  } else if (effectType === 'opt_gateweave') {
    const amp = fxv('amplitude', 40) / 100;
    const speed = Math.max(1, fxv('speed', 19));
    const breath = fxv('breath', 30) / 100;
    dx = (Math.sin(t * speed) * 1.4 + Math.cos(t * speed * 1.6) * 0.9) * amp * intensity;
    dy = (Math.cos(t * speed * 1.2) * 1.2) * amp * intensity;
    scale = 1 + breath * 0.03 * intensity;
  } else if (effectType === 'cam_thump' || state.hitFlashBurst > 0.05) {
    const impact = fxv('impact', 100) / 100;
    const recover = fxv('recover', 50) / 100;
    const shakeP = fxv('shake', 35) / 100;
    const thump = (0.075 * intensity * onBeatPulse * impact) + (state.hitFlashBurst * 0.09);
    scale = 1.0 + thump;
    dy = Math.sin(beatPhase * Math.PI * 2) * 3.5 * thump * 10 * shakeP;
    dx = Math.cos(beatPhase * Math.PI * 2) * 2.2 * thump * 10 * shakeP * (1 + recover);
  } else if (effectType === 'time_velocity') {
    const exposure = fxv('exposure', 60) / 100;
    scale = 1.0 + 0.16 * intensity * Math.pow(onBeatPulse, 1.5) * (0.4 + exposure);
  } else if (effectType === 'cam_whip') {
    const dist = fxv('distance', 60) / 100;
    const settle = fxv('settle', 40) / 100;
    const swing = Math.pow(onBeatPulse, 2 + settle) * 58 * intensity * (Math.floor(t) % 2 === 0 ? 1 : -1);
    dx = swing * (0.4 + dist);
    scale = 1 + 0.06 * (0.5 + dist);
  } else if (effectType === 'cam_handheld') {
    // Handheld: a long slow sway, a short micro jitter and a breath. Three
    // different frequencies, which is what makes it read as a person.
    const sway = fxv('sway', 50) / 100;
    const speed = Math.max(0.2, fxv('speed', 12) / 10);
    const jitter = fxv('jitter', 30) / 100;
    const breathe = fxv('breathe', 25) / 100;
    dx = (Math.sin(t * speed) * 8 * sway + Math.sin(t * speed * 7.3) * 1.6 * jitter) * intensity;
    dy = (Math.cos(t * speed * 0.81) * 6 * sway + Math.cos(t * speed * 9.1) * 1.4 * jitter) * intensity;
    rot = Math.sin(t * speed * 0.6) * 0.008 * sway * intensity;
    scale = 1.03 + Math.sin(t * speed * 0.45) * 0.004 * breathe;
  } else if (effectType === 'cam_dolly_punch') {
    const punch = fxv('punch', 100) / 100;
    const ease = fxv('ease', 50) / 100;
    const settleDrift = fxv('settle', 40) / 100;
    const hit = Math.pow(onBeatPulse, 1 + (1 - ease) * 3) * 0.18 * punch * intensity;
    scale = 1.01 + hit;
    dy = Math.sin(t * 0.35) * 2.5 * settleDrift * intensity;
  } else if (effectType === 'cam_truck') {
    // A truck is a lateral move on a dolly, not a pan: the frame slides
    // sideways while the lens keeps pointing the same way.
    const dist = fxv('distance', 45) / 100;
    const rate = Math.max(0.1, fxv('rate', 8) / 10);
    dx = Math.sin(t * rate) * w * 0.05 * dist * intensity;
    scale = Math.max(1, fxv('zoom', 108) / 100);
  } else if (effectType === 'cam_roll_pulse') {
    // Dutch roll that snaps in on the beat and settles back.
    const amt = fxv('roll', 45) / 100;
    const attack = fxv('attack', 20) / 100;
    const settleP = fxv('settle', 55) / 100;
    const env = Math.pow(onBeatPulse, 1 + attack * 3) * (1 - settleP * 0.6);
    rot = env * amt * 0.09 * intensity;
    scale = 1.02;
  } else if (effectType === 'ed_punch_in') {
    // Editorial punch-in: a straight scale about the frame centre plus a pan,
    // which is what an editor does instead of re-cutting the shot.
    const zoomP = Math.max(1, fxv('zoom', 118) / 100);
    scale = 1 + (zoomP - 1) * Math.min(1, intensity);
    dx = (fxv('panX', 0) / 100) * w * 0.25;
    dy = (fxv('panY', 0) / 100) * h * 0.25;
  } else if (effectType === 'cam_push_drift') {
    // A slow push that never quite stops, with a drift on the other axis so it
    // does not look like a zoom button.
    const pushP = fxv('push', 45) / 100;
    const rateP = Math.max(0.1, fxv('rate', 6) / 10);
    const driftP = fxv('drift', 30) / 100;
    const cycle = 0.5 - 0.5 * Math.cos(t * rateP);
    scale = 1 + pushP * 0.12 * cycle * intensity;
    dx = Math.sin(t * rateP * 0.5) * w * 0.02 * driftP * intensity;
  }

  ctx.save();
  ctx.translate(w / 2 + dx, h / 2 + dy);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);

  // Render Cinematic Lighting Plate (or Custom User Video)
  drawCinematicPlate(ctx, w, h, renderTime, onBeatPulse);

  // Apply Non-Corny Optical, Shutter & Film Lab Shader Pass
  if (state.splitCompare && effectType) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(w / 2, 0, w / 2, h);
    ctx.clip();
    drawCinemaOpticalShader(ctx, w, h, renderTime, effectType, intensity, onBeatPulse, grainAmount, fxP);
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
  } else if (state.presetPicked && effectType) {
    drawCinemaOpticalShader(ctx, w, h, renderTime, effectType, intensity, onBeatPulse, grainAmount, fxP);
  }

  // Depth-driven effect stack: on the picture only, so lyrics stay crisp
  applyDepthStack(ctx, w, h, t);

  // Stacked effect layers, in order, with their own opacity + blend mode
  renderEffectLayers(ctx, w, h, renderTime, onBeatPulse, grainAmount);

  ctx.restore();

  // Save current frame into offscreen history buffer for 360° Shutter accumulation
  offscreenCtx.clearRect(0, 0, w, h);
  offscreenCtx.drawImage(canvas, frame.x, frame.y, w, h, 0, 0, w, h);

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

  ctx.restore();          // the picture's own save
  ctx.restore();          // the letterbox clip
  plateSlotActive = false;
}

/** Keep the canvas's pixels matched to the box it is displayed in. */
function syncPreviewCanvasSize(canvas) {
  const el = canvas || document.getElementById('livePreviewCanvas');
  if (!el) return;
  const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
  const cssW = Math.round((rect && rect.width) || el.clientWidth || 0);
  const cssH = Math.round((rect && rect.height) || el.clientHeight || 0);
  if (!(cssW > 8) || !(cssH > 8)) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  // 1600 px on the long edge is plenty for a monitor and keeps the shader pass
  // at a sane cost: the effects run per pixel, every frame.
  const cap = Math.min(dpr, 1600 / Math.max(cssW, cssH));
  const bw = Math.max(160, Math.round(cssW * cap));
  const bh = Math.max(90, Math.round(cssH * cap));
  if (el.width !== bw || el.height !== bh) {
    el.width = bw;
    el.height = bh;
  }
}

/**
 * Say the truth about the framing. A portrait clip shown in a 16:9 frame is a
 * crop, not a bug — but it looks like one if nothing explains it.
 */
function syncStageHint() {
  const el = document.getElementById('stageHint');
  if (!el) return;
  const vid = document.getElementById('customVideoElement');
  const vw = vid ? Number(vid.videoWidth) || 0 : 0;
  const vh = vid ? Number(vid.videoHeight) || 0 : 0;
  const imgW = customImageEl ? Number(customImageEl.naturalWidth) || 0 : 0;
  const imgH = customImageEl ? Number(customImageEl.naturalHeight) || 0 : 0;
  const w = state.scene === 'custom_video' ? vw : imgW;
  const h = state.scene === 'custom_video' ? vh : imgH;
  let text = '';
  if (w > 0 && h > 0) {
    const portrait = h > w * 1.05;
    if (portrait && !state.vertical916) {
      text = `Portrait clip (${w}×${h}) — press 9:16: ON to see the whole frame`;
    } else if (!portrait && state.vertical916) {
      text = `Landscape clip (${w}×${h}) — 9:16 crops the sides; press 9:16: OFF for the full frame`;
    }
  }
  el.textContent = text;
  el.classList.toggle('hidden', !text);
}

/** The output frame, letterboxed inside the canvas. */
function outputFrameRect(w, h) {
  const aspect = state.vertical916 ? 9 / 16 : 16 / 9;
  let fw = w;
  let fh = Math.round(w / aspect);
  if (fh > h) {
    fh = h;
    fw = Math.round(h * aspect);
  }
  return {
    x: Math.round((w - fw) / 2),
    y: Math.round((h - fh) / 2),
    w: Math.max(2, fw),
    h: Math.max(2, fh)
  };
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

// ============================================================================
// LOOK PARAMETERS — every look is more than one number
// ----------------------------------------------------------------------------
// An intensity slider asks "how much?". These ask "how does it look?: how wide
// the halation is, how high the highlight threshold sits, how warm the bleed is,
// how strong the grain is. Each effect declares its own controls, a preset can
// ship its own starting values, and the panel renders the rack for whatever look
// is selected. The last three are universal: every effect in the list gets them.
// ============================================================================
const FX_FINISH_PARAMS = [
  { k: 'mix', label: 'Mix with original', min: 0, max: 100, def: 100, unit: '%' },
  { k: 'finishGrain', label: 'Grain', min: 0, max: 100, def: 0, unit: '' },
  { k: 'finishTemp', label: 'Temperature', min: -100, max: 100, def: 0, unit: 'K' }
];

const FX_PARAM_DEFS = {
  // ---- optical
  opt_halation: [
    { k: 'radius', label: 'Scatter radius', min: 20, max: 360, def: 180, unit: 'px' },
    { k: 'threshold', label: 'Highlight threshold', min: 40, max: 100, def: 78, unit: '%' },
    { k: 'warmth', label: 'Bleed colour', min: 0, max: 100, def: 62, unit: '' },
    { k: 'bloom', label: 'Bloom strength', min: 0, max: 180, def: 100, unit: '%' }
  ],
  opt_fringe: [
    { k: 'offset', label: 'Fringe spread', min: 2, max: 60, def: 14, unit: 'px' },
    { k: 'ghost', label: 'Ghost opacity', min: 0, max: 100, def: 34, unit: '%' },
    { k: 'tint', label: 'R/C balance', min: -100, max: 100, def: 0, unit: '' }
  ],
  opt_prism: [
    { k: 'offset', label: 'Refraction shift', min: 2, max: 70, def: 22, unit: 'px' },
    { k: 'ghost', label: 'Ghost opacity', min: 0, max: 100, def: 40, unit: '%' },
    { k: 'corner', label: 'Corner reach', min: 10, max: 100, def: 62, unit: '%' }
  ],
  opt_diopter: [
    { k: 'split', label: 'Split position', min: 25, max: 75, def: 42, unit: '%' },
    { k: 'zoom', label: 'Near-plane zoom', min: 100, max: 145, def: 116, unit: '%' },
    { k: 'seam', label: 'Seam glow', min: 0, max: 100, def: 32, unit: '%' }
  ],
  opt_gateweave: [
    { k: 'amplitude', label: 'Weave amplitude', min: 0, max: 100, def: 40, unit: '%' },
    { k: 'speed', label: 'Weave rate', min: 4, max: 60, def: 19, unit: 'Hz' },
    { k: 'breath', label: 'Gate breathing', min: 0, max: 100, def: 30, unit: '%' }
  ],
  opt_tilt: [
    { k: 'band', label: 'Focus band width', min: 5, max: 60, def: 22, unit: '%' },
    { k: 'defocus', label: 'Defocus amount', min: 0, max: 100, def: 60, unit: '%' },
    { k: 'angle', label: 'Plane angle', min: -80, max: 80, def: 45, unit: '°' }
  ],
  // ---- lab
  lab_bleach: [
    { k: 'desat', label: 'Silver retention', min: 0, max: 100, def: 68, unit: '%' },
    { k: 'contrast', label: 'Contrast lift', min: 0, max: 100, def: 32, unit: '%' },
    { k: 'push', label: 'Shadow density', min: 0, max: 100, def: 26, unit: '%' }
  ],
  lab_2383: [
    { k: 'warm', label: 'Highlight warmth', min: 0, max: 100, def: 20, unit: '%' },
    { k: 'cyan', label: 'Cyan shadow lift', min: 0, max: 100, def: 55, unit: '%' },
    { k: 'toe', label: 'Toe contrast', min: 0, max: 100, def: 30, unit: '%' }
  ],
  lab_flir: [
    { k: 'invert', label: 'Thermal inversion', min: 0, max: 100, def: 78, unit: '%' },
    { k: 'detail', label: 'Edge detail', min: 0, max: 100, def: 40, unit: '%' },
    { k: 'palette', label: 'Palette heat', min: 0, max: 100, def: 50, unit: '%' }
  ],
  lab_litho: [
    { k: 'threshold', label: 'Tone threshold', min: 0, max: 100, def: 50, unit: '%' },
    { k: 'tone', label: 'Print tone', min: 0, max: 100, def: 30, unit: '%' },
    { k: 'softness', label: 'Edge softness', min: 0, max: 100, def: 35, unit: '%' }
  ],
  lab_leak: [
    { k: 'speed', label: 'Leak travel', min: 20, max: 420, def: 220, unit: 'px/s' },
    { k: 'width', label: 'Leak width', min: 20, max: 260, def: 90, unit: 'px' },
    { k: 'warmth', label: 'Leak colour', min: 0, max: 100, def: 70, unit: '' }
  ],
  // ---- time / shutter
  time_smear: [
    { k: 'trails', label: 'Trail samples', min: 2, max: 24, def: 8, unit: '' },
    { k: 'decay', label: 'Trail decay', min: 0, max: 100, def: 55, unit: '%' },
    { k: 'quantise', label: 'Step print', min: 1, max: 24, def: 9, unit: 'fps' }
  ],
  time_velocity: [
    { k: 'exposure', label: 'Shutter exposure', min: 0, max: 100, def: 60, unit: '%' },
    { k: 'streak', label: 'Streak length', min: 0, max: 100, def: 45, unit: '%' },
    { k: 'samples', label: 'Sub-frame samples', min: 2, max: 16, def: 6, unit: '' }
  ],
  time_snip: [
    { k: 'slice', label: 'Slice height', min: 2, max: 60, def: 14, unit: 'px' },
    { k: 'jitter', label: 'Frame jitter', min: 0, max: 100, def: 50, unit: '%' },
    { k: 'flash', label: 'Splice flash', min: 0, max: 100, def: 38, unit: '%' }
  ],
  // ---- camera
  cam_float: [
    { k: 'drift', label: 'Drift amount', min: 0, max: 100, def: 55, unit: '%' },
    { k: 'rate', label: 'Drift rate', min: 0.2, max: 4, def: 1.7, unit: 'Hz' },
    { k: 'roll', label: 'Roll', min: 0, max: 100, def: 40, unit: '%' }
  ],
  cam_thump: [
    { k: 'impact', label: 'Impact scale', min: 0, max: 200, def: 100, unit: '%' },
    { k: 'recover', label: 'Recovery', min: 0, max: 100, def: 50, unit: '%' },
    { k: 'shake', label: 'Shake tail', min: 0, max: 100, def: 35, unit: '%' }
  ],
  cam_whip: [
    { k: 'distance', label: 'Whip distance', min: 0, max: 100, def: 60, unit: '%' },
    { k: 'blur', label: 'Directional blur', min: 0, max: 100, def: 55, unit: '%' },
    { k: 'settle', label: 'Settle time', min: 0, max: 100, def: 40, unit: '%' }
  ],
  // ---- editorial / depth
  depth_sep: [
    { k: 'subject', label: 'Subject size', min: 8, max: 45, def: 16, unit: '%' },
    { k: 'falloff', label: 'Depth falloff', min: 20, max: 95, def: 62, unit: '%' },
    { k: 'desat', label: 'Background desat', min: 0, max: 100, def: 95, unit: '%' }
  ],
  depth_streak: [
    { k: 'reach', label: 'Streak reach', min: 10, max: 100, def: 55, unit: '%' },
    { k: 'thickness', label: 'Streak thickness', min: 1, max: 24, def: 8, unit: 'px' },
    { k: 'tint', label: 'Streak colour', min: 0, max: 100, def: 55, unit: '' }
  ],
  ed_pip: [
    { k: 'size', label: 'Frame inset', min: 4, max: 40, def: 12, unit: '%' },
    { k: 'border', label: 'Border weight', min: 0, max: 100, def: 45, unit: '%' },
    { k: 'outside', label: 'Outside darkness', min: 0, max: 100, def: 0, unit: '%' }
  ],
  ed_scope: [
    { k: 'bars', label: 'Scope bars', min: 4, max: 26, def: 13, unit: '%' },
    { k: 'edge', label: 'Bar feather', min: 0, max: 100, def: 0, unit: '%' },
    { k: 'guides', label: 'Centre guides', min: 0, max: 100, def: 0, unit: '%' }
  ],

  // ---- optical, second set
  opt_anamorphic_streak: [
    { k: 'length', label: 'Streak length', min: 0, max: 100, def: 60, unit: '%' },
    { k: 'thickness', label: 'Streak thickness', min: 1, max: 14, def: 3, unit: 'px' },
    { k: 'threshold', label: 'Source brightness', min: 30, max: 100, def: 70, unit: '%' },
    { k: 'tint', label: 'Streak colour', min: 0, max: 100, def: 40, unit: '' }
  ],
  opt_lens_dirt: [
    { k: 'amount', label: 'Dirt amount', min: 0, max: 100, def: 40, unit: '%' },
    { k: 'size', label: 'Smudge size', min: 0, max: 100, def: 55, unit: '%' },
    { k: 'warmth', label: 'Smudge colour', min: 0, max: 100, def: 40, unit: '' },
    { k: 'specks', label: 'Dust specks', min: 0, max: 100, def: 35, unit: '%' }
  ],

  // ---- film lab, second set
  lab_xprocess: [
    { k: 'shadows', label: 'Shadow shift', min: -100, max: 100, def: -30, unit: '' },
    { k: 'highlights', label: 'Highlight shift', min: -100, max: 100, def: 55, unit: '' },
    { k: 'saturation', label: 'Saturation', min: 0, max: 100, def: 70, unit: '%' },
    { k: 'contrast', label: 'Contrast', min: 0, max: 100, def: 35, unit: '%' }
  ],
  lab_duotone: [
    { k: 'shadowHue', label: 'Shadow ink', min: 0, max: 360, def: 40, unit: '°' },
    { k: 'highlightHue', label: 'Highlight ink', min: 0, max: 360, def: 190, unit: '°' },
    { k: 'blend', label: 'Ink mixture', min: 0, max: 100, def: 60, unit: '%' },
    { k: 'contrast', label: 'Print contrast', min: 0, max: 100, def: 35, unit: '%' }
  ],

  // ---- shutter / time, second set
  time_echo: [
    { k: 'delay', label: 'Echo delay', min: 1, max: 24, def: 8, unit: 'fr' },
    { k: 'ghost', label: 'Echo opacity', min: 0, max: 100, def: 45, unit: '%' },
    { k: 'offset', label: 'Echo offset', min: -60, max: 60, def: 0, unit: 'px' },
    { k: 'spread', label: 'Echo scale', min: 90, max: 115, def: 100, unit: '%' }
  ],
  time_gate_stutter: [
    { k: 'rate', label: 'Stutter rate', min: 1, max: 24, def: 6, unit: 'Hz' },
    { k: 'duty', label: 'Gate closed', min: 5, max: 70, def: 32, unit: '%' },
    { k: 'jitter', label: 'Line jitter', min: 0, max: 100, def: 40, unit: '%' },
    { k: 'dropout', label: 'Dropout smear', min: 0, max: 100, def: 25, unit: '%' }
  ],

  // ---- camera, second set
  cam_handheld: [
    { k: 'sway', label: 'Sway amount', min: 0, max: 100, def: 50, unit: '%' },
    { k: 'speed', label: 'Sway speed', min: 1, max: 40, def: 12, unit: '' },
    { k: 'jitter', label: 'Micro jitter', min: 0, max: 100, def: 30, unit: '%' },
    { k: 'breathe', label: 'Breathing', min: 0, max: 100, def: 25, unit: '%' }
  ],
  cam_dolly_punch: [
    { k: 'punch', label: 'Punch depth', min: 0, max: 200, def: 100, unit: '%' },
    { k: 'ease', label: 'Ease back', min: 0, max: 100, def: 50, unit: '%' },
    { k: 'settle', label: 'Settle drift', min: 0, max: 100, def: 40, unit: '%' }
  ],

  // ---- editorial, second set
  ed_letterbox: [
    { k: 'ratio', label: 'Frame ratio', min: 200, max: 260, def: 239, unit: 'x100' },
    { k: 'feather', label: 'Bar feather', min: 0, max: 100, def: 15, unit: '%' },
    { k: 'shift', label: 'Vertical shift', min: -30, max: 30, def: 0, unit: '%' },
    { k: 'shade', label: 'Bar density', min: 0, max: 100, def: 100, unit: '%' }
  ],
  ed_focus_pull: [
    { k: 'blur', label: 'Defocus depth', min: 0, max: 16, def: 6, unit: 'px' },
    { k: 'rate', label: 'Pull rate', min: 1, max: 20, def: 5, unit: '' },
    { k: 'hold', label: 'Sharp hold', min: 0, max: 90, def: 45, unit: '%' }
  ],

  // ---- depth, second set
  depth_haze: [
    { k: 'near', label: 'Clear zone', min: 0, max: 70, def: 30, unit: '%' },
    { k: 'haze', label: 'Haze density', min: 0, max: 100, def: 40, unit: '%' },
    { k: 'falloff', label: 'Distance falloff', min: 20, max: 95, def: 70, unit: '%' },
    { k: 'warmth', label: 'Haze colour', min: 0, max: 100, def: 50, unit: '' }
  ],
  depth_rim: [
    { k: 'width', label: 'Rim width', min: 1, max: 24, def: 6, unit: 'px' },
    { k: 'glow', label: 'Rim glow', min: 0, max: 100, def: 55, unit: '%' },
    { k: 'tint', label: 'Rim colour', min: 0, max: 100, def: 45, unit: '' }
  ],

  // ---- optical, third set
  opt_veiling_glare: [
    { k: 'threshold', label: 'Glare threshold', min: 20, max: 100, def: 60, unit: '%' },
    { k: 'spread', label: 'Glare spread', min: 20, max: 100, def: 60, unit: '%' },
    { k: 'lift', label: 'Black lift', min: 0, max: 100, def: 30, unit: '%' },
    { k: 'warmth', label: 'Glare colour', min: 0, max: 100, def: 45, unit: '' }
  ],
  opt_lens_distort: [
    { k: 'barrel', label: 'Barrel amount', min: 0, max: 60, def: 18, unit: '' },
    { k: 'edge', label: 'Corner falloff', min: 0, max: 100, def: 35, unit: '%' },
    { k: 'chroma', label: 'Edge colour', min: 0, max: 100, def: 20, unit: '%' }
  ],

  // ---- film lab, third set
  lab_negative: [
    { k: 'mask', label: 'Orange mask', min: 0, max: 100, def: 65, unit: '%' },
    { k: 'contrast', label: 'Contrast', min: 0, max: 100, def: 40, unit: '%' },
    { k: 'density', label: 'Density', min: 0, max: 100, def: 30, unit: '%' }
  ],
  lab_technicolor: [
    { k: 'saturation', label: 'Dye saturation', min: 0, max: 100, def: 75, unit: '%' },
    { k: 'warmth', label: 'Warm bias', min: -100, max: 100, def: 35, unit: '' },
    { k: 'contrast', label: 'Contrast', min: 0, max: 100, def: 45, unit: '%' },
    { k: 'threeStrip', label: 'Three-strip split', min: 0, max: 100, def: 55, unit: '%' }
  ],
  lab_print_screen: [
    { k: 'cell', label: 'Dot pitch', min: 3, max: 24, def: 7, unit: 'px' },
    { k: 'angle', label: 'Screen angle', min: 0, max: 90, def: 45, unit: '°' },
    { k: 'gain', label: 'Dot gain', min: 0, max: 100, def: 55, unit: '%' },
    { k: 'ink', label: 'Ink strength', min: 0, max: 100, def: 45, unit: '%' }
  ],

  // ---- shutter / time, third set
  time_light_trail: [
    { k: 'duration', label: 'Trail length', min: 1, max: 24, def: 10, unit: 'fr' },
    { k: 'decay', label: 'Trail decay', min: 0, max: 100, def: 45, unit: '%' },
    { k: 'gain', label: 'Exposure gain', min: 0, max: 100, def: 55, unit: '%' }
  ],
  time_freeze_push: [
    { k: 'hold', label: 'Hold frames', min: 2, max: 48, def: 12, unit: 'fr' },
    { k: 'push', label: 'Push in', min: 100, max: 125, def: 106, unit: '%' },
    { k: 'blend', label: 'Blend to live', min: 0, max: 100, def: 20, unit: '%' }
  ],

  // ---- camera, third set
  cam_truck: [
    { k: 'distance', label: 'Truck distance', min: 0, max: 100, def: 45, unit: '%' },
    { k: 'rate', label: 'Truck rate', min: 1, max: 30, def: 8, unit: '' },
    { k: 'zoom', label: 'Cover zoom', min: 100, max: 118, def: 108, unit: '%' }
  ],
  cam_roll_pulse: [
    { k: 'roll', label: 'Roll amount', min: 0, max: 100, def: 45, unit: '%' },
    { k: 'attack', label: 'Attack', min: 0, max: 100, def: 20, unit: '%' },
    { k: 'settle', label: 'Settle', min: 0, max: 100, def: 55, unit: '%' }
  ],

  // ---- depth, third set
  depth_dof: [
    { k: 'focus', label: 'Focus zone', min: 5, max: 70, def: 28, unit: '%' },
    { k: 'blur', label: 'Defocus blur', min: 0, max: 16, def: 6, unit: 'px' },
    { k: 'falloff', label: 'Falloff band', min: 0, max: 60, def: 22, unit: '%' }
  ],
  depth_grade_split: [
    { k: 'centre', label: 'Subject zone', min: 10, max: 60, def: 30, unit: '%' },
    { k: 'background', label: 'Background push', min: 0, max: 100, def: 55, unit: '%' },
    { k: 'tint', label: 'Background hue', min: 0, max: 360, def: 205, unit: '°' }
  ],

  // ---- editorial, third set
  ed_punch_in: [
    { k: 'zoom', label: 'Punch-in zoom', min: 100, max: 145, def: 118, unit: '%' },
    { k: 'panX', label: 'Pan across', min: -30, max: 30, def: 0, unit: '%' },
    { k: 'panY', label: 'Pan up / down', min: -30, max: 30, def: 0, unit: '%' }
  ],

  // ---- fourth set
  opt_bokeh_ring: [
    { k: 'size', label: 'Bokeh size', min: 4, max: 40, def: 16, unit: '%' },
    { k: 'count', label: 'Bokeh count', min: 3, max: 14, def: 7, unit: '' },
    { k: 'warmth', label: 'Bokeh colour', min: 0, max: 100, def: 50, unit: '' },
    { k: 'glow', label: 'Ring glow', min: 0, max: 100, def: 45, unit: '%' }
  ],
  opt_ghost_double: [
    { k: 'offset', label: 'Ghost offset', min: 0, max: 40, def: 14, unit: '%' },
    { k: 'scale', label: 'Ghost scale', min: 80, max: 130, def: 104, unit: '%' },
    { k: 'opacity', label: 'Ghost opacity', min: 0, max: 100, def: 40, unit: '%' },
    { k: 'flip', label: 'Mirror ghost', min: 0, max: 100, def: 50, unit: '' }
  ],
  lab_solarise: [
    { k: 'amount', label: 'Solarise amount', min: 0, max: 100, def: 55, unit: '%' },
    { k: 'pivot', label: 'Pivot', min: 0, max: 100, def: 55, unit: '%' },
    { k: 'tone', label: 'Tone shift', min: -100, max: 100, def: 20, unit: '' }
  ],
  lab_cyanotype: [
    { k: 'density', label: 'Cyan density', min: 0, max: 100, def: 65, unit: '%' },
    { k: 'paper', label: 'Paper warmth', min: 0, max: 100, def: 35, unit: '' },
    { k: 'contrast', label: 'Print contrast', min: 0, max: 100, def: 45, unit: '%' }
  ],
  time_strobe: [
    { k: 'rate', label: 'Strobe rate', min: 1, max: 24, def: 8, unit: 'Hz' },
    { k: 'duty', label: 'Open shutter', min: 5, max: 80, def: 40, unit: '%' },
    { k: 'trail', label: 'Afterglow', min: 0, max: 100, def: 30, unit: '%' }
  ],
  time_slit: [
    { k: 'slit', label: 'Slice width', min: 2, max: 48, def: 12, unit: 'px' },
    { k: 'spread', label: 'Frame spread', min: 1, max: 24, def: 10, unit: 'fr' },
    { k: 'drift', label: 'Drift', min: -100, max: 100, def: 0, unit: '%' }
  ],
  cam_vertigo: [
    { k: 'amount', label: 'Dolly-zoom amount', min: 0, max: 100, def: 55, unit: '%' },
    { k: 'rate', label: 'Zoom rate', min: 1, max: 20, def: 5, unit: '' },
    { k: 'edge', label: 'Edge stretch', min: 0, max: 100, def: 45, unit: '%' }
  ],
  cam_push_drift: [
    { k: 'push', label: 'Push in', min: 0, max: 100, def: 45, unit: '%' },
    { k: 'rate', label: 'Push rate', min: 1, max: 30, def: 6, unit: '' },
    { k: 'drift', label: 'Drift', min: 0, max: 100, def: 30, unit: '%' }
  ],
  depth_push_pull: [
    { k: 'push', label: 'Background push', min: 0, max: 30, def: 12, unit: '%' },
    { k: 'zone', label: 'Subject zone', min: 10, max: 60, def: 28, unit: '%' },
    { k: 'feather', label: 'Zone feather', min: 0, max: 60, def: 20, unit: '%' }
  ],
  depth_shadow_fall: [
    { k: 'density', label: 'Shadow density', min: 0, max: 100, def: 45, unit: '%' },
    { k: 'zone', label: 'Clear zone', min: 5, max: 60, def: 25, unit: '%' },
    { k: 'tint', label: 'Shadow colour', min: 0, max: 100, def: 40, unit: '' }
  ],
  ed_frame_guides: [
    { k: 'inset', label: 'Guide inset', min: 2, max: 20, def: 8, unit: '%' },
    { k: 'weight', label: 'Line weight', min: 0.5, max: 4, def: 1.2, unit: 'px' },
    { k: 'opacity', label: 'Guide opacity', min: 0, max: 100, def: 55, unit: '%' },
    { k: 'marks', label: 'Corner marks', min: 0, max: 100, def: 40, unit: '%' }
  ],
  ed_square_matte: [
    { k: 'ratio', label: 'Square ratio', min: 100, max: 200, def: 100, unit: '%' },
    { k: 'feather', label: 'Edge feather', min: 0, max: 100, def: 20, unit: '%' },
    { k: 'shade', label: 'Matte density', min: 0, max: 100, def: 100, unit: '%' }
  ]
};

// Every transition reads the same three story controls: where the seam sits,
// how soft it is, and how long it holds at each end of the cut.
const TR_PARAM_DEFS = [
  { k: 'direction', label: 'Seam direction', min: 0, max: 360, def: 90, unit: '°' },
  { k: 'softness', label: 'Seam softness', min: 0, max: 100, def: 45, unit: '%' },
  { k: 'hold', label: 'Hold at ends', min: 0, max: 80, def: 15, unit: '%' }
];
['tr_lumawipe', 'tr_feedbackzoom', 'tr_slitwipe', 'tr_glasspush',
  'tr_mirrorfold', 'tr_chromaslide', 'tr_rollershutter', 'tr_blobmorph'
].forEach((k) => { FX_PARAM_DEFS[k] = TR_PARAM_DEFS; });

// The TouchDesigner / data / glitch family shares one print-grade rack, read
// by the TOP engine after its shader runs. Same defaults-neutral rule: at 100
// / 100 / 0 the shader renders exactly as authored.
const TD_GRADE_PARAMS = [
  { k: 'tdContrast', label: 'TOP contrast', min: 0, max: 200, def: 100, unit: '%' },
  { k: 'tdChroma', label: 'TOP chroma', min: 0, max: 200, def: 100, unit: '%' },
  { k: 'tdTint', label: 'TOP tint', min: -100, max: 100, def: 0, unit: '' }
];
function applyTdGradeDefs() {
  if (!window.TD_PRESETS) return;
  window.TD_PRESETS.forEach((p) => {
    if (p && p.effectType && !FX_PARAM_DEFS[p.effectType]) {
      FX_PARAM_DEFS[p.effectType] = TD_GRADE_PARAMS;
    }
  });
}
applyTdGradeDefs();

function fxParamDefs(effectType) {
  const own = FX_PARAM_DEFS[effectType] || [];
  return own.concat(FX_FINISH_PARAMS);
}

// Hold reshapes the clock: with 80% hold the wipe sits still for most of the
// cycle and snaps through the middle.
function fxTransitionTime(t, holdPct) {
  const hold = Math.max(0, Math.min(0.8, (Number(holdPct) || 0) / 100));
  const raw = ((t % 1) + 1) % 1;
  if (hold <= 0.001) return t;
  const span = 1 - hold;
  const mid = raw < 0.5 ? raw / 0.5 : (1 - raw) / 0.5;   // 0..1..0 shape
  const eased = mid;
  const shaped = Math.min(1, Math.max(0, (eased - hold) / span));
  const out = raw < 0.5 ? shaped : 1 - shaped;
  return Math.floor(t) + out;
}

// The seam veil: a feathered directional edge over whatever the transition
// drew. Direction rotates it, softness widens it, and both are the user's.
function fxTransitionVeil(ctx, w, h, P, intensity) {
  const dir = ((P && P.direction !== undefined ? P.direction : 90) * Math.PI) / 180;
  const soft = (P && P.softness !== undefined ? P.softness : 45) / 100;
  const span = Math.max(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const dx = Math.cos(dir) * span * 0.5;
  const dy = Math.sin(dir) * span * 0.5;
  const g = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
  const mid = 0.5;
  const half = Math.max(0.02, soft * 0.45);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(Math.max(0, mid - half), 'rgba(0,0,0,0)');
  g.addColorStop(mid, `rgba(220, 236, 255, ${0.16 * Math.min(1, intensity)})`);
  g.addColorStop(Math.min(1, mid + half), 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function ensureFxParams() {
  if (!state.fxParams) state.fxParams = {};
  return state.fxParams;
}

// A preset can ship its own starting values; anything it does not set falls back
// to the effect's default, so old presets keep their old look.
function fxParam(preset, key) {
  const defs = fxParamDefs(preset && preset.effectType);
  const def = defs.find((d) => d.k === key);
  if (!def) return 0;
  const store = ensureFxParams()[preset.id];
  if (store && store[key] !== undefined) return store[key];
  const shipped = preset.params && preset.params[key];
  return shipped === undefined ? def.def : shipped;
}

function setFxParam(preset, key, value) {
  if (!preset) return;
  const defs = fxParamDefs(preset.effectType);
  const def = defs.find((d) => d.k === key);
  if (!def) return;
  const store = ensureFxParams();
  if (!store[preset.id]) store[preset.id] = {};
  store[preset.id][key] = Math.max(def.min, Math.min(def.max, Number(value)));
}

// Everything the shader needs, resolved once per frame.
function fxParamsOf(preset) {
  const out = {};
  if (!preset) return out;
  fxParamDefs(preset.effectType).forEach((d) => {
    out[d.k] = fxParam(preset, d.k);
  });
  return out;
}

function fxResetParams(preset) {
  if (!preset) return;
  const store = ensureFxParams();
  delete store[preset.id];
}

function drawCinemaOpticalShader(ctx, w, h, t, effectType, intensity, onBeatPulse, grainAmount, paramsIn) {
  const P = paramsIn || fxParamsOf(state.activePreset);
  const pick = (key, fallback) => (P[key] === undefined ? fallback : P[key]);

  // Keep a copy of the frame as it arrived, so "Mix with original" can dial the
  // whole look back towards the untouched plate — the same control every
  // Resolve effect has, and the one that makes an effect usable at low strength.
  const mixPct = pick('mix', 100);
  let before = null;
  if (mixPct < 99.5) {
    if (!fxScratch) fxScratch = document.createElement('canvas');
    if (fxScratch.width !== ctx.canvas.width || fxScratch.height !== ctx.canvas.height) {
      fxScratch.width = ctx.canvas.width;
      fxScratch.height = ctx.canvas.height;
    }
    const sctx = fxScratch.getContext('2d');
    if (sctx) {
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.clearRect(0, 0, fxScratch.width, fxScratch.height);
      sctx.drawImage(ctx.canvas, 0, 0);
      before = fxScratch;
    }
  }

  // ---------------------------------------------------------------------
  // TOUCHDESIGNER TOPs + TRANSITIONS & MORPHS → real generative shader pass
  // ---------------------------------------------------------------------
  if (window.TD_ENGINE && TD_ENGINE.hasShader(effectType)) {
    const preset = Object.assign({}, state.activePreset || { accent: '#e11d48' }, { params: P });
    // transitions scrub with the playhead so keyframed intensity reads correctly
    const isTransition = !!preset.isTransition || effectType.indexOf('tr_') === 0;
    const baseTime = preset.isTransition ? state.playheadSec : t;
    // Hold resets where in the wipe the transition sits, without moving the
    // playhead the user set: the curve still owns the overall progress.
    const shaderTime = isTransition ? fxTransitionTime(baseTime, pick('hold', 15)) : baseTime;
    TD_ENGINE.render(ctx, w, h, shaderTime, effectType, intensity, onBeatPulse, preset);
    if (isTransition) fxTransitionVeil(ctx, w, h, P, intensity);
    fxFinishPass(ctx, w, h, effectType, P, before, grainAmount);
    return;
  }

  // 1. 500T HALATION BLOOM / LAB LIGHT LEAK
  if (effectType === 'opt_halation' || effectType === 'lab_leak') {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const warm = pick('warmth', 62) / 100;
    const bloom = pick('bloom', 100) / 100;
    const radiusPx = Math.max(20, pick('radius', 180)) * (w / 640);
    // threshold: only the bright part of the frame should glow, so the falloff
    // starts further out the higher the threshold sits
    const threshold = pick('threshold', 78) / 100;
    const halGrad = ctx.createRadialGradient(w * 0.5, h * 0.48, radiusPx * 0.05, w * 0.5, h * 0.48, radiusPx);
    halGrad.addColorStop(0, `rgba(255, ${Math.round(115 + warm * 60)}, ${Math.round(29 + warm * 20)}, ${(0.38 * intensity + onBeatPulse * 0.15) * bloom})`);
    halGrad.addColorStop(0.35 + threshold * 0.25, `rgba(225, 29, 72, ${0.22 * intensity * bloom})`);
    halGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = halGrad;
    ctx.fillRect(0, 0, w, h);

    if (effectType === 'lab_leak') {
      const speed = pick('speed', 220);
      const width = pick('width', 90) * (w / 640);
      const leakWarm = pick('warmth', 70) / 100;
      const leakX = ((t * speed) % (w * 1.4)) - w * 0.2;
      const burn = ctx.createLinearGradient(leakX - width, 0, leakX + width, 0);
      burn.addColorStop(0, 'rgba(0,0,0,0)');
      burn.addColorStop(0.5, `rgba(${Math.round(249)}, ${Math.round(80 + leakWarm * 70)}, ${Math.round(22 + leakWarm * 40)}, ${0.62 * intensity})`);
      burn.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = burn;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  // 2. SPLIT-DIOPTER DUAL FOCUS REFRACTION
  if (effectType === 'opt_diopter') {
    const splitX = Math.round(w * (pick('split', 42) / 100));
    const zoomP = pick('zoom', 116) / 100;
    const seamP = pick('seam', 32) / 100;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, h);
    ctx.clip();
    // Draw magnified, slightly shifted left optical plane
    ctx.translate(splitX / 2, h / 2);
    ctx.scale(zoomP, zoomP);
    ctx.translate(-splitX / 2 + 14 * intensity, -h / 2);
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.restore();

    // Soft optical glass refraction seam
    const seam = ctx.createLinearGradient(splitX - 14, 0, splitX + 14, 0);
    seam.addColorStop(0, 'rgba(255,255,255,0)');
    seam.addColorStop(0.5, `rgba(186, 230, 253, ${seamP * intensity})`);
    seam.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = seam;
    ctx.fillRect(splitX - 14, 0, 28, h);
  }

  // 2b. 180° SHUTTER STREAK — stacked exposures along the motion axis.
  // Samples is the shutter count, Exposure how bright each one lands.
  if (effectType === 'time_velocity') {
    const samples = Math.max(1, Math.round(pick('samples', 6)));
    const exposure = pick('exposure', 60) / 100;
    const streakLen = pick('streak', 45) / 100;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 1; i <= samples; i++) {
      const f = i / samples;
      ctx.globalAlpha = (0.5 / samples) * exposure * intensity;
      const ox = -streakLen * 28 * (w / 640) * f * intensity;
      ctx.drawImage(ctx.canvas, ox, 0, w, h);
    }
    ctx.restore();
  }

  // 3. PRISM CORNER REFRACTION / ANAMORPHIC FRINGE
  if (effectType === 'opt_prism' || effectType === 'opt_fringe' || effectType === 'depth_streak') {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const spread = Math.max(2, pick('offset', 14)) * (w / 640);
    ctx.globalAlpha = (pick('ghost', 34) / 100) * intensity * 1.0;
    ctx.drawImage(ctx.canvas, -spread * intensity, 0, w + spread * 2 * intensity, h);
    // red/cyan balance: a lens does not fringe symmetrically
    const tint = pick('tint', 0) / 100;
    if (Math.abs(tint) > 0.02) {
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = Math.abs(tint) * 0.25 * intensity;
      ctx.fillStyle = tint > 0 ? 'rgba(255, 60, 40, 1)' : 'rgba(40, 190, 255, 1)';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();

    if (effectType === 'opt_prism') {
      // Corner: how much of the prism's edge tints the frame corners. A real
      // prism catches light at its bevels, never across the middle.
      const corner = pick('corner', 62) / 100;
      if (corner > 0.02) {
        const cw = w * 0.42;
        const chh = h * 0.42;
        const corners = [[0, 0, 1, 1], [w, 0, -1, 1], [0, h, 1, -1], [w, h, -1, -1]];
        corners.forEach(([cx, cy, sx, sy]) => {
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(cw, chh));
          g.addColorStop(0, `rgba(255, 168, 120, ${0.22 * corner * intensity})`);
          g.addColorStop(0.55, `rgba(120, 190, 255, ${0.10 * corner * intensity})`);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          ctx.translate(cx, cy);
          ctx.scale(sx, sy);
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, cw * sx, chh * sy);
          ctx.restore();
        });
      }
    }

    if (effectType === 'depth_streak') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const reach = pick('reach', 55) / 100;
      const thick = Math.max(1, pick('thickness', 8)) * (w / 640);
      const tintP = pick('tint', 55) / 100;
      const streak = ctx.createLinearGradient(0, h * 0.48, w, h * 0.48);
      streak.addColorStop(0, 'rgba(6, 182, 212, 0)');
      streak.addColorStop(0.5, `rgba(${Math.round(56 + tintP * 90)}, 189, ${Math.round(248 - tintP * 80)}, ${0.55 * intensity * (0.35 + reach)})`);
      streak.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = streak;
      ctx.fillRect(0, h * 0.5 - thick / 2, w, thick);
      ctx.restore();
    }
  }

  // 4. BLEACH BYPASS SILVER RETENTION / KODAK 2383 / FLIR / LITHO
  if (effectType === 'lab_bleach') {
    ctx.save();
    const desat = pick('desat', 68) / 100;
    const contrast = pick('contrast', 32) / 100;
    const density = pick('push', 26) / 100;
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = `hsl(0, ${Math.round((1 - desat * intensity) * 100)}%, 50%)`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'contrast';
    ctx.fillStyle = `rgba(10, 14, 22, ${contrast * intensity})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(180, 188, 196, ${density * intensity * 0.5})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (effectType === 'lab_flir') {
    ctx.save();
    const inv = pick('invert', 78) / 100;
    const heat = pick('palette', 50) / 100;
    ctx.globalCompositeOperation = 'difference';
    ctx.fillStyle = `rgba(220, 235, 255, ${inv * intensity})`;
    ctx.fillRect(0, 0, w, h);
    // thermal palettes are not neutral: heat runs blue-black-white or amber
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = heat * 0.35 * intensity;
    ctx.fillStyle = heat > 0.5 ? '#ffb347' : '#2e6cff';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    // thermal sensors are noisy: edge detail is what makes a FLIR frame read
    // as instrument output rather than a blue photo
    fxDetailPass(ctx, w, h, pick('detail', 40) / 100, intensity);
  } else if (effectType === 'lab_litho') {
    ctx.save();
    const thr = pick('threshold', 50) / 100;
    const tone = pick('tone', 30) / 100;
    const soft = pick('softness', 35) / 100;
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'hsl(0, 0%, 50%)';
    ctx.fillRect(0, 0, w, h);
    // litho is a two-ink print: crush the midtones towards the threshold
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = (0.35 + thr * 0.45) * intensity;
    ctx.fillStyle = tone > 0.5 ? '#f4ecdc' : '#0d0f12';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = soft * 0.5;
    ctx.fillStyle = '#8b8f96';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // 5. 2-FRAME FILM SNIP / TRANSIENT SPLICE FLASH
  if ((effectType === 'time_snip' && onBeatPulse > 0.68) || state.hitFlashBurst > 0.35) {
    ctx.save();
    const slicePx = Math.max(2, pick('slice', 14)) * (w / 640);
    const jitterP = pick('jitter', 50) / 100;
    const flashP = pick('flash', 38) / 100;
    // A splice is a torn strip, not a full-frame flash: slice the frame and
    // throw the pieces sideways by up to "Jitter".
    const strips = Math.max(1, Math.round(h / Math.max(8, slicePx * 4)));
    const stripH = h / strips;
    for (let i = 0; i < strips; i++) {
      const shift = (Math.random() - 0.5) * slicePx * 2 * jitterP * intensity;
      ctx.drawImage(ctx.canvas, 0, i * stripH, w, stripH, shift, i * stripH, w, stripH);
    }
    ctx.globalCompositeOperation = 'screen';
    const snipAlpha = Math.min(0.65, state.hitFlashBurst * 0.55 + onBeatPulse * 0.38 * intensity * flashP * 2);
    ctx.fillStyle = `rgba(255, 237, 213, ${snipAlpha})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // 6. EDITORIAL PIP / 2.39:1 SCOPE MATTE
  if (effectType === 'ed_pip') {
    ctx.save();
    const inset = pick('size', 12) / 100;
    const weight = 0.5 + (pick('border', 45) / 100) * 3;
    const outside = pick('outside', 0) / 100;
    if (outside > 0.02) {
      ctx.fillStyle = `rgba(0,0,0,${outside})`;
      ctx.fillRect(0, 0, w, h * inset);
      ctx.fillRect(0, h - h * inset, w, h * inset);
      ctx.fillRect(0, 0, w * inset, h);
      ctx.fillRect(w - w * inset, 0, w * inset, h);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = weight;
    ctx.strokeRect(w * inset, h * inset, w * (1 - inset * 2), h * (1 - inset * 2));
    ctx.restore();
  } else if (effectType === 'ed_scope') {
    const barH = Math.round(h * (pick('bars', 13) / 100));
    const feather = Math.max(0, Math.min(1, pick('edge', 0) / 100)) * barH;
    if (barH > 0) {
      ctx.save();
      ctx.fillStyle = '#000000';
      if (feather > 0.5) {
        // a soft shoulder reads as a projected frame, a hard one as a crop
        const top = ctx.createLinearGradient(0, 0, 0, barH + feather);
        top.addColorStop(0, 'rgba(0,0,0,1)');
        top.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = top;
        ctx.fillRect(0, 0, w, barH + feather);
        const bot = ctx.createLinearGradient(0, h, 0, h - barH - feather);
        bot.addColorStop(0, 'rgba(0,0,0,1)');
        bot.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bot;
        ctx.fillRect(0, h - barH - feather, w, barH + feather);
      } else {
        ctx.fillRect(0, 0, w, barH);
        ctx.fillRect(0, h - barH, w, barH);
      }
      ctx.restore();
    }
    const guide = Math.max(0, Math.min(1, pick('guides', 0) / 100)) * intensity;
    if (guide > 0.01) {
      // thirds + a centre cross: a finder the operator can frame against
      ctx.save();
      ctx.strokeStyle = '#e2e7ea';
      ctx.lineWidth = Math.max(1, Math.round(h / 540));
      ctx.globalAlpha = 0.15 + guide * 0.55;
      ctx.beginPath();
      [1 / 3, 2 / 3].forEach((f) => {
        ctx.moveTo(w * f, barH); ctx.lineTo(w * f, h - barH);
        ctx.moveTo(0, h * f); ctx.lineTo(w, h * f);
      });
      ctx.stroke();
      const arm = h * 0.022;
      ctx.beginPath();
      ctx.moveTo(w / 2 - arm, h / 2); ctx.lineTo(w / 2 + arm, h / 2);
      ctx.moveTo(w / 2, h / 2 - arm); ctx.lineTo(w / 2, h / 2 + arm);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 6b. TILT-SHIFT OBLIQUE PLANE (diagonal focus band + creamy defocus)
  if (effectType === 'opt_tilt') {
    const amt = Math.min(1, intensity) * (pick('defocus', 60) / 60);
    const bandPct = pick('band', 22) / 100;
    const angleDeg = pick('angle', 45);
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

      // focus falloff along the chosen plane angle; the band is the sharp strip
      const rad = (angleDeg * Math.PI) / 180;
      const gx = Math.cos(rad) * w;
      const gy = Math.sin(rad) * h;
      const band = ctx.createLinearGradient(w / 2 - gx / 2, h / 2 - gy / 2, w / 2 + gx / 2, h / 2 + gy / 2);
      band.addColorStop(0, `rgba(2,4,8,${0.20 * amt})`);
      band.addColorStop(Math.max(0.05, 0.5 - bandPct / 2), 'rgba(0,0,0,0)');
      band.addColorStop(Math.min(0.95, 0.5 + bandPct / 2), 'rgba(0,0,0,0)');
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
    const warmP = pick('warm', 20) / 100;
    const cyanP = pick('cyan', 55) / 100;
    const toeP = pick('toe', 30) / 100;
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = warmP * Math.min(1, intensity);
    ctx.fillStyle = '#ffe3bd';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'screen';
    const hi = ctx.createLinearGradient(0, 0, 0, h);
    hi.addColorStop(0, `rgba(255,214,160,${0.16 * intensity * (0.5 + warmP)})`);
    hi.addColorStop(0.45, 'rgba(255,236,214,0)');
    ctx.fillStyle = hi;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'multiply';
    const lo = ctx.createLinearGradient(0, h * 0.45, 0, h);
    lo.addColorStop(0, 'rgba(255,255,255,0)');
    lo.addColorStop(1, `rgba(150,205,225,${0.55 * Math.min(1, intensity) * cyanP})`);
    ctx.fillStyle = lo;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // 6d. DEPTH SEPARATION (subject holds, background desaturates + separates)
  if (effectType === 'depth_sep') {
    const amt = Math.min(1, intensity);
    if (amt > 0.01) {
      ctx.save();
      const r0 = Math.min(w, h) * (pick('subject', 16) / 100);
      const r1 = Math.min(w, h) * (pick('falloff', 62) / 100);
      const desatAmt = pick('desat', 95) / 100;
      const mask = ctx.createRadialGradient(w * 0.5, h * 0.48, r0, w * 0.5, h * 0.48, r1);
      mask.addColorStop(0, 'rgba(128,128,128,0)');
      mask.addColorStop(1, `rgba(128,128,128,${desatAmt * amt})`);

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

  // =====================================================================
  // SECOND SET — ten more looks, each driven by its own rack of controls.
  // =====================================================================

  // ANAMORPHIC FLARE STREAK — a 2x oval aperture squeezes light into one
  // horizontal line. Length sets the reach, Source brightness picks which
  // highlights qualify, Thickness the core.
  if (effectType === 'opt_anamorphic_streak') {
    const len = pick('length', 60) / 100;
    const thick = Math.max(1, pick('thickness', 3)) * (h / 360);
    const thr = pick('threshold', 70) / 100;
    const tintP = pick('tint', 40) / 100;
    const lineY = h * (0.34 + (1 - thr) * 0.16);
    const sliceH = Math.max(2, Math.round(h * 0.025));

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // the frame's own bright strip, stretched sideways into a flare
    ctx.globalAlpha = 0.30 * intensity;
    ctx.drawImage(ctx.canvas, 0, Math.max(0, lineY - sliceH), w, sliceH,
      -w * 0.2 * len, lineY - thick * 7, w * (1 + 0.4 * len), thick * 14);
    const core = ctx.createLinearGradient(0, 0, w, 0);
    core.addColorStop(0, 'rgba(0,0,0,0)');
    core.addColorStop(0.5, `rgba(${Math.round(90 + 160 * tintP)}, ${Math.round(175 + 50 * tintP)}, ${Math.round(255 - 60 * tintP)}, ${0.45 * intensity})`);
    core.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = core;
    ctx.fillRect(0, lineY - thick / 2, w, thick);
    ctx.restore();
  }

  // LENS DIRT — smudges and dust sitting on the front element, lit by the
  // frame behind them. Positions are seeded, so the dirt does not crawl.
  if (effectType === 'opt_lens_dirt') {
    const amount = pick('amount', 40) / 100;
    const size = pick('size', 55) / 100;
    const warm = pick('warmth', 40) / 100;
    const specks = pick('specks', 35) / 100;
    let seed = 20240517;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 7; i++) {
      const cx = rnd() * w;
      const cy = rnd() * h;
      const rad = (0.05 + rnd() * 0.09) * Math.min(w, h) * (0.5 + size);
      const g = ctx.createRadialGradient(cx, cy, rad * 0.15, cx, cy, rad);
      g.addColorStop(0, `rgba(255, ${Math.round(190 + warm * 40)}, ${Math.round(150 + warm * 70)}, ${0.13 * amount * intensity})`);
      g.addColorStop(0.6, `rgba(255, 210, 170, ${0.05 * amount * intensity})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    }
    if (specks > 0.02) {
      ctx.fillStyle = `rgba(255, 245, 230, ${0.5 * specks * intensity})`;
      for (let i = 0; i < 26; i++) {
        const px = rnd() * w;
        const py = rnd() * h;
        const pr = 0.6 + rnd() * 1.8;
        ctx.beginPath();
        ctx.arc(px, py, pr * (w / 640), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // CROSS-PROCESS — E6 chemistry in C41 soup: cool lifted shadows, hot
  // highlights, saturation that goes strange rather than pretty.
  if (effectType === 'lab_xprocess') {
    const shadows = pick('shadows', -30) / 100;
    const highlights = pick('highlights', 55) / 100;
    const sat = pick('saturation', 70) / 100;
    const contrast = pick('contrast', 35) / 100;
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.globalAlpha = Math.min(1, 0.4 + sat * 0.8) * intensity;
    ctx.fillStyle = 'hsl(0, 100%, 50%)';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, shadows < 0
      ? `rgba(70, 200, 235, ${Math.abs(shadows) * 0.55 * intensity})`
      : `rgba(255, 120, 60, ${shadows * 0.55 * intensity})`);
    g.addColorStop(1, highlights > 0
      ? `rgba(255, 190, 60, ${highlights * 0.5 * intensity})`
      : `rgba(70, 120, 255, ${-highlights * 0.5 * intensity})`);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = contrast * 0.4 * intensity;
    ctx.fillStyle = '#101418';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // DUOTONE — two printing inks, no greys: the shadow ink holds the darks,
  // the highlight ink the lights, Ink mixture how far the split goes.
  if (effectType === 'lab_duotone') {
    const shadowHue = pick('shadowHue', 40);
    const highlightHue = pick('highlightHue', 190);
    const blendP = pick('blend', 60) / 100;
    const contrast = pick('contrast', 35) / 100;
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'hsl(0, 0%, 50%)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = Math.min(1, blendP * 1.2) * intensity;
    ctx.fillStyle = `hsl(${shadowHue}, 65%, 58%)`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = Math.min(1, blendP * 1.2) * intensity;
    ctx.fillStyle = `hsl(${highlightHue}, 55%, 32%)`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = contrast * 0.5 * intensity;
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // ECHO — a delayed copy of an earlier frame, offset and scaled like a
  // shutter that never quite closed. Stored small: echoes are soft anyway.
  if (effectType === 'time_echo') {
    const delay = Math.max(1, Math.round(pick('delay', 8)));
    const ghost = pick('ghost', 45) / 100;
    const offsetPx = pick('offset', 0) * (w / 640);
    const spread = pick('spread', 100) / 100;
    if (fxEchoFrames.length > delay) {
      const past = fxEchoFrames[fxEchoFrames.length - 1 - delay];
      ctx.save();
      ctx.globalAlpha = ghost * intensity * 0.85;
      const dw = w * spread;
      const dh = h * spread;
      ctx.drawImage(past, (w - dw) / 2 + offsetPx * intensity, (h - dh) / 2, dw, dh);
      ctx.restore();
    }
    fxEchoFrames.push(fxEchoSnapshot(ctx, w, h));
    while (fxEchoFrames.length > 32) fxEchoFrames.shift();
  }

  // GATE STUTTER — a film gate that does not hold steady: dark chops at the
  // stutter rate, plus torn scanlines and a dropout smear.
  if (effectType === 'time_gate_stutter') {
    const rate = Math.max(0.2, pick('rate', 6));
    const duty = pick('duty', 32) / 100;
    const jitterP = pick('jitter', 40) / 100;
    const dropout = pick('dropout', 25) / 100;
    const phase = (t * rate) % 1;
    ctx.save();
    if (phase < duty) {
      // gate closed: the frame goes down, never fully black
      const closeAmt = (1 - phase / Math.max(0.001, duty)) * 0.55;
      ctx.fillStyle = `rgba(0, 0, 0, ${closeAmt * intensity})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (jitterP > 0.02) {
      const bands = 5;
      const bh = h / bands;
      for (let i = 0; i < bands; i++) {
        if (Math.random() > jitterP * 0.8) continue;
        const shift = (Math.random() - 0.5) * 12 * (w / 640) * jitterP * intensity;
        ctx.drawImage(ctx.canvas, 0, i * bh, w, bh, shift, i * bh, w, bh);
      }
    }
    if (dropout > 0.02) {
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = dropout * 0.5 * intensity * (0.4 + Math.random() * 0.6);
      ctx.drawImage(ctx.canvas, -6 * (w / 640), 0, w, h);
    }
    ctx.restore();
  }

  // ATMOSPHERIC HAZE — air between lens and subject: the further back, the
  // more the frame washes out towards the haze colour.
  if (effectType === 'depth_haze') {
    const near = pick('near', 30) / 100;
    const haze = pick('haze', 40) / 100;
    const falloff = pick('falloff', 70) / 100;
    const warm = pick('warmth', 50) / 100;
    ctx.save();
    const g = ctx.createRadialGradient(w * 0.5, h * 0.46, Math.min(w, h) * near, w * 0.5, h * 0.46, Math.min(w, h) * (0.35 + falloff));
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(${Math.round(190 + warm * 60)}, ${Math.round(205 + warm * 30)}, ${Math.round(225 - warm * 70)}, ${haze * 0.7 * intensity})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // DEPTH RIM — a light edge behind the subject, the oldest trick for
  // separating a person from the wall behind them.
  if (effectType === 'depth_rim') {
    const width = Math.max(1, pick('width', 6)) * (w / 640);
    const glow = pick('glow', 55) / 100;
    const tintP = pick('tint', 45) / 100;
    const ring = ctx.createRadialGradient(w * 0.5, h * 0.52, Math.min(w, h) * 0.16, w * 0.5, h * 0.52, Math.min(w, h) * 0.42);
    ring.addColorStop(0, 'rgba(0,0,0,0)');
    ring.addColorStop(0.72, `rgba(${Math.round(150 + tintP * 100)}, ${Math.round(200 + tintP * 40)}, ${Math.round(255 - tintP * 110)}, ${0.28 * glow * intensity})`);
    ring.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = ring;
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = width;
    ctx.strokeStyle = `rgba(255, 240, 220, ${0.10 * glow * intensity})`;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.52, Math.min(w, h) * 0.33, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // LETTERBOX — a real frame ratio cut into the picture, with a feathered
  // edge and the picture nudged up or down inside it.
  if (effectType === 'ed_letterbox') {
    const ratio = Math.max(1.2, pick('ratio', 239) / 100);
    const feather = pick('feather', 15) / 100;
    const shiftPct = pick('shift', 0) / 100;
    const shade = pick('shade', 100) / 100;
    const targetH = Math.min(h, w / ratio);
    const offset = h * shiftPct * 0.5;
    const topH = Math.max(0, Math.min(h, (h - targetH) / 2 + offset));
    const botH = Math.max(0, Math.min(h, (h - targetH) / 2 - offset));
    ctx.save();
    ctx.globalAlpha = shade * Math.min(1, intensity);
    ctx.fillStyle = '#000';
    if (topH > 0.5) {
      const fade = Math.max(1, topH * feather);
      const solid = Math.max(0, topH - fade);
      ctx.fillRect(0, 0, w, solid);
      if (fade > 1) {
        const g = ctx.createLinearGradient(0, solid, 0, solid + fade);
        g.addColorStop(0, 'rgba(0,0,0,1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, solid, w, fade);
      }
    }
    if (botH > 0.5) {
      ctx.fillStyle = '#000';
      const fade = Math.max(1, botH * feather);
      const solid = Math.max(0, botH - fade);
      ctx.fillRect(0, h - solid, w, solid);
      if (fade > 1) {
        const g = ctx.createLinearGradient(0, h - solid - fade, 0, h - solid);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = g;
        ctx.fillRect(0, h - solid - fade, w, fade);
      }
    }
    ctx.restore();
  }

  // FOCUS PULL — the lens racks between soft and sharp on a cycle. Rate is
  // how often it racks, Sharp hold how long it stays locked.
  if (effectType === 'ed_focus_pull') {
    const maxBlur = pick('blur', 6);
    const rate = Math.max(0.1, pick('rate', 5)) / 10;
    const hold = pick('hold', 45) / 100;
    const phase = (t * rate) % 1;
    let defocus = 0;
    if (phase < hold) defocus = 0;
    else {
      const p = (phase - hold) / Math.max(0.001, 1 - hold);
      defocus = Math.sin(p * Math.PI);
    }
    const px = defocus * maxBlur * (w / 640) * intensity;
    if (px > 0.15) {
      const snap = fxCopyFrame(ctx, w, h);
      if (snap) {
        ctx.save();
        ctx.filter = `blur(${px.toFixed(2)}px)`;
        ctx.drawImage(snap, 0, 0, w, h);
        ctx.filter = 'none';
        ctx.restore();
      }
    }
  }

  // =====================================================================
  // THIRD SET — lens faults, print chemistry and long exposure.
  // =====================================================================

  // VEILING GLARE — light that never forms an image: a bright window throws
  // a flat wash over the whole frame and lifts the blacks with it.
  if (effectType === 'opt_veiling_glare') {
    const thr = pick('threshold', 60) / 100;
    const spread = pick('spread', 60) / 100;
    const lift = pick('lift', 30) / 100;
    const warm = pick('warmth', 45) / 100;
    const radius = Math.max(w, h) * (0.25 + spread * 0.6);
    ctx.save();
    const g = ctx.createRadialGradient(w * 0.5, h * 0.42, radius * 0.05, w * 0.5, h * 0.42, radius);
    g.addColorStop(0, `rgba(${Math.round(255)}, ${Math.round(245 - warm * 35)}, ${Math.round(230 - warm * 70)}, ${0.34 * thr * intensity})`);
    g.addColorStop(0.55, `rgba(255, 250, 244, ${0.12 * thr * intensity})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // the lift is what makes it read as flare rather than a glow sticker
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(${Math.round(120 + warm * 40)}, ${Math.round(118 + warm * 20)}, ${Math.round(112 - warm * 20)}, ${lift * 0.22 * intensity})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // LENS DISTORTION — a real bulge: each column samples a narrower slice of
  // the frame the closer it sits to the centre, so the middle magnifies and
  // the edges stay. Corners fall off, and the glass fringes as it turns.
  if (effectType === 'opt_lens_distort') {
    const k = Math.max(0, pick('barrel', 18)) / 100;
    const edge = pick('edge', 35) / 100;
    const chroma = pick('chroma', 20) / 100;
    if (k > 0.002) fxStripWarp(ctx, w, h, k);
    if (chroma > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.36, w / 2, h / 2, Math.max(w, h) * 0.7);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.72, `rgba(90, 170, 255, ${0.10 * chroma * intensity})`);
      g.addColorStop(1, `rgba(255, 120, 90, ${0.16 * chroma * intensity})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
    if (edge > 0.02) {
      ctx.save();
      const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.72);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, `rgba(4, 6, 8, ${0.5 * edge * intensity})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  // FILM NEGATIVE — the frame as an unprinted negative, orange base and all.
  if (effectType === 'lab_negative') {
    const mask = pick('mask', 65) / 100;
    const contrast = pick('contrast', 40) / 100;
    const density = pick('density', 30) / 100;
    ctx.save();
    ctx.globalCompositeOperation = 'difference';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    // the orange mask is not a tint, it sits in the base: multiply it in
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = mask * intensity;
    ctx.fillStyle = 'rgb(232, 158, 92)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = contrast * 0.5 * intensity;
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = density * 0.4 * intensity;
    ctx.fillStyle = '#b9bec4';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // THREE-STRIP TECHNICOLOR — separated dyes, deep contrast, a warm bias
  // because the red strip always ran hot.
  if (effectType === 'lab_technicolor') {
    const sat = pick('saturation', 75) / 100;
    const warmth = pick('warmth', 35) / 100;
    const contrast = pick('contrast', 45) / 100;
    const strip = pick('threeStrip', 55) / 100;
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.globalAlpha = Math.min(1, 0.5 + sat) * intensity;
    ctx.fillStyle = 'hsl(0, 100%, 50%)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    if (Math.abs(warmth) > 0.02) {
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = Math.abs(warmth) * 0.4 * intensity;
      ctx.fillStyle = warmth > 0 ? 'rgb(255, 168, 96)' : 'rgb(96, 176, 255)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }
    if (strip > 0.02) {
      // the three dye layers land slightly apart: a separation, not a ghost
      const off = strip * 3 * (w / 640);
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = strip * 0.16 * intensity;
      ctx.drawImage(ctx.canvas, -off, 0, w, h);
      ctx.drawImage(ctx.canvas, off, 0, w, h);
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = contrast * 0.45 * intensity;
    ctx.fillStyle = '#0c0f12';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // PRINT SCREEN — a halftone dot screen laid over the picture, angled like a
  // real press. Dot pitch, angle, dot gain and ink strength are all separate.
  if (effectType === 'lab_print_screen') {
    const cell = Math.max(3, Math.round(pick('cell', 7)));
    const angle = (pick('angle', 45) * Math.PI) / 180;
    const gain = pick('gain', 55) / 100;
    const ink = pick('ink', 45) / 100;
    const tile = fxDotTile(cell, gain);
    if (tile) {
      const pat = ctx.createPattern(tile, 'repeat');
      if (pat) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = Math.min(1, ink * 1.4) * Math.min(1, intensity);
        ctx.translate(w / 2, h / 2);
        ctx.rotate(angle);
        ctx.translate(-w / 2, -h / 2);
        ctx.fillStyle = pat;
        ctx.fillRect(-w, -h, w * 3, h * 3);
        ctx.restore();
      }
    }
  }

  // LONG EXPOSURE — real accumulation: each frame is added to a buffer that
  // fades, so motion paints a trail instead of leaving one ghost.
  if (effectType === 'time_light_trail') {
    const duration = Math.max(1, Math.round(pick('duration', 10)));
    const decay = pick('decay', 45) / 100;
    const gain = pick('gain', 55) / 100;
    const fade = Math.pow(0.02, 1 / Math.max(1, duration * (0.4 + decay * 1.2)));
    if (!fxTrailCanvas || fxTrailCanvas.width !== w || fxTrailCanvas.height !== h) {
      fxTrailCanvas = document.createElement('canvas');
      fxTrailCanvas.width = w;
      fxTrailCanvas.height = h;
      fxTrailCtx = fxTrailCanvas.getContext('2d');
      if (fxTrailCtx) fxTrailCtx.drawImage(ctx.canvas, 0, 0);
    }
    if (fxTrailCtx) {
      // fade what is already there, then add this frame on top of it
      fxTrailCtx.save();
      fxTrailCtx.globalCompositeOperation = 'source-over';
      fxTrailCtx.fillStyle = `rgba(0, 0, 0, ${1 - fade})`;
      fxTrailCtx.fillRect(0, 0, w, h);
      fxTrailCtx.globalCompositeOperation = 'lighter';
      fxTrailCtx.globalAlpha = Math.max(0.15, gain);
      fxTrailCtx.drawImage(ctx.canvas, 0, 0);
      fxTrailCtx.restore();
      ctx.save();
      ctx.globalAlpha = Math.min(1, intensity);
      ctx.drawImage(fxTrailCanvas, 0, 0);
      ctx.restore();
    }
  }

  // FREEZE + PUSH — the frame holds for a set number of frames with a slow
  // push, then releases. Editorial punctuation, no jitter.
  if (effectType === 'time_freeze_push') {
    const hold = Math.max(2, Math.round(pick('hold', 12)));
    const push = Math.max(1, pick('push', 106) / 100);
    const blend = pick('blend', 20) / 100;
    fxFreezeTick += 1;
    if (!fxFreezeCanvas || fxFreezeCanvas.width !== w || fxFreezeCanvas.height !== h || fxFreezeTick > hold) {
      if (!fxFreezeCanvas) fxFreezeCanvas = document.createElement('canvas');
      fxFreezeCanvas.width = w;
      fxFreezeCanvas.height = h;
      const fctx = fxFreezeCanvas.getContext('2d');
      if (fctx) fctx.drawImage(ctx.canvas, 0, 0);
      fxFreezeTick = 0;
      fxFreezeHeld = 0;
    }
    if (fxFreezeCanvas) {
      fxFreezeHeld = Math.min(hold, fxFreezeHeld + 1);
      const progress = fxFreezeHeld / hold;
      const s = 1 + (push - 1) * progress;
      const dw = w * s;
      const dh = h * s;
      ctx.save();
      ctx.globalAlpha = (1 - blend) * Math.min(1, intensity);
      ctx.drawImage(fxFreezeCanvas, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ctx.restore();
    }
  }

  // DEPTH OF FIELD — a real defocus band: the frame is blurred, then masked
  // back in around the focus zone. Focus, blur and falloff are separate.
  if (effectType === 'depth_dof') {
    const focus = pick('focus', 28) / 100;
    const blurPx = pick('blur', 6) * (w / 640);
    const falloff = pick('falloff', 22) / 100;
    if (blurPx > 0.2) {
      if (!fxDofCanvas || fxDofCanvas.width !== w || fxDofCanvas.height !== h) {
        fxDofCanvas = document.createElement('canvas');
        fxDofCanvas.width = w;
        fxDofCanvas.height = h;
        fxDofCtx = fxDofCanvas.getContext('2d');
      }
      if (fxDofCtx) {
        fxDofCtx.setTransform(1, 0, 0, 1, 0, 0);
        fxDofCtx.clearRect(0, 0, w, h);
        fxDofCtx.filter = `blur(${blurPx.toFixed(2)}px)`;
        fxDofCtx.drawImage(ctx.canvas, 0, 0);
        fxDofCtx.filter = 'none';
        // keep the blurred copy only outside the focus zone
        const inner = Math.min(w, h) * focus;
        const outer = inner + Math.min(w, h) * (0.05 + falloff);
        const m = fxDofCtx.createRadialGradient(w / 2, h * 0.5, inner, w / 2, h * 0.5, outer);
        m.addColorStop(0, 'rgba(0,0,0,0)');
        m.addColorStop(1, 'rgba(0,0,0,1)');
        fxDofCtx.globalCompositeOperation = 'destination-in';
        fxDofCtx.fillStyle = m;
        fxDofCtx.fillRect(0, 0, w, h);
        fxDofCtx.globalCompositeOperation = 'source-over';
        ctx.save();
        ctx.globalAlpha = Math.min(1, intensity);
        ctx.drawImage(fxDofCanvas, 0, 0);
        ctx.restore();
      }
    }
  }

  // SPLIT GRADE BY DEPTH — the background pushed to its own hue, the subject
  // left alone. Tint strength and hue are one thing; the zone is another.
  if (effectType === 'depth_grade_split') {
    const centre = pick('centre', 30) / 100;
    const push = pick('background', 55) / 100;
    const hue = pick('tint', 205);
    if (push > 0.02) {
      if (!fxGradeCanvas || fxGradeCanvas.width !== w || fxGradeCanvas.height !== h) {
        fxGradeCanvas = document.createElement('canvas');
        fxGradeCanvas.width = w;
        fxGradeCanvas.height = h;
        fxGradeCtx = fxGradeCanvas.getContext('2d');
      }
      if (fxGradeCtx) {
        fxGradeCtx.setTransform(1, 0, 0, 1, 0, 0);
        fxGradeCtx.globalCompositeOperation = 'source-over';
        fxGradeCtx.clearRect(0, 0, w, h);
        fxGradeCtx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        fxGradeCtx.fillRect(0, 0, w, h);
        const inner = Math.min(w, h) * centre;
        const outer = inner + Math.min(w, h) * 0.3;
        const m = fxGradeCtx.createRadialGradient(w / 2, h * 0.5, inner, w / 2, h * 0.5, outer);
        m.addColorStop(0, 'rgba(0,0,0,0)');
        m.addColorStop(1, 'rgba(0,0,0,1)');
        fxGradeCtx.globalCompositeOperation = 'destination-in';
        fxGradeCtx.fillStyle = m;
        fxGradeCtx.fillRect(0, 0, w, h);
        fxGradeCtx.globalCompositeOperation = 'source-over';
        ctx.save();
        ctx.globalCompositeOperation = 'soft-light';
        ctx.globalAlpha = push * Math.min(1, intensity);
        ctx.drawImage(fxGradeCanvas, 0, 0);
        ctx.restore();
      }
    }
  }

  // =====================================================================
  // FOURTH SET — bokeh, ghosts, print chemistry, strobe, strobe-free
  // reframing. Every one of these reads its own rack.
  // =====================================================================

  // BOKEH — out-of-focus highlights are rings with a bright rim, not soft
  // blobs. Size, count, colour and rim glow are separate.
  if (effectType === 'opt_bokeh_ring') {
    const size = pick('size', 16) / 100;
    const count = Math.max(1, Math.round(pick('count', 7)));
    const warm = pick('warmth', 50) / 100;
    const glow = pick('glow', 45) / 100;
    let seed = 9127;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < count; i++) {
      const cx = (0.1 + rnd() * 0.8) * w;
      const cy = (0.1 + rnd() * 0.8) * h;
      const rad = Math.min(w, h) * size * (0.5 + rnd() * 0.8);
      const g = ctx.createRadialGradient(cx, cy, rad * 0.62, cx, cy, rad);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.72, `rgba(${Math.round(255)}, ${Math.round(210 - warm * 60)}, ${Math.round(150 + warm * 40)}, ${0.10 * glow * intensity})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    }
    ctx.restore();
  }

  // INTERNAL GHOST — the second reflection a big element throws back down the
  // barrel: offset, scaled, sometimes mirrored, always faint.
  if (effectType === 'opt_ghost_double') {
    const off = (pick('offset', 14) / 100) * w * 0.5;
    const sc = pick('scale', 104) / 100;
    const op = pick('opacity', 40) / 100;
    const flip = pick('flip', 50) / 100;
    const snap = fxCopyFrame(ctx, w, h);
    if (snap) {
      const dw = w * sc;
      const dh = h * sc;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = op * 0.55 * Math.min(1, intensity);
      if (flip > 0.5) {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(snap, (w - dw) / 2 + off, (h - dh) / 2, dw, dh);
      ctx.restore();
    }
  }

  // SOLARISATION — Sabattier: the image turns over partway up the curve, so
  // the brightest areas invert first and a halo forms at the boundary.
  if (effectType === 'lab_solarise') {
    const amount = pick('amount', 55) / 100;
    const pivot = pick('pivot', 55) / 100;
    const toneShift = pick('tone', 20) / 100;
    ctx.save();
    ctx.globalCompositeOperation = 'difference';
    ctx.globalAlpha = amount * Math.min(1, intensity);
    ctx.fillStyle = `rgb(${Math.round(pivot * 255)}, ${Math.round(pivot * 255)}, ${Math.round(pivot * 255)})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = Math.abs(toneShift) * 0.35 * intensity;
    ctx.fillStyle = toneShift > 0 ? 'rgb(255, 196, 120)' : 'rgb(110, 170, 255)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // CYANOTYPE — iron-blue print chemistry on warm paper, not a blue filter.
  if (effectType === 'lab_cyanotype') {
    const density = pick('density', 65) / 100;
    const paper = pick('paper', 35) / 100;
    const contrast = pick('contrast', 45) / 100;
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'hsl(0, 0%, 50%)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = density * Math.min(1, intensity);
    ctx.fillStyle = 'rgb(28, 74, 128)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = paper * 0.5 * intensity;
    ctx.fillStyle = 'rgb(232, 214, 178)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = contrast * 0.45 * intensity;
    ctx.fillStyle = '#0a1a2a';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // STROBE — the shutter opens and closes at a rate you set. Afterglow keeps
  // the last lit frame alive for a moment instead of snapping to black.
  if (effectType === 'time_strobe') {
    const rate = Math.max(0.2, pick('rate', 8));
    const duty = pick('duty', 40) / 100;
    const trail = pick('trail', 30) / 100;
    const phase = (t * rate) % 1;
    if (phase > duty) {
      const closeAmt = Math.min(1, (phase - duty) / Math.max(0.05, 1 - duty));
      ctx.save();
      ctx.fillStyle = `rgba(2, 3, 5, ${closeAmt * (1 - trail * 0.55) * Math.min(1, intensity)})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
    if (trail > 0.02 && fxStrobeCanvas) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = trail * 0.25 * Math.min(1, intensity);
      ctx.drawImage(fxStrobeCanvas, 0, 0);
      ctx.restore();
    }
    if (!fxStrobeCanvas || fxStrobeCanvas.width !== w || fxStrobeCanvas.height !== h) {
      fxStrobeCanvas = document.createElement('canvas');
      fxStrobeCanvas.width = w;
      fxStrobeCanvas.height = h;
    }
    if (fxStrobeCanvas) {
      const sc = fxStrobeCanvas.getContext('2d');
      if (sc) {
        sc.globalAlpha = 0.12 + trail * 0.4;
        sc.globalCompositeOperation = 'source-over';
        sc.drawImage(ctx.canvas, 0, 0);
      }
    }
  }

  // SLIT SCAN — each column comes from a different moment, so movement
  // stretches into a curtain. Slice width, frame spread and drift are yours.
  if (effectType === 'time_slit') {
    const slit = Math.max(2, Math.round(pick('slit', 12) * (w / 640)));
    const spread = Math.max(1, Math.round(pick('spread', 10)));
    const drift = pick('drift', 0) / 100;
    const history = fxEchoFrames;
    if (history.length > 2) {
      ctx.save();
      for (let x = 0; x < w; x += slit) {
        const frac = x / w;
        const idx = Math.min(history.length - 1, Math.max(0, Math.round(frac * Math.min(history.length - 1, spread) + drift * 2)));
        const past = history[history.length - 1 - idx];
        if (!past) continue;
        const sx = (x / w) * past.width;
        const swSrc = Math.max(1, (slit / w) * past.width);
        ctx.drawImage(past, sx, 0, swSrc, past.height, x, 0, slit + 0.6, h);
      }
      ctx.restore();
    }
    fxEchoFrames.push(fxEchoSnapshot(ctx, w, h));
    while (fxEchoFrames.length > 28) fxEchoFrames.shift();
  }

  // DOLLY ZOOM — the vertigo move: the lens pulls while the frame widens, so
  // the subject holds size and the walls stretch. Strip warp, like glass.
  if (effectType === 'cam_vertigo') {
    const amt = pick('amount', 55) / 100;
    const rate = Math.max(0.1, pick('rate', 5) / 10);
    const edge = pick('edge', 45) / 100;
    const k = Math.max(0, Math.sin((t * rate) % 1 * Math.PI * 2)) * amt * 0.35 * edge;
    if (k > 0.002) fxStripWarp(ctx, w, h, k);
  }

  // PARALLAX PUSH — the background moves, the subject does not. That gap is
  // what reads as depth; the zone and the feather keep the edge soft.
  if (effectType === 'depth_push_pull') {
    const push = Math.max(0, pick('push', 12)) / 100;
    const zone = pick('zone', 28) / 100;
    const feather = pick('feather', 20) / 100;
    if (push > 0.002) {
      const snap = fxCopyFrame(ctx, w, h);
      if (snap) {
        if (!fxPushCanvas || fxPushCanvas.width !== w || fxPushCanvas.height !== h) {
          fxPushCanvas = document.createElement('canvas');
          fxPushCanvas.width = w;
          fxPushCanvas.height = h;
          fxPushCtx = fxPushCanvas.getContext('2d');
        }
        if (fxPushCtx) {
          fxPushCtx.setTransform(1, 0, 0, 1, 0, 0);
          fxPushCtx.clearRect(0, 0, w, h);
          fxPushCtx.drawImage(snap, 0, 0, w, h);
          const inner = Math.min(w, h) * zone;
          const outer = inner + Math.min(w, h) * (0.04 + feather);
          const m = fxPushCtx.createRadialGradient(w / 2, h * 0.5, inner, w / 2, h * 0.5, outer);
          m.addColorStop(0, 'rgba(0,0,0,0)');
          m.addColorStop(1, 'rgba(0,0,0,1)');
          fxPushCtx.globalCompositeOperation = 'destination-in';
          fxPushCtx.fillStyle = m;
          fxPushCtx.fillRect(0, 0, w, h);
          fxPushCtx.globalCompositeOperation = 'source-over';
          const s2 = 1 + push * Math.min(1, intensity) * 2;
          const dw = w * s2;
          const dh = h * s2;
          ctx.save();
          ctx.drawImage(fxPushCanvas, (w - dw) / 2, (h - dh) / 2, dw, dh);
          ctx.restore();
        }
      }
    }
  }

  // SHADOW FALLOFF — the background sinks into shadow while the subject stays
  // lit. Density, clear zone and shadow colour are one dial each.
  if (effectType === 'depth_shadow_fall') {
    const density = pick('density', 45) / 100;
    const zone = pick('zone', 25) / 100;
    const tint = pick('tint', 40) / 100;
    if (density > 0.02) {
      const inner = Math.min(w, h) * zone;
      const outer = inner + Math.min(w, h) * 0.4;
      const g = ctx.createRadialGradient(w / 2, h * 0.5, inner, w / 2, h * 0.5, outer);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(${Math.round(12 + tint * 22)}, ${Math.round(14 + tint * 10)}, ${Math.round(20 + tint * 26)}, ${density * 0.85 * Math.min(1, intensity)})`);
      ctx.save();
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  // FRAME GUIDES — thin guide lines and corner ticks, the way a viewfinder
  // overlays them. Inset, weight, opacity and marks are separate.
  if (effectType === 'ed_frame_guides') {
    const inset = pick('inset', 8) / 100;
    const weight = Math.max(0.5, pick('weight', 1.2)) * (w / 640);
    const opacity = pick('opacity', 55) / 100;
    const marks = pick('marks', 40) / 100;
    const x0 = w * inset;
    const y0 = h * inset;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * opacity * Math.min(1, intensity)})`;
    ctx.lineWidth = weight;
    ctx.strokeRect(x0, y0, w - x0 * 2, h - y0 * 2);
    // centre cross
    ctx.beginPath();
    ctx.moveTo(w / 2 - 10 * (w / 640), h / 2);
    ctx.lineTo(w / 2 + 10 * (w / 640), h / 2);
    ctx.moveTo(w / 2, h / 2 - 10 * (w / 640));
    ctx.lineTo(w / 2, h / 2 + 10 * (w / 640));
    ctx.stroke();
    if (marks > 0.02) {
      const len = Math.min(w, h) * 0.06 * marks;
      ctx.lineWidth = weight * 1.6;
      const corners = [[x0, y0, 1, 1], [w - x0, y0, -1, 1], [x0, h - y0, 1, -1], [w - x0, h - y0, -1, -1]];
      corners.forEach(([cx, cy, sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy + sy * len);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + sx * len, cy);
        ctx.stroke();
      });
    }
    ctx.restore();
  }

  // SQUARE MATTE — the opposite of a letterbox: square framing with the sides
  // matted off, which is what a feed cropped to 1:1 actually looks like.
  if (effectType === 'ed_square_matte') {
    const ratio = Math.max(0.5, pick('ratio', 100) / 100);
    const feather = pick('feather', 20) / 100;
    const shade = pick('shade', 100) / 100;
    const targetW = Math.min(w, h * ratio);
    const barW = (w - targetW) / 2;
    if (barW > 0.5) {
      const fade = Math.max(1, barW * feather);
      ctx.save();
      ctx.globalAlpha = shade * Math.min(1, intensity);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, Math.max(0, barW - fade), h);
      ctx.fillRect(w - Math.max(0, barW - fade), 0, Math.max(0, barW - fade), h);
      if (fade > 1) {
        const gl = ctx.createLinearGradient(barW - fade, 0, barW, 0);
        gl.addColorStop(0, 'rgba(0,0,0,1)');
        gl.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gl;
        ctx.fillRect(barW - fade, 0, fade, h);
        const gr = ctx.createLinearGradient(w - barW, 0, w - barW + fade, 0);
        gr.addColorStop(0, 'rgba(0,0,0,0)');
        gr.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = gr;
        ctx.fillRect(w - barW, 0, fade, h);
      }
      ctx.restore();
    }
  }

  fxFinishPass(ctx, w, h, effectType, P, before, grainAmount);
}

let fxStrobeCanvas = null;
let fxPushCanvas = null;
let fxPushCtx = null;

// Column-by-column glass warp shared by the barrel and the dolly zoom: each
// strip samples a narrower (or wider) slice the closer it sits to the centre.
function fxStripWarp(ctx, w, h, k) {
  const snap = fxCopyFrame(ctx, w, h);
  if (!snap) return;
  const step = Math.max(2, Math.round(w / 180));
  ctx.save();
  for (let x = 0; x < w; x += step) {
    const nx = ((x + step / 2) / w) * 2 - 1;
    const f = 1 + k * (1 - nx * nx);
    const sw = Math.max(1, step / f);
    const sh = Math.max(1, h / f);
    const cx = x + step / 2;
    ctx.drawImage(snap, cx - sw / 2, h / 2 - sh / 2, sw, sh, x, 0, step + 0.6, h);
  }
  ctx.restore();
}

// Buffers for the third set. Kept outside the draw call so a frame can read
// what the previous frame left behind.
let fxTrailCanvas = null;
let fxTrailCtx = null;
let fxFreezeCanvas = null;
let fxFreezeTick = 0;
let fxFreezeHeld = 0;
let fxDofCanvas = null;
let fxDofCtx = null;
let fxGradeCanvas = null;
let fxGradeCtx = null;
let fxDotCache = { key: '', canvas: null };

// One halftone tile, regenerated only when the pitch or the dot gain changes.
function fxDotTile(cell, gain) {
  const step = Math.max(0.05, Math.round(gain * 20) / 20);
  const key = `${cell}:${step}`;
  if (fxDotCache.key === key && fxDotCache.canvas) return fxDotCache.canvas;
  const size = cell * 2;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const tctx = tile.getContext('2d');
  if (!tctx) return null;
  tctx.fillStyle = '#ffffff';
  tctx.fillRect(0, 0, size, size);
  tctx.fillStyle = '#000000';
  const dots = [[cell * 0.5, cell * 0.5], [cell * 1.5, cell * 1.5]];
  const r = cell * (0.22 + step * 0.5);
  dots.forEach(([cx, cy]) => {
    tctx.beginPath();
    tctx.arc(cx, cy, r, 0, Math.PI * 2);
    tctx.fill();
  });
  fxDotCache = { key, canvas: tile };
  return tile;
}

let fxScratch = null;
let fxEchoFrames = [];

// A small, cheap copy for delayed frames: an echo never needs full resolution.
function fxEchoSnapshot(ctx, w, h) {
  const target = 720;
  const scale = Math.min(1, target / Math.max(1, Math.max(w, h)));
  const ew = Math.max(2, Math.round(w * scale));
  const eh = Math.max(2, Math.round(h * scale));
  const snap = document.createElement('canvas');
  snap.width = ew;
  snap.height = eh;
  const sctx = snap.getContext('2d');
  if (sctx) sctx.drawImage(ctx.canvas, 0, 0, ew, eh);
  return snap;
}

// Full-resolution copy of the frame, for effects that read the whole picture
// before drawing over it. Its own buffer: the mix buffer must stay untouched.
let fxCopyCanvas = null;
function fxCopyFrame(ctx, w, h) {
  if (!fxCopyCanvas) fxCopyCanvas = document.createElement('canvas');
  if (fxCopyCanvas.width !== w || fxCopyCanvas.height !== h) {
    fxCopyCanvas.width = w;
    fxCopyCanvas.height = h;
  }
  const sc = fxCopyCanvas.getContext('2d');
  if (!sc) return null;
  sc.setTransform(1, 0, 0, 1, 0, 0);
  sc.clearRect(0, 0, w, h);
  sc.drawImage(ctx.canvas, 0, 0);
  return fxCopyCanvas;
}
let fxNoiseCanvas = null;
let fxDetailCanvas = null;

// High-pass detail: the plate minus its own blur is pure edge information.
// Adding that back lifts micro-contrast (skin, fabric, sensor texture) without
// brightening the picture -- the honest version of an "edge detail" slider.
function fxDetailPass(ctx, w, h, amount, intensity) {
  const amt = Math.max(0, Math.min(1, amount)) * Math.max(0, Math.min(1, intensity));
  if (amt <= 0.01) return;
  if (!fxDetailCanvas) fxDetailCanvas = document.createElement('canvas');
  const dw = Math.max(2, Math.round(w / 2));
  const dh = Math.max(2, Math.round(h / 2));
  if (fxDetailCanvas.width !== dw || fxDetailCanvas.height !== dh) {
    fxDetailCanvas.width = dw;
    fxDetailCanvas.height = dh;
  }
  const dctx = fxDetailCanvas.getContext('2d');
  if (!dctx) return;
  dctx.setTransform(1, 0, 0, 1, 0, 0);
  dctx.globalCompositeOperation = 'source-over';
  dctx.globalAlpha = 1;
  dctx.clearRect(0, 0, dw, dh);
  dctx.filter = 'blur(1.5px)';
  dctx.drawImage(ctx.canvas, 0, 0, dw, dh);
  dctx.filter = 'none';
  dctx.globalCompositeOperation = 'difference';
  dctx.drawImage(ctx.canvas, 0, 0, dw, dh);
  dctx.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = Math.min(0.85, amt * 0.95);
  ctx.drawImage(fxDetailCanvas, 0, 0, w, h);
  ctx.restore();
}

// The three controls every look shares, applied identically whatever the effect
// is: how much of the look survives, how warm the whole frame sits, how much
// grain sits on top.
function fxFinishPass(ctx, w, h, effectType, P, before, grainAmount) {
  const pick = (key, fallback) => (P && P[key] !== undefined ? P[key] : fallback);

  const temp = pick('finishTemp', 0);
  if (Math.abs(temp) > 1) {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    const warm = temp > 0;
    const a = Math.min(0.3, Math.abs(temp) / 100 * 0.3);
    ctx.fillStyle = warm ? `rgba(255, 176, 96, ${a})` : `rgba(110, 190, 255, ${a})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  const grain = pick('finishGrain', 0);
  if (grain > 1) {
    // one small noise tile, tiled across the frame: real texture, cheap
    if (!fxNoiseCanvas) {
      fxNoiseCanvas = document.createElement('canvas');
      fxNoiseCanvas.width = 96;
      fxNoiseCanvas.height = 96;
      const nctx = fxNoiseCanvas.getContext('2d');
      if (nctx) {
        const img = nctx.createImageData(96, 96);
        for (let i = 0; i < 96 * 96; i++) {
          const v = 96 + Math.random() * 64;
          img.data[i * 4] = v;
          img.data[i * 4 + 1] = v;
          img.data[i * 4 + 2] = v;
          img.data[i * 4 + 3] = 255;
        }
        nctx.putImageData(img, 0, 0);
      }
    }
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = Math.min(0.5, (grain / 100) * 0.5);
    const pat = ctx.createPattern(fxNoiseCanvas, 'repeat');
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  const mix = pick('mix', 100);
  if (before && mix < 99.5) {
    ctx.save();
    ctx.globalAlpha = 1 - mix / 100;
    ctx.drawImage(before, 0, 0, w, h, 0, 0, w, h);
    ctx.restore();
  }
}

// ============================================================================
// LYRC TYPOGRAPHY: fonts, spacing, placement, and the block renderer
// ----------------------------------------------------------------------------
// Two renderers share one typography model:
//   * the kinetic presets below draw words as a performance;
//   * the block styles (kind: 'block') draw a real caption — wrapped lines,
//     tracking, leading, a placement anchor and an optional plate behind it.
// Both read `lyrcTypeOf()`, so a font/size/placement change is visible
// immediately and identical in the 4K export.
// ============================================================================
function lyrcTypeBase(style) {
  return Object.assign({}, LYRC_TYPE_DEFAULTS, (style && style.type) || {});
}

function lyrcTypeOf() {
  const st = state.captionStyle || CAPTION_STYLES[0];
  // per-style tweaks win over the preset's base, so nothing is lost when you
  // switch looks and come back
  const saved = (state.lyrcTypeByStyle && state.lyrcTypeByStyle[st.id]) || {};
  return Object.assign({}, LYRC_TYPE_DEFAULTS, (st && st.type) || {}, state.lyrcType || {}, saved);
}

function lyrcApplyCase(text, mode) {
  const src = String(text == null ? '' : text);
  if (mode === 'upper') return src.toUpperCase();
  if (mode === 'lower') return src.toLowerCase();
  if (mode === 'title') return src.replace(/\S+/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
  return src;
}

function lyrcTypeFont(t, sizePx) {
  const face = lyrcFont(t.font);
  const weight = Number(t.weight) || 400;
  return `${t.italic ? 'italic ' : ''}${weight} ${Math.max(6, sizePx)}px ${face.stack}`;
}

// Canvas letter-spacing is patchy across versions; draw it by hand when it
// matters so tracking looks the same everywhere.
function lyrcTrackPx(sizePx, t) {
  return ((Number(t && t.tracking) || 0) / 1000) * sizePx;
}

function lyrcTextWidth(ctx, text, trackPx) {
  const src = String(text == null ? '' : text);
  if (!trackPx || src.length < 2) return ctx.measureText(src).width;
  let total = 0;
  for (const ch of Array.from(src)) total += ctx.measureText(ch).width + trackPx;
  return total - trackPx;
}

function lyrcDrawText(ctx, text, x, y, opts) {
  const o = opts || {};
  const track = Number(o.track) || 0;
  const mode = o.mode || 'fill';
  if (!track) {
    if (mode !== 'stroke' && o.fill) { ctx.fillStyle = o.fill; ctx.fillText(text, x, y); }
    if (mode !== 'fill' && o.stroke) {
      ctx.strokeStyle = o.stroke;
      if (o.lineWidth != null) ctx.lineWidth = o.lineWidth;
      ctx.strokeText(text, x, y);
    }
    return;
  }
  let cx = x;
  for (const ch of Array.from(String(text))) {
    if (mode !== 'stroke' && o.fill) { ctx.fillStyle = o.fill; ctx.fillText(ch, cx, y); }
    if (mode !== 'fill' && o.stroke) {
      ctx.strokeStyle = o.stroke;
      if (o.lineWidth != null) ctx.lineWidth = o.lineWidth;
      ctx.strokeText(ch, cx, y);
    }
    cx += ctx.measureText(ch).width + track;
  }
}

// Where the lines land. Pure layout, no painting: the tests use it directly.
function lyrcLayoutBlock(ctx, t, w, h, words) {
  const sizePx = Math.max(8, (h * (Number(t.sizePct) || 4)) / 100);
  const trackPx = lyrcTrackPx(sizePx, t);
  const lineH = sizePx * Math.max(0.7, Number(t.leading) || 1.05);
  const spaceW = lyrcTextWidth(ctx, ' ', 0) + trackPx;
  const display = (words || []).map((word) => lyrcApplyCase(word, t.caseMode));
  const widths = display.map((d) => lyrcTextWidth(ctx, d, trackPx));
  const maxW = Math.max(60, (w * (Number(t.maxWidthPct) || 86)) / 100);

  const lines = [];
  let cur = { items: [], width: 0 };
  for (let i = 0; i < display.length; i++) {
    const add = (cur.items.length ? spaceW : 0) + widths[i];
    if (cur.items.length && cur.width + add > maxW) {
      lines.push(cur);
      cur = { items: [i], width: widths[i] };
    } else {
      cur.items.push(i);
      cur.width += add;
    }
  }
  if (cur.items.length) lines.push(cur);

  const align = t.align || 'center';
  const anchorX = (Number(t.xPct) / 100) * w;
  const marginX = Math.max(4, w * 0.02);
  lines.forEach((line) => {
    const left = align === 'left' ? anchorX : align === 'right' ? anchorX - line.width : anchorX - line.width / 2;
    line.x = Math.min(Math.max(left, marginX), Math.max(marginX, w - marginX - line.width));
  });

  const blockH = lines.length * lineH;
  const cy = (Number(t.yPct) / 100) * h;
  return { lines, display, widths, sizePx, trackPx, lineH, blockH, cy, anchorX, maxW };
}

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawLyrcBlockStyle(ctx, w, h, st, t, info) {
  const look = (st && st.look) || {};
  const words = (info && info.words) || [];
  if (!words.length) return;
  const activeIdx = Number.isFinite(info.activeIdx) ? info.activeIdx : 0;
  const pxScale = h / 1080;

  ctx.save();
  // Measure with the font that will be drawn. Measuring with a placeholder made
  // every wrapped line and every clamp wrong by the size ratio.
  const measureSize = Math.max(8, (h * (Number(t.sizePct) || 4)) / 100);
  ctx.font = lyrcTypeFont(t, measureSize);
  const layout = lyrcLayoutBlock(ctx, t, w, h, words);
  const { lines, display, widths, sizePx, trackPx, lineH, blockH, cy } = layout;
  ctx.font = lyrcTypeFont(t, sizePx);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  lyrcSetTracking(ctx, 0);

  const rotate = Number(look.rotate) || 0;
  if (rotate) { ctx.translate(layout.anchorX, cy); ctx.rotate((rotate * Math.PI) / 180); ctx.translate(-layout.anchorX, -cy); }
  ctx.globalAlpha = Math.max(0, Math.min(1, (Number(t.opacity) || 100) / 100));

  const pad = Math.max(0, (Number(t.boxPad) || 0) / 100) * sizePx;
  const boxAlpha = Math.max(0, Math.min(1, (Number(t.boxOpacity) || 0) / 100));
  const top = cy - blockH / 2;
  // The vertical centre of line n's text. Bars and plates are placed from this,
  // not from the top of the line box, which is what put the bar above the words.
  const lineY = (n) => top + lineH / 2 + n * lineH;

  // plate behind the whole block
  if (boxAlpha > 0.01) {
    let minX = Infinity;
    let maxX = -Infinity;
    lines.forEach((line) => { minX = Math.min(minX, line.x); maxX = Math.max(maxX, line.x + line.width); });
    ctx.save();
    ctx.globalAlpha *= boxAlpha;
    ctx.fillStyle = t.boxColor || '#090a0f';
    roundRectPath(ctx, minX - pad, top - pad * 0.7, (maxX - minX) + pad * 2, blockH + pad * 1.4,
      (Number(t.boxRadius) || 0) * pxScale);
    ctx.fill();
    ctx.restore();
  }

  // accent rule (lower thirds)
  if (look.rule) {
    let minX = Infinity;
    lines.forEach((line) => { minX = Math.min(minX, line.x); });
    ctx.save();
    ctx.fillStyle = state.accentColor;
    ctx.fillRect(minX - pad * 0.9, top - pad * 0.2, Math.max(2, 4 * pxScale), blockH + pad * 0.4);
    // (the rule spans the whole block, so the line box is the right reference here)
    ctx.restore();
  }

  const activeLine = lines.findIndex((line) => line.items.indexOf(activeIdx) >= 0);
  const primary = state.primaryColor;
  const accent = state.accentColor;
  const inkOnAccent = look.barInk || '#111111';
  const wantBar = look.activeWord === 'bar' || look.activeWord === 'invert';
  const outlinePx = (Number(t.outline) || 0) * pxScale;
  const shadowStrength = Math.max(0, Math.min(1, (Number(t.shadow) || 0) / 100));

  // highlighter / knockout plates go under the words they belong to
  if (wantBar) {
    const line = lines[activeLine] || null;
    if (line) {
      ctx.save();
      ctx.fillStyle = accent;
      const barY = lineY(activeLine || 0);
      if (look.activeWord === 'invert') {
        // a box behind just the current word
        let x = line.x;
        line.items.forEach((wi) => {
          if (wi === activeIdx) {
            roundRectPath(ctx, x - sizePx * 0.08, barY - sizePx * 0.62,
              widths[wi] + sizePx * 0.16, sizePx * 1.24, sizePx * 0.12);
            ctx.fill();
          }
          x += widths[wi] + lyrcTextWidth(ctx, ' ', 0) + trackPx;
        });
      } else {
        // a bar behind the whole line being sung
        roundRectPath(ctx, line.x - sizePx * 0.14, barY - sizePx * 0.6,
          line.width + sizePx * 0.28, sizePx * 1.2, sizePx * 0.08);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  lines.forEach((line, li) => {
    const y = lineY(li);
    let x = line.x;
    line.items.forEach((wi) => {
      const isActive = wi === activeIdx;
      const onBarLine = wantBar && li === activeLine;
      let fill = primary;
      if (look.activeWord === 'accent' && isActive) fill = accent;
      else if (look.activeWord === 'sweep' && wi < activeIdx) fill = accent;
      else if (onBarLine) fill = inkOnAccent;

      ctx.save();
      if (isActive && look.pop) {
        const mid = x + widths[wi] / 2;
        const pop = 1.05 + Math.sin((info.progress || 0) * Math.PI) * 0.03;
        ctx.translate(mid, y);
        ctx.scale(pop, pop);
        ctx.translate(-mid, -y);
      }
      if (shadowStrength > 0.01) {
        ctx.shadowColor = `rgba(0,0,0,${(shadowStrength * 0.9).toFixed(2)})`;
        ctx.shadowBlur = sizePx * 0.16;
        ctx.shadowOffsetY = sizePx * 0.05;
      }
      if (look.hardShadow) {
        lyrcDrawText(ctx, display[wi], x + sizePx * 0.05, y + sizePx * 0.05,
          { track: trackPx, fill: accent, mode: 'fill' });
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }
      if (look.outlineOnly) {
        lyrcDrawText(ctx, display[wi], x, y, {
          track: trackPx,
          stroke: fill,
          lineWidth: outlinePx > 0.2 ? outlinePx : Math.max(1, sizePx * 0.02),
          mode: 'stroke'
        });
      } else {
        lyrcDrawText(ctx, display[wi], x, y, {
          track: trackPx,
          fill,
          stroke: outlinePx > 0.2 ? '#000000' : null,
          lineWidth: outlinePx,
          mode: outlinePx > 0.2 ? 'both' : 'fill'
        });
      }
      ctx.restore();

      // terminal cursor
      if (look.cursor && wi === activeIdx && Math.floor((info.progress || 0) * 6) % 2 === 0) {
        ctx.save();
        ctx.fillStyle = accent;
        ctx.fillRect(x + widths[wi] + trackPx + sizePx * 0.06, y - sizePx * 0.34, sizePx * 0.28, sizePx * 0.68);
        ctx.restore();
      }

      x += widths[wi] + lyrcTextWidth(ctx, ' ', 0) + trackPx;
    });
  });

  ctx.restore();
}

// ctx.letterSpacing is the cheap path for the kinetic presets; where it is not
// implemented the block renderer's own tracking still applies.
function lyrcSetTracking(ctx, px) {
  try {
    if ('letterSpacing' in ctx) { ctx.letterSpacing = Math.round(px * 100) / 100 + 'px'; return true; }
  } catch (_e) { /* older canvas: ignore */ }
  return false;
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
  let activeIdx = Math.floor(phraseProgress * words.length);
  let wordSubProgress = (phraseProgress * words.length) % 1;
  // When the timing was measured from the audio, every word already has its own
  // start time -- so the highlight lands on the word instead of on an even slice
  // of the cue. This is what makes a lyric line read as sung, not as typed.
  if (activeCue.timed !== false && activeCue.words && activeCue.words.length === words.length) {
    let idx = 0;
    for (let k = 0; k < activeCue.words.length; k++) {
      if (state.playheadSec >= activeCue.words[k].startSec) idx = k;
    }
    const cur = activeCue.words[idx];
    activeIdx = idx;
    wordSubProgress = cur
      ? Math.max(0, Math.min(1, (state.playheadSec - cur.startSec) / Math.max(0.08, cur.endSec - cur.startSec)))
      : 0;
  }

  const styleId = state.captionStyle.id;
  const type = lyrcTypeOf();

  // The block family is a caption, not a performance: wrapped lines, tracking,
  // leading and a placement anchor. Same model, different renderer.
  if (state.captionStyle.kind === 'block') {
    drawLyrcBlockStyle(ctx, w, h, state.captionStyle, type, {
      words, activeIdx, subProgress: wordSubProgress, progress: phraseProgress
    });
    return;
  }

  // Size, position and tracking come from the typography model. The 25px base
  // is the old default, so an untouched preset lays out exactly as before.
  const baseScale = Math.max(0.4, ((h * (Number(type.sizePct) || 3.6)) / 100) / 25);
  const centerY = (Number(type.yPct) / 100) * h;
  const align = type.align || 'center';
  const fontStack = lyrcFont(type.font).stack;
  const seed = state.variationSeed;

  ctx.save();
  ctx.letterSpacingFallback = 0;
  lyrcSetTracking(ctx, lyrcTrackPx((h * (Number(type.sizePct) || 3.6)) / 100, type));

  // 1. BRAT
  if (styleId === 'brat') {
    const visibleWords = words.slice(0, activeIdx + 1).map((x) => x.toLowerCase());
    if (state.backdropMode !== 'clean') {
      ctx.fillStyle = 'rgba(138, 206, 0, 0.92)';
      ctx.fillRect(w * 0.22, centerY - 78 * baseScale, w * 0.56, 156 * baseScale);
    }
    ctx.filter = 'blur(0.75px)';
    ctx.fillStyle = state.backdropMode === 'clean' ? '#8ace00' : '#000000';
    ctx.font = `600 ${Math.round(25 * baseScale)}px ${fontStack}`;
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
          : `900 ${fSize}px ${fontStack}`;
        const textStr = isSerif ? word.toLowerCase() : word.toUpperCase();
        const mw = ctx.measureText(textStr).width;
        totalRowW += mw;
        return { textStr, isSerif, isCurrent, fSize, mw, gIdx };
      });
      totalRowW += Math.max(0, metrics.length - 1) * 14;

      let xCursor = align === 'left' ? w * 0.16 : align === 'right' ? w * 0.84 - totalRowW : (w - totalRowW) / 2;

      metrics.forEach((m) => {
        ctx.save();
        ctx.font = m.isSerif
          ? `italic 700 ${m.fSize}px Georgia, "Times New Roman", serif`
          : `900 ${m.fSize}px ${fontStack}`;
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
      ctx.font = `900 ${fSize}px ${fontStack}`;
      const tw = ctx.measureText(upper).width;
      const x = align === 'left' ? w * 0.16 : align === 'right' ? w * 0.84 - tw : (w - tw) / 2;
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
      ctx.font = `900 ${fSize}px ${fontStack}`;
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
    const isRight = align === 'right';
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
        ? `900 ${fSize}px ${fontStack}`
        : `600 ${fSize}px ${fontStack}`;
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
      ctx.font = `900 ${fSize}px ${fontStack}`;
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
      ? `500 ${fSize}px ${fontStack}`
      : `800 ${fSize}px ${fontStack}`;

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
    ? `italic 900 ${fontSize}px ${fontStack}`
    : `900 ${fontSize}px ${fontStack}`;
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

// Test seam. tools/dom/mask.mjs sets window.__PULSE_TEST__ before the page
// loads so it can drive the masker with synthetic frames; a normal visit never
// sees this object.
if (typeof window !== 'undefined' && window.__PULSE_TEST__) {
  window.PulseTest = {
    state,
    // lyrics auto-detect (the listening engine itself lives in audio-lab.js)
    lyricsDetect,
    lyricAnalyzeAudio,
    lyricTranscribe,
    splitLongCues,
    lyricDescribe,
    syncLyricsToBeatCues,
    setLyricDetectMode,
    loadTranscriptFile,
    renderCueList,
    drawLyrcStudioTypography,
    // LYRC typography: fonts, spacing, placement, block renderer
    LYRC_FONTS,
    LYRC_TYPE_DEFAULTS,
    CAPTION_STYLES,
    lyrcTypeOf,
    lyrcTypeBase,
    lyrcLayoutBlock,
    drawLyrcBlockStyle,
    lyrcApplyCase,
    lyrcTrackPx,
    lyrcSizePx,
    setLyrcType,
    applyLyrcStyleDefaults,
    syncLyrcTypePanel,
    selectLyrcPreset,
    buildLyrcCategoryPills,
    saveLyrcType,
    loadLyrcType,
    setLyricsOverlay,
    applyLyricsState,
    segmentsFromAnalysis,
    renderSilenceSegments,
    // editable timeline
    TIMELINE: () => window.TIMELINE,
    tlClips,
    tlSpan,
    tlDuration,
    tlAddClipFromStage,
    tlSetClips,
    tlBeginDrag,
    tlDragTo,
    tlEndDrag,
    tlHitMode,
    tlSplitAtPlayhead,
    tlDeleteSelected,
    tlScrubTo,
    stageSourceTime,
    tlPlaybackTick,
    tlHighlightSelection,
    tlUpdateButtons,
    seekTo,
    syncStageHint,
    outputFrameRect,
    syncPreviewCanvasSize,
    bootFailures,
    renderTimelineTracks,
    renderTimelineSelection,
    // in-app cutter
    silenceKeptPlan,
    remeasureSilenceSegments,
    refreshSilencePlan,
    silenceSkipTick,
    silenceCutAt,
    renderInAppCut,
    resetSilenceCut,
    decodePlateAudioBuffer,
    drawSilenceWaveform,
    isSegmentCut,

    maskSolveFromPixels,
    maskClickSelect,
    maskLuma,
    maskTemplateAt,
    maskSnapRing,
    maskResamplePolygon,
    maskTracePolygon,
    maskCalmRing,
    maskShiftMaskSub,
    maskGrowInBand,
    maskSeedsFromBuffer,
    maskFillHoles,
    maskTracePolygon,
    maskCoverage,
    maskSampleFrame,
    maskTrackFrames,
    maskSolve,
    maskRebuild,
    maskHasMatte,
    maskAddSeed,
    maskPointFromEvent,
    ensureMaskState,
    // effect parameter rack (no single-slider looks)
    fxParamDefs,
    fxParam,
    setFxParam,
    fxParamsOf,
    fxResetParams,
    renderFxParamRack,
    drawCinemaOpticalShader,
    // depth map pipeline (raw → derived → effects)
    depthDerive,
    depthSetRaw,
    depthEffectsOn,
    ensureDepthState,
    effectTypes: () => Array.from(new Set(VFX_PRESETS.map((p) => p.effectType))).sort()
  };
}

function startBridgeStatusPoll() {
  initWireStrip();
  checkResolveStatus();
  setInterval(() => {
    if (document.hidden) return;
    checkResolveStatus();
  }, 4000);
}
