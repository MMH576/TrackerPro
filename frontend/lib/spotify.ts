// Simple implementation of Spotify API functions used in the app

// Get the authentication URL for Spotify
export const getAuthUrl = () => {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || '/api/auth/callback/spotify');
  const scopes = encodeURIComponent('streaming user-read-email user-read-private user-library-read user-library-modify user-read-playback-state user-modify-playback-state playlist-read-private playlist-read-collaborative');

  return `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}&show_dialog=true`;
};

// Exchange the code for access token
export const getAccessToken = async (code: string) => {
  try {
    const response = await fetch('/api/auth/callback/spotify?code=' + code);
    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting access token:', error);
    return { error: 'auth_error', error_description: 'Failed to get access token' };
  }
};

// Refresh the access token
export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const response = await fetch('/api/auth/spotify/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    return await response.json();
  } catch (error) {
    console.error('Error refreshing token:', error);
    return { error: 'refresh_error', error_description: 'Failed to refresh token' };
  }
};

// Get user playlists
export const getUserPlaylists = async (token: string) => {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch playlists');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return { items: [] };
  }
};

// Play a track
export const playTrack = async (token: string, uri: string, deviceId: string) => {
  try {
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: [uri],
      }),
    });
  } catch (error) {
    console.error('Error playing track:', error);
    throw error;
  }
};

// Start playing a playlist
export const startPlaylist = async (token: string, playlistId: string, deviceId: string) => {
  try {
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context_uri: `spotify:playlist:${playlistId}`,
      }),
    });
  } catch (error) {
    console.error('Error starting playlist:', error);
    throw error;
  }
};

// Pause playback
export const pausePlayback = async (token: string, deviceId: string) => {
  try {
    await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error pausing playback:', error);
    throw error;
  }
};

// Skip to next track
export const skipToNext = async (token: string, deviceId: string) => {
  try {
    await fetch(`https://api.spotify.com/v1/me/player/next?device_id=${deviceId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error skipping to next track:', error);
    throw error;
  }
};

// Skip to previous track
export const skipToPrevious = async (token: string, deviceId: string) => {
  try {
    await fetch(`https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error skipping to previous track:', error);
    throw error;
  }
};

// Set volume
export const setVolume = async (token: string, volumePercent: number, deviceId: string) => {
  try {
    await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volumePercent}&device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error setting volume:', error);
    throw error;
  }
}; 