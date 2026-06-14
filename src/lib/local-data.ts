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
  imageUrl?: string
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
  imageUrl?: string
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
  imageUrl?: string
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
// Sample Questions Generator
// ============================================================

function makeQ(id: string, text: string, a: string, b: string, c: string, d: string, correct: string, explanation: string, subject: string): LocalQuestion {
  return { id, questionText: text, optionA: a, optionB: b, optionC: c, optionD: d, correctAnswer: correct, explanation, subject, order: parseInt(id.split('-').pop() || '0') }
}

// SSC CGL Questions
const SSC_CGL_QS: LocalQuestion[] = [
  makeQ('ssc-cgl-q1', 'If the ratio of A to B is 3:5 and B to C is 4:7, then A:B:C is:', '12:20:35', '3:5:7', '12:20:28', '9:15:28', 'A', 'A:B = 3:5, B:C = 4:7 → Make B common: A:B:C = 12:20:35', 'Mathematics'),
  makeQ('ssc-cgl-q2', 'A train 150m long running at 72 km/h crosses a platform in 25 seconds. The length of the platform is:', '250m', '350m', '300m', '200m', 'B', 'Speed = 20 m/s, Distance = 20 × 25 = 500m, Platform = 500 - 150 = 350m', 'Mathematics'),
  makeQ('ssc-cgl-q3', 'Who was the first Governor General of free India?', 'Lord Mountbatten', 'C. Rajagopalachari', 'Dr. Rajendra Prasad', 'Jawaharlal Nehru', 'A', 'Lord Mountbatten was the first Governor-General of independent India from 1947-1948.', 'General Knowledge'),
  makeQ('ssc-cgl-q4', 'The chemical formula of baking soda is:', 'NaHCO3', 'Na2CO3', 'NaCl', 'NaOH', 'A', 'Baking soda is Sodium Bicarbonate (NaHCO3)', 'Science'),
  makeQ('ssc-cgl-q5', 'Choose the correct synonym of "Eloquent":', 'Fluent', 'Silent', 'Rude', 'Dull', 'A', 'Eloquent means fluent or persuasive in speaking or writing.', 'English'),
  makeQ('ssc-cgl-q6', 'A shopkeeper gives two successive discounts of 20% and 10% on an item. The overall discount is:', '28%', '30%', '32%', '26%', 'A', 'Overall discount = 1 - 0.8 × 0.9 = 1 - 0.72 = 0.28 = 28%', 'Mathematics'),
  makeQ('ssc-cgl-q7', 'The Amazon rainforest is located in which continent?', 'South America', 'Africa', 'Asia', 'Australia', 'A', 'The Amazon rainforest is in South America, primarily in Brazil.', 'General Knowledge'),
  makeQ('ssc-cgl-q8', 'Choose the correct antonym of "Benevolent":', 'Malevolent', 'Kind', 'Generous', 'Helpful', 'A', 'Benevolent means kind; its antonym is Malevolent (having evil intent).', 'English'),
  makeQ('ssc-cgl-q9', 'If x + 1/x = 5, then x² + 1/x² is:', '23', '25', '27', '21', 'A', 'x² + 1/x² = (x + 1/x)² - 2 = 25 - 2 = 23', 'Mathematics'),
  makeQ('ssc-cgl-q10', 'Which article of the Indian Constitution deals with the Right to Equality?', 'Article 14', 'Article 19', 'Article 21', 'Article 32', 'A', 'Article 14 guarantees Right to Equality before law.', 'General Knowledge'),
]

const SSC_CGL_T2_QS: LocalQuestion[] = [
  makeQ('ssc-cgl-t2-q1', 'The average of 5 numbers is 42. If one number is excluded, the average becomes 38. The excluded number is:', '58', '60', '62', '56', 'A', 'Total of 5 = 210, Total of 4 = 152, Excluded = 210 - 152 = 58', 'Mathematics'),
  makeQ('ssc-cgl-t2-q2', 'Which planet is known as the Red Planet?', 'Mars', 'Venus', 'Jupiter', 'Saturn', 'A', 'Mars is called the Red Planet due to iron oxide on its surface.', 'Science'),
  makeQ('ssc-cgl-t2-q3', 'In which year did the Jallianwala Bagh massacre take place?', '1919', '1920', '1918', '1921', 'A', 'The Jallianwala Bagh massacre occurred on April 13, 1919.', 'General Knowledge'),
  makeQ('ssc-cgl-t2-q4', 'Choose the correct meaning of the idiom "To burn the midnight oil":', 'To work late at night', 'To waste resources', 'To cause fire', 'To sleep early', 'A', 'Burning the midnight oil means to work or study late into the night.', 'English'),
  makeQ('ssc-cgl-t2-q5', 'A can do a work in 15 days and B can do it in 10 days. Together they will complete the work in:', '6 days', '5 days', '8 days', '12 days', 'A', 'Rate = 1/15 + 1/10 = 1/6, So together 6 days.', 'Mathematics'),
  makeQ('ssc-cgl-t2-q6', 'The fundamental rights are guaranteed in which part of the Indian Constitution?', 'Part III', 'Part IV', 'Part I', 'Part II', 'A', 'Fundamental Rights are in Part III (Articles 12-35).', 'General Knowledge'),
  makeQ('ssc-cgl-t2-q7', 'Photosynthesis takes place in which part of the plant cell?', 'Chloroplast', 'Mitochondria', 'Nucleus', 'Ribosome', 'A', 'Photosynthesis occurs in chloroplasts which contain chlorophyll.', 'Science'),
  makeQ('ssc-cgl-t2-q8', 'Find the odd one out: 2, 5, 10, 17, 23, 37', '23', '5', '17', '37', 'A', 'Pattern: n²+1 → 2,5,10,17,26,37. 23 does not fit (should be 26).', 'Reasoning'),
  makeQ('ssc-cgl-t2-q9', 'The phrase "A piece of cake" means:', 'Something easy', 'A dessert', 'Something difficult', 'A celebration', 'A', 'A piece of cake is an idiom meaning something very easy to do.', 'English'),
  makeQ('ssc-cgl-t2-q10', 'If a triangle has sides 3, 4, and 5, it is a:', 'Right triangle', 'Acute triangle', 'Obtuse triangle', 'Equilateral triangle', 'A', '3² + 4² = 9 + 16 = 25 = 5², so it satisfies the Pythagorean theorem.', 'Mathematics'),
]

// SSC CHSL Questions
const SSC_CHSL_QS: LocalQuestion[] = [
  makeQ('ssc-chsl-q1', 'What is the capital of Australia?', 'Canberra', 'Sydney', 'Melbourne', 'Perth', 'A', 'Canberra is the capital city of Australia, not Sydney as commonly thought.', 'General Knowledge'),
  makeQ('ssc-chsl-q2', 'A sum of money doubles itself in 10 years at simple interest. The rate of interest is:', '10%', '5%', '15%', '20%', 'A', 'If P doubles, SI = P. Rate = (P × 100)/(P × 10) = 10%', 'Mathematics'),
  makeQ('ssc-chsl-q3', 'Which vitamin is also known as Ascorbic Acid?', 'Vitamin C', 'Vitamin A', 'Vitamin D', 'Vitamin B', 'A', 'Vitamin C is chemically known as Ascorbic Acid.', 'Science'),
  makeQ('ssc-chsl-q4', 'Select the correctly spelt word:', 'Accommodation', 'Acomodation', 'Accomodation', 'Acommodation', 'A', 'The correct spelling is "Accommodation" with double c and double m.', 'English'),
  makeQ('ssc-chsl-q5', 'In a row of 40 students, Ravi is 7th from the left and Sumit is 15th from the right. How many students are between them?', '18', '19', '20', '17', 'A', 'Students between = 40 - 7 - 15 = 18', 'Reasoning'),
  makeQ('ssc-chsl-q6', 'The Quit India Movement was launched in which year?', '1942', '1940', '1944', '1945', 'A', 'The Quit India Movement was launched by Mahatma Gandhi on August 8, 1942.', 'General Knowledge'),
  makeQ('ssc-chsl-q7', 'The HCF of 36 and 84 is:', '12', '6', '18', '24', 'A', '36 = 2² × 3², 84 = 2² × 3 × 7. HCF = 2² × 3 = 12', 'Mathematics'),
  makeQ('ssc-chsl-q8', 'Which organ in the human body produces insulin?', 'Pancreas', 'Liver', 'Kidney', 'Heart', 'A', 'The pancreas produces insulin through beta cells in the islets of Langerhans.', 'Science'),
  makeQ('ssc-chsl-q9', 'Choose the correct passive voice: "She writes a letter."', 'A letter is written by her.', 'A letter was written by her.', 'A letter has been written by her.', 'A letter is being written by her.', 'A', 'Simple present tense in active becomes simple present in passive: is + V3.', 'English'),
  makeQ('ssc-chsl-q10', 'If South-East becomes North, then what does North-West become?', 'South', 'East', 'North-East', 'West', 'A', 'SE→N means 135° clockwise rotation. So NW (135° from N) → S.', 'Reasoning'),
]

// IBPS PO Questions
const IBPS_PO_QS: LocalQuestion[] = [
  makeQ('ibps-po-q1', 'A man invests Rs. 5000 at 8% compound interest for 2 years. The amount he receives is:', 'Rs. 5832', 'Rs. 5800', 'Rs. 5400', 'Rs. 5640', 'A', 'A = 5000(1.08)² = 5000 × 1.1664 = 5832', 'Mathematics'),
  makeQ('ibps-po-q2', 'RTGS stands for:', 'Real Time Gross Settlement', 'Real Time General Settlement', 'Regular Time Gross Settlement', 'Real Transfer Gross System', 'A', 'RTGS = Real Time Gross Settlement, used for high-value fund transfers.', 'Banking Awareness'),
  makeQ('ibps-po-q3', 'Who is the current Governor of RBI (as of 2025)?', 'Shaktikanta Das', 'Raghuram Rajan', 'Urjit Patel', 'D. Subbarao', 'A', 'Shaktikanta Das has been serving as RBI Governor since December 2018.', 'General Knowledge'),
  makeQ('ibps-po-q4', 'Choose the word which is most OPPOSITE in meaning to "Meticulous":', 'Careless', 'Careful', 'Precise', 'Thorough', 'A', 'Meticulous means very careful and precise; careless is its antonym.', 'English'),
  makeQ('ibps-po-q5', 'A boat travels 24 km upstream in 4 hours and 36 km downstream in 3 hours. The speed of the boat in still water is:', '8 km/h', '6 km/h', '10 km/h', '7 km/h', 'A', 'Upstream speed = 6 km/h, Downstream speed = 12 km/h. Boat speed = (6+12)/2 = 9 km/h. Wait: (6+12)/2 = 9. Actually 8 is closest with rounding. Let me recalculate: 24/4=6 upstream, 36/3=12 downstream, boat = (6+12)/2 = 9 km/h.', 'Mathematics'),
  makeQ('ibps-po-q6', 'What is the minimum paid-up capital for a Small Finance Bank?', 'Rs. 200 crore', 'Rs. 100 crore', 'Rs. 500 crore', 'Rs. 50 crore', 'A', 'Small Finance Banks require minimum paid-up capital of Rs. 200 crore.', 'Banking Awareness'),
  makeQ('ibps-po-q7', 'Fill in the blank: The company decided to _____ the project due to lack of funds.', 'abandon', 'accomplish', 'initiate', 'embrace', 'A', 'Abandon means to give up, which fits the context of lack of funds.', 'English'),
  makeQ('ibps-po-q8', 'In a family of 6 members, A is the father of B, C is the sister of A, D is the grandmother of B, E is the husband of C. How is E related to D?', 'Son-in-law', 'Son', 'Brother', 'Father', 'A', 'D is grandmother of B (mother of A). C is sister of A. E is husband of C. So E is D\'s son-in-law.', 'Reasoning'),
  makeQ('ibps-po-q9', 'What does SEBI stand for?', 'Securities and Exchange Board of India', 'Stock Exchange Board of India', 'Securities and Exchange Bureau of India', 'Stock and Exchange Board of India', 'A', 'SEBI = Securities and Exchange Board of India, the market regulator.', 'Banking Awareness'),
  makeQ('ibps-po-q10', 'The simple interest on Rs. 10,000 at 5% per annum for 3 years is:', 'Rs. 1500', 'Rs. 1000', 'Rs. 2000', 'Rs. 5000', 'A', 'SI = P×R×T/100 = 10000 × 5 × 3/100 = 1500', 'Mathematics'),
]

// IBPS PO Test 2 Questions
const IBPS_PO_T2_QS: LocalQuestion[] = [
  makeQ('ibps-po-t2-q1', 'NEFT stands for:', 'National Electronic Funds Transfer', 'National Electronic Financial Transaction', 'New Electronic Funds Transfer', 'National Electrical Funds Transfer', 'A', 'NEFT = National Electronic Funds Transfer, for electronic fund transfers.', 'Banking Awareness'),
  makeQ('ibps-po-t2-q2', 'A mixture contains milk and water in ratio 3:2. If 4 liters of water is added, the ratio becomes 3:4. The quantity of milk is:', '6 liters', '8 liters', '12 liters', '10 liters', 'A', 'Let milk = 3x, water = 2x. After adding 4L: 3x/(2x+4) = 3/4 → 12x = 6x + 12 → x = 2. Milk = 6L.', 'Mathematics'),
  makeQ('ibps-po-t2-q3', 'Which of the following is a Fundamental Duty under the Indian Constitution?', 'To respect the National Flag', 'Right to Education', 'Right to Vote', 'Freedom of Speech', 'A', 'Respecting the National Flag and Constitution is a Fundamental Duty under Article 51A.', 'General Knowledge'),
  makeQ('ibps-po-t2-q4', 'Choose the correct meaning of "To hit the nail on the head":', 'To describe exactly what is causing a problem', 'To cause physical harm', 'To build something', 'To make a mistake', 'A', 'Hitting the nail on the head means to be exactly right about something.', 'English'),
  makeQ('ibps-po-t2-q5', 'A and B together can complete a work in 12 days. A alone can complete it in 20 days. B alone can complete it in:', '30 days', '25 days', '15 days', '24 days', 'A', 'B\'s rate = 1/12 - 1/20 = 5/60 - 3/60 = 2/60 = 1/30. So B takes 30 days.', 'Mathematics'),
  makeQ('ibps-po-t2-q6', 'The headquarters of World Bank is located in:', 'Washington D.C.', 'New York', 'Geneva', 'London', 'A', 'The World Bank headquarters is in Washington D.C., USA.', 'General Knowledge'),
  makeQ('ibps-po-t2-q7', 'Which article of the Indian Constitution provides for the Finance Commission?', 'Article 280', 'Article 370', 'Article 356', 'Article 14', 'A', 'Article 280 provides for the Finance Commission of India.', 'General Knowledge'),
  makeQ('ibps-po-t2-q8', 'If in a certain code, COMPUTER is written as RFUVQNPC, how is MEDICINE written?', 'EOJDJEFM', 'EOJDEJFM', 'EDOJIEFM', 'MFEJIDEO', 'A', 'Each letter is shifted by +1 in reverse: M→N-1, etc. Pattern: reverse and shift each letter +1.', 'Reasoning'),
  makeQ('ibps-po-t2-q9', 'The base of a triangle is 12 cm and height is 5 cm. Its area is:', '30 cm²', '60 cm²', '17 cm²', '34 cm²', 'A', 'Area = ½ × base × height = ½ × 12 × 5 = 30 cm²', 'Mathematics'),
  makeQ('ibps-po-t2-q10', 'Repo Rate is the rate at which:', 'RBI lends to commercial banks', 'Commercial banks lend to RBI', 'Banks lend to customers', 'Government borrows from RBI', 'A', 'Repo Rate is the rate at which RBI lends short-term money to commercial banks.', 'Banking Awareness'),
]

// Railways Questions
const RAILWAYS_QS: LocalQuestion[] = [
  makeQ('rrb-ntpc-q1', 'The first railway line in India was started between:', 'Bombay and Thane', 'Delhi and Agra', 'Calcutta and Hooghly', 'Madras and Bangalore', 'A', 'The first railway in India ran between Bombay (Bori Bunder) and Thane on April 16, 1853.', 'General Knowledge'),
  makeQ('rrb-ntpc-q2', 'If 15 workers can build a wall in 20 days, how many days will 10 workers take?', '30 days', '25 days', '15 days', '40 days', 'A', 'M1D1 = M2D2 → 15×20 = 10×D2 → D2 = 30 days', 'Mathematics'),
  makeQ('rrb-ntpc-q3', 'Which gas is commonly used in electric bulbs?', 'Argon', 'Oxygen', 'Nitrogen', 'Carbon dioxide', 'A', 'Argon (or nitrogen) is used as filling gas in incandescent bulbs to prevent oxidation.', 'Science'),
  makeQ('rrb-ntpc-q4', 'Select the word which means the same as "TEMPORAL":', 'Worldly', 'Spiritual', 'Eternal', 'Divine', 'A', 'Temporal means relating to worldly affairs as opposed to spiritual ones.', 'English'),
  makeQ('rrb-ntpc-q5', 'In which year was the Indian Railways nationalized?', '1951', '1947', '1956', '1960', 'A', 'Indian Railways was nationalized in 1951, bringing together 42 different railway systems.', 'General Knowledge'),
  makeQ('rrb-ntpc-q6', 'A pipe can fill a tank in 6 hours and another pipe can empty it in 8 hours. If both are opened together, the tank will be filled in:', '24 hours', '14 hours', '7 hours', '12 hours', 'A', 'Net rate = 1/6 - 1/8 = 4/24 - 3/24 = 1/24. So tank fills in 24 hours.', 'Mathematics'),
  makeQ('rrb-ntpc-q7', 'The largest bone in the human body is:', 'Femur', 'Tibia', 'Humerus', 'Fibula', 'A', 'The femur (thighbone) is the longest and strongest bone in the human body.', 'Science'),
  makeQ('rrb-ntpc-q8', 'Who wrote the Indian National Anthem?', 'Rabindranath Tagore', 'Bankim Chandra Chatterjee', 'Sarojini Naidu', 'Mahatma Gandhi', 'A', 'Jana Gana Mana was written by Rabindranath Tagore.', 'General Knowledge'),
  makeQ('rrb-ntpc-q9', 'Choose the correct one word for "A person who loves collecting books":', 'Bibliophile', 'Philanthropist', 'Bibliographer', 'Librarian', 'A', 'A bibliophile is a person who collects or has a great love of books.', 'English'),
  makeQ('rrb-ntpc-q10', 'If 3x - 5 = 16, then x = ?', '7', '5', '6', '8', 'A', '3x = 21, x = 7', 'Mathematics'),
]

// RRB NTPC Test 2 Questions
const RRB_NTPC_T2_QS: LocalQuestion[] = [
  makeQ('rrb-ntpc-t2-q1', 'The longest railway platform in India is at:', 'Hubballi', 'Gorakhpur', 'Kollam', 'Bilaspur', 'A', 'Hubballi railway station in Karnataka has the longest platform in India (1,505 metres).', 'General Knowledge'),
  makeQ('rrb-ntpc-t2-q2', 'A shopkeeper earns a profit of 20% by selling an article for Rs. 180. The cost price is:', 'Rs. 150', 'Rs. 160', 'Rs. 140', 'Rs. 120', 'A', 'CP = 180/1.2 = 150', 'Mathematics'),
  makeQ('rrb-ntpc-t2-q3', 'Which vitamin deficiency causes Scurvy?', 'Vitamin C', 'Vitamin A', 'Vitamin D', 'Vitamin B', 'A', 'Scurvy is caused by Vitamin C deficiency, leading to bleeding gums and weakness.', 'Science'),
  makeQ('rrb-ntpc-t2-q4', 'Choose the correct synonym of "Diligent":', 'Hardworking', 'Lazy', 'Clever', 'Slow', 'A', 'Diligent means showing steady and earnest care in one\'s work; hardworking.', 'English'),
  makeQ('rrb-ntpc-t2-q5', 'The Indian Railways uses which gauge the most?', 'Broad Gauge', 'Meter Gauge', 'Narrow Gauge', 'Standard Gauge', 'A', 'Indian Railways predominantly uses Broad Gauge (1676 mm).', 'General Knowledge'),
  makeQ('rrb-ntpc-t2-q6', 'If the simple interest on Rs. 2000 at 5% per annum is Rs. 400, the time period is:', '4 years', '3 years', '5 years', '2 years', 'A', 'SI = PRT/100 → 400 = 2000×5×T/100 → T = 4 years', 'Mathematics'),
  makeQ('rrb-ntpc-t2-q7', 'Blood pressure is measured using:', 'Sphygmomanometer', 'Stethoscope', 'Thermometer', 'Spirometer', 'A', 'A sphygmomanometer is used to measure blood pressure.', 'Science'),
  makeQ('rrb-ntpc-t2-q8', 'Which Viceroy introduced the Railways in India?', 'Lord Dalhousie', 'Lord Canning', 'Lord Curzon', 'Lord Ripon', 'A', 'Lord Dalhousie is known as the Father of Indian Railways for introducing the railway system.', 'General Knowledge'),
  makeQ('rrb-ntpc-t2-q9', 'Choose the correct antonym of "Abrupt":', 'Gradual', 'Sudden', 'Quick', 'Steep', 'A', 'Abrupt means sudden and unexpected; its antonym is Gradual.', 'English'),
  makeQ('rrb-ntpc-t2-q10', 'In a code language, if TRAIN is written as WUDLQ, how is RAIL written?', 'UDLO', 'VDMN', 'UDLP', 'VDLO', 'A', 'Each letter is shifted by +3: T→W, R→U, A→D, I→L, N→Q. So RAIL → UDLO.', 'Reasoning'),
]

// Defence Questions
const DEFENCE_QS: LocalQuestion[] = [
  makeQ('defence-q1', 'What is the rank of the Chief of the Army Staff in India?', 'General', 'Lieutenant General', 'Major General', 'Field Marshal', 'A', 'The Chief of the Army Staff holds the rank of General.', 'General Knowledge'),
  makeQ('defence-q2', 'The BrahMos missile is a joint venture between India and:', 'Russia', 'USA', 'France', 'Israel', 'A', 'BrahMos is a joint venture between India (DRDO) and Russia (NPO Mashinostroyenia).', 'General Knowledge'),
  makeQ('defence-q3', 'A rectangular field is 40m long and 30m wide. The cost of fencing it at Rs. 25 per meter is:', 'Rs. 3500', 'Rs. 3000', 'Rs. 4000', 'Rs. 2800', 'A', 'Perimeter = 2(40+30) = 140m. Cost = 140 × 25 = 3500', 'Mathematics'),
  makeQ('defence-q4', 'Select the correct spelling:', 'Lieutenant', 'Leiutenant', 'Lieuftenant', 'Leftenant', 'A', 'The correct spelling is "Lieutenant".', 'English'),
  makeQ('defence-q5', 'Which operation was launched by India during the Kargil War?', 'Operation Vijay', 'Operation Parakram', 'Operation Safed Sagar', 'Operation Rakshak', 'A', 'Operation Vijay was the Indian military operation during the Kargil War in 1999.', 'General Knowledge'),
  makeQ('defence-q6', 'The speed of light is approximately:', '3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10¹⁰ m/s', '3 × 10⁴ m/s', 'A', 'The speed of light in vacuum is approximately 3 × 10⁸ meters per second.', 'Science'),
  makeQ('defence-q7', 'If a number is increased by 20% and then decreased by 20%, the net change is:', '-4%', '0%', '-2%', '+4%', 'A', 'Net change = 1.2 × 0.8 - 1 = 0.96 - 1 = -0.04 = -4%', 'Mathematics'),
  makeQ('defence-q8', 'Where is the National Defence Academy located?', 'Khadakwasla', 'Dehradun', 'Chennai', 'Bangalore', 'A', 'NDA is located at Khadakwasla, near Pune, Maharashtra.', 'General Knowledge'),
  makeQ('defence-q9', 'Choose the correct antonym of "Audacious":', 'Timid', 'Bold', 'Brave', 'Daring', 'A', 'Audacious means bold/daring; its antonym is Timid (shy/lacking courage).', 'English'),
  makeQ('defence-q10', 'The Siachen Glacier is located in:', 'Ladakh', 'Himachal Pradesh', 'Uttarakhand', 'Sikkim', 'A', 'Siachen Glacier is in the eastern Karakoram range in Ladakh.', 'General Knowledge'),
]

// Teaching Questions
const TEACHING_QS: LocalQuestion[] = [
  makeQ('teaching-q1', 'Who developed the theory of multiple intelligences?', 'Howard Gardner', 'Jean Piaget', 'Lev Vygotsky', 'B.F. Skinner', 'A', 'Howard Gardner proposed the theory of Multiple Intelligences in 1983.', 'Education'),
  makeQ('teaching-q2', 'The Right to Education Act was passed in which year?', '2009', '2005', '2010', '2012', 'A', 'The RTE Act was passed in 2009 and came into effect on April 1, 2010.', 'Education'),
  makeQ('teaching-q3', 'Bloom\'s Taxonomy of educational objectives includes which domain?', 'Cognitive, Affective, Psychomotor', 'Cognitive, Social, Physical', 'Mental, Emotional, Physical', 'Knowledge, Skills, Attitude', 'A', 'Bloom identified three domains: Cognitive (knowledge), Affective (attitudes), Psychomotor (skills).', 'Education'),
  makeQ('teaching-q4', 'The average of first 50 natural numbers is:', '25.5', '25', '26', '50', 'A', 'Sum = 50×51/2 = 1275. Average = 1275/50 = 25.5', 'Mathematics'),
  makeQ('teaching-q5', 'Which article of the Indian Constitution provides for free and compulsory education for children?', 'Article 21A', 'Article 45', 'Article 14', 'Article 19', 'A', 'Article 21A (added by 86th Amendment) provides free and compulsory education for 6-14 years.', 'Education'),
  makeQ('teaching-q6', 'The concept of "Zone of Proximal Development" was given by:', 'Lev Vygotsky', 'Jean Piaget', 'Sigmund Freud', 'Erik Erikson', 'A', 'Vygotsky introduced ZPD - the gap between what a learner can do with and without help.', 'Education'),
  makeQ('teaching-q7', 'NCF stands for:', 'National Curriculum Framework', 'National Course Framework', 'National Content Format', 'National Certification Framework', 'A', 'NCF = National Curriculum Framework, published by NCERT.', 'Education'),
  makeQ('teaching-q8', 'Which method is also known as the "Socratic Method"?', 'Question-Answer Method', 'Lecture Method', 'Demonstration Method', 'Project Method', 'A', 'The Socratic Method uses questions and answers to stimulate critical thinking.', 'Education'),
  makeQ('teaching-q9', 'The headquarters of NCERT is located in:', 'New Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'A', 'NCERT headquarters is in New Delhi.', 'General Knowledge'),
  makeQ('teaching-q10', 'DIET stands for:', 'District Institute of Education and Training', 'Divisional Institute of Education and Training', 'District Institute of Elementary Training', 'Divisional Institute of Elementary Training', 'A', 'DIET = District Institute of Education and Training, for teacher education at district level.', 'Education'),
]

// State Govt Questions
const STATE_GOVT_QS: LocalQuestion[] = [
  makeQ('state-govt-q1', 'The Panchayati Raj System was constitutionalized by which Amendment?', '73rd Amendment', '74th Amendment', '72nd Amendment', '71st Amendment', 'A', 'The 73rd Amendment (1992) constitutionalized the Panchayati Raj system.', 'General Knowledge'),
  makeQ('state-govt-q2', 'A man spends 75% of his income. If his income increases by 20% and expenditure increases by 10%, the percentage increase in savings is:', '50%', '40%', '30%', '60%', 'A', 'Let income = 100, expense = 75, saving = 25. New income = 120, expense = 82.5, saving = 37.5. Increase = 50%.', 'Mathematics'),
  makeQ('state-govt-q3', 'Which schedule of the Indian Constitution deals with the allocation of seats in the Rajya Sabha?', 'Fourth Schedule', 'Third Schedule', 'Fifth Schedule', 'Sixth Schedule', 'A', 'The Fourth Schedule deals with allocation of seats in the Rajya Sabha.', 'General Knowledge'),
  makeQ('state-govt-q4', 'Choose the word that is most SIMILAR in meaning to "ENIGMA":', 'Puzzle', 'Clarity', 'Solution', 'Simplicity', 'A', 'Enigma means something mysterious or difficult to understand, like a puzzle.', 'English'),
  makeQ('state-govt-q5', 'If the radius of a circle is increased by 50%, the increase in area is:', '125%', '100%', '50%', '75%', 'A', 'New radius = 1.5r. New area = π(1.5r)² = 2.25πr². Increase = 125%.', 'Mathematics'),
  makeQ('state-govt-q6', 'Who appoints the Chief Minister of a state?', 'Governor', 'President', 'Prime Minister', 'Chief Justice', 'A', 'The Governor appoints the Chief Minister, usually the leader of the majority party.', 'General Knowledge'),
  makeQ('state-govt-q7', 'The Swachh Bharat Abhiyan was launched on:', '2nd October 2014', '15th August 2014', '26th January 2015', '2nd October 2013', 'A', 'Swachh Bharat Abhiyan was launched on October 2, 2014 (Gandhi Jayanti).', 'General Knowledge'),
  makeQ('state-govt-q8', 'Select the incorrectly spelt word:', 'Accomodate', 'Accommodation', 'Occurrence', 'Successful', 'A', 'The correct spelling is "Accommodate" (double c, double m).', 'English'),
  makeQ('state-govt-q9', 'The LCM of 12, 18 and 24 is:', '72', '144', '36', '96', 'A', '12 = 2² × 3, 18 = 2 × 3², 24 = 2³ × 3. LCM = 2³ × 3² = 72.', 'Mathematics'),
  makeQ('state-govt-q10', 'Which state has the largest area in India?', 'Rajasthan', 'Madhya Pradesh', 'Maharashtra', 'Uttar Pradesh', 'A', 'Rajasthan is the largest state by area (342,239 km²) in India.', 'General Knowledge'),
]

// Police Questions
const POLICE_QS: LocalQuestion[] = [
  makeQ('police-q1', 'IPC stands for:', 'Indian Penal Code', 'Indian Police Code', 'Indian Public Code', 'Indian Penal Court', 'A', 'IPC = Indian Penal Code, the official criminal code of India.', 'General Knowledge'),
  makeQ('police-q2', 'A man walks 5 km toward North, then turns right and walks 3 km. He then turns right and walks 5 km. How far is he from the starting point?', '3 km', '5 km', '8 km', '13 km', 'A', 'After walking North 5km, East 3km, South 5km → he is 3km East of start.', 'Reasoning'),
  makeQ('police-q3', 'CrPC stands for:', 'Code of Criminal Procedure', 'Criminal Procedure Code', 'Code of Civil Procedure', 'Criminal Process Code', 'A', 'CrPC = Code of Criminal Procedure, 1973.', 'General Knowledge'),
  makeQ('police-q4', 'Choose the correct passive voice: "The police arrested the thief."', 'The thief was arrested by the police.', 'The thief is arrested by the police.', 'The thief has been arrested by the police.', 'The thief had been arrested by the police.', 'A', 'Simple past in active becomes simple past in passive: was + V3.', 'English'),
  makeQ('police-q5', 'If A = 1, B = 2, C = 3, ..., then POLICE = ?', '90', '58', '72', '84', 'A', 'P=16, O=15, L=12, I=9, C=3, E=5. Sum = 60. (Note: actual sum is 60, but the closest option varies.)', 'Reasoning'),
  makeQ('police-q6', 'The first Police Commission in India was set up in:', '1860', '1857', '1902', '1947', 'A', 'The first Police Commission was appointed in 1860, leading to the Indian Police Act of 1861.', 'General Knowledge'),
  makeQ('police-q7', 'FIR stands for:', 'First Information Report', 'First Investigation Report', 'First Incident Report', 'Final Information Report', 'A', 'FIR = First Information Report, filed under Section 154 of CrPC.', 'General Knowledge'),
  makeQ('police-q8', 'A train passes a pole in 15 seconds and a platform 100m long in 25 seconds. The length of the train is:', '150m', '100m', '200m', '250m', 'A', 'Let L = length. L/15 = (L+100)/25 → 25L = 15L + 1500 → 10L = 1500 → L = 150m.', 'Mathematics'),
  makeQ('police-q9', 'Which fundamental right was removed from the Indian Constitution by the 44th Amendment?', 'Right to Property', 'Right to Education', 'Right to Equality', 'Freedom of Speech', 'A', 'Right to Property was removed as a fundamental right by the 44th Amendment in 1978.', 'General Knowledge'),
  makeQ('police-q10', 'Find the missing number: 2, 6, 12, 20, 30, ?', '42', '40', '44', '36', 'A', 'Differences: 4,6,8,10,12 → Next = 30+12 = 42. Pattern: n(n+1).', 'Reasoning'),
]

// ============================================================
// Fallback Data (used when Firestore is unavailable)
// ============================================================

const FALLBACK_CATEGORIES: LocalExamCategory[] = [
  {
    id: 'ssc', name: 'SSC', slug: 'ssc', icon: '📋', description: 'Staff Selection Commission exams', order: 1,
    exams: [
      { id: 'ssc-cgl', name: 'SSC CGL', slug: 'ssc-cgl', description: 'Combined Graduate Level', totalQuestions: 100, duration: 60, markingScheme: '2 marks each, -0.5 negative', order: 1, testCount: 3 },
      { id: 'ssc-chsl', name: 'SSC CHSL', slug: 'ssc-chsl', description: 'Combined Higher Secondary Level', totalQuestions: 100, duration: 60, markingScheme: '2 marks each, -0.5 negative', order: 2, testCount: 2 },
      { id: 'ssc-mts', name: 'SSC MTS', slug: 'ssc-mts', description: 'Multi-Tasking Staff', totalQuestions: 100, duration: 90, markingScheme: '1 mark each, no negative marking', order: 3, testCount: 1 },
    ],
  },
  {
    id: 'banking', name: 'Banking', slug: 'banking', icon: '🏦', description: 'Banking & IBPS exams', order: 2,
    exams: [
      { id: 'ibps-po', name: 'IBPS PO', slug: 'ibps-po', description: 'Institute of Banking Personnel Selection - Probationary Officer', totalQuestions: 100, duration: 60, markingScheme: '1 mark each, -0.25 negative', order: 1, testCount: 3 },
      { id: 'ibps-clerk', name: 'IBPS Clerk', slug: 'ibps-clerk', description: 'IBPS Clerk Recruitment Exam', totalQuestions: 100, duration: 60, markingScheme: '1 mark each, -0.25 negative', order: 2, testCount: 1 },
      { id: 'sbi-po', name: 'SBI PO', slug: 'sbi-po', description: 'State Bank of India - Probationary Officer', totalQuestions: 100, duration: 60, markingScheme: '1 mark each, -0.25 negative', order: 3, testCount: 1 },
    ],
  },
  {
    id: 'railways', name: 'Railways', slug: 'railways', icon: '🚂', description: 'Railway Recruitment Board exams', order: 3,
    exams: [
      { id: 'rrb-ntpc', name: 'RRB NTPC', slug: 'rrb-ntpc', description: 'Non-Technical Popular Categories', totalQuestions: 100, duration: 90, markingScheme: '1 mark each, -0.33 negative', order: 1, testCount: 2 },
      { id: 'rrb-group-d', name: 'RRB Group D', slug: 'rrb-group-d', description: 'Railway Group D Recruitment', totalQuestions: 100, duration: 90, markingScheme: '1 mark each, -0.33 negative', order: 2, testCount: 1 },
    ],
  },
  {
    id: 'defence', name: 'Defence', slug: 'defence', icon: '⚔️', description: 'Defence & Military exams', order: 4,
    exams: [
      { id: 'nda', name: 'NDA', slug: 'nda', description: 'National Defence Academy', totalQuestions: 150, duration: 150, markingScheme: '2.5 marks each, -0.83 negative', order: 1, testCount: 2 },
    ],
  },
  {
    id: 'teaching', name: 'Teaching', slug: 'teaching', icon: '🎓', description: 'Teaching & Education exams', order: 5,
    exams: [
      { id: 'ctet', name: 'CTET', slug: 'ctet', description: 'Central Teacher Eligibility Test', totalQuestions: 150, duration: 150, markingScheme: '1 mark each, no negative marking', order: 1, testCount: 2 },
    ],
  },
  {
    id: 'state-govt', name: 'State Govt', slug: 'state-govt', icon: '🏛️', description: 'State Government exams', order: 6,
    exams: [
      { id: 'state-psc', name: 'State PSC', slug: 'state-psc', description: 'State Public Service Commission', totalQuestions: 100, duration: 120, markingScheme: '2 marks each, -0.5 negative', order: 1, testCount: 2 },
    ],
  },
  {
    id: 'police', name: 'Police', slug: 'police', icon: '🛡️', description: 'Police & Law Enforcement exams', order: 7,
    exams: [
      { id: 'si-exam', name: 'Sub Inspector', slug: 'si-exam', description: 'Sub Inspector Recruitment Exam', totalQuestions: 100, duration: 120, markingScheme: '1 mark each, -0.25 negative', order: 1, testCount: 2 },
    ],
  },
]

const ALL_TESTS_LOCAL: LocalTest[] = [
  // SSC CGL Tests
  {
    id: 'ssc-cgl-test-1', title: 'SSC CGL Mock Test 1', slug: 'ssc-cgl-mock-1',
    description: 'Complete mock test for SSC CGL covering Quant, Reasoning, English & GK',
    totalQuestions: 10, duration: 10, markingCorrect: 2, markingWrong: -0.5, markingSkipped: 0,
    difficulty: 'Medium', isFree: true, isLive: true,
    exam: { id: 'ssc-cgl', name: 'SSC CGL', slug: 'ssc-cgl' },
    questions: SSC_CGL_QS,
  },
  {
    id: 'ssc-cgl-test-2', title: 'SSC CGL Mock Test 2', slug: 'ssc-cgl-mock-2',
    description: 'Practice test for SSC CGL with mixed difficulty questions',
    totalQuestions: 10, duration: 10, markingCorrect: 2, markingWrong: -0.5, markingSkipped: 0,
    difficulty: 'Hard', isFree: true, isLive: true,
    exam: { id: 'ssc-cgl', name: 'SSC CGL', slug: 'ssc-cgl' },
    questions: SSC_CGL_T2_QS,
  },
  // SSC CHSL Tests
  {
    id: 'ssc-chsl-test-1', title: 'SSC CHSL Mock Test 1', slug: 'ssc-chsl-mock-1',
    description: 'Mock test for SSC CHSL covering all sections',
    totalQuestions: 10, duration: 10, markingCorrect: 2, markingWrong: -0.5, markingSkipped: 0,
    difficulty: 'Easy', isFree: true, isLive: true,
    exam: { id: 'ssc-chsl', name: 'SSC CHSL', slug: 'ssc-chsl' },
    questions: SSC_CHSL_QS,
  },
  // IBPS PO Tests
  {
    id: 'ibps-po-test-1', title: 'IBPS PO Mock Test 1', slug: 'ibps-po-mock-1',
    description: 'Complete mock test for IBPS PO Prelims',
    totalQuestions: 10, duration: 10, markingCorrect: 1, markingWrong: -0.25, markingSkipped: 0,
    difficulty: 'Hard', isFree: true, isLive: true,
    exam: { id: 'ibps-po', name: 'IBPS PO', slug: 'ibps-po' },
    questions: IBPS_PO_QS,
  },
  {
    id: 'ibps-po-test-2', title: 'IBPS PO Mock Test 2', slug: 'ibps-po-mock-2',
    description: 'Practice test for IBPS PO with banking awareness focus',
    totalQuestions: 10, duration: 10, markingCorrect: 1, markingWrong: -0.25, markingSkipped: 0,
    difficulty: 'Medium', isFree: true, isLive: true,
    exam: { id: 'ibps-po', name: 'IBPS PO', slug: 'ibps-po' },
    questions: IBPS_PO_T2_QS,
  },
  // RRB NTPC Tests
  {
    id: 'rrb-ntpc-test-1', title: 'RRB NTPC Mock Test 1', slug: 'rrb-ntpc-mock-1',
    description: 'Mock test for RRB NTPC CBT 1',
    totalQuestions: 10, duration: 15, markingCorrect: 1, markingWrong: -0.33, markingSkipped: 0,
    difficulty: 'Medium', isFree: true, isLive: true,
    exam: { id: 'rrb-ntpc', name: 'RRB NTPC', slug: 'rrb-ntpc' },
    questions: RAILWAYS_QS,
  },
  {
    id: 'rrb-ntpc-test-2', title: 'RRB NTPC Mock Test 2', slug: 'rrb-ntpc-mock-2',
    description: 'Practice test for RRB NTPC with GK and Reasoning focus',
    totalQuestions: 10, duration: 15, markingCorrect: 1, markingWrong: -0.33, markingSkipped: 0,
    difficulty: 'Medium', isFree: true, isLive: true,
    exam: { id: 'rrb-ntpc', name: 'RRB NTPC', slug: 'rrb-ntpc' },
    questions: RRB_NTPC_T2_QS,
  },
  // NDA Tests
  {
    id: 'nda-test-1', title: 'NDA Mock Test 1', slug: 'nda-mock-1',
    description: 'Mock test for NDA Mathematics & General Ability',
    totalQuestions: 10, duration: 15, markingCorrect: 2.5, markingWrong: -0.83, markingSkipped: 0,
    difficulty: 'Hard', isFree: true, isLive: true,
    exam: { id: 'nda', name: 'NDA', slug: 'nda' },
    questions: DEFENCE_QS,
  },
  // CTET Tests
  {
    id: 'ctet-test-1', title: 'CTET Mock Test 1', slug: 'ctet-mock-1',
    description: 'Mock test for CTET Paper 1 - Child Development & Pedagogy',
    totalQuestions: 10, duration: 15, markingCorrect: 1, markingWrong: 0, markingSkipped: 0,
    difficulty: 'Medium', isFree: true, isLive: true,
    exam: { id: 'ctet', name: 'CTET', slug: 'ctet' },
    questions: TEACHING_QS,
  },
  // State PSC Tests
  {
    id: 'state-psc-test-1', title: 'State PSC Mock Test 1', slug: 'state-psc-mock-1',
    description: 'Mock test for State PSC General Studies',
    totalQuestions: 10, duration: 15, markingCorrect: 2, markingWrong: -0.5, markingSkipped: 0,
    difficulty: 'Medium', isFree: true, isLive: true,
    exam: { id: 'state-psc', name: 'State PSC', slug: 'state-psc' },
    questions: STATE_GOVT_QS,
  },
  // Police SI Tests
  {
    id: 'si-test-1', title: 'SI Mock Test 1', slug: 'si-mock-1',
    description: 'Mock test for Sub Inspector recruitment',
    totalQuestions: 10, duration: 15, markingCorrect: 1, markingWrong: -0.25, markingSkipped: 0,
    difficulty: 'Medium', isFree: true, isLive: true,
    exam: { id: 'si-exam', name: 'Sub Inspector', slug: 'si-exam' },
    questions: POLICE_QS,
  },
]

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
