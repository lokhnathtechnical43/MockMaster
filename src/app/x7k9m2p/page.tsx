'use client'

import { useState, useEffect, Component } from 'react'
import dynamic from 'next/dynamic'
import React from 'react'

// Error Boundary to catch and display runtime errors
class AdminErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string; errorInfo: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '', errorInfo: '' }
  }

  static getDerivedStateFromError(error: any) {
    return {
      hasError: true,
      error: error?.message || String(error),
      errorInfo: error?.stack || ''
    }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('[Admin Error Boundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-h-dvh flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">!</span>
            </div>
            <h2 className="font-bold text-lg text-center mb-2">Something went wrong</h2>
            <p className="text-gray-500 text-sm text-center mb-4">An error occurred while loading the admin panel.</p>
            <div className="bg-red-50 rounded-xl p-3 mb-4 max-h-48 overflow-y-auto">
              <p className="text-red-600 text-xs font-mono break-all">{this.state.error}</p>
              {this.state.errorInfo && (
                <pre className="text-red-400 text-[10px] font-mono mt-2 whitespace-pre-wrap">{this.state.errorInfo}</pre>
              )}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: '', errorInfo: '' })
                window.location.reload()
              }}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-semibold text-sm hover:bg-slate-900 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

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

  return (
    <AdminErrorBoundary>
      <AdminPanel />
    </AdminErrorBoundary>
  )
}
