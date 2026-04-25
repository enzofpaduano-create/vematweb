import { Link } from "wouter";
import { blogPosts } from "@/data/blog";
import { useLinkedInPosts } from "@/hooks/useLinkedInPosts";
import { useLang } from "@/i18n/I18nProvider";

export function BlogTicker() {
  const { lang } = useLang();
  const linkedinPosts = useLinkedInPosts();

  const allPosts = [...linkedinPosts, ...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const items = [...allPosts, ...allPosts];

  return (
    <div className="bg-zinc-950 border-t border-zinc-800/60 flex items-stretch">
      <style>{`
        @keyframes blog-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .blog-ticker-track {
          animation: blog-scroll 55s linear infinite;
        }
        .blog-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Fixed label */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 md:px-7 border-r border-zinc-800/60">
        <span className="block w-5 h-px bg-accent" />
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent whitespace-nowrap">
          {lang === "fr" ? "Actualités" : "News"}
        </span>
      </div>

      {/* Scrolling strip */}
      <div className="flex-1 overflow-hidden relative py-4">
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

        <div className="blog-ticker-track flex gap-3" style={{ width: "max-content" }}>
          {items.map((post, i) => {
            const isLinkedIn = post.source === "linkedin";
            const href = isLinkedIn
              ? (post.linkedinUrl ?? "https://www.linkedin.com/company/vemat-group-ltd/posts/?feedView=all")
              : `/blog/${post.slug}`;
            const isExternal = isLinkedIn;

            return isExternal ? (
              <a
                key={`${post.id}-${i}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <TickerCard post={post} lang={lang} isLinkedIn={isLinkedIn} />
              </a>
            ) : (
              <Link key={`${post.id}-${i}`} href={href}>
                <TickerCard post={post} lang={lang} isLinkedIn={isLinkedIn} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TickerCard({
  post,
  lang,
  isLinkedIn,
}: {
  post: import("@/data/blog").BlogPost;
  lang: "fr" | "en";
  isLinkedIn: boolean;
}) {
  return (
    <div className="flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] hover:border-accent/25 rounded-xl px-3.5 py-2.5 transition-all duration-300 cursor-pointer group w-[290px]">
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 relative">
        <img
          src={post.image}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          draggable={false}
        />
        {isLinkedIn && (
          <div className="absolute bottom-0 right-0 bg-[#0A66C2] rounded-tl-md px-1 py-0.5">
            <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="inline-block text-[8px] font-black uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded mb-1.5">
          {post.category}
        </span>
        <p className="text-white/90 text-[11px] font-bold leading-tight line-clamp-2 group-hover:text-accent transition-colors duration-200">
          {lang === "fr" ? post.title.fr : post.title.en}
        </p>
      </div>
    </div>
  );
}
