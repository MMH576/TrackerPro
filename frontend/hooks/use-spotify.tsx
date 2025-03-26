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
  connectToSpotify: () => void;
  disconnectFromSpotify: () => void;
  selectPlaylist: (playlist: Playlist) => void;
  playPlaylist: (playlist: Playlist, offset?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  setVolume: (volume: number) => void;
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
  connectToSpotify: () => {},
  disconnectFromSpotify: () => {},
  selectPlaylist: () => {},
  playPlaylist: async () => {},
  togglePlayPause: async () => {},
  nextTrack: async () => {},
  previousTrack: async () => {},
  setVolume: () => {},
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
  const [volume, setVolume] = useState(50);
  
  const spotifyClient = useRef<SpotifyClient | null>(null);
  const playerRef = useRef<Spotify.Player | null>(null);
  const playerInitAttempts = useRef(0);
  const maxInitAttempts = 3;

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
  }, [isAuthenticated, user]);

  // Initialize the Spotify player when SDK is ready
  useEffect(() => {
    if (!isAuthenticated || !isPlayerReady || playerRef.current) return;
    
    const initializePlayer = async () => {
      if (playerInitAttempts.current >= maxInitAttempts) {
        console.error('Max Spotify player initialization attempts reached');
        setError('Failed to initialize Spotify player after multiple attempts');
        setIsLoading(false);
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
          return;
        }
        
        const player = new window.Spotify.Player({
          name: 'TrackerPro Web Player',
          getOAuthToken: (callback) => {
            callback(accessToken);
          },
          volume: volume / 100
        });
        
        // Error handling
        player.addListener('initialization_error', ({ message }) => {
          console.error('Spotify player initialization error:', message);
          setError(`Player initialization error: ${message}`);
          setIsLoading(false);
        });
        
        player.addListener('authentication_error', ({ message }) => {
          console.error('Spotify player authentication error:', message);
          setError(`Player authentication error: ${message}`);
          setIsLoading(false);
        });
        
        player.addListener('account_error', ({ message }) => {
          console.error('Spotify player account error:', message);
          setError(`Player account error: ${message}`);
          setIsLoading(false);
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
        });
        
        // Not ready handling
        player.addListener('not_ready', ({ device_id }) => {
          console.log('Spotify player device has gone offline:', device_id);
          if (deviceId === device_id) {
            setDeviceId(null);
          }
        });
        
        // State changes
        player.addListener('player_state_changed', (state) => {
          if (!state) {
            console.log('No playback state available');
            return;
          }
          
          console.log('Spotify player state changed:', state);
          
          // Update current track
          if (state.track_window?.current_track) {
            const { current_track } = state.track_window;
            
            setCurrentTrack({
              id: current_track.id,
              name: current_track.name,
              uri: current_track.uri,
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
          
          setIsPlaying(!state.paused);
        });
        
        // Connect and store the player
        const connected = await player.connect();
        
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
          }
        }
      } catch (err: any) {
        console.error('Error initializing Spotify player:', err);
        setError(`Player error: ${err.message}`);
        setIsLoading(false);
        
        // Increment initialization attempts
        playerInitAttempts.current += 1;
      }
    };
    
    initializePlayer();
    
    // Cleanup function
    return () => {
      if (playerRef.current) {
        console.log('Disconnecting Spotify player...');
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
  }, [isAuthenticated, isPlayerReady, volume]);

  // Connect to Spotify (redirects to authorization)
  const connectToSpotify = useCallback(() => {
    // Get the current path for returning to after authentication
    const currentPath = typeof window !== 'undefined' 
      ? window.location.pathname 
      : '/pomodoro';
      
    window.location.href = `/api/auth/spotify?returnTo=${encodeURIComponent(currentPath)}`;
  }, []);

  // Disconnect from Spotify
  const disconnectFromSpotify = useCallback(() => {
    // Disconnect player
    if (playerRef.current) {
      playerRef.current.disconnect();
      playerRef.current = null;
    }
    
    // Clear cookies
    Cookies.remove('spotify_access_token');
    Cookies.remove('spotify_refresh_token');
    Cookies.remove('spotify_token_expiry');
    
    // Reset state
    setIsAuthenticated(false);
    setUser(null);
    setDeviceId(null);
    setPlaylists([]);
    setSelectedPlaylist(null);
    setCurrentTrack(null);
    setIsPlaying(false);
    setIsPlayerReady(false);
    
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
      await spotifyClient.current.play(deviceId, {
        context_uri: `spotify:playlist:${playlist.id}`,
        offset: { position: offset }
      });
    } catch (err: any) {
      console.error('Error playing playlist:', err);
      setError(`Failed to play: ${err.message}`);
    }
  }, [deviceId]);

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (!deviceId || !spotifyClient.current) return;
    
    try {
      setError(null);
      if (isPlaying) {
        await spotifyClient.current.pause(deviceId);
      } else {
        await spotifyClient.current.play(deviceId);
      }
    } catch (err: any) {
      console.error('Error toggling playback:', err);
      setError(`Playback control error: ${err.message}`);
    }
  }, [deviceId, isPlaying]);

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

  // Set volume
  const setVolumeHandler = useCallback((newVolume: number) => {
    setVolume(newVolume);
    
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume / 100);
    }
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
    volume,
    connectToSpotify,
    disconnectFromSpotify,
    selectPlaylist,
    playPlaylist,
    togglePlayPause,
    nextTrack,
    previousTrack,
    setVolume: setVolumeHandler,
  };

  return (
    <SpotifyContext.Provider value={contextValue}>
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotify = () => useContext(SpotifyContext); 