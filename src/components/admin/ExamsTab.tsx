'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  BookOpen, ChevronRight, Plus, Trash2, Edit3, Save,
  ArrowLeft, RefreshCw, ListChecks, HelpCircle, Database,
  AlertTriangle, X, CheckSquare, Square, Loader2, Upload,
  Trash, FileDown
} from 'lucide-react'
import {
  getCategories, addCategory, updateCategory, deleteCategory,
  getExams, addExam, updateExam, deleteExam,
  getTests, addTest, updateTest, deleteTest,
  getQuestions, addQuestion, updateQuestion, deleteQuestion,
  addBatchQuestions, seedFirestoreIfEmpty,
  deleteAllQuestionsInTest, deleteAllTestsInExam, deleteAllExamsInCategory, deleteAllExamData,
  type FirestoreExamCategory, type FirestoreExam, type FirestoreTest, type FirestoreQuestion
} from '@/lib/firestore-service'
import { getCategories as getLocalCategories } from '@/lib/local-data'

type ViewLevel = 'categories' | 'exams' | 'tests' | 'questions'

export default function ExamsTab() {
  const [viewLevel, setViewLevel] = useState<ViewLevel>('categories')
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Categories
  const [categories, setCategories] = useState<FirestoreExamCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedCategoryName, setSelectedCategoryName] = useState('')

  // Exams
  const [exams, setExams] = useState<FirestoreExam[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [selectedExamName, setSelectedExamName] = useState('')

  // Tests
  const [tests, setTests] = useState<FirestoreTest[]>([])
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)
  const [selectedTestName, setSelectedTestName] = useState('')

  // Questions
  const [questions, setQuestions] = useState<FirestoreQuestion[]>([])

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  // Add states
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addDesc, setAddDesc] = useState('')
  const [addSlug, setAddSlug] = useState('')

  // Add question
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [qText, setQText] = useState('')
  const [qA, setQA] = useState('')
  const [qB, setQB] = useState('')
  const [qC, setQC] = useState('')
  const [qD, setQD] = useState('')
  const [qAns, setQAns] = useState('A')
  const [qExplanation, setQExplanation] = useState('')
  const [qSubject, setQSubject] = useState('')

  // Batch questions
  const [showBatch, setShowBatch] = useState(false)
  const [batchText, setBatchText] = useState('')

  // Multi-select for questions
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  // Delete confirm modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null)

  // Status message
  const [statusMsg, setStatusMsg] = useState('')
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info')

  const showStatus = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMsg(msg)
    setStatusType(type)
    setTimeout(() => setStatusMsg(''), 4000)
  }

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const cats = await getCategories()
      setCategories(cats.map(c => ({
        id: c.id, name: c.name, slug: c.slug, icon: c.icon,
        description: c.description, order: c.order
      })))
    } catch {
      const local = getLocalCategories()
      setCategories(local.map(c => ({
        id: c.id, name: c.name, slug: c.slug, icon: c.icon,
        description: c.description, order: c.order
      })))
    } finally {
      setLoading(false)
    }
  }, [])

  const loadExams = useCallback(async (categoryId: string) => {
    setLoading(true)
    try {
      const data = await getExams(categoryId)
      setExams(data)
    } catch { setExams([]) } finally { setLoading(false) }
  }, [])

  const loadTests = useCallback(async (examId: string) => {
    setLoading(true)
    try {
      const data = await getTests(examId)
      setTests(data)
    } catch { setTests([]) } finally { setLoading(false) }
  }, [])

  const loadQuestions = useCallback(async (testId: string) => {
    setLoading(true)
    try {
      const data = await getQuestions(testId)
      setQuestions(data)
    } catch { setQuestions([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadCategories() }, [loadCategories])

  const handleSelectCategory = (cat: FirestoreExamCategory) => {
    setSelectedCategoryId(cat.id)
    setSelectedCategoryName(cat.name)
    loadExams(cat.id)
    setViewLevel('exams')
  }

  const handleSelectExam = (exam: FirestoreExam) => {
    setSelectedExamId(exam.id)
    setSelectedExamName(exam.name)
    loadTests(exam.id)
    setViewLevel('tests')
  }

  const handleSelectTest = (test: FirestoreTest) => {
    setSelectedTestId(test.id)
    setSelectedTestName(test.title)
    loadQuestions(test.id)
    setViewLevel('questions')
    setSelectedQuestionIds(new Set())
    setSelectAll(false)
  }

  const handleBack = () => {
    if (viewLevel === 'questions') { setViewLevel('tests'); setQuestions([]); setSelectedQuestionIds(new Set()); setSelectAll(false) }
    else if (viewLevel === 'tests') { setViewLevel('exams'); setTests([]) }
    else if (viewLevel === 'exams') { setViewLevel('categories'); setExams([]) }
    setShowAdd(false)
    setEditingId(null)
  }

  // --- CRUD Handlers ---
  const handleAddCategory = async () => {
    if (!addName.trim()) return
    try {
      await addCategory({
        name: addName, slug: addSlug || addName.toLowerCase().replace(/\s+/g, '-'),
        icon: '📋', description: addDesc, order: categories.length + 1
      })
      setAddName(''); setAddDesc(''); setAddSlug(''); setShowAdd(false)
      showStatus('Category added successfully!', 'success')
      loadCategories()
    } catch { showStatus('Failed to add category', 'error') }
  }

  const handleAddExam = async () => {
    if (!addName.trim() || !selectedCategoryId) return
    try {
      await addExam({
        name: addName, slug: addSlug || addName.toLowerCase().replace(/\s+/g, '-'),
        description: addDesc, totalQuestions: 0, duration: 60,
        markingScheme: '1/-0.25', order: exams.length + 1,
        testCount: 0, categoryId: selectedCategoryId
      })
      setAddName(''); setAddDesc(''); setAddSlug(''); setShowAdd(false)
      showStatus('Exam added successfully!', 'success')
      loadExams(selectedCategoryId)
    } catch { showStatus('Failed to add exam', 'error') }
  }

  const handleAddTest = async () => {
    if (!addName.trim() || !selectedExamId) return
    try {
      await addTest({
        title: addName, slug: addSlug || addName.toLowerCase().replace(/\s+/g, '-'),
        description: addDesc, totalQuestions: 0, duration: 30,
        markingCorrect: 1, markingWrong: -0.25, markingSkipped: 0,
        difficulty: 'medium', isFree: true, isLive: true,
        examId: selectedExamId, examName: selectedExamName,
        examSlug: selectedExamName.toLowerCase().replace(/\s+/g, '-')
      })
      setAddName(''); setAddDesc(''); setAddSlug(''); setShowAdd(false)
      showStatus('Test added successfully!', 'success')
      loadTests(selectedExamId)
    } catch { showStatus('Failed to add test', 'error') }
  }

  const handleAddQuestion = async () => {
    if (!qText.trim() || !selectedTestId) return
    try {
      await addQuestion({
        questionText: qText, questionImage: null,
        optionA: qA, optionB: qB, optionC: qC, optionD: qD,
        correctAnswer: qAns, explanation: qExplanation || null,
        subject: qSubject || null, order: questions.length + 1,
        testId: selectedTestId
      })
      setQText(''); setQA(''); setQB(''); setQC(''); setQD('')
      setQAns('A'); setQExplanation(''); setQSubject('')
      setShowAddQuestion(false)
      showStatus('Question added!', 'success')
      loadQuestions(selectedTestId)
    } catch { showStatus('Failed to add question', 'error') }
  }

  const handleBatchQuestions = async () => {
    if (!batchText.trim() || !selectedTestId) return
    try {
      const lines = batchText.trim().split('\n').filter(l => l.trim())
      const qs = lines.map((line, i) => {
        const parts = line.split('|')
        return {
          questionText: parts[0]?.trim() || '',
          optionA: parts[1]?.trim() || '',
          optionB: parts[2]?.trim() || '',
          optionC: parts[3]?.trim() || '',
          optionD: parts[4]?.trim() || '',
          correctAnswer: parts[5]?.trim() || 'A',
          explanation: parts[6]?.trim() || null,
          subject: parts[7]?.trim() || null,
          order: questions.length + i + 1,
          testId: selectedTestId
        }
      }).filter(q => q.questionText)
      
      if (qs.length === 0) {
        showStatus('No valid questions found. Check format.', 'error')
        return
      }
      
      await addBatchQuestions(selectedTestId, qs)
      setBatchText(''); setShowBatch(false)
      showStatus(`${qs.length} questions imported successfully!`, 'success')
      loadQuestions(selectedTestId)
    } catch { showStatus('Failed to add batch questions', 'error') }
  }

  const handleDelete = async (type: string, id: string) => {
    setDeleteTarget({ type, id, name: '' })
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const { type, id } = deleteTarget
    setBulkDeleting(true)
    try {
      if (type === 'category') { await deleteCategory(id); loadCategories() }
      else if (type === 'exam' && selectedCategoryId) { await deleteExam(id); loadExams(selectedCategoryId) }
      else if (type === 'test' && selectedExamId) { await deleteTest(id); loadTests(selectedExamId) }
      else if (type === 'question' && selectedTestId) { await deleteQuestion(id); loadQuestions(selectedTestId) }
      showStatus(`${type} deleted successfully!`, 'success')
    } catch { showStatus(`Failed to delete ${type}`, 'error') }
    finally {
      setBulkDeleting(false)
      setShowDeleteConfirm(false)
      setDeleteTarget(null)
    }
  }

  // --- Bulk Delete Handlers ---
  const handleDeleteSelectedQuestions = async () => {
    if (selectedQuestionIds.size === 0 || !selectedTestId) return
    if (!confirm(`Delete ${selectedQuestionIds.size} selected questions?`)) return
    setBulkDeleting(true)
    try {
      let failed = 0
      for (const qId of selectedQuestionIds) {
        try { await deleteQuestion(qId) } catch { failed++ }
      }
      setSelectedQuestionIds(new Set())
      setSelectAll(false)
      loadQuestions(selectedTestId)
      showStatus(`Deleted ${selectedQuestionIds.size - failed} questions${failed > 0 ? ` (${failed} failed)` : ''}`, 'success')
    } catch { showStatus('Failed to delete questions', 'error') }
    finally { setBulkDeleting(false) }
  }

  const handleDeleteAllQuestions = async () => {
    if (!selectedTestId) return
    if (!confirm(`Delete ALL questions in "${selectedTestName}"? This cannot be undone!`)) return
    setBulkDeleting(true)
    try {
      const count = await deleteAllQuestionsInTest(selectedTestId)
      setSelectedQuestionIds(new Set())
      setSelectAll(false)
      loadQuestions(selectedTestId)
      showStatus(`Deleted ${count} questions!`, 'success')
    } catch { showStatus('Failed to delete all questions', 'error') }
    finally { setBulkDeleting(false) }
  }

  const handleDeleteAllTests = async () => {
    if (!selectedExamId) return
    if (!confirm(`Delete ALL tests in "${selectedExamName}"? This will also delete all questions inside!`)) return
    setBulkDeleting(true)
    try {
      const count = await deleteAllTestsInExam(selectedExamId)
      loadTests(selectedExamId)
      showStatus(`Deleted ${count} tests with all questions!`, 'success')
    } catch { showStatus('Failed to delete all tests', 'error') }
    finally { setBulkDeleting(false) }
  }

  const handleDeleteAllExams = async () => {
    if (!selectedCategoryId) return
    if (!confirm(`Delete ALL exams in "${selectedCategoryName}"? This will also delete all tests and questions!`)) return
    setBulkDeleting(true)
    try {
      const count = await deleteAllExamsInCategory(selectedCategoryId)
      loadExams(selectedCategoryId)
      showStatus(`Deleted ${count} exams with all tests & questions!`, 'success')
    } catch { showStatus('Failed to delete all exams', 'error') }
    finally { setBulkDeleting(false) }
  }

  const handleDeleteAllData = async () => {
    if (!confirm('⚠️ DELETE ALL DATA? This will remove ALL categories, exams, tests, and questions! This CANNOT be undone!')) return
    if (!confirm('Are you REALLY sure? Type "yes" mentally and click OK to proceed.')) return
    setBulkDeleting(true)
    try {
      await deleteAllExamData()
      loadCategories()
      setViewLevel('categories')
      showStatus('All exam data deleted!', 'success')
    } catch { showStatus('Failed to delete all data', 'error') }
    finally { setBulkDeleting(false) }
  }

  const handleSeed = async () => {
    if (!confirm('Seed Firestore from local data? This may take a moment.')) return
    setSeeding(true)
    try {
      await seedFirestoreIfEmpty()
      showStatus('Firestore seeded successfully!', 'success')
      loadCategories()
    } catch { showStatus('Failed to seed Firestore', 'error') }
    finally { setSeeding(false) }
  }

  const handleStartEdit = (id: string, name: string, desc: string) => {
    setEditingId(id)
    setEditName(name)
    setEditDesc(desc || '')
  }

  const handleSaveEdit = async (type: string, id: string) => {
    try {
      if (type === 'category') {
        await updateCategory(id, { name: editName, description: editDesc })
        loadCategories()
      } else if (type === 'exam') {
        await updateExam(id, { name: editName, description: editDesc })
        if (selectedCategoryId) loadExams(selectedCategoryId)
      } else if (type === 'test') {
        await updateTest(id, { title: editName, description: editDesc })
        if (selectedExamId) loadTests(selectedExamId)
      }
      setEditingId(null)
      showStatus('Updated successfully!', 'success')
    } catch { showStatus('Failed to update', 'error') }
  }

  // Multi-select helpers
  const toggleQuestionSelect = (qId: string) => {
    const next = new Set(selectedQuestionIds)
    if (next.has(qId)) next.delete(qId)
    else next.add(qId)
    setSelectedQuestionIds(next)
    setSelectAll(next.size === questions.length)
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedQuestionIds(new Set())
      setSelectAll(false)
    } else {
      setSelectedQuestionIds(new Set(questions.map(q => q.id)))
      setSelectAll(true)
    }
  }

  // Export questions as text
  const handleExportQuestions = () => {
    if (questions.length === 0) return
    const text = questions.map(q =>
      `${q.questionText}|${q.optionA}|${q.optionB}|${q.optionC}|${q.optionD}|${q.correctAnswer}|${q.explanation || ''}|${q.subject || ''}`
    ).join('\n')
    navigator.clipboard.writeText(text).then(() => {
      showStatus('Questions copied to clipboard!', 'success')
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      showStatus('Questions copied to clipboard!', 'success')
    })
  }

  return (
    <div className="space-y-4">
      {/* Status Message */}
      {statusMsg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-all ${
          statusType === 'success' ? 'bg-emerald-500 text-white' :
          statusType === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {statusMsg}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="border-0 shadow-2xl max-w-sm w-full">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-bold text-lg text-center mb-2">Confirm Delete</h3>
              <p className="text-gray-500 text-sm text-center mb-4">
                Are you sure you want to delete this {deleteTarget?.type}? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null) }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white"
                  onClick={confirmDelete}
                  disabled={bulkDeleting}
                >
                  {bulkDeleting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Deleting Overlay */}
      {bulkDeleting && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
            <span className="text-sm font-medium">Deleting...</span>
          </div>
        </div>
      )}

      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {viewLevel !== 'categories' && (
            <button onClick={handleBack} className="text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <span className="text-gray-400">
            {viewLevel === 'categories' ? 'Categories' :
             viewLevel === 'exams' ? `› ${selectedCategoryName} › Exams` :
             viewLevel === 'tests' ? `› ${selectedCategoryName} › ${selectedExamName} › Tests` :
             `› ${selectedCategoryName} › ${selectedExamName} › ${selectedTestName} › Questions`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {viewLevel === 'categories' && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs text-red-600 hover:bg-red-50"
              onClick={handleDeleteAllData}
              disabled={bulkDeleting}
            >
              <Trash className="w-3 h-3 mr-1" /> Delete All Data
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs"
            onClick={handleSeed}
            disabled={seeding}
          >
            <Database className="w-3 h-3 mr-1" />
            {seeding ? 'Seeding...' : 'Seed Firestore'}
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {/* ===== CATEGORIES VIEW ===== */}
      {!loading && viewLevel === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Categories ({categories.length})</h3>
            <Button size="sm" className="rounded-xl text-xs" onClick={() => { setShowAdd(!showAdd); setAddName(''); setAddDesc(''); setAddSlug('') }}>
              <Plus className="w-3 h-3 mr-1" /> Add Category
            </Button>
          </div>

          {showAdd && (
            <Card className="border-0 shadow-md bg-orange-50/50">
              <CardContent className="p-4 space-y-2">
                <Input placeholder="Category name" value={addName} onChange={e => setAddName(e.target.value)} className="rounded-xl" />
                <Input placeholder="Slug (auto-generated if empty)" value={addSlug} onChange={e => setAddSlug(e.target.value)} className="rounded-xl" />
                <Input placeholder="Description" value={addDesc} onChange={e => setAddDesc(e.target.value)} className="rounded-xl" />
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-xl" onClick={handleAddCategory} disabled={!addName.trim()}>Add</Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowAdd(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {categories.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No categories found</p>
                <p className="text-gray-300 text-xs mt-1">Add a category or use "Seed Firestore" to load sample data</p>
              </CardContent>
            </Card>
          ) : (
            categories.map(cat => (
              <Card key={cat.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 flex items-center gap-3">
                  {editingId === cat.id ? (
                    <div className="flex-1 space-y-2">
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl text-sm" />
                      <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" className="rounded-xl text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-xl" onClick={() => handleSaveEdit('category', cat.id)}>
                          <Save className="w-3 h-3 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0 text-lg">
                        {cat.icon || '📋'}
                      </div>
                      <button className="flex-1 min-w-0 text-left" onClick={() => handleSelectCategory(cat)}>
                        <p className="font-semibold text-sm truncate">{cat.name}</p>
                        <p className="text-gray-400 text-xs truncate">{cat.description || cat.slug}</p>
                      </button>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleStartEdit(cat.id, cat.name, cat.description)} className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center">
                          <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button onClick={() => handleDeleteAllExams()} className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 flex items-center justify-center" title="Delete all exams in category">
                          <Trash className="w-3.5 h-3.5 text-amber-500" />
                        </button>
                        <button onClick={() => handleDelete('category', cat.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                        <button onClick={() => handleSelectCategory(cat)} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ===== EXAMS VIEW ===== */}
      {!loading && viewLevel === 'exams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Exams in {selectedCategoryName} ({exams.length})</h3>
            <div className="flex gap-2">
              {exams.length > 0 && (
                <Button size="sm" variant="outline" className="rounded-xl text-xs text-red-600 hover:bg-red-50" onClick={handleDeleteAllExams}>
                  <Trash className="w-3 h-3 mr-1" /> Delete All
                </Button>
              )}
              <Button size="sm" className="rounded-xl text-xs" onClick={() => { setShowAdd(!showAdd); setAddName(''); setAddDesc(''); setAddSlug('') }}>
                <Plus className="w-3 h-3 mr-1" /> Add Exam
              </Button>
            </div>
          </div>

          {showAdd && (
            <Card className="border-0 shadow-md bg-orange-50/50">
              <CardContent className="p-4 space-y-2">
                <Input placeholder="Exam name" value={addName} onChange={e => setAddName(e.target.value)} className="rounded-xl" />
                <Input placeholder="Slug" value={addSlug} onChange={e => setAddSlug(e.target.value)} className="rounded-xl" />
                <Input placeholder="Description" value={addDesc} onChange={e => setAddDesc(e.target.value)} className="rounded-xl" />
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-xl" onClick={handleAddExam} disabled={!addName.trim()}>Add</Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowAdd(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {exams.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No exams in this category</p>
                <p className="text-gray-300 text-xs mt-1">Add an exam to start creating tests</p>
              </CardContent>
            </Card>
          ) : (
            exams.map(exam => (
              <Card key={exam.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 flex items-center gap-3">
                  {editingId === exam.id ? (
                    <div className="flex-1 space-y-2">
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl text-sm" />
                      <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" className="rounded-xl text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-xl" onClick={() => handleSaveEdit('exam', exam.id)}><Save className="w-3 h-3 mr-1" /> Save</Button>
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                      </div>
                      <button className="flex-1 min-w-0 text-left" onClick={() => handleSelectExam(exam)}>
                        <p className="font-semibold text-sm truncate">{exam.name}</p>
                        <p className="text-gray-400 text-xs">{exam.testCount || 0} tests • {exam.totalQuestions || 0} questions</p>
                      </button>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleStartEdit(exam.id, exam.name, exam.description)} className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center">
                          <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button onClick={() => handleDelete('exam', exam.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                        <button onClick={() => handleSelectExam(exam)} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ===== TESTS VIEW ===== */}
      {!loading && viewLevel === 'tests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Tests in {selectedExamName} ({tests.length})</h3>
            <div className="flex gap-2">
              {tests.length > 0 && (
                <Button size="sm" variant="outline" className="rounded-xl text-xs text-red-600 hover:bg-red-50" onClick={handleDeleteAllTests}>
                  <Trash className="w-3 h-3 mr-1" /> Delete All
                </Button>
              )}
              <Button size="sm" className="rounded-xl text-xs" onClick={() => { setShowAdd(!showAdd); setAddName(''); setAddDesc(''); setAddSlug('') }}>
                <Plus className="w-3 h-3 mr-1" /> Add Test
              </Button>
            </div>
          </div>

          {showAdd && (
            <Card className="border-0 shadow-md bg-orange-50/50">
              <CardContent className="p-4 space-y-2">
                <Input placeholder="Test title" value={addName} onChange={e => setAddName(e.target.value)} className="rounded-xl" />
                <Input placeholder="Slug" value={addSlug} onChange={e => setAddSlug(e.target.value)} className="rounded-xl" />
                <Input placeholder="Description" value={addDesc} onChange={e => setAddDesc(e.target.value)} className="rounded-xl" />
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-xl" onClick={handleAddTest} disabled={!addName.trim()}>Add</Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowAdd(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {tests.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <ListChecks className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No tests in this exam</p>
                <p className="text-gray-300 text-xs mt-1">Add a test to start adding questions</p>
              </CardContent>
            </Card>
          ) : (
            tests.map(test => (
              <Card key={test.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 flex items-center gap-3">
                  {editingId === test.id ? (
                    <div className="flex-1 space-y-2">
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl text-sm" />
                      <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" className="rounded-xl text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-xl" onClick={() => handleSaveEdit('test', test.id)}><Save className="w-3 h-3 mr-1" /> Save</Button>
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center flex-shrink-0">
                        <ListChecks className="w-5 h-5 text-emerald-500" />
                      </div>
                      <button className="flex-1 min-w-0 text-left" onClick={() => handleSelectTest(test)}>
                        <p className="font-semibold text-sm truncate">{test.title}</p>
                        <p className="text-gray-400 text-xs">{test.totalQuestions}Q • {test.duration}min • {test.difficulty}</p>
                      </button>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className={`text-[9px] ${test.isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {test.isLive ? 'Live' : 'Draft'}
                        </Badge>
                        <button onClick={() => handleStartEdit(test.id, test.title, test.description)} className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center">
                          <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button onClick={() => handleDelete('test', test.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                        <button onClick={() => handleSelectTest(test)} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ===== QUESTIONS VIEW ===== */}
      {!loading && viewLevel === 'questions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-sm">Questions in {selectedTestName} ({questions.length})</h3>
            <div className="flex gap-2 flex-wrap">
              {questions.length > 0 && (
                <>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={handleExportQuestions}>
                    <FileDown className="w-3 h-3 mr-1" /> Export
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs text-red-600 hover:bg-red-50" onClick={handleDeleteAllQuestions}>
                    <Trash className="w-3 h-3 mr-1" /> Delete All
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => { setShowBatch(!showBatch); setBatchText('') }}>
                <Upload className="w-3 h-3 mr-1" /> Bulk Import
              </Button>
              <Button size="sm" className="rounded-xl text-xs" onClick={() => { setShowAddQuestion(!showAddQuestion); setQText(''); setQA(''); setQB(''); setQC(''); setQD('') }}>
                <Plus className="w-3 h-3 mr-1" /> Add Question
              </Button>
            </div>
          </div>

          {/* Multi-select actions bar */}
          {selectedQuestionIds.size > 0 && (
            <Card className="border-0 shadow-md bg-red-50/70">
              <CardContent className="p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-red-700">{selectedQuestionIds.size} question(s) selected</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => { setSelectedQuestionIds(new Set()); setSelectAll(false) }}>
                    <X className="w-3 h-3 mr-1" /> Deselect
                  </Button>
                  <Button size="sm" className="rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs" onClick={handleDeleteSelectedQuestions}>
                    <Trash2 className="w-3 h-3 mr-1" /> Delete Selected
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Single Question */}
          {showAddQuestion && (
            <Card className="border-0 shadow-md bg-blue-50/50">
              <CardContent className="p-4 space-y-2">
                <Textarea placeholder="Question text" value={qText} onChange={e => setQText(e.target.value)} className="rounded-xl" rows={2} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Option A" value={qA} onChange={e => setQA(e.target.value)} className="rounded-xl" />
                  <Input placeholder="Option B" value={qB} onChange={e => setQB(e.target.value)} className="rounded-xl" />
                  <Input placeholder="Option C" value={qC} onChange={e => setQC(e.target.value)} className="rounded-xl" />
                  <Input placeholder="Option D" value={qD} onChange={e => setQD(e.target.value)} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Correct Answer</p>
                    <div className="flex gap-2">
                      {['A', 'B', 'C', 'D'].map(o => (
                        <button key={o} onClick={() => setQAns(o)} className={`w-9 h-9 rounded-lg text-sm font-bold ${qAns === o ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input placeholder="Subject (optional)" value={qSubject} onChange={e => setQSubject(e.target.value)} className="rounded-xl" />
                </div>
                <Textarea placeholder="Explanation (optional)" value={qExplanation} onChange={e => setQExplanation(e.target.value)} className="rounded-xl" rows={2} />
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-xl" onClick={handleAddQuestion} disabled={!qText.trim()}>Add Question</Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowAddQuestion(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Batch Import */}
          {showBatch && (
            <Card className="border-0 shadow-md bg-purple-50/50">
              <CardContent className="p-4 space-y-2">
                <div className="bg-white rounded-xl p-3 border border-purple-100">
                  <p className="text-xs font-semibold text-purple-700 mb-1">Format Guide:</p>
                  <p className="text-[11px] text-gray-500">Each line = 1 question. Use <code className="bg-gray-100 px-1 rounded">|</code> (pipe) to separate fields:</p>
                  <p className="text-[11px] text-gray-600 font-mono mt-1">Question|OptionA|OptionB|OptionC|OptionD|Answer|Explanation|Subject</p>
                  <p className="text-[10px] text-gray-400 mt-1">Answer must be A, B, C, or D. Explanation & Subject are optional.</p>
                </div>
                <Textarea
                  placeholder={"What is 2+2?|4|3|5|6|A|Basic addition|Math\nCapital of India?|Mumbai|Delhi|Kolkata|Chennai|B|India's capital|GK\nWho wrote Ramayana?|Valmiki|Tulsidas|Vyas|Kalidas|A|Ancient literature|GK"}
                  value={batchText}
                  onChange={e => setBatchText(e.target.value)}
                  className="rounded-xl font-mono text-xs"
                  rows={6}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {batchText.trim() ? `${batchText.trim().split('\n').filter(l => l.trim()).length} question(s) detected` : ''}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-xl" onClick={handleBatchQuestions} disabled={!batchText.trim()}>
                      <Upload className="w-3 h-3 mr-1" /> Import Batch
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowBatch(false)}>Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {questions.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No questions in this test</p>
                <p className="text-gray-300 text-xs mt-1">Add questions individually or use "Bulk Import"</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Select all bar */}
              <div className="flex items-center gap-2 px-2">
                <button onClick={toggleSelectAll} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
                  {selectAll ? <CheckSquare className="w-4 h-4 text-violet-500" /> : <Square className="w-4 h-4" />}
                  Select All ({questions.length})
                </button>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {questions.map((q, i) => (
                  <Card key={q.id} className={`border-0 shadow-sm transition-all ${selectedQuestionIds.has(q.id) ? 'ring-2 ring-red-300 bg-red-50/30' : 'hover:shadow-md'}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => toggleQuestionSelect(q.id)}
                          className="mt-0.5 flex-shrink-0"
                        >
                          {selectedQuestionIds.has(q.id) ?
                            <CheckSquare className="w-4 h-4 text-red-500" /> :
                            <Square className="w-4 h-4 text-gray-300" />
                          }
                        </button>
                        <span className="text-xs text-gray-400 mt-0.5 flex-shrink-0">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{q.questionText}</p>
                          <div className="grid grid-cols-2 gap-1 mt-1.5 text-xs">
                            <span className={`px-2 py-0.5 rounded ${q.correctAnswer === 'A' ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-gray-50 text-gray-500'}`}>A: {q.optionA}</span>
                            <span className={`px-2 py-0.5 rounded ${q.correctAnswer === 'B' ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-gray-50 text-gray-500'}`}>B: {q.optionB}</span>
                            <span className={`px-2 py-0.5 rounded ${q.correctAnswer === 'C' ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-gray-50 text-gray-500'}`}>C: {q.optionC}</span>
                            <span className={`px-2 py-0.5 rounded ${q.correctAnswer === 'D' ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-gray-50 text-gray-500'}`}>D: {q.optionD}</span>
                          </div>
                          {q.explanation && <p className="text-gray-400 text-[10px] mt-1">💡 {q.explanation}</p>}
                          {q.subject && <Badge variant="secondary" className="text-[9px] mt-1">{q.subject}</Badge>}
                        </div>
                        <button onClick={() => handleDelete('question', q.id)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center flex-shrink-0">
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
