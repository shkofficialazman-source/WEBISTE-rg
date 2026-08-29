import React, { useState, useEffect } from 'react';
import { Category, CategoryId } from '../types';
import { fetchCategoriesFromSupabase, subscribeToCategories } from '../supabase';
import { ArrowUpRight } from 'lucide-react';
import { ResponsiveImage } from './ResponsiveImage';

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

  if (isLoading && categories.length === 0) {
    return (
      <section id="categories" className="py-12 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={`cat-skeleton-${n}`}
                className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 animate-pulse space-y-3"
              >
                <div className="aspect-4/3 bg-zinc-200 rounded-lg"></div>
                <div className="h-4 bg-zinc-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section id="categories" className="py-14 sm:py-20 bg-white text-zinc-900 relative border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-zinc-200">
          <div className="space-y-1 text-left">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-500">
              CURATED SHOWROOM
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold uppercase tracking-tight text-zinc-950">
              Collector Lineups
            </h2>
          </div>
          <p className="text-zinc-500 font-mono text-xs max-w-md text-left md:text-right">
            From single mint mainlines to custom blister editions and shadowbox art.
          </p>
        </div>

        {/* Collections Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group relative bg-white border border-zinc-200 hover:border-zinc-900 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 flex flex-col justify-between hover:shadow-md btn-press"
            >
              {/* Image Frame */}
              <div className="relative aspect-4/3 overflow-hidden bg-zinc-50 border-b border-zinc-100 p-2 flex items-center justify-center">
                <ResponsiveImage 
                  src={cat.image} 
                  alt={cat.name}
                  aspectRatio="auto"
                  objectFit="cover"
                  className="w-full h-full object-cover rounded-lg group-hover:scale-103 transition-transform duration-300"
                />
              </div>

              {/* Card Meta */}
              <div className="p-4 space-y-1 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-zinc-950 uppercase tracking-wide group-hover:text-red-600 transition-colors">
                    {cat.name}
                  </h3>
                  <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
