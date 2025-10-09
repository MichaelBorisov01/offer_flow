import { ref, watch } from 'vue'

/**
 * Композабл для работы с localStorage с поддержкой TypeScript
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  // Функция для получения значения из localStorage
  const getStoredValue = (): T => {
    try {
      if (typeof window === 'undefined')
        return defaultValue

      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    }
    catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return defaultValue
    }
  }

  // Реактивная переменная
  const value = ref<T>(getStoredValue())

  // Функция для установки значения
  const setValue = (newValue: T) => {
    try {
      value.value = newValue
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(newValue))
      }
    }
    catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  // Следим за изменениями и сохраняем в localStorage
  watch(value, (newValue) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(newValue))
      }
    }
    catch (error) {
      console.warn(`Error saving to localStorage key "${key}":`, error)
    }
  }, { deep: true })

  return {
    value,
    setValue,
  }
}
