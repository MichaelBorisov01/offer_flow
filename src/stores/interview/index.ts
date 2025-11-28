import type { AIAnswer, InterviewSettings, Question } from '@/types/interview'
import { message } from 'ant-design-vue'
import { defineStore } from 'pinia'
import { computed, onUnmounted, ref } from 'vue'
import { useInterviewMode } from '@/composables/useInterviewMode'
import { useInterviewAI } from './ai'
import { useInterviewCategories } from './categories'
import { useInterviewFilters } from './filters'
import { useInterviewQuestions } from './questions'
import { useInterviewSession } from './session'

export const useInterviewStore = defineStore('interview', () => {
  const { mode } = useInterviewMode()

  const questionsModule = useInterviewQuestions()
  const sessionModule = useInterviewSession()
  const filtersModule = useInterviewFilters(() => questionsModule.questions.value)
  const aiModule = useInterviewAI(() => questionsModule.questions.value)
  const categoriesModule = useInterviewCategories()

  const interviewSettings = ref<InterviewSettings>({
    showProgress: true,
    enableAnswerInput: false,
    filterByStatus: '',
  })

  const filteredQuestions = computed(() => {
    return filtersModule.getFilteredQuestions(questionsModule.questions.value)
  })

  const sessionQuestionsList = computed(() => {
    return sessionModule.isSessionActive.value
      ? sessionModule.sessionQuestions.value
      : filteredQuestions.value
  })

  const getCategoryName = (categoryId: string): string => {
    return categoriesModule.getCategoryName(categoryId)
  }

  const refreshCategories = async () => {
    await categoriesModule.loadCategories()
  }

  const updateQuestionAIAnswer = (questionId: string, aiAnswer: AIAnswer) => {
  // Обновляем в основном списке
    const question = questionsModule.questions.value.find(q => q.id === questionId)
    if (question) {
      question.aiAnswer = aiAnswer
      question.updatedAt = new Date()
    }

    // Обновляем в сессии если активна
    if (sessionModule.isSessionActive.value) {
      const sessionQuestion = sessionModule.sessionQuestions.value.find(q => q.id === questionId)
      if (sessionQuestion) {
        sessionQuestion.aiAnswer = aiAnswer
        sessionQuestion.updatedAt = new Date()
      }
    }

    // Принудительно обновляем реактивность
    questionsModule.questions.value = [...questionsModule.questions.value]
    sessionModule.sessionQuestions.value = [...sessionModule.sessionQuestions.value]
  }

  const generateAnswerForQuestion = async (questionId: string, userAnswer?: string): Promise<AIAnswer | null> => {
    try {
      const aiAnswer = await aiModule.generateAnswerForQuestion(questionId, userAnswer)

      if (aiAnswer) {
        updateQuestionAIAnswer(questionId, aiAnswer)
        return aiAnswer
      }

      return null
    }
    catch (error) {
      console.error('❌ [InterviewStore] Error in generateAnswerForQuestion:', error)
      throw error
    }
  }

  const startInterview = async (settings?: InterviewSettings) => {
    let questionsToUse: Question[]

    if (mode.value === 'ai') {
      if (questionsModule.questions.value.length === 0) {
        message.error('Нет вопросов для начала собеседования')
        return
      }
      questionsToUse = [...questionsModule.questions.value]
    }
    else {
      const filtered = filteredQuestions.value
      if (filtered.length === 0) {
        message.error('Нет вопросов для выбранных фильтров')
        return
      }
      questionsToUse = filtered
    }

    sessionModule.sessionQuestions.value = [...questionsToUse]
    sessionModule.isSessionActive.value = true
    sessionModule.isInterviewStarted.value = true
    sessionModule.currentQuestionIndex.value = 0

    if (settings) {
      interviewSettings.value = { ...interviewSettings.value, ...settings }
    }

    sessionModule.currentSession.value = {
      questions: questionsToUse,
      userAnswers: [],
      createdAt: new Date(),
    }

    sessionModule.clearUserAnswers()
  }

  const handleBeforeUnload = () => {
    if (sessionModule.isSessionActive.value) {
      sessionModule.finishInterview()
    }
  }

  const handlePopState = () => {
    if (sessionModule.isSessionActive.value) {
      sessionModule.finishInterview()
      message.info('Сессия завершена из-за навигации')
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
  }

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  })

  questionsModule.loadUserQuestions()
  categoriesModule.loadCategories()

  return {
    ...questionsModule,
    ...sessionModule,
    ...filtersModule,
    ...aiModule,
    ...categoriesModule,

    interviewSettings,

    filteredQuestions,
    sessionQuestionsList,

    startInterview,
    generateAnswerForQuestion,
    getCategoryName,
    refreshCategories,
  }
})
