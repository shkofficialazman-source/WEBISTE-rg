import React, { useState, useEffect } from 'react';
import { Category, CategoryId } from '../types';
import { fetchCategoriesFromSupabase, subscribeToCategories } from '../supabase';
import { CATEGORIES as DEFAULT_CATEGORIES } from '../data/categories';
import { ArrowUpRight, Flower2, Frame, Sparkles, Car } from 'lucide-react';
import { ResponsiveImage } from './ResponsiveImage';

interface CategoryGridProps {
  onSelectCategory: (category: CategoryId) => void;
  categories?: Category[];
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onSelectCategory, categories: propCategories }) => {
  const [categories, setCategories] = useState<Category[]>(
    propCategories || DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: c.id as CategoryId, sortOrder: i + 1 }))
  );

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

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flower2': return <Flower2 className="w-5 h-5 text-red-500" />;
      case 'Frame': return <Frame className="w-5 h-5 text-red-500" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />;
      case 'Car': return <Car className="w-5 h-5 text-red-500" />;
      default: return <Car className="w-5 h-5 text-red-500" />;
    }
  };

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group relative bg-white border border-zinc-200 rounded-2xl overflow-hidden cursor-pointer hover:border-red-500 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-sm hover:shadow-lg hover:shadow-red-600/10 active:scale-[0.98] active:border-red-500"
            >
              {/* Image Background */}
              <div className="relative aspect-4/3 overflow-hidden bg-zinc-100">
                <ResponsiveImage 
                  src={cat.image} 
                  alt={cat.name}
                  aspectRatio="4/3"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
                
                {/* Category Badge */}
                {cat.badge && (
                  <div className="absolute top-3 left-3 bg-red-600 text-white font-mono font-bold text-[10px] uppercase px-2.5 py-1 rounded-md tracking-wider shadow-md">
                    {cat.badge}
                  </div>
                )}

                {/* Arrow Icon */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200 shadow-xs flex items-center justify-center text-zinc-800 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 transition-colors">
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>

              {/* Text Info */}
              <div className="p-5 flex-1 flex flex-col justify-between text-left space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(cat.icon)}
                    <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 group-hover:text-red-600 transition-colors">
                      {cat.name}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed font-normal">
                    {cat.tagline}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-mono font-bold text-red-600 group-hover:text-red-700">
                  <span>Explore Collection</span>
                  <span>→</span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
