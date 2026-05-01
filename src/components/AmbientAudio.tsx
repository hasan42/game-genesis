import { useState, useRef, useCallback, useEffect } from 'react';

export function AmbientAudio() {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ source: AudioBufferSourceNode; gain: GainNode } | null>(null);

  const start = useCallback(() => {
    if (nodesRef.current) return;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    // Generate white noise buffer (2 seconds, looped)
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Band-pass filter for wind-like sound
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 400;
    bandpass.Q.value = 0.5;

    // Low-pass for rumble
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 900;
    lowpass.Q.value = 0.7;

    // Gain (very quiet by default)
    const gain = ctx.createGain();
    gain.gain.value = 0.12;

    // LFO for volume modulation (gusts of wind)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.15; // slow gusts
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

    source.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    nodesRef.current = { source, gain };
    setPlaying(true);
  }, []);

  const stop = useCallback(() => {
    if (nodesRef.current) {
      nodesRef.current.source.stop();
      nodesRef.current = null;
    }
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (playing) {
      stop();
    } else {
      start();
    }
  }, [playing, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (nodesRef.current) {
        nodesRef.current.source.stop();
      }
      if (ctxRef.current) {
        ctxRef.current.close();
      }
    };
  }, []);

  return (
    <button
      onClick={toggle}
      className="fixed bottom-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-frost-900/80 border border-frost-700/50 backdrop-blur-sm text-lg transition-all duration-300 hover:bg-frost-800/80 hover:border-ice-700/50 hover:scale-110"
      title={playing ? 'Выключить звук вьюги' : 'Включить звук вьюги'}
    >
      {playing ? '🔊' : '🔇'}
    </button>
  );
}