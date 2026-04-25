import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Calendar, User, ExternalLink } from "lucide-react";
import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { useLang } from "@/i18n/I18nProvider";
import { blogPosts } from "@/data/blog";
import { useLinkedInPosts } from "@/hooks/useLinkedInPosts";
import { Button } from "@/components/ui/button";

export default function Blog() {
  const { t, lang } = useLang();
  const linkedinPosts = useLinkedInPosts();

  useSEO(
    lang === "fr"
      ? "Actualités & Blog | Vemat Group"
      : "News & Blog | Vemat Group",
    lang === "fr"
      ? "Découvrez les dernières actualités, guides techniques et innovations dans le monde du levage et du BTP."
      : "Discover the latest news, technical guides, and innovations in the world of lifting and construction."
  );
  useScrollTop();

  const allPosts = [...linkedinPosts, ...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen bg-zinc-50 pt-32 pb-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mb-20">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-accent text-xs font-black uppercase tracking-[0.3em] mb-4 block"
          >
            {lang === "fr" ? "Actualités & Expertise" : "News & Expertise"}
          </motion.span>
          <h1 className="text-5xl md:text-7xl font-heading font-extrabold text-zinc-950 tracking-tighter uppercase mb-6 leading-tight">
            {lang === "fr" ? "Le Blog Vemat" : "Vemat Blog"}
          </h1>
          <p className="text-zinc-500 text-xl font-medium leading-relaxed">
            {lang === "fr"
              ? "Restez informé des dernières tendances du secteur, de nos nouveaux arrivages et des conseils de nos experts pour vos chantiers."
              : "Stay informed about the latest industry trends, new arrivals, and expert advice from our team for your projects."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {allPosts.map((post, i) => {
            const isLinkedIn = post.source === "linkedin";
            return (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden group hover:shadow-soft transition-all duration-500"
              >
                {isLinkedIn ? (
                  <a
                    href={post.linkedinUrl ?? "https://www.linkedin.com/company/vemat-group-ltd/posts/?feedView=all"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <PostImage post={post} lang={lang} isLinkedIn />
                  </a>
                ) : (
                  <Link href={`/blog/${post.slug}`}>
                    <PostImage post={post} lang={lang} isLinkedIn={false} />
                  </Link>
                )}

                <div className="p-10">
                  <div className="flex items-center gap-6 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-accent" />
                      {post.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-accent" />
                      {post.author}
                    </div>
                  </div>

                  {isLinkedIn ? (
                    <a
                      href={post.linkedinUrl ?? "https://www.linkedin.com/company/vemat-group-ltd/posts/?feedView=all"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <h2 className="text-2xl font-heading font-extrabold text-zinc-950 mb-4 leading-tight group-hover:text-accent transition-colors cursor-pointer">
                        {lang === "fr" ? post.title.fr : post.title.en}
                      </h2>
                    </a>
                  ) : (
                    <Link href={`/blog/${post.slug}`}>
                      <h2 className="text-2xl font-heading font-extrabold text-zinc-950 mb-4 leading-tight group-hover:text-accent transition-colors cursor-pointer">
                        {lang === "fr" ? post.title.fr : post.title.en}
                      </h2>
                    </Link>
                  )}

                  <p className="text-zinc-500 mb-8 line-clamp-3 font-medium leading-relaxed">
                    {lang === "fr" ? post.excerpt.fr : post.excerpt.en}
                  </p>

                  {isLinkedIn ? (
                    <a
                      href={post.linkedinUrl ?? "https://www.linkedin.com/company/vemat-group-ltd/posts/?feedView=all"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 font-black uppercase tracking-widest text-[10px] text-[#0A66C2] hover:text-accent transition-colors group/btn"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      {lang === "fr" ? "Voir sur LinkedIn" : "View on LinkedIn"}
                      <ExternalLink className="h-3 w-3 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-0.5" />
                    </a>
                  ) : (
                    <Link href={`/blog/${post.slug}`}>
                      <Button variant="ghost" className="p-0 h-auto font-black uppercase tracking-widest text-[10px] text-zinc-950 hover:text-accent transition-colors group/btn">
                        {lang === "fr" ? "Lire l'article" : "Read article"}
                        <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover/btn:translate-x-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PostImage({
  post,
  lang,
  isLinkedIn,
}: {
  post: import("@/data/blog").BlogPost;
  lang: "fr" | "en";
  isLinkedIn: boolean;
}) {
  return (
    <div className="aspect-[16/10] overflow-hidden relative cursor-pointer">
      <img
        src={post.image}
        alt={lang === "fr" ? post.title.fr : post.title.en}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <span className="px-4 py-1.5 bg-zinc-950/80 backdrop-blur-md rounded-full text-white text-[9px] font-black uppercase tracking-widest">
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
    </div>
  );
}
