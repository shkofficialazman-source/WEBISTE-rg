import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Flame, Gift, Truck, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { ResponsiveImage } from './ResponsiveImage';

interface HeroSectionProps {
  heroProduct?: Product | null;
  products?: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigate: (sectionId: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  heroProduct,
  products = [],
  onSelectProduct,
  onNavigate,
}) => {
  // Pool of products for the featured showroom
  const showroomPool = products.length > 0 ? products : heroProduct ? [heroProduct] : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate 2 products every 2 seconds
  useEffect(() => {
    if (showroomPool.length <= 2 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 2) % showroomPool.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [showroomPool.length, isPaused]);

  // Compute the 2 products for the current rotation
  const getVisiblePair = (): Product[] => {
    if (showroomPool.length === 0) return [];
    if (showroomPool.length === 1) return [showroomPool[0]];
    
    const first = showroomPool[currentIndex % showroomPool.length];
    const second = showroomPool[(currentIndex + 1) % showroomPool.length];
    return [first, second];
  };

  const visibleProducts = getVisiblePair();
  const totalSlides = Math.ceil(showroomPool.length / 2);
  const currentSlide = Math.floor(currentIndex / 2);

  const handleNext = () => {
    if (showroomPool.length > 2) {
      setCurrentIndex((prev) => (prev + 2) % showroomPool.length);
    }
  };

  const handlePrev = () => {
    if (showroomPool.length > 2) {
      setCurrentIndex((prev) => (prev - 2 + showroomPool.length) % showroomPool.length);
    }
  };

  return (
    <section className="relative bg-gradient-to-b from-zinc-50 via-white to-zinc-50 text-zinc-900 overflow-hidden py-12 md:py-20 border-b border-zinc-200">
      {/* Background Racing Atmosphere Grid */}
      <div className="absolute inset-0 bg-carbon opacity-80"></div>
      
      {/* Redline Glow Accent Blur */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column - Copy & Action Buttons */}
          <div className="lg:col-span-5 space-y-6 text-left">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-red-600 tracking-wider uppercase shadow-xs">
              <Flame className="w-4 h-4 text-red-600 fill-red-600 animate-bounce" />
              <span>Premium Showroom Meets Nostalgia</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase italic leading-[1.08] font-sans text-zinc-900">
              Fuel Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-zinc-900">
                Collections.
              </span>
            </h1>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-zinc-700">
              Buy Authentic Hot Wheels Online in India — Bouquets, Frames & Custom Cards
            </h2>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-zinc-600 max-w-xl font-normal leading-relaxed">
              Transform authentic Hot Wheels die-cast cars into jaw-dropping bouquets, museum-grade shadowbox wall frames, and custom photo blister cards. The ultimate gift for car enthusiasts, collectors, and partners.
            </p>

            {/* CTAs */}
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3.5">
              <button
                onClick={() => onNavigate('catalog')}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-extrabold px-6 py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-red-600/25 hover:shadow-red-500/40 active:scale-95 group cursor-pointer min-h-[44px]"
              >
                <span>Explore Garage</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('scanner')}
                className="w-full sm:w-auto bg-white hover:bg-zinc-50 text-zinc-900 font-extrabold px-5 py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider border border-zinc-300 hover:border-red-600 flex items-center justify-center gap-2 transition-all active:scale-95 group shadow-xs cursor-pointer min-h-[44px]"
              >
                <Camera className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
                <span>Scan Hot Wheels</span>
              </button>
            </div>

            {/* Trust Highlights Strip */}
            <div className="pt-4 sm:pt-5 border-t border-zinc-200 grid grid-cols-3 gap-2 sm:gap-3 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 bg-zinc-50/70 sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-zinc-200">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-zinc-900 uppercase leading-tight">100% Authentic</div>
                  <div className="text-[8px] sm:text-[9px] text-zinc-500 font-mono">Licensed Cars</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 bg-zinc-50/70 sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-zinc-200">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-zinc-900 uppercase leading-tight">Fast Dispatch</div>
                  <div className="text-[8px] sm:text-[9px] text-zinc-500 font-mono">24-48H Express</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 bg-zinc-50/70 sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-zinc-200">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                  <Gift className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-zinc-900 uppercase leading-tight">Gift Ready</div>
                  <div className="text-[8px] sm:text-[9px] text-zinc-500 font-mono">Satin Wrap</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - 2-Product Auto-Rotating Showroom Stage */}
          <div 
            className="lg:col-span-7 relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Soft accent glow backing */}
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 via-zinc-200 to-red-600/20 rounded-3xl blur-md opacity-60"></div>
            
            <div className="relative bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 overflow-hidden">
              
              {/* Top Header Controls with Live Rotation Indicator */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white font-mono font-black text-[10px] px-2.5 py-1 uppercase rounded-md tracking-wider shadow-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    FEATURED SHOWROOM
                  </span>
                  <span className="hidden sm:inline-flex text-[10px] font-mono text-zinc-400">
                    (Auto-Rotating every 2s)
                  </span>
                </div>

                {showroomPool.length > 2 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrev}
                      aria-label="Previous featured item"
                      className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1 px-1.5 font-mono text-[10px] text-zinc-500 font-bold">
                      <span className="text-red-600">{currentSlide + 1}</span>
                      <span>/</span>
                      <span>{Math.max(1, totalSlides)}</span>
                    </div>

                    <button
                      onClick={handleNext}
                      aria-label="Next featured item"
                      className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* 2-Product Animated Container */}
              {visibleProducts.length > 0 ? (
                <div className="relative min-h-[360px] sm:min-h-[340px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`slide-${currentIndex}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className={`grid gap-3.5 sm:gap-4 ${
                        visibleProducts.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-md mx-auto'
                      }`}
                    >
                      {visibleProducts.map((product, idx) => (
                        <div
                          key={`${product.id}-${currentIndex}-${idx}`}
                          className="bg-zinc-50/90 hover:bg-white border border-zinc-200 hover:border-red-500/40 rounded-xl p-3 flex flex-col justify-between transition-all duration-300 shadow-xs hover:shadow-md group text-left"
                        >
                          {/* Image & Badges */}
                          <div className="space-y-2.5">
                            <div className="relative rounded-lg overflow-hidden border border-zinc-200">
                              <ResponsiveImage
                                src={product.image}
                                alt={product.name}
                                aspectRatio="4/3"
                                priority={currentIndex === 0}
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                                {product.isBestSeller && (
                                  <span className="bg-amber-500 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded shadow-xs uppercase">
                                    ★ Best Seller
                                  </span>
                                )}
                                {product.isNewRelease && (
                                  <span className="bg-red-600 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded shadow-xs uppercase">
                                    New Drop
                                  </span>
                                )}
                              </div>
                              <div className="absolute bottom-1.5 right-2 bg-black/60 backdrop-blur-xs text-white font-mono text-[9px] px-1.5 py-0.5 rounded z-10">
                                {product.stockCount > 0 ? `${product.stockCount} in stock` : 'Made to order'}
                              </div>
                            </div>

                            {/* Product Info */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-red-600 font-mono font-bold uppercase tracking-wider truncate">
                                  {product.shortTagline || 'Authentic Hot Wheels'}
                                </span>
                              </div>
                              <h4 className="text-xs sm:text-sm font-black uppercase text-zinc-900 line-clamp-1 group-hover:text-red-600 transition-colors">
                                {product.name}
                              </h4>
                            </div>
                          </div>

                          {/* Price & CTA */}
                          <div className="pt-2.5 mt-2 border-t border-zinc-200/80 flex items-center justify-between gap-2">
                            <div className="text-zinc-900 font-mono font-black text-sm sm:text-base">
                              ₹{product.price.toFixed(2)}
                            </div>
                            <button
                              onClick={() => onSelectProduct(product)}
                              className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold font-mono uppercase px-3 py-2 rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <span>View</span>
                              <span>→</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>

                  {/* Auto-Rotation Progress Bar */}
                  {showroomPool.length > 2 && (
                    <div className="mt-3.5 pt-2 border-t border-zinc-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalSlides }).map((_, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => setCurrentIndex(sIdx * 2)}
                            aria-label={`Go to showroom slide ${sIdx + 1}`}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                              sIdx === currentSlide
                                ? 'w-6 bg-red-600'
                                : 'w-2 bg-zinc-200 hover:bg-zinc-300'
                            }`}
                          />
                        ))}
                      </div>

                      <span className="text-[10px] font-mono text-zinc-400">
                        {isPaused ? 'Paused' : 'Cycling pairs'}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 font-mono uppercase">Showroom Loading</h3>
                  <p className="text-xs text-zinc-500">Live products syncing from garage vault...</p>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

