<script setup lang="ts">
import type { Question } from '@/types/interview'
import { watch } from 'vue'
import { useQuestionSearch } from '@/composables/useQuestionSearch'

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
  clearSearch,
  hasActiveSearch,
} = useQuestionSearch(props.questions)

watch(searchResults, (results) => {
  emit('searchChange', results)
})

function handleSearch() {
  emit('searchChange', searchResults.value)
}
</script>

<template>
  <div class="search-input">
    <a-input-search
      v-model:value="searchQuery"
      placeholder="Поиск по вопросам, категориям, тегам и ответам..."
      size="large"
      class="search-input__field"
      @search="handleSearch"
    />

    <div v-if="hasActiveSearch" class="search-input__results">
      <a-tag color="blue" closable @close="clearSearch">
        Найдено: {{ searchResults.length }} вопросов
      </a-tag>
    </div>
  </div>
</template>

<style scoped>
.search-input {
  margin-bottom: 16px;
}

.search-input__field {
  width: 100%;
}

.search-input__results {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .search-input__field :deep(.ant-input-group-wrapper) {
    display: flex;
  }

  .search-input__field :deep(.ant-input) {
    flex: 1;
  }
}
</style>
