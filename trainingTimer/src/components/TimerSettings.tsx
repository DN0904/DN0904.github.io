import React from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import type { TimerState, TimerAction } from '../types';
import styles from './TimerSettings.module.css';

interface TimerSettingsProps {
  state: TimerState;
  dispatch: React.Dispatch<TimerAction>;
}

export const TimerSettings: React.FC<TimerSettingsProps> = ({ state, dispatch }) => {
  const handleUpdate = (id: string, field: 'workDuration' | 'intervalDuration', value: string) => {
    const val = parseInt(value, 10);
    if (!isNaN(val) && val > 0) {
      dispatch({ 
          type: 'UPDATE_TIMER', 
          payload: { id, updates: { [field]: val } } 
      });
    }
  };

  const handleNameChange = (id: string, value: string) => {
      dispatch({ 
          type: 'UPDATE_TIMER', 
          payload: { id, updates: { name: value } } 
      });
  };

  const handleDefaultIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0) {
        dispatch({ type: 'SET_DEFAULT_INTERVAL', payload: val });
    }
  };

  const onDragEnd = (result: DropResult) => {
      if (!result.destination) return;
      if (result.destination.index === result.source.index) return;
      
      dispatch({ 
          type: 'REORDER_TIMER', 
          payload: { 
              sourceIndex: result.source.index, 
              destinationIndex: result.destination.index 
          } 
      });
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={`${styles.settingGroup} card`}>
        <label className={styles.label}>Default Interval for New Timers (sec)</label>
        <div className={styles.durationInputWrapper}>
            <input 
                type="number" 
                className={styles.input}
                value={state.defaultInterval}
                onChange={handleDefaultIntervalChange}
                disabled={state.isRunning}
            />
            <span className="unit">s</span>
        </div>
      </div>

      <div className={styles.timerList}>
        <h3>Work Sessions</h3>
        {/* Disable DnD when running */}
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="timer-list" isDropDisabled={state.isRunning}>
                {(provided) => (
                    <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={styles.droppableArea}
                    >
                        {state.timers.map((timer, index) => (
                          <Draggable key={timer.id} draggableId={timer.id} index={index} isDragDisabled={state.isRunning}>
                              {(provided, snapshot) => (
                                  <div 
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`${styles.timerItem} ${index === state.currentTimerIndex && !state.isFinished ? styles.active : ''} ${snapshot.isDragging ? styles.dragging : ''}`}
                                      style={{ ...provided.draggableProps.style }}
                                  >
                                     <div {...provided.dragHandleProps} className={styles.dragHandle} aria-label="Drag handle">
                                         ::
                                     </div>
                                     <span className={styles.timerIndex}>#{index + 1}</span>
                                     
                                     <div className={styles.inputs}>
                                        <div className={styles.inputGroup}>
                                            <label>Name</label>
                                            <input 
                                                type="text"
                                                className={styles.nameInput}
                                                placeholder={`Training ${index + 1}`}
                                                value={timer.name}
                                                onChange={(e) => handleNameChange(timer.id, e.target.value)}
                                                disabled={state.isRunning}
                                            />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label>Work</label>
                                            <div className={styles.durationInputWrapper}>
                                                <input 
                                                    type="number"
                                                    className={styles.input}
                                                    value={timer.workDuration}
                                                    onChange={(e) => handleUpdate(timer.id, 'workDuration', e.target.value)}
                                                    disabled={state.isRunning}
                                                />
                                                <span className="unit">s</span>
                                            </div>
                                        </div>
                                         <div className={styles.inputGroup}>
                                            <label>Interval</label>
                                            <div className={styles.durationInputWrapper}>
                                                <input 
                                                    type="number"
                                                    className={styles.input}
                                                    value={timer.intervalDuration}
                                                    onChange={(e) => handleUpdate(timer.id, 'intervalDuration', e.target.value)}
                                                    disabled={state.isRunning}
                                                />
                                                 <span className="unit">s</span>
                                            </div>
                                        </div>
                                         <div className={styles.inputGroup}>
                                            <label>Sets</label>
                                            <div className={styles.durationInputWrapper}>
                                                <input 
                                                    type="number"
                                                    min="1"
                                                    className={styles.input}
                                                    placeholder="Sets"
                                                    value={timer.sets || 1}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value, 10);
                                                        if (!isNaN(val) && val > 0) {
                                                            dispatch({ 
                                                                type: 'UPDATE_TIMER', 
                                                                payload: { id: timer.id, updates: { sets: val } } 
                                                            });
                                                        }
                                                    }}
                                                    disabled={state.isRunning}
                                                    style={{ width: '50px' }}
                                                />
                                                 <span className="unit">sets</span>
                                            </div>
                                        </div>
                                     </div>
                        
                                     {state.timers.length > 1 && (
                                         <button 
                                            className={styles.deleteBtn}
                                            onClick={() => dispatch({ type: 'REMOVE_TIMER', payload: timer.id })}
                                            disabled={state.isRunning}
                                            aria-label="Remove timer"
                                         >
                                            ×
                                         </button>
                                     )}
                                  </div>
                              )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
        
        <button 
            className={styles.addBtn}
            onClick={() => dispatch({ type: 'ADD_TIMER' })}
            disabled={state.isRunning}
        >
            + Add Timer
        </button>
      </div>
    </div>
  );
};
