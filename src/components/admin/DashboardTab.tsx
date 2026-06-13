'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen, Trophy, Flame, Zap, Building, Bell,
  Users, FileText, AlertTriangle, AlertCircle, Gift,
  CheckCircle2, Edit3, Database
} from 'lucide-react'
import {
  type Announcement, type Notification,
  DEFAULT_ANNOUNCEMENTS, DEFAULT_NOTIFICATIONS
} from '@/lib/admin-data'
import { type TestResult } from '@/lib/local-data'
import { getDashboardStats, forceSeedFirestore, type DashboardStats } from '@/lib/firestore-service'
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
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<string | null>(null)

  const totalAnnouncements = announcements.length
  const totalNotifications = notifications.length
  const unreadNotifications = notifications.filter(n => !n.read).length

  const handleForceSeed = async () => {
    if (!confirm('This will DELETE all existing data and replace it with sample data. Are you sure?')) return
    setSeeding(true)
    setSeedResult(null)
    try {
      const success = await forceSeedFirestore()
      if (success) {
        setSeedResult('Database seeded successfully! Refreshing...')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setSeedResult('Failed to seed database. Check browser console (F12) for detailed error.')
      }
    } catch (e: any) {
      console.error('[Dashboard] Seed error:', e)
      const msg = e?.message || 'Unknown error'
      setSeedResult(`Seed failed: ${msg}. Check console for details.`)
    }
    setSeeding(false)
  }

  useEffect(() => {
    setLoadingStats(true)
    getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoadingStats(false))
  }, [])

  const totalUsers = stats?.totalUsers ?? new Set(allResults.map(r => r.userId)).size
  const totalTestsTaken = stats?.totalResults ?? allResults.length
  const totalExams = stats?.totalExams ?? 0
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
                <p className="text-2xl font-bold text-emerald-600">{totalExams}</p>
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

          {/* Seed Database Button */}
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-indigo-700 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> Seed Database
                </p>
                <p className="text-indigo-500/60 text-[10px] mt-0.5">Load sample data for all categories, exams, tests & questions</p>
              </div>
              <Button
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl h-9 px-4 text-xs font-bold shadow-md"
                onClick={handleForceSeed}
                disabled={seeding}
              >
                {seeding ? (
                  <><AlertCircle className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Seeding...</>
                ) : (
                  <><Database className="w-3.5 h-3.5 mr-1.5" /> Seed Now</>
                )}
              </Button>
            </div>
            {seedResult && (
              <p className={`text-xs mt-2 font-medium ${seedResult.includes('success') ? 'text-emerald-600' : 'text-red-500'}`}>
                {seedResult}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" /> Recent Items
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => onSwitchTab('announcements')}
                className="text-[11px] text-orange-500 hover:text-orange-700 font-medium flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-3 h-3" /> Edit Announcements
              </button>
              <button
                onClick={() => onSwitchTab('notifications')}
                className="text-[11px] text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-3 h-3" /> Edit Notifications
              </button>
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {announcements.slice(0, 3).map(a => (
              <div
                key={a.id}
                onClick={() => onSwitchTab('announcements')}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-orange-50 transition-colors cursor-pointer"
              >
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
                <Edit3 className="w-3 h-3 text-gray-300" />
              </div>
            ))}
            {notifications.slice(0, 2).map(n => (
              <div
                key={n.id}
                onClick={() => onSwitchTab('notifications')}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors cursor-pointer"
              >
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
                <Edit3 className="w-3 h-3 text-gray-300" />
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
