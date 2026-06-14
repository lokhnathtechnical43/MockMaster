'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  BookOpen, ChevronRight, Plus, Trash2, Edit3, Save,
  ArrowLeft, RefreshCw, ListChecks, HelpCircle, Database,
  ImagePlus, X
} from 'lucide-react'
import {
  getCategories, addCategory, updateCategory, deleteCategory,
  getExams, addExam, updateExam, deleteExam,
  getTests, addTest, updateTest, deleteTest,
  getQuestions, addQuestion, updateQuestion, deleteQuestion,
  addBatchQuestions, seedFirestoreIfEmpty,
  type FirestoreExamCategory, type FirestoreExam, type FirestoreTest, type FirestoreQuestion
} from '@/lib/firestore-service'
import {
  getCategories as getLocalCategories,
  type LocalExamCategory, type LocalExam, type LocalTest, type LocalQuestion
} from '@/lib/local-data'

type ViewLevel = 'categories' | 'exams' | 'tests' | 'questions'

// Reusable image upload helper
function handleImageFileUpload(
  file: File,
  onSuccess: (dataUrl: string) => void
) {
  if (file.size > 2 * 1024 * 1024) {
    alert('Image size must be less than 2MB')
    return
  }
  const reader = new FileReader()
  reader.onloadend = () => {
    onSuccess(reader.result as string)
  }
  reader.readAsDataURL(file)
}

// Reusable Image Upload Section Component
function ImageUploadSection({
  imageUrl,
  onImageChange,
  label = 'Image',
}: {
  imageUrl: string
  onImageChange: (url: string) => void
  label?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1.5">{label}</p>
      {imageUrl ? (
        <div className="relative rounded-xl overflow-hidden mb-2">
          <img src={imageUrl} alt="Preview" className="w-full h-28 object-cover rounded-xl" />
          <button
            type="button"
            onClick={() => onImageChange('')}
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
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors text-xs text-gray-500"
          >
            <ImagePlus className="w-4 h-4" /> Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageFileUpload(file, onImageChange)
            }}
          />
          <input
            type="text"
            placeholder="Or paste URL..."
            value={imageUrl}
            onChange={(e) => onImageChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
      )}
    </div>
  )
}

export default function ExamsTab() {
  const [viewLevel, setViewLevel] = useState<ViewLevel>('categories')
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  // Categories
  const [categories, setCategories] = useState<LocalExamCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedCategoryName, setSelectedCategoryName] = useState('')

  // Exams
  const [exams, setExams] = useState<LocalExam[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [selectedExamName, setSelectedExamName] = useState('')

  // Tests
  const [tests, setTests] = useState<LocalTest[]>([])
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)
  const [selectedTestName, setSelectedTestName] = useState('')

  // Questions
  const [questions, setQuestions] = useState<LocalQuestion[]>([])

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')

  // Add states
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addDesc, setAddDesc] = useState('')
  const [addSlug, setAddSlug] = useState('')
  const [addImageUrl, setAddImageUrl] = useState('')

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
  const [qImageUrl, setQImageUrl] = useState('')

  // Batch questions
  const [showBatch, setShowBatch] = useState(false)
  const [batchText, setBatchText] = useState('')

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const cats = await getCategories()
      setCategories(cats)
    } catch {
      // Fallback to local
      const local = getLocalCategories()
      setCategories(local)
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

  const handleSelectCategory = (cat: LocalExamCategory) => {
    setSelectedCategoryId(cat.id)
    setSelectedCategoryName(cat.name)
    loadExams(cat.id)
    setViewLevel('exams')
  }

  const handleSelectExam = (exam: LocalExam) => {
    setSelectedExamId(exam.id)
    setSelectedExamName(exam.name)
    loadTests(exam.id)
    setViewLevel('tests')
  }

  const handleSelectTest = (test: LocalTest) => {
    setSelectedTestId(test.id)
    setSelectedTestName(test.title)
    loadQuestions(test.id)
    setViewLevel('questions')
  }

  const handleBack = () => {
    if (viewLevel === 'questions') { setViewLevel('tests'); setQuestions([]) }
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
        icon: '📋', description: addDesc, order: categories.length + 1,
        ...(addImageUrl ? { imageUrl: addImageUrl } : {})
      })
      setAddName(''); setAddDesc(''); setAddSlug(''); setAddImageUrl(''); setShowAdd(false)
      loadCategories()
    } catch { alert('Failed to add category') }
  }

  const handleAddExam = async () => {
    if (!addName.trim() || !selectedCategoryId) return
    try {
      await addExam({
        name: addName, slug: addSlug || addName.toLowerCase().replace(/\s+/g, '-'),
        description: addDesc, totalQuestions: 0, duration: 60,
        markingScheme: '1/-0.25', order: exams.length + 1,
        testCount: 0, categoryId: selectedCategoryId,
        ...(addImageUrl ? { imageUrl: addImageUrl } : {})
      })
      setAddName(''); setAddDesc(''); setAddSlug(''); setAddImageUrl(''); setShowAdd(false)
      loadExams(selectedCategoryId)
    } catch { alert('Failed to add exam') }
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
        examSlug: selectedExamName.toLowerCase().replace(/\s+/g, '-'),
        ...(addImageUrl ? { imageUrl: addImageUrl } : {})
      })
      setAddName(''); setAddDesc(''); setAddSlug(''); setAddImageUrl(''); setShowAdd(false)
      loadTests(selectedExamId)
    } catch { alert('Failed to add test') }
  }

  const handleAddQuestion = async () => {
    if (!qText.trim() || !selectedTestId) return
    try {
      await addQuestion({
        questionText: qText, questionImage: qImageUrl || null,
        optionA: qA, optionB: qB, optionC: qC, optionD: qD,
        correctAnswer: qAns, explanation: qExplanation || null,
        subject: qSubject || null, order: questions.length + 1,
        testId: selectedTestId
      })
      setQText(''); setQA(''); setQB(''); setQC(''); setQD('')
      setQAns('A'); setQExplanation(''); setQSubject(''); setQImageUrl('')
      setShowAddQuestion(false)
      loadQuestions(selectedTestId)
    } catch { alert('Failed to add question') }
  }

  const handleBatchQuestions = async () => {
    if (!batchText.trim() || !selectedTestId) return
    try {
      const lines = batchText.trim().split('\n').filter(l => l.trim())
      if (lines.length > 500) {
        alert('Maximum 500 questions per batch. Please split into smaller batches.')
        return
      }
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
          order: i + 1,
          testId: selectedTestId
        }
      }).filter(q => q.questionText)
      await addBatchQuestions(selectedTestId, qs)
      setBatchText(''); setShowBatch(false)
      loadQuestions(selectedTestId)
    } catch { alert('Failed to add batch questions') }
  }

  const handleDelete = async (type: string, id: string) => {
    if (!confirm(`Delete this ${type}?`)) return
    try {
      if (type === 'category') { await deleteCategory(id); loadCategories() }
      else if (type === 'exam' && selectedCategoryId) { await deleteExam(id); loadExams(selectedCategoryId) }
      else if (type === 'test' && selectedExamId) { await deleteTest(id); loadTests(selectedExamId) }
      else if (type === 'question' && selectedTestId) { await deleteQuestion(id); loadQuestions(selectedTestId) }
    } catch { alert(`Failed to delete ${type}`) }
  }

  const handleSeed = async () => {
    if (!confirm('Seed Firestore from local data? This may take a moment.')) return
    setSeeding(true)
    try {
      await seedFirestoreIfEmpty()
      alert('Firestore seeded successfully!')
      loadCategories()
    } catch { alert('Failed to seed Firestore') }
    finally { setSeeding(false) }
  }

  const handleStartEdit = (id: string, name: string, desc: string, imageUrl?: string) => {
    setEditingId(id)
    setEditName(name)
    setEditDesc(desc || '')
    setEditImageUrl(imageUrl || '')
  }

  const handleSaveEdit = async (type: string, id: string) => {
    try {
      if (type === 'category') {
        await updateCategory(id, { name: editName, description: editDesc, imageUrl: editImageUrl || undefined })
        loadCategories()
      } else if (type === 'exam') {
        await updateExam(id, { name: editName, description: editDesc, imageUrl: editImageUrl || undefined })
        if (selectedCategoryId) loadExams(selectedCategoryId)
      } else if (type === 'test') {
        await updateTest(id, { title: editName, description: editDesc, imageUrl: editImageUrl || undefined })
        if (selectedExamId) loadTests(selectedExamId)
      }
      setEditingId(null)
    } catch { alert('Failed to update') }
  }

  return (
    <div className="space-y-4">
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
            <Button size="sm" className="rounded-xl text-xs" onClick={() => { setShowAdd(!showAdd); setAddName(''); setAddDesc(''); setAddSlug(''); setAddImageUrl('') }}>
              <Plus className="w-3 h-3 mr-1" /> Add Category
            </Button>
          </div>

          {showAdd && (
            <Card className="border-0 shadow-md bg-orange-50/50">
              <CardContent className="p-4 space-y-2">
                <Input placeholder="Category name" value={addName} onChange={e => setAddName(e.target.value)} className="rounded-xl" />
                <Input placeholder="Slug (auto-generated if empty)" value={addSlug} onChange={e => setAddSlug(e.target.value)} className="rounded-xl" />
                <Input placeholder="Description" value={addDesc} onChange={e => setAddDesc(e.target.value)} className="rounded-xl" />
                <ImageUploadSection imageUrl={addImageUrl} onImageChange={setAddImageUrl} label="Category Image (optional)" />
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
                      <ImageUploadSection imageUrl={editImageUrl} onImageChange={setEditImageUrl} label="Image" />
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-xl" onClick={() => handleSaveEdit('category', cat.id)}>
                          <Save className="w-3 h-3 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">{cat.icon || '📋'}</span>
                        )}
                      </div>
                      <button className="flex-1 min-w-0 text-left" onClick={() => handleSelectCategory(cat)}>
                        <p className="font-semibold text-sm truncate">{cat.name}</p>
                        <p className="text-gray-400 text-xs truncate">{cat.description || cat.slug}</p>
                        {cat.imageUrl && <Badge className="text-[8px] mt-0.5 bg-blue-100 text-blue-700">Image</Badge>}
                      </button>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleStartEdit(cat.id, cat.name, cat.description, cat.imageUrl)} className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center">
                          <Edit3 className="w-3.5 h-3.5 text-blue-500" />
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
            <Button size="sm" className="rounded-xl text-xs" onClick={() => { setShowAdd(!showAdd); setAddName(''); setAddDesc(''); setAddSlug(''); setAddImageUrl('') }}>
              <Plus className="w-3 h-3 mr-1" /> Add Exam
            </Button>
          </div>

          {showAdd && (
            <Card className="border-0 shadow-md bg-orange-50/50">
              <CardContent className="p-4 space-y-2">
                <Input placeholder="Exam name" value={addName} onChange={e => setAddName(e.target.value)} className="rounded-xl" />
                <Input placeholder="Slug" value={addSlug} onChange={e => setAddSlug(e.target.value)} className="rounded-xl" />
                <Input placeholder="Description" value={addDesc} onChange={e => setAddDesc(e.target.value)} className="rounded-xl" />
                <ImageUploadSection imageUrl={addImageUrl} onImageChange={setAddImageUrl} label="Exam Image (optional)" />
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
                      <ImageUploadSection imageUrl={editImageUrl} onImageChange={setEditImageUrl} label="Image" />
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-xl" onClick={() => handleSaveEdit('exam', exam.id)}><Save className="w-3 h-3 mr-1" /> Save</Button>
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {exam.imageUrl ? (
                          <img src={exam.imageUrl} alt={exam.name} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <button className="flex-1 min-w-0 text-left" onClick={() => handleSelectExam(exam)}>
                        <p className="font-semibold text-sm truncate">{exam.name}</p>
                        <p className="text-gray-400 text-xs">{exam.testCount || 0} tests • {exam.totalQuestions || 0} questions</p>
                        {exam.imageUrl && <Badge className="text-[8px] mt-0.5 bg-blue-100 text-blue-700">Image</Badge>}
                      </button>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleStartEdit(exam.id, exam.name, exam.description, exam.imageUrl)} className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center">
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
            <Button size="sm" className="rounded-xl text-xs" onClick={() => { setShowAdd(!showAdd); setAddName(''); setAddDesc(''); setAddSlug(''); setAddImageUrl('') }}>
              <Plus className="w-3 h-3 mr-1" /> Add Test
            </Button>
          </div>

          {showAdd && (
            <Card className="border-0 shadow-md bg-orange-50/50">
              <CardContent className="p-4 space-y-2">
                <Input placeholder="Test title" value={addName} onChange={e => setAddName(e.target.value)} className="rounded-xl" />
                <Input placeholder="Slug" value={addSlug} onChange={e => setAddSlug(e.target.value)} className="rounded-xl" />
                <Input placeholder="Description" value={addDesc} onChange={e => setAddDesc(e.target.value)} className="rounded-xl" />
                <ImageUploadSection imageUrl={addImageUrl} onImageChange={setAddImageUrl} label="Test Image (optional)" />
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
                      <ImageUploadSection imageUrl={editImageUrl} onImageChange={setEditImageUrl} label="Image" />
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-xl" onClick={() => handleSaveEdit('test', test.id)}><Save className="w-3 h-3 mr-1" /> Save</Button>
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {test.imageUrl ? (
                          <img src={test.imageUrl} alt={test.title} className="w-full h-full object-cover" />
                        ) : (
                          <ListChecks className="w-5 h-5 text-emerald-500" />
                        )}
                      </div>
                      <button className="flex-1 min-w-0 text-left" onClick={() => handleSelectTest(test)}>
                        <p className="font-semibold text-sm truncate">{test.title}</p>
                        <p className="text-gray-400 text-xs">{test.totalQuestions}Q • {test.duration}min • {test.difficulty}</p>
                        {test.imageUrl && <Badge className="text-[8px] mt-0.5 bg-blue-100 text-blue-700">Image</Badge>}
                      </button>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className={`text-[9px] ${test.isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {test.isLive ? 'Live' : 'Draft'}
                        </Badge>
                        <button onClick={() => handleStartEdit(test.id, test.title, test.description, test.imageUrl)} className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center">
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
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Questions in {selectedTestName} ({questions.length})</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => { setShowBatch(!showBatch); setBatchText('') }}>
                <Database className="w-3 h-3 mr-1" /> Batch Import
              </Button>
              <Button size="sm" className="rounded-xl text-xs" onClick={() => { setShowAddQuestion(!showAddQuestion); setQText(''); setQA(''); setQB(''); setQC(''); setQD(''); setQImageUrl('') }}>
                <Plus className="w-3 h-3 mr-1" /> Add Question
              </Button>
            </div>
          </div>

          {/* Add Single Question */}
          {showAddQuestion && (
            <Card className="border-0 shadow-md bg-blue-50/50">
              <CardContent className="p-4 space-y-2">
                <Textarea placeholder="Question text" value={qText} onChange={e => setQText(e.target.value)} className="rounded-xl" rows={2} />
                <ImageUploadSection imageUrl={qImageUrl} onImageChange={setQImageUrl} label="Question Image (optional)" />
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
                <p className="text-xs text-gray-500">Format: Question|OptA|OptB|OptC|OptD|Answer|Explanation|Subject (one per line)</p>
                <Textarea
                  placeholder={"What is 2+2?|4|3|5|6|A|Basic addition|Math\nCapital of India?|Mumbai|Delhi|Kolkata|Chennai|B|India's capital|GK"}
                  value={batchText}
                  onChange={e => setBatchText(e.target.value)}
                  className="rounded-xl font-mono text-xs"
                  rows={5}
                />
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-xl" onClick={handleBatchQuestions} disabled={!batchText.trim()}>Import Batch</Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowBatch(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {questions.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No questions in this test</p>
                <p className="text-gray-300 text-xs mt-1">Add questions individually or use batch import</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {questions.map((q, i) => (
                <Card key={q.id} className="border-0 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-gray-400 mt-0.5 flex-shrink-0">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{q.questionText}</p>
                        {q.questionImage && (
                          <div className="mt-1.5 mb-1.5">
                            <img src={q.questionImage} alt="Question" className="max-h-24 rounded-lg object-contain" />
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-1 mt-1.5 text-xs">
                          <span className={`px-2 py-0.5 rounded ${q.correctAnswer === 'A' ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-gray-50 text-gray-500'}`}>A: {q.optionA}</span>
                          <span className={`px-2 py-0.5 rounded ${q.correctAnswer === 'B' ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-gray-50 text-gray-500'}`}>B: {q.optionB}</span>
                          <span className={`px-2 py-0.5 rounded ${q.correctAnswer === 'C' ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-gray-50 text-gray-500'}`}>C: {q.optionC}</span>
                          <span className={`px-2 py-0.5 rounded ${q.correctAnswer === 'D' ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-gray-50 text-gray-500'}`}>D: {q.optionD}</span>
                        </div>
                        {q.explanation && <p className="text-gray-400 text-[10px] mt-1">{q.explanation}</p>}
                        <div className="flex items-center gap-1 mt-1">
                          {q.subject && <Badge variant="secondary" className="text-[9px]">{q.subject}</Badge>}
                          {q.questionImage && <Badge className="text-[9px] bg-blue-100 text-blue-700">Image</Badge>}
                        </div>
                      </div>
                      <button onClick={() => handleDelete('question', q.id)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center flex-shrink-0">
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
