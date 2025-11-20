<script setup lang="ts">
import type { Question } from '@/types/interview'
import { BulbOutlined, EditOutlined } from '@ant-design/icons-vue'

import { computed } from 'vue'
import {
  getCardBackgroundColor,
  getCardBorderColor,
  getCategoryColor,
  getCategoryLabel,
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

const filteredTags = computed(() => {
  if (!props.question.tags)
    return []

  const category = props.question.category
  return props.question.tags.filter(tag =>
    tag !== category
    && !(category === 'soft-skills' && tag === 'soft-skills'),
  )
})
</script>

<template>
  <a-card
    :title="questionNumber ? `Вопрос ${questionNumber}` : 'Вопрос'"
    class="question-card"
    :style="{
      borderLeftColor: getCardBorderColor(question.status),
      backgroundColor: getCardBackgroundColor(question.status),
    }"
  >
    <template #extra>
      <a-space>
        <a-tag :color="getDifficultyColor(question.difficulty)">
          {{ getDifficultyLabel(question.difficulty) }}
        </a-tag>
        <a-tag :color="getCategoryColor(question.category)">
          {{ getCategoryLabel(question.category) }}
        </a-tag>
        <a-button
          v-if="showUserAnswerToggle"
          type="link"
          size="small"
          :class="{ 'active-toggle': userAnswerVisible }"
          @click="emit('toggleUserAnswer')"
        >
          <EditOutlined />
          {{ userAnswerVisible ? 'Скрыть мой ответ' : 'Показать мой ответ' }}
        </a-button>
        <a-button
          v-if="showAnswerToggle"
          type="link"
          :loading="answerGenerating"
          size="small"
          :class="{ 'active-toggle': answerVisible }"
          @click="emit('toggleAnswer')"
        >
          <BulbOutlined />
          {{ answerVisible ? 'Скрыть ответ ИИ' : 'Ответ ИИ' }}
        </a-button>
      </a-space>
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
              {{ tag }}
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
}

.question-content {
  padding: 8px 0;
}

.question-text {
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
  color: #262626;
  font-weight: 500;
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
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.active-toggle {
  color: #1890ff;
  background: #e6f7ff;
  border-color: #91d5ff;
}
</style>
