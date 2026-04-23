import terexLogo from "@/assets/brands/terex.png";
import tadanoLogo from "@/assets/brands/tadano-demag.png";
import magniLogo from "@/assets/brands/magni.png";
import mecalacLogo from "@/assets/brands/mecalac.png";
import jlgLogo from "@/assets/brands/jlg.png";

export type BrandCategory = "grues" | "nacelles" | "elevateurs" | "construction";

export type Brand = {
  id: string;
  name: string;
  logo: string;
  website: string;
  categories: BrandCategory[];
  tagline: { fr: string; en: string };
  description: { fr: string; en: string };
};

export const brands: Brand[] = [
  {
    id: "terex",
    name: "Terex Rough Terrain Cranes",
    logo: terexLogo,
    website: "https://www.terex.com/rough-terrain-cranes/fr",
    categories: ["grues"],
    tagline: {
      fr: "Grues tout-terrain",
      en: "Rough terrain cranes",
    },
    description: {
      fr: "Conçues et assemblées chez Terex Italia à Crespellano (Bologne), les grues tout-terrain Terex incarnent l'ingénierie italienne au service des chantiers les plus exigeants — infrastructure, mines, ports, énergie. Vemat Group distribue la gamme Terex RT au Maroc et en Afrique de l'Ouest, avec support technique, formation opérateurs et pièces d'origine.",
      en: "Designed and assembled at Terex Italia in Crespellano (Bologna), Terex rough terrain cranes embody Italian engineering for the most demanding jobsites — infrastructure, mining, ports, energy. Vemat Group distributes the Terex RT range in Morocco and West Africa, with technical support, operator training and original parts.",
    },
  },
  {
    id: "tadano",
    name: "Tadano / Demag",
    logo: tadanoLogo,
    website: "https://www.tadano.com/espana-y-portugal/es/gruas-todo-terreno/",
    categories: ["grues"],
    tagline: {
      fr: "Grues mobiles tout-terrain — Référence mondiale",
      en: "All-terrain mobile cranes — Global reference",
    },
    description: {
      fr: "Tadano, qui a intégré la marque Demag, est l'un des trois plus grands constructeurs mondiaux de grues mobiles. La gamme AC tout-terrain couvre des capacités de 40 à 500 tonnes avec des longueurs de flèche jusqu'à 80 mètres. Vemat Group accompagne ses clients africains dans le choix, la mise en service et la maintenance de ces machines stratégiques pour les grands projets d'infrastructure.",
      en: "Tadano, which has integrated the Demag brand, is one of the world's three largest mobile crane manufacturers. The AC all-terrain range covers capacities from 40 to 500 tons with boom lengths up to 80 meters. Vemat Group supports its African clients in the selection, commissioning and maintenance of these strategic machines for major infrastructure projects.",
    },
  },
  {
    id: "magni",
    name: "Magni Telescopic Handlers",
    logo: magniLogo,
    website: "https://www.magnith.com/fr/",
    categories: ["elevateurs"],
    tagline: {
      fr: "Élévateurs télescopiques rotatifs italiens",
      en: "Italian rotating telehandlers",
    },
    description: {
      fr: "Spécialiste italien des chariots télescopiques rotatifs (RTH), fixes (TH) et grandes capacités (HTH), Magni équipe les chantiers les plus exigeants avec des machines pouvant lever jusqu'à 51 tonnes et atteindre 51 mètres de hauteur. Vemat Group représente Magni au Maroc et dans plusieurs pays d'Afrique de l'Ouest et centrale.",
      en: "Italian specialist in rotating (RTH), fixed (TH) and high-capacity (HTH) telehandlers, Magni equips the most demanding jobsites with machines capable of lifting up to 51 tons and reaching 51 meters in height. Vemat Group represents Magni in Morocco and in several countries in West and Central Africa.",
    },
  },
  {
    id: "mecalac",
    name: "Mecalac",
    logo: mecalacLogo,
    website: "https://mecalac.com/fr/",
    categories: ["construction"],
    tagline: {
      fr: "Engins compacts urbains et de chantier",
      en: "Compact urban and construction equipment",
    },
    description: {
      fr: "Constructeur français reconnu pour ses pelles, chargeuses, chargeuses-pelleteuses, dumpers (Tombereaux séries TA, MDX, eMDX, Revotruck) et compacteurs à rouleaux (TV900, TV1000, MBR71). Mecalac conçoit des machines polyvalentes optimisées pour les environnements urbains et les chantiers de génie civil. Vemat Group est partenaire distributeur officiel.",
      en: "French manufacturer renowned for its excavators, loaders, backhoe loaders, dumpers (TA, MDX, eMDX, Revotruck series) and roller compactors (TV900, TV1000, MBR71). Mecalac designs versatile machines optimized for urban environments and civil engineering jobsites. Vemat Group is an official distribution partner.",
    },
  },
  {
    id: "jlg",
    name: "JLG Industries",
    logo: jlgLogo,
    website: "https://www.jlg.com/en",
    categories: ["nacelles"],
    tagline: {
      fr: "Plateformes élévatrices de personnel",
      en: "Aerial work platforms",
    },
    description: {
      fr: "Leader mondial des nacelles élévatrices, JLG conçoit des plateformes à flèche (motorisées, électriques, hybrides), des nacelles ciseaux, des plateformes verticales basses et des préparateurs de commandes mobiles (Stock Pickers). Vemat Group distribue la gamme complète JLG pour la maintenance industrielle, le BTP et la logistique.",
      en: "Global leader in aerial work platforms, JLG designs boom lifts (powered, electric, hybrid), scissor lifts, low-level vertical platforms and mobile order pickers (Stock Pickers). Vemat Group distributes the complete JLG range for industrial maintenance, construction and logistics.",
    },
  },
];

export function brandsForCategory(cat: BrandCategory): Brand[] {
  return brands.filter((b) => b.categories.includes(cat));
}
