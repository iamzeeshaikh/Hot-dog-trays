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
