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
  getAnnouncements as getLocalAnnouncements,
  getNotifications as getLocalNotifications,
  saveAnnouncements as saveLocalAnnouncements,
  saveNotifications as saveLocalNotifications,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_NOTIFICATIONS,
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
      if (categoryId) return allExams // Local data has exams nested; filter is approximate
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
      if (snap.empty) return DEFAULT_ANNOUNCEMENTS
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement))
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
      if (snap.empty) return DEFAULT_NOTIFICATIONS
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification))
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

    await batch.commit()
    console.log('[Firestore] Database seeded successfully')
    return true
  } catch (error) {
    console.error('[Firestore] Seed error:', error)
    return false
  }
}
