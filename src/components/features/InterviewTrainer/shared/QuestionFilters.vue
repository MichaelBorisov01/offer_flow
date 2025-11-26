<script setup lang="ts">
import type { Question, QuestionFilters, QuestionStatus } from '@/types/interview'
import { ClearOutlined, FilterOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
import { computed, ref, watch } from 'vue'
import { useInterviewStore } from '@/stores/interview'
import { getDifficultyLabel, getStatusColor, getStatusLabel } from '@/utils/helpers/questionHelpers'

interface Props {
  questions: Question[]
}

interface Emits {
  (e: 'filterChange', filters: QuestionFilters): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const interviewStore = useInterviewStore()

// Загружаем фильтры из store
function loadFiltersFromStorage(): QuestionFilters {
  const filters = interviewStore.getCurrentFilters()
  return {
    ...filters,
    statuses: filters.statuses.filter((status): status is QuestionStatus =>
      ['known', 'repeat', 'hard'].includes(status),
    ),
  }
}

// Сохраняем фильтры в store
function saveFiltersToStorage(filters: QuestionFilters) {
  interviewStore.setQuestionFilters(filters)
}

const filterState = ref<QuestionFilters>(loadFiltersFromStorage())
const activeCollapseKeys = ref<string[]>([])

// Получаем все уникальные значения для фильтров
const availableFilters = computed(() => {
  const difficulties = new Set<string>()
  const categories = new Set<string>()
  const tags = new Set<string>()
  const statuses = new Set<QuestionStatus>()

  props.questions.forEach((question) => {
    difficulties.add(question.difficulty)
    categories.add(question.category)
    question.tags?.forEach(tag => tags.add(tag))
    if (question.status) {
      statuses.add(question.status)
    }
  })

  // Кастомная сортировка для определенного порядка
  const difficultyOrder = ['junior', 'middle', 'senior']
  const statusOrder: QuestionStatus[] = ['known', 'repeat', 'hard']

  const sortByOrder = (arr: string[], order: string[]) => {
    return arr.sort((a, b) => {
      const indexA = order.indexOf(a)
      const indexB = order.indexOf(b)
      if (indexA !== -1 && indexB !== -1)
        return indexA - indexB
      if (indexA !== -1)
        return -1
      if (indexB !== -1)
        return 1
      return a.localeCompare(b)
    })
  }

  return {
    difficulties: sortByOrder(Array.from(difficulties), difficultyOrder),
    categories: Array.from(categories).sort((a, b) => a.localeCompare(b)),
    tags: Array.from(tags).sort((a, b) => a.localeCompare(b)),
    statuses: Array.from(statuses).sort((a, b) => {
      const indexA = statusOrder.indexOf(a)
      const indexB = statusOrder.indexOf(b)
      return indexA - indexB
    }),
  }
})

// Проверяем, есть ли вообще какие-либо фильтры
const hasAnyFilters = computed(() => {
  return availableFilters.value.difficulties.length > 0
    || availableFilters.value.categories.length > 0
    || availableFilters.value.tags.length > 0
    || availableFilters.value.statuses.length > 0
})

// Проверяем, есть ли вопросы для фильтрации
const hasQuestions = computed(() => props.questions.length > 0)

// Обработчик изменения фильтров
function handleFilterChange() {
  saveFiltersToStorage(filterState.value)
  emit('filterChange', { ...filterState.value })
}

// Очистка фильтров
function clearFilters() {
  filterState.value = {
    statuses: [],
    difficulties: [],
    categories: [],
    tags: [],
  }
  interviewStore.resetQuestionFilters()
  emit('filterChange', { ...filterState.value })
}

function getActiveFiltersCount() {
  return filterState.value.statuses.length
    + filterState.value.difficulties.length
    + filterState.value.categories.length
    + filterState.value.tags.length
}

const hasActiveFilters = computed(() => getActiveFiltersCount() > 0)

// Автоматически применяем сохраненные фильтры при загрузке
watch(() => props.questions, () => {
  if (props.questions.length > 0) {
    handleFilterChange()
  }
}, { immediate: true })

watch(
  () => interviewStore.getCurrentFilters(),
  (newFilters) => {
    // Синхронизируем локальное состояние с store
    filterState.value = {
      ...newFilters,
      statuses: newFilters.statuses.filter((status): status is QuestionStatus =>
        ['known', 'repeat', 'hard'].includes(status),
      ),
    }
  },
  { deep: true },
)
</script>

<template>
  <div class="question-filters">
    <a-collapse v-model:active-key="activeCollapseKeys" :bordered="false" class="filters-panel">
      <a-collapse-panel key="1">
        <template #header>
          <div class="filters-header">
            <FilterOutlined class="filters-icon" />
            <span class="filters-title">Фильтры</span>
            <a-badge
              v-if="hasActiveFilters"
              :count="getActiveFiltersCount()"
              class="filters-badge"
              :number-style="{
                backgroundColor: '#1890ff',
                boxShadow: '0 0 0 1px #fff',
                fontSize: '11px',
                fontWeight: '500',
                height: '18px',
                minWidth: '18px',
                lineHeight: '18px',
              }"
            />
            <a-button
              v-if="hasActiveFilters"
              type="link"
              size="small"
              class="clear-filters-btn"
              @click.stop="clearFilters"
            >
              <ClearOutlined />
              Очистить
            </a-button>
          </div>
        </template>

        <!-- Сообщение когда нет вопросов -->
        <div v-if="!hasQuestions" class="empty-state">
          <InfoCircleOutlined class="empty-icon" />
          <div class="empty-content">
            <h4>Нет вопросов для фильтрации</h4>
            <p>Добавьте вопросы, чтобы использовать фильтры</p>
          </div>
        </div>

        <!-- Сообщение когда нет доступных фильтров -->
        <div v-else-if="!hasAnyFilters" class="empty-state">
          <InfoCircleOutlined class="empty-icon" />
          <div class="empty-content">
            <h4>Нет доступных фильтров</h4>
            <p>Добавьте вопросы с разными категориями, статусами или тегами</p>
          </div>
        </div>

        <!-- Основные фильтры -->
        <div v-else class="filters-grid">
          <!-- Фильтр по статусам -->
          <div class="filter-group">
            <h4>Статус</h4>
            <div v-if="availableFilters.statuses.length === 0" class="filter-empty">
              <span class="empty-text">Нет вопросов со статусами</span>
            </div>
            <a-checkbox-group
              v-else
              v-model:value="filterState.statuses"
              class="filter-options"
              @change="handleFilterChange"
            >
              <a-checkbox
                v-for="status in availableFilters.statuses"
                :key="status"
                :value="status"
                class="filter-option status-option"
                :style="{ color: getStatusColor(status) }"
              >
                {{ getStatusLabel(status) }}
              </a-checkbox>
            </a-checkbox-group>
          </div>

          <!-- Фильтр по сложности -->
          <div class="filter-group">
            <h4>Сложность</h4>
            <div v-if="availableFilters.difficulties.length === 0" class="filter-empty">
              <span class="empty-text">Нет вопросов с разной сложностью</span>
            </div>
            <a-checkbox-group
              v-else
              v-model:value="filterState.difficulties"
              class="filter-options"
              @change="handleFilterChange"
            >
              <a-checkbox
                v-for="difficulty in availableFilters.difficulties"
                :key="difficulty"
                :value="difficulty"
                class="filter-option"
              >
                <span :class="`difficulty-${difficulty}`">
                  {{ getDifficultyLabel(difficulty) }}
                </span>
              </a-checkbox>
            </a-checkbox-group>
          </div>

          <!-- Фильтр по категориям -->
          <div class="filter-group">
            <h4>Категории</h4>
            <div v-if="availableFilters.categories.length === 0" class="filter-empty">
              <span class="empty-text">Нет вопросов с категориями</span>
            </div>
            <div v-else class="categories-container">
              <a-checkbox-group
                v-model:value="filterState.categories"
                class="filter-options"
                @change="handleFilterChange"
              >
                <a-checkbox
                  v-for="category in availableFilters.categories"
                  :key="category"
                  :value="category"
                  class="filter-option category-option"
                >
                  <span class="category-text">
                    {{ interviewStore.getCategoryName(category) }}
                  </span>
                </a-checkbox>
              </a-checkbox-group>
            </div>
          </div>

          <!-- Фильтр по тегам -->
          <div class="filter-group">
            <h4>Теги</h4>
            <div v-if="availableFilters.tags.length === 0" class="filter-empty">
              <span class="empty-text">Нет вопросов с тегами</span>
            </div>
            <a-select
              v-else
              v-model:value="filterState.tags"
              mode="multiple"
              placeholder="Выберите теги"
              size="small"
              class="tags-select"
              :max-tag-count="2"
              :max-tag-text-length="20"
              style="width: 100%"
              @change="handleFilterChange"
            >
              <a-select-option
                v-for="tag in availableFilters.tags"
                :key="tag"
                :value="tag"
              >
                <span class="tag-option-text">
                  {{ tag }}
                </span>
              </a-select-option>
            </a-select>
          </div>
        </div>
      </a-collapse-panel>
    </a-collapse>

    <!-- Активные фильтры -->
    <div v-if="hasActiveFilters" class="active-filters">
      <div class="active-filters-header">
        <span class="active-filters-title">Активные фильтры:</span>
      </div>
      <div class="active-filters-grid">
        <!-- Статусы -->
        <div
          v-for="status in filterState.statuses"
          :key="`status-${status}`"
          class="active-filter-item"
          :class="`status-${status}`"
          :style="{ borderLeftColor: getStatusColor(status) }"
        >
          <span class="filter-label">Статус</span>
          <span class="filter-value">
            {{ getStatusLabel(status) }}
          </span>
          <ClearOutlined class="filter-remove" @click="filterState.statuses = filterState.statuses.filter(s => s !== status); handleFilterChange()" />
        </div>

        <!-- Сложности -->
        <div
          v-for="difficulty in filterState.difficulties"
          :key="`difficulty-${difficulty}`"
          class="active-filter-item"
          :class="`difficulty-${difficulty}`"
        >
          <span class="filter-label">Сложность</span>
          <span class="filter-value">
            {{ getDifficultyLabel(difficulty) }}
          </span>
          <ClearOutlined class="filter-remove" @click="filterState.difficulties = filterState.difficulties.filter(d => d !== difficulty); handleFilterChange()" />
        </div>

        <!-- Категории -->
        <div
          v-for="category in filterState.categories"
          :key="`category-${category}`"
          class="active-filter-item category"
        >
          <span class="filter-label">Категория</span>
          <span class="filter-value">
            {{ interviewStore.getCategoryName(category) }}
          </span>
          <ClearOutlined class="filter-remove" @click="filterState.categories = filterState.categories.filter(c => c !== category); handleFilterChange()" />
        </div>

        <!-- Теги -->
        <div
          v-for="tag in filterState.tags"
          :key="`tag-${tag}`"
          class="active-filter-item tag"
        >
          <span class="filter-label">Тег</span>
          <span class="filter-value">
            {{ tag }}
          </span>
          <ClearOutlined class="filter-remove" @click="filterState.tags = filterState.tags.filter(t => t !== tag); handleFilterChange()" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.question-filters {
  margin-bottom: 20px;
}

.filters-panel {
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.filters-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filters-icon {
  color: #1890ff;
  font-size: 14px;
}

.filters-title {
  font-weight: 500;
}

.filters-badge :deep(.ant-badge-count) {
  font-size: 11px;
  font-weight: 500;
  height: 18px;
  line-height: 18px;
  min-width: 18px;
  padding: 0 4px;
  box-shadow: 0 0 0 1px #fff;
}

.clear-filters-btn {
  color: #8c8c8c;
  height: auto;
  padding: 0;
  margin-left: auto;
}

/* Стили для пустых состояний */
.empty-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
  margin: 16px 0;
}

.empty-icon {
  font-size: 20px;
  color: #8c8c8c;
  flex-shrink: 0;
}

.empty-content h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.empty-content p {
  margin: 0;
  font-size: 12px;
  color: #8c8c8c;
}

.filter-empty {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
  text-align: center;
}

.empty-text {
  font-size: 12px;
  color: #8c8c8c;
  font-style: italic;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
  padding: 8px 0;
}

.filter-group h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-option {
  margin: 0;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-option :deep(.ant-checkbox-wrapper) {
  align-items: center;
}

.filter-option :deep(.ant-checkbox) {
  margin-right: 8px;
}

.status-option {
  font-weight: 500;
}

.tags-select {
  width: 100%;
}

/* Контейнер для категорий с прокруткой */
.categories-container {
  max-height: 200px;
  overflow-y: auto;
}

.category-option {
  width: 100%;
}

.category-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

.tag-option-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

/* Цвета сложности - используем :deep для доступа к содержимому */
.filter-option :deep(.difficulty-junior) {
  color: #52c41a !important;
  font-weight: 500;
}

.filter-option :deep(.difficulty-middle) {
  color: #fa8c16 !important;
  font-weight: 500;
}

.filter-option :deep(.difficulty-senior) {
  color: #ff4d4f !important;
  font-weight: 500;
}

.active-filters {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #f0f0f0;
}

.active-filters-header {
  margin-bottom: 12px;
}

.active-filters-title {
  font-weight: 500;
  color: #595959;
}

.active-filters-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.active-filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  font-size: 12px;
  transition: all 0.2s ease;
  max-width: 300px;
}

.active-filter-item:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-label {
  color: #8c8c8c;
  font-weight: 400;
  flex-shrink: 0;
}

.filter-value {
  color: #262626;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.filter-remove {
  color: #bfbfbf;
  cursor: pointer;
  flex-shrink: 0;
}

.filter-remove:hover {
  color: #ff4d4f;
}

/* Цветовые акценты для разных типов фильтров */
.active-filter-item.difficulty-junior {
  border-left: 3px solid #52c41a;
}

.active-filter-item.difficulty-middle {
  border-left: 3px solid #fa8c16;
}

.active-filter-item.difficulty-senior {
  border-left: 3px solid #ff4d4f;
}

.active-filter-item.category {
  border-left: 3px solid #1890ff;
}

.active-filter-item.tag {
  border-left: 3px solid #722ed1;
}

.active-filter-item.status-known {
  border-left: 3px solid #52c41a;
}

.active-filter-item.status-repeat {
  border-left: 3px solid #fa8c16;
}

.active-filter-item.status-hard {
  border-left: 3px solid #ff4d4f;
}

:deep(.ant-collapse-content-box) {
  padding: 5px 20px !important;
}

:deep(.ant-collapse-header) {
  padding: 12px 16px !important;
  cursor: pointer !important;
}

/* Стили для выбранных тегов в select */
:deep(.ant-select-selection-item) {
  max-width: 150px !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.ant-select-selection-item-content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .active-filter-item {
    justify-content: space-between;
    max-width: 100%;
  }

  .empty-state {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .categories-container {
    max-height: 150px;
  }

  .active-filter-item {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .filter-value {
    max-width: 120px;
  }
}
</style>
