import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import SpotifyWebApi from 'spotify-web-api-node';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

export async function GET(request: NextRequest) {
  console.log('Starting Spotify callback handling...');
  
  // Extract the code and error from the URL
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const state = url.searchParams.get('state');
  
  console.log('Received callback params:', { 
    code: code ? '✓' : '✗', 
    error: error || 'none',
    state: state ? '✓' : '✗'
  });
  
  // Handle errors from Spotify authorization
  if (error) {
    console.error('Spotify authorization error:', error);
    return NextResponse.redirect(new URL(`/pomodoro?error=${encodeURIComponent(error)}`, request.url));
  }
  
  // Ensure we have a code
  if (!code) {
    console.error('No code parameter in callback');
    return NextResponse.redirect(new URL('/pomodoro?error=missing_code', request.url));
  }
  
  // Decode the state parameter to extract returnTo
  let returnTo = '/pomodoro';
  
  if (state) {
    try {
      const stateObj = JSON.parse(Buffer.from(state, 'base64').toString());
      returnTo = stateObj.returnTo || '/pomodoro';
      console.log('Extracted returnTo from state:', returnTo);
    } catch (error) {
      console.error('Error parsing state parameter:', error);
    }
  }
  
  // Now handle the authorization code exchange
  try {
    // Initialize the Spotify API client
    const spotifyApi = new SpotifyWebApi({
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
      redirectUri: SPOTIFY_REDIRECT_URI
    });
    
    console.log('Exchanging code for tokens...');
    
    // Exchange the code for tokens
    const tokenResponse = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = tokenResponse.body;
    
    console.log('Received tokens:', { 
      access_token: access_token ? '✓' : '✗', 
      refresh_token: refresh_token ? '✓' : '✗', 
      expires_in 
    });
    
    // Calculate token expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
    
    // Create response with redirect
    const response = NextResponse.redirect(new URL(returnTo, request.url));
    
    // Set cookies for Spotify tokens with appropriate settings
    // Make sure cookies are accessible to JavaScript and have appropriate expiration
    response.cookies.set('spotify_access_token', access_token, {
      expires: expiresAt,
      httpOnly: false, // Make accessible to JavaScript
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    
    response.cookies.set('spotify_refresh_token', refresh_token, {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      httpOnly: false, // Make accessible to JavaScript
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Set a token expiry cookie to help with client-side expiration checks
    response.cookies.set('spotify_token_expiry', expiresAt.toISOString(), {
      expires: expiresAt,
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Set an additional cookie to track connection state
    response.cookies.set('spotify_connected', 'true', {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Clear the auth state cookie since the flow is complete
    response.cookies.set('spotify_auth_state', '', {
      expires: new Date(0),
      path: '/',
    });
    
    // Try to get the user session and save tokens
    try {
      const supabase = createRouteHandlerClient({ cookies });
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        console.log('User is logged in, saving tokens to database');
        
        // Save the tokens to the database
        await supabase
          .from('spotify_tokens')
          .upsert({
            user_id: session.user.id,
            access_token,
            refresh_token,
            expires_at: expiresAt.toISOString()
          });
      } else {
        console.log('No authenticated user, skipping database token storage');
      }
    } catch (dbError) {
      console.error('Database error when storing tokens:', dbError);
      // Continue with the flow even if database saving fails
    }
    
    console.log('Spotify authentication successful, redirecting to:', returnTo);
    return response;
    
  } catch (error: any) {
    console.error('Error in Spotify callback:', error);
    
    // Extract a useful error message if possible
    let errorMessage = 'Failed to authenticate with Spotify';
    if (error.body && error.body.error_description) {
      errorMessage = error.body.error_description;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Redirect back with error
    return NextResponse.redirect(
      new URL(`${returnTo}?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
} 