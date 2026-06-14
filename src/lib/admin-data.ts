// Shared types and storage keys for admin data
// Used by both admin panel and user-facing app

export interface Announcement {
  id: string
  image: string
  imageUrl?: string // Optional custom image URL (base64 data URL or external URL)
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
  link?: string // Optional link URL - admin can set this so users can navigate on click
  imageUrl?: string // Optional custom image (base64 data URL or external URL)
}

export interface DailyTip {
  id: string
  text: string // The tip text shown to users
  link?: string // Optional link URL
  imageUrl?: string // Optional custom image (base64 data URL or external URL)
  isActive: boolean // Only active tips are shown
  createdAt: string
}

export interface PageImage {
  id: string // e.g. 'home_hero', 'home_quick_practice', 'profile_banner', 'practice_header'
  label: string // Human-readable label for admin
  page: string // Which page: home, exams, tests, practice, profile, leaderboard, results
  section: string // Which section on the page
  imageUrl: string // The image URL (base64 data URL or external URL)
  updatedAt: string
}

export interface UpcomingExam {
  id: string
  name: string // Exam name shown to users
  date: string // Display date string (e.g. "15 Jul 2025")
  status: string // Status label (e.g. "Registration Open", "Coming Soon", "Admit Card Out")
  statusType: 'open' | 'coming' | 'admit' | 'closed' // Determines badge color
  catSlug: string // Category slug to navigate to on click (e.g. 'ssc', 'banking', 'railways')
  isActive: boolean // Only active exams are shown to users
  order: number // Display order
  imageUrl?: string // Optional custom image (base64 data URL or external URL)
  description?: string // Detailed description shown in detail modal
}

export const STORAGE_KEYS = {
  announcements: 'examprep_announcements',
  notifications: 'examprep_notifications',
  dailyTips: 'examprep_daily_tips',
  adminAuth: 'examprep_admin_auth',
  pageImages: 'examprep_page_images',
  upcomingExams: 'examprep_upcoming_exams',
} as const

export const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', image: 'ssc', title: 'SSC CGL 2025', subtitle: 'New Mock Tests Added!', action: 'exams', gradient: 'from-orange-500 to-red-500' },
  { id: '2', image: 'banking', title: 'Banking PO', subtitle: 'MEGA Test Series Live!', action: 'exams', gradient: 'from-blue-500 to-indigo-500' },
  { id: '3', image: 'leaderboard', title: 'Weekly Winners', subtitle: 'Get Special Badges!', action: 'leaderboard', gradient: 'from-emerald-500 to-teal-500' },
  { id: '4', image: 'practice', title: 'Practice Mode', subtitle: 'Topic-wise Practice LIVE!', action: 'practice', gradient: 'from-purple-500 to-pink-500' },
]

export const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Welcome to ExamPrep Bharat!', message: 'Start your exam preparation journey today. Explore all available tests and practice mock exams.', time: 'Just now', read: false, type: 'info' },
  { id: '2', title: 'New SSC CGL Test Available', message: 'A new mock test for SSC CGL 2025 has been added. Try it now and check your preparation level!', time: '2h ago', read: false, type: 'update', link: 'exams' },
  { id: '3', title: 'Weekly Maintenance Notice', message: 'App maintenance scheduled this Sunday 2AM-4AM. Some features may be temporarily unavailable.', time: '1d ago', read: true, type: 'alert' },
]

export const DEFAULT_DAILY_TIPS: DailyTip[] = [
  { id: '1', text: 'Solve at least 50 questions daily from different topics. Consistency beats intensity in exam preparation!', isActive: true, createdAt: new Date().toISOString() },
  { id: '2', text: 'Focus on weak areas first. Identify topics where your accuracy is below 60% and practice them more.', isActive: true, createdAt: new Date().toISOString() },
  { id: '3', text: 'Time management is key! Practice solving questions within 1-2 minutes each to build speed.', isActive: true, createdAt: new Date().toISOString() },
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

/**
 * Get a random active daily tip for display
 */
export function getDailyTip(): DailyTip | null {
  const tips = getDailyTips().filter(t => t.isActive)
  if (tips.length === 0) return null
  // Use date-based selection so same tip shown all day
  const dayIndex = Math.floor(Date.now() / 86400000) % tips.length
  return tips[dayIndex]
}

// Page Images - allow admin to add images to any page section
export const DEFAULT_PAGE_IMAGES: PageImage[] = []

export function getPageImages(): PageImage[] {
  if (typeof window === 'undefined') return DEFAULT_PAGE_IMAGES
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.pageImages)
    return stored ? JSON.parse(stored) : DEFAULT_PAGE_IMAGES
  } catch {
    return DEFAULT_PAGE_IMAGES
  }
}

export function savePageImages(images: PageImage[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.pageImages, JSON.stringify(images))
}

export function getPageImage(id: string): string | undefined {
  const images = getPageImages()
  return images.find(img => img.id === id)?.imageUrl
}

// Upcoming Exams - allow admin to manage upcoming exams shown on home page
export const DEFAULT_UPCOMING_EXAMS: UpcomingExam[] = [
  { id: '1', name: 'SSC CGL 2025', date: '15 Jul 2025', status: 'Registration Open', statusType: 'open', catSlug: 'ssc', isActive: true, order: 1, description: 'Staff Selection Commission Combined Graduate Level Examination 2025. Application deadline: 30 Jun 2025. Tier-I exam expected in Aug-Sep 2025.' },
  { id: '2', name: 'IBPS PO 2025', date: '20 Aug 2025', status: 'Coming Soon', statusType: 'coming', catSlug: 'banking', isActive: true, order: 2, description: 'Institute of Banking Personnel Selection Probationary Officer Exam 2025. Notification expected in Jul 2025. Prelims in Oct 2025.' },
  { id: '3', name: 'RRB NTPC 2025', date: '10 Sep 2025', status: 'Admit Card Out', statusType: 'admit', catSlug: 'railways', isActive: true, order: 3, description: 'Railway Recruitment Board Non-Technical Popular Categories Exam 2025. CBT Stage-I scheduled for Sep 2025. Download admit card from official RRB website.' },
]

export function getUpcomingExams(): UpcomingExam[] {
  if (typeof window === 'undefined') return DEFAULT_UPCOMING_EXAMS
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.upcomingExams)
    return stored ? JSON.parse(stored) : DEFAULT_UPCOMING_EXAMS
  } catch {
    return DEFAULT_UPCOMING_EXAMS
  }
}

export function saveUpcomingExams(exams: UpcomingExam[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.upcomingExams, JSON.stringify(exams))
}

export function getActiveUpcomingExams(): UpcomingExam[] {
  return getUpcomingExams()
    .filter(e => e.isActive)
    .sort((a, b) => a.order - b.order)
}
