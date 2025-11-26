<script setup lang="ts">
import type { Question } from '@/types/interview'
import {
  BulbOutlined,
  CalendarOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownOutlined,
  EditFilled,
  EditOutlined,
  SaveOutlined,
  TagOutlined,
  UpOutlined,
} from '@ant-design/icons-vue'
import { Tooltip } from 'ant-design-vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useInterviewStore } from '@/stores/interview'
import { sanitizedContent } from '@/utils/helpers/answerHelpers'
import {
  getCardBackgroundColor,
  getCardBorderColor,
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
  (e: 'saveAiToUserAnswer', question: Question, aiAnswer: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const interviewStore = useInterviewStore()

// Локальное состояние для редактирования пользовательского ответа
const isEditingUserAnswer = ref(false)
const userAnswerText = ref('')
const isLoadingUserAnswer = ref(false)

// Состояние для сворачивания/разворачивания ответа
const isAnswerExpanded = ref(false)
const userAnswerContent = ref<HTMLElement>()
const isOverflowing = ref(false)

// Проверяем, превышает ли контент ответа максимальную высоту
async function checkContentOverflow() {
  await nextTick()
  if (userAnswerContent.value) {
    const content = userAnswerContent.value
    isOverflowing.value = content.scrollHeight > content.clientHeight
  }
}

// Сбрасываем состояние расширения при изменении ответа
function resetExpansionState() {
  isAnswerExpanded.value = false
  // Перепроверяем переполнение после изменения контента
  nextTick(() => {
    checkContentOverflow()
  })
}

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
    emit('updateUserAnswer', props.question, userAnswerText.value.trim())
    isEditingUserAnswer.value = false
    // Сбрасываем состояние расширения после сохранения
    resetExpansionState()
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
    emit('updateUserAnswer', props.question, '')
    isEditingUserAnswer.value = false
    // Сбрасываем состояние расширения после очистки
    resetExpansionState()
  }
  catch (error) {
    console.error('Error clearing user answer:', error)
  }
  finally {
    isLoadingUserAnswer.value = false
  }
}

// Обработчик сохранения ответа ИИ как пользовательского ответа
function handleSaveAiToUserAnswer(aiAnswer: string) {
  emit('saveAiToUserAnswer', props.question, aiAnswer)
  // Сбрасываем состояние расширения после сохранения ИИ ответа
  resetExpansionState()
}

// Проверяем, есть ли пользовательский ответ
const hasUserAnswer = computed(() => {
  return props.question.userAnswer && props.question.userAnswer.trim().length > 0
})

// Переключаем состояние развертывания/свертывания
function toggleAnswerExpansion() {
  isAnswerExpanded.value = !isAnswerExpanded.value
}

// При монтировании проверяем переполнение
onMounted(() => {
  if (hasUserAnswer.value) {
    checkContentOverflow()
  }
})

// Следим за изменениями пользовательского ответа
watch(() => props.question.userAnswer, (newAnswer, oldAnswer) => {
  // Если ответ изменился (не только при первой загрузке)
  if (newAnswer !== oldAnswer) {
    resetExpansionState()
  }
})

// Также следим за изменениями самого вопроса (на случай перерисовки)
watch(() => props.question, () => {
  if (hasUserAnswer.value) {
    // Даем время на обновление DOM перед проверкой
    nextTick(() => {
      checkContentOverflow()
    })
  }
}, { deep: true })
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
      <div class="action-buttons-mobile">
        <Tooltip title="Удалить вопрос">
          <a-button
            type="text"
            danger
            size="large"
            class="action-button"
            @click="emit('remove', index)"
          >
            <DeleteOutlined />
            <span class="action-text">Удалить</span>
          </a-button>
        </Tooltip>

        <Tooltip title="Редактировать вопрос">
          <a-button
            type="text"
            size="large"
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
            size="large"
            class="action-button"
            @click="emit('generateAnswer', question)"
          >
            <BulbOutlined />
            <span class="action-text">ИИ ответ</span>
          </a-button>
        </Tooltip>
      </div>
    </template>

    <a-list-item-meta class="question-meta">
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
              {{ interviewStore.getCategoryName(question.category) }}
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
                      :title="tag.length > 15 ? tag : undefined"
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
            size="large"
            class="mobile-action-btn"
            @click="startEditingUserAnswer"
          >
            Добавить ответ
          </a-button>
          <a-button
            v-else-if="!isEditingUserAnswer && hasUserAnswer"
            size="large"
            class="mobile-action-btn"
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
            size="large"
            :loading="isLoadingUserAnswer"
            class="mobile-action-btn"
            @click="saveUserAnswer"
          >
            <SaveOutlined />
            Сохранить
          </a-button>
          <a-button
            v-if="hasUserAnswer"
            type="text"
            danger
            size="large"
            :loading="isLoadingUserAnswer"
            class="mobile-action-btn"
            @click="clearUserAnswer"
          >
            Удалить
          </a-button>
          <a-button
            size="large"
            class="mobile-action-btn"
            @click="cancelEditingUserAnswer"
          >
            <CloseOutlined />
            Отмена
          </a-button>
        </div>
      </div>

      <!-- Режим просмотра -->
      <div v-else-if="hasUserAnswer" class="user-answer-display">
        <div
          ref="userAnswerContent"
          class="user-answer-content answer-text"
          :class="{ expanded: isAnswerExpanded }"
          v-html="sanitizedContent(question.userAnswer)"
        />
        <div v-if="isOverflowing || isAnswerExpanded" class="user-answer-expand">
          <a-button
            type="link"
            size="large"
            class="expand-button mobile-action-btn"
            @click="toggleAnswerExpansion"
          >
            <template #icon>
              <DownOutlined v-if="!isAnswerExpanded" />
              <UpOutlined v-else />
            </template>
            {{ isAnswerExpanded ? 'Свернуть' : 'Развернуть' }}
          </a-button>
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
      mode="manual"
      class="ai-answer-card"
      @regenerate="() => emit('generateAnswer', question)"
      @close="emit('clearAnswer', question)"
      @save-to-user-answer="handleSaveAiToUserAnswer"
    />
  </a-list-item>
</template>

<style scoped>
@import '@/assets/styles/markdown-content.scss';

.question-item {
  border: 1px solid #f0f0f0;
  border-left: 4px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  padding: 16px;
  transition: all 0.2s ease;
  overflow: hidden;
  position: relative;
}

.question-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #d9d9d9;
}

.question-meta :deep(.ant-list-item-meta-content) {
  flex: 1;
  min-width: 0;
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
  word-break: break-word;
}

.question-meta-icons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-items: center;
}

.difficulty-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1;
}

.category-badge {
  font-size: 11px;
  color: #8c8c8c;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
  min-width: 0;
  line-height: 1;
}

.question-footer {
  display: flex;
  gap: 16px;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  padding: 4px 0;
  flex-wrap: wrap;
}

.tags-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8c8c8c;
  cursor: pointer;
  flex-shrink: 0;
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
  cursor: pointer;
  flex-shrink: 0;
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

.action-buttons-mobile {
  display: flex;
  gap: 8px;
  width: 100%;
}

.action-button {
  min-width: auto;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: none;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: #f5f5f5;
}

.action-text {
  font-size: 10px;
  line-height: 1;
  display: block;
  margin-inline-start: 0 !important;
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
  flex-wrap: wrap;
  gap: 8px;
}

.user-answer-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1890ff;
  flex-shrink: 0;
}

.user-answer-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.user-answer-edit {
  margin-top: 8px;
}

.user-answer-textarea {
  margin-bottom: 12px;
  border-radius: 8px;
}

.user-answer-textarea :deep(textarea) {
  border-radius: 6px;
  font-size: 14px;
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
  max-height: 150px;
  overflow: hidden;
  transition: max-height 0.3s ease;
  position: relative;
  background: white;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.user-answer-content.expanded {
  max-height: none;
  overflow: visible;
}

.user-answer-content:not(.expanded)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(transparent, #fafafa);
  pointer-events: none;
  border-radius: 0 0 6px 6px;
}

.user-answer-expand {
  display: flex;
  justify-content: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.expand-button {
  color: #1890ff;
  font-size: 14px;
  padding: 8px 16px;
  height: auto;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.expand-button:hover {
  color: #40a9ff;
  background: #f0f7ff;
}

.user-answer-empty {
  padding: 16px;
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

/* Универсальные стили для мобильных кнопок */
.mobile-action-btn {
  height: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border-radius: 8px;
  padding: 0 16px;
}

.mobile-action-btn :deep(.anticon) {
  font-size: 16px;
}

/* Медиа-запросы для мобильных устройств */
@media (max-width: 768px) {
  .question-item {
    padding: 12px;
    margin-bottom: 16px;
  }

  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 16px;
  }

  .question-text {
    font-size: 16px;
    line-height: 1.4;
  }

  .question-meta-icons {
    width: 100%;
    justify-content: flex-start;
    gap: 8px;
  }

  .difficulty-badge,
  .category-badge {
    font-size: 12px;
    padding: 6px 10px;
  }

  .question-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
  }

  .tags-compact,
  .date-info {
    font-size: 12px;
  }

  .user-answer-section {
    padding: 12px;
    margin-top: 12px;
  }

  .user-answer-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .user-answer-actions {
    width: 100%;
  }

  .user-answer-actions .mobile-action-btn {
    width: 100%;
  }

  .user-answer-edit-actions {
    flex-direction: column;
    margin-top: 24px;
  }

  .user-answer-edit-actions .mobile-action-btn {
    width: 100%;
    margin: 0;
  }

  .user-answer-content {
    max-height: 120px;
    padding: 10px;
    font-size: 14px;
  }

  .expand-button {
    width: 100%;
    justify-content: center;
  }

  /* Action buttons на мобильных */
  .action-buttons-mobile {
    gap: 4px;
  }

  .action-button {
    height: 52px;
    padding: 8px 2px;
    min-height: 52px;
  }

  .action-text {
    font-size: 10px;
    line-height: 1.2;
  }
}

/* Очень маленькие экраны */
@media (max-width: 360px) {
  .question-item {
    padding: 10px;
  }

  .question-text {
    font-size: 15px;
  }

  .difficulty-badge,
  .category-badge {
    font-size: 11px;
    padding: 5px 8px;
  }

  .user-answer-section {
    padding: 10px;
  }

  .user-answer-content {
    max-height: 100px;
    font-size: 13px;
  }

  .mobile-action-btn {
    height: 42px;
    min-height: 42px;
    font-size: 13px;
  }

  .action-button {
    height: 48px;
    min-height: 48px;
  }

  .action-text {
    font-size: 9px;
  }
}

/* Планшеты и маленькие десктопы */
@media (min-width: 769px) and (max-width: 1024px) {
  .question-item {
    padding: 14px;
  }

  .action-button {
    height: 40px;
    flex-direction: row;
    gap: 6px;
    padding: 8px 12px;
  }

  .action-text {
    font-size: 11px;
  }
}

/* Улучшение accessibility для касаний */
@media (max-width: 768px) {
  .action-button,
  .mobile-action-btn,
  .expand-button {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .action-button:active,
  .mobile-action-btn:active {
    background-color: #f0f0f0;
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }
}

.question-text {
  hyphens: auto;
  -webkit-hyphens: auto;
}

.question-item,
.action-button,
.mobile-action-btn,
.user-answer-content {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.user-answer-content {
  -webkit-overflow-scrolling: touch;
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
  max-width: 280px;
  max-height: 300px;
  overflow-y: auto;
}

.tags-tooltip .ant-tooltip-arrow::before {
  background: white;
}

.tags-tooltip-content {
  max-width: 250px;
}

.tooltip-header {
  font-weight: 600;
  margin-bottom: 8px;
  color: #262626;
  font-size: 13px;
}

.tags-tooltip-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 100%;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 2px;
}

.tag-tooltip-chip {
  background: #f0f7ff;
  color: #1890ff;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  border: 1px solid #d6e4ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  display: inline-block;
  vertical-align: middle;
  line-height: 1.4;
}

@media (max-width: 480px) {
  .tags-tooltip .ant-tooltip-inner {
    max-width: 240px;
    max-height: 250px;
  }

  .tags-tooltip-chips {
    max-height: 180px;
  }

  .tag-tooltip-chip {
    max-width: 100px;
    font-size: 10px;
    padding: 3px 8px;
  }
}

@media (max-width: 768px) {
  .ant-tooltip {
    pointer-events: none;
  }
}
</style>
