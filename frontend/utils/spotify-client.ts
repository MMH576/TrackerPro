interface SpotifyToken {
  access_token: string;
  expires_at: string;
}

export interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  duration_ms: number;
  uri: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  images: { url: string; height: number; width: number }[];
  tracks: {
    total: number;
  };
  uri: string;
}

export class SpotifyClient {
  private accessToken: string | null = null;
  private expiresAt: Date | null = null;
  private userId: string | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor(userId: string) {
    console.log('SpotifyClient constructor called with userId:', userId);
    this.userId = userId;
  }

  async initialize() {
    if (!this.userId) {
      throw new Error('User ID is required');
    }

    try {
      console.log('Initializing Spotify client for user:', this.userId);
      const response = await fetch('/api/auth/spotify/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: this.userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to refresh token:', errorData);
        throw new Error(errorData.error || 'Failed to refresh token');
      }

      const data = await response.json();
      console.log('Token refresh response:', {
        hasAccessToken: !!data.access_token,
        expiresAt: data.expires_at
      });
      
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.expiresAt = new Date(data.expires_at);
        console.log('Successfully initialized Spotify client');
      }
    } catch (error) {
      console.error('Error initializing Spotify client:', error);
      throw error;
    }
  }

  private async ensureValidToken() {
    if (!this.userId) {
      throw new Error('User ID is required');
    }

    // If there's already a refresh in progress, wait for it
    if (this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Check if token is expired or will expire in the next 5 minutes
    if (!this.accessToken || !this.expiresAt || this.expiresAt < fiveMinutesFromNow) {
      // Set refreshPromise to prevent multiple simultaneous refreshes
      this.refreshPromise = this.refreshToken();
      await this.refreshPromise;
      this.refreshPromise = null;
    }
  }

  private async refreshToken() {
    try {
      const response = await fetch('/api/auth/spotify/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: this.userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refresh token');
      }

      const data = await response.json();
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.expiresAt = new Date(data.expires_at);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  private async fetchSpotifyAPI(endpoint: string, options: Record<string, any> = {}) {
    await this.ensureValidToken();

    const url = `https://api.spotify.com/v1${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Spotify API error:', { 
        status: response.status, 
        url, 
        error: errorData 
      });
      throw new Error(`Spotify API error: ${response.status}`);
    }

    return response.json();
  }

  async getUserPlaylists(limit = 50): Promise<Playlist[]> {
    const data = await this.fetchSpotifyAPI(`/me/playlists?limit=${limit}`);
    return data.items;
  }

  async getPlaylistTracks(playlistId: string, limit = 100): Promise<Track[]> {
    const data = await this.fetchSpotifyAPI(`/playlists/${playlistId}/tracks?limit=${limit}`);
    return data.items.map((item: any) => item.track);
  }

  async getPlaylistById(playlistId: string): Promise<Playlist> {
    return this.fetchSpotifyAPI(`/playlists/${playlistId}`);
  }

  async getCurrentPlayback() {
    try {
      return await this.fetchSpotifyAPI('/me/player');
    } catch (error: any) {
      // It's normal to get a 204 No Content if nothing is playing
      if (error.message.includes('204')) {
        return null;
      }
      throw error;
    }
  }

  async transferPlayback(deviceId: string) {
    return this.fetchSpotifyAPI('/me/player', {
      method: 'PUT',
      body: JSON.stringify({
        device_ids: [deviceId],
        play: false,
      }),
    });
  }

  async startPlayback(deviceId: string, uris?: string[], context_uri?: string, offset?: number) {
    const body: any = {};
    
    if (uris && uris.length > 0) {
      body.uris = uris;
    }
    
    if (context_uri) {
      body.context_uri = context_uri;
    }
    
    if (offset !== undefined) {
      body.offset = { position: offset };
    }
    
    try {
      await this.fetchSpotifyAPI(`/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error('Error starting playback:', error);
      throw error;
    }
  }

  async pausePlayback(deviceId: string) {
    try {
      await this.fetchSpotifyAPI(`/me/player/pause?device_id=${deviceId}`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Error pausing playback:', error);
      throw error;
    }
  }

  async nextTrack(deviceId: string) {
    try {
      await this.fetchSpotifyAPI(`/me/player/next?device_id=${deviceId}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error skipping to next track:', error);
      throw error;
    }
  }

  async previousTrack(deviceId: string) {
    try {
      await this.fetchSpotifyAPI(`/me/player/previous?device_id=${deviceId}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error skipping to previous track:', error);
      throw error;
    }
  }

  async setVolume(deviceId: string, volumePercent: number) {
    try {
      await this.fetchSpotifyAPI(`/me/player/volume?device_id=${deviceId}&volume_percent=${volumePercent}`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Error setting volume:', error);
      throw error;
    }
  }
} 