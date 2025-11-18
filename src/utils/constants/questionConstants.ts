export const DIFFICULTY_COLORS = {
  junior: 'green',
  middle: 'orange',
  senior: 'red',
} as const

export const DIFFICULTY_LABELS = {
  junior: 'Junior',
  middle: 'Middle',
  senior: 'Senior',
} as const

export const CATEGORY_COLORS = {
  'javascript': 'gold',
  'vue': 'green',
  'react': 'blue',
  'typescript': 'geekblue',
  'html-css': 'purple',
  'algorithms': 'orange',
  'database': 'red',
  'system-design': 'cyan',
  'soft-skills': 'lime',
  'nodejs': 'green',
} as const

export const CATEGORY_LABELS = {
  'javascript': 'JavaScript',
  'vue': 'Vue.js',
  'react': 'React',
  'typescript': 'TypeScript',
  'html-css': 'HTML/CSS',
  'algorithms': 'Алгоритмы',
  'database': 'Базы данных',
  'system-design': 'System Design',
  'soft-skills': 'Soft Skills',
  'nodejs': 'Node.js',
} as const

export const CATEGORY_LABELS_SHORT = {
  'javascript': 'JS',
  'vue': 'Vue',
  'react': 'React',
  'typescript': 'TS',
  'html-css': 'HTML/CSS',
  'algorithms': 'Алгоритмы',
  'database': 'Базы данных',
  'system-design': 'System Design',
  'soft-skills': 'Soft Skills',
  'nodejs': 'Node.js',
} as const

export const QUESTION_STATUS_COLORS = {
  known: {
    border: '#b7eb8f',
    background: '#f6ffed',
    text: '#52c41a',
  },
  repeat: {
    border: '#ffd591',
    background: '#fff7e6',
    text: '#fa8c16',
  },
  hard: {
    border: '#ffccc7',
    background: '#fff2f0',
    text: '#ff4d4f',
  },
} as const

export const ALL_STATUS_TYPES = ['known', 'repeat', 'hard', 'unknown'] as const

export type AllQuestionStatus = typeof ALL_STATUS_TYPES[number]

export const STATUS_LABELS: Record<AllQuestionStatus, string> = {
  known: 'Знаю',
  repeat: 'Повторить',
  hard: 'Сложно',
  unknown: 'Без статуса',
}

export const STATUS_COLORS: Record<AllQuestionStatus, string> = {
  known: '#52c41a',
  repeat: '#fa8c16',
  hard: '#ff4d4f',
  unknown: '#d9d9d9',
}
