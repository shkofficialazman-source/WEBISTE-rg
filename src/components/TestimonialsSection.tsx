import React from 'react';
import { TESTIMONIALS } from '../data/extraData';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 bg-zinc-50 text-zinc-900 relative border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-red-600 uppercase tracking-widest bg-red-50 px-3.5 py-1.5 rounded-full border border-red-200">
            <span>Collector Reviews & Verified Feedback</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tight font-sans text-zinc-900">
            Hear From Our <span className="text-red-600">Hot Wheels Collectors</span>
          </h2>
          <p className="text-zinc-600 text-sm font-normal">
            Real feedback from avid die-cast collectors, car enthusiasts, and gift buyers across India.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-zinc-200/90 hover:border-red-500/80 rounded-2xl p-6 text-left space-y-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_rgba(220,38,38,0.08)]"
            >
              <div className="space-y-3">
                {/* Stars & Quote Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400 gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-red-600/20" />
                </div>

                {/* Comment */}
                <p className="text-sm text-zinc-700 leading-relaxed font-normal italic">
                  “{t.comment}”
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-100 space-y-2">
                <div className="text-xs font-mono font-bold text-red-600">
                  Purchased: {t.productName}
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={getOptimizedImageUrl(t.avatar, { width: 80, height: 80, quality: 75 })}
                    alt={t.name}
                    width={40}
                    height={40}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-zinc-200 bg-zinc-100 shrink-0"
                  />
                  <div>
                    <div className="text-sm font-bold text-zinc-900 flex items-center gap-1.5 font-sans">
                      {t.name}
                      {t.verified && (
                        <span title="Verified Order" className="inline-flex">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono">
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
