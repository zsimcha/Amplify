import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import ScrollHint from '../components/ScrollHint';
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
              <p className="text-xl font-black text-slate-400 tracking-tight tabular-nums">Hundreds of Hours</p>
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
              <p className="text-xl font-black text-amber-400 tracking-tight tabular-nums">0 Hours Fundraising</p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto text-center reveal">
          <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed mb-8">
            We allocate less to prizes than most charities spend to acquire donors.
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
  const [membershipHintOn, setMembershipHintOn] = useState(false);

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

          // Scroll cue: appears once the section header has scrolled to the
          // middle of the viewport (during entry, before it pins) and vanishes
          // the moment the first timeline step reveals (step 01 triggers at 3%).
          const enteredHalfway = rect.top <= windowHeight * 0.5;
          const firstStepShowing = maxScroll > 0 && scrollDistance > maxScroll * 0.03;
          setMembershipHintOn(enteredHalfway && !firstStepShowing);
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
    { num: '02', title: 'Choosing Your Causes',  titleColor: 'text-sky-600',     body: "Pick one Chessed organization, split across a few, or request a new one. Keep it the same, or change it anytime." },
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

{/* The Drawing — the headline number lives here; the interactive tool lives on /circles */}
<section className="py-16 md:py-24 px-4 bg-slate-50 border-y border-slate-200">
  <div className="max-w-3xl mx-auto text-center reveal">
    <p className="text-xs font-bold text-slate-900 uppercase tracking-[0.3em] mb-4">The Drawing</p>
    <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-10 leading-[1.1]">You give real Tzedakah.
      <span className="italic text-indigo-600"> We give you real odds.</span></h2>
    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Grand prize odds, up to</p>
    <p className="text-6xl md:text-7xl font-black text-indigo-600 tracking-tighter tabular-nums leading-none mb-4">1 in 400</p>
    <p className="text-base md:text-lg text-slate-600 font-medium mb-8">One grand prize winner in every full circle, every month, plus more prizes in every tier.</p>
    <Link to="/circles" className="inline-flex items-center gap-2 font-bold text-sm uppercase tracking-widest text-indigo-600 hover:text-indigo-900 transition-colors">
      See the full tier and prize breakdown →
    </Link>
    <p className="text-[0.625rem] text-slate-400 font-medium leading-relaxed mt-8 max-w-md mx-auto">
      Actual odds of winning depend on total eligible entries. No purchase necessary. See <Link to="/rules" className="underline hover:text-slate-600 transition-colors">official rules</Link>.
    </p>
  </div>
</section>

      <WhyPrizes />

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
                  <p className={`text-sm font-black uppercase tracking-[0.22em] mb-2.5 min-h-[2.5rem] flex items-center justify-center text-center ${item.titleColor}`}>
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

    {/* Scroll cue — sticky to the viewport bottom so it stays put regardless of
        the pinned content's height; fades once the timeline starts advancing. */}
    <div className="sticky bottom-6 z-20 flex justify-center pointer-events-none">
      <ScrollHint hidden={!membershipHintOn} className="text-slate-400" />
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
            <Link to="/causes" className="px-10 py-4 bg-transparent border border-indigo-700 text-indigo-200 rounded-lg font-bold text-sm md:text-base hover:border-indigo-500 hover:text-white transition-colors uppercase tracking-widest inline-flex items-center justify-center">
              Our Causes
            </Link>
          </div>
        </div>
      </section>

    </PageLayout>
  );
};

export default HowItWorksPage;
