'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Calendar, Plus, Trash2, RefreshCw, Edit3, X, Check,
  ArrowUp, ArrowDown, ChevronDown, ChevronUp, Eye, AlertTriangle, FileEdit
} from 'lucide-react'
import {
  type UpcomingExam,
  DEFAULT_UPCOMING_EXAMS
} from '@/lib/admin-data'

interface UpcomingExamsTabProps {
  exams: UpcomingExam[]
  onUpdate: (exams: UpcomingExam[]) => void
}

// Detail field definitions for the form
const DETAIL_FIELDS: { key: keyof UpcomingExam; label: string; placeholder: string; multiline?: boolean; icon?: string }[] = [
  { key: 'description', label: 'Description', placeholder: 'Brief description of the exam', multiline: true },
  { key: 'conductingBody', label: 'Conducting Body', placeholder: 'e.g. SSC, IBPS, UPSC' },
  { key: 'eligibility', label: 'Eligibility', placeholder: 'e.g. Graduate in any discipline' },
  { key: 'examDate', label: 'Exam Date', placeholder: 'e.g. 15 Jul 2025' },
  { key: 'applicationDeadline', label: 'Application Deadline', placeholder: 'e.g. 30 Jun 2025' },
  { key: 'applicationLink', label: 'Application Link', placeholder: 'e.g. https://ssc.nic.in' },
  { key: 'examMode', label: 'Exam Mode', placeholder: 'e.g. Online (CBT), Offline (OMR)' },
  { key: 'totalPosts', label: 'Total Posts / Vacancies', placeholder: 'e.g. 5000 vacancies' },
  { key: 'salary', label: 'Salary / Pay Scale', placeholder: 'e.g. Rs. 25,500 - 81,100' },
  { key: 'examPattern', label: 'Exam Pattern', placeholder: 'e.g. 100 questions, 60 min, -0.25 negative' },
  { key: 'importantDates', label: 'Important Dates', placeholder: 'One per line: Reg Start: 1 Jun\nReg End: 30 Jun', multiline: true },
  { key: 'officialWebsite', label: 'Official Website', placeholder: 'e.g. https://ssc.nic.in' },
]

// Create an empty detail fields object
function emptyDetailFields(): Record<string, string> {
  const fields: Record<string, string> = {}
  DETAIL_FIELDS.forEach(f => { fields[f.key] = '' })
  return fields
}

// Extract detail fields from an UpcomingExam object
function extractDetailFields(exam: UpcomingExam): Record<string, string> {
  const details: Record<string, string> = {}
  DETAIL_FIELDS.forEach(f => {
    details[f.key] = (exam as any)[f.key] || ''
  })
  return details
}

// Find a matching default exam by name (for auto-filling details)
function findDefaultExam(name: string): UpcomingExam | undefined {
  return DEFAULT_UPCOMING_EXAMS.find(d => d.name === name)
}

export default function UpcomingExamsTab({ exams, onUpdate }: UpcomingExamsTabProps) {
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [newStatusType, setNewStatusType] = useState<UpcomingExam['statusType']>('coming')
  const [newDetails, setNewDetails] = useState<Record<string, string>>(emptyDetailFields())
  const [showNewDetails, setShowNewDetails] = useState(false)

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editStatusType, setEditStatusType] = useState<UpcomingExam['statusType']>('coming')
  const [editDetails, setEditDetails] = useState<Record<string, string>>(emptyDetailFields())
  const [showEditDetails, setShowEditDetails] = useState(false)

  // Track which exam cards are expanded (showing detail preview)
  const [expandedCard, setExpandedCard] = useState<number | null>(null)

  const statusTypes = [
    { label: 'Registration Open', value: 'open' as const, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Coming Soon', value: 'coming' as const, color: 'bg-blue-100 text-blue-700' },
    { label: 'Admit Card', value: 'admit' as const, color: 'bg-amber-100 text-amber-700' },
    { label: 'Closed', value: 'closed' as const, color: 'bg-gray-100 text-gray-600' },
  ]

  const handleAdd = () => {
    const newExam: UpcomingExam = {
      id: Date.now().toString(),
      name: newName,
      date: newDate,
      status: newStatus,
      statusType: newStatusType,
      ...Object.fromEntries(Object.entries(newDetails).filter(([_, v]) => v.trim() !== '')),
    }
    onUpdate([...exams, newExam])
    setNewName('')
    setNewDate('')
    setNewStatus('')
    setNewDetails(emptyDetailFields())
    setShowNewDetails(false)
  }

  const handleDelete = (index: number) => {
    if (editingIndex === index) setEditingIndex(null)
    if (expandedCard === index) setExpandedCard(null)
    onUpdate(exams.filter((_, i) => i !== index))
  }

  const handleEdit = (index: number, openDetails = false) => {
    const e = exams[index]
    setEditingIndex(index)
    setEditName(e.name)
    setEditDate(e.date)
    setEditStatus(e.status)
    setEditStatusType(e.statusType)
    // Load existing detail fields
    setEditDetails(extractDetailFields(e))
    // Auto-open detail section if requested or if exam has existing details
    setShowEditDetails(openDetails || hasDetails(e))
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
  }

  const handleSaveEdit = () => {
    if (editingIndex === null) return
    const updated = [...exams]
    updated[editingIndex] = {
      ...updated[editingIndex],
      name: editName,
      date: editDate,
      status: editStatus,
      statusType: editStatusType,
      // Only include non-empty detail fields
      ...Object.fromEntries(Object.entries(editDetails).filter(([_, v]) => v.trim() !== '')),
    }
    // Remove detail fields that were cleared
    DETAIL_FIELDS.forEach(f => {
      if (!editDetails[f.key]?.trim()) {
        delete (updated[editingIndex] as any)[f.key]
      }
    })
    onUpdate(updated)
    setEditingIndex(null)
  }

  // Auto-fill details from defaults when adding a new exam
  const handleAutoFillNew = () => {
    const defaultExam = findDefaultExam(newName)
    if (defaultExam) {
      setNewDetails(extractDetailFields(defaultExam))
      if (!newDate && defaultExam.date) setNewDate(defaultExam.date)
      if (!newStatus && defaultExam.status) setNewStatus(defaultExam.status)
      if (defaultExam.statusType) setNewStatusType(defaultExam.statusType)
      setShowNewDetails(true)
    }
  }

  // Auto-fill details from defaults when editing an exam
  const handleAutoFillEdit = () => {
    const defaultExam = findDefaultExam(editName)
    if (defaultExam) {
      setEditDetails(extractDetailFields(defaultExam))
      setShowEditDetails(true)
    }
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...exams]
    const temp = updated[index]
    updated[index] = updated[index - 1]
    updated[index - 1] = temp
    onUpdate(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index === exams.length - 1) return
    const updated = [...exams]
    const temp = updated[index]
    updated[index] = updated[index + 1]
    updated[index + 1] = temp
    onUpdate(updated)
  }

  // Fill missing details for all exams from defaults
  const handleFillAllFromDefaults = () => {
    if (!confirm('Auto-fill missing details for all exams from defaults? This will only fill empty fields.')) return
    const updated = exams.map(exam => {
      const defaultExam = findDefaultExam(exam.name)
      if (!defaultExam) return exam
      const merged = { ...exam }
      DETAIL_FIELDS.forEach(f => {
        if (!(exam as any)[f.key]?.trim() && (defaultExam as any)[f.key]?.trim()) {
          (merged as any)[f.key] = (defaultExam as any)[f.key]
        }
      })
      return merged
    })
    onUpdate(updated)
  }

  // Check if an exam has any detail fields filled
  const hasDetails = (exam: UpcomingExam): boolean => {
    return DETAIL_FIELDS.some(f => (exam as any)[f.key]?.trim())
  }

  // Count how many detail fields are filled
  const countDetails = (exam: UpcomingExam): number => {
    return DETAIL_FIELDS.filter(f => (exam as any)[f.key]?.trim()).length
  }

  // Check if an exam name matches a default exam
  const hasDefaultMatch = (name: string): boolean => {
    return DEFAULT_UPCOMING_EXAMS.some(d => d.name === name)
  }

  return (
    <div className="space-y-4">
      {/* Add New Upcoming Exam */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-500" /> Add Upcoming Exam
          </h3>
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Exam name (e.g. SSC CGL 2025 Tier-I) *"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              {newName && hasDefaultMatch(newName) && !showNewDetails && (
                <button
                  type="button"
                  onClick={handleAutoFillNew}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[10px] font-medium text-blue-600 transition-colors"
                >
                  Auto-fill
                </button>
              )}
            </div>
            <input
              type="text"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              placeholder="Date (e.g. Jul 2025) *"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              type="text"
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              placeholder="Status text (e.g. Registration Open) *"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Status Type</p>
              <div className="flex gap-2 flex-wrap">
                {statusTypes.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setNewStatusType(t.value)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      newStatusType === t.value ? t.color : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Detail Fields Toggle */}
            <button
              type="button"
              onClick={() => setShowNewDetails(!showNewDetails)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs text-gray-600 transition-colors"
            >
              <span className="font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Detailed Info (shown when user taps on exam)
              </span>
              {showNewDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showNewDetails && (
              <div className="space-y-2.5 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wider">Exam Details</p>
                {DETAIL_FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="text-[11px] text-gray-500 font-medium block mb-1">{f.label}</label>
                    {f.multiline ? (
                      <textarea
                        value={newDetails[f.key] || ''}
                        onChange={e => setNewDetails(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-y"
                      />
                    ) : (
                      <input
                        type={f.key.toLowerCase().includes('link') || f.key.toLowerCase().includes('website') ? 'url' : 'text'}
                        value={newDetails[f.key] || ''}
                        onChange={e => setNewDetails(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl h-11 font-semibold"
              disabled={!newName || !newDate || !newStatus}
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
          <h3 className="font-bold text-sm">Upcoming Exams ({exams.length})</h3>
          <div className="flex items-center gap-3">
            {exams.some(e => !hasDetails(e)) && (
              <button
                onClick={handleFillAllFromDefaults}
                className="text-xs text-amber-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
              >
                <FileEdit className="w-3 h-3" /> Fill Missing Details
              </button>
            )}
            {exams.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Reset to default upcoming exams? This will replace all current exams with defaults.')) {
                    onUpdate(DEFAULT_UPCOMING_EXAMS)
                  }
                }}
                className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {exams.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No upcoming exams</p>
                <p className="text-gray-300 text-xs">Add your first exam above</p>
              </CardContent>
            </Card>
          ) : (
            exams.map((exam, i) => (
              <Card key={exam.id} className={`border-0 shadow-sm transition-all ${editingIndex === i ? 'ring-2 ring-blue-300 shadow-md' : 'hover:shadow-md'}`}>
                {editingIndex === i ? (
                  /* Edit Mode */
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm text-blue-600 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5" /> Editing Exam
                      </h4>
                      <div className="flex gap-1.5">
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editName || !editDate || !editStatus}
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
                    <div className="relative">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="Exam name"
                        className="w-full px-3 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      {editName && hasDefaultMatch(editName) && (
                        <button
                          type="button"
                          onClick={handleAutoFillEdit}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[10px] font-medium text-blue-600 transition-colors"
                        >
                          Auto-fill
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                      placeholder="Date"
                      className="w-full px-3 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <input
                      type="text"
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value)}
                      placeholder="Status text"
                      className="w-full px-3 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Status Type</p>
                      <div className="flex gap-2 flex-wrap">
                        {statusTypes.map(t => (
                          <button
                            key={t.value}
                            onClick={() => setEditStatusType(t.value)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                              editStatusType === t.value ? t.color : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Detail Fields Toggle for Edit */}
                    <button
                      type="button"
                      onClick={() => setShowEditDetails(!showEditDetails)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs text-gray-600 transition-colors"
                    >
                      <span className="font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Detailed Info ({DETAIL_FIELDS.filter(f => editDetails[f.key]?.trim()).length}/{DETAIL_FIELDS.length} filled)
                      </span>
                      {showEditDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showEditDetails && (
                      <div className="space-y-2.5 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wider">Exam Details</p>
                          {editName && hasDefaultMatch(editName) && (
                            <button
                              type="button"
                              onClick={handleAutoFillEdit}
                              className="px-2 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-[10px] font-medium text-blue-600 transition-colors"
                            >
                              Fill from defaults
                            </button>
                          )}
                        </div>
                        {DETAIL_FIELDS.map(f => (
                          <div key={f.key}>
                            <label className="text-[11px] text-gray-500 font-medium block mb-1">
                              {f.label}
                              {editDetails[f.key]?.trim() && <span className="text-emerald-500 ml-1">✓</span>}
                            </label>
                            {f.multiline ? (
                              <textarea
                                value={editDetails[f.key] || ''}
                                onChange={e => setEditDetails(prev => ({ ...prev, [f.key]: e.target.value }))}
                                placeholder={f.placeholder}
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-y"
                              />
                            ) : (
                              <input
                                type={f.key.toLowerCase().includes('link') || f.key.toLowerCase().includes('website') ? 'url' : 'text'}
                                value={editDetails[f.key] || ''}
                                onChange={e => setEditDetails(prev => ({ ...prev, [f.key]: e.target.value }))}
                                placeholder={f.placeholder}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                ) : (
                  /* View Mode */
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{exam.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className="text-gray-400 text-xs">{exam.date}</p>
                          <Badge className={`text-[9px] font-bold border-0 ${
                            exam.statusType === 'open' ? 'bg-emerald-100 text-emerald-700' :
                            exam.statusType === 'admit' ? 'bg-amber-100 text-amber-700' :
                            exam.statusType === 'closed' ? 'bg-gray-100 text-gray-600' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {exam.status}
                          </Badge>
                          {hasDetails(exam) ? (
                            <Badge className="text-[9px] font-bold border-0 bg-purple-100 text-purple-700">
                              {countDetails(exam)}/{DETAIL_FIELDS.length} details
                            </Badge>
                          ) : (
                            <Badge className="text-[9px] font-bold border-0 bg-amber-50 text-amber-600">
                              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> No details
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setExpandedCard(expandedCard === i ? null : i)}
                          className="w-7 h-7 rounded-lg bg-purple-50 hover:bg-purple-100 flex items-center justify-center transition-colors"
                          title={hasDetails(exam) ? "Preview details" : "No details to preview"}
                        >
                          <Eye className="w-3.5 h-3.5 text-purple-500" />
                        </button>
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
                          disabled={i === exams.length - 1}
                          className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleEdit(i, true)}
                          className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                          title="Edit exam details"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-500" />
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

                    {/* Expanded detail preview */}
                    {expandedCard === i && (
                      hasDetails(exam) ? (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            {DETAIL_FIELDS.map(f => (exam as any)[f.key]?.trim() ? (
                              <div key={f.key} className="bg-gray-50 rounded-lg px-2 py-1.5">
                                <span className="text-gray-400 font-medium">{f.label}:</span>{' '}
                                <span className="text-gray-700">
                                  {f.multiline
                                    ? (exam as any)[f.key].split('\n')[0] + ((exam as any)[f.key].split('\n').length > 1 ? '...' : '')
                                    : (exam as any)[f.key]
                                  }
                                </span>
                              </div>
                            ) : (
                              <div key={f.key} className="bg-gray-50/50 rounded-lg px-2 py-1.5 opacity-50">
                                <span className="text-gray-300 font-medium">{f.label}:</span>{' '}
                                <span className="text-gray-300 italic">Empty</span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleEdit(i, true)}
                            className="mt-2 w-full py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[11px] font-medium text-blue-600 flex items-center justify-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" /> Edit Details
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="text-center py-3">
                            <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                            <p className="text-xs text-amber-600 font-medium mb-1">No details added yet</p>
                            <p className="text-[10px] text-gray-400 mb-2">Users won't see detail info when they tap this exam</p>
                            <button
                              onClick={() => handleEdit(i, true)}
                              className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-medium flex items-center gap-1 mx-auto transition-colors"
                            >
                              <Edit3 className="w-3 h-3" /> Add Details Now
                            </button>
                          </div>
                        </div>
                      )
                    )}
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
