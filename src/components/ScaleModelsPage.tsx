import React, { useState, useMemo } from 'react';
import { Product, UserProfile } from '../types';
import { ShoppingBag, Eye, Heart, Flame, Shield, Car, ChevronRight, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { isWishlisted, toggleWishlist } from '../wishlist';

interface ScaleModelsPageProps {
  products: number extends never ? never : Product[];
  currentSubCollection: 'all' | 'hotwheels' | 'majorette' | 'minigt' | 'cca';
  onSelectSubCollection: (subCol: 'all' | 'hotwheels' | 'majorette' | 'minigt' | 'cca') => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onQuickView: (product: Product) => void;
  userProfile?: UserProfile | null;
  onNavigateHome: () => void;
}

const SUB_COLLECTIONS = [
  { id: 'all', name: 'All Scale Models', icon: Car, count: 0 },
  { id: 'hotwheels', name: 'Hot Wheels', icon: Flame, tag: 'Official Mattel 1:64' },
  { id: 'majorette', name: 'Majorette', icon: Car, tag: 'European Heritage' },
  { id: 'minigt', name: 'Mini GT', icon: Car, tag: 'Collector Grade 1:64' },
  { id: 'cca', name: 'CCA', icon: Shield, tag: 'Exclusive Castings' },
] as const;

export const ScaleModelsPage: React.FC<ScaleModelsPageProps> = ({
  products,
  currentSubCollection,
  onSelectSubCollection,
  onAddToCart,
  onQuickView,
  userProfile,
  onNavigateHome,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [wishlistVersion, setWishlistVersion] = useState(0);

  // Filter scale model products
  const scaleModelProducts = useMemo(() => {
    return products.filter(p => {
      const colId = (p.collectionId || p.category || '').toLowerCase();
      const colIds = (p.collectionIds || []).map(c => c.toLowerCase());
      const nameLower = p.name.toLowerCase();

      // Ensure it belongs to scale-models tier
      const isCustom = ['bouquets', 'frames', 'custom-cards'].includes(colId) || nameLower.includes('bouquet') || nameLower.includes('customized hot wheels card');
      if (isCustom) return false;

      if (currentSubCollection === 'all') return true;
      if (currentSubCollection === 'hotwheels') {
        return colId === 'hotwheels' || colIds.includes('hotwheels') || (!colId.includes('majorette') && !colId.includes('minigt') && !colId.includes('cca'));
      }
      if (currentSubCollection === 'majorette') {
        return colId === 'majorette' || colIds.includes('majorette') || nameLower.includes('majorette');
      }
      if (currentSubCollection === 'minigt') {
        return colId === 'minigt' || colIds.includes('minigt') || nameLower.includes('mini gt') || nameLower.includes('minigt');
      }
      if (currentSubCollection === 'cca') {
        return colId === 'cca' || colIds.includes('cca') || nameLower.includes('cca');
      }
      return true;
    });
  }, [products, currentSubCollection]);

  // Search and Sort
  const filteredAndSorted = useMemo(() => {
    let result = scaleModelProducts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.shortTagline || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
      return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
    });
  }, [scaleModelProducts, searchQuery, sortBy]);

  const handleToggleWishlist = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    toggleWishlist(product.id);
    setWishlistVersion(v => v + 1);
  };

  const getSubCollectionTitle = () => {
    switch (currentSubCollection) {
      case 'hotwheels':
        return {
          title: 'Hot Wheels',
          subtitle: 'Official Mattel 1:64 scale mainlines, premiums, car culture, and collector cases.',
        };
      case 'majorette':
        return {
          title: 'Majorette',
          subtitle: 'European heritage die-cast with opening parts, suspensions, and collector castings.',
        };
      case 'minigt':
        return {
          title: 'Mini GT',
          subtitle: 'Hyper-detailed 1:64 metal collector models with authentic licensed liveries.',
        };
      case 'cca':
        return {
          title: 'CCA',
          subtitle: 'Limited-edition collector racing castings and exclusive display models.',
        };
      default:
        return {
          title: 'Scale Models',
          subtitle: 'Curated 1:64 die-cast vehicles from the world’s most renowned automotive brands.',
        };
    }
  };

  const headerInfo = getSubCollectionTitle();

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 pt-6 pb-20">
      {/* Apple-Style Breadcrumb & Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-xs font-mono text-zinc-500 py-3 mb-6 border-b border-zinc-200/60">
          <button 
            onClick={onNavigateHome}
            className="hover:text-zinc-900 transition-colors cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3 h-3 text-zinc-400" />
          <button 
            onClick={() => onSelectSubCollection('all')}
            className={`transition-colors cursor-pointer ${currentSubCollection === 'all' ? 'text-zinc-900 font-semibold' : 'hover:text-zinc-900'}`}
          >
            Scale Models
          </button>
          {currentSubCollection !== 'all' && (
            <>
              <ChevronRight className="w-3 h-3 text-zinc-400" />
              <span className="text-zinc-900 font-semibold capitalize">{currentSubCollection}</span>
            </>
          )}
        </nav>

        {/* Hero Banner with Clean Apple-Inspired Typography */}
        <div className="text-center max-w-3xl mx-auto my-8 sm:my-12">
          <span className="inline-block text-[11px] font-mono uppercase tracking-widest text-zinc-500 bg-zinc-200/60 px-3 py-1 rounded-full mb-3">
            Primary Collection • 1:64 Scale
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 mb-4 font-sans">
            {headerInfo.title}
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-2xl mx-auto font-sans">
            {headerInfo.subtitle}
          </p>
        </div>

        {/* 4 Sub-Collection Pills (Apple-Style Segmented Selector) */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {SUB_COLLECTIONS.map((sub) => {
            const isActive = currentSubCollection === sub.id;
            const Icon = sub.icon;
            return (
              <button
                key={sub.id}
                onClick={() => onSelectSubCollection(sub.id as any)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-md shadow-zinc-900/10'
                    : 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                <span>{sub.name}</span>
              </button>
            );
          })}
        </div>

        {/* Controls Bar: Count, Quick Search, Sorting */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200/80 mb-8 shadow-xs">
          <div className="text-xs font-mono text-zinc-500">
            Showing <strong className="text-zinc-900">{filteredAndSorted.length}</strong> items in <span className="capitalize font-semibold text-zinc-800">{currentSubCollection === 'all' ? 'All Scale Models' : currentSubCollection}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Filter by casting name or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 text-xs px-3.5 py-2 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:border-zinc-900 w-full sm:w-64"
            />

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-zinc-50 border border-zinc-200 text-xs px-3 py-2 rounded-xl text-zinc-700 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredAndSorted.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredAndSorted.map((product) => {
              const inWishlist = isWishlisted(product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => onQuickView(product)}
                  className="group bg-white rounded-2xl border border-zinc-200/80 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-zinc-900/5 hover:-translate-y-1 cursor-pointer relative"
                >
                  {/* Card Badges */}
                  <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
                    {product.isBestSeller && (
                      <span className="bg-zinc-900 text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                        Vault Pick
                      </span>
                    )}
                    {product.stockCount <= 3 && product.stockCount > 0 && (
                      <span className="bg-red-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                        Only {product.stockCount} Left
                      </span>
                    )}
                  </div>

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => handleToggleWishlist(e, product)}
                    className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-md rounded-full text-zinc-500 hover:text-red-600 transition-colors shadow-xs hover:bg-white cursor-pointer"
                    aria-label="Add to Wishlist"
                  >
                    <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-600 text-red-600' : ''}`} />
                  </button>

                  {/* Clean Image Canvas */}
                  <div className="aspect-square bg-zinc-100/70 p-4 flex items-center justify-center overflow-hidden relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                        {product.collectorSpecs?.scale || '1:64 Scale'} • {product.collectionId === 'majorette' ? 'Majorette' : product.collectionId === 'minigt' ? 'Mini GT' : product.collectionId === 'cca' ? 'CCA' : 'Hot Wheels'}
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-zinc-900 leading-snug line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 mt-2 flex items-center justify-between">
                      <div>
                        <div className="text-base font-black text-zinc-900 font-mono">
                          ₹{product.price.toLocaleString('en-IN')}
                        </div>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="text-[11px] text-zinc-400 line-through font-mono">
                            ₹{product.originalPrice.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product, 1);
                        }}
                        className="bg-zinc-900 hover:bg-red-600 text-white p-2.5 rounded-xl transition-colors flex items-center justify-center cursor-pointer shadow-xs"
                        title="Add to Cart"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-12 text-center max-w-lg mx-auto my-12 shadow-xs">
            <Car className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              {currentSubCollection === 'cca' || currentSubCollection === 'majorette' || currentSubCollection === 'minigt'
                ? `Arriving Soon to ${currentSubCollection.toUpperCase()} Vault`
                : 'No Products Found'}
            </h3>
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
              {currentSubCollection === 'cca' || currentSubCollection === 'majorette' || currentSubCollection === 'minigt'
                ? `Our next verified batch of authentic ${currentSubCollection.toUpperCase()} collector castings is currently undergoing authentication and will be listed shortly.`
                : 'Try adjusting your search query or view all available scale models.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                onSelectSubCollection('hotwheels');
              }}
              className="bg-zinc-900 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl transition-colors cursor-pointer"
            >
              Browse Hot Wheels Vault
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
