export interface QARecord {
  question: string
  userAnswer: string
  score: number
  feedback: string
}

export interface InterviewSession {
  id?: string
  userId: string
  specialty: string
  difficulty: string
  date: string // ISO строка (например, 2026-05-14T12:00:00.000Z)
  averageScore: number
  qaList: QARecord[]
}
