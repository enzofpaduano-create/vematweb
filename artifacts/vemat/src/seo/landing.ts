// Pages d'atterrissage SEO : marque × pays, marque × Afrique, et une page par pays.
// Ce module est partagé par le site (React) et par le script de pré-rendu (scripts/prerender.mjs) :
// il ne doit donc importer ni image ni composant.
//
// Règle : aucun fait n'est inventé. Les textes reprennent ce qui est déjà publié sur le site
// (bureaux, marques, services) ; les listes de modèles viennent du catalogue (productDetails).
import { productDetails } from "@/data/productDetails";

export type Lang = "fr" | "en";
type T = Record<Lang, string>;

export const SITE = "https://www.vematgroup.com";
export const PHONE = "+212 522 65 12 13";

/* ------------------------------------------------------------------ Pays */

export type Country = {
  id: string;
  /** Langue de la page (et de son URL) */
  lang: Lang;
  slug: string;
  name: T;
  /** « au Maroc » / « in Morocco » */
  in: T;
  /** Phrase sur le bureau Vemat (uniquement pour les pays où il y a un bureau) */
  office?: T;
  africa: boolean;
};

const OFFICE_HQ: T = {
  fr: "Notre siège social est situé à Casablanca : c'est le centre logistique et technique de l'ensemble de nos opérations.",
  en: "Our headquarters are in Casablanca, the logistics and technical hub for all our operations.",
};
const OFFICE_NG: T = {
  fr: "Nos bureaux de Lagos et de Port Harcourt, qui opèrent sous l'enseigne Westchase Oil & Gas, sont dédiés au golfe de Guinée, au delta du Niger et à l'industrie pétrolière.",
  en: "Our Lagos and Port Harcourt offices, operating under the Westchase Oil & Gas brand, serve the Gulf of Guinea, the Niger Delta and the oil & gas industry.",
};
const OFFICE_AE: T = {
  fr: "Notre branche de Dubaï est une plateforme stratégique pour le sourcing international et les opérations au Moyen-Orient.",
  en: "Our Dubai branch is a strategic platform for international sourcing and Middle East operations.",
};
const OFFICE_MR: T = {
  fr: "Notre bureau de Nouadhibou est dédié à l'Afrique de l'Ouest atlantique et spécialisé dans le secteur minier.",
  en: "Our Nouadhibou office serves Atlantic West Africa and specialises in the mining sector.",
};

const c = (
  id: string,
  lang: Lang,
  slug: string,
  fr: string,
  en: string,
  inFr: string,
  inEn: string,
  office?: T,
  africa = true,
): Country => ({ id, lang, slug, name: { fr, en }, in: { fr: inFr, en: inEn }, office, africa });

export const countries: Country[] = [
  c("maroc", "fr", "maroc", "Maroc", "Morocco", "au Maroc", "in Morocco", OFFICE_HQ),
  c("tunisie", "fr", "tunisie", "Tunisie", "Tunisia", "en Tunisie", "in Tunisia"),
  c("libye", "en", "libya", "Libye", "Libya", "en Libye", "in Libya"),
  c("mauritanie", "fr", "mauritanie", "Mauritanie", "Mauritania", "en Mauritanie", "in Mauritania", OFFICE_MR),
  c("senegal", "fr", "senegal", "Sénégal", "Senegal", "au Sénégal", "in Senegal"),
  c("gambie", "en", "gambia", "Gambie", "Gambia", "en Gambie", "in The Gambia"),
  c("guinee-bissau", "fr", "guinee-bissau", "Guinée-Bissau", "Guinea-Bissau", "en Guinée-Bissau", "in Guinea-Bissau"),
  c("guinee", "fr", "guinee", "Guinée", "Guinea", "en Guinée", "in Guinea"),
  c("mali", "fr", "mali", "Mali", "Mali", "au Mali", "in Mali"),
  c("burkina-faso", "fr", "burkina-faso", "Burkina Faso", "Burkina Faso", "au Burkina Faso", "in Burkina Faso"),
  c("niger", "fr", "niger", "Niger", "Niger", "au Niger", "in Niger"),
  c("sierra-leone", "en", "sierra-leone", "Sierra Leone", "Sierra Leone", "en Sierra Leone", "in Sierra Leone"),
  c("liberia", "en", "liberia", "Liberia", "Liberia", "au Liberia", "in Liberia"),
  c("cote-d-ivoire", "fr", "cote-d-ivoire", "Côte d'Ivoire", "Côte d'Ivoire", "en Côte d'Ivoire", "in Côte d'Ivoire"),
  c("ghana", "en", "ghana", "Ghana", "Ghana", "au Ghana", "in Ghana"),
  c("togo", "fr", "togo", "Togo", "Togo", "au Togo", "in Togo"),
  c("benin", "fr", "benin", "Bénin", "Benin", "au Bénin", "in Benin"),
  c("nigeria", "en", "nigeria", "Nigeria", "Nigeria", "au Nigeria", "in Nigeria", OFFICE_NG),
  c("cameroun", "fr", "cameroun", "Cameroun", "Cameroon", "au Cameroun", "in Cameroon"),
  c("guinee-equatoriale", "fr", "guinee-equatoriale", "Guinée équatoriale", "Equatorial Guinea", "en Guinée équatoriale", "in Equatorial Guinea"),
  c("tchad", "fr", "tchad", "Tchad", "Chad", "au Tchad", "in Chad"),
  c("eau", "en", "uae", "Émirats arabes unis", "United Arab Emirates", "aux Émirats arabes unis", "in the UAE", OFFICE_AE, false),
];

export const officeCountries = countries.filter((x) => x.office);

/* ---------------------------------------------------------------- Marques */

type BrandDef = {
  id: "terex" | "jlg" | "tadano" | "magni" | "mecalac" | "fuchs";
  short: string;
  slug: T;
  /** « Grue Terex neuve » / « New Terex cranes » */
  newTitle: T;
  /** « grues Terex » / « Terex cranes » */
  plural: T;
  blurb: T;
  cat: { href: string; label: T };
  catalogue: T;
};

const brandDefs: BrandDef[] = [
  {
    id: "terex",
    short: "Terex",
    slug: { fr: "grue-terex", en: "terex-cranes" },
    newTitle: { fr: "Grue Terex neuve", en: "New Terex cranes" },
    plural: { fr: "grues Terex", en: "Terex cranes" },
    blurb: {
      fr: "Les grues Terex Rough Terrain (RT) et les grues à tour (TC) sont réunies depuis 2025 sous la bannière Raimondi Group, qui a repris ces gammes historiques de Terex. Conçues et assemblées en Italie, elles sont destinées aux chantiers les plus exigeants.",
      en: "Terex Rough Terrain (RT) cranes and tower cranes (TC) have been part of the Raimondi Group since 2025, which took over these historic Terex product lines. Designed and assembled in Italy, they are built for the most demanding jobsites.",
    },
    cat: { href: "/grues", label: { fr: "Toutes nos grues", en: "All our cranes" } },
    catalogue: { fr: "grues automotrices lentes et grues à tour", en: "rough terrain and tower cranes" },
  },
  {
    id: "jlg",
    short: "JLG",
    slug: { fr: "nacelle-jlg", en: "jlg-aerial-work-platforms" },
    newTitle: { fr: "Nacelle JLG neuve", en: "New JLG aerial work platforms" },
    plural: { fr: "nacelles JLG", en: "JLG aerial work platforms" },
    blurb: {
      fr: "Leader mondial des nacelles élévatrices, JLG conçoit des plateformes à flèche (motorisées, électriques, hybrides), des nacelles ciseaux, des plateformes verticales basses et des préparateurs de commandes mobiles (Stock Pickers). Elles servent à la maintenance industrielle, à la construction et à la logistique.",
      en: "A global leader in aerial work platforms, JLG designs boom lifts (powered, electric, hybrid), scissor lifts, low-level vertical platforms and mobile order pickers (Stock Pickers), used for industrial maintenance, construction and logistics.",
    },
    cat: { href: "/nacelles", label: { fr: "Toutes nos nacelles", en: "All our aerial work platforms" } },
    catalogue: { fr: "nacelles à flèche, nacelles ciseaux et plateformes verticales", en: "boom lifts, scissor lifts and vertical platforms" },
  },
  {
    id: "tadano",
    short: "Tadano",
    slug: { fr: "grue-tadano", en: "tadano-cranes" },
    newTitle: { fr: "Grue Tadano neuve", en: "New Tadano cranes" },
    plural: { fr: "grues Tadano", en: "Tadano cranes" },
    blurb: {
      fr: "Tadano, qui a intégré la marque Demag, est l'un des trois plus grands constructeurs mondiaux de grues mobiles. La gamme AC tout-terrain couvre des capacités de 40 à 500 tonnes, avec des longueurs de flèche jusqu'à 80 mètres.",
      en: "Tadano, which has integrated the Demag brand, is one of the world's three largest mobile crane manufacturers. The AC all-terrain range covers capacities from 40 to 500 tons, with boom lengths up to 80 metres.",
    },
    cat: { href: "/grues", label: { fr: "Toutes nos grues", en: "All our cranes" } },
    catalogue: { fr: "grues tout-terrain, sur chenilles, city et sur porteur", en: "all-terrain, crawler, city and truck cranes" },
  },
  {
    id: "magni",
    short: "Magni",
    slug: { fr: "chariot-telescopique-magni", en: "magni-telehandlers" },
    newTitle: { fr: "Chariot télescopique Magni neuf", en: "New Magni telehandlers" },
    plural: { fr: "chariots télescopiques Magni", en: "Magni telehandlers" },
    blurb: {
      fr: "Spécialiste italien des chariots télescopiques rotatifs (RTH), fixes (TH) et grandes capacités (HTH), Magni équipe les chantiers les plus exigeants avec des machines pouvant lever jusqu'à 51 tonnes et atteindre 51 mètres de hauteur.",
      en: "An Italian specialist in rotating (RTH), fixed (TH) and high-capacity (HTH) telehandlers, Magni equips the most demanding jobsites with machines able to lift up to 51 tons and reach 51 metres in height.",
    },
    cat: { href: "/elevateurs-telescopiques", label: { fr: "Tous nos élévateurs télescopiques", en: "All our telehandlers" } },
    catalogue: { fr: "chariots télescopiques rotatifs, fixes et grandes capacités", en: "rotating, fixed and high-capacity telehandlers" },
  },
  {
    id: "mecalac",
    short: "Mecalac",
    slug: { fr: "engins-chantier-mecalac", en: "mecalac-construction-equipment" },
    newTitle: { fr: "Engins de chantier Mecalac neufs", en: "New Mecalac construction equipment" },
    plural: { fr: "engins Mecalac", en: "Mecalac equipment" },
    blurb: {
      fr: "Constructeur français reconnu pour ses pelles, chargeuses, chargeuses-pelleteuses, dumpers et compacteurs, Mecalac conçoit des machines polyvalentes, optimisées pour les environnements urbains et les chantiers de génie civil.",
      en: "A French manufacturer renowned for its excavators, loaders, backhoe loaders, dumpers and roller compactors, Mecalac designs versatile machines optimised for urban environments and civil engineering jobsites.",
    },
    cat: { href: "/construction", label: { fr: "Tous nos engins de construction", en: "All our construction equipment" } },
    catalogue: { fr: "pelles, chargeuses, chargeuses-pelleteuses, dumpers et compacteurs", en: "excavators, loaders, backhoe loaders, dumpers and compactors" },
  },
  {
    id: "fuchs",
    short: "Terex Fuchs",
    slug: { fr: "pelle-de-manutention-terex-fuchs", en: "terex-fuchs-material-handlers" },
    newTitle: { fr: "Pelle de manutention Terex Fuchs neuve", en: "New Terex Fuchs material handlers" },
    plural: { fr: "pelles de manutention Terex Fuchs", en: "Terex Fuchs material handlers" },
    blurb: {
      fr: "Terex Fuchs conçoit des pelles de manutention spécialisées pour la ferraille, le recyclage, les vracs, les applications portuaires et les opérations forestières, en versions diesel, électriques ou hybrides selon les modèles.",
      en: "Terex Fuchs designs specialist material handlers for scrap, recycling, bulk goods, port applications and forestry operations, with diesel, electric or hybrid versions depending on the model.",
    },
    cat: { href: "/construction", label: { fr: "Tous nos engins de construction", en: "All our construction equipment" } },
    catalogue: { fr: "pelles de manutention", en: "material handlers" },
  },
];

type Model = { key: string; name: string };

function brandOf(key: string, p: any): BrandDef["id"] | null {
  if (/^(mhl|f120)/.test(key)) return "fuchs";
  const b = String(p?.brand || "").toLowerCase();
  if (b.startsWith("terex")) return "terex";
  if (b === "jlg") return "jlg";
  if (b.startsWith("tadano")) return "tadano";
  if (b === "magni") return "magni";
  if (b === "mecalac") return "mecalac";
  return null;
}

const collator = new Intl.Collator("fr", { numeric: true, sensitivity: "base" });
let modelCache: Record<string, Model[]> | null = null;
export function modelsOf(brand: BrandDef["id"]): Model[] {
  if (!modelCache) {
    modelCache = {};
    for (const [key, p] of Object.entries(productDetails as Record<string, any>)) {
      const id = brandOf(key, p);
      if (!id) continue;
      (modelCache[id] ||= []).push({ key, name: String(p?.name || key.toUpperCase()) });
    }
    for (const list of Object.values(modelCache)) list.sort((a, b) => collator.compare(a.name, b.name));
  }
  return modelCache[brand] || [];
}

/* ------------------------------------------------------------------ Pages */

export type LandingPage = {
  slug: string;
  lang: Lang;
  kind: "brand-country" | "brand-region" | "country";
  brand?: BrandDef;
  country?: Country;
};

export const landingPages: LandingPage[] = [];
for (const country of officeCountries) {
  for (const brand of brandDefs) {
    landingPages.push({ slug: `${brand.slug[country.lang]}-${country.slug}`, lang: country.lang, kind: "brand-country", brand, country });
  }
}
for (const brand of brandDefs) {
  landingPages.push({ slug: `${brand.slug.fr}-afrique`, lang: "fr", kind: "brand-region", brand });
  landingPages.push({ slug: `${brand.slug.en}-africa`, lang: "en", kind: "brand-region", brand });
}
for (const country of countries) {
  landingPages.push({
    slug: `${country.lang === "fr" ? "materiel-levage" : "lifting-equipment"}-${country.slug}`,
    lang: country.lang,
    kind: "country",
    country,
  });
}

const bySlug = new Map(landingPages.map((p) => [p.slug, p]));
export const getLanding = (slug: string) => bySlug.get(slug);

function brandCountryPage(brand: BrandDef, country: Country) {
  return landingPages.find((p) => p.kind === "brand-country" && p.brand === brand && p.country === country);
}
function brandRegionPage(brand: BrandDef, lang: Lang) {
  return landingPages.find((p) => p.kind === "brand-region" && p.brand === brand && p.lang === lang)!;
}
function countryPage(country: Country) {
  return landingPages.find((p) => p.kind === "country" && p.country === country)!;
}
/** Page de la marque la plus pertinente pour un pays (page pays si bureau, sinon page Afrique) */
function brandPageFor(brand: BrandDef, country: Country) {
  return brandCountryPage(brand, country) ?? brandRegionPage(brand, country.lang);
}

/* ---------------------------------------------------------------- Contenu */

export type Link = { href: string; label: string };
export type Section = { h2: string; paragraphs?: string[]; bullets?: string[]; links?: Link[]; faq?: boolean };
export type Content = {
  slug: string;
  lang: Lang;
  /** Titre complet de l'onglet (avec « | Vemat Group ») */
  title: string;
  description: string;
  h1: string;
  intro: string[];
  sections: Section[];
  faq: { q: string; a: string }[];
  cta: { text: string; href: string; label: string }[];
  breadcrumbs: Link[];
  alternates: { lang: Lang; href: string }[];
  jsonLd: object[];
};

const tr = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);

const africaOffices: T = {
  fr: "Vemat Group est basé à Casablanca et dispose de branches à Dubaï, Lagos, Port Harcourt et Nouadhibou.",
  en: "Vemat Group is based in Casablanca and has branches in Dubai, Lagos, Port Harcourt and Nouadhibou.",
};

function officeLine(page: LandingPage): string {
  const lang = page.lang;
  if (page.country?.office) return page.country.office[lang];
  if (page.country) {
    return tr(
      lang,
      `${page.country.name.fr} fait partie des pays où Vemat Group est présent, avec l'appui de son siège de Casablanca, centre logistique et technique de l'ensemble de ses opérations.`,
      `${page.country.name.en} is one of the countries where Vemat Group operates, supported by its Casablanca headquarters, the logistics and technical hub for all its operations.`,
    );
  }
  return africaOffices[lang];
}

function place(page: LandingPage): { in: string; name: string } {
  if (page.country) return { in: page.country.in[page.lang], name: page.country.name[page.lang] };
  return { in: tr(page.lang, "en Afrique", "in Africa"), name: tr(page.lang, "Afrique", "Africa") };
}

function faqFor(page: LandingPage): { q: string; a: string }[] {
  const lang = page.lang;
  const p = place(page);
  const phone = PHONE;
  if (page.brand) {
    const b = page.brand;
    return [
      {
        q: tr(lang, `Vemat Group est-il distributeur officiel ${b.short} ${p.in} ?`, `Is Vemat Group an official ${b.short} distributor ${p.in}?`),
        a: tr(
          lang,
          `Oui. Vemat Group est distributeur officiel ${b.short}. ${officeLine(page)}`,
          `Yes. Vemat Group is an official ${b.short} distributor. ${officeLine(page)}`,
        ),
      },
      {
        q: tr(lang, `Peut-on acheter du matériel ${b.short} neuf ${p.in} ?`, `Can I buy new ${b.short} equipment ${p.in}?`),
        a: tr(
          lang,
          `Oui, Vemat Group vend du matériel ${b.short} neuf (${b.catalogue.fr}). Pour connaître les modèles et leur disponibilité ${p.in}, envoyez une demande de devis : notre équipe vous répond directement.`,
          `Yes, Vemat Group sells new ${b.short} equipment (${b.catalogue.en}). To find out about models and availability ${p.in}, send a quote request and our team will reply directly.`,
        ),
      },
      {
        q: tr(lang, `Proposez-vous les pièces détachées et le service après-vente ${p.in} ?`, `Do you provide spare parts and after-sales service ${p.in}?`),
        a: tr(
          lang,
          `Oui. Vemat Group assure les pièces détachées et le service après-vente des machines qu'il distribue. Vous pouvez demander une pièce ou une intervention depuis notre site.`,
          `Yes. Vemat Group provides spare parts and after-sales service for the machines it distributes. You can request a part or an intervention from our website.`,
        ),
      },
      {
        q: tr(lang, "Comment obtenir un devis ?", "How do I get a quote?"),
        a: tr(
          lang,
          `Remplissez le formulaire de demande de devis sur notre site ou appelez le ${phone}.`,
          `Fill in the quote request form on our website or call ${phone}.`,
        ),
      },
    ];
  }
  return [
    {
      q: tr(lang, `Où acheter une grue neuve ${p.in} ?`, `Where can I buy a new crane ${p.in}?`),
      a: tr(
        lang,
        `Vemat Group, distributeur officiel Terex, Tadano, JLG, Magni et Mecalac, vend des grues, des nacelles, des chariots télescopiques et des engins de construction neufs. Envoyez une demande de devis pour connaître les modèles et la disponibilité ${p.in}.`,
        `Vemat Group, official distributor of Terex, Tadano, JLG, Magni and Mecalac, sells new cranes, aerial work platforms, telehandlers and construction equipment. Send a quote request to find out about models and availability ${p.in}.`,
      ),
    },
    {
      q: tr(lang, `Vemat Group est-il présent ${p.in} ?`, `Is Vemat Group present ${p.in}?`),
      a: officeLine(page),
    },
    {
      q: tr(lang, "Proposez-vous des pièces détachées et un service après-vente ?", "Do you offer spare parts and after-sales service?"),
      a: tr(
        lang,
        "Oui. Vemat Group assure les pièces détachées et le service après-vente des machines qu'il distribue.",
        "Yes. Vemat Group provides spare parts and after-sales service for the machines it distributes.",
      ),
    },
    {
      q: tr(lang, "Comment obtenir un devis ?", "How do I get a quote?"),
      a: tr(lang, `Remplissez le formulaire de demande de devis ou appelez le ${PHONE}.`, `Fill in the quote request form or call ${PHONE}.`),
    },
  ];
}

export function buildContent(page: LandingPage): Content {
  const lang = page.lang;
  const p = place(page);
  const brand = page.brand;
  const L = (fr: string, en: string) => tr(lang, fr, en);
  const url = (slug: string) => `${SITE}/${slug}`;

  /* ---- titres ---- */
  const pick = (variants: string[], max: number) => variants.find((v) => v.length <= max) ?? variants[variants.length - 1];
  let h1: string;
  let title: string;
  let description: string;
  if (brand) {
    h1 = L(`${brand.newTitle.fr} ${p.in}`, `${brand.newTitle.en} ${p.in}`);
    description = pick(
      [
        L(
          `${h1} : Vemat Group, distributeur officiel ${brand.short}. Vente, pièces détachées et service après-vente. Devis rapide.`,
          `${h1}: Vemat Group, official ${brand.short} distributor. Sales, spare parts and after-sales service. Request a quote.`,
        ),
        L(
          `${h1} : Vemat Group, distributeur officiel ${brand.short}. Vente, pièces détachées et service après-vente.`,
          `${h1}: Vemat Group, official ${brand.short} distributor. Sales, spare parts and after-sales service.`,
        ),
        L(`${h1} : distributeur officiel ${brand.short}, pièces détachées et SAV.`, `${h1}: official ${brand.short} distributor, spare parts and service.`),
      ],
      158,
    );
  } else {
    h1 = L(`Grue neuve, nacelle et chariot télescopique ${p.in}`, `New cranes, aerial work platforms and telehandlers ${p.in}`);
    description = pick(
      [
        L(
          `Vemat Group, distributeur officiel Terex, Tadano, JLG, Magni et Mecalac ${p.in} : grues neuves, nacelles, chariots télescopiques, pièces détachées et SAV.`,
          `Vemat Group, official distributor of Terex, Tadano, JLG, Magni and Mecalac ${p.in}: new cranes, aerial work platforms, telehandlers, spare parts and service.`,
        ),
        L(
          `Distributeur officiel Terex, Tadano, JLG, Magni, Mecalac ${p.in} : grues neuves, nacelles, chariots télescopiques, pièces et SAV.`,
          `Official Terex, Tadano, JLG, Magni, Mecalac distributor ${p.in}: new cranes, aerial work platforms, telehandlers, parts and service.`,
        ),
        L(`Grues neuves, nacelles, chariots télescopiques ${p.in} : Vemat Group, distributeur officiel.`, `New cranes, platforms and telehandlers ${p.in}: Vemat Group, official distributor.`),
      ],
      158,
    );
  }
  const dist = L("Distributeur officiel", "Official distributor");
  title = pick([`${h1} | ${dist} | Vemat Group`, `${h1} | ${dist}`, `${h1} | Vemat Group`, h1], 66);

  /* ---- introduction ---- */
  const intro: string[] = [];
  if (brand) {
    intro.push(
      L(
        `Vemat Group est distributeur officiel ${brand.short} et vous accompagne ${p.in} : vente de matériel neuf ${brand.short}, pièces détachées et service après-vente. ${officeLine(page)}`,
        `Vemat Group is an official ${brand.short} distributor and supports you ${p.in}: sales of new ${brand.short} equipment, spare parts and after-sales service. ${officeLine(page)}`,
      ),
    );
    intro.push(brand.blurb[lang]);
  } else {
    intro.push(
      L(
        `Vemat Group distribue officiellement Terex, Tadano, JLG, Magni et Mecalac : grues, nacelles élévatrices, chariots télescopiques et engins de construction neufs, avec pièces détachées et service après-vente. ${officeLine(page)}`,
        `Vemat Group is the official distributor of Terex, Tadano, JLG, Magni and Mecalac: new cranes, aerial work platforms, telehandlers and construction equipment, with spare parts and after-sales service. ${officeLine(page)}`,
      ),
    );
  }

  /* ---- sections ---- */
  const sections: Section[] = [];

  if (brand) {
    const models = modelsOf(brand.id);
    if (models.length) {
      sections.push({
        h2: L(`Gamme ${brand.short} au catalogue Vemat`, `${brand.short} range in the Vemat catalogue`),
        paragraphs: [
          L(
            `Le catalogue Vemat présente ${models.length} modèles ${brand.short} (${brand.catalogue.fr}). Ouvrez une fiche pour voir les caractéristiques, puis demandez votre devis.`,
            `The Vemat catalogue lists ${models.length} ${brand.short} models (${brand.catalogue.en}). Open a model page for its specifications, then request your quote.`,
          ),
        ],
        links: models.map((m) => ({ href: `/produit/${m.key}`, label: `${brand.short} ${m.name}` })),
      });
    }
    sections.push({
      h2: L(`Pourquoi choisir Vemat ${p.in}`, `Why choose Vemat ${p.in}`),
      bullets: [
        L(`Distributeur officiel ${brand.short}`, `Official ${brand.short} distributor`),
        L("Pièces détachées et service après-vente pour les machines que nous distribuons", "Spare parts and after-sales service for the machines we distribute"),
        L("Un interlocuteur unique : vente, pièces et intervention", "A single contact for sales, parts and service"),
        officeLine(page),
      ],
      links: [
        { href: "/pieces-de-rechange", label: L("Pièces de rechange", "Spare parts") },
        { href: "/services", label: L("Nos services", "Our services") },
        { href: brand.cat.href, label: brand.cat.label[lang] },
      ],
    });
  } else {
    const country = page.country!;
    sections.push({
      h2: L(`Nos machines neuves ${p.in}`, `Our new machines ${p.in}`),
      paragraphs: [
        L(
          `Choisissez une marque pour découvrir sa gamme et demander un devis ${p.in}.`,
          `Choose a brand to see its range and request a quote ${p.in}.`,
        ),
      ],
      links: brandDefs.map((b) => {
        const target = brandPageFor(b, country);
        const where = target.kind === "brand-country" ? p.in : L("en Afrique", "in Africa");
        return { href: `/${target.slug}`, label: `${b.newTitle[lang]} ${where}` };
      }),
    });
    sections.push({
      h2: L("Par type de machine", "By machine type"),
      links: [
        { href: "/grues", label: L("Grues Terex et Tadano", "Terex and Tadano cranes") },
        { href: "/nacelles", label: L("Nacelles élévatrices JLG", "JLG aerial work platforms") },
        { href: "/elevateurs-telescopiques", label: L("Chariots télescopiques Magni", "Magni telehandlers") },
        { href: "/construction", label: L("Engins de construction Mecalac et Terex Fuchs", "Mecalac and Terex Fuchs construction equipment") },
        { href: "/pieces-de-rechange", label: L("Pièces de rechange", "Spare parts") },
        { href: "/services", label: L("Service après-vente", "After-sales service") },
      ],
    });
  }

  /* ---- maillage interne ---- */
  if (page.kind === "brand-country") {
    const country = page.country!;
    sections.push({
      h2: L(`Autres marques ${p.in}`, `Other brands ${p.in}`),
      links: brandDefs
        .filter((b) => b !== brand)
        .map((b) => ({ href: `/${brandCountryPage(b, country)!.slug}`, label: `${b.newTitle[lang]} ${p.in}` })),
    });
    const others: Link[] = officeCountries
      .filter((x) => x !== country)
      .map((x) => ({ href: `/${brandCountryPage(brand!, x)!.slug}`, label: `${brand!.newTitle[x.lang]} ${x.in[x.lang]}` }));
    others.push({ href: `/${brandRegionPage(brand!, lang).slug}`, label: `${brand!.newTitle[lang]} ${L("en Afrique", "in Africa")}` });
    others.push({ href: `/${countryPage(country).slug}`, label: L(`Tout notre matériel ${p.in}`, `All our equipment ${p.in}`) });
    sections.push({ h2: L(`${brand!.short} dans d'autres pays`, `${brand!.short} in other countries`), links: others });
  }

  if (page.kind === "brand-region") {
    sections.push({
      h2: L(`${brand!.short} dans nos pays d'intervention`, `${brand!.short} in the countries we serve`),
      paragraphs: [
        L(
          "Vemat Group accompagne ses clients dans les pays suivants. Choisissez le vôtre.",
          "Vemat Group supports its customers in the following countries. Choose yours.",
        ),
      ],
      links: countries
        .filter((x) => x.africa)
        .map((x) => {
          const target = brandCountryPage(brand!, x);
          return target
            ? { href: `/${target.slug}`, label: `${brand!.newTitle[lang]} ${x.in[lang]}` }
            : { href: `/${countryPage(x).slug}`, label: L(`Matériel de levage ${x.in[lang]}`, `Lifting equipment ${x.in[lang]}`) };
        }),
    });
  }

  const faq = faqFor(page);
  sections.push({ h2: L("Questions fréquentes", "Frequently asked questions"), faq: true });

  /* ---- fil d'Ariane et alternates ---- */
  const crumbs: Link[] = [{ href: "/", label: L("Accueil", "Home") }];
  if (brand) crumbs.push({ href: brand.cat.href, label: brand.cat.label[lang] });
  else crumbs.push({ href: "/", label: L("Pays", "Countries") });
  crumbs.push({ href: `/${page.slug}`, label: h1 });

  const alternates: { lang: Lang; href: string }[] = [];
  if (page.kind === "brand-region") {
    for (const l of ["fr", "en"] as Lang[]) alternates.push({ lang: l, href: url(brandRegionPage(brand!, l).slug) });
  }

  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((cr, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: cr.label,
        item: `${SITE}${cr.href}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return {
    slug: page.slug,
    lang,
    title,
    description,
    h1,
    intro,
    sections,
    faq,
    cta: [
      {
        text: L("Un projet ? Recevez votre devis rapidement.", "Got a project? Get your quote quickly."),
        href: "/demande-devis",
        label: L("Demander un devis", "Request a quote"),
      },
    ],
    breadcrumbs: crumbs,
    alternates,
    jsonLd,
  };
}

/* ------------------------------------------------- HTML statique (pré-rendu) */

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function contentToHtml(ct: Content): string {
  const links = (ls: Link[]) =>
    `<ul>${ls.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join("")}</ul>`;
  const crumbs = ct.breadcrumbs
    .map((b, i) => (i < ct.breadcrumbs.length - 1 ? `<a href="${esc(b.href)}">${esc(b.label)}</a>` : esc(b.label)))
    .join(" › ");
  const sections = ct.sections
    .map((s) => {
      if (s.faq) {
        return `<section><h2>${esc(s.h2)}</h2>${ct.faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}</section>`;
      }
      return `<section><h2>${esc(s.h2)}</h2>${(s.paragraphs || []).map((x) => `<p>${esc(x)}</p>`).join("")}${
        s.bullets ? `<ul>${s.bullets.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""
      }${s.links ? links(s.links) : ""}</section>`;
    })
    .join("");
  const cta = ct.cta.map((x) => `<p>${esc(x.text)} <a href="${esc(x.href)}">${esc(x.label)}</a></p>`).join("");
  return (
    `<div style="max-width:960px;margin:0 auto;padding:7rem 1rem 3rem;font-family:Inter,system-ui,sans-serif;line-height:1.6;color:#111">` +
    `<nav aria-label="breadcrumb">${crumbs}</nav>` +
    `<h1>${esc(ct.h1)}</h1>${ct.intro.map((x) => `<p>${esc(x)}</p>`).join("")}${sections}${cta}</div>`
  );
}
