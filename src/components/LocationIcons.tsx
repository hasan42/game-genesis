/**
 * LocationIcons — SVG иконки для локаций станции
 * Минималистичные, одноцветные (ice-400), 24x24px
 * Использовать в StationMap и LocationTransition
 */

import type { FC, SVGProps } from 'react';

// Base props for all location icons
type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  className?: string;
};

// 🏠 Жилой модуль — домик
export const ResidentialIcon: FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    {/* Roof */}
    <path d="M12 3L2 12H5V20H10V15H14V20H19V12H22L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    {/* Door */}
    <rect x="10" y="15" width="4" height="5" rx="0.5" stroke="currentColor" strokeWidth="1" opacity="0.6" />
  </svg>
);

// 🎛️ Командный модуль — пульт/экран с кнопками
export const CommandIcon: FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    {/* Screen */}
    <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    {/* Screen lines */}
    <line x1="7" y1="8" x2="17" y2="8" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    <line x1="7" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    {/* Stand */}
    <line x1="12" y1="16" x2="12" y2="19" stroke="currentColor" strokeWidth="1.5" />
    <line x1="8" y1="19" x2="16" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 🏭 Ангар/Склад — ангар с воротами
export const WarehouseIcon: FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    {/* Roof — angular */}
    <path d="M2 10L12 3L22 10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    {/* Walls */}
    <rect x="3" y="10" width="18" height="10" stroke="currentColor" strokeWidth="1.5" />
    {/* Doors */}
    <rect x="8" y="13" width="4" height="7" rx="0.5" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    <rect x="12" y="13" width="4" height="7" rx="0.5" stroke="currentColor" strokeWidth="1" opacity="0.6" />
  </svg>
);

// ⛏️ Шахты — кирка/шахта
export const MineIcon: FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    {/* Pickaxe */}
    <line x1="5" y1="19" x2="15" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 3L17 7L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    {/* Cave entrance */}
    <path d="M2 21H22V18C22 14 19 11 15 11H9C5 11 2 14 2 18V21Z" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
  </svg>
);

// 🚀 Космодром — ракета
export const SpaceportIcon: FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    {/* Rocket body */}
    <path d="M12 2C12 2 8 7 8 14H16C16 7 12 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    {/* Fins */}
    <path d="M8 14L5 17H8" stroke="currentColor" strokeWidth="1.2" />
    <path d="M16 14L19 17H16" stroke="currentColor" strokeWidth="1.2" />
    {/* Window */}
    <circle cx="12" cy="9" r="1.5" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    {/* Flame */}
    <path d="M9 17L10 21H14L15 17" stroke="currentColor" strokeWidth="1" opacity="0.4" />
  </svg>
);

// 🏛️ Центральный холл — колонны
export const HallIcon: FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    {/* Roof */}
    <path d="M2 7L12 3L22 7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    {/* Left column */}
    <rect x="4" y="7" width="2" height="13" stroke="currentColor" strokeWidth="1.2" />
    {/* Right column */}
    <rect x="18" y="7" width="2" height="13" stroke="currentColor" strokeWidth="1.2" />
    {/* Center column */}
    <rect x="11" y="7" width="2" height="13" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    {/* Base */}
    <line x1="2" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

// Map of location IDs to icon components
export const LOCATION_ICONS: Record<string, FC<IconProps>> = {
  residential: ResidentialIcon,
  warehouse: WarehouseIcon,
  command: CommandIcon,
  workshop: WarehouseIcon, // Workshop reuses warehouse icon (angar-like)
  spaceport: SpaceportIcon,
  mine: MineIcon,
};

// Map of location IDs to their SVG icon component
export function getLocationIcon(locationId: string): FC<IconProps> | null {
  return LOCATION_ICONS[locationId] ?? null;
}