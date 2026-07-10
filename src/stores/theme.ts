import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // Проверяем сохраненную тему или системные настройки ОС пользователя
  const getInitialTheme = () => {
    const saved = localStorage.getItem('app-theme')
    if (saved)
      return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  const isDark = ref(getInitialTheme())

  function toggleTheme() {
    isDark.value = !isDark.value
  }

  // Следим за изменениями, сохраняем в стор и вешаем класс на html для кастомных CSS
  watch(isDark, (val) => {
    localStorage.setItem('app-theme', val ? 'dark' : 'light')
    if (val) {
      document.documentElement.classList.add('dark-theme')
    }
    else {
      document.documentElement.classList.remove('dark-theme')
    }
  }, { immediate: true })

  return { isDark, toggleTheme }
})
