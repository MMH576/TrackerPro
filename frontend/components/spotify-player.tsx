'use client';

import React, { useEffect } from 'react';
import { useSpotify } from '@/contexts/spotify-context';
import { Button } from '@/components/ui/button';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume1, Volume2, VolumeX, Music
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Custom Spotify icon since it's not available in lucide-react
function SpotifyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 16.48c4.42-1.92 9.1-1.2 9.1-1.2M8 12.84c3.54-1.54 7.9-.98 7.9-.98M8 9.2c3.17-1.4 6.7-.98 6.7-.98" />
    </svg>
  );
}

export function SpotifyPlayer() {
  const { 
    isAuthenticated, 
    login, 
    logout,
    currentTrack, 
    isPlaying, 
    play, 
    pause, 
    skipToNext, 
    skipToPrevious,
    volume,
    setVolume,
    playlists,
    selectedPlaylistId,
    selectPlaylist,
    user
  } = useSpotify();

  // Handle play button click
  const handlePlay = () => {
    play();
  };

  // If not authenticated, show login button
  if (!isAuthenticated) {
    return (
      <Card className="w-full bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <SpotifyIcon className="h-5 w-5 text-green-500" />
            Spotify Integration
          </CardTitle>
          <CardDescription>
            Connect your Spotify account to play music during your Pomodoro sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button 
            onClick={() => login()} 
            className="bg-green-600 hover:bg-green-700"
          >
            <SpotifyIcon className="mr-2 h-4 w-4" />
            Connect Spotify
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <SpotifyIcon className="h-5 w-5 text-green-500" />
            <CardTitle className="text-base">Spotify</CardTitle>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{user.display_name}</span>
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.images?.[0]?.url} alt={user.display_name} />
                <AvatarFallback>{user.display_name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={() => logout()}
                title="Disconnect Spotify"
              >
                <span className="sr-only">Disconnect</span>
                <VolumeX className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Playlist selector */}
        <div className="w-full">
          <Select
            value={selectedPlaylistId || ""}
            onValueChange={(value) => selectPlaylist(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a playlist" />
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
        
        {/* Current track info */}
        <div className="flex gap-3 items-center">
          <div className="shrink-0 w-12 h-12 bg-muted rounded-md overflow-hidden flex items-center justify-center">
            {currentTrack?.albumArt ? (
              <img 
                src={currentTrack.albumArt} 
                alt={currentTrack.album || 'Album art'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="overflow-hidden">
            {currentTrack ? (
              <>
                <p className="truncate font-medium text-sm">{currentTrack.name}</p>
                <p className="truncate text-xs text-muted-foreground">{currentTrack.artist}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {selectedPlaylistId ? 'Ready to play' : 'Select a playlist to start'}
              </p>
            )}
          </div>
        </div>
        
        {/* Playback controls */}
        <div className="flex justify-center items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => skipToPrevious()}
            disabled={!selectedPlaylistId}
            className="h-8 w-8"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={isPlaying ? () => pause() : () => play()}
            disabled={!selectedPlaylistId}
            className="h-10 w-10 rounded-full"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => skipToNext()}
            disabled={!selectedPlaylistId}
            className="h-8 w-8"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Volume control */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setVolume(0)}
            className="h-6 w-6"
          >
            {volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : volume < 50 ? (
              <Volume1 className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          
          <Slider
            value={[volume]}
            min={0}
            max={100}
            step={1}
            onValueChange={(values) => setVolume(values[0])}
            className="flex-1"
          />
        </div>
      </CardContent>
    </Card>
  );
} 