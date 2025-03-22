import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    
    console.log('Auth callback: Processing', code ? 'with code' : 'without code');

    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback: Error exchanging code for session', error);
        return NextResponse.redirect(
          new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url)
        );
      }
      
      if (data?.session) {
        console.log('Auth callback: Session established successfully');
      }
    } else {
      console.log('Auth callback: No code provided');
    }

    // Redirect to dashboard after successful auth
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (err) {
    console.error('Auth callback: Unexpected error', err);
    return NextResponse.redirect(
      new URL('/auth/login?error=Authentication failed. Please try again.', request.url)
    );
  }
} 