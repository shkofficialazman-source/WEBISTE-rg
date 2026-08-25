import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RedlineLogo } from './RedlineLogo';
import { HOT_WHEELS_COLLECTOR_FACTS, CollectorFact } from '../data/collectorFacts';
import { BRAND_NAME } from '../brandAssets';
import { Sparkles, RefreshCw, Flame, ChevronRight, ChevronLeft } from 'lucide-react';

interface BrandedLoadingScreenProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
  onRetry?: () => void;
  isLoadingSlow?: boolean;
}

export const BrandedLoadingScreen: React.FC<BrandedLoadingScreenProps> = ({
  message = `Loading Authentic Die-Cast Collection...`,
  submessage = 'Connecting to Redline Garage Vault & Live Inventory',
  fullScreen = true,
  onRetry,
}) => {
  const [factIndex, setFactIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSlow, setIsSlow] = useState(false);

  // Timer for elapsed seconds and slow loading detection
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= 10) {
          setIsSlow(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Rotate collector facts smoothly every 3.5 seconds
  useEffect(() => {
    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % HOT_WHEELS_COLLECTOR_FACTS.length);
    }, 3500);

    return () => clearInterval(factInterval);
  }, []);

  const currentFact: CollectorFact = HOT_WHEELS_COLLECTOR_FACTS[factIndex];

  const handleNextFact = () => {
    setFactIndex((prev) => (prev + 1) % HOT_WHEELS_COLLECTOR_FACTS.length);
  };

  const handlePrevFact = () => {
    setFactIndex((prev) => (prev - 1 + HOT_WHEELS_COLLECTOR_FACTS.length) % HOT_WHEELS_COLLECTOR_FACTS.length);
  };

  return (
    <div
      className={`${
        fullScreen
          ? 'fixed inset-0 z-50 min-h-screen bg-zinc-950/95 backdrop-blur-md'
          : 'w-full py-12 md:py-20 min-h-[420px] bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl'
      } flex flex-col items-center justify-center p-4 sm:p-6 text-white select-none overflow-hidden relative`}
      role="status"
      aria-live="polite"
      aria-label="Loading die-cast collection"
    >
      {/* Background Racing Carbon Grid & Subtle Ambient Glow */}
      <div className="absolute inset-0 bg-carbon opacity-60 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-red-600/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-xl w-full space-y-6 sm:space-y-7">
        
        {/* Brand Logo & Wheel Animation Unit */}
        <div className="relative flex flex-col items-center justify-center">
          
          {/* Subtle Outer Pulsing Ring */}
          <div className="absolute -inset-6 rounded-full bg-red-600/15 animate-ping opacity-40"></div>

          {/* Wheel & Logo Composite */}
          <div className="relative flex items-center justify-center">
            
            {/* Authentic Redline 5-Spoke Spinning Wheel Animation */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-zinc-900 border-2 border-zinc-800 shadow-2xl shadow-red-600/30 flex items-center justify-center">
              
              {/* Outer Rubber Tire with Authentic Hot Wheels Redline Stripe */}
              <div className="absolute inset-1 rounded-full border-2 border-zinc-950">
                {/* Redline Sidewall Ring */}
                <div className="absolute inset-1 rounded-full border-[2.5px] border-red-600 shadow-[0_0_8px_#ef4444]"></div>
              </div>

              {/* Spinning 5-Spoke Mag Wheel Hub */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                className="w-14 h-14 sm:w-16 sm:h-16 relative flex items-center justify-center"
              >
                {/* 5-Spoke Lines */}
                {[0, 72, 144, 216, 288].map((deg) => (
                  <div
                    key={deg}
                    style={{ transform: `rotate(${deg}deg)` }}
                    className="absolute w-1 h-7 bg-gradient-to-t from-zinc-300 via-zinc-400 to-zinc-600 rounded-full origin-bottom bottom-1/2 shadow-xs"
                  />
                ))}
                {/* Center Hub Cap */}
                <div className="w-5 h-5 rounded-full bg-zinc-950 border border-red-500 flex items-center justify-center z-10 shadow-md">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                </div>
              </motion.div>
            </div>

          </div>

          {/* Centered Redline Garage Logo */}
          <div className="mt-4 bg-zinc-900/90 border border-zinc-800/80 rounded-xl px-5 py-2.5 shadow-xl backdrop-blur-md">
            <RedlineLogo variant="full" theme="dark" size="md" />
          </div>
        </div>

        {/* Tachometer / Acceleration Status Bar */}
        <div className="w-56 sm:w-64 space-y-2">
          <div className="relative h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            {/* Animated Laser Speed Shimmer */}
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-red-500 to-red-600 rounded-full shadow-[0_0_12px_#ef4444]"
            />
            <div className="h-full bg-red-600/40 rounded-full w-full"></div>
          </div>

          {/* RPM / Engine Stages */}
          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-widest px-1">
            <span className="flex items-center gap-1 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE SYNC
            </span>
            <span className="text-red-500 animate-pulse">PIT LANE</span>
            <span className="text-zinc-400">READY</span>
          </div>
        </div>

        {/* Status Message */}
        <div className="space-y-1">
          <div className="text-sm sm:text-base font-black font-mono uppercase tracking-wider text-zinc-100 flex items-center justify-center gap-2">
            <Flame className="w-4 h-4 text-red-500 fill-red-500 animate-pulse shrink-0" />
            <span>{message}</span>
          </div>
          {submessage && (
            <p className="text-xs font-mono text-zinc-400 font-normal">
              {submessage}
            </p>
          )}
        </div>

        {/* Rotating Hot Wheels "Did You Know?" Trivia Card */}
        <div className="w-full max-w-lg bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden text-left">
          
          {/* Subtle Redline Accent Border at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>

          {/* Header Row with Tag & Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
            <div className="flex items-center gap-2">
              <span className="bg-red-950/80 border border-red-800/60 text-red-400 font-mono font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-red-400 animate-spin" />
                DID YOU KNOW?
              </span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest hidden sm:inline-block">
                {currentFact.tag}
              </span>
            </div>

            {/* Fact Carousel Controls & Counter */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevFact}
                className="w-6 h-6 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition cursor-pointer"
                aria-label="Previous collector fact"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="text-[10px] font-mono font-bold text-zinc-400 px-1">
                <span className="text-red-400">{factIndex + 1}</span>
                <span className="text-zinc-600">/</span>
                <span>{HOT_WHEELS_COLLECTOR_FACTS.length}</span>
              </span>

              <button
                type="button"
                onClick={handleNextFact}
                className="w-6 h-6 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition cursor-pointer"
                aria-label="Next collector fact"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Animated Fact Text with Smooth Fade Transition */}
          <div className="min-h-[90px] sm:min-h-[80px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`fact-${currentFact.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="space-y-1.5 w-full"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-black uppercase text-zinc-100 tracking-tight font-sans">
                    {currentFact.headline}
                  </h4>
                  {currentFact.yearOrStat && (
                    <span className="shrink-0 text-[10px] font-mono font-bold text-red-400 bg-red-950/50 border border-red-900/40 px-2 py-0.5 rounded">
                      {currentFact.yearOrStat}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 font-normal leading-relaxed">
                  {currentFact.fact}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Indicator Dots */}
          <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500">
              Auto-cycling collector trivia every 3.5s
            </span>

            <div className="flex items-center gap-1">
              {HOT_WHEELS_COLLECTOR_FACTS.slice(0, 8).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === factIndex % 8 ? 'w-4 bg-red-500' : 'w-1 bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Slow Loading / Retry Fallback Indicator */}
        {isSlow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-950/70 border border-amber-800/80 rounded-xl p-3 max-w-md w-full text-xs text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg"
          >
            <div className="text-left space-y-0.5">
              <div className="font-bold font-mono uppercase text-[11px] text-amber-300">
                Still loading... almost there!
              </div>
              <div className="text-[10px] text-amber-200/80">
                Live database synchronization in progress ({elapsedSeconds}s).
              </div>
            </div>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-black text-[10px] uppercase px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Now</span>
              </button>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
};
