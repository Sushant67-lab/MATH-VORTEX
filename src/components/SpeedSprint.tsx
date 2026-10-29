/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Play, RotateCcw, Zap, HelpCircle, ArrowRight } from 'lucide-react';
import { AgeTier, MathQuestion, PlayerStats } from '../types/math';
import { AGE_TIERS, generateQuestion } from '../utils/mathGenerators';
import { soundFx } from '../utils/audio';
import { addXP, recordAnswer } from '../utils/storage';
import { MathDisplay } from './MathDisplay';

interface SpeedSprintProps {
  playerProfile: PlayerStats;
  onUpdateProfile: (profile: PlayerStats) => void;
  onOpenScratchpad: () => void;
}

export const SpeedSprint: React.FC<SpeedSprintProps> = ({
  playerProfile,
  onUpdateProfile,
  onOpenScratchpad,
}) => {
  const [selectedTier, setSelectedTier] = useState<AgeTier | 'all'>('junior');
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'SUMMARY'>('IDLE');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerFeedback, setIsAnswerFeedback] = useState<boolean>(false);
  const [feedbackType, setFeedbackType] = useState<'correct' | 'wrong' | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [history, setHistory] = useState<{ q: MathQuestion; chosen: string; correct: boolean }[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getNextQuestion = useCallback((): MathQuestion => {
    let tierToUse: AgeTier = 'junior';
    if (selectedTier === 'all') {
      const tiers: AgeTier[] = ['junior', 'senior', 'apex'];
      tierToUse = tiers[Math.floor(Math.random() * tiers.length)];
    } else {
      tierToUse = selectedTier;
    }
    return generateQuestion(tierToUse);
  }, [selectedTier]);

  // Start Game
  const handleStartGame = () => {
    soundFx.playClick();
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setTimeLeft(60);
    setHistory([]);
    setSelectedAnswer(null);
    setIsAnswerFeedback(false);
    setShowHint(false);

    const q = getNextQuestion();
    setCurrentQuestion(q);
    setGameState('PLAYING');
  };

  // Timer loop
  useEffect(() => {
    if (gameState === 'PLAYING') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const handleGameOver = () => {
    soundFx.playVictory();
    setGameState('SUMMARY');

    // Add final XP & update high score
    const earnedXP = score * 12 + maxStreak * 5;
    let updated = { ...playerProfile };
    if (score > updated.sprintHighScore) {
      updated.sprintHighScore = score;
    }
    const { profile } = addXP(updated, earnedXP);
    onUpdateProfile(profile);
  };

  // Answer handler
  const handleSelectAnswer = (option: string) => {
    if (isAnswerFeedback || !currentQuestion || gameState !== 'PLAYING') return;

    setSelectedAnswer(option);
    setIsAnswerFeedback(true);
    const isCorrect = option === currentQuestion.correctAnswer;

    // Record stats
    const { profile: updatedProfile } = recordAnswer(playerProfile, currentQuestion.topic, isCorrect);
    onUpdateProfile(updatedProfile);

    // Save to round history
    setHistory(prev => [...prev, { q: currentQuestion, chosen: option, correct: isCorrect }]);

    if (isCorrect) {
      soundFx.playCorrect();
      setFeedbackType('correct');
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      // Streak multiplier: 1x, 1.5x (at 3), 2x (at 5), 3x (at 8+)
      const multiplier = newStreak >= 8 ? 3 : newStreak >= 5 ? 2 : newStreak >= 3 ? 1.5 : 1;
      setScore(prev => Math.round(prev + 10 * multiplier));

      if (newStreak % 5 === 0) {
        soundFx.playStreak();
      }

      // Rapid bonus: +1s if time under 50s
      setTimeLeft(t => Math.min(60, t + 1));
    } else {
      soundFx.playWrong();
      setFeedbackType('wrong');
      setStreak(0);
    }

    // Advance quickly to keep sprint flow
    setTimeout(() => {
      setSelectedAnswer(null);
      setIsAnswerFeedback(false);
      setFeedbackType(null);
      setShowHint(false);
      setCurrentQuestion(getNextQuestion());
    }, 450);
  };

  // Keyboard controls (1, 2, 3, 4 or a, b, c, d)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING' || !currentQuestion || isAnswerFeedback) return;

      const key = e.key.toLowerCase();
      let index = -1;
      if (key === '1' || key === 'a') index = 0;
      else if (key === '2' || key === 'b') index = 1;
      else if (key === '3' || key === 'c') index = 2;
      else if (key === '4' || key === 'd') index = 3;

      if (index >= 0 && index < currentQuestion.options.length) {
        handleSelectAnswer(currentQuestion.options[index]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentQuestion, isAnswerFeedback]);

  // Render IDLE / Setup
  if (gameState === 'IDLE') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Speed Sprint Arena
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            60 seconds on the clock. Solve rapid-fire math problems, maintain your streak for combo multipliers, and climb the leaderboard.
          </p>
        </div>

        {/* Tier Selector */}
        <div className="mb-8">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 text-center">
            Choose Your League
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AGE_TIERS.map(tier => (
              <button
                key={tier.id}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedTier(tier.id);
                }}
                className={`p-5 rounded-xl border text-left transition-all relative ${
                  selectedTier === tier.id
                    ? 'border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-950/50'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-base font-bold text-white">{tier.label}</span>
                  <span className="text-xs text-cyan-400 font-mono font-medium">{tier.ageRange}</span>
                </div>
                <div className="text-xs text-slate-400 mb-3">{tier.gradeLevel}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{tier.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {tier.topics.slice(0, 4).map((t, idx) => (
                    <span key={idx} className="text-[11px] text-slate-400">
                      {idx > 0 && <span className="mr-1">·</span>}
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Mixed All Tiers Option */}
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                soundFx.playClick();
                setSelectedTier('all');
              }}
              className={`px-4 py-2 text-xs font-medium rounded-lg border transition-all ${
                selectedTier === 'all'
                  ? 'border-cyan-500 bg-cyan-950/20 text-cyan-300'
                  : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white'
              }`}
            >
              All Leagues Mixed (Ages 10 to 20 Comprehensive Challenge)
            </button>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex flex-col items-center justify-center gap-3">
          <button
            onClick={handleStartGame}
            className="flex items-center gap-2 px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-base rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>Start 60s Sprint</span>
          </button>
          <div className="text-xs text-slate-400">
            Personal Best: <span className="font-mono font-bold text-slate-200">{playerProfile.sprintHighScore} pts</span>
          </div>
        </div>
      </div>
    );
  }

  // Render PLAYING
  if (gameState === 'PLAYING' && currentQuestion) {
    const comboMultiplier = streak >= 8 ? 3 : streak >= 5 ? 2 : streak >= 3 ? 1.5 : 1;

    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* HUD Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-xl mb-6 shadow-md">
          {/* Timer */}
          <div className="flex items-center gap-3">
            <div
              className={`font-mono text-2xl sm:text-3xl font-extrabold ${
                timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'
              }`}
            >
              {timeLeft}s
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">Time Left</span>
          </div>

          {/* Streak & Combo */}
          <div className="flex items-center gap-2">
            {streak >= 3 && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-300 font-mono text-xs font-bold animate-bounce">
                <Zap className="w-3.5 h-3.5 fill-amber-300" />
                <span>{comboMultiplier}x Multiplier</span>
              </div>
            )}
            <div className="text-xs text-slate-300">
              Streak: <span className="font-mono font-bold text-white">{streak}</span>
            </div>
          </div>

          {/* Current Score */}
          <div className="text-right">
            <div className="font-mono text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {score}
            </div>
            <div className="text-[11px] text-slate-400">Score</div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden mb-6">
          {/* Feedback Flash overlay */}
          {feedbackType && (
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
                feedbackType === 'correct' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
              }`}
            />
          )}

          {/* Question Topic & Affordances */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-cyan-400 font-semibold">{currentQuestion.topicLabel}</span>
              <span>·</span>
              <span className="capitalize">{currentQuestion.difficulty}</span>
              <span>·</span>
              <span className="hidden sm:inline">Use keys 1–4</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                title="View Hint"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Hint</span>
              </button>
              <button
                onClick={onOpenScratchpad}
                className="text-xs text-slate-400 hover:text-cyan-300 transition-colors"
              >
                Scratchpad
              </button>
            </div>
          </div>

          {/* Hint Dropdown */}
          {showHint && (
            <div className="p-3 mb-4 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-200">
              <span className="font-semibold mr-1">Hint:</span> {currentQuestion.hint}
            </div>
          )}

          {/* Question Text */}
          <div className="my-6 text-center">
            <MathDisplay text={currentQuestion.prompt} size="lg" />
          </div>

          {/* Answer Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8">
            {currentQuestion.options.map((option, idx) => {
              const keyLabel = ['1', '2', '3', '4'][idx];
              const isSelected = selectedAnswer === option;
              const isCorrectAnswer = option === currentQuestion.correctAnswer;

              let btnStyle = 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-200';
              if (isAnswerFeedback) {
                if (isCorrectAnswer) {
                  btnStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-md shadow-emerald-950/50';
                } else if (isSelected) {
                  btnStyle = 'border-rose-500 bg-rose-950/40 text-rose-300';
                } else {
                  btnStyle = 'border-slate-800/40 opacity-40';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(option)}
                  disabled={isAnswerFeedback}
                  className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all duration-150 cursor-pointer ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-slate-800/80 text-slate-400 text-xs font-mono flex items-center justify-center font-bold">
                      {keyLabel}
                    </span>
                    <span className="font-mono text-base font-semibold">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-2">
          <span>Sprint in progress</span>
          <button
            onClick={() => {
              soundFx.playClick();
              handleGameOver();
            }}
            className="hover:text-rose-400 transition-colors"
          >
            End Sprint Early
          </button>
        </div>
      </div>
    );
  }

  // Render SUMMARY
  const totalAnswered = history.length;
  const correctCount = history.filter(h => h.correct).length;
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const xpGained = score * 12 + maxStreak * 5;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Victory Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center mb-8 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          Sprint Complete!
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Great hustle! Here is your performance breakdown for this run.
        </p>

        {/* Stat metrics strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl mb-6">
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-cyan-400 tabular-nums">
              {score}
            </div>
            <div className="text-xs text-slate-400">Final Score</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tabular-nums">
              {accuracy}%
            </div>
            <div className="text-xs text-slate-400">Accuracy ({correctCount}/{totalAnswered})</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-400 tabular-nums">
              {maxStreak}
            </div>
            <div className="text-xs text-slate-400">Max Streak</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 tabular-nums">
              +{xpGained}
            </div>
            <div className="text-xs text-slate-400">XP Earned</div>
          </div>
        </div>

        {/* Restart Action */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleStartGame}
            className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setGameState('IDLE');
            }}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-sm transition-colors"
          >
            Switch League
          </button>
        </div>
      </div>

      {/* Solutions Review Section */}
      {history.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center justify-between">
            <span>Problem Review & Solutions</span>
            <span className="text-xs font-normal text-slate-400">{history.length} Questions</span>
          </h3>

          <div className="space-y-3">
            {history.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  item.correct
                    ? 'border-emerald-900/40 bg-emerald-950/20'
                    : 'border-rose-900/40 bg-rose-950/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs font-mono text-slate-400">Q{idx + 1} · {item.q.topicLabel}</span>
                  <span className={`text-xs font-bold ${item.correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {item.correct ? 'Correct' : 'Missed'}
                  </span>
                </div>

                <div className="text-sm font-semibold text-slate-100 mb-2">
                  <MathDisplay text={item.q.prompt} size="sm" />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs mb-3">
                  <span className="text-slate-400">
                    Your answer: <span className="font-mono text-slate-200">{item.chosen}</span>
                  </span>
                  {!item.correct && (
                    <span className="text-emerald-400">
                      Correct answer: <span className="font-mono font-bold">{item.q.correctAnswer}</span>
                    </span>
                  )}
                </div>

                {/* Step-by-step explainer */}
                <div className="p-3 bg-slate-900/80 rounded-lg text-xs space-y-1 text-slate-300">
                  <div className="font-semibold text-slate-200 mb-1">Step-by-step solution:</div>
                  {item.q.explanation.map((step, sIdx) => (
                    <div key={sIdx} className="font-mono text-[11px] text-slate-300">
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
