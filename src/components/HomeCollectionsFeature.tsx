import React from 'react';
import { ArrowRight, Car, Sparkles } from 'lucide-react';

interface HomeCollectionsFeatureProps {
  onNavigateToScaleModels: () => void;
  onNavigateToCustomCreation: () => void;
}

export const HomeCollectionsFeature: React.FC<HomeCollectionsFeatureProps> = ({
  onNavigateToScaleModels,
  onNavigateToCustomCreation,
}) => {
  return (
    <section className="py-16 sm:py-24 bg-zinc-50/80 text-zinc-900 border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-600 bg-white px-4 py-1.5 rounded-full border border-zinc-200 shadow-2xs mb-4 inline-block">
            Curated Vault Architecture
          </span>
          <h2 className="text-2xl sm:text-4xl font-display font-black tracking-tight text-zinc-950 font-sans">
            Two Collections. Infinite Passion.
          </h2>
          <p className="text-sm text-zinc-600 mt-3 font-sans leading-relaxed">
            Select a collection below to start exploring our die-cast vaults and handcrafted studios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1: Scale Models */}
          <div 
            onClick={onNavigateToScaleModels}
            className="group relative bg-white rounded-3xl p-8 sm:p-10 lg:p-12 border border-zinc-200/90 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-950/5 hover:-translate-y-1 cursor-pointer min-h-[400px]"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest mb-4">
                <Car className="w-4 h-4 text-red-600" />
                <span>Primary Collection</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-black text-zinc-950 mb-3 font-sans">
                Scale Models
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed max-w-sm mb-6 font-sans">
                Official 1:64 die-cast vehicles from Hot Wheels, Majorette, Mini GT, and CCA.
              </p>

              {/* Sub-Collection Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {['Hot Wheels', 'Majorette', 'Mini GT', 'CCA'].map((brand) => (
                  <span key={brand} className="text-[11px] font-mono font-semibold bg-zinc-100 text-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200">
                    {brand}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative z-10 pt-6 border-t border-zinc-100 flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-zinc-950 group-hover:text-red-600 transition-colors">
              <span>Explore Scale Models</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
            </div>

            {/* Subtle Gradient Background Effect */}
            <div className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-gradient-to-tl from-zinc-100 to-transparent rounded-full blur-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Card 2: Custom Creation */}
          <div 
            onClick={onNavigateToCustomCreation}
            className="group relative bg-white rounded-3xl p-8 sm:p-10 lg:p-12 border border-zinc-200/90 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-950/5 hover:-translate-y-1 cursor-pointer min-h-[400px]"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest mb-4">
                <Sparkles className="w-4 h-4 text-red-600" />
                <span>Handcrafted Studio</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-black text-zinc-950 mb-3 font-sans">
                Custom Creation
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed max-w-sm mb-6 font-sans">
                Personalized die-cast gifts — luxury bouquets, custom photo blister cards, and framed wall art.
              </p>

              {/* Custom Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {['Frames', 'Bouquets', 'Custom Cards'].map((item) => (
                  <span key={item} className="text-[11px] font-mono font-semibold bg-zinc-100 text-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative z-10 pt-6 border-t border-zinc-100 flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-zinc-950 group-hover:text-red-600 transition-colors">
              <span>Explore Custom Studio</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
            </div>

            {/* Subtle Gradient Background Effect */}
            <div className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-gradient-to-tl from-red-50 to-transparent rounded-full blur-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </section>
  );
};
