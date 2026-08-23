import React, { useState, useRef } from 'react';
import {
  Upload,
  Sparkles,
  CheckCircle2,
  ShoppingBag,
  PhoneCall,
  RefreshCw,
  Image as ImageIcon,
  Loader2,
  Wand2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Sparkle,
  Flame,
  Check,
  Tag,
  Car,
  Type,
} from 'lucide-react';
import { CustomCardConfig, Product } from '../types';
import { uploadImageToSupabase, saveOrderToSupabase } from '../supabase';
import { appendOrderToGoogleSheet } from '../googleSheets';
import { generateComicArtFilter } from '../utils/comicStylizer';

interface CustomCardBuilderProps {
  customCardProduct?: Product | null;
  onAddToCartWithCustomization: (product: Product, config: CustomCardConfig) => void;
}

export const CustomCardBuilder: React.FC<CustomCardBuilderProps> = ({
  customCardProduct,
  onAddToCartWithCustomization,
}) => {
  // Preset sample photo
  const defaultSamplePhoto =
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80';

  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string>(defaultSamplePhoto);
  const [aiStylizedPhotoUrl, setAiStylizedPhotoUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(defaultSamplePhoto);
  const [isAiStylized, setIsAiStylized] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Live editable fields requested
  const [driverName, setDriverName] = useState('ALEX & SARAH');
  const [carTitle, setCarTitle] = useState('NISSAN SKYLINE GT-R');
  const [cardSubtitle, setCardSubtitle] = useState('1ST ANNIVERSARY SPECIAL #01');
  const [collectorNumber, setCollectorNumber] = useState('243/250');
  const [cardTheme, setCardTheme] = useState<
    'classic-blue' | 'redline-racing' | 'midnight-black' | 'gold-edition' | 'ai-mainline'
  >('classic-blue');
  const [selectedCasting, setSelectedCasting] = useState('McLaren F1 Red Supercar');
  const [giftMessage, setGiftMessage] = useState('Happy Anniversary my love! Built for speed, wrapped forever.');
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Subtle 3D Hover Tilt & Specular Reflection State
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [glare, setGlare] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Upload Glow & Tactile Feedback State
  const [uploadGlow, setUploadGlow] = useState(false);
  const [justUploadedNotice, setJustUploadedNotice] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const glowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerUploadGlow = () => {
    setUploadGlow(true);
    setJustUploadedNotice(true);
    if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
    glowTimeoutRef.current = setTimeout(() => {
      setUploadGlow(false);
      setJustUploadedNotice(false);
    }, 2800);
  };

  // Mouse Move Tilt Calculation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Gentle, balanced tilt angles (max ~8-10 degrees)
    const rotateX = Number(((0.5 - y) * 12).toFixed(2));
    const rotateY = Number(((x - 0.5) * 12).toFixed(2));

    setTilt({ x: rotateX, y: rotateY });
    setGlare({ x: Number((x * 100).toFixed(1)), y: Number((y * 100).toFixed(1)), opacity: 0.35 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveProduct: Product = customCardProduct || {
    id: 'custom-card-personal',
    name: 'Custom Blister Card & Car',
    category: 'custom-cards',
    price: 699,
    originalPrice: 899,
    stockCount: 50,
    image: photoUrl || defaultSamplePhoto,
    shortTagline: 'Personalized Photo Card with Real Car',
    description: 'Custom photo card packaging with authentic die-cast vehicle sealed inside.',
    rating: 5.0,
    reviewsCount: 48,
    collectorSpecs: {
      casting: 'Custom Card Edition',
      scale: '1:64 Scale',
      series: 'Personalized Custom Series',
      wheels: 'Real Riders / Factory Special',
      cardCondition: 'Mint 400gsm Gloss Carded',
      authenticity: 'Official Redline Garage Custom',
    },
    giftFeatures: ['Custom Photo Front Art', 'Personalized Text', 'Sealed Blister Display Bubble'],
  };

  // Convert remote or blob URL to Base64
  const getBase64FromUrl = async (url: string): Promise<string> => {
    if (url.startsWith('data:image')) {
      return url;
    }
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('Direct fetch failed, returning URL as-is:', err);
      return url;
    }
  };

  // Process File upload helper
  const processUploadedFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setAiError('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const rawResult = reader.result as string;
      setOriginalPhotoUrl(rawResult);
      setPhotoUrl(rawResult);
      setIsAiStylized(false);
      setAiStylizedPhotoUrl(null);
      setAiError(null);
      triggerUploadGlow();

      if (cardTheme === 'ai-mainline') {
        handleGenerateAiMainline(rawResult);
      }
    };
    reader.readAsDataURL(file);

    try {
      setIsUploading(true);
      const uploadedUrl = await uploadImageToSupabase(file, 'products');
      if (uploadedUrl) {
        setOriginalPhotoUrl(uploadedUrl);
        if (!isAiStylized) {
          setPhotoUrl(uploadedUrl);
        }
        triggerUploadGlow();
      }
    } catch (err) {
      console.warn('Supabase storage card photo notice:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // AI Mainline Art Transformation Handler
  const handleGenerateAiMainline = async (targetPhotoUrl?: string) => {
    const photoToTransform = targetPhotoUrl || originalPhotoUrl || photoUrl;
    if (!photoToTransform) {
      setAiError('Please upload or select a photo first before generating AI artwork.');
      return;
    }

    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const base64Data = await getBase64FromUrl(photoToTransform);
      let generatedArtUrl: string | null = null;

      try {
        const res = await fetch('/api/gemini/stylize-card', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: base64Data,
            prompt:
              'Transform this uploaded photo into a stylized retro Hot Wheels mainline blister card packaging illustrated artwork. ' +
              'Art Style: Japanese manga and retro comic book style with clean bold dynamic ink linework, speed-lines, halftone dot textures, ' +
              'and glowing Hot Wheels brand color accents (vivid racing red, fiery orange, and golden yellow). ' +
              'The people or subjects in the photo should remain clearly recognizable as the hero illustration on the card backdrop.',
          }),
        });

        let data: any = null;
        try {
          const text = await res.text();
          data = JSON.parse(text);
        } catch {
          // Handled smoothly by local canvas comic filter fallback below
        }

        if (res.ok && data?.success && data?.imageUrl) {
          generatedArtUrl = data.imageUrl;
        }
      } catch (apiErr) {
        console.info('API request notice, using built-in comic stylizer fallback:', apiErr);
      }

      if (!generatedArtUrl) {
        generatedArtUrl = await generateComicArtFilter(photoToTransform);
      }

      if (generatedArtUrl) {
        setAiStylizedPhotoUrl(generatedArtUrl);
        setPhotoUrl(generatedArtUrl);
        setIsAiStylized(true);
        setCardTheme('ai-mainline');
        triggerUploadGlow();
      }
    } catch (err: any) {
      console.warn('Stylize fallback error:', err);
      try {
        const fallbackUrl = await generateComicArtFilter(photoToTransform);
        setAiStylizedPhotoUrl(fallbackUrl);
        setPhotoUrl(fallbackUrl);
        setIsAiStylized(true);
        setCardTheme('ai-mainline');
        triggerUploadGlow();
      } catch (finalErr: any) {
        setAiError('Could not process image filter. You can continue with your original photo.');
      }
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleRevertToOriginal = () => {
    setPhotoUrl(originalPhotoUrl);
    setIsAiStylized(false);
  };

  const handleThemeChange = (newTheme: typeof cardTheme) => {
    setCardTheme(newTheme);
    if (newTheme === 'ai-mainline') {
      if (aiStylizedPhotoUrl) {
        setPhotoUrl(aiStylizedPhotoUrl);
        setIsAiStylized(true);
      } else {
        handleGenerateAiMainline();
      }
    }
  };

  const handleAddToCart = () => {
    const config: CustomCardConfig = {
      photoUrl,
      originalPhotoUrl,
      aiStylizedPhotoUrl,
      isAiStylized,
      driverName: driverName.trim() || 'ALEX & SARAH',
      carTitle: carTitle.trim() || 'NISSAN SKYLINE GT-R',
      cardSubtitle: cardSubtitle.trim() || '1ST ANNIVERSARY SPECIAL #01',
      carColor: 'Red',
      cardTheme,
      giftMessage,
      selectedCasting,
    };
    onAddToCartWithCustomization(effectiveProduct, config);
    setIsSuccessMessage(true);
    setTimeout(() => setIsSuccessMessage(false), 3500);
  };

  const handleWhatsAppOrder = async () => {
    const customOrderId = `RG-CUST-${Math.floor(100000 + Math.random() * 900000)}`;
    const effectivePrice = effectiveProduct.price || 999;

    // Record order in Supabase with all required fields
    try {
      const customOrderPayload = {
        orderNumber: customOrderId,
        customerName: driverName.trim() || 'Custom Card Customer',
        customerPhone: 'WhatsApp Contact',
        customerAddress: 'To be confirmed on WhatsApp',
        items: [
          {
            productId: effectiveProduct.id,
            productName: `Custom Photo Card: ${carTitle.trim() || 'Die-Cast'} (${driverName.trim() || 'Collector'})`,
            price: effectivePrice,
            quantity: 1,
            customization: {
              photoUrl: aiStylizedPhotoUrl || originalPhotoUrl,
              isAiStylized,
              driverName: driverName.trim(),
              carTitle: carTitle.trim(),
              cardSubtitle: cardSubtitle.trim(),
              collectorNumber,
              carColor: 'Red',
              cardTheme,
              giftMessage,
              selectedCasting,
            },
          },
        ],
        subtotal: effectivePrice,
        shipping: 0,
        total: effectivePrice,
        paymentMethod: 'WhatsApp / COD',
        giftNote: giftMessage || undefined,
      };

      await saveOrderToSupabase(customOrderPayload);
      appendOrderToGoogleSheet(customOrderPayload).catch(e => console.warn('Custom card Google Sheets notice:', e));
    } catch (err) {
      console.warn('Custom card order save notice:', err);
    }

    const text = encodeURIComponent(
      `Hello Redline Garage! 🚗💨\nI created a Customized Photo Blister Card on your website [Order #${customOrderId}]:\n` +
      `- Recipient/Driver: ${driverName.trim() || 'ALEX & SARAH'}\n` +
      `- Car Model: ${carTitle.trim() || 'NISSAN SKYLINE GT-R'}\n` +
      `- Edition/Occasion: ${cardSubtitle.trim() || '1ST ANNIVERSARY SPECIAL #01'}\n` +
      `- Numbering: ${collectorNumber}\n` +
      `- Die-Cast Model: ${selectedCasting}\n` +
      `- Card Theme: ${cardTheme} ${isAiStylized ? '(✨ AI Mainline Comic Style)' : ''}\n` +
      `- Custom Back Note: ${giftMessage}\n\n` +
      `Photo is uploaded/ready to confirm!`
    );
    window.open(`https://wa.me/8431294886?text=${text}`, '_blank');
  };

  // Car visual icon / SVG render mapping for the 3D blister
  const getCarVisualGradient = (casting: string) => {
    if (casting.includes('Skyline') || casting.includes('Black')) return 'from-zinc-900 to-zinc-700';
    if (casting.includes('Porsche') || casting.includes('Silver')) return 'from-zinc-300 to-zinc-500';
    if (casting.includes('Muscle') || casting.includes('Yellow')) return 'from-amber-400 to-yellow-500';
    if (casting.includes('White')) return 'from-zinc-100 to-zinc-300';
    return 'from-red-600 to-red-800'; // Default Red McLaren
  };

  return (
    <section id="customizer" className="py-20 bg-zinc-50 text-zinc-900 relative border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-red-600 uppercase tracking-widest bg-red-50 px-3.5 py-1.5 rounded-full border border-red-200 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-red-600 animate-pulse" />
            <span>Interactive Custom Card Studio</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tight font-sans text-zinc-900">
            Custom Photo <span className="text-red-600">Blister Card</span> Creator
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base font-normal">
            Design your personalized die-cast blister card with your own photo, custom names, and collector packaging. Real-time live mockup below!
          </p>
        </div>

        {/* Studio Grid (Customization Controls on Left, Authentic Blister Mockup on Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* LEFT FORM CONTROLS */}
          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 space-y-6 text-left shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <h3 className="text-base sm:text-lg font-black uppercase italic font-sans text-zinc-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-red-600" />
                <span>Live Card Template Editor</span>
              </h3>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full font-bold uppercase">
                Instant Preview Mode
              </span>
            </div>

            {/* 1. PHOTO UPLOAD SECTION (Drag & Drop + File Picker) */}
            <div className="space-y-2.5">
              <label className="block text-xs font-mono font-bold uppercase text-zinc-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-red-600" />
                  <span>1. Card Front Photo (Replaces Mockup Placeholder)</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-normal">JPG, PNG, WEBP</span>
              </label>

              {/* Drag & Drop Box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-red-600 bg-red-50/50 scale-[1.01]'
                    : 'border-zinc-300 hover:border-red-500 bg-zinc-50/60 hover:bg-zinc-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shadow-xs text-red-600">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-xs font-bold font-mono text-zinc-800">
                    {isUploading ? 'Uploading & Processing Image...' : 'Click to Upload or Drag & Drop Photo Here'}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Couple portrait, solo photo, birthday celebrant, or car photo
                  </div>
                </div>
              </div>

              {/* Quick actions row */}
              <div className="flex items-center justify-between pt-1 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setOriginalPhotoUrl(defaultSamplePhoto);
                    setPhotoUrl(defaultSamplePhoto);
                    setIsAiStylized(false);
                    setAiStylizedPhotoUrl(null);
                    setAiError(null);
                    triggerUploadGlow();
                  }}
                  className="text-zinc-600 hover:text-zinc-900 underline flex items-center gap-1.5 cursor-pointer py-1"
                >
                  <RefreshCw className="w-3 h-3 text-zinc-500" />
                  <span>Reset to Sample Couple Photo</span>
                </button>

                {photoUrl && photoUrl !== defaultSamplePhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl(null);
                      setOriginalPhotoUrl('');
                    }}
                    className="text-red-600 hover:underline flex items-center gap-1 cursor-pointer py-1"
                  >
                    <span>Clear Photo (Show Placeholder)</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2. LIVE TEXT CUSTOMIZATION FIELDS */}
            <div className="space-y-4 pt-2 border-t border-zinc-100">
              <div className="text-xs font-mono font-bold uppercase text-zinc-800 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-red-600" />
                <span>2. Live Card Text Fields (Updated Instantly on Card)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Driver / Recipient Name */}
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-zinc-600 mb-1">
                    Driver / Recipient Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value.toUpperCase())}
                    placeholder="e.g. ALEX & SARAH"
                    maxLength={28}
                    className="w-full bg-zinc-50 border border-zinc-300 focus:border-red-600 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 font-mono font-bold uppercase focus:outline-hidden transition shadow-xs"
                  />
                  <span className="text-[9px] text-zinc-400 font-mono">Appears prominently across the card photo</span>
                </div>

                {/* Car Model Name */}
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-zinc-600 mb-1">
                    Car Model Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={carTitle}
                    onChange={(e) => setCarTitle(e.target.value.toUpperCase())}
                    placeholder="e.g. NISSAN SKYLINE GT-R"
                    maxLength={30}
                    className="w-full bg-zinc-50 border border-zinc-300 focus:border-red-600 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 font-mono font-bold uppercase focus:outline-hidden transition shadow-xs"
                  />
                  <span className="text-[9px] text-zinc-400 font-mono">Printed on bottom white blister base</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Edition / Occasion Text */}
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-zinc-600 mb-1">
                    Edition / Occasion Tagline
                  </label>
                  <input
                    type="text"
                    value={cardSubtitle}
                    onChange={(e) => setCardSubtitle(e.target.value.toUpperCase())}
                    placeholder="e.g. 1ST ANNIVERSARY SPECIAL #01"
                    maxLength={32}
                    className="w-full bg-zinc-50 border border-zinc-300 focus:border-red-600 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 font-mono focus:border-red-600 focus:outline-hidden transition shadow-xs"
                  />
                  <span className="text-[9px] text-zinc-400 font-mono">Series banner subtitle</span>
                </div>

                {/* Collector Numbering */}
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-zinc-600 mb-1">
                    Collector Number Stamp
                  </label>
                  <input
                    type="text"
                    value={collectorNumber}
                    onChange={(e) => setCollectorNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 243/250 or #01/99"
                    maxLength={12}
                    className="w-full bg-zinc-50 border border-zinc-300 focus:border-red-600 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 font-mono focus:border-red-600 focus:outline-hidden transition shadow-xs"
                  />
                  <span className="text-[9px] text-zinc-400 font-mono">Top-right blister card stamp</span>
                </div>
              </div>
            </div>

            {/* 3. CARD PACKAGING STYLE & DIECAST MODEL SELECTION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-zinc-600 mb-1">
                  Card Packaging Palette
                </label>
                <select
                  value={cardTheme}
                  onChange={(e) => handleThemeChange(e.target.value as any)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 font-mono focus:border-red-600 focus:outline-hidden transition shadow-xs"
                >
                  <option value="classic-blue">Classic Mainline (Electric Blue + Yellow Stripe)</option>
                  <option value="redline-racing">Redline Speed (Racing Red & Black)</option>
                  <option value="ai-mainline">✨ AI Comic Mainline Art Style</option>
                  <option value="midnight-black">Midnight Stealth Edition (Carbon Black)</option>
                  <option value="gold-edition">24K Gold Collector Edition</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-zinc-600 mb-1 flex items-center gap-1">
                  <Car className="w-3 h-3 text-red-600" />
                  <span>Sealed Die-Cast Vehicle</span>
                </label>
                <select
                  value={selectedCasting}
                  onChange={(e) => setSelectedCasting(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 font-mono focus:border-red-600 focus:outline-hidden transition shadow-xs"
                >
                  <option value="McLaren F1 Red Supercar">McLaren F1 Red Supercar</option>
                  <option value="Nissan Skyline GT-R Black JDM">Nissan Skyline GT-R (Black JDM)</option>
                  <option value="Porsche 911 GT3 RS Silver">Porsche 911 GT3 RS (Silver)</option>
                  <option value="American Muscle 1969 Yellow">American Muscle 1969 (Vibrant Yellow)</option>
                  <option value="Lamborghini Hypercar White">Lamborghini Hypercar (Polar White)</option>
                </select>
              </div>
            </div>

            {/* AI Comic Stylizer Optional Accordion */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-black uppercase font-mono text-amber-900">
                    AI Comic Mainline Art (Optional)
                  </span>
                </div>
                {isAiStylized && (
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-600">
                Transform your photo into dynamic comic ink linework with halftone textures and racing colors.
              </p>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {isGeneratingAi ? (
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-900 bg-amber-100 px-3 py-1.5 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    <span>Illustrating photo...</span>
                  </div>
                ) : !isAiStylized ? (
                  <button
                    type="button"
                    onClick={() => handleGenerateAiMainline()}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Generate AI Comic Style</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleGenerateAiMainline()}
                      className="bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 text-xs font-mono px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      Regenerate
                    </button>
                    <button
                      type="button"
                      onClick={handleRevertToOriginal}
                      className="bg-white hover:bg-zinc-100 text-zinc-600 text-xs font-mono px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      Revert to Original Photo
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Custom Printed Back Note */}
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-zinc-600 mb-1">
                Custom Printed Message on Back (Optional)
              </label>
              <textarea
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                rows={2}
                placeholder="Write a custom note to be printed on the reverse collector specs panel..."
                className="w-full bg-zinc-50 border border-zinc-300 focus:border-red-600 rounded-xl px-3.5 py-2 text-xs text-zinc-900 font-sans focus:outline-hidden transition shadow-xs"
              />
            </div>

            {/* Pricing & Submission Action Buttons */}
            <div className="pt-4 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-zinc-900">
                    ₹{effectiveProduct.price.toFixed(2)}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 line-through">
                    ₹{effectiveProduct.originalPrice?.toFixed(2) || '899.00'}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  ✓ High-Gloss 400gsm Blister Card + Real 1:64 Die-Cast + Crystal Case
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  id="add-custom-card-btn"
                  onClick={handleAddToCart}
                  className="flex-1 sm:flex-none bg-red-600 hover:bg-red-500 text-white font-extrabold px-6 py-3.5 rounded-xl text-xs uppercase font-mono tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/25 active:scale-95 cursor-pointer min-h-[44px]"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add To Cart</span>
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppOrder}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 p-3.5 rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shadow-xs"
                  title="Order via WhatsApp directly"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                </button>
              </div>
            </div>

            {isSuccessMessage && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono p-3 rounded-xl flex items-center gap-2 animate-fade-in shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Custom Card added to cart with your design! Check cart to place order.</span>
              </div>
            )}
          </div>

          {/* RIGHT AUTHENTIC DIE-CAST BLISTER CARD LIVE MOCKUP */}
          <div className="lg:col-span-5 sticky top-28 space-y-3">
            <div className="text-xs font-mono font-bold text-zinc-600 uppercase text-center flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              <span>Real-Time Live Packaging Preview</span>
            </div>

            {/* Tactile Upload Success Toast Pill */}
            {justUploadedNotice && (
              <div className="animate-badge-pop mx-auto w-fit bg-red-600 text-white text-[11px] font-mono font-bold px-3.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 border border-red-400">
                <Sparkles className="w-3 h-3 text-yellow-300 animate-spin" />
                <span>✨ Photo Applied & Card Preview Updated!</span>
              </div>
            )}

            {/* 3D Perspective Card Wrapper */}
            <div
              style={{ perspective: '1200px' }}
              className="relative w-full flex justify-center py-2"
            >
              {/* THE DIE-CAST BLISTER PACKAGING CARD (HOT WHEELS INSPIRED) */}
              <div
                id="blister-card-preview"
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`relative max-w-sm w-full mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 text-left select-none cursor-grab active:cursor-grabbing transform-gpu ${
                  uploadGlow
                    ? 'border-red-500 ring-4 ring-red-400/50'
                    : cardTheme === 'classic-blue'
                    ? 'border-zinc-300 bg-[#008fe3]'
                    : cardTheme === 'redline-racing'
                    ? 'border-red-600 bg-gradient-to-b from-red-600 via-zinc-950 to-black'
                    : cardTheme === 'midnight-black'
                    ? 'border-zinc-700 bg-gradient-to-b from-zinc-900 via-black to-zinc-950'
                    : cardTheme === 'gold-edition'
                    ? 'border-amber-400 bg-gradient-to-b from-amber-500 via-zinc-900 to-black'
                    : 'border-amber-400 bg-gradient-to-b from-amber-500 via-red-600 to-black'
                }`}
                style={{
                  transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${isHovered ? 1.025 : 1}, ${isHovered ? 1.025 : 1}, 1)`,
                  transition: isHovered
                    ? 'transform 0.12s ease-out, box-shadow 0.25s ease-out, border-color 0.3s ease-out'
                    : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s ease-out, border-color 0.3s ease-out',
                  boxShadow: uploadGlow
                    ? '0 30px 60px -10px rgba(220, 38, 38, 0.45), 0 0 35px rgba(239, 68, 68, 0.5)'
                    : isHovered
                    ? `${-tilt.y * 1.8}px ${25 + tilt.x * 1.5}px 45px -10px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.1)`
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                }}
              >
                {/* DYNAMIC SPECULAR FOIL & GLOSS REFLECTION OVERLAY */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-3xl z-40 transition-opacity duration-300"
                  style={{
                    opacity: glare.opacity,
                    background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 35%, transparent 70%)`,
                    mixBlendMode: 'overlay',
                  }}
                />

                {/* UPPER SECTION: SUNBURST BLUE CARD WITH FLAME BANNER & PHOTO */}
                <div
                  className={`relative p-3.5 pb-2 ${
                    cardTheme === 'classic-blue'
                      ? 'bg-gradient-to-b from-[#009bf2] via-[#0083cf] to-[#0074b7]'
                      : ''
                  }`}
                >
                  {/* Sunburst background rays pattern for classic blue */}
                  {cardTheme === 'classic-blue' && (
                    <div
                      className="absolute inset-0 opacity-25 pointer-events-none"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 50% 30%, transparent 20%, rgba(255,255,255,0.4) 21%, transparent 22%, transparent 40%, rgba(255,255,255,0.3) 41%, transparent 42%)',
                      }}
                    />
                  )}

                  {/* Top Header: Peg Hole Slot & Numbering */}
                  <div className="relative z-10 flex items-center justify-between mb-1.5">
                    <div className="w-12"></div>

                    {/* Standard Die-Cast Hanging Peg Hole Cutout */}
                    <div className="w-14 h-4 bg-zinc-900/90 border border-zinc-700/60 rounded-full mx-auto shadow-inner flex items-center justify-center">
                      <div className="w-6 h-1.5 bg-zinc-950 rounded-full"></div>
                    </div>

                    {/* Top-Right Collector Numbering */}
                    <div className="w-12 text-right">
                      <span className="text-[10px] font-black font-mono text-zinc-900 bg-white/90 px-1.5 py-0.5 rounded shadow-xs">
                        {collectorNumber || '243/250'}
                      </span>
                    </div>
                  </div>

                  {/* TOP DYNAMIC FLAME BANNER (Hot Wheels packaging style without trademarks) */}
                  <div className="relative z-10 mb-2.5 px-1">
                    <div className="relative flex items-center justify-center">
                      {/* Flame Ribbon Shape Background */}
                      <div className="w-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600 p-1 rounded-xl shadow-lg border-2 border-white transform -skew-x-6">
                        <div className="flex items-center justify-between px-2 py-0.5">
                          <div className="flex items-center gap-1">
                            <Flame className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
                            <span className="text-xs sm:text-sm font-black italic tracking-tighter uppercase font-sans text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] stroke-white">
                              REDLINE WHEELS
                            </span>
                          </div>
                          <span className="text-[8px] font-black tracking-widest uppercase font-mono text-white bg-black/40 px-1.5 py-0.5 rounded">
                            CUSTOM
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MAIN PHOTO ARTWORK AREA (WITH UPLOAD GLOW & "INSERT UR IMAGE" PLACEHOLDER) */}
                  <div
                    className={`relative aspect-4/3 rounded-2xl overflow-hidden border-2 transition-all duration-500 group bg-zinc-900 ${
                      uploadGlow
                        ? 'border-yellow-300 ring-4 ring-yellow-400/70 shadow-[0_0_30px_rgba(250,204,21,0.6)]'
                        : 'border-white shadow-xl'
                    }`}
                    style={{
                      boxShadow: uploadGlow
                        ? '0 0 35px rgba(250, 204, 21, 0.7), inset 0 2px 4px rgba(0,0,0,0.4)'
                        : 'inset 0 2px 4px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)',
                    }}
                  >
                    {/* Light Sheen Sweep Effect on Upload */}
                    {uploadGlow && (
                      <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-r from-transparent via-white/70 to-transparent animate-sheen-sweep" />
                      </div>
                    )}

                    {isGeneratingAi ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-amber-400 font-mono text-xs p-4 text-center space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                        <span className="font-bold">Illustrating Mainline Artwork...</span>
                      </div>
                    ) : photoUrl ? (
                      <>
                        <img
                          src={photoUrl}
                          alt="Custom Card Customer Photo"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* AI Style Pill Badge if active */}
                        {isAiStylized && (
                          <div className="absolute top-2 right-2 bg-black/85 backdrop-blur-md text-amber-300 border border-amber-500/60 rounded-md px-2 py-0.5 text-[9px] font-mono font-bold uppercase flex items-center gap-1 shadow-md z-20">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-spin" />
                            <span>AI Mainline Art</span>
                          </div>
                        )}

                        {/* Recipient / Driver Name Overlay Ribbon */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-2.5 pt-6 text-left z-20">
                          <div className="text-[9px] font-mono text-red-400 font-black tracking-widest uppercase flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" />
                            <span>DRIVER / RECIPIENT</span>
                          </div>
                          <div className="text-sm font-black italic uppercase text-white font-sans drop-shadow-md truncate">
                            {driverName || 'ALEX & SARAH'}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* The "INSERT UR IMAGE" Placeholder Area when empty */
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-950 p-4 text-center cursor-pointer hover:bg-zinc-800 transition relative"
                      >
                        {/* Frosted overlay badge exactly matching reference */}
                        <div className="bg-white/80 backdrop-blur-sm border-2 border-white text-zinc-900 px-6 py-4 rounded-2xl shadow-xl flex flex-col items-center gap-1">
                          <ImageIcon className="w-6 h-6 text-red-600 mb-0.5" />
                          <span className="text-sm font-black font-sans uppercase tracking-tight text-zinc-900">
                            INSERT
                          </span>
                          <span className="text-sm font-black font-sans uppercase tracking-tight text-red-600">
                            UR IMAGE
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 mt-2">
                          Click or drag photo here
                        </span>
                      </div>
                    )}

                    {/* Corner series badges matching packaging */}
                    <div className="absolute top-2 left-2 bg-yellow-400 text-zinc-950 font-black font-mono text-[9px] px-1.5 py-0.5 rounded shadow-md border border-yellow-200 z-20">
                      9/10
                    </div>
                  </div>

                  {/* Subtitle / Edition Line */}
                  <div className="mt-1.5 flex items-center justify-between text-white font-mono text-[10px] px-1">
                    <span className="text-yellow-300 font-black uppercase truncate max-w-[200px]">
                      {cardSubtitle || '1ST ANNIVERSARY SPECIAL #01'}
                    </span>
                    <span className="text-white/80 font-bold">1:64 SCALE</span>
                  </div>
                </div>

                {/* LOWER SECTION: CRISP WHITE PACKAGING BASE WITH 3D BLISTER BUBBLE & YELLOW STRIPE */}
                <div className="relative bg-white text-zinc-900 p-3 pt-2.5 flex">
                  
                  {/* Main Card Blister Area (Left 82%) */}
                  <div className="flex-1 pr-3 space-y-2">
                    
                    {/* REALISTIC 3D THERMOFORMED PLASTIC BLISTER BUBBLE */}
                    <div
                      className="relative h-20 rounded-xl bg-gradient-to-b from-white/95 via-zinc-100/90 to-zinc-200/90 border border-zinc-300 shadow-inner flex items-center justify-center overflow-hidden"
                      style={{
                        boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.12), 0 6px 12px -2px rgba(0,0,0,0.25)',
                      }}
                    >
                      {/* Blister Plastic Flange Seal Line */}
                      <div className="absolute inset-1 rounded-lg border border-white/80 pointer-events-none"></div>

                      {/* Plastic Glare Reflections with Dynamic Shift */}
                      <div
                        className="absolute -top-6 -left-6 w-28 h-28 bg-white/70 rotate-45 blur-xs pointer-events-none transition-transform duration-150"
                        style={{
                          transform: `translate(${tilt.y * 1.5}px, ${-tilt.x * 1.5}px) rotate(45deg)`,
                        }}
                      ></div>
                      <div
                        className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/50 rotate-45 blur-xs pointer-events-none transition-transform duration-150"
                        style={{
                          transform: `translate(${-tilt.y * 1.5}px, ${tilt.x * 1.5}px) rotate(45deg)`,
                        }}
                      ></div>

                      {/* 3D Die-Cast Car Visual Mock inside bubble */}
                      <div className="relative z-10 flex flex-col items-center justify-center text-center">
                        <div
                          className={`w-28 h-7 rounded-lg bg-gradient-to-r ${getCarVisualGradient(
                            selectedCasting
                          )} shadow-md flex items-center justify-between px-2 border border-white/30 transform -skew-x-12 transition-transform duration-200`}
                          style={{
                            transform: `translate(${tilt.y * 0.5}px, 0px) skewX(-12deg)`,
                          }}
                        >
                          {/* Front light mock */}
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 shadow-xs"></div>
                          {/* Roof cabin */}
                          <div className="w-12 h-3.5 bg-black/80 rounded-t-md mx-auto"></div>
                          {/* Rear light */}
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                        </div>

                        {/* Wheels & Ground Shadow */}
                        <div className="w-24 flex justify-between px-2 -mt-1.5">
                          <div className="w-3.5 h-3.5 rounded-full bg-zinc-900 border-2 border-zinc-400 shadow-xs flex items-center justify-center">
                            <div className="w-1 h-1 bg-white rounded-full"></div>
                          </div>
                          <div className="w-3.5 h-3.5 rounded-full bg-zinc-900 border-2 border-zinc-400 shadow-xs flex items-center justify-center">
                            <div className="w-1 h-1 bg-white rounded-full"></div>
                          </div>
                        </div>

                        <div className="text-[9px] font-mono font-bold text-zinc-600 mt-1 uppercase tracking-tight">
                          {selectedCasting}
                        </div>
                      </div>
                    </div>

                    {/* CAR TITLE PRINTED AT BOTTOM CENTER */}
                    <div className="text-center pt-0.5">
                      <div className="text-xs font-black font-sans uppercase tracking-tight text-zinc-900 truncate">
                        {carTitle || 'NISSAN SKYLINE GT-R'}
                      </div>
                    </div>

                    {/* Card Seal Stamps */}
                    <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 pt-0.5 border-t border-zinc-100">
                      <div className="flex items-center gap-1">
                        <div className="w-3.5 h-3.5 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-[6px]">
                          RL
                        </div>
                        <span className="font-bold text-zinc-700">AUTHENTIC DIE-CAST</span>
                      </div>
                      <span className="font-bold">3+</span>
                    </div>
                  </div>

                  {/* RIGHT VERTICAL YELLOW SERIES ACCENT STRIPE (MATCHING REFERENCE PACKAGING) */}
                  <div className="w-7 bg-yellow-400 rounded-r-xl -my-3 -mr-3 flex flex-col items-center justify-between py-3 border-l border-yellow-500/40 shadow-xs">
                    <span className="text-[7px] font-mono font-black text-zinc-900">#01</span>
                    
                    {/* Vertical Rotated Text */}
                    <div
                      className="font-black font-sans uppercase text-[10px] text-zinc-950 tracking-wider whitespace-nowrap"
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                      }}
                    >
                      HW: CUSTOM SERIES
                    </div>

                    <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive hint */}
            <div className="text-center">
              <span className="text-[10px] font-mono text-zinc-400 flex items-center justify-center gap-1">
                <span>🖱️ Hover & move cursor over packaging to tilt in 3D</span>
              </span>
            </div>

            {/* Quick Specs summary */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-3 text-xs font-mono text-zinc-600 space-y-1 shadow-xs text-left">
              <div className="flex justify-between">
                <span>Selected Casting:</span>
                <span className="font-bold text-zinc-900">{selectedCasting}</span>
              </div>
              <div className="flex justify-between">
                <span>Card Stock:</span>
                <span className="font-bold text-zinc-900">400gsm High Gloss Mint</span>
              </div>
              <div className="flex justify-between">
                <span>Display Packaging:</span>
                <span className="font-bold text-zinc-900">Hard Crystal Protective Case</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

