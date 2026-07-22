import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// A subtle "scroll" affordance for tall, above-the-fold sections: a small
// label plus three chevrons that light up in sequence. It fades out for good
// the instant the user scrolls, so it never competes with real content.
const ScrollHint = ({ className = '', label = 'Scroll' }) => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 8) setHidden(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
