// Type definitions for Spotify Web Playback SDK
// Based on documentation at: https://developer.spotify.com/documentation/web-playback-sdk/reference/

interface Window {
  onSpotifyWebPlaybackSDKReady: () => void;
  Spotify: {
    Player: SpotifyPlayer;
  };
}

interface SpotifyPlayer {
  new (options: SpotifyPlayerOptions): Spotify.Player;
}

declare namespace Spotify {
  interface Player {
    addListener<T extends keyof PlayerEvents>(
      event: T,
      callback: PlayerEvents[T]
    ): void;
    
    removeListener<T extends keyof PlayerEvents>(
      event: T,
      callback?: PlayerEvents[T]
    ): void;
    
    connect(): Promise<boolean>;
    disconnect(): void;
    
    getCurrentState(): Promise<PlayerState | null>;
    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    seek(position_ms: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
  }

  interface PlayerOptions {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => void;
    volume?: number;
    enableMediaSession?: boolean;
  }

  interface PlayerEvents {
    ready: (data: { device_id: string }) => void;
    not_ready: (data: { device_id: string }) => void;
    player_state_changed: (state: PlayerState) => void;
    autoplay_failed: () => void;
    
    initialization_error: (error: { message: string }) => void;
    authentication_error: (error: { message: string }) => void;
    account_error: (error: { message: string }) => void;
    playback_error: (error: { message: string }) => void;
  }

  interface PlayerState {
    context: {
      uri: string | null;
      metadata: Record<string, unknown> | null;
    };
    disallows: {
      pausing: boolean;
      peeking_next: boolean;
      peeking_prev: boolean;
      resuming: boolean;
      seeking: boolean;
      skipping_next: boolean;
      skipping_prev: boolean;
    };
    duration: number;
    paused: boolean;
    position: number;
    repeat_mode: 0 | 1 | 2; // off, track, context
    shuffle: boolean;
    track_window: {
      current_track: Track;
      previous_tracks: Track[];
      next_tracks: Track[];
    };
  }

  interface Track {
    id: string | null;
    uri: string;
    type: 'track' | 'episode' | 'ad';
    media_type: 'audio' | 'video';
    name: string;
    is_playable: boolean;
    linked_from?: {
      uri: string | null;
      id: string | null;
    };
    duration_ms: number;
    artists: Artist[];
    album: Album;
  }

  interface Artist {
    name: string;
    uri: string;
  }

  interface Album {
    uri: string;
    name: string;
    images: Image[];
  }

  interface Image {
    url: string;
    height?: number;
    width?: number;
  }
} 