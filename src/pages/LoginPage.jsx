// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import SecondaryNavbar from '../components/layout/SecondaryNavbar';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const inputClass = (hasError) =>
  `w-full bg-slate-50 border ${hasError ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100'} rounded-xl p-3 text-sm outline-none transition-all`;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Already signed in? Go straight to the account page.
  useEffect(() => {
    if (!loading && user) {
      navigate('/account', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        // Generic message — never reveal whether the email exists.
        setError('Invalid email or password.');
        return;
      }
      navigate(location.state?.from || '/account', { replace: true });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      // Always show the same message — no account enumeration.
      setNotice("If an account exists for that email, we've sent a password reset link.");
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <SecondaryNavbar />
      <div className="flex-grow flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-soft p-6 md:p-10">
            <h1 className="text-2xl md:text-3xl font-black uppercase italic text-indigo-950 tracking-tight mb-2">
              {mode === 'signin' ? 'Sign In' : 'Reset Password'}
            </h1>
            <p className="text-sm text-slate-500 font-medium mb-8">
              {mode === 'signin'
                ? 'Access your membership and account settings.'
                : "Enter your email and we'll send you a reset link."}
            </p>

            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={14} className="mt-0.5 shrink-0" /> <p>{error}</p>
              </div>
            )}
            {notice && (
              <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-in fade-in">
                <CheckCircle size={14} className="mt-0.5 shrink-0" /> <p>{notice}</p>
              </div>
            )}

            <form onSubmit={mode === 'signin' ? handleSignIn : handleForgot} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Email</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass(false)}
                  placeholder="you@example.com"
                />
              </div>

              {mode === 'signin' && (
                <div>
                  <label htmlFor="login-password" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass(false)}
                    placeholder="••••••••"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-indigo-900 text-white rounded-xl font-black shadow-lg hover:bg-black transition-all uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="animate-pulse italic">Please wait...</span>
                ) : mode === 'signin' ? (
                  <><Lock size={16} /> Sign In</>
                ) : (
                  <><Mail size={16} /> Send Reset Link</>
                )}
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-3 text-center">
              <button
                type="button"
                onClick={() => { setMode(mode === 'signin' ? 'forgot' : 'signin'); setError(null); setNotice(null); }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-900 transition-colors uppercase tracking-widest"
              >
                {mode === 'signin' ? 'Forgot your password?' : 'Back to sign in'}
              </button>
              <p className="text-xs text-slate-500 font-medium">
                Don't have an account? <Link to="/circles" className="text-indigo-600 font-bold hover:text-indigo-900 transition-colors">Join a circle</Link> — your account is created at checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;
