import React, { useState, useEffect } from 'react';
import { Product, UserProfile } from '../types';
import { Trophy, Star, ShieldCheck, Heart, ShoppingBag, Eye, Check, ArrowRight } from 'lucide-react';
import { ResponsiveImage } from './ResponsiveImage';
import { getWishlistIds, toggleWishlistItem, subscribeToWishlist } from '../wishlist';

interface CollectorPicksSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onNavigateToCatalog: (category?: string) => void;
  userProfile?: UserProfile | null;
}

export const CollectorPicksSection: React.FC<CollectorPicksSectionProps> = ({
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

  // Select top-rated or bestseller products
  const collectorPicks = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // Sort by best seller, rating, reviewsCount
    const picks = [...products]
      .filter((p) => p.isBestSeller || (p.rating && p.rating >= 4.8) || (p.reviewsCount && p.reviewsCount > 5))
      .sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));

    return picks.length >= 4 ? picks.slice(0, 4) : products.slice(0, 4);
  }, [products]);

  if (collectorPicks.length === 0) return null;

  return (
    <section id="collector-picks" className="py-16 bg-zinc-50 text-zinc-900 relative border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full text-xs font-mono font-bold text-amber-900 uppercase tracking-widest">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Community Voted Favorites</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tight font-sans text-zinc-900">
              Best Sellers & <span className="text-red-600">Collector Picks</span>
            </h2>
            
            <p className="text-zinc-600 text-sm sm:text-base font-normal max-w-2xl">
              The most sought-after castings and die-cast editions in the community, verified for authentic casting lines and mint blister preservation.
            </p>
          </div>

          <button
            onClick={() => onNavigateToCatalog('all')}
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase text-red-600 hover:text-red-700 transition group cursor-pointer"
          >
            <span>See All Collector Favorites</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {collectorPicks.map((product, idx) => {
            const isWishlisted = wishlistIds.includes(product.id);
            const isJustAdded = addedProductId === product.id;
            const isOutOfStock = product.stockCount !== undefined && product.stockCount <= 0;

            return (
              <div
                key={product.id}
                onClick={() => onQuickView(product)}
                className="group relative bg-white border border-zinc-200/90 hover:border-red-500/80 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_rgba(220,38,38,0.1)] hover:-translate-y-1 cursor-pointer"
              >
                {/* Ranking Pill */}
                <div className="absolute top-3 left-3 z-10 bg-zinc-900 text-white font-mono font-black text-[10px] px-2.5 py-0.5 rounded-md shadow-md flex items-center gap-1 border border-zinc-700">
                  <span className="text-amber-400">#{idx + 1}</span>
                  <span>PICK</span>
                </div>

                {/* Wishlist */}
                <button
                  type="button"
                  onClick={(e) => handleToggleWishlist(product.id, e)}
                  aria-label="Wishlist"
                  className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 cursor-pointer shadow-xs ${
                    isWishlisted
                      ? 'bg-red-600 text-white scale-110'
                      : 'bg-white/90 backdrop-blur-md text-zinc-600 hover:text-red-600 border border-zinc-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white text-white' : ''}`} />
                </button>

                {/* Image */}
                <div className="relative aspect-4/3 overflow-hidden bg-zinc-100 border-b border-zinc-100">
                  <ResponsiveImage
                    src={product.image}
                    alt={product.name}
                    aspectRatio="4/3"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"></div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-red-600 uppercase">
                      <span>{product.collectorSpecs?.casting || 'Authentic Hot Wheels'}</span>
                      <span className="text-zinc-500">{product.collectorSpecs?.series || 'Series'}</span>
                    </div>

                    <h3 className="font-sans font-black text-sm uppercase text-zinc-900 line-clamp-1 group-hover:text-red-600 transition-colors">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-1 text-amber-500 pt-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[11px] font-mono font-bold text-zinc-700 ml-1">
                        {product.rating || '5.0'} ({product.reviewsCount || 24})
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <div className="text-base sm:text-lg font-black font-sans text-zinc-900">
                      ₹{product.price.toFixed(2)}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickView(product);
                        }}
                        className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-mono font-bold uppercase px-2.5 py-2 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(product, e)}
                        disabled={isOutOfStock}
                        className={`text-[11px] font-mono font-bold uppercase px-3.5 py-2 rounded-lg transition flex items-center gap-1 shadow-xs ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white active:scale-95'
                        }`}
                      >
                        {isJustAdded ? <Check className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                        <span>{isJustAdded ? 'Added' : 'Add'}</span>
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
