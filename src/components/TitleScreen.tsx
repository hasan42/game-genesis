import { useState } from 'react';
import { useGameStore } from '../engine/store';
import { SnowEffect } from './SnowEffect';
import { ExportImportButtons } from './ExportImport';
import { ENDING_PARAGRAPH_IDS, getReachedEndings, getUnlockedAchievements, ACHIEVEMENTS } from '../engine/achievements';
import { AchievementsModal } from './AchievementsModal';
import { DynamicBackground } from './DynamicBackground';

export function TitleScreen() {
  const loadGame = useGameStore(s => s.loadGame);
  const readerMode = useGameStore(s => s.readerMode);
  const toggleReaderMode = useGameStore(s => s.toggleReaderMode);
  const hasSave = localStorage.getItem('game-genesis-save');
  const [showAchievements, setShowAchievements] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-frost-950 text-frost-100 px-4 relative">
      <DynamicBackground />
      <SnowEffect />
      {/* Animated snow effect placeholder */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-frost-950 via-ice-950/20 to-frost-950" />
      </div>
      
      <div className="relative z-10 text-center">
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-serif font-bold text-ice-200 mb-2 tracking-wider">
          ГЕНЕЗИС
        </h1>
        <p className="text-frost-400 text-base sm:text-lg md:text-xl mb-8 sm:mb-12 font-serif italic">
          Планета Ледхом. Станция буровиков.
        </p>

        <div className="flex flex-col gap-4 items-center">
          <button
            onClick={() => {
              useGameStore.getState().setPhase('prologue');
            }}
            className="px-6 py-3 sm:px-8 bg-ice-800 hover:bg-ice-700 text-ice-100 rounded-lg text-base sm:text-lg transition-all duration-300 hover:scale-105 min-w-[200px] sm:min-w-[240px]"
            aria-label="Начать новую игру"
          >
            Новая игра
          </button>

          {hasSave && (
            <button
              onClick={() => loadGame()}
              className="px-6 py-3 sm:px-8 bg-frost-800 hover:bg-frost-700 text-frost-200 rounded-lg text-base sm:text-lg transition-all duration-300 hover:scale-105 min-w-[200px] sm:min-w-[240px]"
              aria-label="Продолжить сохранённую игру"
            >
              Продолжить
            </button>
          )}
        </div>

        <p className="text-frost-600 text-xs sm:text-sm mt-10 sm:mt-16 max-w-md mx-auto px-4">
          Книга-игра. Каждый ваш выбор определяет судьбу.
        </p>

        <div className="mt-6">
          <ExportImportButtons />
        </div>

        {/* Reader mode toggle */}
        <div className="mt-4">
          <button
            onClick={toggleReaderMode}
            className={`text-sm transition-colors flex items-center gap-2 mx-auto ${
              readerMode ? 'text-amber-300 hover:text-amber-200' : 'text-frost-600 hover:text-frost-400'
            }`}
            aria-label={readerMode ? 'Выйти из режима читателя' : 'Включить режим читателя'}
          >
            <span>📖</span>
            <span>{readerMode ? 'Режим читателя: ВКЛ' : 'Режим читателя'}</span>
          </button>
          {readerMode && (
            <p className="text-amber-400/70 text-xs text-center mt-1 max-w-xs">Без механики, без смерти, все ветки открыты</p>
          )}
        </div>

        {/* Achievements & Endings summary */}
        {(getUnlockedAchievements().size > 0 || getReachedEndings().size > 0) && (
          <div className="mt-4 flex flex-col items-center gap-2">
            {getUnlockedAchievements().size > 0 && (
              <button
                onClick={() => setShowAchievements(true)}
                className="text-frost-500 hover:text-frost-300 text-xs transition-colors"
                aria-label="Открыть список достижений"
              >
                🏆 {getUnlockedAchievements().size}/{ACHIEVEMENTS.length} ачивок
              </button>
            )}
            {getReachedEndings().size > 0 && (
              <span className="text-frost-600 text-xs">
                🔚 {getReachedEndings().size}/{ENDING_PARAGRAPH_IDS.length} концовок
              </span>
            )}
          </div>
        )}
      </div>

      {showAchievements && <AchievementsModal onClose={() => setShowAchievements(false)} />}
    </div>
  );
}