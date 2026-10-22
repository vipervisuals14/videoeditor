/* Dead-selector audit: every simple rule in styles.css is matched against the
 * real DOM. A rule that matches nothing after a restructure is either dead
 * weight or — worse — a sign the markup moved and the style no longer lands. */
import fs from 'node:fs';
import path from 'node:path';
import { boot, PUB } from './harness.mjs';

const css = fs.readFileSync(path.join(PUB, 'styles.css'), 'utf8');
// boot the real page so JS-rendered markup (cards, stack rows) exists too
const { document: doc } = boot();
// The browser opens on six section buttons: open one before auditing row
// styles, or every card rule would look dead.
const section = doc.querySelector('#fxSectionBar .fx-section-btn');
if (section) section.click();
const cards = doc.querySelectorAll('#tab-vfx .vfx-card');
if (cards[0]) cards[0].querySelector('.vfx-apply-btn').click();
if (cards[1]) cards[1].querySelector('.vfx-apply-btn').click();

// flatten @media blocks away, then pull every "selector { ... }" pair
const flat = css.replace(/@[a-z-]+[^{]*\{/g, ' ');
const rules = [...flat.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim())
  .filter((sel) => !sel.startsWith('@') && !sel.startsWith('/*'));

const critical = [
  '.app-window', '.win-dots', '.panel-label', '.stage-lower', '.transport-key',
  '.key-play', '.key-pause', '.key-stop', '.key-send',
  '#tab-vfx .vfx-card .vfx-apply-btn', '#tab-vfx .vfx-card .fx-name',
  '.stack-panel .layer-row', '.vfx-stack-badge', '.install-strip', '.install-steps',
  '.stage-detail .kf-body-grid', '.stage-detail .kf-canvas-wrap',
  '.stage-wrap > .timeline-card', '.rail-item.active .rail-label'
];

let dead = 0;
const deadList = [];
const seen = new Set();
for (const sel of rules) {
  const each = sel.split(',').map((s) => s.trim()).filter(Boolean);
  for (const one of each) {
    if (seen.has(one)) continue;
    seen.add(one);
    if (/[:@]/.test(one)) continue;          // pseudo states need interaction
    let hits = 0;
    try { hits = doc.querySelectorAll(one).length; } catch { hits = -1; }
    if (hits === 0) { dead++; deadList.push(one); }
  }
}
console.log(`rules: ${seen.size}   matching nothing: ${dead}`);
console.log(deadList.slice(0, 40).join('\n'));
// The preset row has been rebuilt twice; these assert the LAST word in the file
// is the sane one, so a stale earlier rule can never quietly win again.
// Tiny cascade model: for a target selector variant, find every rule whose
// selector list contains it and let specificity decide, with source order as
// the tie-break. Good enough to catch "a stale rule still wins".
const spec = (sel) => {
  const id = (sel.match(/#[\w-]+/g) || []).length;
  const cls = (sel.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) || []).length;
  const tag = (sel.match(/(^|[\s>+~])[a-z][\w-]*/g) || []).length;
  return id * 100 + cls * 10 + tag;
};
function computedFor(target, prop) {
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = [...body.matchAll(/([^{}]+)\{([^}]*)\}/g)];
  let best = null;
  blocks.forEach(([, selList, decls], order) => {
    const sels = selList.split(',').map((x) => x.trim());
    const exact = sels.filter((x) => x === target);
    if (!exact.length) return;
    const m = decls.match(new RegExp('(?:^|;)\\s*' + prop + '\\s*:\\s*([^;]+)'));
    if (!m) return;
    const score = [Math.max(...exact.map(spec)), order];
    if (!best || score[0] > best.score[0] || (score[0] === best.score[0] && score[1] > best.score[1])) {
      best = { value: m[1].trim(), score };
    }
  });
  return best && best.value;
}
const rowDisplay = computedFor('.popup-panel #tab-vfx .vfx-card', 'display');
const rowHeight = computedFor('.popup-panel #tab-vfx .vfx-card', 'height');
const checks = [
  ['preset rows resolve to a grid row', rowDisplay === 'grid', rowDisplay],
  ['preset rows resolve to 40px', /^40px$/.test(String(rowHeight)), rowHeight]
];
for (const [label, ok, got] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : ` (got ${got})`}`);
  if (!ok) process.exitCode = 1;
}

const missing = critical.filter((sel) => doc.querySelectorAll(sel).length === 0);
console.log('\ncritical selectors missing from the DOM:', missing.length ? missing : 'none');
process.exit(missing.length ? 1 : 0);
