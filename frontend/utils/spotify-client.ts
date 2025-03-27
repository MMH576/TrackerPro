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

  // Add enhanced play method with navigation resilience
  async play(deviceId: string, options: any = {}, suppressErrors = false): Promise<void> {
    try {
      let retryCount = 0;
      const maxRetries = 3;
      
      const tryPlay = async (): Promise<void> => {
        try {
          // Check if this is a navigation resume attempt
          const isNavigationResume = localStorage.getItem('spotify_playing_during_navigation') === 'true';
          
          // Form URL with device ID
          const url = `${this.baseUrl}/me/player/play?device_id=${deviceId}`;
          
          // If body is empty, default to resuming current context
          const body = Object.keys(options).length ? JSON.stringify(options) : undefined;
          
          // For play requests, use a direct fetch call to get the Response object
          // rather than the JSON-parsed result that fetchWithAuth would return
          const accessToken = this.accessToken;
          if (!accessToken) {
            throw new Error('Not authenticated with Spotify');
          }

          // Make a direct fetch call so we can access the Response object
          const response = await fetch(url, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body
          });
          
          // Handle token expiration
          if (response.status === 401) {
            // Refresh the token
            await this.refreshAccessToken();
            
            // Retry with the new token
            const retryResponse = await fetch(url, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
              },
              body
            });
            
            // Handle errors on the retry
            if (retryResponse.status >= 400) {
              const errorData = await retryResponse.json().catch(() => ({}));
              
              // Handle "Player command failed" errors
              if (retryResponse.status === 404 || 
                  (errorData.error?.message && 
                   errorData.error.message.includes('Player command failed'))) {
                
                if (retryCount > 0 || !isNavigationResume) {
                  throw new Error(`Player command failed: ${errorData.error?.message || 'Unknown error'}`);
                }
                
                // Try transferring playback first
                console.log('Player command failed, trying to transfer playback first');
                await this.transferPlayback(deviceId, true);
                
                // Small delay to let transfer complete
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Try again
                retryCount++;
                return tryPlay();
              }
              
              throw new Error(errorData.error?.message || `HTTP error ${retryResponse.status}`);
            }
            
            // On success with retry, clear navigation flags
            localStorage.removeItem('spotify_playing_during_navigation');
            return;
          }
          
          // Handle errors on the original request
          if (response.status >= 400) {
            const errorData = await response.json().catch(() => ({}));
            
            // Handle "Player command failed" errors
            if (response.status === 404 || 
                (errorData.error?.message && 
                 errorData.error.message.includes('Player command failed'))) {
              
              if (retryCount > 0 || !isNavigationResume) {
                throw new Error(`Player command failed: ${errorData.error?.message || 'Unknown error'}`);
              }
              
              // Try transferring playback first
              console.log('Player command failed, trying to transfer playback first');
              await this.transferPlayback(deviceId, true);
              
              // Small delay to let transfer complete
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Try again
              retryCount++;
              return tryPlay();
            }
            
            throw new Error(errorData.error?.message || `HTTP error ${response.status}`);
          }
          
          // On success, clear navigation flags
          localStorage.removeItem('spotify_playing_during_navigation');
          return;
        } catch (error) {
          if (retryCount < maxRetries) {
            // Increase retry delay exponentially
            const delay = 500 * Math.pow(2, retryCount);
            console.log(`Play attempt ${retryCount + 1} failed, retrying in ${delay}ms...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            retryCount++;
            return tryPlay();
          }
          throw error;
        }
      };
      
      await tryPlay();
    } catch (error) {
      console.error('Error playing track:', error);
      if (!suppressErrors) {
        throw error;
      }
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
          .catch(() => { }); // Explicitly silence all promise rejections
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

      // Use a direct fetch call instead of fetchWithAuth to handle the response directly
      // This allows us to handle 404 errors immediately without throwing
      try {
        const accessToken = this.accessToken;
        if (!accessToken) {
          throw new Error('Not authenticated with Spotify');
        }

        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            device_ids: [deviceId],
            play: play
          })
        });

        // Handle token expiration
        if (response.status === 401) {
          await this.refreshAccessToken();
          
          // Retry with new token
          const retryResponse = await fetch(url, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              device_ids: [deviceId],
              play: play
            })
          });
          
          // Handle 404s and other errors on retry without throwing
          if (retryResponse.status === 404) {
            console.warn('Device not found or not ready after token refresh. This is normal for newly created devices.');
            return;
          }
          
          if (!retryResponse.ok) {
            console.warn(`Transfer playback failed after token refresh with status ${retryResponse.status}`);
            return;
          }
        }
        
        // Handle 404s without throwing
        if (response.status === 404) {
          console.warn('Device not found or not ready. This is normal for newly created devices.');
          return;
        }
        
        // For other errors, log but don't throw
        if (!response.ok) {
          console.warn(`Transfer playback failed with status ${response.status}`);
          return;
        }

        // Add a reasonable delay to ensure the transfer completes
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log(`Successfully transferred playback to device ${deviceId}`);
      } catch (fetchError) {
        // Handle any other fetch errors without throwing
        console.warn('Error during transfer fetch:', fetchError);
        return;
      }
    } catch (error: any) {
      // This is now our final fallback error handler
      // Log the error but don't throw it further to avoid breaking the application
      console.error('Unhandled error in transferPlayback:', error.message || error);
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

  // Add a method to check if the client is connected to Spotify
  async isConnected(): Promise<boolean> {
    try {
      // Try to get the user profile as a way to check authentication
      await this.getProfile();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Add a method to initiate device and ensure it's ready for playback
  async ensureDevice(deviceId: string): Promise<boolean> {
    if (!deviceId || !this.accessToken) return false;
    
    try {
      // Check if device exists
      const devices = await this.fetchWithAuth(`${this.baseUrl}/me/player/devices`);
      
      // If device exists, transfer playback to it
      if (devices && devices.devices) {
        const deviceExists = devices.devices.some((d: any) => d.id === deviceId);
        
        if (deviceExists) {
          // Transfer playback to ensure device is active
          await this.transferPlayback(deviceId, false);
          return true;
        } else {
          console.log('Device not found, may be newly created');
          // Try transfer anyway as device might not be listed yet
          await this.transferPlayback(deviceId, false);
          
          // Verify again after transfer
          const updatedDevices = await this.fetchWithAuth(`${this.baseUrl}/me/player/devices`);
          return updatedDevices?.devices?.some((d: any) => d.id === deviceId) || false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error ensuring device:', error);
      return false;
    }
  }

  // Add a method to verify and ensure a device is active
  async verifyDevice(deviceId: string): Promise<boolean> {
    if (!deviceId || !this.accessToken) return false;
    
    try {
      const devices = await this.fetchWithAuth(`${this.baseUrl}/me/player/devices`);
      
      // Check if our device is in the list of available devices
      if (devices && devices.devices) {
        const ourDevice = devices.devices.find((d: any) => d.id === deviceId);
        
        if (ourDevice) {
          console.log(`Device ${deviceId} found and available`);
          return true;
        }
      }
      
      console.log(`Device ${deviceId} not found in available devices list`);
      return false;
    } catch (error) {
      console.warn('Error verifying device:', error);
      return false;
    }
  }

  // Add a method to retry connecting to Spotify
  async reconnectDevice(deviceId: string): Promise<boolean> {
    if (!deviceId) return false;
    
    try {
      console.log('Attempting to reconnect Spotify device');
      
      // Check if we have playback state first
      const playbackState = await this.getPlaybackState();
      const wasPlaying = playbackState?.is_playing || false;
      
      // Try direct transfer first (may fail silently, which is fine)
      await this.transferPlayback(deviceId, wasPlaying);
      
      // Wait a bit for the transfer to take effect
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Verify device is active
      const isActive = await this.verifyDevice(deviceId);
      if (isActive) {
        return true;
      }
      
      // If not active, try a secondary approach - put the device into a ready state
      // by playing something briefly and then pausing
      try {
        // Try playing with minimal/empty options to wake up the device
        await this.play(deviceId, {}, true);
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try pausing to return to previous state
        if (!wasPlaying) {
          await this.pause(deviceId);
        }
        
        return true;
      } catch (playError) {
        console.warn('Error during device reconnection attempt:', playError);
        return false;
      }
    } catch (error) {
      console.error('Failed to reconnect device:', error);
      return false;
    }
  }
} 