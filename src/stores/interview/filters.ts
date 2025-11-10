import type { Question, QuestionFilters, QuestionStatus } from '@/types/interview'
import { useStorage } from '@vueuse/core'
import { message } from 'ant-design-vue'

const FILTERS_STORAGE_KEY = 'interview-question-filters'

export function useInterviewFilters(getQuestions: () => Question[]) {
  const questionFilters = useStorage<QuestionFilters>(
    FILTERS_STORAGE_KEY,
    {
      statuses: [],
      difficulties: [],
      categories: [],
      tags: [],
    },
    localStorage,
    { mergeDefaults: true },
  )

  const resetQuestionFilters = () => {
    questionFilters.value = {
      statuses: [],
      difficulties: [],
      categories: [],
      tags: [],
    }
  }

  const setQuestionFilters = (filters: QuestionFilters) => {
    questionFilters.value = filters
  }

  const getCurrentFilters = () => {
    return { ...questionFilters.value }
  }

  // Метод для получения доступных значений фильтров на основе текущих вопросов
  const getAvailableFilterValues = () => {
    const questions = getQuestions()
    const difficulties = new Set<string>()
    const categories = new Set<string>()
    const tags = new Set<string>()
    const statuses = new Set<QuestionStatus>()

    questions.forEach((question) => {
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

  // Метод для применения фильтров
  const applyQuestionFilters = (questions: Question[], filters: QuestionFilters): Question[] => {
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
    const filteredWithUpdated = applyQuestionFilters(getQuestions(), newFilters)

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

  const getFilteredQuestions = (questions: Question[]) => {
    if (questionFilters.value.statuses.length > 0
      || questionFilters.value.difficulties.length > 0
      || questionFilters.value.categories.length > 0
      || questionFilters.value.tags.length > 0) {
      return applyQuestionFilters(questions, questionFilters.value)
    }

    return questions
  }

  return {
    questionFilters: questionFilters as typeof questionFilters, // Для TypeScript
    resetQuestionFilters,
    setQuestionFilters,
    getCurrentFilters,
    getAvailableFilterValues,
    checkAndResetFiltersIfNeeded,
    applyQuestionFilters,
    getFilteredQuestions,
  }
}
