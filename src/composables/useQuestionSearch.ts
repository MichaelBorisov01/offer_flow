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
      return questionMatches
    })
  })

  return {
    searchQuery,
    searchResults,
  }
}
