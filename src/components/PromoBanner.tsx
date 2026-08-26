import React, { useState, useEffect } from 'react';
import { SitePromoBanner } from '../types';
import { getPromoBannerConfig, isBannerDismissed, dismissBanner, subscribeToPromoBanner } from '../promoBanner';
import { Sparkles, Tag, X, ArrowRight, Flame, Gift } from 'lucide-react';

interface PromoBannerProps {
  onApplyCoupon?: (code: string) => void;
  onNavigateToCatalog?: () => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({
  onApplyCoupon,
  onNavigateToCatalog,
}) => {
  const [banner, setBanner] = useState<SitePromoBanner>(getPromoBannerConfig());
  const [dismissed, setDismissed] = useState<boolean>(isBannerDismissed(banner.id));
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeToPromoBanner((fresh) => {
      setBanner(fresh);
      setDismissed(isBannerDismissed(fresh.id));
    });
    return () => unsub();
  }, []);

  if (!banner.enabled || dismissed) {
    return null;
  }

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (banner.couponCode) {
      navigator.clipboard.writeText(banner.couponCode);
      setCopiedCode(true);
      if (onApplyCoupon) {
        onApplyCoupon(banner.couponCode);
      }
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissBanner(banner.id);
    setDismissed(true);
  };

  // Color schemes
  const getBannerThemeClasses = () => {
    switch (banner.theme) {
      case 'dark':
        return 'bg-zinc-950 text-white border-b border-zinc-800';
      case 'amber':
        return 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-sm';
      case 'emerald':
        return 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm';
      case 'red':
      default:
        return 'bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-sm';
    }
  };

  return (
    <div
      className={`relative z-40 px-3 py-2 text-xs font-mono transition-all duration-300 ${getBannerThemeClasses()}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-[11px] bg-black/20 px-2 py-0.5 rounded-md backdrop-blur-xs">
            <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>{banner.badgeText || 'SPECIAL OFFER'}</span>
          </div>

          <p className="font-medium text-[11px] sm:text-xs text-white/95 truncate max-w-xl">
            {banner.message}
          </p>

          {banner.couponCode && (
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 bg-white text-zinc-900 hover:bg-zinc-100 px-2.5 py-0.5 rounded-md font-bold text-[11px] uppercase tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Click to copy coupon code"
            >
              <Tag className="w-3 h-3 text-red-600" />
              <span>Use Code: <strong>{banner.couponCode}</strong></span>
              <span className="text-[10px] text-emerald-700 font-extrabold ml-0.5">
                {copiedCode ? '✓ Copied!' : 'Copy'}
              </span>
            </button>
          )}

          {banner.linkUrl && (
            <a
              href={banner.linkUrl}
              onClick={(e) => {
                if (banner.linkUrl === '#catalog' && onNavigateToCatalog) {
                  e.preventDefault();
                  onNavigateToCatalog();
                }
              }}
              className="inline-flex items-center gap-1 text-[11px] text-white/90 hover:text-white underline font-bold transition cursor-pointer"
            >
              <span>{banner.linkText || 'Shop Collection'}</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          )}
        </div>

        {banner.dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/15 transition cursor-pointer shrink-0 min-h-[28px] min-w-[28px] flex items-center justify-center"
            title="Dismiss Announcement"
            aria-label="Dismiss Announcement"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
