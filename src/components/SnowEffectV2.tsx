import { useMemo } from 'react';
import { useGameStore } from '../engine/store';
import { PARAGRAPH_LOCATION_MAP } from '../engine/achievements';

function getLocationForParagraph(paragraphId: number): string {
  for (const [locId, ids] of Object.entries(PARAGRAPH_LOCATION_MAP)) {
    if (ids.includes(paragraphId)) return locId;
  }
  return 'default';
}

export function useSnowIntensity(): number {
  const currentParagraph = useGameStore(s => s.currentParagraph);
  return useMemo(() => {
    const loc = getLocationForParagraph(currentParagraph);
    switch (loc) {
      case 'spaceport': return 10;
      case 'mine': return 8;
      case 'residential': return 5;
      case 'default': return 5;
      case 'command': return 2;
      case 'warehouse': return 2;
      case 'workshop': return 2;
      default: return 5;
    }
  }, [currentParagraph]);
}

export function SnowEffectV2() {
  const intensity = useSnowIntensity();
  const count = Math.min(Math.round(intensity * 2.5), 25); // cap at 25 particles (8.5)

  const snowflakes = useMemo(() => {
    if (count === 0) return [];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${1 + Math.random() * 3}px`,
      delay: `${Math.random() * 10}s`,
      duration: `${6 + Math.random() * 12}s`,
      opacity: 0.05 + Math.random() * 0.15,
    }));
  }, [count]);

  if (snowflakes.length === 0) return null;

  return (
    <div className="snow-container snow-intensity-transition">
      {snowflakes.map(flake => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: flake.left,
            width: flake.size,
            height: flake.size,
            animationDelay: flake.delay,
            animationDuration: flake.duration,
            opacity: flake.opacity,
          }}
        />
      ))}
    </div>
  );
}