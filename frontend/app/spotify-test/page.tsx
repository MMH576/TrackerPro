import SpotifyTest from '@/components/spotify/SpotifyTest';

export const metadata = {
  title: 'Spotify Connection Test | TrackerPro',
  description: 'Test your Spotify integration',
};

export default function SpotifyTestPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Spotify Connection Test</h1>
      <div className="max-w-md mx-auto">
        <SpotifyTest />
      </div>
    </div>
  );
} 