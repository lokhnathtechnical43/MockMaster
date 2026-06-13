'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Menu, Plus, Trash2, RefreshCw, Edit3, X, Check,
  ArrowUp, ArrowDown, Eye, EyeOff
} from 'lucide-react'
import {
  type SidebarMenuItem,
  DEFAULT_SIDEBAR_MENU
} from '@/lib/admin-data'

interface SidebarTabProps {
  items: SidebarMenuItem[]
  onUpdate: (items: SidebarMenuItem[]) => void
}

const ICON_OPTIONS = [
  { value: 'Home', label: 'Home' },
  { value: 'BookOpen', label: 'Book Open' },
  { value: 'Trophy', label: 'Trophy' },
  { value: 'Zap', label: 'Zap' },
  { value: 'BookmarkPlus', label: 'Bookmark' },
  { value: 'BarChart3', label: 'Chart' },
  { value: 'FileText', label: 'File' },
  { value: 'Target', label: 'Target' },
  { value: 'Clock', label: 'Clock' },
]

const PAGE_OPTIONS = [
  { value: 'home', label: 'Home' },
  { value: 'exams', label: 'All Exams' },
  { value: 'leaderboard', label: 'Leaderboard' },
  { value: 'practice', label: 'Quick Practice' },
  { value: 'bookmarks', label: 'Bookmarks' },
  { value: 'perf-report', label: 'Performance' },
  { value: 'prev-papers', label: 'Prev. Papers' },
  { value: 'your-exam', label: 'Your Exam' },
  { value: 'daily-routine', label: 'Daily Routine' },
]

const GRADIENT_OPTIONS = [
  { value: 'from-orange-500 to-amber-500', label: 'Orange', color: 'bg-orange-500' },
  { value: 'from-blue-500 to-indigo-500', label: 'Blue', color: 'bg-blue-500' },
  { value: 'from-yellow-500 to-orange-500', label: 'Gold', color: 'bg-yellow-500' },
  { value: 'from-amber-400 to-orange-500', label: 'Amber', color: 'bg-amber-500' },
  { value: 'from-rose-400 to-pink-500', label: 'Rose', color: 'bg-rose-500' },
  { value: 'from-emerald-400 to-teal-500', label: 'Green', color: 'bg-emerald-500' },
  { value: 'from-blue-400 to-cyan-500', label: 'Cyan', color: 'bg-cyan-500' },
  { value: 'from-violet-400 to-purple-500', label: 'Purple', color: 'bg-violet-500' },
  { value: 'from-sky-400 to-blue-500', label: 'Sky', color: 'bg-sky-500' },
]

export default function SidebarTab({ items, onUpdate }: SidebarTabProps) {
  const [newLabel, setNewLabel] = useState('')
  const [newIcon, setNewIcon] = useState('Zap')
  const [newPage, setNewPage] = useState('practice')
  const [newGradient, setNewGradient] = useState('from-amber-400 to-orange-500')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editIcon, setEditIcon] = useState('Zap')
  const [editPage, setEditPage] = useState('practice')
  const [editGradient, setEditGradient] = useState('from-amber-400 to-orange-500')

  const sortedItems = [...items].sort((a, b) => a.order - b.order)

  const handleAdd = () => {
    const maxOrder = items.reduce((max, item) => Math.max(max, item.order), 0)
    const newItem: SidebarMenuItem = {
      id: Date.now().toString(),
      icon: newIcon,
      label: newLabel,
      page: newPage,
      gradient: newGradient,
      visible: true,
      order: maxOrder + 1,
    }
    onUpdate([...items, newItem])
    setNewLabel('')
  }

  const handleDelete = (index: number) => {
    const item = sortedItems[index]
    if (editingIndex === index) setEditingIndex(null)
    onUpdate(items.filter(i => i.id !== item.id))
  }

  const handleToggleVisible = (index: number) => {
    const item = sortedItems[index]
    onUpdate(items.map(i => i.id === item.id ? { ...i, visible: !i.visible } : i))
  }

  const handleEdit = (index: number) => {
    const item = sortedItems[index]
    setEditingIndex(index)
    setEditLabel(item.label)
    setEditIcon(item.icon)
    setEditPage(item.page)
    setEditGradient(item.gradient)
  }

  const handleSaveEdit = () => {
    if (editingIndex === null) return
    const item = sortedItems[editingIndex]
    onUpdate(items.map(i => i.id === item.id ? {
      ...i,
      label: editLabel,
      icon: editIcon,
      page: editPage,
      gradient: editGradient,
    } : i))
    setEditingIndex(null)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const item1 = sortedItems[index]
    const item2 = sortedItems[index - 1]
    onUpdate(items.map(i => {
      if (i.id === item1.id) return { ...i, order: item2.order }
      if (i.id === item2.id) return { ...i, order: item1.order }
      return i
    }))
  }

  const handleMoveDown = (index: number) => {
    if (index === sortedItems.length - 1) return
    const item1 = sortedItems[index]
    const item2 = sortedItems[index + 1]
    onUpdate(items.map(i => {
      if (i.id === item1.id) return { ...i, order: item2.order }
      if (i.id === item2.id) return { ...i, order: item1.order }
      return i
    }))
  }

  return (
    <div className="space-y-4">
      {/* Add New Menu Item */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-violet-500" /> Add Menu Item
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="Display name (e.g. Quick Practice)"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            <div className="grid grid-cols-2 gap-2">
              <select value={newIcon} onChange={e => setNewIcon(e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select value={newPage} onChange={e => setNewPage(e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                {PAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Color</p>
              <div className="flex gap-2 flex-wrap">
                {GRADIENT_OPTIONS.map(g => (
                  <button
                    key={g.value}
                    onClick={() => setNewGradient(g.value)}
                    className={`w-8 h-8 rounded-lg ${g.color} transition-all ${
                      newGradient === g.value ? 'ring-2 ring-offset-2 ring-violet-400 scale-110' : 'hover:scale-105'
                    }`}
                    title={g.label}
                  />
                ))}
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl h-11 font-semibold"
              disabled={!newLabel.trim()}
              onClick={handleAdd}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Menu Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Menu Items */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="font-bold text-sm">Sidebar Menu ({sortedItems.length})</h3>
          <button
            onClick={() => {
              if (confirm('Reset to default sidebar menu?')) {
                onUpdate(DEFAULT_SIDEBAR_MENU)
              }
            }}
            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        </div>
        <div className="space-y-2">
          {sortedItems.map((item, i) => (
            <Card key={item.id} className={`border-0 shadow-sm transition-all ${!item.visible ? 'opacity-50' : ''} ${editingIndex === i ? 'ring-2 ring-violet-300 shadow-md' : 'hover:shadow-md'}`}>
              {editingIndex === i ? (
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-sm text-violet-600 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" /> Editing Menu Item
                    </h4>
                    <div className="flex gap-1.5">
                      <button onClick={handleSaveEdit} disabled={!editLabel.trim()} className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors disabled:opacity-40" title="Save">
                        <Check className="w-4 h-4 text-emerald-600" />
                      </button>
                      <button onClick={() => setEditingIndex(null)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors" title="Cancel">
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <input type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)} placeholder="Display name" className="w-full px-3 py-2.5 rounded-xl border border-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={editIcon} onChange={e => setEditIcon(e.target.value)} className="px-3 py-2.5 rounded-xl border border-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                      {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select value={editPage} onChange={e => setEditPage(e.target.value)} className="px-3 py-2.5 rounded-xl border border-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                      {PAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Color</p>
                    <div className="flex gap-2 flex-wrap">
                      {GRADIENT_OPTIONS.map(g => (
                        <button key={g.value} onClick={() => setEditGradient(g.value)} className={`w-8 h-8 rounded-lg ${g.color} transition-all ${editGradient === g.value ? 'ring-2 ring-offset-2 ring-violet-400 scale-110' : 'hover:scale-105'}`} title={g.label} />
                      ))}
                    </div>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Menu className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.label}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-gray-400 text-[10px]">{item.page}</span>
                        <span className="text-gray-400 text-[10px]">· {item.icon}</span>
                        {!item.visible && <span className="text-red-400 text-[10px] font-bold">HIDDEN</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleToggleVisible(i)} className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors" title={item.visible ? 'Hide' : 'Show'}>
                        {item.visible ? <Eye className="w-3.5 h-3.5 text-gray-500" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
                      </button>
                      <button onClick={() => handleMoveUp(i)} disabled={i === 0} className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30" title="Move Up">
                        <ArrowUp className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button onClick={() => handleMoveDown(i)} disabled={i === sortedItems.length - 1} className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30" title="Move Down">
                        <ArrowDown className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button onClick={() => handleEdit(i)} className="w-7 h-7 rounded-lg bg-violet-50 hover:bg-violet-100 flex items-center justify-center transition-colors" title="Edit">
                        <Edit3 className="w-3.5 h-3.5 text-violet-500" />
                      </button>
                      <button onClick={() => handleDelete(i)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
