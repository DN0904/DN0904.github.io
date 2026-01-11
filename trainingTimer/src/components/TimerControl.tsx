import React from 'react';
import type { TimerAction, TimerState } from '../types';

interface TimerControlProps {
  dispatch: React.Dispatch<TimerAction>;
  state: TimerState;
  onStart: () => void;
}

export const TimerControl: React.FC<TimerControlProps> = ({ dispatch, state, onStart }) => {
  const handleStart = () => {
    onStart(); // Init audio
    dispatch({ type: 'START' });
  };

  const handleStop = () => {
    dispatch({ type: 'STOP' });
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '2rem 0' }}>
      {!state.isRunning && !state.isFinished ? (
        <button onClick={handleStart} style={{ backgroundColor: 'var(--primary-color)', color: '#000', minWidth: '100px' }}>
          START
        </button>
      ) : (
         !state.isFinished && (
            <button onClick={handleStop} style={{ backgroundColor: 'var(--secondary-color)', color: '#000', minWidth: '100px' }}>
            PAUSE
            </button>
         )
      )}
      <button onClick={handleReset} title="Reset Timer">
        RESET
      </button>
    </div>
  );
};
