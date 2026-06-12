// Shared types and storage keys for admin data
// Used by both admin panel and user-facing app

export interface Announcement {
  id: string
  image: string
  title: string
  subtitle: string
  action: string
  gradient: string
}

export interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'update' | 'alert' | 'info'
}

export const STORAGE_KEYS = {
  announcements: 'examprep_announcements',
  notifications: 'examprep_notifications',
  adminAuth: 'examprep_admin_auth',
} as const

export const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', image: 'ssc', title: 'SSC CGL 2025', subtitle: 'New Mock Tests Added!', action: 'exams', gradient: 'from-orange-500 to-red-500' },
  { id: '2', image: 'banking', title: 'Banking PO', subtitle: 'MEGA Test Series Live!', action: 'exams', gradient: 'from-blue-500 to-indigo-500' },
  { id: '3', image: 'leaderboard', title: 'Weekly Winners', subtitle: 'Get Special Badges!', action: 'leaderboard', gradient: 'from-emerald-500 to-teal-500' },
  { id: '4', image: 'practice', title: 'Practice Mode', subtitle: 'Topic-wise Practice LIVE!', action: 'practice', gradient: 'from-purple-500 to-pink-500' },
]

export const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Welcome to ExamPrep Bharat!', message: 'Start your exam preparation journey today. Explore all available tests and practice mock exams.', time: 'Just now', read: false, type: 'info' },
  { id: '2', title: 'New SSC CGL Test Available', message: 'A new mock test for SSC CGL 2025 has been added. Try it now and check your preparation level!', time: '2h ago', read: false, type: 'update' },
  { id: '3', title: 'Weekly Maintenance Notice', message: 'App maintenance scheduled this Sunday 2AM-4AM. Some features may be temporarily unavailable.', time: '1d ago', read: true, type: 'alert' },
]

// Client-side helpers (for static/Capacitor app)
export function getAnnouncements(): Announcement[] {
  if (typeof window === 'undefined') return DEFAULT_ANNOUNCEMENTS
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.announcements)
    return stored ? JSON.parse(stored) : DEFAULT_ANNOUNCEMENTS
  } catch {
    return DEFAULT_ANNOUNCEMENTS
  }
}

export function getNotifications(): Notification[] {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATIONS
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.notifications)
    return stored ? JSON.parse(stored) : DEFAULT_NOTIFICATIONS
  } catch {
    return DEFAULT_NOTIFICATIONS
  }
}

export function saveAnnouncements(announcements: Announcement[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(announcements))
}

export function saveNotifications(notifications: Notification[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications))
}
