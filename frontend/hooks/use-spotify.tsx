'use client';

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SpotifyClient, Track, Playlist } from '@/utils/spotify-client';
import Cookies from 'js-cookie';

interface SpotifyContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  playlists: Playlist[];
  selectedPlaylist: Playlist | null;
  currentTrack: Track | null;
  isPlaying: boolean;
  deviceId: string | null;
  isPlayerReady: boolean;
  volume: number;
  error: string | null;
  connectToSpotify: () => void;
  disconnectFromSpotify: () => void;
  selectPlaylist: (playlist: Playlist) => void;
  playPlaylist: (playlist: Playlist, offset?: number) => Promise<void>;
  playTracks: (trackUris: string[], offset?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
}

const defaultContext: SpotifyContextType = {
  isAuthenticated: false,
  isLoading: true,
  playlists: [],
  selectedPlaylist: null,
  currentTrack: null,
  isPlaying: false,
  deviceId: null,
  isPlayerReady: false,
  volume: 50,
  error: null,
  connectToSpotify: () => {},
  disconnectFromSpotify: () => {},
  selectPlaylist: () => {},
  playPlaylist: async () => {},
  playTracks: async () => {},
  togglePlayPause: async () => {},
  nextTrack: async () => {},
  previousTrack: async () => {},
  setVolume: async () => {},
};

const SpotifyContext = createContext<SpotifyContextType>(defaultContext);

export const SpotifyProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [volume, setVolumeState] = useState(50);
  const [error, setError] = useState<string | null>(null);

  const spotifyClientRef = useRef<SpotifyClient | null>(null);
  const playerRef = useRef<Spotify.Player | null>(null);

  // Get the current user
  useEffect(() => {
    const getUser = async () => {
      console.log('Getting user session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('User session:', session?.user ? 'Found' : 'Not found');
      setUser(session?.user || null);
      
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('Auth state changed:', event);
          setUser(session?.user || null);
        }
      );
      
      return () => {
        authListener.subscription.unsubscribe();
      };
    };
    
    getUser();
  }, [supabase.auth]);

  // Initialize the Spotify SDK
  useEffect(() => {
    console.log('Initializing Spotify SDK...');
    setIsLoading(true);
    
    // Check if SDK is already loaded
    if (window.Spotify) {
      console.log('Spotify SDK already loaded');
      setIsPlayerReady(true);
      setIsLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    // Add error handling for script loading
    script.onerror = () => {
      console.error('Failed to load Spotify SDK');
      setError('Failed to load Spotify player');
      setIsLoading(false);
    };

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('Spotify SDK is ready');
      setIsPlayerReady(true);
      setIsLoading(false);
    };

    return () => {
      try {
        // Only attempt to remove the script if it exists and is a child of document.body
        const scriptToRemove = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
        if (scriptToRemove && document.body.contains(scriptToRemove)) {
          document.body.removeChild(scriptToRemove);
        }

        // Disconnect the player if it exists
        if (playerRef.current) {
          playerRef.current.disconnect();
        }
      } catch (error) {
        console.error('Error cleaning up Spotify SDK:', error);
      }
    };
  }, []);

  // Check if user is authenticated with Spotify
  useEffect(() => {
    const checkAuthentication = async () => {
      console.log('Checking Spotify authentication...');
      const isSpotifyConnected = Cookies.get('spotify_connected') === 'true';
      console.log('Spotify connected cookie:', isSpotifyConnected);
      
      if (isSpotifyConnected && user) {
        try {
          // Verify the connection by checking if we have valid tokens
          const response = await fetch('/api/auth/spotify/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          });
          
          if (!response.ok) {
            console.error('Failed to verify Spotify connection');
            setIsAuthenticated(false);
            Cookies.remove('spotify_connected');
          } else {
            console.log('Spotify connection verified');
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Error verifying Spotify connection:', error);
          setIsAuthenticated(false);
          Cookies.remove('spotify_connected');
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    if (user) {
      checkAuthentication();
    } else {
      console.log('No user found, keeping loading state');
      setIsLoading(true);
      setIsAuthenticated(false);
    }
  }, [user]);

  // Initialize Spotify client when authenticated
  useEffect(() => {
    if (user && isAuthenticated && !spotifyClientRef.current) {
      const initializeSpotifyClient = async () => {
        try {
          console.log('Initializing Spotify client for user:', user.id);
          const client = new SpotifyClient(user.id);
          await client.initialize();
          console.log('Spotify client initialized successfully');
          spotifyClientRef.current = client;
          loadPlaylists();
        } catch (err: any) {
          console.error('Failed to initialize Spotify client:', err);
          setError(err.message || 'Failed to initialize Spotify');
          setIsAuthenticated(false);
          Cookies.remove('spotify_connected');
        }
      };

      initializeSpotifyClient();
    }
  }, [user, isAuthenticated]);

  // Initialize Spotify Web Playback SDK when authenticated and SDK is ready
  useEffect(() => {
    if (user && isAuthenticated && isPlayerReady && !playerRef.current) {
      const initializePlayer = () => {
        const token = Cookies.get('spotify_player_token');
        
        if (!token) {
          console.error('No player token available');
          setError('No Spotify token available for playback');
          return;
        }

        try {
          const player = new window.Spotify.Player({
            name: 'TrackerPro Web Player',
            getOAuthToken: (callback: (token: string) => void) => { callback(token); },
            volume: volume / 100,
          });

          // Error handling
          player.addListener('initialization_error', ({ message }: { message: string }) => {
            console.error('Spotify player initialization error:', message);
            setError(`Player initialization error: ${message}`);
          });

          player.addListener('authentication_error', ({ message }: { message: string }) => {
            console.error('Spotify player authentication error:', message);
            setError(`Player authentication error: ${message}`);
          });

          player.addListener('account_error', ({ message }: { message: string }) => {
            console.error('Spotify player account error:', message);
            setError(`Premium account required: ${message}`);
          });

          player.addListener('playback_error', ({ message }: { message: string }) => {
            console.error('Spotify player playback error:', message);
            setError(`Playback error: ${message}`);
          });

          // Playback status updates
          player.addListener('player_state_changed', (state: any) => {
            if (!state) return;
            
            const currentTrackInfo = state.track_window.current_track;
            setCurrentTrack({
              id: currentTrackInfo.id,
              name: currentTrackInfo.name,
              artists: currentTrackInfo.artists,
              album: currentTrackInfo.album,
              duration_ms: currentTrackInfo.duration_ms,
              uri: currentTrackInfo.uri,
            });
            
            setIsPlaying(!state.paused);
          });

          // Ready
          player.addListener('ready', ({ device_id }: { device_id: string }) => {
            console.log('Spotify player ready with device ID:', device_id);
            setDeviceId(device_id);
            spotifyClientRef.current?.transferPlayback(device_id);
          });

          // Not Ready
          player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
            console.log('Spotify player not ready:', device_id);
            setDeviceId(null);
          });

          // Connect to the player
          player.connect();
          playerRef.current = player;
        } catch (err: any) {
          console.error('Error setting up Spotify player:', err);
          setError(err.message || 'Failed to initialize Spotify player');
        }
      };

      initializePlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
  }, [user, isAuthenticated, isPlayerReady, volume]);

  // Load playlists
  const loadPlaylists = useCallback(async () => {
    if (!spotifyClientRef.current) return;
    
    try {
      const userPlaylists = await spotifyClientRef.current.getUserPlaylists();
      setPlaylists(userPlaylists);
      
      // If there's a selected playlist in local storage, load it
      const savedPlaylistId = localStorage.getItem('selectedPlaylistId');
      if (savedPlaylistId) {
        const savedPlaylist = userPlaylists.find(p => p.id === savedPlaylistId);
        if (savedPlaylist) {
          setSelectedPlaylist(savedPlaylist);
        }
      }
    } catch (err: any) {
      console.error('Failed to load playlists:', err);
      setError(err.message || 'Failed to load playlists');
    }
  }, []);

  // Connect to Spotify
  const connectToSpotify = useCallback(() => {
    console.log('Connecting to Spotify...');
    window.location.href = '/api/auth/spotify';
  }, []);

  // Disconnect from Spotify
  const disconnectFromSpotify = useCallback(() => {
    Cookies.remove('spotify_connected');
    Cookies.remove('spotify_player_token');
    localStorage.removeItem('selectedPlaylistId');
    setIsAuthenticated(false);
    setSelectedPlaylist(null);
    setCurrentTrack(null);
    setIsPlaying(false);
    setDeviceId(null);
    setPlaylists([]);

    if (playerRef.current) {
      playerRef.current.disconnect();
      playerRef.current = null;
    }
    
    spotifyClientRef.current = null;
  }, []);

  // Select a playlist
  const selectPlaylist = useCallback((playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    localStorage.setItem('selectedPlaylistId', playlist.id);
  }, []);

  // Play a playlist
  const playPlaylist = useCallback(async (playlist: Playlist, offset = 0) => {
    if (!spotifyClientRef.current || !deviceId) {
      setError('Spotify player not initialized');
      return;
    }

    try {
      await spotifyClientRef.current.startPlayback(deviceId, undefined, playlist.uri, offset);
    } catch (err: any) {
      console.error('Failed to play playlist:', err);
      setError(err.message || 'Failed to play playlist');
    }
  }, [deviceId]);

  // Play tracks
  const playTracks = useCallback(async (trackUris: string[], offset = 0) => {
    if (!spotifyClientRef.current || !deviceId) {
      setError('Spotify player not initialized');
      return;
    }

    try {
      await spotifyClientRef.current.startPlayback(deviceId, trackUris, undefined, offset);
    } catch (err: any) {
      console.error('Failed to play tracks:', err);
      setError(err.message || 'Failed to play tracks');
    }
  }, [deviceId]);

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (!spotifyClientRef.current || !deviceId) {
      setError('Spotify player not initialized');
      return;
    }

    try {
      if (isPlaying) {
        await spotifyClientRef.current.pausePlayback(deviceId);
      } else {
        // If nothing is playing, start the selected playlist
        if (!currentTrack && selectedPlaylist) {
          await playPlaylist(selectedPlaylist);
        } else {
          await spotifyClientRef.current.startPlayback(deviceId);
        }
      }
    } catch (err: any) {
      console.error('Failed to toggle playback:', err);
      setError(err.message || 'Failed to toggle playback');
    }
  }, [isPlaying, currentTrack, selectedPlaylist, deviceId, playPlaylist]);

  // Next track
  const nextTrack = useCallback(async () => {
    if (!spotifyClientRef.current || !deviceId) {
      setError('Spotify player not initialized');
      return;
    }

    try {
      await spotifyClientRef.current.nextTrack(deviceId);
    } catch (err: any) {
      console.error('Failed to skip to next track:', err);
      setError(err.message || 'Failed to skip to next track');
    }
  }, [deviceId]);

  // Previous track
  const previousTrack = useCallback(async () => {
    if (!spotifyClientRef.current || !deviceId) {
      setError('Spotify player not initialized');
      return;
    }

    try {
      await spotifyClientRef.current.previousTrack(deviceId);
    } catch (err: any) {
      console.error('Failed to go to previous track:', err);
      setError(err.message || 'Failed to go to previous track');
    }
  }, [deviceId]);

  // Set volume
  const handleSetVolume = useCallback(async (volumePercent: number) => {
    if (!spotifyClientRef.current || !deviceId) {
      setError('Spotify player not initialized');
      return;
    }

    setVolumeState(volumePercent);

    try {
      if (playerRef.current) {
        await playerRef.current.setVolume(volumePercent / 100);
      }
      await spotifyClientRef.current.setVolume(deviceId, volumePercent);
    } catch (err: any) {
      console.error('Failed to set volume:', err);
      setError(err.message || 'Failed to set volume');
    }
  }, [deviceId]);

  const value = {
    isAuthenticated,
    isLoading,
    playlists,
    selectedPlaylist,
    currentTrack,
    isPlaying,
    deviceId,
    isPlayerReady,
    volume,
    error,
    connectToSpotify,
    disconnectFromSpotify,
    selectPlaylist,
    playPlaylist,
    playTracks,
    togglePlayPause,
    nextTrack,
    previousTrack,
    setVolume: handleSetVolume,
  };

  return (
    <SpotifyContext.Provider value={value}>
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotify = () => useContext(SpotifyContext);

export default useSpotify; 