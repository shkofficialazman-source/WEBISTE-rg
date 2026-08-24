import React from 'react';
import { RedlineLogo } from './RedlineLogo';
import { BRAND_ASSETS, BRAND_NAME } from '../brandAssets';

interface BrandedLoadingScreenProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
}

export const BrandedLoadingScreen: React.FC<BrandedLoadingScreenProps> = ({
  message = `Initializing ${BRAND_NAME}...`,
  submessage = 'Connecting to Die-Cast Inventory & Pit Lane',
  fullScreen = true,
}) => {
  return (
    <div
      className={`${
        fullScreen ? 'fixed inset-0 z-50 min-h-screen' : 'w-full py-24 min-h-[350px]'
      } bg-zinc-950 flex flex-col items-center justify-center p-6 text-white select-none overflow-hidden`}
    >
      {/* Background Ambient Speed Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Content Box */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full space-y-6">
        
        {/* Animated Redline Garage Logo */}
        <div className="relative flex items-center justify-center">
          {/* Subtle Outer Pulsing Ring */}
          <div className="absolute -inset-4 rounded-3xl bg-red-600/20 animate-ping opacity-30"></div>
          
          <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-2xl shadow-red-600/20 backdrop-blur-md">
            <RedlineLogo variant="full" theme="dark" size="lg" />
          </div>
        </div>

        {/* Dynamic Racing Tachometer / Progress Track */}
        <div className="w-48 sm:w-56 space-y-2">
          {/* Track Bar */}
          <div className="relative h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50">
            {/* Animated Laser Speed Beam */}
            <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-red-500 to-red-600 rounded-full shadow-[0_0_12px_#ef4444] animate-[shimmer_1.5s_infinite_linear] -translate-x-full"></div>
            <div className="h-full bg-red-600 rounded-full w-full animate-pulse opacity-75"></div>
          </div>

          {/* RPM / Speed Markers */}
          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-widest px-0.5">
            <span>READY</span>
            <span className="text-red-500 animate-pulse">BOOST</span>
            <span>GO</span>
          </div>
        </div>

        {/* Loading Copy */}
        <div className="space-y-1">
          <div className="text-sm font-black font-mono uppercase tracking-wider text-zinc-100 flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            <span>{message}</span>
          </div>
          {submessage && (
            <p className="text-xs font-mono text-zinc-400 font-medium">
              {submessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
