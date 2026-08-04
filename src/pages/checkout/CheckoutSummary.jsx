import React from 'react';
import { Link } from 'react-router-dom';
import { TIER_ACCENT } from '../../lib/constants';

// Order summary — used in both the desktop sticky card and the mobile
// expanded view. Pulled from the original inline SummaryContent, so styling
// stays identical.
const CheckoutSummary = ({ selectedTier, basePrice, tierData, feeBeingCovered, processingFee, totalCharged }) => {
  const tierColor = TIER_ACCENT[selectedTier].text;

  return (
    <>
      <div className="space-y-4 md:space-y-6">
        <div>
          <p className="text-[0.5625rem] md:text-[0.625rem] font-bold text-indigo-400 uppercase tracking-widest mb-1">Selected Circle</p>
          <p className={`text-2xl md:text-3xl font-black uppercase italic tracking-tighter ${tierColor}`}>{selectedTier}</p>
        </div>
        <div className="w-full h-px bg-white/10"></div>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[0.5625rem] md:text-[0.625rem] font-bold text-indigo-400 uppercase tracking-widest mb-1">Monthly Gift</p>
            <p className="text-lg md:text-xl font-bold">${basePrice.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[0.5625rem] md:text-[0.625rem] font-bold text-indigo-400 uppercase tracking-widest mb-1">Grand Prize</p>
            <p className={`text-lg md:text-xl font-bold ${tierColor}`}>{tierData[selectedTier].prize}</p>
          </div>
        </div>

        {/* Fee line — only when card/wallet selected with cover-fee on */}
        {feeBeingCovered && (
          <>
            <div className="w-full h-px bg-white/10"></div>
            <div className="flex justify-between items-center animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2">
                <p className="text-[0.625rem] md:text-[0.6875rem] font-bold text-indigo-400 uppercase tracking-widest">Processing Fee</p>
                <span className="text-[0.625rem] md:text-[0.6875rem] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded">Covered</span>
              </div>
              <p className="text-sm md:text-base font-bold tabular-nums">+${processingFee.toFixed(2)}</p>
            </div>
          </>
        )}

        {/* Total */}
        <div className="w-full h-px bg-white/10"></div>
        <div className="flex justify-between items-center pt-1">
          <p className="text-xs md:text-sm font-black text-white uppercase tracking-widest">Total / Month</p>
          <p className="text-2xl md:text-3xl font-black tabular-nums">${totalCharged.toFixed(2)}</p>
        </div>

        {/* Odds boxes */}
        <div className="w-full h-px bg-white/10"></div>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-white/5 p-3 rounded-xl">
            <p className="text-[0.625rem] md:text-[0.6875rem] font-bold text-indigo-300 uppercase tracking-wider mb-1">Grand Prize Odds</p>
            <p className="text-[0.5625rem] font-bold uppercase tracking-widest text-indigo-300/60 leading-none mb-0.5">Up to</p>
            <p className="font-bold text-sm md:text-base">1 / 400</p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-indigo-400/30">
            <p className="text-[0.625rem] md:text-[0.6875rem] font-bold text-indigo-300 uppercase tracking-wider mb-1">Winning Odds</p>
            <p className="text-[0.5625rem] font-bold uppercase tracking-widest text-indigo-300/60 leading-none mb-0.5">Up to</p>
            <p className="font-bold text-sm md:text-base">{tierData[selectedTier].totalOdds}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 md:mt-8 space-y-3 md:space-y-4">
        <div className="p-3 md:p-4 bg-indigo-900/50 rounded-xl md:rounded-2xl border border-indigo-800/50 text-center">
          <p className="text-[0.5625rem] md:text-[0.625rem] text-indigo-200 font-medium leading-relaxed">
            Your contribution goes directly into the active pool. The drawing activates the moment your circle reaches 400 members.
          </p>
        </div>
        <p className="text-[0.625rem] md:text-[0.6875rem] text-indigo-300/70 font-medium leading-relaxed text-center px-2">
          Actual odds of winning depend on the total number of eligible entries received. No purchase necessary. See <Link to="/rules" className="underline hover:text-indigo-200 transition-colors">official rules</Link> for details.
        </p>
      </div>
    </>
  );
};

export default CheckoutSummary;
