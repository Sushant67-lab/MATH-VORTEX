/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundFX {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check localStorage preference
    const stored = localStorage.getItem('mathvortex_muted');
    if (stored !== null) {
      this.isMuted = stored === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('mathvortex_muted', String(this.isMuted));
    return this.isMuted;
  }

  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.05);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.06);
    } catch {
      // AudioContext might be blocked or unavailable
    }
  }

  public playCorrect() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = t + idx * 0.06;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.18);
      });
    } catch {
      // Ignored
    }
  }

  public playWrong() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.linearRampToValueAtTime(110, t + 0.22);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.23);
    } catch {
      // Ignored
    }
  }

  public playStreak() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73]; // A major fan-out

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = t + idx * 0.05;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.28);
      });
    } catch {
      // Ignored
    }
  }

  public playDamage() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.16);
    } catch {
      // Ignored
    }
  }

  public playVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // Majestic triumphant brass/organ chords
      const chords = [
        { freqs: [523.25, 659.25, 783.99], delay: 0 },
        { freqs: [587.33, 739.99, 880.0], delay: 0.2 },
        { freqs: [659.25, 830.61, 987.77], delay: 0.4 },
        { freqs: [1046.5, 1318.5, 1567.98], delay: 0.65 },
      ];

      chords.forEach(chord => {
        chord.freqs.forEach(freq => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const startTime = t + chord.delay;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.1, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.4);
        });
      });
    } catch {
      // Ignored
    }
  }
}

export const soundFx = new SoundFX();
