export interface QuestionForm {
  text: string;
  type: 'text' | 'code';
  category: string;
  difficulty: 'junior' | 'middle' | 'senior';
  tags: string[];
}

export interface Question extends QuestionForm {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
}

export interface InterviewSession {
  id?: string;
  userId?: string;
  questions: Question[];
  answers: InterviewAnswer[];
  score?: number;
  totalTime: number;
  completedAt?: Date;
  createdAt?: Date;
}

export interface InterviewAnswer {
  questionId: string;
  questionText: string;
  userAnswer: string;
  evaluation?: AnswerEvaluation;
  timeSpent: number; // в секундах
}

export interface AnswerEvaluation {
  score: number; // 0-10
  feedback: string;
  suggestions: string[];
}

export interface InterviewSettings {
  timePerQuestion: number; // в секундах
  showTimer: boolean;
  autoEvaluate: boolean;
}