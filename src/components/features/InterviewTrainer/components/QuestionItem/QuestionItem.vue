<script setup lang="ts">
import type { Question } from '@/types/interview'
import {
  BulbOutlined,
  CalendarOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditFilled,
  EditOutlined,
  SaveOutlined,
  TagOutlined,
} from '@ant-design/icons-vue'
import { Tooltip } from 'ant-design-vue'
import { computed, ref } from 'vue'
import {
  getCardBackgroundColor,
  getCardBorderColor,
  getCategoryLabelShort,
  getDifficultyColor,
  getDifficultyLabel,
} from '@/utils/helpers/questionHelpers'
import { formatDate, getTagsWord } from '@/utils/helpers/textHelpers'
import AIAnswerCard from '../../shared/AIAnswerCard.vue'

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
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Локальное состояние для редактирования пользовательского ответа
const isEditingUserAnswer = ref(false)
const userAnswerText = ref('')
const isLoadingUserAnswer = ref(false)

// Начинаем редактирование пользовательского ответа
function startEditingUserAnswer() {
  userAnswerText.value = props.question.userAnswer || ''
  isEditingUserAnswer.value = true
}

// Отменяем редактирование
function cancelEditingUserAnswer() {
  isEditingUserAnswer.value = false
  userAnswerText.value = ''
}

// Сохраняем пользовательский ответ
async function saveUserAnswer() {
  if (!userAnswerText.value.trim())
    return

  isLoadingUserAnswer.value = true
  try {
    await emit('updateUserAnswer', props.question, userAnswerText.value.trim())
    isEditingUserAnswer.value = false
  }
  catch (error) {
    console.error('Error saving user answer:', error)
  }
  finally {
    isLoadingUserAnswer.value = false
  }
}

// Удаляем пользовательский ответ
async function clearUserAnswer() {
  isLoadingUserAnswer.value = true
  try {
    await emit('updateUserAnswer', props.question, '')
    isEditingUserAnswer.value = false
  }
  catch (error) {
    console.error('Error clearing user answer:', error)
  }
  finally {
    isLoadingUserAnswer.value = false
  }
}

// Проверяем, есть ли пользовательский ответ
const hasUserAnswer = computed(() => {
  return props.question.userAnswer && props.question.userAnswer.trim().length > 0
})
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
      <Tooltip title="Удалить вопрос">
        <a-button
          type="text"
          danger
          size="small"
          class="action-button"
          @click="emit('remove', index)"
        >
          <DeleteOutlined />
        </a-button>
      </Tooltip>

      <Tooltip title="Редактировать вопрос">
        <a-button
          type="text"
          size="small"
          class="action-button"
          @click="emit('edit', question)"
        >
          <EditOutlined />
        </a-button>
      </Tooltip>

      <Tooltip title="Сгенерировать ответ ИИ">
        <a-button
          type="text"
          :loading="question.id === generatingAnswerId"
          size="small"
          class="action-button"
          @click="emit('generateAnswer', question)"
        >
          <BulbOutlined />
        </a-button>
      </Tooltip>
    </template>

    <a-list-item-meta>
      <template #title>
        <div class="question-header">
          <span class="question-text">{{ question.text }}</span>
          <div class="question-meta-icons">
            <span
              class="difficulty-badge"
              :style="{ color: getDifficultyColor(question.difficulty) }"
            >
              {{ getDifficultyLabel(question.difficulty) }}
            </span>
            <span class="category-badge">
              {{ getCategoryLabelShort(question.category) }}
            </span>
          </div>
        </div>
      </template>

      <template #description>
        <div class="question-footer">
          <div v-if="question.tags && question.tags.length" class="tags-compact">
            <TagOutlined class="tags-icon" />
            <a-tooltip
              placement="top"
              overlay-class-name="tags-tooltip"
            >
              <template #title>
                <div class="tags-tooltip-content">
                  <div class="tooltip-header">
                    Теги вопроса:
                  </div>
                  <div class="tags-tooltip-chips">
                    <span
                      v-for="(tag, tagIndex) in question.tags"
                      :key="tagIndex"
                      class="tag-tooltip-chip"
                    >
                      {{ tag }}
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
      </template>
    </a-list-item-meta>

    <!-- Блок пользовательского ответа -->
    <div class="user-answer-section">
      <div class="user-answer-header">
        <h4 class="user-answer-title">
          <EditFilled />
          Ваш ответ
        </h4>
        <div class="user-answer-actions">
          <a-button
            v-if="!isEditingUserAnswer && !hasUserAnswer"
            type="dashed"
            size="small"
            @click="startEditingUserAnswer"
          >
            Добавить ответ
          </a-button>
          <a-button
            v-else-if="!isEditingUserAnswer && hasUserAnswer"
            type="text"
            size="small"
            @click="startEditingUserAnswer"
          >
            Редактировать
          </a-button>
        </div>
      </div>

      <!-- Режим редактирования -->
      <div v-if="isEditingUserAnswer" class="user-answer-edit">
        <a-textarea
          v-model:value="userAnswerText"
          placeholder="Введите ваш ответ на этот вопрос..."
          :rows="4"
          :maxlength="2000"
          show-count
          class="user-answer-textarea"
        />
        <div class="user-answer-edit-actions">
          <a-button
            type="primary"
            size="small"
            :loading="isLoadingUserAnswer"
            @click="saveUserAnswer"
          >
            <SaveOutlined />
            Сохранить
          </a-button>
          <a-button
            v-if="hasUserAnswer"
            type="text"
            danger
            size="small"
            :loading="isLoadingUserAnswer"
            @click="clearUserAnswer"
          >
            Удалить
          </a-button>
          <a-button
            size="small"
            @click="cancelEditingUserAnswer"
          >
            <CloseOutlined />
            Отмена
          </a-button>
        </div>
      </div>

      <!-- Режим просмотра -->
      <div v-else-if="hasUserAnswer" class="user-answer-display">
        <div class="user-answer-content">
          {{ question.userAnswer }}
        </div>
      </div>

      <!-- Сообщение когда ответа нет -->
      <div v-else class="user-answer-empty">
        <span class="empty-text">Вы еще не добавили ответ на этот вопрос</span>
      </div>
    </div>

    <AIAnswerCard
      v-if="question.aiAnswer"
      :answer="question.aiAnswer"
      :loading="question.id === generatingAnswerId"
      class="ai-answer-card"
      @regenerate="() => emit('generateAnswer', question)"
      @close="emit('clearAnswer', question)"
    />
  </a-list-item>
</template>

<style scoped>
.question-item {
  border: 1px solid #f0f0f0;
  border-left: 4px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  padding: 16px;
  background: white;
  transition: all 0.2s ease;
  overflow: hidden;
}

.question-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #d9d9d9;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  min-width: 0;
}

.question-text {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  min-width: 0;
  color: #262626;
  margin: 0;
}

.question-meta-icons {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  align-items: center;
}

.difficulty-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
}

.category-badge {
  font-size: 11px;
  color: #8c8c8c;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
}

.question-footer {
  display: flex;
  gap: 16px;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  padding: 4px 0;
}

.tags-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8c8c8c;
  cursor: pointer;
}

.tags-icon {
  font-size: 11px;
  opacity: 0.6;
}

.tags-count {
  font-size: 11px;
  transition: color 0.2s ease;
}

.tags-count:hover {
  color: #1890ff;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #8c8c8c;
}

:deep(.ant-list-item-action) {
  margin-top: 12px;
  display: flex;
  gap: 4px;
}

:deep(.ant-list-item-action li) {
  padding: 0;
}

.action-button {
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: none;
}

.ai-answer-card {
  margin-top: 12px;
}

/* Стили для блока пользовательского ответа */
.user-answer-section {
  margin-top: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.user-answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-answer-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1890ff;
}

.user-answer-edit {
  margin-top: 8px;
}

.user-answer-textarea {
  margin-bottom: 12px;
}

.user-answer-edit-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.user-answer-display {
  margin-top: 8px;
}

.user-answer-content {
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  line-height: 1.6;
  white-space: pre-line;
  color: #262626;
}

.user-answer-empty {
  padding: 12px;
  text-align: center;
  color: #8c8c8c;
  font-style: italic;
  background: #fafafa;
  border-radius: 6px;
  border: 1px dashed #d9d9d9;
}

.empty-text {
  font-size: 14px;
}

@media (max-width: 768px) {
  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .question-meta-icons {
    align-self: flex-start;
  }

  .question-text {
    font-size: 14px;
    width: 100%;
  }

  .question-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .user-answer-edit-actions {
    flex-direction: column;
  }

  .user-answer-edit-actions .ant-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .question-item {
    padding: 12px;
  }

  .question-text {
    font-size: 14px;
  }

  .question-meta-icons {
    gap: 8px;
  }

  .difficulty-badge {
    font-size: 10px;
    padding: 1px 4px;
  }

  .user-answer-section {
    padding: 12px;
  }
}
</style>

<style>
.tags-tooltip .ant-tooltip-inner {
  background: white;
  color: #262626;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #f0f0f0;
  padding: 12px;
  max-width: 300px;
}

.tags-tooltip .ant-tooltip-arrow::before {
  background: white;
}

.tags-tooltip-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 250px;
}

.tag-tooltip-chip {
  background: #f0f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  border: 1px solid #d6e4ff;
  white-space: nowrap;
}
</style>
