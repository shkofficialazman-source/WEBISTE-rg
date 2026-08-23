import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowLeft, Loader2, ShieldCheck, Sparkles, CheckCircle2, Cake, Phone } from 'lucide-react';
import { customerSignInWithEmailPassword, customerSignUpWithEmailPassword } from '../firebase';
import { UserProfile } from '../types';

interface CustomerAuthProps {
  onSuccess: (profile: UserProfile) => void;
  onBackToStore: () => void;
  initialMode?: 'login' | 'signup';
}

export const CustomerAuth: React.FC<CustomerAuthProps> = ({
  onSuccess,
  onBackToStore,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        const { profile } = await customerSignUpWithEmailPassword(
          name,
          email,
          password,
          dob || undefined,
          phone || undefined
        );
        onSuccess(profile);
      } else {
        const { profile } = await customerSignInWithEmailPassword(email, password);
        if (profile) {
          onSuccess(profile);
        } else {
          onSuccess({
            uid: 'customer-user',
            name: email.split('@')[0],
            email,
            role: 'customer',
          });
        }
      }
    } catch (err: any) {
      console.error('Customer Auth Error:', err);
      let msg = err.message || 'Authentication failed. Please try again.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. Please check your credentials or create a new account.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please log in.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans selection:bg-red-600 selection:text-white">
      {/* Background Decorative Glow */}
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-red-600 rounded-2xl shadow-lg shadow-red-600/20 text-white mb-4">
            <span className="font-black italic text-2xl tracking-tighter">RG</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight font-mono text-zinc-900">
            {mode === 'login' ? 'Customer Account Login' : 'Create Collector Account'}
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            {mode === 'login'
              ? 'Sign in to track orders and fast-track checkout'
              : 'Join Redline Garage to save custom card designs & get 20% birthday gifts'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xl">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-xl border border-zinc-200 mb-6 font-mono text-xs">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`py-2.5 rounded-lg font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`py-2.5 rounded-lg font-bold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="font-mono leading-relaxed">{error}</div>
              </div>
            )}

            {/* Full Name for Signup */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-2 font-bold">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Henderson"
                    className="w-full bg-white border border-zinc-300 focus:border-red-600 text-zinc-900 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-hidden transition-colors font-mono shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-2 font-bold">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full bg-white border border-zinc-300 focus:border-red-600 text-zinc-900 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-hidden transition-colors font-mono shadow-xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-2 font-bold">
                Password {mode === 'signup' && <span className="text-zinc-400 font-normal">(Min. 6 chars)</span>}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-zinc-300 focus:border-red-600 text-zinc-900 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-hidden transition-colors font-mono shadow-xs"
                />
              </div>
            </div>

            {/* Date of Birth for Signup */}
            {mode === 'signup' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-zinc-600 font-bold flex items-center gap-1.5">
                      <Cake className="w-3.5 h-3.5 text-red-600" />
                      <span>Date of Birth</span>
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-white border border-zinc-300 focus:border-red-600 text-zinc-900 rounded-xl px-4 py-3 text-sm focus:outline-hidden transition-colors font-mono shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-2 font-bold">
                    WhatsApp Phone <span className="text-zinc-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white border border-zinc-300 focus:border-red-600 text-zinc-900 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-hidden transition-colors font-mono shadow-xs"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 active:scale-98 disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm uppercase tracking-wider transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2 font-mono mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <span>{mode === 'signup' ? 'Register Account' : 'Sign In To Account'}</span>
              )}
            </button>
          </form>

          {/* Switch Mode Prompt */}
          <div className="mt-6 pt-5 border-t border-zinc-200 text-center font-mono text-xs text-zinc-500">
            {mode === 'login' ? (
              <p>
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="text-red-600 font-bold hover:underline cursor-pointer"
                >
                  Create one here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className="text-red-600 font-bold hover:underline cursor-pointer"
                >
                  Log in now
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
