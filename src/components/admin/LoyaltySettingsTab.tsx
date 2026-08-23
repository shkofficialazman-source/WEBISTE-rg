import React, { useState, useEffect } from 'react';
import { LoyaltySettings, LoyaltyAccount } from '../../types';
import {
  fetchLoyaltySettings,
  saveLoyaltySettings,
  fetchAllLoyaltyAccounts,
  createOrUpdateLoyaltyAccount,
  awardPointsForOrder,
} from '../../loyalty';
import {
  Award,
  Sparkles,
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  UserCheck,
  Plus,
  IndianRupee,
  Gift,
} from 'lucide-react';

export const LoyaltySettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<LoyaltySettings>({
    loyaltyEnabled: true,
    earnRateRupees: 10,
    redeemPointValue: 0.5,
    minPointsToRedeem: 50,
    welcomeBonusPoints: 20,
    referralBonusPoints: 30,
  });

  const [accounts, setAccounts] = useState<LoyaltyAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Bonus Points Modal
  const [bonusModalAccount, setBonusModalAccount] = useState<LoyaltyAccount | null>(null);
  const [bonusPoints, setBonusPoints] = useState(50);
  const [bonusReason, setBonusReason] = useState('Admin Appreciation Bonus');
  const [isAwardingBonus, setIsAwardingBonus] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedSettings, fetchedAccounts] = await Promise.all([
        fetchLoyaltySettings(),
        fetchAllLoyaltyAccounts(),
      ]);
      setSettings(fetchedSettings);
      setAccounts(fetchedAccounts);
      setSaveError('');
    } catch (err: any) {
      console.warn('Failed to load loyalty data:', err);
      setSaveError('Notice: Could not sync remote loyalty settings.');
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
    setSaveSuccess(false);
    setSaveError('');

    try {
      const saved = await saveLoyaltySettings(settings);
      const fresh = await fetchLoyaltySettings();
      setSettings(fresh);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save loyalty settings in database.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAwardBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusModalAccount || bonusPoints <= 0) return;

    setIsAwardingBonus(true);
    try {
      const updatedBalance = (bonusModalAccount.pointsBalance || 0) + bonusPoints;
      const updatedLifetime = (bonusModalAccount.lifetimeEarned || 0) + bonusPoints;

      await createOrUpdateLoyaltyAccount({
        phone: bonusModalAccount.phone,
        customerName: bonusModalAccount.customerName,
        email: bonusModalAccount.email,
        userId: bonusModalAccount.userId,
        pointsBalance: updatedBalance,
        lifetimeEarned: updatedLifetime,
      });

      // Update local state
      setAccounts(prev =>
        prev.map(acc =>
          acc.id === bonusModalAccount.id
            ? {
                ...acc,
                pointsBalance: updatedBalance,
                lifetimeEarned: updatedLifetime,
              }
            : acc
        )
      );

      setBonusModalAccount(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to award points.');
    } finally {
      setIsAwardingBonus(false);
    }
  };

  const filteredAccounts = accounts.filter(
    acc =>
      (acc.customerPhone && acc.customerPhone.includes(searchTerm)) ||
      (acc.customerName && acc.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (acc.customerEmail && acc.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPointsInCirculation = accounts.reduce((acc, a) => acc + (a.pointsBalance || 0), 0);
  const totalRupeeLiability = totalPointsInCirculation * (settings.redeemPointValue || 0.5);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-black uppercase italic tracking-tight text-zinc-900 font-sans">
              Collector Loyalty & Rewards Program
            </h2>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Configure point earnings, redemption ratios, and monitor collector loyalty balances.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition cursor-pointer self-start sm:self-auto border border-zinc-200"
          title="Refresh Loyalty Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] uppercase text-zinc-500 font-bold">Registered Loyalty Members</div>
          <div className="text-2xl font-black text-zinc-900 mt-1">
            {accounts.length} <span className="text-xs text-zinc-400 font-normal">collectors</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] uppercase text-zinc-500 font-bold">Active Points in Circulation</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {totalPointsInCirculation} <span className="text-xs text-zinc-400 font-normal">pts</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] uppercase text-zinc-500 font-bold">Total Redemption Value</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ₹{totalRupeeLiability.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Messages */}
      {saveError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{saveError}</span>
        </div>
      )}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Loyalty updates saved successfully!</span>
        </div>
      )}

      {/* Program Settings Form Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2 font-mono">
            <Settings className="w-4 h-4 text-zinc-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-800">
              Loyalty Engine Rules & Calculations
            </h3>
          </div>
          <span className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
            Real-time Checkout Integration
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enableLoyaltyCheck"
              checked={settings.loyaltyEnabled}
              onChange={e => setSettings(prev => ({ ...prev, loyaltyEnabled: e.target.checked }))}
              className="rounded border-zinc-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="enableLoyaltyCheck" className="font-bold text-zinc-900 cursor-pointer">
              Enable Collector Loyalty Program on Checkout
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] uppercase text-zinc-600 mb-1 font-bold">
                Earn Rate (1 pt per ₹ spent)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={settings.earnRateRupees}
                  onChange={e =>
                    setSettings(prev => ({ ...prev, earnRateRupees: Number(e.target.value) }))
                  }
                  className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden font-bold"
                />
              </div>
              <span className="text-[9px] text-zinc-400 mt-1 block">
                ₹{settings.earnRateRupees} spent = 1 Loyalty Point
              </span>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-zinc-600 mb-1 font-bold">
                Point Rupee Value (₹ per pt)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.05"
                required
                value={settings.redeemPointValue}
                onChange={e =>
                  setSettings(prev => ({ ...prev, redeemPointValue: Number(e.target.value) }))
                }
                className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden font-bold"
              />
              <span className="text-[9px] text-zinc-400 mt-1 block">
                100 points = ₹{(100 * settings.redeemPointValue).toFixed(2)} off
              </span>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-zinc-600 mb-1 font-bold">
                Minimum Points to Redeem
              </label>
              <input
                type="number"
                min="0"
                required
                value={settings.minPointsToRedeem}
                onChange={e =>
                  setSettings(prev => ({ ...prev, minPointsToRedeem: Number(e.target.value) }))
                }
                className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden font-bold"
              />
              <span className="text-[9px] text-zinc-400 mt-1 block">
                Threshold before redemption box unlocks
              </span>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-zinc-600 mb-1 font-bold">
                Welcome Bonus Points
              </label>
              <input
                type="number"
                min="0"
                required
                value={settings.welcomeBonusPoints}
                onChange={e =>
                  setSettings(prev => ({ ...prev, welcomeBonusPoints: Number(e.target.value) }))
                }
                className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden font-bold"
              />
              <span className="text-[9px] text-zinc-400 mt-1 block">
                Gifted on first verified order
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-50 min-h-[40px]"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? 'Saving Settings...' : 'Save Loyalty Rules'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Customer Accounts Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden font-mono">
        <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-800">
              Customer Loyalty Ledger ({filteredAccounts.length})
            </h3>
            <span className="text-[10px] text-zinc-500">
              Points are tracked per customer phone / account across all orders.
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by phone, name, email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-xl focus:outline-hidden focus:border-red-600"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            Loading loyalty accounts...
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">
            No customer accounts found matching search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100/75 border-b border-zinc-200 text-zinc-600 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5 pl-4">Customer Phone / Name</th>
                  <th className="p-3.5">Email / Account</th>
                  <th className="p-3.5">Points Balance</th>
                  <th className="p-3.5">Worth (₹)</th>
                  <th className="p-3.5">Lifetime Earned</th>
                  <th className="p-3.5">Lifetime Redeemed</th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredAccounts.map(account => (
                  <tr key={account.id} className="hover:bg-zinc-50/75 transition-colors">
                    <td className="p-3.5 pl-4">
                      <div>
                        <div className="font-bold text-zinc-900">{account.customerName || 'Collector'}</div>
                        <div className="text-[11px] text-zinc-500">{account.customerPhone || 'No Phone'}</div>
                      </div>
                    </td>
                    <td className="p-3.5 text-zinc-600">
                      {account.customerEmail || 'Guest / Phone Checkout'}
                    </td>
                    <td className="p-3.5">
                      <span className="font-black text-sm text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
                        {account.pointsBalance || 0} pts
                      </span>
                    </td>
                    <td className="p-3.5 text-emerald-700 font-bold">
                      ₹{((account.pointsBalance || 0) * settings.redeemPointValue).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-zinc-600">
                      {account.lifetimeEarned || 0} pts
                    </td>
                    <td className="p-3.5 text-zinc-600">
                      {account.lifetimeRedeemed || 0} pts
                    </td>
                    <td className="p-3.5 pr-4 text-right">
                      <button
                        onClick={() => setBonusModalAccount(account)}
                        className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border border-zinc-300 transition cursor-pointer inline-flex items-center gap-1"
                        title="Award Bonus Points"
                      >
                        <Plus className="w-3 h-3 text-red-600" />
                        <span>Award Pts</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Award Bonus Points Modal */}
      {bonusModalAccount && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-mono text-left">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
              <Gift className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-black uppercase text-zinc-900 font-sans">
                Award Points: {bonusModalAccount.customerName || bonusModalAccount.customerPhone}
              </h3>
            </div>

            <form onSubmit={handleAwardBonus} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-zinc-600 mb-1 font-bold">
                  Points to Grant
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={bonusPoints}
                  onChange={e => setBonusPoints(Number(e.target.value))}
                  className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 font-bold focus:border-red-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-zinc-600 mb-1 font-bold">
                  Reason / Note
                </label>
                <input
                  type="text"
                  value={bonusReason}
                  onChange={e => setBonusReason(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-800">
                Granting <strong>{bonusPoints} points</strong> is worth ₹{(bonusPoints * settings.redeemPointValue).toFixed(2)} on next order.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBonusModalAccount(null)}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAwardingBonus}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {isAwardingBonus ? 'Awarding...' : 'Confirm Points'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
