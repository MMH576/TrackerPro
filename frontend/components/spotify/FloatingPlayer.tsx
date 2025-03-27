'use client';

import { useState, useEffect } from 'react';
import { Pause, Play, Volume2, VolumeX, X, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useSpotify } from '@/hooks/use-spotify';
import { Track } from '@/utils/spotify-client';

export function FloatingPlayer() {
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(50);
  const [error, setError] = useState<string | null>(null);

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
  } = useSpotify();

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
  
  // Full player
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card p-4 rounded-lg shadow-lg border w-72">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Now Playing</h3>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMinimized(true)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {currentTrack ? (
        <>
          <div className="flex items-center mb-3">
            {getAlbumArtUrl(currentTrack) ? (
              <img 
                src={getAlbumArtUrl(currentTrack)} 
                alt={`${currentTrack.name} album art`} 
                className="h-10 w-10 mr-3 rounded"
              />
            ) : (
              <div className="h-10 w-10 mr-3 rounded bg-muted flex items-center justify-center">
                <Music className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{currentTrack.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.artists?.map(a => a.name).join(', ')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMuteToggle}
              className="p-0 h-8 w-8"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            
            <div className="w-24">
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
              />
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!deviceId}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>
          </div>
        </>
      ) : (
        <div className="py-2 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No track playing</p>
        </div>
      )}
    </div>
  );
} 