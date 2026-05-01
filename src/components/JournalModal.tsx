import { useGameStore, gameData } from '../engine/store';
import type { HistoryEntry } from '../engine/types';

export function JournalModal({ onClose }: { onClose: () => void }) {
  const history = useGameStore(s => s.history);
  const stats = useGameStore(s => s.stats);
  const gameStartTime = useGameStore(s => s.gameStartTime);
  const reversed = [...history].reverse();

  // Compute statistics
  const paragraphsVisited = new Set(history.map(h => h.paragraphId)).size;
  const bestHealth = Math.max(history[0]?.statsSnapshot?.health ?? stats.health, ...history.map(h => h.statsSnapshot?.health ?? 0));
  const bestAura = Math.max(history[0]?.statsSnapshot?.aura ?? stats.aura, ...history.map(h => h.statsSnapshot?.aura ?? 0));
  const bestAgility = Math.max(history[0]?.statsSnapshot?.agility ?? stats.agility, ...history.map(h => h.statsSnapshot?.agility ?? 0));
  const bestMelee = Math.max(history[0]?.statsSnapshot?.melee ?? stats.melee, ...history.map(h => h.statsSnapshot?.melee ?? 0));
  const bestStealth = Math.max(history[0]?.statsSnapshot?.stealth ?? stats.stealth, ...history.map(h => h.statsSnapshot?.stealth ?? 0));

  const totalParagraphs = gameData.paragraphs.length;
  const explorationPct = totalParagraphs > 0 ? Math.round((paragraphsVisited / totalParagraphs) * 100) : 0;

  // Play time
  const playTimeMs = gameStartTime ? Date.now() - gameStartTime : 0;
  const playMinutes = Math.floor(playTimeMs / 60000);
  const playHours = Math.floor(playMinutes / 60);
  const playTimeStr = playHours > 0
    ? `${playHours}ч ${playMinutes % 60}мин`
    : `${playMinutes}мин`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-frost-950/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[85vh] bg-frost-900 border border-frost-700 rounded-xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-frost-800">
          <h3 className="text-lg font-serif font-bold text-ice-200">📜 Журнал пройденного</h3>
          <button
            onClick={onClose}
            className="text-frost-500 hover:text-frost-200 text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Statistics */}
        <div className="px-5 py-3 border-b border-frost-800/50 bg-frost-800/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-ice-300 text-lg font-bold">{history.length}</div>
              <div className="text-frost-500 text-xs">Шагов</div>
            </div>
            <div>
              <div className="text-ice-300 text-lg font-bold">{paragraphsVisited}</div>
              <div className="text-frost-500 text-xs">Параграфов ({explorationPct}%)</div>
            </div>
            <div>
              <div className="text-ice-300 text-lg font-bold">{playTimeStr}</div>
              <div className="text-frost-500 text-xs">Время игры</div>
            </div>
            <div>
              <div className="text-ice-300 text-lg font-bold">❤️{bestHealth}</div>
              <div className="text-frost-500 text-xs">Макс. здоровье</div>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-xs text-frost-500">
            <span>🔮{bestAura}</span>
            <span>⚡{bestAgility}</span>
            <span>⚔️{bestMelee}</span>
            <span>👁️{bestStealth}</span>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {reversed.length === 0 && (
            <p className="text-frost-500 text-sm text-center py-8">Пока ничего не пройдено</p>
          )}
          {reversed.map((entry, i) => (
            <JournalEntry key={history.length - 1 - i} entry={entry} index={history.length - 1 - i} isLast={i === 0} />
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-frost-800 text-frost-500 text-xs text-center">
          Всего параграфов в книге: {totalParagraphs}
        </div>
      </div>
    </div>
  );
}

function JournalEntry({ entry, index, isLast }: { entry: HistoryEntry; index: number; isLast: boolean }) {
  const paragraph = gameData.paragraphs.find(p => p.id === entry.paragraphId);
  const title = paragraph?.title || `¶ ${entry.paragraphId}`;
  const textPreview = paragraph?.text[0]?.substring(0, 80) || '';
  const goBackInHistory = useGameStore(s => s.goBackInHistory);
  const currentParagraph = useGameStore(s => s.currentParagraph);

  const isCurrent = entry.paragraphId === currentParagraph && isLast;

  return (
    <div className={`bg-frost-800/40 rounded-lg p-3 border ${isCurrent ? 'border-ice-700/60' : 'border-frost-800/60'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-ice-400 font-mono text-xs">#{index + 1}</span>
        <span className="text-frost-600 text-xs">{new Date(entry.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div className="text-ice-200 font-serif text-sm mb-1">{title}</div>
      {entry.choiceDescription && (
        <div className="text-frost-400 text-xs italic">→ {entry.choiceDescription}</div>
      )}
      {textPreview && (
        <div className="text-frost-600 text-xs mt-1 line-clamp-2">{textPreview}…</div>
      )}
      {/* Stats snapshot */}
      {entry.statsSnapshot && (
        <div className="flex gap-3 mt-1.5 text-frost-600 text-xs">
          <span>❤️{entry.statsSnapshot.health}</span>
          <span>🔮{entry.statsSnapshot.aura}</span>
          <span>⚡{entry.statsSnapshot.agility}</span>
          <span>⚔️{entry.statsSnapshot.melee}</span>
        </div>
      )}
      {/* Go back button */}
      {!isCurrent && (
        <button
          onClick={() => goBackInHistory(index)}
          className="mt-2 text-xs text-ice-500 hover:text-ice-300 transition-colors flex items-center gap-1"
        >
          <span>↩</span>
          <span>Вернуться сюда</span>
        </button>
      )}
    </div>
  );
}

export function JournalButton({ onClick }: { onClick: () => void }) {
  const history = useGameStore(s => s.history);

  if (history.length === 0) return null;

  return (
    <button
      onClick={onClick}
      className="text-frost-500 hover:text-frost-300 text-sm transition-colors flex items-center gap-2"
    >
      <span>📜</span>
      <span>Журнал ({history.length})</span>
    </button>
  );
}