/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameMode, PlayerStats } from './types/math';
import { loadPlayerProfile, savePlayerProfile } from './utils/storage';
import { soundFx } from './utils/audio';
import { Header } from './components/Header';
import { SpeedSprint } from './components/SpeedSprint';
import { MathDuel } from './components/MathDuel';
import { Target24Game } from './components/Target24Game';
import { BossRush } from './components/BossRush';
import { PracticeLab } from './components/PracticeLab';
import { ScratchpadModal } from './components/ScratchpadModal';
import { ProfileModal } from './components/ProfileModal';
import { SaveDataModal } from './components/SaveDataModal';
import { Edit3, CheckCircle2, Cloud, X } from 'lucide-react';

export default function App() {
  const [currentMode, setCurrentMode] = useState<GameMode>('sprint');
  const [playerProfile, setPlayerProfile] = useState<PlayerStats>(() => loadPlayerProfile());
  const [isScratchpadOpen, setIsScratchpadOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundFx.getMuted());
  const [showWelcomeBack, setShowWelcomeBack] = useState<boolean>(false);

  // Check if returning user with prior activity
  useEffect(() => {
    if (playerProfile.totalQuestionsAnswered > 0 || playerProfile.sprintHighScore > 0) {
      setShowWelcomeBack(true);
      const timer = setTimeout(() => setShowWelcomeBack(false), 8000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectMode = (mode: GameMode) => {
    setCurrentMode(mode);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* 3-Zone Navigation Header */}
      <Header
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        playerProfile={playerProfile}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSaveData={() => setIsSaveModalOpen(true)}
        onOpenScratchpad={() => setIsScratchpadOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Returning User Notification Banner */}
      {showWelcomeBack && (
        <div className="bg-cyan-950/40 border-b border-cyan-800/40 px-4 py-2 text-xs transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-cyan-200">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Welcome back, <strong className="text-white">{playerProfile.playerName}</strong>! Saved high score of{' '}
                <strong className="text-cyan-300 font-mono">{playerProfile.sprintHighScore} pts</strong> and Level{' '}
                <strong className="text-cyan-300 font-mono">{playerProfile.level}</strong> successfully loaded.
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setIsSaveModalOpen(true);
                }}
                className="text-cyan-300 hover:text-white underline font-semibold transition-colors flex items-center gap-1"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Save / Switch</span>
              </button>
              <button
                onClick={() => setShowWelcomeBack(false)}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-4 sm:py-6">
        {currentMode === 'sprint' && (
          <SpeedSprint
            playerProfile={playerProfile}
            onUpdateProfile={setPlayerProfile}
            onOpenScratchpad={() => setIsScratchpadOpen(true)}
          />
        )}

        {currentMode === 'duel' && (
          <MathDuel
            playerProfile={playerProfile}
            onUpdateProfile={setPlayerProfile}
            onOpenScratchpad={() => setIsScratchpadOpen(true)}
          />
        )}

        {currentMode === 'target24' && (
          <Target24Game
            playerProfile={playerProfile}
            onUpdateProfile={setPlayerProfile}
            onOpenScratchpad={() => setIsScratchpadOpen(true)}
          />
        )}

        {currentMode === 'boss_rush' && (
          <BossRush
            playerProfile={playerProfile}
            onUpdateProfile={setPlayerProfile}
            onOpenScratchpad={() => setIsScratchpadOpen(true)}
          />
        )}

        {currentMode === 'practice' && (
          <PracticeLab
            playerProfile={playerProfile}
            onUpdateProfile={setPlayerProfile}
            onOpenScratchpad={() => setIsScratchpadOpen(true)}
          />
        )}
      </main>

      {/* Floating Buttons: Save/Cloud & Scratchpad */}
      <div className="fixed bottom-5 right-5 z-30 flex items-center gap-2">
        <button
          onClick={() => {
            soundFx.playClick();
            setIsSaveModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-slate-700/80 rounded-full shadow-xl backdrop-blur transition-all hover:scale-105 active:scale-95 text-xs font-semibold"
          title="Save or Load Scores"
        >
          <Cloud className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Save Progress</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setIsScratchpadOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-full shadow-xl backdrop-blur transition-all hover:scale-105 active:scale-95 text-xs font-semibold"
          title="Open Calculation Scratchpad"
        >
          <Edit3 className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Scratchpad</span>
        </button>
      </div>

      {/* Scratchpad Whiteboard Canvas Modal */}
      <ScratchpadModal
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
      />

      {/* Profile & Stats Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        playerProfile={playerProfile}
        onUpdateProfile={setPlayerProfile}
        onOpenSaveData={() => setIsSaveModalOpen(true)}
      />

      {/* Save & Load Data Center Modal */}
      <SaveDataModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        playerProfile={playerProfile}
        onUpdateProfile={setPlayerProfile}
      />

      {/* Clean Quiet Footer adhering to Anti-Slop Guidelines */}
      <footer className="mt-auto border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-1.5">
          <span>MathVortex Arena</span>
          <span aria-hidden="true">·</span>
          <span>Junior (Ages 10–12)</span>
          <span aria-hidden="true">·</span>
          <span>Senior (Ages 13–16)</span>
          <span aria-hidden="true">·</span>
          <span>Apex (Ages 17–20)</span>
          <span aria-hidden="true">·</span>
          <button
            onClick={() => {
              soundFx.playClick();
              setIsSaveModalOpen(true);
            }}
            className="text-cyan-400 hover:underline"
          >
            Save Data
          </button>
        </div>
        <div className="text-slate-400 text-[11px]">
          Procedural Problem Synthesis · Persistent Score Syncing · In-Browser Scratchpad Whiteboard
        </div>
      </footer>
    </div>
  );
}
