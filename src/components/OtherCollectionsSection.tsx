import React from 'react';
import { Category, CategoryId } from '../types';
import { Flower2, Frame, Sparkles, Car, ArrowUpRight, Layers } from 'lucide-react';
import { ResponsiveImage } from './ResponsiveImage';

interface OtherCollectionsSectionProps {
  categories: Category[];
  onSelectCategory: (category: CategoryId) => void;
  isLoading?: boolean;
}

export const OtherCollectionsSection: React.FC<OtherCollectionsSectionProps> = ({
  categories,
  onSelectCategory,
  isLoading,
}) => {
  if (!categories || categories.length === 0) return null;

  return (
    <section id="other-collections" className="py-16 bg-zinc-50 text-zinc-900 relative border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-zinc-700 uppercase tracking-widest bg-zinc-200/80 px-3 py-1 rounded-full">
            <Layers className="w-3.5 h-3.5 text-red-600" />
            <span>Creative Diecast Expressions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase italic font-sans tracking-tight text-zinc-900">
            Explore Other <span className="text-red-600">Diecast Creations</span>
          </h2>
          <p className="text-zinc-600 text-xs sm:text-sm font-normal">
            Specialty arrangements, wall art, and personalized blister cards designed around genuine die-cast models.
          </p>
        </div>

        {/* Categories Grid (Clean, streamlined, not overpowering main Hot Wheels) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group bg-white border border-zinc-200/90 hover:border-red-500/80 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-xs hover:shadow-md active:scale-[0.98]"
            >
              {/* Image */}
              <div className="relative aspect-4/3 overflow-hidden bg-zinc-100 border-b border-zinc-100">
                <ResponsiveImage
                  src={cat.image}
                  alt={cat.name}
                  aspectRatio="4/3"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 260px"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>

                {cat.badge && (
                  <div className="absolute top-2.5 left-2.5 bg-zinc-900/90 text-white font-mono font-bold text-[9px] uppercase px-2 py-0.5 rounded shadow-xs">
                    {cat.badge}
                  </div>
                )}

                <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs border border-zinc-200 shadow-xs flex items-center justify-center text-zinc-700 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-1 text-left">
                <h3 className="font-sans font-black text-sm uppercase text-zinc-900 group-hover:text-red-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed font-normal">
                  {cat.tagline}
                </p>
                <div className="pt-2 text-[10px] font-mono font-bold text-red-600 uppercase flex items-center gap-1">
                  <span>View Collection</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
