import React, { useState, useEffect } from 'react';
import { Product, UserProfile } from '../types';
import { Sparkles, Shield, Star, Heart, ShoppingBag, Eye, Check, ArrowRight, Gauge, Layers } from 'lucide-react';
import { ResponsiveImage } from './ResponsiveImage';
import { getWishlistIds, toggleWishlistItem, subscribeToWishlist } from '../wishlist';

interface PremiumRareSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onNavigateToCatalog: (category?: string) => void;
  userProfile?: UserProfile | null;
}

export const PremiumRareSection: React.FC<PremiumRareSectionProps> = ({
  products,
  onAddToCart,
  onQuickView,
  onNavigateToCatalog,
  userProfile,
}) => {
  const [wishlistIds, setWishlistIds] = useState<string[]>(getWishlistIds());
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToWishlist((ids) => setWishlistIds(ids));
    return () => unsub();
  }, []);

  const handleToggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlistItem(productId, userProfile);
  };

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1800);
  };

  // Find premium, scale model, or high-tier items
  const premiumProducts = React.useMemo(() => {
    if (!products || products.length === 0) return [];

    const highTier = products.filter((p) => {
      const series = (p.collectorSpecs?.series || '').toLowerCase();
      const wheels = (p.collectorSpecs?.wheels || '').toLowerCase();
      const name = p.name.toLowerCase();
      return (
        p.category === 'scale-models' ||
        p.category === 'frames' ||
        series.includes('premium') ||
        wheels.includes('real rider') ||
        p.price >= 800 ||
        name.includes('premium') ||
        name.includes('scale')
      );
    });

    return highTier.length >= 3 ? highTier.slice(0, 3) : products.slice(0, 3);
  }, [products]);

  if (premiumProducts.length === 0) return null;

  return (
    <section id="premium-rare" className="py-20 bg-zinc-950 text-white relative overflow-hidden border-b border-zinc-800">
      {/* Carbon fiber grid pattern background */}
      <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none"></div>

      {/* Redline Glow Accent Blur */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-red-600/10 blur-[130px] rounded-full pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700/80 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Vault Exclusive • Metal/Metal Chassis</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase italic tracking-tight font-sans text-white">
              Premium & <span className="text-red-500">Rare Finds</span>
            </h2>
            
            <p className="text-zinc-400 text-sm sm:text-base font-normal max-w-2xl">
              Authentic Real Riders rubber tires, die-cast chassis weight, shadowbox mounted art, and rare collector editions designed for center-stage display.
            </p>
          </div>

          <button
            onClick={() => onNavigateToCatalog('scale-models')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono font-bold uppercase text-red-400 hover:text-red-300 transition group cursor-pointer shrink-0"
          >
            <span>Explore Premium Lineup</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 3 Prominent Featured Showcase Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {premiumProducts.map((product) => {
            const isWishlisted = wishlistIds.includes(product.id);
            const isJustAdded = addedProductId === product.id;

            return (
              <div
                key={product.id}
                onClick={() => onQuickView(product)}
                className="group relative bg-zinc-900/90 border border-zinc-800 hover:border-red-500/80 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-2xl hover:shadow-[0_20px_40px_rgba(220,38,38,0.15)] hover:-translate-y-2 cursor-pointer"
              >
                {/* Visual Image Showcase */}
                <div className="relative aspect-16/9 overflow-hidden bg-zinc-950 border-b border-zinc-800">
                  <ResponsiveImage
                    src={product.image}
                    alt={product.name}
                    aspectRatio="16/9"
                    sizes="(max-width: 1024px) 100vw, 400px"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                    <span className="bg-amber-400 text-zinc-950 font-mono font-black text-[10px] uppercase px-2.5 py-0.5 rounded shadow-sm tracking-wider">
                      ★ REAL RIDERS
                    </span>
                    <span className="bg-black/80 backdrop-blur-md text-zinc-300 border border-zinc-700 font-mono text-[9px] uppercase px-2 py-0.5 rounded">
                      Metal/Metal Body
                    </span>
                  </div>

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleWishlist(product.id, e)}
                    aria-label="Wishlist"
                    className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all z-10 cursor-pointer shadow-md ${
                      isWishlisted
                        ? 'bg-red-600 text-white scale-110'
                        : 'bg-zinc-800/80 backdrop-blur-md text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-700'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white text-white' : ''}`} />
                  </button>

                  {/* Overlay Title Pill */}
                  <div className="absolute bottom-3 left-4 right-4 z-10">
                    <div className="text-[11px] font-mono text-red-400 font-bold uppercase tracking-wider">
                      {product.collectorSpecs?.series || 'Premium Collector Edition'}
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <h3 className="font-sans font-black text-lg uppercase text-white group-hover:text-red-400 transition-colors line-clamp-1">
                      {product.name}
                    </h3>

                    <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed font-normal">
                      {product.description || 'Authentic Hot Wheels premium release featuring detailed tampo graphics, real rubber tires, and blister card protection.'}
                    </p>

                    {/* Spec Mini Badges */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-[11px] font-mono text-zinc-300">
                      <div className="flex items-center gap-1.5 bg-zinc-950/80 px-2.5 py-1.5 rounded-lg border border-zinc-800/80">
                        <Gauge className="w-3.5 h-3.5 text-red-500" />
                        <span className="truncate">{product.collectorSpecs?.scale || '1:64 Scale'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-zinc-950/80 px-2.5 py-1.5 rounded-lg border border-zinc-800/80">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span className="truncate">{product.collectorSpecs?.cardCondition || 'Mint Condition'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price and CTA */}
                  <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-mono text-zinc-500 uppercase">Collector Price</div>
                      <div className="text-xl font-black font-sans text-white">
                        ₹{product.price.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickView(product);
                        }}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono font-bold text-xs uppercase px-3 py-2.5 rounded-xl transition cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(product, e)}
                        className={`font-mono font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-600 hover:bg-red-500 text-white active:scale-95 shadow-red-600/30'
                        }`}
                      >
                        {isJustAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                        <span>{isJustAdded ? 'Added' : 'Add to Garage'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
