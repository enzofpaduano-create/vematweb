import { motion } from "framer-motion";
import { useParams, Link } from "wouter";
import { ArrowLeft, Calendar, User, Share2, ExternalLink } from "lucide-react";
import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { useLang } from "@/i18n/I18nProvider";
import { blogPosts } from "@/data/blog";
import { useLinkedInPosts } from "@/hooks/useLinkedInPosts";
import { Button } from "@/components/ui/button";
import NotFound from "./not-found";

const LINKEDIN_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='630' viewBox='0 0 1200 630'%3E%3Crect width='1200' height='630' fill='%230A66C2'/%3E%3Ctext x='600' y='315' text-anchor='middle' dominant-baseline='middle' font-family='Arial' font-size='120' font-weight='bold' fill='white'%3Ein%3C/text%3E%3C/svg%3E";

function formatLinkedInContent(text: string) {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <br key={i} />;

    if (/^#\w/.test(line)) {
      const words = line.split(/(\s+)/).map((word, j) =>
        /^#\w/.test(word) ? (
          <span key={j} className="text-[#0A66C2] font-bold">{word}</span>
        ) : word
      );
      return <p key={i} className="mb-3 text-zinc-500 text-sm">{words}</p>;
    }

    if (/^(vemat@|www\.)/.test(line.trim())) {
      return (
        <p key={i} className="mb-1 text-zinc-400 text-sm font-medium">{line}</p>
      );
    }

    return (
      <p key={i} className="mb-4 text-zinc-700 text-lg leading-relaxed font-medium">
        {line}
      </p>
    );
  });
}

export default function Article() {
  const { slug } = useParams();
  const { lang } = useLang();
  useScrollTop();

  const linkedinPosts = useLinkedInPosts();

  const editorialPost = blogPosts.find((p) => p.slug === slug);
  const linkedinPost = linkedinPosts.find((p) => p.slug === slug);
  const post = editorialPost ?? linkedinPost;

  useSEO(
    post ? `${post.title[lang]} | Vemat Blog` : "Article non trouvé",
    post ? post.excerpt[lang] : "Cet article n'existe pas."
  );

  if (!post && linkedinPosts.length > 0) return <NotFound />;
  if (!post) return null;

  const isLinkedIn = post.source === "linkedin";

  return (
    <div className="min-h-screen bg-white">
      {/* Header Image */}
      <div className="h-[55vh] relative overflow-hidden">
        <motion.img
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src={post.image}
          alt={post.title[lang]}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = LINKEDIN_PLACEHOLDER;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-8 md:p-24">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl"
            >
              <Link href="/blog">
                <Button variant="ghost" className="text-white hover:bg-white/10 mb-8 p-0 h-auto font-black uppercase tracking-widest text-[10px] group">
                  <ArrowLeft className="mr-3 h-4 w-4 transition-transform group-hover:-translate-x-2" />
                  {lang === "fr" ? "Retour au blog" : "Back to blog"}
                </Button>
              </Link>
              <div className="flex gap-4 mb-6 flex-wrap">
                <span className="px-4 py-1.5 bg-accent rounded-full text-white text-[9px] font-black uppercase tracking-widest">
                  {post.category}
                </span>
                {isLinkedIn && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A66C2]/90 backdrop-blur-md rounded-full text-white text-[9px] font-black uppercase tracking-widest">
                    <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-6xl font-heading font-extrabold text-white tracking-tighter uppercase leading-tight">
                {post.title[lang]}
              </h1>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            {/* Meta bar */}
            <div className="flex flex-wrap items-center justify-between gap-8 pb-10 border-b border-zinc-100 mb-12">
              <div className="flex items-center gap-10 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-accent" />
                  {post.date}
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-accent" />
                  {post.author}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isLinkedIn && (
                  <a
                    href={post.linkedinUrl ?? "https://www.linkedin.com/company/vemat-group-ltd/posts/?feedView=all"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="rounded-full border-[#0A66C2]/30 text-[#0A66C2] h-12 px-6 text-[10px] font-black uppercase tracking-widest gap-3 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      {lang === "fr" ? "Voir sur LinkedIn" : "View on LinkedIn"}
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                )}
                <Button variant="outline" className="rounded-full border-zinc-200 h-12 px-6 text-[10px] font-black uppercase tracking-widest gap-3 hover:bg-zinc-50">
                  <Share2 className="h-4 w-4" />
                  {lang === "fr" ? "Partager" : "Share"}
                </Button>
              </div>
            </div>

            {/* Post content */}
            {isLinkedIn ? (
              <div className="text-zinc-700">
                {formatLinkedInContent(lang === "fr" ? post.content.fr : post.content.en)}
              </div>
            ) : (
              <div className="prose prose-zinc prose-2xl max-w-none prose-headings:font-heading prose-headings:font-extrabold prose-headings:uppercase prose-headings:tracking-tight prose-p:text-zinc-600 prose-p:leading-relaxed prose-li:text-zinc-600">
                {post.content[lang].split("\n").map((para, i) => {
                  if (para.startsWith("###")) {
                    return <h3 key={i} className="text-3xl mt-16 mb-8">{para.replace("### ", "")}</h3>;
                  }
                  if (para.startsWith("1.") || para.startsWith("*")) {
                    return <li key={i} className="ml-6 mb-2">{para.replace(/^[0-9*.]\s*/, "")}</li>;
                  }
                  return <p key={i} className="mb-6">{para}</p>;
                })}
              </div>
            )}

            {/* Footer */}
            <div className="mt-20 p-10 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
              <div className="flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
                {isLinkedIn ? (
                  <>
                    <div className="w-20 h-20 bg-[#0A66C2] rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-10 h-10 fill-white" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-heading font-extrabold text-zinc-950 uppercase tracking-tight">
                        {lang === "fr" ? "Publié par Vemat Group" : "Published by Vemat Group"}
                      </h4>
                      <p className="text-zinc-500 mt-2 font-medium">
                        {lang === "fr"
                          ? "Distributeur Terex RT Cranes et JLG pour l'Afrique. Suivez-nous sur LinkedIn pour nos dernières actualités."
                          : "Terex RT Cranes and JLG distributor for Africa. Follow us on LinkedIn for our latest news."}
                      </p>
                      <a
                        href="https://www.linkedin.com/company/vemat-group-ltd/posts/?feedView=all"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-4 text-[#0A66C2] font-black text-[10px] uppercase tracking-widest hover:underline"
                      >
                        {lang === "fr" ? "Suivre Vemat sur LinkedIn" : "Follow Vemat on LinkedIn"}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-zinc-200 rounded-full flex items-center justify-center shrink-0">
                      <User className="h-10 w-10 text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="text-xl font-heading font-extrabold text-zinc-950 uppercase tracking-tight">
                        {lang === "fr" ? `Rédigé par ${post.author}` : `Written by ${post.author}`}
                      </h4>
                      <p className="text-zinc-500 mt-2 font-medium">
                        {lang === "fr"
                          ? "Expert technique Vemat Group, spécialisé dans les solutions de levage et de terrassement en Afrique."
                          : "Vemat Group technical expert, specialized in lifting and earthmoving solutions in Africa."}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
