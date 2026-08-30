import { Product } from '../types';

/**
 * High-performance instant shell cache for initial paint.
 * Prevents blank white screen and delayed layout shifts.
 */
const CACHE_KEYS = {
  PRODUCTS: 'rg_cached_products_v2',
  CATEGORIES: 'rg_cached_categories_v2',
  TIMESTAMP: 'rg_cache_ts_v2',
};

// 12-hour local caching threshold for instantaneous initial render
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

export function getCachedProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CACHE_KEYS.PRODUCTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_e) {
    return [];
  }
}

export function saveCachedProducts(products: Product[]): void {
  if (typeof window === 'undefined' || !Array.isArray(products) || products.length === 0) return;
  try {
    // Only cache first 30 products to keep localStorage payload light and instant to parse
    const lightweightProds = products.slice(0, 30);
    localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(lightweightProds));
    localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
  } catch (_e) {
    // Ignore storage quota errors
  }
}

export function getCachedCategories(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CACHE_KEYS.CATEGORIES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_e) {
    return [];
  }
}

export function saveCachedCategories(categories: any[]): void {
  if (typeof window === 'undefined' || !Array.isArray(categories) || categories.length === 0) return;
  try {
    localStorage.setItem(CACHE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (_e) {
    // Ignore storage quota errors
  }
}
