import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, LogOut, WifiOff } from "lucide-react";
import { useState } from "react";
import { useTechnicienAuth } from "@/contexts/TechnicienAuthContext";
import vematLogo from "@/assets/vemat-logo.png";

const RETURN_KEY = "vemat-tech-return";

/** Installe (une seule fois) le manifeste et le service worker, limités à /espace-technicien/. */
function usePwa() {
  useEffect(() => {
    if (!document.querySelector('link[rel="manifest"][data-rapports]')) {
      const l = document.createElement("link");
      l.rel = "manifest";
      l.href = "/manifest-rapports.webmanifest";
      l.setAttribute("data-rapports", "1");
      document.head.appendChild(l);
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw-rapports.js", { scope: "/espace-technicien/" })
        .catch(() => { /* l'application fonctionne sans, seulement pas hors-ligne */ });
    }
  }, []);
}

function useOnline() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online;
}

export function RapportLayout({ children, title, back }: { children: React.ReactNode; title: string; back?: string }) {
  const [location, navigate] = useLocation();
  const { technician, signOut, loading, user } = useTechnicienAuth();
  const online = useOnline();
  usePwa();

  useEffect(() => {
    if (!loading && !user) {
      try { sessionStorage.setItem(RETURN_KEY, location); } catch { /* ignoré */ }
      navigate("/espace-technicien/connexion");
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-3 py-2 flex items-center gap-2">
        {back ? (
          <Link href={back} aria-label="Retour" className="p-2 -ml-1 rounded-lg text-zinc-300 hover:bg-zinc-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        ) : (
          <img src={vematLogo} alt="Vemat" className="h-7 w-auto brightness-0 invert ml-1" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate">{title}</p>
          <p className="text-[10px] text-zinc-500 truncate">{technician?.name ?? ""}</p>
        </div>
        <button
          onClick={async () => { await signOut(); navigate("/espace-technicien/connexion"); }}
          className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
          aria-label="Déconnexion"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>
      {!online && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs px-4 py-2 flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5 shrink-0" /> Hors connexion — vos rapports sont gardés sur le téléphone et partiront dès le retour du réseau.
        </div>
      )}
      <main className="max-w-2xl mx-auto px-3 pb-28 pt-4">{children}</main>
    </div>
  );
}
