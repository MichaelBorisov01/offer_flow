import axios from 'axios'

const YANDEX_API_KEY = import.meta.env.VITE_YANDEX_API_KEY
const YANDEX_FOLDER_ID = import.meta.env.VITE_YANDEX_FOLDER_ID

export const YandexGPTService = {
  async generateQuestions(settings: any): Promise<string[]> {
    try {
      // Заглушка - в реальности здесь будет запрос к Yandex GPT API
      // А пока используем локальные вопросы
      return await this.getLocalQuestions(settings)
    }
    catch (error) {
      console.error('Yandex GPT error:', error)
      throw new Error('Не удалось сгенерировать вопросы')
    }
  },

  async getLocalQuestions(settings: any): Promise<string[]> {
    // Локальные вопросы для разных категорий и уровней
    const questions: Record<string, Record<string, string[]>> = {
      frontend: {
        junior: [
          'Что такое HTML и для чего он используется?',
          'Объясните разницу между блочными и строчными элементами',
          'Что такое CSS и как он используется для стилизации?',
        ],
        middle: [
          'Объясните принципы реактивности во Vue 3',
          'В чем разница между Composition API и Options API?',
          'Как работает виртуальный DOM?',
        ],
        senior: [
          'Опишите архитектуру крупного Vue-приложения',
          'Как оптимизировать производительность Vue-приложения?',
          'Расскажите о механизмах кэширования в веб-приложениях',
        ],
      },
      backend: {
        junior: [
          'Что такое REST API?',
          'Объясните основные HTTP методы',
          'Что такое база данных и зачем она нужна?',
        ],
        middle: [
          'В чем разница между SQL и NoSQL базами данных?',
          'Что такое индексы в базах данных?',
          'Объясните принципы ООП',
        ],
        senior: [
          'Опишите подходы к проектированию микросервисной архитектуры',
          'Как обеспечить безопасность API?',
          'Что такое message brokers и зачем они нужны?',
        ],
      },
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const categoryQuestions = questions[settings.field] || questions.frontend
        const levelQuestions = categoryQuestions[settings.difficulty] || categoryQuestions.junior

        // Возвращаем нужное количество вопросов
        resolve(levelQuestions.slice(0, settings.questionsCount))
      }, 1000)
    })
  },
}
