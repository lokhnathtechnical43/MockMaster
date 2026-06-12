import { db } from './db';

export async function seedDatabase() {
  // Check if already seeded
  const existingCategories = await db.examCategory.count();
  if (existingCategories > 0) return { message: 'Already seeded' };

  // Create exam categories
  const sscCat = await db.examCategory.create({
    data: { name: 'SSC Exams', slug: 'ssc', icon: '📋', description: 'Staff Selection Commission exams', order: 1 }
  });
  const bankingCat = await db.examCategory.create({
    data: { name: 'Banking Exams', slug: 'banking', icon: '🏦', description: 'IBPS, SBI, RBI banking exams', order: 2 }
  });
  const railwayCat = await db.examCategory.create({
    data: { name: 'Railway Exams', slug: 'railways', icon: '🚂', description: 'RRB railway recruitment exams', order: 3 }
  });
  const stateCat = await db.examCategory.create({
    data: { name: 'State Govt Exams', slug: 'state-govt', icon: '🏛️', description: 'State level government exams', order: 4 }
  });
  const teachingCat = await db.examCategory.create({
    data: { name: 'Teaching Exams', slug: 'teaching', icon: '👨‍🏫', description: 'CTET, State TET teaching exams', order: 5 }
  });
  const defenceCat = await db.examCategory.create({
    data: { name: 'Defence Exams', slug: 'defence', icon: '🛡️', description: 'NDA, CDS, AFCAT defence exams', order: 6 }
  });
  const policeCat = await db.examCategory.create({
    data: { name: 'Police Exams', slug: 'police', icon: '👮', description: 'State and central police exams', order: 7 }
  });

  // Create exams
  const sscCgl = await db.exam.create({
    data: { name: 'SSC CGL', slug: 'ssc-cgl', categoryId: sscCat.id, description: 'Combined Graduate Level Exam', totalQuestions: 100, duration: 60, markingScheme: '+2,-0.5', order: 1 }
  });
  const sscChsl = await db.exam.create({
    data: { name: 'SSC CHSL', slug: 'ssc-chsl', categoryId: sscCat.id, description: 'Combined Higher Secondary Level', totalQuestions: 100, duration: 60, markingScheme: '+2,-0.5', order: 2 }
  });
  const sscMts = await db.exam.create({
    data: { name: 'SSC MTS', slug: 'ssc-mts', categoryId: sscCat.id, description: 'Multi Tasking Staff', totalQuestions: 100, duration: 90, markingScheme: '+1,-0.25', order: 3 }
  });
  const sscGd = await db.exam.create({
    data: { name: 'SSC GD Constable', slug: 'ssc-gd', categoryId: sscCat.id, description: 'General Duty Constable', totalQuestions: 80, duration: 60, markingScheme: '+2,-0.5', order: 4 }
  });

  const ibpsPo = await db.exam.create({
    data: { name: 'IBPS PO', slug: 'ibps-po', categoryId: bankingCat.id, description: 'Institute of Banking Personnel Selection - Probationary Officer', totalQuestions: 100, duration: 60, markingScheme: '+1,-0.25', order: 1 }
  });
  const ibpsClerk = await db.exam.create({
    data: { name: 'IBPS Clerk', slug: 'ibps-clerk', categoryId: bankingCat.id, description: 'IBPS Clerk Exam', totalQuestions: 100, duration: 60, markingScheme: '+1,-0.25', order: 2 }
  });
  const sbiPo = await db.exam.create({
    data: { name: 'SBI PO', slug: 'sbi-po', categoryId: bankingCat.id, description: 'State Bank of India - PO', totalQuestions: 100, duration: 60, markingScheme: '+1,-0.25', order: 3 }
  });
  const sbiClerk = await db.exam.create({
    data: { name: 'SBI Clerk', slug: 'sbi-clerk', categoryId: bankingCat.id, description: 'State Bank of India - Clerk', totalQuestions: 100, duration: 60, markingScheme: '+1,-0.25', order: 4 }
  });
  const rbiAssistant = await db.exam.create({
    data: { name: 'RBI Assistant', slug: 'rbi-assistant', categoryId: bankingCat.id, description: 'Reserve Bank of India Assistant', totalQuestions: 100, duration: 60, markingScheme: '+1,-0.25', order: 5 }
  });

  const rrbNtpc = await db.exam.create({
    data: { name: 'RRB NTPC', slug: 'rrb-ntpc', categoryId: railwayCat.id, description: 'Non-Technical Popular Categories', totalQuestions: 100, duration: 90, markingScheme: '+1,-0.33', order: 1 }
  });
  const rrbGroupD = await db.exam.create({
    data: { name: 'RRB Group D', slug: 'rrb-group-d', categoryId: railwayCat.id, description: 'Railway Group D Recruitment', totalQuestions: 100, duration: 90, markingScheme: '+1,-0.33', order: 2 }
  });
  const rrbAlp = await db.exam.create({
    data: { name: 'RRB ALP', slug: 'rrb-alp', categoryId: railwayCat.id, description: 'Assistant Loco Pilot', totalQuestions: 75, duration: 60, markingScheme: '+1,-0.33', order: 3 }
  });

  const wbcs = await db.exam.create({
    data: { name: 'WBCS', slug: 'wbcs', categoryId: stateCat.id, description: 'West Bengal Civil Service', totalQuestions: 100, duration: 90, markingScheme: '+1,-0.33', order: 1 }
  });
  const uppsc = await db.exam.create({
    data: { name: 'UPPSC', slug: 'uppsc', categoryId: stateCat.id, description: 'Uttar Pradesh Public Service Commission', totalQuestions: 100, duration: 120, markingScheme: '+1.33,-0.44', order: 2 }
  });
  const bpsc = await db.exam.create({
    data: { name: 'BPSC', slug: 'bpsc', categoryId: stateCat.id, description: 'Bihar Public Service Commission', totalQuestions: 100, duration: 120, markingScheme: '+1,-0.33', order: 3 }
  });

  const ctet = await db.exam.create({
    data: { name: 'CTET', slug: 'ctet', categoryId: teachingCat.id, description: 'Central Teacher Eligibility Test', totalQuestions: 150, duration: 150, markingScheme: '+1,0', order: 1 }
  });
  const upTet = await db.exam.create({
    data: { name: 'UPTET', slug: 'uptet', categoryId: teachingCat.id, description: 'Uttar Pradesh Teacher Eligibility Test', totalQuestions: 150, duration: 150, markingScheme: '+1,0', order: 2 }
  });

  const nda = await db.exam.create({
    data: { name: 'NDA', slug: 'nda', categoryId: defenceCat.id, description: 'National Defence Academy', totalQuestions: 150, duration: 150, markingScheme: '+2.5,-0.83 (Math); +4,-1.33 (GAT)', order: 1 }
  });
  const cds = await db.exam.create({
    data: { name: 'CDS', slug: 'cds', categoryId: defenceCat.id, description: 'Combined Defence Services', totalQuestions: 120, duration: 120, markingScheme: '+1,-0.33', order: 2 }
  });

  const upPolice = await db.exam.create({
    data: { name: 'UP Police Constable', slug: 'up-police', categoryId: policeCat.id, description: 'Uttar Pradesh Police Constable', totalQuestions: 150, duration: 120, markingScheme: '+1,-0.25', order: 1 }
  });
  const kolkataPolice = await db.exam.create({
    data: { name: 'Kolkata Police', slug: 'kolkata-police', categoryId: policeCat.id, description: 'Kolkata Police Constable/SI', totalQuestions: 100, duration: 90, markingScheme: '+1,-0.25', order: 2 }
  });

  // Create tests with questions for each exam
  const examTestMap: Record<string, { examId: string; tests: { title: string; questions: Array<{ q: string; a: string; b: string; c: string; d: string; ans: string; exp: string; subject: string }> }[]}> = {
    'ssc-cgl': {
      examId: sscCgl.id,
      tests: [
        {
          title: 'SSC CGL Tier I - General Awareness',
          questions: [
            { q: 'Who was the first President of India?', a: 'Dr. Rajendra Prasad', b: 'Jawaharlal Nehru', c: 'Sardar Patel', d: 'Mahatma Gandhi', ans: 'A', exp: 'Dr. Rajendra Prasad was the first President of India, serving from 1950 to 1962.', subject: 'General Awareness' },
            { q: 'Which planet is known as the Red Planet?', a: 'Venus', b: 'Jupiter', c: 'Mars', d: 'Saturn', ans: 'C', exp: 'Mars is called the Red Planet due to iron oxide (rust) on its surface giving it a reddish appearance.', subject: 'General Awareness' },
            { q: 'The currency of Japan is:', a: 'Yuan', b: 'Won', c: 'Yen', d: 'Ringgit', ans: 'C', exp: 'The Japanese Yen (¥) is the official currency of Japan.', subject: 'General Awareness' },
            { q: 'Which vitamin is produced by sunlight?', a: 'Vitamin A', b: 'Vitamin B', c: 'Vitamin C', d: 'Vitamin D', ans: 'D', exp: 'Vitamin D is produced when ultraviolet rays from sunlight strike the skin and trigger vitamin D synthesis.', subject: 'General Awareness' },
            { q: 'The battle of Plassey was fought in:', a: '1757', b: '1764', c: '1857', d: '1947', ans: 'A', exp: 'The Battle of Plassey was fought on 23 June 1757 between the British East India Company and the Nawab of Bengal.', subject: 'General Awareness' },
            { q: 'Which is the largest state in India by area?', a: 'Madhya Pradesh', b: 'Maharashtra', c: 'Rajasthan', d: 'Uttar Pradesh', ans: 'C', exp: 'Rajasthan is the largest state in India by area, covering 342,239 sq km.', subject: 'General Awareness' },
            { q: 'Who wrote the Indian national anthem?', a: 'Bankim Chandra Chatterjee', b: 'Rabindranath Tagore', c: 'Sarojini Naidu', d: 'Subhash Chandra Bose', ans: 'B', exp: 'Jana Gana Mana was written by Rabindranath Tagore. It was adopted as India\'s national anthem on 24 January 1950.', subject: 'General Awareness' },
            { q: 'Which organ purifies blood in the human body?', a: 'Heart', b: 'Liver', c: 'Kidney', d: 'Lungs', ans: 'C', exp: 'Kidneys filter waste products and excess fluid from the blood, which are then excreted as urine.', subject: 'General Awareness' },
            { q: 'The headquarters of UNO is located in:', a: 'Geneva', b: 'Paris', c: 'New York', d: 'London', ans: 'C', exp: 'The United Nations Headquarters is located in New York City, USA.', subject: 'General Awareness' },
            { q: 'Which gas is most abundant in the atmosphere?', a: 'Oxygen', b: 'Carbon Dioxide', c: 'Nitrogen', d: 'Hydrogen', ans: 'C', exp: 'Nitrogen makes up approximately 78% of Earth\'s atmosphere.', subject: 'General Awareness' },
          ]
        },
        {
          title: 'SSC CGL Tier I - Quantitative Aptitude',
          questions: [
            { q: 'If the ratio of A to B is 3:5 and B to C is 4:7, then A:B:C is:', a: '12:20:35', b: '3:5:7', c: '12:20:28', d: '15:25:35', ans: 'A', exp: 'A:B = 3:5, B:C = 4:7. Making B equal: A:B:C = 12:20:35', subject: 'Quantitative Aptitude' },
            { q: 'A train 150m long running at 72 km/h crosses a platform in 25 seconds. The length of the platform is:', a: '250m', b: '300m', c: '350m', d: '400m', ans: 'C', exp: 'Speed = 72 km/h = 20 m/s. Distance = 20 × 25 = 500m. Platform = 500 - 150 = 350m.', subject: 'Quantitative Aptitude' },
            { q: 'The simple interest on ₹5,000 at 8% per annum for 3 years is:', a: '₹1,000', b: '₹1,200', c: '₹1,500', d: '₹2,000', ans: 'B', exp: 'SI = P × R × T / 100 = 5000 × 8 × 3 / 100 = ₹1,200', subject: 'Quantitative Aptitude' },
            { q: 'If 20% of a number is 80, then what is the number?', a: '200', b: '300', c: '400', d: '500', ans: 'C', exp: '20% of x = 80, so x = 80 × 100/20 = 400', subject: 'Quantitative Aptitude' },
            { q: 'The average of first 10 natural numbers is:', a: '4.5', b: '5', c: '5.5', d: '6', ans: 'C', exp: 'Sum of first 10 natural numbers = 55. Average = 55/10 = 5.5', subject: 'Quantitative Aptitude' },
            { q: 'A can do a work in 15 days and B can do it in 10 days. Together they will do the work in:', a: '5 days', b: '6 days', c: '8 days', d: '25 days', ans: 'B', exp: 'A\'s 1 day work = 1/15, B\'s = 1/10. Together = 1/15 + 1/10 = 1/6. So 6 days.', subject: 'Quantitative Aptitude' },
            { q: 'The LCM of 12, 18 and 24 is:', a: '48', b: '72', c: '96', d: '144', ans: 'B', exp: '12 = 2²×3, 18 = 2×3², 24 = 2³×3. LCM = 2³×3² = 72', subject: 'Quantitative Aptitude' },
            { q: 'If the cost price is ₹400 and selling price is ₹500, the profit percentage is:', a: '20%', b: '25%', c: '30%', d: '50%', ans: 'B', exp: 'Profit = 500 - 400 = 100. Profit % = 100/400 × 100 = 25%', subject: 'Quantitative Aptitude' },
            { q: 'The value of (0.04)^(-1.5) is:', a: '25', b: '125', c: '250', d: '625', ans: 'B', exp: '(0.04)^(-1.5) = (1/25)^(-3/2) = 25^(3/2) = 125', subject: 'Quantitative Aptitude' },
            { q: 'In a right triangle, if base = 6 and perpendicular = 8, the hypotenuse is:', a: '9', b: '10', c: '12', d: '14', ans: 'B', exp: 'By Pythagoras theorem: √(6² + 8²) = √(36 + 64) = √100 = 10', subject: 'Quantitative Aptitude' },
          ]
        }
      ]
    },
    'ibps-po': {
      examId: ibpsPo.id,
      tests: [
        {
          title: 'IBPS PO Prelims - Reasoning Ability',
          questions: [
            { q: 'In a certain code, COMPUTER is written as RFUVQNPC. How is MEDICINE written in that code?', a: 'EOJDEJFM', b: 'EOJDJEFM', c: 'MFEDJEOJ', d: 'MFEJDJOE', ans: 'B', exp: 'Each letter is replaced by the letter that follows it in the alphabet and the code is written in reverse order.', subject: 'Reasoning' },
            { q: 'Pointing to a photograph, a man says "She is the daughter of my grandfather\'s only son." How is the girl related to the man?', a: 'Sister', b: 'Cousin', c: 'Mother', d: 'Niece', ans: 'A', exp: 'Grandfather\'s only son = Father. Father\'s daughter = Sister.', subject: 'Reasoning' },
            { q: 'If South-East becomes North, then what does North-West become?', a: 'South', b: 'North-East', c: 'East', d: 'South-West', ans: 'D', exp: 'South-East becoming North means a 135° clockwise rotation. Applying same rotation to North-West gives South-West.', subject: 'Reasoning' },
            { q: 'Complete the series: 2, 6, 12, 20, 30, ?', a: '40', b: '42', c: '44', d: '46', ans: 'B', exp: 'Differences: 4, 6, 8, 10, 12. Next term = 30 + 12 = 42', subject: 'Reasoning' },
            { q: 'A is B\'s sister. C is B\'s mother. D is C\'s father. E is D\'s mother. How is A related to D?', a: 'Granddaughter', b: 'Daughter', c: 'Grand-mother', d: 'Grand-father', ans: 'A', exp: 'A is B\'s sister, C is their mother, D is C\'s father. So A is D\'s granddaughter.', subject: 'Reasoning' },
            { q: 'In a row of 40 students, Ravi is 7th from the left and Sumit is 15th from the right. How many students are between them?', a: '18', b: '19', c: '20', d: '21', ans: 'A', exp: 'Ravi\'s position from right = 40 - 7 + 1 = 34. Students between = 34 - 15 - 1 = 18', subject: 'Reasoning' },
            { q: 'Which word does NOT belong with the others?', a: 'Parsnip', b: 'Potato', c: 'Carrot', d: 'Turnip', ans: 'B', exp: 'Potato is a stem tuber while others are root vegetables.', subject: 'Reasoning' },
            { q: 'If APPLE = 50, BANANA = 42, then CHERRY = ?', a: '63', b: '72', c: '81', d: '90', ans: 'C', exp: 'Sum of letter positions: C(3)+H(8)+E(5)+R(18)+R(18)+Y(25) = 77. With pattern adjustment = 81.', subject: 'Reasoning' },
            { q: 'A man walks 5 km south, then 3 km east, then 5 km north. How far is he from the starting point?', a: '3 km', b: '5 km', c: '8 km', d: '10 km', ans: 'A', exp: 'After walking 5km south and 5km north, he is back to same latitude. He is 3km east of start.', subject: 'Reasoning' },
            { q: 'Which number replaces the question mark? 3, 9, 27, 81, ?', a: '162', b: '243', c: '324', d: '729', ans: 'B', exp: 'Each number is multiplied by 3. 81 × 3 = 243.', subject: 'Reasoning' },
          ]
        },
        {
          title: 'IBPS PO Prelims - English Language',
          questions: [
            { q: 'Choose the correct synonym of "DILIGENT":', a: 'Lazy', b: 'Hardworking', c: 'Careless', d: 'Dull', ans: 'B', exp: 'Diligent means showing careful and persistent effort; hardworking.', subject: 'English' },
            { q: 'Choose the correct antonym of "BENEVOLENT":', a: 'Kind', b: 'Generous', c: 'Malevolent', d: 'Charitable', ans: 'C', exp: 'Benevolent means well-meaning and kindly. Malevolent is its opposite - having evil intent.', subject: 'English' },
            { q: 'Fill in the blank: She was ___ about the outcome of the interview.', a: 'anxious', b: 'anxiety', c: 'anxiously', d: 'anxiousness', ans: 'A', exp: 'The adjective "anxious" is needed after "was" to describe her state.', subject: 'English' },
            { q: 'Identify the error: "Each of the boys have completed their assignment."', a: 'Each', b: 'have', c: 'completed', d: 'their', ans: 'B', exp: '"Each" is singular, so it should be "has" instead of "have".', subject: 'English' },
            { q: 'Choose the correctly spelt word:', a: 'Accomodation', b: 'Accommodation', c: 'Acomodation', d: 'Acommodation', ans: 'B', exp: 'The correct spelling is "Accommodation" with double c and double m.', subject: 'English' },
            { q: 'The phrase "To burn the midnight oil" means:', a: 'To waste oil', b: 'To work late at night', c: 'To set fire', d: 'To cook at night', ans: 'B', exp: '"Burn the midnight oil" is an idiom meaning to work or study late into the night.', subject: 'English' },
            { q: 'Choose the correct passive voice: "She writes a letter."', a: 'A letter is written by her.', b: 'A letter was written by her.', c: 'A letter has been written by her.', d: 'A letter will be written by her.', ans: 'A', exp: 'Present simple passive: Subject + is/am/are + past participle + by + agent.', subject: 'English' },
            { q: 'Rearrange: P. the company / Q. decided to / R. its employees / S. give bonuses to', a: 'PQRS', b: 'PQSR', c: 'QPRS', d: 'QPSR', ans: 'D', exp: 'The company decided to give bonuses to its employees.', subject: 'English' },
            { q: 'Choose the appropriate word: The government ___ new policies to boost the economy.', a: 'implemented', b: 'implement', c: 'implementing', d: 'implementation', ans: 'A', exp: 'Past tense "implemented" fits correctly in this declarative sentence about a completed action.', subject: 'English' },
            { q: '"Break the ice" means:', a: 'Destroy ice', b: 'Start a conversation', c: 'Create problems', d: 'Cool down', ans: 'B', exp: '"Break the ice" means to initiate conversation or relieve tension in a social setting.', subject: 'English' },
          ]
        }
      ]
    },
    'rrb-ntpc': {
      examId: rrbNtpc.id,
      tests: [
        {
          title: 'RRB NTPC CBT 1 - General Knowledge',
          questions: [
            { q: 'Who invented the telephone?', a: 'Thomas Edison', b: 'Alexander Graham Bell', c: 'Isaac Newton', d: 'Albert Einstein', ans: 'B', exp: 'Alexander Graham Bell invented the telephone in 1876.', subject: 'General Knowledge' },
            { q: 'Which is the longest river in India?', a: 'Yamuna', b: 'Godavari', c: 'Ganga', d: 'Brahmaputra', ans: 'C', exp: 'The Ganga is the longest river in India, flowing about 2,525 km.', subject: 'General Knowledge' },
            { q: 'The Indian Constitution was adopted on:', a: '15 August 1947', b: '26 January 1950', c: '26 November 1949', d: '2 October 1950', ans: 'C', exp: 'The Constitution was adopted on 26 November 1949 and came into effect on 26 January 1950.', subject: 'General Knowledge' },
            { q: 'Which state is known as the "Spice Garden of India"?', a: 'Kerala', b: 'Karnataka', c: 'Tamil Nadu', d: 'Andhra Pradesh', ans: 'A', exp: 'Kerala is known as the "Spice Garden of India" due to its production of various spices.', subject: 'General Knowledge' },
            { q: 'The chemical formula of water is:', a: 'HO₂', b: 'H₂O', c: 'H₂O₂', d: 'OH', ans: 'B', exp: 'Water is H₂O - two hydrogen atoms bonded to one oxygen atom.', subject: 'General Knowledge' },
            { q: 'Who is known as the "Father of the Indian Nuclear Program"?', a: 'APJ Abdul Kalam', b: 'Homi J. Bhabha', c: 'Vikram Sarabhai', d: 'C.V. Raman', ans: 'B', exp: 'Homi Jehangir Bhabha is considered the Father of the Indian Nuclear Program.', subject: 'General Knowledge' },
            { q: 'The Tropic of Cancer passes through how many Indian states?', a: '6', b: '7', c: '8', d: '9', ans: 'C', exp: 'The Tropic of Cancer passes through 8 Indian states: Gujarat, Rajasthan, MP, Chhattisgarh, Jharkhand, WB, Tripura, Mizoram.', subject: 'General Knowledge' },
            { q: 'Which article of the Indian Constitution abolishes untouchability?', a: 'Article 14', b: 'Article 15', c: 'Article 17', d: 'Article 21', ans: 'C', exp: 'Article 17 of the Indian Constitution abolishes untouchability and its practice in any form.', subject: 'General Knowledge' },
            { q: 'The headquarters of the Indian Railways is in:', a: 'Mumbai', b: 'Kolkata', c: 'New Delhi', d: 'Chennai', ans: 'C', exp: 'The Ministry of Railways headquartered in New Delhi oversees the Indian Railways.', subject: 'General Knowledge' },
            { q: 'The first Indian satellite was:', a: 'Bhaskara', b: 'Aryabhata', c: 'Rohini', d: 'INSAT-1A', ans: 'B', exp: 'Aryabhata was India\'s first satellite, launched on 19 April 1975 by the Soviet Union.', subject: 'General Knowledge' },
          ]
        }
      ]
    },
    'wbcs': {
      examId: wbcs.id,
      tests: [
        {
          title: 'WBCS Prelims - General Studies',
          questions: [
            { q: 'The Battle of Buxar was fought in which year?', a: '1757', b: '1764', c: '1857', d: '1905', ans: 'B', exp: 'The Battle of Buxar was fought on 22 October 1764 between the British East India Company and the combined armies of Mir Qasim, Shuja-ud-Daulah, and Shah Alam II.', subject: 'History' },
            { q: 'Who founded the Indian National Congress?', a: 'Dadabhai Naoroji', b: 'A.O. Hume', c: 'W.C. Bonnerjee', d: 'Surendranath Banerjee', ans: 'B', exp: 'Allan Octavian Hume founded the Indian National Congress in 1885. W.C. Bonnerjee was its first president.', subject: 'History' },
            { q: 'The Bengal Partition was annulled in which year?', a: '1905', b: '1911', c: '1919', d: '1947', ans: 'B', exp: 'The Partition of Bengal (1905) was annulled in 1911 due to widespread protests and the Swadeshi movement.', subject: 'History' },
            { q: 'Sundarbans is famous for:', a: 'One-horned rhino', b: 'Royal Bengal Tiger', c: 'Snow leopard', d: 'Asiatic lion', ans: 'B', exp: 'The Sundarbans mangrove forest is the natural habitat of the Royal Bengal Tiger and is a UNESCO World Heritage Site.', subject: 'Geography' },
            { q: 'The Damodar Valley Corporation is modeled on which American authority?', a: 'TVA', b: 'BPA', c: 'USBR', d: 'FERC', ans: 'A', exp: 'The Damodar Valley Corporation was modeled on the Tennessee Valley Authority (TVA) of the USA.', subject: 'Geography' },
            { q: 'Who wrote "Anandamath"?', a: 'Rabindranath Tagore', b: 'Bankim Chandra Chattopadhyay', c: 'Sarat Chandra Chattopadhyay', d: 'Ishwar Chandra Vidyasagar', ans: 'B', exp: 'Anandamath was written by Bankim Chandra Chattopadhyay in 1882. It contains the song "Vande Mataram".', subject: 'Literature' },
            { q: 'Which West Bengal district is known as "Rice Bowl of Bengal"?', a: 'Burdwan', b: 'Murshidabad', c: 'Nadia', d: 'Hooghly', ans: 'A', exp: 'Burdwan (now Purba and Paschim Bardhaman) is known as the "Rice Bowl of Bengal" for its rich agricultural output.', subject: 'Geography' },
            { q: 'The Panchayat system in West Bengal was reformed in:', a: '1977', b: '1983', c: '1992', d: '1996', ans: 'B', exp: 'The Left Front government reformed the Panchayat system in West Bengal in 1983, devolving significant power to local bodies.', subject: 'Polity' },
            { q: 'The Indian Constitution provides for how many Fundamental Rights?', a: '5', b: '6', c: '7', d: '8', ans: 'B', exp: 'The Indian Constitution originally provided 7 Fundamental Rights. After the 44th Amendment removed Right to Property, there are now 6 Fundamental Rights.', subject: 'Polity' },
            { q: 'Victoria Memorial was built during the tenure of which Viceroy?', a: 'Lord Curzon', b: 'Lord Ripon', c: 'Lord Dalhousie', d: 'Lord Mountbatten', ans: 'A', exp: 'The Victoria Memorial was conceived by Lord Curzon and built between 1906-1921 in memory of Queen Victoria.', subject: 'History' },
          ]
        }
      ]
    },
    'ctet': {
      examId: ctet.id,
      tests: [
        {
          title: 'CTET Paper I - Child Development & Pedagogy',
          questions: [
            { q: 'According to Piaget, the concrete operational stage covers the age group of:', a: '0-2 years', b: '2-7 years', c: '7-11 years', d: '11+ years', ans: 'C', exp: 'Piaget\'s concrete operational stage covers ages 7-11, where children develop logical thinking about concrete objects.', subject: 'Child Development' },
            { q: 'Vygotsky\'s concept of "Zone of Proximal Development" refers to:', a: 'What a child can do independently', b: 'What a child can do with help', c: 'What a child cannot do at all', d: 'What a child has already learned', ans: 'B', exp: 'ZPD is the difference between what a learner can do without help and what they can achieve with guidance.', subject: 'Child Development' },
            { q: 'Which theory suggests that learning is a social process?', a: 'Behaviorism', b: 'Constructivism', c: 'Social Learning Theory', d: 'Cognitivism', ans: 'C', exp: 'Bandura\'s Social Learning Theory emphasizes that learning occurs through observation and interaction with others.', subject: 'Child Development' },
            { q: 'Inclusive education means:', a: 'Separate schools for disabled children', b: 'Education for all children together', c: 'Only gifted children in schools', d: 'Special coaching at home', ans: 'B', exp: 'Inclusive education means all students, regardless of ability, learn together in the same classroom with appropriate support.', subject: 'Pedagogy' },
            { q: 'The primary objective of formative assessment is:', a: 'To grade students', b: 'To rank students', c: 'To improve learning', d: 'To pass or fail students', ans: 'C', exp: 'Formative assessment is ongoing and aims to monitor student learning and provide feedback to improve teaching and learning.', subject: 'Pedagogy' },
            { q: 'Howard Gardner proposed the theory of:', a: 'Emotional Intelligence', b: 'Multiple Intelligences', c: 'Cognitive Development', d: 'Moral Development', ans: 'B', exp: 'Howard Gardner proposed the Multiple Intelligences theory, identifying 8 types of intelligence including linguistic, logical-mathematical, musical, etc.', subject: 'Child Development' },
            { q: 'A child who can classify objects according to their shape and color is in which stage?', a: 'Sensorimotor', b: 'Pre-operational', c: 'Concrete operational', d: 'Formal operational', ans: 'C', exp: 'Classification by multiple attributes (shape and color) is a hallmark of the concrete operational stage.', subject: 'Child Development' },
            { q: 'Which of the following is a characteristic of a gifted child?', a: 'Average memory', b: 'Quick learning ability', c: 'Slow comprehension', d: 'Limited curiosity', ans: 'B', exp: 'Gifted children typically show quick learning ability, exceptional memory, high curiosity, and advanced problem-solving skills.', subject: 'Child Development' },
            { q: 'The "MKO" in Vygotsky\'s theory stands for:', a: 'Most Knowledgeable Observer', b: 'More Knowledgeable Other', c: 'Main Knowledge Object', d: 'Maximum Knowledge Output', ans: 'B', exp: 'MKO stands for More Knowledgeable Other - anyone with better understanding or ability than the learner.', subject: 'Child Development' },
            { q: 'Discovery learning was proposed by:', a: 'Skinner', b: 'Bruner', c: 'Pavlov', d: 'Thorndike', ans: 'B', exp: 'Jerome Bruner proposed discovery learning, where students construct their own knowledge through exploration.', subject: 'Pedagogy' },
          ]
        }
      ]
    }
  };

  // Create tests and questions for each exam
  for (const [, examData] of Object.entries(examTestMap)) {
    for (let t = 0; t < examData.tests.length; t++) {
      const testData = examData.tests[t];
      const test = await db.test.create({
        data: {
          title: testData.title,
          slug: `${testData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${t}`,
          examId: examData.examId,
          totalQuestions: testData.questions.length,
          duration: 10, // 10 minutes for demo
          markingCorrect: 1.0,
          markingWrong: 0.0,
          markingSkipped: 0.0,
          difficulty: 'mixed',
          isFree: true,
          active: true,
        }
      });

      for (let q = 0; q < testData.questions.length; q++) {
        const qData = testData.questions[q];
        await db.question.create({
          data: {
            testId: test.id,
            questionText: qData.q,
            optionA: qData.a,
            optionB: qData.b,
            optionC: qData.c,
            optionD: qData.d,
            correctAnswer: qData.ans,
            explanation: qData.exp,
            subject: qData.subject,
            difficulty: 'medium',
            order: q + 1,
          }
        });
      }
    }
  }

  return { message: 'Database seeded successfully!' };
}
