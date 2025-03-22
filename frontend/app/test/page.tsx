'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';

export default function TestPage() {
  const [status, setStatus] = useState('Testing connection...');
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setStatus('Testing connection...');
    setDetails(null);
    setError(null);

    try {
      // Test public variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials missing in environment variables');
      }
      
      // Test Supabase auth connection
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        throw new Error(`Auth error: ${authError.message}`);
      }
      
      // Test database connection
      const { data: dbData, error: dbError } = await supabase
        .from('profiles')
        .select('count', { count: 'estimated', head: true });
      
      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      setStatus('Connection successful');
      setDetails({
        auth: authData,
        database: dbData,
        env: {
          supabaseUrl: supabaseUrl.substring(0, 15) + '...',
          supabaseKey: supabaseKey.substring(0, 15) + '...',
        }
      });
    } catch (err) {
      console.error(err);
      setStatus('Connection failed');
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
          <CardDescription>
            Testing connection to your Supabase project
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Status: {status}</h3>
            <Button onClick={testConnection}>
              Test Again
            </Button>
          </div>
          
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
              <h3 className="font-medium mb-1">Error Details:</h3>
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {details && (
            <div className="bg-muted p-4 rounded-md overflow-auto">
              <pre className="text-xs">{JSON.stringify(details, null, 2)}</pre>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="text-sm text-muted-foreground">
          Make sure your Supabase project is properly set up and your environment variables are correctly configured.
        </CardFooter>
      </Card>
    </div>
  );
} 