<script setup lang="ts">
import type { Question, QuestionForm, QuestionStatus } from '@/types/interview'
import { message } from 'ant-design-vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useInterviewMode } from '@/composables/useInterviewMode'
import { useInterviewStore } from '@/stores/interview/index'
import { EmptyStates } from '../components/EmptyStates'
import { QuestionItem } from '../components/QuestionItem'
import { QuestionListHeader } from '../components/QuestionListHeader'
import ConfirmClearAllModal from '../modal/ConfirmClearAllModal.vue'
import QuestionFilters from '../shared/QuestionFilters.vue'
import StatusProgressBar from '../shared/StatusProgressBar.vue'
import EditQuestionForm from './EditQuestionForm.vue'

const emit = defineEmits<{
  (e: 'questionsChanged'): void
  (e: 'saveAiToUserAnswer', question: Question, aiAnswer: string): void
}>()

const interviewStore = useInterviewStore()
const {
  questionsListCollapsed,
  setQuestionsListCollapsed,
} = useInterviewMode()

const editingQuestion = ref<Question>()
const generatingAnswerId = ref<string | null>(null)
const editFormRef = ref<HTMLElement>()

const isSectionLoading = ref(true)
const isQuestionsListCollapsed = computed(() => questionsListCollapsed.value)

const allQuestions = computed(() => interviewStore.questions)
const isLoading = computed(() => interviewStore.isLoading)

const clearConfirmationVisible = ref(false)

const filteredQuestions = ref<Question[]>([])
const currentFilters = ref<any>(null)

onMounted(() => {
  filteredQuestions.value = [...allQuestions.value]
})

watch(allQuestions, (newQuestions) => {
  filteredQuestions.value = [...newQuestions]

  if (currentFilters.value) {
    handleFilterChange(currentFilters.value)
  }
}, { immediate: true, deep: true })

// Следим за состоянием загрузки и скрываем спиннер когда данные готовы
watch([isLoading, allQuestions], ([loading, questions]) => {
  if (!loading && questions.length >= 0) {
    // Небольшая задержка для плавного перехода
    setTimeout(() => {
      isSectionLoading.value = false
    }, 300)
  }
}, { immediate: true })

// Обработчик изменения фильтров
function handleFilterChange(filters: any) {
  // Сохраняем фильтры в store
  interviewStore.setQuestionFilters(filters)

  // Применяем фильтрацию через store, но только если нет активной сессии
  if (!interviewStore.isSessionActive) {
    filteredQuestions.value = interviewStore.filteredQuestions
  }
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

    // Собираем ID всех вопросов до начала удаления
    const questionIds = allQuestions.value.map(q => q.id).filter(Boolean) as string[]

    if (questionIds.length === 0) {
      message.info('Нет вопросов для удаления')
      return
    }

    // Создаем промисы для удаления по ID
    const deletePromises = questionIds.map(id =>
      interviewStore.removeQuestionById(id),
    )

    // Ждем завершения всех операций удаления
    await Promise.all(deletePromises)

    message.success('Все вопросы удалены')
    emit('questionsChanged')
  }
  catch (error) {
    console.error('Error clearing questions:', error)
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
  await interviewStore.refreshCategories()
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

function shuffleQuestions() {
  interviewStore.shuffleQuestions()
}

const hasActiveFilters = computed(() => {
  const filters = interviewStore.getCurrentFilters()
  return filters.statuses.length > 0
    || filters.difficulties.length > 0
    || filters.categories.length > 0
    || filters.tags.length > 0
})

function clearAllFilters() {
  currentFilters.value = {
    statuses: [],
    difficulties: [],
    categories: [],
    tags: [],
  }
  interviewStore.resetQuestionFilters()
  handleFilterChange(currentFilters.value)
}

function handleStatusClick(status: QuestionStatus) {
  const currentFilters = interviewStore.getCurrentFilters()

  const isStatusSelected = currentFilters.statuses.includes(status)

  if (isStatusSelected) {
    const newStatuses = currentFilters.statuses.filter(s => s !== status)
    const newFilters = {
      ...currentFilters,
      statuses: newStatuses,
    }
    handleFilterChange(newFilters)
  }
  else {
    const newFilters = {
      ...currentFilters,
      statuses: [status],
    }
    handleFilterChange(newFilters)
  }
}

// Обработчик обновления пользовательского ответа
async function updateUserAnswer(question: Question, userAnswer: string) {
  if (!question.id)
    return

  try {
    await interviewStore.updateUserAnswer(question.id, userAnswer)
    message.success(userAnswer ? 'Ответ сохранен' : 'Ответ удален')
  }
  catch (error) {
    console.error('Error updating user answer:', error)
    message.error('Ошибка при сохранении ответа')
  }
}

// Обработчик сохранения ответа ИИ как пользовательского ответа
function saveAiToUserAnswer(question: Question, aiAnswer: string) {
  emit('saveAiToUserAnswer', question, aiAnswer)
}

onMounted(() => {
  interviewStore.loadUserQuestions()
})
</script>

<template>
  <div class="manual-setup">
    <div ref="editFormRef">
      <EditQuestionForm
        :question-to-edit="editingQuestion"
        @submit="addQuestion"
        @cancel="cancelEditing"
      />
    </div>

    <a-divider />

    <div class="questions-list-section">
      <a-spin
        v-if="isSectionLoading"
        size="large"
        class="section-spinner"
        tip="Загрузка вопросов..."
      >
        <div class="spinner-content" />
      </a-spin>

      <template v-else>
        <QuestionFilters
          :questions="allQuestions"
          @filter-change="handleFilterChange"
        />

        <StatusProgressBar
          v-if="allQuestions.length > 0"
          :questions="filteredQuestions"
          class="inline-progress"
          @status-click="handleStatusClick"
        />

        <QuestionListHeader
          :total-count="allQuestions.length"
          :filtered-count="filteredQuestions.length"
          :is-collapsed="isQuestionsListCollapsed"
          @toggle-collapse="toggleQuestionsList"
          @shuffle="shuffleQuestions"
          @clear-all="showClearConfirmation"
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
              <QuestionItem
                :question="item"
                :index="index"
                :generating-answer-id="generatingAnswerId"
                @edit="startEditing"
                @remove="removeQuestion"
                @generate-answer="generateAnswerForQuestion"
                @clear-answer="clearAnswer"
                @update-user-answer="updateUserAnswer"
                @save-ai-to-user-answer="saveAiToUserAnswer"
              />
            </template>
          </a-list>

          <!-- Сообщения когда нет вопросов -->
          <EmptyStates
            v-if="filteredQuestions.length === 0 && !isLoading"
            :has-questions="allQuestions.length > 0"
            :has-active-filters="hasActiveFilters"
            @add-question="scrollToEditForm"
            @clear-filters="clearAllFilters"
          />
        </div>
      </template>
    </div>
  </div>

  <ConfirmClearAllModal
    :open="clearConfirmationVisible"
    :questions-count="allQuestions.length"
    @ok="clearAllQuestions"
    @cancel="handleClearCancel"
  />
</template>

<style scoped>
.manual-setup {
  max-width: 900px;
  margin: 0 auto;
}

.questions-list-section {
  margin-top: 24px;
  position: relative;
  min-height: 200px;
}

.section-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
  width: 100%;
}

.spinner-content {
  min-height: 120px;
}

.collapsed-alert {
  margin-bottom: 16px;
}

.questions-list {
  max-height: 600px;
  overflow-y: auto;
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

@media (max-width: 480px) {
  .manual-setup {
    padding: 0 8px;
  }

  .section-spinner {
    padding: 40px 0;
  }
}

.inline-progress {
  margin-bottom: 16px;
}

/* Анимация появления контента */
.questions-list-section :deep(.ant-spin-container) {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
