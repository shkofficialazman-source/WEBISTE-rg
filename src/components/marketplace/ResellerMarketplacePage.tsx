import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Shield,
  ShieldCheck,
  Star,
  MessageSquare,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Tag,
  Car,
  ChevronRight,
  Info,
  Clock,
  Sparkles,
  MapPin,
  Flag,
} from 'lucide-react';
import {
  ResellerListing,
  MarketplaceConversation,
  ResellerListingStatus,
} from '../../types';
import {
  getMarketplaceListings,
  getOrCreateConversation,
  getMarketplaceSettings,
  getMarketplaceConversations,
} from '../../marketplace';
import { ResellerListingModal } from './ResellerListingModal';
import { MarketplaceChatModal } from './MarketplaceChatModal';
import { MarketplaceReportModal } from './MarketplaceReportModal';
import { ResellerReviewModal } from './ResellerReviewModal';
import { MarketplaceMessagesInboxModal } from './MarketplaceMessagesInboxModal';

interface ResellerMarketplacePageProps {
  onNavigateHome?: () => void;
}

export const ResellerMarketplacePage: React.FC<ResellerMarketplacePageProps> = ({
  onNavigateHome,
}) => {
  const [listings, setListings] = useState<ResellerListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [listingFee, setListingFee] = useState(99);
  const [conversationsCount, setConversationsCount] = useState(0);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<string>('All');
  const [selectedCondition, setSelectedCondition] = useState<string>('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [viewStatus, setViewStatus] = useState<'active' | 'sold'>('active');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'rating'>('newest');

  // Modals state
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
  const [activeChatListing, setActiveChatListing] = useState<ResellerListing | null>(null);
  const [activeConversation, setActiveConversation] = useState<MarketplaceConversation | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatUserRole, setChatUserRole] = useState<'buyer' | 'reseller'>('buyer');

  // Buyer Info Prompt before chat (to associate conversation)
  const [isBuyerInfoModalOpen, setIsBuyerInfoModalOpen] = useState(false);
  const [pendingChatListing, setPendingChatListing] = useState<ResellerListing | null>(null);
  const [buyerName, setBuyerName] = useState(() => localStorage.getItem('redline_buyer_name') || '');
  const [buyerPhone, setBuyerPhone] = useState(() => localStorage.getItem('redline_buyer_phone') || '');

  // Report & Review modal state
  const [reportModalData, setReportModalData] = useState<{
    isOpen: boolean;
    listingId?: string;
    conversationId?: string;
    reportedItemOrUser: string;
  }>({ isOpen: false, reportedItemOrUser: '' });

  const [reviewModalData, setReviewModalData] = useState<{
    isOpen: boolean;
    listing: ResellerListing | null;
  }>({ isOpen: false, listing: null });

  // Load listings & settings
  const loadMarketplaceData = async () => {
    setIsLoading(true);
    try {
      const [data, settings, convs] = await Promise.all([
        getMarketplaceListings(),
        getMarketplaceSettings(),
        getMarketplaceConversations().catch(() => []),
      ]);
      setListings(data);
      setListingFee(settings.listing_fee || 99);
      setConversationsCount(convs.length);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  // Filtered & Sorted listings
  const filteredListings = useMemo(() => {
    return listings
      .filter(l => {
        // Status filter (active vs sold)
        if (viewStatus === 'active' && l.status !== 'active') return false;
        if (viewStatus === 'sold' && l.status !== 'sold') return false;

        // Verified only
        if (verifiedOnly && !l.is_verified_reseller) return false;

        // Series filter
        if (selectedSeries !== 'All' && l.series !== selectedSeries) return false;

        // Condition filter
        if (selectedCondition !== 'All' && !l.condition.toLowerCase().includes(selectedCondition.toLowerCase())) {
          return false;
        }

        // Search text
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = l.car_name.toLowerCase().includes(q);
          const matchModel = l.casting_model?.toLowerCase().includes(q);
          const matchSeries = l.series.toLowerCase().includes(q);
          const matchSeller = l.reseller_name.toLowerCase().includes(q);
          const matchCity = l.reseller_city?.toLowerCase().includes(q);
          if (!matchName && !matchModel && !matchSeries && !matchSeller && !matchCity) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.asking_price - b.asking_price;
        if (sortBy === 'price-desc') return b.asking_price - a.asking_price;
        if (sortBy === 'rating') return (b.reseller_rating || 0) - (a.reseller_rating || 0);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [listings, viewStatus, verifiedOnly, selectedSeries, selectedCondition, searchQuery, sortBy]);

  // Series list for filter
  const seriesList = [
    'All',
    'Super Treasure Hunt ($TH)',
    'Car Culture / Premium',
    'Hot Wheels Mainline',
    'Treasure Hunt (TH)',
    'Red Line Club (RLC)',
    'Boulevard Series',
    'Mini GT',
  ];

  // Initiate Chat
  const handleInitiateChat = (listing: ResellerListing) => {
    // If buyer hasn't set their name, prompt for it
    if (!buyerName.trim()) {
      setPendingChatListing(listing);
      setIsBuyerInfoModalOpen(true);
      return;
    }

    startChatWithListing(listing, buyerName, buyerPhone);
  };

  const startChatWithListing = async (listing: ResellerListing, name: string, phone: string) => {
    try {
      const conv = await getOrCreateConversation(listing, name, phone);
      setActiveChatListing(listing);
      setActiveConversation(conv);
      setIsChatModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmBuyerInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim()) return;

    localStorage.setItem('redline_buyer_name', buyerName.trim());
    localStorage.setItem('redline_buyer_phone', buyerPhone.trim());
    setIsBuyerInfoModalOpen(false);

    if (pendingChatListing) {
      startChatWithListing(pendingChatListing, buyerName.trim(), buyerPhone.trim());
      setPendingChatListing(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 pb-20 font-sans">
      {/* Top Banner Disclaimer */}
      <div className="bg-zinc-900 text-zinc-300 text-xs py-2 px-4 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span className="text-white font-bold tracking-wider uppercase text-[11px]">
              PEER-TO-PEER DIE-CAST MARKETPLACE
            </span>
          </div>
          <div className="text-[10px] text-zinc-400">
            Independent Resellers • Direct Chat Negotiation • Escrow & Listing Moderation by Redline Garage
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <section className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Collector to Collector Trading</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-zinc-950 font-mono">
                Reseller Marketplace
              </h1>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-sans">
                Explore rare Hot Wheels, Super Treasure Hunts, Premiums, and chase castings listed by vetted independent collectors across India. Negotiate deals directly via live chat.
              </p>
            </div>

            {/* CTAs & Stats Card */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                onClick={() => setIsListingModalOpen(true)}
                className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                <span>Sell on Redline Garage (₹{listingFee})</span>
              </button>

              <button
                onClick={() => setIsMessagesModalOpen(true)}
                className="px-5 py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-2xl font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
              >
                <MessageSquare className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                <span>Messages</span>
                {conversationsCount > 0 && (
                  <span className="bg-red-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                    {conversationsCount}
                  </span>
                )}
              </button>

              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 flex items-center gap-4 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase font-bold">ACTIVE ITEMS</div>
                  <div className="text-base font-black text-zinc-900">
                    {listings.filter(l => l.status === 'active').length}
                  </div>
                </div>
                <div className="h-6 w-px bg-zinc-200" />
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase font-bold">CONCLUDED</div>
                  <div className="text-base font-black text-emerald-600">
                    {listings.filter(l => l.status === 'sold').length} Deals
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal / Transparency Disclaimer Box */}
          <div className="mt-8 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase font-mono tracking-wider block text-[11px] text-amber-900">
                  How the Reseller Marketplace Works
                </span>
                <span className="text-zinc-600 text-[11px] leading-relaxed">
                  Listings are posted and fulfilled directly by independent resellers. Redline Garage verifies the initial listing fee and oversees live chats. To request moderator help anytime, mention <strong className="text-amber-900 font-mono">@admin</strong> in chat.
                </span>
              </div>
            </div>

            <span className="shrink-0 px-3 py-1 bg-amber-200/60 text-amber-900 rounded-lg font-mono text-[10px] font-bold uppercase">
              100% Collector P2P
            </span>
          </div>
        </div>
      </section>

      {/* Main Content & Listings Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Search, Filter Tabs & Sort Controls */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 mb-8">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search car casting, model name, seller, or city..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 focus:bg-white outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Active vs Sold Switcher */}
            <div className="flex items-center p-1 bg-zinc-100 rounded-xl font-mono text-xs font-bold uppercase shrink-0">
              <button
                onClick={() => setViewStatus('active')}
                className={`px-4 py-2 rounded-lg transition cursor-pointer ${
                  viewStatus === 'active'
                    ? 'bg-white text-red-600 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Available ({listings.filter(l => l.status === 'active').length})
              </button>
              <button
                onClick={() => setViewStatus('sold')}
                className={`px-4 py-2 rounded-lg transition cursor-pointer ${
                  viewStatus === 'sold'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Concluded Deals ({listings.filter(l => l.status === 'sold').length})
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-zinc-400 uppercase font-bold hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800 outline-hidden cursor-pointer"
              >
                <option value="newest">Newest Listed</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated Seller</option>
              </select>
            </div>
          </div>

          {/* Series & Verified Filter Pills */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              {seriesList.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSeries(s)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono whitespace-nowrap transition cursor-pointer ${
                    selectedSeries === s
                      ? 'bg-zinc-900 text-white font-bold'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 font-medium'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Verified Only Toggle */}
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                verifiedOnly
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Resellers Only</span>
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
              <Car className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black uppercase font-mono text-zinc-900">
                No Reseller Listings Found
              </h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                No die-cast items matched your selected filters. Try clearing your search or list your own Hot Wheels casting!
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSeries('All');
                setVerifiedOnly(false);
                setViewStatus('active');
              }}
              className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredListings.map(listing => {
              const isSold = listing.status === 'sold';
              const coverPhoto = listing.photos && listing.photos[0]
                ? listing.photos[0]
                : 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80';

              return (
                <div
                  key={listing.id}
                  className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group"
                >
                  {/* Photo Container */}
                  <div className="relative aspect-4/3 bg-zinc-100 overflow-hidden">
                    <img
                      src={coverPhoto}
                      alt={listing.car_name}
                      className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                        isSold ? 'grayscale' : ''
                      }`}
                      loading="lazy"
                    />

                    {/* Reseller Badge on Photo */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                      <span className="px-2 py-0.5 bg-zinc-900/85 backdrop-blur-xs text-white text-[9px] font-mono font-bold uppercase tracking-wider rounded-md border border-white/10">
                        Independent Reseller
                      </span>
                      {listing.is_verified_reseller && (
                        <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-mono font-bold uppercase tracking-wider rounded-md flex items-center gap-1 shadow-sm">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>Verified Seller</span>
                        </span>
                      )}
                    </div>

                    {/* Condition Pill */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-0.5 bg-white/95 text-zinc-900 text-[10px] font-mono font-black uppercase rounded-md shadow-xs border border-zinc-200">
                        {listing.condition}
                      </span>
                    </div>

                    {/* Sold overlay */}
                    {isSold && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="px-4 py-1.5 bg-red-600 text-white font-mono text-xs font-black uppercase tracking-widest rounded-xl shadow-lg rotate-[-5deg]">
                          DEAL CONCLUDED
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase mb-1">
                        <span className="truncate">{listing.series}</span>
                        <span>{listing.scale || '1:64'}</span>
                      </div>

                      <h3 className="font-mono font-bold text-sm text-zinc-950 uppercase tracking-tight line-clamp-2">
                        {listing.car_name}
                      </h3>

                      {listing.casting_model && (
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5 font-sans">
                          {listing.casting_model}
                        </p>
                      )}
                    </div>

                    {/* Reseller Info & Ratings */}
                    <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-800 text-[11px] truncate flex items-center gap-1">
                          <span>{listing.reseller_name}</span>
                        </div>
                        {listing.reseller_city && (
                          <div className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono truncate">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <span>{listing.reseller_city}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 font-mono text-xs shrink-0 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-amber-900">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="font-bold">{listing.reseller_rating || 5.0}</span>
                        <span className="text-[9px] text-amber-700">({listing.reseller_reviews_count || 0})</span>
                      </div>
                    </div>

                    {/* Price & Primary Action */}
                    <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[9px] font-mono text-zinc-400 uppercase font-bold">Asking Price</div>
                        <div className="text-base sm:text-lg font-black font-mono text-zinc-950">
                          ₹{listing.asking_price.toLocaleString('en-IN')}
                        </div>
                      </div>

                      {!isSold ? (
                        <button
                          onClick={() => handleInitiateChat(listing)}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat / Negotiate</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setReviewModalData({ isOpen: true, listing })}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-[11px] font-mono font-bold uppercase transition cursor-pointer"
                        >
                          Leave Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Reseller Listing Flow */}
      <ResellerListingModal
        isOpen={isListingModalOpen}
        onClose={() => setIsListingModalOpen(false)}
        onListingCreated={newListing => {
          setListings(prev => [newListing, ...prev]);
        }}
      />

      {/* MODAL: Buyer Name/Contact Prompt before starting chat */}
      {isBuyerInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-zinc-200 shadow-2xl p-5 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-red-600">
                Collector Introduction
              </span>
              <h3 className="text-base font-black uppercase font-mono text-zinc-900">
                Start Chat with Reseller
              </h3>
              <p className="text-xs text-zinc-500 font-sans">
                Enter your name so the seller knows who they are negotiating with.
              </p>
            </div>

            <form onSubmit={handleConfirmBuyerInfo} className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={e => setBuyerName(e.target.value)}
                  placeholder="e.g. Sameer Sen"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                  WhatsApp Number (Optional)
                </label>
                <input
                  type="tel"
                  value={buyerPhone}
                  onChange={e => setBuyerPhone(e.target.value)}
                  placeholder="For shipping confirmation"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBuyerInfoModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-mono font-bold uppercase text-zinc-500 hover:text-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer"
                >
                  Open Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Live Chat */}
      {isChatModalOpen && activeChatListing && activeConversation && (
        <MarketplaceChatModal
          isOpen={isChatModalOpen}
          onClose={() => {
            setIsChatModalOpen(false);
            setActiveChatListing(null);
            setActiveConversation(null);
            loadMarketplaceData();
          }}
          listing={activeChatListing}
          conversation={activeConversation}
          currentUserRole={chatUserRole}
          currentUserName={
            chatUserRole === 'reseller'
              ? (activeConversation.reseller_name || buyerName || 'Seller')
              : (buyerName || activeConversation.buyer_name || 'Collector')
          }
          currentUserContact={
            chatUserRole === 'reseller'
              ? (activeConversation.reseller_phone || buyerPhone || '')
              : (buyerPhone || activeConversation.buyer_phone || '')
          }
          onOpenReportModal={(lid, cid) => {
            setReportModalData({
              isOpen: true,
              listingId: lid,
              conversationId: cid,
              reportedItemOrUser: `${activeChatListing.car_name} (Seller: ${activeChatListing.reseller_name})`,
            });
          }}
        />
      )}

      {/* MODAL: Messages Inbox */}
      <MarketplaceMessagesInboxModal
        isOpen={isMessagesModalOpen}
        onClose={() => setIsMessagesModalOpen(false)}
        listings={listings}
        onOpenConversation={(conv, listing, role) => {
          setIsMessagesModalOpen(false);
          setActiveConversation(conv);
          setActiveChatListing(listing);
          setChatUserRole(role);
          setIsChatModalOpen(true);
        }}
        currentUserName={buyerName}
        currentUserPhone={buyerPhone}
        onUpdateUserInfo={(name, phone) => {
          setBuyerName(name);
          setBuyerPhone(phone);
          localStorage.setItem('redline_buyer_name', name);
          localStorage.setItem('redline_buyer_phone', phone);
        }}
      />

      {/* MODAL: Report */}
      <MarketplaceReportModal
        isOpen={reportModalData.isOpen}
        onClose={() => setReportModalData(prev => ({ ...prev, isOpen: false }))}
        listingId={reportModalData.listingId}
        conversationId={reportModalData.conversationId}
        reportedItemOrUser={reportModalData.reportedItemOrUser}
      />

      {/* MODAL: Review */}
      {reviewModalData.isOpen && reviewModalData.listing && (
        <ResellerReviewModal
          isOpen={reviewModalData.isOpen}
          onClose={() => setReviewModalData({ isOpen: false, listing: null })}
          listing={reviewModalData.listing}
          onReviewSubmitted={() => {
            loadMarketplaceData();
          }}
        />
      )}
    </div>
  );
};
