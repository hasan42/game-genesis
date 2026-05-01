import { useState, useEffect } from 'react';
import { TUTORIAL_HINTS, getSeenTutorials, markTutorialSeen } from '../engine/achievements';
import type { TutorialHint as TutorialHintType } from '../engine/achievements';

export function TutorialTooltip({ hintId }: { hintId: string }) {
  const [visible, setVisible] = useState(false);
  const [hint, setHint] = useState<TutorialHintType | null>(null);

  useEffect(() => {
    const seen = getSeenTutorials();
    if (seen.has(hintId)) return;
    const found = TUTORIAL_HINTS.find(h => h.id === hintId);
    if (!found) return;
    setHint(found);
    setVisible(true);
  }, [hintId]);

  if (!visible || !hint) return null;

  return (
    <div className="mb-3 p-3 bg-ice-900/30 border border-ice-700/40 rounded-lg flex items-start gap-2" role="alert">
      <span className="text-sm flex-shrink-0">{hint.text}</span>
      <button
        onClick={() => {
          setVisible(false);
          markTutorialSeen(hintId);
        }}
        className="text-frost-500 hover:text-frost-300 text-xs flex-shrink-0 ml-1"
        aria-label="Закрыть подсказку"
      >
        ✕
      </button>
    </div>
  );
}