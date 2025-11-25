export class ConsentManager {
  static acceptConsent() {
    const consentData = {
      given: true,
      date: new Date().toISOString(),
      privacyVersion: '1.0',
      agreementVersion: '1.0',
    }

    // Сохраняем в localStorage
    localStorage.setItem('consent_given', 'true')
    localStorage.setItem('consent_date', consentData.date)
    localStorage.setItem('privacy_version', consentData.privacyVersion)
    localStorage.setItem('agreement_version', consentData.agreementVersion)

    return consentData
  }

  static hasValidConsent(): boolean {
    const consentGiven = localStorage.getItem('consent_given')
    const privacyVersion = localStorage.getItem('privacy_version')
    const agreementVersion = localStorage.getItem('agreement_version')

    // Проверяем актуальность версий
    const isPrivacyValid = privacyVersion === '1.0'
    const isAgreementValid = agreementVersion === '1.0'

    return consentGiven === 'true' && isPrivacyValid && isAgreementValid
  }

  static getConsentInfo() {
    return {
      given: localStorage.getItem('consent_given') === 'true',
      date: localStorage.getItem('consent_date'),
      privacyVersion: localStorage.getItem('privacy_version'),
      agreementVersion: localStorage.getItem('agreement_version'),
    }
  }

  static revokeConsent() {
    localStorage.removeItem('consent_given')
    localStorage.removeItem('consent_date')
    localStorage.removeItem('privacy_version')
    localStorage.removeItem('agreement_version')
  }
}
