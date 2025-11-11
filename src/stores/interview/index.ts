import type { AIAnswer, InterviewSettings, Question } from '@/types/interview'
import { message } from 'ant-design-vue'
import { defineStore } from 'pinia'
import { computed, onUnmounted, ref } from 'vue'
import { useInterviewMode } from '@/composables/useInterviewMode'
import { useInterviewAI } from './ai'
import { useInterviewFilters } from './filters'
import { useInterviewQuestions } from './questions'
import { useInterviewSession } from './session'

export const useInterviewStore = defineStore('interview', () => {
  const { mode } = useInterviewMode()

  // Инициализируем модули
  const questionsModule = useInterviewQuestions()
  const sessionModule = useInterviewSession()
  const filtersModule = useInterviewFilters(() => questionsModule.questions.value)
  const aiModule = useInterviewAI(() => questionsModule.questions.value)

  // Настройки интервью
  const interviewSettings = ref<InterviewSettings>({
    showProgress: true,
    enableAnswerInput: false,
    filterByStatus: '',
  })

  // Комбинированные геттеры
  const filteredQuestions = computed(() => {
    return filtersModule.getFilteredQuestions(questionsModule.questions.value)
  })

  const sessionQuestionsList = computed(() => {
    return sessionModule.isSessionActive.value
      ? sessionModule.sessionQuestions.value
      : filteredQuestions.value
  })

  // Метод для генерации ответа ИИ с сохранением только в локальное состояние
  const generateAnswerForQuestion = async (questionId: string, userAnswer?: string): Promise<AIAnswer | null> => {
    try {
      const aiAnswer = await aiModule.generateAnswerForQuestion(questionId, userAnswer)

      if (aiAnswer) {
      // Обновляем в основном списке вопросов (локально)
        questionsModule.questions.value = questionsModule.questions.value.map(question =>
          question.id === questionId
            ? { ...question, aiAnswer }
            : question,
        )

        // Если сессия активна, обновляем также в sessionQuestions
        if (sessionModule.isSessionActive.value) {
          sessionModule.sessionQuestions.value = sessionModule.sessionQuestions.value.map(question =>
            question.id === questionId
              ? { ...question, aiAnswer } as Question
              : question,
          )
        }

        return aiAnswer
      }

      return null
    }
    catch (error) {
      console.error('❌ [InterviewStore] Error in generateAnswerForQuestion:', error)
      throw error
    }
  }

  // Метод для начала интервью
  const startInterview = async (settings?: InterviewSettings) => {
    let questionsToUse: Question[]

    if (mode.value === 'ai') {
      // AI режим - все вопросы без фильтрации
      if (questionsModule.questions.value.length === 0) {
        message.error('Нет вопросов для начала собеседования')
        return
      }
      questionsToUse = [...questionsModule.questions.value]
    }
    else {
      // Manual режим - используем отфильтрованные вопросы
      const filtered = filteredQuestions.value
      if (filtered.length === 0) {
        message.error('Нет вопросов для выбранных фильтров')
        return
      }
      questionsToUse = filtered
    }

    // Фиксируем вопросы для сессии
    sessionModule.sessionQuestions.value = [...questionsToUse]
    sessionModule.isSessionActive.value = true
    sessionModule.isInterviewStarted.value = true
    sessionModule.currentQuestionIndex.value = 0

    // Обновляем настройки если переданы
    if (settings) {
      interviewSettings.value = { ...interviewSettings.value, ...settings }
    }

    // Создаем сессию
    sessionModule.currentSession.value = {
      questions: questionsToUse,
      userAnswers: [],
      createdAt: new Date(),
    }

    // Очищаем предыдущие ответы
    sessionModule.clearUserAnswers()
  }

  // Обработчики событий страницы
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

  // Добавляем обработчики событий
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

  // Загружаем вопросы при инициализации
  questionsModule.loadUserQuestions()

  return {
    // State из модулей
    ...questionsModule,
    ...sessionModule,
    ...filtersModule,
    ...aiModule,

    // Локальный state
    interviewSettings,

    // Комбинированные геттеры
    filteredQuestions,
    sessionQuestionsList,

    // Actions
    startInterview,
    generateAnswerForQuestion,
  }
})
