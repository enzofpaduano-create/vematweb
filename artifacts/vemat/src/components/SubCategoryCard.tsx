import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface SubCategoryCardProps {
  title: string;
  index: number;
}

export function SubCategoryCard({ title, index }: SubCategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="bg-zinc-50 border border-zinc-100 p-6 flex items-start gap-4 hover:border-accent hover:bg-white transition-colors"
    >
      <CheckCircle2 className="h-6 w-6 text-accent shrink-0 mt-0.5" />
      <div>
        <h4 className="font-heading font-semibold text-lg text-zinc-950">{title}</h4>
      </div>
    </motion.div>
  );
}
