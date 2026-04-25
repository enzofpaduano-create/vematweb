import { motion } from "framer-motion";

interface ServiceCardProps {
  title: string;
  description: string;
  index: number;
}

export function ServiceCard({ title, description, index }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      className="relative group p-6 md:p-10 bg-white border border-zinc-100 rounded-[1.5rem] md:rounded-[2rem] hover:bg-zinc-950 transition-all duration-700 overflow-hidden shadow-soft hover:shadow-2xl hover:-translate-y-2"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 group-hover:bg-accent/10 blur-3xl rounded-full transition-colors duration-700" />
      
      <div className="relative z-10">
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-6 md:mb-10 group-hover:bg-accent group-hover:border-accent transition-all duration-700">
          <span className="font-heading font-black text-xl md:text-2xl text-zinc-300 group-hover:text-white transition-colors duration-700 tracking-tighter">
            0{index + 1}
          </span>
        </div>
        
        <h3 className="text-xl md:text-2xl font-heading font-extrabold text-zinc-950 mb-4 md:mb-6 group-hover:text-white transition-colors duration-700 tracking-tight leading-tight">
          {title}
        </h3>
        
        <p className="text-sm md:text-base text-zinc-500 font-medium leading-relaxed group-hover:text-zinc-400 transition-colors duration-700">
          {description}
        </p>
        
        <div className="mt-6 md:mt-10 h-1 w-0 group-hover:w-12 bg-accent transition-all duration-700" />
      </div>
    </motion.div>
  );
}
