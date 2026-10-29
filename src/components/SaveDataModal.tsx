/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Cloud,
  Download,
  Upload,
  Copy,
  Check,
  RotateCcw,
  User,
  ShieldCheck,
  Trophy,
  History,
  KeyRound,
  ArrowRight,
  FileCode,
} from 'lucide-react';
import { PlayerStats, SavedSlotSummary } from '../types/math';
import {
  exportProfileToFile,
  generateSaveCode,
  getSavedSlots,
  loadProfileFromCloud,
  parseProfileFromFile,
  restoreFromSaveCode,
  savePlayerProfile,
  saveProfileToCloud,
} from '../utils/storage';
import { soundFx } from '../utils/audio';

interface SaveDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerProfile: PlayerStats;
  onUpdateProfile: (profile: PlayerStats) => void;
}

export const SaveDataModal: React.FC<SaveDataModalProps> = ({
  isOpen,
  onClose,
  playerProfile,
  onUpdateProfile,
}) => {
  const [tab, setTab] = useState<'save' | 'load' | 'leaderboard'>('save');
  const [playerNameInput, setPlayerNameInput] = useState<string>(playerProfile.playerName || '');
  const [loadQueryInput, setLoadQueryInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [savedSlots, setSavedSlots] = useState<SavedSlotSummary[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPlayerNameInput(playerProfile.playerName || '');
      setSavedSlots(getSavedSlots());
      setStatusMessage(null);
    }
  }, [isOpen, playerProfile]);

  useEffect(() => {
    if (isOpen && tab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [isOpen, tab]);

  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard);
          setIsLoadingLeaderboard(false);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Local fallback leaderboard from saved slots
    const slots = getSavedSlots();
    const localLeaderboard = slots.map(s => ({
      playerName: s.playerName,
      saveKey: s.saveKey,
      level: s.level,
      sprintHighScore: s.sprintHighScore,
      duelsWon: playerProfile.duelsWon,
      target24Solved: playerProfile.target24Solved,
      totalCorrect: playerProfile.totalCorrect,
      lastSaved: s.lastSaved,
    }));
    setLeaderboard(localLeaderboard);
    setIsLoadingLeaderboard(false);
  };

  const handleUpdateName = () => {
    const trimmed = playerNameInput.trim();
    if (!trimmed) return;
    soundFx.playClick();
    const updated = { ...playerProfile, playerName: trimmed };
    savePlayerProfile(updated, true);
    onUpdateProfile(updated);
    setStatusMessage({ text: `Player name updated to "${trimmed}".`, type: 'success' });
    setSavedSlots(getSavedSlots());
  };

  const handleSaveNow = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    soundFx.playClick();

    const nameToUse = playerNameInput.trim() || playerProfile.playerName || 'MathScholar';
    const updated = {
      ...playerProfile,
      playerName: nameToUse,
      lastSaved: Date.now(),
    };

    savePlayerProfile(updated, true);
    onUpdateProfile(updated);
    setIsSaving(false);
    soundFx.playCorrect();

    setStatusMessage({
      text: `Progress securely saved for "${nameToUse}"! Your high score (${updated.sprintHighScore} pts) and Level ${updated.level} are saved.`,
      type: 'success',
    });
    setSavedSlots(getSavedSlots());
  };

  const handleLoadQuery = async () => {
    const query = loadQueryInput.trim();
    if (!query) {
      setStatusMessage({ text: 'Please enter your Player Name, Save Key, or paste a Save Code.', type: 'error' });
      return;
    }

    setIsLoadingProfile(true);
    setStatusMessage(null);
    soundFx.playClick();

    // 1. Try decoding as portable base64 Save Code first
    const fromCode = restoreFromSaveCode(query);
    if (fromCode) {
      setIsLoadingProfile(false);
      savePlayerProfile(fromCode, true);
      onUpdateProfile(fromCode);
      setPlayerNameInput(fromCode.playerName);
      soundFx.playVictory();
      setStatusMessage({
        text: `Restored progress for ${fromCode.playerName}! High score: ${fromCode.sprintHighScore} pts · Level ${fromCode.level}.`,
        type: 'success',
      });
      setSavedSlots(getSavedSlots());
      return;
    }

    // 2. Try loading by Key or Username
    const result = await loadProfileFromCloud(query);
    setIsLoadingProfile(false);

    if (result.success && result.profile) {
      soundFx.playVictory();
      onUpdateProfile(result.profile);
      setPlayerNameInput(result.profile.playerName);
      setStatusMessage({
        text: `Welcome back, ${result.profile.playerName}! High score of ${result.profile.sprintHighScore} pts and Level ${result.profile.level} restored!`,
        type: 'success',
      });
      setSavedSlots(getSavedSlots());
    } else {
      soundFx.playWrong();
      setStatusMessage({
        text: result.message || 'No saved score found. Check your spelling or Save Key.',
        type: 'error',
      });
    }
  };

  const handleLoadSlot = async (slot: SavedSlotSummary) => {
    soundFx.playClick();
    setIsLoadingProfile(true);
    const result = await loadProfileFromCloud(slot.saveKey);
    setIsLoadingProfile(false);

    if (result.success && result.profile) {
      soundFx.playVictory();
      onUpdateProfile(result.profile);
      setPlayerNameInput(result.profile.playerName);
      setStatusMessage({
        text: `Switched to ${result.profile.playerName} (Level ${result.profile.level})!`,
        type: 'success',
      });
      setTab('save');
    }
  };

  const handleCopyKey = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(playerProfile.saveKey);
    setCopiedKey(true);
    soundFx.playClick();
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopySaveCode = () => {
    if (!navigator.clipboard) return;
    const code = generateSaveCode(playerProfile);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    soundFx.playClick();
    setStatusMessage({
      text: 'Portable Save Code copied to clipboard! Paste this code on any device to restore your scores.',
      type: 'success',
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExportFile = () => {
    soundFx.playClick();
    exportProfileToFile(playerProfile);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const parsed = parseProfileFromFile(content);
      if (parsed) {
        savePlayerProfile(parsed, true);
        onUpdateProfile(parsed);
        setPlayerNameInput(parsed.playerName);
        soundFx.playVictory();
        setStatusMessage({
          text: `Backup file successfully restored for ${parsed.playerName}! Level ${parsed.level} and High Score ${parsed.sprintHighScore} pts loaded.`,
          type: 'success',
        });
        setSavedSlots(getSavedSlots());
      } else {
        soundFx.playWrong();
        setStatusMessage({
          text: 'Invalid save file format. Please upload a valid MathVortex JSON save file.',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatRelativeTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-cyan-400" />
            <span className="text-base font-bold text-white">Save & Restore Progress</span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400">Keep your score across sessions</span>
          </div>

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

        {/* Tab Navigation */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-800 gap-6 text-xs font-semibold shrink-0">
          <button
            onClick={() => {
              soundFx.playClick();
              setTab('save');
              setStatusMessage(null);
            }}
            className={`pb-2.5 relative transition-colors ${
              tab === 'save' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Save My Score
            {tab === 'save' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />}
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setTab('load');
              setStatusMessage(null);
            }}
            className={`pb-2.5 relative transition-colors ${
              tab === 'load' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Retrieve / Load Score
            {tab === 'load' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />}
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setTab('leaderboard');
              setStatusMessage(null);
            }}
            className={`pb-2.5 relative transition-colors ${
              tab === 'leaderboard' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hall of Fame
            {tab === 'leaderboard' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />}
          </button>
        </div>

        {/* Status Message Notification */}
        {statusMessage && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/50 border border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/50 border border-rose-800/60 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <X className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TAB 1: SAVE */}
          {tab === 'save' && (
            <div className="space-y-6">
              {/* Profile Card & Custom Name */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center font-bold font-mono text-cyan-300 text-lg">
                      {playerProfile.level}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Current Player Profile</div>
                      <div className="text-base font-bold text-white">{playerProfile.playerName}</div>
                    </div>
                  </div>

                  {/* Save Key with Copy */}
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-lg">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-mono text-xs font-bold text-cyan-300">{playerProfile.saveKey}</span>
                    <button
                      onClick={handleCopyKey}
                      className="p-1 hover:text-white text-slate-400 rounded transition-colors"
                      title="Copy Save Key"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Edit Player Name */}
                <div className="pt-2 border-t border-slate-800/80">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Player / Student Username
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={playerNameInput}
                        onChange={e => setPlayerNameInput(e.target.value)}
                        placeholder="Enter your name (e.g., Sushant)"
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        maxLength={25}
                      />
                    </div>
                    <button
                      onClick={handleUpdateName}
                      disabled={!playerNameInput.trim() || playerNameInput.trim() === playerProfile.playerName}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      Update Name
                    </button>
                  </div>
                </div>

                {/* Stats Summary to be saved */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Sprint Best</div>
                    <div className="font-mono font-bold text-cyan-400">{playerProfile.sprintHighScore} pts</div>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Duels Won</div>
                    <div className="font-mono font-bold text-amber-400">{playerProfile.duelsWon}</div>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Total XP</div>
                    <div className="font-mono font-bold text-emerald-400">{playerProfile.xp} XP</div>
                  </div>
                </div>

                {/* Last Saved info */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Last Saved:</span>
                  <span className="font-mono text-slate-300">{formatRelativeTime(playerProfile.lastSaved)}</span>
                </div>
              </div>

              {/* Main Save Action Button */}
              <div className="text-center space-y-2">
                <button
                  onClick={handleSaveNow}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Cloud className="w-5 h-5" />
                  <span>{isSaving ? 'Saving Progress...' : 'Save My Score & Progress Now'}</span>
                </button>
                <p className="text-xs text-slate-400">
                  Your progress is stored safely. Whenever you return to MathVortex, your scores, badges, and levels will load automatically!
                </p>
              </div>

              {/* Portable Save Code & File Export */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-cyan-400" />
                      <span>Copy Save Code</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      One-click portable code you can paste on another device to restore all progress.
                    </div>
                  </div>
                  <button
                    onClick={handleCopySaveCode}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 rounded-lg transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span>Download JSON Backup</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Download a `.json` backup file directly to your computer or phone.
                    </div>
                  </div>
                  <button
                    onClick={handleExportFile}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOAD / RETRIEVE */}
          {tab === 'load' && (
            <div className="space-y-6">
              {/* Load Query Form */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Retrieve Your Saved Score</h3>
                  <p className="text-xs text-slate-400">
                    Enter your <strong>Player Name</strong>, <strong>Save Key</strong> (e.g. <code className="text-cyan-300 font-mono">VTX-1001</code>), or paste a <strong>Save Code</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={loadQueryInput}
                      onChange={e => setLoadQueryInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLoadQuery()}
                      placeholder="Enter Player Name, Save Key, or Paste Code"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    onClick={handleLoadQuery}
                    disabled={isLoadingProfile || !loadQueryInput.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-lg transition-all"
                  >
                    <span>{isLoadingProfile ? 'Loading...' : 'Load Score'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Local Profiles on this Device */}
              {savedSlots.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
                      <History className="w-3.5 h-3.5" />
                      <span>Profiles on this Device</span>
                    </span>
                    <span>{savedSlots.length} saved</span>
                  </div>

                  <div className="space-y-2">
                    {savedSlots.map(slot => (
                      <div
                        key={slot.saveKey}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                          slot.saveKey === playerProfile.saveKey
                            ? 'border-cyan-500/60 bg-cyan-950/20'
                            : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-cyan-300">
                            L{slot.level}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{slot.playerName}</span>
                              <span className="text-[10px] text-cyan-400 font-mono font-normal">({slot.saveKey})</span>
                              {slot.saveKey === playerProfile.saveKey && (
                                <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>Best: {slot.sprintHighScore} pts</span>
                              <span>·</span>
                              <span>{slot.xp} XP</span>
                              <span>·</span>
                              <span>{formatRelativeTime(slot.lastSaved)}</span>
                            </div>
                          </div>
                        </div>

                        {slot.saveKey !== playerProfile.saveKey && (
                          <button
                            onClick={() => handleLoadSlot(slot)}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Switch to this
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload & Restore from File */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-white">Restore from Backup File (.json)</div>
                  <div className="text-[11px] text-slate-400">
                    Have a saved JSON file from a previous session or device?
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: LEADERBOARD / HALL OF FAME */}
          {tab === 'leaderboard' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold text-white">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Saved Scholar Scores</span>
                </span>
                <button
                  onClick={fetchLeaderboard}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {isLoadingLeaderboard ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Loading saved scores...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No saved scores recorded yet. Click "Save My Score" to claim the top spot!
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, idx) => (
                    <div
                      key={entry.saveKey + idx}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded flex items-center justify-center font-bold font-mono text-xs ${
                            idx === 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : idx === 1
                              ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40'
                              : idx === 2
                              ? 'bg-amber-700/20 text-amber-400 border border-amber-700/40'
                              : 'text-slate-400'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{entry.playerName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({entry.saveKey})</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Level {entry.level} · {entry.duelsWon} Duels Won · {entry.totalCorrect} Correct
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-cyan-400 text-sm">
                          {entry.sprintHighScore} pts
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formatRelativeTime(entry.lastSaved)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-400">
            Active: <span className="text-white font-semibold">{playerProfile.playerName}</span> ({playerProfile.saveKey})
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
