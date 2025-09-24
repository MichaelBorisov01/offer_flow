import { computed } from 'vue'
import { useInterviewStore } from '@/stores/interview'

export function useInterview() {
  const store = useInterviewStore()

  const questionsCount = computed(() => store.questions.length)

  const canStartInterview = computed(() => {
    if (store.mode === 'manual') {
      return store.questions.length > 0
    }
    return true // Для AI режима проверки не нужны
  })

  return {
    ...store,
    questionsCount,
    canStartInterview,
  }
}
