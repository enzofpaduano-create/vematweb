import { Link } from "wouter";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { brands } from "../data/brands";
import { useLang } from "@/i18n/I18nProvider";
import vematLogo from "@/assets/vemat-logo.png";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-zinc-950 text-white pt-20 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link href="/" className="inline-block bg-white px-3 py-2">
              <img src={vematLogo} alt="Vemat Group" className="h-10 w-auto" />
            </Link>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-6">{t("footer.equipments")}</h4>
            <ul className="space-y-3">
              <li><Link href="/grues" className="text-zinc-400 hover:text-accent transition-colors text-sm">{t("nav.grues")}</Link></li>
              <li><Link href="/nacelles" className="text-zinc-400 hover:text-accent transition-colors text-sm">{t("nav.nacelles")}</Link></li>
              <li><Link href="/elevateurs-telescopiques" className="text-zinc-400 hover:text-accent transition-colors text-sm">{t("nav.elevateurs")}</Link></li>
              <li><Link href="/construction" className="text-zinc-400 hover:text-accent transition-colors text-sm">{t("nav.construction")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-6">{t("footer.company")}</h4>
            <ul className="space-y-3">
              <li><Link href="/a-propos" className="text-zinc-400 hover:text-accent transition-colors text-sm">{t("nav.apropos")}</Link></li>
              <li><Link href="/services" className="text-zinc-400 hover:text-accent transition-colors text-sm">{t("footer.ourServices")}</Link></li>
              <li><Link href="/contact" className="text-zinc-400 hover:text-accent transition-colors text-sm">{t("nav.contact")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-6">{t("footer.contact")}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-zinc-400 text-sm">
                <MapPin className="h-5 w-5 text-accent shrink-0" />
                <span>{t("footer.hqLine1")}</span>
              </li>
              <li className="flex items-center gap-3 text-zinc-400 text-sm">
                <Phone className="h-5 w-5 text-accent shrink-0" />
                <div className="flex flex-col">
                  <span>+212 522 65 12 13</span>
                  <span>+212 650 14 64 64</span>
                </div>
              </li>
              <li className="flex items-center gap-3 text-zinc-400 text-sm">
                <Clock className="h-5 w-5 text-accent shrink-0" />
                <div className="flex flex-col">
                  <span>{t("footer.weekdays")}</span>
                  <span>{t("footer.saturday")}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-8 mt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} Vemat Group. {t("footer.rights")}
          </p>
          <div className="flex flex-wrap gap-3 items-center justify-center">
            {brands.map((brand) => (
              <a
                key={brand.id}
                href={brand.website}
                target="_blank"
                rel="noopener noreferrer"
                title={brand.name}
                className="bg-white/95 hover:bg-white px-3 py-2 transition-colors"
              >
                <img src={brand.logo} alt={brand.name} className="h-6 w-auto object-contain" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
