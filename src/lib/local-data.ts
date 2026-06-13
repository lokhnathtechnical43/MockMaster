// Local Data Layer for ExamPrep Bharat
// Provides types, default data, and localStorage-based CRUD operations

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
  categoryId: string
  description: string
  totalQuestions: number
  duration: number
  markingScheme: string
  order: number
}

export interface LocalTest {
  id: string
  examId: string
  title: string
  description: string
  duration: number
  totalMarks: number
  passingMarks: number
  questions: LocalQuestion[]
  createdAt: string
}

export interface LocalQuestion {
  id: string
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  explanation?: string
  subject?: string
  topic?: string
}

export interface TestResult {
  id: string
  testId: string
  testName: string
  userId: string
  userName: string
  score: number
  maxScore: number
  correctCount: number
  wrongCount: number
  skippedCount: number
  timeTaken: number
  answers: Record<string, string>
  createdAt: string
  mode?: 'real' | 'practice'  // Whether this was a real exam or practice session
}

// Storage key
const RESULTS_KEY = 'examprep_results'

// ===== Default Exam Data =====
const DEFAULT_CATEGORIES: LocalExamCategory[] = [
  {
    id: 'ssc', name: 'SSC Exams', slug: 'ssc', icon: '📋', description: 'Staff Selection Commission exams', order: 1,
    exams: [
      { id: 'ssc-cgl', name: 'SSC CGL', slug: 'ssc-cgl', categoryId: 'ssc', description: 'Combined Graduate Level Exam', totalQuestions: 100, duration: 60, markingScheme: '+2,-0.5', order: 1 },
      { id: 'ssc-chsl', name: 'SSC CHSL', slug: 'ssc-chsl', categoryId: 'ssc', description: 'Combined Higher Secondary Level', totalQuestions: 100, duration: 60, markingScheme: '+2,-0.5', order: 2 },
      { id: 'ssc-mts', name: 'SSC MTS', slug: 'ssc-mts', categoryId: 'ssc', description: 'Multi Tasking Staff', totalQuestions: 100, duration: 90, markingScheme: '+1,-0.25', order: 3 },
    ]
  },
  {
    id: 'banking', name: 'Banking Exams', slug: 'banking', icon: '🏦', description: 'IBPS, SBI, RBI banking exams', order: 2,
    exams: [
      { id: 'ibps-po', name: 'IBPS PO', slug: 'ibps-po', categoryId: 'banking', description: 'Institute of Banking Personnel Selection - PO', totalQuestions: 100, duration: 60, markingScheme: '+1,-0.25', order: 1 },
      { id: 'ibps-clerk', name: 'IBPS Clerk', slug: 'ibps-clerk', categoryId: 'banking', description: 'IBPS Clerk Exam', totalQuestions: 100, duration: 60, markingScheme: '+1,-0.25', order: 2 },
      { id: 'sbi-po', name: 'SBI PO', slug: 'sbi-po', categoryId: 'banking', description: 'State Bank of India - PO', totalQuestions: 100, duration: 60, markingScheme: '+1,-0.25', order: 3 },
    ]
  },
  {
    id: 'railways', name: 'Railway Exams', slug: 'railways', icon: '🚂', description: 'RRB railway recruitment exams', order: 3,
    exams: [
      { id: 'rrb-ntpc', name: 'RRB NTPC', slug: 'rrb-ntpc', categoryId: 'railways', description: 'Non-Technical Popular Categories', totalQuestions: 100, duration: 90, markingScheme: '+1,-0.33', order: 1 },
      { id: 'rrb-group-d', name: 'RRB Group D', slug: 'rrb-group-d', categoryId: 'railways', description: 'Railway Group D Recruitment', totalQuestions: 100, duration: 90, markingScheme: '+1,-0.33', order: 2 },
    ]
  },
  {
    id: 'teaching', name: 'Teaching Exams', slug: 'teaching', icon: '👨‍🏫', description: 'CTET, State TET teaching exams', order: 4,
    exams: [
      { id: 'ctet', name: 'CTET', slug: 'ctet', categoryId: 'teaching', description: 'Central Teacher Eligibility Test', totalQuestions: 150, duration: 150, markingScheme: '+1,0', order: 1 },
    ]
  },
  {
    id: 'defence', name: 'Defence Exams', slug: 'defence', icon: '🛡️', description: 'NDA, CDS, AFCAT defence exams', order: 5,
    exams: [
      { id: 'nda', name: 'NDA', slug: 'nda', categoryId: 'defence', description: 'National Defence Academy', totalQuestions: 150, duration: 150, markingScheme: '+2.5,-0.83', order: 1 },
      { id: 'cds', name: 'CDS', slug: 'cds', categoryId: 'defence', description: 'Combined Defence Services', totalQuestions: 120, duration: 120, markingScheme: '+1,-0.33', order: 2 },
    ]
  },
]

// ===== Sample Test Data =====
function generateSampleQuestions(count: number, subject: string): LocalQuestion[] {
  const questions: LocalQuestion[] = []
  const sampleQuestions = [
    'Which of the following is correct about the Indian Constitution?',
    'What is the capital of Australia?',
    'Who was the first President of India?',
    'Which planet is known as the Red Planet?',
    'What is the chemical formula for water?',
    'Who wrote the Indian national anthem?',
    'Which is the longest river in India?',
    'What is the SI unit of force?',
    'When did India gain independence?',
    'Which vitamin is produced by sunlight?',
    'What is the largest continent by area?',
    'Who discovered gravity?',
    'What is the national flower of India?',
    'Which gas is most abundant in the atmosphere?',
    'What is the square root of 144?',
    'Who was known as the Father of the Nation?',
    'Which is the smallest state in India by area?',
    'What is the pH value of pure water?',
    'Which organ purifies blood in the human body?',
    'What is the speed of light approximately?',
  ]
  const options = [
    ['It is the supreme law of India', 'It was adopted in 1947', 'It has 395 Articles originally', 'All of the above'],
    ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
    ['Dr. Rajendra Prasad', 'Jawaharlal Nehru', 'Sardar Patel', 'Mahatma Gandhi'],
    ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    ['HO', 'H2O', 'H2O2', 'OH'],
    ['Bankim Chandra Chatterjee', 'Rabindranath Tagore', 'Sarojini Naidu', 'Subhash Chandra Bose'],
    ['Ganga', 'Yamuna', 'Godavari', 'Brahmaputra'],
    ['Joule', 'Newton', 'Pascal', 'Watt'],
    ['1945', '1946', '1947', '1948'],
    ['Vitamin A', 'Vitamin B', 'Vitamin C', 'Vitamin D'],
    ['Africa', 'Asia', 'Europe', 'North America'],
    ['Albert Einstein', 'Isaac Newton', 'Galileo', 'Nikola Tesla'],
    ['Rose', 'Lotus', 'Sunflower', 'Jasmine'],
    ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
    ['10', '11', '12', '14'],
    ['Jawaharlal Nehru', 'Subhash Chandra Bose', 'Mahatma Gandhi', 'Sardar Patel'],
    ['Goa', 'Sikkim', 'Tripura', 'Meghalaya'],
    ['0', '7', '14', '1'],
    ['Heart', 'Liver', 'Kidney', 'Lungs'],
    ['3 x 10^8 m/s', '3 x 10^6 m/s', '3 x 10^10 m/s', '3 x 10^5 m/s'],
  ]
  const correctAnswers = ['D', 'C', 'A', 'B', 'B', 'B', 'A', 'B', 'C', 'D', 'B', 'B', 'B', 'C', 'C', 'C', 'A', 'B', 'C', 'A']

  for (let i = 0; i < count; i++) {
    const idx = i % sampleQuestions.length
    questions.push({
      id: `q-${subject}-${i + 1}`,
      questionText: sampleQuestions[idx],
      optionA: options[idx][0],
      optionB: options[idx][1],
      optionC: options[idx][2],
      optionD: options[idx][3],
      correctAnswer: correctAnswers[idx],
      explanation: `The correct answer is ${correctAnswers[idx]}. This is a ${subject} question.`,
      subject: subject,
    })
  }
  return questions
}

export const ALL_TESTS: LocalTest[] = [
  {
    id: 'test-ssc-cgl-1', examId: 'ssc-cgl', title: 'SSC CGL Mock Test 1', description: 'Full length mock test for SSC CGL',
    duration: 60, totalMarks: 200, passingMarks: 120,
    questions: generateSampleQuestions(100, 'General Awareness'),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'test-ssc-cgl-2', examId: 'ssc-cgl', title: 'SSC CGL Mock Test 2', description: 'Practice test for SSC CGL Tier I',
    duration: 60, totalMarks: 200, passingMarks: 120,
    questions: generateSampleQuestions(100, 'Quantitative Aptitude'),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'test-ssc-chsl-1', examId: 'ssc-chsl', title: 'SSC CHSL Mock Test 1', description: 'Full length mock test for SSC CHSL',
    duration: 60, totalMarks: 200, passingMarks: 120,
    questions: generateSampleQuestions(100, 'Reasoning'),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'test-ibps-po-1', examId: 'ibps-po', title: 'IBPS PO Mock Test 1', description: 'Full length mock test for IBPS PO Prelims',
    duration: 60, totalMarks: 100, passingMarks: 60,
    questions: generateSampleQuestions(100, 'English Language'),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'test-ibps-clerk-1', examId: 'ibps-clerk', title: 'IBPS Clerk Mock Test 1', description: 'Practice test for IBPS Clerk',
    duration: 60, totalMarks: 100, passingMarks: 60,
    questions: generateSampleQuestions(100, 'Numerical Ability'),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'test-rrb-ntpc-1', examId: 'rrb-ntpc', title: 'RRB NTPC Mock Test 1', description: 'Full length mock test for RRB NTPC',
    duration: 90, totalMarks: 100, passingMarks: 50,
    questions: generateSampleQuestions(100, 'General Intelligence'),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'test-nda-1', examId: 'nda', title: 'NDA Mock Test 1', description: 'Mathematics and General Ability Test',
    duration: 150, totalMarks: 900, passingMarks: 450,
    questions: generateSampleQuestions(150, 'Mathematics'),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'test-ctet-1', examId: 'ctet', title: 'CTET Mock Test 1', description: 'Child Development and Pedagogy',
    duration: 150, totalMarks: 150, passingMarks: 90,
    questions: generateSampleQuestions(150, 'Child Development'),
    createdAt: new Date().toISOString(),
  },
]

// ===== CRUD Functions =====

export function getCategories(): LocalExamCategory[] {
  return DEFAULT_CATEGORIES
}

export function getTestsByExam(examId: string): LocalTest[] {
  return ALL_TESTS.filter(t => t.examId === examId)
}

export function getTestById(testId: string): LocalTest | undefined {
  return ALL_TESTS.find(t => t.id === testId)
}

export function getResults(): TestResult[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(RESULTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveResult(data: Omit<TestResult, 'id' | 'createdAt'>): TestResult {
  const result: TestResult = {
    ...data,
    id: `result-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }
  const results = getResults()
  results.push(result)
  if (typeof window !== 'undefined') {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results))
  }
  return result
}

export function getLeaderboard(testId: string): TestResult[] {
  return getResults()
    .filter(r => r.testId === testId)
    .sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken)
}
