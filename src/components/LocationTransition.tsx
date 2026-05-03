/**
 * LocationTransition — полноэкранный переход при смене локации
 * Показывает название локации с fade-in анимацией
 * Фон: градиент, соответствующий локации (DynamicBackground)
 *
 * Фазы анимации:
 * 1. Fade-in overlay (~0.3s затемнение)
 * 2. Показ названия локации + иконки (fade-in, ~0.5s)
 * 3. Пауза (~1s для чтения)
 * 4. Fade-out (~0.5s)
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { getLocationForParagraph as getLocForParagraph, LOCATION_DATA } from '../engine/locations';
import type { LocationId } from '../engine/locations';

const LOCATION_ICONS: Record<LocationId, string> = {
  residential: '🏠',
  warehouse: '📦',
  command: '📡',
  workshop: '🔧',
  spaceport: '🚀',
  mine: '⛏️',
  surface: '🏔️',
};

function getLocationForParagraph(paragraphId: number): LocationId | null {
  const loc = getLocForParagraph(paragraphId);
  return loc as LocationId | null;
}

interface LocationTransitionProps {
  /** Paragraph ID we're transitioning TO */
  targetParagraphId: number;
  /** Callback when transition finishes */
  onComplete: () => void;
}

type Phase = 'fade-in' | 'show' | 'fade-out';

export function LocationTransition({ targetParagraphId, onComplete }: LocationTransitionProps) {
  const [phase, setPhase] = useState<Phase>('fade-in');
  const location = useMemo(() => getLocationForParagraph(targetParagraphId), [targetParagraphId]);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (!location) {
      onComplete();
      return;
    }

    // Phase 1: fade-in overlay (0.3s) -> Phase 2: show text (1.2s) -> Phase 3: fade-out (0.5s)
    const showTimer = setTimeout(() => setPhase('show'), 300);
    const fadeOutTimer = setTimeout(() => setPhase('fade-out'), 1500);
    const completeTimer = setTimeout(handleComplete, 2000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [location, handleComplete, onComplete]);

  if (!location) return null;

  const locData = LOCATION_DATA[location];
  const name = locData?.name ?? location;
  const icon = LOCATION_ICONS[location] ?? '📍';

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center location-transition-${phase}`}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black" />

      {/* Ambient gradient glow */}
      <div className={`absolute inset-0 bg-gradient-to-b ${locData?.gradient ?? 'from-frost-950 via-frost-950 to-frost-950'} opacity-40`} />

      {/* Content */}
      <div className="relative text-center">
        <div className="text-5xl sm:text-6xl mb-4 location-icon-animate">{icon}</div>
        <h2
          className="text-3xl sm:text-5xl font-serif font-bold text-white location-name-animate"
          style={{ textShadow: '0 0 30px rgba(56, 189, 248, 0.5), 0 0 60px rgba(56, 189, 248, 0.25)' }}
        >
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

export { getLocationForParagraph, LOCATION_ICONS };