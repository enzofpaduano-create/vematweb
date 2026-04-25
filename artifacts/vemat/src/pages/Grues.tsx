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
import img from "@/assets/images/grues.jpg";

const CRANE_CATEGORIES = [
  {
    slug: "grues-automotrices-lentes",
    title: { fr: "Automotrices lentes\n(Rough Terrain)", en: "Rough Terrain\nCranes" },
    brand: "Terex",
    image: "/images/products/trt-35/01-02a98a378dcf.jpg",
  },
  {
    slug: "grues-automotrices-lentes-tadano",
    title: { fr: "Automotrices lentes\n(Tadano)", en: "Tadano Rough\nTerrain Cranes" },
    brand: "Tadano",
    image: "/images/products/gr-800ex/01-46d1ec3f2f33.jpg",
  },
  {
    slug: "grues-tout-terrain",
    title: { fr: "Tout-terrain", en: "All Terrain\nCranes" },
    brand: "Tadano",
    image: "/images/products/ac-5-220-1/01-f47b2548bb60.png",
  },
  {
    slug: "grues-sur-chenilles-fleche-telescopique",
    title: { fr: "Chenilles flèche\ntélescopique", en: "Telescopic Boom\nCrawler Cranes" },
    brand: "Tadano",
    image: "/images/products/gtc-2000/01-6a794cdf533a.png",
  },
  {
    slug: "grues-sur-chenilles-mat-treillis",
    title: { fr: "Chenilles mât\ntreillis", en: "Lattice Boom\nCrawler Cranes" },
    brand: "Tadano Demag",
    image: "/images/products/cc-38-650-1/01-7fe741f49a69.png",
  },
  {
    slug: "grues-city",
    title: { fr: "City Cranes", en: "City Cranes" },
    brand: "Tadano",
    image: "/images/products/ac-3-045-1-city/01-2e2baa8288ac.png",
  },
  {
    slug: "grues-sur-porteur",
    title: { fr: "Sur porteur", en: "Truck Cranes" },
    brand: "Tadano",
    image: "/images/products/gt-600el-3/01-be32360a3539.jpg",
  },
  {
    slug: "grues-a-tour",
    title: { fr: "Grues à tour", en: "Tower Cranes" },
    brand: "Terex",
    image: "/images/products/ctt-292-12/01-2e2c39a28a70.jpg",
  },
] as const;

export default function Grues() {
  const { t, tArray, lang } = useLang();
  useSEO(t("seo.grues.title"), t("seo.grues.desc"));
  useScrollTop();
  const partners = brandsForCategory("grues");

  const handleCategoryClick = (slug: string) => {
    const el = document.getElementById(slug);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen pt-20">
      <HeroSection
        title={t("categories.grues.title")}
        subtitle={t("categories.grues.description")}
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            {CRANE_CATEGORIES.map((cat) => (
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
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-accent mb-1.5">
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
          <ProductBrowser initialSubcategories={catalog.grues} categoryType="grues" />
        </div>
      </section>

      <section className="py-24 bg-zinc-50 border-t border-zinc-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionHeader title={t("grues.perfTitle")} />
              <div className="space-y-6">
                {tArray("grues.benefits").map((benefit, i) => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {partners.map((b, i) => (
                <BrandCard key={b.id} brand={b} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CTASection
        title={t("grues.ctaTitle")}
        description={t("grues.ctaDesc")}
        primaryCta={{ label: t("grues.ctaBtn"), href: "/contact" }}
      />
    </div>
  );
}
