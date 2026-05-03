import { useState, useCallback } from 'react';
import { useGameStore } from './engine/store';
import { TitleScreen } from './components/TitleScreen';
import { SetupScreen } from './components/SetupScreen';
import { PrologueScreen } from './components/PrologueScreen';
import { GameScreen } from './components/GameScreen';
import { AmbientAudio } from './components/AmbientAudio';
import { ToastContainer } from './components/ToastContainer';
import { SplashScreen } from './components/SplashScreen';
import { ParallaxBackground } from './components/ParallaxBackground';
import { ReferenceModal } from './components/ReferenceModal';

const SPLASH_SHOWN_KEY = 'game-genesis-splash-shown';

function App() {
  const phase = useGameStore(s => s.phase);
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !localStorage.getItem(SPLASH_SHOWN_KEY);
    } catch {
      return true;
    }
  });

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    try {
      localStorage.setItem(SPLASH_SHOWN_KEY, '1');
    } catch {}
  }, []);

  const [referenceOpen, setReferenceOpen] = useState(false);

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className="screen-enter" key={phase}>
      <ParallaxBackground />
      {phase === 'title' && <TitleScreen />}
      {phase === 'prologue' && <PrologueScreen />}
      {phase === 'setup' && <SetupScreen />}
      {(phase === 'playing' || phase === 'dead' || phase === 'victory') && <GameScreen />}
      {!['title', 'prologue', 'setup', 'playing', 'dead', 'victory'].includes(phase) && <TitleScreen />}
      <AmbientAudio />
      <ToastContainer />
      {/* Global reference modal accessible from any screen */}
      {referenceOpen && <ReferenceModal onClose={() => setReferenceOpen(false)} />}
      {/* Global reference button - visible on non-playing screens */}
      {phase !== 'playing' && phase !== 'dead' && phase !== 'victory' && !showSplash && (
        <button
          onClick={() => setReferenceOpen(true)}
          className="fixed bottom-4 right-4 z-50 bg-frost-800/80 hover:bg-frost-700 text-frost-300 rounded-full w-10 h-10 flex items-center justify-center text-lg backdrop-blur-sm border border-frost-700/50 transition-colors"
          aria-label="Справочная информация"
          title="Справочник"
        >
          📖
        </button>
      )}
    </div>
  );
}

export default App;