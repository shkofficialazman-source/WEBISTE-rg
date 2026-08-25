import React, { useState, useEffect } from 'react';
import { UserProfile, ReferralCode } from '../types';
import { getOrCreateCollectorReferralCode } from '../referrals';
import {
  Gift,
  Share2,
  Copy,
  Check,
  Sparkles,
  Users,
  Award,
  IndianRupee,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface ReferCollectorSectionProps {
  userProfile: UserProfile | null;
  onOpenCustomerLogin?: () => void;
}

export const ReferCollectorSection: React.FC<ReferCollectorSectionProps> = ({
  userProfile,
  onOpenCustomerLogin,
}) => {
  const [referralCodeObj, setReferralCodeObj] = useState<ReferralCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setLoading(true);
      getOrCreateCollectorReferralCode(userProfile)
        .then((code) => setReferralCodeObj(code))
        .catch((err) => console.warn('Collector referral code load error:', err))
        .finally(() => setLoading(false));
    }
  }, [userProfile]);

  const referralCode = referralCodeObj?.code || 'GARAGE10';
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${referralCode}` : `https://redlinegarage.store/?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `Hey fellow Collector! 🚗💨\nCheck out Redline Garage for custom Hot Wheels cards, blister frames, and rare die-cast models.\n\n` +
      `Use my collector referral code *${referralCode}* to get *10% OFF* your first custom build!\n\n` +
      `Shop here: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  if (!userProfile) {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 text-center space-y-4 font-mono">
        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <Gift className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-zinc-900 uppercase">
            Join the Collector Referral Program
          </h4>
          <p className="text-xs text-zinc-600 max-w-sm mx-auto font-sans leading-relaxed">
            Log in or create a collector account to generate your personal referral link. Give friends 10% OFF and earn rewards on every order!
          </p>
        </div>
        {onOpenCustomerLogin && (
          <button
            onClick={onOpenCustomerLogin}
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase cursor-pointer shadow-md shadow-red-600/20 transition-all min-h-[44px]"
          >
            Sign In / Create Account
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 text-left font-mono">
      {/* Referral Hero Banner */}
      <div className="bg-gradient-to-br from-red-600 via-red-700 to-zinc-900 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Collector VIP Rewards</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black uppercase italic tracking-tight font-sans">
            Give 10% Off, Grow the Garage
          </h3>
          <p className="text-xs text-zinc-200 font-sans leading-relaxed max-w-md">
            Share your unique collector code with friends, car enthusiasts, or die-cast clubs. When they order with your link, they receive an instant 10% discount!
          </p>
        </div>
      </div>

      {/* Referral Code & Link Box */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="space-y-1">
          <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
            Your Unique Collector Code
          </div>
          <div className="flex items-center justify-between gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
            <span className="font-black text-base text-zinc-900 tracking-wider">
              {loading ? 'GENERATING...' : referralCode}
            </span>
            <button
              onClick={handleCopyCode}
              disabled={loading}
              className="bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[36px]"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Shareable Link */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
            One-Tap Referral URL
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-600 truncate focus:outline-hidden"
            />
            <button
              onClick={handleCopyLink}
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[40px] shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* WhatsApp Quick Share Button */}
        <button
          onClick={handleShareWhatsApp}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer min-h-[44px]"
        >
          <MessageSquare className="w-4 h-4 fill-white" />
          <span>Share with Friends on WhatsApp</span>
        </button>
      </div>

      {/* Referral Performance Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase font-bold">Friends Used</div>
          <div className="text-lg font-black text-zinc-900">
            {referralCodeObj?.usesCount || 0}
          </div>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase font-bold">Discount Rate</div>
          <div className="text-lg font-black text-emerald-600">
            {referralCodeObj?.discountValue || 10}% OFF
          </div>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase font-bold">Savings Given</div>
          <div className="text-lg font-black text-red-600">
            ₹{referralCodeObj?.totalDiscountGiven || 0}
          </div>
        </div>
      </div>

      {/* How It Works Steps */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3 font-sans">
        <div className="text-xs font-bold uppercase text-zinc-800 tracking-wider font-mono">
          How Collector Referrals Work
        </div>
        <div className="space-y-2 text-xs text-zinc-600">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <span>Send your referral link or code to your car enthusiast friends.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <span>They apply your code at checkout and instantly save 10% on custom cards or models.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <span>Your referral count updates automatically in your collector account!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
