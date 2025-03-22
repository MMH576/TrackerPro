import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    
    console.log('Auth callback: Processing', code ? 'with code' : 'without code');
    console.log('Auth callback URL:', request.url);
    console.log('Environment:', process.env.NODE_ENV);

    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      
      // Exchange the code for a session
      console.log('Auth callback: Exchanging code for session...');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback: Error exchanging code for session', error);
        return NextResponse.redirect(
          new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url)
        );
      }
      
      if (data?.session) {
        console.log('Auth callback: Session established successfully');
        console.log('Auth callback: User ID:', data.session.user.id);
        console.log('Auth callback: Session expires at:', 
          data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'unknown');
      }
    } else {
      console.log('Auth callback: No code provided');
    }

    // Add a cache-busting query parameter to prevent caching issues
    const dashboardUrl = new URL('/dashboard', request.url);
    dashboardUrl.searchParams.set('_', Date.now().toString());
    
    console.log('Auth callback: Redirecting to', dashboardUrl.toString());
    
    // Redirect to dashboard after successful auth
    return NextResponse.redirect(dashboardUrl);
  } catch (err) {
    console.error('Auth callback: Unexpected error', err);
    return NextResponse.redirect(
      new URL('/auth/login?error=Authentication failed. Please try again.', request.url)
    );
  }
} 