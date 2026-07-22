import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// A subtle "scroll" affordance for sections whose content only appears as you
// scroll through them: a small label plus three chevrons that light up in
// sequence, fading out the moment there's forward progress.
//
// Pass a controlled `hidden` boolean (e.g. derived from a section's scroll
// progress) to drive it from a sticky section. With no `hidden` prop it falls
// back to a top-of-page heuristic (visible until the window scrolls at all).
const ScrollHint = ({ className = '', label = 'Scroll', hidden: hiddenProp }) => {
  const controlled = hiddenProp !== undefined;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (controlled) return;
    const onScroll = () => {
      if (window.scrollY > 8) setScrolled(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [controlled]);

  const hidden = controlled ? hiddenProp : scrolled;

  return (
    <div
      aria-hidden
      className={`pointer-events-none flex flex-col items-center gap-2 transition-opacity duration-500 ${hidden ? 'opacity-0' : 'opacity-100'} ${className}`}
    >
      <span className="text-[0.625rem] font-bold uppercase tracking-[0.4em] opacity-70">{label}</span>
      <div className="flex flex-col items-center -space-y-2.5">
        {[0, 1, 2].map((i) => (
          <ChevronDown
            key={i}
            size={18}
            strokeWidth={2.5}
            className="scroll-hint-chevron"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default ScrollHint;
