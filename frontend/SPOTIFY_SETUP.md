# Spotify Integration for Pomodoro Timer

This guide explains how to set up Spotify integration for the Pomodoro timer in TrackerPro.

## Prerequisites

1. A Spotify account (Free or Premium)
2. A Spotify Developer account

## Setting Up a Spotify Developer App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in the required information:
   - App name: `TrackerPro`
   - App description: `Pomodoro timer with Spotify integration`
   - Website: Your website URL or `http://localhost:3000` for development
   - Redirect URI: Add `http://localhost:3000/api/auth/callback/spotify` for local development
5. Accept the terms and conditions and click "Create"

## Configuring Environment Variables

1. In your `.env.local` file, add the following variables with your Spotify app credentials:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback/spotify
```

Replace the placeholder values with the actual credentials from your Spotify Developer Dashboard.

## Setting Up the Database

Run the Supabase migration to create the necessary table:

```bash
npx supabase migration up
```

Or manually execute the SQL in `frontend/supabase/migrations/spotify_tokens.sql`.

## How It Works

The Spotify integration for Pomodoro includes the following components:

1. **API Routes** - Located in `app/api/auth/spotify/`:

   - `route.ts` - Redirects users to Spotify authorization page
   - `callback/route.ts` - Handles the OAuth callback and stores tokens
   - `refresh/route.ts` - Refreshes expired access tokens

2. **Client Utilities**:

   - `lib/spotify-client.ts` - Class for interacting with the Spotify API
   - `hooks/use-spotify.tsx` - React hook for managing Spotify state
   - `components/spotify-player-v2.tsx` - UI component for controlling playback

3. **Integration with Pomodoro**:
   - Automatically plays/pauses music based on the Pomodoro timer state

## Features

- OAuth authentication with Spotify
- Display and control currently playing track
- Playlist selection
- Volume control
- Playback controls (play/pause, skip)
- Automatic synchronization with Pomodoro timer

## Usage

1. Navigate to the Pomodoro timer page
2. Click "Connect Spotify" to authenticate your account
3. Select a playlist from the dropdown
4. Start your Pomodoro session
5. Music will automatically play during focus sessions and pause during breaks

## Notes

- Users need a Spotify Premium account to fully control playback
- Free accounts can still connect but will have limited control capabilities
- Tokens are automatically refreshed when they expire (every hour)
- All user data is securely stored in Supabase with appropriate row-level security
