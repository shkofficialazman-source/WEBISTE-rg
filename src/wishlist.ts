import { Product, UserProfile } from './types';
import { supabase } from './supabase';

const WISHLIST_STORAGE_KEY = 'rg_wishlist_ids';
const WISHLIST_CHANGE_EVENT = 'rg_wishlist_changed';

type WishlistListener = (ids: string[]) => void;
const listeners = new Set<WishlistListener>();

export const getWishlistIds = (): string[] => {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const setWishlistIds = (ids: string[]) => {
  try {
    const unique = Array.from(new Set(ids));
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(unique));
    listeners.forEach((fn) => fn(unique));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(WISHLIST_CHANGE_EVENT, { detail: unique }));
    }
  } catch (err) {
    console.warn('Failed to save wishlist IDs:', err);
  }
};

export const isProductWishlisted = (productId: string): boolean => {
  if (!productId) return false;
  const ids = getWishlistIds();
  return ids.includes(productId);
};

export const isWishlisted = isProductWishlisted;

export const toggleWishlistItem = async (
  productId: string,
  userProfile?: UserProfile | null
): Promise<boolean> => {
  if (!productId) return false;
  const current = getWishlistIds();
  let updated: string[];
  let isNowWishlisted: boolean;

  if (current.includes(productId)) {
    updated = current.filter((id) => id !== productId);
    isNowWishlisted = false;
  } else {
    updated = [productId, ...current];
    isNowWishlisted = true;
  }

  setWishlistIds(updated);

  // If user is logged in, sync with Supabase if table exists
  if (userProfile?.uid || userProfile?.email) {
    syncWishlistToSupabase(updated, userProfile).catch((e) =>
      console.warn('Supabase wishlist sync notice:', e)
    );
  }

  return isNowWishlisted;
};

export const toggleWishlist = toggleWishlistItem;

export const subscribeToWishlist = (callback: WishlistListener): (() => void) => {
  listeners.add(callback);
  callback(getWishlistIds());

  const handleCustomEvent = (e: any) => {
    if (e.detail) {
      callback(e.detail);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(WISHLIST_CHANGE_EVENT, handleCustomEvent);
    window.addEventListener('storage', (e) => {
      if (e.key === WISHLIST_STORAGE_KEY) {
        callback(getWishlistIds());
      }
    });
  }

  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener(WISHLIST_CHANGE_EVENT, handleCustomEvent);
    }
  };
};

/**
 * Sync logged-in customer wishlist to / from Supabase
 */
export const syncWishlistOnLogin = async (userProfile: UserProfile): Promise<string[]> => {
  if (!userProfile) return getWishlistIds();
  const localIds = getWishlistIds();
  const identifier = userProfile.uid || userProfile.email;
  if (!identifier) return localIds;

  let remoteIds: string[] = [];

  // 1. Fetch from server API proxy (connects to Supabase with service role)
  try {
    const res = await fetch(`/api/wishlist/${encodeURIComponent(identifier)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.productIds)) {
        remoteIds = json.productIds;
      }
    }
  } catch (apiErr) {
    console.warn('Server wishlist proxy notice:', apiErr);
  }

  // 2. Also try direct client Supabase query if remoteIds is empty
  if (remoteIds.length === 0) {
    try {
      const { data, error } = await supabase
        .from('user_wishlists')
        .select('product_ids')
        .eq('user_id', identifier)
        .maybeSingle();

      if (!error && data && Array.isArray(data.product_ids)) {
        remoteIds = data.product_ids;
      }
    } catch (err) {
      console.warn('Client Supabase wishlist fetch notice:', err);
    }
  }

  // Merge remote items with any local items added prior to login
  const merged = Array.from(new Set([...localIds, ...remoteIds]));
  setWishlistIds(merged);

  // Persist the combined wishlist back to Supabase
  if (merged.length > 0) {
    await syncWishlistToSupabase(merged, userProfile);
  }

  return merged;
};

export const syncWishlistToSupabase = async (
  ids: string[],
  userProfile: UserProfile
): Promise<void> => {
  try {
    const identifier = userProfile.uid || userProfile.email;
    if (!identifier) return;

    const cleanIds = Array.from(new Set(ids));

    // 1. Sync via Server REST API (has service key, bypasses RLS issues)
    try {
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: identifier,
          userEmail: userProfile.email || '',
          productIds: cleanIds,
        }),
      });
    } catch (apiErr) {
      console.warn('API wishlist sync notice:', apiErr);
    }

    // 2. Also attempt direct client Supabase upsert
    try {
      await supabase
        .from('user_wishlists')
        .upsert(
          {
            user_id: identifier,
            user_email: userProfile.email,
            product_ids: cleanIds,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
    } catch (dbErr) {
      // Non-blocking fallback
    }
  } catch (err) {
    // Non-blocking fallback
  }
};
