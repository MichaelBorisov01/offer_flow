import type { ChatCompletionInputMessage, ChatCompletionOutput } from '@huggingface/tasks'

import { InferenceClient } from '@huggingface/inference'

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

  /**
   * Основной метод для чат-комплишена
   */
  async chatCompletion(messages: ChatCompletionInputMessage[]): Promise<string> {
    try {
      console.log('Sending chat completion request:', { messages })

      const response: ChatCompletionOutput = await this.client.chatCompletion({
        model: this.config.model || 'meta-llama/Llama-3.1-8B-Instruct',
        messages,
        max_tokens: this.config.maxTokens || 500,
        temperature: this.config.temperature || 0.7,
      })

      console.log('Hugging Face response:', response)

      if (response.choices && response.choices.length > 0) {
        return response.choices[0]?.message.content || ''
      }
      else {
        throw new Error('No response from model')
      }
    }
    catch (error: any) {
      console.error('Hugging Face API Error:', {
        status: error.status,
        message: error.message,
        details: error,
      })

      if (error.status === 401) {
        throw new Error('Неверный API токен Hugging Face')
      }
      else if (error.status === 429) {
        throw new Error('Превышен лимит запросов. Попробуйте позже.')
      }
      else if (error.message?.includes('model is currently loading')) {
        throw new Error('Модель загружается. Подождите 30-60 секунд и попробуйте снова.')
      }
      else {
        throw new Error(`Ошибка API: ${error.message || 'Неизвестная ошибка'}`)
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
  private buildQuestionsMessages(settings: any): ChatCompletionMessage[] {
    const { field, difficulty, questionsCount, technology } = settings

    const fieldLabels: { [key: string]: string } = {
      frontend: 'фронтенд',
      backend: 'бэкенд',
      fullstack: 'фуллстек',
      devops: 'DevOps',
      mobile: 'мобильная',
    }

    const difficultyLabels: { [key: string]: string } = {
      junior: 'джуниор (начальный уровень)',
      middle: 'мидл (средний уровень)',
      senior: 'сеньор (продвинутый уровень)',
    }

    return [
      {
        role: 'system',
        content: `Ты - опытный IT-рекрутер и технический специалист. Сгенерируй технические вопросы для собеседования.

Требования к вопросам:
- Вопросы должны быть техническими и конкретными
- Соответствовать указанному уровню сложности
- Проверять реальные практические знания
- Быть актуальными для современной разработки
- Формулироваться как на реальном собеседовании

Формат ответа:
- Каждый вопрос на отдельной строке
- Без нумерации, маркеров или специальных символов
- Только вопросы, без дополнительного текста`,
      },
      {
        role: 'user',
        content: `Сгенерируй ${questionsCount} технических вопросов для собеседования на позицию ${fieldLabels[field] || field} разработчика уровня ${difficultyLabels[difficulty] || difficulty}.

${technology ? `Основная технология: ${technology}` : ''}

Примеры хороших вопросов:
"Как работает event loop в JavaScript и как это влияет на асинхронный код?"
"В чем основные различия между React и Vue с точки зрения архитектуры приложения?"
"Как бы ты оптимизировал медленный SQL-запрос в большом проекте?"

Сгенерируй вопросы:`,
      },
    ]
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
        return line.length > 15 // Минимальная длина вопроса
          && !line.match(/^(?:\d+[.)]?|[\-*>])\s/) // Убираем нумерацию и маркеры
          && !line.match(/^(?:вопрос|пример|система|user|assistant)/i) // Убираем служебные строки
          && line.match(/[а-яА-Яa-zA-Z]/) // Должны быть буквы
      })
      .map((line) => {
        // Убираем кавычки если есть
        return line.replace(/^["'](.*)["']$/, '$1').trim()
      })
      .slice(0, 20) // Ограничиваем количество
  }

  /**
   * Оценка ответа на вопрос
   */
  async evaluateAnswer(question: string, userAnswer: string): Promise<{
    score: number
    feedback: string
    suggestions: string[]
  }> {
    const messages: ChatCompletionMessage[] = [
      {
        role: 'system',
        content: `Ты - технический интервьюер. Оцени ответ кандидата объективно и дай конструктивную обратную связь.

Верни ответ ТОЛЬКО в формате JSON:

{
  "score": число от 1 до 10,
  "feedback": "конструктивная обратная связь на русском языке",
  "suggestions": ["конкретное предложение 1", "конкретное предложение 2"]
}

Будь строгим но справедливым.`,
      },
      {
        role: 'user',
        content: `Вопрос: "${question}"

Ответ кандидата: "${userAnswer}"

Проанализируй ответ по критериям:
1. Техническая корректность (0-5 баллов)
2. Полнота ответа (0-3 балла)  
3. Практическая ориентированность (0-2 балла)

Верни JSON оценку:`,
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

        // Валидация и нормализация
        return {
          score: Math.max(1, Math.min(10, Number(parsed.score) || 5)),
          feedback: parsed.feedback || 'Оценка не доступна',
          suggestions: Array.isArray(parsed.suggestions)
            ? parsed.suggestions.slice(0, 3)
            : ['Проверьте ответ самостоятельно'],
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
      feedback: 'Не удалось оценить ответ через AI',
      suggestions: ['Проверьте ответ самостоятельно', 'Уточните технические детали'],
    }
  }

  /**
   * Проверка подключения к API
   */
  async testConnection(): Promise<boolean> {
    try {
      const messages: ChatCompletionMessage[] = [
        {
          role: 'user',
          content: 'Ответь одним словом: "Работает"',
        },
      ]

      const response = await this.chatCompletion(messages)
      return response.includes('Работает') || response.length > 0
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
    // Популярные модели, которые хорошо работают
    return [
      'meta-llama/Llama-3.1-8B-Instruct',
      'meta-llama/Llama-3.1-70B-Instruct',
      'microsoft/DialoGPT-large',
      'google/gemma-2-9b-it',
      'mistralai/Mistral-7B-Instruct-v0.3',
    ]
  }
}

// Рекомендуемые модели для разных задач
export const RECOMMENDED_MODELS = {
  GENERAL: 'meta-llama/Llama-3.1-8B-Instruct',
  CODE: 'microsoft/DialoGPT-large',
  RUSSIAN: 'ai-forever/rugpt3large_based_on_gpt2',
}

// Создаем экземпляр сервиса
export const huggingFaceService = new HuggingFaceService({
  apiKey: import.meta.env.VITE_HUGGING_FACE_API_KEY || '',
  model: RECOMMENDED_MODELS.GENERAL,
  maxTokens: 800,
  temperature: 0.7,
})
