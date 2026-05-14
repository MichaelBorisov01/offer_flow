import type { InterviewSession } from '@/types/history'
import { addDoc, collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from './firebase'

const COLLECTION_NAME = 'interview_sessions'

export const HistoryService = {
  /**
   * Сохранение завершенной сессии интервью в базу
   */
  async saveSession(sessionData: Omit<InterviewSession, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), sessionData)
      return docRef.id
    }
    catch (error) {
      console.error('Ошибка при сохранении сессии:', error)
      throw new Error('Не удалось сохранить результаты интервью')
    }
  },

  /**
   * Получение истории всех сессий конкретного пользователя
   */
  async getUserHistory(userId: string): Promise<InterviewSession[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('date', 'desc'), // Сортируем от новых к старым
      )

      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as InterviewSession))
    }
    catch (error) {
      console.error('Ошибка при получении истории:', error)
      throw new Error('Не удалось загрузить историю сессий')
    }
  },
}
