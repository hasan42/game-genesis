import { useState } from 'react';
import { useGameStore } from '../engine/store';

export function KeywordsPanel() {
  const keywords = useGameStore(s => s.keywords);
  const [open, setOpen] = useState(false);

  if (keywords.length === 0) return null;

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(!open)}
        className="text-frost-500 hover:text-frost-300 text-sm transition-colors flex items-center gap-2"
      >
        <span>{open ? '▼' : '▶'}</span>
        <span>Ключевые слова ({keywords.length})</span>
      </button>
      
      {open && (
        <div className="mt-2 p-3 bg-frost-900/30 rounded border border-frost-800 flex flex-wrap gap-2">
          {keywords.map((kw, i) => (
            <span key={i} className="text-ice-300 text-sm bg-ice-900/30 px-2 py-1 rounded">
              «{kw.word}»{kw.count > 1 ? ` ×${kw.count}` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}