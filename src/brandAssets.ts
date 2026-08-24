/**
 * Centralized Brand Assets Configuration
 * Single canonical source of truth for Redline Garage brand assets, vector logos, and dimensions.
 */

export interface BrandAssetItem {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly aspectRatio: string;
}

export interface BrandAssetsConfig {
  readonly logo: BrandAssetItem;
  readonly favicon: BrandAssetItem;
  readonly brandName: string;
  readonly brandShortName: string;
  readonly tagline: string;
  readonly storeContact: {
    readonly phone: string;
    readonly whatsapp: string;
    readonly whatsappNumber: string;
    readonly instagram: string;
    readonly instagramUrl: string;
    readonly email: string;
    readonly currency: string;
    readonly currencySymbol: string;
  };
}

export const BRAND_ASSETS: BrandAssetsConfig = {
  logo: {
    src: '/assets/logo.svg',
    alt: 'Redline Garage',
    width: 460,
    height: 110,
    aspectRatio: '460 / 110',
  },
  favicon: {
    src: '/favicon.svg',
    alt: 'Redline Garage Emblem',
    width: 512,
    height: 512,
    aspectRatio: '1 / 1',
  },
  brandName: 'Redline Garage',
  brandShortName: 'Redline',
  tagline: 'Premium Hot Wheels Gifts & Wall Art',
  storeContact: {
    phone: '+91 8431294886',
    whatsapp: '+91 8431294886',
    whatsappNumber: '8431294886',
    instagram: '@redline_.garage',
    instagramUrl: 'https://www.instagram.com/redline_.garage/',
    email: 'shkofficialazman@gmail.com',
    currency: 'INR',
    currencySymbol: '₹',
  },
} as const;

// Convenient direct exported constants for direct imports
export const BRAND_LOGO_PATH = BRAND_ASSETS.logo.src;
export const BRAND_FAVICON_PATH = BRAND_ASSETS.favicon.src;
export const BRAND_LOGO_ALT = BRAND_ASSETS.logo.alt;
export const BRAND_NAME = BRAND_ASSETS.brandName;
export const BRAND_TAGLINE = BRAND_ASSETS.tagline;
