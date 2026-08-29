import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { getRecentlyViewedProducts, getRecentlyViewedIds, subscribeToRecentlyViewed, clearRecentlyViewed } from '../recentlyViewed';
import { History, Eye, ShoppingCart, Star, Flame, ArrowRight, Trash2 } from 'lucide-react';
import { ResponsiveImage } from './ResponsiveImage';

interface RecentlyViewedSectionProps {
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const RecentlyViewedSection: React.FC<RecentlyViewedSectionProps> = ({
  allProducts,
  onSelectProduct,
  onAddToCart,
}) => {
  const [viewedIds, setViewedIds] = useState<string[]>(getRecentlyViewedIds());

  useEffect(() => {
    const unsub = subscribeToRecentlyViewed((ids) => setViewedIds(ids));
    return () => unsub();
  }, []);

  const recentlyViewed = getRecentlyViewedProducts(allProducts, viewedIds);

  if (recentlyViewed.length === 0) {
    return null;
  }

  return (
    <section className="py-10 bg-zinc-50/70 border-t border-b border-zinc-200/80 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-200 text-red-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-zinc-900 font-mono flex items-center gap-2">
                <span>Recently Viewed Collectibles</span>
                <span className="text-xs bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded-full font-bold">
                  {recentlyViewed.length}
                </span>
              </h3>
              <p className="text-xs text-zinc-500 font-mono">
                Jump back to models you inspected earlier
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => clearRecentlyViewed()}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-red-600 transition cursor-pointer p-1"
            title="Clear viewing history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear History</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {recentlyViewed.map((product) => {
            const isOutOfStock = product.stockCount !== undefined && product.stockCount <= 0;
            const isLowStock = product.stockCount !== undefined && product.stockCount > 0 && product.stockCount <= 3;

            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group relative bg-white border border-zinc-200 hover:border-red-400 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-200 hover:shadow-md cursor-pointer text-left"
              >
                {/* Low Stock Badge */}
                {isLowStock && (
                  <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                    <Flame className="w-2.5 h-2.5" />
                    <span>{product.stockCount} left</span>
                  </div>
                )}

                {/* Product Image */}
                <div className="aspect-square bg-zinc-50 rounded-lg overflow-hidden flex items-center justify-center p-2 mb-2 border border-zinc-100 group-hover:scale-105 transition-transform duration-300">
                  <ResponsiveImage
                    src={product.image || product.imageUrl}
                    alt={product.name}
                    aspectRatio="auto"
                    objectFit="contain"
                    sizes="120px"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono font-bold text-red-600 uppercase truncate">
                    {product.collectorSpecs?.scale || '1:64'}
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900 line-clamp-1 group-hover:text-red-600 transition-colors">
                    {product.name}
                  </h4>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-black font-mono text-xs text-zinc-900">
                      ₹{product.price.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-mono">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{product.rating}</span>
                    </div>
                  </div>
                </div>

                {/* 1-Click Quick Add */}
                <div className="pt-2 mt-2 border-t border-zinc-100 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProduct(product);
                    }}
                    className="text-[10px] font-mono text-zinc-500 hover:text-zinc-900 underline"
                  >
                    Details
                  </button>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                    className={`p-1.5 rounded-lg text-[10px] font-mono font-bold transition flex items-center justify-center cursor-pointer ${
                      isOutOfStock
                        ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                        : 'bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600'
                    }`}
                    title={isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                  >
                    <ShoppingCart className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
