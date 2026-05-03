import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useGameStore, useCurrentParagraph, gameData } from '../engine/store';
import type { Choice, ConditionalChoice, GameStats, KeywordRecord } from '../engine/types';
import {
  checkAndUnlockAchievements,
  saveReachedEnding,
  ENDING_PARAGRAPH_IDS,
} from '../engine/achievements';
import type { AchievementContext } from '../engine/achievements';
import { PARAGRAPH_LOCATION_MAP, getVisitedLocations as getVisitedLocationsFromData } from '../engine/locations';
import { showToast, ToastContainer } from './ToastContainer';
import { StatsPanel } from './StatsPanel';
import { KeywordsPanel } from './KeywordsPanel';
import { SnowEffect } from './SnowEffect';
import { ProgressBar } from './ProgressBar';
import { TutorialTooltip } from './TutorialTooltip';
import { JournalButton } from './JournalButtons';
import { MapButton } from './JournalButtons';
import ParagraphIllustration from './ParagraphIllustration';
import { QuickSaveButton, QuickSaveModal } from './QuickSaveSlots';
import { AchievementsModal } from './AchievementsModal';
import { TextToSpeech } from './TextToSpeech';
import { playSound, SoundEffectsToggle } from './SoundEffects';
import { DynamicBackground, HealthVignette, VisualEffects } from './DynamicBackground';
import { LocationTransition, getLocationForParagraph } from './LocationTransition';
import { processParagraphText } from '../utils/textProcessing';
import { formatMedkits } from '../utils/i18n';
import { ChoiceCard, inferChoiceType } from './ChoiceCard';
import { SnowflakeDivider } from './SnowflakeDivider';
import { CriticalHealthOverlay } from './CriticalHealthOverlay';
import { FloatingActionButton } from './FloatingActionButton';
import { BottomSheet } from './BottomSheet';
import { FootnoteTooltip, findLoreTerms } from './FootnoteTooltip';
import { ReferenceModal } from './ReferenceModal';
import { DeathScreen } from './DeathScreen';
import { VictoryScreen } from './VictoryScreen';
import { EndingUnlock } from './EndingUnlock';

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
  const [keywordsSheetOpen, setKeywordsSheetOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const [locationTransition, setLocationTransition] = useState<{ targetParagraphId: number; fromParagraphId: number | null } | null>(null);
  const prevParagraphIdRef = useRef<number | null>(null);
  const choicesRef = useRef<HTMLDivElement>(null);

  // Check achievements on state change
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'victory') return;
    const paragraphsVisited = new Set(history.map(h => h.paragraphId));
    const visitedLocations = getVisitedLocationsFromData(paragraphsVisited);
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

  // Keyboard navigation for choices (8.5 — Tab + ArrowUp/Down to move, Enter to confirm)
  useEffect(() => {
    if (phase !== 'playing') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!choicesRef.current) return;
      const buttons = choicesRef.current.querySelectorAll<HTMLButtonElement>('button[data-choice-index]');
      if (buttons.length === 0) return;

      // Tab: cycle forward through choices (Shift+Tab backwards)
      if (e.key === 'Tab') {
        e.preventDefault();
        const focused = document.activeElement;
        const currentIndex = Array.from(buttons).indexOf(focused as HTMLButtonElement);
        let nextIndex: number;
        if (e.shiftKey) {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
        } else {
          nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
        }
        buttons[nextIndex].focus();
      }
      // ArrowUp/Down: also cycle
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
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
      // Enter: confirm the currently focused choice
      else if (e.key === 'Enter') {
        const focused = document.activeElement;
        if (Array.from(buttons).includes(focused as HTMLButtonElement)) {
          (focused as HTMLButtonElement).click();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase]);

  // 9.4 — Location transition: detect when current paragraph changes to a different location
  useEffect(() => {
    if (currentParagraph && prevParagraphIdRef.current !== null && prevParagraphIdRef.current !== currentParagraph.id) {
      const prevLoc = getLocationForParagraph(prevParagraphIdRef.current);
      const currLoc = getLocationForParagraph(currentParagraph.id);
      if (prevLoc !== currLoc && currLoc !== null) {
        setLocationTransition({ targetParagraphId: currentParagraph.id, fromParagraphId: prevParagraphIdRef.current });
      }
    }
    if (currentParagraph) {
      prevParagraphIdRef.current = currentParagraph.id;
    }
  }, [currentParagraph?.id]);

  const handleLocationTransitionComplete = useCallback(() => {
    setLocationTransition(null);
  }, []);

  // 9.6 — Track new ending for notification
  const [showEndingUnlock, setShowEndingUnlock] = useState(false);
  const [endingUnlockName, setEndingUnlockName] = useState<string | undefined>();
  useEffect(() => {
    if (phase === 'victory' && currentParagraph && ENDING_PARAGRAPH_IDS.includes(currentParagraph.id)) {
      // Check if this ending was just reached (it's in localStorage now from the save)
      // Show notification for any victory that's an ending
      setShowEndingUnlock(true);
      // Try to get a name for the ending — use paragraph title if available
      setEndingUnlockName(currentParagraph.title || undefined);
    }
  }, [phase, currentParagraph?.id]);

  if (phase === 'dead') {
    return (
      <>
        <DeathScreen />
      </>
    );
  }

  if (phase === 'victory') {
    return (
      <>
        <VictoryScreen />
        {showEndingUnlock && (
          <EndingUnlock
            endingName={endingUnlockName}
            onDismiss={() => setShowEndingUnlock(false)}
          />
        )}
      </>
    );
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
      <CriticalHealthOverlay />
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
      <div className="max-w-2xl lg:max-w-5xl mx-auto px-4 pt-2 relative z-10">
        <ProgressBar />
      </div>

      {/* 10A.6 — Two-column layout on desktop (>= 1024px) */}
      <div className="max-w-2xl lg:max-w-5xl mx-auto px-4 py-4 relative z-10 paragraph-enter" key={currentParagraph.id}>
        <div className="lg:flex lg:gap-8">
          {/* Left column — paragraph text (60% on desktop) */}
          <div className="lg:w-[60%]">
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

            {/* 9.3 — Paragraph header with decorative styling */}
            <div className="text-center mb-4 paragraph-header-enter" key={`header-${currentParagraph.id}`}>
              <span
                className="font-mono text-lg sm:text-xl font-bold"
                style={{ textShadow: '0 0 20px rgba(56, 189, 248, 0.5), 0 0 40px rgba(56, 189, 248, 0.2)', color: '#7dd3fc' }}
              >
                ¶ {currentParagraph.id}
              </span>
              {currentParagraph.title && (
                <span className="paragraph-title ml-2 text-ice-400 font-display text-base sm:text-lg">{currentParagraph.title}</span>
              )}
            </div>

            {/* AI Illustration */}
            <ParagraphIllustration paragraphId={currentParagraph.id} />

            {/* 10A.11 — Paragraph text with footnote tooltips */}
            <div className="space-y-4 mb-8">
              {(() => {
                const processed = processParagraphText(
                  currentParagraph.text,
                  keywords,
                  history.length <= 1
                );
                return processed.map((line, i) => {
                  const lineContent = line.fragments.map((frag, fi) => {
                    if (frag.isKeyword) {
                      return (
                        <span key={fi} className="keyword-highlight">
                          {frag.text}
                        </span>
                      );
                    }
                    // 10A.11 — Check for lore terms and add footnote tooltips
                    const segments = findLoreTerms(frag.text);
                    if (segments.length > 1 || (segments.length === 1 && segments[0].term)) {
                      return (
                        <span key={fi}>
                          {segments.map((seg, si) => {
                            if (seg.term && seg.definition) {
                              return (
                                <span key={si} className="inline">
                                  <span className="text-ice-300 border-b border-ice-600/40 border-dotted">{seg.text}</span>
                                  <FootnoteTooltip term={seg.term} definition={seg.definition} />
                                </span>
                              );
                            }
                            return <span key={si}>{seg.text}</span>;
                          })}
                        </span>
                      );
                    }
                    return <span key={fi}>{frag.text}</span>;
                  });

                  return (
                    <p
                      key={i}
                      className={`leading-relaxed text-base sm:text-lg font-serif ${
                        line.isQuote
                          ? 'quote-block'
                          : 'text-frost-200'
                      } ${line.hasDropCap ? 'drop-cap' : ''}`}
                    >
                      {lineContent}
                    </p>
                  );
                });
              })()}
            </div>

            {/* Effects info — only significant effects (8.5) */}
            {!readerMode && currentParagraph.effects.filter(isSignificantEffect).length > 0 && (
              <div className="mb-6 p-3 bg-frost-900/50 rounded border border-frost-800">
                <div className="text-frost-500 text-xs mb-1">Эффекты:</div>
                {currentParagraph.effects.filter(isSignificantEffect).map((e, i) => (
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

            {/* 10A.10 — Snowflake divider */}
            {availableChoices.length > 0 && <SnowflakeDivider />}

            {/* 10A.9 — Choice cards instead of plain buttons */}
            {availableChoices.length > 0 && (
              <div className="space-y-3" ref={choicesRef}>
                {availableChoices.map((choice, i) => {
                  const isConditionalChoice = currentParagraph.conditionalChoices.some(cc =>
                    cc.description === choice.description ||
                    cc.successParagraph === choice.paragraph ||
                    cc.hasParagraph === choice.paragraph
                  );
                  const choiceType = inferChoiceType(choice.description || '', isConditionalChoice);
                  return (
                    <ChoiceCard
                      key={i}
                      index={i}
                      description={choice.description || `Перейти к параграфу ${choice.paragraph}`}
                      type={choiceType}
                      onClick={() => {
                        playSound('click');
                        goToParagraph(choice.paragraph, choice.description);
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* No choices = dead end or stuck */}
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
                aria-label={`Использовать аптечку: +${gameData.metadata.medkitHeal} здоровья, осталось ${stats.medkits} ${formatMedkits(stats.medkits)}`}
              >
                Использовать аптечку (+{gameData.metadata.medkitHeal} здоровья) • Осталось: {stats.medkits} {formatMedkits(stats.medkits)}
              </button>
            )}

            {/* 10A.8 — On mobile, keywords panel goes into bottom sheet instead */}
            {!readerMode && (
              <div className="hidden lg:block">
                <KeywordsPanel />
              </div>
            )}

            {/* 10A.7 — Bottom toolbar replaced with inline buttons (non-FAB items) */}
            <div className="mt-8 flex items-center justify-between flex-wrap gap-2 lg:hidden">
              <div className="flex items-center gap-3 flex-wrap">
                <JournalButton onClick={() => setJournalOpen(true)} />
                <MapButton onClick={() => setMapOpen(true)} />
                <button
                  onClick={() => setReferenceOpen(true)}
                  className="text-frost-500 hover:text-frost-300 text-sm transition-colors flex items-center gap-2"
                  aria-label="Справочная информация"
                >
                  <span>📖</span>
                  <span>Справочник</span>
                </button>
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

          {/* 10A.6 — Right sidebar on desktop (40%) */}
          <div className="hidden lg:block lg:w-[40%]">
            <div className="sticky top-16 space-y-4">
              {/* Station map mini */}
              <div className="p-3 bg-frost-900/40 rounded border border-frost-800/50">
                <button
                  onClick={() => setMapOpen(true)}
                  className="text-frost-500 hover:text-frost-300 text-xs transition-colors flex items-center gap-2 mb-2"
                  aria-label="Открыть карту станции"
                >
                  <span>🗺️</span>
                  <span>Карта станции</span>
                </button>
                <div className="text-frost-600 text-xs">Нажмите для подробной карты</div>
              </div>

              {/* Keywords panel in sidebar */}
              {!readerMode && <KeywordsPanel />}

              {/* Effects panel in sidebar — only significant effects (8.5) */}
              {!readerMode && currentParagraph.effects.filter(isSignificantEffect).length > 0 && (
                <div className="p-3 bg-frost-900/40 rounded border border-frost-800/50">
                  <div className="text-frost-500 text-xs mb-1">Эффекты параграфа:</div>
                  {currentParagraph.effects.filter(isSignificantEffect).map((e, i) => (
                    <span key={i} className="text-sm mr-2">{formatEffect(e)}</span>
                  ))}
                </div>
              )}

              {/* 10A.13 — Station breathing indicator */}
              <div className="p-3 bg-frost-900/40 rounded border border-frost-800/50 station-breathe">
                <div className="text-frost-600 text-xs">Станция Ледхом</div>
                <div className="text-frost-500 text-xs mt-1">Температура за бортом: −30°C</div>
              </div>

              {/* Quick actions in sidebar */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setJournalOpen(true)}
                  className="text-frost-500 hover:text-frost-300 text-xs transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-frost-900/50"
                >
                  📜 Журнал
                </button>
                <button
                  onClick={() => setReferenceOpen(true)}
                  className="text-frost-500 hover:text-frost-300 text-xs transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-frost-900/50"
                >
                  📖 Справочник
                </button>
                <button
                  onClick={() => setSaveOpen(true)}
                  className="text-frost-500 hover:text-frost-300 text-xs transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-frost-900/50"
                >
                  💾 Сохранить
                </button>
                <button
                  onClick={() => setAchievementsOpen(true)}
                  className="text-frost-500 hover:text-frost-300 text-xs transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-frost-900/50"
                >
                  🏆 Ачивки
                </button>
                <button
                  onClick={resetGame}
                  className="text-frost-700 hover:text-frost-500 text-xs transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-frost-900/50"
                >
                  🔄 Заново
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 10A.7 — Floating Action Button (mobile) */}
      <div className="lg:hidden">
        <FloatingActionButton
          items={[
            { icon: '📜', label: 'Журнал', onClick: () => setJournalOpen(true), badge: history.length || undefined },
            { icon: '🗺️', label: 'Карта', onClick: () => setMapOpen(true) },
            { icon: '📖', label: 'Справочник', onClick: () => setReferenceOpen(true) },
            { icon: '💾', label: 'Сохранить', onClick: () => setSaveOpen(true) },
            { icon: '🏆', label: 'Ачивки', onClick: () => setAchievementsOpen(true) },
            { icon: '🔊', label: 'Озвучить', onClick: () => {}, active: false },
          ]}
        />
      </div>

      {/* 10A.8 — Bottom sheet for keywords on mobile */}
      <BottomSheet
        isOpen={keywordsSheetOpen}
        onClose={() => setKeywordsSheetOpen(false)}
        title="Ключевые слова и эффекты"
      >
        {!readerMode && <KeywordsPanel />}
        {!readerMode && currentParagraph.effects.filter(isSignificantEffect).length > 0 && (
          <div className="mt-3">
            <div className="text-frost-500 text-xs mb-1">Эффекты:</div>
            {currentParagraph.effects.filter(isSignificantEffect).map((e, i) => (
              <span key={i} className="text-sm mr-2">{formatEffect(e)}</span>
            ))}
          </div>
        )}
      </BottomSheet>

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
      {referenceOpen && <ReferenceModal onClose={() => setReferenceOpen(false)} />}

      {/* 9.4 — Location transition overlay */}
      {locationTransition && (
        <LocationTransition
          targetParagraphId={locationTransition.targetParagraphId}
          onComplete={handleLocationTransitionComplete}
        />
      )}
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

/**
 * Filter effects to only show significant ones.
 * Show: health changes (any value), |change| >= 2, medkit changes, set_health.
 * Hide: small stat changes like aura +1, agility −1.
 */
function isSignificantEffect(e: any): boolean {
  if (e.type === 'add_medkit' || e.type === 'remove_medkit' || e.type === 'use_medkit' || e.type === 'set_health') return true;
  if (e.stat === 'health') return true;
  if (Math.abs(e.value) >= 2) return true;
  return false;
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

// formatMedkits moved to utils/i18n.ts

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