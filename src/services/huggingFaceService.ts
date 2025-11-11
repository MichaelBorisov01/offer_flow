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
    const { specialty, difficulty, questionsCount, technology, skill } = settings

    const specialtyLabels: { [key: string]: string } = {
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

    const systemPrompt = skill === 'soft'
      ? `Ты - опытный HR-специалист и коуч. Сгенерируй вопросы для оценки soft skills (социальных навыков).

Требования к вопросам:
- Вопросы должны оценивать коммуникативные навыки, лидерство, работу в команде
- Быть поведенческими (прошлый опыт) и ситуационными (гипотетические ситуации)
- Помогать оценить культурное соответствие кандидата
- Быть актуальными для IT-сферы
- Формулироваться как на реальном собеседовании

Примеры хороших soft skills вопросов:
"Расскажите о ситуации, когда вам пришлось убеждать команду в своей точке зрения"
"Как вы справляетесь с конфликтами в команде?"
"Опишите ваш подход к работе в условиях сжатых сроков"`
      : `Ты - опытный IT-рекрутер и технический специалист. Сгенерируй технические вопросы для собеседования.

Требования к вопросам:
- Вопросы должны быть техническими и конкретными
- Соответствовать указанному уровню сложности
- Проверять реальные практические знания
- Быть актуальными для современной разработки
- Формулироваться как на реальном собеседовании
- Вопросы должны быть часто встречаемые на собеседованиях

Примеры хороших технических вопросов:
"Что такое Event Loop в JavaScript и как он работает?"
"В чем разница между интерфейсом и типом в TypeScript?"
"Как можно оптимизировать производительность Vue приложения?"`

    const userPrompt = skill === 'soft'
      ? `Сгенерируй ${questionsCount} вопросов для оценки soft skills (социальных навыков) для IT-специалиста уровня ${difficultyLabels[difficulty] || difficulty}.

Вопросы должны помочь оценить:
- Коммуникативные навыки
- Работу в команде  
- Лидерские качества
- Решение проблем
- Адаптивность и обучение

Сгенерируй вопросы:`
      : `Сгенерируй ${questionsCount} технических вопросов для собеседования на позицию ${specialtyLabels[specialty] || specialty} разработчика уровня ${difficultyLabels[difficulty] || difficulty}.

${technology ? `Основная технология: ${technology}` : ''}

Вопросы должны проверять:
- Понимание фундаментальных концепций
- Практический опыт работы
- Знание лучших практик
- Умение решать реальные задачи

Сгенерируй вопросы:`

    return [
      {
        role: 'system',
        content: `${systemPrompt}

Формат ответа:
- Каждый вопрос на отдельной строке
- Без нумерации, маркеров или специальных символов
- Только вопросы, без дополнительного текста
- Каждый вопрос должен быть законченным предложением`,
      },
      {
        role: 'user',
        content: userPrompt,
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
        return line.length > 10 // Минимальная длина вопроса
          && !line.match(/^(?:\d+[.)]?|[\-*>])\s/) // Убираем нумерацию и маркеры
          && !line.match(/^(?:вопрос|пример|система|user|assistant|сгенерир|ответ)/i) // Убираем служебные строки
          && line.match(/[.?!]$/) // Должен заканчиваться знаком препинания
          && line.match(/\p{L}/u) // Должны быть любые буквы (Unicode property)
      })
      .map((line) => {
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
        content: `Ты - опытный технический интервьюер в IT-компании. Твоя задача - объективно оценить ответ кандидата и дать конструктивную обратную связь.

Критерии оценки:
1. **Техническая корректность** (0-4 балла) - насколько ответ соответствует фактическим знаниям
2. **Полнота и глубина** (0-3 балла) - насколько развернуто и подробно ответил кандидат  
3. **Структура и ясность** (0-2 балла) - насколько логично и понятно изложен ответ
4. **Практическая ориентированность** (0-1 балл) - наличие примеров из реальной практики

Верни ответ ТОЛЬКО в формате JSON без дополнительного текста:

{
  "score": число от 1 до 10,
  "feedback": "конструктивная обратная связь на русском языке, 2-3 предложения",
  "suggestions": ["конкретное предложение по улучшению 1", "конкретное предложение по улучшению 2"]
}

Будь справедливым и помогающим.`,
      },
      {
        role: 'user',
        content: `Вопрос: "${question}"

Ответ кандидата: "${userAnswer}"

Проанализируй ответ и верни оценку в JSON формате:`,
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
          feedback: parsed.feedback || 'Ответ требует более детального рассмотрения',
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
      feedback: 'Не удалось автоматически оценить ответ. Рекомендуется проверить его самостоятельно.',
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
          content: 'Ответь одним словом: "Готов"',
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

      // Для технических вопросов сохраняем текущую логику с проверкой на "ерунду"
      const isQuestionGibberish = this.isGibberish(question)
      const isAnswerGibberish = userAnswer ? this.isGibberish(userAnswer) : false

      const shouldGenerateJoke = isQuestionGibberish || isAnswerGibberish

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
        content: `Ты - опытный HR-специалист и карьерный коуч в IT-индустрии. Твоя задача - дать практическое руководство КАК ОТВЕЧАТЬ на этот вопрос на собеседовании.

Формат ответа должен быть максимально практичным и готовым к использованию:

СТРУКТУРА ОТВЕТА:

🎯 **Что хочет услышать интервьюер**
- Кратко объясни, какие качества проверяет этот вопрос
- Какие ключевые моменты важно показать

💡 **Стратегия ответа**
- Конкретная структура ответа (например, метод STAR: Ситуация - Задача - Действие - Результат)
- Какую информацию включить в каждую часть
- Оптимальная длительность ответа (1-2 минуты)

📝 **Пример сильного ответа**
- Готовый пример ответа, который можно использовать за основу
- Адаптированный под IT-специалиста
- С реальными техническими/командными ситуациями

🚫 **Чего избегать**
- Типичные ошибки в ответах на этот вопрос
- Что может насторожить интервьюера
- Какие формулировки звучат слабо

🌟 **Дополнительные советы**
- Как адаптировать ответ под свой опыт
- Что подчеркнуть, если мало опыта
- Как связать с техническими навыками

Требования:
- Будь максимально конкретным и практичным
- Давай готовые формулировки и примеры
- Фокусируйся на IT-контексте
- Объясняй психологию вопроса
- Помоги кандидату чувствовать себя уверенно`,
      },
      {
        role: 'user',
        content: `Дай практическое руководство как отвечать на вопрос на собеседовании: "${question}"

Сфокусируйся на том, чтобы помочь кандидату:
1. Понять, что действительно хочет узнать интервьюер
2. Дать готовую структуру ответа
3. Предоставить конкретный пример ответа
4. Предупредить о частых ошибках
5. Чувствовать себя уверенно во время ответа`,
      },
    ]
  }

  private isShortTextGibberish(text: string): boolean {
    const textLength = text.length

    // Осмысленные короткие IT-термины и слова
    const meaningfulShortWords = [
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

    if (meaningfulShortWords.includes(lowerText)) {
      return false
    }

    const uniqueChars = new Set(lowerText)
    const diversityRatio = uniqueChars.size / textLength

    if (diversityRatio < 0.3 && textLength > 3) {
      return true
    }

    const hasVowels = /[аеёиоуыэюяaeiou]/i.test(text)
    const isITAcronym = /^[a-z]{2,4}$/i.test(text) && !hasVowels // CSS, HTML, SQL и т.д.

    if (!hasVowels && !isITAcronym && textLength > 4) {
      return true
    }

    return false
  }

  private isMeaningfulText(text: string): boolean {
    const meaningfulPatterns = [
      /\b(что|как|почему|когда|где|кто|какой|зачем)\b/i,
      /\b(what|how|why|when|where|who|which)\b/i,

      /\b(программир|код|функц|перемен|база|данн|сервер|клиент|алгоритм|интерфейс)\b/i,
      /\b(program|code|function|variable|data|server|client|algorithm|interface)\b/i,

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
        content: `Ты - опытный IT-специалист с глубокими знаниями в различных технологиях. Дай развернутый, структурированный и понятный ответ на технический вопрос.

Требования к ответу:
- Будь точным и технически корректным
- Объясняй сложные концепции доступным языком
- Приводи практические примеры кода или реальные кейсы
- Структурируй ответ логически
- Указывай важные нюансы и подводные камни
- Длина: 150-250 слов

Структура ответа:
1. **Краткий ответ** - основная суть в 1-2 предложениях
2. **Подробное объяснение** - детали и технические аспекты
3. **Практические примеры** - код или реальные сценарии использования
4. **Лучшие практики** - рекомендации по применению
5. **Ключевые выводы** - основные моменты для запоминания`,
      },
      {
        role: 'user',
        content: `Дай развернутый и понятный ответ на вопрос: "${question}"

Постарайся сделать ответ полезным как для начинающих, так и для опытных разработчиков.`,
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
- Будь добрым и позитивным, без сарказма
- Свяжи с IT-тематикой (программирование, баги, алгоритмы, дедлайны)
- Будь оригинальным и забавным
- Шутка должна поднять настроение
- Длина: 2-3 предложения
- Можно использовать IT-мемы или известные шутки из мира разработки

Примеры хороших IT-шуток:
"Этот код настолько чистый, что проходит code review с закрытыми глазами"
"Наш деплой работает так надежно, что даже кофе-машина ему завидует"
"Это не баг, это фича с элементами искусственного интеллекта"`,
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
      content: 'К сожалению, не удалось сгенерировать ответ в данный момент. Пожалуйста, попробуйте обновить страницу и повторить запрос.',
      type: 'serious',
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
