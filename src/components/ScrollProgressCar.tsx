import React, { useEffect, useState, useRef } from 'react';
import { Car } from 'lucide-react';

export const ScrollProgressCar: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const totalHeightRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    // 1. Compute and cache document scrollable height on mount & window resize (debounced)
    const updateDimensions = () => {
      totalHeightRef.current = Math.max(
        1,
        (document.documentElement.scrollHeight || document.body.scrollHeight || 0) - window.innerHeight
      );
    };

    updateDimensions();

    // 2. Non-blocking passive scroll listener with requestAnimationFrame batching
    const handleScroll = () => {
      if (rafIdRef.current !== null) return;

      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = null;
        const totalHeight = totalHeightRef.current;
        if (totalHeight > 0) {
          const currentY = window.pageYOffset || document.documentElement.scrollTop || 0;
          const currentProgress = (currentY / totalHeight) * 100;
          setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateDimensions, { passive: true });

    // Periodic check for dynamic content expansion (after database load)
    const timeoutId = setTimeout(updateDimensions, 1200);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timeoutId);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-1.5 bg-zinc-200/90 backdrop-blur-xs overflow-hidden w-full max-w-full">
      {/* Redline speed track line */}
      <div 
        className="h-full bg-gradient-to-r from-red-600 via-red-500 to-red-400 transition-all duration-100 ease-out relative"
        style={{ width: `${Math.min(100, Math.max(0, scrollProgress))}%` }}
      >
        {/* Animated Hot Wheels car driving icon at tip */}
        {scrollProgress > 1 && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-red-600 text-white p-0.5 rounded-full shadow-lg shadow-red-600/50">
            <Car className="w-3.5 h-3.5 animate-pulse text-white -scale-x-100" />
          </div>
        )}
      </div>
    </div>
  );
};
