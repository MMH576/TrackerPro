'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSpotify } from '@/hooks/use-spotify';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';

// Dynamically import the FloatingPlayer component with no SSR
// Use named export from the module
const FloatingPlayer = dynamic(
  () => import('./FloatingPlayer').then(mod => ({ default: mod.FloatingPlayer })),
  { ssr: false, loading: () => null }
);

export default function FloatingPlayerWrapper() {
  const { isAuthenticated, currentTrack, isPlaying } = useSpotify();
  const [showPlayer, setShowPlayer] = useState(false);
  const [isClientSide, setIsClientSide] = useState(false);
  
  // Check if we're on the client side
  useEffect(() => {
    setIsClientSide(true);
  }, []);

  // Handle player visibility based on Spotify state
  useEffect(() => {
    if (!isClientSide) return;
    
    // Show player when playing or when there's a track
    if ((isAuthenticated && currentTrack) || isPlaying) {
      setShowPlayer(true);
      localStorage.setItem('spotify_player_visible', 'true');
    }
  }, [isClientSide, isAuthenticated, currentTrack, isPlaying]);

  // Toggle button handler
  const togglePlayer = () => {
    setShowPlayer(prev => !prev);
    if (!showPlayer) {
      localStorage.setItem('spotify_player_visible', 'true');
    }
  };

  // Return null if not on client
  if (!isClientSide) {
    return null;
  }

  // Show toggle button when player is hidden
  if (!showPlayer && isAuthenticated) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlayer}
          className="h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-md"
        >
          <Music className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  // Render the player when visible
  if (showPlayer) {
    return <FloatingPlayer />;
  }

  return null;
} 