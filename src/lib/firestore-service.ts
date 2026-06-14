// Firestore Service Layer for ExamPrep Bharat
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
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore'
import { db, isFirebaseReady } from '@/lib/firebase'
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
} from '@/lib/local-data'
import {
  Announcement,
  Notification,
  DailyTip,
  UpcomingExam,
  getAnnouncements as getLocalAnnouncements,
  getNotifications as getLocalNotifications,
  saveAnnouncements as saveLocalAnnouncements,
  saveNotifications as saveLocalNotifications,
  getDailyTips as getLocalDailyTips,
  saveDailyTips as saveLocalDailyTips,
  getUpcomingExams as getLocalUpcomingExams,
  saveUpcomingExams as saveLocalUpcomingExams,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_DAILY_TIPS,
  DEFAULT_UPCOMING_EXAMS,
} from '@/lib/admin-data'

// ============================================================
// Configuration
// ============================================================

/** Global flag to toggle Firestore vs local fallback */
let useFirestore = false

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
  dailyTips: 'daily_tips',
  upcomingExams: 'upcoming_exams',
  pageImages: 'page_images',
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
  imageUrl?: string // Optional custom image (base64 data URL or external URL)
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
  imageUrl?: string // Optional custom image (base64 data URL or external URL)
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
  imageUrl?: string // Optional custom image (base64 data URL or external URL)
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
}

export interface FirestoreUser {
  id: string
  name: string
  email: string
  phone: string
  photoURL: string
  role: 'user' | 'admin' | 'banned'
  testsCompleted: number
  totalScore: number
  createdAt: string | Timestamp
  lastActive: string | Timestamp
}

export interface FirestoreAnnouncement {
  id: string
  image: string
  imageUrl?: string // Optional custom image (base64 data URL or external URL)
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
  imageUrl?: string // Optional custom image (base64 data URL or external URL)
}

// ============================================================
// Analytics Types
// ============================================================

export interface DashboardStats {
  totalUsers: number
  totalTests: number
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
  } catch (error) {
    console.error('[Firestore] Operation failed, falling back to local data:', error)
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
          exams: catExams.map((e) => ({
            id: e.id,
            name: e.name,
            slug: e.slug,
            description: e.description,
            totalQuestions: e.totalQuestions,
            duration: e.duration,
            markingScheme: e.markingScheme,
            order: e.order,
            testCount: e.testCount,
          })),
        } as LocalExamCategory
      })
    },
    () => getLocalCategories()
  )
}

/**
 * Add a new category to Firestore.
 */
export async function addCategory(
  data: Omit<FirestoreExamCategory, 'id'>
): Promise<FirestoreExamCategory> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.categories), data)
    return { id: docRef.id, ...data }
  } catch (error) {
    console.error('[Firestore] addCategory error:', error)
    throw error
  }
}

/**
 * Update an existing category.
 */
export async function updateCategory(
  id: string,
  data: Partial<FirestoreExamCategory>
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.categories, id), data)
  } catch (error) {
    console.error('[Firestore] updateCategory error:', error)
    throw error
  }
}

/**
 * Delete a category and all its associated exams.
 */
export async function deleteCategory(id: string): Promise<void> {
  try {
    // Delete associated exams first
    const examSnap = await getDocs(
      query(collection(db, COLLECTIONS.exams), where('categoryId', '==', id))
    )
    const batch = writeBatch(db)
    examSnap.docs.forEach((d) => batch.delete(d.ref))
    batch.delete(doc(db, COLLECTIONS.categories, id))
    await batch.commit()
  } catch (error) {
    console.error('[Firestore] deleteCategory error:', error)
    throw error
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
      const constraints: QueryConstraint[] = [orderBy('order')]
      if (categoryId) constraints.push(where('categoryId', '==', categoryId))

      const snap = await getDocs(query(collection(db, COLLECTIONS.exams), ...constraints))
      return snap.docs.map((d) => {
        const e = { id: d.id, ...d.data() } as FirestoreExam
        return {
          id: e.id,
          name: e.name,
          slug: e.slug,
          description: e.description,
          totalQuestions: e.totalQuestions,
          duration: e.duration,
          markingScheme: e.markingScheme,
          order: e.order,
          testCount: e.testCount,
        } as LocalExam
      })
    },
    () => {
      const cats = getLocalCategories()
      const allExams = cats.flatMap((c) => c.exams)
      if (categoryId) {
        // Filter by category: match category id from parent
        const cat = cats.find(c => c.id === categoryId)
        return cat ? cat.exams : []
      }
      return allExams
    }
  )
}

/**
 * Add a new exam.
 */
export async function addExam(
  data: Omit<FirestoreExam, 'id'>
): Promise<FirestoreExam> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.exams), data)
    return { id: docRef.id, ...data }
  } catch (error) {
    console.error('[Firestore] addExam error:', error)
    throw error
  }
}

/**
 * Update an existing exam.
 */
export async function updateExam(
  id: string,
  data: Partial<FirestoreExam>
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.exams, id), data)
  } catch (error) {
    console.error('[Firestore] updateExam error:', error)
    throw error
  }
}

/**
 * Delete an exam and all its associated tests and questions.
 */
export async function deleteExam(id: string): Promise<void> {
  try {
    // Delete associated tests
    const testSnap = await getDocs(
      query(collection(db, COLLECTIONS.tests), where('examId', '==', id))
    )
    const batch = writeBatch(db)
    for (const testDoc of testSnap.docs) {
      // Delete associated questions
      const qSnap = await getDocs(
        query(collection(db, COLLECTIONS.questions), where('testId', '==', testDoc.id))
      )
      qSnap.docs.forEach((q) => batch.delete(q.ref))
      batch.delete(testDoc.ref)
    }
    batch.delete(doc(db, COLLECTIONS.exams, id))
    await batch.commit()
  } catch (error) {
    console.error('[Firestore] deleteExam error:', error)
    throw error
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
      const constraints: QueryConstraint[] = [orderBy('slug')]
      if (examId) constraints.push(where('examId', '==', examId))

      const snap = await getDocs(query(collection(db, COLLECTIONS.tests), ...constraints))
      return snap.docs.map((d) => {
        const t = { id: d.id, ...d.data() } as FirestoreTest
        return {
          id: t.id,
          title: t.title,
          slug: t.slug,
          description: t.description,
          totalQuestions: t.totalQuestions,
          duration: t.duration,
          markingCorrect: t.markingCorrect,
          markingWrong: t.markingWrong,
          markingSkipped: t.markingSkipped,
          difficulty: t.difficulty,
          isFree: t.isFree,
          isLive: t.isLive,
          exam: { id: t.examId, name: t.examName, slug: t.examSlug },
          questions: [], // Questions loaded separately via getTestById
        } as LocalTest
      })
    },
    () => {
      if (examId) return getLocalTestsByExam(examId)
      return ALL_TESTS.map((t) => ({ ...t, questions: [] }))
    }
  )
}

/**
 * Get a single test by ID, including its questions.
 */
export async function getTestById(id: string): Promise<LocalTest | null> {
  return firestoreOperation(
    async () => {
      const testDoc = await getDoc(doc(db, COLLECTIONS.tests, id))
      if (!testDoc.exists()) return null

      const t = { id: testDoc.id, ...testDoc.data() } as FirestoreTest

      // Fetch questions for this test
      const qSnap = await getDocs(
        query(collection(db, COLLECTIONS.questions), where('testId', '==', id), orderBy('order'))
      )
      const questions: LocalQuestion[] = qSnap.docs.map((qd) => {
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

      return {
        id: t.id,
        title: t.title,
        slug: t.slug,
        description: t.description,
        totalQuestions: t.totalQuestions,
        duration: t.duration,
        markingCorrect: t.markingCorrect,
        markingWrong: t.markingWrong,
        markingSkipped: t.markingSkipped,
        difficulty: t.difficulty,
        isFree: t.isFree,
        isLive: t.isLive,
        exam: { id: t.examId, name: t.examName, slug: t.examSlug },
        questions,
      } as LocalTest
    },
    () => getLocalTestById(id) ?? null
  )
}

/**
 * Add a new test.
 */
export async function addTest(
  data: Omit<FirestoreTest, 'id'>
): Promise<FirestoreTest> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.tests), data)
    return { id: docRef.id, ...data }
  } catch (error) {
    console.error('[Firestore] addTest error:', error)
    throw error
  }
}

/**
 * Update an existing test.
 */
export async function updateTest(
  id: string,
  data: Partial<FirestoreTest>
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.tests, id), data)
  } catch (error) {
    console.error('[Firestore] updateTest error:', error)
    throw error
  }
}

/**
 * Delete a test and all its associated questions.
 */
export async function deleteTest(id: string): Promise<void> {
  try {
    const qSnap = await getDocs(
      query(collection(db, COLLECTIONS.questions), where('testId', '==', id))
    )
    const batch = writeBatch(db)
    qSnap.docs.forEach((q) => batch.delete(q.ref))
    batch.delete(doc(db, COLLECTIONS.tests, id))
    await batch.commit()
  } catch (error) {
    console.error('[Firestore] deleteTest error:', error)
    throw error
  }
}

// ============================================================
// Question CRUD
// ============================================================

/**
 * Get all questions for a given test.
 */
export async function getQuestions(testId: string): Promise<LocalQuestion[]> {
  return firestoreOperation(
    async () => {
      const snap = await getDocs(
        query(
          collection(db, COLLECTIONS.questions),
          where('testId', '==', testId),
          orderBy('order')
        )
      )
      return snap.docs.map((d) => {
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
    },
    () => {
      const test = getLocalTestById(testId)
      return test?.questions ?? []
    }
  )
}

/**
 * Add a single question.
 */
export async function addQuestion(
  data: Omit<FirestoreQuestion, 'id'>
): Promise<FirestoreQuestion> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.questions), data)
    return { id: docRef.id, ...data }
  } catch (error) {
    console.error('[Firestore] addQuestion error:', error)
    throw error
  }
}

/**
 * Update an existing question.
 */
export async function updateQuestion(
  id: string,
  data: Partial<FirestoreQuestion>
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.questions, id), data)
  } catch (error) {
    console.error('[Firestore] updateQuestion error:', error)
    throw error
  }
}

/**
 * Delete a question.
 */
export async function deleteQuestion(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.questions, id))
  } catch (error) {
    console.error('[Firestore] deleteQuestion error:', error)
    throw error
  }
}

/**
 * Add multiple questions at once using a Firestore batch write.
 * Returns the list of created questions with their generated IDs.
 */
export async function addBatchQuestions(
  testId: string,
  questions: Omit<LocalQuestion, 'id'>[]
): Promise<LocalQuestion[]> {
  try {
    const batch = writeBatch(db)
    const created: LocalQuestion[] = []

    for (const qData of questions) {
      const docRef = doc(collection(db, COLLECTIONS.questions))
      const firestoreQ: FirestoreQuestion = {
        id: docRef.id,
        questionText: qData.questionText,
        questionImage: qData.questionImage ?? null,
        optionA: qData.optionA,
        optionB: qData.optionB,
        optionC: qData.optionC,
        optionD: qData.optionD,
        correctAnswer: qData.correctAnswer,
        explanation: qData.explanation ?? null,
        subject: qData.subject ?? null,
        order: qData.order ?? 0,
        testId,
      }
      batch.set(docRef, firestoreQ)
      created.push({ ...qData, id: docRef.id })
    }

    await batch.commit()
    return created
  } catch (error) {
    console.error('[Firestore] addBatchQuestions error:', error)
    throw error
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
      const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]
      if (testId) constraints.push(where('testId', '==', testId))
      if (userId) constraints.push(where('userId', '==', userId))

      const snap = await getDocs(query(collection(db, COLLECTIONS.results), ...constraints))
      return snap.docs.map((d) => {
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
    },
    () => {
      const allResults = getLocalResults()
      if (testId) return allResults.filter((r: TestResult) => r.testId === testId)
      return allResults
    }
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
      const snap = await getDocs(
        query(
          collection(db, COLLECTIONS.results),
          where('testId', '==', testId),
          orderBy('score', 'desc'),
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
      // Secondary sort by timeTaken ascending (Firestore only supports one orderBy)
      return results.sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken)
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
    const userDoc = await getDoc(doc(db, COLLECTIONS.users, userId))
    if (!userDoc.exists()) return null
    return { id: userDoc.id, ...userDoc.data() } as FirestoreUser
  } catch (error) {
    console.error('[Firestore] getUser error:', error)
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

// ============================================================
// Announcement CRUD
// ============================================================

/**
 * Get all announcements.
 */
export async function getAnnouncements(): Promise<Announcement[]> {
  return firestoreOperation(
    async () => {
      // Check metadata doc to distinguish "never initialized" from "intentionally empty"
      const metaSnap = await getDoc(doc(db, COLLECTIONS.announcements, '_meta'))
      if (!metaSnap.exists()) return DEFAULT_ANNOUNCEMENTS // Never initialized → use defaults
      const snap = await getDocs(collection(db, COLLECTIONS.announcements))
      return snap.docs.filter(d => d.id !== '_meta').map((d) => ({ id: d.id, ...d.data() } as Announcement))
    },
    () => getLocalAnnouncements()
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
    // Delete existing (skip _meta doc)
    const existing = await getDocs(collection(db, COLLECTIONS.announcements))
    existing.docs.forEach((d) => { if (d.id !== '_meta') batch.delete(d.ref) })
    // Add new items
    for (const item of data) {
      const docRef = doc(collection(db, COLLECTIONS.announcements))
      batch.set(docRef, { ...item, id: docRef.id })
    }
    // Write sentinel metadata doc so we know collection has been initialized
    batch.set(doc(db, COLLECTIONS.announcements, '_meta'), { _initialized: true, updatedAt: serverTimestamp() })
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
      const metaSnap = await getDoc(doc(db, COLLECTIONS.notifications, '_meta'))
      if (!metaSnap.exists()) return DEFAULT_NOTIFICATIONS
      const snap = await getDocs(collection(db, COLLECTIONS.notifications))
      return snap.docs.filter(d => d.id !== '_meta').map((d) => ({ id: d.id, ...d.data() } as Notification))
    },
    () => getLocalNotifications()
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
    // Delete existing (skip _meta doc)
    const existing = await getDocs(collection(db, COLLECTIONS.notifications))
    existing.docs.forEach((d) => { if (d.id !== '_meta') batch.delete(d.ref) })
    // Add new items
    for (const item of data) {
      const docRef = doc(collection(db, COLLECTIONS.notifications))
      batch.set(docRef, { ...item, id: docRef.id })
    }
    // Write sentinel metadata doc
    batch.set(doc(db, COLLECTIONS.notifications, '_meta'), { _initialized: true, updatedAt: serverTimestamp() })
    await batch.commit()
    // Also persist locally for offline access
    saveLocalNotifications(data)
  } catch (error) {
    console.error('[Firestore] saveNotifications error, saving locally:', error)
    saveLocalNotifications(data)
  }
}

// ============================================================
// Daily Tips CRUD
// ============================================================

/**
 * Get all daily tips.
 */
export async function getDailyTips(): Promise<DailyTip[]> {
  return firestoreOperation(
    async () => {
      const metaSnap = await getDoc(doc(db, COLLECTIONS.dailyTips, '_meta'))
      if (!metaSnap.exists()) return DEFAULT_DAILY_TIPS
      const snap = await getDocs(collection(db, COLLECTIONS.dailyTips))
      return snap.docs.filter(d => d.id !== '_meta').map((d) => ({ id: d.id, ...d.data() } as DailyTip))
    },
    () => getLocalDailyTips()
  )
}

/**
 * Save (overwrite) the daily tips collection.
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
    const existing = await getDocs(collection(db, COLLECTIONS.dailyTips))
    existing.docs.forEach((d) => { if (d.id !== '_meta') batch.delete(d.ref) })
    for (const item of data) {
      const docRef = doc(collection(db, COLLECTIONS.dailyTips))
      batch.set(docRef, { ...item, id: docRef.id })
    }
    batch.set(doc(db, COLLECTIONS.dailyTips, '_meta'), { _initialized: true, updatedAt: serverTimestamp() })
    await batch.commit()
    saveLocalDailyTips(data)
  } catch (error) {
    console.error('[Firestore] saveDailyTips error, saving locally:', error)
    saveLocalDailyTips(data)
  }
}

// ============================================================
// Upcoming Exams CRUD
// ============================================================

/**
 * Get all upcoming exams.
 */
export async function getUpcomingExams(): Promise<UpcomingExam[]> {
  return firestoreOperation(
    async () => {
      const metaSnap = await getDoc(doc(db, COLLECTIONS.upcomingExams, '_meta'))
      if (!metaSnap.exists()) return DEFAULT_UPCOMING_EXAMS
      const snap = await getDocs(collection(db, COLLECTIONS.upcomingExams))
      return snap.docs.filter(d => d.id !== '_meta').map((d) => ({ id: d.id, ...d.data() } as UpcomingExam))
    },
    () => getLocalUpcomingExams()
  )
}

/**
 * Save (overwrite) the upcoming exams collection.
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
    const existing = await getDocs(collection(db, COLLECTIONS.upcomingExams))
    existing.docs.forEach((d) => { if (d.id !== '_meta') batch.delete(d.ref) })
    for (const item of data) {
      const docRef = doc(collection(db, COLLECTIONS.upcomingExams))
      batch.set(docRef, { ...item, id: docRef.id })
    }
    batch.set(doc(db, COLLECTIONS.upcomingExams, '_meta'), { _initialized: true, updatedAt: serverTimestamp() })
    await batch.commit()
    saveLocalUpcomingExams(data)
  } catch (error) {
    console.error('[Firestore] saveUpcomingExams error, saving locally:', error)
    saveLocalUpcomingExams(data)
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

    // Total tests
    const testsSnap = await getDocs(collection(db, COLLECTIONS.tests))
    const totalTests = testsSnap.size

    // Total results + avg score + recent activity
    const resultsSnap = await getDocs(
      query(collection(db, COLLECTIONS.results), orderBy('createdAt', 'desc'), limit(100))
    )
    const totalResults = resultsSnap.size
    let totalScore = 0
    const recentActivity: FirestoreTestResult[] = []

    // Calculate percentage-based average score
    let totalScorePercent = 0
    let scoredResults = 0

    resultsSnap.docs.forEach((d) => {
      const r = d.data() as FirestoreTestResult
      if (r.maxScore > 0) {
        totalScorePercent += (r.score / r.maxScore) * 100
        scoredResults++
      }
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

    const avgScore = scoredResults > 0 ? Math.round(totalScorePercent / scoredResults) : 0

    return { totalUsers, totalTests, totalResults, avgScore, recentActivity }
  } catch (error) {
    console.error('[Firestore] getDashboardStats error, returning defaults:', error)
    return {
      totalUsers: 0,
      totalTests: ALL_TESTS.length,
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
  if (!db || !isFirebaseReady()) {
    console.error('[Firestore] Cannot seed: Firebase is not configured. Add config to .env.local')
    return false
  }
  try {
    const catSnap = await getDocs(collection(db, COLLECTIONS.categories))
    if (catSnap.size > 0) return false // Already seeded

    const localCategories = getLocalCategories()
    let opCount = 0
    let batch = writeBatch(db)

    const commitIfNeeded = async () => {
      if (opCount >= 450) {
        await batch.commit()
        batch = writeBatch(db)
        opCount = 0
      }
    }

    for (const cat of localCategories) {
      const catRef = doc(collection(db, COLLECTIONS.categories))
      batch.set(catRef, {
        name: cat.name, slug: cat.slug, icon: cat.icon,
        description: cat.description, order: cat.order,
      })
      opCount++

      for (const exam of cat.exams) {
        const examRef = doc(collection(db, COLLECTIONS.exams))
        batch.set(examRef, {
          name: exam.name, slug: exam.slug, description: exam.description,
          totalQuestions: exam.totalQuestions, duration: exam.duration,
          markingScheme: exam.markingScheme, order: exam.order,
          testCount: exam.testCount, categoryId: catRef.id,
        })
        opCount++
      }
      await commitIfNeeded()
    }

    for (const test of ALL_TESTS) {
      const testRef = doc(collection(db, COLLECTIONS.tests))
      batch.set(testRef, {
        title: test.title, slug: test.slug, description: test.description,
        totalQuestions: test.totalQuestions, duration: test.duration,
        markingCorrect: test.markingCorrect, markingWrong: test.markingWrong,
        markingSkipped: test.markingSkipped, difficulty: test.difficulty,
        isFree: test.isFree, isLive: test.isLive,
        examId: test.exam.id, examName: test.exam.name, examSlug: test.exam.slug,
      })
      opCount++

      for (const q of test.questions) {
        const qRef = doc(collection(db, COLLECTIONS.questions))
        batch.set(qRef, {
          questionText: q.questionText, questionImage: q.questionImage,
          optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD,
          correctAnswer: q.correctAnswer, explanation: q.explanation,
          subject: q.subject, order: q.order, testId: testRef.id,
        })
        opCount++
      }
      await commitIfNeeded()
    }

    // Seed default announcements
    for (const ann of DEFAULT_ANNOUNCEMENTS) {
      const annRef = doc(collection(db, COLLECTIONS.announcements))
      batch.set(annRef, { ...ann, id: annRef.id })
      opCount++
      await commitIfNeeded()
    }

    // Seed default notifications
    for (const notif of DEFAULT_NOTIFICATIONS) {
      const notifRef = doc(collection(db, COLLECTIONS.notifications))
      batch.set(notifRef, { ...notif, id: notifRef.id })
      opCount++
      await commitIfNeeded()
    }

    // Seed default daily tips
    for (const tip of DEFAULT_DAILY_TIPS) {
      const tipRef = doc(collection(db, COLLECTIONS.dailyTips))
      batch.set(tipRef, { ...tip, id: tipRef.id })
      opCount++
      await commitIfNeeded()
    }

    // Commit any remaining operations
    if (opCount > 0) await batch.commit()
    console.log('[Firestore] Database seeded successfully')
    return true
  } catch (error) {
    console.error('[Firestore] Seed error:', error)
    return false
  }
}

// ============================================================
// Page Images Firestore sync
// ============================================================

/**
 * Save page images to Firestore (overwrites the single document).
 */
export async function savePageImagesToFirestore(images: { id: string; label: string; page: string; section: string; imageUrl: string; updatedAt: string }[]): Promise<void> {
  if (!useFirestore || !isFirebaseReady() || !db) return
  try {
    // Store as a single document with all images
    await setDoc(doc(db, COLLECTIONS.pageImages, 'all'), { images, updatedAt: serverTimestamp() })
  } catch (error) {
    console.error('[Firestore] savePageImages error:', error)
  }
}

/**
 * Load page images from Firestore.
 */
export async function getPageImagesFromFirestore(): Promise<{ id: string; label: string; page: string; section: string; imageUrl: string; updatedAt: string }[]> {
  if (!useFirestore || !isFirebaseReady() || !db) return []
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.pageImages, 'all'))
    if (snap.exists()) {
      return snap.data().images || []
    }
    return []
  } catch (error) {
    console.error('[Firestore] getPageImages error:', error)
    return []
  }
}
