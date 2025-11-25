import { useStorage } from '@vueuse/core'

/**
 * Композабл для работы с localStorage
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  return useStorage(key, defaultValue, localStorage)
}

export function useBooleanStorage(key: string, defaultValue: boolean = false) {
  return useLocalStorage(key, defaultValue)
}

export function useStringStorage(key: string, defaultValue: string = '') {
  return useLocalStorage(key, defaultValue)
}
