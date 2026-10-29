/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Bot, Swords, RotateCcw, Shield, Heart } from 'lucide-react';
import { AgeTier, BotOpponent, MathQuestion, PlayerStats } from '../types/math';
import { generateQuestion } from '../utils/mathGenerators';
import { soundFx } from '../utils/audio';
import { addXP, recordAnswer, savePlayerProfile } from '../utils/storage';
import { MathDisplay } from './MathDisplay';

const BOTS: BotOpponent[] = [
  {
    id: 'byte',
    name: 'Byte',
    title: 'Junior Arithmetic Bot',
    avatarSeed: 'bot-1',
    accuracy: 0.72,
    minResponseTimeMs: 4000,
    maxResponseTimeMs: 6500,
    color: 'text-emerald-400',
  },
  {
    id: 'turing',
    name: 'Turing',
    title: 'Algebraic Scholar Bot',
    avatarSeed: 'bot-2',
    accuracy: 0.88,
    minResponseTimeMs: 2500,
    maxResponseTimeMs: 4200,
    color: 'text-cyan-400',
  },
  {
    id: 'euler',
    name: 'Euler',
    title: 'Grandmaster Analyst',
    avatarSeed: 'bot-3',
    accuracy: 0.96,
    minResponseTimeMs: 1600,
    maxResponseTimeMs: 2800,
    color: 'text-amber-400',
  },
];

interface MathDuelProps {
  playerProfile: PlayerStats;
  onUpdateProfile: (profile: PlayerStats) => void;
  onOpenScratchpad: () => void;
}

export const MathDuel: React.FC<MathDuelProps> = ({
  playerProfile,
  onUpdateProfile,
  onOpenScratchpad,
}) => {
  const [selectedBot, setSelectedBot] = useState<BotOpponent>(BOTS[1]);
  const [gameState, setGameState] = useState<'SELECT' | 'BATTLE' | 'RESULT'>('SELECT');
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [botHp, setBotHp] = useState<number>(100);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion | null>(null);
  const [roundTimer, setRoundTimer] = useState<number>(12);
  const [battleLog, setBattleLog] = useState<{ text: string; type: 'player' | 'bot' | 'neutral' }[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRoundLocked, setIsRoundLocked] = useState<boolean>(false);
  const [botThinking, setBotThinking] = useState<boolean>(false);

  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getTierForBot = (botId: string): AgeTier => {
    if (botId === 'byte') return 'junior';
    if (botId === 'turing') return 'senior';
    return 'apex';
  };

  const startNextRound = useCallback((qNum: number, currentBot: BotOpponent) => {
    setIsRoundLocked(false);
    setSelectedOption(null);
    setRoundTimer(12);
    setBotThinking(true);

    const q = generateQuestion(getTierForBot(currentBot.id));
    setCurrentQuestion(q);

    // Schedule AI Bot's calculated response
    const thinkTime =
      Math.floor(Math.random() * (currentBot.maxResponseTimeMs - currentBot.minResponseTimeMs)) +
      currentBot.minResponseTimeMs;

    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);

    botTimeoutRef.current = setTimeout(() => {
      // Bot decides
      const willSucceed = Math.random() < currentBot.accuracy;
      if (willSucceed) {
        handleBotMove(true, q);
      } else {
        handleBotMove(false, q);
      }
    }, thinkTime);
  }, []);

  const handleStartDuel = () => {
    soundFx.playClick();
    setPlayerHp(100);
    setBotHp(100);
    setRoundNumber(1);
    setBattleLog([
      { text: `Duel initiated against ${selectedBot.name} (${selectedBot.title})!`, type: 'neutral' },
    ]);
    setGameState('BATTLE');
    startNextRound(1, selectedBot);
  };

  // Bot move resolution
  const handleBotMove = (isBotCorrect: boolean, q: MathQuestion) => {
    setIsRoundLocked(locked => {
      if (locked) return locked; // Player already answered!

      setBotThinking(false);
      if (isBotCorrect) {
        soundFx.playDamage();
        setPlayerHp(hp => {
          const damage = 25;
          const nextHp = Math.max(0, hp - damage);
          setBattleLog(logs => [
            { text: `${selectedBot.name} answered correctly first! You took ${damage} damage.`, type: 'bot' },
            ...logs,
          ]);
          if (nextHp <= 0) {
            handleBattleEnd('BOT_WON');
          } else {
            setTimeout(() => {
              setRoundNumber(r => {
                const nextR = r + 1;
                startNextRound(nextR, selectedBot);
                return nextR;
              });
            }, 1200);
          }
          return nextHp;
        });
      } else {
        setBattleLog(logs => [
          { text: `${selectedBot.name} miscalculated! You have time to strike.`, type: 'neutral' },
          ...logs,
        ]);
      }
      return false;
    });
  };

  // Player answer resolution
  const handlePlayerAnswer = (option: string) => {
    if (isRoundLocked || !currentQuestion || gameState !== 'BATTLE') return;

    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    setIsRoundLocked(true);
    setSelectedOption(option);
    setBotThinking(false);

    const isCorrect = option === currentQuestion.correctAnswer;
    const { profile: updatedProfile } = recordAnswer(playerProfile, currentQuestion.topic, isCorrect);
    onUpdateProfile(updatedProfile);

    if (isCorrect) {
      soundFx.playCorrect();
      const damage = 30;
      setBotHp(hp => {
        const nextHp = Math.max(0, hp - damage);
        setBattleLog(logs => [
          { text: `Direct hit! You dealt ${damage} damage to ${selectedBot.name}.`, type: 'player' },
          ...logs,
        ]);
        if (nextHp <= 0) {
          handleBattleEnd('PLAYER_WON');
        } else {
          setTimeout(() => {
            setRoundNumber(r => {
              const nextR = r + 1;
              startNextRound(nextR, selectedBot);
              return nextR;
            });
          }, 1200);
        }
        return nextHp;
      });
    } else {
      soundFx.playWrong();
      const penalty = 20;
      setPlayerHp(hp => {
        const nextHp = Math.max(0, hp - penalty);
        setBattleLog(logs => [
          { text: `Incorrect formula! Shield penalty: -${penalty} HP.`, type: 'bot' },
          ...logs,
        ]);
        if (nextHp <= 0) {
          handleBattleEnd('BOT_WON');
        } else {
          setTimeout(() => {
            setRoundNumber(r => {
              const nextR = r + 1;
              startNextRound(nextR, selectedBot);
              return nextR;
            });
          }, 1200);
        }
        return nextHp;
      });
    }
  };

  const handleBattleEnd = (winner: 'PLAYER_WON' | 'BOT_WON') => {
    setIsRoundLocked(true);
    if (winner === 'PLAYER_WON') {
      soundFx.playVictory();
      const xpEarned = selectedBot.id === 'euler' ? 350 : selectedBot.id === 'turing' ? 220 : 140;
      let updated = {
        ...playerProfile,
        duelsWon: playerProfile.duelsWon + 1,
        duelsPlayed: playerProfile.duelsPlayed + 1,
      };
      if (selectedBot.id === 'euler' && !updated.unlockedBadges.includes('euler_defeated')) {
        updated.unlockedBadges.push('euler_defeated');
      }
      if (!updated.unlockedBadges.includes('duel_winner')) {
        updated.unlockedBadges.push('duel_winner');
      }
      const { profile } = addXP(updated, xpEarned);
      onUpdateProfile(profile);
    } else {
      soundFx.playWrong();
      const updated = {
        ...playerProfile,
        duelsPlayed: playerProfile.duelsPlayed + 1,
      };
      savePlayerProfile(updated);
      onUpdateProfile(updated);
    }
    setGameState('RESULT');
  };

  // Round countdown timer
  useEffect(() => {
    if (gameState === 'BATTLE' && !isRoundLocked) {
      roundTimerRef.current = setInterval(() => {
        setRoundTimer(t => {
          if (t <= 1) {
            clearInterval(roundTimerRef.current!);
            // Timeout penalty
            soundFx.playWrong();
            setPlayerHp(hp => {
              const next = Math.max(0, hp - 20);
              if (next <= 0) handleBattleEnd('BOT_WON');
              else {
                setTimeout(() => {
                  setRoundNumber(r => {
                    const nextR = r + 1;
                    startNextRound(nextR, selectedBot);
                    return nextR;
                  });
                }, 1000);
              }
              return next;
            });
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }

    return () => {
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    };
  }, [gameState, isRoundLocked]);

  // View: BOT SELECT
  if (gameState === 'SELECT') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            AI Math Duel Arena
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Challenge simulated mathematical AI bots in real-time problem-solving duels. Out-calculate your opponent before they strike.
          </p>
        </div>

        {/* Bot Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {BOTS.map(bot => {
            const isSelected = selectedBot.id === bot.id;
            return (
              <div
                key={bot.id}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedBot(bot);
                }}
                className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-950/40 scale-[1.02]'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                    <Bot className={`w-6 h-6 ${bot.color}`} />
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-400">
                    Speed: {(bot.minResponseTimeMs / 1000).toFixed(1)}s
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{bot.name}</h3>
                <div className="text-xs text-slate-400 mb-3">{bot.title}</div>

                <div className="space-y-1.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Age:</span>
                    <span className="font-mono text-cyan-400">
                      {bot.id === 'byte' ? 'Ages 10–12' : bot.id === 'turing' ? 'Ages 13–16' : 'Ages 17–20'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Calculation Accuracy:</span>
                    <span className="font-mono text-white">{Math.round(bot.accuracy * 100)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Duel Launch Button */}
        <div className="text-center">
          <button
            onClick={handleStartDuel}
            className="flex items-center gap-2 px-8 py-3.5 mx-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
          >
            <Swords className="w-5 h-5" />
            <span>Duel {selectedBot.name}</span>
          </button>
          <div className="mt-3 text-xs text-slate-400">
            Duels Won: <span className="font-mono font-bold text-white">{playerProfile.duelsWon}</span> / {playerProfile.duelsPlayed}
          </div>
        </div>
      </div>
    );
  }

  // View: BATTLE
  if (gameState === 'BATTLE' && currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Battle Arena Header with Health Bars */}
        <div className="grid grid-cols-2 gap-4 p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl mb-6 shadow-xl">
          {/* Player HP */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-white flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>You</span>
              </span>
              <span className="font-mono font-bold text-slate-200">{playerHp} / 100 HP</span>
            </div>
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  playerHp > 50 ? 'bg-emerald-500' : playerHp > 25 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${playerHp}%` }}
              />
            </div>
          </div>

          {/* Bot HP */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>{selectedBot.name}</span>
              </span>
              <span className="font-mono font-bold text-slate-200">{botHp} / 100 HP</span>
            </div>
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  botHp > 50 ? 'bg-cyan-500' : botHp > 25 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${botHp}%` }}
              />
            </div>
          </div>
        </div>

        {/* Round HUD */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-2 mb-3">
          <span>Round {roundNumber}</span>
          <span className="font-mono text-cyan-400 font-bold">{roundTimer}s Remaining</span>
          {botThinking ? (
            <span className="text-amber-400 animate-pulse">Bot calculating...</span>
          ) : (
            <span className="text-slate-400">Answer locked</span>
          )}
        </div>

        {/* Question Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-cyan-400 font-semibold">{currentQuestion.topicLabel}</span>
            <button
              onClick={onOpenScratchpad}
              className="text-xs text-slate-400 hover:text-cyan-300 transition-colors"
            >
              Open Scratchpad
            </button>
          </div>

          <div className="my-6 text-center">
            <MathDisplay text={currentQuestion.prompt} size="lg" />
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQuestion.correctAnswer;

              let btnStyle = 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-200';
              if (isRoundLocked) {
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
                  onClick={() => handlePlayerAnswer(option)}
                  disabled={isRoundLocked}
                  className={`p-4 rounded-xl border text-left font-mono font-semibold transition-all ${btnStyle}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Combat Feed */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 max-h-36 overflow-y-auto text-xs space-y-1.5 font-mono">
          {battleLog.map((log, idx) => (
            <div
              key={idx}
              className={
                log.type === 'player'
                  ? 'text-cyan-400'
                  : log.type === 'bot'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }
            >
              {log.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // View: RESULT
  const didPlayerWin = playerHp > 0 && botHp <= 0;

  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
          {didPlayerWin ? (
            <Swords className="w-8 h-8 text-cyan-400" />
          ) : (
            <Bot className="w-8 h-8 text-rose-400" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {didPlayerWin ? 'Victory Achieved!' : 'Duel Defeat'}
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          {didPlayerWin
            ? `You outmatched ${selectedBot.name} in calculation velocity.`
            : `${selectedBot.name} overwhelmed your defenses. Analyze mistakes and retry.`}
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleStartDuel}
            className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rematch</span>
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setGameState('SELECT');
            }}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-sm transition-colors"
          >
            Choose Opponent
          </button>
        </div>
      </div>
    </div>
  );
};
