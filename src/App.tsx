import { useGameStore } from './engine/store';
import { TitleScreen } from './components/TitleScreen';
import { SetupScreen } from './components/SetupScreen';
import { PrologueScreen } from './components/PrologueScreen';
import { GameScreen } from './components/GameScreen';
import { AmbientAudio } from './components/AmbientAudio';
import { ToastContainer } from './components/ToastContainer';

function App() {
  const phase = useGameStore(s => s.phase);

  return (
    <div className="screen-enter" key={phase}>
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