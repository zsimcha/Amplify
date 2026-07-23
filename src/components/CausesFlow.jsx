import React, { useRef, useEffect, useState } from 'react';

// The causes shown as flow destinations. These are the real cause areas from
// the partner roster; the particle streams bloom into this cluster.
const CAUSES = [
  'Medical',
  'Crisis & Illness',
  'Torah & Education',
  'Emergency Response',
  'Food Security',
  'Campus Life',
  'Family Support',
  'Special Needs',
  'Israel Advocacy',
];

// Destination anchors (fractions of the canvas) that the particle streams flow
// toward — scattered through the right-hand "causes" zone. Kept loose on
// purpose so the energy blooms among the labels rather than hitting them dead-on.
const TARGETS = [
  { x: 0.60, y: 0.20 }, { x: 0.78, y: 0.16 }, { x: 0.70, y: 0.34 },
  { x: 0.86, y: 0.40 }, { x: 0.62, y: 0.50 }, { x: 0.80, y: 0.58 },
  { x: 0.68, y: 0.70 }, { x: 0.84, y: 0.78 }, { x: 0.58, y: 0.84 },
];

const CausesFlow = () => {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const set = () => setReduced(mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // The "pool" of givers: a soft cluster hugging the left edge.
    const poolX = () => W * 0.1;
    const poolY = () => H * (0.35 + Math.random() * 0.3);

    const AMBER = [251, 191, 36];
    const INDIGO = [129, 140, 248];

    const spawn = () => {
      const t = TARGETS[(Math.random() * TARGETS.length) | 0];
      const sx = poolX() + (Math.random() - 0.5) * W * 0.05;
      const sy = poolY();
      const tx = t.x * W + (Math.random() - 0.5) * W * 0.05;
      const ty = t.y * H + (Math.random() - 0.5) * H * 0.05;
      // control point bows the path upward/downward for organic curves
      const cx = (sx + tx) / 2 + (Math.random() - 0.5) * W * 0.18;
      const cy = (sy + ty) / 2 + (Math.random() - 0.5) * H * 0.4;
      return {
        sx, sy, cx, cy, tx, ty,
        p: 0,
        speed: 0.0025 + Math.random() * 0.0045,
        size: 1.1 + Math.random() * 1.8,
        color: Math.random() < 0.35 ? AMBER : INDIGO,
      };
    };

    const COUNT = Math.max(36, Math.min(90, Math.round(W / 14)));
    let particles = Array.from({ length: COUNT }, () => {
      const s = spawn();
      s.p = Math.random(); // stagger initial progress
      return s;
    });

    // Static giver dots in the pool for a sense of "many people".
    const poolDots = Array.from({ length: 26 }, () => ({
      x: W * 0.1 + (Math.random() - 0.5) * W * 0.08,
      y: H * (0.3 + Math.random() * 0.4),
      r: 0.8 + Math.random() * 1.4,
      a: 0.15 + Math.random() * 0.3,
    }));

    const bez = (a, b, c, t) => {
      const mt = 1 - t;
      return mt * mt * a + 2 * mt * t * b + t * t * c;
    };

    let raf;
    const draw = (animate) => {
      ctx.clearRect(0, 0, W, H);

      // pool dots
      ctx.globalCompositeOperation = 'source-over';
      poolDots.forEach((d) => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148,163,184,${d.a})`;
        ctx.fill();
      });

      // particles (additive glow)
      ctx.globalCompositeOperation = 'lighter';
      particles.forEach((pt) => {
        const x = bez(pt.sx, pt.cx, pt.tx, pt.p);
        const y = bez(pt.sy, pt.cy, pt.ty, pt.p);
        // fade in at start, fade out near the destination bloom
        const alpha = Math.sin(Math.min(pt.p, 1) * Math.PI) * 0.9;
        const [r, g, b] = pt.color;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, pt.size * 4);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, pt.size * 4, 0, Math.PI * 2);
        ctx.fill();
        // bright core
        ctx.beginPath();
        ctx.arc(x, y, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();

        if (animate) {
          pt.p += pt.speed;
          if (pt.p >= 1) Object.assign(pt, spawn());
        }
      });
      ctx.globalCompositeOperation = 'source-over';

      if (animate) raf = requestAnimationFrame(() => draw(true));
    };

    if (reduced) {
      // freeze a representative frame
      particles = particles.map((s) => ({ ...s, p: 0.35 + Math.random() * 0.4 }));
      draw(false);
    } else {
      draw(true);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduced]);

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-950">
      <div ref={wrapRef} className="relative w-full h-[64vh] min-h-[26rem] md:h-[72vh] md:min-h-[34rem]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Eyebrow — the only "telling", kept minimal */}
        <p className="absolute top-6 left-5 md:top-10 md:left-10 text-[0.625rem] md:text-xs font-bold uppercase tracking-[0.4em] text-indigo-300/80">
          Your Tzedakah at work
        </p>

        {/* The causes — the destination cluster the streams flow into */}
        <div className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1.5 md:gap-2.5 max-w-[62%] md:max-w-none">
          {CAUSES.map((c, i) => (
            <div key={c} className="flex items-center gap-2 md:gap-3">
              <span
                className="text-sm md:text-2xl lg:text-3xl font-black uppercase tracking-tight text-white/90 leading-none whitespace-nowrap"
                style={{ opacity: 0.55 + (i % 3) * 0.15 }}
              >
                {c}
              </span>
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-400 shrink-0 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
            </div>
          ))}
        </div>

        {/* Bottom fade into the page */}
        <div className="absolute inset-x-0 bottom-0 h-16 md:h-24 bg-gradient-to-t from-indigo-950 to-transparent pointer-events-none" />
      </div>
    </section>
  );
};

export default CausesFlow;
