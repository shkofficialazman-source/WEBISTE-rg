import React, { useState, useEffect, useMemo } from 'react';
import { ReferralCode, ReferralDiscountType } from '../../types';
import {
  fetchReferralCodesFromSupabase,
  createReferralCodeInSupabase,
  updateReferralCodeInSupabase,
  deleteReferralCodeInSupabase,
} from '../../referrals';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Percent,
  IndianRupee,
  RefreshCw,
  AlertCircle,
  X,
  Check,
  Copy,
} from 'lucide-react';

export const ReferralCodesTab: React.FC = () => {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'collector' | 'promo'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<ReferralCode | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingCodeId, setDeletingCodeId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as ReferralDiscountType,
    discountValue: 10,
    active: true,
    maxUses: '' as string | number,
    minOrderAmount: '' as string | number,
    isCollectorReferral: false,
    creatorName: '',
    creatorEmail: '',
  });

  const loadCodes = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchReferralCodesFromSupabase();
      setCodes(data);
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage('Failed to load referral codes.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCodes();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingCode(null);
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 10,
      active: true,
      maxUses: '',
      minOrderAmount: '',
      isCollectorReferral: false,
      creatorName: '',
      creatorEmail: '',
    });
    setErrorMessage('');
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (code: ReferralCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      discountType: code.discountType,
      discountValue: code.discountValue,
      active: code.active,
      maxUses: code.maxUses !== null && code.maxUses !== undefined ? code.maxUses : '',
      minOrderAmount: code.minOrderAmount !== null && code.minOrderAmount !== undefined ? code.minOrderAmount : '',
      isCollectorReferral: Boolean(code.isCollectorReferral),
      creatorName: code.creatorName || '',
      creatorEmail: code.creatorEmail || '',
    });
    setErrorMessage('');
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  const handleSaveCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setErrorMessage('Code cannot be empty.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const maxUsesVal = formData.maxUses === '' ? null : Number(formData.maxUses);
      const minOrderVal = formData.minOrderAmount === '' ? null : Number(formData.minOrderAmount);

      if (editingCode) {
        // Update in Supabase
        const updated = await updateReferralCodeInSupabase(editingCode.id, {
          code: formData.code,
          discountType: formData.discountType,
          discountValue: Number(formData.discountValue),
          active: formData.active,
          maxUses: maxUsesVal,
          minOrderAmount: minOrderVal,
        });

        if (updated) {
          await loadCodes();
          setSuccessMessage(`Updated code "${updated.code}" successfully in database.`);
        }
      } else {
        // Create in Supabase
        const created = await createReferralCodeInSupabase({
          code: formData.code,
          discountType: formData.discountType,
          discountValue: Number(formData.discountValue),
          active: formData.active,
          maxUses: maxUsesVal,
          minOrderAmount: minOrderVal,
        });

        await loadCodes();
        setSuccessMessage(`Created promo code "${created.code}" in database!`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save referral code.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (code: ReferralCode) => {
    try {
      const updated = await updateReferralCodeInSupabase(code.id, { active: !code.active });
      if (updated) {
        await loadCodes();
        setSuccessMessage(`Code "${code.code}" is now ${!code.active ? 'Active' : 'Disabled'}.`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to toggle code status in database.');
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    try {
      await deleteReferralCodeInSupabase(codeId);
      await loadCodes();
      setDeletingCodeId(null);
      setSuccessMessage('Referral code removed from database.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete code.');
    }
  };

  const totalDiscountsGiven = codes.reduce((acc, c) => acc + (c.totalDiscountGiven || 0), 0);
  const totalUsesCount = codes.reduce((acc, c) => acc + (c.usesCount || 0), 0);

  const collectorCodes = useMemo(() => codes.filter(c => c.isCollectorReferral || c.creatorUid), [codes]);
  const storePromoCodes = useMemo(() => codes.filter(c => !c.isCollectorReferral && !c.creatorUid), [codes]);

  const displayedCodes = useMemo(() => {
    if (filterType === 'collector') return collectorCodes;
    if (filterType === 'promo') return storePromoCodes;
    return codes;
  }, [codes, filterType, collectorCodes, storePromoCodes]);

  const handleCopyLink = (codeStr: string, id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/?ref=${codeStr}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-black uppercase italic tracking-tight text-zinc-900 font-sans">
              Referral & Promo Codes Management
            </h2>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Create discount codes, track Collector VIP referrals, and view live conversion metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCodes}
            disabled={isRefreshing}
            className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition cursor-pointer disabled:opacity-50 min-h-[40px] min-w-[40px] flex items-center justify-center border border-zinc-200"
            title="Refresh Codes"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-red-600' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-red-600/20 cursor-pointer min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Code</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 font-mono">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] uppercase text-zinc-500 font-bold">Active Codes</div>
          <div className="text-xl sm:text-2xl font-black text-zinc-900 mt-1">
            {codes.filter(c => c.active).length} <span className="text-xs text-zinc-400 font-normal">/ {codes.length}</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] uppercase text-zinc-500 font-bold">Collector Referrals</div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 mt-1">
            {collectorCodes.length} <span className="text-xs text-zinc-400 font-normal">VIPs</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] uppercase text-zinc-500 font-bold">Total Redemptions</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
            {totalUsesCount} <span className="text-xs text-zinc-400 font-normal">orders</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] uppercase text-zinc-500 font-bold">Total Discounts Given</div>
          <div className="text-xl sm:text-2xl font-black text-red-600 mt-1">
            ₹{totalDiscountsGiven.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Codes Table with Category Filter */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50">
          <div className="flex items-center gap-1.5 bg-zinc-200/70 p-1 rounded-xl font-mono text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                filterType === 'all' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All ({codes.length})
            </button>
            <button
              onClick={() => setFilterType('collector')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filterType === 'collector' ? 'bg-purple-600 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <span>Collector Referrals ({collectorCodes.length})</span>
            </button>
            <button
              onClick={() => setFilterType('promo')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                filterType === 'promo' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Store Promo ({storePromoCodes.length})
            </button>
          </div>

          <span className="text-[11px] text-zinc-500 font-mono">
            Synced live with Supabase database
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono">
            Loading referral codes...
          </div>
        ) : displayedCodes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Tag className="w-10 h-10 text-zinc-300 mx-auto" />
            <div className="font-bold text-sm text-zinc-800">No referral codes found in this filter</div>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {filterType === 'collector'
                ? 'No collector referral codes have been created by users yet.'
                : 'Create your first code like "AZMAN10" to offer discounts to your customers!'}
            </p>
            {filterType !== 'collector' && (
              <button
                onClick={handleOpenCreateModal}
                className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase px-4 py-2 rounded-xl cursor-pointer"
              >
                Create Code
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-100/75 border-b border-zinc-200 text-zinc-600 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5 pl-4">Code / Creator</th>
                  <th className="p-3.5">Discount</th>
                  <th className="p-3.5">Min Order</th>
                  <th className="p-3.5">Usage / Limit</th>
                  <th className="p-3.5">Total Savings Given</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {displayedCodes.map(code => {
                  const isCollector = Boolean(code.isCollectorReferral || code.creatorUid);
                  return (
                    <tr key={code.id} className="hover:bg-zinc-50/75 transition-colors">
                      <td className="p-3.5 pl-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-zinc-900 bg-zinc-100 border border-zinc-300 px-2 py-0.5 rounded-lg tracking-wider">
                              {code.code}
                            </span>
                            {isCollector && (
                              <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase">
                                Collector VIP
                              </span>
                            )}
                          </div>
                          {isCollector && (code.creatorName || code.creatorEmail) && (
                            <div className="text-[10px] text-zinc-500 truncate max-w-[200px]">
                              Created by: <span className="text-zinc-800 font-semibold">{code.creatorName || code.creatorEmail}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-zinc-900">
                          {code.discountType === 'percentage'
                            ? `${code.discountValue}% OFF`
                            : `₹${code.discountValue} FLAT OFF`}
                        </span>
                      </td>
                      <td className="p-3.5 text-zinc-600">
                        {code.minOrderAmount ? `₹${code.minOrderAmount}` : 'None (₹0)'}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-zinc-900">{code.usesCount || 0}</span>
                        <span className="text-zinc-500">
                          {' '}
                          / {code.maxUses !== null && code.maxUses !== undefined ? code.maxUses : '∞ Unlimited'}
                        </span>
                      </td>
                      <td className="p-3.5 text-red-600 font-bold">
                        ₹{(code.totalDiscountGiven || 0).toFixed(2)}
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleActive(code)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase cursor-pointer border ${
                            code.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-zinc-100 text-zinc-500 border-zinc-300'
                          }`}
                          title="Click to toggle active state"
                        >
                          {code.active ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopyLink(code.code, code.id)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
                            title="Copy Referral Link"
                          >
                            {copiedCodeId === code.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(code)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
                            title="Edit Code"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingCodeId(code.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                            title="Delete Code"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-left">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-black uppercase text-zinc-900 font-sans">
                  {editingCode ? `Edit Code: ${editingCode.code}` : 'Create New Referral Code'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCode} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-zinc-600 mb-1 font-bold">
                  Code Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. AZMAN10, SPEED20"
                  className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs font-mono font-bold uppercase text-zinc-900 focus:border-red-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-zinc-600 mb-1 font-bold">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        discountType: e.target.value as ReferralDiscountType,
                      }))
                    }
                    className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-zinc-600 mb-1 font-bold">
                    Discount Value <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.discountValue}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        discountValue: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-zinc-600 mb-1 font-bold">
                    Min Order (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional (e.g. 499)"
                    value={formData.minOrderAmount}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        minOrderAmount: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-zinc-600 mb-1 font-bold">
                    Max Total Uses
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Blank = Unlimited"
                    value={formData.maxUses}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        maxUses: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="codeActiveCheck"
                  checked={formData.active}
                  onChange={e => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded border-zinc-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="codeActiveCheck" className="text-xs text-zinc-800 font-bold cursor-pointer">
                  Activate this code immediately
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingCode ? 'Save Changes' : 'Create Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCodeId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 font-mono">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-zinc-900 text-sm font-sans uppercase">Delete Referral Code?</h3>
              <p className="text-xs text-zinc-500">
                Customers will no longer be able to apply this discount during checkout.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingCodeId(null)}
                className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCode(deletingCodeId)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
