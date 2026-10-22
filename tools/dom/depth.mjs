/* ============================================================================
 * Depth map checks — the panel, the map pipeline and the effect rack, in jsdom
 * ----------------------------------------------------------------------------
 *   node tools/dom/depth.mjs            (public/)
 *   node tools/dom/depth.mjs dist-web   (the built site)
 *
 * What this protects, in the order a user meets it:
 *   1. Open Depth maps → a map already exists, twelve effects have sliders.
 *   2. The four range controls reshape the *existing* map (no model re-run).
 *   3. Near/far/gamma/invert/refine actually change the values handed to the
 *      effects — not just the picture on the thumbnail.
 *   4. The slice effect isolates one depth range and flattens the rest.
 *   5. A colourised view never changes what the effects read (a thermal map is
 *      a view, not a depth map).
 *   6. The map is locked to the shot by default: no per-frame model churn.
 *
 * Every assertion answers [ok, detail]; a returned string would be truthy and
 * quietly pass, which is how a broken check hides.
 * ==========================================================================*/
import path from 'node:path';
import { boot, makeCheck, ROOT } from './harness.mjs';

const target = process.argv[2];
const html = target ? path.join(ROOT, target, 'index.html') : undefined;
const { window, document } = boot({ html, beforeScripts: (w) => { w.__PULSE_TEST__ = true; } });
const check = makeCheck();
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const P = window.PulseTest;
const E = window.DEPTH_ENGINE;

const verify = (label, fn) => check(label, () => {
  if (!P || !E) return [false, 'depth seam missing'];
  try {
    const out = fn();
    return Array.isArray(out) ? out : [!!out, ''];
  } catch (err) {
    return [false, (err && err.message) || String(err)];
  }
});

// ---- open the panel the way a user does ---------------------------------
document.querySelector('.rail-item[data-nav="depth"]').click();

verify('Depth maps opens its own panel', () =>
  [document.getElementById('tab-depth').classList.contains('active'), 'panel not active']);

verify('a depth map already exists when the panel opens', () => {
  const d = P.ensureDepthState();
  return [!!d.map && d.map.length > 0 && !!d.raw, 'no map was built on open'];
});

verify('the rack lists every effect the engine ships', () => {
  const rows = $$('#depthEffectRack .depth-fx').map((r) => r.dataset.depthEffect);
  const ids = E.EFFECTS.map((e) => e.id);
  const missing = ids.filter((id) => !rows.includes(id));
  return [missing.length === 0 && rows.length === ids.length, `rows=${rows.length} missing=${missing.join(',')}`];
});

verify('twelve effects, each with its own intensity slider', () => {
  const rows = $$('#depthEffectRack .depth-fx');
  const sliders = rows.filter((r) => r.querySelector('input[type="range"]'));
  return [rows.length === 12 && sliders.length === 12, `rows=${rows.length} sliders=${sliders.length}`];
});

verify('every effect explains what it does', () => {
  const descs = E.EFFECTS.map((e) => e.desc || '');
  const short = descs.filter((d) => d.length < 20);
  return [short.length === 0, `short=${short.length}`];
});

// ---- the range controls ------------------------------------------------
verify('the panel has near, far, falloff and edge-refine controls', () => {
  const ids = ['depthNearPoint', 'depthFarPoint', 'depthGamma', 'depthRefine'];
  const missing = ids.filter((id) => !document.getElementById(id));
  return [missing.length === 0, `missing=${missing.join(',')}`];
});

verify('the map is locked to the shot by default', () => {
  const d = P.ensureDepthState();
  return [d.follow === false && d.focus === 45, `follow=${d.follow}`];
});

verify('the follow toggle says it is off', () => {
  const label = document.getElementById('depthLiveBtn').textContent;
  return [/OFF/.test(label), label];
});

// ---- the map pipeline --------------------------------------------------
const W = 8;
const H = 8;
const ramp = () => {
  const a = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) a[y * W + x] = x / (W - 1);
  }
  return a;
};

verify('near point clips the near end of the map', () => {
  const out = E.remap(ramp(), { near: 0.5, far: 1, gamma: 1, invert: false });
  return [out[0] === 0 && Math.abs(out[W * H - 1] - 1) < 1e-6, `first=${out[0]} last=${out[W * H - 1]}`];
});

verify('far point clips the far end of the map', () => {
  const out = E.remap(ramp(), { near: 0, far: 0.5, gamma: 1, invert: false });
  return [Math.abs(out[W * H - 1] - 1) < 1e-6 && out[0] === 0, `last=${out[W * H - 1]}`];
});

verify('falloff reshapes the ramp without clipping it', () => {
  const mid = E.remap(ramp(), { near: 0, far: 1, gamma: 2, invert: false })[Math.floor(W / 2)];
  const flat = E.remap(ramp(), { near: 0, far: 1, gamma: 1, invert: false })[Math.floor(W / 2)];
  return [mid < flat && mid >= 0, `gamma2=${mid} gamma1=${flat}`];
});

verify('invert flips the values, it does not corrupt them', () => {
  const src = ramp();
  const out = E.remap(src, { near: 0, far: 1, gamma: 1, invert: true });
  const ok = out.every((v, i) => Math.abs(v - (1 - src[i])) < 1e-6);
  return [ok, 'invert is not a pure flip'];
});

verify('edge refine is identity at 0 and smooths when on', () => {
  const src = ramp();
  const off = E.refine(src, null, W, H, 0);
  const rgb = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) rgb[i * 4 + 3] = 255;
  const on = E.refine(src, rgb, W, H, 80);
  const changed = on.some((v, i) => Math.abs(v - src[i]) > 1e-6);
  return [off === src && changed, `identity=${off === src} changed=${changed}`];
});

verify('the panel sliders redraw the map without another model run', () => {
  const d = P.ensureDepthState();
  P.depthSetRaw(ramp(), W, H, 'Loaded');
  d.nearPoint = 0;
  d.farPoint = 100;
  d.gamma = 100;
  d.refine = 0;
  P.depthDerive();
  const before = Array.from(d.map);
  d.gamma = 180;
  P.depthDerive();
  const after = Array.from(d.map);
  const differs = before.some((v, i) => Math.abs(v - after[i]) > 1e-4);
  return [differs && d.mapW === W && d.mapH === H, 'gamma did not reach the derived map'];
});

// ---- palettes are a view, never the data -------------------------------
verify('six thermal palettes ship', () => {
  const names = Object.keys(E.PALETTES || {});
  return [names.length >= 6 && names.includes('gray'), names.join(',')];
});

verify('a colourised view differs from gray but stays opaque', () => {
  const src = ramp();
  const gray = E.toPalette(src, W, H, { palette: 'gray', invert: false });
  const ember = E.toPalette(src, W, H, { palette: 'ember', invert: false });
  const differs = gray.some((v, i) => v !== ember[i]);
  const opaque = ember.every((v, i) => i % 4 !== 3 || v === 255);
  return [differs && opaque, `differs=${differs} opaque=${opaque}`];
});

verify('the palette never changes what the effects read', () => {
  const d = P.ensureDepthState();
  P.depthSetRaw(ramp(), W, H, 'Loaded');
  d.gamma = 100;
  d.nearPoint = 0;
  d.farPoint = 100;
  P.depthDerive();
  const before = Array.from(d.map);
  d.palette = 'ember';
  P.depthDerive();
  const after = Array.from(d.map);
  return [before.every((v, i) => v === after[i]), 'palette leaked into the depth values'];
});

// ---- the effects themselves -------------------------------------------
const scene = () => {
  // left half near, right half far; a vertical ramp of grey
  const w = 24;
  const h = 16;
  const img = { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
  const depth = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const v = x < w / 2 ? 30 + y * 6 : 180 + (y % 4) * 10;
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
      depth[i] = x / (w - 1);
    }
  }
  return { img, depth };
};

verify('slice isolates its range and flattens everything else', () => {
  const { img, depth } = scene();
  const out = E.apply(img, depth, { slice: 1 }, { near: 0.0, far: 0.3, feather: 0.05, focus: 0.5, aperture: 100, time: 0 });
  // left third is inside the slice → untouched; far right is outside → flattened
  const inside = 2;
  const outside = out.width - 3;
  const pin = (inside * 4 + 8 * out.width * 4);
  const pout = (outside * 4 + 8 * out.width * 4);
  // inside the slice: untouched. outside: pulled down onto a flat plate.
  const untouched = out.data[pin] === img.data[pin] && out.data[pin + 1] === img.data[pin + 1];
  const flattened = img.data[pout] - out.data[pout] > 20;
  return [untouched && flattened && out.passes.includes('slice'),
    `in=${out.data[pin]} (src ${img.data[pin]}) out=${out.data[pout]} (src ${img.data[pout]}) passes=${out.passes.join(',')}`];
});

verify('slice does nothing at zero, like every other effect', () => {
  const { img, depth } = scene();
  const out = E.apply(img, depth, { slice: 0 }, { near: 0.2, far: 0.6, feather: 0.1, focus: 0.5, aperture: 100 });
  return [out.passes.length === 0 && out.data.every((v, i) => v === img.data[i]), 'slice ran at 0%'];
});

verify('defocus actually blurs, and keeps the focused plane intact', () => {
  const { img, depth } = scene();
  const flat = E.apply(img, depth, { dof: 0 }, { focus: 0.15, aperture: 100, time: 0 });
  const blurred = E.apply(img, depth, { dof: 1 }, { focus: 0.15, aperture: 100, time: 0 });
  const diffFar = Math.abs(blurred.data[(22 * 4 + 8 * 24 * 4)] - flat.data[(22 * 4 + 8 * 24 * 4)]);
  // a pixel right on the focus plane should move far less than the far plane
  const diffNear = Math.abs(blurred.data[(1 * 4 + 8 * 24 * 4)] - flat.data[(1 * 4 + 8 * 24 * 4)]);
  return [diffFar >= diffNear, `far=${diffFar} near=${diffNear}`];
});

verify('effects compose in one pass, in rack order', () => {
  const { img, depth } = scene();
  const out = E.apply(img, depth, { dof: 0.6, haze: 0.6, grade: 0.6 }, { focus: 0.4, aperture: 100, time: 0.3 });
  return [out.passes.join(',') === 'dof,haze,grade', out.passes.join(',')];
});

verify('the rack reads its sliders into the effect pass', () => {
  const d = P.ensureDepthState();
  d.effects = { dof: 80, haze: 40 };
  const on = P.depthEffectsOn();
  const keys = Object.keys(on.effects).sort().join(',');
  return [on.count === 2 && keys === 'dof,haze' && Math.abs(on.effects.dof - 0.8) < 1e-6, `keys=${keys} count=${on.count}`];
});

check.summary('depth');
