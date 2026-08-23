import { Product } from './types';

const RECENTLY_VIEWED_STORAGE_KEY = 'rg_recently_viewed_products';
const RECENTLY_VIEWED_EVENT = 'rg_recently_viewed_changed';
const MAX_RECENT_ITEMS = 5;

type RecentlyViewedListener = (ids: string[]) => void;
const listeners = new Set<RecentlyViewedListener>();

export const getRecentlyViewedIds = (): string[] => {
  try {
    const raw = sessionStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY) || localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_ITEMS) : [];
  } catch {
    return [];
  }
};

export const trackProductView = (productId: string) => {
  if (!productId) return;
  try {
    const current = getRecentlyViewedIds();
    // Remove if already in list so it jumps to top
    const filtered = current.filter((id) => id !== productId);
    const updated = [productId, ...filtered].slice(0, MAX_RECENT_ITEMS);

    sessionStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(updated));

    listeners.forEach((fn) => fn(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(RECENTLY_VIEWED_EVENT, { detail: updated }));
    }
  } catch (err) {
    console.warn('Failed to record recently viewed product:', err);
  }
};

export const subscribeToRecentlyViewed = (callback: RecentlyViewedListener): (() => void) => {
  listeners.add(callback);
  callback(getRecentlyViewedIds());

  const handleCustomEvent = (e: any) => {
    if (e.detail) {
      callback(e.detail);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(RECENTLY_VIEWED_EVENT, handleCustomEvent);
  }

  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener(RECENTLY_VIEWED_EVENT, handleCustomEvent);
    }
  };
};

export const getRecentlyViewedProducts = (allProducts: Product[]): Product[] => {
  const ids = getRecentlyViewedIds();
  if (ids.length === 0 || allProducts.length === 0) return [];
  
  const map = new Map<string, Product>();
  allProducts.forEach((p) => map.set(p.id, p));

  const result: Product[] = [];
  ids.forEach((id) => {
    const found = map.get(id);
    if (found) result.push(found);
  });

  return result;
};
