// Achievement system for game-genesis

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  paragraphsVisited: Set<number>;
  totalParagraphs: number;
  stats: {
    health: number;
    maxHealth: number;
    aura: number;
    agility: number;
    melee: number;
    stealth: number;
    medkits: number;
  };
  keywords: string[];
  historyLength: number;
  visitedLocations: Set<string>;
  totalLocations: number;
}

const STORAGE_KEY = 'game-genesis-achievements';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'explorer',
    name: 'Исследователь',
    description: 'Посетить 50% параграфов книги',
    icon: '🗺️',
    check: (ctx) => ctx.paragraphsVisited.size >= Math.floor(ctx.totalParagraphs * 0.5),
  },
  {
    id: 'conqueror',
    name: 'Покоритель',
    description: 'Посетить все параграфы книги',
    icon: '👑',
    check: (ctx) => ctx.paragraphsVisited.size >= ctx.totalParagraphs,
  },
  {
    id: 'peacemaker',
    name: 'Миротворец',
    description: 'Аура достигла 10 или выше',
    icon: '🕊️',
    check: (ctx) => ctx.stats.aura >= 10,
  },
  {
    id: 'warrior',
    name: 'Воин',
    description: 'Холодное оружие достигло 5 или выше',
    icon: '⚔️',
    check: (ctx) => ctx.stats.melee >= 5,
  },
  {
    id: 'speedrun',
    name: 'Скоростной бег',
    description: 'Достичь победы менее чем за 30 шагов',
    icon: '⚡',
    check: (ctx) => ctx.historyLength > 0 && ctx.historyLength < 30,
  },
  {
    id: 'discoverer',
    name: 'Первооткрыватель',
    description: 'Посетить все локации на карте',
    icon: '🧭',
    check: (ctx) => ctx.visitedLocations.size >= ctx.totalLocations,
  },
  {
    id: 'survivor',
    name: 'Выживший',
    description: 'Выжить с здоровьем 1',
    icon: '💀',
    check: (ctx) => ctx.stats.health === 1 && ctx.stats.health > 0,
  },
  {
    id: 'healer',
    name: 'Целитель',
    description: 'Аура достигла 15 или выше',
    icon: '✨',
    check: (ctx) => ctx.stats.aura >= 15,
  },
];

// Paragraph → location mapping (from StationMap component)
export const PARAGRAPH_LOCATION_MAP: Record<string, number[]> = {
  residential: [1, 2, 3, 5, 7, 8, 9, 10, 14, 38, 39, 40, 42, 52, 56, 57, 58, 59, 60, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 99, 100, 101, 102, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 120, 121, 142, 159, 162, 175, 190, 191, 192, 194, 195, 196, 197, 198, 199, 200],
  warehouse: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 174],
  command: [4, 30, 31, 32, 33, 34, 35, 36, 37, 43, 44, 45, 46, 47, 48, 49, 50, 51, 119, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 160, 161, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189],
  workshop: [11, 12, 13, 53, 54, 55, 122, 123, 124, 125, 126, 127, 128, 129],
  spaceport: [95, 96, 97, 98, 193],
  mine: [6, 15, 27, 28, 29, 41],
};

export function getVisitedLocations(paragraphsVisited: Set<number>): Set<string> {
  const result = new Set<string>();
  for (const [locId, paragraphs] of Object.entries(PARAGRAPH_LOCATION_MAP)) {
    if (paragraphs.some(p => paragraphsVisited.has(p))) {
      result.add(locId);
    }
  }
  return result;
}

export function getUnlockedAchievements(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    return new Set(JSON.parse(stored));
  } catch {
    return new Set();
  }
}

export function saveUnlockedAchievements(unlocked: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]));
  } catch {}
}

export function checkAndUnlockAchievements(ctx: AchievementContext): Achievement[] {
  const unlocked = getUnlockedAchievements();
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (!unlocked.has(achievement.id) && achievement.check(ctx)) {
      unlocked.add(achievement.id);
      newlyUnlocked.push(achievement);
    }
  }

  if (newlyUnlocked.length > 0) {
    saveUnlockedAchievements(unlocked);
  }

  return newlyUnlocked;
}

// Ending tracking
const ENDINGS_KEY = 'game-genesis-endings';

// Paragraphs with no choices = potential endings
export const ENDING_PARAGRAPH_IDS = [0, 2, 10, 15, 29, 31, 32, 46, 64, 77, 82, 84, 123, 126, 137, 157, 162, 171, 185, 200];

export function getReachedEndings(): Set<number> {
  try {
    const stored = localStorage.getItem(ENDINGS_KEY);
    if (!stored) return new Set();
    return new Set(JSON.parse(stored));
  } catch {
    return new Set();
  }
}

export function saveReachedEnding(paragraphId: number): void {
  const endings = getReachedEndings();
  endings.add(paragraphId);
  try {
    localStorage.setItem(ENDINGS_KEY, JSON.stringify([...endings]));
  } catch {}
}

// Tutorial hints
const TUTORIAL_KEY = 'game-genesis-tutorial';

export interface TutorialHint {
  id: string;
  text: string;
}

export const TUTORIAL_HINTS: TutorialHint[] = [
  { id: 'first-keyword', text: '💡 Ключевые слова открывают новые выборы! Следите за ними в панели ниже.' },
  { id: 'first-effect', text: '💡 Эффекты изменяют ваши характеристики. Красные — урон, зелёные — бонусы.' },
  { id: 'first-conditional', text: '💡 Некоторые выборы зависят от ваших характеристик или ключевых слов.' },
  { id: 'first-medkit', text: '💡 Аптечки можно использовать для восстановления здоровья в любой момент.' },
  { id: 'first-death', text: '💡 Если здоровье упадёт до нуля — вы погибнете. Будьте осторожны!' },
  { id: 'first-map', text: '💡 Нажмите 🗺️ Карта, чтобы увидеть схему станции и ваши посещённые локации.' },
  { id: 'first-journal', text: '💡 В журнале можно посмотреть историю и вернуться к прошлому параграфу.' },
];

export function getSeenTutorials(): Set<string> {
  try {
    const stored = localStorage.getItem(TUTORIAL_KEY);
    if (!stored) return new Set();
    return new Set(JSON.parse(stored));
  } catch {
    return new Set();
  }
}

export function markTutorialSeen(hintId: string): void {
  const seen = getSeenTutorials();
  seen.add(hintId);
  try {
    localStorage.setItem(TUTORIAL_KEY, JSON.stringify([...seen]));
  } catch {}
}

// Quick save slots
const QUICK_SAVE_PREFIX = 'game-genesis-quicksave-';
export const QUICK_SAVE_SLOTS = 3;

export interface QuickSaveData {
  currentParagraph: number;
  stats: Record<string, number>;
  keywords: Array<{ word: string; count: number }>;
  history: Array<{
    paragraphId: number;
    choiceDescription?: string;
    timestamp: number;
    statsSnapshot?: Record<string, number>;
    keywordsSnapshot?: Array<{ word: string; count: number }>;
  }>;
  gameStartTime: number | null;
  savedAt: number;
}

export function quickSave(slot: number, data: QuickSaveData): boolean {
  try {
    localStorage.setItem(`${QUICK_SAVE_PREFIX}${slot}`, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function quickLoad(slot: number): QuickSaveData | null {
  try {
    const stored = localStorage.getItem(`${QUICK_SAVE_PREFIX}${slot}`);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function getQuickSaveInfo(slot: number): { exists: boolean; savedAt: number | null; paragraphId: number | null } {
  try {
    const stored = localStorage.getItem(`${QUICK_SAVE_PREFIX}${slot}`);
    if (!stored) return { exists: false, savedAt: null, paragraphId: null };
    const data = JSON.parse(stored) as QuickSaveData;
    return { exists: true, savedAt: data.savedAt, paragraphId: data.currentParagraph };
  } catch {
    return { exists: false, savedAt: null, paragraphId: null };
  }
}

export function deleteQuickSave(slot: number): void {
  try {
    localStorage.removeItem(`${QUICK_SAVE_PREFIX}${slot}`);
  } catch {}
}