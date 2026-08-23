import React, { useState, useEffect, useMemo } from 'react';
import { NewsletterSubscriber } from '../../types';
import {
  fetchNewsletterSubscribersFromFirestore,
  updateNewsletterSubscriberInFirestore,
  deleteNewsletterSubscriberFromFirestore,
  subscribeToNewsletterInFirestore,
} from '../../firebase';
import {
  Mail,
  Search,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Users,
  Send,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Tag,
  Clock,
  Filter,
} from 'lucide-react';

export const SubscribersTab: React.FC = () => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [isCopiedAll, setIsCopiedAll] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newSource, setNewSource] = useState<string>('admin_manual');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Campaign Composer Modal / Preview State
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState<boolean>(false);
  const [campaignSubject, setCampaignSubject] = useState<string>('🏎️ New Mainline Drop Alert: 2026 Factory Fresh In Stock!');
  const [campaignBody, setCampaignBody] = useState<string>(
    'Hey Die-Cast Collector!\n\nWe just unboxed a fresh batch of Hot Wheels Mainlines, including Treasure Hunts and custom shadowbox frames.\n\nUse your exclusive VIP discount code: VIPGARAGE10 for 10% off your next order.\n\nBrowse the garage: https://redline-garage-shop.firebaseapp.com\n\nHappy collecting,\nRedline Garage Team'
  );

  const loadSubscribers = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchNewsletterSubscribersFromFirestore();
      setSubscribers(data);
    } catch (err) {
      console.error('Failed to load newsletter subscribers:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, []);

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      const matchesSearch =
        sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.name && sub.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sub.couponCodeIssued && sub.couponCodeIssued.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sub.source && sub.source.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [subscribers, searchTerm, statusFilter]);

  const activeCount = useMemo(() => {
    return subscribers.filter((s) => s.status === 'active').length;
  }, [subscribers]);

  const handleCopyAllEmails = () => {
    const activeEmails = subscribers
      .filter((s) => s.status === 'active')
      .map((s) => s.email)
      .join(', ');

    if (!activeEmails) return;
    navigator.clipboard.writeText(activeEmails);
    setIsCopiedAll(true);
    setTimeout(() => setIsCopiedAll(false), 2500);
  };

  const handleCopySingleEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) return;

    const headers = ['Email', 'Name', 'Status', 'Source', 'Subscribed Date', 'Coupon Issued', 'Tags'];
    const rows = subscribers.map((s) => [
      `"${s.email}"`,
      `"${s.name || ''}"`,
      `"${s.status}"`,
      `"${s.source || 'footer'}"`,
      `"${new Date(s.subscribedAt).toLocaleDateString()}"`,
      `"${s.couponCodeIssued || 'VIPGARAGE10'}"`,
      `"${(s.tags || []).join(';')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `redline_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleStatus = async (sub: NewsletterSubscriber) => {
    const nextStatus = sub.status === 'active' ? 'unsubscribed' : 'active';
    try {
      await updateNewsletterSubscriberInFirestore(sub.id, { status: nextStatus });
      setSubscribers((prev) =>
        prev.map((item) => (item.id === sub.id ? { ...item, status: nextStatus } : item))
      );
    } catch (err) {
      console.error('Failed to update subscriber status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this subscriber from the list?')) return;
    try {
      await deleteNewsletterSubscriberFromFirestore(id);
      setSubscribers((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to delete subscriber:', err);
    }
  };

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setActionMessage({ type: 'error', text: 'Please provide a valid email address.' });
      return;
    }

    setIsSubmitting(true);
    setActionMessage(null);

    try {
      const res = await subscribeToNewsletterInFirestore(
        newEmail.trim(),
        newName.trim(),
        newSource,
        ['vip_pit_pass', 'manual_import']
      );

      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        setNewEmail('');
        setNewName('');
        await loadSubscribers();
        setTimeout(() => {
          setIsAddModalOpen(false);
          setActionMessage(null);
        }, 1500);
      } else {
        setActionMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to add subscriber.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendViaMailClient = () => {
    const activeEmails = subscribers
      .filter((s) => s.status === 'active')
      .map((s) => s.email)
      .join(',');

    const mailtoUrl = `mailto:?bcc=${encodeURIComponent(activeEmails)}&subject=${encodeURIComponent(
      campaignSubject
    )}&body=${encodeURIComponent(campaignBody)}`;

    window.open(mailtoUrl, '_blank');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Total Subscribers</span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 mt-2">{subscribers.length}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Collected via Footer & VIP Pass</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 text-xs">
            <span>Active Marketing Reach</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">{activeCount}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Ready for product drop alerts</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-red-600 text-xs">
            <span>VIP Welcome Promo</span>
            <Tag className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-extrabold text-red-600 mt-2">VIPGARAGE10</div>
          <div className="text-[11px] text-zinc-500 mt-1">10% discount delivered on signup</div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 font-mono">
        {/* Search & Filter */}
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email, name, or source..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-red-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-hidden text-zinc-700"
            >
              <option value="all">All Statuses ({subscribers.length})</option>
              <option value="active">Active Only ({activeCount})</option>
              <option value="unsubscribed">Unsubscribed ({subscribers.length - activeCount})</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyAllEmails}
            disabled={activeCount === 0}
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Copy all active subscriber emails formatted for BCC email sending"
          >
            {isCopiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>COPIED ({activeCount})</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>COPY ALL EMAILS</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={subscribers.length === 0}
            className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Export CSV for Mailchimp, Brevo, or Google Sheets"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCampaignModalOpen(true)}
            className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>SEND BROADCAST</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-red-600" />
            <span>ADD SUBSCRIBER</span>
          </button>

          <button
            type="button"
            onClick={loadSubscribers}
            disabled={isRefreshing}
            className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden font-mono">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Email Address</th>
                <th className="px-4 py-3.5">Subscriber Name</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Source</th>
                <th className="px-4 py-3.5">Subscribed Date</th>
                <th className="px-4 py-3.5">Coupon Issued</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
                      <span>Loading newsletter subscribers...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400 space-y-2">
                    <Mail className="w-8 h-8 mx-auto text-zinc-300" />
                    <p className="text-zinc-600 font-bold">No subscribers found</p>
                    <p className="text-zinc-400 text-[11px]">
                      {searchTerm ? 'Try adjusting your search terms or filters.' : 'Emails submitted in the Footer form will appear here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-zinc-900">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{sub.email}</span>
                        <button
                          type="button"
                          onClick={() => handleCopySingleEmail(sub.email, sub.id)}
                          className="text-zinc-400 hover:text-zinc-700 transition-colors ml-1 cursor-pointer"
                          title="Copy email"
                        >
                          {copiedId === sub.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-600">
                      {sub.name || <span className="text-zinc-400 italic">Anonymous</span>}
                    </td>

                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(sub)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                          sub.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                        }`}
                        title="Click to toggle active/unsubscribed"
                      >
                        {sub.status === 'active' ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                            <span>Unsubscribed</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-500 text-[11px]">
                      <span className="px-2 py-0.5 bg-zinc-100 rounded-md text-zinc-600">
                        {sub.source || 'footer'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-500 text-[11px]">
                      {new Date(sub.subscribedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-red-600 font-bold text-[11px] bg-red-50 border border-red-100 px-2 py-0.5 rounded-md">
                        {sub.couponCodeIssued || 'VIPGARAGE10'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(sub.id)}
                        className="text-zinc-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                        title="Delete subscriber"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add Subscriber Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-extrabold text-sm text-zinc-900 uppercase">Add Newsletter Subscriber</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubscriber} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="customer@gmail.com"
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">Collector Name (Optional)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">Subscription Source</label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-hidden text-zinc-700"
                >
                  <option value="admin_manual">Admin Manual Add</option>
                  <option value="whatsapp_chat">WhatsApp Chat Inquiry</option>
                  <option value="instagram_dm">Instagram Direct Message</option>
                  <option value="offline_event">Pop-up / Die-Cast Meetup</option>
                </select>
              </div>

              {actionMessage && (
                <div
                  className={`p-2.5 rounded-xl text-xs ${
                    actionMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {actionMessage.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Saving...' : 'Add to List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Campaign Composer Modal */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-red-600" />
                <h3 className="font-extrabold text-sm text-zinc-900 uppercase">Marketing Campaign Broadcast</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCampaignModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-[11px] text-zinc-600 flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-900">Recipients:</span> {activeCount} Active Collectors (BCC)
                </div>
                <button
                  type="button"
                  onClick={handleCopyAllEmails}
                  className="text-red-600 hover:underline font-bold"
                >
                  Copy BCC List
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">Email Subject Line</label>
                <input
                  type="text"
                  value={campaignSubject}
                  onChange={(e) => setCampaignSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">Email Body Message</label>
                <textarea
                  rows={6}
                  value={campaignBody}
                  onChange={(e) => setCampaignBody(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-red-500 font-sans"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handleCopyAllEmails}
                  className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {isCopiedAll ? 'BCC Copied!' : 'Copy BCC List'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCampaignModalOpen(false)}
                    className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSendViaMailClient}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Launch in Mail App</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
