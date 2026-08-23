import React from 'react';

export interface RedlineLogoProps {
  /**
   * Layout format:
   * - 'full': Supercar silhouette on right + REDLINE GARAGE typography on left
   * - 'badge': Compact square/shield icon with speed styling (RG monogram)
   * - 'stacked': Supercar silhouette above REDLINE GARAGE
   * - 'text-only': Dynamic REDLINE GARAGE typography with speed accents
   * - 'icon-only': Dynamic Supercar silhouette emblem only
   */
  variant?: 'full' | 'badge' | 'stacked' | 'text-only' | 'icon-only';
  /**
   * Theme mode:
   * - 'dark': For dark backgrounds (white text + red accent)
   * - 'light': For light backgrounds (black/zinc-900 text + red accent)
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
}

export const RedlineLogo: React.FC<RedlineLogoProps> = ({
  variant = 'full',
  theme = 'light',
  className = '',
  size = 'md',
  onClick,
}) => {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const subtextColor = isDark ? '#a1a1aa' : '#52525b';
  const carLineColor = isDark ? '#ffffff' : '#18181b';
  const accentRed = '#dc2626';

  // Sizing styles
  const sizeClasses = {
    sm: 'h-7 sm:h-8',
    md: 'h-9 sm:h-11',
    lg: 'h-12 sm:h-14',
    xl: 'h-16 sm:h-20',
    custom: '',
  }[size];

  if (variant === 'badge') {
    return (
      <div
        onClick={onClick}
        className={`relative inline-flex items-center justify-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <svg
          viewBox="0 0 100 100"
          className={sizeClasses || 'w-10 h-10'}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Badge Background with Racing Angled Corners */}
          <rect width="100" height="100" rx="22" fill={accentRed} />
          
          {/* Speed Mesh Texture */}
          <g opacity="0.15" stroke="#ffffff" strokeWidth="4" strokeLinecap="round">
            <line x1="-10" y1="30" x2="40" y2="-10" />
            <line x1="10" y1="70" x2="80" y2="0" />
            <line x1="40" y1="110" x2="110" y2="40" />
          </g>

          {/* Dynamic Car Silhouette Accent */}
          <path
            d="M 18 64 L 38 64 C 42 64 45 61 48 57 L 55 46 C 58 42 63 40 68 40 L 82 40 C 85 40 88 43 86 46 L 80 54 C 78 57 74 60 70 60 L 82 60"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.35"
          />

          {/* RG Monogram */}
          <text
            x="50"
            y="66"
            fontFamily="'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="900"
            fontStyle="italic"
            fontSize="52"
            letterSpacing="-2.5"
            textAnchor="middle"
            fill="#ffffff"
          >
            RG
          </text>

          {/* Speed Dash */}
          <rect x="8" y="47" width="7" height="3" rx="1.5" fill="#ffffff" opacity="0.9" />
          <rect x="5" y="53" width="10" height="3" rx="1.5" fill="#ffffff" opacity="0.9" />

          {/* Racing dot */}
          <circle cx="86" cy="86" r="3.5" fill="#09090b" />
        </svg>
      </div>
    );
  }

  if (variant === 'icon-only') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <svg
          viewBox="0 0 160 80"
          className={sizeClasses || 'h-9 w-auto'}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Dynamic Supercar Profile & Front Silhouette */}
          {/* Lower Splitter & Chassis Ground Line */}
          <path d="M 8 68 L 152 68" stroke={accentRed} strokeWidth="3.5" strokeLinecap="round" />
          <line x1="2" y1="73" x2="35" y2="73" stroke={accentRed} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          
          {/* Aerodynamic Body Lines */}
          <path
            d="M 12 60 Q 25 58 42 54 L 75 32 Q 92 18 114 18 L 128 20 Q 142 22 152 35 L 156 50 Q 158 58 152 62 L 140 64"
            stroke={carLineColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Windshield & Side Window Glass */}
          <path
            d="M 76 34 L 112 24 Q 120 24 128 32 L 136 46 L 78 46 Z"
            fill={accentRed}
            fillOpacity="0.15"
            stroke={carLineColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Sleek Twin Aggressive Headlights */}
          <path d="M 144 48 L 156 52 L 148 56 Z" fill={accentRed} />
          
          {/* Hood Aero Scoop / Character Crease */}
          <path d="M 48 54 Q 78 48 116 46" stroke={carLineColor} strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Rear Wing / Spoiler Contour */}
          <path d="M 10 52 L 20 46 L 36 48" stroke={carLineColor} strokeWidth="3" strokeLinecap="round" />

          {/* Speed Lines trailing */}
          <line x1="4" y1="36" x2="28" y2="36" stroke={accentRed} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1="16" y1="28" x2="44" y2="28" stroke={subtextColor} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </svg>
      </div>
    );
  }

  // Full Horizontal Vector Logo (Brand Text + Silhouette + Speed Accents)
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 sm:gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Dynamic Car Vector Graphic */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          viewBox="0 0 160 85"
          className="h-7 sm:h-9 w-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Speed Streaks behind car */}
          <path d="M 2 46 L 34 46" stroke={accentRed} strokeWidth="3" strokeLinecap="round" opacity="0.9" />
          <path d="M 12 36 L 50 36" stroke={subtextColor} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <path d="M 6 56 L 40 56" stroke={accentRed} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <path d="M 0 68 L 156 68" stroke={accentRed} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 15 74 L 60 74" stroke={accentRed} strokeWidth="2" strokeLinecap="round" opacity="0.6" />

          {/* Supercar Aero Roofline & Hood */}
          <path
            d="M 22 62 Q 35 58 52 52 L 82 30 Q 98 16 120 16 L 132 18 Q 146 22 154 36 L 158 50 Q 159 58 152 62 L 140 64"
            stroke={carLineColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Glass Cabin */}
          <path
            d="M 83 32 L 118 22 Q 124 22 131 28 L 139 42 L 85 42 Z"
            fill={accentRed}
            fillOpacity="0.2"
            stroke={carLineColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Aggressive Headlamp */}
          <polygon points="146,44 158,49 150,53" fill={accentRed} />

          {/* Front Bumper Aero & Diffuser Line */}
          <path d="M 126 62 L 148 62 L 156 56" stroke={carLineColor} strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Rear Spoiler */}
          <path d="M 18 52 L 28 44 L 44 46" stroke={carLineColor} strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>

      {/* Typography Block */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center">
          <span
            className="font-black italic uppercase tracking-tighter font-mono"
            style={{
              color: accentRed,
              fontSize: '1.25rem',
              letterSpacing: '-0.03em',
            }}
          >
            REDLINE
          </span>
          <span
            className="font-extrabold uppercase italic tracking-tight font-mono ml-1"
            style={{
              color: textColor,
              fontSize: '1.25rem',
            }}
          >
            GARAGE
          </span>
        </div>
        <div
          className="font-mono uppercase font-bold tracking-widest mt-0.5"
          style={{
            color: subtextColor,
            fontSize: '0.55rem',
            letterSpacing: '0.22em',
          }}
        >
          DIE-CAST & GIFTS
        </div>
      </div>
    </div>
  );
};
