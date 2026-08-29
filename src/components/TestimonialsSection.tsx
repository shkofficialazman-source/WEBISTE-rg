import React from 'react';
import { TESTIMONIALS } from '../data/extraData';
import { Star, CheckCircle2 } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-white text-zinc-900 border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 pb-6 border-b border-zinc-200 text-left">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-500">
              COMMUNITY PROOF
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold uppercase tracking-tight text-zinc-950">
              Collector Dispatch Logs
            </h2>
          </div>
          <p className="text-zinc-500 font-mono text-xs max-w-md text-left md:text-right">
            Verified feedback from automotive enthusiasts and die-cast collectors across India.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 text-left space-y-4 flex flex-col justify-between hover:border-zinc-900 transition-colors shadow-2xs btn-press"
            >
              <div className="space-y-3">
                <div className="flex text-amber-400 gap-0.5">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-sans">
                  “{t.comment}”
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-200 space-y-2">
                <div className="text-[11px] font-mono font-bold text-zinc-950 uppercase tracking-wider">
                  Item: {t.productName}
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={getOptimizedImageUrl(t.avatar, { width: 64, height: 64, quality: 75 })}
                    alt={t.name}
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full object-cover border border-zinc-300 bg-zinc-200 shrink-0"
                  />
                  <div>
                    <div className="text-xs font-bold text-zinc-950 flex items-center gap-1 font-sans">
                      {t.name}
                      {t.verified && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {t.role}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
