'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  BookOpen, Trophy, Clock, CheckCircle2, XCircle, SkipForward,
  ChevronRight, ChevronLeft, Home, BarChart3, User, ArrowLeft,
  Play, Zap, Target, Award, Timer, RefreshCw,
  BookMarked, GraduationCap, Shield, Building, Train, ShieldCheck,
  Swords
} from 'lucide-react'

// Types
interface ExamCategory {
  id: string; name: string; slug: string; icon: string | null; description: string | null; order: number;
  exams: ExamWithCount[]
}
interface ExamWithCount {
  id: string; name: string; slug: string; description: string | null; totalQuestions: number | null; duration: number | null; markingScheme: string | null;
  _count: { tests: number }
}
interface TestWithExam {
  id: string; title: string; slug: string; description: string | null; totalQuestions: number; duration: number; markingCorrect: number; markingWrong: number; difficulty: string; isFree: boolean; isLive: boolean;
  exam: { id: string; name: string; slug: string }
}
interface Question {
  id: string; questionText: string; questionImage: string | null; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string; explanation: string | null; subject: string | null; order: number;
}
interface TestDetail {
  id: string; title: string; totalQuestions: number; duration: number; markingCorrect: number; markingWrong: number; markingSkipped: number;
  exam: { id: string; name: string };
  questions: Question[]
}

type PageView = 'home' | 'exams' | 'tests' | 'test-info' | 'test-taking' | 'results' | 'leaderboard' | 'profile'

const categoryIcons: Record<string, React.ReactNode> = {
  'ssc': <BookOpen className="w-5 h-5" />,
  'banking': <Building className="w-5 h-5" />,
  'railways': <Train className="w-5 h-5" />,
  'state-govt': <GraduationCap className="w-5 h-5" />,
  'teaching': <BookMarked className="w-5 h-5" />,
  'defence': <Swords className="w-5 h-5" />,
  'police': <ShieldCheck className="w-5 h-5" />,
}

const categoryColors: Record<string, string> = {
  'ssc': 'bg-orange-500',
  'banking': 'bg-emerald-500',
  'railways': 'bg-blue-500',
  'state-govt': 'bg-purple-500',
  'teaching': 'bg-pink-500',
  'defence': 'bg-amber-600',
  'police': 'bg-red-500',
}

export default function ExamPrepBharat() {
  const [page, setPage] = useState<PageView>('home')
  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ExamCategory | null>(null)
  const [selectedExam, setSelectedExam] = useState<ExamWithCount | null>(null)
  const [tests, setTests] = useState<TestWithExam[]>([])
  const [selectedTest, setSelectedTest] = useState<TestDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [seeded, setSeeded] = useState(false)

  // Test taking state
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(0)
  const [testStarted, setTestStarted] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [resultData, setResultData] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Seed database on first load
  useEffect(() => {
    if (!seeded) {
      fetch('/api/seed').then(r => r.json()).then(() => {
        setSeeded(true)
        fetchCategories()
      }).catch(() => {
        setSeeded(true)
        fetchCategories()
      })
    }
  }, [seeded])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/exams')
      const data = await res.json()
      setCategories(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const fetchTests = async (examId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tests?examId=${examId}`)
      const data = await res.json()
      setTests(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const fetchTestDetail = async (testId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tests?testId=${testId}`)
      const data = await res.json()
      setSelectedTest(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const fetchLeaderboard = async (testId: string) => {
    try {
      const res = await fetch(`/api/results?testId=${testId}`)
      const data = await res.json()
      setLeaderboard(data)
    } catch (e) { console.error(e) }
  }

  // Navigation helpers
  const goToExams = (category: ExamCategory) => {
    setSelectedCategory(category)
    setPage('exams')
  }

  const goToTests = (exam: ExamWithCount) => {
    setSelectedExam(exam)
    fetchTests(exam.id)
    setPage('tests')
  }

  const goToTestInfo = (test: TestWithExam) => {
    fetchTestDetail(test.id)
    setPage('test-info')
  }

  const startTest = () => {
    if (!selectedTest) return
    setCurrentQuestion(0)
    setAnswers({})
    setMarkedForReview(new Set())
    setTimeLeft(selectedTest.duration * 60)
    setTestStarted(true)
    setTestCompleted(false)
    setShowResult(false)
    setPage('test-taking')
  }

  const submitTest = useCallback(() => {
    if (!selectedTest) return
    if (timerRef.current) clearInterval(timerRef.current)

    const questions = selectedTest.questions
    let correct = 0, wrong = 0, skipped = 0
    questions.forEach(q => {
      const ans = answers[q.id]
      if (!ans || ans === 'skip') { skipped++ }
      else if (ans === q.correctAnswer) { correct++ }
      else { wrong++ }
    })

    const score = correct * selectedTest.markingCorrect - wrong * selectedTest.markingWrong
    const maxScore = questions.length * selectedTest.markingCorrect
    const timeTaken = selectedTest.duration * 60 - timeLeft

    setResultData({ correct, wrong, skipped, score, maxScore, timeTaken, total: questions.length })
    setTestCompleted(true)

    // Save result
    fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testId: selectedTest.id, correctCount: correct, wrongCount: wrong, skippedCount: skipped, score, maxScore, timeTaken, answers, totalQuestions: questions.length })
    }).catch(console.error)

    setPage('results')
  }, [selectedTest, answers, timeLeft])

  // Timer
  useEffect(() => {
    if (testStarted && !testCompleted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
    if (timeLeft === 0 && testStarted && !testCompleted) {
      submitTest()
    }
  }, [testStarted, testCompleted, timeLeft, submitTest])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const toggleReview = (questionId: string) => {
    setMarkedForReview(prev => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  // ============= RENDER PAGES =============

  // HOME PAGE
  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">ExamPrep Bharat</h1>
              <p className="text-orange-100 text-sm">Mock Tests for Indian Exams</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3">
            <Zap className="w-5 h-5 text-yellow-300" />
            <div>
              <p className="text-sm font-medium">Free Mock Tests Available</p>
              <p className="text-xs text-orange-100">Practice 20+ exams now</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-6 pb-20">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center border-0 shadow-md">
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-orange-600">{categories.reduce((a, c) => a + c.exams.length, 0)}</p>
              <p className="text-xs text-gray-500">Exams</p>
            </CardContent>
          </Card>
          <Card className="text-center border-0 shadow-md">
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-emerald-600">Free</p>
              <p className="text-xs text-gray-500">All Tests</p>
            </CardContent>
          </Card>
          <Card className="text-center border-0 shadow-md">
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-blue-600">3</p>
              <p className="text-xs text-gray-500">Languages</p>
            </CardContent>
          </Card>
        </div>

        {/* Exam Categories */}
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-600" />
            Exam Categories
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map(cat => (
              <Card
                key={cat.id}
                className="cursor-pointer hover:shadow-lg transition-all border-0 shadow-sm active:scale-95"
                onClick={() => goToExams(cat)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${categoryColors[cat.slug] || 'bg-gray-500'} text-white flex items-center justify-center text-lg`}>
                    {cat.icon || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{cat.name}</p>
                    <p className="text-xs text-gray-500">{cat.exams.length} exams</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Trending Exams */}
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-red-500" />
            Trending Exams
          </h2>
          <div className="space-y-2">
            {categories.flatMap(c => c.exams).slice(0, 5).map(exam => (
              <Card key={exam.id} className="cursor-pointer hover:shadow-md transition-all border-0 shadow-sm active:scale-[0.98]"
                onClick={() => {
                  const cat = categories.find(c => c.exams.some(e => e.id === exam.id))
                  if (cat) { setSelectedCategory(cat); goToTests(exam) }
                }}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold text-xs">
                      {exam.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{exam.name}</p>
                      <p className="text-xs text-gray-500">{exam._count.tests} tests available</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            Why ExamPrep Bharat?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Zap className="w-5 h-5" />, title: 'Fast & Light', desc: 'Under 30MB app size', color: 'text-yellow-600 bg-yellow-50' },
              { icon: <CheckCircle2 className="w-5 h-5" />, title: 'Free Tests', desc: 'No hidden charges', color: 'text-emerald-600 bg-emerald-50' },
              { icon: <BarChart3 className="w-5 h-5" />, title: 'Analysis', desc: 'Detailed score report', color: 'text-blue-600 bg-blue-50' },
              { icon: <Trophy className="w-5 h-5" />, title: 'Leaderboard', desc: 'All India Rank', color: 'text-purple-600 bg-purple-50' },
            ].map((f, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className={`w-8 h-8 rounded-lg ${f.color} flex items-center justify-center mb-2`}>
                    {f.icon}
                  </div>
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav is rendered by main render */}
    </div>
  )

  // EXAMS LIST PAGE (for a category)
  const renderExams = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setPage('home')} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg">{selectedCategory?.name || 'Exams'}</h1>
            <p className="text-xs text-gray-500">{selectedCategory?.exams.length} exams available</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3 pb-20">
        {selectedCategory?.exams.map(exam => (
          <Card key={exam.id} className="cursor-pointer hover:shadow-md transition-all border-0 shadow-sm active:scale-[0.98]"
            onClick={() => goToTests(exam)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-xl ${categoryColors[selectedCategory?.slug || ''] || 'bg-gray-500'} text-white flex items-center justify-center`}>
                    <span className="font-bold text-sm">{exam.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{exam.name}</p>
                    <p className="text-xs text-gray-500">{exam.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />{exam._count.tests} tests</span>
                      {exam.duration && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{exam.duration}min</span>}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Also show other categories */}
        <Separator className="my-4" />
        <h3 className="font-semibold text-gray-600">Other Categories</h3>
        {categories.filter(c => c.id !== selectedCategory?.id).map(cat => (
          <Card key={cat.id} className="cursor-pointer hover:shadow-md transition-all border-0 shadow-sm"
            onClick={() => goToExams(cat)}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${categoryColors[cat.slug] || 'bg-gray-500'} text-white flex items-center justify-center text-lg`}>
                {cat.icon || '📋'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{cat.name}</p>
                <p className="text-xs text-gray-500">{cat.exams.length} exams</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // TESTS LIST PAGE
  const renderTests = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setPage('exams')} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg">{selectedExam?.name || 'Tests'}</h1>
            <p className="text-xs text-gray-500">{tests.length} mock tests available</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-orange-600" /></div>
        ) : tests.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-500">No tests available yet</p>
              <p className="text-sm text-gray-400">Check back soon for new tests!</p>
            </CardContent>
          </Card>
        ) : (
          tests.map(test => (
            <Card key={test.id} className="cursor-pointer hover:shadow-md transition-all border-0 shadow-sm active:scale-[0.98]"
              onClick={() => goToTestInfo(test)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-semibold text-sm">{test.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{test.exam.name}</p>
                  </div>
                  <Badge variant={test.isFree ? 'default' : 'secondary'} className={test.isFree ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                    {test.isFree ? 'FREE' : 'PREMIUM'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{test.totalQuestions} Qs</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{test.duration} min</span>
                  <span className="flex items-center gap-1"><Target className="w-3 h-3" />{test.difficulty}</span>
                  {test.isLive && <Badge className="bg-red-500 text-xs animate-pulse">LIVE</Badge>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )

  // TEST INFO PAGE (before starting)
  const renderTestInfo = () => {
    if (!selectedTest) return null
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => setPage('tests')} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg">Test Details</h1>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-20">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{selectedTest.title}</CardTitle>
              <CardDescription>{selectedTest.exam.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <BookOpen className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-700">{selectedTest.totalQuestions}</p>
                  <p className="text-xs text-blue-600">Questions</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <Clock className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-orange-700">{selectedTest.duration}</p>
                  <p className="text-xs text-orange-600">Minutes</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-emerald-700">+{selectedTest.markingCorrect}</p>
                  <p className="text-xs text-emerald-600">Correct</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-red-700">{selectedTest.markingWrong > 0 ? `-${selectedTest.markingWrong}` : '0'}</p>
                  <p className="text-xs text-red-600">Wrong</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <h4 className="font-semibold">Instructions:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />Total {selectedTest.totalQuestions} questions in this test</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />Time duration: {selectedTest.duration} minutes</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />Each correct answer: +{selectedTest.markingCorrect} marks</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />Each wrong answer: {selectedTest.markingWrong > 0 ? `${selectedTest.markingWrong} marks` : 'No negative marking'}</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />You can mark questions for review</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />Auto-submit when time runs out</li>
                </ul>
              </div>

              <Button onClick={startTest} className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-lg font-semibold rounded-xl">
                <Play className="w-5 h-5 mr-2" /> Start Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // TEST TAKING PAGE
  const renderTestTaking = () => {
    if (!selectedTest) return null
    const questions = selectedTest.questions
    const q = questions[currentQuestion]
    const answeredCount = Object.keys(answers).filter(k => answers[k] && answers[k] !== 'skip').length
    const progress = (answeredCount / questions.length) * 100

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-lg mx-auto px-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Q {currentQuestion + 1}/{questions.length}</p>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${timeLeft < 60 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-orange-100 text-orange-700'}`}>
                <Timer className="w-4 h-4" />
                <span className="font-mono font-bold text-sm">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 max-w-lg mx-auto px-4 py-4 w-full">
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            {q.subject && <Badge variant="outline" className="text-xs">{q.subject}</Badge>}
            <Badge variant="outline" className="text-xs">Q{currentQuestion + 1}</Badge>
            {markedForReview.has(q.id) && <Badge className="bg-yellow-500 text-xs">Marked for Review</Badge>}
          </div>

          <Card className="border-0 shadow-md mb-4">
            <CardContent className="p-5">
              <p className="text-base font-medium leading-relaxed">{q.questionText}</p>
            </CardContent>
          </Card>

          {/* Options */}
          <div className="space-y-3">
            {[
              { key: 'A', text: q.optionA },
              { key: 'B', text: q.optionB },
              { key: 'C', text: q.optionC },
              { key: 'D', text: q.optionD },
            ].map(opt => {
              const isSelected = answers[q.id] === opt.key
              return (
                <button
                  key={opt.key}
                  onClick={() => selectAnswer(q.id, opt.key)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 active:scale-[0.98]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                      isSelected ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {opt.key}
                    </div>
                    <p className="flex-1 text-sm">{opt.text}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => toggleReview(q.id)}
              className={`flex-1 ${markedForReview.has(q.id) ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : ''}`}
            >
              {markedForReview.has(q.id) ? '★ Marked' : '☆ Mark for Review'}
            </Button>
            <Button
              variant="outline"
              onClick={() => selectAnswer(q.id, 'skip')}
              className="flex-1"
            >
              <SkipForward className="w-4 h-4 mr-1" /> Skip
            </Button>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-white border-t sticky bottom-0 z-40">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>

            <button
              onClick={() => submitTest()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
            >
              Submit Test
            </button>

            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === questions.length - 1}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // RESULTS PAGE
  const renderResults = () => {
    if (!resultData || !selectedTest) return null
    const percentage = Math.round((resultData.score / resultData.maxScore) * 100)
    const timeTakenMin = Math.floor(resultData.timeTaken / 60)
    const timeTakenSec = resultData.timeTaken % 60

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-6 rounded-b-3xl">
          <div className="max-w-lg mx-auto text-center">
            <Trophy className="w-12 h-12 mx-auto mb-2 text-yellow-300" />
            <h1 className="text-2xl font-bold">Test Completed!</h1>
            <p className="text-orange-100 text-sm">{selectedTest.title}</p>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4 pb-20">
          {/* Score Card */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-28 h-28 rounded-full border-4 border-orange-500 flex items-center justify-center mx-auto mb-3">
                <div>
                  <p className="text-3xl font-bold text-orange-600">{percentage}%</p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
              </div>
              <p className="text-2xl font-bold">{resultData.score} <span className="text-gray-400 text-lg">/ {resultData.maxScore}</span></p>
              <p className="text-sm text-gray-500 mt-1">Time: {timeTakenMin}m {timeTakenSec}s</p>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-emerald-600">{resultData.correct}</p>
                <p className="text-xs text-gray-500">Correct</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-red-600">{resultData.wrong}</p>
                <p className="text-xs text-gray-500">Wrong</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <SkipForward className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-gray-600">{resultData.skipped}</p>
                <p className="text-xs text-gray-500">Skipped</p>
              </CardContent>
            </Card>
          </div>

          {/* Answer Key */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Answer Key</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedTest.questions.map((q, i) => {
                  const userAns = answers[q.id]
                  const isCorrect = userAns === q.correctAnswer
                  const isSkipped = !userAns || userAns === 'skip'
                  return (
                    <div key={q.id} className="border rounded-xl p-3">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium flex-1">Q{i + 1}: {q.questionText}</p>
                        {isSkipped ? <Badge variant="secondary" className="text-xs">Skipped</Badge> :
                          isCorrect ? <Badge className="bg-emerald-500 text-xs">Correct</Badge> :
                          <Badge className="bg-red-500 text-xs">Wrong</Badge>
                        }
                      </div>
                      <div className="text-xs space-y-1">
                        {!isSkipped && <p className={isCorrect ? 'text-emerald-600' : 'text-red-600'}>Your answer: {userAns}</p>}
                        <p className="text-emerald-600 font-medium">Correct answer: {q.correctAnswer}</p>
                        {q.explanation && <p className="text-gray-500 mt-1 italic">{q.explanation}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={() => { setPage('leaderboard'); fetchLeaderboard(selectedTest.id) }} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-11">
              <Trophy className="w-4 h-4 mr-2" /> Leaderboard
            </Button>
            <Button onClick={() => setPage('home')} variant="outline" className="flex-1 rounded-xl h-11">
              <Home className="w-4 h-4 mr-2" /> Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // LEADERBOARD PAGE
  const renderLeaderboard = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setPage('home')} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">Leaderboard</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3 pb-20">
        {/* Top 3 */}
        {leaderboard.length >= 3 && (
          <div className="flex items-end justify-center gap-3 mb-6 pt-4">
            {/* 2nd */}
            <div className="text-center">
              <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center mb-1">
                <span className="font-bold text-gray-600">2</span>
              </div>
              <p className="text-xs font-medium truncate max-w-16">{leaderboard[1].user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{leaderboard[1].score}/{leaderboard[1].maxScore}</p>
            </div>
            {/* 1st */}
            <div className="text-center -mt-4">
              <Crown className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-1 border-2 border-yellow-500">
                <span className="font-bold text-yellow-600">1</span>
              </div>
              <p className="text-xs font-medium truncate max-w-16">{leaderboard[0].user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{leaderboard[0].score}/{leaderboard[0].maxScore}</p>
            </div>
            {/* 3rd */}
            <div className="text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-1">
                <span className="font-bold text-orange-600">3</span>
              </div>
              <p className="text-xs font-medium truncate max-w-16">{leaderboard[2].user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{leaderboard[2].score}/{leaderboard[2].maxScore}</p>
            </div>
          </div>
        )}

        {/* Full List */}
        {leaderboard.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-500">No results yet</p>
              <p className="text-sm text-gray-400">Take a test to appear on the leaderboard!</p>
            </CardContent>
          </Card>
        ) : (
          leaderboard.map((entry, i) => (
            <Card key={entry.id} className={`border-0 shadow-sm ${i < 3 ? 'bg-yellow-50' : ''}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  i === 0 ? 'bg-yellow-500 text-white' :
                  i === 1 ? 'bg-gray-400 text-white' :
                  i === 2 ? 'bg-orange-400 text-white' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{entry.user?.name || 'Guest User'}</p>
                  <p className="text-xs text-gray-500">{entry.test?.title}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-orange-600">{entry.score}/{entry.maxScore}</p>
                  <p className="text-xs text-gray-500">{Math.round((entry.score / entry.maxScore) * 100)}%</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )

  // PROFILE PAGE
  const renderProfile = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-4 pb-6 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setPage('home')} className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg">Profile</h1>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold">Guest User</h2>
            <p className="text-orange-100 text-sm">ExamPrep Bharat</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4 pb-20">
        {/* Stats */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Your Stats</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">0</p>
                <p className="text-xs text-gray-500">Tests Taken</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">0</p>
                <p className="text-xs text-gray-500">Avg Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">-</p>
                <p className="text-xs text-gray-500">Best Rank</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><span className="text-sm">🌐</span></div>
                <div>
                  <p className="text-sm font-medium">Language</p>
                  <p className="text-xs text-gray-500">English (Default)</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center"><span className="text-sm">🔔</span></div>
                <div>
                  <p className="text-sm font-medium">Notifications</p>
                  <p className="text-xs text-gray-500">Exam reminders</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center"><span className="text-sm">📱</span></div>
                <div>
                  <p className="text-sm font-medium">About</p>
                  <p className="text-xs text-gray-500">ExamPrep Bharat v1.0</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Login Card */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <CardContent className="p-4 text-center">
            <p className="font-semibold">Login to save your progress</p>
            <p className="text-sm text-orange-100 mb-3">Track your scores across devices</p>
            <Button variant="outline" className="bg-white text-orange-600 hover:bg-orange-50 rounded-xl">
              Login with Phone
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Show bottom nav on these pages
  const showBottomNav = ['home', 'exams', 'leaderboard', 'profile'].includes(page)

  // MAIN RENDER
  return (
    <div className="relative">
      <div className={showBottomNav ? 'pb-16' : ''}>
        {page === 'home' && renderHome()}
        {page === 'exams' && renderExams()}
        {page === 'tests' && renderTests()}
        {page === 'test-info' && renderTestInfo()}
        {page === 'test-taking' && renderTestTaking()}
        {page === 'results' && renderResults()}
        {page === 'leaderboard' && renderLeaderboard()}
        {page === 'profile' && renderProfile()}
      </div>
      {showBottomNav && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="max-w-lg mx-auto flex">
            {[
              { icon: <Home className="w-5 h-5" />, label: 'Home', page: 'home' as PageView },
              { icon: <BookOpen className="w-5 h-5" />, label: 'Exams', page: 'exams' as PageView },
              { icon: <Trophy className="w-5 h-5" />, label: 'Ranks', page: 'leaderboard' as PageView },
              { icon: <User className="w-5 h-5" />, label: 'Profile', page: 'profile' as PageView },
            ].map(nav => (
              <button
                key={nav.page}
                onClick={() => {
                  if (nav.page === 'exams' && categories.length > 0) {
                    if (!selectedCategory) setSelectedCategory(categories[0])
                    setPage('exams')
                  } else {
                    setPage(nav.page)
                  }
                }}
                className={`flex-1 flex flex-col items-center py-2 gap-1 ${page === nav.page || (nav.page === 'exams' && ['exams', 'tests', 'test-info'].includes(page)) ? 'text-orange-600' : 'text-gray-400'}`}
              >
                {nav.icon}
                <span className="text-xs">{nav.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Crown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 17l2-9 5 4 3-8 3 8 5-4 2 9H2z"/>
    </svg>
  )
}
