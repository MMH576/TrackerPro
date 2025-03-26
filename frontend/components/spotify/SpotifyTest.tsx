'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Music, User, LogIn, RefreshCw, Settings } from 'lucide-react';
import Cookies from 'js-cookie';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SpotifyTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [allCookies, setAllCookies] = useState<Record<string, string>>({});
  const [spotifyConfig, setSpotifyConfig] = useState<any>(null);
  const [isCheckingConfig, setIsCheckingConfig] = useState(false);
  
  const supabase = createClientComponentClient();
  
  const checkSession = async () => {
    setIsLoading(true);
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      setUserId(session?.user?.id || null);
      
      // Check if user is connected to Spotify
      const spotifyConnected = Cookies.get('spotify_connected') === 'true';
      const token = Cookies.get('spotify_player_token') || null;
      setAccessToken(token);
      
      // Get all cookies for debugging
      const cookieObj: Record<string, string> = {};
      document.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        cookieObj[name] = value;
      });
      setAllCookies(cookieObj);
      
      // Check for errors in URL
      const queryParams = new URLSearchParams(window.location.search);
      const queryError = queryParams.get('error');
      
      setIsConnected(spotifyConnected);
      setError(queryError);
      
      // Remove the error from URL if it exists
      if (queryError) {
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url.toString());
      }
    } catch (err: any) {
      console.error('Error checking session:', err);
      setError(`Error checking session: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkSpotifyConfig = async () => {
    setIsCheckingConfig(true);
    try {
      const response = await fetch('/api/debug/spotify-config');
      if (!response.ok) {
        throw new Error(`Error fetching config: ${response.status}`);
      }
      const data = await response.json();
      setSpotifyConfig(data.config);
    } catch (err: any) {
      console.error('Error checking Spotify config:', err);
      setError(`Error checking Spotify config: ${err.message}`);
    } finally {
      setIsCheckingConfig(false);
    }
  };
  
  useEffect(() => {
    checkSession();
  }, []);
  
  const handleConnect = () => {
    window.location.href = '/api/auth/spotify';
  };
  
  const handleDisconnect = () => {
    // Remove cookies
    Cookies.remove('spotify_connected');
    Cookies.remove('spotify_player_token');
    setIsConnected(false);
    setAccessToken(null);
  };
  
  const handleLogin = () => {
    window.location.href = '/auth/login?redirect=/spotify-test';
  };
  
  const handleRefresh = () => {
    checkSession();
  };
  
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        <p>Checking status...</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Spotify Connection Test</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={checkSpotifyConfig} className="h-8 w-8 p-0" disabled={isCheckingConfig}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRefresh} className="h-8 w-8 p-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isLoggedIn === false && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              You'll need to log in to fully test the Spotify integration with token storage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              While you can test the OAuth flow without logging in, connecting your account 
              requires authentication so tokens can be stored securely in your user profile.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleLogin} className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Log In
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {isConnected ? (
        <div className="space-y-4">
          <Alert variant="default" className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle>Connected to Spotify</AlertTitle>
            <AlertDescription>
              Your Spotify account is successfully connected. You can now control your music from the app.
            </AlertDescription>
          </Alert>
          
          <Button variant="outline" onClick={handleDisconnect} className="w-full">
            Disconnect Spotify
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800">
            <Music className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle>Connect to Spotify</AlertTitle>
            <AlertDescription>
              Connect your Spotify account to control your music directly from the app.
              {!isLoggedIn && " Note: You won't be able to fully connect without logging in first."}
            </AlertDescription>
          </Alert>
          
          <Button onClick={handleConnect} className="w-full bg-green-600 hover:bg-green-700">
            <Music className="mr-2 h-4 w-4" />
            Connect to Spotify
          </Button>
        </div>
      )}
      
      <div className="text-sm text-muted-foreground mt-4 space-y-2">
        <details>
          <summary className="font-medium cursor-pointer">Debug Information</summary>
          <div className="mt-2 bg-muted p-3 rounded text-xs overflow-auto">
            <ul className="list-disc pl-5 space-y-1">
              <li>User authenticated: {isLoggedIn ? `Yes (${userId})` : 'No'}</li>
              <li>Connection status: {isConnected ? 'Connected' : 'Not connected'}</li>
              <li>spotify_connected cookie: {Cookies.get('spotify_connected') || 'not set'}</li>
              <li>spotify_player_token: {accessToken ? `${accessToken.substring(0, 10)}...` : 'not set'}</li>
              <li>Current URL: {window.location.href}</li>
              <li>Token length: {accessToken?.length || 0} characters</li>
            </ul>
            
            {spotifyConfig && (
              <div className="mt-2">
                <p className="font-medium mb-1">Spotify Config:</p>
                <pre className="text-xs bg-background p-2 rounded whitespace-pre-wrap">
                  {JSON.stringify(spotifyConfig, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="mt-2">
              <p className="font-medium mb-1">All Cookies:</p>
              <pre className="text-xs bg-background p-2 rounded whitespace-pre-wrap">
                {JSON.stringify(allCookies, null, 2)}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
} 