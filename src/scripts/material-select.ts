/**
 * "Select" buttons on the material cards check the radio inside their own card.
 *
 * In a module rather than inline so Astro emits it as a bundled file; the
 * site's Content-Security-Policy is `script-src 'self'`.
 */
export function wireMaterialSelect(root: ParentNode = document) {
  const buttons = root.querySelectorAll<HTMLButtonElement>('.hdt-material-select-btn');

  for (const button of buttons) {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const input = button
        .closest('.hdt-material-card')
        ?.querySelector<HTMLInputElement>('.hdt-material-input');
      if (!input) return;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
}
