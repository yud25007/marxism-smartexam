export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE'
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: string[];
  correctAnswers: number[]; // Indices of correct options
  points: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  category: string;
  durationMinutes: number;
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: Question[];
  coverImage: string;
}

export interface UserAnswer {
  questionId: string;
  selectedIndices: number[];
}

export interface ExamResult {
  examId: string;
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  answers: Record<string, number[]>; // questionId -> selectedIndices
  completedAt: Date;
}

export type UserRole = 'ADMIN' | 'MEMBER';

export type UserStatus = 'ACTIVE' | 'PENDING';

export interface User {
  username: string;
  role: UserRole;
  status: UserStatus; // New field for approval workflow
  aiEnabled?: boolean; 
  invitedBy?: string;
}