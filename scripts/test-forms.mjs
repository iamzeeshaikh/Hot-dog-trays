/**
 * End-to-end test of the quote / inquiry / newsletter endpoint.
 *
 * Starts a throwaway SMTP server on localhost, points the dev server at it via
 * environment variables, and drives the real forms in a browser. Nothing is
 * sent to a real mailbox.
 *
 *   node scripts/test-forms.mjs
 */
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright';

const SMTP_PORT = 2525;
const DEV_PORT = 4331;

const received = [];
const results = [];
const pass = (n, d = '') => results.push({ ok: true, n, d });
const fail = (n, d) => results.push({ ok: false, n, d });

// ---- minimal SMTP sink ----------------------------------------------------
const smtp = createServer((socket) => {
  let buffer = '';
  let inData = false;
  let message = '';

  socket.write('220 localhost test SMTP\r\n');
  socket.on('data', (chunk) => {
    buffer += chunk.toString('utf8');

    while (true) {
      if (inData) {
        const end = buffer.indexOf('\r\n.\r\n');
        if (end === -1) return;
        message += buffer.slice(0, end);
        buffer = buffer.slice(end + 5);
        inData = false;
        received.push(message);
        message = '';
        socket.write('250 OK queued\r\n');
        continue;
      }

      const nl = buffer.indexOf('\r\n');
      if (nl === -1) return;
      const line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 2);
      const verb = line.split(/[\s:]/)[0].toUpperCase();

      if (verb === 'EHLO' || verb === 'HELO') {
        socket.write('250-localhost\r\n250 AUTH PLAIN LOGIN\r\n');
      } else if (verb === 'AUTH') {
        socket.write('235 Authentication successful\r\n');
      } else if (verb === 'MAIL' || verb === 'RCPT') {
        socket.write('250 OK\r\n');
      } else if (verb === 'DATA') {
        inData = true;
        socket.write('354 End data with <CR><LF>.<CR><LF>\r\n');
      } else if (verb === 'QUIT') {
        socket.write('221 Bye\r\n');
        socket.end();
        return;
      } else {
        socket.write('250 OK\r\n');
      }
    }
  });
  socket.on('error', () => {});
});

await new Promise((resolve) => smtp.listen(SMTP_PORT, '127.0.0.1', resolve));
console.log(`test SMTP sink listening on ${SMTP_PORT}`);

// ---- dev server with test credentials -------------------------------------
const dev = spawn('npx', ['astro', 'dev', '--port', String(DEV_PORT)], {
  env: {
    ...process.env,
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: String(SMTP_PORT),
    SMTP_USER: 'test',
    SMTP_PASS: 'test',
    SMTP_TO: 'sales@example.test',
    SMTP_FROM_NAME: 'Hot Dog Trays',
    SMTP_FROM_EMAIL: 'no-reply@example.test',
    // Above the ~6 requests the functional tests make, but low enough that the
    // flood loop at the end still trips the limiter on the same server.
    QUOTE_RATE_LIMIT: '12',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
dev.stdout.on('data', () => {});
dev.stderr.on('data', (d) => process.env.VERBOSE && console.error(String(d)));

const BASE = `http://localhost:${DEV_PORT}`;
for (let i = 0; i < 60; i++) {
  try {
    await fetch(BASE + '/');
    break;
  } catch {
    await sleep(500);
  }
}
console.log('dev server up\n');

async function cleanup(code) {
  dev.kill('SIGTERM');
  smtp.close();
  await sleep(300);
  process.exit(code);
}

try {
  // ---- 1. product inquiry form through the browser ------------------------
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${BASE}/product/hot-dog-serving-tray/`, { waitUntil: 'networkidle' });

  // the product travels as a hidden field; the heading shows it to the user
  const preset = await page.inputValue('.hdt-inquiry-form input[name="product"]');
  const shown = await page.textContent('.hdt-inquiry-subtitle');
  preset === 'Hot Dog Serving Tray' && shown.includes('Hot Dog Serving Tray')
    ? pass('product preselected in inquiry form', preset)
    : fail('product preselected', `${preset} / ${shown}`);

  // client-side validation blocks an empty submit
  await page.click('.hdt-inquiry-submit');
  await page.waitForTimeout(400);
  const invalidMsg = await page.textContent('.hdt-inquiry-form [data-form-message]');
  invalidMsg?.includes('Please provide')
    ? pass('client validation blocks empty submit', invalidMsg.trim())
    : fail('client validation', invalidMsg ?? 'no message');

  received.length = 0;
  await page.fill('#inquiry-name', 'Test Buyer');
  await page.fill('#inquiry-email', 'buyer@example.test');
  await page.fill('#inquiry-phone', '5033580443');
  await page.fill('#inquiry-details', 'Need 5000 units with custom print.');
  await page.click('.hdt-inquiry-submit');
  await page.waitForFunction(
    () =>
      document
        .querySelector('.hdt-inquiry-form [data-form-message]')
        ?.getAttribute('data-state') !== 'pending',
    { timeout: 20000 },
  );
  const state = await page.getAttribute('.hdt-inquiry-form [data-form-message]', 'data-state');
  const msg = await page.textContent('.hdt-inquiry-form [data-form-message]');

  if (state === 'success') pass('inquiry form submits successfully', msg.trim().slice(0, 60));
  else fail('inquiry form submit', `${state}: ${msg}`);

  await sleep(400);
  if (received.length === 1) {
    const mail = received[0];
    const checks = [
      ['recipient', mail.includes('sales@example.test')],
      ['reply-to submitter', /Reply-To:.*buyer@example\.test/i.test(mail)],
      ['product name', mail.includes('Hot Dog Serving Tray')],
      ['submitting page URL', mail.includes('/product/hot-dog-serving-tray/')],
      ['message body', /Need 5000 units/.test(mail)],
    ];
    for (const [what, ok] of checks) {
      ok ? pass(`email contains ${what}`) : fail(`email contains ${what}`, 'absent');
    }
  } else {
    fail('exactly one email delivered', `got ${received.length}`);
  }

  await page.close();
  await browser.close();

  // ---- 2. endpoint-level security checks ----------------------------------
  // Astro's CSRF check requires a same-origin Origin header on form posts,
  // which a real browser always sends.
  const post = (body, headers = {}) =>
    fetch(`${BASE}/api/quote/`, {
      method: 'POST',
      body,
      headers: { Origin: BASE, ...headers },
    });

  // honeypot: accepted silently, nothing delivered
  received.length = 0;
  let res = await post(
    JSON.stringify({
      kind: 'quote',
      name: 'Bot',
      email: 'bot@example.test',
      phone: '1',
      product: 'X',
      quantity: '100-500',
      website_hp: 'http://spam.example',
    }),
    { 'Content-Type': 'application/json' },
  );
  const honeypotJson = await res.json();
  if (res.status === 200 && honeypotJson.ok && received.length === 0) {
    pass('honeypot submission accepted but not delivered');
  } else {
    fail('honeypot', `status ${res.status}, delivered ${received.length}`);
  }

  // server-side validation independent of the browser
  res = await post(JSON.stringify({ kind: 'quote', email: 'not-an-email' }), {
    'Content-Type': 'application/json',
  });
  res.status === 400
    ? pass('server rejects invalid payload', (await res.json()).error)
    : fail('server validation', `status ${res.status}`);

  // executable upload is refused
  received.length = 0;
  const evil = new FormData();
  evil.set('kind', 'inquiry');
  evil.set('name', 'Test');
  evil.set('email', 'a@b.test');
  evil.set('phone', '1');
  evil.set('product', 'Hot Dog Serving Tray');
  evil.set('artwork', new File(['<?php system($_GET[0]); ?>'], 'shell.php', { type: 'application/x-php' }));
  res = await post(evil);
  const evilJson = await res.json();
  res.status === 400 && received.length === 0
    ? pass('executable upload rejected', evilJson.error)
    : fail('executable upload', `status ${res.status}, delivered ${received.length}`);

  // a disguised extension is refused too
  const disguised = new FormData();
  disguised.set('kind', 'inquiry');
  disguised.set('name', 'Test');
  disguised.set('email', 'a@b.test');
  disguised.set('phone', '1');
  disguised.set('product', 'Hot Dog Serving Tray');
  disguised.set('artwork', new File(['MZ'], 'art.png', { type: 'application/x-msdownload' }));
  res = await post(disguised);
  res.status === 400
    ? pass('MIME/extension mismatch rejected', (await res.json()).error)
    : fail('MIME mismatch', `status ${res.status}`);

  // header injection in a field cannot reach the message headers
  received.length = 0;
  res = await post(
    JSON.stringify({
      kind: 'quote',
      name: 'Evil\r\nBcc: victim@example.test',
      email: 'ok@example.test',
      phone: '1',
      product: 'Hot Dog Serving Tray',
      quantity: '100-500',
    }),
    { 'Content-Type': 'application/json' },
  );
  await sleep(300);
  if (res.status === 200 && received.length === 1 && !/^Bcc:/im.test(received[0])) {
    pass('CRLF header injection neutralised');
  } else {
    fail('header injection', `status ${res.status}, bcc present: ${/^Bcc:/im.test(received[0] ?? '')}`);
  }

  // rate limiting: the same server, flooded past its configured threshold
  // (Astro's dev server is single-instance, so a second one cannot be started)
  let limited = false;
  for (let i = 0; i < 20; i++) {
    const r = await post(
      JSON.stringify({
        kind: 'quote',
        name: 'Flood',
        email: 'flood@example.test',
        phone: '1',
        product: 'Hot Dog Serving Tray',
        quantity: '100-500',
      }),
      { 'Content-Type': 'application/json' },
    );
    if (r.status === 429) {
      limited = true;
      break;
    }
  }
  limited
    ? pass('rate limiting returns 429 past the configured threshold')
    : fail('rate limiting', 'never triggered');
} catch (error) {
  fail('test harness', error.message);
}

const failures = results.filter((r) => !r.ok);
console.log('\n' + '='.repeat(72));
for (const r of results) console.log(`  ${r.ok ? '✓' : '✗'} ${r.n}${r.d ? ` — ${r.d}` : ''}`);
console.log(`\n${results.length - failures.length} passed, ${failures.length} failed`);
console.log('='.repeat(72));

await cleanup(failures.length ? 1 : 0);
