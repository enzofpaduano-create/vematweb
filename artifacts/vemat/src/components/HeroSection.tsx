import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "./ui/button";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  image: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  overlayOpacity?: number;
}

export function HeroSection({
  title,
  subtitle,
  image,
  primaryCta,
  secondaryCta,
  overlayOpacity = 0.6,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-[80vh] md:min-h-screen flex items-center pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover object-center"
        />
        <div 
          className="absolute inset-0 bg-zinc-950" 
          style={{ opacity: overlayOpacity }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white leading-tight mb-6">
              {title}
            </h1>
            <p className="text-xl md:text-2xl text-zinc-300 max-w-2xl mb-10 leading-relaxed">
              {subtitle}
            </p>
            
            {(primaryCta || secondaryCta) && (
              <div className="flex flex-col sm:flex-row gap-4">
                {primaryCta && (
                  <Link href={primaryCta.href}>
                    <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-none font-bold px-8 h-14 text-base w-full sm:w-auto">
                      {primaryCta.label}
                    </Button>
                  </Link>
                )}
                {secondaryCta && (
                  <Link href={secondaryCta.href}>
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-zinc-950 rounded-none font-bold px-8 h-14 text-base w-full sm:w-auto bg-transparent">
                      {secondaryCta.label}
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
