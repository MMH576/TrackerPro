import { NextResponse } from 'next/server';

// Generate the Spotify authorization URL
function getAuthUrl() {
  // Log environment variables to debug
  console.log('Environment variables:', {
    clientId: process.env.SPOTIFY_CLIENT_ID ? 'set' : 'missing',
    redirectUri: process.env.SPOTIFY_REDIRECT_URI ? 'set' : 'missing'
  });

  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
  const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
  const SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'playlist-read-private',
    'playlist-read-collaborative'
  ];

  if (!CLIENT_ID || !REDIRECT_URI) {
    console.error('Missing required environment variables:', {
      'SPOTIFY_CLIENT_ID': CLIENT_ID ? 'set' : 'missing',
      'SPOTIFY_REDIRECT_URI': REDIRECT_URI ? 'set' : 'missing'
    });
    throw new Error('Missing required environment variables');
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(' '),
    show_dialog: 'true'
  });

  const authUrl = `${AUTH_ENDPOINT}?${params.toString()}`;
  console.log('Generated auth URL:', authUrl);
  return authUrl;
}

export async function GET() {
  try {
    const authUrl = getAuthUrl();
    console.log('Redirecting to Spotify auth URL');
    
    // Set a cookie to track the auth flow
    const response = NextResponse.redirect(authUrl);
    response.cookies.set('spotify_auth_pending', 'true', {
      maxAge: 10 * 60, // 10 minutes
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return response;
  } catch (error: any) {
    console.error('Error generating auth URL:', error);
    // Redirect to an error page with the error message
    const errorMessage = encodeURIComponent(error.message || 'Failed to connect to Spotify');
    return NextResponse.redirect(new URL(`/error?message=${errorMessage}`, process.env.NEXT_PUBLIC_APP_URL));
  }
} 