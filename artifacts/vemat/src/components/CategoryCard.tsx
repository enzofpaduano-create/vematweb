import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface CategoryCardProps {
  title: string;
  description: string;
  image: string;
  href: string;
  index: number;
}

export function CategoryCard({ title, description, image, href, index }: CategoryCardProps) {
  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="group cursor-pointer flex flex-col h-full bg-white border border-zinc-100 hover:border-accent/50 hover:shadow-xl transition-all duration-300"
      >
        <div className="relative h-64 overflow-hidden bg-zinc-100">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="p-8 flex flex-col flex-grow">
          <h3 className="text-2xl font-heading font-bold text-zinc-950 mb-3 group-hover:text-accent transition-colors">
            {title}
          </h3>
          <p className="text-zinc-600 mb-6 flex-grow leading-relaxed">
            {description}
          </p>
          <div className="flex items-center text-zinc-950 font-semibold group-hover:text-accent transition-colors mt-auto">
            <span>Découvrir la gamme</span>
            <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
