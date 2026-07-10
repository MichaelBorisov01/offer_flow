<script setup lang="ts">
import type { Question } from '@/types/interview.ts'
import { BulbOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons-vue'
import { Tooltip } from 'ant-design-vue'
import { useInterviewStore } from '@/stores/interview'
import { getCardBackgroundColor, getCardBorderColor } from '@/utils/helpers/questionHelpers.ts'

import AIAnswerCard from '../Evaluation/AIAnswerCard.vue'
import UserAnswerSection from '../Evaluation/UserAnswerSection.vue'
import QuestionHeader from './QuestionHeader.vue'

interface Props {
  question: Question
  index: number
  generatingAnswerId?: string | null
}

interface Emits {
  (e: 'edit', question: Question): void
  (e: 'remove', index: number): void
  (e: 'generateAnswer', question: Question): void
  (e: 'clearAnswer', question: Question): void
  (e: 'updateUserAnswer', question: Question, userAnswer: string): void
  (e: 'saveAiToUserAnswer', question: Question, aiAnswer: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
const interviewStore = useInterviewStore()
</script>

<template>
  <a-list-item
    class="question-item"
    :style="{
      borderLeftColor: getCardBorderColor(question.status),
      backgroundColor: getCardBackgroundColor(question.status),
    }"
  >
    <template #actions>
      <div class="action-buttons-container">
        <Tooltip title="Удалить вопрос">
          <a-button
            type="text"
            danger
            class="action-button danger-btn"
            @click="emit('remove', index)"
          >
            <DeleteOutlined />
            <span class="action-text">Удалить</span>
          </a-button>
        </Tooltip>

        <Tooltip title="Редактировать вопрос">
          <a-button
            type="text"
            class="action-button"
            @click="emit('edit', question)"
          >
            <EditOutlined />
            <span class="action-text">Редактировать</span>
          </a-button>
        </Tooltip>

        <Tooltip title="Сгенерировать ответ ИИ">
          <a-button
            type="text"
            :loading="question.id === generatingAnswerId"
            class="action-button"
            @click="emit('generateAnswer', question)"
          >
            <template #icon>
              <BulbOutlined />
            </template>
            <span class="action-text">ИИ ответ</span>
          </a-button>
        </Tooltip>
      </div>
    </template>

    <div class="question-content-wrapper">
      <QuestionHeader
        :question="question"
        :category-name="interviewStore.getCategoryName(question.category)"
      />

      <UserAnswerSection
        :user-answer="question.userAnswer"
        @update="(text) => emit('updateUserAnswer', question, text)"
      />

      <AIAnswerCard
        v-if="question.aiAnswer"
        :answer="question.aiAnswer"
        mode="manual"
        @regenerate="() => emit('generateAnswer', question)"
        @close="emit('clearAnswer', question)"
        @save-to-user-answer="(text) => emit('saveAiToUserAnswer', question, text)"
      />
    </div>
  </a-list-item>
</template>

<style scoped>
.question-item {
  border: 1px solid var(--ant-color-border-secondary);
  border-left-width: 4px;
  border-radius: 12px;
  margin-bottom: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  overflow: hidden;
  display: block;
}

.question-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: var(--ant-color-border);
}

.question-content-wrapper {
  width: 100%;
}

:deep(.ant-list-item-action) {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  width: 100%;
}

:deep(.ant-list-item-action li) {
  padding: 0;
  flex: 1;
}

.action-buttons-container {
  display: flex;
  gap: 8px;
  width: 100%;
}

.action-button {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  border-radius: 8px;
  color: var(--ant-color-text-secondary);
  transition: all 0.2s ease;
}

.action-button:hover {
  background: var(--ant-color-fill-tertiary);
  color: var(--ant-color-text);
}

.danger-btn:hover {
  color: var(--ant-color-error);
  background: var(--ant-color-error-bg);
}

.action-text {
  font-size: 10px;
  line-height: 1;
}

@media (min-width: 769px) {
  .action-button {
    height: 40px;
    flex-direction: row;
    padding: 8px 12px;
  }

  .action-text {
    font-size: 11px;
  }
}
</style>
