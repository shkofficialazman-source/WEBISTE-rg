import React, { useState, useEffect } from 'react';
import { FirestoreOrder, UserProfile } from '../types';
import { fetchOrdersByPhoneFromSupabase, cancelOrderInSupabaseAndRestoreStock } from '../supabase';
import { getCourierTrackingUrl } from './CustomerOrdersModal';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Sparkles,
  Copy,
  Check,
  Search,
  CheckCheck,
  Calendar,
  Navigation,
  Phone,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CreditCard,
  MessageCircle,
  FileText,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { InvoiceModal } from './InvoiceModal';
import { OrderStatusChip } from './admin/OrderStatusChip';

interface OrderHistoryStatusProps {
  orders?: FirestoreOrder[];
  userProfile?: UserProfile | null;
  loading?: boolean;
  onRefresh?: () => void;
}

const SAVED_PHONE_KEY = 'redline_garage_customer_phone';

export const OrderHistoryStatus: React.FC<OrderHistoryStatusProps> = ({
  orders: propOrders = [],
  userProfile,
  loading: propLoading = false,
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>(() => {
    return localStorage.getItem(SAVED_PHONE_KEY) || '';
  });
  const [phoneInput, setPhoneInput] = useState<string>(() => {
    return localStorage.getItem(SAVED_PHONE_KEY) || '';
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [liveOrders, setLiveOrders] = useState<FirestoreOrder[]>(propOrders);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(propLoading));
  const [queryError, setQueryError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(Boolean(phoneNumber || (propOrders && propOrders.length > 0)));

  const [filterMode, setFilterMode] = useState<'all' | 'tracked' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<FirestoreOrder | null>(null);

  // Perform live query from Supabase
  const executePhoneLookup = async (phoneToQuery: string) => {
    const cleaned = phoneToQuery.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setPhoneError(null);
    setQueryError(null);
    setIsLoading(true);
    setHasSearched(true);

    try {
      localStorage.setItem(SAVED_PHONE_KEY, cleaned.slice(-10));
      setPhoneNumber(cleaned.slice(-10));

      const result = await fetchOrdersByPhoneFromSupabase(cleaned);
      if (result.success) {
        setLiveOrders(result.orders);
        if (result.orders.length > 0) {
          setExpandedOrderId(result.orders[0].orderNumber || result.orders[0].id);
        }
      } else {
        setQueryError(result.error || 'Failed to retrieve orders. Please check your connection and retry.');
      }
    } catch (err: any) {
      console.error('Phone lookup exception:', err);
      setQueryError('Unable to connect to database. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync with propOrders if updated from parent
  useEffect(() => {
    if (propOrders && propOrders.length > 0) {
      setLiveOrders(propOrders);
      setHasSearched(true);
      if (!expandedOrderId) {
        setExpandedOrderId(propOrders[0].orderNumber || propOrders[0].id);
      }
    }
  }, [propOrders]);

  // Auto-trigger initial search if saved phone exists
  useEffect(() => {
    if (phoneNumber && phoneNumber.replace(/\D/g, '').length >= 10 && liveOrders.length === 0) {
      executePhoneLookup(phoneNumber);
    }
  }, []);

  const handlePhoneFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executePhoneLookup(phoneInput);
  };

  const handleCopyAwb = (awb: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(awb);
    setCopiedAwb(awb);
    setTimeout(() => setCopiedAwb(null), 2000);
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  const filteredOrders = liveOrders.filter((ord) => {
    const rawTrackingNumber = ord.trackingNumber || ord.tracking_number;
    const rawCourierName = ord.courierName || ord.courier_name;
    const rawTrackingUrl = ord.trackingUrl || ord.tracking_url;

    const hasTracking = Boolean(
      (rawTrackingNumber && rawTrackingNumber.trim()) ||
      (rawTrackingUrl && rawTrackingUrl.trim()) ||
      ord.status === 'shipped' ||
      ord.status === 'delivered'
    );

    if (filterMode === 'tracked' && !hasTracking) return false;
    if (filterMode === 'delivered' && ord.status !== 'delivered') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrderNum = ord.orderNumber?.toLowerCase().includes(q);
      const matchAwb = rawTrackingNumber?.toLowerCase().includes(q);
      const matchCourier = rawCourierName?.toLowerCase().includes(q);
      const matchItems = ord.items?.some((i: any) => (i.productName || i.name || '').toLowerCase().includes(q));
      return matchOrderNum || matchAwb || matchCourier || matchItems;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    const validStatus = (['pending', 'confirmed', 'shipped', 'delivered'].includes(status)
      ? status
      : 'pending') as any;
    return <OrderStatusChip status={validStatus} size="sm" />;
  };

  const getProgressStepIndex = (status: string) => {
    switch (status) {
      case 'delivered':
        return 3;
      case 'shipped':
        return 2;
      case 'confirmed':
        return 1;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-4 text-left font-sans">
      {/* 1. Phone Number Lookup Form */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-600">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-mono uppercase text-zinc-900">
                Track by Mobile Number
              </div>
              <div className="text-[11px] text-zinc-500 font-mono">
                Enter the 10-digit number used during checkout
              </div>
            </div>
          </div>
          {phoneNumber && (
            <button
              onClick={() => executePhoneLookup(phoneNumber)}
              disabled={isLoading}
              className="text-[11px] font-mono text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer min-h-[32px]"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          )}
        </div>

        <form onSubmit={handlePhoneFormSubmit} className="space-y-2">
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-zinc-400 font-mono text-xs border-r border-zinc-200 pr-2 pointer-events-none">
                <span>🇮🇳</span>
                <span className="font-bold text-zinc-700">+91</span>
              </div>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  setPhoneError(null);
                }}
                placeholder="Enter 10-digit mobile number"
                maxLength={14}
                className={`w-full bg-white border ${
                  phoneError ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200 focus:border-red-600'
                } rounded-xl pl-20 pr-3 py-2.5 text-xs text-zinc-900 font-mono focus:outline-hidden transition-all shadow-xs min-h-[44px]`}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 active:scale-98 disabled:opacity-50 text-white font-mono text-xs font-bold uppercase px-6 py-2.5 rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer min-h-[44px] shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Look Up Orders</span>
                </>
              )}
            </button>
          </div>

          {phoneError && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 font-mono pt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{phoneError}</span>
            </div>
          )}
        </form>
      </div>

      {/* 2. Search & Filter Bar (Only if user has searched and has orders) */}
      {hasSearched && liveOrders.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 font-mono">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by order #, AWB, or item..."
              className="w-full bg-white border border-zinc-200 focus:border-red-600 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 focus:outline-hidden transition-colors shadow-xs min-h-[40px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs shrink-0">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer min-h-[34px] ${
                filterMode === 'all'
                  ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All ({liveOrders.length})
            </button>
            <button
              onClick={() => setFilterMode('tracked')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer min-h-[34px] flex items-center gap-1 ${
                filterMode === 'tracked'
                  ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
                  : 'text-zinc-600 hover:text-purple-700'
              }`}
            >
              <Truck className="w-3 h-3 text-purple-600" />
              <span>Tracked</span>
            </button>
            <button
              onClick={() => setFilterMode('delivered')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer min-h-[34px] flex items-center gap-1 ${
                filterMode === 'delivered'
                  ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                  : 'text-zinc-600 hover:text-emerald-700'
              }`}
            >
              <CheckCheck className="w-3 h-3 text-emerald-600" />
              <span>Delivered</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Orders List & States */}
      {isLoading ? (
        /* Loading Skeleton */
        <div className="space-y-3 py-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 space-y-3 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 bg-zinc-200 rounded w-1/3"></div>
                <div className="h-4 bg-zinc-200 rounded w-1/4"></div>
              </div>
              <div className="h-12 bg-zinc-100 rounded-xl"></div>
              <div className="h-4 bg-zinc-100 rounded w-1/2"></div>
            </div>
          ))}
          <div className="text-center py-2 text-xs font-mono text-zinc-400">
            Querying live order status directly from database...
          </div>
        </div>
      ) : queryError ? (
        /* Friendly Error State with Retry Button */
        <div className="bg-red-50/70 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-900 font-mono">Unable to Fetch Orders</h4>
            <p className="text-xs text-zinc-600 font-mono max-w-sm mx-auto">{queryError}</p>
          </div>
          <button
            onClick={() => executePhoneLookup(phoneInput || phoneNumber)}
            className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase px-5 py-2.5 rounded-xl transition cursor-pointer inline-flex items-center gap-2 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Lookup</span>
          </button>
        </div>
      ) : !hasSearched ? (
        /* Initial Prominent Prompt */
        <div className="text-center py-10 bg-zinc-50 rounded-2xl border border-dashed border-zinc-300 space-y-3 p-6">
          <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-red-600 mx-auto shadow-xs">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-900 font-mono uppercase">
              Track Your Hot Wheels Orders
            </h4>
            <p className="text-xs text-zinc-500 font-mono max-w-sm mx-auto leading-relaxed">
              Enter your mobile number above to view all past orders, live courier tracking numbers, and package status.
            </p>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        /* Clean Empty State */
        <div className="text-center py-10 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3 p-6">
          <Package className="w-12 h-12 text-zinc-300 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-900 font-mono uppercase">
              No Orders Found for This Number
            </h4>
            <p className="text-xs text-zinc-500 font-mono max-w-sm mx-auto leading-relaxed">
              {searchQuery
                ? 'No orders match your filter keyword. Try clearing the search box.'
                : `We could not find any orders associated with +91 ${phoneNumber}. Please double-check the phone number or contact our concierge team on WhatsApp.`}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <a
              href="https://wa.me/8431294886?text=Hi%20Redline%20Garage,%20I'm%20checking%20the%20status%20of%20my%20recent%20order"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold uppercase px-4 py-2.5 rounded-xl transition inline-flex items-center gap-2 min-h-[44px] cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Support</span>
            </a>
          </div>
        </div>
      ) : (
        /* Live Order Cards (Sorted Newest First, Expandable) */
        <div className="space-y-3">
          {filteredOrders.map((ord) => {
            const rawTrackingNumber = (ord.tracking_number || ord.trackingNumber || '').trim();
            const rawCourierName = (ord.courier_name || ord.courierName || '').trim();
            const rawTrackingUrl = (ord.tracking_url || ord.trackingUrl || '').trim();
            const isShipped = ord.status === 'shipped' || ord.status === 'delivered';
            const hasAwb = Boolean(rawTrackingNumber);

            const trackingInfo = isShipped || hasAwb || rawTrackingUrl
              ? getCourierTrackingUrl(rawTrackingNumber, rawCourierName, rawTrackingUrl, ord.orderNumber)
              : null;
            const currentStep = getProgressStepIndex(ord.status);

            const orderKey = ord.orderNumber || ord.id;
            const isExpanded = expandedOrderId === orderKey;

            const totalItemCount = (ord.items || []).reduce(
              (acc: number, i: any) => acc + Number(i.quantity || 1),
              0
            );

            return (
              <div
                key={orderKey}
                className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl overflow-hidden shadow-xs transition-all"
              >
                {/* Clickable Header for Collapsing/Expanding */}
                <div
                  onClick={() => toggleOrderExpand(orderKey)}
                  className="p-4 sm:p-5 cursor-pointer bg-zinc-50/60 hover:bg-zinc-50 transition-colors flex items-center justify-between gap-3 select-none"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black font-mono text-sm sm:text-base text-zinc-900">
                        Order #{ord.orderNumber}
                      </span>
                      {getStatusBadge(ord.status)}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-400" />
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span>{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}</span>
                      <span>•</span>
                      <span className="text-zinc-700 font-semibold">{ord.paymentMethod || 'UPI'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right font-mono">
                      <div className="text-base font-black text-red-600">
                        ₹{Number(ord.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-zinc-400 uppercase font-semibold">
                        {ord.status}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-2 text-zinc-400 hover:text-zinc-700 rounded-lg transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                      aria-label={isExpanded ? 'Collapse order details' : 'Expand order details'}
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Order Content */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-zinc-100 space-y-4 font-mono text-xs animate-fade-in">
                    {/* Live Tracking Banner (If package has tracking or is shipped) */}
                    {trackingInfo && (
                      <div className="bg-gradient-to-r from-purple-50/90 via-purple-50/50 to-zinc-50 border border-purple-200/80 rounded-xl p-3.5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs">
                              <Truck className="w-4 h-4 text-purple-600" />
                              <span>
                                {ord.status === 'delivered'
                                  ? 'Shipment Delivered'
                                  : 'Live Shipment in Transit'}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-700 flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span>
                                Courier: <strong className="text-purple-900">{trackingInfo.courierDisplay}</strong>
                              </span>
                              {rawTrackingNumber && (
                                <span className="inline-flex items-center gap-1 bg-white border border-purple-200 px-2 py-0.5 rounded text-[10px]">
                                  <span>AWB: <strong className="text-zinc-900">{rawTrackingNumber}</strong></span>
                                  <button
                                    onClick={(e) => handleCopyAwb(rawTrackingNumber, e)}
                                    className="text-purple-600 hover:text-purple-800 p-0.5 cursor-pointer ml-1"
                                    title="Copy AWB Tracking Number"
                                  >
                                    {copiedAwb === rawTrackingNumber ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </span>
                              )}
                            </div>
                          </div>

                          <a
                            href={trackingInfo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-mono font-bold uppercase px-4 py-2.5 rounded-xl transition-all shadow-md shadow-purple-600/20 min-h-[44px] shrink-0 active:scale-95 cursor-pointer"
                            title="Track My Package on Courier Website"
                          >
                            <Navigation className="w-4 h-4" />
                            <span>Track My Package</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-90" />
                          </a>
                        </div>

                        {/* Progress Timeline */}
                        <div className="pt-2 border-t border-purple-100">
                          <div className="grid grid-cols-4 gap-1 text-center">
                            {[
                              { label: 'Placed', icon: Clock },
                              { label: 'Confirmed', icon: CheckCircle2 },
                              { label: 'Dispatched', icon: Truck },
                              { label: 'Delivered', icon: CheckCheck },
                            ].map((step, idx) => {
                              const isDone = idx <= currentStep;
                              const isCurrent = idx === currentStep;
                              const Icon = step.icon;

                              return (
                                <div key={idx} className="space-y-1">
                                  <div
                                    className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[10px] transition-colors ${
                                      isDone
                                        ? isCurrent
                                          ? 'bg-purple-600 text-white ring-2 ring-purple-300 font-bold'
                                          : 'bg-emerald-500 text-white font-bold'
                                        : 'bg-zinc-200 text-zinc-400'
                                    }`}
                                  >
                                    <Icon className="w-3 h-3" />
                                  </div>
                                  <div
                                    className={`text-[9px] truncate ${
                                      isDone ? 'font-bold text-zinc-900' : 'text-zinc-400'
                                    }`}
                                  >
                                    {step.label}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ordered Items List */}
                    <div className="space-y-2">
                      <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
                        Ordered Die-Cast Collectibles ({(ord.items || []).length})
                      </div>
                      <div className="divide-y divide-zinc-100 border border-zinc-100 rounded-xl overflow-hidden">
                        {(ord.items || []).map((item: any, idx: number) => {
                          const itemName = item.productName || item.name || item.product?.name || 'Hot Wheels Car';
                          const itemQty = Number(item.quantity || 1);
                          const itemPrice = Number(item.price || item.product?.price || 0);

                          return (
                            <div
                              key={idx}
                              className="p-3 bg-zinc-50/40 hover:bg-zinc-50 flex items-center justify-between text-xs transition-colors"
                            >
                              <div className="space-y-0.5 pr-2">
                                <div className="text-zinc-900 font-semibold">
                                  {itemName} <span className="text-zinc-400 text-[11px]">× {itemQty}</span>
                                </div>
                                {item.customization && (
                                  <div className="text-[10px] text-red-600 flex flex-wrap items-center gap-1.5">
                                    <Sparkles className="w-3 h-3" />
                                    <span>
                                      Custom Blister: {item.customization.driverName} ({item.customization.carTitle})
                                    </span>
                                    {item.customization.isAiStylized && (
                                      <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1 py-0.2 rounded text-[8px] font-bold">
                                        ✨ AI Art
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="font-bold text-zinc-900 text-right shrink-0">
                                ₹{(itemPrice * itemQty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Order Financial Breakdown */}
                    <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-zinc-500">
                        <span>Subtotal:</span>
                        <span>₹{Number(ord.subtotal || ord.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {Number(ord.shipping || 0) > 0 && (
                        <div className="flex justify-between text-zinc-500">
                          <span>Express Shipping:</span>
                          <span>₹{Number(ord.shipping).toFixed(2)}</span>
                        </div>
                      )}
                      {Number(ord.referralDiscount || 0) > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Referral Discount:</span>
                          <span>-₹{Number(ord.referralDiscount).toFixed(2)}</span>
                        </div>
                      )}
                      {Number(ord.loyaltyDiscount || 0) > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Loyalty Points Discount:</span>
                          <span>-₹{Number(ord.loyaltyDiscount).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-zinc-900 border-t border-zinc-200 pt-1.5 text-xs">
                        <span>Total Paid:</span>
                        <span className="text-red-600">
                          ₹{Number(ord.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Delivery Address & Payment Method */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {ord.customerAddress && ord.customerAddress !== 'N/A' && (
                        <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 space-y-1">
                          <div className="flex items-center gap-1 font-bold text-zinc-700">
                            <MapPin className="w-3 h-3 text-red-600" />
                            <span>Delivery Address</span>
                          </div>
                          <div className="text-zinc-600 font-sans">{ord.customerAddress}</div>
                        </div>
                      )}

                      <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 space-y-1">
                        <div className="flex items-center gap-1 font-bold text-zinc-700">
                          <CreditCard className="w-3 h-3 text-zinc-500" />
                          <span>Payment Method</span>
                        </div>
                        <div className="text-zinc-600">
                          Method: <strong>{ord.paymentMethod || 'UPI / COD'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Order Action Buttons (Invoice & Support) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoiceOrder(ord);
                        }}
                        className="bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-300 font-mono text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs min-h-[38px]"
                      >
                        <FileText className="w-4 h-4 text-red-600" />
                        <span>Download / Print Invoice</span>
                      </button>

                      <a
                        href={`https://wa.me/8431294886?text=${encodeURIComponent(
                          `Hi Redline Garage Concierge, I have a question about my Order #${ord.orderNumber}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span>Help on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AI-Generated Tax Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
};
