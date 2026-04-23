import { brands } from "../data/brands";
import { useLang } from "@/i18n/I18nProvider";

export function BrandStrip() {
  const { t } = useLang();
  return (
    <div className="bg-zinc-100 py-12 border-y border-zinc-200 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <p className="text-center text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-10">
          {t("brands.stripHeading")}
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {brands.map((brand) => (
            <a
              key={brand.id}
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              title={brand.name}
              className="group block bg-white px-6 py-4 border border-zinc-200 hover:border-accent hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-10 md:h-12 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
