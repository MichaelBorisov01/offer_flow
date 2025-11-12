export const DEFAULT_CONFIG = {
  MODEL: 'meta-llama/Llama-3.1-8B-Instruct',
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
  MAX_QUESTIONS: 20,
  MIN_QUESTION_LENGTH: 10,
} as const

export const SPECIALTY_LABELS: { [key: string]: string } = {
  frontend: 'фронтенд',
  backend: 'бэкенд',
  fullstack: 'фуллстек',
  devops: 'DevOps',
  mobile: 'мобильная',
} as const

export const DIFFICULTY_LABELS: { [key: string]: string } = {
  junior: 'джуниор (начальный уровень)',
  middle: 'мидл (средний уровень)',
  senior: 'сеньор (продвинутый уровень)',
} as const

export const RECOMMENDED_MODELS = {
  GENERAL: 'meta-llama/Llama-3.1-8B-Instruct',
  CODE: 'microsoft/DialoGPT-large',
  RUSSIAN: 'ai-forever/rugpt3large_based_on_gpt2',
} as const

export const ERROR_MESSAGES = {
  NO_RESPONSE: 'No response from model',
  INVALID_TOKEN: 'Неверный API токен Hugging Face',
  RATE_LIMIT: 'Превышен лимит запросов. Попробуйте позже.',
  MODEL_LOADING: 'Модель загружается. Подождите 30-60 секунд и попробуйте снова.',
  API_ERROR: 'Ошибка API:',
  DEFAULT_EVALUATION: 'Не удалось автоматически оценить ответ. Рекомендуется проверить его самостоятельно.',
  DEFAULT_ANSWER: 'К сожалению, не удалось сгенерировать ответ в данный момент. Пожалуйста, попробуйте обновить страницу и повторить запрос.',
} as const
