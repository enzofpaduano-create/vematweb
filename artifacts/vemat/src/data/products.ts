export type CategorySlug = "grues" | "nacelles" | "elevateurs" | "construction";

export type Model = {
  name: string;
  brand: string;
};

export type SubCategory = {
  slug: string;
  brand: string;
  title: { fr: string; en: string };
  description?: { fr: string; en: string };
  models: Model[];
  /** Total catalogue count (may exceed `models.length` when full list isn't displayed). */
  totalCount: number;
};

export type Category = {
  slug: CategorySlug;
  subcategories: SubCategory[];
};

export const catalog: Record<CategorySlug, SubCategory[]> = {
  grues: [
    {
      slug: "grues-automotrices-lentes",
      brand: "Terex Rough Terrain",
      title: {
        fr: "Grues automotrices lentes (Rough Terrain)",
        en: "Rough Terrain Cranes",
      },
      description: {
        fr: "Polyvalentes et puissantes, conçues pour intervenir sur les terrains accidentés des chantiers les plus exigeants.",
        en: "Versatile and powerful, designed for the toughest off-road job-site conditions.",
      },
      totalCount: 11,
      models: [
        { name: "TRT 35", brand: "Terex" },
        { name: "RT 1045", brand: "Terex" },
        { name: "RT 1045L", brand: "Terex" },
        { name: "TRT 60", brand: "Terex" },
        { name: "TRT 65", brand: "Terex" },
        { name: "RT 1070", brand: "Terex" },
        { name: "TRT 80", brand: "Terex" },
        { name: "RT 1080", brand: "Terex" },
        { name: "TRT 80L", brand: "Terex" },
        { name: "TRT 90", brand: "Terex" },
        { name: "TRT 100", brand: "Terex" },
      ],
    },
    {
      slug: "grues-tout-terrain",
      brand: "Tadano",
      title: { fr: "Grues tout-terrain", en: "All Terrain Cranes" },
      description: {
        fr: "Mobilité routière exceptionnelle et performances de levage de classe mondiale, jusqu'à 700 tonnes.",
        en: "Outstanding road mobility paired with world-class lifting performance up to 700 tons.",
      },
      totalCount: 18,
      models: [
        { name: "AC 2.040-1", brand: "Tadano" },
        { name: "AC 3.045-1", brand: "Tadano" },
        { name: "AC 3.055-1", brand: "Tadano" },
        { name: "AC 4.070-1", brand: "Tadano" },
        { name: "AC 4.070-2", brand: "Tadano" },
        { name: "AC 4.070L-1", brand: "Tadano" },
        { name: "AC 4.080-1", brand: "Tadano" },
        { name: "AC 4.080-2", brand: "Tadano" },
        { name: "AC 4.100L-1", brand: "Tadano" },
        { name: "AC 5.130-1", brand: "Tadano" },
        { name: "AC 5.160-1", brand: "Tadano" },
        { name: "AC 5.220-1", brand: "Tadano" },
        { name: "AC 5.250-2", brand: "Tadano" },
        { name: "AC 5.250L-2", brand: "Tadano" },
        { name: "AC 6.300-1", brand: "Tadano" },
        { name: "AC 7.450-1", brand: "Tadano" },
        { name: "AC 8.500-1", brand: "Tadano" },
        { name: "AC 9.700-1", brand: "Tadano" },
      ],
    },
    {
      slug: "grues-sur-chenilles-fleche-telescopique",
      brand: "Tadano",
      title: {
        fr: "Grues sur chenilles à flèche télescopique",
        en: "Telescopic Boom Crawler Cranes",
      },
      description: {
        fr: "Mobilité sur chantier sans démontage et capacités de levage élevées.",
        en: "On-site mobility without disassembly and high lifting capacities.",
      },
      totalCount: 5,
      models: [
        { name: "GTC-550", brand: "Tadano" },
        { name: "GTC-700", brand: "Tadano" },
        { name: "GTC-900", brand: "Tadano" },
        { name: "GTC-1300", brand: "Tadano" },
        { name: "GTC-2000", brand: "Tadano" },
      ],
    },
    {
      slug: "grues-sur-chenilles-mat-treillis",
      brand: "Tadano Demag",
      title: {
        fr: "Grues sur chenilles à mât treillis",
        en: "Lattice Boom Crawler Cranes",
      },
      description: {
        fr: "Capacités exceptionnelles pour les projets industriels lourds, l'éolien et le pétrole & gaz.",
        en: "Exceptional capacities for heavy industrial, wind energy and oil & gas projects.",
      },
      totalCount: 7,
      models: [
        { name: "CC 24.400-1", brand: "Tadano Demag" },
        { name: "CC 28.600-2", brand: "Tadano Demag" },
        { name: "CC 38.650-1", brand: "Tadano Demag" },
        { name: "CC 68.1250-1", brand: "Tadano Demag" },
        { name: "CC 88.1600-1", brand: "Tadano Demag" },
        { name: "CC 88.3200-1 TWIN", brand: "Tadano Demag" },
        { name: "PC 38.650-1", brand: "Tadano Demag" },
      ],
    },
    {
      slug: "grues-city",
      brand: "Tadano",
      title: { fr: "Grues City", en: "City Cranes" },
      description: {
        fr: "Compactes et maniables pour les interventions en zone urbaine dense.",
        en: "Compact and agile for tight urban work environments.",
      },
      totalCount: 1,
      models: [{ name: "AC 3.045-1 City", brand: "Tadano" }],
    },
    {
      slug: "grues-sur-camion",
      brand: "Tadano",
      title: { fr: "Grues sur camion", en: "Truck-Mounted Cranes" },
      description: {
        fr: "Mise en œuvre rapide et déplacements aisés entre chantiers.",
        en: "Fast deployment and easy transit between job sites.",
      },
      totalCount: 2,
      models: [
        { name: "HK 4.050-1", brand: "Tadano" },
        { name: "HK 4.070-1", brand: "Tadano" },
      ],
    },
    {
      slug: "grues-sur-porteur",
      brand: "Tadano",
      title: { fr: "Grues sur porteur", en: "Truck Cranes" },
      description: {
        fr: "Solutions de levage routières polyvalentes pour la construction et l'industrie.",
        en: "Versatile road-going lifting solutions for construction and industry.",
      },
      totalCount: 2,
      models: [
        { name: "GT-800XL-2", brand: "Tadano" },
        { name: "GT-1200XL-2", brand: "Tadano" },
      ],
    },
    {
      slug: "grues-a-tour",
      brand: "Terex",
      title: { fr: "Grues à tour", en: "Tower Cranes" },
      description: {
        fr: "Gamme complète : montage rapide, flèche relevable, toit plat et tête marteau pour bâtiment et infrastructure.",
        en: "Full range: self-erecting, luffing-jib, flat-top and hammerhead for building and infrastructure.",
      },
      totalCount: 37,
      models: [],
    },
  ],

  nacelles: [
    {
      slug: "nacelles-elevatrices-motorisees",
      brand: "JLG",
      title: { fr: "Nacelles élévatrices motorisées", en: "Engine-Powered Boom Lifts" },
      description: {
        fr: "Flèches articulées et télescopiques diesel pour atteindre les hauteurs les plus exigeantes.",
        en: "Articulating and telescopic diesel booms to reach the most demanding heights.",
      },
      totalCount: 16,
      models: [
        { name: "450AJ", brand: "JLG" },
        { name: "510AJ", brand: "JLG" },
        { name: "600AJ", brand: "JLG" },
        { name: "660SJ", brand: "JLG" },
        { name: "800AJ", brand: "JLG" },
        { name: "800S", brand: "JLG" },
        { name: "860SJ", brand: "JLG" },
        { name: "1100SB", brand: "JLG" },
        { name: "1200SJP", brand: "JLG" },
        { name: "1250AJP", brand: "JLG" },
        { name: "1350SJP", brand: "JLG" },
        { name: "1500SJ", brand: "JLG" },
        { name: "1500AJP", brand: "JLG" },
        { name: "1850SJ", brand: "JLG" },
      ],
    },
    {
      slug: "nacelles-fleche-electriques-hybrides",
      brand: "JLG",
      title: {
        fr: "Nacelles à flèche électriques et hybrides",
        en: "Electric & Hybrid Boom Lifts",
      },
      description: {
        fr: "Émissions zéro pour les environnements intérieurs ou sensibles, sans sacrifier la performance.",
        en: "Zero-emission performance for indoor or sensitive environments.",
      },
      totalCount: 18,
      models: [
        { name: "E300AJ", brand: "JLG" },
        { name: "E300AJP", brand: "JLG" },
        { name: "E400AJP", brand: "JLG" },
        { name: "E450AJ", brand: "JLG" },
        { name: "E450AJP", brand: "JLG" },
        { name: "E600J", brand: "JLG" },
        { name: "E600JP", brand: "JLG" },
        { name: "H340AJ", brand: "JLG" },
        { name: "H800AJ", brand: "JLG" },
        { name: "X13J Plus", brand: "JLG" },
        { name: "X20J Plus", brand: "JLG" },
        { name: "X33J Plus", brand: "JLG" },
        { name: "Toucan T12E", brand: "JLG" },
        { name: "Toucan 26E", brand: "JLG" },
        { name: "Toucan 32E", brand: "JLG" },
      ],
    },
    {
      slug: "acces-niveaux-moins-eleves",
      brand: "JLG",
      title: {
        fr: "Accès à des niveaux moins élevés",
        en: "Low-Level Access Platforms",
      },
      description: {
        fr: "Plates-formes mobiles, manœuvrables et non motorisées pour l'entretien quotidien.",
        en: "Mobile, manoeuvrable and non-powered platforms for everyday maintenance.",
      },
      totalCount: 7,
      models: [
        { name: "Picolift", brand: "JLG" },
        { name: "Nano SP", brand: "JLG" },
        { name: "Nano SP Plus", brand: "JLG" },
        { name: "Power Tower Pecolift", brand: "JLG" },
        { name: "Power Tower Nano", brand: "JLG" },
        { name: "Ecolift 50", brand: "JLG" },
        { name: "Ecolift 70", brand: "JLG" },
      ],
    },
    {
      slug: "stock-pickers",
      brand: "JLG",
      title: {
        fr: "Préparateurs de commandes mobiles (Stock pickers)",
        en: "Mobile Stock Pickers",
      },
      description: {
        fr: "Solutions ergonomiques pour la préparation de commandes en hauteur en entrepôt.",
        en: "Ergonomic order-picking solutions for warehouse operations at height.",
      },
      totalCount: 2,
      models: [
        { name: "DSP-M", brand: "JLG" },
        { name: "DSP-S", brand: "JLG" },
      ],
    },
    {
      slug: "nacelles-a-ciseaux",
      brand: "JLG",
      title: { fr: "Nacelles à ciseaux", en: "Scissor Lifts" },
      description: {
        fr: "Élévation verticale stable, en versions électriques intérieures ou tout-terrain motorisées.",
        en: "Stable vertical lift in indoor electric or rugged outdoor variants.",
      },
      totalCount: 17,
      models: [
        { name: "ES1330L", brand: "JLG" },
        { name: "1532R", brand: "JLG" },
        { name: "1932R", brand: "JLG" },
        { name: "AE1932 DaVinci", brand: "JLG" },
        { name: "ERT2669", brand: "JLG" },
        { name: "ERT3369", brand: "JLG" },
        { name: "ERT4069", brand: "JLG" },
        { name: "RT2669", brand: "JLG" },
        { name: "RT3369", brand: "JLG" },
        { name: "RT4069", brand: "JLG" },
        { name: "530LRT", brand: "JLG" },
        { name: "660SJC", brand: "JLG" },
        { name: "3246R", brand: "JLG" },
        { name: "4045R", brand: "JLG" },
        { name: "4069LE", brand: "JLG" },
        { name: "5390RT", brand: "JLG" },
        { name: "6390RT", brand: "JLG" },
      ],
    },
  ],

  elevateurs: [
    {
      slug: "th-fixes",
      brand: "Magni",
      title: { fr: "TH — Chariots fixes", en: "TH — Fixed Telehandlers" },
      description: {
        fr: "Élévateurs télescopiques fixes polyvalents pour la construction et l'agriculture.",
        en: "Versatile fixed telehandlers for construction and agriculture.",
      },
      totalCount: 13,
      models: [
        { name: "TH 5.5", brand: "Magni" },
        { name: "TH 5.7", brand: "Magni" },
        { name: "TH 5.8", brand: "Magni" },
        { name: "TH 6.10", brand: "Magni" },
        { name: "TH 6.13", brand: "Magni" },
        { name: "TH 6.16", brand: "Magni" },
        { name: "TH 6.20", brand: "Magni" },
        { name: "TH 7.10", brand: "Magni" },
        { name: "TH 7.14", brand: "Magni" },
        { name: "TH 8.10", brand: "Magni" },
        { name: "TH 8.12", brand: "Magni" },
        { name: "TH 8.14", brand: "Magni" },
        { name: "TH 9.10", brand: "Magni" },
      ],
    },
    {
      slug: "hth-heavy-duty",
      brand: "Magni",
      title: {
        fr: "HTH — Grandes capacités de charge",
        en: "HTH — Heavy-Duty Telehandlers",
      },
      description: {
        fr: "Capacités jusqu'à 50 tonnes pour la manutention industrielle et portuaire.",
        en: "Capacities up to 50 tons for industrial and port handling.",
      },
      totalCount: 9,
      models: [
        { name: "HTH 16.10", brand: "Magni" },
        { name: "HTH 24.11", brand: "Magni" },
        { name: "HTH 24.12", brand: "Magni" },
        { name: "HTH 27.11", brand: "Magni" },
        { name: "HTH 30.12", brand: "Magni" },
        { name: "HTH 35.12", brand: "Magni" },
        { name: "HTH 39.12", brand: "Magni" },
        { name: "HTH 42.12", brand: "Magni" },
        { name: "HTH 50.14", brand: "Magni" },
      ],
    },
    {
      slug: "rth-rotatifs",
      brand: "Magni",
      title: { fr: "RTH — Rotatifs", en: "RTH — Rotating Telehandlers" },
      description: {
        fr: "Tourelle 360° et bras télescopique pour la polyvalence ultime sur chantier.",
        en: "360° turret and telescopic boom for ultimate on-site versatility.",
      },
      totalCount: 14,
      models: [
        { name: "RTH 4.18", brand: "Magni" },
        { name: "RTH 5.21", brand: "Magni" },
        { name: "RTH 5.23", brand: "Magni" },
        { name: "RTH 5.25", brand: "Magni" },
        { name: "RTH 5.30", brand: "Magni" },
        { name: "RTH 6.21", brand: "Magni" },
        { name: "RTH 6.23", brand: "Magni" },
        { name: "RTH 6.25", brand: "Magni" },
        { name: "RTH 6.30", brand: "Magni" },
        { name: "RTH 6.35", brand: "Magni" },
        { name: "RTH 6.39", brand: "Magni" },
        { name: "RTH 6.46", brand: "Magni" },
        { name: "RTH 8.39", brand: "Magni" },
        { name: "RTH 13.26", brand: "Magni" },
      ],
    },
  ],

  construction: [
    {
      slug: "chargeuses",
      brand: "Mecalac",
      title: { fr: "Chargeuses", en: "Loaders" },
      description: {
        fr: "Chargeuses articulées, sur pneus, pivotantes (Swing), télescopiques, multifonctions et électriques.",
        en: "Articulated, wheeled, swing, telescopic, multi-purpose and electric loaders.",
      },
      totalCount: 21,
      models: [
        { name: "AS900TELE", brand: "Mecalac" },
        { name: "AS1000", brand: "Mecalac" },
        { name: "AS1600", brand: "Mecalac" },
        { name: "AT900", brand: "Mecalac" },
        { name: "AT1050", brand: "Mecalac" },
        { name: "AF1050", brand: "Mecalac" },
        { name: "AX700", brand: "Mecalac" },
        { name: "AX850", brand: "Mecalac" },
        { name: "AX1000", brand: "Mecalac" },
        { name: "MCL2", brand: "Mecalac" },
        { name: "MCL4", brand: "Mecalac" },
        { name: "MCL6", brand: "Mecalac" },
        { name: "MCL8", brand: "Mecalac" },
        { name: "ES1000", brand: "Mecalac" },
      ],
    },
    {
      slug: "chargeuses-pelleteuses",
      brand: "Mecalac",
      title: { fr: "Chargeuses-pelleteuses", en: "Backhoe Loaders" },
      description: {
        fr: "Pelle rétro centrale ou à déplacement latéral pour les travaux de voirie et d'aménagement.",
        en: "Centre-pivot or side-shift backhoe loaders for road and utility works.",
      },
      totalCount: 5,
      models: [
        { name: "TLB830", brand: "Mecalac" },
        { name: "TLB840", brand: "Mecalac" },
        { name: "TLB870", brand: "Mecalac" },
        { name: "TLB880", brand: "Mecalac" },
        { name: "TLB890", brand: "Mecalac" },
      ],
    },
    {
      slug: "compacteurs",
      brand: "Mecalac",
      title: { fr: "Compacteurs à rouleaux", en: "Roller Compactors" },
      description: {
        fr: "Rouleaux vibrants tandem et monobille pour la compaction des sols et des enrobés.",
        en: "Tandem vibratory and single-drum rollers for soil and asphalt compaction.",
      },
      totalCount: 5,
      models: [
        { name: "MBR71", brand: "Mecalac" },
        { name: "MBR81", brand: "Mecalac" },
        { name: "TV900", brand: "Mecalac" },
        { name: "TV1000", brand: "Mecalac" },
        { name: "TV1200", brand: "Mecalac" },
      ],
    },
    {
      slug: "dumpers",
      brand: "Mecalac",
      title: { fr: "Dumpers (Tombereaux)", en: "Site Dumpers" },
      description: {
        fr: "Séries TA, MDX, eMDX électrique et Revotruck révolutionnaire pour le transport sur chantier.",
        en: "TA, MDX, electric eMDX and revolutionary Revotruck series for on-site transport.",
      },
      totalCount: 12,
      models: [
        { name: "TA1", brand: "Mecalac" },
        { name: "TA3", brand: "Mecalac" },
        { name: "TA6", brand: "Mecalac" },
        { name: "TA9", brand: "Mecalac" },
        { name: "TA12", brand: "Mecalac" },
        { name: "T6", brand: "Mecalac" },
        { name: "3.5MDX", brand: "Mecalac" },
        { name: "6MDX", brand: "Mecalac" },
        { name: "9MDX", brand: "Mecalac" },
        { name: "eMDX", brand: "Mecalac" },
        { name: "Revotruck 9", brand: "Mecalac" },
        { name: "Revotruck 12", brand: "Mecalac" },
      ],
    },
    {
      slug: "pelles",
      brand: "Mecalac",
      title: { fr: "Pelles", en: "Excavators" },
      description: {
        fr: "Pelles sur chenilles, sur pneus, chargeuses-pelles, électriques, SKID et Rail-Route.",
        en: "Crawler, wheeled, loader-excavators, electric, SKID and Rail-Road excavators.",
      },
      totalCount: 14,
      models: [
        { name: "6MCR", brand: "Mecalac" },
        { name: "8MCR", brand: "Mecalac" },
        { name: "10MCR", brand: "Mecalac" },
        { name: "11MWR", brand: "Mecalac" },
        { name: "12MTX", brand: "Mecalac" },
        { name: "12MXT", brand: "Mecalac" },
        { name: "14MBR", brand: "Mecalac" },
        { name: "15MC", brand: "Mecalac" },
        { name: "15MWR", brand: "Mecalac" },
        { name: "9MWR", brand: "Mecalac" },
        { name: "216MRail", brand: "Mecalac" },
        { name: "e12", brand: "Mecalac" },
        { name: "e10", brand: "Mecalac" },
        { name: "e6", brand: "Mecalac" },
      ],
    },
    {
      slug: "pelles-de-manutention",
      brand: "Terex Fuchs",
      title: { fr: "Pelles de manutention", en: "Material Handlers" },
      description: {
        fr: "Machines spécialisées pour le recyclage, la ferraille, le bois et la manutention portuaire.",
        en: "Specialised machines for recycling, scrap, timber and port handling.",
      },
      totalCount: 15,
      models: [
        { name: "MHL310", brand: "Terex Fuchs" },
        { name: "MHL320", brand: "Terex Fuchs" },
        { name: "MHL331", brand: "Terex Fuchs" },
        { name: "MHL335", brand: "Terex Fuchs" },
        { name: "MHL340", brand: "Terex Fuchs" },
        { name: "MHL350", brand: "Terex Fuchs" },
        { name: "MHL360", brand: "Terex Fuchs" },
        { name: "MHL370", brand: "Terex Fuchs" },
        { name: "MHL380", brand: "Terex Fuchs" },
        { name: "MHL390", brand: "Terex Fuchs" },
        { name: "MHL410", brand: "Terex Fuchs" },
        { name: "MHL420", brand: "Terex Fuchs" },
        { name: "MHL434", brand: "Terex Fuchs" },
        { name: "MHL454", brand: "Terex Fuchs" },
        { name: "MHL464", brand: "Terex Fuchs" },
      ],
    },
  ],
};

export function getCategorySubcategories(slug: CategorySlug): SubCategory[] {
  return catalog[slug];
}

export function totalProductsForCategory(slug: CategorySlug): number {
  return catalog[slug].reduce((sum, sub) => sum + sub.totalCount, 0);
}
