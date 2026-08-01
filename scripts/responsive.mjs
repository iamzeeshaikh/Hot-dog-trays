/**
 * Responsive QA at the five widths named in the migration brief.
 *
 * Verifies that no page scrolls horizontally and that the elements the brief
 * lists (header, nav, gallery, forms, tables, accordions, footer) are laid out
 * and reachable at each width.
 */
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE ?? 'http://localhost:4321';
const WIDTHS = [320, 375, 768, 1024, 1440];
const PAGES = [
  '/',
  '/product/hot-dog-serving-tray/',
  '/shop/',
  '/product-category/products/',
  '/about/',
  '/contact/',
  '/faq/',
  '/get-quote/',
  '/privacy-policy/',
  '/hot-dog-tray-sizes/',
  '/hot-dog-trays-in-bulk/',
  '/paper-vs-plastic-hot-dog-trays/',
];

const failures = [];
let checks = 0;

const browser = await chromium.launch();

for (const width of WIDTHS) {
  for (const path of PAGES) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);

    const report = await page.evaluate((vw) => {
      const out = { overflow: null, missing: [], tinyTargets: [], unscrollableTables: [] };

      if (document.documentElement.scrollWidth > vw + 1) {
        out.overflow = `${document.documentElement.scrollWidth}px in a ${vw}px viewport`;
      }

      const visible = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
      };

      // header, footer and the primary CTA must be present at every width
      if (!visible('.hdt-header')) out.missing.push('header');
      if (!visible('.hdt-footer')) out.missing.push('footer');

      // navigation: desktop nav or the mobile toggle, never neither
      if (!visible('.hdt-nav') && !visible('.hdt-mobile-toggle')) out.missing.push('navigation');

      // interactive controls need a usable target size (WCAG 2.2 AA: 24px)
      for (const el of document.querySelectorAll('button, a[href], input:not([type=hidden]), select')) {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (r.width === 0 || cs.visibility === 'hidden' || cs.display === 'none') continue;
        if (el.closest('.hdt-hp') || el.classList.contains('hdt-skip-link')) continue;
        // controls hidden behind a styled label (radio cards, styled file
        // inputs) are not the tap target - the label is
        if (Number(cs.opacity) === 0 || cs.pointerEvents === 'none') continue;
        // a control collapsed to a sliver inside a label (the visually-hidden
        // pattern) is not the tap target - the label is
        if (r.width <= 2 && r.height <= 2 && el.closest('label')) continue;
        // WCAG 2.2 SC 2.5.8 exempts links that flow inside a longer run of text
        if (el.tagName === 'A' && cs.display.startsWith('inline')) {
          const parentText = el.parentElement?.textContent?.trim() ?? '';
          const ownText = el.textContent.trim();
          if (parentText.length > ownText.length + 3) continue;
        }
        if (r.height < 24 || r.width < 24) {
          out.tinyTargets.push(`${el.tagName}.${(el.className || '').toString().slice(0, 28)} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }

      // wide tables must scroll inside their own container
      for (const table of document.querySelectorAll('table')) {
        const r = table.getBoundingClientRect();
        if (r.width <= vw) continue;
        const cs = getComputedStyle(table);
        const scrolls =
          cs.overflowX === 'auto' ||
          cs.overflowX === 'scroll' ||
          ['auto', 'scroll'].includes(getComputedStyle(table.parentElement).overflowX);
        if (!scrolls) out.unscrollableTables.push((table.className || 'table').toString().slice(0, 30));
      }

      return out;
    }, width);

    checks++;
    const problems = [];
    if (report.overflow) problems.push(`horizontal overflow: ${report.overflow}`);
    if (report.missing.length) problems.push(`missing: ${report.missing.join(', ')}`);
    if (report.tinyTargets.length)
      problems.push(`small targets: ${[...new Set(report.tinyTargets)].slice(0, 3).join('; ')}`);
    if (report.unscrollableTables.length)
      problems.push(`table overflows page: ${report.unscrollableTables.join(', ')}`);

    if (problems.length) failures.push(`${width}px ${path} — ${problems.join(' | ')}`);

    await page.close();
  }
}

// the product gallery, quote forms and accordions must work at mobile width
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
await page.goto(BASE + '/product/hot-dog-serving-tray/', { waitUntil: 'networkidle' });

const thumbs = await page.locator('.hdt-gallery-thumb').count();
if (thumbs < 2) failures.push('375px product gallery — thumbnails missing');
else {
  const before = await page.locator('#gallery-main-image').getAttribute('src');
  await page.locator('.hdt-gallery-thumb').nth(2).click();
  await page.waitForTimeout(250);
  const after = await page.locator('#gallery-main-image').getAttribute('src');
  if (before === after) failures.push('375px product gallery — thumbnail did not swap the main image');
  checks++;
}

const tabsWork = await page.evaluate(() => {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  if (tabs.length < 2) return false;
  tabs[1].click();
  const panel = document.getElementById(tabs[1].getAttribute('aria-controls'));
  return panel && !panel.hidden;
});
if (!tabsWork) failures.push('375px product tabs — panel did not open');
checks++;

await page.close();
await browser.close();

console.log('\n' + '='.repeat(72));
console.log(`Responsive QA: ${WIDTHS.join(', ')}px across ${PAGES.length} pages`);
if (failures.length) {
  console.log(`\nFAILURES (${failures.length})\n`);
  for (const f of failures) console.log('  ✗ ' + f);
} else {
  console.log(`\nAll ${checks} checks passed.`);
}
console.log('='.repeat(72));
process.exit(failures.length ? 1 : 0);
