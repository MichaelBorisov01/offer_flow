<script setup lang="ts">
import type { Question } from '@/types/interview'
import { ClearOutlined, FilterOutlined } from '@ant-design/icons-vue'
import { computed, ref } from 'vue'

interface Props {
  questions: Question[]
}

interface Emits {
  (e: 'filterChange', filters: FilterState): void
}

interface FilterState {
  difficulties: string[]
  categories: string[]
  tags: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const filterState = ref<FilterState>({
  difficulties: [],
  categories: [],
  tags: [],
})

const activeCollapseKeys = ref<string[]>(['1'])

// Получаем все уникальные значения для фильтров
const availableFilters = computed(() => {
  const difficulties = new Set<string>()
  const categories = new Set<string>()
  const tags = new Set<string>()

  props.questions.forEach((question) => {
    difficulties.add(question.difficulty)
    categories.add(question.category)
    question.tags?.forEach(tag => tags.add(tag))
  })

  return {
    difficulties: Array.from(difficulties),
    categories: Array.from(categories),
    tags: Array.from(tags),
  }
})

function getDifficultyLabel(difficulty: string) {
  const labels: Record<string, string> = {
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
  }
  return labels[difficulty] || difficulty
}

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    'javascript': 'JavaScript',
    'vue': 'Vue.js',
    'react': 'React',
    'typescript': 'TypeScript',
    'html-css': 'HTML/CSS',
    'algorithms': 'Алгоритмы',
    'database': 'Базы данных',
    'system-design': 'System Design',
    'soft-skills': 'Soft Skills',
    'nodejs': 'Node.js',
  }
  return labels[category] || category
}

function handleFilterChange() {
  emit('filterChange', { ...filterState.value })
}

function clearFilters() {
  filterState.value = {
    difficulties: [],
    categories: [],
    tags: [],
  }
  emit('filterChange', { ...filterState.value })
}

function getActiveFiltersCount() {
  return filterState.value.difficulties.length
    + filterState.value.categories.length
    + filterState.value.tags.length
}

const hasActiveFilters = computed(() => getActiveFiltersCount() > 0)
</script>

<template>
  <div class="question-filters">
    <!-- Панель фильтров -->
    <a-collapse v-model:active-key="activeCollapseKeys" :bordered="false" class="filters-panel">
      <a-collapse-panel key="1">
        <template #header>
          <div class="filters-header">
            <FilterOutlined class="filters-icon" />
            <span class="filters-title">Фильтры вопросов</span>
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

        <div class="filters-grid">
          <!-- Фильтр по сложности -->
          <div class="filter-group">
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
                <span :class="`difficulty-${difficulty}`">
                  {{ getDifficultyLabel(difficulty) }}
                </span>
              </a-checkbox>
            </a-checkbox-group>
          </div>

          <!-- Фильтр по категориям -->
          <div class="filter-group">
            <h4>Категории</h4>
            <a-checkbox-group
              v-model:value="filterState.categories"
              class="filter-options"
              @change="handleFilterChange"
            >
              <a-checkbox
                v-for="category in availableFilters.categories"
                :key="category"
                :value="category"
                class="filter-option"
              >
                {{ getCategoryLabel(category) }}
              </a-checkbox>
            </a-checkbox-group>
          </div>

          <!-- Фильтр по тегам -->
          <div class="filter-group">
            <h4>Теги</h4>
            <a-select
              v-model:value="filterState.tags"
              mode="multiple"
              placeholder="Выберите теги"
              size="small"
              class="tags-select"
              :max-tag-count="2"
              style="width: 100%"
              @change="handleFilterChange"
            >
              <a-select-option
                v-for="tag in availableFilters.tags"
                :key="tag"
                :value="tag"
              >
                {{ tag }}
              </a-select-option>
            </a-select>
          </div>
        </div>
      </a-collapse-panel>
    </a-collapse>

    <!-- Активные фильтры (красивые чипы) -->
    <div v-if="hasActiveFilters" class="active-filters">
      <div class="active-filters-header">
        <span class="active-filters-title">Активные фильтры:</span>
      </div>
      <div class="active-filters-grid">
        <div
          v-for="difficulty in filterState.difficulties"
          :key="`difficulty-${difficulty}`"
          class="active-filter-item"
          :class="`difficulty-${difficulty}`"
        >
          <span class="filter-label">Сложность</span>
          <span class="filter-value">{{ getDifficultyLabel(difficulty) }}</span>
          <ClearOutlined class="filter-remove" @click="filterState.difficulties = filterState.difficulties.filter(d => d !== difficulty); handleFilterChange()" />
        </div>

        <div
          v-for="category in filterState.categories"
          :key="`category-${category}`"
          class="active-filter-item category"
        >
          <span class="filter-label">Категория</span>
          <span class="filter-value">{{ getCategoryLabel(category) }}</span>
          <ClearOutlined class="filter-remove" @click="filterState.categories = filterState.categories.filter(c => c !== category); handleFilterChange()" />
        </div>

        <div
          v-for="tag in filterState.tags"
          :key="`tag-${tag}`"
          class="active-filter-item tag"
        >
          <span class="filter-label">Тег</span>
          <span class="filter-value">{{ tag }}</span>
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
  padding: 4px 0;
}

.filters-icon {
  color: #1890ff;
  font-size: 14px;
}

.filters-title {
  font-weight: 500;
  color: #262626;
  font-size: 14px;
}

.filters-badge {
  :deep(.ant-badge-count) {
    font-size: 11px;
    font-weight: 500;
    height: 18px;
    line-height: 18px;
    min-width: 18px;
    padding: 0 4px;
    box-shadow: 0 0 0 1px #fff;
  }
}

.clear-filters-btn {
  color: #8c8c8c;
  font-size: 12px;
  height: auto;
  padding: 0;
  margin-left: auto;
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

  :deep(.ant-checkbox-wrapper) {
    align-items: center;
  }

  :deep(.ant-checkbox) {
    margin-right: 8px;
  }
}

.tags-select {
  width: 100%;
}

.difficulty-junior {
  color: #52c41a;
  font-weight: 500;
}

.difficulty-middle {
  color: #fa8c16;
  font-weight: 500;
}

.difficulty-senior {
  color: #ff4d4f;
  font-weight: 500;
}

/* Активные фильтры - улучшенный дизайн */
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
  font-size: 13px;
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
}

.active-filter-item:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-label {
  color: #8c8c8c;
  font-weight: 400;
}

.filter-value {
  color: #262626;
  font-weight: 500;
}

.filter-remove {
  color: #bfbfbf;
  cursor: pointer;
  font-size: 10px;
  margin-left: 4px;
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

:deep(.ant-collapse-content-box) {
  padding: 16px 20px !important;
}

:deep(.ant-collapse-header) {
  padding: 12px 16px !important;
  cursor: pointer !important;
}

:deep(.ant-collapse-arrow) {
  color: #8c8c8c !important;
  font-size: 12px !important;
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .active-filters-grid {
    flex-direction: column;
  }

  .active-filter-item {
    justify-content: space-between;
  }
}
</style>
