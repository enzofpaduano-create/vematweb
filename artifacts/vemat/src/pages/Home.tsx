import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Globe, ShieldCheck, Clock, Settings, Wrench, HardHat } from "lucide-react";
import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { HeroSection } from "@/components/HeroSection";
import { CategoryCard } from "@/components/CategoryCard";
import { ServiceCard } from "@/components/ServiceCard";
import { BrandStrip } from "@/components/BrandStrip";
import { CTASection } from "@/components/CTASection";
import { SectionHeader } from "@/components/SectionHeader";
import { StatBlock } from "@/components/StatBlock";
import { categories } from "@/data/categories";
import { services } from "@/data/services";

import heroImg from "@/assets/images/hero-cinematic.png";
import africanImg from "@/assets/images/african-presence.png";

export default function Home() {
  useSEO("Accueil", "Vemat Group - Distributeur majeur d'équipements industriels et de levage au Maroc et en Afrique. Grues, nacelles, élévateurs télescopiques.");
  useScrollTop();

  return (
    <div className="min-h-screen">
      <HeroSection
        title="La puissance au service de vos grands projets"
        subtitle="Distributeur exclusif des leaders mondiaux de l'équipement de levage, de manutention et de construction en Afrique."
        image={heroImg}
        primaryCta={{ label: "Découvrir nos équipements", href: "/grues" }}
        secondaryCta={{ label: "Contacter un expert", href: "/contact" }}
      />

      {/* Stats Section */}
      <section className="py-16 bg-zinc-950 border-t border-zinc-800">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatBlock value="25+" label="Pays desservis" delay={0} />
            <StatBlock value="150+" label="Projets majeurs" delay={0.1} />
            <StatBlock value="24/7" label="Service client" delay={0.2} />
            <StatBlock value="5" label="Marques mondiales" delay={0.3} />
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-24 bg-zinc-50">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            title="Nos Équipements"
            subtitle="Une flotte complète pour répondre aux exigences des chantiers les plus complexes."
            alignment="center"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.map((category, index) => (
              <CategoryCard
                key={category.slug}
                index={index}
                title={category.title}
                description={category.description}
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
                title="Expertise globale 360°"
                subtitle="De l'acquisition à la maintenance, nous vous accompagnons tout au long du cycle de vie de vos équipements pour garantir leur performance maximale."
              />
              <Link href="/services" className="inline-flex items-center text-accent font-bold hover:text-accent/80 transition-colors">
                <span>Voir tous nos services</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {services.slice(0, 4).map((service, index) => (
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
            alt="Présence en Afrique"
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
                Ancrage marocain, <span className="text-accent">rayonnement panafricain</span>.
              </h2>
              <p className="text-xl text-zinc-300 mb-10 leading-relaxed">
                Fort de notre base stratégique au Maroc, nous déployons notre expertise technique et notre logistique à travers tout le continent africain pour soutenir les acteurs du BTP, de l'industrie et de l'énergie.
              </p>
              <Link href="/a-propos">
                <button className="bg-white text-zinc-950 font-bold px-8 py-4 uppercase tracking-wide text-sm hover:bg-accent hover:text-white transition-colors">
                  Découvrir notre vision
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Vemat */}
      <section className="py-24 bg-zinc-50">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            title="Pourquoi choisir Vemat Group ?"
            alignment="center"
          />
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
              <h3 className="text-xl font-heading font-bold mb-4">Réseau International</h3>
              <p className="text-zinc-600">Partenariats solides avec les constructeurs les plus exigeants pour vous garantir une qualité sans compromis.</p>
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
              <h3 className="text-xl font-heading font-bold mb-4">Expertise Terrain</h3>
              <p className="text-zinc-600">Des ingénieurs et techniciens formés directement par les constructeurs, capables d'intervenir dans les conditions les plus extrêmes.</p>
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
              <h3 className="text-xl font-heading font-bold mb-4">Fiabilité Absolue</h3>
              <p className="text-zinc-600">Des processus stricts, un engagement sur la sécurité et la fourniture exclusive de pièces d'origine certifiées.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <CTASection
        title="Prêt à équiper votre prochain projet ?"
        description="Nos experts sont à votre disposition pour analyser vos besoins et vous proposer des solutions sur mesure."
        primaryCta={{ label: "Demander un devis", href: "/contact" }}
        secondaryCta={{ label: "Voir notre catalogue", href: "/grues" }}
        background="accent"
      />
    </div>
  );
}
