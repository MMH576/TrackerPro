'use client';

import { useState, useEffect } from "react";
import type { Habit } from "@/lib/types";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Mock data for development
const MOCK_HABITS: Habit[] = [
  {
    id: '1',
    name: 'Morning Meditation',
    description: '10 minutes of mindfulness',
    category: 'mindfulness',
    frequency: 'daily',
    type: 'timer',
    goal: 10,
    streak: 5,
    completedDates: [
      new Date().toISOString().split('T')[0]
    ],
    progress: 17,
    isFavorite: true,
    icon: '🧘',
    logs: [
      { date: new Date().toISOString().split('T')[0], value: 10 }
    ],
    days: ['0', '1', '2', '3', '4', '5', '6']
  },
  {
    id: '2',
    name: 'Read 30 minutes',
    description: 'Read books or articles',
    category: 'learning',
    frequency: 'daily',
    type: 'timer',
    goal: 30,
    streak: 12,
    completedDates: [
      new Date().toISOString().split('T')[0]
    ],
    progress: 40,
    isFavorite: false,
    icon: '📚',
    logs: [
      { date: new Date().toISOString().split('T')[0], value: 30 }
    ],
    days: ['0', '1', '2', '3', '4', '5', '6']
  },
  {
    id: '3',
    name: 'Drink 8 glasses of water',
    description: 'Stay hydrated throughout the day',
    category: 'health',
    frequency: 'daily',
    type: 'counter',
    goal: 8,
    streak: 3,
    completedDates: [],
    progress: 10,
    isFavorite: true,
    icon: '💧',
    logs: [],
    days: ['0', '1', '2', '3', '4', '5', '6']
  },
  {
    id: '4',
    name: 'Exercise',
    description: '30 minutes of physical activity',
    category: 'health',
    frequency: 'daily',
    type: 'yes-no',
    goal: 1,
    streak: 7,
    completedDates: [],
    progress: 23,
    isFavorite: false,
    icon: '🏃',
    logs: [],
    days: ['0', '1', '2', '3', '4', '5', '6']
  },
  {
    id: '5',
    name: 'Budget Review',
    description: 'Review monthly expenses',
    category: 'finance',
    frequency: 'weekly',
    type: 'yes-no',
    goal: 1,
    streak: 4,
    completedDates: [],
    progress: 15,
    isFavorite: false,
    icon: '💰',
    logs: [],
    days: ['1']
  },
  {
    id: '6',
    name: 'Draw or Paint',
    description: 'Practice artistic skills',
    category: 'creativity',
    frequency: 'weekly',
    type: 'timer',
    goal: 45,
    streak: 2,
    completedDates: [],
    progress: 8,
    isFavorite: true,
    icon: '🎨',
    logs: [],
    days: ['6', '0']
  }
];

// Development mode habit management hook
export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      setLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // If no user, use mock data for development
        setHabits(MOCK_HABITS);
        return;
      }
      
      // Fetch habits from Supabase
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
      
      if (habitsError) throw habitsError;
      
      if (!habitsData || habitsData.length === 0) {
        // If no habits found, use mock data for now
        setHabits(MOCK_HABITS);
        return;
      }
      
      // Fetch habit logs
      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_date', { ascending: false });
      
      if (logsError) throw logsError;
      
      // Transform the data from Supabase schema to our app's schema
      const transformedHabits: Habit[] = habitsData.map(habit => {
        // Find logs for this habit
        const habitLogs = logsData?.filter(log => log.habit_id === habit.id) || [];
        
        // Calculate streak
        const streak = calculateStreak(habitLogs);
        
        // Calculate progress
        const progress = calculateProgress(habitLogs, habit.frequency?.type || 'daily');
        
        // Get completed dates
        const completedDates = habitLogs.map(log => log.completed_date);
        
        // Format logs for our app
        const logs = habitLogs.map(log => ({
          date: log.completed_date,
          value: log.count
        }));
        
        // Determine habit type
        let habitType: 'yes-no' | 'counter' | 'timer' = 'yes-no';
        
        if (habit.target_count > 1) {
          habitType = 'counter';
        }

        // Extract days from frequency JSON
        const days = habit.frequency?.days ? 
          habit.frequency.days.map((day: number | string) => day.toString()) : 
          ['0', '1', '2', '3', '4', '5', '6'];
        
        // Transform the habit
        return {
          id: habit.id,
          name: habit.name,
          description: habit.description || '',
          category: habit.color || 'health', // Use color field as category until a category field is added
          frequency: habit.frequency?.type || 'daily',
          type: habitType,
          goal: habit.target_count || 1,
          streak,
          completedDates,
          progress,
          isFavorite: false, // Default, can add column in Supabase
          icon: habit.icon || '✨',
          color: habit.color || 'blue',
          logs,
          days
        };
      });
      
      setHabits(transformedHabits);
    } catch (err) {
      console.error('Error loading habits:', err);
      setError(err instanceof Error ? err : new Error('Failed to load habits'));
      // Fallback to mock data in case of error
      setHabits(MOCK_HABITS);
    } finally {
      setLoading(false);
    }
  };

  // Calculate streak based on consecutive completed days
  const calculateStreak = (logs: any[]): number => {
    if (!logs || logs.length === 0) return 0;
    
    // Sort logs by date in descending order
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime()
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split('T')[0];
    
    // Check if completed today
    const isCompletedToday = sortedLogs.some(log => log.completed_date === todayStr);
    
    // If not completed today or yesterday, return 0
    if (!isCompletedToday && !sortedLogs.some(log => log.completed_date === yesterdayStr)) {
      return 0;
    }
    
    // Calculate consecutive days
    let streak = isCompletedToday ? 1 : 0;
    let currentDate = isCompletedToday ? yesterdayStr : todayStr;
    
    while (sortedLogs.some(log => log.completed_date === currentDate)) {
      streak++;
      // Move to previous day
      const date = new Date(currentDate);
      date.setDate(date.getDate() - 1);
      currentDate = date.toISOString().split('T')[0];
    }
    
    return streak;
  };
  
  // Calculate progress percentage for the current month
  const calculateProgress = (logs: any[], frequency: any): number => {
    if (!logs || logs.length === 0) return 0;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter logs for current month
    const logsThisMonth = logs.filter(log => {
      const logDate = new Date(log.completed_date);
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    });
    
    if (logsThisMonth.length === 0) return 0;
    
    // Calculate days in the month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Get number of days that have passed in the month
    const daysPassed = Math.min(now.getDate(), daysInMonth);
    
    // For daily habits
    if (frequency === 'daily') {
      return Math.round((logsThisMonth.length / daysPassed) * 100);
    }
    
    // For weekly habits
    if (frequency === 'weekly') {
      // Calculate number of weeks that have passed
      const weeksPassed = Math.ceil(daysPassed / 7);
      return Math.round((logsThisMonth.length / weeksPassed) * 100);
    }
    
    // Fallback
    return Math.round((logsThisMonth.length / daysPassed) * 100);
  };

  const addHabit = async (habitData: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'progress' | 'logs'>) => {
    try {
      setLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Authentication required');
      }
      
      // Format frequency data based on the Supabase schema
      const frequencyData = {
        type: habitData.frequency,
        days: habitData.days || (
          habitData.frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] :
          habitData.frequency === 'weekdays' ? [1, 2, 3, 4, 5] :
          habitData.frequency === 'weekends' ? [0, 6] :
          [1] // Default to Monday for weekly habits if no days specified
        )
      };
      
      // Insert habit into Supabase
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: habitData.name,
          description: habitData.description || null,
          icon: habitData.icon || '✨',
          color: habitData.color || 'blue',
          frequency: frequencyData,
          target_count: habitData.goal || 1,
          remind_time: null, // Could be added to habitData
          is_archived: false
        })
        .select();
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Failed to create habit');
      }
      
      // Create days array for the frontend habit
      const daysArray = habitData.days 
        ? habitData.days.map((day: string | number) => day.toString()) 
        : (habitData.frequency === 'daily' 
            ? ['0', '1', '2', '3', '4', '5', '6'] 
            : habitData.frequency === 'weekdays'
              ? ['1', '2', '3', '4', '5']
              : habitData.frequency === 'weekends'
                ? ['0', '6']
                : ['1'] // Default to Monday for weekly
          );
      
      // Create a new habit object
      const newHabit: Habit = {
        id: data[0].id,
        name: habitData.name,
        description: habitData.description || '',
        category: habitData.category,
        frequency: habitData.frequency,
        type: habitData.type || 'yes-no',
        goal: habitData.goal || 1,
        streak: 0,
        completedDates: [],
        progress: 0,
        isFavorite: false,
        icon: habitData.icon || '✨',
        color: habitData.color || 'blue',
        logs: [],
        days: daysArray
      };
      
      setHabits((prevHabits) => [...prevHabits, newHabit]);
      return { data: newHabit, error: null };
    } catch (err) {
      console.error('Error adding habit:', err);
      const error = err instanceof Error ? err : new Error('Failed to add habit');
      setError(error);
      
      // For development: add mock habit if Supabase fails
      const mockHabit: Habit = {
        id: Math.random().toString(36).substring(2, 9),
        name: habitData.name,
        description: habitData.description || '',
        category: habitData.category,
        frequency: habitData.frequency,
        type: habitData.type || 'yes-no',
        goal: habitData.goal || 1,
        streak: 0,
        completedDates: [],
        progress: 0,
        isFavorite: false,
        icon: habitData.icon || '✨',
        color: habitData.color || 'blue',
        logs: [],
        days: habitData.days ? habitData.days.map(day => day.toString()) : 
          (habitData.frequency === 'daily' ? ['0', '1', '2', '3', '4', '5', '6'] : ['1', '2', '3', '4', '5'])
      };
      
      setHabits((prevHabits) => [...prevHabits, mockHabit]);
      return { data: mockHabit, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      setLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Try to delete from Supabase
        const { error } = await supabase
          .from('habits')
          .update({ is_archived: true })
          .eq('id', id)
          .eq('user_id', user.id);
        
        if (error) throw error;
      }
      
      // Remove from local state regardless of Supabase success
      setHabits((prevHabits) => prevHabits.filter(habit => habit.id !== id));
      return { error: null };
    } catch (err) {
      console.error('Error deleting habit:', err);
      const error = err instanceof Error ? err : new Error('Failed to delete habit');
      setError(error);
      
      // Remove from local state even if Supabase fails
      setHabits((prevHabits) => prevHabits.filter(habit => habit.id !== id));
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const toggleCompletion = async (id: string, value?: number) => {
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      const habit = habits.find(h => h.id === id);
      
      if (!habit) {
        throw new Error('Habit not found');
      }
      
      const isCompleted = habit.completedDates.includes(today);
      let newCompletedDates;
      let newStreak = habit.streak;
      let newLogs = [...(habit.logs || [])];
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (isCompleted) {
        // Remove today from completed dates
        newCompletedDates = habit.completedDates.filter(date => date !== today);
        newStreak = Math.max(0, habit.streak - 1);
        newLogs = newLogs.filter(log => log.date !== today);
        
        if (user) {
          // Delete the log from Supabase
          const { error } = await supabase
            .from('habit_logs')
            .delete()
            .eq('habit_id', id)
            .eq('user_id', user.id)
            .eq('completed_date', today);
          
          if (error) throw error;
        }
      } else {
        // Add today to completed dates
        newCompletedDates = [...habit.completedDates, today];
        
        // Determine if this extends the streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (habit.completedDates.includes(yesterdayStr) || habit.streak === 0) {
          newStreak = habit.streak + 1;
        }
        
        // For counter or timer habits, track the value
        const completionValue = value || 1;
        newLogs = [...newLogs, { date: today, value: completionValue }];
        
        if (user) {
          // Add the log to Supabase
          const { error } = await supabase
            .from('habit_logs')
            .insert({
              habit_id: id,
              user_id: user.id,
              completed_date: today,
              count: completionValue
            });
          
          if (error) throw error;
        }
      }
      
      // Calculate new progress (current month completion rate)
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const daysPassed = Math.min(new Date().getDate(), daysInMonth);
      
      // Count completed days this month
      const completedThisMonth = newCompletedDates.filter(date => 
        date.startsWith(new Date().toISOString().substring(0, 7))
      ).length;
      
      const newProgress = Math.round((completedThisMonth / daysPassed) * 100);
      
      // Update the habit in state
      setHabits((prevHabits) => 
        prevHabits.map(h => 
          h.id === id 
            ? {
                ...h,
                completedDates: newCompletedDates,
                streak: newStreak,
                progress: newProgress,
                logs: newLogs
              } 
            : h
        )
      );
      
      return { error: null };
    } catch (err) {
      console.error('Error toggling completion:', err);
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
      
      // Update in state
      setHabits((prevHabits) => 
        prevHabits.map(habit => 
          habit.id === id ? { ...habit, isFavorite: !habit.isFavorite } : habit
        )
      );
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // In real implementation, would update a column in Supabase
        // This is a placeholder for when that column exists
        // const { error } = await supabase
        //   .from('habits')
        //   .update({ is_favorite: !habit.isFavorite })
        //   .eq('id', id)
        //   .eq('user_id', user.id);
        // 
        // if (error) throw error;
      }
      
      return { error: null };
    } catch (err) {
      console.error('Error toggling favorite:', err);
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
    toggleFavorite,
    loadHabits
  };
} 