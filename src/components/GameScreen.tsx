import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useGameStore, useCurrentParagraph, gameData } from '../engine/store';
import type { Choice, ConditionalChoice, GameStats, KeywordRecord } from '../engine/types';
import {
  checkAndUnlockAchievements,
  saveReachedEnding,
  getReachedEndings,
  ENDING_PARAGRAPH_IDS,
  getVisitedLocations,
  PARAGRAPH_LOCATION_MAP,
  getUnlockedAchievements,
} from '../engine/achievements';
import type { AchievementContext } from '../engine/achievements';
import { showToast, ToastContainer } from './ToastContainer';
import { StatsPanel } from './StatsPanel';
import { KeywordsPanel } from './KeywordsPanel';
import { SnowEffect } from './SnowEffect';
import { ProgressBar } from './ProgressBar';
import { TutorialTooltip } from './TutorialTooltip';
import { JournalButton } from './JournalButtons';
import { MapButton } from './JournalButtons';
import { QuickSaveButton, QuickSaveModal } from './QuickSaveSlots';
import { AchievementsModal } from './AchievementsModal';
import { TextToSpeech } from './TextToSpeech';
import { playSound, SoundEffectsToggle } from './SoundEffects';
import { DynamicBackground, HealthVignette, VisualEffects } from './DynamicBackground';

// Lazy-loaded heavy modals — reduces initial bundle size
const JournalModal = lazy(() => import('./JournalModal').then(m => ({ default: m.JournalModal })));
const StationMap = lazy(() => import('./StationMap').then(m => ({ default: m.StationMap })));

function ModalSuspense() {
  return (
    <div className="fixed inset-0 z-[59] flex items-center justify-center bg-frost-950/80 backdrop-blur-sm">
      <div className="text-frost-400 text-sm animate-pulse">Загрузка…</div>
    </div>
  );
}

export function GameScreen() {
  const currentParagraph = useCurrentParagraph();
  const stats = useGameStore(s => s.stats);
  const keywords = useGameStore(s => s.keywords);
  const goToParagraph = useGameStore(s => s.goToParagraph);
  const goBackInHistory = useGameStore(s => s.goBackInHistory);
  const useMedkit = useGameStore(s => s.useMedkit);
  const resetGame = useGameStore(s => s.resetGame);
  const phase = useGameStore(s => s.phase);
  const history = useGameStore(s => s.history);
  const readerMode = useGameStore(s => s.readerMode);
  const toggleReaderMode = useGameStore(s => s.toggleReaderMode);
  const [journalOpen, setJournalOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const choicesRef = useRef<HTMLDivElement>(null);

  // Check achievements on state change
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'victory') return;
    const paragraphsVisited = new Set(history.map(h => h.paragraphId));
    const visitedLocations = getVisitedLocations(paragraphsVisited);
    const ctx: AchievementContext = {
      paragraphsVisited,
      totalParagraphs: gameData.paragraphs.length,
      stats,
      keywords: keywords.map(k => k.word),
      historyLength: history.length,
      visitedLocations,
      totalLocations: Object.keys(PARAGRAPH_LOCATION_MAP).length,
    };
    const newAchievements = checkAndUnlockAchievements(ctx);
    for (const a of newAchievements) {
      showToast(a.icon, `Ачивка: ${a.name}`, a.description);
    }
  }, [phase, history.length, stats, keywords]);

  // Sound effects for state changes
  const prevStatsRef = useRef(stats);
  const prevKeywordsRef = useRef(keywords);
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    // Death sound
    if (phase === 'dead' && prevPhaseRef.current !== 'dead') {
      playSound('death');
    }
    // Victory sound
    if (phase === 'victory' && prevPhaseRef.current !== 'victory') {
      playSound('victory');
    }
    // Damage
    if (stats.health < prevStatsRef.current.health) {
      playSound('damage');
    }
    // Keyword gained
    if (keywords.length > prevKeywordsRef.current.length) {
      playSound('keyword');
    }
    // Medkit use
    if (stats.health > prevStatsRef.current.health && stats.medkits < prevStatsRef.current.medkits) {
      playSound('medkit');
    }
    prevStatsRef.current = stats;
    prevKeywordsRef.current = keywords;
    prevPhaseRef.current = phase;
  }, [phase, stats, keywords]);

  // Tutorial hints
  useEffect(() => {
    if (phase !== 'playing') return;
    const current = currentParagraph;
    if (!current) return;

    // First keyword
    if (current.keywords.length > 0 && !activeTutorial) {
      setActiveTutorial('first-keyword');
    }
    // First effect
    if (current.effects.length > 0 && !activeTutorial) {
      setActiveTutorial('first-effect');
    }
    // First conditional choice
    if (current.conditionalChoices.length > 0 && !activeTutorial) {
      setActiveTutorial('first-conditional');
    }
    // First medkit
    if (stats.medkits > 0 && stats.health < stats.maxHealth && !activeTutorial) {
      setActiveTutorial('first-medkit');
    }
  }, [phase, currentParagraph?.id]);

  // Track endings
  useEffect(() => {
    if (phase === 'victory' && currentParagraph) {
      if (ENDING_PARAGRAPH_IDS.includes(currentParagraph.id)) {
        saveReachedEnding(currentParagraph.id);
      }
    }
  }, [phase, currentParagraph?.id]);

  // Keyboard navigation for choices
  useEffect(() => {
    if (phase !== 'playing') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!choicesRef.current) return;
      const buttons = choicesRef.current.querySelectorAll<HTMLButtonElement>('button[data-choice-index]');
      if (buttons.length === 0) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const focused = document.activeElement;
        const currentIndex = Array.from(buttons).indexOf(focused as HTMLButtonElement);
        let nextIndex: number;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
        }
        buttons[nextIndex].focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase]);

  if (phase === 'dead') {
    return <DeathScreen />;
  }

  if (phase === 'victory') {
    return <VictoryScreen />;
  }

  if (!currentParagraph) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-frost-950 text-frost-100">
        <p>Параграф не найден</p>
      </div>
    );
  }

  // Resolve available choices — in reader mode, all choices are visible
  const availableChoices = readerMode
    ? resolveChoicesReaderMode(currentParagraph.choices, currentParagraph.conditionalChoices)
    : resolveChoices(currentParagraph.choices, currentParagraph.conditionalChoices, stats, keywords);

  // Can go back?
  const canGoBack = history.length > 1;

  return (
    <div className="min-h-screen bg-frost-950 text-frost-100 relative">
      <DynamicBackground />
      <SnowEffect />
      <HealthVignette />
      <VisualEffects />
      <ToastContainer />

      {/* Reader mode banner */}
      {readerMode && (
        <div className="bg-amber-900/50 border-b border-amber-700/50 text-amber-200 text-center py-1 text-xs sm:text-sm relative z-20">
          📖 Режим читателя — механика отключена
        </div>
      )}

      {/* Top stats bar — hidden in reader mode */}
      {!readerMode && (
        <div className="relative z-10">
          <StatsPanel />
        </div>
      )}

      {/* Progress bar */}
      <div className="max-w-2xl mx-auto px-4 pt-2 relative z-10">
        <ProgressBar />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 relative z-10 paragraph-enter" key={currentParagraph.id}>
        {/* Toolbar: undo + TTS + SFX + reader mode */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            {canGoBack && (
              <button
                onClick={() => goBackInHistory(history.length - 2)}
                className="flex items-center gap-1.5 text-frost-500 hover:text-ice-300 text-sm transition-colors"
                aria-label="Вернуться на шаг назад"
              >
                <span>↩️</span>
                <span>Назад</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <TextToSpeech text={currentParagraph.text} />
            <SoundEffectsToggle />
            <button
              onClick={toggleReaderMode}
              className={`text-sm transition-colors flex items-center gap-1.5 px-2 py-1 rounded hover:bg-frost-900/50 ${
                readerMode ? 'text-amber-300' : 'text-frost-500 hover:text-frost-300'
              }`}
              title={readerMode ? 'Выйти из режима читателя' : 'Режим читателя'}
              aria-label={readerMode ? 'Выйти из режима читателя' : 'Включить режим читателя'}
            >
              <span>📖</span>
              <span className="hidden sm:inline">{readerMode ? 'Читатель' : 'Читатель'}</span>
            </button>
          </div>
        </div>

        {/* Tutorial hint */}
        {activeTutorial && !readerMode && <TutorialTooltip hintId={activeTutorial} />}

        {/* Paragraph number */}
        {currentParagraph.title && (
          <div className="text-center mb-6">
            <span className="text-ice-500 font-mono text-sm">¶ {currentParagraph.id}</span>
          </div>
        )}

        {/* Paragraph text */}
        <div className="space-y-4 mb-8">
          {currentParagraph.text.map((line, i) => (
            <p key={i} className="text-frost-200 leading-relaxed text-base sm:text-lg font-serif">
              {line}
            </p>
          ))}
        </div>

        {/* Effects info */}
        {!readerMode && currentParagraph.effects.length > 0 && (
          <div className="mb-6 p-3 bg-frost-900/50 rounded border border-frost-800">
            <div className="text-frost-500 text-xs mb-1">Эффекты:</div>
            {currentParagraph.effects.map((e, i) => (
              <span key={i} className="text-sm mr-2">
                {formatEffect(e)}
              </span>
            ))}
          </div>
        )}

        {/* Keywords gained */}
        {currentParagraph.keywords.length > 0 && (
          <div className="mb-6 p-3 bg-frost-900/50 rounded border border-ice-900/50 animate-glow-pulse">
            <div className="text-ice-500 text-xs mb-1">Ключевые слова записаны:</div>
            {currentParagraph.keywords.map((kw, i) => (
              <span key={i} className="text-ice-300 text-sm mr-3">«{kw}»</span>
            ))}
          </div>
        )}

        {/* Choices */}
        {availableChoices.length > 0 && (
          <div className="space-y-3 mt-8" ref={choicesRef}>
            {availableChoices.map((choice, i) => (
              <button
                key={i}
                onClick={() => {
                  playSound('click');
                  goToParagraph(choice.paragraph, choice.description);
                }}
                className="w-full text-left px-4 py-3 sm:px-5 sm:py-4 bg-frost-900/60 hover:bg-ice-900/40 border border-frost-800 hover:border-ice-700 rounded-lg transition-all duration-200 group choice-btn focus:outline-none focus:ring-2 focus:ring-ice-600 focus:ring-offset-2 focus:ring-offset-frost-950"
                data-choice-index={i}
                aria-label={`Выбор: ${choice.description || `Перейти к параграфу ${choice.paragraph}`}`}
              >
                <span className="text-frost-300 group-hover:text-ice-200 text-base sm:text-lg font-serif">
                  {choice.description || `Перейти к параграфу ${choice.paragraph}`}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* No choices = dead end or stuck - show back button */}
        {availableChoices.length === 0 && currentParagraph.text.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-frost-500 italic font-serif mb-3">
              {currentParagraph.effects.some(e => e.type === 'set_health') ? 'Ваша история окончена...' : 'Нет доступных путей дальше.'}
            </p>
            {history.length > 1 && (
              <button
                onClick={() => goBackInHistory(history.length - 2)}
                className="px-4 py-2 bg-frost-800 hover:bg-frost-700 text-frost-200 rounded-lg text-sm transition-colors"
                aria-label="Вернуться на шаг назад"
              >
                ↩️ Вернуться назад
              </button>
            )}
          </div>
        )}

        {/* Medkit button */}
        {!readerMode && stats.medkits > 0 && stats.health < stats.maxHealth && (
          <button
            onClick={useMedkit}
            className="mt-6 w-full px-4 py-3 bg-success/10 hover:bg-success/20 border border-success/30 text-success rounded-lg transition-colors text-sm"
            aria-label={`Использовать аптечку: +${gameData.metadata.medkitHeal} здоровья, осталось ${stats.medkits}`}
          >
            Использовать аптечку (+{gameData.metadata.medkitHeal} здоровья) • Осталось: {stats.medkits} {formatMedkits(stats.medkits)}
          </button>
        )}

        {/* Keywords panel (collapsible) — hidden in reader mode */}
        {!readerMode && <KeywordsPanel />}

        {/* Journal + Map + Save + Achievements + Reset */}
        <div className="mt-8 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <JournalButton onClick={() => setJournalOpen(true)} />
            <MapButton onClick={() => setMapOpen(true)} />
            <QuickSaveButton onClick={() => setSaveOpen(true)} />
            <button
              onClick={() => setAchievementsOpen(true)}
              className="text-frost-500 hover:text-frost-300 text-sm transition-colors flex items-center gap-2"
              aria-label="Достижения"
            >
              <span>🏆</span>
              <span>Ачивки</span>
            </button>
          </div>
          <button
            onClick={resetGame}
            className="text-frost-700 hover:text-frost-500 text-xs transition-colors"
            aria-label="Начать заново"
          >
            Начать заново
          </button>
        </div>
      </div>

      {/* Modals (lazy-loaded) */}
      {journalOpen && (
        <Suspense fallback={<ModalSuspense />}>
          <JournalModal onClose={() => setJournalOpen(false)} />
        </Suspense>
      )}
      {mapOpen && (
        <Suspense fallback={<ModalSuspense />}>
          <StationMap onClose={() => setMapOpen(false)} />
        </Suspense>
      )}
      {saveOpen && <QuickSaveModal onClose={() => setSaveOpen(false)} />}
      {achievementsOpen && <AchievementsModal onClose={() => setAchievementsOpen(false)} />}
    </div>
  );
}

function DeathScreen() {
  const resetGame = useGameStore(s => s.resetGame);
  const history = useGameStore(s => s.history);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-frost-950 text-frost-100 px-4">
      <DynamicBackground />
      <HealthVignette />
      <div className="text-5xl sm:text-6xl mb-4">💀</div>
      <h2 className="text-3xl sm:text-4xl font-serif font-bold text-danger mb-4">Вы погибли</h2>
      <p className="text-frost-400 mb-2 text-sm sm:text-base">Здоровье упало до нуля.</p>
      <p className="text-frost-500 text-xs sm:text-sm mb-6 sm:mb-8">Пройдено параграфов: {history.length}</p>
      
      <button
        onClick={resetGame}
        className="px-6 sm:px-8 py-3 bg-ice-800 hover:bg-ice-700 text-ice-100 rounded-lg text-base sm:text-lg transition-all duration-300"
        aria-label="Начать заново"
      >
        Начать заново
      </button>
    </div>
  );
}

function VictoryScreen() {
  const resetGame = useGameStore(s => s.resetGame);
  const history = useGameStore(s => s.history);
  const stats = useGameStore(s => s.stats);
  const gameStartTime = useGameStore(s => s.gameStartTime);
  const currentParagraph = useCurrentParagraph();
  const [achievementsOpen, setAchievementsOpen] = useState(false);

  // Statistics
  const paragraphsVisited = new Set(history.map(h => h.paragraphId)).size;
  const totalParagraphs = gameData.paragraphs.length;
  const explorationPct = totalParagraphs > 0 ? Math.round((paragraphsVisited / totalParagraphs) * 100) : 0;
  
  const bestHealth = Math.max(...history.map(h => h.statsSnapshot?.health ?? 0));
  const bestAura = Math.max(...history.map(h => h.statsSnapshot?.aura ?? 0));
  const bestAgility = Math.max(...history.map(h => h.statsSnapshot?.agility ?? 0));
  const bestMelee = Math.max(...history.map(h => h.statsSnapshot?.melee ?? 0));
  const bestStealth = Math.max(...history.map(h => h.statsSnapshot?.stealth ?? 0));

  const playTimeMs = gameStartTime ? Date.now() - gameStartTime : 0;
  const playMinutes = Math.floor(playTimeMs / 60000);
  const playHours = Math.floor(playMinutes / 60);
  const playTimeStr = playHours > 0
    ? `${playHours}ч ${playMinutes % 60}мин`
    : `${playMinutes} мин`;

  // Endings tracking
  const reachedEndings = getReachedEndings();
  const totalEndings = ENDING_PARAGRAPH_IDS.length;
  const endingsCount = reachedEndings.size;

  // Achievements
  const unlockedAchievements = getUnlockedAchievements();

  // Hint for endings
  const endingsHint = endingsCount === 1
    ? 'Попробуйте другие выборы, чтобы найти другие концовки!'
    : endingsCount < Math.floor(totalEndings / 2)
    ? 'Есть ещё неизведанные пути...'
    : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-frost-950 text-frost-100 px-4">
      <DynamicBackground />
      <ToastContainer />
      <div className="text-5xl sm:text-6xl mb-4">❄️</div>
      <h2 className="text-3xl sm:text-4xl font-serif font-bold text-ice-200 mb-4">Победа!</h2>
      {currentParagraph && (
        <div className="max-w-md text-center mb-6">
          {currentParagraph.text.map((line, i) => (
            <p key={i} className="text-frost-300 leading-relaxed font-serif mb-3">{line}</p>
          ))}
        </div>
      )}
      
      {/* Statistics block */}
      <div className="bg-frost-900/50 border border-frost-800 rounded-xl p-4 sm:p-6 mb-4 max-w-sm w-full">
        <h3 className="text-ice-300 font-serif text-sm font-bold mb-3 text-center">📊 Статистика прохождения</h3>
        <div className="grid grid-cols-2 gap-3 text-center mb-3">
          <div>
            <div className="text-ice-200 text-xl font-bold">{history.length}</div>
            <div className="text-frost-500 text-xs">Шагов</div>
          </div>
          <div>
            <div className="text-ice-200 text-xl font-bold">{paragraphsVisited}/{totalParagraphs}</div>
            <div className="text-frost-500 text-xs">Параграфов ({explorationPct}%)</div>
          </div>
          <div>
            <div className="text-ice-200 text-xl font-bold">{playTimeStr}</div>
            <div className="text-frost-500 text-xs">Время игры</div>
          </div>
          <div>
            <div className="text-ice-200 text-xl font-bold">❤️{bestHealth}</div>
            <div className="text-frost-500 text-xs">Макс. здоровье</div>
          </div>
        </div>
        <div className="border-t border-frost-800 pt-2">
          <div className="text-frost-500 text-xs mb-1 text-center">Лучшие параметры за игру</div>
          <div className="flex justify-center gap-4 text-frost-400 text-sm">
            <span>🔮{bestAura}</span>
            <span>⚡{bestAgility}</span>
            <span>⚔️{bestMelee}</span>
            <span>👁️{bestStealth}</span>
          </div>
          <div className="flex justify-center gap-3 mt-2 text-frost-500 text-xs">
            <span>❤️ финал: {stats.health}</span>
            <span>🔮 финал: {stats.aura}</span>
            <span>⚡ финал: {stats.agility}</span>
          </div>
        </div>
      </div>

      {/* Endings tracking */}
      <div className="bg-frost-900/50 border border-frost-800 rounded-xl p-4 sm:p-6 mb-4 max-w-sm w-full">
        <h3 className="text-ice-300 font-serif text-sm font-bold mb-2 text-center">🔚 Концовки</h3>
        <div className="text-center">
          <div className="text-ice-200 text-xl font-bold">{endingsCount} из {totalEndings}</div>
          <div className="text-frost-500 text-xs mt-1">Найдено концовок</div>
          {/* Progress bar for endings */}
          <div className="mt-2 h-1.5 bg-frost-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-ice-700 to-ice-400 rounded-full transition-all duration-500"
              style={{ width: `${totalEndings > 0 ? Math.round((endingsCount / totalEndings) * 100) : 0}%` }}
            />
          </div>
          {endingsHint && (
            <div className="text-frost-400 text-xs mt-2 italic">💡 {endingsHint}</div>
          )}
        </div>
      </div>

      {/* Achievements on victory screen */}
      {unlockedAchievements.size > 0 && (
        <div className="bg-frost-900/50 border border-frost-800 rounded-xl p-4 sm:p-6 mb-4 max-w-sm w-full">
          <h3 className="text-ice-300 font-serif text-sm font-bold mb-2 text-center">🏆 Достижения ({unlockedAchievements.size})</h3>
          <div className="flex justify-center gap-2 flex-wrap">
            {[...unlockedAchievements].map(id => {
              // Find achievement data
              const a = [
                { id: 'explorer', icon: '🗺️', name: 'Исследователь' },
                { id: 'conqueror', icon: '👑', name: 'Покоритель' },
                { id: 'peacemaker', icon: '🕊️', name: 'Миротворец' },
                { id: 'warrior', icon: '⚔️', name: 'Воин' },
                { id: 'speedrun', icon: '⚡', name: 'Скоростной бег' },
                { id: 'discoverer', icon: '🧭', name: 'Первооткрыватель' },
                { id: 'survivor', icon: '💀', name: 'Выживший' },
                { id: 'healer', icon: '✨', name: 'Целитель' },
              ].find(x => x.id === id);
              return a ? (
                <span key={id} className="text-2xl" title={a.name}>{a.icon}</span>
              ) : null;
            })}
          </div>
          <div className="text-center mt-2">
            <button
              onClick={() => setAchievementsOpen(true)}
              className="text-frost-500 hover:text-frost-300 text-xs transition-colors"
            >
              Все ачивки →
            </button>
          </div>
        </div>
      )}
      
      <button
        onClick={resetGame}
        className="px-6 sm:px-8 py-3 bg-ice-800 hover:bg-ice-700 text-ice-100 rounded-lg text-base sm:text-lg transition-all duration-300"
        aria-label="Начать заново"
      >
        Начать заново
      </button>

      {achievementsOpen && <AchievementsModal onClose={() => setAchievementsOpen(false)} />}
    </div>
  );
}

function resolveChoices(
  choices: Choice[],
  conditionalChoices: ConditionalChoice[],
  stats: GameStats,
  keywords: KeywordRecord[]
): Choice[] {
  const result: Choice[] = [];

  // Regular choices
  for (const choice of choices) {
    result.push(choice);
  }

  // Conditional choices - resolve them
  for (const cc of conditionalChoices) {
    switch (cc.type) {
      case 'stat_check': {
        if (cc.stat && cc.threshold !== undefined) {
          const value = (stats as any)[cc.stat] ?? 0;
          const passes = value >= cc.threshold;
          const targetParagraph = passes ? cc.successParagraph : cc.failParagraph;
          if (targetParagraph) {
            result.push({
              paragraph: targetParagraph,
              description: cc.description || (passes
                ? `Ваша ${statName(cc.stat).toLowerCase()} позволяет пройти`
                : `${statName(cc.stat)} не хватает — другой путь`),
            });
          }
        }
        break;
      }
      case 'keyword_check': {
        if (cc.keyword) {
          const has = keywords.some(k => k.word === cc.keyword && k.count > 0);
          if (has && cc.hasParagraph != null) {
            result.push({
              paragraph: cc.hasParagraph,
              description: cc.description || `Есть «${cc.keyword}»`,
            });
          } else if (!has && cc.missingParagraph != null) {
            result.push({
              paragraph: cc.missingParagraph,
              description: cc.description || `Нет «${cc.keyword}»`,
            });
          }
        }
        break;
      }
      case 'any_keyword_check': {
        if (cc.keywords) {
          const hasAny = cc.keywords.some(kw => keywords.some(k => k.word === kw && k.count > 0));
          const targetParagraph = hasAny ? cc.hasParagraph : cc.missingParagraph;
          if (targetParagraph) {
            result.push({
              paragraph: targetParagraph,
              description: cc.description || (hasAny
                ? 'Есть нужное ключевое слово'
                : 'Нет нужных ключевых слов — другой путь'),
            });
          }
        }
        break;
      }
      case 'multi_stat_check': {
        if (cc.conditions) {
          const passes = cc.conditions.every(c => {
            const value = (stats as any)[c.stat] ?? 0;
            if (c.operator === 'gte') return value >= c.threshold;
            if (c.operator === 'lte') return value <= c.threshold;
            if (c.operator === 'eq') return value === c.threshold;
            return false;
          });
          const targetParagraph = passes ? cc.successParagraph : cc.failParagraph;
          if (targetParagraph) {
            result.push({
              paragraph: targetParagraph,
              description: cc.description || (passes ? 'Условия выполнены' : 'Условия не выполнены — другой путь'),
            });
          }
        }
        break;
      }
      case 'visit_check': {
        if (cc.visitedParagraph != null) {
          result.push({
            paragraph: cc.visitedParagraph,
            description: cc.description ? `Вы ${cc.description}` : `Вы были там`,
          });
        }
        if (cc.notVisitedParagraph != null) {
          result.push({
            paragraph: cc.notVisitedParagraph,
            description: cc.description ? `Вы не ${cc.description}` : `Вы не были там`,
          });
        }
        break;
      }
      case 'dual_stat_check': {
        if (cc.stat1 && cc.threshold1 !== undefined && cc.stat2 && cc.threshold2 !== undefined) {
          const val1 = (stats as any)[cc.stat1] ?? 0;
          const val2 = (stats as any)[cc.stat2] ?? 0;
          const passes = val1 >= cc.threshold1! && val2 >= cc.threshold2!;
          const targetParagraph = passes ? cc.successParagraph : cc.failParagraph;
          if (targetParagraph) {
            result.push({
              paragraph: targetParagraph,
              description: cc.description || (passes
                ? 'Характеристики позволяют действовать'
                : 'Не хватает сил — другой путь'),
            });
          }
        }
        break;
      }
      case 'medkit_choice': {
        if (cc.helpParagraph != null) {
          result.push({
            paragraph: cc.helpParagraph,
            description: 'Использовать аптечку',
          });
        }
        if (cc.refuseParagraph != null) {
          result.push({
            paragraph: cc.refuseParagraph,
            description: 'Не использовать аптечку',
          });
        }
        break;
      }
      case 'optional_action': {
        if (cc.yesParagraph != null) {
          result.push({
            paragraph: cc.yesParagraph,
            description: cc.description || 'Действовать',
          });
        }
        if (cc.noParagraph != null) {
          result.push({
            paragraph: cc.noParagraph,
            description: cc.description ? `Не ${cc.description}` : 'Пропустить',
          });
        }
        break;
      }
      case 'state_check': {
        if (cc.paragraph != null) {
          result.push({
            paragraph: cc.paragraph,
            description: cc.description || 'Продолжить',
          });
        }
        break;
      }
      case 'scenario_check': {
        if (cc.paragraph != null) {
          result.push({
            paragraph: cc.paragraph,
            description: cc.description || 'Сценарий',
          });
        }
        break;
      }
      case 'stat_and_keyword_count_check': {
        const statVal = (stats as any)[cc.stat ?? ''] ?? 0;
        const kwRecord = keywords.find(k => k.word === (cc.keyword ?? '').toLowerCase());
        const kwCount = kwRecord?.count ?? 0;
        const passes = statVal >= (cc.statThreshold ?? Infinity) && kwCount >= (cc.keywordMinCount ?? Infinity);
        const targetParagraph = passes ? cc.successParagraph : cc.failParagraph;
        if (targetParagraph) {
          result.push({
            paragraph: targetParagraph,
            description: cc.description || (passes
              ? 'Условия выполнены'
              : 'Условия не выполнены — другой путь'),
          });
        }
        break;
      }
      case 'multi_keyword_branch': {
        const hasAnyBranch = cc.branches?.some(b => keywords.some(k => k.word === b.keyword.toLowerCase() && k.count > 0));
        if (cc.branches) {
          for (const branch of cc.branches) {
            const has = keywords.some(k => k.word === branch.keyword.toLowerCase() && k.count > 0);
            if (has) {
              result.push({
                paragraph: branch.paragraph,
                description: `Есть «${branch.keyword}»`,
              });
            }
          }
        }
        if (cc.noneParagraph != null && !hasAnyBranch) {
          result.push({
            paragraph: cc.noneParagraph,
            description: 'Продолжить',
          });
        }
        break;
      }
    }
  }

  // Deduplicate by paragraph
  const seen = new Set<number>();
  return result.filter(c => {
    if (seen.has(c.paragraph)) return false;
    seen.add(c.paragraph);
    return true;
  });
}

function statName(stat: string): string {
  const names: Record<string, string> = {
    health: 'Здоровье',
    aura: 'Аура',
    agility: 'Ловкость',
    melee: 'Холодное оружие',
    stealth: 'Стелс',
    medkits: 'Аптечки',
  };
  return names[stat] || stat;
}

function statIcon(stat: string): string {
  const icons: Record<string, string> = {
    health: '❤️',
    aura: '🔮',
    agility: '⚡',
    melee: '⚔️',
    stealth: '👁️',
    medkits: '🩹',
  };
  return icons[stat] || '';
}

function formatEffect(e: any): string {
  if (e.type === 'add_medkit') return `+${e.value} ${formatMedkits(e.value)}`;
  if (e.type === 'remove_medkit') return `−${e.value} ${formatMedkits(e.value)}`;
  if (e.type === 'use_medkit') return `Использована ${formatMedkits(e.value)}`;
  if (e.type === 'decrease') return `${statIcon(e.stat)} −${e.value}`;
  if (e.type === 'increase') return `${statIcon(e.stat)} +${e.value}`;
  if (e.type === 'set_health') return `❤️ = ${e.value}`;
  return `${e.type}: ${JSON.stringify(e)}`;
}

function formatMedkits(count: number): string {
  if (count === 1) return 'аптечка';
  if (count >= 2 && count <= 4) return 'аптечки';
  return 'аптечек';
}

/**
 * In reader mode, all conditional choices are shown as regular choices.
 * No stat checks, no keyword requirements, no death.
 * Both success and fail branches are shown.
 */
function resolveChoicesReaderMode(
  choices: Choice[],
  conditionalChoices: ConditionalChoice[],
): Choice[] {
  const result: Choice[] = [];

  // Regular choices
  for (const choice of choices) {
    result.push(choice);
  }

  // Conditional choices - show both branches
  for (const cc of conditionalChoices) {
    switch (cc.type) {
      case 'stat_check': {
        if (cc.successParagraph != null) {
          result.push({
            paragraph: cc.successParagraph,
            description: cc.description || `Проверка ${statName(cc.stat || '').toLowerCase()}`,
          });
        }
        if (cc.failParagraph != null) {
          result.push({
            paragraph: cc.failParagraph,
            description: cc.description ? `${cc.description} (неудача)` : `Не удалось — другой путь`,
          });
        }
        break;
      }
      case 'keyword_check': {
        if (cc.hasParagraph != null) {
          result.push({
            paragraph: cc.hasParagraph,
            description: cc.description || `Есть «${cc.keyword}»`,
          });
        }
        if (cc.missingParagraph != null) {
          result.push({
            paragraph: cc.missingParagraph,
            description: cc.description ? `Без «${cc.keyword}»` : `Нет «${cc.keyword}»`,
          });
        }
        break;
      }
      case 'any_keyword_check': {
        if (cc.hasParagraph != null) {
          result.push({
            paragraph: cc.hasParagraph,
            description: cc.description || 'Есть нужное ключевое слово',
          });
        }
        if (cc.missingParagraph != null) {
          result.push({
            paragraph: cc.missingParagraph,
            description: cc.description || 'Без ключевых слов',
          });
        }
        break;
      }
      case 'multi_stat_check': {
        if (cc.successParagraph != null) {
          result.push({
            paragraph: cc.successParagraph,
            description: cc.description || 'Условия выполнены',
          });
        }
        if (cc.failParagraph != null) {
          result.push({
            paragraph: cc.failParagraph,
            description: cc.description ? `${cc.description} (неудача)` : 'Условия не выполнены',
          });
        }
        break;
      }
      case 'visit_check': {
        if (cc.visitedParagraph != null) {
          result.push({
            paragraph: cc.visitedParagraph,
            description: cc.description || 'Вы были там',
          });
        }
        if (cc.notVisitedParagraph != null) {
          result.push({
            paragraph: cc.notVisitedParagraph,
            description: cc.description ? `Не ${cc.description}` : 'Вы не были там',
          });
        }
        break;
      }
      case 'dual_stat_check': {
        if (cc.successParagraph != null) {
          result.push({
            paragraph: cc.successParagraph,
            description: cc.description || 'Характеристики позволяют',
          });
        }
        if (cc.failParagraph != null) {
          result.push({
            paragraph: cc.failParagraph,
            description: cc.description ? `${cc.description} (неудача)` : 'Не хватает сил',
          });
        }
        break;
      }
      case 'medkit_choice': {
        if (cc.helpParagraph != null) {
          result.push({
            paragraph: cc.helpParagraph,
            description: 'Использовать аптечку',
          });
        }
        if (cc.refuseParagraph != null) {
          result.push({
            paragraph: cc.refuseParagraph,
            description: 'Не использовать аптечку',
          });
        }
        break;
      }
      case 'optional_action': {
        if (cc.yesParagraph != null) {
          result.push({
            paragraph: cc.yesParagraph,
            description: cc.description || 'Действовать',
          });
        }
        if (cc.noParagraph != null) {
          result.push({
            paragraph: cc.noParagraph,
            description: cc.description ? `Не ${cc.description}` : 'Пропустить',
          });
        }
        break;
      }
      case 'state_check':
      case 'scenario_check': {
        if (cc.paragraph != null) {
          result.push({
            paragraph: cc.paragraph,
            description: cc.description || 'Продолжить',
          });
        }
        break;
      }
      case 'stat_and_keyword_count_check': {
        if (cc.successParagraph != null) {
          result.push({
            paragraph: cc.successParagraph,
            description: cc.description || 'Условия выполнены',
          });
        }
        if (cc.failParagraph != null) {
          result.push({
            paragraph: cc.failParagraph,
            description: cc.description ? `${cc.description} (неудача)` : 'Условия не выполнены',
          });
        }
        break;
      }
      case 'multi_keyword_branch': {
        if (cc.branches) {
          for (const branch of cc.branches) {
            result.push({
              paragraph: branch.paragraph,
              description: `«${branch.keyword}»`,
            });
          }
        }
        if (cc.noneParagraph != null) {
          result.push({
            paragraph: cc.noneParagraph,
            description: 'Продолжить',
          });
        }
        break;
      }
    }
  }

  // Deduplicate by paragraph
  const seen = new Set<number>();
  return result.filter(c => {
    if (seen.has(c.paragraph)) return false;
    seen.add(c.paragraph);
    return true;
  });
}