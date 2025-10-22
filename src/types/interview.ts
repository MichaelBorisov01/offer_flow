export interface QuestionForm {
  text: string
  type: 'text' | 'code' | 'ai'
  category: string
  difficulty: string
  tags: string[]
}

export interface Question extends QuestionForm {
  id?: string
  createdAt?: Date
  updatedAt?: Date
  userId?: string
  aiAnswer?: AIAnswer
  status?: 'known' | 'repeat' | 'hard'
  tempId?: string
}

export interface InterviewSession {
  id?: string
  userId?: string
  questions: Question[]
  score?: number
  totalTime?: number
  userAnswers: UserAnswer[]
  completedAt?: Date
  createdAt?: Date
}

export interface AISettings {
  field: string
  difficulty: string
  questionsCount: number
  technology: string
}

export interface AIQuestion extends Question {
  generatedBy: 'ai'
  context?: string // дополнительный контекст для вопроса
}

export interface AIAnswer {
  content: string
  type: 'serious' | 'joke'
}

export interface UserAnswer {
  questionId: string
  questionText: string
  userAnswer: string
  evaluation?: AnswerEvaluation
  answeredAt: Date
}

export interface AnswerEvaluation {
  score: number // 1-10
  feedback: string
  suggestions: string[]
  evaluatedAt: Date
}

export interface InterviewSettings {
  showProgress: boolean
  enableAnswerInput?: boolean
  filterByStatus?: 'known' | 'repeat' | 'hard' | ''
}

export interface QuestionFilters {
  statuses: string[]
  difficulties: string[]
  categories: string[]
  tags: string[]
}
