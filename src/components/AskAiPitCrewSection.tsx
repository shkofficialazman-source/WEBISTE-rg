import React from 'react';
import { Bot, Sparkles, Flame, MessageSquare, ArrowRight, Trophy, Gift, Wrench } from 'lucide-react';
import { PIT_CREW_MEMBERS, PIT_CREW_QUICK_PROMPTS } from '../data/pitCrewData';
import { PitCrewRole } from '../types';

interface AskAiPitCrewSectionProps {
  onOpenChat: (role?: PitCrewRole) => void;
}

export const AskAiPitCrewSection: React.FC<AskAiPitCrewSectionProps> = ({
  onOpenChat,
}) => {
  return (
    <section id="pit-crew" className="py-12 sm:py-16 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white relative overflow-hidden border-y border-zinc-800">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-mono font-bold tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Powered by Google Gemini 3.5</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-sans text-white">
            Ask the <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-orange-400">AI Pit Crew</span>
          </h2>

          <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
            Need the perfect die-cast gift recommendation, help identifying a rare Super Treasure Hunt, or advice on custom photo cards? Our AI specialist crew is live on the pit wall 24/7.
          </p>
        </div>

        {/* 3 Crew Member Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* Turbo */}
          <div className="bg-zinc-900/80 border border-zinc-800 hover:border-red-500/50 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-red-950/30 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-2xl shadow-md border border-white/20">
                  {PIT_CREW_MEMBERS.turbo.avatar}
                </div>
                <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 font-bold">
                  {PIT_CREW_MEMBERS.turbo.badge}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition">
                {PIT_CREW_MEMBERS.turbo.name}
              </h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                {PIT_CREW_MEMBERS.turbo.title}
              </p>

              <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                {PIT_CREW_MEMBERS.turbo.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenChat('turbo')}
              className="mt-5 w-full bg-zinc-800 hover:bg-red-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group-hover:bg-red-600"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Ask Turbo for Gift Ideas</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Sparky */}
          <div className="bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-amber-950/30 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-yellow-500 flex items-center justify-center text-2xl shadow-md border border-white/20">
                  {PIT_CREW_MEMBERS.sparky.avatar}
                </div>
                <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-600/20 text-amber-400 border border-amber-500/30 font-bold">
                  {PIT_CREW_MEMBERS.sparky.badge}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition">
                {PIT_CREW_MEMBERS.sparky.name}
              </h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                {PIT_CREW_MEMBERS.sparky.title}
              </p>

              <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                {PIT_CREW_MEMBERS.sparky.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenChat('sparky')}
              className="mt-5 w-full bg-zinc-800 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group-hover:bg-amber-600"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Ask Sparky About Rarity & $TH</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Gearbox */}
          <div className="bg-zinc-900/80 border border-zinc-800 hover:border-blue-500/50 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-950/30 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-2xl shadow-md border border-white/20">
                  {PIT_CREW_MEMBERS.gearbox.avatar}
                </div>
                <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold">
                  {PIT_CREW_MEMBERS.gearbox.badge}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition">
                {PIT_CREW_MEMBERS.gearbox.name}
              </h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                {PIT_CREW_MEMBERS.gearbox.title}
              </p>

              <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                {PIT_CREW_MEMBERS.gearbox.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenChat('gearbox')}
              className="mt-5 w-full bg-zinc-800 hover:bg-blue-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group-hover:bg-blue-600"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Ask Gearbox About Custom Cards</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Quick Launch Action Banner */}
        <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Have a specific question in mind?</h4>
              <p className="text-xs text-zinc-400">Ask about delivery pin codes, custom car themes, or collector valuations.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChat('turbo')}
            className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-lg transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Pit Crew Chat</span>
          </button>
        </div>
      </div>
    </section>
  );
};
