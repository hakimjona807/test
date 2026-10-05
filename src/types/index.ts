export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  groupName?: string;
  avatar?: string;
  phone?: string;
  createdAt: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation?: string;
  subject?: string;
  difficulty?: 'oson' | 'orta' | 'qiyin';
  points?: number;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  subject: string;
  category: string;
  durationMinutes: number; // e.g. 20 minutes
  passingScore: number; // percentage, e.g. 70%
  questions: Question[];
  targetGroups: string[]; // group IDs or names
  isActive: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResultsImmediately?: boolean;
  maxAttempts?: number;
  createdAt: string;
  createdByTeacherName?: string;
  deadline?: string;
}

export interface StudentAnswer {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect?: boolean;
  timeSpentSeconds?: number;
}

export interface TestResult {
  id: string;
  testId: string;
  testTitle: string;
  subject: string;
  studentId: string;
  studentName: string;
  studentGroup: string;
  score: number; // e.g. 17
  totalQuestions: number; // e.g. 20
  percentage: number; // e.g. 85
  passed: boolean;
  timeSpentSeconds: number; // e.g. 872 seconds (14:32)
  tabSwitchCount: number; // Anti-cheat count
  completedAt: string;
  answers: StudentAnswer[];
  questionsSnapshot?: Question[];
}

export interface StudentGroup {
  id: string;
  name: string;
  description: string;
  studentCount: number;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  sendOnTestComplete: boolean;
}
