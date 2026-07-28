import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { partners as PARTNERS, partnerLogo } from '../data/partners';

// Bespoke marks (hand-drawn SVG instead of stock icons) so the trust badges
// feel unique to Amplify. Swap these paths to restyle.
const VerifiedMark = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    {/* faceted seal */}
    <path
      d="M12 2.2l2.6 1.7 3.1-.3 1 3 2.6 1.8-1 3 1 3-2.6 1.8-1 3-3.1-.3L12 21.8l-2.6-1.7-3.1.3-1-3L2.7 15.6l1-3-1-3 2.6-1.8 1-3 3.1.3z"
      fill="currentColor"
      fillOpacity="0.14"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
    <path d="M8.4 12.2l2.5 2.5 4.7-5.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CollectiveMark = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    {/* many givers pooling toward one shared goal */}
    <g stroke="currentColor" strokeWidth="1" opacity="0.4">
      <line x1="12" y1="12" x2="12" y2="4.2" />
      <line x1="12" y1="12" x2="19.4" y2="8.6" />
      <line x1="12" y1="12" x2="17.3" y2="18.4" />
      <line x1="12" y1="12" x2="6.7" y2="18.4" />
      <line x1="12" y1="12" x2="4.6" y2="8.6" />
    </g>
    <circle cx="12" cy="12" r="3" fill="currentColor" />
    <circle cx="12" cy="4.2" r="1.5" fill="currentColor" opacity="0.85" />
    <circle cx="19.4" cy="8.6" r="1.5" fill="currentColor" opacity="0.85" />
    <circle cx="17.3" cy="18.4" r="1.5" fill="currentColor" opacity="0.85" />
    <circle cx="6.7" cy="18.4" r="1.5" fill="currentColor" opacity="0.85" />
    <circle cx="4.6" cy="8.6" r="1.5" fill="currentColor" opacity="0.85" />
  </svg>
);

// Rotating showcase photos for the crossfade banner. Drop org photos into
// /public/partners/photos/ and list them here; the banner preloads every entry
// and quietly skips any that fail, so it's safe to list images before upload.
// impact-photo.jpg ships today, so the banner always has at least one frame.
const SHOWCASE = [
  { name: 'Chai Lifeline', src: '/impact-photo.jpg' },
  { name: 'Renewal', src: '/partners/photos/renewal.jpg' },
  { name: 'United Hatzalah', src: '/partners/photos/united-hatzalah.jpg' },
  { name: 'Camp HASC', src: '/partners/photos/camp-hasc.jpg' },
  { name: 'Leket Israel', src: '/partners/photos/leket-israel.jpg' },
  { name: 'Bonei Olam', src: '/partners/photos/bonei-olam.jpg' },
];

// One logo in the marquee. Tries the image, falls back to the org name.
const PartnerLogo = ({ partner }) => {
  const [failed, setFailed] = useState(false);
  const src = partnerLogo(partner);

  return (
    <div className="flex items-center justify-center h-9 md:h-12 px-6 md:px-8 shrink-0">
      {failed ? (
        <span className="text-sm md:text-base font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
          {partner.name}
        </span>
      ) : (
        <img
          src={src}
          alt={partner.name}
          onError={() => setFailed(true)}
          className="h-full w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300"
        />
      )}
    </div>
  );
};

const FeaturedPartners = () => {
  // Preload the showcase photos and keep only the indices that actually load,
  // so a not-yet-uploaded photo never leaves a blank frame in the rotation.
  const [loaded, setLoaded] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let active = true;
    const ok = [];
    let pending = SHOWCASE.length;
    const finish = () => {
      if (!active) return;
      ok.sort((a, b) => a - b);
      setLoaded(ok);
    };
    SHOWCASE.forEach((item, i) => {
      const img = new Image();
      img.onload = () => { ok.push(i); if (--pending === 0) finish(); };
      img.onerror = () => { if (--pending === 0) finish(); };
      img.src = item.src;
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loaded.length <= 1) return;
    const t = setInterval(() => setIdx((p) => (p + 1) % loaded.length), 4500);
    return () => clearInterval(t);
  }, [loaded]);

  return (
    <section id="causes" className="py-20 md:py-28 bg-slate-900 px-4 text-white overflow-hidden">
      <div className="max-w-6xl mx-auto reveal">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Copy */}
          <div className="text-center md:text-left">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight uppercase leading-[0.95]">
              The Chessed<br/>
              <span className="italic text-amber-400">you choose</span>.
            </h2>
            <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed mb-8">
              From crisis support and lifting families in need to Torah education, campus life,
              and emergency response, Amplify backs a growing list of vetted Chessed organizations.
              Every month, you choose exactly where your Tzedakah goes.
            </p>

            {/* Trust + combined-goal badges */}
            <div className="flex flex-wrap items-center gap-5 sm:gap-6 justify-center md:justify-start mb-8">
              <div className="flex items-center gap-3">
                <VerifiedMark className="w-5 h-5 text-emerald-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Verified Nonprofits</p>
              </div>
              <div className="flex items-center gap-3">
                <CollectiveMark className="w-5 h-5 text-amber-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
                  $400K+ Monthly Goal <span className="text-slate-500">· All Causes</span>
                </p>
              </div>
            </div>

            <Link
              to="/grant"
              className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors uppercase tracking-widest text-xs md:text-sm"
            >
              See our causes <ChevronRight size={16} />
            </Link>
          </div>

          {/* Crossfade photo */}
          <div className="relative overflow-hidden rounded-2xl md:rounded-3xl shadow-soft-xl border border-slate-700 min-h-[18.75rem] md:min-h-[28.125rem]">
            {loaded.length > 0 ? (
              loaded.map((si, pos) => (
                <img
                  key={si}
                  src={SHOWCASE[si].src}
                  alt={SHOWCASE[si].name}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${pos === idx ? 'opacity-80' : 'opacity-0'}`}
                />
              ))
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-slate-900"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
          </div>
        </div>

        {/* Auto-scrolling logo marquee — reveals together with the block above */}
        <div className="relative marquee-mask py-2 mt-14 md:mt-20">
          <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <PartnerLogo key={`${p.slug}-${i}`} partner={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPartners;
