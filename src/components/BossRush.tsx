/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Skull, Heart, Shield, CheckCircle, RotateCcw } from 'lucide-react';
import { BossLevel, MathQuestion, PlayerStats } from '../types/math';
import { generateQuestion } from '../utils/mathGenerators';
import { soundFx } from '../utils/audio';
import { addXP, recordAnswer } from '../utils/storage';
import { MathDisplay } from './MathDisplay';

const DUNGEON_BOSSES: BossLevel[] = [
  {
    id: 1,
    name: 'The Integroid',
    title: 'Guardian of Negative Realities',
    hp: 60,
    maxHp: 60,
    tier: 'junior',
    topics: ['arithmetic', 'pre_algebra'],
    description: 'Masters negative numbers and order of operations. Never break PEMDAS.',
    specialTrait: 'Shields active against basic mental errors',
    lore: '"You think you know numbers? Let us invert your signs!"',
    iconName: 'MinusCircle',
  },
  {
    id: 2,
    name: 'The Parabola Hydra',
    title: 'Twin-Rooted Serpent',
    hp: 80,
    maxHp: 80,
    tier: 'senior',
    topics: ['quadratics', 'algebra'],
    description: 'Bends mathematics along parabolic curves. Cut down its dual roots.',
    specialTrait: 'Requires factoring quadratics accurately',
    lore: '"My curve touches the x-axis in two places. Name them or perish!"',
    iconName: 'Spline',
  },
  {
    id: 3,
    name: 'The Radical Golem',
    title: 'Titan of Fractional Exponents',
    hp: 90,
    maxHp: 90,
    tier: 'senior',
    topics: ['exponents'],
    description: 'Constructed from impenetrable square roots and nested power laws.',
    specialTrait: 'Resistant to unsimplified radicals',
    lore: '"Break me down to prime factors if you dare."',
    iconName: 'Boxes',
  },
  {
    id: 4,
    name: 'The Trigonometric Sphinx',
    title: 'Keeper of the Unit Circle',
    hp: 100,
    maxHp: 100,
    tier: 'senior',
    topics: ['trigonometry'],
    description: 'Ancient riddle master of sine waves and right angles.',
    specialTrait: 'Tests exact unit circle ratios',
    lore: '"Rotate through 2π radians. Where do you land?"',
    iconName: 'Compass',
  },
  {
    id: 5,
    name: 'The Calculus Colossus',
    title: 'Sovereign of Limits & Infinitesimals',
    hp: 120,
    maxHp: 120,
    tier: 'apex',
    topics: ['calculus', 'matrices'],
    description: 'Supreme entity ruling over continuous rates of change and dimensional space.',
    specialTrait: 'Derivatives and definite integrals required',
    lore: '"The slope at instantaneous time approaches zero... as does your hope!"',
    iconName: 'Atom',
  },
];

interface BossRushProps {
  playerProfile: PlayerStats;
  onUpdateProfile: (profile: PlayerStats) => void;
  onOpenScratchpad: () => void;
}

export const BossRush: React.FC<BossRushProps> = ({
  playerProfile,
  onUpdateProfile,
  onOpenScratchpad,
}) => {
  const [currentFloorIndex, setCurrentFloorIndex] = useState<number>(0);
  const [gameState, setGameState] = useState<'SELECT' | 'BATTLE' | 'VICTORY' | 'DEFEAT'>('SELECT');
  const [bossHp, setBossHp] = useState<number>(DUNGEON_BOSSES[0].hp);
  const [playerLives, setPlayerLives] = useState<number>(3);
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion | null>(null);
  const [isFeedback, setIsFeedback] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const currentBoss = DUNGEON_BOSSES[currentFloorIndex];

  const handleStartFloor = (floorIdx: number) => {
    soundFx.playClick();
    setCurrentFloorIndex(floorIdx);
    const boss = DUNGEON_BOSSES[floorIdx];
    setBossHp(boss.hp);
    setPlayerLives(3);
    setIsFeedback(false);
    setSelectedOption(null);

    const q = generateQuestion(boss.tier, boss.topics[Math.floor(Math.random() * boss.topics.length)]);
    setCurrentQuestion(q);
    setGameState('BATTLE');
  };

  const handleAnswer = (option: string) => {
    if (isFeedback || !currentQuestion || gameState !== 'BATTLE') return;

    setSelectedOption(option);
    setIsFeedback(true);
    const isCorrect = option === currentQuestion.correctAnswer;

    const { profile: updatedProfile } = recordAnswer(playerProfile, currentQuestion.topic, isCorrect);
    onUpdateProfile(updatedProfile);

    if (isCorrect) {
      soundFx.playCorrect();
      const damage = 25;
      const nextHp = Math.max(0, bossHp - damage);
      setBossHp(nextHp);

      if (nextHp <= 0) {
        // Boss Defeated!
        setTimeout(() => {
          soundFx.playVictory();
          setGameState('VICTORY');
          const xp = (currentFloorIndex + 1) * 200;
          let updated = {
            ...playerProfile,
            bossesDefeated: playerProfile.bossesDefeated + 1,
          };
          if (!updated.unlockedBadges.includes('boss_slayer')) {
            updated.unlockedBadges.push('boss_slayer');
          }
          const { profile } = addXP(updated, xp);
          onUpdateProfile(profile);
        }, 500);
      } else {
        setTimeout(() => {
          setIsFeedback(false);
          setSelectedOption(null);
          const nextQ = generateQuestion(
            currentBoss.tier,
            currentBoss.topics[Math.floor(Math.random() * currentBoss.topics.length)]
          );
          setCurrentQuestion(nextQ);
        }, 600);
      }
    } else {
      soundFx.playDamage();
      const nextLives = playerLives - 1;
      setPlayerLives(nextLives);

      if (nextLives <= 0) {
        setTimeout(() => {
          soundFx.playWrong();
          setGameState('DEFEAT');
        }, 600);
      } else {
        setTimeout(() => {
          setIsFeedback(false);
          setSelectedOption(null);
          const nextQ = generateQuestion(
            currentBoss.tier,
            currentBoss.topics[Math.floor(Math.random() * currentBoss.topics.length)]
          );
          setCurrentQuestion(nextQ);
        }, 600);
      }
    }
  };

  if (gameState === 'SELECT') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Formula Dungeons
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Ascend through 5 tiered mathematical chambers. Conquer procedural formula bosses from middle school basics up to college calculus.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {DUNGEON_BOSSES.map((boss, idx) => (
            <div
              key={boss.id}
              className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center font-mono font-bold text-cyan-400 text-lg shrink-0">
                  F{idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">{boss.name}</h3>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-cyan-400 font-mono">
                      {boss.tier === 'junior' ? 'Ages 10–12' : boss.tier === 'senior' ? 'Ages 13–16' : 'Ages 17–20'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">{boss.title}</div>
                  <p className="text-xs text-slate-300 italic mb-2">{boss.lore}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>HP: {boss.maxHp}</span>
                    <span>·</span>
                    <span>{boss.specialTrait}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <button
                  onClick={() => handleStartFloor(idx)}
                  className="w-full md:w-auto px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
                >
                  Enter Chamber
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (gameState === 'BATTLE' && currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Boss Status Bar */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs font-mono text-cyan-400 font-semibold">Chamber {currentFloorIndex + 1}</div>
              <h2 className="text-xl font-bold text-white">{currentBoss.name}</h2>
            </div>

            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map(heartIdx => (
                <Heart
                  key={heartIdx}
                  className={`w-5 h-5 ${
                    heartIdx <= playerLives
                      ? 'fill-rose-500 text-rose-500'
                      : 'fill-slate-800 text-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Boss HP Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Boss Health</span>
              <span className="font-mono text-slate-200">{bossHp} / {currentBoss.maxHp} HP</span>
            </div>
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
                style={{ width: `${(bossHp / currentBoss.maxHp) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Area */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-cyan-400 font-semibold">{currentQuestion.topicLabel}</span>
            <button
              onClick={onOpenScratchpad}
              className="text-xs text-slate-400 hover:text-cyan-300 transition-colors"
            >
              Scratchpad
            </button>
          </div>

          <div className="my-6 text-center">
            <MathDisplay text={currentQuestion.prompt} size="lg" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQuestion.correctAnswer;

              let btnStyle = 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-200';
              if (isFeedback) {
                if (isCorrect) {
                  btnStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-300';
                } else if (isSelected) {
                  btnStyle = 'border-rose-500 bg-rose-950/40 text-rose-300';
                } else {
                  btnStyle = 'border-slate-800/40 opacity-40';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  disabled={isFeedback}
                  className={`p-4 rounded-xl border text-left font-mono font-semibold transition-all ${btnStyle}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // View: VICTORY
  if (gameState === 'VICTORY') {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Chamber Cleared!</h2>
          <p className="text-xs text-slate-400 mb-6">
            {currentBoss.name} has been vanquished. Your mathematical acumen shines.
          </p>

          <div className="flex items-center justify-center gap-3">
            {currentFloorIndex < DUNGEON_BOSSES.length - 1 ? (
              <button
                onClick={() => handleStartFloor(currentFloorIndex + 1)}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-sm transition-all"
              >
                Ascend to Floor {currentFloorIndex + 2}
              </button>
            ) : (
              <div className="text-xs text-emerald-400 font-bold">
                Dungeon Fully Conquered! You are a Grand Field Scholar.
              </div>
            )}
            <button
              onClick={() => {
                soundFx.playClick();
                setGameState('SELECT');
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-sm transition-colors"
            >
              Chamber List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View: DEFEAT
  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400">
          <Skull className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Chamber Overrun</h2>
        <p className="text-xs text-slate-400 mb-6">
          You ran out of shield charges against {currentBoss.name}. Practice the formulas and re-attempt.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => handleStartFloor(currentFloorIndex)}
            className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Floor</span>
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setGameState('SELECT');
            }}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-sm transition-colors"
          >
            Leave Chamber
          </button>
        </div>
      </div>
    </div>
  );
};
