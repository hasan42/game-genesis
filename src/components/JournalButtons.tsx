// Lightweight button components extracted from JournalModal and StationMap
// to avoid static imports pulling in the heavy modal code

import { useGameStore } from '../engine/store';

export function JournalButton({ onClick }: { onClick: () => void }) {
  const history = useGameStore(s => s.history);

  if (history.length === 0) return null;

  return (
    <button
      onClick={onClick}
      className="text-frost-500 hover:text-frost-300 text-sm transition-colors flex items-center gap-2"
      aria-label="Открыть журнал пройденного"
    >
      <span>📜</span>
      <span>Журнал ({history.length})</span>
    </button>
  );
}

export function MapButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-frost-500 hover:text-frost-300 text-sm transition-colors flex items-center gap-2"
      aria-label="Открыть карту станции"
    >
      <span>🗺️</span>
      <span>Карта</span>
    </button>
  );
}