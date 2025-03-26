'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePomodoroContext } from '@/contexts/pomodoro-context';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Clock, Maximize2, RotateCcw, Minimize2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

// Local implementation of helper functions
function getModeDisplayName(mode: 'pomodoro' | 'shortBreak' | 'longBreak') {
  switch (mode) {
    case 'pomodoro':
      return 'Focus';
    case 'shortBreak':
      return 'Short Break';
    case 'longBreak':
      return 'Long Break';
    default:
      return 'Focus';
  }
}

function getModeBgColor(mode: 'pomodoro' | 'shortBreak' | 'longBreak') {
  switch (mode) {
    case 'pomodoro':
      return 'bg-red-500/10 dark:bg-red-900/20';
    case 'shortBreak':
      return 'bg-green-500/10 dark:bg-green-900/20';
    case 'longBreak':
      return 'bg-blue-500/10 dark:bg-blue-900/20';
    default:
      return 'bg-background';
  }
}

function getModeTextColor(mode: 'pomodoro' | 'shortBreak' | 'longBreak') {
  switch (mode) {
    case 'pomodoro':
      return 'text-red-500 dark:text-red-400';
    case 'shortBreak': 
      return 'text-green-500 dark:text-green-400';
    case 'longBreak':
      return 'text-blue-500 dark:text-blue-400';
    default:
      return 'text-foreground';
  }
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function FloatingTimer() {
  const {
    mode,
    isRunning,
    timeLeft, 
    showFloatingTimer,
    startTimer,
    pauseTimer,
    resetTimer,
  } = usePomodoroContext();
  
  const [isCollapsed, setIsCollapsed] = useState(true);
  const router = useRouter();
  
  const navigateToPomodoro = () => {
    router.push('/dashboard?tab=pomodoro');
  };
  
  if (!showFloatingTimer) return null;
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // Collapsed state button (floating timer)
  return isCollapsed ? (
    <Button
      variant="outline"
      size="sm"
      className={`fixed bottom-4 right-4 h-10 rounded-full px-3 shadow-md
        border border-border bg-background hover:bg-background/90
        transition-all duration-300 ${getModeTextColor(mode)}`}
      onClick={toggleCollapse}
    >
      <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
      <Maximize2 className="h-3 w-3 ml-1.5" />
    </Button>
  ) : (
    // Expanded floating timer
    <div className="fixed bottom-4 right-4 p-3 rounded-lg shadow-md border border-border bg-background z-50">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <span className={`text-xs font-medium ${getModeTextColor(mode)}`}>{getModeDisplayName(mode)}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={toggleCollapse}
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
        </div>
        
        <div className={`font-mono font-bold text-lg ${getModeTextColor(mode)}`}>
          {formatTime(timeLeft)}
        </div>
        
        <div className="flex gap-1">
          {!isRunning ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 transition-all duration-300"
              onClick={startTimer}
              title="Start timer"
            >
              <Play className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 transition-all duration-300"
              onClick={pauseTimer}
              title="Pause timer"
            >
              <Pause className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 transition-all duration-300"
            onClick={resetTimer}
            title="Reset timer"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 transition-all duration-300"
            onClick={navigateToPomodoro}
            title="Open full timer"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
} 