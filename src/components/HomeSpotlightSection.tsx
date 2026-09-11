import React from 'react';
import { Product, UserProfile } from '../types';
import { ShoppingBag, Eye, Heart, ArrowRight, Sparkles } from 'lucide-react';
import { isWishlisted, toggleWishlist } from '../wishlist';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface HomeSpotlightSectionProps {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onQuickView: (product: Product) => void;
  onNavigateToScaleModels: () => void;
  onNavigateToCustomCreation: () => void;
  userProfile?: UserProfile | null;
}

export const HomeSpotlightSection: React.FC<HomeSpotlightSectionProps> = ({
  products,
  onAddToCart,
  onQuickView,
  onNavigateToScaleModels,
  onNavigateToCustomCreation,
}) => {
  const [wishlistVersion, setWishlistVersion] = React.useState(0);

  // Pick 4-6 spotlight items (strictly official store products, excluding marketplace)
  const spotlightProducts = React.useMemo(() => {
    const validStoreProducts = products.filter(p => {
      if (!p) return false;
      const id = String(p.id || '').toLowerCase();
      const cat = String(p.category || '').toLowerCase();
      const colId = String(p.collectionId || (p as any).collection_id || '').toLowerCase();
      const colIds = ((p as any).collectionIds || []).map((c: string) => String(c).toLowerCase());
      const isMkt = (p as any).isMarketplace === true || (p as any).source === 'marketplace' || (p as any).is_marketplace === true;

      if (id.startsWith('reseller') || id.startsWith('market_') || id.startsWith('mkt_')) return false;
      if (cat === 'marketplace' || colId === 'marketplace' || colIds.includes('marketplace')) return false;
      if (isMkt) return false;
      return true;
    });

    const bestSellers = validStoreProducts.filter(p => p.isBestSeller);
    if (bestSellers.length >= 4) {
      return bestSellers.slice(0, 4);
    }
    // Fill up to 4 items with other products
    const remaining = validStoreProducts.filter(p => !p.isBestSeller);
    return [...bestSellers, ...remaining].slice(0, 4);
  }, [products]);

  const handleToggleWishlist = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    toggleWishlist(product.id);
    setWishlistVersion(v => v + 1);
  };

  if (spotlightProducts.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-white text-zinc-900 border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-6">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-red-600 mb-3 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              <span>Curated Vault Selection</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-display font-black tracking-tight text-zinc-950 font-sans">
              Homepage Spotlight
            </h2>
            <p className="text-sm text-zinc-600 mt-2 max-w-lg font-sans leading-relaxed">
              Hand-picked collector castings and top-rated die-cast editions currently featured in our showroom.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToScaleModels}
              className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-950 hover:text-red-600 transition-colors py-2.5 px-4 rounded-xl hover:bg-zinc-50 border border-zinc-200 cursor-pointer"
            >
              <span>Scale Models</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNavigateToCustomCreation}
              className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-950 hover:text-red-600 transition-colors py-2.5 px-4 rounded-xl hover:bg-zinc-50 border border-zinc-200 cursor-pointer"
            >
              <span>Custom Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Curated 4-Product Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {spotlightProducts.map((product) => {
            const inWishlist = isWishlisted(product.id);
            const isOutOfStock = product.stockCount !== undefined && product.stockCount <= 0;
            return (
              <div
                key={product.id}
                onClick={() => onQuickView(product)}
                className="group bg-white rounded-2xl border border-zinc-200/90 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-zinc-950/5 hover:-translate-y-1 cursor-pointer relative"
              >
                {/* Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-zinc-950 text-white text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs">
                    {isOutOfStock ? 'Sold Out' : 'Spotlight'}
                  </span>
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={(e) => handleToggleWishlist(e, product)}
                  className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-md rounded-full text-zinc-500 hover:text-red-600 transition-colors shadow-2xs hover:bg-white cursor-pointer border border-zinc-200/60"
                  aria-label="Add to Wishlist"
                >
                  <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-600 text-red-600' : ''}`} />
                </button>

                {/* Image */}
                <div className="aspect-square bg-zinc-50/70 p-4 sm:p-6 flex items-center justify-center overflow-hidden border-b border-zinc-100 relative">
                  <img
                    src={getOptimizedImageUrl(product.image, { width: 400, quality: 75, format: 'auto', fit: 'contain' })}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    width={300}
                    height={300}
                    className={`w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'opacity-50' : ''}`}
                    loading="lazy"
                    decoding="async"
                  />
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10">
                      <span className="bg-zinc-950 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded uppercase tracking-wider shadow-sm">
                        SOLD OUT
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      {product.collectorSpecs?.scale || '1:64 Scale'}
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-950 leading-snug line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between mt-auto">
                    <div className="text-sm font-black text-zinc-950 font-mono">
                      ₹{product.price.toLocaleString('en-IN')}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfStock) onAddToCart(product, 1);
                      }}
                      disabled={isOutOfStock}
                      className={`p-2.5 rounded-xl transition-colors shadow-xs ${
                        isOutOfStock
                          ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed px-3'
                          : 'bg-zinc-950 hover:bg-red-600 text-white cursor-pointer'
                      }`}
                      title={isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                    >
                      {isOutOfStock ? (
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Sold Out</span>
                      ) : (
                        <ShoppingBag className="w-4 h-4" />
                      )}
                    </button>
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
