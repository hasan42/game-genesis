/**
 * DayNightCycle — дневной цикл
 * gameHour из Zustand store: начало = 8 утра, +1 за каждый параграф
 * Фон постепенно темнеет: яркое утро → день → вечер → ночь
 * CSS filter: brightness + hue-rotate для имитации времени суток
 */

import { useMemo } from 'react';
import { useGameStore } from '../engine/store';

function getTimeOfDay(hour: number): 'dawn' | 'morning' | 'day' | 'evening' | 'night' {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getTimeFilter(hour: number): React.CSSProperties {
  let brightness = 1;
  let hueRotate = 0;
  let saturate = 1;

  if (hour >= 5 && hour < 7) {
    // Dawn — slightly dim, warm hue
    const t = (hour - 5) / 2;
    brightness = 0.7 + t * 0.2;
    hueRotate = 15 - t * 10;
    saturate = 0.85 + t * 0.1;
  } else if (hour >= 7 && hour < 12) {
    // Morning — getting brighter
    const t = (hour - 7) / 5;
    brightness = 0.9 + t * 0.1;
    hueRotate = 5 - t * 5;
    saturate = 0.95 + t * 0.05;
  } else if (hour >= 12 && hour < 17) {
    // Day — full brightness, neutral
    brightness = 1;
    hueRotate = 0;
    saturate = 1;
  } else if (hour >= 17 && hour < 21) {
    // Evening — getting dimmer, warm shift
    const t = (hour - 17) / 4;
    brightness = 1 - t * 0.3;
    hueRotate = t * 20;
    saturate = 1 - t * 0.15;
  } else {
    // Night — dim, cool blue shift
    const nightProgress = hour >= 21
      ? (hour - 21) / 8
      : hour / 5;
    brightness = 0.6 + nightProgress * 0.1;
    hueRotate = 20 + nightProgress * 5;
    saturate = 0.75 + nightProgress * 0.1;
  }

  return {
    filter: `brightness(${brightness}) hue-rotate(${hueRotate}deg) saturate(${saturate})`,
  };
}

function getTimeIcon(hour: number): string {
  if (hour >= 6 && hour < 18) return '☀️';
  if (hour >= 18 && hour < 21) return '🌅';
  if (hour >= 21 || hour < 5) return '🌙';
  return '🌅';
}

function formatHour(hour: number): string {
  const h = (hour % 24).toString().padStart(2, '0');
  return `${h}:00`;
}

export function DayNightOverlay() {
  const gameHour = useGameStore(s => s.gameHour);
  const phase = useGameStore(s => s.phase);

  const filterStyle = useMemo(() => getTimeFilter(gameHour), [gameHour]);

  // Don't show in title/setup/prologue screens
  if (phase !== 'playing' && phase !== 'dead' && phase !== 'victory') return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[2] transition-all duration-[3000ms]"
      style={filterStyle}
    />
  );
}

export function useGameTime() {
  const gameHour = useGameStore(s => s.gameHour);
  const hour = gameHour % 24;
  const timeOfDay = useMemo(() => getTimeOfDay(hour), [hour]);
  const icon = useMemo(() => getTimeIcon(hour), [hour]);
  const formatted = useMemo(() => formatHour(hour), [hour]);

  return { hour, timeOfDay, icon, formatted };
}

export { getTimeOfDay, getTimeIcon, formatHour };