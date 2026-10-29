/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AgeTier = 'junior' | 'senior' | 'apex';

export interface TierInfo {
  id: AgeTier;
  label: string;
  ageRange: string;
  gradeLevel: string;
  description: string;
  topics: string[];
}

export type MathTopic =
  | 'arithmetic'
  | 'fractions'
  | 'pre_algebra'
  | 'algebra'
  | 'quadratics'
  | 'geometry'
  | 'trigonometry'
  | 'exponents'
  | 'calculus'
  | 'logarithms'
  | 'probability'
  | 'matrices';

export interface MathQuestion {
  id: string;
  tier: AgeTier;
  topic: MathTopic;
  topicLabel: string;
  prompt: string;
  displayMath?: string; // Rich formatted math expression if applicable
  options: string[];
  correctAnswer: string;
  explanation: string[]; // Step-by-step breakdown
  difficulty: 'easy' | 'medium' | 'hard';
  hint: string;
}

export type GameMode = 'sprint' | 'duel' | 'target24' | 'boss_rush' | 'practice';

export interface BotOpponent {
  id: 'byte' | 'turing' | 'euler';
  name: string;
  title: string;
  avatarSeed: string;
  accuracy: number; // 0 to 1
  minResponseTimeMs: number;
  maxResponseTimeMs: number;
  color: string;
}

export interface BossLevel {
  id: number;
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  tier: AgeTier;
  topics: MathTopic[];
  description: string;
  specialTrait: string;
  lore: string;
  iconName: string;
}

export interface PlayerStats {
  playerName: string;
  saveKey: string;
  lastSaved: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  currentStreak: number;
  highestStreak: number;
  sprintHighScore: number;
  duelsWon: number;
  duelsPlayed: number;
  target24Solved: number;
  bossesDefeated: number;
  xp: number;
  level: number;
  unlockedBadges: string[];
  topicMastery: Record<MathTopic, { correct: number; total: number }>;
}

export interface SavedSlotSummary {
  playerName: string;
  saveKey: string;
  level: number;
  sprintHighScore: number;
  xp: number;
  lastSaved: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}
