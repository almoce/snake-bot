
export class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    // We'll initialize the context on the first user interaction
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  setMuted(value) {
    this.muted = Boolean(value);
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  play(sound) {
    if (this.muted || !this.ctx) return;
    
    // Ensure context is running (sometimes needed if init was called but state is still suspended)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;

    switch (sound) {
      case 'eat':
        this.playTone(600, 'sine', 0.1);
        break;
      case 'bonus': // eatGold in prompt, mapped to bonus event
      case 'eatGold':
        this.playCoin();
        break;
      case 'die':
        this.playDie();
        break;
      case 'start':
        this.playStart();
        break;
      default:
        break;
    }
  }

  playTone(freq, type, duration, startTime = 0) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(this.ctx.currentTime + startTime);
    osc.stop(this.ctx.currentTime + startTime + duration);
  }

  playCoin() {
    // Major triad arpeggio: C5, E5, G5
    // frequencies approx: 523.25, 659.25, 783.99
    const now = this.ctx.currentTime;
    
    // Note 1
    const osc1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(523.25, now);
    g1.gain.setValueAtTime(0.05, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc1.connect(g1);
    g1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.1);

    // Note 2
    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(659.25, now + 0.05);
    g2.gain.setValueAtTime(0.05, now + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc2.connect(g2);
    g2.connect(this.ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.15);
  }

  playDie() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  playStart() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

export const soundManager = new SoundManager();
