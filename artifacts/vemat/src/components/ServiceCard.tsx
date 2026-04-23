import { motion } from "framer-motion";

interface ServiceCardProps {
  title: string;
  description: string;
  index: number;
}

export function ServiceCard({ title, description, index }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="p-8 border border-zinc-200 bg-white hover:shadow-lg transition-all group"
    >
      <div className="w-12 h-12 bg-zinc-100 flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-white transition-colors">
        <span className="font-heading font-bold text-xl">0{index + 1}</span>
      </div>
      <h3 className="text-xl font-heading font-bold text-zinc-950 mb-4 group-hover:text-accent transition-colors">
        {title}
      </h3>
      <p className="text-zinc-600 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
