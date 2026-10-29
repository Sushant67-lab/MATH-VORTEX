/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Check, X, HelpCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { AgeTier, MathQuestion, MathTopic, PlayerStats } from '../types/math';
import { generateQuestion } from '../utils/mathGenerators';
import { soundFx } from '../utils/audio';
import { addXP, recordAnswer } from '../utils/storage';
import { MathDisplay } from './MathDisplay';

interface PracticeLabProps {
  playerProfile: PlayerStats;
  onUpdateProfile: (profile: PlayerStats) => void;
  onOpenScratchpad: () => void;
}

export const PracticeLab: React.FC<PracticeLabProps> = ({
  playerProfile,
  onUpdateProfile,
  onOpenScratchpad,
}) => {
  const [selectedTier, setSelectedTier] = useState<AgeTier>('junior');
  const [selectedTopic, setSelectedTopic] = useState<MathTopic | 'all'>('all');
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion>(() => generateQuestion('junior'));
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showSolution, setShowSolution] = useState<boolean>(false);

  const tierTopics: Record<AgeTier, { id: MathTopic; label: string }[]> = {
    junior: [
      { id: 'arithmetic', label: 'Integers & PEMDAS' },
      { id: 'fractions', label: 'Fractions & Decimals' },
      { id: 'pre_algebra', label: 'Pre-Algebra' },
    ],
    senior: [
      { id: 'quadratics', label: 'Quadratics & Roots' },
      { id: 'algebra', label: 'Linear Equations & Slope' },
      { id: 'trigonometry', label: 'Trigonometry Ratios' },
      { id: 'exponents', label: 'Exponents & Radicals' },
    ],
    apex: [
      { id: 'calculus', label: 'Calculus (Derivatives & Integrals)' },
      { id: 'logarithms', label: 'Logarithms & Exponentials' },
      { id: 'matrices', label: 'Matrices & Vectors' },
      { id: 'probability', label: 'Combinatorics & Probability' },
    ],
  };

  const loadNewQuestion = (tier: AgeTier, topic: MathTopic | 'all') => {
    soundFx.playClick();
    setSelectedAnswer(null);
    setHasSubmitted(false);
    setShowHint(false);
    setShowSolution(false);

    const actualTopic = topic === 'all' ? undefined : topic;
    const q = generateQuestion(tier, actualTopic);
    setCurrentQuestion(q);
  };

  const handleSelectAnswer = (opt: string) => {
    if (hasSubmitted) return;
    soundFx.playClick();
    setSelectedAnswer(opt);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || hasSubmitted) return;
    setHasSubmitted(true);

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    if (isCorrect) {
      soundFx.playCorrect();
      const { profile } = addXP(playerProfile, 25);
      const { profile: finalProfile } = recordAnswer(profile, currentQuestion.topic, true);
      onUpdateProfile(finalProfile);
    } else {
      soundFx.playWrong();
      setShowSolution(true); // Automatically reveal solution when missed so they learn!
      const { profile: finalProfile } = recordAnswer(playerProfile, currentQuestion.topic, false);
      onUpdateProfile(finalProfile);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 flex items-center justify-center gap-2">
          <BookOpen className="w-7 h-7 text-cyan-400" />
          <span>Practice Lab</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Untimed mastery laboratory. Explore step-by-step mathematical reasoning with scratchpad scribbling and instant hints.
        </p>
      </div>

      {/* Tier & Topic Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6">
        {/* Tier Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl mb-4 max-w-md mx-auto">
          {(['junior', 'senior', 'apex'] as AgeTier[]).map(t => (
            <button
              key={t}
              onClick={() => {
                setSelectedTier(t);
                setSelectedTopic('all');
                loadNewQuestion(t, 'all');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
                selectedTier === t
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'junior' ? 'Junior (10-12)' : t === 'senior' ? 'Senior (13-16)' : 'Apex (17-20)'}
            </button>
          ))}
        </div>

        {/* Topic Pill List */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => {
              setSelectedTopic('all');
              loadNewQuestion(selectedTier, 'all');
            }}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
              selectedTopic === 'all'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white bg-slate-950/40'
            }`}
          >
            All Topics
          </button>
          {tierTopics[selectedTier].map(top => (
            <button
              key={top.id}
              onClick={() => {
                setSelectedTopic(top.id);
                loadNewQuestion(selectedTier, top.id);
              }}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                selectedTopic === top.id
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-950/40'
              }`}
            >
              {top.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Practice Question Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl mb-6">
        {/* Top Info */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-6 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-cyan-400">{currentQuestion.topicLabel}</span>
            <span>·</span>
            <span className="capitalize">{currentQuestion.difficulty}</span>
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
              onClick={onOpenScratchpad}
              className="text-slate-400 hover:text-cyan-300 transition-colors"
            >
              Scratchpad
            </button>
            <button
              onClick={() => loadNewQuestion(selectedTier, selectedTopic)}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              title="New Problem"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Hint Box */}
        {showHint && (
          <div className="p-3.5 mb-6 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-200">
            <span className="font-bold mr-1">Tutor Hint:</span> {currentQuestion.hint}
          </div>
        )}

        {/* Question Text */}
        <div className="my-8 text-center">
          <MathDisplay text={currentQuestion.prompt} size="lg" />
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.correctAnswer;

            let style = 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-200';
            if (hasSubmitted) {
              if (isCorrect) {
                style = 'border-emerald-500 bg-emerald-950/40 text-emerald-300';
              } else if (isSelected) {
                style = 'border-rose-500 bg-rose-950/40 text-rose-300';
              } else {
                style = 'border-slate-800/40 opacity-40';
              }
            } else if (isSelected) {
              style = 'border-cyan-500 bg-cyan-950/30 text-white';
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(option)}
                disabled={hasSubmitted}
                className={`p-4 rounded-xl border text-left font-mono font-semibold flex items-center justify-between transition-all ${style}`}
              >
                <span>{option}</span>
                {hasSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                {hasSubmitted && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-400" />}
              </button>
            );
          })}
        </div>

        {/* Submission / Next Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div>
            {!hasSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={!selectedAnswer}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-sm transition-all"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={() => setShowSolution(!showSolution)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                {showSolution ? 'Hide Solution' : 'View Full Solution'}
              </button>
            )}
          </div>

          <button
            onClick={() => loadNewQuestion(selectedTier, selectedTopic)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-colors"
          >
            <span>Next Problem</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Step-by-Step Solution Explainer */}
        {showSolution && (
          <div className="mt-6 p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-slate-100 mb-2">Step-by-step Solution:</div>
            {currentQuestion.explanation.map((step, sIdx) => (
              <div key={sIdx} className="font-mono text-slate-300">
                {step}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
