import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

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
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
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
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <VematAssistant />
      <FloatingWhatsApp />
    </div>
  );
}

function App() {
  return (
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
  );
}

export default App;
