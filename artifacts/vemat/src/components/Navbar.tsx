import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Phone, Mail, LayoutGrid } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useLang } from "@/i18n/I18nProvider";
import vematLogo from "@/assets/vemat-logo.png";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { lang, setLang, t } = useLang();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = location === "/";
  const isScrolled = scrolled || !isHome;

  const navLinks = [
    { href: "/grues", label: t("nav.grues") },
    { href: "/nacelles", label: t("nav.nacelles") },
    { href: "/elevateurs-telescopiques", label: t("nav.elevateurs") },
    { href: "/construction", label: t("nav.construction") },
    { href: "/services", label: t("nav.services") },
    { href: "/pieces-de-rechange", label: t("nav.pdr") },
    { href: "/blog", label: t("nav.blog") },
    { href: "/a-propos", label: t("nav.apropos") },
  ];

  const LangSwitch = ({ dark = false }: { dark?: boolean }) => (
    <div
      className={`inline-flex items-center overflow-hidden rounded-full border transition-all duration-300 ${
        dark
          ? "border-zinc-200 bg-white/50 backdrop-blur-sm"
          : "border-white/20 bg-white/10 backdrop-blur-md"
      }`}
    >
      {(["fr", "en"] as const).map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
              active
                ? "bg-accent text-accent-foreground shadow-sm"
                : dark
                ? "text-zinc-600 hover:text-zinc-950"
                : "text-white/70 hover:text-white"
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-700 px-4 md:px-8 pt-4 pointer-events-none">
      <div
        className={`w-full transition-all duration-700 pointer-events-auto ${
          isScrolled
            ? "bg-white/70 backdrop-blur-xl border border-zinc-200/50 py-3 px-5 xl:px-6 rounded-full shadow-2xl"
            : "bg-transparent py-4 px-0"
        }`}
      >
        <div className="flex items-center justify-between gap-4 xl:gap-8">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className={`transition-all duration-700 ${scrolled ? "scale-90" : "scale-100"}`}>
              <img
                src={vematLogo}
                alt="Vemat Group"
                className={`h-10 md:h-12 w-auto object-contain transition-all duration-700 ${
                  isScrolled
                    ? "brightness-0"
                    : "brightness-0 invert drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                }`}
              />
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex min-w-0 flex-1 items-center justify-end gap-4 xl:gap-6">
            <ul className="flex min-w-0 items-center gap-1 xl:gap-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`relative px-2 py-2 text-[11px] xl:px-3 xl:text-[12px] font-bold uppercase tracking-wider transition-all duration-300 rounded-full ${
                      location === link.href
                        ? "text-accent"
                        : isScrolled
                        ? "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                        : "text-white/90 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex shrink-0 items-center gap-3 xl:gap-4 border-l border-zinc-200/50 pl-3 xl:pl-6">
              <a
                href="https://www.linkedin.com/company/vemat-group-ltd/posts/?feedView=all"
                target="_blank"
                rel="noopener noreferrer"
                className={`transition-all duration-300 hover:text-accent hover:scale-110 ${isScrolled ? "text-zinc-400" : "text-white/70"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <LangSwitch dark={isScrolled} />

              {/* Portail Vemat */}
              <Link
                href="/espace-vemat"
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all hover:border-accent hover:text-accent ${
                  isScrolled ? "border-zinc-300 text-zinc-600" : "border-white/30 text-white/80"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Portail</span>
              </Link>
            </div>
          </nav>

          {/* Mobile Nav */}
          <div className="lg:hidden flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={`rounded-full transition-colors ${isScrolled ? "text-zinc-950" : "text-white"}`}>
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-white text-zinc-950 border-zinc-100 w-[300px]">
                <div className="flex flex-col h-full mt-8">
                  <div className="mb-12 p-2 bg-zinc-950 inline-block rounded-lg self-start">
                    <img src={vematLogo} alt="Vemat Group" className="h-8 w-auto" />
                  </div>
                  <nav className="flex flex-col gap-6">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`text-xl font-black uppercase tracking-widest transition-colors hover:text-accent ${
                          location === link.href ? "text-accent" : "text-zinc-950"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>

                  <div className="mt-12">
                    <LangSwitch dark />
                  </div>

                  <div className="mt-8">
                    <Link
                      href="/espace-vemat"
                      className="flex items-center gap-2 text-sm font-bold text-zinc-700 hover:text-accent transition-colors"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      Portail Vemat
                    </Link>
                  </div>

                  <div className="mt-auto pb-12 space-y-6">
                    <div className="flex items-center gap-4 text-zinc-500 group">
                      <div className="p-3 rounded-full bg-zinc-50 group-hover:bg-accent/20 group-hover:text-accent transition-all">
                        <Phone className="h-5 w-5" />
                      </div>
                      <span className="font-bold">+212 650 14 64 64</span>
                    </div>
                    <div className="flex items-center gap-4 text-zinc-500 group">
                      <div className="p-3 rounded-full bg-zinc-50 group-hover:bg-accent/20 group-hover:text-accent transition-all">
                        <Mail className="h-5 w-5" />
                      </div>
                      <span className="font-bold">contact@vemat.ma</span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
