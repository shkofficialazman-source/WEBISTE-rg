import { supabase } from './supabase';
import { ReferralCode, ReferralDiscountType, UserProfile } from './types';

export const REFERRAL_CODES_STORAGE_KEY = 'rg_referral_codes_v2';
export const ACTIVE_REFERRAL_CODE_SESSION_KEY = 'rg_applied_referral_code';

export const DEFAULT_REFERRAL_CODES: ReferralCode[] = [
  {
    id: 'ref-welcome10',
    code: 'WELCOME10',
    discountType: 'percentage',
    discountValue: 10,
    active: true,
    usesCount: 42,
    maxUses: null,
    minOrderAmount: 0,
    totalDiscountGiven: 4200,
    isCollectorReferral: false,
    isBirthdayCode: false,
    creatorName: 'Redline Garage Welcome Desk',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-redline50',
    code: 'REDLINE50',
    discountType: 'flat',
    discountValue: 50,
    active: true,
    usesCount: 28,
    maxUses: null,
    minOrderAmount: 499,
    totalDiscountGiven: 1400,
    isCollectorReferral: false,
    isBirthdayCode: false,
    creatorName: 'Standard Flat Offer',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-hotwheels15',
    code: 'HOTWHEELS15',
    discountType: 'percentage',
    discountValue: 15,
    active: true,
    usesCount: 19,
    maxUses: 100,
    minOrderAmount: 999,
    totalDiscountGiven: 3150,
    isCollectorReferral: false,
    isBirthdayCode: false,
    creatorName: 'Diecast Collectors Special',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-vipcrew100',
    code: 'PITCREW100',
    discountType: 'flat',
    discountValue: 100,
    active: true,
    usesCount: 15,
    maxUses: 50,
    minOrderAmount: 1499,
    totalDiscountGiven: 1500,
    isCollectorReferral: true,
    isBirthdayCode: false,
    creatorName: 'VIP Pit Crew Club',
    createdAt: new Date().toISOString(),
  },
];

export const REFERRAL_SQL_SCHEMA = `-- =============================================================
-- REDLINE GARAGE: REFERRAL & PROMO CODES SQL TABLE & RLS POLICIES
-- Run this in your Supabase Project -> SQL Editor
-- =============================================================

-- 1. Create referral_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id TEXT PRIMARY KEY DEFAULT ('ref_' || gen_random_uuid()::text),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    active BOOLEAN NOT NULL DEFAULT true,
    uses_count INTEGER NOT NULL DEFAULT 0,
    max_uses INTEGER,
    min_order_amount NUMERIC(10, 2) DEFAULT 0,
    total_discount_given NUMERIC(10, 2) DEFAULT 0,
    is_collector_referral BOOLEAN DEFAULT false,
    is_birthday_code BOOLEAN DEFAULT false,
    recipient_phone TEXT,
    creator_uid TEXT,
    creator_email TEXT,
    creator_name TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1b. Schema Audit & Column Additions (Ensures compatibility even if table was created previously)
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'percentage';
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10, 2) NOT NULL DEFAULT 10;
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS uses_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER;
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS total_discount_given NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS is_collector_referral BOOLEAN DEFAULT false;
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS is_birthday_code BOOLEAN DEFAULT false;
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS recipient_phone TEXT;
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS creator_uid TEXT;
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS creator_email TEXT;
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS creator_name TEXT;
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes (UPPER(code));
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON public.referral_codes (active);
CREATE INDEX IF NOT EXISTS idx_referral_codes_creator_uid ON public.referral_codes (creator_uid);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- 4. Clean up prior policies if re-running
DROP POLICY IF EXISTS "Allow public read active referral_codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Allow public read referral_codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Allow authenticated admin full access on referral_codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Allow admin modify referral_codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Allow app admin modify referral_codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Allow select referral_codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Allow insert referral_codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Allow update referral_codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Allow delete referral_codes" ON public.referral_codes;

-- 5. Explicit CRUD RLS Policies for full admin & storefront access:
-- (A) SELECT (Read all codes for checkout validation and admin management)
CREATE POLICY "Allow select referral_codes" 
ON public.referral_codes 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- (B) INSERT (Create new promo and affiliate codes)
CREATE POLICY "Allow insert referral_codes" 
ON public.referral_codes 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- (C) UPDATE (Edit details and toggle active status)
CREATE POLICY "Allow update referral_codes" 
ON public.referral_codes 
FOR UPDATE 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- (D) DELETE (Delete codes permanently)
CREATE POLICY "Allow delete referral_codes" 
ON public.referral_codes 
FOR DELETE 
TO anon, authenticated 
USING (true);

-- 6. Seed starter referral & coupon codes
INSERT INTO public.referral_codes (id, code, discount_type, discount_value, active, uses_count, min_order_amount, total_discount_given, is_collector_referral, creator_name)
VALUES 
  ('ref-welcome10', 'WELCOME10', 'percentage', 10.00, true, 42, 0.00, 4200.00, false, 'Redline Garage Welcome Desk'),
  ('ref-redline50', 'REDLINE50', 'flat', 50.00, true, 28, 499.00, 1400.00, false, 'Standard Flat Offer'),
  ('ref-hotwheels15', 'HOTWHEELS15', 'percentage', 15.00, true, 19, 999.00, 3150.00, false, 'Diecast Collectors Special'),
  ('ref-vipcrew100', 'PITCREW100', 'flat', 100.00, true, 15, 1499.00, 1500.00, true, 'VIP Pit Crew Club')
ON CONFLICT (code) DO UPDATE SET
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  active = EXCLUDED.active;

-- 7. Enable Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_codes;
`;

/**
 * Reads local cached referral codes
 */
const getLocalReferralCodes = (): ReferralCode[] => {
  try {
    const raw = localStorage.getItem(REFERRAL_CODES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read local referral codes:', e);
  }
  return DEFAULT_REFERRAL_CODES;
};

/**
 * Saves referral codes to local cache
 */
const saveLocalReferralCodes = (codes: ReferralCode[]) => {
  try {
    localStorage.setItem(REFERRAL_CODES_STORAGE_KEY, JSON.stringify(codes));
  } catch (e) {
    console.warn('Could not save local referral codes:', e);
  }
};

/**
 * Map Supabase DB row to ReferralCode interface
 */
const mapDbToReferralCode = (row: any): ReferralCode => {
  return {
    id: String(row.id || `ref-${Date.now()}`),
    code: String(row.code).toUpperCase().trim(),
    discountType: (row.discount_type || row.discountType || 'percentage') as ReferralDiscountType,
    discountValue: Number(row.discount_value ?? row.discountValue ?? 10),
    active: Boolean(row.active ?? true),
    usesCount: Number(row.uses_count ?? row.usesCount ?? 0),
    maxUses: row.max_uses !== null && row.max_uses !== undefined ? Number(row.max_uses) : (row.maxUses ?? null),
    minOrderAmount: Number(row.min_order_amount ?? row.minOrderAmount ?? 0),
    totalDiscountGiven: Number(row.total_discount_given ?? row.totalDiscountGiven ?? 0),
    isCollectorReferral: Boolean(row.is_collector_referral ?? row.isCollectorReferral ?? false),
    isBirthdayCode: Boolean(row.is_birthday_code ?? row.isBirthdayCode ?? false),
    recipientPhone: row.recipient_phone || row.recipientPhone || undefined,
    creatorUid: row.creator_uid || row.creatorUid || undefined,
    creatorEmail: row.creator_email || row.creatorEmail || undefined,
    creatorName: row.creator_name || row.creatorName || undefined,
    expiresAt: row.expires_at || row.expiresAt || undefined,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
};

/**
 * Fetch all referral codes from Supabase, falling back to local storage
 */
export const fetchReferralCodesFromSupabase = async (): Promise<ReferralCode[]> => {
  try {
    const { data, error } = await supabase
      .from('referral_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase referral_codes query note:', error.message);
      return getLocalReferralCodes();
    }

    // Query succeeded, use returned rows as source of truth
    const mapped = (data || []).map(mapDbToReferralCode);
    saveLocalReferralCodes(mapped);
    return mapped;
  } catch (err) {
    console.warn('fetchReferralCodesFromSupabase fallback:', err);
    return getLocalReferralCodes();
  }
};

/**
 * Create a new Referral / Promo Code in Supabase and Local Storage.
 * Includes defensive schema adaptation to gracefully handle databases that
 * have not yet executed all column additions.
 */
export const createReferralCodeInSupabase = async (
  codeData: Omit<ReferralCode, 'id' | 'usesCount' | 'totalDiscountGiven' | 'createdAt'> & { id?: string }
): Promise<ReferralCode> => {
  const cleanCode = codeData.code.toUpperCase().replace(/\s+/g, '').trim();
  const id = codeData.id || `ref-${cleanCode.toLowerCase()}-${Date.now()}`;
  const now = new Date().toISOString();

  const newReferral: ReferralCode = {
    id,
    code: cleanCode,
    discountType: codeData.discountType,
    discountValue: Number(codeData.discountValue),
    active: codeData.active ?? true,
    usesCount: 0,
    maxUses: codeData.maxUses ?? null,
    minOrderAmount: Number(codeData.minOrderAmount || 0),
    totalDiscountGiven: 0,
    isCollectorReferral: Boolean(codeData.isCollectorReferral),
    isBirthdayCode: Boolean(codeData.isBirthdayCode),
    recipientPhone: codeData.recipientPhone,
    creatorUid: codeData.creatorUid,
    creatorEmail: codeData.creatorEmail,
    creatorName: codeData.creatorName || 'Redline Garage Admin',
    expiresAt: codeData.expiresAt,
    createdAt: now,
  };

  const dbPayload: Record<string, any> = {
    id: newReferral.id,
    code: newReferral.code,
    discount_type: newReferral.discountType,
    discount_value: newReferral.discountValue,
    active: newReferral.active,
    uses_count: 0,
    max_uses: newReferral.maxUses,
    min_order_amount: newReferral.minOrderAmount,
    total_discount_given: 0,
    is_collector_referral: newReferral.isCollectorReferral,
    is_birthday_code: newReferral.isBirthdayCode,
    recipient_phone: newReferral.recipientPhone || null,
    creator_uid: newReferral.creatorUid || null,
    creator_email: newReferral.creatorEmail || null,
    creator_name: newReferral.creatorName || null,
    expires_at: newReferral.expiresAt || null,
    created_at: now,
    updated_at: now,
  };

  // Attempt initial upsert
  let { error } = await supabase.from('referral_codes').upsert(dbPayload, { onConflict: 'code' });

  // Adaptive column pruning: If Supabase reports a missing column in older table schemas, strip it and retry
  if (error && (error.message?.includes('Could not find the') || error.message?.includes('column') || error.code === 'PGRST204')) {
    console.warn('Supabase referral_codes schema warning, attempting adaptive payload retry:', error.message);
    const missingColMatch = error.message.match(/Could not find the '([^']+)' column/) ||
                            error.message.match(/column "?([^"'\s]+)"? of relation/);
    if (missingColMatch && missingColMatch[1]) {
      const missingCol = missingColMatch[1];
      delete dbPayload[missingCol];
      const retry = await supabase.from('referral_codes').upsert(dbPayload, { onConflict: 'code' });
      error = retry.error;
    }
  }

  // Fallback to minimal core fields if schema cache is very outdated
  if (error && (error.message?.includes('Could not find') || error.code === 'PGRST204')) {
    const minimalPayload = {
      id: newReferral.id,
      code: newReferral.code,
      discount_type: newReferral.discountType,
      discount_value: newReferral.discountValue,
      active: newReferral.active,
    };
    const minimalRetry = await supabase.from('referral_codes').upsert(minimalPayload, { onConflict: 'code' });
    if (!minimalRetry.error) {
      error = null;
    }
  }

  if (error) {
    console.error('Supabase referral insert/upsert error:', error);
    // If it's a fatal constraint or permission error, throw with clarity
    if (!error.message?.includes('column')) {
      throw new Error(error.message || 'Failed to save referral code to database.');
    }
  }

  // Update local cache so code is instantly usable across app
  const localList = getLocalReferralCodes();
  const filtered = localList.filter(c => c.code !== cleanCode && c.id !== id);
  filtered.unshift(newReferral);
  saveLocalReferralCodes(filtered);

  return newReferral;
};

/**
 * Update an existing referral code
 */
export const updateReferralCodeInSupabase = async (
  codeId: string,
  updates: Partial<ReferralCode>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.code !== undefined) dbUpdates.code = updates.code.toUpperCase().trim();
    if (updates.discountType !== undefined) dbUpdates.discount_type = updates.discountType;
    if (updates.discountValue !== undefined) dbUpdates.discount_value = Number(updates.discountValue);
    if (updates.active !== undefined) dbUpdates.active = Boolean(updates.active);
    if (updates.usesCount !== undefined) dbUpdates.uses_count = Number(updates.usesCount);
    if (updates.maxUses !== undefined) dbUpdates.max_uses = updates.maxUses;
    if (updates.minOrderAmount !== undefined) dbUpdates.min_order_amount = Number(updates.minOrderAmount);
    if (updates.totalDiscountGiven !== undefined) dbUpdates.total_discount_given = Number(updates.totalDiscountGiven);
    if (updates.isCollectorReferral !== undefined) dbUpdates.is_collector_referral = Boolean(updates.isCollectorReferral);
    if (updates.isBirthdayCode !== undefined) dbUpdates.is_birthday_code = Boolean(updates.isBirthdayCode);
    if (updates.creatorName !== undefined) dbUpdates.creator_name = updates.creatorName;
    if (updates.expiresAt !== undefined) dbUpdates.expires_at = updates.expiresAt;

    let updateRes = await supabase
      .from('referral_codes')
      .update(dbUpdates)
      .eq('id', codeId);

    if (updateRes.error && updates.code) {
      updateRes = await supabase
        .from('referral_codes')
        .update(dbUpdates)
        .eq('code', updates.code.toUpperCase().trim());
    }

    // Adaptive column pruning if schema is missing a column
    if (updateRes.error && (updateRes.error.message?.includes('Could not find the') || updateRes.error.code === 'PGRST204')) {
      const missingColMatch = updateRes.error.message.match(/Could not find the '([^']+)' column/);
      if (missingColMatch && missingColMatch[1]) {
        const missingCol = missingColMatch[1];
        delete dbUpdates[missingCol];
        updateRes = await supabase
          .from('referral_codes')
          .update(dbUpdates)
          .eq('id', codeId);
      }
    }

    // Update local cache
    const localList = getLocalReferralCodes();
    const updatedList = localList.map(c => {
      if (c.id === codeId || (updates.code && c.code === updates.code.toUpperCase().trim())) {
        return { ...c, ...updates };
      }
      return c;
    });
    saveLocalReferralCodes(updatedList);

    return { success: true };
  } catch (err: any) {
    console.error('updateReferralCodeInSupabase error:', err);
    return { success: false, error: err?.message || 'Database update error' };
  }
};

/**
 * Delete a referral code from Supabase PostgreSQL database
 * Checks for errors, deletes by ID and Code to ensure database removal,
 * and updates local cache only upon confirmed success.
 */
export const deleteReferralCodeFromSupabase = async (
  codeId: string,
  codeString?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. Execute deletion on Supabase table by ID
    const deleteByIdRes = await supabase
      .from('referral_codes')
      .delete()
      .eq('id', codeId);

    if (deleteByIdRes.error) {
      console.error('Supabase delete referral by ID error:', deleteByIdRes.error);
      return {
        success: false,
        error: `Supabase delete failed: ${deleteByIdRes.error.message || 'Row Level Security policy or permission error.'}`,
      };
    }

    // 2. Also ensure deletion by code string if provided (in case of legacy/seeded ID mismatch)
    if (codeString) {
      const cleanCode = codeString.toUpperCase().trim();
      const deleteByCodeRes = await supabase
        .from('referral_codes')
        .delete()
        .eq('code', cleanCode);

      if (deleteByCodeRes.error) {
        console.warn('Supabase delete referral by Code note:', deleteByCodeRes.error.message);
      }
    }

    // 3. Only update local cache once Supabase deletion succeeded
    const localList = getLocalReferralCodes();
    const filtered = localList.filter(
      c => c.id !== codeId && (!codeString || c.code !== codeString.toUpperCase().trim())
    );
    saveLocalReferralCodes(filtered);

    return { success: true };
  } catch (err: any) {
    console.error('deleteReferralCodeFromSupabase unexpected exception:', err);
    return {
      success: false,
      error: err?.message || 'Unexpected network or database error during deletion.',
    };
  }
};

export interface ReferralValidationResult {
  isValid: boolean;
  code?: ReferralCode;
  discountAmount: number;
  message: string;
}

/**
 * Validates a referral code against cart subtotal, limits, and expiration
 */
export const validateReferralCode = async (
  inputCode: string,
  subtotal: number,
  customerPhone?: string,
  customerEmail?: string
): Promise<ReferralValidationResult> => {
  const clean = inputCode.toUpperCase().replace(/\s+/g, '').trim();

  if (!clean) {
    return {
      isValid: false,
      discountAmount: 0,
      message: 'Please enter a referral or coupon code.',
    };
  }

  // Fetch freshest codes from DB / cache
  const allCodes = await fetchReferralCodesFromSupabase();
  const matched = allCodes.find(c => c.code === clean);

  if (!matched) {
    return {
      isValid: false,
      discountAmount: 0,
      message: `Invalid referral code "${clean}". Please check for typos.`,
    };
  }

  if (!matched.active) {
    return {
      isValid: false,
      discountAmount: 0,
      message: `Referral code "${matched.code}" is currently deactivated.`,
    };
  }

  // Check expiration (accurately handling dates and ISO timestamps)
  if (matched.expiresAt) {
    const expiry = new Date(matched.expiresAt);
    if (!isNaN(expiry.getTime())) {
      const now = Date.now();
      if (expiry.getTime() < now) {
        const formattedDate = expiry.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        return {
          isValid: false,
          discountAmount: 0,
          message: `This code has expired (expired on ${formattedDate}).`,
        };
      }
    }
  }

  // Check max uses
  if (matched.maxUses !== null && matched.maxUses !== undefined && matched.maxUses > 0) {
    if (matched.usesCount >= matched.maxUses) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Referral code "${matched.code}" has reached its maximum redemption limit (${matched.maxUses} uses).`,
      };
    }
  }

  // Check min order amount
  const minRequired = matched.minOrderAmount || 0;
  if (subtotal < minRequired) {
    return {
      isValid: false,
      discountAmount: 0,
      message: `Code "${matched.code}" requires a minimum order subtotal of ₹${minRequired.toFixed(2)}. Add ₹${(minRequired - subtotal).toFixed(2)} more to unlock!`,
    };
  }

  // Check recipient phone restriction for birthday/targeted codes
  if (matched.recipientPhone && customerPhone) {
    const cleanRecipient = matched.recipientPhone.replace(/[^0-9]/g, '');
    const cleanCustomer = customerPhone.replace(/[^0-9]/g, '');
    if (cleanRecipient && cleanCustomer && !cleanCustomer.endsWith(cleanRecipient.slice(-10))) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `This exclusive code is tied to another registered collector phone number.`,
      };
    }
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (matched.discountType === 'percentage') {
    discountAmount = Math.round((subtotal * matched.discountValue) / 100);
  } else {
    discountAmount = Math.min(matched.discountValue, subtotal);
  }

  // Ensure discount doesn't exceed subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  const formattedDiscount = matched.discountType === 'percentage'
    ? `${matched.discountValue}% OFF (Saved ₹${discountAmount})`
    : `₹${matched.discountValue} FLAT OFF`;

  return {
    isValid: true,
    code: matched,
    discountAmount,
    message: `🎉 Success! Code ${matched.code} applied: ${formattedDiscount}`,
  };
};

/**
 * Record usage when an order is completed
 */
export const recordReferralCodeUsage = async (
  codeString: string,
  discountAmountApplied: number,
  orderNumber?: string
): Promise<void> => {
  const clean = codeString.toUpperCase().replace(/\s+/g, '').trim();
  if (!clean) return;

  const allCodes = await fetchReferralCodesFromSupabase();
  const matched = allCodes.find(c => c.code === clean);

  if (!matched) return;

  const newUses = (matched.usesCount || 0) + 1;
  const newTotalDiscount = (matched.totalDiscountGiven || 0) + Number(discountAmountApplied || 0);

  await updateReferralCodeInSupabase(matched.id, {
    usesCount: newUses,
    totalDiscountGiven: newTotalDiscount,
  });
};

/**
 * Generates or gets personal referral code for a customer/collector
 */
export const getOrCreateCustomerReferralCode = async (
  user: UserProfile | { uid?: string; name?: string; email?: string; phone?: string }
): Promise<ReferralCode> => {
  const allCodes = await fetchReferralCodesFromSupabase();

  // Search if user already has a code
  const existing = allCodes.find(
    c =>
      c.isCollectorReferral &&
      ((user.uid && c.creatorUid === user.uid) ||
       (user.phone && c.recipientPhone && c.recipientPhone.endsWith(user.phone.slice(-10))) ||
       (user.email && c.creatorEmail && c.creatorEmail.toLowerCase() === user.email.toLowerCase()))
  );

  if (existing) {
    return existing;
  }

  // Generate unique code: e.g. SPEEDY-AZMAN-748
  const baseName = (user.name || user.email?.split('@')[0] || user.phone?.slice(-4) || 'COLLECTOR')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 6);
  const suffix = Math.floor(100 + Math.random() * 900);
  const code = `VIP-${baseName}-${suffix}`;

  return await createReferralCodeInSupabase({
    code,
    discountType: 'percentage',
    discountValue: 10,
    active: true,
    maxUses: null,
    minOrderAmount: 499,
    isCollectorReferral: true,
    isBirthdayCode: false,
    recipientPhone: user.phone,
    creatorUid: user.uid,
    creatorEmail: user.email,
    creatorName: `${user.name || 'Collector'} VIP Referral`,
  });
};

/**
 * Real-time subscription to referral_codes
 */
export const subscribeToReferralCodes = (onUpdate: (codes: ReferralCode[]) => void) => {
  const channelId = `referral_codes_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'referral_codes' },
      async () => {
        try {
          const fresh = await fetchReferralCodesFromSupabase();
          onUpdate(fresh);
        } catch (err) {
          console.warn('Realtime referral update fetch error:', err);
        }
      }
    )
    .subscribe();

  return () => {
    try {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    } catch (e) {
      // safe cleanup
    }
  };
};
