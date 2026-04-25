import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "./ui/button";

interface CTASectionProps {
  title: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  background?: "dark" | "accent";
}

export function CTASection({ title, description, primaryCta, secondaryCta, background = "dark" }: CTASectionProps) {
  const isDark = background === "dark";
  
  return (
    <section className={`py-24 ${isDark ? "bg-zinc-950 text-white" : "bg-accent text-accent-foreground"}`}>
      <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 tracking-tight">
            {title}
          </h2>
          <p className={`text-lg md:text-xl mb-10 leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-900/80"}`}>
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={primaryCta.href}>
              <Button 
                size="lg" 
                className={`rounded-full font-black uppercase tracking-widest px-10 h-16 text-[10px] md:text-xs w-full sm:w-auto shadow-gold transition-all duration-300 hover:scale-105 ${
                  isDark 
                    ? "bg-accent text-accent-foreground hover:bg-accent/90" 
                    : "bg-zinc-950 text-white hover:bg-zinc-900"
                }`}
              >
                {primaryCta.label}
              </Button>
            </Link>
            {secondaryCta && (
              <Link href={secondaryCta.href}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className={`rounded-full font-black uppercase tracking-widest px-10 h-16 text-[10px] md:text-xs w-full sm:w-auto bg-transparent transition-all duration-300 hover:scale-105 ${
                    isDark 
                      ? "border-white text-white hover:bg-white hover:text-zinc-950" 
                      : "border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white"
                  }`}
                >
                  {secondaryCta.label}
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
