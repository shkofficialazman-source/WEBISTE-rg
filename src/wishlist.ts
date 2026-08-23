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

  try {
    const identifier = userProfile.uid || userProfile.email;
    const { data, error } = await supabase
      .from('user_wishlists')
      .select('product_ids')
      .eq('user_id', identifier)
      .maybeSingle();

    if (!error && data && Array.isArray(data.product_ids)) {
      const merged = Array.from(new Set([...localIds, ...data.product_ids]));
      setWishlistIds(merged);
      await syncWishlistToSupabase(merged, userProfile);
      return merged;
    } else {
      if (localIds.length > 0) {
        await syncWishlistToSupabase(localIds, userProfile);
      }
    }
  } catch (err) {
    console.warn('Wishlist login sync fallback:', err);
  }

  return localIds;
};

export const syncWishlistToSupabase = async (
  ids: string[],
  userProfile: UserProfile
): Promise<void> => {
  try {
    const identifier = userProfile.uid || userProfile.email;
    if (!identifier) return;

    await supabase
      .from('user_wishlists')
      .upsert(
        {
          user_id: identifier,
          user_email: userProfile.email,
          product_ids: ids,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
  } catch (err) {
    // Non-blocking fallback
  }
};
