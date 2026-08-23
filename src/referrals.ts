import { supabase } from './supabase';
import { ReferralCode, ReferralDiscountType } from './types';

const REFERRALS_STORAGE_KEY = 'rg_referral_codes_v1';

export const DEFAULT_REFERRAL_CODES: ReferralCode[] = [
  {
    id: 'ref-azman10',
    code: 'AZMAN10',
    discountType: 'percentage',
    discountValue: 10,
    active: true,
    usesCount: 14,
    maxUses: null, // Unlimited
    minOrderAmount: 0,
    totalDiscountGiven: 1250,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-redline50',
    code: 'REDLINE50',
    discountType: 'flat',
    discountValue: 50,
    active: true,
    usesCount: 8,
    maxUses: 100,
    minOrderAmount: 499,
    totalDiscountGiven: 400,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-diecast15',
    code: 'DIECAST15',
    discountType: 'percentage',
    discountValue: 15,
    active: true,
    usesCount: 5,
    maxUses: 50,
    minOrderAmount: 999,
    totalDiscountGiven: 680,
    createdAt: new Date().toISOString(),
  },
];

export const getCachedReferralCodes = (): ReferralCode[] => {
  try {
    const raw = localStorage.getItem(REFERRALS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REFERRALS_STORAGE_KEY, JSON.stringify(DEFAULT_REFERRAL_CODES));
      return DEFAULT_REFERRAL_CODES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_REFERRAL_CODES;
  } catch {
    return DEFAULT_REFERRAL_CODES;
  }
};

export const saveCachedReferralCodes = (codes: ReferralCode[]) => {
  try {
    localStorage.setItem(REFERRALS_STORAGE_KEY, JSON.stringify(codes));
  } catch (err) {
    console.warn('Failed to cache referral codes:', err);
  }
};

export const fetchReferralCodesFromSupabase = async (): Promise<ReferralCode[]> => {
  const cached = getCachedReferralCodes();
  try {
    const { data, error } = await supabase
      .from('referral_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return cached;
    }

    const remoteCodes: ReferralCode[] = data.map((d: any) => ({
      id: String(d.id),
      code: String(d.code).toUpperCase().trim(),
      discountType: (d.discount_type || d.discountType || 'percentage') as ReferralDiscountType,
      discountValue: Number(d.discount_value ?? d.discountValue ?? 10),
      active: Boolean(d.active ?? true),
      usesCount: Number(d.uses_count ?? d.usesCount ?? 0),
      maxUses: d.max_uses !== null && d.max_uses !== undefined ? Number(d.max_uses) : null,
      minOrderAmount: d.min_order_amount !== null && d.min_order_amount !== undefined ? Number(d.min_order_amount) : null,
      totalDiscountGiven: Number(d.total_discount_given ?? d.totalDiscountGiven ?? 0),
      isCollectorReferral: Boolean(d.is_collector_referral || d.isCollectorReferral),
      creatorUid: d.creator_uid || d.creatorUid,
      creatorEmail: d.creator_email || d.creatorEmail,
      creatorName: d.creator_name || d.creatorName,
      createdAt: d.created_at || d.createdAt || new Date().toISOString(),
    }));

    saveCachedReferralCodes(remoteCodes);
    return remoteCodes;
  } catch (err) {
    console.warn('Supabase fetch referral codes notice:', err);
    return cached;
  }
};

export const createReferralCodeInSupabase = async (
  codeData: Omit<ReferralCode, 'id' | 'usesCount' | 'totalDiscountGiven' | 'createdAt'>
): Promise<ReferralCode> => {
  const cleanCode = codeData.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!cleanCode) {
    throw new Error('Please provide a valid code (e.g. AZMAN10).');
  }

  const newCode: ReferralCode = {
    id: `ref-${cleanCode.toLowerCase()}-${Date.now()}`,
    code: cleanCode,
    discountType: codeData.discountType,
    discountValue: Number(codeData.discountValue),
    active: Boolean(codeData.active),
    usesCount: 0,
    maxUses: codeData.maxUses ? Number(codeData.maxUses) : null,
    minOrderAmount: codeData.minOrderAmount ? Number(codeData.minOrderAmount) : null,
    totalDiscountGiven: 0,
    isCollectorReferral: Boolean(codeData.isCollectorReferral),
    creatorUid: codeData.creatorUid,
    creatorEmail: codeData.creatorEmail,
    creatorName: codeData.creatorName,
    createdAt: new Date().toISOString(),
  };

  // Update local cache
  const cached = getCachedReferralCodes();
  const existingIdx = cached.findIndex(c => c.code === cleanCode);
  if (existingIdx >= 0) {
    throw new Error(`Referral code "${cleanCode}" already exists.`);
  }
  const updated = [newCode, ...cached];
  saveCachedReferralCodes(updated);

  try {
    const payload = {
      code: cleanCode,
      discount_type: newCode.discountType,
      discount_value: newCode.discountValue,
      active: newCode.active,
      uses_count: 0,
      max_uses: newCode.maxUses,
      min_order_amount: newCode.minOrderAmount,
      total_discount_given: 0,
      is_collector_referral: newCode.isCollectorReferral,
      creator_uid: newCode.creatorUid,
      creator_email: newCode.creatorEmail,
      creator_name: newCode.creatorName,
      created_at: newCode.createdAt,
    };

    const { data, error } = await supabase.from('referral_codes').insert([payload]).select();
    if (error) {
      console.error('Supabase referral code insert error:', error.message);
      throw new Error(`Database error saving referral code: ${error.message}`);
    } else if (data && data[0]) {
      newCode.id = String(data[0].id);
    }
  } catch (err: any) {
    console.error('Supabase create referral code exception:', err);
    throw err instanceof Error ? err : new Error('Failed to save referral code in database.');
  }

  return newCode;
};

/**
 * Get or automatically provision a personalized collector referral code for a logged-in user
 */
export const getOrCreateCollectorReferralCode = async (userProfile: {
  uid: string;
  name?: string;
  email?: string;
}): Promise<ReferralCode> => {
  const codes = await fetchReferralCodesFromSupabase();
  // Check if this user already has a collector referral code
  const existing = codes.find(
    c => (c.creatorUid && c.creatorUid === userProfile.uid) ||
         (c.creatorEmail && userProfile.email && c.creatorEmail.toLowerCase() === userProfile.email.toLowerCase())
  );
  if (existing) {
    return existing;
  }

  // Generate unique code based on name or uid
  const baseName = (userProfile.name || userProfile.email?.split('@')[0] || 'GARAGE')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 6);
  const uidSuffix = (userProfile.uid || String(Date.now())).replace(/[^A-Z0-9]/gi, '').slice(-3).toUpperCase();
  let candidateCode = `${baseName}${uidSuffix || '10'}`;

  if (codes.some(c => c.code === candidateCode)) {
    candidateCode = `${baseName}${Math.floor(100 + Math.random() * 900)}`;
  }

  try {
    return await createReferralCodeInSupabase({
      code: candidateCode,
      discountType: 'percentage',
      discountValue: 10,
      active: true,
      maxUses: null,
      minOrderAmount: 0,
      isCollectorReferral: true,
      creatorUid: userProfile.uid,
      creatorEmail: userProfile.email,
      creatorName: userProfile.name,
    });
  } catch (e) {
    // If creation fails due to duplicate, try with random suffix
    candidateCode = `REDLINE${Math.floor(1000 + Math.random() * 9000)}`;
    return await createReferralCodeInSupabase({
      code: candidateCode,
      discountType: 'percentage',
      discountValue: 10,
      active: true,
      maxUses: null,
      minOrderAmount: 0,
      isCollectorReferral: true,
      creatorUid: userProfile.uid,
      creatorEmail: userProfile.email,
      creatorName: userProfile.name,
    });
  }
};

export const updateReferralCodeInSupabase = async (
  codeId: string,
  updates: Partial<ReferralCode>
): Promise<ReferralCode | null> => {
  const cached = getCachedReferralCodes();
  const target = cached.find(c => c.id === codeId || c.code === codeId);
  if (!target) return null;

  const updated: ReferralCode = {
    ...target,
    ...updates,
    code: updates.code ? updates.code.trim().toUpperCase() : target.code,
  };

  const newCached = cached.map(c => (c.id === target.id ? updated : c));
  saveCachedReferralCodes(newCached);

  try {
    const payload: Record<string, any> = {};
    if (updates.code !== undefined) payload.code = updated.code;
    if (updates.discountType !== undefined) payload.discount_type = updates.discountType;
    if (updates.discountValue !== undefined) payload.discount_value = Number(updates.discountValue);
    if (updates.active !== undefined) payload.active = Boolean(updates.active);
    if (updates.maxUses !== undefined) payload.max_uses = updates.maxUses ? Number(updates.maxUses) : null;
    if (updates.minOrderAmount !== undefined) payload.min_order_amount = updates.minOrderAmount ? Number(updates.minOrderAmount) : null;

    const isNumericId = /^\d+$/.test(target.id);
    const query = isNumericId
      ? supabase.from('referral_codes').update(payload).eq('id', Number(target.id))
      : supabase.from('referral_codes').update(payload).or(`id.eq.${target.id},code.eq.${target.code}`);

    const { error } = await query;
    if (error) {
      console.error('Supabase update referral code error:', error.message);
      throw new Error(`Failed to update referral code in database: ${error.message}`);
    }
  } catch (err: any) {
    console.error('Supabase update referral code exception:', err);
    throw err instanceof Error ? err : new Error('Failed to update referral code in database.');
  }

  return updated;
};

export const deleteReferralCodeInSupabase = async (codeId: string): Promise<void> => {
  const cached = getCachedReferralCodes();
  const target = cached.find(c => c.id === codeId || c.code === codeId);
  const targetCode = target?.code || codeId;
  const targetId = target?.id || codeId;

  const newCached = cached.filter(c => c.id !== codeId && c.code !== codeId);
  saveCachedReferralCodes(newCached);

  try {
    const isNumericId = /^\d+$/.test(targetId);
    const query = isNumericId
      ? supabase.from('referral_codes').delete().eq('id', Number(targetId))
      : supabase.from('referral_codes').delete().or(`id.eq.${targetId},code.eq.${targetCode}`);

    const { error } = await query;
    if (error) {
      console.error('Supabase delete referral code error:', error.message);
      throw new Error(`Failed to delete referral code in database: ${error.message}`);
    }
  } catch (err: any) {
    console.error('Supabase delete referral code exception:', err);
    throw err instanceof Error ? err : new Error('Failed to delete referral code in database.');
  }
};

export interface ValidateReferralResult {
  valid: boolean;
  code?: ReferralCode;
  discountAmount: number;
  discountDescription: string;
  errorMessage?: string;
}

export const validateReferralCode = async (
  codeStr: string,
  orderSubtotal: number
): Promise<ValidateReferralResult> => {
  const clean = codeStr.trim().toUpperCase();
  if (!clean) {
    return {
      valid: false,
      discountAmount: 0,
      discountDescription: '',
      errorMessage: 'Please enter a referral or discount code.',
    };
  }

  const allCodes = await fetchReferralCodesFromSupabase();
  const codeObj = allCodes.find(c => c.code === clean);

  if (!codeObj) {
    return {
      valid: false,
      discountAmount: 0,
      discountDescription: '',
      errorMessage: 'Invalid promo code. Please check spelling.',
    };
  }

  if (!codeObj.active) {
    return {
      valid: false,
      discountAmount: 0,
      discountDescription: '',
      errorMessage: 'This code is no longer valid.',
    };
  }

  if (codeObj.maxUses !== null && codeObj.maxUses !== undefined && codeObj.usesCount >= codeObj.maxUses) {
    return {
      valid: false,
      discountAmount: 0,
      discountDescription: '',
      errorMessage: 'This code has reached its maximum usage limit.',
    };
  }

  if (codeObj.minOrderAmount && orderSubtotal < codeObj.minOrderAmount) {
    return {
      valid: false,
      discountAmount: 0,
      discountDescription: '',
      errorMessage: `Minimum order of ₹${codeObj.minOrderAmount} required for this code.`,
    };
  }

  let discountAmount = 0;
  let discountDescription = '';

  if (codeObj.discountType === 'percentage') {
    discountAmount = Math.round((orderSubtotal * codeObj.discountValue) / 100);
    discountDescription = `${codeObj.discountValue}% OFF`;
  } else {
    discountAmount = Math.min(orderSubtotal, codeObj.discountValue);
    discountDescription = `₹${codeObj.discountValue} FLAT OFF`;
  }

  return {
    valid: true,
    code: codeObj,
    discountAmount,
    discountDescription,
  };
};

export const incrementReferralCodeUse = async (
  codeStr: string,
  discountGiven: number
): Promise<void> => {
  const clean = codeStr.trim().toUpperCase();
  if (!clean) return;

  const cached = getCachedReferralCodes();
  const target = cached.find(c => c.code === clean);
  if (target) {
    target.usesCount = (target.usesCount || 0) + 1;
    target.totalDiscountGiven = (target.totalDiscountGiven || 0) + discountGiven;
    saveCachedReferralCodes([...cached]);
  }

  try {
    // Attempt Supabase update
    const { data } = await supabase.from('referral_codes').select('uses_count, total_discount_given').eq('code', clean).maybeSingle();
    if (data) {
      await supabase
        .from('referral_codes')
        .update({
          uses_count: (data.uses_count || 0) + 1,
          total_discount_given: Number(data.total_discount_given || 0) + discountGiven,
        })
        .eq('code', clean);
    }
  } catch (err) {
    console.warn('Failed to increment referral code in Supabase:', err);
  }
};
