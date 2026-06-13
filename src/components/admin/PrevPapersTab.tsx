'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText, Plus, Trash2, RefreshCw, Edit3, X, Check,
  ArrowUp, ArrowDown
} from 'lucide-react'
import {
  type PrevYearPaper,
  DEFAULT_PREV_YEAR_PAPERS
} from '@/lib/admin-data'

interface PrevPapersTabProps {
  papers: PrevYearPaper[]
  onUpdate: (papers: PrevYearPaper[]) => void
}

export default function PrevPapersTab({ papers, onUpdate }: PrevPapersTabProps) {
  const [newYear, setNewYear] = useState('2026')
  const [newName, setNewName] = useState('')
  const [newExamCategory, setNewExamCategory] = useState('ssc')
  const [newTotalQ, setNewTotalQ] = useState('100')
  const [newDuration, setNewDuration] = useState('60')
  const [newDifficulty, setNewDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editYear, setEditYear] = useState('')
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('ssc')
  const [editTotalQ, setEditTotalQ] = useState('100')
  const [editDuration, setEditDuration] = useState('60')
  const [editDifficulty, setEditDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium')

  // Get unique years sorted descending
  const years = [...new Set(papers.map(p => p.year))].sort((a, b) => Number(b) - Number(a))
  const [selectedYear, setSelectedYear] = useState<string>(years[0] || '2026')

  const categories = [
    { value: 'ssc', label: 'SSC' },
    { value: 'banking', label: 'Banking' },
    { value: 'railways', label: 'Railways' },
    { value: 'state-govt', label: 'State Govt' },
    { value: 'teaching', label: 'Teaching' },
    { value: 'defence', label: 'Defence' },
    { value: 'police', label: 'Police' },
  ]

  const difficulties: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Medium', 'Hard']
  const diffColor = (d: string) => d === 'Easy' ? 'bg-emerald-100 text-emerald-700' : d === 'Hard' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'

  const filteredPapers = papers.filter(p => p.year === selectedYear)

  const handleAdd = () => {
    const newPaper: PrevYearPaper = {
      id: Date.now().toString(),
      year: newYear,
      name: newName,
      examCategory: newExamCategory,
      testId: '',
      totalQuestions: Number(newTotalQ) || 100,
      duration: Number(newDuration) || 60,
      difficulty: newDifficulty,
    }
    onUpdate([...papers, newPaper])
    setNewName('')
  }

  const handleDelete = (index: number) => {
    const paper = filteredPapers[index]
    const globalIndex = papers.findIndex(p => p.id === paper.id)
    if (editingIndex !== null) {
      const editPaper = filteredPapers[editingIndex]
      if (editPaper && editPaper.id === paper.id) setEditingIndex(null)
    }
    onUpdate(papers.filter((_, i) => i !== globalIndex))
  }

  const handleEdit = (index: number) => {
    const paper = filteredPapers[index]
    setEditingIndex(index)
    setEditYear(paper.year)
    setEditName(paper.name)
    setEditCategory(paper.examCategory)
    setEditTotalQ(String(paper.totalQuestions))
    setEditDuration(String(paper.duration))
    setEditDifficulty(paper.difficulty as 'Easy' | 'Medium' | 'Hard')
  }

  const handleSaveEdit = () => {
    if (editingIndex === null) return
    const paper = filteredPapers[editingIndex]
    const globalIndex = papers.findIndex(p => p.id === paper.id)
    const updated = [...papers]
    updated[globalIndex] = {
      ...updated[globalIndex],
      year: editYear,
      name: editName,
      examCategory: editCategory,
      totalQuestions: Number(editTotalQ) || 100,
      duration: Number(editDuration) || 60,
      difficulty: editDifficulty,
    }
    onUpdate(updated)
    setEditingIndex(null)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const paper1 = filteredPapers[index]
    const paper2 = filteredPapers[index - 1]
    const gi1 = papers.findIndex(p => p.id === paper1.id)
    const gi2 = papers.findIndex(p => p.id === paper2.id)
    const updated = [...papers]
    const temp = updated[gi1]
    updated[gi1] = updated[gi2]
    updated[gi2] = temp
    onUpdate(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index === filteredPapers.length - 1) return
    const paper1 = filteredPapers[index]
    const paper2 = filteredPapers[index + 1]
    const gi1 = papers.findIndex(p => p.id === paper1.id)
    const gi2 = papers.findIndex(p => p.id === paper2.id)
    const updated = [...papers]
    const temp = updated[gi1]
    updated[gi1] = updated[gi2]
    updated[gi2] = temp
    onUpdate(updated)
  }

  return (
    <div className="space-y-4">
      {/* Year Tabs */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" /> Previous Year Papers
          </h3>
          <div className="flex gap-2 flex-wrap mb-4">
            {years.map(year => (
              <button
                key={year}
                onClick={() => { setSelectedYear(year); setEditingIndex(null) }}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedYear === year
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {year}
              </button>
            ))}
          </div>

          <p className="text-gray-400 text-xs mb-3">
            {filteredPapers.length} paper{filteredPapers.length !== 1 ? 's' : ''} for {selectedYear}
          </p>

          {/* Add New Paper */}
          <div className="space-y-3 border-t border-gray-100 pt-3">
            <p className="text-xs font-bold text-gray-500">ADD NEW PAPER</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newYear}
                onChange={e => setNewYear(e.target.value)}
                placeholder="Year (e.g. 2026)"
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <select
                value={newExamCategory}
                onChange={e => setNewExamCategory(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Paper name (e.g. SSC CGL Tier-I 2026)"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={newTotalQ}
                onChange={e => setNewTotalQ(e.target.value)}
                placeholder="Questions"
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <input
                type="number"
                value={newDuration}
                onChange={e => setNewDuration(e.target.value)}
                placeholder="Duration (min)"
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <div className="flex gap-1">
                {difficulties.map(d => (
                  <button
                    key={d}
                    onClick={() => setNewDifficulty(d)}
                    className={`flex-1 px-2 py-2 rounded-lg text-[10px] font-bold transition-all ${
                      newDifficulty === d ? diffColor(d) : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl h-11 font-semibold"
              disabled={!newName.trim() || !newYear.trim()}
              onClick={handleAdd}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Paper
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Papers List for Selected Year */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="font-bold text-sm">{selectedYear} Papers</h3>
          {papers.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Reset to default papers?')) {
                  onUpdate(DEFAULT_PREV_YEAR_PAPERS)
                }
              }}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
        <div className="space-y-2">
          {filteredPapers.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No papers for {selectedYear}</p>
                <p className="text-gray-300 text-xs">Add your first paper above</p>
              </CardContent>
            </Card>
          ) : (
            filteredPapers.map((paper, i) => (
              <Card key={paper.id} className={`border-0 shadow-sm transition-all ${editingIndex === i ? 'ring-2 ring-blue-300 shadow-md' : 'hover:shadow-md'}`}>
                {editingIndex === i ? (
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm text-blue-600 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5" /> Editing Paper
                      </h4>
                      <div className="flex gap-1.5">
                        <button onClick={handleSaveEdit} disabled={!editName.trim()} className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors disabled:opacity-40" title="Save">
                          <Check className="w-4 h-4 text-emerald-600" />
                        </button>
                        <button onClick={() => setEditingIndex(null)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors" title="Cancel">
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={editYear} onChange={e => setEditYear(e.target.value)} placeholder="Year" className="px-3 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                      <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="px-3 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                        {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Paper name" className="w-full px-3 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" value={editTotalQ} onChange={e => setEditTotalQ(e.target.value)} placeholder="Qs" className="px-3 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                      <input type="number" value={editDuration} onChange={e => setEditDuration(e.target.value)} placeholder="Min" className="px-3 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                      <div className="flex gap-1">
                        {difficulties.map(d => (
                          <button key={d} onClick={() => setEditDifficulty(d)} className={`flex-1 px-2 py-2 rounded-lg text-[10px] font-bold transition-all ${editDifficulty === d ? diffColor(d) : 'bg-gray-100 text-gray-500'}`}>
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{paper.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className="text-[9px] border-0 bg-gray-100 text-gray-600">{categories.find(c => c.value === paper.examCategory)?.label || paper.examCategory}</Badge>
                          <span className="text-gray-400 text-[10px]">{paper.totalQuestions}Q · {paper.duration}m</span>
                          <Badge className={`text-[9px] border-0 ${diffColor(paper.difficulty)}`}>{paper.difficulty}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => handleMoveUp(i)} disabled={i === 0} className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30" title="Move Up">
                          <ArrowUp className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button onClick={() => handleMoveDown(i)} disabled={i === filteredPapers.length - 1} className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30" title="Move Down">
                          <ArrowDown className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button onClick={() => handleEdit(i)} className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors" title="Edit">
                          <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button onClick={() => handleDelete(i)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors" title="Delete">
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
