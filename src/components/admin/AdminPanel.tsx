'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Shield, LogOut, Lock, Eye, EyeOff,
  BarChart3, Users, Settings,
  BookOpen, Bell, Flame, PieChart,
  AlertCircle, Loader2
} from 'lucide-react'
import {
  type Announcement, type Notification,
  getAnnouncements, getNotifications,
  saveAnnouncements, saveNotifications,
} from '@/lib/admin-data'
import { getResults, type TestResult } from '@/lib/local-data'
import {
  getAnnouncements as getFsAnnouncements,
  getNotifications as getFsNotifications,
  saveAnnouncements as saveFsAnnouncements,
  saveNotifications as saveFsNotifications,
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

type AdminTab = 'dashboard' | 'exams' | 'users' | 'analytics' | 'announcements' | 'notifications' | 'settings'

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

  // --- Check if already logged in as admin ---
  useEffect(() => {
    if (!auth || !isFirebaseReady()) {
      setAuthStatus('not_logged_in')
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user)
        setAuthStatus('verifying')
        // Check if user has admin role in Firestore
        try {
          const userData = await getUser(user.uid)
          if (userData && userData.role === 'admin') {
            setAuthStatus('authorized')
          } else {
            setAuthStatus('denied')
          }
        } catch (e) {
          console.error('[Admin] Failed to check admin role:', e)
          setAuthStatus('denied')
        }
      } else {
        setFirebaseUser(null)
        setAuthStatus('not_logged_in')
      }
    })

    return () => unsubscribe()
  }, [])

  // --- Load data when authorized ---
  useEffect(() => {
    if (authStatus !== 'authorized') return

    async function loadData() {
      if (getUseFirestore()) {
        try {
          const fsAnn = await getFsAnnouncements()
          if (fsAnn && fsAnn.length > 0) {
            setAnnouncements(fsAnn)
          } else {
            setAnnouncements(getAnnouncements())
          }
          const fsNotif = await getFsNotifications()
          if (fsNotif && fsNotif.length > 0) {
            setNotifications(fsNotif)
          } else {
            setNotifications(getNotifications())
          }
          const fsResults = await getFsResults()
          setAllResults(fsResults as TestResult[] || getResults())
        } catch (e) {
          console.warn('[Admin] Firestore load failed, using local:', e)
          setAnnouncements(getAnnouncements())
          setNotifications(getNotifications())
          setAllResults(getResults())
        }
      } else {
        setAnnouncements(getAnnouncements())
        setNotifications(getNotifications())
        setAllResults(getResults())
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
  useEffect(() => {
    if (announcements.length > 0) {
      saveAnnouncements(announcements)
      if (getUseFirestore()) {
        saveFsAnnouncements(announcements).catch(e =>
          console.warn('[Admin] Firestore save announcements failed:', e)
        )
      }
    }
  }, [announcements])

  useEffect(() => {
    if (notifications.length > 0) {
      saveNotifications(notifications)
      if (getUseFirestore()) {
        saveFsNotifications(notifications).catch(e =>
          console.warn('[Admin] Firestore save notifications failed:', e)
        )
      }
    }
  }, [notifications])

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
      if (userData && userData.role === 'admin') {
        setAuthStatus('authorized')
        setAdminEmail('')
        setAdminPassword('')
      } else {
        setAuthStatus('denied')
        // Sign out non-admin user immediately
        await firebaseSignOut(auth)
        setLoginError('Access denied. You do not have admin privileges.')
      }
    } catch (err: any) {
      console.error('[Admin] Login error:', err)
      if (err.code === 'auth/user-not-found') {
        setLoginError('No account found with this email.')
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setLoginError('Incorrect password.')
      } else if (err.code === 'auth/invalid-email') {
        setLoginError('Invalid email address.')
      } else if (err.code === 'auth/too-many-requests') {
        setLoginError('Too many failed attempts. Try again later.')
      } else {
        setLoginError('Login failed. Please try again.')
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
  const tabs: { id: AdminTab; icon: React.ElementType; label: string }[] = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'exams', icon: BookOpen, label: 'Exams' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'analytics', icon: PieChart, label: 'Analytics' },
    { id: 'announcements', icon: Flame, label: 'Announce' },
    { id: 'notifications', icon: Bell, label: 'Notify' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="min-h-screen min-h-dvh bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <h1 className="text-white text-lg font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-400" /> System Panel
              </h1>
              <p className="text-slate-400 text-[11px]">
                {firebaseUser?.email || 'Admin'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Tabs - Scrollable */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`flex-shrink-0 py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  adminTab === tab.id
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/40 hover:text-white/60'
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
      <div className="max-w-4xl mx-auto px-4 py-6">
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

        {adminTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}
