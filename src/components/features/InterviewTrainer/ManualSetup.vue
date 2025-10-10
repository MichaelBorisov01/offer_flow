<script setup lang="ts">
import type { Question, QuestionForm } from '@/types/interview'
import {
  BulbOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  UpOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useInterviewMode } from '@/composables/useInterviewMode'
import { useInterviewStore } from '@/stores/interview'
import AIAnswerCard from './AIAnswerCard.vue'
import EditQuestionForm from './EditQuestionForm.vue'

const emit = defineEmits<{
  (e: 'questionsChanged'): void
}>()

const interviewStore = useInterviewStore()
const {
  questionsListCollapsed,
  setQuestionsListCollapsed,
} = useInterviewMode()

const editingQuestion = ref<Question>()
const generatingAnswerId = ref<string | null>(null)
const editFormRef = ref<HTMLElement>() // Ref для формы редактирования

// Используем сохраненное состояние из localStorage
const isQuestionsListCollapsed = computed(() => questionsListCollapsed.value)

const questions = computed(() => interviewStore.questions)
const isLoading = computed(() => interviewStore.isLoading)

const clearConfirmationVisible = ref(false)

// Функция для показа подтверждения
function showClearConfirmation() {
  if (questions.value.length === 0) {
    message.info('Нет вопросов для удаления')
    return
  }
  clearConfirmationVisible.value = true
}

// Очистить все вопросы (после подтверждения)
async function clearAllQuestions() {
  try {
    // Закрываем модальное окно
    clearConfirmationVisible.value = false

    // Удаляем все вопросы по одному (с конца чтобы индексы не сбивались)
    for (let i = questions.value.length - 1; i >= 0; i--) {
      await interviewStore.removeQuestion(i)
    }
    message.success('Все вопросы удалены')
    emit('questionsChanged')
  }
  catch {
    message.error('Ошибка при удалении вопросов')
  }
}

// Переключение состояния списка с сохранением в localStorage
function toggleQuestionsList() {
  const newState = !questionsListCollapsed.value
  setQuestionsListCollapsed(newState)
}

// Развернуть список
function expandQuestionsList() {
  setQuestionsListCollapsed(false)
}

// Автоматический скролл к форме редактирования
function scrollToEditForm() {
  nextTick(() => {
    if (editFormRef.value) {
      editFormRef.value.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  })
}

async function addQuestion(questionData: QuestionForm) {
  try {
    if (editingQuestion.value?.id) {
      await interviewStore.updateQuestion(editingQuestion.value.id, questionData)
      message.success('Вопрос обновлен!')
    }
    else {
      await interviewStore.addQuestion(questionData)
      message.success('Вопрос добавлен!')
    }
    editingQuestion.value = undefined
    emit('questionsChanged')
  }
  catch (error: any) {
    console.error('Submit error:', error)
    message.error('Ошибка при сохранении вопроса')
  }
}

function startEditing(question: Question) {
  editingQuestion.value = { ...question }
  scrollToEditForm() // Добавляем скролл при начале редактирования
}

function cancelEditing() {
  editingQuestion.value = undefined
}

async function removeQuestion(index: number) {
  try {
    await interviewStore.removeQuestion(index)
    message.success('Вопрос удален')
    emit('questionsChanged')
  }
  catch {
    message.error('Ошибка при удалении вопроса')
  }
}

async function generateAnswerForQuestion(question: Question) {
  if (!question.id)
    return

  generatingAnswerId.value = question.id

  try {
    await interviewStore.generateAnswerForQuestion(question.id)
    message.success('Ответ сгенерирован!')
  }
  catch (error) {
    console.error('Error generating answer:', error)
    message.error('Не удалось сгенерировать ответ')
  }
  finally {
    generatingAnswerId.value = null
  }
}

function clearAnswer(question: Question) {
  if (question.id) {
    const questionToUpdate = interviewStore.questions.find(q => q.id === question.id)
    if (questionToUpdate) {
      questionToUpdate.aiAnswer = undefined
    }
  }
}

// Вспомогательные методы с правильными типами
function getDifficultyColor(difficulty: string) {
  const colors: Record<string, string> = {
    junior: 'green',
    middle: 'orange',
    senior: 'red',
  }
  return colors[difficulty] || 'blue'
}

function getDifficultyLabel(difficulty: string) {
  const labels: Record<string, string> = {
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
  }
  return labels[difficulty] || difficulty
}

function getTypeColor(type: string) {
  return type === 'code' ? 'volcano' : 'geekblue'
}

function getTypeLabel(type: string) {
  return type === 'code' ? 'Код' : 'Текст'
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    'javascript': 'gold',
    'vue': 'green',
    'react': 'blue',
    'typescript': 'geekblue',
    'html-css': 'purple',
    'algorithms': 'orange',
    'database': 'red',
    'system-design': 'cyan',
    'soft-skills': 'lime',
    'nodejs': 'green',
  }
  return colors[category] || 'default'
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

onMounted(() => {
  interviewStore.loadUserQuestions()
})
</script>

<template>
  <div class="manual-setup">
    <h3>Добавьте свои вопросы</h3>

    <!-- Форма добавления вопроса с ref -->
    <div ref="editFormRef">
      <EditQuestionForm
        :question-to-edit="editingQuestion"
        @submit="addQuestion"
        @cancel="cancelEditing"
      />
    </div>

    <a-divider />

    <!-- Список добавленных вопросов -->
    <div class="questions-list-section">
      <div class="questions-list-header">
        <h4>Добавленные вопросы ({{ questions.length }})</h4>

        <!-- Кнопки управления списком -->
        <div v-if="questions.length > 0" class="list-controls">
          <a-button
            type="link"
            size="small"
            class="collapse-button"
            @click="toggleQuestionsList"
          >
            <template #icon>
              <UpOutlined v-if="!isQuestionsListCollapsed" />
              <DownOutlined v-else />
            </template>
            {{ isQuestionsListCollapsed ? 'Развернуть' : 'Свернуть' }}
          </a-button>

          <a-button
            type="link"
            size="small"
            danger
            class="clear-button"
            @click="showClearConfirmation"
          >
            <DeleteOutlined />
            Очистить все
          </a-button>
        </div>
      </div>

      <!-- Сообщение когда список свернут -->
      <a-alert
        v-if="isQuestionsListCollapsed && questions.length > 0"
        :message="`Список свернут. Доступно вопросов: ${questions.length}`"
        type="info"
        show-icon
        class="collapsed-alert"
      >
        <template #action>
          <a-button size="small" type="link" @click="expandQuestionsList">
            Показать вопросы
          </a-button>
        </template>
      </a-alert>

      <!-- Список вопросов -->
      <div v-if="!isQuestionsListCollapsed">
        <a-list
          :data-source="questions"
          item-layout="vertical"
          :loading="isLoading"
          class="questions-list"
        >
          <template #renderItem="{ item, index }">
            <a-list-item class="question-item">
              <template #actions>
                <a-button type="link" danger size="small" @click="removeQuestion(index)">
                  <DeleteOutlined /> Удалить
                </a-button>
                <a-button type="link" size="small" @click="startEditing(item)">
                  <EditOutlined /> Редактировать
                </a-button>
                <a-button
                  type="link"
                  :loading="item.id === generatingAnswerId"
                  size="small"
                  @click="generateAnswerForQuestion(item)"
                >
                  <BulbOutlined />
                  Ответ ИИ
                </a-button>
              </template>

              <a-list-item-meta>
                <template #title>
                  <div class="question-header">
                    <span class="question-text">{{ item.text }}</span>
                    <div class="question-badges">
                      <a-tag :color="getDifficultyColor(item.difficulty)">
                        {{ getDifficultyLabel(item.difficulty) }}
                      </a-tag>
                      <a-tag :color="getTypeColor(item.type)">
                        {{ getTypeLabel(item.type) }}
                      </a-tag>
                    </div>
                  </div>
                </template>

                <template #description>
                  <div class="question-meta">
                    <a-tag :color="getCategoryColor(item.category)" class="category-tag">
                      {{ getCategoryLabel(item.category) }}
                    </a-tag>

                    <span v-if="item.tags && item.tags.length" class="tags-section">
                      <a-tag
                        v-for="(tag, tagIndex) in item.tags"
                        :key="tagIndex"
                        color="purple"
                        size="small"
                      >
                        {{ tag }}
                      </a-tag>
                    </span>

                    <span v-if="item.createdAt" class="question-date">
                      Добавлен: {{ formatDate(item.createdAt) }}
                    </span>
                    <span v-if="item.updatedAt && item.updatedAt !== item.createdAt" class="question-date">
                      • Обновлен: {{ formatDate(item.updatedAt) }}
                    </span>
                  </div>
                </template>
              </a-list-item-meta>

              <!-- Ответ ИИ -->
              <AIAnswerCard
                v-if="item.aiAnswer"
                :answer="item.aiAnswer"
                :loading="item.id === generatingAnswerId"
                style="margin-top: 12px;"
                @regenerate="() => generateAnswerForQuestion(item)"
                @close="clearAnswer(item)"
              />
            </a-list-item>
          </template>
        </a-list>
      </div>

      <a-alert
        v-if="questions.length === 0 && !isLoading"
        message="Пока нет добавленных вопросов"
        type="info"
        show-icon
      />
    </div>

    <!-- Модальное окно подтверждения удаления -->
    <a-modal
      v-model:visible="clearConfirmationVisible"
      title="Подтверждение удаления"
      ok-text="Да, удалить все"
      cancel-text="Отмена"
      ok-type="danger"
      @ok="clearAllQuestions"
      @cancel="clearConfirmationVisible = false"
    >
      <div style="display: flex; align-items: center; gap: 12px;">
        <ExclamationCircleOutlined style="font-size: 24px; color: #faad14;" />
        <div>
          <p style="margin: 0; font-weight: 500;">
            Вы уверены, что хотите удалить все вопросы?
          </p>
          <p style="margin: 8px 0 0 0; color: rgba(0, 0, 0, 0.45);">
            Будет удалено <strong>{{ questions.length }}</strong> вопросов. Это действие нельзя отменить.
          </p>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.manual-setup {
  max-width: 900px;
  margin: 0 auto;
}

.questions-list-section {
  margin-top: 24px;
}

.questions-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.questions-list-header h4 {
  margin: 0;
  color: #262626;
}

.list-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.collapse-button,
.clear-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

.collapsed-alert {
  margin-bottom: 16px;
}

.questions-list {
  max-height: 600px;
  overflow-y: auto;
}

.question-item {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  padding: 16px;
  background: white;
  transition: box-shadow 0.2s;
  overflow: hidden;
}

.question-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
  min-width: 0;
}

.question-text {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  min-width: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: inherit;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.question-badges {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.category-tag {
  font-weight: 500;
  flex-shrink: 0;
}

.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.tags-section :deep(.ant-tag) {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
}

.question-date {
  color: #8c8c8c;
  font-size: 12px;
  flex-shrink: 0;
}

:deep(.ant-list-item-action) {
  margin-top: 12px;
}

:deep(.ant-list-item-action li) {
  padding: 0 4px;
}

@media (max-width: 768px) {
  .questions-list-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .list-controls {
    width: 100%;
    justify-content: flex-end;
  }

  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .question-badges {
    align-self: flex-start;
  }

  .question-text {
    -webkit-line-clamp: 4;
    line-clamp: inherit;
    width: 100%;
  }

  .question-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .tags-section {
    width: 100%;
  }

  .tags-section :deep(.ant-tag) {
    max-width: 120px;
  }
}

@media (max-width: 480px) {
  .question-item {
    padding: 12px;
  }

  .question-text {
    font-size: 14px;
    -webkit-line-clamp: 4;
    line-clamp: inherit;
  }

  .tags-section :deep(.ant-tag) {
    max-width: 100px;
    font-size: 11px;
  }
}

:deep(.edit-question-form) {
  min-width: 0;
}

:deep(.edit-question-form .ant-form-item) {
  min-width: 0;
}

:deep(.edit-question-form .ant-card) {
  overflow: hidden;
}
</style>
