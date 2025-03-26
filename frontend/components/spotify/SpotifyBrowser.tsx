'use client';

import { useState, useEffect } from 'react';
import { useSpotify } from '@/hooks/use-spotify';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Music, Album, Library, Mic, Search, X, Play, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define types
interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string, images?: { url: string }[] };
  uri: string;
  duration_ms: number;
}

export function SpotifyBrowser() {
  const {
    isAuthenticated,
    isLoading,
    playlists,
    selectedPlaylist,
    currentTrack,
    isPlaying,
    playPlaylist,
    playTracks,
    selectPlaylist,
  } = useSpotify();

  const [activeTab, setActiveTab] = useState('playlists');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>({
    tracks: [],
    albums: [],
    artists: [],
    playlists: []
  });
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [activeRecommendation, setActiveRecommendation] = useState('focus');

  // Load playlist tracks when a playlist is selected
  useEffect(() => {
    if (selectedPlaylist && selectedPlaylist.id !== selectedPlaylistId) {
      setSelectedPlaylistId(selectedPlaylist.id);
      loadPlaylistTracks(selectedPlaylist.id);
    }
  }, [selectedPlaylist]);

  // Function to load a playlist's tracks
  const loadPlaylistTracks = async (playlistId: string) => {
    setIsLoadingTracks(true);
    try {
      // Call the Spotify API through our hook's internal client
      const spotifyApi = await import('@/utils/spotify-client').then(
        module => new module.SpotifyClient('current-user')
      );
      
      await spotifyApi.initialize();
      const tracks = await spotifyApi.getPlaylistTracks(playlistId);
      setPlaylistTracks(tracks);
    } catch (error) {
      console.error('Failed to load playlist tracks:', error);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  // Function to handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Call the Spotify API through our hook's internal client
      const spotifyApi = await import('@/utils/spotify-client').then(
        module => new module.SpotifyClient('current-user')
      );
      
      await spotifyApi.initialize();
      const results = await spotifyApi.search(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Format duration from milliseconds to MM:SS
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  // Play track function
  const handlePlayTrack = (track: Track) => {
    playTracks([track.uri]);
  };

  const loadRecommendations = async (mode = 'focus') => {
    setIsLoadingRecommendations(true);
    try {
      const response = await fetch(`/api/spotify/recommendations?mode=${mode}`);
      if (!response.ok) throw new Error('Failed to load recommendations');
      
      const data = await response.json();
      setRecommendations(data.tracks);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // Load recommendations when the component mounts or tab changes
  useEffect(() => {
    if (activeTab === 'recommendations' && recommendations.length === 0) {
      loadRecommendations();
    }
  }, [activeTab, recommendations.length]);

  if (!isAuthenticated) {
    return null; // Don't render if not authenticated with Spotify
  }

  return (
    <div className="w-full mt-4">
      <div className="flex items-center mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium">Music Library</h3>
          <p className="text-sm text-muted-foreground">Browse your Spotify library</p>
        </div>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search music..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-8 w-[200px]"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          {searchQuery ? (
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute right-0 top-0 h-full" 
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Search className="absolute right-2 top-[50%] transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-2"
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
        >
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      <Tabs defaultValue="playlists" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="playlists" className="flex items-center gap-1">
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">Playlists</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-1">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </TabsTrigger>
          <TabsTrigger value="albums" className="flex items-center gap-1">
            <Album className="h-4 w-4" />
            <span className="hidden sm:inline">Albums</span>
          </TabsTrigger>
          <TabsTrigger value="artists" className="flex items-center gap-1">
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Artists</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">For You</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="playlists" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                onClick={() => selectPlaylist(playlist)}
                className={cn(
                  "cursor-pointer p-3 rounded-md transition-colors",
                  selectedPlaylist?.id === playlist.id 
                    ? "bg-primary/10 border border-primary" 
                    : "bg-muted hover:bg-primary/5"
                )}
              >
                <div className="aspect-square relative rounded-md overflow-hidden bg-background/50 mb-2">
                  {playlist.images?.[0]?.url ? (
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <Button 
                    size="icon" 
                    className="absolute right-2 bottom-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      playPlaylist(playlist);
                    }}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
                <h4 className="font-medium text-sm truncate">{playlist.name}</h4>
                <p className="text-xs text-muted-foreground truncate">
                  {playlist.tracks?.total || 0} tracks
                </p>
              </div>
            ))}
          </div>

          {selectedPlaylist && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">
                {selectedPlaylist.name}
              </h3>

              {isLoadingTracks ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-1">
                    {playlistTracks.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer"
                        onClick={() => handlePlayTrack(track)}
                      >
                        <div className="h-10 w-10 rounded overflow-hidden mr-3 flex-shrink-0">
                          {track.album.images?.[0]?.url ? (
                            <img
                              src={track.album.images[0].url}
                              alt={track.album.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-muted flex items-center justify-center">
                              <Music className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{track.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {track.artists.map(a => a.name).join(', ')}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground ml-2">
                          {formatDuration(track.duration_ms)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="search">
          {searchQuery && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Tracks</h3>
                {isSearching ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : searchResults.tracks.length > 0 ? (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-1">
                      {searchResults.tracks.map((track: Track) => (
                        <div
                          key={track.id}
                          className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer"
                          onClick={() => handlePlayTrack(track)}
                        >
                          <div className="h-10 w-10 rounded overflow-hidden mr-3 flex-shrink-0">
                            {track.album.images?.[0]?.url ? (
                              <img
                                src={track.album.images[0].url}
                                alt={track.album.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-muted flex items-center justify-center">
                                <Music className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{track.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {track.artists.map((a: {name: string}) => a.name).join(', ')}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground ml-2">
                            {formatDuration(track.duration_ms)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-muted-foreground text-sm">No tracks found matching "{searchQuery}"</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Albums</h3>
                {isSearching ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : searchResults.albums.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {searchResults.albums.map((album: any) => (
                      <div
                        key={album.id}
                        className="cursor-pointer p-3 rounded-md bg-muted hover:bg-primary/5 transition-colors"
                      >
                        <div className="aspect-square relative rounded-md overflow-hidden bg-background/50 mb-2">
                          {album.images?.[0]?.url ? (
                            <img
                              src={album.images[0].url}
                              alt={album.name}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Album className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium text-sm truncate">{album.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {album.artists.map((a: {name: string}) => a.name).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No albums found matching "{searchQuery}"</p>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="albums">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Album className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Albums Coming Soon</h3>
              <p className="text-muted-foreground">
                This feature is under development. Try using the search or playlists tabs.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="artists">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Mic className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Artists Coming Soon</h3>
              <p className="text-muted-foreground">
                This feature is under development. Try using the search or playlists tabs.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Recommended for You</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Music curated to enhance your productivity
            </p>
            
            <div className="flex space-x-2 mb-6">
              <Button 
                variant={activeRecommendation === 'focus' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => {
                  setActiveRecommendation('focus');
                  loadRecommendations('focus');
                }}
              >
                Focus
              </Button>
              <Button 
                variant={activeRecommendation === 'relax' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => {
                  setActiveRecommendation('relax');
                  loadRecommendations('relax');
                }}
              >
                Relax
              </Button>
              <Button 
                variant={activeRecommendation === 'energize' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => {
                  setActiveRecommendation('energize');
                  loadRecommendations('energize');
                }}
              >
                Energize
              </Button>
            </div>
          </div>
          
          {isLoadingRecommendations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : recommendations.length > 0 ? (
            <ScrollArea className="h-[350px]">
              <div className="space-y-1">
                {recommendations.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer"
                    onClick={() => handlePlayTrack(track)}
                  >
                    <div className="h-10 w-10 rounded overflow-hidden mr-3 flex-shrink-0">
                      {track.album.images?.[0]?.url ? (
                        <img
                          src={track.album.images[0].url}
                          alt={track.album.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center">
                          <Music className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{track.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {track.artists.map(a => a.name).join(', ')}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground ml-2">
                      {formatDuration(track.duration_ms)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Recommendations</h3>
                <p className="text-muted-foreground">
                  We couldn't find any recommendations for you right now.
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 