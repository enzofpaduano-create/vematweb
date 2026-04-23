import { ReactNode } from "react";
import { motion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  alignment?: "left" | "center";
  className?: string;
}

export function SectionHeader({ title, subtitle, alignment = "left", className = "" }: SectionHeaderProps) {
  return (
    <div className={`mb-12 md:mb-16 ${alignment === "center" ? "text-center mx-auto" : ""} ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-zinc-950 mb-4 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-lg text-zinc-600 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
        <div className={`h-1 w-20 bg-accent mt-8 ${alignment === "center" ? "mx-auto" : ""}`} />
      </motion.div>
    </div>
  );
}
