'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { authService } from '../../../services/authService';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Parse redirect and reason parameters
  const redirectPath = searchParams.get('redirect') || '/admin';
  const reason = searchParams.get('reason');

  useEffect(() => {
    if (reason === 'expired') {
      setInfoMessage('Your administrator session has expired. Please sign in again.');
    } else if (reason === 'unauthorized') {
      setInfoMessage('Administrative authentication is required to access that section.');
    } else if (reason === 'logout') {
      setInfoMessage('You have been safely signed out of the administrative console.');
    }

    // If user already has a valid token, verify and redirect to dashboard
    const existingToken = localStorage.getItem('rexbebe_admin_token');
    if (existingToken) {
      authService.getAdminMe(existingToken)
        .then(() => {
          router.replace(redirectPath);
        })
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem('rexbebe_admin_token');
          localStorage.removeItem('rexbebe_admin_user');
          document.cookie = 'rexbebe_admin_token=; path=/; max-age=0; SameSite=Strict';
        });
    }
  }, [reason, redirectPath, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const cleanIdentifier = usernameOrEmail.trim();
    if (!cleanIdentifier) {
      setErrorMessage('Please enter your administrator username or email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your administrator password.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.adminLogin({
        usernameOrEmail: cleanIdentifier,
        password,
      });

      if (!response.token || !response.user) {
        throw new Error('Authentication succeeded but server returned an incomplete session payload.');
      }

      // Store token & user profile in localStorage
      localStorage.setItem('rexbebe_admin_token', response.token);
      localStorage.setItem('rexbebe_admin_user', JSON.stringify(response.user));

      // Also set a secure cookie for server middleware detection
      const maxAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 8; // 7 days or 8 hours
      document.cookie = `rexbebe_admin_token=${encodeURIComponent(response.token)}; path=/; max-age=${maxAge}; SameSite=Strict`;

      // Redirect to the intended admin page
      router.replace(redirectPath);
    } catch (err: any) {
      console.error('[AdminLogin] Error:', err);
      const msg = err.message || 'Login failed. Please check your credentials and try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0F0F12] text-stone-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-white">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-600/15 via-rose-600/10 to-purple-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand identity header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-400 text-white text-3xl font-black shadow-xl shadow-amber-500/20 mb-4 border border-white/20">
            🦕
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white font-heading">
            REXBEBE
          </h1>
          <p className="text-xs uppercase tracking-widest text-amber-400/90 font-bold mt-1">
            Executive Management Console
          </p>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-stone-900/80 border border-stone-800 text-stone-400 text-[11px] font-semibold mt-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Restricted Access • Authorized Personnel Only</span>
          </div>
        </div>

        {/* Login form card */}
        <div className="bg-[#18181D]/90 backdrop-blur-xl border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative">
          {/* Info Banner */}
          {infoMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start space-x-2.5 animate-fadeIn">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{infoMessage}</p>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-start space-x-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-300">Authentication Failed</p>
                <p className="font-medium leading-relaxed mt-0.5 text-rose-200/90">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username or Email Input */}
            <div>
              <label
                htmlFor="usernameOrEmail"
                className="block text-xs font-bold text-stone-300 mb-1.5 uppercase tracking-wider"
              >
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="usernameOrEmail"
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="admin or admin@rexbebe.com"
                  autoComplete="username"
                  autoFocus
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-[#111114] border border-stone-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-2xl text-sm text-white placeholder-stone-600 transition-all outline-none font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-stone-300 uppercase tracking-wider"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-12 py-3 bg-[#111114] border border-stone-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-2xl text-sm text-white placeholder-stone-600 transition-all outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-500 hover:text-stone-300 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-stone-400 select-none hover:text-stone-300 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md bg-[#111114] border-stone-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 focus:ring-opacity-0 transition-colors cursor-pointer"
                />
                <span>Remember session on this device</span>
              </label>

              <span className="text-[11px] text-stone-500">8-Hour Active Token</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-rose-500 hover:from-amber-400 hover:to-rose-400 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Security details footnote */}
          <div className="mt-8 pt-5 border-t border-stone-800/80 text-center">
            <div className="flex items-center justify-center space-x-2 text-[11px] text-stone-500">
              <KeyRound className="w-3.5 h-3.5 text-amber-500/70" />
              <span>AES-256 JWT Tokenized • Rate-Limited Brute Force Guard</span>
            </div>
            <p className="text-[10px] text-stone-600 mt-1">
              Unauthorized access attempts are monitored and recorded with client IP and cryptographic audit trails.
            </p>
          </div>
        </div>

        {/* Bottom copyright notice */}
        <div className="text-center mt-6 text-stone-600 text-xs">
          © {new Date().getFullYear()} REXBEBE Boutique. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#0F0F12] flex items-center justify-center text-stone-400 font-bold">
          Loading admin console...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
