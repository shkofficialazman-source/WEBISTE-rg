import React, { useState, useEffect } from 'react';
import { UserProfile, ReferralCode } from '../types';
import { getOrCreateCustomerReferralCode } from '../referrals';
import {
  Gift,
  Share2,
  Copy,
  Check,
  Flame,
  Sparkles,
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Users,
  Award,
  Percent,
} from 'lucide-react';

interface ReferralClubSectionProps {
  userProfile?: UserProfile | null;
  onOpenCart?: () => void;
}

export const ReferralClubSection: React.FC<ReferralClubSectionProps> = ({
  userProfile,
  onOpenCart,
}) => {
  const [customerName, setCustomerName] = useState<string>(userProfile?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(userProfile?.phone || '');
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (userProfile?.uid || userProfile?.phone) {
      if (userProfile.name) setCustomerName(userProfile.name);
      if (userProfile.phone) setCustomerPhone(userProfile.phone);
      generateCodeForUser({
        uid: userProfile.uid,
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone,
      });
    }
  }, [userProfile]);

  const generateCodeForUser = async (info: { uid?: string; name?: string; email?: string; phone?: string }) => {
    setIsGenerating(true);
    try {
      const code = await getOrCreateCustomerReferralCode(info);
      setReferralCode(code);
    } catch (e) {
      console.warn('Could not generate referral code:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() && !customerPhone.trim()) return;
    generateCodeForUser({
      uid: userProfile?.uid,
      name: customerName.trim() || 'Collector',
      email: userProfile?.email,
      phone: customerPhone.trim(),
    });
  };

  const activeCodeString = referralCode?.code || (customerName ? `VIP-${customerName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5)}-${Math.floor(100 + Math.random() * 900)}` : 'VIP-COLLECTOR-10');
  const shareableUrl = `${window.location.origin}?ref=${encodeURIComponent(activeCodeString)}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCodeString);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🚗💨 Hey fellow collector! Check out Redline Garage for 100% genuine Hot Wheels & diecast scale models in India.\n\n` +
      `Use my VIP Referral Code *${activeCodeString}* at checkout to get *10% OFF* your entire order!\n\n` +
      `👉 Shop here: ${shareableUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <section id="referrals" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white rounded-3xl p-6 sm:p-10 lg:p-12 border-2 border-red-600/30 relative overflow-hidden shadow-2xl">
        
        {/* Background decorative watermarks */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Heading & Perks */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600/20 to-amber-500/20 border border-red-500/40 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
              <Gift className="w-3.5 h-3.5 text-red-500 animate-bounce" />
              <span>Collector Referral Club</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-4xl font-black uppercase italic font-sans tracking-tight text-white">
                Share The Passion, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-red-500">
                  Give 10% & Earn VIP Rewards
                </span>
              </h2>
              <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-xl font-normal">
                Share your personal VIP referral code with friends, fellow diecast collectors, or car enthusiast groups. They get <strong>10% OFF</strong> their first order, and you unlock <strong>30 Loyalty Points</strong> on every completed purchase!
              </p>
            </div>

            {/* 3 Step Perk Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-2xl space-y-1.5">
                <div className="w-7 h-7 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center font-mono font-black text-xs">
                  1
                </div>
                <div className="text-xs font-bold text-white uppercase font-sans">
                  Get Your Code
                </div>
                <div className="text-[11px] text-zinc-400 font-normal leading-snug">
                  Generate your custom Hot Wheels referral code in 1-click.
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-2xl space-y-1.5">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-mono font-black text-xs">
                  2
                </div>
                <div className="text-xs font-bold text-white uppercase font-sans">
                  Friend Gets 10%
                </div>
                <div className="text-[11px] text-zinc-400 font-normal leading-snug">
                  Friend applies your code at checkout for instant savings.
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-2xl space-y-1.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-mono font-black text-xs">
                  3
                </div>
                <div className="text-xs font-bold text-white uppercase font-sans">
                  Earn VIP Points
                </div>
                <div className="text-[11px] text-zinc-400 font-normal leading-snug">
                  You automatically receive +30 bonus loyalty points.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Referral Code Card */}
          <div className="lg:col-span-5 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-700/80 rounded-3xl p-5 sm:p-7 text-left space-y-5 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500 fill-red-500" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
                  Your VIP Referral Card
                </span>
              </div>
              <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                10% OFF Code
              </span>
            </div>

            {/* Generated Code Box */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase text-zinc-400 font-bold">
                Personal Referral Code:
              </div>
              <div className="bg-zinc-950 border-2 border-red-500/40 rounded-2xl p-3 sm:p-4 flex items-center justify-between shadow-inner">
                <div>
                  <div className="font-mono font-black text-lg sm:text-xl tracking-wider text-white">
                    {activeCodeString}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400">
                    Gives 10% off at checkout
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition active:scale-95 shadow-md cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Actions: WhatsApp Share + Copy Link */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer min-h-[44px]"
              >
                <MessageCircle className="w-4 h-4 fill-white text-white" />
                <span>Share Code on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-3 px-4 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 border border-zinc-700 transition cursor-pointer min-h-[40px]"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Referral Link Copied!' : 'Copy Shareable Link'}</span>
              </button>
            </div>

            {/* If not logged in, prompt to customize name */}
            {!userProfile && (
              <form onSubmit={handleManualGenerate} className="pt-2 border-t border-zinc-800/80 space-y-2">
                <div className="text-[10px] font-mono text-zinc-400">
                  Customizing your code with your name:
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Your Name (e.g. Arjun)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-red-500 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer"
                  >
                    Update
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
