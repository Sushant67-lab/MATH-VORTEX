/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Award, Flame, Zap, Timer, Rocket, Swords, Crown, Target, ShieldAlert, Sparkles, RotateCcw, Cloud, KeyRound } from 'lucide-react';
import { PlayerStats } from '../types/math';
import { ACHIEVEMENTS, getRankTitle, savePlayerProfile } from '../utils/storage';
import { soundFx } from '../utils/audio';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerProfile: PlayerStats;
  onUpdateProfile: (profile: PlayerStats) => void;
  onOpenSaveData: () => void;
}

const BADGE_ICONS: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-5 h-5 text-amber-400" />,
  Flame: <Flame className="w-5 h-5 text-orange-400" />,
  Zap: <Zap className="w-5 h-5 text-yellow-400" />,
  Timer: <Timer className="w-5 h-5 text-cyan-400" />,
  Rocket: <Rocket className="w-5 h-5 text-rose-400" />,
  Swords: <Swords className="w-5 h-5 text-purple-400" />,
  Crown: <Crown className="w-5 h-5 text-amber-300" />,
  Target: <Target className="w-5 h-5 text-emerald-400" />,
  ShieldAlert: <ShieldAlert className="w-5 h-5 text-indigo-400" />,
  Award: <Award className="w-5 h-5 text-cyan-300" />,
};

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  playerProfile,
  onUpdateProfile,
  onOpenSaveData,
}) => {
  if (!isOpen) return null;

  const rank = getRankTitle(playerProfile.level);
  const currentLevelXP = playerProfile.xp % 150;
  const xpProgress = Math.min(100, Math.round((currentLevelXP / 150) * 100));

  const accuracy =
    playerProfile.totalQuestionsAnswered > 0
      ? Math.round((playerProfile.totalCorrect / playerProfile.totalQuestionsAnswered) * 100)
      : 0;

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all your stats and high scores?')) {
      const resetProfile: PlayerStats = {
        playerName: playerProfile.playerName || 'MathScholar',
        saveKey: playerProfile.saveKey,
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
        topicMastery: {
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
        },
      };
      savePlayerProfile(resetProfile);
      onUpdateProfile(resetProfile);
      soundFx.playClick();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white">Student Scholar Profile</span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-cyan-400 font-mono">Ages 10–20 Arena</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
                onOpenSaveData();
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 rounded-lg text-xs font-semibold text-cyan-300 transition-colors"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Save / Sync</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Level & Rank Banner */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-lg font-mono">
                {playerProfile.level}
              </div>
              <div>
                <div className="text-xs text-slate-400">Player: <span className="text-white font-bold">{playerProfile.playerName}</span></div>
                <div className="text-lg font-bold text-white">{rank}</div>
                <div className="text-[11px] text-cyan-400 font-mono flex items-center gap-1 mt-0.5">
                  <KeyRound className="w-3 h-3" />
                  <span>Key: {playerProfile.saveKey}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Total XP</div>
              <div className="text-base font-mono font-bold text-cyan-400">{playerProfile.xp} XP</div>
            </div>
          </div>

          {/* XP Progress to Next Level */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Progress to Level {playerProfile.level + 1}</span>
              <span className="font-mono">{xpProgress}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Performance Metrics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="font-mono text-xl font-bold text-white tabular-nums">
                  {playerProfile.totalCorrect} / {playerProfile.totalQuestionsAnswered}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Problems Solved</div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="font-mono text-xl font-bold text-cyan-400 tabular-nums">
                  {accuracy}%
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Accuracy</div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="font-mono text-xl font-bold text-amber-400 tabular-nums">
                  {playerProfile.highestStreak}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Best Streak</div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="font-mono text-xl font-bold text-emerald-400 tabular-nums">
                  {playerProfile.sprintHighScore}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Sprint Best</div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Achievements & Medals
              </h4>
              <span className="text-xs font-mono text-slate-400">
                {playerProfile.unlockedBadges.length} / {ACHIEVEMENTS.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACHIEVEMENTS.map(ach => {
                const isUnlocked = playerProfile.unlockedBadges.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                      isUnlocked
                        ? 'border-slate-700 bg-slate-800/60 text-white'
                        : 'border-slate-800/40 bg-slate-950/30 text-slate-500 opacity-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-center shrink-0">
                      {BADGE_ICONS[ach.icon] || <Award className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{ach.name}</div>
                      <div className="text-[11px] text-slate-400 leading-tight">{ach.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetData}
              className="text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Stats</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
                onOpenSaveData();
              }}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Save / Restore Center</span>
            </button>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
