'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * A utility class for interacting with the Spotify API
 */
export class SpotifyClient {
  private accessToken: string | null = null;
  private expiresAt: Date | null = null;
  private userId: string | null = null;

  /**
   * Initialize the Spotify client and load token if available
   */
  async init(userId: string) {
    this.userId = userId;
    return this.loadToken();
  }

  /**
   * Load the Spotify access token from Supabase
   */
  async loadToken() {
    try {
      if (!this.userId) return false;

      const supabase = createClientComponentClient();
      const { data, error } = await supabase
        .from('spotify_tokens')
        .select('access_token, expires_at')
        .eq('user_id', this.userId)
        .single();

      if (error || !data) {
        console.log('No Spotify token found');
        return false;
      }

      this.accessToken = data.access_token;
      this.expiresAt = new Date(data.expires_at);

      // If token is expired or will expire in the next 5 minutes, refresh it
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      
      if (this.expiresAt < fiveMinutesFromNow) {
        return this.refreshToken();
      }

      return true;
    } catch (error) {
      console.error('Error loading Spotify token:', error);
      return false;
    }
  }

  /**
   * Refresh the Spotify access token
   */
  async refreshToken() {
    try {
      if (!this.userId) return false;

      const response = await fetch('/api/auth/spotify/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: this.userId })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      this.accessToken = data.access_token;
      this.expiresAt = new Date(data.expires_at);
      
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.accessToken = null;
      this.expiresAt = null;
      return false;
    }
  }

  /**
   * Check if the user is connected to Spotify
   */
  async isConnected() {
    if (!this.userId) return false;
    
    if (this.accessToken && this.expiresAt && this.expiresAt > new Date()) {
      return true;
    }
    
    return this.loadToken();
  }

  /**
   * Make an authenticated request to the Spotify API
   */
  private async apiRequest(endpoint: string, options?: RequestInit) {
    try {
      if (!this.accessToken) {
        const isAuthenticated = await this.loadToken();
        if (!isAuthenticated) {
          throw new Error('Not authenticated with Spotify');
        }
      }

      const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        ...options,
        headers: {
          ...options?.headers,
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      // Handle 401 (Unauthorized) by refreshing the token and retrying once
      if (response.status === 401) {
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          throw new Error('Failed to refresh token');
        }

        // Retry the request with the new token
        return fetch(`https://api.spotify.com/v1${endpoint}`, {
          ...options,
          headers: {
            ...options?.headers,
            'Authorization': `Bearer ${this.accessToken}`
          }
        });
      }

      return response;
    } catch (error) {
      console.error('Spotify API request error:', error);
      throw error;
    }
  }

  /**
   * Get the user's currently playing track
   */
  async getCurrentlyPlaying() {
    const response = await this.apiRequest('/me/player/currently-playing');
    
    if (response.status === 204) {
      return null; // No content - nothing is playing
    }
    
    return response.json();
  }

  /**
   * Get the user's playback state
   */
  async getPlaybackState() {
    const response = await this.apiRequest('/me/player');
    
    if (response.status === 204) {
      return null; // No content - no active device
    }
    
    return response.json();
  }

  /**
   * Start or resume playback
   */
  async play(options?: { deviceId?: string, contextUri?: string, uris?: string[] }) {
    const deviceQuery = options?.deviceId ? `?device_id=${options.deviceId}` : '';
    const body = options?.contextUri || options?.uris ? 
      JSON.stringify({
        context_uri: options.contextUri,
        uris: options.uris
      }) : 
      undefined;
    
    await this.apiRequest(`/me/player/play${deviceQuery}`, {
      method: 'PUT',
      body
    });
  }

  /**
   * Pause playback
   */
  async pause(deviceId?: string) {
    const deviceQuery = deviceId ? `?device_id=${deviceId}` : '';
    await this.apiRequest(`/me/player/pause${deviceQuery}`, {
      method: 'PUT'
    });
  }

  /**
   * Skip to the next track
   */
  async skipToNext(deviceId?: string) {
    const deviceQuery = deviceId ? `?device_id=${deviceId}` : '';
    await this.apiRequest(`/me/player/next${deviceQuery}`, {
      method: 'POST'
    });
  }

  /**
   * Skip to the previous track
   */
  async skipToPrevious(deviceId?: string) {
    const deviceQuery = deviceId ? `?device_id=${deviceId}` : '';
    await this.apiRequest(`/me/player/previous${deviceQuery}`, {
      method: 'POST'
    });
  }

  /**
   * Set the volume
   */
  async setVolume(volumePercent: number, deviceId?: string) {
    const deviceQuery = deviceId ? `&device_id=${deviceId}` : '';
    await this.apiRequest(`/me/player/volume?volume_percent=${volumePercent}${deviceQuery}`, {
      method: 'PUT'
    });
  }

  /**
   * Get the user's playlists
   */
  async getPlaylists(limit = 50, offset = 0) {
    const response = await this.apiRequest(`/me/playlists?limit=${limit}&offset=${offset}`);
    return response.json();
  }

  /**
   * Get the user's profile
   */
  async getProfile() {
    const response = await this.apiRequest('/me');
    return response.json();
  }
}

// Create a singleton instance
const spotifyClient = new SpotifyClient();
export default spotifyClient; 