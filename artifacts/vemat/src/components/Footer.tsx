import { Link } from "wouter";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { brands } from "../data/brands";
import { useLang } from "@/i18n/I18nProvider";
import vematLogo from "@/assets/vemat-logo.png";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-zinc-950 text-white pt-32 pb-12 relative overflow-hidden">
      {/* Decorative Gradient */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-64 bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          <div className="space-y-8">
            <Link href="/" className="inline-block group">
              <img 
                src={vematLogo} 
                alt="Vemat Group" 
                className="h-12 w-auto brightness-0 invert group-hover:scale-105 transition-transform duration-500" 
              />
            </Link>
            <p className="text-zinc-400 text-base leading-relaxed max-w-xs font-medium">
              {t("footer.tagline")}
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-accent hover:text-white hover:border-accent transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-accent hover:text-white hover:border-accent transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-10">{t("footer.equipments")}</h4>
            <ul className="space-y-5">
              <li><Link href="/grues" className="text-zinc-400 hover:text-white transition-all text-sm font-bold flex items-center group"><span className="w-0 group-hover:w-4 h-px bg-accent mr-0 group-hover:mr-2 transition-all duration-300"></span>{t("nav.grues")}</Link></li>
              <li><Link href="/nacelles" className="text-zinc-400 hover:text-white transition-all text-sm font-bold flex items-center group"><span className="w-0 group-hover:w-4 h-px bg-accent mr-0 group-hover:mr-2 transition-all duration-300"></span>{t("nav.nacelles")}</Link></li>
              <li><Link href="/elevateurs-telescopiques" className="text-zinc-400 hover:text-white transition-all text-sm font-bold flex items-center group"><span className="w-0 group-hover:w-4 h-px bg-accent mr-0 group-hover:mr-2 transition-all duration-300"></span>{t("nav.elevateurs")}</Link></li>
              <li><Link href="/construction" className="text-zinc-400 hover:text-white transition-all text-sm font-bold flex items-center group"><span className="w-0 group-hover:w-4 h-px bg-accent mr-0 group-hover:mr-2 transition-all duration-300"></span>{t("nav.construction")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-10">{t("footer.company")}</h4>
            <ul className="space-y-5">
              <li><Link href="/a-propos" className="text-zinc-400 hover:text-white transition-all text-sm font-bold flex items-center group"><span className="w-0 group-hover:w-4 h-px bg-accent mr-0 group-hover:mr-2 transition-all duration-300"></span>{t("nav.apropos")}</Link></li>
              <li><Link href="/blog" className="text-zinc-400 hover:text-white transition-all text-sm font-bold flex items-center group"><span className="w-0 group-hover:w-4 h-px bg-accent mr-0 group-hover:mr-2 transition-all duration-300"></span>{t("nav.blog")}</Link></li>
              <li><Link href="/services" className="text-zinc-400 hover:text-white transition-all text-sm font-bold flex items-center group"><span className="w-0 group-hover:w-4 h-px bg-accent mr-0 group-hover:mr-2 transition-all duration-300"></span>{t("footer.ourServices")}</Link></li>
              <li><Link href="/contact" className="text-zinc-400 hover:text-white transition-all text-sm font-bold flex items-center group"><span className="w-0 group-hover:w-4 h-px bg-accent mr-0 group-hover:mr-2 transition-all duration-300"></span>{t("nav.contact")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-10">{t("footer.contact")}</h4>
            <ul className="space-y-6">
              <li>
                <a 
                  href="https://www.google.es/maps/place/Vemat/@33.4988051,-7.7059007,17z/data=!4m15!1m8!3m7!1s0xda62b88d3d82e8d:0xff07a03e55b31821!2sVEMAT,+Maroc!3b1!8m2!3d33.4988362!4d-7.7034864!16s%2Fg%2F11b8tj4nvh!3m5!1s0xda62b8f3182b7b7:0x24a8382e0dcf197a!8m2!3d33.499145!4d-7.7040357!16s%2Fg%2F11ddwx4mn_?entry=ttu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 text-zinc-400 text-sm font-medium group/link"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-accent shrink-0 border border-zinc-800 group-hover/link:bg-accent group-hover/link:text-white group-hover/link:border-accent transition-all duration-300">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span className="leading-relaxed group-hover/link:text-white transition-colors">{t("footer.hqLine1")}</span>
                </a>
              </li>
              <li>
                <div className="flex items-center gap-4 text-zinc-400 text-sm font-medium">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-accent shrink-0 border border-zinc-800">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <a href="tel:+212522651213" className="text-white font-bold tracking-tight hover:text-accent transition-colors">+212 522 65 12 13</a>
                    <a href="tel:+212650146464" className="text-zinc-500 hover:text-accent transition-colors">+212 650 14 64 64</a>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-900 pt-12 flex flex-col md:flex-row items-center justify-between gap-10">
          <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} Vemat Group. {t("footer.rights")}
          </p>
          <div className="flex flex-wrap gap-6 items-center justify-center">
            {brands.slice(0, 5).map((brand) => (
              <a
                key={brand.id}
                href={brand.website}
                target="_blank"
                rel="noopener noreferrer"
                title={brand.name}
                className="grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
              >
                <img src={brand.logo} alt={brand.name} className="h-6 md:h-7 w-auto object-contain" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
