import React, { useState, useEffect } from 'react';
import { SitePromoBanner } from '../../types';
import { getPromoBannerConfig, savePromoBannerConfig, resetBannerDismissals } from '../../promoBanner';
import { Tag, Sparkles, Eye, Check, AlertCircle, Save, RotateCcw, Flame } from 'lucide-react';
import { PromoBanner } from '../PromoBanner';

export const PromoBannerTab: React.FC = () => {
  const [config, setConfig] = useState<SitePromoBanner>(getPromoBannerConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    savePromoBannerConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDismissals = () => {
    resetBannerDismissals();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans text-left">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 font-mono uppercase tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-red-600" />
            <span>Storefront Promo & Announcement Banner</span>
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Display top-of-page announcement banners with coupon codes, flash sales, and special offers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDismissals}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-mono font-bold rounded-xl transition cursor-pointer"
          title="Make banner visible again to all users who previously closed it"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset User Dismissals</span>
        </button>
      </div>

      {/* Live Preview Card */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-600">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-red-600" /> Live Preview
          </span>
          <span>Status: {config.enabled ? '🟢 Active on Storefront' : '⚪ Disabled'}</span>
        </div>
        <div className="rounded-xl overflow-hidden border border-zinc-200">
          <PromoBanner />
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 font-mono text-xs shadow-xs">
        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Promo banner settings saved & published to storefront!</span>
          </div>
        )}

        {/* Enable Toggle */}
        <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-200">
          <div>
            <span className="font-bold text-zinc-900 text-sm">Enable Storefront Promo Banner</span>
            <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
              When enabled, banner will display at the top of the homepage and catalog.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block uppercase text-[10px] text-zinc-600 font-bold mb-1">
              Badge Text (e.g. FLASH SALE, WEEKEND DROP)
            </label>
            <input
              type="text"
              value={config.badgeText}
              onChange={(e) => setConfig({ ...config, badgeText: e.target.value })}
              className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block uppercase text-[10px] text-zinc-600 font-bold mb-1">
              Coupon Code (e.g. AZMAN10, REDLINE50)
            </label>
            <input
              type="text"
              value={config.couponCode || ''}
              onChange={(e) => setConfig({ ...config, couponCode: e.target.value.toUpperCase() })}
              placeholder="Leave blank if no coupon"
              className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs uppercase text-zinc-900 focus:border-red-600 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block uppercase text-[10px] text-zinc-600 font-bold mb-1">
            Announcement Message
          </label>
          <input
            type="text"
            value={config.message}
            onChange={(e) => setConfig({ ...config, message: e.target.value })}
            className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block uppercase text-[10px] text-zinc-600 font-bold mb-1">
              Theme Color
            </label>
            <select
              value={config.theme}
              onChange={(e) => setConfig({ ...config, theme: e.target.value as any })}
              className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden cursor-pointer"
            >
              <option value="red">Racing Red (Default)</option>
              <option value="dark">Stealth Midnight Dark</option>
              <option value="amber">Turbo Gold / Amber</option>
              <option value="emerald">Emerald Speed Green</option>
            </select>
          </div>

          <div>
            <label className="block uppercase text-[10px] text-zinc-600 font-bold mb-1">
              Link URL (Optional)
            </label>
            <input
              type="text"
              value={config.linkUrl || ''}
              onChange={(e) => setConfig({ ...config, linkUrl: e.target.value })}
              placeholder="#catalog"
              className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900"
            />
          </div>

          <div>
            <label className="block uppercase text-[10px] text-zinc-600 font-bold mb-1">
              Link Text
            </label>
            <input
              type="text"
              value={config.linkText || ''}
              onChange={(e) => setConfig({ ...config, linkText: e.target.value })}
              placeholder="Shop Now"
              className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="dismissible-check"
            checked={config.dismissible}
            onChange={(e) => setConfig({ ...config, dismissible: e.target.checked })}
            className="w-4 h-4 text-red-600 rounded border-zinc-300"
          />
          <label htmlFor="dismissible-check" className="text-zinc-700 cursor-pointer select-none">
            Allow customers to dismiss banner with 'X' button
          </label>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase rounded-xl transition shadow-md shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save & Update Promo Banner</span>
        </button>
      </form>
    </div>
  );
};
