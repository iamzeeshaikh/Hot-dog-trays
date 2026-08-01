/**
 * Reflects the chosen artwork filenames back into the upload label, so the
 * visually-hidden file input still gives visible feedback.
 *
 * In a module rather than inline: the site's CSP is `script-src 'self'`.
 */
export function wireFileLabel(root: ParentNode = document) {
  for (const input of root.querySelectorAll<HTMLInputElement>('.hdt-upload input[type="file"]')) {
    const text = input.closest('.hdt-upload')?.querySelector<HTMLElement>('.hdt-upload-text');
    if (!text) continue;
    const original = text.innerHTML;

    input.addEventListener('change', () => {
      const files = Array.from(input.files ?? []);
      if (!files.length) {
        text.innerHTML = original;
        return;
      }
      text.textContent =
        files.length === 1
          ? files[0].name
          : `${files.length} files selected`;
    });
  }
}
