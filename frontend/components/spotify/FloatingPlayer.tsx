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
  const [showControls, setShowControls] = useState(false);

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
    spotifyClient,
  } = useSpotify();

  // Track last update time for smoother progress calculation
  const lastUpdateRef = useRef<{time: number, position: number}>({
    time: Date.now(),
    position: currentTrack?.position_ms || 0
  });

  // Ref for tracking current values without dependency issues
  const stateRefs = useRef({
    visible: visible,
    isPlaying: isPlaying,
    localPlayingState: localPlayingState,
    spotifyClient: spotifyClient,
    deviceId: deviceId
  });

  // Ref for tracking track data
  const trackRef = useRef({
    duration: currentTrack?.duration_ms || 1,
    isPlaying: isPlaying
  });

  // Ref for tracking update info
  const updateRef = useRef(lastUpdateRef.current);

  // Update the initialization section to add fresh state tracking with stable dependencies
  useEffect(() => {
    // Force immediate synchronization with Spotify state
    setLocalPlayingState(isPlaying);
    if (currentTrack) {
      setVisible(true);
      setShowControls(true);
      setError(null);
      
      // Reset progress tracking
      lastUpdateRef.current = {
        time: currentTrack.progressTimestamp || Date.now(),
        position: currentTrack.position_ms || 0
      };
    }
    
    // Clear error when authenticated and ready
    if (isAuthenticated && isPlayerReady) {
      setError(null);
    }
  }, [isAuthenticated, isPlayerReady, isPlaying, currentTrack]);

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

  // Add active polling for track information with stable dependency array
  useEffect(() => {
    // Only proceed if authenticated
    if (!isAuthenticated) return;
    
    // Update refs when values change
    stateRefs.current = {
      visible: visible,
      isPlaying: isPlaying,
      localPlayingState: localPlayingState,
      spotifyClient: spotifyClient,
      deviceId: deviceId
    };
    
    let mounted = true;
    
    // Function to refresh track information and state
    const refreshTrackInfo = async () => {
      try {
        const { visible, isPlaying, localPlayingState, spotifyClient, deviceId } = stateRefs.current;
        
        // Skip if necessary dependencies are missing
        if (!spotifyClient || !deviceId) return;
        
        // Only poll if we are visible or music should be playing
        if (!visible && !isPlaying) return;
        
        // Get current playback state
        const playbackState = await spotifyClient.getPlaybackState();
        
        // Only update if component is still mounted
        if (!mounted) return;
        
        if (playbackState) {
          // Update playing state if needed
          if (playbackState.is_playing !== localPlayingState) {
            setLocalPlayingState(playbackState.is_playing);
          }
          
          // If we have current track info from playback state
          if (playbackState.item) {
            // Update progress reference
            lastUpdateRef.current = {
              time: Date.now(),
              position: playbackState.progress_ms || 0
            };
          }
        }
      } catch (error) {
        // Silent fail for polling operations
        console.debug('Silent polling error (handled):', error);
      }
    };
    
    // Initial refresh
    refreshTrackInfo();
    
    // Set polling interval with dynamic interval based on ref values
    const pollInterval = setInterval(() => {
      refreshTrackInfo();
    }, stateRefs.current.isPlaying ? 3000 : 10000);
    
    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [isAuthenticated]); // Only depend on authentication status

  // Improved progress tracking with stable dependencies
  useEffect(() => {
    // Skip if no track or duration
    if (!currentTrack?.duration_ms) {
      setProgressValue(0);
      return;
    }

    // Update ref when track data changes
    trackRef.current = {
      duration: currentTrack.duration_ms,
      isPlaying: isPlaying
    };

    // Initialize with current track data
    lastUpdateRef.current = {
      time: currentTrack.progressTimestamp || Date.now(),
      position: currentTrack.position_ms || 0
    };

    // Animation frame loop for smooth progress updates
    let animationFrameId: number;
    
    const updateProgress = () => {
      const { duration, isPlaying } = trackRef.current;
      
      if (isPlaying) {
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
  }, [currentTrack]); // Only depend on currentTrack changes

  // Ensure player controls remain visible after playback
  useEffect(() => {
    // Always show controls when music is playing
    if (isPlaying && currentTrack) {
      setShowControls(true);
      
      // Store this state in localStorage for cross-tab persistence
      localStorage.setItem('spotify_player_active', 'true');
      localStorage.setItem('music_was_playing', 'true');
      localStorage.setItem('spotify_last_played_timestamp', Date.now().toString());
    }
    
    // Keep controls visible for longer after playback stops
    if (!isPlaying && showControls) {
      // Check if we should keep it visible based on localStorage
      const keepVisible = localStorage.getItem('spotify_controls_pinned') === 'true';
      if (keepVisible) {
        return; // Don't hide if pinned
      }
      
      // Hide after a longer delay (2 minutes) to persist across tab changes
      const hideTimeout = setTimeout(() => {
        // Before hiding, check again if it should remain visible
        const isPinned = localStorage.getItem('spotify_controls_pinned') === 'true';
        const recentlyPlayed = localStorage.getItem('spotify_last_played_timestamp');
        
        if (!isPinned && recentlyPlayed) {
          // Only hide if it's been more than 2 minutes since last playback
          const timeElapsed = Date.now() - parseInt(recentlyPlayed);
          if (timeElapsed > 120000) {
            setShowControls(false);
          }
        }
      }, 120000); // 2 minute delay
      
      return () => clearTimeout(hideTimeout);
    }
  }, [isPlaying, currentTrack, showControls]);

  // Listen for route changes to maintain visibility
  useEffect(() => {
    const handleStorageChange = () => {
      // When localStorage changes, check if player should be visible
      const wasPlaying = localStorage.getItem('music_was_playing') === 'true';
      const isPinned = localStorage.getItem('spotify_controls_pinned') === 'true';
      
      if (wasPlaying || isPinned) {
        setShowControls(true);
      }
    };
    
    // Check on mount and when storage changes
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Add function to toggle controls visibility manually
  const toggleControls = () => {
    setShowControls(prev => !prev);
  };

  // Add a function to make controls always visible
  const pinControls = () => {
    setShowControls(true);
    // Store user preference
    localStorage.setItem('spotify_controls_pinned', 'true');
  };

  // Check for pinned preference on mount
  useEffect(() => {
    const pinnedPreference = localStorage.getItem('spotify_controls_pinned');
    if (pinnedPreference === 'true') {
      setShowControls(true);
    }
  }, []);

  // Add a function to minimize the player
  const minimizePlayer = () => {
    setMinimized(true);
  };

  // Force state synchronization with the main Spotify player
  useEffect(() => {
    // Immediately update local state to match the Spotify context
    setLocalPlayingState(isPlaying);
    
    // Reset all local states to ensure proper sync
    if (currentTrack) {
      // Update the progress based on the current track
      lastUpdateRef.current = {
        time: currentTrack.progressTimestamp || Date.now(),
        position: currentTrack.position_ms || 0
      };
      
      // Make sure UI reflects current track
      setVisible(true);
      setShowControls(true);
      
      // Store track info in localStorage for cross-tab persistence
      localStorage.setItem('spotify_current_track', JSON.stringify({
        name: currentTrack.name,
        id: currentTrack.id,
        timestamp: Date.now(),
        isPlaying: isPlaying
      }));
    }
    
    // Update volume state
    if (volume === 0) {
      setIsMuted(true);
    } else if (volume > 0) {
      setIsMuted(false);
    }
  }, [currentTrack, isPlaying, volume]);

  // Add aggressive polling for track state
  useEffect(() => {
    if (!isAuthenticated || !spotifyClient) return;
    
    let mounted = true;
    let pollTimer: NodeJS.Timeout;
    
    const fetchCurrentState = async () => {
      try {
        // Get current playback state directly from Spotify API
        const playbackState = await spotifyClient.getPlaybackState();
        
        if (!mounted || !playbackState) return;
        
        // Force sync playing state
        if (playbackState.is_playing !== localPlayingState) {
          setLocalPlayingState(playbackState.is_playing);
        }
        
        // Update progress tracking
        if (playbackState.progress_ms !== undefined) {
          lastUpdateRef.current = {
            time: Date.now(),
            position: playbackState.progress_ms
          };
        }
      } catch (error) {
        console.debug('Polling error (handled):', error);
      } finally {
        // Set up next poll with dynamic interval
        if (mounted) {
          const pollInterval = localPlayingState ? 2000 : 5000; // Poll more frequently when playing
          pollTimer = setTimeout(fetchCurrentState, pollInterval);
        }
      }
    };
    
    // Initial fetch
    fetchCurrentState();
    
    return () => {
      mounted = false;
      clearTimeout(pollTimer);
    };
  }, [isAuthenticated, spotifyClient, localPlayingState]);

  // Add immediate re-sync when visibility changes
  useEffect(() => {
    // Handle visibility change to ensure sync when tab becomes visible
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && spotifyClient) {
        try {
          // Refresh state from Spotify when tab becomes visible
          const playbackState = await spotifyClient.getPlaybackState();
          
          if (playbackState) {
            // Force UI update
            setLocalPlayingState(playbackState.is_playing);
            
            // Update progress
            if (playbackState.progress_ms !== undefined) {
              lastUpdateRef.current = {
                time: Date.now(),
                position: playbackState.progress_ms
              };
            }
          }
        } catch (error) {
          console.debug('Visibility sync error (handled):', error);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [spotifyClient]);

  // Enhanced global state change listener
  useEffect(() => {
    const handleSpotifyStateChange = (event: CustomEvent<any>) => {
      const data = event.detail;
      if (!data) return;
      
      // Force immediate UI updates
      if (data.isPlaying !== undefined) {
        setLocalPlayingState(data.isPlaying);
      }
      
      if (data.currentTrack) {
        // Make player visible when we have a track
        setVisible(true);
        setShowControls(true);
        
        // Update progress tracking
        if (data.timestamp) {
          lastUpdateRef.current = {
            time: data.timestamp,
            position: data.currentTrack.position_ms || 0
          };
        }
        
        // Store in localStorage for cross-component sync
        localStorage.setItem('spotify_current_track', JSON.stringify({
          name: data.currentTrack.name,
          id: data.currentTrack.id,
          timestamp: Date.now(),
          isPlaying: data.isPlaying
        }));
      }
    };
    
    // Add the event listener - non-typed to handle the custom event
    window.addEventListener('spotify-state-change', handleSpotifyStateChange as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('spotify-state-change', handleSpotifyStateChange as EventListener);
    };
  }, []);

  // Add error detection and recovery
  useEffect(() => {
    if (!error) return;
    
    // Auto-recovery attempt for specific errors
    if (
      error.includes('404') || 
      error.includes('device') || 
      error.includes('connection')
    ) {
      // Attempt automatic recovery after 2 seconds
      const timer = setTimeout(() => {
        const attemptRecovery = async () => {
          if (!deviceId || !spotifyClient) return;
          
          try {
            setError('Attempting to recover connection...');
            
            // Check if we can recover using client methods
            if (spotifyClient.reconnectDevice) {
              await spotifyClient.reconnectDevice(deviceId);
            } else if (spotifyClient.transferPlayback) {
              // Fallback to transfer playback
              await spotifyClient.transferPlayback(deviceId, isPlaying);
            }
            
            // Clear error if successful
            setError(null);
          } catch (err) {
            console.error('Error during recovery attempt:', err);
            setError('Recovery failed. Please refresh the page.');
          }
        };
        
        attemptRecovery();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [error, deviceId, spotifyClient, isPlaying]);

  // Add a periodic state refresh to keep UI in sync
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Function to refresh state from the main Spotify context
    const refreshState = () => {
      // Update local state to match the Spotify context
      setLocalPlayingState(isPlaying);
      
      // Make sure controls are visible when playing
      if (isPlaying && currentTrack) {
        setVisible(true);
        setShowControls(true);
      }
    };
    
    // Refresh state immediately
    refreshState();
    
    // Set up interval for periodic refresh (every second)
    const intervalId = setInterval(refreshState, 1000);
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, isPlaying, currentTrack]);

  // Add localStorage persistence for visibility state
  useEffect(() => {
    if (visible && showControls) {
      localStorage.setItem('spotify_player_visible', 'true');
      localStorage.setItem('spotify_controls_visible', 'true');
    }
  }, [visible, showControls]);

  // Don't show if not visible
  if (!visible) return null;
  
  // Don't show controls if they should be hidden
  if (!showControls && !isPlaying) return null;
  
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
  
  // Minimized player with proper null handling
  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-card/95 backdrop-blur rounded-lg shadow-lg flex items-center gap-2 p-2 pr-3 animate-in fade-in">
        {currentTrack?.album?.images?.[0]?.url ? (
          <img 
            src={currentTrack.album.images[0].url}
            alt={currentTrack.album.name || 'Album cover'}
            className="h-8 w-8 rounded object-cover cursor-pointer"
            onClick={() => setMinimized(false)}
          />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMinimized(false)}
            className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20"
          >
            <Music className="h-4 w-4 text-primary" />
          </Button>
        )}
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayPauseToggle}
            className="h-7 w-7 p-0 rounded-full"
            disabled={!currentTrack}
          >
            {localPlayingState ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
          </Button>
          
          {isPlaying && currentTrack && (
            <div className="max-w-[100px]">
              <p className="text-xs font-medium truncate">{currentTrack.name}</p>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setMinimized(false)}
          className="ml-1 p-1 hover:bg-accent rounded-sm"
          title="Expand player"
        >
          <span className="text-xs text-muted-foreground">Expand</span>
        </button>
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
  
  // Update return statement for full player
  // Full player with pin button
  // Only render if currentTrack is available
  if (!currentTrack) {
    return (
      <Card className="fixed bottom-4 right-4 p-3 shadow-lg w-64 z-50 animate-in fade-in slide-in-from-bottom-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleControls}
              className="p-1 hover:bg-accent rounded-sm"
              title="Toggle player"
            >
              <Music className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={minimizePlayer}
              className="p-1 hover:bg-accent rounded-sm"
              title="Minimize player"
            >
              <span className="text-xs text-muted-foreground">Minimize</span>
            </button>
          </div>
          <button
            onClick={pinControls}
            className="p-1 hover:bg-accent rounded-sm"
            title="Keep player visible"
          >
            <span className="text-xs text-muted-foreground">Pin</span>
          </button>
        </div>
        <div className="flex items-center justify-center py-4">
          <p className="text-sm text-muted-foreground">No track playing</p>
        </div>
      </Card>
    );
  }
  
  // Full player with pin button
  return (
    <Card className="fixed bottom-4 right-4 p-3 shadow-lg w-64 z-50 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleControls}
            className="p-1 hover:bg-accent rounded-sm"
            title="Toggle player"
          >
            <Music className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={minimizePlayer}
            className="p-1 hover:bg-accent rounded-sm"
            title="Minimize player"
          >
            <span className="text-xs text-muted-foreground">Minimize</span>
          </button>
        </div>
        <button
          onClick={pinControls}
          className="p-1 hover:bg-accent rounded-sm"
          title="Keep player visible"
        >
          {localStorage.getItem('spotify_controls_pinned') === 'true' ? (
            <span className="text-xs text-muted-foreground">• Pinned</span>
          ) : (
            <span className="text-xs text-muted-foreground">Pin</span>
          )}
        </button>
      </div>
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