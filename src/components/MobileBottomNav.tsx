import React from 'react';
import { Home, Sparkles, ShoppingCart, ShoppingBag, MessageCircle, Package, Flame } from 'lucide-react';
import { UserProfile } from '../types';
import { BRAND_WHATSAPP_GROUP_URL } from '../brandAssets';

interface MobileBottomNavProps {
  cartCount: number;
  onOpenCart: () => void;
  onNavigate: (sectionId: string) => void;
  userProfile?: UserProfile | null;
  onOpenOrders?: () => void;
  onOpenCustomerLogin?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartCount,
  onOpenCart,
  onNavigate,
  userProfile,
  onOpenOrders,
  onOpenCustomerLogin,
}) => {
  return (
    <>
      {/* Sticky Mobile Checkout Bar (Visible when cart has items) */}
      {cartCount > 0 && (
        <div className="md:hidden fixed bottom-[60px] inset-x-3 z-40 max-w-md mx-auto animate-bounce-short">
          <button
            onClick={onOpenCart}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs uppercase py-2.5 px-4 rounded-2xl shadow-xl shadow-red-600/30 flex items-center justify-between border border-red-400/50 cursor-pointer min-h-[44px]"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>{cartCount} {cartCount === 1 ? 'item' : 'items'} in Cart</span>
            </div>
            <div className="flex items-center gap-1 font-black text-amber-200">
              <span>Checkout</span>
              <span>→</span>
            </div>
          </button>
        </div>
      )}

      <nav
        aria-label="Mobile Navigation Bar"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-zinc-200/90 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] px-2 py-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]"
      >
      <div className="grid grid-cols-5 items-center gap-1 max-w-md mx-auto">
        {/* 1. Home */}
        <button
          onClick={() => onNavigate('hero')}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-zinc-600 active:text-red-600 active:bg-zinc-100/80 transition-all min-h-[48px] cursor-pointer"
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono font-bold tracking-tight uppercase">Home</span>
        </button>

        {/* 2. Shop Catalog */}
        <button
          onClick={() => onNavigate('catalog')}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-zinc-600 active:text-red-600 active:bg-zinc-100/80 transition-all min-h-[48px] cursor-pointer"
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono font-bold tracking-tight uppercase">Shop</span>
        </button>

        {/* 3. My Orders / Track (Prominent Center/Quick Access) */}
        <button
          onClick={() => {
            if (onOpenOrders) onOpenOrders();
          }}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-zinc-700 active:text-red-600 active:bg-zinc-100/80 transition-all min-h-[48px] cursor-pointer"
        >
          <Package className="w-5 h-5 mb-0.5 text-red-600" />
          <span className="text-[10px] font-mono font-bold tracking-tight uppercase text-zinc-900">Orders</span>
        </button>

        {/* 4. WhatsApp VIP Community Group */}
        <a
          href={BRAND_WHATSAPP_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-emerald-600 active:bg-emerald-50 transition-all min-h-[48px] relative"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 mb-0.5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-tight uppercase text-emerald-700">VIP Club</span>
        </a>

        {/* 5. Cart with Live Badge */}
        <button
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-zinc-700 active:text-red-600 active:bg-zinc-100/80 transition-all min-h-[48px] cursor-pointer relative"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-red-600 text-white font-mono font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-xs">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono font-bold tracking-tight uppercase">Cart</span>
        </button>
      </div>
    </nav>
    </>
  );
};
