import type { Category } from '@/types/interview'
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

export const CategoryService = {
  async getCategories(): Promise<Category[]> {
    try {
      const authStore = useAuthStore()
      const userId = authStore.user?.uid

      // Получаем системные категории
      const systemCategories = this.getSystemCategories()

      // Если пользователь не авторизован, возвращаем только системные
      if (!userId) {
        return systemCategories
      }

      // Получаем пользовательские категории
      const userCategoriesQuery = query(
        collection(db, 'categories'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
      )

      const querySnapshot = await getDocs(userCategoriesQuery)
      const userCategories = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name,
          icon: data.icon,
          color: data.color,
          isCustom: true,
          userId: data.userId,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Category
      })

      // Объединяем системные и пользовательские категории
      return [...systemCategories, ...userCategories]
    }
    catch (error) {
      console.error('Error getting categories:', error)
      // В случае ошибки возвращаем только системные категории
      return this.getSystemCategories()
    }
  },

  async createCategory(categoryData: { name: string, icon?: string, color?: string }): Promise<string> {
    try {
      const authStore = useAuthStore()
      const userId = authStore.user?.uid

      if (!userId) {
        throw new Error('User not authenticated')
      }

      const category = {
        name: categoryData.name,
        icon: categoryData.icon || '📁',
        color: categoryData.color || '#1890ff',
        isCustom: true,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      const docRef = await addDoc(collection(db, 'categories'), category)
      return docRef.id
    }
    catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    try {
      const authStore = useAuthStore()
      const userId = authStore.user?.uid

      if (!userId) {
        throw new Error('User not authenticated')
      }

      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      }

      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined),
      )

      await updateDoc(doc(db, 'categories', id), cleanUpdateData)
    }
    catch (error) {
      console.error('Error updating category:', error)
      throw error
    }
  },

  async deleteCategory(id: string): Promise<void> {
    try {
      const authStore = useAuthStore()
      const userId = authStore.user?.uid

      if (!userId) {
        throw new Error('User not authenticated')
      }

      await deleteDoc(doc(db, 'categories', id))
    }
    catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  },

  // Системные категории по умолчанию
  getSystemCategories(): Category[] {
    const systemCategories = [
      {
        id: 'javascript',
        name: 'JavaScript',
        icon: '🔵',
        color: '#f7df1e',
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'vue',
        name: 'Vue.js',
        icon: '🟢',
        color: '#42b883',
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'react',
        name: 'React',
        icon: '⚛️',
        color: '#61dafb',
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'html-css',
        name: 'HTML/CSS',
        icon: '🎨',
        color: '#e34c26',
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'algorithms',
        name: 'Алгоритмы',
        icon: '🧠',
        color: '#9c27b0',
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'database',
        name: 'Базы данных',
        icon: '💾',
        color: '#336791',
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'system-design',
        name: 'System Design',
        icon: '🏗️',
        color: '#ff6b35',
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'soft-skills',
        name: 'Soft Skills',
        icon: '🤝',
        color: '#4caf50',
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'typescript',
        name: 'TypeScript',
        icon: '🔷',
        color: '#3178c6',
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'nodejs',
        name: 'Node.js',
        icon: '📦',
        color: '#339933',
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    return systemCategories
  },
}
