import type { Habit, Friend, Challenge } from "./types"

// Initial habits for demo
export const initialHabits: Habit[] = [
  {
    id: "habit-1",
    name: "Morning Meditation",
    description: "10 minutes of mindfulness",
    category: "mindfulness",
    frequency: "daily",
    goal: 1,
    streak: 5,
    completedDates: ["2025-03-16", "2025-03-15", "2025-03-14", "2025-03-13", "2025-03-12"],
    progress: 71,
    color: "blue",
    isFavorite: true,
  },
  {
    id: "habit-2",
    name: "Read 30 minutes",
    description: "Read books or articles",
    category: "learning",
    frequency: "daily",
    goal: 1,
    streak: 12,
    completedDates: [
      "2025-03-16",
      "2025-03-15",
      "2025-03-14",
      "2025-03-13",
      "2025-03-12",
      "2025-03-11",
      "2025-03-10",
      "2025-03-09",
      "2025-03-08",
      "2025-03-07",
      "2025-03-06",
      "2025-03-05",
    ],
    progress: 86,
    color: "amber",
    isFavorite: false,
  },
  {
    id: "habit-3",
    name: "Drink 8 glasses of water",
    description: "Stay hydrated throughout the day",
    category: "health",
    frequency: "daily",
    goal: 8,
    streak: 3,
    completedDates: ["2025-03-16", "2025-03-15", "2025-03-14"],
    progress: 43,
    color: "cyan",
    isFavorite: true,
  },
  {
    id: "habit-4",
    name: "Exercise",
    description: "30 minutes of physical activity",
    category: "health",
    frequency: "daily",
    goal: 1,
    streak: 7,
    completedDates: ["2025-03-15", "2025-03-14", "2025-03-13", "2025-03-12", "2025-03-11", "2025-03-10", "2025-03-09"],
    progress: 50,
    color: "green",
    isFavorite: false,
  },
]

// Mock friends data for social features
export const mockFriends: Friend[] = [
  {
    id: "friend-1",
    name: "Sarah Chen",
    avatar: "/placeholder.svg?height=40&width=40",
    activeStreak: 14,
    weeklyScore: 92,
  },
  {
    id: "friend-2",
    name: "Michael Kim",
    avatar: "/placeholder.svg?height=40&width=40",
    activeStreak: 7,
    weeklyScore: 78,
  },
  {
    id: "friend-3",
    name: "Jessica Taylor",
    avatar: "/placeholder.svg?height=40&width=40",
    activeStreak: 3,
    weeklyScore: 65,
  },
  {
    id: "friend-4",
    name: "David Wilson",
    avatar: "/placeholder.svg?height=40&width=40",
    activeStreak: 9,
    weeklyScore: 84,
  },
]

// Mock challenges data
export const mockChallenges: Challenge[] = [
  {
    id: "challenge-1",
    name: "30-Day Meditation Challenge",
    description: "Complete a 10-minute meditation every day",
    type: "habit",
    participants: [
      { id: "friend-1", progress: 12 },
      { id: "friend-2", progress: 9 },
    ],
    startDate: "2025-03-01",
    endDate: "2025-03-30",
    userProgress: 10,
    totalDays: 30,
    daysLeft: 18,
  },
  {
    id: "challenge-2",
    name: "Weekly Reading Challenge",
    description: "Read for at least 30 minutes every day",
    type: "streak",
    participants: [
      { id: "friend-3", progress: 2 },
      { id: "friend-4", progress: 4 },
    ],
    startDate: "2025-03-10",
    endDate: "2025-03-17",
    userProgress: 3,
    totalDays: 7,
    daysLeft: 5,
  },
]

