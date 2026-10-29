/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Target, RotateCcw, HelpCircle, CheckCircle2, ChevronRight, Eye } from 'lucide-react';
import { CURATED_24_PUZZLES, safeEvaluate, validateNumbersUsed } from '../utils/target24Solver';
import { soundFx } from '../utils/audio';
import { PlayerStats } from '../types/math';
import { addXP } from '../utils/storage';

interface Target24GameProps {
  playerProfile: PlayerStats;
  onUpdateProfile: (profile: PlayerStats) => void;
  onOpenScratchpad: () => void;
}

export const Target24Game: React.FC<Target24GameProps> = ({
  playerProfile,
  onUpdateProfile,
  onOpenScratchpad,
}) => {
  const [puzzleIndex, setPuzzleIndex] = useState<number>(0);
  const [expression, setExpression] = useState<string>('');
  const [usedTileIndices, setUsedTileIndices] = useState<number[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showSolution, setShowSolution] = useState<boolean>(false);

  const currentPuzzle = CURATED_24_PUZZLES[puzzleIndex % CURATED_24_PUZZLES.length];

  // Live evaluation of current expression
  const evalResult = expression ? safeEvaluate(expression) : { val: null };

  const handleTileClick = (num: number, index: number) => {
    if (usedTileIndices.includes(index)) return;
    soundFx.playClick();
    setUsedTileIndices(prev => [...prev, index]);
    setExpression(prev => (prev ? `${prev} ${num}` : `${num}`));
    setStatusMessage(null);
  };

  const handleOperatorClick = (op: string) => {
    soundFx.playClick();
    setExpression(prev => (prev ? `${prev} ${op}` : `${op}`));
    setStatusMessage(null);
  };

  const handleBackspace = () => {
    soundFx.playClick();
    setStatusMessage(null);
    if (!expression) return;

    // Check if removing a number tile to free up usedTileIndices
    const tokens = expression.trim().split(/\s+/);
    const lastToken = tokens.pop();

    if (lastToken && /^\d+$/.test(lastToken)) {
      const numVal = parseInt(lastToken, 10);
      // Remove last matching tile from usedTileIndices
      for (let i = usedTileIndices.length - 1; i >= 0; i--) {
        const tileIdx = usedTileIndices[i];
        if (currentPuzzle.numbers[tileIdx] === numVal) {
          setUsedTileIndices(prev => prev.filter((_, idx) => idx !== i));
          break;
        }
      }
    }

    setExpression(tokens.join(' '));
  };

  const handleClear = () => {
    soundFx.playClick();
    setExpression('');
    setUsedTileIndices([]);
    setStatusMessage(null);
  };

  const handleVerify = () => {
    if (!expression) {
      setStatusMessage({ text: 'Build an expression first!', type: 'error' });
      soundFx.playWrong();
      return;
    }

    // 1. Verify numbers used
    const validUsage = validateNumbersUsed(expression, currentPuzzle.numbers);
    if (!validUsage) {
      setStatusMessage({
        text: 'You must use each of the 4 given numbers exactly once!',
        type: 'error',
      });
      soundFx.playWrong();
      return;
    }

    // 2. Evaluate expression
    const res = safeEvaluate(expression);
    if (res.val === null) {
      setStatusMessage({ text: res.error || 'Invalid mathematical expression', type: 'error' });
      soundFx.playWrong();
      return;
    }

    // Check if value equals target (tolerance for float fractions like 24.0000001)
    if (Math.abs(res.val - currentPuzzle.target) < 1e-6) {
      soundFx.playVictory();
      setStatusMessage({
        text: `Target Reached! (${expression} = ${currentPuzzle.target})`,
        type: 'success',
      });

      // Update XP & Stats
      const updated: PlayerStats = {
        ...playerProfile,
        target24Solved: playerProfile.target24Solved + 1,
      };
      if (updated.target24Solved >= 3 && !updated.unlockedBadges.includes('target24_pro')) {
        updated.unlockedBadges.push('target24_pro');
      }
      const { profile } = addXP(updated, 150);
      onUpdateProfile(profile);
    } else {
      soundFx.playWrong();
      setStatusMessage({
        text: `Equals ${Number(res.val.toFixed(2))}, not ${currentPuzzle.target}. Keep tweaking!`,
        type: 'error',
      });
    }
  };

  const handleNextPuzzle = () => {
    soundFx.playClick();
    setExpression('');
    setUsedTileIndices([]);
    setStatusMessage(null);
    setShowHint(false);
    setShowSolution(false);
    setPuzzleIndex(prev => (prev + 1) % CURATED_24_PUZZLES.length);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 flex items-center justify-center gap-2">
          <Target className="w-7 h-7 text-cyan-400" />
          <span>Target 24 Crafter</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Use all 4 given numbers and operations (+, −, ×, ÷, brackets) to forge an equation that equals 24.
        </p>
      </div>

      {/* Puzzle Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl mb-6">
        {/* Card Header */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-6 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-mono text-cyan-400 font-bold">Puzzle #{puzzleIndex + 1}</span>
            <span>·</span>
            <span className="capitalize">{currentPuzzle.difficulty}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Hint</span>
            </button>
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Solution</span>
            </button>
            <button
              onClick={onOpenScratchpad}
              className="text-slate-400 hover:text-cyan-300 transition-colors"
            >
              Scratchpad
            </button>
          </div>
        </div>

        {/* Hint / Solution Reveal boxes */}
        {showHint && (
          <div className="p-3 mb-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200">
            <span className="font-semibold mr-1">Strategic Hint:</span> {currentPuzzle.hint}
          </div>
        )}
        {showSolution && (
          <div className="p-3 mb-4 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-200 font-mono">
            <span className="font-semibold mr-1">Formula:</span> {currentPuzzle.solution}
          </div>
        )}

        {/* 4 Number Cards */}
        <div className="grid grid-cols-4 gap-3 sm:gap-4 mb-8">
          {currentPuzzle.numbers.map((num, idx) => {
            const isUsed = usedTileIndices.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleTileClick(num, idx)}
                disabled={isUsed}
                className={`py-5 sm:py-6 rounded-xl border font-mono text-2xl sm:text-3xl font-extrabold flex flex-col items-center justify-center transition-all ${
                  isUsed
                    ? 'border-slate-800/40 bg-slate-950/30 text-slate-600 opacity-40 cursor-not-allowed scale-95'
                    : 'border-slate-700 bg-slate-800/90 text-white hover:border-cyan-400 hover:bg-slate-700/80 shadow-md cursor-pointer hover:scale-105 active:scale-95'
                }`}
              >
                <span>{num}</span>
                <span className="text-[10px] font-sans font-normal text-slate-400 mt-1">
                  {isUsed ? 'Used' : 'Tap to use'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Formula Workspace Display */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border border-slate-800 rounded-xl mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Your Formula</span>
            <div className="font-mono">
              Live Value:{' '}
              <span className={`font-bold ${evalResult.val === 24 ? 'text-emerald-400' : 'text-slate-200'}`}>
                {evalResult.val !== null ? evalResult.val : '—'}
              </span>
            </div>
          </div>

          <div className="min-h-[52px] flex items-center justify-center font-mono text-xl sm:text-2xl text-cyan-300 font-bold tracking-wider">
            {expression || <span className="text-slate-600 text-sm">Select number tiles and operators below...</span>}
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3 mb-6 rounded-xl text-xs font-medium text-center ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-300'
                : 'bg-rose-950/40 border border-rose-800/50 text-rose-300'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Operator Controls */}
        <div className="grid grid-cols-6 gap-2 mb-6">
          {[
            { label: '+', op: '+' },
            { label: '−', op: '-' },
            { label: '×', op: '×' },
            { label: '÷', op: '÷' },
            { label: '(', op: '(' },
            { label: ')', op: ')' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => handleOperatorClick(item.op)}
              className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700/80 rounded-xl font-mono text-lg font-bold text-white transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackspace}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Backspace
            </button>
            <button
              onClick={handleClear}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleVerify}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm rounded-lg shadow-md shadow-cyan-500/20 transition-all hover:scale-105"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify = 24</span>
            </button>

            <button
              onClick={handleNextPuzzle}
              className="flex items-center gap-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium rounded-lg transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats footer strip */}
      <div className="text-center text-xs text-slate-400">
        Total Solved: <span className="font-mono font-bold text-white">{playerProfile.target24Solved}</span> puzzles
      </div>
    </div>
  );
};
