import { motion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  alignment?: "left" | "center";
  className?: string;
}

export function SectionHeader({ title, subtitle, alignment = "left", className = "" }: SectionHeaderProps) {
  return (
    <div className={`mb-12 md:mb-20 ${alignment === "center" ? "text-center mx-auto" : ""} ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <span className={`text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-accent mb-4 block ${alignment === "center" ? "mx-auto" : ""}`}>
          Vemat Expertise
        </span>
        <h2 className="text-3xl md:text-5xl lg:text-7xl font-heading font-extrabold text-zinc-950 mb-6 md:mb-8 tracking-tighter uppercase leading-[1.1]">
          {title}
        </h2>
        {subtitle && (
          <p className={`text-base md:text-xl text-zinc-500 max-w-3xl leading-relaxed font-medium ${alignment === "center" ? "mx-auto" : ""}`}>
            {subtitle}
          </p>
        )}
        <div className={`h-1.5 w-16 md:w-24 bg-accent mt-8 md:mt-12 rounded-full ${alignment === "center" ? "mx-auto" : ""}`} />
      </motion.div>
    </div>
  );
}
