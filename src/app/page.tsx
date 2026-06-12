'use client'

import dynamic from 'next/dynamic'

// Load the main app component dynamically to avoid SSR prerendering issues
const ExamPrepApp = dynamic(() => import('@/components/ExamPrepApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
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
  return <ExamPrepApp />
}
