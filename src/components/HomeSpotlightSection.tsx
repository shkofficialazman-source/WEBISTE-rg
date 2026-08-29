import React from 'react';
import { Product, UserProfile } from '../types';
import { ShoppingBag, Eye, Heart, ArrowRight, Sparkles } from 'lucide-react';
import { isWishlisted, toggleWishlist } from '../wishlist';

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

  // Pick 4-6 spotlight items (prioritize isBestSeller, then top items)
  const spotlightProducts = React.useMemo(() => {
    const bestSellers = products.filter(p => p.isBestSeller);
    if (bestSellers.length >= 4) {
      return bestSellers.slice(0, 4);
    }
    // Fill up to 4 items with other products
    const remaining = products.filter(p => !p.isBestSeller);
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
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-red-600 mb-2 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              <span>Curated Vault Selection</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 font-sans">
              Homepage Spotlight
            </h2>
            <p className="text-sm text-zinc-500 mt-1 max-w-lg font-sans">
              Hand-picked collector castings and top-rated die-cast editions currently featured in our showroom.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToScaleModels}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 hover:text-red-600 transition-colors py-2 px-3 rounded-lg hover:bg-zinc-50 cursor-pointer"
            >
              <span>Scale Models</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNavigateToCustomCreation}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 hover:text-red-600 transition-colors py-2 px-3 rounded-lg hover:bg-zinc-50 cursor-pointer"
            >
              <span>Custom Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Curated 4-Product Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {spotlightProducts.map((product) => {
            const inWishlist = isWishlisted(product.id);
            return (
              <div
                key={product.id}
                onClick={() => onQuickView(product)}
                className="group bg-white rounded-2xl border border-zinc-200/80 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-zinc-900/5 hover:-translate-y-1 cursor-pointer relative"
              >
                {/* Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="bg-zinc-900 text-white text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                    Spotlight
                  </span>
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={(e) => handleToggleWishlist(e, product)}
                  className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-md rounded-full text-zinc-500 hover:text-red-600 transition-colors shadow-xs hover:bg-white cursor-pointer"
                  aria-label="Add to Wishlist"
                >
                  <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-600 text-red-600' : ''}`} />
                </button>

                {/* Image */}
                <div className="aspect-square bg-zinc-50 p-4 flex items-center justify-center overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                      {product.collectorSpecs?.scale || '1:64 Scale'}
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-900 leading-snug line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between mt-2">
                    <div className="text-sm font-black text-zinc-900 font-mono">
                      ₹{product.price.toLocaleString('en-IN')}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product, 1);
                      }}
                      className="bg-zinc-900 hover:bg-red-600 text-white p-2 rounded-xl transition-colors cursor-pointer shadow-xs"
                      title="Add to Cart"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
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
