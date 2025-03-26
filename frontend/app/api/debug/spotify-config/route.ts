import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Only return non-sensitive information for debugging
    const configInfo = {
      SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID ? `${process.env.SPOTIFY_CLIENT_ID.substring(0, 6)}...` : 'not set',
      SPOTIFY_REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV,
      hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
    };
    
    return NextResponse.json({ config: configInfo });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 