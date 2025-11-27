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

function removeStatusFilter(status: string) {
  filterState.value.statuses = filterState.value.statuses.filter(s => s !== status)
  handleFilterChange()
}

function removeDifficultyFilter(difficulty: string) {
  filterState.value.difficulties = filterState.value.difficulties.filter(d => d !== difficulty)
  handleFilterChange()
}

function removeCategoryFilter(category: string) {
  filterState.value.categories = filterState.value.categories.filter(c => c !== category)
  handleFilterChange()
}

function removeTagFilter(tag: string) {
  filterState.value.tags = filterState.value.tags.filter(t => t !== tag)
  handleFilterChange()
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
            <div class="filters-header-content">
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
            </div>
            <a-button
              v-if="hasActiveFilters"
              type="link"
              size="small"
              class="clear-filters-btn"
              @click.stop="clearFilters"
            >
              <ClearOutlined />
              <span class="clear-text">Очистить</span>
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
        <div v-else class="filters-container">
          <div class="filters-grid">
            <!-- Фильтр по статусам -->
            <div v-if="availableFilters.statuses.length !== 0" class="filter-group">
              <h4>Статус</h4>
              <a-checkbox-group
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
                  <span class="filter-text">
                    {{ getStatusLabel(status) }}
                  </span>
                </a-checkbox>
              </a-checkbox-group>
            </div>

            <!-- Фильтр по сложности -->
            <div v-if="availableFilters.difficulties.length !== 0" class="filter-group">
              <h4>Сложность</h4>
              <a-checkbox-group
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
                  <span class="filter-text" :class="`difficulty-${difficulty}`">
                    {{ getDifficultyLabel(difficulty) }}
                  </span>
                </a-checkbox>
              </a-checkbox-group>
            </div>

            <!-- Фильтр по категориям -->
            <div v-if="availableFilters.categories.length !== 0" class="filter-group">
              <h4>Категории</h4>
              <div class="categories-container">
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
                    <span class="filter-text category-text">
                      {{ interviewStore.getCategoryName(category) }}
                    </span>
                  </a-checkbox>
                </a-checkbox-group>
              </div>
            </div>

            <!-- Фильтр по тегам -->
            <div v-if="availableFilters.tags.length !== 0" class="filter-group">
              <h4>Теги</h4>
              <a-select
                v-model:value="filterState.tags"
                mode="multiple"
                placeholder="Выберите теги"
                size="small"
                class="tags-select"
                :max-tag-count="1"
                :max-tag-text-length="10"
                @change="handleFilterChange"
              >
                <a-select-option
                  v-for="tag in availableFilters.tags"
                  :key="tag"
                  :value="tag"
                >
                  <span class="filter-text tag-option-text">
                    {{ tag }}
                  </span>
                </a-select-option>
              </a-select>
            </div>
          </div>
        </div>
      </a-collapse-panel>
    </a-collapse>

    <!-- Активные фильтры -->
    <div v-if="hasActiveFilters" class="active-filters">
      <div class="active-filters-header">
        <span class="active-filters-title">Активные фильтры:</span>
        <a-button
          type="link"
          size="small"
          class="clear-all-filters-btn"
          @click="clearFilters"
        >
          Очистить все
        </a-button>
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
          <ClearOutlined class="filter-remove" @click="removeStatusFilter(status)" />
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
          <ClearOutlined class="filter-remove" @click="removeDifficultyFilter(difficulty)" />
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
          <ClearOutlined class="filter-remove" @click="removeCategoryFilter(category)" />
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
          <ClearOutlined class="filter-remove" @click="removeTagFilter(tag)" />
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
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.filters-header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.filters-icon {
  color: #1890ff;
  font-size: 14px;
  flex-shrink: 0;
}

.filters-title {
  font-weight: 500;
  white-space: nowrap;
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
  flex-shrink: 0;
}

.clear-text {
  white-space: nowrap;
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

.filters-container {
  padding: 8px 0;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
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
  width: 100%;
}

.filter-option :deep(.ant-checkbox-wrapper) {
  align-items: flex-start;
  width: 100%;
}

.filter-option :deep(.ant-checkbox) {
  margin-top: 2px;
  flex-shrink: 0;
}

.filter-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
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

:deep(.difficulty-junior) {
  color: #52c41a !important;
  font-weight: 500;
}

:deep(.difficulty-middle) {
  color: #fa8c16 !important;
  font-weight: 500;
}

:deep(.difficulty-senior) {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.active-filters-title {
  font-weight: 500;
  color: #595959;
  white-space: nowrap;
}

.clear-all-filters-btn {
  color: #1890ff;
  height: auto;
  padding: 0;
  font-size: 12px;
  white-space: nowrap;
}

.active-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.active-filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  border-left-width: 3px;
  font-size: 12px;
  transition: all 0.2s ease;
  min-width: 0;
}

.active-filter-item:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-label {
  color: #8c8c8c;
  font-weight: 400;
  flex-shrink: 0;
  white-space: nowrap;
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
  padding: 2px;
}

.filter-remove:hover {
  color: #ff4d4f;
  background: #fff2f0;
  border-radius: 50%;
}

.active-filter-item.difficulty-junior {
  border-left-color: #52c41a;
}

.active-filter-item.difficulty-middle {
  border-left-color: #fa8c16;
}

.active-filter-item.difficulty-senior {
  border-left-color: #ff4d4f;
}

.active-filter-item.category {
  border-left-color: #1890ff;
}

.active-filter-item.tag {
  border-left-color: #722ed1;
}

.active-filter-item.status-known {
  border-left-color: #52c41a;
}

.active-filter-item.status-repeat {
  border-left-color: #fa8c16;
}

.active-filter-item.status-hard {
  border-left-color: #ff4d4f;
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
  max-width: 120px !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.ant-select-selection-item-content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1024px) {
  .filters-grid {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .active-filters-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .filters-header {
    flex-wrap: wrap;
  }

  .filters-header-content {
    flex: 1 1 auto;
  }

  .clear-filters-btn {
    flex-shrink: 0;
  }

  .filters-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .filters-container {
    padding: 4px 0;
  }

  .active-filters {
    padding: 12px;
  }

  .active-filters-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .active-filters-grid {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .active-filter-item {
    justify-content: space-between;
    max-width: 100%;
    padding: 10px 12px;
  }

  .empty-state {
    flex-direction: column;
    text-align: center;
    gap: 8px;
    padding: 16px;
  }

  .categories-container {
    max-height: 150px;
  }

  :deep(.ant-collapse-content-box) {
    padding: 5px 12px !important;
  }

  :deep(.ant-collapse-header) {
    padding: 10px 12px !important;
  }
}

@media (max-width: 480px) {
  .question-filters {
    margin-bottom: 16px;
  }

  .filters-panel {
    margin-bottom: 8px;
  }

  .filters-header {
    gap: 6px;
  }

  .filters-title {
    font-size: 13px;
  }

  .clear-text {
    font-size: 12px;
  }

  .filter-group h4 {
    font-size: 13px;
    margin-bottom: 8px;
  }

  .active-filters {
    padding: 10px;
  }

  .active-filters-title {
    font-size: 13px;
  }

  .active-filter-item {
    padding: 8px 10px;
    font-size: 11px;
  }

  .filter-value {
    max-width: 100px;
  }

  :deep(.ant-select) {
    font-size: 12px;
  }

  :deep(.ant-checkbox-wrapper) {
    font-size: 12px;
  }
}

@media (max-width: 360px) {
  .filters-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .clear-filters-btn {
    align-self: flex-end;
    margin-top: -8px;
  }

  .filter-value {
    max-width: 80px;
  }

  .active-filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
