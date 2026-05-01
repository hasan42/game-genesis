import { ACHIEVEMENTS, getUnlockedAchievements } from '../engine/achievements';

export function AchievementsModal({ onClose }: { onClose: () => void }) {
  const unlocked = getUnlockedAchievements();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-frost-950/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md max-h-[85vh] bg-frost-900 border border-frost-700 rounded-xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-frost-800">
          <h3 className="text-lg font-serif font-bold text-ice-200">🏆 Достижения</h3>
          <div className="flex items-center gap-3">
            <span className="text-frost-400 text-xs">{unlocked.size}/{ACHIEVEMENTS.length}</span>
            <button
              onClick={onClose}
              className="text-frost-500 hover:text-frost-200 text-xl leading-none transition-colors"
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {ACHIEVEMENTS.map(achievement => {
            const isUnlocked = unlocked.has(achievement.id);
            return (
              <div
                key={achievement.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isUnlocked
                    ? 'bg-ice-900/20 border-ice-700/40'
                    : 'bg-frost-800/20 border-frost-800/40 opacity-50'
                }`}
              >
                <span className="text-2xl">{isUnlocked ? achievement.icon : '🔒'}</span>
                <div className="flex-1 min-w-0">
                  <div className={`font-serif text-sm font-bold ${isUnlocked ? 'text-ice-200' : 'text-frost-600'}`}>
                    {achievement.name}
                  </div>
                  <div className={`text-xs ${isUnlocked ? 'text-frost-400' : 'text-frost-700'}`}>
                    {achievement.description}
                  </div>
                </div>
                {isUnlocked && (
                  <span className="text-ice-500 text-sm">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}