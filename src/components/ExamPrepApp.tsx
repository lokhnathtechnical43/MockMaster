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
  HelpCircle, Share2, MessageCircle, Crown, Lightbulb, ExternalLink,
  Menu, BookmarkPlus, Download, BarChart3, Wifi,
  ClipboardList, PenTool
} from 'lucide-react'
import {
  getCategories as getLocalCategories, getTestsByExam as getLocalTestsByExam,
  getTestById as getLocalTestById, saveResult as saveLocalResult,
  getLeaderboard as getLocalLeaderboard, getResults as getLocalResults,
  type LocalExamCategory, type LocalExam, type LocalTest, type LocalQuestion, type TestResult
} from '@/lib/local-data'
import {
  getCategories as getFsCategories, getTests as getFsTests,
  getTestById as getFsTestById, saveResult as saveFsResult,
  getLeaderboard as getFsLeaderboard, getUseFirestore,
  getAnnouncements as getFsAnnouncements, getNotifications as getFsNotifications,
  getDailyTips as getFsDailyTips,
  getResults as getFsResults,
} from '@/lib/firestore-service'
import { useFirebaseAuth } from '@/lib/use-firebase-auth'
import LoginModal from '@/components/LoginModal'
import { App } from '@capacitor/app'
import { getAnnouncements as getLocalAnnouncements, getNotifications as getLocalNotifications, getDailyTips as getLocalDailyTips, type DailyTip } from '@/lib/admin-data'
import { t, type Lang } from '@/lib/i18n'

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
  const [selectedLanguage, setSelectedLanguage] = useState<Lang>('en')
  const [showQuestionNav, setShowQuestionNav] = useState(false)
  const [showSideMenu, setShowSideMenu] = useState(false)
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)

  // i18n shorthand
  const lng = selectedLanguage
  const _t = (key: string) => t(key, lng)

  // --- Notifications (loaded from shared admin storage) ---
  const [notifications, setNotifications] = useState<
    { id: string; title: string; message: string; time: string; read: boolean; type: 'update' | 'alert' | 'info'; link?: string }[]
  >([])
  const unreadCount = notifications.filter(n => !n.read).length
  const [selectedNotification, setSelectedNotification] = useState<{
    id: string; title: string; message: string; time: string; type: 'update' | 'alert' | 'info'; link?: string
  } | null>(null)

  // --- Daily Tips (loaded from shared admin storage) ---
  const [dailyTips, setDailyTips] = useState<DailyTip[]>([])
  const [selectedTip, setSelectedTip] = useState<DailyTip | null>(null)

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
          const tips = await getFsDailyTips()
          setDailyTips(tips)
        } else {
          setAnnouncements(getLocalAnnouncements().map(a => ({ ...a, action: a.action as Page })))
          setNotifications(getLocalNotifications())
          setDailyTips(getLocalDailyTips())
        }
      } catch (e) {
        console.error('Data load failed, using local fallback:', e)
        setCategories(getLocalCategories())
        setAnnouncements(getLocalAnnouncements().map(a => ({ ...a, action: a.action as Page })))
        setNotifications(getLocalNotifications())
        setDailyTips(getLocalDailyTips())
      }
    }
    loadData()
  }, [])

  // --- Listen for admin data changes (poll Firestore for updates) ---
  useEffect(() => {
    const refreshAdminData = async () => {
      try {
        if (isFirestore()) {
          const anns = await getFsAnnouncements()
          setAnnouncements(anns.map(a => ({ ...a, action: a.action as Page })))
          const notifs = await getFsNotifications()
          setNotifications(notifs)
        } else {
          setAnnouncements(getLocalAnnouncements().map(a => ({ ...a, action: a.action as Page })))
          setNotifications(getLocalNotifications())
        }
      } catch {}
    }
    // Refresh from Firestore every 10 seconds so admin changes show up
    const interval = setInterval(refreshAdminData, 10000)
    // Also listen for localStorage changes (same-browser admin)
    const handleStorageChange = () => {
      if (!isFirestore()) {
        setAnnouncements(getLocalAnnouncements().map(a => ({ ...a, action: a.action as Page })))
        setNotifications(getLocalNotifications())
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
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
                <h1 className="text-white text-base font-bold leading-tight">{_t('app.name')}</h1>
                <p className="text-orange-100 text-[10px] leading-tight">{_t('app.subtitle')}</p>
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
                  <h3 className="font-bold text-sm text-gray-800">{_t('home.notifications')}</h3>
                  {unreadCount > 0 && (
                    <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0">{unreadCount} {_t('home.newNotifs')}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      className="text-[11px] text-orange-500 font-semibold hover:text-orange-600"
                    >
                      {_t('home.markAllRead')}
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
                    <p className="text-gray-400 text-sm">{_t('home.noNotifs')}</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      onClick={() => {
                        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n))
                        setSelectedNotification(notification)
                      }}
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
                            <span className="text-white/50 text-[10px]">{_t('home.tapExplore')}</span>
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
                  <p className="font-semibold text-sm">{_t('home.quickPractice')}</p>
                  <p className="text-gray-500 text-xs">{_t('home.quickPracticeSub')}</p>
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
                  <Play className="w-4 h-4 mr-1" /> {_t('home.start')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Exam Categories */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">{_t('home.examCategories')}</h2>
              <button onClick={() => handleBottomNav('exams')} className="text-orange-600 text-sm font-medium flex items-center">
                {_t('home.viewAll')} <ChevronRight className="w-4 h-4" />
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
                      <p className="text-gray-400 text-xs mt-1">{cat.exams.length} {_t('home.exams')}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Popular Exams */}
          <div>
            <h2 className="font-bold text-lg mb-3">{_t('home.popularExams')}</h2>
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
                        <p className="text-gray-400 text-xs">{exam.testCount} {_t('exams.tests')} · {exam.totalQuestions} {_t('tests.Qs')}</p>
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
              <h2 className="font-bold text-lg">{_t('home.dailyTips')}</h2>
              {dailyTips.filter(t => t.isActive).length > 1 && (
                <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">
                  {dailyTips.filter(t => t.isActive).length}
                </Badge>
              )}
            </div>
            {dailyTips.filter(tip => tip.isActive).length > 0 ? (
              <Card
                className="border-0 shadow-sm border-l-4 border-l-amber-400 cursor-pointer hover:shadow-md transition-shadow active:bg-amber-50/50"
                onClick={() => {
                  const activeTips = dailyTips.filter(tip => tip.isActive)
                  const dayIndex = Math.floor(Date.now() / 86400000) % activeTips.length
                  setSelectedTip(activeTips[dayIndex])
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {(() => {
                          const activeTips = dailyTips.filter(tip => tip.isActive)
                          const dayIndex = Math.floor(Date.now() / 86400000) % activeTips.length
                          return activeTips[dayIndex]?.text || _t('home.dailyTip')
                        })()}
                      </p>
                      <p className="text-[10px] text-amber-500 mt-1">{_t('home.tapExplore')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm border-l-4 border-l-amber-400">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">{_t('home.dailyTip')}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Upcoming Exams Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-lg">{_t('home.upcomingExams')}</h2>
            </div>
            <div className="space-y-2">
              {[
                { name: _t('upcoming.sscCgl'), date: _t('upcoming.sscCglDate'), status: _t('upcoming.sscCglStatus'), statusType: 'open', catSlug: 'ssc' },
                { name: _t('upcoming.ibpsPo'), date: _t('upcoming.ibpsPoDate'), status: _t('upcoming.ibpsPoStatus'), statusType: 'coming', catSlug: 'banking' },
                { name: _t('upcoming.rrbNtpc'), date: _t('upcoming.rrbNtpcDate'), status: _t('upcoming.rrbNtpcStatus'), statusType: 'admit', catSlug: 'railways' },
              ].map((exam, i) => (
                <Card key={i} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    const cat = categories.find(c => c.slug === exam.catSlug)
                    if (cat && cat.exams.length > 0) {
                      openExam(cat.exams[0], cat)
                    } else {
                      handleBottomNav('exams')
                    }
                  }}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{exam.name}</p>
                      <p className="text-gray-400 text-xs">{exam.date}</p>
                    </div>
                    <Badge variant={exam.statusType === 'open' ? 'default' : 'secondary'} className={`text-[10px] ${
                      exam.statusType === 'open' ? 'bg-green-100 text-green-700' :
                      exam.statusType === 'admit' ? 'bg-amber-100 text-amber-700' :
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
              <h2 className="font-bold text-lg">{_t('home.yourProgress')}</h2>
            </div>
            {auth.isLoggedIn ? (
              <div className="grid grid-cols-3 gap-2">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                    <p className="font-bold text-lg">{stats.testsTaken}</p>
                    <p className="text-gray-400 text-[10px]">{_t('home.testsDone')}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <Target className="w-6 h-6 text-green-500 mx-auto mb-1" />
                    <p className="font-bold text-lg">{stats.avgScore}%</p>
                    <p className="text-gray-400 text-[10px]">{_t('home.accuracy')}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <Award className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                    <p className="font-bold text-lg">#{stats.bestRank}</p>
                    <p className="text-gray-400 text-[10px]">{_t('home.bestRank')}</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-red-50">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="font-semibold text-sm text-gray-700">{_t('home.loginTrack')}</p>
                  <p className="text-gray-500 text-xs mt-1 mb-3">{_t('home.loginTrackSub')}</p>
                  <Button size="sm" className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl" onClick={() => setShowLoginModal(true)}>
                    {_t('home.loginNow')}
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
            <h1 className="text-white text-xl font-bold">{_t('exams.allExams')}</h1>
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
                          <p className="text-gray-400 text-xs">{exam.testCount} {_t('exams.tests')} · {exam.totalQuestions} {_t('tests.Qs')} · {exam.duration} {_t('tests.min')}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge className={`bg-gradient-to-r ${color.gradient} text-white text-xs border-0`}>
                            {exam.testCount} {_t('exams.tests')}
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
              <BookOpen className="w-3 h-3" /> {selectedExam.totalQuestions} {_t('tests.Qs')}
            </div>
            <div className="flex items-center gap-1 text-white/80 text-xs">
              <Clock className="w-3 h-3" /> {selectedExam.duration} {_t('tests.min')}
            </div>
            <div className="flex items-center gap-1 text-white/80 text-xs">
              <FileText className="w-3 h-3" /> {examTests.length} {_t('exams.tests')}
            </div>
          </div>
        </div>

        <div className="px-4 mt-4">
          <h2 className="font-bold text-base mb-3">{_t('tests.available')}</h2>
          <div className="space-y-3">
            {examTests.map(test => (
              <Card key={test.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="font-semibold text-sm">{test.title}</p>
                      <p className="text-gray-400 text-xs mt-1">{test.description}</p>
                    </div>
                    {test.isFree && <Badge className="bg-emerald-100 text-emerald-700 text-xs border-0">{_t('tests.free')}</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {test.totalQuestions} {_t('tests.Qs')}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {test.duration} {_t('tests.min')}</span>
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {test.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      className={`bg-gradient-to-r ${color.gradient} text-white rounded-xl flex-1`}
                      onClick={() => openTestInfo(test)}
                    >
                      <Play className="w-4 h-4 mr-1" /> {_t('tests.startTest')}
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
            <h1 className="text-white text-lg font-bold flex-1 truncate">{_t('testInfo.details')}</h1>
          </div>
          <h2 className="text-white font-semibold">{selectedTest.title}</h2>
          <p className="text-white/70 text-sm mt-1">{selectedTest.exam.name}</p>
        </div>

        <div className="px-4 mt-4 space-y-4">
          {/* Marking Scheme */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base">{_t('testInfo.information')}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{_t('testInfo.totalQ')}</span>
                <span className="font-semibold">{selectedTest.totalQuestions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{_t('testInfo.duration')}</span>
                <span className="font-semibold">{selectedTest.duration} {_t('testInfo.minutes')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{_t('testInfo.difficulty')}</span>
                <Badge variant="secondary">{selectedTest.difficulty}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{_t('testInfo.correctAns')}</span>
                <span className="font-semibold text-emerald-600">+{selectedTest.markingCorrect} {_t('testInfo.marks')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{_t('testInfo.wrongAns')}</span>
                <span className="font-semibold text-red-600">{selectedTest.markingWrong} {_t('testInfo.marks')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{_t('testInfo.skipped')}</span>
                <span className="font-semibold text-gray-400">{selectedTest.markingSkipped} {_t('testInfo.marks')}</span>
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
                <p className="text-xs text-gray-500">{_t('testInfo.maxScore')}</p>
                <p className="font-bold text-lg">{selectedTest.totalQuestions * selectedTest.markingCorrect} {_t('testInfo.marks')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Start Button */}
          <Button
            className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl text-base font-semibold"
            onClick={() => startTest(selectedTest)}
          >
            <Play className="w-5 h-5 mr-2" /> {_t('testInfo.startNow')}
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
            <span>Q {currentQuestionIndex + 1} {_t('testTaking.of')} {questions.length}</span>
            <span>{totalAnswered} {_t('testTaking.answered')} · {totalMarked} {_t('testTaking.marked')}</span>
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
                  <BookMarked className="w-3 h-3 mr-1" /> {_t('testTaking.markedReview')}
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
              {markedForReview.has(question.id) ? _t('testTaking.unmark') : _t('testTaking.mark')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl flex-1"
              onClick={() => clearAnswer(question.id)}
            >
              <RefreshCw className="w-4 h-4 mr-1" /> {_t('testTaking.clear')}
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
              <SkipForward className="w-4 h-4 mr-1" /> {_t('testTaking.skip')}
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
              {_t('testTaking.submit')}
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
                <h3 className="font-bold text-lg">{_t('testTaking.questionNav')}</h3>
                <button onClick={() => setShowQuestionNav(false)} className="text-gray-400 text-2xl">&times;</button>
              </div>
              <div className="flex items-center gap-4 mb-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500" /> {_t('testTaking.answered')}</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-200" /> {_t('testTaking.unanswered')}</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400" /> {_t('testTaking.marked')}</span>
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
                {_t('testTaking.submit')}
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
                <h3 className="font-bold text-xl text-gray-900">{_t('testTaking.leaveTest')}</h3>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                  {_t('testTaking.leaveMsg')}
                </p>
              </div>
              <div className="px-6 pb-6 space-y-2.5">
                <Button
                  className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold text-sm"
                  onClick={() => setShowBackConfirm(false)}
                >
                  {_t('testTaking.noContinue')}
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
                  {_t('testTaking.yesLeave')}
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
            {percentage >= 60 ? _t('results.greatJob') : percentage >= 30 ? _t('results.keepPracticing') : _t('results.keepGoing')}
          </h1>
          <p className="text-white/70 text-sm mt-1">{selectedTest.title}</p>
        </div>

        <div className="px-4 -mt-4 space-y-4">
          {/* Score Card */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-orange-600">{lastResult.score}<span className="text-lg text-gray-400">/{lastResult.maxScore}</span></div>
              <Progress value={Math.max(0, percentage)} className="mt-3 h-2" />
              <p className="text-gray-500 text-sm mt-2">{percentage}% {_t('results.score')}</p>
            </CardContent>
          </Card>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="font-bold text-lg text-emerald-600 mt-1">{lastResult.correctCount}</p>
                <p className="text-gray-400 text-xs">{_t('results.correct')}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <XCircle className="w-6 h-6 text-red-500 mx-auto" />
                <p className="font-bold text-lg text-red-600 mt-1">{lastResult.wrongCount}</p>
                <p className="text-gray-400 text-xs">{_t('results.wrong')}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <SkipForward className="w-6 h-6 text-gray-400 mx-auto" />
                <p className="font-bold text-lg text-gray-500 mt-1">{lastResult.skippedCount}</p>
                <p className="text-gray-400 text-xs">{_t('results.skipped')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Time Taken */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-gray-500 text-sm">{_t('results.timeTaken')}</span>
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
              <Trophy className="w-4 h-4 mr-2" /> {_t('results.leaderboard')}
            </Button>
            <Button
              className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white"
              onClick={() => {
                if (selectedTest) startTest(selectedTest)
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> {_t('results.retry')}
            </Button>
          </div>

          {/* Answer Key */}
          <div>
            <h2 className="font-bold text-lg mb-3">{_t('results.answerKey')}</h2>
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
                              {isUserAnswer && ` (${_t('results.yourAnswer')})`}
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
            <Home className="w-4 h-4 mr-2" /> {_t('results.backHome')}
          </Button>
        </div>
      </div>
    )
  }

  // ===== RENDER: Leaderboard =====
  function renderLeaderboard() {
    const isAllResults = leaderboardTestId === 'all'
    return (
      <div className="pb-20">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 pt-[calc(env(safe-area-inset-top,0px)+3rem)] pb-6 rounded-b-3xl">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <Trophy className="w-6 h-6 text-yellow-300" />
            <h1 className="text-white text-xl font-bold">{isAllResults ? _t('profile.myExams') : _t('leaderboard.title')}</h1>
          </div>
        </div>

        <div className="px-4 mt-4">
          {leaderboardData.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-400">{_t('leaderboard.noResults')}</p>
                <p className="text-gray-400 text-sm mt-1">{_t('leaderboard.beFirst')}</p>
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
              <h1 className="text-white text-xl font-bold">{_t('practice.title')}</h1>
              <p className="text-orange-100 text-xs">{_t('practice.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="px-4 mt-4 space-y-4">
          {/* Practice Mode Selection */}
          <div>
            <h2 className="font-bold text-lg mb-3">{_t('practice.chooseMode')}</h2>
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
                  <p className="font-semibold text-sm">{_t('practice.quick')}</p>
                  <p className="text-gray-400 text-[11px] mt-1">{_t('practice.quickSub')}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleBottomNav('exams')}>
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
                    <Target className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="font-semibold text-sm">{_t('practice.topicWise')}</p>
                  <p className="text-gray-400 text-[11px] mt-1">{_t('practice.topicWiseSub')}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                if (auth.isLoggedIn) {
                  // Show bookmarked/reviewed questions from past tests
                  const results = getUserStats()
                  if (results.testsTaken > 0) {
                    handleBottomNav('tests')
                  } else {
                    handleBottomNav('exams')
                  }
                } else {
                  setShowLoginModal(true)
                }
              }}>
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-2">
                    <BookMarked className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="font-semibold text-sm">{_t('practice.bookmarked')}</p>
                  <p className="text-gray-400 text-[11px] mt-1">{_t('practice.bookmarkedSub')}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                if (auth.isLoggedIn) {
                  handleBottomNav('tests')
                } else {
                  setShowLoginModal(true)
                }
              }}>
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-2">
                    <PenTool className="w-6 h-6 text-purple-500" />
                  </div>
                  <p className="font-semibold text-sm">{_t('practice.weakAreas')}</p>
                  <p className="text-gray-400 text-[11px] mt-1">{_t('practice.weakAreasSub')}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Practice by Category */}
          <div>
            <h2 className="font-bold text-lg mb-3">{_t('practice.byCategory')}</h2>
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
                        <p className="text-gray-400 text-xs">{cat.exams.length} {_t('home.exams')} · {totalQs} {_t('about.questions')}</p>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-xl text-orange-600 border-orange-200 text-xs">
                        {_t('home.start')}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Previous Practice Sessions */}
          <div>
            <h2 className="font-bold text-lg mb-3">{_t('practice.recent')}</h2>
            {auth.isLoggedIn ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">{_t('practice.historyEmpty')}</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-red-50">
                <CardContent className="p-4 text-center">
                  <PenTool className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="font-semibold text-sm text-gray-700">{_t('practice.loginSave')}</p>
                  <Button size="sm" className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl mt-2" onClick={() => setShowLoginModal(true)}>
                    {_t('home.loginNow')}
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
            <h1 className="text-white text-xl font-bold">{_t('profile.title')}</h1>
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
                  {isEmailUser ? (userDisplay || userEmail) : _t('profile.guestUser')}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {isEmailUser ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                      <Shield className="w-3 h-3" /> {_t('profile.verified')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" /> {_t('profile.guestMode')}
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
                <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">{_t('profile.tests')}</p>
              </div>
              <div className="text-center border-x border-white/10">
                <p className="text-white font-bold text-xl">{stats.avgScore}%</p>
                <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">{_t('profile.avgScore')}</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-xl">#{stats.bestRank}</p>
                <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">{_t('profile.bestRank')}</p>
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
                    <p className="text-white font-bold text-sm">{_t('profile.upgradeTitle')}</p>
                    <p className="text-white/80 text-xs mt-0.5">{_t('profile.upgradeSub')}</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-white text-orange-600 hover:bg-white/90 rounded-xl font-bold px-3"
                    onClick={() => setShowLoginModal(true)}
                  >
                    <Mail className="w-3 h-3 mr-1" /> {_t('profile.login')}
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
                  <p className="font-bold text-base">{_t('profile.loginUnlock')}</p>
                  <p className="text-gray-400 text-xs mt-1">{_t('profile.loginUnlockSub')}</p>
                </div>
                <Button
                  className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold"
                  onClick={() => setShowLoginModal(true)}
                >
                  <Mail className="w-4 h-4 mr-2" /> {_t('profile.loginEmail')}
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
                <p className="font-semibold text-sm">{_t('profile.myExams')}</p>
                <p className="text-gray-400 text-[10px] mt-0.5">{categories.length} {_t('profile.categories')}</p>
              </CardContent>
            </Card>
            <Card
              className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
              onClick={async () => {
                try {
                  const fsResults = isFirestore() ? await getFsResults() : []
                  const localResults = getLocalResults()
                  const allResults = [...fsResults, ...localResults]
                  const uniqueResults = allResults.filter((r, i, arr) => arr.findIndex(x => x.id === r.id) === i)
                  setLeaderboardData(uniqueResults.sort((a, b) => b.score - a.score).slice(0, 50))
                  setLeaderboardTestId('all')
                } catch {
                  setLeaderboardData(getLocalResults().sort((a, b) => b.score - a.score).slice(0, 50))
                  setLeaderboardTestId('all')
                }
                pageHistoryRef.current.push(currentPage)
                setCurrentPage('leaderboard')
              }}
            >
              <CardContent className="p-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <p className="font-semibold text-sm">{_t('leaderboard.title')}</p>
                <p className="text-gray-400 text-[10px] mt-0.5">{_t('profile.viewRankings')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Settings Section */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">{_t('profile.settings')}</p>
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
                    <p className="font-semibold text-[13px]">{_t('profile.language')}</p>
                    <p className="text-gray-400 text-[11px]">{lng === 'en' ? _t('lang.english') : lng === 'hi' ? _t('lang.hindi') : _t('lang.bangla')}</p>
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
                    <p className="font-semibold text-[13px]">{_t('profile.about')}</p>
                    <p className="text-gray-400 text-[11px]">{_t('profile.aboutSub')}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Support Section */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">{_t('profile.support')}</p>
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
                    <p className="font-semibold text-[13px]">{_t('profile.helpFaq')}</p>
                    <p className="text-gray-400 text-[11px]">{_t('profile.helpFaqSub')}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
                <div className="mx-4 border-t border-gray-100" />
                <button
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50/80 transition-colors active:bg-gray-100"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: _t('app.name'), text: _t('share.text'), url: window.location.href })
                    }
                  }}
                >
                  <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-pink-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[13px]">{_t('profile.shareApp')}</p>
                    <p className="text-gray-400 text-[11px]">{_t('profile.shareAppSub')}</p>
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
              <LogOut className="w-4 h-4 mr-2" /> {_t('profile.logout')}
            </Button>
          )}

          {/* App Version */}
          <p className="text-center text-gray-300 text-[10px] pt-2 pb-4">{_t('app.versionFull')}</p>
        </div>

        {/* Language Sheet */}
        {showLanguageSheet && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => setShowLanguageSheet(false)}>
            <div className="bg-white rounded-t-[28px] w-full p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
              <h3 className="font-bold text-lg mb-4">{_t('lang.select')}</h3>
              <div className="space-y-1">
                {[
                  { code: 'en', name: _t('lang.english'), flag: '🇬🇧', available: true },
                  { code: 'hi', name: _t('lang.hindi'), flag: '🇮🇳', available: true },
                  { code: 'bn', name: _t('lang.bangla'), flag: '🇧🇩', available: true },
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
                    onTouchEnd={(e) => {
                      if (lang.available) {
                        e.preventDefault()
                        setSelectedLanguage(lang.code)
                        setShowLanguageSheet(false)
                      }
                    }}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="font-medium text-sm flex-1">{lang.name}</span>
                    {!lang.available && <Badge variant="secondary" className="text-[10px]">{_t('lang.comingSoon')}</Badge>}
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
                {_t('lang.cancel')}
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
                <h3 className="font-bold text-lg">{_t('app.name')}</h3>
                <p className="text-gray-400 text-sm">{_t('app.version')}</p>
              </div>
              <div className="space-y-2">
                {[
                  { label: _t('about.version'), value: '1.0' },
                  { label: _t('about.size'), value: '~5 MB' },
                  { label: _t('about.exams'), value: '21+' },
                  { label: _t('about.questions'), value: '210+' },
                  { label: _t('about.offline'), value: _t('about.yes'), green: true },
                  { label: _t('about.ads'), value: _t('about.no'), green: true },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-sm p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-500">{item.label}</span>
                    <span className={`font-medium ${item.green ? 'text-emerald-600' : ''}`}>{item.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-gray-400 mt-5">{_t('app.madeIn')}</p>
              <Button
                variant="outline"
                className="w-full mt-4 rounded-xl h-11"
                onClick={() => setShowAboutSheet(false)}
              >
                {_t('about.close')}
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
      { page: 'home' as Page, icon: Home, label: _t('nav.home') },
      { page: 'practice' as Page, icon: Zap, label: _t('nav.practice') },
      { page: 'tests' as Page, icon: ClipboardList, label: _t('nav.tests') },
      { page: 'leaderboard' as Page, icon: Trophy, label: _t('nav.ranks') },
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
              <p className="text-white font-bold text-base">{_t('app.name')}</p>
              <p className="text-white/40 text-xs mt-0.5">{_t('app.partner')}</p>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-2">
              {/* Main Navigation */}
              <div className="px-3 py-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">{_t('menu.navigation')}</p>
                {[
                  { icon: Home, label: _t('menu.home'), page: 'home' as Page, active: currentPage === 'home' },
                  { icon: BookOpen, label: _t('menu.allExams'), page: 'exams' as Page, active: currentPage === 'exams' },
                  { icon: Trophy, label: _t('menu.leaderboard'), page: 'leaderboard' as Page, active: currentPage === 'leaderboard' },
                  { icon: User, label: _t('menu.myProfile'), page: 'profile' as Page, active: currentPage === 'profile' },
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
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">{_t('menu.quickActions')}</p>
                {[
                  { icon: Zap, label: _t('menu.quickPractice'), soon: false, action: () => {
                    const allCats = categories
                    const allExams = allCats.flatMap(c => c.exams)
                    if (allExams.length > 0) {
                      const randomExam = allExams[Math.floor(Math.random() * allExams.length)]
                      const randomCat = allCats.find(c => c.exams.some(e => e.id === randomExam.id))!
                      openExam(randomExam, randomCat)
                    }
                  }},
                  { icon: BookmarkPlus, label: _t('menu.bookmarkedQ'), soon: false, action: () => {
                    if (auth.isLoggedIn) {
                      handleBottomNav('tests')
                    } else {
                      setShowLoginModal(true)
                    }
                  }},
                  { icon: Download, label: _t('menu.offlineTests'), soon: false, action: () => {
                    handleBottomNav('exams')
                  }},
                  { icon: BarChart3, label: _t('menu.perfReport'), soon: false, action: () => {
                    if (auth.isLoggedIn) {
                      handleBottomNav('profile')
                    } else {
                      setShowLoginModal(true)
                    }
                  }},
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { item.action(); setShowSideMenu(false) }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <item.icon className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.soon && (
                      <Badge variant="secondary" className="text-[9px] ml-auto">{_t('menu.soon')}</Badge>
                    )}
                  </button>
                ))}
              </div>

              <div className="mx-5 border-t border-gray-100 my-1" />

              {/* Settings & Support */}
              <div className="px-3 py-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">{_t('menu.settings')}</p>
                {[
                  { icon: BookOpen, id: 'language', label: _t('profile.language'), sub: lng === 'en' ? _t('lang.english') : lng === 'hi' ? _t('lang.hindi') : _t('lang.bangla'), action: () => setShowLanguageSheet(true) },
                  { icon: Bell, id: 'notifications', label: _t('menu.notifications'), sub: unreadCount > 0 ? `${unreadCount} ${_t('menu.unread')}` : _t('menu.manageAlerts'), action: () => { setShowSideMenu(false); setCurrentPage('home'); setTimeout(() => setShowNotificationPanel(true), 300) } },
                  { icon: Wifi, id: 'offline', label: _t('menu.offlineMode'), sub: _t('menu.downloadTests'), action: () => { alert(_t('menu.offlineMode') + ' - Coming soon!') } },
                  { icon: HelpCircle, id: 'help', label: _t('menu.helpFaq'), sub: _t('menu.getSupport'), action: () => setShowAboutSheet(true) },
                  { icon: Share2, id: 'share', label: _t('menu.shareApp'), sub: _t('menu.tellFriends'), action: () => {
                    if (navigator.share) {
                      navigator.share({ title: _t('app.name'), text: _t('share.text'), url: window.location.href })
                    }
                  }},
                  { icon: Shield, id: 'about', label: _t('menu.about'), sub: _t('app.version'), action: () => setShowAboutSheet(true) },
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
                    {item.id === 'notifications' && unreadCount > 0 ? (
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
                  <span className="font-medium text-sm">{_t('menu.logout')}</span>
                </button>
              ) : (
                <button
                  onClick={() => { setShowLoginModal(true); setShowSideMenu(false) }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold text-sm"
                >
                  <Mail className="w-4 h-4" /> {_t('profile.login')}
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

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setSelectedNotification(null)}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  selectedNotification.type === 'update' ? 'bg-blue-100' :
                  selectedNotification.type === 'alert' ? 'bg-amber-100' :
                  'bg-green-100'
                }`}>
                  {selectedNotification.type === 'update' ? <Zap className="w-6 h-6 text-blue-500" /> :
                   selectedNotification.type === 'alert' ? <AlertTriangle className="w-6 h-6 text-amber-500" /> :
                   <Gift className="w-6 h-6 text-green-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-900">{selectedNotification.title}</h3>
                  <p className="text-gray-400 text-xs mt-0.5">{selectedNotification.time}</p>
                </div>
                <button onClick={() => setSelectedNotification(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">{selectedNotification.message}</p>
              {selectedNotification.link && (
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl h-11 font-semibold"
                  onClick={() => {
                    const link = selectedNotification.link!
                    setSelectedNotification(null)
                    setShowNotificationPanel(false)
                    // Check if it's an internal app page
                    if (['home', 'exams', 'tests', 'practice', 'leaderboard', 'profile'].includes(link)) {
                      handleBottomNav(link as Page)
                    } else {
                      // External URL - open in new tab
                      window.open(link.startsWith('http') ? link : `https://${link}`, '_blank')
                    }
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Open Link
                </Button>
              )}
              {!selectedNotification.link && (
                <Button
                  className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl h-11 font-medium"
                  onClick={() => setSelectedNotification(null)}
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Daily Tip Detail Modal */}
      {selectedTip && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setSelectedTip(null)}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-900">{_t('home.dailyTips')}</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Daily Tip</p>
                </div>
                <button onClick={() => setSelectedTip(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">{selectedTip.text}</p>
              {selectedTip.link && (
                <Button
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl h-11 font-semibold"
                  onClick={() => {
                    const link = selectedTip.link!
                    setSelectedTip(null)
                    if (['home', 'exams', 'tests', 'practice', 'leaderboard', 'profile'].includes(link)) {
                      handleBottomNav(link as Page)
                    } else {
                      window.open(link.startsWith('http') ? link : `https://${link}`, '_blank')
                    }
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Open Link
                </Button>
              )}
              {!selectedTip.link && (
                <Button
                  className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl h-11 font-medium"
                  onClick={() => setSelectedTip(null)}
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
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
