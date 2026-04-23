import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Globe, ShieldCheck, HardHat } from "lucide-react";
import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { HeroSection } from "@/components/HeroSection";
import { CategoryCard } from "@/components/CategoryCard";
import { ServiceCard } from "@/components/ServiceCard";
import { BrandStrip } from "@/components/BrandStrip";
import { CTASection } from "@/components/CTASection";
import { SectionHeader } from "@/components/SectionHeader";
import { StatBlock } from "@/components/StatBlock";
import { categories } from "@/data/categories";
import { useLang } from "@/i18n/I18nProvider";

import heroImg from "@/assets/images/hero-cinematic.png";
import africanImg from "@/assets/images/african-presence.png";

export default function Home() {
  const { t } = useLang();
  useSEO(t("seo.home.title"), t("seo.home.desc"));
  useScrollTop();

  const services = (
    [0, 1, 2, 3].map((i) => ({
      title: t(`services.list.${i}.title`),
      description: t(`services.list.${i}.description`),
    }))
  );

  return (
    <div className="min-h-screen">
      <HeroSection
        title={t("home.heroTitle")}
        subtitle={t("home.heroSubtitle")}
        image={heroImg}
        primaryCta={{ label: t("home.heroPrimary"), href: "/grues" }}
        secondaryCta={{ label: t("home.heroSecondary"), href: "/contact" }}
      />

      {/* Stats Section */}
      <section className="py-16 bg-zinc-950 border-t border-zinc-800">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatBlock value="25+" label={t("home.statCountries")} delay={0} />
            <StatBlock value="150+" label={t("home.statProjects")} delay={0.1} />
            <StatBlock value="24/7" label={t("home.statSupport")} delay={0.2} />
            <StatBlock value="5" label={t("home.statBrands")} delay={0.3} />
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-24 bg-zinc-50">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            title={t("home.equipmentTitle")}
            subtitle={t("home.equipmentSubtitle")}
            alignment="center"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.map((category, index) => (
              <CategoryCard
                key={category.slug}
                index={index}
                title={t(`categories.${category.tKey}.title`)}
                description={t(`categories.${category.tKey}.description`)}
                image={category.image}
                href={category.href}
              />
            ))}
          </div>
        </div>
      </section>

      <BrandStrip />

      {/* Value Props / Services */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-1">
              <SectionHeader
                title={t("home.expertiseTitle")}
                subtitle={t("home.expertiseSubtitle")}
              />
              <Link href="/services" className="inline-flex items-center text-accent font-bold hover:text-accent/80 transition-colors">
                <span>{t("home.viewServices")}</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
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
        </div>
      </section>

      {/* African Presence */}
      <section className="relative py-32 bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={africanImg}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6 leading-tight">
                {t("home.africaTitle")} <span className="text-accent">{t("home.africaTitleAccent")}</span>.
              </h2>
              <p className="text-xl text-zinc-300 mb-10 leading-relaxed">
                {t("home.africaSubtitle")}
              </p>
              <Link href="/a-propos">
                <button className="bg-white text-zinc-950 font-bold px-8 py-4 uppercase tracking-wide text-sm hover:bg-accent hover:text-white transition-colors">
                  {t("home.africaCta")}
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Vemat */}
      <section className="py-24 bg-zinc-50">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader title={t("home.whyTitle")} alignment="center" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6 text-accent">
                <Globe className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-4">{t("home.whyNetworkTitle")}</h3>
              <p className="text-zinc-600">{t("home.whyNetworkText")}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6 text-accent">
                <HardHat className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-4">{t("home.whyExpertTitle")}</h3>
              <p className="text-zinc-600">{t("home.whyExpertText")}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6 text-accent">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-4">{t("home.whyTrustTitle")}</h3>
              <p className="text-zinc-600">{t("home.whyTrustText")}</p>
            </motion.div>
          </div>
        </div>
      </section>

      <CTASection
        title={t("home.ctaTitle")}
        description={t("home.ctaDesc")}
        primaryCta={{ label: t("home.ctaPrimary"), href: "/contact" }}
        secondaryCta={{ label: t("home.ctaSecondary"), href: "/grues" }}
        background="accent"
      />
    </div>
  );
}
