import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, Flame, Bot, X } from 'lucide-react';
import { PitCrewRole } from '../types';

interface AskAiPitCrewFloatingButtonProps {
  onOpen: (role?: PitCrewRole) => void;
  isOpen: boolean;
}

export const AskAiPitCrewFloatingButton: React.FC<AskAiPitCrewFloatingButtonProps> = ({
  onOpen,
  isOpen,
}) => {
  const [hasUnreadHint, setHasUnreadHint] = useState(true);
  const [hintDismissed, setHintDismissed] = useState(false);

  // Auto-hide the popup speech bubble after 12 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setHintDismissed(true);
    }, 12000);
    return () => clearTimeout(timer);
  }, []);

  if (isOpen) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 flex flex-col items-end gap-2 group select-none">
      {/* Interactive Speech Hint Bubble */}
      {!hintDismissed && (
        <div className="bg-zinc-900 text-white text-xs px-3 py-2 rounded-2xl shadow-xl border border-red-500/40 flex items-center gap-2 max-w-[260px] animate-bounce relative">
          <span className="text-base">🏎️🐾</span>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-red-400 block text-[11px]">Ask AI Pit Crew!</span>
            <span className="text-[11px] text-zinc-300 line-clamp-1">Gift ideas & Hot Wheels rarity advice</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setHintDismissed(true);
            }}
            className="text-zinc-400 hover:text-white p-0.5"
            aria-label="Dismiss hint"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-zinc-900 rotate-45 border-r border-b border-red-500/40" />
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setHintDismissed(true);
          onOpen('turbo');
        }}
        className="flex items-center gap-2 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white pl-3.5 pr-4 py-2.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/80 cursor-pointer"
        aria-label="Open Ask AI Pit Crew Chatbot"
      >
        <div className="relative">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm shadow-inner">
            🏎️
          </div>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
        </div>

        <div className="flex flex-col items-start text-left">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-200 leading-tight flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            AI Pit Crew
          </span>
          <span className="text-xs font-bold leading-tight">
            Ask Turbo & Crew
          </span>
        </div>
      </button>
    </div>
  );
};
