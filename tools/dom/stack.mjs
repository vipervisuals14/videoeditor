/* ============================================================================
 * Stack + shell checks — runs the shipped page in jsdom
 *
 *   node tools/dom/stack.mjs            (public/)
 *   node tools/dom/stack.mjs dist-web   (the built site)
 * ==========================================================================*/
import path from 'node:path';
import { boot, makeCheck, ROOT } from './harness.mjs';

const target = process.argv[2];
const html = target ? path.join(ROOT, target, 'index.html') : undefined;
const { window, document, calls } = boot({ html });
const check = makeCheck();
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// ---- the shell: picture and presets are on screen at the same time --------
check('the effects tab sits in a fixed rail', () => !!$('.popup-panel') && !!$('#tab-vfx'));
check('the preset browser lives beside the preview, not below a long page', () => {
  const rail = $('.popup-panel');
  const stage = $('.stage-wrap');
  return !!rail && !!stage && rail !== stage && !rail.contains(stage);
});
check('the keyframe editor was moved under the preview', () => {
  const box = $('#keyframeEditorBox');
  const detail = $('#stageDetail');
  return !!box && !!detail && detail.contains(box) && $('.stage-wrap').contains(detail);
});
check('the stack bar is the first thing in the effects tab', () => {
  const pane = $('#tab-vfx');
  const first = [...pane.children].find((el) => el.id && el.id !== 'installSteps');
  return !!first && first.id === 'stackPanel';
});
check('the preset list scrolls inside the rail', () =>
  $('#tab-vfx').classList.contains('active') && !!$('#vfxPresetGrid'));

// ---- stacking -------------------------------------------------------------
const cards = $$('#tab-vfx .vfx-card');
check('the browser renders looks', () => cards.length >= 60, `cards=${cards.length}`);

const buttonOf = (card) => card.querySelector('.vfx-apply-btn');
// the page polls the bridge and loads recipes on boot; those are not edits
const edits = () => calls.filter((c) => String(c.url).includes('dispatch'));
check('the card button says Stack, not Apply', () => /Stack/.test(buttonOf(cards[0]).textContent));
check('booting the page sends nothing to Resolve', () => edits().length === 0, `dispatches=${edits().length}`);

cards[0].click();
check('clicking a card only previews', () =>
  edits().length === 0 && cards[0].classList.contains('selected') && $$('#laneV3 .tl-clip').length === 0);

buttonOf(cards[0]).click();
buttonOf(cards[1]).click();
buttonOf(cards[2]).click();

check('three presses stack three looks', () => {
  const chips = $$('#stackChips .stack-chip');
  return chips.length === 3 ? true : `chips=${chips.length}`;
});
check('the order is the order they were stacked', () => {
  const names = $$('#stackChips .stack-chip span').map((n) => n.textContent);
  const expected = [cards[0], cards[1], cards[2]].map((c) => c.querySelector('.vfx-card-title').textContent);
  return names.join('|') === expected.join('|') ? true : `got ${names.join(' > ')} want ${expected.join(' > ')}`;
});
check('stacked cards are badged with their pass number', () => {
  const badges = [cards[0], cards[1], cards[2]].map((c) => {
    const b = c.querySelector('.vfx-stack-badge');
    return b ? b.textContent : null;
  });
  return badges.join(',') === '1,2,3' ? true : `badges=${badges.join(',')}`;
});
check('stacking sends nothing on its own', () => edits().length === 0, `dispatches=${edits().length}`);
check('the stack panel opened itself', () => $('#stackPanel').classList.contains('open'));
check('the rack lists the passes in order', () => {
  const rows = $$('#layerRack .layer-row');
  const subs = $$('#layerRack .layer-sub').map((n) => n.textContent);
  return rows.length === 3 && /first pass/.test(subs[0]) && /pass 2/.test(subs[1]) && /pass 3/.test(subs[2])
    ? true : `rows=${rows.length} subs=${subs.join(' / ')}`;
});

// ---- sending --------------------------------------------------------------
$('#applyLayersBtn').click();
const sent = calls.filter((c) => String(c.url).includes('dispatch'));
check('Send stack makes exactly one dispatch', () => sent.length === 1, `dispatches=${sent.length}`);
const payload = sent[0] && sent[0].body;
check('the dispatch is a layer stack, not a single effect', () =>
  payload && payload.action === 'layers_apply', `action=${payload && payload.action}`);
check('all three looks travel in order', () => {
  const layers = (payload && payload.payload && payload.payload.layers) || [];
  const got = layers.map((l) => l.name).join('|');
  const want = [cards[0], cards[1], cards[2]].map((c) => c.querySelector('.vfx-card-title').textContent).join('|');
  return got === want ? true : `got ${got} want ${want}`;
});
check('each layer carries a native recipe to build', () => {
  const layers = (payload && payload.payload && payload.payload.layers) || [];
  return layers.every((l) => l.recipe && Array.isArray(l.recipe.chain) && l.recipe.chain.length > 0)
    ? true : 'a layer is missing its chain';
});
check('the send asks Resolve to replace our old nodes', () =>
  !!(payload && payload.payload && payload.payload.replace === true));

$('#applyLayersBtn').click();
check('sending twice still shows one clip on the strip', () => {
  const clips = $$('#laneV3 .tl-clip');
  const stacks = clips.filter((c) => /STACK/.test(c.textContent));
  return stacks.length === 1 ? true : `stack clips=${stacks.length} of ${clips.length}`;
});

// ---- details, reorder, clear ---------------------------------------------
$('#stackToggleBtn').click();
check('Details hides the rack again', () => !$('#stackPanel').classList.contains('open'));
$('#stackToggleBtn').click();

const rows = $$('#layerRack .layer-row');
rows[2].querySelector('[data-layer-up]').click();
check('a pass can be moved earlier in the chain', () => {
  const names = $$('#stackChips .stack-chip span').map((n) => n.textContent);
  return names[1] === rows[2].querySelector('.layer-name').textContent
    ? true : `order=${names.join(' > ')}`;
});

$('#clearLayersBtn').click();
check('Clear empties the stack', () =>
  $$('#stackChips .stack-chip').length === 0 && $('#stackSummary').textContent === 'Nothing stacked yet');
check('Clear does not touch the timeline', () => $$('#laneV3 .tl-clip').length === 1);

check.summary('stack/shell');
window.close();
process.exit(process.exitCode || 0);
