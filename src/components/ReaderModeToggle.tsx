/**
 * ReaderModeToggle — полноэкранный режим чтения (Kindle-стиль)
 * В этом режиме: текст по центру, max-width: 680px, увеличенный line-height
 * Скрыты все панели, только текст + выборы
 * Полупрозрачная кнопка «выйти» в углу
 */

import { useState } from 'react';
import { useGameStore } from '../engine/store';

export function ReaderModeToggle() {
  const readerMode = useGameStore(s => s.readerMode);
  const toggleReaderMode = useGameStore(s => s.toggleReaderMode);

  return (
    <button
      onClick={toggleReaderMode}
      className={`text-sm transition-all duration-200 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-frost-900/50 ${
        readerMode ? 'text-amber-300 bg-amber-900/20' : 'text-frost-500 hover:text-frost-300'
      }`}
      title={readerMode ? 'Выйти из режима чтения' : 'Режим чтения'}
      aria-label={readerMode ? 'Выйти из режима чтения' : 'Включить режим чтения'}
    >
      <span>{readerMode ? '✕' : '📖'}</span>
      <span className="hidden sm:inline">{readerMode ? 'Выйти' : 'Читать'}</span>
    </button>
  );
}

interface FullscreenReaderOverlayProps {
  onExit: () => void;
}

/**
 * FullscreenReaderOverlay — полупрозрачная кнопка «выйти» в углу
 * Показывается внутри полноэкранного режима чтения
 */
export function FullscreenReaderOverlay({ onExit }: FullscreenReaderOverlayProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onExit}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`fixed top-4 right-4 z-[80] transition-all duration-300 flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm ${
        hovered
          ? 'bg-frost-900/80 text-frost-200 opacity-100'
          : 'bg-frost-900/40 text-frost-400 opacity-50'
      }`}
      aria-label="Выйти из режима чтения"
    >
      <span>✕</span>
      {hovered && <span className="text-sm">Выйти</span>}
    </button>
  );
}

/**
 * useFullscreenReader — хук для управления полноэкранным режимом чтения
 * Оборачивает контент в Kindle-стиль: текст по центру, увеличенный line-height
 */
export function useFullscreenReader() {
  const readerMode = useGameStore(s => s.readerMode);
  const toggleReaderMode = useGameStore(s => s.toggleReaderMode);

  const readerModeClassNames = readerMode
    ? 'max-w-[680px] mx-auto leading-[1.9] text-lg'
    : '';

  return {
    isReaderMode: readerMode,
    toggleReaderMode,
    exitReaderMode: toggleReaderMode,
    readerModeClassNames,
    ReaderOverlay: readerMode ? (
      <FullscreenReaderOverlay onExit={toggleReaderMode} />
    ) : null,
  };
}