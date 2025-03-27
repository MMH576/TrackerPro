'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSpotify } from '@/hooks/use-spotify';
import { Playlist, SpotifyClient, Track } from '@/utils/spotify-client';
import { AlertCircle, Music, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, Loader2, Shuffle, Repeat, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Cookies from 'js-cookie';
import { formatTime } from '@/utils/format';

export default function PlayerSpotify() {
  const {
    isAuthenticated,
    isLoading,
    isPlayerReady,
    playlists: spotifyPlaylists,
    selectedPlaylist,
    currentTrack,
    isPlaying,
    volume,
    deviceId,
    error,
    connectToSpotify,
    disconnectFromSpotify,
    selectPlaylist,
    playPlaylist,
    togglePlayPause,
    manualTogglePlayPause,
    nextTrack,
    previousTrack,
    setVolume,
    setCurrentTrack,
  } = useSpotify();

  // Cast playlists to the proper type
  const playlists = spotifyPlaylists as Playlist[];

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(50);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isFloatingPlayerVisible, setIsFloatingPlayerVisible] = useState(false);
  const [shuffleState, setShuffleState] = useState(false);
  const [isVolumeAdjusting, setIsVolumeAdjusting] = useState(false);

  // Add a local state for optimistic UI updates
  const [localPlayingState, setLocalPlayingState] = useState(isPlaying);

  // Sync local state with actual state
  useEffect(() => {
    setLocalPlayingState(isPlaying);
  }, [isPlaying]);

  // Check for errors in URL when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const queryParams = new URLSearchParams(window.location.search);
      const errorParam = queryParams.get('error');
      
      if (errorParam) {
        setErrorMessage(errorParam);
        
        // Remove the error parameter from the URL
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url.toString());

        // Clear error after 5 seconds
        const timer = setTimeout(() => {
          setErrorMessage(null);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Update error message when error changes
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      // Clear error after 5 seconds
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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

  // Handle connect button click
  const handleConnect = () => {
    setIsConnecting(true);
    setErrorMessage(null);
    
    try {
      // Add a slight delay to make the loading state visible
      // This gives the user visual feedback that something is happening
      setTimeout(() => {
        // Store the connection attempt in local storage to track authentication flow
        if (typeof window !== 'undefined') {
          localStorage.setItem('spotify_connection_attempted', 'true');
          localStorage.setItem('spotify_connection_timestamp', Date.now().toString());
        }
        
        // Use the connectToSpotify function from the context
        connectToSpotify();
      }, 300);
    } catch (error) {
      setIsConnecting(false);
      setErrorMessage('Failed to connect to Spotify. Please try again.');
    }
  };

  // Update the handlePlaylistSelect function to work with the Playlist type
  const handlePlaylistSelect = async (playlistId: string) => {
    setIsLoadingPlaylist(true);
    setErrorMessage(null);
    try {
      // Find the playlist in the list based on ID
      const playlist = playlists.find(p => p.id === playlistId);
      
      if (!playlist) {
        throw new Error('Playlist not found');
      }
      
      // First update the selected playlist
      selectPlaylist(playlist);
      
      // Immediately update local state for UI responsiveness
      setLocalPlayingState(true);
      
      // Then immediately play the playlist instead of toggling
      await playPlaylist(playlist);
    } catch (error: any) {
      console.error('Error selecting playlist:', error);
      setErrorMessage(`Failed to play playlist: ${error.message}`);
      // Reset local playing state on error
      setLocalPlayingState(isPlaying);
    } finally {
      setIsLoadingPlaylist(false);
    }
  };

  // Add a helper function to get album art URL
  const getAlbumArtUrl = (track: typeof currentTrack): string | undefined => {
    if (!track || !track.album || !track.album.images || track.album.images.length === 0) {
      return undefined;
    }
    return track.album.images[0].url;
  };

  // Check for authentication state on component mount
  useEffect(() => {
    // Check if we've just returned from a Spotify authorization
    if (typeof window !== 'undefined') {
      const connectionAttempted = localStorage.getItem('spotify_connection_attempted');
      const connectionTimestamp = localStorage.getItem('spotify_connection_timestamp');
      const accessToken = Cookies.get('spotify_access_token');
      
      // If we have a recent connection attempt and tokens, clear the connection flags
      if (connectionAttempted && connectionTimestamp && accessToken) {
        const timestamp = parseInt(connectionTimestamp);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        // Only consider connections that happened in the last 5 minutes
        if (now - timestamp < fiveMinutes) {
          console.log('Detected successful Spotify connection from recent auth flow');
          // Clear the connection attempt flags
          localStorage.removeItem('spotify_connection_attempted');
          localStorage.removeItem('spotify_connection_timestamp');
        }
      }
    }
  }, []);

  // Create a global ref for progress updates that can be accessed across effects
  const lastUpdateRef = useRef<{time: number, position: number}>({
    time: Date.now(),
    position: 0
  });

  // Update the track progress tracking to use the shared ref
  useEffect(() => {
    if (!currentTrack) {
      setProgressValue(0);
      return;
    }

    const duration = currentTrack.duration_ms || 300000; // Default to 5 minutes if duration unknown
    
    // Use the position from the track data if available
    let elapsed = currentTrack.position_ms !== undefined ? currentTrack.position_ms : 0;
    let startTime = currentTrack.progressTimestamp || Date.now();
    
    // Set initial progress value but don't reset if already playing
    if (!isPlaying || currentTrack.position_ms !== undefined) {
      setProgressValue((elapsed / duration) * 100);
    }
    
    // Update the reference with the latest values
    lastUpdateRef.current = {
      time: startTime,
      position: elapsed
    };
    
    let animationFrameId: number;
    
    const updateProgress = () => {
      // Calculate real-time progress based on elapsed time since last update
      if (isPlaying) {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateRef.current.time;
        const estimatedPosition = Math.min(
          lastUpdateRef.current.position + timeSinceLastUpdate,
          duration
        );
        
        const newProgress = (estimatedPosition / duration) * 100;
        setProgressValue(newProgress);
        
        // Request next animation frame
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        // Just keep requesting frames without updating when paused
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };
    
    // Start the animation loop
    animationFrameId = requestAnimationFrame(updateProgress);
    
    // Poll Spotify API for position updates to correct drift
    const pollInterval = setInterval(async () => {
      if (!isPlaying || !deviceId || !spotifyClient.current) return;
      
      try {
        const playbackState = await spotifyClient.current.getPlaybackState();
        if (playbackState && playbackState.progress_ms !== undefined) {
          const actualPosition = playbackState.progress_ms;
          const now = Date.now();
          
          // Update our reference with the actual position from Spotify
          lastUpdateRef.current = {
            time: now,
            position: actualPosition
          };
          
          // Calculate new progress based on actual position
          const actualProgress = (actualPosition / duration) * 100;
          setProgressValue(actualProgress);
        }
      } catch (error) {
        // Silent fail - just continue with our estimated position
        console.debug('Failed to get playback state for position correction:', error);
      }
    }, 3000); // Poll every 3 seconds to avoid rate limiting
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(pollInterval);
    };
  }, [currentTrack, isPlaying, deviceId]);

  // Add an effect to reset the progress when track changes
  useEffect(() => {
    // Reset progress when track changes
    if (currentTrack?.id) {
      setProgressValue((currentTrack.position_ms || 0) / (currentTrack.duration_ms || 1) * 100);
    } else {
      setProgressValue(0);
    }
  }, [currentTrack?.id]);

  // Add state to track seeking status
  const [isSeeking, setIsSeeking] = useState(false);

  // Create a proper value change handler with the correct type
  const handleProgressChange = (value: number[]) => {
    setProgressValue(value[0]);
  };

  // Add a ref to track the previous track ID for detecting track changes
  const previousTrackIdRef = useRef<string | null>(null);

  // Add another effect specifically to handle track changes
  useEffect(() => {
    const trackId = currentTrack?.id || null;
    
    // Check if the track has changed
    if (trackId && trackId !== previousTrackIdRef.current) {
      console.log('Track changed, updating progress information');
      
      // Update our reference to the new track
      previousTrackIdRef.current = trackId;
      
      // Get the initial position when a track changes
      if (spotifyClient.current && deviceId) {
        spotifyClient.current.getProgress(deviceId)
          .then(progress => {
            if (progress !== null && currentTrack) {
              // Update the current track with the latest position info
              const updatedTrack = {
                ...currentTrack,
                position_ms: progress,
                progressTimestamp: Date.now()
              };
              
              // Update the track object
              setCurrentTrack(updatedTrack);
              
              // Update the progress slider immediately
              if (currentTrack.duration_ms) {
                setProgressValue((progress / currentTrack.duration_ms) * 100);
              }
            }
          })
          .catch(error => {
            console.error('Failed to get initial track progress:', error);
          });
      }
    }
  }, [currentTrack?.id, deviceId]);

  // Update the handleSeek function to use the shared lastUpdateRef
  const handleSeek = async (value: number[]) => {
    if (!currentTrack || !currentTrack.duration_ms || !deviceId) return;
    
    // Set seeking state for visual feedback
    setIsSeeking(true);
    
    // Calculate the position in ms
    const position = Math.floor((value[0] / 100) * currentTrack.duration_ms);
    
    // Update local state immediately for UI responsiveness
    setProgressValue(value[0]);
    
    // Store the new position and timestamp in local tracking variables
    if (currentTrack) {
      // Update the track object with new position info for smoother progress
      const updatedTrack = {
        ...currentTrack,
        position_ms: position,
        progressTimestamp: Date.now()
      };
      
      // Update our shared ref immediately for smooth progress tracking
      lastUpdateRef.current = {
        time: Date.now(),
        position: position
      };
      
      // This trick forces the progress tracking effect to use the new position
      // without waiting for a state update from Spotify
      setCurrentTrack(updatedTrack);
    }
    
    try {
      // Use the SpotifyClient dynamically
      if (!spotifyClient.current) {
        spotifyClient.current = new SpotifyClient();
      }
      
      // Call the seek method with the correct parameters
      await spotifyClient.current.seek(deviceId, position);
    } catch (error) {
      console.error('Error seeking:', error);
    } finally {
      // Clear seeking state after a small delay
      setTimeout(() => setIsSeeking(false), 300);
    }
  };

  // Add a separate handler for the seek start
  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  // Add a separate handler for the seek end
  const handleSeekEnd = (value: number[]) => {
    handleSeek(value);
  };

  // Create visibility tracking for floating player
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Show floating player when page is hidden but music is playing
      if (document.visibilityState === 'hidden' && isPlaying && currentTrack) {
        setIsFloatingPlayerVisible(true);
      } else {
        setIsFloatingPlayerVisible(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, currentTrack]);

  // Add a ref to track if volume is being adjusted
  const isAdjustingVolume = useRef(false);

  // Simplified volume change handler with instant feedback
  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    
    // Update UI state instantly
    setDebouncedVolume(newVolume);
    setIsVolumeAdjusting(true);
    
    // Apply volume change immediately without waiting
    setVolume(newVolume);
    
    // Clear any previous timeout to hide the volume UI
    if (volumeFlagTimeout.current) {
      clearTimeout(volumeFlagTimeout.current);
    }
    
    // Set a timeout to hide the volume UI after adjustment
    volumeFlagTimeout.current = setTimeout(() => {
      setIsVolumeAdjusting(false);
      volumeFlagTimeout.current = null;
    }, 800);
  }, [setVolume]);

  // Add a debounced volume change handler to prevent playback interruptions
  const [debouncedVolume, setDebouncedVolume] = useState(volume);

  // Apply the volume change to Spotify with a slight delay
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (debouncedVolume !== volume) {
        setVolume(debouncedVolume);
      }
    }, 200); // 200ms delay before applying volume change

    return () => clearTimeout(timeoutId);
  }, [debouncedVolume, setVolume, volume]);

  // Enhance the error suppression to specifically target the PlayLoad 404 errors
  useEffect(() => {
    // Original console.error function
    const originalConsoleError = console.error;
    
    // More aggressively filter PlayLoad and cpapi.spotify.com errors
    console.error = function(...args) {
      // Check more thoroughly for Spotify SDK errors
      const isSpotifyError = args.some(arg => {
        if (typeof arg === 'string') {
          return arg.includes('cpapi.spotify.com') || 
                 arg.includes('PlayLoad') || 
                 arg.includes('CloudPlaybackClientError') ||
                 arg.includes('item_before_load') ||
                 arg.includes('404');
        }
        if (arg instanceof Error) {
          return arg.message.includes('cpapi.spotify.com') || 
                 arg.message.includes('PlayLoad') || 
                 arg.message.includes('CloudPlaybackClientError');
        }
        return false;
      });
      
      if (isSpotifyError) {
        // Completely suppress these errors to avoid console noise
        return;
      }
      
      // Pass through all other errors
      originalConsoleError.apply(console, args);
    };
    
    // Handle global errors to catch the 404 from Spotify SDK
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      if (
        (typeof message === 'string' && (
          message.includes('404') ||
          message.includes('cpapi.spotify.com') ||
          message.includes('PlayLoad') ||
          message.includes('CloudPlaybackClientError')
        )) ||
        (source && typeof source === 'string' && source.includes('spotify'))
      ) {
        // Return true to indicate the error was handled
        return true;
      }
      
      // Let the original handler deal with other errors
      return originalOnError ? originalOnError.call(this, message, source, lineno, colno, error) : false;
    };
    
    // Handle unhandled promise rejections related to Spotify
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      if (
        (error && typeof error.message === 'string' && (
          error.message.includes('404') ||
          error.message.includes('cpapi.spotify.com') ||
          error.message.includes('PlayLoad') ||
          error.message.includes('CloudPlaybackClientError')
        )) ||
        (error && error.stack && error.stack.includes('spotify'))
      ) {
        // Prevent the default handling
        event.preventDefault();
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Apply custom fixes for Spotify's Web Player
    if (typeof window !== 'undefined') {
      // Use sessionStorage to mark that we've applied the patch
      try {
        sessionStorage.setItem('spotify_error_patch_applied', 'true');
      } catch (e) {
        // Ignore storage errors
      }
    }
    
    // Restore original functions on cleanup
    return () => {
      console.error = originalConsoleError;
      window.onerror = originalOnError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Make sure the spotifyClient is available
  const spotifyClient = useRef<SpotifyClient | null>(null);

  // Initialize the Spotify client if needed
  useEffect(() => {
    if (!spotifyClient.current) {
      // Import the SpotifyClient dynamically
      import('@/utils/spotify-client').then(({ SpotifyClient }) => {
        spotifyClient.current = new SpotifyClient();
      });
    }
  }, []);

  // Get the playlist ID safely
  const getPlaylistId = (playlist: any): string => {
    return playlist?.id ? String(playlist.id) : '';
  };

  // Add visibility change handling to ensure progress tracking works when switching tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      // When the page becomes visible again, update our reference time
      // to prevent a jump in progress calculation
      if (document.visibilityState === 'visible' && isPlaying && currentTrack) {
        // Reset the lastUpdateRef to the current time but keep the position
        // This prevents progress from jumping ahead when returning to the tab
        const currentPosition = lastUpdateRef.current.position;
        lastUpdateRef.current = {
          time: Date.now(),
          position: currentPosition
        };
        
        // Also fetch the actual position from Spotify to correct any drift
        if (spotifyClient.current && deviceId) {
          spotifyClient.current.getProgress(deviceId)
            .then((progress: number | null) => {
              if (progress !== null) {
                // Update our tracking with the actual position
                lastUpdateRef.current = {
                  time: Date.now(),
                  position: progress
                };
                
                // Update the UI
                if (currentTrack?.duration_ms) {
                  setProgressValue((progress / currentTrack.duration_ms) * 100);
                }
              }
            })
            .catch(error => {
              console.debug('Failed to get progress after visibility change:', error);
            });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, currentTrack, deviceId]);

  // Add a ref for tracking volume adjustment state timeout
  const volumeFlagTimeout = useRef<NodeJS.Timeout | null>(null);

  // Update the play/pause handler to be compatible with the simplified volume control
  const handlePlayPauseToggle = useCallback(() => {
    // Update the local state immediately for UI feedback
    setLocalPlayingState(!localPlayingState);
    
    // Trigger the actual toggle using the manual function
    manualTogglePlayPause().catch(() => {
      // If there's an error, revert the local state
      setLocalPlayingState(localPlayingState);
    });
  }, [manualTogglePlayPause, localPlayingState]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (volumeFlagTimeout.current) {
        clearTimeout(volumeFlagTimeout.current);
      }
    };
  }, []);

  // Display authentication view
  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
        {errorMessage && (
          <Alert variant="destructive" className="mb-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <div className="text-center">
          <div className="bg-primary/10 inline-flex rounded-full p-4 mb-4">
            <Music className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Enhance Your Focus</h3>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Connect your Spotify Premium account to play music during your Pomodoro sessions
          </p>
        </div>
        <Button 
          onClick={handleConnect} 
          className="w-full flex items-center justify-center bg-[#1DB954] hover:bg-[#1ED760] text-white font-medium py-5"
          disabled={isConnecting}
        >
          {isConnecting ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <svg 
              className="h-5 w-5 mr-2" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.5-1.5-5.7-1.9-9.4-1-1.6.4-2.3-1.2-1.3-2.3 2.5-2.7 6.2-3.5 9.6-2.1.4.1.5.6.4 1-.2.4-.6.6-1 .4-2.8-1.1-5.7-.5-7.8 1.7 3.2-.7 5.9-.3 8 .9.4.2.4.7.2 1zm1.5-3.3c-.3.4-.8.5-1.2.3-2.9-1.8-7.2-2.3-10.6-1.2-2 .5-3-1.4-1.8-2.8 3.1-3.4 7.4-4.4 11.4-2.8.5.2.7.8.5 1.3-.2.4-.7.6-1.1.4-3.3-1.2-6.8-.5-9.4 2.1 2.9-.6 6.6-.2 9.1 1.4.4.3.6.8.3 1.3zm.1-3.5c-3.4-2-9-2.2-12.2-1.2-2.4.7-3.6-1.7-2.1-3.4 3.6-4.2 9.3-5.4 13.6-3.5.6.3.9 1 .6 1.6-.3.6-.9.8-1.5.6-3.7-1.5-8.5-.7-11.6 2.6 2.7-.6 7.2-.2 10.3 1.7.6.4.8 1 .5 1.6-.3.5-.9.7-1.5.4z" />
            </svg>
          )}
          Connect Spotify Premium
        </Button>
      </div>
    );
  }

  // Display loading state
  if (isLoadingPlaylist || !deviceId) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col items-center justify-center p-8 h-[280px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Initializing Spotify player...</p>
        
        {/* Automatic error recovery after 10 seconds of loading */}
        <LoadingTimeout 
          onTimeout={() => disconnectFromSpotify()} 
          timeoutMs={20000} 
        />
      </div>
    );
  }

  // Floating mini-player (shown when tab is inactive but music is playing)
  if (isFloatingPlayerVisible) {
    return (
      <div className="fixed bottom-4 right-4 rounded-lg border bg-card/95 backdrop-blur text-card-foreground shadow-lg p-4 space-y-2 max-w-xs animate-in fade-in slide-in-from-bottom-5">
        <div className="flex items-center gap-3">
          {currentTrack?.album?.images?.[0]?.url && (
            <img 
              src={currentTrack.album.images[0].url} 
              alt={currentTrack.album.name}
              className="w-12 h-12 rounded object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{currentTrack?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {currentTrack?.artists?.map((a: { name: string }) => a.name).join(', ')}
            </p>
            <Progress value={progressValue} className="h-1 mt-1" />
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-1">
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
      </div>
    );
  }

  // Fully loaded player UI
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      {!isAuthenticated ? (
        <div className="flex flex-col items-center justify-center p-8 h-[280px]">
          <Music className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-4">Connect Your Spotify Premium Account</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Connect to Spotify to play your music while you work.
          </p>
          <Button 
            onClick={handleConnect} 
            className="w-full flex items-center justify-center bg-[#1DB954] hover:bg-[#1ED760] text-white font-medium py-5"
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <svg 
                className="h-5 w-5 mr-2" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.5-1.5-5.7-1.9-9.4-1-1.6.4-2.3-1.2-1.3-2.3 2.5-2.7 6.2-3.5 9.6-2.1.4.1.5.6.4 1-.2.4-.6.6-1 .4-2.8-1.1-5.7-.5-7.8 1.7 3.2-.7 5.9-.3 8 .9.4.2.4.7.2 1zm1.5-3.3c-.3.4-.8.5-1.2.3-2.9-1.8-7.2-2.3-10.6-1.2-2 .5-3-1.4-1.8-2.8 3.1-3.4 7.4-4.4 11.4-2.8.5.2.7.8.5 1.3-.2.4-.7.6-1.1.4-3.3-1.2-6.8-.5-9.4 2.1 2.9-.6 6.6-.2 9.1 1.4.4.3.6.8.3 1.3zm.1-3.5c-3.4-2-9-2.2-12.2-1.2-2.4.7-3.6-1.7-2.1-3.4 3.6-4.2 9.3-5.4 13.6-3.5.6.3.9 1 .6 1.6-.3.6-.9.8-1.5.6-3.7-1.5-8.5-.7-11.6 2.6 2.7-.6 7.2-.2 10.3 1.7.6.4.8 1 .5 1.6-.3.5-.9.7-1.5.4z" />
              </svg>
            )}
            Connect Spotify Premium
          </Button>
        </div>
      ) : errorMessage ? (
        <div className="p-6">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleConnect}
            >
              Reconnect
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={disconnectFromSpotify}
              className="ml-2"
            >
              Disconnect
            </Button>
          </div>
        </div>
      ) : isLoading || !deviceId ? (
        <div className="flex flex-col items-center justify-center p-8 h-[280px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Initializing Spotify player...</p>
          
          {/* Automatic error recovery after timeout */}
          <LoadingTimeout 
            onTimeout={() => disconnectFromSpotify()} 
            timeoutMs={20000} 
          />
        </div>
      ) : (
        <div className="p-5">
          <div className="grid gap-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium mb-2 block">Your Music</label>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={previousTrack}
                  className="h-8 w-8 p-0 rounded-full"
                  disabled={!currentTrack}
                >
                  <SkipBack className="h-3.5 w-3.5" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handlePlayPauseToggle}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  {localPlayingState ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={nextTrack}
                  className="h-8 w-8 p-0 rounded-full"
                  disabled={!currentTrack}
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={disconnectFromSpotify}
                  className="ml-2"
                >
                  Disconnect
                </Button>
              </div>
            </div>
            
            <Select
              value={getPlaylistId(selectedPlaylist)}
              onValueChange={handlePlaylistSelect}
              disabled={isLoadingPlaylist}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a playlist" />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  // Use an immediate function to perform the mapping with proper type handling
                  if (!Array.isArray(playlists) || playlists.length === 0) {
                    return <SelectItem value="empty" disabled>No playlists found</SelectItem>;
                  }
                  
                  // Map playlists with explicit typing
                  return playlists.map((playlist) => {
                    // Safely access properties with optional chaining
                    const id = (playlist as any)?.id || 'unknown';
                    const name = (playlist as any)?.name || 'Unnamed Playlist';
                    
                    return (
                      <SelectItem key={id} value={String(id)}>
                        {name}
                      </SelectItem>
                    );
                  });
                })()}
              </SelectContent>
            </Select>
            
            {!selectedPlaylist ? (
              <div className="flex items-center justify-center py-8">
                <Music className="h-5 w-5 text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">
                  {getPlaylistId(selectedPlaylist) ? "Ready to play" : "Select a playlist to begin"}
                </span>
              </div>
            ) : currentTrack ? (
              <div className="mt-4">
                <div className="flex items-start space-x-4">
                  {getAlbumArtUrl(currentTrack) ? (
                    <img 
                      src={getAlbumArtUrl(currentTrack)} 
                      alt={`${currentTrack.name} album art`}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center">
                      <Music className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{currentTrack.name}</h3>
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {currentTrack.artists?.map(a => a.name).join(', ')}
                    </p>
                    
                    <div className="space-y-4 mt-3 mb-2">
                      <div className="space-y-2">
                        <Slider 
                          value={[progressValue]} 
                          min={0} 
                          max={100} 
                          step={0.1} 
                          className={cn("w-full h-1.5", isSeeking && "opacity-70")}
                          onValueChange={handleProgressChange}
                          onValueCommit={handleSeekEnd}
                          onPointerDown={handleSeekStart}
                        />
                        
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatTime((currentTrack.duration_ms || 0) * (progressValue / 100))}</span>
                          <span>{formatTime(currentTrack.duration_ms || 0)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost" 
                          size="sm"
                          onClick={handleMuteToggle}
                          className="h-8 w-8 p-0 rounded-full"
                        >
                          {isMuted ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Slider
                          value={[debouncedVolume]}
                          min={0}
                          max={100}
                          step={1}
                          className={cn("w-24", isVolumeAdjusting && "opacity-100")}
                          onValueChange={handleVolumeChange}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" 
                                size="sm"
                                className={cn("h-8 w-8", shuffleState && "text-primary")}
                                onClick={() => setShuffleState(!shuffleState)}
                                disabled={!getPlaylistId(selectedPlaylist)}
                              >
                                <Shuffle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Shuffle</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Loading your music...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Loading timeout helper component
function LoadingTimeout({ onTimeout, timeoutMs = 20000 }: { onTimeout: () => void, timeoutMs?: number }) {
  const [showRetry, setShowRetry] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRetry(true);
    }, timeoutMs);
    
    return () => clearTimeout(timer);
  }, [timeoutMs]);
  
  if (!showRetry) return null;
  
  return (
    <div className="mt-6 flex flex-col items-center">
      <div className="text-sm text-muted-foreground mb-2">
        It's taking longer than expected to initialize...
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onTimeout}
        className="flex items-center gap-2"
      >
        <RotateCw className="h-4 w-4" />
        Reconnect
      </Button>
    </div>
  );
} 