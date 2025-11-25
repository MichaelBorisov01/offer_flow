import { useBooleanStorage, useStringStorage } from '@/composables/useLocalStorage'

export class ConsentManager {
  // Реактивные ссылки на данные в localStorage
  private static consentGiven = useBooleanStorage('consent_given', false)
  private static consentDate = useStringStorage('consent_date', '')
  private static privacyVersion = useStringStorage('privacy_version', '')
  private static agreementVersion = useStringStorage('agreement_version', '')

  static acceptConsent() {
    const consentData = {
      given: true,
      date: new Date().toISOString(),
      privacyVersion: '1.0',
      agreementVersion: '1.0',
    }

    // Сохраняем через композаблы
    this.consentGiven.value = true
    this.consentDate.value = consentData.date
    this.privacyVersion.value = consentData.privacyVersion
    this.agreementVersion.value = consentData.agreementVersion

    return consentData
  }

  static hasValidConsent(): boolean {
    // Проверяем актуальность версий через реактивные ссылки
    const isPrivacyValid = this.privacyVersion.value === '1.0'
    const isAgreementValid = this.agreementVersion.value === '1.0'

    return this.consentGiven.value && isPrivacyValid && isAgreementValid
  }

  static getConsentInfo() {
    return {
      given: this.consentGiven.value,
      date: this.consentDate.value,
      privacyVersion: this.privacyVersion.value,
      agreementVersion: this.agreementVersion.value,
    }
  }

  static revokeConsent() {
    this.consentGiven.value = false
    this.consentDate.value = ''
    this.privacyVersion.value = ''
    this.agreementVersion.value = ''
  }

  // Метод для проверки необходимости запроса согласия
  static shouldRequestConsent(): boolean {
    return !this.hasValidConsent()
  }

  // Метод для получения данных согласия для сохранения в Firebase
  static getConsentDataForFirebase() {
    return {
      privacyPolicy: this.consentGiven.value,
      userAgreement: this.consentGiven.value,
      acceptedAt: this.consentDate.value,
      privacyVersion: this.privacyVersion.value,
      agreementVersion: this.agreementVersion.value,
    }
  }
}
