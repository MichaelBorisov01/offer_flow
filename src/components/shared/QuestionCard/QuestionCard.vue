<script setup lang="ts">
import type { Question } from '@/types/interview'
import { BulbOutlined, EditOutlined } from '@ant-design/icons-vue'
import { computed } from 'vue'
import { useInterviewStore } from '@/stores/interview'
import {
  getCardBackgroundColor,
  getCardBorderColor,
  getCategoryColor,
  getDifficultyColor,
  getDifficultyLabel,
} from '@/utils/helpers/questionHelpers'

interface Props {
  question: Question
  questionNumber?: number
  showTags?: boolean
  showAnswerToggle?: boolean
  showUserAnswerToggle?: boolean
  answerVisible?: boolean
  userAnswerVisible?: boolean
  answerGenerating?: boolean
}

interface Emits {
  (e: 'toggleAnswer'): void
  (e: 'toggleUserAnswer'): void
}

const props = withDefaults(defineProps<Props>(), {
  showTags: true,
  showAnswerToggle: false,
  showUserAnswerToggle: false,
  answerVisible: false,
  userAnswerVisible: false,
  answerGenerating: false,
})

const emit = defineEmits<Emits>()

const interviewStore = useInterviewStore()

const filteredTags = computed(() => {
  if (!props.question.tags)
    return []

  const category = props.question.category
  return props.question.tags.filter(tag =>
    tag !== category
    && !(category === 'soft-skills' && tag === 'soft-skills'),
  )
})

const getAnswerButtonText = computed(() => {
  if (props.answerVisible)
    return 'Скрыть ИИ'
  return 'Ответ ИИ'
})

const getUserAnswerButtonText = computed(() => {
  if (props.userAnswerVisible)
    return 'Скрыть мой'
  return 'Мой ответ'
})
</script>

<template>
  <a-card
    :title="questionNumber ? `Вопрос ${questionNumber}` : 'Вопрос'"
    class="question-card"
    :class="{
      'mobile-layout': false,
      'has-user-answer': showUserAnswerToggle,
      'has-ai-answer': showAnswerToggle,
    }"
    :style="{
      borderLeftColor: getCardBorderColor(question.status),
      backgroundColor: getCardBackgroundColor(question.status),
    }"
  >
    <template #extra>
      <div class="card-header-extra">
        <div class="meta-info">
          <a-tag
            :color="getDifficultyColor(question.difficulty)"
            class="difficulty-tag"
          >
            <span class="tag-text">
              {{ getDifficultyLabel(question.difficulty) }}
            </span>
          </a-tag>
          <a-tag
            :color="getCategoryColor(question.category)"
            class="category-tag"
          >
            <span class="tag-text">
              {{ interviewStore.getCategoryName(question.category) }}
            </span>
          </a-tag>
        </div>

        <div class="answer-actions">
          <a-button
            v-if="showUserAnswerToggle"
            type="link"
            size="small"
            class="answer-btn user-answer-btn"
            :class="{ 'active-toggle': userAnswerVisible }"
            @click="emit('toggleUserAnswer')"
          >
            <EditOutlined class="btn-icon" />
            <span class="btn-text full-text">
              {{ userAnswerVisible ? 'Скрыть мой ответ' : 'Мой ответ' }}
            </span>
            <span class="btn-text short-text">
              {{ getUserAnswerButtonText }}
            </span>
          </a-button>

          <a-button
            v-if="showAnswerToggle"
            type="link"
            :loading="answerGenerating"
            size="small"
            class="answer-btn ai-answer-btn"
            :class="{ 'active-toggle': answerVisible }"
            @click="emit('toggleAnswer')"
          >
            <BulbOutlined class="btn-icon" />
            <span class="btn-text full-text">
              {{ answerVisible ? 'Скрыть ответ ИИ' : 'Ответ ИИ' }}
            </span>
            <span class="btn-text short-text">
              {{ getAnswerButtonText }}
            </span>
          </a-button>
        </div>
      </div>
    </template>

    <div class="question-content">
      <p class="question-text">
        {{ question.text }}
      </p>

      <div v-if="showTags && filteredTags.length" class="question-tags-container">
        <slot name="tags" :tags="filteredTags">
          <div class="question-tags">
            <a-tag
              v-for="(tag, index) in filteredTags"
              :key="index"
              color="blue"
              size="small"
              class="tag-item"
            >
              <span class="tag-text">
                {{ tag }}
              </span>
            </a-tag>
          </div>
        </slot>
      </div>
    </div>
  </a-card>
</template>

<style scoped>
.question-card {
  background: #fafafa;
  border: 2px solid #e8f4ff;
  border-left: 4px solid #e8f4ff;
  border-radius: 12px;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.question-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.question-content {
  padding: 12px 0 4px;
}

.question-text {
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 12px 0;
  color: #262626;
  font-weight: 500;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.question-tags-container {
  margin-top: 12px;
}

.question-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.tag-item {
  margin: 0;
  flex-shrink: 0;
  max-width: 150px;
  overflow: hidden;
}

.tag-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
}

:deep(.ant-card-head) {
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 20px 12px;
  min-height: auto;
}

:deep(.ant-card-head-title) {
  font-size: 14px;
  font-weight: 600;
  color: #595959;
  padding: 0;
}

:deep(.ant-card-extra) {
  padding: 0;
  margin-left: auto;
}

:deep(.ant-card-body) {
  padding: 0 20px 16px;
}

.card-header-extra {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.meta-info {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.difficulty-tag,
.category-tag {
  margin: 0;
  font-size: 11px;
  font-weight: 500;
  height: 22px;
  line-height: 20px;
  padding: 0 6px;
}

.answer-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.answer-btn {
  padding: 4px 8px;
  height: auto;
  font-size: 12px;
  color: #8c8c8c;
  border: 1px solid transparent;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 28px;
  background: #f0f8ff;
  border-color: #d6e4ff;
}

.answer-btn:hover {
  color: #1890ff;
}

.answer-btn.active-toggle {
  color: #1890ff;
  background: #e6f7ff;
  border-color: #91d5ff;
  font-weight: 500;
}

.btn-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.btn-text.full-text {
  display: inline;
}

.btn-text.short-text {
  display: none;
}

@media (max-width: 1024px) {
  .question-card {
    border-radius: 10px;
  }

  :deep(.ant-card-head) {
    padding: 14px 18px 10px;
  }

  :deep(.ant-card-body) {
    padding: 0 18px 14px;
  }

  .question-text {
    font-size: 15px;
    line-height: 1.5;
  }

  .answer-btn {
    padding: 3px 6px;
    font-size: 11px;
  }
}

@media (max-width: 768px) {
  .question-card {
    border-radius: 8px;
    margin-bottom: 12px;
    border-left-width: 3px;
  }

  :deep(.ant-card-head) {
    padding: 12px 16px 8px;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  :deep(.ant-card-head-title) {
    font-size: 13px;
    order: 2;
    text-align: center;
    padding-top: 4px;
  }

  :deep(.ant-card-extra) {
    width: 100%;
    margin-left: 0;
    order: 1;
  }

  .card-header-extra {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
  }

  .meta-info {
    justify-content: flex-start;
    flex: 1;
  }

  .answer-actions {
    flex-shrink: 0;
  }

  :deep(.ant-card-body) {
    padding: 0 16px 12px;
  }

  .question-content {
    padding: 8px 0 0;
  }

  .question-text {
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 10px;
  }

  .btn-text.full-text {
    display: none;
  }

  .btn-text.short-text {
    display: inline;
  }

  .answer-btn {
    min-height: 26px;
    padding: 4px 8px;
    font-size: 11px;
  }

  .tag-text {
    font-size: 10px;
  }

  .difficulty-tag,
  .category-tag {
    font-size: 10px;
    height: 20px;
    line-height: 18px;
    padding: 0 4px;
  }
}

@media (max-width: 480px) {
  .question-card {
    border-radius: 6px;
    margin-bottom: 10px;
  }

  :deep(.ant-card-head) {
    padding: 10px 12px 6px;
    gap: 6px;
  }

  :deep(.ant-card-head-title) {
    font-size: 12px;
    padding-top: 2px;
  }

  .card-header-extra {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .meta-info {
    justify-content: center;
    order: 2;
  }

  .answer-actions {
    justify-content: center;
    order: 1;
    width: 100%;
  }

  :deep(.ant-card-body) {
    padding: 0 12px 10px;
  }

  .question-content {
    padding: 6px 0 0;
  }

  .question-text {
    font-size: 13px;
    line-height: 1.4;
    margin-bottom: 8px;
  }

  .question-tags-container {
    margin-top: 8px;
  }

  .question-tags {
    gap: 4px;
  }

  .answer-btn {
    flex: 1;
    justify-content: center;
    min-height: 24px;
    padding: 3px 6px;
    font-size: 10px;
  }

  .btn-icon {
    font-size: 11px;
  }

  .tag-item {
    max-width: 100px;
  }

  .tag-text {
    font-size: 9px;
  }
}

@media (max-width: 360px) {
  .question-card {
    margin-bottom: 8px;
  }

  :deep(.ant-card-head) {
    padding: 8px 10px 4px;
  }

  :deep(.ant-card-head-title) {
    font-size: 11px;
  }

  :deep(.ant-card-body) {
    padding: 0 10px 8px;
  }

  .question-text {
    font-size: 12px;
    line-height: 1.3;
  }

  .answer-btn {
    min-height: 22px;
    padding: 2px 4px;
    font-size: 9px;
  }

  .btn-icon {
    font-size: 10px;
  }

  .meta-info {
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .difficulty-tag,
  .category-tag {
    font-size: 9px;
    height: 18px;
    line-height: 16px;
  }
}

/* Улучшения для touch-устройств */
@media (hover: none) and (pointer: coarse) {
  .question-card:hover {
    transform: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .answer-btn {
    min-height: 32px;
    padding: 6px 10px;
  }

  .answer-btn:hover {
    background: transparent;
    border-color: transparent;
  }

  .answer-btn.active-toggle:hover {
    background: #e6f7ff;
    border-color: #91d5ff;
  }
}

.answer-btn {
  position: relative;
  overflow: hidden;
}

.answer-btn:active {
  transform: scale(0.95);
}

.answer-btn.active-toggle:active {
  transform: scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .question-card,
  .answer-btn {
    transition: none;
  }

  .question-card:hover {
    transform: none;
  }
}

.question-text {
  text-align: left;
  hyphens: auto;
}

/* Подсветка при фокусе для доступности */
.answer-btn:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}

.question-card:focus-within {
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
</style>
