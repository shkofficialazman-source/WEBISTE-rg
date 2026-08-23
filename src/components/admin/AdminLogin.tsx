import React, { useState, useEffect } from 'react';
import { Lock, Mail, ArrowLeft, ShieldAlert, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { auth, adminLoginWithEmailPassword, ADMIN_EMAIL } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { RedlineLogo } from '../RedlineLogo';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToStore }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        onLoginSuccess();
      }
    });
    return () => unsubscribe();
  }, [onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await adminLoginWithEmailPassword(email, password);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(err.message || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans selection:bg-red-600 selection:text-white">
      {/* Background Decorative Racing Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(220,38,38,0.08),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Back to Store */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onBackToStore}
          className="flex items-center gap-2 text-xs font-mono text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-100 border border-zinc-200 px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Redline Store</span>
        </button>
      </div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <RedlineLogo variant="badge" size="lg" className="mb-4" />
          <h1 className="text-2xl font-black uppercase tracking-tight font-mono text-zinc-900">
            Redline Garage <span className="text-red-600">Admin</span>
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Authorized Owner Portal &amp; Inventory Management
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-shake">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="font-mono leading-relaxed">{error}</div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-2 font-bold">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="diecastlane7@gmail.com"
                  className="w-full bg-white border border-zinc-300 focus:border-red-600 text-zinc-900 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-hidden transition-colors font-mono shadow-xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-2 font-bold">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-zinc-300 focus:border-red-600 text-zinc-900 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-hidden transition-colors font-mono shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 active:scale-98 disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm uppercase tracking-wider transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2 font-mono mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Admin...</span>
                </>
              ) : (
                <span>Enter Admin Dashboard</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-200 text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Owner Access Restricted to Authorized Administrator</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
