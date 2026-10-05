import React, { createContext, useContext, useState, useEffect } from 'react';
import { Test, TestResult, StudentGroup, User, Question, TelegramConfig } from '../types';
import { sendResultToTelegram } from '../services/telegram';

interface DataContextType {
  tests: Test[];
  results: TestResult[];
  groups: StudentGroup[];
  students: User[];
  questionsBank: Question[];
  telegramConfig: TelegramConfig;
  isOnline: boolean;
  addTest: (test: Omit<Test, 'id' | 'createdAt'>) => Test;
  updateTest: (id: string, test: Partial<Test>) => void;
  deleteTest: (id: string) => void;
  addQuestion: (question: Omit<Question, 'id'>) => Question;
  addQuestionsBatch: (questions: Omit<Question, 'id'>[]) => void;
  deleteQuestion: (id: string) => void;
  addGroup: (group: Omit<StudentGroup, 'id' | 'createdAt' | 'studentCount'>) => void;
  deleteGroup: (id: string) => void;
  addStudent: (student: Omit<User, 'id' | 'createdAt' | 'role'>) => void;
  deleteStudent: (id: string) => void;
  submitResult: (result: Omit<TestResult, 'id' | 'completedAt'>) => Promise<TestResult>;
  saveTelegramConfig: (config: TelegramConfig) => void;
  resetAllData: () => void;
}

const DEFAULT_GROUPS: StudentGroup[] = [
  {
    id: 'grp-9a',
    name: '9-A Guruh',
    description: 'Axborot texnologiyalari va dasturlash yo\'nalishi',
    studentCount: 28,
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'grp-10b',
    name: '10-B Guruh',
    description: 'Aniq fanlar (Matematika va Fizika) chuqurlashtirilgan kursi',
    studentCount: 26,
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'grp-11a',
    name: '11-A Guruh',
    description: 'Bitiruvchi bosqich, DTM va IELTS tayyorgarlik kursi',
    studentCount: 24,
    createdAt: '2026-09-01T08:00:00.000Z',
  },
];

const DEFAULT_QUESTIONS_BANK: Question[] = [
  {
    id: 'q-math-1',
    text: 'Agar f(x) = 2x² - 4x + 5 bo\'lsa, funksiyaning eng kichik qiymatini toping.',
    options: [
      { id: 'A', text: '1' },
      { id: 'B', text: '3' },
      { id: 'C', text: '5' },
      { id: 'D', text: '-3' },
    ],
    correctOptionId: 'B',
    explanation: 'Parabola uchi x = -b/(2a) = 4 / (2*2) = 1. f(1) = 2(1)² - 4(1) + 5 = 2 - 4 + 5 = 3.',
    subject: 'Matematika',
    difficulty: 'orta',
    points: 1,
  },
  {
    id: 'q-math-2',
    text: 'log₂(32) + log₃(27) ifodaning qiymatini hisoblang.',
    options: [
      { id: 'A', text: '7' },
      { id: 'B', text: '8' },
      { id: 'C', text: '9' },
      { id: 'D', text: '6' },
    ],
    correctOptionId: 'B',
    explanation: 'log₂(32) = 5, chunki 2⁵ = 32. log₃(27) = 3, chunki 3³ = 27. 5 + 3 = 8.',
    subject: 'Matematika',
    difficulty: 'oson',
    points: 1,
  },
  {
    id: 'q-math-3',
    text: 'To\'g\'ri burchakli uchburchakning katetlari 6 va 8 ga teng bo\'lsa, unga tashqi chizilgan aylana radiusini toping.',
    options: [
      { id: 'A', text: '5' },
      { id: 'B', text: '10' },
      { id: 'C', text: '7' },
      { id: 'D', text: '4' },
    ],
    correctOptionId: 'A',
    explanation: 'Gipotenuza c = √(6² + 8²) = 10. To\'g\'ri burchakli uchburchakka tashqi chizilgan aylana radiusi R = c / 2 = 10 / 2 = 5.',
    subject: 'Matematika',
    difficulty: 'orta',
    points: 1,
  },
  {
    id: 'q-math-4',
    text: 'Aritmetik progressiyada a₁ = 3, d = 4 bo\'lsa, progressiyaning 10-hadi (a₁₀) nechaga teng?',
    options: [
      { id: 'A', text: '36' },
      { id: 'B', text: '39' },
      { id: 'C', text: '40' },
      { id: 'D', text: '43' },
    ],
    correctOptionId: 'B',
    explanation: 'a_n = a₁ + (n - 1) * d. a₁₀ = 3 + (10 - 1) * 4 = 3 + 36 = 39.',
    subject: 'Matematika',
    difficulty: 'oson',
    points: 1,
  },
  {
    id: 'q-cs-1',
    text: 'Qaysi ma\'lumotlar tuzilmasi LIFO (Last In First Out) prinsipi bo\'yicha ishlaydi?',
    options: [
      { id: 'A', text: 'Queue (Navbat)' },
      { id: 'B', text: 'Stack (Stek)' },
      { id: 'C', text: 'Linked List' },
      { id: 'D', text: 'Binary Tree' },
    ],
    correctOptionId: 'B',
    explanation: 'Stack elementlarni oxirgi kiritilgan birinchi chiqishi (LIFO - Last In First Out) asosida boshqaradi.',
    subject: 'Informatika',
    difficulty: 'oson',
    points: 1,
  },
  {
    id: 'q-cs-2',
    text: 'O(log n) vaqt murakkabligiga ega bo\'lgan qidirish algoritmi qaysi?',
    options: [
      { id: 'A', text: 'Linear Search' },
      { id: 'B', text: 'Binary Search (Ikkilik qidirish)' },
      { id: 'C', text: 'Bubble Sort' },
      { id: 'D', text: 'Depth First Search' },
    ],
    correctOptionId: 'B',
    explanation: 'Binary Search tartiblangan massivda har qadamda qidiruv maydonini ikkiga bo\'lib O(log n) vaqt oladi.',
    subject: 'Informatika',
    difficulty: 'orta',
    points: 1,
  },
  {
    id: 'q-cs-3',
    text: 'JavaScript-da massivning oxiriga yangi element qo\'shish uchun qaysi metod ishlatiladi?',
    options: [
      { id: 'A', text: 'pop()' },
      { id: 'B', text: 'shift()' },
      { id: 'C', text: 'push()' },
      { id: 'D', text: 'unshift()' },
    ],
    correctOptionId: 'C',
    explanation: 'push() metodi massiv oxiriga element qo\'shadi, pop() esa oxirgisini o\'chiradi.',
    subject: 'Informatika',
    difficulty: 'oson',
    points: 1,
  },
  {
    id: 'q-eng-1',
    text: 'Choose the correct sentence in Present Perfect Continuous tense:',
    options: [
      { id: 'A', text: 'I am studying for three hours.' },
      { id: 'B', text: 'I have been studying for three hours.' },
      { id: 'C', text: 'I had studied for three hours.' },
      { id: 'D', text: 'I study for three hours.' },
    ],
    correctOptionId: 'B',
    explanation: 'Present Perfect Continuous form is have/has + been + V-ing, describing an action started in the past and continuing now.',
    subject: 'Ingliz tili',
    difficulty: 'orta',
    points: 1,
  },
  {
    id: 'q-eng-2',
    text: 'What is the synonym of the word "Meticulous"?',
    options: [
      { id: 'A', text: 'Careless' },
      { id: 'B', text: 'Thorough and careful' },
      { id: 'C', text: 'Quick and fast' },
      { id: 'D', text: 'Lazy' },
    ],
    correctOptionId: 'B',
    explanation: '"Meticulous" means showing great attention to detail; very careful and precise.',
    subject: 'Ingliz tili',
    difficulty: 'qiyin',
    points: 1,
  },
];

const DEFAULT_TESTS: Test[] = [
  {
    id: 'test-math-101',
    title: 'Matematika: Funksiyalar, Tenglamalar va Geometriya',
    description: 'Chiziqli va kvadrat funksiyalar, logarifmlar, geometrik progressiya va uchburchaklar bo\'yicha nazorat testi.',
    subject: 'Matematika',
    category: 'Aniq fanlar',
    durationMinutes: 20,
    passingScore: 70,
    targetGroups: ['grp-9a', 'grp-10b', 'grp-11a'],
    isActive: true,
    shuffleQuestions: true,
    shuffleOptions: true,
    showResultsImmediately: true,
    createdAt: '2026-09-15T10:00:00.000Z',
    createdByTeacherName: 'Dilshodbek Rustamov',
    deadline: '2026-10-30T23:59:00.000Z',
    questions: [
      DEFAULT_QUESTIONS_BANK[0],
      DEFAULT_QUESTIONS_BANK[1],
      DEFAULT_QUESTIONS_BANK[2],
      DEFAULT_QUESTIONS_BANK[3],
    ],
  },
  {
    id: 'test-cs-201',
    title: 'Informatika: Ma\'lumotlar tuzilmasi va Dasturlash',
    description: 'Stack, Queue, algoritmik murakkablik va zamonaviy web texnologiyalari bo\'yicha amaliy test.',
    subject: 'Informatika',
    category: 'IT va Dasturlash',
    durationMinutes: 15,
    passingScore: 65,
    targetGroups: ['grp-9a', 'grp-10b'],
    isActive: true,
    shuffleQuestions: true,
    shuffleOptions: true,
    showResultsImmediately: true,
    createdAt: '2026-09-20T14:30:00.000Z',
    createdByTeacherName: 'Dilshodbek Rustamov',
    deadline: '2026-11-15T23:59:00.000Z',
    questions: [
      DEFAULT_QUESTIONS_BANK[4],
      DEFAULT_QUESTIONS_BANK[5],
      DEFAULT_QUESTIONS_BANK[6],
    ],
  },
  {
    id: 'test-eng-301',
    title: 'Ingliz tili: CEFR B1/B2 Grammar & Vocabulary',
    description: 'Tenses, complex grammar structures and advanced academic vocabulary test.',
    subject: 'Ingliz tili',
    category: 'Xorijiy tillar',
    durationMinutes: 15,
    passingScore: 70,
    targetGroups: ['grp-9a', 'grp-10b', 'grp-11a'],
    isActive: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    showResultsImmediately: true,
    createdAt: '2026-09-25T09:00:00.000Z',
    createdByTeacherName: 'Shahnoza Yusupova',
    deadline: '2026-11-01T20:00:00.000Z',
    questions: [
      DEFAULT_QUESTIONS_BANK[7],
      DEFAULT_QUESTIONS_BANK[8],
    ],
  },
];

const DEFAULT_STUDENTS: User[] = [
  {
    id: 'usr-student-1',
    name: 'Azizbek Aliyev',
    email: 'azizbek@testhub.uz',
    role: 'student',
    groupName: '9-A Guruh',
    phone: '+998 90 123 45 67',
    createdAt: '2026-09-02T10:00:00.000Z',
  },
  {
    id: 'usr-student-2',
    name: 'Madina Karimova',
    email: 'madina@testhub.uz',
    role: 'student',
    groupName: '9-A Guruh',
    phone: '+998 93 234 56 78',
    createdAt: '2026-09-03T11:00:00.000Z',
  },
  {
    id: 'usr-student-3',
    name: 'Jasur Mahmudov',
    email: 'jasur@testhub.uz',
    role: 'student',
    groupName: '10-B Guruh',
    phone: '+998 97 345 67 89',
    createdAt: '2026-09-05T09:30:00.000Z',
  },
  {
    id: 'usr-student-4',
    name: 'Rayhona Sobirova',
    email: 'rayhona@testhub.uz',
    role: 'student',
    groupName: '11-A Guruh',
    phone: '+998 99 456 78 90',
    createdAt: '2026-09-06T15:20:00.000Z',
  },
  {
    id: 'usr-student-5',
    name: 'Sardor Saidov',
    email: 'sardor@testhub.uz',
    role: 'student',
    groupName: '10-B Guruh',
    phone: '+998 91 567 89 01',
    createdAt: '2026-09-08T12:00:00.000Z',
  },
];

const DEFAULT_RESULTS: TestResult[] = [
  {
    id: 'res-1',
    testId: 'test-math-101',
    testTitle: 'Matematika: Funksiyalar, Tenglamalar va Geometriya',
    subject: 'Matematika',
    studentId: 'usr-student-1',
    studentName: 'Azizbek Aliyev',
    studentGroup: '9-A Guruh',
    score: 4,
    totalQuestions: 4,
    percentage: 100,
    passed: true,
    timeSpentSeconds: 742,
    tabSwitchCount: 0,
    completedAt: '2026-09-28T14:22:00.000Z',
    answers: [
      { questionId: 'q-math-1', selectedOptionId: 'B', isCorrect: true },
      { questionId: 'q-math-2', selectedOptionId: 'B', isCorrect: true },
      { questionId: 'q-math-3', selectedOptionId: 'A', isCorrect: true },
      { questionId: 'q-math-4', selectedOptionId: 'B', isCorrect: true },
    ],
  },
  {
    id: 'res-2',
    testId: 'test-cs-201',
    testTitle: 'Informatika: Ma\'lumotlar tuzilmasi va Dasturlash',
    subject: 'Informatika',
    studentId: 'usr-student-1',
    studentName: 'Azizbek Aliyev',
    studentGroup: '9-A Guruh',
    score: 2,
    totalQuestions: 3,
    percentage: 67,
    passed: true,
    timeSpentSeconds: 520,
    tabSwitchCount: 1,
    completedAt: '2026-09-30T16:45:00.000Z',
    answers: [
      { questionId: 'q-cs-1', selectedOptionId: 'B', isCorrect: true },
      { questionId: 'q-cs-2', selectedOptionId: 'B', isCorrect: true },
      { questionId: 'q-cs-3', selectedOptionId: 'A', isCorrect: false },
    ],
  },
  {
    id: 'res-3',
    testId: 'test-math-101',
    testTitle: 'Matematika: Funksiyalar, Tenglamalar va Geometriya',
    subject: 'Matematika',
    studentId: 'usr-student-2',
    studentName: 'Madina Karimova',
    studentGroup: '9-A Guruh',
    score: 3,
    totalQuestions: 4,
    percentage: 75,
    passed: true,
    timeSpentSeconds: 890,
    tabSwitchCount: 0,
    completedAt: '2026-09-29T10:15:00.000Z',
    answers: [
      { questionId: 'q-math-1', selectedOptionId: 'B', isCorrect: true },
      { questionId: 'q-math-2', selectedOptionId: 'B', isCorrect: true },
      { questionId: 'q-math-3', selectedOptionId: 'B', isCorrect: false },
      { questionId: 'q-math-4', selectedOptionId: 'B', isCorrect: true },
    ],
  },
  {
    id: 'res-4',
    testId: 'test-math-101',
    testTitle: 'Matematika: Funksiyalar, Tenglamalar va Geometriya',
    subject: 'Matematika',
    studentId: 'usr-student-3',
    studentName: 'Jasur Mahmudov',
    studentGroup: '10-B Guruh',
    score: 2,
    totalQuestions: 4,
    percentage: 50,
    passed: false,
    timeSpentSeconds: 960,
    tabSwitchCount: 2,
    completedAt: '2026-09-29T15:30:00.000Z',
    answers: [
      { questionId: 'q-math-1', selectedOptionId: 'A', isCorrect: false },
      { questionId: 'q-math-2', selectedOptionId: 'B', isCorrect: true },
      { questionId: 'q-math-3', selectedOptionId: 'C', isCorrect: false },
      { questionId: 'q-math-4', selectedOptionId: 'B', isCorrect: true },
    ],
  },
];

const DEFAULT_TELEGRAM_CONFIG: TelegramConfig = {
  botToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
  chatId: import.meta.env.VITE_TELEGRAM_CHAT_ID || '',
  enabled: Boolean(import.meta.env.VITE_TELEGRAM_BOT_TOKEN && import.meta.env.VITE_TELEGRAM_CHAT_ID),
  sendOnTestComplete: true,
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tests, setTests] = useState<Test[]>(() => {
    const saved = localStorage.getItem('testhub_tests');
    return saved ? JSON.parse(saved) : DEFAULT_TESTS;
  });

  const [results, setResults] = useState<TestResult[]>(() => {
    const saved = localStorage.getItem('testhub_results');
    return saved ? JSON.parse(saved) : DEFAULT_RESULTS;
  });

  const [groups, setGroups] = useState<StudentGroup[]>(() => {
    const saved = localStorage.getItem('testhub_groups');
    return saved ? JSON.parse(saved) : DEFAULT_GROUPS;
  });

  const [students, setStudents] = useState<User[]>(() => {
    const saved = localStorage.getItem('testhub_students');
    return saved ? JSON.parse(saved) : DEFAULT_STUDENTS;
  });

  const [questionsBank, setQuestionsBank] = useState<Question[]>(() => {
    const saved = localStorage.getItem('testhub_questions');
    return saved ? JSON.parse(saved) : DEFAULT_QUESTIONS_BANK;
  });

  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => {
    const saved = localStorage.getItem('testhub_telegram');
    return saved ? JSON.parse(saved) : DEFAULT_TELEGRAM_CONFIG;
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('testhub_tests', JSON.stringify(tests));
  }, [tests]);

  useEffect(() => {
    localStorage.setItem('testhub_results', JSON.stringify(results));
  }, [results]);

  useEffect(() => {
    localStorage.setItem('testhub_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('testhub_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('testhub_questions', JSON.stringify(questionsBank));
  }, [questionsBank]);

  useEffect(() => {
    localStorage.setItem('testhub_telegram', JSON.stringify(telegramConfig));
  }, [telegramConfig]);

  const addTest = (newTest: Omit<Test, 'id' | 'createdAt'>): Test => {
    const test: Test = {
      ...newTest,
      id: `test-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTests(prev => [test, ...prev]);
    return test;
  };

  const updateTest = (id: string, updatedFields: Partial<Test>) => {
    setTests(prev => prev.map(t => (t.id === id ? { ...t, ...updatedFields } : t)));
  };

  const deleteTest = (id: string) => {
    setTests(prev => prev.filter(t => t.id !== id));
  };

  const addQuestion = (newQuestion: Omit<Question, 'id'>): Question => {
    const q: Question = {
      ...newQuestion,
      id: `q-${Date.now()}`,
    };
    setQuestionsBank(prev => [q, ...prev]);
    return q;
  };

  const addQuestionsBatch = (batch: Omit<Question, 'id'>[]) => {
    const questionsWithIds: Question[] = batch.map((q, idx) => ({
      ...q,
      id: `q-${Date.now()}-${idx}`,
    }));
    setQuestionsBank(prev => [...questionsWithIds, ...prev]);
  };

  const deleteQuestion = (id: string) => {
    setQuestionsBank(prev => prev.filter(q => q.id !== id));
  };

  const addGroup = (newGroup: Omit<StudentGroup, 'id' | 'createdAt' | 'studentCount'>) => {
    const g: StudentGroup = {
      ...newGroup,
      id: `grp-${Date.now()}`,
      studentCount: 0,
      createdAt: new Date().toISOString(),
    };
    setGroups(prev => [g, ...prev]);
  };

  const deleteGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
  };

  const addStudent = (studentData: Omit<User, 'id' | 'createdAt' | 'role'>) => {
    const newStudent: User = {
      ...studentData,
      id: `usr-${Date.now()}`,
      role: 'student',
      createdAt: new Date().toISOString(),
    };
    setStudents(prev => [newStudent, ...prev]);

    // Update group student count
    if (studentData.groupName) {
      setGroups(prev =>
        prev.map(g =>
          g.name === studentData.groupName ? { ...g, studentCount: g.studentCount + 1 } : g
        )
      );
    }
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const submitResult = async (resultData: Omit<TestResult, 'id' | 'completedAt'>): Promise<TestResult> => {
    const finalResult: TestResult = {
      ...resultData,
      id: `res-${Date.now()}`,
      completedAt: new Date().toISOString(),
    };

    setResults(prev => [finalResult, ...prev]);

    // Try sending notification to Telegram if enabled
    if (telegramConfig.enabled && telegramConfig.sendOnTestComplete) {
      try {
        await sendResultToTelegram(finalResult, telegramConfig);
      } catch (err) {
        console.error('Telegram notification error:', err);
      }
    }

    return finalResult;
  };

  const saveTelegramConfig = (config: TelegramConfig) => {
    setTelegramConfig(config);
  };

  const resetAllData = () => {
    setTests(DEFAULT_TESTS);
    setResults(DEFAULT_RESULTS);
    setGroups(DEFAULT_GROUPS);
    setStudents(DEFAULT_STUDENTS);
    setQuestionsBank(DEFAULT_QUESTIONS_BANK);
    setTelegramConfig(DEFAULT_TELEGRAM_CONFIG);
    localStorage.removeItem('testhub_tests');
    localStorage.removeItem('testhub_results');
    localStorage.removeItem('testhub_groups');
    localStorage.removeItem('testhub_students');
    localStorage.removeItem('testhub_questions');
    localStorage.removeItem('testhub_telegram');
  };

  return (
    <DataContext.Provider
      value={{
        tests,
        results,
        groups,
        students,
        questionsBank,
        telegramConfig,
        isOnline,
        addTest,
        updateTest,
        deleteTest,
        addQuestion,
        addQuestionsBatch,
        deleteQuestion,
        addGroup,
        deleteGroup,
        addStudent,
        deleteStudent,
        submitResult,
        saveTelegramConfig,
        resetAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
