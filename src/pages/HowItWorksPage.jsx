import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { ChevronRight } from 'lucide-react';

// ============================================================================
// useCountUp — animates a number from 0 to target when `trigger` becomes true
// ============================================================================
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
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
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

// ============================================================================
// useCarouselActive — robust card-center detection for snap-scroll carousels.
// Finds which card's center is closest to the viewport center.
// ============================================================================
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
// 400-DOT ODDS VISUALIZER (SVG)
// Smaller cap on desktop, no-adjacent winner enforcement, properly spaced
// ============================================================================
const OddsVisualizer = ({ tierData }) => {
  const [activeTier, setActiveTier] = useState('diamond');

  const tierConfig = {
    silver:  { winners: 4,  color: '#94a3b8' },
    gold:    { winners: 8,  color: '#eab308' },
    diamond: { winners: 16, color: '#818cf8' },
  };

  // Distribute winners ensuring no two are 8-neighbors (orthogonal or diagonal)
  const winnerSet = useMemo(() => {
    const w = tierConfig[activeTier].winners;
    const GRID = 20;
    const TOTAL = 400;
    const set = new Set();

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

    // Step-distributed seed positions, with deterministic search around each
    // until we find a non-adjacent slot.
    const step = TOTAL / w;
    for (let i = 0; i < w; i++) {
      const seed = Math.floor(i * step + step / 2);
      // Try the seed, then expand outward in alternating directions
      const offsets = [0, 3, -3, 6, -6, 9, -9, 12, -12, 15, -15, 18, -18, 21, -21];
      for (const off of offsets) {
        const idx = ((seed + off) % TOTAL + TOTAL) % TOTAL;
        if (!set.has(idx) && !hasAdjacent(idx)) {
          set.add(idx);
          break;
        }
      }
    }
    return set;
  }, [activeTier]);

  const cfg = tierConfig[activeTier];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 md:mb-10">
        <div>
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-3">Visualized</p>
          <h3 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight">
            What <span style={{ color: cfg.color }}>{cfg.winners} in 400</span> looks like.
          </h3>
        </div>

        <div className="flex gap-1.5 md:gap-2 bg-slate-100 p-1.5 rounded-xl self-start md:self-auto">
          {Object.keys(tierConfig).map((tier) => (
            <button
              key={tier}
              onClick={() => setActiveTier(tier)}
              className={`px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
                activeTier === tier
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Grid — capped smaller on desktop so it fits comfortably above the fold */}
      <div className="max-w-md mx-auto mb-8 md:mb-10">
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
                r={isWinner ? 3.8 : 3}
                fill={isWinner ? cfg.color : '#e2e8f0'}
                style={{
                  transition: 'r 0.4s ease, fill 0.4s ease, filter 0.4s ease',
                  transitionDelay: isWinner ? `${(i % 20) * 12}ms` : '0ms',
                  filter: isWinner ? `drop-shadow(0 0 3px ${cfg.color}aa)` : 'none',
                }}
              />
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-4 md:gap-8 pt-6 md:pt-8 border-t border-slate-100">
        <div>
          <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Members</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">400</p>
        </div>
        <div>
          <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Winners</p>
          <p className="text-2xl md:text-3xl font-black tracking-tighter" style={{ color: cfg.color }}>{cfg.winners}</p>
        </div>
        <div>
          <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Your Odds</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter italic">{tierData[activeTier].totalOdds.replace(/\s/g, '')}</p>
        </div>
      </div>
    </div>
  );
};


// ============================================================================
// VISUAL POOL COMPARISON
// Fixed: hover state now works for all tiers (Tailwind needs explicit classes)
// ============================================================================
const PoolComparison = ({ appData }) => {
  const tiers = ['silver', 'gold', 'diamond'];
  const max = 400000;

  // Tailwind only generates classes it can statically detect — explicit rather
  // than dynamic interpolation, otherwise hover:bg-amber-50 etc. won't compile
  const styles = {
    silver:  { bar: 'bg-slate-300',  accent: 'text-slate-500',  hover: 'hover:bg-slate-50' },
    gold:    { bar: 'bg-amber-400',  accent: 'text-amber-500',  hover: 'hover:bg-amber-50' },
    diamond: { bar: 'bg-indigo-500', accent: 'text-indigo-500', hover: 'hover:bg-indigo-50' },
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      {tiers.map((tier, i) => {
        const s = styles[tier];
        const pool = appData.tierData[tier].price * 400;
        const widthPct = (pool / max) * 100;

        return (
          <div key={tier} className={`p-5 md:p-8 ${i < tiers.length - 1 ? 'border-b border-slate-100' : ''} transition-colors group ${s.hover}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 md:gap-5">
                <span className={`text-xs md:text-sm font-black uppercase tracking-[0.25em] ${s.accent}`}>{tier}</span>
                <span className="text-xs md:text-sm font-medium text-slate-400 tabular-nums">${appData.tierData[tier].price}/mo · 400 members</span>
              </div>
              <span className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter tabular-nums">${(pool / 1000).toFixed(0)}k</span>
            </div>
            <div className="h-2 md:h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${s.bar} rounded-full transition-all duration-1000 ease-out group-hover:brightness-110`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};


// ============================================================================
// WHY PRIZES — sleeker treatment
// Right card now uses a dark slate-900 with gold accents (much more sleek/premium
// than the muted amber-50 background that looked Etsy-ish). Smaller cards,
// bigger 10× badge, fixed overflow.
// ============================================================================
const WhyPrizes = () => {
  const [ref, inView] = useInView(0.3);
  const count40 = useCountUp(40, 1400, inView);
  const count400 = useCountUp(400, 2000, inView);

  return (
    <section className="py-20 md:py-28 px-4 bg-white border-b border-slate-200" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-14 reveal">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">The Math</p>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-slate-900">Why prizes?</h2>
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">Consistent giving at scale is hard to sustain. Prizes solve that. And the math works out in the charity's favor.</p>
        </div>

        {/* Cards + 10× badge */}
        <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-4 mb-12 md:mb-16 max-w-4xl mx-auto pt-8 md:pt-6">

          {/* WITHOUT PRIZES — small, muted */}
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-4">Without Prizes</p>
            <p className="text-6xl md:text-7xl font-black text-slate-300 tracking-tighter mb-1 leading-none tabular-nums">
              ${count40}K
            </p>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 mt-2">Typical Monthly Pool</p>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-auto">Members drop off. Donations dry up. The pool stays small.</p>
            <div className="mt-6 pt-5 border-t border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Donor Retention</p>
              <p className="text-2xl font-black text-slate-400 tracking-tight tabular-nums">~25%</p>
            </div>
          </div>

          {/* 10× BADGE — bigger, more confident */}
          <div className="flex justify-center items-center md:flex-shrink-0 -my-6 md:my-0 md:-mx-6 z-20 relative pointer-events-none">
            <div
              className="bg-amber-400 text-slate-900 rounded-full w-24 h-24 md:w-32 md:h-32 flex flex-col items-center justify-center shadow-2xl shadow-amber-500/40 ring-8 ring-white transition-all duration-700 ease-out"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? 'scale(1)' : 'scale(0.4)',
                transitionDelay: '600ms',
              }}
            >
              <span className="text-4xl md:text-5xl font-black tracking-tighter leading-none">10×</span>
              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest mt-1">Bigger</span>
            </div>
          </div>

          {/* WITH PRIZES — dark sleek card with amber accents (much more premium) */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl shadow-slate-900/20 relative flex flex-col">
            {/* Amplify badge — repositioned to clear the 10× ring */}
            <div className="absolute -top-3 left-6 md:left-10 bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md z-10">Amplify</div>

            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-amber-400 mb-4">With Prizes</p>
            <p className="text-6xl md:text-7xl font-black text-amber-400 tracking-tighter mb-1 leading-none tabular-nums">
              ${count400}K
            </p>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400/70 mb-3 mt-2">Transformational Pool</p>
            <p className="text-sm text-slate-300 font-medium leading-relaxed mb-auto">Members stay engaged. The charity receives one massive grant with zero acquisition cost.</p>
            <div className="mt-6 pt-5 border-t border-slate-800">
              <p className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest mb-1">Donor Retention</p>
              <p className="text-2xl font-black text-amber-400 tracking-tight tabular-nums">100%</p>
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

  const timeline = [
    { num: '01', title: 'Joining',           dot: 'bg-indigo-500',  body: "Choose your circle, enter your details, and your first contribution processes immediately. You're in." },
    { num: '02', title: 'Recurring Giving',  dot: 'bg-amber-400',   body: 'Once your circle reaches 400 members, your contribution is charged on the same date each month, automatically.' },
    { num: '03', title: 'Flexibility',       dot: 'bg-slate-300',   body: 'Your subscription is yours. Pause or cancel any time before your next billing date. No penalty, no runaround.' },
    { num: '04', title: "Tax & Ma'aser",     dot: 'bg-emerald-400', body: <>The charitable portion is tax-deductible. Our Rabbinic Panel has approved using Ma'aser funds. <Link to="/about#rabbinic-panel" className="text-indigo-600 hover:underline">See guidance.</Link></> },
  ];

  const [tlRef, tlActiveIdx, tlOnScroll] = useCarouselActive(timeline.length);

  return (
    <PageLayout 
      title="How It Works" 
      intro="Consistent, collective giving creates impact that individual giving simply can't."
    >
      
      {/* The Circle */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="md:col-span-5 reveal">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-indigo-600 mb-4">The Circle</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6 leading-[1.05]">Every donor is part of a circle.</h2>
            <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed">Each circle is capped at exactly 400 members. That's the specific number required to create a massive charity grant while keeping prize odds high.</p>
          </div>

          <div className="md:col-span-7 reveal" style={{transitionDelay: '150ms'}}>
            <PoolComparison appData={appData} />
          </div>
        </div>
      </section>

      {/* The Grant */}
      <section className="py-20 md:py-28 px-4 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center md:text-left reveal">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-amber-400 mb-4">The Grant</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-[1.05]">One massive check. <br className="hidden md:block"/>Every month.</h2>
            <p className="text-xl text-slate-300 font-medium max-w-2xl">The pooled funds are issued as a single grant to one vetted nonprofit partner. Not split across dozens of organizations. Not dripped out over time.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            <div className="group reveal" style={{transitionDelay: '100ms'}}>
              <h3 className="text-7xl md:text-8xl font-black text-amber-400 tracking-tighter mb-3 transition-transform group-hover:scale-105 origin-left cursor-default">$400k</h3>
              <h4 className="text-xl font-bold mb-3 text-white">Scale matters</h4>
              <p className="text-base md:text-lg text-slate-300 leading-relaxed font-medium">Transformational gifts need scale. The kind that let an organization expand or hit a critical milestone. $250 doesn't do that. $400,000 does.</p>
            </div>
            <div className="group reveal" style={{transitionDelay: '250ms'}}>
              <h3 className="text-7xl md:text-8xl font-black text-emerald-400 tracking-tighter mb-3 transition-transform group-hover:scale-105 origin-left cursor-default">0%</h3>
              <h4 className="text-xl font-bold mb-3 text-white">Zero acquisition cost</h4>
              <p className="text-base md:text-lg text-slate-300 leading-relaxed font-medium">Our charity partners receive this grant with zero fundraising cost on their end. No gala. No campaign. Just the grant.</p>
            </div>
          </div>
        </div>
      </section>

      <WhyPrizes />

      {/* The Drawings + Odds Visualizer */}
      <section className="py-16 md:py-24 px-4 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-14 reveal">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">The Odds</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-[1.1]">When a circle fills, the drawing goes live.</h2>
            <p className="text-lg md:text-xl text-slate-600 font-medium max-w-2xl mx-auto">Compared to most sweepstakes, your odds aren't theoretical. They're real.</p>
          </div>

          <div className="mb-12 reveal max-w-4xl mx-auto">
            <OddsVisualizer tierData={appData.tierData} />
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {['silver', 'gold', 'diamond'].map((tier, index) => {
              const headerColor = tier === 'silver' ? 'text-slate-500' : tier === 'gold' ? 'text-[#eab308]' : 'text-[#818cf8]';
              return (
                <div key={tier} className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm reveal" style={{transitionDelay: `${index * 100}ms`}}>
                  <h3 className={`font-black uppercase tracking-widest text-sm mb-6 pb-4 border-b border-slate-200 ${headerColor}`}>{tier} Circle Prizes</h3>
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
                    <span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Grand Prize</span>
                    <span className="font-black text-slate-900 text-3xl">{appData.tierData[tier].prize}</span>
                  </div>
                  <div className="space-y-4">
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
            })}
          </div>
        </div>
      </section>

      {/* Your Membership */}
      <section className="py-20 md:py-28 px-4 md:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 md:mb-16 text-center md:text-left reveal">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">Your Membership</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Simple, flexible, automatic.</h2>
          </div>
          
          {/* Desktop — vertical timeline */}
          <div className="hidden md:block space-y-12 pl-4 border-l-4 border-indigo-100">
            {timeline.map((item, i) => (
              <div key={item.num} className="relative pl-8 reveal" style={{transitionDelay: `${(i + 1) * 100}ms`}}>
                <div className={`absolute w-4 h-4 rounded-full ${item.dot} left-[-10px] top-2`}></div>
                <h3 className="text-2xl font-black uppercase tracking-wide text-slate-900 mb-3">{item.num}. {item.title}</h3>
                <p className="text-xl text-slate-600 font-medium leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          {/* Mobile — snap-center carousel with proper detection */}
          <div className="md:hidden -mx-4">
            <div
              ref={tlRef}
              onScroll={tlOnScroll}
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-[10%] pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {timeline.map((item) => (
                <div key={item.num} data-card className="snap-center shrink-0 w-[80%] bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${item.dot}`}></div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Step {item.num}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{item.title}</h3>
                  <p className="text-base text-slate-600 font-medium leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-3">
              {timeline.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${i === tlActiveIdx ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-300'}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-14 md:mt-16 pt-12 border-t border-slate-100 text-center reveal" style={{transitionDelay: '500ms'}}>
            <Link to="/circles" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition-colors uppercase tracking-widest text-sm bg-indigo-50 px-8 py-4 rounded-xl">
              See the Circles & Prizes <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

    </PageLayout>
  );
};

export default HowItWorksPage;