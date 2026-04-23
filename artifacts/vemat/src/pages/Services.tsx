import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { ServiceCard } from "@/components/ServiceCard";
import { CTASection } from "@/components/CTASection";
import { SectionHeader } from "@/components/SectionHeader";
import { useLang } from "@/i18n/I18nProvider";

export default function Services() {
  const { t } = useLang();
  useSEO(t("seo.services.title"), t("seo.services.desc"));
  useScrollTop();

  const services = [0, 1, 2, 3, 4, 5].map((i) => ({
    title: t(`services.list.${i}.title`),
    description: t(`services.list.${i}.description`),
  }));

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeader
          title={t("services.pageTitle")}
          subtitle={t("services.pageSub")}
          alignment="center"
          className="max-w-4xl mx-auto mb-20"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              index={index}
              title={service.title}
              description={service.description}
            />
          ))}
        </div>
      </div>

      <CTASection
        title={t("services.ctaTitle")}
        description={t("services.ctaDesc")}
        primaryCta={{ label: t("services.ctaBtn"), href: "/contact" }}
        background="dark"
      />
    </div>
  );
}
