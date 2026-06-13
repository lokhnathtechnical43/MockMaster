'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Users, FileText, Trophy, ArrowLeft, RefreshCw, Clock,
  CheckCircle2, ChevronRight, XCircle, AlertTriangle,
  Trash2, Download, ShieldBan, ShieldCheck
} from 'lucide-react'
import { type TestResult, getResults } from '@/lib/local-data'
import {
  getAllUsers, deleteUser as fsDeleteUser, updateUser as fsUpdateUser,
  type FirestoreUser
} from '@/lib/firestore-service'

interface UsersTabProps {
  allResults: TestResult[]
  onRefresh: () => void
}

export default function UsersTab({ allResults, onRefresh }: UsersTabProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [fsUsers, setFsUsers] = useState<FirestoreUser[]>([])
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set())
  const [loadingFsUsers, setLoadingFsUsers] = useState(false)

  useEffect(() => {
    setLoadingFsUsers(true)
    getAllUsers()
      .then(users => {
        setFsUsers(users)
        const banned = users.filter(u => u.role === 'banned').map(u => u.id)
        setBannedUsers(new Set(banned))
      })
      .catch(() => {})
      .finally(() => setLoadingFsUsers(false))
  }, [])

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user and all their data? This cannot be undone.')) return
    try {
      await fsDeleteUser(userId)
      setFsUsers(prev => prev.filter(u => u.id !== userId))
      alert('User deleted successfully')
    } catch {
      alert('Failed to delete user from Firestore. Local data may persist.')
    }
  }

  const handleToggleBan = async (userId: string) => {
    const isBanned = bannedUsers.has(userId)
    try {
      await fsUpdateUser(userId, { role: isBanned ? 'user' : 'banned' })
      setBannedUsers(prev => {
        const next = new Set(prev)
        if (isBanned) next.delete(userId)
        else next.add(userId)
        return next
      })
    } catch {
      alert('Failed to update user status')
    }
  }

  const handleExportUser = (userId: string) => {
    const userResults = allResults.filter(r => r.userId === userId)
    const fsUser = fsUsers.find(u => u.id === userId)
    const data = {
      userId,
      profile: fsUser || { id: userId, name: 'Unknown' },
      results: userResults,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user_${userId}_export.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportAllUsers = () => {
    const data = {
      totalUsers: new Set(allResults.map(r => r.userId)).size,
      totalResults: allResults.length,
      users: Array.from(new Set(allResults.map(r => r.userId))).map(uid => ({
        userId: uid,
        results: allResults.filter(r => r.userId === uid)
      })),
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'all_users_export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Group results by userId
  const userMap = new Map<string, { results: TestResult[], userId: string }>()
  allResults.forEach(r => {
    if (!userMap.has(r.userId)) userMap.set(r.userId, { results: [], userId: r.userId })
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

  return (
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

      {/* Search + Actions */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={userSearchQuery}
              onChange={e => { setUserSearchQuery(e.target.value); setSelectedUserId(null) }}
              placeholder="Search by User ID or Phone..."
              className="flex-1 rounded-xl"
            />
            <Button variant="outline" size="sm" className="rounded-xl" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={handleExportAllUsers} title="Export All">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User List or Detail */}
      {selectedUserId ? (
        <UserDetailView
          userId={selectedUserId}
          allResults={allResults}
          isBanned={bannedUsers.has(selectedUserId)}
          onBack={() => setSelectedUserId(null)}
          onDelete={() => { handleDeleteUser(selectedUserId); setSelectedUserId(null) }}
          onToggleBan={() => handleToggleBan(selectedUserId)}
          onExport={() => handleExportUser(selectedUserId)}
        />
      ) : (
        <div className="space-y-3">
          {users.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">
                  {allResults.length === 0 ? 'No user data yet' : 'No users found'}
                </p>
                <p className="text-gray-300 text-xs mt-1">
                  {allResults.length === 0 ? 'Users will appear here when they start taking tests' : 'Try a different search query'}
                </p>
              </CardContent>
            </Card>
          ) : (
            users.map(user => (
              <Card key={user.userId} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedUserId(user.userId)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                      user.isGuest ? 'bg-gray-100' : 'bg-gradient-to-br from-violet-500 to-indigo-500'
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
                        {bannedUsers.has(user.userId) && (
                          <Badge className="text-[9px] bg-red-100 text-red-700">Banned</Badge>
                        )}
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
          )}
        </div>
      )}
    </div>
  )
}

// --- User Detail View Sub-component ---
function UserDetailView({ userId, allResults, isBanned, onBack, onDelete, onToggleBan, onExport }: {
  userId: string
  allResults: TestResult[]
  isBanned: boolean
  onBack: () => void
  onDelete: () => void
  onToggleBan: () => void
  onExport: () => void
}) {
  const userResults = allResults.filter(r => r.userId === userId)
  const avgScore = userResults.length > 0 ? Math.round(userResults.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) / userResults.length) : 0
  const bestScore = userResults.length > 0 ? Math.max(...userResults.map(r => (r.score / r.maxScore) * 100)) : 0
  const totalTime = userResults.reduce((sum, r) => sum + r.timeTaken, 0)
  const totalCorrect = userResults.reduce((sum, r) => sum + r.correctCount, 0)
  const totalWrong = userResults.reduce((sum, r) => sum + r.wrongCount, 0)
  const totalSkipped = userResults.reduce((sum, r) => sum + r.skippedCount, 0)
  const totalQuestions = totalCorrect + totalWrong + totalSkipped
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-800 font-medium">
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
                {userId.startsWith('guest_') ? 'Guest User' : 'Phone User'}
              </h3>
              <p className="text-white/60 text-xs font-mono mt-0.5">{userId}</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-2xl">{userResults.length}</p>
              <p className="text-white/60 text-[10px]">Tests Taken</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="rounded-xl text-xs flex-1" onClick={onExport}>
          <Download className="w-3 h-3 mr-1" /> Export Data
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`rounded-xl text-xs flex-1 ${isBanned ? 'border-emerald-300 text-emerald-600' : 'border-red-300 text-red-600'}`}
          onClick={onToggleBan}
        >
          {isBanned ? <><ShieldCheck className="w-3 h-3 mr-1" /> Unban</> : <><ShieldBan className="w-3 h-3 mr-1" /> Ban</>}
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl text-xs border-red-300 text-red-600" onClick={onDelete}>
          <Trash2 className="w-3 h-3 mr-1" /> Delete
        </Button>
      </div>

      {/* User Stats */}
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

      {/* Test History */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-500" /> Test History
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {userResults
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
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {result.correctCount}</span>
                    <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" /> {result.wrongCount}</span>
                    <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" /> {result.skippedCount}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-blue-500" /> {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</span>
                  </div>
                  <p className="text-gray-300 text-[9px] mt-1">{new Date(result.createdAt).toLocaleString()}</p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
