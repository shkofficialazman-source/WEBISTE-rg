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

const DEFAULT_SHOWCASE_ITEM: Product = {
  id: 'hero-spotlight-default',
  name: 'Porsche 911 GT3 RS Collector Edition',
  category: 'scale-models',
  price: 549,
  originalPrice: 699,
  image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80',
  description: 'Precision 1:64 scale die-cast collector model with realistic tampos and factory carded blister.',
  shortTagline: 'Precision 1:64 Die-Cast Collector Casting',
  stockCount: 12,
  rating: 5,
  reviewsCount: 28,
  giftFeatures: [
    'Collector Display Case Included',
    'Express Dispatch in 24 Hours',
    'Factory Carded Mint Guarantee',
  ],
  collectorSpecs: {
    scale: '1:64 Scale',
    casting: 'Porsche 911 GT3 RS',
    series: 'Car Culture / Redline Special',
    wheels: 'Real Riders Rubber Tires',
    cardCondition: 'Factory Mint Carded',
    authenticity: 'Official Licensed Mattel Genuine'
  }
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  heroProduct,
  products = [],
  onSelectProduct,
  onNavigate,
}) => {
  const showroomPool = products.length > 0 ? products : heroProduct ? [heroProduct] : [DEFAULT_SHOWCASE_ITEM];
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
    <section className="relative bg-white text-zinc-900 overflow-hidden py-10 sm:py-16 md:py-20 border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* Left Column - Editorial Headline & Navigation */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-zinc-950 text-white px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                <span>OFFICIAL DIE-CAST VAULT</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-800 px-3 py-1 rounded-full text-[11px] font-mono font-semibold border border-zinc-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Factory Mint Provenance</span>
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-zinc-950 leading-[1.05]">
                Precision Die-Cast. <br />
                <span className="text-zinc-400 font-medium">Bespoke Creations.</span>
              </h1>
              <p className="text-sm sm:text-base text-zinc-600 max-w-xl font-normal leading-relaxed">
                Authentic 1:64 scale collector models from Hot Wheels, Majorette, Mini GT, and CCA — alongside handcrafted photo blister cards, bouquets, and wall displays.
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('scalemodels')}
                className="btn-press bg-zinc-950 hover:bg-zinc-800 active:bg-black text-white font-mono font-bold px-6 sm:px-7 py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-zinc-950/10 transition-all cursor-pointer min-h-[48px]"
              >
                <Car className="w-4 h-4 text-red-500" />
                <span>Explore Scale Models</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('customcreation')}
                className="btn-press bg-white hover:bg-zinc-50 text-zinc-900 font-mono font-bold px-5 sm:px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider border border-zinc-200 hover:border-zinc-900 flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer min-h-[48px]"
              >
                <Sparkles className="w-4 h-4 text-red-600" />
                <span>Custom Creation</span>
              </button>

              <button
                onClick={() => onNavigate('valuescanner')}
                className="btn-press bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-mono font-bold px-4 sm:px-5 py-3.5 rounded-xl text-xs uppercase tracking-wider border border-zinc-200 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px] group"
              >
                <Sparkles className="w-3.5 h-3.5 text-zinc-500 group-hover:rotate-12 transition-transform" />
                <span>Value Scanner</span>
                <span className="text-[9px] bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded font-mono font-bold">
                  AI
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
              <div className="bg-zinc-50/70 border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all text-left">
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
                  className="aspect-square bg-white rounded-xl overflow-hidden my-4 flex items-center justify-center p-4 cursor-pointer group relative border border-zinc-200/80"
                >
                  <ResponsiveImage
                    src={currentProduct.image || currentProduct.imageUrl}
                    alt={currentProduct.name}
                    aspectRatio="auto"
                    priority={true}
                    objectFit="contain"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-zinc-950 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {currentProduct.collectorSpecs?.scale || '1:64 SCALE'}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 
                      onClick={() => onSelectProduct(currentProduct)}
                      className="text-base font-bold text-zinc-950 hover:text-red-600 transition-colors line-clamp-1 cursor-pointer font-sans"
                    >
                      {currentProduct.name}
                    </h3>
                    <span className="font-mono text-base font-black text-zinc-950">
                      ₹{currentProduct.price.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-200/60 text-[11px] font-mono text-zinc-500">
                    <span>{currentProduct.collectorSpecs?.casting || currentProduct.series || 'Authentic Die-Cast'}</span>
                    <button
                      onClick={() => onSelectProduct(currentProduct)}
                      className="text-zinc-950 hover:text-red-600 font-bold uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </section>
  );
};

