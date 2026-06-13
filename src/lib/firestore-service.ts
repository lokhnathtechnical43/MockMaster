// Firestore Service Layer for MockMaster
// Provides full CRUD operations with offline fallback to local-data.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
  WriteBatch,
  DocumentData,
  QueryConstraint,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore'
import { db, isFirebaseReady, auth } from '@/lib/firebase'
import {
  LocalExamCategory,
  LocalExam,
  LocalTest,
  LocalQuestion,
  TestResult,
  getCategories as getLocalCategories,
  getTestsByExam as getLocalTestsByExam,
  getTestById as getLocalTestById,
  saveResult as saveLocalResult,
  getResults as getLocalResults,
  getLeaderboard as getLocalLeaderboard,
  ALL_TESTS,
  addCategory as localAddCategory,
  updateCategory as localUpdateCategory,
  deleteCategory as localDeleteCategory,
  getExams as localGetExams,
  addExam as localAddExam,
  updateExam as localUpdateExam,
  deleteExam as localDeleteExam,
  deleteAllExamsInCategory as localDeleteAllExamsInCategory,
  getQuestions as localGetQuestions,
  addTest as localAddTest,
  updateTest as localUpdateTest,
  deleteTest as localDeleteTest,
  deleteAllTestsInExam as localDeleteAllTestsInExam,
  addQuestion as localAddQuestion,
  addBatchQuestions as localAddBatchQuestions,
  updateQuestion as localUpdateQuestion,
  deleteQuestion as localDeleteQuestion,
  deleteAllQuestionsInTest as localDeleteAllQuestionsInTest,
  deleteAllExamData as localDeleteAllExamData,
  seedLocalData as localSeedData,
} from '@/lib/local-data'
import {
  Announcement,
  Notification,
  UpcomingExam,
  DailyTip,
  PrevYearPaper,
  SidebarMenuItem,
  getAnnouncements as getLocalAnnouncements,
  getNotifications as getLocalNotifications,
  getUpcomingExams as getLocalUpcomingExams,
  getDailyTips as getLocalDailyTips,
  getPrevYearPapers as getLocalPrevYearPapers,
  getSidebarMenu as getLocalSidebarMenu,
  saveAnnouncements as saveLocalAnnouncements,
  saveNotifications as saveLocalNotifications,
  saveUpcomingExams as saveLocalUpcomingExams,
  saveDailyTips as saveLocalDailyTips,
  savePrevYearPapers as saveLocalPrevYearPapers,
  saveSidebarMenu as saveLocalSidebarMenu,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_UPCOMING_EXAMS,
  DEFAULT_DAILY_TIPS,
  DEFAULT_PREV_YEAR_PAPERS,
  DEFAULT_SIDEBAR_MENU,
} from '@/lib/admin-data'

// ============================================================
// Configuration
// ============================================================

/** Global flag to toggle Firestore vs local fallback */
let useFirestore = isFirebaseReady() // Auto-enable when Firebase is configured

export function setUseFirestore(value: boolean) {
  useFirestore = value
}

export function getUseFirestore(): boolean {
  return useFirestore
}

// ============================================================
// Firestore Collection Names
// ============================================================

const COLLECTIONS = {
  categories: 'categories',
  exams: 'exams',
  tests: 'tests',
  questions: 'questions',
  results: 'results',
  users: 'users',
  announcements: 'announcements',
  notifications: 'notifications',
  upcoming_exams: 'upcoming_exams',
  daily_tips: 'daily_tips',
  prev_year_papers: 'prev_year_papers',
  sidebar_menu: 'sidebar_menu',
} as const

// ============================================================
// Firestore Document Types
// ============================================================

export interface FirestoreExamCategory {
  id: string
  name: string
  slug: string
  icon: string
  description: string
  order: number
  imageUrl?: string
}

export interface FirestoreExam {
  id: string
  name: string
  slug: string
  description: string
  totalQuestions: number
  duration: number
  markingScheme: string
  order: number
  testCount: number
  categoryId: string
  imageUrl?: string
}

export interface FirestoreTest {
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
  examId: string
  examName: string
  examSlug: string
}

export interface FirestoreQuestion {
  id: string
  questionText: string
  questionImage: string | null
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  explanation: string | null
  subject: string | null
  order: number
  testId: string
}

export interface FirestoreTestResult {
  id: string
  testId: string
  testName: string
  examName: string
  userId: string
  correctCount: number
  wrongCount: number
  skippedCount: number
  score: number
  maxScore: number
  timeTaken: number
  totalQuestions: number
  answers: Record<string, string>
  createdAt: string | Timestamp
  mode?: 'real' | 'practice'  // Whether this was a real exam or practice session
}

export interface FirestoreUser {
  id: string
  name: string
  email: string
  phone: string
  photoURL: string
  role: 'user' | 'admin'
  testsCompleted: number
  totalScore: number
  createdAt: string | Timestamp
  lastActive: string | Timestamp
}

export interface FirestoreAnnouncement {
  id: string
  image: string
  title: string
  subtitle: string
  action: string
  gradient: string
}

export interface FirestoreNotification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'update' | 'alert' | 'info'
}

// ============================================================
// Analytics Types
// ============================================================

export interface DashboardStats {
  totalUsers: number
  totalTests: number
  totalExams: number
  totalResults: number
  avgScore: number
  recentActivity: FirestoreTestResult[]
}

export interface DailyStats {
  date: string
  results: number
  avgScore: number
  uniqueUsers: number
}

// ============================================================
// Helper: Safe Firestore call with fallback
// ============================================================

async function firestoreOperation<T>(
  firestoreFn: () => Promise<T>,
  fallbackFn: () => T
): Promise<T> {
  if (!useFirestore || !isFirebaseReady() || !db) {
    return fallbackFn()
  }
  try {
    return await firestoreFn()
  } catch (error: any) {
    // Silently fall back to local data for permission/collection-not-found errors
    // These are expected when Firestore rules aren't deployed yet or collections don't exist
    const code = error?.code || ''
    if (code === 'permission-denied' || code === 'PERMISSION_DENIED') {
      console.warn('[Firestore] Permission denied - falling back to local data. Deploy firestore.rules to fix.')
    } else {
      console.warn('[Firestore] Operation failed, falling back to local data:', error?.message || error)
    }
    return fallbackFn()
  }
}

// ============================================================
// Category CRUD
// ============================================================

/**
 * Get all categories with their nested exams.
 * Firestore: fetches categories & exams separately, then merges.
 * Fallback: returns local-data categories.
 */
export async function getCategories(): Promise<LocalExamCategory[]> {
  return firestoreOperation(
    async () => {
      const catSnap = await getDocs(
        query(collection(db, COLLECTIONS.categories), orderBy('order'))
      )
      const examSnap = await getDocs(
        query(collection(db, COLLECTIONS.exams), orderBy('order'))
      )

      const examsByCategory: Record<string, FirestoreExam[]> = {}
      examSnap.docs.forEach((d) => {
        const exam = { id: d.id, ...d.data() } as FirestoreExam
        if (!examsByCategory[exam.categoryId]) examsByCategory[exam.categoryId] = []
        examsByCategory[exam.categoryId].push(exam)
      })

      return catSnap.docs.map((d) => {
        const cat = { id: d.id, ...d.data() } as FirestoreExamCategory
        const catExams = examsByCategory[cat.id] || []
        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          description: cat.description,
          order: cat.order,
          ...(cat.imageUrl ? { imageUrl: cat.imageUrl } : {}),
          exams: catExams.map((e) => ({
            id: e.id,
            name: e.name,
            slug: e.slug,
            categoryId: e.categoryId,
            description: e.description,
            totalQuestions: e.totalQuestions,
            duration: e.duration,
            markingScheme: e.markingScheme,
            order: e.order,
            testCount: e.testCount,
            ...(e.imageUrl ? { imageUrl: e.imageUrl } : {}),
          })),
        } as LocalExamCategory
      })
    },
    () => getLocalCategories()
  )
}

/**
 * Add a new category. Always saves to localStorage, and to Firestore if available.
 */
export async function addCategory(
  data: Omit<FirestoreExamCategory, 'id'>
): Promise<FirestoreExamCategory> {
  // Always save to local
  const localCat = localAddCategory(data)
  // Try Firestore if available
  if (useFirestore && isFirebaseReady() && db) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.categories), data)
      return { id: docRef.id, ...data }
    } catch (error) {
      console.warn('[Firestore] addCategory error, local saved:', error)
    }
  }
  return localCat
}

/**
 * Update an existing category. Always updates localStorage, and Firestore if available.
 */
export async function updateCategory(
  id: string,
  data: Partial<FirestoreExamCategory>
): Promise<void> {
  // Always update local
  localUpdateCategory(id, data)
  // Try Firestore if available
  if (useFirestore && isFirebaseReady() && db) {
    try {
      await updateDoc(doc(db, COLLECTIONS.categories, id), data)
    } catch (error) {
      console.warn('[Firestore] updateCategory error, local updated:', error)
    }
  }
}

/**
 * Delete a category. Always deletes from localStorage, and Firestore if available.
 */
export async function deleteCategory(id: string): Promise<void> {
  // Always delete from local
  localDeleteCategory(id)
  // Try Firestore if available
  if (useFirestore && isFirebaseReady() && db) {
    try {
      const examSnap = await getDocs(
        query(collection(db, COLLECTIONS.exams), where('categoryId', '==', id))
      )
      const batch = writeBatch(db)
      examSnap.docs.forEach((d) => batch.delete(d.ref))
      batch.delete(doc(db, COLLECTIONS.categories, id))
      await batch.commit()
    } catch (error) {
      console.warn('[Firestore] deleteCategory error, local deleted:', error)
    }
  }
}

// ============================================================
// Exam CRUD
// ============================================================

/**
 * Get exams, optionally filtered by category.
 */
export async function getExams(categoryId?: string): Promise<LocalExam[]> {
  return firestoreOperation(
    async () => {
      // Avoid composite index requirement: use only 'where' (no orderBy with where)
      // Sort client-side after fetching
      let snap
      if (categoryId) {
        snap = await getDocs(query(collection(db, COLLECTIONS.exams), where('categoryId', '==', categoryId)))
      } else {
        snap = await getDocs(query(collection(db, COLLECTIONS.exams), orderBy('order')))
      }
      const results = snap.docs.map((d) => {
        const e = { id: d.id, ...d.data() } as FirestoreExam
        return {
          id: e.id,
          name: e.name,
          slug: e.slug,
          categoryId: e.categoryId,
          description: e.description,
          totalQuestions: e.totalQuestions,
          duration: e.duration,
          markingScheme: e.markingScheme,
          order: e.order,
          testCount: e.testCount,
        } as LocalExam
      })
      // Sort client-side by order
      results.sort((a, b) => (a.order || 0) - (b.order || 0))
      return results
    },
    () => {
      const cats = getLocalCategories()
      const allExams = cats.flatMap((c) => c.exams)
      if (categoryId) return allExams // Local data has exams nested; filter is approximate
      return allExams
    }
  )
}

/**
 * Add a new exam. Always saves to localStorage, and Firestore if available.
 */
export async function addExam(
  data: Omit<FirestoreExam, 'id'>
): Promise<FirestoreExam> {
  // Always save to local
  const localExam = localAddExam(data)
  // Try Firestore if available
  if (useFirestore && isFirebaseReady() && db) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.exams), data)
      return { id: docRef.id, ...data }
    } catch (error) {
      console.warn('[Firestore] addExam error, local saved:', error)
    }
  }
  return localExam
}

/**
 * Update an existing exam. Always updates localStorage, and Firestore if available.
 */
export async function updateExam(
  id: string,
  data: Partial<FirestoreExam>
): Promise<void> {
  // Always update local
  localUpdateExam(id, data)
  // Try Firestore if available
  if (useFirestore && isFirebaseReady() && db) {
    try {
      await updateDoc(doc(db, COLLECTIONS.exams, id), data)
    } catch (error) {
      console.warn('[Firestore] updateExam error, local updated:', error)
    }
  }
}

/**
 * Delete an exam. Always deletes from localStorage, and Firestore if available.
 */
export async function deleteExam(id: string): Promise<void> {
  // Always delete from local
  localDeleteExam(id)
  // Try Firestore if available
  if (useFirestore && isFirebaseReady() && db) {
    try {
      const testSnap = await getDocs(
        query(collection(db, COLLECTIONS.tests), where('examId', '==', id))
      )
      const batch = writeBatch(db)
      for (const testDoc of testSnap.docs) {
        const qSnap = await getDocs(
          query(collection(db, COLLECTIONS.questions), where('testId', '==', testDoc.id))
        )
        qSnap.docs.forEach((q) => batch.delete(q.ref))
        batch.delete(testDoc.ref)
      }
      batch.delete(doc(db, COLLECTIONS.exams, id))
      await batch.commit()
    } catch (error) {
      console.warn('[Firestore] deleteExam error, local deleted:', error)
    }
  }
}

// ============================================================
// Test CRUD
// ============================================================

/**
 * Get tests, optionally filtered by exam.
 */
export async function getTests(examId?: string): Promise<LocalTest[]> {
  return firestoreOperation(
    async () => {
      // Avoid composite index requirement: use only 'where' (no orderBy with where)
      let snap
      if (examId) {
        snap = await getDocs(query(collection(db, COLLECTIONS.tests), where('examId', '==', examId)))
      } else {
        snap = await getDocs(query(collection(db, COLLECTIONS.tests), orderBy('slug')))
      }
      const results = snap.docs.map((d) => {
        const t = { id: d.id, ...d.data() } as FirestoreTest
        return {
          id: t.id,
          examId: t.examId,
          title: t.title,
          slug: t.slug,
          description: t.description,
          totalQuestions: t.totalQuestions,
          duration: t.duration,
          // Field aliases for component compatibility
          markingCorrect: t.markingCorrect,
          markingWrong: t.markingWrong,
          markingSkipped: t.markingSkipped,
          correctMarks: t.markingCorrect ?? 1,
          wrongMarks: t.markingWrong ?? 0,
          skipMarks: t.markingSkipped ?? 0,
          totalMarks: t.totalQuestions * (t.markingCorrect ?? 1),
          passingMarks: Math.ceil(t.totalQuestions * (t.markingCorrect ?? 1) * 0.4),
          difficulty: t.difficulty,
          isFree: t.isFree,
          isLive: t.isLive,
          exam: { id: t.examId, name: t.examName, slug: t.examSlug },
          questions: [], // Questions loaded separately via getTestById
          createdAt: new Date().toISOString(),
        } as LocalTest
      })
      // Sort client-side by slug
      results.sort((a, b) => (a.slug || '').localeCompare(b.slug || ''))
      return results
    },
    () => {
      if (examId) return getLocalTestsByExam(examId)
      return ALL_TESTS.map((t) => ({ ...t, questions: [] }))
    }
  )
}

/**
 * Get a single test by ID, including its questions.
 * Questions are fetched separately so that a question-query failure
 * doesn't prevent the test itself from being returned.
 */
export async function getTestById(id: string): Promise<LocalTest | null> {
  if (!useFirestore || !isFirebaseReady() || !db) {
    return getLocalTestById(id) ?? null
  }

  try {
    // 1. Fetch the test document
    const testDoc = await getDoc(doc(db, COLLECTIONS.tests, id))
    if (!testDoc.exists()) {
      console.warn('[Firestore] getTestById: No test document found for id:', id)
      return getLocalTestById(id) ?? null
    }

    const t = { id: testDoc.id, ...testDoc.data() } as FirestoreTest

    // 2. Fetch questions — using only 'where' (no orderBy) to avoid needing composite indexes.
    //    Sort client-side by 'order' field instead.
    let questions: LocalQuestion[] = []
    try {
      const qSnap = await getDocs(
        query(collection(db, COLLECTIONS.questions), where('testId', '==', id))
      )
      console.log('[Firestore] getTestById: Found', qSnap.docs.length, 'questions for test:', id, t.title)
      questions = qSnap.docs.map((qd) => {
        const q = { id: qd.id, ...qd.data() } as FirestoreQuestion
        return {
          id: q.id,
          questionText: q.questionText,
          questionImage: q.questionImage,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          subject: q.subject,
          order: q.order,
        }
      })
      // Sort client-side by order field
      questions.sort((a, b) => (a.order || 0) - (b.order || 0))
    } catch (qErr: any) {
      // If questions fail, still return the test with empty questions
      console.warn('[Firestore] getTestById: Failed to fetch questions for test:', id, qErr?.message || qErr)
    }

    // 3. Build the return object with field aliases for component compatibility
    const correctMarks = t.markingCorrect ?? 1
    const wrongMarks = Math.abs(t.markingWrong ?? 0)
    const totalMarks = t.totalQuestions * correctMarks
    const passingMarks = Math.ceil(totalMarks * 0.4)

    return {
      id: t.id,
      title: t.title,
      slug: t.slug,
      description: t.description,
      totalQuestions: t.totalQuestions,
      duration: t.duration,
      // Firestore-style field names
      markingCorrect: t.markingCorrect,
      markingWrong: t.markingWrong,
      markingSkipped: t.markingSkipped,
      // Component-compatible field aliases
      correctMarks,
      wrongMarks,
      skipMarks: t.markingSkipped ?? 0,
      totalMarks,
      passingMarks,
      // Other fields
      difficulty: t.difficulty,
      isFree: t.isFree,
      isLive: t.isLive,
      exam: { id: t.examId, name: t.examName, slug: t.examSlug },
      examId: t.examId,
      questions,
      createdAt: new Date().toISOString(),
    } as LocalTest
  } catch (error: any) {
    console.warn('[Firestore] getTestById failed, falling back to local data:', error?.message || error)
    return getLocalTestById(id) ?? null
  }
}

/**
 * Add a new test.
 */
export async function addTest(
  data: Omit<FirestoreTest, 'id'>
): Promise<FirestoreTest> {
  // Always save to local
  const localTest = localAddTest(data)
  // Try Firestore if available
  if (useFirestore && isFirebaseReady() && db) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.tests), data)
      return { id: docRef.id, ...data }
    } catch (error) {
      console.warn('[Firestore] addTest error, local saved:', error)
    }
  }
  return localTest as unknown as FirestoreTest
}

/**
 * Update an existing test. Always updates localStorage, and Firestore if available.
 */
export async function updateTest(
  id: string,
  data: Partial<FirestoreTest>
): Promise<void> {
  // Always update local
  localUpdateTest(id, data)
  // Try Firestore if available
  if (useFirestore && isFirebaseReady() && db) {
    try {
      await updateDoc(doc(db, COLLECTIONS.tests, id), data)
    } catch (error) {
      console.warn('[Firestore] updateTest error, local updated:', error)
    }
  }
}

/**
 * Delete a test. Always deletes from localStorage, and Firestore if available.
 */
export async function deleteTest(id: string): Promise<void> {
  // Always delete from local
  localDeleteTest(id)
  // Try Firestore if available
  if (useFirestore && isFirebaseReady() && db) {
    try {
      const qSnap = await getDocs(
        query(collection(db, COLLECTIONS.questions), where('testId', '==', id))
      )
      const batch = writeBatch(db)
      qSnap.docs.forEach((q) => batch.delete(q.ref))
      batch.delete(doc(db, COLLECTIONS.tests, id))
      await batch.commit()
    } catch (error) {
      console.warn('[Firestore] deleteTest error, local deleted:', error)
    }
  }
}

// ============================================================
// Question CRUD
// ============================================================

/**
 * Get all questions for a given test.
 * Uses only 'where' (no orderBy) to avoid needing composite indexes.
 * Sorts client-side by 'order' field instead.
 */
export async function getQuestions(testId: string): Promise<LocalQuestion[]> {
  return firestoreOperation(
    async () => {
      const snap = await getDocs(
        query(
          collection(db, COLLECTIONS.questions),
          where('testId', '==', testId)
        )
      )
      const results = snap.docs.map((d) => {
        const q = { id: d.id, ...d.data() } as FirestoreQuestion
        return {
          id: q.id,
          questionText: q.questionText,
          questionImage: q.questionImage,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          subject: q.subject,
          order: q.order,
        } as LocalQuestion
      })
      // Sort client-side by order field
      results.sort((a, b) => (a.order || 0) - (b.order || 0))
      return results
    },
    () => {
      const test = getLocalTestById(testId)
      return test?.questions ?? []
    }
  )
}

/**
 * Add a single question. Always saves to localStorage, and Firestore if available.
 */
export async function addQuestion(
  data: Omit<FirestoreQuestion, 'id'>
): Promise<FirestoreQuestion> {
  // Always save to local
  const localQ = localAddQuestion(data)
  // Try Firestore if available
  if (useFirestore && isFirebaseReady() && db) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.questions), data)
      return { id: docRef.id, ...data }
    } catch (error) {
      console.warn('[Firestore] addQuestion error, local saved:', error)
    }
  }
  return localQ as unknown as FirestoreQuestion
}

/**
 * Update an existing question. Always updates localStorage, and Firestore if available.
 */
export async function updateQuestion(
  id: string,
  data: Partial<FirestoreQuestion>
): Promise<void> {
  // Always update local
  localUpdateQuestion(id, data)
  // Try Firestore if available
  if (useFirestore && isFirebaseReady() && db) {
    try {
      await updateDoc(doc(db, COLLECTIONS.questions, id), data)
    } catch (error) {
      console.warn('[Firestore] updateQuestion error, local updated:', error)
    }
  }
}

/**
 * Delete a question. Always deletes from localStorage, and Firestore if available.
 */
export async function deleteQuestion(id: string): Promise<void> {
  // Always delete from local
  localDeleteQuestion(id)
  // Try Firestore if available
  if (useFirestore && isFirebaseReady() && db) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.questions, id))
    } catch (error) {
      console.warn('[Firestore] deleteQuestion error, local deleted:', error)
    }
  }
}

/**
 * Add multiple questions at once. Always saves to localStorage, and Firestore if available.
 */
export async function addBatchQuestions(
  testId: string,
  questions: Omit<LocalQuestion, 'id'>[]
): Promise<LocalQuestion[]> {
  // Always save to local
  const localQs = localAddBatchQuestions(testId, questions)
  // Try Firestore if available
  if (useFirestore && isFirebaseReady() && db) {
    try {
      const batch = writeBatch(db)
      const created: LocalQuestion[] = []
      for (const qData of questions) {
        const docRef = doc(collection(db, COLLECTIONS.questions))
        const firestoreQ: FirestoreQuestion = {
          id: docRef.id,
          questionText: qData.questionText,
          questionImage: qData.questionImage,
          optionA: qData.optionA,
          optionB: qData.optionB,
          optionC: qData.optionC,
          optionD: qData.optionD,
          correctAnswer: qData.correctAnswer,
          explanation: qData.explanation,
          subject: qData.subject,
          order: qData.order,
          testId,
        }
        batch.set(docRef, firestoreQ)
        created.push({ ...qData, id: docRef.id })
      }
      await batch.commit()
      return created
    } catch (error) {
      console.warn('[Firestore] addBatchQuestions error, local saved:', error)
    }
  }
  return localQs
}

// ============================================================
// Bulk Delete Operations (Admin only)
// ============================================================

/**
 * Delete all questions in a specific test. Always deletes from localStorage, and Firestore if available.
 */
export async function deleteAllQuestionsInTest(testId: string): Promise<number> {
  // Always delete from local
  const localCount = localDeleteAllQuestionsInTest(testId)
  // Try Firestore if available
  if (useFirestore && isFirebaseReady() && db) {
    try {
      const qSnap = await getDocs(
        query(collection(db, COLLECTIONS.questions), where('testId', '==', testId))
      )
      if (qSnap.empty) return localCount
      const docs = qSnap.docs
      for (let i = 0; i < docs.length; i += 500) {
        const chunk = docs.slice(i, i + 500)
        const batch = writeBatch(db)
        chunk.forEach(d => batch.delete(d.ref))
        await batch.commit()
      }
      return docs.length
    } catch (error) {
      console.warn('[Firestore] deleteAllQuestionsInTest error, local deleted:', error)
    }
  }
  return localCount
}

/**
 * Delete all tests in a specific exam. Always deletes from localStorage, and Firestore if available.
 */
export async function deleteAllTestsInExam(examId: string): Promise<number> {
  // Always delete from local
  const localCount = localDeleteAllTestsInExam(examId)
  // Try Firestore if available
  if (useFirestore && isFirebaseReady() && db) {
    try {
      const tSnap = await getDocs(
        query(collection(db, COLLECTIONS.tests), where('examId', '==', examId))
      )
      if (tSnap.empty) return localCount
      for (const testDoc of tSnap.docs) {
        await deleteAllQuestionsInTest(testDoc.id)
        await deleteDoc(testDoc.ref)
      }
      return tSnap.docs.length
    } catch (error) {
      console.warn('[Firestore] deleteAllTestsInExam error, local deleted:', error)
    }
  }
  return localCount
}

/**
 * Delete all exams in a category. Always deletes from localStorage, and Firestore if available.
 */
export async function deleteAllExamsInCategory(categoryId: string): Promise<number> {
  // Always delete from local
  const localCount = localDeleteAllExamsInCategory(categoryId)
  // Try Firestore if available
  if (useFirestore && isFirebaseReady() && db) {
    try {
      const eSnap = await getDocs(
        query(collection(db, COLLECTIONS.exams), where('categoryId', '==', categoryId))
      )
      if (eSnap.empty) return localCount
      for (const examDoc of eSnap.docs) {
        await deleteAllTestsInExam(examDoc.id)
        await deleteDoc(examDoc.ref)
      }
      return eSnap.docs.length
    } catch (error) {
      console.warn('[Firestore] deleteAllExamsInCategory error, local deleted:', error)
    }
  }
  return localCount
}

/**
 * Delete ALL exam data. Always deletes from localStorage, and Firestore if available.
 */
export async function deleteAllExamData(): Promise<void> {
  // Always delete from local
  localDeleteAllExamData()
  // Try Firestore if available
  if (useFirestore && isFirebaseReady() && db) {
    try {
      const qSnap = await getDocs(collection(db, COLLECTIONS.questions))
      const tSnap = await getDocs(collection(db, COLLECTIONS.tests))
      const eSnap = await getDocs(collection(db, COLLECTIONS.exams))
      const cSnap = await getDocs(collection(db, COLLECTIONS.categories))
      const allDocs = [...qSnap.docs, ...tSnap.docs, ...eSnap.docs, ...cSnap.docs]
      for (let i = 0; i < allDocs.length; i += 500) {
        const chunk = allDocs.slice(i, i + 500)
        const batch = writeBatch(db)
        chunk.forEach(d => batch.delete(d.ref))
        await batch.commit()
      }
    } catch (error) {
      console.warn('[Firestore] deleteAllExamData error, local deleted:', error)
    }
  }
}

// ============================================================
// Result CRUD
// ============================================================

/**
 * Get results, optionally filtered by testId and/or userId.
 */
export async function getResults(
  testId?: string,
  userId?: string
): Promise<TestResult[]> {
  return firestoreOperation(
    async () => {
      // Avoid composite index: fetch with where only, sort client-side
      const constraints: QueryConstraint[] = []
      if (testId) constraints.push(where('testId', '==', testId))
      if (userId) constraints.push(where('userId', '==', userId))
      if (constraints.length === 0) constraints.push(orderBy('createdAt', 'desc'))

      const snap = await getDocs(query(collection(db, COLLECTIONS.results), ...constraints))
      const results = snap.docs.map((d) => {
        const r = d.data() as FirestoreTestResult
        return {
          id: d.id,
          testId: r.testId,
          testName: r.testName,
          examName: r.examName,
          userId: r.userId,
          correctCount: r.correctCount,
          wrongCount: r.wrongCount,
          skippedCount: r.skippedCount,
          score: r.score,
          maxScore: r.maxScore,
          timeTaken: r.timeTaken,
          totalQuestions: r.totalQuestions,
          answers: r.answers,
          createdAt:
            r.createdAt instanceof Timestamp
              ? r.createdAt.toDate().toISOString()
              : String(r.createdAt),
        } as TestResult
      })
      // Sort client-side by createdAt descending (when we used where-only query)
      if (testId || userId) {
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }
      return results
    },
    () => getLocalResults(testId)
  )
}

/**
 * Save a test result. Works with both Firestore and local storage.
 */
export async function saveResult(
  data: Omit<TestResult, 'id' | 'createdAt'>
): Promise<TestResult> {
  if (!useFirestore) {
    return saveLocalResult(data)
  }
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.results), {
      ...data,
      createdAt: serverTimestamp(),
    })
    return {
      ...data,
      id: docRef.id,
      createdAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[Firestore] saveResult error, falling back to local:', error)
    return saveLocalResult(data)
  }
}

/**
 * Get leaderboard for a specific test, sorted by score (desc) then time (asc).
 */
export async function getLeaderboard(testId: string): Promise<TestResult[]> {
  return firestoreOperation(
    async () => {
      // Avoid composite index: use only 'where' + limit, sort client-side
      const snap = await getDocs(
        query(
          collection(db, COLLECTIONS.results),
          where('testId', '==', testId),
          limit(50)
        )
      )
      const results: TestResult[] = snap.docs.map((d) => {
        const r = d.data() as FirestoreTestResult
        return {
          id: d.id,
          testId: r.testId,
          testName: r.testName,
          examName: r.examName,
          userId: r.userId,
          correctCount: r.correctCount,
          wrongCount: r.wrongCount,
          skippedCount: r.skippedCount,
          score: r.score,
          maxScore: r.maxScore,
          timeTaken: r.timeTaken,
          totalQuestions: r.totalQuestions,
          answers: r.answers,
          createdAt:
            r.createdAt instanceof Timestamp
              ? r.createdAt.toDate().toISOString()
              : String(r.createdAt),
        }
      })
      // Sort client-side by score desc, then timeTaken asc
      results.sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken)
      return results.slice(0, 50)
    },
    () => getLocalLeaderboard(testId)
  )
}

// ============================================================
// User Management
// ============================================================

/**
 * Get a single user profile by ID.
 */
export async function getUser(userId: string): Promise<FirestoreUser | null> {
  try {
    if (!db) {
      console.error('[Firestore] getUser: db is not initialized')
      return null
    }
    const userDoc = await getDoc(doc(db, COLLECTIONS.users, userId))
    if (!userDoc.exists()) {
      console.warn('[Firestore] getUser: No document found for UID:', userId)
      return null
    }
    const data = userDoc.data()
    console.log('[Firestore] getUser: Raw document data for', userId, ':', data)
    // Return with defaults for missing fields - role is the critical field
    return {
      id: userDoc.id,
      name: data.name || data.displayName || '',
      email: data.email || '',
      phone: data.phone || '',
      photoURL: data.photoURL || '',
      role: data.role || 'user', // Default to 'user' if role field is missing
      testsCompleted: data.testsCompleted || 0,
      totalScore: data.totalScore || 0,
      createdAt: data.createdAt || new Date().toISOString(),
      lastActive: data.lastActive || new Date().toISOString(),
    } as FirestoreUser
  } catch (error: any) {
    console.error('[Firestore] getUser error:', error?.message ?? error)
    console.error('[Firestore] This could be a Firestore security rules issue.')
    console.error('[Firestore] Make sure rules allow authenticated users to read their own document in users collection.')
    return null
  }
}

/**
 * Get all users with their stats.
 */
export async function getAllUsers(): Promise<FirestoreUser[]> {
  try {
    const snap = await getDocs(
      query(collection(db, COLLECTIONS.users), orderBy('createdAt', 'desc'))
    )
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreUser))
  } catch (error) {
    console.error('[Firestore] getAllUsers error:', error)
    return []
  }
}

/**
 * Update a user profile. Creates the document if it doesn't exist.
 */
export async function updateUser(
  userId: string,
  data: Partial<FirestoreUser>
): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.users, userId), data, { merge: true })
  } catch (error) {
    console.error('[Firestore] updateUser error:', error)
    throw error
  }
}

/**
 * Delete a user document from Firestore.
 * Note: This does NOT delete the Firebase Auth user.
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.users, userId))
  } catch (error) {
    console.error('[Firestore] deleteUser error:', error)
    throw error
  }
}

/**
 * Ensure a Firestore user document exists for the given Firebase Auth user.
 * Creates the document if it doesn't exist, updates lastActive if it does.
 * Called automatically on signup and login.
 */
export async function ensureUserDocument(params: {
  uid: string
  name: string
  email: string
  photoURL?: string
}): Promise<void> {
  if (!useFirestore || !isFirebaseReady() || !db) return
  try {
    const userDocRef = doc(db, COLLECTIONS.users, params.uid)
    const userDoc = await getDoc(userDocRef)
    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(userDocRef, {
        id: params.uid,
        name: params.name || 'User',
        email: params.email || '',
        phone: '',
        photoURL: params.photoURL || '',
        role: 'user',
        testsCompleted: 0,
        totalScore: 0,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      })
      console.log('[Firestore] Created user document for:', params.uid)
    } else {
      // Update lastActive timestamp
      await setDoc(userDocRef, {
        lastActive: serverTimestamp(),
        name: params.name || userDoc.data().name || 'User',
        email: params.email || userDoc.data().email || '',
      }, { merge: true })
    }
  } catch (error) {
    console.error('[Firestore] ensureUserDocument error:', error)
  }
}

/**
 * Auto-assign admin role to the first user if no admin exists yet.
 * This solves the chicken-and-egg problem where the first user needs admin access
 * but can't set their own role without already being admin.
 * Returns true if admin role was assigned, false otherwise.
 */
export async function ensureFirstUserAsAdmin(uid: string, email: string): Promise<boolean> {
  if (!useFirestore || !isFirebaseReady() || !db) return false
  try {
    // Check if any admin already exists
    const adminQuery = query(collection(db, COLLECTIONS.users), where('role', '==', 'admin'), limit(1))
    const adminSnap = await getDocs(adminQuery)

    if (!adminSnap.empty) {
      console.log('[Firestore] Admin already exists, skipping auto-admin')
      return false
    }

    // No admin exists — check if users collection is empty or has very few users
    const usersSnap = await getDocs(query(collection(db, COLLECTIONS.users), limit(5)))
    const userCount = usersSnap.size

    // If there are 0 or 1 users (which would be this user), make them admin
    if (userCount <= 1) {
      const userDocRef = doc(db, COLLECTIONS.users, uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        // Update existing user to admin
        await setDoc(userDocRef, { role: 'admin' }, { merge: true })
        console.log('[Firestore] ✅ Auto-assigned admin role to first user:', uid, email)
      } else {
        // Create user document with admin role
        await setDoc(userDocRef, {
          id: uid,
          name: email.split('@')[0] || 'Admin',
          email: email || '',
          phone: '',
          photoURL: '',
          role: 'admin',
          testsCompleted: 0,
          totalScore: 0,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        })
        console.log('[Firestore] ✅ Created first user as admin:', uid, email)
      }
      return true
    }

    console.log('[Firestore] Multiple users exist but no admin — manual setup required')
    return false
  } catch (error) {
    console.error('[Firestore] ensureFirstUserAsAdmin error:', error)
    return false
  }
}

/**
 * Manually set a user's role (admin only operation).
 * Can also be used from the admin panel to promote/demote users.
 */
export async function setUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
  if (!db) throw new Error('Firestore not initialized')
  try {
    await setDoc(doc(db, COLLECTIONS.users, userId), { role }, { merge: true })
    console.log('[Firestore] Updated role for', userId, 'to', role)
  } catch (error) {
    console.error('[Firestore] setUserRole error:', error)
    throw error
  }
}

/**
 * Update user's test stats in Firestore (testsCompleted, totalScore).
 * Called after each test completion.
 */
export async function updateUserTestStats(userId: string, score: number): Promise<void> {
  if (!useFirestore || !isFirebaseReady() || !db) return
  try {
    const userDocRef = doc(db, COLLECTIONS.users, userId)
    const userDoc = await getDoc(userDocRef)
    if (userDoc.exists()) {
      const data = userDoc.data()
      await setDoc(userDocRef, {
        testsCompleted: (data.testsCompleted || 0) + 1,
        totalScore: (data.totalScore || 0) + score,
        lastActive: serverTimestamp(),
      }, { merge: true })
    }
  } catch (error) {
    console.error('[Firestore] updateUserTestStats error:', error)
  }
}

// ============================================================
// Announcement CRUD
// ============================================================

/**
 * Get all announcements.
 */
export async function getAnnouncements(): Promise<Announcement[]> {
  return firestoreOperation(
    async () => {
      const snap = await getDocs(collection(db, COLLECTIONS.announcements))
      if (snap.empty) return [] // Return empty - don't auto-fill with defaults
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement))
    },
    () => [] // No local fallback - if Firestore fails, show nothing
  )
}

/**
 * Save (overwrite) the announcements collection.
 * Uses a batch to clear existing docs and write new ones.
 */
export async function saveAnnouncements(
  data: Announcement[]
): Promise<void> {
  if (!useFirestore) {
    saveLocalAnnouncements(data)
    return
  }
  try {
    const batch = writeBatch(db)
    // Delete existing
    const existing = await getDocs(collection(db, COLLECTIONS.announcements))
    existing.docs.forEach((d) => batch.delete(d.ref))
    // Add new
    for (const item of data) {
      const docRef = doc(collection(db, COLLECTIONS.announcements))
      batch.set(docRef, { ...item, id: docRef.id })
    }
    await batch.commit()
    // Also persist locally for offline access
    saveLocalAnnouncements(data)
  } catch (error) {
    console.error('[Firestore] saveAnnouncements error, saving locally:', error)
    saveLocalAnnouncements(data)
  }
}

// ============================================================
// Notification CRUD
// ============================================================

/**
 * Get all notifications.
 */
export async function getNotifications(): Promise<Notification[]> {
  return firestoreOperation(
    async () => {
      const snap = await getDocs(collection(db, COLLECTIONS.notifications))
      if (snap.empty) return [] // Return empty - don't auto-fill with defaults
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification))
    },
    () => [] // No local fallback - if Firestore fails, show nothing
  )
}

/**
 * Save (overwrite) the notifications collection.
 * Uses a batch to clear existing docs and write new ones.
 */
export async function saveNotifications(
  data: Notification[]
): Promise<void> {
  if (!useFirestore) {
    saveLocalNotifications(data)
    return
  }
  try {
    const batch = writeBatch(db)
    // Delete existing
    const existing = await getDocs(collection(db, COLLECTIONS.notifications))
    existing.docs.forEach((d) => batch.delete(d.ref))
    // Add new
    for (const item of data) {
      const docRef = doc(collection(db, COLLECTIONS.notifications))
      batch.set(docRef, { ...item, id: docRef.id })
    }
    await batch.commit()
    // Also persist locally for offline access
    saveLocalNotifications(data)
  } catch (error) {
    console.error('[Firestore] saveNotifications error, saving locally:', error)
    saveLocalNotifications(data)
  }
}

// ============================================================
// Analytics
// ============================================================

/**
 * Get dashboard statistics: totalUsers, totalTests, totalResults, avgScore, recentActivity.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Total users
    const usersSnap = await getDocs(collection(db, COLLECTIONS.users))
    const totalUsers = usersSnap.size

    // Total tests + exams
    const testsSnap = await getDocs(collection(db, COLLECTIONS.tests))
    const totalTests = testsSnap.size
    const examsSnap = await getDocs(collection(db, COLLECTIONS.exams))
    const totalExams = examsSnap.size

    // Total results + avg score + recent activity
    const resultsSnap = await getDocs(
      query(collection(db, COLLECTIONS.results), orderBy('createdAt', 'desc'), limit(100))
    )
    const totalResults = resultsSnap.size
    let totalScore = 0
    const recentActivity: FirestoreTestResult[] = []

    resultsSnap.docs.forEach((d) => {
      const r = d.data() as FirestoreTestResult
      totalScore += r.score
      if (recentActivity.length < 10) {
        recentActivity.push({
          ...r,
          id: d.id,
          createdAt:
            r.createdAt instanceof Timestamp
              ? r.createdAt.toDate().toISOString()
              : String(r.createdAt),
        })
      }
    })

    const avgScore = totalResults > 0 ? Math.round(totalScore / totalResults) : 0

    return { totalUsers, totalTests, totalExams, totalResults, avgScore, recentActivity }
  } catch (error) {
    console.error('[Firestore] getDashboardStats error, returning defaults:', error)
    return {
      totalUsers: 0,
      totalTests: ALL_TESTS.length,
      totalExams: 0,
      totalResults: 0,
      avgScore: 0,
      recentActivity: [],
    }
  }
}

/**
 * Get daily stats breakdown for the last N days.
 * Groups results by date and computes daily averages.
 */
export async function getDailyStats(days: number = 7): Promise<DailyStats[]> {
  try {
    const now = new Date()
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    const resultsSnap = await getDocs(
      query(
        collection(db, COLLECTIONS.results),
        orderBy('createdAt', 'desc'),
        limit(500)
      )
    )

    // Group by date
    const dailyMap: Record<
      string,
      { results: number; totalScore: number; users: Set<string> }
    > = {}

    // Initialize all days with zero
    for (let i = 0; i < days; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().split('T')[0]
      dailyMap[key] = { results: 0, totalScore: 0, users: new Set() }
    }

    resultsSnap.docs.forEach((d) => {
      const r = d.data() as FirestoreTestResult
      const dateStr =
        r.createdAt instanceof Timestamp
          ? r.createdAt.toDate().toISOString().split('T')[0]
          : String(r.createdAt).split('T')[0]

      if (dailyMap[dateStr]) {
        dailyMap[dateStr].results++
        dailyMap[dateStr].totalScore += r.score
        dailyMap[dateStr].users.add(r.userId)
      }
    })

    return Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        results: stats.results,
        avgScore: stats.results > 0 ? Math.round(stats.totalScore / stats.results) : 0,
        uniqueUsers: stats.users.size,
      }))
  } catch (error) {
    console.error('[Firestore] getDailyStats error:', error)
    // Return empty daily stats
    const stats: DailyStats[] = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      stats.push({
        date: d.toISOString().split('T')[0],
        results: 0,
        avgScore: 0,
        uniqueUsers: 0,
      })
    }
    return stats
  }
}

// ============================================================
// Initialization / Seeding Helpers
// ============================================================

/**
 * Seed Firestore from local-data.ts if the collections are empty.
 * Useful for initial setup.
 */
export async function seedFirestoreIfEmpty(): Promise<boolean> {
  // Always seed local first
  localSeedData()
  
  if (!db || !isFirebaseReady()) {
    console.log('[Firestore] Firebase not configured, local data seeded')
    return true
  }
  try {
    const catSnap = await getDocs(collection(db, COLLECTIONS.categories))
    if (catSnap.size > 0) return false // Already seeded in Firestore

    const batch = writeBatch(db)
    const localCategories = getLocalCategories()

    for (const cat of localCategories) {
      // Add category document
      const catRef = doc(collection(db, COLLECTIONS.categories))
      batch.set(catRef, {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
        order: cat.order,
      })

      // Add exam documents for this category
      for (const exam of cat.exams) {
        const examRef = doc(collection(db, COLLECTIONS.exams))
        batch.set(examRef, {
          name: exam.name,
          slug: exam.slug,
          description: exam.description,
          totalQuestions: exam.totalQuestions,
          duration: exam.duration,
          markingScheme: exam.markingScheme,
          order: exam.order,
          testCount: exam.testCount,
          categoryId: catRef.id,
        })
      }
    }

    // Add all tests
    for (const test of ALL_TESTS) {
      const testRef = doc(collection(db, COLLECTIONS.tests))
      batch.set(testRef, {
        title: test.title,
        slug: test.slug,
        description: test.description,
        totalQuestions: test.totalQuestions,
        duration: test.duration,
        markingCorrect: test.markingCorrect,
        markingWrong: test.markingWrong,
        markingSkipped: test.markingSkipped,
        difficulty: test.difficulty,
        isFree: test.isFree,
        isLive: test.isLive,
        examId: test.exam.id,
        examName: test.exam.name,
        examSlug: test.exam.slug,
      })

      // Add questions for this test
      for (const q of test.questions) {
        const qRef = doc(collection(db, COLLECTIONS.questions))
        batch.set(qRef, {
          questionText: q.questionText,
          questionImage: q.questionImage,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          subject: q.subject,
          order: q.order,
          testId: testRef.id,
        })
      }
    }

    // Seed default announcements
    for (const ann of DEFAULT_ANNOUNCEMENTS) {
      const annRef = doc(collection(db, COLLECTIONS.announcements))
      batch.set(annRef, { ...ann, id: annRef.id })
    }

    // Seed default notifications
    for (const notif of DEFAULT_NOTIFICATIONS) {
      const notifRef = doc(collection(db, COLLECTIONS.notifications))
      batch.set(notifRef, { ...notif, id: notifRef.id })
    }

    // Seed default upcoming exams
    for (const exam of DEFAULT_UPCOMING_EXAMS) {
      const examRef = doc(collection(db, COLLECTIONS.upcoming_exams))
      batch.set(examRef, { ...exam, id: examRef.id })
    }

    // Seed default daily tips
    for (const tip of DEFAULT_DAILY_TIPS) {
      const tipRef = doc(collection(db, COLLECTIONS.daily_tips))
      batch.set(tipRef, { ...tip, id: tipRef.id })
    }

    // Seed default previous year papers
    for (const paper of DEFAULT_PREV_YEAR_PAPERS) {
      const paperRef = doc(collection(db, COLLECTIONS.prev_year_papers))
      batch.set(paperRef, { ...paper, id: paperRef.id })
    }

    // Seed default sidebar menu
    for (const item of DEFAULT_SIDEBAR_MENU) {
      const menuRef = doc(collection(db, COLLECTIONS.sidebar_menu))
      batch.set(menuRef, { ...item, id: menuRef.id })
    }

    await batch.commit()
    console.log('[Firestore] Database seeded successfully')
    return true
  } catch (error) {
    console.error('[Firestore] Seed error:', error)
    return false
  }
}

// ============================================================
// Diagnostic: Test Firestore write permission
// ============================================================

export async function testFirestoreWritePermission(): Promise<{ ok: boolean; error?: string; details?: string }> {
  if (!db || !isFirebaseReady()) {
    return { ok: false, error: 'Firebase not configured', details: 'Add Firebase config to .env.local' }
  }
  try {
    const currentUser = auth?.currentUser
    if (!currentUser) {
      return { ok: false, error: 'Not logged in', details: 'You must be logged in as admin to write to Firestore' }
    }

    // Check user role
    const userData = await getUser(currentUser.uid)
    if (!userData) {
      return { ok: false, error: 'User document not found', details: `No Firestore document found for UID: ${currentUser.uid}. Your account exists in Firebase Auth but has no profile in the users collection. Go to Firebase Console → Firestore Database → users collection → create a document with your UID and set role to "admin".` }
    }
    if (userData.role !== 'admin') {
      return { ok: false, error: 'Not admin', details: `Your role is "${userData.role}". You need role "admin" to write data. Go to Firebase Console → Firestore Database → users collection → find your UID document → set role field to "admin".` }
    }

    // Test 1: Single document write to categories collection
    const testRef = doc(collection(db, COLLECTIONS.categories))
    await setDoc(testRef, { _test: true, _timestamp: new Date().toISOString() })
    await deleteDoc(testRef)

    // Test 2: Batch write (this is what seed uses)
    const batch = writeBatch(db)
    const batchTestRef1 = doc(collection(db, COLLECTIONS.categories))
    const batchTestRef2 = doc(collection(db, COLLECTIONS.exams))
    batch.set(batchTestRef1, { _test: true, _batchTest: true, _timestamp: new Date().toISOString() })
    batch.set(batchTestRef2, { _test: true, _batchTest: true, _timestamp: new Date().toISOString() })
    await batch.commit()
    // Clean up batch test
    const deleteBatch = writeBatch(db)
    deleteBatch.delete(batchTestRef1)
    deleteBatch.delete(batchTestRef2)
    await deleteBatch.commit()

    // Test 3: Try writing to ALL collections that seed will write to
    const testCollections = ['categories', 'exams', 'tests', 'questions', 'announcements', 'notifications', 'upcoming_exams', 'daily_tips', 'prev_year_papers', 'sidebar_menu']
    const testDocs: any[] = []
    for (const colName of testCollections) {
      try {
        const ref = doc(collection(db, colName))
        await setDoc(ref, { _test: true, _timestamp: new Date().toISOString() })
        testDocs.push(ref)
      } catch (colErr: any) {
        // Clean up any test docs we created
        for (const d of testDocs) { try { await deleteDoc(d) } catch {} }
        return { ok: false, error: `Cannot write to "${colName}": ${colErr?.message || colErr}`, details: 'Firestore rules are blocking writes to this collection. You MUST update Firestore rules in Firebase Console. Go to Firebase Console → Firestore Database → Rules tab and publish rules that allow admin writes.' }
      }
    }
    // Clean up all test docs
    for (const d of testDocs) { try { await deleteDoc(d) } catch {} }

    return { ok: true }
  } catch (e: any) {
    const msg = e?.message || String(e)
    let hint = ''
    if (msg.includes('permission') || msg.includes('PERMISSION_DENIED') || msg.includes('denied')) {
      hint = 'Firestore security rules are blocking writes. Go to Firebase Console → Firestore Database → Rules tab. Make sure rules allow admin users to write. Your current rules may not have the isAdmin() function or the rules may not be published yet.'
    } else if (msg.includes('network') || msg.includes('unavailable')) {
      hint = 'Network error. Check your internet connection.'
    } else if (msg.includes('not-found')) {
      hint = 'Firestore database may not exist yet. Create it in Firebase Console.'
    }
    return { ok: false, error: msg, details: hint || 'Unknown error. Check browser console for more details.' }
  }
}

// ============================================================
// Force Seed — ALWAYS seeds, even if data exists (deletes old first)
// ============================================================

/**
 * Helper: Write documents individually as a fallback when batch writes fail.
 * Each document write is attempted separately so one failure doesn't block others.
 */
async function writeDocsIndividually(docs: { ref: any; data: any }[], stepName: string): Promise<{ written: number; failed: number; errors: string[] }> {
  let written = 0
  let failed = 0
  const errors: string[] = []
  
  for (const { ref, data } of docs) {
    try {
      await setDoc(ref, data)
      written++
    } catch (e: any) {
      failed++
      const msg = e?.message || String(e)
      if (errors.length < 3) errors.push(msg) // Keep first 3 errors only
    }
  }
  
  console.log(`[Firestore] ${stepName}: ${written} written, ${failed} failed`)
  return { written, failed, errors }
}

/**
 * Helper: Commit a batch, with fallback to individual writes if batch fails.
 * This handles the case where Firestore rules reject batch operations
 * but might allow individual document writes.
 */
async function commitBatchWithFallback(batch: WriteBatch, stepName: string, pendingDocs?: { ref: any; data: any }[]): Promise<void> {
  try {
    await batch.commit()
  } catch (batchErr: any) {
    console.warn(`[Firestore] Batch commit failed for "${stepName}":`, batchErr?.message)
    if (pendingDocs && pendingDocs.length > 0) {
      console.log(`[Firestore] Falling back to individual writes for ${pendingDocs.length} docs...`)
      const result = await writeDocsIndividually(pendingDocs, stepName)
      if (result.failed > 0) {
        throw new Error(`Batch failed and ${result.failed}/${pendingDocs.length} individual writes also failed: ${result.errors.join('; ')}`)
      }
    } else {
      throw batchErr
    }
  }
}

export async function forceSeedFirestore(): Promise<{ success: boolean; error?: string; step?: string }> {
  if (!db || !isFirebaseReady()) {
    console.error('[Firestore] Cannot seed: Firebase is not configured.')
    return { success: false, error: 'Firebase is not configured', step: 'init' }
  }
  try {
    // Declare batch, opCount, and refs at the top level so all sections can use them
    let batch = writeBatch(db)
    let opCount = 0
    const catRefs: Record<string, string> = {}
    const examRefs: Record<string, string> = {}

    // First, check if user has admin role - this validates Firestore rules are working
    const currentUser = auth?.currentUser
    if (currentUser) {
      const userData = await getUser(currentUser.uid)
      if (!userData || userData.role !== 'admin') {
        console.error('[Firestore] Seed failed: Current user is not admin. Role:', userData?.role || 'no role')
        throw new Error('You must be an admin to seed the database. Your role: ' + (userData?.role || 'not set'))
      }
      console.log('[Firestore] Admin verified, starting seed...')
    }

    console.log('[Firestore] Force seeding — clearing all collections first...')

    // Delete existing data in batches (500 max per batch)
    // CRITICAL: Skip 'users' and 'results' collections to preserve admin role and user data
    // Deleting users would break isAdmin() check in Firestore rules!
    const protectedCollections = ['users', 'results']
    const collectionNames = Object.values(COLLECTIONS).filter(c => !protectedCollections.includes(c))
    
    // Save current admin user data before clearing
    const adminUid = auth?.currentUser?.uid
    let adminUserData: any = null
    if (adminUid) {
      try {
        const adminDoc = await getDoc(doc(db, COLLECTIONS.users, adminUid))
        if (adminDoc.exists()) {
          adminUserData = { id: adminDoc.id, ...adminDoc.data() }
          console.log('[Firestore] Saved admin user data before clearing:', adminUid)
        }
      } catch (e) {
        console.warn('[Firestore] Could not read admin user data:', e)
      }
    }

    for (const colName of collectionNames) {
      try {
        const snap = await getDocs(collection(db, colName))
        if (snap.size > 0) {
          for (let i = 0; i < snap.docs.length; i += 500) {
            const batch = writeBatch(db)
            snap.docs.slice(i, i + 500).forEach(d => batch.delete(d.ref))
            await batch.commit()
          }
          console.log(`[Firestore] Cleared ${snap.size} docs from ${colName}`)
        }
      } catch (delErr: any) {
        console.warn(`[Firestore] Could not clear ${colName}:`, delErr?.message || delErr)
        // Continue even if delete fails (e.g., collection doesn't exist yet)
      }
    }
    console.log('[Firestore] All content collections cleared (users & results preserved).')

    // ---- Categories + Exams ----
    try {
    const catData = [
      { name: 'SSC', slug: 'ssc', icon: 'book', description: 'Staff Selection Commission exams including CGL, CHSL, MTS, and more', order: 1 },
      { name: 'Banking', slug: 'banking', icon: 'building', description: 'IBPS, SBI, RBI and other banking sector exams', order: 2 },
      { name: 'Railways', slug: 'railways', icon: 'train', description: 'RRB NTPC, Group D, ALP and railway recruitment exams', order: 3 },
      { name: 'Defence', slug: 'defence', icon: 'shield', description: 'CDS, NDA, AFCAT and other defence exams', order: 4 },
      { name: 'Teaching', slug: 'teaching', icon: 'graduation', description: 'CTET, KVS, NVS and other teaching exams', order: 5 },
      { name: 'Police', slug: 'police', icon: 'shield-check', description: 'State police, CAPF and law enforcement exams', order: 6 },
    ]

    const examDataByCategory: Record<string, { name: string; slug: string; description: string; order: number }[]> = {
      ssc: [
        { name: 'SSC CGL', slug: 'ssc-cgl', description: 'Combined Graduate Level Examination', order: 1 },
        { name: 'SSC CHSL', slug: 'ssc-chsl', description: 'Combined Higher Secondary Level Exam', order: 2 },
        { name: 'SSC MTS', slug: 'ssc-mts', description: 'Multi-Tasking Staff Examination', order: 3 },
      ],
      banking: [
        { name: 'IBPS PO', slug: 'ibps-po', description: 'Institute of Banking Personnel Selection - Probationary Officer', order: 1 },
        { name: 'SBI Clerk', slug: 'sbi-clerk', description: 'State Bank of India Clerk Examination', order: 2 },
        { name: 'RBI Assistant', slug: 'rbi-assistant', description: 'Reserve Bank of India Assistant Exam', order: 3 },
      ],
      railways: [
        { name: 'RRB NTPC', slug: 'rrb-ntpc', description: 'Non-Technical Popular Categories Exam', order: 1 },
        { name: 'RRB Group D', slug: 'rrb-group-d', description: 'Railway Group D Recruitment Exam', order: 2 },
      ],
      defence: [
        { name: 'CDS', slug: 'cds', description: 'Combined Defence Services Examination', order: 1 },
        { name: 'NDA', slug: 'nda', description: 'National Defence Academy Examination', order: 2 },
      ],
      teaching: [
        { name: 'CTET', slug: 'ctet', description: 'Central Teacher Eligibility Test', order: 1 },
        { name: 'KVS', slug: 'kvs', description: 'Kendriya Vidyalaya Sangathan Exam', order: 2 },
      ],
      police: [
        { name: 'Delhi Police', slug: 'delhi-police', description: 'Delhi Police Constable & Head Constable Exam', order: 1 },
        { name: 'CAPF', slug: 'capf', description: 'Central Armed Police Forces Exam', order: 2 },
      ],
    }

    // Seed categories and exams in batches
    batch = writeBatch(db)
    opCount = 0

    for (const cat of catData) {
      const catRef = doc(collection(db, COLLECTIONS.categories))
      catRefs[cat.slug] = catRef.id
      batch.set(catRef, { name: cat.name, slug: cat.slug, icon: cat.icon, description: cat.description, order: cat.order })
      opCount++

      const exams = examDataByCategory[cat.slug] || []
      for (const exam of exams) {
        const examRef = doc(collection(db, COLLECTIONS.exams))
        examRefs[exam.slug] = examRef.id
        batch.set(examRef, {
          name: exam.name, slug: exam.slug, description: exam.description,
          totalQuestions: 100, duration: 60, markingScheme: '1 mark each, -0.25 negative',
          order: exam.order, testCount: 2, categoryId: catRef.id,
        })
        opCount++
      }

      if (opCount >= 450) {
        await batch.commit()
        batch = writeBatch(db)
        opCount = 0
      }
    }
    if (opCount > 0) await batch.commit()
    console.log('[Firestore] Categories + Exams seeded.')
    } catch (catErr: any) {
      console.error('[Firestore] Failed to seed Categories + Exams:', catErr?.message)
      throw new Error('Failed to write categories/exams: ' + (catErr?.message || catErr))
    }

    // ---- Tests + Questions ----
    try {
    const testData: { title: string; examSlug: string; difficulty: string; questions: { q: string; a: string; b: string; c: string; d: string; ans: string; exp: string; sub: string }[] }[] = [
      {
        title: 'SSC CGL Tier-I Mock Test 1 (General Awareness)',
        examSlug: 'ssc-cgl',
        difficulty: 'Medium',
        questions: [
          { q: 'Who is known as the "Father of the Indian Constitution"?', a: 'Mahatma Gandhi', b: 'Jawaharlal Nehru', c: 'Dr. B.R. Ambedkar', d: 'Sardar Patel', ans: 'C', exp: 'Dr. B.R. Ambedkar was the chairman of the Drafting Committee and is considered the Father of the Indian Constitution.', sub: 'General Knowledge' },
          { q: 'Which planet is known as the "Red Planet"?', a: 'Venus', b: 'Mars', c: 'Jupiter', d: 'Saturn', ans: 'B', exp: 'Mars is called the Red Planet due to the iron oxide (rust) on its surface which gives it a reddish appearance.', sub: 'General Science' },
          { q: 'The currency of Japan is:', a: 'Yuan', b: 'Won', c: 'Yen', d: 'Ringgit', ans: 'C', exp: 'The Japanese Yen is the official currency of Japan, symbolized by ¥.', sub: 'General Knowledge' },
          { q: 'Which vitamin is produced by the human body when exposed to sunlight?', a: 'Vitamin A', b: 'Vitamin B', c: 'Vitamin C', d: 'Vitamin D', ans: 'D', exp: 'When skin is exposed to ultraviolet B (UVB) rays from sunlight, it triggers Vitamin D synthesis in the body.', sub: 'General Science' },
          { q: 'The headquarters of the United Nations is located in:', a: 'Geneva', b: 'Paris', c: 'New York', d: 'London', ans: 'C', exp: 'The United Nations Headquarters is located in New York City, USA, along the East River.', sub: 'General Knowledge' },
          { q: 'Which Indian state has the largest area?', a: 'Madhya Pradesh', b: 'Maharashtra', c: 'Rajasthan', d: 'Uttar Pradesh', ans: 'C', exp: 'Rajasthan is the largest state in India by area, covering about 342,239 sq km.', sub: 'Geography' },
          { q: 'The "Quit India Movement" was launched in which year?', a: '1940', b: '1942', c: '1944', d: '1946', ans: 'B', exp: 'The Quit India Movement was launched by Mahatma Gandhi on 8 August 1942 at the Bombay session of AICC.', sub: 'History' },
          { q: 'Which gas is most abundant in Earth\'s atmosphere?', a: 'Oxygen', b: 'Carbon Dioxide', c: 'Nitrogen', d: 'Hydrogen', ans: 'C', exp: 'Nitrogen makes up approximately 78% of Earth\'s atmosphere by volume.', sub: 'General Science' },
          { q: 'The Tropic of Cancer passes through how many Indian states?', a: '6', b: '7', c: '8', d: '9', ans: 'C', exp: 'The Tropic of Cancer passes through 8 Indian states: Gujarat, Rajasthan, MP, Chhattisgarh, Jharkhand, WB, Tripura, and Mizoram.', sub: 'Geography' },
          { q: 'Who wrote the Indian national anthem "Jana Gana Mana"?', a: 'Bankim Chandra Chatterjee', b: 'Rabindranath Tagore', c: 'Sarojini Naidu', d: 'Subhash Chandra Bose', ans: 'B', exp: 'Rabindranath Tagore wrote "Jana Gana Mana" which was adopted as India\'s national anthem on January 24, 1950.', sub: 'General Knowledge' },
        ]
      },
      {
        title: 'SSC CGL Tier-I Mock Test 2 (Quantitative Aptitude)',
        examSlug: 'ssc-cgl',
        difficulty: 'Hard',
        questions: [
          { q: 'If the selling price of an article is Rs. 240 and the profit is 20%, what is the cost price?', a: 'Rs. 180', b: 'Rs. 200', c: 'Rs. 220', d: 'Rs. 192', ans: 'B', exp: 'CP = SP × 100/(100+profit%) = 240 × 100/120 = Rs. 200', sub: 'Mathematics' },
          { q: 'A train 150m long crosses a platform 250m long in 20 seconds. The speed of the train is:', a: '72 km/h', b: '54 km/h', c: '36 km/h', d: '90 km/h', ans: 'A', exp: 'Total distance = 150+250 = 400m, Time = 20s. Speed = 400/20 = 20 m/s = 20×18/5 = 72 km/h', sub: 'Mathematics' },
          { q: 'What is the LCM of 12, 18, and 24?', a: '36', b: '48', c: '72', d: '144', ans: 'C', exp: '12=2²×3, 18=2×3², 24=2³×3. LCM = 2³×3² = 8×9 = 72', sub: 'Mathematics' },
          { q: 'If x + y = 7 and xy = 12, then x² + y² = ?', a: '25', b: '37', c: '49', d: '23', ans: 'A', exp: 'x² + y² = (x+y)² - 2xy = 49 - 24 = 25', sub: 'Mathematics' },
          { q: 'A can do a work in 15 days and B can do it in 10 days. Together they will complete the work in:', a: '5 days', b: '6 days', c: '8 days', d: '12 days', ans: 'B', exp: 'A\'s 1 day work = 1/15, B\'s 1 day work = 1/10. Together = 1/15 + 1/10 = 1/6. So 6 days.', sub: 'Mathematics' },
          { q: 'The average of first 50 natural numbers is:', a: '25', b: '25.5', c: '26', d: '26.5', ans: 'B', exp: 'Sum = 50×51/2 = 1275. Average = 1275/50 = 25.5', sub: 'Mathematics' },
          { q: 'A sum of money doubles itself in 10 years at simple interest. The rate of interest is:', a: '5%', b: '10%', c: '15%', d: '20%', ans: 'B', exp: 'If money doubles, Interest = Principal. So P×R×10/100 = P → R = 10%', sub: 'Mathematics' },
          { q: 'The ratio of the ages of A and B is 3:5. After 6 years, the ratio becomes 2:3. The present age of A is:', a: '18 years', b: '24 years', c: '30 years', d: '36 years', ans: 'A', exp: 'Let ages be 3x and 5x. After 6 years: (3x+6)/(5x+6) = 2/3 → 9x+18 = 10x+12 → x = 6. A = 18 years.', sub: 'Mathematics' },
          { q: 'The perimeter of a rectangle is 40 cm and its length is 12 cm. The area of the rectangle is:', a: '96 cm²', b: '84 cm²', c: '108 cm²', d: '72 cm²', ans: 'A', exp: '2(l+b) = 40 → b = 20-12 = 8 cm. Area = 12×8 = 96 cm².', sub: 'Mathematics' },
          { q: 'If 30% of a number is 75, what is 120% of that number?', a: '250', b: '300', c: '225', d: '280', ans: 'B', exp: '30% of x = 75 → x = 250. 120% of 250 = 300.', sub: 'Mathematics' },
        ]
      },
      {
        title: 'IBPS PO Prelims Mock Test 1 (Reasoning)',
        examSlug: 'ibps-po',
        difficulty: 'Hard',
        questions: [
          { q: 'In a row of 40 students, Ravi is 7th from the left and Sumit is 15th from the right. How many students are between them?', a: '18', b: '19', c: '20', d: '17', ans: 'A', exp: 'Total = 40. Ravi = 7th from left, Sumit = 40-15+1 = 26th from left. Between them = 26-7-1 = 18.', sub: 'Reasoning' },
          { q: 'If APPLE is coded as ELPPA, then ORANGE is coded as:', a: 'EGNARO', b: 'ORANGE', c: 'EGANRO', d: 'ORAGNE', ans: 'A', exp: 'The code reverses the letters. ORANGE reversed is EGNARO.', sub: 'Reasoning' },
          { q: 'Pointing to a man, a woman said, "His mother is the only daughter of my mother." How is the woman related to the man?', a: 'Mother', b: 'Sister', c: 'Grandmother', d: 'Daughter', ans: 'A', exp: 'The only daughter of my mother is the woman herself. So the man\'s mother is the woman. She is his mother.', sub: 'Reasoning' },
          { q: 'Complete the series: 2, 6, 12, 20, 30, ?', a: '40', b: '42', c: '44', d: '36', ans: 'B', exp: 'Differences: 4, 6, 8, 10, 12. Next = 30+12 = 42.', sub: 'Reasoning' },
          { q: 'If South-East becomes North, then what does North-West become?', a: 'South', b: 'North-East', c: 'East', d: 'South-West', ans: 'B', exp: 'SE→N is a 135° clockwise rotation. Applying same to NW: NW rotated 135° clockwise = NE.', sub: 'Reasoning' },
          { q: 'In a class, A ranks 12th from the top and B ranks 18th from the bottom. If they interchange their positions, B becomes 25th from the bottom. How many students are in the class?', a: '36', b: '37', c: '35', d: '38', ans: 'A', exp: 'After interchange, B is 25th from bottom and was originally 18th from bottom. So A\'s original position from top = total - 25 + 1 = total - 24. Given A was 12th, total = 12 + 24 = 36.', sub: 'Reasoning' },
          { q: 'Which of the following does not belong to the group?', a: 'Rose', b: 'Lotus', c: 'Tulip', d: 'Carrot', ans: 'D', exp: 'Rose, Lotus, and Tulip are flowers while Carrot is a vegetable/root.', sub: 'Reasoning' },
          { q: 'If A+B means A is the father of B, A-B means A is the wife of B, then what does P+Q-R mean?', a: 'P is the father of R', b: 'P is the grandfather of R', c: 'R is the wife of P\'s son', d: 'Cannot be determined', ans: 'C', exp: 'P+Q means P is father of Q. Q-R means Q is wife of R. So R is wife of P\'s son Q.', sub: 'Reasoning' },
          { q: 'How many triangles are there in a pentagon?', a: '3', b: '5', c: '8', d: '10', ans: 'D', exp: 'A pentagon has 5 vertices. Number of triangles = C(5,3) = 10.', sub: 'Reasoning' },
          { q: 'If EARTH is coded as HDUWA, then MOON is coded as:', a: 'PLLQ', b: 'PRRQ', c: 'QNNL', d: 'NQQO', ans: 'B', exp: 'Each letter is shifted by +3: E→H, A→D, R→U, T→W, H→A(k). Similarly M→P, O→R, O→R, N→Q = PRRQ.', sub: 'Reasoning' },
        ]
      },
      {
        title: 'IBPS PO Prelims Mock Test 2 (English Language)',
        examSlug: 'ibps-po',
        difficulty: 'Medium',
        questions: [
          { q: 'Choose the correct synonym of "ABUNDANT":', a: 'Scarce', b: 'Plentiful', c: 'Insufficient', d: 'Limited', ans: 'B', exp: 'Abundant means existing in large quantities; plentiful.', sub: 'English' },
          { q: 'Choose the correct antonym of "BENEVOLENT":', a: 'Kind', b: 'Generous', c: 'Malevolent', d: 'Charitable', ans: 'C', exp: 'Benevolent means well-meaning and kindly. Its antonym is malevolent (having evil intent).', sub: 'English' },
          { q: 'Fill in the blank: She was ___ by the beauty of the sunset.', a: 'captivated', b: 'capturing', c: 'capture', d: 'captures', ans: 'A', exp: 'The correct past participle "captivated" fits grammatically: "was captivated by".', sub: 'English' },
          { q: 'Identify the error: "Each of the boys have completed their assignment."', a: 'Each', b: 'have', c: 'completed', d: 'their', ans: 'B', exp: '"Each" is singular, so the verb should be "has" not "have". Correct: "Each of the boys has completed..."', sub: 'English' },
          { q: 'Choose the correctly spelt word:', a: 'Accomodate', b: 'Accommodate', c: 'Acommodate', d: 'Acomodate', ans: 'B', exp: 'The correct spelling is "Accommodate" — double c and double m.', sub: 'English' },
          { q: 'What does the idiom "Break the ice" mean?', a: 'Destroy something', b: 'Start a conversation', c: 'Cause damage', d: 'Feel cold', ans: 'B', exp: '"Break the ice" means to initiate conversation in an awkward social situation.', sub: 'English' },
          { q: 'Choose the correct preposition: He is addicted ___ coffee.', a: 'with', b: 'for', c: 'to', d: 'by', ans: 'C', exp: 'The correct phrase is "addicted to" — addiction always takes the preposition "to".', sub: 'English' },
          { q: 'Rearrange: "the / quickly / ran / boy / field / across / the"', a: 'The boy ran quickly across the field', b: 'The quickly boy ran across the field', c: 'The boy across ran quickly the field', d: 'Quickly the boy ran the field across', ans: 'A', exp: 'The correct sentence structure is: Subject (The boy) + Verb (ran) + Adverb (quickly) + Preposition (across) + Object (the field).', sub: 'English' },
          { q: 'Choose the passive voice of: "She writes a letter."', a: 'A letter is written by her.', b: 'A letter was written by her.', c: 'A letter has been written by her.', d: 'A letter will be written by her.', ans: 'A', exp: 'Present simple active "writes" becomes present simple passive "is written".', sub: 'English' },
          { q: 'The word "AMBIGUOUS" means:', a: 'Clear', b: 'Uncertain', c: 'Definite', d: 'Obvious', ans: 'B', exp: 'Ambiguous means open to more than one interpretation; uncertain or unclear.', sub: 'English' },
        ]
      },
      {
        title: 'RRB NTPC Mock Test 1 (General Science)',
        examSlug: 'rrb-ntpc',
        difficulty: 'Easy',
        questions: [
          { q: 'What is the chemical formula of water?', a: 'H2O2', b: 'HO2', c: 'H2O', d: 'OH2', ans: 'C', exp: 'Water consists of two hydrogen atoms and one oxygen atom, hence H2O.', sub: 'Chemistry' },
          { q: 'Which organ in the human body purifies blood?', a: 'Heart', b: 'Liver', c: 'Kidney', d: 'Lungs', ans: 'C', exp: 'Kidneys filter waste products and excess fluid from the blood, effectively purifying it.', sub: 'Biology' },
          { q: 'The SI unit of electric current is:', a: 'Volt', b: 'Watt', c: 'Ohm', d: 'Ampere', ans: 'D', exp: 'The SI unit of electric current is Ampere (A), named after André-Marie Ampère.', sub: 'Physics' },
          { q: 'Photosynthesis takes place in which part of the plant?', a: 'Root', b: 'Stem', c: 'Leaf', d: 'Flower', ans: 'C', exp: 'Photosynthesis occurs primarily in leaves which contain chlorophyll in chloroplasts.', sub: 'Biology' },
          { q: 'Which gas is released during photosynthesis?', a: 'Carbon Dioxide', b: 'Oxygen', c: 'Nitrogen', d: 'Hydrogen', ans: 'B', exp: 'During photosynthesis, plants absorb CO2 and release O2 as a byproduct.', sub: 'Biology' },
          { q: 'The pH value of pure water is:', a: '0', b: '7', c: '14', d: '1', ans: 'B', exp: 'Pure water is neutral with a pH of 7, neither acidic nor basic.', sub: 'Chemistry' },
          { q: 'Which planet is closest to the Sun?', a: 'Venus', b: 'Earth', c: 'Mercury', d: 'Mars', ans: 'C', exp: 'Mercury is the closest planet to the Sun at an average distance of about 58 million km.', sub: 'Physics' },
          { q: 'What is the hardest naturally occurring substance?', a: 'Gold', b: 'Iron', c: 'Diamond', d: 'Platinum', ans: 'C', exp: 'Diamond rates 10 on the Mohs hardness scale, making it the hardest natural substance.', sub: 'Chemistry' },
          { q: 'Sound travels fastest through which medium?', a: 'Air', b: 'Water', c: 'Steel', d: 'Vacuum', ans: 'C', exp: 'Sound travels fastest through solids like steel (~5960 m/s) because molecules are closely packed.', sub: 'Physics' },
          { q: 'The powerhouse of the cell is called:', a: 'Nucleus', b: 'Ribosome', c: 'Mitochondria', d: 'Golgi Body', ans: 'C', exp: 'Mitochondria produce ATP (energy) through cellular respiration, hence called the powerhouse of the cell.', sub: 'Biology' },
        ]
      },
      {
        title: 'RRB Group D Mock Test 1 (Mathematics)',
        examSlug: 'rrb-group-d',
        difficulty: 'Easy',
        questions: [
          { q: 'What is 25% of 400?', a: '50', b: '100', c: '150', d: '200', ans: 'B', exp: '25% of 400 = 400 × 25/100 = 100', sub: 'Mathematics' },
          { q: 'What is the square root of 144?', a: '10', b: '11', c: '12', d: '13', ans: 'C', exp: '12 × 12 = 144, so √144 = 12.', sub: 'Mathematics' },
          { q: 'If a dozen eggs cost Rs. 60, what is the cost of 5 eggs?', a: 'Rs. 20', b: 'Rs. 25', c: 'Rs. 30', d: 'Rs. 35', ans: 'B', exp: '1 dozen = 12 eggs. Cost per egg = 60/12 = Rs. 5. Cost of 5 eggs = 5×5 = Rs. 25.', sub: 'Mathematics' },
          { q: 'What is the next prime number after 7?', a: '8', b: '9', c: '10', d: '11', ans: 'D', exp: '8=2×4, 9=3×3, 10=2×5 — not prime. 11 is only divisible by 1 and itself, hence prime.', sub: 'Mathematics' },
          { q: 'Simplify: 15 + 6 × 3 - 4 ÷ 2', a: '31', b: '25', c: '29', d: '27', ans: 'A', exp: 'By BODMAS: 4÷2=2, then 6×3=18, then 15+18-2 = 31.', sub: 'Mathematics' },
          { q: 'A shopkeeper gives a discount of 10% on an item marked at Rs. 500. What is the selling price?', a: 'Rs. 400', b: 'Rs. 450', c: 'Rs. 460', d: 'Rs. 490', ans: 'B', exp: 'Discount = 10% of 500 = Rs. 50. Selling price = 500 - 50 = Rs. 450.', sub: 'Mathematics' },
          { q: 'How many sides does a hexagon have?', a: '5', b: '6', c: '7', d: '8', ans: 'B', exp: 'A hexagon has 6 sides. "Hexa" means six in Greek.', sub: 'Mathematics' },
          { q: 'If 3x = 27, then x = ?', a: '3', b: '6', c: '9', d: '81', ans: 'C', exp: '3x = 27 → x = 27/3 = 9.', sub: 'Mathematics' },
          { q: 'The fraction 3/5 as a percentage is:', a: '30%', b: '50%', c: '60%', d: '75%', ans: 'C', exp: '3/5 × 100 = 60%.', sub: 'Mathematics' },
          { q: 'What is the area of a triangle with base 10 cm and height 6 cm?', a: '60 cm²', b: '30 cm²', c: '16 cm²', d: '36 cm²', ans: 'B', exp: 'Area of triangle = ½ × base × height = ½ × 10 × 6 = 30 cm².', sub: 'Mathematics' },
        ]
      },
      {
        title: 'CDS Mock Test 1 (General Knowledge)',
        examSlug: 'cds',
        difficulty: 'Hard',
        questions: [
          { q: 'The Battle of Plassey was fought in which year?', a: '1757', b: '1764', c: '1857', d: '1947', ans: 'A', exp: 'The Battle of Plassey was fought on 23 June 1757 between the British East India Company and the Nawab of Bengal.', sub: 'History' },
          { q: 'Which article of the Indian Constitution deals with the Right to Equality?', a: 'Article 12', b: 'Article 14', c: 'Article 19', d: 'Article 21', ans: 'B', exp: 'Article 14 guarantees equality before law and equal protection of laws within the territory of India.', sub: 'Polity' },
          { q: 'The Gulf of Mannar is located between India and:', a: 'Sri Lanka', b: 'Bangladesh', c: 'Myanmar', d: 'Maldives', ans: 'A', exp: 'The Gulf of Mannar lies between the southeastern tip of India and the west coast of Sri Lanka.', sub: 'Geography' },
          { q: 'Who was the first Indian to win the Nobel Prize?', a: 'C.V. Raman', b: 'Rabindranath Tagore', c: 'Hargobind Khorana', d: 'Amartya Sen', ans: 'B', exp: 'Rabindranath Tagore won the Nobel Prize in Literature in 1913, the first Indian to receive this honor.', sub: 'General Knowledge' },
          { q: 'The Panchayati Raj system was introduced by which Constitutional Amendment?', a: '42nd', b: '44th', c: '73rd', d: '74th', ans: 'C', exp: 'The 73rd Constitutional Amendment Act of 1992 gave constitutional status to Panchayati Raj institutions.', sub: 'Polity' },
          { q: 'Which Indian river is known as the "Sorrow of Bengal"?', a: 'Ganga', b: 'Yamuna', c: 'Damodar', d: 'Mahanadi', ans: 'C', exp: 'The Damodar River was known as the "Sorrow of Bengal" due to its devastating floods before the DVC project.', sub: 'Geography' },
          { q: 'The Simla Conference of 1945 was held to discuss:', a: 'Indian independence', b: 'Wavell Plan', c: 'Cabinet Mission', d: 'Mountbatten Plan', ans: 'B', exp: 'The Simla Conference (June-July 1945) was convened by Viceroy Wavell to discuss the Wavell Plan for Indian self-governance.', sub: 'History' },
          { q: 'Rashtrapati Bhavan was designed by:', a: 'Le Corbusier', b: 'Edwin Lutyens', c: 'Herbert Baker', d: 'Robert Tor Russell', ans: 'B', exp: 'Edwin Lutyens designed Rashtrapati Bhavan (then Viceroy\'s House) as part of New Delhi\'s plan.', sub: 'General Knowledge' },
          { q: 'The first satellite launched by India was:', a: 'Bhaskara', b: 'Aryabhata', c: 'INSAT-1A', d: 'Rohini', ans: 'B', exp: 'Aryabhata was India\'s first satellite, launched on 19 April 1975 by the Soviet Union.', sub: 'General Knowledge' },
          { q: 'The fundamental duties were added to the Constitution by which Amendment?', a: '42nd', b: '44th', c: '46th', d: '52nd', ans: 'A', exp: 'The 42nd Amendment Act, 1976 added Fundamental Duties (Article 51A) based on the Swaran Singh Committee recommendation.', sub: 'Polity' },
        ]
      },
      {
        title: 'NDA Mock Test 1 (Mathematics)',
        examSlug: 'nda',
        difficulty: 'Hard',
        questions: [
          { q: 'If sin θ = 3/5, what is the value of cos θ?', a: '4/5', b: '3/5', c: '5/3', d: '5/4', ans: 'A', exp: 'sin²θ + cos²θ = 1 → cos²θ = 1 - 9/25 = 16/25 → cos θ = 4/5 (taking positive value for acute angle).', sub: 'Mathematics' },
          { q: 'The derivative of x³ + 2x² - 5x + 7 is:', a: '3x² + 4x - 5', b: '3x² + 2x - 5', c: 'x³ + 4x - 5', d: '3x² + 4x + 5', ans: 'A', exp: 'd/dx(x³) = 3x², d/dx(2x²) = 4x, d/dx(-5x) = -5, d/dx(7) = 0. So derivative = 3x² + 4x - 5.', sub: 'Mathematics' },
          { q: 'The value of log₁₀ 1000 is:', a: '1', b: '2', c: '3', d: '4', ans: 'C', exp: 'log₁₀ 1000 = log₁₀ 10³ = 3 × log₁₀ 10 = 3 × 1 = 3.', sub: 'Mathematics' },
          { q: 'If a matrix A is 3×2 and matrix B is 2×4, then the order of AB is:', a: '3×4', b: '2×2', c: '4×3', d: '2×4', ans: 'A', exp: 'If A is m×n and B is n×p, then AB is m×p. Here 3×2 and 2×4 gives 3×4.', sub: 'Mathematics' },
          { q: 'The integral of sin(x) dx is:', a: '-cos(x) + C', b: 'cos(x) + C', c: '-sin(x) + C', d: 'sin(x) + C', ans: 'A', exp: '∫sin(x) dx = -cos(x) + C. The derivative of -cos(x) is sin(x).', sub: 'Mathematics' },
          { q: 'In how many ways can 5 people be seated in a row?', a: '25', b: '60', c: '120', d: '720', ans: 'C', exp: 'Number of arrangements = 5! = 5×4×3×2×1 = 120.', sub: 'Mathematics' },
          { q: 'What is the value of C(10,2)?', a: '20', b: '45', c: '90', d: '55', ans: 'B', exp: 'C(10,2) = 10!/(2!×8!) = (10×9)/(2×1) = 45.', sub: 'Mathematics' },
          { q: 'The distance between points (1,2) and (4,6) is:', a: '3', b: '4', c: '5', d: '7', ans: 'C', exp: 'd = √((4-1)² + (6-2)²) = √(9+16) = √25 = 5.', sub: 'Mathematics' },
          { q: 'If f(x) = 2x - 3, then f⁻¹(x) = ?', a: '(x+3)/2', b: '(x-3)/2', c: '2x+3', d: '(x+2)/3', ans: 'A', exp: 'Let y = 2x-3, then x = (y+3)/2. So f⁻¹(x) = (x+3)/2.', sub: 'Mathematics' },
          { q: 'The sum of an arithmetic series with first term 2, last term 20, and 10 terms is:', a: '100', b: '110', c: '120', d: '220', ans: 'B', exp: 'S = n(a+l)/2 = 10(2+20)/2 = 10×11 = 110.', sub: 'Mathematics' },
        ]
      },
      {
        title: 'CTET Mock Test 1 (Child Development)',
        examSlug: 'ctet',
        difficulty: 'Medium',
        questions: [
          { q: 'Who proposed the theory of "Multiple Intelligences"?', a: 'Jean Piaget', b: 'Howard Gardner', c: 'Lev Vygotsky', d: 'B.F. Skinner', ans: 'B', exp: 'Howard Gardner proposed the theory of Multiple Intelligences in 1983, identifying 8 distinct types of intelligence.', sub: 'Child Development' },
          { q: 'The Zone of Proximal Development (ZPD) was introduced by:', a: 'Piaget', b: 'Bruner', c: 'Vygotsky', d: 'Erikson', ans: 'C', exp: 'Lev Vygotsky introduced ZPD — the gap between what a learner can do independently and what they can do with guidance.', sub: 'Child Development' },
          { q: 'Which stage of Piaget\'s development is characterized by object permanence?', a: 'Sensorimotor', b: 'Preoperational', c: 'Concrete Operational', d: 'Formal Operational', ans: 'A', exp: 'The Sensorimotor stage (0-2 years) is when infants develop object permanence — understanding objects exist even when unseen.', sub: 'Child Development' },
          { q: 'Constructivist approach to learning was primarily proposed by:', a: 'Skinner', b: 'Pavlov', c: 'Piaget and Vygotsky', d: 'Thorndike', ans: 'C', exp: 'Both Piaget and Vygotsky are considered founders of constructivism — the idea that learners actively construct knowledge.', sub: 'Child Development' },
          { q: 'Inclusive education means:', a: 'Separate schools for disabled children', b: 'Education for all children together regardless of ability', c: 'Only gifted children in one class', d: 'Online education only', ans: 'B', exp: 'Inclusive education means all students, regardless of ability, learn together in the same classroom with appropriate support.', sub: 'Pedagogy' },
          { q: 'Which type of assessment is conducted during the learning process?', a: 'Summative', b: 'Formative', c: 'Diagnostic', d: 'Achievement', ans: 'B', exp: 'Formative assessment occurs during learning to provide feedback and adjust teaching, unlike summative which is at the end.', sub: 'Pedagogy' },
          { q: 'Kohlberg\'s theory is related to:', a: 'Cognitive development', b: 'Moral development', c: 'Language development', d: 'Social development', ans: 'B', exp: 'Lawrence Kohlberg developed the theory of moral development with 3 levels: pre-conventional, conventional, and post-conventional.', sub: 'Child Development' },
          { q: 'The concept of "scaffolding" in education was introduced by:', a: 'Piaget', b: 'Bruner', c: 'Vygotsky', d: 'Dewey', ans: 'C', exp: 'While Vygotsky introduced ZPD, the term "scaffolding" was coined by Wood, Bruner & Ross (1976) based on Vygotsky\'s work.', sub: 'Pedagogy' },
          { q: 'A child who can conserve quantity but not volume is likely in which Piagetian stage?', a: 'Sensorimotor', b: 'Preoperational', c: 'Concrete Operational', d: 'Formal Operational', ans: 'C', exp: 'Concrete operational children (7-11 yrs) can conserve quantity but may still struggle with volume conservation.', sub: 'Child Development' },
          { q: 'Bloom\'s Taxonomy of educational objectives has how many domains?', a: '2', b: '3', c: '4', d: '5', ans: 'B', exp: 'Bloom\'s Taxonomy has 3 domains: Cognitive (knowledge), Affective (attitudes), and Psychomotor (skills).', sub: 'Pedagogy' },
        ]
      },
      {
        title: 'Delhi Police Constable Mock Test 1',
        examSlug: 'delhi-police',
        difficulty: 'Easy',
        questions: [
          { q: 'The national flag of India was adopted on:', a: '15 August 1947', b: '26 January 1950', c: '22 July 1947', d: '2 October 1947', ans: 'C', exp: 'The Indian national flag was adopted by the Constituent Assembly on 22 July 1947.', sub: 'General Knowledge' },
          { q: 'Which article of the Indian Constitution guarantees the Right to Life?', a: 'Article 14', b: 'Article 19', c: 'Article 21', d: 'Article 32', ans: 'C', exp: 'Article 21 guarantees "No person shall be deprived of his life or personal liberty except according to procedure established by law."', sub: 'General Knowledge' },
          { q: 'Delhi Police comes under which ministry?', a: 'Ministry of Defence', b: 'Ministry of Home Affairs', c: 'Ministry of Law', d: 'Ministry of External Affairs', ans: 'B', exp: 'Delhi Police functions under the Ministry of Home Affairs, Government of India.', sub: 'General Knowledge' },
          { q: 'The full form of FIR is:', a: 'First Information Report', b: 'First Investigation Report', c: 'Final Information Report', d: 'First Incident Report', ans: 'A', exp: 'FIR stands for First Information Report — a document prepared by police when they receive information about a cognizable offense.', sub: 'General Knowledge' },
          { q: 'Which is the largest bone in the human body?', a: 'Humerus', b: 'Femur', c: 'Tibia', d: 'Fibula', ans: 'B', exp: 'The femur (thigh bone) is the longest and strongest bone in the human body.', sub: 'General Science' },
          { q: 'IPC stands for:', a: 'Indian Penal Code', b: 'Indian Police Code', c: 'Indian Public Court', d: 'Indian Protection Code', ans: 'A', exp: 'IPC stands for Indian Penal Code, which defines criminal offenses and their punishments in India.', sub: 'General Knowledge' },
          { q: 'How many Union Territories are there in India (as of 2024)?', a: '7', b: '8', c: '9', d: '6', ans: 'B', exp: 'India has 8 Union Territories: J&K, Ladakh, Chandigarh, Delhi, Puducherry, DNH&DD, Lakshadweep, Andaman & Nicobar.', sub: 'General Knowledge' },
          { q: 'The speed of light is approximately:', a: '3 × 10⁶ m/s', b: '3 × 10⁸ m/s', c: '3 × 10¹⁰ m/s', d: '3 × 10⁴ m/s', ans: 'B', exp: 'The speed of light in vacuum is approximately 3 × 10⁸ m/s (299,792,458 m/s precisely).', sub: 'General Science' },
          { q: 'Who is the head of Delhi Police?', a: 'IG', b: 'DG', c: 'Commissioner', d: 'SP', ans: 'C', exp: 'Delhi Police is headed by the Commissioner of Police, who holds the rank of DG (Director General).', sub: 'General Knowledge' },
          { q: 'The Red Fort is located in which city?', a: 'Agra', b: 'Delhi', c: 'Jaipur', d: 'Lucknow', ans: 'B', exp: 'The Red Fort (Lal Qila) is a historic fort in Old Delhi, built by Mughal Emperor Shah Jahan in 1648.', sub: 'General Knowledge' },
        ]
      },
    ]

    // Seed tests and questions
    batch = writeBatch(db)
    opCount = 0

    for (const test of testData) {
      const examId = examRefs[test.examSlug]
      if (!examId) continue

      const testRef = doc(collection(db, COLLECTIONS.tests))
      batch.set(testRef, {
        title: test.title,
        slug: test.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, ''),
        description: test.title + ' — practice and improve your score!',
        totalQuestions: test.questions.length,
        duration: 30,
        markingCorrect: 1,
        markingWrong: -0.25,
        markingSkipped: 0,
        difficulty: test.difficulty,
        isFree: true,
        isLive: true,
        examId: examId,
        examName: test.examSlug.replace(/-/g, ' ').toUpperCase(),
        examSlug: test.examSlug,
      })
      opCount++

      for (let i = 0; i < test.questions.length; i++) {
        const q = test.questions[i]
        const qRef = doc(collection(db, COLLECTIONS.questions))
        batch.set(qRef, {
          questionText: q.q,
          optionA: q.a,
          optionB: q.b,
          optionC: q.c,
          optionD: q.d,
          correctAnswer: q.ans,
          explanation: q.exp,
          subject: q.sub,
          order: i + 1,
          testId: testRef.id,
        })
        opCount++

        if (opCount >= 450) {
          await batch.commit()
          batch = writeBatch(db)
          opCount = 0
        }
      }
    }
    if (opCount > 0) await batch.commit()
    console.log('[Firestore] Tests + Questions seeded.')
    } catch (testErr: any) {
      console.error('[Firestore] Failed to seed Tests + Questions:', testErr?.message)
      throw new Error('Failed to write tests/questions: ' + (testErr?.message || testErr))
    }

    // ---- Announcements ----
    try {
    batch = writeBatch(db)
    const annData = [
      { image: 'ssc', title: 'SSC CGL 2025', subtitle: 'New Mock Tests Added!', action: 'exams', gradient: 'from-orange-500 to-red-500' },
      { image: 'banking', title: 'Banking PO', subtitle: 'MEGA Test Series Live!', action: 'exams', gradient: 'from-blue-500 to-indigo-500' },
      { image: 'leaderboard', title: 'Weekly Winners', subtitle: 'Get Special Badges!', action: 'leaderboard', gradient: 'from-emerald-500 to-teal-500' },
      { image: 'practice', title: 'Practice Mode', subtitle: 'Topic-wise Practice LIVE!', action: 'practice', gradient: 'from-purple-500 to-pink-500' },
    ]
    for (const ann of annData) {
      const ref = doc(collection(db, COLLECTIONS.announcements))
      batch.set(ref, { ...ann, id: ref.id })
    }

    // ---- Notifications ----
    const notifData = [
      { title: 'Welcome to MockMaster!', message: 'Start your exam preparation journey today. Explore all available tests and practice mock exams.', time: 'Just now', read: false, type: 'info' },
      { title: 'New SSC CGL Test Available', message: 'A new mock test for SSC CGL 2025 has been added. Try it now!', time: '2h ago', read: false, type: 'update' },
      { title: 'Weekly Maintenance Notice', message: 'App maintenance scheduled this Sunday 2AM-4AM.', time: '1d ago', read: true, type: 'alert' },
    ]
    for (const n of notifData) {
      const ref = doc(collection(db, COLLECTIONS.notifications))
      batch.set(ref, { ...n, id: ref.id })
    }

    // ---- Upcoming Exams ----
    const upcomingData = [
      {
        name: 'SSC CGL 2025 Tier-I', date: 'Jul 2025', status: 'Registration Open', statusType: 'open',
        description: 'Staff Selection Commission - Combined Graduate Level Examination 2025 for Group B & C posts in Government of India.',
        conductingBody: 'SSC (Staff Selection Commission)', eligibility: "Bachelor's degree from a recognized university",
        examDate: 'Jul-Aug 2025 (Tentative)', applicationDeadline: '30 Jun 2025', applicationLink: 'https://ssc.nic.in',
        examMode: 'Online (CBT)', totalPosts: '15,000+ vacancies', salary: 'Rs. 25,500 - 81,100 (Level 4-7)',
        examPattern: '100 questions, 60 min, +2 marks, -0.5 negative marking',
        importantDates: 'Reg Start: 1 May 2025\nReg End: 30 Jun 2025\nTier-I Exam: Jul-Aug 2025\nTier-II Exam: Oct 2025',
        officialWebsite: 'https://ssc.nic.in',
      },
      {
        name: 'IBPS PO 2025 Prelims', date: 'Aug 2025', status: 'Coming Soon', statusType: 'coming',
        description: 'Institute of Banking Personnel Selection - Probationary Officer exam for recruitment in public sector banks.',
        conductingBody: 'IBPS (Institute of Banking Personnel Selection)', eligibility: 'Graduate in any discipline from a recognized university',
        examDate: 'Aug-Sep 2025 (Tentative)', applicationDeadline: 'To be announced', applicationLink: 'https://ibps.in',
        examMode: 'Online (CBT)', totalPosts: '4,000+ vacancies', salary: 'Rs. 36,000 - 63,840 (Basic + DA + HRA)',
        examPattern: 'Prelims: 100 Qs, 60 min | Mains: 155 Qs, 180 min',
        importantDates: 'Notification: Jun 2025\nReg Start: To be announced\nPrelims: Aug 2025\nMains: Nov 2025',
        officialWebsite: 'https://ibps.in',
      },
      {
        name: 'RRB NTPC CBT-2', date: 'Sep 2025', status: 'Admit Card Soon', statusType: 'admit',
        description: 'Railway Recruitment Board - Non-Technical Popular Categories CBT-2 for graduate & undergraduate posts in Indian Railways.',
        conductingBody: 'RRB (Railway Recruitment Board)', eligibility: '12th pass or Graduate (varies by post)',
        examDate: 'Sep 2025', applicationDeadline: 'Application closed', applicationLink: 'https://rrbcdg.gov.in',
        examMode: 'Online (CBT)', totalPosts: '35,000+ vacancies', salary: 'Rs. 19,900 - 63,200 (Level 2-5)',
        examPattern: '120 questions, 90 min, +1 mark, -0.33 negative marking',
        importantDates: 'CBT-1 Completed\nCBT-2: Sep 2025\nSkill Test: Nov 2025\nFinal Result: Jan 2026',
        officialWebsite: 'https://rrbcdg.gov.in',
      },
      {
        name: 'CTET July 2025', date: 'Jul 2025', status: 'Registration Open', statusType: 'open',
        description: 'Central Teacher Eligibility Test conducted by CBSE for recruitment of teachers in central government schools (KVS, NVS, etc.).',
        conductingBody: 'CBSE (Central Board of Secondary Education)', eligibility: "Senior Secondary (or its equivalent) with at least 50% marks or Bachelor's degree (varies by level)",
        examDate: 'Jul 2025 (Tentative)', applicationDeadline: 'To be announced', applicationLink: 'https://ctet.nic.in',
        examMode: 'Offline (OMR)', totalPosts: 'Eligibility Certificate (no direct vacancy)', salary: 'Teacher Pay Scale: Rs. 35,400 - 1,12,400 (Level 6)',
        examPattern: 'Paper-I: 150 Qs, 150 min | Paper-II: 150 Qs, 150 min, +1 mark, no negative marking',
        importantDates: 'Notification: May 2025\nReg Start: To be announced\nReg End: To be announced\nExam: Jul 2025',
        officialWebsite: 'https://ctet.nic.in',
      },
      {
        name: 'CDS II 2025', date: 'Sep 2025', status: 'Coming Soon', statusType: 'coming',
        description: 'Combined Defence Services Examination II 2025 for recruitment into Indian Military Academy, Naval Academy, Air Force Academy and Officers Training Academy.',
        conductingBody: 'UPSC (Union Public Service Commission)', eligibility: 'Graduate from a recognized university (varies by academy)',
        examDate: 'Sep 2025 (Tentative)', applicationDeadline: 'To be announced', applicationLink: 'https://upsc.gov.in',
        examMode: 'Offline (OMR)', totalPosts: 'Approx. 450+ vacancies', salary: 'Rs. 56,100 - 1,77,500 (Lieutenant Level 10)',
        examPattern: 'IMA/INA/AFA: 300 marks, 3 papers | OTA: 200 marks, 2 papers, objective type',
        importantDates: 'Notification: May 2025\nReg Start: To be announced\nReg End: Jun 2025\nExam: Sep 2025\nSSB Interview: Nov-Dec 2025',
        officialWebsite: 'https://upsc.gov.in',
      },
      {
        name: 'Delhi Police Constable 2025', date: 'Nov 2025', status: 'Notification Soon', statusType: 'coming',
        description: 'Delhi Police Constable Recruitment 2025 for Male and Female candidates in Delhi Police under SSC.',
        conductingBody: 'SSC (Staff Selection Commission)', eligibility: '12th pass from a recognized board + valid driving license (for male)',
        examDate: 'Nov-Dec 2025 (Tentative)', applicationDeadline: 'To be announced', applicationLink: 'https://ssc.nic.in',
        examMode: 'Online (CBT)', totalPosts: '7,000+ vacancies', salary: 'Rs. 21,700 - 69,100 (Level 3)',
        examPattern: '100 questions, 90 min, +1 mark, -0.25 negative marking (Reasoning, GK, Maths, English)',
        importantDates: 'Notification: Aug 2025\nReg Start: To be announced\nReg End: To be announced\nCBT: Nov-Dec 2025\nPE&MT: Jan 2026',
        officialWebsite: 'https://ssc.nic.in',
      },
    ]
    for (const e of upcomingData) {
      const ref = doc(collection(db, COLLECTIONS.upcoming_exams))
      batch.set(ref, { ...e, id: ref.id })
    }

    // ---- Daily Tips ----
    const tipsData = [
      { text: 'Solve at least 50 questions daily from different topics. Consistency beats intensity in exam preparation!' },
      { text: 'Review your mistakes regularly. Understanding why you got something wrong is more valuable than getting it right.' },
      { text: 'Practice time management. Set a timer for each mock test to simulate real exam conditions.' },
      { text: 'Focus on weak areas first. Spend 70% of your study time on topics you find difficult.' },
      { text: 'Take short breaks every 45 minutes. Your brain consolidates information during rest periods.' },
      { text: 'Read the question carefully before answering. Most mistakes happen due to misreading, not lack of knowledge.' },
      { text: 'Attempt previous year papers. They give you the best idea of the exam pattern and difficulty level.' },
    ]
    for (const t of tipsData) {
      const ref = doc(collection(db, COLLECTIONS.daily_tips))
      batch.set(ref, { ...t, id: ref.id })
    }

    // ---- Previous Year Papers ----
    const papersData = [
      { year: '2025', name: 'SSC CGL Tier-I 2025', examCategory: 'ssc', testId: '', totalQuestions: 100, duration: 60, difficulty: 'Medium', questions: [] },
      { year: '2025', name: 'IBPS PO Prelims 2025', examCategory: 'banking', testId: '', totalQuestions: 100, duration: 60, difficulty: 'Hard', questions: [] },
      { year: '2024', name: 'SSC CGL Tier-I 2024', examCategory: 'ssc', testId: '', totalQuestions: 100, duration: 60, difficulty: 'Easy', questions: [] },
      { year: '2024', name: 'IBPS PO Prelims 2024', examCategory: 'banking', testId: '', totalQuestions: 100, duration: 60, difficulty: 'Medium', questions: [] },
      { year: '2024', name: 'RRB NTPC CBT-2 2024', examCategory: 'railways', testId: '', totalQuestions: 120, duration: 90, difficulty: 'Medium', questions: [] },
      { year: '2023', name: 'CTET Paper-I 2023', examCategory: 'teaching', testId: '', totalQuestions: 150, duration: 150, difficulty: 'Medium', questions: [] },
      { year: '2023', name: 'CDS II 2023', examCategory: 'defence', testId: '', totalQuestions: 120, duration: 120, difficulty: 'Hard', questions: [] },
    ]
    for (const p of papersData) {
      const ref = doc(collection(db, COLLECTIONS.prev_year_papers))
      batch.set(ref, { ...p, id: ref.id })
    }

    // ---- Sidebar Menu ----
    const sidebarData = [
      { icon: 'Home', label: 'Home', page: 'home', gradient: 'from-orange-500 to-amber-500', visible: true, order: 1 },
      { icon: 'BookOpen', label: 'All Exams', page: 'exams', gradient: 'from-blue-500 to-indigo-500', visible: true, order: 2 },
      { icon: 'Trophy', label: 'Leaderboard', page: 'leaderboard', gradient: 'from-yellow-500 to-orange-500', visible: true, order: 3 },
      { icon: 'Zap', label: 'Quick Practice', page: 'practice', gradient: 'from-amber-400 to-orange-500', visible: true, order: 4 },
      { icon: 'BookmarkPlus', label: 'Bookmarks', page: 'bookmarks', gradient: 'from-rose-400 to-pink-500', visible: true, order: 5 },
      { icon: 'BarChart3', label: 'Performance', page: 'perf-report', gradient: 'from-emerald-400 to-teal-500', visible: true, order: 6 },
      { icon: 'FileText', label: 'Prev. Papers', page: 'prev-papers', gradient: 'from-blue-400 to-cyan-500', visible: true, order: 7 },
      { icon: 'Target', label: 'Your Exam', page: 'your-exam', gradient: 'from-violet-400 to-purple-500', visible: true, order: 8 },
      { icon: 'Clock', label: 'Daily Routine', page: 'daily-routine', gradient: 'from-sky-400 to-blue-500', visible: true, order: 9 },
    ]
    for (const s of sidebarData) {
      const ref = doc(collection(db, COLLECTIONS.sidebar_menu))
      batch.set(ref, { ...s, id: ref.id })
    }

    await batch.commit()
    console.log('[Firestore] Announcements, Notifications, Upcoming Exams, Tips, Papers, Sidebar seeded.')
    } catch (annErr: any) {
      console.error('[Firestore] Failed to seed announcements/notifications/etc:', annErr?.message)
      throw new Error('Failed to write announcements/notifications: ' + (annErr?.message || annErr))
    }

    // Mark all collections as initialized
    if (typeof window !== 'undefined') {
      try {
        const STORAGE_KEYS_LOCAL = {
          fsInitialized: 'examprep_firestore_initialized',
        }
        const allCols = Object.values(COLLECTIONS)
        const initialized: Record<string, boolean> = {}
        allCols.forEach(c => initialized[c] = true)
        localStorage.setItem(STORAGE_KEYS_LOCAL.fsInitialized, JSON.stringify(initialized))
      } catch {}
    }

    // Safety: Ensure admin user document still exists after seeding
    if (adminUid) {
      try {
        const adminDoc = await getDoc(doc(db, COLLECTIONS.users, adminUid))
        if (!adminDoc.exists() && adminUserData) {
          // Admin document was somehow deleted — recreate it
          await setDoc(doc(db, COLLECTIONS.users, adminUid), adminUserData)
          console.log('[Firestore] Restored admin user document after seed')
        } else if (adminDoc.exists()) {
          // Ensure role is still admin
          const data = adminDoc.data()
          if (data.role !== 'admin') {
            await setDoc(doc(db, COLLECTIONS.users, adminUid), { role: 'admin' }, { merge: true })
            console.log('[Firestore] Ensured admin role after seed')
          }
        }
      } catch (e) {
        console.warn('[Firestore] Could not verify admin user after seed:', e)
      }
    }

    console.log('[Firestore] Force seed completed successfully!')
    return { success: true }
  } catch (error: any) {
    console.error('[Firestore] Force seed error:', error)
    const msg = error?.message || String(error)
    // Determine which step failed based on the error message
    let step = 'unknown'
    if (msg.includes('categories/exams')) step = 'categories-exams'
    else if (msg.includes('tests/questions')) step = 'tests-questions'
    else if (msg.includes('announcements/notifications')) step = 'announcements'
    else if (msg.includes('admin')) step = 'admin-check'
    else if (msg.includes('clear')) step = 'clear-collections'
    return { success: false, error: msg, step }
  }
}

// ============================================================
// Upcoming Exam CRUD
// ============================================================

/**
 * Get all upcoming exams from Firestore (with localStorage fallback).
 */
export async function getUpcomingExams(): Promise<UpcomingExam[]> {
  return firestoreOperation(
    async () => {
      const snap = await getDocs(collection(db, COLLECTIONS.upcoming_exams))
      if (snap.empty) return []
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UpcomingExam))
    },
    () => [] // No local fallback - if Firestore fails, show nothing
  )
}

/**
 * Save (overwrite) the upcoming exams collection.
 * Uses a batch to clear existing docs and write new ones.
 */
export async function saveUpcomingExams(
  data: UpcomingExam[]
): Promise<void> {
  if (!useFirestore) {
    saveLocalUpcomingExams(data)
    return
  }
  try {
    const batch = writeBatch(db)
    // Delete existing
    const existing = await getDocs(collection(db, COLLECTIONS.upcoming_exams))
    existing.docs.forEach((d) => batch.delete(d.ref))
    // Add new
    for (const item of data) {
      const docRef = doc(collection(db, COLLECTIONS.upcoming_exams))
      batch.set(docRef, { ...item, id: docRef.id })
    }
    await batch.commit()
    // Also persist locally for offline access
    saveLocalUpcomingExams(data)
  } catch (error) {
    console.error('[Firestore] saveUpcomingExams error, saving locally:', error)
    saveLocalUpcomingExams(data)
  }
}

// ============================================================
// Daily Tips CRUD
// ============================================================

/**
 * Get all daily tips from Firestore (with localStorage fallback).
 */
export async function getDailyTips(): Promise<DailyTip[]> {
  return firestoreOperation(
    async () => {
      const snap = await getDocs(collection(db, COLLECTIONS.daily_tips))
      if (snap.empty) return []
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DailyTip))
    },
    () => [] // No local fallback - if Firestore fails, show nothing
  )
}

/**
 * Save (overwrite) the daily tips collection.
 * Uses a batch to clear existing docs and write new ones.
 */
export async function saveDailyTips(
  data: DailyTip[]
): Promise<void> {
  if (!useFirestore) {
    saveLocalDailyTips(data)
    return
  }
  try {
    const batch = writeBatch(db)
    // Delete existing
    const existing = await getDocs(collection(db, COLLECTIONS.daily_tips))
    existing.docs.forEach((d) => batch.delete(d.ref))
    // Add new
    for (const item of data) {
      const docRef = doc(collection(db, COLLECTIONS.daily_tips))
      batch.set(docRef, { ...item, id: docRef.id })
    }
    await batch.commit()
    // Also persist locally for offline access
    saveLocalDailyTips(data)
  } catch (error) {
    console.error('[Firestore] saveDailyTips error, saving locally:', error)
    saveLocalDailyTips(data)
  }
}

// ============================================================
// Previous Year Papers CRUD
// ============================================================

/**
 * Get all previous year papers from Firestore (with localStorage fallback).
 */
export async function getPrevYearPapers(): Promise<PrevYearPaper[]> {
  return firestoreOperation(
    async () => {
      const snap = await getDocs(collection(db, COLLECTIONS.prev_year_papers))
      if (snap.empty) return []
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PrevYearPaper))
    },
    () => [] // No local fallback - if Firestore fails, show nothing
  )
}

/**
 * Save (overwrite) the previous year papers collection.
 */
export async function savePrevYearPapers(
  data: PrevYearPaper[]
): Promise<void> {
  if (!useFirestore) {
    saveLocalPrevYearPapers(data)
    return
  }
  try {
    const batch = writeBatch(db)
    const existing = await getDocs(collection(db, COLLECTIONS.prev_year_papers))
    existing.docs.forEach((d) => batch.delete(d.ref))
    for (const item of data) {
      const docRef = doc(collection(db, COLLECTIONS.prev_year_papers))
      batch.set(docRef, { ...item, id: docRef.id })
    }
    await batch.commit()
    saveLocalPrevYearPapers(data)
  } catch (error) {
    console.error('[Firestore] savePrevYearPapers error, saving locally:', error)
    saveLocalPrevYearPapers(data)
  }
}

// ============================================================
// Sidebar Menu CRUD
// ============================================================

/**
 * Get all sidebar menu items from Firestore (with localStorage fallback).
 */
export async function getSidebarMenu(): Promise<SidebarMenuItem[]> {
  return firestoreOperation(
    async () => {
      const snap = await getDocs(collection(db, COLLECTIONS.sidebar_menu))
      if (snap.empty) return []
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SidebarMenuItem))
    },
    () => [] // No local fallback - if Firestore fails, show nothing
  )
}

/**
 * Save (overwrite) the sidebar menu items collection.
 */
export async function saveSidebarMenu(
  data: SidebarMenuItem[]
): Promise<void> {
  if (!useFirestore) {
    saveLocalSidebarMenu(data)
    return
  }
  try {
    const batch = writeBatch(db)
    const existing = await getDocs(collection(db, COLLECTIONS.sidebar_menu))
    existing.docs.forEach((d) => batch.delete(d.ref))
    for (const item of data) {
      const docRef = doc(collection(db, COLLECTIONS.sidebar_menu))
      batch.set(docRef, { ...item, id: docRef.id })
    }
    await batch.commit()
    saveLocalSidebarMenu(data)
  } catch (error) {
    console.error('[Firestore] saveSidebarMenu error, saving locally:', error)
    saveLocalSidebarMenu(data)
  }
}

// ============================================================
// Real-Time Listeners (onSnapshot)
// These subscribe to Firestore collections and call the callback
// whenever data changes — providing instant updates to users.
// ============================================================

/**
 * Subscribe to categories collection changes in real-time.
 * Returns an unsubscribe function.
 */
export function onCategoriesChange(
  callback: (cats: LocalExamCategory[]) => void
): Unsubscribe | null {
  if (!useFirestore || !isFirebaseReady()) return null
  try {
    return onSnapshot(collection(db, COLLECTIONS.categories), (snap) => {
      if (snap.empty) return
      const cats = snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreExamCategory))
      // Merge with exams from local or Firestore
      const exams = lsGetExamsFromLocal()
      const merged: LocalExamCategory[] = cats.map(c => ({
        ...c,
        exams: exams.filter(e => e.categoryId === c.id)
      }))
      callback(merged)
    }, (err) => {
      console.warn('[Firestore] onCategoriesChange error:', err)
    })
  } catch (e) {
    console.warn('[Firestore] onCategoriesChange setup failed:', e)
    return null
  }
}

/**
 * Subscribe to announcements collection changes in real-time.
 */
export function onAnnouncementsChange(
  callback: (data: Announcement[]) => void
): Unsubscribe | null {
  if (!useFirestore || !isFirebaseReady()) return null
  try {
    return onSnapshot(collection(db, COLLECTIONS.announcements), (snap) => {
      const data = snap.empty ? [] : snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement))
      callback(data)
      // Also persist locally for offline
      if (data.length > 0) saveLocalAnnouncements(data)
    }, (err) => {
      console.warn('[Firestore] onAnnouncementsChange error:', err)
    })
  } catch (e) {
    console.warn('[Firestore] onAnnouncementsChange setup failed:', e)
    return null
  }
}

/**
 * Subscribe to notifications collection changes in real-time.
 */
export function onNotificationsChange(
  callback: (data: Notification[]) => void
): Unsubscribe | null {
  if (!useFirestore || !isFirebaseReady()) return null
  try {
    return onSnapshot(collection(db, COLLECTIONS.notifications), (snap) => {
      const data = snap.empty ? [] : snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification))
      callback(data)
      if (data.length > 0) saveLocalNotifications(data)
    }, (err) => {
      console.warn('[Firestore] onNotificationsChange error:', err)
    })
  } catch (e) {
    console.warn('[Firestore] onNotificationsChange setup failed:', e)
    return null
  }
}

/**
 * Subscribe to upcoming exams collection changes in real-time.
 */
export function onUpcomingExamsChange(
  callback: (data: UpcomingExam[]) => void
): Unsubscribe | null {
  if (!useFirestore || !isFirebaseReady()) return null
  try {
    return onSnapshot(collection(db, COLLECTIONS.upcoming_exams), (snap) => {
      const data = snap.empty ? [] : snap.docs.map(d => ({ id: d.id, ...d.data() } as UpcomingExam))
      callback(data)
      if (data.length > 0) saveLocalUpcomingExams(data)
    }, (err) => {
      console.warn('[Firestore] onUpcomingExamsChange error:', err)
    })
  } catch (e) {
    console.warn('[Firestore] onUpcomingExamsChange setup failed:', e)
    return null
  }
}

/**
 * Subscribe to daily tips collection changes in real-time.
 */
export function onDailyTipsChange(
  callback: (data: DailyTip[]) => void
): Unsubscribe | null {
  if (!useFirestore || !isFirebaseReady()) return null
  try {
    return onSnapshot(collection(db, COLLECTIONS.daily_tips), (snap) => {
      const data = snap.empty ? [] : snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyTip))
      callback(data)
      if (data.length > 0) saveLocalDailyTips(data)
    }, (err) => {
      console.warn('[Firestore] onDailyTipsChange error:', err)
    })
  } catch (e) {
    console.warn('[Firestore] onDailyTipsChange setup failed:', e)
    return null
  }
}

/**
 * Subscribe to prev year papers collection changes in real-time.
 */
export function onPrevYearPapersChange(
  callback: (data: PrevYearPaper[]) => void
): Unsubscribe | null {
  if (!useFirestore || !isFirebaseReady()) return null
  try {
    return onSnapshot(collection(db, COLLECTIONS.prev_year_papers), (snap) => {
      const data = snap.empty ? [] : snap.docs.map(d => ({ id: d.id, ...d.data() } as PrevYearPaper))
      callback(data)
      if (data.length > 0) saveLocalPrevYearPapers(data)
    }, (err) => {
      console.warn('[Firestore] onPrevYearPapersChange error:', err)
    })
  } catch (e) {
    console.warn('[Firestore] onPrevYearPapersChange setup failed:', e)
    return null
  }
}

/**
 * Subscribe to sidebar menu collection changes in real-time.
 */
export function onSidebarMenuChange(
  callback: (data: SidebarMenuItem[]) => void
): Unsubscribe | null {
  if (!useFirestore || !isFirebaseReady()) return null
  try {
    return onSnapshot(collection(db, COLLECTIONS.sidebar_menu), (snap) => {
      const data = snap.empty ? [] : snap.docs.map(d => ({ id: d.id, ...d.data() } as SidebarMenuItem))
      callback(data)
      if (data.length > 0) saveLocalSidebarMenu(data)
    }, (err) => {
      console.warn('[Firestore] onSidebarMenuChange error:', err)
    })
  } catch (e) {
    console.warn('[Firestore] onSidebarMenuChange setup failed:', e)
    return null
  }
}

/** Helper: read exams from localStorage (used by onCategoriesChange) */
function lsGetExamsFromLocal(): LocalExam[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('examprep_local_exams')
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

/**
 * Subscribe to ALL real-time listeners at once.
 * Returns a single unsubscribe function that cleans up all listeners.
 */
export function subscribeToAllRealTime(
  callbacks: {
    onCategories?: (cats: LocalExamCategory[]) => void
    onAnnouncements?: (data: Announcement[]) => void
    onNotifications?: (data: Notification[]) => void
    onUpcomingExams?: (data: UpcomingExam[]) => void
    onDailyTips?: (data: DailyTip[]) => void
    onPrevYearPapers?: (data: PrevYearPaper[]) => void
    onSidebarMenu?: (data: SidebarMenuItem[]) => void
  }
): () => void {
  const unsubscribers: (Unsubscribe | null)[] = []

  if (callbacks.onCategories) {
    unsubscribers.push(onCategoriesChange(callbacks.onCategories))
  }
  if (callbacks.onAnnouncements) {
    unsubscribers.push(onAnnouncementsChange(callbacks.onAnnouncements))
  }
  if (callbacks.onNotifications) {
    unsubscribers.push(onNotificationsChange(callbacks.onNotifications))
  }
  if (callbacks.onUpcomingExams) {
    unsubscribers.push(onUpcomingExamsChange(callbacks.onUpcomingExams))
  }
  if (callbacks.onDailyTips) {
    unsubscribers.push(onDailyTipsChange(callbacks.onDailyTips))
  }
  if (callbacks.onPrevYearPapers) {
    unsubscribers.push(onPrevYearPapersChange(callbacks.onPrevYearPapers))
  }
  if (callbacks.onSidebarMenu) {
    unsubscribers.push(onSidebarMenuChange(callbacks.onSidebarMenu))
  }

  return () => {
    unsubscribers.forEach(unsub => {
      if (unsub) unsub()
    })
  }
}
