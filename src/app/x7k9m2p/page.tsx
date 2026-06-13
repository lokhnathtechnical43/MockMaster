'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const AdminPanel = dynamic(() => import('@/components/admin/AdminPanel'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen min-h-dvh flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-white text-2xl font-bold">S</span>
        </div>
        <p className="text-slate-600 font-semibold">System</p>
        <p className="text-gray-400 text-sm mt-1">Loading...</p>
      </div>
    </div>
  )
})

export default function SystemPage() {
  const [isNativeApp, setIsNativeApp] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Check if running inside Capacitor native app (Android/iOS)
    try {
      const win = window as any
      const cap = win.Capacitor
      if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
        setIsNativeApp(true)
      }
      // Also check for Android bridge directly
      if (win.androidBridge) {
        setIsNativeApp(true)
      }
    } catch (e) {
      // Not in native app
    }
    setChecked(true)
  }, [])

  if (!checked) return null

  // Block access from native app (Play Store / App Store builds)
  if (isNativeApp) {
    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center bg-white">
        <div className="text-center px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl font-bold">404</span>
          </div>
          <p className="text-gray-500 text-sm">Page not found</p>
        </div>
      </div>
    )
  }

  return <AdminPanel />
}
