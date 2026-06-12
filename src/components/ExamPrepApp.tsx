'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  BookOpen, Trophy, Clock, CheckCircle2, XCircle, SkipForward,
  ChevronRight, ChevronLeft, Home, User, ArrowLeft, X,
  Play, Zap, Target, Award, Timer, RefreshCw, BookMarked,
  GraduationCap, Shield, Building, Train, ShieldCheck, Swords,
  LogOut, Loader2, Mail, AlertTriangle, Settings, Bell,
  ChevronDown, Star, Flame, TrendingUp, Calendar, Gift,
  HelpCircle, Share2, MessageCircle, Crown,
  Menu, BookmarkPlus, Download, BarChart3, Wifi,
  ClipboardList, PenTool
} from 'lucide-react'
import {
  getCategories as getLocalCategories, getTestsByExam as getLocalTestsByExam,
  getTestById as getLocalTestById, saveResult as saveLocalResult,
  getLeaderboard as getLocalLeaderboard,
  type LocalExamCategory, type LocalExam, type LocalTest, type LocalQuestion, type TestResult
} from '@/lib/local-data'
import {
  getCategories as getFsCategories, getTests as getFsTests,
  getTestById as getFsTestById, saveResult as saveFsResult,
  getLeaderboard as getFsLeaderboard, getUseFirestore,
  getAnnouncements as getFsAnnouncements, getNotifications as getFsNotifications,
} from '@/lib/firestore-service'
import { useFirebaseAuth } from '@/lib/use-firebase-auth'
import LoginModal from '@/components/LoginModal'
import { App } from '@capacitor/app'
import { getAnnouncements as getLocalAnnouncements, getNotifications as getLocalNotifications } from '@/lib/admin-data'

// ===== Types =====
type Page = 'home' | 'exams' | 'tests' | 'test-info' | 'test-taking' | 'results' | 'leaderboard' | 'profile' | 'practice'

// ===== Unified Data Access (Firestore or Local) =====
const isFirestore = () => getUseFirestore()

async function fetchCategories(): Promise<LocalExamCategory[]> {
  if (isFirestore()) return getFsCategories()
  return getLocalCategories()
}
async function fetchTestsByExam(examId: string): Promise<LocalTest[]> {
  if (isFirestore()) return getFsTests(examId)
  return getLocalTestsByExam(examId)
}
async function fetchTestById(testId: string): Promise<LocalTest | undefined> {
  if (isFirestore()) return getFsTestById(testId) as Promise<LocalTest | undefined>
  return getLocalTestById(testId)
}
async function fetchLeaderboard(testId: string): Promise<TestResult[]> {
  if (isFirestore()) return getFsLeaderboard(testId) as Promise<TestResult[]>
  return getLocalLeaderboard(testId)
}
async function storeResult(data: Omit<TestResult, 'id' | 'createdAt'>): Promise<TestResult> {
  if (isFirestore()) return saveFsResult(data) as Promise<TestResult>
  return saveLocalResult(data)
}

interface CategoryColor {
  bg: string
  text: string
  border: string
  light: string
  gradient: string
}

// ===== Constants =====
const CATEGORY_COLORS: Record<string, CategoryColor> = {
  ssc: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-300', light: 'bg-orange-50', gradient: 'from-orange-500 to-orange-600' },
  banking: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-300', light: 'bg-emerald-50', gradient: 'from-emerald-500 to-emerald-600' },
  railways: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-300', light: 'bg-blue-50', gradient: 'from-blue-500 to-blue-600' },
  'state-govt': { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-300', light: 'bg-purple-50', gradient: 'from-purple-500 to-purple-600' },
  teaching: { bg: 'bg-pink-500', text: 'text-pink-600', border: 'border-pink-300', light: 'bg-pink-50', gradient: 'from-pink-500 to-pink-600' },
  defence: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-300', light: 'bg-amber-50', gradient: 'from-amber-500 to-amber-600' },
  police: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-300', light: 'bg-red-50', gradient: 'from-red-500 to-red-600' },
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ssc: <BookOpen className="w-5 h-5" />,
  banking: <Building className="w-5 h-5" />,
  railways: <Train className="w-5 h-5" />,
  'state-govt': <Shield className="w-5 h-5" />,
  teaching: <GraduationCap className="w-5 h-5" />,
  defence: <Swords className="w-5 h-5" />,
  police: <ShieldCheck className="w-5 h-5" />,
}

// ===== Helper Functions =====
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function getCatColor(slug: string): CategoryColor {
  return CATEGORY_COLORS[slug] || CATEGORY_COLORS.ssc
}

function getCatIcon(slug: string): React.ReactNode {
  return CATEGORY_ICONS[slug] || <BookOpen className="w-5 h-5" />
}

// ===== Main Component =====
export default function ExamPrepApp() {
  // --- Auth ---
  const auth = useFirebaseAuth()

  // --- Page / Navigation ---
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const pageHistoryRef = useRef<Page[]>([])

  // --- Data ---
  const [categories, setCategories] = useState<LocalExamCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<LocalExamCategory | null>(null)
  const [selectedExam, setSelectedExam] = useState<LocalExam | null>(null)
  const [examTests, setExamTests] = useState<LocalTest[]>([])
  const [selectedTest, setSelectedTest] = useState<LocalTest | null>(null)

  // --- Test Taking ---
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(0)
  const [testActive, setTestActive] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const carouselRef = useRef<HTMLDivElement | null>(null)
  const carouselTimerRef = useRef<NodeJS.Timeout | null>(null)

  // --- Results ---
  const [lastResult, setLastResult] = useState<TestResult | null>(null)
  const [leaderboardData, setLeaderboardData] = useState<TestResult[]>([])
  const [leaderboardTestId, setLeaderboardTestId] = useState<string>('')

  // --- UI State ---
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showBackConfirm, setShowBackConfirm] = useState(false)
  const [showLanguageSheet, setShowLanguageSheet] = useState(false)
  const [showAboutSheet, setShowAboutSheet] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [showQuestionNav, setShowQuestionNav] = useState(false)
  const [showSideMenu, setShowSideMenu] = useState(false)
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)

  // --- Notifications (loaded from shared admin storage) ---
  const [notifications, setNotifications] = useState<
    { id: string; title: string; message: string; time: string; read: boolean; type: 'update' | 'alert' | 'info' }[]
  >([])
  const unreadCount = notifications.filter(n => !n.read).length

  // --- Announcements (loaded from shared admin storage) ---
  const [announcements, setAnnouncements] = useState<
    { id: string; image: string; title: string; subtitle: string; action: Page; gradient: string }[]
  >([])
  const [activeAnnouncement, setActiveAnnouncement] = useState(0)

  // (Admin state removed - admin panel is now at /admin route)

  // --- Load categories + admin data on mount ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const cats = await fetchCategories()
        setCategories(cats)
        if (isFirestore()) {
          const anns = await getFsAnnouncements()
          setAnnouncements(anns.map(a => ({ ...a, action: a.action as Page })))
          const notifs = await getFsNotifications()
          setNotifications(notifs)
        } else {
          setAnnouncements(getLocalAnnouncements().map(a => ({ ...a, action: a.action as Page })))
          setNotifications(getLocalNotifications())
        }
      } catch (e) {
        console.error('Data load failed, using local fallback:', e)
        setCategories(getLocalCategories())
        setAnnouncements(getLocalAnnouncements().map(a => ({ ...a, action: a.action as Page })))
        setNotifications(getLocalNotifications())
      }
    }
    loadData()
  }, [])

  // --- Listen for admin data changes (when admin panel updates localStorage) ---
  useEffect(() => {
    const handleStorageChange = () => {
      setAnnouncements(getLocalAnnouncements().map(a => ({ ...a, action: a.action as Page })))
      setNotifications(getLocalNotifications())
    }
    window.addEventListener('storage', handleStorageChange)
    const interval = setInterval(handleStorageChange, 5000)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // --- Auto-scroll carousel ---
  useEffect(() => {
    const startCarousel = () => {
      carouselTimerRef.current = setInterval(() => {
        setActiveAnnouncement(prev => {
          const next = (prev + 1) % announcements.length
          // Scroll the carousel container
          if (carouselRef.current) {
            const cardWidth = carouselRef.current.children[0]?.getBoundingClientRect().width || 250
            const gap = 12 // gap-3 = 12px
            carouselRef.current.scrollTo({
              left: next * (cardWidth + gap),
              behavior: 'smooth'
            })
          }
          return next
        })
      }, 3000) // 3 seconds interval
    }
    startCarousel()
    return () => {
      if (carouselTimerRef.current) clearInterval(carouselTimerRef.current)
    }
  }, [announcements.length])

  // --- Navigation ---
  const navigateTo = useCallback((page: Page) => {
    pageHistoryRef.current.push(currentPage)
    setCurrentPage(page)
  }, [currentPage])

  const goBack = useCallback(() => {
    const prev = pageHistoryRef.current.pop()
    if (prev) {
      setCurrentPage(prev)
    } else {
      setCurrentPage('home')
    }
  }, [])

  // --- Handle mobile back button (Capacitor + Browser) ---
  const handleBackButton = useCallback(() => {
    // If back confirmation is showing, close it
    if (showBackConfirm) {
      setShowBackConfirm(false)
      return
    }
    // If notification panel is open, close it
    if (showNotificationPanel) {
      setShowNotificationPanel(false)
      return
    }
    // If side menu is open, close it
    if (showSideMenu) {
      setShowSideMenu(false)
      return
    }
    // If question nav panel is open, close it
    if (showQuestionNav) {
      setShowQuestionNav(false)
      return
    }
    // If login modal is open, close it
    if (showLoginModal) {
      setShowLoginModal(false)
      return
    }
    // If language sheet is open, close it
    if (showLanguageSheet) {
      setShowLanguageSheet(false)
      return
    }
    // If about sheet is open, close it
    if (showAboutSheet) {
      setShowAboutSheet(false)
      return
    }
    // If taking a test, show confirmation
    if (currentPage === 'test-taking' && testActive) {
      setShowBackConfirm(true)
      return
    }
    // If on home page, minimize app (Android)
    if (currentPage === 'home') {
      App.exitApp?.()
      return
    }
    // Otherwise go back
    if (pageHistoryRef.current.length > 0) {
      goBack()
    } else {
      setCurrentPage('home')
    }
  }, [currentPage, testActive, showBackConfirm, showSideMenu, showQuestionNav, showLoginModal, showLanguageSheet, showAboutSheet, goBack])

  // Capacitor hardware back button
  useEffect(() => {
    let handler: any
    const setupBackButton = async () => {
      try {
        handler = await App.addListener('backButton', () => {
          handleBackButton()
        })
      } catch (e) {
        // Not running in Capacitor, ignore
      }
    }
    setupBackButton()
    return () => {
      handler?.remove?.()
    }
  }, [handleBackButton])

  // Browser popstate (for web/PWA)
  useEffect(() => {
    const handlePopState = () => {
      handleBackButton()
      // Re-push state so browser doesn't navigate away
      window.history.pushState(null, '')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [handleBackButton])

  // Push state on navigation so browser back button fires popstate
  useEffect(() => {
    window.history.pushState(null, '')
  }, [currentPage])

  // --- Timer ---
  useEffect(() => {
    if (testActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            handleFinishTest()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
  }, [testActive])

  // --- Test Functions ---
  async function startTest(test: LocalTest) {
    const fullTest = await fetchTestById(test.id)
    if (!fullTest) return
    setSelectedTest(fullTest)
    setAnswers({})
    setMarkedForReview(new Set())
    setCurrentQuestionIndex(0)
    setTimeLeft(fullTest.duration * 60)
    setTestActive(true)
    navigateTo('test-taking')
  }

  async function handleFinishTest() {
    if (timerRef.current) clearInterval(timerRef.current)
    setTestActive(false)

    if (!selectedTest) return

    const test = selectedTest
    const totalQuestions = test.questions.length
    let correctCount = 0
    let wrongCount = 0
    let skippedCount = 0

    test.questions.forEach(q => {
      const userAnswer = answers[q.id]
      if (!userAnswer) {
        skippedCount++
      } else if (userAnswer === q.correctAnswer) {
        correctCount++
      } else {
        wrongCount++
      }
    })

    const score = correctCount * test.markingCorrect - wrongCount * Math.abs(test.markingWrong)
    const maxScore = totalQuestions * test.markingCorrect
    const timeTaken = test.duration * 60 - timeLeft

    const result = await storeResult({
      testId: test.id,
      testName: test.title,
      examName: test.exam.name,
      userId: auth.getUserId() || 'anonymous',
      correctCount,
      wrongCount,
      skippedCount,
      score,
      maxScore,
      timeTaken,
      totalQuestions,
      answers,
    })

    setLastResult(result)
    navigateTo('results')
  }

  function selectAnswer(questionId: string, option: string) {
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  function clearAnswer(questionId: string) {
    setAnswers(prev => {
      const copy = { ...prev }
      delete copy[questionId]
      return copy
    })
  }

  function toggleReview(questionId: string) {
    setMarkedForReview(prev => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  // --- Stats from localStorage ---
  function getUserStats() {
    try {
      const data = localStorage.getItem('examprep_results')
      if (!data) return { testsTaken: 0, avgScore: 0, bestRank: 0 }
      const results: TestResult[] = JSON.parse(data)
      const userId = auth.getUserId()
      const userResults = userId ? results.filter((r: TestResult) => r.userId === userId) : results
      const testsTaken = userResults.length
      const avgScore = testsTaken > 0 ? Math.round(userResults.reduce((sum: number, r: TestResult) => sum + (r.score / r.maxScore) * 100, 0) / testsTaken) : 0
      const bestRank = 1 // simplified
      return { testsTaken, avgScore, bestRank }
    } catch {
      return { testsTaken: 0, avgScore: 0, bestRank: 0 }
    }
  }

  // --- Bottom nav handler ---
  function handleBottomNav(page: Page) {
    pageHistoryRef.current = []
    setCurrentPage(page)
  }

  // --- Exam select handler ---
  async function openExam(exam: LocalExam, category: LocalExamCategory) {
    setSelectedExam(exam)
    setSelectedCategory(category)
    const tests = await fetchTestsByExam(exam.id)
    setExamTests(tests)
    navigateTo('tests')
  }

  async function openTestInfo(test: LocalTest) {
    const fullTest = await fetchTestById(test.id)
    if (fullTest) {
      setSelectedTest(fullTest)
      navigateTo('test-info')
    }
  }

  async function openLeaderboard(testId: string) {
    setLeaderboardTestId(testId)
    setLeaderboardData(await fetchLeaderboard(testId))
    navigateTo('leaderboard')
  }

  // --- Avatar display ---
  function getAvatarDisplay() {
    if (auth.isGuest) return 'G'
    const display = auth.getUserDisplay()
    if (display) {
      // For email: first letter before @, for name: first letter
      if (display.includes('@')) return display.charAt(0).toUpperCase()
      return display.charAt(0).toUpperCase()
    }
    return 'G'
  }

  // ===== RENDER: Home Page =====
  function renderHome() {
    const stats = getUserStats()
    return (
      <div className="pb-20">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3 rounded-b-2xl">
          <div className="flex items-center justify-between">
            {/* Left: Menu + App Name */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowSideMenu(true)}
                onTouchEnd={(e) => { e.preventDefault(); setShowSideMenu(true) }}
                className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center active:bg-white/30 transition-colors"
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-white text-base font-bold leading-tight">ExamPrep Bharat</h1>
                <p className="text-orange-100 text-[10px] leading-tight">Prepare for government exams</p>
              </div>
            </div>

            {/* Right: Notification */}
            <button
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              onTouchEnd={(e) => { e.preventDefault(); setShowNotificationPanel(!showNotificationPanel) }}
              className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center active:bg-white/30 transition-colors relative"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <Bell className="w-4 h-4 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold border border-orange-500">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Moving Announcements Marquee */}
          <div className="bg-white/10 backdrop-blur rounded-lg mt-2.5 overflow-hidden">
            <div className="flex items-center">
              <div className="bg-white/15 px-2 py-1.5 flex items-center flex-shrink-0">
                <Flame className="w-3.5 h-3.5 text-yellow-300" />
              </div>
              <div className="overflow-hidden flex-1 py-1.5">
                <div className="flex animate-marquee whitespace-nowrap">
                  {announcements.map(a => (
                    <button
                      key={a.id}
                      onClick={() => handleBottomNav(a.action)}
                      className="mx-6 text-[11px] font-medium text-white/90 active:text-white"
                    >
                      {a.title} — {a.subtitle}
                    </button>
                  ))}
                  {/* Duplicate for seamless loop */}
                  {announcements.map(a => (
                    <button
                      key={`dup-${a.id}`}
                      onClick={() => handleBottomNav(a.action)}
                      className="mx-6 text-[11px] font-medium text-white/90 active:text-white"
                    >
                      {a.title} — {a.subtitle}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Panel */}
        {showNotificationPanel && (
          <div className="px-4 -mt-4 mb-2 relative z-40">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Panel Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-500" />
                  <h3 className="font-bold text-sm text-gray-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0">{unreadCount} new</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      className="text-[11px] text-orange-500 font-semibold hover:text-orange-600"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotificationPanel(false)}
                    className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      onClick={() => setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n))}
                      className={`px-4 py-3 border-b border-gray-50 last:border-b-0 active:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-orange-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          notification.type === 'update' ? 'bg-blue-100' :
                          notification.type === 'alert' ? 'bg-amber-100' :
                          'bg-green-100'
                        }`}>
                          {notification.type === 'update' ? <Zap className="w-4 h-4 text-blue-500" /> :
                           notification.type === 'alert' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                           <Gift className="w-4 h-4 text-green-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm ${!notification.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Announcements - Image Banner Carousel */}
        <div className="px-4 mt-3 mb-1">
          <div className="relative">
            {/* Banner Cards - Full Width Single Item */}
            <div
              ref={carouselRef}
              onScroll={() => {
                if (carouselRef.current) {
                  const cardWidth = carouselRef.current.children[0]?.getBoundingClientRect().width || 300
                  const scrollPos = carouselRef.current.scrollLeft
                  const newIndex = Math.round(scrollPos / cardWidth)
                  if (newIndex !== activeAnnouncement && newIndex >= 0 && newIndex < announcements.length) {
                    setActiveAnnouncement(newIndex)
                  }
                }
              }}
              onTouchStart={() => { if (carouselTimerRef.current) clearInterval(carouselTimerRef.current) }}
              onTouchEnd={() => {
                carouselTimerRef.current = setInterval(() => {
                  setActiveAnnouncement(prev => {
                    const next = (prev + 1) % announcements.length
                    if (carouselRef.current) {
                      const cardWidth = carouselRef.current.children[0]?.getBoundingClientRect().width || 300
                      carouselRef.current.scrollTo({ left: next * cardWidth, behavior: 'smooth' })
                    }
                    return next
                  })
                }, 3000)
              }}
              className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
            >
              {announcements.map((a, index) => (
                <button
                  key={a.id}
                  onClick={() => handleBottomNav(a.action)}
                  className="flex-shrink-0 w-full snap-center px-1"
                >
                  <div className={`bg-gradient-to-br ${a.gradient} rounded-2xl overflow-hidden shadow-md active:scale-[0.98] transition-transform`}>
                    {/* Image Area */}
                    <div className="h-32 relative flex items-center justify-center overflow-hidden">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-3 left-6 w-24 h-24 rounded-full border-4 border-white" />
                        <div className="absolute bottom-2 right-8 w-20 h-20 rounded-full border-4 border-white" />
                        <div className="absolute top-10 right-16 w-10 h-10 rounded-full bg-white" />
                        <div className="absolute bottom-4 left-20 w-6 h-6 rounded-full bg-white" />
                      </div>
                      {/* Icon + Text */}
                      <div className="relative z-10 flex items-center gap-4 px-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0">
                          {a.image === 'ssc' && <BookOpen className="w-8 h-8 text-white" />}
                          {a.image === 'banking' && <Building className="w-8 h-8 text-white" />}
                          {a.image === 'leaderboard' && <Trophy className="w-8 h-8 text-white" />}
                          {a.image === 'practice' && <Zap className="w-8 h-8 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-base leading-tight">{a.title}</p>
                          <p className="text-white/80 text-xs mt-1">{a.subtitle}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <span className="text-white/50 text-[10px]">Tap to explore</span>
                            <ChevronRight className="w-3 h-3 text-white/50" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Dots Indicator */}
            <div className="flex items-center justify-center gap-1.5 mt-1">
              {announcements.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveAnnouncement(i)
                    if (carouselRef.current) {
                      const cardWidth = carouselRef.current.children[0]?.getBoundingClientRect().width || 250
                      const gap = 12
                      carouselRef.current.scrollTo({ left: i * (cardWidth + gap), behavior: 'smooth' })
                    }
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeAnnouncement ? 'w-4 bg-orange-500' : 'w-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 mt-4 space-y-6">
          {/* Quick Practice Card */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Quick Practice</p>
                  <p className="text-gray-500 text-xs">Jump into a random test</p>
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl"
                  onClick={() => {
                    const allCats = categories
                    const allExams = allCats.flatMap(c => c.exams)
                    if (allExams.length > 0) {
                      const randomExam = allExams[Math.floor(Math.random() * allExams.length)]
                      const randomCat = allCats.find(c => c.exams.some(e => e.id === randomExam.id))!
                      openExam(randomExam, randomCat)
                    }
                  }}
                >
                  <Play className="w-4 h-4 mr-1" /> Start
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Exam Categories */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">Exam Categories</h2>
              <button onClick={() => handleBottomNav('exams')} className="text-orange-600 text-sm font-medium flex items-center">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => {
                const color = getCatColor(cat.slug)
                return (
                  <Card
                    key={cat.id}
                    className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedCategory(cat)
                      handleBottomNav('exams')
                    }}
                  >
                    <CardContent className="p-4">
                      <div className={`w-10 h-10 rounded-xl ${color.light} flex items-center justify-center ${color.text} mb-2`}>
                        {getCatIcon(cat.slug)}
                      </div>
                      <p className="font-semibold text-sm">{cat.name}</p>
                      <p className="text-gray-400 text-xs mt-1">{cat.exams.length} exams</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Popular Exams */}
          <div>
            <h2 className="font-bold text-lg mb-3">Popular Exams</h2>
            <div className="space-y-2">
              {categories.slice(0, 3).flatMap(cat =>
                cat.exams.slice(0, 2).map(exam => (
                  <Card
                    key={exam.id}
                    className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openExam(exam, cat)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${getCatColor(cat.slug).light} flex items-center justify-center ${getCatColor(cat.slug).text}`}>
                        {getCatIcon(cat.slug)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{exam.name}</p>
                        <p className="text-gray-400 text-xs">{exam.testCount} tests · {exam.totalQuestions} Qs</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Daily Tips Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-lg">Daily Tips</h2>
            </div>
            <Card className="border-0 shadow-sm border-l-4 border-l-orange-400">
              <CardContent className="p-4">
                <p className="text-sm text-gray-700 leading-relaxed">💡 <strong>Pro Tip:</strong> Solve at least 50 questions daily from different topics. Consistency beats intensity in exam preparation!</p>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Exams Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-lg">Upcoming Exams</h2>
            </div>
            <div className="space-y-2">
              {[
                { name: 'SSC CGL 2025 Tier-I', date: 'Jul 2025', status: 'Registration Open' },
                { name: 'IBPS PO 2025 Prelims', date: 'Aug 2025', status: 'Coming Soon' },
                { name: 'RRB NTPC CBT-2', date: 'Sep 2025', status: 'Admit Card Soon' },
              ].map((exam, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{exam.name}</p>
                      <p className="text-gray-400 text-xs">{exam.date}</p>
                    </div>
                    <Badge variant={exam.status === 'Registration Open' ? 'default' : 'secondary'} className={`text-[10px] ${
                      exam.status === 'Registration Open' ? 'bg-green-100 text-green-700' :
                      exam.status === 'Admit Card Soon' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {exam.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Study Stats / Motivation */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h2 className="font-bold text-lg">Your Progress</h2>
            </div>
            {auth.isLoggedIn ? (
              <div className="grid grid-cols-3 gap-2">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                    <p className="font-bold text-lg">{stats.testsTaken}</p>
                    <p className="text-gray-400 text-[10px]">Tests Done</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <Target className="w-6 h-6 text-green-500 mx-auto mb-1" />
                    <p className="font-bold text-lg">{stats.avgScore}%</p>
                    <p className="text-gray-400 text-[10px]">Accuracy</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <Award className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                    <p className="font-bold text-lg">#{stats.bestRank}</p>
                    <p className="text-gray-400 text-[10px]">Best Rank</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-red-50">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="font-semibold text-sm text-gray-700">Login to track your progress</p>
                  <p className="text-gray-500 text-xs mt-1 mb-3">See your scores, ranks and improvement over time</p>
                  <Button size="sm" className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl" onClick={() => setShowLoginModal(true)}>
                    Login Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ===== RENDER: Exams Page =====
  function renderExams() {
    return (
      <div className="pb-20">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 pt-[calc(env(safe-area-inset-top,0px)+3rem)] pb-6 rounded-b-3xl">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={goBack} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white text-xl font-bold">All Exams</h1>
          </div>
        </div>

        <div className="px-4 mt-4 space-y-6">
          {categories.map(cat => {
            const color = getCatColor(cat.slug)
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${color.light} flex items-center justify-center ${color.text}`}>
                    {getCatIcon(cat.slug)}
                  </div>
                  <h2 className="font-bold text-base">{cat.name}</h2>
                  <Badge variant="secondary" className="text-xs">{cat.exams.length}</Badge>
                </div>
                <div className="space-y-2">
                  {cat.exams.map(exam => (
                    <Card
                      key={exam.id}
                      className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openExam(exam, cat)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{exam.name}</p>
                          <p className="text-gray-400 text-xs">{exam.testCount} tests · {exam.totalQuestions} Qs · {exam.duration} min</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge className={`bg-gradient-to-r ${color.gradient} text-white text-xs border-0`}>
                            {exam.testCount} Tests
                          </Badge>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ===== RENDER: Tests Page =====
  function renderTests() {
    if (!selectedExam || !selectedCategory) return null
    const color = getCatColor(selectedCategory.slug)
    return (
      <div className="pb-20">
        <div className={`bg-gradient-to-r ${color.gradient} px-4 pt-[calc(env(safe-area-inset-top,0px)+3rem)] pb-6 rounded-b-3xl`}>
          <div className="flex items-center gap-3 mb-2">
            <button onClick={goBack} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-white text-lg font-bold truncate">{selectedExam.name}</h1>
              <p className="text-white/70 text-xs">{selectedCategory.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1 text-white/80 text-xs">
              <BookOpen className="w-3 h-3" /> {selectedExam.totalQuestions} Qs
            </div>
            <div className="flex items-center gap-1 text-white/80 text-xs">
              <Clock className="w-3 h-3" /> {selectedExam.duration} min
            </div>
            <div className="flex items-center gap-1 text-white/80 text-xs">
              <FileText className="w-3 h-3" /> {examTests.length} tests
            </div>
          </div>
        </div>

        <div className="px-4 mt-4">
          <h2 className="font-bold text-base mb-3">Available Tests</h2>
          <div className="space-y-3">
            {examTests.map(test => (
              <Card key={test.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="font-semibold text-sm">{test.title}</p>
                      <p className="text-gray-400 text-xs mt-1">{test.description}</p>
                    </div>
                    {test.isFree && <Badge className="bg-emerald-100 text-emerald-700 text-xs border-0">FREE</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {test.totalQuestions} Qs</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {test.duration} min</span>
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {test.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      className={`bg-gradient-to-r ${color.gradient} text-white rounded-xl flex-1`}
                      onClick={() => openTestInfo(test)}
                    >
                      <Play className="w-4 h-4 mr-1" /> Start Test
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => openLeaderboard(test.id)}
                    >
                      <Trophy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ===== RENDER: Test Info Page =====
  function renderTestInfo() {
    if (!selectedTest) return null
    const cat = selectedCategory || categories[0]
    const color = getCatColor(cat.slug)

    return (
      <div className="pb-24">
        <div className={`bg-gradient-to-r ${color.gradient} px-4 pt-[calc(env(safe-area-inset-top,0px)+3rem)] pb-6 rounded-b-3xl`}>
          <div className="flex items-center gap-3 mb-3">
            <button onClick={goBack} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white text-lg font-bold flex-1 truncate">Test Details</h1>
          </div>
          <h2 className="text-white font-semibold">{selectedTest.title}</h2>
          <p className="text-white/70 text-sm mt-1">{selectedTest.exam.name}</p>
        </div>

        <div className="px-4 mt-4 space-y-4">
          {/* Marking Scheme */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base">Test Information</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Questions</span>
                <span className="font-semibold">{selectedTest.totalQuestions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="font-semibold">{selectedTest.duration} minutes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Difficulty</span>
                <Badge variant="secondary">{selectedTest.difficulty}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Correct Answer</span>
                <span className="font-semibold text-emerald-600">+{selectedTest.markingCorrect} marks</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Wrong Answer</span>
                <span className="font-semibold text-red-600">{selectedTest.markingWrong} marks</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Skipped</span>
                <span className="font-semibold text-gray-400">{selectedTest.markingSkipped} marks</span>
              </div>
            </CardContent>
          </Card>

          {/* Max Score */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Maximum Score</p>
                <p className="font-bold text-lg">{selectedTest.totalQuestions * selectedTest.markingCorrect} marks</p>
              </div>
            </CardContent>
          </Card>

          {/* Start Button */}
          <Button
            className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl text-base font-semibold"
            onClick={() => startTest(selectedTest)}
          >
            <Play className="w-5 h-5 mr-2" /> Start Test Now
          </Button>
        </div>
      </div>
    )
  }

  // ===== RENDER: Test Taking =====
  function renderTestTaking() {
    if (!selectedTest) return null
    const questions = selectedTest.questions
    const question = questions[currentQuestionIndex]
    if (!question) return null

    const totalAnswered = Object.keys(answers).length
    const totalMarked = markedForReview.size
    const progressPercent = (totalAnswered / questions.length) * 100

    const optionLabels: Record<string, string> = { A: question.optionA, B: question.optionB, C: question.optionC, D: question.optionD }
    const optionLetters = ['A', 'B', 'C', 'D']

    return (
      <div className="min-h-screen min-h-dvh bg-gray-50 flex flex-col">
        {/* Test Header */}
        <div className="bg-white border-b px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowBackConfirm(true)}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1 text-orange-600 font-bold">
              <Timer className="w-4 h-4" />
              <span className={timeLeft < 60 ? 'text-red-600' : ''}>{formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={() => setShowQuestionNav(true)}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
            >
              <BookMarked className="w-5 h-5" />
            </button>
          </div>
          <Progress value={progressPercent} className="mt-2 h-1.5" />
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>Q {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{totalAnswered} answered · {totalMarked} marked</span>
          </div>
        </div>

        {/* Question */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              {question.subject && (
                <Badge variant="secondary" className="mb-3 text-xs">{question.subject}</Badge>
              )}
              {markedForReview.has(question.id) && (
                <Badge className="mb-3 ml-2 bg-amber-100 text-amber-700 text-xs border-0">
                  <BookMarked className="w-3 h-3 mr-1" /> Marked for Review
                </Badge>
              )}
              <p className="text-sm font-medium leading-relaxed mt-2">{question.questionText}</p>
            </div>

            {/* Options */}
            <div className="space-y-3 mt-4">
              {optionLetters.map(letter => {
                const isSelected = answers[question.id] === letter
                return (
                  <button
                    key={letter}
                    onClick={() => selectAnswer(question.id, letter)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isSelected ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {letter}
                      </span>
                      <span className="text-sm pt-0.5">{optionLabels[letter]}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="bg-white border-t px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl flex-1"
              onClick={() => toggleReview(question.id)}
            >
              <BookMarked className="w-4 h-4 mr-1" />
              {markedForReview.has(question.id) ? 'Unmark' : 'Mark'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl flex-1"
              onClick={() => clearAnswer(question.id)}
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl flex-1"
              onClick={() => {
                if (currentQuestionIndex < questions.length - 1) {
                  setCurrentQuestionIndex(prev => prev + 1)
                }
              }}
            >
              <SkipForward className="w-4 h-4 mr-1" /> Skip
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              className="rounded-xl flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white"
              onClick={handleFinishTest}
            >
              Submit Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={currentQuestionIndex === questions.length - 1}
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Question Navigation Panel */}
        {showQuestionNav && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowQuestionNav(false)}>
            <div className="bg-white rounded-t-3xl w-full max-h-[70vh] p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Question Navigator</h3>
                <button onClick={() => setShowQuestionNav(false)} className="text-gray-400 text-2xl">&times;</button>
              </div>
              <div className="flex items-center gap-4 mb-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500" /> Answered</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-200" /> Unanswered</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400" /> Marked</span>
              </div>
              <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto">
                {questions.map((q, i) => {
                  const isAnswered = !!answers[q.id]
                  const isMarked = markedForReview.has(q.id)
                  const isCurrent = i === currentQuestionIndex
                  let bgClass = 'bg-gray-200 text-gray-600'
                  if (isCurrent) bgClass = 'ring-2 ring-orange-500 bg-white'
                  if (isAnswered) bgClass = 'bg-orange-500 text-white'
                  if (isMarked && !isAnswered) bgClass = 'bg-amber-400 text-white'
                  if (isMarked && isAnswered) bgClass = 'bg-orange-500 text-white ring-2 ring-amber-400'

                  return (
                    <button
                      key={q.id}
                      onClick={() => { setCurrentQuestionIndex(i); setShowQuestionNav(false) }}
                      className={`w-full aspect-square rounded-xl flex items-center justify-center font-bold text-sm ${bgClass}`}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
              <Button
                className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl"
                onClick={handleFinishTest}
              >
                Submit Test
              </Button>
            </div>
          </div>
        )}

        {/* Back Confirmation - Professional Dialog */}
        {showBackConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-scale-in">
              <div className="p-6 pb-4 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">Leave Test?</h3>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                  Your progress will be lost if you leave now. All answered questions will not be saved.
                </p>
              </div>
              <div className="px-6 pb-6 space-y-2.5">
                <Button
                  className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold text-sm"
                  onClick={() => setShowBackConfirm(false)}
                >
                  No, Continue Test
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-semibold text-sm"
                  onClick={() => {
                    setShowBackConfirm(false)
                    if (timerRef.current) clearInterval(timerRef.current)
                    setTestActive(false)
                    goBack()
                  }}
                >
                  Yes, Leave Test
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ===== RENDER: Results Page =====
  function renderResults() {
    if (!lastResult || !selectedTest) return null
    const percentage = Math.round((lastResult.score / lastResult.maxScore) * 100)
    const questions = selectedTest.questions

    return (
      <div className="pb-20">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 pt-[calc(env(safe-area-inset-top,0px)+3rem)] pb-8 rounded-b-3xl text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            {percentage >= 60 ? (
              <Trophy className="w-10 h-10 text-yellow-300" />
            ) : percentage >= 30 ? (
              <Target className="w-10 h-10 text-white" />
            ) : (
              <BookOpen className="w-10 h-10 text-white" />
            )}
          </div>
          <h1 className="text-white text-2xl font-bold">
            {percentage >= 60 ? 'Great Job!' : percentage >= 30 ? 'Keep Practicing!' : 'Keep Going!'}
          </h1>
          <p className="text-white/70 text-sm mt-1">{selectedTest.title}</p>
        </div>

        <div className="px-4 -mt-4 space-y-4">
          {/* Score Card */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-orange-600">{lastResult.score}<span className="text-lg text-gray-400">/{lastResult.maxScore}</span></div>
              <Progress value={Math.max(0, percentage)} className="mt-3 h-2" />
              <p className="text-gray-500 text-sm mt-2">{percentage}% Score</p>
            </CardContent>
          </Card>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="font-bold text-lg text-emerald-600 mt-1">{lastResult.correctCount}</p>
                <p className="text-gray-400 text-xs">Correct</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <XCircle className="w-6 h-6 text-red-500 mx-auto" />
                <p className="font-bold text-lg text-red-600 mt-1">{lastResult.wrongCount}</p>
                <p className="text-gray-400 text-xs">Wrong</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <SkipForward className="w-6 h-6 text-gray-400 mx-auto" />
                <p className="font-bold text-lg text-gray-500 mt-1">{lastResult.skippedCount}</p>
                <p className="text-gray-400 text-xs">Skipped</p>
              </CardContent>
            </Card>
          </div>

          {/* Time Taken */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-gray-500 text-sm">Time Taken</span>
              <span className="font-bold ml-auto">{formatTime(lastResult.timeTaken)}</span>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => openLeaderboard(lastResult.testId)}
            >
              <Trophy className="w-4 h-4 mr-2" /> Leaderboard
            </Button>
            <Button
              className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white"
              onClick={() => {
                if (selectedTest) startTest(selectedTest)
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>

          {/* Answer Key */}
          <div>
            <h2 className="font-bold text-lg mb-3">Answer Key</h2>
            <div className="space-y-3">
              {questions.map((q, i) => {
                const userAnswer = lastResult.answers[q.id]
                const isCorrect = userAnswer === q.correctAnswer
                const isSkipped = !userAnswer

                return (
                  <Card key={q.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isCorrect ? 'bg-emerald-100 text-emerald-700' :
                          isSkipped ? 'bg-gray-100 text-gray-500' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {isCorrect ? <CheckCircle2 className="w-4 h-4" /> :
                           isSkipped ? <SkipForward className="w-4 h-4" /> :
                           <XCircle className="w-4 h-4" />}
                        </span>
                        <p className="text-sm font-medium">{i + 1}. {q.questionText}</p>
                      </div>

                      <div className="ml-8 space-y-1 text-xs">
                        {['A', 'B', 'C', 'D'].map(letter => {
                          const isUserAnswer = userAnswer === letter
                          const isCorrectOption = q.correctAnswer === letter
                          let optionClass = 'text-gray-500'
                          if (isCorrectOption) optionClass = 'text-emerald-600 font-semibold'
                          if (isUserAnswer && !isCorrect) optionClass = 'text-red-600 line-through'
                          if (isUserAnswer && isCorrect) optionClass = 'text-emerald-600 font-semibold'

                          const optionText = letter === 'A' ? q.optionA : letter === 'B' ? q.optionB : letter === 'C' ? q.optionC : q.optionD
                          return (
                            <p key={letter} className={optionClass}>
                              {letter}. {optionText}
                              {isUserAnswer && ' (Your Answer)'}
                              {isCorrectOption && ' ✓'}
                            </p>
                          )
                        })}
                      </div>

                      {q.explanation && (
                        <div className="ml-8 mt-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                          💡 {q.explanation}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          <Button
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white"
            onClick={() => { pageHistoryRef.current = []; setCurrentPage('home') }}
          >
            <Home className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </div>
      </div>
    )
  }

  // ===== RENDER: Leaderboard =====
  function renderLeaderboard() {
    return (
      <div className="pb-20">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 pt-[calc(env(safe-area-inset-top,0px)+3rem)] pb-6 rounded-b-3xl">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <Trophy className="w-6 h-6 text-yellow-300" />
            <h1 className="text-white text-xl font-bold">Leaderboard</h1>
          </div>
        </div>

        <div className="px-4 mt-4">
          {leaderboardData.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-400">No results yet</p>
                <p className="text-gray-400 text-sm mt-1">Be the first to take this test!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {leaderboardData.map((result, index) => {
                const percentage = Math.round((result.score / result.maxScore) * 100)
                const medals = ['🥇', '🥈', '🥉']
                return (
                  <Card key={result.id} className={`border-0 shadow-sm ${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}`}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <span className="w-8 text-center font-bold text-lg">
                        {index < 3 ? medals[index] : `${index + 1}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{result.testName}</p>
                        <p className="text-gray-400 text-xs">{formatTime(result.timeTaken)} · {result.createdAt ? new Date(result.createdAt).toLocaleDateString() : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">{result.score}/{result.maxScore}</p>
                        <p className="text-gray-400 text-xs">{percentage}%</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ===== RENDER: Practice Page =====
  function renderPractice() {
    return (
      <div className="pb-20">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 pt-[calc(env(safe-area-inset-top,0px)+3rem)] pb-6 rounded-b-3xl">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={goBack} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-white text-xl font-bold">Practice</h1>
              <p className="text-orange-100 text-xs">Topic-wise practice sessions</p>
            </div>
          </div>
        </div>

        <div className="px-4 mt-4 space-y-4">
          {/* Practice Mode Selection */}
          <div>
            <h2 className="font-bold text-lg mb-3">Choose Practice Mode</h2>
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                const allCats = categories
                const allExams = allCats.flatMap(c => c.exams)
                if (allExams.length > 0) {
                  const randomExam = allExams[Math.floor(Math.random() * allExams.length)]
                  const randomCat = allCats.find(c => c.exams.some(e => e.id === randomExam.id))!
                  openExam(randomExam, randomCat)
                }
              }}>
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-6 h-6 text-orange-500" />
                  </div>
                  <p className="font-semibold text-sm">Quick Practice</p>
                  <p className="text-gray-400 text-[11px] mt-1">Random questions</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
                    <Target className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="font-semibold text-sm">Topic Wise</p>
                  <p className="text-gray-400 text-[11px] mt-1">Pick a subject</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-2">
                    <BookMarked className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="font-semibold text-sm">Bookmarked</p>
                  <p className="text-gray-400 text-[11px] mt-1">Saved questions</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-2">
                    <PenTool className="w-6 h-6 text-purple-500" />
                  </div>
                  <p className="font-semibold text-sm">Weak Areas</p>
                  <p className="text-gray-400 text-[11px] mt-1">Improve scores</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Practice by Category */}
          <div>
            <h2 className="font-bold text-lg mb-3">Practice by Category</h2>
            <div className="space-y-2">
              {categories.map(cat => {
                const color = getCatColor(cat.slug)
                const totalQs = cat.exams.reduce((sum, e) => sum + e.totalQuestions, 0)
                return (
                  <Card
                    key={cat.id}
                    className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedCategory(cat)
                      handleBottomNav('exams')
                    }}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${color.light} flex items-center justify-center ${color.text}`}>
                        {getCatIcon(cat.slug)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{cat.name}</p>
                        <p className="text-gray-400 text-xs">{cat.exams.length} exams · {totalQs} questions</p>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-xl text-orange-600 border-orange-200 text-xs">
                        Start
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Previous Practice Sessions */}
          <div>
            <h2 className="font-bold text-lg mb-3">Recent Practice</h2>
            {auth.isLoggedIn ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Your practice history will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-red-50">
                <CardContent className="p-4 text-center">
                  <PenTool className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="font-semibold text-sm text-gray-700">Login to save practice history</p>
                  <Button size="sm" className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl mt-2" onClick={() => setShowLoginModal(true)}>
                    Login Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ===== RENDER: Profile Page =====
  function renderProfile() {
    const stats = getUserStats()
    const userDisplay = auth.getUserDisplay()
    const userEmail = auth.getUserEmail()
    const isEmailUser = !auth.isGuest && auth.isLoggedIn

    return (
      <div className="pb-20">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 pt-[calc(env(safe-area-inset-top,0px)+3rem)] pb-10 rounded-b-[28px] relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/4" />

          {/* Top bar */}
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h1 className="text-white text-xl font-bold">My Profile</h1>
            <button
              onClick={() => setShowAboutSheet(true)}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center"
            >
              <Settings className="w-4 h-4 text-white/70" />
            </button>
          </div>

          {/* Profile Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <span className="text-white font-bold text-xl">{getAvatarDisplay()}</span>
                </div>
                {isEmailUser && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-slate-900">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-lg truncate">
                  {isEmailUser ? (userDisplay || userEmail) : 'Guest User'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {isEmailUser ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                      <Shield className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" /> Guest Mode
                    </span>
                  )}
                </div>
              </div>
              {auth.isLoggedIn && !auth.isGuest && (
                <button
                  onClick={() => auth.logout()}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <LogOut className="w-4 h-4 text-white/60" />
                </button>
              )}
            </div>

            {/* Stats Row */}
            <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-white font-bold text-xl">{stats.testsTaken}</p>
                <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Tests</p>
              </div>
              <div className="text-center border-x border-white/10">
                <p className="text-white font-bold text-xl">{stats.avgScore}%</p>
                <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Avg Score</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-xl">#{stats.bestRank}</p>
                <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Best Rank</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-5 space-y-4 relative z-20">
          {/* Guest Upgrade Banner */}
          {auth.isGuest && (
            <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-500 to-orange-500 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">Upgrade to Phone Login</p>
                    <p className="text-white/80 text-xs mt-0.5">Save progress & access from any device</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-white text-orange-600 hover:bg-white/90 rounded-xl font-bold px-3"
                    onClick={() => setShowLoginModal(true)}
                  >
                    <Mail className="w-3 h-3 mr-1" /> Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Not logged in - Login Card */}
          {!auth.isLoggedIn && (
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-5">
                <div className="text-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-3">
                    <User className="w-7 h-7 text-orange-500" />
                  </div>
                  <p className="font-bold text-base">Login to unlock all features</p>
                  <p className="text-gray-400 text-xs mt-1">Track progress, compete & save data</p>
                </div>
                <Button
                  className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold"
                  onClick={() => setShowLoginModal(true)}
                >
                  <Mail className="w-4 h-4 mr-2" /> Login with Email
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card
              className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
              onClick={() => { pageHistoryRef.current.push(currentPage); setCurrentPage('exams') }}
            >
              <CardContent className="p-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <p className="font-semibold text-sm">My Exams</p>
                <p className="text-gray-400 text-[10px] mt-0.5">{categories.length} categories</p>
              </CardContent>
            </Card>
            <Card
              className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
              onClick={() => { pageHistoryRef.current.push(currentPage); setCurrentPage('leaderboard') }}
            >
              <CardContent className="p-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <p className="font-semibold text-sm">Leaderboard</p>
                <p className="text-gray-400 text-[10px] mt-0.5">View rankings</p>
              </CardContent>
            </Card>
          </div>

          {/* Settings Section */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">Settings</p>
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {/* Language */}
                <button
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50/80 transition-colors active:bg-gray-100"
                  onClick={() => setShowLanguageSheet(true)}
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[13px]">Language</p>
                    <p className="text-gray-400 text-[11px]">{selectedLanguage === 'en' ? 'English' : selectedLanguage === 'hi' ? 'Hindi' : 'Bengali'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
                <div className="mx-4 border-t border-gray-100" />
                {/* About */}
                <button
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50/80 transition-colors active:bg-gray-100"
                  onClick={() => setShowAboutSheet(true)}
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[13px]">About</p>
                    <p className="text-gray-400 text-[11px]">App info & details</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Support Section */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">Support</p>
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <button
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50/80 transition-colors active:bg-gray-100"
                  onClick={() => setShowAboutSheet(true)}
                >
                  <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[13px]">Help & FAQ</p>
                    <p className="text-gray-400 text-[11px]">Get answers to common questions</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
                <div className="mx-4 border-t border-gray-100" />
                <button
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50/80 transition-colors active:bg-gray-100"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'ExamPrep Bharat', text: 'Prepare for government exams!', url: window.location.href })
                    }
                  }}
                >
                  <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-pink-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[13px]">Share App</p>
                    <p className="text-gray-400 text-[11px]">Tell your friends about us</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Logout Button */}
          {auth.isLoggedIn && !auth.isGuest && (
            <Button
              variant="outline"
              className="w-full rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 h-11 font-semibold"
              onClick={() => auth.logout()}
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          )}

          {/* App Version */}
          <p className="text-center text-gray-300 text-[10px] pt-2 pb-4">ExamPrep Bharat v1.0</p>
        </div>

        {/* Language Sheet */}
        {showLanguageSheet && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => setShowLanguageSheet(false)}>
            <div className="bg-white rounded-t-[28px] w-full p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
              <h3 className="font-bold text-lg mb-4">Select Language</h3>
              <div className="space-y-1">
                {[
                  { code: 'en', name: 'English', flag: '🇬🇧', available: true },
                  { code: 'hi', name: 'हिंदी (Hindi)', flag: '🇮🇳', available: false },
                  { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇮🇳', available: false },
                ].map(lang => (
                  <button
                    key={lang.code}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${
                      lang.available ? 'hover:bg-gray-50 active:bg-gray-100' : 'opacity-50'
                    }`}
                    onClick={() => {
                      if (lang.available) {
                        setSelectedLanguage(lang.code)
                        setShowLanguageSheet(false)
                      }
                    }}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="font-medium text-sm flex-1">{lang.name}</span>
                    {!lang.available && <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>}
                    {selectedLanguage === lang.code && (
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full mt-5 rounded-xl h-11"
                onClick={() => setShowLanguageSheet(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* About Sheet */}
        {showAboutSheet && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => setShowAboutSheet(false)}>
            <div className="bg-white rounded-t-[28px] w-full p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
              <div className="text-center mb-5">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/20">
                  <span className="text-white text-2xl font-bold">E</span>
                </div>
                <h3 className="font-bold text-lg">ExamPrep Bharat</h3>
                <p className="text-gray-400 text-sm">Version 1.0</p>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Version', value: '1.0' },
                  { label: 'Size', value: '~5 MB' },
                  { label: 'Exams', value: '21+' },
                  { label: 'Questions', value: '210+' },
                  { label: 'Offline', value: 'Yes', green: true },
                  { label: 'Ads', value: 'No', green: true },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-sm p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-500">{item.label}</span>
                    <span className={`font-medium ${item.green ? 'text-emerald-600' : ''}`}>{item.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-gray-400 mt-5">Made with ❤️ in India</p>
              <Button
                variant="outline"
                className="w-full mt-4 rounded-xl h-11"
                onClick={() => setShowAboutSheet(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ===== RENDER: Bottom Navigation =====
  function renderBottomNav() {
    const pages: Page[] = ['home', 'practice', 'tests', 'leaderboard']
    if (!pages.includes(currentPage)) return null

    const navItems = [
      { page: 'home' as Page, icon: Home, label: 'Home' },
      { page: 'practice' as Page, icon: Zap, label: 'Practice' },
      { page: 'tests' as Page, icon: ClipboardList, label: 'Tests' },
      { page: 'leaderboard' as Page, icon: Trophy, label: 'Ranks' },
    ]

    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 safe-area-pb" style={{ touchAction: 'manipulation' }}>
        <div className="bg-white/95 backdrop-blur-lg border-t border-gray-100 w-full">
          <div className="flex items-center justify-around py-2">
            {navItems.map(item => {
              const isActive = currentPage === item.page
              const Icon = item.icon
              return (
                <button
                  key={item.page}
                  onClick={() => handleBottomNav(item.page)}
                  onTouchEnd={(e) => { e.preventDefault(); handleBottomNav(item.page) }}
                  className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition-all ${
                    isActive ? 'text-orange-600' : 'text-gray-400 active:text-gray-600'
                  }`}
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className={`relative ${isActive ? '' : ''}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-orange-600' : ''}`} />
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500" />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? 'text-orange-600' : ''}`}>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ===== MAIN RENDER =====
  const renderPage = () => {
    switch (currentPage) {
      case 'home': return renderHome()
      case 'exams': return renderExams()
      case 'tests': return renderTests()
      case 'test-info': return renderTestInfo()
      case 'test-taking': return renderTestTaking()
      case 'results': return renderResults()
      case 'leaderboard': return renderLeaderboard()
      case 'profile': return renderProfile()
      case 'practice': return renderPractice()
      default: return renderHome()
    }
  }

  return (
    <div className="min-h-screen min-h-dvh bg-gray-50 relative w-full overflow-x-hidden" style={{ touchAction: 'manipulation' }}>
      {renderPage()}
      {renderBottomNav()}

      {/* ===== Side Menu Drawer ===== */}
      {showSideMenu && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSideMenu(false)}
            onTouchEnd={(e) => { e.preventDefault(); setShowSideMenu(false) }}
            style={{ touchAction: 'manipulation' }}
          />
          {/* Drawer Panel */}
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col" style={{ touchAction: 'manipulation' }}>
            {/* Drawer Header */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <button
                  onClick={() => setShowSideMenu(false)}
                  onTouchEnd={(e) => { e.preventDefault(); setShowSideMenu(false) }}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <p className="text-white font-bold text-base">ExamPrep Bharat</p>
              <p className="text-white/40 text-xs mt-0.5">Your exam preparation partner</p>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-2">
              {/* Main Navigation */}
              <div className="px-3 py-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">Navigation</p>
                {[
                  { icon: Home, label: 'Home', page: 'home' as Page, active: currentPage === 'home' },
                  { icon: BookOpen, label: 'All Exams', page: 'exams' as Page, active: currentPage === 'exams' },
                  { icon: Trophy, label: 'Leaderboard', page: 'leaderboard' as Page, active: currentPage === 'leaderboard' },
                  { icon: User, label: 'My Profile', page: 'profile' as Page, active: currentPage === 'profile' },
                ].map(item => (
                  <button
                    key={item.page}
                    onClick={() => { handleBottomNav(item.page); setShowSideMenu(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                      item.active ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${item.active ? 'text-orange-500' : 'text-gray-400'}`} />
                    <span className={`font-medium text-sm ${item.active ? 'font-semibold' : ''}`}>{item.label}</span>
                    {item.active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />}
                  </button>
                ))}
              </div>

              <div className="mx-5 border-t border-gray-100 my-1" />

              {/* Quick Actions */}
              <div className="px-3 py-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">Quick Actions</p>
                {[
                  { icon: Zap, label: 'Quick Practice', action: () => {
                    const allCats = categories
                    const allExams = allCats.flatMap(c => c.exams)
                    if (allExams.length > 0) {
                      const randomExam = allExams[Math.floor(Math.random() * allExams.length)]
                      const randomCat = allCats.find(c => c.exams.some(e => e.id === randomExam.id))!
                      openExam(randomExam, randomCat)
                    }
                  }},
                  { icon: BookmarkPlus, label: 'Bookmarked Questions', action: () => {} },
                  { icon: Download, label: 'Offline Tests', action: () => {} },
                  { icon: BarChart3, label: 'Performance Report', action: () => {} },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { item.action(); setShowSideMenu(false) }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <item.icon className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-sm">{item.label}</span>
                    {['BookmarkPlus', 'Download', 'BarChart3'].includes(item.label) && (
                      <Badge variant="secondary" className="text-[9px] ml-auto">Soon</Badge>
                    )}
                  </button>
                ))}
              </div>

              <div className="mx-5 border-t border-gray-100 my-1" />

              {/* Settings & Support */}
              <div className="px-3 py-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">Settings</p>
                {[
                  { icon: BookOpen, label: 'Language', sub: selectedLanguage === 'en' ? 'English' : selectedLanguage === 'hi' ? 'Hindi' : 'Bengali', action: () => setShowLanguageSheet(true) },
                  { icon: Bell, label: 'Notifications', sub: unreadCount > 0 ? `${unreadCount} unread` : 'Manage alerts', action: () => { setShowSideMenu(false); setCurrentPage('home'); setTimeout(() => setShowNotificationPanel(true), 300) } },
                  { icon: Wifi, label: 'Offline Mode', sub: 'Download tests', action: () => {} },
                  { icon: HelpCircle, label: 'Help & FAQ', sub: 'Get support', action: () => setShowAboutSheet(true) },
                  { icon: Share2, label: 'Share App', sub: 'Tell your friends', action: () => {
                    if (navigator.share) {
                      navigator.share({ title: 'ExamPrep Bharat', text: 'Prepare for government exams!', url: window.location.href })
                    }
                  }},
                  { icon: Shield, label: 'About', sub: 'Version 1.0', action: () => setShowAboutSheet(true) },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { item.action(); setShowSideMenu(false) }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <item.icon className="w-5 h-5 text-gray-400" />
                    <div className="flex-1 text-left">
                      <span className="font-medium text-sm block">{item.label}</span>
                      {item.sub && <span className="text-gray-400 text-[11px]">{item.sub}</span>}
                    </div>
                    {item.label === 'Notifications' && unreadCount > 0 ? (
                      <span className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">{unreadCount}</span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-gray-100 px-5 py-4">
              {auth.isLoggedIn ? (
                <button
                  onClick={() => { auth.logout(); setShowSideMenu(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium text-sm">Logout</span>
                </button>
              ) : (
                <button
                  onClick={() => { setShowLoginModal(true); setShowSideMenu(false) }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold text-sm"
                >
                  <Mail className="w-4 h-4" /> Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          error={auth.error}
          loginLoading={auth.loginLoading}
          signupLoading={auth.signupLoading}
          guestLoading={auth.guestLoading}
          onLogin={auth.loginWithEmail}
          onSignUp={auth.signUpWithEmail}
          onGuestLogin={auth.loginAsGuest}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  )
}

// Missing icon helper
function FileText(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  )
}
