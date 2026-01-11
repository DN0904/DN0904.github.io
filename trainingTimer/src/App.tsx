import { useTimer } from './hooks/useTimer';
import { TimerDisplay } from './components/TimerDisplay';
import { TimerControl } from './components/TimerControl';
import { TimerSettings } from './components/TimerSettings';

function App() {
  const { state, dispatch, initAudio } = useTimer();

  return (
    <div className="app-container">
      <header>
        <h1>Training Timer</h1>
      </header>
      
      <main>
        <TimerDisplay state={state} />
        
        <TimerControl 
            dispatch={dispatch} 
            state={state} 
            onStart={initAudio}
        />
        
        <TimerSettings state={state} dispatch={dispatch} />
      </main>
    </div>
  );
}

export default App;
