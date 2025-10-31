import type { InterviewSession, Question, UserAnswer } from '@/types/interview'
import { message } from 'ant-design-vue'
import { computed, ref } from 'vue'
import { AIService } from '@/services/aiService'

export function useInterviewSession() {
  // Состояние сессии
  const currentSession = ref<InterviewSession | null>(null)
  const userAnswers = ref<UserAnswer[]>([])
  const isEvaluating = ref(false)
  const currentUserAnswer = ref('')
  const sessionQuestions = ref<Question[]>([])
  const isSessionActive = ref(false)
  const isInterviewStarted = ref(false)
  const currentQuestionIndex = ref(0)

  const submitAnswer = async (questionId: string, questionText: string, answer: string) => {
    if (!answer.trim()) {
      message.error('Введите ответ перед отправкой')
      return
    }

    isEvaluating.value = true

    try {
      const userAnswer: UserAnswer = {
        questionId,
        questionText,
        userAnswer: answer,
        answeredAt: new Date(),
      }

      const evaluation = await AIService.evaluateAnswer(questionText, answer)
      userAnswer.evaluation = {
        ...evaluation,
        evaluatedAt: new Date(),
      }

      const existingIndex = userAnswers.value.findIndex(a => a.questionId === questionId)
      if (existingIndex !== -1) {
        userAnswers.value[existingIndex] = userAnswer
      }
      else {
        userAnswers.value.push(userAnswer)
      }

      message.success('Ответ оценен!')
      return userAnswer
    }
    catch (error) {
      console.error('Error evaluating answer:', error)
      message.error('Ошибка при оценке ответа')
      throw error
    }
    finally {
      isEvaluating.value = false
    }
  }

  // Геттеры
  const currentQuestion = computed(() => {
    if (isSessionActive.value && sessionQuestions.value.length > 0) {
      return sessionQuestions.value[currentQuestionIndex.value]
    }
    return null
  })

  const isLastQuestion = computed(() => {
    if (isSessionActive.value && sessionQuestions.value.length > 0) {
      return currentQuestionIndex.value === sessionQuestions.value.length - 1
    }
    return true
  })

  const progress = computed(() => {
    if (isSessionActive.value && sessionQuestions.value.length > 0) {
      return Math.round((currentQuestionIndex.value / sessionQuestions.value.length) * 100)
    }
    return 0
  })

  const getUserAnswer = (questionId: string): UserAnswer | undefined => {
    return userAnswers.value.find(a => a.questionId === questionId)
  }

  const clearUserAnswers = () => {
    userAnswers.value = []
  }

  const finishInterview = () => {
    isInterviewStarted.value = false
    isSessionActive.value = false
    sessionQuestions.value = []
    currentQuestionIndex.value = 0

    if (currentSession.value) {
      currentSession.value.completedAt = new Date()
    }

    message.success('Собеседование завершено!')
  }

  const forceFinishInterview = () => {
    isInterviewStarted.value = false
    isSessionActive.value = false
    sessionQuestions.value = []
    currentQuestionIndex.value = 0

    if (currentSession.value) {
      currentSession.value.completedAt = new Date()
    }
  }

  const nextQuestion = () => {
    if (isLastQuestion.value) {
      finishInterview()
    }
    else {
      currentQuestionIndex.value++
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex.value > 0) {
      currentQuestionIndex.value--
    }
  }

  const resetInterview = () => {
    sessionQuestions.value = []
    currentQuestionIndex.value = 0
    isInterviewStarted.value = false
    isSessionActive.value = false
    userAnswers.value = []
    currentSession.value = null
  }

  return {
    // State
    currentSession,
    userAnswers,
    isEvaluating,
    currentUserAnswer,
    sessionQuestions,
    isSessionActive,
    isInterviewStarted,
    currentQuestionIndex,

    // Getters
    currentQuestion,
    isLastQuestion,
    progress,

    // Actions
    submitAnswer,
    getUserAnswer,
    clearUserAnswers,
    finishInterview,
    forceFinishInterview,
    nextQuestion,
    previousQuestion,
    resetInterview,
  }
}
