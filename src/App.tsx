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
    </div>
  );
}

export default App;