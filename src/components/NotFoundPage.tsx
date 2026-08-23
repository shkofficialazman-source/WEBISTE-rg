import React from 'react';
import { RedlineLogo } from './RedlineLogo';
import { Home, ShoppingBag, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onBackToStore: () => void;
  title?: string;
  description?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onBackToStore,
  title = '404 — Track Off Course',
  description = 'The page or die-cast model you are looking for has moved, sold out, or does not exist in our garage catalog.',
}) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-lg w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md text-center space-y-6">
        {/* Brand Logo */}
        <div className="flex justify-center">
          <RedlineLogo variant="full" theme="dark" size="lg" />
        </div>

        {/* 404 Number Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-500 font-mono text-sm font-black tracking-widest uppercase">
          ERROR 404
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight font-sans text-white">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono leading-relaxed">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={onBackToStore}
            className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase px-6 py-3 rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            <span>Return to Garage</span>
          </button>

          <button
            onClick={() => {
              onBackToStore();
              setTimeout(() => {
                const cat = document.getElementById('catalog');
                if (cat) cat.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs font-bold uppercase px-6 py-3 rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Products</span>
          </button>
        </div>
      </div>
    </div>
  );
};
