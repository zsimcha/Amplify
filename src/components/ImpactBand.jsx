import React, { useEffect, useRef, useState } from 'react';
import { impactStats } from '../data/partners';
import CornerConstellation from './CornerConstellation';

// Format an in-progress count. `abbrev` renders millions/thousands compactly.
const format = (n, abbrev) => {
  if (!abbrev) return Math.round(n).toLocaleString();
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return Math.round(n).toLocaleString();
};

const useCountUp = (target, run, duration = 1800) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf, start;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(eased * target);
      if (p < 1) raf = requestAnimationFrame(step);
      else setVal(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return val;
};

const Stat = ({ item, run }) => {
  const reduce = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const val = useCountUp(item.value, run && !reduce);
  const shown = reduce ? item.value : val;

  return (
    <div className="text-center md:text-left">
      <p className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white tabular-nums leading-none">
        {format(shown, item.abbrev)}
        <span className="text-amber-400">+</span>
      </p>
      <p className="mt-3 md:mt-4 text-sm md:text-base font-semibold text-indigo-100 leading-snug max-w-[16rem] mx-auto md:mx-0">
        {item.label}
      </p>
      <p className="mt-1.5 text-[0.625rem] font-bold uppercase tracking-widest text-indigo-400">
        {item.org}
      </p>
    </div>
  );
};

const ImpactBand = () => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-16 md:py-24 px-4 bg-indigo-950 text-white relative overflow-hidden border-y border-indigo-900">
      <CornerConstellation
        corner="top-right"
        width={420}
        height={300}
        density={22}
        maxR={2.4}
        jitter={0}
        className="absolute -top-8 -right-8 w-[22rem] h-[16rem] pointer-events-none opacity-30"
      />
      <div className="max-w-6xl mx-auto relative">
        <div className="mb-12 md:mb-16 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400 mb-4">The impact you're part of</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05]">
            Giving that adds up.
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 md:gap-y-14">
          {impactStats.map((s) => (
            <Stat key={s.org} item={s} run={inView} />
          ))}
        </div>

        {/* Remove this note once the figures above are final. */}
        <p className="mt-12 text-[0.6875rem] font-medium text-indigo-400/70">
          Illustrative figures, pending final impact reporting from our partners.
        </p>
      </div>
    </section>
  );
};

export default ImpactBand;
