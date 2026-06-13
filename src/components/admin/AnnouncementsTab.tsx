'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  BookOpen, Trophy, Flame, Zap, Building, Plus,
  Trash2, RefreshCw, Edit3, X, Check, ArrowUp, ArrowDown
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSubtitle, setEditSubtitle] = useState('')
  const [editGradient, setEditGradient] = useState('')
  const [editImage, setEditImage] = useState('')

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

  const handleAdd = () => {
    const newAnn: Announcement = {
      id: Date.now().toString(),
      image: newAnnImage,
      title: newAnnTitle,
      subtitle: newAnnSubtitle,
      action: 'exams',
      gradient: newAnnGradient,
    }
    onUpdate([...announcements, newAnn])
    setNewAnnTitle('')
    setNewAnnSubtitle('')
  }

  const handleDelete = (index: number) => {
    if (editingIndex === index) setEditingIndex(null)
    onUpdate(announcements.filter((_, i) => i !== index))
  }

  const handleEdit = (index: number) => {
    const a = announcements[index]
    setEditingIndex(index)
    setEditTitle(a.title)
    setEditSubtitle(a.subtitle)
    setEditGradient(a.gradient)
    setEditImage(a.image)
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
  }

  const handleSaveEdit = () => {
    if (editingIndex === null) return
    const updated = [...announcements]
    updated[editingIndex] = {
      ...updated[editingIndex],
      title: editTitle,
      subtitle: editSubtitle,
      gradient: editGradient,
      image: editImage,
    }
    onUpdate(updated)
    setEditingIndex(null)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...announcements]
    const temp = updated[index]
    updated[index] = updated[index - 1]
    updated[index - 1] = temp
    onUpdate(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index === announcements.length - 1) return
    const updated = [...announcements]
    const temp = updated[index]
    updated[index] = updated[index + 1]
    updated[index + 1] = temp
    onUpdate(updated)
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
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Icon</p>
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
              <Card key={a.id} className={`border-0 shadow-sm transition-all ${editingIndex === i ? 'ring-2 ring-orange-300 shadow-md' : 'hover:shadow-md'}`}>
                {editingIndex === i ? (
                  /* Edit Mode */
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm text-orange-600 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5" /> Editing Announcement
                      </h4>
                      <div className="flex gap-1.5">
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editTitle || !editSubtitle}
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
                      className="w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    <input
                      type="text"
                      value={editSubtitle}
                      onChange={e => setEditSubtitle(e.target.value)}
                      placeholder="Subtitle"
                      className="w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Gradient Color</p>
                      <div className="flex gap-2 flex-wrap">
                        {gradients.map(g => (
                          <button
                            key={g.value}
                            onClick={() => setEditGradient(g.value)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                              editGradient === g.value
                                ? `bg-gradient-to-r ${g.value} text-white shadow-sm`
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Icon</p>
                      <div className="flex gap-2">
                        {icons.map(ic => (
                          <button
                            key={ic.value}
                            onClick={() => setEditImage(ic.value)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                              editImage === ic.value
                                ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-300'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {ic.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                ) : (
                  /* View Mode */
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center flex-shrink-0`}>
                        {a.image === 'ssc' && <BookOpen className="w-5 h-5 text-white" />}
                        {a.image === 'banking' && <Building className="w-5 h-5 text-white" />}
                        {a.image === 'leaderboard' && <Trophy className="w-5 h-5 text-white" />}
                        {a.image === 'practice' && <Zap className="w-5 h-5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{a.title}</p>
                        <p className="text-gray-400 text-xs truncate">{a.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleMoveUp(i)}
                          disabled={i === 0}
                          className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(i)}
                          disabled={i === announcements.length - 1}
                          className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleEdit(i)}
                          className="w-7 h-7 rounded-lg bg-orange-50 hover:bg-orange-100 flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-orange-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(i)}
                          className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
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
