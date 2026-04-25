import { productDetails } from "@/data/productDetails";
import { parts } from "@/data/parts";
import { blogPosts } from "@/data/blog";
import type { Lang } from "@/i18n/translations";

export type LocalAssistantSource = {
  type: "product" | "part" | "document" | "page" | "article";
  title: string;
  url: string;
  subtitle?: string;
  snippet?: string;
};

export type LocalAssistantResponse = {
  mode: "local";
  message: string;
  sources: LocalAssistantSource[];
  suggestions: string[];
};

type SearchResult = {
  score: number;
  source: LocalAssistantSource;
};

// ─── Static brand + product knowledge ────────────────────────────────────────

const BRAND_KNOWLEDGE: Record<string, { fr: string; en: string }> = {
  jlg: {
    fr: "**JLG** est le leader mondial des nacelles élévatrices. Vemat distribue toute la gamme :\n- **1850SJ** : 60 m de hauteur — la plus haute nacelle du monde, pour raffineries et grands chantiers industriels\n- **860SJ / 660SJ** : 52 m / 40 m, flèches télescopiques tout-terrain\n- **800AJ / 600AJ / 460AJ** : nacelles articulées \"Up & Over\" pour travailler par-dessus des obstacles\n- **H600SJ / E600JP** : modèles hybrides et électriques, zéro émission\n\nPour un devis ou une disponibilité, contactez **contact@vemat.ma** ou WhatsApp **+212 650 14 64 64**.",
    en: "**JLG** is the world leader in aerial work platforms. Vemat distributes the full range:\n- **1850SJ**: 60 m working height — the world's tallest boom lift, for refineries and major industrial sites\n- **860SJ / 660SJ**: 52 m / 40 m telescopic booms, all-terrain\n- **800AJ / 600AJ / 460AJ**: articulating booms \"Up & Over\" to work over obstacles\n- **H600SJ / E600JP**: hybrid and electric models, zero emissions\n\nFor a quote or availability, contact **contact@vemat.ma** or WhatsApp **+212 650 14 64 64**.",
  },
  tadano: {
    fr: "**Tadano** — grues tout-terrain japonaises, réputées pour leur durabilité légendaire et leur haute valeur de revente.\n- Série **GR** : GR-160N (16 t) → GR-1000N (100 t)\n- Série **ZR** : rayon de giration zéro, idéal espaces confinés\n- **GR-350N** : la plus demandée sur les chantiers marocains\n- Système **AML-E** : limiteur de moment automatique pour un levage ultra-sécurisé\n- **Eco-Mode** : −15 % de consommation carburant\n\nContactez Vemat pour disponibilité : **contact@vemat.ma** | **+212 522 65 12 13**.",
    en: "**Tadano** — Japanese rough-terrain cranes, renowned for legendary durability and high resale value.\n- **GR series**: GR-160N (16 t) to GR-1000N (100 t)\n- **ZR series**: zero tail-swing, ideal for confined spaces\n- **GR-350N**: most requested on Moroccan jobsites\n- **AML-E system**: automatic moment limiter for ultra-safe lifting\n- **Eco-Mode**: −15% fuel consumption\n\nContact Vemat for availability: **contact@vemat.ma** | **+212 522 65 12 13**.",
  },
  terex: {
    fr: "**Terex** — grues rough terrain robustes et technologiques.\n- **RT100US** : 100 t de capacité, 4 modes de direction, système **TEOS** (écran tactile intuitif), climatisation HP\n- **RT90US / RT75US** : 90 t / 75 t\n- Points forts : cabine très ergonomique, extrêmement maniable, compétitif à l'achat\n- vs Tadano : Terex = meilleure ergonomie et interface, Tadano = durée de vie et revente supérieures\n\nDevis et disponibilité : **contact@vemat.ma** | WhatsApp **+212 650 14 64 64**.",
    en: "**Terex** — robust, technology-driven rough-terrain cranes.\n- **RT100US**: 100 t capacity, 4 steering modes, **TEOS** system (intuitive touchscreen), high-performance A/C\n- **RT90US / RT75US**: 90 t / 75 t\n- Strengths: highly ergonomic cabin, extremely maneuverable, competitive purchase price\n- vs Tadano: Terex = better ergonomics and interface; Tadano = superior lifespan and resale value\n\nQuote and availability: **contact@vemat.ma** | WhatsApp **+212 650 14 64 64**.",
  },
  magni: {
    fr: "**Magni RTH** — élévateurs télescopiques rotatifs, distributeur **exclusif** Vemat pour l'Afrique francophone.\n- Rotation **360°** complète sans repositionner la machine\n- RTH 6.26 (6 t / 26 m), RTH 7.35 (7 t / 35 m), RTH 10.35 (10 t / 35 m), RTH 15.35 (15 t / 35 m)\n- Remplace à la fois une grue légère et un chariot élévateur\n- Stabilisateurs télescopiques, cabine inclinable, écran Danfoss\n\nDémonstration et devis : **contact@vemat.ma** | WhatsApp **+212 650 14 64 64**.",
    en: "**Magni RTH** — rotating telescopic handlers. Vemat is the **exclusive** distributor for French-speaking Africa.\n- Full **360° rotation** without repositioning the machine\n- RTH 6.26 (6 t / 26 m), RTH 7.35 (7 t / 35 m), RTH 10.35 (10 t / 35 m), RTH 15.35 (15 t / 35 m)\n- Replaces both a light mobile crane and a forklift\n- Telescopic stabilizers, tilting cab, Danfoss screen\n\nDemo and quote: **contact@vemat.ma** | WhatsApp **+212 650 14 64 64**.",
  },
  mecalac: {
    fr: "**Mecalac** — engins de construction compacts pour chantiers urbains et confinés.\n- **MCR (14MCR, 12MCR)** : concept 3-en-1 (pelle + chargeuse + porte-outil), 10 km/h sur route, attache rapide CONNECT\n- **AS1600 / AS900** : chargeurs compacts à bras oscillant\n- **3.5MDX / 6MDX** : dumpers cabiné ROPS/FOPS, benne rotative 180°, système Shield (sécurité active)\n- Avantage clé : 1 machine Mecalac = 3 engins classiques → moins de matériel sur site\n\nDevis et démonstration : **contact@vemat.ma** | **+212 522 65 12 13**.",
    en: "**Mecalac** — compact construction equipment for urban and confined jobsites.\n- **MCR (14MCR, 12MCR)**: 3-in-1 concept (excavator + loader + tool carrier), 10 km/h road speed, CONNECT quick coupler\n- **AS1600 / AS900**: compact swing loaders\n- **3.5MDX / 6MDX**: ROPS/FOPS certified cabbed dumpers, 180° rotating skip, Shield system (active safety)\n- Key advantage: 1 Mecalac = 3 classic machines → fewer machines on site\n\nQuote and demo: **contact@vemat.ma** | **+212 522 65 12 13**.",
  },
};

const CONTACT_KNOWLEDGE = {
  fr: "**Vemat Group — Coordonnées**\n- Email : contact@vemat.ma\n- Téléphone : +212 522 65 12 13\n- WhatsApp : +212 650 14 64 64\n- Adresse : Route de Bouskoura KM 13, Route d'El Jadida BP 20230, Casablanca, Maroc\n\nPour un devis rapide, le WhatsApp est la voie la plus directe.",
  en: "**Vemat Group — Contact**\n- Email: contact@vemat.ma\n- Phone: +212 522 65 12 13\n- WhatsApp: +212 650 14 64 64\n- Address: Route de Bouskoura KM 13, Route d'El Jadida BP 20230, Casablanca, Morocco\n\nFor a quick quote, WhatsApp is the fastest route.",
};

const COMPARISON_KNOWLEDGE = {
  "tadano-terex": {
    fr: "**Tadano vs Terex — Grues rough terrain**\n\n**Tadano GR**\n- Ingénierie japonaise, durabilité légendaire\n- Valeur de revente très haute\n- AML-E (limiteur automatique), Eco-Mode (−15% carburant)\n- Meilleur pour : environnements extrêmes, rentabilité long terme\n\n**Terex RT**\n- Système TEOS (écran tactile intuitif)\n- Cabine très ergonomique, 4 modes de direction\n- Prix d'achat compétitif\n- Meilleur pour : ergonomie opérateur, innovation technologique\n\n**Conseil Vemat :** si vous cherchez une machine qui tient 20 ans avec peu d'entretien → Tadano. Si vous privilégiez la facilité d'utilisation et le prix d'entrée → Terex.",
    en: "**Tadano vs Terex — Rough terrain cranes**\n\n**Tadano GR**\n- Japanese engineering, legendary durability\n- Very high resale value\n- AML-E (automatic limiter), Eco-Mode (−15% fuel)\n- Best for: extreme environments, long-term ROI\n\n**Terex RT**\n- TEOS system (intuitive touchscreen)\n- Very ergonomic cabin, 4 steering modes\n- Competitive purchase price\n- Best for: operator comfort, tech innovation\n\n**Vemat recommendation:** if you want a machine that lasts 20 years with minimal maintenance → Tadano. If you prioritize ease of use and entry price → Terex.",
  },
  "jlg-types": {
    fr: "**Nacelle télescopique vs articulée (JLG)**\n\n**Télescopique (SJ series : 660SJ, 860SJ, 1850SJ)**\n- Grande portée horizontale\n- Idéale en extérieur, terrain dégagé\n- Déploiement plus rapide (QuikStick™)\n\n**Articulée (AJ series : 600AJ, 800AJ)**\n- Peut travailler \"Up & Over\" : monte, passe par-dessus un obstacle, redescend\n- Idéale en intérieur ou avec des obstacles\n- Plus compacte au transport\n\n**Règle simple :** si vous devez travailler par-dessus quelque chose (tuyauterie, structure, bâtiment) → articulée. Si vous avez de l'espace et voulez la plus grande hauteur → télescopique.",
    en: "**Telescopic vs articulating boom lift (JLG)**\n\n**Telescopic (SJ series: 660SJ, 860SJ, 1850SJ)**\n- Greater horizontal outreach\n- Best outdoors, open terrain\n- Faster deployment (QuikStick™)\n\n**Articulating (AJ series: 600AJ, 800AJ)**\n- Works \"Up & Over\": rises, clears obstacles, descends to work zone\n- Best indoors or with obstacles\n- More compact for transport\n\n**Simple rule:** if you need to work over something (pipes, structures, buildings) → articulating. If you have open space and want maximum height → telescopic.",
  },
};

// ─── Text utilities ───────────────────────────────────────────────────────────

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, " ")
    .trim();
}

function tokenize(value: string) {
  const stopwords = new Set([
    "je", "tu", "il", "elle", "nous", "vous", "ils", "de", "du", "des", "la", "le", "les",
    "un", "une", "pour", "avec", "sur", "the", "for", "and", "with", "have", "que", "qui",
    "est", "are", "can", "you", "moi", "mon", "ma", "mes", "need", "cherche", "recherche",
    "looking", "find", "piece", "pieces", "part", "parts",
  ]);
  return normalizeText(value)
    .split(/\s+/)
    .filter((t) => t.length > 1 && !stopwords.has(t));
}

function localizeText(value: string | { fr: string; en: string } | undefined, lang: Lang) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.fr || value.en || "";
}

function localizeArray(value: string[] | { fr: string[]; en: string[] } | undefined, lang: Lang) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value[lang] || value.fr || value.en || [];
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function score(query: string, title: string, body: string, type: LocalAssistantSource["type"]) {
  const nq = normalizeText(query);
  const nt = normalizeText(title);
  const nb = normalizeText(body);
  const tokens = tokenize(query);
  let total = 0;

  if (!nq) return 0;
  if (nt.includes(nq)) total += 220;
  if (nb.includes(nq)) total += 120;

  for (const token of tokens) {
    if (nt.includes(token)) total += 60;
    else if (nb.includes(token)) total += 20;
  }

  if (type === "document" && /\b(brochure|document|doc|pdf|manual|datasheet|fiche)\b/i.test(query)) total += 260;
  if (type === "part" && /\b(piece|pieces|part|parts|reference|ref)\b/i.test(query)) total += 260;
  if (type === "product" && /\b(piece|pieces|part|parts|reference|ref)\b/i.test(query)) total -= 40;
  if (type === "article" && /\b(comparatif|compare|comparison|guide|maintenance|entretien|choisir|why|how|conseil|safety|securite)\b/i.test(query)) total += 140;

  return total;
}

// ─── Intent detection ─────────────────────────────────────────────────────────

function detectIntent(query: string) {
  const q = query.toLowerCase();
  return {
    wantsBrand: (
      q.includes("jlg") ? "jlg" :
      q.includes("tadano") ? "tadano" :
      q.includes("terex") ? "terex" :
      q.includes("magni") ? "magni" :
      q.includes("mecalac") ? "mecalac" :
      null
    ),
    wantsCompareTadanoTerex: /tadano.*terex|terex.*tadano|comparer?.*grue|grue.*comparer?|crane.*compar|compar.*crane/i.test(query),
    wantsCompareJlgTypes: /articulee?.*telescopique?|telescopique?.*articulee?|boom.*type|nacelle.*type|aj.*sj|sj.*aj/i.test(query),
    wantsParts: /\b(piece|pieces|part|parts|reference|ref)\b/i.test(query),
    wantsDocuments: /\b(brochure|document|doc|pdf|manual|datasheet|fiche)\b/i.test(query),
    wantsContact: /\b(contact|coordonnees|coordonn|telephone|phone|email|mail|whatsapp|adresse|devis|quote|prix|price)\b/i.test(query),
    wantsService: /\b(location|louer|rent|sav|maintenance|entretien|formation|training|reparation|repair)\b/i.test(query),
  };
}

// ─── Suggestions ──────────────────────────────────────────────────────────────

function getSuggestions(query: string, lang: Lang): string[] {
  const q = query.toLowerCase();

  if (lang === "fr") {
    if (/jlg|nacelle|boom|hauteur/i.test(q)) {
      return ["Quelle nacelle pour 40 m en intérieur ?", "Différence nacelle articulée vs télescopique ?", "Brochure JLG 1850SJ ?", "Modèles électriques JLG disponibles ?"];
    }
    if (/tadano|terex|grue|crane|levage/i.test(q)) {
      return ["Comparer Tadano et Terex", "Quelle grue pour 50 t en zone confinée ?", "Tadano GR-350N disponible ?", "Demander un devis grue"];
    }
    if (/magni|rotatif|telehandler/i.test(q)) {
      return ["Capacités Magni RTH disponibles ?", "Différence Magni RTH vs chariot télescopique ?", "Demander une démo Magni", "Location Magni disponible ?"];
    }
    if (/mecalac|mcr|dumper|urbain/i.test(q)) {
      return ["Mecalac 14MCR vs 12MCR ?", "Fiche technique Mecalac 3.5MDX ?", "Location Mecalac disponible ?", "Concept 3-en-1 Mecalac expliqué"];
    }
    return ["Quelle machine pour du levage lourd ?", "Comparer Tadano et Terex", "Services de location Vemat ?", "Comment contacter Vemat ?"];
  } else {
    if (/jlg|boom|height|nacelle/i.test(q)) {
      return ["Best boom lift for 40 m indoors?", "Telescopic vs articulating boom?", "JLG 1850SJ brochure?", "Electric JLG models available?"];
    }
    if (/tadano|terex|crane|lifting/i.test(q)) {
      return ["Compare Tadano vs Terex", "Best crane for 50 t in confined space?", "Tadano GR-350N available?", "Request a crane quote"];
    }
    if (/magni|rotating|telehandler/i.test(q)) {
      return ["Magni RTH capacity options?", "Magni RTH vs standard telehandler?", "Request Magni demo", "Magni rental available?"];
    }
    if (/mecalac|mcr|dumper|urban/i.test(q)) {
      return ["Mecalac 14MCR vs 12MCR?", "Mecalac 3.5MDX technical specs?", "Mecalac rental available?", "Mecalac 3-in-1 concept explained"];
    }
    return ["Best machine for heavy lifting?", "Compare Tadano vs Terex", "Vemat rental services?", "How to contact Vemat?"];
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function getLocalAssistantReply(query: string, lang: Lang): LocalAssistantResponse {
  const intent = detectIntent(query);
  const suggestions = getSuggestions(query, lang);

  // Comparisons (must come before brand check to avoid early exit)
  if (intent.wantsCompareTadanoTerex) {
    const comp = COMPARISON_KNOWLEDGE["tadano-terex"];
    return {
      mode: "local",
      message: comp[lang],
      sources: searchProducts("tadano terex grue", lang).slice(0, 4),
      suggestions: lang === "fr"
        ? ["Capacités Tadano GR disponibles ?", "Terex RT100US fiche technique ?", "Demander un devis grue", "Location grue disponible ?"]
        : ["Tadano GR capacity options?", "Terex RT100US specs?", "Request a crane quote", "Crane rental available?"],
    };
  }

  if (intent.wantsCompareJlgTypes) {
    const comp = COMPARISON_KNOWLEDGE["jlg-types"];
    return {
      mode: "local",
      message: comp[lang],
      sources: searchProducts("jlg nacelle boom", lang).slice(0, 4),
      suggestions,
    };
  }

  // Brand-specific knowledge
  if (intent.wantsBrand && !intent.wantsParts && !intent.wantsDocuments) {
    const knowledge = BRAND_KNOWLEDGE[intent.wantsBrand];
    if (knowledge) {
      return {
        mode: "local",
        message: knowledge[lang],
        sources: searchProducts(query, lang).slice(0, 4),
        suggestions,
      };
    }
  }

  // Contact / quote
  if (intent.wantsContact) {
    return {
      mode: "local",
      message: CONTACT_KNOWLEDGE[lang],
      sources: [
        {
          type: "page",
          title: lang === "fr" ? "Contacter Vemat" : "Contact Vemat",
          subtitle: lang === "fr" ? "Coordonnées et devis" : "Contact details & quotes",
          url: "/contact",
          snippet: lang === "fr" ? "Email, téléphone, WhatsApp et adresse Vemat." : "Email, phone, WhatsApp and Vemat address.",
        },
      ],
      suggestions,
    };
  }

  // Parts
  if (intent.wantsParts) {
    return {
      mode: "local",
      message: lang === "fr"
        ? "Pour les pièces de rechange, Vemat maintient un **stock de pièces d'origine** JLG, Mecalac, Magni, Terex et Tadano à Casablanca.\n\nRecherche par référence sur la page pièces, ou contactez directement :\n- Email : contact@vemat.ma\n- WhatsApp : **+212 650 14 64 64** (voie la plus rapide pour les urgences)"
        : "For spare parts, Vemat maintains a **stock of original parts** for JLG, Mecalac, Magni, Terex, and Tadano in Casablanca.\n\nSearch by reference on the parts page, or contact us directly:\n- Email: contact@vemat.ma\n- WhatsApp: **+212 650 14 64 64** (fastest for urgent needs)",
      sources: [
        {
          type: "page",
          title: lang === "fr" ? "Pièces de rechange" : "Spare parts",
          subtitle: lang === "fr" ? "Catalogue pièces Vemat" : "Vemat parts catalog",
          url: "/pieces-de-rechange",
          snippet: lang === "fr" ? "Recherche par référence, famille ou marque." : "Search by reference, family, or brand.",
        },
      ],
      suggestions,
    };
  }

  // Services
  if (intent.wantsService) {
    return {
      mode: "local",
      message: lang === "fr"
        ? "**Services Vemat**\n- **Vente** : équipements neufs avec conseil à l'achat\n- **Location** : courte et longue durée, parc disponible\n- **SAV** : techniciens certifiés, intervention rapide\n- **Pièces** : stock d'origine à Casablanca\n- **Formation** : formation opérateurs sur site\n\nContactez-nous pour un devis sur mesure : **contact@vemat.ma** | WhatsApp **+212 650 14 64 64**"
        : "**Vemat services**\n- **Sales**: new equipment with purchasing advice\n- **Rental**: short and long term, fleet available\n- **After-sales**: certified technicians, rapid response\n- **Parts**: original stock in Casablanca\n- **Training**: on-site operator training\n\nContact us for a tailored quote: **contact@vemat.ma** | WhatsApp **+212 650 14 64 64**",
      sources: [
        {
          type: "page",
          title: lang === "fr" ? "Services Vemat" : "Vemat services",
          subtitle: lang === "fr" ? "Vente, location, SAV, pièces, formation" : "Sales, rental, after-sales, parts, training",
          url: "/services",
        },
      ],
      suggestions,
    };
  }

  // General catalog search
  const allSources = runCatalogSearch(query, lang);

  if (allSources.length === 0) {
    return {
      mode: "local",
      message: lang === "fr"
        ? "Je n'ai pas trouvé de correspondance précise dans le catalogue Vemat pour cette question.\n\nEssaie avec une **marque** (JLG, Tadano, Terex, Magni, Mecalac), un **modèle**, une **capacité** (ex: 50 tonnes), une **hauteur** ou un **type de machine**.\n\nOu contacte directement Vemat : **contact@vemat.ma** | WhatsApp **+212 650 14 64 64**"
        : "I couldn't find a precise match in the Vemat catalog for this question.\n\nTry with a **brand** (JLG, Tadano, Terex, Magni, Mecalac), a **model**, a **capacity** (e.g., 50 tonnes), a **height**, or a **machine type**.\n\nOr contact Vemat directly: **contact@vemat.ma** | WhatsApp **+212 650 14 64 64**",
      sources: [],
      suggestions,
    };
  }

  const topSources = allSources.slice(0, 5);
  const productCount = topSources.filter((s) => s.type === "product").length;
  const hasDocuments = topSources.some((s) => s.type === "document");

  let message: string;
  if (lang === "fr") {
    if (hasDocuments && intent.wantsDocuments) {
      message = `J'ai trouvé **${topSources.length} document(s)** correspondant à votre recherche dans le catalogue Vemat.\n\nPour toute autre documentation non listée, contactez **contact@vemat.ma**.`;
    } else if (productCount > 0) {
      message = `J'ai trouvé **${productCount} machine(s)** correspondant à votre recherche dans le catalogue Vemat.\n\nPour un devis ou une démonstration, contactez **contact@vemat.ma** ou WhatsApp **+212 650 14 64 64**.`;
    } else {
      message = `Voici les résultats les plus proches dans le catalogue Vemat pour votre recherche.\n\nPour plus d'infos, contactez **contact@vemat.ma**.`;
    }
  } else {
    if (hasDocuments && intent.wantsDocuments) {
      message = `I found **${topSources.length} document(s)** matching your search in the Vemat catalog.\n\nFor other documentation not listed, contact **contact@vemat.ma**.`;
    } else if (productCount > 0) {
      message = `I found **${productCount} machine(s)** matching your search in the Vemat catalog.\n\nFor a quote or demonstration, contact **contact@vemat.ma** or WhatsApp **+212 650 14 64 64**.`;
    } else {
      message = `Here are the closest results in the Vemat catalog for your search.\n\nFor more info, contact **contact@vemat.ma**.`;
    }
  }

  return { mode: "local", message, sources: topSources, suggestions };
}

// ─── Search helpers ───────────────────────────────────────────────────────────

function searchProducts(query: string, lang: Lang): LocalAssistantSource[] {
  return Object.entries(productDetails)
    .map(([slug, product]) => {
      const title = `${product.brand} ${product.name}`;
      const body = [
        localizeText(product.description, lang),
        localizeArray(product.features, lang).join(" "),
        Object.entries(product.specifications || {}).map(([k, v]) => `${k} ${localizeText(v, lang)}`).join(" "),
      ].join(" ");
      return { score: score(query, title, body, "product"), source: { type: "product" as const, title, subtitle: lang === "fr" ? "Fiche produit" : "Product page", url: `/produit/${slug}` } };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.source);
}

function runCatalogSearch(query: string, lang: Lang): LocalAssistantSource[] {
  const productResults: SearchResult[] = Object.entries(productDetails).map(([slug, product]) => {
    const title = `${product.brand} ${product.name}`;
    const body = [
      localizeText(product.description, lang),
      localizeArray(product.features, lang).join(" "),
      Object.entries(product.specifications || {}).map(([k, v]) => `${k} ${localizeText(v, lang)}`).join(" "),
    ].join(" ");
    return { score: score(query, title, body, "product"), source: { type: "product" as const, title, subtitle: lang === "fr" ? "Fiche produit" : "Product page", url: `/produit/${slug}` } };
  });

  const documentResults: SearchResult[] = Object.values(productDetails).flatMap((product) =>
    (product.downloads || []).map((dl) => ({
      score: score(query, dl.label, `${product.brand} ${product.name} ${dl.label}`, "document"),
      source: { type: "document" as const, title: dl.label, subtitle: `${product.brand} ${product.name}`, url: dl.url },
    }))
  );

  const partResults: SearchResult[] = [...parts].map((part) => ({
    score: score(query, `${part.brand} ${part.name}`, `${part.reference} ${part.description} ${part.subFamily || ""}`, "part"),
    source: { type: "part" as const, title: `${part.brand} ${part.name}`, subtitle: `${lang === "fr" ? "Réf." : "Ref."} ${part.reference}`, url: "/pieces-de-rechange" },
  }));

  const pageResults: SearchResult[] = [
    {
      score: score(query, "Contacter Vemat", "contact email whatsapp telephone casablanca maroc devis", "page"),
      source: { type: "page" as const, title: lang === "fr" ? "Contacter Vemat" : "Contact Vemat", subtitle: lang === "fr" ? "Coordonnées" : "Contact details", url: "/contact" },
    },
    {
      score: score(query, "Services Vemat", "vente location sav pieces formation conseils depannage reparation", "page"),
      source: { type: "page" as const, title: lang === "fr" ? "Services Vemat" : "Vemat services", subtitle: lang === "fr" ? "Support et accompagnement" : "Support & services", url: "/services" },
    },
  ];

  const blogResults: SearchResult[] = blogPosts.flatMap((post) => [
    {
      score: score(query, post.title.fr, `${post.excerpt.fr} ${post.content.fr} ${post.category}`, "article"),
      source: { type: "article" as const, title: post.title.fr, subtitle: `${post.category} • Blog`, url: `/blog/${post.slug}`, snippet: post.excerpt.fr },
    },
    {
      score: score(query, post.title.en, `${post.excerpt.en} ${post.content.en} ${post.category}`, "article"),
      source: { type: "article" as const, title: post.title.en, subtitle: `${post.category} • Blog`, url: `/blog/${post.slug}`, snippet: post.excerpt.en },
    },
  ]);

  return [...productResults, ...documentResults, ...partResults, ...pageResults, ...blogResults]
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.source)
    .slice(0, 6);
}
