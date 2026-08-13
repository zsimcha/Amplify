// src/pages/AdminPage.jsx
// Referral payout administration.
//
// The gate that matters is in the database: admin_list_affiliates,
// admin_list_referrals and admin_set_payout_status each call is_admin() and
// raise before touching a row. Everything in this file is presentation — a
// non-admin who navigates here gets an empty screen because the server
// returned nothing, not because the UI hid it.
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, AlertCircle, CheckCircle, ChevronDown, ChevronRight,
  RefreshCw, Wallet, Users,
} from 'lucide-react';
import SecondaryNavbar from '../components/layout/SecondaryNavbar';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const money = (cents) => `$${((cents || 0) / 100).toLocaleString('en-US', {
  minimumFractionDigits: (cents || 0) % 100 === 0 ? 0 : 2,
  maximumFractionDigits: 2,
})}`;

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const STATUS_STYLE = {
  not_earned:  'bg-slate-100 text-slate-400 border-slate-200',
  pending:     'bg-amber-50 text-amber-700 border-amber-200',
  ready:       'bg-indigo-50 text-indigo-700 border-indigo-200',
  paid:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  void:        'bg-slate-100 text-slate-400 border-slate-200',
  clawed_back: 'bg-red-50 text-red-600 border-red-200',
};

const StatusPill = ({ status }) => (
  <span className={`inline-block text-[0.5rem] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_STYLE[status] || STATUS_STYLE.not_earned}`}>
    {String(status).replace('_', ' ')}
  </span>
);

// One payout milestone, with the action that applies to it. "Mark paid" only
// appears once the hold window has elapsed, so nothing can be paid early by
// accident.
const MilestoneRow = ({ label, status, amountCents, paidAt, chargeAt, busy, onSetStatus }) => (
  <div className="flex items-center justify-between gap-3 flex-wrap py-2">
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-[0.5625rem] font-bold uppercase tracking-widest text-slate-400 w-16 shrink-0">{label}</span>
      <span className="text-sm font-black tabular-nums text-indigo-950">{money(amountCents)}</span>
      <StatusPill status={status} />
    </div>
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[0.5625rem] font-medium text-slate-400 tabular-nums">
        {status === 'paid' ? `Paid ${formatDate(paidAt)}` : chargeAt ? `Charged ${formatDate(chargeAt)}` : 'Awaiting charge'}
      </span>
      {status === 'ready' && (
        <button
          onClick={() => onSetStatus('paid')}
          disabled={busy}
          className="px-3 py-1.5 bg-indigo-900 text-white rounded-lg text-[0.5625rem] font-black uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-60"
        >
          {busy ? 'Saving...' : 'Mark paid'}
        </button>
      )}
      {(status === 'pending' || status === 'ready') && (
        <button
          onClick={() => onSetStatus('void')}
          disabled={busy}
          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-[0.5625rem] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-60"
        >
          Void
        </button>
      )}
      {status === 'paid' && (
        <button
          onClick={() => onSetStatus('clawed_back')}
          disabled={busy}
          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-400 rounded-lg text-[0.5625rem] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-60"
        >
          Claw back
        </button>
      )}
    </div>
  </div>
);

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [affiliates, setAffiliates] = useState(null); // null = loading
  const [denied, setDenied] = useState(false);
  const [expanded, setExpanded] = useState(null);        // affiliate id
  const [referrals, setReferrals] = useState({});        // affiliateId -> rows
  const [busyKey, setBusyKey] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [user, loading, navigate]);

  const loadAffiliates = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_list_affiliates');
    if (error) {
      setDenied(true);
      setAffiliates([]);
      return;
    }
    setDenied(false);
    setAffiliates(data || []);
  }, []);

  useEffect(() => { if (user) loadAffiliates(); }, [user, loadAffiliates]);

  const loadReferrals = useCallback(async (affiliateId) => {
    const { data, error } = await supabase.rpc('admin_list_referrals', { p_affiliate_id: affiliateId });
    if (error) return;
    setReferrals((prev) => ({ ...prev, [affiliateId]: data || [] }));
  }, []);

  const toggleExpand = (affiliateId) => {
    const next = expanded === affiliateId ? null : affiliateId;
    setExpanded(next);
    if (next && !referrals[next]) loadReferrals(next);
  };

  const handleSetStatus = async (affiliateId, referralId, milestone, status) => {
    const key = `${referralId}-${milestone}`;
    setBusyKey(key);
    setFeedback(null);
    try {
      const { error } = await supabase.rpc('admin_set_payout_status', {
        p_referral_id: referralId,
        p_milestone: milestone,
        p_status: status,
        p_note: null,
      });
      if (error) {
        setFeedback({ kind: 'error', text: error.message || 'Could not update that payout.' });
        return;
      }
      setFeedback({
        kind: 'success',
        text: status === 'paid' ? 'Marked as paid.' : status === 'void' ? 'Payout voided.' : 'Payout clawed back.',
      });
      // Refresh both the milestone detail and the affiliate's running totals.
      await Promise.all([loadReferrals(affiliateId), loadAffiliates()]);
    } catch {
      setFeedback({ kind: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setBusyKey(null);
    }
  };

  if (loading || !user || affiliates === null) {
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

  if (denied) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        <SecondaryNavbar />
        <div className="flex-grow flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-8 text-center max-w-sm">
            <ShieldCheck size={28} className="text-slate-300 mx-auto mb-4" />
            <p className="text-sm text-slate-500 font-medium">You don't have access to this page.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const grandTotals = affiliates.reduce((acc, a) => ({
    ready:   acc.ready   + (a.ready_cents   || 0),
    pending: acc.pending + (a.pending_cents || 0),
    paid:    acc.paid    + (a.paid_cents    || 0),
    referrals: acc.referrals + (a.referral_count || 0),
  }), { ready: 0, pending: 0, paid: 0, referrals: 0 });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <SecondaryNavbar />
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16 flex-grow w-full space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Admin</p>
            <h1 className="text-3xl md:text-4xl font-black uppercase italic text-indigo-950 tracking-tighter">Referral payouts</h1>
          </div>
          <button
            onClick={loadAffiliates}
            className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-900 transition-colors uppercase tracking-widest text-[0.625rem] md:text-xs"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* ---------- Program totals ---------- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Ready to pay',  value: money(grandTotals.ready),   accent: 'text-indigo-600' },
            { label: 'In hold',       value: money(grandTotals.pending), accent: 'text-amber-600' },
            { label: 'Paid to date',  value: money(grandTotals.paid),    accent: 'text-emerald-600' },
            { label: 'Referrals',     value: grandTotals.referrals,      accent: 'text-indigo-950' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-100 shadow-soft rounded-2xl p-4 md:p-5">
              <p className="text-[0.5rem] md:text-[0.5625rem] font-bold uppercase tracking-widest text-slate-400 leading-none mb-2">{s.label}</p>
              <p className={`text-xl md:text-2xl font-black tabular-nums tracking-tight leading-none ${s.accent}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {feedback && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-start gap-2 border ${
            feedback.kind === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            {feedback.kind === 'error' ? <AlertCircle size={14} className="mt-0.5 shrink-0" /> : <CheckCircle size={14} className="mt-0.5 shrink-0" />}
            <p>{feedback.text}</p>
          </div>
        )}

        {/* ---------- Affiliates ---------- */}
        <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-soft p-4 md:p-6">
          <h2 className="text-lg font-black uppercase tracking-tight text-indigo-950 mb-4 pb-3 border-b border-slate-200 flex items-center gap-2">
            <Users size={18} className="text-slate-400" /> Ambassadors ({affiliates.length})
          </h2>

          {affiliates.length === 0 ? (
            <p className="text-sm text-slate-500 font-medium py-6 text-center">
              No ambassadors yet. Add rows to the <span className="font-bold">affiliates</span> table to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {affiliates.map((a) => {
                const isOpen = expanded === a.id;
                const rows = referrals[a.id];
                return (
                  <div key={a.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleExpand(a.id)}
                      className="w-full flex items-center justify-between gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isOpen ? <ChevronDown size={15} className="text-slate-400 shrink-0" /> : <ChevronRight size={15} className="text-slate-400 shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-black text-indigo-950 truncate">
                            {a.display_name || a.slug}
                            {!a.is_active && <span className="ml-2 text-[0.5rem] font-black uppercase tracking-widest text-amber-600">Paused</span>}
                            {!a.has_account && <span className="ml-2 text-[0.5rem] font-black uppercase tracking-widest text-slate-400">No account yet</span>}
                          </p>
                          <p className="text-[0.625rem] font-medium text-slate-400 truncate">
                            /{a.slug} · {a.email}
                            {a.payout_handle ? ` · ${a.payout_method || 'payout'} ${a.payout_handle}` : ''}
                            {a.click_count > 0 ? ` · ${a.converted_click_count}/${a.click_count} clicks converted` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 md:gap-5 shrink-0 text-right">
                        <div>
                          <p className="text-[0.5rem] font-bold uppercase tracking-widest text-slate-400 leading-none">Owed</p>
                          <p className={`text-sm font-black tabular-nums ${a.ready_cents > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>{money(a.ready_cents)}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-[0.5rem] font-bold uppercase tracking-widest text-slate-400 leading-none">Hold</p>
                          <p className="text-sm font-black tabular-nums text-slate-500">{money(a.pending_cents)}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-[0.5rem] font-bold uppercase tracking-widest text-slate-400 leading-none">Paid</p>
                          <p className="text-sm font-black tabular-nums text-emerald-600">{money(a.paid_cents)}</p>
                        </div>
                        <div>
                          <p className="text-[0.5rem] font-bold uppercase tracking-widest text-slate-400 leading-none">Refs</p>
                          <p className="text-sm font-black tabular-nums text-slate-500">{a.referral_count}</p>
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                        {!rows ? (
                          <p className="text-xs text-slate-400 font-medium animate-pulse">Loading referrals...</p>
                        ) : rows.length === 0 ? (
                          <p className="text-xs text-slate-500 font-medium">
                            No referrals yet. {a.click_count} {a.click_count === 1 ? 'click' : 'clicks'} on their link, none converted.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {rows.map((r) => (
                              <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-3 md:p-4">
                                <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2 pb-2 border-b border-slate-100">
                                  <p className="text-xs font-bold text-slate-700 break-all">{r.referred_email}</p>
                                  <p className="text-[0.5625rem] font-bold uppercase tracking-widest text-slate-400">
                                    Joined {formatDate(r.signed_up_at)}
                                    {r.subscription_status ? ` · ${r.subscription_tier} · ${r.subscription_status}` : ''}
                                  </p>
                                </div>
                                <MilestoneRow
                                  label="1st"
                                  status={r.payout_1_status}
                                  amountCents={r.payout_1_amount_cents}
                                  paidAt={r.payout_1_paid_at}
                                  chargeAt={r.first_charge_at}
                                  busy={busyKey === `${r.id}-1`}
                                  onSetStatus={(s) => handleSetStatus(a.id, r.id, 1, s)}
                                />
                                <MilestoneRow
                                  label="2nd"
                                  status={r.payout_2_status}
                                  amountCents={r.payout_2_amount_cents}
                                  paidAt={r.payout_2_paid_at}
                                  chargeAt={r.second_charge_at}
                                  busy={busyKey === `${r.id}-2`}
                                  onSetStatus={(s) => handleSetStatus(a.id, r.id, 2, s)}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-[0.625rem] text-slate-400 font-medium text-center flex items-center justify-center gap-1.5">
          <Wallet size={11} /> Payouts are sent manually. Marking a milestone paid only records that you've sent it.
        </p>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPage;
