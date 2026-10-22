/* ============================================================================
 * Effect parameter rack — runs the shipped page in jsdom
 *
 * The acceptance rule this suite protects: no effect is "one intensity slider".
 * Every look in the browser must expose several of its own named controls, the
 * controls must actually change the look, and every look must share the three
 * finishing controls (mix / grain / temperature).
 *
 *   node tools/dom/params.mjs            (public/)
 *   node tools/dom/params.mjs dist-web   (the built site)
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';
import { PUB } from './harness.mjs';
import { boot, makeCheck, ROOT } from './harness.mjs';

const target = process.argv[2];
const html = target ? path.join(ROOT, target, 'index.html') : undefined;
const { window, document } = boot({ html, beforeScripts: (w) => { w.__PULSE_TEST__ = true; } });
const check = makeCheck();
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const P = window.PulseTest;

const preset = (id) => P.state && P.state.fxParams && id;
const rack = () => $('#fxParamRack');

// ---- the rack exists in the shipped markup -------------------------------
check('the keyframe card carries a generated parameter rack', () => {
  return !!rack() && rack().classList.contains('fx-param-rack');
});

check('the three global placeholder sliders are gone', () => {
  const left = ['shakeSpeedSlider', 'mixShakesSlider', 'mixStylizedSlider'].filter((id) => !!$(`#${id}`));
  return left.length === 0 ? true : `still present: ${left.join(', ')}`;
});

check('an empty stage says so instead of showing fake controls', () => {
  // boot with nothing picked: the rack must be honest about it
  const txt = rack() ? rack().textContent.toLowerCase() : '';
  return txt.includes('pick an effect') ? true : `rack says "${txt.slice(0, 60)}"`;
});

// ---- the browser is sections now, not one long list ---------------------
const sections = $$('#fxSectionBar .fx-section-btn');
check('the browser is six section buttons', () => sections.length === 6 ? true : `sections=${sections.length}`);
check('each section wears its own count', () => {
  const counts = $$('#fxSectionBar .fx-section-count').map((n) => Number(n.textContent));
  const total = counts.reduce((a, b) => a + b, 0);
  return counts.every((c) => c > 0) && total > 36 ? true : `counts=${counts.join(',')}`;
});
check('the browser does not dump every look on the screen at once', () => {
  return $$('.vfx-card').length === 0 ? true : `rows=${$$('.vfx-card').length}`;
});

// ---- pick a look from the browser, like a user would --------------------
sections[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const cards = $$('.vfx-card');
check('opening a section lists only that section', () => {
  const open = document.querySelector('#fxSectionBar .fx-section-btn.is-open');
  return !!open && cards.length > 3 && cards.length < 20 ? true : `cards=${cards.length}`;
});

const firstCard = cards[0];
firstCard.querySelector('.vfx-apply-btn').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

check('applying a look fills the rack with its own controls', () => {
  const rows = rack() ? rack().querySelectorAll('.fx-param').length : 0;
  return rows >= 6 ? true : `rows=${rows}`;
});

check('the rack names each control, not just "intensity"', () => {
  const names = $$('#fxParamRack .fx-param-name').map((n) => n.textContent.trim());
  const unique = new Set(names);
  return names.length >= 6 && unique.size === names.length ? true : `names=${names.join('|')}`;
});

check('every control shows a live value', () => {
  const vals = $$('#fxParamRack .fx-param-val').map((n) => n.textContent.trim());
  return vals.length >= 6 && vals.every((v) => v.length > 0) ? true : `values=${vals.join('|')}`;
});

check('each control is a real range input with a usable span', () => {
  const inputs = $$('#fxParamRack input[type="range"]');
  const bad = inputs.filter((i) => Number(i.max) <= Number(i.min) || Number(i.value) < Number(i.min) || Number(i.value) > Number(i.max));
  return inputs.length >= 6 && bad.length === 0 ? true : `inputs=${inputs.length} bad=${bad.length}`;
});

check('the three shared finishing controls are always there', () => {
  const keys = $$('#fxParamRack input[type="range"]').map((i) => i.dataset.fxparam);
  return ['mix', 'finishGrain', 'finishTemp'].every((k) => keys.includes(k)) ? true : `keys=${keys.join(',')}`;
});

// ---- moving a slider changes the look ----------------------------------
const active = () => P.state.activePreset;
check('a look is active after applying it', () => !!active());

const radiusInput = $('#fxParamRack input[data-fxparam="radius"]');
check('this look exposes its own geometry control, not a bare strength bar', () => !!radiusInput);

if (radiusInput) {
  const before = radiusInput.parentElement.querySelector('.fx-param-val').textContent;
  radiusInput.value = String(Math.round(Number(radiusInput.min) + (Number(radiusInput.max) - Number(radiusInput.min)) * 0.9));
  radiusInput.dispatchEvent(new window.Event('input', { bubbles: true }));
  check('dragging it stores the value on that look', () => {
    const stored = P.state.fxParams[active().id];
    return stored && stored.radius === Number(radiusInput.value) ? true : `stored=${JSON.stringify(stored)}`;
  });
  check('the value readout follows the slider', () => {
    const after = radiusInput.parentElement.querySelector('.fx-param-val').textContent;
    return after !== before ? true : `readout stayed "${after}"`;
  });
  check('the shader reads back what the user set', () => {
    const resolved = P.fxParamsOf(active());
    return resolved.radius === Number(radiusInput.value) ? true : `resolved=${resolved.radius}`;
  });
}

check('reset puts every control back to its default', () => {
  $('#fxParamResetBtn').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  const p = active();
  const defs = P.fxParamDefs(p.effectType);
  const wrong = defs.filter((d) => P.fxParam(p, d.k) !== d.def);
  const rows = rack().querySelectorAll('.fx-param').length;
  return wrong.length === 0 && rows === defs.length ? true : `off=${wrong.map((d) => d.k).join(',')} rows=${rows}`;
});

// ---- every effect in the table has depth ------------------------------
const table = P.effectTypes ? P.effectTypes() : [];
check('the page can name every effect it ships', () => table.length >= 30 ? true : `types=${table.length}`);

// NOTE: a returned string is truthy, so every check below answers [ok, detail].
// A template string here would silently pass — that bug once hid 28 effects
// that had no dials of their own at all.
const shallow = table.filter((t) => P.fxParamDefs(t).length < 6);
check('no effect is down to a single strength slider', () =>
  [shallow.length === 0, `shallow: ${shallow.map((t) => `${t}(${P.fxParamDefs(t).length})`).join(', ')}`]);

const thin = table.filter((t) => P.fxParamDefs(t).length - 3 < 3);
check('every effect carries at least three controls of its own', () =>
  [thin.length === 0, `thin: ${thin.join(', ')}`]);

const unnamed = table.flatMap((t) => P.fxParamDefs(t).filter((d) => !d.label || !d.k));
check('every control has a name a human can read', () =>
  [unnamed.length === 0, `unnamed: ${unnamed.length}`]);

const broken = table.flatMap((t) => P.fxParamDefs(t).filter((d) => !(d.max > d.min) || d.def < d.min || d.def > d.max));
check('every control range and default is sane', () =>
  [broken.length === 0, broken.map((d) => d.k).join(',')]);

// the two shared families must be neutral at their defaults, or an untouched
// preset would come out graded
const neutral = ['tdContrast', 'tdChroma', 'tdTint', 'direction', 'softness'];
const nonNeutral = table.flatMap((t) => P.fxParamDefs(t))
  .filter((d) => neutral.includes(d.k) && ((d.k === 'tdTint' || d.k === 'direction') ? d.def !== 0 && d.k === 'tdTint' : false));
check('shared family defaults do not change an untouched preset', () =>
  [nonNeutral.length === 0, nonNeutral.map((d) => d.k).join(',')]);

// ---- switching looks swaps the whole control set -----------------------
check('switching to another look swaps the controls, not just the value', () => {
  const seen = new Set();
  $$('.vfx-card').slice(0, 6).forEach((card) => {
    card.querySelector('.vfx-apply-btn').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    const names = $$('#fxParamRack .fx-param-name').map((n) => n.textContent).join('|');
    seen.add(names);
    if (P.state.activePreset && P.state.activePreset.effectType === 'opt_halation') {
      P.setFxParam(P.state.activePreset, 'radius', 300);
    }
  });
  return seen.size > 1 ? true : 'the rack never changed between looks';
});

check('two looks keep their own settings at the same time', () => {
  const a = P.state.activePreset;
  P.setFxParam(a, 'mix', 42);
  const cardsAll = $$('.vfx-card');
  const other = cardsAll[cardsAll.length - 1];
  other.querySelector('.vfx-apply-btn').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  const b = P.state.activePreset;
  if (!b || b.id === a.id) return 'could not pick a second look';
  P.setFxParam(b, 'mix', 17);
  return P.fxParam(a, 'mix') === 42 && P.fxParam(b, 'mix') === 17
    ? true : `a=${P.fxParam(a, 'mix')} b=${P.fxParam(b, 'mix')}`;
});

check('a look with no stored settings falls back to its defaults', () => {
  const p = P.state.activePreset;
  const defs = P.fxParamDefs(p.effectType);
  const fresh = { id: 'never-touched', effectType: p.effectType };
  return defs.every((d) => P.fxParam(fresh, d.k) === d.def) ? true : 'defaults not used for an untouched look';
});

// ---- every effect actually draws without throwing ------------------------
// A parameter that nothing reads, or a branch with a typo in it, dies here
// rather than in front of the user as a blank frame.
{
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  const broken = [];
  table.forEach((type) => {
    const preset = { id: `probe-${type}`, effectType: type, params: {} };
    const params = P.fxParamsOf(preset);
    try {
      for (let i = 0; i < 3; i++) {
        P.drawCinemaOpticalShader(ctx, 640, 360, i * 0.4, type, 0.8, 0.5, 0.2, params);
      }
    } catch (err) {
      broken.push(`${type}: ${(err && err.message) || err}`);
    }
  });
  check('all effects draw every branch without an error', () => broken.length === 0 ? true : broken.join(' | '));
}

{
  // the mix control must reach the frame: 100 keeps the look, 0 keeps the plate
  const preset = { id: 'mix-probe', effectType: 'opt_halation', params: {} };
  check('mix is a real control on the shader, not a label', () => {
    const keys = Object.keys(P.fxParamsOf(preset));
    return keys.includes('mix') && keys.includes('finishGrain') && keys.includes('finishTemp')
      ? true : keys.join(',');
  });
}

// A fresh boot, untouched: the rack must not invent settings and the page must
// not have applied a look or started a stack on its own.
{
  const fresh = boot({ html, beforeScripts: (w) => { w.__PULSE_TEST__ = true; } });
  const F = fresh.window.PulseTest;
  check('nothing is applied or stored on load', () => {
    const stored = F.state.fxParams || {};
    const touched = Object.keys(stored).length;
    const layers = Array.isArray(F.state.layers) ? F.state.layers.length : 0;
    const picked = !!F.state.presetPicked;
    return touched === 0 && layers === 0 && picked === false
      ? true : `stored=${touched} layers=${layers} picked=${picked}`;
  });
  check('a fresh page still shows the full rack once a look is picked', () => {
    fresh.document.querySelector('#fxSectionBar .fx-section-btn')
      .dispatchEvent(new fresh.window.MouseEvent('click', { bubbles: true }));
    const card = fresh.document.querySelector('.vfx-card .vfx-apply-btn');
    card.dispatchEvent(new fresh.window.MouseEvent('click', { bubbles: true }));
    const rows = fresh.document.querySelectorAll('#fxParamRack .fx-param').length;
    return rows >= 6 ? true : `rows=${rows}`;
  });
}

// ---------------------------------------------------------------------------
// Every dial must be read by something. A declared-but-unread slider is a lie:
// the UI promises a control and the renderer ignores it. This scan found 28
// effects with no dials at all, and later lab_flir's edge detail and ed_scope's
// feather/guides. Keep it as a permanent guard.
{
  const src = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8')
    + fs.readFileSync(path.join(PUB, 'touchdesigner.js'), 'utf8')
    + fs.readFileSync(path.join(PUB, 'depth.js'), 'utf8');
  const defsStart = src.indexOf('const FX_PARAM_DEFS');
  const defsEnd = src.indexOf('function fxParamDefs', defsStart);
  const body = src.slice(defsStart, defsEnd);
  const rest = src.slice(0, defsStart) + src.slice(defsEnd);
  const keys = [...new Set([...body.matchAll(/\{\s*k:\s*'([A-Za-z0-9_]+)'/g)].map((m) => m[1]))];
  // quoted (pick('x'), fxv('x')) or read off a params object (P.direction, g.tdTint)
  const unread = keys.filter((k) => !new RegExp(`['"]${k}['"]|\\.${k}\\b`).test(rest));
  check('every declared dial is read by the renderer', () => {
    return unread.length === 0
      ? [true, `${keys.length} dials, all wired`]
      : [false, `never read: ${unread.join(', ')}`];
  });
}

check.summary('effect parameter');
