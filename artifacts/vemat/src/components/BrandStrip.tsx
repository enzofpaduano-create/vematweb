import { brands } from "../data/brands";
import { useLang } from "@/i18n/I18nProvider";
import { motion } from "framer-motion";

export function BrandStrip() {
  const { t } = useLang();
  return (
    <div className="bg-zinc-50 py-20 border-y border-zinc-200 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-[10px] md:text-[11px] font-extrabold text-zinc-400 uppercase tracking-[0.4em] mb-16"
        >
          {t("brands.stripHeading")}
        </motion.p>
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
          {brands.map((brand, i) => (
            <motion.a
              key={brand.id}
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative block bg-white px-8 py-6 rounded-xl border border-zinc-100 hover:border-accent/30 transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-2"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-8 md:h-10 w-auto object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-zinc-950/5 group-hover:ring-accent/20 transition-all" />
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
