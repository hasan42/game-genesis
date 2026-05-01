import { useCallback, useEffect, useState } from 'react';

type SoundType = 'click' | 'damage' | 'keyword' | 'medkit' | 'death' | 'victory';

const STORAGE_KEY = 'game-genesis-sfx';

function getStoredSettings(): { enabled: boolean; volume: number } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { enabled: true, volume: 0.3 };
}

function saveSettings(s: { enabled: boolean; volume: number }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean;
  private volume: number;

  constructor(enabled: boolean, volume: number) {
    this.enabled = enabled;
    this.volume = volume;
  }

  setEnabled(v: boolean) { this.enabled = v; }
  setVolume(v: number) { this.volume = v; }
  getEnabled() { return this.enabled; }
  getVolume() { return this.volume; }

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal?: number) {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = (gainVal ?? 0.3) * this.volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  }

  private playNoise(duration: number, filterFreq: number, gainVal: number = 0.2) {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.value = gainVal * this.volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.stop(ctx.currentTime + duration);
  }

  play(sound: SoundType) {
    if (!this.enabled) return;
    switch (sound) {
      case 'click':
        this.playTone(800, 0.06, 'sine', 0.15);
        break;
      case 'damage':
        // Pulsing low tone + noise burst
        this.playTone(100, 0.3, 'sawtooth', 0.4);
        this.playNoise(0.15, 2000, 0.3);
        break;
      case 'keyword':
        // Musical chime sequence
        this.playTone(523, 0.12, 'sine', 0.2);
        setTimeout(() => this.playTone(659, 0.12, 'sine', 0.2), 80);
        setTimeout(() => this.playTone(784, 0.18, 'sine', 0.2), 160);
        break;
      case 'medkit':
        // Gentle ascending tones
        this.playTone(440, 0.15, 'sine', 0.15);
        setTimeout(() => this.playTone(554, 0.15, 'sine', 0.15), 100);
        setTimeout(() => this.playTone(659, 0.2, 'sine', 0.15), 200);
        break;
      case 'death':
        // Heartbeat then flatline
        this.playTone(60, 0.15, 'sine', 0.3);
        setTimeout(() => this.playTone(60, 0.1, 'sine', 0.25), 300);
        setTimeout(() => this.playTone(60, 0.08, 'sine', 0.2), 550);
        setTimeout(() => this.playTone(440, 1.5, 'sine', 0.15), 900);
        break;
      case 'victory':
        // Ascending melody
        const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
        notes.forEach((freq, i) => {
          setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.15), i * 120);
        });
        break;
    }
  }
}

// Singleton engine instance
let engineInstance: SoundEngine | null = null;

function getEngine(): SoundEngine {
  if (!engineInstance) {
    const settings = getStoredSettings();
    engineInstance = new SoundEngine(settings.enabled, settings.volume);
  }
  return engineInstance;
}

export function playSound(sound: SoundType) {
  getEngine().play(sound);
}

export function SoundEffectsToggle() {
  const [enabled, setEnabled] = useState(() => getStoredSettings().enabled);
  const [volume, setVolume] = useState(() => getStoredSettings().volume);
  const [showSettings, setShowSettings] = useState(false);

  const handleToggle = useCallback(() => {
    const engine = getEngine();
    const newVal = !engine.getEnabled();
    engine.setEnabled(newVal);
    setEnabled(newVal);
    saveSettings({ enabled: newVal, volume: engine.getVolume() });
  }, []);

  const handleVolume = useCallback((v: number) => {
    const engine = getEngine();
    engine.setVolume(v);
    setVolume(v);
    saveSettings({ enabled: engine.getEnabled(), volume: v });
  }, []);

  // Sync settings on mount
  useEffect(() => {
    const settings = getStoredSettings();
    const engine = getEngine();
    engine.setEnabled(settings.enabled);
    engine.setVolume(settings.volume);
  }, []);

  return (
    <div className="relative flex items-center gap-1">
      <button
        onClick={handleToggle}
        className={`text-sm transition-colors flex items-center gap-1.5 px-2 py-1 rounded hover:bg-frost-900/50 ${
          enabled ? 'text-ice-400 hover:text-ice-200' : 'text-frost-600 hover:text-frost-400'
        }`}
        title={enabled ? 'Выключить звуки' : 'Включить звуки'}
        aria-label={enabled ? 'Выключить звуки' : 'Включить звуки'}
      >
        <span>{enabled ? '🔔' : '🔕'}</span>
        <span className="hidden sm:inline">SFX</span>
      </button>
      {enabled && (
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-frost-600 hover:text-frost-400 text-xs px-1"
          title="Громкость звуков"
          aria-label="Настройки громкости звуков"
        >
          ⚙️
        </button>
      )}
      {showSettings && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-frost-900 border border-frost-700 rounded-lg p-3 shadow-xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-frost-400 text-xs whitespace-nowrap">Громкость:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={e => handleVolume(parseFloat(e.target.value))}
              className="flex-1 accent-ice-500 h-1"
            />
            <span className="text-frost-300 text-xs font-mono w-8 text-right">{Math.round(volume * 100)}%</span>
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="text-frost-500 hover:text-frost-300 text-xs w-full text-center"
          >
            Закрыть
          </button>
        </div>
      )}
    </div>
  );
}