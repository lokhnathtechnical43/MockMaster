'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Star, Plus, Trash2, RefreshCw, Edit3, X, Check,
  ArrowUp, ArrowDown
} from 'lucide-react'
import {
  type DailyTip,
  DEFAULT_DAILY_TIPS
} from '@/lib/admin-data'

interface DailyTipsTabProps {
  tips: DailyTip[]
  onUpdate: (tips: DailyTip[]) => void
}

export default function DailyTipsTab({ tips, onUpdate }: DailyTipsTabProps) {
  const [newText, setNewText] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  const handleAdd = () => {
    const newTip: DailyTip = {
      id: Date.now().toString(),
      text: newText,
    }
    onUpdate([...tips, newTip])
    setNewText('')
  }

  const handleDelete = (index: number) => {
    if (editingIndex === index) setEditingIndex(null)
    onUpdate(tips.filter((_, i) => i !== index))
  }

  const handleEdit = (index: number) => {
    const t = tips[index]
    setEditingIndex(index)
    setEditText(t.text)
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
  }

  const handleSaveEdit = () => {
    if (editingIndex === null) return
    const updated = [...tips]
    updated[editingIndex] = {
      ...updated[editingIndex],
      text: editText,
    }
    onUpdate(updated)
    setEditingIndex(null)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...tips]
    const temp = updated[index]
    updated[index] = updated[index - 1]
    updated[index - 1] = temp
    onUpdate(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index === tips.length - 1) return
    const updated = [...tips]
    const temp = updated[index]
    updated[index] = updated[index + 1]
    updated[index + 1] = temp
    onUpdate(updated)
  }

  return (
    <div className="space-y-4">
      {/* Add New Daily Tip */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-500" /> Add Daily Tip
          </h3>
          <div className="space-y-3">
            <textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Enter tip text (e.g. Solve at least 50 questions daily from different topics)"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
            />
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl h-11 font-semibold"
              disabled={!newText.trim()}
              onClick={handleAdd}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Tip
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Tips */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="font-bold text-sm">Daily Tips ({tips.length})</h3>
          {tips.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Reset to default daily tips?')) {
                  onUpdate(DEFAULT_DAILY_TIPS)
                }
              }}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
        <div className="space-y-2">
          {tips.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No daily tips</p>
                <p className="text-gray-300 text-xs">Add your first tip above</p>
              </CardContent>
            </Card>
          ) : (
            tips.map((tip, i) => (
              <Card key={tip.id} className={`border-0 shadow-sm transition-all ${editingIndex === i ? 'ring-2 ring-amber-300 shadow-md' : 'hover:shadow-md'}`}>
                {editingIndex === i ? (
                  /* Edit Mode */
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm text-amber-600 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5" /> Editing Tip
                      </h4>
                      <div className="flex gap-1.5">
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editText.trim()}
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
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      placeholder="Enter tip text"
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                    />
                  </CardContent>
                ) : (
                  /* View Mode */
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <Star className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 leading-relaxed">{tip.text}</p>
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
                          disabled={i === tips.length - 1}
                          className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleEdit(i)}
                          className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-500" />
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
