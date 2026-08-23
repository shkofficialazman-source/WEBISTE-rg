import React, { useState } from 'react';
import {
  getOptimizedImageUrl,
  buildResponsiveSrcSet,
  getBlurPlaceholderUrl,
} from '../utils/imageOptimizer';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: '4/3' | '1/1' | '16/9' | '3/4' | 'auto';
  priority?: boolean;
  sizes?: string;
  onClick?: () => void;
  fallbackSrc?: string;
  objectFit?: 'cover' | 'contain';
}

/**
 * ResponsiveImage: High-Performance Image Loader
 * 
 * Features:
 * 1. Automatic WebP/AVIF format auto-negotiation via CDN
 * 2. Mobile vs. Desktop responsive srcset downscaling (avoids downloading 4000px files)
 * 3. Priority flag for above-the-fold Hero items (fetchpriority="high", loading="eager")
 * 4. Below-the-fold native browser lazy loading (loading="lazy", decoding="async")
 * 5. Lightweight blur-up placeholder & skeleton prevents Cumulative Layout Shift (CLS)
 * 6. Error handling with fallback asset
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = '',
  aspectRatio = '4/3',
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  onClick,
  fallbackSrc = 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=75',
  objectFit = 'cover',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

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

  const rawSrc = hasError ? fallbackSrc : src;
  const optimizedSrc = getOptimizedImageUrl(rawSrc, {
    width: priority ? 800 : 640,
    quality: priority ? 80 : 75,
    format: 'auto',
    fit: objectFit === 'contain' ? 'contain' : 'crop',
  });
  const srcSet = hasError ? undefined : buildResponsiveSrcSet(rawSrc);
  const blurUrl = !hasError && !priority ? getBlurPlaceholderUrl(rawSrc) : undefined;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-zinc-100 ${aspectClass} ${containerClassName}`}
    >
      {/* 1. Low-Resolution Blur-Up Placeholder (instant visual preview without network penalty) */}
      {blurUrl && !isLoaded && (
        <img
          src={blurUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-md scale-110 opacity-70 transition-opacity duration-300 pointer-events-none"
        />
      )}

      {/* 2. Skeleton Shimmer Placeholder (Prevents Cumulative Layout Shift) */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 animate-pulse flex items-center justify-center pointer-events-none">
          <div className="w-5 h-5 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
        </div>
      )}

      {/* 3. Fully Optimized Modern Image */}
      <img
        src={optimizedSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt || 'Redline Garage Hot Wheels Collectible'}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'low'}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!hasError) {
            setHasError(true);
          }
          setIsLoaded(true);
        }}
        className={`${className} transition-all duration-300 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-98'
        }`}
      />
    </div>
  );
};

