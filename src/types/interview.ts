export interface QuestionForm {
  text: string
  type: 'text' | 'code'
  category: string
  difficulty: 'junior' | 'middle' | 'senior'
  tags: string[]
}

export interface Question extends QuestionForm {
  id?: string
  createdAt?: Date
  updatedAt?: Date
  userId?: string
  aiAnswer?: AIAnswer
}

export interface InterviewSession {
  id?: string
  userId?: string
  questions: Question[]
  score?: number
  totalTime: number
  userAnswers: UserAnswer[]
  completedAt?: Date
  createdAt?: Date
}

export interface AISettings {
  field: string
  difficulty: 'junior' | 'middle' | 'senior'
  questionsCount: number
  technology?: string // конкретная технология (Vue, React, etc)
}

export interface AIQuestion extends Question {
  generatedBy: 'ai'
  context?: string // дополнительный контекст для вопроса
}

export interface AIAnswer {
  content: string
  type: 'serious' | 'joke'
  generatedAt: Date
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
