import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Menu, X, PhoneCall, Sparkles, Trophy, User, LogOut, Package, ChevronDown, Heart } from 'lucide-react';
import { UserProfile } from '../types';
import { getWishlistIds, subscribeToWishlist } from '../wishlist';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onNavigate: (sectionId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAdmin?: () => void;
  userProfile?: UserProfile | null;
  onOpenCustomerLogin?: () => void;
  onOpenMyOrders?: () => void;
  onCustomerLogout?: () => void;
  onOpenWishlist?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  onNavigate,
  searchQuery,
  setSearchQuery,
  onOpenAdmin,
  userProfile,
  onOpenCustomerLogin,
  onOpenMyOrders,
  onCustomerLogout,
  onOpenWishlist,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState<number>(getWishlistIds().length);

  useEffect(() => {
    const unsub = subscribeToWishlist((ids) => {
      setWishlistCount(ids.length);
    });
    return () => unsub();
  }, []);

  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 text-zinc-900 shadow-xs transition-all">
      {/* Top Racing Ticker */}
      <div className="bg-red-600 text-white text-xs font-semibold py-1 px-4 text-center tracking-wider flex items-center justify-center gap-3 overflow-hidden">
        <span className="hidden sm:inline-flex items-center gap-1 font-bold uppercase text-[10px] bg-black/20 px-2 py-0.5 rounded">
          <Trophy className="w-3 h-3 text-yellow-300" /> OFFICIAL DIE-CAST GIFTING
        </span>
        <span className="truncate">
          ⚡ FAST 24-48H DISPATCH | FREE GIFT BOX WRAP ON ORDERS OVER ₹50
        </span>
        <a 
          href="https://wa.me/8431294886?text=Hi%20Redline%20Garage!%20I%20have%20a%20question" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1 underline hover:text-yellow-200 transition text-[11px]"
        >
          WhatsApp Concierge
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Name */}
        <button 
          onClick={() => handleNavClick('hero')} 
          className="flex items-center gap-2 sm:gap-3 group text-left focus:outline-hidden min-h-[44px] cursor-pointer"
        >
          <div className="relative w-9 h-9 sm:w-11 sm:h-11 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-base sm:text-xl tracking-tighter shadow-md shadow-red-600/20 group-hover:bg-red-500 transition-colors border border-red-400/30 shrink-0">
            {/* Speed stripes graphic */}
            <div className="absolute inset-0 rounded-lg bg-checkered opacity-20"></div>
            <span className="relative font-black italic">RG</span>
            <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-zinc-900 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-zinc-900 uppercase italic font-mono leading-none">
                REDLINE<span className="text-red-600">.</span>GARAGE
              </span>
            </div>
            <div className="text-[8px] sm:text-[10px] text-zinc-500 uppercase tracking-wider sm:tracking-widest font-mono font-medium truncate max-w-[150px] sm:max-w-none">
              HOT WHEELS & GIFTS
            </div>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 font-medium text-sm text-zinc-700">
          <button 
            onClick={() => handleNavClick('catalog')} 
            className="hover:text-red-600 transition-colors uppercase text-xs font-bold tracking-wider cursor-pointer"
          >
            Shop All
          </button>
          <button 
            onClick={() => handleNavClick('scanner')} 
            className="hover:text-red-600 transition-colors uppercase text-xs font-bold tracking-wider cursor-pointer flex items-center gap-1 text-red-600"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Value Scanner</span>
          </button>
          <button 
            onClick={() => handleNavClick('categories')} 
            className="hover:text-red-600 transition-colors uppercase text-xs font-bold tracking-wider cursor-pointer"
          >
            Bouquets & Frames
          </button>
          <button 
            onClick={() => {
              if (onOpenMyOrders) onOpenMyOrders();
            }} 
            className="hover:text-red-600 transition-colors uppercase text-xs font-bold tracking-wider cursor-pointer flex items-center gap-1 text-zinc-700"
          >
            <Package className="w-3.5 h-3.5 text-red-600" />
            <span>Track Orders</span>
          </button>
          <button 
            onClick={() => handleNavClick('why-us')} 
            className="hover:text-red-600 transition-colors uppercase text-xs font-bold tracking-wider cursor-pointer"
          >
            Why Redline
          </button>
          <button 
            onClick={() => handleNavClick('faq')} 
            className="hover:text-red-600 transition-colors uppercase text-xs font-bold tracking-wider cursor-pointer"
          >
            FAQ
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Quick Search Toggle */}
          <div className="relative">
            {isSearchOpen ? (
              <div className="flex items-center bg-zinc-100 border border-zinc-300 focus-within:border-red-600 rounded-lg px-2.5 py-1 sm:py-1.5 shadow-xs">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500 mr-1.5 shrink-0" />
                <input
                  type="text"
                  placeholder="Search Hot Wheels, GT-R..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-zinc-900 focus:outline-hidden w-28 sm:w-48 font-medium"
                  autoFocus
                />
                <button 
                  onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                  className="text-zinc-400 hover:text-zinc-700 ml-1 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border border-transparent hover:border-zinc-200 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                title="Search Shop"
                aria-label="Open search input"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          {/* Direct WhatsApp Order CTA Button */}
          <a
            href="https://wa.me/8431294886?text=Hello%20Redline%20Garage!%20I'd%20like%20to%20place%20an%20order%20or%20ask%20about%20a%20custom%20gift."
            target="_blank"
            rel="noopener noreferrer"
            className="hidden xl:flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-2 rounded-lg transition-all"
            title="Chat on WhatsApp: +8431294886"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp</span>
          </a>

          {/* Customer Account Button / Dropdown */}
          {userProfile ? (
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 px-3 py-2 rounded-lg text-xs font-mono font-bold text-zinc-800 transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black uppercase">
                  {userProfile.name ? userProfile.name.charAt(0) : 'U'}
                </div>
                <span className="max-w-[100px] truncate text-zinc-800">{userProfile.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              </button>

              {/* User Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-xl p-2 z-50 font-mono text-xs animate-fade-in text-zinc-800">
                  <div className="p-2 border-b border-zinc-100 mb-1">
                    <div className="font-bold text-zinc-900 truncate">{userProfile.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{userProfile.email}</div>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      if (onOpenWishlist) onOpenWishlist();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 flex items-center gap-2 transition-colors"
                  >
                    <Heart className="w-3.5 h-3.5 text-red-600 fill-red-600" />
                    <span>My Wishlist ({wishlistCount})</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      if (onOpenMyOrders) onOpenMyOrders();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 flex items-center gap-2 transition-colors"
                  >
                    <Package className="w-3.5 h-3.5 text-red-600" />
                    <span>View Past Orders</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      if (onCustomerLogout) onCustomerLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 flex items-center gap-2 transition-colors border-t border-zinc-100 mt-1 pt-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenCustomerLogin}
              className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 px-3 py-2 rounded-lg text-xs font-mono font-bold text-zinc-700 hover:text-zinc-900 transition-all"
              title="Customer Login / Signup"
            >
              <User className="w-3.5 h-3.5 text-red-600" />
              <span>Sign In</span>
            </button>
          )}

          {/* Wishlist Button */}
          <button
            onClick={onOpenWishlist}
            className="relative p-2 text-zinc-600 hover:text-red-600 hover:bg-zinc-100 rounded-lg transition-colors border border-transparent hover:border-zinc-200 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            title="My Wishlist"
            aria-label="Open Wishlist"
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${wishlistCount > 0 ? 'fill-red-600 text-red-600' : ''}`} />
            {wishlistCount > 0 && (
              <span className="absolute 1.5 sm:top-2 -right-1 sm:right-1 bg-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Button with Counter */}
          <button
            onClick={onOpenCart}
            className="relative bg-red-600 hover:bg-red-500 text-white p-2.5 sm:px-4 sm:py-2.5 rounded-lg flex items-center gap-2 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-red-600/20 active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="bg-zinc-950 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-red-400">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-zinc-700 hover:text-zinc-900 rounded-lg focus:outline-hidden"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-zinc-200 px-4 py-6 space-y-4 shadow-lg text-zinc-900">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search Hot Wheels, GT-R, Bouquets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-100 border border-zinc-300 text-zinc-900 rounded-lg px-4 py-2.5 text-sm focus:border-red-600 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-col space-y-3 font-semibold text-sm">
            <button 
              onClick={() => handleNavClick('catalog')} 
              className="text-left text-zinc-800 hover:text-red-600 py-1"
            >
              Shop Catalog
            </button>
            <button 
              onClick={() => handleNavClick('scanner')} 
              className="text-left text-red-600 hover:text-red-700 py-1 font-bold flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Value Scanner</span>
            </button>
            <button 
              onClick={() => handleNavClick('categories')} 
              className="text-left text-zinc-800 hover:text-red-600 py-1"
            >
              Bouquets & Frames
            </button>
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (onOpenMyOrders) onOpenMyOrders();
              }} 
              className="text-left text-zinc-800 hover:text-red-600 py-1 flex items-center gap-2 font-semibold"
            >
              <Package className="w-4 h-4 text-red-600" />
              <span>Track Orders (Phone Lookup)</span>
            </button>
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (onOpenWishlist) onOpenWishlist();
              }} 
              className="text-left text-zinc-800 hover:text-red-600 py-1 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-600 fill-red-600" />
                <span>My Wishlist</span>
              </span>
              {wishlistCount > 0 && (
                <span className="bg-red-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => handleNavClick('why-us')} 
              className="text-left text-zinc-800 hover:text-red-600 py-1"
            >
              Why Redline Garage
            </button>
            <button 
              onClick={() => handleNavClick('faq')} 
              className="text-left text-zinc-800 hover:text-red-600 py-1"
            >
              Frequently Asked Questions
            </button>
          </div>

          {/* Customer Auth in Mobile Drawer */}
          <div className="pt-3 border-t border-zinc-200 font-mono text-xs">
            {userProfile ? (
              <div className="space-y-2 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <div className="flex justify-between items-center text-zinc-700">
                  <span className="font-bold text-zinc-900">{userProfile.name}</span>
                  <span className="text-[10px] text-zinc-500">{userProfile.email}</span>
                </div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onOpenMyOrders) onOpenMyOrders();
                  }}
                  className="w-full text-left py-1.5 text-zinc-700 hover:text-red-600 flex items-center gap-2"
                >
                  <Package className="w-3.5 h-3.5 text-red-600" /> View Past Orders
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onCustomerLogout) onCustomerLogout();
                  }}
                  className="w-full text-left py-1.5 text-red-600 hover:text-red-700 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onOpenCustomerLogin) onOpenCustomerLogin();
                }}
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 font-bold py-2.5 rounded-lg text-center flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4 text-red-600" /> Customer Sign In / Register
              </button>
            )}
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <a
              href="https://wa.me/8431294886?text=Hi%20Redline%20Garage!"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-center flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              <PhoneCall className="w-4 h-4" /> Order via WhatsApp (8431294886)
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

