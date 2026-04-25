import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { HeroSection } from "@/components/HeroSection";
import { ProductBrowser } from "@/components/ProductBrowser";
import { CTASection } from "@/components/CTASection";
import { SectionHeader } from "@/components/SectionHeader";
import { BrandCard } from "@/components/BrandCard";
import { CheckCircle2 } from "lucide-react";
import { useLang } from "@/i18n/I18nProvider";
import { brandsForCategory } from "@/data/brands";
import { catalog } from "@/data/products";
import img from "@/assets/images/telescopiques.jpg";

const ELEVATEUR_CATEGORIES = [
  {
    slug: "th-fixes",
    title: { fr: "TH — Chariots fixes", en: "TH — Fixed\nTelehandlers" },
    brand: "Magni",
    image: "/images/products/th-4-15-s/01-6635f9077e5c.png",
  },
  {
    slug: "hth-heavy-duty",
    title: { fr: "HTH — Grandes\ncapacités", en: "HTH — Heavy-Duty\nTelehandlers" },
    brand: "Magni",
    image: "/images/products/hth-16-10/01-a66bcaddb46f.png",
  },
  {
    slug: "rth-rotatifs",
    title: { fr: "RTH — Rotatifs\n360°", en: "RTH — Rotating\nTelehandlers" },
    brand: "Magni",
    image: "/images/products/rth-8-27/01-fb257bd92f1f.png",
  },
] as const;

export default function ElevateursTelescopiques() {
  const { t, tArray, lang } = useLang();
  useSEO(t("seo.elevateurs.title"), t("seo.elevateurs.desc"));
  useScrollTop();
  const partners = brandsForCategory("elevateurs");

  const handleCategoryClick = (slug: string) => {
    const el = document.getElementById(slug);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen pt-20">
      <HeroSection
        title={t("categories.elevateurs.title")}
        subtitle={t("categories.elevateurs.description")}
        image={img}
        primaryCta={{ label: t("nav.devis"), href: "/contact" }}
      />

      {/* Category Visual Grid */}
      <section className="py-14 bg-white border-b border-zinc-100">
        <div className="container mx-auto px-4 md:px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-8 flex items-center gap-3">
            <span className="block w-8 h-px bg-accent" />
            {lang === "fr" ? "Parcourir par catégorie" : "Browse by category"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {ELEVATEUR_CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategoryClick(cat.slug)}
                className="group relative h-52 md:h-64 overflow-hidden rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <img
                  src={cat.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-zinc-950/10 transition-opacity duration-300 group-hover:from-zinc-950/80" />
                <div className="absolute inset-0 ring-1 ring-white/10 rounded-2xl group-hover:ring-accent/60 transition-all duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-accent mb-1.5">
                    {cat.brand}
                  </span>
                  <h3 className="text-white text-sm font-extrabold leading-snug whitespace-pre-line">
                    {cat.title[lang]}
                  </h3>
                </div>
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 8L8 2M8 2H3M8 2V7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-zinc-50">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader title={t("catalog.title")} subtitle={t("catalog.subtitle")} />
          <ProductBrowser initialSubcategories={catalog.elevateurs} categoryType="elevateurs" />
        </div>
      </section>

      <section className="py-24 bg-zinc-50 border-t border-zinc-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionHeader title={t("elevateurs.perfTitle")} />
              <div className="space-y-6">
                {tArray("elevateurs.benefits").map((benefit, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-accent shrink-0" />
                    <p className="text-zinc-700 text-lg">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-[500px] bg-zinc-200 relative overflow-hidden shadow-2xl">
              <img src={img} className="w-full h-full object-cover" alt="" />
            </div>
          </div>
        </div>
      </section>

      {partners.length > 0 && (
        <section className="py-24 bg-white border-t border-zinc-200">
          <div className="container mx-auto px-4 md:px-6">
            <SectionHeader
              title={partners.length > 1 ? t("brands.forCategoryPlural") : t("brands.forCategory")}
              alignment="center"
            />
            <div className="max-w-2xl mx-auto">
              {partners.map((b, i) => (
                <BrandCard key={b.id} brand={b} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CTASection
        title={t("elevateurs.ctaTitle")}
        description={t("elevateurs.ctaDesc")}
        primaryCta={{ label: t("elevateurs.ctaBtn"), href: "/contact" }}
      />
    </div>
  );
}
