import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Product, Category, CategoryId, UserProfile } from '../types';
import { ShoppingCart, PhoneCall, Sparkles, Star, Eye, Tag, AlertCircle, Filter, SlidersHorizontal, Check, RotateCcw, Boxes, Heart, Clock, ArrowRight, Search, X, Loader2, CheckCircle2 } from 'lucide-react';
import { fetchCategoriesFromSupabase, subscribeToCategories } from '../supabase';
import { getWishlistIds, toggleWishlistItem, subscribeToWishlist } from '../wishlist';
import { getRecentlyViewedIds, trackProductView, subscribeToRecentlyViewed, getRecentlyViewedProducts } from '../recentlyViewed';
import { ResponsiveImage } from './ResponsiveImage';

const INITIAL_BATCH_SIZE = 12;
const BATCH_INCREMENT = 12;

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
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high'>('popular');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>(getWishlistIds());
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(getRecentlyViewedIds());

  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = subscribeToWishlist((ids) => setWishlistIds(ids));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeToRecentlyViewed((ids) => setRecentlyViewedIds(ids));
    return () => unsub();
  }, []);

  // Reset pagination whenever filters or category change
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH_SIZE);
    setIsLoadingMore(false);
  }, [selectedCategory, searchQuery, selectedSeries, inStockOnly, sortBy]);

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
        console.warn('Error loading categories:', err);
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

  // Combined Filter for two-tier collection hierarchy
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      let matchesCategory = true;
      if (selectedCategory !== 'all') {
        const cat = selectedCategory.toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        const pColId = (p.collectionId || '').toLowerCase();
        const pColIds = (p.collectionIds || []).map(c => c.toLowerCase());
        const pBrand = ((p.collectorSpecs as any)?.brand || '').toLowerCase();
        const pSeries = (p.series || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();

        if (cat === 'scale-models' || cat === 'scale-model-diecast') {
          // Matches any scale model (Hot Wheels, Mini GT, Majorette, etc.)
          matchesCategory =
            pCat === 'scale-models' ||
            pCat === 'scale-model-diecast' ||
            pCat === 'hotwheels' ||
            pCat === 'minigt' ||
            pCat === 'majorette' ||
            pColId === 'scale-models' ||
            pColId === 'scale-model-diecast' ||
            pColIds.includes('scale-models') ||
            pColIds.includes('scale-model-diecast') ||
            (!['bouquets', 'custom-cards', 'frames', 'custom-creations', 'hot-wheels-customize'].includes(pCat) &&
             !['bouquets', 'custom-cards', 'frames', 'custom-creations', 'hot-wheels-customize'].includes(pColId));
        } else if (cat === 'hotwheels') {
          matchesCategory =
            pCat === 'hotwheels' ||
            pCat === 'scale-model-diecast' ||
            pColId === 'hotwheels' ||
            pColIds.includes('hotwheels') ||
            pBrand.includes('hot wheels') ||
            pSeries.includes('hot wheels') ||
            (!['minigt', 'majorette', 'bouquets', 'custom-cards', 'frames'].includes(pCat) &&
             !['minigt', 'majorette', 'bouquets', 'custom-cards', 'frames'].includes(pColId));
        } else if (cat === 'minigt') {
          matchesCategory =
            pCat === 'minigt' ||
            pColId === 'minigt' ||
            pColIds.includes('minigt') ||
            pBrand.includes('mini gt') ||
            pSeries.includes('mini gt') ||
            pName.includes('mini gt');
        } else if (cat === 'majorette') {
          matchesCategory =
            pCat === 'majorette' ||
            pColId === 'majorette' ||
            pColIds.includes('majorette') ||
            pBrand.includes('majorette') ||
            pSeries.includes('majorette') ||
            pName.includes('majorette');
        } else if (cat === 'custom-creations' || cat === 'hot-wheels-customize') {
          matchesCategory =
            pCat === 'custom-creations' ||
            pCat === 'hot-wheels-customize' ||
            pCat === 'bouquets' ||
            pCat === 'custom-cards' ||
            pCat === 'frames' ||
            pColId === 'custom-creations' ||
            pColId === 'hot-wheels-customize' ||
            pColIds.includes('custom-creations') ||
            pColIds.includes('hot-wheels-customize');
        } else if (cat === 'bouquets') {
          matchesCategory =
            pCat === 'bouquets' ||
            pColId === 'bouquets' ||
            pColIds.includes('bouquets') ||
            pName.includes('bouquet');
        } else if (cat === 'custom-cards') {
          matchesCategory =
            pCat === 'custom-cards' ||
            pColId === 'custom-cards' ||
            pColIds.includes('custom-cards') ||
            p.id === 'custom-card-personal' ||
            pName.includes('card');
        } else if (cat === 'frames') {
          matchesCategory =
            pCat === 'frames' ||
            pColId === 'frames' ||
            pColIds.includes('frames') ||
            pName.includes('frame');
        } else {
          matchesCategory =
            pCat === cat ||
            pColId === cat ||
            pColIds.includes(cat);
        }
      }

      const matchesSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.series && p.series.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesSeries = true;
      if (selectedSeries !== 'all') {
        matchesSeries = p.series === selectedSeries || (p.tags && p.tags.includes(selectedSeries));
      }

      const matchesPrice = p.price <= priceRange;
      const matchesStock = inStockOnly ? p.stockCount === undefined || p.stockCount > 0 : true;

      return matchesCategory && matchesSearch && matchesSeries && matchesPrice && matchesStock;
    });
  }, [products, selectedCategory, searchQuery, selectedSeries, priceRange, inStockOnly]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return (b.rating || 5) - (a.rating || 5);
    });
  }, [filteredProducts, sortBy]);

  // Paginated items for infinite scrolling
  const visibleProducts = useMemo(() => {
    return sortedProducts.slice(0, visibleCount);
  }, [sortedProducts, visibleCount]);

  const hasMore = visibleCount < sortedProducts.length;

  const loadMoreItems = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + BATCH_INCREMENT, sortedProducts.length));
      setIsLoadingMore(false);
    }, 200);
  }, [isLoadingMore, hasMore, sortedProducts.length]);

  // IntersectionObserver for Mobile & Desktop smooth infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreItems();
        }
      },
      {
        root: null,
        rootMargin: '300px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMoreItems]);

  const generateWhatsAppUrl = (product: Product) => {
    const text = encodeURIComponent(
      `Hello Redline Garage! I am interested in: ${product.name} (₹${product.price}). Is this in stock?`
    );
    return `https://wa.me/8431294886?text=${text}`;
  };

  const handleResetFilters = () => {
    onSelectCategory('all');
    setSelectedSeries('all');
    setPriceRange(maxProductPrice);
    setInStockOnly(false);
  };

  const activeFiltersCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedSeries !== 'all' ? 1 : 0) +
    (priceRange < maxProductPrice ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  return (
    <section id="catalog" className="py-14 sm:py-20 bg-white text-zinc-900 border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-zinc-200 text-left">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-500">
              AUTHENTIC INVENTORY
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold uppercase tracking-tight text-zinc-950">
              The Vault
            </h2>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-zinc-500">
            <span>{sortedProducts.length} Castings Available</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-700 font-semibold">Live Stock</span>
          </div>
        </div>

        {/* Quick Filter Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
          <button
            onClick={() => onSelectCategory('all')}
            className={`btn-press px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            All Castings ({products.length})
          </button>
          <button
            onClick={() => onSelectCategory('scale-models')}
            className={`btn-press px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'scale-models' || selectedCategory === 'scale-model-diecast'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Scale Models
          </button>
          <button
            onClick={() => onSelectCategory('hotwheels')}
            className={`btn-press px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'hotwheels'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Hot Wheels
          </button>
          <button
            onClick={() => onSelectCategory('minigt')}
            className={`btn-press px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'minigt'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Mini GT
          </button>
          <button
            onClick={() => onSelectCategory('majorette')}
            className={`btn-press px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'majorette'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Majorette
          </button>
          <button
            onClick={() => onSelectCategory('custom-creations')}
            className={`btn-press px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'custom-creations' || selectedCategory === 'hot-wheels-customize'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Custom Creations
          </button>
          <button
            onClick={() => onSelectCategory('bouquets')}
            className={`btn-press px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'bouquets'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Bouquets
          </button>
          <button
            onClick={() => onSelectCategory('custom-cards')}
            className={`btn-press px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'custom-cards'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Custom Cards
          </button>
          <button
            onClick={() => onSelectCategory('frames')}
            className={`btn-press px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'frames'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Frames
          </button>
        </div>

        {/* Filter Controls & Sort Bar */}
        <div className="flex items-center justify-between gap-4 py-3 px-4 bg-zinc-50 border border-zinc-200 rounded-xl mb-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all border cursor-pointer ${
                activeFiltersCount > 0
                  ? 'bg-zinc-950 text-white border-zinc-950'
                  : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-mono text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-400 uppercase hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-zinc-300 text-xs font-mono text-zinc-900 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:border-zinc-900 cursor-pointer"
            >
              <option value="popular">Popularity</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {isFilterPanelOpen && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-left">
            <div>
              <label className="block text-xs font-mono font-bold text-zinc-700 uppercase mb-2">Max Price: ₹{priceRange}</label>
              <input
                type="range"
                min="100"
                max={maxProductPrice}
                step="50"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-zinc-700 uppercase mb-2">Availability</label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-800">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-0"
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={`skeleton-${n}`}
                className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden p-4 space-y-4 animate-pulse flex flex-col justify-between"
              >
                <div className="aspect-4/3 bg-zinc-200 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-300 rounded w-3/4"></div>
                  <div className="h-3 bg-zinc-200 rounded w-1/2"></div>
                </div>
                <div className="h-10 bg-zinc-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-16 bg-zinc-50 rounded-xl border border-zinc-200 space-y-4">
            <AlertCircle className="w-10 h-10 text-zinc-400 mx-auto" />
            <h3 className="text-base font-bold text-zinc-900 uppercase font-mono">No castings match your filter</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Try clearing your search query or broadening your price filter.
            </p>
            <button
              onClick={handleResetFilters}
              className="btn-press bg-zinc-950 hover:bg-zinc-800 text-white font-mono text-xs font-bold px-5 py-2.5 rounded-lg uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {visibleProducts.map((product) => {
                const isWishlisted = wishlistIds.includes(product.id);
                const isOutOfStock = product.stockCount !== undefined && product.stockCount <= 0;
                const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);

                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductCardClick(product)}
                    className="group bg-white border border-zinc-200 hover:border-zinc-900 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 relative cursor-pointer hover:shadow-md btn-press"
                  >
                    {/* Top Badges & Wishlist */}
                    <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
                      <div>
                        {isOutOfStock ? (
                          <span className="bg-zinc-900 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                            Sold Out
                          </span>
                        ) : hasDiscount ? (
                          <span className="bg-red-600 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                            Sale
                          </span>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleToggleWishlist(product.id, e)}
                        className={`pointer-events-auto p-1.5 rounded-full backdrop-blur-md transition-all border min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer ${
                          isWishlisted
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white/90 hover:bg-white text-zinc-400 hover:text-red-600 border-zinc-200'
                        }`}
                        title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-white text-white' : 'hover:fill-red-600 text-current'}`} />
                      </button>
                    </div>

                    {/* Image Container */}
                    <div className="relative aspect-4/3 bg-zinc-50 p-2 overflow-hidden flex items-center justify-center border-b border-zinc-100">
                      <ResponsiveImage
                        src={product.image || product.imageUrl}
                        alt={product.name}
                        aspectRatio="auto"
                        objectFit="contain"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                        className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-left">
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                          {product.collectorSpecs?.scale || '1:64 SCALE'} • {product.series || 'DIE-CAST'}
                        </div>
                        <h3 className="text-sm font-bold text-zinc-950 font-sans line-clamp-1 group-hover:text-red-600 transition-colors">
                          {product.name}
                        </h3>
                        <div className="pt-1 flex items-baseline gap-2">
                          <span className="text-lg font-mono font-black text-zinc-950">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs font-mono text-zinc-400 line-through">
                              ₹{product.originalPrice!.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 grid grid-cols-2 gap-2 border-t border-zinc-100" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleAddToCartWithTrack(product, e)}
                          disabled={isOutOfStock}
                          className={`font-mono text-xs font-bold uppercase py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all min-h-[40px] ${
                            isOutOfStock
                              ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                              : 'bg-zinc-950 hover:bg-zinc-800 active:bg-black text-white cursor-pointer shadow-2xs'
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{isOutOfStock ? 'Sold' : 'Buy'}</span>
                        </button>

                        <a
                          href={generateWhatsAppUrl(product)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono text-xs font-bold uppercase py-2.5 px-2 rounded-lg flex items-center justify-center gap-1 text-center min-h-[40px] cursor-pointer"
                          title="Chat on WhatsApp"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Chat</span>
                        </a>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Infinite Scroll Bottom Sentinel & Indicators */}
            <div ref={sentinelRef} className="mt-10 flex flex-col items-center justify-center py-4">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-full font-mono text-xs font-semibold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
                  <span>Loading more castings...</span>
                </div>
              ) : hasMore ? (
                <button
                  type="button"
                  onClick={loadMoreItems}
                  className="btn-press px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-full font-mono text-xs font-bold uppercase tracking-wider transition-all border border-zinc-200 cursor-pointer"
                >
                  Load More ({sortedProducts.length - visibleProducts.length} remaining)
                </button>
              ) : sortedProducts.length > 0 ? (
                <div className="flex items-center gap-2 px-5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-full text-zinc-500 font-mono text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>You've reached the end of the vault • {sortedProducts.length} castings displayed</span>
                </div>
              ) : null}
            </div>
          </>
        )}

        {/* Recently Viewed Strip */}
        {recentlyViewedProducts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-zinc-200 text-left">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-4 h-4 text-zinc-500" />
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-900">
                Recently Explored Castings
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {recentlyViewedProducts.map((recent) => (
                <div
                  key={recent.id}
                  onClick={() => handleProductCardClick(recent)}
                  className="bg-white border border-zinc-200 hover:border-zinc-900 rounded-lg p-3 cursor-pointer text-left transition-all btn-press"
                >
                  <div className="aspect-square bg-zinc-50 rounded-md p-1 mb-2 overflow-hidden flex items-center justify-center">
                    <ResponsiveImage
                      src={recent.image || recent.imageUrl}
                      alt={recent.name}
                      aspectRatio="auto"
                      objectFit="contain"
                      sizes="100px"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h4 className="font-bold text-xs text-zinc-900 truncate">{recent.name}</h4>
                  <div className="font-mono text-xs font-bold text-zinc-900">₹{recent.price.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
