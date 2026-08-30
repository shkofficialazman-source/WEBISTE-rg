import React, { useState, useEffect } from 'react';
import { ReferralCode, ReferralDiscountType } from '../../types';
import {
  fetchReferralCodesFromSupabase,
  createReferralCodeInSupabase,
  updateReferralCodeInSupabase,
  deleteReferralCodeFromSupabase,
  validateReferralCode,
  subscribeToReferralCodes,
  REFERRAL_SQL_SCHEMA,
  DEFAULT_REFERRAL_CODES,
} from '../../referrals';
import { supabase } from '../../supabase';
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Trash2,
  Edit3,
  ExternalLink,
  Database,
  Gift,
  Flame,
  Percent,
  IndianRupee,
  Share2,
  Calendar,
  Users,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export const ReferralCodesTab: React.FC = () => {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'collector'>('all');
  
  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCode, setEditingCode] = useState<ReferralCode | null>(null);
  const [formData, setFormData] = useState<{
    code: string;
    discountType: ReferralDiscountType;
    discountValue: number;
    minOrderAmount: number;
    maxUses: string;
    expiresAt: string;
    isCollectorReferral: boolean;
    creatorName: string;
    active: boolean;
  }>({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 0,
    maxUses: '',
    expiresAt: '',
    isCollectorReferral: false,
    creatorName: '',
    active: true,
  });
  const [formError, setFormError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Quick Copy Feedback
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [deletingCodeId, setDeletingCodeId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Interactive Live Code Tester State
  const [testCodeInput, setTestCodeInput] = useState<string>('');
  const [testSubtotalInput, setTestSubtotalInput] = useState<string>('999');
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    isValid: boolean;
    message: string;
    discountAmount: number;
  } | null>(null);

  // Database Connection Diagnostics
  const [dbStatus, setDbStatus] = useState<{
    checked: boolean;
    connected: boolean;
    message: string;
  }>({
    checked: false,
    connected: false,
    message: '',
  });
  const [isCheckingDb, setIsCheckingDb] = useState<boolean>(false);
  const [showSqlDrawer, setShowSqlDrawer] = useState<boolean>(false);

  // Load codes on mount & subscribe to realtime changes
  useEffect(() => {
    loadCodes();
    checkDbConnection();

    const unsubscribe = subscribeToReferralCodes((freshCodes) => {
      setCodes(freshCodes);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadCodes = async () => {
    setIsLoading(true);
    try {
      const data = await fetchReferralCodesFromSupabase();
      setCodes(data);
    } catch (e) {
      console.warn('Failed to fetch referral codes:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const checkDbConnection = async () => {
    setIsCheckingDb(true);
    try {
      const { data, error } = await supabase.from('referral_codes').select('id').limit(1);
      if (error) {
        setDbStatus({
          checked: true,
          connected: false,
          message: `Table missing or unreadable (${error.message}). Run the SQL script in Supabase!`,
        });
      } else {
        setDbStatus({
          checked: true,
          connected: true,
          message: 'Connected to public.referral_codes table in Supabase PostgreSQL.',
        });
      }
    } catch (err: any) {
      setDbStatus({
        checked: true,
        connected: false,
        message: 'Could not connect to Supabase database.',
      });
    } finally {
      setIsCheckingDb(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingCode(null);
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 0,
      maxUses: '',
      expiresAt: '',
      isCollectorReferral: false,
      creatorName: 'Redline Garage Promo',
      active: true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (code: ReferralCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      discountType: code.discountType,
      discountValue: code.discountValue,
      minOrderAmount: code.minOrderAmount || 0,
      maxUses: code.maxUses !== null && code.maxUses !== undefined ? String(code.maxUses) : '',
      expiresAt: code.expiresAt ? code.expiresAt.split('T')[0] : '',
      isCollectorReferral: Boolean(code.isCollectorReferral),
      creatorName: code.creatorName || '',
      active: code.active,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanCode = formData.code.toUpperCase().replace(/\s+/g, '').trim();
    if (!cleanCode) {
      setFormError('Please enter a referral/promo code string.');
      return;
    }

    if (formData.discountValue <= 0) {
      setFormError('Discount value must be greater than 0.');
      return;
    }

    if (formData.discountType === 'percentage' && formData.discountValue > 90) {
      setFormError('Percentage discount cannot exceed 90%.');
      return;
    }

    setIsSaving(true);
    try {
      const maxUsesNum = formData.maxUses ? parseInt(formData.maxUses, 10) : null;
      const expiryIso = formData.expiresAt ? new Date(`${formData.expiresAt}T23:59:59`).toISOString() : undefined;

      if (editingCode) {
        await updateReferralCodeInSupabase(editingCode.id, {
          code: cleanCode,
          discountType: formData.discountType,
          discountValue: Number(formData.discountValue),
          minOrderAmount: Number(formData.minOrderAmount || 0),
          maxUses: maxUsesNum,
          expiresAt: formData.expiresAt ? expiryIso : null,
          isCollectorReferral: formData.isCollectorReferral,
          creatorName: formData.creatorName.trim() || 'Redline Garage',
          active: formData.active,
        });
      } else {
        await createReferralCodeInSupabase({
          code: cleanCode,
          discountType: formData.discountType,
          discountValue: Number(formData.discountValue),
          minOrderAmount: Number(formData.minOrderAmount || 0),
          maxUses: maxUsesNum,
          expiresAt: expiryIso,
          isCollectorReferral: formData.isCollectorReferral,
          isBirthdayCode: false,
          creatorName: formData.creatorName.trim() || 'Redline Garage',
          active: formData.active,
        });
      }

      await loadCodes();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save referral code.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (code: ReferralCode) => {
    const newStatus = !code.active;
    const res = await updateReferralCodeInSupabase(code.id, { active: newStatus });
    if (res.success) {
      setCodes(prev => prev.map(c => (c.id === code.id ? { ...c, active: newStatus } : c)));
    } else {
      setActionFeedback({
        type: 'error',
        message: `Failed to update status for "${code.code}": ${res.error || 'Database error'}`
      });
    }
  };

  const handleDeleteCode = async (code: ReferralCode) => {
    if (!window.confirm(`Are you sure you want to permanently delete referral code "${code.code}" from Supabase?`)) {
      return;
    }

    setDeletingCodeId(code.id);
    setActionFeedback(null);

    try {
      const res = await deleteReferralCodeFromSupabase(code.id, code.code);
      if (!res.success) {
        setActionFeedback({
          type: 'error',
          message: res.error || `Failed to delete "${code.code}". Please verify your Supabase RLS delete policies.`
        });
        return;
      }

      // Only remove from UI state once confirmed deleted from Supabase
      setCodes(prev => prev.filter(c => c.id !== code.id && c.code !== code.code));
      setActionFeedback({
        type: 'success',
        message: `Referral code "${code.code}" was permanently deleted from the Supabase database.`
      });

      // Auto-clear success message after 4s
      setTimeout(() => {
        setActionFeedback(prev => (prev?.message.includes(code.code) ? null : prev));
      }, 4000);
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.message || `Unexpected error deleting "${code.code}".`
      });
    } finally {
      setDeletingCodeId(null);
    }
  };

  const handleCopyCode = (code: ReferralCode) => {
    navigator.clipboard.writeText(code.code);
    setCopiedCodeId(code.id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCopyShareableLink = (code: ReferralCode) => {
    const origin = window.location.origin;
    const url = `${origin}?ref=${encodeURIComponent(code.code)}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkId(code.id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(REFERRAL_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleRunTester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCodeInput.trim()) return;
    const subtotal = parseFloat(testSubtotalInput) || 0;
    const res = await validateReferralCode(testCodeInput, subtotal);
    setTestResult({
      tested: true,
      isValid: res.isValid,
      message: res.message,
      discountAmount: res.discountAmount,
    });
  };

  // Filtered Codes
  const filteredCodes = codes.filter(code => {
    const matchesSearch =
      code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (code.creatorName && code.creatorName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return code.active;
    if (statusFilter === 'inactive') return !code.active;
    if (statusFilter === 'collector') return code.isCollectorReferral;
    return true;
  });

  // Calculate Metrics
  const totalCodesCount = codes.length;
  const activeCodesCount = codes.filter(c => c.active).length;
  const totalUsesCount = codes.reduce((sum, c) => sum + (c.usesCount || 0), 0);
  const totalDiscountsDistributed = codes.reduce((sum, c) => sum + (c.totalDiscountGiven || 0), 0);

  return (
    <div className="space-y-6 text-zinc-900 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 rounded-3xl border border-zinc-800 text-white shadow-xl">
        <div className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-red-600/30 text-red-400 border border-red-500/40 px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
              <Gift className="w-3.5 h-3.5" />
              <span>Referral & Promo Engine</span>
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
              dbStatus.connected
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              <Database className="w-3 h-3" />
              <span>{dbStatus.connected ? 'Supabase Synced' : 'Database Ready'}</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase italic font-sans tracking-tight">
            Referral & Discount <span className="text-red-500">Code Center</span>
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl font-normal">
            Manage collector affiliate codes, welcome coupons, flat/percentage discounts, minimum spend rules, and track real-time redemptions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              loadCodes();
              checkDbConnection();
            }}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync DB</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSqlDrawer(!showSqlDrawer)}
            className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition border border-zinc-700 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>SQL Schema</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition shadow-lg shadow-red-600/30 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Code</span>
          </button>
        </div>
      </div>

      {/* SQL Setup Drawer (Collapsible) */}
      {showSqlDrawer && (
        <div className="bg-zinc-950 border-2 border-cyan-500/40 rounded-3xl p-6 text-white space-y-4 text-left shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-mono font-black uppercase text-cyan-300">
                PostgreSQL Schema for Referral Codes
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSqlDrawer(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-zinc-400 text-xs">
            Execute this SQL script in your <strong>Supabase SQL Editor</strong> to create the <code>public.referral_codes</code> table with full RLS policies and starter codes:
          </p>

          <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-[11px] font-mono text-cyan-200 overflow-x-auto max-h-60 leading-relaxed select-all">
            {REFERRAL_SQL_SCHEMA}
          </pre>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-mono font-bold uppercase">
            <span>Total Codes</span>
            <Tag className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-zinc-900">
            {totalCodesCount}
          </div>
          <div className="text-[11px] text-zinc-500 font-medium">
            {activeCodesCount} currently active & live
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-mono font-bold uppercase">
            <span>Total Uses</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600">
            {totalUsesCount}
          </div>
          <div className="text-[11px] text-zinc-500 font-medium">
            Orders completed with referral codes
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-mono font-bold uppercase">
            <span>Total Discounts</span>
            <IndianRupee className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-red-600">
            ₹{totalDiscountsDistributed.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-zinc-500 font-medium">
            Customer savings distributed
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-mono font-bold uppercase">
            <span>Collector Affiliates</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600">
            {codes.filter(c => c.isCollectorReferral).length}
          </div>
          <div className="text-[11px] text-zinc-500 font-medium">
            VIP member referral codes
          </div>
        </div>
      </div>

      {/* Interactive Code Testing Sandbox */}
      <div className="bg-gradient-to-r from-zinc-50 to-zinc-100 border border-zinc-300 rounded-3xl p-5 sm:p-6 text-left shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-red-600" />
          <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-zinc-900">
            Live Interactive Referral Code Tester
          </h3>
        </div>
        <p className="text-zinc-600 text-xs font-normal">
          Simulate how a customer's cart applies any promo or referral code with custom cart totals:
        </p>

        <form onSubmit={handleRunTester} className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. WELCOME10"
              value={testCodeInput}
              onChange={(e) => setTestCodeInput(e.target.value.toUpperCase())}
              className="bg-white border border-zinc-300 rounded-xl px-3.5 py-2 text-xs font-mono uppercase font-bold text-zinc-900 focus:border-red-600 focus:outline-hidden min-w-[160px]"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-mono">
            <span className="text-zinc-400">Cart: ₹</span>
            <input
              type="number"
              value={testSubtotalInput}
              onChange={(e) => setTestSubtotalInput(e.target.value)}
              className="w-20 font-bold text-zinc-900 focus:outline-hidden"
              placeholder="999"
            />
          </div>

          <button
            type="submit"
            className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-mono font-bold uppercase px-4 py-2 rounded-xl transition cursor-pointer min-h-[38px]"
          >
            Test Code
          </button>
        </form>

        {testResult && (
          <div className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2 ${
            testResult.isValid
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}>
            {testResult.isValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <div>{testResult.message}</div>
              {testResult.isValid && (
                <div className="text-[11px] text-emerald-700">
                  Calculated Discount: <strong>-₹{testResult.discountAmount.toFixed(2)}</strong> | Final Cart: <strong>₹{(parseFloat(testSubtotalInput || '0') - testResult.discountAmount).toFixed(2)}</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-red-50 border-red-300 text-red-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{actionFeedback.message}</span>
          </div>
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'error' && (
              <button
                type="button"
                onClick={() => setShowSqlDrawer(true)}
                className="px-2.5 py-1 bg-red-600 text-white font-mono font-bold rounded-lg hover:bg-red-500 text-[10px] uppercase transition cursor-pointer"
              >
                Fix Supabase RLS Policies
              </button>
            )}
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="p-1 text-zinc-500 hover:text-zinc-800 rounded transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code or creator name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:border-red-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'active', 'inactive', 'collector'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold capitalize whitespace-nowrap transition cursor-pointer ${
                statusFilter === tab
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Referral Codes List / Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-red-600" />
            <p className="text-xs font-mono font-bold">Loading Referral Codes...</p>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Tag className="w-10 h-10 text-zinc-300 mx-auto" />
            <h4 className="text-base font-bold text-zinc-800">No referral codes found</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {searchQuery ? 'No codes matching your search query.' : 'Create your first custom discount or collector referral code.'}
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Code</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4 font-bold">Code</th>
                  <th className="py-3.5 px-4 font-bold">Discount</th>
                  <th className="py-3.5 px-4 font-bold">Rules / Limits</th>
                  <th className="py-3.5 px-4 font-bold">Uses & Total Given</th>
                  <th className="py-3.5 px-4 font-bold">Creator / Source</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredCodes.map(code => {
                  const isExpired = code.expiresAt && new Date(code.expiresAt).getTime() < Date.now();
                  const isMaxedOut = code.maxUses && code.usesCount >= code.maxUses;

                  return (
                    <tr key={code.id} className="hover:bg-zinc-50/80 transition-colors">
                      {/* Code + Copy */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm bg-zinc-100 text-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-300">
                              {code.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(code)}
                              className="p-1 text-zinc-400 hover:text-zinc-800 rounded transition cursor-pointer"
                              title="Copy Code"
                            >
                              {copiedCodeId === code.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {code.isCollectorReferral && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              <Flame className="w-2.5 h-2.5 text-amber-600 fill-amber-600" />
                              <span>Collector VIP</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-extrabold text-zinc-900 text-sm flex items-center gap-1">
                          {code.discountType === 'percentage' ? (
                            <>
                              <Percent className="w-3.5 h-3.5 text-red-600" />
                              <span>{code.discountValue}% OFF</span>
                            </>
                          ) : (
                            <>
                              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                              <span>₹{code.discountValue} FLAT</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Rules / Limits */}
                      <td className="py-3.5 px-4 font-mono text-zinc-600 text-[11px] space-y-0.5">
                        {code.minOrderAmount && code.minOrderAmount > 0 ? (
                          <div>Min Order: ₹{code.minOrderAmount}</div>
                        ) : (
                          <div className="text-zinc-400">No Min Spend</div>
                        )}

                        {code.maxUses ? (
                          <div>Max Limit: {code.maxUses} uses</div>
                        ) : (
                          <div className="text-zinc-400">Unlimited Uses</div>
                        )}

                        {code.expiresAt ? (
                          <div className={`flex items-center gap-1 ${isExpired ? 'text-red-600 font-bold' : ''}`}>
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(code.expiresAt).toLocaleDateString()}</span>
                            {isExpired && <span className="text-[10px] uppercase">(Expired)</span>}
                          </div>
                        ) : (
                          <div className="text-zinc-400">Never Expires</div>
                        )}
                      </td>

                      {/* Uses & Total Given */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-zinc-900 text-xs">
                          {code.usesCount || 0} {code.maxUses ? `/ ${code.maxUses}` : ''} redeemed
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          -₹{(code.totalDiscountGiven || 0).toLocaleString('en-IN')} total given
                        </div>
                      </td>

                      {/* Creator */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-semibold text-zinc-800">
                          {code.creatorName || 'Redline Garage'}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          Created {new Date(code.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(code)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition cursor-pointer ${
                            code.active && !isExpired && !isMaxedOut
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
                          }`}
                        >
                          {code.active && !isExpired && !isMaxedOut ? '● Active' : '○ Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyShareableLink(code)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition cursor-pointer"
                            title="Copy Shareable Referral URL (?ref=CODE)"
                          >
                            {copiedLinkId === code.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(code)}
                            className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit Code"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={deletingCodeId === code.id}
                            onClick={() => handleDeleteCode(code)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              deletingCodeId === code.id
                                ? 'bg-red-50 text-red-600 opacity-80 cursor-not-allowed'
                                : 'text-zinc-500 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={deletingCodeId === code.id ? 'Deleting from Supabase...' : 'Delete Code'}
                          >
                            {deletingCodeId === code.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
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

      {/* Create / Edit Code Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-zinc-900 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200 text-left space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-black uppercase font-sans tracking-tight">
                  {editingCode ? `Edit Code: ${editingCode.code}` : 'Create Referral / Promo Code'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Quick Preset Buttons (for new codes) */}
            {!editingCode && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold uppercase text-zinc-500">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        code: 'WELCOME10',
                        discountType: 'percentage',
                        discountValue: 10,
                        minOrderAmount: 0,
                        creatorName: 'Welcome Bonus',
                      }));
                    }}
                    className="text-[11px] font-mono bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg font-bold text-zinc-700 cursor-pointer"
                  >
                    10% Welcome
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        code: 'GARAGE50',
                        discountType: 'flat',
                        discountValue: 50,
                        minOrderAmount: 499,
                        creatorName: '₹50 Off Offer',
                      }));
                    }}
                    className="text-[11px] font-mono bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg font-bold text-zinc-700 cursor-pointer"
                  >
                    ₹50 Flat (Min ₹499)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        code: 'VIPCLUB15',
                        discountType: 'percentage',
                        discountValue: 15,
                        minOrderAmount: 999,
                        isCollectorReferral: true,
                        creatorName: 'VIP Collector Club',
                      }));
                    }}
                    className="text-[11px] font-mono bg-amber-50 border border-amber-200 hover:bg-amber-100 px-2.5 py-1 rounded-lg font-bold text-amber-800 cursor-pointer"
                  >
                    15% VIP Collector
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Code String */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase text-zinc-700">
                  Referral / Promo Code String *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SPEEDY20, HOTWHEELS10"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-xs font-mono uppercase font-black text-zinc-900 focus:border-red-600 focus:outline-hidden"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-700">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value as ReferralDiscountType }))}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-mono font-bold text-zinc-900 focus:border-red-600 focus:outline-hidden"
                  >
                    <option value="percentage">Percentage (% OFF)</option>
                    <option value="flat">Flat Amount (₹ OFF)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-700">
                    Discount Value {formData.discountType === 'percentage' ? '(%)' : '(₹)'} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === 'percentage' ? '90' : '10000'}
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-mono font-bold text-zinc-900 focus:border-red-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Minimum Order & Max Uses */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-700">
                    Min Order Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for none"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-mono text-zinc-900 focus:border-red-600 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-700">
                    Max Redemptions Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Blank = Unlimited"
                    value={formData.maxUses}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-mono text-zinc-900 focus:border-red-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Expiry Date & Creator Attribution */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-700">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-mono text-zinc-900 focus:border-red-600 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-700">
                    Creator / Affiliate Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John (Collector)"
                    value={formData.creatorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, creatorName: e.target.value }))}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Checkboxes: Active & Collector Referral */}
              <div className="pt-2 border-t border-zinc-200 space-y-2">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                  />
                  <span>Active & available for customer checkout</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-semibold text-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCollectorReferral}
                    onChange={(e) => setFormData(prev => ({ ...prev, isCollectorReferral: e.target.checked }))}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>Mark as Collector VIP / Member Affiliate Code</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition shadow-md shadow-red-600/30 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{editingCode ? 'Save Changes' : 'Create Referral Code'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
