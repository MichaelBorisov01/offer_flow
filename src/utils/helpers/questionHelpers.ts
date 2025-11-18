import type { AllQuestionStatus } from '../constants/questionConstants'
import type { QuestionStatus } from '@/types/interview'
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_LABELS_SHORT,
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  QUESTION_STATUS_COLORS,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../constants/questionConstants'

export function getDifficultyColor(difficulty: string): string {
  return DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS] || 'blue'
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

export function getCardBorderColor(status?: QuestionStatus): string {
  if (!status)
    return '#f0f0f0'
  return QUESTION_STATUS_COLORS[status].border
}

export function getCardBackgroundColor(status?: QuestionStatus): string {
  if (!status)
    return '#ffffff'
  return QUESTION_STATUS_COLORS[status].background
}

export function getStatusLabel(status: AllQuestionStatus): string {
  return STATUS_LABELS[status]
}

export function getStatusColor(status: AllQuestionStatus): string {
  return STATUS_COLORS[status]
}
