export interface Habit {
  id: string
  name: string
  description?: string
  category: string
  frequency: string
  goal: number
  streak: number
  completedDates: string[]
  progress: number
  color?: string
  isFavorite: boolean
  type?: 'yes-no' | 'counter' | 'timer'
  icon?: string
  logs?: { date: string; value: number }[]
  days?: string[]
}

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  preferences: {
    reminderEnabled: boolean
    reminderTime: string
    calendarSync: boolean
    weekStartsOn: number
    compactView: boolean
    animations: boolean
    streakAlerts: boolean
    achievementAlerts: boolean
    defaultReminderTime: string
    defaultCategory: string
    publicProfile: boolean
    shareProgress: boolean
    analytics: boolean
  }
}

export interface Notification {
  id: string
  message: string
  timestamp: string
  time: string
  unread: boolean
  type: 'reminder' | 'achievement' | 'streak' | 'system'
  // Optional properties
  name?: string
  avatar?: string
}

