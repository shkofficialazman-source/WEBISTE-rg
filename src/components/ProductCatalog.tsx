import React, { useState, useEffect, useMemo } from 'react';
import { Product, Category, CategoryId, UserProfile } from '../types';
import { ShoppingCart, PhoneCall, Sparkles, Star, Eye, Tag, AlertCircle, Filter, SlidersHorizontal, Check, RotateCcw, Boxes, Heart, Clock, ArrowRight } from 'lucide-react';
import { fetchCategoriesFromSupabase, subscribeToCategories } from '../supabase';
import { getWishlistIds, toggleWishlistItem, subscribeToWishlist } from '../wishlist';
import { getRecentlyViewedIds, trackProductView, subscribeToRecentlyViewed, getRecentlyViewedProducts } from '../recentlyViewed';
import { ResponsiveImage } from './ResponsiveImage';
import { BrandedLoadingScreen } from './BrandedLoadingScreen';

interface ProductCatalogProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  searchQuery: string;
  categories?: Category[];
  userProfile?: UserProfile | null;
  onOpenWishlist?: () => void;
  isLoading?: boolean;
  onRetry?: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  onQuickView,
  searchQuery,
  categories: propCategories,
  userProfile,
  onOpenWishlist,
  isLoading = false,
  onRetry,
}) => {
  const [viewMode, setViewMode] = useState<'gift' | 'collector'>('gift');
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high'>('popular');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>(getWishlistIds());
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(getRecentlyViewedIds());

  // Listen to wishlist updates
  useEffect(() => {
    const unsub = subscribeToWishlist((ids) => setWishlistIds(ids));
    return () => unsub();
  }, []);

  // Listen to recently viewed updates
  useEffect(() => {
    const unsub = subscribeToRecentlyViewed((ids) => setRecentlyViewedIds(ids));
    return () => unsub();
  }, []);

  // Recently viewed product objects (last 5 clicked/viewed)
  const recentlyViewedProducts = useMemo(() => {
    return getRecentlyViewedProducts(products);
  }, [products, recentlyViewedIds]);

  const handleToggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlistItem(productId, userProfile);
  };

  const handleProductCardClick = (product: Product) => {
    trackProductView(product.id);
    onQuickView(product);
  };

  const handleAddToCartWithTrack = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    trackProductView(product.id);
    onAddToCart(product);
  };

  // Dynamic price bounds
  const maxProductPrice = useMemo(() => {
    if (products.length === 0) return 5000;
    return Math.max(...products.map((p) => p.price), 2000);
  }, [products]);

  const [priceRange, setPriceRange] = useState<number>(5000);

  useEffect(() => {
    if (maxProductPrice > 0) {
      setPriceRange(maxProductPrice);
    }
  }, [maxProductPrice]);

  const [categories, setCategories] = useState<Category[]>(propCategories || []);

  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      setCategories(propCategories);
      return;
    }

    let isMounted = true;
    const loadCategories = async () => {
      try {
        const data = await fetchCategoriesFromSupabase();
        if (isMounted && data && data.length > 0) {
          setCategories(data);
        }
      } catch (err) {
        console.warn('Error loading categories in catalog:', err);
      }
    };

    loadCategories();

    const unsub = subscribeToCategories((fresh) => {
      if (isMounted && fresh && fresh.length > 0) {
        setCategories(fresh);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [propCategories]);

  // Series options
  const seriesOptions = [
    { id: 'all', label: 'All Series' },
    { id: 'Mainline', label: 'Mainline' },
    { id: 'Premium', label: 'Premium' },
    { id: 'Treasure Hunt', label: 'Treasure Hunt' },
    { id: 'Vintage', label: 'Vintage' },
    { id: 'Custom', label: 'Custom' },
  ];

  // Combined AND-Logic Filter
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Category Filter
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      // 2. Series Filter
      const seriesString = (p.collectorSpecs?.series || '').toLowerCase();
      let matchesSeries = true;
      if (selectedSeries !== 'all') {
        const targetSeries = selectedSeries.toLowerCase();
        matchesSeries = seriesString.includes(targetSeries) || 
          (p.name && p.name.toLowerCase().includes(targetSeries)) ||
          (p.description && p.description.toLowerCase().includes(targetSeries));
      }

      // 3. Price Filter
      const matchesPrice = p.price <= priceRange;

      // 4. In Stock Only
      const matchesStock = !inStockOnly || (p.stockCount !== undefined ? p.stockCount > 0 : true);

      // 5. Search Query
      const matchesSearch = searchQuery === '' || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.collectorSpecs?.casting && p.collectorSpecs.casting.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSeries && matchesPrice && matchesStock && matchesSearch;
    });
  }, [products, selectedCategory, selectedSeries, priceRange, inStockOnly, searchQuery]);

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return b.reviewsCount - a.reviewsCount; // popular
    });
  }, [filteredProducts, sortBy]);

  const activeFiltersCount = (selectedCategory !== 'all' ? 1 : 0) +
    (selectedSeries !== 'all' ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (priceRange < maxProductPrice ? 1 : 0);

  const handleResetFilters = () => {
    onSelectCategory('all');
    setSelectedSeries('all');
    setInStockOnly(false);
    setPriceRange(maxProductPrice);
  };

  const generateWhatsAppUrl = (product: Product) => {
    const isOutOfStock = product.stockCount !== undefined && product.stockCount <= 0;
    const productUrl = `${window.location.origin}/#catalog`;
    const message = isOutOfStock
      ? encodeURIComponent(
          `Hello Redline Garage! 🚗💨\nI am inquiring about the SOLD OUT item *${product.name}*:\n` +
          `• Price: ₹${product.price}\n` +
          `• Link: ${productUrl}\n\n` +
          `Please let me know if you will restock this or if I can join the waitlist!`
        )
      : encodeURIComponent(
          `Hello Redline Garage! 🚗💨\nI would like to order the *${product.name}*:\n` +
          `• Price: ₹${product.price}\n` +
          `• Qty: 1\n` +
          `• Link: ${productUrl}\n\n` +
          `Please let me know availability and dispatch timeline!`
        );
    return `https://wa.me/8431294886?text=${message}`;
  };

  return (
    <section id="catalog" className="py-16 bg-white text-zinc-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Catalog Title & Mode Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-600 uppercase tracking-widest mb-1">
              <Tag className="w-3.5 h-3.5" /> Full Showroom Inventory ({products.length} Items)
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tight font-sans text-zinc-900">
              Redline <span className="text-red-600">Garage</span> Catalog
            </h2>
            <p className="text-zinc-600 text-xs sm:text-sm font-normal mt-1">
              Filter by series, category, and price range. Select any piece to order via Express Checkout or WhatsApp.
            </p>
          </div>

          {/* Mode Switch & Sort & Wishlist */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            {wishlistIds.length > 0 && onOpenWishlist && (
              <button
                onClick={onOpenWishlist}
                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-xs cursor-pointer min-h-[44px] flex items-center gap-2"
              >
                <Heart className="w-4 h-4 fill-red-600 text-red-600" />
                <span>Wishlist ({wishlistIds.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="bg-zinc-100 border border-zinc-300 p-1 rounded-xl flex items-center text-xs font-mono w-full sm:w-auto justify-center">
              <button
                onClick={() => setViewMode('gift')}
                className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-lg transition-all font-bold cursor-pointer text-center min-h-[44px] sm:min-h-[36px] flex items-center justify-center ${
                  viewMode === 'gift' 
                    ? 'bg-red-600 text-white shadow-xs' 
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                🎁 Gift Mode
              </button>
              <button
                onClick={() => setViewMode('collector')}
                className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-lg transition-all font-bold cursor-pointer text-center min-h-[44px] sm:min-h-[36px] flex items-center justify-center ${
                  viewMode === 'collector' 
                    ? 'bg-red-600 text-white shadow-xs' 
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                🏁 Collector Specs
              </button>
            </div>

            {/* Filter Toggle on Mobile / Desktop */}
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-colors border cursor-pointer min-h-[44px] ${
                activeFiltersCount > 0 || isFilterPanelOpen
                  ? 'bg-red-50 text-red-600 border-red-300'
                  : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-100 border border-zinc-300 text-xs text-zinc-800 font-mono rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-red-600 min-h-[44px] cursor-pointer"
            >
              <option value="popular">Sort: Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Collapsible / Expandable Advanced Filter Panel */}
        <div className={`mb-8 p-5 bg-zinc-50 border border-zinc-200 rounded-2xl transition-all duration-300 shadow-xs ${
          isFilterPanelOpen ? 'block' : 'hidden md:block'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Series Selector Chips */}
            <div className="md:col-span-5 space-y-2">
              <label className="text-xs font-mono font-bold text-zinc-700 uppercase tracking-wider block">
                🏎️ Filter by Series:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {seriesOptions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSeries(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer min-h-[38px] flex items-center ${
                      selectedSeries === s.id
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="md:col-span-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-zinc-700 uppercase">Max Price:</span>
                <span className="font-black text-red-600 font-mono text-sm">₹{priceRange.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={200}
                max={maxProductPrice}
                step={50}
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-red-600 cursor-pointer h-2 bg-zinc-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>₹200</span>
                <span>₹{maxProductPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* In-Stock & Reset Buttons */}
            <div className="md:col-span-3 flex flex-row md:flex-col justify-between md:justify-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono font-bold text-zinc-800 select-none min-h-[44px]">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
                <span>In Stock Only</span>
              </label>

              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-mono text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer min-h-[44px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All ({activeFiltersCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Horizontal Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer shrink-0 min-h-[44px] flex items-center ${
              selectedCategory === 'all'
                ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20'
                : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer shrink-0 min-h-[44px] flex items-center ${
                selectedCategory === cat.id
                  ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20'
                  : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-6">
          <span>Showing {sortedProducts.length} of {products.length} cars</span>
          {activeFiltersCount > 0 && (
            <span className="text-red-600 font-bold">Filtered active</span>
          )}
        </div>

        {/* Products Grid */}
        {isLoading && products.length === 0 ? (
          /* Branded Redline Loading Screen with Rotating Hot Wheels Collector Trivia */
          <BrandedLoadingScreen
            fullScreen={false}
            message="Loading Authentic Die-Cast Collection..."
            submessage="Fetching authentic bouquets, shadowboxes & custom cards from live garage inventory"
            onRetry={onRetry}
          />
        ) : isLoading ? (
          /* Subtle Shimmer Skeleton Grid matching real card layout during refresh/sync */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={`skeleton-${n}`}
                className="bg-white border border-zinc-200 rounded-2xl overflow-hidden p-4 space-y-4 animate-pulse shadow-xs flex flex-col justify-between"
              >
                <div className="aspect-4/3 bg-zinc-100 rounded-xl"></div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-zinc-200 rounded w-1/4"></div>
                    <div className="h-3 bg-zinc-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-5 bg-zinc-200 rounded w-3/4"></div>
                  <div className="h-3 bg-zinc-200 rounded w-1/2"></div>
                  <div className="h-6 bg-zinc-200 rounded w-1/3 pt-1"></div>
                </div>
                <div className="pt-3 border-t border-zinc-100 grid grid-cols-2 gap-2">
                  <div className="h-10 bg-zinc-200 rounded-xl"></div>
                  <div className="h-10 bg-zinc-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-16 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-4">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
            <h3 className="text-lg font-bold text-zinc-900 uppercase font-mono">No matching die-cast pieces found</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              No products match your active filters (Series, Category, Price Range, or Search).
            </p>
            <button
              onClick={handleResetFilters}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl text-xs uppercase font-mono cursor-pointer shadow-md shadow-red-600/20 min-h-[44px] inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear All Filters</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {sortedProducts.map((product) => {
              const isWishlisted = wishlistIds.includes(product.id);
              const isOutOfStock = product.stockCount !== undefined && product.stockCount <= 0;
              const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
              const discountPercent = hasDiscount && product.originalPrice
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  onClick={() => handleProductCardClick(product)}
                  className="group bg-white border border-zinc-200/90 hover:border-red-500/80 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_rgba(220,38,38,0.08),0_4px_12px_rgba(0,0,0,0.04)] hover:-translate-y-1 relative cursor-pointer"
                >
                  {/* Top Header Overlay: Clean Separated Badge Stack & Wishlist Heart */}
                  <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between pointer-events-none gap-2">
                    
                    {/* Non-overlapping Stacked Badge Column */}
                    <div className="flex flex-col items-start gap-1.5 max-w-[70%] pointer-events-auto">
                      {product.isBestSeller && (
                        <span className="bg-red-600 text-white text-[10px] font-black uppercase font-mono px-2.5 py-0.5 rounded-md shadow-xs tracking-wider flex items-center gap-1">
                          <span>🔥</span>
                          <span>Bestseller</span>
                        </span>
                      )}

                      {product.isNewRelease && (
                        <span className="bg-zinc-900 text-amber-400 border border-zinc-700/80 text-[10px] font-black uppercase font-mono px-2.5 py-0.5 rounded-md shadow-xs tracking-wider flex items-center gap-1">
                          <span>✨</span>
                          <span>New Edition</span>
                        </span>
                      )}

                      {isOutOfStock ? (
                        <span className="bg-zinc-900/95 backdrop-blur-xs text-zinc-300 border border-zinc-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-xs">
                          Sold Out
                        </span>
                      ) : product.stockCount !== undefined && product.stockCount < 5 ? (
                        <span className="bg-amber-500 text-zinc-950 font-black text-[10px] font-mono px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1 animate-pulse">
                          <span>⚠️ Only {product.stockCount} left</span>
                        </span>
                      ) : null}
                    </div>

                    {/* Wishlist Heart Toggle Button (Anchored Top-Right, High-Contrast & Accessible) */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleWishlist(product.id, e)}
                      className={`pointer-events-auto p-2.5 rounded-full backdrop-blur-md transition-all shadow-sm border min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer ${
                        isWishlisted
                          ? 'bg-red-600 text-white border-red-500 scale-105 shadow-red-600/20'
                          : 'bg-white/95 hover:bg-white text-zinc-400 hover:text-red-600 border-zinc-200/90 hover:border-red-300'
                      }`}
                      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-white text-white' : 'hover:fill-red-600 text-current'}`} />
                    </button>
                  </div>

                  {/* Top Image Container with Clean Neutral Framing & ResponsiveImage */}
                  <div className="relative aspect-4/3 bg-gradient-to-b from-zinc-50 to-zinc-100/60 p-3 overflow-hidden flex items-center justify-center border-b border-zinc-100">
                    <ResponsiveImage
                      src={product.image || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=75'}
                      alt={product.name}
                      aspectRatio="4/3"
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, (max-width: 1280px) 30vw, 260px"
                      className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-500 ease-out"
                    />

                    {/* Quick View Details Floating Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductCardClick(product);
                      }}
                      className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-md text-zinc-800 hover:bg-zinc-900 hover:text-white px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-900 text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer z-10"
                      title="Quick View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Details</span>
                    </button>
                  </div>

                  {/* Product Details Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5 text-left">
                    <div className="space-y-2">
                      
                      {/* Scale / Category & Rating Row */}
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider truncate">
                          {product.collectorSpecs?.scale || '1:64 Scale'} • {product.category || 'Die-Cast'}
                        </span>

                        <div className="flex items-center gap-1 shrink-0 font-mono">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span className="font-bold text-zinc-900 text-xs">{product.rating}</span>
                          <span className="text-zinc-500 text-[10px]">({product.reviewsCount})</span>
                        </div>
                      </div>

                      {/* Product Title */}
                      <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-zinc-900 group-hover:text-red-600 transition-colors line-clamp-2 min-h-[2.5rem] leading-snug font-sans">
                        {product.name}
                      </h3>

                      {/* Dynamic View Mode: Gift Mode vs Collector Specs Mode */}
                      {viewMode === 'gift' ? (
                        <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed font-normal min-h-[2rem]">
                          {product.shortTagline || product.description}
                        </p>
                      ) : (
                        <div className="bg-zinc-50 rounded-xl p-2.5 text-[11px] font-mono space-y-1 text-zinc-700 border border-zinc-200/80 min-h-[2rem]">
                          <div className="text-red-600 font-bold truncate">
                            🏎️ {product.collectorSpecs?.casting || product.name}
                          </div>
                          <div className="text-zinc-600 flex justify-between text-[10px]">
                            <span>Series: {product.collectorSpecs?.series || 'Showroom'}</span>
                            <span>{product.collectorSpecs?.wheels || 'Real Riders'}</span>
                          </div>
                        </div>
                      )}

                      {/* Clear Price Display with Prominent Current Price & Discount Tag */}
                      <div className="pt-1 flex items-baseline flex-wrap gap-2">
                        <span className="text-xl sm:text-2xl font-black text-zinc-900 font-mono tracking-tight">
                          ₹{product.price.toFixed(2)}
                        </span>

                        {hasDiscount && (
                          <span className="text-xs sm:text-sm text-zinc-400 line-through font-mono">
                            ₹{product.originalPrice!.toFixed(2)}
                          </span>
                        )}

                        {discountPercent > 0 && (
                          <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-black font-mono px-1.5 py-0.5 rounded-md">
                            {discountPercent}% OFF
                          </span>
                        )}

                        {product.requiresPhotoUpload && (
                          <span className="ml-auto text-[10px] bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-red-600" /> Photo Card
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dual Action Buttons (Visually Balanced: Primary Buy Now + Secondary Concierge WhatsApp) */}
                    <div className="pt-3 grid grid-cols-2 gap-2 border-t border-zinc-100" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleAddToCartWithTrack(product, e)}
                        disabled={isOutOfStock}
                        className={`font-bold py-2.5 px-3 rounded-xl text-xs uppercase font-mono tracking-wider flex items-center justify-center gap-1.5 transition-all min-h-[42px] ${
                          isOutOfStock
                            ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs shadow-red-600/20 active:scale-[0.98] cursor-pointer'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{isOutOfStock ? 'Sold Out' : 'Buy Now'}</span>
                      </button>

                      <a
                        href={generateWhatsAppUrl(product)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-zinc-50 hover:bg-emerald-50 text-zinc-800 hover:text-emerald-800 border border-zinc-200 hover:border-emerald-300 font-bold py-2.5 px-3 rounded-xl text-xs uppercase font-mono tracking-wider flex items-center justify-center gap-1.5 transition-all text-center min-h-[42px] cursor-pointer active:scale-[0.98]"
                        title={isOutOfStock ? "Inquire on WhatsApp (Waitlist)" : "Order on WhatsApp Concierge"}
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isOutOfStock ? 'Waitlist' : 'WhatsApp'}</span>
                      </a>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* RECENTLY VIEWED DIE-CASTS SECTION (Requirement: Last 5 products clicked in current session) */}
        {recentlyViewedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-zinc-200 text-left">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase font-sans tracking-tight text-zinc-900">
                    Recently Viewed
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Last {recentlyViewedProducts.length} die-casts you explored in this session
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {recentlyViewedProducts.map((recent) => {
                const isOutOfStock = recent.stockCount !== undefined && recent.stockCount <= 0;
                return (
                  <div
                    key={recent.id}
                    onClick={() => handleProductCardClick(recent)}
                    className="group bg-white border border-zinc-200/90 hover:border-red-500/80 rounded-xl p-3 flex flex-col justify-between transition-all duration-300 shadow-[0_2px_6px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(220,38,38,0.08)] hover:-translate-y-0.5 cursor-pointer text-left"
                  >
                    <div>
                      <div className="rounded-lg overflow-hidden bg-gradient-to-b from-zinc-50 to-zinc-100 border border-zinc-100 mb-2.5 p-1">
                        <ResponsiveImage
                          src={recent.image}
                          alt={recent.name}
                          aspectRatio="1/1"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="text-[10px] font-mono text-red-600 font-bold uppercase truncate">
                        {recent.category}
                      </div>
                      <h4 className="font-bold text-xs text-zinc-900 font-sans line-clamp-1 leading-snug group-hover:text-red-600 transition-colors">
                        {recent.name}
                      </h4>
                      <div className="mt-1 flex items-baseline gap-1.5 font-mono">
                        <span className="font-bold text-xs text-zinc-900">
                          ₹{recent.price.toFixed(2)}
                        </span>
                        {recent.originalPrice && recent.originalPrice > recent.price && (
                          <span className="text-[10px] text-zinc-400 line-through">
                            ₹{recent.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-zinc-100" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleAddToCartWithTrack(recent, e)}
                        disabled={isOutOfStock}
                        className={`w-full font-mono text-[11px] font-bold uppercase py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all min-h-[36px] ${
                          isOutOfStock
                            ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs cursor-pointer'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{isOutOfStock ? 'Sold Out' : 'Buy Now'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

