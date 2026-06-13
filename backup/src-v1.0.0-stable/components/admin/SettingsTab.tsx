'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
  Database, Trash2, Lock, Shield, Info, RefreshCw,
  AlertTriangle, Server, HardDrive, CheckCircle2, XCircle,
  Wifi, WifiOff, Zap
} from 'lucide-react'
import {
  setUseFirestore, getUseFirestore, seedFirestoreIfEmpty
} from '@/lib/firestore-service'
import { isFirebaseReady } from '@/lib/firebase'

export default function SettingsTab() {
  const [firestoreEnabled, setFirestoreEnabled] = useState(getUseFirestore())
  const [seeding, setSeeding] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle')

  const firebaseConfigured = isFirebaseReady()

  const handleToggleFirestore = (enabled: boolean) => {
    if (enabled && !firebaseConfigured) {
      alert('Firebase is not configured! Add your Firebase config to .env.local first. See the setup guide below.')
      return
    }
    setFirestoreEnabled(enabled)
    setUseFirestore(enabled)
  }

  const handleTestConnection = async () => {
    if (!firebaseConfigured) {
      alert('Firebase is not configured. Add your config to .env.local first.')
      return
    }
    setConnectionStatus('testing')
    try {
      // Enable Firestore temporarily to test
      const wasEnabled = getUseFirestore()
      setUseFirestore(true)

      // Try to fetch categories as a connection test
      const { getCategories } = await import('@/lib/firestore-service')
      await getCategories()

      setUseFirestore(wasEnabled)
      setConnectionStatus('connected')
      setTimeout(() => setConnectionStatus('idle'), 5000)
    } catch (error) {
      console.error('Connection test failed:', error)
      setConnectionStatus('failed')
      setTimeout(() => setConnectionStatus('idle'), 5000)
    }
  }

  const handleSeed = async () => {
    if (!firebaseConfigured) {
      alert('Firebase is not configured! Add your config to .env.local first.')
      return
    }
    if (!confirm('This will seed Firestore with data from local-data.ts. Continue?')) return
    setSeeding(true)
    try {
      const result = await seedFirestoreIfEmpty()
      if (result) {
        alert('Firestore seeded successfully!')
      } else {
        alert('Firestore already has data (or Firebase is not configured). No data was seeded.')
      }
    } catch {
      alert('Failed to seed Firestore. Check console for details.')
    } finally {
      setSeeding(false)
    }
  }

  const handleClearData = () => {
    if (!confirm('⚠️ This will delete ALL data from localStorage. This cannot be undone. Continue?')) return
    if (!confirm('Are you REALLY sure? All results, announcements, notifications will be lost.')) return
    setClearing(true)
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('examprep_'))
      keys.forEach(k => localStorage.removeItem(k))
      alert(`Cleared ${keys.length} items from localStorage.`)
    } catch {
      alert('Failed to clear data')
    } finally {
      setClearing(false)
    }
  }

  const handleChangePassword = () => {
    const savedPassword = localStorage.getItem('examprep_admin_password') || 'admin123'
    if (currentPassword !== savedPassword) {
      alert('Current password is incorrect')
      return
    }
    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    localStorage.setItem('examprep_admin_password', newPassword)
    setPasswordChanged(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPasswordChanged(false), 3000)
  }

  return (
    <div className="space-y-4">
      {/* Firebase Connection Status */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Firebase Status
          </h3>

          {/* Config Status */}
          <div className={`flex items-center justify-between p-3 rounded-xl mb-3 ${firebaseConfigured ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-3">
              {firebaseConfigured ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {firebaseConfigured ? 'Firebase Configured' : 'Firebase Not Configured'}
                </p>
                <p className="text-gray-400 text-[10px]">
                  {firebaseConfigured
                    ? 'API keys found in .env.local'
                    : 'Add your Firebase config to .env.local'}
                </p>
              </div>
            </div>
            <Badge variant={firebaseConfigured ? 'default' : 'destructive'} className="text-[9px]">
              {firebaseConfigured ? 'Ready' : 'Setup Required'}
            </Badge>
          </div>

          {/* Connection Test */}
          {firebaseConfigured && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 mb-3">
              <div className="flex items-center gap-3">
                {connectionStatus === 'connected' ? (
                  <Wifi className="w-5 h-5 text-green-600" />
                ) : connectionStatus === 'failed' ? (
                  <WifiOff className="w-5 h-5 text-red-500" />
                ) : (
                  <Server className="w-5 h-5 text-blue-500" />
                )}
                <div>
                  <p className="text-sm font-medium">Connection Test</p>
                  <p className="text-gray-400 text-[10px]">
                    {connectionStatus === 'idle' && 'Test Firestore connectivity'}
                    {connectionStatus === 'testing' && 'Connecting to Firestore...'}
                    {connectionStatus === 'connected' && 'Connected successfully!'}
                    {connectionStatus === 'failed' && 'Connection failed. Check config.'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={handleTestConnection}
                disabled={connectionStatus === 'testing'}
              >
                {connectionStatus === 'testing' ? (
                  <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Wifi className="w-3 h-3 mr-1" />
                )}
                Test
              </Button>
            </div>
          )}

          {/* Setup Guide for Unconfigured */}
          {!firebaseConfigured && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs font-bold text-amber-800 mb-2">Setup Steps:</p>
              <ol className="text-[10px] text-amber-700 space-y-1 list-decimal list-inside">
                <li>Go to <span className="font-mono">console.firebase.google.com</span></li>
                <li>Create a project → Add Web App</li>
                <li>Copy the firebaseConfig values</li>
                <li>Paste them in <span className="font-mono">.env.local</span></li>
                <li>Enable Firestore Database in console</li>
                <li>Enable Email/Password Auth in console</li>
                <li>Restart dev server</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Firestore Toggle */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-500" /> Data Source
            </h3>
            <Badge variant="secondary" className="text-[9px]">
              {firestoreEnabled ? 'Firestore' : 'Local Storage'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 mb-3">
            <div className="flex items-center gap-3">
              {firestoreEnabled ? (
                <Server className="w-5 h-5 text-violet-500" />
              ) : (
                <HardDrive className="w-5 h-5 text-gray-500" />
              )}
              <div>
                <p className="text-sm font-medium">Use Firestore</p>
                <p className="text-gray-400 text-[10px]">
                  {firestoreEnabled
                    ? 'Data is stored in Firebase Firestore'
                    : 'Data is stored in browser localStorage'}
                </p>
              </div>
            </div>
            <Switch
              checked={firestoreEnabled}
              onCheckedChange={handleToggleFirestore}
            />
          </div>

          {firestoreEnabled && (
            <Button
              variant="outline"
              className="w-full rounded-xl text-xs"
              onClick={handleSeed}
              disabled={seeding}
            >
              <Database className="w-3 h-3 mr-1" />
              {seeding ? 'Seeding...' : 'Seed Firestore from Local Data'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Data Management
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50">
              <div>
                <p className="text-sm font-medium text-amber-800">Clear All Local Data</p>
                <p className="text-amber-600/70 text-[10px]">Delete all results, announcements, notifications from localStorage</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={handleClearData}
                disabled={clearing}
              >
                {clearing ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Trash2 className="w-3 h-3 mr-1" />}
                Clear
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50">
              <div>
                <p className="text-sm font-medium text-blue-800">Seed Firestore</p>
                <p className="text-blue-600/70 text-[10px]">Import exam data from local-data.ts to Firestore</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={handleSeed}
                disabled={seeding || !firebaseConfigured}
              >
                {seeding ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Database className="w-3 h-3 mr-1" />}
                Seed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Admin Password */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" /> Change Admin Password
          </h3>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="rounded-xl"
            />
            <Input
              type="password"
              placeholder="New password (min 6 chars)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="rounded-xl"
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="rounded-xl"
            />
            <Button
              className="w-full rounded-xl"
              onClick={handleChangePassword}
              disabled={!currentPassword || !newPassword || !confirmPassword}
            >
              {passwordChanged ? (
                <><CheckCircle2 className="w-4 h-4 mr-1" /> Password Changed!</>
              ) : (
                <><Lock className="w-4 h-4 mr-1" /> Change Password</>
              )}
            </Button>
            <p className="text-gray-400 text-[10px]">Default password: admin123</p>
          </div>
        </CardContent>
      </Card>

      {/* Firebase Setup Reference */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500" /> Firebase Setup Reference
          </h3>
          <div className="space-y-2 text-[11px]">
            <div className="p-3 rounded-lg bg-gray-50">
              <p className="font-bold text-gray-700 mb-1">Required in Firebase Console:</p>
              <ul className="space-y-1 text-gray-600 list-disc list-inside">
                <li>Firestore Database — Create in production or test mode</li>
                <li>Authentication — Enable Email/Password provider</li>
                <li>Storage — Enable (for image uploads)</li>
                <li>Web App — Register and copy config</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <p className="font-bold text-gray-700 mb-1">Files in your project:</p>
              <ul className="space-y-1 text-gray-600 list-disc list-inside">
                <li><span className="font-mono">.env.local</span> — Your Firebase API keys</li>
                <li><span className="font-mono">firestore.rules</span> — Database security rules</li>
                <li><span className="font-mono">storage.rules</span> — Storage security rules</li>
                <li><span className="font-mono">firebase.json</span> — Firebase CLI config</li>
                <li><span className="font-mono">.firebaserc</span> — Project ID alias</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <p className="font-bold text-gray-700 mb-1">After setup:</p>
              <ol className="space-y-1 text-gray-600 list-decimal list-inside">
                <li>Fill .env.local with your Firebase config</li>
                <li>Restart dev server</li>
                <li>Come here and Test Connection</li>
                <li>Toggle Firestore ON</li>
                <li>Click "Seed Firestore" to upload data</li>
              </ol>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-gray-400 text-[10px]">
              <Shield className="w-3 h-3" />
              <span>Admin panel • Secure access only</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500" /> App Info
          </h3>
          <div className="space-y-2">
            {[
              { label: 'App Name', value: 'MockMaster' },
              { label: 'Version', value: '2.0.0' },
              { label: 'Framework', value: 'Next.js 16' },
              { label: 'Firebase', value: firebaseConfigured ? 'Configured' : 'Not Configured' },
              { label: 'Data Source', value: firestoreEnabled ? 'Firestore' : 'localStorage' },
              { label: 'Build', value: new Date().toLocaleDateString() },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="text-xs text-gray-500">{item.label}</span>
                <span className="text-xs font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
