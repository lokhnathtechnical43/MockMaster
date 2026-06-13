'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Shield, LogOut, Eye, EyeOff,
  Users, Settings,
  BookOpen, Bell, Flame, PieChart, Calendar,
  AlertCircle, Loader2, Star, FileText, Menu,
  ChevronLeft, Sparkles, Activity,
  Crown
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
  ensureFirstUserAsAdmin,
  setUserRole,
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
          let userData = await getUser(user.uid)
          if (cancelled) return
          console.log('[Admin] User data from Firestore:', userData)

          if (userData && userData.role === 'admin') {
            console.log('[Admin] Access granted - admin role confirmed')
            setAuthStatus('authorized')
          } else {
            // Try auto-admin: if no admin exists yet, make this user the admin
            console.warn('[Admin] Role is not admin:', userData?.role ?? 'no user doc', '— trying auto-admin setup')
            const becameAdmin = await ensureFirstUserAsAdmin(user.uid, user.email || '')
            if (becameAdmin) {
              console.log('[Admin] ✅ Auto-admin assigned! Access granted.')
              setAuthStatus('authorized')
            } else {
              console.warn('[Admin] Access denied - role is:', userData?.role ?? 'not set', 'and auto-admin not applicable')
              setAuthStatus('denied')
            }
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

  // --- Auto-save to Firestore when data changes ---
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

      let userData = await getUser(credential.user.uid)
      console.log('[Admin] Login - User data from Firestore:', userData)
      if (userData && userData.role === 'admin') {
        console.log('[Admin] Login success - admin role confirmed')
        setAuthStatus('authorized')
        setAdminEmail('')
        setAdminPassword('')
      } else {
        // Try auto-admin: if no admin exists yet, make this user the admin
        console.warn('[Admin] Login - role not admin, trying auto-admin setup')
        const becameAdmin = await ensureFirstUserAsAdmin(credential.user.uid, credential.user.email || '')
        if (becameAdmin) {
          console.log('[Admin] ✅ Auto-admin assigned on login! Access granted.')
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
      }
    } catch (err: any) {
      console.error('[Admin] Login error:', err)
      if (err.code === 'auth/user-not-found') {
        setLoginError('No account found with this email. Create user in Firebase Console first.')
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setLoginError('Incorrect password. Check credentials in Firebase Console.')
      } else if (err.code === 'auth/invalid-email') {
        setLoginError('Invalid email address.')
      } else if (err.code === 'auth/too-many-requests') {
        setLoginError('Too many failed attempts. Try again later.')
      } else {
        setLoginError('Login failed: ' + (err?.message || 'Unknown error'))
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

  const handleTabChange = (tab: AdminTab) => {
    setAdminTab(tab)
    setMobileMenuOpen(false)
  }

  // --- Checking auth state (loading) ---
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-orange-500/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-6 h-6 text-white/40 animate-spin mx-auto mb-3" />
          <p className="text-white/40 text-sm">Initializing...</p>
        </div>
      </div>
    )
  }

  // --- Verifying admin role ---
  if (authStatus === 'verifying') {
    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-6 h-6 text-white/40 animate-spin mx-auto mb-3" />
          <p className="text-white/40 text-sm">Verifying access...</p>
        </div>
      </div>
    )
  }

  // --- Access denied (logged in but not admin) ---
  if (authStatus === 'denied') {
    return (
      <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />
        <div className="w-full max-w-sm relative z-10">
          <Card className="border-0 shadow-2xl bg-white/[0.07] backdrop-blur-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="font-bold text-xl text-white mb-2">Access Denied</h2>
              <p className="text-white/40 text-sm mb-6">You do not have permission to access this page.</p>
              <Button
                className="w-full bg-white/10 hover:bg-white/15 text-white rounded-xl h-11 font-semibold border border-white/10"
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
      <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 px-4 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/8 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/8 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />

        <div className="w-full max-w-sm relative z-10">
          {/* Branding */}
          <div className="text-center mb-8">
            <div className="w-18 h-18 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-orange-500/30" style={{ width: '72px', height: '72px' }}>
              <Shield className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-white text-2xl font-bold tracking-tight">Admin Console</h1>
            <p className="text-white/30 text-sm mt-1.5">Authorized personnel only</p>
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-2xl bg-white/[0.07] backdrop-blur-2xl border border-white/10">
            <CardContent className="p-7">
              <div className="space-y-5">
                {/* Email field */}
                <div>
                  <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => { setAdminEmail(e.target.value); setLoginError('') }}
                    placeholder="Enter email address"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400/30 transition-all"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && adminEmail && adminPassword) {
                        handleLogin()
                      }
                    }}
                  />
                </div>

                {/* Password field */}
                <div>
                  <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={e => { setAdminPassword(e.target.value); setLoginError('') }}
                      placeholder="Enter password"
                      className="w-full px-4 py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400/30 transition-all pr-12"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && adminEmail && adminPassword) {
                          handleLogin()
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error message */}
                {loginError && (
                  <div className="flex items-start gap-2.5 text-red-300 text-xs bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{loginError}</span>
                  </div>
                )}

                {/* Login button */}
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl h-12 font-bold text-sm shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98]"
                  onClick={handleLogin}
                  disabled={loginLoading || !adminEmail || !adminPassword}
                >
                  {loginLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {loginLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-white/15 text-[10px] text-center mt-6">Secured by Firebase Authentication</p>
        </div>
      </div>
    )
  }

  // --- Admin Panel (Logged In) ---
  const tabs: { id: AdminTab; icon: React.ElementType; label: string; gradient: string; section: string }[] = [
    { id: 'dashboard', icon: Activity, label: 'Dashboard', gradient: 'from-violet-500 to-purple-600', section: 'Overview' },
    { id: 'exams', icon: BookOpen, label: 'Mock Tests', gradient: 'from-blue-500 to-indigo-600', section: 'Content' },
    { id: 'announcements', icon: Flame, label: 'Announcements', gradient: 'from-orange-500 to-amber-500', section: 'Content' },
    { id: 'notifications', icon: Bell, label: 'Notifications', gradient: 'from-cyan-500 to-blue-500', section: 'Content' },
    { id: 'upcoming', icon: Calendar, label: 'Upcoming Exams', gradient: 'from-fuchsia-500 to-pink-500', section: 'Content' },
    { id: 'dailytips', icon: Star, label: 'Daily Tips', gradient: 'from-yellow-500 to-amber-500', section: 'Content' },
    { id: 'papers', icon: FileText, label: 'Prev. Papers', gradient: 'from-lime-500 to-green-500', section: 'Content' },
    { id: 'sidebar', icon: Menu, label: 'Sidebar Menu', gradient: 'from-sky-500 to-cyan-500', section: 'Content' },
    { id: 'users', icon: Users, label: 'Users', gradient: 'from-emerald-500 to-teal-500', section: 'Data' },
    { id: 'analytics', icon: PieChart, label: 'Analytics', gradient: 'from-pink-500 to-rose-500', section: 'Data' },
    { id: 'settings', icon: Settings, label: 'Settings', gradient: 'from-gray-500 to-slate-500', section: 'System' },
  ]

  const currentTab = tabs.find(t => t.id === adminTab)!

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* ===== Top Header Bar ===== */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-4 sticky top-0 z-40 shadow-xl shadow-slate-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white/90 hover:bg-white/10 transition-all"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Brand */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-white text-base font-bold tracking-tight flex items-center gap-2">
                  Admin Console
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold uppercase tracking-wider">Pro</span>
                </h1>
                <p className="text-white/25 text-[10px] font-medium">{firebaseUser?.email || 'Admin'}</p>
              </div>
            </div>

            {/* Status badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-[10px] font-semibold">Online</span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all text-white/40"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-xs font-medium hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===== Mobile Slide-out Menu ===== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-bold text-sm">Navigation</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white/70">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                      adminTab === tab.id
                        ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                        : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto flex">
        {/* ===== Desktop Sidebar ===== */}
        <aside className="hidden lg:block w-56 xl:w-60 flex-shrink-0 sticky top-[68px] h-[calc(100vh-68px)] border-r border-slate-200/60 bg-white/50 backdrop-blur-sm overflow-y-auto">
          <div className="p-3 space-y-0.5">
            {['Overview', 'Content', 'Data', 'System'].map(section => (
              <div key={section}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-4 pb-2">{section}</p>
                {tabs.filter(t => t.section === section).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                      adminTab === tab.id
                        ? `bg-gradient-to-r ${tab.gradient} text-white shadow-md shadow-slate-900/10`
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      adminTab === tab.id
                        ? 'bg-white/20'
                        : 'bg-slate-100 group-hover:bg-slate-200'
                    }`}>
                      <tab.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* ===== Main Content ===== */}
        <main className="flex-1 min-w-0">
          {/* Tab Header - mobile */}
          <div className="lg:hidden overflow-x-auto scrollbar-hide border-b border-slate-200/60 bg-white/70 backdrop-blur-sm">
            <div className="flex gap-1 px-3 py-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-shrink-0 py-2 px-3 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                    adminTab === tab.id
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-md`
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Title Bar */}
          <div className="px-4 lg:px-6 py-4 border-b border-slate-200/40">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentTab.gradient} flex items-center justify-center shadow-lg`}>
                <currentTab.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-800">{currentTab.label}</h2>
                <p className="text-slate-400 text-xs">Manage your {currentTab.label.toLowerCase()} data</p>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 lg:p-6">
            {adminTab === 'dashboard' && (
              <DashboardTab
                announcements={announcements}
                notifications={notifications}
                allResults={allResults}
                onSwitchTab={(tab) => handleTabChange(tab as AdminTab)}
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
        </main>
      </div>
    </div>
  )
}
