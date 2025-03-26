import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: NextRequest) {
  try {
    // Get the user ID from the request body
    const { userId } = await request.json();
    
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Fetch the user's tokens
    const { data, error } = await supabase
      .from('spotify_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching token:', error);
      return new NextResponse(JSON.stringify({ error: 'Tokens not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if token is expired or will expire in the next 5 minutes
    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // If token isn't expired yet and won't expire in the next 5 minutes, return current token
    if (expiresAt > fiveMinutesFromNow) {
      console.log('Token still valid, returning current token');
      return new NextResponse(JSON.stringify({ 
        access_token: data.access_token,
        expires_at: data.expires_at
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Refreshing token for user:', userId);

    // Refresh the token
    const refreshedTokens = await refreshSpotifyToken(data.refresh_token);

    if (!refreshedTokens.access_token) {
      throw new Error('Failed to refresh token');
    }

    // Calculate new expiry
    const newExpiresAt = new Date();
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + refreshedTokens.expires_in);

    console.log('Token refreshed, new expiry:', newExpiresAt.toISOString());

    // Update the tokens in the database
    const { error: updateError } = await supabase
      .from('spotify_tokens')
      .update({
        access_token: refreshedTokens.access_token,
        expires_at: newExpiresAt.toISOString(),
        refresh_token: refreshedTokens.refresh_token || data.refresh_token // Use new refresh token if provided
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating tokens:', updateError);
      throw new Error('Failed to update tokens');
    }

    return new NextResponse(JSON.stringify({ 
      message: 'Token refreshed successfully',
      access_token: refreshedTokens.access_token,
      expires_at: newExpiresAt.toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error refreshing token:', error);
    return new NextResponse(JSON.stringify({ error: error.message || 'Failed to refresh token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function refreshSpotifyToken(refreshToken: string) {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Missing required environment variables for token refresh');
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken
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
    console.error('Token refresh error:', {
      status: response.status, 
      error: errorData
    });
    throw new Error(`Token refresh failed: ${errorData.error}`);
  }

  return response.json();
} 