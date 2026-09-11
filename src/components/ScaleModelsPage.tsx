import React, { useState, useMemo } from 'react';
import { Product, UserProfile } from '../types';
import { ShoppingBag, Eye, Heart, Flame, Shield, Car, ChevronRight, SlidersHorizontal, ArrowUpDown, Filter, X, RotateCcw } from 'lucide-react';
import { isWishlisted, toggleWishlist } from '../wishlist';

interface ScaleModelsPageProps {
  products: number extends never ? never : Product[];
  currentSubCollection: 'all' | 'hotwheels' | 'majorette' | 'minigt' | 'cca';
  onSelectSubCollection: (subCol: 'all' | 'hotwheels' | 'majorette' | 'minigt' | 'cca') => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onQuickView: (product: Product) => void;
  userProfile?: UserProfile | null;
  onNavigateHome: () => void;
  initialSearchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
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
  initialSearchQuery = '',
  onSearchQueryChange,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedBrand, setSelectedBrand] = useState<'all' | 'minigt' | 'majorette' | 'hotwheels' | 'cca'>('all');
  const [priceRange, setPriceRange] = useState<'all' | 'under500' | '500to1500' | 'above1500'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [wishlistVersion, setWishlistVersion] = useState(0);

  React.useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (onSearchQueryChange) onSearchQueryChange(val);
  };

  const handleBrandChange = (brand: 'all' | 'minigt' | 'majorette' | 'hotwheels' | 'cca') => {
    setSelectedBrand(brand);
    if (brand !== 'all' && onSelectSubCollection) {
      // Synchronize with parent sub-collection state if needed
      onSelectSubCollection(brand);
    } else if (brand === 'all' && onSelectSubCollection) {
      onSelectSubCollection('all');
    }
  };

  // Sync brand filter with currentSubCollection prop
  React.useEffect(() => {
    if (currentSubCollection && currentSubCollection !== selectedBrand) {
      setSelectedBrand(currentSubCollection);
    }
  }, [currentSubCollection]);

  // Filter scale model products
  const scaleModelProducts = useMemo(() => {
    return products.filter(p => {
      const colId = (p.collectionId || p.category || '').toLowerCase();
      const colIds = (p.collectionIds || []).map(c => c.toLowerCase());
      const nameLower = p.name.toLowerCase();

      // Ensure it belongs to scale-models tier
      const isCustom = ['bouquets', 'frames', 'custom-cards'].includes(colId) || nameLower.includes('bouquet') || nameLower.includes('customized hot wheels card');
      if (isCustom) return false;

      // Filter by brand (Mini GT, Majorette, Hot Wheels, CCA)
      const effectiveBrand = selectedBrand !== 'all' ? selectedBrand : currentSubCollection;

      if (effectiveBrand === 'all') return true;
      if (effectiveBrand === 'minigt') {
        return colId === 'minigt' || colIds.includes('minigt') || nameLower.includes('mini gt') || nameLower.includes('minigt');
      }
      if (effectiveBrand === 'majorette') {
        return colId === 'majorette' || colIds.includes('majorette') || nameLower.includes('majorette');
      }
      if (effectiveBrand === 'hotwheels') {
        return colId === 'hotwheels' || colIds.includes('hotwheels') || (!colId.includes('majorette') && !colId.includes('minigt') && !colId.includes('cca'));
      }
      if (effectiveBrand === 'cca') {
        return colId === 'cca' || colIds.includes('cca') || nameLower.includes('cca');
      }
      return true;
    });
  }, [products, currentSubCollection, selectedBrand]);

  // Search, Price Filtering, and Sorting
  const filteredAndSorted = useMemo(() => {
    let result = scaleModelProducts;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.shortTagline || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    // Price range filter
    if (priceRange !== 'all') {
      result = result.filter(p => {
        if (priceRange === 'under500') return p.price < 500;
        if (priceRange === '500to1500') return p.price >= 500 && p.price <= 1500;
        if (priceRange === 'above1500') return p.price > 1500;
        return true;
      });
    }

    // Price Sorting (Low to High, High to Low) & Other Sorts
    return [...result].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price; // Low to High
      if (sortBy === 'price-desc') return b.price - a.price; // High to Low
      if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
      return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
    });
  }, [scaleModelProducts, searchQuery, priceRange, sortBy]);

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

        {/* Controls Bar: Brand Filters, Price Sorting, Price Range, and Quick Search */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 mb-8 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-600">
              <SlidersHorizontal className="w-4 h-4 text-zinc-900 shrink-0" />
              <span>
                Showing <strong className="text-zinc-900 font-bold">{filteredAndSorted.length}</strong> items in{' '}
                <span className="capitalize font-semibold text-zinc-900">
                  {selectedBrand !== 'all' ? selectedBrand : currentSubCollection === 'all' ? 'All Brands' : currentSubCollection}
                </span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              {/* Quick Search */}
              <div className="relative flex-1 sm:w-60 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Filter casting, model..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 text-xs px-3.5 py-2.5 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:border-zinc-900"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Brand Filter Selector */}
              <div className="relative shrink-0 flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1.5">
                <Filter className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[11px] font-mono text-zinc-500 uppercase font-bold">Brand:</span>
                <select
                  value={selectedBrand}
                  onChange={(e) => handleBrandChange(e.target.value as any)}
                  className="bg-transparent text-xs text-zinc-900 font-semibold focus:outline-hidden cursor-pointer"
                  aria-label="Filter by Brand"
                >
                  <option value="all">All Brands</option>
                  <option value="minigt">Mini GT</option>
                  <option value="majorette">Majorette</option>
                  <option value="hotwheels">Hot Wheels</option>
                  <option value="cca">CCA</option>
                </select>
              </div>

              {/* Price Sort Dropdown */}
              <div className="relative shrink-0 flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[11px] font-mono text-zinc-500 uppercase font-bold">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs text-zinc-900 font-semibold focus:outline-hidden cursor-pointer"
                  aria-label="Sort products"
                >
                  <option value="price-asc">Price: Low to High (₹)</option>
                  <option value="price-desc">Price: High to Low (₹)</option>
                  <option value="featured">Featured First</option>
                  <option value="rating">Top Customer Rated</option>
                </select>
              </div>

              {/* Clear All Filters Button */}
              {(selectedBrand !== 'all' || priceRange !== 'all' || sortBy !== 'featured' || searchQuery) && (
                <button
                  onClick={() => {
                    handleBrandChange('all');
                    setPriceRange('all');
                    setSortBy('featured');
                    handleSearchChange('');
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-mono text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition cursor-pointer shrink-0"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Secondary Quick Filter Pills: Price Tier & Quick Brand Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold mr-1">Brand Shortcuts:</span>
              <button
                onClick={() => handleBrandChange('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  selectedBrand === 'all'
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                All Brands
              </button>
              <button
                onClick={() => handleBrandChange('minigt')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  selectedBrand === 'minigt'
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Mini GT
              </button>
              <button
                onClick={() => handleBrandChange('majorette')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  selectedBrand === 'majorette'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Majorette
              </button>
              <button
                onClick={() => handleBrandChange('hotwheels')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  selectedBrand === 'hotwheels'
                    ? 'bg-amber-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Hot Wheels
              </button>
            </div>

            {/* Quick Price Bracket Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold mr-1">Price Bracket:</span>
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'under500', label: '< ₹500' },
                  { id: '500to1500', label: '₹500 - ₹1.5K' },
                  { id: 'above1500', label: '> ₹1.5K' },
                ] as const
              ).map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setPriceRange(tier.id)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium transition cursor-pointer ${
                    priceRange === tier.id
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredAndSorted.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredAndSorted.map((product) => {
              const inWishlist = isWishlisted(product.id);
              const isOutOfStock = product.stockCount !== undefined && product.stockCount <= 0;
              return (
                <div
                  key={product.id}
                  onClick={() => onQuickView(product)}
                  className="group bg-white rounded-2xl border border-zinc-200/80 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-zinc-900/5 hover:-translate-y-1 cursor-pointer relative"
                >
                  {/* Card Badges */}
                  <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
                    {isOutOfStock ? (
                      <span className="bg-zinc-950 text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-xs">
                        Sold Out
                      </span>
                    ) : (
                      <>
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
                      </>
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
                      className={`w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'opacity-50' : ''}`}
                      loading="lazy"
                    />
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10">
                        <span className="bg-zinc-950 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded uppercase tracking-wider shadow-sm">
                          SOLD OUT
                        </span>
                      </div>
                    )}
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
                          if (!isOutOfStock) onAddToCart(product, 1);
                        }}
                        disabled={isOutOfStock}
                        className={`p-2.5 rounded-xl transition-colors flex items-center justify-center shadow-xs text-xs font-mono font-bold ${
                          isOutOfStock
                            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed px-2.5'
                            : 'bg-zinc-900 hover:bg-red-600 text-white cursor-pointer'
                        }`}
                        title={isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                      >
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider">Sold Out</span>
                        ) : (
                          <ShoppingBag className="w-4 h-4" />
                        )}
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
