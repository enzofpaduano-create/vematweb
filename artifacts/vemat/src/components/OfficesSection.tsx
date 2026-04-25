import { motion } from "framer-motion";
import { ArrowUpRight, Building2, MapPin, Globe2 } from "lucide-react";
import { AfricaMap } from "@/components/AfricaMap";
import { useLang } from "@/i18n/I18nProvider";
import { offices, ACTIVE_COUNTRY_COUNT } from "@/data/offices";

const iconForType = {
  hq: Building2,
  branch: MapPin,
  partner: Globe2,
} as const;

export function OfficesSection() {
  const { t, lang } = useLang();

  return (
    <section className="relative py-24 md:py-32 bg-zinc-950 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container relative mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-6 block"
          >
            {t("offices.eyebrow")}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-4xl md:text-6xl font-heading font-extrabold text-white tracking-tighter leading-[1.05]"
          >
            {t("offices.title")}{" "}
            <span className="text-accent">{t("offices.titleAccent")}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-lg md:text-xl text-zinc-400 mt-7 leading-relaxed font-medium"
          >
            {t("offices.subtitle")}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="lg:col-span-7 relative rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-4 md:p-6"
          >
            <AfricaMap />
          </motion.div>

          <div className="lg:col-span-5 space-y-3">
            {offices.map((o, i) => {
              const Icon = iconForType[o.type];
              const isHQ = o.type === "hq";
              return (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: "easeOut" }}
                  className={`group relative p-6 rounded-2xl border backdrop-blur-sm transition-all duration-500 ${
                    isHQ
                      ? "bg-gradient-to-br from-accent/15 via-accent/5 to-transparent border-accent/40 hover:border-accent"
                      : "bg-white/[0.03] border-white/10 hover:border-accent/40 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                        isHQ
                          ? "bg-accent text-zinc-950 shadow-lg shadow-accent/30"
                          : "bg-white/[0.06] text-accent group-hover:bg-accent group-hover:text-zinc-950"
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3 mb-1">
                        <h3 className="text-xl font-heading font-extrabold text-white tracking-tight">
                          {o.city}
                        </h3>
                        <span
                          className={`text-[9px] font-black uppercase tracking-[0.2em] shrink-0 ${
                            isHQ ? "text-accent" : "text-zinc-500"
                          }`}
                        >
                          {o.tagline[lang]}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 font-semibold">
                        {o.country[lang]}
                      </p>
                      <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                        {o.description[lang]}
                      </p>
                      {o.partnerUrl && (
                        <a
                          href={o.partnerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-accent hover:text-white transition-colors"
                        >
                          {o.partnerName}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.08] mt-16 md:mt-20 rounded-2xl overflow-hidden border border-white/5"
        >
          {[
            { v: String(offices.length), l: t("offices.statOffices") },
            { v: `${ACTIVE_COUNTRY_COUNT}`, l: t("offices.statCountries") },
            { v: "3", l: t("offices.statContinents") },
            { v: "24/7", l: t("offices.statSupport") },
          ].map((s, i) => (
            <div key={i} className="bg-zinc-950 p-8 text-center">
              <div className="text-4xl md:text-5xl font-heading font-extrabold text-accent">
                {s.v}
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mt-3">
                {s.l}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
