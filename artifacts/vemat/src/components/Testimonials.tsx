import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Ahmed Benani",
    role: "Directeur de Projet, BTP Casablanca",
    content: "Vemat est notre partenaire de confiance depuis plus de 10 ans. La qualité du service après-vente et la fiabilité des machines JLG ont été cruciales pour nos projets d'infrastructure.",
    rating: 5
  },
  {
    name: "Sarah Mendès",
    role: "Responsable Logistique, Port de Dakar",
    content: "L'acquisition de nos grues Tadano via Vemat a transformé nos opérations. Une expertise technique rare et une réactivité exemplaire lors des interventions de maintenance.",
    rating: 5
  },
  {
    name: "Jean-Pierre Durand",
    role: "Chef de Chantier, Mines Côte d'Ivoire",
    content: "Les chariots télescopiques Magni que nous louons chez Vemat sont d'une performance redoutable sur les terrains difficiles. Un support technique disponible 24/7.",
    rating: 5
  }
];

export function Testimonials() {
  return (
    <section className="py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-accent text-xs font-black uppercase tracking-[0.3em] mb-4 block"
          >
            Témoignages
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-heading font-extrabold text-zinc-950 tracking-tighter uppercase mb-6"
          >
            Ce que disent nos partenaires
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-10 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 relative group hover:bg-zinc-950 transition-all duration-700"
            >
              <Quote className="h-12 w-12 text-accent/20 absolute top-8 right-8 group-hover:text-accent/10 transition-colors" />
              
              <div className="flex gap-1 mb-6">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>

              <p className="text-lg text-zinc-700 font-medium mb-10 leading-relaxed group-hover:text-zinc-300 transition-colors">
                "{t.content}"
              </p>

              <div>
                <h4 className="font-heading font-extrabold text-zinc-950 group-hover:text-white transition-colors uppercase tracking-tight">
                  {t.name}
                </h4>
                <p className="text-xs text-accent font-black uppercase tracking-widest mt-1">
                  {t.role}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
