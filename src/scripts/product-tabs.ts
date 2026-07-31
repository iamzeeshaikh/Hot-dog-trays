/**
 * Tab behaviour for the migrated WooCommerce product data tabs.
 *
 * Lives in a module rather than inline in the component so Astro emits it as a
 * bundled file: the site's Content-Security-Policy is `script-src 'self'`,
 * which blocks inline scripts.
 */
export function wireProductTabs(root: ParentNode = document) {
  const list = root.querySelector<HTMLElement>('.hdt-tablist');
  if (!list) return;

  const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  if (!tabs.length) return;

  function select(tab: HTMLButtonElement) {
    for (const t of tabs) {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls') ?? '');
      if (panel) panel.hidden = !selected;
    }
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => select(tab));
  }

  list.addEventListener('keydown', (event) => {
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;

    const next: Record<string, number> = {
      ArrowRight: current + 1,
      ArrowLeft: current - 1,
      ArrowDown: current + 1,
      ArrowUp: current - 1,
      Home: 0,
      End: tabs.length - 1,
    };

    const target = next[event.key];
    if (target === undefined) return;

    event.preventDefault();
    const el = tabs[(target + tabs.length) % tabs.length];
    el.focus();
    select(el);
  });
}
