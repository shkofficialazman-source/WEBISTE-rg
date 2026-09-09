import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Menu, X, Package, ChevronDown, Heart, Sparkles, User, LogOut, MessageCircle, Car, Flame, Shield, Flower2, Frame, Truck, Store } from 'lucide-react';
import { UserProfile, PitCrewRole } from '../types';
import { getWishlistIds, subscribeToWishlist } from '../wishlist';
import { RedlineLogo } from './RedlineLogo';
import { BRAND_WHATSAPP_GROUP_URL } from '../brandAssets';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onNavigate: (routeOrSection: string, subParam?: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAdmin?: () => void;
  userProfile?: UserProfile | null;
  onOpenCustomerLogin?: () => void;
  onOpenMyOrders?: () => void;
  onCustomerLogout?: () => void;
  onOpenWishlist?: () => void;
  onOpenPitCrew?: (role?: PitCrewRole) => void;
  currentRoute?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  onNavigate,
  searchQuery,
  setSearchQuery,
  userProfile,
  onOpenCustomerLogin,
  onOpenMyOrders,
  onCustomerLogout,
  onOpenWishlist,
  currentRoute = 'store',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [scaleModelsDropdownOpen, setScaleModelsDropdownOpen] = useState(false);
  const [customCreationDropdownOpen, setCustomCreationDropdownOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState<number>(getWishlistIds().length);

  useEffect(() => {
    const unsub = subscribeToWishlist((ids) => {
      setWishlistCount(ids.length);
    });
    return () => unsub();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.nav-dropdown-wrapper')) {
        setScaleModelsDropdownOpen(false);
        setCustomCreationDropdownOpen(false);
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleLinkClick = (route: string, subParam?: string) => {
    onNavigate(route, subParam);
    setIsMobileMenuOpen(false);
    setScaleModelsDropdownOpen(false);
    setCustomCreationDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 text-zinc-900 transition-all">
      {/* Top Announcement Ticker */}
      <div className="bg-zinc-950 text-white text-[11px] font-mono py-1.5 px-4 tracking-wider flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-300 uppercase tracking-widest text-[10px] font-bold">
            100% AUTHENTIC MATTEL VAULT • INDIA
          </span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-zinc-400 text-[10px]">
          <span>MANGALORE HQ</span>
          <span>•</span>
          <span>ARMORED BOX PACKING</span>
          <span>•</span>
          <span>DISPATCH IN 24H</span>
        </div>
        <a 
          href={BRAND_WHATSAPP_GROUP_URL} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider"
        >
          <MessageCircle className="w-3 h-3 text-emerald-400" />
          <span>VIP Garage Group</span>
        </a>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand Logo -> Home */}
        <button 
          onClick={() => handleLinkClick('home')} 
          className="flex items-center gap-2 group text-left focus:outline-hidden min-h-[44px] cursor-pointer"
          aria-label="Redline Garage Home"
        >
          <RedlineLogo variant="full" theme="light" />
        </button>

        {/* Desktop Navigation Links — Exactly Two Clear Top-Level Links */}
        <nav className="hidden md:flex items-center gap-8 font-mono text-xs font-bold uppercase tracking-widest text-zinc-800">
          {/* Link 1: Scale Models */}
          <div 
            className="relative nav-dropdown-wrapper"
            onMouseEnter={() => setScaleModelsDropdownOpen(true)}
            onMouseLeave={() => setScaleModelsDropdownOpen(false)}
          >
            <button 
              onClick={() => handleLinkClick('scalemodels')} 
              className={`hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1.5 py-2.5 ${
                currentRoute === 'scalemodels' || ['hotwheels', 'majorette', 'minigt', 'cca'].includes(currentRoute) ? 'text-red-600 font-black' : 'text-zinc-900'
              }`}
            >
              <span>Scale Models</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 transition-transform group-hover:rotate-180" />
            </button>

            {/* Hover Sub-Menu for 4 Brands */}
            {scaleModelsDropdownOpen && (
              <div className="absolute left-0 mt-0 w-64 bg-white border border-zinc-200 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in font-sans">
                <button
                  onClick={() => handleLinkClick('scalemodels')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-50 flex items-center justify-between text-xs font-bold text-zinc-900 cursor-pointer"
                >
                  <span className="font-mono uppercase tracking-wider">All Scale Models</span>
                  <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-mono">1:64 Vault</span>
                </button>
                <div className="h-px bg-zinc-100 my-1" />
                <button
                  onClick={() => handleLinkClick('hotwheels')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-50 flex items-center gap-2.5 text-xs text-zinc-800 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <Flame className="w-4 h-4 text-red-600 shrink-0" />
                  <div>
                    <div className="font-bold">Hot Wheels</div>
                    <div className="text-[10px] text-zinc-400 font-normal">Mainlines, Premiums & Chases</div>
                  </div>
                </button>
                <button
                  onClick={() => handleLinkClick('majorette')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-50 flex items-center gap-2.5 text-xs text-zinc-800 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <Car className="w-4 h-4 text-zinc-600 shrink-0" />
                  <div>
                    <div className="font-bold">Majorette</div>
                    <div className="text-[10px] text-zinc-400 font-normal">European Die-Cast Heritage</div>
                  </div>
                </button>
                <button
                  onClick={() => handleLinkClick('minigt')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-50 flex items-center gap-2.5 text-xs text-zinc-800 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <Car className="w-4 h-4 text-zinc-600 shrink-0" />
                  <div>
                    <div className="font-bold">Mini GT</div>
                    <div className="text-[10px] text-zinc-400 font-normal">Collector Grade Precision 1:64</div>
                  </div>
                </button>
                <button
                  onClick={() => handleLinkClick('cca')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-50 flex items-center gap-2.5 text-xs text-zinc-800 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-zinc-600 shrink-0" />
                  <div>
                    <div className="font-bold">CCA</div>
                    <div className="text-[10px] text-zinc-400 font-normal">Exclusive Collector Castings</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Link 2: Custom Creation */}
          <div 
            className="relative nav-dropdown-wrapper"
            onMouseEnter={() => setCustomCreationDropdownOpen(true)}
            onMouseLeave={() => setCustomCreationDropdownOpen(false)}
          >
            <button 
              onClick={() => handleLinkClick('customcreation')} 
              className={`hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1.5 py-2.5 ${
                currentRoute === 'customcreation' ? 'text-red-600 font-black' : 'text-zinc-900'
              }`}
            >
              <span>Custom Creation</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 transition-transform group-hover:rotate-180" />
            </button>

            {/* Hover Sub-Menu for 3 Custom Categories */}
            {customCreationDropdownOpen && (
              <div className="absolute left-0 mt-0 w-64 bg-white border border-zinc-200 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in font-sans">
                <button
                  onClick={() => handleLinkClick('customcreation')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-50 flex items-center justify-between text-xs font-bold text-zinc-900 cursor-pointer"
                >
                  <span className="font-mono uppercase tracking-wider">All Custom Creations</span>
                  <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-mono font-bold">Studio</span>
                </button>
                <div className="h-px bg-zinc-100 my-1" />
                <button
                  onClick={() => handleLinkClick('customcreation', 'frames')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-50 flex items-center gap-2.5 text-xs text-zinc-800 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <Frame className="w-4 h-4 text-zinc-600 shrink-0" />
                  <div>
                    <div className="font-bold">Frames</div>
                    <div className="text-[10px] text-zinc-400 font-normal">Mounted Shadowbox Wall Art</div>
                  </div>
                </button>
                <button
                  onClick={() => handleLinkClick('customcreation', 'bouquets')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-50 flex items-center gap-2.5 text-xs text-zinc-800 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <Flower2 className="w-4 h-4 text-zinc-600 shrink-0" />
                  <div>
                    <div className="font-bold">Bouquets</div>
                    <div className="text-[10px] text-zinc-400 font-normal">Hot Wheels Die-Cast Bouquets</div>
                  </div>
                </button>
                <button
                  onClick={() => handleLinkClick('customcreation', 'custom-cards')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-50 flex items-center gap-2.5 text-xs text-zinc-800 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-zinc-600 shrink-0" />
                  <div>
                    <div className="font-bold">Custom Cards</div>
                    <div className="text-[10px] text-zinc-400 font-normal">Personalized Photo Blister Cards</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Link 3: Track Order */}
          <button 
            onClick={() => handleLinkClick('track-order')} 
            className={`hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1.5 py-2.5 ${
              currentRoute === 'track-order' ? 'text-red-600 font-black' : 'text-zinc-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-zinc-500" />
            <span>Track Order</span>
          </button>

          {/* Link 4: Reseller Marketplace */}
          <button 
            onClick={() => handleLinkClick('marketplace')} 
            className={`hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1.5 py-2.5 ${
              currentRoute === 'marketplace' ? 'text-red-600 font-black' : 'text-zinc-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-red-600" />
            <span>Marketplace</span>
            <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[9px] font-bold rounded uppercase tracking-normal">
              P2P
            </span>
          </button>
        </nav>

        {/* Right Utility Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search */}
          <div className="relative">
            {isSearchOpen ? (
              <div className="flex items-center bg-zinc-100 border border-zinc-300 focus-within:border-zinc-900 rounded-xl px-3 py-1.5 shadow-xs">
                <Search className="w-3.5 h-3.5 text-zinc-500 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search casting, GT-R, frame..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (currentRoute !== 'scalemodels') {
                        handleLinkClick('scalemodels');
                      }
                    }
                  }}
                  className="bg-transparent text-xs text-zinc-900 focus:outline-hidden w-36 sm:w-56 font-sans font-medium"
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
                className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                title="Search Vault"
                aria-label="Open search input"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={onOpenWishlist}
            className="relative p-2 text-zinc-600 hover:text-red-600 hover:bg-zinc-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            title="My Wishlist"
            aria-label="Open Wishlist"
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${wishlistCount > 0 ? 'fill-red-600 text-red-600' : ''}`} />
            {wishlistCount > 0 && (
              <span className="absolute top-1.5 right-1 bg-red-600 text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Customer Account Button */}
          {userProfile ? (
            <div className="relative nav-dropdown-wrapper">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 px-3 py-2 rounded-xl text-xs font-mono font-bold text-zinc-800 transition-all cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-zinc-950 text-white flex items-center justify-center text-[10px] font-black uppercase">
                  {userProfile.name ? userProfile.name.charAt(0) : 'U'}
                </div>
                <span className="max-w-[90px] truncate text-zinc-800 hidden sm:inline">{userProfile.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              </button>

              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 z-50 font-mono text-xs animate-fade-in text-zinc-800">
                  <div className="p-2 border-b border-zinc-100 mb-1">
                    <div className="font-bold text-zinc-900 truncate">{userProfile.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{userProfile.email}</div>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      if (onOpenWishlist) onOpenWishlist();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 text-red-600 fill-red-600" />
                    <span>Wishlist ({wishlistCount})</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      if (onOpenMyOrders) onOpenMyOrders();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5 text-zinc-700" />
                    <span>Track Orders</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      if (onCustomerLogout) onCustomerLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 flex items-center gap-2 transition-colors border-t border-zinc-100 mt-1 pt-2 cursor-pointer"
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
              className="hidden sm:flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 px-3 py-2 rounded-xl text-xs font-mono font-bold text-zinc-800 transition-all cursor-pointer"
              title="Customer Login"
            >
              <User className="w-3.5 h-3.5 text-zinc-700" />
              <span>Login</span>
            </button>
          )}

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="relative bg-zinc-950 hover:bg-zinc-800 text-white px-3.5 py-2.5 rounded-xl flex items-center gap-2 font-mono font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <ShoppingBag className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Bag</span>
            {cartCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-mono font-black w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-zinc-700 hover:text-zinc-900 rounded-lg cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 px-4 py-6 space-y-4 shadow-xl text-zinc-900">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search castings, sets, frames..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsMobileMenuOpen(false);
                  if (currentRoute !== 'scalemodels') {
                    handleLinkClick('scalemodels');
                  }
                }
              }}
              className="w-full bg-zinc-100 border border-zinc-300 text-zinc-900 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-900 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-col space-y-2 font-sans">
            {/* Scale Models */}
            <div className="bg-zinc-50 rounded-2xl p-3 border border-zinc-100">
              <button 
                onClick={() => handleLinkClick('scalemodels')} 
                className="w-full text-left font-bold text-sm text-zinc-900 flex items-center justify-between pb-2 border-b border-zinc-200/60 cursor-pointer"
              >
                <span>Scale Models</span>
                <span className="text-[10px] font-mono bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded">All 1:64</span>
              </button>
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-zinc-600 font-medium">
                <button onClick={() => handleLinkClick('hotwheels')} className="text-left p-1.5 hover:text-red-600 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-red-600" /> Hot Wheels
                </button>
                <button onClick={() => handleLinkClick('majorette')} className="text-left p-1.5 hover:text-red-600 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-zinc-500" /> Majorette
                </button>
                <button onClick={() => handleLinkClick('minigt')} className="text-left p-1.5 hover:text-red-600 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-zinc-500" /> Mini GT
                </button>
                <button onClick={() => handleLinkClick('cca')} className="text-left p-1.5 hover:text-red-600 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-zinc-500" /> CCA
                </button>
              </div>
            </div>

            {/* Custom Creation */}
            <div className="bg-zinc-50 rounded-2xl p-3 border border-zinc-100">
              <button 
                onClick={() => handleLinkClick('customcreation')} 
                className="w-full text-left font-bold text-sm text-zinc-900 flex items-center justify-between pb-2 border-b border-zinc-200/60 cursor-pointer"
              >
                <span>Custom Creation</span>
                <span className="text-[10px] font-mono bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">Studio</span>
              </button>
              <div className="grid grid-cols-3 gap-2 pt-2 text-xs text-zinc-600 font-medium">
                <button onClick={() => handleLinkClick('customcreation', 'frames')} className="text-left p-1.5 hover:text-red-600">
                  Frames
                </button>
                <button onClick={() => handleLinkClick('customcreation', 'bouquets')} className="text-left p-1.5 hover:text-red-600">
                  Bouquets
                </button>
                <button onClick={() => handleLinkClick('customcreation', 'custom-cards')} className="text-left p-1.5 hover:text-red-600">
                  Cards
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLinkClick('track-order');
              }} 
              className="text-left text-zinc-800 hover:text-red-600 py-2.5 flex items-center gap-2 border-b border-zinc-100 font-mono text-xs uppercase tracking-wider font-bold cursor-pointer"
            >
              <Truck className="w-4 h-4 text-red-600" />
              <span>Track Your Order</span>
            </button>

            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLinkClick('marketplace');
              }} 
              className="text-left text-zinc-800 hover:text-red-600 py-2.5 flex items-center justify-between border-b border-zinc-100 font-mono text-xs uppercase tracking-wider font-bold cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-red-600" />
                <span>Reseller Marketplace</span>
              </div>
              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded">P2P</span>
            </button>
          </div>

          <div className="pt-2 border-t border-zinc-200">
            {userProfile ? (
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-2">
                <div className="font-mono text-xs font-bold text-zinc-900">{userProfile.name}</div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onCustomerLogout) onCustomerLogout();
                  }}
                  className="text-xs text-red-600 font-mono font-bold flex items-center gap-1.5 cursor-pointer"
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
                className="w-full bg-zinc-950 text-white font-mono font-bold text-xs uppercase tracking-wider py-3 rounded-xl text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4 text-white" /> Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
