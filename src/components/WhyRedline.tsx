import React from 'react';
import { ShieldCheck, Truck, Gift, Trophy, Star, CheckCircle2, Package, Sparkles } from 'lucide-react';

export const WhyRedline: React.FC = () => {
  const pillars = [
    {
      icon: <ShieldCheck className="w-5 h-5 text-zinc-900" />,
      title: '100% Genuine Mattel',
      description: 'Zero counterfeits or tampered blisters. Every casting is sourced directly through certified distribution channels.',
    },
    {
      icon: <Package className="w-5 h-5 text-zinc-900" />,
      title: 'Armored Box Packing',
      description: 'Blister cards are secured with custom foam guards inside double-wall crushproof boxes so cards arrive unbent.',
    },
    {
      icon: <Truck className="w-5 h-5 text-zinc-900" />,
      title: '24–48H Nationwide Dispatch',
      description: 'Fast fulfillment directly from our Mangalore studio with full end-to-end tracking to over 19,000 PIN codes across India.',
    },
    {
      icon: <Gift className="w-5 h-5 text-zinc-900" />,
      title: 'Custom Photo Cards & Sets',
      description: 'Personalized blister editions, handcrafted automotive bouquets, and museum-grade acrylic shadowbox frames.',
    },
  ];

  return (
    <section id="why-us" className="py-16 sm:py-24 bg-[#fafafa] text-zinc-900 border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 pb-6 border-b border-zinc-200 text-left">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-500">
              MANIFESTO &amp; STANDARDS
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold uppercase tracking-tight text-zinc-950">
              The Redline Standard
            </h2>
          </div>
          <p className="text-zinc-500 font-mono text-xs max-w-md text-left md:text-right">
            How we protect your collector investments from checkout to unboxing.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="bg-white border border-zinc-200/90 rounded-2xl p-6 text-left space-y-3.5 hover:border-zinc-950 transition-all duration-300 shadow-2xs hover:shadow-lg btn-press"
            >
              <div className="w-11 h-11 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-center">
                {pillar.icon}
              </div>
              <h3 className="text-sm font-display font-bold uppercase tracking-wide text-zinc-950">
                {pillar.title}
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                {pillar.description}
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Standard</span>
              </div>
            </div>
          ))}
        </div>

        {/* Proof Figures Strip */}
        <div className="mt-12 bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center font-mono shadow-2xs">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-zinc-950">2,500+</div>
            <div className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Castings Delivered</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-zinc-950 flex items-center justify-center gap-1">
              4.9/5 <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <div className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Verified Reviews</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-red-600">100%</div>
            <div className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Authentic Mattel</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-zinc-950">24–48H</div>
            <div className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Dispatch Window</div>
          </div>
        </div>

      </div>
    </section>
  );
};
