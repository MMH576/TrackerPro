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
}

export interface Challenge {
  id: string
  name: string
  description: string
  type: string
  participants: { id: string; progress: number }[]
  startDate: string
  endDate: string
  userProgress: number
  totalDays: number
  daysLeft: number
}

