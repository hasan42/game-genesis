/**
 * LocationTransition — полноэкранный переход при смене локации
 * Показывает название локации с fade-in анимацией (1.5 сек)
 * Фон: градиент, соответствующий локации (DynamicBackground)
 */

import { useEffect, useState, useMemo } from 'react';
import { getLocationForParagraph as getLocForParagraph } from '../engine/locations';

type LocationId = 'residential' | 'warehouse' | 'command' | 'workshop' | 'spaceport' | 'mine';

const LOCATION_NAMES: Record<LocationId, string> = {
  residential: 'Жилой модуль',
  warehouse: 'Склад',
  command: 'Командный центр',
  workshop: 'Мастерская',
  spaceport: 'Космопорт',
  mine: 'Малая шахта',
};

const LOCATION_GRADIENTS: Record<LocationId, string> = {
  residential: 'from-amber-950/40 via-frost-950 to-frost-950',
  warehouse: 'from-frost-900/60 via-frost-950 to-frost-950',
  command: 'from-ice-950/50 via-frost-950 to-frost-950',
  workshop: 'from-orange-950/40 via-frost-950 to-frost-950',
  spaceport: 'from-red-950/40 via-frost-950 to-frost-950',
  mine: 'from-stone-900/50 via-frost-950 to-frost-950',
};

const LOCATION_ICONS: Record<LocationId, string> = {
  residential: '🏠',
  warehouse: '📦',
  command: '📡',
  workshop: '🔧',
  spaceport: '🚀',
  mine: '⛏️',
};

// Use canonical location lookup from locations.ts (Stage 9.4)
function getLocationForParagraph(paragraphId: number): LocationId | null {
  const loc = getLocForParagraph(paragraphId);
  return loc as LocationId | null;
}

interface LocationTransitionProps {
  /** Paragraph ID we're transitioning TO */
  targetParagraphId: number;
  /** Callback when transition finishes */
  onComplete: () => void;
  /** Total transition duration in ms (default 2000) */
  duration?: number;
}

export function LocationTransition({ targetParagraphId, onComplete, duration = 2000 }: LocationTransitionProps) {
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter');
  const location = useMemo(() => getLocationForParagraph(targetParagraphId), [targetParagraphId]);

  useEffect(() => {
    if (!location) {
      onComplete();
      return;
    }
    // Show enter animation for ~1.5s, then exit for 0.5s
    const enterTimer = setTimeout(() => setPhase('exit'), duration - 500);
    const exitTimer = setTimeout(onComplete, duration);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [location, duration, onComplete]);

  if (!location) return null;

  const gradient = LOCATION_GRADIENTS[location] || 'from-frost-950 via-frost-950 to-frost-950';
  const name = LOCATION_NAMES[location];
  const icon = LOCATION_ICONS[location];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${gradient} ${phase === 'enter' ? 'location-transition-enter' : 'location-transition-exit'}`} />

      {/* Location name */}
      <div className={`relative text-center ${phase === 'enter' ? 'location-transition-enter' : 'location-transition-exit'}`}>
        <div className="text-5xl mb-4">{icon}</div>
        <h2 className="text-3xl sm:text-5xl font-serif font-bold text-ice-200" style={{ textShadow: '0 0 30px rgba(56, 189, 248, 0.4), 0 0 60px rgba(56, 189, 248, 0.2)' }}>
          {name}
        </h2>
      </div>
    </div>
  );
}

/**
 * Hook to determine if a paragraph transition involves a location change.
 * Returns the target location if it differs from the previous one.
 */
export function useLocationChange(prevParagraphId: number | null, currentParagraphId: number): LocationId | null {
  return useMemo(() => {
    if (prevParagraphId == null) return null;
    const prevLoc = getLocationForParagraph(prevParagraphId);
    const currLoc = getLocationForParagraph(currentParagraphId);
    if (prevLoc !== currLoc && currLoc !== null) {
      return currLoc;
    }
    return null;
  }, [prevParagraphId, currentParagraphId]);
}

export { getLocationForParagraph, LOCATION_NAMES, LOCATION_ICONS, LOCATION_GRADIENTS };