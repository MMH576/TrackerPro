# Spotify Integration for TrackerPro

This document explains how to set up and use the Spotify integration with the Pomodoro timer in TrackerPro.

## Setup Instructions

### 1. Create a Spotify Developer App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in the required information:
   - App name: `TrackerPro` (or any name you prefer)
   - App description: `Pomodoro timer with Spotify integration`
   - Website: `http://localhost:3000` for local development
   - Redirect URI: Add `http://localhost:3000/api/auth/callback/spotify`
5. Save your changes
6. Note your **Client ID** and **Client Secret** from the dashboard

### 2. Configure Environment Variables

Add the following variables to your `.env.local` file:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback/spotify
```

Replace the placeholder values with your actual Spotify app credentials.

### 3. Set Up the Database

We need to create a table in Supabase to store Spotify tokens. Run the database migration:

```bash
npx supabase migration up
```

Or execute the SQL in `frontend/supabase/migrations/spotify_tokens.sql` manually through the Supabase dashboard.

### 4. Restart Your Development Server

After making these changes, restart your Next.js development server:

```bash
npm run dev
```

## Using the Spotify Integration

1. Navigate to the Pomodoro timer page
2. Click "Connect Spotify" to authenticate
3. Select a playlist from the dropdown
4. Start a Pomodoro session
   - Music plays during focus periods
   - Music pauses during breaks
5. Use the player controls to:
   - Adjust volume
   - Skip tracks
   - Pause/play manually

## Technical Details

### Architecture Overview

The Spotify integration consists of:

#### API Routes

- `/api/auth/spotify`: Initiates the OAuth flow
- `/api/auth/callback/spotify`: Handles the OAuth callback
- `/api/auth/spotify/refresh`: Refreshes expired tokens

#### Database

We store Spotify tokens in a `spotify_tokens` table with the schema:

```sql
CREATE TABLE IF NOT EXISTS "spotify_tokens" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "access_token" text NOT NULL,
  "refresh_token" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  -- additional fields
);
```

#### Client Utilities

- `utils/spotify-client.ts`: Class for interacting with the Spotify API
- `hooks/use-spotify.tsx`: React hook for managing Spotify state
- `components/spotify/PlayerSpotify.tsx`: UI component for the player

### Authentication Flow

1. User clicks "Connect Spotify"
2. User is redirected to Spotify authorization page
3. After approval, Spotify redirects back to our callback URL
4. We exchange the authorization code for access and refresh tokens
5. Tokens are stored in the database
6. A session cookie is set to indicate authentication
7. Tokens are refreshed automatically when they expire

### Player Features

- **Playlist Selection**: Users can choose any of their Spotify playlists
- **Playback Control**: Play/pause, skip forward/back, volume adjustment
- **Sync with Pomodoro**: Music playback state syncs with the timer
- **Responsive UI**: Player adapts to different screen sizes

## Troubleshooting

### Authentication Issues

- **Error During Login**: Check your redirect URI in the Spotify Developer Dashboard
- **Token Refresh Fails**: Ensure your client ID and secret are correct in `.env.local`
- **Session Not Recognized**: Clear browser cookies and try reconnecting

### Playback Issues

- **Music Won't Play**: Only Spotify Premium accounts can fully control playback
- **Player Shows "Not Ready"**: The browser might be blocking autoplay; click play manually
- **Volume Control Not Working**: Some browsers restrict volume control; try using Spotify's native controls

### API Limitations

- Free Spotify accounts have limited API capabilities
- Web Playback SDK requires a Premium account for full functionality
- API rate limits may affect usage during heavy traffic

## Additional Resources

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api/)
- [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Supabase Documentation](https://supabase.io/docs)

## Security Considerations

- Tokens are stored securely in Supabase with row-level security
- Client-side code never has direct access to refresh tokens
- We use environment variables to protect sensitive credentials
- Token refresh happens server-side to protect client security
