/* ============================================================================
 * DOM harness — boots the real index.html + app.js in jsdom
 * ----------------------------------------------------------------------------
 * No browser, no network: fetch is recorded instead of sent, canvas is a no-op
 * 2D context, and requestAnimationFrame runs once so init code completes. Every
 * suite in tools/dom/ uses this, so what it tests is the shipped page, not a
 * reimplementation of it.
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const PUB = path.join(ROOT, 'public');

export function boot({ html = path.join(PUB, 'index.html'), beforeScripts = null } = {}) {
  const calls = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', () => {});
  virtualConsole.on('error', () => {});

  const dom = new JSDOM(fs.readFileSync(html, 'utf8'), {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    url: 'http://localhost/',
    virtualConsole
  });
  const { window } = dom;

  // ---- canvas: a context that accepts every call and returns nothing useful
  const ctxStub = () => new Proxy({
    canvas: null,
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createPattern: () => null,
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)) }),
    putImageData() {},
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)) }),
    getContextAttributes: () => ({ alpha: true })
  }, {
    get(target, key) {
      if (key in target) return target[key];
      return () => undefined;
    },
    set(target, key, value) { target[key] = value; return true; }
  });
  window.HTMLCanvasElement.prototype.getContext = function () {
    const ctx = ctxStub();
    ctx.canvas = this;
    return ctx;
  };
  window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
  window.HTMLCanvasElement.prototype.captureStream = () => null;

  // ---- fetch: recorded, never sent
  window.fetch = (url, opts = {}) => {
    let body = null;
    try { body = opts.body ? JSON.parse(opts.body) : null; } catch { body = opts.body; }
    calls.push({ url: String(url), method: opts.method || 'GET', body });
    // serve the real graph table so the panel builds real chains, not fallbacks
    if (/preset-recipes\.json/.test(String(url))) {
      const file = path.join(PUB, 'preset-recipes.json');
      if (fs.existsSync(file)) {
        return Promise.resolve({
          ok: true, status: 200,
          json: () => Promise.resolve(JSON.parse(fs.readFileSync(file, 'utf8'))),
          text: () => Promise.resolve(fs.readFileSync(file, 'utf8'))
        });
      }
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ liveBridgeConnected: false, bridgeResponse: null }),
      text: () => Promise.resolve('')
    });
  };
  window.navigator.clipboard = { writeText: () => Promise.resolve() };

  // ---- media: jsdom has no codecs or WebAudio
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.pause = () => {};
  window.HTMLMediaElement.prototype.load = () => {};
  Object.defineProperty(window.HTMLMediaElement.prototype, 'readyState', { get: () => 0, configurable: true });
  window.AudioContext = function () {
    return {
      createAnalyser: () => ({ connect() {}, disconnect() {}, getByteFrequencyData() {}, fftSize: 2048, frequencyBinCount: 1024 }),
      createMediaElementSource: () => ({ connect() {}, disconnect() {} }),
      createGain: () => ({ connect() {}, disconnect() {}, gain: { value: 1 } }),
      destination: {}, close: () => Promise.resolve(), state: 'running', resume: () => Promise.resolve()
    };
  };
  // No animation loop and no polling: these are DOM assertions, and a 60 fps
  // render loop would both burn the sandbox and keep node alive forever.
  window.requestAnimationFrame = () => 0;
  window.cancelAnimationFrame = () => {};
  window.setInterval = () => 0;
  window.clearInterval = () => {};
  window.structuredClone = window.structuredClone || ((v) => JSON.parse(JSON.stringify(v)));
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  window.HTMLCanvasElement.prototype.transferControlToOffscreen = undefined;
  window.OffscreenCanvas = window.OffscreenCanvas || function () { return window.document.createElement('canvas'); };
  window.URL.createObjectURL = window.URL.createObjectURL || (() => 'blob:stub');
  window.URL.revokeObjectURL = window.URL.revokeObjectURL || (() => {});

  // a suite can set flags the page reads at load time (the mask test seam)
  if (typeof beforeScripts === 'function') beforeScripts(window);

  // ---- load the page's scripts in order, like the HTML does
  const scripts = [...window.document.querySelectorAll('script[src]')]
    .map((s) => s.getAttribute('src'))
    // vendor bundles (the 800 KB speech runtime, the 40 MB depth model) are not
    // app code: eval'ing them would slow every suite down for nothing
    .filter((src) => src && !/^https?:/.test(src) && !/\/vendor\//.test(src));
  for (const src of scripts) {
    const file = path.join(PUB, src.replace(/^\.?\//, '').split('?')[0]);
    if (!fs.existsSync(file)) continue;
    try {
      window.eval(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      throw new Error(`failed to load ${src}: ${err && err.message}`);
    }
  }

  // jsdom finishes parsing before we eval the page's scripts, so the
  // DOMContentLoaded that app.js waits for has already been and gone.
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  window.dispatchEvent(new window.Event('load'));

  return { dom, window, document: window.document, calls };
}

export function makeCheck() {
  const results = [];
  const pending = [];
  const report = (label, ok, detail, why) => {
    results.push({ label, ok, detail: detail || why || '' });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && (detail || why) ? `\n        - ${detail || why}` : ''}`);
    return ok;
  };
  const read = (out) => {
    if (Array.isArray(out)) return { ok: !!out[0], detail: out[1] || '' };
    return { ok: !!out, detail: '' };
  };
  // A check may return a promise (anything that awaits the real code). Without
  // this branch a promise is simply truthy and every async check passes, which
  // is the same silent-lie bug that once hid 28 dial-less effects.
  const check = (label, fn, why) => {
    let out;
    try {
      out = typeof fn === 'function' ? fn() : fn;
    } catch (err) {
      return report(label, false, (err && err.message) || String(err), why);
    }
    if (out && typeof out.then === 'function') {
      const p = out.then(
        (value) => { const r = read(value); return report(label, r.ok, r.detail, why); },
        (err) => report(label, false, (err && err.message) || String(err), why)
      );
      pending.push(p);
      return p;
    }
    const r = read(out);
    return report(label, r.ok, r.detail, why);
  };
  check.summary = (name) => {
    const finish = () => {
      const failed = results.filter((r) => !r.ok);
      console.log('');
      if (failed.length) {
        console.log(`${failed.length}/${results.length} ${name} checks FAILED`);
        process.exitCode = 1;
      } else {
        console.log(`all ${results.length} ${name} checks passed`);
      }
    };
    if (pending.length) return Promise.all(pending).then(finish);
    finish();
    return undefined;
  };
  return check;
}
