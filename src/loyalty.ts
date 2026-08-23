import { supabase } from './supabase';
import { LoyaltyAccount, LoyaltySettings, FirestoreOrder } from './types';

export const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  earnRateRupees: 10, // 1 point per ₹10 spent
  redeemPointValue: 0.5, // 100 points = ₹50 discount (₹0.50 per point)
  minPointsToRedeem: 100, // minimum 100 points to redeem
  loyaltyEnabled: true,
};

const SETTINGS_STORAGE_KEY = 'rg_loyalty_settings_v1';
const ACCOUNTS_STORAGE_KEY = 'rg_loyalty_accounts_v1';
const AWARDED_ORDERS_KEY = 'rg_loyalty_awarded_orders_v1';

// -------------------------------------------------------------
// Settings Management
// -------------------------------------------------------------

export const getCachedLoyaltySettings = (): LoyaltySettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_LOYALTY_SETTINGS;
    return { ...DEFAULT_LOYALTY_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_LOYALTY_SETTINGS;
  }
};

export const fetchLoyaltySettings = async (): Promise<LoyaltySettings> => {
  const cached = getCachedLoyaltySettings();
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'loyalty_settings')
      .maybeSingle();

    if (error || !data || !data.value) {
      return cached;
    }

    const settings = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    const merged = { ...DEFAULT_LOYALTY_SETTINGS, ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.warn('Failed to fetch loyalty settings from Supabase, using cache:', err);
    return cached;
  }
};

export const saveLoyaltySettings = async (settings: Partial<LoyaltySettings>): Promise<LoyaltySettings> => {
  const current = getCachedLoyaltySettings();
  const updated: LoyaltySettings = { ...current, ...settings };

  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));

  try {
    const { error } = await supabase.from('store_settings').upsert({
      key: 'loyalty_settings',
      value: updated,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Supabase loyalty settings upsert error:', error.message);
      throw new Error(`Failed to save loyalty settings in database: ${error.message}`);
    }
  } catch (err: any) {
    console.error('Supabase save loyalty settings exception:', err);
    throw err instanceof Error ? err : new Error('Failed to save loyalty settings in database.');
  }

  return updated;
};

// -------------------------------------------------------------
// Loyalty Accounts Operations
// -------------------------------------------------------------

const getLocalAccounts = (): Record<string, LoyaltyAccount> => {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveLocalAccounts = (accounts: Record<string, LoyaltyAccount>) => {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Error caching loyalty accounts:', e);
  }
};

export const sanitizePhoneKey = (phone?: string): string => {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '').slice(-10); // standard 10 digit Indian number
};

export const getLoyaltyAccount = async (identifier: {
  phone?: string;
  email?: string;
  userId?: string;
}): Promise<LoyaltyAccount | null> => {
  const cleanPhone = sanitizePhoneKey(identifier.phone);
  const cleanEmail = identifier.email?.trim().toLowerCase();
  const userId = identifier.userId;

  const localMap = getLocalAccounts();

  // Try finding in local map
  for (const acc of Object.values(localMap)) {
    if (cleanPhone && sanitizePhoneKey(acc.phone) === cleanPhone) return acc;
    if (cleanEmail && acc.email?.toLowerCase() === cleanEmail) return acc;
    if (userId && acc.userId === userId) return acc;
  }

  try {
    let query = supabase.from('loyalty_accounts').select('*');
    if (cleanPhone) {
      query = query.or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`);
    } else if (cleanEmail) {
      query = query.eq('email', cleanEmail);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else {
      return null;
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) return null;

    const account: LoyaltyAccount = {
      id: String(data.id),
      phone: data.phone || cleanPhone || '',
      email: data.email || cleanEmail,
      userId: data.user_id || userId,
      customerName: data.customer_name || 'Collector',
      pointsBalance: Number(data.points_balance || 0),
      lifetimeEarned: Number(data.lifetime_earned || 0),
      lifetimeRedeemed: Number(data.lifetime_redeemed || 0),
      updatedAt: data.updated_at || new Date().toISOString(),
    };

    // Cache locally
    localMap[account.phone || account.id] = account;
    saveLocalAccounts(localMap);

    return account;
  } catch (err) {
    console.warn('Supabase fetch loyalty account notice:', err);
    return null;
  }
};

export const createOrUpdateLoyaltyAccount = async (accountData: Partial<LoyaltyAccount> & { phone: string }): Promise<LoyaltyAccount> => {
  const cleanPhone = sanitizePhoneKey(accountData.phone);
  const localMap = getLocalAccounts();
  const existing = localMap[cleanPhone] || (await getLoyaltyAccount({ phone: cleanPhone }));

  const updatedAccount: LoyaltyAccount = {
    id: existing?.id || `loyalty-${cleanPhone}-${Date.now()}`,
    phone: cleanPhone,
    email: accountData.email || existing?.email,
    userId: accountData.userId || existing?.userId,
    customerName: accountData.customerName || existing?.customerName || 'Hot Wheels Collector',
    pointsBalance: accountData.pointsBalance !== undefined ? accountData.pointsBalance : (existing?.pointsBalance || 0),
    lifetimeEarned: accountData.lifetimeEarned !== undefined ? accountData.lifetimeEarned : (existing?.lifetimeEarned || 0),
    lifetimeRedeemed: accountData.lifetimeRedeemed !== undefined ? accountData.lifetimeRedeemed : (existing?.lifetimeRedeemed || 0),
    updatedAt: new Date().toISOString(),
  };

  localMap[cleanPhone] = updatedAccount;
  saveLocalAccounts(localMap);

  try {
    const payload = {
      phone: cleanPhone,
      email: updatedAccount.email || null,
      user_id: updatedAccount.userId || null,
      customer_name: updatedAccount.customerName,
      points_balance: updatedAccount.pointsBalance,
      lifetime_earned: updatedAccount.lifetimeEarned,
      lifetime_redeemed: updatedAccount.lifetimeRedeemed,
      updated_at: updatedAccount.updatedAt,
    };

    const { error } = await supabase.from('loyalty_accounts').upsert(payload, { onConflict: 'phone' });
    if (error) {
      console.warn('Supabase upsert loyalty account notice:', error.message);
    }
  } catch (err) {
    console.warn('Supabase loyalty account sync exception:', err);
  }

  return updatedAccount;
};

// -------------------------------------------------------------
// Awarding Points on Confirmed/Delivered Orders
// -------------------------------------------------------------

const getAwardedOrderIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(AWARDED_ORDERS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const markOrderAwarded = (orderId: string) => {
  try {
    const set = getAwardedOrderIds();
    set.add(orderId);
    localStorage.setItem(AWARDED_ORDERS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Failed to cache awarded order id:', e);
  }
};

export const awardPointsForOrder = async (
  order: FirestoreOrder
): Promise<{ awarded: boolean; points: number; account?: LoyaltyAccount; reason?: string }> => {
  const settings = getCachedLoyaltySettings();
  if (!settings.loyaltyEnabled) {
    return { awarded: false, points: 0, reason: 'Loyalty program currently disabled in settings' };
  }

  const orderKey = order.orderNumber || order.id || '';
  const awardedSet = getAwardedOrderIds();
  if (awardedSet.has(orderKey)) {
    return { awarded: false, points: 0, reason: 'Points already awarded for this order' };
  }

  const phone = sanitizePhoneKey(order.customerPhone);
  if (!phone) {
    return { awarded: false, points: 0, reason: 'No valid phone number for customer loyalty' };
  }

  // Calculate points: 1 point per `earnRateRupees` spent on net total
  const pointsToAward = Math.max(1, Math.floor(Number(order.total || 0) / (settings.earnRateRupees || 10)));

  const existingAccount = await getLoyaltyAccount({ phone, email: order.customerEmail, userId: order.userId });
  const currentBalance = existingAccount?.pointsBalance || 0;
  const currentLifetime = existingAccount?.lifetimeEarned || 0;

  const updated = await createOrUpdateLoyaltyAccount({
    phone,
    email: order.customerEmail || existingAccount?.email,
    userId: order.userId || existingAccount?.userId,
    customerName: order.customerName || existingAccount?.customerName,
    pointsBalance: currentBalance + pointsToAward,
    lifetimeEarned: currentLifetime + pointsToAward,
  });

  markOrderAwarded(orderKey);

  // Update order record with awarded points count
  try {
    await supabase.from('orders').update({
      loyalty_points_awarded: pointsToAward,
    }).eq('order_number', order.orderNumber);
  } catch (e) {
    // optional tracking
  }

  return { awarded: true, points: pointsToAward, account: updated };
};

// -------------------------------------------------------------
// Deducting Points at Checkout
// -------------------------------------------------------------

export const redeemLoyaltyPoints = async (
  phone: string,
  pointsToRedeem: number,
  customerName?: string,
  customerEmail?: string
): Promise<{ success: boolean; discountAmount: number; remainingPoints: number; error?: string }> => {
  const settings = getCachedLoyaltySettings();
  const cleanPhone = sanitizePhoneKey(phone);

  if (!cleanPhone) {
    return { success: false, discountAmount: 0, remainingPoints: 0, error: 'Please enter a valid phone number.' };
  }

  if (pointsToRedeem <= 0) {
    return { success: false, discountAmount: 0, remainingPoints: 0, error: 'Points to redeem must be greater than zero.' };
  }

  const account = await getLoyaltyAccount({ phone: cleanPhone });
  const balance = account?.pointsBalance || 0;

  if (balance < pointsToRedeem) {
    return {
      success: false,
      discountAmount: 0,
      remainingPoints: balance,
      error: `Insufficient points. You have ${balance} points available.`,
    };
  }

  if (pointsToRedeem < settings.minPointsToRedeem) {
    return {
      success: false,
      discountAmount: 0,
      remainingPoints: balance,
      error: `Minimum redemption is ${settings.minPointsToRedeem} points.`,
    };
  }

  const discountAmount = Math.round(pointsToRedeem * (settings.redeemPointValue || 0.5));
  const newBalance = Math.max(0, balance - pointsToRedeem);
  const newLifetimeRedeemed = (account?.lifetimeRedeemed || 0) + pointsToRedeem;

  await createOrUpdateLoyaltyAccount({
    phone: cleanPhone,
    customerName: customerName || account?.customerName,
    email: customerEmail || account?.email,
    pointsBalance: newBalance,
    lifetimeRedeemed: newLifetimeRedeemed,
  });

  return {
    success: true,
    discountAmount,
    remainingPoints: newBalance,
  };
};

// -------------------------------------------------------------
// Admin: Fetch all loyalty accounts
// -------------------------------------------------------------

export const fetchAllLoyaltyAccounts = async (): Promise<LoyaltyAccount[]> => {
  const localMap = getLocalAccounts();
  try {
    const { data, error } = await supabase
      .from('loyalty_accounts')
      .select('*')
      .order('points_balance', { ascending: false });

    if (error || !data || data.length === 0) {
      return Object.values(localMap);
    }

    const remoteAccounts: LoyaltyAccount[] = data.map((d: any) => ({
      id: String(d.id),
      phone: d.phone,
      email: d.email || undefined,
      userId: d.user_id || undefined,
      customerName: d.customer_name || 'Hot Wheels Collector',
      pointsBalance: Number(d.points_balance || 0),
      lifetimeEarned: Number(d.lifetime_earned || 0),
      lifetimeRedeemed: Number(d.lifetime_redeemed || 0),
      updatedAt: d.updated_at || new Date().toISOString(),
    }));

    // Merge with local map
    remoteAccounts.forEach(acc => {
      localMap[acc.phone] = acc;
    });
    saveLocalAccounts(localMap);

    return Object.values(localMap).sort((a, b) => b.pointsBalance - a.pointsBalance);
  } catch (err) {
    console.warn('Supabase fetch all loyalty accounts notice:', err);
    return Object.values(localMap).sort((a, b) => b.pointsBalance - a.pointsBalance);
  }
};
