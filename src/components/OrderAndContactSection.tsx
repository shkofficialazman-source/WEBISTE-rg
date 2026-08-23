import React from 'react';
import { ShoppingBag, PhoneCall, Instagram, Mail, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

interface OrderAndContactSectionProps {
  onOpenCart: () => void;
}

export const OrderAndContactSection: React.FC<OrderAndContactSectionProps> = ({ onOpenCart }) => {
  return (
    <section className="py-20 bg-white text-zinc-900 relative border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-red-600 uppercase tracking-widest bg-red-50 px-3.5 py-1.5 rounded-full border border-red-200">
            <span>Frictionless Ordering</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tight font-sans text-zinc-900">
            How Would You Like To <span className="text-red-600">Order</span>?
          </h2>
          <p className="text-zinc-600 text-sm font-normal">
            We give you complete freedom. Complete your purchase right here on our website or order directly via WhatsApp or Instagram Concierge!
          </p>
        </div>

        {/* 2 Main Side-by-Side Ordering Channels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto mb-12 sm:mb-16">
          
          {/* Channel A: In-Site Express Checkout */}
          <div className="bg-zinc-50 border-2 border-red-600 rounded-3xl p-6 sm:p-8 text-left space-y-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold shadow-md shadow-red-600/30">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-red-600 uppercase">METHOD #1</span>
                <h3 className="text-2xl font-black uppercase italic font-sans text-zinc-900">
                  Buy Online via Website
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal">
                Add products to cart, upload your custom photo directly, select payment method (Credit Card, Debit, Apple Pay, UPI, or COD), and receive instant order confirmation tracking!
              </p>
              <ul className="text-xs font-mono text-zinc-600 space-y-2">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Instant order confirmation
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Upload photos directly in cart
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Cash on Delivery available
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenCart}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold py-4 rounded-xl text-xs uppercase font-mono tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-red-600/20 active:scale-95 cursor-pointer min-h-[48px]"
            >
              <span>Open Shopping Cart & Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Channel B: WhatsApp Concierge Order */}
          <div className="bg-zinc-50 border border-green-300 hover:border-green-500 rounded-3xl p-6 sm:p-8 text-left space-y-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-green-600 text-white flex items-center justify-center font-bold shadow-md shadow-green-600/30">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-green-700 uppercase">METHOD #2</span>
                <h3 className="text-2xl font-black uppercase italic font-sans text-zinc-900">
                  Order via WhatsApp Concierge
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal">
                Chat directly with our team! Send us your custom photo, ask questions about specific Hot Wheels castings, or request custom gift packaging notes in real time.
              </p>
              <ul className="text-xs font-mono text-zinc-600 space-y-2">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Direct human assistance
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Send photos straight in chat
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Custom car model requests
                </li>
              </ul>
            </div>

            <a
              href="https://wa.me/8431294886?text=Hi%20Redline%20Garage!%20I'd%20like%20to%20place%20an%20order%20directly."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-600 hover:bg-green-500 text-white font-extrabold py-4 rounded-xl text-xs uppercase font-mono tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-green-600/20 active:scale-95 min-h-[48px]"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Chat on WhatsApp (+91 8431294886)</span>
            </a>
          </div>

        </div>

        {/* Contact Info Footer Grid */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs font-mono text-zinc-600">
          <div className="flex flex-col items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-600" />
            <span className="font-bold text-zinc-900 uppercase">Instagram DM Order</span>
            <a href="https://www.instagram.com/redline_.garage/" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-900 underline">
              @redline_.garage
            </a>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Mail className="w-5 h-5 text-red-600" />
            <span className="font-bold text-zinc-900 uppercase">Email Support</span>
            <a href="mailto:support@redlinegarage.com" className="text-zinc-600 hover:text-zinc-900 underline">
              support@redlinegarage.com [PLACEHOLDER]
            </a>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-zinc-900 uppercase">Garage Hours</span>
            <span className="text-zinc-600">Mon - Sat: 9:00 AM - 9:00 PM</span>
          </div>
        </div>

      </div>
    </section>
  );
};
