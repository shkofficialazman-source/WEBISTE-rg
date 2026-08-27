import React from 'react';
import { Flame, ArrowRight, ShieldCheck, Truck, Sparkles, MessageCircle, Users } from 'lucide-react';
import { BRAND_WHATSAPP_GROUP_URL } from '../brandAssets';

interface FinalCTASectionProps {
  onNavigate: (sectionId: string) => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({ onNavigate }) => {
  return (
    <section className="py-20 bg-gradient-to-b from-white via-zinc-50 to-zinc-100 text-zinc-900 relative border-b border-zinc-200 overflow-hidden">
      {/* Background Racing Atmosphere Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"></div>

      {/* Redline Glow Accent Blur */}
      <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-zinc-950 text-white rounded-3xl p-8 sm:p-12 lg:p-16 border border-zinc-800 shadow-2xl relative overflow-hidden">
          
          {/* Carbon Fiber Ambient Effect */}
          <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/20 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="relative max-w-3xl space-y-6 text-left">
            
            {/* Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/40 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
                <Flame className="w-4 h-4 text-red-500 fill-red-500 animate-bounce" />
                <span>Join 5,000+ Collectors Across India</span>
              </div>
              <a
                href={BRAND_WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide hover:bg-emerald-500/30 transition shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                <span>VIP WhatsApp Group</span>
              </a>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase italic tracking-tight font-sans leading-[1.1] text-white">
              Ready to Level Up Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-white">
                Hot Wheels Collection?
              </span>
            </h2>

            {/* Subheading */}
            <p className="text-sm sm:text-base text-zinc-300 font-normal leading-relaxed max-w-2xl">
              Get genuine licensed Mattel die-cast cars, Real Riders premiums, and custom collector displays delivered to your doorstep in mint condition with reinforced bubble armor.
            </p>

            {/* CTAs */}
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center gap-3.5">
              <button
                onClick={() => onNavigate('featured-hotwheels')}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-extrabold px-8 py-4 rounded-xl text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-red-600/30 hover:shadow-red-500/50 active:scale-95 group cursor-pointer min-h-[48px]"
              >
                <span>Explore Hot Wheels Collection</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href={BRAND_WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold px-6 py-4 rounded-xl text-xs sm:text-sm uppercase tracking-wider border border-emerald-400/40 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-600/30 group cursor-pointer min-h-[48px]"
              >
                <MessageCircle className="w-4 h-4 fill-white text-white group-hover:scale-110 transition-transform" />
                <span>Join VIP WhatsApp Group</span>
              </a>
            </div>

            {/* Guarantee points */}
            <div className="pt-6 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Genuine Mattel Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Pan-India 24-48H Express Dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Armored Crease-Free Box</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
