'use client';

import { useState, useEffect } from "react";
import type { Habit } from "@/lib/types";

// Mock data for development
const MOCK_HABITS: Habit[] = [
  {
    id: '1',
    name: 'Morning Meditation',
    description: '10 minutes of mindfulness',
    category: 'mindfulness',
    frequency: 'daily',
    goal: 1,
    streak: 5,
    completedDates: [
      new Date().toISOString().split('T')[0]
    ],
    progress: 17,
    isFavorite: true
  },
  {
    id: '2',
    name: 'Read 30 minutes',
    description: 'Read books or articles',
    category: 'learning',
    frequency: 'daily',
    goal: 1,
    streak: 12,
    completedDates: [
      new Date().toISOString().split('T')[0]
    ],
    progress: 40,
    isFavorite: false
  },
  {
    id: '3',
    name: 'Drink 8 glasses of water',
    description: 'Stay hydrated throughout the day',
    category: 'health',
    frequency: 'daily',
    goal: 8,
    streak: 3,
    completedDates: [],
    progress: 10,
    isFavorite: true
  },
  {
    id: '4',
    name: 'Exercise',
    description: '30 minutes of physical activity',
    category: 'health',
    frequency: 'daily',
    goal: 1,
    streak: 7,
    completedDates: [],
    progress: 23,
    isFavorite: false
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

  const addHabit = async (habit: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'progress'>) => {
    try {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newHabit: Habit = {
        ...habit,
        id: Math.random().toString(36).substring(2, 9),
        streak: 0,
        completedDates: [],
        progress: 0
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

  const toggleCompletion = async (id: string) => {
    try {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const today = new Date().toISOString().split('T')[0];
      
      setHabits((prevHabits) => 
        prevHabits.map(habit => {
          if (habit.id !== id) return habit;
          
          const isCompleted = habit.completedDates.includes(today);
          let newCompletedDates;
          let newStreak = habit.streak;
          
          if (isCompleted) {
            // Remove today from completed dates
            newCompletedDates = habit.completedDates.filter(date => date !== today);
            newStreak = Math.max(0, habit.streak - 1);
          } else {
            // Add today to completed dates
            newCompletedDates = [...habit.completedDates, today];
            newStreak = habit.streak + 1;
          }
          
          // Calculate new progress (mock calculation)
          const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
          const completedThisMonth = newCompletedDates.filter(date => 
            date.startsWith(new Date().toISOString().substring(0, 7))
          ).length;
          
          const newProgress = Math.round((completedThisMonth / daysInMonth) * 100);
          
          return {
            ...habit,
            completedDates: newCompletedDates,
            streak: newStreak,
            progress: newProgress
          };
        })
      );
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to toggle completion');
      setError(error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setHabits((prevHabits) => 
        prevHabits.map(habit => 
          habit.id === id ? { ...habit, isFavorite: !habit.isFavorite } : habit
        )
      );
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to toggle favorite');
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
    deleteHabit,
    toggleCompletion,
    toggleFavorite
  };
} 