import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldCheck,
  Eye,
  ExternalLink,
  Search,
  Filter,
  Settings,
  Save,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Database,
  MessageSquare,
  Sparkles,
  Camera,
  Bell,
  Mail,
} from 'lucide-react';
import {
  ResellerListing,
  ResellerListingStatus,
  MarketplaceSettings,
} from '../../types';
import {
  getMarketplaceListings,
  updateListingStatus,
  toggleResellerVerification,
  getMarketplaceSettings,
  updateMarketplaceSettings,
} from '../../marketplace';
import { SUPABASE_MARKETPLACE_SQL } from '../../data/supabaseMarketplaceSchema';
import { MarketplaceNotificationsPanel } from './MarketplaceNotificationsPanel';

interface ResellerMarketplaceTabProps {
  onOpenChatWithListing?: (listingId: string) => void;
}

export const ResellerMarketplaceTab: React.FC<ResellerMarketplaceTabProps> = ({
  onOpenChatWithListing,
}) => {
  const [activeView, setActiveView] = useState<'listings' | 'notifications'>('listings');
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(0);
  const [listings, setListings] = useState<ResellerListing[]>([]);
  const [settings, setSettings] = useState<MarketplaceSettings>({
    listing_fee: 99,
    listing_duration_days: 30,
    upi_id: 'shkofficialazman@okhdfcbank',
    is_marketplace_enabled: true,
    min_asking_price: 100,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ResellerListingStatus | 'all'>('pending_verification');
  const [searchQuery, setSearchQuery] = useState('');

  // Editable settings inputs
  const [editingFee, setEditingFee] = useState<number>(99);
  const [editingDuration, setEditingDuration] = useState<number>(30);
  const [editingUpi, setEditingUpi] = useState('shkofficialazman@okhdfcbank');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);

  // Fullscreen Screenshot Modal
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);

  // SQL Schema Modal
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [listData, settingsData] = await Promise.all([
        getMarketplaceListings('all'),
        getMarketplaceSettings(),
      ]);
      setListings(listData);
      setSettings(settingsData);
      setEditingFee(settingsData.listing_fee || 99);
      setEditingDuration(settingsData.listing_duration_days || 30);
      setEditingUpi(settingsData.upi_id || 'shkofficialazman@okhdfcbank');

      // Fetch unread notifications count
      try {
        const notifRes = await fetch('/api/marketplace/notifications');
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          const unread = (notifData.notifications || []).filter((n: any) => n.status === 'unread').length;
          setUnreadAlertsCount(unread);
        }
      } catch (e) {}
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const updated = await updateMarketplaceSettings({
        listing_fee: Number(editingFee) || 99,
        listing_duration_days: Number(editingDuration) || 30,
        upi_id: editingUpi.trim() || 'shkofficialazman@okhdfcbank',
      });
      setSettings(updated);
      setSettingsSaveSuccess(true);
      setTimeout(() => setSettingsSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleVerifyListing = async (listingId: string) => {
    await updateListingStatus(listingId, 'active', 'verified');
    await loadData();
  };

  const handleMarkSold = async (listingId: string) => {
    await updateListingStatus(listingId, 'sold');
    await loadData();
  };

  const handleRejectListing = async (listingId: string) => {
    if (confirm('Are you sure you want to reject this listing?')) {
      await updateListingStatus(listingId, 'rejected', 'rejected');
      await loadData();
    }
  };

  const handleToggleVerifiedReseller = async (resellerId: string, currentStatus: boolean) => {
    await toggleResellerVerification(resellerId, !currentStatus);
    await loadData();
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_MARKETPLACE_SQL);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch (e) {}
  };

  // Commission Calculations
  const verifiedListings = listings.filter(l => l.listing_fee_status === 'verified');
  const totalCommissionEarned = verifiedListings.reduce((sum, curr) => sum + (curr.listing_fee_amount || 99), 0);

  const pendingListings = listings.filter(l => l.status === 'pending_verification');
  const activeListings = listings.filter(l => l.status === 'active');
  const soldListings = listings.filter(l => l.status === 'sold');

  const filteredListings = listings.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = l.car_name.toLowerCase().includes(q);
      const matchSeller = l.reseller_name.toLowerCase().includes(q);
      const matchPhone = l.reseller_phone.toLowerCase().includes(q);
      const matchUtr = l.payment_utr?.toLowerCase().includes(q);
      if (!matchName && !matchSeller && !matchPhone && !matchUtr) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & SQL Schema Helper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-black font-mono uppercase tracking-tight text-zinc-950">
              Reseller Marketplace Control Center
            </h2>
          </div>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">
            Manage peer-to-peer Hot Wheels listings, verify UPI listing fee screenshots, and view automated admin alert emails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main Mode Switcher */}
          <div className="flex items-center p-1 bg-zinc-100 rounded-xl font-mono text-xs font-bold uppercase">
            <button
              onClick={() => setActiveView('listings')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeView === 'listings'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <span>Listings & Proofs</span>
            </button>
            <button
              onClick={() => setActiveView('notifications')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeView === 'notifications'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Email Alerts</span>
              {unreadAlertsCount > 0 && (
                <span className="bg-amber-400 text-zinc-950 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setShowSqlModal(true)}
            className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-zinc-600" />
            <span className="hidden sm:inline">Supabase SQL</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Listing Fee Commission */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-mono mb-1.5">
            <span className="font-bold">MIDDLEMAN FEE</span>
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600">
            ₹{totalCommissionEarned.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono mt-1.5 pt-1.5 border-t border-zinc-100">
            {verifiedListings.length} verified listings
          </div>
        </div>

        {/* Card 2: Pending Verification Attention */}
        <div
          onClick={() => {
            setActiveView('listings');
            setStatusFilter('pending_verification');
          }}
          className={`border rounded-2xl p-4 shadow-xs flex flex-col justify-between transition cursor-pointer ${
            pendingListings.length > 0
              ? 'bg-amber-50/60 border-amber-300 hover:border-amber-400'
              : 'bg-white border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 text-[11px] font-mono mb-1.5">
            <span className="font-bold">PENDING PROOF</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-900 flex items-center gap-2">
            <span>{pendingListings.length}</span>
            {pendingListings.length > 0 && (
              <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full font-bold uppercase">
                Action
              </span>
            )}
          </div>
          <div className="text-[10px] text-amber-900 font-mono font-bold mt-1.5 pt-1.5 border-t border-amber-200/60">
            Verify UPI proofs &rarr;
          </div>
        </div>

        {/* Card 3: Active Listings */}
        <div
          onClick={() => {
            setActiveView('listings');
            setStatusFilter('active');
          }}
          className="bg-white border border-zinc-200 hover:border-red-300 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-mono mb-1.5">
            <span className="font-bold">ACTIVE ITEMS</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-zinc-950">
            {activeListings.length}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono mt-1.5 pt-1.5 border-t border-zinc-100">
            Live on buyer marketplace
          </div>
        </div>

        {/* Card 4: Concluded Deals */}
        <div
          onClick={() => {
            setActiveView('listings');
            setStatusFilter('sold');
          }}
          className="bg-white border border-zinc-200 hover:border-emerald-300 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-mono mb-1.5">
            <span className="font-bold">CONCLUDED</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-zinc-950">
            {soldListings.length}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono mt-1.5 pt-1.5 border-t border-zinc-100">
            Marked sold
          </div>
        </div>

        {/* Card 5: Automated Email Alerts */}
        <div
          onClick={() => setActiveView('notifications')}
          className={`border rounded-2xl p-4 shadow-xs flex flex-col justify-between transition cursor-pointer ${
            unreadAlertsCount > 0
              ? 'bg-red-50/60 border-red-300 hover:border-red-400'
              : 'bg-white border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between text-zinc-600 text-[11px] font-mono mb-1.5">
            <span className="font-bold">EMAIL ALERTS</span>
            <Bell className={`w-3.5 h-3.5 ${unreadAlertsCount > 0 ? 'text-red-600 animate-bounce' : 'text-zinc-500'}`} />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-zinc-950 flex items-center gap-2">
            <span>{unreadAlertsCount}</span>
            {unreadAlertsCount > 0 && (
              <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded-full font-bold uppercase">
                New
              </span>
            )}
          </div>
          <div className="text-[10px] text-red-600 font-mono font-bold mt-1.5 pt-1.5 border-t border-zinc-100">
            High-Value & @admin &rarr;
          </div>
        </div>
      </div>

      {/* Conditionally Render View: Notifications Feed VS Listings Management */}
      {activeView === 'notifications' ? (
        <MarketplaceNotificationsPanel onOpenChatWithListing={onOpenChatWithListing} />
      ) : (
        <>
          {/* Editable Marketplace Fee Settings Box */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-red-600" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
                Editable Listing Fee & Marketplace Rules
              </h3>
            </div>

            <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-zinc-600 mb-1">
                  Listing Fee per Item (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold font-mono">₹</span>
                  <input
                    type="number"
                    value={editingFee}
                    onChange={e => setEditingFee(Number(e.target.value))}
                    min={10}
                    className="w-full pl-7 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-red-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-zinc-600 mb-1">
                  Active Duration (Days)
                </label>
                <input
                  type="number"
                  value={editingDuration}
                  onChange={e => setEditingDuration(Number(e.target.value))}
                  min={7}
                  max={180}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-[11px] font-mono font-bold uppercase text-zinc-600 mb-1">
                  Admin UPI ID (for QR)
                </label>
                <input
                  type="text"
                  value={editingUpi}
                  onChange={e => setEditingUpi(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full py-2 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {settingsSaveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Fee Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Listings Table / Management View */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Table Filters Header */}
            <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Status Tabs */}
              <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl font-mono text-xs font-bold uppercase overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setStatusFilter('pending_verification')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'pending_verification'
                      ? 'bg-amber-100 text-amber-900 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span>Pending Proof ({pendingListings.length})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    statusFilter === 'active'
                      ? 'bg-white text-red-600 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span>Active ({activeListings.length})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('sold')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    statusFilter === 'sold'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span>Sold ({soldListings.length})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span>All ({listings.length})</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search car, seller, or UTR..."
                  className="pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>
            </div>

        {/* Listings List */}
        {filteredListings.length === 0 ? (
          <div className="p-10 text-center text-zinc-400 text-xs font-mono">
            No listings found matching the current filter.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {filteredListings.map(listing => {
              const hasScreenshot = Boolean(listing.payment_screenshot_url);

              return (
                <div key={listing.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-zinc-50/60 transition">
                  {/* Left: Car & Photo Info */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {listing.photos && listing.photos[0] ? (
                      <img
                        src={listing.photos[0]}
                        alt={listing.car_name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-zinc-200 shrink-0 bg-zinc-100"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 shrink-0">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          listing.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : listing.status === 'pending_verification'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : listing.status === 'sold'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}>
                          {listing.status.replace('_', ' ')}
                        </span>

                        <span className="text-[10px] font-mono bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">
                          {listing.series}
                        </span>

                        <span className="text-[10px] font-mono font-bold text-zinc-700">
                          Condition: {listing.condition}
                        </span>
                      </div>

                      <h4 className="font-mono font-bold text-sm text-zinc-950 uppercase">
                        {listing.car_name}
                      </h4>

                      <div className="text-xs font-mono text-zinc-600 flex flex-wrap items-center gap-3">
                        <span className="font-bold text-zinc-900">
                          Asking: ₹{listing.asking_price.toLocaleString('en-IN')}
                        </span>
                        <span>•</span>
                        <span>Reseller: <strong>{listing.reseller_name}</strong> ({listing.reseller_phone})</span>
                        {listing.reseller_city && <span>• {listing.reseller_city}</span>}
                      </div>

                      {listing.description && (
                        <p className="text-[11px] text-zinc-500 font-sans line-clamp-1 max-w-xl">
                          "{listing.description}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle: UPI Payment Proof Box */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex items-center gap-3 shrink-0">
                    {hasScreenshot ? (
                      <div
                        onClick={() => setPreviewScreenshotUrl(listing.payment_screenshot_url || null)}
                        className="relative cursor-pointer group"
                        title="Click to zoom payment proof"
                      >
                        <img
                          src={listing.payment_screenshot_url}
                          alt="UPI Proof"
                          className="w-12 h-12 rounded-lg object-cover border border-zinc-300 group-hover:border-red-600 transition"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center text-white text-[9px] font-mono font-bold">
                          <Eye className="w-3 h-3" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-400 text-[10px] font-mono text-center p-1 leading-tight">
                        No Proof
                      </div>
                    )}

                    <div className="text-[11px] font-mono space-y-0.5">
                      <div className="font-bold text-zinc-900">
                        Fee: ₹{listing.listing_fee_amount || settings.listing_fee}
                      </div>
                      <div className="text-zinc-500 text-[10px]">
                        UTR: {listing.payment_utr || 'Not provided'}
                      </div>
                      <div className={`text-[10px] font-bold ${
                        listing.listing_fee_status === 'verified' ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        Status: {listing.listing_fee_status.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap lg:flex-col items-end gap-1.5 shrink-0">
                    {listing.status === 'pending_verification' && (
                      <button
                        onClick={() => handleVerifyListing(listing.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify & Activate</span>
                      </button>
                    )}

                    {listing.status === 'active' && (
                      <button
                        onClick={() => handleMarkSold(listing.id)}
                        className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Mark Sold</span>
                      </button>
                    )}

                    {/* Toggle Verified Reseller */}
                    <button
                      onClick={() => handleToggleVerifiedReseller(listing.reseller_id, listing.is_verified_reseller)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer ${
                        listing.is_verified_reseller
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                      title="Toggle verified badge for this seller"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>{listing.is_verified_reseller ? 'Verified Reseller' : 'Grant Verified Badge'}</span>
                    </button>

                    {/* Reject / Delete */}
                    {listing.status !== 'rejected' && (
                      <button
                        onClick={() => handleRejectListing(listing.id)}
                        className="px-2.5 py-1 text-zinc-400 hover:text-red-600 text-[10px] font-mono uppercase transition cursor-pointer"
                      >
                        Reject / Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      {/* MODAL: Fullscreen Screenshot Preview */}
      {previewScreenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="max-w-xl w-full bg-white rounded-3xl p-4 overflow-hidden space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-zinc-800">
                UPI Payment Screenshot Proof
              </span>
              <button
                onClick={() => setPreviewScreenshotUrl(null)}
                className="p-1 text-zinc-500 hover:text-zinc-900 rounded-full cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-xl border border-zinc-200">
              <img
                src={previewScreenshotUrl}
                alt="Full Payment Proof"
                className="w-full h-auto object-contain"
              />
            </div>
            <div className="text-right">
              <button
                onClick={() => setPreviewScreenshotUrl(null)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-mono font-bold uppercase cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Supabase SQL Migration Script */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="max-w-3xl w-full bg-zinc-950 text-white rounded-3xl p-5 border border-zinc-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-red-500" />
                <h3 className="font-mono text-sm font-bold uppercase">
                  Supabase Marketplace SQL Schema
                </h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-full cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 font-sans shrink-0">
              Copy and execute this query in your Supabase SQL Editor to provision tables for peer-to-peer listings, real-time messages, and admin moderation.
            </p>

            <div className="flex-1 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre-wrap">
                {SUPABASE_MARKETPLACE_SQL}
              </pre>
            </div>

            <div className="flex items-center justify-between shrink-0 pt-2 border-t border-zinc-800">
              <span className="text-[11px] text-zinc-500 font-mono">
                Includes Realtime Publications & Row Level Security
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
                </button>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
