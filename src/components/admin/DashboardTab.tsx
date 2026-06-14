'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen, Trophy, Flame, Zap, Building, Bell,
  Users, FileText, Home, Plus, XCircle, AlertTriangle, Gift,
  CheckCircle2
} from 'lucide-react'
import {
  type Announcement, type Notification,
  DEFAULT_ANNOUNCEMENTS, DEFAULT_NOTIFICATIONS
} from '@/lib/admin-data'
import { type TestResult, getCategories } from '@/lib/local-data'
import { getDashboardStats, type DashboardStats } from '@/lib/firestore-service'
import Link from 'next/link'

interface DashboardTabProps {
  announcements: Announcement[]
  notifications: Notification[]
  allResults: TestResult[]
  onSwitchTab: (tab: string) => void
}

export default function DashboardTab({ announcements, notifications, allResults, onSwitchTab }: DashboardTabProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const totalAnnouncements = announcements.length
  const totalNotifications = notifications.length
  const unreadNotifications = notifications.filter(n => !n.read).length

  useEffect(() => {
    setLoadingStats(true)
    getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoadingStats(false))
  }, [])

  const totalUsers = stats?.totalUsers ?? new Set(allResults.map(r => r.userId)).size
  const totalTestsTaken = stats?.totalResults ?? allResults.length
  const avgScore = stats?.avgScore ?? (allResults.length > 0
    ? Math.round(allResults.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) / allResults.length)
    : 0)

  return (
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
                <p className="text-2xl font-bold text-emerald-600">{(() => { try { return getCategories().reduce((sum, c) => sum + c.exams.length, 0); } catch { return '21+' } })()}</p>
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
                <p className="text-2xl font-bold text-violet-600">{totalUsers}</p>
                <p className="text-violet-500/70 text-xs">Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{totalTestsTaken}</p>
                <p className="text-amber-500/70 text-xs">Tests Taken</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-rose-50 to-rose-100/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-rose-600">{avgScore}%</p>
                <p className="text-rose-500/70 text-xs">Avg Score</p>
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
              onClick={() => onSwitchTab('users')}
              className="p-3 rounded-xl bg-violet-50 hover:bg-violet-100 transition-colors text-left"
            >
              <Users className="w-5 h-5 text-violet-500 mb-1" />
              <p className="font-semibold text-xs text-violet-700">View Users</p>
              <p className="text-violet-500/60 text-[10px]">{totalUsers} users</p>
            </button>
            <button
              onClick={() => onSwitchTab('exams')}
              className="p-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors text-left"
            >
              <BookOpen className="w-5 h-5 text-orange-500 mb-1" />
              <p className="font-semibold text-xs text-orange-700">Manage Exams</p>
              <p className="text-orange-500/60 text-[10px]">Categories & tests</p>
            </button>
            <button
              onClick={() => onSwitchTab('notifications')}
              className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-left"
            >
              <Bell className="w-5 h-5 text-blue-500 mb-1" />
              <p className="font-semibold text-xs text-blue-700">Send Notification</p>
              <p className="text-blue-500/60 text-[10px]">{unreadNotifications} unread</p>
            </button>
            <button
              onClick={() => onSwitchTab('analytics')}
              className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors text-left"
            >
              <Trophy className="w-5 h-5 text-emerald-500 mb-1" />
              <p className="font-semibold text-xs text-emerald-700">Analytics</p>
              <p className="text-emerald-500/60 text-[10px]">Charts & stats</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" /> Recent Items
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
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
            {allResults.length === 0 && announcements.length === 0 && notifications.length === 0 && (
              <p className="text-gray-400 text-xs text-center py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
