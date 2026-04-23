import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { SectionHeader } from "@/components/SectionHeader";
import { ContactForm } from "@/components/ContactForm";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Contact() {
  useSEO("Contact", "Contactez Vemat Group pour vos besoins en équipements de levage, nacelles, SAV et pièces de rechange au Maroc.");
  useScrollTop();

  return (
    <div className="min-h-screen pt-32 pb-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeader
          title="Contactez nos experts"
          subtitle="Une demande de devis, un besoin d'assistance technique ou une question sur nos pièces de rechange ? Notre équipe est à votre écoute."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mt-16">
          <div className="lg:col-span-2 bg-white p-8 md:p-10 border border-zinc-200 shadow-xl">
            <h3 className="text-2xl font-heading font-bold mb-8">Envoyez-nous un message</h3>
            <ContactForm />
          </div>

          <div className="space-y-10">
            <div className="bg-zinc-50 p-8 border border-zinc-200">
              <h3 className="text-xl font-heading font-bold mb-6 border-b border-zinc-200 pb-4">Coordonnées</h3>
              
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-accent shrink-0 mt-1" />
                  <div>
                    <strong className="block text-zinc-950 mb-1">Siège Social</strong>
                    <span className="text-zinc-600 leading-relaxed block">
                      Route de Bouskoura, Km 13 Route d'El Jadida<br />
                      BP 20230, Casablanca - Maroc
                    </span>
                  </div>
                </li>
                
                <li className="flex items-start gap-4">
                  <Phone className="h-6 w-6 text-accent shrink-0 mt-1" />
                  <div>
                    <strong className="block text-zinc-950 mb-1">Téléphones</strong>
                    <span className="text-zinc-600 block">+212 522 65 12 13</span>
                    <span className="text-zinc-600 block">+212 650 14 64 64</span>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-accent shrink-0 mt-1" />
                  <div>
                    <strong className="block text-zinc-950 mb-1">Email</strong>
                    <a href="mailto:contact@vemat.ma" className="text-zinc-600 hover:text-accent transition-colors">
                      contact@vemat.ma
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <Clock className="h-6 w-6 text-accent shrink-0 mt-1" />
                  <div>
                    <strong className="block text-zinc-950 mb-1">Horaires d'ouverture</strong>
                    <span className="text-zinc-600 block">Lundi au Vendredi : 08:30 - 17:30</span>
                    <span className="text-zinc-600 block">Samedi : 08:30 - 13:30</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-[#25D366] p-8 text-white text-center shadow-lg">
              <h3 className="text-2xl font-heading font-bold mb-4">Contact Direct</h3>
              <p className="mb-6 opacity-90">Pour une assistance immédiate, contactez-nous sur WhatsApp.</p>
              <a href="https://wa.me/212650146464" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full bg-white text-[#25D366] hover:bg-zinc-100 hover:text-[#25D366] border-none font-bold h-12 rounded-none">
                  Discuter sur WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
