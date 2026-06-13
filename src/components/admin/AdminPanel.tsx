'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Shield, LogOut, Lock, Eye, EyeOff,
  BarChart3, Users, Settings,
  BookOpen, Bell, Flame, PieChart, Calendar,
  AlertCircle, Loader2, Star, FileText, Menu
} from 'lucide-react'
import {
  type Announcement, type Notification, type UpcomingExam, type DailyTip, type PrevYearPaper, type SidebarMenuItem,
  getAnnouncements, getNotifications, getUpcomingExams, getDailyTips, getPrevYearPapers, getSidebarMenu,
  saveAnnouncements, saveNotifications, saveUpcomingExams, saveDailyTips, savePrevYearPapers, saveSidebarMenu,
  DEFAULT_UPCOMING_EXAMS, DEFAULT_DAILY_TIPS, DEFAULT_PREV_YEAR_PAPERS, DEFAULT_SIDEBAR_MENU,
  isFsCollectionInitialized, markFsCollectionInitialized,
} from '@/lib/admin-data'
import { getResults, type TestResult } from '@/lib/local-data'
import {
  getAnnouncements as getFsAnnouncements,
  getNotifications as getFsNotifications,
  getUpcomingExams as getFsUpcomingExams,
  getDailyTips as getFsDailyTips,
  getPrevYearPapers as getFsPrevYearPapers,
  getSidebarMenu as getFsSidebarMenu,
  saveAnnouncements as saveFsAnnouncements,
  saveNotifications as saveFsNotifications,
  saveUpcomingExams as saveFsUpcomingExams,
  saveDailyTips as saveFsDailyTips,
  savePrevYearPapers as saveFsPrevYearPapers,
  saveSidebarMenu as saveFsSidebarMenu,
  getResults as getFsResults,
  getUseFirestore,
  getUser,
} from '@/lib/firestore-service'
import { auth, isFirebaseReady } from '@/lib/firebase'
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth'
import DashboardTab from '@/components/admin/DashboardTab'
import ExamsTab from '@/components/admin/ExamsTab'
import UsersTab from '@/components/admin/UsersTab'
import AnalyticsTab from '@/components/admin/AnalyticsTab'
import AnnouncementsTab from '@/components/admin/AnnouncementsTab'
import NotificationsTab from '@/components/admin/NotificationsTab'
import SettingsTab from '@/components/admin/SettingsTab'
import UpcomingExamsTab from '@/components/admin/UpcomingExamsTab'
import DailyTipsTab from '@/components/admin/DailyTipsTab'
import PrevPapersTab from '@/components/admin/PrevPapersTab'
import SidebarTab from '@/components/admin/SidebarTab'

// Suppress Firebase auth errors in static export mode
const isClient = typeof window !== 'undefined'

type AdminTab = 'dashboard' | 'exams' | 'users' | 'analytics' | 'announcements' | 'notifications' | 'upcoming' | 'dailytips' | 'papers' | 'sidebar' | 'settings'

type AuthStatus = 'checking' | 'not_logged_in' | 'verifying' | 'authorized' | 'denied'

export default function AdminPanel() {
  // --- Auth ---
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)

  // --- Tab ---
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard')

  // --- Data ---
  const [allResults, setAllResults] = useState<TestResult[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([])
  const [upcomingExamsLoaded, setUpcomingExamsLoaded] = useState(false)
  const [dailyTips, setDailyTips] = useState<DailyTip[]>([])
  const [dailyTipsLoaded, setDailyTipsLoaded] = useState(false)
  const [prevPapers, setPrevPapers] = useState<PrevYearPaper[]>([])
  const [prevPapersLoaded, setPrevPapersLoaded] = useState(false)
  const [sidebarMenu, setSidebarMenu] = useState<SidebarMenuItem[]>([])
  const [sidebarMenuLoaded, setSidebarMenuLoaded] = useState(false)
  const [announcementsLoaded, setAnnouncementsLoaded] = useState(false)
  const [notificationsLoaded, setNotificationsLoaded] = useState(false)

  // --- Check if already logged in as admin ---
  useEffect(() => {
    if (!isClient) return

    if (!auth || !isFirebaseReady()) {
      console.warn('[Admin] Firebase not ready, showing login form')
      setAuthStatus('not_logged_in')
      return
    }

    let cancelled = false

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return
      if (user) {
        setFirebaseUser(user)
        setAuthStatus('verifying')
        console.log('[Admin] User detected:', user.uid, user.email)
        // Check if user has admin role in Firestore
        try {
          const userData = await getUser(user.uid)
          if (cancelled) return
          console.log('[Admin] User data from Firestore:', userData)
          if (userData && userData.role === 'admin') {
            console.log('[Admin] Access granted - admin role confirmed')
            setAuthStatus('authorized')
          } else {
            console.warn('[Admin] Access denied - role is:', userData?.role ?? 'no role field', 'userData:', userData)
            setAuthStatus('denied')
          }
        } catch (e: any) {
          if (cancelled) return
          console.error('[Admin] Failed to check admin role:', e?.message ?? e)
          console.error('[Admin] This might be a Firestore rules issue. Make sure rules are deployed.')
          setAuthStatus('denied')
        }
      } else {
        setFirebaseUser(null)
        setAuthStatus('not_logged_in')
      }
    }, (error) => {
      console.error('[Admin] onAuthStateChanged error:', error)
      if (!cancelled) {
        setAuthStatus('not_logged_in')
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  // --- Load data when authorized ---
  useEffect(() => {
    if (authStatus !== 'authorized') return

    async function loadData() {
      if (getUseFirestore()) {
        try {
          // Load announcements - use Firestore data, even if empty
          // Only fall back to defaults if Firestore collection was never initialized
          const fsAnn = await getFsAnnouncements()
          if (fsAnn && fsAnn.length > 0) {
            setAnnouncements(fsAnn)
            markFsCollectionInitialized('announcements')
          } else if (isFsCollectionInitialized('announcements')) {
            // Collection was initialized before but now empty = admin deleted all
            setAnnouncements([])
          } else {
            // First time - use defaults and save to Firestore
            setAnnouncements(getAnnouncements())
          }
          setAnnouncementsLoaded(true)

          // Load notifications - same logic
          const fsNotif = await getFsNotifications()
          if (fsNotif && fsNotif.length > 0) {
            setNotifications(fsNotif)
            markFsCollectionInitialized('notifications')
          } else if (isFsCollectionInitialized('notifications')) {
            setNotifications([])
          } else {
            setNotifications(getNotifications())
          }
          setNotificationsLoaded(true)

          // Load upcoming exams from Firestore
          const fsUpcoming = await getFsUpcomingExams()
          if (fsUpcoming && fsUpcoming.length > 0) {
            setUpcomingExams(fsUpcoming)
            markFsCollectionInitialized('upcoming_exams')
          } else if (isFsCollectionInitialized('upcoming_exams')) {
            setUpcomingExams([])
          } else {
            setUpcomingExams(getUpcomingExams())
          }
          setUpcomingExamsLoaded(true)

          // Load daily tips from Firestore
          const fsTips = await getFsDailyTips()
          if (fsTips && fsTips.length > 0) {
            setDailyTips(fsTips)
            markFsCollectionInitialized('daily_tips')
          } else if (isFsCollectionInitialized('daily_tips')) {
            setDailyTips([])
          } else {
            setDailyTips(getDailyTips())
          }
          setDailyTipsLoaded(true)

          // Load previous year papers from Firestore
          const fsPapers = await getFsPrevYearPapers()
          if (fsPapers && fsPapers.length > 0) {
            setPrevPapers(fsPapers)
            markFsCollectionInitialized('prev_year_papers')
          } else if (isFsCollectionInitialized('prev_year_papers')) {
            setPrevPapers([])
          } else {
            setPrevPapers(getPrevYearPapers())
          }
          setPrevPapersLoaded(true)

          // Load sidebar menu from Firestore
          const fsSidebar = await getFsSidebarMenu()
          if (fsSidebar && fsSidebar.length > 0) {
            setSidebarMenu(fsSidebar)
            markFsCollectionInitialized('sidebar_menu')
          } else if (isFsCollectionInitialized('sidebar_menu')) {
            setSidebarMenu([])
          } else {
            setSidebarMenu(getSidebarMenu())
          }
          setSidebarMenuLoaded(true)

          const fsResults = await getFsResults()
          setAllResults(fsResults as TestResult[] || getResults())
        } catch (e) {
          console.warn('[Admin] Firestore load failed, using local:', e)
          setAnnouncements(getAnnouncements())
          setNotifications(getNotifications())
          setAllResults(getResults())
          setUpcomingExams(getUpcomingExams())
          setDailyTips(getDailyTips())
          setPrevPapers(getPrevYearPapers())
          setSidebarMenu(getSidebarMenu())
          setAnnouncementsLoaded(true)
          setNotificationsLoaded(true)
          setUpcomingExamsLoaded(true)
          setDailyTipsLoaded(true)
          setPrevPapersLoaded(true)
          setSidebarMenuLoaded(true)
        }
      } else {
        setAnnouncements(getAnnouncements())
        setNotifications(getNotifications())
        setAllResults(getResults())
        setUpcomingExams(getUpcomingExams())
        setDailyTips(getDailyTips())
        setPrevPapers(getPrevYearPapers())
        setSidebarMenu(getSidebarMenu())
        setAnnouncementsLoaded(true)
        setNotificationsLoaded(true)
        setUpcomingExamsLoaded(true)
        setDailyTipsLoaded(true)
        setPrevPapersLoaded(true)
        setSidebarMenuLoaded(true)
      }
    }
    loadData()
  }, [authStatus])

  // Refresh user data periodically
  useEffect(() => {
    if (authStatus !== 'authorized') return

    const interval = setInterval(async () => {
      if (getUseFirestore()) {
        try {
          const fsResults = await getFsResults()
          setAllResults(fsResults as TestResult[] || [])
        } catch (e) {}
      } else {
        setAllResults(getResults())
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [authStatus])

  // Save data when it changes (both local + Firestore)
  // Always save - even empty lists (so deletes persist)
  // Note: announcementsLoaded, notificationsLoaded, upcomingExamsLoaded, dailyTipsLoaded
  // are defined above with the data states

  useEffect(() => {
    if (!announcementsLoaded) return
    saveAnnouncements(announcements)
    if (getUseFirestore()) {
      saveFsAnnouncements(announcements)
        .then(() => {
          console.log('[Admin] Announcements saved to Firestore:', announcements.length)
          markFsCollectionInitialized('announcements')
        })
        .catch(e => console.warn('[Admin] Firestore save announcements failed:', e))
    }
  }, [announcements, announcementsLoaded])

  useEffect(() => {
    if (!notificationsLoaded) return
    saveNotifications(notifications)
    if (getUseFirestore()) {
      saveFsNotifications(notifications)
        .then(() => {
          console.log('[Admin] Notifications saved to Firestore:', notifications.length)
          markFsCollectionInitialized('notifications')
        })
        .catch(e => console.warn('[Admin] Firestore save notifications failed:', e))
    }
  }, [notifications, notificationsLoaded])

  useEffect(() => {
    if (!upcomingExamsLoaded) return
    saveUpcomingExams(upcomingExams)
    if (getUseFirestore()) {
      saveFsUpcomingExams(upcomingExams)
        .then(() => {
          console.log('[Admin] Upcoming exams saved to Firestore:', upcomingExams.length)
          markFsCollectionInitialized('upcoming_exams')
        })
        .catch(e => console.warn('[Admin] Firestore save upcoming exams failed:', e))
    }
  }, [upcomingExams, upcomingExamsLoaded])

  useEffect(() => {
    if (!dailyTipsLoaded) return
    saveDailyTips(dailyTips)
    if (getUseFirestore()) {
      saveFsDailyTips(dailyTips)
        .then(() => {
          console.log('[Admin] Daily tips saved to Firestore:', dailyTips.length)
          markFsCollectionInitialized('daily_tips')
        })
        .catch(e => console.warn('[Admin] Firestore save daily tips failed:', e))
    }
  }, [dailyTips, dailyTipsLoaded])

  useEffect(() => {
    if (!prevPapersLoaded) return
    savePrevYearPapers(prevPapers)
    if (getUseFirestore()) {
      saveFsPrevYearPapers(prevPapers)
        .then(() => {
          console.log('[Admin] Prev year papers saved to Firestore:', prevPapers.length)
          markFsCollectionInitialized('prev_year_papers')
        })
        .catch(e => console.warn('[Admin] Firestore save prev papers failed:', e))
    }
  }, [prevPapers, prevPapersLoaded])

  useEffect(() => {
    if (!sidebarMenuLoaded) return
    saveSidebarMenu(sidebarMenu)
    if (getUseFirestore()) {
      saveFsSidebarMenu(sidebarMenu)
        .then(() => {
          console.log('[Admin] Sidebar menu saved to Firestore:', sidebarMenu.length)
          markFsCollectionInitialized('sidebar_menu')
        })
        .catch(e => console.warn('[Admin] Firestore save sidebar menu failed:', e))
    }
  }, [sidebarMenu, sidebarMenuLoaded])

  // --- Firebase Auth Login ---
  const handleLogin = async () => {
    if (!auth || !isFirebaseReady()) {
      setLoginError('Firebase is not configured.')
      return
    }

    setLoginError('')
    setLoginLoading(true)

    try {
      const credential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
      // onAuthStateChanged will handle the rest (role check)
      // But we can also check role here for faster feedback
      setFirebaseUser(credential.user)
      setAuthStatus('verifying')

      const userData = await getUser(credential.user.uid)
      console.log('[Admin] Login - User data from Firestore:', userData)
      if (userData && userData.role === 'admin') {
        console.log('[Admin] Login success - admin role confirmed')
        setAuthStatus('authorized')
        setAdminEmail('')
        setAdminPassword('')
      } else {
        console.warn('[Admin] Login denied - role:', userData?.role ?? 'no role field')
        setAuthStatus('denied')
        // Sign out non-admin user immediately
        await firebaseSignOut(auth)
        setLoginError('Access denied. Your role is: ' + (userData?.role ?? 'not set') + '. Make sure you have admin role in Firestore users collection.')
      }
    } catch (err: any) {
      console.error('[Admin] Login error:', err)
      if (err.code === 'auth/user-not-found') {
        setLoginError('No account found with this email. Create user in Firebase Console → Authentication first.')
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setLoginError('Incorrect password. Check credentials in Firebase Console → Authentication.')
      } else if (err.code === 'auth/invalid-email') {
        setLoginError('Invalid email address.')
      } else if (err.code === 'auth/too-many-requests') {
        setLoginError('Too many failed attempts. Try again later.')
      } else {
        setLoginError('Login failed: ' + (err?.message || 'Unknown error') + '. Check if Firebase is configured correctly.')
      }
      setAuthStatus('not_logged_in')
    }

    setLoginLoading(false)
  }

  const handleLogout = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth)
      }
    } catch (e) {
      console.error('[Admin] Logout error:', e)
    }
    setFirebaseUser(null)
    setAuthStatus('not_logged_in')
  }

  const handleRefreshResults = () => setAllResults(getResults())

  // --- Checking auth state (loading) ---
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Checking...</p>
        </div>
      </div>
    )
  }

  // --- Verifying admin role ---
  if (authStatus === 'verifying') {
    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Verifying access...</p>
        </div>
      </div>
    )
  }

  // --- Access denied (logged in but not admin) ---
  if (authStatus === 'denied') {
    return (
      <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <div className="w-full max-w-sm">
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="font-bold text-lg mb-2">Access Denied</h2>
              <p className="text-gray-500 text-sm mb-4">You do not have permission to access this page.</p>
              <Button
                className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl h-11 font-semibold"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // --- Login Screen ---
  if (authStatus === 'not_logged_in') {
    return (
      <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-700/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-700/10 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="w-full max-w-sm relative z-10">
          {/* Minimal branding - no app logo, no app name */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-white text-2xl font-bold">System Login</h1>
            <p className="text-slate-400 text-sm mt-1">Authorized personnel only</p>
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Email field */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => { setAdminEmail(e.target.value); setLoginError('') }}
                    placeholder="Enter email address"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && adminEmail && adminPassword) {
                        handleLogin()
                      }
                    }}
                  />
                </div>

                {/* Password field */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={e => { setAdminPassword(e.target.value); setLoginError('') }}
                      placeholder="Enter password"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 pr-12"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && adminEmail && adminPassword) {
                          handleLogin()
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error message */}
                {loginError && (
                  <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 px-3 py-2 rounded-xl">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Login button */}
                <Button
                  className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl h-11 font-semibold"
                  onClick={handleLogin}
                  disabled={loginLoading || !adminEmail || !adminPassword}
                >
                  {loginLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  {loginLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // --- Admin Panel (Logged In) ---
  const tabs: { id: AdminTab; icon: React.ElementType; label: string; color: string }[] = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard', color: 'from-violet-500 to-purple-500' },
    { id: 'exams', icon: BookOpen, label: 'Mock Tests', color: 'from-blue-500 to-indigo-500' },
    { id: 'users', icon: Users, label: 'Users', color: 'from-emerald-500 to-teal-500' },
    { id: 'analytics', icon: PieChart, label: 'Analytics', color: 'from-pink-500 to-rose-500' },
    { id: 'announcements', icon: Flame, label: 'Announce', color: 'from-orange-500 to-amber-500' },
    { id: 'notifications', icon: Bell, label: 'Notify', color: 'from-cyan-500 to-blue-500' },
    { id: 'upcoming', icon: Calendar, label: 'Upcoming', color: 'from-fuchsia-500 to-pink-500' },
    { id: 'dailytips', icon: Star, label: 'Tips', color: 'from-yellow-500 to-amber-500' },
    { id: 'papers', icon: FileText, label: 'Papers', color: 'from-lime-500 to-green-500' },
    { id: 'sidebar', icon: Menu, label: 'Sidebar', color: 'from-sky-500 to-cyan-500' },
    { id: 'settings', icon: Settings, label: 'Settings', color: 'from-gray-500 to-slate-500' },
  ]

  return (
    <div className="min-h-screen min-h-dvh bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-5 sticky top-0 z-30 shadow-xl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <h1 className="text-white text-lg font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                Admin Panel
              </h1>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {firebaseUser?.email || 'Admin'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all text-white/50 hover:text-white/80"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-xs font-medium hidden sm:inline">Logout</span>
            </button>
          </div>

          {/* Tabs - Scrollable with active indicator */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`flex-shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  adminTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg shadow-black/20 scale-[1.02]`
                    : 'text-white/35 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-5">
        {adminTab === 'dashboard' && (
          <DashboardTab
            announcements={announcements}
            notifications={notifications}
            allResults={allResults}
            onSwitchTab={(tab) => setAdminTab(tab as AdminTab)}
          />
        )}

        {adminTab === 'exams' && <ExamsTab />}

        {adminTab === 'users' && (
          <UsersTab
            allResults={allResults}
            onRefresh={handleRefreshResults}
          />
        )}

        {adminTab === 'analytics' && (
          <AnalyticsTab allResults={allResults} />
        )}

        {adminTab === 'announcements' && (
          <AnnouncementsTab
            announcements={announcements}
            onUpdate={setAnnouncements}
          />
        )}

        {adminTab === 'notifications' && (
          <NotificationsTab
            notifications={notifications}
            onUpdate={setNotifications}
          />
        )}

        {adminTab === 'upcoming' && (
          <UpcomingExamsTab
            exams={upcomingExams}
            onUpdate={setUpcomingExams}
          />
        )}

        {adminTab === 'dailytips' && (
          <DailyTipsTab
            tips={dailyTips}
            onUpdate={setDailyTips}
          />
        )}

        {adminTab === 'papers' && (
          <PrevPapersTab
            papers={prevPapers}
            onUpdate={setPrevPapers}
          />
        )}

        {adminTab === 'sidebar' && (
          <SidebarTab
            items={sidebarMenu}
            onUpdate={setSidebarMenu}
          />
        )}

        {adminTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}
