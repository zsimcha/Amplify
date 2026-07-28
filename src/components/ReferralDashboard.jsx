// src/components/ReferralDashboard.jsx
// The ambassador's view of their own referral program, rendered inside the
// normal account page.
//
// Visibility is gated purely on whether the signed-in account has a row in
// `affiliates` — get_my_affiliate_dashboard returns null when it doesn't, and
// this renders nothing at all. Donors see their account page exactly as before.
// Turning the program on for more people later is inserting rows, not shipping
// code.
//
// Nothing here depends on the account having a subscription.
import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, Users, MousePointerClick, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { referralUrl } from '../lib/referral';

const money = (cents) => `$${((cents || 0) / 100).toLocaleString('en-US', {
  minimumFractionDigits: (cents || 0) % 100 === 0 ? 0 : 2,
  maximumFractionDigits: 2,
})}`;

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

// How each milestone state reads to the ambassador. The wording leans on
// "approved" rather than "ready" because from their side the meaningful
// distinction is whether it has cleared review, not whether we've queued it.
const MILESTONE_LABEL = {
  not_earned:  { text: 'Not yet earned', className: 'bg-slate-100 text-slate-500 border-slate-200' },
  pending:     { text: 'In review',      className: 'bg-amber-50 text-amber-700 border-amber-200' },
  ready:       { text: 'Approved',       className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  paid:        { text: 'Paid',           className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  void:        { text: 'Not eligible',   className: 'bg-slate-100 text-slate-400 border-slate-200' },
  clawed_back: { text: 'Reversed',       className: 'bg-red-50 text-red-600 border-red-200' },
};

const MilestoneBadge = ({ label, status, amountCents }) => {
  const style = MILESTONE_LABEL[status] || MILESTONE_LABEL.not_earned;
  const muted = status === 'not_earned' || status === 'void';
  return (
    <div className={`flex-1 min-w-[8rem] rounded-xl border p-3 ${muted ? 'bg-slate-50/60 border-slate-100' : 'bg-white border-slate-200'}`}>
      <p className="text-[0.5rem] font-bold uppercase tracking-widest text-slate-400 leading-none mb-1.5">{label}</p>
      <p className={`text-base font-black tabular-nums leading-none mb-2 ${muted ? 'text-slate-300' : 'text-indigo-950'}`}>
        {money(amountCents)}
      </p>
      <span className={`inline-block text-[0.5rem] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${style.className}`}>
        {style.text}
      </span>
    </div>
  );
};

const StatTile = ({ label, value, accent }) => (
  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
    <p className="text-[0.5rem] md:text-[0.5625rem] font-bold uppercase tracking-widest text-slate-400 leading-none mb-2">{label}</p>
    <p className={`text-xl md:text-2xl font-black tabular-nums tracking-tight leading-none ${accent || 'text-indigo-950'}`}>{value}</p>
  </div>
);

const ReferralDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(undefined); // undefined = loading, null = not an affiliate
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      const { data: result, error: rpcError } = await supabase.rpc('get_my_affiliate_dashboard');
      if (cancelled) return;
      if (rpcError) {
        setError('Could not load your referral dashboard. Please refresh the page.');
        setData(null);
        return;
      }
      // null here means "this account has no affiliate row" — the gate.
      setData(result ?? null);
    };

    load();
    return () => { cancelled = true; };
  }, [user]);

  // Loading, or this account simply isn't an ambassador — render nothing.
  if (data === undefined || (data === null && !error)) return null;

  if (error) {
    return (
      <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-soft p-6 md:p-8">
        <div className="p-3 rounded-xl text-xs font-bold flex items-start gap-2 bg-red-50 border border-red-200 text-red-600">
          <AlertCircle size={14} className="mt-0.5 shrink-0" /><p>{error}</p>
        </div>
      </div>
    );
  }

  const {
    affiliate, totals, referrals,
    click_count: clickCount,
    hold_days: holdDays,
    payout_1_amount_cents: payout1,
    payout_2_amount_cents: payout2,
  } = data;
  const link = referralUrl(affiliate.slug);
  const outstanding = (totals.earned_cents || 0) - (totals.paid_cents || 0);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-soft p-6 md:p-8">
      <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-indigo-950 mb-6 border-b border-slate-200 pb-4 flex items-center gap-2">
        <Share2 size={18} className="text-slate-400" /> Referrals
      </h2>

      {!affiliate.is_active && (
        <div className="mb-6 p-3 rounded-xl text-xs font-bold flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <p>Your referral link is currently paused. Existing referrals are unaffected — reach out if you think this is a mistake.</p>
        </div>
      )}

      {/* ---------- Share link ---------- */}
      <div className="mb-6">
        <p className="text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Your referral link</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
            aria-label="Your referral link"
            className="flex-grow bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 min-w-0"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 px-5 py-3 bg-indigo-900 text-white rounded-xl font-black uppercase tracking-widest text-[0.625rem] md:text-xs hover:bg-black transition-colors flex items-center justify-center gap-2"
          >
            {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
        <p className="text-[0.625rem] text-slate-400 font-medium mt-2 leading-relaxed">
          Anyone who joins within 90 days of clicking your link is credited to you.
        </p>
      </div>

      {/* ---------- Totals ---------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile label="Total earned" value={money(totals.earned_cents)} />
        <StatTile label="Paid out"     value={money(totals.paid_cents)} accent="text-emerald-600" />
        <StatTile label="Outstanding"  value={money(outstanding)}       accent="text-indigo-600" />
        <StatTile label="Referrals"    value={totals.referral_count ?? 0} />
      </div>

      <p className="text-[0.625rem] text-slate-400 font-medium mb-6 leading-relaxed flex items-center gap-1.5">
        <MousePointerClick size={11} className="shrink-0" />
        {clickCount} {clickCount === 1 ? 'click' : 'clicks'} on your link so far.
      </p>

      {/* ---------- Referral list ---------- */}
      {referrals.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
          <Users size={20} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">No referrals yet.</p>
          <p className="text-[0.625rem] text-slate-400 font-medium mt-1">Share your link above to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map((r) => (
            <div key={r.id} className="border border-slate-200 rounded-xl md:rounded-2xl p-4">
              <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
                <p className="text-sm font-bold text-slate-700 break-all">{r.referred_email_masked}</p>
                <p className="text-[0.5625rem] font-bold uppercase tracking-widest text-slate-400">
                  Joined {formatDate(r.signed_up_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <MilestoneBadge label="1st payment"  status={r.payout_1_status} amountCents={r.payout_1_amount_cents} />
                <MilestoneBadge label="2nd payment"  status={r.payout_2_status} amountCents={r.payout_2_amount_cents} />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[0.625rem] text-slate-400 font-medium mt-6 leading-relaxed">
        You earn {money(payout1)} when someone you referred completes their first monthly contribution, and another {money(payout2)} when
        they complete their second. Each amount is held for {holdDays} days after the contribution clears before it's approved for
        payout. Full details are in the <a href="/referral" className="underline hover:text-slate-600 transition-colors">referral program terms</a>.
      </p>
    </div>
  );
};

export default ReferralDashboard;
