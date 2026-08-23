import { UserProfile, ReferralCode } from './types';
import { fetchReferralCodesFromSupabase, createReferralCodeInSupabase, saveCachedReferralCodes, getCachedReferralCodes } from './referrals';

const BIRTHDAY_DISMISSED_KEY = 'rg_bday_dismissed_v1';

/**
 * Checks whether today matches a user's date of birth (by Month & Day).
 * Optionally checks if within a 7-day birthday celebration window.
 */
export const isUserBirthday = (dobString?: string): { isBirthday: boolean; isBirthdayWeek: boolean } => {
  if (!dobString) return { isBirthday: false, isBirthdayWeek: false };

  try {
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return { isBirthday: false, isBirthdayWeek: false };

    const today = new Date();
    const isToday = dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();

    // Check if within 7 days after birthday
    const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    const diffMs = today.getTime() - thisYearBirthday.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const isBirthdayWeek = diffDays >= 0 && diffDays <= 7;

    return {
      isBirthday: isToday,
      isBirthdayWeek,
    };
  } catch {
    return { isBirthday: false, isBirthdayWeek: false };
  }
};

/**
 * Retrieves or automatically generates a single-use 20% Birthday Discount Code for a user.
 */
export const getOrCreateBirthdayDiscountCode = async (
  user: UserProfile
): Promise<ReferralCode | null> => {
  if (!user.dob) return null;

  const { isBirthdayWeek } = isUserBirthday(user.dob);
  if (!isBirthdayWeek) return null;

  try {
    const allCodes = await fetchReferralCodesFromSupabase();
    const currentYear = new Date().getFullYear();

    // 1. Check if user already has an active birthday code for this year
    const existingBirthdayCode = allCodes.find(
      c =>
        c.isBirthdayCode &&
        ((c.creatorUid && c.creatorUid === user.uid) ||
         (c.creatorEmail && user.email && c.creatorEmail.toLowerCase() === user.email.toLowerCase()) ||
         (c.recipientPhone && user.phone && c.recipientPhone === user.phone)) &&
        c.code.includes(String(currentYear))
    );

    if (existingBirthdayCode) {
      return existingBirthdayCode;
    }

    // 2. Generate a personalized, single-use 20% discount code
    const cleanName = (user.name || user.email.split('@')[0] || 'COLLECTOR')
      .replace(/[^A-Z0-9]/gi, '')
      .toUpperCase()
      .slice(0, 6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedCode = `BDAY20-${cleanName}-${randomSuffix}`;

    // Expires in 7 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    const newCode: Omit<ReferralCode, 'id' | 'usesCount' | 'totalDiscountGiven' | 'createdAt'> = {
      code: generatedCode,
      discountType: 'percentage',
      discountValue: 20, // 20% Birthday Discount
      active: true,
      maxUses: 1, // Single-use constraint
      minOrderAmount: 0,
      isCollectorReferral: false,
      isBirthdayCode: true,
      recipientPhone: user.phone,
      expiresAt: expiryDate.toISOString(),
      creatorUid: user.uid,
      creatorEmail: user.email,
      creatorName: `${user.name} (Birthday Code)`,
    };

    return await createReferralCodeInSupabase(newCode);
  } catch (err) {
    console.warn('Error creating birthday discount code:', err);
    return null;
  }
};

/**
 * Checks if the user already dismissed today's celebration popup in this session
 */
export const isBirthdayModalDismissed = (userId: string): boolean => {
  try {
    const raw = sessionStorage.getItem(`${BIRTHDAY_DISMISSED_KEY}_${userId}_${new Date().toDateString()}`);
    return raw === 'true';
  } catch {
    return false;
  }
};

export const markBirthdayModalDismissed = (userId: string) => {
  try {
    sessionStorage.setItem(`${BIRTHDAY_DISMISSED_KEY}_${userId}_${new Date().toDateString()}`, 'true');
  } catch (e) {
    // ignore
  }
};
