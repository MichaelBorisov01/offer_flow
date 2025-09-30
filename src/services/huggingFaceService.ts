import type { ChatCompletionInputMessage, ChatCompletionOutput } from '@huggingface/tasks'

import type { AIAnswer } from '@/types/interview'
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
      const response: ChatCompletionOutput = await this.client.chatCompletion({
        model: this.config.model || 'meta-llama/Llama-3.1-8B-Instruct',
        messages,
        max_tokens: this.config.maxTokens || 500,
        temperature: this.config.temperature || 0.7,
      })

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
  private buildQuestionsMessages(settings: any): ChatCompletionInputMessage[] {
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
- Вопросы должны быть часто встречаемые на собеседованиях

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
"Что такое Event Loop в JavaScript?"
"В чем разница между интерфейсом и типов в TypeScript?"
"Как можно оптимизировать Vue приложение?"

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
    const messages: ChatCompletionInputMessage[] = [
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
      const messages: ChatCompletionInputMessage[] = [
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

  async generateAnswer(question: string, userAnswer?: string): Promise<AIAnswer> {
    try {
    // Проверяем, является ли ответ неразборчивым
      const isGibberish = userAnswer ? this.isGibberish(userAnswer) : false

      console.log('isGibberish', isGibberish)

      const messages: ChatCompletionInputMessage[] = isGibberish
        ? this.buildJokeMessages(question, userAnswer!)
        : this.buildAnswerMessages(question)

      const response = await this.chatCompletion(messages)

      return {
        content: response.trim(),
        type: isGibberish ? 'joke' : 'serious',
        generatedAt: new Date(),
      }
    }
    catch (error) {
      console.error('Error generating answer:', error)
      return this.getDefaultAnswer()
    }
  }

  /**
   * Проверка на "неразборчивость" ответа
   */
  private isGibberish(text: string): boolean {
    if (!text || text.length < 5)
      return true

    // Проверяем различные признаки неразборчивого текста
    const gibberishPatterns = [
      /^[а-яА-Я]*$/, // Только повторяющиеся буквы
      /(.)\1{4,}/, // Одна буква повторяется 5+ раз
      /^[^а-яА-Яa-zA-Z]*$/, // Нет букв вообще
      /^[0-9\s]*$/, // Только цифры и пробелы
      /^[^\w\s]{10,}$/, // Только спецсимволы
      /(asdf|фыва|йцук)/i, // Клавиатурные комбинации
      /^.{1,3}$/, // Слишком короткий текст
    ]

    const cleanText = text.trim()

    // Если текст соответствует любому из паттернов - считаем неразборчивым
    if (gibberishPatterns.some(pattern => pattern.test(cleanText))) {
      return true
    }

    // Дополнительная проверка: если текст состоит в основном из повторяющихся символов
    const uniqueChars = new Set(cleanText.toLowerCase().replace(/\s/g, ''))
    if (uniqueChars.size <= 2 && cleanText.length > 10) {
      return true
    }

    return false
  }

  /**
   * Построение сообщений для генерации серьезного ответа
   */
  private buildAnswerMessages(question: string): ChatCompletionInputMessage[] {
    return [
      {
        role: 'system',
        content: `Ты - опытный IT-специалист и ментор. Дай развернутый, но понятный ответ на технический вопрос.

Требования к ответу:
- Будь точным и технически корректным
- Объясняй сложные концепции простыми словами
- Приводи практические примеры
- Структурируй ответ логически
- Длина: 200-400 слов

Формат:
1. Краткий ответ (основная мысль)
2. Подробное объяснение 
3. Практические примеры
4. Ключевые выводы`,
      },
      {
        role: 'user',
        content: `Дай развернутый ответ на вопрос: "${question}"`,
      },
    ]
  }

  /**
   * Построение сообщений для генерации шутки
   */
  private buildJokeMessages(question: string, userAnswer: string): ChatCompletionInputMessage[] {
    return [
      {
        role: 'system',
        content: `Ты - остроумный IT-специалист с чувством юмора. Придумай креативную и добрую шутку про то, что кто-то написал неразборчивый ответ на технический вопрос.

Требования к шутке:
- Будь добрым и не обидным
- Свяжи с IT-тематикой
- Будь креативным и оригинальным
- Шутка должна поднять настроение
- Длина: 2-4 предложения

Не используй сарказм и критику.`,
      },
      {
        role: 'user',
        content: `Кандидат на вопрос "${question}" ответил: "${userAnswer}"

Это явно неразборчивый текст. Придумай добрую шутку по этому поводу в IT-тематике.`,
      },
    ]
  }

  private getDefaultAnswer(): AIAnswer {
    return {
      content: 'Не удалось сгенерировать ответ. Попробуйте обновить страницу и повторить запрос.',
      type: 'serious',
      generatedAt: new Date(),
    }
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
