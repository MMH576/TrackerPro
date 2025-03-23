'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './use-user';
import { SocketClient } from '../lib/socket-client';

// Types
export interface ChallengeParticipant {
  id: string;
  name: string;
  avatar: string;
  progress: number;
  status: 'active' | 'completed' | 'failed';
  joined: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'steps' | 'meditation' | 'water' | 'reading' | 'custom';
  goal: number;
  unit: string;
  startDate: string;
  endDate: string;
  createdBy: {
    id: string;
    name: string;
    avatar: string;
  };
  participants: ChallengeParticipant[];
  isPublic: boolean;
}

// Context type
interface ChallengesContextType {
  challenges: Challenge[];
  isLoading: boolean;
  joinChallenge: (id: string) => Promise<boolean>;
  leaveChallenge: (id: string) => Promise<boolean>;
  createChallenge: (challenge: Omit<Challenge, 'id' | 'createdBy' | 'participants'>) => Promise<Challenge | null>;
  updateProgress: (challengeId: string, progress: number) => Promise<boolean>;
}

// Context with default values
const ChallengesContext = createContext<ChallengesContextType>({
  challenges: [],
  isLoading: true,
  joinChallenge: async () => false,
  leaveChallenge: async () => false,
  createChallenge: async () => null,
  updateProgress: async () => false,
});

// Provider component
export function ChallengesProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useUser();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load challenges data
  useEffect(() => {
    if (!isAuthenticated) {
      setChallenges([]);
      setIsLoading(false);
      return;
    }

    const loadChallenges = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, fetch from API
        // const response = await fetch('/api/challenges');
        // if (response.ok) {
        //   const data = await response.json();
        //   setChallenges(data.challenges);
        // }
        
        // Mock data for development
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock challenges
        setChallenges([
          {
            id: 'challenge1',
            name: '10,000 Steps Challenge',
            description: 'Walk 10,000 steps every day for a week',
            type: 'steps',
            goal: 10000,
            unit: 'steps',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: {
              id: 'friend1',
              name: 'Jane Smith',
              avatar: '/placeholder.svg?height=40&width=40',
            },
            participants: [
              {
                id: 'friend1',
                name: 'Jane Smith',
                avatar: '/placeholder.svg?height=40&width=40',
                progress: 8500,
                status: 'active',
                joined: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: 'user1',
                name: user?.name || 'You',
                avatar: user?.avatar || '/placeholder.svg?height=40&width=40',
                progress: 6000,
                status: 'active',
                joined: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: 'friend3',
                name: 'Sarah Johnson',
                avatar: '/placeholder.svg?height=40&width=40',
                progress: 9200,
                status: 'active',
                joined: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
              },
            ],
            isPublic: false,
          },
          {
            id: 'challenge2',
            name: 'Daily Meditation',
            description: 'Meditate for 15 minutes every day',
            type: 'meditation',
            goal: 15,
            unit: 'minutes',
            startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: {
              id: 'friend2',
              name: 'John Doe',
              avatar: '/placeholder.svg?height=40&width=40',
            },
            participants: [
              {
                id: 'friend2',
                name: 'John Doe',
                avatar: '/placeholder.svg?height=40&width=40',
                progress: 45,
                status: 'active',
                joined: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: 'user1',
                name: user?.name || 'You',
                avatar: user?.avatar || '/placeholder.svg?height=40&width=40',
                progress: 30,
                status: 'active',
                joined: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
            isPublic: true,
          },
        ]);
      } catch (error) {
        console.error('Failed to load challenges:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChallenges();
  }, [isAuthenticated, user]);

  // Socket connection for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    try {
      // Connect to socket
      const socketClient = SocketClient.getInstance();
      socketClient.connectToSocket(user?.id || '');

      // Listen for challenge joined events
      socketClient.onChallengeJoined((data) => {
        setChallenges(prev => 
          prev.map(challenge => {
            if (challenge.id === data.challengeId) {
              const newParticipant: ChallengeParticipant = {
                id: data.userId,
                name: data.name,
                avatar: data.avatar,
                progress: 0,
                status: 'active',
                joined: new Date().toISOString(),
              };
              
              return {
                ...challenge,
                participants: [...challenge.participants, newParticipant],
              };
            }
            return challenge;
          })
        );
      });

      // Listen for challenge left events
      socketClient.onChallengeLeft((data) => {
        setChallenges(prev => 
          prev.map(challenge => {
            if (challenge.id === data.challengeId) {
              return {
                ...challenge,
                participants: challenge.participants.filter(
                  participant => participant.id !== data.userId
                ),
              };
            }
            return challenge;
          })
        );
      });

      // Listen for challenge updated events
      socketClient.onChallengeUpdated((data) => {
        setChallenges(prev => 
          prev.map(challenge => {
            if (challenge.id === data.challengeId) {
              return {
                ...challenge,
                participants: challenge.participants.map(participant => {
                  if (participant.id === data.userId) {
                    return {
                      ...participant,
                      progress: data.progress,
                      status: data.progress >= challenge.goal ? 'completed' : 'active',
                    };
                  }
                  return participant;
                }),
              };
            }
            return challenge;
          })
        );
      });

      // Clean up on unmount
      return () => {
        socketClient.disconnectSocket();
      };
    } catch (error) {
      console.error('Socket connection error:', error);
    }
  }, [isAuthenticated, user?.id]);

  // Join a challenge
  const joinChallenge = async (id: string): Promise<boolean> => {
    try {
      // In a real app, call API
      // const response = await fetch(`/api/challenges/${id}/join`, {
      //   method: 'POST'
      // });
      // return response.ok;
      
      // Mock for development
      await new Promise(resolve => setTimeout(resolve, 700));
      
      const challengeToJoin = challenges.find(c => c.id === id);
      if (!challengeToJoin) return false;
      
      // Add user to participants
      const newParticipant: ChallengeParticipant = {
        id: user?.id || 'user1',
        name: user?.name || 'You',
        avatar: user?.avatar || '/placeholder.svg?height=40&width=40',
        progress: 0,
        status: 'active',
        joined: new Date().toISOString(),
      };
      
      setChallenges(prev => 
        prev.map(challenge => {
          if (challenge.id === id) {
            return {
              ...challenge,
              participants: [...challenge.participants, newParticipant],
            };
          }
          return challenge;
        })
      );
      
      // Emit socket event
      try {
        const socketClient = SocketClient.getInstance();
        socketClient.emitChallengeJoined({
          userId: user?.id || '',
          challengeId: id,
          name: user?.name || '',
          avatar: user?.avatar || '',
        });
      } catch (error) {
        console.error('Socket error:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to join challenge:', error);
      return false;
    }
  };

  // Leave a challenge
  const leaveChallenge = async (id: string): Promise<boolean> => {
    try {
      // In a real app, call API
      // const response = await fetch(`/api/challenges/${id}/leave`, {
      //   method: 'POST'
      // });
      // return response.ok;
      
      // Mock for development
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setChallenges(prev => 
        prev.map(challenge => {
          if (challenge.id === id) {
            return {
              ...challenge,
              participants: challenge.participants.filter(
                participant => participant.id !== user?.id
              ),
            };
          }
          return challenge;
        })
      );
      
      // Emit socket event
      try {
        const socketClient = SocketClient.getInstance();
        socketClient.emitChallengeLeft({
          userId: user?.id || '',
          challengeId: id,
        });
      } catch (error) {
        console.error('Socket error:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to leave challenge:', error);
      return false;
    }
  };

  // Create a new challenge
  const createChallenge = async (
    challenge: Omit<Challenge, 'id' | 'createdBy' | 'participants'>
  ): Promise<Challenge | null> => {
    try {
      // In a real app, call API
      // const response = await fetch('/api/challenges', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(challenge)
      // });
      // if (response.ok) {
      //   return await response.json();
      // }
      // return null;
      
      // Mock for development
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newChallenge: Challenge = {
        ...challenge,
        id: `challenge_${Date.now()}`,
        createdBy: {
          id: user?.id || 'user1',
          name: user?.name || 'You',
          avatar: user?.avatar || '/placeholder.svg?height=40&width=40',
        },
        participants: [
          {
            id: user?.id || 'user1',
            name: user?.name || 'You',
            avatar: user?.avatar || '/placeholder.svg?height=40&width=40',
            progress: 0,
            status: 'active',
            joined: new Date().toISOString(),
          },
        ],
      };
      
      setChallenges(prev => [newChallenge, ...prev]);
      
      return newChallenge;
    } catch (error) {
      console.error('Failed to create challenge:', error);
      return null;
    }
  };

  // Update progress on a challenge
  const updateProgress = async (challengeId: string, progress: number): Promise<boolean> => {
    try {
      // In a real app, call API
      // const response = await fetch(`/api/challenges/${challengeId}/progress`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ progress })
      // });
      // return response.ok;
      
      // Mock for development
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return false;
      
      setChallenges(prev => 
        prev.map(c => {
          if (c.id === challengeId) {
            return {
              ...c,
              participants: c.participants.map(participant => {
                if (participant.id === user?.id) {
                  return {
                    ...participant,
                    progress,
                    status: progress >= c.goal ? 'completed' : 'active',
                  };
                }
                return participant;
              }),
            };
          }
          return c;
        })
      );
      
      // Emit socket event
      try {
        const socketClient = SocketClient.getInstance();
        socketClient.emitChallengeUpdated({
          userId: user?.id || '',
          challengeId,
          progress,
        });
      } catch (error) {
        console.error('Socket error:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to update progress:', error);
      return false;
    }
  };

  return (
    <ChallengesContext.Provider value={{
      challenges,
      isLoading,
      joinChallenge,
      leaveChallenge,
      createChallenge,
      updateProgress,
    }}>
      {children}
    </ChallengesContext.Provider>
  );
}

// Custom hook to use the challenges context
export function useChallenges() {
  const context = useContext(ChallengesContext);
  if (context === undefined) {
    throw new Error('useChallenges must be used within a ChallengesProvider');
  }
  return context;
} 