import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  // URL to redirect to after handling the callback
  const redirectTo = '/pomodoro';

  // Handle errors from Spotify authorization
  if (error) {
    console.error('Spotify auth error:', error);
    return NextResponse.redirect(new URL(`${redirectTo}?error=${error}`, request.url));
  }

  // If no code is provided, redirect to the main page
  if (!code) {
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  try {
    // Exchange the authorization code for an access token
    const tokenResponse = await exchangeCodeForToken(code);

    if (!tokenResponse.access_token) {
      throw new Error('Failed to obtain access token');
    }

    // Get the current Supabase user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user.id) {
      throw new Error('User not authenticated');
    }

    // Calculate token expiry (Spotify tokens last 1 hour)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);

    // Log success for debugging
    console.log('Successfully obtained Spotify tokens:', {
      userId: session.user.id,
      expiresAt: expiresAt.toISOString()
    });

    // Store the tokens in Supabase
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

    // Set a cookie to indicate successful authentication
    // Note: This is just for frontend state management, not for authentication
    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    response.cookies.set('spotify_connected', 'true', { 
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Error during Spotify callback:', error);
    return NextResponse.redirect(
      new URL(`${redirectTo}?error=${encodeURIComponent(error.message || 'Authentication failed')}`, request.url)
    );
  }
}

async function exchangeCodeForToken(code: string) {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
  const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

  // Log environment variables for debugging
  console.log('Exchange token environment variables:', {
    clientId: CLIENT_ID ? 'set' : 'missing',
    clientSecret: CLIENT_SECRET ? 'set' : 'missing',
    redirectUri: REDIRECT_URI ? 'set' : 'missing'
  });

  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    throw new Error('Missing required environment variables for token exchange');
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
  });

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
    console.error('Spotify API error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(`Token exchange failed: ${errorData.error}`);
  }

  return response.json();
} 