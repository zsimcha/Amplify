// src/pages/AccountPage.jsx
// Self-service account management. All data access is RLS-scoped to the
// signed-in user; cancellation goes through a definer RPC that verifies
// ownership from auth.uid() server-side. Payment methods and receipts are
// scaffolded for Stripe (Customer Portal) and clearly disabled until
// billing goes live — card data must only ever touch Stripe-hosted UI.
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, CreditCard, Receipt, LogOut, AlertCircle,
  CheckCircle, ShieldCheck, ChevronRight, ArrowUpDown
} from 'lucide-react';
import SecondaryNavbar from '../components/layout/SecondaryNavbar';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Display-only; authoritative pricing lives server-side in process_checkout.
const TIER_DISPLAY = {
  silver:  { price: 250,  prize: '$25,000',  odds: '1 / 100', text: 'text-slate-500',  dot: 'bg-slate-400' },
  gold:    { price: 500,  prize: '$50,000',  odds: '1 / 50',  text: 'text-[#ca8a04]',  dot: 'bg-[#eab308]' },
  diamond: { price: 1000, prize: '$100,000', odds: '1 / 25',  text: 'text-indigo-600', dot: 'bg-[#818cf8]' },
};

const STATUS_STYLES = {
  active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  past_due:  'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

const SectionCard = ({ icon, title, children }) => (
  <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-soft p-6 md:p-8">
    <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-indigo-950 mb-6 border-b border-slate-200 pb-4 flex items-center gap-2">
      {icon} {title}
    </h2>
    {children}
  </div>
);

const Feedback = ({ kind, children }) => (
  <div className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-in fade-in border ${
    kind === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
  }`}>
    {kind === 'error' ? <AlertCircle size={14} className="mt-0.5 shrink-0" /> : <CheckCircle size={14} className="mt-0.5 shrink-0" />}
    <p>{children}</p>
  </div>
);

const inputClass = 'w-full bg-slate-50 border border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100 rounded-xl p-3 text-sm outline-none transition-all';

const AccountPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [subscriptions, setSubscriptions] = useState(null); // null = loading
  const [subsError, setSubsError] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelFeedback, setCancelFeedback] = useState(null);

  const [changePlanId, setChangePlanId] = useState(null); // sub whose plan-picker is open
  const [pendingTier, setPendingTier] = useState(null);   // tier selected, awaiting confirm
  const [changingId, setChangingId] = useState(null);
  const [changeFeedback, setChangeFeedback] = useState(null);

  const [newEmail, setNewEmail] = useState('');
  const [emailFeedback, setEmailFeedback] = useState(null);
  const [emailSubmitting, setEmailSubmitting] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Route guard: this page requires a session.
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  const fetchSubscriptions = useCallback(async () => {
    // RLS restricts this to rows where user_id = auth.uid().
    const { data, error } = await supabase
      .from('Subscriptions')
      .select('id, tier, status, display_name, is_anonymous, created_at, communities(name)')
      .order('created_at', { ascending: true });
    if (error) {
      setSubsError('Could not load your membership. Please refresh the page.');
      setSubscriptions([]);
      return;
    }
    setSubscriptions(data || []);
  }, []);

  useEffect(() => {
    if (user) fetchSubscriptions();
  }, [user, fetchSubscriptions]);

  const handleCancel = async (subscriptionId) => {
    setCancellingId(subscriptionId);
    setCancelFeedback(null);
    try {
      const { error } = await supabase.rpc('cancel_my_subscription', { p_subscription_id: subscriptionId });
      if (error) {
        setCancelFeedback({ kind: 'error', text: 'Could not cancel your membership. Please try again or contact us.' });
        return;
      }
      setCancelFeedback({ kind: 'success', text: 'Your membership has been cancelled. You will not be charged again.' });
      await fetchSubscriptions();
    } catch {
      setCancelFeedback({ kind: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  };

  const handleChangeTier = async (subscriptionId, newTier) => {
    setChangingId(subscriptionId);
    setChangeFeedback(null);
    try {
      const { data, error } = await supabase.rpc('change_my_tier', {
        p_subscription_id: subscriptionId,
        p_new_tier: newTier,
      });
      if (error) {
        setChangeFeedback({ kind: 'error', text: 'Could not change your plan. Please try again or contact us.' });
        return;
      }
      // The RPC returns { success: false, message } for rejected changes.
      if (data && data.success === false) {
        setChangeFeedback({ kind: 'error', text: data.message || 'Could not change your plan.' });
        return;
      }
      setChangeFeedback({ kind: 'success', text: `Your plan has been changed to ${newTier}. Your monthly contribution updates accordingly.` });
      await fetchSubscriptions();
      setChangePlanId(null);
      setPendingTier(null);
    } catch {
      setChangeFeedback({ kind: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setChangingId(null);
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setEmailFeedback(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(newEmail)) {
      setEmailFeedback({ kind: 'error', text: 'Enter a valid email address.' });
      return;
    }
    setEmailSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) {
        setEmailFeedback({ kind: 'error', text: error.message || 'Could not update email.' });
        return;
      }
      setEmailFeedback({ kind: 'success', text: 'Check your inbox — confirmation links were sent to your current and new addresses. The change completes once confirmed.' });
      setNewEmail('');
    } catch {
      setEmailFeedback({ kind: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setEmailSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordFeedback(null);
    if (newPassword.length < 8) {
      setPasswordFeedback({ kind: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ kind: 'error', text: 'Passwords do not match.' });
      return;
    }
    setPasswordSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordFeedback({ kind: 'error', text: error.message || 'Could not update password.' });
        return;
      }
      setPasswordFeedback({ kind: 'success', text: 'Your password has been updated.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordFeedback({ kind: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        <SecondaryNavbar />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <SecondaryNavbar />
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-16 flex-grow w-full space-y-6 md:space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">My Account</p>
            <h1 className="text-3xl md:text-4xl font-black uppercase italic text-indigo-950 tracking-tighter">Welcome back.</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-900 transition-colors uppercase tracking-widest text-[0.625rem] md:text-xs"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>

        {/* ============ MEMBERSHIP ============ */}
        <SectionCard icon={<ShieldCheck size={18} className="text-slate-400" />} title="Membership">
          {subscriptions === null ? (
            <p className="text-sm text-slate-400 font-medium animate-pulse">Loading your membership...</p>
          ) : subsError ? (
            <Feedback kind="error">{subsError}</Feedback>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500 font-medium mb-4">No membership is linked to this account yet.</p>
              <button
                onClick={() => navigate('/circles')}
                className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-900 transition-colors uppercase tracking-widest text-xs"
              >
                Join a circle <ChevronRight size={14} />
              </button>
              <p className="text-[0.625rem] text-slate-400 font-medium mt-4">
                Recently joined? If you haven't confirmed your email yet, your membership links up as soon as you do.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => {
                const tierStyle = TIER_DISPLAY[sub.tier] || TIER_DISPLAY.silver;
                const statusStyle = STATUS_STYLES[sub.status] || STATUS_STYLES.cancelled;
                const isActive = sub.status === 'active';
                return (
                  <div key={sub.id} className="border border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-5">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${tierStyle.dot}`}></div>
                        <div>
                          <p className={`text-lg md:text-xl font-black uppercase italic tracking-tight leading-none ${tierStyle.text}`}>{sub.tier}</p>
                          <p className="text-[0.625rem] font-bold uppercase tracking-widest text-slate-400 mt-1">
                            {sub.communities?.name || 'General'} · ${tierStyle.price}/month
                          </p>
                        </div>
                      </div>
                      <span className={`text-[0.625rem] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${statusStyle}`}>
                        {sub.status === 'past_due' ? 'Past Due' : sub.status}
                      </span>
                    </div>

                    {isActive && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        {changePlanId === sub.id ? (
                          <div className="animate-in fade-in">
                            <p className="text-xs font-bold text-slate-700 mb-3">Choose your plan</p>
                            <div className="grid grid-cols-3 gap-2">
                              {['silver', 'gold', 'diamond'].map((t) => {
                                const ts = TIER_DISPLAY[t];
                                const isCurrent = t === sub.tier;
                                const isPending = t === pendingTier;
                                return (
                                  <button
                                    key={t}
                                    type="button"
                                    disabled={isCurrent || changingId === sub.id}
                                    onClick={() => setPendingTier(isPending ? null : t)}
                                    className={`relative p-3 rounded-xl border-2 text-center transition-all ${
                                      isCurrent
                                        ? 'border-slate-200 bg-slate-50 cursor-default'
                                        : isPending
                                          ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100'
                                          : 'border-slate-200 bg-white hover:border-slate-300'
                                    }`}
                                  >
                                    {isCurrent && <p className="text-[0.5rem] font-black uppercase tracking-widest text-slate-400 mb-1">Current</p>}
                                    <p className={`text-sm font-black uppercase italic tracking-tight ${ts.text}`}>{t}</p>
                                    <p className="text-[0.625rem] font-bold text-slate-500 mt-0.5">${ts.price}/mo</p>
                                    <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5 text-left">
                                      <div>
                                        <p className="text-[0.5rem] font-bold uppercase tracking-widest text-slate-400 leading-none">Grand Prize</p>
                                        <p className={`text-[0.6875rem] font-black ${ts.text}`}>{ts.prize}</p>
                                      </div>
                                      <div>
                                        <p className="text-[0.5rem] font-bold uppercase tracking-widest text-slate-400 leading-none">Odds up to</p>
                                        <p className="text-[0.6875rem] font-black text-slate-700 tabular-nums">{ts.odds}</p>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {pendingTier ? (
                              <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3 animate-in fade-in">
                                <p className="text-[0.6875rem] text-indigo-900 font-medium leading-relaxed mb-3">
                                  {TIER_DISPLAY[pendingTier].price > tierStyle.price ? 'Upgrade' : 'Downgrade'} to{' '}
                                  <span className="font-black uppercase">{pendingTier}</span> — your monthly contribution changes from{' '}
                                  <span className="font-bold">${tierStyle.price}</span> to <span className="font-bold">${TIER_DISPLAY[pendingTier].price}</span>, and you'll move to a {pendingTier} circle.
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleChangeTier(sub.id, pendingTier)}
                                    disabled={changingId === sub.id}
                                    className="px-4 py-2 bg-indigo-900 text-white rounded-lg text-[0.625rem] font-black uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-60"
                                  >
                                    {changingId === sub.id ? 'Changing...' : 'Confirm Change'}
                                  </button>
                                  <button
                                    onClick={() => { setChangePlanId(null); setPendingTier(null); }}
                                    disabled={changingId === sub.id}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[0.625rem] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setChangePlanId(null); setPendingTier(null); }}
                                className="mt-3 text-[0.625rem] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                Close
                              </button>
                            )}
                          </div>
                        ) : confirmCancelId === sub.id ? (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-in fade-in">
                            <p className="text-xs font-bold text-red-700 mb-1">Cancel this membership?</p>
                            <p className="text-[0.6875rem] text-red-600/80 font-medium leading-relaxed mb-3">
                              You'll leave your circle and stop future monthly contributions. This can't be undone from here.
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCancel(sub.id)}
                                disabled={cancellingId === sub.id}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-[0.625rem] font-black uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-60"
                              >
                                {cancellingId === sub.id ? 'Cancelling...' : 'Yes, Cancel'}
                              </button>
                              <button
                                onClick={() => setConfirmCancelId(null)}
                                disabled={cancellingId === sub.id}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[0.625rem] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                              >
                                Keep Membership
                              </button>
                            </div>
                            {/* Offer a lower tier as an alternative to leaving — shown only when
                                there's actually a cheaper plan to move to. Purely optional; the
                                cancel button above stays a single click. */}
                            {tierStyle.price > 250 && (
                              <p className="mt-3 pt-3 border-t border-red-200/60 text-[0.6875rem] text-slate-600 font-medium leading-relaxed">
                                Prefer to lower your monthly contribution instead of leaving?{' '}
                                <button
                                  onClick={() => { setConfirmCancelId(null); setChangePlanId(sub.id); setPendingTier(null); setCancelFeedback(null); }}
                                  disabled={cancellingId === sub.id}
                                  className="font-bold text-indigo-600 hover:text-indigo-900 underline transition-colors"
                                >
                                  Change your plan
                                </button>
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <button
                              onClick={() => { setChangePlanId(sub.id); setPendingTier(null); setConfirmCancelId(null); setChangeFeedback(null); }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-indigo-200 text-indigo-700 text-[0.625rem] font-black uppercase tracking-widest hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                            >
                              <ArrowUpDown size={12} /> Change plan
                            </button>
                            <button
                              onClick={() => { setConfirmCancelId(sub.id); setChangePlanId(null); setPendingTier(null); setCancelFeedback(null); }}
                              className="text-[0.5625rem] font-bold uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors"
                            >
                              Cancel membership
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {changeFeedback && <Feedback kind={changeFeedback.kind}>{changeFeedback.text}</Feedback>}
              {cancelFeedback && <Feedback kind={cancelFeedback.kind}>{cancelFeedback.text}</Feedback>}
            </div>
          )}
        </SectionCard>

        {/* ============ EMAIL ============ */}
        <SectionCard icon={<Mail size={18} className="text-slate-400" />} title="Email Address">
          <p className="text-sm text-slate-600 font-medium mb-5">
            Signed in as <span className="font-bold text-slate-900">{user.email}</span>
          </p>
          <form onSubmit={handleEmailChange} className="space-y-3">
            <div>
              <label htmlFor="new-email" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">New Email</label>
              <input
                id="new-email"
                type="email"
                autoComplete="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={inputClass}
                placeholder="new@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={emailSubmitting}
              className="px-6 py-3 bg-indigo-900 text-white rounded-xl font-black uppercase tracking-widest text-[0.625rem] md:text-xs hover:bg-black transition-all disabled:opacity-70"
            >
              {emailSubmitting ? 'Sending...' : 'Update Email'}
            </button>
          </form>
          <p className="text-[0.625rem] text-slate-400 font-medium mt-3 leading-relaxed">
            For your security, we'll email a confirmation link to both your current and new address before anything changes.
          </p>
          {emailFeedback && <Feedback kind={emailFeedback.kind}>{emailFeedback.text}</Feedback>}
        </SectionCard>

        {/* ============ PASSWORD ============ */}
        <SectionCard icon={<Lock size={18} className="text-slate-400" />} title="Password">
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="account-new-password" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">New Password</label>
                <input
                  id="account-new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label htmlFor="account-confirm-password" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Confirm Password</label>
                <input
                  id="account-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Re-enter password"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={passwordSubmitting}
              className="px-6 py-3 bg-indigo-900 text-white rounded-xl font-black uppercase tracking-widest text-[0.625rem] md:text-xs hover:bg-black transition-all disabled:opacity-70"
            >
              {passwordSubmitting ? 'Saving...' : 'Change Password'}
            </button>
          </form>
          {passwordFeedback && <Feedback kind={passwordFeedback.kind}>{passwordFeedback.text}</Feedback>}
        </SectionCard>

        {/* ============ BILLING (Stripe-dependent, scaffolded) ============ */}
        <SectionCard icon={<CreditCard size={18} className="text-slate-400" />} title="Billing">
          <div className="space-y-3">
            {/*
              When Stripe goes live these buttons open a Stripe-hosted
              Customer Portal session (created by an edge function), so card
              details and receipts are handled entirely on Stripe's side.
            */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <CreditCard size={16} className="text-slate-400" />
                <div>
                  <p className="text-sm font-bold text-slate-700">Payment Method</p>
                  <p className="text-[0.625rem] text-slate-400 font-medium">Update your card or bank securely via Stripe</p>
                </div>
              </div>
              <span className="text-[0.5625rem] font-black uppercase tracking-widest text-slate-400 bg-slate-200/60 px-2.5 py-1 rounded-full whitespace-nowrap">Coming Soon</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <Receipt size={16} className="text-slate-400" />
                <div>
                  <p className="text-sm font-bold text-slate-700">Receipts</p>
                  <p className="text-[0.625rem] text-slate-400 font-medium">Download past contribution receipts</p>
                </div>
              </div>
              <span className="text-[0.5625rem] font-black uppercase tracking-widest text-slate-400 bg-slate-200/60 px-2.5 py-1 rounded-full whitespace-nowrap">Coming Soon</span>
            </div>
            <p className="text-[0.625rem] text-slate-400 font-medium leading-relaxed pt-1">
              Billing management becomes available when payment processing goes live. Payment details are handled exclusively by Stripe — they never touch our servers.
            </p>
          </div>
        </SectionCard>

        <p className="text-[0.625rem] text-slate-400 font-medium text-center flex items-center justify-center gap-1.5">
          <User size={11} /> Need help? <a href="/contact" className="underline hover:text-slate-600 transition-colors">Contact support</a>
        </p>
      </div>
      <Footer />
    </div>
  );
};

export default AccountPage;
