/**
 * DustParticles — мелкие частицы пыли внутри станции
 * Появляются только когда локация «внутри станции»
 * 15-20 маленьких точек (2-4px), медленно дрейфуют сверху вниз
 */

import { useMemo } from 'react';
import { useGameStore } from '../engine/store';
import { PARAGRAPH_LOCATION_MAP } from '../engine/locations';

type DustLocation = 'inside' | 'outside' | 'none';

function getDustLocation(paragraphId: number): DustLocation {
  // Inside locations: residential, command, warehouse, workshop
  if (PARAGRAPH_LOCATION_MAP.residential?.includes(paragraphId)) return 'inside';
  if (PARAGRAPH_LOCATION_MAP.command?.includes(paragraphId)) return 'inside';
  if (PARAGRAPH_LOCATION_MAP.warehouse?.includes(paragraphId)) return 'inside';
  if (PARAGRAPH_LOCATION_MAP.workshop?.includes(paragraphId)) return 'inside';
  // Outside: spaceport, mine, surface
  if (PARAGRAPH_LOCATION_MAP.spaceport?.includes(paragraphId)) return 'outside';
  if (PARAGRAPH_LOCATION_MAP.mine?.includes(paragraphId)) return 'outside';
  if (PARAGRAPH_LOCATION_MAP.surface?.includes(paragraphId)) return 'outside';
  return 'none';
}

// Seeded random for consistent particle positions per paragraph
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function randomBetween(min: number, max: number, rng: () => number): number {
  return min + rng() * (max - min);
}

export function DustParticles() {
  const currentParagraph = useGameStore(s => s.currentParagraph);
  const dustLocation = useMemo(() => getDustLocation(currentParagraph), [currentParagraph]);

  const particles = useMemo(() => {
    if (dustLocation !== 'inside') return [];
    // Use paragraph id as seed for consistent positions
    const rng = seededRandom(currentParagraph);
    const count = Math.floor(randomBetween(15, 20, rng));
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${randomBetween(0, 100, rng)}%`,
      size: `${randomBetween(2, 4, rng)}px`,
      delay: `${randomBetween(0, 15, rng)}s`,
      duration: `${randomBetween(10, 20, rng)}s`,
      opacity: randomBetween(0.1, 0.3, rng),
      driftX: `${randomBetween(-30, 30, rng)}px`,
    }));
  }, [dustLocation, currentParagraph]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {/* Inline keyframes — avoids editing index.css */}
      <style>{`
        @keyframes dust-float {
          0% {
            transform: translateY(-10px) translateX(0);
            opacity: 0;
          }
          5% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.2;
          }
          95% {
            opacity: 0.15;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: '-5px',
            width: p.size,
            height: p.size,
            backgroundColor: 'rgba(148, 163, 184, 0.6)', // frost-400 with transparency
            opacity: p.opacity,
            animation: `dust-float ${p.duration} linear ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}