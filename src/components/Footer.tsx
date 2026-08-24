import React, { useState } from 'react';
import {
  Instagram,
  PhoneCall,
  Mail,
  MapPin,
  Flame,
  Sparkles,
  Send,
  Check,
  Copy,
  Tag,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Gift
} from 'lucide-react';
import { subscribeToNewsletterInFirestore } from '../firebase';
import { RedlineLogo } from './RedlineLogo';
import { BRAND_ASSETS, BRAND_NAME, BRAND_TAGLINE } from '../brandAssets';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
  onSelectCategory: (category: string) => void;
  onOpenAdmin?: () => void;
  onOpenMyOrders?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onSelectCategory, onOpenAdmin, onOpenMyOrders }) => {
  const [email, setEmail] = useState('');
  const [collectorName, setCollectorName] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['drops', 'discounts']);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [issuedCoupon, setIssuedCoupon] = useState('VIPGARAGE10');
  const [isCopied, setIsCopied] = useState(false);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setStatus('error');
      setFeedbackMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setFeedbackMessage('');

    try {
      // 1. Direct Firebase Firestore persistence
      const result = await subscribeToNewsletterInFirestore(
        cleanEmail,
        collectorName.trim(),
        'footer',
        selectedTopics
      );

      // 2. Also call backend API endpoint / webhook handler asynchronously
      try {
        fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            name: collectorName.trim(),
            source: 'footer',
            tags: selectedTopics,
          }),
        }).catch(apiErr => console.warn('Newsletter API sync note:', apiErr));
      } catch (err) {
        console.warn('Newsletter API fetch error:', err);
      }

      if (result.success) {
        setStatus('success');
        setIssuedCoupon(result.couponCode || 'VIPGARAGE10');
        setFeedbackMessage(result.message);
        setEmail('');
      } else {
        setStatus('error');
        setFeedbackMessage(result.message || 'Failed to subscribe. Please try again.');
      }
    } catch (err: any) {
      console.error('Subscription exception:', err);
      setStatus('error');
      setFeedbackMessage('Network issue. Please check your connection and try again.');
    }
  };

  const handleCopyCoupon = () => {
    if (!issuedCoupon) return;
    navigator.clipboard.writeText(issuedCoupon);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <footer className="bg-zinc-100 text-zinc-900 border-t border-zinc-200 relative">
      {/* Checkered Flag Accent Line */}
      <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-zinc-900"></div>

      {/* VIP Pit Pass Newsletter Subscription Section */}
      <div className="border-b border-zinc-200 bg-linear-to-b from-zinc-900 to-black text-white relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-700/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Value Proposition Left Column */}
            <div className="lg:col-span-6 space-y-3 text-left">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-mono font-semibold tracking-wide">
                <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span>VIP PIT PASS & DROP ALERTS</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono uppercase">
                Unlock Secret Drops & <span className="text-red-500">10% Off</span>
              </h3>
              <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
                Join 1,200+ Hot Wheels collectors across India. Get early access to rare Mainline restocks, personalized photo blister card drop announcements, and exclusive secret discount codes straight to your inbox.
              </p>

              {/* Topic Preference Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
                <span className="text-zinc-500 text-[11px]">Preferences:</span>
                <button
                  type="button"
                  onClick={() => toggleTopic('drops')}
                  className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    selectedTopics.includes('drops')
                      ? 'bg-red-950/80 border-red-500 text-red-300'
                      : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  ⚡ Mainline & TH Drops
                </button>
                <button
                  type="button"
                  onClick={() => toggleTopic('custom_cards')}
                  className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    selectedTopics.includes('custom_cards')
                      ? 'bg-red-950/80 border-red-500 text-red-300'
                      : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  🎁 Custom Cards & Frames
                </button>
                <button
                  type="button"
                  onClick={() => toggleTopic('discounts')}
                  className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    selectedTopics.includes('discounts')
                      ? 'bg-red-950/80 border-red-500 text-red-300'
                      : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  🎟️ Secret Promos
                </button>
              </div>
            </div>

            {/* Newsletter Form Right Column */}
            <div className="lg:col-span-6">
              {status === 'success' ? (
                <div className="bg-zinc-800/90 border border-emerald-500/40 rounded-2xl p-6 text-left space-y-4 shadow-xl backdrop-blur-sm animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white font-mono">
                        You're In the Pit Lane! 🏁
                      </h4>
                      <p className="text-xs text-zinc-300">
                        {feedbackMessage || 'Welcome to the Redline Garage VIP list.'}
                      </p>
                    </div>
                  </div>

                  {/* Coupon Unlocked Card */}
                  <div className="bg-black/60 border border-zinc-700 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <Tag className="w-3 h-3 text-red-400" />
                        <span>Your 10% Welcome Discount Code:</span>
                      </div>
                      <div className="text-lg font-black font-mono tracking-widest text-red-400">
                        {issuedCoupon}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCoupon}
                      className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>COPIED!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>COPY CODE</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Applies automatically on checkout
                    </span>
                    <button
                      type="button"
                      onClick={() => setStatus('idle')}
                      className="text-zinc-400 hover:text-white underline cursor-pointer"
                    >
                      Add another email
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  className="bg-zinc-800/80 border border-zinc-700/80 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm text-left space-y-4"
                >
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          value={collectorName}
                          onChange={(e) => setCollectorName(e.target.value)}
                          placeholder="Your Name (Optional)"
                          className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-red-500 transition-colors font-mono"
                        />
                      </div>
                      <div className="sm:col-span-7 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email address *"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-red-500 transition-colors font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full py-3 bg-red-600 hover:bg-red-500 active:scale-[0.99] disabled:opacity-50 text-white rounded-xl font-mono font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-red-950 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {status === 'loading' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>SUBSCRIBING...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-yellow-300" />
                          <span>JOIN VIP PIT PASS & GET 10% OFF</span>
                          <Send className="w-3.5 h-3.5 ml-1" />
                        </>
                      )}
                    </button>
                  </div>

                  {status === 'error' && (
                    <div className="flex items-center gap-2 text-red-400 text-xs font-mono bg-red-950/50 border border-red-800/60 p-2.5 rounded-lg">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{feedbackMessage}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Zero spam. Direct drops only.</span>
                    </span>
                    <span className="text-zinc-500">Unsubscribe in 1 click</span>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 text-left">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <RedlineLogo variant="full" theme="light" />
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-1">
                {BRAND_TAGLINE}
              </div>
            </div>

            <p className="text-xs text-zinc-600 font-normal leading-relaxed max-w-sm">
              Turning authentic Hot Wheels die-cast cars into unforgettable gifts, custom photo blister cards, and wall-mounted shadowbox frames. Built for speed, wrapped with love.
            </p>

            {/* Configurable Placeholders Notice Badge */}
            <div className="bg-white border border-zinc-200 rounded-xl p-3 text-[11px] font-mono text-zinc-600 space-y-1 shadow-xs">
              <div className="text-red-600 font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-red-600" />
                <span>Store Contact Info:</span>
              </div>
              <div className="text-[10px] text-zinc-500 space-y-0.5">
                <div>• Logo: <span className="text-zinc-800 font-medium">{BRAND_NAME}</span></div>
                <div>• WhatsApp: <span className="text-zinc-800 font-medium">{BRAND_ASSETS.storeContact.whatsapp}</span></div>
                <div>• Instagram: <a href={BRAND_ASSETS.storeContact.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-pink-600 font-medium hover:underline">{BRAND_ASSETS.storeContact.instagram}</a></div>
                <div>• Prices & Currency: <span className="text-zinc-800 font-medium">{BRAND_ASSETS.storeContact.currency} ({BRAND_ASSETS.storeContact.currencySymbol})</span></div>
              </div>
            </div>
          </div>

          {/* Quick Category Shortcuts */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-red-600 tracking-wider">
              Product Lineup
            </h4>
            <ul className="space-y-2 text-xs font-mono text-zinc-600">
              <li>
                <button 
                  onClick={() => { onSelectCategory('bouquets'); onNavigate('catalog'); }}
                  className="hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  Hot Wheels Bouquets
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { onSelectCategory('frames'); onNavigate('catalog'); }}
                  className="hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  Shadowbox Wall Frames
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { onSelectCategory('scale-models'); onNavigate('catalog'); }}
                  className="hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  Scale Model Box Sets
                </button>
              </li>
            </ul>
          </div>

          {/* Navigation Shortcuts */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-red-600 tracking-wider">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs font-mono text-zinc-600">
              <li>
                <button onClick={() => onNavigate('catalog')} className="hover:text-zinc-900 transition-colors cursor-pointer">
                  Full Catalog
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    if (onOpenMyOrders) onOpenMyOrders();
                  }} 
                  className="text-red-600 hover:text-red-700 font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Track My Order</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('categories')} className="hover:text-zinc-900 transition-colors cursor-pointer">
                  Product Categories
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('why-us')} className="hover:text-zinc-900 transition-colors cursor-pointer">
                  Why Choose Redline
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-zinc-900 transition-colors cursor-pointer">
                  FAQ & Care Guide
                </button>
              </li>
            </ul>
          </div>

          {/* Direct Concierge Contact Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-red-600 tracking-wider">
              Order Channels
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <a
                href="https://wa.me/8431294886"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                <PhoneCall className="w-4 h-4" />
                <span>WhatsApp (+91 8431294886)</span>
              </a>

              <a
                href="https://www.instagram.com/redline_.garage/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors"
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram (@redline_.garage)</span>
              </a>

              <a
                href="mailto:support@redlinegarage.com"
                className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                <Mail className="w-4 h-4 text-red-600" />
                <span>support@redlinegarage.com</span>
              </a>

              <div className="flex items-center gap-2 text-zinc-500 text-[11px] pt-1">
                <MapPin className="w-4 h-4 text-zinc-400" />
                <span>Global Express Shipping</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-500 gap-4">
          <div>
            {onOpenAdmin ? (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="text-zinc-500 hover:text-zinc-700 transition-colors cursor-default focus:outline-hidden"
                aria-label="Copyright"
              >
                ©
              </button>
            ) : (
              <span>©</span>
            )}{' '}
            {new Date().getFullYear()} Redline Garage. All rights reserved. Hot Wheels is a registered trademark of Mattel, Inc
            {onOpenAdmin ? (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="text-zinc-500 hover:text-zinc-700 transition-colors cursor-default focus:outline-hidden"
                aria-label="Admin Access"
              >
                .
              </button>
            ) : (
              <span>.</span>
            )}
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="hover:text-zinc-800 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-zinc-800 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-zinc-800 cursor-pointer">Return Policy</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
