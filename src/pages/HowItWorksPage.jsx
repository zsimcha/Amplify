import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { ChevronRight } from 'lucide-react';

const useCountUp = (target, duration = 1500, trigger = false) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let raf;
    let startTime;
    const animate = (ts) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, trigger]);
  return val;
};

const useInView = (threshold = 0.3) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        obs.disconnect();
      }
    }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

const useCarouselActive = (count) => {
  const ref = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    const cards = el.querySelectorAll('[data-card]');
    if (!cards.length) return;
    let closest = 0;
    let minDist = Infinity;
    cards.forEach((card, i) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const dist = Math.abs(cardCenter - center);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setActiveIdx(Math.min(closest, count - 1));
  };
  return [ref, activeIdx, handleScroll];
};


// ============================================================================
// ODDS VISUALIZER
// ============================================================================
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
          <div className="max-w-[15rem] sm:max-w-xs mx-auto md:max-w-none">
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

// ============================================================================
// POOL COMPARISON
// ============================================================================
const PoolComparison = ({ appData }) => {
  const tiers = ['silver', 'gold', 'diamond'];

  const styles = {
    silver:  { label: 'Silver',  from: '#cbd5e1', to: '#94a3b8', labelText: 'text-slate-500' },
    gold:    { label: 'Gold',    from: '#fde68a', to: '#eab308', labelText: 'text-amber-600' },
    diamond: { label: 'Diamond', from: '#a5b4fc', to: '#6366f1', labelText: 'text-indigo-600' },
  };

  const max = appData.tierData.diamond.price * 400;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-soft">
      <div className="mb-8 md:mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Monthly Pool</p>
        <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
          Each tier, when full.
        </h3>
      </div>

      <div className="flex items-end justify-center md:justify-around gap-3 md:gap-8 h-[17.5rem] md:h-[21.25rem] border-b-2 border-slate-200 relative">
        <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none" aria-hidden>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="border-t border-slate-100 border-dashed h-0"></div>
          ))}
        </div>

        {tiers.map((tier) => {
          const pool = appData.tierData[tier].price * 400;
          const heightPct = (pool / max) * 100;
          const s = styles[tier];

          return (
            <div key={tier} className="flex-1 max-w-[8.75rem] flex flex-col items-center justify-end relative h-full">
              <p className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter mb-3 tabular-nums">
                ${(pool / 1000).toFixed(0)}k
              </p>
              <div
                className="w-full rounded-t-xl relative overflow-hidden shadow-soft transition-[height] duration-1000 ease-out"
                style={{
                  height: `${heightPct}%`,
                  background: `linear-gradient(180deg, ${s.from} 0%, ${s.to} 100%)`,
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, transparent 0, transparent 11px, rgba(255,255,255,0.18) 11px, rgba(255,255,255,0.18) 12px)',
                  }}
                />
                <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent pointer-events-none"></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start justify-center md:justify-around gap-3 md:gap-8 mt-4">
        {tiers.map((tier) => {
          const s = styles[tier];
          return (
            <div key={tier} className="flex-1 max-w-[8.75rem] text-center">
              <p className={`text-xs font-black uppercase tracking-[0.25em] ${s.labelText} mb-1`}>{s.label}</p>
              <p className="text-xs font-medium text-slate-400 tabular-nums">
                ${appData.tierData[tier].price.toLocaleString()}/mo × 400
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// ============================================================================
// WHY PRIZES
// ============================================================================
const WhyPrizes = () => {
  const [cardsRef, cardsInView] = useInView(0.4);
  const count40 = useCountUp(40, 1400, cardsInView);
  const count400 = useCountUp(400, 2000, cardsInView);

  return (
    <section className="py-20 md:py-28 px-4 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-14 reveal">
  <p className="text-xs font-bold text-amber-600 uppercase tracking-[0.3em] mb-4">The Prizes</p>
<h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-slate-900">Designed To Keep Giving Alive</h2>
</div>

        <div ref={cardsRef} className="flex flex-col md:flex-row items-stretch gap-3 md:gap-4 mb-12 md:mb-16 max-w-4xl mx-auto pt-8 md:pt-6">

          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-4">Traditional Giving</p>
            <p className="text-6xl md:text-7xl font-black text-slate-300 tracking-tighter mb-1 leading-none tabular-nums">
              ${count40}K
            </p>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 mt-2">Fragmented Monthly Fundraising</p>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-auto">Donations become inconsistent. Momentum fades. Funding stays limited.</p>
            <div className="mt-6 pt-5 border-t border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Recurring Donor Fatigue</p>
              <p className="text-xl font-black text-slate-400 tracking-tight tabular-nums">Funding Dries Up</p>
            </div>
          </div>

          <div className="flex justify-center items-center md:flex-shrink-0 -my-6 md:my-0 md:-mx-6 z-20 relative pointer-events-none">
            <div
              className="bg-amber-400 text-slate-900 rounded-full w-24 h-24 md:w-32 md:h-32 flex flex-col items-center justify-center shadow-amber-glow ring-8 ring-white transition-all duration-700 ease-out"
              style={{
                opacity: cardsInView ? 1 : 0,
                transform: cardsInView ? 'scale(1)' : 'scale(0.4)',
                transitionDelay: '600ms',
              }}
            >
              <span className="text-4xl md:text-5xl font-black tracking-tighter leading-none">10×</span>
              <span className="text-xs font-bold uppercase tracking-widest mt-1">Bigger</span>
            </div>
          </div>

          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-soft-xl relative flex flex-col">
            <div className="absolute -top-3 left-6 md:left-10 bg-amber-400 text-slate-900 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md z-10">Amplify</div>

            <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400 mb-4">Incentivized Giving</p>
            <p className="text-6xl md:text-7xl font-black text-amber-400 tracking-tighter mb-1 leading-none tabular-nums">
              ${count400}K
            </p>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400/70 mb-3 mt-2">Collective Monthly Fundraising</p>
            <p className="text-sm text-slate-300 font-medium leading-relaxed mb-auto">Prizes keep members showing up, month after month. That consistency is what turns modest monthly gifts into six-figure grants for the causes you choose.</p>
            <div className="mt-6 pt-5 border-t border-slate-800">
              <p className="text-xs font-bold text-amber-400/70 uppercase tracking-widest mb-1">Retention Based Model</p>
              <p className="text-xl font-black text-amber-400 tracking-tight tabular-nums">Built For Consistency</p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto text-center reveal">
          <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed mb-8">
            We allocate less to prizes than most charities spend to acquire donors. A smaller percentage of a much larger pool delivers more.
          </p>
          <p className="text-sm md:text-base font-black uppercase tracking-widest border-t-4 border-amber-400 inline-block pt-6 text-slate-900">
            That's not a compromise. That's how we optimize.
          </p>
        </div>
      </div>
    </section>
  );
};


// ============================================================================
// MAIN PAGE
// ============================================================================
const HowItWorksPage = ({ appData }) => {
  const membershipSectionRef = useRef(null);
  const [membershipProgress, setMembershipProgress] = useState(0);
  const [prizeRef, prizeActiveIdx, handlePrizeScroll] = useCarouselActive(3);

  // Renders one tier's prize card. `compact` tightens spacing for the mobile
  // carousel so all three fit in a fraction of the stacked height.
  const renderPrizeCard = (tier, index, compact = false) => {
    const headerColor = tier === 'silver' ? 'text-slate-500' : tier === 'gold' ? 'text-[#eab308]' : 'text-[#818cf8]';
    return (
      <div className={`bg-white border border-slate-100 rounded-3xl shadow-soft reveal ${compact ? 'p-6' : 'p-8'}`} style={{ transitionDelay: `${index * 100}ms` }}>
        <h3 className={`font-black uppercase tracking-widest text-sm mb-5 pb-4 border-b border-slate-200 ${headerColor}`}>{tier} Circle Prizes</h3>
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-200">
          <span className="font-bold text-slate-400 uppercase text-xs tracking-widest">Grand Prize</span>
          <span className="font-black text-slate-900 text-3xl">{appData.tierData[tier].prize}</span>
        </div>
        <div className="space-y-3.5">
          {appData.tierData[tier].otherPrizes.map((p, i) => {
            let qty = '1 winner';
            let amount = p;
            const lowerP = p.toLowerCase();
            if (lowerP.includes('x')) {
              const parts = lowerP.split('x');
              const count = parseInt(parts[0].trim());
              qty = count === 1 ? '1 winner' : `${count} winners`;
              amount = p.substring(lowerP.indexOf('x') + 1).trim();
            }
            return (
              <div key={i} className="flex justify-between items-center text-base">
                <span className="text-slate-500 font-bold">{qty}</span>
                <span className="font-black text-slate-700">{amount}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Standard observer for .reveal elements on the page
  useEffect(() => {
    const observerOnce = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observerOnce.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -10% 0px" });
    document.querySelectorAll('.reveal').forEach((el) => observerOnce.observe(el));
    return () => observerOnce.disconnect();
  }, []);

  // Throttled scroll listener for the sticky "Your Membership" section only
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (membershipSectionRef.current) {
          const rect = membershipSectionRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const scrollDistance = -rect.top;
          const maxScroll = rect.height - windowHeight;
          
          if (maxScroll > 0) {
            const progress = (scrollDistance / maxScroll) * 100;
            setMembershipProgress(Math.max(0, Math.min(100, progress)));
          } else if (rect.top > 0) {
            setMembershipProgress(0);
          } else {
            setMembershipProgress(100);
          }
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const timeline = [
    { num: '01', title: 'Joining',              titleColor: 'text-indigo-600',  body: "Choose your circle, enter your details and your first contribution processes immediately. You're in." },
    { num: '02', title: 'Choosing Your Causes',  titleColor: 'text-sky-600',     body: 'Pick one Chessed organization, or split your giving across a few. Change it any month.' },
    { num: '03', title: 'Recurring Giving',      titleColor: 'text-amber-700',   body: 'Charged automatically each month once your circle fills. Pause or cancel any time, no penalty, no runaround.' },
    { num: '04', title: "Tax & Ma'aser",         titleColor: 'text-emerald-600', body: <>Your donation is tax deductible. And our Rabbinic Panel has approved using Ma'aser funds. <Link to="/about#rabbinic-panel" className="text-indigo-600 hover:underline">See guidance.</Link></> },
  ];

  return (
    <PageLayout 
      title="How It Works" 
      intro="Here's exactly how a circle works, start to finish"
    >
      
{/* The Circle — chart leads, copy supports */}
<section className="py-16 md:py-24 px-4 bg-white">
  <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-10 lg:gap-16 items-center reveal">

    <div className="md:col-span-7">
      <PoolComparison appData={appData} />
    </div>

    <div className="md:col-span-5">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600 mb-4">The Circle</p>
      <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6 leading-[1.05]">Every member is part of a circle.</h2>
      <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed">Each circle is capped at exactly 400 members. The cap is what creates massive monthly impact while keeping prize odds so strong.</p>
    </div>

  </div>
</section>

{/* THE GRANT */}
<section className="py-8 md:py-12 px-4 bg-slate-950 text-white relative overflow-hidden">
  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
    backgroundImage: 'radial-gradient(circle, #fbbf24 1px, transparent 1px)',
    backgroundSize: '40px 40px'
  }}></div>

  <div className="max-w-5xl mx-auto relative">
    {/* Header */}
    <div className="mb-6 md:mb-8 reveal max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400 mb-3">The Grants</p>
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3 leading-[1.1] text-white">
        Your Donation Goes Further
      </h2>
      <p className="text-sm md:text-base text-slate-400 font-normal leading-relaxed">
        With most giving, part of every dollar pays to raise the next one. Not here.
      </p>
    </div>

    {/* Cards side by side at all sizes */}
    <div className="grid grid-cols-2 gap-2 md:gap-4">

       {/* OLD WAY — now a visible box + subtle cool halo */}
      <div
        className="rounded-xl md:rounded-2xl bg-white/[0.05] border border-white/[0.14] p-3.5 md:p-6 reveal flex flex-col shadow-[0_0_48px_-8px_rgba(148,163,184,0.22),inset_0_1px_0_rgba(255,255,255,0.06)]"
      >
        <div className="mb-3 md:mb-4">
          <p className="text-[0.625rem] md:text-[0.6875rem] font-semibold uppercase tracking-[0.18em] md:tracking-[0.25em] text-slate-500 mb-1 md:mb-2">The Old Way</p>
          <h3 className="text-base md:text-lg font-semibold text-white tracking-tight leading-tight">
            Where A Normal Dollar Goes:
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 mb-3 md:mb-4 flex-1">
          {[
            'Plan annual galas',
            'Hire grant writers',
            'Run direct mail',
            'Manage donor relations',
            'Pay venue & agency fees',
            'Months of pursuit',
          ].map((task, i, arr) => {
            const isLast = i === arr.length - 1;
            const isInLastDesktopRow = i >= arr.length - 2;
            return (
              <div
                key={i}
                className={`flex items-start gap-1.5 md:gap-2.5 py-1.5 md:py-2.5 border-white/[0.08] ${
                  isLast ? 'border-b-0' : 'border-b'
                } ${
                  isInLastDesktopRow && !isLast ? 'md:border-b-0' : ''
                }`}
              >
                <span className="text-rose-500/55 text-[0.5625rem] md:text-xs font-bold mt-[0.1875rem] md:mt-[0.3125rem] leading-none shrink-0" aria-hidden>✕</span>
                <span className="text-[0.8125rem] md:text-sm text-slate-300 font-normal leading-snug">{task}</span>
              </div>
            );
          })}
        </div>

        <div className="pt-3 md:pt-4 border-t border-white/[0.1]">
          <div className="flex flex-col md:flex-row md:items-baseline md:gap-2.5">
            <p className="text-2xl md:text-3xl font-bold text-slate-200 tracking-tight leading-none">Hundreds</p>
            <p className="text-[0.625rem] md:text-[0.6875rem] font-semibold uppercase tracking-[0.18em] md:tracking-[0.25em] text-slate-500 mt-0.5 md:mt-0">of hours</p>
          </div>
          <p className="text-xs md:text-sm text-slate-500 font-normal mt-1 md:mt-1.5 leading-snug">
            Funded by donations, every year.
          </p>
        </div>
      </div>

      {/* AMPLIFY WAY — stronger amber halo */}
      <div
        className="rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-400/[0.07] via-amber-400/[0.02] to-transparent border border-amber-400/[0.3] p-3.5 md:p-6 reveal flex flex-col shadow-[0_0_55px_-10px_rgba(251,191,36,0.32),inset_0_1px_0_rgba(251,191,36,0.12)]"
        style={{ transitionDelay: '120ms' }}
      >
        <div className="mb-3 md:mb-4">
          <p className="text-[0.625rem] md:text-[0.6875rem] font-semibold uppercase tracking-[0.18em] md:tracking-[0.25em] text-amber-300 mb-1 md:mb-2">The Amplify Way</p>
          <h3 className="text-base md:text-lg font-semibold text-white tracking-tight leading-tight">
            Where Your Donation Goes:
          </h3>
        </div>

        <div className="flex-1 flex items-center mb-3 md:mb-4">
          <div>
            <p className="text-2xl md:text-4xl font-semibold text-white tracking-tight leading-[1.05] mb-1.5 md:mb-2">
              Straight to Chessed.
            </p>
            <p className="text-sm md:text-lg text-amber-200/65 font-normal italic">
              That's it.
            </p>
          </div>
        </div>

        <div className="pt-3 md:pt-4 border-t border-amber-400/[0.18]">
          <div className="flex flex-col md:flex-row md:items-baseline md:gap-2.5">
            <p className="text-2xl md:text-3xl font-bold text-emerald-400 tracking-tight tabular-nums leading-none">0</p>
            <p className="text-[0.625rem] md:text-[0.6875rem] font-semibold uppercase tracking-[0.18em] md:tracking-[0.25em] text-emerald-400/85 mt-0.5 md:mt-0">Spent Finding Donors</p>
          </div>
          <p className="text-xs md:text-sm text-slate-300 font-normal mt-1 md:mt-1.5 leading-snug">
            All of it reaches the mission.
          </p>
        </div>
      </div>

    </div>
  </div>
</section>

      <WhyPrizes />

      {/* The Drawings + Odds Visualizer */}
      <section className="py-16 md:py-24 px-4 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-14 reveal">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-[0.3em] mb-4">The Drawing</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-[1.1]">You give real Tzedakah. 
	<span className="italic text-indigo-600"> We give you real odds.</span> </h2>
          </div>

          <div className="mb-12 reveal max-w-5xl mx-auto">
            <OddsVisualizer tierData={appData.tierData} />
          </div>

          {/* Desktop: three columns side by side */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8">
            {['silver', 'gold', 'diamond'].map((tier, index) => renderPrizeCard(tier, index))}
          </div>

          {/* Mobile: horizontal carousel keeps the height down to a single card */}
          <div className="md:hidden -mx-4">
            <div ref={prizeRef} onScroll={handlePrizeScroll} className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-[8%] pb-2 scrollbar-none">
              {['silver', 'gold', 'diamond'].map((tier, index) => (
                <div key={tier} data-card className="snap-center shrink-0 w-[85%]">
                  {renderPrizeCard(tier, index, true)}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {['silver', 'gold', 'diamond'].map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === prizeActiveIdx ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-300'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

{/* Your Membership — Sticky Scroll Section */}
<section className="bg-white border-t border-slate-200">
  <div ref={membershipSectionRef} className="h-[200vh]">
    <div className="sticky top-16 md:top-20 min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] flex flex-col justify-center px-4 overflow-hidden pt-6 pb-16 md:pt-8 md:pb-24">
      <div className="max-w-5xl mx-auto w-full">

        <div className="mb-12 md:mb-16 text-center md:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600 mb-4">Your Membership</p>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Simple, flexible, automatic.</h2>
        </div>

        {/* DESKTOP: horizontal track with scroll-animated progress */}
        <div className="hidden md:block relative">
          <div
            className={`absolute top-8 z-0 pointer-events-none flex items-center justify-between transition-opacity duration-700 ${membershipProgress > 3 ? 'opacity-100' : 'opacity-0'}`}
            style={{ left: '12.5%', right: '12.5%' }}
          >
            {Array.from({ length: 33 }).map((_, i) => {
              const dotPosition = (i / 32) * 100;
              const isPassed = membershipProgress >= dotPosition;
              return (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: '#fbbf24',
                    opacity: isPassed ? 0.9 : 0.15,
                    boxShadow: isPassed ? '0 0 6px rgba(251,191,36,0.6)' : 'none',
                  }}
                />
              );
            })}
          </div>

          <div className="relative grid grid-cols-4 gap-6 z-10">
            {timeline.map((item, i) => {
              const triggers = [3, 31, 64, 96];
              const isActive = membershipProgress > triggers[i];

              return (
                <div
                  key={item.num}
                  className={`flex flex-col items-center text-center transition-all duration-[500ms] ease-out transform ${
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-xl mb-5 ring-4 ring-white bg-slate-900 text-white shadow-soft">
                    {item.num}
                  </div>
                  <p className={`text-sm font-black uppercase tracking-[0.22em] mb-2.5 ${item.titleColor}`}>
                    {item.title}
                  </p>
                  <p className="text-base text-slate-600 font-medium leading-relaxed max-w-[15rem]">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* MOBILE: vertical stack with scroll-animated progress */}
        <div className="md:hidden flex flex-col gap-8 relative z-10">
          <div className={`absolute left-[1.9375rem] top-6 bottom-6 w-0.5 z-0 flex flex-col justify-between items-center transition-opacity duration-700 ${membershipProgress > 3 ? 'opacity-100' : 'opacity-0'}`}>
            {Array.from({ length: 30 }).map((_, i) => {
              const dotPosition = (i / 29) * 100;
              const isPassed = membershipProgress >= dotPosition;
              return (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300 shrink-0"
                  style={{
                    backgroundColor: '#fbbf24',
                    opacity: isPassed ? 0.9 : 0.15,
                    boxShadow: isPassed ? '0 0 6px rgba(251,191,36,0.6)' : 'none',
                  }}
                />
              );
            })}
          </div>

          {timeline.map((item, i) => {
            const triggers = [3, 31, 64, 96];
            const isActive = membershipProgress > triggers[i];
            return (
              <div
                key={item.num}
                className={`flex gap-5 transition-all duration-500 ease-out transform ${
                  isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="w-16 h-16 rounded-full shrink-0 flex items-center justify-center font-black text-xl ring-4 ring-white bg-slate-900 text-white shadow-soft relative z-10">
                  {item.num}
                </div>
                <div className="pt-2">
                  <p className={`text-sm font-black uppercase tracking-[0.22em] mb-2 ${item.titleColor}`}>
                    {item.title}
                  </p>
                  <p className="text-base text-slate-600 font-medium leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  </div>
</section>

      {/* Closing CTA */}
      <section className="py-16 md:py-20 bg-indigo-950 px-4 text-center">
        <div className="max-w-3xl mx-auto reveal">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
            Ready to give bigger?
          </h2>
          <p className="text-indigo-200 font-medium text-lg md:text-xl mb-10 leading-relaxed">
            Join a circle. Pool your Tzedakah.<br />And get a real shot at winning up to $100,000.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/circles" className="px-10 py-4 bg-amber-400 text-slate-900 rounded-lg font-bold text-sm md:text-base hover:bg-amber-300 transition-colors uppercase tracking-widest shadow-amber-glow inline-flex items-center justify-center">
              Join the Circle
            </Link>
            <Link to="/grant" className="px-10 py-4 bg-transparent border border-indigo-700 text-indigo-200 rounded-lg font-bold text-sm md:text-base hover:border-indigo-500 hover:text-white transition-colors uppercase tracking-widest inline-flex items-center justify-center">
              Our Causes
            </Link>
          </div>
        </div>
      </section>

    </PageLayout>
  );
};

export default HowItWorksPage;