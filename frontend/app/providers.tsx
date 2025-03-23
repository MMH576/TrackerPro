'use client';

import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from '@/hooks/use-user';
import { FriendsProvider } from '@/hooks/use-friends';
import { ChallengesProvider } from '@/hooks/use-challenges';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UserProvider>
        <FriendsProvider>
          <ChallengesProvider>
            {children}
            <Toaster />
          </ChallengesProvider>
        </FriendsProvider>
      </UserProvider>
    </>
  );
} 