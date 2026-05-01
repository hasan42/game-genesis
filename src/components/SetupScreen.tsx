import { useGameStore } from '../engine/store';
import { gameData } from '../engine/store';

const STAT_NAMES: Record<string, string> = {
  agility: 'Ловкость',
  melee: 'Холодное оружие',
  stealth: 'Стелс',
};

const STAT_DESCRIPTIONS: Record<string, string> = {
  agility: 'Умение двигаться, преодолевать препятствия, общая подвижность',
  melee: 'Умение владеть холодным оружием в бою',
  stealth: 'Маскировка, внимательность, креативность, нестандартные решения',
};

export function SetupScreen() {
  const stats = useGameStore(s => s.stats);
  const distributePoints = useGameStore(s => s.distributePoints);
  const startGame = useGameStore(s => s.startGame);
  const setPhase = useGameStore(s => s.setPhase);

  const { distributeStats, distributePoints: maxPoints } = gameData.metadata;

  const totalDistributed = distributeStats.reduce((sum, stat) => {
    return sum + ((stats as any)[stat] - (gameData.metadata.startingStats as any)[stat]);
  }, 0);
  const remaining = maxPoints - totalDistributed;

  const handleAdjust = (stat: string, delta: number) => {
    if (delta > 0 && remaining <= 0) return;
    if (delta < 0 && (stats as any)[stat] <= (gameData.metadata.startingStats as any)[stat]) return;
    distributePoints(stat as any, delta);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-frost-950 text-frost-100 px-4 py-8">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-ice-200 mb-2">
        Распределение очков
      </h2>
      <p className="text-frost-400 mb-6 sm:mb-8 text-center max-w-md text-sm sm:text-base px-4">
        У вас есть <span className="text-ice-300 font-bold">{remaining}</span> очков для распределения
      </p>

      <div className="w-full max-w-md space-y-6">
        {distributeStats.map(stat => {
          const base = (gameData.metadata.startingStats as any)[stat];
          const current = (stats as any)[stat];
          const added = current - base;

          return (
            <div key={stat} className="bg-frost-900/50 rounded-lg p-4 border border-frost-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-ice-200 font-serif text-base sm:text-lg">{STAT_NAMES[stat]}</span>
                  <span className="text-frost-500 text-xs ml-2 hidden sm:inline">({STAT_DESCRIPTIONS[stat]?.substring(0, 50)}...)</span>
                </div>
                <span className="text-ice-300 font-mono text-xl font-bold">{current}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-frost-500 text-sm">Базовое: {base}</span>
                {added > 0 && <span className="text-ice-400 text-sm">+{added}</span>}
                <div className="flex-1" />
                <button
                  onClick={() => handleAdjust(stat, -1)}
                  className="w-8 h-8 bg-frost-800 hover:bg-frost-700 rounded text-frost-300 font-bold transition-colors"
                >
                  −
                </button>
                <button
                  onClick={() => handleAdjust(stat, 1)}
                  disabled={remaining <= 0}
                  className="w-8 h-8 bg-ice-800 hover:bg-ice-700 disabled:bg-frost-800 disabled:text-frost-600 rounded text-ice-200 font-bold transition-colors"
                >
                  +
                </button>
              </div>

              {/* Bar */}
              <div className="mt-2 h-2 bg-frost-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ice-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (current / 50) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Current stats summary */}
      <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
        <StatCard label="Здоровье" value={stats.health} />
        <StatCard label="Аура" value={stats.aura} />
        <StatCard label="Аптечки" value={stats.medkits} />
        <div className="bg-frost-900/30 rounded p-3 text-center border border-frost-800">
          <div className="text-frost-500 text-xs">Осталось</div>
          <div className={`text-2xl font-mono font-bold ${remaining > 0 ? 'text-warning' : 'text-success'}`}>
            {remaining}
          </div>
        </div>
      </div>

      <button
        onClick={startGame}
        className="mt-8 px-8 sm:px-12 py-3 bg-ice-700 hover:bg-ice-600 text-ice-50 rounded-lg text-lg sm:text-xl font-serif transition-all duration-300 hover:scale-105"
      >
        Начать игру
      </button>

      <button
        onClick={() => setPhase('title')}
        className="mt-3 text-frost-500 hover:text-frost-300 text-sm transition-colors"
      >
        ← Назад
      </button>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-frost-900/30 rounded p-3 text-center border border-frost-800">
      <div className="text-frost-500 text-xs">{label}</div>
      <div className="text-2xl font-mono font-bold text-ice-300">{value}</div>
    </div>
  );
}