import { useMemo } from 'react';
import { useGameStore } from '../engine/store';
import { PARAGRAPH_LOCATION_MAP } from '../engine/achievements';

function getLocationForParagraph(paragraphId: number): string {
  for (const [locId, ids] of Object.entries(PARAGRAPH_LOCATION_MAP)) {
    if (ids.includes(paragraphId)) return locId;
  }
  return 'default';
}

function isOutdoor(paragraphId: number): boolean {
  const loc = getLocationForParagraph(paragraphId);
  return loc === 'spaceport' || loc === 'mine';
}

// Generate star positions once
function generateStars(count: number, seed: number): { x: number; y: number; size: number; opacity: number }[] {
  const stars: { x: number; y: number; size: number; opacity: number }[] = [];
  let s = seed;
  const nextRand = () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < count; i++) {
    stars.push({
      x: nextRand() * 100,
      y: nextRand() * 100,
      size: 1 + nextRand() * 2,
      opacity: 0.2 + nextRand() * 0.5,
    });
  }
  return stars;
}

// Generate particle positions for near layer
function generateParticles(count: number, seed: number): { x: number; y: number; size: number; delay: number; duration: number }[] {
  const particles: { x: number; y: number; size: number; delay: number; duration: number }[] = [];
  let s = seed;
  const nextRand = () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < count; i++) {
    particles.push({
      x: nextRand() * 100,
      y: nextRand() * 100,
      size: 2 + nextRand() * 4,
      delay: nextRand() * 8,
      duration: 6 + nextRand() * 10,
    });
  }
  return particles;
}

export function ParallaxBackground() {
  const currentParagraph = useGameStore(s => s.currentParagraph);
  const outdoor = isOutdoor(currentParagraph);
  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);

  // Stars — far layer
  const stars = useMemo(() => generateStars(isMobile ? 40 : 80, 42), [isMobile]);
  // Station silhouette — mid layer (only on desktop or simplified on mobile)
  // Near particles — snow/ice
  const particles = useMemo(() => generateParticles(isMobile ? 0 : (outdoor ? 15 : 8), 137), [isMobile, outdoor]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" style={{ perspective: '1000px' }}>
      {/* Far layer — stars */}
      <div
        className="absolute inset-0 transition-transform duration-[2000ms]"
        style={{ transform: 'translateZ(-200px) scale(1.2)' }}
      >
        {stars.map((star, i) => (
          <div
            key={`star-${i}`}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animation: `twinkle ${3 + (i % 5)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.7) % 5}s`,
            }}
          />
        ))}
      </div>

      {/* Mid layer — station silhouette (desktop only, simplified on mobile) */}
      {!isMobile && (
        <div
          className="absolute inset-0 transition-transform duration-[1500ms]"
          style={{ transform: 'translateZ(-100px) scale(1.1)' }}
        >
          <svg
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl opacity-[0.08]"
            viewBox="0 0 800 200"
            preserveAspectRatio="xMidYMax meet"
          >
            {/* Station buildings silhouette */}
            <rect x="50" y="80" width="120" height="120" rx="4" fill="currentColor" className="text-frost-400" />
            <rect x="200" y="40" width="160" height="160" rx="6" fill="currentColor" className="text-frost-400" />
            <rect x="390" y="60" width="80" height="140" rx="4" fill="currentColor" className="text-frost-400" />
            <rect x="500" y="90" width="100" height="110" rx="4" fill="currentColor" className="text-frost-400" />
            <rect x="630" y="50" width="120" height="150" rx="6" fill="currentColor" className="text-frost-400" />
            {/* Connecting passages */}
            <rect x="170" y="120" width="30" height="10" fill="currentColor" className="text-frost-500" />
            <rect x="360" y="120" width="30" height="10" fill="currentColor" className="text-frost-500" />
            <rect x="470" y="120" width="30" height="10" fill="currentColor" className="text-frost-500" />
            <rect x="600" y="120" width="30" height="10" fill="currentColor" className="text-frost-500" />
            {/* Antenna */}
            <line x1="280" y1="40" x2="280" y2="10" stroke="currentColor" className="text-frost-400" strokeWidth="2" />
            <circle cx="280" cy="8" r="4" fill="currentColor" className="text-ice-400" />
          </svg>
        </div>
      )}

      {/* Near layer — snow/ice particles */}
      {particles.map((p, i) => (
        <div
          key={`particle-${i}`}
          className="absolute rounded-full bg-ice-300/20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `parallax-particle ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}