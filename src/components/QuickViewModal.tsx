import React, { useState } from 'react';
import { Product } from '../types';
import { saveOrderToSupabase } from '../supabase';
import { appendOrderToGoogleSheet } from '../googleSheets';
import {
  X,
  Star,
  ShoppingBag,
  PhoneCall,
  ShieldCheck,
  Truck,
  Sparkles,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity?: number, customization?: any) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [activeImage, setActiveImage] = useState<string>(
    product?.galleryImages?.[0] || product?.image || ''
  );
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [customDriverName, setCustomDriverName] = useState<string>('');
  const [customCarTitle, setCustomCarTitle] = useState<string>('');
  const [showCustomFields, setShowCustomFields] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Sync active image and reset modal state when product changes
  React.useEffect(() => {
    if (product) {
      setActiveImage(product.galleryImages?.[0] || product.image || '');
      setImageLoaded(false);
      setQuantity(1);
      setCustomDriverName('');
      setCustomCarTitle('');
      setShowCustomFields(false);
    }
  }, [product]);

  if (!product) return null;

  const isOutOfStock = product.stockCount !== undefined && product.stockCount <= 0;
  const isLowStock = product.stockCount !== undefined && product.stockCount > 0 && product.stockCount < 5;

  const totalPrice = product.price * quantity;

  const generateWhatsAppUrl = () => {
    let text = '';
    if (isOutOfStock) {
      text = encodeURIComponent(
        `Hello Redline Garage! 🚗💨\nI am inquiring about the SOLD OUT item *${product.name}* (₹${product.price.toFixed(2)}).\nPlease notify me when back in stock / waitlist!`
      );
    } else {
      let customDetails = '';
      if (customDriverName.trim() || customCarTitle.trim()) {
        customDetails = `\n• *Customization:* Driver: "${customDriverName.trim() || 'Standard'}", Card Title: "${customCarTitle.trim() || product.name}"`;
      }

      text = encodeURIComponent(
        `Hello Redline Garage! 🚗💨\nI would like to place a *Quick Order* for:\n\n` +
        `• *Product:* ${product.name}\n` +
        `• *Quantity:* ${quantity} unit(s)\n` +
        `• *Unit Price:* ₹${product.price.toFixed(2)}\n` +
        `• *Total Price:* ₹${totalPrice.toFixed(2)}\n` +
        `• *Scale:* ${product.collectorSpecs.scale}\n` +
        `• *Casting:* ${product.collectorSpecs.casting}\n` +
        `• *Series:* ${product.collectorSpecs.series}` +
        customDetails +
        `\n\nPlease confirm order availability and payment details!`
      );
    }
    return `https://wa.me/8431294886?text=${text}`;
  };

  const handleQuickOrderWhatsAppClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) {
      window.open(generateWhatsAppUrl(), '_blank');
      return;
    }

    const orderNum = `RG-${Math.floor(100000 + Math.random() * 900000)}`;
    const customization = customDriverName.trim() || customCarTitle.trim()
      ? {
          driverName: customDriverName.trim() || 'Collector',
          carTitle: customCarTitle.trim() || product.name,
          subtitle: product.category,
          cardTheme: 'classic',
          isAiStylized: false,
        }
      : undefined;

    const quickOrderPayload = {
      orderNumber: orderNum,
      customerName: customDriverName.trim() || 'WhatsApp Customer',
      customerPhone: 'Via WhatsApp Direct',
      customerAddress: 'To be confirmed on WhatsApp chat',
      items: [
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity,
          customization: customization || null,
        },
      ],
      subtotal: totalPrice,
      shipping: 0,
      total: totalPrice,
      paymentMethod: 'WhatsApp / COD',
    };

    try {
      await saveOrderToSupabase(quickOrderPayload);
      appendOrderToGoogleSheet(quickOrderPayload).catch(err =>
        console.warn('Google Sheets quick order append notice:', err)
      );
    } catch (err) {
      console.warn('Quick order Supabase save notice:', err);
    }

    window.open(generateWhatsAppUrl(), '_blank');
  };

  const handleAddCart = () => {
    if (isOutOfStock) return;
    const customization = customDriverName.trim() || customCarTitle.trim()
      ? {
          driverName: customDriverName.trim() || 'Collector',
          carTitle: customCarTitle.trim() || product.name,
          subtitle: product.category,
          cardTheme: 'classic',
          isAiStylized: false,
        }
      : undefined;

    onAddToCart(product, quantity, customization);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white border border-zinc-200 rounded-t-3xl sm:rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-8 relative text-left text-zinc-900 shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-full border border-zinc-200 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
          
          {/* Left Images with Progressive Loading & Contain/Cover Fitting */}
          <div className="space-y-3">
            <div className="relative aspect-4/3 sm:aspect-4/3 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-zinc-100 animate-pulse flex items-center justify-center text-zinc-300">
                  <ImageIcon className="w-8 h-8 opacity-40 animate-pulse" />
                </div>
              )}
              <img
                src={getOptimizedImageUrl(activeImage, { width: 800, quality: 80 })}
                alt={product.name}
                referrerPolicy="no-referrer"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                onLoad={() => setImageLoaded(true)}
                className={`w-full h-full object-contain p-2 transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              />
              
              {/* Badges Overlay */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                {isOutOfStock ? (
                  <span className="bg-zinc-900/95 text-white text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-md backdrop-blur-xs">
                    Sold Out
                  </span>
                ) : isLowStock ? (
                  <span className="bg-amber-500 text-zinc-950 text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1 shadow-xs animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Low Stock: Only {product.stockCount} left</span>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Gallery Thumbnails */}
            {product.galleryImages && product.galleryImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {product.galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setImageLoaded(false);
                      setActiveImage(img);
                    }}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 bg-zinc-50 flex items-center justify-center p-1 ${
                      activeImage === img
                        ? 'border-red-600 scale-105 shadow-xs ring-2 ring-red-100'
                        : 'border-zinc-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={getOptimizedImageUrl(img, { width: 120, height: 120, quality: 75 })}
                      alt={`${product.name} diecast view ${i + 1}`}
                      width={56}
                      height={56}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Direct Product Share Link */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  const shareOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://redlinegarage.store';
                  const shareUrl = `${shareOrigin}/?product=${encodeURIComponent(product.id)}`;
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }
                }}
                className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold transition-all cursor-pointer border px-3 py-1.5 rounded-lg ${
                  copiedLink
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                    : 'text-zinc-600 hover:text-red-600 bg-zinc-50 hover:bg-red-50 border-zinc-200 hover:border-red-200'
                }`}
              >
                <span>{copiedLink ? '✓' : '🔗'}</span>
                <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Direct Product Link'}</span>
              </button>
            </div>
          </div>

          {/* Right Info & Customization */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-600 uppercase">
                <span>{product.collectorSpecs.scale}</span>
                <span>•</span>
                <span>{product.category}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase italic font-sans text-zinc-900 leading-tight">
                {product.name}
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex text-amber-500 gap-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span className="font-bold text-zinc-900 ml-1">{product.rating}</span>
                </div>
                <span className="text-zinc-500 font-mono">({product.reviewsCount} collector reviews)</span>
              </div>
            </div>

            {/* Price & Quantity Strip */}
            <div className="flex items-center justify-between gap-3 bg-zinc-50 border border-zinc-200 p-3 rounded-2xl">
              <div>
                <div className="text-xs text-zinc-500 font-mono uppercase">Unit Price</div>
                <div className="text-xl font-black font-mono text-zinc-900 flex items-baseline gap-2">
                  <span>₹{product.price.toFixed(2)}</span>
                  {product.originalPrice && (
                    <span className="text-xs text-zinc-400 line-through font-mono">
                      ₹{product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Controls */}
              {!isOutOfStock && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-mono font-bold uppercase hidden sm:inline">Qty:</span>
                  <div className="flex items-center bg-white border border-zinc-300 rounded-xl overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 font-mono font-black text-sm text-zinc-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(product.stockCount || 10, quantity + 1))}
                      className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-zinc-600 font-normal leading-relaxed">
              {product.description}
            </p>

            {/* Collector Specs Box */}
            <div className="bg-zinc-50 rounded-xl p-3 text-xs font-mono space-y-1.5 border border-zinc-200">
              <div className="text-red-600 font-bold uppercase text-[11px] flex items-center justify-between">
                <span>🏁 Die-Cast Specifications</span>
                <span className="text-zinc-500 font-normal text-[10px]">{product.collectorSpecs.scale}</span>
              </div>
              <div className="text-zinc-700 flex justify-between text-[11px]">
                <span className="text-zinc-500">Casting:</span>
                <span className="font-semibold text-right max-w-[180px] truncate text-zinc-900">{product.collectorSpecs.casting}</span>
              </div>
              <div className="text-zinc-700 flex justify-between text-[11px]">
                <span className="text-zinc-500">Series:</span>
                <span className="text-zinc-900">{product.collectorSpecs.series}</span>
              </div>
              <div className="text-zinc-700 flex justify-between text-[11px]">
                <span className="text-zinc-500">Wheels:</span>
                <span className="text-zinc-900">{product.collectorSpecs.wheels}</span>
              </div>
            </div>

            {/* Optional Custom Card Blister Addon Toggle */}
            <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/50 space-y-2">
              <button
                type="button"
                onClick={() => setShowCustomFields(!showCustomFields)}
                className="w-full flex items-center justify-between text-xs font-mono font-bold text-zinc-800 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 text-red-600">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Custom Blister Card Personalization</span>
                </span>
                <span className="text-[11px] text-zinc-500 underline">
                  {showCustomFields ? 'Hide' : '+ Add Name/Title'}
                </span>
              </button>

              {showCustomFields && (
                <div className="space-y-2 pt-1 font-mono text-xs animate-fade-in">
                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 mb-0.5">
                      Driver / Collector Name
                    </label>
                    <input
                      type="text"
                      value={customDriverName}
                      onChange={(e) => setCustomDriverName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-white border border-zinc-200 rounded-lg p-2 text-xs focus:border-red-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 mb-0.5">
                      Card Subtitle / Date
                    </label>
                    <input
                      type="text"
                      value={customCarTitle}
                      onChange={(e) => setCustomCarTitle(e.target.value)}
                      placeholder="e.g. Birthday Edition • 2026"
                      className="w-full bg-white border border-zinc-200 rounded-lg p-2 text-xs focus:border-red-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Total Calculation Display */}
            {quantity > 1 && (
              <div className="flex justify-between items-center text-xs font-mono bg-zinc-100/80 px-3 py-1.5 rounded-lg text-zinc-700">
                <span>Total ({quantity} units):</span>
                <strong className="text-red-600 font-bold text-sm">₹{totalPrice.toFixed(2)}</strong>
              </div>
            )}

            {/* Actions: Add to Cart & Quick Order via WhatsApp */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-zinc-200">
              <button
                onClick={handleAddCart}
                disabled={isOutOfStock}
                className={`font-extrabold py-3 rounded-xl text-xs uppercase font-mono tracking-wider flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                  isOutOfStock
                    ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20 active:scale-95 cursor-pointer'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? 'Sold Out' : `Add To Cart (₹${totalPrice.toFixed(2)})`}</span>
              </button>

              <a
                href={generateWhatsAppUrl()}
                onClick={handleQuickOrderWhatsAppClick}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl text-xs uppercase font-mono tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 text-center min-h-[44px] cursor-pointer active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Quick Order via WhatsApp</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
