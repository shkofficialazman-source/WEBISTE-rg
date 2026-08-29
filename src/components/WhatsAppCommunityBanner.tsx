import React, { useState } from 'react';
import { MessageCircle, Check, Copy, ArrowRight, ShieldCheck, Users, BellRing, Gift } from 'lucide-react';
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
      className={`relative overflow-hidden rounded-2xl bg-zinc-950 text-white p-6 sm:p-8 lg:p-10 border border-zinc-800 shadow-xl ${className}`}
    >
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        
        {/* Info Column */}
        <div className="space-y-3 max-w-2xl text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>VIP Hot Wheels Community</span>
            </span>

            <span className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-md text-[11px] font-mono">
              1,200+ Active Collectors
            </span>
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-display font-extrabold uppercase tracking-tight text-white">
              Private Telegram &amp; WhatsApp Drop Broadcasts
            </h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mt-1 font-sans">
              Instant alerts when new Hot Wheels cases land, exclusive member-only promo codes, trade opportunities, and rare mainline allocations.
            </p>
          </div>

          {/* Perks Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono text-zinc-300">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg">
              <BellRing className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Instant Drop Alerts</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg">
              <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Member Discount Codes</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
          <a
            href={groupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-press w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md min-h-[46px]"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Join Community Group</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            className="btn-press w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition cursor-pointer min-h-[42px]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy Invite Link</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
