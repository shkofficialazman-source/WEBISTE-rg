import React, { useState, useEffect } from 'react';
import { UserProfile, ReferralCode } from '../types';
import { isUserBirthday, getOrCreateBirthdayDiscountCode, isBirthdayModalDismissed, markBirthdayModalDismissed } from '../birthdayDiscounts';
import { Gift, Sparkles, Copy, Check, X, Cake, ShoppingCart, Share2, PartyPopper } from 'lucide-react';

interface BirthdayCelebrationModalProps {
  userProfile: UserProfile | null;
  onApplyCode?: (code: string) => void;
}

export const BirthdayCelebrationModal: React.FC<BirthdayCelebrationModalProps> = ({ userProfile, onApplyCode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [birthdayCode, setBirthdayCode] = useState<ReferralCode | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userProfile || !userProfile.dob) return;

    const { isBirthday, isBirthdayWeek } = isUserBirthday(userProfile.dob);
    if (!isBirthdayWeek) return;

    // Check if already dismissed this session
    if (isBirthdayModalDismissed(userProfile.uid)) return;

    setIsLoading(true);
    getOrCreateBirthdayDiscountCode(userProfile).then((codeObj) => {
      if (codeObj) {
        setBirthdayCode(codeObj);
        setIsOpen(true);
      }
      setIsLoading(false);
    }).catch(err => {
      console.warn('Birthday code check notice:', err);
      setIsLoading(false);
    });
  }, [userProfile]);

  if (!isOpen || !birthdayCode) return null;

  const handleClose = () => {
    if (userProfile?.uid) {
      markBirthdayModalDismissed(userProfile.uid);
    }
    setIsOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(birthdayCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const msg = `🎂 Celebrating my birthday with Redline Garage! 🚗💨\nGot an exclusive 20% OFF coupon code: *${birthdayCode.code}* valid on premium Hot Wheels & custom blister packs! Check out their showroom at https://redlinegarage.shop`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleApplyToCart = () => {
    if (onApplyCode) {
      onApplyCode(birthdayCode.code);
    }
    handleCopy();
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="bg-white border-2 border-red-600 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center space-y-5">
        
        {/* Festive Background Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-700 p-1 rounded-full hover:bg-zinc-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Birthday Icon Header */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 border-2 border-red-200 rounded-2xl text-red-600 shadow-lg shadow-red-600/10 relative">
          <Cake className="w-8 h-8 text-red-600 animate-bounce" />
          <span className="absolute -top-1 -right-1 text-sm">🎉</span>
        </div>

        {/* Title & Greeting */}
        <div className="space-y-1">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-red-600">
            Exclusive Birthday Gift
          </div>
          <h3 className="text-2xl font-black font-mono uppercase tracking-tight text-zinc-900">
            Happy Birthday, {userProfile?.name?.split(' ')[0] || 'Collector'}! 🏎️🎂
          </h3>
          <p className="text-xs text-zinc-600 font-sans leading-relaxed">
            The Redline Garage team wishes you the best year of collecting! Enjoy an exclusive <strong className="text-red-600 font-bold">20% discount</strong> on your birthday order.
          </p>
        </div>

        {/* Coupon Code Presentation Box */}
        <div className="bg-zinc-950 text-white rounded-2xl p-5 border border-zinc-800 space-y-3 shadow-inner">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest flex items-center justify-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Single-Use 20% Discount Code</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 flex items-center justify-between gap-2">
            <span className="font-mono font-black text-lg sm:text-xl text-red-500 tracking-wider select-all">
              {birthdayCode.code}
            </span>
            <button
              onClick={handleCopy}
              className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer shrink-0"
              title="Copy code to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-white" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="text-[10px] font-mono text-zinc-500">
            Valid for 7 days across all die-cast bouquets & custom cards.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            onClick={handleApplyToCart}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-extrabold uppercase py-3 px-4 rounded-xl transition shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Apply & Start Shopping</span>
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-mono text-xs font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-200"
            title="Share with friends"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span>Share</span>
          </button>
        </div>

      </div>
    </div>
  );
};
