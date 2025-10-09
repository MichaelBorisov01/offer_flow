import { useLocalStorage } from './useLocalStorage'

export type InterviewMode = 'manual' | 'ai'

/**
 * Композабл для управления и сохранения выбора режима собеседования
 */
export function useInterviewMode() {
  const { value: mode, setValue: setMode } = useLocalStorage<InterviewMode>(
    'interview-trainer-mode',
    'manual',
  )

  const { value: aiSettings, setValue: setAISettings } = useLocalStorage('interview-trainer-ai-settings', {
    field: 'frontend',
    difficulty: 'middle',
    questionsCount: 5,
    technology: 'vue',
  })

  const { value: interviewSettings, setValue: setInterviewSettings } = useLocalStorage('interview-trainer-settings', {
    showProgress: true,
    showQuestionMeta: true,
    enableAnswerInput: true,
  })

  const { value: questionsListCollapsed, setValue: setQuestionsListCollapsed } = useLocalStorage(
    'interview-trainer-questions-collapsed',
    false,
  )

  return {
    mode,
    setMode,
    aiSettings,
    setAISettings,
    interviewSettings,
    setInterviewSettings,
    questionsListCollapsed,
    setQuestionsListCollapsed,
  }
}
