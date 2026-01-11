import React from 'react';
import type { TimerState } from '../types';
import { formatTime } from '../utils/time';
import styles from './TimerDisplay.module.css';

interface TimerDisplayProps {
  state: TimerState;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ state }) => {
  const { isInterval, remainingTime, currentTimerIndex, timers, isFinished } = state;

  if (isFinished) {
    return (
      <div className={styles.container}>
        <h2 className={styles.status}>FINISHED</h2>
        <div className={styles.time}>00:00</div>
        <p className={styles.info}>Great Workout!</p>
      </div>
    );
  }

  const currentTimer = timers[currentTimerIndex];
  const timerName = currentTimer?.name || `Training ${currentTimerIndex + 1}`;
  
  const setsTotal = currentTimer?.sets || 1;
  const currentSet = (state.currentSetIndex || 0) + 1;
  
  const currentPhase = isInterval 
    ? 'REST' 
    : (
        <>
            {timerName}
            {setsTotal > 1 && (
                <div style={{ fontSize: '1rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                    Set {currentSet}/{setsTotal}
                </div>
            )}
        </>
    );

  const nextTimer = timers[currentTimerIndex + 1];
  
  // Logic for "Next":
  // If in interval, next is always Next Set or Next Timer
  // If in work, next is Rest (unless last set & last timer)
  
  let nextDisplay = '';
  if (isInterval) {
     if (currentSet < setsTotal) {
         nextDisplay = `Set ${currentSet + 1}`;
     } else {
         nextDisplay = nextTimer ? (nextTimer.name || `Training ${currentTimerIndex + 2}`) : 'Finish';
     }
  } else {
      nextDisplay = 'Rest';
  }


  return (
    <div className={`${styles.container} ${isInterval ? styles.interval : styles.work}`}>
      <h2 className={styles.status}>{currentPhase}</h2>
      <div className={styles.time}>{formatTime(remainingTime)}</div>
      {!isInterval && (
          <p className={styles.info}>Next: Rest</p>
      )}
      {isInterval && (
          <p className={styles.info}>Next: {nextDisplay}</p>
      )}
    </div>
  );
};
