import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { SectionHeader } from "@/components/SectionHeader";
import { ContactForm } from "@/components/ContactForm";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/I18nProvider";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { CTASection } from "@/components/CTASection";
import { OfficesSection } from "@/components/OfficesSection";

export default function Contact() {
  const { t } = useLang();
  useSEO(t("seo.contact.title"), t("seo.contact.desc"));
  useScrollTop();

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Contact Hero */}
      <div className="relative h-[60vh] min-h-[500px] overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-transparent to-white" />
        
        <div className="container mx-auto px-4 md:px-6 h-full flex flex-col justify-center relative z-10 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="text-accent text-xs font-black uppercase tracking-[0.4em] mb-6 block">
              Contact Us
            </span>
            <h1 className="text-6xl md:text-8xl font-heading font-extrabold text-white mb-8 tracking-tighter leading-[0.9]">
              {t("contact.title")}
            </h1>
            <p className="text-zinc-400 text-xl font-medium leading-relaxed">
              {t("contact.sub")}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-32 pb-32 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Contact Form Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 bg-white p-12 md:p-16 shadow-[0_40px_100px_-15px_rgba(0,0,0,0.1)] border border-zinc-100 rounded-[2rem]"
          >
            <div className="mb-12">
              <h2 className="text-3xl font-heading font-bold text-zinc-950 mb-4">{t("contact.formTitle")}</h2>
              <div className="h-1 w-20 bg-accent" />
            </div>
            <ContactForm />
          </motion.div>

          {/* Contact Details & Partners */}
          <div className="space-y-8">
            {/* Quick Info Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-zinc-950 text-white p-10 rounded-[2rem] shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-3xl rounded-full" />
              <h3 className="text-xl font-heading font-bold mb-8 flex items-center gap-3">
                <span className="w-8 h-px bg-accent" />
                {t("contact.coordsTitle")}
              </h3>

              <ul className="space-y-8">
                <li className="group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent shrink-0 group-hover:bg-accent group-hover:text-white transition-all duration-300">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{t("contact.hqLabel")}</span>
                      <span className="text-zinc-300 text-sm font-medium leading-relaxed">
                        Route de Bouskoura, Km 13 Route d'El Jadida<br />
                        BP 20230, Casablanca - Maroc
                      </span>
                    </div>
                  </div>
                </li>

                <li className="group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent shrink-0 group-hover:bg-accent group-hover:text-white transition-all duration-300">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{t("contact.phonesLabel")}</span>
                      <span className="text-zinc-100 text-sm font-bold block mb-1">+212 522 65 12 13</span>
                      <span className="text-zinc-400 text-xs block">+212 650 14 64 64</span>
                    </div>
                  </div>
                </li>

                <li className="group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent shrink-0 group-hover:bg-accent group-hover:text-white transition-all duration-300">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{t("contact.emailLabel")}</span>
                      <a href="mailto:contact@vemat.ma" className="text-zinc-100 text-sm font-bold hover:text-accent transition-colors">
                        contact@vemat.ma
                      </a>
                    </div>
                  </div>
                </li>
              </ul>
            </motion.div>

            {/* WhatsApp Premium Card */}
            <motion.a
              href="https://wa.me/212650146464"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="block bg-zinc-50 border border-zinc-100 p-8 rounded-[2rem] group hover:bg-zinc-100 transition-all duration-500"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#25D366] flex items-center justify-center text-white shadow-lg shadow-[#25D366]/20 group-hover:rotate-12 transition-transform duration-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"></path></svg>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-zinc-950 mb-1">WhatsApp Business</h4>
                  <p className="text-zinc-500 text-sm font-medium">{t("contact.whatsappBtn")}</p>
                </div>
              </div>
            </motion.a>

          </div>
        </div>
      </div>

      <OfficesSection />

      <CTASection
        title={t("home.ctaTitle")}
        description={t("home.ctaDesc")}
        primaryCta={{ label: t("home.ctaPrimary"), href: "/contact" }}
      />
    </div>
  );
}
