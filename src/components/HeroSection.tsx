import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Truck, ChevronLeft, ChevronRight, Package, Car } from 'lucide-react';
import { Product } from '../types';
import { ResponsiveImage } from './ResponsiveImage';

interface HeroSectionProps {
  heroProduct?: Product | null;
  products?: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigate: (route: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  heroProduct,
  products = [],
  onSelectProduct,
  onNavigate,
}) => {
  const showroomPool = products.length > 0 ? products : heroProduct ? [heroProduct] : [];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (showroomPool.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % showroomPool.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [showroomPool.length]);

  const currentProduct = showroomPool[currentIndex % (showroomPool.length || 1)] || null;

  return (
    <section className="relative bg-white text-zinc-900 overflow-hidden py-12 sm:py-16 md:py-24 border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          
          {/* Left Column - Editorial Headline & Navigation */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-zinc-900 text-white px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                <span>OFFICIAL DIE-CAST VAULT</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full text-[11px] font-mono font-semibold border border-zinc-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Factory Mint</span>
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-900 leading-[1.02] font-sans">
                Precision Die-Cast. <br />
                <span className="text-zinc-500 font-medium">Bespoke Creations.</span>
              </h1>
              <p className="text-sm sm:text-base text-zinc-600 max-w-xl font-normal leading-relaxed">
                Authentic 1:64 scale collector models from Hot Wheels, Majorette, Mini GT, and CCA — alongside handcrafted photo blister cards, bouquets, and wall displays.
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('scalemodels')}
                className="bg-zinc-900 hover:bg-zinc-800 text-white font-mono font-bold px-6 sm:px-7 py-3.5 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/10 transition-all cursor-pointer min-h-[48px]"
              >
                <Car className="w-4 h-4 text-red-500" />
                <span>Explore Scale Models</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('customcreation')}
                className="bg-white hover:bg-zinc-50 text-zinc-900 font-mono font-bold px-5 sm:px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider border border-zinc-200 hover:border-zinc-900 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer min-h-[48px]"
              >
                <Sparkles className="w-4 h-4 text-red-600" />
                <span>Custom Creation</span>
              </button>

              <button
                onClick={() => onNavigate('valuescanner')}
                className="bg-zinc-950 hover:bg-zinc-900 text-white font-mono font-bold px-5 sm:px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider border border-sky-500/40 hover:border-sky-400 flex items-center justify-center gap-2 shadow-md shadow-sky-500/10 transition-all cursor-pointer min-h-[48px] group"
              >
                <Sparkles className="w-4 h-4 text-sky-400 group-hover:rotate-12 transition-transform" />
                <span>AI Value Scanner</span>
                <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1.5 py-0.5 rounded font-mono font-bold tracking-tight">
                  AI-Powered
                </span>
              </button>
            </div>

            {/* Three Clean Apple-Style Standard Badges */}
            <div className="pt-6 border-t border-zinc-100 grid grid-cols-3 gap-3 text-left font-mono">
              <div className="space-y-0.5">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Packaging</div>
                <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Armored Box</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Dispatch</div>
                <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-zinc-600" />
                  <span>24–48 Hours</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Quality</div>
                <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Carded / Mint</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Spotlight Showcase Frame */}
          <div className="lg:col-span-5">
            {currentProduct ? (
              <div className="bg-zinc-50 border border-zinc-200/80 rounded-3xl p-6 shadow-xs relative overflow-hidden transition-all text-left">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-200/60">
                  <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                    FEATURED CASTING #{currentIndex + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentIndex((prev) => (prev - 1 + showroomPool.length) % showroomPool.length)}
                      className="p-1.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors cursor-pointer"
                      aria-label="Previous product"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCurrentIndex((prev) => (prev + 1) % showroomPool.length)}
                      className="p-1.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors cursor-pointer"
                      aria-label="Next product"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div 
                  onClick={() => onSelectProduct(currentProduct)}
                  className="aspect-square bg-white rounded-2xl overflow-hidden my-4 flex items-center justify-center p-4 cursor-pointer group relative border border-zinc-200/80"
                >
                  <ResponsiveImage
                    src={currentProduct.image || currentProduct.imageUrl}
                    alt={currentProduct.name}
                    aspectRatio="auto"
                    priority={true}
                    objectFit="contain"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-0.5">
                      {currentProduct.collectorSpecs?.scale || '1:64 Scale'}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                      {currentProduct.name}
                    </div>
                    <div className="text-sm font-black text-zinc-900 font-mono mt-0.5">
                      ₹{currentProduct.price.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectProduct(currentProduct)}
                    className="shrink-0 bg-zinc-900 hover:bg-red-600 text-white font-mono text-[10px] font-bold px-3.5 py-2 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    View
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};
