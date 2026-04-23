import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { HeroSection } from "@/components/HeroSection";
import { SubCategoryCard } from "@/components/SubCategoryCard";
import { CTASection } from "@/components/CTASection";
import { SectionHeader } from "@/components/SectionHeader";
import { categories } from "@/data/categories";
import { subcategories } from "@/data/subcategories";
import { CheckCircle2 } from "lucide-react";
import img from "@/assets/images/nacelles.png";

export default function Nacelles() {
  useSEO("Nacelles", "Nacelles élévatrices motorisées, nacelles à flèche, préparateurs de commandes.");
  useScrollTop();
  const cat = categories.find(c => c.slug === "nacelles");

  return (
    <div className="min-h-screen pt-20">
      <HeroSection
        title={cat?.title || "Nacelles"}
        subtitle={cat?.description || ""}
        image={img}
        primaryCta={{ label: "Demander un devis", href: "/contact" }}
      />

      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            title="Notre flotte d'élévation"
            subtitle="Des solutions sûres pour le travail en hauteur, en intérieur comme en extérieur."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subcategories.nacelles.map((sub, index) => (
              <SubCategoryCard key={index} index={index} title={sub} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-zinc-50 border-t border-zinc-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 h-[500px] bg-zinc-200 relative overflow-hidden shadow-2xl">
               <img src={img} className="w-full h-full object-cover" alt="Nacelles" />
            </div>
            <div className="order-1 lg:order-2">
              <SectionHeader title="Sécurité et agilité" />
              <div className="space-y-6">
                {[
                  "Hauteurs de travail de 5 à 58 mètres",
                  "Motorisations électriques zéro émission pour l'intérieur",
                  "Modèles diesel et hybrides tout-terrain pour l'extérieur",
                  "Commandes proportionnelles douces et précises",
                  "Systèmes anti-écrasement de dernière génération"
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
        title="Une intervention en hauteur ?"
        description="Trouvez la nacelle idéale pour votre projet industriel ou de construction."
        primaryCta={{ label: "Demander un devis", href: "/contact" }}
      />
    </div>
  );
}
