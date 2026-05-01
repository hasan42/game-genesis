import { useRef, useCallback } from 'react';

interface ChoiceParticlesProps {
  children: React.ReactNode;
  onClick: () => void;
}

export function ChoiceParticles({ children, onClick }: ChoiceParticlesProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Spawn particles at click position
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      spawnParticles(ref.current!, x, y);
    }
    onClick();
  }, [onClick]);

  return (
    <div ref={ref} className="relative" onClick={handleClick}>
      {children}
    </div>
  );
}

function spawnParticles(container: HTMLElement, x: number, y: number) {
  const count = 10;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    const angle = (360 / count) * i + (Math.random() * 30 - 15);
    const distance = 30 + Math.random() * 60;
    const size = 2 + Math.random() * 4;

    particle.className = 'choice-particle';
    particle.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      background: ${Math.random() > 0.5 ? '#7dd3fc' : '#38bdf8'};
      border-radius: 50%;
      pointer-events: none;
      z-index: 50;
      --angle: ${angle}deg;
      --distance: ${distance}px;
    `;

    container.appendChild(particle);

    // Animate using Web Animations API
    const angleRad = (angle * Math.PI) / 180;
    const targetX = Math.cos(angleRad) * distance;
    const targetY = Math.sin(angleRad) * distance;

    particle.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${targetX}px), calc(-50% + ${targetY}px)) scale(0)`, opacity: 0 },
    ], {
      duration: 500 + Math.random() * 300,
      easing: 'cubic-bezier(0, 0.5, 0.5, 1)',
      fill: 'forwards',
    });

    setTimeout(() => particle.remove(), 900);
  }
}