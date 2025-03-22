import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Development mode flag - set to false to ensure authentication is required
const BYPASS_AUTH_IN_DEV = true;
const isDevelopment = process.env.NODE_ENV === 'development';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;
  
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res });
  
  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Enhanced logging for debugging
  console.log(`
  ------------------- AUTH DEBUG -------------------
  Path: ${pathname}
  Session exists: ${session ? 'YES' : 'NO'}
  Environment: ${process.env.NODE_ENV}
  User ID: ${session?.user?.id || 'none'}
  User Email: ${session?.user?.email || 'none'}
  Session expiry: ${session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A'}
  ---------------------------------------------------
  `);

  // AUTH LOGIC
  const isAuthRoute = pathname.startsWith('/auth');
  const isApiRoute = pathname.startsWith('/api');
  const isTestRoute = pathname.startsWith('/test');
  const isPublicRoute = pathname === '/';
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isSuccessRoute = pathname === '/auth/success'; // Allow access to success page regardless of auth

  console.log(`Middleware: Path ${pathname}, Session: ${session ? 'exists' : 'none'}`);

  // If accessing the root URL, redirect to login page if not authenticated
  if (pathname === '/' && !session) {
    console.log('Redirecting from root to login page');
    const redirectUrl = new URL('/auth/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Bypass auth for dashboard in development mode if flag is enabled
  if (isDevelopment && BYPASS_AUTH_IN_DEV && isDashboardRoute) {
    console.log('Development mode: Bypassing auth check for dashboard');
    return res;
  }

  // If not authenticated and trying to access protected route
  if (!session && !isAuthRoute && !isApiRoute && !isTestRoute && !isPublicRoute) {
    console.log(`Redirecting to login: no session, accessing ${pathname}`);
    const redirectUrl = new URL('/auth/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If authenticated and trying to access auth routes, but not the success page
  if (session && isAuthRoute && !isSuccessRoute) {
    console.log(`Redirecting to dashboard: has session, accessing ${pathname}`);
    const redirectUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Match all routes except for static files, api routes, 
// and files in the public directory
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 