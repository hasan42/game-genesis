import { useGameStore } from '../engine/store';

export function CriticalHealthOverlay() {
  const stats = useGameStore(s => s.stats);
  const healthRatio = stats.health / stats.maxHealth;
  
  // Only show when health < 30%
  if (healthRatio >= 0.3) return null;

  // Intensity increases as health drops: 30% → mild, 15% → intense
  const intensity = healthRatio < 0.15 ? 'intense' : 'mild';

  return (
    <div className={`fixed inset-0 z-[55] pointer-events-none critical-health-overlay critical-health-${intensity}`} />
  );
}