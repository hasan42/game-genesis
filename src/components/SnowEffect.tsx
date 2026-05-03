import { useMemo, useEffect, useState, useRef } from 'react';
import { useGameStore } from '../engine/store';
import { PARAGRAPH_LOCATION_MAP } from '../engine/locations';

type SnowIntensity = 'blizzard' | 'normal' | 'light' | 'none';

function getSnowIntensity(paragraphId: number): SnowIntensity {
  // Spaceport = blizzard (outside)
  if (PARAGRAPH_LOCATION_MAP.spaceport?.includes(paragraphId)) return 'blizzard';
  // Surface = blizzard (outside on the planet surface)
  if (PARAGRAPH_LOCATION_MAP.surface?.includes(paragraphId)) return 'blizzard';
  // Mine = normal (partially outside)
  if (PARAGRAPH_LOCATION_MAP.mine?.includes(paragraphId)) return 'normal';
  // Command = light (inside)
  if (PARAGRAPH_LOCATION_MAP.command?.includes(paragraphId)) return 'light';
  // Warehouse = light
  if (PARAGRAPH_LOCATION_MAP.warehouse?.includes(paragraphId)) return 'light';
  // Residential = light (inside)
  if (PARAGRAPH_LOCATION_MAP.residential?.includes(paragraphId)) return 'light';
  // Workshop = light
  if (PARAGRAPH_LOCATION_MAP.workshop?.includes(paragraphId)) return 'light';
  return 'normal';
}

const INTENSITY_COUNT: Record<SnowIntensity, number> = {
  blizzard: 25,
  normal: 18,
  light: 8,
  none: 0,
};

interface SnowEffectProps {
  /** Optional manual intensity (1-10). If not provided, derives from location. */
  intensity?: number;
}

export function SnowEffect({ intensity }: SnowEffectProps) {
  const currentParagraph = useGameStore(s => s.currentParagraph);
  const snowType = useMemo(() => getSnowIntensity(currentParagraph), [currentParagraph]);
  
  // 10A.5 — Use intensity prop if provided, otherwise derive from location
  const count = intensity != null
    ? Math.round(intensity * 2.5)
    : INTENSITY_COUNT[snowType];

  // 10A.5 — Smooth transition: track count changes
  const [displayCount, setDisplayCount] = useState(count);
  const prevCountRef = useRef(count);

  useEffect(() => {
    if (count !== prevCountRef.current) {
      // Smooth transition with a short delay
      const timer = setTimeout(() => {
        setDisplayCount(count);
        prevCountRef.current = count;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [count]);

  const snowflakes = useMemo(() => {
    if (displayCount === 0) return [];
    return Array.from({ length: displayCount }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${2 + Math.random() * 3}px`,
      delay: `${Math.random() * 10}s`,
      duration: `${8 + Math.random() * 12}s`,
      opacity: 0.05 + Math.random() * 0.1,
    }));
  }, [displayCount]);

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