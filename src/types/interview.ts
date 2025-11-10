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
  status?: QuestionStatus
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
  specialty: string
  difficulty: string
  questionsCount: number
  technology: string
  skill: string
}

export interface AIQuestion extends Question {
  generatedBy: 'ai'
  context?: string // дополнительный контекст для вопроса
}

export interface AIAnswer {
  content: string
  type: 'serious' | 'joke'
}

export type QuestionStatus = 'known' | 'repeat' | 'hard'

export interface UserAnswer {
  questionId: string
  questionText: string
  userAnswer: string
  evaluation?: AnswerEvaluation
  answeredAt: Date
}

export interface AnswerEvaluation {
  score: number
  feedback: string
  suggestions: string[]
  evaluatedAt: Date
}

export interface InterviewSettings {
  showProgress: boolean
  enableAnswerInput?: boolean
  filterByStatus?: QuestionStatus | ''
}

export interface QuestionFilters {
  statuses: QuestionStatus[]
  difficulties: string[]
  categories: string[]
  tags: string[]
}
