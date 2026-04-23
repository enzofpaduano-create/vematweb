import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { HeroSection } from "@/components/HeroSection";
import { SubCategoryCard } from "@/components/SubCategoryCard";
import { CTASection } from "@/components/CTASection";
import { SectionHeader } from "@/components/SectionHeader";
import { BrandCard } from "@/components/BrandCard";
import { CheckCircle2 } from "lucide-react";
import { useLang } from "@/i18n/I18nProvider";
import { brandsForCategory } from "@/data/brands";
import img from "@/assets/images/grues.png";

export default function Grues() {
  const { t, tArray } = useLang();
  useSEO(t("seo.grues.title"), t("seo.grues.desc"));
  useScrollTop();
  const partners = brandsForCategory("grues");

  return (
    <div className="min-h-screen pt-20">
      <HeroSection
        title={t("categories.grues.title")}
        subtitle={t("categories.grues.description")}
        image={img}
        primaryCta={{ label: t("nav.devis"), href: "/contact" }}
      />

      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader title={t("grues.sectionTitle")} subtitle={t("grues.sectionSub")} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tArray("subcategories.grues").map((sub, index) => (
              <SubCategoryCard key={index} index={index} title={sub} />
            ))}
          </div>
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
