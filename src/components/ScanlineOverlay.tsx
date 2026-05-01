/**
 * ScanlineOverlay — CRT/scanlines эффект для шахт
 * Тонкие горизонтальные линии + лёгкое мерцание яркости
 * Включается только в шахтах (mine)
 */

import { useMemo } from 'react';
import { useGameStore } from '../engine/store';
import { PARAGRAPH_LOCATION_MAP } from '../engine/achievements';

function shouldShowScanlines(paragraphId: number): boolean {
  return PARAGRAPH_LOCATION_MAP.mine?.includes(paragraphId) ?? false;
}

export function ScanlineOverlay() {
  const currentParagraph = useGameStore(s => s.currentParagraph);
  const show = useMemo(() => shouldShowScanlines(currentParagraph), [currentParagraph]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[3]">
      <style>{`
        @keyframes crt-flicker {
          0%, 100% { opacity: 0; }
          2% { opacity: 0.02; }
          4% { opacity: 0; }
          50% { opacity: 0.01; }
          52% { opacity: 0.03; }
          54% { opacity: 0; }
        }
      `}</style>
      {/* Scanlines — thin horizontal lines */}
      <div
        className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.08) 2px, rgba(0, 0, 0, 0.08) 4px)',
          mixBlendMode: 'multiply',
        }}
      />
      {/* Subtle flicker */}
      <div
        className="absolute inset-0 bg-black"
        style={{
          animation: 'crt-flicker 4s ease-in-out infinite',
        }}
      />
    </div>
  );
}