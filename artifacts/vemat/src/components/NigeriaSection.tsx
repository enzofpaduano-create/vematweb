import { motion } from "framer-motion";
import { ArrowUpRight, CalendarCheck, MapPin, Wrench, Phone, Mail } from "lucide-react";
import { Link } from "wouter";
import { useLang } from "@/i18n/I18nProvider";
import logo from "@/assets/partners/vemat-westchase-logo.png";

const WESTCHASE_URL = "http://westchaseoil.com/index.html";

const copy = {
  fr: {
    eyebrow: "Projet Nigeria",
    title: "Vemat Westchase LTD,",
    accent: "notre présence au Nigeria",
    intro:
      "Depuis janvier 2026, Vemat Group est présent au Nigeria avec deux bureaux, à Lagos et à Port Harcourt. Une équipe de techniciens est installée sur place pour accompagner les opérateurs, de la vente de matériel au service après-vente et aux pièces détachées.",
    facts: [
      { icon: CalendarCheck, big: "Janvier 2026", small: "Ouverture de nos bureaux au Nigeria" },
      { icon: MapPin, big: "Lagos & Port Harcourt", small: "Deux bureaux, du golfe de Guinée au delta du Niger" },
      { icon: Wrench, big: "Équipe technique", small: "Techniciens sur place pour l'intervention et le SAV" },
    ],
    brands: "Distributeur autorisé Terex RT Cranes, Tadano, JLG, Magni, Ingersoll Rand et Mecalac.",
    contact: "Contact Lagos",
    cta1: "Visiter Westchase",
    cta2: "Lire l'annonce du premier TRT100",
  },
  en: {
    eyebrow: "Nigeria project",
    title: "Vemat Westchase LTD,",
    accent: "our presence in Nigeria",
    intro:
      "Since January 2026, Vemat Group has been present in Nigeria with two offices, in Lagos and Port Harcourt. A team of technicians is based on site to support operators, from equipment sales to after-sales service and spare parts.",
    facts: [
      { icon: CalendarCheck, big: "January 2026", small: "Opening of our offices in Nigeria" },
      { icon: MapPin, big: "Lagos & Port Harcourt", small: "Two offices, from the Gulf of Guinea to the Niger Delta" },
      { icon: Wrench, big: "Technical team", small: "On-site technicians for field service and support" },
    ],
    brands: "Authorised distributor of Terex RT Cranes, Tadano, JLG, Magni, Ingersoll Rand and Mecalac.",
    contact: "Lagos contact",
    cta1: "Visit Westchase",
    cta2: "Read the first TRT100 announcement",
  },
} as const;

export function NigeriaSection() {
  const { lang } = useLang();
  const c = copy[lang === "en" ? "en" : "fr"];

  return (
    <section id="nigeria" className="py-24 md:py-28 bg-zinc-50 scroll-mt-24">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-[2rem] border border-zinc-200 bg-white p-6 md:p-12 shadow-sm"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            <div className="lg:col-span-5 flex flex-col items-start">
              <img src={logo} alt="Vemat Westchase LTD" className="h-28 w-28 md:h-36 md:w-36 object-contain" draggable={false} />
              <span className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-accent">{c.eyebrow}</span>
              <h2 className="mt-4 text-3xl md:text-5xl font-heading font-extrabold text-zinc-950 tracking-tighter leading-[1.05]">
                {c.title} <span className="text-accent">{c.accent}</span>
              </h2>
              <p className="mt-6 text-base md:text-lg text-zinc-600 leading-relaxed">{c.intro}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={WESTCHASE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs md:text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
                >
                  {c.cta1}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                <Link
                  href="/blog/linkedin-nigeria-trt100-westchase"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-2.5 text-xs md:text-sm font-semibold text-zinc-800 hover:border-zinc-950 transition-colors"
                >
                  {c.cta2}
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {c.facts.map((f) => (
                  <div key={f.big} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                    <f.icon className="h-5 w-5 text-accent" />
                    <div className="mt-4 text-lg font-heading font-extrabold text-zinc-950 leading-tight">{f.big}</div>
                    <p className="mt-2 text-sm text-zinc-600 leading-snug">{f.small}</p>
                  </div>
                ))}
              </div>
              <p className="rounded-2xl border border-zinc-200 p-5 text-sm md:text-base text-zinc-700 font-medium leading-relaxed">
                {c.brands}
              </p>
              <div className="rounded-2xl bg-zinc-950 p-6 text-zinc-300 text-sm leading-relaxed">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">{c.contact}</div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                  <span>11, Sumbo Jibowu, Ikoyi, Lagos, Nigeria</span>
                </div>
                <a href="tel:+2348143155517" className="mt-2 flex items-center gap-3 hover:text-white">
                  <Phone className="h-4 w-4 text-accent shrink-0" />
                  +234 814 315 5517
                </a>
                <a href="mailto:vematwestchase@vematgroup.com" className="mt-2 flex items-center gap-3 hover:text-white">
                  <Mail className="h-4 w-4 text-accent shrink-0" />
                  vematwestchase@vematgroup.com
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
