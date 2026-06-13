'use client'

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
  return <AdminPanel />
}
