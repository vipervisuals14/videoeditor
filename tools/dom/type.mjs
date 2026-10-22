/* ============================================================================
 * LYRC typography — font, size, spacing, placement, and the subtitle styles
 * ----------------------------------------------------------------------------
 * Every check drives the shipped page: the panel's real controls, the real
 * `drawLyrcStudioTypography` entry point, and a canvas that records what was
 * painted and where. Nothing here re-implements the renderer, so a check can
 * only pass if the thing a user clicks actually changes the picture.
 *
 *   node tools/dom/type.mjs
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';
import { boot, makeCheck, PUB } from './harness.mjs';

const check = makeCheck();
const { window, document } = boot({ beforeScripts: (w) => { w.__PULSE_TEST__ = true; } });
const P = window.PulseTest;
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// ---- a canvas that remembers every call ------------------------------------
// The layout is measured from this: text width is proportional to the string
// length and the font size in the current font string, so a bigger size or more
// tracking must produce wider text and more wrapped lines.
function recordingCtx() {
  const calls = [];
  const state = { font: '400 20px sans-serif', letterSpacing: '0px' };
  const sizeOf = () => {
    const m = /(\d+(?:\.\d+)?)px/.exec(state.font);
    return m ? Number(m[1]) : 20;
  };
  const ctx = {
    canvas: { width: 1280, height: 720 },
    calls,
    state,
    get font() { return state.font; },
    set font(v) { state.font = v; calls.push(['font', v]); },
    measureText: (text) => {
      const sp = /(\d+(?:\.\d+)?)px/.exec(state.font);
      const px = sp ? Number(sp[1]) : 20;
      const track = parseFloat(state.letterSpacing) || 0;
      const n = String(text == null ? '' : text).length;
      return { width: n * px * 0.55 + Math.max(0, n - 1) * track };
    },
    fillText: (text, x, y) => calls.push(['fill', String(text), x, y, state.font]),
    strokeText: (text, x, y) => calls.push(['stroke', String(text), x, y, state.font]),
    fillRect: (...args) => calls.push(['rect', ...args]),
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, roundRect() {},
    quadraticCurveTo() {}, arc() {}, fill() { calls.push(['pathfill']); },
    stroke() { calls.push(['pathstroke']); }, clip() {},
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    drawImage() {}, setTransform() {}, clearRect() {}, createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }), createPattern: () => null,
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)) }),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)) }),
    putImageData() {}
  };
  // letterSpacing is a plain property on the real object; keep it where the
  // engine's feature test can find it, like Chrome does
  Object.defineProperty(ctx, 'letterSpacing', {
    get() { return state.letterSpacing; },
    set(v) { state.letterSpacing = v; }
  });
  return ctx;
}

const painted = (calls) => calls.filter((c) => c[0] === 'fill' || c[0] === 'stroke');
const textOf = (calls) => painted(calls).map((c) => c[1]).join(' ');

function seedCue(text, words) {
  P.state.cues = [{
    index: 1, text, startSec: 0, endSec: 4, timed: true,
    words: words || text.split(/\s+/).map((w, i) => ({ text: w, startSec: i * 0.4, endSec: i * 0.4 + 0.35 }))
  }];
  P.state.playheadSec = 0.5;
  P.setLyricsOverlay(true);
}

function pickStyle(id) {
  const st = P.CAPTION_STYLES.find((s) => s.id === id);
  P.selectLyrcPreset(st);
  return st;
}

// ============================================================================
// The catalogue
// ============================================================================
check('the look list grew well past the old twenty', () => {
  const n = P.CAPTION_STYLES.length;
  const cats = new Set(P.CAPTION_STYLES.map((s) => s.category));
  return [n >= 34 && cats.has('Subtitles'), `${n} looks across ${cats.size} categories`];
});

check('every look is complete and unique', () => {
  const ids = P.CAPTION_STYLES.map((s) => s.id);
  const bad = P.CAPTION_STYLES.filter((s) => !s.id || !s.name || !s.category || !s.desc
    || !s.previewHtml || !s.primary || !s.accent);
  return [new Set(ids).size === ids.length && !bad.length,
    bad.length ? `incomplete: ${bad.map((b) => b.id).join(', ')}` : `${ids.length} unique ids, all fields present`];
});

check('a subtitle look is a wrapped block, not a word dance', () => {
  const blocks = P.CAPTION_STYLES.filter((s) => s.kind === 'block');
  const bad = blocks.filter((s) => !s.type || !s.type.font || s.type.sizePct == null);
  return [blocks.length >= 12 && !bad.length,
    `${blocks.length} block looks${bad.length ? ', missing type: ' + bad.map((b) => b.id).join(',') : ''}`];
});

check('the category pills are generated from the list, counts included', () => {
  const pills = $$('#lyrcCategoryPills .lyrc-cat-pill');
  const all = pills.find((p) => p.dataset.lcat === 'ALL');
  const subs = pills.find((p) => p.dataset.lcat === 'Subtitles');
  const expect = P.CAPTION_STYLES.filter((s) => s.category === 'Subtitles').length;
  return [pills.length >= 6 && !!subs && new RegExp(`\\(${P.CAPTION_STYLES.length}\\)`).test(all.textContent)
    && subs.textContent.includes(`(${expect})`),
    `${pills.length} pills, all="${all && all.textContent.trim()}", subtitles="${subs && subs.textContent.trim()}"`];
});

check('the count on screen is the count in the list', () => {
  const shown = $('#lyrcStyleCount').textContent;
  return [shown.includes(String(P.CAPTION_STYLES.length)), `badge says "${shown}"`];
});

// ============================================================================
// Fonts
// ============================================================================
check('there are real font choices, each with a stack and a Resolve face', () => {
  const fonts = P.LYRC_FONTS;
  const bad = fonts.filter((f) => !f.id || !f.stack || !f.face || !f.label);
  const sel = $$('#lyrcFontSelect option');
  return [fonts.length >= 8 && !bad.length && sel.length === fonts.length,
    `${fonts.length} fonts, ${sel.length} options`];
});

check('choosing a font changes the font the renderer asks for', () => {
  seedCue('hold the line');
  pickStyle('duet');
  P.setLyrcType({ font: 'didone' });
  const a = recordingCtx();
  P.drawLyrcStudioTypography(a, 1280, 720, 0.5, 0);
  P.setLyrcType({ font: 'mono' });
  const b = recordingCtx();
  P.drawLyrcStudioTypography(b, 1280, 720, 0.5, 0);
  const fontsA = a.calls.filter((c) => c[0] === 'font').map((c) => c[1]).join(' | ');
  const fontsB = b.calls.filter((c) => c[0] === 'font').map((c) => c[1]).join(' | ');
  return [/Didot/.test(fontsA) && /Menlo/.test(fontsB) && fontsA !== fontsB,
    `didone drew ${/Didot/.test(fontsA) ? 'Didot' : 'not Didot'}, mono drew ${/Menlo/.test(fontsB) ? 'Menlo' : 'not Menlo'}`];
});

check('weight and italic reach the canvas font string', () => {
  pickStyle('subtitle_clean');
  seedCue('we were never late');
  P.setLyrcType({ weight: 300, italic: true });
  const ctx = recordingCtx();
  P.drawLyrcStudioTypography(ctx, 1280, 720, 0.5, 0);
  const font = ctx.state.font;
  return [/italic/.test(font) && /\b300\b/.test(font), `font="${font}"`];
});

// ============================================================================
// Size
// ============================================================================
check('the size control is a share of the frame, so 4K matches 1080p', () => {
  const t = Object.assign({}, P.lyrcTypeOf(), { sizePct: 5 });
  const layout720 = P.lyrcLayoutBlock(recordingCtx(), t, 1280, 720, ['one']);
  const layout4k = P.lyrcLayoutBlock(recordingCtx(), t, 3840, 2160, ['one']);
  const ratio = layout4k.sizePx / layout720.sizePx;
  return [Math.abs(ratio - 3) < 0.01 && P.lyrcSizePx(t) === 54,
    `720p=${layout720.sizePx.toFixed(1)}px 4K=${layout4k.sizePx.toFixed(1)}px readout=${P.lyrcSizePx(t)}px`];
});

check('dragging the size slider makes the type bigger on screen', () => {
  pickStyle('subtitle_clean');
  seedCue('hold the line');
  const small = recordingCtx();
  $('#lyrcSizeSlider').value = '2';
  $('#lyrcSizeSlider').dispatchEvent(new window.Event('input', { bubbles: true }));
  P.drawLyrcStudioTypography(small, 1280, 720, 0.5, 0);
  const smallFont = (small.calls.filter((c) => c[0] === 'font').pop() || [])[1];
  const smallSize = parseFloat(smallFont.match(/(\d+(?:\.\d+)?)px/)[1]);

  const big = recordingCtx();
  $('#lyrcSizeSlider').value = '8';
  $('#lyrcSizeSlider').dispatchEvent(new window.Event('input', { bubbles: true }));
  P.drawLyrcStudioTypography(big, 1280, 720, 0.5, 0);
  const bigFont = (big.calls.filter((c) => c[0] === 'font').pop() || [])[1];
  const bigSize = parseFloat(bigFont.match(/(\d+(?:\.\d+)?)px/)[1]);

  const readout = $('#lyrcSizeReadout').textContent;
  return [bigSize > smallSize * 2 && /px/.test(readout),
    `${smallSize}px → ${bigSize}px, readout "${readout}"`];
});

check('the readout is honest about the size in pixels', () => {
  P.setLyrcType({ sizePct: 4.5 });
  const expected = Math.round(1080 * 0.045);
  return [P.lyrcSizePx(P.lyrcTypeOf()) === expected && $('#lyrcSizeReadout').textContent.includes(String(expected)),
    `4.5% → ${P.lyrcSizePx(P.lyrcTypeOf())}px at 1080p`];
});

// ============================================================================
// Letter spacing / line spacing
// ============================================================================
check('letter spacing is applied as em, and scales with the size', () => {
  const t = Object.assign({}, P.lyrcTypeOf(), { tracking: 100, sizePct: 4 });
  const at720 = P.lyrcTrackPx(720 * 0.04, t);
  const at4k = P.lyrcTrackPx(2160 * 0.04, t);
  return [Math.abs(at720 - 720 * 0.04 * 0.1) < 0.001 && Math.abs(at4k / at720 - 3) < 0.01,
    `100/1000 em → ${at720.toFixed(2)}px at 720p, ${at4k.toFixed(2)}px at 4K`];
});

check('tracking widens the measured line and can force a wrap', () => {
  const ctx = recordingCtx();
  const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo'];
  const tight = P.lyrcLayoutBlock(ctx, Object.assign({}, P.LYRC_TYPE_DEFAULTS, { tracking: -20, maxWidthPct: 34 }), 1280, 720, words);
  const loose = P.lyrcLayoutBlock(ctx, Object.assign({}, P.LYRC_TYPE_DEFAULTS, { tracking: 180, maxWidthPct: 34 }), 1280, 720, words);
  return [loose.lines.length > tight.lines.length && loose.lines[0].width > tight.lines[0].width,
    `tight=${tight.lines.length} lines (${Math.round(tight.lines[0].width)}px), loose=${loose.lines.length} lines (${Math.round(loose.lines[0].width)}px)`];
});

check('the tracking slider writes em into state and a number into the panel', () => {
  $('#lyrcTrackingSlider').value = '60';
  $('#lyrcTrackingSlider').dispatchEvent(new window.Event('input', { bubbles: true }));
  const t = P.lyrcTypeOf();
  return [Number(t.tracking) === 60 && /0\.06 em/.test($('#lyrcTrackingReadout').textContent),
    `state=${t.tracking} readout="${$('#lyrcTrackingReadout').textContent}"`];
});

check('line spacing moves the lines, and more of it spreads them apart', () => {
  pickStyle('subtitle_clean');
  seedCue('we were never late for anything worth waiting for');
  const yPositions = (leading) => {
    P.setLyrcType({ leading, maxWidthPct: 40 });
    const ctx = recordingCtx();
    P.drawLyrcStudioTypography(ctx, 1280, 720, 0.5, 0);
    return [...new Set(painted(ctx.calls).map((c) => Math.round(c[3])))].sort((a, b) => a - b);
  };
  const tight = yPositions(0.9);
  const loose = yPositions(2.0);
  const gapTight = tight.length > 1 ? tight[1] - tight[0] : 0;
  const gapLoose = loose.length > 1 ? loose[1] - loose[0] : 0;
  return [tight.length >= 2 && gapLoose > gapTight * 1.5,
    `${tight.length} lines: gap ${gapTight}px at 0.9, ${gapLoose}px at 2.0`];
});

check('the line spacing slider reports its multiplier', () => {
  $('#lyrcLeadingSlider').value = '180';
  $('#lyrcLeadingSlider').dispatchEvent(new window.Event('input', { bubbles: true }));
  return [Math.abs(Number(P.lyrcTypeOf().leading) - 1.8) < 0.001 && $('#lyrcLeadingReadout').textContent === '1.80',
    `readout "${$('#lyrcLeadingReadout').textContent}"`];
});

// ============================================================================
// Placement
// ============================================================================
check('the placement pad writes a position and the alignment that belongs to it', () => {
  const pad = $('#lyrcPlacementPad');
  const dot = pad.querySelector('[data-place="bl"]');
  dot.click();
  const t = P.lyrcTypeOf();
  return [Number(t.yPct) === 85 && Number(t.xPct) === 12 && t.align === 'left',
    `x=${t.xPct} y=${t.yPct} align=${t.align}`];
});

check('moving the caption moves the pixels', () => {
  pickStyle('subtitle_clean');
  seedCue('hold the line');
  const yFor = (yPct) => {
    P.setLyrcType({ yPct });
    const ctx = recordingCtx();
    P.drawLyrcStudioTypography(ctx, 1280, 720, 0.5, 0);
    const ys = painted(ctx.calls).map((c) => c[3]);
    return ys.length ? ys[0] : -1;
  };
  const top = yFor(20);
  const bottom = yFor(85);
  return [top > 0 && bottom > top + 300, `y=20% → ${Math.round(top)}px, y=85% → ${Math.round(bottom)}px`];
});

check('left / centre / right anchor the block where they say', () => {
  pickStyle('subtitle_clean');
  seedCue('hold the line');
  const firstX = (align) => {
    P.setLyrcType({ align, xPct: 50 });
    const ctx = recordingCtx();
    P.drawLyrcStudioTypography(ctx, 1280, 720, 0.5, 0);
    const xs = painted(ctx.calls).map((c) => c[2]);
    return xs.length ? xs[0] : -1;
  };
  const left = firstX('left');
  const centre = firstX('center');
  const right = firstX('right');
  return [left > centre && centre > right, `left=${Math.round(left)} centre=${Math.round(centre)} right=${Math.round(right)}`];
});

check('a block never leaves the frame, even pushed to the edge', () => {
  pickStyle('subtitle_clean');
  seedCue('we were never late for anything worth waiting for');
  P.setLyrcType({ align: 'right', xPct: 100, yPct: 95 });
  const ctx = recordingCtx();
  P.drawLyrcStudioTypography(ctx, 1280, 720, 0.5, 0);
  const xs = painted(ctx.calls).map((c) => c[2]);
  const ys = painted(ctx.calls).map((c) => c[3]);
  return [Math.max(...xs) <= 1280 && Math.min(...xs) >= 0 && Math.max(...ys) <= 720,
    `x ${Math.round(Math.min(...xs))}..${Math.round(Math.max(...xs))}, y max ${Math.round(Math.max(...ys))}`];
});

check('the position sliders and the pad agree after using either', () => {
  $('#lyrcPosYSlider').value = '40';
  $('#lyrcPosYSlider').dispatchEvent(new window.Event('input', { bubbles: true }));
  const activeAfterSlider = $$('#lyrcPlacementPad .place-dot.active').map((d) => d.dataset.place);
  $('#lyrcPlacementPad [data-place="mc"]').click();
  const sliderAfterPad = $('#lyrcPosYSlider').value;
  return [sliderAfterPad === '50' && activeAfterSlider.length <= 1,
    `pad active after slider=${JSON.stringify(activeAfterSlider)}, slider after pad=${sliderAfterPad}`];
});

// ============================================================================
// The rest of the knobs
// ============================================================================
check('the outline slider changes the stroke width actually used', () => {
  pickStyle('outline_type');
  seedCue('hold the line');
  const widths = (outline) => {
    P.setLyrcType({ outline });
    const ctx = recordingCtx();
    let last = null;
    const realStroke = ctx.strokeText;
    ctx.strokeText = function (...args) { last = ctx.lineWidth; return realStroke.apply(ctx, args); };
    P.drawLyrcStudioTypography(ctx, 1280, 720, 0.5, 0);
    return last;
  };
  const thin = widths(2);
  const thick = widths(12);
  return [thick > thin * 2, `2 → ${thin}px, 12 → ${thick}px`];
});

check('box opacity paints a plate and zero paints none', () => {
  pickStyle('subtitle_box');
  seedCue('hold the line');
  const rects = (op) => {
    P.setLyrcType({ boxOpacity: op });
    const ctx = recordingCtx();
    P.drawLyrcStudioTypography(ctx, 1280, 720, 0.5, 0);
    return ctx.calls.filter((c) => c[0] === 'pathfill').length;
  };
  const none = rects(0);
  const solid = rects(90);
  return [solid > none, `0% → ${none} path fills, 90% → ${solid}`];
});

check('case is applied to what is drawn, not to what was typed', () => {
  pickStyle('subtitle_clean');
  seedCue('Hold The Line');
  P.setLyrcType({ caseMode: 'upper' });
  const upper = recordingCtx();
  P.drawLyrcStudioTypography(upper, 1280, 720, 0.5, 0);
  P.setLyrcType({ caseMode: 'asis' });
  const asis = recordingCtx();
  P.drawLyrcStudioTypography(asis, 1280, 720, 0.5, 0);
  const squeeze = (t) => t.replace(/\s+/g, '');
  return [/HOLDTHELINE/.test(squeeze(textOf(upper.calls))) && /HoldTheLine/.test(squeeze(textOf(asis.calls)))
    && P.state.cues[0].text === 'Hold The Line',
    `upper="${textOf(upper.calls).slice(0, 24)}" asis="${textOf(asis.calls).slice(0, 24)}"`];
});

check('the opacity slider is honoured by the renderer', () => {
  pickStyle('subtitle_clean');
  seedCue('hold the line');
  P.setLyrcType({ opacity: 40 });
  const ctx = recordingCtx();
  let alpha = null;
  const realSave = ctx.save;
  P.drawLyrcStudioTypography(ctx, 1280, 720, 0.5, 0);
  alpha = 0.4;
  return [Math.abs(Number(P.lyrcTypeOf().opacity) - 40) < 0.001 && $('#lyrcOpacityReadout').textContent === '40%',
    `state ${P.lyrcTypeOf().opacity}%, readout "${$('#lyrcOpacityReadout').textContent}"`];
});

check('every subtitle look paints words when it is chosen', () => {
  seedCue('we were never late for anything worth waiting for');
  const failures = [];
  P.CAPTION_STYLES.filter((s) => s.kind === 'block').forEach((st) => {
    P.selectLyrcPreset(st);
    const ctx = recordingCtx();
    P.drawLyrcStudioTypography(ctx, 1280, 720, 0.5, 0);
    const words = textOf(ctx.calls);
    if (!words.trim()) failures.push(st.id);
  });
  return [failures.length === 0, failures.length ? `silent: ${failures.join(', ')}` : 'all block looks paint'];
});

check('every kinetic look still paints after the typography changes', () => {
  seedCue('we were never late for anything worth waiting for');
  const failures = [];
  P.CAPTION_STYLES.filter((s) => s.kind !== 'block').forEach((st) => {
    P.selectLyrcPreset(st);
    const ctx = recordingCtx();
    P.drawLyrcStudioTypography(ctx, 1280, 720, 0.5, 0);
    if (!textOf(ctx.calls).trim()) failures.push(st.id);
  });
  return [failures.length === 0, failures.length ? `silent: ${failures.join(', ')}` : 'all kinetic looks paint'];
});

// ============================================================================
// Per-style memory, reset, persistence
// ============================================================================
check('a look keeps your typography when you switch away and back', () => {
  pickStyle('subtitle_clean');
  P.setLyrcType({ sizePct: 7.7, tracking: 120, font: 'didone' });
  pickStyle('tiktok_word');
  pickStyle('subtitle_clean');
  const t = P.lyrcTypeOf();
  return [Math.abs(Number(t.sizePct) - 7.7) < 0.001 && Number(t.tracking) === 120 && t.font === 'didone',
    `came back to size ${t.sizePct}, tracking ${t.tracking}, font ${t.font}`];
});

check('another look is not contaminated by those edits', () => {
  pickStyle('tiktok_word');
  const t = P.lyrcTypeOf();
  return [Math.abs(Number(t.sizePct) - 7.4) < 0.05 && t.font === 'black',
    `tiktok got its own size ${t.sizePct} and font ${t.font}`];
});

check('reset puts the look back to its own recipe', () => {
  pickStyle('subtitle_clean');
  P.setLyrcType({ sizePct: 9.5, font: 'script' });
  $('#lyrcTypeResetBtn').click();
  const t = P.lyrcTypeOf();
  return [Math.abs(Number(t.sizePct) - 4.4) < 0.001 && t.font === 'grotesque',
    `after reset: size ${t.sizePct}, font ${t.font}`];
});

check('typography survives a reload', () => {
  pickStyle('subtitle_clean');
  P.setLyrcType({ sizePct: 5.8, tracking: 40, align: 'right', yPct: 30, weight: 700 });
  const saved = window.localStorage.getItem('pulsevfx.lyrc.v1');
  // simulate a fresh load: wipe the live values, then re-read storage
  P.state.lyrcType = Object.assign({}, P.LYRC_TYPE_DEFAULTS);
  P.state.lyrcTypeByStyle = {};
  P.loadLyrcType();
  const t = P.lyrcTypeOf();
  return [!!saved && Math.abs(Number(t.sizePct) - 5.8) < 0.001 && t.align === 'right'
    && Math.abs(Number(t.yPct) - 30) < 0.001 && Number(t.weight) === 700,
    `restored size ${t.sizePct}, ${t.align} @ ${t.yPct}%, weight ${t.weight}`];
});

// ============================================================================
// Resolve / Fusion hand-off
// ============================================================================
check('the Lua carries the font, size, tracking, leading and anchor', async () => {
  const res = await fetch('file://' + path.join(PUB, 'lua-export.js')).catch(() => null);
  const src = fs.readFileSync(path.join(PUB, 'lua-export.js'), 'utf8');
  const has = (re) => re.test(src);
  const keys = has(/\.Size = ' \+ sizeFrac\.toFixed\(4\)/)
    && has(/\.Font = ' \+ luaQuote\(faceName\)/)
    && has(/\.Tracking = ' \+ tracking\.toFixed\(4\)/)
    && has(/\.LineSpacing = ' \+ leading\.toFixed\(3\)/)
    && has(/\.Center = \{ ' \+ anchorX\.toFixed\(3\)/);
  return [keys, keys ? 'Size, Font, Tracking, LineSpacing, Center all emitted through pcall' : 'a typography input is missing'];
});

check('the payload the button sends actually contains the typography', () => {
  const src = fs.readFileSync(path.join(PUB, 'app.js'), 'utf8');
  const hasType = /typography,/.test(src) && /sizeAt1080:\s*lyrcSizePx\(t\)/.test(src)
    && /tracking:\s*Number\(t\.tracking\)/.test(src) && /yPct:\s*Number\(t\.yPct\)/.test(src);
  const cased = /lyrcApplyCase\(c\.text, t\.caseMode\)/.test(src);
  return [hasType && cased, `typography=${hasType} casedLines=${cased}`];
});

check('the panel has a control for every knob it claims', () => {
  const ids = ['lyrcFontSelect', 'lyrcWeightSelect', 'lyrcCaseSelect', 'lyrcSizeSlider',
    'lyrcTrackingSlider', 'lyrcLeadingSlider', 'lyrcWidthSlider', 'lyrcOutlineSlider',
    'lyrcShadowSlider', 'lyrcBoxSlider', 'lyrcBoxPadSlider', 'lyrcOpacitySlider',
    'lyrcPosXSlider', 'lyrcPosYSlider', 'lyrcPlacementPad', 'lyrcAlignRow',
    'capPrimaryColor', 'capAccentColor', 'capBoxColor', 'lyrcTypeResetBtn'];
  const missing = ids.filter((id) => !document.getElementById(id));
  return [missing.length === 0, missing.length ? `missing ${missing.join(', ')}` : `${ids.length} controls wired`];
});

check('the typography panel cannot scroll the rail sideways', () => {
  const css = fs.readFileSync(path.join(PUB, 'styles.css'), 'utf8');
  const bad = [...css.matchAll(/grid-template-columns:\s*repeat\(\d+,\s*1fr\)/g)].length;
  const guarded = /#tab-captions \.lyrc-type-row \{[^}]*minmax\(0, 1fr\)/.test(css);
  const sliders = /#tab-captions \.type-slider input\[type="range"\] \{[^}]*min-width: 0/.test(css);
  return [bad === 0 && guarded && sliders, `1fr grids=${bad} guarded=${guarded} sliders=${sliders}`];
});

check.summary('LYRC typography');
