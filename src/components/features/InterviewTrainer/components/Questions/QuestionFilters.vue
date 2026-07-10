<script setup lang="ts">
import type { ActiveFilterItem } from './ActiveFiltersList.vue'
import type { Question, QuestionFilters, QuestionStatus } from '@/types/interview.ts'
import { ClearOutlined, FilterOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
import { computed, ref, watch } from 'vue'
import { useInterviewStore } from '@/stores/interview'

import { getDifficultyColor, getDifficultyLabel, getStatusColor, getStatusLabel } from '@/utils/helpers/questionHelpers.ts'
import ActiveFiltersList from './ActiveFiltersList.vue'
import QuestionFiltersGroup from './QuestionFiltersGroup.vue'

const props = defineProps<{ questions: Question[] }>()
const emit = defineEmits<{ (e: 'filterChange', filters: QuestionFilters): void }>()

const interviewStore = useInterviewStore()

function loadFiltersFromStorage(): QuestionFilters {
  const filters = interviewStore.getCurrentFilters()
  return {
    ...filters,
    statuses: filters.statuses.filter((status): status is QuestionStatus => ['known', 'repeat', 'hard'].includes(status)),
  }
}

const filterState = ref<QuestionFilters>(loadFiltersFromStorage())
const activeCollapseKeys = ref<string[]>([])

const availableFilters = computed(() => {
  const difficulties = new Set<string>()
  const categories = new Set<string>()
  const tags = new Set<string>()
  const statuses = new Set<QuestionStatus>()

  props.questions.forEach((q) => {
    difficulties.add(q.difficulty)
    categories.add(q.category)
    q.tags?.forEach(tag => tags.add(tag))
    if (q.status)
      statuses.add(q.status)
  })

  return {
    difficulties: Array.from(difficulties).sort(),
    categories: Array.from(categories).sort(),
    tags: Array.from(tags).sort(),
    statuses: Array.from(statuses),
  }
})

const hasAnyFilters = computed(() => {
  return availableFilters.value.difficulties.length > 0 || availableFilters.value.categories.length > 0
    || availableFilters.value.tags.length > 0 || availableFilters.value.statuses.length > 0
})

const hasQuestions = computed(() => props.questions.length > 0)

const activeFilterItems = computed<ActiveFilterItem[]>(() => {
  const items: ActiveFilterItem[] = []
  filterState.value.statuses.forEach(s => items.push({ id: `s-${s}`, label: 'Статус', value: s, color: getStatusColor(s) }))
  filterState.value.difficulties.forEach(d => items.push({ id: `d-${d}`, label: 'Сложность', value: d, color: getDifficultyColor(d) }))
  filterState.value.categories.forEach(c => items.push({ id: `c-${c}`, label: 'Категория', value: c, color: 'var(--ant-color-primary)' }))
  filterState.value.tags.forEach(t => items.push({ id: `t-${t}`, label: 'Тег', value: t, color: 'var(--ant-color-purple)' }))
  return items
})

function handleFilterChange() {
  interviewStore.setQuestionFilters(filterState.value)
  emit('filterChange', { ...filterState.value })
}

function clearFilters() {
  filterState.value = { statuses: [], difficulties: [], categories: [], tags: [] }
  interviewStore.resetQuestionFilters()
  emit('filterChange', { ...filterState.value })
}

function removeFilter(value: string | number) {
  filterState.value.statuses = filterState.value.statuses.filter(s => s !== value)
  filterState.value.difficulties = filterState.value.difficulties.filter(d => d !== value)
  filterState.value.categories = filterState.value.categories.filter(c => c !== value)
  filterState.value.tags = filterState.value.tags.filter(t => t !== value)
  handleFilterChange()
}

watch(() => props.questions, () => {
  if (props.questions.length > 0)
    handleFilterChange()
}, { immediate: true })
</script>

<template>
  <div class="question-filters">
    <a-collapse v-model:active-key="activeCollapseKeys" :bordered="false" class="filters-panel">
      <a-collapse-panel key="1">
        <template #header>
          <div class="filters-header">
            <FilterOutlined class="filters-icon" />
            <span class="filters-title">Фильтры</span>
            <a-badge v-if="activeFilterItems.length" :count="activeFilterItems.length" />
            <a-button v-if="activeFilterItems.length" type="link" size="small" class="clear-filters-btn" @click.stop="clearFilters">
              <ClearOutlined /> Очистить
            </a-button>
          </div>
        </template>

        <div v-if="!hasQuestions" class="empty-state">
          <InfoCircleOutlined /> <div><h4>Нет вопросов</h4><p>Добавьте вопросы</p></div>
        </div>
        <div v-else-if="!hasAnyFilters" class="empty-state">
          <InfoCircleOutlined /> <div><h4>Нет доступных фильтров</h4></div>
        </div>

        <div v-else class="filters-container">
          <div class="filters-grid">
            <QuestionFiltersGroup v-if="availableFilters.statuses.length" title="Статус">
              <div class="scrollable-container">
                <a-checkbox-group v-model:value="filterState.statuses" @change="handleFilterChange">
                  <a-checkbox v-for="s in availableFilters.statuses" :key="s" :value="s" :style="{ color: getStatusColor(s) }">
                    {{ getStatusLabel(s) }}
                  </a-checkbox>
                </a-checkbox-group>
              </div>
            </QuestionFiltersGroup>

            <QuestionFiltersGroup v-if="availableFilters.difficulties.length" title="Сложность">
              <div class="scrollable-container">
                <a-checkbox-group v-model:value="filterState.difficulties" @change="handleFilterChange">
                  <a-checkbox v-for="d in availableFilters.difficulties" :key="d" :value="d" :style="{ color: getDifficultyColor(d) }">
                    {{ getDifficultyLabel(d) }}
                  </a-checkbox>
                </a-checkbox-group>
              </div>
            </QuestionFiltersGroup>

            <QuestionFiltersGroup v-if="availableFilters.categories.length" title="Категории">
              <div class="scrollable-container">
                <a-checkbox-group v-model:value="filterState.categories" @change="handleFilterChange">
                  <a-checkbox v-for="c in availableFilters.categories" :key="c" :value="c">
                    {{ interviewStore.getCategoryName(c) }}
                  </a-checkbox>
                </a-checkbox-group>
              </div>
            </QuestionFiltersGroup>

            <QuestionFiltersGroup v-if="availableFilters.tags.length" title="Теги">
              <a-select
                v-model:value="filterState.tags"
                mode="multiple"
                style="width: 100%; min-width: 100%;"
                placeholder="Выберите теги..."
                :max-tag-count="2"
                allow-clear
                @change="handleFilterChange"
              >
                <a-select-option v-for="t in availableFilters.tags" :key="t" :value="t">
                  {{ t }}
                </a-select-option>
              </a-select>
            </QuestionFiltersGroup>
          </div>
        </div>
      </a-collapse-panel>
    </a-collapse>

    <div v-if="activeFilterItems.length" class="active-filters">
      <div class="active-filters-header">
        <span>Активные фильтры:</span>
        <a-button type="link" size="small" @click="clearFilters">
          Очистить все
        </a-button>
      </div>
      <div class="active-filters-grid">
        <ActiveFiltersList :items="activeFilterItems" @remove="removeFilter" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.filters-panel {
  background: var(--ant-color-fill-quaternary);

  border-radius: 8px;

  border: 1px solid var(--ant-color-border-secondary);

  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.filters-panel:hover {
  border-color: var(--ant-color-border);
}

:deep(.ant-collapse-header) {
  background: transparent !important;
}
.filters-header { display: flex; align-items: center; gap: 8px; }

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  align-items: start;
}

.scrollable-container {
  max-height: 180px;
  overflow-y: auto;
  padding-right: 8px;
  width: 100%;
}

:deep(.ant-checkbox-group) {
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
  align-items: flex-start !important;
  width: 100%;
}

:deep(.ant-checkbox-wrapper) {
  margin: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  width: 100%;
}

:deep(.ant-checkbox) {
  top: 0 !important;
}

:deep(.ant-select-selector) {
  border-radius: 8px !important;
  width: 100% !important;
}

.active-filters { margin-top: 16px; padding: 16px; background: var(--ant-color-fill-quaternary); border-radius: 8px; }
.active-filters-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.active-filters-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
</style>
