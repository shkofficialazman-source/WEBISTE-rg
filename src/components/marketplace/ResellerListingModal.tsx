import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  IndianRupee,
  Car,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ResellerCondition, ResellerListing } from '../../types';
import { createResellerListing, getMarketplaceSettings } from '../../marketplace';

interface ResellerListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListingCreated: (listing: ResellerListing) => void;
}

const SERIES_OPTIONS = [
  'Hot Wheels Mainline',
  'Car Culture / Premium',
  'Super Treasure Hunt ($TH)',
  'Treasure Hunt (TH)',
  'Red Line Club (RLC)',
  'Boulevard Series',
  'Fast & Furious',
  'Japan Historics',
  'Mini GT',
  'Kaido House',
  'Inno64',
  'Matchbox Collectors',
  'Other Rare Casting',
];

const CONDITION_OPTIONS: ResellerCondition[] = [
  'Carded - Mint',
  'Carded - Near Mint',
  'Carded - Soft Corners',
  'Loose - Mint',
  'Loose - Minor Wear',
  'Sealed Box / Multi-pack',
];

export const ResellerListingModal: React.FC<ResellerListingModalProps> = ({
  isOpen,
  onClose,
  onListingCreated,
}) => {
  const [step, setStep] = useState<'details' | 'reseller' | 'payment' | 'success'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step 1: Car details
  const [carName, setCarName] = useState('');
  const [castingModel, setCastingModel] = useState('');
  const [series, setSeries] = useState(SERIES_OPTIONS[0]);
  const [scale, setScale] = useState('1:64');
  const [condition, setCondition] = useState<ResellerCondition>(CONDITION_OPTIONS[0]);
  const [conditionDetails, setConditionDetails] = useState('');
  const [askingPrice, setAskingPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  // Step 2: Reseller contact info
  const [resellerName, setResellerName] = useState('');
  const [resellerPhone, setResellerPhone] = useState('');
  const [resellerEmail, setResellerEmail] = useState('');
  const [resellerCity, setResellerCity] = useState('');
  const [resellerInstagram, setResellerInstagram] = useState('');

  // Step 3: Fee payment
  const [listingFee, setListingFee] = useState<number>(99);
  const [upiId, setUpiId] = useState('shkofficialazman@okhdfcbank');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [paymentUtr, setPaymentUtr] = useState('');
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  // Load active fee settings on open
  React.useEffect(() => {
    if (isOpen) {
      getMarketplaceSettings().then(st => {
        setListingFee(st.listing_fee || 99);
        setUpiId(st.upi_id || 'shkofficialazman@okhdfcbank');
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const upiPayUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Redline Garage')}&am=${listingFee}&cu=INR&tn=${encodeURIComponent(`Listing Fee - ${carName || 'Hot Wheels'}`)}`;

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch (e) {}
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotos(prev => [...prev, reader.result as string].slice(0, 5));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPaymentScreenshotUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    if (!carName.trim()) {
      setErrorMessage('Please enter the Hot Wheels car name / casting.');
      return false;
    }
    if (!askingPrice || Number(askingPrice) <= 0) {
      setErrorMessage('Please enter a valid asking price (in ₹).');
      return false;
    }
    if (photos.length === 0) {
      setErrorMessage('Please upload at least 1 photo of the casting / card.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const validateStep2 = () => {
    if (!resellerName.trim()) {
      setErrorMessage('Please enter your full name or collector alias.');
      return false;
    }
    if (!resellerPhone.trim() || resellerPhone.length < 10) {
      setErrorMessage('Please enter a valid WhatsApp contact number (min 10 digits).');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handleSubmitListing = async () => {
    if (!paymentScreenshotUrl && !paymentUtr.trim()) {
      setErrorMessage('Please upload your UPI payment screenshot or enter your UTR / transaction ID.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const newListing = await createResellerListing({
        reseller_id: `reseller_${resellerPhone.replace(/\D/g, '') || Date.now()}`,
        reseller_name: resellerName.trim(),
        reseller_phone: resellerPhone.trim(),
        reseller_email: resellerEmail.trim() || undefined,
        reseller_city: resellerCity.trim() || undefined,
        reseller_instagram: resellerInstagram.trim() || undefined,
        is_verified_reseller: false,
        car_name: carName.trim(),
        casting_model: castingModel.trim() || undefined,
        series,
        scale,
        condition,
        condition_details: conditionDetails.trim() || undefined,
        asking_price: Number(askingPrice),
        photos,
        description: description.trim(),
        listing_fee_amount: listingFee,
        payment_screenshot_url: paymentScreenshotUrl || undefined,
        payment_utr: paymentUtr.trim() || undefined,
      });

      onListingCreated(newListing);
      setStep('success');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-zinc-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-zinc-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold shadow-md">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
                REDLINE GARAGE MARKETPLACE
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight uppercase">
                Sell Your Hot Wheels
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Pills */}
        {step !== 'success' && (
          <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs font-mono font-bold uppercase shrink-0">
            <div className={`flex items-center gap-1.5 ${step === 'details' ? 'text-red-600 font-black' : 'text-zinc-400'}`}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
              <span>Car Details</span>
            </div>
            <span className="text-zinc-300">→</span>
            <div className={`flex items-center gap-1.5 ${step === 'reseller' ? 'text-red-600 font-black' : 'text-zinc-400'}`}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
              <span>Your Info</span>
            </div>
            <span className="text-zinc-300">→</span>
            <div className={`flex items-center gap-1.5 ${step === 'payment' ? 'text-red-600 font-black' : 'text-zinc-400'}`}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
              <span>Listing Fee</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-bold text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: CAR DETAILS */}
          {step === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                  Car Name & Casting *
                </label>
                <input
                  type="text"
                  value={carName}
                  onChange={e => setCarName(e.target.value)}
                  placeholder="e.g. Nissan Skyline GT-R (R34) or '67 Camaro STH"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-600 focus:bg-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                    Series / Category
                  </label>
                  <select
                    value={series}
                    onChange={e => setSeries(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-600 outline-hidden cursor-pointer"
                  >
                    {SERIES_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                    Casting Sub-series / Line
                  </label>
                  <input
                    type="text"
                    value={castingModel}
                    onChange={e => setCastingModel(e.target.value)}
                    placeholder="e.g. Fast & Furious, Boulevard 2024"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                    Condition *
                  </label>
                  <select
                    value={condition}
                    onChange={e => setCondition(e.target.value as ResellerCondition)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-600 outline-hidden cursor-pointer"
                  >
                    {CONDITION_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                    Your Asking Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold font-mono">₹</span>
                    <input
                      type="number"
                      value={askingPrice}
                      onChange={e => setAskingPrice(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 1500"
                      className="w-full pl-8 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-black font-mono focus:ring-2 focus:ring-red-600 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                  Card & Blister Details
                </label>
                <input
                  type="text"
                  value={conditionDetails}
                  onChange={e => setConditionDetails(e.target.value)}
                  placeholder="e.g. Unpunched, Kar Keepers protector included, clean bubble"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                  Collector Notes & Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Tell buyers about this casting: where you got it, packaging safety, if you're open to trades..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-600 outline-hidden resize-none"
                />
              </div>

              {/* Photo Uploads */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                  Photos (Upload up to 5) *
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-300 bg-zinc-100 group">
                      <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full hover:bg-red-600 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {photos.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-zinc-300 hover:border-red-600 rounded-xl flex flex-col items-center justify-center p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50/40 transition cursor-pointer"
                    >
                      <Camera className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-mono font-bold uppercase">Add Photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: RESELLER INFO */}
          {step === 'reseller' && (
            <div className="space-y-4">
              <div className="p-3 bg-zinc-100 rounded-2xl text-xs text-zinc-600 font-sans leading-relaxed">
                <span className="font-bold text-zinc-900">Direct Negotiator Profile:</span> When buyers are interested, they will chat with you directly on Redline Garage using your name and contact details.
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                  Your Full Name or Collector Alias *
                </label>
                <input
                  type="text"
                  value={resellerName}
                  onChange={e => setResellerName(e.target.value)}
                  placeholder="e.g. Vikram Mehta (DieCastBangalore)"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                    WhatsApp / Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={resellerPhone}
                    onChange={e => setResellerPhone(e.target.value)}
                    placeholder="e.g. +91 98451 23456"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-600 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                    City & State
                  </label>
                  <input
                    type="text"
                    value={resellerCity}
                    onChange={e => setResellerCity(e.target.value)}
                    placeholder="e.g. Bangalore, Karnataka"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={resellerEmail}
                    onChange={e => setResellerEmail(e.target.value)}
                    placeholder="e.g. vikram.diecast@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                    Instagram Handle (Optional)
                  </label>
                  <input
                    type="text"
                    value={resellerInstagram}
                    onChange={e => setResellerInstagram(e.target.value)}
                    placeholder="e.g. @bangalore_diecast_vault"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-600 outline-hidden font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: LISTING FEE PAYMENT */}
          {step === 'payment' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center space-y-1">
                <div className="text-[10px] font-mono font-bold text-red-600 uppercase tracking-wider">
                  Redline Garage Listing Fee
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-zinc-950">
                  ₹{listingFee}
                </div>
                <p className="text-xs text-zinc-600 max-w-md mx-auto">
                  One-time listing facilitation fee for 30 days. You keep 100% of whatever final price you negotiate with buyers.
                </p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                <div className="p-2.5 bg-white rounded-xl shadow-xs border border-zinc-200">
                  <QRCodeSVG value={upiPayUri} size={150} level="H" includeMargin={false} />
                </div>

                <div className="space-y-3 text-center sm:text-left flex-1">
                  <div>
                    <div className="text-[10px] font-mono text-zinc-400 uppercase font-bold">UPI ID for Listing Fee</div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                      <span className="text-xs font-mono font-bold bg-white px-3 py-1.5 rounded-lg border border-zinc-200 select-all">
                        {upiId}
                      </span>
                      <button
                        onClick={handleCopyUpi}
                        className="p-1.5 text-zinc-500 hover:text-red-600 rounded-lg hover:bg-zinc-200 transition cursor-pointer"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500 leading-relaxed font-sans">
                    Scan using Google Pay, PhonePe, Paytm, or BHIM to pay ₹{listingFee}. Once paid, upload the screenshot or enter the 12-digit UTR below.
                  </p>
                </div>
              </div>

              {/* UTR Input */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                  UPI Ref / UTR Number
                </label>
                <input
                  type="text"
                  value={paymentUtr}
                  onChange={e => setPaymentUtr(e.target.value)}
                  placeholder="e.g. 428190384192 (12 digits)"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>

              {/* Payment Proof Upload */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                  Payment Screenshot Proof *
                </label>
                <input
                  type="file"
                  ref={proofInputRef}
                  onChange={handleProofUpload}
                  accept="image/*"
                  className="hidden"
                />

                {!paymentScreenshotUrl ? (
                  <div
                    onClick={() => proofInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-300 hover:border-red-600 rounded-2xl p-4 text-center cursor-pointer bg-zinc-50 hover:bg-red-50/30 transition flex flex-col items-center justify-center gap-1.5"
                  >
                    <Upload className="w-6 h-6 text-zinc-400 group-hover:text-red-600" />
                    <span className="text-xs font-bold text-zinc-700">Tap to upload payment screenshot</span>
                    <span className="text-[10px] text-zinc-400 font-mono">Supports JPG, PNG, WEBP</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <img
                      src={paymentScreenshotUrl}
                      alt="Payment proof"
                      className="w-14 h-14 object-cover rounded-lg border border-emerald-300 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-emerald-900">Payment Screenshot Attached</div>
                      <div className="text-[10px] text-emerald-700 font-mono">Ready for admin verification</div>
                      <button
                        type="button"
                        onClick={() => proofInputRef.current?.click()}
                        className="text-[10px] font-bold text-emerald-800 underline mt-1 cursor-pointer"
                      >
                        Replace Screenshot
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP: SUCCESS */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-zinc-900">
                  Listing Submitted for Verification!
                </h3>
                <p className="text-xs text-zinc-600 max-w-md mx-auto">
                  Your listing for <span className="font-bold text-zinc-900">{carName}</span> has been received. Our admin team will verify the ₹{listingFee} listing fee proof and activate your listing on the marketplace shortly.
                </p>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 max-w-md mx-auto text-left text-xs space-y-1.5 font-sans">
                <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>What happens next?</span>
                </div>
                <p className="text-zinc-600 leading-relaxed text-[11px]">
                  1. Admin confirms your UPI screenshot in the Admin Panel.<br />
                  2. Listing goes live on the public <strong className="text-zinc-800">Reseller Marketplace</strong> tab.<br />
                  3. Interested collectors will initiate live chats to negotiate and arrange shipping directly with you.
                </p>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs font-bold uppercase rounded-xl transition cursor-pointer shadow-md"
              >
                Close & Return to Marketplace
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Buttons */}
        {step !== 'success' && (
          <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between shrink-0">
            {step === 'details' ? (
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-mono font-bold uppercase text-zinc-500 hover:text-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => setStep(step === 'payment' ? 'reseller' : 'details')}
                className="px-4 py-2 text-xs font-mono font-bold uppercase text-zinc-600 hover:text-zinc-900 cursor-pointer"
              >
                ← Back
              </button>
            )}

            {step === 'details' && (
              <button
                onClick={() => {
                  if (validateStep1()) setStep('reseller');
                }}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase rounded-xl transition cursor-pointer shadow-md"
              >
                Next: Your Info →
              </button>
            )}

            {step === 'reseller' && (
              <button
                onClick={() => {
                  if (validateStep2()) setStep('payment');
                }}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase rounded-xl transition cursor-pointer shadow-md"
              >
                Next: Pay Listing Fee (₹{listingFee}) →
              </button>
            )}

            {step === 'payment' && (
              <button
                onClick={handleSubmitListing}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold uppercase rounded-xl transition cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting Listing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Listing for Review</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
