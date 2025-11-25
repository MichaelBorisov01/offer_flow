import type { AISettings, InterviewSettings } from '@/types/interview'
import { useLocalStorage } from './useLocalStorage'

export type InterviewMode = 'manual' | 'ai'

/**
 * Композабл для управления и сохранения выбора режима собеседования
 */
export function useInterviewMode() {
  const mode = useLocalStorage<InterviewMode>('interview-trainer-mode', 'manual')
  const aiSettings = useLocalStorage<AISettings>('interview-trainer-ai-settings', {
    specialty: 'frontend',
    difficulty: 'middle',
    questionsCount: 5,
    technology: 'vue',
    skill: 'hard',
  })
  const interviewSettings = useLocalStorage<InterviewSettings>('interview-trainer-settings', {
    showProgress: true,
    enableAnswerInput: true,
  })
  const questionsListCollapsed = useLocalStorage('interview-trainer-questions-collapsed', false)

  return {
    mode,
    aiSettings,
    interviewSettings,
    questionsListCollapsed,

    setMode: (value: InterviewMode) => { mode.value = value },
    setAISettings: (value: any) => { aiSettings.value = value },
    setInterviewSettings: (value: InterviewSettings) => { interviewSettings.value = value },
    setQuestionsListCollapsed: (value: boolean) => { questionsListCollapsed.value = value },
  }
}
