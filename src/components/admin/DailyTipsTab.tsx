'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Lightbulb, Plus, Trash2, RefreshCw, ExternalLink, ToggleLeft, ToggleRight
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
  const [newTipText, setNewTipText] = useState('')
  const [newTipLink, setNewTipLink] = useState('')

  const handleAdd = () => {
    const newTip: DailyTip = {
      id: Date.now().toString(),
      text: newTipText,
      link: newTipLink || undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    onUpdate([newTip, ...tips])
    setNewTipText('')
    setNewTipLink('')
  }

  const handleDelete = (index: number) => {
    onUpdate(tips.filter((_, i) => i !== index))
  }

  const handleToggleActive = (index: number) => {
    const updated = [...tips]
    updated[index] = { ...updated[index], isActive: !updated[index].isActive }
    onUpdate(updated)
  }

  const activeCount = tips.filter(t => t.isActive).length

  return (
    <div className="space-y-4">
      {/* Add New Tip */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" /> Add Daily Tip
          </h3>
          <div className="space-y-3">
            <textarea
              value={newTipText}
              onChange={e => setNewTipText(e.target.value)}
              placeholder="Tip text (e.g. Solve at least 50 questions daily...)"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
            />
            <input
              type="text"
              value={newTipLink}
              onChange={e => setNewTipLink(e.target.value)}
              placeholder="Link (optional, e.g. https://example.com or 'exams')"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl h-11 font-semibold"
              disabled={!newTipText}
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
          <h3 className="font-bold text-sm">Daily Tips ({tips.length}) · Active: {activeCount}</h3>
          {tips.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Reset tips to defaults?')) {
                  onUpdate(DEFAULT_DAILY_TIPS)
                }
              }}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {tips.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <Lightbulb className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No tips yet</p>
                <p className="text-gray-300 text-xs">Add your first daily tip above</p>
              </CardContent>
            </Card>
          ) : (
            tips.map((tip, i) => (
              <Card key={tip.id} className={`border-0 shadow-sm hover:shadow-md transition-shadow ${!tip.isActive ? 'opacity-50' : 'border-l-4 border-l-amber-400'}`}>
                <CardContent className="p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-relaxed">{tip.text}</p>
                    {tip.link && (
                      <p className="text-xs text-blue-500 mt-1 flex items-center gap-1 truncate">
                        <ExternalLink className="w-3 h-3" /> {tip.link}
                      </p>
                    )}
                    <p className="text-gray-300 text-[10px] mt-0.5">
                      {new Date(tip.createdAt).toLocaleDateString()} · {tip.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive(i)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                      title={tip.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {tip.isActive ? (
                        <ToggleRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(i)}
                      className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
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
