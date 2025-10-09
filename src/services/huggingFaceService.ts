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
          && line.match(/\p{L}/u) // Должны быть любые буквы (Unicode property)
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
    // Проверяем, является ли вопрос ерундой (с улучшенным детектором)
      const isQuestionGibberish = this.isGibberish(question)

      // Проверяем, является ли ответ ерундой (если есть)
      const isAnswerGibberish = userAnswer ? this.isGibberish(userAnswer) : false

      // Генерируем шутку ТОЛЬКО если вопрос ИЛИ ответ - явная ерунда
      const shouldGenerateJoke = isQuestionGibberish || isAnswerGibberish

      const messages: ChatCompletionInputMessage[] = shouldGenerateJoke
        ? this.buildJokeMessages(question, userAnswer, isQuestionGibberish)
        : this.buildAnswerMessages(question)

      const response = await this.chatCompletion(messages)

      return {
        content: response.trim(),
        type: shouldGenerateJoke ? 'joke' : 'serious',
        generatedAt: new Date(),
      }
    }
    catch (error) {
      console.error('Error generating answer:', error)
      return this.getDefaultAnswer()
    }
  }

  private isShortTextGibberish(text: string): boolean {
    const textLength = text.length

    // Осмысленные короткие IT-термины и слова
    const meaningfulShortWords = [
    // IT термины
      'ооп',
      'api',
      'sql',
      'css',
      'html',
      'js',
      'ts',
      'vue',
      'react',
      'dom',
      'url',
      'ide',
      'sdk',
      'cdn',
      'ssl',
      'tls',
      'http',
      'json',
      'xml',
      'git',

      // Вопросы и местоимения
      'что',
      'как',
      'чем',
      'кто',
      'где',
      'когда',
      'почему',
      'зачем',
      'this',
      'that',
      'what',
      'how',
      'why',
      'when',
      'where',

      // Ключевые слова программирования
      'var',
      'let',
      'const',
      'function',
      'class',
      'interface',
      'type',
      'if',
      'else',
      'for',
      'while',
      'return',
      'import',
      'export',
    ]

    const lowerText = text.toLowerCase().replace(/\s/g, '')

    // Если текст совпадает с осмысленным словом - не ерунда
    if (meaningfulShortWords.includes(lowerText)) {
      return false
    }

    // Проверяем разнообразие символов
    const uniqueChars = new Set(lowerText)
    const diversityRatio = uniqueChars.size / textLength

    // Если разнообразие слишком низкое
    if (diversityRatio < 0.3 && textLength > 3) {
      return true
    }

    // Проверяем на отсутствие гласных (но с исключениями для IT-терминов)
    const hasVowels = /[аеёиоуыэюяaeiou]/i.test(text)
    const isITAcronym = /^[a-z]{2,4}$/i.test(text) && !hasVowels // CSS, HTML, SQL и т.д.

    if (!hasVowels && !isITAcronym && textLength > 4) {
      return true
    }

    return false
  }

  private isMeaningfulText(text: string): boolean {
  // Осмысленные паттерны в тексте
    const meaningfulPatterns = [
    // Вопросы
      /\b(что|как|почему|когда|где|кто|какой|зачем)\b/i,
      /\b(what|how|why|when|where|who|which)\b/i,

      // IT термины
      /\b(программир|код|функц|перемен|база|данн|сервер|клиент|алгоритм|интерфейс)\b/i,
      /\b(program|code|function|variable|data|server|client|algorithm|interface)\b/i,

      // Общие осмысленные слова
      /\b(это|так|есть|быть|мочь|хотеть|знать|объяснить|рассказать)\b/i,
      /\b(is|are|have|can|will|know|explain|describe|tell)\b/i,
    ]

    // Проверяем наличие осмысленных паттернов
    const hasMeaningfulPatterns = meaningfulPatterns.some(pattern => pattern.test(text))

    // Проверяем структуру предложения
    const hasSentenceStructure = /[.!?]\s+\p{Lu}/u.test(text) // Новое предложение с большой буквы
      || /\b\p{Lu}\p{Ll}+\s+\p{Ll}+/u.test(text) // Слова разделенные пробелами

    return hasMeaningfulPatterns || hasSentenceStructure
  }

  /**
   * Список IT-терминов которые НЕ являются ерундой
   */
  private getITTerms(): string[] {
    return [
    // Языки программирования
      'javascript',
      'typescript',
      'python',
      'java',
      'csharp',
      'cplusplus',
      'php',
      'ruby',
      'go',
      'rust',
      'js',
      'ts',
      'py',
      'java',
      'cs',
      'cpp',
      'php',
      'rb',
      'go',
      'rs',

      // Фреймворки и библиотеки
      'react',
      'vue',
      'angular',
      'svelte',
      'next',
      'nuxt',
      'express',
      'django',
      'flask',
      'laravel',
      'spring',
      'aspnet',
      'jquery',
      'bootstrap',
      'tailwind',

      // Технологии и концепции
      'ооп',
      'oop',
      'api',
      'rest',
      'graphql',
      'sql',
      'nosql',
      'mongodb',
      'postgresql',
      'mysql',
      'html',
      'css',
      'scss',
      'sass',
      'dom',
      'virtual dom',
      'ajax',
      'fetch',
      'websocket',
      'docker',
      'kubernetes',
      'ci/cd',
      'devops',
      'agile',
      'scrum',
      'kanban',
      'git',
      'github',
      'gitlab',
      'bitbucket',
      'npm',
      'yarn',
      'webpack',
      'vite',

      // Паттерны и принципы
      'solid',
      'dry',
      'kiss',
      'yagni',
      'mvc',
      'mvvm',
      'microservices',
      'monolith',
      'singleton',
      'factory',
      'observer',
      'decorator',
      'adapter',
      'strategy',
    ]
  }

  /**
   * Проверка на "неразборчивость" ответа
   */
  private isGibberish(text: string): boolean {
    if (!text || text.trim().length === 0)
      return true

    const cleanText = text.trim()
    const textLength = cleanText.length

    const lowerText = text.toLowerCase()

    if (this.getITTerms().some(word => lowerText.includes(word))) {
      return false
    }
    // Слишком короткий текст (меньше 3 символов)
    if (textLength < 3)
      return true

    // ЯВНАЯ ЕРУНДА - паттерны которые точно бессмысленны
    const explicitGibberishPatterns = [
    // Только цифры (3+ цифры подряд)
      /^[0-9\s]{3,}$/,

      // Одна повторяющаяся цифра/буква (5+ раз)
      /^(.)\1{4,}$/,

      // Только спецсимволы (3+ символа)
      /^[^\w\s\p{L}]{3,}$/u,

      // Клавиатурные комбинации (полные ряды)
      /^(йцукенгшщзхъ|фывапролджэ|ячсмитьбю|qwertyuiop|asdfghjkl|zxcvbnm)$/i,

      // Случайные повторяющиеся символы (6+ одинаковых подряд)
      /(.)\1{5,}/,
    ]

    // Проверяем по явным паттернам ерунды
    if (explicitGibberishPatterns.some(pattern => pattern.test(cleanText))) {
      return true
    }

    // Для текстов от 3 до 15 символов - дополнительные проверки
    if (textLength <= 15) {
      return this.isShortTextGibberish(cleanText)
    }

    // Для длинных текстов - проверяем на осмысленность
    return !this.isMeaningfulText(cleanText)
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
        content: `Ты - остроумный IT-специалист с отличным чувством юмора. Придумай добрую и креативную шутку про ситуацию в IT-мире.

Требования к шутке:
- Будь добрым, без сарказма и критики
- Свяжи с IT-тематикой (программирование, баги, алгоритмы и т.д.)
- Будь оригинальным и забавным
- Шутка должна поднять настроение
- Длина: 2-4 предложения
- Можно использовать IT-мемы или известные шутки из мира разработки

Примеры хороших IT-шуток:
"Этот код настолько оптимизирован, что даже компилятор плачет от умиления"
"Наш бэкенд работает так быстро, что фронтенд не успевает за ним"
"Это не баг, это фича с недокументированным поведением"`,
      },
      {
        role: 'user',
        content: `${context}

Придумай добрую IT-шутку по этому поводу.`,
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
