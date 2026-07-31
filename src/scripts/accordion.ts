/**
 * Disclosure behaviour for the product FAQ accordion.
 *
 * In a module rather than inline so Astro emits it as a bundled file; the
 * site's Content-Security-Policy is `script-src 'self'`.
 */
export function wireAccordion(root: ParentNode = document) {
  const triggers = root.querySelectorAll<HTMLButtonElement>('.hdt-accordion-trigger');

  for (const trigger of triggers) {
    trigger.addEventListener('click', () => {
      const panel = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
      const open = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!open));
      if (panel) panel.hidden = open;
    });
  }
}
