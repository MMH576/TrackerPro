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
  startTime?: number;
  endTime: number;
  settings: {
    pomodoroTime: number;
    shortBreakTime: number;
    longBreakTime: number;
    longBreakInterval: number;
    autoStartEnabled: boolean;
  };
  lastSaved: number;
}

interface PomodoroContextType {
  mode: 'pomodoro' | 'shortBreak' | 'longBreak';
  isRunning: boolean;
  timeLeft: number;
  sessionsCompleted: number;
  soundEnabled: boolean;
  showFloatingTimer: boolean;
  autoStartEnabled: boolean;
  pomodoroTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  longBreakInterval: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  completeTimer: () => void;
  toggleSound: () => void;
  toggleAutoStart: () => void;
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
  const [autoStartEnabled, setAutoStartEnabled] = useState(true);
  
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
      // Load auto-start preference from localStorage first for immediate use
      const savedAutoStart = localStorage.getItem('pomodoroAutoStart');
      if (savedAutoStart !== null) {
        try {
          const parsedValue = JSON.parse(savedAutoStart);
          setAutoStartEnabled(parsedValue);
          console.log('Loaded auto-start setting from localStorage:', parsedValue);
        } catch (e) {
          console.error('Error parsing auto-start setting:', e);
        }
      }
      
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

      // Setup socket listeners if user is logged in
      if (user && user.id) {
        socketRef.current.connect();
        
        // Add user ID to socket data
        socketRef.current.data = { userId: user.id };
        
        // Listen for pomodoro state sync from server
        socketRef.current.on('pomodoroStateSync', (data: {
          mode: 'pomodoro' | 'shortBreak' | 'longBreak';
          timeLeft: number;
          isRunning: boolean;
          endTime: number;
          sessionsCompleted?: number;
          settings?: {
            pomodoroTime: number;
            shortBreakTime: number;
            longBreakTime: number;
            longBreakInterval: number;
            autoStartEnabled?: boolean;
          };
          syncTimestamp?: number;
        }) => {
          if (!data) return;
          
          // Calculate precise time remaining with compensation for network latency
          const networkLatency = Date.now() - (data.syncTimestamp || Date.now());
          let preciseTimeLeft = data.timeLeft;
          
          // Adjust for time passed during sync if running
          if (data.isRunning && data.endTime) {
            const adjustedEndTime = data.endTime - networkLatency;
            const remainingMs = adjustedEndTime - Date.now();
            preciseTimeLeft = Math.max(0, Math.ceil(remainingMs / 1000));
          }
          
          // Update local state with synchronized data
          setMode(data.mode);
          setTimeLeft(preciseTimeLeft);
          setIsRunning(data.isRunning);
          
          if (data.sessionsCompleted !== undefined) {
            setSessionsCompleted(data.sessionsCompleted);
          }
          
          // Update settings if provided
          if (data.settings) {
            setPomodoroTime(data.settings.pomodoroTime);
            setShortBreakTime(data.settings.shortBreakTime);
            setLongBreakTime(data.settings.longBreakTime);
            setLongBreakInterval(data.settings.longBreakInterval);
            if (data.settings.autoStartEnabled !== undefined) {
              setAutoStartEnabled(data.settings.autoStartEnabled);
              console.log('Updated auto-start from server sync:', data.settings.autoStartEnabled);
            }
          }
          
          // Sync worker with precise time
          if (workerRef.current && data.isRunning) {
            workerRef.current.postMessage({
              action: 'sync',
              secondsLeft: preciseTimeLeft
            });
          }
        });
        
        // Listen for real-time stats updates
        socketRef.current.on('pomodoroStatsUpdate', (data: {
          userId: string;
          mode: 'pomodoro' | 'shortBreak' | 'longBreak';
          sessionsCompleted: number;
          isRunning: boolean;
        }) => {
          // Only update if this is for another user (our own updates come through pomodoroStateSync)
          if (data.userId !== user.id) {
            // We only need to update team stats or global stats, not our timer
            console.log('Received stats update from another user:', data);
          }
        });
      }

      // Load saved timer state
      loadTimerState();
      
      // Listen for visibility change
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Start worker for background timing
      if (typeof Worker !== 'undefined') {
        console.log('Initializing timer worker');
        const workerInitialized = startTimerWorker();
        
        // If initial worker creation failed, retry after a delay
        if (!workerInitialized) {
          setTimeout(() => {
            console.log('Retrying worker initialization');
            startTimerWorker();
          }, 500);
        }
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (socketRef.current) {
        socketRef.current.off('pomodoroStateSync');
        socketRef.current.off('pomodoroStatsUpdate');
        socketRef.current.off('notification');
        socketRef.current.off('pomodoroCompleted');
        socketRef.current.disconnect();
      }
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Start worker for background timing
  const startTimerWorker = () => {
    try {
      // If worker already exists, terminate it first to prevent duplicates
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      
      // Create a blob URL for the worker script
      const workerCode = `
        let timerInterval = null;
        let targetTime = 0;
        let startTime = 0;
        
        // High-precision timing with drift compensation
        function startHighPrecisionTimer(durationMs) {
          if (timerInterval) {
            clearInterval(timerInterval);
          }
          
          startTime = Date.now();
          targetTime = startTime + durationMs;
          
          // Use a higher frequency interval (100ms) for more precise tracking
          timerInterval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - startTime;
            const remaining = Math.max(0, durationMs - elapsed);
            
            // Send updates at 1-second boundaries for UI updates
            if (Math.floor(remaining / 1000) < Math.floor((remaining + 100) / 1000)) {
              self.postMessage({ 
                type: 'tick', 
                timeLeft: Math.ceil(remaining / 1000),
                elapsed: Math.floor(elapsed / 1000)
              });
            }
            
            // Check if timer is complete
            if (now >= targetTime) {
              clearInterval(timerInterval);
              timerInterval = null;
              self.postMessage({ type: 'complete' });
            }
          }, 100); // Check every 100ms for greater precision
        }
        
        // Handle messages from main thread
        self.addEventListener('message', (e) => {
          const { action, secondsLeft } = e.data;
          
          if (action === 'start' && secondsLeft) {
            console.log('Worker: Starting timer with', secondsLeft, 'seconds');
            // Start a new high-precision timer with the given seconds
            startHighPrecisionTimer(secondsLeft * 1000);
          } else if (action === 'stop') {
            console.log('Worker: Stopping timer');
            // Stop the timer
            if (timerInterval) {
              clearInterval(timerInterval);
              timerInterval = null;
            }
          } else if (action === 'sync' && secondsLeft) {
            console.log('Worker: Syncing timer with', secondsLeft, 'seconds');
            // Sync timer with remaining seconds
            if (timerInterval) {
              clearInterval(timerInterval);
            }
            startHighPrecisionTimer(secondsLeft * 1000);
          }
        });
        
        // Send ready message
        self.postMessage({ type: 'ready' });
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      // Create and start the worker
      workerRef.current = new Worker(workerUrl);
      
      // Set up message handler
      workerRef.current.addEventListener('message', (e) => {
        const { type, timeLeft, elapsed } = e.data;
        
        if (type === 'tick') {
          // Use the precise remaining time sent from the worker
          setTimeLeft(timeLeft);
        } else if (type === 'complete') {
          // Timer complete
          console.log('Worker sent complete signal, current mode:', mode);
          completeTimer();
        } else if (type === 'ready') {
          console.log('Worker is ready, current mode:', mode, 'running:', isRunning);
          
          // Start the worker if timer is already running
          if (isRunning) {
            console.log('Timer is running, sending start message to worker with', timeLeft, 'seconds');
            workerRef.current?.postMessage({ 
              action: 'start', 
              secondsLeft: timeLeft 
            });
          }
        }
      });
      
      // Clean up URL
      URL.revokeObjectURL(workerUrl);
      
      console.log('Timer worker started successfully');
      return true;
    } catch (error) {
      console.error('Error starting worker:', error);
      return false;
    }
  };

  // Handle visibility change (tab switch or window minimize)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // When becoming visible, sync with the current state
      if (isRunning) {
        syncTimerWithStorage();
        
        // Resync worker timing if running
        if (workerRef.current) {
          workerRef.current.postMessage({ 
            action: 'sync', 
            secondsLeft: timeLeft 
          });
        }
      }
    } else if (isRunning) {
      // Update last known time before hiding
      saveTimerState();
    }
  };

  // Save timer state to localStorage and server
  const saveTimerState = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const now = Date.now();
      const endTime = isRunning ? now + (timeLeft * 1000) : 0;
      
      const timerState: TimerState = {
        mode,
        isRunning,
        timeLeft,
        endTime,
        sessionsCompleted,
        startTime: isRunning ? now : undefined,
        settings: {
          pomodoroTime,
          shortBreakTime,
          longBreakTime,
          longBreakInterval,
          autoStartEnabled,
        },
        lastSaved: now,
      };
      
      localStorage.setItem('pomodoroState', JSON.stringify(timerState));
      
      // Send to server if user is logged in
      if (user?.id && socketRef.current) {
        socketRef.current.emit('pomodoroStateUpdate', {
          userId: user.id,
          ...timerState,
          syncAcrossDevices: true
        });
      }
    } catch (error) {
      console.error('Error saving timer state:', error);
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
  
  // Function to notify server when a session is completed
  const notifyServerOfCompletion = (currentMode: 'pomodoro' | 'shortBreak' | 'longBreak', nextMode: 'pomodoro' | 'shortBreak' | 'longBreak') => {
    if (!user?.id || !socketRef.current) return;
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    try {
      fetch(`${API_URL}/api/pomodoro/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          mode: currentMode,
          newMode: nextMode,
          sessionsCompleted: currentMode === 'pomodoro' ? sessionsCompleted + 1 : sessionsCompleted,
          autoStart: autoStartEnabled // Pass the auto-start setting
        }),
      });
      
      // Also emit via socket for immediate notification
      socketRef.current.emit('pomodoroCompleted', {
        userId: user.id,
        userName: user.name || user.email,
        mode: currentMode,
        newMode: nextMode,
        sessionsCompleted: currentMode === 'pomodoro' ? sessionsCompleted + 1 : sessionsCompleted,
        autoStart: autoStartEnabled, // Pass the auto-start setting
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error notifying server of completion:', error);
    }
  };

  // Load timer state from localStorage
  const loadTimerState = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedState = localStorage.getItem('pomodoroState');
      if (!savedState) return;
      
      const state: TimerState = JSON.parse(savedState);
      
      // Validate settings to ensure they have reasonable values
      const validatedSettings = {
        pomodoroTime: state.settings?.pomodoroTime > 0 ? state.settings.pomodoroTime : 25,
        shortBreakTime: state.settings?.shortBreakTime > 0 ? state.settings.shortBreakTime : 5,
        longBreakTime: state.settings?.longBreakTime > 0 ? state.settings.longBreakTime : 15,
        longBreakInterval: state.settings?.longBreakInterval > 0 ? state.settings.longBreakInterval : 4,
        autoStartEnabled: state.settings?.autoStartEnabled !== undefined ? state.settings.autoStartEnabled : true
      };
      
      // Load settings first to ensure timer calculations are correct
      setPomodoroTime(validatedSettings.pomodoroTime);
      setShortBreakTime(validatedSettings.shortBreakTime);
      setLongBreakTime(validatedSettings.longBreakTime);
      setLongBreakInterval(validatedSettings.longBreakInterval);
      setAutoStartEnabled(validatedSettings.autoStartEnabled);
      
      // Set mode
      setMode(state.mode || 'pomodoro');
      
      // Set sessions completed
      setSessionsCompleted(state.sessionsCompleted || 0);
      
      // Check if there's an active timer
      if (state.isRunning && state.endTime > Date.now()) {
        // Calculate remaining time
        const remainingMs = state.endTime - Date.now();
        const remainingSec = Math.max(1, Math.ceil(remainingMs / 1000));
        
        // Start the timer with the calculated remaining time
        setIsRunning(true);
        setTimeLeft(remainingSec);
        
        // Show floating timer if not on pomodoro page
        if (!isOnPomodoroPage) {
          setShowFloatingTimer(true);
        }
      } else if (state.isRunning && state.endTime <= Date.now()) {
        // Timer should have completed while away
        setIsRunning(false);
        
        // Determine what happened while away
        if (state.mode === 'pomodoro') {
          // Work session completed while away
          // Move to appropriate break
          const newSessionsCompleted = state.sessionsCompleted + 1;
          setSessionsCompleted(newSessionsCompleted);
          
          if (newSessionsCompleted % validatedSettings.longBreakInterval === 0) {
            setMode('longBreak');
            setTimeLeft(validatedSettings.longBreakTime * 60);
          } else {
            setMode('shortBreak');
            setTimeLeft(validatedSettings.shortBreakTime * 60);
          }
          
          // Send notification
          showCompletionNotification('Pomodoro Complete!', 'Your work session was completed while you were away.');
        } else {
          // Break completed while away
          setMode('pomodoro');
          setTimeLeft(validatedSettings.pomodoroTime * 60);
          
          // Send notification
          showCompletionNotification('Break Complete!', 'Your break has ended. Ready to focus again?');
        }
      } else {
        // No active timer, set appropriate time based on mode
        if (state.mode === 'pomodoro') {
          setTimeLeft(validatedSettings.pomodoroTime * 60);
        } else if (state.mode === 'shortBreak') {
          setTimeLeft(validatedSettings.shortBreakTime * 60);
        } else {
          setTimeLeft(validatedSettings.longBreakTime * 60);
        }
      }
    } catch (error) {
      console.error('Error loading timer state:', error);
      // If there's an error, reset to defaults
      setMode('pomodoro');
      setTimeLeft(25 * 60);
      setIsRunning(false);
      setSessionsCompleted(0);
      setPomodoroTime(25);
      setShortBreakTime(5);
      setLongBreakTime(15);
      setLongBreakInterval(4);
    }
  };

  // Sync timer with localStorage when becoming visible
  const syncTimerWithStorage = () => {
    try {
      const savedState = localStorage.getItem('pomodoroState');
      if (!savedState) return;
      
      const state: TimerState = JSON.parse(savedState);
      
      if (state.isRunning && state.endTime > Date.now()) {
        // Calculate remaining time with ms precision
        const remainingMs = state.endTime - Date.now();
        const remainingSec = Math.ceil(remainingMs / 1000);
        
        // Update time left and resync worker
        setTimeLeft(remainingSec);
        
        // Resync worker with precise remaining time
        if (workerRef.current) {
          workerRef.current.postMessage({ 
            action: 'sync', 
            secondsLeft: remainingSec 
          });
        }
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
    // Reset time left when mode changes
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

  // Effect to update timer when settings change
  useEffect(() => {
    // Only update the timer duration if the timer isn't running
    if (!isRunning) {
      let newTimeLeft = timeLeft;
      let shouldUpdate = false;
      
      if (mode === 'pomodoro') {
        newTimeLeft = pomodoroTime * 60;
        shouldUpdate = true;
        console.log(`Updating focus time: ${pomodoroTime} min (${newTimeLeft} seconds)`);
      } else if (mode === 'shortBreak') {
        newTimeLeft = shortBreakTime * 60;
        shouldUpdate = true;
        console.log(`Updating short break time: ${shortBreakTime} min (${newTimeLeft} seconds)`);
      } else if (mode === 'longBreak') {
        newTimeLeft = longBreakTime * 60;
        shouldUpdate = true;
        console.log(`Updating long break time: ${longBreakTime} min (${newTimeLeft} seconds)`);
      }
      
      if (shouldUpdate && newTimeLeft !== timeLeft) {
        console.log(`Setting timeLeft from ${timeLeft} to ${newTimeLeft} seconds`);
        setTimeLeft(newTimeLeft);
      }
    }
    
    // Save state with updated settings
    saveTimerState();
  }, [pomodoroTime, shortBreakTime, longBreakTime, longBreakInterval, mode]);

  // Effect to control worker when running state changes
  useEffect(() => {
    if (workerRef.current) {
      if (isRunning) {
        workerRef.current.postMessage({ 
          action: 'start',
          secondsLeft: timeLeft 
        });
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
  }, [isRunning, isOnPomodoroPage, timeLeft]);

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
    console.log('Starting timer with', timeLeft, 'seconds left');
    setIsRunning(true);
    
    // Ensure end time is updated for persistence
    const now = Date.now();
    const endTimeValue = now + (timeLeft * 1000);
    
    // Initialize worker if it doesn't exist or recreate it if it was terminated
    let workerCreated = false;
    if (!workerRef.current) {
      console.log('Creating new worker for timer');
      workerCreated = startTimerWorker();
      
      // If worker creation failed, try one more time after a short delay
      if (!workerCreated) {
        setTimeout(() => {
          console.log('Retry creating worker');
          startTimerWorker();
        }, 100);
      }
    }
    
    // Use a timeout to ensure the worker is ready before sending messages
    setTimeout(() => {
      // Make sure worker is running
      if (workerRef.current) {
        // Stop first to ensure clean state
        workerRef.current.postMessage({ action: 'stop' });
        
        // Then restart with current timeLeft value
        setTimeout(() => {
          if (workerRef.current) {
            console.log('Starting worker in startTimer with', timeLeft, 'seconds');
            workerRef.current.postMessage({ 
              action: 'start', 
              secondsLeft: timeLeft 
            });
          } else {
            console.warn('Worker not available after initialization');
          }
        }, 50);
      } else {
        console.warn('No worker available for timer');
        
        // As a fallback, set up an interval directly
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              
              // Call completeTimer after a small delay to ensure state is updated
              setTimeout(() => completeTimer(), 0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }, workerCreated ? 50 : 200); // Longer delay if worker was just created
    
    // Save state immediately
    saveTimerState();
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
    console.log('Completing timer in mode:', mode);
    
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
      console.log(`Pomodoro completed. Next mode: ${nextMode}`);
    } else {
      // After a break, go back to pomodoro
      nextMode = 'pomodoro';
      console.log(`Break completed. Next mode: ${nextMode}`);
    }
    
    // Show notification
    const modeCapitalized = mode.charAt(0).toUpperCase() + mode.slice(1);
    const title = `${modeCapitalized} Completed!`;
    const message = mode === 'pomodoro' 
      ? "Great job! Time for a break." 
      : "Break time's over. Ready to focus again?";
    
    showCompletionNotification(title, message);
    
    // Make sure we use the latest setting values
    const currentPomodoroTime = pomodoroTime;
    const currentShortBreakTime = shortBreakTime;
    const currentLongBreakTime = longBreakTime;
    
    // Calculate the correct time based on next mode using the current settings
    const nextDuration = nextMode === 'pomodoro'
      ? currentPomodoroTime * 60
      : nextMode === 'shortBreak'
        ? currentShortBreakTime * 60
        : currentLongBreakTime * 60;
    
    console.log(`Setting new duration: ${nextDuration} seconds for ${nextMode} mode`);
    
    // First, change mode
    setMode(nextMode);
    
    // Set timeLeft even if not auto-starting
    setTimeLeft(nextDuration);
    
    // Auto-start next session if enabled, otherwise stop the timer
    if (autoStartEnabled) {
      console.log('Auto-start is enabled, starting next session');
      // Mark as running
      setIsRunning(true);
      
      // Notify server of completion with auto-start flag
      notifyServerOfCompletion(mode, nextMode);
      
      // A bit longer delay to ensure state updates are completed
      setTimeout(() => {
        try {
          // Double-check the worker still exists
          if (workerRef.current) {
            // Stop any existing timer to be safe
            workerRef.current.postMessage({ action: 'stop' });
            
            // Then start a new one with the correct duration
            setTimeout(() => {
              if (workerRef.current) {
                console.log('Starting worker with duration:', nextDuration);
                workerRef.current.postMessage({
                  action: 'start',
                  secondsLeft: nextDuration
                });
              } else {
                console.error('Worker was lost during auto-start - falling back to interval');
                startTimerDirectly(nextDuration);
              }
            }, 50);
          } else {
            console.log('No worker available, recreating or falling back to interval');
            // Try to recreate the worker
            if (typeof Worker !== 'undefined') {
              // If worker was terminated, recreate it
              console.log('Recreating worker for auto-start');
              const workerInitialized = startTimerWorker();
              
              if (workerInitialized) {
                setTimeout(() => {
                  if (workerRef.current) {
                    console.log('Starting recreated worker with duration:', nextDuration);
                    workerRef.current.postMessage({
                      action: 'start',
                      secondsLeft: nextDuration
                    });
                  } else {
                    console.error('Recreated worker lost - falling back to interval');
                    startTimerDirectly(nextDuration);
                  }
                }, 100);
              } else {
                console.error('Failed to recreate worker - falling back to interval');
                startTimerDirectly(nextDuration);
              }
            } else {
              // Fallback to direct interval if Web Workers not supported
              console.log('Web Workers not supported - using interval fallback');
              startTimerDirectly(nextDuration);
            }
          }
        } catch (error) {
          console.error('Error during auto-start:', error);
          // Fallback to direct interval
          startTimerDirectly(nextDuration);
        }
        
        // Save state after everything is set up
        saveTimerState();
      }, 100);
    } else {
      // If not auto-starting, stop the timer
      setIsRunning(false);
      
      // Notify server of completion without auto-start
      notifyServerOfCompletion(mode, nextMode);
      
      // Save state
      setTimeout(() => saveTimerState(), 50);
    }
  };
  
  // Fallback direct interval timer when worker fails
  const startTimerDirectly = (durationSeconds: number) => {
    console.log('Starting direct interval timer for', durationSeconds, 'seconds');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Set initial time
    setTimeLeft(durationSeconds);
    
    // Use setInterval as a fallback
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // Schedule completion outside of state update
          setTimeout(() => completeTimer(), 0);
          return 0;
        }
        return newTime;
      });
    }, 1000);
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
    console.log('Updating settings:', settings);
    
    // Store old settings for comparison
    const oldPomodoroTime = pomodoroTime;
    const oldShortBreakTime = shortBreakTime;
    const oldLongBreakTime = longBreakTime;
    
    // Update settings
    let pomodoroUpdated = false;
    let shortBreakUpdated = false;
    let longBreakUpdated = false;
    
    if (settings.pomodoroTime !== undefined && settings.pomodoroTime !== oldPomodoroTime) {
      setPomodoroTime(settings.pomodoroTime);
      pomodoroUpdated = true;
      console.log(`Updated pomodoro time to ${settings.pomodoroTime} minutes`);
    }
    
    if (settings.shortBreakTime !== undefined && settings.shortBreakTime !== oldShortBreakTime) {
      setShortBreakTime(settings.shortBreakTime);
      shortBreakUpdated = true;
      console.log(`Updated short break time to ${settings.shortBreakTime} minutes`);
    }
    
    if (settings.longBreakTime !== undefined && settings.longBreakTime !== oldLongBreakTime) {
      setLongBreakTime(settings.longBreakTime);
      longBreakUpdated = true;
      console.log(`Updated long break time to ${settings.longBreakTime} minutes`);
    }
    
    if (settings.longBreakInterval !== undefined) {
      setLongBreakInterval(settings.longBreakInterval);
      console.log(`Updated long break interval to ${settings.longBreakInterval} sessions`);
    }
    
    // Immediately update timer if not running
    if (!isRunning) {
      // Update time based on current mode
      if (mode === 'pomodoro' && pomodoroUpdated) {
        const newDuration = settings.pomodoroTime! * 60;
        console.log(`Setting pomodoro timeLeft to ${newDuration} seconds`);
        setTimeLeft(newDuration);
      } else if (mode === 'shortBreak' && shortBreakUpdated) {
        const newDuration = settings.shortBreakTime! * 60;
        console.log(`Setting short break timeLeft to ${newDuration} seconds`);
        setTimeLeft(newDuration);
      } else if (mode === 'longBreak' && longBreakUpdated) {
        const newDuration = settings.longBreakTime! * 60;
        console.log(`Setting long break timeLeft to ${newDuration} seconds`);
        setTimeLeft(newDuration);
      }
    }
    
    // Also need to update worker with new time if running
    if (isRunning && workerRef.current) {
      let shouldRestart = false;
      let newDuration = 0;
      
      if (mode === 'pomodoro' && pomodoroUpdated) {
        shouldRestart = true;
        newDuration = settings.pomodoroTime! * 60;
        console.log(`Restarting pomodoro with new duration: ${newDuration} seconds`);
      } else if (mode === 'shortBreak' && shortBreakUpdated) {
        shouldRestart = true;
        newDuration = settings.shortBreakTime! * 60;
        console.log(`Restarting short break with new duration: ${newDuration} seconds`);
      } else if (mode === 'longBreak' && longBreakUpdated) {
        shouldRestart = true;
        newDuration = settings.longBreakTime! * 60;
        console.log(`Restarting long break with new duration: ${newDuration} seconds`);
      }
      
      if (shouldRestart) {
        // Stop current timer
        pauseTimer();
        
        // Update timeLeft
        setTimeLeft(newDuration);
        
        // Small delay to ensure timeLeft is updated
        setTimeout(() => {
          // Restart timer with new duration
          startTimer();
        }, 50);
      }
    }
    
    // Save state with updated settings
    setTimeout(() => saveTimerState(), 100);
  };

  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  // Enhanced setMode function to handle manual mode switching
  const handleModeChange = (newMode: 'pomodoro' | 'shortBreak' | 'longBreak') => {
    // Stop the timer if it's running
    if (isRunning) {
      setIsRunning(false);
      if (workerRef.current) {
        workerRef.current.postMessage({ action: 'stop' });
      }
    }
    
    // Set the new mode
    setMode(newMode);
    
    // Update time based on the new mode
    if (newMode === 'pomodoro') {
      setTimeLeft(pomodoroTime * 60);
    } else if (newMode === 'shortBreak') {
      setTimeLeft(shortBreakTime * 60);
    } else {
      setTimeLeft(longBreakTime * 60);
    }
    
    // Save state after mode change
    setTimeout(() => saveTimerState(), 0);
  };

  // Add function to toggle auto-start
  const toggleAutoStart = () => {
    const newValue = !autoStartEnabled;
    console.log('Toggling auto-start to:', newValue);
    
    // Update local state
    setAutoStartEnabled(newValue);
    
    // Save preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('pomodoroAutoStart', JSON.stringify(newValue));
    }
    
    // Update timer state to include this setting
    setTimeout(() => {
      saveTimerState();
      
      // If user is logged in, notify server of the setting change directly
      if (user?.id && socketRef.current) {
        socketRef.current.emit('pomodoroSettingUpdate', {
          userId: user.id,
          settings: {
            autoStartEnabled: newValue
          }
        });
      }
    }, 0);
  };

  const value = {
    mode,
    isRunning,
    timeLeft,
    sessionsCompleted,
    soundEnabled,
    showFloatingTimer,
    autoStartEnabled,
    pomodoroTime,
    shortBreakTime,
    longBreakTime,
    longBreakInterval,
    startTimer,
    pauseTimer,
    resetTimer,
    completeTimer,
    toggleSound,
    toggleAutoStart,
    setShowFloatingTimer,
    updateSettings,
    formatTime,
    calculateProgress,
    getModeColor,
    isOnPomodoroPage,
    setIsOnPomodoroPage,
    setMode: handleModeChange
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