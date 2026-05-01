import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../engine/store';
import { PARAGRAPH_LOCATION_MAP } from '../engine/achievements';

type LocationTheme = 'residential' | 'warehouse' | 'command' | 'workshop' | 'spaceport' | 'mine' | 'default';

const LOCATION_THEMES: Record<LocationTheme, {
  bgGradient: string;
  overlayOpacity: number;
  borderColor: string;
}> = {
  residential: {
    bgGradient: 'from-frost-950 via-amber-950/20 to-frost-950',
    overlayOpacity: 0.15,
    borderColor: 'border-amber-900/30',
  },
  warehouse: {
    bgGradient: 'from-frost-950 via-frost-900 to-frost-950',
    overlayOpacity: 0.1,
    borderColor: 'border-frost-700/30',
  },
  command: {
    bgGradient: 'from-frost-950 via-ice-950/30 to-frost-950',
    overlayOpacity: 0.2,
    borderColor: 'border-ice-700/30',
  },
  workshop: {
    bgGradient: 'from-frost-950 via-orange-950/20 to-frost-950',
    overlayOpacity: 0.15,
    borderColor: 'border-orange-900/30',
  },
  spaceport: {
    bgGradient: 'from-frost-950 via-red-950/25 to-frost-950',
    overlayOpacity: 0.2,
    borderColor: 'border-red-900/30',
  },
  mine: {
    bgGradient: 'from-frost-950 via-stone-900/30 to-frost-950',
    overlayOpacity: 0.2,
    borderColor: 'border-stone-700/30',
  },
  default: {
    bgGradient: 'from-frost-950 via-ice-950/10 to-frost-950',
    overlayOpacity: 0.1,
    borderColor: 'border-frost-800/50',
  },
};

function getLocationForParagraph(paragraphId: number): LocationTheme {
  for (const [location, ids] of Object.entries(PARAGRAPH_LOCATION_MAP)) {
    if (ids.includes(paragraphId)) {
      return location as LocationTheme;
    }
  }
  return 'default';
}

export function useLocationTheme() {
  const currentParagraph = useGameStore(s => s.currentParagraph);
  const location = useMemo(() => getLocationForParagraph(currentParagraph), [currentParagraph]);
  return LOCATION_THEMES[location] || LOCATION_THEMES.default;
}

export function DynamicBackground() {
  const theme = useLocationTheme();

  return (
    <div className="fixed inset-0 z-0 transition-all duration-1000 pointer-events-none">
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.bgGradient} transition-all duration-1000`} />
    </div>
  );
}

/**
 * Vignette overlay for dramatic scenes.
 * Shows when health is low or at important moments.
 */
export function VignetteOverlay({ intensity = 0 }: { intensity?: number }) {
  if (intensity <= 0) return null;

  return (
    <div
      className="fixed inset-0 z-[5] pointer-events-none transition-opacity duration-700"
      style={{
        boxShadow: `inset 0 0 ${80 + intensity * 120}px ${10 + intensity * 30}px rgba(0,0,0,${0.3 + intensity * 0.4})`,
      }}
    />
  );
}

/**
 * Flash effect for damage / healing / keyword.
 */
export function VisualEffects() {
  const [effect, setEffect] = useState<'damage' | 'heal' | 'keyword' | null>(null);

  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prevState) => {
      // Damage flash
      if (state.stats.health < prevState.stats.health) {
        setEffect('damage');
        setTimeout(() => setEffect(null), 400);
      }
      // Heal flash (medkit use — health up, medkits down)
      if (state.stats.health > prevState.stats.health && state.stats.medkits < prevState.stats.medkits) {
        setEffect('heal');
        setTimeout(() => setEffect(null), 400);
      }
      // Keyword gained
      if (state.keywords.length > prevState.keywords.length) {
        setEffect('keyword');
        setTimeout(() => setEffect(null), 600);
      }
    });
    return unsub;
  }, []);

  if (!effect) return null;

  if (effect === 'damage') {
    return (
      <div className="fixed inset-0 z-[60] pointer-events-none">
        <div className="absolute inset-0 bg-danger/30 animate-flash-red" />
        <div className="absolute inset-0 animate-shake" />
      </div>
    );
  }

  if (effect === 'heal') {
    return (
      <div className="fixed inset-0 z-[60] pointer-events-none">
        <div className="absolute inset-0 bg-success/20 animate-flash-green" />
      </div>
    );
  }

  if (effect === 'keyword') {
    return (
      <div className="fixed inset-0 z-[60] pointer-events-none">
        <div className="absolute inset-0 bg-ice-400/15 animate-flash-blue" />
      </div>
    );
  }

  return null;
}

/**
 * Auto-intensity vignette based on current health.
 */
export function HealthVignette() {
  const stats = useGameStore(s => s.stats);
  const healthRatio = stats.health / stats.maxHealth;
  const intensity = healthRatio < 0.3 ? (0.3 - healthRatio) / 0.3 : 0;

  return <VignetteOverlay intensity={intensity} />;
}