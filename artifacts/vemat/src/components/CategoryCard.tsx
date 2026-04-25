import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
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
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="group relative cursor-pointer flex flex-col h-full bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-zinc-100 hover:border-accent/20 transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)]"
      >
        <div 
          style={{
            transform: "translateZ(50px)",
            transformStyle: "preserve-3d",
          }}
          className="relative h-64 md:h-80 overflow-hidden bg-zinc-100"
        >
          <motion.img
            src={image}
            alt={title}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-zinc-950/20 group-hover:bg-zinc-950/0 transition-colors duration-700" />
          <div className="absolute top-4 left-4 md:top-6 md:left-6">
            <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 md:px-4 md:py-1.5 text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-900 shadow-sm">
              Série Premium
            </span>
          </div>
        </div>
        
        <div 
          style={{
            transform: "translateZ(30px)",
          }}
          className="p-6 md:p-10 flex flex-col flex-grow relative bg-white"
        >
          <div className="absolute top-0 left-6 md:left-10 right-6 md:right-10 h-1 bg-accent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
          
          <h3 className="text-2xl md:text-3xl font-heading font-extrabold text-zinc-950 mb-3 md:mb-4 tracking-tight leading-tight group-hover:text-accent transition-colors duration-500">
            {title}
          </h3>
          <p className="text-zinc-500 mb-6 md:mb-8 flex-grow leading-relaxed font-medium text-base md:text-lg">
            {description}
          </p>
          
          <div className="flex items-center text-zinc-950 font-bold uppercase tracking-widest text-[10px] md:text-xs group-hover:text-accent transition-all duration-500">
            <span className="relative">
              Explorer le catalogue
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </span>
            <ArrowRight className="ml-3 h-4 w-4 transform group-hover:translate-x-2 transition-all duration-500" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
