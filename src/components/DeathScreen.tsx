import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../engine/store';

/**
 * 9.6 — Improved Death Screen with ice-crack animation.
 * Animation sequence: cracks appear → text fades in → button fades in
 */
export function DeathScreen() {
  const resetGame = useGameStore(s => s.resetGame);
  const history = useGameStore(s => s.history);
  const [phase, setPhase] = useState<'cracks' | 'text' | 'button'>('cracks');

  // Sequential animation phases
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 1200);
    const t2 = setTimeout(() => setPhase('button'), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Generate crack lines — expanding from center
  const crackLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; x2b: number; y2: number; y2b: number; delay: number; sw: number; opacity: number }[] = [];
    // Main radial cracks from center
    const numMain = 8;
    for (let i = 0; i < numMain; i++) {
      const angle = (Math.PI * 2 * i) / numMain + (i % 2 === 0 ? 0.1 : -0.15);
      const len = 120 + Math.random() * 180;
      const midX = 400;
      const midY = 300;
      lines.push({
        x1: midX,
        y1: midY,
        x2: midX + Math.cos(angle) * len * 0.5,
        x2b: midX + Math.cos(angle) * len,
        y2: midY + Math.sin(angle) * len * 0.5,
        y2b: midY + Math.sin(angle) * len,
        delay: i * 0.08,
        sw: 2.5 - i * 0.15,
        opacity: 0.6 - i * 0.03,
      });
    }
    // Secondary branching cracks
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const startDist = 60 + Math.random() * 100;
      const len = 40 + Math.random() * 80;
      const midX = 400 + Math.cos(angle) * startDist;
      const midY = 300 + Math.sin(angle) * startDist;
      const branchAngle = angle + (Math.random() - 0.5) * 1.2;
      lines.push({
        x1: midX,
        y1: midY,
        x2: midX + Math.cos(branchAngle) * len * 0.5,
        x2b: midX + Math.cos(branchAngle) * len,
        y2: midY + Math.sin(branchAngle) * len * 0.5,
        y2b: midY + Math.sin(branchAngle) * len,
        delay: 0.3 + i * 0.06,
        sw: 1.2,
        opacity: 0.35,
      });
    }
    return lines;
  }, []);

  return (
    <div className="death-screen-root">
      {/* Gradual darkening overlay — transparent to black over 2 seconds */}
      <div className="death-screen-darken" />

      {/* Ice crack SVG overlay */}
      <div className="death-screen-cracks">
        <svg
          viewBox="0 0 800 600"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
        >
          {crackLines.map((line, i) => (
            <g key={i}>
              {/* Main crack segment */}
              <line
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="rgba(186,230,253,0.7)"
                strokeWidth={line.sw}
                className="crack-line"
                style={{ animationDelay: `${line.delay}s` }}
              />
              {/* Glow behind crack */}
              <line
                x1={line.x1}
                y1={line.y1}
                x2={line.x2b}
                y2={line.y2b}
                stroke="rgba(56,189,248,0.25)"
                strokeWidth={line.sw + 3}
                className="crack-line"
                style={{ animationDelay: `${line.delay}s` }}
              />
              {/* Full-length crack */}
              <line
                x1={line.x1}
                y1={line.y1}
                x2={line.x2b}
                y2={line.y2b}
                stroke={`rgba(186,230,253,${line.opacity})`}
                strokeWidth={line.sw * 0.6}
                className="crack-line"
                style={{ animationDelay: `${line.delay + 0.2}s` }}
              />
            </g>
          ))}
          {/* Central impact point */}
          <circle cx="400" cy="300" r="6" fill="rgba(56,189,248,0.5)" className="crack-line" />
          <circle cx="400" cy="300" r="15" fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth="2" className="crack-line" style={{ animationDelay: '0s' }} />
        </svg>
      </div>

      {/* Red danger vignette */}
      <div className="absolute inset-0 z-[3] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(220,38,38,0.15) 70%, rgba(185,28,28,0.35) 100%)' }} />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* GAME OVER text with ice-blue glow */}
        <div className={`death-screen-text ${phase !== 'text' && phase !== 'button' ? 'opacity-0' : 'death-text-appear'}`}>
          <h1
            className="text-4xl sm:text-6xl font-display font-bold mb-3 tracking-wider"
            style={{ textShadow: '0 0 30px rgba(56,189,248,0.5), 0 0 60px rgba(56,189,248,0.2), 0 0 100px rgba(56,189,248,0.1)', color: '#e0f2fe' }}
          >
            GAME OVER
          </h1>
          <p className="text-frost-400 mb-1 text-sm sm:text-base" style={{ textShadow: '0 0 10px rgba(56,189,248,0.2)' }}>
            Здоровье упало до нуля
          </p>
          <p className="text-frost-500 text-xs sm:text-sm mb-8">
            Пройдено параграфов: {history.length}
          </p>
        </div>

        {/* Restart button */}
        <div className={`death-screen-button ${phase !== 'button' ? 'opacity-0' : 'death-button-appear'}`}>
          <button
            onClick={resetGame}
            className="px-8 py-3 bg-ice-800/80 hover:bg-ice-700 text-ice-100 rounded-lg text-lg transition-all duration-300 border border-ice-600/30 hover:border-ice-500/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]"
            style={{ textShadow: '0 0 8px rgba(56,189,248,0.3)' }}
            aria-label="Начать заново"
          >
            ❄️ Начать заново
          </button>
        </div>
      </div>
    </div>
  );
}