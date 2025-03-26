import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import SpotifyWebApi from 'spotify-web-api-node';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

export async function POST(request: NextRequest) {
  try {
    console.log('Refreshing Spotify token...');
    
    // Try to get the refresh token from the request body first
    let refreshToken: string | null = null;
    
    try {
      const body = await request.json();
      refreshToken = body.refresh_token || body.refreshToken;
      console.log('Got refresh token from request body');
    } catch (error) {
      console.log('No refresh token in request body or invalid JSON');
    }
    
    // If no refresh token in body, try to get it from cookies
    if (!refreshToken) {
      refreshToken = request.cookies.get('spotify_refresh_token')?.value || null;
      console.log('Using refresh token from cookies:', refreshToken ? 'Found' : 'Not found');
    }
    
    // If still no refresh token, try to get it from database
    if (!refreshToken) {
      console.log('No refresh token in cookies, trying database...');
      
      try {
        // Get the user information
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.id) {
          // Fetch the token from the database
          const { data, error } = await supabase
            .from('spotify_tokens')
            .select('refresh_token')
            .eq('user_id', session.user.id)
            .single();
            
          if (data && !error) {
            refreshToken = data.refresh_token;
            console.log('Found refresh token in database');
          } else {
            console.error('Error fetching token from database:', error);
          }
        } else {
          console.log('No authenticated user session found');
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }
    
    // If still no refresh token, return an error
    if (!refreshToken) {
      console.error('No refresh token available');
      return NextResponse.json(
        { error: 'No refresh token available' },
        { status: 401 }
      );
    }
    
    // Initialize Spotify API
    const spotifyApi = new SpotifyWebApi({
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
      redirectUri: SPOTIFY_REDIRECT_URI,
      refreshToken
    });
    
    // Refresh the access token
    const response = await spotifyApi.refreshAccessToken();
    const { access_token, refresh_token: new_refresh_token, expires_in } = response.body;
    
    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
    
    console.log('Token refreshed successfully');
    
    // Create the response with the format expected by SpotifyClient
    const refreshResponse = NextResponse.json({
      access_token,
      refresh_token: new_refresh_token,
      expires_in,
      token_type: 'Bearer'
    });
    
    // Set the new access token in a cookie
    refreshResponse.cookies.set('spotify_access_token', access_token, {
      expires: expiresAt,
      httpOnly: false, // Make accessible to JavaScript
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Set the new refresh token in a cookie if one was provided
    if (new_refresh_token) {
      refreshResponse.cookies.set('spotify_refresh_token', new_refresh_token, {
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        httpOnly: false, // Make accessible to JavaScript
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
      
      console.log('Updated refresh token in cookies');
    }
    
    // Try to update the database if we have a user session
    try {
      const supabase = createRouteHandlerClient({ cookies });
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        await supabase
          .from('spotify_tokens')
          .upsert({
            user_id: session.user.id,
            access_token,
            refresh_token: new_refresh_token || refreshToken,
            expires_at: expiresAt.toISOString()
          });
          
        console.log('Updated tokens in database');
      }
    } catch (dbError) {
      console.error('Error updating database with refreshed token:', dbError);
      // Continue even if database update fails - we have cookies
    }
    
    return refreshResponse;
    
  } catch (error: any) {
    console.error('Error refreshing token:', error);
    
    // Try to extract the error message
    let errorMessage = 'Failed to refresh token';
    if (error.body && error.body.error_description) {
      errorMessage = error.body.error_description;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Clear cookies if refresh fails - likely invalid refresh token
    const errorResponse = NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
    
    // Clear the Spotify cookies since authentication failed
    errorResponse.cookies.delete('spotify_access_token');
    errorResponse.cookies.delete('spotify_refresh_token');
    errorResponse.cookies.delete('spotify_connected');
    
    return errorResponse;
  }
} 