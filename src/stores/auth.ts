import type { User } from 'firebase/auth'
import type { Question } from '@/types/interview'
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, query, setDoc, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { auth, db } from '@/services/firebase'
import { ConsentManager } from '@/utils/consentManager'

interface UserProfile {
  displayName?: string
  tokens?: number
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

async function createSampleQuestions(userId: string): Promise<void> {
  const sampleQuestions: Omit<Question, 'id'>[] = [
    {
      text: 'Что такое замыкание (closure) в JavaScript и как оно работает?',
      category: 'JavaScript',
      difficulty: 'junior',
      tags: ['javascript', 'fundamentals', 'closure'],
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      text: 'В чем разница между let, const и var в JavaScript?',
      category: 'JavaScript',
      difficulty: 'middle',
      tags: ['javascript', 'variables', 'es6'],
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      text: 'Как работает event loop в JavaScript?',
      category: 'JavaScript',
      difficulty: 'senior',
      tags: ['javascript', 'event-loop', 'async'],
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  try {
    const questionsCollection = collection(db, 'questions')
    const createPromises = sampleQuestions.map(question =>
      addDoc(questionsCollection, question),
    )

    await Promise.all(createPromises)
  }
  catch (error) {
    console.error('❌ Error creating sample questions:', error)
  }
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
          const data = docSnap.data() as UserProfile

          // Если токенов нет (старый аккаунт), выдаем 3 штуки и сохраняем в БД
          if (data.tokens === undefined) {
            await setDoc(docRef, { tokens: 3, updatedAt: new Date() }, { merge: true })
            data.tokens = 3
          }

          this.userProfile = data
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

        const consentData = ConsentManager.getConsentDataForFirebase()

        // Даем 3 токена при регистрации нового профиля
        await setDoc(doc(db, 'users', user.uid), {
          ...userData,
          tokens: 3,
          consent: consentData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        if (userData.displayName) {
          await updateProfile(user, {
            displayName: userData.displayName,
          })
        }

        await createSampleQuestions(user.uid)

        await this.loadUserProfile(user.uid)
        return true
      }
      catch (error: any) {
        const errorMessage = getFirebaseErrorMessage(error.code) || error.message
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

    // Списание одного токена
    async decrementToken(): Promise<boolean> {
      // Если это админ — просто разрешаем операцию без списания
      if (this.isAdmin) {
        return true
      }

      if (!this.user || !this.userProfile || (this.userProfile.tokens || 0) <= 0) {
        return false
      }

      try {
        const docRef = doc(db, 'users', this.user.uid)

        await setDoc(docRef, {
          tokens: increment(-1),
          updatedAt: new Date(),
        }, { merge: true })

        this.userProfile.tokens = (this.userProfile.tokens || 0) - 1
        return true
      }
      catch (error) {
        console.error('Ошибка списания токена:', error)
        return false
      }
    },

    hasValidConsent(): boolean {
      return ConsentManager.hasValidConsent()
    },

    clearError() {
      this.error = null
    },

    async updatePassword(currentPassword: string, newPassword: string): Promise<boolean> {
      if (!this.user) {
        throw new Error('Пользователь не авторизован')
      }

      this.isLoading = true
      this.error = null

      try {
        const credential = EmailAuthProvider.credential(this.user.email!, currentPassword)
        await reauthenticateWithCredential(this.user, credential)

        await updatePassword(this.user, newPassword)

        return true
      }
      catch (error: any) {
        const errorMessage = getFirebaseErrorMessage(error.code)
        this.error = errorMessage
        console.error('Update password error:', error)
        throw new Error(errorMessage)
      }
      finally {
        this.isLoading = false
      }
    },

    async deleteAccount(password: string): Promise<boolean> {
      if (!this.user) {
        throw new Error('Пользователь не авторизован')
      }

      this.isLoading = true
      this.error = null

      try {
        const credential = EmailAuthProvider.credential(this.user.email!, password)
        await reauthenticateWithCredential(this.user, credential)

        await this.deleteAllUserData(this.user.uid)
        await deleteUser(this.user)

        this.user = null
        this.userProfile = null
        ConsentManager.revokeConsent()

        return true
      }
      catch (error: any) {
        const errorMessage = getFirebaseErrorMessage(error.code)
        this.error = errorMessage
        console.error('Delete account error:', error)
        throw new Error(errorMessage)
      }
      finally {
        this.isLoading = false
      }
    },

    async deleteAllUserData(userId: string): Promise<void> {
      try {
        await deleteDoc(doc(db, 'users', userId))

        const questionsQuery = query(
          collection(db, 'questions'),
          where('userId', '==', userId),
        )
        const questionsSnapshot = await getDocs(questionsQuery)

        const deleteQuestionsPromises = questionsSnapshot.docs.map(doc =>
          deleteDoc(doc.ref),
        )
        await Promise.all(deleteQuestionsPromises)
      }
      catch (error) {
        console.error('Error deleting user data:', error)
      }
    },
  },

  getters: {
    isAuthenticated: state => !!state.user,
    userDisplayName: state =>
      state.userProfile?.displayName || state.user?.email?.split('@')[0] || 'User',
    // Геттер для получения текущего баланса
    userTokens: state => state.userProfile?.tokens || 0,
    isAdmin: state => state.user?.email === 'bori.mix@yandex.ru',
    consentGiven: () => ConsentManager.hasValidConsent(),
  },
})
