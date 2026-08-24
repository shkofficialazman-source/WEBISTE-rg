import React from 'react';
import { BRAND_ASSETS, BRAND_LOGO_PATH, BRAND_FAVICON_PATH, BRAND_NAME } from '../brandAssets';

export interface RedlineLogoProps {
  /**
   * Layout format:
   * - 'full': Canonical Redline Garage SVG logo with supercar silhouette & typography
   * - 'badge': Compact square/shield brand badge
   */
  variant?: 'full' | 'badge' | 'stacked' | 'text-only' | 'icon-only';
  /**
   * Theme mode:
   * - 'dark': For dark backgrounds (inverts charcoal lines to crisp white)
   * - 'light': For light backgrounds (crisp charcoal typography & lines)
   */
  theme?: 'dark' | 'light';
  /**
   * Custom CSS class names
   */
  className?: string;
  /**
   * Height/size preset
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  /**
   * Optional click handler
   */
  onClick?: () => void;
  /**
   * Optional alt text
   */
  alt?: string;
}

export const RedlineLogo: React.FC<RedlineLogoProps> = ({
  variant = 'full',
  theme = 'light',
  className = '',
  size = 'md',
  onClick,
  alt = BRAND_NAME,
}) => {
  const isDark = theme === 'dark';

  // Sizing styles
  const sizeClasses = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-11 sm:h-12',
    xl: 'h-14 sm:h-16',
    custom: '',
  }[size];

  if (variant === 'badge') {
    const badgeSizeClasses = {
      sm: 'w-7 h-7',
      md: 'w-9 h-9',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
      custom: '',
    }[size];

    return (
      <div
        onClick={onClick}
        className={`relative inline-flex items-center justify-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <img
          src={BRAND_FAVICON_PATH}
          alt={`${alt} Badge`}
          width={BRAND_ASSETS.favicon.width}
          height={BRAND_ASSETS.favicon.height}
          style={{ aspectRatio: BRAND_ASSETS.favicon.aspectRatio }}
          className={`${badgeSizeClasses || 'w-10 h-10'} object-contain drop-shadow-sm`}
          loading="eager"
          decoding="sync"
          fetchPriority="high"
        />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <img
        src={BRAND_LOGO_PATH}
        alt={alt}
        width={BRAND_ASSETS.logo.width}
        height={BRAND_ASSETS.logo.height}
        style={{ aspectRatio: BRAND_ASSETS.logo.aspectRatio }}
        className={`${sizeClasses || 'h-8 sm:h-9'} w-auto object-contain transition-all ${
          isDark ? 'brightness-0 invert' : ''
        }`}
        loading="eager"
        decoding="sync"
        fetchPriority="high"
      />
    </div>
  );
};
