import Cookies from 'js-cookie';

interface SpotifyToken {
  access_token: string;
  expires_at: string;
}

export interface Track {
  id: string;
  name: string;
  uri: string;
  duration_ms?: number;
  position_ms?: number;
  progressTimestamp?: number;
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
        const retryResponse = await fetch(url, requestOptions);
        
        if (!retryResponse.ok) {
          throw new Error(`Spotify API error: ${retryResponse.status} ${retryResponse.statusText}`);
        }
        
        // Return null for 204 No Content responses
        if (retryResponse.status === 204) {
          return null;
        }
        
        // Try to parse as JSON only if there's content
        const contentType = retryResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await retryResponse.json();
        }
        
        return null;
      }

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
      }
      
      // Return null for 204 No Content responses
      if (response.status === 204) {
        return null;
      }
      
      // Try to parse as JSON only if there's content
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return null;
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
  }, suppressErrors: boolean = false): Promise<void> {
    const url = `${this.baseUrl}/me/player/play?device_id=${deviceId}`;
    
    try {
      // Add a small delay to ensure device is ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await this.fetchWithAuth(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: options ? JSON.stringify(options) : undefined,
      });
    } catch (error: any) {
      console.error('Error playing track:', error);
      
      // If it's a device not found error or player error, try transferring playback first
      if (error.message && (
        error.message.includes('Device not found') || 
        error.message.includes('Player command failed') ||
        error.message.includes('500') // Handle 500 errors gracefully
      )) {
        console.log('Attempting to transfer playback to device and retry...');
        try {
          await this.transferPlayback(deviceId);
          // Retry after transfer with a delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.fetchWithAuth(url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: options ? JSON.stringify(options) : undefined,
          });
          return;
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          // If suppressErrors is true, we don't throw the error further
          if (suppressErrors) return;
        }
      }
      
      // If suppressErrors is true, we don't throw the error
      if (suppressErrors) return;
      
      throw error;
    }
  }

  // Pause playback
  async pause(deviceId: string): Promise<void> {
    const url = `${this.baseUrl}/me/player/pause?device_id=${deviceId}`;
    
    try {
      await this.fetchWithAuth(url, {
        method: 'PUT',
      });
    } catch (error: any) {
      console.error('Error pausing playback:', error);
      
      // If it's a device not found error, try transferring playback first
      if (error.message && (
        error.message.includes('Device not found') || 
        error.message.includes('Player command failed')
      )) {
        try {
          await this.transferPlayback(deviceId);
          // Retry after transfer with a delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.fetchWithAuth(url, {
            method: 'PUT',
          });
          return;
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
      
      throw error;
    }
  }

  // Skip to next track
  async next(deviceId: string): Promise<void> {
    const url = `${this.baseUrl}/me/player/next?device_id=${deviceId}`;
    
    try {
      await this.fetchWithAuth(url, {
        method: 'POST',
      });
    } catch (error: any) {
      console.error('Error skipping to next track:', error);
      
      // If it's a device not found error, try transferring playback first
      if (error.message && (
        error.message.includes('Device not found') || 
        error.message.includes('Player command failed')
      )) {
        try {
          await this.transferPlayback(deviceId);
          // Retry after transfer with a delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.fetchWithAuth(url, {
            method: 'POST',
          });
          return;
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
      
      throw error;
    }
  }

  // Skip to previous track
  async previous(deviceId: string): Promise<void> {
    const url = `${this.baseUrl}/me/player/previous?device_id=${deviceId}`;
    
    try {
      await this.fetchWithAuth(url, {
        method: 'POST',
      });
    } catch (error: any) {
      console.error('Error skipping to previous track:', error);
      
      // If it's a device not found error, try transferring playback first
      if (error.message && (
        error.message.includes('Device not found') || 
        error.message.includes('Player command failed')
      )) {
        try {
          await this.transferPlayback(deviceId);
          // Retry after transfer with a delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.fetchWithAuth(url, {
            method: 'POST',
          });
          return;
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
      
      throw error;
    }
  }

  // Ultra-responsive volume control optimized for zero playback interruption
  async setVolume(deviceId: string, volumePercent: number): Promise<void> {
    try {
      // Validate the volume is within range
      const validVolume = Math.max(0, Math.min(100, Math.round(volumePercent)));
      
      // HIGHEST PRIORITY: Update local player volume first and as fast as possible
      // This provides immediate audible feedback regardless of API state
      if (typeof window !== 'undefined' && window.Spotify) {
        try {
          const spotifyWindow = window as any;
          
          // First approach - SDK player instances
          if (spotifyWindow.Spotify?.Player?._instances?.length > 0) {
            const player = spotifyWindow.Spotify.Player._instances[0];
            if (player && typeof player.setVolume === 'function') {
              player.setVolume(validVolume / 100);
            }
          }
            
          // Second approach - try to access the player directly through any available method
          if (spotifyWindow.Spotify?.Player?.player) {
            const player = spotifyWindow.Spotify.Player.player;
            if (typeof player.setVolume === 'function') {
              player.setVolume(validVolume / 100);
            }
          }
        } catch (localError) {
          // Silently ignore any local player errors
          // Local player update is optional, API update is the fallback
        }
      }
      
      // LOWEST PRIORITY: Update via API
      // This is completely background - we never block, wait, or throw for volume changes
      const url = `${this.baseUrl}/me/player/volume?device_id=${deviceId}&volume_percent=${validVolume}`;
      
      // Fire and completely forget - even wrap the fetch in its own try/catch
      try {
        // Use a non-awaited fetch to prevent any possible blocking
        this.fetchWithAuth(url, { method: 'PUT' })
          .catch(() => {}); // Explicitly silence all promise rejections
      } catch (apiError) {
        // Double error handling to absolutely ensure volume never affects playback
      }
      
      // Return immediately after setting local volume
      // Never wait for API call to complete
      return;
    } catch (error) {
      // Triple error handling - absolutely never throw from volume changes
      console.debug('Volume error safely handled:', error);
      return;
    }
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

  // Get current playback state
  async getPlaybackState(): Promise<any> {
    try {
      return await this.fetchWithAuth(`${this.baseUrl}/me/player`);
    } catch (error) {
      console.error('Error getting playback state:', error);
      return null;
    }
  }

  // Set shuffle state
  async setShuffle(deviceId: string, state: boolean): Promise<void> {
    const url = `${this.baseUrl}/me/player/shuffle?state=${state}&device_id=${deviceId}`;
    
    try {
      await this.fetchWithAuth(url, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('Error setting shuffle state:', error);
      throw error;
    }
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

  // Transfer playback to specified device
  async transferPlayback(deviceId: string, play: boolean = false): Promise<void> {
    const url = `${this.baseUrl}/me/player`;
    
    try {
      // Add a small delay before trying to transfer playback
      // This helps ensure the device is fully registered with Spotify
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // First, check if the device is available
      let deviceExists = false;
      try {
        const devices = await this.fetchWithAuth(`${this.baseUrl}/me/player/devices`);
        deviceExists = devices && devices.devices && devices.devices.some((d: any) => d.id === deviceId);
        
        if (!deviceExists) {
          console.log(`Device ID ${deviceId} not found in available devices, may be newly created`);
          // We'll still try to transfer since devices can take time to appear in the list
        }
      } catch (deviceCheckError) {
        console.warn('Could not check device availability:', deviceCheckError);
        // Continue anyway, the transfer might still work
      }
      
      // Make the transfer request
      // If device doesn't exist, this will likely fail with 404, which is handled in the catch block
      await this.fetchWithAuth(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: play
        })
      });
      
      // Add a reasonable delay to ensure the transfer completes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Successfully transferred playback to device ${deviceId}`);
    } catch (error: any) {
      // Handle 404 errors (device not found) 
      if (error.message && (error.message.includes('404') || error.message.includes('Not Found'))) {
        console.warn('Device not found or not ready. This is normal for newly created devices.');
        return; // Just return without failing
      }
      
      // Handle 500 server errors
      if (error.message && error.message.includes('500')) {
        console.warn('Spotify server error during playback transfer. This is often temporary.');
        return; // Continue without failing
      }
      
      // For other errors, just log them but don't fail the entire operation
      console.error('Error transferring playback:', error.message || error);
      
      // Don't throw the error further as transfer failure is not critical
      // The playback can often still work without a successful transfer
    }
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

  // Seek to a specific position in the currently playing track (position in ms)
  async seek(deviceId: string, position_ms: number) {
    try {
      await this.fetchWithAuth(`${this.baseUrl}/me/player/seek?device_id=${deviceId}&position_ms=${position_ms}`, {
        method: 'PUT'
      });
      
      console.log(`Seeked to position ${position_ms}ms`);
    } catch (error) {
      console.error('Error seeking:', error);
      throw error;
    }
  }

  // Add a dedicated method to get current playback progress
  async getProgress(deviceId: string): Promise<number | null> {
    try {
      const playbackState = await this.getPlaybackState();
      
      if (!playbackState) {
        return null;
      }
      
      return playbackState.progress_ms || 0;
    } catch (error) {
      console.error('Error getting playback progress:', error);
      return null;
    }
  }
} 