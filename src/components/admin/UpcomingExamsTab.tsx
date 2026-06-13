'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Calendar, Plus, Trash2, RefreshCw, Edit3, X, Check,
  ArrowUp, ArrowDown
} from 'lucide-react'
import {
  type UpcomingExam,
  DEFAULT_UPCOMING_EXAMS
} from '@/lib/admin-data'

interface UpcomingExamsTabProps {
  exams: UpcomingExam[]
  onUpdate: (exams: UpcomingExam[]) => void
}

export default function UpcomingExamsTab({ exams, onUpdate }: UpcomingExamsTabProps) {
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [newStatusType, setNewStatusType] = useState<UpcomingExam['statusType']>('coming')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editStatusType, setEditStatusType] = useState<UpcomingExam['statusType']>('coming')

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
    }
    onUpdate([...exams, newExam])
    setNewName('')
    setNewDate('')
    setNewStatus('')
  }

  const handleDelete = (index: number) => {
    if (editingIndex === index) setEditingIndex(null)
    onUpdate(exams.filter((_, i) => i !== index))
  }

  const handleEdit = (index: number) => {
    const e = exams[index]
    setEditingIndex(index)
    setEditName(e.name)
    setEditDate(e.date)
    setEditStatus(e.status)
    setEditStatusType(e.statusType)
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
    }
    onUpdate(updated)
    setEditingIndex(null)
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

  return (
    <div className="space-y-4">
      {/* Add New Upcoming Exam */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-500" /> Add Upcoming Exam
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Exam name (e.g. SSC CGL 2025 Tier-I)"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              type="text"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              placeholder="Date (e.g. Jul 2025)"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              type="text"
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              placeholder="Status text (e.g. Registration Open)"
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
          {exams.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Reset to default upcoming exams?')) {
                  onUpdate(DEFAULT_UPCOMING_EXAMS)
                }
              }}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          )}
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
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Exam name"
                      className="w-full px-3 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
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
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-gray-400 text-xs">{exam.date}</p>
                          <Badge className={`text-[9px] font-bold border-0 ${
                            exam.statusType === 'open' ? 'bg-emerald-100 text-emerald-700' :
                            exam.statusType === 'admit' ? 'bg-amber-100 text-amber-700' :
                            exam.statusType === 'closed' ? 'bg-gray-100 text-gray-600' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {exam.status}
                          </Badge>
                        </div>
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
                          disabled={i === exams.length - 1}
                          className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleEdit(i)}
                          className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                          title="Edit"
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
