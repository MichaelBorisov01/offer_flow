export const DIFFICULTY_COLORS = {
  junior: 'var(--ant-color-success)',
  middle: 'var(--ant-color-warning)',
  senior: 'var(--ant-color-error)',
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
    border: 'var(--ant-color-success-border)',
    background: 'var(--ant-color-success-bg)',
    text: 'var(--ant-color-success)',
  },
  repeat: {
    border: 'var(--ant-color-warning-border)',
    background: 'var(--ant-color-warning-bg)',
    text: 'var(--ant-color-warning)',
  },
  hard: {
    border: 'var(--ant-color-error-border)',
    background: 'var(--ant-color-error-bg)',
    text: 'var(--ant-color-error)',
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
  known: 'var(--ant-color-success)',
  repeat: 'var(--ant-color-warning)',
  hard: 'var(--ant-color-error)',
  unknown: 'var(--ant-color-text-secondary)',
}
