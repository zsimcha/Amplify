import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { partners, partnerLogo } from '../data/partners';
import { HIDE_PARTNER_IDENTITIES } from '../config/siteConfig';

// One selectable org tile: logo (or name fallback), name, category, and a
// brief description. Clicking toggles selection; once `max` are chosen, the
// unselected tiles disable.
const Tile = ({ partner, selected, disabled, onToggle }) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const src = partnerLogo(partner);

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={selected}
      className={`relative text-left rounded-2xl border p-4 transition-all flex flex-col outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
        selected
          ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/50'
          : disabled
            ? 'border-slate-200 bg-white opacity-45 cursor-not-allowed'
            : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-soft cursor-pointer'
      }`}
    >
      {selected && (
        <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm">
          <Check size={12} className="text-white" strokeWidth={3} />
        </span>
      )}

      {!logoFailed && (
        <div className="h-9 flex items-center mb-2.5">
          <img
            src={src}
            alt={partner.name}
            onError={() => setLogoFailed(true)}
            className="max-h-9 max-w-[72%] object-contain"
          />
        </div>
      )}

      <p className="text-[0.625rem] font-bold uppercase tracking-widest text-amber-600 mb-1">{partner.category}</p>
      <p className="text-sm font-black text-slate-900 tracking-tight mb-1 pr-5">{partner.name}</p>
      <p className="text-[0.75rem] text-slate-500 font-medium leading-snug">{partner.description}</p>
    </button>
  );
};

// Controlled: `value` is an array of selected slugs, `onChange` gets the next
// array, `max` caps the count.
const CharitySelector = ({ value = [], onChange, max = 4 }) => {
  const toggle = (slug) => {
    if (value.includes(slug)) onChange(value.filter((s) => s !== slug));
    else if (value.length < max) onChange([...value, slug]);
  };

  const atMax = value.length >= max;

  // Partner blackout: never render names or logos here either.
  if (HIDE_PARTNER_IDENTITIES) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600 mb-3">Coming soon</p>
        <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
          Choosing which organizations your giving supports opens as soon as our partners are
          announced. Until then, your donation is split evenly among all of them.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
        <span className="text-indigo-600">{value.length}</span> of {max} selected
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {partners.map((p) => {
          const selected = value.includes(p.slug);
          return (
            <Tile
              key={p.slug}
              partner={p}
              selected={selected}
              disabled={atMax && !selected}
              onToggle={() => toggle(p.slug)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CharitySelector;
