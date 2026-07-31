import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const prerender = false;

/**
 * Server-side handler for the quote, product-inquiry and newsletter forms.
 *
 * SMTP credentials are read from the environment and never reach the browser.
 * A success response is returned only after the transport accepts the message.
 */

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 5;

/** Extensions we accept, each pinned to the MIME types we will store. */
const ALLOWED_UPLOADS: Record<string, string[]> = {
  pdf: ['application/pdf'],
  ai: ['application/postscript', 'application/pdf', 'application/illustrator'],
  eps: ['application/postscript', 'image/x-eps', 'application/eps'],
  psd: ['image/vnd.adobe.photoshop', 'application/octet-stream'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  svg: ['image/svg+xml'],
  zip: ['application/zip', 'application/x-zip-compressed'],
};

/** Anything that could be executed by a server or a mail client. */
const FORBIDDEN_EXT =
  /\.(php\d?|phtml|phar|exe|dll|bat|cmd|com|sh|bash|zsh|cgi|pl|py|rb|jsp|asp|aspx|js|mjs|cjs|jar|msi|scr|vbs|ps1|htaccess)$/i;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ---------------------------------------------------------------- rate limit

/**
 * Defaults allow five submissions per IP per ten minutes. Both are overridable
 * so the end-to-end tests can exercise the limiter deterministically.
 */
const WINDOW_MS = Number(import.meta.env.QUOTE_RATE_WINDOW_MS ?? 10 * 60 * 1000);
const MAX_PER_WINDOW = Number(import.meta.env.QUOTE_RATE_LIMIT ?? 5);
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

// ---------------------------------------------------------------- sanitising

/** Strip control characters and header-injection attempts from a field. */
function clean(value: unknown, maxLength = 5000): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/** Multi-line fields keep their newlines but lose control characters. */
function cleanMultiline(value: unknown, maxLength = 5000): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, maxLength);
}

/** Reduce an uploaded filename to a safe basename. */
function safeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'file';
  return (
    base
      .replace(/[^A-Za-z0-9._-]/g, '_')
      .replace(/^\.+/, '')
      .slice(0, 100) || 'file'
  );
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

// ---------------------------------------------------------------- handler

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || clientAddress || 'unknown';

  if (rateLimited(ip)) {
    return json({ ok: false, error: 'Too many requests. Please try again in a few minutes.' }, 429);
  }

  const contentType = request.headers.get('content-type') ?? '';
  let fields: Record<string, string> = {};
  const attachments: { filename: string; content: Buffer; contentType: string }[] = [];

  try {
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as Record<string, unknown>;
      for (const [k, v] of Object.entries(body)) fields[k] = clean(v);
      fields.details = cleanMultiline(body.details);
    } else {
      const form = await request.formData();
      let total = 0;

      for (const [key, value] of form.entries()) {
        if (typeof value === 'string') {
          fields[key] = key === 'details' ? cleanMultiline(value) : clean(value);
          continue;
        }

        // ---- file upload validation ------------------------------------
        if (!value.size) continue;
        if (attachments.length >= MAX_FILES) {
          return json({ ok: false, error: `Please attach at most ${MAX_FILES} files.` }, 400);
        }

        const filename = safeFilename(value.name);
        const ext = filename.split('.').pop()?.toLowerCase() ?? '';

        if (FORBIDDEN_EXT.test(filename) || !(ext in ALLOWED_UPLOADS)) {
          return json({ ok: false, error: `"${filename}" is not an accepted file type.` }, 400);
        }
        if (value.size > MAX_UPLOAD_BYTES) {
          return json({ ok: false, error: `"${filename}" is larger than 8 MB.` }, 400);
        }
        total += value.size;
        if (total > MAX_TOTAL_UPLOAD_BYTES) {
          return json({ ok: false, error: 'Attachments exceed the 20 MB total limit.' }, 400);
        }
        // A browser-declared MIME type is advisory, so it must also be one we
        // expect for that extension before the bytes are forwarded.
        const declared = (value.type || '').toLowerCase();
        if (declared && !ALLOWED_UPLOADS[ext].includes(declared)) {
          return json({ ok: false, error: `"${filename}" does not match its file type.` }, 400);
        }

        attachments.push({
          filename,
          content: Buffer.from(await value.arrayBuffer()),
          contentType: ALLOWED_UPLOADS[ext][0],
        });
      }
    }
  } catch {
    return json({ ok: false, error: 'Could not read the submitted form.' }, 400);
  }

  // ---- spam traps --------------------------------------------------------
  if (fields.website_hp || fields.company_hp) {
    // Silently accept so bots do not learn the trap exists.
    return json({ ok: true }, 200);
  }

  const kind = ['quote', 'inquiry', 'newsletter'].includes(fields.kind) ? fields.kind : 'quote';

  // ---- validation --------------------------------------------------------
  const errors: string[] = [];
  const email = clean(fields.email, 200);
  if (!EMAIL_RE.test(email)) errors.push('a valid email address');

  if (kind !== 'newsletter') {
    if (!fields.name) errors.push('your name');
    if (!fields.phone) errors.push('your phone number');
    if (kind === 'quote' && !fields.quantity) errors.push('an estimated quantity');
    if (!fields.product) errors.push('a product');
  }

  if (errors.length) {
    return json({ ok: false, error: `Please provide ${errors.join(', ')}.` }, 400);
  }

  // ---- transport ---------------------------------------------------------
  const env = import.meta.env;
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_TO', 'SMTP_FROM_EMAIL'];
  const missing = required.filter((k) => !env[k]);
  if (missing.length) {
    console.error(`[quote] missing SMTP configuration: ${missing.join(', ')}`);
    return json(
      {
        ok: false,
        error:
          'The quote service is temporarily unavailable. Please call (503) 358-0443 or email info@hotdogtrays.com.',
      },
      503,
    );
  }

  const port = Number(env.SMTP_PORT);
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  const label =
    kind === 'newsletter'
      ? 'Newsletter signup'
      : kind === 'inquiry'
        ? `Product inquiry — ${fields.product}`
        : `Quote request — ${fields.product}`;

  const rows: [string, string][] = [
    ['Name', fields.name],
    ['Email', email],
    ['Phone', fields.phone],
    ['Company', fields.company],
    ['Product', fields.product],
    ['Quantity', fields.quantity],
    ['Material', fields.material],
    ['Printing', fields.printing],
    ['Submitted from', fields.pageUrl],
  ].filter((r): r is [string, string] => Boolean(r[1]));

  const textBody = [
    ...rows.map(([k, v]) => `${k}: ${v}`),
    fields.details ? `\nDetails:\n${fields.details}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const htmlBody = `
    <h2>${escapeHtml(label)}</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><th align="left" style="border-bottom:1px solid #eee">${escapeHtml(k)}</th>` +
            `<td style="border-bottom:1px solid #eee">${escapeHtml(v)}</td></tr>`,
        )
        .join('')}
    </table>
    ${fields.details ? `<h3>Details</h3><p>${escapeHtml(fields.details).replace(/\n/g, '<br>')}</p>` : ''}
  `;

  try {
    await transport.sendMail({
      from: {
        name: env.SMTP_FROM_NAME || 'Hot Dog Trays',
        address: env.SMTP_FROM_EMAIL,
      },
      to: env.SMTP_TO,
      replyTo: email,
      subject: `${label} — hotdogtrays.com`,
      text: textBody,
      html: htmlBody,
      attachments,
    });
  } catch (error) {
    console.error('[quote] delivery failed', error);
    return json(
      {
        ok: false,
        error:
          'We could not deliver your request. Please call (503) 358-0443 or email info@hotdogtrays.com.',
      },
      502,
    );
  }

  return json({ ok: true }, 200);
};

/** Anything other than POST is not a valid way to reach this endpoint. */
export const ALL: APIRoute = () =>
  json({ ok: false, error: 'Method not allowed.' }, 405);
