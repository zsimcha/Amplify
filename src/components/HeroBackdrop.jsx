import React, { useEffect, useState } from 'react';
import { HIDE_PARTNER_IDENTITIES } from '../config/siteConfig';

// Cause photos behind the homepage hero, in rotation order. They're shown
// full-bleed, so a photo has to survive being stretched across a desktop
// screen. Deliberately left out: misaskim.jpg (550x250 — too soft at this
// size) and zaka.jpg (its censor mosaic over the recovery scene is large and
// conspicuous at full-bleed). `position` is the object-position: on phones the
// portrait crop keeps only a narrow vertical slice of each landscape photo, so
// it has to land on people.
const HERO_PHOTOS = [
  { src: '/partners/photos/chai-lifeline.jpg', position: '42% 35%' },
  { src: '/partners/photos/chabad-on-campus.jpg', position: '70% 35%' },
  { src: '/partners/photos/camp-hasc.jpg', position: '55% 35%' },
  { src: '/partners/photos/fidf.jpg', position: '74% 35%' },
  { src: '/partners/photos/aish.jpg', position: '68% 40%' },
];

const ROTATE_MS = 3400;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Full-bleed layers only — the caller supplies the positioned, isolated parent.
// The photos go grayscale and take their tint from the indigo behind them; the
// grade then pushes the right side toward amber; the scrim keeps the copy
// legible. See .hero-photo / .hero-grade / .hero-scrim in index.css.
const HeroBackdrop = () => {
  const [loaded, setLoaded] = useState(() => HERO_PHOTOS.map(() => false));
  const [firstSettled, setFirstSettled] = useState(false);
  const [current, setCurrent] = useState(0);
  const [stillOnly] = useState(prefersReducedMotion);

  const markLoaded = (i) => setLoaded((prev) => {
    if (prev[i]) return prev;
    const next = [...prev];
    next[i] = true;
    return next;
  });

  // Whatever is showing must be a photo that actually loaded — if the first
  // one 404s, fall through to the earliest one that didn't.
  const shown = loaded[current] ? current : loaded.indexOf(true);

  useEffect(() => {
    if (stillOnly) return;
    if (loaded.filter(Boolean).length < 2) return;
    const t = setInterval(() => {
      setCurrent((from) => {
        const base = loaded[from] ? from : loaded.indexOf(true);
        for (let k = 1; k <= HERO_PHOTOS.length; k++) {
          const j = (base + k) % HERO_PHOTOS.length;
          if (loaded[j]) return j;
        }
        return base;
      });
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [loaded, stillOnly]);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {/* The first photo is fetched straight away; the rest wait until it has
          settled so they never compete with it for bandwidth, and aren't
          fetched at all under reduced motion, where only the first shows.
          During the blackout none are requested — the filenames identify the
          orgs — and the ground, grade and scrim render on their own. */}
      {!HIDE_PARTNER_IDENTITIES && HERO_PHOTOS.map((p, i) => (i === 0 || (firstSettled && !stillOnly)) && (
        <img
          key={p.src}
          src={p.src}
          alt=""
          decoding="async"
          fetchPriority={i === 0 ? 'high' : 'low'}
          onLoad={() => { markLoaded(i); if (i === 0) setFirstSettled(true); }}
          onError={() => { if (i === 0) setFirstSettled(true); }}
          style={{ objectPosition: p.position }}
          className={`hero-photo absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-in-out ${
            i === shown ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      <div className="hero-grade absolute inset-0" />
      <div className="hero-scrim absolute inset-0" />
    </div>
  );
};

export default HeroBackdrop;
