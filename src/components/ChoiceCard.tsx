import { useState, useRef, useCallback } from 'react';

// Choice card type colors
type ChoiceType = 'normal' | 'conditional' | 'dangerous';

interface ChoiceCardProps {
  index: number;
  description: string;
  onClick: () => void;
  type?: ChoiceType;
  disabled?: boolean;
}

const TYPE_CONFIG: Record<ChoiceType, { borderColor: string; icon: string; iconColor: string }> = {
  normal: { borderColor: 'border-l-ice-500', icon: '▸', iconColor: 'text-ice-400' },
  conditional: { borderColor: 'border-l-amber-500', icon: '◈', iconColor: 'text-amber-400' },
  dangerous: { borderColor: 'border-l-danger', icon: '⚠', iconColor: 'text-danger' },
};

function spawnIceParticles(container: HTMLElement, x: number, y: number) {
  const count = 10;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    const angle = (360 / count) * i + (Math.random() * 30 - 15);
    const distance = 30 + Math.random() * 60;
    const size = 2 + Math.random() * 4;

    const angleRad = (angle * Math.PI) / 180;
    const targetX = Math.cos(angleRad) * distance;
    const targetY = Math.sin(angleRad) * distance;

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
    `;

    container.appendChild(particle);

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

export function ChoiceCard({ index, description, onClick, type = 'normal', disabled }: ChoiceCardProps) {
  const [hovered, setHovered] = useState(false);
  const config = TYPE_CONFIG[type];
  const ref = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // 10A.3 — Spawn ice crystal particles at click position
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      spawnIceParticles(ref.current, x, y);
    }
    onClick();
  }, [onClick]);

  return (
    <button
      ref={ref}
      onClick={handleClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative overflow-hidden
        w-full text-left px-4 py-3 sm:px-5 sm:py-4
        bg-frost-900/60 hover:bg-ice-900/40
        border border-frost-800 hover:border-ice-700
        border-l-3 ${config.borderColor}
        rounded-lg
        transition-all duration-200
        group choice-btn
        focus:outline-none focus:ring-2 focus:ring-ice-600 focus:ring-offset-2 focus:ring-offset-frost-950
        ${hovered ? '-translate-y-0.5 shadow-lg shadow-ice-900/20' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      data-choice-index={index}
      aria-label={`Выбор ${index + 1}: ${description}`}
    >
      <div className="flex items-start gap-3">
        <span className={`${config.iconColor} text-lg flex-shrink-0 mt-0.5`}>{config.icon}</span>
        <div className="flex-1">
          <span className="text-frost-500 text-xs font-mono mr-2">{index + 1}.</span>
          <span className="text-frost-300 group-hover:text-ice-200 text-base sm:text-lg font-serif">
            {description}
          </span>
        </div>
      </div>
    </button>
  );
}

/**
 * Determine choice type from description
 */
export function inferChoiceType(description: string, isConditional: boolean): ChoiceType {
  if (isConditional) return 'conditional';
  const lower = description.toLowerCase();
  // Dangerous keywords in Russian
  if (lower.includes('опасн') || lower.includes('риск') || lower.includes('битв') || lower.includes('бой') || lower.includes('драться') || lower.includes('атак')) {
    return 'dangerous';
  }
  return 'normal';
}