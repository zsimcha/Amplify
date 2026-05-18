import { useMemo } from 'react';

/**
 * Generates a constellation-style dot pattern that's densest in one corner
 * and fades toward the opposite corner. Used in PageLayout headers and
 * anywhere else the design language wants to echo the About constellation.
 */
const CornerConstellation = ({
  corner = 'top-right',
  width = 420,
  height = 320,
  density = 22,
  maxR = 2.8,
  jitter = 0.35,
  color = '#fbbf24',
  seed = 1,
  className = '',
  style,
}) => {
  const dots = useMemo(() => {
    // Seeded pseudo-random so dots stay stable across renders
    let s = seed * 9301 + 49297;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    const result = [];
    const cornerX = corner.includes('right') ? width : 0;
    const cornerY = corner.includes('bottom') ? height : 0;
    const maxDist = Math.sqrt(width * width + height * height);

    for (let x = density / 2; x < width; x += density) {
      for (let y = density / 2; y < height; y += density) {
        const jx = x + (rand() - 0.5) * density * jitter;
        const jy = y + (rand() - 0.5) * density * jitter;
        const dx = cornerX - jx;
        const dy = cornerY - jy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const t = 1 - dist / maxDist;
        const o = Math.max(0, t * t * 1.1);
        if (o < 0.06) continue;
        result.push({
          cx: jx,
          cy: jy,
          r: Math.max(0.8, t * maxR),
          opacity: o,
        });
      }
    }
    return result;
  }, [corner, width, height, density, maxR, jitter, seed]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={style}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.cx}
          cy={d.cy}
          r={d.r}
          fill={color}
          opacity={d.opacity}
        />
      ))}
    </svg>
  );
};

export default CornerConstellation;