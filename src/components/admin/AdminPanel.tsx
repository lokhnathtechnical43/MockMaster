'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BookOpen, Trophy, ArrowLeft, Shield, LogOut, Lock,
  Bell, Flame, Zap, Building, XCircle, AlertTriangle, Gift, Plus,
  Eye, EyeOff, BarChart3, Users, FileText, Settings, Home,
  CheckCircle2, ChevronRight, Trash2, Edit3, Save, RefreshCw, Clock
} from 'lucide-react'
import {
  type Announcement, type Notification,
  getAnnouncements, getNotifications,
  saveAnnouncements, saveNotifications,
  DEFAULT_ANNOUNCEMENTS, DEFAULT_NOTIFICATIONS
} from '@/lib/admin-data'
import { getResults, type TestResult } from '@/lib/local-data'
import Link from 'next/link'

export default function AdminPanel() {
  // --- Auth ---
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // --- Tab ---
  const [adminTab, setAdminTab] = useState<'announcements' | 'notifications' | 'dashboard' | 'users'>('dashboard')

  // --- User Data ---
  const [allResults, setAllResults] = useState<TestResult[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [userSearchQuery, setUserSearchQuery] = useState('')

  // --- Announcements ---
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [newAnnTitle, setNewAnnTitle] = useState('')
  const [newAnnSubtitle, setNewAnnSubtitle] = useState('')
  const [newAnnGradient, setNewAnnGradient] = useState('from-orange-500 to-red-500')
  const [newAnnImage, setNewAnnImage] = useState('ssc')

  // --- Notifications ---
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [newNotifTitle, setNewNotifTitle] = useState('')
  const [newNotifMessage, setNewNotifMessage] = useState('')
  const [newNotifType, setNewNotifType] = useState<'update' | 'alert' | 'info'>('info')

  // --- Load data on mount ---
  useEffect(() => {
    setAnnouncements(getAnnouncements())
    setNotifications(getNotifications())
    setAllResults(getResults())
  }, [])

  // Refresh user data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setAllResults(getResults())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // --- Save data whenever it changes ---
  useEffect(() => {
    if (announcements.length > 0) {
      saveAnnouncements(announcements)
    }
  }, [announcements])

  useEffect(() => {
    if (notifications.length > 0) {
      saveNotifications(notifications)
    }
  }, [notifications])

  const ADMIN_PASSWORD = 'admin123'

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

  // --- Dashboard Stats ---
  const totalAnnouncements = announcements.length
  const totalNotifications = notifications.length
  const unreadNotifications = notifications.filter(n => !n.read).length

  // --- Admin Panel (Logged In) ---
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
              onClick={() => setAdminLoggedIn(false)}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5">
            {[
              { id: 'dashboard' as const, icon: BarChart3, label: 'Dashboard' },
              { id: 'users' as const, icon: Users, label: 'Users' },
              { id: 'announcements' as const, icon: Flame, label: 'Announcements' },
              { id: 'notifications' as const, icon: Bell, label: 'Notifications' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  adminTab === tab.id
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* ===== DASHBOARD TAB ===== */}
        {adminTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <Flame className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{totalAnnouncements}</p>
                      <p className="text-orange-500/70 text-xs">Announcements</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{totalNotifications}</p>
                      <p className="text-blue-500/70 text-xs">Notifications</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">21+</p>
                      <p className="text-emerald-500/70 text-xs">Exams</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-violet-50 to-violet-100/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-violet-600">{new Set(allResults.map(r => r.userId)).size}</p>
                      <p className="text-violet-500/70 text-xs">Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" /> Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAdminTab('users')}
                    className="p-3 rounded-xl bg-violet-50 hover:bg-violet-100 transition-colors text-left"
                  >
                    <Users className="w-5 h-5 text-violet-500 mb-1" />
                    <p className="font-semibold text-xs text-violet-700">View Users</p>
                    <p className="text-violet-500/60 text-[10px]">{new Set(allResults.map(r => r.userId)).size} users</p>
                  </button>
                  <button
                    onClick={() => setAdminTab('announcements')}
                    className="p-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors text-left"
                  >
                    <Plus className="w-5 h-5 text-orange-500 mb-1" />
                    <p className="font-semibold text-xs text-orange-700">New Announcement</p>
                    <p className="text-orange-500/60 text-[10px]">Add banner to home</p>
                  </button>
                  <button
                    onClick={() => setAdminTab('notifications')}
                    className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-left"
                  >
                    <Bell className="w-5 h-5 text-blue-500 mb-1" />
                    <p className="font-semibold text-xs text-blue-700">Send Notification</p>
                    <p className="text-blue-500/60 text-[10px]">Alert all users</p>
                  </button>
                  <Link
                    href="/"
                    className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors text-left block"
                  >
                    <Home className="w-5 h-5 text-emerald-500 mb-1" />
                    <p className="font-semibold text-xs text-emerald-700">View App</p>
                    <p className="text-emerald-500/60 text-[10px]">Open user app</p>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" /> Recent Items
                </h3>
                <div className="space-y-2">
                  {announcements.slice(0, 3).map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${a.gradient} flex items-center justify-center flex-shrink-0`}>
                        {a.image === 'ssc' && <BookOpen className="w-4 h-4 text-white" />}
                        {a.image === 'banking' && <Building className="w-4 h-4 text-white" />}
                        {a.image === 'leaderboard' && <Trophy className="w-4 h-4 text-white" />}
                        {a.image === 'practice' && <Zap className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{a.title}</p>
                        <p className="text-gray-400 text-[10px] truncate">{a.subtitle}</p>
                      </div>
                      <Badge variant="secondary" className="text-[9px]">Announcement</Badge>
                    </div>
                  ))}
                  {notifications.slice(0, 2).map(n => (
                    <div key={n.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        n.type === 'update' ? 'bg-blue-100' :
                        n.type === 'alert' ? 'bg-amber-100' :
                        'bg-green-100'
                      }`}>
                        {n.type === 'update' ? <Zap className="w-4 h-4 text-blue-500" /> :
                         n.type === 'alert' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                         <Gift className="w-4 h-4 text-green-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{n.title}</p>
                        <p className="text-gray-400 text-[10px] truncate">{n.message}</p>
                      </div>
                      <Badge variant="secondary" className="text-[9px]">{n.type}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== USERS TAB ===== */}
        {adminTab === 'users' && (
          <div className="space-y-4">
            {/* User Stats Overview */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-0 shadow-md bg-gradient-to-br from-violet-50 to-violet-100/50">
                <CardContent className="p-3 text-center">
                  <Users className="w-5 h-5 text-violet-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-violet-600">{new Set(allResults.map(r => r.userId)).size}</p>
                  <p className="text-violet-500/70 text-[10px]">Total Users</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100/50">
                <CardContent className="p-3 text-center">
                  <FileText className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-emerald-600">{allResults.length}</p>
                  <p className="text-emerald-500/70 text-[10px]">Tests Taken</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100/50">
                <CardContent className="p-3 text-center">
                  <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-amber-600">{allResults.length > 0 ? Math.round(allResults.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) / allResults.length) : 0}%</p>
                  <p className="text-amber-500/70 text-[10px]">Avg Score</p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={e => { setUserSearchQuery(e.target.value); setSelectedUserId(null) }}
                    placeholder="Search by User ID or Phone..."
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setAllResults(getResults())}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* User List or User Detail */}
            {selectedUserId ? (
              /* ===== USER DETAIL VIEW ===== */
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-800 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Users
                </button>

                {/* User Header */}
                <Card className="border-0 shadow-md bg-gradient-to-r from-violet-600 to-indigo-600">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                        <Users className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg">
                          {selectedUserId.startsWith('guest_') ? 'Guest User' : 'Phone User'}
                        </h3>
                        <p className="text-white/60 text-xs font-mono mt-0.5">{selectedUserId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-2xl">{allResults.filter(r => r.userId === selectedUserId).length}</p>
                        <p className="text-white/60 text-[10px]">Tests Taken</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* User Stats */}
                {(() => {
                  const userResults = allResults.filter(r => r.userId === selectedUserId)
                  const avgScore = userResults.length > 0 ? Math.round(userResults.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) / userResults.length) : 0
                  const bestScore = userResults.length > 0 ? Math.max(...userResults.map(r => (r.score / r.maxScore) * 100)) : 0
                  const totalTime = userResults.reduce((sum, r) => sum + r.timeTaken, 0)
                  const totalCorrect = userResults.reduce((sum, r) => sum + r.correctCount, 0)
                  const totalWrong = userResults.reduce((sum, r) => sum + r.wrongCount, 0)
                  const totalSkipped = userResults.reduce((sum, r) => sum + r.skippedCount, 0)
                  const totalQuestions = totalCorrect + totalWrong + totalSkipped
                  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-3">
                          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Avg Score</p>
                          <p className="text-xl font-bold text-violet-600">{avgScore}%</p>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-3">
                          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Best Score</p>
                          <p className="text-xl font-bold text-emerald-600">{Math.round(bestScore)}%</p>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-3">
                          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Accuracy</p>
                          <p className="text-xl font-bold text-amber-600">{accuracy}%</p>
                          <p className="text-gray-300 text-[9px]">{totalCorrect} correct / {totalQuestions} total</p>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-3">
                          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Total Time</p>
                          <p className="text-xl font-bold text-blue-600">{Math.floor(totalTime / 60)}m</p>
                          <p className="text-gray-300 text-[9px]">{totalTime % 60}s remaining</p>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}

                {/* User's Test History */}
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-violet-500" /> Test History
                    </h3>
                    <div className="space-y-2">
                      {allResults
                        .filter(r => r.userId === selectedUserId)
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map(result => (
                          <div key={result.id} className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{result.testName}</p>
                                <p className="text-gray-400 text-xs">{result.examName}</p>
                              </div>
                              <Badge className={`text-[9px] ml-2 ${
                                (result.score / result.maxScore) >= 0.7 ? 'bg-emerald-100 text-emerald-700' :
                                (result.score / result.maxScore) >= 0.4 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {Math.round((result.score / result.maxScore) * 100)}%
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {result.correctCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-red-500" /> {result.wrongCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-500" /> {result.skippedCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-blue-500" /> {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                              </span>
                            </div>
                            <p className="text-gray-300 text-[9px] mt-1">{new Date(result.createdAt).toLocaleString()}</p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* ===== USER LIST VIEW ===== */
              <div className="space-y-3">
                {(() => {
                  // Group results by userId
                  const userMap = new Map<string, { results: TestResult[], userId: string }>()
                  allResults.forEach(r => {
                    if (!userMap.has(r.userId)) {
                      userMap.set(r.userId, { results: [], userId: r.userId })
                    }
                    userMap.get(r.userId)!.results.push(r)
                  })

                  const users = Array.from(userMap.values())
                    .map(u => ({
                      ...u,
                      totalTests: u.results.length,
                      avgScore: Math.round(u.results.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) / u.results.length),
                      lastActive: u.results.reduce((latest, r) => {
                        const d = new Date(r.createdAt)
                        return d > latest ? d : latest
                      }, new Date(0)),
                      isGuest: u.userId.startsWith('guest_'),
                    }))
                    .filter(u => {
                      if (!userSearchQuery) return true
                      const q = userSearchQuery.toLowerCase()
                      return u.userId.toLowerCase().includes(q)
                    })
                    .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime())

                  return users.length === 0 ? (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-8 text-center">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm font-medium">
                          {allResults.length === 0 ? 'No user data yet' : 'No users found'}
                        </p>
                        <p className="text-gray-300 text-xs mt-1">
                          {allResults.length === 0
                            ? 'Users will appear here when they start taking tests'
                            : 'Try a different search query'}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    users.map(user => (
                      <Card key={user.userId} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedUserId(user.userId)}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                              user.isGuest
                                ? 'bg-gray-100'
                                : 'bg-gradient-to-br from-violet-500 to-indigo-500'
                            }`}>
                              {user.isGuest
                                ? <Users className="w-5 h-5 text-gray-500" />
                                : <span className="text-white font-bold text-sm">{user.userId.slice(0, 2).toUpperCase()}</span>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">
                                  {user.isGuest ? 'Guest User' : 'Phone User'}
                                </p>
                                <Badge variant="secondary" className={`text-[9px] ${
                                  user.isGuest ? 'bg-gray-100 text-gray-600' : 'bg-violet-100 text-violet-700'
                                }`}>
                                  {user.isGuest ? 'Guest' : 'Verified'}
                                </Badge>
                              </div>
                              <p className="text-gray-400 text-[10px] font-mono truncate">{user.userId}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="flex items-center gap-1 justify-end">
                                <p className="text-lg font-bold" style={{ color: user.avgScore >= 70 ? '#059669' : user.avgScore >= 40 ? '#d97706' : '#dc2626' }}>
                                  {user.avgScore}%
                                </p>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                              </div>
                              <p className="text-gray-400 text-[10px]">{user.totalTests} tests</p>
                              <p className="text-gray-300 text-[9px]">{user.lastActive.toLocaleDateString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {/* ===== ANNOUNCEMENTS TAB ===== */}
        {adminTab === 'announcements' && (
          <div className="space-y-4">
            {/* Add New Announcement */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-orange-500" /> Add New Announcement
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newAnnTitle}
                    onChange={e => setNewAnnTitle(e.target.value)}
                    placeholder="Title (e.g. SSC CGL 2025)"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <input
                    type="text"
                    value={newAnnSubtitle}
                    onChange={e => setNewAnnSubtitle(e.target.value)}
                    placeholder="Subtitle (e.g. New Mock Tests Added!)"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Gradient Color</p>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { label: 'Orange', value: 'from-orange-500 to-red-500' },
                        { label: 'Blue', value: 'from-blue-500 to-indigo-500' },
                        { label: 'Green', value: 'from-emerald-500 to-teal-500' },
                        { label: 'Purple', value: 'from-purple-500 to-pink-500' },
                        { label: 'Red', value: 'from-red-500 to-rose-500' },
                        { label: 'Cyan', value: 'from-cyan-500 to-blue-500' },
                      ].map(g => (
                        <button
                          key={g.value}
                          onClick={() => setNewAnnGradient(g.value)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                            newAnnGradient === g.value
                              ? `bg-gradient-to-r ${g.value} text-white shadow-sm`
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Icon</p>
                    <div className="flex gap-2">
                      {[
                        { label: 'Book', value: 'ssc', icon: <BookOpen className="w-4 h-4" /> },
                        { label: 'Building', value: 'banking', icon: <Building className="w-4 h-4" /> },
                        { label: 'Trophy', value: 'leaderboard', icon: <Trophy className="w-4 h-4" /> },
                        { label: 'Zap', value: 'practice', icon: <Zap className="w-4 h-4" /> },
                      ].map(ic => (
                        <button
                          key={ic.value}
                          onClick={() => setNewAnnImage(ic.value)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            newAnnImage === ic.value
                              ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-300'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {ic.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl h-11 font-semibold"
                    disabled={!newAnnTitle || !newAnnSubtitle}
                    onClick={() => {
                      const newAnn: Announcement = {
                        id: Date.now().toString(),
                        image: newAnnImage,
                        title: newAnnTitle,
                        subtitle: newAnnSubtitle,
                        action: 'exams',
                        gradient: newAnnGradient,
                      }
                      setAnnouncements(prev => [...prev, newAnn])
                      setNewAnnTitle('')
                      setNewAnnSubtitle('')
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Announcement
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Announcements */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="font-bold text-sm">Current Announcements ({announcements.length})</h3>
                {announcements.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Reset announcements to defaults?')) {
                        setAnnouncements(DEFAULT_ANNOUNCEMENTS)
                      }
                    }}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {announcements.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 text-center">
                      <Flame className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No announcements yet</p>
                      <p className="text-gray-300 text-xs">Add your first announcement above</p>
                    </CardContent>
                  </Card>
                ) : (
                  announcements.map((a, i) => (
                    <Card key={a.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center flex-shrink-0`}>
                          {a.image === 'ssc' && <BookOpen className="w-5 h-5 text-white" />}
                          {a.image === 'banking' && <Building className="w-5 h-5 text-white" />}
                          {a.image === 'leaderboard' && <Trophy className="w-5 h-5 text-white" />}
                          {a.image === 'practice' && <Zap className="w-5 h-5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{a.title}</p>
                          <p className="text-gray-400 text-xs truncate">{a.subtitle}</p>
                        </div>
                        <button
                          onClick={() => {
                            const updated = announcements.filter((_, idx) => idx !== i)
                            setAnnouncements(updated)
                          }}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== NOTIFICATIONS TAB ===== */}
        {adminTab === 'notifications' && (
          <div className="space-y-4">
            {/* Send New Notification */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-500" /> Send Notification
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newNotifTitle}
                    onChange={e => setNewNotifTitle(e.target.value)}
                    placeholder="Title (e.g. New Update Available)"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <textarea
                    value={newNotifMessage}
                    onChange={e => setNewNotifMessage(e.target.value)}
                    placeholder="Message (e.g. A new version is available...)"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                  />
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Type</p>
                    <div className="flex gap-2">
                      {[
                        { label: 'Info', value: 'info' as const, color: 'bg-green-100 text-green-700' },
                        { label: 'Update', value: 'update' as const, color: 'bg-blue-100 text-blue-700' },
                        { label: 'Alert', value: 'alert' as const, color: 'bg-amber-100 text-amber-700' },
                      ].map(t => (
                        <button
                          key={t.value}
                          onClick={() => setNewNotifType(t.value)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            newNotifType === t.value ? t.color : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl h-11 font-semibold"
                    disabled={!newNotifTitle || !newNotifMessage}
                    onClick={() => {
                      const newNotif: Notification = {
                        id: Date.now().toString(),
                        title: newNotifTitle,
                        message: newNotifMessage,
                        time: 'Just now',
                        read: false,
                        type: newNotifType,
                      }
                      setNotifications(prev => [newNotif, ...prev])
                      setNewNotifTitle('')
                      setNewNotifMessage('')
                    }}
                  >
                    <Bell className="w-4 h-4 mr-1" /> Send Notification
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Notifications */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="font-bold text-sm">Current Notifications ({notifications.length})</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Reset notifications to defaults?')) {
                        setNotifications(DEFAULT_NOTIFICATIONS)
                      }
                    }}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 text-center">
                      <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No notifications yet</p>
                      <p className="text-gray-300 text-xs">Send your first notification above</p>
                    </CardContent>
                  </Card>
                ) : (
                  notifications.map((n, i) => (
                    <Card key={n.id} className={`border-0 shadow-sm hover:shadow-md transition-shadow ${!n.read ? 'border-l-4 border-l-orange-400' : ''}`}>
                      <CardContent className="p-3 flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          n.type === 'update' ? 'bg-blue-100' :
                          n.type === 'alert' ? 'bg-amber-100' :
                          'bg-green-100'
                        }`}>
                          {n.type === 'update' ? <Zap className="w-4 h-4 text-blue-500" /> :
                           n.type === 'alert' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                           <Gift className="w-4 h-4 text-green-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm truncate">{n.title}</p>
                            {!n.read && <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />}
                          </div>
                          <p className="text-gray-400 text-xs truncate">{n.message}</p>
                          <p className="text-gray-300 text-[10px] mt-0.5">{n.time}</p>
                        </div>
                        <button
                          onClick={() => {
                            const updated = notifications.filter((_, idx) => idx !== i)
                            setNotifications(updated)
                          }}
                          className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
