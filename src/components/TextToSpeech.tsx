import { useState, useEffect, useCallback, useRef } from 'react';

interface TextToSpeechProps {
  text: string[];
  autoSpeak?: boolean;
  onSentenceChange?: (index: number) => void;
}

export function TextToSpeech({ text, autoSpeak = false, onSentenceChange }: TextToSpeechProps) {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [supported, setSupported] = useState(false);
  const [rate, setRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const sentencesRef = useRef<string[]>([]);
  const indexRef = useRef(0);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  const splitIntoSentences = useCallback((paragraphs: string[]): string[] => {
    const sentences: string[] = [];
    for (const para of paragraphs) {
      const parts = para.split(/(?<=[.!?…])\s+/);
      for (const part of parts) {
        if (part.trim()) sentences.push(part.trim());
      }
    }
    return sentences;
  }, []);

  const getRussianVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    const ruVoice = voices.find(v => v.lang.startsWith('ru'));
    if (ruVoice) return ruVoice;
    return voices[0] || null;
  }, []);

  const speak = useCallback(() => {
    if (!supported) return;

    window.speechSynthesis.cancel();

    const sentences = splitIntoSentences(text);
    sentencesRef.current = sentences;

    if (sentences.length === 0) return;

    let index = 0;
    indexRef.current = 0;
    setSpeaking(true);
    setPaused(false);
    onSentenceChange?.(0);

    const speakNext = () => {
      if (index >= sentences.length) {
        setSpeaking(false);
        setPaused(false);
        onSentenceChange?.(-1);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sentences[index]);
      const voice = getRussianVoice();
      if (voice) utterance.voice = voice;
      utterance.lang = 'ru-RU';
      utterance.rate = rate;
      utterance.pitch = 1;

      utterance.onend = () => {
        index++;
        indexRef.current = index;
        onSentenceChange?.(index < sentences.length ? index : -1);
        speakNext();
      };

      utterance.onerror = () => {
        setSpeaking(false);
        setPaused(false);
        onSentenceChange?.(-1);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  }, [supported, text, rate, splitIntoSentences, getRussianVoice, onSentenceChange]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    onSentenceChange?.(-1);
  }, [onSentenceChange]);

  const togglePause = useCallback(() => {
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, [paused]);

  // Auto-speak when text changes
  useEffect(() => {
    if (autoSpeak && supported && text.length > 0) {
      const timer = setTimeout(() => speak(), 300);
      return () => { clearTimeout(timer); window.speechSynthesis?.cancel(); };
    }
  }, [autoSpeak, text, supported, speak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Stop when text changes (new paragraph) if not auto-speak
  useEffect(() => {
    if (speaking && !autoSpeak) {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  if (!supported) return null;

  return (
    <div className="relative flex items-center gap-1">
      {!speaking ? (
        <button
          onClick={speak}
          className="text-frost-500 hover:text-ice-300 text-sm transition-colors flex items-center gap-1.5 px-2 py-1 rounded hover:bg-frost-900/50"
          title="Озвучить текст"
          aria-label="Озвучить текст"
        >
          <span>🔊</span>
          <span className="hidden sm:inline">Озвучить</span>
        </button>
      ) : (
        <>
          <button
            onClick={togglePause}
            className="text-ice-400 hover:text-ice-200 text-sm transition-colors flex items-center gap-1.5 px-2 py-1 rounded hover:bg-frost-900/50"
            title={paused ? 'Продолжить' : 'Пауза'}
            aria-label={paused ? 'Продолжить озвучку' : 'Пауза озвучки'}
          >
            <span>{paused ? '▶️' : '⏸️'}</span>
            <span className="hidden sm:inline">{paused ? 'Далее' : 'Пауза'}</span>
          </button>
          <button
            onClick={stop}
            className="text-frost-500 hover:text-danger text-sm transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-frost-900/50"
            title="Остановить"
            aria-label="Остановить озвучку"
          >
            <span>⏹️</span>
          </button>
        </>
      )}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="text-frost-600 hover:text-frost-400 text-xs transition-colors px-1"
        title="Настройки озвучки"
        aria-label="Настройки озвучки"
      >
        ⚙️
      </button>

      {showSettings && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-frost-900 border border-frost-700 rounded-lg p-3 shadow-xl min-w-[220px]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-frost-400 text-xs whitespace-nowrap">Скорость:</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={e => setRate(parseFloat(e.target.value))}
              className="flex-1 accent-ice-500 h-1"
            />
            <span className="text-frost-300 text-xs font-mono w-8 text-right">{rate.toFixed(1)}x</span>
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="text-frost-500 hover:text-frost-300 text-xs w-full text-center mt-1"
          >
            Закрыть
          </button>
        </div>
      )}
    </div>
  );
}