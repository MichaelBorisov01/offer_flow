import type { Question, QuestionForm, QuestionStatus } from '@/types/interview'
import { computed, ref } from 'vue'
import { QuestionService } from '@/services/questionService'

export function useInterviewQuestions() {
  const questions = ref<Question[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const editingQuestionId = ref<string | null>(null)

  const isEditing = computed(() => editingQuestionId.value !== null)

  const loadUserQuestions = async () => {
    isLoading.value = true
    try {
      const userQuestions = await QuestionService.getQuestions()
      const transformedQuestions = userQuestions.map(question => ({
        ...question,
        tags: question.tags || [],
        userAnswer: question.userAnswer || '',
        aiAnswer: question.aiAnswer || undefined,
      })) as Question[]

      questions.value = transformedQuestions
    }
    catch (error) {
      console.error('Error loading questions:', error)
    }
    finally {
      isLoading.value = false
    }
  }

  const addQuestion = async (questionData: QuestionForm) => {
    try {
      const newQuestion: Omit<Question, 'id'> = {
        text: questionData.text,
        category: questionData.category,
        difficulty: questionData.difficulty,
        tags: questionData.tags,
        userAnswer: '',
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

  const removeQuestionById = async (questionId: string) => {
    try {
      await QuestionService.deleteQuestion(questionId)
      questions.value = questions.value.filter(q => q.id !== questionId)
    }
    catch (error) {
      console.error('Error deleting question:', error)
      throw error
    }
  }

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

  const updateQuestionStatus = async (questionId: string, status: QuestionStatus) => {
    const question = questions.value.find(q => q.id === questionId)
    if (question) {
      try {
        await QuestionService.updateQuestion(questionId, { status })
        question.status = status
        question.updatedAt = new Date()
      }
      catch (error) {
        console.error('Error saving question status:', error)
        throw error
      }
    }
  }

  // Метод для обновления пользовательского ответа
  const updateUserAnswer = async (questionId: string, userAnswer: string) => {
    const question = questions.value.find(q => q.id === questionId)
    if (question) {
      try {
        await QuestionService.updateQuestion(questionId, { userAnswer })
        question.userAnswer = userAnswer
        question.updatedAt = new Date()
      }
      catch (error) {
        console.error('Error saving user answer:', error)
        throw error
      }
    }
  }

  const shuffleQuestions = () => {
    const shuffled: Question[] = [...questions.value]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
    }
    questions.value = shuffled
  }

  return {
    // State
    questions,
    isLoading,
    error,
    editingQuestionId,

    // Getters
    isEditing,

    // Actions
    loadUserQuestions,
    addQuestion,
    removeQuestion,
    removeQuestionById,
    startEditing,
    cancelEditing,
    updateQuestion,
    updateQuestionStatus,
    updateUserAnswer,
    shuffleQuestions,
  }
}
