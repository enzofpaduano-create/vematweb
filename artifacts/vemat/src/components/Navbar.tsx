import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Phone, Mail } from "lucide-react";
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
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // On any route other than the home page, the page content starts at the top
  // with a light background, so always render the navbar in its "scrolled"
  // (light/opaque) variant to keep links readable.
  const isScrolled = scrolled || location !== "/";

  const navLinks = [
    { href: "/grues", label: t("nav.grues") },
    { href: "/nacelles", label: t("nav.nacelles") },
    { href: "/elevateurs-telescopiques", label: t("nav.elevateurs") },
    { href: "/construction", label: t("nav.construction") },
    { href: "/services", label: t("nav.services") },
    { href: "/a-propos", label: t("nav.apropos") },
  ];

  const LangSwitch = ({ dark = false }: { dark?: boolean }) => (
    <div
      className={`inline-flex items-center text-xs font-bold uppercase tracking-wider border ${
        dark ? "border-zinc-300 bg-white" : "border-white/30 bg-white/10 backdrop-blur"
      }`}
    >
      {(["fr", "en"] as const).map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={`px-2.5 py-1 transition-colors ${
              active
                ? "bg-accent text-accent-foreground"
                : dark
                ? "text-zinc-700 hover:text-zinc-950"
                : "text-white/80 hover:text-white"
            }`}
            aria-pressed={active}
            data-testid={`lang-${code}`}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span
              className={`inline-flex items-center justify-center px-3 py-2 transition-colors ${
                isScrolled ? "bg-transparent" : "bg-white/95"
              }`}
            >
              <img
                src={vematLogo}
                alt="Vemat Group"
                className="h-9 md:h-10 w-auto object-contain"
              />
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <ul className="flex items-center gap-6">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm font-medium transition-colors hover:text-accent ${
                      location === link.href
                        ? "text-accent"
                        : isScrolled
                        ? "text-foreground"
                        : "text-white/90"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className={`flex items-center gap-4 border-l pl-4 ${isScrolled ? "border-zinc-200" : "border-white/20"}`}>
              <LangSwitch dark={isScrolled} />
              <Link href="/contact">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-none font-semibold">
                  {t("nav.devis")}
                </Button>
              </Link>
            </div>
          </nav>

          {/* Mobile Nav */}
          <div className="lg:hidden flex items-center gap-3">
            <LangSwitch dark={isScrolled} />
            <Link href="/contact">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-none font-semibold">
                {t("nav.devisShort")}
              </Button>
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={isScrolled ? "text-foreground" : "text-white"}>
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-background w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full mt-8">
                  <div className="mb-8">
                    <img src={vematLogo} alt="Vemat Group" className="h-10 w-auto" />
                  </div>
                  <nav className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`text-lg font-medium transition-colors hover:text-accent ${
                          location === link.href ? "text-accent" : "text-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                    <Link
                      href="/contact"
                      className={`text-lg font-medium transition-colors hover:text-accent ${
                        location === "/contact" ? "text-accent" : "text-foreground"
                      }`}
                    >
                      {t("nav.contact")}
                    </Link>
                  </nav>

                  <div className="mt-8">
                    <LangSwitch dark />
                  </div>

                  <div className="mt-auto pb-8 space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">+212 650 14 64 64</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">contact@vemat.ma</span>
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
