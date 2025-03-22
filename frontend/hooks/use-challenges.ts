'use client';

import { useState, useEffect } from 'react';
import { Challenge } from '@/lib/types';

// Mock challenges for development
const MOCK_CHALLENGES: Challenge[] = [
  {
    id: "c1",
    name: "30-Day Meditation Challenge",
    description: "Meditate for at least 10 minutes every day",
    type: "Daily Habit",
    participants: [
      { id: "f1", progress: 80, name: "Alex Johnson" },
      { id: "f2", progress: 65, name: "Emma Williams" },
      { id: "f3", progress: 45, name: "Ryan Garcia" }
    ],
    startDate: "2023-06-01",
    endDate: "2023-06-30",
    userProgress: 85,
    totalDays: 30,
    daysLeft: 12,
    isJoined: true
  },
  {
    id: "c2",
    name: "Fitness Week",
    description: "Exercise for 30 minutes every day",
    type: "Weekly Goal",
    participants: [
      { id: "f2", progress: 90, name: "Emma Williams" },
      { id: "f4", progress: 75, name: "Olivia Brown" }
    ],
    startDate: "2023-06-10",
    endDate: "2023-06-17",
    userProgress: 70,
    totalDays: 7,
    daysLeft: 3,
    isJoined: true
  },
  {
    id: "c3",
    name: "Reading Marathon",
    description: "Read for 20 minutes each day",
    type: "Monthly Goal",
    participants: [
      { id: "f1", progress: 55, name: "Alex Johnson" },
      { id: "f3", progress: 40, name: "Ryan Garcia" },
      { id: "f5", progress: 60, name: "Michael Smith" }
    ],
    startDate: "2023-06-01",
    endDate: "2023-06-30",
    userProgress: 0,
    totalDays: 30,
    daysLeft: 15,
    isJoined: false
  }
];

export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate API fetch with a delay
    const fetchChallenges = async () => {
      try {
        setIsLoading(true);
        
        // Simulate a network request
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setChallenges(MOCK_CHALLENGES);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch challenges'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  const joinChallenge = async (challengeId: string) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setChallenges(prevChallenges => 
        prevChallenges.map(challenge => 
          challenge.id === challengeId
            ? { ...challenge, isJoined: true }
            : challenge
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to join challenge'));
    } finally {
      setIsLoading(false);
    }
  };

  const leaveChallenge = async (challengeId: string) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setChallenges(prevChallenges => 
        prevChallenges.map(challenge => 
          challenge.id === challengeId
            ? { ...challenge, isJoined: false }
            : challenge
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to leave challenge'));
    } finally {
      setIsLoading(false);
    }
  };

  const createChallenge = async (challengeData: Partial<Challenge>) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newChallenge: Challenge = {
        id: `c${challenges.length + 1}`,
        name: challengeData.name || 'New Challenge',
        description: challengeData.description || '',
        type: challengeData.type || 'Daily Habit',
        participants: [],
        startDate: new Date().toISOString().split('T')[0],
        endDate: challengeData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        userProgress: 0,
        totalDays: 30,
        daysLeft: 30,
        isJoined: true
      };
      
      setChallenges(prevChallenges => [...prevChallenges, newChallenge]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create challenge'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    challenges,
    isLoading,
    error,
    joinChallenge,
    leaveChallenge,
    createChallenge
  };
} 