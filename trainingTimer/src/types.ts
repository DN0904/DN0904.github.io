export interface TimerItem {
  id: string;
  name: string;
  workDuration: number; // in seconds
  intervalDuration: number; // in seconds
  sets: number; 
}

export interface TimerState {
  defaultInterval: number; // in seconds, used for new timers
  timers: TimerItem[];
  currentTimerIndex: number; // Index of the currently active timer in the timers array
  currentSetIndex: number;
  isInterval: boolean; // True if currently in interval phase
  remainingTime: number; // Seconds remaining in current phase
  isRunning: boolean;
  isFinished: boolean; // True when all timers are completed
}

export type TimerAction =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'RESET' }
  | { type: 'TICK' }
  | { type: 'ADD_TIMER' }
  | { type: 'REMOVE_TIMER'; payload: string } // id
  | { type: 'UPDATE_TIMER'; payload: { id: string; updates: Partial<TimerItem> } }
  | { type: 'SET_DEFAULT_INTERVAL'; payload: number }
  | { type: 'NEXT_PHASE' }
  | { type: 'REORDER_TIMER'; payload: { sourceIndex: number; destinationIndex: number } }
  | { type: 'LOAD_STATE'; payload: TimerState };
