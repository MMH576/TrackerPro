'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Play, Pause, RotateCcw, Coffee, Brain, 
  Settings, CheckCircle, Bell, BellOff, Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePomodoroContext } from '@/contexts/pomodoro-context';

export function PomodoroTimer() {
  // Get Pomodoro context
  const {
    mode,
    isRunning,
    timeLeft,
    sessionsCompleted,
    soundEnabled,
    pomodoroTime,
    shortBreakTime,
    longBreakTime,
    longBreakInterval,
    startTimer,
    pauseTimer,
    resetTimer,
    toggleSound,
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
  
  // Apply settings
  const applySettings = () => {
    updateSettings({
      pomodoroTime: localPomodoroTime,
      shortBreakTime: localShortBreakTime,
      longBreakTime: localLongBreakTime,
      longBreakInterval: localLongBreakInterval
    });
    setShowSettings(false);
  };

  // Get background color based on mode
  const getModeBgColor = () => {
    switch (mode) {
      case 'pomodoro': return 'bg-primary';
      case 'shortBreak': return 'bg-green-500';
      case 'longBreak': return 'bg-blue-500';
      default: return 'bg-primary';
    }
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

  return (
    <div className="flex flex-col gap-6 animation-all duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          className="md:col-span-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden">
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowSettings(!showSettings)}
                    title="Settings"
                    className="rounded-full h-8 w-8"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex flex-col items-center pb-8">
              <div className="flex w-full justify-center mb-6">
                <div className="inline-flex p-1 rounded-lg bg-muted">
                  <Button 
                    variant={mode === 'pomodoro' ? 'default' : 'outline'}
                    className={`rounded-md flex items-center gap-2 transition-all ${
                      mode === 'pomodoro' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => {
                      if (isRunning) pauseTimer();
                      setMode('pomodoro');
                    }}
                  >
                    <Play className="h-4 w-4" />
                    <span>Focus</span>
                  </Button>
                  <Button 
                    variant={mode === 'shortBreak' ? 'secondary' : 'outline'}
                    className={`rounded-md flex items-center gap-2 transition-all ${
                      mode === 'shortBreak' ? 'bg-green-500 text-white' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => {
                      if (isRunning) pauseTimer();
                      setMode('shortBreak');
                    }}
                  >
                    <Coffee className="h-4 w-4" />
                    <span>Short Break</span>
                  </Button>
                  <Button 
                    variant={mode === 'longBreak' ? 'secondary' : 'outline'}
                    className={`rounded-md flex items-center gap-2 transition-all ${
                      mode === 'longBreak' ? 'bg-blue-500 text-white' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => {
                      if (isRunning) pauseTimer();
                      setMode('longBreak');
                    }}
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
                        className={getModeColor()}
                        strokeWidth="3"
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * calculateProgress()) / 100}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                        style={{ transition: "stroke-dashoffset 0.5s" }}
                      />
                    </svg>
                    
                    {/* Timer display */}
                    <div className="absolute flex flex-col items-center">
                      <motion.span 
                        className="text-6xl font-bold"
                        key={`time-${timeLeft}`}
                        initial={{ opacity: 0.7, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {formatTime(timeLeft)}
                      </motion.span>
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
                    variant={mode === 'pomodoro' ? 'default' : 
                            mode === 'shortBreak' ? 'secondary' : 'secondary'}
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
        </motion.div>
        
        <motion.div
          className="md:col-span-1"
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
                  <div className={`h-3 w-3 rounded-full ${getModeBgColor()}`}></div>
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
              
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Adjust Settings
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full overflow-hidden"
          >
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Timer Settings</CardTitle>
                <CardDescription>
                  Customize your Pomodoro timer settings
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="pomodoro-time">Pomodoro Duration: {localPomodoroTime} min</Label>
                    <Input 
                      id="pomodoro-time"
                      className="w-full bg-background/60" 
                      type="number" 
                      min={5} 
                      max={60}
                      value={localPomodoroTime}
                      onChange={(e) => setLocalPomodoroTime(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="short-break-time">Short Break: {localShortBreakTime} min</Label>
                    <Input 
                      id="short-break-time"
                      className="w-full bg-background/60" 
                      type="number" 
                      min={1} 
                      max={15}
                      value={localShortBreakTime}
                      onChange={(e) => setLocalShortBreakTime(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="long-break-time">Long Break: {localLongBreakTime} min</Label>
                    <Input 
                      id="long-break-time"
                      className="w-full bg-background/60" 
                      type="number" 
                      min={10} 
                      max={30}
                      value={localLongBreakTime}
                      onChange={(e) => setLocalLongBreakTime(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="long-break-interval">Long Break Interval: Every {localLongBreakInterval} sessions</Label>
                    <Input 
                      id="long-break-interval"
                      className="w-full bg-background/60" 
                      type="number" 
                      min={2} 
                      max={8}
                      value={localLongBreakInterval}
                      onChange={(e) => setLocalLongBreakInterval(Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
                <Button 
                  onClick={applySettings} 
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <CheckCircle className="h-4 w-4" />
                  Apply Settings
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 