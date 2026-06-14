// Local Data Layer for MockMaster
// This module provides types and fallback data for when Firestore is unavailable.
// All primary data flow goes through Firestore; this is the fallback / type definition layer.

// ============================================================
// Types
// ============================================================

export interface LocalExamCategory {
  id: string
  name: string
  slug: string
  icon: string
  description: string
  order: number
  exams: LocalExam[]
}

export interface LocalExam {
  id: string
  name: string
  slug: string
  description: string
  totalQuestions: number
  duration: number
  markingScheme: string
  order: number
  testCount: number
  tests?: LocalTest[]
}

export interface LocalTest {
  id: string
  title: string
  slug: string
  description: string
  totalQuestions: number
  duration: number
  markingCorrect: number
  markingWrong: number
  markingSkipped: number
  difficulty: string
  isFree: boolean
  isLive: boolean
  exam: { id: string; name: string; slug: string }
  questions: LocalQuestion[]
  examId?: string
  examName?: string
  examSlug?: string
}

export interface LocalQuestion {
  id: string
  questionText: string
  questionImage?: string | null
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  explanation?: string | null
  subject?: string | null
  order?: number
}

export interface TestResult {
  id: string
  testId: string
  testName: string
  examName?: string
  userId: string
  userName?: string
  score: number
  maxScore: number
  correctCount: number
  wrongCount: number
  skippedCount: number
  timeTaken: number
  totalQuestions?: number
  answers: Record<string, string>
  createdAt: string
  mode?: 'real' | 'practice'
}

// ============================================================
// Fallback Data (used when Firestore is unavailable)
// ============================================================

const FALLBACK_CATEGORIES: LocalExamCategory[] = [
  {
    id: 'ssc',
    name: 'SSC',
    slug: 'ssc',
    icon: '📋',
    description: 'Staff Selection Commission exams',
    order: 1,
    exams: [
      {
        id: 'ssc-cgl',
        name: 'SSC CGL',
        slug: 'ssc-cgl',
        description: 'Combined Graduate Level',
        totalQuestions: 100,
        duration: 60,
        markingScheme: '2 marks each, -0.5 negative',
        order: 1,
        testCount: 3,
      },
      {
        id: 'ssc-chsl',
        name: 'SSC CHSL',
        slug: 'ssc-chsl',
        description: 'Combined Higher Secondary Level',
        totalQuestions: 100,
        duration: 60,
        markingScheme: '2 marks each, -0.5 negative',
        order: 2,
        testCount: 2,
      },
    ],
  },
  {
    id: 'banking',
    name: 'Banking',
    slug: 'banking',
    icon: '🏦',
    description: 'Banking & IBPS exams',
    order: 2,
    exams: [
      {
        id: 'ibps-po',
        name: 'IBPS PO',
        slug: 'ibps-po',
        description: 'Institute of Banking Personnel Selection - Probationary Officer',
        totalQuestions: 100,
        duration: 60,
        markingScheme: '1 mark each, -0.25 negative',
        order: 1,
        testCount: 3,
      },
    ],
  },
]

const ALL_TESTS_LOCAL: LocalTest[] = []

// ============================================================
// Fallback Functions (used when Firestore is unavailable)
// ============================================================

export function getCategories(): LocalExamCategory[] {
  return FALLBACK_CATEGORIES
}

export function getTestsByExam(examId: string): LocalTest[] {
  return ALL_TESTS_LOCAL.filter((t) => t.exam?.id === examId || t.examId === examId)
}

export function getTestById(id: string): LocalTest | undefined {
  return ALL_TESTS_LOCAL.find((t) => t.id === id)
}

export function getResults(): TestResult[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('mockmaster_results')
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

export function saveResult(data: Omit<TestResult, 'id' | 'createdAt'>): TestResult {
  const result: TestResult = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }
  if (typeof window !== 'undefined') {
    try {
      const existing = getResults()
      localStorage.setItem('mockmaster_results', JSON.stringify([result, ...existing]))
    } catch {}
  }
  return result
}

export function getLeaderboard(testId: string): TestResult[] {
  return getResults()
    .filter((r) => r.testId === testId)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
}

export const ALL_TESTS = ALL_TESTS_LOCAL
