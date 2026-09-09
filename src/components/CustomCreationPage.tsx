import React, { useState, useMemo } from 'react';
import { Product, UserProfile } from '../types';
import { ShoppingBag, Eye, Heart, Sparkles, Flower2, Frame, ChevronRight, Upload, CheckCircle2 } from 'lucide-react';
import { isWishlisted, toggleWishlist } from '../wishlist';

interface CustomCreationPageProps {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onQuickView: (product: Product) => void;
  userProfile?: UserProfile | null;
  onNavigateHome: () => void;
  initialCategory?: 'all' | 'frames' | 'bouquets' | 'custom-cards';
}

type CustomCategoryTab = 'all' | 'frames' | 'bouquets' | 'custom-cards';

const CATEGORY_TABS = [
  { id: 'all', name: 'All Creations', icon: Sparkles, desc: 'Explore all handcrafted diecast gifts' },
  { id: 'frames', name: 'Frames', icon: Frame, desc: 'Shadowbox wall displays & casting lineage frames' },
  { id: 'bouquets', name: 'Bouquets', icon: Flower2, desc: 'Die-cast cars wrapped in luxury floral arrangements' },
  { id: 'custom-cards', name: 'Custom Cards', icon: Sparkles, desc: 'Personalized photo blister cards with authentic cars' },
] as const;

export const CustomCreationPage: React.FC<CustomCreationPageProps> = ({
  products,
  onAddToCart,
  onQuickView,
  userProfile,
  onNavigateHome,
  initialCategory = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<CustomCategoryTab>(initialCategory);
  const [wishlistVersion, setWishlistVersion] = useState(0);

  // Synchronize when initialCategory changes via navigation
  React.useEffect(() => {
    if (initialCategory) {
      setActiveTab(initialCategory);
    }
  }, [initialCategory]);

  // Filter custom creation products
  const customProducts = useMemo(() => {
    return products.filter(p => {
      const colId = (p.collectionId || p.category || '').toLowerCase();
      const nameLower = p.name.toLowerCase();
      
      const isCustomItem = ['bouquets', 'frames', 'custom-cards'].includes(colId) || 
        nameLower.includes('bouquet') || 
        nameLower.includes('customized hot wheels card') ||
        nameLower.includes('blister card') ||
        nameLower.includes('frame');

      if (!isCustomItem) return false;

      if (activeTab === 'all') return true;
      if (activeTab === 'bouquets') return colId === 'bouquets' || nameLower.includes('bouquet');
      if (activeTab === 'custom-cards') return colId === 'custom-cards' || nameLower.includes('customized hot wheels card') || nameLower.includes('blister card');
      if (activeTab === 'frames') return colId === 'frames' || nameLower.includes('frame');
      return true;
    });
  }, [products, activeTab]);

  const handleToggleWishlist = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    toggleWishlist(product.id);
    setWishlistVersion(v => v + 1);
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 pt-6 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono text-zinc-500 py-3 mb-6 border-b border-zinc-200/60">
          <button 
            onClick={onNavigateHome}
            className="hover:text-zinc-900 transition-colors cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3 h-3 text-zinc-400" />
          <span className="text-zinc-900 font-semibold">Custom Creation</span>
          {activeTab !== 'all' && (
            <>
              <ChevronRight className="w-3 h-3 text-zinc-400" />
              <span className="text-zinc-900 font-semibold capitalize">
                {CATEGORY_TABS.find(t => t.id === activeTab)?.name}
              </span>
            </>
          )}
        </nav>

        {/* Hero Title & Description */}
        <div className="text-center max-w-3xl mx-auto my-8 sm:my-12">
          <span className="inline-block text-[11px] font-mono uppercase tracking-widest text-zinc-500 bg-zinc-200/60 px-3 py-1 rounded-full mb-3">
            Handcrafted Studio • Gifting & Personalization
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 mb-4 font-sans">
            Custom Creation
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-2xl mx-auto font-sans">
            Bespoke die-cast expressions crafted for car lovers. Transform your favorite castings into personalized cards, floral bouquets, and wall art.
          </p>
        </div>

        {/* 3 Categories Filter Tabs (Apple-Style Segmented Control) */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-md shadow-zinc-900/10'
                    : 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        {customProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {customProducts.map((product) => {
              const inWishlist = isWishlisted(product.id);
              const isCustomCard = (product.category === 'custom-cards' || product.name.toLowerCase().includes('card'));
              const isBouquet = (product.category === 'bouquets' || product.name.toLowerCase().includes('bouquet'));
              const isFrame = (product.category === 'frames' || product.name.toLowerCase().includes('frame'));

              return (
                <div
                  key={product.id}
                  onClick={() => onQuickView(product)}
                  className="group bg-white rounded-3xl border border-zinc-200/80 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-900/5 hover:-translate-y-1 cursor-pointer relative"
                >
                  {/* Category Pill */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-zinc-900/90 backdrop-blur-md text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                      {isCustomCard ? 'Custom Card' : isBouquet ? 'Hot Wheels Bouquet' : 'Shadowbox Frame'}
                    </span>
                  </div>

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => handleToggleWishlist(e, product)}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-md rounded-full text-zinc-500 hover:text-red-600 transition-colors shadow-xs hover:bg-white cursor-pointer"
                    aria-label="Add to Wishlist"
                  >
                    <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-600 text-red-600' : ''}`} />
                  </button>

                  {/* Image Presentation */}
                  <div className="aspect-4/3 bg-zinc-100 p-6 flex items-center justify-center overflow-hidden relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center rounded-2xl transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 leading-snug mb-2 group-hover:text-red-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-4">
                        {product.shortTagline || product.description}
                      </p>

                      {/* Gift Highlights */}
                      <div className="space-y-1.5 mb-6">
                        {(product.giftFeatures || ['Custom Photo / Text Printing', 'Genuine 1:64 Scale Die-Cast Included', 'Gift Boxed Packaging']).slice(0, 3).map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[11px] text-zinc-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                      <div>
                        <div className="text-lg font-black text-zinc-900 font-mono">
                          ₹{product.price.toLocaleString('en-IN')}
                        </div>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="text-xs text-zinc-400 line-through font-mono">
                            ₹{product.originalPrice.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickView(product);
                        }}
                        className="bg-zinc-900 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Customize & Order</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-12 text-center max-w-lg mx-auto my-12 shadow-xs">
            <Frame className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              {activeTab === 'frames' ? 'Wall Frames Collection Coming Soon' : 'No Products Available'}
            </h3>
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
              {activeTab === 'frames'
                ? 'Our custom shadowbox wall art frames and acrylic collector displays are handcrafted on order and being prepared for launch.'
                : 'Browse our popular Hot Wheels Bouquets and Personalized Blister Cards.'}
            </p>
            <button
              onClick={() => setActiveTab('bouquets')}
              className="bg-zinc-900 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl transition-colors cursor-pointer"
            >
              Browse Bouquets & Custom Cards
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
