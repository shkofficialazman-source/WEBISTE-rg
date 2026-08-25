import React from 'react';
import {
  Instagram,
  PhoneCall,
  Mail,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { RedlineLogo } from './RedlineLogo';
import { BRAND_ASSETS, BRAND_NAME, BRAND_TAGLINE } from '../brandAssets';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
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
    <footer className="bg-zinc-100 text-zinc-900 border-t border-zinc-200 relative">
      {/* Checkered Flag Accent Line */}
      <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-zinc-900"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-left">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <RedlineLogo variant="full" theme="light" />
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-1">
                {BRAND_TAGLINE}
              </div>
            </div>

            <p className="text-xs text-zinc-600 font-normal leading-relaxed max-w-sm">
              Turning authentic Hot Wheels die-cast cars into unforgettable gifts, custom photo blister cards, and wall-mounted shadowbox frames. Built for speed, wrapped with love.
            </p>
          </div>

          {/* Navigation Shortcuts */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-red-600 tracking-wider">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs font-mono text-zinc-600">
              <li>
                <button onClick={() => onNavigate('catalog')} className="hover:text-zinc-900 transition-colors cursor-pointer">
                  Full Catalog
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    if (onOpenMyOrders) onOpenMyOrders();
                  }} 
                  className="text-red-600 hover:text-red-700 font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Track My Order</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('categories')} className="hover:text-zinc-900 transition-colors cursor-pointer">
                  Product Categories
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('why-us')} className="hover:text-zinc-900 transition-colors cursor-pointer">
                  Why Choose Redline
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-zinc-900 transition-colors cursor-pointer">
                  FAQ & Care Guide
                </button>
              </li>
            </ul>
          </div>

          {/* Direct Concierge Contact Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-red-600 tracking-wider">
              Order Channels
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <a
                href="https://wa.me/8431294886"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                <PhoneCall className="w-4 h-4" />
                <span>WhatsApp (+91 8431294886)</span>
              </a>

              <a
                href="https://www.instagram.com/redline_.garage/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors"
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram (@redline_.garage)</span>
              </a>

              <a
                href="mailto:support@redlinegarage.com"
                className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                <Mail className="w-4 h-4 text-red-600" />
                <span>support@redlinegarage.com</span>
              </a>

              <div className="flex items-center gap-2 text-zinc-500 text-[11px] pt-1">
                <MapPin className="w-4 h-4 text-zinc-400" />
                <span>Global Express Shipping</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-zinc-200 flex flex-col md:flex-row items-center justify-between text-xs font-mono text-zinc-500 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div>
              {onOpenAdmin ? (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="text-zinc-500 hover:text-zinc-700 transition-colors cursor-default focus:outline-hidden"
                  aria-label="Copyright"
                >
                  ©
                </button>
              ) : (
                <span>©</span>
              )}{' '}
              {new Date().getFullYear()} Redline Garage. All rights reserved. Hot Wheels is a registered trademark of Mattel, Inc
              {onOpenAdmin ? (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="text-zinc-500 hover:text-zinc-700 transition-colors cursor-default focus:outline-hidden"
                  aria-label="Admin Access"
                >
                  .
                </button>
              ) : (
                <span>.</span>
              )}
            </div>

            {/* Subtle Non-Intrusive Live Supabase Data Syncing Indicator */}
            <div 
              onClick={onForceSync}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider transition-all duration-300 ${
                isDataSyncing
                  ? 'bg-amber-50 text-amber-700 border border-amber-300 shadow-xs scale-102'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/80 cursor-pointer'
              }`}
              title={isDataSyncing ? 'Synchronizing live catalog with Supabase vault...' : 'Live connection active. Click to refresh inventory.'}
            >
              {isDataSyncing ? (
                <>
                  <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
                  <span className="uppercase">Syncing Vault...</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="uppercase">Live Vault Connected</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="hover:text-zinc-800 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-zinc-800 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-zinc-800 cursor-pointer">Return Policy</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
