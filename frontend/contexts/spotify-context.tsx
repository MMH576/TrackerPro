'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as spotifyApi from '@/lib/spotify';
import { useSupabaseClient } from '@/lib/supabase-context';
import { useToast } from '@/components/ui/use-toast';

interface SpotifyUser {
  id: string;
  display_name: string;
  images?: { url: string }[];
}

interface SpotifyContextType {
  isAuthenticated: boolean;
  user: SpotifyUser | null;
  accessToken: string | null;
  currentTrack: any | null;
  isPlaying: boolean;
  playlists: any[];
  selectedPlaylistId: string | null;
  deviceId: string | null;
  volume: number;
  login: () => void;
  logout: () => void;
  connectToSpotify: () => void;
  play: (uri?: string) => Promise<void>;
  pause: () => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  selectPlaylist: (playlistId: string) => Promise<void>;
  syncWithPomodoroState: (isRunning: boolean, mode: string) => Promise<void>;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export function SpotifyProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [currentTrack, setCurrentTrack] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(50);
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [tokenExpiryTime, setTokenExpiryTime] = useState<number>(0);

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!accessToken) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new Spotify.Player({
        name: 'TrackerPro Pomodoro',
        getOAuthToken: cb => { cb(accessToken); },
        volume: volume / 100
      });

      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Initialization error:', message);
      });
      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Authentication error:', message);
        refreshSpotifyToken();
      });
      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Account error:', message);
      });
      spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('Playback error:', message);
      });

      // Playback status updates
      spotifyPlayer.addListener('player_state_changed', state => {
        if (!state) return;

        const currentTrackInfo = state.track_window.current_track;
        console.log('Track changed:', currentTrackInfo);

        // Create a more detailed track object with all the necessary info
        setCurrentTrack({
          name: currentTrackInfo.name,
          artists: currentTrackInfo.artists.map(artist => ({
            name: artist.name,
            id: artist.uri.split(':').pop()
          })),
          album: {
            name: currentTrackInfo.album.name,
            images: currentTrackInfo.album.images || []
          },
          albumArt: currentTrackInfo.album.images?.[0]?.url,
          uri: currentTrackInfo.uri,
          duration_ms: currentTrackInfo.duration_ms || 0,
          id: currentTrackInfo.id || currentTrackInfo.uri.split(':').pop()
        });

        setIsPlaying(!state.paused);
      });

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        transferPlaybackToCurrentDevice(device_id);
      });

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      // Connect to the player
      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };

    return () => {
      player?.disconnect();
    };
  }, [accessToken]);

  // Load Spotify data from Supabase on mount
  useEffect(() => {
    const loadSpotifyData = async () => {
      try {
        if (!supabase) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from('user_spotify_auth')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error || !data) {
          console.log('No Spotify data found');
          return;
        }

        setRefreshToken(data.refresh_token);

        // Check if token is expired and refresh if needed
        const now = Date.now();
        if (now >= data.expires_at) {
          await refreshSpotifyToken(data.refresh_token);
        } else {
          setAccessToken(data.access_token);
          setTokenExpiryTime(data.expires_at);
          setIsAuthenticated(true);
          await fetchUserData(data.access_token);
          await fetchPlaylists(data.access_token);
        }

        // Load user preferences
        if (data.settings) {
          const settings = JSON.parse(data.settings);
          if (settings.volume) setVolumeState(settings.volume);
          if (settings.selectedPlaylistId) setSelectedPlaylistId(settings.selectedPlaylistId);
        }
      } catch (error) {
        console.error('Error loading Spotify data:', error);
      }
    };

    loadSpotifyData();
  }, [supabase]);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Don't run on server side
      if (typeof window === 'undefined') return;

      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        toast({
          title: 'Spotify Authentication Error',
          description: error,
          variant: 'destructive'
        });
        router.push('/pomodoro');
        return;
      }

      if (code && window.location.pathname === '/callback') {
        try {
          // Exchange code for access token
          const response = await spotifyApi.getAccessToken(code);

          if (response.error) {
            throw new Error(response.error_description || 'Failed to authenticate with Spotify');
          }

          const { access_token, refresh_token, expires_in } = response;
          const expiresAt = Date.now() + expires_in * 1000;

          setAccessToken(access_token);
          setRefreshToken(refresh_token);
          setTokenExpiryTime(expiresAt);
          setIsAuthenticated(true);

          // Fetch user data and playlists
          await fetchUserData(access_token);
          await fetchPlaylists(access_token);

          // Store tokens in Supabase
          await storeTokensInSupabase(access_token, refresh_token, expiresAt);

          toast({
            title: 'Connected to Spotify',
            description: 'Your Spotify account is now linked to TrackerPro',
            variant: 'success'
          });

          router.push('/pomodoro');
        } catch (error) {
          console.error('Error during Spotify authentication:', error);
          toast({
            title: 'Authentication Error',
            description: 'Failed to connect to Spotify. Please try again.',
            variant: 'destructive'
          });
          router.push('/pomodoro');
        }
      }
    };

    handleOAuthCallback();
  }, [router]);

  // Fetch user data from Spotify API
  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      setUser({
        id: userData.id,
        display_name: userData.display_name,
        images: userData.images
      });
    } catch (error) {
      console.error('Error fetching Spotify user data:', error);
    }
  };

  // Fetch user playlists
  const fetchPlaylists = async (token: string) => {
    try {
      const response = await spotifyApi.getUserPlaylists(token);
      setPlaylists(response.items || []);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  // Refresh the Spotify access token
  const refreshSpotifyToken = async (token = refreshToken) => {
    if (!token) return;

    try {
      const response = await spotifyApi.refreshAccessToken(token);

      if (response.error) {
        throw new Error(response.error_description || 'Failed to refresh token');
      }

      const { access_token, expires_in } = response;
      const expiresAt = Date.now() + expires_in * 1000;

      setAccessToken(access_token);
      setTokenExpiryTime(expiresAt);
      setIsAuthenticated(true);

      // Update token in Supabase
      await storeTokensInSupabase(access_token, token, expiresAt);

      return access_token;
    } catch (error) {
      console.error('Error refreshing Spotify token:', error);
      setIsAuthenticated(false);
      setAccessToken(null);
      return null;
    }
  };

  // Store tokens in Supabase
  const storeTokensInSupabase = async (accessToken: string, refreshToken: string, expiresAt: number) => {
    try {
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const settings = JSON.stringify({
        volume,
        selectedPlaylistId
      });

      const { error } = await supabase
        .from('user_spotify_auth')
        .upsert({
          user_id: session.user.id,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          settings
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error storing Spotify tokens:', error);
    }
  };

  // Transfer playback to current device
  const transferPlaybackToCurrentDevice = async (deviceId: string) => {
    if (!accessToken) return;

    try {
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false
        })
      });
    } catch (error) {
      console.error('Error transferring playback:', error);
    }
  };

  // Login with Spotify
  const login = () => {
    router.push('/api/auth/spotify');
  };

  // Add an alias for login to match what PlayerSpotify expects
  const connectToSpotify = () => {
    login();
  };

  // Logout from Spotify
  const logout = async () => {
    try {
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Remove tokens from Supabase
      const { error } = await supabase
        .from('user_spotify_auth')
        .delete()
        .eq('user_id', session.user.id);

      if (error) {
        throw error;
      }

      // Disconnect player
      player?.disconnect();

      // Reset state
      setIsAuthenticated(false);
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setCurrentTrack(null);
      setIsPlaying(false);
      setPlaylists([]);
      setDeviceId(null);

      toast({
        title: 'Logged out',
        description: 'Your Spotify account has been disconnected',
      });
    } catch (error) {
      console.error('Error logging out from Spotify:', error);
    }
  };

  // Play a track or resume playback
  const play = async (uri?: string) => {
    if (!accessToken || !deviceId) return;

    try {
      if (uri) {
        await spotifyApi.playTrack(accessToken, uri, deviceId);
      } else if (selectedPlaylistId) {
        await spotifyApi.startPlaylist(accessToken, selectedPlaylistId, deviceId);
      } else {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
      }
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  // Pause playback
  const pause = async () => {
    if (!accessToken || !deviceId) return;

    try {
      await spotifyApi.pausePlayback(accessToken, deviceId);
      setIsPlaying(false);
    } catch (error) {
      console.error('Error pausing playback:', error);
    }
  };

  // Skip to next track
  const skipToNext = async () => {
    if (!accessToken || !deviceId) return;

    try {
      await spotifyApi.skipToNext(accessToken, deviceId);
    } catch (error) {
      console.error('Error skipping to next track:', error);
    }
  };

  // Skip to previous track
  const skipToPrevious = async () => {
    if (!accessToken || !deviceId) return;

    try {
      await spotifyApi.skipToPrevious(accessToken, deviceId);
    } catch (error) {
      console.error('Error skipping to previous track:', error);
    }
  };

  // Set volume
  const setVolumeRemote = async (volumePercent: number) => {
    if (!accessToken || !deviceId) return;

    try {
      await spotifyApi.setVolume(accessToken, volumePercent, deviceId);
      setVolumeState(volumePercent);

      // Update settings in Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const settings = JSON.stringify({
          volume: volumePercent,
          selectedPlaylistId
        });

        await supabase
          .from('user_spotify_auth')
          .update({ settings })
          .eq('user_id', session.user.id);
      }
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  };

  // Select playlist
  const selectPlaylist = async (playlistId: string) => {
    setSelectedPlaylistId(playlistId);

    // Save preference to Supabase
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const settings = JSON.stringify({
          volume,
          selectedPlaylistId: playlistId
        });

        await supabase
          .from('user_spotify_auth')
          .update({ settings })
          .eq('user_id', session.user.id);
      }

      // Start playing the playlist if player is active
      if (isAuthenticated && deviceId && accessToken) {
        await spotifyApi.startPlaylist(accessToken, playlistId, deviceId);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error saving playlist preference:', error);
    }
  };

  // Sync with Pomodoro state
  const syncWithPomodoroState = async (isRunning: boolean, mode: string) => {
    if (!isAuthenticated || !accessToken) return;

    try {
      if (isRunning) {
        // Start playback when Pomodoro starts
        await play();
      } else {
        // Pause playback when Pomodoro pauses
        await pause();
      }
    } catch (error) {
      console.error('Error syncing with Pomodoro state:', error);
    }
  };

  // Provide context
  return (
    <SpotifyContext.Provider
      value={{
        isAuthenticated,
        user,
        accessToken,
        currentTrack,
        isPlaying,
        playlists,
        selectedPlaylistId,
        deviceId,
        volume,
        login,
        logout,
        connectToSpotify,
        play,
        pause,
        skipToNext,
        skipToPrevious,
        setVolume: setVolumeRemote,
        selectPlaylist,
        syncWithPomodoroState
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify() {
  const context = useContext(SpotifyContext);

  if (context === undefined) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }

  return context;
} 