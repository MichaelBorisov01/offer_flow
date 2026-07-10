<script setup lang="ts">
import { CalendarOutlined, TagOutlined } from '@ant-design/icons-vue'
import { Tooltip } from 'ant-design-vue'
import { getDifficultyColor, getDifficultyLabel } from '@/utils/helpers/questionHelpers.ts'
import { formatDate, getTagsWord } from '@/utils/helpers/textHelpers.ts'

defineProps<{
  question: any
  categoryName: string
}>()
</script>

<template>
  <div class="question-header-wrapper">
    <div class="question-title-row">
      <span class="question-text">{{ question.text }}</span>
      <div class="question-meta-icons">
        <span
          class="difficulty-badge"
          :style="{ color: getDifficultyColor(question.difficulty) }"
        >
          {{ getDifficultyLabel(question.difficulty) }}
        </span>
        <span class="category-badge">{{ categoryName }}</span>
      </div>
    </div>

    <div class="question-footer">
      <div v-if="question.tags && question.tags.length" class="tags-compact">
        <TagOutlined class="tags-icon" />

        <a-tooltip placement="top" overlay-class-name="tags-tooltip">
          <template #title>
            <div class="tags-tooltip-content">
              <div class="tooltip-header">
                Теги вопроса:
              </div>
              <div class="tags-tooltip-chips">
                <span
                  v-for="(tag, i) in question.tags"
                  :key="i"
                  class="tag-tooltip-chip"
                >
                  {{ tag.length > 15 ? `${tag.substring(0, 15)}...` : tag }}
                </span>
              </div>
            </div>
          </template>
          <span class="tags-count">
            {{ question.tags.length }} {{ getTagsWord(question.tags.length) }}
          </span>
        </a-tooltip>
      </div>

      <Tooltip v-if="question.createdAt" :title="`Добавлен: ${formatDate(question.createdAt)}`">
        <div class="date-info">
          <CalendarOutlined />
          <span>{{ formatDate(question.createdAt) }}</span>
        </div>
      </Tooltip>
    </div>
  </div>
</template>

<style scoped>
.question-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.question-text {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: var(--ant-color-text);
  word-break: break-word;
  line-height: 1.5;
}

.question-meta-icons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-items: center;
}

.difficulty-badge,
.category-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--ant-color-bg-container);
  border: 1px solid var(--ant-color-border-secondary);
  white-space: nowrap;
  line-height: 1;
}

.category-badge {
  color: var(--ant-color-text-secondary);
  font-weight: normal;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.question-footer {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 8px;
}

.tags-compact,
.date-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ant-color-text-secondary);
  font-size: 11px;
}

.tags-icon {
  opacity: 0.8;
}

.tags-count:hover {
  color: var(--ant-color-primary);
  cursor: pointer;
}

@media (max-width: 768px) {
  .question-title-row {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
