import type { ProductDetail } from "../types/product";
import rawFuchsData from "./terexFuchsMaterialHandlersRaw.json";

type RawFuchsImage = {
  localPath: string;
};

type RawFuchsDownload = {
  label: string;
  url: string;
};

type RawFuchsProduct = {
  slug: string;
  title: string;
  localImages?: RawFuchsImage[];
  specs?: Record<string, string>;
  downloads?: RawFuchsDownload[];
};

type FuchsCopyBlock = {
  description: { fr: string; en: string };
  features: { fr: string[]; en: string[] };
};

const FUCHS_SLUG_MAP: Record<string, string> = {
  "mhl320-modular": "mhl320",
  "mhl434-prenons-les-choses-en-mains": "mhl434-f",
};

const FUCHS_NAME_OVERRIDES: Record<string, string> = {
  "mhl320": "MHL320 MODULAR+",
  "mhl434-f": "MHL434 F",
};

const FUCHS_COPY: Record<string, FuchsCopyBlock> = {
  "mhl340-g": {
    description: {
      fr: "La MHL340 G de nouvelle génération mise sur une personnalisation poussée, une commande très fluide et une vraie polyvalence pour le recyclage et la manutention. Disponible en version diesel ou électrique, elle aide les opérateurs à maintenir un rythme soutenu avec plus de confort et de précision.",
      en: "The new-generation MHL340 G focuses on deep operator personalization, smooth control feel and strong versatility for recycling and material handling. Available in diesel or electric form, it helps operators sustain high productivity with more comfort and precision.",
    },
    features: {
      fr: [
        "Réglages opérateur personnalisables",
        "Commande souple et précise pour les cycles rapides",
        "Disponible en version diesel ou électrique",
      ],
      en: [
        "Individually adjustable operator settings",
        "Smooth, precise control for fast cycles",
        "Available in diesel or electric version",
      ],
    },
  },
  "mhl350-g": {
    description: {
      fr: "La MHL350 G reprend l'esprit de la nouvelle génération Fuchs avec plus de capacité, plus de portée et une commande ajustable au profil de chaque opérateur. C'est une solution haut de gamme pour les applications de recyclage, de vrac et de manutention portuaire qui exigent rendement et souplesse.",
      en: "The MHL350 G brings the new Fuchs generation philosophy with more capacity, more reach and controls that can be tuned to each operator. It is a premium solution for recycling, bulk handling and port operations that demand productivity and flexibility.",
    },
    features: {
      fr: [
        "Réglages machine adaptés à chaque opérateur",
        "Commandes progressives pour plus de précision",
        "Version portuaire et électrique disponibles selon l'application",
      ],
      en: [
        "Machine settings tailored to each operator",
        "Progressive controls for higher precision",
        "Port-oriented and electric versions available depending on the application",
      ],
    },
  },
  "mhl310": {
    description: {
      fr: "Compacte mais très capable pour le recyclage, la MHL310 combine une excellente visibilité, une hydraulique efficiente et un vrai potentiel de charge dans sa catégorie. Elle convient très bien au tri, au chargement de presses et aux environnements où la productivité doit rester élevée malgré un gabarit contenu.",
      en: "Compact yet highly capable for recycling, the MHL310 combines strong visibility, efficient hydraulics and real lifting potential in its class. It is well suited to sorting, baler feeding and applications where productivity must stay high despite a compact footprint.",
    },
    features: {
      fr: [
        "Zone de travail de 18 m dans la catégorie 16 t",
        "Hauteur de vue élevée de 5,2 m",
        "Hydraulique à débit contrôlé avec circuit de rotation fermé",
      ],
      en: [
        "18 m working area in the 16 t class",
        "High 5.2 m eye level",
        "Flow-controlled hydraulics with closed swing circuit",
      ],
    },
  },
  "mhl320": {
    description: {
      fr: "Référence du recyclage industriel, la MHL320 MODULAR+ combine robustesse, refroidissement performant et vrai choix d'énergie. Son concept modulaire diesel, électrique ou batterie facilite l'adaptation aux contraintes du site, de l'exploitation intérieure aux plateformes plus intensives.",
      en: "A benchmark in industrial waste recycling, the MHL320 MODULAR+ combines robustness, high-performance cooling and true powertrain choice. Its modular diesel, electric or battery concept makes it easy to adapt the machine to site constraints, from indoor operations to intensive yards.",
    },
    features: {
      fr: [
        "Concept d'entraînement modulaire diesel, électrique ou batterie",
        "Double palier de vérin sur toute la portée",
        "Refroidissement haute performance avec radiateurs séparés",
      ],
      en: [
        "Modular drive concept: diesel, electric or battery",
        "Double cylinder bearings across the full reach",
        "High-performance cooling with separate coolers",
      ],
    },
  },
  "mhl331": {
    description: {
      fr: "Solution compacte pour les chantiers serrés, la MHL331 offre une belle portée, une cabine élévatrice et une visibilité renforcée pour garder un rythme de chargement élevé. Elle convient très bien au recyclage et à la ferraille quand l'espace est compté.",
      en: "A compact solution for tighter sites, the MHL331 delivers strong reach, an elevating cab and enhanced visibility to keep loading productivity high. It is a very good fit for recycling and scrap handling where space is limited.",
    },
    features: {
      fr: [
        "Portée maximale de 12 m",
        "Cabine élévatrice avec excellente visibilité",
        "Fuchs Connect pour les rapports d'efficacité",
      ],
      en: [
        "12 m maximum reach",
        "Elevating cab with excellent visibility",
        "Fuchs Connect for automated efficiency reports",
      ],
    },
  },
  "mhl335": {
    description: {
      fr: "La MHL335 reprend l'agilité de la MHL331 avec une assise élargie pour mieux gérer les charges lourdes à pleine portée. C'est une machine rassurante pour les sites ferraille et recyclage qui demandent stabilité et cadence.",
      en: "The MHL335 keeps the agility of the MHL331 while adding a wider footprint to better manage heavy loads at full reach. It is a confidence-inspiring machine for scrap and recycling sites that demand both stability and throughput.",
    },
    features: {
      fr: [
        "Base de support élargie pour plus de stabilité",
        "Refroidissement haute performance",
        "Fuchs Connect pour le suivi automatique",
      ],
      en: [
        "Wider support base for extra stability",
        "High-performance cooling",
        "Fuchs Connect for automatic monitoring",
      ],
    },
  },
  "mhl340": {
    description: {
      fr: "Polyvalente et très équilibrée, la MHL340 est pensée pour les flux soutenus en recyclage, déchets et ferraille. Sa longue portée et son hydraulique rapide en font une valeur sûre pour charger plus vite sans sacrifier la précision.",
      en: "Versatile and very well balanced, the MHL340 is built for sustained flows in recycling, waste and scrap handling. Its long reach and quick hydraulics make it a dependable choice for faster loading without sacrificing precision.",
    },
    features: {
      fr: [
        "Hydraulique dynamique à deux circuits",
        "Prédisposition Fuchs Quick Connect",
        "Fuchs Connect avec rappels d'entretien",
      ],
      en: [
        "Dynamic two-circuit hydraulics",
        "Fuchs Quick Connect ready",
        "Fuchs Connect with maintenance reminders",
      ],
    },
  },
  "mhl345": {
    description: {
      fr: "La MHL345 ajoute une stabilité supérieure à la base technique de la MHL340, ce qui la rend pertinente avec des accessoires plus lourds ou des charges plus exigeantes. Elle garde un bon niveau d'agilité pour les opérations de manutention intensives.",
      en: "The MHL345 adds extra stability to the technical base of the MHL340, making it more suitable for heavier attachments and more demanding loads. It still retains solid agility for intensive material handling work.",
    },
    features: {
      fr: [
        "Châssis élargi pour une stabilité renforcée",
        "Conçue pour des charges et accessoires plus lourds",
        "Hydraulique à deux circuits avec pertes minimisées",
      ],
      en: [
        "Widened undercarriage for extra stability",
        "Designed for heavier loads and attachments",
        "Two-circuit hydraulics with minimized power losses",
      ],
    },
  },
  "mhl350": {
    description: {
      fr: "Référence dans la catégorie 30 t+, la MHL350 vise la performance continue avec beaucoup de précision et une excellente efficience énergétique. Elle est taillée pour les exploitants qui veulent un vrai outil de production sur les flux ferraille et vrac.",
      en: "A benchmark in the 30 t+ class, the MHL350 is built for continuous performance with excellent precision and strong energy efficiency. It is made for operators who want a true production machine for scrap and bulk flows.",
    },
    features: {
      fr: [
        "Accès facilité aux composants via la plateforme de service",
        "Très bon compromis performances-précision-consommation",
        "Fuchs Connect pour la gestion de flotte",
      ],
      en: [
        "Easy component access through the service platform",
        "Strong balance of performance, precision and efficiency",
        "Fuchs Connect for fleet management",
      ],
    },
  },
  "mhl355": {
    description: {
      fr: "La MHL355 capitalise sur la performance de la MHL350 avec un châssis élargi pour gagner en stabilité et en confiance sur les charges lourdes. Elle est bien adaptée aux environnements où cadence, portée et sécurité doivent rester au plus haut niveau.",
      en: "The MHL355 builds on the MHL350 with a wider undercarriage to gain stability and confidence on heavy loads. It is well suited to environments where cycle rate, reach and safety must stay at a very high level.",
    },
    features: {
      fr: [
        "Châssis élargi pour plus de stabilité",
        "Adaptée aux charges plus lourdes et grands accessoires",
        "Hydraulique intelligente pour des cycles rapides et sobres",
      ],
      en: [
        "Wider undercarriage for more stability",
        "Suited to heavier loads and larger attachments",
        "Smart hydraulics for fast, efficient cycles",
      ],
    },
  },
  "mhl360": {
    description: {
      fr: "La MHL360 marque une montée en puissance nette pour la manutention lourde, avec plus d'énergie utile, une cabine très confortable et des cycles rapides. Elle convient aux sites intensifs qui veulent un haut niveau de rendement sur de longues journées.",
      en: "The MHL360 marks a clear step up in heavy-duty handling, with more usable power, a very comfortable cab and fast work cycles. It fits intensive sites that want high output over long operating days.",
    },
    features: {
      fr: [
        "Circuit de rotation fermé pour des cycles rapides",
        "Fonction de régénération de série sur les vérins",
        "Fuchs Connect pour le suivi 24/7",
      ],
      en: [
        "Closed swing circuit for fast cycles",
        "Standard regeneration function on cylinders",
        "Fuchs Connect for 24/7 monitoring",
      ],
    },
  },
  "mhl364-f": {
    description: {
      fr: "La MHL364 F pousse très loin le compromis entre performances de manutention et mobilité, avec un six-cylindres puissant et une transmission adaptée au pick-and-carry. Elle répond bien aux opérations qui demandent cadence élevée et bonne manœuvrabilité.",
      en: "The MHL364 F pushes the balance between handling performance and mobility very far, with a powerful six-cylinder engine and a drivetrain suited to pick-and-carry work. It performs well in operations that require high cycle rates and strong maneuverability.",
    },
    features: {
      fr: [
        "Entraînement pivotant fermé pour des cycles rapides",
        "Régénération des vérins pour réduire la consommation",
        "Plateforme de service Fuchs pour l'accès maintenance",
      ],
      en: [
        "Closed swing drive for fast cycles",
        "Cylinder regeneration to reduce consumption",
        "Fuchs service platform for maintenance access",
      ],
    },
  },
  "mhl370": {
    description: {
      fr: "Pensée pour les parcs à ferraille difficiles et les aciéries, la MHL370 mise sur un châssis massif, des pneus pleins XL et une forte robustesse. Elle apporte de la confiance sur les terrains agressifs tout en gardant un bon rythme de manutention.",
      en: "Designed for harsh scrap yards and steel mills, the MHL370 relies on a massive undercarriage, XL solid tires and strong robustness. It inspires confidence on aggressive ground while maintaining solid handling productivity.",
    },
    features: {
      fr: [
        "Pneus simples SETCO en caoutchouc plein",
        "Circuit de rotation fermé à haut rendement",
        "Fuchs Connect avec rappels d'entretien",
      ],
      en: [
        "SETCO solid single tires",
        "High-efficiency closed swing circuit",
        "Fuchs Connect with maintenance reminders",
      ],
    },
  },
  "mhl375": {
    description: {
      fr: "La MHL375 est orientée manutention industrielle exigeante, avec une architecture modulaire et une vraie capacité à s'adapter au vrac comme à la ferraille. C'est une base très solide pour les exploitants qui veulent configurer la machine autour de leur process.",
      en: "The MHL375 is aimed at demanding industrial material handling, with a modular architecture and a real ability to adapt to both bulk and scrap. It is a very strong base for operators who want to configure the machine around their own process.",
    },
    features: {
      fr: [
        "Circuit de rotation fermé écoénergétique",
        "Équipement Fuchs à doubles paliers",
        "Fuchs Connect pour les check-lists de service",
      ],
      en: [
        "Energy-efficient closed swing circuit",
        "Fuchs loading equipment with double bearings",
        "Fuchs Connect for service checklists",
      ],
    },
  },
  "mhl380": {
    description: {
      fr: "Pour les ports, aciéries et grands sites de ferraille, la MHL380 combine stabilité 360°, composants longue durée et large choix de configurations. Elle est conçue pour rester productive dans des environnements rigoureux et très cadencés.",
      en: "For ports, steel plants and large scrap sites, the MHL380 combines 360° stability, long-life components and a wide range of configurations. It is designed to stay productive in harsh, high-throughput environments.",
    },
    features: {
      fr: [
        "Carré d'appui généreux pour une stabilité à 360°",
        "Composants MEF pensés pour durer",
        "Fuchs Connect pour la surveillance continue",
      ],
      en: [
        "Large support footprint for 360° stability",
        "MEF components engineered for long life",
        "Fuchs Connect for continuous monitoring",
      ],
    },
  },
  "mhl390": {
    description: {
      fr: "Machine de très grande capacité pour les opérations les plus dures, la MHL390 couvre aussi bien le vrac portuaire que les grumes, la ferraille ou les big bags. Son approche modulaire en fait une solution premium pour les gros volumes et les longues portées.",
      en: "A very high-capacity machine for the toughest operations, the MHL390 handles port bulk goods as well as logs, scrap or big bags. Its modular approach makes it a premium solution for high volumes and long reach requirements.",
    },
    features: {
      fr: [
        "Systèmes de levage cabine selon la hauteur de vue recherchée",
        "Portée maximale de 24,5 m",
        "Fuchs Connect pour le contrôle des performances",
      ],
      en: [
        "Cab lift systems for different eye-level requirements",
        "24.5 m maximum reach",
        "Fuchs Connect for performance monitoring",
      ],
    },
  },
  "f120-mh": {
    description: {
      fr: "Vaisseau amiral de la gamme Fuchs, le F120 MH vise les plus gros débits avec une puissance système hors norme, une portée impressionnante et une modularité poussée. C'est une solution de très haut niveau pour les terminaux, vracs lourds et grands centres industriels.",
      en: "As the flagship of the Fuchs range, the F120 MH targets the very highest throughput with exceptional system power, impressive reach and extensive modularity. It is a top-tier solution for terminals, heavy bulk goods and major industrial sites.",
    },
    features: {
      fr: [
        "Puissance système jusqu'à 500 kW",
        "Concept Blue Hybrid avec jusqu'à 35 % d'économies d'énergie",
        "Configurations chenilles, mobiles, fixes ou portiques",
      ],
      en: [
        "System power up to 500 kW",
        "Blue Hybrid concept with energy savings of up to 35%",
        "Crawler, mobile, stationary or gantry configurations",
      ],
    },
  },
  "mhl420": {
    description: {
      fr: "Développée pour l'entretien des arbres et les usages forestiers, la MHL420 privilégie la flexibilité, la compacité et la compatibilité avec de nombreux outils. Elle est facile à déplacer et pertinente quand l'accès et la maniabilité comptent autant que la portée.",
      en: "Developed for tree care and forestry work, the MHL420 prioritizes flexibility, compactness and compatibility with many tools. It is easy to transport and especially relevant when access and maneuverability matter as much as reach.",
    },
    features: {
      fr: [
        "Pensée pour l'entretien des arbres et les accessoires forestiers",
        "Format compact avec faible rayon de braquage",
        "Transport facile entre plusieurs sites",
      ],
      en: [
        "Built for tree care and forestry attachments",
        "Compact format with a tight turning radius",
        "Easy transport between multiple sites",
      ],
    },
  },
  "mhl434-f": {
    description: {
      fr: "Compacte, maniable et facile à entretenir, la MHL434 F est pensée pour travailler efficacement dans des zones étroites tout en protégeant les organes clés. Elle convient bien aux exploitants qui recherchent une machine pratique, sûre et rapide à prendre en main.",
      en: "Compact, maneuverable and easy to service, the MHL434 F is designed to work efficiently in tighter areas while protecting key components. It suits operators looking for a practical, safe machine that is quick to get started with.",
    },
    features: {
      fr: [
        "Dimensions compactes et rayon de braquage réduit",
        "Accès entretien facilité depuis le sol",
        "Protection renforcée des composants essentiels",
      ],
      en: [
        "Compact dimensions and reduced turning radius",
        "Easy ground-level service access",
        "Enhanced protection for key components",
      ],
    },
  },
  "mhl450": {
    description: {
      fr: "Spécialiste du bois, la MHL450 a été conçue pour tracter des remorques chargées tout en conservant une manutention efficace des grumes. Elle combine traction, portée et capacité hydraulique pour les plateformes forestières intensives.",
      en: "A timber-handling specialist, the MHL450 was designed to pull heavily loaded trailers while maintaining efficient log handling. It combines traction, reach and hydraulic capability for intensive forestry platforms.",
    },
    features: {
      fr: [
        "Conçue pour tracter des remorques lourdement chargées",
        "Moteur de 180 kW pour une forte capacité de traction",
        "Chargement et déchargement efficaces des grumes",
      ],
      en: [
        "Designed to pull heavily loaded trailers",
        "180 kW engine for strong tractive effort",
        "Efficient loading and unloading of logs",
      ],
    },
  },
};

const rawProducts = (rawFuchsData.products || []) as RawFuchsProduct[];

function toSiteSlug(rawSlug: string) {
  return FUCHS_SLUG_MAP[rawSlug] || rawSlug;
}

function toImagePath(siteSlug: string, localPath: string) {
  const fileName = localPath.split("/").pop() || localPath;
  return `/images/products/${siteSlug}/${fileName}`;
}

export const fuchsProductDetails: Record<string, ProductDetail> = rawProducts.reduce<Record<string, ProductDetail>>(
  (acc, product) => {
    const slug = toSiteSlug(product.slug);
    const copy = FUCHS_COPY[slug];

    if (!copy) {
      return acc;
    }

    acc[slug] = {
      id: slug,
      name: FUCHS_NAME_OVERRIDES[slug] || product.title,
      brand: "Terex Fuchs",
      description: copy.description,
      features: copy.features,
      images: (product.localImages || []).map((image) => ({
        path: toImagePath(slug, image.localPath),
      })),
      specifications: product.specs || {},
      downloads: (product.downloads || []).map((download) => ({
        label: download.label,
        url: download.url,
      })),
    };

    return acc;
  },
  {},
);
