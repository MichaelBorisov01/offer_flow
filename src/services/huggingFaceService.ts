import type { ChatCompletionInputMessage, ChatCompletionOutput } from '@huggingface/tasks'
import type { AIAnswer } from '@/types/interview'
import { InferenceClient } from '@huggingface/inference'

import {
  DEFAULT_CONFIG,
  DIFFICULTY_LABELS,
  ERROR_MESSAGES,
  RECOMMENDED_MODELS,
  SPECIALTY_LABELS,
} from '@/utils/constants/huggingFace'

import { PROMPTS } from '@/utils/constants/prompts'
import { isGibberish, isLikelyNormalQuestion } from '@/utils/helpers/AITextHelpers'

export interface HuggingFaceConfig {
  apiKey: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export class HuggingFaceService {
  private client: InferenceClient
  private config: HuggingFaceConfig

  constructor(config: HuggingFaceConfig) {
    this.client = new InferenceClient(config.apiKey)
    this.config = config
  }

  async chatCompletion(messages: ChatCompletionInputMessage[]): Promise<string> {
    try {
      const response: ChatCompletionOutput = await this.client.chatCompletion({
        model: this.config.model || DEFAULT_CONFIG.MODEL,
        messages,
        max_tokens: this.config.maxTokens || DEFAULT_CONFIG.MAX_TOKENS,
        temperature: this.config.temperature || DEFAULT_CONFIG.TEMPERATURE,
      })

      if (response.choices && response.choices.length > 0) {
        return response.choices[0]?.message.content || ''
      }
      else {
        throw new Error(ERROR_MESSAGES.NO_RESPONSE)
      }
    }
    catch (error: any) {
      console.error('Hugging Face API Error:', {
        status: error.status,
        message: error.message,
        details: error,
      })

      if (error.status === 401) {
        throw new Error(ERROR_MESSAGES.INVALID_TOKEN)
      }
      else if (error.status === 429) {
        throw new Error(ERROR_MESSAGES.RATE_LIMIT)
      }
      else if (error.message?.includes('model is currently loading')) {
        throw new Error(ERROR_MESSAGES.MODEL_LOADING)
      }
      else {
        throw new Error(`${ERROR_MESSAGES.API_ERROR} ${error.message || 'Неизвестная ошибка'}`)
      }
    }
  }

  /**
   * Генерация вопросов для собеседования
   */
  async generateQuestions(settings: any): Promise<string[]> {
    const messages = this.buildQuestionsMessages(settings)
    const generatedText = await this.chatCompletion(messages)
    return this.parseQuestions(generatedText)
  }

  /**
   * Построение сообщений для генерации вопросов
   */
  private buildQuestionsMessages(settings: any): ChatCompletionInputMessage[] {
    const { specialty, difficulty, questionsCount, technology, skill } = settings

    const systemPrompt = skill === 'soft'
      ? PROMPTS.QUESTIONS.SOFT_SKILLS_SYSTEM
      : PROMPTS.QUESTIONS.TECHNICAL_SYSTEM

    const userPrompt = skill === 'soft'
      ? this.buildSoftSkillsUserPrompt(questionsCount, difficulty)
      : this.buildTechnicalUserPrompt(questionsCount, specialty, difficulty, technology)

    return [
      {
        role: 'system',
        content: `${systemPrompt}\n\n${PROMPTS.QUESTIONS.RESPONSE_FORMAT}`,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ]
  }

  private buildSoftSkillsUserPrompt(questionsCount: number, difficulty: string): string {
    return `Сгенерируй ${questionsCount} вопросов для оценки soft skills (социальных навыков) для IT-специалиста уровня ${DIFFICULTY_LABELS[difficulty] || difficulty}.

Вопросы должны помочь оценить:
- Коммуникативные навыки
- Работу в команде  
- Лидерские качества
- Решение проблем
- Адаптивность и обучение

Сгенерируй вопросы:`
  }

  private buildTechnicalUserPrompt(questionsCount: number, specialty: string, difficulty: string, technology?: string): string {
    return `Сгенерируй ${questionsCount} технических вопросов для собеседования на позицию ${SPECIALTY_LABELS[specialty] || specialty} разработчика уровня ${DIFFICULTY_LABELS[difficulty] || difficulty}.

${technology ? `Основная технология: ${technology}` : ''}

Вопросы должны проверять:
- Понимание фундаментальных концепций
- Практический опыт работы
- Знание лучших практик
- Умение решать реальные задачи

Сгенерируй вопросы:`
  }

  /**
   * Парсинг сгенерированных вопросов
   */
  private parseQuestions(text: string): string[] {
    if (!text)
      return []

    return text
      .split('\n')
      .map(line => line.trim())
      .filter((line) => {
        return line.length > DEFAULT_CONFIG.MIN_QUESTION_LENGTH
          && !line.match(/^(?:\d+[.)]?|[\-*>])\s/)
          && !line.match(/^(?:вопрос|пример|система|user|assistant|сгенерир|ответ)/i)
          && line.match(/[.?!]$/)
          && line.match(/\p{L}/u)
      })
      .map((line) => {
        return line.replace(/^["'](.*)["']$/, '$1').trim()
      })
      .slice(0, DEFAULT_CONFIG.MAX_QUESTIONS)
  }

  /**
   * Оценка ответа на вопрос
   */
  async evaluateAnswer(question: string, userAnswer: string): Promise<{
    score: number
    feedback: string
    suggestions: string[]
  }> {
    const messages: ChatCompletionInputMessage[] = [
      {
        role: 'system',
        content: PROMPTS.EVALUATION.SYSTEM,
      },
      {
        role: 'user',
        content: PROMPTS.EVALUATION.USER(question, userAnswer),
      },
    ]

    try {
      const evaluationText = await this.chatCompletion(messages)
      return this.parseEvaluation(evaluationText)
    }
    catch (error) {
      console.error('Evaluation error:', error)
      return this.getDefaultEvaluation()
    }
  }

  private parseEvaluation(text: string): { score: number, feedback: string, suggestions: string[] } {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])

        return {
          score: Math.max(1, Math.min(10, Number(parsed.score) || 5)),
          feedback: parsed.feedback || ERROR_MESSAGES.DEFAULT_EVALUATION,
          suggestions: Array.isArray(parsed.suggestions)
            ? parsed.suggestions.slice(0, 3)
            : ['Рекомендуется углубить понимание темы', 'Попрактиковаться в структурировании ответов'],
        }
      }
      return this.getDefaultEvaluation()
    }
    catch (error) {
      console.error('Error parsing evaluation:', error)
      return this.getDefaultEvaluation()
    }
  }

  private getDefaultEvaluation() {
    return {
      score: 5,
      feedback: ERROR_MESSAGES.DEFAULT_EVALUATION,
      suggestions: ['Уточните технические детали в ответе', 'Добавьте практические примеры'],
    }
  }

  /**
   * Проверка подключения к API
   */
  async testConnection(): Promise<boolean> {
    try {
      const messages: ChatCompletionInputMessage[] = [
        {
          role: 'user',
          content: PROMPTS.CONNECTION_TEST.USER,
        },
      ]

      const response = await this.chatCompletion(messages)
      return response.includes('Готов') || response.length > 0
    }
    catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }

  /**
   * Получение информации о доступных моделях
   */
  async getAvailableModels(): Promise<string[]> {
    return [
      'meta-llama/Llama-3.1-8B-Instruct',
      'meta-llama/Llama-3.1-70B-Instruct',
      'microsoft/DialoGPT-large',
      'google/gemma-2-9b-it',
      'mistralai/Mistral-7B-Instruct-v0.3',
    ]
  }

  async generateAnswer(question: string, userAnswer?: string, questionCategory?: string): Promise<AIAnswer> {
    try {
    // Для софт-вопросов всегда генерируем серьезный ответ
      const isSoftQuestion = questionCategory === 'soft-skills'
      if (isSoftQuestion) {
        const messages = this.buildSoftSkillsAnswerMessages(question)
        const response = await this.chatCompletion(messages)

        return {
          content: response.trim(),
          type: 'serious',
        }
      }

      // Для технических вопросов используем улучшенную логику с проверкой на "ерунду" и нормальные вопросы
      const isQuestionGibberish = isGibberish(question)
      const isAnswerGibberish = userAnswer ? isGibberish(userAnswer) : false
      const isLikelyNormal = isLikelyNormalQuestion(question)

      // Генерируем шутку только если вопрос или ответ - ерунда И это не похоже на нормальный вопрос
      const shouldGenerateJoke = (isQuestionGibberish || isAnswerGibberish) && !isLikelyNormal

      const messages: ChatCompletionInputMessage[] = shouldGenerateJoke
        ? this.buildJokeMessages(question, userAnswer, isQuestionGibberish)
        : this.buildAnswerMessages(question)

      const response = await this.chatCompletion(messages)

      return {
        content: response.trim(),
        type: shouldGenerateJoke ? 'joke' : 'serious',
      }
    }
    catch (error) {
      console.error('Error generating answer:', error)
      return this.getDefaultAnswer()
    }
  }

  /**
   * Построение сообщений для генерации ответа на софт-вопросы
   */
  private buildSoftSkillsAnswerMessages(question: string): ChatCompletionInputMessage[] {
    return [
      {
        role: 'system',
        content: PROMPTS.ANSWER_GENERATION.SOFT_SKILLS_SYSTEM,
      },
      {
        role: 'user',
        content: PROMPTS.ANSWER_GENERATION.SOFT_SKILLS_USER(question),
      },
    ]
  }

  /**
   * Построение сообщений для генерации серьезного ответа
   */
  private buildAnswerMessages(question: string): ChatCompletionInputMessage[] {
    return [
      {
        role: 'system',
        content: PROMPTS.ANSWER_GENERATION.TECHNICAL_SYSTEM,
      },
      {
        role: 'user',
        content: PROMPTS.ANSWER_GENERATION.TECHNICAL_USER(question),
      },
    ]
  }

  /**
   * Построение сообщений для генерации шутки
   */
  private buildJokeMessages(question: string, userAnswer: string | undefined, isQuestionGibberish: boolean): ChatCompletionInputMessage[] {
    let context = ''

    if (isQuestionGibberish && userAnswer) {
      context = `Кандидат задал странный вопрос "${question}" и сам ответил на него: "${userAnswer}". Оба выглядят довольно забавно.`
    }
    else if (isQuestionGibberish) {
      context = `Кто-то задал довольно странный вопрос: "${question}". Выглядит как случайный набор символов.`
    }
    else {
      context = `Кандидат на вполне нормальный вопрос "${question}" дал забавный ответ: "${userAnswer}".`
    }

    return [
      {
        role: 'system',
        content: PROMPTS.ANSWER_GENERATION.JOKE_SYSTEM,
      },
      {
        role: 'user',
        content: PROMPTS.ANSWER_GENERATION.JOKE_USER(context),
      },
    ]
  }

  private getDefaultAnswer(): AIAnswer {
    return {
      content: ERROR_MESSAGES.DEFAULT_ANSWER,
      type: 'serious',
    }
  }
}

// Создаем экземпляр сервиса
export const huggingFaceService = new HuggingFaceService({
  apiKey: import.meta.env.VITE_HUGGING_FACE_API_KEY || '',
  model: RECOMMENDED_MODELS.GENERAL,
  maxTokens: DEFAULT_CONFIG.MAX_TOKENS,
  temperature: DEFAULT_CONFIG.TEMPERATURE,
})
