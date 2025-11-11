import type { AIAnswer, Question } from '@/types/interview'
import { ref } from 'vue'
import { AIService } from '@/services/aiService'

export function useInterviewAI(getQuestions: () => Question[]) {
  const isGeneratingAnswer = ref(false)

  const generateAnswerForQuestion = async (questionId: string, userAnswer?: string): Promise<AIAnswer | null> => {
    const question = getQuestions().find(q => q.id === questionId)
    if (!question) {
      throw new Error('Question not found')
    }

    isGeneratingAnswer.value = true

    try {
      const aiAnswer = await AIService.generateAnswer(question.text, userAnswer)
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

  return {
    isGeneratingAnswer,
    generateAnswerForQuestion,
  }
}
