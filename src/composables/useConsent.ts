import { computed } from 'vue'
import { ConsentManager } from '@/utils/consentManager'

export function useConsent() {
  // Проверка необходимости запроса согласия
  const shouldRequestConsent = computed(() =>
    ConsentManager.shouldRequestConsent(),
  )

  // Принятие согласия
  const acceptConsent = () => {
    return ConsentManager.acceptConsent()
  }

  // Отзыв согласия
  const revokeConsent = () => {
    ConsentManager.revokeConsent()
  }

  // Получение информации о согласии
  const consentInfo = computed(() =>
    ConsentManager.getConsentInfo(),
  )

  // Проверка валидности согласия
  const hasValidConsent = computed(() =>
    ConsentManager.hasValidConsent(),
  )

  return {
    shouldRequestConsent,
    acceptConsent,
    revokeConsent,
    consentInfo,
    hasValidConsent,
  }
}
