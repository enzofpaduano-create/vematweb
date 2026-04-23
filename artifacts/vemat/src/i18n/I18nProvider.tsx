import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { translations, Lang } from "./translations";

type I18nContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  tArray: (key: string) => string[];
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "vemat.lang";

function getNested(obj: any, path: string): any {
  return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "fr";
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    return stored === "en" || stored === "fr" ? stored : "fr";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);

  const t = (key: string): string => {
    const v = getNested(translations[lang], key);
    if (typeof v === "string") return v;
    const fallback = getNested(translations.fr, key);
    return typeof fallback === "string" ? fallback : key;
  };

  const tArray = (key: string): string[] => {
    const v = getNested(translations[lang], key);
    if (Array.isArray(v)) return v as string[];
    const fallback = getNested(translations.fr, key);
    return Array.isArray(fallback) ? (fallback as string[]) : [];
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, tArray }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useLang must be used within I18nProvider");
  return ctx;
}
