import { useReducer, useEffect, useRef, useCallback } from 'react';
import type { TimerState, TimerAction, TimerItem } from '../types';

const STORAGE_KEY = 'training-timer-state';

const defaultResultState: TimerState = {
  defaultInterval: 30,
  timers: [{ id: 'default-1', name: '', workDuration: 60, intervalDuration: 30, sets: 1 }],
  currentTimerIndex: 0,
  currentSetIndex: 0,
  isInterval: false,
  remainingTime: 60,
  isRunning: false,
  isFinished: false,
};

function getInitialState(): TimerState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure consistency: isRunning always false on load
      // Also ensure new fields exist if loading old state
      const migratedTimers = parsed.timers.map((t: any) => ({
          ...t,
          sets: t.sets || 1
      }));
      return { 
          ...parsed, 
          timers: migratedTimers,
          currentSetIndex: parsed.currentSetIndex || 0,
          isRunning: false 
      };
    }
  } catch (e) {
    console.warn('Failed to load timer state', e);
  }
  return { ...defaultResultState, timers: [{ id: crypto.randomUUID(), name: '', workDuration: 60, intervalDuration: 30, sets: 1 }] };
}

function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'START':
      if (state.isFinished) return state;
      return { ...state, isRunning: true };
    case 'STOP':
      return { ...state, isRunning: false };
    case 'RESET':
      // Reset logic: reload from storage or default, but keep settings (timers, defaultInterval)
      // Actually reset usually means "Stop and go to beginning"
      return {
        ...state,
        currentTimerIndex: 0,
        currentSetIndex: 0,
        isInterval: false,
        remainingTime: state.timers[0]?.workDuration || 0,
        isRunning: false,
        isFinished: false,
      };
    case 'TICK':
      if (!state.isRunning) return state;
      if (state.remainingTime > 0) {
        return { ...state, remainingTime: state.remainingTime - 1 };
      }
      return state; 
    case 'NEXT_PHASE':
      if (state.isInterval) {
        // Interval finished
        const currentTimer = state.timers[state.currentTimerIndex];
        
        // Check if we have more sets in the current timer
        if (state.currentSetIndex < (currentTimer.sets || 1) - 1) {
            // Next Set
            return {
                ...state,
                isInterval: false,
                currentSetIndex: state.currentSetIndex + 1,
                remainingTime: currentTimer.workDuration,
            };
        }

        // Timer finished -> Next Timer
        const nextIndex = state.currentTimerIndex + 1;
        if (nextIndex >= state.timers.length) {
          // All done
          return { ...state, isFinished: true, isRunning: false, remainingTime: 0 };
        }
        return {
          ...state,
          isInterval: false,
          currentTimerIndex: nextIndex,
          currentSetIndex: 0, // Reset set index for next timer
          remainingTime: state.timers[nextIndex].workDuration,
        };
      } else {
        // Work finished -> Interval 
        const currentTimer = state.timers[state.currentTimerIndex];
        
        // Check if this is the absolute last step.
        // If it's the last set of the last timer, finish immediately?
        // Or play interval?
        // Usually, after the very last work set, you are done. No interval.
        
        const isLastSet = state.currentSetIndex >= (currentTimer.sets || 1) - 1;
        const isLastTimer = state.currentTimerIndex >= state.timers.length - 1;

        if (isLastSet && isLastTimer) {
             return { ...state, isFinished: true, isRunning: false, remainingTime: 0 };
        }

        return {
          ...state,
          isInterval: true,
          remainingTime: currentTimer.intervalDuration,
        };
      }
    case 'ADD_TIMER':
      const newTimer: TimerItem = { 
          id: crypto.randomUUID(), 
          name: '', 
          workDuration: 60, 
          intervalDuration: state.defaultInterval,
          sets: 1 
      };
      return {
        ...state,
        timers: [...state.timers, newTimer],
      };
    case 'REMOVE_TIMER':
      if (state.timers.length <= 1) return state;
      return {
        ...state,
        timers: state.timers.filter(t => t.id !== action.payload),
      };
    case 'UPDATE_TIMER':
      const { id, updates } = action.payload;
      const updatedTimers = state.timers.map(t => 
        t.id === id ? { ...t, ...updates } : t
      );
      
      // Update remaining time if we are editing the CURRENT active phase
      // This is tricky. Let's simplify: only update remaining time if NOT running, 
      // and if the user edits the value relevant to CURRENT phase.
      // E.g. Editing workDuration while in Work phase (and not running).
      let newRemaining = state.remainingTime;
      const currentIndex = state.currentTimerIndex;
      const isTargetTimer = state.timers[currentIndex].id === id;
      
      if (!state.isRunning && isTargetTimer) {
          if (!state.isInterval && updates.workDuration !== undefined && state.remainingTime === state.timers[currentIndex].workDuration) {
              // We were at the start of work phase, and user changed duration -> sync
              newRemaining = updates.workDuration;
          }
          if (state.isInterval && updates.intervalDuration !== undefined && state.remainingTime === state.timers[currentIndex].intervalDuration) {
              // We were at start of interval phase -> sync
               newRemaining = updates.intervalDuration;
          }
      }

      return {
        ...state,
        timers: updatedTimers,
        remainingTime: newRemaining
      };

    case 'SET_DEFAULT_INTERVAL':
      return { ...state, defaultInterval: action.payload };
    case 'REORDER_TIMER':
        const { sourceIndex, destinationIndex } = action.payload;
        const result = Array.from(state.timers);
        const [removed] = result.splice(sourceIndex, 1);
        result.splice(destinationIndex, 0, removed);
        
        // If running, reordering might be weird for current index. 
        // For simplicity, let's keep currentTimerIndex pointing to the *same ID* if possible, 
        // or just keep the index. Keeping ID is safer.
        let newIndex = state.currentTimerIndex;
        const currentId = state.timers[state.currentTimerIndex].id;
        // Find new index of currentId
        const newCurrentIndex = result.findIndex(t => t.id === currentId);
        if (newCurrentIndex !== -1) {
            newIndex = newCurrentIndex;
        }

        return {
            ...state,
            timers: result,
            currentTimerIndex: newIndex
        };
    case 'LOAD_STATE':
        return action.payload;
    default:
      return state;
  }
}

export function useTimer() {
  // Use lazy initializer to load from local storage
  const [state, dispatch] = useReducer(timerReducer, null, getInitialState);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Persistence Effect
  useEffect(() => {
    // Only save essential settings, not transient state (like isRunning, remainingTime unless paused?)
    // Requirement says "Save settings". We should probably save timers and defaultInterval.
    // If we save everything, the user can resume exactly where they left off. Which is nice.
    // Let's save the whole state but ensure isRunning is false on load.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Initialize AudioContext on user interaction
  const  initAudio = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
  }, []);

  const playSound = useCallback((type: 'beep' | 'finish') => {
      // Basic oscillator beep
      if (!audioContextRef.current) return;
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'beep') {
          // Metronome tick (optional, if ticked) or short high ping
          osc.frequency.setValueAtTime(1200, ctx.currentTime);
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
      } else {
          // Bell Chime for phase change / finish
          // Fundamental frequency
          osc.frequency.setValueAtTime(2000, ctx.currentTime); 
          osc.type = 'sine';
          
          // Bell Envelope: Sharp attack, long exponential decay
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
          
          osc.start();
          osc.stop(ctx.currentTime + 1.5);

          // Optional: Add a second oscillator for harmonic richness (overtone)
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          
          osc2.frequency.setValueAtTime(2000 * 1.5, ctx.currentTime); // 5th above
          osc2.type = 'sine';
          gain2.gain.setValueAtTime(0, ctx.currentTime);
          gain2.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); // Faster decay for overtone
          
          osc2.start();
          osc2.stop(ctx.currentTime + 0.5);
      }

  }, []);

  useEffect(() => {
    let intervalId: number;
    if (state.isRunning && state.remainingTime > 0) {
      intervalId = window.setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    } else if (state.isRunning && state.remainingTime === 0) {
        // Phase transition
        playSound('finish');
        dispatch({ type: 'NEXT_PHASE' });
    }
    return () => clearInterval(intervalId);
  }, [state.isRunning, state.remainingTime, playSound]);

  return { state, dispatch, initAudio };
}
