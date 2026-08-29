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
  isLoading?: boolean;
}

export const FeaturedHotWheelsSection: React.FC<FeaturedHotWheelsSectionProps> = ({
  products,
  onAddToCart,
  onQuickView,
  onNavigateToCatalog,
  userProfile,
  isLoading,
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

  if (isLoading && products.length === 0) {
    return (
      <section id="featured-hotwheels" className="py-16 md:py-20 bg-white text-zinc-900 relative border-b border-zinc-200">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-zinc-200">
            <div className="space-y-1 text-left">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight font-sans text-zinc-900">
                Featured Collection
              </h2>
              <p className="text-zinc-600 text-xs sm:text-sm font-normal max-w-2xl">
                Popular authentic Hot Wheels, premium editions, and custom die-cast sets.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={`feat-skeleton-${n}`}
                className="bg-white border border-zinc-200 rounded-2xl overflow-hidden p-4 space-y-4 animate-pulse shadow-xs flex flex-col justify-between"
              >
                <div className="aspect-4/3 bg-zinc-100 rounded-xl"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
                  <div className="h-3 bg-zinc-100 rounded w-1/2"></div>
                </div>
                <div className="h-10 bg-zinc-200 rounded-xl pt-2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section id="featured-hotwheels" className="py-16 md:py-20 bg-white text-zinc-900 relative border-b border-zinc-200">
      {/* Subtle Carbon Grid Background Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-60 pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-zinc-200">
          <div className="space-y-1 text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight font-sans text-zinc-900">
              Featured Collection
            </h2>
            <p className="text-zinc-600 text-xs sm:text-sm font-normal max-w-2xl">
              Popular authentic Hot Wheels, premium editions, and custom die-cast sets.
            </p>
          </div>

          {/* View Full Catalog Link */}
          <button
            onClick={() => onNavigateToCatalog('all')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 transition cursor-pointer shrink-0"
          >
            <span>View All ({products.length}) Cars</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Series Quick Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { id: 'all', label: 'All Featured' },
            { id: 'premium', label: 'Premiums' },
            { id: 'rare', label: 'Rare Finds' },
            { id: 'mainline', label: 'Mainlines' },
            { id: 'sets', label: 'Gift Sets' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer shrink-0 min-h-[40px] flex items-center ${
                activeFilter === tab.id
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Hot Wheels Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
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
                className="group relative bg-white border border-zinc-200 hover:border-red-500/80 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
              >
                {/* Image Container with Badges */}
                <div className="relative aspect-4/3 overflow-hidden bg-zinc-50 border-b border-zinc-100 p-2 flex items-center justify-center">
                  <ResponsiveImage
                    src={product.image || product.imageUrl}
                    alt={product.name}
                    aspectRatio="auto"
                    objectFit="contain"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ease-out"
                  />

                  {/* Top Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    {isOutOfStock ? (
                      <span className="bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                        Sold Out
                      </span>
                    ) : product.isBestSeller ? (
                      <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                        Bestseller
                      </span>
                    ) : product.isNewRelease ? (
                      <span className="bg-zinc-900 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                        New
                      </span>
                    ) : hasDiscount ? (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                        {discountPercent}% OFF
                      </span>
                    ) : null}
                  </div>

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleWishlist(product.id, e)}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 cursor-pointer shadow-xs ${
                      isWishlisted
                        ? 'bg-red-600 text-white'
                        : 'bg-white/90 text-zinc-500 hover:text-red-600 hover:bg-white border border-zinc-200'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white text-white' : ''}`} />
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-left">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span className="truncate">{product.category}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-zinc-800 text-xs">{product.rating || 5.0}</span>
                      </div>
                    </div>

                    <h3 className="font-sans font-bold text-sm text-zinc-900 line-clamp-1 group-hover:text-red-600 transition-colors">
                      {product.name}
                    </h3>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-lg font-black font-sans text-zinc-900">
                        ₹{product.price.toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-zinc-400 line-through">
                          ₹{product.originalPrice?.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <div className="pt-2 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(product, e)}
                      disabled={isOutOfStock}
                      className={`w-full font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] ${
                        isJustAdded
                          ? 'bg-emerald-600 text-white'
                          : isOutOfStock
                          ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                      }`}
                    >
                      {isJustAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added to Cart</span>
                        </>
                      ) : isOutOfStock ? (
                        <span>Sold Out</span>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
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
