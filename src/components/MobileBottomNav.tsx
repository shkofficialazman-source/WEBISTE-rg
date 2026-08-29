import React from 'react';
import { Home, Sparkles, ShoppingBag, Package, Car, Heart } from 'lucide-react';
import { UserProfile } from '../types';

interface MobileBottomNavProps {
  cartCount: number;
  onOpenCart: () => void;
  onNavigate: (route: string) => void;
  userProfile?: UserProfile | null;
  onOpenOrders?: () => void;
  onOpenWishlist?: () => void;
  currentRoute?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartCount,
  onOpenCart,
  onNavigate,
  onOpenOrders,
  onOpenWishlist,
  currentRoute = 'home',
}) => {
  return (
    <>
      {/* Sticky Mobile Checkout Bar */}
      {cartCount > 0 && (
        <div className="md:hidden fixed bottom-[58px] inset-x-3 z-40 max-w-md mx-auto">
          <button
            onClick={onOpenCart}
            className="w-full bg-zinc-950 hover:bg-zinc-900 text-white font-mono font-bold text-xs uppercase py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-between border border-zinc-800 cursor-pointer min-h-[44px]"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-white" />
              <span>{cartCount} {cartCount === 1 ? 'Item' : 'Items'} in Bag</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <span>Checkout →</span>
            </div>
          </button>
        </div>
      )}

      {/* Main Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation Bar"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-2 py-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-5 items-center gap-1 max-w-md mx-auto">
          {/* 1. Home */}
          <button
            onClick={() => onNavigate('home')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-colors min-h-[44px] cursor-pointer ${
              currentRoute === 'home' ? 'text-red-600 font-bold' : 'text-zinc-500 hover:text-zinc-950'
            }`}
          >
            <Home className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] font-mono font-bold tracking-tight uppercase">Home</span>
          </button>

          {/* 2. Scale Models */}
          <button
            onClick={() => onNavigate('scalemodels')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-colors min-h-[44px] cursor-pointer ${
              currentRoute === 'scalemodels' || ['hotwheels', 'majorette', 'minigt', 'cca'].includes(currentRoute)
                ? 'text-red-600 font-bold'
                : 'text-zinc-500 hover:text-zinc-950'
            }`}
          >
            <Car className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] font-mono font-bold tracking-tight uppercase">Scale</span>
          </button>

          {/* 3. Custom Creation */}
          <button
            onClick={() => onNavigate('customcreation')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-colors min-h-[44px] cursor-pointer ${
              currentRoute === 'customcreation' ? 'text-red-600 font-bold' : 'text-zinc-500 hover:text-zinc-950'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] font-mono font-bold tracking-tight uppercase">Custom</span>
          </button>

          {/* 4. Orders */}
          <button
            onClick={() => {
              if (onOpenOrders) onOpenOrders();
            }}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-zinc-500 hover:text-zinc-950 transition-colors min-h-[44px] cursor-pointer"
          >
            <Package className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] font-mono font-bold tracking-tight uppercase">Orders</span>
          </button>

          {/* 5. Bag */}
          <button
            onClick={onOpenCart}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-zinc-900 transition-colors min-h-[44px] cursor-pointer relative"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 mb-0.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-600 text-white font-mono font-bold text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </div>
            <span className="text-[9px] font-mono font-bold tracking-tight uppercase">Bag</span>
          </button>
        </div>
      </nav>
    </>
  );
};
