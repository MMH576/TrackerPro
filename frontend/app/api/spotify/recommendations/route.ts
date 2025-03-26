import { NextRequest, NextResponse } from 'next/server';
import { SpotifyClient } from '@/utils/spotify-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'focus';
  
  try {
    const client = new SpotifyClient('api-call');
    await client.initialize();
    
    // Define seed genres based on mode
    let seedGenres: string[] = [];
    
    switch (mode) {
      case 'focus':
        seedGenres = ['ambient', 'study', 'classical', 'piano'];
        break;
      case 'relax':
        seedGenres = ['chill', 'sleep', 'ambient', 'meditation'];
        break;
      case 'energize':
        seedGenres = ['work-out', 'electronic', 'dance', 'pop'];
        break;
      default:
        seedGenres = ['ambient', 'classical', 'piano'];
    }
    
    // Only use 2 genres maximum (Spotify API limitation)
    seedGenres = seedGenres.slice(0, 2);
    
    // Get recommendations
    const recommendations = await client.getRecommendations([], [], seedGenres, 20);
    
    return NextResponse.json({
      mode,
      tracks: recommendations
    });
  } catch (error: any) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get recommendations' },
      { status: 500 }
    );
  }
} 