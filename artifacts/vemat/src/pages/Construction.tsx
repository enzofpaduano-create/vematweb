import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { HeroSection } from "@/components/HeroSection";
import { SubCategoryCard } from "@/components/SubCategoryCard";
import { CTASection } from "@/components/CTASection";
import { SectionHeader } from "@/components/SectionHeader";
import { categories } from "@/data/categories";
import { subcategories } from "@/data/subcategories";
import { CheckCircle2 } from "lucide-react";
import img from "@/assets/images/construction.png";

export default function Construction() {
  useSEO("Construction", "Équipements de construction, terrassement, chargeuses, pelles.");
  useScrollTop();
  const cat = categories.find(c => c.slug === "construction");

  return (
    <div className="min-h-screen pt-20">
      <HeroSection
        title={cat?.title || "Construction"}
        subtitle={cat?.description || ""}
        image={img}
        primaryCta={{ label: "Demander un devis", href: "/contact" }}
      />

      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            title="Engins de chantier"
            subtitle="La fiabilité au cœur des grands travaux de terrassement et d'infrastructure."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subcategories.construction.map((sub, index) => (
              <SubCategoryCard key={index} index={index} title={sub} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-zinc-50 border-t border-zinc-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 h-[500px] bg-zinc-200 relative overflow-hidden shadow-2xl">
               <img src={img} className="w-full h-full object-cover" alt="Construction" />
            </div>
            <div className="order-1 lg:order-2">
              <SectionHeader title="Productivité maximale" />
              <div className="space-y-6">
                {[
                  "Motorisations robustes adaptées aux carburants africains",
                  "Cinématiques optimisées pour des cycles de travail rapides",
                  "Châssis renforcés pour les environnements extrêmes",
                  "Maintenance prédictive via systèmes embarqués",
                  "Rendement énergétique de premier ordre"
                ].map((benefit, i) => (
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

      <CTASection
        title="Besoin d'équiper votre chantier ?"
        description="Location ou achat, bénéficiez de notre flotte d'engins TP et de notre support de proximité."
        primaryCta={{ label: "Demander un devis", href: "/contact" }}
      />
    </div>
  );
}
