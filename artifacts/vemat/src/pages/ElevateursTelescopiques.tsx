import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { HeroSection } from "@/components/HeroSection";
import { SubCategoryCard } from "@/components/SubCategoryCard";
import { CTASection } from "@/components/CTASection";
import { SectionHeader } from "@/components/SectionHeader";
import { categories } from "@/data/categories";
import { subcategories } from "@/data/subcategories";
import { CheckCircle2 } from "lucide-react";
import img from "@/assets/images/telescopiques.png";

export default function ElevateursTelescopiques() {
  useSEO("Élévateurs Télescopiques", "Chariots télescopiques fixes, rotatifs et heavy duty.");
  useScrollTop();
  const cat = categories.find(c => c.slug === "elevateurs-telescopiques");

  return (
    <div className="min-h-screen pt-20">
      <HeroSection
        title={cat?.title || "Élévateurs Télescopiques"}
        subtitle={cat?.description || ""}
        image={img}
        primaryCta={{ label: "Demander un devis", href: "/contact" }}
      />

      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            title="La polyvalence extrême"
            subtitle="Des machines robustes pour manipuler de lourdes charges avec précision."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subcategories["elevateurs-telescopiques"].map((sub, index) => (
              <SubCategoryCard key={index} index={index} title={sub} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-zinc-50 border-t border-zinc-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionHeader title="Conçus pour l'exigence" />
              <div className="space-y-6">
                {[
                  "Rotation continue 360° pour une zone d'action maximisée",
                  "Capacités de levage jusqu'à 50 tonnes en Heavy Duty",
                  "Cabines pressurisées avec visibilité panoramique",
                  "Vaste gamme d'accessoires (fourches, treuils, nacelles, godets)",
                  "Transmission hydrostatique pour une précision millimétrique"
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-accent shrink-0" />
                    <p className="text-zinc-700 text-lg">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-[500px] bg-zinc-200 relative overflow-hidden shadow-2xl">
               <img src={img} className="w-full h-full object-cover" alt="Télescopiques" />
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title="Optimisez votre manutention"
        description="Contactez nos experts pour déterminer le modèle et les accessoires adaptés à vos opérations."
        primaryCta={{ label: "Nous contacter", href: "/contact" }}
      />
    </div>
  );
}
