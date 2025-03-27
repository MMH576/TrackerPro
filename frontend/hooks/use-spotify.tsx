'use client';

import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import Cookies from 'js-cookie';
import { SpotifyClient, Playlist, Track } from '@/utils/spotify-client';

type SpotifyContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  isPlayerReady: boolean;
  user: any | null;
  deviceId: string | null;
  error: string | null;
  playlists: Playlist[];
  selectedPlaylist: Playlist | null;
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  shuffleState: boolean;
  connectToSpotify: () => void;
  disconnectFromSpotify: () => void;
  selectPlaylist: (playlist: Playlist) => void;
  playPlaylist: (playlist: Playlist, offset?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  setVolume: (volume: number) => void;
  toggleShuffle: () => Promise<void>;
  setShuffleState: (state: boolean) => Promise<void>;
  setCurrentTrack: (track: Track | null) => void;
  manualTogglePlayPause: () => Promise<void>;
  isManualControl: boolean;
  resetManualControl: () => void;
  getManualControlStatus: () => boolean;
};

const defaultContext: SpotifyContextType = {
  isAuthenticated: false,
  isLoading: false,
  isPlayerReady: false,
  user: null,
  deviceId: null,
  error: null,
  playlists: [],
  selectedPlaylist: null,
  currentTrack: null,
  isPlaying: false,
  volume: 50,
  shuffleState: false,
  connectToSpotify: () => {},
  disconnectFromSpotify: () => {},
  selectPlaylist: () => {},
  playPlaylist: async () => {},
  togglePlayPause: async () => {},
  nextTrack: async () => {},
  previousTrack: async () => {},
  setVolume: () => {},
  toggleShuffle: async () => {},
  setShuffleState: async () => {},
  setCurrentTrack: () => {},
  manualTogglePlayPause: async () => {},
  isManualControl: false,
  resetManualControl: () => {},
  getManualControlStatus: () => false,
};

const SpotifyContext = createContext<SpotifyContextType>(defaultContext);

export const SpotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(50);
  const [shuffleState, setShuffleState] = useState(false);
  
  const spotifyClient = useRef<SpotifyClient | null>(null);
  const playerRef = useRef<Spotify.Player | null>(null);
  const playerInitAttempts = useRef(0);
  const maxInitAttempts = 3;
  const isTogglingPlayback = useRef(false);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualControl = useRef(false);
  const volumeOperationInProgressRef = useRef<boolean>(false);
  const volumeQueuedValueRef = useRef<number | null>(null);

  // Initialize Spotify client
  useEffect(() => {
    if (!spotifyClient.current) {
      spotifyClient.current = new SpotifyClient();
    }
    
    // Check if user is authenticated by looking for tokens in cookies
    const accessToken = Cookies.get('spotify_access_token');
    const refreshToken = Cookies.get('spotify_refresh_token');
    
    if (accessToken && refreshToken) {
      console.log('Found Spotify tokens in cookies, checking validity...');
      checkAuthentication();
    } else {
      console.log('No Spotify tokens found in cookies');
      setIsLoading(false);
      setIsAuthenticated(false);
    }
  }, []);

  // Check if user is authenticated
  const checkAuthentication = useCallback(async () => {
    if (!spotifyClient.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const profile = await spotifyClient.current.getProfile();
      setUser(profile);
      setIsAuthenticated(true);
      
      console.log('Successfully authenticated with Spotify');
      
      // Load playlists once authenticated
      const userPlaylists = await spotifyClient.current.getUserPlaylists();
      setPlaylists(userPlaylists);
      
      // Get current playback state including shuffle state
      try {
        const playbackState = await spotifyClient.current.getPlaybackState();
        if (playbackState && playbackState.shuffle_state !== undefined) {
          setShuffleState(playbackState.shuffle_state);
        }
      } catch (e) {
        console.log('Could not get initial shuffle state', e);
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error checking Spotify authentication:', err);
      setIsAuthenticated(false);
      setIsLoading(false);
      
      // Only set error if it's a meaningful error (not a simple auth check failure)
      if (err.message && !err.message.includes('token') && !err.message.includes('auth')) {
        setError(`Authentication error: ${err.message}`);
      }
    }
  }, []);

  // Load the Spotify Web Playback SDK
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    const loadSpotifySDK = () => {
      // Only load the SDK if it's not already loaded
      if (!window.Spotify && !document.getElementById('spotify-player-script')) {
        const script = document.createElement('script');
        script.id = 'spotify-player-script';
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        
        document.body.appendChild(script);
        
        window.onSpotifyWebPlaybackSDKReady = () => {
          console.log('Spotify Web Playback SDK is ready');
          setIsPlayerReady(true);
        };
      } else if (window.Spotify) {
        console.log('Spotify SDK already loaded');
        setIsPlayerReady(true);
      }
    };
    
    loadSpotifySDK();
    
    // Handle visibility changes to ensure playback continues between tabs
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if we were playing when the tab became hidden
        if (localStorage.getItem('spotify_playing_state') === 'playing' && deviceId) {
          console.log('Page became visible, resuming playback if needed');
          // We don't immediately resume because the player might still be playing
          // Just update our state to match what we think is happening
          setIsPlaying(true);
        }
      } else {
        // Tab is hidden, save current state
        if (isPlaying && deviceId) {
          localStorage.setItem('spotify_playing_state', 'playing');
          localStorage.setItem('spotify_device_id', deviceId);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    
  }, [isAuthenticated, user, deviceId, isPlaying]);

  // Check for stored playback state on component mount
  useEffect(() => {
    if (!isAuthenticated || !deviceId) return;
    
    const checkStoredPlaybackState = async () => {
      const playingState = localStorage.getItem('spotify_playing_state');
      const storedDeviceId = localStorage.getItem('spotify_device_id');
      
      if (playingState === 'playing' && deviceId && spotifyClient.current) {
        console.log('Found stored playing state, ensuring playback continues');
        
        try {
          // Get the current playback state from Spotify
          const playbackState = await spotifyClient.current.getPlaybackState();
          
          // If not playing or playing on another device, transfer back to our device
          if (!playbackState?.is_playing || (storedDeviceId && playbackState?.device?.id !== storedDeviceId)) {
            console.log('Transferring playback to continue music');
            await spotifyClient.current.transferPlayback(deviceId, true); // Resume playing
            setIsPlaying(true);
          }
        } catch (error) {
          console.error('Error checking stored playback state:', error);
        }
      }
    };
    
    checkStoredPlaybackState();
  }, [isAuthenticated, deviceId]);

  // Initialize the Spotify player when SDK is ready
  useEffect(() => {
    // Prevent initialization if we've already maxed out retry attempts
    if (!isAuthenticated || !isPlayerReady || playerRef.current || playerInitAttempts.current >= maxInitAttempts) return;
    
    // Set a timeout to ensure we don't get stuck in a loading state
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Spotify player initialization timeout - forcing state update');
        setIsLoading(false);
        setError('Spotify player initialization timed out. Please refresh the page or try again later.');
      }
    }, 15000); // 15 seconds timeout
    
    const initializePlayer = async () => {
      if (playerInitAttempts.current >= maxInitAttempts) {
        console.error('Max Spotify player initialization attempts reached');
        setError('Failed to initialize Spotify player after multiple attempts');
        setIsLoading(false);
        clearTimeout(loadingTimeout);
        return;
      }
      
      try {
        console.log('Initializing Spotify Web Playback SDK player...');
        
        // Get access token directly from cookies
        const accessToken = Cookies.get('spotify_access_token');
        
        if (!accessToken) {
          console.error('No access token available for player initialization');
          setError('No access token available for Spotify player');
          setIsLoading(false);
          clearTimeout(loadingTimeout);
          return;
        }
        
        const player = new window.Spotify.Player({
          name: 'TrackerPro Web Player',
          getOAuthToken: (callback: (token: string) => void) => {
            callback(accessToken);
          },
          volume: volumeLevel / 100
        });
        
        // Error handling
        player.addListener('initialization_error', ({ message }) => {
          console.error('Spotify player initialization error:', message);
          setError(`Player initialization error: ${message}`);
          setIsLoading(false);
          clearTimeout(loadingTimeout);
          // Increment attempt count on errors to avoid infinite loops
          playerInitAttempts.current += 1;
        });
        
        player.addListener('authentication_error', ({ message }) => {
          console.error('Spotify player authentication error:', message);
          setError(`Player authentication error: ${message}`);
          setIsLoading(false);
          clearTimeout(loadingTimeout);
          // Authentication errors - likely need to reconnect
          // Increment attempt count on errors to avoid infinite loops
          playerInitAttempts.current += 1;
        });
        
        player.addListener('account_error', ({ message }) => {
          console.error('Spotify player account error:', message);
          setError(`Player account error: ${message}`);
          setIsLoading(false);
          clearTimeout(loadingTimeout);
          // Increment attempt count on errors to avoid infinite loops
          playerInitAttempts.current += 1;
        });
        
        player.addListener('playback_error', ({ message }) => {
          console.error('Spotify player playback error:', message);
          setError(`Playback error: ${message}`);
        });
        
        // Ready handling
        player.addListener('ready', ({ device_id }) => {
          console.log('Spotify player ready with device ID:', device_id);
          setDeviceId(device_id);
          setIsLoading(false);
          clearTimeout(loadingTimeout);
          
          // Transfer playback to this device
          if (spotifyClient.current) {
            // Wrap in a try/catch to prevent uncaught promise rejections
            try {
              spotifyClient.current.transferPlayback(device_id)
                .then(() => console.log('Playback transferred to web player'))
                .catch(e => {
                  // Log but continue - transfer is not critical as long as device exists
                  console.error('Failed to transfer playback:', e);
                  console.log('Continuing anyway - playback should still work');
                  // Don't set error state as this is non-critical
                });
            } catch (error) {
              console.error('Error during transfer playback call:', error);
            }
          }
        });
        
        // Not ready handling
        player.addListener('not_ready', ({ device_id }) => {
          console.log('Spotify player device has gone offline:', device_id);
          if (deviceId === device_id) {
            setDeviceId(null);
          }
        });
        
        // State changes - Enhanced to better track the actual position and state
        player.addListener('player_state_changed', (state) => {
          if (!state) {
            console.log('No playback state available');
            return;
          }
          
          // Don't log the entire state to avoid console noise
          console.log('Spotify player state changed');
          
          // Update shuffle state
          if (state.shuffle !== undefined) {
            setShuffleState(state.shuffle);
          }
          
          // Update current track with more accurate position info
          if (state.track_window?.current_track) {
            const { current_track } = state.track_window;
            
            // Make sure the ID is never null
            const trackId = current_track.id || current_track.uri.split(':').pop() || '';
            
            // Store the position to enable more accurate progress tracking
            const position = state.position;
            
            // Update progress timestamp to enable accurate timeline tracking
            const progressTimestamp = Date.now();
            
            setCurrentTrack({
              id: trackId,
              name: current_track.name,
              uri: current_track.uri,
              duration_ms: current_track.duration_ms,
              position_ms: position,
              progressTimestamp: progressTimestamp,
              album: {
                id: current_track.album.uri.split(':').pop() || '',
                name: current_track.album.name,
                images: current_track.album.images.map((img: any) => ({
                  url: img.url,
                  height: img.height,
                  width: img.width
                }))
              },
              artists: current_track.artists.map((artist: any) => ({
                id: artist.uri.split(':').pop() || '',
                name: artist.name
              }))
            });
          } else {
            setCurrentTrack(null);
          }
          
          // Immediately update playing state to avoid UI lag
          setIsPlaying(!state.paused);
        });
        
        // Connect and store the player
        let connected = false;
        
        try {
          connected = await player.connect();
        } catch (err) {
          console.error('Error connecting to Spotify player:', err);
          // Force player to disconnect and clean up if there was an error
          try {
            await player.disconnect();
          } catch (disconnectErr) {
            console.error('Error disconnecting player after failed connection:', disconnectErr);
          }
          
          // Increment initialization attempts
          playerInitAttempts.current += 1;
          
          // Retry after a delay if under max attempts
          if (playerInitAttempts.current < maxInitAttempts) {
            console.log(`Retrying player connection (attempt ${playerInitAttempts.current + 1}/${maxInitAttempts})...`);
            setTimeout(initializePlayer, 2000);
          } else {
            setIsLoading(false);
            setError('Failed to connect to Spotify player. Please refresh the page and try again.');
            clearTimeout(loadingTimeout);
          }
          
          return;
        }
        
        if (connected) {
          console.log('Successfully connected to Spotify player');
          playerRef.current = player;
        } else {
          console.error('Failed to connect to Spotify player');
          setError('Failed to connect to Spotify player');
          
          // Increment initialization attempts
          playerInitAttempts.current += 1;
          
          // Retry after a delay if under max attempts
          if (playerInitAttempts.current < maxInitAttempts) {
            console.log(`Retrying player connection (attempt ${playerInitAttempts.current + 1}/${maxInitAttempts})...`);
            setTimeout(initializePlayer, 2000);
          } else {
            setIsLoading(false);
            clearTimeout(loadingTimeout);
          }
        }
      } catch (err: any) {
        console.error('Error initializing Spotify player:', err);
        setError(`Player error: ${err.message}`);
        setIsLoading(false);
        clearTimeout(loadingTimeout);
        
        // Increment initialization attempts
        playerInitAttempts.current += 1;
      }
    };
    
    initializePlayer();
    
    // Cleanup function
    return () => {
      clearTimeout(loadingTimeout);
      if (playerRef.current) {
        console.log('Disconnecting Spotify player...');
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
  }, [isAuthenticated, isPlayerReady, volumeLevel]);

  // Connect to Spotify (redirects to authorization)
  const connectToSpotify = useCallback(() => {
    // Get the current path for returning to after authentication
    const currentPath = typeof window !== 'undefined' 
      ? window.location.pathname 
      : '/pomodoro';
      
    // Redirect to authentication endpoint
    window.location.href = `/api/auth/spotify?returnTo=${encodeURIComponent(currentPath)}`;
  }, []);

  // Disconnect from Spotify
  const disconnectFromSpotify = useCallback(() => {
    // Set initial state to prevent re-initialization during cleanup
    setIsLoading(true);
    
    // Reset attempt counter to allow fresh reconnections
    playerInitAttempts.current = 0;
    
    // Disconnect player
    if (playerRef.current) {
      try {
        console.log('Disconnecting Spotify player...');
        playerRef.current.disconnect();
      } catch (e) {
        console.warn('Error disconnecting player:', e);
      } finally {
        playerRef.current = null;
      }
    }
    
    // Clear cookies
    Cookies.remove('spotify_access_token');
    Cookies.remove('spotify_refresh_token');
    Cookies.remove('spotify_token_expiry');
    Cookies.remove('spotify_connected');
    
    // Reset state
    setIsAuthenticated(false);
    setUser(null);
    setDeviceId(null);
    setPlaylists([]);
    setSelectedPlaylist(null);
    setCurrentTrack(null);
    setIsPlaying(false);
    setIsPlayerReady(false);
    setError(null);
    setShuffleState(false);
    
    // Set loading to false after the state is reset
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    console.log('Disconnected from Spotify');
  }, []);

  // Select a playlist
  const selectPlaylist = useCallback((playlist: Playlist) => {
    setSelectedPlaylist(playlist);
  }, []);

  // Play a specific playlist
  const playPlaylist = useCallback(async (playlist: Playlist, offset: number = 0) => {
    if (!deviceId || !spotifyClient.current) return;
    
    try {
      setError(null);
      
      // First try to ensure the device is ready by transferring playback to it
      try {
        await spotifyClient.current.transferPlayback(deviceId);
        // Small delay to ensure transfer completes
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (transferError) {
        // Log but continue - transfer is not critical as long as device exists
        console.log('Transfer attempt before playback failed (continuing):', transferError);
      }
      
      // Now try to play with retry logic built in
      try {
        await spotifyClient.current.play(deviceId, {
          context_uri: `spotify:playlist:${playlist.id}`,
          offset: { position: offset }
        }, true); // Use suppressErrors=true to prevent throwing on first try
      } catch (firstPlayError) {
        console.warn('First play attempt failed, retrying:', firstPlayError);
        
        // Wait a bit longer and retry without suppressing errors
        await new Promise(resolve => setTimeout(resolve, 1200));
        await spotifyClient.current.play(deviceId, {
          context_uri: `spotify:playlist:${playlist.id}`,
          offset: { position: offset }
        });
      }
    } catch (err: any) {
      console.error('Error playing playlist:', err);
      // Make error message more user-friendly
      if (err.message.includes('500')) {
        setError('Spotify server error. Please try again in a moment.');
      } else if (err.message.includes('Device not found')) {
        setError('Playback device not available. Please refresh the page.');
      } else {
        setError(`Failed to play: ${err.message}`);
      }
    }
  }, [deviceId]);

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (!deviceId || !spotifyClient.current) return;
    
    try {
      // Prevent multiple rapid toggles by using a local state flag
      if (isTogglingPlayback.current) return;
      isTogglingPlayback.current = true;
      
      if (isPlaying) {
        await spotifyClient.current.pause(deviceId);
        setIsPlaying(false);
      } else {
        // If we have a selected playlist but no current track, start the playlist
        if (selectedPlaylist && !currentTrack) {
          await playPlaylist(selectedPlaylist);
        } else {
          // Otherwise resume current playback
          await spotifyClient.current.play(deviceId, {}, true);
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      // If there's an error, at least update the UI to reflect the actual state
      try {
        const state = await spotifyClient.current.getPlaybackState();
        if (state) {
          setIsPlaying(!state.paused);
        }
      } catch (stateError) {
        // If even this fails, just toggle the state as the user intended
        setIsPlaying(!isPlaying);
      }
    } finally {
      // Clear the flag after a short delay to prevent rapid toggling
      setTimeout(() => {
        isTogglingPlayback.current = false;
      }, 300);
    }
  }, [deviceId, isPlaying, selectedPlaylist, currentTrack, playPlaylist]);

  // Next track
  const nextTrack = useCallback(async () => {
    if (!deviceId || !spotifyClient.current) return;
    
    try {
      setError(null);
      await spotifyClient.current.next(deviceId);
    } catch (err: any) {
      console.error('Error skipping to next track:', err);
      setError(`Failed to skip: ${err.message}`);
    }
  }, [deviceId]);

  // Previous track
  const previousTrack = useCallback(async () => {
    if (!deviceId || !spotifyClient.current) return;
    
    try {
      setError(null);
      await spotifyClient.current.previous(deviceId);
    } catch (err: any) {
      console.error('Error skipping to previous track:', err);
      setError(`Failed to go back: ${err.message}`);
    }
  }, [deviceId]);

  // Toggle shuffle
  const toggleShuffle = useCallback(async () => {
    if (!deviceId || !spotifyClient.current) return;
    
    try {
      setError(null);
      const newShuffleState = !shuffleState;
      await spotifyClient.current.setShuffle(deviceId, newShuffleState);
      setShuffleState(newShuffleState);
    } catch (err: any) {
      console.error('Error toggling shuffle:', err);
      setError(`Shuffle control error: ${err.message}`);
    }
  }, [deviceId, shuffleState]);

  // Set shuffle state directly
  const setShuffleStateHandler = useCallback(async (state: boolean) => {
    if (!deviceId || !spotifyClient.current) return;
    
    try {
      setError(null);
      await spotifyClient.current.setShuffle(deviceId, state);
      setShuffleState(state);
    } catch (err: any) {
      console.error('Error setting shuffle state:', err);
      // Don't set user-facing error for this as it's not critical
    }
  }, [deviceId]);

  // Completely non-blocking volume control with no delays
  const handleVolumeChange = useCallback((newVolume: number) => {
    // Update local state immediately for UI responsiveness
    setVolumeLevel(newVolume);
    
    // Set local player volume first (most important for preventing interruptions)
    if (playerRef.current) {
      try {
        playerRef.current.setVolume(newVolume / 100);
      } catch (e) {
        // Ignore local player errors
      }
    }
    
    // Only proceed with API call if we have the required info
    if (!deviceId || !spotifyClient.current) return;
    
    // Don't await or use timeouts for volume changes - fire and forget
    spotifyClient.current.setVolume(deviceId, newVolume).catch(error => {
      // Silently handle all volume errors
      console.debug('Volume API error (safely ignored):', error);
    });
  }, [deviceId]);

  // Add a function specifically for manual control by the user
  const manualTogglePlayPause = useCallback(async () => {
    if (!deviceId || !spotifyClient.current) return;
    
    try {
      // Set the manual control flag to prevent Pomodoro sync from overriding user choice
      isManualControl.current = true;
      
      // Prevent multiple rapid toggles by using a local state flag
      if (isTogglingPlayback.current) return;
      isTogglingPlayback.current = true;
      
      if (isPlaying) {
        await spotifyClient.current.pause(deviceId);
        setIsPlaying(false);
      } else {
        // If we have a selected playlist but no current track, start the playlist
        if (selectedPlaylist && !currentTrack) {
          await playPlaylist(selectedPlaylist);
        } else {
          // Otherwise resume current playback
          await spotifyClient.current.play(deviceId, {}, true);
          setIsPlaying(true);
        }
      }
      
      // Keep manual control flag active for a period
      // It will be reset by a timeout in the SpotifyPomodoroSync component
    } catch (error) {
      console.error('Error toggling playback:', error);
      // If there's an error, at least update the UI to reflect the actual state
      try {
        const state = await spotifyClient.current.getPlaybackState();
        if (state) {
          setIsPlaying(!state.paused);
        }
      } catch (stateError) {
        // If even this fails, just toggle the state as the user intended
        setIsPlaying(!isPlaying);
      }
    } finally {
      // Clear the flag after a short delay to prevent rapid toggling
      setTimeout(() => {
        isTogglingPlayback.current = false;
      }, 300);
    }
  }, [deviceId, isPlaying, selectedPlaylist, currentTrack, playPlaylist]);

  // Add a function to reset the manual control flag
  const resetManualControl = useCallback(() => {
    isManualControl.current = false;
  }, []);

  // Create a function to check the current manual control state
  const getManualControlStatus = useCallback(() => {
    return isManualControl.current;
  }, []);

  // Context value
  const contextValue = {
    isAuthenticated,
    isLoading,
    isPlayerReady,
    user,
    deviceId,
    error,
    playlists,
    selectedPlaylist,
    currentTrack,
    isPlaying,
    volume: volumeLevel,
    shuffleState,
    connectToSpotify,
    disconnectFromSpotify,
    selectPlaylist,
    playPlaylist,
    togglePlayPause,
    nextTrack,
    previousTrack,
    setVolume: handleVolumeChange,
    toggleShuffle,
    setShuffleState: setShuffleStateHandler,
    setCurrentTrack,
    manualTogglePlayPause,
    isManualControl: getManualControlStatus(),
    resetManualControl,
    getManualControlStatus,
  };

  return (
    <SpotifyContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        isPlayerReady,
        user,
        deviceId,
        error,
        playlists,
        selectedPlaylist,
        currentTrack,
        isPlaying,
        volume: volumeLevel,
        shuffleState,
        connectToSpotify,
        disconnectFromSpotify,
        selectPlaylist,
        playPlaylist,
        togglePlayPause,
        nextTrack,
        previousTrack,
        setVolume: handleVolumeChange,
        toggleShuffle,
        setShuffleState: setShuffleStateHandler,
        setCurrentTrack,
        manualTogglePlayPause,
        isManualControl: getManualControlStatus(),
        resetManualControl,
        getManualControlStatus,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotify = () => useContext(SpotifyContext); 