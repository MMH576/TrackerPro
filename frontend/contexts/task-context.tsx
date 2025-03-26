'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

// Interface for task data
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  pomodoroSession?: string; // Optional link to a pomodoro session
}

interface TaskContextType {
  tasks: Task[];
  addTask: (title: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTaskCompletion: (id: string) => void;
  deleteTask: (id: string) => void;
  clearCompletedTasks: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Helper function to generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

interface TaskProviderProps {
  children: React.ReactNode;
}

export function TaskProvider({ children }: TaskProviderProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load tasks from localStorage on initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTasks = localStorage.getItem('pomodoroTasks');
        if (savedTasks) {
          const parsedTasks = JSON.parse(savedTasks);
          if (Array.isArray(parsedTasks)) {
            setTasks(parsedTasks);
          }
        }
      } catch (error) {
        console.error('Error loading tasks from localStorage:', error);
      }
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
        
        // If user is logged in, could sync with server here
        if (user?.id) {
          // Future implementation: Sync with server
        }
      } catch (error) {
        console.error('Error saving tasks to localStorage:', error);
      }
    }
  }, [tasks, user]);

  // Add a new task
  const addTask = (title: string) => {
    if (!title.trim()) return;
    
    const newTask: Task = {
      id: generateId(),
      title: title.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  // Update an existing task
  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id ? { ...task, ...updates } : task
      )
    );
  };

  // Toggle task completion status
  const toggleTaskCompletion = (id: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Delete a task
  const deleteTask = (id: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  };

  // Clear all completed tasks
  const clearCompletedTasks = () => {
    setTasks(prevTasks => prevTasks.filter(task => !task.completed));
  };

  const value = {
    tasks,
    addTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
    clearCompletedTasks,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  
  return context;
} 