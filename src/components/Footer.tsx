import React from 'react';
import {
  PhoneCall,
  MapPin,
  RefreshCw,
  MessageCircle,
  ShieldCheck,
  Package,
  Lock,
  Instagram
} from 'lucide-react';
import { RedlineLogo } from './RedlineLogo';
import { BRAND_NAME, BRAND_TAGLINE, BRAND_WHATSAPP_GROUP_URL } from '../brandAssets';

interface FooterProps {
  onNavigate: (route: string) => void;
  onSelectCategory: (category: string) => void;
  onOpenAdmin?: () => void;
  onOpenMyOrders?: () => void;
  isDataSyncing?: boolean;
  onForceSync?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onNavigate, 
  onSelectCategory, 
  onOpenAdmin, 
  onOpenMyOrders,
  isDataSyncing = false,
  onForceSync
}) => {
  return (
    <footer className="bg-zinc-950 text-white border-t border-zinc-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 text-left">
          
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <RedlineLogo variant="full" theme="dark" />
            <p className="text-xs text-zinc-400 font-sans leading-relaxed max-w-sm">
              India's premier collector-grade 1:64 die-cast archive and bespoke automotive gifting studio. Hot Wheels, Majorette, Mini GT, CCA, custom photo blister cards, and framed displays.
            </p>
            <div className="flex items-center gap-3 pt-2 text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Genuine
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" /> Mangalore Studio
              </span>
            </div>
          </div>

          {/* Scale Models Directory */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-white tracking-widest">
              Scale Models
            </h4>
            <ul className="space-y-2 text-xs font-mono text-zinc-400">
              <li>
                <button onClick={() => onNavigate('hotwheels')} className="hover:text-white transition-colors cursor-pointer">
                  Hot Wheels
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('majorette')} className="hover:text-white transition-colors cursor-pointer">
                  Majorette
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('minigt')} className="hover:text-white transition-colors cursor-pointer">
                  Mini GT
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('cca')} className="hover:text-white transition-colors cursor-pointer">
                  CCA
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('scalemodels')} className="hover:text-red-500 text-zinc-300 font-bold transition-colors cursor-pointer">
                  All Scale Models →
                </button>
              </li>
            </ul>
          </div>

          {/* Custom Creation Directory */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-white tracking-widest">
              Custom Studio
            </h4>
            <ul className="space-y-2 text-xs font-mono text-zinc-400">
              <li>
                <button onClick={() => onSelectCategory('frames')} className="hover:text-white transition-colors cursor-pointer">
                  Frames
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('bouquets')} className="hover:text-white transition-colors cursor-pointer">
                  Bouquets
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('custom-cards')} className="hover:text-white transition-colors cursor-pointer">
                  Custom Cards
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('customcreation')} className="hover:text-red-500 text-zinc-300 font-bold transition-colors cursor-pointer">
                  All Creations →
                </button>
              </li>
            </ul>
          </div>

          {/* Direct Concierge Contact Links */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-white tracking-widest">
              Collector VIP &amp; Support
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <a
                href={BRAND_WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 px-3 py-2.5 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  <span>Join VIP WhatsApp Garage</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">JOIN</span>
              </a>

              <a
                href="https://wa.me/8431294886"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors py-1"
              >
                <PhoneCall className="w-4 h-4 text-zinc-500" />
                <span>Concierge Desk (+91 8431294886)</span>
              </a>

              <a
                href="https://www.instagram.com/redline_.garage/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-zinc-400 hover:text-pink-400 transition-colors py-1"
              >
                <Instagram className="w-4 h-4 text-zinc-500" />
                <span>@redline_.garage</span>
              </a>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => onNavigate('valuescanner')}
                  className="text-[11px] text-sky-400 hover:text-sky-300 font-mono flex items-center gap-1 cursor-pointer font-bold"
                >
                  <span>⚡ AI Value Scanner</span>
                </button>
                <span className="text-zinc-600">•</span>
                <button
                  onClick={() => onNavigate('track-order')}
                  className="text-[11px] text-zinc-300 hover:text-red-400 font-mono cursor-pointer flex items-center gap-1 font-bold"
                >
                  <span>📦 Track Your Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-zinc-400">
          <div>
            © {new Date().getFullYear()} Redline Garage India. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            {onForceSync && (
              <button
                onClick={onForceSync}
                className="flex items-center gap-1 hover:text-zinc-300 transition-colors cursor-pointer"
                title="Refresh live catalog"
              >
                <RefreshCw className={`w-3 h-3 ${isDataSyncing ? 'animate-spin text-red-500' : ''}`} />
                <span>Sync Vault</span>
              </button>
            )}

            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1 text-zinc-400 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
