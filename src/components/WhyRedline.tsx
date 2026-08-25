import React from 'react';
import { ShieldCheck, Truck, Gift, Trophy, Star, CheckCircle2, Flame } from 'lucide-react';

export const WhyRedline: React.FC = () => {
  const pillars = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-red-500" />,
      title: '100% Authentic Die-Cast',
      description: 'We only source official, licensed Mattel Hot Wheels and premium die-cast models. Every car is pristine and authentic.',
    },
    {
      icon: <Gift className="w-6 h-6 text-red-500" />,
      title: 'Luxury Gift Presentation',
      description: 'Wrapped in matte black & racing red satin paper, tied with silk ribbon, and accompanied by your custom message card.',
    },
    {
      icon: <Truck className="w-6 h-6 text-red-500" />,
      title: 'Fast 24-48H Dispatch',
      description: 'We know birthdays and anniversaries can’t wait! Orders are packed with care and shipped express with full tracking.',
    },
    {
      icon: <Trophy className="w-6 h-6 text-red-500" />,
      title: 'Collector-Grade Mint Quality',
      description: 'Whether mounted in a shadowbox frame or sealed in a blister card, we handle every casting with white-glove care.',
    },
  ];

  return (
    <section id="why-us" className="py-20 bg-white text-zinc-900 relative border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-red-600 uppercase tracking-widest bg-red-50 px-3.5 py-1.5 rounded-full border border-red-200">
            <Flame className="w-3.5 h-3.5 text-red-600" />
            <span>The Redline Difference</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tight font-sans text-zinc-900">
            Why <span className="text-red-600">Redline Garage</span> Is #1 For Gifts
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base font-normal">
            We bridge childhood nostalgic joy with luxury gift craftsmanship. Here’s why car lovers and collectors obsess over our work.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-6 text-left space-y-4 hover:border-red-500/80 transition-all duration-300 hover:-translate-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
            >
              <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-xs">
                {pillar.icon}
              </div>
              <h3 className="text-lg font-black uppercase italic font-sans tracking-tight text-zinc-900">
                {pillar.title}
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-normal">
                {pillar.description}
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-[11px] font-mono text-red-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-red-600" /> Verified Standard
              </div>
            </div>
          ))}
        </div>

        {/* Trust Stats Bar */}
        <div className="mt-16 bg-zinc-50 border border-zinc-200 rounded-2xl p-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center shadow-xs">
          <div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-red-600">2,500+</div>
            <div className="text-xs text-zinc-600 uppercase font-mono mt-1 font-medium">Bouquets & Frames Gifted</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-zinc-900 flex items-center justify-center gap-1">
              4.9/5 <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
            </div>
            <div className="text-xs text-zinc-600 uppercase font-mono mt-1 font-medium">500+ Verified Customer Reviews</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-red-600">100%</div>
            <div className="text-xs text-zinc-600 uppercase font-mono mt-1 font-medium">Authentic Mattel Castings</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-zinc-900">48 Hours</div>
            <div className="text-xs text-zinc-600 uppercase font-mono mt-1 font-medium">Average Express Shipping</div>
          </div>
        </div>

        {/* Local SEO & Authentic Collector Studio Context Block */}
        <div className="mt-10 p-6 sm:p-8 bg-gradient-to-r from-red-50/70 via-zinc-50 to-zinc-50 border border-red-200/80 rounded-2xl text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-600 uppercase tracking-wider">
            <Flame className="w-4 h-4 text-red-600" />
            <span>Handcrafted in Mangalore • Delivered Across All Indian PIN Codes</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-normal">
            <strong>Redline Garage</strong> is India’s premier specialty automotive gifting and die-cast collector studio, based in Hampankatta, Mangalore, Karnataka. We specialize in official Mattel Hot Wheels mainline cars, rare Car Culture premiums, handcrafted bouquets, custom photo blister cards, and museum-grade acrylic shadowbox wall frames. Every piece is carefully inspected, packed with shock-absorbing foam in heavy-duty boxes, and dispatched with live tracking to Bangalore, Mumbai, Delhi NCR, Hyderabad, Chennai, Pune, Kolkata, and over 19,000+ PIN codes across India.
          </p>
        </div>

      </div>
    </section>
  );
};
