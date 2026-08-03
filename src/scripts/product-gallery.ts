/**
 * Thumbnail switching for the product gallery.
 *
 * In a module rather than inline so Astro emits it as a bundled file; the
 * site's Content-Security-Policy is `script-src 'self'`.
 *
 * The main image is a different, much larger file than the thumbnail, so a
 * naive swap makes the browser fetch it at click time and the change visibly
 * lags. Two things avoid that: every full-size image is warmed at low priority
 * once the page is idle, and hovering or touching a thumbnail warms that one
 * immediately. By the time a click lands the file is normally in cache and the
 * swap is instant.
 */

/** Images already requested, so a thumbnail is never fetched twice. */
const warmed = new Set<string>();

function warm(src: string, priority: 'low' | 'high' = 'low') {
  if (!src || warmed.has(src)) return;
  warmed.add(src);
  const img = new Image();
  // `fetchPriority` keeps the idle warm-up behind anything the page still needs
  if ('fetchPriority' in img) {
    (img as HTMLImageElement & { fetchPriority: string }).fetchPriority = priority;
  }
  img.decoding = 'async';
  img.src = src;
}

export function wireProductGallery(root: ParentNode = document) {
  const main = root.querySelector<HTMLImageElement>('#gallery-main-image');
  const thumbs = Array.from(root.querySelectorAll<HTMLButtonElement>('.hdt-gallery-thumb'));
  if (!main || !thumbs.length) return;

  // the image already on screen is the first thumbnail's target
  warmed.add(main.currentSrc || main.src);

  function show(thumb: HTMLButtonElement) {
    const full = thumb.dataset.full;
    if (!full || !main) return;

    // srcset and sizes would keep overriding the swapped src
    main.removeAttribute('srcset');
    main.removeAttribute('sizes');
    main.src = full;
    main.alt = thumb.dataset.alt ?? '';

    for (const t of thumbs) {
      const active = t === thumb;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-pressed', String(active));
    }
  }

  for (const thumb of thumbs) {
    thumb.addEventListener('click', () => show(thumb));

    // start the download as soon as there is any sign of intent
    const intent = () => warm(thumb.dataset.full ?? '', 'high');
    thumb.addEventListener('pointerenter', intent, { once: true });
    thumb.addEventListener('touchstart', intent, { once: true, passive: true });
    thumb.addEventListener('focus', intent, { once: true });
  }

  // once the page is quiet, warm the rest so any click is instant
  const warmAll = () => {
    for (const thumb of thumbs) warm(thumb.dataset.full ?? '', 'low');
  };

  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, o?: object) => void })
      .requestIdleCallback(warmAll, { timeout: 3000 });
  } else {
    setTimeout(warmAll, 1200);
  }
}
