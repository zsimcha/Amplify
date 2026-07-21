import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, Heart, ChevronRight } from 'lucide-react';

// The current partner roster. Logos live in /public/partners/logos/<slug>.png
// (a couple are one-offs, so an explicit `logo` overrides the slug path). Any
// logo that fails to load falls back to the org's name in text, so this list
// renders cleanly before the artwork is uploaded.
const PARTNERS = [
  { name: 'A Time', slug: 'atime' },
  { name: 'Aish', slug: 'aish' },
  { name: 'Bnai Akiva', slug: 'bnai-akiva' },
  { name: 'Bonei Olam', slug: 'bonei-olam' },
  { name: 'Camp HASC', slug: 'camp-hasc' },
  { name: 'Chabad on Campus', slug: 'chabad-on-campus' },
  { name: 'Chai Lifeline', slug: 'chai-lifeline', logo: '/ChaiLifeline.png' },
  { name: 'Leket Israel', slug: 'leket-israel' },
  { name: 'Mizrachi', slug: 'mizrachi' },
  { name: 'Renewal', slug: 'renewal' },
  { name: 'StandWithUs', slug: 'stand-with-us' },
  { name: 'TorahAnytime', slug: 'torah-anytime' },
  { name: 'United Hatzalah', slug: 'united-hatzalah' },
  { name: 'Zaka', slug: 'zaka' },
];

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
  const src = partner.logo || `/partners/logos/${partner.slug}.png`;

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
    <section id="partners" className="py-20 md:py-28 bg-slate-900 px-4 text-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center reveal">
          {/* Copy */}
          <div className="text-center md:text-left">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-[0.4em] mb-4">Our Partners</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight uppercase">
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
                <Building size={20} className="text-slate-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Verified Nonprofits</p>
              </div>
              <div className="flex items-center gap-3">
                <Heart size={20} className="text-red-400 fill-current" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
                  $400K+ Monthly Goal <span className="text-slate-500">· All Partners</span>
                </p>
              </div>
            </div>

            <Link
              to="/grant"
              className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors uppercase tracking-widest text-xs md:text-sm"
            >
              Meet our charity partners <ChevronRight size={16} />
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

        {/* Auto-scrolling logo marquee */}
        <div className="relative marquee-mask py-2 mt-14 md:mt-20 reveal">
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
