import type { Question } from '@/types/interview'
import { computed, ref } from 'vue'

export function useQuestionSearch(questions: Question[]) {
  const searchQuery = ref('')

  const normalizeText = (text: string): string => {
    return text.toLowerCase().trim()
  }

  const searchResults = computed(() => {
    if (!searchQuery.value) {
      return questions
    }

    const query = normalizeText(searchQuery.value)

    return questions.filter((question) => {
      const questionMatches = normalizeText(question.text).includes(query)
      const categoryMatches = question.category
        ? normalizeText(question.category).includes(query)
        : false
      const tagsMatches = question.tags?.some(tag =>
        normalizeText(tag).includes(query),
      ) || false
      const userAnswerMatches = question.userAnswer
        ? normalizeText(question.userAnswer).includes(query)
        : false
      const aiAnswerMatches = question.aiAnswer?.content
        ? normalizeText(question.aiAnswer.content).includes(query)
        : false

      return questionMatches || categoryMatches || tagsMatches
        || userAnswerMatches || aiAnswerMatches
    })
  })

  const clearSearch = () => {
    searchQuery.value = ''
  }

  const hasActiveSearch = computed(() =>
    searchQuery.value.length > 0,
  )

  return {
    searchQuery,
    searchResults,
    clearSearch,
    hasActiveSearch,
  }
}
