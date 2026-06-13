'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  BookOpen, ChevronRight, Plus, Trash2, Edit3, Save,
  ArrowLeft, RefreshCw, ListChecks, HelpCircle, Database,
  AlertTriangle, X, CheckSquare, Square, Loader2, Upload,
  Trash, FileDown, Search, Eye, EyeOff, Copy, Check,
  ArrowUpDown, Filter, MoreVertical
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

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  const showStatus = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMsg(msg)
    setStatusType(type)
    setTimeout(() => setStatusMsg(''), 3500)
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
    setSearchQuery('')
  }

  const handleSelectExam = (exam: FirestoreExam) => {
    setSelectedExamId(exam.id)
    setSelectedExamName(exam.name)
    loadTests(exam.id)
    setViewLevel('tests')
    setSearchQuery('')
  }

  const handleSelectTest = (test: FirestoreTest) => {
    setSelectedTestId(test.id)
    setSelectedTestName(test.title)
    loadQuestions(test.id)
    setViewLevel('questions')
    setSelectedQuestionIds(new Set())
    setSelectAll(false)
    setSearchQuery('')
  }

  const handleBack = () => {
    if (viewLevel === 'questions') { setViewLevel('tests'); setQuestions([]); setSelectedQuestionIds(new Set()); setSelectAll(false) }
    else if (viewLevel === 'tests') { setViewLevel('exams'); setTests([]) }
    else if (viewLevel === 'exams') { setViewLevel('categories'); setExams([]) }
    setShowAdd(false); setEditingId(null); setSearchQuery('')
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
      showStatus('Category added!', 'success'); loadCategories()
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
      showStatus('Exam added!', 'success'); loadExams(selectedCategoryId)
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
      showStatus('Test added!', 'success'); loadTests(selectedExamId)
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
      showStatus('Question added!', 'success'); loadQuestions(selectedTestId)
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
      if (qs.length === 0) { showStatus('No valid questions found', 'error'); return }
      await addBatchQuestions(selectedTestId, qs)
      setBatchText(''); setShowBatch(false)
      showStatus(`${qs.length} questions imported!`, 'success'); loadQuestions(selectedTestId)
    } catch { showStatus('Batch import failed', 'error') }
  }

  const handleDelete = (type: string, id: string, name: string = '') => {
    setDeleteTarget({ type, id, name })
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
      showStatus('Deleted successfully!', 'success')
    } catch { showStatus('Delete failed', 'error') }
    finally { setBulkDeleting(false); setShowDeleteConfirm(false); setDeleteTarget(null) }
  }

  // --- Bulk Delete ---
  const handleDeleteSelectedQuestions = async () => {
    if (selectedQuestionIds.size === 0 || !selectedTestId) return
    setDeleteTarget({ type: `${selectedQuestionIds.size} questions`, id: '', name: '' })
    setShowDeleteConfirm(true)
  }

  const confirmBulkDelete = async () => {
    if (!deleteTarget) return
    setBulkDeleting(true)
    try {
      if (deleteTarget.type.endsWith('questions') && selectedTestId) {
        if (selectedQuestionIds.size > 0) {
          let failed = 0
          for (const qId of selectedQuestionIds) {
            try { await deleteQuestion(qId) } catch { failed++ }
          }
          setSelectedQuestionIds(new Set()); setSelectAll(false)
          loadQuestions(selectedTestId)
          showStatus(`Deleted ${selectedQuestionIds.size - failed} questions!`, 'success')
        }
      } else if (deleteTarget.type === 'all-questions' && selectedTestId) {
        const count = await deleteAllQuestionsInTest(selectedTestId)
        setSelectedQuestionIds(new Set()); setSelectAll(false)
        loadQuestions(selectedTestId); showStatus(`Deleted ${count} questions!`, 'success')
      } else if (deleteTarget.type === 'all-tests' && selectedExamId) {
        const count = await deleteAllTestsInExam(selectedExamId)
        loadTests(selectedExamId); showStatus(`Deleted ${count} tests!`, 'success')
      } else if (deleteTarget.type === 'all-exams' && selectedCategoryId) {
        const count = await deleteAllExamsInCategory(selectedCategoryId)
        loadExams(selectedCategoryId); showStatus(`Deleted ${count} exams!`, 'success')
      } else if (deleteTarget.type === 'all-data') {
        await deleteAllExamData(); loadCategories(); setViewLevel('categories')
        showStatus('All data deleted!', 'success')
      }
    } catch { showStatus('Delete failed', 'error') }
    finally { setBulkDeleting(false); setShowDeleteConfirm(false); setDeleteTarget(null) }
  }

  const handleDeleteAllQuestions = () => {
    setDeleteTarget({ type: 'all-questions', id: '', name: selectedTestName })
    setShowDeleteConfirm(true)
  }
  const handleDeleteAllTests = () => {
    setDeleteTarget({ type: 'all-tests', id: '', name: selectedExamName })
    setShowDeleteConfirm(true)
  }
  const handleDeleteAllExams = () => {
    setDeleteTarget({ type: 'all-exams', id: '', name: selectedCategoryName })
    setShowDeleteConfirm(true)
  }
  const handleDeleteAllData = () => {
    setDeleteTarget({ type: 'all-data', id: '', name: 'ALL DATA' })
    setShowDeleteConfirm(true)
  }

  const handleSeed = async () => {
    if (!confirm('Seed Firestore from local data?')) return
    setSeeding(true)
    try {
      await seedFirestoreIfEmpty(); showStatus('Firestore seeded!', 'success'); loadCategories()
    } catch { showStatus('Seed failed', 'error') }
    finally { setSeeding(false) }
  }

  const handleStartEdit = (id: string, name: string, desc: string) => {
    setEditingId(id); setEditName(name); setEditDesc(desc || '')
  }

  const handleSaveEdit = async (type: string, id: string) => {
    try {
      if (type === 'category') { await updateCategory(id, { name: editName, description: editDesc }); loadCategories() }
      else if (type === 'exam') { await updateExam(id, { name: editName, description: editDesc }); if (selectedCategoryId) loadExams(selectedCategoryId) }
      else if (type === 'test') { await updateTest(id, { title: editName, description: editDesc }); if (selectedExamId) loadTests(selectedExamId) }
      setEditingId(null); showStatus('Updated!', 'success')
    } catch { showStatus('Update failed', 'error') }
  }

  // Multi-select
  const toggleQuestionSelect = (qId: string) => {
    const next = new Set(selectedQuestionIds)
    if (next.has(qId)) next.delete(qId); else next.add(qId)
    setSelectedQuestionIds(next); setSelectAll(next.size === questions.length)
  }
  const toggleSelectAll = () => {
    if (selectAll) { setSelectedQuestionIds(new Set()); setSelectAll(false) }
    else { setSelectedQuestionIds(new Set(questions.map(q => q.id))); setSelectAll(true) }
  }

  // Export
  const handleExportQuestions = () => {
    if (questions.length === 0) return
    const text = questions.map(q =>
      `${q.questionText}|${q.optionA}|${q.optionB}|${q.optionC}|${q.optionD}|${q.correctAnswer}|${q.explanation || ''}|${q.subject || ''}`
    ).join('\n')
    navigator.clipboard.writeText(text).then(() => showStatus('Copied to clipboard!', 'success'))
      .catch(() => showStatus('Copy failed', 'error'))
  }

  // Search filter
  const filterBySearch = <T extends { name?: string; title?: string; questionText?: string }>(items: T[]): T[] => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.toLowerCase()
    return items.filter(item => {
      const searchable = (item.name || item.title || item.questionText || '').toLowerCase()
      return searchable.includes(q)
    })
  }

  // Gradient colors for categories
  const CAT_GRADIENTS = [
    'from-violet-500 to-purple-600',
    'from-orange-500 to-red-500',
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-indigo-600',
    'from-pink-500 to-rose-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
    'from-fuchsia-500 to-pink-600',
  ]

  return (
    <div className="space-y-4">
      {/* Toast Status */}
      {statusMsg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-2xl transition-all animate-in fade-in slide-in-from-top-2 ${
          statusType === 'success' ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white' :
          statusType === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white' :
          'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
        }`}>
          {statusType === 'success' ? '✓ ' : statusType === 'error' ? '✗ ' : 'ℹ '}{statusMsg}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="border-0 shadow-2xl max-w-sm w-full animate-in zoom-in-95">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-bold text-xl text-center mb-2">Confirm Delete</h3>
              <p className="text-gray-500 text-sm text-center mb-1">
                {deleteTarget?.type === 'all-data' ? '⚠️ This will delete EVERYTHING:' :
                 deleteTarget?.type === 'all-exams' ? `Delete ALL exams in "${deleteTarget?.name}"?` :
                 deleteTarget?.type === 'all-tests' ? `Delete ALL tests in "${deleteTarget?.name}"?` :
                 deleteTarget?.type === 'all-questions' ? `Delete ALL questions in "${deleteTarget?.name}"?` :
                 deleteTarget?.type.endsWith('questions') ? `Delete ${deleteTarget?.type}?` :
                 `Delete this ${deleteTarget?.type}?`}
              </p>
              {(deleteTarget?.type === 'all-data' || deleteTarget?.type === 'all-exams' || deleteTarget?.type === 'all-tests' || deleteTarget?.type === 'all-questions') && (
                <p className="text-red-400 text-xs text-center mb-4">This includes all nested data. Cannot be undone!</p>
              )}
              {!(deleteTarget?.type === 'all-data' || deleteTarget?.type === 'all-exams' || deleteTarget?.type === 'all-tests' || deleteTarget?.type === 'all-questions') && (
                <p className="text-gray-400 text-xs text-center mb-4">This action cannot be undone.</p>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null) }}>Cancel</Button>
                <Button className="flex-1 rounded-xl h-11 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold"
                  onClick={deleteTarget?.type === 'category' || deleteTarget?.type === 'exam' || deleteTarget?.type === 'test' || deleteTarget?.type === 'question' ? confirmDelete : confirmBulkDelete}
                  disabled={bulkDeleting}>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl px-8 py-5 shadow-2xl flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
            <span className="text-sm font-semibold">Deleting...</span>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {viewLevel !== 'categories' && (
            <button onClick={handleBack} className="flex-shrink-0 w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <div className="flex items-center gap-1 text-xs overflow-hidden">
            <button onClick={() => { setViewLevel('categories'); setExams([]); setTests([]); setQuestions([]) }}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${viewLevel === 'categories' ? 'bg-violet-100 text-violet-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
              Categories
            </button>
            {viewLevel !== 'categories' && (
              <>
                <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                <button onClick={() => { setViewLevel('exams'); setTests([]); setQuestions([]) }}
                  className={`px-2.5 py-1.5 rounded-lg font-medium truncate max-w-[120px] transition-colors ${viewLevel === 'exams' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                  {selectedCategoryName}
                </button>
              </>
            )}
            {(viewLevel === 'tests' || viewLevel === 'questions') && (
              <>
                <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                <button onClick={() => { setViewLevel('tests'); setQuestions([]) }}
                  className={`px-2.5 py-1.5 rounded-lg font-medium truncate max-w-[120px] transition-colors ${viewLevel === 'tests' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                  {selectedExamName}
                </button>
              </>
            )}
            {viewLevel === 'questions' && (
              <>
                <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                <span className="px-2.5 py-1.5 rounded-lg font-medium bg-amber-100 text-amber-700 truncate max-w-[120px]">
                  {selectedTestName}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {viewLevel === 'categories' && (
            <Button variant="outline" size="sm" className="rounded-xl text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300" onClick={handleDeleteAllData}>
              <Trash className="w-3 h-3 mr-1" /> Reset All
            </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={handleSeed} disabled={seeding}>
            <Database className="w-3 h-3 mr-1" /> {seeding ? 'Seeding...' : 'Seed Data'}
          </Button>
        </div>
      </div>

      {/* Search */}
      {(categories.length > 5 || exams.length > 5 || tests.length > 5 || questions.length > 5) && (
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="rounded-xl pl-9 bg-white shadow-sm border-0" />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-3">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      )}

      {/* ===== CATEGORIES VIEW ===== */}
      {!loading && viewLevel === 'categories' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">Categories</h3>
              <p className="text-gray-400 text-xs">{categories.length} categories</p>
            </div>
            <Button size="sm" className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md shadow-violet-200"
              onClick={() => { setShowAdd(!showAdd); setAddName(''); setAddDesc(''); setAddSlug('') }}>
              <Plus className="w-4 h-4 mr-1" /> New Category
            </Button>
          </div>

          {showAdd && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-purple-50">
              <CardContent className="p-5 space-y-3">
                <p className="text-sm font-semibold text-violet-700">Add New Category</p>
                <Input placeholder="Category name (e.g. SSC, Banking)" value={addName} onChange={e => setAddName(e.target.value)} className="rounded-xl bg-white" />
                <Input placeholder="Slug (auto if empty)" value={addSlug} onChange={e => setAddSlug(e.target.value)} className="rounded-xl bg-white" />
                <Input placeholder="Short description" value={addDesc} onChange={e => setAddDesc(e.target.value)} className="rounded-xl bg-white" />
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white" onClick={handleAddCategory} disabled={!addName.trim()}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowAdd(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {categories.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No categories yet</p>
                <p className="text-gray-400 text-sm mt-1">Add a category or use "Seed Data" to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filterBySearch(categories).map((cat, i) => (
                <Card key={cat.id} className="border-0 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
                  {editingId === cat.id ? (
                    <CardContent className="p-4 space-y-2 bg-violet-50/50">
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl" />
                      <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" className="rounded-xl" />
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-xl" onClick={() => handleSaveEdit('category', cat.id)}><Save className="w-3 h-3 mr-1" /> Save</Button>
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </CardContent>
                  ) : (
                    <div className="flex items-stretch">
                      <div className={`w-2 bg-gradient-to-b ${CAT_GRADIENTS[i % CAT_GRADIENTS.length]} flex-shrink-0`} />
                      <CardContent className="p-4 flex items-center gap-3 flex-1">
                        <button className="flex-1 min-w-0 text-left" onClick={() => handleSelectCategory(cat)}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{cat.icon || '📋'}</span>
                            <div>
                              <p className="font-semibold text-sm">{cat.name}</p>
                              <p className="text-gray-400 text-xs">{cat.description || cat.slug}</p>
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleStartEdit(cat.id, cat.name, cat.description)} className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors">
                            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                          </button>
                          <button onClick={() => handleDelete('category', cat.id, cat.name)} className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                          <button onClick={() => handleSelectCategory(cat)} className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-violet-50 flex items-center justify-center transition-colors">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </CardContent>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== EXAMS VIEW ===== */}
      {!loading && viewLevel === 'exams' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">Exams</h3>
              <p className="text-gray-400 text-xs">{exams.length} exams in {selectedCategoryName}</p>
            </div>
            <div className="flex gap-2">
              {exams.length > 0 && (
                <Button size="sm" variant="outline" className="rounded-xl text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={handleDeleteAllExams}>
                  <Trash className="w-3 h-3 mr-1" /> Delete All
                </Button>
              )}
              <Button size="sm" className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md shadow-blue-200"
                onClick={() => { setShowAdd(!showAdd); setAddName(''); setAddDesc(''); setAddSlug('') }}>
                <Plus className="w-4 h-4 mr-1" /> New Exam
              </Button>
            </div>
          </div>

          {showAdd && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-5 space-y-3">
                <p className="text-sm font-semibold text-blue-700">Add New Exam</p>
                <Input placeholder="Exam name (e.g. SSC CGL, IBPS PO)" value={addName} onChange={e => setAddName(e.target.value)} className="rounded-xl bg-white" />
                <Input placeholder="Slug" value={addSlug} onChange={e => setAddSlug(e.target.value)} className="rounded-xl bg-white" />
                <Input placeholder="Description" value={addDesc} onChange={e => setAddDesc(e.target.value)} className="rounded-xl bg-white" />
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white" onClick={handleAddExam} disabled={!addName.trim()}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowAdd(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {exams.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-blue-300" />
                </div>
                <p className="text-gray-500 font-medium">No exams yet</p>
                <p className="text-gray-400 text-sm mt-1">Add an exam under this category</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filterBySearch(exams).map((exam, i) => (
                <Card key={exam.id} className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
                  {editingId === exam.id ? (
                    <CardContent className="p-4 space-y-2 bg-blue-50/50">
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl" />
                      <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" className="rounded-xl" />
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-xl" onClick={() => handleSaveEdit('exam', exam.id)}><Save className="w-3 h-3 mr-1" /> Save</Button>
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <button className="flex-1 min-w-0 text-left" onClick={() => handleSelectExam(exam)}>
                        <p className="font-semibold text-sm">{exam.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-600">{exam.testCount || 0} tests</Badge>
                          <Badge variant="secondary" className="text-[10px] bg-gray-50 text-gray-500">{exam.totalQuestions || 0} Q</Badge>
                        </div>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleStartEdit(exam.id, exam.name, exam.description)} className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center">
                          <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button onClick={() => handleDelete('exam', exam.id, exam.name)} className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                        <button onClick={() => handleSelectExam(exam)} className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-blue-50 flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== TESTS VIEW ===== */}
      {!loading && viewLevel === 'tests' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">Tests</h3>
              <p className="text-gray-400 text-xs">{tests.length} tests in {selectedExamName}</p>
            </div>
            <div className="flex gap-2">
              {tests.length > 0 && (
                <Button size="sm" variant="outline" className="rounded-xl text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={handleDeleteAllTests}>
                  <Trash className="w-3 h-3 mr-1" /> Delete All
                </Button>
              )}
              <Button size="sm" className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-200"
                onClick={() => { setShowAdd(!showAdd); setAddName(''); setAddDesc(''); setAddSlug('') }}>
                <Plus className="w-4 h-4 mr-1" /> New Test
              </Button>
            </div>
          </div>

          {showAdd && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-5 space-y-3">
                <p className="text-sm font-semibold text-emerald-700">Add New Test</p>
                <Input placeholder="Test title" value={addName} onChange={e => setAddName(e.target.value)} className="rounded-xl bg-white" />
                <Input placeholder="Slug" value={addSlug} onChange={e => setAddSlug(e.target.value)} className="rounded-xl bg-white" />
                <Input placeholder="Description" value={addDesc} onChange={e => setAddDesc(e.target.value)} className="rounded-xl bg-white" />
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white" onClick={handleAddTest} disabled={!addName.trim()}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowAdd(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {tests.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <ListChecks className="w-10 h-10 text-emerald-300" />
                </div>
                <p className="text-gray-500 font-medium">No tests yet</p>
                <p className="text-gray-400 text-sm mt-1">Add a test to start adding questions</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filterBySearch(tests).map((test) => (
                <Card key={test.id} className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
                  {editingId === test.id ? (
                    <CardContent className="p-4 space-y-2 bg-emerald-50/50">
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl" />
                      <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" className="rounded-xl" />
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-xl" onClick={() => handleSaveEdit('test', test.id)}><Save className="w-3 h-3 mr-1" /> Save</Button>
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center flex-shrink-0">
                        <ListChecks className="w-5 h-5 text-emerald-600" />
                      </div>
                      <button className="flex-1 min-w-0 text-left" onClick={() => handleSelectTest(test)}>
                        <p className="font-semibold text-sm">{test.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600">{test.totalQuestions} Q</Badge>
                          <Badge variant="secondary" className="text-[10px] bg-gray-50 text-gray-500">{test.duration} min</Badge>
                          <Badge variant="secondary" className={`text-[10px] ${test.isLive ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                            {test.isLive ? 'Live' : 'Draft'}
                          </Badge>
                        </div>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleStartEdit(test.id, test.title, test.description)} className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center">
                          <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button onClick={() => handleDelete('test', test.id, test.title)} className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                        <button onClick={() => handleSelectTest(test)} className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-emerald-50 flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== QUESTIONS VIEW ===== */}
      {!loading && viewLevel === 'questions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-base">Questions</h3>
              <p className="text-gray-400 text-xs">{questions.length} questions in {selectedTestName}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {questions.length > 0 && (
                <>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={handleExportQuestions}>
                    <FileDown className="w-3 h-3 mr-1" /> Export
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={handleDeleteAllQuestions}>
                    <Trash className="w-3 h-3 mr-1" /> Delete All
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" className="rounded-xl text-xs border-purple-200 text-purple-600 hover:bg-purple-50" onClick={() => { setShowBatch(!showBatch); setBatchText('') }}>
                <Upload className="w-3 h-3 mr-1" /> Bulk Import
              </Button>
              <Button size="sm" className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-200"
                onClick={() => { setShowAddQuestion(!showAddQuestion); setQText(''); setQA(''); setQB(''); setQC(''); setQD('') }}>
                <Plus className="w-4 h-4 mr-1" /> Add Question
              </Button>
            </div>
          </div>

          {/* Multi-select actions */}
          {selectedQuestionIds.size > 0 && (
            <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-rose-50">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-700">{selectedQuestionIds.size} selected</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => { setSelectedQuestionIds(new Set()); setSelectAll(false) }}>
                    <X className="w-3 h-3 mr-1" /> Clear
                  </Button>
                  <Button size="sm" className="rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs" onClick={handleDeleteSelectedQuestions}>
                    <Trash2 className="w-3 h-3 mr-1" /> Delete Selected
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Single Question */}
          {showAddQuestion && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-5 space-y-3">
                <p className="text-sm font-semibold text-amber-700">Add New Question</p>
                <Textarea placeholder="Question text" value={qText} onChange={e => setQText(e.target.value)} className="rounded-xl bg-white" rows={2} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Option A" value={qA} onChange={e => setQA(e.target.value)} className="rounded-xl bg-white" />
                  <Input placeholder="Option B" value={qB} onChange={e => setQB(e.target.value)} className="rounded-xl bg-white" />
                  <Input placeholder="Option C" value={qC} onChange={e => setQC(e.target.value)} className="rounded-xl bg-white" />
                  <Input placeholder="Option D" value={qD} onChange={e => setQD(e.target.value)} className="rounded-xl bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5 font-medium">Correct Answer</p>
                    <div className="flex gap-2">
                      {['A', 'B', 'C', 'D'].map(o => (
                        <button key={o} onClick={() => setQAns(o)}
                          className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${qAns === o ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-md shadow-emerald-200 scale-105' : 'bg-white text-gray-400 border border-gray-200 hover:border-gray-300'}`}>
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input placeholder="Subject (optional)" value={qSubject} onChange={e => setQSubject(e.target.value)} className="rounded-xl bg-white mt-5" />
                </div>
                <Textarea placeholder="Explanation (optional)" value={qExplanation} onChange={e => setQExplanation(e.target.value)} className="rounded-xl bg-white" rows={2} />
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white" onClick={handleAddQuestion} disabled={!qText.trim()}>
                    <Plus className="w-3 h-3 mr-1" /> Add Question
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowAddQuestion(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bulk Import */}
          {showBatch && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-fuchsia-50">
              <CardContent className="p-5 space-y-3">
                <p className="text-sm font-semibold text-purple-700">Bulk Import Questions</p>
                <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
                  <p className="text-xs font-semibold text-purple-700 mb-2">Format Guide:</p>
                  <p className="text-[11px] text-gray-500 mb-2">Each line = 1 question. Separate fields with <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">|</code> (pipe):</p>
                  <div className="bg-gray-50 rounded-lg p-2.5 font-mono text-[11px] text-gray-600 leading-relaxed">
                    Question|OptionA|OptionB|OptionC|OptionD|Answer|Explanation|Subject
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] text-gray-400">• Answer must be A, B, C, or D</p>
                    <p className="text-[10px] text-gray-400">• Explanation & Subject are optional (can be left empty)</p>
                  </div>
                </div>
                <Textarea
                  placeholder={"What is 2+2?|4|3|5|6|A|Basic addition|Math\nCapital of India?|Mumbai|Delhi|Kolkata|Chennai|B|India's capital|GK"}
                  value={batchText} onChange={e => setBatchText(e.target.value)}
                  className="rounded-xl font-mono text-xs bg-white" rows={6}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-500 font-medium">
                    {batchText.trim() ? `${batchText.trim().split('\n').filter(l => l.trim()).length} question(s) detected` : 'Paste your questions above'}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white" onClick={handleBatchQuestions} disabled={!batchText.trim()}>
                      <Upload className="w-3 h-3 mr-1" /> Import All
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowBatch(false)}>Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {questions.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="w-10 h-10 text-amber-300" />
                </div>
                <p className="text-gray-500 font-medium">No questions yet</p>
                <p className="text-gray-400 text-sm mt-1">Add one by one or use "Bulk Import"</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Select all */}
              <div className="flex items-center gap-3 px-1">
                <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                  {selectAll ? <CheckSquare className="w-4 h-4 text-violet-500" /> : <Square className="w-4 h-4" />}
                  <span className="font-medium">Select All ({questions.length})</span>
                </button>
              </div>
              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                {filterBySearch(questions).map((q, i) => (
                  <Card key={q.id} className={`border-0 shadow-sm transition-all duration-200 ${selectedQuestionIds.has(q.id) ? 'ring-2 ring-red-300 bg-red-50/40 shadow-md' : 'hover:shadow-md'}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2.5">
                        <button onClick={() => toggleQuestionSelect(q.id)} className="mt-1 flex-shrink-0">
                          {selectedQuestionIds.has(q.id) ?
                            <CheckSquare className="w-4 h-4 text-red-500" /> :
                            <Square className="w-4 h-4 text-gray-300 hover:text-gray-400" />
                          }
                        </button>
                        <span className="text-[10px] text-gray-300 font-bold mt-1 flex-shrink-0">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug">{q.questionText}</p>
                          <div className="grid grid-cols-2 gap-1.5 mt-2">
                            {(['A', 'B', 'C', 'D'] as const).map(opt => (
                              <span key={opt} className={`px-2.5 py-1 rounded-lg text-xs ${
                                q.correctAnswer === opt ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 font-semibold ring-1 ring-emerald-200' : 'bg-gray-50 text-gray-500'
                              }`}>
                                <span className="font-bold mr-1">{opt}:</span>{q[`option${opt}` as keyof FirestoreQuestion] as string}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            {q.explanation && <span className="text-[10px] text-gray-400 truncate max-w-[200px]">💡 {q.explanation}</span>}
                            {q.subject && <Badge variant="secondary" className="text-[9px] bg-purple-50 text-purple-600">{q.subject}</Badge>}
                          </div>
                        </div>
                        <button onClick={() => handleDelete('question', q.id, `Q#${i+1}`)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors">
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
