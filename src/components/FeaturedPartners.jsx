import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { partners as PARTNERS, partnerLogo } from '../data/partners';
import { HIDE_PARTNER_IDENTITIES } from '../config/siteConfig';

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

// Rabbinic Panel credential pill — replaces the old standalone "Approved by
// leading Poskim" section. Sits on the section's dark ground right after the
// logo marquee, so trust lands as a closing beat instead of a whole extra
// scroll stop. Full endorsement detail (names, photos) stays on
// /about#rabbinic-panel; this just points there.
const RABBI_PHOTOS = ['/rabbi-1.png', '/rabbi-2.png', '/rabbi-3.png'];

// Phone and tablet sizes are set so the label breaks into two lines
// ("Reviewed & approved by / our Rabbinic Panel") down to 360px wide rather
// than three. Desktop (lg+) roughly doubles the md size — this is the
// section's closing beat, and it was reading as a small afterthought in the
// large stretch of dark ground below the marquee.
const RabbinicPill = () => (
  <div className="mt-10 md:mt-14 lg:mt-16 flex justify-center reveal">
    <Link
      to="/about#rabbinic-panel"
      className="inline-flex items-center gap-2.5 md:gap-4 lg:gap-7 rounded-full border border-white/15 lg:border-2 bg-white/[0.06] pl-2 pr-4 py-2 md:pl-2.5 md:pr-7 md:py-2.5 lg:pl-4 lg:pr-12 lg:py-4 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      <span className="flex -space-x-3.5 md:-space-x-3 lg:-space-x-6 shrink-0">
        {RABBI_PHOTOS.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden
            className="w-10 h-10 md:w-14 md:h-14 lg:w-28 lg:h-28 rounded-full object-cover object-top grayscale bg-slate-800 border-2 lg:border-4 border-slate-900"
            style={{ zIndex: RABBI_PHOTOS.length - i }}
          />
        ))}
      </span>
      <span className="text-sm md:text-lg lg:text-4xl font-bold md:tracking-wide text-indigo-50 leading-snug">
        Reviewed &amp; approved by our Rabbinic Panel
      </span>
      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 lg:w-9 lg:h-9 text-amber-400 shrink-0" />
    </Link>
  </div>
);

// One logo in the marquee, sitting directly on the white band. The box hugs the
// logo (see .logo-slot) and the spacing lives in this wrapper's padding, so the
// gap between every pair of logos is the same 2x padding regardless of whether
// the logo is a wide wordmark or a square badge. Keeping the space as padding
// rather than a flex `gap` also keeps each copy of the roster exactly one third
// of the track, which is what makes the loop seamless.
const PartnerLogo = ({ partner }) => {
  const [failed, setFailed] = useState(false);
  const src = partnerLogo(partner);

  return (
    <div className="flex items-center justify-center shrink-0 h-10 md:h-14 px-6 md:px-9">
      {failed ? (
        <span className="w-20 md:w-28 text-xs md:text-sm font-black uppercase tracking-wider text-slate-400 text-center leading-tight">
          {partner.name}
        </span>
      ) : (
        <div className="logo-slot" style={{ '--logo-aspect': partner.aspect }}>
          <img
            src={src}
            alt={partner.name}
            onError={() => setFailed(true)}
            className="w-full h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

const FeaturedPartners = () => {
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
              to="/causes"
              className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors uppercase tracking-widest text-xs md:text-sm"
            >
              See our causes <ChevronRight size={16} />
            </Link>
          </div>

          {/* Promo video — moved here from the hero when the cause photos took
              its place. Lazy: it's well below the fold and YouTube's player is
              heavy. Not partner-identifying, so it shows during the blackout. */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl md:rounded-3xl bg-slate-800 shadow-soft-xl ring-1 ring-white/10">
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube-nocookie.com/embed/T6RxmZmNZME?rel=0&modestbranding=1"
              title="Amplify Promotional Video"
              loading="lazy"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>

      {/* Auto-scrolling logo marquee — reveals together with the block above.
          Lives outside the max-width wrapper so the white band can run the full
          width of the section; -mx-4 cancels the section's own padding. */}
      {HIDE_PARTNER_IDENTITIES ? (
        <div className="max-w-6xl mx-auto reveal mt-14 md:mt-20 border-t border-slate-800 pt-8 text-center">
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-slate-500">
            Our partner organizations will be announced soon
          </p>
        </div>
      ) : (
        <div className="reveal reveal-fade -mx-4 mt-14 md:mt-20 bg-white py-5 md:py-7">
          <div className="relative overflow-hidden">
            <div className="flex w-max animate-marquee">
              {[...PARTNERS, ...PARTNERS, ...PARTNERS].map((p, i) => (
                <PartnerLogo key={`${p.slug}-${i}`} partner={p} />
              ))}
            </div>
            {/* Edge fades. Plain gradients rather than a CSS mask — masking a
                layer that's animating underneath drops logos on mobile Safari. */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 md:w-24 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 md:w-24 bg-gradient-to-l from-white to-transparent" />
          </div>
        </div>
      )}

      {/* Rabbinic Panel credential — on the section's own dark ground, right
          after the marquee. Not partner-identifying, so it shows during the
          blackout too. */}
      <RabbinicPill />
    </section>
  );
};

export default FeaturedPartners;
