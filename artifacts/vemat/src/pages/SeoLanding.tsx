import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { useLang } from "@/i18n/I18nProvider";
import { buildContent, getLanding, type Content } from "@/seo/landing";
import NotFound from "@/pages/not-found";

function JsonLd({ data }: { data: object[] }) {
  useEffect(() => {
    const nodes = data.map((d) => {
      const el = document.createElement("script");
      el.type = "application/ld+json";
      el.dataset.landing = "1";
      el.text = JSON.stringify(d);
      document.head.appendChild(el);
      return el;
    });
    return () => nodes.forEach((n) => n.remove());
  }, [data]);
  return null;
}

function Landing({ content }: { content: Content }) {
  const { setLang } = useLang();
  useScrollTop();
  useSEO(content.title, content.description);

  // La page est rédigée dans une seule langue : l'interface (menu, pied de page) suit cette langue.
  useEffect(() => {
    setLang(content.lang);
    document.documentElement.lang = content.lang;
  }, [content.lang]);

  return (
    <div className="pt-36 pb-24">
      <JsonLd data={content.jsonLd} />
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <nav aria-label="breadcrumb" className="text-sm text-muted-foreground mb-6">
          {content.breadcrumbs.map((b, i) => (
            <span key={b.href + i}>
              {i < content.breadcrumbs.length - 1 ? (
                <>
                  <Link href={b.href} className="hover:underline">{b.label}</Link>
                  <span className="mx-2">›</span>
                </>
              ) : (
                <span>{b.label}</span>
              )}
            </span>
          ))}
        </nav>

        <h1 className="text-3xl md:text-5xl font-heading font-extrabold tracking-tight mb-8">{content.h1}</h1>
        {content.intro.map((p, i) => (
          <p key={i} className="text-lg text-muted-foreground leading-relaxed mb-5">{p}</p>
        ))}

        <div className="mt-8 mb-12 flex flex-wrap gap-4">
          {content.cta.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="inline-flex items-center rounded-full bg-accent px-8 py-3 text-sm font-bold uppercase tracking-wider text-white hover:opacity-90 transition-opacity"
            >
              {c.label}
            </Link>
          ))}
        </div>

        {content.sections.map((s) => (
          <section key={s.h2} className="mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-5">{s.h2}</h2>
            {s.faq ? (
              <div className="space-y-6">
                {content.faq.map((f) => (
                  <div key={f.q}>
                    <h3 className="font-bold text-lg mb-2">{f.q}</h3>
                    <p className="text-muted-foreground leading-relaxed">{f.a}</p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {s.paragraphs?.map((p, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed mb-4">{p}</p>
                ))}
                {s.bullets && (
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                    {s.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
                {s.links && (
                  <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                    {s.links.map((l) => (
                      <li key={l.href + l.label}>
                        <Link href={l.href} className="text-accent font-medium hover:underline">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

export default function SeoLanding() {
  const params = useParams();
  const page = getLanding(params?.slug as string);
  if (!page) return <NotFound />;
  return <Landing content={buildContent(page)} />;
}
