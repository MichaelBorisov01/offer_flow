import type { InterviewSession, InterviewSettings, Question, QuestionFilters, QuestionForm, UserAnswer } from '@/types/interview'
import { message } from 'ant-design-vue'
import { defineStore } from 'pinia'
import { computed, onUnmounted, ref } from 'vue'
import { useInterviewMode } from '@/composables/useInterviewMode'
import { AIService } from '@/services/aiService'
import { QuestionService } from '@/services/questionService'

export const useInterviewStore = defineStore('interview', () => {
  // Состояние
  const questions = ref<Question[]>([])
  const currentQuestionIndex = ref(0)
  const isInterviewStarted = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const editingQuestionId = ref<string | null>(null)

  const currentSession = ref<InterviewSession | null>(null)
  const userAnswers = ref<UserAnswer[]>([])
  const isEvaluating = ref(false)
  const currentUserAnswer = ref('')
  const sessionQuestions = ref<Question[]>([])
  const isSessionActive = ref(false)

  const errorMessage = ref<string>('')

  const questionFilters = ref<QuestionFilters>({
    statuses: [],
    difficulties: [],
    categories: [],
    tags: [],
  })

  const submitAnswer = async (questionId: string, questionText: string, answer: string) => {
    if (!answer.trim()) {
      message.error('Введите ответ перед отправкой')
      return
    }

    isEvaluating.value = true

    try {
    // Создаем объект ответа
      const userAnswer: UserAnswer = {
        questionId,
        questionText,
        userAnswer: answer,
        answeredAt: new Date(),
      }

      // Оцениваем ответ через ИИ
      const evaluation = await AIService.evaluateAnswer(questionText, answer)
      userAnswer.evaluation = {
        ...evaluation,
        evaluatedAt: new Date(),
      }

      // Добавляем ответ в массив
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

  const getUserAnswer = (questionId: string): UserAnswer | undefined => {
    return userAnswers.value.find(a => a.questionId === questionId)
  }

  const clearUserAnswers = () => {
    userAnswers.value = []
  }

  const interviewSettings = ref<InterviewSettings>({
    showProgress: true,
    enableAnswerInput: false,
    filterByStatus: '',
  })

  // Геттеры
  const currentQuestion = computed(() => {
    if (isSessionActive.value && sessionQuestions.value.length > 0) {
      return sessionQuestions.value[currentQuestionIndex.value]
    }
    return questions.value[currentQuestionIndex.value]
  })

  const isLastQuestion = computed(() => {
    if (isSessionActive.value && sessionQuestions.value.length > 0) {
      return currentQuestionIndex.value === sessionQuestions.value.length - 1
    }
    return currentQuestionIndex.value === questions.value.length - 1
  })

  const progress = computed(() => {
    let totalQuestions: number
    let currentIndex: number

    if (isSessionActive.value && sessionQuestions.value.length > 0) {
      totalQuestions = sessionQuestions.value.length
      currentIndex = currentQuestionIndex.value
    }
    else {
      totalQuestions = questions.value.length
      currentIndex = currentQuestionIndex.value
    }

    return totalQuestions > 0
      ? Math.round((currentIndex / totalQuestions) * 100)
      : 0
  })

  const sessionQuestionsList = computed(() => {
    return isSessionActive.value ? sessionQuestions.value : questions.value
  })

  const isEditing = computed(() => editingQuestionId.value !== null)

  // Действия
  const startEditing = (questionId: string) => {
    editingQuestionId.value = questionId
  }

  const cancelEditing = () => {
    editingQuestionId.value = null
  }

  const updateQuestion = async (questionId: string, updates: Partial<Question>) => {
    try {
      await QuestionService.updateQuestion(questionId, updates)

      questions.value = questions.value.map(q =>
        q.id === questionId
          ? { ...q, ...updates, updatedAt: new Date() }
          : q,
      )

      editingQuestionId.value = null
    }
    catch (error) {
      console.error('Error updating question:', error)
      throw error
    }
  }

  function shuffleQuestions() {
    const shuffled: Question[] = [...questions.value]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
    }
    questions.value = shuffled
    currentQuestionIndex.value = 0
  }

  const addQuestion = async (questionData: QuestionForm) => {
    try {
      const newQuestion: Omit<Question, 'id'> = {
        text: questionData.text,
        type: questionData.type,
        category: questionData.category,
        difficulty: questionData.difficulty,
        tags: questionData.tags,
        createdAt: new Date(),
      }

      const questionId = await QuestionService.addQuestion(newQuestion)
      questions.value.unshift({
        id: questionId,
        ...newQuestion,
      })
    }
    catch (error) {
      console.error('Error adding question:', error)
      throw error
    }
  }

  const removeQuestion = async (index: number) => {
    const question = questions.value[index]
    if (question?.id) {
      try {
        await QuestionService.deleteQuestion(question.id)
        questions.value.splice(index, 1)
      }
      catch (error) {
        console.error('Error deleting question:', error)
        throw error
      }
    }
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

  const handleBeforeUnload = () => {
    if (isSessionActive.value) {
    // Можно показать предупреждение или просто завершить сессию
      finishInterview()
    }
  }

  const handlePopState = () => {
    if (isSessionActive.value) {
      finishInterview()
      message.info('Сессия завершена из-за навигации')
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
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
    questions.value = []
    currentQuestionIndex.value = 0
    isInterviewStarted.value = false
    error.value = null
  }

  const resetQuestionFilters = () => {
    questionFilters.value = {
      statuses: [],
      difficulties: [],
      categories: [],
      tags: [],
    }
  }

  // Метод для получения доступных значений фильтров на основе текущих вопросов
  const getAvailableFilterValues = () => {
    const difficulties = new Set<string>()
    const categories = new Set<string>()
    const tags = new Set<string>()
    const statuses = new Set<string>()

    questions.value.forEach((question) => {
      difficulties.add(question.difficulty)
      categories.add(question.category)
      question.tags?.forEach(tag => tags.add(tag))
      if (question.status) {
        statuses.add(question.status)
      }
    })

    return {
      difficulties: Array.from(difficulties),
      categories: Array.from(categories),
      tags: Array.from(tags),
      statuses: Array.from(statuses),
    }
  }

  const checkAndResetFiltersIfNeeded = () => {
    if (questionFilters.value.statuses.length === 0
      && questionFilters.value.difficulties.length === 0
      && questionFilters.value.categories.length === 0
      && questionFilters.value.tags.length === 0) {
      return
    }

    const availableFilters = getAvailableFilterValues()
    const newFilters = { ...questionFilters.value }

    // Удаляем значения фильтров, которых больше нет в доступных вопросах
    newFilters.statuses = newFilters.statuses.filter(status =>
      availableFilters.statuses.includes(status),
    )
    newFilters.difficulties = newFilters.difficulties.filter(difficulty =>
      availableFilters.difficulties.includes(difficulty),
    )
    newFilters.categories = newFilters.categories.filter(category =>
      availableFilters.categories.includes(category),
    )
    newFilters.tags = newFilters.tags.filter(tag =>
      availableFilters.tags.includes(tag),
    )

    // Проверяем, остались ли вопросы после обновления фильтров
    const filteredWithUpdated = applyQuestionFilters(questions.value, newFilters)

    if (filteredWithUpdated.length === 0) {
    // Полностью сбрасываем фильтры
      resetQuestionFilters()
      message.info('Фильтры сброшены, так как нет соответствующих вопросов')
    }
    else if (
      newFilters.statuses.length !== questionFilters.value.statuses.length
      || newFilters.difficulties.length !== questionFilters.value.difficulties.length
      || newFilters.categories.length !== questionFilters.value.categories.length
      || newFilters.tags.length !== questionFilters.value.tags.length
    ) {
    // Частично обновляем фильтры (удаляем несуществующие значения)
      questionFilters.value = newFilters
      message.info('Фильтры обновлены: удалены неактуальные значения')
    }
  }

  const loadUserQuestions = async () => {
    isLoading.value = true
    try {
      const userQuestions = await QuestionService.getQuestions()
      const transformedQuestions = userQuestions.map(question => ({
        ...question,
        tags: question.tags || [],
      })) as Question[]

      questions.value = transformedQuestions

      // Проверяем актуальность фильтров после загрузки
      if (!isSessionActive.value) {
        checkAndResetFiltersIfNeeded()
      }
    }
    catch (error) {
      console.error('Error loading questions:', error)
      errorMessage.value = 'Не удалось загрузить вопросы'
    }
    finally {
      isLoading.value = false
    }
  }

  // Метод для применения фильтров
  function applyQuestionFilters(questions: Question[], filters: QuestionFilters): Question[] {
    let filtered = [...questions]

    // Фильтрация по статусам
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(q =>
        q.status && filters.statuses.includes(q.status),
      )
    }

    // Фильтрация по сложности
    if (filters.difficulties.length > 0) {
      filtered = filtered.filter(q => filters.difficulties.includes(q.difficulty))
    }

    // Фильтрация по категориям
    if (filters.categories.length > 0) {
      filtered = filtered.filter(q => filters.categories.includes(q.category))
    }

    // Фильтрация по тегам
    if (filters.tags.length > 0) {
      filtered = filtered.filter(q =>
        q.tags?.some(tag => filters.tags.includes(tag)),
      )
    }

    return filtered
  }

  function getFilteredQuestions() {
  // Для InterviewSession используем фильтры из questionFilters
    if (questionFilters.value.statuses.length > 0
      || questionFilters.value.difficulties.length > 0
      || questionFilters.value.categories.length > 0
      || questionFilters.value.tags.length > 0) {
      return applyQuestionFilters(questions.value, questionFilters.value)
    }

    const filter = interviewSettings.value.filterByStatus
    if (!filter || filter.length === 0) {
      return questions.value
    }
    return questions.value.filter(question =>
      question.status && filter.includes(question.status),
    )
  }

  // Метод для установки фильтров
  const setQuestionFilters = (filters: QuestionFilters) => {
    questionFilters.value = filters
  }

  // Метод для получения текущих фильтров
  const getCurrentFilters = () => {
    return { ...questionFilters.value }
  }

  const filteredQuestions = computed(() => getFilteredQuestions())

  const startInterview = async (settings?: InterviewSettings) => {
    const { mode } = useInterviewMode()

    let questionsToUse: Question[]
    if (mode.value === 'ai') {
    // AI режим - все вопросы без фильтрации
      if (questions.value.length === 0) {
        message.error('Нет вопросов для начала собеседования')
        return
      }
      questionsToUse = [...questions.value]
    }
    else {
    // Manual режим - используем отфильтрованные вопросы
      const filtered = getFilteredQuestions()
      if (filtered.length === 0) {
        message.error('Нет вопросов для выбранных фильтров')
        return
      }
      questionsToUse = filtered
    }

    // Фиксируем вопросы для сессии
    sessionQuestions.value = [...questionsToUse]
    isSessionActive.value = true

    // Общая логика для обоих режимов
    isInterviewStarted.value = true
    currentQuestionIndex.value = 0

    // Обновляем настройки если переданы
    if (settings) {
      interviewSettings.value = { ...interviewSettings.value, ...settings }
    }

    // Создаем сессию
    currentSession.value = {
      questions: questionsToUse,
      userAnswers: [],
      createdAt: new Date(),
    }

    // Очищаем предыдущие ответы
    clearUserAnswers()
  }

  const isGeneratingAnswer = ref(false)

  const generateAnswerForQuestion = async (questionId: string, userAnswer?: string) => {
    const question = questions.value.find(q => q.id === questionId)
    if (!question)
      return

    isGeneratingAnswer.value = true

    try {
      const aiAnswer = await AIService.generateAnswer(question.text, userAnswer)

      question.aiAnswer = aiAnswer

      return aiAnswer
    }
    catch (error) {
      console.error('Error generating AI answer:', error)
      throw error
    }
    finally {
      isGeneratingAnswer.value = false
    }
  }

  // Метод для обновления статуса вопроса
  const updateQuestionStatus = async (questionId: string, status: 'known' | 'repeat' | 'hard') => {
    const question = questions.value.find(q => q.id === questionId)
    if (question) {
      try {
      // Сохраняем статус в базе данных
        await QuestionService.updateQuestion(questionId, { status })

        // Обновляем локальное состояние
        question.status = status
        question.updatedAt = new Date()

        // Если сессия активна, обновляем вопрос в sessionQuestions
        if (isSessionActive.value) {
          const sessionQuestionIndex = sessionQuestions.value.findIndex(q => q.id === questionId)
          if (sessionQuestionIndex !== -1) {
          // Используем Vue.set или прямую мутацию с проверкой
            const sessionQuestion = sessionQuestions.value[sessionQuestionIndex]
            if (sessionQuestion) {
              sessionQuestions.value[sessionQuestionIndex] = {
                ...sessionQuestion,
                status,
                updatedAt: new Date(),
              }
            }
          }
        }
      }
      catch (error) {
        console.error('Error saving question status:', error)
        message.error('Ошибка при сохранении статуса')
      }
    }
    else {
      console.error('Question not found:', questionId)
    }
  }

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  })

  // Загружаем вопросы при инициализации
  loadUserQuestions()

  return {
    // State
    questions,
    currentQuestionIndex,
    isInterviewStarted,
    isLoading,
    error,
    editingQuestionId,
    isEditing,
    interviewSettings,
    currentSession,
    isGeneratingAnswer,
    userAnswers,
    isEvaluating,
    currentUserAnswer,
    filteredQuestions,
    questionFilters,
    sessionQuestionsList,

    // Getters
    currentQuestion,
    isLastQuestion,
    progress,
    isSessionActive,

    // Actions
    addQuestion,
    removeQuestion,
    nextQuestion,
    previousQuestion,
    finishInterview,
    resetInterview,
    loadUserQuestions,
    startEditing,
    cancelEditing,
    updateQuestion,
    startInterview,
    generateAnswerForQuestion,
    submitAnswer,
    getUserAnswer,
    clearUserAnswers,
    shuffleQuestions,
    updateQuestionStatus,
    setQuestionFilters,
    getCurrentFilters,
    resetQuestionFilters,
    applyQuestionFilters,
    forceFinishInterview,
    checkAndResetFiltersIfNeeded,
  }
})
