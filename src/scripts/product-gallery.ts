/**
 * Thumbnail switching for the product gallery.
 *
 * In a module rather than inline so Astro emits it as a bundled file; the
 * site's Content-Security-Policy is `script-src 'self'`.
 */
export function wireProductGallery(root: ParentNode = document) {
  const main = root.querySelector<HTMLImageElement>('#gallery-main-image');
  const thumbs = Array.from(root.querySelectorAll<HTMLButtonElement>('.hdt-gallery-thumb'));
  if (!main || !thumbs.length) return;

  for (const thumb of thumbs) {
    thumb.addEventListener('click', () => {
      const full = thumb.dataset.full;
      if (!full) return;

      // srcset would otherwise keep overriding the swapped src
      main.removeAttribute('srcset');
      main.removeAttribute('sizes');
      main.src = full;
      main.alt = thumb.dataset.alt ?? '';

      for (const t of thumbs) {
        const active = t === thumb;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-pressed', String(active));
      }
    });
  }
}
