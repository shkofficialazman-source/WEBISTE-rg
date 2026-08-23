import React, { useState, useEffect } from 'react';
import { CollectorSpotlight } from '../types';
import {
  getCachedCollectorSpotlight,
  fetchCollectorSpotlightFromSupabase,
  DEFAULT_COLLECTOR_SPOTLIGHT,
} from '../collectorSpotlight';
import { Award, Instagram, Flame, Quote, Sparkles, Layers, Trophy } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

export const CollectorSpotlightSection: React.FC = () => {
  const [spotlight, setSpotlight] = useState<CollectorSpotlight>(getCachedCollectorSpotlight);

  useEffect(() => {
    let isMounted = true;
    fetchCollectorSpotlightFromSupabase().then((data) => {
      if (isMounted && data) {
        setSpotlight(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!spotlight || !spotlight.active) {
    return null;
  }

  const cleanInsta = (spotlight.instagramHandle || '').replace(/^@/, '');
  const instaUrl = cleanInsta ? `https://instagram.com/${cleanInsta}` : null;

  return (
    <section id="collector-spotlight" className="py-16 bg-zinc-950 text-white relative overflow-hidden border-t border-zinc-900">
      {/* Subtle Racing Glow Accent */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-500/30 text-red-500 font-mono text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full">
            <Trophy className="w-3.5 h-3.5" />
            <span>Community Hall of Fame</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight font-mono text-white">
            Collector of the Month
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono">
            Celebrating passion, dedication, and the finest die-cast garages across India.
          </p>
        </div>

        {/* Main Spotlight Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 transition-all hover:border-zinc-700">
          
          {/* Left Photo & Badges (lg:col-span-5) */}
          <div className="lg:col-span-5 relative min-h-[320px] lg:min-h-full bg-zinc-950 flex flex-col justify-end overflow-hidden">
            <img
              src={getOptimizedImageUrl(spotlight.photoUrl || DEFAULT_COLLECTOR_SPOTLIGHT.photoUrl, { width: 720, quality: 80 })}
              alt={spotlight.collectorName}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            
            {/* Top Month Tag */}
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-red-600 text-white font-mono text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-lg shadow-md flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>{spotlight.featuredMonth || 'Featured Spotlight'}</span>
              </span>
            </div>

            {/* Bottom Overlay Label */}
            <div className="relative z-10 p-6 space-y-1">
              <div className="text-xs font-mono text-red-400 uppercase tracking-wider font-bold">
                Featured Die-Cast Guardian
              </div>
              <h3 className="text-2xl font-black font-mono text-white tracking-tight">
                {spotlight.collectorName}
              </h3>
              {instaUrl && (
                <a
                  href={instaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white font-mono transition-colors pt-1"
                >
                  <Instagram className="w-3.5 h-3.5 text-red-500" />
                  <span className="underline decoration-red-500 underline-offset-4 font-bold">
                    {spotlight.instagramHandle}
                  </span>
                </a>
              )}
            </div>
          </div>

          {/* Right Content & Story (lg:col-span-7) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            
            {/* Collector Highlights & Stats */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-zinc-400 font-mono text-[10px] uppercase font-bold">
                    <Layers className="w-3.5 h-3.5 text-red-500" />
                    <span>Garage Volume</span>
                  </div>
                  <div className="text-lg font-black font-mono text-white">
                    {spotlight.collectionSize || '500+ Castings'}
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-zinc-400 font-mono text-[10px] uppercase font-bold">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Holy Grail Casting</span>
                  </div>
                  <div className="text-base font-bold font-mono text-zinc-100 truncate">
                    {spotlight.favoriteCasting || 'Nissan Skyline GT-R R34'}
                  </div>
                </div>
              </div>

              {/* Collector Story Quote */}
              <div className="relative bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
                <Quote className="w-8 h-8 text-red-600/30 absolute top-4 right-4 pointer-events-none" />
                <div className="text-xs font-mono uppercase tracking-wider text-red-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>The Collector&apos;s Journey</span>
                </div>
                <p className="text-sm sm:text-base text-zinc-300 font-sans italic leading-relaxed">
                  &ldquo;{spotlight.storyQuote}&rdquo;
                </p>
              </div>
            </div>

            {/* Bottom Call to Action for Collectors */}
            <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
              <div className="text-zinc-400 text-center sm:text-left">
                Want to be featured next month? Tag <strong className="text-white">#RedlineGarageIndia</strong> on your collection display posts.
              </div>
              {instaUrl && (
                <a
                  href={instaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-red-600/20 uppercase shrink-0"
                >
                  Follow on Instagram &rarr;
                </a>
              )}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
