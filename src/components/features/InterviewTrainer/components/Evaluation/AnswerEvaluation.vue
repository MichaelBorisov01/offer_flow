<script setup lang="ts">
import type { UserAnswer } from '@/types/interview.ts'
import { BulbOutlined, CheckOutlined, EditOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { onUnmounted, ref, watch } from 'vue'
import { getScoreColor } from '@/utils/helpers/scoreHelpers.ts'

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

// Лимиты и кулдауны
const MAX_ATTEMPTS = 3
const evalAttempts = ref(0)
const evalCooldown = ref(0)
const aiAttempts = ref(0)
const aiCooldown = ref(0)

let evalTimer: number | null = null
let aiTimer: number | null = null

watch(() => props.userAnswer, (newAnswer) => {
  if (newAnswer) {
    submittedAnswer.value = newAnswer
    localAnswer.value = newAnswer.userAnswer
  }
}, { immediate: true })

function startEvalCooldown() {
  if (evalTimer)
    clearInterval(evalTimer)
  evalCooldown.value = 10
  evalTimer = window.setInterval(() => {
    evalCooldown.value--
    if (evalCooldown.value <= 0) {
      clearInterval(evalTimer!)
      evalTimer = null
    }
  }, 1000)
}

function startAiCooldown() {
  if (aiTimer)
    clearInterval(aiTimer)
  aiCooldown.value = 10
  aiTimer = window.setInterval(() => {
    aiCooldown.value--
    if (aiCooldown.value <= 0) {
      clearInterval(aiTimer!)
      aiTimer = null
    }
  }, 1000)
}

function submitAnswer() {
  if (!localAnswer.value.trim())
    return

  if (evalAttempts.value >= MAX_ATTEMPTS) {
    message.warning('Вы исчерпали лимит проверок (3 раза) для этого вопроса.')
    return
  }

  if (evalCooldown.value > 0)
    return

  evalAttempts.value++
  startEvalCooldown()
  showEvaluationModal.value = true
  emit('submit', localAnswer.value.trim())

  setTimeout(() => {
    showEvaluationModal.value = false
  }, 3000)
}

function showAIAnswer() {
  if (aiAttempts.value >= MAX_ATTEMPTS) {
    message.warning('Вы исчерпали лимит генерации ответов ИИ (3 раза) для этого вопроса.')
    return
  }

  if (aiCooldown.value > 0)
    return

  aiAttempts.value++
  startAiCooldown()
  emit('showAiAnswer')
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

onUnmounted(() => {
  if (evalTimer)
    clearInterval(evalTimer)
  if (aiTimer)
    clearInterval(aiTimer)
})
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
          :disabled="!localAnswer.trim() || evalCooldown > 0 || evalAttempts >= MAX_ATTEMPTS"
          size="large"
          class="submit-button mobile-action-btn"
          @click="submitAnswer"
        >
          <CheckOutlined v-if="evalCooldown === 0 && evalAttempts < MAX_ATTEMPTS" />
          <span class="button-text">
            <template v-if="evalAttempts >= MAX_ATTEMPTS">Лимит проверок (3/3)</template>
            <template v-else-if="evalCooldown > 0">Подождите {{ evalCooldown }} сек</template>
            <template v-else>Отправить на оценку</template>
          </span>
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

        <div class="feedback-section">
          <h4 class="section-title feedback-title">
            <span class="emoji">💡</span> Обратная связь:
          </h4>
          <p class="feedback-text">
            {{ submittedAnswer.evaluation!.feedback }}
          </p>
        </div>

        <div class="suggestions-section">
          <h4 class="section-title suggestions-title">
            <span class="emoji">🚀</span> Предложения для улучшения:
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

        <div class="post-evaluation-actions">
          <div class="action-buttons">
            <a-button
              v-if="isLastQuestion"
              type="primary"
              size="large"
              class="next-button mobile-action-btn"
              @click="finishInterview"
            >
              <span class="button-text">Завершить собеседование</span>
            </a-button>

            <a-button
              v-else
              type="primary"
              size="large"
              class="next-button success-btn mobile-action-btn"
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
              :disabled="aiAnswerLoading || aiCooldown > 0 || aiAttempts >= MAX_ATTEMPTS"
              class="ai-answer-button mobile-action-btn"
              @click="showAIAnswer"
            >
              <BulbOutlined v-if="aiCooldown === 0 && aiAttempts < MAX_ATTEMPTS" />
              <span class="button-text">
                <template v-if="aiAttempts >= MAX_ATTEMPTS">Лимит (3/3)</template>
                <template v-else-if="aiCooldown > 0">Ожидание {{ aiCooldown }} сек</template>
                <template v-else-if="aiAnswerLoading">Генерация ответа...</template>
                <template v-else>Посмотреть ответ ИИ</template>
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
  border: 2px dashed var(--ant-color-border);
  border-radius: 12px;
  padding: 20px;
  background: var(--ant-color-fill-quaternary);
  transition: all 0.3s ease;
}

.answer-input-section:hover,
.answer-input-section:focus-within {
  border-color: var(--ant-color-primary-border);
}

.answer-input :deep(.ant-form-item-label) {
  font-weight: 600;
  font-size: 16px;
  padding-bottom: 8px;
}

.answer-input :deep(.ant-form-item-label > label) {
  font-size: 16px;
  height: auto;
  color: var(--ant-color-text);
}

.answer-textarea :deep(textarea) {
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  min-height: 120px;
  background: var(--ant-color-bg-container);
  color: var(--ant-color-text);
}

.answer-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
  flex-wrap: wrap;
}

.evaluation-card {
  border: 2px solid var(--ant-color-border-secondary);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  background: var(--ant-color-bg-container);
}

.evaluation-card :deep(.ant-card-head) {
  border-bottom: 1px solid var(--ant-color-border-secondary);
  padding: 16px 20px;
}

.evaluation-card :deep(.ant-card-head-title) {
  color: var(--ant-color-text);
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

.feedback-section,
.suggestions-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.feedback-title {
  color: var(--ant-color-success);
}

.suggestions-title {
  color: var(--ant-color-primary);
}

.emoji {
  font-size: 18px;
}

.feedback-text {
  line-height: 1.6;
  color: var(--ant-color-text);
  background: var(--ant-color-success-bg);
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid var(--ant-color-success);
  margin: 0;
  font-size: 14px;
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
  background: var(--ant-color-primary-bg);
  border-radius: 8px;
  border-left: 4px solid var(--ant-color-primary);
  color: var(--ant-color-text);
  font-size: 14px;
  position: relative;
}

.suggestion-item:before {
  content: "•";
  color: var(--ant-color-primary);
  font-weight: bold;
  position: absolute;
  left: 8px;
}

.post-evaluation-actions {
  border-top: 1px solid var(--ant-color-border-secondary);
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

.skip-button {
  background: var(--ant-color-bg-container);
  color: var(--ant-color-text-secondary);
  border-color: var(--ant-color-border);
}

.skip-button:hover {
  border-color: var(--ant-color-primary);
  color: var(--ant-color-primary);
}

.success-btn {
  background: var(--ant-color-success);
  border-color: var(--ant-color-success);
}

.success-btn:hover {
  background: var(--ant-color-success-hover);
  border-color: var(--ant-color-success-hover);
}

.edit-button {
  border-color: var(--ant-color-primary);
  color: var(--ant-color-primary);
  background: var(--ant-color-bg-container);
}

.edit-button:hover {
  background: var(--ant-color-primary-bg);
  border-color: var(--ant-color-primary-hover);
  color: var(--ant-color-primary-hover);
}

.ai-answer-button {
  height: auto;
  min-height: 44px;
  padding: 12px 16px;
}

.ai-answer-button:hover {
  background: var(--ant-color-primary-bg);
}

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

.mobile-action-btn:focus-visible {
  outline: 2px solid var(--ant-color-primary);
  outline-offset: 2px;
}

/* Адаптивность */
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

@media (max-width: 768px) {
  .answer-evaluation {
    margin-top: 16px;
  }

  :deep(.ant-form-item) {
    margin-bottom: 16px;
  }
  :deep(.ant-btn-loading-icon) {
    font-size: 16px;
  }
  :deep(.ant-btn > .anticon + span) {
    margin-left: 6px;
  }

  .answer-input-section {
    display: flex;
    flex-direction: column;
    padding: 16px;
    border-width: 1px;
    margin: 0 -8px;
    border-radius: 8px;
  }
  .answer-input {
    display: flex;
    flex-direction: column;
    margin-bottom: 0;
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
</style>
