import { computed } from 'vue'
import { useInterviewMode } from '@/composables/useInterviewMode'
import { useInterviewStore } from '@/stores/interview'

export function useInterview() {
  const store = useInterviewStore()
  const { mode } = useInterviewMode()

  const questionsCount = computed(() => store.questions.length)

  const canStartInterview = computed(() => {
    if (mode.value === 'manual') {
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
