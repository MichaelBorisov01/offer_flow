import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_LABELS_SHORT,
  DIFFICULTY_COLORS,
  DIFFICULTY_COLORS_HEX,
  DIFFICULTY_LABELS,
  QUESTION_STATUS_COLORS,
} from '../constants/questionConstants'

export function getDifficultyColor(difficulty: string): string {
  return DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS] || 'blue'
}

export function getDifficultyColorHex(difficulty: string): string {
  return DIFFICULTY_COLORS_HEX[difficulty as keyof typeof DIFFICULTY_COLORS_HEX] || '#d9d9d9'
}

export function getDifficultyLabel(difficulty: string): string {
  return DIFFICULTY_LABELS[difficulty as keyof typeof DIFFICULTY_LABELS] || difficulty
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || 'default'
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category
}

export function getCategoryLabelShort(category: string): string {
  return CATEGORY_LABELS_SHORT[category as keyof typeof CATEGORY_LABELS_SHORT] || category
}

export function getQuestionStatusColors(status: 'known' | 'repeat' | 'hard') {
  return QUESTION_STATUS_COLORS[status]
}

export function getCardBorderColor(status?: 'known' | 'repeat' | 'hard'): string {
  if (!status)
    return '#f0f0f0'
  return QUESTION_STATUS_COLORS[status].border
}

export function getCardBackgroundColor(status?: 'known' | 'repeat' | 'hard'): string {
  if (!status)
    return '#ffffff'
  return QUESTION_STATUS_COLORS[status].background
}
