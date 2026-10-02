/* Analytics bootstrap — GA4 (gtag) + Microsoft Clarity.
   Self-hosted on purpose: the site's CSP is hash-based with no 'unsafe-inline',
   and Astro does not hash `is:inline` scripts, so an inline snippet here is
   silently blocked. Loaded from /analytics-boot.js, which `script-src 'self'`
   allows. Keep it before gtag.js so dataLayer/gtag exist first. */
window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
window.gtag = gtag;
gtag("js", new Date());
gtag("config", "G-N3HYCBHC8Y");

/* gtag config and events queue in dataLayer straight away; the gtag and
   Clarity scripts themselves load once the page is idle, so they never compete
   with the hero on a phone, and never for automated browsers
   (navigator.webdriver), which were inflating traffic. */
function loadAnalytics() {
  if (navigator.webdriver) return;
  var g = document.createElement("script");
  g.async = true;
  g.src = "https://www.googletagmanager.com/gtag/js?id=G-N3HYCBHC8Y";
  document.head.appendChild(g);
  (function (c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
    t = l.createElement(r);
    t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", "yk7d21q01g");
}
function laterAnalytics() {
  if (window.requestIdleCallback) requestIdleCallback(loadAnalytics, { timeout: 2000 });
  else setTimeout(loadAnalytics, 0);
}
if (document.readyState === "complete") laterAnalytics();
else window.addEventListener("load", laterAnalytics, { once: true });
