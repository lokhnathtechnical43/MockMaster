'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Calendar, Plus, Trash2, RefreshCw, ToggleLeft, ToggleRight,
  ImagePlus, X, Edit3, Check, ArrowUp, ArrowDown, ExternalLink
} from 'lucide-react'
import {
  type UpcomingExam,
  DEFAULT_UPCOMING_EXAMS
} from '@/lib/admin-data'

interface UpcomingExamsTabProps {
  exams: UpcomingExam[]
  onUpdate: (exams: UpcomingExam[]) => void
}

const STATUS_TYPES = [
  { value: 'open', label: 'Registration Open', color: 'bg-green-100 text-green-700' },
  { value: 'coming', label: 'Coming Soon', color: 'bg-gray-100 text-gray-600' },
  { value: 'admit', label: 'Admit Card Out', color: 'bg-amber-100 text-amber-700' },
  { value: 'closed', label: 'Registration Closed', color: 'bg-red-100 text-red-700' },
] as const

export default function UpcomingExamsTab({ exams, onUpdate }: UpcomingExamsTabProps) {
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newStatus, setNewStatus] = useState<string>('open')
  const [newStatusType, setNewStatusType] = useState<UpcomingExam['statusType']>('open')
  const [newCatSlug, setNewCatSlug] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit state
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editStatusType, setEditStatusType] = useState<UpcomingExam['statusType']>('open')
  const [editCatSlug, setEditCatSlug] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const editFileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setNewImageUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setEditImageUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleStatusTypeChange = (type: UpcomingExam['statusType'], isEdit: boolean = false) => {
    const matching = STATUS_TYPES.find(s => s.value === type)
    if (isEdit) {
      setEditStatusType(type)
      setEditStatus(matching?.label || '')
    } else {
      setNewStatusType(type)
      setNewStatus(matching?.label || '')
    }
  }

  const handleAdd = () => {
    const maxOrder = exams.reduce((max, e) => Math.max(max, e.order), 0)
    const newExam: UpcomingExam = {
      id: Date.now().toString(),
      name: newName,
      date: newDate,
      status: newStatus || STATUS_TYPES.find(s => s.value === newStatusType)?.label || '',
      statusType: newStatusType,
      catSlug: newCatSlug,
      isActive: true,
      order: maxOrder + 1,
      imageUrl: newImageUrl || undefined,
      description: newDescription || undefined,
    }
    onUpdate([...exams, newExam])
    setNewName('')
    setNewDate('')
    setNewStatus('')
    setNewStatusType('open')
    setNewCatSlug('')
    setNewImageUrl('')
    setNewDescription('')
  }

  const handleDelete = (index: number) => {
    onUpdate(exams.filter((_, i) => i !== index))
    if (editingIndex === index) setEditingIndex(null)
  }

  const handleToggleActive = (index: number) => {
    const updated = [...exams]
    updated[index] = { ...updated[index], isActive: !updated[index].isActive }
    onUpdate(updated)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...exams]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    // Reassign order numbers
    updated.forEach((e, i) => { e.order = i + 1 })
    onUpdate(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index === exams.length - 1) return
    const updated = [...exams]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    updated.forEach((e, i) => { e.order = i + 1 })
    onUpdate(updated)
  }

  const startEdit = (index: number) => {
    const exam = exams[index]
    setEditingIndex(index)
    setEditName(exam.name)
    setEditDate(exam.date)
    setEditStatus(exam.status)
    setEditStatusType(exam.statusType)
    setEditCatSlug(exam.catSlug)
    setEditImageUrl(exam.imageUrl || '')
    setEditDescription(exam.description || '')
  }

  const cancelEdit = () => {
    setEditingIndex(null)
  }

  const saveEdit = (index: number) => {
    const updated = [...exams]
    updated[index] = {
      ...updated[index],
      name: editName,
      date: editDate,
      status: editStatus,
      statusType: editStatusType,
      catSlug: editCatSlug,
      imageUrl: editImageUrl || undefined,
      description: editDescription || undefined,
    }
    onUpdate(updated)
    setEditingIndex(null)
  }

  const activeCount = exams.filter(e => e.isActive).length

  return (
    <div className="space-y-4">
      {/* Add New Exam */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" /> Add Upcoming Exam
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Exam name (e.g. SSC CGL 2025)"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                placeholder="Date (e.g. 15 Jul 2025)"
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <input
                type="text"
                value={newCatSlug}
                onChange={e => setNewCatSlug(e.target.value)}
                placeholder="Category slug (e.g. ssc)"
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Status Type</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_TYPES.map(st => (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => handleStatusTypeChange(st.value as UpcomingExam['statusType'])}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      newStatusType === st.value
                        ? st.color + ' ring-2 ring-offset-1 ring-blue-300'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              placeholder="Custom status text (optional, auto-filled from type)"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <textarea
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Description (shown in detail view - exam details, dates, links etc.)"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />

            {/* Image Upload Section */}
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Image (optional)</p>
              {newImageUrl ? (
                <div className="relative rounded-xl overflow-hidden mb-2">
                  <img src={newImageUrl} alt="Preview" className="w-full h-28 object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => setNewImageUrl('')}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-xs text-gray-500"
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
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              )}
            </div>

            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl h-11 font-semibold"
              disabled={!newName || !newDate}
              onClick={handleAdd}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Exam
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Exams */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="font-bold text-sm">Upcoming Exams ({exams.length}) · Active: {activeCount}</h3>
          {exams.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Reset exams to defaults?')) {
                  onUpdate(DEFAULT_UPCOMING_EXAMS)
                }
              }}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {exams.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No upcoming exams yet</p>
                <p className="text-gray-300 text-xs">Add your first exam above</p>
              </CardContent>
            </Card>
          ) : (
            exams.map((exam, i) => (
              <Card key={exam.id} className={`border-0 shadow-sm hover:shadow-md transition-shadow ${!exam.isActive ? 'opacity-50' : 'border-l-4 border-l-blue-400'} ${editingIndex === i ? 'ring-2 ring-blue-300' : ''}`}>
                {editingIndex === i ? (
                  /* Edit Mode */
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-bold text-xs text-blue-600 flex items-center gap-1">
                      <Edit3 className="w-3 h-3" /> Editing Exam
                    </h4>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Exam name"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editDate}
                        onChange={e => setEditDate(e.target.value)}
                        placeholder="Date"
                        className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      <input
                        type="text"
                        value={editCatSlug}
                        onChange={e => setEditCatSlug(e.target.value)}
                        placeholder="Category slug"
                        className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Status Type</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_TYPES.map(st => (
                          <button
                            key={st.value}
                            type="button"
                            onClick={() => handleStatusTypeChange(st.value as UpcomingExam['statusType'], true)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                              editStatusType === st.value
                                ? st.color + ' ring-2 ring-offset-1 ring-blue-300'
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value)}
                      placeholder="Custom status text"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <textarea
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      placeholder="Description (exam details, dates, links)"
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                    />

                    {/* Edit Image */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Image</p>
                      {editImageUrl ? (
                        <div className="relative rounded-xl overflow-hidden mb-2">
                          <img src={editImageUrl} alt="Preview" className="w-full h-24 object-cover rounded-xl" />
                          <button
                            type="button"
                            onClick={() => setEditImageUrl('')}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 text-xs text-gray-500"
                          >
                            <ImagePlus className="w-4 h-4" /> Upload
                          </button>
                          <input
                            ref={editFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleEditImageUpload}
                          />
                          <input
                            type="text"
                            placeholder="Or paste URL..."
                            value={editImageUrl}
                            onChange={e => setEditImageUrl(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl"
                        onClick={() => saveEdit(i)}
                      >
                        <Check className="w-4 h-4 mr-1" /> Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-xl"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                ) : (
                  /* View Mode */
                  <CardContent className="p-3 flex items-center gap-3">
                    {exam.imageUrl ? (
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={exam.imageUrl} alt={exam.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-blue-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{exam.name}</p>
                      <p className="text-gray-400 text-xs">{exam.date}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className={`text-[10px] ${
                          STATUS_TYPES.find(s => s.value === exam.statusType)?.color || 'bg-gray-100 text-gray-600'
                        }`}>
                          {exam.status}
                        </Badge>
                        {exam.catSlug && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <ExternalLink className="w-2.5 h-2.5" /> {exam.catSlug}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => handleMoveUp(i)}
                          disabled={i === 0}
                          className="w-6 h-6 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp className="w-3 h-3 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(i)}
                          disabled={i === exams.length - 1}
                          className="w-6 h-6 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleToggleActive(i)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        title={exam.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {exam.isActive ? (
                          <ToggleRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => startEdit(i)}
                        className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(i)}
                        className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
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
