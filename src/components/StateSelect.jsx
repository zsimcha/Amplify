import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { US_STATES, US_STATE_NAMES } from '../lib/constants';
import { fieldClass } from '../lib/formStyles';

// A native <select> hands positioning entirely to the browser/OS: with 51
// options it can pop open above the field, or jump to center on the current
// value, depending on scroll position and platform — inconsistent, and not
// something CSS can fix. This instead always opens downward from the
// trigger into a fixed-height, internally-scrolling panel (same pattern as
// the community picker elsewhere on this page), so it never covers content
// above the field or repositions itself as the page scrolls.
//
// Keyboard behavior mirrors what a native <select> gives for free, since
// swapping it out shouldn't cost that: arrow keys move the highlighted
// option, Enter/Space commits it, Escape closes, and typing a letter jumps
// to the next state whose name starts with it (classic listbox typeahead).
const StateSelect = ({ id, value, onChange, hasError, placeholder = 'Select a state' }) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const typeaheadRef = useRef({ buffer: '', timer: null });

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  // Opening the panel should highlight the current value (or the top of the
  // list). Done wherever `open` is actually set to true below, rather than
  // as an effect reacting to `open`, so it's one render instead of two.
  const openPanel = () => {
    setActiveIndex(Math.max(0, US_STATES.indexOf(value)));
    setOpen(true);
  };

  useEffect(() => {
    if (open && activeIndex >= 0) {
      // scrollIntoView isn't implemented in jsdom (undefined, not just
      // absent) — a plain `?.` before the property guards a nullish element,
      // not a missing method on a real one, so the call itself needs its
      // own `?.` too.
      listRef.current?.children[activeIndex]?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [open, activeIndex]);

  useEffect(() => () => clearTimeout(typeaheadRef.current.timer), []);

  const commit = (code) => {
    onChange(code);
    setOpen(false);
  };

  const jumpToLetter = (letter) => {
    const ta = typeaheadRef.current;
    clearTimeout(ta.timer);
    ta.buffer += letter.toLowerCase();
    ta.timer = setTimeout(() => { ta.buffer = ''; }, 600);
    const start = Math.max(activeIndex, 0);
    for (let step = 1; step <= US_STATES.length; step++) {
      const idx = (start + step) % US_STATES.length;
      if (US_STATE_NAMES[US_STATES[idx]].toLowerCase().startsWith(ta.buffer)) {
        setActiveIndex(idx);
        return;
      }
    }
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPanel();
      }
      return;
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        return;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, US_STATES.length - 1));
        return;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0) commit(US_STATES[activeIndex]);
        return;
      case 'Tab':
        setOpen(false);
        return;
      default:
        if (/^[a-zA-Z]$/.test(e.key)) jumpToLetter(e.key);
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={handleKeyDown}
        className={fieldClass(hasError, 'text-left flex justify-between items-center cursor-pointer')}
      >
        <span className={`truncate pr-2 ${value ? '' : 'text-slate-400'}`}>{value ? US_STATE_NAMES[value] : placeholder}</span>
        <ChevronDown className={`text-slate-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} size={16} />
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-activedescendant={activeIndex >= 0 ? `${id}-opt-${US_STATES[activeIndex]}` : undefined}
          className="absolute z-30 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-2"
        >
          {US_STATES.map((code, i) => (
            <li
              key={code}
              id={`${id}-opt-${code}`}
              role="option"
              aria-selected={value === code}
              onClick={() => commit(code)}
              className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                value === code ? 'bg-indigo-50 text-indigo-900' : 'text-slate-600 hover:bg-slate-50'
              } ${activeIndex === i ? 'ring-2 ring-indigo-500' : ''}`}
            >
              {US_STATE_NAMES[code]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StateSelect;
