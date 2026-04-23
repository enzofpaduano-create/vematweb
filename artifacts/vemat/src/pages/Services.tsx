import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { ServiceCard } from "@/components/ServiceCard";
import { CTASection } from "@/components/CTASection";
import { SectionHeader } from "@/components/SectionHeader";
import { services } from "@/data/services";

export default function Services() {
  useSEO("Nos Services", "Vente, location, SAV, pièces de rechange et conseils techniques pour vos équipements industriels.");
  useScrollTop();

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeader
          title="Des services industriels de pointe"
          subtitle="Un accompagnement complet pour garantir la continuité et l'efficacité de vos opérations à travers toute l'Afrique."
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
        title="Une urgence technique ?"
        description="Notre service après-vente est mobilisé pour intervenir rapidement sur vos chantiers."
        primaryCta={{ label: "Contacter le SAV", href: "/contact" }}
        background="dark"
      />
    </div>
  );
}
