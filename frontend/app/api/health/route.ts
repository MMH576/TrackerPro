import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create a direct Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        status: 'error',
        message: 'Supabase credentials are missing',
        config: {
          supabaseUrl: Boolean(supabaseUrl) ? 'configured' : 'missing',
          supabaseKey: Boolean(supabaseKey) ? 'configured' : 'missing',
        }
      }, { status: 500 });
    }
    
    // Create a direct client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Simple health check - just run a simple query
    const { data, error } = await supabase.from('profiles').select('count', { count: 'estimated', head: true });
    
    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Database query failed',
        error: error.message,
        code: error.code,
        details: error,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Supabase connection working',
      data,
      config: {
        supabaseUrl: supabaseUrl.substring(0, 12) + '...',
        supabaseKey: supabaseKey.substring(0, 12) + '...',
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to Supabase',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
} 