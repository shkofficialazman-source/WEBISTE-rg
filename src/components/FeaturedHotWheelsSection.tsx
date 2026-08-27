import React, { useState, useMemo } from 'react';
import { Product, UserProfile } from '../types';
import { Flame, Sparkles, Heart, ShoppingBag, Eye, Star, ShieldCheck, ArrowRight, Check, Tag } from 'lucide-react';
import { ResponsiveImage } from './ResponsiveImage';
import { getWishlistIds, toggleWishlistItem, subscribeToWishlist } from '../wishlist';
import { useEffect } from 'react';

interface FeaturedHotWheelsSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onNavigateToCatalog: (category?: string) => void;
  userProfile?: UserProfile | null;
}

export const FeaturedHotWheelsSection: React.FC<FeaturedHotWheelsSectionProps> = ({
  products,
  onAddToCart,
  onQuickView,
  onNavigateToCatalog,
  userProfile,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'mainline' | 'premium' | 'rare' | 'sets'>('all');
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

  // Filter products based on Hot Wheels categories & collector series
  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    let list = [...products];

    if (activeFilter === 'mainline') {
      list = list.filter((p) => {
        const series = (p.collectorSpecs?.series || '').toLowerCase();
        const name = p.name.toLowerCase();
        return series.includes('mainline') || name.includes('mainline') || p.price < 500;
      });
    } else if (activeFilter === 'premium') {
      list = list.filter((p) => {
        const series = (p.collectorSpecs?.series || '').toLowerCase();
        const wheels = (p.collectorSpecs?.wheels || '').toLowerCase();
        const name = p.name.toLowerCase();
        return series.includes('premium') || wheels.includes('real rider') || name.includes('premium') || name.includes('real riders');
      });
    } else if (activeFilter === 'rare') {
      list = list.filter((p) => {
        const series = (p.collectorSpecs?.series || '').toLowerCase();
        const name = p.name.toLowerCase();
        return p.isNewRelease || p.isBestSeller || series.includes('treasure') || series.includes('vintage') || name.includes('rare') || name.includes('chase');
      });
    } else if (activeFilter === 'sets') {
      list = list.filter((p) => p.category === 'bouquets' || p.category === 'frames' || p.category === 'scale-models');
    }

    // Default to at least 4-8 featured items
    return list.slice(0, 8);
  }, [products, activeFilter]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section id="featured-hotwheels" className="py-16 md:py-20 bg-white text-zinc-900 relative border-b border-zinc-200">
      {/* Subtle Carbon Grid Background Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-60 pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-zinc-200">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1 rounded-full text-xs font-mono font-bold text-red-600 uppercase tracking-widest">
              <Flame className="w-3.5 h-3.5 fill-red-600 text-red-600 animate-pulse" />
              <span>Official 1:64 Die-Cast Showroom</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase italic tracking-tight font-sans text-zinc-900">
              Featured <span className="text-red-600">Hot Wheels</span> Collection
            </h2>
            
            <p className="text-zinc-600 text-sm sm:text-base font-normal max-w-2xl">
              Handpicked authentic Mattel Hot Wheels mainlines, premium rubber tire editions, limited chase castings, and collector showcase sets.
            </p>
          </div>

          {/* View Full Catalog Link */}
          <button
            onClick={() => onNavigateToCatalog('all')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono font-bold uppercase text-red-600 hover:text-red-700 transition group cursor-pointer shrink-0"
          >
            <span>View All ({products.length}) Hot Wheels</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Series Quick Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-10 -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { id: 'all', label: '🔥 All Featured' },
            { id: 'premium', label: '⚡ Premium & Real Riders' },
            { id: 'rare', label: '★ Rare & Limited Finds' },
            { id: 'mainline', label: '🏎️ Mainlines' },
            { id: 'sets', label: '🎁 Collector Sets & Frames' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer shrink-0 min-h-[44px] flex items-center gap-1.5 ${
                activeFilter === tab.id
                  ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/25 scale-[1.02]'
                  : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200 hover:text-zinc-900'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Large Prominent Hot Wheels Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          {filteredProducts.map((product) => {
            const isWishlisted = wishlistIds.includes(product.id);
            const isOutOfStock = product.stockCount !== undefined && product.stockCount <= 0;
            const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
            const discountPercent = hasDiscount && product.originalPrice
              ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
              : 0;

            const isJustAdded = addedProductId === product.id;

            return (
              <div
                key={product.id}
                onClick={() => onQuickView(product)}
                className="group relative bg-white border border-zinc-200/90 hover:border-red-500/80 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_36px_rgba(220,38,38,0.12),0_4px_16px_rgba(0,0,0,0.04)] hover:-translate-y-1.5 cursor-pointer"
              >
                {/* Image Container with Badges */}
                <div className="relative aspect-4/3 overflow-hidden bg-zinc-100 border-b border-zinc-100">
                  <ResponsiveImage
                    src={product.image}
                    alt={product.name}
                    aspectRatio="4/3"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  />
                  
                  {/* Subtle Dark Gradient at bottom for text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>

                  {/* Top-Left Stacked Collector Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                    {product.isBestSeller && (
                      <span className="bg-red-600 text-white font-mono font-black text-[9px] uppercase px-2 py-0.5 rounded shadow-xs tracking-wider">
                        ★ Top Collector Pick
                      </span>
                    )}
                    {product.isNewRelease && (
                      <span className="bg-zinc-950 text-amber-400 border border-zinc-800 font-mono font-black text-[9px] uppercase px-2 py-0.5 rounded shadow-xs tracking-wider">
                        New Release
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="bg-emerald-600 text-white font-mono font-black text-[9px] uppercase px-2 py-0.5 rounded shadow-xs tracking-wider">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Top-Right Wishlist Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleWishlist(product.id, e)}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 z-10 cursor-pointer shadow-xs ${
                      isWishlisted
                        ? 'bg-red-600 text-white scale-110 shadow-md shadow-red-600/30'
                        : 'bg-white/90 backdrop-blur-md text-zinc-600 hover:text-red-600 hover:bg-white hover:scale-110 border border-zinc-200'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white text-white' : ''}`} />
                  </button>

                  {/* Bottom Spec Tag Over Image */}
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white text-[10px] font-mono z-10">
                    <span className="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded">
                      {product.collectorSpecs?.casting || '1:64 Die-Cast'}
                    </span>
                    <span className="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded font-bold">
                      {product.collectorSpecs?.series || 'Hot Wheels'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    {/* Series / Tagline */}
                    <div className="flex items-center justify-between gap-1 text-[11px] font-mono font-bold text-red-600 uppercase tracking-wider">
                      <span className="truncate">{product.shortTagline || 'Authentic Hot Wheels'}</span>
                      <span className="text-zinc-400 font-normal shrink-0">Scale 1:64</span>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-sans font-black text-sm sm:text-base uppercase text-zinc-900 line-clamp-1 group-hover:text-red-600 transition-colors">
                      {product.name}
                    </h3>

                    {/* Rating and Stock Indicator */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < Math.floor(product.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-mono font-bold text-zinc-600">
                          {product.rating || 5.0} ({product.reviewsCount || 12})
                        </span>
                      </div>

                      <div className="text-[10px] font-mono font-bold text-emerald-600 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Mint In Box</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Buttons */}
                  <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2.5">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg sm:text-xl font-black font-sans text-zinc-900">
                          ₹{product.price.toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-zinc-400 line-through font-mono">
                            ₹{product.originalPrice?.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {product.stockCount !== undefined && product.stockCount > 0 ? (
                        <span className="text-[10px] font-mono text-zinc-500">
                          {product.stockCount} in stock
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-red-600 font-bold">
                          Limited Run
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickView(product);
                        }}
                        className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-mono font-bold text-xs uppercase py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(product, e)}
                        disabled={isOutOfStock}
                        className={`w-full font-mono font-bold text-xs uppercase py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] shadow-xs ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : isOutOfStock
                            ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20 active:scale-95'
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
                          </>
                        ) : isOutOfStock ? (
                          <span>Sold Out</span>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Shop Now</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner with Direct Link to Vault */}
        <div className="mt-12 p-6 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-zinc-800">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Looking for a specific Hot Wheels casting or Chase car?</span>
            </div>
            <h4 className="text-xl sm:text-2xl font-black uppercase italic font-sans">
              Search over 50+ castings or request a personal collector hunt.
            </h4>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateToCatalog('all')}
              className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-6 py-3.5 rounded-xl text-xs uppercase font-mono tracking-wider transition shadow-lg shadow-red-600/30 cursor-pointer min-h-[44px] flex items-center gap-2"
            >
              <span>Explore Complete Garage</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
