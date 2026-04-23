import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { SectionHeader } from "@/components/SectionHeader";
import { CTASection } from "@/components/CTASection";
import { BrandCard } from "@/components/BrandCard";
import { useLang } from "@/i18n/I18nProvider";
import { brands } from "@/data/brands";
import img from "@/assets/images/african-presence.png";

export default function APropos() {
  const { t, tArray } = useLang();
  useSEO(t("seo.apropos.title"), t("seo.apropos.desc"));
  useScrollTop();

  return (
    <div className="min-h-screen pt-32">
      <div className="container mx-auto px-4 md:px-6 mb-24">
        <SectionHeader title={t("apropos.title")} subtitle={t("apropos.sub")} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-16">
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-heading font-bold mb-4 text-zinc-950">{t("apropos.missionTitle")}</h3>
              <p className="text-zinc-700 leading-relaxed text-lg">{t("apropos.missionText")}</p>
            </div>
            <div>
              <h3 className="text-2xl font-heading font-bold mb-4 text-zinc-950">{t("apropos.visionTitle")}</h3>
              <p className="text-zinc-700 leading-relaxed text-lg">{t("apropos.visionText")}</p>
            </div>
            <div>
              <h3 className="text-2xl font-heading font-bold mb-4 text-zinc-950">{t("apropos.valuesTitle")}</h3>
              <ul className="list-disc list-inside text-zinc-700 leading-relaxed text-lg space-y-2 ml-4">
                {tArray("apropos.values").map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="h-[600px] relative overflow-hidden shadow-2xl">
            <img src={img} className="w-full h-full object-cover" alt="" />
          </div>
        </div>
      </div>

      <div className="py-24 bg-zinc-950 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl mb-16">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-8">{t("apropos.networkTitle")}</h2>
          <p className="text-xl text-zinc-400 leading-relaxed">{t("apropos.networkText")}</p>
        </div>

        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-white mb-4">{t("brands.partnersTitle")}</h3>
            <p className="text-zinc-400 max-w-2xl mx-auto">{t("brands.partnersSub")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {brands.map((b, i) => (
              <BrandCard key={b.id} brand={b} index={i} />
            ))}
          </div>
        </div>
      </div>

      <CTASection
        title={t("apropos.ctaTitle")}
        description={t("apropos.ctaDesc")}
        primaryCta={{ label: t("apropos.ctaBtn"), href: "/contact" }}
        background="accent"
      />
    </div>
  );
}
