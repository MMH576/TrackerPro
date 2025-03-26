'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';

// Interface for timer state
export interface TimerState {
  mode: 'pomodoro' | 'shortBreak' | 'longBreak';
  isRunning: boolean;
  timeLeft: number;
  sessionsCompleted: number;
  startTime: number;
  endTime: number;
  settings: {
    pomodoroTime: number;
    shortBreakTime: number;
    longBreakTime: number;
    longBreakInterval: number;
  };
}

interface PomodoroContextType {
  mode: 'pomodoro' | 'shortBreak' | 'longBreak';
  isRunning: boolean;
  timeLeft: number;
  sessionsCompleted: number;
  soundEnabled: boolean;
  showFloatingTimer: boolean;
  pomodoroTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  longBreakInterval: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  completeTimer: () => void;
  toggleSound: () => void;
  setShowFloatingTimer: (show: boolean) => void;
  setMode: (mode: 'pomodoro' | 'shortBreak' | 'longBreak') => void;
  updateSettings: (settings: {
    pomodoroTime?: number;
    shortBreakTime?: number;
    longBreakTime?: number;
    longBreakInterval?: number;
  }) => void;
  formatTime: (seconds: number) => string;
  calculateProgress: () => number;
  getModeColor: () => string;
  isOnPomodoroPage: boolean;
  setIsOnPomodoroPage: (value: boolean) => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Timer state
  const [mode, setMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showFloatingTimer, setShowFloatingTimer] = useState(false);
  const [isOnPomodoroPage, setIsOnPomodoroPage] = useState(false);
  
  // Settings
  const [pomodoroTime, setPomodoroTime] = useState(25);
  const [shortBreakTime, setShortBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  
  // References
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const socketRef = useRef<any>(null);
  const [notificationPermission, setNotificationPermission] = useState<string | null>(null);

  // Initialize timer and request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check notification permission
      if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      } else {
        setNotificationPermission('denied');
      }

      // Connect to socket if needed for team pomodoro
      const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
      socketRef.current = io(SOCKET_URL, { 
        transports: ['websocket'],
        autoConnect: false
      });

      // Load saved timer state
      loadTimerState();
      
      // Listen for visibility change
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Start worker for background timing
      if (typeof Worker !== 'undefined') {
        startTimerWorker();
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Start worker for background timing
  const startTimerWorker = () => {
    try {
      // Create a blob URL for the worker script
      const workerCode = `
        let interval = null;
        let lastTickTime = Date.now();
        
        self.addEventListener('message', (e) => {
          const { action, state } = e.data;
          
          if (action === 'start') {
            lastTickTime = Date.now();
            interval = setInterval(() => {
              // Send tick message to main thread
              self.postMessage({ type: 'tick', elapsed: Math.floor((Date.now() - lastTickTime) / 1000) });
              lastTickTime = Date.now();
            }, 1000);
          } else if (action === 'stop') {
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
          } else if (action === 'sync') {
            lastTickTime = Date.now();
          }
        });
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      // Create and start the worker
      workerRef.current = new Worker(workerUrl);
      
      // Set up message handler
      workerRef.current.addEventListener('message', (e) => {
        const { type, elapsed } = e.data;
        
        if (type === 'tick') {
          // Update timer based on elapsed time
          updateTimeBasedOnElapsed(elapsed);
        }
      });
      
      // Start the worker if timer is already running
      if (isRunning) {
        workerRef.current.postMessage({ action: 'start' });
      }
      
      // Clean up URL
      URL.revokeObjectURL(workerUrl);
    } catch (error) {
      console.error('Error starting worker:', error);
    }
  };

  // Update time based on elapsed time (for worker)
  const updateTimeBasedOnElapsed = (elapsed: number) => {
    setTimeLeft(prevTime => {
      if (prevTime <= elapsed) {
        // Timer complete
        completeTimer();
        return 0;
      }
      return prevTime - elapsed;
    });
  };

  // Handle visibility change (tab switch or window minimize)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Synchronize timer when becoming visible again
      syncTimerWithStorage();
    } else if (isRunning) {
      // Update last known time before hiding
      saveTimerState();
    }
  };

  // Save timer state to localStorage and server
  const saveTimerState = () => {
    if (typeof window === 'undefined') return;
    
    const now = Date.now();
    const state: TimerState = {
      mode,
      isRunning,
      timeLeft,
      sessionsCompleted,
      startTime: now,
      endTime: isRunning ? now + (timeLeft * 1000) : 0,
      settings: {
        pomodoroTime,
        shortBreakTime,
        longBreakTime,
        longBreakInterval
      }
    };
    
    localStorage.setItem('pomodoroState', JSON.stringify(state));
    
    // Sync with server if user is logged in
    if (user) {
      syncWithServer(state);
    }
  };
  
  // Sync timer state with server
  const syncWithServer = async (state: TimerState) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_URL}/api/pomodoro/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id,
          mode: state.mode,
          timeLeft: state.timeLeft,
          isRunning: state.isRunning,
          endTime: state.endTime,
          sessionsCompleted: state.sessionsCompleted,
          settings: state.settings
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync with server');
      }
    } catch (error) {
      console.error('Error syncing with server:', error);
    }
  };
  
  // Notify server about completed session
  const notifyServerOfCompletion = async (currentMode: 'pomodoro' | 'shortBreak' | 'longBreak', nextMode: 'pomodoro' | 'shortBreak' | 'longBreak') => {
    if (!user) return;
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_URL}/api/pomodoro/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          mode: currentMode,
          newMode: nextMode,
          sessionsCompleted: currentMode === 'pomodoro' ? sessionsCompleted + 1 : sessionsCompleted
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to notify server');
      }
    } catch (error) {
      console.error('Error notifying server:', error);
    }
  };

  // Load timer state from localStorage
  const loadTimerState = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedState = localStorage.getItem('pomodoroState');
      if (!savedState) return;
      
      const state: TimerState = JSON.parse(savedState);
      
      // Check if there's an active timer
      if (state.isRunning && state.endTime > Date.now()) {
        // Calculate remaining time
        const remainingMs = state.endTime - Date.now();
        const remainingSec = Math.ceil(remainingMs / 1000);
        
        // Restore state
        setMode(state.mode);
        setIsRunning(true);
        setTimeLeft(remainingSec);
        setSessionsCompleted(state.sessionsCompleted);
        
        // Restore settings
        setPomodoroTime(state.settings.pomodoroTime);
        setShortBreakTime(state.settings.shortBreakTime);
        setLongBreakTime(state.settings.longBreakTime);
        setLongBreakInterval(state.settings.longBreakInterval);
        
        // Show floating timer if not on pomodoro page
        if (!isOnPomodoroPage) {
          setShowFloatingTimer(true);
        }
      } else if (state.isRunning && state.endTime <= Date.now()) {
        // Timer should have completed while away
        // Restore settings and session count, but handle completion
        setMode(state.mode);
        setIsRunning(false);
        setSessionsCompleted(state.sessionsCompleted);
        
        // Restore settings
        setPomodoroTime(state.settings.pomodoroTime);
        setShortBreakTime(state.settings.shortBreakTime);
        setLongBreakTime(state.settings.longBreakTime);
        setLongBreakInterval(state.settings.longBreakInterval);
        
        // Determine what happened while away
        if (state.mode === 'pomodoro') {
          // Work session completed while away
          // Move to appropriate break
          const newSessionsCompleted = state.sessionsCompleted + 1;
          setSessionsCompleted(newSessionsCompleted);
          
          if (newSessionsCompleted % state.settings.longBreakInterval === 0) {
            setMode('longBreak');
            setTimeLeft(state.settings.longBreakTime * 60);
          } else {
            setMode('shortBreak');
            setTimeLeft(state.settings.shortBreakTime * 60);
          }
          
          // Send notification
          showCompletionNotification('Pomodoro Complete!', 'Your work session was completed while you were away.');
        } else {
          // Break completed while away
          setMode('pomodoro');
          setTimeLeft(state.settings.pomodoroTime * 60);
          
          // Send notification
          showCompletionNotification('Break Complete!', 'Your break has ended. Ready to focus again?');
        }
      } else {
        // No active timer, but restore settings and mode
        setPomodoroTime(state.settings.pomodoroTime);
        setShortBreakTime(state.settings.shortBreakTime);
        setLongBreakTime(state.settings.longBreakTime);
        setLongBreakInterval(state.settings.longBreakInterval);
        setMode(state.mode);
        setSessionsCompleted(state.sessionsCompleted);
        
        // Set appropriate time based on mode
        if (state.mode === 'pomodoro') {
          setTimeLeft(state.settings.pomodoroTime * 60);
        } else if (state.mode === 'shortBreak') {
          setTimeLeft(state.settings.shortBreakTime * 60);
        } else {
          setTimeLeft(state.settings.longBreakTime * 60);
        }
      }
    } catch (error) {
      console.error('Error loading timer state:', error);
    }
  };

  // Sync timer with localStorage when becoming visible
  const syncTimerWithStorage = () => {
    try {
      const savedState = localStorage.getItem('pomodoroState');
      if (!savedState) return;
      
      const state: TimerState = JSON.parse(savedState);
      
      if (state.isRunning && state.endTime > Date.now()) {
        // Calculate remaining time
        const remainingMs = state.endTime - Date.now();
        const remainingSec = Math.ceil(remainingMs / 1000);
        
        // Update time
        setTimeLeft(remainingSec);
      } else if (state.isRunning && state.endTime <= Date.now()) {
        // Timer completed while away
        completeTimer();
      }
    } catch (error) {
      console.error('Error syncing timer:', error);
    }
  };

  // Send notification
  const showCompletionNotification = (title: string, body: string) => {
    // In-app toast notification
    toast({
      title,
      description: body,
      duration: 5000,
    });
    
    // Browser notification (if allowed)
    if (notificationPermission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          silent: false
        });
        
        notification.onclick = () => {
          window.focus();
        };
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
    
    // Send to server for persistence (optional)
    if (user && socketRef.current) {
      const notificationData = {
        userId: user.id,
        message: `${title} - ${body}`,
        type: mode === 'pomodoro' ? 'pomodoro_complete' : 'break_complete',
        saveToDatabase: true,
        metadata: {
          mode,
          sessionsCompleted
        }
      };
      
      socketRef.current.emit('notification', notificationData);
    }
  };

  // Play completion sound
  const playCompletionSound = () => {
    if (!soundEnabled) return;
    
    try {
      // Use Web Audio API to create a more modern notification sound
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      // Create audio nodes
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      
      // Modern notification sound sequence
      const playTone = (freq: number, duration: number, startTime: number, gain: number = 0.3) => {
        const oscillator = audioContext.createOscillator();
        const toneGain = audioContext.createGain();
        
        // Connect nodes
        oscillator.connect(toneGain);
        toneGain.connect(gainNode);
        
        // Set parameters
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        toneGain.gain.value = 0;
        
        // Schedule gain envelope for a smoother sound
        toneGain.gain.setValueAtTime(0, startTime);
        toneGain.gain.linearRampToValueAtTime(gain, startTime + 0.05);
        toneGain.gain.linearRampToValueAtTime(gain, startTime + duration - 0.05);
        toneGain.gain.linearRampToValueAtTime(0, startTime + duration);
        
        // Schedule oscillator
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      // Current time reference
      const now = audioContext.currentTime;
      
      // Main notification melody - modern ascending pattern
      playTone(587.33, 0.15, now); // D5
      playTone(659.25, 0.15, now + 0.16); // E5
      playTone(783.99, 0.2, now + 0.33); // G5
      playTone(1046.50, 0.3, now + 0.55, 0.2); // C6 (softer)
      
      // Additional accent tone for completion
      if (mode === 'pomodoro') {
        // Higher pitch for work completion
        playTone(1174.66, 0.2, now + 0.9, 0.15); // D6 (even softer)
      }
      
      // Cleanup
      setTimeout(() => {
        gainNode.disconnect();
      }, 1500);
    } catch (err) {
      console.error("Error playing sound:", err);
    }
  };

  // Effect to update timer when mode changes
  useEffect(() => {
    if (mode === 'pomodoro') {
      setTimeLeft(pomodoroTime * 60);
    } else if (mode === 'shortBreak') {
      setTimeLeft(shortBreakTime * 60);
    } else {
      setTimeLeft(longBreakTime * 60);
    }
    
    if (isRunning) {
      // Stop the timer when mode changes
      setIsRunning(false);
      
      if (workerRef.current) {
        workerRef.current.postMessage({ action: 'stop' });
      }
    }
    
    // Save state when mode changes
    saveTimerState();
  }, [mode, pomodoroTime, shortBreakTime, longBreakTime]);

  // Effect to control worker when running state changes
  useEffect(() => {
    if (workerRef.current) {
      if (isRunning) {
        workerRef.current.postMessage({ action: 'start' });
      } else {
        workerRef.current.postMessage({ action: 'stop' });
      }
    }
    
    // Save state when running state changes
    saveTimerState();
    
    // Show/hide floating timer based on running state
    if (isRunning && !isOnPomodoroPage) {
      setShowFloatingTimer(true);
    }
  }, [isRunning, isOnPomodoroPage]);

  // Effect to show/hide floating timer when navigating between pages
  useEffect(() => {
    // Only hide the floating timer when on the Pomodoro page
    if (isOnPomodoroPage) {
      setShowFloatingTimer(false);
    } else if (isRunning) {
      // Always show the floating timer when the timer is running and not on the Pomodoro page
      setShowFloatingTimer(true);
    }
  }, [isOnPomodoroPage, isRunning]);

  // Make sure timer state is saved when floating timer visibility changes
  useEffect(() => {
    // Save timer state whenever floating timer visibility changes
    if (isRunning) {
      saveTimerState();
    }
  }, [showFloatingTimer]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start the timer
  const startTimer = () => {
    setIsRunning(true);
  };
  
  // Pause the timer
  const pauseTimer = () => {
    setIsRunning(false);
  };
  
  // Reset the timer
  const resetTimer = () => {
    // Set running to false first to stop the timer
    setIsRunning(false);
    
    // If the worker is running, stop it
    if (workerRef.current) {
      workerRef.current.postMessage({ action: 'stop' });
    }
    
    // Reset to initial time based on current mode
    if (mode === 'pomodoro') {
      setTimeLeft(pomodoroTime * 60);
    } else if (mode === 'shortBreak') {
      setTimeLeft(shortBreakTime * 60);
    } else {
      setTimeLeft(longBreakTime * 60);
    }
    
    // Save state after a small delay to ensure all state updates are applied
    setTimeout(() => {
      saveTimerState();
    }, 0);
  };

  // Complete the timer and transition to next mode
  const completeTimer = () => {
    // Stop all timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (workerRef.current) {
      workerRef.current.postMessage({ action: 'stop' });
    }
    
    // Play sound and show notification
    playCompletionSound();
    
    // Determine next mode
    let nextMode: 'pomodoro' | 'shortBreak' | 'longBreak' = 'pomodoro';
    
    // Update sessions completed if pomodoro finished
    if (mode === 'pomodoro') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      
      // Determine next mode based on sessions completed
      if (newSessionsCompleted % longBreakInterval === 0) {
        nextMode = 'longBreak';
      } else {
        nextMode = 'shortBreak';
      }
    } else {
      // After a break, go back to pomodoro
      nextMode = 'pomodoro';
    }
    
    // Show notification
    const modeCapitalized = mode.charAt(0).toUpperCase() + mode.slice(1);
    const title = `${modeCapitalized} Completed!`;
    const message = mode === 'pomodoro' 
      ? "Great job! Time for a break." 
      : "Break time's over. Ready to focus again?";
    
    showCompletionNotification(title, message);
    
    // Notify server of completion
    notifyServerOfCompletion(mode, nextMode);
    
    // Update mode
    setMode(nextMode);
    setIsRunning(false);
    
    // Save updated state
    saveTimerState();
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    let totalTime;
    if (mode === 'pomodoro') {
      totalTime = pomodoroTime * 60;
    } else if (mode === 'shortBreak') {
      totalTime = shortBreakTime * 60;
    } else {
      totalTime = longBreakTime * 60;
    }
    
    return (1 - timeLeft / totalTime) * 100;
  };

  // Get mode color
  const getModeColor = () => {
    switch (mode) {
      case 'pomodoro': return 'text-primary';
      case 'shortBreak': return 'text-green-500';
      case 'longBreak': return 'text-blue-500';
      default: return 'text-primary';
    }
  };

  // Update settings
  const updateSettings = (settings: {
    pomodoroTime?: number;
    shortBreakTime?: number;
    longBreakTime?: number;
    longBreakInterval?: number;
  }) => {
    if (settings.pomodoroTime !== undefined) setPomodoroTime(settings.pomodoroTime);
    if (settings.shortBreakTime !== undefined) setShortBreakTime(settings.shortBreakTime);
    if (settings.longBreakTime !== undefined) setLongBreakTime(settings.longBreakTime);
    if (settings.longBreakInterval !== undefined) setLongBreakInterval(settings.longBreakInterval);
    
    // Update timer based on current mode
    if (!isRunning) {
      if (mode === 'pomodoro' && settings.pomodoroTime) {
        setTimeLeft(settings.pomodoroTime * 60);
      } else if (mode === 'shortBreak' && settings.shortBreakTime) {
        setTimeLeft(settings.shortBreakTime * 60);
      } else if (mode === 'longBreak' && settings.longBreakTime) {
        setTimeLeft(settings.longBreakTime * 60);
      }
    }
    
    saveTimerState();
  };

  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const value = {
    mode,
    isRunning,
    timeLeft,
    sessionsCompleted,
    soundEnabled,
    showFloatingTimer,
    pomodoroTime,
    shortBreakTime,
    longBreakTime,
    longBreakInterval,
    startTimer,
    pauseTimer,
    resetTimer,
    completeTimer,
    toggleSound,
    setShowFloatingTimer,
    updateSettings,
    formatTime,
    calculateProgress,
    getModeColor,
    isOnPomodoroPage,
    setIsOnPomodoroPage,
    setMode
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoroContext() {
  const context = useContext(PomodoroContext);
  
  if (context === undefined) {
    throw new Error('usePomodoroContext must be used within a PomodoroProvider');
  }
  
  return context;
} 