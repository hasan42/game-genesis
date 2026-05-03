/**
 * Location data — paragraph-to-location mapping.
 * Single source of truth used by StationMap, achievements, SnowEffect, LocationTransition.
 */

export type LocationId = 'residential' | 'warehouse' | 'command' | 'workshop' | 'spaceport' | 'mine' | 'surface';

export const LOCATION_DATA: Record<LocationId, {
  name: string;
  icon: string;
  gradient: string;
  description: string;
  paragraphs: number[];
}> = {
  residential: {
    name: 'Жилой модуль',
    icon: '🏠',
    gradient: 'from-amber-950/40 via-frost-950 to-frost-950',
    description: 'Основное здание станции: каюты, холл, медпункт, столовая',
    paragraphs: [1, 2, 3, 5, 7, 8, 9, 10, 14, 38, 39, 40, 42, 52, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 99, 100, 101, 102, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 120, 121, 142, 159, 162, 175, 190, 191, 192, 194, 195, 196, 197, 198, 199, 200],
  },
  warehouse: {
    name: 'Склад',
    icon: '📦',
    gradient: 'from-frost-900/60 via-frost-950 to-frost-950',
    description: 'Хранилище грузов и оборудования',
    paragraphs: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 174],
  },
  command: {
    name: 'Командный центр',
    icon: '📡',
    gradient: 'from-ice-950/50 via-frost-950 to-frost-950',
    description: 'Управление станцией, связь, исины',
    paragraphs: [4, 30, 31, 32, 33, 34, 35, 36, 37, 43, 44, 45, 46, 47, 48, 49, 50, 51, 119, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 160, 161, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189],
  },
  workshop: {
    name: 'Мастерская',
    icon: '🔧',
    gradient: 'from-orange-950/40 via-frost-950 to-frost-950',
    description: 'Ремонт и обслуживание техники',
    paragraphs: [11, 12, 13, 53, 54, 55, 122, 123, 124, 125, 126, 127, 128, 129],
  },
  spaceport: {
    name: 'Космопорт',
    icon: '🚀',
    gradient: 'from-red-950/40 via-frost-950 to-frost-950',
    description: 'Посадочная площадка, ангар для кораблей',
    paragraphs: [95, 96, 97, 98, 103, 193],
  },
  mine: {
    name: 'Малая шахта',
    icon: '⛏️',
    gradient: 'from-stone-900/50 via-frost-950 to-frost-950',
    description: 'Буровая вышка, добыча ресурсов',
    paragraphs: [6, 15, 27, 28, 29, 41],
  },
  surface: {
    name: 'Поверхность',
    icon: '🏔️',
    gradient: 'from-slate-800/60 via-frost-950 to-frost-950',
    description: 'Внешняя поверхность планеты, ледяные пустоши',
    paragraphs: [58, 63, 73, 92],
  },
};

/**
 * Get location ID for a given paragraph.
 */
export function getLocationForParagraph(paragraphId: number): LocationId | null {
  for (const [locId, loc] of Object.entries(LOCATION_DATA)) {
    if (loc.paragraphs.includes(paragraphId)) {
      return locId as LocationId;
    }
  }
  return null;
}

/**
 * Build the simple paragraph-to-location map (for backward compat with achievements.ts).
 */
export const PARAGRAPH_LOCATION_MAP: Record<string, number[]> = Object.fromEntries(
  Object.entries(LOCATION_DATA).map(([key, val]) => [key, val.paragraphs])
);

/**
 * Get set of visited location IDs from a set of visited paragraph IDs.
 */
export function getVisitedLocations(paragraphsVisited: Set<number>): Set<string> {
  const result = new Set<string>();
  for (const [locId, loc] of Object.entries(LOCATION_DATA)) {
    if (loc.paragraphs.some(p => paragraphsVisited.has(p))) {
      result.add(locId);
    }
  }
  return result;
}