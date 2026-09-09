import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  MessageSquare,
  Search,
  Car,
  Clock,
  ChevronRight,
  ShieldCheck,
  User,
  ShoppingBag,
  Tag,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { MarketplaceConversation, ResellerListing } from '../../types';
import { getMarketplaceConversations } from '../../marketplace';

interface MarketplaceMessagesInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: ResellerListing[];
  onOpenConversation: (
    conversation: MarketplaceConversation,
    listing: ResellerListing,
    userRole: 'buyer' | 'reseller'
  ) => void;
  currentUserName: string;
  currentUserPhone: string;
  onUpdateUserInfo: (name: string, phone: string) => void;
}

export const MarketplaceMessagesInboxModal: React.FC<MarketplaceMessagesInboxModalProps> = ({
  isOpen,
  onClose,
  listings,
  onOpenConversation,
  currentUserName,
  currentUserPhone,
  onUpdateUserInfo,
}) => {
  const [conversations, setConversations] = useState<MarketplaceConversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'buying' | 'selling'>('all');
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [tempName, setTempName] = useState(currentUserName);
  const [tempPhone, setTempPhone] = useState(currentUserPhone);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const convs = await getMarketplaceConversations();
      setConversations(convs);
    } catch (err) {
      console.error('Failed to load marketplace conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
      setTempName(currentUserName);
      setTempPhone(currentUserPhone);
    }
  }, [isOpen, currentUserName, currentUserPhone]);

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    onUpdateUserInfo(tempName.trim(), tempPhone.trim());
    setIsEditingUser(false);
  };

  const filteredConversations = useMemo(() => {
    let list = [...conversations];

    // Filter by tab
    if (activeTab === 'buying') {
      list = list.filter(c => {
        const matchesBuyerName = currentUserName && c.buyer_name?.toLowerCase() === currentUserName.toLowerCase();
        const matchesBuyerPhone = currentUserPhone && c.buyer_phone === currentUserPhone;
        return matchesBuyerName || matchesBuyerPhone;
      });
    } else if (activeTab === 'selling') {
      list = list.filter(c => {
        const matchesSellerName = currentUserName && c.reseller_name?.toLowerCase() === currentUserName.toLowerCase();
        const matchesSellerPhone = currentUserPhone && c.reseller_phone === currentUserPhone;
        return matchesSellerName || matchesSellerPhone;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.listing_title?.toLowerCase().includes(q) ||
        c.buyer_name?.toLowerCase().includes(q) ||
        c.reseller_name?.toLowerCase().includes(q) ||
        c.last_message?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [conversations, activeTab, searchQuery, currentUserName, currentUserPhone]);

  const handleSelectChat = (conv: MarketplaceConversation) => {
    // Find matching listing in listings array
    let matchedListing = listings.find(l => l.id === conv.listing_id);

    // If not found in current active listings, synthesize listing data from conversation
    if (!matchedListing) {
      matchedListing = {
        id: conv.listing_id,
        reseller_id: `reseller_${conv.reseller_name.replace(/\s+/g, '_').toLowerCase()}`,
        reseller_name: conv.reseller_name,
        reseller_phone: conv.reseller_phone,
        is_verified_reseller: false,
        car_name: conv.listing_title,
        series: 'Collector Edition',
        scale: '1:64',
        condition: 'Carded - Mint',
        asking_price: conv.listing_price,
        photos: conv.listing_image ? [conv.listing_image] : [],
        description: 'Negotiation conversation casting',
        status: 'active',
        listing_fee_amount: 99,
        listing_fee_status: 'verified',
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        created_at: conv.created_at,
        updated_at: conv.created_at,
      };
    }

    // Determine role: if current user matches reseller name/phone, they are reseller; otherwise buyer
    const isSeller =
      Boolean(currentUserPhone && conv.reseller_phone === currentUserPhone) ||
      Boolean(currentUserName && conv.reseller_name?.toLowerCase() === currentUserName.toLowerCase());

    const userRole: 'buyer' | 'reseller' = isSeller ? 'reseller' : 'buyer';
    onOpenConversation(conv, matchedListing, userRole);
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(isoString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return 'Recently';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh] my-auto">
        
        {/* Header */}
        <div className="bg-zinc-950 text-white p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-mono uppercase tracking-tight text-white">
                  Marketplace Messages
                </h2>
                <span className="bg-red-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {conversations.length}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans">
                Real-time negotiation and direct chats between verified buyers and sellers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchConversations}
              disabled={isLoading}
              title="Refresh messages"
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Identity & Contact Bar */}
        <div className="bg-zinc-50 border-b border-zinc-200 px-5 py-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          {!isEditingUser ? (
            <div className="flex items-center gap-2 text-zinc-700">
              <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>
                Chatting as: <strong className="text-zinc-950 font-bold">{currentUserName || 'Collector'}</strong>
                {currentUserPhone ? ` (${currentUserPhone})` : ''}
              </span>
              <button
                onClick={() => setIsEditingUser(true)}
                className="text-red-600 hover:underline font-bold text-[11px] ml-1 cursor-pointer"
              >
                Change
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveUser} className="flex flex-wrap items-center gap-2 w-full">
              <input
                type="text"
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                placeholder="Your Name"
                className="px-2.5 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-mono"
                required
              />
              <input
                type="tel"
                value={tempPhone}
                onChange={e => setTempPhone(e.target.value)}
                placeholder="Phone (Optional)"
                className="px-2.5 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-zinc-950 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingUser(false)}
                className="px-2 py-1 text-zinc-500 hover:text-zinc-800 text-xs cursor-pointer"
              >
                Cancel
              </button>
            </form>
          )}

          <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Escrow Protected &amp; Redline Monitored</span>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by casting title, seller, or buyer..."
              className="w-full pl-9.5 pr-4 py-2 bg-zinc-100/80 border border-zinc-200 rounded-xl text-xs font-sans focus:bg-white focus:ring-2 focus:ring-red-600 outline-hidden transition"
            />
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl shrink-0 text-xs font-mono">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                activeTab === 'all'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              All ({conversations.length})
            </button>
            <button
              onClick={() => setActiveTab('buying')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                activeTab === 'buying'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Buying
            </button>
            <button
              onClick={() => setActiveTab('selling')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                activeTab === 'selling'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Selling
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {isLoading ? (
            <div className="py-16 text-center text-zinc-500 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-red-600" />
              <p className="text-xs font-mono">Loading marketplace conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-900 font-sans">No Conversations Found</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans">
                  {searchQuery
                    ? `No conversations matching "${searchQuery}". Try a different search term.`
                    : 'Select any listing in the marketplace and tap "Chat & Make Offer" to start communicating directly with collectors!'}
                </p>
              </div>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isUserSeller =
                Boolean(currentUserPhone && conv.reseller_phone === currentUserPhone) ||
                Boolean(currentUserName && conv.reseller_name?.toLowerCase() === currentUserName.toLowerCase());

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectChat(conv)}
                  className="group bg-white hover:bg-zinc-50 border border-zinc-200/90 hover:border-red-500/50 rounded-2xl p-3.5 sm:p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {conv.listing_image ? (
                        <img
                          src={conv.listing_image}
                          alt={conv.listing_title}
                          className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Car className="w-6 h-6 text-zinc-400" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                          {isUserSeller ? 'Seller Mode' : 'Buyer Mode'}
                        </span>
                        <span className="text-xs font-black text-red-600 font-mono">
                          ₹{conv.listing_price.toLocaleString('en-IN')}
                        </span>
                        {conv.has_admin_flag && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                            Admin Monitored
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-zinc-950 truncate font-sans group-hover:text-red-600 transition-colors">
                        {conv.listing_title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-600 font-sans">
                        <span className="font-semibold text-zinc-800">
                          {isUserSeller ? `Inquiry from: ${conv.buyer_name}` : `Seller: ${conv.reseller_name}`}
                        </span>
                        <span className="text-zinc-300">•</span>
                        <span className="text-zinc-500 truncate max-w-[240px]">
                          {conv.last_message || 'Chat started'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Time & Open Button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100">
                    <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(conv.last_message_at || conv.created_at)}</span>
                    </div>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 group-hover:bg-red-600 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-xs"
                    >
                      <span>Open Chat</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 border-t border-zinc-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Supabase Realtime Chat Active • End-to-End Logged</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl font-bold transition cursor-pointer"
          >
            Close Inbox
          </button>
        </div>

      </div>
    </div>
  );
};
