'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Shield, LogOut, Lock, ArrowLeft, Eye, EyeOff,
  BarChart3, Users, FileText, Settings, Home,
  BookOpen, Bell, Flame, PieChart, Calendar
} from 'lucide-react'
import {
  type Announcement, type Notification, type DailyTip, type PageImage, type UpcomingExam,
  getAnnouncements as getLocalAnnouncements,
  getNotifications as getLocalNotifications,
  saveAnnouncements as saveLocalAnnouncements,
  saveNotifications as saveLocalNotifications,
  getDailyTips as getLocalDailyTips,
  saveDailyTips as saveLocalDailyTips,
  getPageImages as getLocalPageImages,
  savePageImages as saveLocalPageImages,
  getUpcomingExams as getLocalUpcomingExams,
  saveUpcomingExams as saveLocalUpcomingExams,
} from '@/lib/admin-data'
import {
  getAnnouncements as getFsAnnouncements,
  getNotifications as getFsNotifications,
  saveAnnouncements as saveFsAnnouncements,
  saveNotifications as saveFsNotifications,
  getDailyTips as getFsDailyTips,
  saveDailyTips as saveFsDailyTips,
  getUpcomingExams as getFsUpcomingExams,
  saveUpcomingExams as saveFsUpcomingExams,
  getResults as getFsResults,
  getUseFirestore,
} from '@/lib/firestore-service'
import { isFirebaseReady } from '@/lib/firebase'
import { getResults as getLocalResults, type TestResult } from '@/lib/local-data'
import Link from 'next/link'

import DashboardTab from './DashboardTab'
import ExamsTab from './ExamsTab'
import UsersTab from './UsersTab'
import AnalyticsTab from './AnalyticsTab'
import AnnouncementsTab from './AnnouncementsTab'
import NotificationsTab from './NotificationsTab'
import DailyTipsTab from './DailyTipsTab'
import PageImagesTab from './PageImagesTab'
import UpcomingExamsTab from './UpcomingExamsTab'
import SettingsTab from './SettingsTab'

type AdminTab = 'dashboard' | 'exams' | 'users' | 'analytics' | 'announcements' | 'notifications' | 'dailyTips' | 'pageImages' | 'upcomingExams' | 'settings'

export default function AdminPanel() {
  // --- Auth ---
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)

  // --- Tab ---
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard')

  // --- Data ---
  const [allResults, setAllResults] = useState<TestResult[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dailyTips, setDailyTips] = useState<DailyTip[]>([])
  const [pageImages, setPageImages] = useState<PageImage[]>([])
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([])

  // --- Load data on mount (always from Firestore if available) ---
  useEffect(() => {
    // Check session storage for admin login persistence
    try {
      const saved = sessionStorage.getItem('mockmaster_admin_logged_in')
      if (saved === 'true') setAdminLoggedIn(true)
    } catch {}
    setMounted(true)

    const loadAdminData = async () => {
      try {
        if (getUseFirestore() && isFirebaseReady()) {
          const [anns, notifs, tips, uExams, results] = await Promise.all([
            getFsAnnouncements(),
            getFsNotifications(),
            getFsDailyTips(),
            getFsUpcomingExams(),
            getFsResults(),
          ])
          setAnnouncements(anns)
          setNotifications(notifs)
          setDailyTips(tips)
          setUpcomingExams(uExams)
          setAllResults(results)
        } else {
          setAnnouncements(getLocalAnnouncements())
          setNotifications(getLocalNotifications())
          setDailyTips(getLocalDailyTips())
          setPageImages(getLocalPageImages())
          setUpcomingExams(getLocalUpcomingExams())
          setAllResults(getLocalResults())
        }
      } catch (e) {
        console.error('Admin data load failed, using local:', e)
        setAnnouncements(getLocalAnnouncements())
        setNotifications(getLocalNotifications())
        setDailyTips(getLocalDailyTips())
        setPageImages(getLocalPageImages())
        setUpcomingExams(getLocalUpcomingExams())
        setAllResults(getLocalResults())
      }
    }
    loadAdminData()
  }, [])

  // Refresh user data periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        if (getUseFirestore() && isFirebaseReady()) {
          setAllResults(await getFsResults())
        } else {
          setAllResults(getLocalResults())
        }
      } catch {}
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Save announcements to Firestore + localStorage when changed
  useEffect(() => {
    if (announcements.length > 0) {
      saveLocalAnnouncements(announcements) // local backup
      if (getUseFirestore() && isFirebaseReady()) {
        saveFsAnnouncements(announcements).catch(e =>
          console.error('[Admin] Failed to save announcements to Firestore:', e)
        )
      }
    }
  }, [announcements])

  // Save notifications to Firestore + localStorage when changed
  useEffect(() => {
    if (notifications.length > 0) {
      saveLocalNotifications(notifications) // local backup
      if (getUseFirestore() && isFirebaseReady()) {
        saveFsNotifications(notifications).catch(e =>
          console.error('[Admin] Failed to save notifications to Firestore:', e)
        )
      }
    }
  }, [notifications])

  // Save daily tips to Firestore + localStorage when changed
  useEffect(() => {
    if (dailyTips.length > 0) {
      saveLocalDailyTips(dailyTips) // local backup
      if (getUseFirestore() && isFirebaseReady()) {
        saveFsDailyTips(dailyTips).catch(e =>
          console.error('[Admin] Failed to save daily tips to Firestore:', e)
        )
      }
    }
  }, [dailyTips])

  // Save page images to localStorage when changed
  useEffect(() => {
    saveLocalPageImages(pageImages)
  }, [pageImages])

  // Save upcoming exams to Firestore + localStorage when changed
  useEffect(() => {
    if (upcomingExams.length > 0) {
      saveLocalUpcomingExams(upcomingExams)
      if (getUseFirestore() && isFirebaseReady()) {
        saveFsUpcomingExams(upcomingExams).catch(e =>
          console.error('[Admin] Failed to save upcoming exams to Firestore:', e)
        )
      }
    }
  }, [upcomingExams])

  const ADMIN_PASSWORD = 'admin123'

  const getAdminPassword = () => {
    try {
      return localStorage.getItem('examprep_admin_password') || ADMIN_PASSWORD
    } catch {
      return ADMIN_PASSWORD
    }
  }

  const handleAdminLogin = () => {
    if (adminPassword === getAdminPassword()) {
      setAdminLoggedIn(true)
      setAdminPassword('')
      try { sessionStorage.setItem('mockmaster_admin_logged_in', 'true') } catch {}
    }
  }

  const handleAdminLogout = () => {
    setAdminLoggedIn(false)
    try { sessionStorage.removeItem('mockmaster_admin_logged_in') } catch {}
  }

  const handleRefreshResults = async () => {
    try {
      if (getUseFirestore() && isFirebaseReady()) {
        setAllResults(await getFsResults())
      } else {
        setAllResults(getLocalResults())
      }
    } catch {
      setAllResults(getLocalResults())
    }
  }

  // --- Login Screen ---
  if (!adminLoggedIn) {
    return (
      <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="w-full max-w-sm relative z-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-slate-900/50 border border-white/10">
              <Shield className="w-10 h-10 text-orange-400" />
            </div>
            <h1 className="text-white text-2xl font-bold">Admin Panel</h1>
            <p className="text-slate-400 text-sm mt-1">ExamPrep Bharat Management</p>
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-7 h-7 text-slate-500" />
                </div>
                <h2 className="font-bold text-lg">Admin Login</h2>
                <p className="text-gray-400 text-xs">Enter password to access admin panel</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-12"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAdminLogin()
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

                <Button
                  className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl h-11 font-semibold"
                  onClick={handleAdminLogin}
                >
                  <Shield className="w-4 h-4 mr-2" /> Login
                </Button>

                {adminPassword && adminPassword !== getAdminPassword() && adminPassword.length > 3 && (
                  <p className="text-red-500 text-xs text-center">Wrong password. Try again.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Back to App Link */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-slate-400 hover:text-white text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to App
            </Link>
          </div>
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
    { id: 'dailyTips', icon: FileText, label: 'Tips' },
    { id: 'pageImages', icon: Home, label: 'Images' },
    { id: 'upcomingExams', icon: Calendar, label: 'Upcoming' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="min-h-screen min-h-dvh bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="flex-1">
              <h1 className="text-white text-lg font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-400" /> Admin Panel
              </h1>
              <p className="text-slate-400 text-[11px]">ExamPrep Bharat Management</p>
            </div>
            <button
              onClick={handleAdminLogout}
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

        {adminTab === 'dailyTips' && (
          <DailyTipsTab
            tips={dailyTips}
            onUpdate={setDailyTips}
          />
        )}

        {adminTab === 'pageImages' && (
          <PageImagesTab
            images={pageImages}
            onUpdate={setPageImages}
          />
        )}

        {adminTab === 'upcomingExams' && (
          <UpcomingExamsTab
            exams={upcomingExams}
            onUpdate={setUpcomingExams}
          />
        )}

        {adminTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}
