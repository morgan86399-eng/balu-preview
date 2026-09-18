import { readdirSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const assetsDir = "dist/assets";
const files = readdirSync(assetsDir);
const js = files.find((f) => f.endsWith(".js"));
const css = files.find((f) => f.endsWith(".css"));
if (!js || !css) {
  console.error("write-cdn-index: missing js/css in dist/assets");
  process.exit(1);
}
mkdirSync("preview-assets", { recursive: true });
copyFileSync(join(assetsDir, js), join("preview-assets", js));
copyFileSync(join(assetsDir, css), join("preview-assets", css));

// Pin public/ + JS/CSS to one commit (filled after the assets push).
// Cache-bust query so jsDelivr @main / stale HTML cannot serve N10-era files.
const MEDIA_COMMIT = process.env.CDN_COMMIT || "8ae3415e5adc30d5365b0217b371d92bdf4ffea3";
const CACHE_BUST = "n11fix1";
const cdn = `https://cdn.jsdelivr.net/gh/morgan86399-eng/balu-preview@${MEDIA_COMMIT}`;
const qs = `?v=${CACHE_BUST}`;
const html = `<!doctype html>
<html lang="zh-Hant-TW">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0b0e14" />
    <title>八路列傳</title>
    <!-- N11 fix: one pin for public/ + preview-assets; ?v=${CACHE_BUST}; N10 hotfix script omitted -->
    <base href="${cdn}/public/">
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@500;700&family=Noto+Serif+TC:wght@700;900&display=swap" rel="stylesheet" />
    <script type="module" crossorigin src="${cdn}/preview-assets/${js}${qs}"></script>
    <link rel="stylesheet" crossorigin href="${cdn}/preview-assets/${css}${qs}">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;
writeFileSync("dist/index.html", html);
console.log("cdn index ->", js, css, "pin", MEDIA_COMMIT, qs);
