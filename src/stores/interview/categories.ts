import type { Category } from '@/types/interview'
import { ref } from 'vue'
import { CategoryService } from '@/services/categoryService'
import { getCategoryLabelShort } from '@/utils/helpers/questionHelpers'

export function useInterviewCategories() {
  const categories = ref<Category[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const loadCategories = async () => {
    isLoading.value = true
    error.value = null
    try {
      categories.value = await CategoryService.getCategories()
    }
    catch (err) {
      error.value = 'Не удалось загрузить категории'
      console.error('Error loading categories:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  const createCategory = async (name: string) => {
    isLoading.value = true
    error.value = null
    try {
      await CategoryService.createCategory({ name })
      // Перезагружаем категории после создания
      await loadCategories()
    }
    catch (err) {
      error.value = 'Не удалось создать категорию'
      console.error('Error creating category:', err)
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  const deleteCategory = async (id: string) => {
    isLoading.value = true
    error.value = null
    try {
      await CategoryService.deleteCategory(id)
      // Перезагружаем категории после удаления
      await loadCategories()
    }
    catch (err) {
      error.value = 'Не удалось удалить категорию'
      console.error('Error deleting category:', err)
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  // Получаем название категории по ID
  const getCategoryName = (categoryId: string): string => {
    const category = categories.value.find(cat => cat.id === categoryId)
    return category?.isCustom ? category.name : getCategoryLabelShort(categoryId)
  }

  return {
    // State
    categories,
    isLoading,
    error,

    // Actions
    loadCategories,
    createCategory,
    deleteCategory,

    // Getters
    getCategoryName,
  }
}
