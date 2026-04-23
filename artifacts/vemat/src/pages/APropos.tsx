import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { SectionHeader } from "@/components/SectionHeader";
import { CTASection } from "@/components/CTASection";
import { BrandStrip } from "@/components/BrandStrip";
import img from "@/assets/images/african-presence.png";

export default function APropos() {
  useSEO("À Propos", "Vemat Group, distributeur d'équipements de levage et de construction au Maroc et en Afrique.");
  useScrollTop();

  return (
    <div className="min-h-screen pt-32">
      <div className="container mx-auto px-4 md:px-6 mb-24">
        <SectionHeader
          title="L'excellence industrielle en Afrique"
          subtitle="Vemat Group s'impose comme le partenaire privilégié des acteurs de la construction, de l'industrie lourde et de l'énergie sur le continent."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-16">
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-heading font-bold mb-4 text-zinc-950">Notre Mission</h3>
              <p className="text-zinc-700 leading-relaxed text-lg">
                Équiper les bâtisseurs de l'Afrique de demain avec les machines les plus performantes, fiables et sécurisées du marché mondial. Nous ne sommes pas de simples distributeurs ; nous sommes des apporteurs de solutions techniques intégrées.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-heading font-bold mb-4 text-zinc-950">Notre Vision</h3>
              <p className="text-zinc-700 leading-relaxed text-lg">
                Devenir l'acteur de référence en matière de levage et de manutention sur l'ensemble du continent africain, en instaurant de nouveaux standards de qualité, de sécurité et de service client.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-heading font-bold mb-4 text-zinc-950">Nos Valeurs</h3>
              <ul className="list-disc list-inside text-zinc-700 leading-relaxed text-lg space-y-2 ml-4">
                <li>Exigence technique et rigueur</li>
                <li>Sécurité absolue sur tous les fronts</li>
                <li>Proximité et réactivité auprès de nos clients</li>
                <li>Intégrité et transparence dans nos partenariats</li>
              </ul>
            </div>
          </div>
          
          <div className="h-[600px] relative overflow-hidden shadow-2xl">
            <img src={img} className="w-full h-full object-cover" alt="Construction Afrique" />
          </div>
        </div>
      </div>

      <div className="py-24 bg-zinc-950 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-8">Un réseau de confiance</h2>
          <p className="text-xl text-zinc-400 leading-relaxed mb-12">
            La confiance que nous accordent les plus grands constructeurs mondiaux est le gage de notre sérieux et de notre capacité à maintenir leurs standards élevés de qualité sur nos marchés.
          </p>
        </div>
        <BrandStrip />
      </div>

      <CTASection
        title="Construisons l'avenir ensemble"
        description="Faites confiance à Vemat Group pour la réussite de vos projets industriels."
        primaryCta={{ label: "Contactez-nous", href: "/contact" }}
        background="accent"
      />
    </div>
  );
}
