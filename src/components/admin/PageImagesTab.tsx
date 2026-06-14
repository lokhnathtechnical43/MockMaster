'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ImagePlus, X, Trash2, Edit3, Check, Home, BookOpen,
  ClipboardList, PenTool, User, Trophy, BarChart3, Plus
} from 'lucide-react'
import {
  type PageImage,
  getPageImages,
  savePageImages
} from '@/lib/admin-data'

interface PageImagesTabProps {
  images: PageImage[]
  onUpdate: (images: PageImage[]) => void
}

// Pre-defined sections for each page where images can be added
const PAGE_SECTIONS = [
  { id: 'home_hero', page: 'home', section: 'Hero Banner', label: 'Home - Top Banner' },
  { id: 'home_quick_practice', page: 'home', section: 'Quick Practice Card', label: 'Home - Quick Practice' },
  { id: 'home_categories', page: 'home', section: 'Categories Section', label: 'Home - Categories Header' },
  { id: 'home_popular_exams', page: 'home', section: 'Popular Exams', label: 'Home - Popular Exams' },
  { id: 'home_daily_tips', page: 'home', section: 'Daily Tips Card', label: 'Home - Daily Tips' },
  { id: 'home_upcoming', page: 'home', section: 'Upcoming Exams', label: 'Home - Upcoming Exams' },
  { id: 'home_progress', page: 'home', section: 'Study Stats', label: 'Home - Your Progress' },
  { id: 'exams_header', page: 'exams', section: 'Header Banner', label: 'Exams - Header' },
  { id: 'tests_header', page: 'tests', section: 'Header Banner', label: 'Tests - Header' },
  { id: 'test_info_header', page: 'tests', section: 'Test Info Header', label: 'Test Info - Header' },
  { id: 'practice_header', page: 'practice', section: 'Header Banner', label: 'Practice - Header' },
  { id: 'practice_quick', page: 'practice', section: 'Quick Practice Card', label: 'Practice - Quick Practice' },
  { id: 'practice_topic', page: 'practice', section: 'Topic Wise Card', label: 'Practice - Topic Wise' },
  { id: 'practice_bookmarked', page: 'practice', section: 'Bookmarked Card', label: 'Practice - Bookmarked' },
  { id: 'practice_weak', page: 'practice', section: 'Weak Areas Card', label: 'Practice - Weak Areas' },
  { id: 'profile_header', page: 'profile', section: 'Profile Header', label: 'Profile - Header Banner' },
  { id: 'profile_avatar_bg', page: 'profile', section: 'Avatar Background', label: 'Profile - Avatar BG' },
  { id: 'leaderboard_header', page: 'leaderboard', section: 'Header Banner', label: 'Leaderboard - Header' },
  { id: 'results_header', page: 'results', section: 'Results Header', label: 'Results - Header' },
  { id: 'test_taking_bg', page: 'tests', section: 'Test Taking Background', label: 'Test Taking - Background' },
]

const PAGE_ICONS: Record<string, React.ElementType> = {
  home: Home,
  exams: BookOpen,
  tests: ClipboardList,
  practice: PenTool,
  profile: User,
  leaderboard: Trophy,
  results: BarChart3,
}

const PAGE_COLORS: Record<string, string> = {
  home: 'bg-orange-100 text-orange-700',
  exams: 'bg-blue-100 text-blue-700',
  tests: 'bg-purple-100 text-purple-700',
  practice: 'bg-green-100 text-green-700',
  profile: 'bg-slate-100 text-slate-700',
  leaderboard: 'bg-amber-100 text-amber-700',
  results: 'bg-emerald-100 text-emerald-700',
}

export default function PageImagesTab({ images, onUpdate }: PageImagesTabProps) {
  const [selectedPage, setSelectedPage] = useState<string>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editImageUrl, setEditImageUrl] = useState('')
  const editFileInputRef = useRef<HTMLInputElement>(null)

  // Add new image state
  const [addSectionId, setAddSectionId] = useState<string | null>(null)
  const [newImageUrl, setNewImageUrl] = useState('')
  const addFileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      onSuccess(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAddImage = (sectionId: string) => {
    if (!newImageUrl) return
    const section = PAGE_SECTIONS.find(s => s.id === sectionId)
    if (!section) return

    const existing = images.find(img => img.id === sectionId)
    let updated: PageImage[]

    if (existing) {
      updated = images.map(img =>
        img.id === sectionId
          ? { ...img, imageUrl: newImageUrl, updatedAt: new Date().toISOString() }
          : img
      )
    } else {
      updated = [...images, {
        id: sectionId,
        label: section.label,
        page: section.page,
        section: section.section,
        imageUrl: newImageUrl,
        updatedAt: new Date().toISOString(),
      }]
    }
    onUpdate(updated)
    setAddSectionId(null)
    setNewImageUrl('')
  }

  const handleRemoveImage = (id: string) => {
    onUpdate(images.filter(img => img.id !== id))
  }

  const startEdit = (id: string) => {
    const img = images.find(i => i.id === id)
    if (img) {
      setEditingId(id)
      setEditImageUrl(img.imageUrl)
    }
  }

  const saveEdit = () => {
    if (!editingId) return
    const updated = images.map(img =>
      img.id === editingId
        ? { ...img, imageUrl: editImageUrl, updatedAt: new Date().toISOString() }
        : img
    )
    onUpdate(updated)
    setEditingId(null)
    setEditImageUrl('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditImageUrl('')
  }

  // Filter sections by selected page
  const filteredSections = selectedPage === 'all'
    ? PAGE_SECTIONS
    : PAGE_SECTIONS.filter(s => s.page === selectedPage)

  const pages = ['all', ...new Set(PAGE_SECTIONS.map(s => s.page))]

  return (
    <div className="space-y-4">
      {/* Page Filter */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-orange-500" /> Page Image Manager
          </h3>
          <p className="text-gray-400 text-xs mb-3">
            Add images to any page section. Images will appear in the app on the specified section.
          </p>

          {/* Page Tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
            {pages.map(page => {
              const Icon = PAGE_ICONS[page] || Home
              return (
                <button
                  key={page}
                  onClick={() => setSelectedPage(page)}
                  className={`flex-shrink-0 py-1.5 px-3 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                    selectedPage === page
                      ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {page === 'all' ? 'All Pages' : page.charAt(0).toUpperCase() + page.slice(1)}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Image Sections */}
      <div className="space-y-2">
        {filteredSections.map(section => {
          const existingImage = images.find(img => img.id === section.id)
          const Icon = PAGE_ICONS[section.page] || Home
          const colorClass = PAGE_COLORS[section.page] || 'bg-gray-100 text-gray-700'
          const isEditing = editingId === section.id
          const isAdding = addSectionId === section.id

          return (
            <Card key={section.id} className={`border-0 shadow-sm hover:shadow-md transition-shadow ${isEditing ? 'ring-2 ring-orange-300' : ''}`}>
              <CardContent className="p-3">
                {/* Section Header */}
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{section.label}</p>
                    <p className="text-gray-400 text-[11px]">{section.section}</p>
                  </div>
                  {existingImage ? (
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200">
                        <img src={existingImage.imageUrl} alt={section.label} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => startEdit(section.id)}
                          className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                          title="Change Image"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleRemoveImage(section.id)}
                          className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                          title="Remove Image"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">No Image</Badge>
                  )}
                </div>

                {/* Edit Mode */}
                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    <p className="text-xs font-semibold text-orange-600 flex items-center gap-1">
                      <Edit3 className="w-3 h-3" /> Change Image
                    </p>
                    {editImageUrl ? (
                      <div className="relative rounded-xl overflow-hidden">
                        <img src={editImageUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                        <button
                          onClick={() => setEditImageUrl('')}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => editFileInputRef.current?.click()}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors text-xs text-gray-500"
                        >
                          <ImagePlus className="w-4 h-4" /> Upload
                        </button>
                        <input
                          ref={editFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, setEditImageUrl)}
                        />
                        <input
                          type="text"
                          placeholder="Or paste URL..."
                          value={editImageUrl}
                          onChange={e => setEditImageUrl(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl" onClick={saveEdit} disabled={!editImageUrl}>
                        <Check className="w-4 h-4 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 rounded-xl" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Add Mode */}
                {isAdding && !existingImage && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    {newImageUrl ? (
                      <div className="relative rounded-xl overflow-hidden">
                        <img src={newImageUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                        <button
                          onClick={() => setNewImageUrl('')}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => addFileInputRef.current?.click()}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors text-xs text-gray-500"
                        >
                          <ImagePlus className="w-4 h-4" /> Upload
                        </button>
                        <input
                          ref={addFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, setNewImageUrl)}
                        />
                        <input
                          type="text"
                          placeholder="Or paste URL..."
                          value={newImageUrl}
                          onChange={e => setNewImageUrl(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl" onClick={() => handleAddImage(section.id)} disabled={!newImageUrl}>
                        <Plus className="w-4 h-4 mr-1" /> Add Image
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 rounded-xl" onClick={() => { setAddSectionId(null); setNewImageUrl('') }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Add Image Button (when no image and not in add mode) */}
                {!existingImage && !isAdding && (
                  <button
                    onClick={() => setAddSectionId(section.id)}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors text-xs text-gray-400 hover:text-orange-500"
                  >
                    <ImagePlus className="w-4 h-4" /> Add Image
                  </button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
