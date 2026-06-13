// Shared types and storage keys for admin data
// Used by both admin panel and user-facing app

export interface Announcement {
  id: string
  image: string        // icon key: 'ssc' | 'banking' | 'leaderboard' | 'practice'
  imageUrl?: string    // uploaded image URL (takes priority over icon if set)
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
  imageUrl?: string    // optional uploaded image URL
}

export interface UpcomingExam {
  id: string
  name: string
  date: string
  status: string
  statusType: 'open' | 'coming' | 'admit' | 'closed'
  imageUrl?: string              // optional uploaded image URL
  // Detail fields (shown when user taps on an upcoming exam)
  description?: string           // Brief description of the exam
  conductingBody?: string        // e.g. "SSC", "IBPS", "UPSC"
  eligibility?: string           // e.g. "Graduate in any discipline"
  examDate?: string              // Exact exam date, e.g. "15 Jul 2025"
  applicationDeadline?: string   // Last date to apply, e.g. "30 Jun 2025"
  applicationLink?: string       // URL to apply, e.g. "https://ssc.nic.in"
  examMode?: string              // e.g. "Online (CBT)", "Offline (OMR)"
  totalPosts?: string            // e.g. "5000 vacancies"
  salary?: string                // e.g. "Rs. 25,500 - 81,100"
  examPattern?: string           // e.g. "100 questions, 60 min, -0.25 negative"
  importantDates?: string        // Multi-line important dates, e.g. "Reg Start: 1 Jun\nReg End: 30 Jun\nExam: 15 Jul"
  officialWebsite?: string       // URL to official website
}

export interface DailyTip {
  id: string
  text: string
  imageUrl?: string    // optional uploaded image URL
}

// Question inside a Previous Year Paper
export interface PaperQuestion {
  id: string
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string  // "A" | "B" | "C" | "D"
  explanation?: string
}

// Previous Year Paper: grouped by year, each paper has questions + optional link to a test
export interface PrevYearPaper {
  id: string
  year: string          // e.g. "2026", "2025"
  name: string          // e.g. "SSC CGL Tier-I 2026"
  examCategory: string  // e.g. "ssc", "banking" - links to category slug
  testId: string        // links to an existing test in the system (optional)
  totalQuestions: number
  duration: number      // minutes
  difficulty: string    // e.g. "Easy", "Medium", "Hard"
  questions: PaperQuestion[]  // questions directly in this paper
}

// Sidebar Menu Item - admin can control which items appear
export interface SidebarMenuItem {
  id: string
  icon: string          // icon name from lucide-react: "Zap", "BookmarkPlus", "BarChart3", "FileText", "Target", "Clock", "Home", "BookOpen", "Trophy"
  label: string         // display name
  page: string          // page to navigate to: "practice", "bookmarks", "perf-report", "prev-papers", "your-exam", "daily-routine", "home", "exams", "leaderboard"
  gradient: string      // tailwind gradient: "from-amber-400 to-orange-500"
  visible: boolean      // whether item shows in sidebar
  order: number         // display order (lower = higher)
}

export const STORAGE_KEYS = {
  announcements: 'examprep_announcements',
  notifications: 'examprep_notifications',
  readNotifs: 'examprep_read_notifications',
  upcomingExams: 'examprep_upcoming_exams',
  dailyTips: 'examprep_daily_tips',
  prevYearPapers: 'examprep_prev_year_papers',
  sidebarMenu: 'examprep_sidebar_menu',
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
  {
    id: '1', name: 'SSC CGL 2025 Tier-I', date: 'Jul 2025', status: 'Registration Open', statusType: 'open',
    description: 'Staff Selection Commission - Combined Graduate Level Examination 2025 for Group B & C posts in Government of India.',
    conductingBody: 'SSC (Staff Selection Commission)',
    eligibility: 'Bachelor\'s degree from a recognized university',
    examDate: 'Jul-Aug 2025 (Tentative)',
    applicationDeadline: '30 Jun 2025',
    applicationLink: 'https://ssc.nic.in',
    examMode: 'Online (CBT)',
    totalPosts: '15,000+ vacancies',
    salary: 'Rs. 25,500 - 81,100 (Level 4-7)',
    examPattern: '100 questions, 60 min, +2 marks, -0.5 negative marking',
    importantDates: 'Reg Start: 1 May 2025\nReg End: 30 Jun 2025\nTier-I Exam: Jul-Aug 2025\nTier-II Exam: Oct 2025',
    officialWebsite: 'https://ssc.nic.in',
  },
  {
    id: '2', name: 'IBPS PO 2025 Prelims', date: 'Aug 2025', status: 'Coming Soon', statusType: 'coming',
    description: 'Institute of Banking Personnel Selection - Probationary Officer exam for recruitment in public sector banks.',
    conductingBody: 'IBPS (Institute of Banking Personnel Selection)',
    eligibility: 'Graduate in any discipline from a recognized university',
    examDate: 'Aug-Sep 2025 (Tentative)',
    applicationDeadline: 'To be announced',
    applicationLink: 'https://ibps.in',
    examMode: 'Online (CBT)',
    totalPosts: '4,000+ vacancies',
    salary: 'Rs. 36,000 - 63,840 (Basic + DA + HRA)',
    examPattern: 'Prelims: 100 Qs, 60 min | Mains: 155 Qs, 180 min',
    importantDates: 'Notification: Jun 2025\nReg Start: To be announced\nPrelims: Aug 2025\nMains: Nov 2025',
    officialWebsite: 'https://ibps.in',
  },
  {
    id: '3', name: 'RRB NTPC CBT-2', date: 'Sep 2025', status: 'Admit Card Soon', statusType: 'admit',
    description: 'Railway Recruitment Board - Non-Technical Popular Categories CBT-2 for graduate & undergraduate posts in Indian Railways.',
    conductingBody: 'RRB (Railway Recruitment Board)',
    eligibility: '12th pass or Graduate (varies by post)',
    examDate: 'Sep 2025',
    applicationDeadline: 'Application closed',
    applicationLink: 'https://rrbcdg.gov.in',
    examMode: 'Online (CBT)',
    totalPosts: '35,000+ vacancies',
    salary: 'Rs. 19,900 - 63,200 (Level 2-5)',
    examPattern: '120 questions, 90 min, +1 mark, -0.33 negative marking',
    importantDates: 'CBT-1 Completed\nCBT-2: Sep 2025\nSkill Test: Nov 2025\nFinal Result: Jan 2026',
    officialWebsite: 'https://rrbcdg.gov.in',
  },
  {
    id: '4', name: 'CTET July 2025', date: 'Jul 2025', status: 'Registration Open', statusType: 'open',
    description: 'Central Teacher Eligibility Test conducted by CBSE for recruitment of teachers in central government schools (KVS, NVS, etc.).',
    conductingBody: 'CBSE (Central Board of Secondary Education)',
    eligibility: 'Senior Secondary (or its equivalent) with at least 50% marks or Bachelor\'s degree (varies by level)',
    examDate: 'Jul 2025 (Tentative)',
    applicationDeadline: 'To be announced',
    applicationLink: 'https://ctet.nic.in',
    examMode: 'Offline (OMR)',
    totalPosts: 'Eligibility Certificate (no direct vacancy)',
    salary: 'Teacher Pay Scale: Rs. 35,400 - 1,12,400 (Level 6)',
    examPattern: 'Paper-I: 150 Qs, 150 min | Paper-II: 150 Qs, 150 min, +1 mark, no negative marking',
    importantDates: 'Notification: May 2025\nReg Start: To be announced\nReg End: To be announced\nExam: Jul 2025',
    officialWebsite: 'https://ctet.nic.in',
  },
  {
    id: '5', name: 'CDS II 2025', date: 'Sep 2025', status: 'Coming Soon', statusType: 'coming',
    description: 'Combined Defence Services Examination II 2025 for recruitment into Indian Military Academy, Naval Academy, Air Force Academy and Officers Training Academy.',
    conductingBody: 'UPSC (Union Public Service Commission)',
    eligibility: 'Graduate from a recognized university (varies by academy)',
    examDate: 'Sep 2025 (Tentative)',
    applicationDeadline: 'To be announced',
    applicationLink: 'https://upsc.gov.in',
    examMode: 'Offline (OMR)',
    totalPosts: 'Approx. 450+ vacancies',
    salary: 'Rs. 56,100 - 1,77,500 (Lieutenant Level 10)',
    examPattern: 'IMA/INA/AFA: 300 marks, 3 papers | OTA: 200 marks, 2 papers, objective type',
    importantDates: 'Notification: May 2025\nReg Start: To be announced\nReg End: Jun 2025\nExam: Sep 2025\nSSB Interview: Nov-Dec 2025',
    officialWebsite: 'https://upsc.gov.in',
  },
  {
    id: '6', name: 'Delhi Police Constable 2025', date: 'Nov 2025', status: 'Notification Soon', statusType: 'coming',
    description: 'Delhi Police Constable Recruitment 2025 for Male and Female candidates in Delhi Police under SSC.',
    conductingBody: 'SSC (Staff Selection Commission)',
    eligibility: '12th pass from a recognized board + valid driving license (for male)',
    examDate: 'Nov-Dec 2025 (Tentative)',
    applicationDeadline: 'To be announced',
    applicationLink: 'https://ssc.nic.in',
    examMode: 'Online (CBT)',
    totalPosts: '7,000+ vacancies',
    salary: 'Rs. 21,700 - 69,100 (Level 3)',
    examPattern: '100 questions, 90 min, +1 mark, -0.25 negative marking (Reasoning, GK, Maths, English)',
    importantDates: 'Notification: Aug 2025\nReg Start: To be announced\nReg End: To be announced\nCBT: Nov-Dec 2025\nPE&MT: Jan 2026',
    officialWebsite: 'https://ssc.nic.in',
  },
]

export const DEFAULT_DAILY_TIPS: DailyTip[] = [
  { id: '1', text: 'Solve at least 50 questions daily from different topics. Consistency beats intensity in exam preparation!' },
  { id: '2', text: 'Review your mistakes regularly. Understanding why you got something wrong is more valuable than getting it right.' },
  { id: '3', text: 'Practice time management. Set a timer for each mock test to simulate real exam conditions.' },
  { id: '4', text: 'Focus on weak areas first. Spend 70% of your study time on topics you find difficult.' },
  { id: '5', text: 'Take short breaks every 45 minutes. Your brain consolidates information during rest periods.' },
]

export const DEFAULT_PREV_YEAR_PAPERS: PrevYearPaper[] = [
  { id: '1', year: '2026', name: 'SSC CGL Tier-I 2026', examCategory: 'ssc', testId: '', totalQuestions: 100, duration: 60, difficulty: 'Medium', questions: [] },
  { id: '2', year: '2026', name: 'IBPS PO Prelims 2026', examCategory: 'banking', testId: '', totalQuestions: 100, duration: 60, difficulty: 'Hard', questions: [] },
  { id: '3', year: '2025', name: 'SSC CGL Tier-I 2025', examCategory: 'ssc', testId: '', totalQuestions: 100, duration: 60, difficulty: 'Medium', questions: [] },
  { id: '4', year: '2025', name: 'IBPS PO Prelims 2025', examCategory: 'banking', testId: '', totalQuestions: 100, duration: 60, difficulty: 'Hard', questions: [] },
  { id: '5', year: '2025', name: 'RRB NTPC CBT-2 2025', examCategory: 'railways', testId: '', totalQuestions: 120, duration: 90, difficulty: 'Medium', questions: [] },
  { id: '6', year: '2024', name: 'SSC CGL Tier-I 2024', examCategory: 'ssc', testId: '', totalQuestions: 100, duration: 60, difficulty: 'Easy', questions: [] },
  { id: '7', year: '2024', name: 'IBPS PO Prelims 2024', examCategory: 'banking', testId: '', totalQuestions: 100, duration: 60, difficulty: 'Medium', questions: [] },
]

export const DEFAULT_SIDEBAR_MENU: SidebarMenuItem[] = [
  { id: '1', icon: 'Home', label: 'Home', page: 'home', gradient: 'from-orange-500 to-amber-500', visible: true, order: 1 },
  { id: '2', icon: 'BookOpen', label: 'All Exams', page: 'exams', gradient: 'from-blue-500 to-indigo-500', visible: true, order: 2 },
  { id: '3', icon: 'Trophy', label: 'Leaderboard', page: 'leaderboard', gradient: 'from-yellow-500 to-orange-500', visible: true, order: 3 },
  { id: '4', icon: 'Zap', label: 'Quick Practice', page: 'practice', gradient: 'from-amber-400 to-orange-500', visible: true, order: 4 },
  { id: '5', icon: 'BookmarkPlus', label: 'Bookmarks', page: 'bookmarks', gradient: 'from-rose-400 to-pink-500', visible: true, order: 5 },
  { id: '6', icon: 'BarChart3', label: 'Performance', page: 'perf-report', gradient: 'from-emerald-400 to-teal-500', visible: true, order: 6 },
  { id: '7', icon: 'FileText', label: 'Prev. Papers', page: 'prev-papers', gradient: 'from-blue-400 to-cyan-500', visible: true, order: 7 },
  { id: '8', icon: 'Target', label: 'Your Exam', page: 'your-exam', gradient: 'from-violet-400 to-purple-500', visible: true, order: 8 },
  { id: '9', icon: 'Clock', label: 'Daily Routine', page: 'daily-routine', gradient: 'from-sky-400 to-blue-500', visible: true, order: 9 },
]

// Client-side helpers (for static/Capacitor app)
export function getAnnouncements(): Announcement[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.announcements)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getNotifications(): Notification[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.notifications)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getUpcomingExams(): UpcomingExam[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.upcomingExams)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
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
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.dailyTips)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveDailyTips(tips: DailyTip[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.dailyTips, JSON.stringify(tips))
}

export function getPrevYearPapers(): PrevYearPaper[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.prevYearPapers)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function savePrevYearPapers(papers: PrevYearPaper[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.prevYearPapers, JSON.stringify(papers))
}

export function getSidebarMenu(): SidebarMenuItem[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.sidebarMenu)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveSidebarMenu(items: SidebarMenuItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.sidebarMenu, JSON.stringify(items))
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
