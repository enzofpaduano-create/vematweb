import { useEffect } from "react";
import { useLocation } from "wouter";

const SITE = "https://www.vematgroup.com";

/**
 * À chaque changement de page : remonte en haut et déclare l'adresse canonique
 * de la page courante (sans paramètres, sans « / » final). Chaque page est ainsi
 * sa propre référence, jamais une copie de l'accueil.
 */
export function ScrollToTop() {
  const [pathname] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Lien avec ancre (ex. /a-propos#nigeria) : on attend que la section soit affichée.
    const id = window.location.hash.replace("#", "");
    let tries = 0;
    let timer: number | undefined;
    if (id) {
      const seek = () => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else if (tries++ < 20) timer = window.setTimeout(seek, 150);
      };
      timer = window.setTimeout(seek, 150);
    }
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
    const url = `${SITE}${path === "/" ? "/" : path}`;
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);
    const og = document.querySelector('meta[property="og:url"]');
    if (og) og.setAttribute("content", url);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
