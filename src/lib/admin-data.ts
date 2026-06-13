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

export interface UpcomingExam {
  id: string
  name: string
  date: string
  status: string
  statusType: 'open' | 'coming' | 'admit' | 'closed'
}

export interface DailyTip {
  id: string
  text: string
}

export const STORAGE_KEYS = {
  announcements: 'examprep_announcements',
  notifications: 'examprep_notifications',
  readNotifs: 'examprep_read_notifications',
  upcomingExams: 'examprep_upcoming_exams',
  dailyTips: 'examprep_daily_tips',
  fsInitialized: 'examprep_firestore_initialized',
} as const

export const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', image: 'ssc', title: 'SSC CGL 2025', subtitle: 'New Mock Tests Added!', action: 'exams', gradient: 'from-orange-500 to-red-500' },
  { id: '2', image: 'banking', title: 'Banking PO', subtitle: 'MEGA Test Series Live!', action: 'exams', gradient: 'from-blue-500 to-indigo-500' },
  { id: '3', image: 'leaderboard', title: 'Weekly Winners', subtitle: 'Get Special Badges!', action: 'leaderboard', gradient: 'from-emerald-500 to-teal-500' },
  { id: '4', image: 'practice', title: 'Practice Mode', subtitle: 'Topic-wise Practice LIVE!', action: 'practice', gradient: 'from-purple-500 to-pink-500' },
]

export const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Welcome to MockMaster!', message: 'Start your exam preparation journey today. Explore all available tests and practice mock exams.', time: 'Just now', read: false, type: 'info' },
  { id: '2', title: 'New SSC CGL Test Available', message: 'A new mock test for SSC CGL 2025 has been added. Try it now and check your preparation level!', time: '2h ago', read: false, type: 'update' },
  { id: '3', title: 'Weekly Maintenance Notice', message: 'App maintenance scheduled this Sunday 2AM-4AM. Some features may be temporarily unavailable.', time: '1d ago', read: true, type: 'alert' },
]

export const DEFAULT_UPCOMING_EXAMS: UpcomingExam[] = [
  { id: '1', name: 'SSC CGL 2025 Tier-I', date: 'Jul 2025', status: 'Registration Open', statusType: 'open' },
  { id: '2', name: 'IBPS PO 2025 Prelims', date: 'Aug 2025', status: 'Coming Soon', statusType: 'coming' },
  { id: '3', name: 'RRB NTPC CBT-2', date: 'Sep 2025', status: 'Admit Card Soon', statusType: 'admit' },
]

export const DEFAULT_DAILY_TIPS: DailyTip[] = [
  { id: '1', text: 'Solve at least 50 questions daily from different topics. Consistency beats intensity in exam preparation!' },
  { id: '2', text: 'Review your mistakes regularly. Understanding why you got something wrong is more valuable than getting it right.' },
  { id: '3', text: 'Practice time management. Set a timer for each mock test to simulate real exam conditions.' },
  { id: '4', text: 'Focus on weak areas first. Spend 70% of your study time on topics you find difficult.' },
  { id: '5', text: 'Take short breaks every 45 minutes. Your brain consolidates information during rest periods.' },
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

export function getUpcomingExams(): UpcomingExam[] {
  if (typeof window === 'undefined') return DEFAULT_UPCOMING_EXAMS
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.upcomingExams)
    return stored ? JSON.parse(stored) : DEFAULT_UPCOMING_EXAMS
  } catch {
    return DEFAULT_UPCOMING_EXAMS
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

export function saveUpcomingExams(exams: UpcomingExam[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.upcomingExams, JSON.stringify(exams))
}

export function getDailyTips(): DailyTip[] {
  if (typeof window === 'undefined') return DEFAULT_DAILY_TIPS
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.dailyTips)
    return stored ? JSON.parse(stored) : DEFAULT_DAILY_TIPS
  } catch {
    return DEFAULT_DAILY_TIPS
  }
}

export function saveDailyTips(tips: DailyTip[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.dailyTips, JSON.stringify(tips))
}

// Track which notification IDs the user has read (persists across refreshes)
export function getReadNotifIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.readNotifs)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

export function markNotifAsRead(id: string): void {
  if (typeof window === 'undefined') return
  const ids = getReadNotifIds()
  ids.add(id)
  localStorage.setItem(STORAGE_KEYS.readNotifs, JSON.stringify([...ids]))
}

export function markAllNotifsAsRead(ids: string[]): void {
  if (typeof window === 'undefined') return
  const existing = getReadNotifIds()
  ids.forEach(id => existing.add(id))
  localStorage.setItem(STORAGE_KEYS.readNotifs, JSON.stringify([...existing]))
}

// Track which Firestore collections have been initialized
export function isFsCollectionInitialized(collection: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.fsInitialized)
    const initialized: Record<string, boolean> = stored ? JSON.parse(stored) : {}
    return initialized[collection] === true
  } catch {
    return false
  }
}

export function markFsCollectionInitialized(collection: string): void {
  if (typeof window === 'undefined') return
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.fsInitialized)
    const initialized: Record<string, boolean> = stored ? JSON.parse(stored) : {}
    initialized[collection] = true
    localStorage.setItem(STORAGE_KEYS.fsInitialized, JSON.stringify(initialized))
  } catch {}
}
