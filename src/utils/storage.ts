/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Achievement, MathTopic, PlayerStats, SavedSlotSummary } from '../types/math';

const STORAGE_KEY = 'mathvortex_player_profile';
const SLOTS_STORAGE_KEY = 'mathvortex_saved_slots';

const INITIAL_TOPIC_MASTERY: Record<MathTopic, { correct: number; total: number }> = {
  arithmetic: { correct: 0, total: 0 },
  fractions: { correct: 0, total: 0 },
  pre_algebra: { correct: 0, total: 0 },
  algebra: { correct: 0, total: 0 },
  quadratics: { correct: 0, total: 0 },
  geometry: { correct: 0, total: 0 },
  trigonometry: { correct: 0, total: 0 },
  exponents: { correct: 0, total: 0 },
  calculus: { correct: 0, total: 0 },
  logarithms: { correct: 0, total: 0 },
  probability: { correct: 0, total: 0 },
  matrices: { correct: 0, total: 0 },
};

function generateSaveKey(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `VTX-${num}`;
}

const DEFAULT_PROFILE: PlayerStats = {
  playerName: 'MathScholar',
  saveKey: 'VTX-1001',
  lastSaved: Date.now(),
  totalQuestionsAnswered: 0,
  totalCorrect: 0,
  currentStreak: 0,
  highestStreak: 0,
  sprintHighScore: 0,
  duelsWon: 0,
  duelsPlayed: 0,
  target24Solved: 0,
  bossesDefeated: 0,
  xp: 0,
  level: 1,
  unlockedBadges: [],
  topicMastery: INITIAL_TOPIC_MASTERY,
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_blood', name: 'First Step', description: 'Solve your first math problem', icon: 'Sparkles' },
  { id: 'streak_5', name: 'Hot Streak', description: 'Achieve a 5-question answer streak', icon: 'Flame' },
  { id: 'streak_10', name: 'Flawless Flow', description: 'Achieve a 10-question answer streak', icon: 'Zap' },
  { id: 'sprint_10', name: 'Rapid Mind', description: 'Score at least 10 in a Speed Sprint', icon: 'Timer' },
  { id: 'sprint_20', name: 'Speed Demon', description: 'Score at least 20 in a Speed Sprint', icon: 'Rocket' },
  { id: 'duel_winner', name: 'Battle Victor', description: 'Win an AI Math Duel', icon: 'Swords' },
  { id: 'euler_defeated', name: 'Grandmaster Slayer', description: 'Defeat Grandmaster Euler Bot', icon: 'Crown' },
  { id: 'target24_pro', name: 'Target 24 Crafter', description: 'Solve 3 Target 24 puzzles', icon: 'Target' },
  { id: 'boss_slayer', name: 'Titan Challenger', description: 'Defeat a Dungeon Boss', icon: 'ShieldAlert' },
  { id: 'level_5', name: 'Math Prodigy', description: 'Reach Level 5 rank', icon: 'Award' },
];

export function getRankTitle(level: number): string {
  if (level >= 15) return 'Grand Fields Medalist';
  if (level >= 12) return 'Integral Master';
  if (level >= 9) return 'Calculus Vanguard';
  if (level >= 6) return 'Algebraic Voyager';
  if (level >= 3) return 'Number Crafter';
  return 'Math Apprentice';
}

export function loadPlayerProfile(): PlayerStats {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = { ...DEFAULT_PROFILE, saveKey: generateSaveKey(), lastSaved: Date.now() };
      savePlayerProfile(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      playerName: parsed.playerName || 'MathScholar',
      saveKey: parsed.saveKey || generateSaveKey(),
      lastSaved: parsed.lastSaved || Date.now(),
      topicMastery: {
        ...INITIAL_TOPIC_MASTERY,
        ...(parsed.topicMastery || {}),
      },
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function getSavedSlots(): SavedSlotSummary[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SLOTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function updateSavedSlotsList(profile: PlayerStats) {
  if (typeof window === 'undefined') return;
  try {
    const slots = getSavedSlots();
    const updated = slots.filter(s => s.saveKey !== profile.saveKey && s.playerName.toLowerCase() !== profile.playerName.toLowerCase());
    updated.unshift({
      playerName: profile.playerName,
      saveKey: profile.saveKey,
      level: profile.level,
      sprintHighScore: profile.sprintHighScore,
      xp: profile.xp,
      lastSaved: profile.lastSaved,
    });
    // Keep max 8 local slots
    localStorage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(updated.slice(0, 8)));
  } catch {
    // Ignore quota issues
  }
}

export function savePlayerProfile(profile: PlayerStats, syncToCloud: boolean = true): void {
  if (typeof window === 'undefined') return;
  try {
    const withTimestamp = {
      ...profile,
      lastSaved: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp));
    // Also save in full slot storage
    localStorage.setItem(`mathvortex_slot_${withTimestamp.saveKey}`, JSON.stringify(withTimestamp));
    updateSavedSlotsList(withTimestamp);

    // Background sync to backend if online
    if (syncToCloud) {
      saveProfileToCloud(withTimestamp).catch(() => {
        // Silently tolerate if offline
      });
    }
  } catch {
    // Storage might be quota exceeded
  }
}

export async function saveProfileToCloud(profile: PlayerStats): Promise<{ success: boolean; message: string; timestamp?: number; saveKey?: string }> {
  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: profile.playerName,
        saveKey: profile.saveKey,
        profile,
      }),
    });
    if (!res.ok) {
      return { success: true, message: 'Saved to device storage.' };
    }
    const data = await res.json();
    return data;
  } catch {
    return { success: true, message: 'Saved to device storage.' };
  }
}

export async function loadProfileFromCloud(query: string): Promise<{ success: boolean; profile?: PlayerStats; message: string }> {
  try {
    const res = await fetch(`/api/load/${encodeURIComponent(query.trim())}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.profile) {
        const loadedProfile: PlayerStats = {
          ...DEFAULT_PROFILE,
          ...data.profile,
          playerName: data.profile.playerName || query,
          saveKey: data.profile.saveKey || generateSaveKey(),
          lastSaved: data.lastSaved || Date.now(),
          topicMastery: {
            ...INITIAL_TOPIC_MASTERY,
            ...(data.profile.topicMastery || {}),
          },
        };
        savePlayerProfile(loadedProfile, false);
        return { success: true, profile: loadedProfile, message: `Loaded score for ${loadedProfile.playerName}!` };
      }
    }
  } catch {
    // Silently fall back to local device storage
  }

  // Fallback: check local slots
  const local = loadProfileFromLocalSlot(query);
  if (local) {
    savePlayerProfile(local, false);
    return { success: true, profile: local, message: `Loaded score for ${local.playerName} from device storage!` };
  }
  return { success: false, message: `No saved profile found for "${query}". Check spelling or Save Key.` };
}

export function loadProfileFromLocalSlot(query: string): PlayerStats | null {
  if (typeof window === 'undefined') return null;
  try {
    const qLower = query.trim().toLowerCase();
    const qUpper = query.trim().toUpperCase();

    // Direct slot key
    const byKey = localStorage.getItem(`mathvortex_slot_${qUpper}`);
    if (byKey) return JSON.parse(byKey);

    // Search through slots
    const slots = getSavedSlots();
    const matchedSlot = slots.find(
      s => s.saveKey.toUpperCase() === qUpper || s.playerName.toLowerCase() === qLower
    );

    if (matchedSlot) {
      const data = localStorage.getItem(`mathvortex_slot_${matchedSlot.saveKey}`);
      if (data) return JSON.parse(data);
    }
    return null;
  } catch {
    return null;
  }
}

export function exportProfileToFile(profile: PlayerStats) {
  try {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const cleanName = profile.playerName.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadAnchor.setAttribute('download', `mathvortex_save_${cleanName}_${profile.saveKey}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error('Failed to export save file:', err);
  }
}

export function generateSaveCode(profile: PlayerStats): string {
  try {
    const json = JSON.stringify(profile);
    if (typeof window !== 'undefined' && window.btoa) {
      return window.btoa(encodeURIComponent(json));
    }
    return Buffer.from(encodeURIComponent(json)).toString('base64');
  } catch {
    return '';
  }
}

export function restoreFromSaveCode(code: string): PlayerStats | null {
  try {
    let json = '';
    if (typeof window !== 'undefined' && window.atob) {
      json = decodeURIComponent(window.atob(code.trim()));
    } else {
      json = decodeURIComponent(Buffer.from(code.trim(), 'base64').toString('utf-8'));
    }
    return parseProfileFromFile(json);
  } catch {
    return null;
  }
}

export function parseProfileFromFile(fileContent: string): PlayerStats | null {
  try {
    const parsed = JSON.parse(fileContent);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      playerName: parsed.playerName || 'MathScholar',
      saveKey: parsed.saveKey || generateSaveKey(),
      lastSaved: Date.now(),
      topicMastery: {
        ...INITIAL_TOPIC_MASTERY,
        ...(parsed.topicMastery || {}),
      },
    };
  } catch {
    return null;
  }
}

export function addXP(profile: PlayerStats, earnedXP: number): { profile: PlayerStats; leveledUp: boolean } {
  const newXP = profile.xp + earnedXP;
  // XP per level = level * 150
  const xpForNextLevel = profile.level * 150;
  let newLevel = profile.level;
  let leveledUp = false;

  if (newXP >= xpForNextLevel) {
    newLevel += 1;
    leveledUp = true;
  }

  const updated: PlayerStats = {
    ...profile,
    xp: newXP,
    level: newLevel,
    lastSaved: Date.now(),
  };

  savePlayerProfile(updated);
  return { profile: updated, leveledUp };
}

export function recordAnswer(
  profile: PlayerStats,
  topic: MathTopic,
  isCorrect: boolean
): { profile: PlayerStats; newBadges: Achievement[] } {
  const newTotal = profile.totalQuestionsAnswered + 1;
  const newCorrect = profile.totalCorrect + (isCorrect ? 1 : 0);
  const newStreak = isCorrect ? profile.currentStreak + 1 : 0;
  const highestStreak = Math.max(profile.highestStreak, newStreak);

  const prevTopic = profile.topicMastery[topic] || { correct: 0, total: 0 };
  const updatedTopic = {
    correct: prevTopic.correct + (isCorrect ? 1 : 0),
    total: prevTopic.total + 1,
  };

  const updated: PlayerStats = {
    ...profile,
    totalQuestionsAnswered: newTotal,
    totalCorrect: newCorrect,
    currentStreak: newStreak,
    highestStreak,
    lastSaved: Date.now(),
    topicMastery: {
      ...profile.topicMastery,
      [topic]: updatedTopic,
    },
  };

  // Check achievements
  const unlocked = new Set(updated.unlockedBadges);
  const newBadges: Achievement[] = [];

  const checkBadge = (id: string, condition: boolean) => {
    if (condition && !unlocked.has(id)) {
      unlocked.add(id);
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (ach) newBadges.push(ach);
    }
  };

  checkBadge('first_blood', updated.totalCorrect >= 1);
  checkBadge('streak_5', updated.highestStreak >= 5);
  checkBadge('streak_10', updated.highestStreak >= 10);
  checkBadge('level_5', updated.level >= 5);

  updated.unlockedBadges = Array.from(unlocked);
  savePlayerProfile(updated);
  return { profile: updated, newBadges };
}
