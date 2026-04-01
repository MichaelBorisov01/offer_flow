import { TEXT_VALIDATION } from '@/utils/constants/textValidation'

export function isShortTextGibberish(text: string): boolean {
  const textLength = text.length
  const lowerText = text.toLowerCase().replace(/\s/g, '')

  if (TEXT_VALIDATION.MEANINGFUL_SHORT_WORDS.includes(lowerText as any)) {
    return false
  }

  const uniqueChars = new Set(lowerText)
  const diversityRatio = uniqueChars.size / textLength

  if (diversityRatio < 0.3 && textLength > 3) {
    return true
  }

  const hasVowels = /[аеёиоуыэюяaeiou]/i.test(text)
  const isITAcronym = /^[a-z]{2,4}$/i.test(text) && !hasVowels

  return !hasVowels && !isITAcronym && textLength > 4
}

export function isMeaningfulText(text: string): boolean {
  const hasMeaningfulPatterns = TEXT_VALIDATION.MEANINGFUL_PATTERNS.some(pattern => pattern.test(text))
  const hasTechnicalQuestionPattern = TEXT_VALIDATION.TECHNICAL_QUESTION_PATTERNS.some(pattern => pattern.test(text))
  const hasMeaningfulQuestionWords = TEXT_VALIDATION.MEANINGFUL_QUESTION_WORDS.some(word =>
    text.toLowerCase().includes(word.toLowerCase()),
  )

  const hasSentenceStructure = /[.!?]\s+\p{Lu}/u.test(text) || /\b\p{Lu}\p{Ll}+\s+\p{Ll}+/u.test(text)

  return hasMeaningfulPatterns || hasTechnicalQuestionPattern || hasMeaningfulQuestionWords || hasSentenceStructure
}

export function isGibberish(text: string): boolean {
  if (!text || text.trim().length === 0)
    return true

  const cleanText = text.trim()
  const textLength = cleanText.length
  const lowerText = text.toLowerCase()

  // Проверяем IT-термины
  if (TEXT_VALIDATION.IT_TERMS.some(word => lowerText.includes(word))) {
    return false
  }

  // Проверяем паттерны технических вопросов
  if (TEXT_VALIDATION.TECHNICAL_QUESTION_PATTERNS.some(pattern => pattern.test(cleanText))) {
    return false
  }

  // Проверяем осмысленные слова вопросов
  if (TEXT_VALIDATION.MEANINGFUL_QUESTION_WORDS.some(word =>
    lowerText.includes(word.toLowerCase()),
  )) {
    return false
  }

  // Слишком короткий текст (меньше 3 символов)
  if (textLength < 3)
    return true

  // ЯВНАЯ ЕРУНДА - паттерны которые точно бессмысленны
  if (TEXT_VALIDATION.GIBBERISH_PATTERNS.some(pattern => pattern.test(cleanText))) {
    return true
  }

  // Для текстов от 3 до 25 символов - дополнительные проверки
  if (textLength <= 25) {
    return isShortTextGibberish(cleanText)
  }

  // Для длинных текстов - проверяем на осмысленность
  return !isMeaningfulText(cleanText)
}

// Новая функция для более строгой проверки технических вопросов
export function isTechnicalQuestion(text: string): boolean {
  if (!text || text.trim().length === 0)
    return false

  const cleanText = text.trim().toLowerCase()

  // Проверяем наличие IT-терминов
  const hasITTerms = TEXT_VALIDATION.IT_TERMS.some(term =>
    cleanText.includes(term.toLowerCase()),
  )

  // Проверяем паттерны технических вопросов
  const hasTechnicalPatterns = TEXT_VALIDATION.TECHNICAL_QUESTION_PATTERNS.some(pattern =>
    pattern.test(cleanText),
  )

  // Проверяем осмысленные слова вопросов
  const hasQuestionWords = TEXT_VALIDATION.MEANINGFUL_QUESTION_WORDS.some(word =>
    cleanText.includes(word.toLowerCase()),
  )

  return hasITTerms && (hasTechnicalPatterns || hasQuestionWords)
}

// Функция для проверки, является ли текст вероятно нормальным вопросом
export function isLikelyNormalQuestion(text: string): boolean {
  if (!text || text.trim().length === 0)
    return false

  const cleanText = text.trim()

  // Если это точно технический вопрос
  if (isTechnicalQuestion(cleanText)) {
    return true
  }

  // Если текст содержит IT-термины и выглядит осмысленным
  const hasITTerms = TEXT_VALIDATION.IT_TERMS.some(term =>
    cleanText.toLowerCase().includes(term.toLowerCase()),
  )

  const looksMeaningful = isMeaningfulText(cleanText)

  return hasITTerms && looksMeaningful
}
