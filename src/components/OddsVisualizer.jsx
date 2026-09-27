import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

const OddsVisualizer = ({ tierData }) => {
  const [activeTier, setActiveTier] = useState('diamond');

  // Each winner dot fills with `color` and carries a `drop-shadow` halo in
  // `glow`. The "pop" comes from a deep, high-contrast fill paired with a
  // *lighter* glow, which reads as a two-tone luminous halo. Keep that recipe
  // consistent across all three tiers so gold and diamond read as strongly as
  // silver.
  const tierConfig = {
    silver:  { winners: 4,  color: '#475569', glow: '#64748b' },
    gold:    { winners: 8,  color: '#eab308', glow: '#facc15' },
    diamond: { winners: 16, color: '#4f46e5', glow: '#818cf8' },
  };

  const winnerSet = useMemo(() => {
    const GRID = 20;
    const TOTAL = 400;
    const set = new Set();

    if (activeTier === 'silver') {
      const positions = [[2, 2], [7, 7], [12, 12], [17, 17]];
      positions.forEach(([r, c]) => set.add(r * GRID + c));
    } else if (activeTier === 'gold') {
      const positions = [
        [2, 5], [3, 14], [6, 9], [9, 17],
        [11, 3], [14, 11], [17, 6], [18, 16]
      ];
      positions.forEach(([r, c]) => set.add(r * GRID + c));
    } else {
      const w = tierConfig.diamond.winners;
      const hasAdjacent = (idx) => {
        const col = idx % GRID;
        const row = Math.floor(idx / GRID);
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < GRID && nc >= 0 && nc < GRID) {
              if (set.has(nr * GRID + nc)) return true;
            }
          }
        }
        return false;
      };
      const step = TOTAL / w;
      for (let i = 0; i < w; i++) {
        const seed = Math.floor(i * step + step / 2);
        const offsets = [0, 3, -3, 6, -6, 9, -9, 12, -12, 15, -15, 18, -18, 21, -21];
        for (const off of offsets) {
          const idx = ((seed + off) % TOTAL + TOTAL) % TOTAL;
          if (!set.has(idx) && !hasAdjacent(idx)) {
            set.add(idx);
            break;
          }
        }
      }
    }
    return set;
  }, [activeTier]);

  const cfg = tierConfig[activeTier];
  const oddsValue = tierData[activeTier].totalOdds.replace(/\s/g, '');
  // The odds callout sits on a near-black gradient, so use each tier's lighter
  // `glow` tone for the big number and winners stat rather than the now-deeper
  // dot fill (which would be too dark to read there). Silver's fill is darker
  // still, so it keeps its bespoke lighter overrides.
  const isSilver = activeTier === 'silver';
  const oddsCalloutColor = isSilver ? '#94a3b8' : cfg.glow;
  const winnersStatColor = isSilver ? '#64748b' : cfg.glow;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-soft">
      {/* Mobile-only heading — pulled above the grid so the dot matrix and the
          odds callout below it stay visible together on one screen. */}
      <div className="md:hidden mb-5 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Visualize Your Odds</p>
        <h3 className="text-2xl font-black tracking-tight text-slate-900 leading-[1.05]">
          Here's your shot at winning.
        </h3>
      </div>

      <div className="grid md:grid-cols-12 gap-6 md:gap-10 items-center">

        <div className="md:col-span-6 lg:col-span-7">
          <div className="max-w-[17rem] sm:max-w-xs mx-auto md:max-w-none">
            <svg viewBox="0 0 240 240" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {Array.from({ length: 400 }, (_, i) => {
                const col = i % 20;
                const row = Math.floor(i / 20);
                const cx = col * 12 + 6;
                const cy = row * 12 + 6;
                const isWinner = winnerSet.has(i);
                return (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={isWinner ? 4 : 3}
                    fill={isWinner ? cfg.color : '#e2e8f0'}
                    style={{
                      transition: 'r 0.4s ease, fill 0.4s ease, filter 0.4s ease',
                      transitionDelay: isWinner ? `${(i % 20) * 12}ms` : '0ms',
                      filter: isWinner ? `drop-shadow(0 0 4px ${cfg.glow}cc)` : 'none',
                    }}
                  />
                );
              })}
            </svg>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                <span>Member</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{background: cfg.color}}></div>
                <span>Winner</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-6 lg:col-span-5 space-y-5 md:space-y-6">
          <div className="hidden md:block">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-3">Visualize Your Odds</p>
            <h3 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-[1.05] mb-3">
              Here's your shot at winning.
            </h3>
            <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">
              Each dot is a member. The colored ones win. Your odds aren't theoretical. They're real.
            </p>
          </div>

          <div className="flex gap-1.5 md:gap-2 bg-slate-100 p-1.5 rounded-xl">
            {Object.keys(tierConfig).map((tier) => (
              <button
                key={tier}
                onClick={() => setActiveTier(tier)}
                className={`flex-1 px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  activeTier === tier
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

<div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 md:p-6 text-center">
  <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Your Winning Odds</p>
  <p className="text-[0.625rem] font-bold uppercase tracking-widest text-slate-500 mb-1">Up to</p>
  <p className="text-5xl md:text-6xl font-black tracking-tighter mb-1 leading-none" style={{color: oddsCalloutColor}}>
    {oddsValue}
  </p>
  <p className="text-xs text-slate-400 font-medium mt-1.5">when the circle fills</p>
</div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Members</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter tabular-nums">400</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Winners</p>
              <p className="text-2xl md:text-3xl font-black tracking-tighter tabular-nums" style={{color: winnersStatColor}}>{cfg.winners}</p>
            </div>
          </div>

          <p className="text-[0.625rem] text-slate-400 font-medium leading-relaxed pt-3 border-t border-slate-100">
            Image for illustrative purposes only. Actual odds of winning depend on total eligible entries. No purchase necessary. See <Link to="/rules" className="underline hover:text-slate-600 transition-colors">official rules</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OddsVisualizer;
