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
    <section className="py-16 sm:py-20 bg-zinc-50 text-zinc-900 border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 bg-white px-3 py-1 rounded-full border border-zinc-200 shadow-xs mb-3 inline-block">
            Curated Vault Architecture
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 font-sans">
            Two Collections. Infinite Passion.
          </h2>
          <p className="text-sm text-zinc-500 mt-2 font-sans">
            Select a collection below to start exploring our die-cast vaults and handcrafted studios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1: Scale Models */}
          <div 
            onClick={onNavigateToScaleModels}
            className="group relative bg-white rounded-3xl p-8 sm:p-10 border border-zinc-200/80 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-900/5 hover:-translate-y-1 cursor-pointer min-h-[380px]"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest mb-3">
                <Car className="w-4 h-4 text-red-600" />
                <span>Primary Collection</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 mb-2 font-sans">
                Scale Models
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-sm mb-6">
                Official 1:64 die-cast vehicles from Hot Wheels, Majorette, Mini GT, and CCA.
              </p>

              {/* Sub-Collection Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {['Hot Wheels', 'Majorette', 'Mini GT', 'CCA'].map((brand) => (
                  <span key={brand} className="text-[11px] font-mono font-semibold bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-lg border border-zinc-200">
                    {brand}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 group-hover:text-red-600 transition-colors">
              <span>Explore Scale Models</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Subtle Gradient Background Effect */}
            <div className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-gradient-to-tl from-zinc-100 to-transparent rounded-full blur-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Card 2: Custom Creation */}
          <div 
            onClick={onNavigateToCustomCreation}
            className="group relative bg-white rounded-3xl p-8 sm:p-10 border border-zinc-200/80 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-900/5 hover:-translate-y-1 cursor-pointer min-h-[380px]"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest mb-3">
                <Sparkles className="w-4 h-4 text-red-600" />
                <span>Handcrafted Studio</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 mb-2 font-sans">
                Custom Creation
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-sm mb-6">
                Personalized die-cast gifts — luxury bouquets, custom photo blister cards, and framed wall art.
              </p>

              {/* Custom Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {['Frames', 'Bouquets', 'Custom Cards'].map((item) => (
                  <span key={item} className="text-[11px] font-mono font-semibold bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-lg border border-zinc-200">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 group-hover:text-red-600 transition-colors">
              <span>Explore Custom Studio</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Subtle Gradient Background Effect */}
            <div className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-gradient-to-tl from-red-50 to-transparent rounded-full blur-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </section>
  );
};
