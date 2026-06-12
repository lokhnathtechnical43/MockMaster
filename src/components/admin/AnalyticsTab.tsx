'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3, Users, Trophy, TrendingUp, Activity,
  BookOpen, Clock, CheckCircle2
} from 'lucide-react'
import {
  getDashboardStats, getDailyStats, getResults, getCategories,
  type DashboardStats, type DailyStats, type FirestoreTestResult
} from '@/lib/firestore-service'
import { type TestResult, getResults as getLocalResults, getCategories as getLocalCategories } from '@/lib/local-data'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'

const CHART_COLORS = ['#f97316', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

interface AnalyticsTabProps {
  allResults: TestResult[]
}

export default function AnalyticsTab({ allResults }: AnalyticsTabProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [dashboardStats, daily, results] = await Promise.all([
          getDashboardStats(),
          getDailyStats(7),
          getResults()
        ])
        setStats(dashboardStats)
        setDailyStats(daily)

        // Category popularity from results
        const catMap = new Map<string, number>()
        const resArr = results as FirestoreTestResult[]
        resArr.forEach(r => {
          const examName = r.examName || 'Unknown'
          catMap.set(examName, (catMap.get(examName) || 0) + 1)
        })
        const catData = Array.from(catMap.entries()).map(([name, value], i) => ({
          name, value, color: CHART_COLORS[i % CHART_COLORS.length]
        }))
        setCategoryData(catData.length > 0 ? catData : [
          { name: 'SSC', value: 35, color: '#f97316' },
          { name: 'Banking', value: 25, color: '#8b5cf6' },
          { name: 'Railway', value: 20, color: '#10b981' },
          { name: 'Others', value: 20, color: '#f59e0b' },
        ])
      } catch {
        // Fallback: compute from local data
        const totalUsers = new Set(allResults.map(r => r.userId)).size
        const avgScore = allResults.length > 0
          ? Math.round(allResults.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) / allResults.length)
          : 0
        setStats({
          totalUsers, totalTests: 0, totalResults: allResults.length,
          avgScore, recentActivity: []
        })

        // Generate fake daily stats from local results
        const last7 = Array.from({ length: 7 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - i))
          const dateStr = date.toISOString().split('T')[0]
          const dayResults = allResults.filter(r => r.createdAt.startsWith(dateStr))
          return {
            date: dateStr,
            results: dayResults.length,
            avgScore: dayResults.length > 0
              ? Math.round(dayResults.reduce((s, r) => s + (r.score / r.maxScore) * 100, 0) / dayResults.length)
              : 0,
            uniqueUsers: new Set(dayResults.map(r => r.userId)).size
          }
        })
        setDailyStats(last7)

        setCategoryData([
          { name: 'SSC', value: 35, color: '#f97316' },
          { name: 'Banking', value: 25, color: '#8b5cf6' },
          { name: 'Railway', value: 20, color: '#10b981' },
          { name: 'Others', value: 20, color: '#f59e0b' },
        ])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [allResults])

  // Top performers from local results
  const userMap = new Map<string, { results: TestResult[], userId: string }>()
  allResults.forEach(r => {
    if (!userMap.has(r.userId)) userMap.set(r.userId, { results: [], userId: r.userId })
    userMap.get(r.userId)!.results.push(r)
  })
  const topPerformers = Array.from(userMap.values())
    .map(u => ({
      userId: u.userId,
      avgScore: Math.round(u.results.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) / u.results.length),
      testsCompleted: u.results.length,
      isGuest: u.userId.startsWith('guest_'),
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5)

  const totalUsers = stats?.totalUsers ?? new Set(allResults.map(r => r.userId)).size
  const totalResults = stats?.totalResults ?? allResults.length
  const avgScore = stats?.avgScore ?? (allResults.length > 0
    ? Math.round(allResults.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) / allResults.length)
    : 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 text-gray-400 animate-pulse mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-md bg-gradient-to-br from-violet-50 to-violet-100/50">
          <CardContent className="p-3 text-center">
            <Users className="w-5 h-5 text-violet-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-violet-600">{totalUsers}</p>
            <p className="text-violet-500/70 text-[10px]">Total Users</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-3 text-center">
            <Activity className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-emerald-600">{totalResults}</p>
            <p className="text-emerald-500/70 text-[10px]">Tests Taken</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-3 text-center">
            <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-amber-600">{avgScore}%</p>
            <p className="text-amber-500/70 text-[10px]">Avg Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Results Chart */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-500" /> Daily Results (Last 7 Days)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="results" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Tests" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Score Trend Line */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Score Trend
          </h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="avgScore" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="Avg Score %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Popularity Pie */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-orange-500" /> Category Popularity
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-36 h-36 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={30} outerRadius={60} dataKey="value" paddingAngle={2}>
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 flex-1">
              {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs truncate flex-1">{cat.name}</span>
                  <span className="text-xs text-gray-400 font-medium">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Top Performers
          </h3>
          {topPerformers.length === 0 ? (
            <p className="text-gray-400 text-xs text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-2">
              {topPerformers.map((user, i) => (
                <div key={user.userId} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-gray-200 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{user.isGuest ? 'Guest User' : user.userId}</p>
                    <p className="text-gray-400 text-[10px]">{user.testsCompleted} tests</p>
                  </div>
                  <Badge className={`text-[9px] ${
                    user.avgScore >= 70 ? 'bg-emerald-100 text-emerald-700' :
                    user.avgScore >= 40 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {user.avgScore}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" /> Recent Activity
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allResults.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-4">No recent activity</p>
            ) : (
              allResults
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 10)
                .map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{r.testName}</p>
                      <p className="text-gray-400 text-[10px]">{r.examName} • {r.userId.startsWith('guest_') ? 'Guest' : r.userId.slice(0, 8)}</p>
                    </div>
                    <Badge variant="secondary" className="text-[9px]">
                      {Math.round((r.score / r.maxScore) * 100)}%
                    </Badge>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
