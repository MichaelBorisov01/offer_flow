<script setup lang="ts">
import type { Question } from '@/types/interview'
import { SearchOutlined } from '@ant-design/icons-vue'
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
    <a-input
      v-model:value="searchQuery"
      placeholder="Поиск по вопросам"
      allow-clear
      @search="handleSearch"
    >
      <template #suffix>
        <SearchOutlined />
      </template>
    </a-input>
  </div>
</template>

<style scoped>
.search-input {
  margin-bottom: 16px;
}

.search-input__results {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
