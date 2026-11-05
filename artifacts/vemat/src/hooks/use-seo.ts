import { useEffect } from "react";

const SITE = "https://www.vematgroup.com";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSEO(title: string, description: string) {
  useEffect(() => {
    const fullTitle = `${title} | Vemat Group`;
    const url = `${SITE}${window.location.pathname}`;
    document.title = fullTitle;
    setMeta("name", "description", description);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("name", "twitter:title", fullTitle);
    setCanonical(url);
  }, [title, description]);
}

export function useScrollTop() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
}
