'use client';

import { useState, useEffect, useRef } from 'react';
import { Pause, Play, Volume2, VolumeX, X, Music, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useSpotify } from '@/hooks/use-spotify';
import { Track } from '@/utils/spotify-client';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';

export function FloatingPlayer() {
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [localPlayingState, setLocalPlayingState] = useState(false);

  const {
    isAuthenticated,
    isLoading,
    isPlayerReady,
    currentTrack,
    isPlaying,
    volume,
    deviceId,
    togglePlayPause,
    setVolume,
    connectToSpotify,
    manualTogglePlayPause,
    nextTrack,
    previousTrack,
  } = useSpotify();

  // Track last update time for smoother progress calculation
  const lastUpdateRef = useRef<{time: number, position: number}>({
    time: Date.now(),
    position: currentTrack?.position_ms || 0
  });

  // Show player only when authenticated and not loading
  useEffect(() => {
    if (isAuthenticated && isPlayerReady && !isLoading && deviceId) {
      setVisible(true);
      setError(null);
    } else if (error) {
      // Show player with error state
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isAuthenticated, isPlayerReady, isLoading, deviceId, error]);

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(previousVolume);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
    }
    setIsMuted(!isMuted);
  };

  // Set muted state based on volume
  useEffect(() => {
    if (volume === 0 && !isMuted) {
      setIsMuted(true);
    } else if (volume > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [volume, isMuted]);

  // Handle errors from Spotify
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Only handle Spotify related errors
      if (
        event.message.includes('Spotify') ||
        event.message.includes('spotify') ||
        (event.error && (
          String(event.error).includes('Spotify') ||
          String(event.error).includes('spotify')
        ))
      ) {
        setError('Spotify playback error. Please refresh the page or reconnect.');
      }
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Update local playing state when the actual state changes
  useEffect(() => {
    setLocalPlayingState(isPlaying);
  }, [isPlaying]);

  // Handle play/pause toggle with better responsiveness
  const handlePlayPauseToggle = () => {
    // Update local state immediately for UI responsiveness
    setLocalPlayingState(!localPlayingState);
    
    // Then trigger the actual toggle
    manualTogglePlayPause().catch(() => {
      // If there's an error, revert the local state
      setLocalPlayingState(localPlayingState);
    });
  };

  // Improved progress tracking
  useEffect(() => {
    if (!currentTrack?.duration_ms) {
      setProgressValue(0);
      return;
    }

    // Initialize with current track data
    lastUpdateRef.current = {
      time: currentTrack?.progressTimestamp || Date.now(),
      position: currentTrack?.position_ms || 0
    };

    const duration = currentTrack?.duration_ms || 1; // Avoid division by zero
    
    // Animation frame loop for smooth progress updates
    let animationFrameId: number;
    
    const updateProgress = () => {
      if (isPlaying && currentTrack) { // Add null check here
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateRef.current.time;
        const estimatedPosition = Math.min(
          lastUpdateRef.current.position + timeSinceLastUpdate,
          duration
        );
        
        const newProgress = (estimatedPosition / duration) * 100;
        setProgressValue(newProgress);
      }
      
      animationFrameId = requestAnimationFrame(updateProgress);
    };
    
    animationFrameId = requestAnimationFrame(updateProgress);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentTrack, isPlaying]);

  // Don't show if not visible
  if (!visible) return null;
  
  // Display connect button if not authenticated
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-card p-3 rounded-lg shadow-lg flex items-center space-x-2">
        <Music className="h-5 w-5 text-primary" />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={connectToSpotify}
          className="text-xs"
        >
          Connect Spotify
        </Button>
      </div>
    );
  }
  
  // Display error state
  if (error) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-card p-3 rounded-lg shadow-lg flex items-center space-x-2 text-destructive border border-destructive">
        <span className="text-xs">{error}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setError(null)}
          className="h-5 w-5 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-card p-3 rounded-lg shadow-lg flex items-center space-x-2">
        <Music className="h-5 w-5 text-primary animate-pulse" />
        <span className="text-xs">Connecting to Spotify...</span>
      </div>
    );
  }
  
  // Minimized player
  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-card p-2 rounded-full shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMinimized(false)}
          className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Music className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  
  // Get album art URL from the track
  const getAlbumArtUrl = (track: Track | null): string | undefined => {
    if (!track || !track.album || !track.album.images || track.album.images.length === 0) {
      return undefined;
    }
    return track.album.images[0].url;
  };
  
  // Update the return statement with proper null checks
  if (!currentTrack) {
    return null;
  }
  
  // Full player
  return (
    <Card className="fixed bottom-4 right-4 p-3 shadow-lg w-64 z-50 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-center gap-3">
        {currentTrack.album?.images && currentTrack.album.images.length > 0 && (
          <img
            src={currentTrack.album.images[0].url}
            alt={currentTrack.album.name || 'Album cover'}
            className="w-12 h-12 rounded object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{currentTrack.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {currentTrack.artists?.map(a => a.name).join(', ')}
          </p>
          {/* Using non-interactive Progress component instead of Slider */}
          {/* This is intentional to prevent users from seeking to different parts of the music */}
          <Progress value={progressValue} className="h-1 mt-1" aria-readonly="true" />
        </div>
      </div>
      <div className="flex justify-center gap-2 mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={previousTrack}
          className="h-8 w-8 p-0 rounded-full"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handlePlayPauseToggle}
          className="h-8 w-8 p-0 rounded-full"
        >
          {localPlayingState ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={nextTrack}
          className="h-8 w-8 p-0 rounded-full"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2">
        <Slider
          value={[volume]}
          min={0}
          max={100}
          step={1}
          className="w-full h-1"
          onValueChange={(value) => {
            // Apply volume change immediately - no debouncing
            setVolume(value[0]);
          }}
        />
      </div>
    </Card>
  );
} 