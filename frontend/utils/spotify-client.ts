import Cookies from 'js-cookie';

interface SpotifyToken {
  access_token: string;
  expires_at: string;
}

export interface Track {
  id: string;
  name: string;
  uri: string;
  album?: {
    id: string;
    name: string;
    images?: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  artists?: Array<{
    id: string;
    name: string;
  }>;
}

export interface Playlist {
  id: string;
  name: string;
  uri: string;
  description?: string;
  images?: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  tracks?: {
    total: number;
    items?: Array<{
      track: Track;
    }>;
  };
}

export class SpotifyClient {
  private baseUrl = 'https://api.spotify.com/v1';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Get tokens from cookies
    this.accessToken = Cookies.get('spotify_access_token') || null;
    this.refreshToken = Cookies.get('spotify_refresh_token') || null;
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('/api/auth/spotify/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      
      // Update cookies
      Cookies.set('spotify_access_token', data.access_token, { 
        expires: new Date(new Date().getTime() + data.expires_in * 1000),
        sameSite: 'lax'
      });
      
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
        Cookies.set('spotify_refresh_token', data.refresh_token, { 
          expires: 30,
          sameSite: 'lax'
        });
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Spotify');
    }

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`,
      },
    };

    try {
      const response = await fetch(url, requestOptions);

      // Handle token expiration
      if (response.status === 401) {
        await this.refreshAccessToken();
        // Retry with new token
        requestOptions.headers = {
          ...requestOptions.headers,
          'Authorization': `Bearer ${this.accessToken}`,
        };
        return fetch(url, requestOptions).then(res => {
          if (!res.ok) throw new Error(`Spotify API error: ${res.status} ${res.statusText}`);
          return res.json();
        });
      }

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching from Spotify API:', error);
      throw error;
    }
  }

  // Get current user's profile
  async getProfile(): Promise<any> {
    return this.fetchWithAuth(`${this.baseUrl}/me`);
  }

  // Get user's playlists
  async getUserPlaylists(limit = 50): Promise<Playlist[]> {
    const data = await this.fetchWithAuth(`${this.baseUrl}/me/playlists?limit=${limit}`);
    return data.items;
  }

  // Get a playlist's tracks
  async getPlaylistTracks(playlistId: string, limit = 100, offset = 0): Promise<Track[]> {
    const data = await this.fetchWithAuth(
      `${this.baseUrl}/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`
    );
    
    return data.items.map((item: any) => item.track);
  }

  // Start or resume playback
  async play(deviceId: string, options?: {
    context_uri?: string;
    uris?: string[];
    offset?: { position: number };
    position_ms?: number;
  }): Promise<void> {
    const url = `${this.baseUrl}/me/player/play?device_id=${deviceId}`;
    
    await this.fetchWithAuth(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: options ? JSON.stringify(options) : undefined,
    });
  }

  // Pause playback
  async pause(deviceId: string): Promise<void> {
    const url = `${this.baseUrl}/me/player/pause?device_id=${deviceId}`;
    
    await this.fetchWithAuth(url, {
      method: 'PUT',
    });
  }

  // Skip to next track
  async next(deviceId: string): Promise<void> {
    const url = `${this.baseUrl}/me/player/next?device_id=${deviceId}`;
    
    await this.fetchWithAuth(url, {
      method: 'POST',
    });
  }

  // Skip to previous track
  async previous(deviceId: string): Promise<void> {
    const url = `${this.baseUrl}/me/player/previous?device_id=${deviceId}`;
    
    await this.fetchWithAuth(url, {
      method: 'POST',
    });
  }

  // Set volume
  async setVolume(deviceId: string, volumePercent: number): Promise<void> {
    const url = `${this.baseUrl}/me/player/volume?device_id=${deviceId}&volume_percent=${Math.round(volumePercent)}`;
    
    await this.fetchWithAuth(url, {
      method: 'PUT',
    });
  }

  // Get currently playing track
  async getCurrentlyPlaying(): Promise<Track | null> {
    try {
      const data = await this.fetchWithAuth(`${this.baseUrl}/me/player/currently-playing`);
      return data.item || null;
    } catch (error) {
      console.error('Error getting currently playing track:', error);
      return null;
    }
  }

  // Get user's saved tracks (library)
  async getSavedTracks(limit = 50, offset = 0): Promise<Track[]> {
    const data = await this.fetchWithAuth(
      `${this.baseUrl}/me/tracks?limit=${limit}&offset=${offset}`
    );
    
    return data.items.map((item: any) => item.track);
  }

  async search(query: string, types = ['track', 'album', 'artist', 'playlist'], limit = 10) {
    const typesString = types.join(',');
    const data = await this.fetchWithAuth(`/search?q=${encodeURIComponent(query)}&type=${typesString}&limit=${limit}`);
    return {
      tracks: data.tracks?.items || [],
      albums: data.albums?.items || [],
      artists: data.artists?.items || [],
      playlists: data.playlists?.items || []
    };
  }

  async transferPlayback(deviceId: string) {
    return this.fetchWithAuth('/me/player', {
      method: 'PUT',
      body: JSON.stringify({
        device_ids: [deviceId],
        play: false
      })
    });
  }

  async startPlayback(deviceId: string, uris?: string[], contextUri?: string, offset = 0) {
    const body: any = {};
    
    if (contextUri) {
      body.context_uri = contextUri;
      if (offset !== undefined) {
        body.offset = { position: offset };
      }
    } else if (uris && uris.length > 0) {
      body.uris = uris;
    }

    return this.fetchWithAuth(`/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async pausePlayback(deviceId: string) {
    return this.fetchWithAuth(`/me/player/pause?device_id=${deviceId}`, {
      method: 'PUT'
    });
  }

  async nextTrack(deviceId: string) {
    return this.fetchWithAuth(`/me/player/next?device_id=${deviceId}`, {
      method: 'POST'
    });
  }

  async previousTrack(deviceId: string) {
    return this.fetchWithAuth(`/me/player/previous?device_id=${deviceId}`, {
      method: 'POST'
    });
  }

  async getRecommendations(seedTracks: string[] = [], seedArtists: string[] = [], seedGenres: string[] = [], limit = 20) {
    const params = new URLSearchParams();
    
    if (seedTracks.length) params.append('seed_tracks', seedTracks.join(','));
    if (seedArtists.length) params.append('seed_artists', seedArtists.join(','));
    if (seedGenres.length) params.append('seed_genres', seedGenres.join(','));
    params.append('limit', limit.toString());
    
    const data = await this.fetchWithAuth(`/recommendations?${params.toString()}`);
    return data.tracks;
  }
} 