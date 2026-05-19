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
  isLastQuestion?: boolean
}

interface Emits {
  (e: 'submit', answer: string): void
  (e: 'skip'): void
  (e: 'next'): void
  (e: 'finish'): void
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

function finishInterview() {
  emit('finish')
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
          class="answer-textarea"
        />
      </a-form-item>

      <div class="answer-actions">
        <a-button
          type="primary"
          :loading="evaluating"
          :disabled="!localAnswer.trim()"
          size="large"
          class="submit-button mobile-action-btn"
          @click="submitAnswer"
        >
          <CheckOutlined />
          <span class="button-text">Отправить на оценку</span>
        </a-button>

        <a-button
          :disabled="evaluating"
          size="large"
          class="skip-button mobile-action-btn"
          @click="skipAnswer"
        >
          <span class="button-text">Пропустить вопрос</span>
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
          <h4 class="section-title">
            <span class="emoji">💡</span>
            Обратная связь:
          </h4>
          <p class="feedback-text">
            {{ submittedAnswer.evaluation!.feedback }}
          </p>
        </div>

        <!-- Предложения для улучшения -->
        <div class="suggestions-section">
          <h4 class="section-title">
            <span class="emoji">🚀</span>
            Предложения для улучшения:
          </h4>
          <ul class="suggestions-list">
            <li
              v-for="(suggestion, index) in submittedAnswer.evaluation!.suggestions"
              :key="index"
              class="suggestion-item"
            >
              {{ suggestion }}
            </li>
          </ul>
        </div>

        <!-- Действия после оценки -->
        <div class="post-evaluation-actions">
          <div class="action-buttons">
            <a-button
              v-if="isLastQuestion"
              type="primary"
              size="large"
              class="next-button mobile-action-btn finish-mode"
              @click="finishInterview"
            >
              <span class="button-text">Завершить собеседование</span>
            </a-button>

            <a-button
              v-else
              type="primary"
              size="large"
              class="next-button mobile-action-btn"
              @click="nextQuestion"
            >
              <span class="button-text">Следующий вопрос</span>
            </a-button>

            <a-button
              size="large"
              class="edit-button mobile-action-btn"
              @click="editAnswer"
            >
              <EditOutlined />
              <span class="button-text">Исправить ответ</span>
            </a-button>

            <a-button
              type="link"
              size="large"
              :loading="aiAnswerLoading"
              :disabled="aiAnswerLoading"
              class="ai-answer-button mobile-action-btn"
              @click="showAIAnswer"
            >
              <BulbOutlined />
              <span class="button-text">
                {{ aiAnswerLoading ? 'Генерация ответа...' : 'Посмотреть ответ ИИ' }}
              </span>
            </a-button>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<style scoped>
.answer-evaluation {
  margin-top: 24px;
}

.answer-input-section {
  border: 2px dashed #e8f4ff;
  border-radius: 12px;
  padding: 20px;
  background: #fafafa;
}

.answer-input :deep(.ant-form-item-label) {
  font-weight: 600;
  font-size: 16px;
  padding-bottom: 8px;
}

.answer-input :deep(.ant-form-item-label > label) {
  font-size: 16px;
  height: auto;
}

.answer-textarea :deep(textarea) {
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  min-height: 120px;
}

.answer-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
  flex-wrap: wrap;
}

.evaluation-card {
  border: 2px solid #e8f4ff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.evaluation-card :deep(.ant-card-head) {
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 20px;
}

.evaluation-card :deep(.ant-card-body) {
  padding: 20px;
}

.score-tag {
  font-size: 16px;
  font-weight: bold;
  padding: 6px 12px;
  border-radius: 6px;
  margin: 0;
}

.feedback-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1890ff;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.emoji {
  font-size: 18px;
}

.feedback-text {
  line-height: 1.6;
  color: #262626;
  background: #f6ffed;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #52c41a;
  margin: 0;
  font-size: 14px;
}

.suggestions-section {
  margin-bottom: 24px;
}

.suggestions-section .section-title {
  color: #722ed1;
}

.suggestions-list {
  padding-left: 0;
  margin: 0;
  list-style: none;
}

.suggestion-item {
  margin-bottom: 12px;
  line-height: 1.5;
  padding: 12px 16px;
  background: #f9f0ff;
  border-radius: 8px;
  border-left: 4px solid #722ed1;
  font-size: 14px;
  position: relative;
}

.suggestion-item:before {
  content: "•";
  color: #722ed1;
  font-weight: bold;
  position: absolute;
  left: 8px;
}

.post-evaluation-actions {
  border-top: 1px solid #f0f0f0;
  padding-top: 20px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

/* Универсальные стили для мобильных кнопок */
.mobile-action-btn {
  height: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  border-radius: 8px;
  padding: 0 20px;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.mobile-action-btn :deep(.anticon) {
  font-size: 16px;
}

.button-text {
  display: inline-block;
  font-weight: 500;
}

.submit-button {
  background: #1890ff;
  border-color: #1890ff;
}

.submit-button:hover {
  background: #40a9ff;
  border-color: #40a9ff;
  transform: translateY(-1px);
}

.skip-button {
  border: 1px solid #d9d9d9;
  background: #ffffff;
  color: #595959;
}

.skip-button:hover {
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-1px);
}

.next-button {
  background: #52c41a;
  border-color: #52c41a;
}

.next-button:hover {
  background: #73d13d;
  border-color: #73d13d;
  transform: translateY(-1px);
}

.next-button.finish-mode {
  background: #1890ff;
  border-color: #1890ff;
}

.next-button.finish-mode:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

.edit-button {
  border: 1px solid #1890ff;
  color: #1890ff;
  background: #ffffff;
}

.edit-button:hover {
  background: #f0f7ff;
  border-color: #40a9ff;
  color: #40a9ff;
  transform: translateY(-1px);
}

.ai-answer-button {
  color: #722ed1;
  height: auto;
  min-height: 44px;
  padding: 12px 16px;
}

.ai-answer-button:hover {
  color: #9254de;
  background: #f9f0ff;
}

@media (max-width: 768px) {
  .answer-evaluation {
    margin-top: 16px;
  }

  .answer-input-section {
    display: flex;
    flex-direction: column;
    padding: 16px;
    border-width: 1px;
    margin: 0 -8px;
    border-radius: 8px;
  }

  /* Принудительно ставим label над textarea для мобильных */
  .answer-input {
    display: flex;
    flex-direction: column;
    margin-bottom: 0; /* Убираем лишний отступ снизу */
  }

  .answer-input :deep(.ant-form-item-label) {
    text-align: left;
    font-size: 15px;
    padding-bottom: 4px;
  }

  .answer-input :deep(.ant-form-item-control) {
    width: 100%;
  }

  .answer-textarea :deep(textarea) {
    font-size: 16px;
    min-height: 140px;
  }

  /* Выстраиваем кнопки в колонку */
  .answer-actions {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 12px;
    margin-top: 16px;
  }

  .answer-actions .mobile-action-btn {
    width: 100%;
    margin: 0;
  }

  .evaluation-card {
    margin: 0 -8px;
    border-radius: 8px;
    border-width: 1px;
  }

  .evaluation-card :deep(.ant-card-head) {
    padding: 12px 16px;
  }

  .evaluation-card :deep(.ant-card-body) {
    padding: 16px;
  }

  .evaluation-card :deep(.ant-card-head-title) {
    font-size: 16px;
    white-space: normal;
    line-height: 1.4;
  }

  .score-tag {
    font-size: 14px;
    padding: 4px 10px;
  }

  .section-title {
    font-size: 15px;
    margin-bottom: 10px;
  }

  .feedback-text {
    padding: 12px;
    font-size: 14px;
    line-height: 1.5;
  }

  .suggestion-item {
    padding: 10px 12px 10px 20px;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .suggestion-item:before {
    left: 6px;
  }

  .post-evaluation-actions {
    padding-top: 16px;
  }

  .action-buttons {
    gap: 8px;
  }

  .mobile-action-btn {
    height: 44px;
    min-height: 44px;
    font-size: 14px;
  }

  .ai-answer-button {
    min-height: 40px;
    padding: 10px 14px;
  }

  .mobile-action-btn:active {
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }
}

@media (max-width: 360px) {
  .answer-input-section {
    padding: 12px;
  }

  .answer-input :deep(.ant-form-item-label) {
    font-size: 14px;
  }

  .answer-textarea :deep(textarea) {
    font-size: 15px;
    min-height: 120px;
  }

  .evaluation-card :deep(.ant-card-head) {
    padding: 10px 12px;
  }

  .evaluation-card :deep(.ant-card-body) {
    padding: 12px;
  }

  .feedback-text {
    padding: 10px;
    font-size: 13px;
  }

  .suggestion-item {
    padding: 8px 10px 8px 18px;
    font-size: 13px;
  }

  .mobile-action-btn {
    height: 42px;
    min-height: 42px;
    font-size: 13px;
    padding: 0 16px;
  }

  .button-text {
    font-size: 13px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .answer-actions {
    flex-direction: row;
    flex-wrap: nowrap;
  }

  .answer-actions .mobile-action-btn {
    flex: 1;
    min-width: 0;
  }

  .action-buttons {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .action-buttons .mobile-action-btn {
    flex: 1;
    min-width: 200px;
  }

  .ai-answer-button {
    flex-basis: 100%;
    margin-top: 8px;
  }
}

/* Улучшение читаемости длинного текста */
.feedback-text,
.suggestion-item {
  word-break: break-word;
  hyphens: auto;
  -webkit-hyphens: auto;
}

/* Плавные анимации для всех интерактивных элементов */
.answer-input-section,
.evaluation-card,
.mobile-action-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Улучшение фокуса для accessibility */
.mobile-action-btn:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}

.answer-textarea :deep(textarea:focus) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
</style>

<style>
/* Глобальные стили для улучшения мобильного опыта */
@media (max-width: 768px) {
  .answer-evaluation .ant-form-item {
    margin-bottom: 16px;
  }

  .answer-evaluation .ant-btn-loading-icon {
    font-size: 16px;
  }

  .answer-evaluation .ant-btn > .anticon + span {
    margin-left: 6px;
  }
}
</style>
