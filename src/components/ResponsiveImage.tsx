import React, { useState, useEffect, useRef } from 'react';
import { Car } from 'lucide-react';
import {
  getOptimizedImageUrl,
  buildResponsiveSrcSet,
  DEFAULT_FALLBACK_IMAGE,
} from '../utils/imageOptimizer';

interface ResponsiveImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: '4/3' | '1/1' | '16/9' | '3/4' | 'auto';
  priority?: boolean;
  sizes?: string;
  onClick?: (e: React.MouseEvent) => void;
  fallbackSrc?: string;
  objectFit?: 'cover' | 'contain';
}

/**
 * ResponsiveImage: High-Performance Image Loader
 * 
 * Features:
 * 1. Automatic WebP/AVIF format auto-negotiation via CDN
 * 2. Mobile vs. Desktop responsive srcset downscaling
 * 3. Priority flag for above-the-fold Hero items (fetchpriority="high", loading="eager")
 * 4. Below-the-fold native browser lazy loading (loading="lazy", decoding="async")
 * 5. Robust container layout (w-full h-full flex items-center justify-center) prevents collapse
 * 6. Instant cache hydration check on mount prevents stuck opacity-0
 * 7. Graceful placeholder fallback if URL is missing or fails
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt = 'Redline Garage Hot Wheels Collectible',
  className = 'w-full h-full object-contain',
  containerClassName = '',
  aspectRatio = 'auto',
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  onClick,
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  objectFit = 'contain',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasPrimaryError, setHasPrimaryError] = useState(false);
  const [hasFallbackError, setHasFallbackError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Clean and sanitize incoming src
  const rawSrc = src && typeof src === 'string' && src.trim().length > 0 ? src.trim() : null;
  const targetSrc = hasPrimaryError ? fallbackSrc : (rawSrc || fallbackSrc);
  const isCompletelyBroken = hasFallbackError || (!rawSrc && !fallbackSrc);

  const optimizedSrc = getOptimizedImageUrl(targetSrc, {
    width: priority ? 800 : 640,
    quality: priority ? 80 : 75,
    format: 'auto',
    fit: objectFit === 'contain' ? 'contain' : 'cover',
  });

  const srcSet = (!hasPrimaryError && rawSrc) ? buildResponsiveSrcSet(targetSrc) : undefined;

  // Reset error & load state when incoming source prop changes
  useEffect(() => {
    setHasPrimaryError(false);
    setHasFallbackError(false);
    setIsLoaded(false);
  }, [src]);

  // Handle cached images that might have finished loading before React event listener attached
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [optimizedSrc]);

  const aspectClass =
    aspectRatio === '4/3'
      ? 'aspect-4/3'
      : aspectRatio === '1/1'
      ? 'aspect-square'
      : aspectRatio === '16/9'
      ? 'aspect-16/9'
      : aspectRatio === '3/4'
      ? 'aspect-3/4'
      : '';

  const handleImageError = () => {
    if (!hasPrimaryError && rawSrc && rawSrc !== fallbackSrc) {
      // Primary failed, fall back to fallback image
      setHasPrimaryError(true);
      setIsLoaded(false);
    } else {
      // Fallback also failed or no source provided
      setHasFallbackError(true);
      setIsLoaded(true);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative w-full h-full overflow-hidden flex items-center justify-center ${aspectClass} ${containerClassName}`}
    >
      {/* 1. Skeleton Placeholder */}
      {!isLoaded && !isCompletelyBroken && (
        <div className="absolute inset-0 bg-zinc-100/90 animate-pulse flex items-center justify-center pointer-events-none z-0">
          <div className="w-5 h-5 border-2 border-zinc-300 border-t-red-500 rounded-full animate-spin" />
        </div>
      )}

      {/* 2. Branded Graceful Fallback if image genuinely unavailable or broken */}
      {isCompletelyBroken ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-400 p-4 select-none">
          <div className="w-10 h-10 rounded-xl bg-zinc-200/80 flex items-center justify-center mb-1.5 text-zinc-500 shadow-inner">
            <Car className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-700">
            Redline Garage
          </span>
          <span className="text-[9px] font-mono text-zinc-400">
            Official Die-Cast
          </span>
        </div>
      ) : (
        /* 3. Fully Optimized Modern Image */
        <img
          ref={imgRef}
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={handleImageError}
          className={`${className} transition-opacity duration-200 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};

