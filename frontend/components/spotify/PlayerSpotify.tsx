'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSpotify } from '@/hooks/use-spotify';
import { Playlist } from '@/utils/spotify-client';
import { AlertCircle, Music, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Cookies from 'js-cookie';

// Create a function to sync with Pomodoro state
export function syncWithPomodoroState(isRunning: boolean, mode: string) {
  const spotifyInstance = useSpotify();
  
  useEffect(() => {
    const handlePlayback = async () => {
      if (!spotifyInstance.isAuthenticated || !spotifyInstance.selectedPlaylist) return;
      
      try {
        if (isRunning) {
          if (mode === 'pomodoro') {
            // During focus time, ensure music is playing
            if (!spotifyInstance.isPlaying) {
              await spotifyInstance.togglePlayPause();
            }
          } else {
            // During breaks, ensure music is paused
            if (spotifyInstance.isPlaying) {
              await spotifyInstance.togglePlayPause();
            }
          }
        } else {
          // When timer is paused, ensure music is paused
          if (spotifyInstance.isPlaying) {
            await spotifyInstance.togglePlayPause();
          }
        }
      } catch (error) {
        console.error('Error syncing Spotify playback:', error);
      }
    };

    handlePlayback();
  }, [isRunning, mode, spotifyInstance.isAuthenticated, spotifyInstance.isPlaying, spotifyInstance.selectedPlaylist]);
  
  return null;
}

export default function PlayerSpotify() {
  const {
    isAuthenticated,
    isLoading,
    playlists,
    selectedPlaylist,
    currentTrack,
    isPlaying,
    deviceId,
    error,
    volume,
    connectToSpotify,
    disconnectFromSpotify,
    selectPlaylist,
    playPlaylist,
    togglePlayPause,
    nextTrack,
    previousTrack,
    setVolume
  } = useSpotify();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(50);

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
        
        connectToSpotify();
      }, 300);
    } catch (error) {
      setIsConnecting(false);
      setErrorMessage('Failed to connect to Spotify. Please try again.');
    }
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

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center p-4 space-y-4">
        {errorMessage && (
          <Alert variant="destructive" className="mb-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <div className="text-center">
          <Music className="h-16 w-16 mx-auto mb-2 text-primary" />
          <h3 className="text-lg font-medium">Connect to Spotify</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Link your Spotify account to play music during your Pomodoro sessions
          </p>
        </div>
        <Button 
          onClick={handleConnect} 
          className="w-full flex items-center justify-center bg-[#1DB954] hover:bg-[#1ED760]"
          disabled={isConnecting}
        >
          {isConnecting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <svg 
              className="h-4 w-4 mr-2" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.5-1.5-5.7-1.9-9.4-1-1.6.4-2.3-1.2-1.3-2.3 2.5-2.7 6.2-3.5 9.6-2.1.4.1.5.6.4 1-.2.4-.6.6-1 .4-2.8-1.1-5.7-.5-7.8 1.7 3.2-.7 5.9-.3 8 .9.4.2.4.7.2 1zm1.5-3.3c-.3.4-.8.5-1.2.3-2.9-1.8-7.2-2.3-10.6-1.2-2 .5-3-1.4-1.8-2.8 3.1-3.4 7.4-4.4 11.4-2.8.5.2.7.8.5 1.3-.2.4-.7.6-1.1.4-3.3-1.2-6.8-.5-9.4 2.1 2.9-.6 6.6-.2 9.1 1.4.4.3.6.8.3 1.3zm.1-3.5c-3.4-2-9-2.2-12.2-1.2-2.4.7-3.6-1.7-2.1-3.4 3.6-4.2 9.3-5.4 13.6-3.5.6.3.9 1 .6 1.6-.3.6-.9.8-1.5.6-3.7-1.5-8.5-.7-11.6 2.6 2.7-.6 7.2-.2 10.3 1.7.6.4.8 1 .5 1.6-.3.5-.9.7-1.5.4z" />
            </svg>
          )}
          Connect to Spotify
        </Button>
      </div>
    );
  }

  if (isLoading || !deviceId) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Initializing Spotify player...</p>
      </div>
    );
  }

  // Simplified player UI focusing only on playback and playlist selection
  return (
    <div className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {/* Playlist Selection */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">Select a playlist</label>
        <Select
          value={selectedPlaylist?.id || ""}
          onValueChange={(value) => {
            const playlist = playlists.find(p => p.id === value);
            if (playlist) {
              selectPlaylist(playlist);
              playPlaylist(playlist, 0);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose from your library" />
          </SelectTrigger>
          <SelectContent>
            {playlists.map(playlist => (
              <SelectItem key={playlist.id} value={playlist.id}>
                {playlist.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Now Playing */}
      <div className="rounded-md bg-muted p-3 flex items-center space-x-3">
        {currentTrack ? (
          <>
            {currentTrack.album?.images?.[0]?.url && (
              <img 
                src={currentTrack.album.images[0].url} 
                alt={currentTrack.album.name}
                className="h-12 w-12 rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{currentTrack.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.artists?.map(a => a.name).join(', ')}
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 text-center text-sm text-muted-foreground">
            {selectedPlaylist ? "Ready to play" : "Select a playlist to begin"}
          </div>
        )}
      </div>
      
      {/* Playback Controls */}
      <div className="flex items-center justify-center space-x-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={previousTrack}
          disabled={!currentTrack}
        >
          <SkipBack className="h-5 w-5" />
        </Button>
        
        <Button 
          className="h-10 w-10 rounded-full"
          onClick={togglePlayPause}
          disabled={!selectedPlaylist}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={nextTrack}
          disabled={!currentTrack}
        >
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Volume Control */}
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={handleMuteToggle}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        
        <Slider
          value={[isMuted ? 0 : volume]}
          min={0}
          max={100}
          step={1}
          className="flex-1"
          onValueChange={(value) => setVolume(value[0])}
        />
      </div>
      
      {/* Disconnect Button */}
      <div className="pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={disconnectFromSpotify}
          className="text-xs h-8 w-full"
        >
          Disconnect from Spotify
        </Button>
      </div>
    </div>
  );
} 