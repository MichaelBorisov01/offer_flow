<script setup lang="ts">
import type { Question } from '@/types/interview.ts'
import { SearchOutlined } from '@ant-design/icons-vue'
import { computed, watch } from 'vue'
import { useQuestionSearch } from '@/composables/useQuestionSearch.ts'

interface Props {
  questions: Question[]
}

interface Emits {
  (e: 'searchChange', results: Question[]): void
  (e: 'searchClear'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const {
  searchQuery,
  searchResults,
} = useQuestionSearch(props.questions)

// Вычисляем, активен ли поиск сейчас
const isSearching = computed(() => searchQuery.value.length > 0)

watch(searchResults, (results) => {
  emit('searchChange', results)
})

function handleSearch() {
  emit('searchChange', searchResults.value)
}
</script>

<template>
  <div class="search-container" :class="{ 'is-active': isSearching }">
    <a-input
      v-model:value="searchQuery"
      placeholder="Начните вводить текст вопроса..."
      allow-clear
      size="large"
      class="custom-search-input"
      @change="handleSearch"
    >
      <template #prefix>
        <SearchOutlined class="search-icon" />
      </template>

      <template v-if="isSearching" #suffix>
        <span class="results-badge">
          {{ searchResults.length }}
        </span>
      </template>
    </a-input>

    <div v-if="isSearching" class="search-hint">
      Найдено вопросов: <strong>{{ searchResults.length }}</strong>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  margin-bottom: 24px;
  width: 100%;
  transition: all 0.3s ease;
}

/* Стилизация самого инпута Ant Design */
.custom-search-input {
  border-radius: 12px !important;
  border: 1px solid var(--ant-color-border-secondary) !important;
  background: var(--ant-color-bg-container) !important;
  padding: 8px 16px !important;
  height: 48px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-search-input:hover {
  border-color: var(--ant-color-primary) !important;
}

.custom-search-input:focus-within {
  border-color: var(--ant-color-primary) !important;
  box-shadow: 0 0 0 2px var(--ant-color-primary-bg) !important;
  background: var(--ant-color-bg-elevated) !important;
}

/* Иконка поиска */
.search-icon {
  color: var(--ant-color-text-description);
  font-size: 18px;
  margin-right: 8px;
  transition: color 0.3s ease;
}

.custom-search-input:focus-within .search-icon {
  color: var(--ant-color-primary);
}

/* Бейдж с количеством результатов внутри инпута */
.results-badge {
  background: var(--ant-color-fill-secondary);
  color: var(--ant-color-text-secondary);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
}

/* Подсказка под инпутом */
.search-hint {
  margin-top: 8px;
  margin-left: 4px;
  font-size: 13px;
  color: var(--ant-color-text-description);
  animation: fadeIn 0.3s ease-out;
}

.search-hint strong {
  color: var(--ant-color-primary);
}

/* Анимация появления подсказки */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Настройка цвета текста и плейсхолдера для темной темы */
:deep(.ant-input) {
  background: transparent !important;
  color: var(--ant-color-text) !important;
}

:deep(.ant-input::placeholder) {
  color: var(--ant-color-text-description) !important;
  opacity: 0.8;
}

/* Кнопка очистки (крестик) */
:deep(.ant-input-clear-icon) {
  color: var(--ant-color-text-description) !important;
  font-size: 14px;
}

:deep(.ant-input-clear-icon:hover) {
  color: var(--ant-color-error) !important;
}

/* Мобильная адаптация */
@media (max-width: 480px) {
  .custom-search-input {
    height: 42px;
    padding: 4px 12px !important;
  }
  .search-container {
    margin-bottom: 16px;
  }
}
</style>
