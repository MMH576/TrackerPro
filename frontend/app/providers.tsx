'use client';

import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from '@/hooks/use-user';
import { TaskProvider } from '@/contexts/task-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UserProvider>
        <TaskProvider>
          {children}
          <Toaster />
        </TaskProvider>
      </UserProvider>
    </>
  );
} 