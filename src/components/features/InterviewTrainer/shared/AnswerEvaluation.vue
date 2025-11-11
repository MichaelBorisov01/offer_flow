<script setup lang="ts">
import type { UserAnswer } from '@/types/interview'
import { BulbOutlined, CheckOutlined, EditOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { getScoreColor } from '@/utils/helpers/scoreHelpers'

interface Props {
  questionId: string
  questionText: string
  evaluating?: boolean
  userAnswer?: UserAnswer
  aiAnswerLoading?: boolean
}

interface Emits {
  (e: 'submit', answer: string): void
  (e: 'skip'): void
  (e: 'next'): void
  (e: 'edit'): void
  (e: 'showAiAnswer'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localAnswer = ref('')
const submittedAnswer = ref<UserAnswer>()
const showEvaluationModal = ref(false)

// Синхронизируем с переданным ответом
watch(() => props.userAnswer, (newAnswer) => {
  if (newAnswer) {
    submittedAnswer.value = newAnswer
    localAnswer.value = newAnswer.userAnswer
  }
}, { immediate: true })

function submitAnswer() {
  if (!localAnswer.value.trim())
    return

  showEvaluationModal.value = true
  emit('submit', localAnswer.value.trim())

  // Скрываем модалку через 3 секунды (на случай если оценка затянется)
  setTimeout(() => {
    showEvaluationModal.value = false
  }, 3000)
}

function skipAnswer() {
  emit('skip')
}

function nextQuestion() {
  emit('next')
}

function editAnswer() {
  submittedAnswer.value = undefined
  emit('edit')
}

function showAIAnswer() {
  emit('showAiAnswer')
}
</script>

<template>
  <div class="answer-evaluation">
    <!-- Поле для ввода ответа -->
    <div v-if="!submittedAnswer" class="answer-input-section">
      <a-form-item label="Ваш ответ:" class="answer-input">
        <a-textarea
          v-model:value="localAnswer"
          placeholder="Введите ваш развернутый ответ на вопрос..."
          :rows="5"
          :auto-size="{ minRows: 4, maxRows: 10 }"
          show-count
          :maxlength="2000"
          :disabled="evaluating"
        />
      </a-form-item>

      <div class="answer-actions">
        <a-button
          type="primary"
          :loading="evaluating"
          :disabled="!localAnswer.trim()"
          size="large"
          @click="submitAnswer"
        >
          <CheckOutlined />
          Отправить на оценку
        </a-button>

        <a-button
          :disabled="evaluating"
          size="large"
          @click="skipAnswer"
        >
          Пропустить вопрос
        </a-button>
      </div>
    </div>

    <!-- Результат оценки -->
    <div v-else class="evaluation-result">
      <a-card title="Оценка вашего ответа" class="evaluation-card">
        <template #extra>
          <a-tag :color="getScoreColor(submittedAnswer.evaluation!.score)" class="score-tag">
            {{ submittedAnswer.evaluation!.score }}/10
          </a-tag>
        </template>

        <!-- Обратная связь -->
        <div class="feedback-section">
          <h4>💡 Обратная связь:</h4>
          <p class="feedback-text">
            {{ submittedAnswer.evaluation!.feedback }}
          </p>
        </div>

        <!-- Предложения для улучшения -->
        <div class="suggestions-section">
          <h4>🚀 Предложения для улучшения:</h4>
          <ul class="suggestions-list">
            <li v-for="(suggestion, index) in submittedAnswer.evaluation!.suggestions" :key="index">
              {{ suggestion }}
            </li>
          </ul>
        </div>

        <!-- Действия после оценки -->
        <div class="post-evaluation-actions">
          <a-space>
            <a-button
              type="primary"
              size="large"
              @click="nextQuestion"
            >
              Следующий вопрос
            </a-button>

            <a-button
              size="large"
              @click="editAnswer"
            >
              <EditOutlined />
              Исправить ответ
            </a-button>

            <a-button
              type="link"
              size="large"
              :loading="aiAnswerLoading"
              :disabled="aiAnswerLoading"
              @click="showAIAnswer"
            >
              <BulbOutlined />
              {{ aiAnswerLoading ? 'Генерация ответа...' : 'Посмотреть ответ ИИ' }}
            </a-button>
          </a-space>
        </div>
      </a-card>
    </div>

    <!-- Индикатор оценки -->
    <a-modal
      v-model:open="showEvaluationModal"
      title="Оценка ответа"
      :footer="null"
      :closable="false"
      centered
    >
      <div class="evaluation-loading">
        <a-spin size="large" />
        <p>ИИ оценивает ваш ответ...</p>
        <p class="loading-subtext">
          Это может занять несколько секунд
        </p>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.answer-evaluation {
  margin-top: 24px;
}

.answer-input-section {
  border: 2px dashed #e8f4ff;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
}

.answer-input :deep(.ant-form-item-label) {
  font-weight: 600;
  font-size: 16px;
}

.answer-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}

.evaluation-card {
  border: 2px solid #e8f4ff;
  border-radius: 8px;
}

.score-tag {
  font-size: 16px;
  font-weight: bold;
  padding: 4px 12px;
}

.feedback-section {
  margin-bottom: 20px;
}

.feedback-section h4 {
  color: #1890ff;
  margin-bottom: 8px;
}

.feedback-text {
  line-height: 1.6;
  color: #262626;
  background: #f6ffed;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #52c41a;
}

.suggestions-section {
  margin-bottom: 24px;
}

.suggestions-section h4 {
  color: #722ed1;
  margin-bottom: 8px;
}

.suggestions-list {
  padding-left: 20px;
  color: #262626;
}

.suggestions-list li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.post-evaluation-actions {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
  text-align: center;
}

.evaluation-loading {
  text-align: center;
  padding: 20px;
}

.evaluation-loading p {
  margin-top: 12px;
  font-size: 16px;
  color: #1890ff;
}

.loading-subtext {
  font-size: 14px !important;
  color: #8c8c8c !important;
  margin-top: 4px !important;
}

:deep(.ant-modal-body) {
  padding: 40px 24px;
}
</style>
