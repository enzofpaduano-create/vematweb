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
import img from "@/assets/images/nacelles.jpg";

const NACELLE_CATEGORIES = [
  {
    slug: "nacelles-fleche-motorisees",
    title: { fr: "Nacelles à flèche\nmotorisées", en: "Engine-Powered\nBoom Lifts" },
    brand: "JLG",
    image: "/images/products/800aj/01-4f4de13f2dc5.jpg",
  },
  {
    slug: "nacelles-fleche-electriques-hybrides",
    title: { fr: "Nacelles électriques\n& hybrides", en: "Electric & Hybrid\nBoom Lifts" },
    brand: "JLG",
    image: "/images/products/h600sj/01-b842b34721c0.jpg",
  },
  {
    slug: "acces-bas-niveau",
    title: { fr: "Accès bas niveau", en: "Low-Level Access" },
    brand: "JLG",
    image: "/images/products/830p/01-77b053bd3ab3.jpg",
  },
  {
    slug: "mats-verticaux",
    title: { fr: "Mâts verticaux", en: "Vertical Mast Lifts" },
    brand: "JLG",
    image: "/images/products/25am/01-3808aed3e151.jpg",
  },
  {
    slug: "nacelles-a-ciseaux",
    title: { fr: "Nacelles à ciseaux", en: "Scissor Lifts" },
    brand: "JLG",
    image: "/images/products/ae1932/01-6238dda417f2.jpg",
  },
  {
    slug: "nacelles-chenilles-compactes",
    title: { fr: "Chenilles compactes", en: "Compact Crawler Lifts" },
    brand: "JLG",
    image: "/images/products/x430aj/01-53dacff621e8.jpg",
  },
] as const;

export default function Nacelles() {
  const { t, tArray, lang } = useLang();
  useSEO(t("seo.nacelles.title"), t("seo.nacelles.desc"));
  useScrollTop();
  const partners = brandsForCategory("nacelles");

  const handleCategoryClick = (slug: string) => {
    const el = document.getElementById(slug);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen pt-20">
      <HeroSection
        title={t("categories.nacelles.title")}
        subtitle={t("categories.nacelles.description")}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {NACELLE_CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategoryClick(cat.slug)}
                className="group relative h-44 md:h-52 overflow-hidden rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <img
                  src={cat.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-zinc-950/10 transition-opacity duration-300 group-hover:from-zinc-950/80" />
                <div className="absolute inset-0 ring-1 ring-white/10 rounded-2xl group-hover:ring-accent/60 transition-all duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-accent mb-1">
                    {cat.brand}
                  </span>
                  <h3 className="text-white text-xs font-extrabold leading-snug whitespace-pre-line">
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
          <ProductBrowser initialSubcategories={catalog.nacelles} categoryType="nacelles" />
        </div>
      </section>

      <section className="py-24 bg-zinc-50 border-t border-zinc-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 h-[500px] bg-zinc-200 relative overflow-hidden shadow-2xl">
              <img src={img} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="order-1 lg:order-2">
              <SectionHeader title={t("nacelles.perfTitle")} />
              <div className="space-y-6">
                {tArray("nacelles.benefits").map((benefit, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-accent shrink-0" />
                    <p className="text-zinc-700 text-lg">{benefit}</p>
                  </div>
                ))}
              </div>
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
        title={t("nacelles.ctaTitle")}
        description={t("nacelles.ctaDesc")}
        primaryCta={{ label: t("nacelles.ctaBtn"), href: "/contact" }}
      />
    </div>
  );
}
