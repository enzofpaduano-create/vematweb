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
import img from "@/assets/images/construction.jpg";

const CONSTRUCTION_CATEGORIES = [
  {
    slug: "chargeuses",
    title: { fr: "Chargeuses", en: "Loaders" },
    brand: "Mecalac",
    image: "/images/products/mcl6/01-03ea3d0a2e3d.png",
  },
  {
    slug: "chargeuses-pelleteuses",
    title: { fr: "Chargeuses-\npelleteuses", en: "Backhoe Loaders" },
    brand: "Mecalac",
    image: "/images/products/tlb870/01-704d0695e7aa.png",
  },
  {
    slug: "dumpers",
    title: { fr: "Dumpers\n(Tombereaux)", en: "Site Dumpers" },
    brand: "Mecalac",
    image: "/images/products/3-5mdx/01-2eaaf5dc0de9.png",
  },
  {
    slug: "pelles",
    title: { fr: "Pelles", en: "Excavators" },
    brand: "Mecalac",
    image: "/images/products/12mtx/01-75e5259ff135.png",
  },
  {
    slug: "pelles-de-manutention",
    title: { fr: "Pelles de\nmanutention", en: "Material Handlers" },
    brand: "Terex Fuchs",
    image: "/images/products/mhl340/01-bf538a039537.jpg",
  },
] as const;

export default function Construction() {
  const { t, tArray, lang } = useLang();
  useSEO(t("seo.construction.title"), t("seo.construction.desc"));
  useScrollTop();
  const partners = brandsForCategory("construction");

  const handleCategoryClick = (slug: string) => {
    const el = document.getElementById(slug);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen pt-20">
      <HeroSection
        title={t("categories.construction.title")}
        subtitle={t("categories.construction.description")}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {CONSTRUCTION_CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategoryClick(cat.slug)}
                className="group relative h-44 md:h-56 overflow-hidden rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
                  <h3 className="text-white text-xs md:text-sm font-extrabold leading-snug whitespace-pre-line">
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
          <ProductBrowser initialSubcategories={catalog.construction} categoryType="construction" />
        </div>
      </section>

      <section className="py-24 bg-zinc-50 border-t border-zinc-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 h-[500px] bg-zinc-200 relative overflow-hidden shadow-2xl">
              <img src={img} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="order-1 lg:order-2">
              <SectionHeader title={t("construction.perfTitle")} />
              <div className="space-y-6">
                {tArray("construction.benefits").map((benefit, i) => (
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
        title={t("construction.ctaTitle")}
        description={t("construction.ctaDesc")}
        primaryCta={{ label: t("construction.ctaBtn"), href: "/contact" }}
      />
    </div>
  );
}
