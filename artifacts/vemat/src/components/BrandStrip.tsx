import { brands } from "../data/brands";

export function BrandStrip() {
  return (
    <div className="bg-zinc-100 py-12 border-y border-zinc-200 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <p className="text-center text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-8">
          Partenaire officiel des leaders mondiaux
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {brands.map((brand) => (
            <div key={brand} className="text-2xl md:text-3xl font-heading font-bold text-zinc-800 hover:text-zinc-950 transition-colors">
              {brand}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
