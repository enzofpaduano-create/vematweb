import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "./ui/button";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  image?: string;
  images?: string[];
  intervalMs?: number;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  overlayOpacity?: number;
  eyebrow?: string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function HeroSection({
  title,
  subtitle,
  image,
  images,
  intervalMs = 5000,
  primaryCta,
  secondaryCta,
  overlayOpacity = 0.5,
  eyebrow,
}: HeroSectionProps) {
  const slideList = images && images.length > 0 ? images : image ? [image] : [];

  const [orderedSlides] = useState(() => (slideList.length > 1 ? shuffleArray(slideList) : slideList));
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (orderedSlides.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % orderedSlides.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [orderedSlides.length, intervalMs]);

  useEffect(() => {
    if (orderedSlides.length <= 1) return;
    [1, 2].forEach((offset) => {
      const next = orderedSlides[(index + offset) % orderedSlides.length];
      const img = new Image();
      img.src = next;
    });
  }, [index, orderedSlides]);

  const current = orderedSlides[index] ?? "";

  return (
    <section className="relative min-h-[85vh] md:min-h-screen flex items-center overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 z-0">
        {orderedSlides.map((src, i) => {
          const distance = Math.min(
            Math.abs(i - index),
            orderedSlides.length - Math.abs(i - index),
          );
          if (distance > 1) return null;
          const isActive = i === index;
          return (
            <motion.img
              key={src}
              src={src}
              alt=""
              initial={false}
              animate={{
                opacity: isActive ? 1 : 0,
                scale: isActive ? 1 : 1.08,
              }}
              transition={{
                opacity: { duration: 1.6, ease: "easeInOut" },
                scale: { duration: Math.max(intervalMs / 1000 + 1.5, 6.5), ease: "easeOut" },
              }}
              className="absolute inset-0 w-full h-full object-cover object-center"
              draggable={false}
            />
          );
        })}

        <div
          className="absolute inset-0 bg-zinc-950/20"
          style={{ opacity: overlayOpacity }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/85 via-zinc-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-zinc-950/5 to-zinc-950/30" />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="max-w-4xl">
          {eyebrow && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="flex items-center gap-3 mb-6"
            >
              <span className="block w-10 h-px bg-accent" />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-accent">
                {eyebrow}
              </span>
            </motion.div>
          )}

          <div className="overflow-hidden mb-6">
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-[2.25rem] sm:text-[2.75rem] md:text-5xl lg:text-6xl xl:text-[4.5rem] font-heading font-extrabold text-white leading-[0.98] tracking-[-0.035em] text-balance drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)]">
                {title}
              </h1>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="text-lg md:text-2xl text-zinc-200 max-w-2xl mb-12 leading-relaxed font-medium drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
          >
            {subtitle}
          </motion.p>

          {(primaryCta || secondaryCta) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
              className="flex flex-col sm:flex-row gap-5"
            >
              {primaryCta && (
                <Link href={primaryCta.href}>
                  <Button
                    size="lg"
                    className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full font-extrabold px-10 h-16 text-base w-full sm:w-auto uppercase tracking-widest shadow-gold transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    {primaryCta.label}
                  </Button>
                </Link>
              )}
              {secondaryCta && (
                <Link href={secondaryCta.href}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/40 text-white hover:bg-white hover:text-zinc-950 rounded-full font-extrabold px-10 h-16 text-base w-full sm:w-auto bg-white/5 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 uppercase tracking-widest"
                  >
                    {secondaryCta.label}
                  </Button>
                </Link>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {orderedSlides.length > 1 && (
        <div className="absolute bottom-6 md:bottom-8 right-4 md:right-8 z-10 flex items-center gap-3 text-white/80">
          <span className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase tabular-nums">
            {String(index + 1).padStart(2, "0")}
            <span className="text-white/40 mx-1">/</span>
            {String(orderedSlides.length).padStart(2, "0")}
          </span>
          <div className="relative w-24 md:w-32 h-px bg-white/20 overflow-hidden">
            <motion.div
              key={index}
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1, originX: 0 }}
              transition={{ duration: intervalMs / 1000, ease: "linear" }}
              className="absolute inset-0 bg-accent"
            />
          </div>
        </div>
      )}

      <div className="absolute right-0 bottom-0 top-0 w-1/4 bg-gradient-to-l from-accent/5 to-transparent pointer-events-none hidden lg:block" />
    </section>
  );
}
