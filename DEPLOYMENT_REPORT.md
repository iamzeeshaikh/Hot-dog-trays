# Deployment report — SEO expansion

## Status

| | |
| --- | --- |
| Git commits | `6a89cff`, `2593d12` (pushed to `main`) |
| Vercel project | `iamzeeshaikhs-projects/hotdogtrays` (existing; no second project created) |
| Preview deployments | 6, each verified before promotion |
| **Production deployment** | **https://hotdogtrays.vercel.app** — live and verified |
| **hotdogtrays.com** | **Still served by WordPress. DNS not changed.** |

## Why hotdogtrays.com is unchanged

The brief permits a DNS change only where "the domain is already configured" on
the Vercel project. It is not:

```
$ vercel domains inspect hotdogtrays.com
Error: Domain not found by "hotdogtrays.com" under iamzeeshaikhs-projects
$ curl -s https://hotdogtrays.com/ | grep generator
<meta name="generator" content="WordPress 7.0.2">
```

Attaching the apex domain would require editing the DNS zone, which is outside
what was authorised. The build is deployed, verified and ready; pointing the
domain at it is a decision for the site owner.

**The old WordPress site is untouched and continues to serve every visitor.**

## Production verification (https://hotdogtrays.vercel.app)

| Check | Result |
| --- | --- |
| Homepage, `/shop/`, all 14 products | 200 |
| All 10 new guide pages | 200 |
| `/sitemap.xml` | 200, 33 URLs, all 10 guides present |
| `/robots.txt` | 200, references the sitemap |
| Canonicals | `https://hotdogtrays.com/...` — production host, trailing slashes preserved |
| Localhost / preview canonicals | none |
| `/product-category/products/` | 301 → `/shop/`, single hop to 200 |
| `/cart/`, `/checkout/` | 301 → `/get-quote/` |
| `/my-account/` | 410 |
| `/about` (no slash) | 308 → `/about/` |
| Unknown URL | 404 |
| `/?f=<digits>` | **410** on every path tested |
| `?utm_source`, `?gclid`, `?fbclid`, `?f=hello` | 200 |
| Quote form (serverless + env vars) | `{"ok":true}` — delivered |
| `npm run qa` | 284 / 284 |
| `npm run qa:seo` | 19 / 19 |
| `npm run qa:a11y` | 35 / 35 |

## Pre-deployment gates

Build, type check, all five QA suites, dependency audit and the secret/private
export scans passed before the first deployment. `npm run qa:forms` (14/14) ran
against a local SMTP sink so no test mail reached a real inbox; the single
production submission above was sent deliberately to confirm the live path.

## Rollback

Unchanged from `DEPLOYMENT.md`: because DNS still points at WordPress, rollback
is a no-op — the previous site is already the one serving traffic. Within
Vercel, any earlier deployment can be promoted from Project → Deployments.

## To connect the domain later

Follow `DEPLOYMENT.md` §4. In short: lower the DNS TTL an hour ahead, add both
`hotdogtrays.com` and `www.hotdogtrays.com` in Vercel → Domains, point the apex
record at Vercel, then re-run `QA_BASE=https://hotdogtrays.com npm run qa`.
Record the current DNS values first so a rollback is immediate.
