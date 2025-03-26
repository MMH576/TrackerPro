'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/supabase/database.types';

type SupabaseContext = {
  supabase: SupabaseClient<Database> | null;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);

  useEffect(() => {
    const client = createClientComponentClient<Database>();
    setSupabase(client);
  }, []);

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  );
}

export function useSupabaseClient() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabaseClient must be used within a SupabaseProvider');
  }
  return context.supabase;
} 