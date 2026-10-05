import React from 'react';
import { Link } from 'react-router-dom';

// Stub for the public winners list. Master Rules §24 says a winners list is
// available by visiting the Official Rules page or writing in — it doesn't
// require a separate URL — but a dedicated page scales better than growing a
// table at the bottom of /rules once Drawings have actually been held. No
// Drawing has occurred yet (the Drawing Addendum on /rules is still a dated
// template), so there's nothing to list; this just states that plainly
// instead of showing an empty table.
const WinnersListContent = () => (
  <>
    <div className="rounded-2xl md:rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12 md:py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-indigo-600 mb-4">Coming soon</p>
      <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 mb-3">
        No Drawings have been held yet.
      </h3>
      <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
        Once a Circle's first Drawing is held, winners will be listed here as required by the{' '}
        <Link to="/rules" className="text-indigo-600 font-bold hover:underline">Official Sweepstakes Rules</Link>.
      </p>
    </div>
    <p className="mt-10 text-sm md:text-base text-slate-500 leading-relaxed">
      To request a list of winners once Drawings have been held, see Section 24 of the{' '}
      <Link to="/rules" className="text-indigo-600 font-bold hover:underline">Official Sweepstakes Rules</Link>.
      The winners list is provided free of charge; residents of Vermont may omit return postage.
    </p>
  </>
);

export default WinnersListContent;
