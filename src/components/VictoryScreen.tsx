import { useState, useEffect, useMemo } from 'react';
import { useGameStore, useCurrentParagraph, gameData } from '../engine/store';
import { getReachedEndings, ENDING_PARAGRAPH_IDS, getUnlockedAchievements } from '../engine/achievements';
import { AchievementsModal } from './AchievementsModal';

/**
 * 9.6 — Improved Victory Screen with animated stat bars, cards, and ending counter.
 */
export function VictoryScreen() {
  const resetGame = useGameStore(s => s.resetGame);
  const history = useGameStore(s => s.history);
  const gameStartTime = useGameStore(s => s.gameStartTime);
  const currentParagraph = useCurrentParagraph();
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [newEnding, setNewEnding] = useState(false);
  const [barsVisible, setBarsVisible] = useState(false);

  // 9.6 — Snowflake/confetti particles
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 6,
      size: 4 + Math.random() * 8,
      type: Math.random() > 0.5 ? '❄' : '✦',
    }));
  }, []);

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

  // Check if this is a new ending
  useEffect(() => {
    if (currentParagraph && ENDING_PARAGRAPH_IDS.includes(currentParagraph.id)) {
      setNewEnding(true);
    }
  }, [currentParagraph?.id]);

  // Animated bars: reveal after short delay
  useEffect(() => {
    const timer = setTimeout(() => setBarsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Achievements
  const unlockedAchievements = getUnlockedAchievements();

  // Hint for endings
  const endingsHint = endingsCount === 1
    ? 'Попробуйте другие выборы, чтобы найти другие концовки!'
    : endingsCount < Math.floor(totalEndings / 2)
    ? 'Есть ещё неизведанные пути...'
    : null;

  // 9.6 — Stat bar data
  const statBars = useMemo(() => [
    { label: 'Здоровье', value: bestHealth, max: 40, icon: '❤️', color: 'from-red-500 to-red-400', bgColor: 'bg-red-950/40' },
    { label: 'Аура', value: bestAura, max: 20, icon: '🔮', color: 'from-amber-500 to-amber-400', bgColor: 'bg-amber-950/40' },
    { label: 'Ловкость', value: bestAgility, max: 10, icon: '⚡', color: 'from-yellow-500 to-yellow-400', bgColor: 'bg-yellow-950/40' },
    { label: 'Холодное оружие', value: bestMelee, max: 10, icon: '⚔️', color: 'from-orange-500 to-orange-400', bgColor: 'bg-orange-950/40' },
    { label: 'Стелс', value: bestStealth, max: 10, icon: '👁️', color: 'from-purple-500 to-purple-400', bgColor: 'bg-purple-950/40' },
  ], [bestHealth, bestAura, bestAgility, bestMelee, bestStealth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-frost-950 text-frost-100 px-4 relative overflow-hidden">
      {/* Victory particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {particles.map(p => (
          <div
            key={p.id}
            className="victory-particle"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              fontSize: `${p.size}px`,
              color: p.type === '❄' ? '#bae6fd' : '#fbbf24',
              textShadow: '0 0 4px rgba(56, 189, 248, 0.5)',
            }}
          >
            {p.type}
          </div>
        ))}
      </div>

      <div className="relative z-10 text-center w-full max-w-md">
        <div className="text-5xl sm:text-6xl mb-4 animate-bounce">❄️</div>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-ice-200 mb-4" style={{ textShadow: '0 0 30px rgba(56, 189, 248, 0.3)' }}>
          Победа!
        </h2>

        {/* New ending unlocked badge */}
        {newEnding && (
          <div className="mb-4 px-4 py-2 bg-ice-900/40 border border-ice-500/40 rounded-lg inline-flex items-center gap-2 animate-glow-pulse">
            <span className="text-lg">🔓</span>
            <span className="text-ice-200 text-sm font-serif">Новая концовка разблокирована!</span>
          </div>
        )}

        {currentParagraph && (
          <div className="max-w-md text-center mb-6">
            {currentParagraph.text.map((line, i) => (
              <p key={i} className="text-frost-300 leading-relaxed font-serif mb-3">{line}</p>
            ))}
          </div>
        )}

        {/* Statistics block */}
        <div className="bg-frost-900/50 border border-frost-800 rounded-xl p-4 sm:p-6 mb-4">
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

          {/* 9.6 — Animated stat bars with cards */}
          <div className="border-t border-frost-800 pt-3 space-y-2.5">
            <div className="text-frost-500 text-xs mb-2 text-center">Лучшие параметры за игру</div>
            {statBars.map((bar, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 p-2 rounded-lg ${bar.bgColor} border border-frost-800/30`}
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <span className="text-lg w-7 text-center flex-shrink-0">{bar.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-frost-300 text-xs font-medium">{bar.label}</span>
                    <span className="text-frost-200 text-xs font-bold">{bar.value}/{bar.max}</span>
                  </div>
                  <div className="h-2 bg-frost-800/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${bar.color} rounded-full transition-all duration-1000 ease-out`}
                      style={{
                        width: barsVisible ? `${bar.max > 0 ? Math.min(100, Math.round((bar.value / bar.max) * 100)) : 0}%` : '0%',
                        transitionDelay: `${i * 200}ms`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Endings tracking */}
        <div className="bg-frost-900/50 border border-frost-800 rounded-xl p-4 sm:p-6 mb-4">
          <h3 className="text-ice-300 font-serif text-sm font-bold mb-2 text-center">🔚 Концовки</h3>
          <div className="text-center">
            <div className="text-ice-200 text-xl font-bold">{endingsCount} из {totalEndings}</div>
            <div className="text-frost-500 text-xs mt-1">Найдено концовок</div>
            {/* Progress bar for endings */}
            <div className="mt-2 h-2 bg-frost-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-ice-700 to-ice-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: barsVisible ? `${totalEndings > 0 ? Math.round((endingsCount / totalEndings) * 100) : 0}%` : '0%' }}
              />
            </div>
            {endingsHint && (
              <div className="text-frost-400 text-xs mt-2 italic">💡 {endingsHint}</div>
            )}
          </div>
        </div>

        {/* Achievements */}
        {unlockedAchievements.size > 0 && (
          <div className="bg-frost-900/50 border border-frost-800 rounded-xl p-4 sm:p-6 mb-4">
            <h3 className="text-ice-300 font-serif text-sm font-bold mb-2 text-center">🏆 Достижения ({unlockedAchievements.size})</h3>
            <div className="flex justify-center gap-2 flex-wrap">
              {[...unlockedAchievements].map(id => {
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
          ❄️ Начать заново
        </button>

        {achievementsOpen && <AchievementsModal onClose={() => setAchievementsOpen(false)} />}
      </div>
    </div>
  );
}