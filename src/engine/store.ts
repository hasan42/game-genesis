import { create } from 'zustand';
import type { GameState, GameStats, KeywordRecord, HistoryEntry, Paragraph, GameData } from './types';
import gameDataJson from '../data/game-data.json';

const data = gameDataJson as unknown as GameData;
const MAX_HEALTH = 40;

const STORAGE_KEY = 'game-genesis-save';

function makeInitialStats(): GameStats {
  return {
    health: data.metadata.startingStats.health,
    maxHealth: MAX_HEALTH,
    aura: data.metadata.startingStats.aura,
    agility: data.metadata.startingStats.agility,
    melee: data.metadata.startingStats.melee,
    stealth: data.metadata.startingStats.stealth,
    medkits: data.metadata.startingStats.medkits,
  };
}

function getParagraph(id: number): Paragraph | undefined {
  return data.paragraphs.find(p => p.id === id);
}

function addKeyword(keywords: KeywordRecord[], word: string): KeywordRecord[] {
  const existing = keywords.find(k => k.word === word);
  if (existing) {
    return keywords.map(k => k.word === word ? { ...k, count: k.count + 1 } : k);
  }
  return [...keywords, { word, count: 1 }];
}

function removeKeyword(keywords: KeywordRecord[], word: string): KeywordRecord[] {
  return keywords.filter(k => k.word !== word);
}

// hasKeyword utility (used in GameScreen component)
export function hasKeyword(keywords: KeywordRecord[], word: string): boolean {
  return keywords.some(k => k.word === word && k.count > 0);
}

function applyEffects(stats: GameStats, keywords: KeywordRecord[], paragraph: Paragraph): { stats: GameStats; keywords: KeywordRecord[] } {
  let newStats = { ...stats };
  let newKeywords = [...keywords];

  for (const effect of paragraph.effects) {
    switch (effect.type) {
      case 'increase':
        if (effect.stat && effect.stat in newStats) {
          (newStats as any)[effect.stat] = Math.max(0, (newStats as any)[effect.stat] + effect.value);
        }
        break;
      case 'decrease':
        if (effect.stat && effect.stat in newStats) {
          (newStats as any)[effect.stat] = Math.max(0, (newStats as any)[effect.stat] - effect.value);
        }
        break;
      case 'add_medkit':
        newStats.medkits += effect.value;
        break;
      case 'remove_medkit':
        newStats.medkits = Math.max(0, newStats.medkits - effect.value);
        break;
      case 'set_health':
        newStats.health = effect.value;
        break;
      case 'use_medkit':
        newStats.medkits = Math.max(0, newStats.medkits - (effect.value || 1));
        break;
    }
  }

  for (const kw of paragraph.keywords) {
    newKeywords = addKeyword(newKeywords, kw);
  }

  for (const kw of paragraph.keywordRemoves) {
    newKeywords = removeKeyword(newKeywords, kw);
  }

  // Health can't exceed max
  newStats.health = Math.min(newStats.health, newStats.maxHealth);

  return { stats: newStats, keywords: newKeywords };
}

export const useGameStore = create<GameState>((set, get) => ({
  currentParagraph: data.metadata.startParagraph,
  stats: makeInitialStats(),
  keywords: [],
  history: [],
  phase: 'title',
  gameStartTime: null,
  readerMode: false,

  setPhase: (phase) => set({ phase }),

  distributePoints: (stat, amount) => {
    const { stats } = get();
    if (!data.metadata.distributeStats.includes(stat)) return;
    const newStats = { ...stats };
    (newStats as any)[stat] = Math.max(0, (newStats as any)[stat] + amount);
    set({ stats: newStats });
  },

  startGame: () => {
    const { stats } = get();
    set({
      phase: 'playing',
      currentParagraph: data.metadata.startParagraph,
      stats: { ...stats, maxHealth: stats.health },
      keywords: [],
      history: [],
      gameStartTime: Date.now(),
    });
  },

  goToParagraph: (paragraphId, choiceDescription) => {
    const { stats, keywords, history, readerMode } = get();
    const paragraph = getParagraph(paragraphId);
    if (!paragraph) return;

    // Apply effects
    const { stats: newStats, keywords: newKeywords } = applyEffects(stats, keywords, paragraph);

    // In reader mode, health can't go below 1
    if (readerMode && newStats.health <= 0) {
      newStats.health = 1;
    }

    const newHistory: HistoryEntry = {
      paragraphId,
      choiceDescription,
      timestamp: Date.now(),
      statsSnapshot: { ...newStats },
      keywordsSnapshot: newKeywords.map(k => ({ ...k })),
    };

    // Check death — skip in reader mode
    if (!readerMode && newStats.health <= 0) {
      set({
        currentParagraph: paragraphId,
        stats: newStats,
        keywords: newKeywords,
        history: [...history, newHistory],
        phase: 'dead',
      });
      return;
    }

    // Check victory — paragraph with no choices and no conditional choices
    if (paragraph.choices.length === 0 && paragraph.conditionalChoices.length === 0) {
      set({
        currentParagraph: paragraphId,
        stats: newStats,
        keywords: newKeywords,
        history: [...history, newHistory],
        phase: 'victory',
      });
      return;
    }

    set({
      currentParagraph: paragraphId,
      stats: newStats,
      keywords: newKeywords,
      history: [...history, newHistory],
      phase: 'playing',
    });

    // Auto-save
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentParagraph: paragraphId,
        stats: newStats,
        keywords: newKeywords,
        history: [...history, newHistory],
      }));
    } catch {}
  },

  goBackInHistory: (index) => {
    const { history } = get();
    if (index < 0 || index >= history.length) return;
    const entry = history[index];
    if (!entry) return;
    
    // Truncate history to this point (keep the entry at index)
    const newHistory = history.slice(0, index + 1);
    
    set({
      currentParagraph: entry.paragraphId,
      stats: entry.statsSnapshot ? { ...entry.statsSnapshot } : get().stats,
      keywords: entry.keywordsSnapshot ? entry.keywordsSnapshot.map(k => ({ ...k })) : get().keywords,
      history: newHistory,
      phase: 'playing',
    });
    
    // Auto-save
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentParagraph: entry.paragraphId,
        stats: entry.statsSnapshot || get().stats,
        keywords: entry.keywordsSnapshot || get().keywords,
        history: newHistory,
        gameStartTime: get().gameStartTime,
      }));
    } catch {}
  },

  useMedkit: () => {
    const { stats } = get();
    if (stats.medkits <= 0) return;
    if (stats.health >= stats.maxHealth) return;
    const newStats = {
      ...stats,
      medkits: stats.medkits - 1,
      health: Math.min(stats.maxHealth, stats.health + data.metadata.medkitHeal),
    };
    set({ stats: newStats });
  },

  resetGame: () => {
    set({
      currentParagraph: data.metadata.startParagraph,
      stats: makeInitialStats(),
      keywords: [],
      history: [],
      phase: 'title',
      gameStartTime: null,
      readerMode: false,
    });
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  },

  loadGame: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return false;
      const parsed = JSON.parse(saved);
      set({
        currentParagraph: parsed.currentParagraph,
        stats: parsed.stats,
        keywords: parsed.keywords,
        history: parsed.history,
        phase: 'playing',
        gameStartTime: parsed.gameStartTime || null,
      });
      return true;
    } catch {
      return false;
    }
  },

  toggleReaderMode: () => {
    const { readerMode } = get();
    set({ readerMode: !readerMode });
  },
}));

// Selector: get current paragraph data
export function useCurrentParagraph() {
  const currentId = useGameStore(s => s.currentParagraph);
  return getParagraph(currentId);
}

export { data as gameData };