/**
 * Report which elements push the page wider than the viewport.
 * Usage: node scripts/overflow.mjs <path> [width]
 */
import { chromium } from 'playwright';

const path = process.argv[2] ?? '/';
const width = Number(process.argv[3] ?? 375);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 812 } });
await page.goto(`http://localhost:4321${path}`, { waitUntil: 'networkidle' });

const offenders = await page.evaluate((vw) => {
  const out = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    if (r.right > vw + 1 || r.left < -1) {
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 60),
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
        parent: (el.parentElement?.className || '').toString().slice(0, 40),
      });
    }
  }
  return out;
}, width);

// keep only the outermost offenders, the ones actually worth fixing
const seen = new Set();
for (const o of offenders) {
  const key = `${o.tag}.${o.cls}`;
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(
    `${o.tag.padEnd(8)} ${o.cls.padEnd(45)} L=${String(o.left).padStart(5)} R=${String(o.right).padStart(6)} W=${String(o.width).padStart(5)}  parent=${o.parent}`,
  );
}
console.log(`\n${offenders.length} overflowing elements at ${width}px on ${path}`);

await browser.close();
