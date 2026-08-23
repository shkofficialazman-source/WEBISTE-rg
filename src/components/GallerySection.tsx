import React, { useState } from 'react';
import { GALLERY_ITEMS } from '../data/extraData';
import { Heart, Instagram, Sparkles } from 'lucide-react';
import { ResponsiveImage } from './ResponsiveImage';

export const GallerySection: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string) => {
    setLikedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredItems = filter === 'all' 
    ? GALLERY_ITEMS 
    : GALLERY_ITEMS.filter(item => item.category === filter);

  return (
    <section id="gallery" className="py-20 bg-black text-white relative border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-red-500 uppercase tracking-widest bg-red-950/80 px-3.5 py-1.5 rounded-full border border-red-800/60 mb-2">
              <Instagram className="w-3.5 h-3.5 text-red-500" />
              <span>Social Proof & Customer Showcase</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tight font-sans">
              Real <span className="text-red-600">Bouquets</span> In Hand
            </h2>
            <p className="text-zinc-400 text-sm font-light mt-1">
              Explore past custom Hot Wheels creations delivered to real car lovers around the globe.
            </p>
          </div>

          <a
            href="https://www.instagram.com/redline_.garage/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-900/60 via-red-900/60 to-pink-900/60 hover:from-purple-800 hover:to-pink-800 text-white font-mono font-bold text-xs uppercase px-5 py-3 rounded-xl border border-pink-700/50 transition-all"
            title="Follow on Instagram (@redline_.garage)"
          >
            <Instagram className="w-4 h-4 text-pink-400" />
            <span>Follow @redline_.garage</span>
          </a>
        </div>

        {/* Gallery Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {[
            { id: 'all', label: 'All Customer Shots' },
            { id: 'bouquets', label: 'Bouquet Shots' },
            { id: 'frames', label: 'Shadowbox Frames' },
            { id: 'custom-cards', label: 'Photo Blister Cards' },
            { id: 'scale-models', label: 'Scale Collector Boxes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all border ${
                filter === tab.id
                  ? 'bg-red-600 text-white border-red-500 shadow-md'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Gallery Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isLiked = !!likedIds[item.id];
            const currentLikes = item.likes + (isLiked ? 1 : 0);

            return (
              <div
                key={item.id}
                className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:border-red-600/60 transition-all duration-300"
              >
                <div className="relative aspect-square bg-black overflow-hidden">
                  <ResponsiveImage
                    src={item.image}
                    alt={item.title}
                    aspectRatio="1/1"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity pointer-events-none"></div>

                  {/* Customer Tag Badge */}
                  <div className="absolute top-3 left-3 bg-red-600/90 text-white font-mono font-bold text-[10px] uppercase px-2.5 py-1 rounded-md tracking-wider">
                    {item.customerTag}
                  </div>

                  {/* Like Button */}
                  <button
                    onClick={() => toggleLike(item.id)}
                    className={`absolute top-3 right-3 p-2 rounded-full border backdrop-blur-md transition-all ${
                      isLiked 
                        ? 'bg-red-600 text-white border-red-500 scale-110' 
                        : 'bg-black/60 text-white border-zinc-700 hover:text-red-400'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
                  </button>

                  {/* Caption Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 text-left space-y-1">
                    <h3 className="text-sm font-bold uppercase text-white font-sans line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-300 italic font-light line-clamp-2">
                      {item.description}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span className="flex items-center gap-1 text-red-400 font-bold">
                        <Sparkles className="w-3 h-3 text-red-500" /> Verified Customer Photo
                      </span>
                      <span>❤️ {currentLikes} likes</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
