import React from 'react';
import { Product } from '../types';
import { ShoppingBag, Plus, Sparkles, Star, Flame } from 'lucide-react';
import { ResponsiveImage } from './ResponsiveImage';

interface RelatedProductsSectionProps {
  currentProduct: Product;
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const RelatedProductsSection: React.FC<RelatedProductsSectionProps> = ({
  currentProduct,
  allProducts,
  onSelectProduct,
  onAddToCart,
}) => {
  // Find related products (same category or similar price, excluding current)
  const related = React.useMemo(() => {
    const sameCategory = allProducts.filter(
      (p) => p.id !== currentProduct.id && p.category === currentProduct.category
    );
    if (sameCategory.length >= 3) {
      return sameCategory.slice(0, 3);
    }
    const otherProducts = allProducts.filter(
      (p) => p.id !== currentProduct.id && p.category !== currentProduct.category
    );
    return [...sameCategory, ...otherProducts].slice(0, 3);
  }, [currentProduct, allProducts]);

  if (related.length === 0) return null;

  return (
    <div className="pt-4 border-t border-zinc-200 text-left font-sans space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-extrabold text-xs uppercase font-mono tracking-tight text-zinc-900 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-red-600" />
          <span>Frequently Bought Together / Related Castings</span>
        </h4>
        <span className="text-[10px] text-zinc-500 font-mono">Curated Pairings</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {related.map((item) => {
          const isOutOfStock = item.stockCount !== undefined && item.stockCount <= 0;
          return (
            <div
              key={item.id}
              onClick={() => onSelectProduct(item)}
              className="group bg-zinc-50 hover:bg-white border border-zinc-200 hover:border-red-400 rounded-xl p-2.5 flex flex-col justify-between transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div className="aspect-4/3 bg-white rounded-lg overflow-hidden flex items-center justify-center p-1.5 mb-2 border border-zinc-100 group-hover:scale-105 transition-transform">
                <ResponsiveImage
                  src={item.image || item.imageUrl}
                  alt={item.name}
                  aspectRatio="auto"
                  objectFit="contain"
                  sizes="100px"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-1">
                <div className="text-[9px] font-mono font-bold text-red-600 uppercase truncate">
                  {item.collectorSpecs?.scale || '1:64'}
                </div>
                <h5 className="text-xs font-bold text-zinc-900 line-clamp-1 group-hover:text-red-600 transition-colors">
                  {item.name}
                </h5>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="font-black font-mono text-xs text-zinc-900">
                    ₹{item.price.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-0.5 text-[9px] text-amber-500 font-mono">
                    <Star className="w-2.5 h-2.5 fill-amber-400" />
                    <span>{item.rating}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(item);
                }}
                className={`mt-2 w-full py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer ${
                  isOutOfStock
                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                    : 'bg-white hover:bg-red-600 text-zinc-800 hover:text-white border border-zinc-300 hover:border-red-600 shadow-2xs'
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>{isOutOfStock ? 'Sold Out' : '+ Add to Cart'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
