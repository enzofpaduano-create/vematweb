import { motion } from "framer-motion";
import { ArrowRight, Package } from "lucide-react";
import { Link } from "wouter";
import type { SubCategory } from "@/data/products";
import { useLang } from "@/i18n/I18nProvider";

interface ProductCatalogProps {
  subcategories: SubCategory[];
}

export function ProductCatalog({ subcategories }: ProductCatalogProps) {
  const { lang, t } = useLang();

  return (
    <div className="space-y-16">
      {subcategories.map((sub, index) => (
        <motion.div
          key={sub.slug}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: index * 0.05 }}
          className="bg-white border border-zinc-200 overflow-hidden"
          data-testid={`subcategory-${sub.slug}`}
        >
          <div className="border-b border-zinc-200 bg-gradient-to-r from-zinc-950 to-zinc-800 text-white p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-[260px]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">
                    {sub.brand}
                  </span>
                  <span className="h-px w-8 bg-zinc-600" />
                  <span className="text-xs text-zinc-400 font-medium">
                    {sub.totalCount} {sub.totalCount > 1 ? t("catalog.products") : t("catalog.product")}
                  </span>
                </div>
                <h3 className="font-heading text-2xl md:text-3xl font-bold leading-tight">
                  {sub.title[lang]}
                </h3>
                {sub.description && (
                  <p className="mt-3 text-zinc-300 text-sm md:text-base max-w-3xl">
                    {sub.description[lang]}
                  </p>
                )}
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-accent text-white px-5 py-3 text-sm font-semibold hover:bg-accent/90 transition-colors"
                data-testid={`button-quote-${sub.slug}`}
              >
                {t("catalog.quote")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {sub.models.length > 0 ? (
            <div className="p-6 md:p-8">
              <h4 className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-4">
                {t("catalog.models")}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {sub.models.map((model) => (
                  <div
                    key={model.name}
                    className="group flex items-center gap-2 border border-zinc-200 bg-zinc-50 px-3 py-3 hover:border-accent hover:bg-white transition-colors"
                    data-testid={`model-${model.name}`}
                  >
                    <Package className="h-4 w-4 text-accent shrink-0" />
                    <span className="font-mono text-sm font-semibold text-zinc-900 truncate">
                      {model.name}
                    </span>
                  </div>
                ))}
                {sub.models.length < sub.totalCount && (
                  <Link
                    href="/contact"
                    className="flex items-center justify-center gap-2 border border-dashed border-zinc-300 px-3 py-3 text-sm text-zinc-600 hover:border-accent hover:text-accent transition-colors"
                    data-testid={`more-${sub.slug}`}
                  >
                    +{sub.totalCount - sub.models.length} {t("catalog.more")}
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 md:p-8 bg-zinc-50">
              <p className="text-sm text-zinc-600">
                {t("catalog.fullList")}{" "}
                <Link
                  href="/contact"
                  className="text-accent font-semibold hover:underline"
                >
                  {t("catalog.contactUs")}
                </Link>
                .
              </p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
