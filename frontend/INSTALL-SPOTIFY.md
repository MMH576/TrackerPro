# Spotify Integration Setup Guide

Follow these steps to set up Spotify integration with your TrackerPro application.

## 1. Create a Spotify Developer Account

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Enter the following details:
   - **App name**: "TrackerPro"
   - **App description**: "Pomodoro timer with Spotify integration"
   - **Website**: `http://localhost:3000`
   - **Redirect URI**: `http://localhost:3000/api/auth/callback/spotify`
5. Click "Save" to create your app
6. After creation, note down the **Client ID** and **Client Secret**

## 2. Update Environment Variables

1. Open your `.env.local` file at the root of your project
2. Add the following variables:

```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback/spotify
```

3. Replace `your_spotify_client_id` and `your_spotify_client_secret` with the values from your Spotify Developer Dashboard

## 3. Set Up the Database Table

Run this command to create the necessary database table:

```bash
npx supabase migration up
```

If you encounter any issues with the migration command, you can manually create the table by executing the SQL script found in `frontend/supabase/migrations/spotify_tokens.sql` through your Supabase dashboard.

## 4. Restart Your Development Server

After making these changes, restart your Next.js development server:

```bash
npm run dev
```

## 5. Using the Integration

1. Navigate to the Pomodoro timer page
2. Connect your Spotify account
3. Select a playlist
4. Start your Pomodoro session
5. Enjoy music during your focus sessions!

## Notes

- Full playback control requires a Spotify Premium account
- Tokens are automatically refreshed when needed
- Your Spotify tokens are securely stored in your database
- The Web Playback SDK provides in-browser playback
- Both Premium and Free users can see current track and playlist information

## Troubleshooting

If you encounter any issues:

1. Check that your Client ID and Secret are correctly entered in `.env.local`
2. Verify that the redirect URI in your Spotify Developer Dashboard matches exactly
3. Clear your browser cookies and try connecting again
4. Check the browser console for any error messages

For more detailed technical information, refer to `README-SPOTIFY.md`.
