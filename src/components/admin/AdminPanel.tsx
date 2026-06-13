'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Shield, LogOut, Lock, ArrowLeft, Eye, EyeOff,
  BarChart3, Users, FileText, Settings, Home,
  BookOpen, Bell, Flame, PieChart
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
} from '@/lib/firestore-service'
import Link from 'next/link'

import DashboardTab from './DashboardTab'
import ExamsTab from './ExamsTab'
import UsersTab from './UsersTab'
import AnalyticsTab from './AnalyticsTab'
import AnnouncementsTab from './AnnouncementsTab'
import NotificationsTab from './NotificationsTab'
import SettingsTab from './SettingsTab'

type AdminTab = 'dashboard' | 'exams' | 'users' | 'analytics' | 'announcements' | 'notifications' | 'settings'

export default function AdminPanel() {
  // --- Auth ---
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // --- Tab ---
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard')

  // --- Data ---
  const [allResults, setAllResults] = useState<TestResult[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  // --- Load data on mount ---
  useEffect(() => {
    async function loadData() {
      // Load announcements
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
  }, [])

  // Refresh user data periodically
  useEffect(() => {
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
  }, [])

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

  const ADMIN_PASSWORD = 'admin123'

  const handleRefreshResults = () => setAllResults(getResults())

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
            <img src="/logo.png" alt="MockMaster" className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-xl shadow-slate-900/50 border border-white/10" />
            <h1 className="text-white text-2xl font-bold">Admin Panel</h1>
            <p className="text-slate-400 text-sm mt-1">MockMaster Management</p>
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
                      if (e.key === 'Enter' && adminPassword === ADMIN_PASSWORD) {
                        setAdminLoggedIn(true)
                        setAdminPassword('')
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

                <Button
                  className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl h-11 font-semibold"
                  onClick={() => {
                    if (adminPassword === ADMIN_PASSWORD) {
                      setAdminLoggedIn(true)
                      setAdminPassword('')
                    }
                  }}
                >
                  <Shield className="w-4 h-4 mr-2" /> Login
                </Button>

                {adminPassword && adminPassword !== ADMIN_PASSWORD && adminPassword.length > 3 && (
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
              <p className="text-slate-400 text-[11px]">MockMaster Management</p>
            </div>
            <button
              onClick={() => setAdminLoggedIn(false)}
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
