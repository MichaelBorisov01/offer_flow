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
  score?: number;
  totalTime: number;
  completedAt?: Date;
  createdAt?: Date;
}