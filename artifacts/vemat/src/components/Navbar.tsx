import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Phone, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/grues", label: "Grues" },
    { href: "/nacelles", label: "Nacelles" },
    { href: "/elevateurs-telescopiques", label: "Élévateurs Télescopiques" },
    { href: "/construction", label: "Construction" },
    { href: "/services", label: "Services" },
    { href: "/a-propos", label: "À Propos" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b shadow-sm py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className={`font-heading font-bold text-2xl tracking-tighter transition-colors ${isScrolled ? "text-foreground" : "text-white"}`}>
              VEMAT<span className="text-accent">.</span>GROUP
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

            <div className="flex items-center gap-4 border-l border-white/20 pl-4">
              <span className={`text-xs font-bold uppercase ${isScrolled ? "text-foreground" : "text-white"}`}>FR</span>
              <span className={`text-xs text-muted-foreground`}>/ EN</span>
              <Link href="/contact" className="ml-2">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-none font-semibold">
                  Demander un devis
                </Button>
              </Link>
            </div>
          </nav>

          {/* Mobile Nav */}
          <div className="lg:hidden flex items-center gap-4">
            <Link href="/contact">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-none font-semibold">
                Devis
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
                    <Link href="/contact" className={`text-lg font-medium transition-colors hover:text-accent ${
                      location === "/contact" ? "text-accent" : "text-foreground"
                    }`}>
                      Contact
                    </Link>
                  </nav>
                  
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
