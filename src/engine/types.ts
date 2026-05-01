// Types for the game engine

export interface GameStats {
  health: number;
  maxHealth: number;
  aura: number;
  agility: number;
  melee: number;
  stealth: number;
  medkits: number;
}

export interface Effect {
  type: 'increase' | 'decrease' | 'add_medkit' | 'remove_medkit' | 'use_medkit' | 'set_health';
  stat?: string;
  value: number;
}

export interface Choice {
  paragraph: number;
  description: string;
}

export interface ConditionalChoice {
  type: 'stat_check' | 'keyword_check' | 'any_keyword_check' | 'multi_stat_check' | 'visit_check' | 'dual_stat_check' | 'medkit_choice' | 'optional_action' | 'state_check' | 'scenario_check' | 'stat_and_keyword_count_check' | 'multi_keyword_branch';
  // Human-readable description (from parser)
  description?: string;
  // stat_check
  stat?: string;
  threshold?: number;
  operator?: 'gte' | 'lte' | 'eq';
  successParagraph?: number;
  failParagraph?: number;
  // keyword_check
  keyword?: string;
  hasParagraph?: number;
  missingParagraph?: number;
  // any_keyword_check
  keywords?: string[];
  // multi_stat_check
  conditions?: Array<{ stat: string; operator: string; threshold: number }>;
  // visit_check
  notVisitedParagraph?: number;
  visitedParagraph?: number;
  // dual_stat_check
  stat1?: string;
  threshold1?: number;
  stat2?: string;
  threshold2?: number;
  // medkit_choice
  refuseParagraph?: number;
  helpParagraph?: number;
  // optional_action
  yesParagraph?: number;
  noParagraph?: number;
  // state_check
  paragraph?: number;
  // scenario_check
  scenarios?: Array<{ description: string; paragraph: number }>;
  // stat_and_keyword_count_check
  statThreshold?: number;
  keywordMinCount?: number;
  // multi_keyword_branch
  branches?: Array<{ keyword: string; paragraph: number }>;
  noneParagraph?: number;
}

export interface Paragraph {
  id: number;
  title: string | null;
  text: string[];
  choices: Choice[];
  conditionalChoices: ConditionalChoice[];
  effects: Effect[];
  keywords: string[];
  keywordRemoves: string[];
}

export interface PrologueSection {
  tId: number;
  title: string;
  text: string[];
}

export interface GameMetadata {
  title: string;
  startingStats: GameStats;
  distributePoints: number;
  distributeStats: string[];
  maxHealth: number;
  medkitHeal: number;
  startParagraph: number;
  prologues: PrologueSection[];
}

export interface GameData {
  metadata: GameMetadata;
  paragraphs: Paragraph[];
}

export interface KeywordRecord {
  word: string;
  count: number;
}

export interface HistoryEntry {
  paragraphId: number;
  choiceDescription?: string;
  timestamp: number;
  /** Snapshot of stats at this point */
  statsSnapshot?: GameStats;
  /** Snapshot of keywords at this point */
  keywordsSnapshot?: KeywordRecord[];
}

export interface GameState {
  // Current state
  currentParagraph: number;
  stats: GameStats;
  keywords: KeywordRecord[];
  history: HistoryEntry[];
  phase: 'title' | 'setup' | 'prologue' | 'playing' | 'dead' | 'victory';
  gameStartTime: number | null;
  readerMode: boolean;
  gameHour: number; // 10Б.3 — Day/Night cycle hour (starts at 8, +1 per paragraph)
  
  // Actions
  setPhase: (phase: GameState['phase']) => void;
  distributePoints: (stat: keyof GameStats, amount: number) => void;
  startGame: () => void;
  goToParagraph: (paragraphId: number, choiceDescription?: string) => void;
  goBackInHistory: (index: number) => void;
  useMedkit: () => void;
  resetGame: () => void;
  loadGame: () => boolean;
  toggleReaderMode: () => void;
}