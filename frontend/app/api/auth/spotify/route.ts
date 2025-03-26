import { NextRequest, NextResponse } from 'next/server';
import querystring from 'querystring';

// Generate the Spotify authorization URL
function getAuthUrl(request: NextRequest) {
  // Get client ID from environment variables
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  
  // Log environment variables for debugging
  console.log('SPOTIFY_CLIENT_ID:', clientId);
  console.log('SPOTIFY_REDIRECT_URI:', redirectUri);
  
  // Get the returnTo path from query parameters
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get('returnTo') || '/pomodoro';
  console.log('returnTo:', returnTo);
  
  if (!clientId || !redirectUri) {
    console.error('Missing Spotify credentials');
    return { error: 'Missing Spotify credentials', url: null };
  }

  // Generate a random string for the state parameter
  // Include the returnTo path in the state to ensure we can redirect back
  const stateObj = {
    random: Math.random().toString(36).substring(2, 15),
    returnTo: returnTo
  };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');

  // Define the scopes for the authorization
  const scope = [
    'user-read-private',
    'user-read-email',
    'user-modify-playback-state',
    'user-read-playback-state',
    'user-read-currently-playing',
    'streaming',
    'playlist-read-private',
    'playlist-read-collaborative'
  ].join(' ');

  // Construct and return the authorization URL
  const params = {
    response_type: 'code',
    client_id: clientId,
    scope: scope,
    redirect_uri: redirectUri,
    state: state,
    show_dialog: 'true'
  };

  return { 
    error: null, 
    url: `https://accounts.spotify.com/authorize?${querystring.stringify(params)}`
  };
}

export async function GET(request: NextRequest) {
  try {
    const result = getAuthUrl(request);
    
    if (result.error) {
      // Extract returnTo from the request
      const { searchParams } = new URL(request.url);
      const returnTo = searchParams.get('returnTo') || '/pomodoro';
      
      // Redirect to the return path with error
      const redirectUrl = `${returnTo}?error=${encodeURIComponent(result.error)}`;
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    
    // Set a cookie to track the authentication flow
    const response = NextResponse.redirect(new URL(result.url as string));
    response.cookies.set('spotify_auth_state', 'pending', {
      maxAge: 10 * 60, // 10 minutes
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Error in Spotify authorization:', error);
    
    // Extract returnTo from the request
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo') || '/pomodoro';
    
    // Redirect to the return path with error
    const redirectUrl = `${returnTo}?error=${encodeURIComponent('Failed to initialize Spotify authorization')}`;
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }
} 