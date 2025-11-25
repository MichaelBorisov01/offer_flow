import type { User } from 'firebase/auth'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { auth, db } from '@/services/firebase'
import { ConsentManager } from '@/utils/consentManager'

interface UserProfile {
  displayName?: string
  consent?: {
    privacyPolicy: boolean
    userAgreement: boolean
    acceptedAt: string
    privacyVersion: string
    agreementVersion: string
  }
}

interface AuthState {
  user: User | null
  userProfile: UserProfile | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
}

function getFirebaseErrorMessage(errorCode: string): string {
  const errorMessages: { [key: string]: string } = {
    // Ошибки аутентификации
    'auth/invalid-credential': 'Неверный email или пароль',
    'auth/user-not-found': 'Пользователь с таким email не найден',
    'auth/wrong-password': 'Неверный пароль',
    'auth/invalid-email': 'Неверный формат email',
    'auth/email-already-in-use': 'Пользователь с таким email уже существует',
    'auth/weak-password': 'Пароль слишком слабый. Минимум 6 символов',
    'auth/network-request-failed': 'Ошибка сети. Проверьте подключение к интернету',
    'auth/too-many-requests': 'Слишком много попыток входа. Попробуйте позже',
    'auth/user-disabled': 'Аккаунт заблокирован',
    'auth/operation-not-allowed': 'Операция не разрешена',
    'auth/requires-recent-login': 'Требуется повторный вход',

    // Общие ошибки
    'auth/unauthorized-domain': 'Неавторизованный домен',
    'auth/app-not-authorized': 'Приложение не авторизовано',
    'auth/argument-error': 'Ошибка аргументов',
    'auth/invalid-api-key': 'Неверный API ключ',
    'auth/invalid-user-token': 'Неверный токен пользователя',
    'auth/invalid-tenant-id': 'Неверный ID tenant',
    'auth/tenant-id-mismatch': 'Несоответствие ID tenant',
  }

  return errorMessages[errorCode] || 'Произошла неизвестная ошибка. Попробуйте еще раз.'
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    userProfile: null,
    isLoading: false,
    isInitialized: false,
    error: null,
  }),

  actions: {
    async init() {
      if (this.isInitialized)
        return

      this.isLoading = true

      return new Promise<void>((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          this.user = user

          if (user) {
            await this.loadUserProfile(user.uid)
            await this.syncConsentFromFirebase()
          }
          else {
            this.userProfile = null
          }

          this.isLoading = false
          this.isInitialized = true
          resolve()
        })
      })
    },

    async loadUserProfile(userId: string) {
      try {
        const docRef = doc(db, 'users', userId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          this.userProfile = docSnap.data() as UserProfile
        }
      }
      catch (error) {
        console.error('Error loading user profile:', error)
      }
    },

    async syncConsentFromFirebase() {
      if (!this.user || !this.userProfile?.consent) {
        return
      }

      const firebaseConsent = this.userProfile.consent

      if (firebaseConsent.privacyPolicy && firebaseConsent.userAgreement) {
        ConsentManager.acceptConsent()
      }
    },

    async signUp(email: string, password: string, userData: UserProfile): Promise<boolean> {
      this.isLoading = true
      this.error = null

      try {
        if (!ConsentManager.hasValidConsent()) {
          throw new Error('Необходимо принять пользовательское соглашение и политику конфиденциальности')
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        // Получаем данные согласия для сохранения в Firebase
        const consentData = ConsentManager.getConsentDataForFirebase()

        // Сохраняем данные пользователя в Firestore с информацией о согласии
        await setDoc(doc(db, 'users', user.uid), {
          ...userData,
          consent: consentData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        // Обновляем профиль в Firebase Auth
        if (userData.displayName) {
          await updateProfile(user, {
            displayName: userData.displayName,
          })
        }

        await this.loadUserProfile(user.uid)
        return true
      }
      catch (error: any) {
        const errorMessage = error.message || getFirebaseErrorMessage(error.code)
        this.error = errorMessage
        console.error('Sign up error:', error)
        throw new Error(errorMessage)
      }
      finally {
        this.isLoading = false
      }
    },

    async signIn(email: string, password: string): Promise<boolean> {
      this.isLoading = true
      this.error = null

      try {
        await signInWithEmailAndPassword(auth, email, password)

        // После успешного входа синхронизируем согласия из Firebase
        if (this.user) {
          await this.syncConsentFromFirebase()
        }

        return true
      }
      catch (error: any) {
        const errorMessage = getFirebaseErrorMessage(error.code)
        this.error = errorMessage
        console.error('Sign in error:', error)
        throw new Error(errorMessage)
      }
      finally {
        this.isLoading = false
      }
    },

    async signOut(): Promise<boolean> {
      this.isLoading = true
      this.error = null

      try {
        await signOut(auth)
        this.user = null
        this.userProfile = null

        // Не очищаем согласие при выходе, так как оно может пригодиться при следующем входе
        // ConsentManager.revokeConsent() - НЕ вызываем

        return true
      }
      catch (error: any) {
        const errorMessage = getFirebaseErrorMessage(error.code)
        this.error = errorMessage
        console.error('Sign out error:', error)
        throw new Error(errorMessage)
      }
      finally {
        this.isLoading = false
      }
    },

    // Метод для обновления профиля пользователя
    async updateUserProfile(updates: Partial<UserProfile>): Promise<boolean> {
      if (!this.user) {
        throw new Error('Пользователь не авторизован')
      }

      try {
        await setDoc(doc(db, 'users', this.user.uid), {
          ...this.userProfile,
          ...updates,
          updatedAt: new Date(),
        }, { merge: true })

        await this.loadUserProfile(this.user.uid)
        return true
      }
      catch (error: any) {
        console.error('Update profile error:', error)
        throw new Error('Ошибка при обновлении профиля')
      }
    },

    // Метод для проверки согласия
    hasValidConsent(): boolean {
      return ConsentManager.hasValidConsent()
    },

    clearError() {
      this.error = null
    },
  },

  getters: {
    isAuthenticated: state => !!state.user,
    userDisplayName: state =>
      state.userProfile?.displayName || state.user?.email?.split('@')[0] || 'User',

    // Геттер для проверки согласия
    consentGiven: () => ConsentManager.hasValidConsent(),
  },
})
