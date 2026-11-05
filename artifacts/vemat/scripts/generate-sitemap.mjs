// Génère public/sitemap.xml à partir des pages publiques, des fiches produits et du blog.
// Usage : node scripts/generate-sitemap.mjs   (à relancer quand on ajoute un produit ou un article)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSeo } from "./load-seo.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://www.vematgroup.com";

const read = (p) => readFileSync(resolve(root, p), "utf8");

const pages = [
  ["/", "1.0"],
  ["/grues", "0.9"],
  ["/nacelles", "0.9"],
  ["/elevateurs-telescopiques", "0.9"],
  ["/construction", "0.9"],
  ["/services", "0.8"],
  ["/pieces-de-rechange", "0.8"],
  ["/blog", "0.7"],
  ["/a-propos", "0.6"],
  ["/contact", "0.7"],
  ["/demande-devis", "0.6"],
  ["/demande-intervention", "0.6"],
];

const productKeys = new Set([
  ...[...read("src/data/productDetails.ts").matchAll(/^  "([^"]+)": \{\n    "id"/gm)].map((m) => m[1]),
  ...[...read("src/data/fuchsProductDetails.ts").matchAll(/^  "?([a-z0-9-]+)"?: \{/gim)].map((m) => m[1]).filter((k) => !["description", "features", "specifications", "images"].includes(k)),
]);
const blogSlugs = [...read("src/data/blog.ts").matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);

const { mod, close } = await loadSeo();
const landingSlugs = mod.landingPages.map((p) => p.slug);
await close();

const today = new Date().toISOString().slice(0, 10);
const url = (path, priority) =>
  `  <url>\n    <loc>${SITE}${path}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>`;

const body = [
  ...pages.map(([p, pr]) => url(p, pr)),
  ...landingSlugs.map((s) => url(`/${s}`, "0.8")),
  ...[...productKeys].sort().map((k) => url(`/produit/${k}`, "0.6")),
  ...blogSlugs.map((s) => url(`/blog/${s}`, "0.5")),
].join("\n");

writeFileSync(
  resolve(root, "public/sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
);
console.log(`sitemap.xml : ${pages.length} pages, ${landingSlugs.length} pages SEO pays/marques, ${productKeys.size} produits, ${blogSlugs.length} articles`);
