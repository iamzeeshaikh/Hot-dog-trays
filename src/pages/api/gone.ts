import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * 410 Gone for confirmed spam parameter URLs.
 *
 * Search Console discovered a large set of `/?f=<long digit string>` URLs.
 * They appear nowhere in the WordPress database, the XML/CSV exports, this
 * project, or any internal link — they are externally injected, and several
 * carry unrelated foreign-language queries. The live WordPress site already
 * answers them with 410, so this preserves that behaviour rather than letting
 * every one of them render an indexable copy of the homepage.
 *
 * Routing to this endpoint is done in vercel.json, which can match on a query
 * parameter; Astro's static output cannot. The match is deliberately narrow
 * (`f` whose value is six or more digits) so genuine marketing parameters —
 * utm_*, gclid, fbclid, msclkid — are untouched and still return 200.
 *
 * A 410 is used rather than a redirect: these URLs never had legitimate
 * content, so pointing them at the homepage would create exactly the duplicate
 * signal we are trying to remove.
 */
const BODY = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>410 Gone — Hot Dog Trays</title>
<style>
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
background:#fff;color:#1d3557;display:grid;place-items:center;min-height:100vh;text-align:center;padding:24px}
main{max-width:34rem}h1{font-size:1.6rem;margin:0 0 .75rem}p{color:#4a5568;line-height:1.6;margin:0 0 1.25rem}
a{display:inline-block;padding:12px 26px;border-radius:50px;background:linear-gradient(135deg,#f9c74f,#e63946);
color:#1d3557;font-weight:800;text-decoration:none}
</style>
</head>
<body>
<main>
<h1>This page is gone</h1>
<p>The address you followed contains a tracking parameter that was never part of this website, so there is nothing here to show.</p>
<a href="/">Go to the homepage</a>
</main>
</body>
</html>
`;

const headers = {
  'Content-Type': 'text/html; charset=utf-8',
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'public, max-age=86400',
};

export const GET: APIRoute = () => new Response(BODY, { status: 410, headers });

export const ALL: APIRoute = () => new Response(BODY, { status: 410, headers });
