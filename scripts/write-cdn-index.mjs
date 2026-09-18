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
const html = `<!doctype html>
<html lang="zh-Hant-TW">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0b0e14" />
    <title>八路列傳</title>
    <base href="https://cdn.jsdelivr.net/gh/morgan86399-eng/balu-preview@5b87f4647647a3f3c730c2e1a1b19f1018af8d32/public/">
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@500;700&family=Noto+Serif+TC:wght@700;900&display=swap" rel="stylesheet" />
    <script type="module" crossorigin src="https://cdn.jsdelivr.net/gh/morgan86399-eng/balu-preview@main/preview-assets/${js}"></script>
    <link rel="stylesheet" crossorigin href="https://cdn.jsdelivr.net/gh/morgan86399-eng/balu-preview@main/preview-assets/${css}">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;
writeFileSync("dist/index.html", html);
console.log("cdn index ->", js, css);
