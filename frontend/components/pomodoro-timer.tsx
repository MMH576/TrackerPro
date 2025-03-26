'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Play, Pause, RotateCcw, Coffee, Brain, 
  Settings, CheckCircle, Bell, BellOff, Timer, AlertCircle, 
  ChevronDown, ChevronUp, Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePomodoroContext } from '@/contexts/pomodoro-context';
import { Switch } from "@/components/ui/switch";
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TaskManager } from '@/components/task-manager';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PlayerSpotify, { syncWithPomodoroState } from '@/components/spotify/PlayerSpotify';
import { SpotifyBrowser } from '@/components/spotify/SpotifyBrowser';
import { SpotifyProvider } from '@/hooks/use-spotify';

// CSS to hide number input spinners
const hideSpinners = {
  WebkitAppearance: 'none',
  MozAppearance: 'textfield',
  appearance: 'textfield',
  margin: 0,
};

// Mode specific colors with good contrast in both light and dark modes
const modeColors = {
  pomodoro: {
    bg: '#E11D48', // Strong red that works in both themes
    text: '#FFFFFF'
  },
  shortBreak: {
    bg: '#10B981', // Vibrant green that works in both themes
    text: '#FFFFFF'
  },
  longBreak: {
    bg: '#3B82F6', // Bright blue that works in both themes
    text: '#FFFFFF'
  }
};

export function PomodoroTimer() {
  // Get Pomodoro context
  const {
    mode,
    isRunning,
    timeLeft,
    sessionsCompleted,
    soundEnabled,
    autoStartEnabled,
    pomodoroTime,
    shortBreakTime,
    longBreakTime,
    longBreakInterval,
    startTimer,
    pauseTimer,
    resetTimer,
    toggleSound,
    toggleAutoStart,
    updateSettings,
    formatTime,
    calculateProgress,
    getModeColor,
    setIsOnPomodoroPage,
    setMode
  } = usePomodoroContext();
  
  // Local state
  const [showSettings, setShowSettings] = useState(false);
  const [localPomodoroTime, setLocalPomodoroTime] = useState(pomodoroTime);
  const [localShortBreakTime, setLocalShortBreakTime] = useState(shortBreakTime);
  const [localLongBreakTime, setLocalLongBreakTime] = useState(longBreakTime);
  const [localLongBreakInterval, setLocalLongBreakInterval] = useState(longBreakInterval);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);
  const [expandMusicBrowser, setExpandMusicBrowser] = useState(false);
  
  // Notify context that we're on the Pomodoro page
  useEffect(() => {
    setIsOnPomodoroPage(true);
    
    return () => {
      setIsOnPomodoroPage(false);
    };
  }, [setIsOnPomodoroPage]);
  
  // Update local settings when context changes
  useEffect(() => {
    setLocalPomodoroTime(pomodoroTime);
    setLocalShortBreakTime(shortBreakTime);
    setLocalLongBreakTime(longBreakTime);
    setLocalLongBreakInterval(longBreakInterval);
  }, [pomodoroTime, shortBreakTime, longBreakTime, longBreakInterval]);
  
  // Check for errors in URL when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const queryParams = new URLSearchParams(window.location.search);
      const errorParam = queryParams.get('error');
      
      if (errorParam) {
        setSpotifyError(errorParam);
        
        // Remove the error parameter from the URL
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, []);
  
  // Apply settings
  const applySettings = () => {
    // Validate input values to ensure they're positive numbers
    const validPomodoroTime = Math.max(1, Math.min(60, localPomodoroTime || 25));
    const validShortBreakTime = Math.max(1, Math.min(15, localShortBreakTime || 5));
    const validLongBreakTime = Math.max(5, Math.min(30, localLongBreakTime || 15));
    const validLongBreakInterval = Math.max(1, Math.min(10, localLongBreakInterval || 4));
    
    // Update local state to show sanitized values
    setLocalPomodoroTime(validPomodoroTime);
    setLocalShortBreakTime(validShortBreakTime);
    setLocalLongBreakTime(validLongBreakTime);
    setLocalLongBreakInterval(validLongBreakInterval);
    
    // Apply settings to context
    updateSettings({
      pomodoroTime: validPomodoroTime,
      shortBreakTime: validShortBreakTime,
      longBreakTime: validLongBreakTime,
      longBreakInterval: validLongBreakInterval
    });
    
    // Close settings panel
    setShowSettings(false);
  };

  // Get background color based on mode
  const getModeBgColor = () => {
    return modeColors[mode].bg;
  };

  // Get text for the current timer status
  const getTimerStatusText = () => {
    if (!isRunning) return "Ready to start";
    switch (mode) {
      case 'pomodoro': return `Focusing for ${pomodoroTime} minutes`;
      case 'shortBreak': return `Taking a ${shortBreakTime} minute break`;
      case 'longBreak': return `Taking a ${longBreakTime} minute break`;
      default: return "Timer running";
    }
  };

  // Force UI refresh when settings change
  useEffect(() => {
    // This effect is specifically to force refresh the UI when settings change
    console.log("Settings updated - refreshing UI");
  }, [pomodoroTime, shortBreakTime, longBreakTime, longBreakInterval]);

  // Timer display
  const TimerDisplay = ({ time, mode }: { time: number, mode: 'pomodoro' | 'shortBreak' | 'longBreak' }) => {
    // Use a local ref to track render times
    const lastRenderRef = React.useRef<number>(Date.now());
    const [, forceUpdate] = React.useState({});
    
    // Force re-render at 60fps when timer is running and visible
    React.useEffect(() => {
      let frameId: number;
      
      const updateFrame = () => {
        const now = Date.now();
        // Only update every ~16ms (60fps) to avoid excessive renders
        if (now - lastRenderRef.current >= 16) {
          lastRenderRef.current = now;
          forceUpdate({});
        }
        frameId = requestAnimationFrame(updateFrame);
      };
      
      // Only use animation frames when document is visible
      if (document.visibilityState === 'visible') {
        frameId = requestAnimationFrame(updateFrame);
      }
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          frameId = requestAnimationFrame(updateFrame);
        } else if (frameId) {
          cancelAnimationFrame(frameId);
        }
      };
      
      // Listen for visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        if (frameId) {
          cancelAnimationFrame(frameId);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, []);
    
    return (
      <motion.span 
        className="text-6xl font-bold"
        key={`time-${time}`}
        initial={{ opacity: 0.7, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {formatTime(time)}
      </motion.span>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          className="md:col-span-2 space-y-6"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Pomodoro Timer
                  </CardTitle>
                  <CardDescription>
                    {sessionsCompleted > 0 && `${sessionsCompleted} sessions completed today`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleSound}
                    title={soundEnabled ? "Mute sound" : "Enable sound"}
                    className="rounded-full h-8 w-8"
                  >
                    {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex flex-col items-center pb-8">
              <div className="flex w-full justify-center mb-6">
                <div className="inline-flex p-1 rounded-lg bg-muted">
                  <Button 
                    variant={mode === 'pomodoro' ? 'default' : 'outline'}
                    className={`rounded-md flex items-center gap-2 transition-all duration-300 ${
                      mode === 'pomodoro' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setMode('pomodoro')}
                    style={mode === 'pomodoro' ? {backgroundColor: modeColors.pomodoro.bg, color: modeColors.pomodoro.text} : {}}
                  >
                    <Play className="h-4 w-4" />
                    <span>Focus</span>
                  </Button>
                  <Button 
                    variant={mode === 'shortBreak' ? 'secondary' : 'outline'}
                    className={`rounded-md flex items-center gap-2 transition-all duration-300 ${
                      mode === 'shortBreak' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setMode('shortBreak')}
                    style={mode === 'shortBreak' ? {backgroundColor: modeColors.shortBreak.bg, color: modeColors.shortBreak.text} : {}}
                  >
                    <Coffee className="h-4 w-4" />
                    <span>Short Break</span>
                  </Button>
                  <Button 
                    variant={mode === 'longBreak' ? 'secondary' : 'outline'}
                    className={`rounded-md flex items-center gap-2 transition-all duration-300 ${
                      mode === 'longBreak' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setMode('longBreak')}
                    style={mode === 'longBreak' ? {backgroundColor: modeColors.longBreak.bg, color: modeColors.longBreak.text} : {}}
                  >
                    <Brain className="h-4 w-4" />
                    <span>Long Break</span>
                  </Button>
                </div>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div 
                  key={`timer-${mode}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="relative w-60 h-60 flex items-center justify-center mb-6">
                    {/* Timer circle background */}
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        className="text-muted-foreground/10"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                      />
                      {/* Progress circle */}
                      <circle
                        className="text-current"
                        strokeWidth="3"
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * calculateProgress()) / 100}
                        strokeLinecap="round"
                        stroke={modeColors[mode].bg}
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                        style={{ transition: "stroke-dashoffset 0.5s" }}
                      />
                    </svg>
                    
                    {/* Timer display */}
                    <div className="absolute flex flex-col items-center">
                      <TimerDisplay time={timeLeft} mode={mode} />
                      <span className="text-sm font-medium text-muted-foreground capitalize mt-2">
                        {mode === 'pomodoro' ? 'Focus Time' : 
                         mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
                      </span>
                    </div>
                  </div>
                  
                  <motion.div
                    className="text-center mb-4 h-6"
                    animate={{ opacity: isRunning ? 1 : 0.5 }}
                  >
                    <span className="text-sm text-muted-foreground">
                      {getTimerStatusText()}
                      {autoStartEnabled && !isRunning && " • Auto-start enabled"}
                    </span>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
              
              {/* Timer controls */}
              <div className="flex gap-3 mt-2">
                {!isRunning ? (
                  <Button 
                    onClick={startTimer} 
                    className="gap-2 min-w-[120px] transition-all duration-300"
                    size="lg"
                    variant="default"
                    style={{
                      backgroundColor: modeColors[mode].bg,
                      color: modeColors[mode].text,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    <Play className="h-5 w-5" />
                    Start
                  </Button>
                ) : (
                  <Button 
                    onClick={pauseTimer} 
                    variant="secondary"
                    className="gap-2 min-w-[120px] transition-all duration-300"
                    size="lg"
                  >
                    <Pause className="h-5 w-5" />
                    Pause
                  </Button>
                )}
                <Button 
                  onClick={resetTimer} 
                  variant="outline"
                  className="gap-2 min-w-[120px] transition-all duration-300"
                  size="lg"
                  disabled={!isRunning && (
                    (mode === 'pomodoro' && timeLeft === pomodoroTime * 60) ||
                    (mode === 'shortBreak' && timeLeft === shortBreakTime * 60) ||
                    (mode === 'longBreak' && timeLeft === longBreakTime * 60)
                  )}
                >
                  <RotateCcw className="h-5 w-5" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <TaskManager />
        </motion.div>
        
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Info</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Today's Sessions</h3>
                <div className="text-3xl font-bold">{sessionsCompleted}</div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-1">Current Mode</h3>
                <div className="flex items-center gap-2">
                  <div style={{ backgroundColor: modeColors[mode].bg }} className="h-3 w-3 rounded-full"></div>
                  <span className="capitalize">{mode}</span>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-1">Settings</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Focus:</div>
                  <div>{pomodoroTime} min</div>
                  <div className="text-muted-foreground">Short Break:</div>
                  <div>{shortBreakTime} min</div>
                  <div className="text-muted-foreground">Long Break:</div>
                  <div>{longBreakTime} min</div>
                  <div className="text-muted-foreground">Long Break After:</div>
                  <div>{longBreakInterval} sessions</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Auto-Start Sessions</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {autoStartEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <Switch
                    checked={autoStartEnabled}
                    onCheckedChange={toggleAutoStart}
                    aria-label="Toggle auto-start"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {autoStartEnabled 
                    ? 'Sessions will start automatically after completion' 
                    : 'Sessions require manual start'}
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
                  <Settings className="mr-2 h-4 w-4" />
                  {showSettings ? 'Hide Settings' : 'Edit Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg flex items-center">
                  <Music className="mr-2 h-5 w-5" />
                  Music
                </CardTitle>
                <CardDescription>Enhance your focus with music</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setExpandMusicBrowser(!expandMusicBrowser)}
                className="h-8 w-8 p-0"
              >
                {expandMusicBrowser ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {spotifyError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Spotify Error</AlertTitle>
                  <AlertDescription>{spotifyError}</AlertDescription>
                </Alert>
              )}
              <SpotifyProvider>
                <PlayerSpotify />
                {syncWithPomodoroState(isRunning, mode)}
                
                <AnimatePresence>
                  {expandMusicBrowser && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <Separator className="my-4" />
                      <SpotifyBrowser />
                    </motion.div>
                  )}
                </AnimatePresence>
              </SpotifyProvider>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 