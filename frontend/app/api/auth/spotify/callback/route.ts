/*
 * DUPLICATE CALLBACK - DISABLED
 * 
 * This route is disabled because it duplicates the functionality in:
 * /api/auth/callback/spotify/route.ts
 * 
 * Having both routes active creates confusion since they handle the same
 * callback URL path differently. The environment variable SPOTIFY_REDIRECT_URI
 * is set to '/api/auth/callback/spotify', so we're using that route instead.
 * 
 * If you need to reactivate this route, ensure you update the SPOTIFY_REDIRECT_URI
 * in your .env.local file and Spotify Developer Dashboard settings.
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// This function is commented out to prevent execution
/*
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  // URL to redirect to after handling the callback
  const redirectTo = '/pomodoro';

  console.log('Spotify callback received:', { 
    hasCode: !!code, 
    error: error || 'none' 
  });

  // Handle errors from Spotify authorization
  if (error) {
    console.error('Spotify auth error:', error);
    return NextResponse.redirect(new URL(`${redirectTo}?error=${error}`, process.env.NEXT_PUBLIC_APP_URL));
  }

  // If no code is provided, redirect to the main page
  if (!code) {
    console.error('No authorization code provided');
    return NextResponse.redirect(new URL(`${redirectTo}?error=no_code`, process.env.NEXT_PUBLIC_APP_URL));
  }

  try {
    // Exchange the authorization code for an access token
    console.log('Exchanging code for tokens...');
    const tokenResponse = await exchangeCodeForToken(code);

    if (!tokenResponse.access_token) {
      console.error('Token exchange failed: No access token received');
      throw new Error('Failed to obtain access token');
    }

    console.log('Token exchange successful');

    // Get the current Supabase user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Authentication error');
    }

    if (!session?.user.id) {
      console.error('No authenticated user found');
      throw new Error('User not authenticated');
    }

    console.log('Authenticated user:', session.user.id);

    // Calculate token expiry (Spotify tokens last 1 hour)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);

    // Store the tokens in Supabase
    console.log('Storing tokens in database...');
    const { error: dbError } = await supabase
      .from('spotify_tokens')
      .upsert({
        user_id: session.user.id,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_at: expiresAt.toISOString()
      });

    if (dbError) {
      console.error('Error storing tokens:', dbError);
      throw new Error('Failed to store tokens');
    }

    console.log('Tokens stored successfully');
    
    // Store the access token in a cookie for the player
    console.log('Setting cookies...');
    const response = NextResponse.redirect(new URL(redirectTo, process.env.NEXT_PUBLIC_APP_URL));
    
    // Cookie for frontend state management
    response.cookies.set('spotify_connected', 'true', { 
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    // Cookie for Spotify player (short-lived)
    response.cookies.set('spotify_player_token', tokenResponse.access_token, {
      maxAge: 3600, // 1 hour (token lifetime)
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    console.log('Redirecting to:', redirectTo);
    return response;
  } catch (error: any) {
    console.error('Error during Spotify callback:', error);
    return NextResponse.redirect(
      new URL(`${redirectTo}?error=${encodeURIComponent(error.message || 'auth_error')}`, process.env.NEXT_PUBLIC_APP_URL)
    );
  }
}

async function exchangeCodeForToken(code: string) {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
  const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

  console.log('Exchange code config:', {
    clientIdSet: !!CLIENT_ID,
    clientSecretSet: !!CLIENT_SECRET,
    redirectUriSet: !!REDIRECT_URI
  });

  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    throw new Error('Missing required Spotify credentials');
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
  });

  console.log('Sending token exchange request...');
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
    },
    body: params.toString()
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Token exchange failed:', errorData);
    throw new Error(`Token exchange failed: ${errorData.error}`);
  }

  return response.json();
}
*/ 