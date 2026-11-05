// Pré-rendu : après `vite build`, écrit un dist/public/<slug>/index.html par page d'atterrissage SEO,
// avec title, description, canonical, balises de partage, JSON-LD et le texte de la page déjà dans le HTML.
// Google lit ainsi le contenu sans exécuter de JavaScript ; React reprend la main au chargement.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSeo } from "./load-seo.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist/public");
const template = readFileSync(resolve(dist, "index.html"), "utf8");
if (!template.includes('<div id="root"></div>')) throw new Error("prerender : <div id=\"root\"></div> introuvable dans dist/public/index.html");

const { mod, close } = await loadSeo();
const { landingPages, buildContent, contentToHtml, esc, SITE } = mod;

const replaceOnce = (html, re, value, label) => {
  if (!re.test(html)) throw new Error(`prerender : balise introuvable (${label})`);
  return html.replace(re, () => value);
};

let count = 0;
for (const page of landingPages) {
  const ct = buildContent(page);
  const url = `${SITE}/${page.slug}`;
  let html = template;
  html = replaceOnce(html, /<html lang="[^"]*"/, `<html lang="${ct.lang}"`, "html lang");
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${esc(ct.title)}</title>`, "title");
  html = replaceOnce(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(ct.description)}" />`, "description");
  html = replaceOnce(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(ct.title)}" />`, "og:title");
  html = replaceOnce(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(ct.description)}" />`, "og:description");
  html = replaceOnce(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${esc(ct.title)}" />`, "twitter:title");
  html = replaceOnce(html, /<meta property="og:locale" content="[^"]*" \/>/, `<meta property="og:locale" content="${ct.lang === "fr" ? "fr_FR" : "en_US"}" />`, "og:locale");

  const head = [
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:url" content="${url}" />`,
    ...ct.alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${a.href}" />`),
    ...ct.jsonLd.map((d) => `<script type="application/ld+json" data-landing="1">${JSON.stringify(d).replace(/</g, "\\u003c")}</script>`),
  ].join("\n    ");
  html = replaceOnce(html, /<\/head>/, `    ${head}\n  </head>`, "head");
  html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${contentToHtml(ct)}</div>`, "root");

  const dir = resolve(dist, page.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "index.html"), html);
  count++;
}
await close();
console.log(`prerender : ${count} pages écrites dans dist/public/`);
