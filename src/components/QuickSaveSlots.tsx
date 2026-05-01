import { useState } from 'react';
import { useGameStore } from '../engine/store';
import { quickSave, quickLoad, getQuickSaveInfo, deleteQuickSave, QUICK_SAVE_SLOTS } from '../engine/achievements';
import type { QuickSaveData } from '../engine/achievements';

export function QuickSaveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-frost-500 hover:text-frost-300 text-sm transition-colors flex items-center gap-2"
      aria-label="Быстрые сохранения"
    >
      <span>💾</span>
      <span>Сохранить</span>
    </button>
  );
}

export function QuickSaveModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'save' | 'load'>('save');
  const currentParagraph = useGameStore(s => s.currentParagraph);
  const stats = useGameStore(s => s.stats);
  const keywords = useGameStore(s => s.keywords);
  const history = useGameStore(s => s.history);
  const gameStartTime = useGameStore(s => s.gameStartTime);

  const slots = Array.from({ length: QUICK_SAVE_SLOTS }, (_, i) => i + 1);

  const handleSave = (slot: number) => {
    const data: QuickSaveData = {
      currentParagraph,
      stats: { ...stats } as any,
      keywords: keywords.map(k => ({ ...k })),
      history: history.map(h => ({
        ...h,
        statsSnapshot: h.statsSnapshot ? { ...h.statsSnapshot } as any : undefined,
        keywordsSnapshot: h.keywordsSnapshot ? h.keywordsSnapshot.map(k => ({ ...k })) : undefined,
      })),
      gameStartTime,
      savedAt: Date.now(),
    };
    if (quickSave(slot, data)) {
      onClose();
    }
  };

  const handleLoad = (slot: number) => {
    const data = quickLoad(slot);
    if (!data) return;
    const store = useGameStore.getState();
    store.setPhase('playing');
    // Use loadGame-like logic but with quicksave data
    useGameStore.setState({
      currentParagraph: data.currentParagraph,
      stats: data.stats as any,
      keywords: data.keywords as any,
      history: data.history as any,
      gameStartTime: data.gameStartTime,
      phase: 'playing',
    });
    onClose();
  };

  const handleDelete = (slot: number) => {
    deleteQuickSave(slot);
    // Force re-render
    setMode(mode);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-frost-950/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-frost-900 border border-frost-700 rounded-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-frost-800">
          <h3 className="text-lg font-serif font-bold text-ice-200">💾 Быстрые сохранения</h3>
          <button
            onClick={onClose}
            className="text-frost-500 hover:text-frost-200 text-xl leading-none transition-colors"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex border-b border-frost-800">
          <button
            onClick={() => setMode('save')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'save' ? 'text-ice-200 bg-frost-800/40' : 'text-frost-500 hover:text-frost-300'}`}
          >
            Сохранить
          </button>
          <button
            onClick={() => setMode('load')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'load' ? 'text-ice-200 bg-frost-800/40' : 'text-frost-500 hover:text-frost-300'}`}
          >
            Загрузить
          </button>
        </div>

        {/* Slots */}
        <div className="p-4 space-y-3">
          {slots.map(slot => {
            const info = getQuickSaveInfo(slot);
            return (
              <div key={slot} className="flex items-center gap-3 bg-frost-800/30 rounded-lg p-3 border border-frost-800/50">
                <div className="text-ice-400 font-mono text-sm font-bold w-6">#{slot}</div>
                {info.exists ? (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="text-frost-300 text-sm">¶ {info.paragraphId}</div>
                      <div className="text-frost-600 text-xs">
                        {info.savedAt ? new Date(info.savedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                    {mode === 'save' && (
                      <button
                        onClick={() => handleSave(slot)}
                        className="px-3 py-1.5 bg-ice-800 hover:bg-ice-700 text-ice-200 text-xs rounded transition-colors"
                      >
                        💾 Сохранить
                      </button>
                    )}
                    {mode === 'load' && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleLoad(slot)}
                          className="px-3 py-1.5 bg-ice-800 hover:bg-ice-700 text-ice-200 text-xs rounded transition-colors"
                        >
                          📂 Загрузить
                        </button>
                        <button
                          onClick={() => handleDelete(slot)}
                          className="px-2 py-1.5 bg-frost-800 hover:bg-danger/20 text-frost-500 hover:text-danger text-xs rounded transition-colors"
                          aria-label="Удалить сохранение слота"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex-1 text-frost-700 text-sm italic">Пустой слот</div>
                    {mode === 'save' && (
                      <button
                        onClick={() => handleSave(slot)}
                        className="px-3 py-1.5 bg-ice-800 hover:bg-ice-700 text-ice-200 text-xs rounded transition-colors"
                      >
                        💾 Сохранить
                      </button>
                    )}
                    {mode === 'load' && (
                      <span className="text-frost-700 text-xs italic">—</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}