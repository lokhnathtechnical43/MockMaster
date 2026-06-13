'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Bell, Zap, AlertTriangle, Gift, Plus,
  Trash2, RefreshCw, Edit3, X, Check, ArrowUp, ArrowDown,
  Eye, ExternalLink
} from 'lucide-react'
import {
  type Notification,
  DEFAULT_NOTIFICATIONS
} from '@/lib/admin-data'
import ImageUploadField from './ImageUploadField'

interface NotificationsTabProps {
  notifications: Notification[]
  onUpdate: (notifications: Notification[]) => void
}

export default function NotificationsTab({ notifications, onUpdate }: NotificationsTabProps) {
  const [newNotifTitle, setNewNotifTitle] = useState('')
  const [newNotifMessage, setNewNotifMessage] = useState('')
  const [newNotifType, setNewNotifType] = useState<'update' | 'alert' | 'info'>('info')
  const [newNotifImageUrl, setNewNotifImageUrl] = useState('')
  const [newNotifActionUrl, setNewNotifActionUrl] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editMessage, setEditMessage] = useState('')
  const [editType, setEditType] = useState<'update' | 'alert' | 'info'>('info')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editActionUrl, setEditActionUrl] = useState('')
  const [previewNotif, setPreviewNotif] = useState<Notification | null>(null)

  const handleSend = () => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      title: newNotifTitle,
      message: newNotifMessage,
      time: 'Just now',
      read: false,
      type: newNotifType,
      ...(newNotifImageUrl ? { imageUrl: newNotifImageUrl } : {}),
      ...(newNotifActionUrl.trim() ? { actionUrl: newNotifActionUrl.trim() } : {}),
    }
    onUpdate([newNotif, ...notifications])
    setNewNotifTitle('')
    setNewNotifMessage('')
    setNewNotifImageUrl('')
    setNewNotifActionUrl('')
  }

  const handleDelete = (index: number) => {
    if (editingIndex === index) setEditingIndex(null)
    onUpdate(notifications.filter((_, i) => i !== index))
  }

  const handleEdit = (index: number) => {
    const n = notifications[index]
    setEditingIndex(index)
    setEditTitle(n.title)
    setEditMessage(n.message)
    setEditType(n.type)
    setEditImageUrl(n.imageUrl || '')
    setEditActionUrl(n.actionUrl || '')
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
  }

  const handleSaveEdit = () => {
    if (editingIndex === null) return
    const updated = [...notifications]
    updated[editingIndex] = {
      ...updated[editingIndex],
      title: editTitle,
      message: editMessage,
      type: editType,
      ...(editImageUrl ? { imageUrl: editImageUrl } : { imageUrl: undefined }),
      ...(editActionUrl.trim() ? { actionUrl: editActionUrl.trim() } : { actionUrl: undefined }),
    }
    onUpdate(updated)
    setEditingIndex(null)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...notifications]
    const temp = updated[index]
    updated[index] = updated[index - 1]
    updated[index - 1] = temp
    onUpdate(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index === notifications.length - 1) return
    const updated = [...notifications]
    const temp = updated[index]
    updated[index] = updated[index + 1]
    updated[index + 1] = temp
    onUpdate(updated)
  }

  const typeButtons = [
    { label: 'Info', value: 'info' as const, color: 'bg-green-100 text-green-700' },
    { label: 'Update', value: 'update' as const, color: 'bg-blue-100 text-blue-700' },
    { label: 'Alert', value: 'alert' as const, color: 'bg-amber-100 text-amber-700' },
  ]

  return (
    <div className="space-y-4">
      {/* Preview Modal */}
      {previewNotif && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setPreviewNotif(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Preview Header */}
            <div className="relative bg-gradient-to-br from-orange-500 to-red-500 text-white overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-3 left-6 w-20 h-20 rounded-full border-4 border-white" />
                <div className="absolute bottom-2 right-8 w-14 h-14 rounded-full border-4 border-white" />
              </div>
              <div className="relative z-10 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  <h3 className="font-bold text-sm">Preview — Notification</h3>
                </div>
                <button
                  onClick={() => setPreviewNotif(null)}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview Content - Same as user sees */}
            <div className="p-4 space-y-4">
              {/* Notification card preview */}
              <div className={`rounded-xl overflow-hidden shadow-sm border ${previewNotif.type === 'update' ? 'border-blue-100' : previewNotif.type === 'alert' ? 'border-amber-100' : 'border-green-100'}`}>
                {previewNotif.imageUrl && (
                  <div className="relative">
                    <img src={previewNotif.imageUrl} alt="" className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${previewNotif.imageUrl ? '' : previewNotif.type === 'update' ? 'bg-blue-100' : previewNotif.type === 'alert' ? 'bg-amber-100' : 'bg-green-100'}`}>
                      {previewNotif.imageUrl ? (
                        <img src={previewNotif.imageUrl} alt="" className="w-10 h-10 object-cover rounded-full" />
                      ) : (
                        previewNotif.type === 'update' ? <Zap className="w-5 h-5 text-blue-500" /> : previewNotif.type === 'alert' ? <AlertTriangle className="w-5 h-5 text-amber-500" /> : <Gift className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900">{previewNotif.title}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed whitespace-pre-wrap">{previewNotif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-2">{previewNotif.time}</p>
                    </div>
                  </div>
                  {previewNotif.actionUrl && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg">
                      <ExternalLink className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-xs text-orange-600 font-medium truncate">{previewNotif.actionUrl}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Full Text */}
              <div>
                <p className="text-xs text-gray-400 mb-1 font-medium">Full Message</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-3 rounded-xl">{previewNotif.message}</p>
              </div>

              {previewNotif.actionUrl && (
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-medium">Action URL</p>
                  <p className="text-xs text-blue-600 break-all bg-gray-50 p-2 rounded-lg">{previewNotif.actionUrl}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
            <ImageUploadField
              imageUrl={newNotifImageUrl}
              onImageUrlChange={setNewNotifImageUrl}
              folder="notifications"
              label="Image (Optional — shows in notification)"
            />
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Action URL (Optional — user will open this link when tapping notification)</p>
              <input
                type="url"
                value={newNotifActionUrl}
                onChange={e => setNewNotifActionUrl(e.target.value)}
                placeholder="https://example.com or any URL"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
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
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
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
              <Card key={n.id} className={`border-0 shadow-sm transition-all ${editingIndex === i ? 'ring-2 ring-blue-300 shadow-md' : 'hover:shadow-md'} ${!n.read ? 'border-l-4 border-l-orange-400' : ''}`}>
                {editingIndex === i ? (
                  /* Edit Mode */
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm text-blue-600 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5" /> Editing Notification
                      </h4>
                      <div className="flex gap-1.5">
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editTitle || !editMessage}
                          className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors disabled:opacity-40"
                          title="Save"
                        >
                          <Check className="w-4 h-4 text-emerald-600" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full px-3 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <textarea
                      value={editMessage}
                      onChange={e => setEditMessage(e.target.value)}
                      placeholder="Message"
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                    />
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Type</p>
                      <div className="flex gap-2">
                        {typeButtons.map(t => (
                          <button
                            key={t.value}
                            onClick={() => setEditType(t.value)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              editType === t.value ? t.color : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <ImageUploadField
                      imageUrl={editImageUrl}
                      onImageUrlChange={setEditImageUrl}
                      folder="notifications"
                      label="Image (Optional)"
                    />
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Action URL (Optional)</p>
                      <input
                        type="url"
                        value={editActionUrl}
                        onChange={e => setEditActionUrl(e.target.value)}
                        placeholder="https://example.com or any URL"
                        className="w-full px-3 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                  </CardContent>
                ) : (
                  /* View Mode */
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden ${
                        n.type === 'update' ? 'bg-blue-100' :
                        n.type === 'alert' ? 'bg-amber-100' :
                        'bg-green-100'
                      }`}>
                        {n.imageUrl ? (
                          <img src={n.imageUrl} alt="" className="w-8 h-8 object-cover rounded-full" />
                        ) : (
                          <>
                            {n.type === 'update' ? <Zap className="w-4 h-4 text-blue-500" /> :
                             n.type === 'alert' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                             <Gift className="w-4 h-4 text-green-500" />}
                          </>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{n.title}</p>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />}
                        </div>
                        <p className="text-gray-400 text-xs truncate">{n.message}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-gray-300 text-[10px]">{n.time}</p>
                          {n.actionUrl && <span className="text-[9px] text-blue-500 font-medium flex items-center gap-0.5"><ExternalLink className="w-2.5 h-2.5" />Has URL</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setPreviewNotif(n)}
                          className="w-6 h-6 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-3 h-3 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleMoveUp(i)}
                          disabled={i === 0}
                          className="w-6 h-6 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3 h-3 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(i)}
                          disabled={i === notifications.length - 1}
                          className="w-6 h-6 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3 h-3 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleEdit(i)}
                          className="w-6 h-6 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(i)}
                          className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
