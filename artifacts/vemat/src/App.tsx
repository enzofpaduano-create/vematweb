import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TechnicienAuthProvider } from "@/contexts/TechnicienAuthContext";
import { PdrAuthProvider } from "@/contexts/PdrAuthContext";
import { SavAuthProvider } from "@/contexts/SavAuthContext";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { I18nProvider } from "@/i18n/I18nProvider";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { VematAssistant } from "@/components/VematAssistant";
import { SplashScreen } from "@/components/SplashScreen";

import Home from "@/pages/Home";
import Grues from "@/pages/Grues";
import Nacelles from "@/pages/Nacelles";
import ElevateursTelescopiques from "@/pages/ElevateursTelescopiques";
import Construction from "@/pages/Construction";
import Services from "@/pages/Services";
import APropos from "@/pages/APropos";
import Contact from "@/pages/Contact";
import PiecesDeRechange from "@/pages/PiecesDeRechange";
import Blog from "@/pages/Blog";
import Article from "@/pages/Article";
import ProductPage from "@/pages/ProductPage";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

// Portail d'entrée
import EspaceVemat from "@/pages/EspaceVemat";

// Espace technicien
import TechnicienLogin from "@/pages/technicien/TechnicienLogin";
import TechnicienMissions from "@/pages/technicien/TechnicienMissions";
import TechnicienMission from "@/pages/technicien/TechnicienMission";
import TechnicienHistorique from "@/pages/technicien/TechnicienHistorique";
import TechnicienCatalogues from "@/pages/technicien/TechnicienCatalogues";
import TechnicienCatalogue from "@/pages/technicien/TechnicienCatalogue";

// Espace PDR (pièces de rechange)
import PdrLogin from "@/pages/pdr/PdrLogin";
import PdrDashboard from "@/pages/pdr/PdrDashboard";
import PdrDocuments from "@/pages/pdr/PdrDocuments";
import PdrDevisNew from "@/pages/pdr/PdrDevisNew";
import PdrDocumentDetail from "@/pages/pdr/PdrDocumentDetail";
import PdrDocumentEdit from "@/pages/pdr/PdrDocumentEdit";
import PdrConvert from "@/pages/pdr/PdrConvert";

// Espace SAV (service / interventions)
import SavLogin from "@/pages/sav/SavLogin";
import SavDashboard from "@/pages/sav/SavDashboard";
import SavDocuments from "@/pages/sav/SavDocuments";
import SavOfferNew from "@/pages/sav/SavOfferNew";
import SavDocumentDetail from "@/pages/sav/SavDocumentDetail";
import SavDocumentEdit from "@/pages/sav/SavDocumentEdit";
import SavSettings from "@/pages/sav/SavSettings";

// Formulaires publics
import DemandeDevis from "@/pages/DemandeDevis";
import DemandeIntervention from "@/pages/DemandeIntervention";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Portail d'entrée */}
      <Route path="/espace-vemat" component={EspaceVemat} />

      {/* Espace technicien */}
      <Route path="/espace-technicien/connexion" component={TechnicienLogin} />
      <Route path="/espace-technicien/missions" component={TechnicienMissions} />
      <Route path="/espace-technicien/mission/:id" component={TechnicienMission} />
      <Route path="/espace-technicien/historique" component={TechnicienHistorique} />
      <Route path="/espace-technicien/catalogues/:slug" component={TechnicienCatalogue} />
      <Route path="/espace-technicien/catalogues" component={TechnicienCatalogues} />

      {/* Espace PDR (pièces de rechange) */}
      <Route path="/espace-pdr/connexion" component={PdrLogin} />
      <Route path="/espace-pdr/tableau" component={PdrDashboard} />
      <Route path="/espace-pdr/documents" component={PdrDocuments} />
      <Route path="/espace-pdr/devis/nouveau" component={PdrDevisNew} />
      <Route path="/espace-pdr/document/:id/edit" component={PdrDocumentEdit} />
      <Route path="/espace-pdr/document/:id/convert/:toType" component={PdrConvert} />
      <Route path="/espace-pdr/document/:id" component={PdrDocumentDetail} />

      {/* Espace SAV (service / interventions) */}
      <Route path="/espace-sav/connexion" component={SavLogin} />
      <Route path="/espace-sav/tableau" component={SavDashboard} />
      <Route path="/espace-sav/documents" component={SavDocuments} />
      <Route path="/espace-sav/offre/nouvelle" component={SavOfferNew} />
      <Route path="/espace-sav/reglages" component={SavSettings} />
      <Route path="/espace-sav/document/:id/edit" component={SavDocumentEdit} />
      <Route path="/espace-sav/document/:id" component={SavDocumentDetail} />

      {/* Formulaires publics (standalone, sans Navbar/Footer) */}
      <Route path="/demande-devis" component={DemandeDevis} />
      <Route path="/demande-intervention" component={DemandeIntervention} />

      {/* Site public */}
      <Route>
        <div className="flex min-h-screen flex-col overflow-x-hidden">
          <ScrollToTop />
          <Navbar />
          <main className="flex-grow">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/grues" component={Grues} />
              <Route path="/nacelles" component={Nacelles} />
              <Route path="/elevateurs-telescopiques" component={ElevateursTelescopiques} />
              <Route path="/construction" component={Construction} />
              <Route path="/services" component={Services} />
              <Route path="/pieces-de-rechange" component={PiecesDeRechange} />
              <Route path="/blog" component={Blog} />
              <Route path="/blog/:slug" component={Article} />
              <Route path="/a-propos" component={APropos} />
              <Route path="/contact" component={Contact} />
              <Route path="/produit/:slug" component={ProductPage} />
              <Route path="/admin" component={Admin} />
              <Route component={NotFound} />
            </Switch>
          </main>
          <Footer />
          <VematAssistant />
          <FloatingWhatsApp />
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <TechnicienAuthProvider>
      <PdrAuthProvider>
        <SavAuthProvider>
          <QueryClientProvider client={queryClient}>
            <I18nProvider>
              <TooltipProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
                <SplashScreen />
                <Toaster />
              </TooltipProvider>
            </I18nProvider>
          </QueryClientProvider>
        </SavAuthProvider>
      </PdrAuthProvider>
    </TechnicienAuthProvider>
  );
}

export default App;
