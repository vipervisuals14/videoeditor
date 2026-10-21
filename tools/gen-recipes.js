#!/usr/bin/env node
/**
 * Generates resolve-bridge/preset-recipes.json
 *
 * Every VFX preset gets an explicit native-Fusion node graph instead of the
 * single generic node the bridge used to add. The bridge is a dumb interpreter
 * of this file, so graphs can be tuned without reinstalling Lua into Resolve.
 *
 * Chain node shape (read by Handlers.apply_vfx in the bridge):
 *   { tool, set?, bg?, optional?, key?, input? }
 *   tool     — Fusion tool type, e.g. "BrightnessContrast"
 *   set      — constant inputs applied at creation
 *   bg       — wire the previous node's Output into this node's Background
 *   optional — tool may be missing on Free; skip instead of failing
 *   key      — this node's `input` receives the intensity / BezierSpline
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'public', 'touchdesigner.js');
const OUT = path.join(ROOT, 'resolve-bridge', 'preset-recipes.json');

// Minimal canvas shim: the shader module only touches document lazily.
const shimCanvas = () => ({
  width: 2, height: 2,
  getContext: () => ({
    clearRect() {}, fillRect() {}, drawImage() {}, save() {}, restore() {},
    beginPath() {}, arc() {}, ellipse() {}, fill() {}, stroke() {}, moveTo() {}, lineTo() {},
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    setTransform() {}, translate() {}, scale() {}, rotate() {}, clip() {}, rect() {},
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    putImageData() {}, createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    measureText: () => ({ width: 0 }), fillText() {}
  })
});

const sandbox = {
  window: {},
  document: { createElement: shimCanvas, hidden: false },
  Int8Array, Uint8Array, Uint8ClampedArray, Float32Array, Uint32Array, Math, Map, Set, Date, console
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(SRC, 'utf8'), sandbox, { filename: 'touchdesigner.js' });

const presets = sandbox.TD_PRESETS || sandbox.window.TD_PRESETS;
if (!Array.isArray(presets) || !presets.length) {
  console.error('could not read TD_PRESETS from public/touchdesigner.js');
  process.exit(1);
}

// ---------------------------------------------------------------- families
// Each family is a native-Fusion graph that runs on Resolve Free 21.1.1.
// `optional` tools degrade gracefully if a build lacks them.
// Kinetic lyric styles (LYRC.studio) are text comps, not filters: a TextPlus
// card is merged over the source plate and its Blend is what the panel keys.
const TEXT_MERGE = { tool: 'Merge', fg: true, source: true, key: true, input: 'Blend', scale: 0.01 };
const TEXT_CHAINS = {
  Bold: [
    { tool: 'TextPlus', set: { Size: 0.15, Style: 'Bold' } },
    { tool: 'Glow', set: { Glow: 1.0, Threshold: 0.55 }, optional: true },
    TEXT_MERGE
  ],
  Layered: [
    { tool: 'TextPlus', set: { Size: 0.12, Style: 'Bold' } },
    { tool: 'Transform', set: { Size: 1.04 }, optional: true },
    TEXT_MERGE
  ],
  Minimal: [
    { tool: 'TextPlus', set: { Size: 0.1 } },
    TEXT_MERGE
  ],
  Talking: [
    { tool: 'TextPlus', set: { Size: 0.09, Style: 'Bold' } },
    { tool: 'SoftGlow', set: { Threshold: 0.65, GlowSize: 0.6 }, optional: true },
    TEXT_MERGE
  ]
};

const FAMILIES = {
  td: {
    chain: [
      { tool: 'FastNoise', set: { Detail: 4.5, XScale: 6.5, SeetheRate: 0.42 }, optional: true },
      { tool: 'Displace', bg: true, key: true, input: 'XRefraction', scale: 0.14 }
    ],
    marker: 'Purple'
  },
  print: {
    chain: [
      { tool: 'ColorCorrector', set: { Saturation: 0 }, optional: true },
      { tool: 'BrightnessContrast', bg: true, key: true, input: 'Contrast', scale: 0.9 },
      { tool: 'Bitmap', set: { Level: 0.5 }, bg: true, optional: true }
    ],
    marker: 'Slate'
  },
  glitch: {
    chain: [
      { tool: 'ColorCorrector', set: { Saturation: 0.35 }, optional: true },
      { tool: 'BrightnessContrast', bg: true, key: true, input: 'Contrast', scale: 1.15 },
      { tool: 'Duplicator', set: { Copies: 2, Angle: 0.4 }, optional: true }
    ],
    marker: 'Slate'
  },
  optical: {
    chain: [
      { tool: 'SoftGlow', set: { Threshold: 0.55, GlowSize: 1.2 }, optional: true },
      { tool: 'Blur', bg: true, set: { BlurSize: 1.4 }, key: true, input: 'BlurSize', scale: 3.2 }
    ],
    marker: 'Cyan'
  },
  shutter: {
    chain: [
      { tool: 'Trails', set: { TrailLength: 0.35 }, optional: true },
      { tool: 'MotionBlur', bg: true, key: true, input: 'Length', scale: 0.35 }
    ],
    marker: 'Green'
  },
  film: {
    chain: [
      { tool: 'ColorCorrector', set: { Saturation: 1.04, Gain: 1.02 }, optional: true },
      { tool: 'BrightnessContrast', bg: true, key: true, input: 'Gain', scale: 1.1 },
      { tool: 'FilmGrain', set: { GrainSize: 1.5 }, bg: true, optional: true }
    ],
    marker: 'Sand'
  },
  camera: {
    chain: [
      { tool: 'CameraShake', set: { OverallStrength: 0.3, Decay: 2.2 }, optional: true },
      { tool: 'Transform', bg: true, key: true, input: 'Size', scale: 0.05 }
    ],
    marker: 'Red'
  },
  depth: {
    chain: [
      { tool: 'SoftGlow', set: { Threshold: 0.4, GlowSize: 2.4 }, optional: true },
      { tool: 'Blur', bg: true, key: true, input: 'BlurSize', scale: 4.0 },
      { tool: 'DepthMap', set: { Channel: 0 }, bg: true, optional: true }
    ],
    marker: 'Purple'
  },
  transition: {
    chain: [
      { tool: 'FastNoise', set: { Detail: 3.2, XScale: 9 }, optional: true },
      { tool: 'Displace', bg: true, key: true, input: 'XRefraction', scale: 0.18 }
    ],
    marker: 'Cyan'
  },
  grade: {
    chain: [
      { tool: 'ColorCorrector', set: { Saturation: 1.0, Contrast: 1.05 }, optional: true },
      { tool: 'BrightnessContrast', bg: true, key: true, input: 'Gain', scale: 1.0 }
    ],
    marker: 'Yellow'
  },
  editorial: {
    chain: [
      { tool: 'ColorCorrector', set: { Saturation: 1.02 }, optional: true },
      { tool: 'BrightnessContrast', bg: true, key: true, input: 'Contrast', scale: 0.7 },
      { tool: 'SoftGlow', set: { Threshold: 0.7, GlowSize: 0.8 }, bg: true, optional: true }
    ],
    marker: 'Green'
  },
  text: {
    chain: JSON.parse(JSON.stringify(TEXT_CHAINS.Bold)),
    marker: 'Yellow'
  }
};

const CATEGORY_FAMILY = {
  'TouchDesigner TOPs': 'td',
  'Data & Print TOPs': 'print',
  'Glitch & Bitmap TOPs': 'glitch',
  'Optical & Glass': 'optical',
  'Shutter & Time': 'shutter',
  'Film Lab & Grade': 'film',
  'Camera Weight': 'camera',
  'Depth & Subject': 'depth',
  'Transitions & Morphs': 'transition',
  'Editorial Polish': 'editorial',
  'Bold': 'text',
  'Layered': 'text',
  'Minimal': 'text',
  'Talking': 'text'
};

// Per-preset tuning on top of the family graph.
const TWEAK = {
  td_bandslice: { print: true },
  td_lenticular: { print: true },
  td_barcode: { print: true },
  td_bayer: { print: true },
  td_stipple: { print: true },
  td_ringstipple: { print: true },
  td_engrave: { print: true },
  td_dashfield: { print: true },
  td_ascii: { print: true },
  td_newsprint: { print: true },
  td_inkstipple: { print: true },
  td_chromableed: { glitch: true },
  td_datamosh_echo: { glitch: true },
  td_palette: { glitch: true },
  td_dirsmear: { optical: true },
  td_kaleido: { optical: true },
  tr_mirrorfold: { transition: true },
  tr_glasspush: { optical: true },
  tr_rollershutter: { shutter: true },
  tr_feedbackzoom: { optical: true }
};

// The panel's second preset set (optical / shutter / film-lab / editorial /
// lyric cards) lives in public/app.js as a plain array literal.
function readAppPresets() {
  const appPath = path.join(ROOT, 'public', 'app.js');
  if (!fs.existsSync(appPath)) return [];
  const text = fs.readFileSync(appPath, 'utf8');
  const start = text.indexOf('const VFX_PRESETS = [');
  if (start === -1) return [];
  const open = text.indexOf('[', start);
  let depth = 0;
  let end = -1;
  let inStr = null;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return [];
  try {
    return vm.runInContext('(' + text.slice(open, end + 1) + ')', sandbox) || [];
  } catch (_err) {
    return [];
  }
}

// LYRC.studio kinetic lyric styles live in public/app.js as CAPTION_STYLES.
function readCaptionStyles() {
  const appPath = path.join(ROOT, 'public', 'app.js');
  if (!fs.existsSync(appPath)) return [];
  const text = fs.readFileSync(appPath, 'utf8');
  const start = text.indexOf('const CAPTION_STYLES = [');
  if (start === -1) return [];
  const open = text.indexOf('[', start);
  let depth = 0;
  let end = -1;
  let inStr = null;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return [];
  try {
    return vm.runInContext('(' + text.slice(open, end + 1) + ')', sandbox) || [];
  } catch (_err) {
    return [];
  }
}

const allPresets = presets.slice();
for (const p of readAppPresets()) {
  if (!allPresets.some((q) => q.id === p.id)) allPresets.push(p);
}

const recipes = {};
for (const preset of allPresets) {
  const id = preset.effectType || preset.id;
  if (!id) continue;
  const name = preset.name || id;
  const category = preset.category || '';
  let familyKey = CATEGORY_FAMILY[category] || 'grade';

  const tweak = TWEAK[id];
  if (tweak) familyKey = Object.keys(tweak)[0];

  // Print-looking presets that live in another category still want the print chain
  if (preset.spec && /print|halftone|stipple|engrave|ascii|dither|barcode/i.test(String(preset.spec))) {
    familyKey = 'print';
  }

  const family = FAMILIES[familyKey] || FAMILIES.grade;
  recipes[id] = {
    label: name,
    category,
    family: familyKey,
    accent: preset.accent || '#94a3b8',
    chain: JSON.parse(JSON.stringify(family.chain)),
    marker: (preset.accent && familyKey === 'print') ? 'Slate' : family.marker
  };
}

// 20 LYRC kinetic lyric styles → native TextPlus + Merge text comps
for (const st of readCaptionStyles()) {
  if (!st || !st.id) continue;
  const familyKey = 'text';
  const chain = TEXT_CHAINS[st.category] || TEXT_CHAINS.Bold;
  recipes['lyrc_' + st.id] = {
    label: st.name,
    category: st.category,
    family: familyKey,
    accent: st.accent || '#facc15',
    chain: JSON.parse(JSON.stringify(chain)),
    marker: 'Yellow',
    lyric: true,
    variation: !!st.supportsVariation
  };
}

const byFamily = {};
for (const r of Object.values(recipes)) byFamily[r.family] = (byFamily[r.family] || 0) + 1;

const payload = {
  v: 1,
  generatedBy: 'tools/gen-recipes.js',
  target: 'DaVinci Resolve Free 21.1.1',
  count: Object.keys(recipes).length,
  // only families that actually have presets, in graph-table order
  families: Object.keys(FAMILIES).filter((f) => byFamily[f]),
  familyCounts: byFamily,
  recipes
};

fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log('wrote', path.relative(ROOT, OUT));
console.log('presets:', payload.count, '| families:', JSON.stringify(byFamily));
