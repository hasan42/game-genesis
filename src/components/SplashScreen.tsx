import { useState, useEffect, useCallback } from 'react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const title = 'ГЕНЕЗИС';

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('hold'), 600);
    const exitTimer = setTimeout(() => setPhase('exit'), 2400);
    const completeTimer = setTimeout(onComplete, 3000);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const handleClick = useCallback(() => {
    setPhase('exit');
    setTimeout(onComplete, 500);
  }, [onComplete]);

  // Generate ice crystal particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (360 / 12) * i + (Math.random() * 30 - 15),
    distance: 40 + Math.random() * 80,
    delay: Math.random() * 0.3,
    size: 2 + Math.random() * 4,
    opacity: 0.3 + Math.random() * 0.5,
  }));

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-frost-950 cursor-pointer transition-opacity duration-500 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClick}
    >
      {/* Station breathing background */}
      <div className="absolute inset-0 station-breathe-bg" />

      <div className="relative">
        {/* Ice crystal particles that fly outward */}
        {phase !== 'exit' && particles.map(p => (
          <div
            key={p.id}
            className="absolute left-1/2 top-1/2 ice-particle"
            style={{
              '--angle': `${p.angle}deg`,
              '--distance': `${p.distance}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              opacity: phase === 'hold' ? p.opacity : 0,
              transition: 'opacity 0.5s ease',
            } as React.CSSProperties}
          />
        ))}

        {/* Title with letter-by-letter animation */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-display font-bold tracking-widest relative">
          {title.split('').map((char, i) => (
            <span
              key={i}
              className={`inline-block splash-letter ${
                phase !== 'enter' ? 'splash-letter-visible' : ''
              }`}
              style={{
                animationDelay: `${i * 0.1}s`,
                textShadow: phase !== 'enter'
                  ? '0 0 20px rgba(56, 189, 248, 0.8), 0 0 40px rgba(56, 189, 248, 0.4), 0 0 80px rgba(56, 189, 248, 0.2)'
                  : 'none',
              }}
            >
              {char}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <p
          className={`text-frost-500 text-sm sm:text-base mt-4 text-center transition-opacity duration-700 ${
            phase !== 'enter' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transitionDelay: '0.8s' }}
        >
          Нажмите, чтобы начать
        </p>
      </div>
    </div>
  );
}