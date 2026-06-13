'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText, Plus, Trash2, RefreshCw, Edit3, X, Check,
  ArrowUp, ArrowDown, ChevronDown, ChevronRight, HelpCircle, ListChecks, Upload
} from 'lucide-react'
import {
  type PrevYearPaper, type PaperQuestion,
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

  // Question management states
  const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null)
  const [newQText, setNewQText] = useState('')
  const [newQA, setNewQA] = useState('')
  const [newQB, setNewQB] = useState('')
  const [newQC, setNewQC] = useState('')
  const [newQD, setNewQD] = useState('')
  const [newQCorrect, setNewQCorrect] = useState('A')
  const [newQExplanation, setNewQExplanation] = useState('')
  const [editingQId, setEditingQId] = useState<string | null>(null)
  const [editQText, setEditQText] = useState('')
  const [editQA, setEditQA] = useState('')
  const [editQB, setEditQB] = useState('')
  const [editQC, setEditQC] = useState('')
  const [editQD, setEditQD] = useState('')
  const [editQCorrect, setEditQCorrect] = useState('A')
  const [editQExplanation, setEditQExplanation] = useState('')

  // Bulk import states
  const [showBulkImport, setShowBulkImport] = useState<string | null>(null) // paperId
  const [bulkText, setBulkText] = useState('')

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

  // Helper: update a specific paper in the papers array
  const updatePaper = (paperId: string, updates: Partial<PrevYearPaper>) => {
    onUpdate(papers.map(p => p.id === paperId ? { ...p, ...updates } : p))
  }

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
      questions: [],
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
    if (expandedPaperId === paper.id) setExpandedPaperId(null)
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

  // Question management
  const handleAddQuestion = (paperId: string) => {
    if (!newQText.trim() || !newQA.trim() || !newQB.trim() || !newQC.trim() || !newQD.trim()) return
    const newQ: PaperQuestion = {
      id: Date.now().toString(),
      questionText: newQText,
      optionA: newQA,
      optionB: newQB,
      optionC: newQC,
      optionD: newQD,
      correctAnswer: newQCorrect,
      explanation: newQExplanation || undefined,
    }
    const paper = papers.find(p => p.id === paperId)
    if (!paper) return
    const updatedQuestions = [...(paper.questions || []), newQ]
    updatePaper(paperId, {
      questions: updatedQuestions,
      totalQuestions: updatedQuestions.length,
    })
    // Clear form
    setNewQText('')
    setNewQA('')
    setNewQB('')
    setNewQC('')
    setNewQD('')
    setNewQCorrect('A')
    setNewQExplanation('')
  }

  const handleDeleteQuestion = (paperId: string, qId: string) => {
    const paper = papers.find(p => p.id === paperId)
    if (!paper) return
    const updatedQuestions = (paper.questions || []).filter(q => q.id !== qId)
    updatePaper(paperId, {
      questions: updatedQuestions,
      totalQuestions: updatedQuestions.length,
    })
    if (editingQId === qId) setEditingQId(null)
  }

  const handleStartEditQuestion = (paperId: string, q: PaperQuestion) => {
    setEditingQId(q.id)
    setEditQText(q.questionText)
    setEditQA(q.optionA)
    setEditQB(q.optionB)
    setEditQC(q.optionC)
    setEditQD(q.optionD)
    setEditQCorrect(q.correctAnswer)
    setEditQExplanation(q.explanation || '')
  }

  const handleSaveEditQuestion = (paperId: string) => {
    if (!editingQId) return
    if (!editQText.trim() || !editQA.trim() || !editQB.trim() || !editQC.trim() || !editQD.trim()) return
    const paper = papers.find(p => p.id === paperId)
    if (!paper) return
    const updatedQuestions = (paper.questions || []).map(q =>
      q.id === editingQId ? {
        ...q,
        questionText: editQText,
        optionA: editQA,
        optionB: editQB,
        optionC: editQC,
        optionD: editQD,
        correctAnswer: editQCorrect,
        explanation: editQExplanation || undefined,
      } : q
    )
    updatePaper(paperId, { questions: updatedQuestions })
    setEditingQId(null)
  }

  const handleMoveQuestionUp = (paperId: string, qIndex: number) => {
    if (qIndex === 0) return
    const paper = papers.find(p => p.id === paperId)
    if (!paper) return
    const qs = [...(paper.questions || [])]
    const temp = qs[qIndex]
    qs[qIndex] = qs[qIndex - 1]
    qs[qIndex - 1] = temp
    updatePaper(paperId, { questions: qs })
  }

  const handleMoveQuestionDown = (paperId: string, qIndex: number) => {
    const paper = papers.find(p => p.id === paperId)
    if (!paper) return
    const qs = [...(paper.questions || [])]
    if (qIndex >= qs.length - 1) return
    const temp = qs[qIndex]
    qs[qIndex] = qs[qIndex + 1]
    qs[qIndex + 1] = temp
    updatePaper(paperId, { questions: qs })
  }

  // Bulk import questions
  const handleBulkImport = (paperId: string) => {
    if (!bulkText.trim()) return
    const paper = papers.find(p => p.id === paperId)
    if (!paper) return

    try {
      const lines = bulkText.trim().split('\n').filter(l => l.trim())
      const existingQuestions = paper.questions || []
      const newQuestions: PaperQuestion[] = lines.map((line, i) => {
        const parts = line.split('|')
        return {
          id: `${Date.now()}-${i}`,
          questionText: parts[0]?.trim() || '',
          optionA: parts[1]?.trim() || '',
          optionB: parts[2]?.trim() || '',
          optionC: parts[3]?.trim() || '',
          optionD: parts[4]?.trim() || '',
          correctAnswer: parts[5]?.trim() || 'A',
          explanation: parts[6]?.trim() || undefined,
        }
      }).filter(q => q.questionText && q.optionA && q.optionB && q.optionC && q.optionD)

      if (newQuestions.length === 0) return

      const allQuestions = [...existingQuestions, ...newQuestions]
      updatePaper(paperId, {
        questions: allQuestions,
        totalQuestions: allQuestions.length,
      })
      setBulkText('')
      setShowBulkImport(null)
    } catch (e) {
      console.error('Bulk import failed:', e)
    }
  }

  // Parse bulk text to show preview count
  const getParsedCount = (): number => {
    if (!bulkText.trim()) return 0
    const lines = bulkText.trim().split('\n').filter(l => l.trim())
    return lines.filter(line => {
      const parts = line.split('|')
      return parts[0]?.trim() && parts[1]?.trim() && parts[2]?.trim() && parts[3]?.trim() && parts[4]?.trim()
    }).length
  }

  const correctOptionColor = (opt: string, correct: string) =>
    opt === correct ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-gray-50 text-gray-600 border-gray-200'

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
                onClick={() => { setSelectedYear(year); setEditingIndex(null); setExpandedPaperId(null) }}
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
            filteredPapers.map((paper, i) => {
              const isExpanded = expandedPaperId === paper.id
              const questions = paper.questions || []
              return (
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
                    <CardContent className="p-0">
                      {/* Paper header row */}
                      <div className="flex items-center gap-3 p-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{paper.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge className="text-[9px] border-0 bg-gray-100 text-gray-600">{categories.find(c => c.value === paper.examCategory)?.label || paper.examCategory}</Badge>
                            <span className="text-gray-400 text-[10px]">{questions.length}Q added · {paper.duration}m</span>
                            <Badge className={`text-[9px] border-0 ${diffColor(paper.difficulty)}`}>{paper.difficulty}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setExpandedPaperId(isExpanded ? null : paper.id)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`} title="Manage Questions">
                            <ListChecks className="w-3.5 h-3.5 text-blue-500" />
                          </button>
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

                      {/* Expanded: Question Management */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 p-3 bg-gray-50/50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <HelpCircle className="w-4 h-4 text-indigo-500" />
                              <h4 className="font-bold text-xs text-gray-600">QUESTIONS ({questions.length})</h4>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl text-xs border-purple-200 text-purple-600 hover:bg-purple-50 h-7"
                              onClick={() => { setShowBulkImport(showBulkImport === paper.id ? null : paper.id); setBulkText('') }}
                            >
                              <Upload className="w-3 h-3 mr-1" /> Bulk Import
                            </Button>
                          </div>

                          {/* Bulk Import Section */}
                          {showBulkImport === paper.id && (
                            <div className="mb-3 bg-white rounded-xl border-2 border-purple-100 p-3 space-y-2">
                              <p className="text-sm font-semibold text-purple-700">Bulk Import Questions</p>
                              <p className="text-[10px] text-gray-500 leading-relaxed">
                                Format: <code className="bg-gray-100 px-1 py-0.5 rounded text-purple-600">Question|OptionA|OptionB|OptionC|OptionD|Answer|Explanation</code>
                              </p>
                              <p className="text-[10px] text-gray-400">
                                One question per line. Answer must be A, B, C, or D. Explanation is optional.
                              </p>
                              <div className="bg-gray-50 rounded-lg p-2 text-[10px] text-gray-500 font-mono">
                                <p className="text-gray-400">Example:</p>
                                <p>What is the capital of India?|Mumbai|New Delhi|Kolkata|Chennai|B|New Delhi is the capital of India</p>
                                <p>Who wrote Ramayana?|Vyasa|Valmiki|Tulsidas|Kalidas|B</p>
                              </div>
                              <textarea
                                value={bulkText}
                                onChange={e => setBulkText(e.target.value)}
                                placeholder="Paste questions here...&#10;Question|OptionA|OptionB|OptionC|OptionD|Answer|Explanation"
                                rows={8}
                                className="w-full px-3 py-2 rounded-lg border border-purple-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-300 resize-y"
                              />
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                  {bulkText.trim()
                                    ? <span className="font-semibold text-purple-600">{getParsedCount()} question(s) detected</span>
                                    : 'Paste your questions above'}
                                </p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white h-8 text-xs"
                                    onClick={() => handleBulkImport(paper.id)}
                                    disabled={!bulkText.trim() || getParsedCount() === 0}
                                  >
                                    <Upload className="w-3 h-3 mr-1" /> Import ({getParsedCount()})
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl h-8 text-xs"
                                    onClick={() => setShowBulkImport(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Existing Questions List */}
                          {questions.length > 0 && (
                            <div className="space-y-2 mb-3 max-h-[400px] overflow-y-auto">
                              {questions.map((q, qi) => (
                                <div key={q.id} className={`rounded-xl border bg-white p-3 transition-all ${editingQId === q.id ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-gray-100'}`}>
                                  {editingQId === q.id ? (
                                    /* Edit Question Form */
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-indigo-600">Q{qi + 1} - EDITING</span>
                                        <div className="flex gap-1">
                                          <button onClick={() => handleSaveEditQuestion(paper.id)} className="w-6 h-6 rounded bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center" title="Save">
                                            <Check className="w-3 h-3 text-emerald-600" />
                                          </button>
                                          <button onClick={() => setEditingQId(null)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center" title="Cancel">
                                            <X className="w-3 h-3 text-gray-500" />
                                          </button>
                                        </div>
                                      </div>
                                      <textarea value={editQText} onChange={e => setEditQText(e.target.value)} placeholder="Question text" rows={2} className="w-full px-2.5 py-2 rounded-lg border border-indigo-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none" />
                                      <div className="grid grid-cols-2 gap-1.5">
                                        <div className="flex items-center gap-1">
                                          <button onClick={() => setEditQCorrect('A')} className={`w-6 h-6 rounded text-[9px] font-bold border ${correctOptionColor('A', editQCorrect)}`}>A</button>
                                          <input value={editQA} onChange={e => setEditQA(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button onClick={() => setEditQCorrect('B')} className={`w-6 h-6 rounded text-[9px] font-bold border ${correctOptionColor('B', editQCorrect)}`}>B</button>
                                          <input value={editQB} onChange={e => setEditQB(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button onClick={() => setEditQCorrect('C')} className={`w-6 h-6 rounded text-[9px] font-bold border ${correctOptionColor('C', editQCorrect)}`}>C</button>
                                          <input value={editQC} onChange={e => setEditQC(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button onClick={() => setEditQCorrect('D')} className={`w-6 h-6 rounded text-[9px] font-bold border ${correctOptionColor('D', editQCorrect)}`}>D</button>
                                          <input value={editQD} onChange={e => setEditQD(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                                        </div>
                                      </div>
                                      <input value={editQExplanation} onChange={e => setEditQExplanation(e.target.value)} placeholder="Explanation (optional)" className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                                    </div>
                                  ) : (
                                    /* Question Display */
                                    <div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-[10px] font-bold text-gray-400 mt-0.5 flex-shrink-0">Q{qi + 1}</span>
                                        <p className="text-xs text-gray-700 flex-1 leading-relaxed">{q.questionText}</p>
                                        <div className="flex items-center gap-0.5 flex-shrink-0">
                                          <button onClick={() => handleMoveQuestionUp(paper.id, qi)} disabled={qi === 0} className="w-5 h-5 rounded bg-gray-50 hover:bg-gray-100 flex items-center justify-center disabled:opacity-20" title="Move Up">
                                            <ArrowUp className="w-2.5 h-2.5 text-gray-400" />
                                          </button>
                                          <button onClick={() => handleMoveQuestionDown(paper.id, qi)} disabled={qi === questions.length - 1} className="w-5 h-5 rounded bg-gray-50 hover:bg-gray-100 flex items-center justify-center disabled:opacity-20" title="Move Down">
                                            <ArrowDown className="w-2.5 h-2.5 text-gray-400" />
                                          </button>
                                          <button onClick={() => handleStartEditQuestion(paper.id, q)} className="w-5 h-5 rounded bg-blue-50 hover:bg-blue-100 flex items-center justify-center" title="Edit">
                                            <Edit3 className="w-2.5 h-2.5 text-blue-500" />
                                          </button>
                                          <button onClick={() => handleDeleteQuestion(paper.id, q.id)} className="w-5 h-5 rounded bg-red-50 hover:bg-red-100 flex items-center justify-center" title="Delete">
                                            <Trash2 className="w-2.5 h-2.5 text-red-400" />
                                          </button>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-1 mt-1.5 ml-5">
                                        {(['A', 'B', 'C', 'D'] as const).map(opt => (
                                          <div key={opt} className={`px-2 py-1 rounded text-[10px] ${q.correctAnswer === opt ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-500'}`}>
                                            {opt}. {q[`option${opt}`]}
                                            {q.correctAnswer === opt && ' ✓'}
                                          </div>
                                        ))}
                                      </div>
                                      {q.explanation && <p className="text-[9px] text-indigo-500 mt-1 ml-5 italic">💡 {q.explanation}</p>}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {questions.length === 0 && !showBulkImport && (
                            <div className="text-center py-3 mb-3 bg-white rounded-xl border border-dashed border-gray-200">
                              <HelpCircle className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                              <p className="text-gray-400 text-xs">No questions yet</p>
                              <p className="text-gray-300 text-[10px]">Add one by one below, or use Bulk Import</p>
                            </div>
                          )}

                          {/* Add New Question Form */}
                          {!showBulkImport && (
                            <div className="bg-white rounded-xl border border-indigo-100 p-3 space-y-2">
                              <p className="text-[10px] font-bold text-indigo-500">ADD NEW QUESTION</p>
                              <textarea
                                value={newQText}
                                onChange={e => setNewQText(e.target.value)}
                                placeholder="Type your question here..."
                                rows={2}
                                className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none"
                              />
                              <div className="grid grid-cols-2 gap-1.5">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => setNewQCorrect('A')} className={`w-6 h-6 rounded text-[9px] font-bold border ${correctOptionColor('A', newQCorrect)}`}>A</button>
                                  <input value={newQA} onChange={e => setNewQA(e.target.value)} placeholder="Option A" className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => setNewQCorrect('B')} className={`w-6 h-6 rounded text-[9px] font-bold border ${correctOptionColor('B', newQCorrect)}`}>B</button>
                                  <input value={newQB} onChange={e => setNewQB(e.target.value)} placeholder="Option B" className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => setNewQCorrect('C')} className={`w-6 h-6 rounded text-[9px] font-bold border ${correctOptionColor('C', newQCorrect)}`}>C</button>
                                  <input value={newQC} onChange={e => setNewQC(e.target.value)} placeholder="Option C" className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => setNewQCorrect('D')} className={`w-6 h-6 rounded text-[9px] font-bold border ${correctOptionColor('D', newQCorrect)}`}>D</button>
                                  <input value={newQD} onChange={e => setNewQD(e.target.value)} placeholder="Option D" className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                                </div>
                              </div>
                              <p className="text-[9px] text-gray-400">Click A/B/C/D button to set correct answer (green = correct)</p>
                              <input
                                value={newQExplanation}
                                onChange={e => setNewQExplanation(e.target.value)}
                                placeholder="Explanation (optional)"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
                              />
                              <Button
                                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl h-9 text-xs font-semibold"
                                disabled={!newQText.trim() || !newQA.trim() || !newQB.trim() || !newQC.trim() || !newQD.trim()}
                                onClick={() => handleAddQuestion(paper.id)}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Add Question
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
