import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { saveOrderToSupabase } from '../supabase';
import {
  X,
  Star,
  ShoppingBag,
  PhoneCall,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Package,
  Share2
} from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { ResponsiveImage } from './ResponsiveImage';

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
    product?.galleryImages?.[0] || product?.image || product?.imageUrl || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [customDriverName, setCustomDriverName] = useState<string>('');
  const [customCarTitle, setCustomCarTitle] = useState<string>('');
  const [showCustomFields, setShowCustomFields] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  React.useEffect(() => {
    if (product) {
      setActiveImage(product.galleryImages?.[0] || product.image || product.imageUrl || '');
      setQuantity(1);
      setCustomDriverName('');
      setCustomCarTitle('');
      setShowCustomFields(false);
    }
  }, [product]);

  if (!product) return null;

  const isOutOfStock = product.stockCount !== undefined && product.stockCount <= 0;
  const totalPrice = product.price * quantity;

  const generateWhatsAppUrl = () => {
    let text = '';
    if (isOutOfStock) {
      text = encodeURIComponent(
        `Hello Redline Garage! I am inquiring about the SOLD OUT item ${product.name} (₹${product.price}). Please notify me when back in stock!`
      );
    } else {
      text = encodeURIComponent(
        `Hello Redline Garage! I would like to order:\n• Product: ${product.name}\n• Quantity: ${quantity}\n• Total: ₹${totalPrice}\n• Scale: ${product.collectorSpecs?.scale || '1:64'}\n• Series: ${product.series || 'Collector'}`
      );
    }
    return `https://wa.me/8431294886?text=${text}`;
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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ y: '100%', opacity: 0.9 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white border border-zinc-200 rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative text-left text-zinc-900 shadow-2xl z-10"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center z-10"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            
            {/* Image Gallery Column */}
            <div className="space-y-3">
              <div className="aspect-4/3 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-200 flex items-center justify-center p-2 relative">
                <ResponsiveImage
                  src={activeImage}
                  alt={product.name}
                  aspectRatio="auto"
                  priority={true}
                  objectFit="contain"
                  className="w-full h-full object-contain"
                />

                {isOutOfStock && (
                  <span className="absolute top-2 left-2 bg-zinc-950 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase z-10">
                    Sold Out
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {product.galleryImages && product.galleryImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {product.galleryImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(img)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border p-1 cursor-pointer bg-zinc-50 shrink-0 flex items-center justify-center ${
                        activeImage === img ? 'border-zinc-950 ring-1 ring-zinc-950' : 'border-zinc-200'
                      }`}
                    >
                      <ResponsiveImage
                        src={img}
                        alt=""
                        aspectRatio="auto"
                        objectFit="contain"
                        sizes="48px"
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Meta & Action Column */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                  {product.collectorSpecs?.scale || '1:64'} • {product.series || 'ARCHIVE'}
                </span>
                <h2 className="text-lg sm:text-xl font-display font-bold uppercase tracking-tight text-zinc-950 leading-snug">
                  {product.name}
                </h2>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-mono font-bold text-zinc-950">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs font-mono text-zinc-400 line-through">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-zinc-600 font-sans leading-relaxed">
                {product.description}
              </p>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between py-2 border-t border-b border-zinc-100">
                <span className="text-xs font-mono font-bold uppercase text-zinc-700">Quantity</span>
                <div className={`flex items-center gap-2 border border-zinc-300 rounded-lg p-1 bg-zinc-50 ${isOutOfStock ? 'opacity-50' : ''}`}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                    className={`p-1 text-zinc-600 hover:text-zinc-900 ${isOutOfStock ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-xs font-bold px-2">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={isOutOfStock}
                    className={`p-1 text-zinc-600 hover:text-zinc-900 ${isOutOfStock ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleAddCart}
                  disabled={isOutOfStock}
                  className={`w-full font-mono text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all min-h-[44px] cursor-pointer ${
                    isOutOfStock
                      ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                      : 'btn-press bg-zinc-950 hover:bg-zinc-800 text-white shadow-xs'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Sold Out' : `Add to Bag • ₹${totalPrice.toLocaleString('en-IN')}`}</span>
                </button>

                <a
                  href={generateWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-press w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 text-center min-h-[44px] cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                  <span>Order Directly on WhatsApp</span>
                </a>
              </div>

              {/* Guarantees */}
              <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> 100% Authentic
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3 text-zinc-700" /> Armored Packaging
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3 text-zinc-700" /> 24-48H Dispatch
                </span>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
