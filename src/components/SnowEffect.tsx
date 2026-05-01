import { useMemo } from 'react';
import { useGameStore } from '../engine/store';
import { PARAGRAPH_LOCATION_MAP } from '../engine/achievements';

type SnowIntensity = 'blizzard' | 'normal' | 'light' | 'none';

function getSnowIntensity(paragraphId: number): SnowIntensity {
  // Spaceport = no snow
  if (PARAGRAPH_LOCATION_MAP.spaceport?.includes(paragraphId)) return 'none';
  // Command = light (inside)
  if (PARAGRAPH_LOCATION_MAP.command?.includes(paragraphId)) return 'light';
  // Mine = light
  if (PARAGRAPH_LOCATION_MAP.mine?.includes(paragraphId)) return 'light';
  // Warehouse = light (inside)
  if (PARAGRAPH_LOCATION_MAP.warehouse?.includes(paragraphId)) return 'light';
  // Residential = normal
  if (PARAGRAPH_LOCATION_MAP.residential?.includes(paragraphId)) return 'normal';
  // Workshop = light
  if (PARAGRAPH_LOCATION_MAP.workshop?.includes(paragraphId)) return 'light';
  return 'normal';
}

const INTENSITY_COUNT: Record<SnowIntensity, number> = {
  blizzard: 25,
  normal: 20,
  light: 10,
  none: 0,
};

export function SnowEffect() {
  const currentParagraph = useGameStore(s => s.currentParagraph);
  const intensity = useMemo(() => getSnowIntensity(currentParagraph), [currentParagraph]);
  const count = INTENSITY_COUNT[intensity];

  const snowflakes = useMemo(() => {
    if (count === 0) return [];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${2 + Math.random() * 3}px`,
      delay: `${Math.random() * 10}s`,
      duration: `${8 + Math.random() * 12}s`,
      opacity: 0.05 + Math.random() * 0.1,
    }));
  }, [count]);

  if (snowflakes.length === 0) return null;

  return (
    <div className="snow-container">
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