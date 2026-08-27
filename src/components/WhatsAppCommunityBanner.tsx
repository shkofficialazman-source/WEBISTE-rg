import React, { useState } from 'react';
import { MessageCircle, Sparkles, Flame, Check, Copy, ArrowRight, ShieldCheck, Users, BellRing, Gift } from 'lucide-react';
import { BRAND_WHATSAPP_GROUP_URL } from '../brandAssets';

interface WhatsAppCommunityBannerProps {
  className?: string;
}

export const WhatsAppCommunityBanner: React.FC<WhatsAppCommunityBannerProps> = ({ className = '' }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const groupUrl = BRAND_WHATSAPP_GROUP_URL || 'https://chat.whatsapp.com/Jty9dKXDFVb7rTfEbcj1wW';

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(groupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      id="whatsapp-community"
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950 text-white p-6 sm:p-8 lg:p-10 border-2 border-emerald-500/40 shadow-[0_12px_36px_rgba(16,185,129,0.15)] ${className}`}
    >
      {/* Background glow & accents */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-red-600/15 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        {/* Left Info Column */}
        <div className="space-y-4 max-w-2xl text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <MessageCircle className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
              <span>Official Hot Wheels WhatsApp Group</span>
            </span>

            <span className="inline-flex items-center gap-1 bg-amber-400/15 border border-amber-400/30 text-amber-300 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold">
              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>1,200+ Indian Collectors</span>
            </span>
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase italic font-sans tracking-tight text-white leading-tight">
              Join Our VIP <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200">Collector WhatsApp Group</span>
            </h3>
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mt-2 font-normal">
              Be the first to grab limited Hot Wheels mainline cases, Real Riders premiums, rare chase castings, exclusive group discount codes, and live member trades!
            </p>
          </div>

          {/* Quick Perks Pill Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs font-mono text-zinc-300">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xs border border-zinc-800/80 px-3 py-2 rounded-xl">
              <BellRing className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Instant Drop & Restock Alerts</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xs border border-zinc-800/80 px-3 py-2 rounded-xl">
              <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Exclusive Member-Only Promos</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xs border border-zinc-800/80 px-3 py-2 rounded-xl">
              <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Buy, Sell & Trade Die-Casts</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xs border border-zinc-800/80 px-3 py-2 rounded-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Authenticity & Rarity Checks</span>
            </div>
          </div>
        </div>

        {/* Right Action Column */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
          <a
            href={groupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-zinc-950 font-black px-7 py-4 rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/45 transition-all transform active:scale-95 group cursor-pointer min-h-[50px]"
          >
            <MessageCircle className="w-5 h-5 fill-zinc-950 text-zinc-950 group-hover:scale-110 transition-transform" />
            <span>Join WhatsApp Group</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 px-5 py-3.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer min-h-[46px]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Invite Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-400" />
                <span>Copy Group Invite Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
