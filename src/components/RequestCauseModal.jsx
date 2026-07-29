import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { submitCauseRequest } from '../lib/charities';

const inputClass =
  'w-full bg-slate-50 border border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 hover:bg-slate-100 rounded-xl p-3 text-sm outline-none transition-all';
const errorInputClass =
  'w-full bg-red-50/30 border border-red-400 ring-1 ring-red-400 rounded-xl p-3 text-sm outline-none transition-all';

// Lets a member nominate an organization for the partner roster. Submits via
// the request_cause RPC, which re-validates everything server-side.
const RequestCauseModal = ({ open, onClose, onSubmitted }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [done, setDone] = useState(false);
  const firstFieldRef = useRef(null);

  // Reset to a clean form each time it opens, and focus the first field.
  useEffect(() => {
    if (!open) return;
    setName(''); setUrl(''); setNote('');
    setErrors({}); setSubmitError(null); setDone(false); setSubmitting(false);
    const t = setTimeout(() => firstFieldRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  // Escape closes, matching the other dialogs on this page.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const validate = () => {
    const next = {};
    if (name.trim().length < 2) next.name = 'Enter the organization name.';
    // Accept a bare domain — the RPC adds the scheme if it's missing.
    const cleaned = url.trim().replace(/^https?:\/\//i, '');
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(cleaned)) next.url = 'Enter a valid website (e.g. example.org).';
    if (note.length > 1000) next.note = 'Please keep this under 1000 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await submitCauseRequest({ name: name.trim(), url: url.trim(), note: note.trim() });
      setDone(true);
      onSubmitted?.();
    } catch (err) {
      // Surface the RPC's own message (e.g. the open-request cap) when present.
      setSubmitError(err?.message?.replace(/^.*?:\s*/, '') || 'Could not send your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Request an organization"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
        >
          <X size={18} />
        </button>

        {done ? (
          <div className="text-center py-4">
            <div className="bg-emerald-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={26} className="text-emerald-600" />
            </div>
            <h3 className="text-xl md:text-2xl font-black uppercase italic text-indigo-950 tracking-tight mb-2">Request sent</h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
              Thanks for the suggestion. Our team reviews every organization that's submitted, and we'll
              reach out if we need anything else.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-indigo-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-xl md:text-2xl font-black uppercase italic text-indigo-950 tracking-tight mb-2 pr-6">
              Request an organization
            </h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-5">
              Know a Chessed organization we should support? Tell us about it below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="req-org-name" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Organization Name
                </label>
                <input
                  id="req-org-name"
                  ref={firstFieldRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={errors.name ? errorInputClass : inputClass}
                  placeholder="e.g. Yad Eliezer"
                  maxLength={120}
                />
                {errors.name && <p className="text-red-500 text-[0.625rem] mt-1 font-bold">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="req-org-url" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Website
                </label>
                <input
                  id="req-org-url"
                  type="text"
                  inputMode="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={errors.url ? errorInputClass : inputClass}
                  placeholder="example.org"
                  maxLength={500}
                />
                {errors.url && <p className="text-red-500 text-[0.625rem] mt-1 font-bold">{errors.url}</p>}
              </div>

              <div>
                <label htmlFor="req-org-note" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Why this organization? <span className="text-slate-400 normal-case tracking-normal font-medium">(optional)</span>
                </label>
                <textarea
                  id="req-org-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={`${errors.note ? errorInputClass : inputClass} resize-none`}
                  placeholder="Anything that would help us evaluate them — the work they do, your connection to them, their impact."
                  maxLength={1000}
                />
                {errors.note && <p className="text-red-500 text-[0.625rem] mt-1 font-bold">{errors.note}</p>}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <p className="text-[0.75rem] text-slate-600 font-medium leading-relaxed">
                  Every request is reviewed by our team. We check financials, impact, and track record before
                  adding any organization, so this takes time and not every request becomes a partner.
                </p>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-bold flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" /> <p>{submitError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-indigo-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? 'Sending...' : <><Send size={14} /> Send Request</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default RequestCauseModal;
