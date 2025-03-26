'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SpotifyCallback() {
  const router = useRouter();

  useEffect(() => {
    // The actual auth handling is done in the Spotify context
    // This is just a loading page that will show while that happens
    
    // Set a fallback redirect in case something goes wrong
    const timeout = setTimeout(() => {
      router.push('/pomodoro');
    }, 10000); // 10 second fallback
    
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="container flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Connecting to Spotify</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-center text-muted-foreground">
            Please wait while we complete your Spotify authentication...
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 