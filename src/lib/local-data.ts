// Local Data Layer for ExamPrep Bharat
// Provides types, default data, and localStorage-based CRUD operations

export interface LocalExamCategory {
  id: string
  name: string
  slug: string
  icon: string
  description: string
  order: number
  imageUrl?: string
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
  testCount?: number
  imageUrl?: string
}

export interface LocalTest {
  id: string
  examId: string
  title: string
  slug?: string
  description: string
  duration: number
  totalQuestions?: number
  totalMarks: number
  passingMarks: number
  questions: LocalQuestion[]
  createdAt: string
  difficulty?: string
  // Marking scheme fields (used by Firestore data, accessed by components)
  correctMarks?: number
  wrongMarks?: number
  skipMarks?: number
  markingCorrect?: number
  markingWrong?: number
  markingSkipped?: number
  // Firestore-specific fields
  isFree?: boolean
  isLive?: boolean
  exam?: { id: string; name: string; slug: string }
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
  explanation?: string
  subject?: string
  topic?: string
  order?: number
  testId?: string
}

export interface TestResult {
  id: string
  testId: string
  testName: string
  examName?: string
  userId: string
  userName: string
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

// Storage keys
const RESULTS_KEY = 'examprep_results'
const CATEGORIES_KEY = 'examprep_local_categories'
const EXAMS_KEY = 'examprep_local_exams'
const TESTS_KEY = 'examprep_local_tests'
const QUESTIONS_KEY = 'examprep_local_questions'

// ===== Default Exam Data =====
const DEFAULT_CATEGORIES: LocalExamCategory[] = [
  {
    id: 'ssc', name: 'SSC Exams', slug: 'ssc', icon: '📋', description: 'Staff Selection Commission exams', order: 1,
    exams: [
      { id: 'ssc-cgl', name: 'SSC CGL', slug: 'ssc-cgl', categoryId: 'ssc', description: 'Combined Graduate Level Exam', totalQuestions: 100, duration: 60, markingScheme: '+2,-0.5', order: 1 },
      { id: 'ssc-chsl', name: 'SSC CHSL', slug: 'ssc-chsl', categoryId: 'ssc', description: 'Combined Higher Secondary Level', totalQuestions: 100, duration: 60, markingScheme: '+2,-0.5', order: 2 },
      { id: 'ssc-mts', name: 'SSC MTS', slug: 'ssc-mts', categoryId: 'ssc', description: 'Multi Tasking Staff', totalQuestions: 100, duration: 90, markingScheme: '+1,-0.25', order: 3 },
      { id: 'ssc-gd', name: 'SSC GD Constable', slug: 'ssc-gd', categoryId: 'ssc', description: 'General Duty Constable', totalQuestions: 100, duration: 90, markingScheme: '+1,-0.25', order: 4 },
      { id: 'ssc-stenographer', name: 'SSC Stenographer', slug: 'ssc-stenographer', categoryId: 'ssc', description: 'Stenographer Grade C & D', totalQuestions: 100, duration: 60, markingScheme: '+1,-0.25', order: 5 },
    ]
  },
  {
    id: 'banking', name: 'Banking Exams', slug: 'banking', icon: '🏦', description: 'IBPS, SBI, RBI banking exams', order: 2,
    exams: [
      { id: 'ibps-po', name: 'IBPS PO', slug: 'ibps-po', categoryId: 'banking', description: 'Institute of Banking Personnel Selection - PO', totalQuestions: 100, duration: 60, markingScheme: '+1,-0.25', order: 1 },
      { id: 'ibps-clerk', name: 'IBPS Clerk', slug: 'ibps-clerk', categoryId: 'banking', description: 'IBPS Clerk Exam', totalQuestions: 100, duration: 60, markingScheme: '+1,-0.25', order: 2 },
      { id: 'sbi-po', name: 'SBI PO', slug: 'sbi-po', categoryId: 'banking', description: 'State Bank of India - PO', totalQuestions: 100, duration: 60, markingScheme: '+1,-0.25', order: 3 },
      { id: 'sbi-clerk', name: 'SBI Clerk', slug: 'sbi-clerk', categoryId: 'banking', description: 'State Bank of India - Clerk', totalQuestions: 100, duration: 60, markingScheme: '+1,-0.25', order: 4 },
      { id: 'rbi-assistant', name: 'RBI Assistant', slug: 'rbi-assistant', categoryId: 'banking', description: 'Reserve Bank of India Assistant', totalQuestions: 100, duration: 60, markingScheme: '+1,-0.25', order: 5 },
      { id: 'ibps-rrb', name: 'IBPS RRB', slug: 'ibps-rrb', categoryId: 'banking', description: 'IBPS Regional Rural Bank', totalQuestions: 80, duration: 45, markingScheme: '+1,-0.25', order: 6 },
    ]
  },
  {
    id: 'railways', name: 'Railway Exams', slug: 'railways', icon: '🚂', description: 'RRB railway recruitment exams', order: 3,
    exams: [
      { id: 'rrb-ntpc', name: 'RRB NTPC', slug: 'rrb-ntpc', categoryId: 'railways', description: 'Non-Technical Popular Categories', totalQuestions: 100, duration: 90, markingScheme: '+1,-0.33', order: 1 },
      { id: 'rrb-group-d', name: 'RRB Group D', slug: 'rrb-group-d', categoryId: 'railways', description: 'Railway Group D Recruitment', totalQuestions: 100, duration: 90, markingScheme: '+1,-0.33', order: 2 },
      { id: 'rrb-je', name: 'RRB JE', slug: 'rrb-je', categoryId: 'railways', description: 'Railway Junior Engineer', totalQuestions: 100, duration: 90, markingScheme: '+1,-0.33', order: 3 },
      { id: 'rrb-alp', name: 'RRB ALP', slug: 'rrb-alp', categoryId: 'railways', description: 'Assistant Loco Pilot', totalQuestions: 75, duration: 60, markingScheme: '+1,-0.33', order: 4 },
    ]
  },
  {
    id: 'teaching', name: 'Teaching Exams', slug: 'teaching', icon: '👨‍🏫', description: 'CTET, State TET teaching exams', order: 4,
    exams: [
      { id: 'ctet', name: 'CTET', slug: 'ctet', categoryId: 'teaching', description: 'Central Teacher Eligibility Test', totalQuestions: 150, duration: 150, markingScheme: '+1,0', order: 1 },
      { id: 'uptet', name: 'UPTET', slug: 'uptet', categoryId: 'teaching', description: 'Uttar Pradesh Teacher Eligibility Test', totalQuestions: 150, duration: 150, markingScheme: '+1,0', order: 2 },
      { id: 'kvs', name: 'KVS PRT/TGT', slug: 'kvs', categoryId: 'teaching', description: 'Kendriya Vidyalaya Sangathan', totalQuestions: 150, duration: 150, markingScheme: '+1,0', order: 3 },
    ]
  },
  {
    id: 'defence', name: 'Defence Exams', slug: 'defence', icon: '🛡️', description: 'NDA, CDS, AFCAT defence exams', order: 5,
    exams: [
      { id: 'nda', name: 'NDA', slug: 'nda', categoryId: 'defence', description: 'National Defence Academy', totalQuestions: 150, duration: 150, markingScheme: '+2.5,-0.83', order: 1 },
      { id: 'cds', name: 'CDS', slug: 'cds', categoryId: 'defence', description: 'Combined Defence Services', totalQuestions: 120, duration: 120, markingScheme: '+1,-0.33', order: 2 },
      { id: 'afcat', name: 'AFCAT', slug: 'afcat', categoryId: 'defence', description: 'Air Force Common Admission Test', totalQuestions: 100, duration: 120, markingScheme: '+3,-1', order: 3 },
    ]
  },
  {
    id: 'state-govt', name: 'State Govt Exams', slug: 'state-govt', icon: '🏛️', description: 'State level government recruitment exams', order: 6,
    exams: [
      { id: 'upsc-cse', name: 'UPSC CSE (Prelims)', slug: 'upsc-cse', categoryId: 'state-govt', description: 'Civil Services Examination Prelims', totalQuestions: 100, duration: 120, markingScheme: '+2,-0.66', order: 1 },
      { id: 'uppsc', name: 'UPPSC', slug: 'uppsc', categoryId: 'state-govt', description: 'Uttar Pradesh Public Service Commission', totalQuestions: 100, duration: 120, markingScheme: '+1.33,-0.44', order: 2 },
      { id: 'mpsc', name: 'MPSC', slug: 'mpsc', categoryId: 'state-govt', description: 'Maharashtra Public Service Commission', totalQuestions: 100, duration: 120, markingScheme: '+2,-0.5', order: 3 },
      { id: 'wbpsc', name: 'WBPSC', slug: 'wbpsc', categoryId: 'state-govt', description: 'West Bengal Public Service Commission', totalQuestions: 100, duration: 120, markingScheme: '+1,-0.25', order: 4 },
    ]
  },
  {
    id: 'police', name: 'Police Exams', slug: 'police', icon: '👮', description: 'State & Central police recruitment exams', order: 7,
    exams: [
      { id: 'delhi-police', name: 'Delhi Police', slug: 'delhi-police', categoryId: 'police', description: 'Delhi Police Constable/Head Constable', totalQuestions: 100, duration: 90, markingScheme: '+1,-0.25', order: 1 },
      { id: 'up-police', name: 'UP Police', slug: 'up-police', categoryId: 'police', description: 'UP Police Constable/Sub-Inspector', totalQuestions: 150, duration: 120, markingScheme: '+1,-0.25', order: 2 },
      { id: 'cisf', name: 'CISF', slug: 'cisf', categoryId: 'police', description: 'Central Industrial Security Force', totalQuestions: 100, duration: 90, markingScheme: '+1,-0.25', order: 3 },
      { id: 'crpf', name: 'CRPF', slug: 'crpf', categoryId: 'police', description: 'Central Reserve Police Force', totalQuestions: 100, duration: 90, markingScheme: '+1,-0.25', order: 4 },
    ]
  },
  {
    id: 'insurance', name: 'Insurance Exams', slug: 'insurance', icon: '🏢', description: 'LIC, NIACL insurance sector exams', order: 8,
    exams: [
      { id: 'lic-aao', name: 'LIC AAO', slug: 'lic-aao', categoryId: 'insurance', description: 'LIC Assistant Administrative Officer', totalQuestions: 100, duration: 60, markingScheme: '+1,-0.25', order: 1 },
      { id: 'lic-assistant', name: 'LIC Assistant', slug: 'lic-assistant', categoryId: 'insurance', description: 'LIC Assistant Exam', totalQuestions: 100, duration: 60, markingScheme: '+1,-0.25', order: 2 },
      { id: 'niacl-ao', name: 'NIACL AO', slug: 'niacl-ao', categoryId: 'insurance', description: 'New India Assurance AO', totalQuestions: 100, duration: 60, markingScheme: '+1,-0.25', order: 3 },
    ]
  },
]

// ===== Question Banks by Subject =====
const GA_QUESTIONS: LocalQuestion[] = [
  { id: 'ga-1', questionText: 'Who was the first Chief Election Commissioner of India?', optionA: 'Sukumar Sen', optionB: 'K.V.K. Sundaram', optionC: 'T. Swaminathan', optionD: 'S.L. Shakdher', correctAnswer: 'A', explanation: 'Sukumar Sen was the first Chief Election Commissioner of independent India, serving from 1950 to 1958.', subject: 'General Awareness' },
  { id: 'ga-2', questionText: 'Which article of the Indian Constitution deals with the Right to Education?', optionA: 'Article 21', optionB: 'Article 21A', optionC: 'Article 45', optionD: 'Article 46', correctAnswer: 'B', explanation: 'Article 21A was added by the 86th Constitutional Amendment Act, 2002, making elementary education a fundamental right.', subject: 'General Awareness' },
  { id: 'ga-3', questionText: 'The Headquarters of the World Health Organization (WHO) is located in?', optionA: 'New York', optionB: 'Paris', optionC: 'Geneva', optionD: 'London', correctAnswer: 'C', explanation: 'WHO headquarters is in Geneva, Switzerland. It was established on 7 April 1948.', subject: 'General Awareness' },
  { id: 'ga-4', questionText: 'Which planet is known as the "Morning Star"?', optionA: 'Mars', optionB: 'Venus', optionC: 'Jupiter', optionD: 'Mercury', correctAnswer: 'B', explanation: 'Venus is called the Morning Star as well as the Evening Star because it is visible just before sunrise and just after sunset.', subject: 'General Awareness' },
  { id: 'ga-5', questionText: 'The Indian Space Research Organisation (ISRO) was founded in which year?', optionA: '1965', optionB: '1969', optionC: '1972', optionD: '1975', correctAnswer: 'B', explanation: 'ISRO was established on 15 August 1969, with its headquarters in Bengaluru.', subject: 'General Awareness' },
  { id: 'ga-6', questionText: 'Which Indian state has the longest coastline?', optionA: 'Maharashtra', optionB: 'Tamil Nadu', optionC: 'Gujarat', optionD: 'Andhra Pradesh', correctAnswer: 'C', explanation: 'Gujarat has the longest coastline of about 1,600 km among all Indian states.', subject: 'General Awareness' },
  { id: 'ga-7', questionText: 'The Battle of Plassey was fought in which year?', optionA: '1757', optionB: '1764', optionC: '1857', optionD: '1761', correctAnswer: 'A', explanation: 'The Battle of Plassey was fought on 23 June 1757 between the British East India Company and the Nawab of Bengal.', subject: 'General Awareness' },
  { id: 'ga-8', questionText: 'Who wrote the book "Discovery of India"?', optionA: 'Mahatma Gandhi', optionB: 'Jawaharlal Nehru', optionC: 'Sardar Patel', optionD: 'B.R. Ambedkar', correctAnswer: 'B', explanation: '"Discovery of India" was written by Jawaharlal Nehru during his imprisonment in 1944 at Ahmednagar Fort.', subject: 'General Awareness' },
  { id: 'ga-9', questionText: 'Which is the national bird of India?', optionA: 'Sparrow', optionB: 'Parrot', optionC: 'Peacock', optionD: 'Eagle', correctAnswer: 'C', explanation: 'The Indian Peacock (Pavo cristatus) was declared the national bird of India in 1963.', subject: 'General Awareness' },
  { id: 'ga-10', questionText: 'The currency of Japan is?', optionA: 'Won', optionB: 'Yuan', optionC: 'Yen', optionD: 'Ringgit', correctAnswer: 'C', explanation: 'The Japanese Yen is the official currency of Japan. It is the third most traded currency in the foreign exchange market.', subject: 'General Awareness' },
  { id: 'ga-11', questionText: 'Which vitamin is deficient in a person suffering from Scurvy?', optionA: 'Vitamin A', optionB: 'Vitamin B', optionC: 'Vitamin C', optionD: 'Vitamin K', correctAnswer: 'C', explanation: 'Scurvy is caused by deficiency of Vitamin C (Ascorbic acid). It leads to bleeding gums and weakness.', subject: 'General Awareness' },
  { id: 'ga-12', questionText: 'The Tropic of Cancer passes through how many Indian states?', optionA: '6', optionB: '7', optionC: '8', optionD: '9', correctAnswer: 'C', explanation: 'The Tropic of Cancer passes through 8 Indian states: Gujarat, Rajasthan, MP, Chhattisgarh, Jharkhand, WB, Tripura, and Mizoram.', subject: 'General Awareness' },
  { id: 'ga-13', questionText: 'Which gas is used in fire extinguishers?', optionA: 'Oxygen', optionB: 'Carbon Dioxide', optionC: 'Nitrogen', optionD: 'Helium', correctAnswer: 'B', explanation: 'Carbon Dioxide (CO2) is commonly used in fire extinguishers as it cuts off the oxygen supply and cools the fire.', subject: 'General Awareness' },
  { id: 'ga-14', questionText: 'Who was the first woman Governor of an Indian state?', optionA: 'Sarojini Naidu', optionB: 'Indira Gandhi', optionC: 'Vijaya Lakshmi Pandit', optionD: 'Sucheta Kriplani', correctAnswer: 'A', explanation: 'Sarojini Naidu was the first woman Governor of an Indian state (United Provinces, now UP) from 1947 to 1949.', subject: 'General Awareness' },
  { id: 'ga-15', questionText: 'The headquarters of UNESCO is located in?', optionA: 'New York', optionB: 'London', optionC: 'Paris', optionD: 'Rome', correctAnswer: 'C', explanation: 'UNESCO headquarters is in Paris, France. It was established on 16 November 1945.', subject: 'General Awareness' },
  { id: 'ga-16', questionText: 'Which is the longest dam in India?', optionA: 'Bhakra Nangal Dam', optionB: 'Hirakud Dam', optionC: 'Tehri Dam', optionD: 'Sardar Sarovar Dam', correctAnswer: 'B', explanation: 'Hirakud Dam on the Mahanadi River in Odisha is the longest dam in India at 25.8 km.', subject: 'General Awareness' },
  { id: 'ga-17', questionText: 'The Quit India Movement was launched in which year?', optionA: '1940', optionB: '1942', optionC: '1944', optionD: '1946', correctAnswer: 'B', explanation: 'The Quit India Movement was launched on 8 August 1942 by Mahatma Gandhi at the Bombay session of AICC.', subject: 'General Awareness' },
  { id: 'ga-18', questionText: 'Which organ in the human body produces insulin?', optionA: 'Liver', optionB: 'Kidney', optionC: 'Pancreas', optionD: 'Stomach', correctAnswer: 'C', explanation: 'The Pancreas produces insulin through its beta cells in the Islets of Langerhans.', subject: 'General Awareness' },
  { id: 'ga-19', questionText: 'Which is the largest continent in the world by area?', optionA: 'Africa', optionB: 'North America', optionC: 'Europe', optionD: 'Asia', correctAnswer: 'D', explanation: 'Asia is the largest continent by area covering about 44.58 million sq km, about 30% of Earth\'s land area.', subject: 'General Awareness' },
  { id: 'ga-20', questionText: 'The Jallianwala Bagh Massacre occurred on which date?', optionA: '13 April 1919', optionB: '23 March 1919', optionC: '13 April 1920', optionD: '23 March 1920', correctAnswer: 'A', explanation: 'The Jallianwala Bagh Massacre took place on 13 April 1919 in Amritsar, Punjab, under the command of General Dyer.', subject: 'General Awareness' },
]

const MATH_QUESTIONS: LocalQuestion[] = [
  { id: 'math-1', questionText: 'If the selling price of an article is Rs. 240 and the profit is 20%, what is the cost price?', optionA: 'Rs. 180', optionB: 'Rs. 200', optionC: 'Rs. 220', optionD: 'Rs. 192', correctAnswer: 'B', explanation: 'CP = SP / (1 + Profit%) = 240 / 1.2 = Rs. 200', subject: 'Quantitative Aptitude' },
  { id: 'math-2', questionText: 'A train 150m long passes a pole in 15 seconds. What is the speed of the train?', optionA: '36 km/h', optionB: '40 km/h', optionC: '30 km/h', optionD: '45 km/h', correctAnswer: 'A', explanation: 'Speed = 150/15 = 10 m/s = 10 x 3.6 = 36 km/h', subject: 'Quantitative Aptitude' },
  { id: 'math-3', questionText: 'What is the simple interest on Rs. 5000 at 8% per annum for 3 years?', optionA: 'Rs. 1000', optionB: 'Rs. 1200', optionC: 'Rs. 1500', optionD: 'Rs. 800', correctAnswer: 'B', explanation: 'SI = P x R x T / 100 = 5000 x 8 x 3 / 100 = Rs. 1200', subject: 'Quantitative Aptitude' },
  { id: 'math-4', questionText: 'The ratio of the ages of A and B is 3:5. If A is 15 years old, what is the age of B?', optionA: '20 years', optionB: '25 years', optionC: '30 years', optionD: '35 years', correctAnswer: 'B', explanation: 'A:B = 3:5, A = 15, so 3 parts = 15, 1 part = 5, B = 5 x 5 = 25 years', subject: 'Quantitative Aptitude' },
  { id: 'math-5', questionText: 'A can do a piece of work in 10 days and B can do it in 15 days. In how many days can they finish it together?', optionA: '5 days', optionB: '6 days', optionC: '8 days', optionD: '12 days', correctAnswer: 'B', explanation: 'A\'s 1 day work = 1/10, B\'s 1 day work = 1/15. Together = 1/10 + 1/15 = 5/30 = 1/6. So 6 days.', subject: 'Quantitative Aptitude' },
  { id: 'math-6', questionText: 'What is 25% of 80% of 500?', optionA: '80', optionB: '100', optionC: '120', optionD: '75', correctAnswer: 'B', explanation: '80% of 500 = 400. 25% of 400 = 100', subject: 'Quantitative Aptitude' },
  { id: 'math-7', questionText: 'If the perimeter of a rectangle is 40 cm and its length is 12 cm, what is its breadth?', optionA: '8 cm', optionB: '10 cm', optionC: '6 cm', optionD: '14 cm', correctAnswer: 'A', explanation: 'Perimeter = 2(l+b), 40 = 2(12+b), 20 = 12+b, b = 8 cm', subject: 'Quantitative Aptitude' },
  { id: 'math-8', questionText: 'The average of 5 numbers is 20. If one number is removed, the average becomes 18. What is the removed number?', optionA: '28', optionB: '26', optionC: '30', optionD: '24', correctAnswer: 'A', explanation: 'Sum of 5 = 5 x 20 = 100. Sum of 4 = 4 x 18 = 72. Removed number = 100 - 72 = 28', subject: 'Quantitative Aptitude' },
  { id: 'math-9', questionText: 'A shopkeeper gives two successive discounts of 20% and 10% on an item. What is the overall discount?', optionA: '30%', optionB: '28%', optionC: '32%', optionD: '25%', correctAnswer: 'B', explanation: 'Single equivalent discount = 20 + 10 - (20 x 10)/100 = 30 - 2 = 28%', subject: 'Quantitative Aptitude' },
  { id: 'math-10', questionText: 'If x + y = 12 and xy = 32, what is x² + y²?', optionA: '64', optionB: '80', optionC: '72', optionD: '96', correctAnswer: 'B', explanation: 'x² + y² = (x+y)² - 2xy = 144 - 64 = 80', subject: 'Quantitative Aptitude' },
  { id: 'math-11', questionText: 'In how many years will Rs. 8000 amount to Rs. 9240 at 5% simple interest per annum?', optionA: '2.5 years', optionB: '3 years', optionC: '3.5 years', optionD: '3.1 years', correctAnswer: 'D', explanation: 'SI = 9240 - 8000 = 1240. T = (1240 x 100)/(8000 x 5) = 124000/40000 = 3.1 years', subject: 'Quantitative Aptitude' },
  { id: 'math-12', questionText: 'A car covers a distance of 360 km in 5 hours. What is its speed in m/s?', optionA: '20 m/s', optionB: '18 m/s', optionC: '15 m/s', optionD: '22 m/s', correctAnswer: 'A', explanation: 'Speed = 360/5 = 72 km/h = 72 x 5/18 = 20 m/s', subject: 'Quantitative Aptitude' },
  { id: 'math-13', questionText: 'What is the LCM of 12, 18, and 24?', optionA: '48', optionB: '72', optionC: '96', optionD: '36', correctAnswer: 'B', explanation: 'LCM of 12, 18, 24 = 2³ x 3² = 8 x 9 = 72', subject: 'Quantitative Aptitude' },
  { id: 'math-14', questionText: 'If 3x - 7 = 14, what is the value of x?', optionA: '5', optionB: '6', optionC: '7', optionD: '8', correctAnswer: 'C', explanation: '3x = 14 + 7 = 21, x = 7', subject: 'Quantitative Aptitude' },
  { id: 'math-15', questionText: 'A rectangle has an area of 120 sq cm and a side of 8 cm. What is its perimeter?', optionA: '46 cm', optionB: '44 cm', optionC: '40 cm', optionD: '38 cm', correctAnswer: 'A', explanation: 'Other side = 120/8 = 15 cm. Perimeter = 2(8+15) = 46 cm', subject: 'Quantitative Aptitude' },
]

const REASONING_QUESTIONS: LocalQuestion[] = [
  { id: 'reason-1', questionText: 'Complete the series: 2, 6, 12, 20, 30, ?', optionA: '40', optionB: '42', optionC: '44', optionD: '36', correctAnswer: 'B', explanation: 'Differences are 4, 6, 8, 10, 12. So 30 + 12 = 42', subject: 'Reasoning' },
  { id: 'reason-2', questionText: 'If APPLE is coded as ELPPA, then ORANGE is coded as?', optionA: 'EGNARO', optionB: 'ORANGE', optionC: 'EGANRO', optionD: 'ORNEGA', correctAnswer: 'A', explanation: 'The word is reversed. ORANGE reversed is EGNARO.', subject: 'Reasoning' },
  { id: 'reason-3', questionText: 'In a row of 40 students, Ravi is 7th from the left and Sumit is 12th from the right. How many students are between them?', optionA: '21', optionB: '22', optionC: '20', optionD: '23', correctAnswer: 'A', explanation: 'Students between them = 40 - 7 - 12 = 21', subject: 'Reasoning' },
  { id: 'reason-4', questionText: 'Find the odd one out: 3, 5, 11, 14, 17, 21', optionA: '3', optionB: '14', optionC: '17', optionD: '21', correctAnswer: 'B', explanation: '14 is the only even number. All others are odd numbers.', subject: 'Reasoning' },
  { id: 'reason-5', questionText: 'If South-East becomes North, then what does North-West become?', optionA: 'South', optionB: 'East', optionC: 'North-East', optionD: 'West', correctAnswer: 'C', explanation: 'SE to N is a 135° anticlockwise rotation. Applying the same to NW: NW rotated 135° anticlockwise becomes NE.', subject: 'Reasoning' },
  { id: 'reason-6', questionText: 'A is B\'s brother. C is A\'s mother. D is C\'s father. How is B related to D?', optionA: 'Grandson', optionB: 'Granddaughter', optionC: 'Grandson or Granddaughter', optionD: 'Grandfather', correctAnswer: 'C', explanation: 'B is A\'s sibling, C is their mother, D is C\'s father (their grandfather). B\'s gender is unknown.', subject: 'Reasoning' },
  { id: 'reason-7', questionText: 'Complete the analogy: Pen : Writer :: Needle : ?', optionA: 'Tailor', optionB: 'Thread', optionC: 'Cloth', optionD: 'Sewing', correctAnswer: 'A', explanation: 'A pen is a tool used by a writer. Similarly, a needle is a tool used by a tailor.', subject: 'Reasoning' },
  { id: 'reason-8', questionText: 'Which number replaces the question mark? 4 : 17 :: 5 : ?', optionA: '24', optionB: '26', optionC: '28', optionD: '22', correctAnswer: 'B', explanation: '4² + 1 = 17, similarly 5² + 1 = 26', subject: 'Reasoning' },
  { id: 'reason-9', questionText: 'If FRIEND is coded as HUMGPF, then CANDLE is coded as?', optionA: 'ECRDLG', optionB: 'EDPFNG', optionC: 'DCPFNG', optionD: 'ECPFNG', correctAnswer: 'B', explanation: 'Each letter is shifted by 2 positions forward. CANDLE + 2 = ECPfNG → EDPFNG.', subject: 'Reasoning' },
  { id: 'reason-10', questionText: 'In a coded language, 247 means "spread red carpet"; 256 means "red carpet welcome". What is the code for "carpet"?', optionA: '2', optionB: '4', optionC: '5', optionD: '7', correctAnswer: 'A', explanation: 'Common words in both: "red" and "carpet". Common digits: 2. Since 4 and 7 are in first only, and 5 and 6 in second only, "carpet" = 2.', subject: 'Reasoning' },
  { id: 'reason-11', questionText: 'Find the missing number: 1, 1, 2, 6, 24, ?', optionA: '48', optionB: '96', optionC: '120', optionD: '144', correctAnswer: 'C', explanation: '1x1=1, 1x2=2, 2x3=6, 6x4=24, 24x5=120. Multiplying by consecutive numbers.', subject: 'Reasoning' },
  { id: 'reason-12', questionText: 'Pointing to a photograph, a man says "She is the daughter of my grandfather\'s only son." How is the woman related to the man?', optionA: 'Sister', optionB: 'Mother', optionC: 'Aunt', optionD: 'Daughter', correctAnswer: 'A', explanation: 'Grandfather\'s only son = Father. Daughter of father = Sister.', subject: 'Reasoning' },
  { id: 'reason-13', questionText: 'If the day after tomorrow is Sunday, what day was it day before yesterday?', optionA: 'Wednesday', optionB: 'Thursday', optionC: 'Tuesday', optionD: 'Friday', correctAnswer: 'A', explanation: 'Day after tomorrow = Sunday, so today = Friday, yesterday = Thursday, day before yesterday = Wednesday.', subject: 'Reasoning' },
  { id: 'reason-14', questionText: 'Find the odd one out: Cricket, Football, Hockey, Chess', optionA: 'Cricket', optionB: 'Football', optionC: 'Hockey', optionD: 'Chess', correctAnswer: 'D', explanation: 'Chess is an indoor game, while the others are outdoor games.', subject: 'Reasoning' },
  { id: 'reason-15', questionText: 'Complete: AZ, BY, CX, ?', optionA: 'DW', optionB: 'DE', optionC: 'EV', optionD: 'WD', correctAnswer: 'A', explanation: 'First letter moves forward (A→B→C→D), second letter moves backward (Z→Y→X→W). So DW.', subject: 'Reasoning' },
]

const ENGLISH_QUESTIONS: LocalQuestion[] = [
  { id: 'eng-1', questionText: 'Choose the correct synonym of "Benevolent":', optionA: 'Cruel', optionB: 'Kind', optionC: 'Angry', optionD: 'Silly', correctAnswer: 'B', explanation: 'Benevolent means kind, generous, and charitable.', subject: 'English' },
  { id: 'eng-2', questionText: 'Choose the correct antonym of "Abundant":', optionA: 'Plentiful', optionB: 'Scarce', optionC: 'Sufficient', optionD: 'Ample', correctAnswer: 'B', explanation: 'Abundant means plentiful. Its antonym is Scarce (insufficient).', subject: 'English' },
  { id: 'eng-3', questionText: 'Fill in the blank: She has been living here _____ 2010.', optionA: 'from', optionB: 'since', optionC: 'for', optionD: 'by', correctAnswer: 'B', explanation: '"Since" is used with a specific point in time (2010), while "for" is used with a duration.', subject: 'English' },
  { id: 'eng-4', questionText: 'Identify the error: "Neither of the boys have done their homework."', optionA: 'Neither', optionB: 'have', optionC: 'done', optionD: 'their', correctAnswer: 'B', explanation: '"Neither" takes a singular verb. It should be "has" instead of "have".', subject: 'English' },
  { id: 'eng-5', questionText: 'Choose the correctly spelt word:', optionA: 'Accomodation', optionB: 'Accommodation', optionC: 'Acommodation', optionD: 'Acomodation', correctAnswer: 'B', explanation: 'The correct spelling is "Accommodation" with double \'c\' and double \'m\'.', subject: 'English' },
  { id: 'eng-6', questionText: 'What is the meaning of the idiom "To burn the midnight oil"?', optionA: 'To waste oil', optionB: 'To work late at night', optionC: 'To start a fire', optionD: 'To sleep early', correctAnswer: 'B', explanation: 'To burn the midnight oil means to study or work late into the night.', subject: 'English' },
  { id: 'eng-7', questionText: 'Choose the correct passive voice: "She writes a letter."', optionA: 'A letter is written by her.', optionB: 'A letter was written by her.', optionC: 'A letter has been written by her.', optionD: 'A letter will be written by her.', correctAnswer: 'A', explanation: 'Present Simple Active becomes Present Simple Passive: is + V3.', subject: 'English' },
  { id: 'eng-8', questionText: 'Choose the one word substitution for "A person who loves books":', optionA: 'Bibliophile', optionB: 'Bibliophobe', optionC: 'Philanthropist', optionD: 'Misanthrope', correctAnswer: 'A', explanation: 'A Bibliophile is a person who loves and collects books.', subject: 'English' },
  { id: 'eng-9', questionText: 'Fill in the blank: I wish I _____ a millionaire.', optionA: 'am', optionB: 'was', optionC: 'were', optionD: 'be', correctAnswer: 'C', explanation: 'In subjunctive mood (expressing wish), "were" is used for all subjects, not "was".', subject: 'English' },
  { id: 'eng-10', questionText: 'Choose the correct indirect speech: He said, "I am going to Delhi tomorrow."', optionA: 'He said that he is going to Delhi tomorrow.', optionB: 'He said that he was going to Delhi the next day.', optionC: 'He said that he was going to Delhi tomorrow.', optionD: 'He said that he is going to Delhi the next day.', correctAnswer: 'B', explanation: 'In indirect speech, present becomes past, and "tomorrow" becomes "the next day".', subject: 'English' },
  { id: 'eng-11', questionText: 'Choose the synonym of "Eloquent":', optionA: 'Silent', optionB: 'Fluent', optionC: 'Confused', optionD: 'Angry', correctAnswer: 'B', explanation: 'Eloquent means fluent and persuasive in speaking or writing.', subject: 'English' },
  { id: 'eng-12', questionText: 'What is the plural of "Child"?', optionA: 'Childs', optionB: 'Children', optionC: 'Childrens', optionD: 'Childes', correctAnswer: 'B', explanation: 'The plural of "child" is "children". This is an irregular plural.', subject: 'English' },
  { id: 'eng-13', questionText: 'Identify the part of speech of the underlined word: "She ran quickly."', optionA: 'Adjective', optionB: 'Adverb', optionC: 'Noun', optionD: 'Verb', correctAnswer: 'B', explanation: 'Quickly is an adverb that modifies the verb "ran", describing how she ran.', subject: 'English' },
  { id: 'eng-14', questionText: 'Choose the correct preposition: He is fond _____ music.', optionA: 'of', optionB: 'in', optionC: 'at', optionD: 'with', correctAnswer: 'A', explanation: '"Fond of" is the correct phrase meaning to like something very much.', subject: 'English' },
  { id: 'eng-15', questionText: 'What does the phrase "A bolt from the blue" mean?', optionA: 'Lightning strike', optionB: 'A sudden shock or surprise', optionC: 'A type of weather', optionD: 'Blue colored bolt', correctAnswer: 'B', explanation: 'A bolt from the blue means a sudden and unexpected event or surprise.', subject: 'English' },
]

const SCIENCE_QUESTIONS: LocalQuestion[] = [
  { id: 'sci-1', questionText: 'Which gas is filled in electric bulbs?', optionA: 'Oxygen', optionB: 'Nitrogen', optionC: 'Argon', optionD: 'Carbon dioxide', correctAnswer: 'C', explanation: 'Argon or Nitrogen is filled in electric bulbs to prevent the filament from oxidizing.', subject: 'Science' },
  { id: 'sci-2', questionText: 'What is the chemical formula of Baking Soda?', optionA: 'NaCl', optionB: 'NaHCO3', optionC: 'Na2CO3', optionD: 'NaOH', correctAnswer: 'B', explanation: 'Baking soda is Sodium Bicarbonate (NaHCO3).', subject: 'Science' },
  { id: 'sci-3', questionText: 'Which planet has the most number of moons?', optionA: 'Jupiter', optionB: 'Saturn', optionC: 'Uranus', optionD: 'Neptune', correctAnswer: 'B', explanation: 'Saturn has the most confirmed moons (146+) as of recent discoveries, surpassing Jupiter.', subject: 'Science' },
  { id: 'sci-4', questionText: 'The pH value of human blood is approximately?', optionA: '6.4', optionB: '7.0', optionC: '7.4', optionD: '8.0', correctAnswer: 'C', explanation: 'Normal human blood pH is approximately 7.35-7.45, which is slightly alkaline.', subject: 'Science' },
  { id: 'sci-5', questionText: 'Which vitamin is also known as Ascorbic Acid?', optionA: 'Vitamin A', optionB: 'Vitamin B', optionC: 'Vitamin C', optionD: 'Vitamin D', correctAnswer: 'C', explanation: 'Vitamin C is chemically known as Ascorbic Acid. It is water-soluble and essential for immunity.', subject: 'Science' },
  { id: 'sci-6', questionText: 'What is the unit of electric resistance?', optionA: 'Ampere', optionB: 'Volt', optionC: 'Ohm', optionD: 'Watt', correctAnswer: 'C', explanation: 'Ohm is the SI unit of electrical resistance, named after Georg Ohm.', subject: 'Science' },
  { id: 'sci-7', questionText: 'Which is the hardest naturally occurring substance?', optionA: 'Gold', optionB: 'Iron', optionC: 'Diamond', optionD: 'Platinum', correctAnswer: 'C', explanation: 'Diamond is the hardest naturally occurring substance, rating 10 on the Mohs scale.', subject: 'Science' },
  { id: 'sci-8', questionText: 'The process of conversion of solid directly into gas is called?', optionA: 'Evaporation', optionB: 'Condensation', optionC: 'Sublimation', optionD: 'Deposition', correctAnswer: 'C', explanation: 'Sublimation is the process where a solid changes directly to gas without passing through the liquid state.', subject: 'Science' },
  { id: 'sci-9', questionText: 'Which organelle is known as the powerhouse of the cell?', optionA: 'Nucleus', optionB: 'Ribosome', optionC: 'Mitochondria', optionD: 'Golgi body', correctAnswer: 'C', explanation: 'Mitochondria produce ATP (energy) through cellular respiration, hence called the powerhouse of the cell.', subject: 'Science' },
  { id: 'sci-10', questionText: 'The chemical formula of Sulphuric Acid is?', optionA: 'HCl', optionB: 'HNO3', optionC: 'H2SO4', optionD: 'H3PO4', correctAnswer: 'C', explanation: 'Sulphuric Acid (H2SO4) is known as the king of chemicals due to its wide industrial use.', subject: 'Science' },
]

// Helper: pick N random questions from a pool
function pickQuestions(pool: LocalQuestion[], count: number): LocalQuestion[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const picked = shuffled.slice(0, count)
  // If not enough questions, repeat with modified IDs
  if (picked.length < count) {
    let extra = count - picked.length
    let idx = 0
    while (extra > 0) {
      const q = pool[idx % pool.length]
      picked.push({ ...q, id: `${q.id}-r${idx}` })
      idx++
      extra--
    }
  }
  return picked
}

// Helper: mix questions from multiple subjects
function mixQuestions(subjects: LocalQuestion[][], count: number): LocalQuestion[] {
  const combined = subjects.flat()
  return pickQuestions(combined, count)
}

// ===== All Mock Tests =====
export const ALL_TESTS: LocalTest[] = [
  // ===== SSC CGL Tests =====
  { id: 'test-ssc-cgl-1', examId: 'ssc-cgl', title: 'SSC CGL Mock Test 1 - GA & Reasoning', description: 'Full length mock test for SSC CGL Tier-I', duration: 60, totalMarks: 200, passingMarks: 120, questions: mixQuestions([GA_QUESTIONS, REASONING_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Medium' },
  { id: 'test-ssc-cgl-2', examId: 'ssc-cgl', title: 'SSC CGL Mock Test 2 - Quant & English', description: 'Practice test for SSC CGL Tier-I', duration: 60, totalMarks: 200, passingMarks: 120, questions: mixQuestions([MATH_QUESTIONS, ENGLISH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Medium' },
  { id: 'test-ssc-cgl-3', examId: 'ssc-cgl', title: 'SSC CGL Mock Test 3 - Mixed', description: 'Comprehensive mock test all subjects', duration: 60, totalMarks: 200, passingMarks: 120, questions: mixQuestions([GA_QUESTIONS, MATH_QUESTIONS, REASONING_QUESTIONS, ENGLISH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Hard' },
  { id: 'test-ssc-cgl-4', examId: 'ssc-cgl', title: 'SSC CGL Mock Test 4 - Prelims', description: 'SSC CGL Tier-I prelims practice', duration: 60, totalMarks: 200, passingMarks: 120, questions: mixQuestions([GA_QUESTIONS, MATH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Easy' },

  // ===== SSC CHSL Tests =====
  { id: 'test-ssc-chsl-1', examId: 'ssc-chsl', title: 'SSC CHSL Mock Test 1', description: 'Full length mock test for SSC CHSL Tier-I', duration: 60, totalMarks: 200, passingMarks: 120, questions: mixQuestions([GA_QUESTIONS, REASONING_QUESTIONS, MATH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Medium' },
  { id: 'test-ssc-chsl-2', examId: 'ssc-chsl', title: 'SSC CHSL Mock Test 2', description: 'Practice test for SSC CHSL', duration: 60, totalMarks: 200, passingMarks: 120, questions: mixQuestions([ENGLISH_QUESTIONS, GA_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Easy' },
  { id: 'test-ssc-chsl-3', examId: 'ssc-chsl', title: 'SSC CHSL Mock Test 3 - Advanced', description: 'Advanced practice for SSC CHSL', duration: 60, totalMarks: 200, passingMarks: 120, questions: mixQuestions([MATH_QUESTIONS, REASONING_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Hard' },

  // ===== SSC MTS Tests =====
  { id: 'test-ssc-mts-1', examId: 'ssc-mts', title: 'SSC MTS Mock Test 1', description: 'Full length mock test for SSC MTS', duration: 90, totalMarks: 100, passingMarks: 50, questions: mixQuestions([GA_QUESTIONS, MATH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Easy' },
  { id: 'test-ssc-mts-2', examId: 'ssc-mts', title: 'SSC MTS Mock Test 2', description: 'Practice test for SSC MTS Paper-I', duration: 90, totalMarks: 100, passingMarks: 50, questions: mixQuestions([REASONING_QUESTIONS, ENGLISH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Easy' },

  // ===== SSC GD Tests =====
  { id: 'test-ssc-gd-1', examId: 'ssc-gd', title: 'SSC GD Constable Mock Test 1', description: 'Full mock test for SSC GD Constable', duration: 90, totalMarks: 100, passingMarks: 50, questions: mixQuestions([GA_QUESTIONS, MATH_QUESTIONS, REASONING_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Easy' },
  { id: 'test-ssc-gd-2', examId: 'ssc-gd', title: 'SSC GD Constable Mock Test 2', description: 'Practice test for SSC GD', duration: 90, totalMarks: 100, passingMarks: 50, questions: mixQuestions([GA_QUESTIONS, ENGLISH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Medium' },

  // ===== SSC Stenographer =====
  { id: 'test-ssc-steno-1', examId: 'ssc-stenographer', title: 'SSC Stenographer Mock Test 1', description: 'Mock test for SSC Stenographer Grade C & D', duration: 60, totalMarks: 200, passingMarks: 120, questions: mixQuestions([GA_QUESTIONS, ENGLISH_QUESTIONS, REASONING_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Medium' },

  // ===== IBPS PO Tests =====
  { id: 'test-ibps-po-1', examId: 'ibps-po', title: 'IBPS PO Prelims Mock Test 1', description: 'Full mock test for IBPS PO Prelims', duration: 60, totalMarks: 100, passingMarks: 60, questions: mixQuestions([ENGLISH_QUESTIONS, MATH_QUESTIONS, REASONING_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Hard' },
  { id: 'test-ibps-po-2', examId: 'ibps-po', title: 'IBPS PO Prelims Mock Test 2', description: 'Practice test for IBPS PO', duration: 60, totalMarks: 100, passingMarks: 60, questions: mixQuestions([MATH_QUESTIONS, REASONING_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Hard' },
  { id: 'test-ibps-po-3', examId: 'ibps-po', title: 'IBPS PO Mains Mock Test 1', description: 'Full mock for IBPS PO Mains exam', duration: 120, totalMarks: 200, passingMarks: 120, questions: mixQuestions([GA_QUESTIONS, MATH_QUESTIONS, ENGLISH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Hard' },

  // ===== IBPS Clerk Tests =====
  { id: 'test-ibps-clerk-1', examId: 'ibps-clerk', title: 'IBPS Clerk Prelims Mock Test 1', description: 'Full mock test for IBPS Clerk Prelims', duration: 60, totalMarks: 100, passingMarks: 60, questions: mixQuestions([ENGLISH_QUESTIONS, MATH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Medium' },
  { id: 'test-ibps-clerk-2', examId: 'ibps-clerk', title: 'IBPS Clerk Prelims Mock Test 2', description: 'Practice test for IBPS Clerk', duration: 60, totalMarks: 100, passingMarks: 60, questions: mixQuestions([REASONING_QUESTIONS, ENGLISH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Medium' },

  // ===== SBI PO Tests =====
  { id: 'test-sbi-po-1', examId: 'sbi-po', title: 'SBI PO Prelims Mock Test 1', description: 'Full mock test for SBI PO Prelims', duration: 60, totalMarks: 100, passingMarks: 60, questions: mixQuestions([ENGLISH_QUESTIONS, MATH_QUESTIONS, REASONING_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Hard' },
  { id: 'test-sbi-po-2', examId: 'sbi-po', title: 'SBI PO Practice Test 2', description: 'Practice test for SBI PO', duration: 60, totalMarks: 100, passingMarks: 60, questions: mixQuestions([MATH_QUESTIONS, GA_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Hard' },

  // ===== SBI Clerk Tests =====
  { id: 'test-sbi-clerk-1', examId: 'sbi-clerk', title: 'SBI Clerk Prelims Mock Test 1', description: 'Full mock test for SBI Clerk Prelims', duration: 60, totalMarks: 100, passingMarks: 60, questions: mixQuestions([ENGLISH_QUESTIONS, MATH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Medium' },
  { id: 'test-sbi-clerk-2', examId: 'sbi-clerk', title: 'SBI Clerk Practice Test 2', description: 'Practice test for SBI Clerk', duration: 60, totalMarks: 100, passingMarks: 60, questions: mixQuestions([REASONING_QUESTIONS, ENGLISH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Easy' },

  // ===== RBI Assistant =====
  { id: 'test-rbi-asst-1', examId: 'rbi-assistant', title: 'RBI Assistant Mock Test 1', description: 'Full mock test for RBI Assistant Prelims', duration: 60, totalMarks: 100, passingMarks: 60, questions: mixQuestions([ENGLISH_QUESTIONS, MATH_QUESTIONS, REASONING_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Hard' },

  // ===== IBPS RRB =====
  { id: 'test-ibps-rrb-1', examId: 'ibps-rrb', title: 'IBPS RRB Officer Mock Test 1', description: 'Mock test for IBPS RRB Officer Scale I', duration: 45, totalMarks: 80, passingMarks: 48, questions: mixQuestions([MATH_QUESTIONS, REASONING_QUESTIONS], 20), createdAt: new Date().toISOString(), difficulty: 'Medium' },
  { id: 'test-ibps-rrb-2', examId: 'ibps-rrb', title: 'IBPS RRB Office Assistant Mock Test 2', description: 'Mock test for IBPS RRB Office Assistant', duration: 45, totalMarks: 80, passingMarks: 48, questions: mixQuestions([ENGLISH_QUESTIONS, GA_QUESTIONS], 20), createdAt: new Date().toISOString(), difficulty: 'Easy' },

  // ===== RRB NTPC Tests =====
  { id: 'test-rrb-ntpc-1', examId: 'rrb-ntpc', title: 'RRB NTPC CBT-1 Mock Test 1', description: 'Full mock test for RRB NTPC CBT-1', duration: 90, totalMarks: 100, passingMarks: 50, questions: mixQuestions([GA_QUESTIONS, MATH_QUESTIONS, REASONING_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Medium' },
  { id: 'test-rrb-ntpc-2', examId: 'rrb-ntpc', title: 'RRB NTPC CBT-2 Mock Test 2', description: 'Practice test for RRB NTPC CBT-2', duration: 90, totalMarks: 100, passingMarks: 50, questions: mixQuestions([GA_QUESTIONS, SCIENCE_QUESTIONS, MATH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Hard' },
  { id: 'test-rrb-ntpc-3', examId: 'rrb-ntpc', title: 'RRB NTPC Practice Set 3', description: 'Quick practice for RRB NTPC', duration: 90, totalMarks: 100, passingMarks: 50, questions: mixQuestions([REASONING_QUESTIONS, GA_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Easy' },

  // ===== RRB Group D Tests =====
  { id: 'test-rrb-gd-1', examId: 'rrb-group-d', title: 'RRB Group D Mock Test 1', description: 'Full mock test for RRB Group D', duration: 90, totalMarks: 100, passingMarks: 50, questions: mixQuestions([GA_QUESTIONS, MATH_QUESTIONS, SCIENCE_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Medium' },
  { id: 'test-rrb-gd-2', examId: 'rrb-group-d', title: 'RRB Group D Mock Test 2', description: 'Practice test for RRB Group D', duration: 90, totalMarks: 100, passingMarks: 50, questions: mixQuestions([SCIENCE_QUESTIONS, MATH_QUESTIONS, GA_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Easy' },

  // ===== RRB JE =====
  { id: 'test-rrb-je-1', examId: 'rrb-je', title: 'RRB JE CBT-1 Mock Test 1', description: 'Mock test for RRB Junior Engineer', duration: 90, totalMarks: 100, passingMarks: 50, questions: mixQuestions([MATH_QUESTIONS, REASONING_QUESTIONS, SCIENCE_QUESTIONS, GA_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Hard' },

  // ===== RRB ALP =====
  { id: 'test-rrb-alp-1', examId: 'rrb-alp', title: 'RRB ALP CBT-1 Mock Test 1', description: 'Mock test for RRB Assistant Loco Pilot', duration: 60, totalMarks: 75, passingMarks: 38, questions: mixQuestions([MATH_QUESTIONS, SCIENCE_QUESTIONS, GA_QUESTIONS], 20), createdAt: new Date().toISOString(), difficulty: 'Medium' },

  // ===== CTET Tests =====
  { id: 'test-ctet-1', examId: 'ctet', title: 'CTET Paper-I Mock Test 1', description: 'Child Development & Pedagogy mock test', duration: 150, totalMarks: 150, passingMarks: 90, questions: mixQuestions([GA_QUESTIONS, ENGLISH_QUESTIONS, MATH_QUESTIONS], 30), createdAt: new Date().toISOString(), difficulty: 'Medium' },
  { id: 'test-ctet-2', examId: 'ctet', title: 'CTET Paper-II Mock Test 2', description: 'Practice test for CTET Paper-II', duration: 150, totalMarks: 150, passingMarks: 90, questions: mixQuestions([ENGLISH_QUESTIONS, GA_QUESTIONS, SCIENCE_QUESTIONS], 30), createdAt: new Date().toISOString(), difficulty: 'Medium' },

  // ===== UPTET Tests =====
  { id: 'test-uptet-1', examId: 'uptet', title: 'UPTET Paper-I Mock Test 1', description: 'Full mock test for UPTET Paper-I', duration: 150, totalMarks: 150, passingMarks: 90, questions: mixQuestions([GA_QUESTIONS, ENGLISH_QUESTIONS, MATH_QUESTIONS], 30), createdAt: new Date().toISOString(), difficulty: 'Easy' },

  // ===== KVS Tests =====
  { id: 'test-kvs-1', examId: 'kvs', title: 'KVS PRT Mock Test 1', description: 'Mock test for KVS Primary Teacher', duration: 150, totalMarks: 150, passingMarks: 90, questions: mixQuestions([GA_QUESTIONS, ENGLISH_QUESTIONS, REASONING_QUESTIONS], 30), createdAt: new Date().toISOString(), difficulty: 'Medium' },

  // ===== NDA Tests =====
  { id: 'test-nda-1', examId: 'nda', title: 'NDA Mathematics Mock Test 1', description: 'Mathematics paper for NDA exam', duration: 150, totalMarks: 900, passingMarks: 450, questions: mixQuestions([MATH_QUESTIONS, SCIENCE_QUESTIONS], 30), createdAt: new Date().toISOString(), difficulty: 'Hard' },
  { id: 'test-nda-2', examId: 'nda', title: 'NDA GAT Mock Test 2', description: 'General Ability Test for NDA exam', duration: 150, totalMarks: 900, passingMarks: 450, questions: mixQuestions([GA_QUESTIONS, ENGLISH_QUESTIONS, SCIENCE_QUESTIONS], 30), createdAt: new Date().toISOString(), difficulty: 'Hard' },

  // ===== CDS Tests =====
  { id: 'test-cds-1', examId: 'cds', title: 'CDS General Knowledge Mock Test 1', description: 'GK paper for CDS exam', duration: 120, totalMarks: 120, passingMarks: 60, questions: mixQuestions([GA_QUESTIONS, SCIENCE_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Medium' },
  { id: 'test-cds-2', examId: 'cds', title: 'CDS English Mock Test 2', description: 'English paper for CDS exam', duration: 120, totalMarks: 120, passingMarks: 60, questions: mixQuestions([ENGLISH_QUESTIONS, GA_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Medium' },

  // ===== AFCAT =====
  { id: 'test-afcat-1', examId: 'afcat', title: 'AFCAT Mock Test 1', description: 'Full mock test for AFCAT exam', duration: 120, totalMarks: 300, passingMarks: 150, questions: mixQuestions([GA_QUESTIONS, ENGLISH_QUESTIONS, MATH_QUESTIONS, REASONING_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Hard' },

  // ===== UPSC CSE Tests =====
  { id: 'test-upsc-1', examId: 'upsc-cse', title: 'UPSC CSAT Mock Test 1', description: 'Civil Services Aptitude Test mock', duration: 120, totalMarks: 200, passingMarks: 100, questions: mixQuestions([GA_QUESTIONS, MATH_QUESTIONS, REASONING_QUESTIONS, ENGLISH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Hard' },
  { id: 'test-upsc-2', examId: 'upsc-cse', title: 'UPSC GS Paper-I Mock Test 2', description: 'General Studies Paper I practice', duration: 120, totalMarks: 200, passingMarks: 100, questions: mixQuestions([GA_QUESTIONS, SCIENCE_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Hard' },

  // ===== UPPSC =====
  { id: 'test-uppsc-1', examId: 'uppsc', title: 'UPPSC Prelims Mock Test 1', description: 'Full mock test for UPPSC Prelims', duration: 120, totalMarks: 200, passingMarks: 100, questions: mixQuestions([GA_QUESTIONS, MATH_QUESTIONS, REASONING_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Hard' },

  // ===== MPSC =====
  { id: 'test-mpsc-1', examId: 'mpsc', title: 'MPSC Prelims Mock Test 1', description: 'Full mock test for MPSC Prelims', duration: 120, totalMarks: 200, passingMarks: 100, questions: mixQuestions([GA_QUESTIONS, SCIENCE_QUESTIONS, MATH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Hard' },

  // ===== WBPSC =====
  { id: 'test-wbpsc-1', examId: 'wbpsc', title: 'WBPSC Prelims Mock Test 1', description: 'Full mock test for WBPSC Prelims', duration: 120, totalMarks: 200, passingMarks: 100, questions: mixQuestions([GA_QUESTIONS, ENGLISH_QUESTIONS, MATH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Medium' },

  // ===== Delhi Police =====
  { id: 'test-delhi-police-1', examId: 'delhi-police', title: 'Delhi Police Constable Mock Test 1', description: 'Full mock test for Delhi Police Constable', duration: 90, totalMarks: 100, passingMarks: 50, questions: mixQuestions([GA_QUESTIONS, MATH_QUESTIONS, REASONING_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Easy' },
  { id: 'test-delhi-police-2', examId: 'delhi-police', title: 'Delhi Police Head Constable Mock Test 2', description: 'Mock test for Delhi Police Head Constable', duration: 90, totalMarks: 100, passingMarks: 50, questions: mixQuestions([ENGLISH_QUESTIONS, GA_QUESTIONS, MATH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Medium' },

  // ===== UP Police =====
  { id: 'test-up-police-1', examId: 'up-police', title: 'UP Police Constable Mock Test 1', description: 'Full mock test for UP Police Constable', duration: 120, totalMarks: 150, passingMarks: 75, questions: mixQuestions([GA_QUESTIONS, MATH_QUESTIONS, REASONING_QUESTIONS], 30), createdAt: new Date().toISOString(), difficulty: 'Easy' },
  { id: 'test-up-police-2', examId: 'up-police', title: 'UP Police SI Mock Test 2', description: 'Mock test for UP Police Sub-Inspector', duration: 120, totalMarks: 150, passingMarks: 75, questions: mixQuestions([GA_QUESTIONS, ENGLISH_QUESTIONS, MATH_QUESTIONS], 30), createdAt: new Date().toISOString(), difficulty: 'Medium' },

  // ===== CISF =====
  { id: 'test-cisf-1', examId: 'cisf', title: 'CISF Constable Mock Test 1', description: 'Full mock test for CISF Constable', duration: 90, totalMarks: 100, passingMarks: 50, questions: mixQuestions([GA_QUESTIONS, MATH_QUESTIONS, REASONING_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Easy' },

  // ===== CRPF =====
  { id: 'test-crpf-1', examId: 'crpf', title: 'CRPF Constable Mock Test 1', description: 'Full mock test for CRPF Constable', duration: 90, totalMarks: 100, passingMarks: 50, questions: mixQuestions([GA_QUESTIONS, MATH_QUESTIONS, REASONING_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Easy' },
  { id: 'test-crpf-2', examId: 'crpf', title: 'CRPF Head Constable Mock Test 2', description: 'Mock test for CRPF Head Constable', duration: 90, totalMarks: 100, passingMarks: 50, questions: mixQuestions([ENGLISH_QUESTIONS, GA_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Medium' },

  // ===== LIC AAO =====
  { id: 'test-lic-aao-1', examId: 'lic-aao', title: 'LIC AAO Mock Test 1', description: 'Full mock test for LIC AAO', duration: 60, totalMarks: 100, passingMarks: 60, questions: mixQuestions([ENGLISH_QUESTIONS, MATH_QUESTIONS, REASONING_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Hard' },
  { id: 'test-lic-aao-2', examId: 'lic-aao', title: 'LIC AAO Practice Test 2', description: 'Practice test for LIC AAO', duration: 60, totalMarks: 100, passingMarks: 60, questions: mixQuestions([GA_QUESTIONS, ENGLISH_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Medium' },

  // ===== LIC Assistant =====
  { id: 'test-lic-asst-1', examId: 'lic-assistant', title: 'LIC Assistant Mock Test 1', description: 'Full mock test for LIC Assistant', duration: 60, totalMarks: 100, passingMarks: 60, questions: mixQuestions([ENGLISH_QUESTIONS, MATH_QUESTIONS, REASONING_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Medium' },

  // ===== NIACL AO =====
  { id: 'test-niacl-ao-1', examId: 'niacl-ao', title: 'NIACL AO Mock Test 1', description: 'Full mock test for NIACL AO', duration: 60, totalMarks: 100, passingMarks: 60, questions: mixQuestions([ENGLISH_QUESTIONS, MATH_QUESTIONS, REASONING_QUESTIONS], 25), createdAt: new Date().toISOString(), difficulty: 'Hard' },
]

// ===== Helper: safe localStorage read/write =====
function lsGet<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return fallback
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : fallback
  } catch { return fallback }
}

function lsSet<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

// ===== Category CRUD (localStorage) =====

export function getCategories(): LocalExamCategory[] {
  // If localStorage has data, merge exams into categories
  const storedCats = lsGet<LocalExamCategory>(CATEGORIES_KEY, [])
  const storedExams = lsGet<LocalExam>(EXAMS_KEY, [])
  if (storedCats.length === 0) {
    // First time: return default categories with embedded exams
    return DEFAULT_CATEGORIES
  }
  // Merge exams into categories
  return storedCats.map(cat => ({
    ...cat,
    exams: storedExams.filter(e => e.categoryId === cat.id)
  }))
}

export function saveCategories(categories: LocalExamCategory[]): void {
  // Save categories (without nested exams) and exams separately
  const exams = categories.flatMap(c => c.exams || [])
  const catsWithoutExams = categories.map(({ exams: _, ...cat }) => cat)
  lsSet(CATEGORIES_KEY, catsWithoutExams)
  lsSet(EXAMS_KEY, exams)
}

export function addCategory(data: Omit<LocalExamCategory, 'id' | 'exams'>): LocalExamCategory {
  const cat: LocalExamCategory = {
    ...data,
    id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    exams: [],
  }
  const cats = lsGet<LocalExamCategory>(CATEGORIES_KEY, [])
  // Strip exams for storage
  const { exams: _, ...catNoExams } = cat
  lsSet(CATEGORIES_KEY, [...cats, catNoExams])
  return cat
}

export function updateCategory(id: string, data: Partial<LocalExamCategory>): void {
  const cats = lsGet<any>(CATEGORIES_KEY, [])
  const updated = cats.map((c: any) => c.id === id ? { ...c, ...data, exams: undefined } : c)
  lsSet(CATEGORIES_KEY, updated)
}

export function deleteCategory(id: string): void {
  const cats = lsGet<any>(CATEGORIES_KEY, []).filter((c: any) => c.id !== id)
  lsSet(CATEGORIES_KEY, cats)
  // Find exams to delete (associated with this category)
  const allExams = lsGet<LocalExam>(EXAMS_KEY, [])
  const deletedExamIds = new Set(allExams.filter(e => e.categoryId === id).map(e => e.id))
  const remainingExams = allExams.filter(e => e.categoryId !== id)
  lsSet(EXAMS_KEY, remainingExams)
  // Delete tests associated with deleted exams
  const allTests = lsGet<LocalTest>(TESTS_KEY, [])
  const deletedTestIds = new Set(allTests.filter(t => deletedExamIds.has(t.examId)).map(t => t.id))
  const remainingTests = allTests.filter(t => !deletedExamIds.has(t.examId))
  lsSet(TESTS_KEY, remainingTests)
  // Delete questions associated with deleted tests
  const remainingQuestions = lsGet<LocalQuestion>(QUESTIONS_KEY, []).filter(q => !deletedTestIds.has(q.testId || ''))
  lsSet(QUESTIONS_KEY, remainingQuestions)
}

// ===== Exam CRUD (localStorage) =====

export function getExams(categoryId: string): LocalExam[] {
  const exams = lsGet<LocalExam>(EXAMS_KEY, [])
  if (exams.length === 0) {
    // Fallback: extract from default categories
    const defaultCat = DEFAULT_CATEGORIES.find(c => c.id === categoryId)
    return defaultCat?.exams || []
  }
  return exams.filter(e => e.categoryId === categoryId)
}

export function getExamById(id: string): LocalExam | undefined {
  const exams = lsGet<LocalExam>(EXAMS_KEY, [])
  if (exams.length === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      const exam = cat.exams.find(e => e.id === id)
      if (exam) return exam
    }
    return undefined
  }
  return exams.find(e => e.id === id)
}

export function addExam(data: Omit<LocalExam, 'id'>): LocalExam {
  const exam: LocalExam = {
    ...data,
    id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }
  const exams = lsGet<LocalExam>(EXAMS_KEY, [])
  lsSet(EXAMS_KEY, [...exams, exam])
  return exam
}

export function updateExam(id: string, data: Partial<LocalExam>): void {
  const exams = lsGet<LocalExam>(EXAMS_KEY, [])
  lsSet(EXAMS_KEY, exams.map(e => e.id === id ? { ...e, ...data } : e))
}

export function deleteExam(id: string): void {
  const remainingExams = lsGet<LocalExam>(EXAMS_KEY, []).filter(e => e.id !== id)
  lsSet(EXAMS_KEY, remainingExams)
  // Delete tests associated with this exam
  const allTests = lsGet<LocalTest>(TESTS_KEY, [])
  const deletedTestIds = new Set(allTests.filter(t => t.examId === id).map(t => t.id))
  const remainingTests = allTests.filter(t => t.examId !== id)
  lsSet(TESTS_KEY, remainingTests)
  // Delete questions associated with deleted tests
  const remainingQuestions = lsGet<LocalQuestion>(QUESTIONS_KEY, []).filter(q => !deletedTestIds.has(q.testId || ''))
  lsSet(QUESTIONS_KEY, remainingQuestions)
}

export function deleteAllExamsInCategory(categoryId: string): number {
  const exams = lsGet<LocalExam>(EXAMS_KEY, [])
  const toDelete = exams.filter(e => e.categoryId === categoryId)
  const remaining = exams.filter(e => e.categoryId !== categoryId)
  lsSet(EXAMS_KEY, remaining)
  // Delete associated tests and questions
  const deleteExamIds = new Set(toDelete.map(e => e.id))
  const allTests = lsGet<LocalTest>(TESTS_KEY, [])
  const deletedTestIds = new Set(allTests.filter(t => deleteExamIds.has(t.examId)).map(t => t.id))
  const remainingTests = allTests.filter(t => !deleteExamIds.has(t.examId))
  lsSet(TESTS_KEY, remainingTests)
  const remainingQuestions = lsGet<LocalQuestion>(QUESTIONS_KEY, []).filter(q => !deletedTestIds.has(q.testId || ''))
  lsSet(QUESTIONS_KEY, remainingQuestions)
  return toDelete.length
}

// ===== Test CRUD (localStorage) =====

export function getTestsByExam(examId: string): LocalTest[] {
  const tests = lsGet<LocalTest>(TESTS_KEY, [])
  if (tests.length === 0) {
    // Fallback: use default tests
    return ALL_TESTS.filter(t => t.examId === examId)
  }
  // Merge questions from separate storage for each test
  return tests
    .filter(t => t.examId === examId)
    .map(t => {
      const questions = getQuestions(t.id)
      return { ...t, questions }
    })
}

export function getTestById(testId: string): LocalTest | undefined {
  const tests = lsGet<LocalTest>(TESTS_KEY, [])
  if (tests.length === 0) {
    return ALL_TESTS.find(t => t.id === testId)
  }
  const test = tests.find(t => t.id === testId)
  if (!test) return undefined
  // Merge questions from separate storage (questions are stored separately from tests)
  const questions = getQuestions(testId)
  return { ...test, questions }
}

export function addTest(data: Omit<LocalTest, 'id' | 'createdAt'>): LocalTest {
  const test: LocalTest = {
    ...data,
    id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    questions: [],
  }
  const tests = lsGet<LocalTest>(TESTS_KEY, [])
  // Don't store questions in the test - they're stored separately
  const { questions: _, ...testNoQs } = test
  lsSet(TESTS_KEY, [...tests, testNoQs])
  return test
}

export function updateTest(id: string, data: Partial<LocalTest>): void {
  const tests = lsGet<LocalTest>(TESTS_KEY, [])
  lsSet(TESTS_KEY, tests.map(t => t.id === id ? { ...t, ...data } : t))
}

export function deleteTest(id: string): void {
  const tests = lsGet<LocalTest>(TESTS_KEY, []).filter(t => t.id !== id)
  lsSet(TESTS_KEY, tests)
  // Delete associated questions
  const questions = lsGet<LocalQuestion>(QUESTIONS_KEY, []).filter(q => q.testId !== id)
  lsSet(QUESTIONS_KEY, questions)
}

export function deleteAllTestsInExam(examId: string): number {
  const tests = lsGet<LocalTest>(TESTS_KEY, [])
  const toDelete = tests.filter(t => t.examId === examId)
  const remaining = tests.filter(t => t.examId !== examId)
  lsSet(TESTS_KEY, remaining)
  // Delete associated questions
  const deleteTestIds = new Set(toDelete.map(t => t.id))
  const questions = lsGet<LocalQuestion>(QUESTIONS_KEY, []).filter(q => !deleteTestIds.has(q.testId || ''))
  lsSet(QUESTIONS_KEY, questions)
  return toDelete.length
}

// ===== Question CRUD (localStorage) =====

export function getQuestions(testId: string): LocalQuestion[] {
  const questions = lsGet<LocalQuestion>(QUESTIONS_KEY, [])
  if (questions.length === 0) {
    // Fallback: use default tests' questions
    const test = ALL_TESTS.find(t => t.id === testId)
    return test?.questions || []
  }
  return questions.filter(q => q.testId === testId)
}

export function addQuestion(data: Omit<LocalQuestion, 'id'>): LocalQuestion {
  const question: LocalQuestion = {
    ...data,
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }
  const questions = lsGet<LocalQuestion>(QUESTIONS_KEY, [])
  lsSet(QUESTIONS_KEY, [...questions, question])
  return question
}

export function addBatchQuestions(testId: string, items: Omit<LocalQuestion, 'id' | 'testId'>[]): LocalQuestion[] {
  const questions = lsGet<LocalQuestion>(QUESTIONS_KEY, [])
  const newQuestions: LocalQuestion[] = items.map(item => ({
    ...item,
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    testId,
  }))
  lsSet(QUESTIONS_KEY, [...questions, ...newQuestions])
  return newQuestions
}

export function updateQuestion(id: string, data: Partial<LocalQuestion>): void {
  const questions = lsGet<LocalQuestion>(QUESTIONS_KEY, [])
  lsSet(QUESTIONS_KEY, questions.map(q => q.id === id ? { ...q, ...data } : q))
}

export function deleteQuestion(id: string): void {
  const questions = lsGet<LocalQuestion>(QUESTIONS_KEY, []).filter(q => q.id !== id)
  lsSet(QUESTIONS_KEY, questions)
}

export function deleteAllQuestionsInTest(testId: string): number {
  const questions = lsGet<LocalQuestion>(QUESTIONS_KEY, [])
  const toDelete = questions.filter(q => q.testId === testId)
  lsSet(QUESTIONS_KEY, questions.filter(q => q.testId !== testId))
  return toDelete.length
}

// ===== Bulk Delete =====

export function deleteAllExamData(): void {
  lsSet(CATEGORIES_KEY, [])
  lsSet(EXAMS_KEY, [])
  lsSet(TESTS_KEY, [])
  lsSet(QUESTIONS_KEY, [])
}

// ===== Seed from defaults =====

export function seedLocalData(): void {
  const existingCats = lsGet<any>(CATEGORIES_KEY, [])
  if (existingCats.length > 0) return // Already seeded
  // Save default categories (without exams)
  const catsWithoutExams = DEFAULT_CATEGORIES.map(({ exams: _, ...cat }) => cat)
  lsSet(CATEGORIES_KEY, catsWithoutExams)
  // Save default exams
  const allExams = DEFAULT_CATEGORIES.flatMap(c => c.exams)
  lsSet(EXAMS_KEY, allExams)
  // Save default tests (without questions - stored separately)
  const testsWithoutQs = ALL_TESTS.map(({ questions: _, ...t }) => t)
  lsSet(TESTS_KEY, testsWithoutQs)
  // Save default questions
  const allQuestions = ALL_TESTS.flatMap(t => t.questions)
  lsSet(QUESTIONS_KEY, allQuestions)
}

// ===== Results (localStorage) =====

export function getResults(): TestResult[] {
  return lsGet<TestResult>(RESULTS_KEY, [])
}

export function saveResult(data: Omit<TestResult, 'id' | 'createdAt'>): TestResult {
  const result: TestResult = {
    ...data,
    id: `result-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }
  const results = getResults()
  results.push(result)
  lsSet(RESULTS_KEY, results)
  return result
}

export function getLeaderboard(testId: string): TestResult[] {
  return getResults()
    .filter(r => r.testId === testId)
    .sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken)
}
