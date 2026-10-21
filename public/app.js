'use strict';

/* ============================================================================
   PulseVFX Studio — DaVinci Resolve Free 21.1.1 companion
   Cinematic optical / photochemical / rig VFX preview engine + LYRC kinetic type
   ========================================================================== */

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (t) => t * t * (3 - 2 * t);
const TAU = Math.PI * 2;

function showToast(message, tone) {
  const host = $('toastContainer');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast' + (tone === 'warn' ? ' warn' : '');
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(() => el.remove(), 320);
  }, 2600);
}

function fmtTC(seconds, fps = 24) {
  const s = Math.max(0, seconds);
  const f = Math.floor((s % 1) * fps);
  const sec = Math.floor(s) % 60;
  const min = Math.floor(s / 60) % 60;
  return `01:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

/* ============================================================================
   1. VFX PRESET LIBRARY — 48 film-craft treatments
   No stock "zoom shake" presets. Everything maps to a real photographic
   phenomenon: print stock response, shutter behaviour, rig physics, signal.
   ========================================================================== */

const VFX_CATEGORY_META = {
  'Optical & Film': { short: 'OPT', color: '#f59e0b' },
  'Shutter & Time': { short: 'SHUT', color: '#06b6d4' },
  'Camera Rig': { short: 'RIG', color: '#818cf8' },
  Hits: { short: 'IMP', color: '#ef4444' },
  'Roto & Matte': { short: 'ROTO', color: '#10b981' },
  Transitions: { short: 'TRN', color: '#a855f7' },
  'Analog Signal': { short: 'SIG', color: '#64748b' }
};

const VFX_PRESETS = [
  /* ---- Optical & Film ------------------------------------------------ */
  {
    id: 'print2383', name: '2383 Print Halation', cat: 'Optical & Film', spec: 'KODAK 2383',
    desc: 'Print-stock contrast curve with red-orange halation bleeding off speculars. The look of a 35mm release print, not a filter.',
    node: 'PrintStock + Halation', effects: ['print2383', 'halation', 'grain', 'weave'], intensity: 72,
    curve: [0.04, 0.12, 0.3, 0.52, 0.7, 0.84, 0.93, 0.99]
  },
  {
    id: 'anamorphic', name: 'Panavision Streak', cat: 'Optical & Film', spec: '2.39 : 1',
    desc: 'Blue horizontal flares stretched by anamorphic glass, with oval bokeh and a gentle squeeze vignette.',
    node: 'Streak + OvalBokeh', effects: ['anamorphic', 'halation', 'bokehOval', 'grain'], intensity: 64,
    curve: [0.05, 0.14, 0.26, 0.45, 0.62, 0.8, 0.92, 1]
  },
  {
    id: 'promist', name: 'Pro-Mist 1/4', cat: 'Optical & Film', spec: 'Tiffen 1/4',
    desc: 'Highlights bloom into the shadows while black levels stay put. The diffusion that keeps skin and practicals from clipping.',
    node: 'BlackProMist', effects: ['promist', 'grain'], intensity: 46,
    curve: [0.02, 0.1, 0.28, 0.5, 0.72, 0.86, 0.95, 1]
  },
  {
    id: 'largeformat', name: '65mm Falloff', cat: 'Optical & Film', spec: '65 / 5-perf',
    desc: 'Large-format depth falloff with a smooth edge vignette and restrained contrast. Faces stay dimensional.',
    node: 'ShallowDoF + Format', effects: ['shallowDof', 'largeFormat', 'grain'], intensity: 52,
    curve: [0.06, 0.2, 0.4, 0.6, 0.78, 0.9, 0.96, 1]
  },
  {
    id: 'bleach', name: 'Bleach Bypass', cat: 'Optical & Film', spec: 'ENR Silver',
    desc: 'Silver retention: desaturated mids, hard metallic highlights, crushed toe. Seven + Saving Private Ryan territory.',
    node: 'BleachBypass', effects: ['bleach', 'grain', 'vignette'], intensity: 68,
    curve: [0, 0.06, 0.2, 0.46, 0.72, 0.9, 0.97, 1]
  },
  {
    id: 'tealorange', name: 'Split-Tone 2383', cat: 'Optical & Film', spec: 'TEAL / 3200K',
    desc: 'Cool toe, warm cheekbones. A measured split-tone with highlight protection rather than a blanket LUT.',
    node: 'SplitTone', effects: ['tealOrange', 'halation', 'grain'], intensity: 50,
    curve: [0.03, 0.13, 0.32, 0.55, 0.74, 0.87, 0.95, 1]
  },
  {
    id: 'vision3', name: 'Vision3 500T', cat: 'Optical & Film', spec: '5219',
    desc: 'Tungsten-balanced negative with fine grain, warm highlight roll-off and a cyan shadow lift straight off the datasheet.',
    node: 'FilmNegative', effects: ['vision3', 'grain'], intensity: 44,
    curve: [0.05, 0.17, 0.36, 0.56, 0.71, 0.84, 0.93, 1]
  },
  {
    id: 'logwash', name: 'Cineon Log Wash', cat: 'Optical & Film', spec: 'Cineon',
    desc: 'Flat, milky log image with lifted blacks for finishing inside a later grade. Deliberately un-pretty.',
    node: 'LogTransform', effects: ['logWash'], intensity: 60,
    curve: [0.14, 0.28, 0.43, 0.56, 0.67, 0.77, 0.86, 0.95]
  },
  {
    id: 'negspace', name: 'Dense Negative', cat: 'Optical & Film', spec: '2-stop push',
    desc: 'Underexposed then pushed: dense shadows, dirty highlights, coarse grain structure and a little halation.',
    node: 'PushProcess', effects: ['dense', 'halation', 'grain'], intensity: 58,
    curve: [0, 0.05, 0.16, 0.38, 0.62, 0.82, 0.94, 1]
  },

  /* ---- Shutter & Time ------------------------------------------------ */
  {
    id: 'stepprint', name: 'Step-Print 6fps', cat: 'Shutter & Time', spec: '6 FPS',
    desc: 'Print frames held for four, giving that Wong Kar-wai smeared step cadence on movement rather than a stutter effect.',
    node: 'TimeQuantize', effects: ['stepPrint', 'shutterTrail', 'grain'], intensity: 80,
    curve: [0, 0.1, 0.3, 0.5, 0.7, 0.86, 0.95, 1]
  },
  {
    id: 'shutter90', name: '90° Shutter', cat: 'Shutter & Time', spec: '90 DEG',
    desc: 'Crisp, staccato action with minimal motion blur. Clean plates for fight choreography and dance.',
    node: 'ShutterAngle', effects: ['shutter90', 'grain'], intensity: 38,
    curve: [0, 0.08, 0.26, 0.52, 0.76, 0.9, 0.97, 1]
  },
  {
    id: 'shutter360', name: '360° Smear', cat: 'Shutter & Time', spec: '360 DEG',
    desc: 'Full-shutter accumulation: hands and hair smear into silk. Requires a locked camera to read properly.',
    node: 'FrameBlend', effects: ['shutterTrail', 'promist'], intensity: 55,
    curve: [0.02, 0.1, 0.24, 0.44, 0.66, 0.84, 0.94, 1]
  },
  {
    id: 'speedramp', name: 'Optical Speed Ramp', cat: 'Shutter & Time', spec: '24→240 FPS',
    desc: 'Smooth time remap with frame-blended in-betweens. Ramps land on the downbeat, not on a random edit.',
    node: 'OpticalFlow', effects: ['speedRamp', 'shutterTrail', 'grain'], intensity: 70,
    curve: [0.1, 0.2, 0.34, 0.52, 0.68, 0.8, 0.9, 1]
  },
  {
    id: 'echo', name: 'Frame Echo', cat: 'Shutter & Time', spec: '2 FRAME',
    desc: 'Two previous frames held at low opacity. Reads as shutter drag on fast pans, invisible on statics.',
    node: 'FrameEcho', effects: ['frameEcho', 'grain'], intensity: 42,
    curve: [0.01, 0.08, 0.22, 0.45, 0.66, 0.82, 0.93, 1]
  },
  {
    id: 'timeslice', name: 'Time Slice', cat: 'Shutter & Time', spec: '1/3 SEC',
    desc: 'Holds a single frame, then jumps. Gives the montage a broken-projector rhythm without adding shake.',
    node: 'HoldFrame', effects: ['timeSlice', 'gateWeave'], intensity: 66,
    curve: [0, 0.12, 0.36, 0.58, 0.74, 0.86, 0.94, 1]
  },
  {
    id: 'reverse', name: 'Reverse Burst', cat: 'Shutter & Time', spec: 'NEG SPEED',
    desc: 'Short reversed bursts on cuts. Editorial punctuation used once per phrase, not every beat.',
    node: 'ReverseClip', effects: ['reverseRamp', 'shutterTrail'], intensity: 60,
    curve: [0.04, 0.12, 0.28, 0.48, 0.7, 0.86, 0.95, 1]
  },

  /* ---- Camera Rig ---------------------------------------------------- */
  {
    id: 'snorricam', name: 'SnorriCam Chest Lock', cat: 'Camera Rig', spec: 'BODY RIG',
    desc: 'Camera bolted to the chest: subject stays pin-sharp while the world swims behind them. Requires a plate with a clear subject.',
    node: 'RigLock', effects: ['snorricam', 'shallowDof', 'grain'], intensity: 74,
    curve: [0.02, 0.12, 0.3, 0.5, 0.7, 0.86, 0.95, 1]
  },
  {
    id: 'handheld', name: 'Easyrig Drift', cat: 'Camera Rig', spec: 'OPERATOR',
    desc: 'Low-frequency operator sway with micro-corrections. Sub-degree amplitude — presence without seasickness.',
    node: 'Handheld', effects: ['handheld', 'grain'], intensity: 34,
    curve: [0.01, 0.1, 0.3, 0.54, 0.76, 0.89, 0.97, 1]
  },
  {
    id: 'dollyzoom', name: 'Dolly Zoom', cat: 'Camera Rig', spec: 'VERTIGO',
    desc: 'Truck in while the focal length counter-zooms. Background perspective bends; the subject holds size.',
    node: 'DollyZoom', effects: ['dollyZoom', 'shallowDof'], intensity: 62,
    curve: [0.05, 0.16, 0.32, 0.5, 0.68, 0.83, 0.93, 1]
  },
  {
    id: 'crashzoom', name: 'Crash Zoom 24→85', cat: 'Camera Rig', spec: '24-85mm',
    desc: 'Snap zoom that lands on the transient with a soft settle rather than a wobble.',
    node: 'CrashZoom', effects: ['crashZoom', 'promist'], intensity: 56,
    curve: [0.03, 0.14, 0.3, 0.5, 0.7, 0.86, 0.95, 1]
  },
  {
    id: 'focusrack', name: 'Lens Breath Rack', cat: 'Camera Rig', spec: 'T1.5',
    desc: 'Focus travels between foreground and eyes with a touch of breathing. The most under-used storytelling motion in reels.',
    node: 'RackFocus', effects: ['focusRack', 'shallowDof', 'grain'], intensity: 48,
    curve: [0.05, 0.18, 0.36, 0.55, 0.72, 0.86, 0.94, 1]
  },
  {
    id: 'steadicam', name: 'Steadicam Float', cat: 'Camera Rig', spec: 'STEADY',
    desc: 'Smooth, inertial translation with a slow orbital drift. No jitter, no shake — just glide.',
    node: 'Steadicam', effects: ['steadicam', 'promist'], intensity: 40,
    curve: [0.02, 0.12, 0.32, 0.55, 0.75, 0.88, 0.96, 1]
  },
  {
    id: 'probe', name: 'Probe Macro', cat: 'Camera Rig', spec: '24mm PROBE',
    desc: 'Extreme close focus with a slim depth plane and slow lateral move. Texture, skin, condensation, fabric.',
    node: 'ProbeLens', effects: ['probe', 'shallowDof', 'grain'], intensity: 58,
    curve: [0.08, 0.24, 0.44, 0.62, 0.78, 0.9, 0.96, 1]
  },

  /* ---- Hits / exposure ---------------------------------------------- */
  {
    id: 'lumahit', name: '1-Frame Luma Hit', cat: 'Hits', spec: '1F +12 IRE',
    desc: 'Single-frame exposure lift on the transient. Felt on a beat, barely visible paused.',
    node: 'LumaHit', effects: ['lumaHit', 'grain'], intensity: 46,
    curve: [0.05, 0.2, 0.42, 0.62, 0.78, 0.9, 0.97, 1]
  },
  {
    id: 'flashframe', name: 'Flash Frame', cat: 'Hits', spec: '2F WHITE',
    desc: 'Two frames of overexposed print stock. Stronger than a luma hit, still short of a strobe.',
    node: 'FlashFrame', effects: ['flashFrame', 'grain'], intensity: 52,
    curve: [0.1, 0.3, 0.5, 0.68, 0.82, 0.92, 0.98, 1]
  },
  {
    id: 'snare', name: 'Damped Snare Impulse', cat: 'Hits', spec: 'TRANSIENT',
    desc: 'A 1.5px scale impulse plus micro contrast on the snare, with a quick decay. Reads as impact, not as shake.',
    node: 'TransientImpulse', effects: ['snareImpulse', 'halation'], intensity: 40,
    curve: [0.02, 0.18, 0.44, 0.66, 0.8, 0.9, 0.96, 1]
  },
  {
    id: 'strobe', name: 'Strobe Gate', cat: 'Hits', spec: '1/16 NOTE',
    desc: 'Blackout gate on sixteenth notes for club sequences. Rate-limited to stay inside broadcast flash guidance.',
    node: 'StrobeGate', effects: ['strobeGate'], intensity: 58,
    curve: [0, 0, 1, 1, 0, 0, 1, 1]
  },
  {
    id: 'chromaslam', name: 'Chromatic Slam', cat: 'Hits', spec: 'RGB SPLIT',
    desc: 'Sub-pixel channel separation that snaps back. The lens-damage version of a glitch, not the YouTube version.',
    node: 'Chromatic', effects: ['chromaSlam', 'halation'], intensity: 44,
    curve: [0.02, 0.14, 0.34, 0.56, 0.74, 0.88, 0.95, 1]
  },
  {
    id: 'zoompunch', name: 'Impact Zoom Punch', cat: 'Hits', spec: '3% ZOOM',
    desc: 'A three percent scale punch with an ease-out. Subtle enough to survive a client review.',
    node: 'ZoomPunch', effects: ['zoomPunch', 'promist'], intensity: 38,
    curve: [0.03, 0.16, 0.36, 0.58, 0.76, 0.89, 0.96, 1]
  },
  {
    id: 'blackout', name: 'Blackout Drop', cat: 'Hits', spec: '2F BLACK',
    desc: 'Two frames of black at the edit point. Hardest cut in the toolkit — used once, it lands.',
    node: 'Blackout', effects: ['blackout'], intensity: 50,
    curve: [1, 1, 0.4, 0, 0, 0.3, 0.8, 1]
  },

  /* ---- Roto & Matte -------------------------------------------------- */
  {
    id: 'lumaroto', name: 'Luma Roto Glow', cat: 'Roto & Matte', spec: 'LUMA KEY',
    desc: 'Isolates the top two stops and wraps them in a soft emissive glow. Practicals and skin get separated without masks.',
    node: 'LumaKey + Glow', effects: ['lumaRoto', 'halation'], intensity: 54,
    curve: [0, 0.04, 0.14, 0.36, 0.66, 0.9, 1, 1]
  },
  {
    id: 'rimlight', name: 'Edge Light Rim', cat: 'Roto & Matte', spec: 'RIM 5600K',
    desc: 'A directional rim pass along the subject edge. Simulates a kicker you did not have on set.',
    node: 'EdgeLight', effects: ['rimLight', 'shallowDof'], intensity: 46,
    curve: [0.02, 0.14, 0.34, 0.56, 0.75, 0.88, 0.96, 1]
  },
  {
    id: 'vignettematte', name: 'Matte Vignette', cat: 'Roto & Matte', spec: 'ELLIPSE',
    desc: 'Hand-shaped matte vignette with a 40-pixel feather. Pulls the eye to the face without a visible edge.',
    node: 'Vignette', effects: ['vignette'], intensity: 44,
    curve: [0.3, 0.5, 0.7, 0.86, 0.95, 0.99, 1, 1]
  },
  {
    id: 'fog', name: 'Depth Fog', cat: 'Roto & Matte', spec: 'Z DEPTH',
    desc: 'Atmospheric separation driven by a depth gradient, warm at the top, cool at the floor.',
    node: 'DepthFog', effects: ['fogGradient', 'promist'], intensity: 42,
    curve: [0.08, 0.22, 0.4, 0.58, 0.74, 0.87, 0.95, 1]
  },
  {
    id: 'skinkey', name: 'Skin-Tone Protect', cat: 'Roto & Matte', spec: 'VECTOR',
    desc: 'Holds skin vectors stable while cooling the rest of the frame. Comes with a subtle specular roll-off.',
    node: 'SkinVector', effects: ['skinProtect', 'grain'], intensity: 36,
    curve: [0.04, 0.16, 0.36, 0.58, 0.76, 0.89, 0.96, 1]
  },
  {
    id: 'skykey', name: 'Sky Luma Key', cat: 'Roto & Matte', spec: 'LUMA 70+',
    desc: 'Replaces the top-end sky gradient through a luma key — no tracking, no mask animation.',
    node: 'SkyKey', effects: ['skyKey', 'halation'], intensity: 50,
    curve: [0, 0.06, 0.2, 0.44, 0.72, 0.92, 1, 1]
  },
  {
    id: 'duotoneiso', name: 'Duotone Isolation', cat: 'Roto & Matte', spec: '2-COLOR',
    desc: 'Editorial duotone with a reserved highlight channel. Built for poster frames and title cards.',
    node: 'Duotone', effects: ['duotoneIso', 'grain'], intensity: 60,
    curve: [0.02, 0.12, 0.3, 0.5, 0.7, 0.86, 0.95, 1]
  },

  /* ---- Transitions --------------------------------------------------- */
  {
    id: 'whippan', name: 'Whip Pan Blur', cat: 'Transitions', spec: '12F',
    desc: 'Directional smear across the cut with a matching audio whoosh point. Blur follows the camera, not the screen.',
    node: 'DirectionalBlur', effects: ['whipPan', 'shutterTrail'], intensity: 62,
    curve: [0.02, 0.1, 0.28, 0.56, 0.82, 0.94, 0.98, 1]
  },
  {
    id: 'exposurewipe', name: 'Exposure Wipe', cat: 'Transitions', spec: '8F',
    desc: 'A blown-out print-stock wipe that travels with the action. Clean, filmic, no glitch artifacts.',
    node: 'ExposureWipe', effects: ['exposureWipe', 'halation'], intensity: 58,
    curve: [0, 0.14, 0.4, 0.68, 0.88, 0.97, 1, 1]
  },
  {
    id: 'matchzoom', name: 'Match Cut Zoom', cat: 'Transitions', spec: 'MATCH',
    desc: 'Scales out of the outgoing frame centre into the incoming shot. Ends where the new composition begins.',
    node: 'MatchZoom', effects: ['matchZoom', 'grain'], intensity: 54,
    curve: [0.1, 0.24, 0.42, 0.6, 0.76, 0.88, 0.95, 1]
  },
  {
    id: 'gateflash', name: 'Gate Flash Cut', cat: 'Transitions', spec: '3F',
    desc: 'Three frames of projector gate white between shots. Mimics a physical splice, not a digital flash.',
    node: 'GateFlash', effects: ['gateFlash', 'weave'], intensity: 48,
    curve: [0.2, 0.5, 0.9, 1, 0.7, 0.4, 0.2, 0.05]
  },
  {
    id: 'rollingskew', name: 'Rolling Shutter', cat: 'Transitions', spec: 'CMOS',
    desc: 'Top-to-bottom readout skew on fast pans. Correct period-correct digital texture for archival sequences.',
    node: 'RollingShutter', effects: ['rollingSkew'], intensity: 36,
    curve: [0, 0.06, 0.2, 0.46, 0.72, 0.9, 0.98, 1]
  },
  {
    id: 'dissolveglitch', name: '2-Frame Dissolve', cat: 'Transitions', spec: '2F MIX',
    desc: 'A two-frame dissolve with a hard vertical slice offset. Invisible at speed, surgical on pause.',
    node: 'Dissolve', effects: ['dissolveGlitch'], intensity: 40,
    curve: [0.02, 0.16, 0.4, 0.64, 0.8, 0.9, 0.96, 1]
  },

  /* ---- Analog Signal ------------------------------------------------- */
  {
    id: 'pvm', name: 'Sony PVM Scan', cat: 'Analog Signal', spec: 'PVM-20L5',
    desc: 'Aperture-grille scanlines, phosphor bloom and a soft CRT mask. Reference-monitor texture, not a VHS toy.',
    node: 'CRT + Mask', effects: ['pvm', 'phosphor'], intensity: 52,
    curve: [0.02, 0.12, 0.32, 0.54, 0.72, 0.86, 0.94, 1]
  },
  {
    id: 'vhs', name: 'VHS Head Switch', cat: 'Analog Signal', spec: 'SP MODE',
    desc: 'Chroma bleed, a head-switching tear band and 240-line softness. Restrained tape patina for archival inserts.',
    node: 'ChromaBleed', effects: ['vhs', 'grain'], intensity: 44,
    curve: [0.04, 0.14, 0.3, 0.48, 0.64, 0.78, 0.9, 1]
  },
  {
    id: 'projector', name: '35mm Projector', cat: 'Analog Signal', spec: '24 FPS',
    desc: 'Gate weave, 48Hz flicker, dust and a hair in the gate. The real mechanics of a release print.',
    node: 'GateWeave + Dust', effects: ['weave', 'projector', 'grain'], intensity: 46,
    curve: [0.03, 0.12, 0.3, 0.52, 0.72, 0.86, 0.95, 1]
  },
  {
    id: 'dither', name: 'Photocopy Dither', cat: 'Analog Signal', spec: '1200 DPI',
    desc: 'Ordered-dither halftone with a tight black point. Zine and fax texture for inserts and title cards.',
    node: 'Dither', effects: ['dither', 'grain'], intensity: 56,
    curve: [0, 0.04, 0.16, 0.4, 0.68, 0.88, 0.97, 1]
  },
  {
    id: 'splitdiopter', name: 'Split Diopter', cat: 'Optical & Film', spec: 'DIOPTER +2',
    desc: 'Two focal planes at once: foreground sharp, background sharp, the middle falls away. De Palma\'s favourite optical cheat.',
    node: 'SplitField', effects: ['splitDiopter', 'grain'], intensity: 60,
    curve: [0.1, 0.26, 0.46, 0.62, 0.76, 0.88, 0.95, 1]
  },
  {
    id: 'veiling', name: 'Veiling Glare', cat: 'Optical & Film', spec: 'LENS DIRT',
    desc: 'Wide, low-amplitude glare lifted off the whole image — the milky lift of an uncoated element pointed near a window.',
    node: 'VeilingGlare', effects: ['veiling', 'grain'], intensity: 38,
    curve: [0.12, 0.26, 0.44, 0.6, 0.74, 0.86, 0.94, 1]
  },
  {
    id: 'edgeca', name: 'Edge Chromatic', cat: 'Optical & Film', spec: 'CA 1.4px',
    desc: 'Channel separation that only appears at the edges of the frame, like a real wide-angle prime. Centre stays clean.',
    node: 'ChromaticAberration', effects: ['edgeCA', 'grain'], intensity: 34,
    curve: [0.04, 0.14, 0.32, 0.52, 0.72, 0.86, 0.94, 1]
  },
  {
    id: 'dayfornight', name: 'Day for Night', cat: 'Optical & Film', spec: 'UNDEREX -2',
    desc: 'The classic in-camera cheat: underexpose, cool the shadows, hold a touch of detail in the sky. No teal wash.',
    node: 'DayForNight', effects: ['dayForNight', 'grain'], intensity: 66,
    curve: [0.02, 0.08, 0.2, 0.36, 0.52, 0.68, 0.82, 0.95]
  },
  {
    id: 'phosphor', name: 'Phosphor Persistence', cat: 'Analog Signal', spec: 'P22',
    desc: 'Green-decay persistence trails behind motion. Long on highlights, short on mid-tones, like a real tube.',
    node: 'Persistence', effects: ['phosphor', 'pvm'], intensity: 48,
    curve: [0.02, 0.1, 0.26, 0.48, 0.7, 0.86, 0.94, 1]
  }
];

/* ============================================================================
   2. LYRC.STUDIO KINETIC TYPOGRAPHY PRESETS
   ========================================================================== */

const LYRC_PRESETS = [
  { id: 'duet', name: 'Duet', cat: 'Bold', desc: 'Two font roles trade emphasis as words arrive.', variation: true, sample: 'MIDNIGHT / duet', fonts: 'sans_serif' },
  { id: 'redline', name: 'Redline', cat: 'Bold', desc: 'Stacked caps build with a selective knockout box.', variation: true, sample: 'REDLINE', fonts: 'condensed_mono' },
  { id: 'brat', name: 'Brat', cat: 'Bold', desc: 'Stretched lowercase on an acid-green card.', variation: false, sample: 'brat summer', fonts: 'lowercase_brat' },
  { id: 'heartless', name: 'Heartless', cat: 'Bold', desc: 'Serif lead-ins with glowing emphasis words.', variation: true, sample: 'heartless', fonts: 'editorial_display' },
  { id: 'uplift', name: 'Uplift', cat: 'Bold', desc: 'Rising vertical stack, word by word.', variation: true, sample: 'UPLIFT', fonts: 'condensed_mono' },
  { id: 'voltage', name: 'VOLTAGE', cat: 'Bold', desc: 'Chromatic jitter with voltage accents.', variation: false, sample: 'VOLTAGE', fonts: 'condensed_mono' },
  { id: 'overdrive', name: 'Overdrive', cat: 'Bold', desc: 'Forward-sheared speed type.', variation: true, sample: 'OVERDRIVE', fonts: 'condensed_mono' },

  { id: 'tiledwave', name: 'Tiled Wave', cat: 'Layered', desc: 'A bento mosaic that shifts as phrases land.', variation: true, sample: 'TILED WAVE', fonts: 'sans_serif' },
  { id: 'margin', name: 'Margin', cat: 'Layered', desc: 'Editorial side column on a margin rail.', variation: true, sample: 'Margin notes', fonts: 'editorial_display' },
  { id: 'relay', name: 'Relay', cat: 'Layered', desc: 'Card stack that hands off between phrases.', variation: false, sample: 'relay', fonts: 'sans_serif' },
  { id: 'fullset', name: 'Full Set', cat: 'Layered', desc: 'Full-frame poster lockup in quadrants.', variation: true, sample: 'FULL SET', fonts: 'condensed_mono' },
  { id: 'ladder', name: 'Ladder House', cat: 'Layered', desc: 'Diagonal staircase composition.', variation: true, sample: 'LADDER', fonts: 'condensed_mono' },
  { id: 'ticker', name: 'Ticker', cat: 'Layered', desc: 'Horizontal kinetic tape rails.', variation: true, sample: 'ticker tape', fonts: 'sans_serif' },

  { id: 'deepfocus', name: 'Deep Focus', cat: 'Minimal', desc: 'Unsung words blur; the active word racks sharp.', variation: true, sample: 'deep focus', fonts: 'sans_serif' },
  { id: 'afterimage', name: 'Afterimage', cat: 'Minimal', desc: 'Ghost echoes above and below the word.', variation: false, sample: 'afterimage', fonts: 'editorial_display' },
  { id: 'afterglow', name: 'Afterglow', cat: 'Minimal', desc: 'Soft luminous halo for held notes.', variation: false, sample: 'afterglow', fonts: 'editorial_display' },
  { id: 'quiet', name: 'Quiet', cat: 'Minimal', desc: 'Wide-tracked lowercase cinema subtitles.', variation: false, sample: 'quiet', fonts: 'sans_serif' },
  { id: 'letterpress', name: 'Letterpress', cat: 'Minimal', desc: 'Extruded block type with a printed edge.', variation: true, sample: 'LETTERPRESS', fonts: 'condensed_mono' },

  { id: 'hormozi', name: 'Hormozi Brand', cat: 'Talking', desc: 'Bold uppercase with a highlight word.', variation: false, sample: 'BRAND CAPTIONS', fonts: 'condensed_mono' },
  { id: 'creatorpill', name: 'Creator Pill', cat: 'Talking', desc: 'White pill caption for talking heads.', variation: false, sample: 'creator pill', fonts: 'sans_serif' }
];

const FONT_STACKS = {
  sans_serif: { primary: '900', secondary: '400 italic' },
  condensed_mono: { primary: '900', secondary: '700' },
  editorial_display: { primary: '700', secondary: '400 italic' },
  lowercase_brat: { primary: '900', secondary: '900' }
};

const DEFAULT_LYRICS = `Blame it all on you when the midnight city fades
I keep the headlights on the boulevard
Every red light feels like a downbeat
And I don't wanna come down yet
Say it like you mean it one more time
We were never good at goodbyes
So run it back, run it back tonight
Midnight atari, burning in the rain`;

const DEFAULT_TALKING = `Stop spending ten hours editing talking head videos by hand
This panel cuts your dead air in one pass
Then it syncs kinetic captions to every phrase
No plugins, no subscriptions, no Studio license
Download the bridge and run it inside Resolve Free`;

const DEFAULT_SILENCE_SEGMENTS = [
  { id: 1, start: 0.0, end: 4.6, amp: 0.62, text: 'Stop spending ten hours editing' },
  { id: 2, start: 4.6, end: 6.4, amp: 0.05, text: '[room tone]' },
  { id: 3, start: 6.4, end: 11.2, amp: 0.71, text: 'talking head videos by hand.' },
  { id: 4, start: 11.2, end: 13.0, amp: 0.04, text: '[dead air]' },
  { id: 5, start: 13.0, end: 17.8, amp: 0.66, text: 'This panel cuts your dead air' },
  { id: 6, start: 17.8, end: 19.1, amp: 0.06, text: '[breath]' },
  { id: 7, start: 19.1, end: 24.0, amp: 0.78, text: 'in one pass, then syncs captions.' },
  { id: 8, start: 24.0, end: 25.6, amp: 0.03, text: '[pause]' },
  { id: 9, start: 25.6, end: 31.2, amp: 0.58, text: 'No plugins, no subscriptions,' },
  { id: 10, start: 31.2, end: 33.0, amp: 0.05, text: '[room tone]' },
  { id: 11, start: 33.0, end: 36.0, amp: 0.69, text: 'no Studio license.' }
];

const MEDIA_POOL_BASE = [
  { id: 'A001', name: 'A001_C012_perf_85mm', bin: 'Performance', dur: 8.4, fps: 24, color: '#e11d48', tag: 'Performance' },
  { id: 'A002', name: 'A002_C003_perf_50mm', bin: 'Performance', dur: 6.2, fps: 24, color: '#be123c', tag: 'Performance' },
  { id: 'A003', name: 'A003_C019_perf_35mm', bin: 'Performance', dur: 11.0, fps: 24, color: '#f43f5e', tag: 'Performance' },
  { id: 'B001', name: 'B001_C004_rollers_night', bin: 'B-Roll', dur: 7.5, fps: 24, color: '#06b6d4', tag: 'B-Roll' },
  { id: 'B002', name: 'B002_C008_headlights', bin: 'B-Roll', dur: 5.6, fps: 24, color: '#0891b2', tag: 'B-Roll' },
  { id: 'B003', name: 'B003_C014_hallway', bin: 'B-Roll', dur: 9.2, fps: 24, color: '#22d3ee', tag: 'B-Roll' },
  { id: 'C001', name: 'C001_C001_talking_a_cam', bin: 'Talking Head', dur: 36.0, fps: 24, color: '#3b82f6', tag: 'Talking Head' },
  { id: 'C002', name: 'C002_C002_talking_b_cam', bin: 'Talking Head', dur: 34.0, fps: 24, color: '#2563eb', tag: 'Talking Head' },
  { id: 'D001', name: 'midnight_atari_master.wav', bin: 'Audio', dur: 32.0, fps: 24, color: '#10b981', tag: 'Audio' },
  { id: 'D002', name: 'roomtone_apt_48k.wav', bin: 'Audio', dur: 60.0, fps: 24, color: '#059669', tag: 'Audio' }
];

/* ============================================================================
   3. STATE
   ========================================================================== */

const state = {
  tab: 'vfx',
  vfxCategory: 'ALL',
  vfxSearch: '',
  selectedVfx: VFX_PRESETS[0],
  appliedVfx: [{ preset: '2383 Print Halation', t: 0.4, dur: 3.2 }],
  intensity: 0.72,
  bpm: 138,
  shutter: 270,
  bloom: 0.65,
  scene: 'music_video',
  userVideo: null,
  userImage: null,
  lyricsText: DEFAULT_LYRICS,
  lyricPreset: LYRC_PRESETS[0],
  lyricCategory: 'ALL',
  variationSeed: 1,
  favorites: new Set(['duet', 'tiledwave', 'deepfocus']),
  fontPair: 'sans_serif',
  align: 'center',
  backdrop: 'auto',
  fontSize: 1.05,
  posY: 0.52,
  primaryColor: '#ffffff',
  accentColor: '#ef4444',
  cues: [],
  currentTime: 2.94,
  duration: 16,
  playing: true,
  aspectGuide: false,
  compare: false,
  selectedCue: 0,
  silenceGate: -32,
  silenceMinMs: 300,
  silencePadMs: 60,
  autoReframe: true,
  jcut: true,
  segments: JSON.parse(JSON.stringify(DEFAULT_SILENCE_SEGMENTS)),
  cutOverrides: {},
  mediaPool: JSON.parse(JSON.stringify(MEDIA_POOL_BASE)),
  poolBin: 'ALL',
  director: 'music_video',
  mvPacing: '2',
  mvVfx: 'drill',
  vlogBroll: 'every_2',
  vlogPolish: 'full',
  timelineTitle: 'MASTER_EDIT_2398fps',
  luaSnippet: '-- Awaiting first dispatch'
};

/* Cue sheet — 8 phrases over 16s, weighted by word count */
function rebuildCues() {
  const lines = state.lyricsText.split('\n').map((l) => l.trim()).filter(Boolean);
  const totalWords = lines.reduce((n, l) => n + l.split(/\s+/).length, 0) || 1;
  let cursor = 0;
  state.cues = lines.map((text, i) => {
    const words = text.split(/\s+/).length;
    const span = Math.max(0.9, (words / totalWords) * state.duration);
    const cue = { index: i, text, start: cursor, end: Math.min(state.duration, cursor + span) };
    cursor += span;
    return cue;
  });
  if (state.cues.length) {
    const scale = state.duration / (state.cues[state.cues.length - 1].end || 1);
    state.cues.forEach((c) => {
      c.start *= scale;
      c.end = Math.min(state.duration, c.end * scale);
    });
  }
  state.duration = 16;
}
rebuildCues();

/* ============================================================================
   4. CANVAS BUFFERS & PROCEDURAL PLATES
   ========================================================================== */

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

const VIEW = { w: 720, h: 405 };
const mainCanvas = $('livePreviewCanvas');
const mainCtx = mainCanvas.getContext('2d', { alpha: false });

const envCanvas = makeCanvas(VIEW.w, VIEW.h);
const envCtx = envCanvas.getContext('2d');
const subjCanvas = makeCanvas(VIEW.w, VIEW.h);
const subjCtx = subjCanvas.getContext('2d');
const plateCanvas = makeCanvas(VIEW.w, VIEW.h);
const plateCtx = plateCanvas.getContext('2d');
const snapCanvas = makeCanvas(VIEW.w, VIEW.h);
const snapCtx = snapCanvas.getContext('2d');
const workCanvas = makeCanvas(VIEW.w / 2, VIEW.h / 2);
const workCtx = workCanvas.getContext('2d');
const trailCanvas = makeCanvas(VIEW.w, VIEW.h);
const trailCtx = trailCanvas.getContext('2d');
const prevCanvas = makeCanvas(VIEW.w, VIEW.h);
const prevCtx = prevCanvas.getContext('2d');
let prevFrameValid = false;

let grainTile = null;
let scanTile = null;
let ditherTile = null;

// Reused scratch buffers — allocating canvases per frame causes GC hitches
// during playback, especially once blur filters are involved.
const maskCanvas = makeCanvas(VIEW.w / 2, VIEW.h / 2);
const maskCtx = maskCanvas.getContext('2d');
const patternCache = new WeakMap();

function cachedPattern(ctx, tile) {
  let entry = patternCache.get(ctx);
  if (!entry) {
    entry = new Map();
    patternCache.set(ctx, entry);
  }
  if (!entry.has(tile)) entry.set(tile, ctx.createPattern(tile, 'repeat'));
  return entry.get(tile);
}

function buildTiles() {
  grainTile = makeCanvas(160, 160);
  const g = grainTile.getContext('2d');
  const img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);

  scanTile = makeCanvas(4, 4);
  const s = scanTile.getContext('2d');
  s.fillStyle = 'rgba(0,0,0,0.55)';
  s.fillRect(0, 0, 4, 2);
  s.fillStyle = 'rgba(255,255,255,0.06)';
  s.fillRect(0, 2, 4, 1);

  ditherTile = makeCanvas(4, 4);
  const d = ditherTile.getContext('2d');
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const v = bayer[y * 4 + x] * 16;
      d.fillStyle = `rgb(${v},${v},${v})`;
      d.fillRect(x, y, 1, 1);
    }
  }
}
buildTiles();

function bokeh(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(0.55, color);
  g.addColorStop(0.86, color.replace(/[\d.]+\)$/, '0.18)'));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/* ----------------------------------------------------------------------------
   Procedural plates — layered photographic environments (background layer)
   -------------------------------------------------------------------------- */

function softLight(ctx, x, y, r, inner, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(0.45, inner.replace(/[\d.]+\)$/, `${Math.max(0, alpha * 0.45).toFixed(3)})`));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

function ledTube(ctx, x, yTop, yBot, width, color, intensity) {
  const g = ctx.createLinearGradient(x - width, 0, x + width, 0);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.34, color.replace('ALPHA', (0.06 * intensity).toFixed(3)));
  g.addColorStop(0.5, color.replace('ALPHA', (0.95 * intensity).toFixed(3)));
  g.addColorStop(0.66, color.replace('ALPHA', (0.06 * intensity).toFixed(3)));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = g;
  ctx.fillRect(x - width, yTop, width * 2, yBot - yTop);
  const core = ctx.createLinearGradient(x - 1.8, 0, x + 1.8, 0);
  core.addColorStop(0, 'rgba(255,255,255,0)');
  core.addColorStop(0.5, `rgba(255,255,255,${Math.min(1, 0.95 * intensity)})`);
  core.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = core;
  ctx.fillRect(x - 2.2, yTop, 4.4, yBot - yTop);
  ctx.restore();
}

function hazeShaft(ctx, w, h, x1, x2, spread, tilt, alpha) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.filter = 'blur(12px)';
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, `rgba(255,226,196,${alpha})`);
  g.addColorStop(0.55, `rgba(255,205,170,${alpha * 0.45})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x1, 0);
  ctx.lineTo(x1 + spread, 0);
  ctx.lineTo(x2 + spread + tilt, h);
  ctx.lineTo(x2 + tilt, h);
  ctx.closePath();
  ctx.fill();
  ctx.filter = 'none';
  ctx.restore();
}

function drawEnvironment(ctx, w, h, t, scene) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  if (scene === 'night_rollers') {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    sky.addColorStop(0, '#05060f');
    sky.addColorStop(0.55, '#0a0b18');
    sky.addColorStop(1, '#1b1020');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.62);

    // distant city glow
    softLight(ctx, w * 0.78, h * 0.42, w * 0.5, 'rgba(255,120,70,0.35)', 0.5);
    softLight(ctx, w * 0.2, h * 0.4, w * 0.42, 'rgba(60,120,180,0.4)', 0.28);

    // skyline layers
    for (let layer = 0; layer < 2; layer++) {
      const baseY = h * (0.42 + layer * 0.06);
      const dark = layer === 0 ? '#080a14' : '#04050a';
      for (let i = 0; i < 22; i++) {
        const bw = 18 + hash(i * 3.1 + layer * 9) * 44;
        const bh = 14 + hash(i * 7.7 + layer * 5) * (layer ? 60 : 40);
        const bx = ((i / 22) * 1.2 - 0.1) * w + layer * 12;
        ctx.fillStyle = dark;
        ctx.fillRect(bx, baseY - bh, bw, bh + h * 0.2);
        if (layer === 0) {
          for (let wy = baseY - bh + 4; wy < baseY - 3; wy += 6) {
            for (let wx = bx + 3; wx < bx + bw - 4; wx += 5) {
              if (hash(wx * 0.7 + wy * 1.3 + i) > 0.78) {
                ctx.fillStyle = hash(wx + wy) > 0.45 ? 'rgba(255,186,110,0.5)' : 'rgba(130,190,255,0.32)';
                ctx.fillRect(wx, wy, 1.6, 1.6);
              }
            }
          }
          ctx.fillStyle = dark;
        }
      }
    }

    // road with strong perspective
    const road = ctx.createLinearGradient(0, h * 0.52, 0, h);
    road.addColorStop(0, '#141019');
    road.addColorStop(0.3, '#1a1420');
    road.addColorStop(1, '#04040a');
    ctx.fillStyle = road;
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - 30, h * 0.52);
    ctx.lineTo(w * 0.5 + 30, h * 0.52);
    ctx.lineTo(w * 1.3, h);
    ctx.lineTo(-w * 0.3, h);
    ctx.closePath();
    ctx.fill();

    // lane dashes, exponential spacing
    for (let i = 0; i < 10; i++) {
      const p = (i / 10 + (t * 0.5) % (1 / 10)) % 1;
      const y = h * 0.53 + Math.pow(p, 2.4) * h * 0.47;
      const scale = 0.18 + p * 3.4;
      ctx.fillStyle = `rgba(230,226,210,${0.06 + p * 0.32})`;
      ctx.fillRect(w * 0.5 - 1.5 * scale, y, 3 * scale, 6 * scale);
    }

    // wet road reflections
    for (let i = 0; i < 22; i++) {
      const x = hash(i * 3.7) * w;
      const p = hash(i * 9.1);
      const y = h * (0.62 + p * 0.4);
      const len = 8 + p * 60;
      const g = ctx.createLinearGradient(x, y, x, y + len);
      const warm = hash(i * 2.2) > 0.4;
      g.addColorStop(0, warm ? 'rgba(255,140,80,0.2)' : 'rgba(90,150,220,0.16)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, 1.5 + hash(i) * 3, len);
    }

    // oncoming headlights / practicals with anamorphic streaks
    for (let i = 0; i < 6; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const p = ((i / 6) + (t * 0.1) % 1) % 1;
      const y = h * 0.48 + Math.pow(p, 2.1) * h * 0.55;
      const x = w * 0.5 + side * (w * 0.05 + p * w * 0.5);
      const r = 3 + p * 14;
      bokeh(ctx, x, y, r, 'rgba(255,206,150,1)', 0.28 + p * 0.35);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const streak = ctx.createLinearGradient(x - r * 5, y, x + r * 5, y);
      streak.addColorStop(0, 'rgba(255,170,90,0)');
      streak.addColorStop(0.5, `rgba(255,200,140,${0.12 + p * 0.14})`);
      streak.addColorStop(1, 'rgba(255,170,90,0)');
      ctx.fillStyle = streak;
      ctx.fillRect(x - r * 5, y - 0.9, r * 10, 1.8);
      ctx.restore();
    }

    // windscreen flare + subtle dirt
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const flare = ctx.createRadialGradient(w * 0.2, h * 0.14, 2, w * 0.2, h * 0.14, w * 0.3);
    flare.addColorStop(0, 'rgba(120,190,255,0.2)');
    flare.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = flare;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    ctx.restore();
    return;
  }

  if (scene === 'talking_head') {
    const wall = ctx.createLinearGradient(0, 0, w, h);
    wall.addColorStop(0, '#20140f');
    wall.addColorStop(0.42, '#2a1b13');
    wall.addColorStop(0.72, '#150e0b');
    wall.addColorStop(1, '#090606');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, w, h);

    // window softbox
    const winX = w * 0.665;
    const winY = h * 0.02;
    const winW = w * 0.38;
    const winH = h * 0.68;
    softLight(ctx, winX + winW * 0.45, winY + winH * 0.45, winW * 1.05, 'rgba(180,214,255,0.55)', 0.5);

    ctx.fillStyle = 'rgba(196,220,255,0.22)';
    ctx.fillRect(winX, winY, winW, winH);
    // window frame
    ctx.fillStyle = '#0b0d12';
    ctx.fillRect(winX - 8, winY - 8, 8, winH + 16);
    ctx.fillRect(winX + winW, winY - 8, 8, winH + 16);
    ctx.fillRect(winX - 8, winY - 8, winW + 16, 8);
    ctx.fillRect(winX - 8, winY + winH, winW + 16, 8);
    ctx.fillRect(winX + winW * 0.48, winY, 6, winH);
    for (let i = 1; i < 4; i++) {
      ctx.fillRect(winX, winY + (i / 4) * winH, winW, 5);
    }
    // blown highlight on the glass edge
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(215,235,255,0.2)';
    ctx.fillRect(winX, winY, winW * 0.18, winH);
    ctx.restore();

    // wall shelf, camera left
    ctx.fillStyle = 'rgba(6,5,5,0.75)';
    ctx.fillRect(w * 0.02, h * 0.3, w * 0.22, h * 0.026);
    for (let i = 0; i < 6; i++) {
      const bw = 5 + hash(i * 3.3) * 4;
      const bh = h * (0.06 + hash(i * 7.1) * 0.05);
      ctx.fillStyle = `rgba(${120 + i * 10},${70 + i * 6},${44 + i * 5},0.5)`;
      ctx.fillRect(w * 0.035 + i * 9, h * 0.3 - bh, bw, bh);
    }
    // framed print
    ctx.strokeStyle = 'rgba(10,8,7,0.9)';
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.26, h * 0.16, w * 0.1, h * 0.12);
    ctx.fillStyle = 'rgba(60,45,38,0.5)';
    ctx.fillRect(w * 0.26, h * 0.16, w * 0.1, h * 0.12);

    // desk surface
    const desk = ctx.createLinearGradient(0, h * 0.79, 0, h);
    desk.addColorStop(0, '#33221a');
    desk.addColorStop(0.4, '#221710');
    desk.addColorStop(1, '#0a0705');
    ctx.fillStyle = desk;
    ctx.fillRect(0, h * 0.79, w, h * 0.21);
    ctx.fillStyle = 'rgba(255,190,130,0.08)';
    ctx.fillRect(0, h * 0.79, w, 1.5);

    // warm practical lamp, far left
    const lampX = w * 0.075;
    const lampY = h * 0.34;
    softLight(ctx, lampX, lampY, w * 0.3, 'rgba(255,168,96,0.65)', 0.5);
    ctx.fillStyle = 'rgba(255,214,160,0.9)';
    ctx.beginPath();
    ctx.arc(lampX, lampY, 3.4, 0, TAU);
    ctx.fill();

    // studio monitor just behind camera-right shoulder
    ctx.fillStyle = '#07080b';
    ctx.fillRect(w * 0.62, h * 0.52, w * 0.17, h * 0.24);
    ctx.fillStyle = '#0f1620';
    ctx.fillRect(w * 0.628, h * 0.53, w * 0.154, h * 0.2);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const screenGlow = ctx.createLinearGradient(w * 0.63, h * 0.53, w * 0.78, h * 0.73);
    screenGlow.addColorStop(0, 'rgba(90,140,200,0.22)');
    screenGlow.addColorStop(1, 'rgba(30,50,80,0.05)');
    ctx.fillStyle = screenGlow;
    ctx.fillRect(w * 0.628, h * 0.53, w * 0.154, h * 0.2);
    ctx.restore();
    // desk plant silhouette
    ctx.strokeStyle = 'rgba(8,10,8,0.9)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(w * 0.9, h * 0.8);
      ctx.quadraticCurveTo(w * (0.88 + i * 0.012), h * (0.68 - i * 0.014), w * (0.85 + i * 0.024), h * (0.62 - i * 0.016));
      ctx.stroke();
    }

    // atmospheric gradient near the floor
    const floorHaze = ctx.createLinearGradient(0, h * 0.62, 0, h);
    floorHaze.addColorStop(0, 'rgba(0,0,0,0)');
    floorHaze.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = floorHaze;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    return;
  }

  if (scene === 'lyric_canvas') {
    const bg = ctx.createLinearGradient(0, 0, w * 0.4, h);
    bg.addColorStop(0, '#171512');
    bg.addColorStop(0.55, '#100f0e');
    bg.addColorStop(1, '#070708');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    softLight(ctx, w * 0.3, h * 0.3, w * 0.62, 'rgba(255,206,160,0.3)', 0.4);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    const cast = ctx.createLinearGradient(0, h * 0.66, 0, h);
    cast.addColorStop(0, 'rgba(0,0,0,0)');
    cast.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = cast;
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    ctx.restore();
    return;
  }

  /* --- default: music_video — stage practicals + haze --- */
  const bg = ctx.createLinearGradient(0, 0, w * 0.15, h);
  bg.addColorStop(0, '#060b10');
  bg.addColorStop(0.4, '#070c11');
  bg.addColorStop(0.72, '#05080c');
  bg.addColorStop(1, '#020305');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // deep background glow behind performer
  softLight(ctx, w * 0.6, h * 0.42, w * 0.5, 'rgba(255,120,60,0.28)', 0.42);
  softLight(ctx, w * 0.18, h * 0.3, w * 0.4, 'rgba(50,120,170,0.5)', 0.22);

  // vertical LED tubes at three depths
  const tubes = [
    { x: w * 0.14, top: h * 0.04, bot: h * 0.72, width: 8, color: 'rgba(90,180,255,ALPHA)', alpha: 0.8, drift: 0.1 },
    { x: w * 0.3, top: h * 0.0, bot: h * 0.78, width: 6, color: 'rgba(255,150,80,ALPHA)', alpha: 0.78, drift: 0.16 },
    { x: w * 0.82, top: h * 0.02, bot: h * 0.7, width: 10, color: 'rgba(255,120,60,ALPHA)', alpha: 1, drift: 0.08 },
    { x: w * 0.93, top: h * 0.1, bot: h * 0.66, width: 6, color: 'rgba(255,200,140,ALPHA)', alpha: 0.7, drift: 0.12 }
  ];
  tubes.forEach((tube, i) => {
    const flicker = 0.94 + Math.sin(t * (2.1 + i) + i) * 0.02 + Math.sin(t * 11 + i * 2) * 0.012;
    ledTube(ctx, tube.x + Math.sin(t * tube.drift + i) * 3, tube.top, tube.bot, tube.width, tube.color, tube.alpha * flicker);
    // floor reflection
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.28 * tube.alpha;
    ctx.filter = 'blur(6px)';
    const ref = ctx.createLinearGradient(0, h * 0.72, 0, h);
    ref.addColorStop(0, tube.color.replace('ALPHA', '0.5'));
    ref.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ref;
    ctx.fillRect(tube.x - tube.width * 2, h * 0.72, tube.width * 4, h * 0.28);
    ctx.filter = 'none';
    ctx.restore();
  });

  // in-frame practicals: bare bulbs that give the bloom something to grab
  const bulbs = [
    { x: w * 0.2, y: h * 0.16, r: 2.6, glow: 90, a: 0.95 },
    { x: w * 0.87, y: h * 0.22, r: 3.1, glow: 120, a: 1 },
    { x: w * 0.63, y: h * 0.1, r: 1.9, glow: 60, a: 0.8 }
  ];
  bulbs.forEach((b, i) => {
    const flick = 0.94 + Math.sin(t * (3.1 + i * 1.3) + i) * 0.04;
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.glow);
    g.addColorStop(0, `rgba(255,236,205,${0.9 * b.a * flick})`);
    g.addColorStop(0.06, `rgba(255,206,150,${0.5 * b.a * flick})`);
    g.addColorStop(0.3, `rgba(255,170,90,${0.12 * b.a * flick})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g;
    ctx.fillRect(b.x - b.glow, b.y - b.glow, b.glow * 2, b.glow * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.95 * b.a})`;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, TAU);
    ctx.fill();
    // filament wire
    ctx.strokeStyle = 'rgba(255,240,220,0.16)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(b.x, 0);
    ctx.lineTo(b.x, b.y - b.r);
    ctx.stroke();
    ctx.restore();
  });

  // hanging practicals / small bulbs in the back
  for (let i = 0; i < 12; i++) {
    const x = w * (0.05 + hash(i * 2.7) * 0.9);
    const y = h * (0.08 + hash(i * 5.3) * 0.34);
    const r = 1.6 + hash(i * 9.4) * 2.4;
    bokeh(ctx, x, y, r, 'rgba(255,204,150,0.95)', 0.34);
  }

  // haze shafts from stage right
  hazeShaft(ctx, w, h, w * 0.6, w * 0.46, w * 0.2, w * 0.1, 0.1);
  hazeShaft(ctx, w, h, w * 0.72, w * 0.6, w * 0.14, w * 0.06, 0.06);

  // floor
  const floor = ctx.createLinearGradient(0, h * 0.7, 0, h);
  floor.addColorStop(0, 'rgba(8,11,15,0.92)');
  floor.addColorStop(0.45, 'rgba(6,8,11,0.98)');
  floor.addColorStop(1, '#010203');
  ctx.fillStyle = floor;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);

  // foreground bokeh / dust on the lens
  const dust = [
    [w * 0.06, h * 0.2, 30, 'rgba(255,140,90,0.5)'],
    [w * 0.96, h * 0.3, 48, 'rgba(255,110,60,0.35)'],
    [w * 0.86, h * 0.66, 22, 'rgba(120,190,255,0.22)']
  ];
  dust.forEach(([x, y, r, c], i) => {
    bokeh(ctx, x + Math.sin(t * 0.27 + i) * 5, y + Math.cos(t * 0.21 + i) * 4, r, c, 0.42);
  });

  // subtle atmospheric veil toward the bottom left
  const veil = ctx.createLinearGradient(0, h, w * 0.7, 0);
  veil.addColorStop(0, 'rgba(20,30,40,0.18)');
  veil.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();
}

/* ----------------------------------------------------------------------------
   Subject layer — performer / presenter with rim light and cloth shading
   -------------------------------------------------------------------------- */

function drawSubject(ctx, w, h, t, scene) {
  if (scene === 'night_rollers' || scene === 'lyric_canvas') return;
  ctx.save();

  if (scene === 'talking_head') {
    const cx = w * 0.46;
    const bob = Math.sin(t * 1.05) * 1.4;
    const headY = h * 0.35 + bob;
    const headR = h * 0.108;

    // shoulders / jumper
    const body = ctx.createLinearGradient(cx - headR * 3, h, cx + headR * 3, h * 0.55);
    body.addColorStop(0, '#0a0807');
    body.addColorStop(0.55, '#141010');
    body.addColorStop(1, '#060505');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(cx - headR * 3.0, h);
    ctx.bezierCurveTo(cx - headR * 2.95, headY + headR * 2.55, cx - headR * 1.6, headY + headR * 1.42, cx - headR * 0.42, headY + headR * 0.94);
    ctx.bezierCurveTo(cx + headR * 0.6, headY + headR * 1.0, cx + headR * 2.75, headY + headR * 2.35, cx + headR * 3.0, h);
    ctx.closePath();
    ctx.fill();

    // neck
    const neck = ctx.createLinearGradient(cx - headR * 0.5, headY, cx + headR * 0.5, headY + headR);
    neck.addColorStop(0, '#0d0908');
    neck.addColorStop(1, '#181110');
    ctx.fillStyle = neck;
    ctx.fillRect(cx - headR * 0.36, headY + headR * 0.62, headR * 0.72, headR * 0.72);

    // head with warm skin gradient, narrow jaw
    const skin = ctx.createRadialGradient(cx + headR * 0.22, headY - headR * 0.3, headR * 0.08, cx, headY, headR * 1.2);
    skin.addColorStop(0, '#4a362b');
    skin.addColorStop(0.42, '#2c1f18');
    skin.addColorStop(1, '#0b0706');
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.moveTo(cx - headR * 0.78, headY - headR * 0.22);
    ctx.bezierCurveTo(cx - headR * 0.8, headY - headR * 0.95, cx + headR * 0.78, headY - headR * 0.95, cx + headR * 0.78, headY - headR * 0.18);
    ctx.bezierCurveTo(cx + headR * 0.76, headY + headR * 0.5, cx + headR * 0.34, headY + headR * 0.92, cx + headR * 0.04, headY + headR * 0.95);
    ctx.bezierCurveTo(cx - headR * 0.3, headY + headR * 0.92, cx - headR * 0.72, headY + headR * 0.46, cx - headR * 0.78, headY - headR * 0.22);
    ctx.closePath();
    ctx.fill();

    // ear + jaw read
    ctx.fillStyle = 'rgba(10,7,6,0.85)';
    ctx.beginPath();
    ctx.ellipse(cx - headR * 0.72, headY + headR * 0.02, headR * 0.13, headR * 0.2, 0.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = headR * 0.06;
    ctx.beginPath();
    ctx.moveTo(cx + headR * 0.5, headY - headR * 0.2);
    ctx.quadraticCurveTo(cx + headR * 0.62, headY + headR * 0.18, cx + headR * 0.24, headY + headR * 0.5);
    ctx.stroke();

    // hair: swept back, follows the skull rather than sitting on top of it
    ctx.fillStyle = '#0a0707';
    ctx.beginPath();
    ctx.moveTo(cx - headR * 0.8, headY - headR * 0.22);
    ctx.bezierCurveTo(cx - headR * 0.92, headY - headR * 1.02, cx + headR * 0.72, headY - headR * 1.05, cx + headR * 0.8, headY - headR * 0.34);
    ctx.bezierCurveTo(cx + headR * 0.82, headY - headR * 0.28, cx + headR * 0.7, headY - headR * 0.3, cx + headR * 0.62, headY - headR * 0.42);
    ctx.bezierCurveTo(cx + headR * 0.2, headY - headR * 0.84, cx - headR * 0.5, headY - headR * 0.82, cx - headR * 0.62, headY - headR * 0.3);
    ctx.closePath();
    ctx.fill();
    // sideburn / hair falling past the ear
    ctx.beginPath();
    ctx.moveTo(cx - headR * 0.8, headY - headR * 0.24);
    ctx.quadraticCurveTo(cx - headR * 0.98, headY + headR * 0.3, cx - headR * 0.74, headY + headR * 0.78);
    ctx.quadraticCurveTo(cx - headR * 0.6, headY + headR * 0.2, cx - headR * 0.62, headY - headR * 0.26);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = 'screen';

    // cool window rim on the right side of the face
    const rim = ctx.createLinearGradient(cx + headR * 0.15, 0, cx + headR * 1.1, 0);
    rim.addColorStop(0, 'rgba(160,200,255,0)');
    rim.addColorStop(0.72, 'rgba(180,215,255,0.5)');
    rim.addColorStop(1, 'rgba(220,238,255,0.06)');
    ctx.strokeStyle = rim;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(cx + headR * 0.2, headY - headR * 0.86);
    ctx.bezierCurveTo(cx + headR * 0.84, headY - headR * 0.7, cx + headR * 0.86, headY + headR * 0.2, cx + headR * 0.5, headY + headR * 0.62);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(150,195,250,0.14)';
    ctx.lineWidth = 7;
    ctx.stroke();

    // warm lamp fill on the left cheek
    const fill = ctx.createLinearGradient(cx - headR * 1.0, 0, cx - headR * 0.1, 0);
    fill.addColorStop(0, 'rgba(255,170,100,0.34)');
    fill.addColorStop(1, 'rgba(255,170,100,0)');
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(cx - headR * 0.78, headY - headR * 0.2);
    ctx.bezierCurveTo(cx - headR * 0.8, headY - headR * 0.95, cx + headR * 0.4, headY - headR * 0.9, cx + headR * 0.4, headY - headR * 0.2);
    ctx.bezierCurveTo(cx + headR * 0.4, headY + headR * 0.5, cx - headR * 0.3, headY + headR * 0.9, cx - headR * 0.3, headY + headR * 0.9);
    ctx.closePath();
    ctx.fill();

    // shoulder rim
    ctx.strokeStyle = 'rgba(170,205,250,0.2)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx + headR * 1.5, headY + headR * 1.35);
    ctx.bezierCurveTo(cx + headR * 2.2, headY + headR * 2.2, cx + headR * 2.6, h * 0.9, cx + headR * 2.85, h);
    ctx.stroke();
    ctx.restore();
    return;
  }

  /* performer silhouette, chest-up framing */
  const cx = w * 0.46;
  const sway = Math.sin(t * 1.2) * 3.2;
  const headY = h * 0.36 + Math.sin(t * 1.55) * 2.2;
  const headR = h * 0.092;

  const body = ctx.createLinearGradient(cx - headR * 2.5, h, cx + headR * 2.6, h * 0.6);
  body.addColorStop(0, '#03070a');
  body.addColorStop(0.55, '#060c11');
  body.addColorStop(1, '#020406');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(cx - headR * 2.9 + sway, h);
  ctx.bezierCurveTo(cx - headR * 2.6 + sway, headY + headR * 2.3, cx - headR * 1.2 + sway, headY + headR * 1.02, cx + sway, headY + headR * 0.9);
  ctx.bezierCurveTo(cx + headR * 1.25 + sway, headY + headR * 1.02, cx + headR * 2.55 + sway, headY + headR * 2.2, cx + headR * 3.0 + sway, h);
  ctx.closePath();
  ctx.fill();

  // neck
  ctx.fillStyle = '#04080b';
  ctx.fillRect(cx + sway - headR * 0.32, headY + headR * 0.55, headR * 0.64, headR * 0.65);

  // head + hair
  ctx.fillStyle = '#050a0e';
  ctx.beginPath();
  ctx.ellipse(cx + sway, headY, headR * 0.8, headR * 1.06, 0.05, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + sway, headY - headR * 0.6, headR * 0.94, headR * 0.66, 0.02, 0, TAU);
  ctx.fill();

  // shirt highlight / fabric fold
  ctx.globalCompositeOperation = 'screen';
  const cloth = ctx.createLinearGradient(cx + headR * 1.2, headY, cx + headR * 2.2, h);
  cloth.addColorStop(0, 'rgba(90,140,170,0.16)');
  cloth.addColorStop(0.5, 'rgba(60,100,130,0.06)');
  cloth.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cloth;
  ctx.beginPath();
  ctx.moveTo(cx + headR * 1.2 + sway, headY + headR * 1.15);
  ctx.bezierCurveTo(cx + headR * 2.0 + sway, headY + headR * 2.1, cx + headR * 2.4 + sway, h * 0.9, cx + headR * 2.6 + sway, h);
  ctx.lineTo(cx + headR * 1.4 + sway, h);
  ctx.closePath();
  ctx.fill();

  // warm rim from the practical behind camera right
  const rim = ctx.createLinearGradient(cx + headR * 0.25, 0, cx + headR * 1.22, 0);
  rim.addColorStop(0, 'rgba(255,120,70,0)');
  rim.addColorStop(0.62, 'rgba(255,138,84,0.55)');
  rim.addColorStop(1, 'rgba(255,196,140,0.08)');
  ctx.strokeStyle = rim;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(cx + sway, headY, headR * 0.8, headR * 1.06, 0.05, -1.2, 1.3);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,130,80,0.2)';
  ctx.lineWidth = 7;
  ctx.stroke();

  // cool fill on the left edge
  const cool = ctx.createLinearGradient(cx - headR * 1.0, 0, cx - headR * 0.3, 0);
  cool.addColorStop(0, 'rgba(120,190,255,0.3)');
  cool.addColorStop(1, 'rgba(120,190,255,0)');
  ctx.fillStyle = cool;
  ctx.beginPath();
  ctx.ellipse(cx + sway, headY, headR * 0.8, headR * 1.06, 0.05, 0, TAU);
  ctx.fill();

  // shoulder rim
  ctx.strokeStyle = 'rgba(255,150,100,0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + headR * 1.45 + sway, headY + headR * 1.4);
  ctx.bezierCurveTo(cx + headR * 2.1 + sway, headY + headR * 2.3, cx + headR * 2.55 + sway, h * 0.88, cx + headR * 2.85 + sway, h);
  ctx.stroke();

  ctx.restore();
}

/* ============================================================================
   5. RENDER CONFIG — time remap + camera rig physics
   ========================================================================== */

function beatPhase(t, bpm = state.bpm, division = 1) {
  const p = (t * (bpm / 60)) / division;
  return p - Math.floor(p);
}

function impulse(t, bpm = state.bpm, decay = 9) {
  return Math.exp(-beatPhase(t, bpm) * decay);
}

function computeRenderConfig(t, effects, amt) {
  const cfg = {
    time: t,
    scale: 1.06,
    rot: 0,
    dx: 0,
    dy: 0,
    blur: 0,
    lockSubject: false,
    addSpin: 0,
    wave: 0
  };

  if (effects.includes('stepPrint')) cfg.time = Math.floor(t * 6) / 6;
  if (effects.includes('timeSlice')) cfg.time = Math.floor(t * 3) / 3;
  if (effects.includes('speedRamp')) cfg.time = t + 0.34 * Math.sin(t * 0.85) + 0.12 * Math.sin(t * 2.3);
  if (effects.includes('reverseRamp')) {
    const swing = Math.max(0, Math.sin(t * 0.9));
    cfg.time = t - 0.62 * Math.pow(swing, 2.4);
  }
  if (effects.includes('handheld')) {
    const a = 3 + amt * 7;
    cfg.dx += (Math.sin(t * 0.9) * 0.55 + Math.sin(t * 2.3) * 0.2) * a;
    cfg.dy += (Math.cos(t * 0.7) * 0.5 + Math.sin(t * 1.9) * 0.18) * a;
    cfg.rot += Math.sin(t * 0.45) * 0.0022 * (0.5 + amt);
  }
  if (effects.includes('steadicam')) {
    cfg.scale += 0.045;
    cfg.dx += Math.sin(t * 0.42) * 12;
    cfg.dy += Math.cos(t * 0.31) * 6;
    cfg.rot += Math.sin(t * 0.24) * 0.003;
  }
  if (effects.includes('snorricam')) {
    cfg.scale = 1.22;
    cfg.rot = Math.sin(t * 1.55) * (0.035 + amt * 0.03);
    cfg.dx = Math.sin(t * 2.1) * (10 + amt * 14);
    cfg.dy = Math.cos(t * 1.65) * (7 + amt * 8);
    cfg.lockSubject = true;
  }
  if (effects.includes('dollyZoom')) {
    cfg.scale += Math.sin(t * 0.8) * 0.14;
  }
  if (effects.includes('crashZoom')) {
    cfg.scale += 0.3 * impulse(t, state.bpm, 12) * (0.4 + amt);
  }
  if (effects.includes('matchZoom')) {
    cfg.scale += 0.26 * (1 - Math.min(1, beatPhase(t, state.bpm, 2) * 6));
  }
  if (effects.includes('focusRack')) {
    cfg.blur = Math.pow(Math.sin(t * 0.62) * 0.5 + 0.5, 2.6) * 3.4 * (0.5 + amt);
  }
  if (effects.includes('probe')) {
    cfg.scale = 1.42 + Math.sin(t * 0.3) * 0.04;
    cfg.dx += Math.sin(t * 0.22) * 16;
    cfg.blur = 1.1;
  }
  if (effects.includes('zoomPunch')) {
    cfg.scale += 0.045 * impulse(t, state.bpm, 10) * (0.4 + amt);
  }
  if (effects.includes('whipPan')) {
    cfg.dx += Math.sin(t * 2.05) * 26 * (0.4 + amt);
    cfg.scale += 0.08;
  }
  if (effects.includes('weave')) {
    cfg.dx += Math.sin(t * 9.7) * 0.7 * (0.4 + amt);
    cfg.dy += Math.cos(t * 7.3) * 0.5 * (0.4 + amt);
    cfg.rot += Math.sin(t * 5.1) * 0.0006 * (0.4 + amt);
  }
  return cfg;
}

function renderPlate(rt, cfg) {
  envCtx.clearRect(0, 0, VIEW.w, VIEW.h);
  const media = state.userImage || state.userVideo;
  const mediaW = state.userImage ? state.userImage.naturalWidth : (state.userVideo ? state.userVideo.videoWidth : 0);
  const mediaH = state.userImage ? state.userImage.naturalHeight : (state.userVideo ? state.userVideo.videoHeight : 0);
  const mediaReady = state.userImage ? state.userImage.complete : (state.userVideo && state.userVideo.readyState >= 2);
  if (state.scene === 'upload' && media && mediaReady && mediaW && mediaH) {
    const scale = Math.max(VIEW.w / mediaW, VIEW.h / mediaH);
    const dw = mediaW * scale;
    const dh = mediaH * scale;
    envCtx.drawImage(media, (VIEW.w - dw) / 2, (VIEW.h - dh) / 2, dw, dh);
  } else {
    drawEnvironment(envCtx, VIEW.w, VIEW.h, rt, state.scene);
  }

  if (!cfg.lockSubject) {
    drawSubject(envCtx, VIEW.w, VIEW.h, rt, state.scene);
  }

  mainCtx.save();
  mainCtx.fillStyle = '#000';
  mainCtx.fillRect(0, 0, VIEW.w, VIEW.h);
  mainCtx.translate(VIEW.w / 2 + cfg.dx, VIEW.h / 2 + cfg.dy);
  mainCtx.rotate(cfg.rot);
  mainCtx.scale(cfg.scale, cfg.scale);
  if (cfg.blur > 0.15 && 'filter' in mainCtx) {
    mainCtx.filter = `blur(${cfg.blur.toFixed(2)}px)`;
  }
  mainCtx.drawImage(envCanvas, -VIEW.w / 2, -VIEW.h / 2, VIEW.w, VIEW.h);
  mainCtx.filter = 'none';
  mainCtx.restore();

  if (cfg.lockSubject) {
    subjCtx.clearRect(0, 0, VIEW.w, VIEW.h);
    drawSubject(subjCtx, VIEW.w, VIEW.h, rt, state.scene);
    mainCtx.save();
    mainCtx.translate(VIEW.w / 2, VIEW.h / 2);
    mainCtx.scale(1.0, 1.0);
    mainCtx.translate(-VIEW.w / 2, -VIEW.h / 2);
    mainCtx.drawImage(subjCanvas, 0, 0);
    mainCtx.restore();
  }
}

/* ============================================================================
   6. EFFECT LIBRARY
   ========================================================================== */

function snapshot() {
  snapCtx.clearRect(0, 0, VIEW.w, VIEW.h);
  snapCtx.drawImage(mainCanvas, 0, 0, VIEW.w, VIEW.h);
  return snapCanvas;
}

function tint(ctx, w, h, color, alpha, comp = 'soft-light') {
  ctx.save();
  ctx.globalCompositeOperation = comp;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

const hiCanvas = makeCanvas(VIEW.w / 2, VIEW.h / 2);
const hiCtx = hiCanvas.getContext('2d');
const hiBlurCanvas = makeCanvas(VIEW.w / 2, VIEW.h / 2);
const hiBlurCtx = hiBlurCanvas.getContext('2d');

/**
 * Isolate the top luminance range, tint it, and blur it. This is what makes
 * halation / streak bloom read as light spilling off a print stock instead of
 * a flat colour wash.
 */
function highlightPass(source, {
  threshold = 0.72,
  width = 0.2,
  color = '#ff4a1e',
  blur = 6,
  alpha = 0.6,
  stretchX = 1
} = {}) {
  // Map [threshold .. threshold+width] onto [0 .. 1] with a brightness +
  // contrast pair, so only genuine highlights survive the isolation.
  const lo = clamp(threshold, 0.02, 0.96);
  const hi = clamp(threshold + width, lo + 0.04, 1);
  const brightness = 1 / (lo + hi);
  const contrast = (lo + hi) / (hi - lo);

  hiCtx.clearRect(0, 0, hiCanvas.width, hiCanvas.height);
  hiCtx.filter = `grayscale(1) brightness(${brightness.toFixed(3)}) contrast(${contrast.toFixed(2)})`;
  hiCtx.drawImage(source, 0, 0, hiCanvas.width, hiCanvas.height);
  hiCtx.filter = 'none';
  // Tint by multiplication: black stays black (no highlight), white takes the
  // glow colour. Alpha isolation cannot work here because the plate is opaque.
  hiCtx.globalCompositeOperation = 'multiply';
  hiCtx.fillStyle = color;
  hiCtx.fillRect(0, 0, hiCanvas.width, hiCanvas.height);
  hiCtx.globalCompositeOperation = 'source-over';

  hiBlurCtx.clearRect(0, 0, hiBlurCanvas.width, hiBlurCanvas.height);
  hiBlurCtx.filter = `blur(${blur}px)`;
  hiBlurCtx.drawImage(hiCanvas, 0, 0);
  hiBlurCtx.filter = 'none';

  return { canvas: hiBlurCanvas, alpha, stretchX };
}

function screenPass(ctx, pass, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = pass.alpha;
  const sx = pass.stretchX || 1;
  ctx.drawImage(pass.canvas, -(w * (sx - 1)) / 2, 0, w * sx, h);
  ctx.restore();
}

function gradePass(ctx, w, h, drawFn) {
  const snap = snapshot();
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  drawFn(snap);
  ctx.restore();
}

const SHADERS = {
  print2383(ctx, w, h, t, amt) {
    // Print curve: deepen the toe, protect the shoulder, keep colour density.
    gradePass(ctx, w, h, (snap) => {
      ctx.filter = `contrast(${1 + amt * 0.12}) saturate(${1 + amt * 0.1}) brightness(${1 + amt * 0.06})`;
      ctx.drawImage(snap, 0, 0);
      ctx.filter = 'none';
    });
    tint(ctx, w, h, '#ff9c52', 0.035 * amt, 'screen');
    tint(ctx, w, h, '#0a2430', 0.12 * amt, 'multiply');
    // gentle highlight shoulder so faces do not clip
    screenPass(ctx, highlightPass(snapshot(), {
      threshold: 0.82, width: 0.18, color: '#ffd9b0', blur: 18, alpha: 0.05 + amt * 0.05
    }), w, h);
  },

  halation(ctx, w, h, t, amt) {
    const snap = snapshot();
    screenPass(ctx, highlightPass(snap, {
      threshold: 0.62,
      width: 0.16,
      color: '#ff4a1a',
      blur: 3,
      alpha: 0.26 + amt * 0.26
    }), w, h);
    screenPass(ctx, highlightPass(snap, {
      threshold: 0.76,
      width: 0.2,
      color: '#ffbe86',
      blur: 10,
      alpha: 0.12 + amt * 0.14
    }), w, h);
  },

  anamorphic(ctx, w, h, t, amt) {
    const snap = snapshot();
    screenPass(ctx, highlightPass(snap, {
      threshold: 0.66,
      width: 0.16,
      color: '#2f7dff',
      blur: 2,
      alpha: 0.16 + amt * 0.18,
      stretchX: 1.1
    }), w, h);
    screenPass(ctx, highlightPass(snap, {
      threshold: 0.8,
      width: 0.18,
      color: '#9ccdff',
      blur: 12,
      alpha: 0.1 + amt * 0.12,
      stretchX: 1.26
    }), w, h);
    // anamorphic smear line at the strongest highlight row
    const y = h * (0.32 + Math.sin(t * 0.35) * 0.02);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createLinearGradient(0, y, w, y);
    g.addColorStop(0, 'rgba(60,130,255,0)');
    g.addColorStop(0.32, `rgba(110,180,255,${0.05 + amt * 0.06})`);
    g.addColorStop(0.5, `rgba(190,225,255,${0.09 + amt * 0.1})`);
    g.addColorStop(0.68, `rgba(110,180,255,${0.05 + amt * 0.06})`);
    g.addColorStop(1, 'rgba(60,130,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 0.7, w, 1.4);
    ctx.restore();
  },

  promist(ctx, w, h, t, amt) {
    const snap = snapshot();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.1 + amt * 0.18;
    ctx.filter = `blur(${8 + amt * 8}px) brightness(1.25)`;
    ctx.drawImage(snap, 0, 0);
    ctx.filter = 'none';
    ctx.restore();
    tint(ctx, w, h, '#fff3e0', 0.02 * amt, 'screen');
  },

  shallowDof(ctx, w, h, t, amt) {
    const snap = snapshot();
    const dof = workCanvas;
    workCtx.clearRect(0, 0, dof.width, dof.height);
    workCtx.filter = `blur(${2.5 + amt * 4}px)`;
    workCtx.drawImage(snap, 0, 0, dof.width, dof.height);
    workCtx.filter = 'none';

    // mask: keep centre sharp
    const mask = maskCanvas;
    const mc = maskCtx;
    mc.clearRect(0, 0, mask.width, mask.height);
    const g = mc.createRadialGradient(dof.width * 0.5, dof.height * 0.52, dof.width * 0.18, dof.width * 0.5, dof.height * 0.52, dof.width * 0.52);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.25)');
    g.addColorStop(1, 'rgba(0,0,0,0.95)');
    mc.fillStyle = g;
    mc.fillRect(0, 0, dof.width, dof.height);
    workCtx.globalCompositeOperation = 'destination-in';
    workCtx.drawImage(mask, 0, 0, dof.width, dof.height);
    workCtx.globalCompositeOperation = 'source-over';
    ctx.drawImage(dof, 0, 0, w, h);
  },

  largeFormat(ctx, w, h, t, amt) {
    const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.28, w / 2, h / 2, w * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${0.22 + amt * 0.2})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    tint(ctx, w, h, '#ffe6cc', 0.04 * amt, 'screen');
  },

  bleach(ctx, w, h, t, amt) {
    const snap = snapshot();
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.filter = `saturate(${1 - amt * 0.62}) contrast(${1 + amt * 0.34}) brightness(${1 + amt * 0.03})`;
    ctx.drawImage(snap, 0, 0);
    ctx.filter = 'none';
    ctx.restore();
    tint(ctx, w, h, '#dfe7ee', 0.05 * amt, 'screen');
  },

  tealOrange(ctx, w, h, t, amt) {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    const shade = ctx.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0, `rgba(255,150,70,${0.16 * amt})`);
    shade.addColorStop(0.55, 'rgba(0,0,0,0)');
    shade.addColorStop(1, `rgba(0,110,150,${0.24 * amt})`);
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    tint(ctx, w, h, '#0d3b4a', 0.06 * amt, 'multiply');
  },

  vision3(ctx, w, h, t, amt) {
    const snap = snapshot();
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.filter = `contrast(${1 + amt * 0.08}) saturate(${1 + amt * 0.05})`;
    ctx.drawImage(snap, 0, 0);
    ctx.filter = 'none';
    ctx.restore();
    tint(ctx, w, h, '#ffcf9c', 0.06 * amt, 'screen');
    tint(ctx, w, h, '#0a2b34', 0.1 * amt, 'multiply');
  },

  logWash(ctx, w, h, t, amt) {
    const snap = snapshot();
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.filter = `contrast(${1 - amt * 0.3}) saturate(${1 - amt * 0.45}) brightness(${1 + amt * 0.08})`;
    ctx.drawImage(snap, 0, 0);
    ctx.filter = 'none';
    ctx.restore();
    tint(ctx, w, h, '#7d8a90', 0.12 * amt, 'screen');
  },

  dense(ctx, w, h, t, amt) {
    const snap = snapshot();
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.filter = `contrast(${1 + amt * 0.36}) brightness(${1 - amt * 0.12}) saturate(${1 + amt * 0.1})`;
    ctx.drawImage(snap, 0, 0);
    ctx.filter = 'none';
    ctx.restore();
    tint(ctx, w, h, '#04070d', 0.12 * amt, 'multiply');
  },

  grain(ctx, w, h, t, amt) {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.025 + amt * 0.055;
    const ox = Math.floor(hash(Math.floor(t * 24)) * 160);
    const oy = Math.floor(hash(Math.floor(t * 24) + 7) * 160);
    const pattern = cachedPattern(ctx, grainTile);
    ctx.translate(-ox, -oy);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w + 160, h + 160);
    ctx.restore();
  },

  vignette(ctx, w, h, t, amt) {
    const g = ctx.createRadialGradient(w / 2, h * 0.48, w * 0.24, w / 2, h * 0.5, w * 0.74);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.62, `rgba(0,0,0,${0.1 * amt})`);
    g.addColorStop(1, `rgba(0,0,0,${0.42 + amt * 0.2})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  },

  shutter90(ctx, w, h, t, amt) {
    tint(ctx, w, h, '#ffffff', 0.02 * amt, 'screen');
  },

  shutterTrail(ctx, w, h, t, amt) {
    if (!prevFrameValid) {
      prevCtx.drawImage(mainCanvas, 0, 0);
      prevFrameValid = true;
      return;
    }
    ctx.save();
    ctx.globalAlpha = 0.22 + amt * 0.3;
    ctx.drawImage(prevCanvas, 0, 0);
    ctx.restore();
    prevCtx.clearRect(0, 0, w, h);
    prevCtx.drawImage(mainCanvas, 0, 0);
  },

  frameEcho(ctx, w, h, t, amt) {
    if (!prevFrameValid) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.12 + amt * 0.16;
    ctx.drawImage(prevCanvas, -2, 0);
    ctx.globalAlpha = 0.06 + amt * 0.08;
    ctx.drawImage(prevCanvas, -4, 0);
    ctx.restore();
  },

  pvm(ctx, w, h, t, amt) {
    const pattern = cachedPattern(ctx, scanTile);
    ctx.save();
    ctx.globalAlpha = 0.22 + amt * 0.22;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    // aperture grille
    ctx.globalAlpha = 0.06 + amt * 0.06;
    ctx.fillStyle = '#ff2a2a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2aff5a';
    ctx.globalAlpha = 0.035;
    ctx.fillRect(1, 0, w, h);
    ctx.fillStyle = '#2a5aff';
    ctx.globalAlpha = 0.035;
    ctx.fillRect(2, 0, w, h);
    ctx.restore();
  },

  splitDiopter(ctx, w, h, t, amt) {
    const snap = snapshot();
    // Only a narrow horizontal band goes soft, the way a screw-in diopter
    // holds two planes and lets the seam fall between them.
    workCtx.clearRect(0, 0, workCanvas.width, workCanvas.height);
    workCtx.filter = `blur(${2 + amt * 2.6}px)`;
    workCtx.drawImage(snap, 0, 0, workCanvas.width, workCanvas.height);
    workCtx.filter = 'none';
    const mask = maskCanvas;
    const mc = maskCtx;
    mc.clearRect(0, 0, mask.width, mask.height);
    const g = mc.createLinearGradient(0, 0, 0, workCanvas.height);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.28, 'rgba(0,0,0,0.85)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.95)');
    g.addColorStop(0.7, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    mc.fillStyle = g;
    mc.fillRect(0, 0, mask.width, mask.height);
    workCtx.globalCompositeOperation = 'destination-in';
    workCtx.drawImage(mask, 0, 0, workCanvas.width, workCanvas.height);
    workCtx.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.globalAlpha = 0.55 + amt * 0.3;
    ctx.drawImage(workCanvas, 0, 0, w, h);
    ctx.restore();

    // the diopter seam catches a faint flare line
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.05 + amt * 0.05;
    ctx.fillStyle = '#cfe2ff';
    ctx.fillRect(0, h * 0.5 - 0.6, w, 1.2);
    ctx.restore();
  },

  veiling(ctx, w, h, t, amt) {
    const snap = snapshot();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.08 + amt * 0.1;
    ctx.filter = 'blur(26px) brightness(1.1)';
    ctx.drawImage(snap, -w * 0.04, -h * 0.04, w * 1.08, h * 1.08);
    ctx.filter = 'none';
    ctx.restore();
    tint(ctx, w, h, '#5a6b7d', 0.03 + amt * 0.04, 'screen');
  },

  edgeCA(ctx, w, h, t, amt) {
    const snap = snapshot();
    const shift = 1.2 + amt * 2.6;
    workCtx.clearRect(0, 0, workCanvas.width, workCanvas.height);
    workCtx.drawImage(snap, 0, 0, workCanvas.width, workCanvas.height);
    const mask = maskCanvas;
    const mc = maskCtx;
    mc.clearRect(0, 0, mask.width, mask.height);
    const g = mc.createRadialGradient(workCanvas.width / 2, workCanvas.height / 2, workCanvas.width * 0.2, workCanvas.width / 2, workCanvas.height / 2, workCanvas.width * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.95)');
    mc.fillStyle = g;
    mc.fillRect(0, 0, workCanvas.width, workCanvas.height);
    workCtx.globalCompositeOperation = 'destination-in';
    workCtx.drawImage(mask, 0, 0, workCanvas.width, workCanvas.height);
    workCtx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.32;
    ctx.drawImage(workCanvas, shift, 0, w, h);
    ctx.globalAlpha = 0.24;
    ctx.drawImage(workCanvas, -shift, 0, w, h);
    ctx.restore();
  },

  dayForNight(ctx, w, h, t, amt) {
    const snap = snapshot();
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.filter = `brightness(${1 - amt * 0.34}) contrast(${1 + amt * 0.2}) saturate(${1 - amt * 0.3})`;
    ctx.drawImage(snap, 0, 0);
    ctx.filter = 'none';
    ctx.restore();
    tint(ctx, w, h, '#12325c', 0.12 + amt * 0.12, 'multiply');
    tint(ctx, w, h, '#0d2b46', 0.1 + amt * 0.1, 'screen');
    // keep a sliver of sky detail
    screenPass(ctx, highlightPass(snap, {
      threshold: 0.72, width: 0.2, color: '#3f6d96', blur: 8, alpha: 0.1 + amt * 0.1
    }), w, h);
  },

  phosphor(ctx, w, h, t, amt) {
    if (!prevFrameValid) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.16 + amt * 0.2;
    ctx.filter = 'blur(1.4px) brightness(1.15)';
    ctx.drawImage(prevCanvas, 0, 0);
    ctx.filter = 'none';
    ctx.restore();
  },

  projector(ctx, w, h, t, amt) {
    const flick = 1 + Math.sin(t * 48) * 0.012 + Math.sin(t * 17) * 0.008;
    tint(ctx, w, h, '#fff6e0', Math.max(0, flick - 1) * 6 * amt, 'screen');
    const frame = Math.floor(t * 24);
    for (let i = 0; i < 3; i++) {
      const seed = frame * 5 + i;
      if (hash(seed) > 0.72) {
        ctx.fillStyle = `rgba(255,255,255,${0.25 + hash(seed + 2) * 0.5})`;
        ctx.fillRect(hash(seed + 1) * w, hash(seed + 3) * h, 1.2, 1.2);
      }
    }
    if (hash(Math.floor(t * 2)) > 0.93) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(w * 0.12, 0, 1.1, h);
    }
  },

  vhs(ctx, w, h, t, amt) {
    const snap = snapshot();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.12 + amt * 0.16;
    ctx.filter = 'blur(1px)';
    ctx.drawImage(snap, -2.4, 0);
    ctx.drawImage(snap, 2.4, 0);
    ctx.filter = 'none';
    ctx.restore();

    // head-switching band
    const bandY = h - 14 - Math.sin(t * 3) * 2;
    const bandH = 11;
    ctx.save();
    ctx.drawImage(mainCanvas, 0, bandY, w, bandH, 5 + Math.sin(t * 9) * 3, bandY, w, bandH);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, bandY, w, 1);
    ctx.restore();

    // 240-line softness
    const scan = cachedPattern(ctx, scanTile);
    ctx.save();
    ctx.globalAlpha = 0.1 + amt * 0.1;
    ctx.fillStyle = scan;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  },

  dither(ctx, w, h, t, amt) {
    const snap = snapshot();
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.filter = `grayscale(1) contrast(${1.1 + amt * 0.28}) brightness(1.12)`;
    ctx.drawImage(snap, 0, 0);
    ctx.filter = 'none';
    ctx.restore();
    const pat = cachedPattern(ctx, ditherTile);
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.1 + amt * 0.1;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    // hold the blacks
    tint(ctx, w, h, '#070708', 0.06, 'multiply');
  },

  lumaRoto(ctx, w, h, t, amt) {
    const snap = snapshot();
    screenPass(ctx, highlightPass(snap, {
      threshold: 0.64,
      width: 0.18,
      color: '#ffd2a0',
      blur: 4,
      alpha: 0.16 + amt * 0.22
    }), w, h);
    screenPass(ctx, highlightPass(snap, {
      threshold: 0.8,
      width: 0.18,
      color: '#fff1dc',
      blur: 14,
      alpha: 0.08 + amt * 0.12
    }), w, h);
  },

  rimLight(ctx, w, h, t, amt) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createLinearGradient(w * 0.55, 0, w, h);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.55, `rgba(190,225,255,${0.12 * amt})`);
    g.addColorStop(1, `rgba(255,225,190,${0.2 * amt})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  },

  fogGradient(ctx, w, h, t, amt) {
    const g = ctx.createLinearGradient(0, h * 0.1, 0, h);
    g.addColorStop(0, `rgba(210,205,215,${0.1 * amt})`);
    g.addColorStop(0.5, `rgba(140,160,175,${0.05 * amt})`);
    g.addColorStop(1, `rgba(0,0,0,${0.12 * amt})`);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  },

  skinProtect(ctx, w, h, t, amt) {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    const g = ctx.createRadialGradient(w * 0.46, h * 0.44, 10, w * 0.46, h * 0.44, w * 0.26);
    g.addColorStop(0, `rgba(255,168,120,${0.24 * amt})`);
    g.addColorStop(1, 'rgba(255,168,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    tint(ctx, w, h, '#9fd4e8', 0.05 * amt, 'soft-light');
  },

  skyKey(ctx, w, h, t, amt) {
    const snap = snapshot();
    // Only the upper third and only where the plate is already bright.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h * 0.46);
    ctx.clip();
    screenPass(ctx, highlightPass(snap, {
      threshold: 0.46,
      width: 0.4,
      color: '#3f8fc4',
      blur: 6,
      alpha: 0.16 + amt * 0.18
    }), w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h * 0.46);
    g.addColorStop(0, `rgba(90,150,200,${0.1 * amt})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h * 0.46);
    ctx.restore();
  },

  duotoneIso(ctx, w, h, t, amt) {
    const snap = snapshot();
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.filter = `grayscale(1) contrast(${1.25 + amt * 0.15}) brightness(1.08)`;
    ctx.drawImage(snap, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // Two inks: a cool shadow ink multiplied into the plate, and a warm
    // highlight ink screened back only where the plate is bright. Luminance
    // drives the split, so the image keeps its shape instead of flattening.
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = '#2b6f8e';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    screenPass(ctx, highlightPass(snap, {
      threshold: 0.4, width: 0.5, color: '#f5cfa4', blur: 3, alpha: 0.4 + amt * 0.2
    }), w, h);
    tint(ctx, w, h, '#04131a', 0.06, 'multiply');
  },

  lumaHit(ctx, w, h, t, amt) {
    const imp = impulse(t, state.bpm, 11);
    if (imp < 0.02) return;
    tint(ctx, w, h, '#fff6ea', imp * 0.19 * (0.4 + amt), 'screen');
    const snap = snapshot();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = imp * 0.1 * amt;
    ctx.drawImage(snap, 0, 0);
    ctx.restore();
  },

  flashFrame(ctx, w, h, t, amt) {
    const imp = impulse(t, state.bpm, 14);
    if (imp < 0.05) return;
    tint(ctx, w, h, '#fffaf2', imp * 0.28 * (0.4 + amt), 'screen');
  },

  snareImpulse(ctx, w, h, t, amt) {
    const imp = impulse(t, state.bpm, 15);
    if (imp < 0.03) return;
    tint(ctx, w, h, '#ffe9d2', imp * 0.12 * amt, 'screen');
  },

  strobeGate(ctx, w, h, t, amt) {
    const p = beatPhase(t, state.bpm, 0.25);
    if (p < 0.35 * amt) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  },

  chromaSlam(ctx, w, h, t, amt) {
    const imp = impulse(t, state.bpm, 10);
    if (imp < 0.03) return;
    const snap = snapshot();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.14 * imp * amt;
    ctx.fillStyle = '#ff2b2b';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.1 * imp * amt;
    ctx.fillStyle = '#2b6bff';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.3 * imp;
    ctx.drawImage(snap, -3 * imp, 0);
    ctx.globalAlpha = 0.22 * imp;
    ctx.drawImage(snap, 3 * imp, 0);
    ctx.restore();
  },

  zoomPunch(ctx, w, h, t, amt) {
    // scale handled in render config; add a micro contrast tick
    const imp = impulse(t, state.bpm, 12);
    tint(ctx, w, h, '#ffffff', imp * 0.02 * amt, 'screen');
  },

  blackout(ctx, w, h, t, amt) {
    const p = beatPhase(t, state.bpm, 2);
    if (p < 0.05 + amt * 0.05) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
    }
  },

  whipPan(ctx, w, h, t, amt) {
    const snap = snapshot();
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    const slices = 18;
    for (let i = 0; i < slices; i++) {
      const y = (i / slices) * h;
      const sh = h / slices + 1;
      const off = Math.sin(t * 2.05 + i * 0.32) * (6 + amt * 26);
      ctx.drawImage(snap, 0, y, w, sh, off, y, w, sh);
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.25 + amt * 0.2;
    ctx.filter = 'blur(6px)';
    ctx.drawImage(snap, 0, 0);
    ctx.filter = 'none';
    ctx.restore();
  },

  exposureWipe(ctx, w, h, t, amt) {
    const p = beatPhase(t, state.bpm, 4);
    const x = (p * 1.6 - 0.3) * w;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createLinearGradient(x - w * 0.22, 0, x + w * 0.22, 0);
    g.addColorStop(0, 'rgba(255,240,220,0)');
    g.addColorStop(0.5, `rgba(255,250,240,${0.24 * amt})`);
    g.addColorStop(1, 'rgba(255,240,220,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  },

  gateFlash(ctx, w, h, t, amt) {
    const p = beatPhase(t, state.bpm, 4);
    if (p < 0.03) {
      tint(ctx, w, h, '#ffffff', 0.5 * amt, 'screen');
    }
  },

  rollingSkew(ctx, w, h, t, amt) {
    const snap = snapshot();
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    const slices = 26;
    const skew = Math.sin(t * 1.6) * (2 + amt * 5);
    for (let i = 0; i < slices; i++) {
      const y = (i / slices) * h;
      const sh = h / slices + 1;
      ctx.drawImage(snap, 0, y, w, sh, (i / slices) * skew, y, w, sh);
    }
    ctx.restore();
  },

  dissolveGlitch(ctx, w, h, t, amt) {
    const p = beatPhase(t, state.bpm, 2);
    if (p > 0.08) return;
    const snap = snapshot();
    ctx.save();
    ctx.globalAlpha = (1 - p / 0.08) * 0.5;
    ctx.drawImage(snap, 3 + amt * 5, 0);
    ctx.drawImage(snap, -3 - amt * 5, 0);
    ctx.restore();
  },

  weave(ctx, w, h, t, amt) {
    // transform handles motion; add a soft gate shadow at frame edge
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(0,0,0,${0.12 * amt})`);
    g.addColorStop(0.08, 'rgba(0,0,0,0)');
    g.addColorStop(0.92, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${0.12 * amt})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  },

  bokehOval(ctx, w, h, t, amt) {
    // subtle squeeze vignette typical of anamorphic optics
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(1, 0.92);
    ctx.translate(-w / 2, -h / 2);
    const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${0.24 * amt})`);
    ctx.fillStyle = g;
    ctx.fillRect(-w * 0.2, -h * 0.2, w * 1.4, h * 1.4);
    ctx.restore();
  }
};

/* ============================================================================
   7. FRAME RENDERER
   ========================================================================== */

function applyLook(cfgTime) {
  const preset = state.selectedVfx;
  const amt = state.intensity;
  const effects = preset.effects || [];

  const cfg = computeRenderConfig(cfgTime, effects, amt);
  renderPlate(cfg.time, cfg);
  rawCtx.clearRect(0, 0, VIEW.w, VIEW.h);
  rawCtx.drawImage(mainCanvas, 0, 0, VIEW.w, VIEW.h);

  for (const name of effects) {
    const fn = SHADERS[name];
    if (fn) fn(mainCtx, VIEW.w, VIEW.h, cfgTime, amt);
  }

  // global fine grain always present at low level
  if (!effects.includes('grain')) {
    SHADERS.grain(mainCtx, VIEW.w, VIEW.h, cfgTime, 0.18);
  }
}

function drawSafeGuides(ctx, w, h) {
  if (!state.aspectGuide) return;
  const frameW = h * (9 / 16);
  const x = (w - frameW) / 2;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(x, 0, frameW, h);
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.fillRect(0, 0, x, h);
  ctx.fillRect(x + frameW, 0, w - (x + frameW), h);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '600 9px -apple-system, sans-serif';
  ctx.fillText('9:16 SAFE', x + 8, 16);
  ctx.restore();
}

/* ============================================================================
   8. LYRIC TYPOGRAPHY ENGINE (LYRC-style spatial compositions)
   ========================================================================== */

const FONTS = {
  sans_serif: {
    p: (px) => `800 ${px}px "Helvetica Neue", Helvetica, Arial, sans-serif`,
    s: (px) => `italic 400 ${px}px "Iowan Old Style", "Times New Roman", Georgia, serif`,
    label: (px) => `700 ${px}px "SF Mono", Menlo, monospace`
  },
  condensed_mono: {
    p: (px) => `900 ${px}px "Arial Narrow", "Helvetica Neue", Arial, sans-serif`,
    s: (px) => `700 ${px}px "SF Mono", Menlo, monospace`,
    label: (px) => `600 ${px}px "SF Mono", Menlo, monospace`
  },
  editorial_display: {
    p: (px) => `700 ${px}px "Iowan Old Style", "Times New Roman", Georgia, serif`,
    s: (px) => `italic 400 ${px}px "Times New Roman", Georgia, serif`,
    label: (px) => `600 ${px}px "SF Mono", Menlo, monospace`
  },
  lowercase_brat: {
    p: (px) => `900 ${px}px Arial, "Helvetica Neue", sans-serif`,
    s: (px) => `900 ${px}px Arial, "Helvetica Neue", sans-serif`,
    label: (px) => `700 ${px}px Arial, sans-serif`
  }
};

function activeCueAt(t) {
  if (!state.cues.length) return null;
  for (const cue of state.cues) {
    if (t >= cue.start && t < cue.end) return cue;
  }
  return t < state.cues[0].start ? state.cues[0] : state.cues[state.cues.length - 1];
}

function cuePhase(cue, t) {
  const span = Math.max(0.001, cue.end - cue.start);
  return clamp((t - cue.start) / span, 0, 1);
}

function wordIn(words, cue, t, i) {
  const n = Math.max(1, words.length);
  const stagger = 0.52 / n;
  const p = cuePhase(cue, t);
  const local = clamp((p - i * stagger) / 0.22, 0, 1);
  return smoothstep(local);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth, startPx, fontFn, minPx = 10) {
  let px = startPx;
  while (px > minPx) {
    ctx.font = fontFn(px);
    if (ctx.measureText(text).width <= maxWidth) break;
    px -= 2;
  }
  return px;
}

function drawTracked(ctx, text, x, y, tracking, align = 'center') {
  const chars = [...text];
  let total = 0;
  for (const ch of chars) total += ctx.measureText(ch).width + tracking;
  total -= tracking;
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  for (const ch of chars) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
  return total;
}

function wrapToWidth(ctx, words, maxWidth) {
  const lines = [];
  let line = [];
  for (const word of words) {
    const test = [...line, word].join(' ');
    if (ctx.measureText(test).width > maxWidth && line.length) {
      lines.push(line);
      line = [word];
    } else {
      line.push(word);
    }
  }
  if (line.length) lines.push(line);
  return lines;
}

function seededShuffle(arr, seed) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(hash(seed * 37 + i * 11) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function row0Width(lines) {
  if (!lines.length) return 0;
  return Math.max(...lines.map((l) => l.width));
}

const LYRIC_LAYOUTS = {
  duet(ctx, w, h, cue, t, words, pal) {
    const baseFs = h * 0.098 * state.fontSize;
    const gap = baseFs * 0.24;
    // Resolve the role of every word first, measure it with that exact font,
    // then break lines. Mixing fonts without measuring each role is what makes
    // this layout spill outside the frame.
    const roles = words.map((word, i) => ((i + state.variationSeed) % 2 === 0 ? 'secondary' : 'primary'));
    const fontFor = (role, px) => (role === 'secondary' ? FONTS[state.fontPair].s(px) : FONTS[state.fontPair].p(px));

    const maxWidth = w * 0.84;
    const lines = [];
    let line = [];
    let lineWidth = 0;
    words.forEach((word, i) => {
      const role = roles[i];
      let px = role === 'secondary' ? baseFs * 0.94 : baseFs;
      ctx.font = fontFor(role, px);
      let wordWidth = ctx.measureText(word).width;
      // shrink the whole line locally if a single long word cannot fit
      if (wordWidth > maxWidth) {
        px = baseFs * (maxWidth / wordWidth) * 0.98;
        ctx.font = fontFor(role, px);
        wordWidth = ctx.measureText(word).width;
      }
      const nextWidth = lineWidth + (line.length ? gap : 0) + wordWidth;
      if (nextWidth > maxWidth && line.length) {
        lines.push({ words: line, width: lineWidth });
        line = [{ word, role, px, wordWidth, index: i }];
        lineWidth = wordWidth;
      } else {
        line.push({ word, role, px, wordWidth, index: i });
        lineWidth = nextWidth;
      }
    });
    if (line.length) lines.push({ words: line, width: lineWidth });

    const lineH = baseFs * 1.18;
    const startY = h * state.posY - ((lines.length - 1) * lineH) / 2;
    ctx.textBaseline = 'middle';

    lines.forEach((row, r) => {
      let x;
      if (state.align === 'left') x = w * 0.08;
      else if (state.align === 'right') x = w * 0.92 - row.width;
      else x = (w - row.width) / 2;

      row.words.forEach((token) => {
        const p = wordIn(words, cue, t, token.index);
        if (p > 0.01) {
          ctx.font = fontFor(token.role, token.px);
          ctx.globalAlpha = p;
          ctx.fillStyle = token.role === 'secondary' ? pal.accent : pal.primary;
          const lift = (1 - p) * (token.role === 'secondary' ? 14 : -12);
          ctx.fillText(token.word, x, startY + r * lineH + lift);
        }
        x += token.wordWidth + gap;
      });
      ctx.globalAlpha = 1;
    });

    // thin rule below the lockup
    const ruleW = Math.min(row0Width(lines), 320);
    const ruleX = state.align === 'left' ? w * 0.08 : state.align === 'right' ? w * 0.92 - ruleW : (w - ruleW) / 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ruleX, startY + (lines.length - 1) * lineH + baseFs * 0.86);
    ctx.lineTo(ruleX + ruleW, startY + (lines.length - 1) * lineH + baseFs * 0.86);
    ctx.stroke();
  },

  redline(ctx, w, h, cue, t, words, pal) {
    const fs = Math.min(h * 0.135, (w * 0.8) / Math.max(6, words.join(' ').length * 0.62)) * state.fontSize;
    const rows = wrapToWidth(ctx, words, w * 0.78);
    const lineH = fs * 1.03;
    const totalH = rows.length * lineH;
    let y = h * state.posY - totalH / 2 + lineH * 0.8;
    let idx = 0;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = pal.accent;
    const barX = state.align === 'right' ? w * 0.9 : w * 0.075;
    ctx.fillRect(barX, y - lineH * 0.9, 3, totalH - 6);

    rows.forEach((row) => {
      let x = state.align === 'right' ? w * 0.86 : w * 0.105;
      row.forEach((word) => {
        const p = wordIn(words, cue, t, idx);
        const knockout = state.backdrop !== 'clean' && (idx + state.variationSeed) % 4 === 1;
        ctx.font = FONTS[state.fontPair].p(fs);
        const tw = ctx.measureText(word).width;
        if (p > 0.01) {
          ctx.globalAlpha = p;
          if (knockout && state.backdrop !== 'solid_cards') {
            ctx.fillStyle = pal.accent;
            ctx.fillRect(x - fs * 0.06, y - fs * 0.86, tw + fs * 0.12, fs * 0.98);
            ctx.fillStyle = '#0a0a0a';
          } else {
            ctx.fillStyle = pal.primary;
          }
          ctx.fillText(word.toUpperCase(), x, y);
        }
        x += tw + fs * 0.2;
        idx += 1;
      });
      y += lineH;
      ctx.globalAlpha = 1;
    });
    ctx.globalAlpha = 1;
  },

  brat(ctx, w, h, cue, t, words, pal) {
    const phrase = words.join(' ').toLowerCase();
    const fs = fitText(ctx, phrase, w * 0.8, h * 0.15 * state.fontSize, FONTS.lowercase_brat.p);
    ctx.font = FONTS.lowercase_brat.p(fs);
    const tw = ctx.measureText(phrase).width * 1.12;
    const boxH = fs * 1.32;
    const bx = (w - tw) / 2;
    const by = h * state.posY - boxH / 2;
    const p = cuePhase(cue, t);
    const reveal = Math.min(1, p * 6);
    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.fillStyle = '#8ace00';
    ctx.fillRect(bx, by, tw, boxH);
    ctx.translate(w / 2, h * state.posY);
    ctx.scale(1.12, 1);
    ctx.fillStyle = '#0a0a0a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(phrase, 0, fs * 0.04);
    ctx.restore();
    ctx.textAlign = 'left';
  },

  heartless(ctx, w, h, cue, t, words, pal) {
    const fs = h * 0.098 * state.fontSize;
    const rows = wrapToWidth(ctx, words, w * 0.84);
    const lineH = fs * 1.22;
    let y = h * state.posY - ((rows.length - 1) * lineH) / 2;
    let idx = 0;
    ctx.textAlign = state.align === 'left' ? 'left' : 'center';
    const anchorX = state.align === 'left' ? w * 0.09 : w / 2;
    ctx.textBaseline = 'middle';
    rows.forEach((row, r) => {
      let lineText = '';
      row.forEach((word, i) => {
        const p = wordIn(words, cue, t, idx);
        const serif = (idx + state.variationSeed) % 3 !== 0;
        ctx.font = serif ? FONTS[state.fontPair].s(fs * 0.94) : FONTS[state.fontPair].p(fs);
        const wordPx = ctx.measureText(word).width;
        const gap = fs * 0.22;
        let x;
        if (state.align === 'left') {
          x = anchorX + ctx.measureText(lineText).width;
        } else {
          const rowWidth = ctx.measureText(lineText).width + wordPx + gap;
          x = anchorX - rowWidth / 2 + ctx.measureText(lineText).width;
        }
        if (p > 0.01) {
          ctx.globalAlpha = p;
          if (!serif) {
            ctx.shadowColor = pal.accent;
            ctx.shadowBlur = 22 * p;
            ctx.fillStyle = pal.primary;
          } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.88)';
          }
          ctx.fillText(word, x, y + r * lineH + (1 - p) * 12);
          ctx.shadowBlur = 0;
        }
        lineText += word + '  ';
        idx += 1;
      });
      ctx.globalAlpha = 1;
    });
    ctx.textAlign = 'left';
  },

  uplift(ctx, w, h, cue, t, words, pal) {
    const fs = h * 0.088 * state.fontSize;
    const lineH = fs * 1.16;
    const baseY = h * 0.82;
    let idx = 0;
    const show = Math.min(words.length, 6);
    for (let i = 0; i < show; i++) {
      const word = words[i];
      const p = wordIn(words, cue, t, i);
      const y = baseY - (show - 1 - i) * lineH - (1 - p) * 26;
      ctx.globalAlpha = p;
      ctx.font = FONTS[state.fontPair].p(fs);
      const tw = ctx.measureText(word.toUpperCase()).width;
      const x = state.align === 'left' ? w * 0.08 : state.align === 'right' ? w * 0.92 - tw : (w - tw) / 2;
      ctx.fillStyle = i === show - 1 ? pal.accent : pal.primary;
      ctx.fillText(word.toUpperCase(), x, y);
      ctx.globalAlpha = p * 0.18;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y + 6, tw, 1);
      ctx.globalAlpha = 1;
      idx += 1;
    }
  },

  voltage(ctx, w, h, cue, t, words, pal) {
    const phrase = words.join(' ').toUpperCase();
    const fs = fitText(ctx, phrase, w * 0.82, h * 0.13 * state.fontSize, FONTS[state.fontPair].p);
    ctx.font = FONTS[state.fontPair].p(fs);
    const tw = ctx.measureText(phrase).width;
    const p = cuePhase(cue, t);
    const jitter = 2.4 * Math.max(0, 1 - p * 4);
    const x = state.align === 'left' ? w * 0.08 : (w - tw) / 2;
    const y = h * state.posY;
    ctx.textBaseline = 'middle';
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = '#ff3b3b';
    ctx.fillText(phrase, x - jitter, y);
    ctx.fillStyle = '#3b6bff';
    ctx.fillText(phrase, x + jitter, y);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = pal.primary;
    ctx.fillText(phrase, x, y);
    // voltage ticks
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 5; i++) {
      const lx = x - 22 - i * 9;
      const ly = y - fs * 0.5 + i * 7;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + 6, ly);
      ctx.stroke();
    }
  },

  overdrive(ctx, w, h, cue, t, words, pal) {
    const phrase = words.join(' ').toUpperCase();
    const fs = fitText(ctx, phrase, w * 0.78, h * 0.115 * state.fontSize, FONTS[state.fontPair].p);
    ctx.save();
    ctx.transform(1, 0, -0.16, 1, 0, 0);
    ctx.font = FONTS[state.fontPair].p(fs);
    const tw = ctx.measureText(phrase).width;
    const x = (w - tw) / 2 + h * 0.04;
    const y = h * state.posY;
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.18;
    for (let i = 1; i < 4; i++) {
      ctx.fillStyle = pal.accent;
      ctx.fillText(phrase, x - i * 10, y);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = pal.primary;
    ctx.fillText(phrase, x, y);
    ctx.restore();
    // speed streaks
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 6; i++) {
      const ly = h * state.posY - 40 + i * 16;
      ctx.beginPath();
      ctx.moveTo(w * 0.06, ly);
      ctx.lineTo(w * 0.06 + 30 + hash(i) * 40, ly);
      ctx.stroke();
    }
  },

  tiledwave(ctx, w, h, cue, t, words, pal) {
    const cols = Math.min(3, Math.max(2, Math.ceil(words.length / 2)));
    const rows = Math.ceil(words.length / cols);
    const gap = 7;
    const areaW = w * 0.82;
    const areaH = h * 0.52;
    const cellW = (areaW - gap * (cols - 1)) / cols;
    const cellH = (areaH - gap * (rows - 1)) / rows;
    const originX = (w - areaW) / 2;
    const originY = h * state.posY - areaH / 2;
    words.forEach((word, i) => {
      const p = wordIn(words, cue, t, i);
      if (p <= 0.01) return;
      const c = i % cols;
      const r = Math.floor(i / cols);
      const shift = Math.sin(t * 1.1 + i + state.variationSeed) * (1 - p) * 18;
      const x = originX + c * (cellW + gap) + (1 - p) * (i % 2 ? 22 : -22);
      const y = originY + r * (cellH + gap) + shift;
      ctx.globalAlpha = p;
      const isActive = i === Math.floor(cuePhase(cue, t) * words.length);
      ctx.fillStyle = i % 3 === 0 ? pal.accent : i % 3 === 1 ? 'rgba(255,255,255,0.92)' : 'rgba(12,14,18,0.9)';
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      roundRect(ctx, x, y, cellW, cellH, 5);
      ctx.fill();
      ctx.stroke();
      const textColor = i % 3 === 1 ? '#0a0a0a' : '#f6f6f6';
      const fs = fitText(ctx, word, cellW - 16, cellH * 0.4, FONTS[state.fontPair].p, 11);
      ctx.font = FONTS[state.fontPair].p(fs);
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(word.toUpperCase(), x + cellW / 2, y + cellH / 2);
      if (isActive) {
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);
      }
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    });
  },

  margin(ctx, w, h, cue, t, words, pal) {
    const right = state.align === 'right';
    const railX = right ? w * 0.88 : w * 0.08;
    const maxW = w * 0.46;
    ctx.font = FONTS[state.fontPair].p(h * 0.07 * state.fontSize);
    const rows = wrapToWidth(ctx, words, maxW);
    const fs = h * 0.072 * state.fontSize;
    const lineH = fs * 1.24;
    const totalH = rows.length * lineH;
    const startY = h * state.posY - totalH / 2;
    let idx = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(railX, startY - 10);
    ctx.lineTo(railX, startY + totalH + 4);
    ctx.stroke();
    ctx.fillStyle = pal.accent;
    ctx.fillRect(railX - (right ? 0 : 1), startY - 10, 2, 22);
    rows.forEach((row, r) => {
      let lineText = row.join(' ');
      const p = wordIn(words, cue, t, idx);
      ctx.globalAlpha = Math.max(0.25, p);
      const px = fs * (0.92 + (r === 0 ? 0.12 : 0));
      ctx.font = FONTS[state.fontPair].s(px);
      ctx.fillStyle = r === 0 ? pal.primary : 'rgba(255,255,255,0.78)';
      const tx = right ? railX - 14 : railX + 14;
      ctx.textAlign = right ? 'right' : 'left';
      ctx.fillText(lineText, tx + (1 - p) * (right ? 12 : -12), startY + r * lineH + fs);
      idx += row.length;
    });
    // folio label
    ctx.font = FONTS[state.fontPair].label(8.5);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = right ? 'right' : 'left';
    ctx.fillText(`PHRASE ${String(cue.index + 1).padStart(2, '0')} / ${String(state.cues.length).padStart(2, '0')}`, railX + (right ? -14 : 14), startY + totalH + 22);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  },

  relay(ctx, w, h, cue, t, words, pal) {
    const fs = h * 0.085 * state.fontSize;
    const cardH = fs * 1.28;
    const padX = fs * 0.36;
    const maxW = w * 0.68;
    const colors = [pal.accent, '#f4f1ea', '#111318'];
    let y = h * state.posY - (Math.min(words.length, 5) * (cardH + 6)) / 2;
    const shown = Math.min(words.length, 5);
    for (let i = 0; i < shown; i++) {
      const word = words[i];
      const p = wordIn(words, cue, t, i);
      ctx.globalAlpha = p;
      ctx.font = FONTS[state.fontPair].p(fs);
      const tw = Math.min(maxW, ctx.measureText(word.toUpperCase()).width + padX * 2);
      const bgIndex = (i + state.variationSeed) % colors.length;
      const hideCards = state.backdrop === 'clean';
      if (!hideCards) {
        ctx.fillStyle = colors[bgIndex];
        roundRect(ctx, w / 2 - tw / 2, y + (1 - p) * 14, tw, cardH, 4);
        ctx.fill();
      }
      ctx.fillStyle = hideCards ? pal.primary : bgIndex === 1 ? '#0a0a0a' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(word.toUpperCase(), w / 2, y + cardH / 2 + (1 - p) * 14);
      y += cardH + 6;
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }
  },

  fullset(ctx, w, h, cue, t, words, pal) {
    const positions = [
      [0.27, 0.3], [0.73, 0.3], [0.27, 0.66], [0.73, 0.66],
      [0.5, 0.48], [0.5, 0.82]
    ];
    const order = seededShuffle([...Array(Math.min(6, words.length)).keys()], state.variationSeed);
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.14);
    ctx.lineTo(w * 0.5, h * 0.86);
    ctx.moveTo(w * 0.06, h * 0.48);
    ctx.lineTo(w * 0.94, h * 0.48);
    ctx.stroke();
    words.slice(0, 6).forEach((word, i) => {
      const p = wordIn(words, cue, t, i);
      if (p <= 0.01) return;
      const slot = positions[order[i] % positions.length];
      const fs = fitText(ctx, word.toUpperCase(), w * 0.36, h * 0.125 * state.fontSize, FONTS[state.fontPair].p, 12);
      ctx.font = FONTS[state.fontPair].p(fs);
      ctx.globalAlpha = p;
      ctx.fillStyle = i % 3 === 0 ? pal.accent : pal.primary;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(word.toUpperCase(), slot[0] * w, slot[1] * h + (1 - p) * 12);
      ctx.globalAlpha = p * 0.5;
      ctx.font = FONTS[state.fontPair].label(7.5);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(String(i + 1).padStart(2, '0'), slot[0] * w, slot[1] * h - fs * 0.72);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    });
  },

  ladder(ctx, w, h, cue, t, words, pal) {
    const fs = h * 0.072 * state.fontSize;
    const startX = w * 0.14;
    const startY = h * 0.68;
    const stepX = Math.min(w * 0.12, (w * 0.7) / Math.max(4, words.length));
    const stepY = fs * 1.05;
    const shown = Math.min(words.length, 5);
    for (let i = 0; i < shown; i++) {
      const p = wordIn(words, cue, t, i);
      const x = startX + i * stepX;
      const y = startY - i * stepY;
      ctx.globalAlpha = Math.max(0.18, p);
      ctx.font = FONTS[state.fontPair].p(fs);
      ctx.fillStyle = i === shown - 1 ? pal.accent : pal.primary;
      ctx.fillText(words[i].toUpperCase(), x + (1 - p) * -18, y);
      if (i < shown - 1) {
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 8);
        ctx.lineTo(x + stepX - 4, y - stepY + 8);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  },

  ticker(ctx, w, h, cue, t, words, pal) {
    const phrase = words.join('  ·  ').toUpperCase();
    const fs = h * 0.052 * state.fontSize;
    ctx.font = FONTS[state.fontPair].s(fs);
    const tw = ctx.measureText(phrase).width + 40;
    const rows = [
      { y: h * 0.76, dir: -1, speed: 42, alpha: 0.92, size: fs },
      { y: h * 0.85, dir: 1, speed: 28, alpha: 0.4, size: fs * 0.78 }
    ];
    rows.forEach((row, ri) => {
      ctx.globalAlpha = row.alpha;
      ctx.font = FONTS[state.fontPair].s(row.size);
      const offset = ((t * row.speed * row.dir) % tw + tw) % tw;
      ctx.fillStyle = ri === 0 ? pal.primary : 'rgba(255,255,255,0.65)';
      for (let x = offset - tw; x < w + tw; x += tw) {
        ctx.fillText(phrase, x, row.y);
      }
      if (ri === 0) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = pal.accent;
        ctx.fillRect(0, row.y + 8, w, 1.4);
      }
    });
    ctx.globalAlpha = 1;
  },

  deepfocus(ctx, w, h, cue, t, words, pal) {
    const fs = h * 0.1 * state.fontSize;
    ctx.font = FONTS[state.fontPair].p(fs);
    const rows = wrapToWidth(ctx, words, w * 0.84);
    const lineH = fs * 1.2;
    let y = h * state.posY - ((rows.length - 1) * lineH) / 2;
    const activeWord = Math.floor(cuePhase(cue, t) * 0.92 * words.length);
    let idx = 0;
    ctx.textBaseline = 'middle';
    rows.forEach((row) => {
      const rowText = row.join(' ');
      const rowW = ctx.measureText(rowText).width;
      let x = state.align === 'left' ? w * 0.08 : state.align === 'right' ? w * 0.92 - rowW : (w - rowW) / 2;
      row.forEach((word) => {
        const active = idx === activeWord;
        ctx.font = FONTS[state.fontPair].p(fs);
        ctx.globalAlpha = active ? 1 : 0.3;
        if ('filter' in ctx) ctx.filter = active ? 'none' : `blur(${2 + (1 - cuePhase(cue, t)) * 2}px)`;
        ctx.fillStyle = active ? pal.primary : 'rgba(255,255,255,0.55)';
        ctx.fillText(word, x, y);
        if ('filter' in ctx) ctx.filter = 'none';
        x += ctx.measureText(word).width + fs * 0.24;
        idx += 1;
      });
      y += lineH;
    });
    ctx.globalAlpha = 1;
  },

  afterimage(ctx, w, h, cue, t, words, pal) {
    const phrase = words.join(' ');
    const fs = fitText(ctx, phrase, w * 0.82, h * 0.1 * state.fontSize, FONTS[state.fontPair].s);
    ctx.font = FONTS[state.fontPair].s(fs);
    const tw = ctx.measureText(phrase).width;
    const x = (w - tw) / 2;
    const y = h * state.posY;
    const p = cuePhase(cue, t);
    ctx.textBaseline = 'middle';
    for (let i = 3; i >= 1; i--) {
      ctx.globalAlpha = 0.1 * p * (4 - i);
      ctx.fillStyle = pal.accent;
      ctx.fillText(phrase, x, y - i * 10 * p);
      ctx.fillText(phrase, x, y + i * 10 * p);
    }
    ctx.globalAlpha = p;
    ctx.fillStyle = pal.primary;
    ctx.fillText(phrase, x, y);
    ctx.globalAlpha = 1;
  },

  afterglow(ctx, w, h, cue, t, words, pal) {
    const phrase = words.join(' ');
    const fs = fitText(ctx, phrase, w * 0.84, h * 0.092 * state.fontSize, FONTS[state.fontPair].s);
    ctx.font = FONTS[state.fontPair].s(fs);
    const tw = ctx.measureText(phrase).width;
    const x = (w - tw) / 2;
    const y = h * state.posY;
    const p = cuePhase(cue, t);
    const glow = 16 + Math.sin(t * 2.2) * 6 + p * 12;
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.shadowColor = pal.accent;
    ctx.shadowBlur = glow;
    ctx.fillStyle = pal.primary;
    ctx.globalAlpha = 0.9;
    ctx.fillText(phrase, x, y);
    ctx.shadowBlur = glow * 2.2;
    ctx.globalAlpha = 0.4;
    ctx.fillText(phrase, x, y);
    ctx.restore();
    // halo
    const halo = ctx.createRadialGradient(w / 2, y, 4, w / 2, y, w * 0.32);
    halo.addColorStop(0, `rgba(255,180,120,${0.1 * p})`);
    halo.addColorStop(1, 'rgba(255,180,120,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, y - h * 0.36, w, h * 0.72);
  },

  quiet(ctx, w, h, cue, t, words, pal) {
    const phrase = words.join(' ');
    const fs = fitText(ctx, phrase, w * 0.7, h * 0.052 * state.fontSize, FONTS[state.fontPair].p, 11);
    ctx.font = FONTS[state.fontPair].p(fs);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.textBaseline = 'middle';
    const p = cuePhase(cue, t);
    const visible = words.map((word, i) => wordIn(words, cue, t, i) > 0.02 ? word : '').filter(Boolean).join('  ');
    const text = visible || words[0];
    ctx.globalAlpha = 0.92;
    drawTracked(ctx, text.toUpperCase(), w / 2, h * state.posY, fs * 0.32, 'center');
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = pal.primary;
    ctx.fillRect(w / 2 - 16, h * state.posY + fs * 1.6, 32, 1);
    ctx.globalAlpha = 1;
  },

  letterpress(ctx, w, h, cue, t, words, pal) {
    const phrase = words.join(' ').toUpperCase();
    const fs = fitText(ctx, phrase, w * 0.8, h * 0.1 * state.fontSize, FONTS[state.fontPair].p);
    ctx.font = FONTS[state.fontPair].p(fs);
    const tw = ctx.measureText(phrase).width;
    const x = state.align === 'left' ? w * 0.08 : (w - tw) / 2;
    const y = h * state.posY;
    ctx.textBaseline = 'middle';
    const depth = 3 + state.variationSeed % 3;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    for (let i = depth; i >= 1; i--) {
      ctx.fillText(phrase, x + i * 1.5, y + i * 1.5);
    }
    ctx.fillStyle = pal.accent;
    ctx.fillText(phrase, x - 1.5, y - 1.5);
    ctx.fillStyle = pal.primary;
    ctx.fillText(phrase, x, y);
    // registration marks
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 0.8;
    const marks = [[x - 12, y - fs * 0.6], [x + tw + 12, y - fs * 0.6], [x - 12, y + fs * 0.6], [x + tw + 12, y + fs * 0.6]];
    marks.forEach(([mx, my]) => {
      ctx.beginPath();
      ctx.moveTo(mx - 3, my);
      ctx.lineTo(mx + 3, my);
      ctx.moveTo(mx, my - 3);
      ctx.lineTo(mx, my + 3);
      ctx.stroke();
    });
  },

  hormozi(ctx, w, h, cue, t, words, pal) {
    const fs = h * 0.084 * state.fontSize;
    ctx.font = FONTS[state.fontPair].p(fs);
    // wrap only by natural width
    const maxW = w * 0.82;
    const rows = [];
    let row = [];
    words.forEach((word) => {
      const test = [...row, word].join(' ');
      ctx.font = FONTS[state.fontPair].p(fs);
      if (ctx.measureText(test.toUpperCase()).width > maxW && row.length) {
        rows.push(row);
        row = [word];
      } else row.push(word);
    });
    if (row.length) rows.push(row);
    const lineH = fs * 1.14;
    let y = h * state.posY - ((rows.length - 1) * lineH) / 2;
    const keyword = words.reduce((a, b) => (b.length > a.length ? b : a), '');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    rows.forEach((rowWords) => {
      const lineText = rowWords.join(' ').toUpperCase();
      ctx.font = FONTS[state.fontPair].p(fs);
      const fullW = ctx.measureText(lineText).width;
      let x = w / 2 - fullW / 2;
      rowWords.forEach((word, i) => {
        const p = wordIn(words, cue, t, words.indexOf(word));
        const up = word.toUpperCase();
        const wW = ctx.measureText(up).width;
        if (p > 0) {
          ctx.globalAlpha = p;
          if (word === keyword && state.backdrop !== 'clean') {
            ctx.fillStyle = pal.accent;
            ctx.fillRect(x - 3, y - fs * 0.56, wW + 6, fs * 0.92);
            ctx.fillStyle = '#0a0a0a';
          } else {
            ctx.fillStyle = pal.primary;
          }
          ctx.fillText(up, x + wW / 2, y);
        }
        x += wW + fs * 0.2;
        ctx.globalAlpha = 1;
      });
      y += lineH;
    });
    ctx.textAlign = 'left';
  },

  creatorpill(ctx, w, h, cue, t, words, pal) {
    const phrase = words.join(' ');
    const fs = fitText(ctx, phrase, w * 0.66, h * 0.045 * state.fontSize, FONTS[state.fontPair].p, 11);
    ctx.font = FONTS[state.fontPair].p(fs);
    const tw = ctx.measureText(phrase).width;
    const padX = fs * 0.9;
    const pillW = Math.min(w * 0.8, tw + padX * 2);
    const pillH = fs * 1.9;
    const x = (w - pillW) / 2;
    const y = h * state.posY + h * 0.24;
    const p = cuePhase(cue, t);
    ctx.globalAlpha = Math.min(1, p * 5);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    roundRect(ctx, x, y - pillH / 2, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#0b0b0d';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = FONTS[state.fontPair].p(fs);
    ctx.fillText(phrase, w / 2, y + 1);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
};

function drawLyricsOnFrame(ctx, w, h, t) {
  const cue = activeCueAt(t);
  if (!cue) return;
  const words = cue.text.split(/\s+/).filter(Boolean);
  if (!words.length) return;
  const pal = { primary: state.primaryColor, accent: state.accentColor };
  const layout = LYRIC_LAYOUTS[state.lyricPreset.id] || LYRIC_LAYOUTS.duet;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  // subtle scrim for legibility on bright plates
  if (state.lyricPreset.cat !== 'Talking') {
    const scrim = ctx.createLinearGradient(0, h * 0.2, 0, h);
    scrim.addColorStop(0, 'rgba(0,0,0,0)');
    scrim.addColorStop(0.55, 'rgba(0,0,0,0.12)');
    scrim.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, w, h);
  }
  try {
    if (state.aspectGuide) {
      // Compose the typography inside the 9:16 window: same layout maths, a
      // narrower stage, then translate it onto the safe frame.
      const frameW = h * (9 / 16);
      const offX = (w - frameW) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(offX, 0, frameW, h);
      ctx.clip();
      ctx.translate(offX, 0);
      // Vertical frames have a fraction of the horizontal room, so shrink the
      // type instead of letting each word claim its own line.
      const prevScale = state.fontSize;
      state.fontSize = prevScale * 0.62;
      layout(ctx, frameW, h, cue, t, words, pal);
      state.fontSize = prevScale;
      ctx.restore();
    } else {
      layout(ctx, w, h, cue, t, words, pal);
    }
  } catch (e) {
    ctx.fillStyle = '#fff';
    ctx.font = '600 16px sans-serif';
    ctx.fillText(cue.text, 40, h * 0.5);
  }
  ctx.restore();
}

/* ============================================================================
   9. UI RENDERING
   ========================================================================== */

const rawCanvas = makeCanvas(VIEW.w, VIEW.h);
const rawCtx = rawCanvas.getContext('2d');
let luaText = '-- Awaiting first dispatch';
let hitFlash = 0;
let lastUiUpdate = 0;

function setLua(text) {
  luaText = text;
  const box = $('luaCodeOutput');
  if (box) box.textContent = text;
}

function renderVfxGrid() {
  const grid = $('vfxPresetGrid');
  if (!grid) return;
  const query = state.vfxSearch.toLowerCase();
  const list = VFX_PRESETS.filter((p) => {
    const catOk = state.vfxCategory === 'ALL' || p.cat === state.vfxCategory;
    const searchOk = !query || `${p.name} ${p.desc} ${p.spec} ${p.cat}`.toLowerCase().includes(query);
    return catOk && searchOk;
  });
  if (!list.length) {
    grid.innerHTML = '<div class="grid-empty">No treatments match that filter. Clear the search, or try a different category.</div>';
    return;
  }
  grid.innerHTML = list.map((p) => {
    const color = VFX_CATEGORY_META[p.cat].color;
    const pts = p.curve.map((v, i) => `${(i / (p.curve.length - 1)) * 100},${24 - v * 21}`).join(' ');
    const active = state.selectedVfx.id === p.id ? ' selected' : '';
    return `
      <div class="vfx-card${active}" data-vfx="${p.id}" tabindex="0" role="button" aria-label="${p.name}: ${p.desc}">
        <div class="vfx-thumb">
          <div class="vfx-thumb-top">
            <span class="vfx-thumb-badge" style="color:${color}">${VFX_CATEGORY_META[p.cat].short}</span>
            <span class="vfx-thumb-spec">${p.spec}</span>
          </div>
          <svg viewBox="0 0 100 26" preserveAspectRatio="none" style="width:100%;height:26px;display:block">
            <line x1="0" y1="6" x2="100" y2="6" stroke="rgba(255,255,255,0.06)" stroke-width="0.6"/>
            <line x1="0" y1="13" x2="100" y2="13" stroke="rgba(255,255,255,0.06)" stroke-width="0.6"/>
            <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.06)" stroke-width="0.6"/>
            <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.7" vector-effect="non-scaling-stroke"/>
          </svg>
        </div>
        <div class="vfx-card-body">
          <div class="vfx-card-title">${p.name}</div>
          <div class="vfx-card-desc">${p.desc}</div>
          <div class="vfx-card-foot">
            <span class="vfx-node-tag">${p.node}</span>
            <button class="vfx-apply-btn" data-apply="${p.id}">Apply</button>
          </div>
        </div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.vfx-card').forEach((card) => {
    card.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter') return;
      const preset = VFX_PRESETS.find((p) => p.id === card.dataset.vfx);
      if (!preset) return;
      if (ev.shiftKey) applyVfxPreset(preset);
      else selectVfxPreset(preset);
    });
    card.addEventListener('click', (ev) => {
      const id = card.dataset.vfx;
      const preset = VFX_PRESETS.find((p) => p.id === id);
      if (!preset) return;
      selectVfxPreset(preset);
      if (ev.target.closest('[data-apply]')) applyVfxPreset(preset);
    });
  });
}

function selectVfxPreset(preset, opts = {}) {
  if (!preset) return;
  state.selectedVfx = preset;
  if (opts.resetIntensity !== false) {
    state.intensity = preset.intensity / 100;
    $('masterIntensitySlider').value = preset.intensity;
    $('masterIntensityVal').textContent = preset.intensity + '%';
  }
  $('activeFxPill').textContent = 'Node: ' + preset.name;
  renderVfxGrid();
  if (opts.apply) applyVfxPreset(preset);
}

async function applyVfxPreset(preset) {
  const t = state.currentTime;
  state.appliedVfx = state.appliedVfx.filter((v) => Math.abs(v.t - t) > 0.4);
  state.appliedVfx.push({ preset: preset.name, t, dur: 2.4, node: preset.node });
  state.appliedVfx.sort((a, b) => a.t - b.t);
  renderTimelineTracks();
  showToast(`${preset.name} queued on V3 at ${fmtTC(t)} — native Fusion macro`);
  $('activeFxPill').textContent = 'Node: ' + preset.name;
  const data = await dispatch('apply_vfx', {
    presetId: preset.id,
    presetName: preset.name,
    category: preset.cat,
    node: preset.node,
    intensity: Math.round(state.intensity * 100),
    timecode: fmtTC(t),
    macro: 'VFXKit_' + preset.id + '.setting'
  });
  if (data) showToast(data.liveBridgeConnected ? 'Applied live in Resolve' : 'Lua snippet ready — run inside Resolve Free');
}

function runPromptPass(prompt) {
  const p = prompt.toLowerCase();
  const keywordMap = [
    [/halation|2383|print|kodak/, ['print2383']],
    [/wong|step|print|6fps|smear/, ['stepprint']],
    [/snare|transient|impulse|hit/, ['snare']],
    [/optical flow|speed|ramp|slow/, ['speedramp']],
    [/anamorphic|flare|streak|panavision/, ['anamorphic']],
    [/handheld|easyrig|operator/, ['handheld']],
    [/snorri|chest|rig/, ['snorricam']],
    [/pro-?mist|diffusion|bloom/, ['promist']],
    [/bleach|silver|enr/, ['bleach']],
    [/crt|pvm|scan|tube/, ['pvm']],
    [/vhs|tape/, ['vhs']],
    [/grain|35mm|film/, ['vision3']],
    [/focus|rack|breath/, ['focusrack']],
    [/zoom|punch/, ['crashzoom']],
    [/fog|atmos|depth/, ['fog']],
    [/glow|roto|kicker|rim/, ['lumaroto']],
    [/diopter|de palma|split focus|two planes/, ['splitdiopter']],
    [/day for night|underexpos|night exterior/, ['dayfornight']],
    [/veiling|glare|milky|uncoated/, ['veiling']],
    [/chromatic|fringe|aberration|c[ao]/, ['edgeca']],
    [/teal|orange|split.?tone/, ['tealorange']],
    [/65mm|large format|imax/, ['largeformat']]
  ];
  const chosen = [];
  keywordMap.forEach(([re, ids]) => {
    if (re.test(p)) {
      ids.forEach((id) => {
        const preset = VFX_PRESETS.find((x) => x.id === id);
        if (preset && !chosen.find((c) => c.id === id)) chosen.push(preset);
      });
    }
  });
  if (!chosen.length) chosen.push(VFX_PRESETS[0], VFX_PRESETS[9], VFX_PRESETS[24]);

  const slots = [0.4, 5.4, 10.2, 13.0];
  state.appliedVfx = [];
  chosen.slice(0, 4).forEach((preset, i) => {
    state.appliedVfx.push({ preset: preset.name, t: slots[i], dur: 2.6, node: preset.node });
  });
  renderTimelineTracks();
  selectVfxPreset(chosen[0], { resetIntensity: false });
  showToast(`Built ${state.appliedVfx.length}-node pass across the timeline ✓`);
  dispatch('build_look_pass', { prompt, presets: chosen.map((c) => c.id) });
}

/* ---------------- LYRC gallery ---------------- */

function renderLyrcGallery() {
  const strip = $('captionStyleStrip');
  if (!strip) return;
  const list = LYRC_PRESETS.filter((p) => {
    if (state.lyricCategory === 'ALL') return true;
    if (state.lyricCategory === 'FAV') return state.favorites.has(p.id);
    return p.cat === state.lyricCategory;
  });
  strip.innerHTML = list.map((p) => {
    const active = state.lyricPreset.id === p.id ? ' active' : '';
    const fav = state.favorites.has(p.id) ? ' fav-on' : '';
    const previewStyle = p.id === 'brat'
      ? 'background:#8ace00;color:#0a0a0a;padding:2px 4px;display:inline-block;font-stretch:condensed;'
      : p.id === 'quiet'
        ? 'letter-spacing:.22em;font-weight:500;font-size:10.5px;text-transform:uppercase;'
        : p.cat === 'Minimal'
          ? 'font-family:Georgia,serif;font-style:italic;font-weight:400;'
          : '';
    return `
      <div class="cap-style-card${active}" data-style="${p.id}">
        <div class="cap-card-top">
          <span class="cap-cat-tag">${p.cat.toUpperCase()}</span>
          <button class="cap-fav-btn${fav}" data-fav="${p.id}" title="Save to favourites">★</button>
        </div>
        <div class="cap-style-preview" style="${previewStyle}">${p.sample}</div>
        <div class="cap-style-foot">
          <span class="cap-style-name">${p.name}</span>
          <span class="cap-var-tag">${p.variation ? 'VAR' : 'FIX'}</span>
        </div>
      </div>`;
  }).join('');

  strip.querySelectorAll('.cap-style-card').forEach((card) => {
    card.addEventListener('click', (ev) => {
      if (ev.target.dataset.fav) {
        const id = ev.target.dataset.fav;
        if (state.favorites.has(id)) state.favorites.delete(id);
        else state.favorites.add(id);
        renderLyrcGallery();
        return;
      }
      const preset = LYRC_PRESETS.find((p) => p.id === card.dataset.style);
      if (!preset) return;
      state.lyricPreset = preset;
      state.variationSeed = 1;
      updateLyricContextBar();
      renderLyrcGallery();
      renderCueList();
      $('activeCapPill').textContent = `LYRC: ${preset.name} (#${state.variationSeed})`;
      showToast(`Style: ${preset.name} — ${preset.desc}`);
    });
  });
}

function updateLyricContextBar() {
  const p = state.lyricPreset;
  $('ctxPresetLabel').innerHTML = `Active Preset: <strong>${p.name}</strong> — ${p.desc}`;
  $('variationSeedBadge').textContent = '#' + state.variationSeed;
  const btn = $('lyricVariationBtn');
  btn.disabled = !p.variation;
  btn.style.opacity = p.variation ? '1' : '0.45';
  btn.title = p.variation ? 'Generate a new spatial arrangement seed' : 'This preset uses a fixed recipe';
  $('activeCapPill').textContent = `LYRC: ${p.name} (#${state.variationSeed})`;
}

function renderCueList() {
  const host = $('captionCuesList');
  if (!host) return;
  host.innerHTML = state.cues.map((cue) => `
    <div class="cue-item${state.selectedCue === cue.index ? ' active' : ''}" data-cue="${cue.index}">
      <span class="cue-time">${cue.start.toFixed(1)}s</span>
      <span class="cue-text">${cue.text}</span>
      <span class="cue-time">${(cue.end - cue.start).toFixed(1)}s</span>
    </div>`).join('');
  $('cueCountBadge').textContent = `${state.cues.length} Phrases`;
  host.querySelectorAll('.cue-item').forEach((el) => {
    el.addEventListener('click', () => {
      const cue = state.cues[Number(el.dataset.cue)];
      if (!cue) return;
      state.currentTime = cue.start + 0.04;
      state.selectedCue = cue.index;
      state.playing = false;
      $('playPauseBtn').textContent = 'Play';
      renderCueList();
      renderTimelineTracks();
    });
  });
}

function syncLyrics() {
  state.duration = 16;
  rebuildCues();
  renderCueList();
  renderTimelineTracks();
}

function downloadSrt() {
  const srt = state.cues.map((cue, i) => {
    const time = (s) => {
      const hh = String(Math.floor(s / 3600)).padStart(2, '0');
      const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const ss = String(Math.floor(s % 60)).padStart(2, '0');
      const ms = String(Math.floor((s % 1) * 1000)).padStart(3, '0');
      return `${hh}:${mm}:${ss},${ms}`;
    };
    return `${i + 1}\n${time(cue.start)} --> ${time(cue.end)}\n${cue.text}\n`;
  }).join('\n');
  const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pulsevfx-lyrics.srt';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Exported .SRT with ' + state.cues.length + ' cues');
}

/* ---------------- Silences ---------------- */

function ampThreshold() {
  return clamp(((state.silenceGate + 50) / 32) * 0.5, 0.04, 0.46);
}

function isCut(seg) {
  if (seg.id in state.cutOverrides) return state.cutOverrides[seg.id];
  return seg.amp < ampThreshold() && (seg.end - seg.start) * 1000 >= state.silenceMinMs * 0.6;
}

function silenceStats() {
  const total = state.segments[state.segments.length - 1].end;
  let kept = 0;
  state.segments.forEach((seg) => {
    if (!isCut(seg)) kept += seg.end - seg.start;
  });
  kept = Math.max(0.5, kept - (state.silencePadMs / 1000) * 0.2);
  return { total, kept, saved: Math.max(0, total - kept) };
}

function renderSilenceSegments() {
  const host = $('silenceSegmentsList');
  if (!host) return;
  host.innerHTML = state.segments.map((seg) => {
    const cut = isCut(seg);
    return `
      <div class="segment-row${cut ? ' silence-cut' : ''}" data-seg="${seg.id}">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="segment-badge ${cut ? 'cut' : 'keep'}">${cut ? 'CUT' : 'KEEP'}</span>
          <span style="font-size:11px">${seg.text}</span>
        </div>
        <span class="cue-time">${seg.start.toFixed(2)}s → ${seg.end.toFixed(2)}s</span>
      </div>`;
  }).join('');
  host.querySelectorAll('.segment-row').forEach((row) => {
    row.addEventListener('click', () => {
      const id = Number(row.dataset.seg);
      const seg = state.segments.find((s) => s.id === id);
      if (!seg) return;
      state.cutOverrides[id] = !isCut(seg);
      refreshSilenceUI();
    });
  });
}

function refreshSilenceUI() {
  const stats = silenceStats();
  $('silenceOrigDur').textContent = stats.total.toFixed(1) + 's';
  $('silenceNewDur').textContent = stats.kept.toFixed(1) + 's';
  $('silenceSavedPct').textContent = `${Math.round((stats.saved / stats.total) * 100)}% (-${stats.saved.toFixed(1)}s)`;
  const cuts = state.segments.filter(isCut).length;
  $('silenceCutCount').textContent = `${cuts} cuts`;
  $('thresholdBadge').textContent = `Gate: ${state.silenceGate} dB`;
  renderSilenceSegments();
  drawWaveform();
}

function drawWaveform() {
  const canvas = $('silenceWaveformCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const total = state.segments[state.segments.length - 1].end;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#080a0f';
  ctx.fillRect(0, 0, w, h);

  const xFor = (s) => (s / total) * w;
  state.segments.forEach((seg) => {
    const x0 = xFor(seg.start);
    const x1 = xFor(seg.end);
    const cut = isCut(seg);
    if (cut) {
      ctx.fillStyle = 'rgba(239,68,68,0.12)';
      ctx.fillRect(x0, 0, x1 - x0, h);
      ctx.strokeStyle = 'rgba(239,68,68,0.5)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0, h);
      ctx.moveTo(x1, 0);
      ctx.lineTo(x1, h);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const bars = Math.max(3, Math.floor((x1 - x0) / 3));
    for (let i = 0; i < bars; i++) {
      const x = x0 + (i / bars) * (x1 - x0);
      const env = cut ? 0.05 : seg.amp * (0.55 + hash(seg.id * 13 + i) * 0.75);
      const bh = Math.max(2, env * h * 0.78);
      ctx.fillStyle = cut ? 'rgba(120,120,130,0.35)' : 'rgba(16,185,129,0.62)';
      ctx.fillRect(x, h / 2 - bh / 2, Math.max(1, (x1 - x0) / bars - 1), bh);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.font = '8px "SF Mono", monospace';
    ctx.fillText(seg.start.toFixed(1) + 's', x0 + 2, 10);
  });

  // playhead
  const px = (state.currentTime / total) * w;
  ctx.fillStyle = '#f43f5e';
  ctx.fillRect(px, 0, 1.4, h);
}

async function executeSilenceCut() {
  const stats = silenceStats();
  const payload = {
    noiseFloorDb: state.silenceGate,
    minSilenceMs: state.silenceMinMs,
    padMs: state.silencePadMs,
    autoReframe: state.autoReframe,
    jCut: state.jcut,
    originalDuration: stats.total,
    outputDuration: stats.kept,
    segments: state.segments.map((s) => ({
      id: s.id,
      startSec: s.start,
      endSec: s.end,
      cut: isCut(s),
      startFrame: Math.round(s.start * 24),
      endFrame: Math.round(s.end * 24)
    }))
  };
  showToast('Dispatching silence cut to Resolve…');
  const data = await dispatch('cut_silences', payload);
  state.timelineTitle = 'SILENCE_CUT_v1';
  $('activeTimelineTitle').textContent = `Timeline 2 — ${state.timelineTitle}`;
  renderTimelineTracks();
  showToast(data && data.liveBridgeConnected ? 'Timeline rebuilt inside Resolve Free' : 'Lua snippet ready for the Resolve console');
}

/* ---------------- Media Pool ---------------- */

const poolIncluded = new Set(MEDIA_POOL_BASE.filter((c) => c.tag !== 'Audio').map((c) => c.id));

function renderMediaPool() {
  const host = $('mediaPoolGrid');
  if (!host) return;
  const list = state.mediaPool.filter((c) => state.poolBin === 'ALL' || c.bin === state.poolBin);
  host.innerHTML = list.map((clip) => {
    const inc = poolIncluded.has(clip.id);
    return `
      <div class="mp-clip-card${inc ? ' included' : ''}" data-clip="${clip.id}">
        <div class="mp-clip-left">
          <div class="mp-color-swatch" style="background:${clip.color}"></div>
          <div>
            <div class="mp-clip-name">${clip.name}</div>
            <div class="mp-clip-meta">${clip.bin} · ${clip.dur.toFixed(1)}s · ${clip.fps} fps</div>
          </div>
        </div>
        <span class="segment-badge ${inc ? 'keep' : 'cut'}">${inc ? 'IN' : 'OUT'}</span>
      </div>`;
  }).join('');
  host.querySelectorAll('.mp-clip-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.clip;
      if (poolIncluded.has(id)) poolIncluded.delete(id);
      else poolIncluded.add(id);
      renderMediaPool();
    });
  });
}

function buildTimeline() {
  const dur = state.duration;
  const beats = state.mvPacing === '1' ? 1 : state.mvPacing === '4' ? 4 : state.mvPacing === 'dynamic' ? 2 : 2;
  const beatDur = (60 / state.bpm) * beats;
  const performance = state.mediaPool.filter((c) => c.tag === 'Performance' && poolIncluded.has(c.id));
  const broll = state.mediaPool.filter((c) => c.bin === 'B-Roll' && poolIncluded.has(c.id));
  const audio = state.mediaPool.find((c) => c.tag === 'Audio');

  const v1 = [];
  let t = 0;
  let i = 0;
  while (t < dur - 0.05) {
    const clip = performance[i % Math.max(1, performance.length)] || state.mediaPool[0];
    const len = Math.min(beatDur * 1.0, dur - t);
    v1.push({ name: clip.name, t, dur: len });
    t += len;
    i += 1;
  }

  const v2 = [];
  if (broll.length) {
    let bt = beatDur * 2;
    let b = 0;
    while (bt < dur - 0.6) {
      const clip = broll[b % broll.length];
      const len = Math.min(beatDur * 2, dur - bt);
      v2.push({ name: clip.name, t: bt, dur: len });
      bt += beatDur * 4;
      b += 1;
    }
  }

  const sub = state.cues.map((c) => ({ name: state.lyricPreset.name + ' · ' + c.text.split(' ').slice(0, 3).join(' '), t: c.start, dur: c.end - c.start }));

  return { v1, v2, sub, audio };
}

function renderTimelineTracks() {
  const lanes = { laneV1: 'v1-item', laneV2: 'v2-item', laneSub: 'sub-item', laneV3: 'vfx-item', laneA1: 'a1-item' };
  const build = buildTimeline();
  const dur = state.duration;

  const setLane = (id, items) => {
    const lane = $(id);
    if (!lane) return;
    lane.innerHTML = items.map((item) => {
      const left = (item.t / dur) * 100;
      const width = Math.max(1.2, (item.dur / dur) * 100);
      return `<div class="tl-clip ${lanes[id]}" style="left:${left}%;width:${width}%" title="${item.name} · ${item.t.toFixed(2)}s">${item.name}</div>`;
    }).join('');
  };

  setLane('laneV1', build.v1);
  setLane('laneV2', build.v2);
  setLane('laneSub', build.sub);
  setLane('laneV3', state.appliedVfx.map((v) => ({ name: v.preset, t: v.t, dur: v.dur })));
  setLane('laneA1', build.audio ? [{ name: 'midnight_atari_master.wav', t: 0, dur: Math.min(dur, build.audio.dur) }] : []);

  document.querySelectorAll('#laneV3 .tl-clip').forEach((el) => {
    el.addEventListener('click', () => {
      const preset = VFX_PRESETS.find((p) => p.name === el.textContent);
      if (preset) selectVfxPreset(preset);
    });
  });

  const playhead = $('tlPlayhead');
  if (playhead) playhead.style.left = (state.currentTime / dur) * 100 + '%';
}

/* ---------------- Viewer / playback ---------------- */

function updateTransportUI() {
  $('viewerTimecode').textContent = fmtTC(state.currentTime);
  $('transportDurLabel').textContent = `${state.currentTime.toFixed(1)}s / ${state.duration.toFixed(1)}s`;
  const scrub = $('timelineScrubber');
  if (scrub && document.activeElement !== scrub) {
    scrub.value = String(Math.round((state.currentTime / state.duration) * 1000));
  }
  const playhead = $('tlPlayhead');
  if (playhead) playhead.style.left = (state.currentTime / state.duration) * 100 + '%';
}

function renderFrame(nowSec) {
  const t = state.currentTime;
  applyLook(t);

  if (state.compare) {
    const w = VIEW.w;
    const h = VIEW.h;
    mainCtx.save();
    mainCtx.beginPath();
    mainCtx.rect(0, 0, w / 2, h);
    mainCtx.clip();
    mainCtx.drawImage(rawCanvas, 0, 0);
    mainCtx.restore();
    mainCtx.strokeStyle = 'rgba(255,255,255,0.8)';
    mainCtx.lineWidth = 1;
    mainCtx.beginPath();
    mainCtx.moveTo(w / 2, 0);
    mainCtx.lineTo(w / 2, h);
    mainCtx.stroke();
    mainCtx.font = '600 9px "SF Mono", monospace';
    mainCtx.fillStyle = 'rgba(255,255,255,0.6)';
    mainCtx.fillText('BEFORE', 10, 16);
    mainCtx.fillStyle = 'rgba(255,255,255,0.8)';
    mainCtx.fillText('AFTER', w / 2 + 10, 16);
  }

  drawLyricsOnFrame(mainCtx, VIEW.w, VIEW.h, t);

  if (hitFlash > 0.01) {
    mainCtx.fillStyle = `rgba(255,250,242,${hitFlash * 0.4})`;
    mainCtx.fillRect(0, 0, VIEW.w, VIEW.h);
    hitFlash *= 0.82;
  }

  drawSafeGuides(mainCtx, VIEW.w, VIEW.h);
}

let lastTick = performance.now();

/* Adaptive preview resolution: heavy optical passes cost real milliseconds on
   integrated GPUs. Drop the backing-store scale before dropping frames, and
   climb back up when there is headroom. */
const QUALITY_STEPS = [1, 0.8, 0.62];
let qualityIndex = 0;
let frameCostAvg = 16;
let qualityCooldown = 0;

function applyRenderScale(scale) {
  const w = Math.round(VIEW.w * scale);
  const h = Math.round(VIEW.h * scale);
  if (mainCanvas.width === w && mainCanvas.height === h) return;
  mainCanvas.width = w;
  mainCanvas.height = h;
  mainCtx.setTransform(scale, 0, 0, scale, 0, 0);
  mainCtx.imageSmoothingQuality = 'high';
  const tag = $('previewQuality');
  if (tag) tag.textContent = `Preview ${Math.round(scale * 100)}%`;
}

function tick(now) {
  const dt = Math.min(0.1, (now - lastTick) / 1000);
  lastTick = now;
  if (state.playing) {
    state.currentTime += dt;
    if (state.currentTime >= state.duration) state.currentTime -= state.duration;
  }
  const frameStart = performance.now();
  renderFrame(now / 1000);
  const cost = performance.now() - frameStart;
  frameCostAvg = frameCostAvg * 0.9 + cost * 0.1;
  qualityCooldown = Math.max(0, qualityCooldown - 1);
  if (qualityCooldown === 0) {
    if (frameCostAvg > 26 && qualityIndex < QUALITY_STEPS.length - 1) {
      qualityIndex += 1;
      applyRenderScale(QUALITY_STEPS[qualityIndex]);
      qualityCooldown = 90;
    } else if (frameCostAvg < 12 && qualityIndex > 0) {
      qualityIndex -= 1;
      applyRenderScale(QUALITY_STEPS[qualityIndex]);
      qualityCooldown = 150;
    }
  }
  if (now - lastUiUpdate > 60) {
    lastUiUpdate = now;
    updateTransportUI();
    drawWaveform();
  }
  requestAnimationFrame(tick);
}

/* ---------------- Bridge ---------------- */

async function dispatch(action, payload) {
  try {
    const res = await fetch('/api/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });
    const data = await res.json();
    if (data.luaSnippet) setLua(data.luaSnippet);
    return data;
  } catch (e) {
    setLua(`-- Local mode (server unreachable)\n-- action: ${action}\n-- payload: ${JSON.stringify(payload, null, 2)}`);
    return null;
  }
}

async function refreshBridgeStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    const installed = data.scriptInstalled;
    $('bridgeStatusText').textContent = installed ? 'Bridge installed' : 'Bridge ready';
    $('bridgeStatusDot').style.background = installed ? '#10b981' : '#f59e0b';
    $('bridgeStatusDot').style.boxShadow = `0 0 8px ${installed ? '#10b981' : '#f59e0b'}`;
    $('osBadge').textContent = `${data.osPlatform} • Native Fusion Engine`;
  } catch (e) {
    $('bridgeStatusText').textContent = 'Bridge offline';
  }
}

async function installBridge() {
  const box = $('installResultBox');
  box.textContent = 'Installing…';
  try {
    const res = await fetch('/api/install-bridge', { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      box.textContent = `✓ Installed bridge + ${data.installedMacros.length} native macros to Resolve Free 21.1.1`;
      showToast('Bridge + native Fusion macros installed');
      refreshBridgeStatus();
    } else {
      box.textContent = 'Install failed: ' + (data.error || 'unknown error');
    }
  } catch (e) {
    box.textContent = 'Could not reach local server. Download the .lua file and copy it manually.';
  }
}


/* ============================================================================
   9b. STYLE LAB — render candidates at identical timestamps
   ========================================================================== */

const labThumbCanvas = makeCanvas(VIEW.w, VIEW.h);
const labThumbCtx = labThumbCanvas.getContext('2d');

const labState = { open: false, kind: 'vfx', candidates: [], times: [1.55, 2.55, 3.55] };

function renderLookToBuffer(preset, time) {
  const prev = state.selectedVfx;
  const prevTime = state.currentTime;
  const prevScene = state.scene;
  // The slate and user uploads make optical differences hard to judge; render
  // the comparison set on the stage plate so halation / grain / streak read.
  if (prevScene === 'lyric_canvas' || prevScene === 'upload') state.scene = 'music_video';
  state.selectedVfx = preset;
  state.currentTime = time;
  applyLook(time);
  labThumbCtx.clearRect(0, 0, VIEW.w, VIEW.h);
  labThumbCtx.drawImage(mainCanvas, 0, 0);
  state.selectedVfx = prev;
  state.currentTime = prevTime;
  state.scene = prevScene;
}

function candidateSet(kind) {
  if (kind === 'lyrc') {
    const favs = LYRC_PRESETS.filter((p) => ['duet', 'tiledwave', 'deepfocus', 'redline'].includes(p.id));
    const rest = LYRC_PRESETS.filter((p) => p.cat === 'Minimal' || p.cat === 'Layered');
    return [...favs, ...rest.slice(0, 4)].slice(0, 8).map((p) => ({
      id: p.id, name: p.name, spec: p.cat.toUpperCase(), desc: p.desc, preset: p, kind: 'lyrc'
    }));
  }
  const picks = ['print2383', 'bleach', 'dayfornight', 'stepprint', 'snorricam', 'pvm', 'vhs', 'splitdiopter'];
  return picks.map((id) => {
    const p = VFX_PRESETS.find((x) => x.id === id) || VFX_PRESETS[0];
    return { id: p.id, name: p.name, spec: p.spec, desc: p.desc, preset: p, kind: 'vfx' };
  });
}

function renderStyleLab() {
  const grid = $('styleLabGrid');
  if (!grid) return;
  const candidates = candidateSet(labState.kind);
  labState.candidates = candidates;
  grid.innerHTML = candidates.map((c) => `
    <div class="sl-card" data-lab-id="${c.id}">
      <div class="sl-thumbs">
        ${labState.times.map((_, i) => `<canvas data-thumb="${c.id}-${i}" width="240" height="135"></canvas>`).join('')}
      </div>
      <div class="sl-card-body">
        <div class="sl-card-title">
          <span>${c.name}</span>
          <span class="sl-card-spec">${c.spec}</span>
        </div>
        <div class="sl-card-desc">${c.desc}</div>
      </div>
    </div>`).join('');

  // paint thumbs synchronously — the canvases already exist with fixed sizes
  candidates.forEach((cand) => {
    labState.times.forEach((time, i) => {
      const el = grid.querySelector(`[data-thumb="${cand.id}-${i}"]`);
      if (!el) return;
      if (cand.kind === 'lyrc') {
        const prevLyric = state.lyricPreset;
        state.lyricPreset = cand.preset;
        renderLookToBuffer(state.selectedVfx, time);
        drawLyricsOnFrame(labThumbCtx, VIEW.w, VIEW.h, time);
        state.lyricPreset = prevLyric;
      } else {
        renderLookToBuffer(cand.preset, time);
      }
      const ctx = el.getContext('2d');
      ctx.clearRect(0, 0, el.width, el.height);
      ctx.drawImage(labThumbCanvas, 0, 0, VIEW.w, VIEW.h, 0, 0, el.width, el.height);
    });
  });
  // restore the live monitor to its own state after the off-screen renders
  renderFrame(performance.now() / 1000);

  grid.querySelectorAll('.sl-card').forEach((card) => {
    card.addEventListener('click', () => {
      const cand = labState.candidates.find((c) => c.id === card.dataset.labId);
      if (!cand) return;
      if (cand.kind === 'lyrc') {
        state.lyricPreset = cand.preset;
        updateLyricContextBar();
        renderLyrcGallery();
        showToast(`Applied style: ${cand.name}`);
      } else {
        selectVfxPreset(cand.preset, { resetIntensity: false });
        applyVfxPreset(cand.preset);
      }
      grid.querySelectorAll('.sl-card').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
    });
  });
}

function openStyleLab(kind) {
  labState.kind = kind || 'vfx';
  $('styleLab').classList.remove('hidden');
  document.querySelectorAll('.sl-tab').forEach((t) => t.classList.toggle('active', t.dataset.lab === labState.kind));
  $('styleLabTitle').textContent = labState.kind === 'vfx' ? 'Optical looks, same three beats' : 'Kinetic styles, same three phrases';
  $('styleLabSub').textContent = labState.kind === 'vfx'
    ? 'Eight film-craft treatments rendered at 1.55s / 2.55s / 3.55s. Click to apply to the monitor and queue the native node.'
    : 'Eight LYRC compositions at identical phrase timing. Click to apply the typography system.';
  renderStyleLab();
  if (typeof $('styleLab').scrollIntoView === 'function') $('styleLab').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initStyleLab() {
  $('openStyleLabBtn').addEventListener('click', () => openStyleLab('vfx'));
  const inline = $('openStyleLabInlineBtn');
  if (inline) inline.addEventListener('click', () => openStyleLab('vfx'));
  $('styleLabCloseBtn').addEventListener('click', () => {
    labState.open = false;
    $('styleLab').classList.add('hidden');
  });
  $('styleLabRefreshBtn').addEventListener('click', () => renderStyleLab());
  document.querySelectorAll('.sl-tab').forEach((tab) => {
    tab.addEventListener('click', () => openStyleLab(tab.dataset.lab));
  });
}

/* ============================================================================
   10. EVENT WIRING
   ========================================================================== */

function initTabs() {
  document.querySelectorAll('.main-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.main-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      state.tab = tab.dataset.tab;
      const pane = $('tab-' + state.tab);
      if (pane) pane.classList.add('active');
    });
  });
}

function initScenes() {
  document.querySelectorAll('.scene-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scene-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.scene = btn.dataset.scene;
    });
  });
  const input = $('localVideoInput');
  if (input) {
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      document.querySelectorAll('.scene-btn').forEach((b) => b.classList.remove('active'));
      state.scene = 'upload';

      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          state.userImage = img;
          state.userVideo = null;
          showToast('Still plate loaded: ' + file.name);
        };
        img.src = url;
      } else {
        const video = $('userUploadedVideo');
        video.src = url;
        video.style.display = 'block';
        video.loop = true;
        video.muted = true;
        video.play().catch(() => {});
        state.userVideo = video;
        state.userImage = null;
        showToast('Loaded ' + file.name + ' — preview now reads your footage');
      }
    });
  }
}

function initVfxTab() {
  document.querySelectorAll('#vfxCategoryTabs .vfx-subtab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#vfxCategoryTabs .vfx-subtab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      state.vfxCategory = tab.dataset.cat;
      renderVfxGrid();
    });
  });
  $('vfxSearchInput').addEventListener('input', (e) => {
    state.vfxSearch = e.target.value;
    renderVfxGrid();
  });
  $('masterIntensitySlider').addEventListener('input', (e) => {
    state.intensity = Number(e.target.value) / 100;
    $('masterIntensityVal').textContent = e.target.value + '%';
  });
  $('shakeSpeedSlider').addEventListener('input', (e) => {
    state.bpm = Number(e.target.value);
    $('shakeSpeedVal').textContent = state.bpm + ' BPM';
  });
  $('mixShakesSlider').addEventListener('input', (e) => {
    state.shutter = Number(e.target.value);
    $('mixShakesVal').textContent = state.shutter + '°';
  });
  $('mixStylizedSlider').addEventListener('input', (e) => {
    state.bloom = Number(e.target.value) / 100;
    $('mixStylizedVal').textContent = e.target.value + '%';
  });
  document.querySelectorAll('.vibe-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      $('vfxPromptInput').value = pill.dataset.prompt;
      runPromptPass(pill.dataset.prompt);
    });
  });
  $('runAiVfxBtn').addEventListener('click', () => {
    runPromptPass($('vfxPromptInput').value || 'Kodak 2383 halation');
  });
  $('clearVfxTrackBtn').addEventListener('click', () => {
    state.appliedVfx = [];
    renderTimelineTracks();
    showToast('Cleared V3 node pass');
  });
}

function initLyrcTab() {
  document.querySelectorAll('#lyrcCategoryPills .lyrc-cat-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#lyrcCategoryPills .lyrc-cat-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      state.lyricCategory = pill.dataset.lcat;
      renderLyrcGallery();
    });
  });
  $('lyricVariationBtn').addEventListener('click', () => {
    if (!state.lyricPreset.variation) return;
    state.variationSeed += 1;
    updateLyricContextBar();
    showToast(`New arrangement seed #${state.variationSeed} for ${state.lyricPreset.name}`);
  });
  $('lyricShuffleClipsBtn').addEventListener('click', () => {
    state.mediaPool = seededShuffle(state.mediaPool, Date.now() % 999);
    renderMediaPool();
    renderLyrcGallery();
    showToast('Shuffled Media Pool clips — lyric timing + beat markers locked');
    dispatch('shuffle_template_clips', {
      lyricPreset: state.lyricPreset.id,
      variationSeed: state.variationSeed,
      tempo: state.bpm,
      clipOrder: state.mediaPool.map((c) => c.name)
    });
  });
  $('lyrcFontPairSelect').addEventListener('change', (e) => {
    state.fontPair = e.target.value;
    showToast('Font pair: ' + e.target.options[e.target.selectedIndex].textContent);
  });
  $('lyrcAlignSelect').addEventListener('change', (e) => {
    state.align = e.target.value;
  });
  $('lyrcBackdropSelect').addEventListener('change', (e) => {
    state.backdrop = e.target.value;
  });
  $('lyricsRawInput').value = state.lyricsText;
  $('lyricsRawInput').addEventListener('input', (e) => {
    state.lyricsText = e.target.value;
    syncLyrics();
  });
  $('loadSampleLyricsBtn').addEventListener('click', () => {
    state.lyricsText = DEFAULT_LYRICS;
    $('lyricsRawInput').value = DEFAULT_LYRICS;
    $('captionInputLabel').textContent = 'Lyrics / Transcript Lines';
    $('songTemplateTitle').textContent = 'midnight_atari.wav • 138 BPM (8 Phrases + Cut Markers)';
    syncLyrics();
    showToast('Loaded song hook + template');
  });
  $('loadSampleTalkingBtn').addEventListener('click', () => {
    state.lyricsText = DEFAULT_TALKING;
    $('lyricsRawInput').value = DEFAULT_TALKING;
    $('captionInputLabel').textContent = 'Transcript Lines (talking head)';
    $('songTemplateTitle').textContent = 'brand_episode_04.mp4 • 36s (5 phrases)';
    state.lyricPreset = LYRC_PRESETS.find((p) => p.id === 'hormozi');
    updateLyricContextBar();
    renderLyrcGallery();
    syncLyrics();
    showToast('Loaded editorial script + Hormozi brand captions');
  });
  $('autoSyncLyricsBtn').addEventListener('click', () => {
    syncLyrics();
    showToast('Phrases re-synced to ' + state.bpm + ' BPM grid');
  });
  $('capPrimaryColor').addEventListener('input', (e) => { state.primaryColor = e.target.value; });
  $('capAccentColor').addEventListener('input', (e) => {
    state.accentColor = e.target.value;
    document.documentElement.style.setProperty('--accent-primary', e.target.value);
  });
  $('capFontSizeSlider').addEventListener('input', (e) => { state.fontSize = Number(e.target.value) / 100; });
  $('capPosYSlider').addEventListener('input', (e) => { state.posY = Number(e.target.value) / 100; });
  $('exportSrtBtn').addEventListener('click', downloadSrt);
  $('pushCaptionsResolveBtn').addEventListener('click', async () => {
    const lines = state.cues.map((c) => ({ startSec: c.start, endSec: c.end, text: c.text }));
    showToast('Pushing ' + lines.length + ' timed phrases to Resolve…');
    const data = await dispatch('add_captions_lyrics', {
      lines,
      style: state.lyricPreset.name,
      presetId: state.lyricPreset.id,
      variationSeed: state.variationSeed,
      fontPair: state.fontPair,
      alignment: state.align,
      backdropMode: state.backdrop,
      macro: 'VFXKit_LyrcKineticEngine.setting'
    });
    showToast(data && data.liveBridgeConnected ? 'Captions placed on timeline' : 'Lua snippet ready for Resolve console');
  });
}

function initSilenceTab() {
  $('silenceDbSlider').addEventListener('input', (e) => {
    state.silenceGate = Number(e.target.value);
    $('silenceDbVal').textContent = state.silenceGate + ' dB';
    refreshSilenceUI();
  });
  $('silenceMinMsSlider').addEventListener('input', (e) => {
    state.silenceMinMs = Number(e.target.value);
    $('silenceMinMsVal').textContent = state.silenceMinMs + ' ms';
    refreshSilenceUI();
  });
  $('silencePadMsSlider').addEventListener('input', (e) => {
    state.silencePadMs = Number(e.target.value);
    $('silencePadMsVal').textContent = state.silencePadMs + ' ms';
    refreshSilenceUI();
  });
  $('autoZoomJumpCut').addEventListener('change', (e) => { state.autoReframe = e.target.checked; });
  $('jCutOverlap').addEventListener('change', (e) => { state.jcut = e.target.checked; });
  $('applySilenceCutBtn').addEventListener('click', executeSilenceCut);
  $('silenceWaveformCanvas').addEventListener('click', (ev) => {
    const canvas = ev.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const ratio = (ev.clientX - rect.left) / rect.width;
    const total = state.segments[state.segments.length - 1].end;
    const time = ratio * total;
    const seg = state.segments.find((s) => time >= s.start && time < s.end);
    if (seg) {
      state.cutOverrides[seg.id] = !isCut(seg);
      refreshSilenceUI();
    }
  });
}

function initMediaPoolTab() {
  document.querySelectorAll('.director-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.director-card').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      state.director = card.dataset.director;
    });
  });
  document.querySelectorAll('#mediaPoolBinTabs .mp-bin').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mediaPoolBinTabs .mp-bin').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.poolBin = btn.dataset.bin;
      renderMediaPool();
    });
  });
  $('mvBpmInput').addEventListener('input', (e) => {
    state.bpm = clamp(Number(e.target.value) || 138, 60, 220);
    $('shakeSpeedSlider').value = state.bpm;
    $('shakeSpeedVal').textContent = state.bpm + ' BPM';
    renderTimelineTracks();
  });
  $('mvPacingSelect').addEventListener('change', (e) => { state.mvPacing = e.target.value; renderTimelineTracks(); });
  $('mvAutoVfxSelect').addEventListener('change', (e) => {
    state.mvVfx = e.target.value;
    const map = { drill: 'print2383', grunge: 'bleach', crt: 'pvm', none: null };
    if (map[state.mvVfx]) selectVfxPreset(VFX_PRESETS.find((p) => p.id === map[state.mvVfx]));
  });
  $('vlogBrollFreq').addEventListener('change', (e) => { state.vlogBroll = e.target.value; });
  $('vlogPolishMode').addEventListener('change', (e) => { state.vlogPolish = e.target.value; });
  $('syncMediaPoolBtn').addEventListener('click', async () => {
    showToast('Scanning Media Pool bins…');
    const data = await dispatch('scan_media_pool', { bins: ['Performance', 'B-Roll', 'Talking Head', 'Audio'] });
    showToast(data && data.bridgeResponse ? 'Media Pool synced from Resolve' : 'Showing cached bin index (bridge idle)');
    renderMediaPool();
  });
  $('addCustomPoolClipBtn').addEventListener('click', () => {
    const n = state.mediaPool.length + 1;
    const bin = state.poolBin === 'ALL' ? 'B-Roll' : state.poolBin;
    state.mediaPool.push({
      id: 'X' + String(n).padStart(3, '0'),
      name: `X${String(n).padStart(3, '0')}_import_${bin.toLowerCase().replace(/\s/g, '_')}`,
      bin,
      dur: 4 + Math.random() * 6,
      fps: 24,
      color: '#f59e0b',
      tag: bin === 'Audio' ? 'Audio' : bin
    });
    poolIncluded.add('X' + String(n).padStart(3, '0'));
    renderMediaPool();
    renderTimelineTracks();
    showToast('Added test Media Pool item');
  });
  $('autoAssembleBtn').addEventListener('click', async () => {
    const payload = {
      mode: state.director,
      bpm: state.bpm,
      pacing: state.mvPacing,
      treatment: state.mvVfx,
      broll: state.vlogBroll,
      polish: state.vlogPolish,
      clipOrder: state.mediaPool.filter((c) => poolIncluded.has(c.id)).map((c) => c.name)
    };
    showToast('Assembling timeline from Media Pool…');
    const data = await dispatch('auto_edit_timeline', payload);
    state.timelineTitle = state.director === 'music_video' ? `AI_MV_${state.bpm}BPM` : 'AI_VLOG_ROUGH_CUT';
    $('activeTimelineTitle').textContent = `Timeline 3 — ${state.timelineTitle}`;
    renderTimelineTracks();
    showToast(data && data.liveBridgeConnected ? 'Timeline assembled in Resolve Free' : 'Lua timeline builder ready');
  });
}

function initViewer() {
  $('playPauseBtn').addEventListener('click', () => {
    state.playing = !state.playing;
    $('playPauseBtn').textContent = state.playing ? 'Pause' : 'Play';
  });
  $('triggerHitNowBtn').addEventListener('click', () => {
    hitFlash = 1;
    showToast('Transient impulse fired');
  });
  $('timelineScrubber').addEventListener('input', (e) => {
    state.currentTime = (Number(e.target.value) / 1000) * state.duration;
    updateTransportUI();
  });
  $('aspectRatioBtn').addEventListener('click', () => {
    state.aspectGuide = !state.aspectGuide;
    $('aspectRatioBtn').textContent = state.aspectGuide ? '9:16 Guides: ON' : '9:16 Guides: OFF';
  });
  $('compareSplitBtn').addEventListener('click', () => {
    state.compare = !state.compare;
    $('compareSplitBtn').textContent = state.compare ? 'Split Wipe: ON' : 'Split Wipe: OFF';
  });
  $('openLuaDrawerBtn').addEventListener('click', () => {
    const drawer = $('luaDrawer');
    if (typeof drawer.scrollIntoView === 'function') drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showToast('Bridge console below the timeline');
  });
  $('copyLuaBtn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(luaText);
      showToast('Lua copied — paste in Workspace ▸ Console ▸ Lua');
    } catch (e) {
      showToast('Copy blocked by browser — select the text manually');
    }
  });
  $('toggleCompactBtn').addEventListener('click', () => {
    const root = $('workspaceRoot');
    root.classList.toggle('compact-dock');
    const on = root.classList.contains('compact-dock');
    $('compactBtnLabel').textContent = on ? 'Exit Pop-Up Dock' : 'Pop-Up Dock Mode';
    showToast(on ? 'Compact dock: keep beside the Resolve viewer' : 'Full workspace');
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      state.playing = !state.playing;
      $('playPauseBtn').textContent = state.playing ? 'Pause' : 'Play';
    }
    if (e.code === 'ArrowRight') state.currentTime = Math.min(state.duration, state.currentTime + 0.5);
    if (e.code === 'ArrowLeft') state.currentTime = Math.max(0, state.currentTime - 0.5);
  });
}

function initBridgeModal() {
  $('openBridgeModalBtn').addEventListener('click', () => $('bridgeModal').classList.remove('hidden'));
  $('closeBridgeModalBtn').addEventListener('click', () => $('bridgeModal').classList.add('hidden'));
  $('bridgeModal').addEventListener('click', (e) => {
    if (e.target.id === 'bridgeModal') $('bridgeModal').classList.add('hidden');
  });
  $('installBridgeNowBtn').addEventListener('click', installBridge);
}

/* ============================================================================
   11. BOOT
   ========================================================================== */

function init() {
  initTabs();
  initScenes();
  initVfxTab();
  initLyrcTab();
  initSilenceTab();
  initMediaPoolTab();
  initViewer();
  initBridgeModal();
  initStyleLab();

  renderVfxGrid();
  renderLyrcGallery();
  updateLyricContextBar();
  renderCueList();
  refreshSilenceUI();
  renderMediaPool();
  renderTimelineTracks();
  updateTransportUI();
  refreshBridgeStatus();

  const countLabel = document.querySelector('[data-tab="vfx"] .tab-meta');
  if (countLabel) countLabel.textContent = `${VFX_PRESETS.length} Film & Rig Presets`;
  const allTab = document.querySelector('#vfxCategoryTabs [data-cat="ALL"]');
  if (allTab) allTab.textContent = `All (${VFX_PRESETS.length})`;

  selectVfxPreset(VFX_PRESETS[0], { resetIntensity: false });
  state.intensity = 0.72;
  $('masterIntensitySlider').value = 72;
  $('masterIntensityVal').textContent = '72%';

  setLua(`-- PulseVFX Studio · DaVinci Resolve Free 21.1.1
-- 1. Run VFXKit_ResolveFree_Bridge from Workspace ▸ Scripts
-- 2. Keep this panel open beside the Resolve viewer
-- 3. Apply any preset or cut — commands arrive in ~50ms
-- Bridge mailbox: ~/.vfxkit-resolve-free/request.lua`);

  requestAnimationFrame(tick);
}

init();
