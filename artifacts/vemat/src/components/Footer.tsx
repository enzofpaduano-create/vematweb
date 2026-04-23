import { Link } from "wouter";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { brands } from "../data/brands";

export function Footer() {
  return (
    <footer className="bg-zinc-950 text-white pt-20 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <span className="font-heading font-bold text-2xl tracking-tighter">
                VEMAT<span className="text-accent">.</span>GROUP
              </span>
            </Link>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
              Distributeur majeur d'équipements industriels lourds en Afrique. Vente, location, SAV et pièces de rechange d'origine pour les secteurs de la construction et de l'industrie.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-6">Équipements</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/grues" className="text-zinc-400 hover:text-accent transition-colors text-sm">Grues</Link>
              </li>
              <li>
                <Link href="/nacelles" className="text-zinc-400 hover:text-accent transition-colors text-sm">Nacelles</Link>
              </li>
              <li>
                <Link href="/elevateurs-telescopiques" className="text-zinc-400 hover:text-accent transition-colors text-sm">Élévateurs Télescopiques</Link>
              </li>
              <li>
                <Link href="/construction" className="text-zinc-400 hover:text-accent transition-colors text-sm">Construction</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-6">Société</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/a-propos" className="text-zinc-400 hover:text-accent transition-colors text-sm">À Propos</Link>
              </li>
              <li>
                <Link href="/services" className="text-zinc-400 hover:text-accent transition-colors text-sm">Nos Services</Link>
              </li>
              <li>
                <Link href="/contact" className="text-zinc-400 hover:text-accent transition-colors text-sm">Contact</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-zinc-400 text-sm">
                <MapPin className="h-5 w-5 text-accent shrink-0" />
                <span>Route de Bouskoura, Km 13 Route d'El Jadida, BP 20230, Casablanca - Maroc</span>
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
                  <span>Lun-Ven: 08:30 - 17:30</span>
                  <span>Sam: 08:30 - 13:30</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-8 mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} Vemat Group. Tous droits réservés.
          </p>
          <div className="flex gap-4 items-center">
            {brands.map((brand) => (
              <span key={brand} className="text-zinc-600 text-xs font-semibold uppercase tracking-wider">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
