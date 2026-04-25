import { motion } from "framer-motion";
import { useParams, Link } from "wouter";
import { ArrowLeft, Calendar, User, Share2 } from "lucide-react";
import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { useLang } from "@/i18n/I18nProvider";
import { blogPosts } from "@/data/blog";
import { Button } from "@/components/ui/button";
import NotFound from "./not-found";

export default function Article() {
  const { slug } = useParams();
  const { lang } = useLang();
  useScrollTop();

  const post = blogPosts.find(p => p.slug === slug);

  useSEO(
    post ? `${post.title[lang]} | Vemat Blog` : "Article non trouvé",
    post ? post.excerpt[lang] : "Cet article n'existe pas."
  );

  if (!post) return <NotFound />;

  return (
    <div className="min-h-screen bg-white">
      {/* Header Image */}
      <div className="h-[60vh] relative overflow-hidden">
        <motion.img 
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src={post.image} 
          alt={post.title[lang]} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
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
                  Retour au blog
                </Button>
              </Link>
              <div className="flex gap-4 mb-6">
                <span className="px-4 py-1.5 bg-accent rounded-full text-white text-[9px] font-black uppercase tracking-widest">
                  {post.category}
                </span>
              </div>
              <h1 className="text-4xl md:text-7xl font-heading font-extrabold text-white tracking-tighter uppercase leading-[0.9]">
                {post.title[lang]}
              </h1>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-24 bg-white relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-8 pb-12 border-b border-zinc-100 mb-12">
              <div className="flex items-center gap-12 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-accent" />
                  {post.date}
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-accent" />
                  {post.author}
                </div>
              </div>
              
              <Button variant="outline" className="rounded-full border-zinc-200 h-12 px-6 text-[10px] font-black uppercase tracking-widest gap-3 hover:bg-zinc-50">
                <Share2 className="h-4 w-4" />
                Partager
              </Button>
            </div>

            <div className="prose prose-zinc prose-2xl max-w-none prose-headings:font-heading prose-headings:font-extrabold prose-headings:uppercase prose-headings:tracking-tight prose-p:text-zinc-600 prose-p:leading-relaxed prose-li:text-zinc-600">
              {post.content[lang].split('\n').map((para, i) => {
                if (para.startsWith('###')) {
                  return <h3 key={i} className="text-3xl mt-16 mb-8">{para.replace('### ', '')}</h3>;
                }
                if (para.startsWith('1.') || para.startsWith('*')) {
                  return <li key={i} className="ml-6 mb-2">{para.replace(/^[0-9*.]\s*/, '')}</li>;
                }
                return <p key={i} className="mb-6">{para}</p>;
              })}
            </div>

            {/* Related/Author Footer */}
            <div className="mt-24 p-12 bg-zinc-50 rounded-[3rem] border border-zinc-100">
              <div className="flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
                <div className="w-20 h-20 bg-zinc-200 rounded-full flex items-center justify-center shrink-0">
                  <User className="h-10 w-10 text-zinc-400" />
                </div>
                <div>
                  <h4 className="text-xl font-heading font-extrabold text-zinc-950 uppercase tracking-tight">Rédigé par {post.author}</h4>
                  <p className="text-zinc-500 mt-2 font-medium">Expert technique Vemat Group, spécialisé dans les solutions de levage et de terrassement en Afrique.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
