import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Shield,
  Sparkles,
  RefreshCw,
  Send,
  Eye,
  Check,
  ChevronRight,
  User,
  Car,
  IndianRupee,
} from 'lucide-react';
import { AdminNotification } from '../../types';

interface MarketplaceNotificationsPanelProps {
  onOpenChatWithListing?: (listingId: string) => void;
}

export const MarketplaceNotificationsPanel: React.FC<MarketplaceNotificationsPanelProps> = ({
  onOpenChatWithListing,
}) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'high_value_listing' | 'admin_mention'>('all');
  const [selectedPreviewNotification, setSelectedPreviewNotification] = useState<AdminNotification | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/marketplace/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.warn('Failed to fetch admin notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/marketplace/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, status: 'read' } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleSendTestNotification = async (type: 'high_value' | 'admin_mention') => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      let payload: any;
      if (type === 'high_value') {
        payload = {
          type: 'high_value_listing',
          listing: {
            id: `test_${Date.now()}`,
            car_name: 'Nissan Skyline GT-R R34 Nismo Z-Tune (Test)',
            casting_model: 'Skyline GT-R R34',
            series: 'Hot Wheels Premium - Car Culture',
            scale: '1:64',
            condition: 'Carded - Mint',
            asking_price: 2499,
            reseller_name: 'Rajesh Varma',
            reseller_phone: '+91 98450 11223',
            reseller_email: 'collector.rajesh@gmail.com',
            reseller_city: 'Bangalore, KA',
            payment_utr: 'UPI/329482938492',
          },
        };
      } else {
        payload = {
          type: 'admin_mention',
          message: {
            id: `test_msg_${Date.now()}`,
            listing_id: 'reseller_th_skyline_r34',
            conversation_id: 'conv_demo_skyline_1',
            sender_name: 'Sameer Sen',
            sender_role: 'buyer',
            message: '@admin Urgent: Does the seller offer express courier with hard blister protectors?',
          },
          senderName: 'Sameer Sen',
          senderContact: '+91 98711 22334',
        };
      }

      const res = await fetch('/api/marketplace/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setTestResult('Notification dispatched and logged to database! Email sent to shkofficialazman@gmail.com.');
        await fetchNotifications();
      } else {
        setTestResult(`Error: ${data.message || 'Dispatch failed'}`);
      }
    } catch (err: any) {
      setTestResult(`Failed: ${err.message}`);
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setTestResult(null), 6000);
    }
  };

  const filtered = notifications.filter(n => {
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <div className="space-y-4">
      {/* Top Controls & Test Dispatch Bar */}
      <div className="bg-zinc-900 text-white rounded-2xl p-4 sm:p-5 border border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold font-mono uppercase tracking-wide">
                Automated Admin Notification Feed
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-red-500 text-white animate-pulse">
                  {unreadCount} NEW
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Instant email summaries sent to <strong className="text-zinc-200">shkofficialazman@gmail.com</strong> for high-value listings (₹1,500+) and @admin mentions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleSendTestNotification('high_value')}
            disabled={isSendingTest}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Test High-Value Alert</span>
          </button>

          <button
            onClick={() => handleSendTestNotification('admin_mention')}
            disabled={isSendingTest}
            className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 border border-red-800/60 text-red-200 rounded-xl text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Shield className="w-3.5 h-3.5 text-red-400" />
            <span>Test @admin Mention</span>
          </button>

          <button
            onClick={fetchNotifications}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-500' : ''}`} />
          </button>
        </div>
      </div>

      {testResult && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{testResult}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer ${
            filterType === 'all'
              ? 'bg-zinc-900 text-white'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          onClick={() => setFilterType('high_value_listing')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer ${
            filterType === 'high_value_listing'
              ? 'bg-amber-600 text-white'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          High-Value Listings ({notifications.filter(n => n.type === 'high_value_listing').length})
        </button>
        <button
          onClick={() => setFilterType('admin_mention')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer ${
            filterType === 'admin_mention'
              ? 'bg-red-600 text-white'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          @admin Mentions ({notifications.filter(n => n.type === 'admin_mention').length})
        </button>
      </div>

      {/* Notification Items List */}
      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 text-xs font-mono text-zinc-400">
          Loading notification logs...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <div className="text-sm font-bold font-mono text-zinc-800">All Clear! No alerts pending.</div>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            You will receive email notifications automatically when sellers list castings asking ₹1,500 or more, or when users mention @admin in chat.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const isHighValue = item.type === 'high_value_listing';
            const isUnread = item.status === 'unread';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
                  isUnread
                    ? isHighValue
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-red-300 bg-red-50/20'
                    : 'border-zinc-200'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isHighValue
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isHighValue ? <IndianRupee className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
                          isHighValue
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-red-100 text-red-900 border border-red-300'
                        }`}
                      >
                        {isHighValue ? 'High-Value Listing' : '@admin Mention'}
                      </span>
                      {isUnread && (
                        <span className="text-[10px] font-mono font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">
                          NEW
                        </span>
                      )}
                      <span className="text-xs font-bold text-zinc-900 font-mono">
                        {item.title}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 font-sans leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{new Date(item.created_at).toLocaleString()}</span>
                      </span>

                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Sent to {item.recipient_email}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                  {item.email_html_body && (
                    <button
                      onClick={() => setSelectedPreviewNotification(item)}
                      className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1 cursor-pointer"
                      title="Preview dispatched email content"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Email Preview</span>
                    </button>
                  )}

                  {item.details?.listing_id && onOpenChatWithListing && (
                    <button
                      onClick={() => onOpenChatWithListing(item.details.listing_id!)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <span>Open Chat</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isUnread && (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-mono font-medium transition flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Read</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Email Body Preview Modal */}
      {selectedPreviewNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] border border-zinc-200 shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-zinc-950 text-white p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-red-400 uppercase font-bold tracking-widest">
                  Dispatched Email Summary
                </div>
                <h4 className="text-sm font-bold font-mono text-zinc-100">
                  {selectedPreviewNotification.email_preview_subject || selectedPreviewNotification.title}
                </h4>
              </div>
              <button
                onClick={() => setSelectedPreviewNotification(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <div className="text-xs font-mono bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-1">
                <div><strong>Recipient:</strong> {selectedPreviewNotification.recipient_email}</div>
                <div><strong>Dispatched At:</strong> {new Date(selectedPreviewNotification.created_at).toLocaleString()}</div>
                <div><strong>Notification Type:</strong> {selectedPreviewNotification.type}</div>
              </div>

              {selectedPreviewNotification.email_html_body ? (
                <div
                  className="prose prose-sm max-w-none border border-zinc-200 rounded-2xl p-4 bg-white shadow-xs"
                  dangerouslySetInnerHTML={{ __html: selectedPreviewNotification.email_html_body }}
                />
              ) : (
                <p className="text-xs text-zinc-600 font-sans">
                  {selectedPreviewNotification.summary}
                </p>
              )}
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setSelectedPreviewNotification(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-mono font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
