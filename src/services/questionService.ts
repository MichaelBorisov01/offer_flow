import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'
import { db } from './firebase'

export interface Question {
  id?: string
  text: string
  type: 'text' | 'code' | 'ai'
  category: string
  difficulty: string
  tags?: string[]
  status?: 'known' | 'repeat' | 'hard'
  createdAt?: Date
  updatedAt?: Date
  userId?: string
}

export const QuestionService = {
  async getQuestions(category?: string, difficulty?: string): Promise<Question[]> {
    try {
      const authStore = useAuthStore()
      const userId = authStore.user?.uid

      if (!userId) {
        return []
      }

      let q = query(
        collection(db, 'questions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
      )

      if (category) {
        q = query(q, where('category', '==', category))
      }

      if (difficulty) {
        q = query(q, where('difficulty', '==', difficulty))
      }

      const querySnapshot = await getDocs(q)
      const questions = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          text: data.text,
          type: data.type || 'text',
          category: data.category || 'general',
          difficulty: data.difficulty || 'middle',
          tags: data.tags || [],
          status: data.status || '',
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          userId: data.userId,
        } as Question
      })

      return questions
    }
    catch (error) {
      console.error('Error getting questions:', error)
      throw error
    }
  },

  async addQuestion(question: Omit<Question, 'id'>): Promise<string> {
    try {
      const authStore = useAuthStore()
      const userId = authStore.user?.uid

      if (!userId)
        throw new Error('User not authenticated')

      const questionData = {
        text: question.text,
        type: question.type,
        category: question.category,
        difficulty: question.difficulty,
        tags: question.tags || [],
        status: question.status || '',
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      const docRef = await addDoc(collection(db, 'questions'), questionData)
      return docRef.id
    }
    catch (error) {
      console.error('Error adding question:', error)
      throw error
    }
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<void> {
    try {
      const authStore = useAuthStore()
      const userId = authStore.user?.uid

      if (!userId)
        throw new Error('User not authenticated')

      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      }

      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined),
      )

      await updateDoc(doc(db, 'questions', id), cleanUpdateData)
    }
    catch (error) {
      console.error('Error updating question:', error)
      throw error
    }
  },

  async deleteQuestion(id: string): Promise<void> {
    await deleteDoc(doc(db, 'questions', id))
  },
}
