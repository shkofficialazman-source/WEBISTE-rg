import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, 
  Search, 
  Plus, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Package, 
  Send, 
  Copy, 
  Check, 
  AlertCircle, 
  X, 
  Phone, 
  Link as LinkIcon,
  Database,
  ChevronRight,
  Filter
} from 'lucide-react';
import { OrderTracking, TrackingStatus } from '../../types';
import { 
  fetchAllOrderTracking, 
  addOrderTrackingEntry, 
  updateOrderTrackingEntry, 
  deleteOrderTrackingEntry, 
  subscribeToOrderTracking,
  generateCourierTrackingLink 
} from '../../supabase';
import { SUPABASE_ORDER_TRACKING_SQL } from '../../data/supabaseOrderTrackingSchema';

const COURIER_PRESETS = [
  { name: 'DTDC Courier', slug: 'dtdc' },
  { name: 'Blue Dart Express', slug: 'bluedart' },
  { name: 'Delhivery Express', slug: 'delhivery' },
  { name: 'India Post (Speed Post)', slug: 'indiapost' },
  { name: 'Xpressbees Logistics', slug: 'xpressbees' },
  { name: 'Ecom Express', slug: 'ecom' },
  { name: 'Shadowfax', slug: 'shadowfax' },
  { name: 'Shiprocket', slug: 'shiprocket' },
  { name: 'Other Courier', slug: 'other' }
];

const TRACKING_STATUSES: TrackingStatus[] = [
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered'
];

export const OrderTrackingTab: React.FC = () => {
  const [trackingList, setTrackingList] = useState<OrderTracking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<OrderTracking | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedAwbId, setCopiedAwbId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    customer_phone: '',
    order_id: '',
    tracking_id: '',
    courier_name: 'DTDC Courier',
    tracking_link: '',
    status: 'Processing' as TrackingStatus,
  });

  const loadData = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const data = await fetchAllOrderTracking();
      setTrackingList(data);
    } catch (err: any) {
      console.error('Failed to load tracking data:', err);
      setActionError(err.message || 'Failed to fetch tracking entries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToOrderTracking((fresh) => {
      setTrackingList(fresh);
    });
    return () => unsub();
  }, []);

  // Filtered entries
  const filteredList = useMemo(() => {
    return trackingList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (item.customer_phone || '').toLowerCase().includes(q) ||
        (item.order_id || '').toLowerCase().includes(q) ||
        (item.tracking_id || '').toLowerCase().includes(q) ||
        (item.courier_name || '').toLowerCase().includes(q);

      const matchesStatus = 
        statusFilter === 'all' || 
        (item.status || '').toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [trackingList, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = trackingList.length;
    const processing = trackingList.filter(t => t.status === 'Processing').length;
    const shipped = trackingList.filter(t => t.status === 'Shipped').length;
    const outForDelivery = trackingList.filter(t => t.status === 'Out for Delivery').length;
    const delivered = trackingList.filter(t => t.status === 'Delivered').length;
    return { total, processing, shipped, outForDelivery, delivered };
  }, [trackingList]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingEntry(null);
    setFormData({
      customer_phone: '',
      order_id: '',
      tracking_id: '',
      courier_name: 'DTDC Courier',
      tracking_link: '',
      status: 'Processing',
    });
    setActionError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (item: OrderTracking) => {
    setEditingEntry(item);
    setFormData({
      customer_phone: item.customer_phone || '',
      order_id: item.order_id || '',
      tracking_id: item.tracking_id || '',
      courier_name: item.courier_name || 'DTDC Courier',
      tracking_link: item.tracking_link || '',
      status: (item.status as TrackingStatus) || 'Processing',
    });
    setActionError(null);
    setIsModalOpen(true);
  };

  // Handle Courier / AWB change to auto-update link
  const handleCourierOrAwbChange = (courier: string, awb: string) => {
    const autoLink = generateCourierTrackingLink(courier, awb);
    setFormData(prev => ({
      ...prev,
      courier_name: courier,
      tracking_id: awb,
      tracking_link: autoLink || prev.tracking_link,
    }));
  };

  // Save Entry
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_phone.trim()) {
      setActionError('Customer phone number is required');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      if (editingEntry) {
        await updateOrderTrackingEntry(editingEntry.id, {
          customer_phone: formData.customer_phone,
          order_id: formData.order_id,
          tracking_id: formData.tracking_id,
          courier_name: formData.courier_name,
          tracking_link: formData.tracking_link || generateCourierTrackingLink(formData.courier_name, formData.tracking_id),
          status: formData.status,
        });
      } else {
        await addOrderTrackingEntry({
          customer_phone: formData.customer_phone,
          order_id: formData.order_id,
          tracking_id: formData.tracking_id,
          courier_name: formData.courier_name,
          tracking_link: formData.tracking_link || generateCourierTrackingLink(formData.courier_name, formData.tracking_id),
          status: formData.status,
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Error saving tracking entry:', err);
      setActionError(err.message || 'Failed to save tracking record');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Status Update
  const handleQuickStatusChange = async (id: string, newStatus: TrackingStatus) => {
    try {
      await updateOrderTrackingEntry(id, { status: newStatus });
      setTrackingList(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    } catch (err: any) {
      console.error('Quick status update failed:', err);
      alert(`Could not update status: ${err.message}`);
    }
  };

  // Delete Entry
  const handleDelete = async (id: string) => {
    try {
      await deleteOrderTrackingEntry(id);
      setDeleteConfirmId(null);
      setTrackingList(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert(`Could not delete: ${err.message}`);
    }
  };

  // Copy AWB
  const handleCopyAwb = (awb: string, id: string) => {
    navigator.clipboard.writeText(awb);
    setCopiedAwbId(id);
    setTimeout(() => setCopiedAwbId(null), 2000);
  };

  // Copy Supabase SQL
  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_ORDER_TRACKING_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // WhatsApp Notification Link Generator
  const getWhatsAppNotifyUrl = (item: OrderTracking) => {
    const rawPhone = (item.customer_phone || '').replace(/[^0-9]/g, '');
    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const trackingLink = item.tracking_link || (item.tracking_id ? `https://redlinegarage.store/track-order?phone=${rawPhone}` : 'https://redlinegarage.store/track-order');
    const text = encodeURIComponent(
      `🏁 *Redline Garage India — Order Shipment Update*\n\n` +
      `Hello Collector! Your order *${item.order_id || 'Redline Vault'}* is *${item.status}*.\n\n` +
      `📦 Courier: ${item.courier_name || 'Express Dispatch'}\n` +
      `🔖 AWB / Tracking ID: ${item.tracking_id || 'N/A'}\n` +
      `🔗 Track Live: ${trackingLink}\n\n` +
      `Your die-cast models are protected with armored box packaging. Thank you for choosing Redline Garage!`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Out for Delivery':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Processing':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Header & Quick Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase text-zinc-900 tracking-wider">
                Order Tracking &amp; Courier Dispatch
              </h2>
              <p className="text-zinc-500 text-[11px]">
                Manage live package tracking IDs, courier URLs &amp; customer shipment updates in Supabase
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="View Supabase SQL schema"
          >
            <Database className="w-3.5 h-3.5 text-zinc-600" />
            <span>Supabase SQL</span>
          </button>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tracking Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-zinc-200 p-3.5 rounded-2xl">
          <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Total Shipments</div>
          <div className="text-xl font-black text-zinc-900">{stats.total}</div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-2xl">
          <div className="text-[10px] text-amber-700 uppercase font-bold mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Processing
          </div>
          <div className="text-xl font-black text-amber-900">{stats.processing}</div>
        </div>

        <div className="bg-blue-50/60 border border-blue-200 p-3.5 rounded-2xl">
          <div className="text-[10px] text-blue-700 uppercase font-bold mb-1 flex items-center gap-1">
            <Truck className="w-3 h-3" /> Shipped
          </div>
          <div className="text-xl font-black text-blue-900">{stats.shipped}</div>
        </div>

        <div className="bg-purple-50/60 border border-purple-200 p-3.5 rounded-2xl">
          <div className="text-[10px] text-purple-700 uppercase font-bold mb-1 flex items-center gap-1">
            <Package className="w-3 h-3" /> Out For Delivery
          </div>
          <div className="text-xl font-black text-purple-900">{stats.outForDelivery}</div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-2xl col-span-2 sm:col-span-1">
          <div className="text-[10px] text-emerald-700 uppercase font-bold mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </div>
          <div className="text-xl font-black text-emerald-900">{stats.delivered}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer phone, order ID, AWB or courier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 focus:bg-white text-zinc-900 pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-hidden transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              All ({trackingList.length})
            </button>
            {TRACKING_STATUSES.map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter.toLowerCase() === st.toLowerCase()
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tracking Table / List */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
        {isLoading && trackingList.length === 0 ? (
          <div className="py-16 text-center text-zinc-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-red-600 mb-2" />
            <p>Loading order tracking entries from Supabase...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Package className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <h4 className="text-zinc-800 font-bold text-sm uppercase mb-1">No Tracking Entries Found</h4>
            <p className="text-zinc-500 text-xs max-w-sm mx-auto mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'No tracking records matched your search filters. Try clearing your search.'
                : 'No shipment tracking entries have been recorded in Supabase yet.'}
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Entry</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">Customer Phone</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Courier Partner</th>
                  <th className="py-3 px-4">Tracking AWB</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Direct Link</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {filteredList.map((entry) => {
                  const trackingLink = entry.tracking_link || generateCourierTrackingLink(entry.courier_name || '', entry.tracking_id || '');
                  return (
                    <tr key={entry.id} className="hover:bg-zinc-50/80 transition-colors">
                      {/* Customer Phone */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900">{entry.customer_phone}</span>
                          <a
                            href={getWhatsAppNotifyUrl(entry)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Send WhatsApp Update to Customer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {entry.created_at ? new Date(entry.created_at).toLocaleDateString('en-IN') : 'Recent'}
                        </div>
                      </td>

                      {/* Order ID */}
                      <td className="py-3 px-4">
                        {entry.order_id ? (
                          <span className="bg-zinc-100 text-zinc-800 font-bold px-2 py-0.5 rounded border border-zinc-200">
                            {entry.order_id}
                          </span>
                        ) : (
                          <span className="text-zinc-400 italic">—</span>
                        )}
                      </td>

                      {/* Courier Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-800">{entry.courier_name || 'Standard Express'}</div>
                      </td>

                      {/* Tracking ID / AWB */}
                      <td className="py-3 px-4">
                        {entry.tracking_id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded text-[11px]">
                              {entry.tracking_id}
                            </span>
                            <button
                              onClick={() => handleCopyAwb(entry.tracking_id!, entry.id)}
                              className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors cursor-pointer"
                              title="Copy Tracking ID"
                            >
                              {copiedAwbId === entry.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">Not Assigned</span>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-4">
                        <select
                          value={entry.status}
                          onChange={(e) => handleQuickStatusChange(entry.id, e.target.value as TrackingStatus)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border focus:outline-hidden cursor-pointer ${getStatusBadgeClass(entry.status)}`}
                        >
                          {TRACKING_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Direct Courier Link */}
                      <td className="py-3 px-4">
                        {trackingLink ? (
                          <a
                            href={trackingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-[11px] hover:underline"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-zinc-400 italic">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(entry)}
                            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Entry"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {deleteConfirmId === entry.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(entry.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* ADD / EDIT TRACKING MODAL */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative font-mono text-xs animate-fade-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black uppercase text-zinc-900 mb-1 flex items-center gap-2">
              <Truck className="w-4 h-4 text-red-600" />
              <span>{editingEntry ? 'Edit Tracking Entry' : 'Add New Tracking Entry'}</span>
            </h3>
            <p className="text-zinc-500 text-[11px] mb-4">
              Enter customer mobile number and dispatch courier details for live tracking
            </p>

            {actionError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEntry} className="space-y-4">
              {/* Customer Phone */}
              <div>
                <label className="block text-zinc-700 uppercase text-[10px] font-bold mb-1">
                  Customer Phone Number <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    placeholder="e.g. 9876543210 or +91 98765 43210"
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-hidden"
                  />
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">
                  Customer will use this phone number to search their shipment status.
                </div>
              </div>

              {/* Order ID */}
              <div>
                <label className="block text-zinc-700 uppercase text-[10px] font-bold mb-1">
                  Order ID / Reference Number (Optional)
                </label>
                <div className="relative">
                  <Package className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.order_id}
                    onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                    placeholder="e.g. RLG-2026-8891"
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Courier Name */}
                <div>
                  <label className="block text-zinc-700 uppercase text-[10px] font-bold mb-1">
                    Courier Partner
                  </label>
                  <select
                    value={formData.courier_name}
                    onChange={(e) => handleCourierOrAwbChange(e.target.value, formData.tracking_id)}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden cursor-pointer"
                  >
                    {COURIER_PRESETS.map((c) => (
                      <option key={c.slug} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-zinc-700 uppercase text-[10px] font-bold mb-1">
                    Current Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TrackingStatus })}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden cursor-pointer font-bold"
                  >
                    {TRACKING_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tracking ID / AWB */}
              <div>
                <label className="block text-zinc-700 uppercase text-[10px] font-bold mb-1">
                  Tracking ID / AWB Consignment Number
                </label>
                <input
                  type="text"
                  value={formData.tracking_id}
                  onChange={(e) => handleCourierOrAwbChange(formData.courier_name, e.target.value)}
                  placeholder="e.g. D39827110 or BLU998273"
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden"
                />
              </div>

              {/* Tracking Link (Auto-generated or custom) */}
              <div>
                <label className="block text-zinc-700 uppercase text-[10px] font-bold mb-1 flex items-center justify-between">
                  <span>Courier Tracking URL</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Auto-Generated</span>
                </label>
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={formData.tracking_link}
                    onChange={(e) => setFormData({ ...formData, tracking_link: e.target.value })}
                    placeholder="https://www.dtdc.in/tracking/..."
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-hidden font-sans"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-600 hover:text-zinc-900 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Tracking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUPABASE SQL SCHEMA MODAL */}
      {/* ========================================================= */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative font-mono text-xs text-zinc-200 animate-fade-in max-h-[85vh] flex flex-col">
            <button
              onClick={() => setIsSqlModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Supabase SQL Schema — order_tracking
              </h3>
            </div>
            <p className="text-zinc-400 text-[11px] mb-3">
              Run this SQL script in your Supabase Project &rarr; SQL Editor to create or configure the table with indexes and RLS policies.
            </p>

            <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-[11px] text-zinc-300 font-mono select-all">
              <pre>{SUPABASE_ORDER_TRACKING_SQL}</pre>
            </div>

            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-zinc-800">
              <span className="text-[10px] text-zinc-500">
                Includes RLS public read policy &amp; customer_phone index
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Script'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
