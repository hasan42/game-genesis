/**
 * TimeIndicator — индикатор времени суток для StatsPanel
 * Показывает иконку (солнце/луна) + часы (например: 🕐 14:00)
 * Использует gameHour из Zustand store
 */

import { useGameTime } from './DayNightCycle';

export function TimeIndicator() {
  const { icon, formatted } = useGameTime();

  return (
    <div className="flex items-center gap-1" title="Время суток">
      <span className="text-sm">{icon}</span>
      <span className="font-mono text-xs text-frost-400 sm:text-frost-200">{formatted}</span>
    </div>
  );
}