import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { HeroSection } from "@/components/HeroSection";
import { ProductCatalog } from "@/components/ProductCatalog";
import { CTASection } from "@/components/CTASection";
import { SectionHeader } from "@/components/SectionHeader";
import { BrandCard } from "@/components/BrandCard";
import { CheckCircle2 } from "lucide-react";
import { useLang } from "@/i18n/I18nProvider";
import { brandsForCategory } from "@/data/brands";
import { catalog } from "@/data/products";
import img from "@/assets/images/nacelles.png";

export default function Nacelles() {
  const { t, tArray } = useLang();
  useSEO(t("seo.nacelles.title"), t("seo.nacelles.desc"));
  useScrollTop();
  const partners = brandsForCategory("nacelles");

  return (
    <div className="min-h-screen pt-20">
      <HeroSection
        title={t("categories.nacelles.title")}
        subtitle={t("categories.nacelles.description")}
        image={img}
        primaryCta={{ label: t("nav.devis"), href: "/contact" }}
      />

      <section className="py-24 bg-zinc-50">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader title={t("catalog.title")} subtitle={t("catalog.subtitle")} />
          <ProductCatalog subcategories={catalog.nacelles} />
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
