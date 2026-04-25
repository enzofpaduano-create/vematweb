export type CategorySlug = "grues" | "nacelles" | "elevateurs" | "construction";

export type Model = {
  name: string;
  brand: string;
  slug?: string;
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
      totalCount: 10,
      models: [
        { name: "TRT 35", brand: "Terex", slug: "trt-35"},
        {name: "TRT 50", brand: "Terex", slug: "trt-50"},
        {name: "TRT 60", brand: "Terex", slug: "trt-60"},
        {name: "TRT 70", brand: "Terex", slug: "trt-70"},
        {name: "TRT 80L", brand: "Terex", slug: "trt-80l"},
        {name: "TRT 90", brand: "Terex", slug: "trt-90"},
        {name: "TRT 100", brand: "Terex", slug: "trt-100"},
        {name: "RT 1045", brand: "Terex", slug: "rt-1045"},
        {name: "RT 1070", brand: "Terex", slug: "rt-1070"},
        {name: "RT 1080", brand: "Terex", slug: "rt-1080"},
      ],
    },
    {
      slug: "grues-automotrices-lentes-tadano",
      brand: "Tadano Rough Terrain",
      title: {
        fr: "Grues automotrices lentes (Tadano)",
        en: "Tadano Rough Terrain Cranes",
      },
      description: {
        fr: "Performance et fiabilité japonaises pour les terrains difficiles.",
        en: "Japanese performance and reliability for tough terrains.",
      },
      totalCount: 10,
      models: [
        { name: "GR-300EX", brand: "Tadano", slug: "gr-300ex"},
        {name: "GR-500EXS", brand: "Tadano", slug: "gr-500exs"},
        {name: "GR-500EXL", brand: "Tadano", slug: "gr-500exl"},
        {name: "GR-600EX", brand: "Tadano", slug: "gr-600ex"},
        {name: "GR-700EX-4", brand: "Tadano", slug: "gr-700ex-4"},
        {name: "GR-800EX", brand: "Tadano", slug: "gr-800ex"},
        {name: "GR-900EX-4", brand: "Tadano", slug: "gr-900ex-4"},
        {name: "GR-1000EX-4", brand: "Tadano", slug: "gr-1000ex-4"},
        {name: "GR-1100EX", brand: "Tadano", slug: "gr-1100ex"},
        {name: "GR-1450EX", brand: "Tadano", slug: "gr-1450ex" }
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
      totalCount: 21,
      models: [
        { slug: "ac-2-040-1", name: "AC 2.040-1", brand: "Tadano"},
        {slug: "ac-3-055-1", name: "AC 3.055-1", brand: "Tadano"},
        {slug: "ac-3-060-1", name: "AC 3.060-1", brand: "Tadano"},
        {slug: "ac-4-070-2", name: "AC 4.070-2", brand: "Tadano"},
        {slug: "ac-4-070l-1", name: "AC 4.070L-1", brand: "Tadano"},
        {slug: "ac-4-080-1", name: "AC 4.080-1", brand: "Tadano"},
        {slug: "ac-4-100l-1", name: "AC 4.100L-1", brand: "Tadano"},
        {slug: "ac-4-110-1", name: "AC 4.110-1", brand: "Tadano"},
        {slug: "ac-5-120-1", name: "AC 5.120-1", brand: "Tadano"},
        {slug: "ac-5-130-1", name: "AC 5.130-1", brand: "Tadano"},
        {slug: "ac-5-140-1", name: "AC 5.140-1", brand: "Tadano"},
        {slug: "ac-5-160-1", name: "AC 5.160-1", brand: "Tadano"},
        {slug: "ac-5-220-1", name: "AC 5.220-1", brand: "Tadano"},
        {slug: "ac-5-220l-1", name: "AC 5.220L-1", brand: "Tadano"},
        {slug: "ac-5-250-1", name: "AC 5.250-1", brand: "Tadano"},
        {slug: "ac-5-250-2", name: "AC 5.250-2", brand: "Tadano"},
        {slug: "ac-5-250l-2", name: "AC 5.250L-2", brand: "Tadano"},
        {slug: "ac-6-300-1", name: "AC 6.300-1", brand: "Tadano"},
        {slug: "ac-7-450-1", name: "AC 7.450-1", brand: "Tadano"},
        {slug: "ac-8-500-1", name: "AC 8.500-1", brand: "Tadano"},
        {slug: "ac-3-045-1-city", name: "AC 3.045-1 CITY", brand: "Tadano" }
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
      totalCount: 3,
      models: [
        { slug: "gtc-700", name: "GTC-700", brand: "Tadano"},
        {slug: "gtc-900", name: "GTC-900", brand: "Tadano"},
        {slug: "gtc-2000", name: "GTC-2000", brand: "Tadano" }
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
      totalCount: 5,
      models: [
        { name: "CC 24.400-1", brand: "Tadano Demag", slug: "cc-24-400-1"},
        {name: "CC 38.650-1", brand: "Tadano Demag", slug: "cc-38-650-1"},
        {name: "CC 68.1250-1", brand: "Tadano Demag", slug: "cc-68-1250-1"},
        {name: "CC 78.1250-1", brand: "Tadano Demag", slug: "cc-78-1250-1"},
        {name: "CC 88.1600-1", brand: "Tadano Demag", slug: "cc-88-1600-1"}
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
      models: [
        { name: "AC 3.045-1 City", brand: "Tadano", slug: "ac-3-045-1-city" }
      ],
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
        { name: "HK 4.050-1", brand: "Tadano"},
        {name: "HK 4.070-1", brand: "Tadano" }
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
      totalCount: 3,
      models: [
        { slug: "gt-300el-3", name: "GT-300EL-3", brand: "Tadano"},
        {slug: "gt-600el-3", name: "GT-600EL-3", brand: "Tadano"},
        {slug: "gt-750el-3", name: "GT-750EL-3", brand: "Tadano" }
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
      totalCount: 29,
      models: [
        { name: "FC 6.24H", brand: "Terex", slug: "fc-6-24h"},
        {name: "CTT 91-5", brand: "Terex", slug: "ctt-91-5"},
        {name: "CTT 132-6", brand: "Terex", slug: "ctt-132-6"},
        {name: "CTT 152-6", brand: "Terex", slug: "ctt-152-6"},
        {name: "CTT 172-8", brand: "Terex", slug: "ctt-172-8"},
        {name: "CTT 202-10", brand: "Terex", slug: "ctt-202-10"},
        {name: "CTT 222-10", brand: "Terex", slug: "ctt-222-10"},
        {name: "CTT 231-12", brand: "Terex", slug: "ctt-231-12"},
        {name: "CTT 292-12", brand: "Terex", slug: "ctt-292-12"},
        {name: "CTT 392-16", brand: "Terex", slug: "ctt-392-16"},
        {name: "CTT 332-16", brand: "Terex", slug: "ctt-332-16"},
        {name: "CTT 472-20", brand: "Terex", slug: "ctt-472-20"},
        {name: "CTT 561A-20", brand: "Terex", slug: "ctt-561a-20"},
        {name: "CTT 561A-32", brand: "Terex", slug: "ctt-561a-32"},
        {name: "CTT 722-40", brand: "Terex", slug: "ctt-722-40"},
        {name: "CTLH 192-12", brand: "Terex", slug: "ctlh-192-12"},
        {name: "CTL 140-10", brand: "Terex", slug: "ctl-140-10"},
        {name: "CTL 180-16", brand: "Terex", slug: "ctl-180-16"},
        {name: "CTL 260A-18", brand: "Terex", slug: "ctl-260a-18"},
        {name: "CTL 282-18", brand: "Terex", slug: "ctl-282-18"},
        {name: "CTL 340-24", brand: "Terex", slug: "ctl-340-24"},
        {name: "CTL 430-24", brand: "Terex", slug: "ctl-430-24"},
        {name: "CTL 702-32", brand: "Terex", slug: "ctl-702-32"},
        {name: "CTL 712-45", brand: "Terex", slug: "ctl-712-45"},
        {name: "CTL 650F-45", brand: "Terex", slug: "ctl-650f-45"},
        {name: "CTL 1600-66", brand: "Terex", slug: "ctl-1600-66"},
        {name: "CDK 100-16 (Derrick)", brand: "Terex", slug: "cdk-100-16-derrick"},
        {name: "SK 415-20", brand: "Terex", slug: "sk-415-20"},
        {name: "SK 575-32", brand: "Terex", slug: "sk-575-32" }
      ],
    }],

  nacelles: [
    {
      slug: "nacelles-fleche-motorisees",
      brand: "JLG",
      title: { fr: "Nacelles à flèche motorisées", en: "Engine-Powered Boom Lifts" },
      description: {
        fr: "Puissance et portée exceptionnelles pour les chantiers extérieurs les plus exigeants.",
        en: "Exceptional power and reach for the most demanding outdoor jobsites.",
      },
      totalCount: 13,
      models: [
        { slug: "340aj", name: "340AJ", brand: "JLG"},
        {slug: "450aj", name: "450AJ", brand: "JLG"},
        {slug: "450aj-hc3", name: "450AJ HC3", brand: "JLG"},
        {slug: "600aj", name: "600AJ", brand: "JLG"},
        {slug: "600aj-hc3", name: "600AJ HC3", brand: "JLG"},
        {slug: "800aj", name: "800AJ", brand: "JLG"},
        {slug: "800aj-hc3", name: "800AJ HC3", brand: "JLG"},
        {slug: "1250ajp", name: "1250AJP", brand: "JLG"},
        {slug: "1500ajp", name: "1500AJP", brand: "JLG"},
        {slug: "t350", name: "T350", brand: "JLG"},
        {slug: "et350", name: "ET350", brand: "JLG"},
        {slug: "t500j", name: "T500J", brand: "JLG"},
        {slug: "et500j", name: "ET500J", brand: "JLG" }
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
        fr: "Performance écologique et silence pour les travaux en intérieur ou en zones urbaines.",
        en: "Eco-friendly performance and quiet operation for indoor or urban work.",
      },
      totalCount: 8,
      models: [
        { slug: "h340aj-hybrid", name: "H340AJ Hybrid", brand: "JLG"},
        {slug: "ec600sj", name: "EC600SJ", brand: "JLG"},
        {slug: "ec600sjp", name: "EC600SJP", brand: "JLG"},
        {slug: "h600sj", name: "H600SJ", brand: "JLG"},
        {slug: "h600sjp", name: "H600SJP", brand: "JLG"},
        {slug: "20e", name: "20E", brand: "JLG"},
        {slug: "26e", name: "26E", brand: "JLG"},
        {slug: "32e", name: "32E", brand: "JLG" }
      ],
    },
    {
      slug: "acces-bas-niveau",
      brand: "JLG",
      title: {
        fr: "Accès bas niveau",
        en: "Low-Level Access",
      },
      description: {
        fr: "Alternatives sûres et ergonomiques aux échelles pour les travaux de finition.",
        en: "Safe and ergonomic alternatives to ladders for finishing work.",
      },
      totalCount: 3,
      models: [
        { slug: "ecolift-50", name: "EcoLift 50", brand: "JLG"},
        {slug: "830p", name: "830P", brand: "JLG"},
        {slug: "1030p", name: "1030P", brand: "JLG" }
      ],
    },
    {
      slug: "mats-verticaux",
      brand: "JLG",
      title: {
        fr: "Mâts verticaux",
        en: "Vertical Mast Lifts",
      },
      description: {
        fr: "Compactes et légères, idéales pour les espaces restreints et les sols fragiles.",
        en: "Compact and lightweight, ideal for confined spaces and sensitive floors.",
      },
      totalCount: 6,
      models: [
        { slug: "1230es", name: "1230ES", brand: "JLG"},
        {slug: "e18mcl", name: "E18MCL", brand: "JLG"},
        {slug: "25am", name: "25AM", brand: "JLG"},
        {slug: "30am", name: "30AM", brand: "JLG"},
        {slug: "38am", name: "38AM", brand: "JLG"},
        {slug: "10msp", name: "10MSP", brand: "JLG" }
      ],
    },
    {
      slug: "nacelles-a-ciseaux",
      brand: "JLG",
      title: { fr: "Nacelles à ciseaux", en: "Scissor Lifts" },
      description: {
        fr: "Grande capacité de plateforme et stabilité pour les travaux intensifs en hauteur.",
        en: "High platform capacity and stability for intensive work at height.",
      },
      totalCount: 10,
      models: [
        { slug: "ae1932", name: "AE1932", brand: "JLG"},
        {slug: "es1330m", name: "ES1330M", brand: "JLG"},
        {slug: "es1530m", name: "ES1530M", brand: "JLG"},
        {slug: "es1932", name: "ES1932", brand: "JLG"},
        {slug: "es2632", name: "ES2632", brand: "JLG"},
        {slug: "ert2669", name: "ERT2669", brand: "JLG"},
        {slug: "ert3369", name: "ERT3369", brand: "JLG"},
        {slug: "ert4069", name: "ERT4069", brand: "JLG"},
        {slug: "rt2669", name: "RT2669", brand: "JLG"},
        {slug: "rt3369", name: "RT3369", brand: "JLG" }
      ],
    },
    {
      slug: "nacelles-chenilles-compactes",
      brand: "JLG",
      title: { fr: "Nacelles sur chenilles compactes", en: "Compact Crawler Lifts" },
      description: {
        fr: "Accès tout-terrain et franchissement d'obstacles pour les environnements complexes.",
        en: "All-terrain access and obstacle clearance for complex environments.",
      },
      totalCount: 7,
      models: [
        { slug: "x430aj", name: "X430AJ", brand: "JLG"},
        {slug: "x500aj", name: "X500AJ", brand: "JLG"},
        {slug: "x540aj", name: "X540AJ", brand: "JLG"},
        {slug: "x600aj", name: "X600AJ", brand: "JLG"},
        {slug: "x770aj", name: "X770AJ", brand: "JLG"},
        {slug: "x1000aj", name: "X1000AJ", brand: "JLG"},
        {slug: "x660sj", name: "X660SJ", brand: "JLG" }
      ],
    }],

  elevateurs: [
    {
      slug: "th-fixes",
      brand: "Magni",
      title: { fr: "TH — Chariots fixes", en: "TH — Fixed Telehandlers" },
      description: {
        fr: "Élévateurs télescopiques fixes polyvalents pour la construction et l'agriculture.",
        en: "Versatile fixed telehandlers for construction and agriculture.",
      },
      totalCount: 14,
      models: [
        { name: "TH 3.6", brand: "Magni", slug: "th-3-6"},
        {name: "TH 3.6 e", brand: "Magni", slug: "th-3-6-e"},
        {name: "TH 3,5.7", brand: "Magni", slug: "th-3-5-7"},
        {name: "TH 3,5.9", brand: "Magni", slug: "th-3-5-9"},
        {name: "TH 4.15 S", brand: "Magni", slug: "th-4-15-s"},
        {name: "TH 4.15 SP", brand: "Magni", slug: "th-4-15-sp"},
        {name: "TH 4.19 S", brand: "Magni", slug: "th-4-19-s"},
        {name: "TH 4.19 SP", brand: "Magni", slug: "th-4-19-sp"},
        {name: "TH 4,5.19 P", brand: "Magni", slug: "th-4-5-19-p"},
        {name: "TH 5.8 P", brand: "Magni", slug: "th-5-8-p"},
        {name: "TH 5.5.19 P", brand: "Magni", slug: "th-5-5-19-p"},
        {name: "TH 5.5.24 P", brand: "Magni", slug: "th-5-5-24-p"},
        {name: "TH 6.20 P", brand: "Magni", slug: "th-6-20-p"},
        {name: "TH 7.10 P", brand: "Magni", slug: "th-7-10-p" }
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
      totalCount: 8,
      models: [
        { name: "HTH 10.10", brand: "Magni", slug: "hth-10-10"},
        {name: "HTH 12.10", brand: "Magni", slug: "hth-12-10"},
        {name: "HTH 16.10", brand: "Magni", slug: "hth-16-10"},
        {name: "HTH 20.10", brand: "Magni", slug: "hth-20-10"},
        {name: "HTH 25.11", brand: "Magni", slug: "hth-25-11"},
        {name: "HTH 27.11", brand: "Magni", slug: "hth-27-11"},
        {name: "HTH 35.12", brand: "Magni", slug: "hth-35-12"},
        {name: "HTH 50.14", brand: "Magni", slug: "hth-50-14" }
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
      totalCount: 16,
      models: [
        { name: "RTH 5.18", brand: "Magni", slug: "rth-5-18"},
        {name: "RTH 5.21", brand: "Magni", slug: "rth-5-21"},
        {name: "RTH 5.23", brand: "Magni", slug: "rth-5-23"},
        {name: "RTH 5.25", brand: "Magni", slug: "rth-5-25"},
        {name: "RTH 6.22", brand: "Magni", slug: "rth-6-22"},
        {name: "RTH 6.22 EC", brand: "Magni", slug: "rth-6-22-ec"},
        {name: "RTH 6.22 TC", brand: "Magni", slug: "rth-6-22-tc"},
        {name: "RTH 6.26", brand: "Magni", slug: "rth-6-26"},
        {name: "RTH 6.26 EC", brand: "Magni", slug: "rth-6-26-ec"},
        {name: "RTH 6.26 TC", brand: "Magni", slug: "rth-6-26-tc"},
        {name: "RTH 6.31", brand: "Magni", slug: "rth-6-31"},
        {name: "RTH 6.31 EC", brand: "Magni", slug: "rth-6-31-ec"},
        {name: "RTH 6.31 TC", brand: "Magni", slug: "rth-6-31-tc"},
        {name: "RTH 8.27", brand: "Magni", slug: "rth-8-27"},
        {name: "RTH 8.27 TC", brand: "Magni", slug: "rth-8-27-tc"},
        {name: "RTH 8.35", brand: "Magni", slug: "rth-8-35" }
      ],
    }],

  construction: [
    {
      slug: "chargeuses",
      brand: "Mecalac",
      title: { fr: "Chargeuses", en: "Loaders" },
      description: {
        fr: "Chargeuses articulées, sur pneus, pivotantes (Swing) et multifonctions.",
        en: "Articulated, wheeled, swing and multi-purpose loaders.",
      },
      totalCount: 8,
      models: [
        { slug: "mcl2", name: "MCL2", brand: "Mecalac"},
        {slug: "mcl4", name: "MCL4", brand: "Mecalac"},
        {slug: "mcl6", name: "MCL6", brand: "Mecalac"},
        {slug: "mcl8", name: "MCL8", brand: "Mecalac"},
        {slug: "as600", name: "AS600", brand: "Mecalac"},
        {slug: "as900tele", name: "AS900TELE", brand: "Mecalac"},
        {slug: "as1600", name: "AS1600", brand: "Mecalac"},
        {slug: "ax1000", name: "AX1000", brand: "Mecalac" }
      ],
    },
    {
      slug: "chargeuses-pelleteuses",
      brand: "Mecalac",
      title: { fr: "Chargeuses-pelleteuses", en: "Backhoe Loaders" },
      description: {
        fr: "Polyvalence maximale pour les travaux de voirie et réseaux.",
        en: "Maximum versatility for road and utility works.",
      },
      totalCount: 5,
      models: [
        { slug: "tlb830", name: "TLB830", brand: "Mecalac"},
        {slug: "tlb870", name: "TLB870", brand: "Mecalac"},
        {slug: "tlb880", name: "TLB880", brand: "Mecalac"},
        {slug: "tlb890", name: "TLB890", brand: "Mecalac"},
        {slug: "tlb990", name: "TLB990", brand: "Mecalac" }
      ],
    },
    {
      slug: "dumpers",
      brand: "Mecalac",
      title: { fr: "Dumpers (Tombereaux)", en: "Site Dumpers" },
      description: {
        fr: "Solutions de transport robustes, incluant le eMDX électrique et le Revotruck.",
        en: "Rugged transport solutions, including the electric eMDX and Revotruck.",
      },
      totalCount: 7,
      models: [
        { slug: "emdx", name: "eMDX", brand: "Mecalac"},
        {slug: "revotruck-9", name: "Revotruck 9", brand: "Mecalac"},
        {slug: "ta3", name: "TA3", brand: "Mecalac"},
        {slug: "ta6", name: "TA6", brand: "Mecalac"},
        {slug: "ta9", name: "TA9", brand: "Mecalac"},
        {slug: "6mdx", name: "6MDX", brand: "Mecalac"},
        {slug: "9mdx", name: "9MDX", brand: "Mecalac" }
      ],
    },
    {
      slug: "pelles",
      brand: "Mecalac",
      title: { fr: "Pelles", en: "Excavators" },
      description: {
        fr: "Pelles MCR (SKID) et MWR (Pneus) alliant vitesse et puissance.",
        en: "MCR (SKID) and MWR (Wheeled) excavators combining speed and power.",
      },
      totalCount: 10,
      models: [
        { slug: "6mcr", name: "6MCR", brand: "Mecalac"},
        {slug: "8mcr", name: "8MCR", brand: "Mecalac"},
        {slug: "10mcr", name: "10MCR", brand: "Mecalac"},
        {slug: "7mwr", name: "7MWR", brand: "Mecalac"},
        {slug: "9mwr", name: "9MWR", brand: "Mecalac"},
        {slug: "11mwr", name: "11MWR", brand: "Mecalac"},
        {slug: "15mwr", name: "15MWR", brand: "Mecalac"},
        {slug: "12mtx", name: "12MTX", brand: "Mecalac"},
        {slug: "15mc", name: "15MC", brand: "Mecalac"},
        {slug: "e12", name: "e12", brand: "Mecalac" }
      ],
    },
    {
      slug: "pelles-de-manutention",
      brand: "Terex Fuchs",
      title: { fr: "Pelles de manutention", en: "Material Handlers" },
      description: {
        fr: "Machines spécialisées pour le recyclage et la manutention portuaire.",
        en: "Specialised machines for recycling and port handling.",
      },
      totalCount: 3,
      models: [
        { name: "MHL320", brand: "Terex Fuchs"},
        {name: "MHL350", brand: "Terex Fuchs"},
        {name: "MHL360", brand: "Terex Fuchs" }
      ],
    }],
};

export function getCategorySubcategories(slug: CategorySlug): SubCategory[] {
  return catalog[slug];
}

export function totalProductsForCategory(slug: CategorySlug): number {
  return catalog[slug].reduce((sum, sub) => sum + sub.totalCount, 0);
}
