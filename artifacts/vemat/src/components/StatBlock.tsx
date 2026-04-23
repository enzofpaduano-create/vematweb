import { motion } from "framer-motion";

interface StatBlockProps {
  value: string;
  label: string;
  delay?: number;
}

export function StatBlock({ value, label, delay = 0 }: StatBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="flex flex-col border-l-2 border-accent pl-6"
    >
      <span className="text-4xl md:text-5xl font-heading font-bold text-white mb-2">{value}</span>
      <span className="text-zinc-400 font-medium">{label}</span>
    </motion.div>
  );
}
