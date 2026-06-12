'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Bell, Zap, AlertTriangle, Gift, Plus,
  Trash2, RefreshCw
} from 'lucide-react'
import {
  type Notification,
  DEFAULT_NOTIFICATIONS
} from '@/lib/admin-data'

interface NotificationsTabProps {
  notifications: Notification[]
  onUpdate: (notifications: Notification[]) => void
}

export default function NotificationsTab({ notifications, onUpdate }: NotificationsTabProps) {
  const [newNotifTitle, setNewNotifTitle] = useState('')
  const [newNotifMessage, setNewNotifMessage] = useState('')
  const [newNotifType, setNewNotifType] = useState<'update' | 'alert' | 'info'>('info')

  const handleSend = () => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      title: newNotifTitle,
      message: newNotifMessage,
      time: 'Just now',
      read: false,
      type: newNotifType,
    }
    onUpdate([newNotif, ...notifications])
    setNewNotifTitle('')
    setNewNotifMessage('')
  }

  const handleDelete = (index: number) => {
    onUpdate(notifications.filter((_, i) => i !== index))
  }

  const typeButtons = [
    { label: 'Info', value: 'info' as const, color: 'bg-green-100 text-green-700' },
    { label: 'Update', value: 'update' as const, color: 'bg-blue-100 text-blue-700' },
    { label: 'Alert', value: 'alert' as const, color: 'bg-amber-100 text-amber-700' },
  ]

  return (
    <div className="space-y-4">
      {/* Send New Notification */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" /> Send Notification
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newNotifTitle}
              onChange={e => setNewNotifTitle(e.target.value)}
              placeholder="Title (e.g. New Update Available)"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <textarea
              value={newNotifMessage}
              onChange={e => setNewNotifMessage(e.target.value)}
              placeholder="Message (e.g. A new version is available...)"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            />
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Type</p>
              <div className="flex gap-2">
                {typeButtons.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setNewNotifType(t.value)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      newNotifType === t.value ? t.color : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl h-11 font-semibold"
              disabled={!newNotifTitle || !newNotifMessage}
              onClick={handleSend}
            >
              <Bell className="w-4 h-4 mr-1" /> Send Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Notifications */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="font-bold text-sm">Current Notifications ({notifications.length})</h3>
          {notifications.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Reset notifications to defaults?')) {
                  onUpdate(DEFAULT_NOTIFICATIONS)
                }
              }}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No notifications yet</p>
                <p className="text-gray-300 text-xs">Send your first notification above</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((n, i) => (
              <Card key={n.id} className={`border-0 shadow-sm hover:shadow-md transition-shadow ${!n.read ? 'border-l-4 border-l-orange-400' : ''}`}>
                <CardContent className="p-3 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    n.type === 'update' ? 'bg-blue-100' :
                    n.type === 'alert' ? 'bg-amber-100' :
                    'bg-green-100'
                  }`}>
                    {n.type === 'update' ? <Zap className="w-4 h-4 text-blue-500" /> :
                     n.type === 'alert' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                     <Gift className="w-4 h-4 text-green-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{n.title}</p>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />}
                    </div>
                    <p className="text-gray-400 text-xs truncate">{n.message}</p>
                    <p className="text-gray-300 text-[10px] mt-0.5">{n.time}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(i)}
                    className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
