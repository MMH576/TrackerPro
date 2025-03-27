'use client';

import { useEffect, useRef } from 'react';
import { useSpotify } from '@/hooks/use-spotify';

interface SpotifyPomodoroSyncProps {
  isRunning: boolean;
  mode: string;
}

export default function SpotifyPomodoroSync({ isRunning, mode }: SpotifyPomodoroSyncProps) {
  const {
    isAuthenticated,
    selectedPlaylist,
    isPlaying,
    getManualControlStatus,
    resetManualControl,
    togglePlayPause
  } = useSpotify();

  // Track previous timer state to detect changes
  const prevIsRunningRef = useRef<boolean>(isRunning);
  const prevModeRef = useRef<string>(mode);

  // Set a timeout to reset manual control after period of inactivity
  useEffect(() => {
    // After 2 minutes of no user interaction, allow auto sync again
    const timeout = setTimeout(() => {
      resetManualControl();
    }, 2 * 60 * 1000);

    return () => clearTimeout(timeout);
  }, [isPlaying, resetManualControl]);

  // Manage playback based on timer state changes
  useEffect(() => {
    const timerStateChanged =
      isRunning !== prevIsRunningRef.current ||
      mode !== prevModeRef.current;

    const isUnderManualControl = getManualControlStatus();

    // Only sync when timer state changes and not under manual control
    if (timerStateChanged && !isUnderManualControl) {
      const handlePlayback = async () => {
        if (!isAuthenticated || !selectedPlaylist) return;

        try {
          if (isRunning) {
            if (mode === 'pomodoro') {
              // During focus time, ensure music is playing
              if (!isPlaying) {
                await togglePlayPause();
              }
            } else {
              // During breaks, ensure music is paused
              if (isPlaying) {
                await togglePlayPause();
              }
            }
          } else {
            // When timer is paused, ensure music is paused
            if (isPlaying) {
              await togglePlayPause();
            }
          }
        } catch (error) {
          console.error('Error syncing Spotify playback:', error);
        }
      };

      handlePlayback();
    }

    // Update refs for next comparison
    prevIsRunningRef.current = isRunning;
    prevModeRef.current = mode;
  }, [isRunning, mode, isAuthenticated, isPlaying, selectedPlaylist, togglePlayPause, getManualControlStatus]);

  // This component doesn't render anything visible
  return null;
} 