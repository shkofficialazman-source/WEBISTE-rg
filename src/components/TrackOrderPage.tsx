import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Search, 
  Package, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  Phone, 
  ShieldCheck, 
  MessageCircle, 
  ArrowRight,
  AlertCircle,
  Sparkles,
  MapPin,
  Car
} from 'lucide-react';
import { OrderTracking, TrackingStatus } from '../types';
import { fetchOrderTrackingByPhone, generateCourierTrackingLink } from '../supabase';
import { BRAND_WHATSAPP_NUMBER, BRAND_WHATSAPP_GROUP_URL } from '../brandAssets';

interface TrackOrderPageProps {
  onNavigate: (route: string) => void;
  initialPhone?: string;
}

const MILESTONES: { status: TrackingStatus; label: string; desc: string; icon: any }[] = [
  {
    status: 'Processing',
    label: 'Processing',
    desc: 'Order packed in armored box at Mangalore HQ',
    icon: Clock,
  },
  {
    status: 'Shipped',
    label: 'Dispatched',
    desc: 'Handed over to courier express logistics',
    icon: Truck,
  },
  {
    status: 'Out for Delivery',
    label: 'Out for Delivery',
    desc: 'With local courier agent for doorstep delivery',
    icon: MapPin,
  },
  {
    status: 'Delivered',
    label: 'Delivered',
    desc: 'Package safely delivered to collector',
    icon: CheckCircle2,
  },
];

const getMilestoneIndex = (status: string): number => {
  const s = (status || '').toLowerCase();
  if (s === 'delivered') return 3;
  if (s === 'out for delivery' || s === 'out_for_delivery') return 2;
  if (s === 'shipped' || s === 'in_transit' || s === 'in transit') return 1;
  return 0; // Processing
};

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ onNavigate, initialPhone = '' }) => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [trackingResults, setTrackingResults] = useState<OrderTracking[]>([]);
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-search if initial phone or query param exists
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const phoneParam = urlParams.get('phone') || initialPhone;
    if (phoneParam && phoneParam.trim().length >= 6) {
      setPhoneNumber(phoneParam);
      handleTrack(phoneParam);
    }
  }, [initialPhone]);

  const handleTrack = async (searchPhone = phoneNumber) => {
    const clean = searchPhone.replace(/[^0-9]/g, '');
    if (!clean || clean.length < 6) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const results = await fetchOrderTrackingByPhone(clean);
      setTrackingResults(results);
    } catch (err: any) {
      console.error('Tracking query error:', err);
      setErrorMessage(err.message || 'Unable to retrieve shipment information. Please try again.');
      setTrackingResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAwb = (awb: string) => {
    navigator.clipboard.writeText(awb);
    setCopiedAwb(awb);
    setTimeout(() => setCopiedAwb(null), 2000);
  };

  return (
    <div className="min-h-[85vh] bg-zinc-950 text-white font-sans selection:bg-red-600 selection:text-white py-8 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial from-red-600/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-32 right-10 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-8 sm:space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-red-950/80 border border-red-800/60 px-3.5 py-1.5 rounded-full text-red-400 text-xs font-mono font-bold tracking-widest uppercase shadow-sm">
            <Truck className="w-3.5 h-3.5 text-red-500" />
            <span>LIVE DISPATCH RADAR</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-mono">
            Track Your <span className="text-red-500">Order</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto font-sans">
            Enter your mobile number to view live consignment milestones, courier tracking IDs &amp; delivery status.
          </p>
        </div>

        {/* Phone Lookup Input Box */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack();
            }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-zinc-400 pointer-events-none font-mono text-sm font-bold">
                  <Phone className="w-4 h-4 text-red-500" />
                  <span className="text-zinc-500">+91</span>
                </div>
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-red-500 text-white rounded-2xl pl-20 pr-4 py-4 text-base sm:text-lg font-mono tracking-wider focus:outline-hidden transition-all shadow-inner placeholder:text-zinc-600 placeholder:text-sm placeholder:font-sans"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-mono font-bold text-sm sm:text-base uppercase tracking-wider px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 cursor-pointer disabled:opacity-50 min-h-[56px]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Locating...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Track Order</span>
                  </>
                )}
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-red-400 text-xs font-mono bg-red-950/40 border border-red-900/60 px-3.5 py-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </form>
        </div>

        {/* Results Area */}
        {hasSearched && !isLoading && (
          <div className="space-y-6">
            {trackingResults.length === 0 ? (
              /* Empty State: No active orders found */
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 sm:p-12 text-center space-y-5 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 text-zinc-500 flex items-center justify-center mx-auto border border-zinc-700/50">
                  <Package className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-mono uppercase text-white">
                    No Shipments Found For This Number
                  </h3>
                  <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                    We couldn't find an active dispatch matching <span className="text-white font-mono font-bold">{phoneNumber}</span>.
                  </p>
                </div>

                <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-2xl max-w-lg mx-auto text-left text-xs text-zinc-400 space-y-2 font-mono">
                  <div className="text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Helpful Tips:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-400">
                    <li>Ensure you entered the same 10-digit mobile number provided during checkout.</li>
                    <li>For orders placed within the last 12 hours, tracking links are generated right after packing.</li>
                    <li>If you made a payment via UPI screenshot, dispatch takes 24 hours.</li>
                  </ul>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={`https://wa.me/${BRAND_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Redline Garage! I am looking for tracking details for my order with phone: ${phoneNumber}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold uppercase px-5 py-3 rounded-xl transition-all shadow-md"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Ask Concierge on WhatsApp</span>
                  </a>

                  <button
                    onClick={() => onNavigate('scalemodels')}
                    className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white font-mono text-xs font-bold uppercase px-4 py-3 transition-colors cursor-pointer"
                  >
                    <span>Browse Scale Models</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Found Orders: Visual Card Tracker */
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                    Found {trackingResults.length} {trackingResults.length === 1 ? 'Shipment' : 'Shipments'}
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Sync Active
                  </span>
                </div>

                {trackingResults.map((item, idx) => {
                  const currentStepIdx = getMilestoneIndex(item.status);
                  const courier = item.courier_name || 'Express Dispatch';
                  const awb = item.tracking_id || item.order_id || '';
                  const trackingLink = item.tracking_link || generateCourierTrackingLink(courier, awb);

                  return (
                    <div
                      key={item.id || idx}
                      className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-6 sm:p-8 shadow-2xl transition-all relative overflow-hidden space-y-6"
                    >
                      {/* Top Bar: Order & Courier Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-zinc-800/80">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider bg-red-950 text-red-400 border border-red-900/60 px-2.5 py-0.5 rounded-full font-bold">
                              {item.order_id ? `Order #${item.order_id}` : 'Direct Vault Order'}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">
                              {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                            </span>
                          </div>
                          <div className="text-base font-bold font-mono text-white flex items-center gap-2">
                            <Truck className="w-4 h-4 text-sky-400" />
                            <span>{courier}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider ${
                              item.status === 'Delivered'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : item.status === 'Out for Delivery'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : item.status === 'Shipped'
                                ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                            {item.status}
                          </span>
                        </div>
                      </div>

                      {/* Visual 4-Step Milestone Progress Bar */}
                      <div className="py-4">
                        <div className="relative">
                          {/* Background Track Line */}
                          <div className="absolute top-5 left-6 right-6 h-1 bg-zinc-800 -translate-y-1/2 z-0 hidden sm:block" />
                          
                          {/* Active Progress Fill Line */}
                          <div
                            className="absolute top-5 left-6 h-1 bg-gradient-to-r from-red-600 via-sky-500 to-emerald-500 -translate-y-1/2 z-0 hidden sm:block transition-all duration-700"
                            style={{
                              width: `${(currentStepIdx / (MILESTONES.length - 1)) * 100}%`,
                              maxWidth: 'calc(100% - 48px)'
                            }}
                          />

                          {/* Step Nodes Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 relative z-10">
                            {MILESTONES.map((milestone, mIdx) => {
                              const isCompleted = mIdx < currentStepIdx;
                              const isCurrent = mIdx === currentStepIdx;
                              const isPending = mIdx > currentStepIdx;
                              const IconComponent = milestone.icon;

                              return (
                                <div
                                  key={milestone.status}
                                  className={`flex sm:flex-col items-center sm:items-center text-left sm:text-center gap-3.5 sm:gap-2 p-3 sm:p-0 rounded-2xl sm:rounded-none ${
                                    isCurrent ? 'bg-zinc-800/50 sm:bg-transparent border sm:border-0 border-zinc-700/60' : ''
                                  }`}
                                >
                                  {/* Node Circle */}
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold transition-all shadow-md ${
                                      isCompleted
                                        ? 'bg-emerald-600 text-white border-2 border-emerald-400'
                                        : isCurrent
                                        ? 'bg-red-600 text-white ring-4 ring-red-600/30 scale-110'
                                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                    }`}
                                  >
                                    {isCompleted ? (
                                      <Check className="w-5 h-5 stroke-[3]" />
                                    ) : (
                                      <IconComponent className="w-4 h-4" />
                                    )}
                                  </div>

                                  {/* Milestone Label & Subtext */}
                                  <div className="space-y-0.5">
                                    <div
                                      className={`font-mono text-xs font-bold uppercase tracking-wider ${
                                        isCurrent
                                          ? 'text-white'
                                          : isCompleted
                                          ? 'text-emerald-400'
                                          : 'text-zinc-500'
                                      }`}
                                    >
                                      {milestone.label}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 font-sans leading-tight hidden sm:block max-w-[140px] mx-auto">
                                      {milestone.desc}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Tracking ID & AWB Details */}
                      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold">
                            Consignment / AWB Tracking ID
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm sm:text-base font-black text-white bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
                              {item.tracking_id || item.order_id || 'Generating Consignment ID...'}
                            </span>
                            {item.tracking_id && (
                              <button
                                onClick={() => handleCopyAwb(item.tracking_id!)}
                                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                                title="Copy AWB Tracking Number"
                              >
                                {copiedAwb === item.tracking_id ? (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons: Direct Courier Link & WhatsApp */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {trackingLink ? (
                            <a
                              href={trackingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-mono text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow-lg shadow-red-600/20"
                            >
                              <span>Track on Courier Site</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <div className="text-xs text-zinc-500 font-mono">
                              Live courier portal link updating soon
                            </div>
                          )}

                          <a
                            href={`https://wa.me/${BRAND_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Redline Garage, I have a question regarding my order shipment ${item.order_id || item.tracking_id || ''} (Phone: ${item.customer_phone})`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 rounded-xl transition-colors shrink-0"
                            title="Help on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Quality & Packing Assurance Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-mono text-xs font-bold uppercase text-white">Armored Box Packaging</div>
              <div className="text-[11px] text-zinc-400 leading-snug">
                Every blister card &amp; collector casting is secured in bubble layers and corrugated armor boxes.
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-2xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-mono text-xs font-bold uppercase text-white">24H Dispatch Speed</div>
              <div className="text-[11px] text-zinc-400 leading-snug">
                Orders are verified and handed over to express courier partners within 24 hours of payment.
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-2xl flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-mono text-xs font-bold uppercase text-white">Concierge Desk</div>
              <div className="text-[11px] text-zinc-400 leading-snug">
                Need urgent delivery or address change? WhatsApp our pit crew anytime at +91 8431294886.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
