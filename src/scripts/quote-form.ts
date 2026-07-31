/**
 * Progressive enhancement for the quote and product-inquiry forms.
 *
 * The forms have a real `action` and `method`, so they still submit without
 * JavaScript; this only upgrades them to an inline, accessible experience.
 * Success is reported only when the endpoint confirms the mail was delivered.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_UPLOAD_EXT = ['pdf', 'ai', 'eps', 'psd', 'png', 'jpg', 'jpeg', 'svg', 'zip'];

function setMessage(root: HTMLElement, text: string, state: 'success' | 'error' | 'pending') {
  root.textContent = text;
  root.dataset.state = state;
  root.classList.add('is-visible');
}

function fieldError(form: HTMLFormElement, name: string, message: string): string | null {
  const el = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null;
  if (!el) return null;
  const value = el.value.trim();
  if (!value) {
    el.setAttribute('aria-invalid', 'true');
    return message;
  }
  el.removeAttribute('aria-invalid');
  return null;
}

export function wireQuoteForm(form: HTMLFormElement) {
  const message = form
    .closest('.hdt-quote-form, .hdt-inquiry-form')
    ?.querySelector<HTMLElement>('[data-form-message]');
  const pageUrl = form.querySelector<HTMLInputElement>('[data-page-url]');
  if (pageUrl) pageUrl.value = window.location.href;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!message) return;

    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const originalLabel = submit?.textContent ?? '';

    // ---- client-side validation (mirrored server-side) --------------------
    const errors: string[] = [];
    const required: Array<[string, string]> = [
      ['name', 'your name'],
      ['email', 'your email address'],
      ['phone', 'your phone number'],
    ];
    if (form.elements.namedItem('quantity')) required.push(['quantity', 'an estimated quantity']);
    if (form.elements.namedItem('product')) required.push(['product', 'a product']);

    for (const [name, label] of required) {
      const err = fieldError(form, name, `Please provide ${label}.`);
      if (err) errors.push(err);
    }

    const emailField = form.elements.namedItem('email') as HTMLInputElement | null;
    if (emailField?.value.trim() && !EMAIL_RE.test(emailField.value.trim())) {
      emailField.setAttribute('aria-invalid', 'true');
      errors.push('Please enter a valid email address.');
    }

    const file = form.querySelector<HTMLInputElement>('input[type="file"]');
    if (file?.files) {
      for (const f of Array.from(file.files)) {
        const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
        if (!ALLOWED_UPLOAD_EXT.includes(ext)) {
          errors.push(`"${f.name}" is not an accepted file type.`);
        } else if (f.size > MAX_UPLOAD_BYTES) {
          errors.push(`"${f.name}" is larger than 8 MB.`);
        }
      }
    }

    if (errors.length) {
      setMessage(message, errors[0], 'error');
      form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }

    if (submit) {
      submit.disabled = true;
      submit.textContent = 'Sending…';
    }
    setMessage(message, 'Sending your request…', 'pending');

    try {
      const res = await fetch('/api/quote/', { method: 'POST', body: new FormData(form) });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (res.ok && data.ok) {
        setMessage(
          message,
          "Thank you! Your request has been sent. We'll get back to you within 2 hours during business hours.",
          'success',
        );
        form.reset();
        if (pageUrl) pageUrl.value = window.location.href;
      } else {
        setMessage(
          message,
          data.error ||
            'We could not send your request. Please call (503) 358-0443 or email info@hotdogtrays.com.',
          'error',
        );
      }
    } catch {
      setMessage(
        message,
        'Network error — your request was not sent. Please call (503) 358-0443 or try again.',
        'error',
      );
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = originalLabel;
      }
      message.focus?.();
    }
  });
}
