import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

/**
 * Accueil : animation pilotée par le scroll (grue Terex RT qui monte sur le porte-char,
 * lève le logo Vemat, rampes qui se replient). Séquence d'images WebP dessinée sur un canvas.
 */

const FRAME_COUNT = 120;
const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const frameUrl = (set: "d" | "m", i: number) =>
  `${BASE}/images/hero-anim/${set}/f-${String(i + 1).padStart(3, "0")}.webp`;

// Part du scroll consacrée à l'animation ; le reste laisse le texte final à l'écran.
const ANIM_END = 0.82;

interface ScrollHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
}

export function ScrollHero({ eyebrow, title, subtitle, cta }: ScrollHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentRef = useRef(0);
  const reduce = useReducedMotion();
  const [set] = useState<"d" | "m">(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "m" : "d",
  );

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  // Deux phrases du sous-titre, affichées l'une après l'autre.
  const sentences = subtitle.split(/(?<=\.)\s+/).filter(Boolean);

  // Dessin d'une image, en mode « contain » ancré en bas, fond blanc.
  const draw = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imgs = imagesRef.current;
    // Image la plus proche déjà chargée.
    let img: HTMLImageElement | undefined;
    for (let d = 0; d < FRAME_COUNT; d++) {
      const a = imgs[index - d];
      if (a && a.complete && a.naturalWidth) { img = a; break; }
      const b = imgs[index + d];
      if (b && b.complete && b.naturalWidth) { img = b; break; }
    }
    if (!img) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (w < 768) {
      // Mobile : la scène remplit la hauteur du canvas, recadrée sur l'action
      // (la grue part de la gauche puis se centre sur le porte-char).
      const scale = Math.min(h / ih, (1.6 * w) / iw);
      const dw = iw * scale;
      const dh = ih * scale;
      const focus = 0.35 + 0.25 * (index / (FRAME_COUNT - 1));
      const x = Math.min(0, Math.max(w - dw, w / 2 - focus * dw));
      ctx.drawImage(img, x, h - dh + dh * 0.12, dw, dh);
    } else {
      // Ordinateur : « contain » ancré en bas, décalé vers le bas pour couper une partie
      // du reflet au sol et laisser l'angle haut-gauche libre pour le texte.
      // La scène occupe ~88 % de la largeur, calée à droite : le texte garde la colonne de gauche.
      const scale = Math.min((0.88 * w) / iw, h / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.drawImage(img, w - dw, h - dh + dh * 0.12, dw, dh);
    }
  };

  const indexFor = (p: number) =>
    Math.min(FRAME_COUNT - 1, Math.max(0, Math.round((Math.min(p, ANIM_END) / ANIM_END) * (FRAME_COUNT - 1))));

  // Préchargement : première image en priorité, puis le reste.
  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    const startIndex = reduce ? FRAME_COUNT - 1 : 0;
    const first = new Image();
    first.src = frameUrl(set, startIndex);
    first.onload = () => draw(currentRef.current);
    imgs[startIndex] = first;
    imagesRef.current = imgs;
    if (reduce) return;
    let cancelled = false;
    const loadRest = () => {
      for (let i = 0; i < FRAME_COUNT; i++) {
        if (cancelled) return;
        if (imgs[i]) continue;
        const im = new Image();
        im.decoding = "async";
        im.src = frameUrl(set, i);
        im.onload = () => {
          if (Math.abs(i - currentRef.current) < 3) draw(currentRef.current);
        };
        imgs[i] = im;
      }
    };
    const id = window.setTimeout(loadRest, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set, reduce]);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (reduce) return;
    const i = indexFor(p);
    if (i !== currentRef.current) {
      currentRef.current = i;
      requestAnimationFrame(() => draw(i));
    }
  });

  useEffect(() => {
    if (reduce) currentRef.current = FRAME_COUNT - 1;
    const onResize = () => draw(currentRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  // Apparition progressive du texte.
  const s1Opacity = useTransform(scrollYProgress, [0.22, 0.34], [0, 1]);
  const s1Y = useTransform(scrollYProgress, [0.22, 0.34], [24, 0]);
  const s2Opacity = useTransform(scrollYProgress, [0.42, 0.54], [0, 1]);
  const s2Y = useTransform(scrollYProgress, [0.42, 0.54], [24, 0]);
  const ctaOpacity = useTransform(scrollYProgress, [0.62, 0.72], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.62, 0.72], [16, 0]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);

  const still = !!reduce;

  return (
    <section
      ref={sectionRef}
      aria-label={title}
      className={`relative bg-white ${still ? "" : "h-[320vh] md:h-[360vh]"}`}
    >
      <div className={`${still ? "relative h-[100svh]" : "sticky top-0 h-[100svh]"} overflow-hidden bg-white`}>
        <canvas
          ref={canvasRef}
          className="absolute inset-x-0 bottom-0 w-full h-[45%] md:h-full"
          aria-hidden="true"
        />

        <div className="relative z-10 container mx-auto px-4 md:px-6 pt-28 md:pt-32">
          <div className="max-w-xl lg:max-w-[38%]">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="flex items-center gap-3 mb-5"
            >
              <span className="block w-8 h-px bg-accent" />
              <span className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.32em] text-accent">
                {eyebrow}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="hero-display text-[2.4rem] sm:text-5xl lg:text-[3.2rem] xl:text-[3.9rem] text-zinc-950 leading-[0.98] text-balance mb-6"
            >
              {title}
            </motion.h1>

            <div className="space-y-2 text-[15px] md:text-base xl:text-lg text-zinc-600 leading-relaxed max-w-md">
              {sentences.map((s, i) => (
                <motion.p
                  key={i}
                  style={still ? undefined : { opacity: i === 0 ? s1Opacity : s2Opacity, y: i === 0 ? s1Y : s2Y }}
                  className="[text-shadow:0_0_14px_#fff,0_0_4px_#fff]"
                >
                  {s}
                </motion.p>
              ))}
            </div>

            <motion.div style={still ? undefined : { opacity: ctaOpacity, y: ctaY }} className="mt-7">
              <Link
                href={cta.href}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs md:text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
              >
                {cta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>

        {!still && (
          <motion.div
            style={{ opacity: hintOpacity }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-zinc-400"
            aria-hidden="true"
          >
            <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
            <span className="block h-8 w-px bg-zinc-300 animate-pulse" />
          </motion.div>
        )}
      </div>
    </section>
  );
}
