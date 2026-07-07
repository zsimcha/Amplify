import { useEffect, useState } from 'react';

// Scale factor for content inside pinned (sticky) full-viewport sections.
//
// Those sections always occupy the full viewport while their scroll animation
// plays, but their content is a fixed size — on large monitors the content
// floats in a sea of empty white space. Scaling the content uniformly keeps it
// filling the stage as the screen grows, without touching the scroll-driven
// animation math. Returns exactly 1 on laptop-sized and smaller viewports
// (including all mobile), and is capped so type never becomes absurdly large.
const useViewportScale = ({ baseHeight = 850, baseWidth = 1500, max = 1.75 } = {}) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let raf = null;
    const update = () => {
      raf = null;
      const next = Math.max(
        1,
        Math.min(max, window.innerHeight / baseHeight, window.innerWidth / baseWidth)
      );
      setScale((prev) => (Math.abs(prev - next) > 0.005 ? next : prev));
    };
    const onResize = () => {
      if (raf === null) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [baseHeight, baseWidth, max]);

  return scale;
};

export default useViewportScale;
