export type InterviewMode = 'manual' | 'ai';

export interface Question {
  id: number;
  text: string;
  type: 'text' | 'code';
  source: 'user' | 'ai';
}

export interface AISettings {
  field: string;
  difficulty: string;
  questionsCount: number;
}

export interface InterviewResults {
  answers: Record<number, string>;
  completedAt: Date;
}