/**
 * Shared behaviour for the migrated `.hdt-faq-item` accordions.
 *
 * The Elementor originals toggled a class only. This keeps that visual
 * behaviour (one panel open at a time) and adds the state and keyboard
 * semantics assistive technology needs.
 */
export function wireFaqAccordions(root: ParentNode = document) {
  const items = Array.from(root.querySelectorAll<HTMLElement>('.hdt-faq-item'));
  if (!items.length) return;

  const triggerOf = (item: HTMLElement) =>
    item.querySelector<HTMLButtonElement>('.hdt-faq-question-btn');

  const panelOf = (item: HTMLElement) => item.querySelector<HTMLElement>('.hdt-faq-answer');

  items.forEach((item, index) => {
    const trigger = triggerOf(item);
    const panel = panelOf(item);
    if (!trigger || !panel) return;

    if (!panel.id) panel.id = `hdt-faq-panel-${index}`;
    if (!trigger.id) trigger.id = `hdt-faq-trigger-${index}`;
    trigger.setAttribute('aria-controls', panel.id);
    trigger.setAttribute('aria-expanded', String(item.classList.contains('active')));
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', trigger.id);

    trigger.addEventListener('click', () => {
      const willOpen = !item.classList.contains('active');

      for (const other of items) {
        if (other === item) continue;
        other.classList.remove('active');
        triggerOf(other)?.setAttribute('aria-expanded', 'false');
      }

      item.classList.toggle('active', willOpen);
      trigger.setAttribute('aria-expanded', String(willOpen));
    });

    trigger.addEventListener('keydown', (event) => {
      const keys: Record<string, number> = {
        ArrowDown: index + 1,
        ArrowUp: index - 1,
        Home: 0,
        End: items.length - 1,
      };
      const next = keys[event.key];
      if (next === undefined) return;
      event.preventDefault();
      triggerOf(items[(next + items.length) % items.length])?.focus();
    });
  });
}
