import React, { useState, useEffect } from 'react';
import { Category, CategoryId } from '../types';
import { fetchCategoriesFromSupabase, subscribeToCategories } from '../supabase';
import { ArrowUpRight, Flower2, Frame, Sparkles, Car } from 'lucide-react';
import { ResponsiveImage } from './ResponsiveImage';
import { BrandedLoadingScreen } from './BrandedLoadingScreen';

interface CategoryGridProps {
  onSelectCategory: (category: CategoryId) => void;
  categories?: Category[];
  isLoading?: boolean;
  onRetry?: () => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  onSelectCategory,
  categories: propCategories,
  isLoading: propIsLoading,
  onRetry,
}) => {
  const [categories, setCategories] = useState<Category[]>(propCategories || []);
  const [internalLoading, setInternalLoading] = useState<boolean>(!propCategories || propCategories.length === 0);

  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      setCategories(propCategories);
      setInternalLoading(false);
      return;
    }

    let isMounted = true;
    const loadCategories = async () => {
      try {
        setInternalLoading(true);
        const data = await fetchCategoriesFromSupabase();
        if (isMounted) {
          setCategories(data || []);
          setInternalLoading(false);
        }
      } catch (err) {
        console.warn('Error loading categories:', err);
        if (isMounted) {
          setInternalLoading(false);
        }
      }
    };

    loadCategories();

    const unsub = subscribeToCategories((fresh) => {
      if (isMounted && fresh) {
        setCategories(fresh);
        setInternalLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [propCategories]);

  const isLoading = propIsLoading !== undefined ? propIsLoading : internalLoading;

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flower2': return <Flower2 className="w-5 h-5 text-red-500" />;
      case 'Frame': return <Frame className="w-5 h-5 text-red-500" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />;
      case 'Car': return <Car className="w-5 h-5 text-red-500" />;
      default: return <Car className="w-5 h-5 text-red-500" />;
    }
  };

  // If loading and no categories yet, show branded loading screen with trivia
  if (isLoading && categories.length === 0) {
    return (
      <section id="categories" className="py-12 bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BrandedLoadingScreen
            fullScreen={false}
            message="Loading Showroom Collections..."
            submessage="Fetching authentic bouquets, frames & custom cards from live vault"
            onRetry={onRetry}
          />
        </div>
      </section>
    );
  }

  // If loading finished and no collections in DB, don't show fake template cards
  if (categories.length === 0) {
    return null;
  }

  return (
    <section id="categories" className="py-16 bg-zinc-50 text-zinc-900 relative border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full border border-red-200">
            Showroom Collections
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase italic font-sans tracking-tight text-zinc-900">
            Choose Your <span className="text-red-600">Redline</span> Experience
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base font-normal">
            From romantic automotive bouquet arrangements to wall-mounted shadowboxes and custom photo blister cards, discover our signature lineups.
          </p>
        </div>

        {/* Collections Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={`cat-skel-${n}`}
                className="bg-white border border-zinc-200 rounded-2xl overflow-hidden p-4 space-y-4 animate-pulse shadow-xs"
              >
                <div className="aspect-4/3 bg-zinc-100 rounded-xl"></div>
                <div className="space-y-2">
                  <div className="h-5 bg-zinc-200 rounded w-3/4"></div>
                  <div className="h-3 bg-zinc-200 rounded w-full"></div>
                </div>
                <div className="h-4 bg-zinc-200 rounded w-1/3 pt-2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="group relative bg-white border border-zinc-200/90 hover:border-red-500/80 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_rgba(220,38,38,0.08),0_4px_12px_rgba(0,0,0,0.04)] active:scale-[0.98]"
              >
                {/* Image Background Container */}
                <div className="relative aspect-4/3 overflow-hidden bg-zinc-100 border-b border-zinc-100">
                  <ResponsiveImage 
                    src={cat.image} 
                    alt={cat.name}
                    aspectRatio="4/3"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
                  
                  {/* Category Badge */}
                  {cat.badge && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white font-mono font-black text-[10px] uppercase px-2.5 py-1 rounded-md tracking-wider shadow-xs">
                      {cat.badge}
                    </div>
                  )}

                  {/* Top-Right Arrow Action */}
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-md border border-zinc-200/90 shadow-xs flex items-center justify-center text-zinc-700 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 transition-colors">
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>

                {/* Text Info Content */}
                <div className="p-5 flex-1 flex flex-col justify-between text-left space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100">
                        {getCategoryIcon(cat.icon)}
                      </div>
                      <h3 className="text-base font-black uppercase tracking-tight text-zinc-900 group-hover:text-red-600 transition-colors font-sans">
                        {cat.name}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed font-normal">
                      {cat.tagline}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-mono font-bold text-red-600 group-hover:text-red-700">
                    <span>Explore Collection</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
