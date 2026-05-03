import { useState, useEffect } from 'react';

interface EndingUnlockProps {
  endingName?: string;
  onDismiss?: () => void;
}

/**
 * 9.6 — EndingUnlock notification.
 * Shows a fade-in overlay with ✨ when a new ending is first reached.
 * Auto-dismisses after 3 seconds with fade-out.
 */
export function EndingUnlock({ endingName, onDismiss }: EndingUnlockProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const dismissTimer = setTimeout(() => {
      setFading(true);
      // Wait for fade-out animation before removing
      setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, 500);
    }, 3000);

    return () => clearTimeout(dismissTimer);
  }, [onDismiss]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none ending-unlock-overlay ${fading ? 'ending-unlock-fade-out' : 'ending-unlock-fade-in'}`}
    >
      <div className="bg-frost-950/90 border border-ice-500/30 rounded-2xl px-8 py-6 text-center shadow-[0_0_40px_rgba(56,189,248,0.2)] backdrop-blur-sm max-w-sm mx-4">
        <div className="text-4xl mb-3 ending-unlock-sparkle">✨</div>
        <div className="text-ice-200 text-lg font-display font-bold mb-1" style={{ textShadow: '0 0 20px rgba(56,189,248,0.4)' }}>
          Новая концовка разблокирована!
        </div>
        {endingName && (
          <div className="text-ice-300 text-sm font-serif mt-1">
            «{endingName}»
          </div>
        )}
      </div>
    </div>
  );
}