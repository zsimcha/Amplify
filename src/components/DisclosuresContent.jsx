import React from 'react';
import { Link } from 'react-router-dom';

// Stub for the state charitable-solicitation disclosures Terms of Use §2
// promises at this URL. Real content here is per-state registration numbers
// and required point-of-solicitation language, none of which exist yet (the
// Master Rules and the Drawing Addendum on /rules are still full of the same
// kind of bracketed placeholders) — so this is an honest "being finalized"
// placeholder rather than fabricated registration data.
const DisclosuresContent = () => (
  <>
    <div className="rounded-2xl md:rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12 md:py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-indigo-600 mb-4">Coming soon</p>
      <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 mb-3">
        State charitable solicitation disclosures are being finalized.
      </h3>
      <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
        Amplify Give LLC is completing the state-by-state charitable solicitation registrations
        referenced in the Terms of Use. Each state's registration number and required disclosure
        language will be listed here as filings complete.
      </p>
    </div>
    <p className="mt-10 text-sm md:text-base text-slate-500 leading-relaxed">
      In the meantime, the relationship between Amplify, the Foundation, and the organizations you
      support is described in full in the{' '}
      <Link to="/terms" className="text-indigo-600 font-bold hover:underline">Terms of Use</Link> and the{' '}
      <Link to="/rules" className="text-indigo-600 font-bold hover:underline">Official Sweepstakes Rules</Link>.
    </p>
  </>
);

export default DisclosuresContent;
