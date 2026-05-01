import { useState } from 'react';
import { useGameStore } from '../engine/store';

const STAT_CONFIG = [
  { key: 'health', label: 'Здоровье', icon: '❤️', color: 'bg-danger', showBar: true },
  { key: 'aura', label: 'Аура', icon: '🔮', color: 'bg-aura-light', showBar: false },
  { key: 'agility', label: 'Ловкость', icon: '⚡', color: 'bg-ice-500', showBar: false },
  { key: 'melee', label: 'Холодное оружие', icon: '⚔️', color: 'bg-warning', showBar: false },
  { key: 'stealth', label: 'Стелс', icon: '👁️', color: 'bg-success', showBar: false },
  { key: 'medkits', label: 'Аптечки', icon: '🩹', color: 'bg-success', showBar: false },
] as const;

export function StatsPanel() {
  const stats = useGameStore(s => s.stats);
  const [expanded, setExpanded] = useState(false);

  // On mobile: show only health bar + icons, expandable for details
  return (
    <div className="sticky top-0 z-50 bg-frost-950/95 backdrop-blur-sm border-b border-frost-800/50">
      <div className="max-w-2xl mx-auto px-4 py-2">
        {/* Mobile: compact view with icons + health bar */}
        <div className="flex items-center gap-2 sm:gap-4">
          {STAT_CONFIG.map(({ key, label, icon, color, showBar }) => {
            const value = (stats as any)[key];
            return (
              <div key={key} className="flex items-center gap-1" title={label}>
                <span className="text-sm">{icon}</span>
                {showBar ? (
                  <div className="flex items-center gap-1">
                    <div className="w-16 sm:w-20 h-1.5 bg-frost-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(0, (value / stats.maxHealth) * 100)}%` }}
                      />
                    </div>
                    <span className="text-frost-200 font-mono text-xs">{value}</span>
                  </div>
                ) : (
                  <span className={`font-mono text-xs ${expanded ? 'text-frost-200' : 'text-frost-400 sm:text-frost-200'} hidden sm:inline`}>{value}</span>
                )}
              </div>
            );
          })}
          {/* Expand button for mobile */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="sm:hidden text-frost-500 text-xs ml-auto"
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>

        {/* Expanded detail on mobile */}
        {expanded && (
          <div className="grid grid-cols-3 gap-2 mt-2 sm:hidden">
            {STAT_CONFIG.filter(s => !s.showBar).map(({ key, label, icon }) => {
              const value = (stats as any)[key];
              return (
                <div key={key} className="text-center">
                  <span className="text-xs">{icon}</span>
                  <span className="text-frost-400 text-xs ml-1">{label}</span>
                  <span className="text-frost-200 font-mono text-xs ml-1">{value}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}