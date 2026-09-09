import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Flag,
  User,
  Car,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  MessageCircle,
  Check,
  CheckCheck,
} from 'lucide-react';
import { supabase } from '../../supabase';
import {
  MarketplaceConversation,
  MarketplaceMessage,
  MarketplaceSenderRole,
  ResellerListing,
} from '../../types';
import {
  getMarketplaceMessages,
  sendMarketplaceMessage,
  broadcastTypingStatus,
  markMarketplaceMessagesAsRead,
} from '../../marketplace';

interface MarketplaceChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: ResellerListing;
  conversation: MarketplaceConversation;
  currentUserRole: 'buyer' | 'reseller' | 'admin';
  currentUserName: string;
  currentUserContact: string;
  onOpenReportModal?: (listingId: string, conversationId: string) => void;
}

const QUICK_PROMPTS = [
  'Is this casting still available?',
  'What is your best price including shipping?',
  'Can you share clear photos of the blister blister edges?',
  'Are you open to trading for rare JDM models?',
];

export const MarketplaceChatModal: React.FC<MarketplaceChatModalProps> = ({
  isOpen,
  onClose,
  listing,
  conversation,
  currentUserRole,
  currentUserName,
  currentUserContact,
  onOpenReportModal,
}) => {
  const [messages, setMessages] = useState<MarketplaceMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [adminFlaggedNotice, setAdminFlaggedNotice] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState<{ isTyping: boolean; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const remoteTypingTimeoutRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages & subscribe to Supabase Realtime channel
  useEffect(() => {
    if (!isOpen || !conversation.id) return;

    // Fetch existing messages
    getMarketplaceMessages(conversation.id).then(msgs => {
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
      // Mark received messages from other party as read
      markMarketplaceMessagesAsRead(conversation.id, currentUserRole).catch(e => console.warn(e));
    });

    // Supabase Realtime subscription
    const channelName = `marketplace_chat_${conversation.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        payload => {
          const newMsg = payload.new as MarketplaceMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_role !== currentUserRole) {
            markMarketplaceMessagesAsRead(conversation.id, currentUserRole).catch(e => console.warn(e));
          }
          setTimeout(scrollToBottom, 100);
        }
      )
      .on('broadcast', { event: 'new-message' }, payload => {
        const msg = payload.payload as MarketplaceMessage;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.sender_role !== currentUserRole) {
          markMarketplaceMessagesAsRead(conversation.id, currentUserRole).catch(e => console.warn(e));
        }
        setTimeout(scrollToBottom, 100);
      })
      .on('broadcast', { event: 'typing-status' }, payload => {
        const data = payload.payload;
        if (data && data.senderRole !== currentUserRole) {
          if (data.isTyping) {
            setOtherUserTyping({ isTyping: true, name: data.senderName });
            if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);
            remoteTypingTimeoutRef.current = setTimeout(() => {
              setOtherUserTyping(null);
            }, 3000);
          } else {
            setOtherUserTyping(null);
          }
          setTimeout(scrollToBottom, 50);
        }
      })
      .on('broadcast', { event: 'messages-read' }, payload => {
        const data = payload.payload;
        if (data && data.readerRole !== currentUserRole) {
          setMessages(prev =>
            prev.map(m => (m.sender_role === currentUserRole ? { ...m, is_read: true } : m))
          );
        }
      })
      .subscribe();

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);
      broadcastTypingStatus(conversation.id, currentUserRole, currentUserName, false);
      supabase.removeChannel(channel);
    };
  }, [isOpen, conversation.id, currentUserRole, currentUserName]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputMessage(val);

    if (val.trim()) {
      broadcastTypingStatus(conversation.id, currentUserRole, currentUserName, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        broadcastTypingStatus(conversation.id, currentUserRole, currentUserName, false);
      }, 1800);
    } else {
      broadcastTypingStatus(conversation.id, currentUserRole, currentUserName, false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputMessage.trim();
    if (!text || isSending) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    broadcastTypingStatus(conversation.id, currentUserRole, currentUserName, false);

    setIsSending(true);
    const mentionsAdmin = /@admin/i.test(text);

    try {
      const createdMsg = await sendMarketplaceMessage(
        conversation.id,
        listing.id,
        currentUserRole,
        currentUserName || (currentUserRole === 'buyer' ? 'Collector (Buyer)' : 'Reseller'),
        currentUserContact || '',
        text
      );

      // Optimistically update local list if not already updated
      setMessages(prev => {
        if (prev.some(m => m.id === createdMsg.id)) return prev;
        return [...prev, createdMsg];
      });

      setInputMessage('');
      if (mentionsAdmin) {
        setAdminFlaggedNotice(true);
        setTimeout(() => setAdminFlaggedNotice(false), 6000);
      }
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const insertAdminMention = () => {
    setInputMessage(prev => {
      if (prev.includes('@admin')) return prev;
      return prev ? `@admin ${prev}` : '@admin ';
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full h-[90vh] max-h-[780px] border border-zinc-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="bg-zinc-950 text-white p-3.5 sm:p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {listing.photos && listing.photos[0] ? (
              <img
                src={listing.photos[0]}
                alt={listing.car_name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-zinc-700 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                <Car className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-red-500 uppercase font-bold tracking-widest">
                  P2P LIVE CHAT
                </span>
                {listing.is_verified_reseller && (
                  <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>Verified Reseller</span>
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-black text-white truncate uppercase tracking-tight">
                {listing.car_name}
              </h3>
              <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
                <span className="text-white font-bold">Asking: ₹{listing.asking_price.toLocaleString('en-IN')}</span>
                <span>•</span>
                <span>Seller: {listing.reseller_name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onOpenReportModal && (
              <button
                onClick={() => onOpenReportModal(listing.id, conversation.id)}
                className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-xl transition cursor-pointer"
                title="Report this listing or user"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition cursor-pointer"
              aria-label="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Admin Flag Banner Notice */}
        {(conversation.has_admin_flag || adminFlaggedNotice) && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs font-mono text-amber-900 shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold">
                Admin Summoned: Redline Garage moderator has been alerted to this chat.
              </span>
            </div>
            <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded uppercase font-bold">
              Flagged
            </span>
          </div>
        )}

        {/* Chat Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-50/50">
          {/* Trust Banner inside chat */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-2xs space-y-1.5 text-center max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-900 font-mono uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Redline Garage Direct Trade Room</span>
            </div>
            <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
              Negotiate price, packaging, and shipping directly with the reseller. Need moderation or guidance? Type <code className="bg-zinc-100 text-red-600 px-1 py-0.5 rounded font-mono font-bold">@admin</code> anywhere in your message.
            </p>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-10 text-zinc-400 text-xs font-mono">
              No messages yet. Send a greeting to start negotiating!
            </div>
          ) : (
            messages.map(msg => {
              const isAdmin = msg.sender_role === 'admin';
              const isMe = msg.sender_role === currentUserRole;

              if (isAdmin) {
                return (
                  <div key={msg.id} className="max-w-lg mx-auto my-2">
                    <div className="bg-zinc-950 text-white border-2 border-red-600 rounded-2xl p-3.5 shadow-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                          <Shield className="w-3 h-3" />
                          <span>Official Redline Garage Admin</span>
                        </div>
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
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-bold font-mono text-zinc-500">
                      {msg.sender_name}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-mono">
                      ({msg.sender_role === 'reseller' ? 'Seller' : 'Buyer'})
                    </span>
                    {msg.is_flagged_for_admin && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded font-mono">
                        @admin alerted
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-sans leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-red-600 text-white rounded-br-xs'
                        : 'bg-white border border-zinc-200 text-zinc-900 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    <div
                      className={`text-[9px] font-mono mt-1 flex items-center justify-end gap-1.5 ${
                        isMe ? 'text-red-200' : 'text-zinc-400'
                      }`}
                    >
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && (
                        msg.is_read ? (
                          <span title="Read by recipient" className="text-sky-300 inline-flex items-center">
                            <CheckCheck className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span title="Delivered" className="text-white/80 inline-flex items-center">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {otherUserTyping && otherUserTyping.isTyping && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-zinc-100/90 border border-zinc-200/80 rounded-2xl w-fit text-xs text-zinc-600 font-mono shadow-xs animate-pulse">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span className="text-[11px] font-medium text-zinc-700">
                {otherUserTyping.name ? `${otherUserTyping.name} is typing...` : 'Collector is typing...'}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 bg-white border-t border-zinc-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={insertAdminMention}
            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-[11px] font-mono font-bold shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Shield className="w-3 h-3 text-amber-600" />
            <span>@admin</span>
          </button>

          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputMessage(prompt);
                broadcastTypingStatus(conversation.id, currentUserRole, currentUserName, true);
              }}
              className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-[11px] font-mono whitespace-nowrap shrink-0 transition cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-white border-t border-zinc-200 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            placeholder="Type your message... (use @admin to summon moderator)"
            className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-red-600 focus:bg-white outline-hidden"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isSending}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition flex items-center gap-1.5 font-mono text-xs font-bold uppercase cursor-pointer disabled:opacity-40 shadow-md shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
