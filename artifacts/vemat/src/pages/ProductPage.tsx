import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { toMetric } from "@/lib/units";
import { translateSpecKey } from "@/data/specKeyTranslations";
import { ArrowLeft, CheckCircle2, FileText, ChevronRight, PlayCircle, ExternalLink } from "lucide-react";
import { productDetails } from "@/data/productDetails";
import { productInteractiveViews } from "@/data/productInteractiveViews";
import { mecalacOfficialContent } from "@/data/mecalacOfficialContent";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useLang } from "@/i18n/I18nProvider";
import type { ProductInteractiveExteriorView, ProductInteractiveView } from "@/types/product";

function getYouTubeId(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.split("/").filter(Boolean).pop() || null;
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/watch")) {
        return parsed.searchParams.get("v");
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/").filter(Boolean).pop() || null;
      }
    }
  } catch (_error) {
    return null;
  }

  return null;
}

function getExteriorFrameUrl(exterior: ProductInteractiveExteriorView, frameIndex: number) {
  const extension = exterior.imageExtension || "jpg";
  return `${exterior.imagePath}${frameIndex + 1}.${extension}`;
}

function mod(value: number, base: number) {
  return ((value % base) + base) % base;
}

function ProductInteractiveSection({
  interactiveView,
  t,
}: {
  interactiveView: ProductInteractiveView;
  t: (key: string) => string;
}) {
  const tabs = useMemo(() => {
    const items: Array<{ key: "exterior" | "lowerCabin" | "upperCabin"; label: string }> = [];

    if (interactiveView.exterior) {
      items.push({ key: "exterior", label: t("product.exterior") });
    }

    if (interactiveView.lowerCabin) {
      items.push({ key: "lowerCabin", label: t("product.lowerCabin") });
    }

    if (interactiveView.upperCabin) {
      items.push({ key: "upperCabin", label: t("product.upperCabin") });
    }

    return items;
  }, [interactiveView.exterior, interactiveView.lowerCabin, interactiveView.upperCabin, t]);

  const [activeTab, setActiveTab] = useState<"exterior" | "lowerCabin" | "upperCabin">(tabs[0]?.key || "exterior");
  const [frameIndex, setFrameIndex] = useState(0);
  const dragRef = useRef({ active: false, x: 0 });
  const exterior = interactiveView.exterior;
  const frameCount = exterior?.frameCount || 0;

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [activeTab, tabs]);

  useEffect(() => {
    setFrameIndex(0);
  }, [exterior?.imagePath]);

  useEffect(() => {
    if (!exterior || activeTab !== "exterior") return;

    for (let index = 0; index < exterior.frameCount; index += 1) {
      const img = new Image();
      img.src = getExteriorFrameUrl(exterior, index);
    }
  }, [activeTab, exterior]);

  const rotateBy = (step: number) => {
    if (!frameCount) return;
    setFrameIndex((current) => mod(current + step, frameCount));
  };

  const handlePointerDown = (event: any) => {
    if (!frameCount) return;
    dragRef.current = { active: true, x: event.clientX };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: any) => {
    if (!dragRef.current.active || !frameCount) return;

    const delta = event.clientX - dragRef.current.x;
    const stepSize = 18;
    const steps = Math.trunc(delta / stepSize);

    if (steps !== 0) {
      setFrameIndex((current) => mod(current - steps, frameCount));
      dragRef.current.x = event.clientX;
    }
  };

  const stopDragging = () => {
    dragRef.current.active = false;
  };

  const activeIframeUrl =
    activeTab === "lowerCabin"
      ? interactiveView.lowerCabin?.url
      : activeTab === "upperCabin"
        ? interactiveView.upperCabin?.url
        : null;

  if (tabs.length === 0) return null;

  return (
    <section className="mt-20">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 flex items-center gap-4">
          {t("product.interactiveView")}
          <div className="h-px flex-grow bg-zinc-100" />
        </h3>
        {interactiveView.sourceUrl && (
          <a
            href={interactiveView.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-accent"
          >
            {t("product.openOnSupplierSite")}
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full border px-5 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${
              activeTab === tab.key
                ? "border-accent bg-accent text-accent-foreground shadow-gold"
                : "border-zinc-200 bg-white text-zinc-500 hover:border-accent/30 hover:text-zinc-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-zinc-100 bg-white shadow-soft">
        {activeTab === "exterior" && exterior ? (
          <>
            <div
              className="relative aspect-[16/10] overflow-hidden bg-zinc-50 select-none touch-none cursor-ew-resize md:aspect-[16/8.5]"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDragging}
              onPointerLeave={stopDragging}
            >
              <img
                src={getExteriorFrameUrl(exterior, frameIndex)}
                alt="360 exterior view"
                draggable={false}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col gap-3 border-t border-zinc-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm font-semibold text-zinc-500">
                {t("product.dragToRotate")}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => rotateBy(-1)}
                  aria-label="Previous frame"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-accent hover:text-accent"
                >
                  <span className="text-lg leading-none">{"<"}</span>
                </button>
                <span className="min-w-20 text-center text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                  {frameCount ? `${frameIndex + 1} / ${frameCount}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => rotateBy(1)}
                  aria-label="Next frame"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-accent hover:text-accent"
                >
                  <span className="text-lg leading-none">{">"}</span>
                </button>
              </div>
            </div>
          </>
        ) : activeIframeUrl ? (
          <iframe
            src={activeIframeUrl}
            title={tabs.find((tab) => tab.key === activeTab)?.label || "Interactive cabin view"}
            loading="lazy"
            allow="fullscreen; vr"
            allowFullScreen
            className="h-[400px] w-full bg-zinc-50 md:h-[720px]"
          />
        ) : null}
      </div>
    </section>
  );
}

export default function ProductPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const product = productDetails[slug] as any;
  const { t, lang } = useLang();
  useScrollTop();

  if (!product) {
    return (
      <div className="min-h-screen pt-48 pb-24 container mx-auto px-4 md:px-6 text-center">
        <h1 className="text-4xl font-heading font-extrabold mb-6 tracking-tight">{t("product.notFound")}</h1>
        <Link href="/">
          <Button variant="outline" className="rounded-full px-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("product.backToCatalog")}
          </Button>
        </Link>
      </div>
    );
  }

  const getName = (val: any) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[lang] || val["en"] || "";
  };

  const getDesc = (val: any) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[lang] || val["en"] || "";
  };

  const name = getName(product.name);
  // Full Mecalac scraped content (language-neutral assets: images, downloads)
  const mecalacFull = product.brand === "Mecalac" ? mecalacOfficialContent[slug] : undefined;
  // French-only text content (detailSections, accessories, long description)
  const mecalacFr = lang === "fr" ? mecalacFull : undefined;
  const description =
    mecalacFr?.descriptionFr ?? getDesc(product.description);
  const specs = product.specifications;
  const currentImages =
    mecalacFull?.images && mecalacFull.images.length > 0 ? mecalacFull.images : product.images;
  const currentVideos = Array.isArray(product.videos) ? product.videos : [];
  const interactiveView = productInteractiveViews[slug];
  const currentDownloads =
    mecalacFull?.downloads && mecalacFull.downloads.length > 0 ? mecalacFull.downloads : product.downloads;
  const currentDetailSections = Array.isArray(mecalacFr?.detailSections) ? mecalacFr.detailSections : [];
  const currentAccessories = Array.isArray(mecalacFr?.accessories) ? mecalacFr.accessories : [];
  const getFeatures = () => {
    if (!product.features) return [];
    if (Array.isArray(product.features)) return product.features;
    return product.features[lang] || product.features["en"] || [];
  };

  const currentFeatures = getFeatures();

  useSEO(`${name} - ${product.brand}`, description || "");

  return (
    <div className="min-h-screen pt-32 pb-24 bg-white selection:bg-accent selection:text-white">
      <div className="container mx-auto px-4 md:px-6">
        {/* Breadcrumb / Back Link */}
        <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 mb-12">
          <Link href="/" className="hover:text-accent transition-colors">Vemat</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-zinc-900">{name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24">
          {/* Left Column: Visuals */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {currentImages && currentImages.length > 0 ? (
              <div className="relative group">
                <Carousel className="w-full">
                  <CarouselContent>
                    {currentImages.map((img: any, index: number) => (
                      <CarouselItem key={index}>
                        <div className="aspect-[4/5] md:aspect-square rounded-3xl bg-zinc-50 flex items-center justify-center overflow-hidden border border-zinc-100 shadow-soft">
                          <img
                            src={img.path}
                            alt={`${name}`}
                            className="w-full h-full object-contain p-8 md:p-12 group-hover:scale-110 transition-transform duration-700 ease-in-out"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="absolute bottom-6 right-6 flex gap-2">
                    <CarouselPrevious className="relative inset-0 translate-y-0 h-10 w-10 bg-white/80 backdrop-blur shadow-sm border-none hover:bg-accent hover:text-white" />
                    <CarouselNext className="relative inset-0 translate-y-0 h-10 w-10 bg-white/80 backdrop-blur shadow-sm border-none hover:bg-accent hover:text-white" />
                  </div>
                </Carousel>
              </div>
            ) : (
              <div className="aspect-square rounded-3xl bg-zinc-50 flex items-center justify-center border border-zinc-100 shadow-soft">
                <span className="text-zinc-300 font-bold uppercase tracking-widest">{t("product.noImage")}</span>
              </div>
            )}
          </motion.div>

          {/* Right Column: Information */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col"
          >
            <div className="mb-10">
              {product.brand && (
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-zinc-950 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-zinc-950/20">
                    {product.brand}
                  </span>
                  <div className="h-px w-12 bg-accent/30" />
                </div>
              )}
              <h1 className="text-4xl md:text-7xl font-heading font-extrabold text-zinc-950 mb-6 tracking-tight leading-[1.1]">
                {name}
              </h1>
              {description && (
                <p className="text-lg md:text-xl text-zinc-500 leading-relaxed font-medium">
                  {description}
                </p>
              )}
            </div>

            {/* Technical Specifications - Modern Grid */}
            {specs && Object.keys(specs).length > 0 && (
              <div className="mb-12">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-6 flex items-center gap-4">
                  {t("product.specs")}
                  <div className="h-px flex-grow bg-zinc-100" />
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(specs).map(([key, value]) => (
                    <div key={key} className="group p-5 rounded-2xl bg-zinc-50 border border-zinc-100 hover:bg-white hover:shadow-soft transition-all duration-300">
                      <dt className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 group-hover:text-accent transition-colors">{translateSpecKey(key, lang)}</dt>
                      <dd className="text-lg font-extrabold text-zinc-950 tracking-tight">
                        {toMetric(typeof value === "string" ? value : (value as any)[lang] || (value as any)["en"])}
                      </dd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Performance Features */}
            {currentFeatures && currentFeatures.length > 0 && (
              <div className="mb-12">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-6 flex items-center gap-4">
                  {t("product.features")}
                  <div className="h-px flex-grow bg-zinc-100" />
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {currentFeatures.map((feature: string, idx: number) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white border border-zinc-100 shadow-sm"
                    >
                      <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="text-zinc-700 font-semibold text-base">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {currentVideos.length > 0 && (
              <div className="mb-12">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-6 flex items-center gap-4">
                  {t("product.videos")}
                  <div className="h-px flex-grow bg-zinc-100" />
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {currentVideos.map((video: any, idx: number) => {
                    const videoId = getYouTubeId(video.url);
                    const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

                    return (
                      <a
                        key={`${video.url}-${idx}`}
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white hover:border-accent/30 hover:shadow-soft transition-all duration-300"
                      >
                        <div className="relative aspect-video overflow-hidden bg-zinc-100">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={video.label || name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-zinc-50 text-zinc-300 font-bold uppercase tracking-widest">
                              Video
                            </div>
                          )}
                          <div className="absolute inset-0 bg-zinc-950/20 group-hover:bg-zinc-950/10 transition-colors" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-accent shadow-lg transition-transform duration-300 group-hover:scale-110">
                              <PlayCircle className="h-8 w-8" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 p-5">
                          <span className="font-bold text-zinc-900 tracking-tight">
                            {video.label || `${name} Video`}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-accent transition-colors">
                            {t("product.watchVideo")}
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {currentDetailSections.length > 0 && (
              <div className="mb-12">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-6 flex items-center gap-4">
                  {t("product.details")}
                  <div className="h-px flex-grow bg-zinc-100" />
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {currentDetailSections.map((section: any, idx: number) => (
                    <div
                      key={`${section.title || "detail"}-${idx}`}
                      className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6"
                    >
                      {section.title && (
                        <h4 className="mb-3 text-xl font-extrabold tracking-tight text-zinc-950">
                          {section.title}
                        </h4>
                      )}
                      {section.body && (
                        <p className="mb-4 text-base font-medium leading-relaxed text-zinc-600">
                          {section.body}
                        </p>
                      )}
                      {section.bullets && section.bullets.length > 0 && (
                        <div className="grid grid-cols-1 gap-3">
                          {section.bullets.map((bullet: string, bulletIndex: number) => (
                            <div
                              key={`${idx}-${bulletIndex}`}
                              className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm"
                            >
                              <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                              <span className="text-zinc-700 font-semibold text-base">{bullet}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentAccessories.length > 0 && (
              <div className="mb-12">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-6 flex items-center gap-4">
                  {t("product.accessories")}
                  <div className="h-px flex-grow bg-zinc-100" />
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {currentAccessories.map((accessory: string, idx: number) => (
                    <div
                      key={`${accessory}-${idx}`}
                      className="flex items-center gap-4 rounded-xl border border-zinc-100 bg-white p-4 shadow-sm"
                    >
                      <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="text-zinc-700 font-semibold text-base">{accessory}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documentation - Luxury Cards */}
            {currentDownloads && currentDownloads.length > 0 && (
              <div className="mb-12">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-6 flex items-center gap-4">
                  {t("product.docs")}
                  <div className="h-px flex-grow bg-zinc-100" />
                </h3>
                <div className="space-y-3">
                  {currentDownloads.map((doc: any, idx: number) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-5 rounded-2xl border border-zinc-100 hover:border-accent/30 hover:shadow-soft transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:text-accent transition-colors">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-zinc-900 tracking-tight">{doc.label}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-accent transition-colors">Download</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            <div className="pt-6 mt-auto">
              <Link href="/contact">
                <Button size="lg" className="w-full h-16 md:h-20 rounded-full bg-accent text-accent-foreground font-black uppercase tracking-[0.2em] text-sm md:text-base shadow-gold transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]">
                  {t("product.quote")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {interactiveView && <ProductInteractiveSection interactiveView={interactiveView} t={t} />}
      </div>
    </div>
  );
}
