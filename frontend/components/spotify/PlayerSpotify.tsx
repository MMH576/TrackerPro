'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSpotify } from '@/hooks/use-spotify';
import { Playlist } from '@/utils/spotify-client';
import { AlertCircle, Music, Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    setVolume,
  } = useSpotify();

  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(50);

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading Spotify...</p>
        <p className="text-xs text-muted-foreground">This may take a few moments</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <Music className="h-8 w-8 text-muted-foreground" />
        <div className="text-center">
          <h3 className="font-semibold mb-2">Connect Spotify</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Play music during your Pomodoro sessions
          </p>
          <Button 
            onClick={connectToSpotify} 
            className="w-full flex items-center justify-center gap-2"
          >
            <Music className="h-4 w-4" />
            Connect to Spotify
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-destructive mb-2">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">Spotify Error</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        <div className="flex justify-between gap-2">
          <Button variant="outline" size="sm" onClick={connectToSpotify} className="flex-1">
            Reconnect
          </Button>
          <Button variant="ghost" size="sm" onClick={disconnectFromSpotify} className="flex-1">
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  if (!deviceId) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Initializing player...</p>
        <p className="text-xs text-muted-foreground">Please wait while we connect to Spotify</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Playlist selector */}
      <Select
        value={selectedPlaylist?.id || ''}
        onValueChange={(value) => {
          const playlist = playlists.find((p) => p.id === value);
          if (playlist) {
            selectPlaylist(playlist);
            playPlaylist(playlist);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a playlist" />
        </SelectTrigger>
        <SelectContent>
          {playlists.map((playlist: Playlist) => (
            <SelectItem key={playlist.id} value={playlist.id}>
              {playlist.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Current track */}
      <div className="space-y-4">
        {currentTrack ? (
          <div className="space-y-4">
            <div className="aspect-square relative rounded-md overflow-hidden">
              {currentTrack.album.images?.[0]?.url ? (
                <Image
                  src={currentTrack.album.images[0].url}
                  alt={currentTrack.album.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Music className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="font-medium line-clamp-1">{currentTrack.name}</p>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {currentTrack.artists.map(a => a.name).join(', ')}
              </p>
            </div>
          </div>
        ) : selectedPlaylist ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Ready to play</p>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Select a playlist to begin</p>
          </div>
        )}

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={previousTrack}
            disabled={!selectedPlaylist}
          >
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={togglePlayPause}
            disabled={!selectedPlaylist}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextTrack}
            disabled={!selectedPlaylist}
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Volume control */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMuteToggle}
            className="shrink-0"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : volume < 50 ? (
              <Volume1 className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
          <Slider
            value={[volume]}
            min={0}
            max={100}
            step={1}
            onValueChange={([value]) => setVolume(value)}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
} 