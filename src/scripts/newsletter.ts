/**
 * Footer newsletter subscription.
 *
 * In a module rather than inline so Astro emits it as a bundled file; the
 * site's Content-Security-Policy is `script-src 'self'`.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function wireNewsletter(root: ParentNode = document) {
  const form = root.querySelector<HTMLFormElement>('#newsletterForm');
  const out = root.querySelector<HTMLElement>('#newsletterMessage');
  if (!form || !out) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();

    if (!EMAIL_RE.test(email)) {
      out.textContent = 'Please enter a valid email address.';
      out.dataset.state = 'error';
      return;
    }

    if (button) button.disabled = true;
    out.dataset.state = 'pending';
    out.textContent = 'Subscribing…';

    try {
      const res = await fetch('/api/quote/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'newsletter',
          email,
          company_hp: (form.elements.namedItem('company_hp') as HTMLInputElement).value,
          pageUrl: window.location.href,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (res.ok && data.ok) {
        out.dataset.state = 'success';
        out.textContent = 'Thanks — you are on the list.';
        form.reset();
      } else {
        out.dataset.state = 'error';
        out.textContent = data.error || 'Subscription failed. Please try again later.';
      }
    } catch {
      out.dataset.state = 'error';
      out.textContent = 'Network error. Please try again later.';
    } finally {
      if (button) button.disabled = false;
    }
  });
}
