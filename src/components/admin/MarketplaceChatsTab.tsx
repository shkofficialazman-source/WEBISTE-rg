import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Shield,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Send,
  User,
  Car,
  Clock,
  ExternalLink,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { supabase } from '../../supabase';
import {
  MarketplaceConversation,
  MarketplaceMessage,
} from '../../types';
import {
  getMarketplaceConversations,
  getMarketplaceMessages,
  sendMarketplaceMessage,
  resolveAdminFlag,
} from '../../marketplace';

export const MarketplaceChatsTab: React.FC = () => {
  const [conversations, setConversations] = useState<MarketplaceConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MarketplaceMessage[]>([]);
  const [adminInput, setAdminInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'flagged'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const data = await getMarketplaceConversations();
      setConversations(data);
      if (data.length > 0 && !selectedConvId) {
        setSelectedConvId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages for selected conversation & listen in realtime
  useEffect(() => {
    if (!selectedConvId) return;

    getMarketplaceMessages(selectedConvId).then(msgs => {
      setMessages(msgs);
      setTimeout(scrollToBottom, 50);
    });

    const channel = supabase
      .channel(`marketplace_chat_${selectedConvId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_messages',
          filter: `conversation_id=eq.${selectedConvId}`,
        },
        payload => {
          const newMsg = payload.new as MarketplaceMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(scrollToBottom, 50);
        }
      )
      .on('broadcast', { event: 'new-message' }, payload => {
        const msg = payload.payload as MarketplaceMessage;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 50);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConvId]);

  const activeConversation = conversations.find(c => c.id === selectedConvId);

  const handleSendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminInput.trim() || !activeConversation || isSending) return;

    setIsSending(true);
    try {
      const msg = await sendMarketplaceMessage(
        activeConversation.id,
        activeConversation.listing_id,
        'admin',
        'Redline Garage Admin (Official Moderator)',
        '+91 98451 00000',
        adminInput.trim()
      );

      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      setAdminInput('');
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleResolveFlag = async () => {
    if (!activeConversation) return;
    await resolveAdminFlag(activeConversation.id);
    await loadConversations();
  };

  const filteredConversations = conversations.filter(c => {
    if (filterType === 'flagged' && !c.has_admin_flag) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.listing_title.toLowerCase().includes(q);
      const matchSeller = c.reseller_name.toLowerCase().includes(q);
      const matchBuyer = c.buyer_name.toLowerCase().includes(q);
      if (!matchTitle && !matchSeller && !matchBuyer) return false;
    }
    return true;
  });

  const flaggedCount = conversations.filter(c => c.has_admin_flag).length;

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl shadow-xs overflow-hidden flex flex-col h-[750px] animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black font-mono uppercase tracking-tight text-zinc-950 flex items-center gap-2">
              <span>Marketplace Chats & Moderation</span>
              {flaggedCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-mono font-bold">
                  {flaggedCount} Flagged
                </span>
              )}
            </h2>
            <p className="text-[11px] text-zinc-500 font-sans">
              Oversee peer-to-peer discussions, respond to @admin summons, and step in as official moderator.
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-200/70 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            All Chats ({conversations.length})
          </button>
          <button
            onClick={() => setFilterType('flagged')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer flex items-center gap-1 ${
              filterType === 'flagged'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>@Admin Flagged ({flaggedCount})</span>
          </button>
        </div>
      </div>

      {/* Main Two-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Conversations List */}
        <div className="w-full sm:w-80 lg:w-96 border-r border-zinc-200 flex flex-col shrink-0 bg-white">
          {/* Search box */}
          <div className="p-3 border-b border-zinc-200">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by car, buyer, seller..."
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 outline-hidden"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-zinc-400">
                No conversations found.
              </div>
            ) : (
              filteredConversations.map(c => {
                const isSelected = c.id === selectedConvId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConvId(c.id)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 cursor-pointer ${
                      isSelected ? 'bg-red-50/50 border-l-4 border-l-red-600' : 'hover:bg-zinc-50'
                    }`}
                  >
                    {c.listing_image ? (
                      <img
                        src={c.listing_image}
                        alt={c.listing_title}
                        className="w-12 h-12 rounded-xl object-cover border border-zinc-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                        <Car className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-mono font-bold text-xs text-zinc-950 truncate uppercase">
                          {c.listing_title}
                        </h4>
                        {c.has_admin_flag && (
                          <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded text-[9px] font-mono font-bold uppercase shrink-0">
                            @Admin
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-zinc-600 font-mono truncate">
                        <span>{c.buyer_name}</span> &harr; <span>{c.reseller_name}</span>
                      </div>

                      {c.last_message && (
                        <p className="text-[11px] text-zinc-500 truncate font-sans">
                          {c.last_message}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Selected Chat & Moderator Control */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50/50">
            {/* Conversation Details Top Bar */}
            <div className="p-3.5 bg-white border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                {activeConversation.listing_image && (
                  <img
                    src={activeConversation.listing_image}
                    alt={activeConversation.listing_title}
                    className="w-11 h-11 rounded-xl object-cover border border-zinc-200 shrink-0"
                  />
                )}
                <div>
                  <h3 className="font-mono font-bold text-sm text-zinc-950 uppercase">
                    {activeConversation.listing_title}
                  </h3>
                  <div className="text-[11px] font-mono text-zinc-600 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-emerald-700">₹{activeConversation.listing_price}</span>
                    <span>•</span>
                    <span>Buyer: <strong>{activeConversation.buyer_name}</strong> ({activeConversation.buyer_phone || 'No phone'})</span>
                    <span>•</span>
                    <span>Seller: <strong>{activeConversation.reseller_name}</strong> ({activeConversation.reseller_phone})</span>
                  </div>
                </div>
              </div>

              {activeConversation.has_admin_flag && (
                <button
                  onClick={handleResolveFlag}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Flag Resolved</span>
                </button>
              )}
            </div>

            {/* Chat Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 font-mono text-xs">
                  No messages in this chat yet.
                </div>
              ) : (
                messages.map(msg => {
                  const isAdmin = msg.sender_role === 'admin';
                  const isSeller = msg.sender_role === 'reseller';

                  if (isAdmin) {
                    return (
                      <div key={msg.id} className="max-w-xl mx-auto my-2">
                        <div className="bg-zinc-950 text-white border-2 border-red-600 rounded-2xl p-3.5 shadow-md space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">
                              <Shield className="w-3 h-3" />
                              <span>You (Official Moderator)</span>
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-100 font-sans leading-relaxed">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSeller ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold font-mono text-zinc-600">
                          {msg.sender_name}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700 uppercase">
                          {msg.sender_role}
                        </span>
                        {msg.is_flagged_for_admin && (
                          <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded font-mono">
                            @admin summoned
                          </span>
                        )}
                      </div>

                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-sans leading-relaxed shadow-xs ${
                          isSeller
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-white border border-zinc-200 text-zinc-900 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        <div
                          className={`text-[9px] font-mono mt-1 text-right ${
                            isSeller ? 'text-blue-200' : 'text-zinc-400'
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Admin Moderator Reply Box */}
            <form
              onSubmit={handleSendAdminMessage}
              className="p-3.5 bg-white border-t border-zinc-200 flex items-center gap-2 shrink-0"
            >
              <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-mono font-bold uppercase shrink-0">
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Admin Speak</span>
              </div>

              <input
                type="text"
                value={adminInput}
                onChange={e => setAdminInput(e.target.value)}
                placeholder="Reply into this live chat with official Redline Garage moderator authority..."
                className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-red-600 focus:bg-white outline-hidden"
              />

              <button
                type="submit"
                disabled={!adminInput.trim() || isSending}
                className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-mono text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-md shrink-0"
              >
                <Send className="w-4 h-4 text-red-500" />
                <span>Send as Admin</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-400 font-mono text-xs">
            Select a conversation from the left to view the negotiation transcript.
          </div>
        )}
      </div>
    </div>
  );
};
