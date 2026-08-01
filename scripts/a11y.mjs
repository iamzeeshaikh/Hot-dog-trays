/**
 * Accessibility spot-check across the migrated pages.
 *
 * Covers the WCAG 2.2 AA items the migration brief calls out that static HTML
 * analysis cannot see: computed colour contrast, focus visibility, keyboard
 * operation of the nav dropdown, mobile menu, tabs and accordions, and target
 * sizes.
 */
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE ?? 'http://localhost:4321';
const PAGES = ['/', '/product/hot-dog-serving-tray/', '/product/hot-dog-boats-paper/', '/shop/', '/faq/', '/contact/', '/get-quote/', '/hot-dog-tray-sizes/', '/paper-vs-plastic-hot-dog-trays/'];

const results = [];
const pass = (n, d = '') => results.push({ ok: true, n, d });
const fail = (n, d) => results.push({ ok: false, n, d });

const browser = await chromium.launch();

// ---- static-structure checks across pages --------------------------------
for (const path of PAGES) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE + path, { waitUntil: 'networkidle' });

  const audit = await page.evaluate(() => {
    const problems = [];

    // heading order must not skip levels
    const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) =>
      Number(h.tagName[1]),
    );
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i - 1] > 1) {
        problems.push(`heading jump h${levels[i - 1]} -> h${levels[i]}`);
        break;
      }
    }

    // every form control needs an accessible name
    for (const el of document.querySelectorAll('input, select, textarea')) {
      if (el.type === 'hidden') continue;
      const id = el.id;
      const labelled =
        (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) ||
        el.closest('label') ||
        el.getAttribute('aria-label') ||
        el.getAttribute('aria-labelledby');
      if (!labelled) problems.push(`unlabelled control: ${el.name || el.type}`);
    }

    // links and buttons need discernible text
    for (const el of document.querySelectorAll('a[href], button')) {
      const name =
        el.textContent.trim() ||
        el.getAttribute('aria-label') ||
        el.querySelector('img')?.getAttribute('alt') ||
        '';
      if (!name) problems.push(`empty ${el.tagName.toLowerCase()}: ${el.className}`);
    }

    // external links must be safe
    for (const a of document.querySelectorAll('a[target="_blank"]')) {
      const rel = a.getAttribute('rel') ?? '';
      if (!rel.includes('noopener')) problems.push(`target=_blank without noopener: ${a.href}`);
    }

    // document language
    if (!document.documentElement.lang) problems.push('missing <html lang>');

    // no positive tabindex
    for (const el of document.querySelectorAll('[tabindex]')) {
      if (Number(el.getAttribute('tabindex')) > 0) problems.push('positive tabindex');
    }

    return problems;
  });

  if (audit.length) fail(`structure: ${path}`, audit.slice(0, 5).join('; '));
  else pass(`structure: ${path}`);

  // ---- contrast of body text and buttons ---------------------------------
  const contrast = await page.evaluate(() => {
    const lum = (c) => {
      const [r, g, b] = c.map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const parse = (s) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);

    // Returns the effective background colour, or null when it cannot be
    // resolved to a single opaque colour (gradient, image, or a translucent
    // layer over one).
    function rgba(str) {
      const n = (str.match(/[\d.]+/g) ?? []).map(Number);
      if (n.length < 3) return null;
      return { rgb: n.slice(0, 3), a: n.length > 3 ? n[3] : 1 };
    }

    function bgOf(el) {
      let node = el;
      while (node && node !== document.documentElement) {
        const cs = getComputedStyle(node);
        if (cs.backgroundImage !== 'none') return null;
        const c = rgba(cs.backgroundColor);
        // fully transparent, or translucent: keep looking for what is behind it
        if (c && c.a >= 0.95) return c.rgb;
        node = node.parentElement;
      }
      const root = rgba(getComputedStyle(document.body).backgroundColor);
      return root && root.a >= 0.95 ? root.rgb : [255, 255, 255];
    }

    const bad = [];
    const seen = new Set();
    for (const el of document.querySelectorAll('p, li, a, button, h1, h2, h3, td, th, label, dd, dt')) {
      const t = el.textContent.trim();
      if (!t || el.children.length > 0) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.5) continue;
      // a gradient or image background cannot be sampled reliably
      if (cs.backgroundImage !== 'none') continue;

      const fg = parse(cs.color);
      const bg = bgOf(el);
      if (fg.length !== 3 || bg === null) continue;

      const l1 = lum(fg);
      const l2 = lum(bg);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const size = parseFloat(cs.fontSize);
      const bold = Number(cs.fontWeight) >= 700;
      const large = size >= 24 || (size >= 18.66 && bold);
      const min = large ? 3 : 4.5;

      if (ratio < min) {
        const key = `${cs.color}|${size}|${t.slice(0, 20)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        bad.push(`${ratio.toFixed(2)}:1 (needs ${min}) "${t.slice(0, 40)}"`);
      }
    }
    return bad;
  });

  if (contrast.length) fail(`contrast: ${path}`, contrast.slice(0, 4).join(' | '));
  else pass(`contrast: ${path}`);

  // ---- visible focus indicator -------------------------------------------
  const focusOk = await page.evaluate(() => {
    const link = document.querySelector('a[href], button');
    if (!link) return true;
    link.focus();
    const cs = getComputedStyle(link, null);
    return cs.outlineStyle !== 'none' || cs.boxShadow !== 'none';
  });
  focusOk ? pass(`focus visible: ${path}`) : fail(`focus visible: ${path}`, 'no outline on focus');

  await page.close();
}

// ---- keyboard operation of interactive widgets ---------------------------
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(BASE + '/product/hot-dog-serving-tray/', { waitUntil: 'networkidle' });

// nav dropdown opens on keyboard focus
await page.keyboard.press('Tab'); // skip link
await page.focus('[data-dropdown-trigger]');
await page.waitForTimeout(250);
const dropdownVisible = await page.evaluate(() => {
  const d = document.querySelector('.hdt-dropdown');
  return d ? getComputedStyle(d).visibility === 'visible' : false;
});
dropdownVisible
  ? pass('nav dropdown opens on keyboard focus')
  : fail('nav dropdown opens on keyboard focus', 'stayed hidden');

// tabs respond to arrow keys
await page.focus('[role="tab"]');
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(200);
const tabMoved = await page.evaluate(() => {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  return tabs[1]?.getAttribute('aria-selected') === 'true';
});
tabMoved ? pass('product tabs respond to ArrowRight') : fail('product tabs arrow keys', 'no change');

// accordion toggles aria-expanded
const accordionOk = await page.evaluate(() => {
  const t = document.querySelector('.hdt-accordion-trigger');
  if (!t) return false;
  t.click();
  const panel = document.getElementById(t.getAttribute('aria-controls'));
  return t.getAttribute('aria-expanded') === 'true' && panel && !panel.hidden;
});
accordionOk ? pass('FAQ accordion toggles aria-expanded') : fail('FAQ accordion', 'state not updated');

await page.close();

// ---- mobile menu + target sizes ------------------------------------------
const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
await mobile.goto(BASE + '/', { waitUntil: 'networkidle' });

const toggle = await mobile.locator('.hdt-mobile-toggle').boundingBox();
if (toggle && toggle.width >= 24 && toggle.height >= 24) {
  pass('mobile menu target size', `${Math.round(toggle.width)}x${Math.round(toggle.height)}`);
} else {
  fail('mobile menu target size', JSON.stringify(toggle));
}

const closedHidden = await mobile.evaluate(
  () => getComputedStyle(document.getElementById('mobileMenu')).visibility === 'hidden',
);
closedHidden
  ? pass('closed mobile menu is hidden from AT and pointer')
  : fail('closed mobile menu', 'still visible');

await mobile.locator('.hdt-mobile-toggle').click();
await mobile.waitForTimeout(400);
const opened = await mobile.evaluate(() => {
  const menu = document.getElementById('mobileMenu');
  const btn = document.getElementById('mobileToggle');
  return menu.classList.contains('active') && btn.getAttribute('aria-expanded') === 'true';
});
opened ? pass('mobile menu opens and reports aria-expanded') : fail('mobile menu open', 'failed');

await mobile.keyboard.press('Escape');
await mobile.waitForTimeout(300);
const closed = await mobile.evaluate(
  () => !document.getElementById('mobileMenu').classList.contains('active'),
);
closed ? pass('Escape closes the mobile menu') : fail('Escape closes mobile menu', 'stayed open');

// reduced motion honoured
const reduced = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await reduced.emulateMedia({ reducedMotion: 'reduce' });
await reduced.goto(BASE + '/', { waitUntil: 'networkidle' });
const motionOk = await reduced.evaluate(() => {
  const el = document.querySelector('.hdt-hero');
  return parseFloat(getComputedStyle(el).transitionDuration) < 0.01;
});
motionOk ? pass('prefers-reduced-motion honoured') : fail('prefers-reduced-motion', 'animations active');

await browser.close();

// ---- report ---------------------------------------------------------------
const failures = results.filter((r) => !r.ok);
console.log('\n' + '='.repeat(72));
if (failures.length) {
  console.log(`ACCESSIBILITY FAILURES (${failures.length})\n`);
  for (const f of failures) console.log(`  ✗ ${f.n} — ${f.d}`);
} else {
  console.log('All accessibility checks passed.');
}
console.log(`\n${results.length - failures.length} passed, ${failures.length} failed`);
console.log('='.repeat(72));
process.exit(failures.length ? 1 : 0);
