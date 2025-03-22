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
    friendAlerts: boolean
    defaultReminderTime: string
    defaultCategory: string
    publicProfile: boolean
    shareProgress: boolean
    analytics: boolean
  }
}

export interface Friend {
  id: string
  name: string
  avatar: string
  activeStreak: number
  weeklyScore: number
  status?: 'online' | 'offline'
  streak?: number
}

export interface Challenge {
  id: string
  name: string
  description: string
  type: string
  participants: { id: string; progress: number; name?: string }[]
  startDate: string
  endDate: string
  userProgress: number
  totalDays: number
  daysLeft: number
  isJoined?: boolean
}

export interface Notification {
  id: string
  message: string
  timestamp: string
  time: string
  unread: boolean
  type: 'reminder' | 'achievement' | 'social' | 'streak' | 'system' | 'friend'
  // Optional properties
  name?: string
  avatar?: string
}

