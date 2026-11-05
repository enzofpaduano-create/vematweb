import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { heroSlides } from "@/data/heroSlides";

/** Diaporama « Sur le terrain » (anciennes photos de l'accueil), page À propos. */
export function FieldGallery({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = heroSlides.length;

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % n), 4500);
    return () => clearInterval(id);
  }, [paused, n]);

  useEffect(() => {
    const img = new Image();
    img.src = heroSlides[(index + 1) % n];
  }, [index, n]);

  const go = (d: number) => setIndex((i) => (i + d + n) % n);

  return (
    <section className="py-24 bg-zinc-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="block w-8 h-px bg-accent" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-accent">{eyebrow}</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-heading font-extrabold tracking-tight text-zinc-950 mb-4">{title}</h2>
        <p className="text-lg text-zinc-600 max-w-2xl mb-10">{subtitle}</p>

        <div
          className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-zinc-900"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence initial={false}>
            <motion.img
              key={index}
              src={heroSlides[index]}
              alt=""
              loading="lazy"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 1 }, scale: { duration: 5, ease: "easeOut" } }}
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          </AnimatePresence>

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4 md:p-6 bg-gradient-to-t from-black/50 to-transparent">
            <span className="text-xs font-semibold tracking-[0.3em] text-white/90 tabular-nums">
              {String(index + 1).padStart(2, "0")} <span className="text-white/50">/ {String(n).padStart(2, "0")}</span>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Photo précédente"
                className="rounded-full bg-white/15 p-2 text-white backdrop-blur hover:bg-white/30 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Photo suivante"
                className="rounded-full bg-white/15 p-2 text-white backdrop-blur hover:bg-white/30 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
