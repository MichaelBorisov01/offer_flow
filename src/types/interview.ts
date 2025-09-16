export interface Question {
  id?: string;
  text: string;
  type: 'text' | 'code';
  category: string;
  difficulty: 'junior' | 'middle' | 'senior';
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
}

export interface QuestionForm {
  text: string;
  type: 'text' | 'code';
  category: string;
  difficulty: 'junior' | 'middle' | 'senior';
  tags: string[];
}