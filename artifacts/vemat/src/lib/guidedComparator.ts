import { catalog, type CategorySlug, type SubCategory } from "@/data/products";
import { productDetails } from "@/data/productDetails";
import type { Lang } from "@/i18n/translations";

export type GuidedSource = {
  type: "product";
  title: string;
  url: string;
  subtitle?: string;
  snippet?: string;
};

export type GuidedJobType = "lifting" | "access" | "handling";
export type GuidedBand = "low" | "medium" | "high";

export type GuidedAnswers = {
  jobType?: GuidedJobType;
  capacity?: GuidedBand;
  height?: GuidedBand;
};

export type GuidedOption = {
  value: string;
  label: string;
};

export type GuidedStep = {
  key: "jobType" | "capacity" | "height";
  question: string;
  options: GuidedOption[];
};

type Candidate = {
  slug: string;
  title: string;
  subtitle: string;
  snippet: string;
  category: CategorySlug;
  capacity?: number;
  height?: number;
  score: number;
};

const jobTypeConfig = {
  lifting: {
    category: "grues" as const,
    labels: {
      fr: "Levage lourd / grue",
      en: "Heavy lifting / crane",
    },
  },
  access: {
    category: "nacelles" as const,
    labels: {
      fr: "Travail en hauteur",
      en: "Work at height",
    },
  },
  handling: {
    category: "elevateurs" as const,
    labels: {
      fr: "Manutention / téléhandler",
      en: "Material handling / telehandler",
    },
  },
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function localize(value: string | { fr: string; en: string } | undefined, lang: Lang) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.fr || value.en || "";
}

function parseNumbers(value: string) {
  return [...value.matchAll(/(\d+(?:[.,]\d+)?)/g)].map((match) =>
    Number(match[1].replace(",", ".")),
  );
}

function convertHeight(value: string, raw: number) {
  const normalized = normalizeText(value);

  if (/\bft\b|feet|foot|platform height|working height/.test(normalized)) {
    return raw * 0.3048;
  }

  return raw;
}

function convertCapacity(value: string, raw: number, category: CategorySlug) {
  const normalized = normalizeText(value);

  if (category === "nacelles") {
    if (/\blb\b/.test(normalized)) return raw * 0.453592;
    return raw;
  }

  if (/\bkg\b/.test(normalized) && !/\bt\b|ton/.test(normalized)) {
    return raw / 1000;
  }

  if (/\blb\b/.test(normalized)) {
    return raw * 0.000453592;
  }

  return raw;
}

function extractMetric(
  specifications: Record<string, string | { fr: string; en: string }> | undefined,
  category: CategorySlug,
  metric: "capacity" | "height",
) {
  if (!specifications) return undefined;

  const matches: number[] = [];

  for (const [rawKey, rawValue] of Object.entries(specifications)) {
    const key = normalizeText(rawKey);
    const value = `${localize(rawValue, "fr")} ${localize(rawValue, "en")}`.trim();
    const numbers = parseNumbers(value);

    if (!numbers.length) continue;

    const isCapacityKey =
      /capac|charge|load|platforme|plateforme/.test(key) ||
      (category === "nacelles" && /occupant/.test(key));
    const isHeightKey =
      /hauteur|height|working|platform|boom|fleche|reach|levage/.test(key);

    if (metric === "capacity" && isCapacityKey) {
      matches.push(...numbers.map((number) => convertCapacity(value, number, category)));
    }

    if (metric === "height" && isHeightKey) {
      matches.push(...numbers.map((number) => convertHeight(value, number)));
    }
  }

  if (!matches.length) return undefined;

  return Math.max(...matches);
}

function bandScore(value: number | undefined, band: GuidedBand, category: CategorySlug, metric: "capacity" | "height") {
  if (value == null) return 0;

  const thresholds =
    category === "grues"
      ? metric === "capacity"
        ? { low: 80, medium: 200 }
        : { low: 50, medium: 80 }
      : category === "elevateurs"
        ? metric === "capacity"
          ? { low: 6, medium: 15 }
          : { low: 10, medium: 18 }
        : metric === "capacity"
          ? { low: 250, medium: 450 }
          : { low: 20, medium: 40 };

  const currentBand =
    value <= thresholds.low ? "low" : value <= thresholds.medium ? "medium" : "high";

  return currentBand === band ? 3 : 0;
}

function flattenSubcategories(category: CategorySlug) {
  return catalog[category].flatMap((subcategory: SubCategory) =>
    subcategory.models
      .filter((model) => model.slug)
      .map((model) => ({
        slug: model.slug as string,
        brand: model.brand,
        name: model.name,
        subcategory,
      })),
  );
}

function getCandidates(jobType: GuidedJobType, lang: Lang) {
  const category = jobTypeConfig[jobType].category;

  return flattenSubcategories(category)
    .map((item) => {
      const product = productDetails[item.slug];
      if (!product) return null;

      return {
        slug: item.slug,
        title: `${item.brand} ${item.name}`,
        subtitle: localize(item.subcategory.title, lang),
        snippet: localize(product.description, lang),
        category,
        capacity: extractMetric(product.specifications, category, "capacity"),
        height: extractMetric(product.specifications, category, "height"),
      };
    })
    .filter(Boolean) as Array<Omit<Candidate, "score">>;
}

export function getGuidedComparatorStep(lang: Lang, answers: GuidedAnswers): GuidedStep | null {
  if (!answers.jobType) {
    return {
      key: "jobType",
      question:
        lang === "fr"
          ? "Quel type de chantier ou de besoin avez-vous ?"
          : "What type of jobsite or need do you have?",
      options: (Object.keys(jobTypeConfig) as GuidedJobType[]).map((value) => ({
        value,
        label: jobTypeConfig[value].labels[lang],
      })),
    };
  }

  if (!answers.capacity) {
    const options =
      answers.jobType === "lifting"
        ? [
            { value: "low", label: lang === "fr" ? "Jusqu’à 80 t" : "Up to 80 t" },
            { value: "medium", label: lang === "fr" ? "80 à 200 t" : "80 to 200 t" },
            { value: "high", label: lang === "fr" ? "200 t et +" : "200 t and above" },
          ]
        : answers.jobType === "handling"
          ? [
              { value: "low", label: lang === "fr" ? "Jusqu’à 6 t" : "Up to 6 t" },
              { value: "medium", label: lang === "fr" ? "6 à 15 t" : "6 to 15 t" },
              { value: "high", label: lang === "fr" ? "15 t et +" : "15 t and above" },
            ]
          : [
              { value: "low", label: lang === "fr" ? "Jusqu’à 250 kg" : "Up to 250 kg" },
              { value: "medium", label: lang === "fr" ? "250 à 450 kg" : "250 to 450 kg" },
              { value: "high", label: lang === "fr" ? "450 kg et +" : "450 kg and above" },
            ];

    return {
      key: "capacity",
      question:
        lang === "fr"
          ? "Quelle capacité vous faut-il ?"
          : "What capacity do you need?",
      options,
    };
  }

  if (!answers.height) {
    const options =
      answers.jobType === "lifting"
        ? [
            { value: "low", label: lang === "fr" ? "Jusqu’à 50 m" : "Up to 50 m" },
            { value: "medium", label: lang === "fr" ? "50 à 80 m" : "50 to 80 m" },
            { value: "high", label: lang === "fr" ? "80 m et +" : "80 m and above" },
          ]
        : answers.jobType === "handling"
          ? [
              { value: "low", label: lang === "fr" ? "Jusqu’à 10 m" : "Up to 10 m" },
              { value: "medium", label: lang === "fr" ? "10 à 18 m" : "10 to 18 m" },
              { value: "high", label: lang === "fr" ? "18 m et +" : "18 m and above" },
            ]
          : [
              { value: "low", label: lang === "fr" ? "Jusqu’à 20 m" : "Up to 20 m" },
              { value: "medium", label: lang === "fr" ? "20 à 40 m" : "20 to 40 m" },
              { value: "high", label: lang === "fr" ? "40 m et +" : "40 m and above" },
            ];

    return {
      key: "height",
      question:
        lang === "fr"
          ? "Quelle hauteur de travail ou de levage visez-vous ?"
          : "What working or lifting height are you targeting?",
      options,
    };
  }

  return null;
}

export function buildGuidedComparatorResult(lang: Lang, answers: GuidedAnswers) {
  if (!answers.jobType || !answers.capacity || !answers.height) {
    return null;
  }

  const candidates = getCandidates(answers.jobType, lang)
    .map((candidate) => ({
      ...candidate,
      score:
        bandScore(candidate.capacity, answers.capacity!, candidate.category, "capacity") +
        bandScore(candidate.height, answers.height!, candidate.category, "height"),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  if (!candidates.length) return null;

  const intro =
    lang === "fr"
      ? "Sur la base de votre besoin, voici les modèles Vemat que je recommanderais en priorité :"
      : "Based on your needs, these are the Vemat models I would recommend first:";

  const lines = candidates
    .map((candidate, index) => {
      const reason =
        lang === "fr"
          ? `${candidate.subtitle}. ${candidate.snippet}`
          : `${candidate.subtitle}. ${candidate.snippet}`;

      return `${index + 1}. **${candidate.title}**\n${reason}\n${candidate.url}`;
    })
    .join("\n\n");

  const closing =
    lang === "fr"
      ? "Si vous voulez, je peux maintenant affiner encore selon la marque, le budget ou le contexte chantier."
      : "If you want, I can now refine this further by brand, budget, or jobsite context.";

  return {
    message: `${intro}\n\n${lines}\n\n${closing}`,
    sources: candidates.map((candidate) => ({
      type: "product" as const,
      title: candidate.title,
      subtitle: candidate.subtitle,
      url: candidate.url,
      snippet: candidate.snippet,
    })),
  };
}
