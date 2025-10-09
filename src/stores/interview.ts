import type { InterviewSession, Question, QuestionForm, UserAnswer } from '@/types/interview'
import { message } from 'ant-design-vue'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
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

  const errorMessage = ref<string>('')

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

  const interviewSettings = ref({
    showProgress: true,
    showQuestionMeta: true,
    enableEvaluation: false,
    enableAnswerInput: true,
  })

  // Геттеры
  const currentQuestion = computed(() => {
    return questions.value[currentQuestionIndex.value]
  })

  const isLastQuestion = computed(() => {
    return currentQuestionIndex.value === questions.value.length - 1
  })

  const progress = computed(() =>
    questions.value.length > 0
      ? Math.round((currentQuestionIndex.value / questions.value.length) * 100)
      : 0,
  )

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

  const loadUserQuestions = async () => {
    isLoading.value = true
    try {
      const userQuestions = await QuestionService.getQuestions()
      const transformedQuestions = userQuestions.map(question => ({
        ...question,
        tags: question.tags || [],
      })) as Question[]

      questions.value = transformedQuestions
    }
    catch (error) {
      console.error('Error loading questions:', error)
      errorMessage.value = 'Не удалось загрузить вопросы'
    }
    finally {
      isLoading.value = false
    }
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

    if (currentSession.value) {
      currentSession.value.completedAt = new Date()
    }

    message.success('Собеседование завершено!')
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

  const startInterview = async (settings?: any) => {
    if (questions.value.length === 0) {
      message.error('Добавьте вопросы для начала собеседования')
      return
    }

    isInterviewStarted.value = true
    currentQuestionIndex.value = 0

    // Обновляем настройки если переданы
    if (settings) {
      interviewSettings.value = { ...interviewSettings.value, ...settings }
    }

    // Создаем сессию
    currentSession.value = {
      questions: [...questions.value],
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

    // Getters
    currentQuestion,
    isLastQuestion,
    progress,

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
  }
})
