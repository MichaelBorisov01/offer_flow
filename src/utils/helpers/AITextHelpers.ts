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

  if (!hasVowels && !isITAcronym && textLength > 4) {
    return true
  }

  return false
}

export function isMeaningfulText(text: string): boolean {
  const hasMeaningfulPatterns = TEXT_VALIDATION.MEANINGFUL_PATTERNS.some(pattern => pattern.test(text))
  const hasSentenceStructure = /[.!?]\s+\p{Lu}/u.test(text) || /\b\p{Lu}\p{Ll}+\s+\p{Ll}+/u.test(text)

  return hasMeaningfulPatterns || hasSentenceStructure
}

export function isGibberish(text: string): boolean {
  if (!text || text.trim().length === 0)
    return true

  const cleanText = text.trim()
  const textLength = cleanText.length
  const lowerText = text.toLowerCase()

  if (TEXT_VALIDATION.IT_TERMS.some(word => lowerText.includes(word))) {
    return false
  }

  if (textLength < 3)
    return true

  if (TEXT_VALIDATION.GIBBERISH_PATTERNS.some(pattern => pattern.test(cleanText))) {
    return true
  }

  if (textLength <= 15) {
    return isShortTextGibberish(cleanText)
  }

  return !isMeaningfulText(cleanText)
}
