'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen, Trophy, Flame, Zap, Building, Plus,
  Trash2, RefreshCw, ImagePlus, X
} from 'lucide-react'
import {
  type Announcement,
  DEFAULT_ANNOUNCEMENTS
} from '@/lib/admin-data'

interface AnnouncementsTabProps {
  announcements: Announcement[]
  onUpdate: (announcements: Announcement[]) => void
}

export default function AnnouncementsTab({ announcements, onUpdate }: AnnouncementsTabProps) {
  const [newAnnTitle, setNewAnnTitle] = useState('')
  const [newAnnSubtitle, setNewAnnSubtitle] = useState('')
  const [newAnnGradient, setNewAnnGradient] = useState('from-orange-500 to-red-500')
  const [newAnnImage, setNewAnnImage] = useState('ssc')
  const [newAnnImageUrl, setNewAnnImageUrl] = useState('')
  const [newAnnAction, setNewAnnAction] = useState('exams')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const gradients = [
    { label: 'Orange', value: 'from-orange-500 to-red-500' },
    { label: 'Blue', value: 'from-blue-500 to-indigo-500' },
    { label: 'Green', value: 'from-emerald-500 to-teal-500' },
    { label: 'Purple', value: 'from-purple-500 to-pink-500' },
    { label: 'Red', value: 'from-red-500 to-rose-500' },
    { label: 'Cyan', value: 'from-cyan-500 to-blue-500' },
  ]

  const icons = [
    { label: 'Book', value: 'ssc', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Building', value: 'banking', icon: <Building className="w-4 h-4" /> },
    { label: 'Trophy', value: 'leaderboard', icon: <Trophy className="w-4 h-4" /> },
    { label: 'Zap', value: 'practice', icon: <Zap className="w-4 h-4" /> },
  ]

  const actions = [
    { label: 'Exams', value: 'exams' },
    { label: 'Practice', value: 'practice' },
    { label: 'Leaderboard', value: 'leaderboard' },
    { label: 'Home', value: 'home' },
    { label: 'Profile', value: 'profile' },
    { label: 'Tests', value: 'tests' },
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB')
      return
    }

    // Convert to base64 data URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setNewAnnImageUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAdd = () => {
    const newAnn: Announcement = {
      id: Date.now().toString(),
      image: newAnnImage,
      imageUrl: newAnnImageUrl || undefined,
      title: newAnnTitle,
      subtitle: newAnnSubtitle,
      action: newAnnAction,
      gradient: newAnnGradient,
    }
    onUpdate([...announcements, newAnn])
    setNewAnnTitle('')
    setNewAnnSubtitle('')
    setNewAnnImageUrl('')
    setNewAnnAction('exams')
  }

  const handleDelete = (index: number) => {
    onUpdate(announcements.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {/* Add New Announcement */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-orange-500" /> Add New Announcement
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newAnnTitle}
              onChange={e => setNewAnnTitle(e.target.value)}
              placeholder="Title (e.g. SSC CGL 2025)"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <input
              type="text"
              value={newAnnSubtitle}
              onChange={e => setNewAnnSubtitle(e.target.value)}
              placeholder="Subtitle (e.g. New Mock Tests Added!)"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />

            {/* Image Upload Section */}
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Image</p>
              {newAnnImageUrl ? (
                <div className="relative rounded-xl overflow-hidden mb-2">
                  <img src={newAnnImageUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                  <button
                    onClick={() => setNewAnnImageUrl('')}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors text-sm text-gray-500"
                  >
                    <ImagePlus className="w-4 h-4" /> Upload Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <input
                    type="text"
                    placeholder="Or paste URL..."
                    value={newAnnImageUrl}
                    onChange={e => setNewAnnImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              )}
            </div>

            {/* Icon selector (fallback when no image) */}
            {!newAnnImageUrl && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Icon (if no image)</p>
                <div className="flex gap-2">
                  {icons.map(ic => (
                    <button
                      key={ic.value}
                      onClick={() => setNewAnnImage(ic.value)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        newAnnImage === ic.value
                          ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-300'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {ic.icon}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action page */}
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Action (tap goes to)</p>
              <div className="flex gap-1.5 flex-wrap">
                {actions.map(a => (
                  <button
                    key={a.value}
                    onClick={() => setNewAnnAction(a.value)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      newAnnAction === a.value
                        ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gradient Color */}
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Gradient Color</p>
              <div className="flex gap-2 flex-wrap">
                {gradients.map(g => (
                  <button
                    key={g.value}
                    onClick={() => setNewAnnGradient(g.value)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      newAnnGradient === g.value
                        ? `bg-gradient-to-r ${g.value} text-white shadow-sm`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl h-11 font-semibold"
              disabled={!newAnnTitle || !newAnnSubtitle}
              onClick={handleAdd}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Announcement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Announcements */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="font-bold text-sm">Current Announcements ({announcements.length})</h3>
          {announcements.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Reset announcements to defaults?')) {
                  onUpdate(DEFAULT_ANNOUNCEMENTS)
                }
              }}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
        <div className="space-y-2">
          {announcements.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <Flame className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No announcements yet</p>
                <p className="text-gray-300 text-xs">Add your first announcement above</p>
              </CardContent>
            </Card>
          ) : (
            announcements.map((a, i) => (
              <Card key={a.id} className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Image or Icon */}
                    <div className={`w-16 flex-shrink-0 ${a.imageUrl ? '' : `bg-gradient-to-br ${a.gradient} flex items-center justify-center`}`}>
                      {a.imageUrl ? (
                        <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          {a.image === 'ssc' && <BookOpen className="w-5 h-5 text-white" />}
                          {a.image === 'banking' && <Building className="w-5 h-5 text-white" />}
                          {a.image === 'leaderboard' && <Trophy className="w-5 h-5 text-white" />}
                          {a.image === 'practice' && <Zap className="w-5 h-5 text-white" />}
                        </>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{a.title}</p>
                        <p className="text-gray-400 text-xs truncate">{a.subtitle}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Badge variant="secondary" className="text-[9px]">{a.action}</Badge>
                          {a.imageUrl && <Badge className="text-[9px] bg-blue-100 text-blue-700">Image</Badge>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(i)}
                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
