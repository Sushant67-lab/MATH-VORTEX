/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, User, Edit3, Cloud } from 'lucide-react';
import { GameMode, PlayerStats } from '../types/math';
import { soundFx } from '../utils/audio';
import { getRankTitle } from '../utils/storage';

interface HeaderProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  playerProfile: PlayerStats;
  onOpenProfile: () => void;
  onOpenSaveData: () => void;
  onOpenScratchpad: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  playerProfile,
  onOpenProfile,
  onOpenSaveData,
  onOpenScratchpad,
  isMuted,
  onToggleMute,
}) => {
  const rank = getRankTitle(playerProfile.level);

  return (
    <header className="flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5 border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={() => {
          soundFx.playClick();
          onSelectMode('sprint');
        }}
        className="text-lg sm:text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
        <span>MathVortex</span>
      </button>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => {
            soundFx.playClick();
            onSelectMode('sprint');
          }}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 relative ${
            currentMode === 'sprint' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Speed Sprint
          {currentMode === 'sprint' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            onSelectMode('duel');
          }}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 relative ${
            currentMode === 'duel' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          AI Math Duel
          {currentMode === 'duel' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            onSelectMode('target24');
          }}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 relative ${
            currentMode === 'target24' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Target 24
          {currentMode === 'target24' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            onSelectMode('boss_rush');
          }}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 relative ${
            currentMode === 'boss_rush' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Formula Dungeons
          {currentMode === 'boss_rush' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            onSelectMode('practice');
          }}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 relative ${
            currentMode === 'practice' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Practice Lab
          {currentMode === 'practice' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
          )}
        </button>
      </nav>

      {/* Zone 3: 1 primary action + toolbar controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenScratchpad();
          }}
          className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="Open Scratchpad"
        >
          <Edit3 className="w-4 h-4" />
          <span className="hidden lg:inline">Scratchpad</span>
        </button>

        <button
          onClick={onToggleMute}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Save / Sync Progress Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenSaveData();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 rounded-lg text-xs font-semibold text-cyan-300 transition-colors whitespace-nowrap"
          title="Save or Load Scores"
        >
          <Cloud className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Save Progress</span>
        </button>

        {/* Player Profile & Rank */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenProfile();
          }}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/60 rounded-lg text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0"
        >
          <div className="w-5 h-5 rounded-full bg-cyan-600/60 text-cyan-300 flex items-center justify-center font-bold text-[11px]">
            {playerProfile.level}
          </div>
          <span className="hidden sm:inline max-w-[100px] truncate">{playerProfile.playerName}</span>
          <User className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </header>
  );
};
