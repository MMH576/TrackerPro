'use client';

import { useState, useEffect } from "react";

// Temporary type definition for habits
type Habit = {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  created_at: string;
  user_id: string;
};

// Mock data for development
const MOCK_HABITS: Habit[] = [
  {
    id: '1',
    name: 'Morning Meditation',
    description: 'Practice mindfulness for 10 minutes',
    frequency: 'daily',
    created_at: new Date().toISOString(),
    user_id: 'dev-user-id'
  },
  {
    id: '2',
    name: 'Exercise',
    description: 'Workout for 30 minutes',
    frequency: 'daily',
    created_at: new Date().toISOString(),
    user_id: 'dev-user-id'
  }
];

// Development mode habit management hook
export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate API fetch in development mode
    const loadHabits = async () => {
      try {
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setHabits(MOCK_HABITS);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load habits'));
      } finally {
        setLoading(false);
      }
    };

    loadHabits();
  }, []);

  const addHabit = async (habit: Omit<Habit, 'id' | 'created_at' | 'user_id'>) => {
    try {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newHabit: Habit = {
        ...habit,
        id: Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        user_id: 'dev-user-id'
      };
      
      setHabits((prevHabits) => [...prevHabits, newHabit]);
      return { data: newHabit, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add habit');
      setError(error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setHabits((prevHabits) => prevHabits.filter(habit => habit.id !== id));
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete habit');
      setError(error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return {
    habits,
    loading,
    error,
    addHabit,
    deleteHabit
  };
} 