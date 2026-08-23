import React, { useState, useEffect } from 'react';
import { Product, UserProfile } from '../types';
import { getWishlistIds, toggleWishlistItem, subscribeToWishlist } from '../wishlist';
import { trackProductView } from '../recentlyViewed';
import { X, Heart, ShoppingBag, Trash2, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  userProfile?: UserProfile | null;
  onOpenCustomerLogin?: () => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  products,
  onAddToCart,
  onQuickView,
  userProfile,
  onOpenCustomerLogin,
}) => {
  const [wishlistIds, setWishlistIds] = useState<string[]>(getWishlistIds());

  useEffect(() => {
    const unsubscribe = subscribeToWishlist((ids) => {
      setWishlistIds(ids);
    });
    return () => unsubscribe();
  }, []);

  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));

  const handleRemove = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlistItem(productId, userProfile);
  };

  const handleAddAndClose = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    trackProductView(product.id);
    onAddToCart(product);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm animate-fade-in flex justify-end">
      <div className="w-full max-w-md bg-white text-zinc-900 h-full max-h-[100dvh] border-l border-zinc-200 flex flex-col justify-between shadow-2xl relative">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <Heart className="w-5 h-5 fill-red-600" />
            </div>
            <div>
              <h2 className="font-extrabold uppercase font-sans tracking-tight text-base sm:text-lg text-zinc-900 leading-tight">
                My Dream Garage ({wishlistedProducts.length})
              </h2>
              <p className="text-[11px] text-zinc-500 font-mono">
                {userProfile ? `Saved to ${userProfile.name}'s account` : 'Saved in this browser'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close Wishlist"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Not Logged In Banner */}
        {!userProfile && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 px-4 flex items-center justify-between text-xs font-mono shrink-0">
            <div className="text-amber-800 text-[11px] leading-tight">
              <span className="font-bold">Sync across devices:</span> Sign in to back up your wishlist!
            </div>
            {onOpenCustomerLogin && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCustomerLogin();
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] uppercase px-2.5 py-1 rounded-lg transition shrink-0 ml-2"
              >
                Sign In
              </button>
            )}
          </div>
        )}

        {/* Wishlist Items List */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto divide-y divide-zinc-200">
          {wishlistedProducts.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 my-auto">
              <div className="w-16 h-16 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-300 flex items-center justify-center">
                <Heart className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-zinc-900 uppercase font-mono text-sm">
                  Your Wishlist is Empty
                </h3>
                <p className="text-xs text-zinc-500 max-w-[240px] leading-relaxed">
                  Tap the heart icon on any Hot Wheels casting or gift set to save it for later.
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase px-6 py-3 rounded-xl cursor-pointer min-h-[44px] shadow-sm active:scale-95 transition-all"
              >
                Explore Showroom
              </button>
            </div>
          ) : (
            wishlistedProducts.map((product) => {
              const isOutOfStock = product.stockCount !== undefined && product.stockCount <= 0;
              return (
                <div
                  key={product.id}
                  onClick={() => {
                    trackProductView(product.id);
                    onQuickView(product);
                  }}
                  className="py-4 first:pt-0 last:pb-0 flex gap-3 text-left group cursor-pointer hover:bg-zinc-50/60 p-2 rounded-xl transition"
                >
                  <img
                    src={getOptimizedImageUrl(product.image, { width: 160, height: 160, quality: 75 })}
                    alt={product.name}
                    width={80}
                    height={80}
                    loading="lazy"
                    decoding="async"
                    className="w-20 h-20 object-cover rounded-xl border border-zinc-200 shrink-0 bg-zinc-100 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <div className="text-[10px] font-mono text-red-600 font-bold uppercase">
                            {product.category}
                          </div>
                          <h4 className="font-bold text-xs sm:text-sm text-zinc-900 font-sans leading-tight line-clamp-1">
                            {product.name}
                          </h4>
                        </div>
                        <button
                          onClick={(e) => handleRemove(product.id, e)}
                          className="text-zinc-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-zinc-100 transition cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                          title="Remove from wishlist"
                          aria-label="Remove from wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-extrabold text-sm text-zinc-900 font-mono">
                          ₹{product.price.toFixed(2)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-[11px] text-zinc-400 line-through font-mono">
                            ₹{product.originalPrice.toFixed(2)}
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="text-[9px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-mono font-bold">
                            Sold Out
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={(e) => handleAddAndClose(product, e)}
                        disabled={isOutOfStock}
                        className={`flex-1 font-mono font-bold text-[11px] uppercase py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all min-h-[36px] ${
                          isOutOfStock
                            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-xs active:scale-95 cursor-pointer'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{isOutOfStock ? 'Sold Out' : 'Add To Cart'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {wishlistedProducts.length > 0 && (
          <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0 font-mono text-xs">
            <span className="text-zinc-600">
              Total Saved Value: <span className="font-bold text-zinc-900">₹{wishlistedProducts.reduce((acc, p) => acc + p.price, 0).toFixed(2)}</span>
            </span>
            <button
              onClick={onClose}
              className="bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold px-4 py-2 rounded-xl transition cursor-pointer min-h-[40px]"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
