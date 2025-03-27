'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import the FloatingPlayer component dynamically to avoid server-side rendering
const FloatingPlayer = dynamic(
  () => import('./FloatingPlayer').then(mod => ({ default: mod.FloatingPlayer })),
  { ssr: false }
);

export function FloatingPlayerWrapper() {
  const [mounted, setMounted] = useState(false);
  
  // Only render the FloatingPlayer component after the component is mounted
  // This ensures it's only rendered on the client side, avoiding hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  return <FloatingPlayer />;
} 