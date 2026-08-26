import { SitePromoBanner } from './types';

const PROMO_BANNER_KEY = 'rg_site_promo_banner_v1';
const PROMO_BANNER_EVENT = 'rg_promo_banner_changed';
const DISMISSED_BANNER_KEY = 'rg_promo_banner_dismissed';

export const DEFAULT_PROMO_BANNER: SitePromoBanner = {
  enabled: true,
  text: '⚡ Free Redline Premium Gift Wrap on all orders above ₹500! Use code at checkout',
  highlightCode: 'REDLINE10',
  linkUrl: '#catalog',
  theme: 'redline',
  updatedAt: new Date().toISOString(),
};

type BannerListener = (banner: SitePromoBanner) => void;
const listeners = new Set<BannerListener>();

export const getStoredPromoBanner = (): SitePromoBanner => {
  try {
    const raw = localStorage.getItem(PROMO_BANNER_KEY);
    if (!raw) return DEFAULT_PROMO_BANNER;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROMO_BANNER, ...parsed };
  } catch {
    return DEFAULT_PROMO_BANNER;
  }
};

export const getPromoBannerConfig = (): SitePromoBanner => {
  return getStoredPromoBanner();
};

export const savePromoBanner = (banner: Partial<SitePromoBanner>): SitePromoBanner => {
  const current = getStoredPromoBanner();
  const updated: SitePromoBanner = {
    ...current,
    ...banner,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(PROMO_BANNER_KEY, JSON.stringify(updated));
    // Clear dismiss cache so users see updated banner
    sessionStorage.removeItem(DISMISSED_BANNER_KEY);
  } catch (err) {
    console.error('Failed to save promo banner:', err);
  }

  listeners.forEach((fn) => fn(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PROMO_BANNER_EVENT, { detail: updated }));
  }

  return updated;
};

export const savePromoBannerConfig = (banner: Partial<SitePromoBanner>): SitePromoBanner => {
  return savePromoBanner(banner);
};

export const isBannerDismissed = (bannerId?: string): boolean => {
  try {
    const key = bannerId ? `${DISMISSED_BANNER_KEY}_${bannerId}` : DISMISSED_BANNER_KEY;
    return sessionStorage.getItem(key) === 'true' || sessionStorage.getItem(DISMISSED_BANNER_KEY) === 'true';
  } catch {
    return false;
  }
};

export const dismissBanner = (bannerId?: string) => {
  try {
    const key = bannerId ? `${DISMISSED_BANNER_KEY}_${bannerId}` : DISMISSED_BANNER_KEY;
    sessionStorage.setItem(key, 'true');
    sessionStorage.setItem(DISMISSED_BANNER_KEY, 'true');
  } catch {}
};

export const resetBannerDismissals = () => {
  try {
    sessionStorage.removeItem(DISMISSED_BANNER_KEY);
  } catch {}
};

export const subscribeToPromoBanner = (callback: BannerListener): (() => void) => {
  listeners.add(callback);
  callback(getStoredPromoBanner());

  const handleCustomEvent = (e: any) => {
    if (e.detail) {
      callback(e.detail);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(PROMO_BANNER_EVENT, handleCustomEvent);
  }

  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener(PROMO_BANNER_EVENT, handleCustomEvent);
    }
  };
};
