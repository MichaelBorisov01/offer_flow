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

export interface AISettings {
  field: string;
  difficulty: 'junior' | 'middle' | 'senior';
  questionsCount: number;
  technology?: string; // конкретная технология (Vue, React, etc)
}

export interface AIQuestion extends Question {
  generatedBy: 'ai';
  context?: string; // дополнительный контекст для вопроса
}