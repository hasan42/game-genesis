import { useState } from 'react';
import { useGameStore, gameData } from '../engine/store';
import { SnowEffect } from './SnowEffect';
import { DynamicBackground } from './DynamicBackground';

export function PrologueScreen() {
  const [sectionIndex, setSectionIndex] = useState(0);
  const setPhase = useGameStore(s => s.setPhase);
  const prologues = gameData.metadata.prologues;

  const section = prologues[sectionIndex];
  const isFirst = sectionIndex === 0;
  const isLast = sectionIndex === prologues.length - 1;

  return (
    <div className="min-h-screen bg-frost-950 text-frost-100 flex flex-col relative">
      <DynamicBackground />
      <SnowEffect />
      <div className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full relative z-10">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {prologues.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === sectionIndex ? 'bg-ice-400 w-6' : i < sectionIndex ? 'bg-ice-700' : 'bg-frost-800'
              }`}
            />
          ))}
        </div>

        {/* Section title */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-ice-200 mb-4 sm:mb-6 text-center">
          {section.title}
        </h2>

        {/* Section text */}
        <div className="space-y-4 mb-10">
          {section.text.map((line, i) => (
            <p key={i} className="text-frost-300 leading-relaxed text-sm sm:text-base md:text-lg font-serif">
              {line}
            </p>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          {!isFirst ? (
            <button
              onClick={() => setSectionIndex(i => i - 1)}
              className="px-6 py-2 text-frost-400 hover:text-frost-200 transition-colors text-sm"
            >
              ← Назад
            </button>
          ) : (
            <div />
          )}

          {isLast ? (
            <button
              onClick={() => setPhase('setup')}
              className="px-6 py-2 sm:px-8 sm:py-3 bg-ice-800 hover:bg-ice-700 text-ice-100 rounded-lg text-base sm:text-lg transition-all duration-300 hover:scale-105"
            >
              Распределить очки →
            </button>
          ) : (
            <button
              onClick={() => setSectionIndex(i => i + 1)}
              className="px-6 py-2 sm:px-8 sm:py-3 bg-ice-800 hover:bg-ice-700 text-ice-100 rounded-lg text-base sm:text-lg transition-all duration-300 hover:scale-105"
            >
              Далее →
            </button>
          )}
        </div>
      </div>

      {/* Skip */}
      <div className="text-center pb-6">
        <button
          onClick={() => setPhase('setup')}
          className="text-frost-600 hover:text-frost-400 text-xs transition-colors"
        >
          Пропустить пролог →
        </button>
      </div>
    </div>
  );
}