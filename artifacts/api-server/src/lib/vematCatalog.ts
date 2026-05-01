import { productDetails } from "../../../vemat/src/data/productDetails";
import { parts, type Part } from "../../../vemat/src/data/parts";
import { jlgParts } from "../../../vemat/src/data/jlgParts";
import { blogPosts } from "../../../vemat/src/data/blog";

export type ChatLang = "fr" | "en";

export type ChatSource = {
  type: "product" | "part" | "document" | "page" | "article";
  title: string;
  url: string;
  subtitle?: string;
  snippet?: string;
};

type SearchEntry = {
  id: string;
  text: string;
  source: ChatSource;
};

type ProductRecord = {
  slug: string;
  name: string;
  brand: string;
  descriptionFr: string;
  descriptionEn: string;
  featuresFr: string[];
  featuresEn: string[];
  specifications: Array<[string, string]>;
  downloads: Array<{ label: string; url: string }>;
};

type ProductDetailLike = (typeof productDetails)[string];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .filter(
      (token) =>
        token.length > 1 &&
        ![
          "je",
          "tu",
          "il",
          "elle",
          "nous",
          "vous",
          "ils",
          "elles",
          "de",
          "du",
          "des",
          "la",
          "le",
          "les",
          "un",
          "une",
          "pour",
          "avec",
          "sur",
          "and",
          "the",
          "for",
          "avec",
          "have",
          "has",
          "que",
          "qui",
          "quoi",
          "how",
          "what",
          "where",
          "when",
          "est",
          "are",
          "can",
          "you",
          "moi",
          "mon",
          "ma",
          "mes",
          "need",
          "cherche",
          "recherche",
          "looking",
          "find",
          "brochure",
          "document",
          "doc",
          "pdf",
          "manual",
          "manuels",
          "datasheet",
        ].includes(token),
    );
}

function localizeString(value: string | { fr: string; en: string } | undefined, lang: ChatLang) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.fr || value.en || "";
}

function localizeArray(value: string[] | { fr: string[]; en: string[] } | undefined, lang: ChatLang) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value[lang] || value.fr || value.en || [];
}

function getProductRecords(): ProductRecord[] {
  return Object.entries(productDetails).map(([slug, product]) => {
    const typedProduct = product as ProductDetailLike;

    return {
      slug,
      name: typedProduct.name,
      brand: typedProduct.brand,
      descriptionFr: localizeString(typedProduct.description, "fr"),
      descriptionEn: localizeString(typedProduct.description, "en"),
      featuresFr: localizeArray(typedProduct.features, "fr"),
      featuresEn: localizeArray(typedProduct.features, "en"),
      specifications: Object.entries(typedProduct.specifications || {}).map(([key, value]) => [
        key,
        localizeString(value, "fr") || localizeString(value, "en"),
      ]),
      downloads: (typedProduct.downloads || []).map((download) => ({
        label: download.label,
        url: download.url,
      })),
    };
  });
}

const productRecords = getProductRecords();

const partRecords: Part[] = [...jlgParts, ...parts];

const companyEntries: SearchEntry[] = [
  {
    id: "company-about",
    text: [
      "vemat group distributeur exclusif afrique levage manutention construction",
      "casablanca maroc",
      "jlg magni mecalac tadano terex",
      "expertise technique service apres vente pieces origine",
    ].join(" "),
    source: {
      type: "page",
      title: "Vemat Group",
      subtitle: "À propos",
      url: "/a-propos",
      snippet:
        "Vemat Group accompagne les projets de levage, manutention et construction en Afrique avec une offre multimarque et un support technique de proximité.",
    },
  },
  {
    id: "company-contact",
    text: [
      "contact vemat casablanca maroc email telephone whatsapp devis assistance",
      "route de bouskoura km 13 route d el jadida bp 20230 casablanca maroc",
      "contact@vemat.ma +212 522 65 12 13 +212 650 14 64 64",
    ].join(" "),
    source: {
      type: "page",
      title: "Contacter Vemat",
      subtitle: "Coordonnées",
      url: "/contact",
      snippet:
        "Siège à Casablanca, email contact@vemat.ma, téléphone +212 522 65 12 13 et WhatsApp +212 650 14 64 64.",
    },
  },
  {
    id: "company-services",
    text: [
      "services vente location sav maintenance pieces rechange conseils depannage reparation",
      "vente engins location courte longue duree sav complet pieces origine conseils techniques depannage",
    ].join(" "),
    source: {
      type: "page",
      title: "Services Vemat",
      subtitle: "Support et accompagnement",
      url: "/services",
      snippet:
        "Vente, location, SAV, dépannage, conseils techniques et fourniture de pièces d'origine pour garder les équipements disponibles sur chantier.",
    },
  },
  {
    id: "company-parts",
    text: [
      "pieces de rechange piece reference panier devis jlg atlas telehandler nacelle grue",
      "catalogue pieces origine certifiees",
    ].join(" "),
    source: {
      type: "page",
      title: "Pièces de rechange",
      subtitle: "Catalogue pièces",
      url: "/pieces-de-rechange",
      snippet:
        "La page pièces permet de rechercher une référence, parcourir les familles disponibles et demander un devis.",
    },
  },
];

const blogEntries: SearchEntry[] = blogPosts.flatMap((post) => [
  {
    id: `blog-${post.slug}-fr`,
    text: [post.title.fr, post.excerpt.fr, post.content.fr, post.category, post.author, "blog article conseil expertise maintenance comparaison guide"].join(" "),
    source: {
      type: "article",
      title: post.title.fr,
      subtitle: `${post.category} • Blog`,
      url: `/blog/${post.slug}`,
      snippet: post.excerpt.fr,
    },
  },
  {
    id: `blog-${post.slug}-en`,
    text: [post.title.en, post.excerpt.en, post.content.en, post.category, post.author, "blog article insight guide comparison maintenance"].join(" "),
    source: {
      type: "article",
      title: post.title.en,
      subtitle: `${post.category} • Blog`,
      url: `/blog/${post.slug}`,
      snippet: post.excerpt.en,
    },
  },
]);

const productEntries: SearchEntry[] = productRecords.map((product) => ({
  id: `product-${product.slug}`,
  text: [
    product.name,
    product.brand,
    product.descriptionFr,
    product.descriptionEn,
    product.featuresFr.join(" "),
    product.featuresEn.join(" "),
    product.specifications.map(([key, value]) => `${key} ${value}`).join(" "),
  ].join(" "),
  source: {
    type: "product",
    title: `${product.brand} ${product.name}`,
    subtitle: "Fiche produit",
    url: `/produit/${product.slug}`,
    snippet: product.descriptionFr || product.descriptionEn,
  },
}));

const documentEntries: SearchEntry[] = productRecords.flatMap((product) =>
  product.downloads.map((download, index) => ({
    id: `document-${product.slug}-${index}`,
    text: [product.name, product.brand, download.label].join(" "),
    source: {
      type: "document",
      title: download.label,
      subtitle: `${product.brand} ${product.name}`,
      url: download.url,
      snippet: `Document disponible pour ${product.brand} ${product.name}.`,
    },
  })),
);

const partEntries: SearchEntry[] = partRecords.map((part) => ({
  id: `part-${part.id}`,
  text: [
    part.name,
    part.brand,
    part.reference,
    part.category,
    part.subFamily || "",
    part.description,
  ].join(" "),
  source: {
    type: "part",
    title: `${part.brand} ${part.name}`,
    subtitle: `Réf. ${part.reference}`,
    url: "/pieces-de-rechange",
    snippet: part.description,
  },
}));

function scoreEntry(query: string, entry: SearchEntry) {
  const normalizedQuery = normalizeText(query);
  const normalizedEntry = normalizeText(entry.text);
  const normalizedTitle = normalizeText(entry.source.title);
  const normalizedSubtitle = normalizeText(entry.source.subtitle || "");
  const tokens = tokenize(query);
  let score = 0;

  if (!normalizedQuery) return score;

  if (normalizedEntry.includes(normalizedQuery)) {
    score += normalizedQuery.length > 10 ? 180 : 120;
  }

  for (const token of tokens) {
    if (normalizedTitle.includes(token)) {
      score += token.length >= 4 ? 80 : 50;
      continue;
    }

    if (normalizedSubtitle.includes(token)) {
      score += 45;
      continue;
    }

    if (normalizedEntry.includes(token)) {
      score += token.length >= 5 ? 30 : 18;
    }
  }

  if (entry.source.subtitle && normalizedSubtitle.includes(normalizedQuery)) {
    score += 40;
  }

  if (entry.source.type === "part" && /[0-9]{4,}/.test(normalizedQuery) && normalizedEntry.includes(normalizedQuery)) {
    score += 140;
  }

  if (entry.source.type === "document" && /\b(brochure|document|doc|pdf|manual|manuels|datasheet|fiche)\b/i.test(query)) {
    score += 320;
  }

  if (entry.source.type === "part" && /\b(piece|pieces|part|parts|reference|ref)\b/i.test(query)) {
    score += 220;
  }

  if (entry.source.type === "product" && /\b(grue|crane|machine|boom|lift|telehandler|nacelle)\b/i.test(query)) {
    score += 50;
  }

  if (entry.source.type === "product" && /\b(piece|pieces|part|parts|reference|ref)\b/i.test(query)) {
    score -= 40;
  }

  if (entry.source.type === "article" && /\b(comparatif|compare|comparison|guide|maintenance|entretien|choisir|why|how|conseil|safety|securite)\b/i.test(query)) {
    score += 140;
  }

  return score;
}

function rankSources(entries: SearchEntry[], query: string) {
  return entries
    .map((entry) => ({ entry, score: scoreEntry(query, entry) }))
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((result) => ({
      score: result.score,
      source: result.entry.source,
    }));
}

export function buildCatalogContext(query: string, lang: ChatLang) {
  const wantsParts = /\b(piece|pieces|part|parts|reference|ref)\b/i.test(query);
  const wantsDocuments = /\b(brochure|document|doc|pdf|manual|manuels|datasheet|fiche)\b/i.test(query);
  const wantsContact = /\b(contact|coordonnees|telephone|phone|email|mail|whatsapp|adresse)\b/i.test(query);
  const allSources = [
    ...rankSources(productEntries, query),
    ...rankSources(partEntries, query),
    ...rankSources(documentEntries, query),
    ...rankSources(companyEntries, query),
    ...rankSources(blogEntries, query),
  ].sort((left, right) => right.score - left.score);
  const seen = new Set<string>();

  let sources = allSources
    .map((result) => result.source)
    .filter((source) => {
    const key = `${source.type}:${source.title}:${source.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
    });

  if (wantsParts) {
    const focused = sources.filter((source) => source.type === "part" || source.type === "page");
    if (focused.length > 0) sources = [...focused, ...sources];
  } else if (wantsDocuments) {
    const focused = sources.filter((source) => source.type === "document" || source.type === "product");
    if (focused.length > 0) sources = [...focused, ...sources];
  } else if (wantsContact) {
    const focused = sources.filter((source) => source.type === "page");
    if (focused.length > 0) sources = [...focused, ...sources];
  }

  const suggestions =
    lang === "fr"
      ? [
          "Je cherche une machine pour levage lourd",
          "As-tu la brochure du TRT 35 ?",
          "Je cherche une pièce JLG par référence",
          "Compare Terex et Tadano pour un chantier exigeant",
        ]
      : [
          "I need a machine for heavy lifting",
          "Do you have the TRT 35 brochure?",
          "I need a JLG spare part by reference",
          "Compare Terex and Tadano for a demanding jobsite",
        ];

  const contextLines = sources.map((source, index) => {
    return [
      `${index + 1}. [${source.type}] ${source.title}`,
      source.subtitle ? `Subtitle: ${source.subtitle}` : "",
      source.snippet ? `Snippet: ${source.snippet}` : "",
      `URL: ${source.url}`,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return {
    query,
    sources: sources.slice(0, 8),
    suggestions,
    contextText: contextLines.join("\n\n"),
    hasResults: sources.length > 0,
  };
}

export function buildLocalFallbackAnswer(query: string, lang: ChatLang) {
  const context = buildCatalogContext(query, lang);

  if (!context.hasResults) {
    return {
      mode: "local" as const,
      message:
        lang === "fr"
          ? "Je n’ai pas trouvé de correspondance nette dans le catalogue Vemat. Essaie avec une marque, un modèle, une capacité, une référence de pièce ou le type de document recherché."
          : "I couldn’t find a strong match in the Vemat catalog. Try a brand, model, lifting capacity, spare-part reference, or the type of document you need.",
      sources: [],
      suggestions: context.suggestions,
    };
  }

  const intro =
    lang === "fr"
      ? "J’ai trouvé les éléments les plus proches dans le catalogue Vemat."
      : "I found the closest matches in the Vemat catalog.";

  const bullets = context.sources
    .slice(0, 4)
    .map((source) => {
      const line = source.subtitle ? `${source.title} — ${source.subtitle}` : source.title;
      return `- ${line}`;
    })
    .join("\n");

  const closing =
    lang === "fr"
      ? "Dis-moi si tu veux que je filtre uniquement les machines, les pièces, les brochures ou les infos société."
      : "Tell me if you want me to narrow it down to machines, parts, brochures, or company information only.";

  return {
    mode: "local" as const,
    message: `${intro}\n\n${bullets}\n\n${closing}`,
    sources: context.sources,
    suggestions: context.suggestions,
  };
}
