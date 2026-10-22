import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const exe = await chromium.executablePath();
console.log('exe:', exe);
const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-dev-shm-usage'],
  executablePath: exe,
  headless: 'shell',
  defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 1 }
});
const page = await browser.newPage();
const logs = [];
page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') logs.push('CONSOLE ' + m.text()); });
await page.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: '/tmp/shot-1600.png' });
const info = await page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const r = (s) => { const el = q(s); if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  return {
    docScroll: document.documentElement.scrollHeight, viewport: innerHeight,
    rail: r('.popup-panel'), stage: r('.stage-wrap'), canvas: r('#livePreviewCanvas'),
    stack: r('#stackPanel'), grid: r('#vfxPresetGrid'), detail: r('#stageDetail'),
    luaExport: typeof window.LUA_EXPORT,
    cards: document.querySelectorAll('.vfx-card').length
  };
});
console.log(JSON.stringify(info, null, 1));
console.log(logs.slice(0, 10).join('\n') || 'no page errors');
await browser.close();
