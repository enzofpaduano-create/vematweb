import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { HeroSection } from "@/components/HeroSection";
import { SubCategoryCard } from "@/components/SubCategoryCard";
import { CTASection } from "@/components/CTASection";
import { SectionHeader } from "@/components/SectionHeader";
import { categories } from "@/data/categories";
import { subcategories } from "@/data/subcategories";
import { CheckCircle2 } from "lucide-react";
import img from "@/assets/images/grues.png";

export default function Grues() {
  useSEO("Grues", "Gamme complète de grues : automotrices, tout-terrain, sur chenilles, à tour.");
  useScrollTop();
  const cat = categories.find(c => c.slug === "grues");

  return (
    <div className="min-h-screen pt-20">
      <HeroSection
        title={cat?.title || "Grues"}
        subtitle={cat?.description || ""}
        image={img}
        primaryCta={{ label: "Demander un devis", href: "/contact" }}
      />

      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            title="Notre gamme de grues"
            subtitle="Des capacités de levage exceptionnelles adaptées à chaque environnement de travail."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subcategories.grues.map((sub, index) => (
              <SubCategoryCard key={index} index={index} title={sub} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-zinc-50 border-t border-zinc-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionHeader title="La performance au sommet" />
              <div className="space-y-6">
                {[
                  "Capacités de levage allant jusqu'à plus de 1000 tonnes",
                  "Technologies de stabilisation avancées",
                  "Systèmes de contrôle intelligents (IC-1 Plus)",
                  "Maintenance simplifiée et télémétrie embarquée",
                  "Conformité aux normes de sécurité internationales les plus strictes"
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-accent shrink-0" />
                    <p className="text-zinc-700 text-lg">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-[500px] bg-zinc-200 relative overflow-hidden shadow-2xl">
               <img src={img} className="w-full h-full object-cover" alt="Grues en action" />
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title="Besoin d'expertise pour votre levage ?"
        description="Nos ingénieurs vous conseillent sur la grue la plus adaptée à la configuration de votre chantier."
        primaryCta={{ label: "Nous contacter", href: "/contact" }}
      />
    </div>
  );
}
