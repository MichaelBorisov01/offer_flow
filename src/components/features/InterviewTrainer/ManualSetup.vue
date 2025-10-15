<script setup lang="ts">
import type { Question, QuestionForm } from '@/types/interview'
import {
  BulbOutlined,
  CalendarOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  SwapOutlined,
  TagOutlined,
  UpOutlined,
} from '@ant-design/icons-vue'
import { message, Tooltip } from 'ant-design-vue'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useInterviewMode } from '@/composables/useInterviewMode'
import { useInterviewStore } from '@/stores/interview'
import AIAnswerCard from './AIAnswerCard.vue'
import EditQuestionForm from './EditQuestionForm.vue'
import QuestionFilters from './Manual/QuestionFilters.vue'
import ConfirmClearAllModal from './modal/ConfirmClearAllModal.vue'
import StatusProgressBar from './StatusProgressBar.vue'

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
const editFormRef = ref<HTMLElement>()

const isQuestionsListCollapsed = computed(() => questionsListCollapsed.value)

const allQuestions = computed(() => interviewStore.questions)
const isLoading = computed(() => interviewStore.isLoading)

const clearConfirmationVisible = ref(false)

const filteredQuestions = ref<Question[]>([])

onMounted(() => {
  filteredQuestions.value = [...allQuestions.value]
})

// Обработчик изменения фильтров
function handleFilterChange(filters: any) {
  let filtered = [...allQuestions.value]

  // Фильтрация по сложности
  if (filters.difficulties.length > 0) {
    filtered = filtered.filter(q => filters.difficulties.includes(q.difficulty))
  }

  // Фильтрация по категориям
  if (filters.categories.length > 0) {
    filtered = filtered.filter(q => filters.categories.includes(q.category))
  }

  // Фильтрация по тегам
  if (filters.tags.length > 0) {
    filtered = filtered.filter(q =>
      q.tags?.some(tag => filters.tags.includes(tag)),
    )
  }

  filteredQuestions.value = filtered
}

function showClearConfirmation() {
  if (allQuestions.value.length === 0) {
    message.info('Нет вопросов для удаления')
    return
  }
  clearConfirmationVisible.value = true
}

async function clearAllQuestions() {
  try {
    clearConfirmationVisible.value = false

    for (let i = allQuestions.value.length - 1; i >= 0; i--) {
      await interviewStore.removeQuestion(i)
    }
    message.success('Все вопросы удалены')
    emit('questionsChanged')
  }
  catch {
    message.error('Ошибка при удалении вопросов')
  }
}

function handleClearCancel() {
  clearConfirmationVisible.value = false
}

function toggleQuestionsList() {
  const newState = !questionsListCollapsed.value
  setQuestionsListCollapsed(newState)
}

function expandQuestionsList() {
  setQuestionsListCollapsed(false)
}

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
  scrollToEditForm()
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

function getDifficultyColor(difficulty: string) {
  const colors: Record<string, string> = {
    junior: '#52c41a',
    middle: '#fa8c16',
    senior: '#ff4d4f',
  }
  return colors[difficulty] || '#d9d9d9'
}

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
    'javascript': 'JS',
    'vue': 'Vue',
    'react': 'React',
    'typescript': 'TS',
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
  }).format(date)
}

function shuffleQuestions() {
  interviewStore.shuffleQuestions()
}

function getCardBorderColor(question: Question): string {
  if (!question.status)
    return '#f0f0f0'

  const colors = {
    known: '#b7eb8f',
    repeat: '#ffd591',
    hard: '#ffccc7',
  }
  return colors[question.status as keyof typeof colors] || '#f0f0f0'
}

function getCardBackgroundColor(question: Question): string {
  if (!question.status)
    return '#ffffff'

  const colors = {
    known: '#f6ffed',
    repeat: '#fff7e6',
    hard: '#fff2f0',
  }
  return colors[question.status as keyof typeof colors] || '#ffffff'
}

onMounted(() => {
  interviewStore.loadUserQuestions()
})
</script>

<template>
  <div class="manual-setup">
    <h3>Добавьте свои вопросы</h3>

    <div ref="editFormRef">
      <EditQuestionForm
        :question-to-edit="editingQuestion"
        @submit="addQuestion"
        @cancel="cancelEditing"
      />
    </div>

    <a-divider />

    <div class="questions-list-section">
      <div class="questions-list-header">
        <h4>Добавленные вопросы ({{ filteredQuestions.length }}/{{ allQuestions.length }})</h4>

        <div v-if="allQuestions.length > 0" class="list-controls">
          <Tooltip title="Свернуть/развернуть список">
            <a-button
              type="text"
              size="small"
              class="collapse-button"
              @click="toggleQuestionsList"
            >
              <template #icon>
                <UpOutlined v-if="!isQuestionsListCollapsed" />
                <DownOutlined v-else />
              </template>
            </a-button>
          </Tooltip>

          <Tooltip title="Перемешать вопросы">
            <a-button
              type="text"
              size="small"
              @click="shuffleQuestions"
            >
              <SwapOutlined />
            </a-button>
          </Tooltip>

          <Tooltip title="Удалить все вопросы">
            <a-button
              type="text"
              size="small"
              danger
              class="clear-button"
              @click="showClearConfirmation"
            >
              <DeleteOutlined />
            </a-button>
          </Tooltip>
        </div>
      </div>

      <QuestionFilters
        :questions="allQuestions"
        @filter-change="handleFilterChange"
      />

      <StatusProgressBar
        v-if="allQuestions.length > 0"
        :questions="filteredQuestions"
        class="inline-progress"
      />

      <a-alert
        v-if="isQuestionsListCollapsed && filteredQuestions.length > 0"
        :message="`Список свернут. Доступно вопросов: ${filteredQuestions.length}`"
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

      <div v-if="!isQuestionsListCollapsed">
        <a-list
          :data-source="filteredQuestions"
          item-layout="vertical"
          :loading="isLoading"
          class="questions-list"
        >
          <template #renderItem="{ item, index }">
            <a-list-item
              class="question-item"
              :style="{
                borderLeftColor: getCardBorderColor(item),
                backgroundColor: getCardBackgroundColor(item),
              }"
            >
              <template #actions>
                <Tooltip title="Удалить вопрос">
                  <a-button
                    type="text"
                    danger
                    size="small"
                    class="action-button"
                    @click="removeQuestion(index)"
                  >
                    <DeleteOutlined />
                  </a-button>
                </Tooltip>

                <Tooltip title="Редактировать вопрос">
                  <a-button
                    type="text"
                    size="small"
                    class="action-button"
                    @click="startEditing(item)"
                  >
                    <EditOutlined />
                  </a-button>
                </Tooltip>

                <Tooltip title="Сгенерировать ответ ИИ">
                  <a-button
                    type="text"
                    :loading="item.id === generatingAnswerId"
                    size="small"
                    class="action-button"
                    @click="generateAnswerForQuestion(item)"
                  >
                    <BulbOutlined />
                  </a-button>
                </Tooltip>
              </template>

              <a-list-item-meta>
                <template #title>
                  <div class="question-header">
                    <span class="question-text">{{ item.text }}</span>
                    <div class="question-meta-icons">
                      <!-- Сложность -->
                      <span
                        class="difficulty-badge"
                        :style="{ color: getDifficultyColor(item.difficulty) }"
                      >
                        {{ getDifficultyLabel(item.difficulty) }}
                      </span>

                      <!-- Категория -->
                      <span class="category-badge">
                        {{ getCategoryLabel(item.category) }}
                      </span>
                    </div>
                  </div>
                </template>

                <template #description>
                  <div class="question-footer">
                    <!-- Теги компактно -->
                    <div v-if="item.tags && item.tags.length" class="tags-compact">
                      <TagOutlined class="tags-icon" />
                      <span class="tags-count">{{ item.tags.length }} тег(ов)</span>
                    </div>

                    <!-- Дата -->
                    <Tooltip v-if="item.createdAt" :title="`Добавлен: ${formatDate(item.createdAt)}`">
                      <div class="date-info">
                        <CalendarOutlined />
                        <span>{{ formatDate(item.createdAt) }}</span>
                      </div>
                    </Tooltip>
                  </div>
                </template>
              </a-list-item-meta>

              <AIAnswerCard
                v-if="item.aiAnswer"
                :answer="item.aiAnswer"
                :loading="item.id === generatingAnswerId"
                class="ai-answer-card"
                @regenerate="() => generateAnswerForQuestion(item)"
                @close="clearAnswer(item)"
              />
            </a-list-item>
          </template>
        </a-list>
      </div>

      <a-alert
        v-if="filteredQuestions.length === 0 && !isLoading"
        message="Нет вопросов, соответствующих выбранным фильтрам"
        type="warning"
        show-icon
      />
    </div>

    <ConfirmClearAllModal
      :open="clearConfirmationVisible"
      :questions-count="allQuestions.length"
      @ok="clearAllQuestions"
      @cancel="handleClearCancel"
    />
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
  font-size: 18px;
  font-weight: 600;
}

.list-controls {
  display: flex;
  gap: 4px;
  align-items: center;
}

.collapse-button,
.clear-button {
  display: flex;
  align-items: center;
  justify-content: center;
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

.type-icon {
  font-size: 14px;
  opacity: 0.7;
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
}

.tags-icon {
  font-size: 11px;
  opacity: 0.6;
}

.tags-count {
  font-size: 11px;
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

:deep(.edit-question-form) {
  min-width: 0;
}

:deep(.edit-question-form .ant-form-item) {
  min-width: 0;
}

:deep(.edit-question-form .ant-card) {
  overflow: hidden;
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
}

@media (max-width: 480px) {
  .manual-setup {
    padding: 0 8px;
  }

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
}

.inline-progress {
  margin-bottom: 16px;
}
</style>
