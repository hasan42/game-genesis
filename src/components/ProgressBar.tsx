import { useGameStore, gameData } from '../engine/store';

export function ProgressBar() {
  const history = useGameStore(s => s.history);
  const totalParagraphs = gameData.paragraphs.length;
  const paragraphsVisited = new Set(history.map(h => h.paragraphId)).size;
  const pct = totalParagraphs > 0 ? Math.round((paragraphsVisited / totalParagraphs) * 100) : 0;

  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Прогресс исследования: ${pct}%`}>
      <div className="flex-1 h-1.5 bg-frost-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-ice-700 to-ice-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-frost-600 text-xs font-mono whitespace-nowrap">{paragraphsVisited}/{totalParagraphs}</span>
    </div>
  );
}