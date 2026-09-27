// src/pages/ResetPasswordPage.jsx
// Landing page for the password-recovery email link. Supabase JS picks the
// recovery token out of the URL and establishes a temporary session; we then
// let the user set a new password via auth.updateUser. Ambassador invites
// land here too (?invite=1), since an invited account has no password yet.
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import SecondaryNavbar from '../components/layout/SecondaryNavbar';
import Footer from '../components/layout/Footer';
import { supabase, authRedirectError } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const isInvite = new URLSearchParams(location.search).get('invite') === '1';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message || 'Could not update password. The link may have expired.');
        return;
      }
      // A reset usually means the old password is compromised or forgotten:
      // end every other session so a stolen one can't outlive it.
      await supabase.auth.signOut({ scope: 'others' }).catch(() => {});
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => navigate('/account', { replace: true }), 1500);
    return () => clearTimeout(t);
  }, [done, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <SecondaryNavbar />
      <div className="flex-grow flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-soft p-6 md:p-10">
            <h1 className="text-2xl md:text-3xl font-semibold text-indigo-950 tracking-tight mb-2">{isInvite ? 'Set Your Password' : 'New Password'}</h1>

            {loading ? (
              <p className="text-sm text-slate-500 font-medium animate-pulse">Verifying your link...</p>
            ) : !user ? (
              <div className="space-y-5">
                <p className="text-sm text-slate-500 font-medium">
                  {isInvite
                    ? 'This invitation link is invalid, has expired, or was already used. Contact us at support@amplifygive.com and we\'ll send a new one.'
                    : authRedirectError
                      ? 'This reset link has expired or was already used. Links only work once, so request a fresh one below.'
                      : 'This reset link is invalid or has expired.'}
                </p>
                {!isInvite && (
                  <Link to="/login" className="inline-block text-xs font-bold text-indigo-600 hover:text-indigo-900 transition-colors uppercase tracking-widest">
                    Request a new link
                  </Link>
                )}
              </div>
            ) : done ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm font-bold flex items-start gap-2 animate-in fade-in">
                <CheckCircle size={16} className="mt-0.5 shrink-0" />
                <p>Password updated. Taking you to your account...</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 font-medium mb-8">{isInvite ? 'Choose a password to activate your ambassador account.' : 'Choose a new password for your account.'}</p>

                {error && (
                  <div className="mb-5 bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-in fade-in">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" /> <p>{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="new-password" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">New Password</label>
                    <input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100 rounded-xl p-3 text-sm outline-none transition-all"
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Confirm Password</label>
                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full bg-slate-50 border border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100 rounded-xl p-3 text-sm outline-none transition-all"
                      placeholder="Re-enter your new password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-indigo-900 text-white rounded-xl font-black shadow-lg hover:bg-black transition-all uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <span className="animate-pulse italic">Saving...</span> : <><Lock size={16} /> Set New Password</>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
