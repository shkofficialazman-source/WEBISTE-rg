import { SavedAddress } from './types';

const ADDRESSES_STORAGE_KEY = 'rg_saved_shipping_addresses_v1';
const ADDRESSES_EVENT = 'rg_shipping_addresses_changed';
const GUEST_SAVED_PROFILE_KEY = 'rg_saved_guest_profile_v1';

export const getSavedAddresses = (userId?: string): SavedAddress[] => {
  try {
    const key = userId ? `${ADDRESSES_STORAGE_KEY}_${userId}` : ADDRESSES_STORAGE_KEY;
    const raw = localStorage.getItem(key) || localStorage.getItem(ADDRESSES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveAddress = (address: Omit<SavedAddress, 'id'> & { id?: string }, userId?: string): SavedAddress => {
  const current = getSavedAddresses(userId);
  const addressId = address.id || `addr-${Date.now()}`;
  
  const newAddr: SavedAddress = {
    ...address,
    id: addressId,
    userId: userId || address.userId,
  };

  // If this is set as default, clear other defaults
  let updated: SavedAddress[];
  if (address.isDefault) {
    updated = current.map((a) => ({ ...a, isDefault: false }));
  } else {
    updated = [...current];
  }

  const existingIndex = updated.findIndex((a) => a.id === addressId);
  if (existingIndex >= 0) {
    updated[existingIndex] = newAddr;
  } else {
    updated.unshift(newAddr);
  }

  try {
    const key = userId ? `${ADDRESSES_STORAGE_KEY}_${userId}` : ADDRESSES_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(updated));
    localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save address:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ADDRESSES_EVENT, { detail: updated }));
  }

  return newAddr;
};

export const deleteAddress = (addressId: string, userId?: string) => {
  const current = getSavedAddresses(userId);
  const updated = current.filter((a) => a.id !== addressId);
  try {
    const key = userId ? `${ADDRESSES_STORAGE_KEY}_${userId}` : ADDRESSES_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(updated));
    localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete address:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ADDRESSES_EVENT, { detail: updated }));
  }
};

export const deleteSavedAddress = (addressId: string, userId?: string) => {
  deleteAddress(addressId, userId);
};

export const setDefaultAddress = (addressId: string, userId?: string) => {
  const current = getSavedAddresses(userId);
  const updated = current.map((a) => ({
    ...a,
    isDefault: a.id === addressId,
  }));
  try {
    const key = userId ? `${ADDRESSES_STORAGE_KEY}_${userId}` : ADDRESSES_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(updated));
    localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to set default address:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ADDRESSES_EVENT, { detail: updated }));
  }
};

export const subscribeToAddresses = (callback: (addresses: SavedAddress[]) => void, userId?: string): (() => void) => {
  callback(getSavedAddresses(userId));

  const handleCustomEvent = (e: any) => {
    if (e.detail) {
      callback(e.detail);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(ADDRESSES_EVENT, handleCustomEvent);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(ADDRESSES_EVENT, handleCustomEvent);
    }
  };
};

export const getGuestSavedProfile = (): { name: string; phone: string; address: string; saveInfo: boolean } | null => {
  try {
    const raw = localStorage.getItem(GUEST_SAVED_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveGuestProfile = (profile: { name: string; phone: string; address: string; saveInfo: boolean }) => {
  try {
    if (profile.saveInfo) {
      localStorage.setItem(GUEST_SAVED_PROFILE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(GUEST_SAVED_PROFILE_KEY);
    }
  } catch (err) {
    console.warn('Failed to save guest profile:', err);
  }
};
