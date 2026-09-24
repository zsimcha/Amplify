import React, { useEffect, useState } from 'react';
import { HIDE_PARTNER_IDENTITIES } from '../config/siteConfig';

// Cause photos behind the homepage hero, in rotation order. `position` is the
// object-position. On phones and portrait tablets the frame keeps only about
// half of each landscape photo's width, so the x value picks which half —
// it has to land on the people (for Aish, the rabbi and the table).
//
// bnai-akiva.jpg is the one portrait source in the set (1335x2000, everyone
// else is landscape). object-cover on a portrait image in a landscape hero is
// always width-matched, so x never crops anything — only y matters, and it's
// cropped much more tightly on desktop (roughly the middle 30-40% of the
// photo's height) than on phones, where the hero band's own aspect is close
// enough to the photo's that nearly all of it shows. 55% keeps both guys'
// caps and the full flag emblem in frame at both extremes; tried 35-65%.
const HERO_PHOTOS = [
  { src: '/partners/photos/chai-lifeline.jpg', position: '42% 35%' },
  { src: '/partners/photos/chabad-on-campus.jpg', position: '80% 35%' },
  { src: '/partners/photos/zaka.jpg', position: '50% 45%' },
  { src: '/partners/photos/camp-hasc.jpg', position: '55% 35%' },
  { src: '/partners/photos/misaskim.jpg', position: '50% 35%' },
  { src: '/partners/photos/bnai-akiva.jpg', position: '50% 55%' },
  { src: '/partners/photos/fidf.jpg', position: '75% 35%' },
  { src: '/partners/photos/aish.jpg', position: '92% 40%' },
];

const ROTATE_MS = 3400;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Full-bleed layers only (a top band on phones — see .hero-backdrop). The
// caller supplies the positioned, isolated parent with the .hero class.
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
    <div aria-hidden className="hero-backdrop overflow-hidden">
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
