import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleAuthProvider } from "@/contexts/GoogleAuthContext";
import { ClientAuthProvider } from "@/contexts/ClientAuthContext";
import { ManagerAuthProvider } from "@/contexts/ManagerAuthContext";
import { TechnicienAuthProvider } from "@/contexts/TechnicienAuthContext";
import { DGAuthProvider } from "@/contexts/DGAuthContext";
import { CommercialAuthProvider } from "@/contexts/CommercialAuthContext";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { I18nProvider } from "@/i18n/I18nProvider";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { VematAssistant } from "@/components/VematAssistant";

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
import Workspace from "@/pages/Workspace";
import NotFound from "@/pages/not-found";

// Portail d'entrée
import EspaceVemat from "@/pages/EspaceVemat";

// Espace client
import EspaceClientLogin from "@/pages/espace-client/Login";
import EspaceClientRegister from "@/pages/espace-client/Register";
import EspaceClientDashboard from "@/pages/espace-client/Dashboard";
import EspaceClientCommandes from "@/pages/espace-client/Commandes";
import EspaceClientCommandeDetail from "@/pages/espace-client/CommandeDetail";
import EspaceClientNouvelleCommande from "@/pages/espace-client/NouvelleCommande";
import EspaceClientReparations from "@/pages/espace-client/Reparations";
import EspaceClientReparationDetail from "@/pages/espace-client/ReparationDetail";
import EspaceClientNouvelleReparation from "@/pages/espace-client/NouvelleReparation";
import EspaceClientChantiers from "@/pages/espace-client/Chantiers";
import EspaceClientProfil from "@/pages/espace-client/Profil";

// Espace manager
import ManagerLogin from "@/pages/espace-manager/ManagerLogin";
import AdminDashboard from "@/pages/admin-client/AdminDashboard";
import AdminCommandes from "@/pages/admin-client/AdminCommandes";
import AdminCommandeDetail from "@/pages/admin-client/AdminCommandeDetail";
import AdminReparations from "@/pages/admin-client/AdminReparations";
import AdminReparationDetail from "@/pages/admin-client/AdminReparationDetail";
import AdminClients from "@/pages/admin-client/AdminClients";
import AdminTechniciens from "@/pages/admin-client/AdminTechniciens";
import AdminCalendrier from "@/pages/admin-client/AdminCalendrier";
import AdminClientDetail from "@/pages/admin-client/AdminClientDetail";

// Espace technicien
import TechnicienLogin from "@/pages/technicien/TechnicienLogin";
import TechnicienMissions from "@/pages/technicien/TechnicienMissions";
import TechnicienMission from "@/pages/technicien/TechnicienMission";
import TechnicienHistorique from "@/pages/technicien/TechnicienHistorique";

// Espace direction (DG)
import DGLogin from "@/pages/direction/DGLogin";
import DGDashboard from "@/pages/direction/DGDashboard";
import DGReparations from "@/pages/direction/DGReparations";
import DGCommandes from "@/pages/direction/DGCommandes";
import DGCommandeDetail from "@/pages/direction/DGCommandeDetail";
import DGCommercial from "@/pages/direction/DGCommercial";

// Espace commercial
import CommercialLogin from "@/pages/commercial/CommercialLogin";
import CommercialDashboard from "@/pages/commercial/CommercialDashboard";
import CommercialCalendrier from "@/pages/commercial/CommercialCalendrier";
import CommercialReunions from "@/pages/commercial/CommercialReunions";
import CommercialVentes from "@/pages/commercial/CommercialVentes";

// Formulaires publics
import DemandeDevis from "@/pages/DemandeDevis";
import DemandeIntervention from "@/pages/DemandeIntervention";

// Manager — demandes entrantes
import AdminDemandes from "@/pages/admin-client/AdminDemandes";

const queryClient = new QueryClient();

const PORTAL_PREFIXES = ["/espace-client", "/espace-manager", "/espace-technicien", "/espace-vemat", "/direction", "/espace-commercial"];
function isPortalRoute(path: string) {
  return PORTAL_PREFIXES.some((p) => path.startsWith(p));
}

function Router() {
  return (
    <Switch>
      {/* Portail d'entrée */}
      <Route path="/espace-vemat" component={EspaceVemat} />

      {/* Espace client */}
      <Route path="/espace-client/connexion" component={EspaceClientLogin} />
      <Route path="/espace-client/inscription" component={EspaceClientRegister} />
      <Route path="/espace-client/dashboard" component={EspaceClientDashboard} />
      <Route path="/espace-client/commandes/nouvelle" component={EspaceClientNouvelleCommande} />
      <Route path="/espace-client/commandes/:id" component={EspaceClientCommandeDetail} />
      <Route path="/espace-client/commandes" component={EspaceClientCommandes} />
      <Route path="/espace-client/reparations/nouvelle" component={EspaceClientNouvelleReparation} />
      <Route path="/espace-client/reparations/:id" component={EspaceClientReparationDetail} />
      <Route path="/espace-client/reparations" component={EspaceClientReparations} />
      <Route path="/espace-client/chantiers" component={EspaceClientChantiers} />
      <Route path="/espace-client/profil" component={EspaceClientProfil} />

      {/* Espace manager */}
      <Route path="/espace-manager/connexion" component={ManagerLogin} />
      <Route path="/espace-manager/dashboard" component={AdminDashboard} />
      <Route path="/espace-manager/calendrier" component={AdminCalendrier} />
      <Route path="/espace-manager/commandes/:id" component={AdminCommandeDetail} />
      <Route path="/espace-manager/commandes" component={AdminCommandes} />
      <Route path="/espace-manager/reparations/:id" component={AdminReparationDetail} />
      <Route path="/espace-manager/reparations" component={AdminReparations} />
      <Route path="/espace-manager/techniciens" component={AdminTechniciens} />
      <Route path="/espace-manager/clients/:id" component={AdminClientDetail} />
      <Route path="/espace-manager/clients" component={AdminClients} />

      {/* Espace technicien */}
      <Route path="/espace-technicien/connexion" component={TechnicienLogin} />
      <Route path="/espace-technicien/missions" component={TechnicienMissions} />
      <Route path="/espace-technicien/mission/:id" component={TechnicienMission} />
      <Route path="/espace-technicien/historique" component={TechnicienHistorique} />

      {/* Espace direction */}
      <Route path="/direction/connexion" component={DGLogin} />
      <Route path="/direction/dashboard" component={DGDashboard} />
      <Route path="/direction/commandes/:id" component={DGCommandeDetail} />
      <Route path="/direction/commandes" component={DGCommandes} />
      <Route path="/direction/reparations" component={DGReparations} />
      <Route path="/direction/commercial" component={DGCommercial} />

      {/* Espace commercial */}
      <Route path="/espace-commercial/connexion" component={CommercialLogin} />
      <Route path="/espace-commercial/dashboard" component={CommercialDashboard} />
      <Route path="/espace-commercial/calendrier" component={CommercialCalendrier} />
      <Route path="/espace-commercial/reunions" component={CommercialReunions} />
      <Route path="/espace-commercial/ventes" component={CommercialVentes} />

      {/* Formulaires publics (standalone, sans Navbar/Footer) */}
      <Route path="/demande-devis" component={DemandeDevis} />
      <Route path="/demande-intervention" component={DemandeIntervention} />

      {/* Manager — demandes entrantes */}
      <Route path="/espace-manager/demandes" component={AdminDemandes} />

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
              <Route path="/workspace" component={Workspace} />
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
    <GoogleAuthProvider>
    <ClientAuthProvider>
      <ManagerAuthProvider>
        <TechnicienAuthProvider>
        <DGAuthProvider>
        <CommercialAuthProvider>
          <QueryClientProvider client={queryClient}>
            <I18nProvider>
              <TooltipProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
                <Toaster />
              </TooltipProvider>
            </I18nProvider>
          </QueryClientProvider>
        </CommercialAuthProvider>
        </DGAuthProvider>
        </TechnicienAuthProvider>
      </ManagerAuthProvider>
    </ClientAuthProvider>
    </GoogleAuthProvider>
  );
}

export default App;
