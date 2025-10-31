import { useStorage } from '@vueuse/core'

/**
 * Композабл для работы с localStorage
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  return useStorage(key, defaultValue, localStorage)
}
