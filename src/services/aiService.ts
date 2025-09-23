import type { AISettings, Question } from '@/types/interview';

// Заглушка для AI API - потом заменим на реальный
export const AIService = {
  async generateQuestions(settings: AISettings): Promise<Question[]> {
    // Имитация загрузки
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Локальные вопросы для разных категорий
    const questionsByField: Record<string, Record<string, string[]>> = {
      frontend: {
        junior: [
          'Что такое Virtual DOM и зачем он нужен?',
          'Объясните разницу между let, const и var',
          'Что такое компонентный подход в разработке?',
          'Как работает событийный цикл в JavaScript?',
          'Что такое CSS Grid и Flexbox?'
        ],
        middle: [
          'Расскажите о принципах реактивности во Vue 3',
          'В чем разница между Composition API и Options API?',
          'Как работает механизм dependency tracking?',
          'Что такое Tree Shaking и как оно работает?',
          'Как оптимизировать производительность React приложения?'
        ],
        senior: [
          'Опишите архитектуру крупного SPA приложения',
          'Как реализовать микро-фронтенд архитектуру?',
          'Расскажите о стратегиях кэширования на клиенте',
          'Как обеспечить безопасность веб-приложения?',
          'Опишите процесс code review в большой команде'
        ]
      },
      backend: {
        junior: [
          'Что такое REST API и его основные принципы?',
          'Объясните различия между SQL и NoSQL',
          'Что такое миграции базы данных?',
          'Как работает аутентификация по токенам?'
        ],
        middle: [
          'Что такое индексы в базах данных и когда их использовать?',
          'Объясните принципы ООП на практике',
          'Как работает кэширование на уровне приложения?'
        ],
        senior: [
          'Опишите подходы к проектированию микросервисной архитектуры',
          'Как обеспечить отказоустойчивость распределенной системы?'
        ]
      }
    };

    const fieldQuestions = questionsByField[settings.field] || questionsByField.frontend;
    const difficultyQuestions = fieldQuestions[settings.difficulty] || fieldQuestions.junior;
    
    // Возвращаем нужное количество вопросов
    const selectedQuestions = difficultyQuestions
      .slice(0, settings.questionsCount)
      .map((text, index) => ({
        id: `ai-${Date.now()}-${index}`,
        text,
        type: 'text' as const,
        category: settings.field,
        difficulty: settings.difficulty,
        tags: [settings.technology || settings.field],
        generatedBy: 'ai' as const,
        createdAt: new Date()
      }));

    return selectedQuestions;
  },

  // Метод для оценки ответов (будем развивать позже)
  async evaluateAnswer(question: string, answer: string): Promise<any> {
    return {
      score: Math.floor(Math.random() * 10) + 1,
      feedback: 'Это хороший ответ, но можно добавить больше деталей.',
      suggestions: ['Упомяните конкретные примеры', 'Добавьте сравнение с альтернативами']
    };
  }
};