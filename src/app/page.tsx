'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Error boundary component
function AppError({ error, reset }: { error: string; reset: () => void }) {
  return (
    <div className="min-h-screen min-h-dvh flex items-center justify-center bg-gradient-to-b from-orange-50 to-white w-full p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold">E</span>
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">ExamPrep Bharat</h2>
        <p className="text-red-500 text-sm mb-4">{error || 'Something went wrong'}</p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-orange-500 text-white rounded-xl font-semibold text-sm active:bg-orange-600"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

// Load the main app component dynamically with error handling
const ExamPrepApp = dynamic(() => import('@/components/ExamPrepApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen min-h-dvh flex items-center justify-center bg-gradient-to-b from-orange-50 to-white w-full">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-white text-2xl font-bold">E</span>
        </div>
        <p className="text-orange-600 font-semibold">ExamPrep Bharat</p>
        <p className="text-gray-400 text-sm mt-1">Loading...</p>
      </div>
    </div>
  )
})

export default function Page() {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // Global error handler for uncaught errors
    const handleError = (event: ErrorEvent) => {
      console.error('[App] Uncaught error:', event.error)
      // Don't block the app for Firebase errors
      if (event.error?.message?.includes('Firebase') || 
          event.error?.message?.includes('firestore') ||
          event.error?.message?.includes('auth')) {
        event.preventDefault()
        console.warn('[App] Firebase error suppressed, app continues in offline mode')
        return
      }
      setHasError(true)
      setErrorMessage(event.error?.message || 'An unexpected error occurred')
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[App] Unhandled promise rejection:', event.reason)
      // Don't block for Firebase promise rejections
      if (String(event.reason)?.includes('Firebase') || 
          String(event.reason)?.includes('firestore') ||
          String(event.reason)?.includes('auth')) {
        event.preventDefault()
        console.warn('[App] Firebase promise rejection suppressed')
        return
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  if (hasError) {
    return <AppError error={errorMessage} reset={() => { setHasError(false); setErrorMessage('') }} />
  }

  return <ExamPrepApp />
}
