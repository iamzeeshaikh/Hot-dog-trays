import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../shots', import.meta.url));
mkdirSync(OUT, { recursive: true });

const LOCAL = 'http://localhost:4321';
const LIVE = 'https://hotdogtrays.com';

const pages = [
  ['home', '/'],
  ['product', '/product/hot-dog-serving-tray/'],
  ['shop', '/shop/'],
  ['about', '/about/'],
  ['contact', '/contact/'],
  ['faq', '/faq/'],
  ['getquote', '/get-quote/'],
  ['category', '/product-category/products/'],
];

const widths = [
  ['desktop', 1440, 900],
  ['mobile', 375, 812],
];

const which = process.argv[2] ?? 'local';
const base = which === 'live' ? LIVE : LOCAL;

const browser = await chromium.launch();
const errors = [];

for (const [label, w, h] of widths) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  });

  for (const [name, path] of pages) {
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on('console', (m) => {
      if (m.type() === 'error') pageErrors.push(m.text());
    });
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    try {
      await page.goto(base + path, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1200);
      await page.screenshot({
        path: `${OUT}/${which}-${name}-${label}.png`,
        fullPage: process.env.FULL === '1',
      });
      const height = await page.evaluate(() => document.body.scrollHeight);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      console.log(
        `${which} ${label.padEnd(8)} ${path.padEnd(38)} h=${String(height).padStart(6)} hoverflow=${overflow} errors=${pageErrors.length}`,
      );
      if (pageErrors.length) errors.push([which, label, path, pageErrors.slice(0, 3)]);
    } catch (e) {
      console.log(`${which} ${label} ${path} FAILED: ${e.message.split('\n')[0]}`);
    }
    await page.close();
  }
  await ctx.close();
}

if (errors.length) {
  console.log('\n--- console errors ---');
  for (const e of errors) console.log(JSON.stringify(e));
}

await browser.close();
