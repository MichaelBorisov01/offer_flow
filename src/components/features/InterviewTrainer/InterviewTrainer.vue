<script setup lang="ts">
import type { InterviewMode } from '@/composables/useInterviewMode'
import type { AISettings, Question } from '@/types/interview'
import { message } from 'ant-design-vue'
import { computed, onMounted, ref, watch } from 'vue'
import AppFooter from '@/components/AppFooter.vue'
import { useInterviewMode } from '@/composables/useInterviewMode'
import { useInterviewStore } from '@/stores/interview'
import AIInterviewSession from './sessions/AIInterviewSession.vue'
import ManualInterviewSession from './sessions/ManualInterviewSession.vue'
import AISetup from './setup/AISetup.vue'
import ManualSetup from './setup/ManualSetup.vue'

const interviewStore = useInterviewStore()

const {
  mode,
  setMode,
  aiSettings,
  setAISettings,
  interviewSettings,
  setInterviewSettings,
} = useInterviewMode()

const questions = computed(() => interviewStore.questions)
const isInterviewStarted = computed(() => interviewStore.isInterviewStarted)

// Для управления фокусом
const mainHeadingRef = ref<HTMLElement>()
const modeSelectorRef = ref<HTMLElement>()
const startButtonRef = ref<HTMLElement>()

onMounted(() => {
  // Устанавливаем фокус на заголовок при монтировании
  if (mainHeadingRef.value) {
    mainHeadingRef.value.focus()
  }
})

function handleQuestionsGenerated() {
  message.success('Вопросы сгенерированы! Теперь можно начать собеседование.')
}

function handleAISettingsChanged(newSettings: AISettings) {
  setAISettings(newSettings)
}

function handleModeChange(event: any) {
  const newMode = event.target.value as InterviewMode
  setMode(newMode)
  interviewStore.questions = []

  // Озвучиваем изменение режима для скринридеров
  announceToScreenReader(`Режим изменен на ${newMode === 'manual' ? 'ручной' : 'искусственный интеллект'}`)
}

function handleSettingsChange() {
  setInterviewSettings({ ...interviewSettings.value })
}

function startInterview() {
  if (questions.value.length === 0) {
    message.error('Добавьте вопросы для начала собеседования')
    announceToScreenReader('Нельзя начать собеседование: нет вопросов. Добавьте вопросы сначала.')
    return
  }

  // Обновляем настройки в хранилище с правильной типизацией
  interviewStore.interviewSettings = {
    showProgress: interviewSettings.value.showProgress,
    enableAnswerInput: interviewSettings.value.enableAnswerInput,
  }

  interviewStore.startInterview()
  announceToScreenReader('Собеседование начато. Удачи!')
}

function exitInterview() {
  interviewStore.isInterviewStarted = false
  interviewStore.isSessionActive = false
  interviewStore.clearUserAnswers()
  message.info('Собеседование прервано')
  announceToScreenReader('Собеседование прервано. Вы вернулись в меню выбора режима.')

  // Возвращаем фокус на кнопку начала собеседования
  setTimeout(() => {
    startButtonRef.value?.focus()
  }, 100)
}

async function saveAiToUserAnswer(question: Question, aiAnswer: string) {
  if (!question.id)
    return

  try {
    await interviewStore.updateUserAnswer(question.id, aiAnswer)
    message.success('Ответ ИИ сохранен как ваш ответ!')
    announceToScreenReader('Ответ искусственного интеллекта сохранен как ваш ответ')
  }
  catch (error) {
    console.error('Error saving AI answer to user answer:', error)
    message.error('Ошибка при сохранении ответа ИИ')
    announceToScreenReader('Ошибка при сохранении ответа искусственного интеллекта')
  }
}

// Функция для объявлений скринридерам
function announceToScreenReader(message: string) {
  const announcer = document.getElementById('a11y-announcer')
  if (announcer) {
    announcer.textContent = message
  }
}

watch(mode, (newMode, oldMode) => {
  if (newMode !== oldMode) {
    interviewStore.questions = []
  }
})
</script>

<template>
  <div class="interview-trainer">
    <!-- Область для объявлений скринридера -->
    <div
      id="a11y-announcer"
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    />

    <a-card class="trainer-card">
      <template #extra>
        <a-button
          v-if="isInterviewStarted"
          danger
          size="small"
          class="exit-button"
          aria-label="Выйти из собеседования и вернуться к настройкам"
          @click="exitInterview"
        >
          <span class="exit-text full-text">Выйти из собеседования</span>
          <span class="exit-text short-text">Выйти</span>
        </a-button>
      </template>

      <div v-if="!isInterviewStarted" class="setup-container">
        <div class="welcome-section">
          <h1
            ref="mainHeadingRef"
            class="welcome-heading"
            tabindex="-1"
          >
            Тренажер собеседований
          </h1>

          <p id="welcome-description" class="welcome-text">
            Добро пожаловать в тренажер собеседований! Выберите режим работы:
          </p>

          <!-- Режимы работы -->
          <div
            ref="modeSelectorRef"
            class="mode-selector-container"
            role="radiogroup"
            aria-labelledby="welcome-description"
            aria-describedby="mode-description"
          >
            <span id="mode-description" class="sr-only">
              Выберите между ручным режимом, где вы добавляете вопросы самостоятельно,
              и режимом с искусственным интеллектом, который генерирует вопросы автоматически
            </span>

            <a-radio-group
              v-model:value="mode"
              class="mode-selector"
              button-style="solid"
              @change="handleModeChange"
            >
              <a-radio-button
                value="manual"
                class="mode-button"
                aria-label="Ручной режим: самостоятельное добавление вопросов"
              >
                <div class="mode-content">
                  <span
                    class="mode-icon"
                    aria-hidden="true"
                    role="presentation"
                  >✋</span>
                  <span class="mode-text">Ручной режим</span>
                </div>
              </a-radio-button>
              <a-radio-button
                value="ai"
                class="mode-button"
                aria-label="Режим с искусственным интеллектом: автоматическая генерация вопросов"
              >
                <div class="mode-content">
                  <span
                    class="mode-icon"
                    aria-hidden="true"
                    role="presentation"
                  >🤖</span>
                  <span class="mode-text">Режим с ИИ</span>
                </div>
              </a-radio-button>
            </a-radio-group>
          </div>
        </div>

        <!-- Контент в зависимости от режима -->
        <div class="setup-content">
          <ManualSetup
            v-if="mode === 'manual'"
            class="setup-component"
            @save-ai-to-user-answer="saveAiToUserAnswer"
          />

          <AISetup
            v-else
            :initial-settings="aiSettings"
            class="setup-component"
            @questions-generated="handleQuestionsGenerated"
            @settings-changed="handleAISettingsChanged"
          />
        </div>

        <a-card
          title="Настройки собеседования"
          class="settings-card"
          aria-labelledby="settings-title"
        >
          <template #title>
            <h2 id="settings-title" class="settings-title">
              Настройки собеседования
            </h2>
          </template>

          <a-form layout="vertical">
            <a-form-item class="setting-item">
              <a-checkbox
                v-model:checked="interviewSettings.showProgress"
                class="setting-checkbox"
                aria-label="Показывать прогресс прохождения собеседования"
                @change="handleSettingsChange"
              >
                Показывать прогресс
              </a-checkbox>
            </a-form-item>

            <!-- Дополнительные настройки для ИИ режима -->
            <div v-if="mode === 'ai'" class="ai-settings">
              <a-form-item class="setting-item">
                <a-checkbox
                  v-model:checked="interviewSettings.enableAnswerInput"
                  class="setting-checkbox"
                  aria-label="Включить возможность ввода ответов на вопросы с оценкой искусственного интеллекта"
                  @change="handleSettingsChange"
                >
                  Включить ввод ответа на вопрос
                </a-checkbox>
              </a-form-item>

              <a-alert
                v-if="interviewSettings.enableAnswerInput"
                message="В режиме с ИИ вы сможете отвечать на вопросы и получать оценку ваших ответов"
                type="info"
                show-icon
                class="info-alert"
                role="status"
                aria-live="polite"
              />
            </div>
          </a-form>
        </a-card>

        <div class="start-button-container">
          <a-button
            ref="startButtonRef"
            type="primary"
            size="large"
            :disabled="questions.length === 0"
            class="start-button"
            :aria-disabled="questions.length === 0"
            :aria-label="questions.length === 0
              ? 'Нельзя начать собеседование: сначала добавьте вопросы'
              : 'Начать подготовку к собеседованию'"
            @click="startInterview"
          >
            <span class="start-text full-text">Начать подготовку</span>
            <span class="start-text short-text">Начать</span>
            <template #loading>
              <span class="button-loading">
                <a-spin size="small" />
                <span class="loading-text">Запуск...</span>
              </span>
            </template>
          </a-button>

          <div
            v-if="questions.length === 0"
            class="start-button-hint"
            role="status"
            aria-live="polite"
          >
            <span class="sr-only">Для начала собеседования необходимо добавить вопросы</span>
            <span aria-hidden="true">Добавьте вопросы чтобы начать</span>
          </div>
        </div>
      </div>

      <div v-else class="interview-container">
        <ManualInterviewSession
          v-if="mode === 'manual'"
          @save-ai-to-user-answer="saveAiToUserAnswer"
        />
        <AIInterviewSession v-else />
      </div>
    </a-card>

    <AppFooter v-if="!isInterviewStarted" class="trainer-footer" />
  </div>
</template>

<style scoped>
.interview-trainer {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 16px;
}

.trainer-card {
  max-width: 1000px;
  margin: 0 auto;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Стили для скринридеров */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.exit-button {
  transition: all 0.3s ease;
}

.exit-text.full-text {
  display: inline;
}

.exit-text.short-text {
  display: none;
}

.setup-container {
  padding: 8px 0;
}

.welcome-section {
  text-align: center;
  margin-bottom: 24px;
}

.welcome-heading {
  font-size: 24px;
  font-weight: 700;
  color: #262626;
  margin-bottom: 16px;
  line-height: 1.3;
  outline: none;
}

.welcome-heading:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
  border-radius: 4px;
}

.welcome-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
}

.mode-selector-container {
  margin: 0 auto;
  max-width: 400px;
}

.mode-selector {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.mode-button {
  flex: 1;
  border: none;
  height: auto;
  padding: 16px 8px;
  position: relative;
}

.mode-button:focus-visible {
  outline: 3px solid #1890ff;
  outline-offset: -2px;
  z-index: 1;
}

.mode-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.mode-icon {
  font-size: 20px;
}

.mode-text {
  font-size: 14px;
  font-weight: 500;
}

.setup-content {
  margin: 24px 0;
}

.setup-component {
  transition: all 0.3s ease;
}

.settings-card {
  margin-top: 24px;
  border-radius: 8px;
}

.settings-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #262626;
}

.setting-item {
  margin-bottom: 12px;
}

.setting-checkbox {
  font-size: 14px;
}

.setting-checkbox :deep(.ant-checkbox) {
  border-radius: 4px;
}

.setting-checkbox :deep(.ant-checkbox-input:focus-visible + .ant-checkbox-inner) {
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.ai-settings {
  margin-top: 16px;
}

.info-alert {
  margin-top: 12px;
}

.start-button-container {
  margin-top: 32px;
  text-align: center;
}

.start-button {
  width: 100%;
  max-width: 300px;
  height: 48px;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
}

.start-button:focus-visible {
  outline: 3px solid #1890ff;
  outline-offset: 2px;
}

.start-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.start-button:disabled:focus-visible {
  outline-color: #8c8c8c;
}

.start-text.full-text {
  display: inline;
}

.start-text.short-text {
  display: none;
}

.button-loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-text {
  font-size: 14px;
  font-weight: 500;
}

.start-button-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #8c8c8c;
  font-style: italic;
}

.trainer-footer {
  margin-top: 32px;
}

.interview-container {
  min-height: 400px;
}

/* Улучшенная доступность для карточки */
:deep(.trainer-card .ant-card-body) {
  padding: 20px;
}

:deep(.trainer-card .ant-card-head) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.trainer-card .ant-card-extra) {
  padding: 0;
}

/* Улучшенная доступность для радиокнопок */
:deep(.mode-selector .ant-radio-button-wrapper) {
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

:deep(.mode-selector .ant-radio-button-wrapper:focus-within) {
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

:deep(.mode-selector .ant-radio-button-wrapper-checked) {
  border-color: #1890ff;
}

@media (max-width: 1024px) {
  .interview-trainer {
    padding: 12px;
  }

  .trainer-card {
    max-width: 900px;
  }

  .welcome-heading {
    font-size: 22px;
  }

  .welcome-text {
    font-size: 15px;
  }

  .mode-selector-container {
    max-width: 350px;
  }

  .mode-button {
    padding: 14px 6px;
  }

  .mode-icon {
    font-size: 18px;
  }

  .mode-text {
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .interview-trainer {
    padding: 8px;
    background: #f0f2f5;
  }

  .trainer-card {
    border-radius: 8px;
    margin: 0 auto;
  }

  .exit-text.full-text {
    display: none;
  }

  .exit-text.short-text {
    display: inline;
  }

  .welcome-section {
    margin-bottom: 20px;
  }

  .welcome-heading {
    font-size: 20px;
    text-align: left;
  }

  .welcome-text {
    font-size: 14px;
    margin-bottom: 16px;
    text-align: left;
  }

  .mode-selector-container {
    max-width: 100%;
  }

  .mode-selector {
    flex-direction: column;
    border-radius: 12px;
    overflow: visible;
    gap: 8px;
    box-shadow: none;
  }

  .mode-button {
    border-radius: 8px !important;
    padding: 12px 16px;
    border: 2px solid #d9d9d9 !important;
  }

  .mode-content {
    flex-direction: row;
    justify-content: center;
    gap: 12px;
  }

  .mode-icon {
    font-size: 16px;
  }

  .mode-text {
    font-size: 14px;
  }

  .setup-content {
    margin: 20px 0;
  }

  .settings-card {
    margin-top: 20px;
  }

  .start-button-container {
    margin-top: 24px;
  }

  .start-button {
    max-width: 100%;
    height: 44px;
    border-radius: 8px;
  }

  .start-text.full-text {
    display: none;
  }

  .start-text.short-text {
    display: inline;
  }

  :deep(.trainer-card .ant-card-body) {
    padding: 16px;
  }

  :deep(.trainer-card .ant-card-head) {
    padding: 12px 16px;
  }
}

@media (max-width: 480px) {
  .interview-trainer {
    padding: 4px;
  }

  .trainer-card {
    border-radius: 6px;
  }

  .welcome-heading {
    font-size: 18px;
  }

  .welcome-text {
    font-size: 13px;
    margin-bottom: 12px;
  }

  .mode-button {
    padding: 10px 12px;
  }

  .mode-content {
    gap: 8px;
  }

  .mode-icon {
    font-size: 14px;
  }

  .mode-text {
    font-size: 13px;
  }

  .setup-content {
    margin: 16px 0;
  }

  .settings-card {
    margin-top: 16px;
  }

  .setting-checkbox {
    font-size: 13px;
  }

  .start-button {
    margin-top: 20px;
    height: 42px;
    font-size: 14px;
  }

  .button-loading {
    gap: 6px;
  }

  .loading-text {
    font-size: 13px;
  }

  :deep(.trainer-card .ant-card-body) {
    padding: 12px;
  }

  :deep(.trainer-card .ant-card-head) {
    padding: 10px 12px;
  }

  .trainer-footer {
    margin-top: 24px;
  }
}

@media (max-width: 360px) {
  .welcome-heading {
    font-size: 16px;
  }

  .welcome-text {
    font-size: 12px;
  }

  .mode-button {
    padding: 8px 10px;
  }

  .mode-content {
    gap: 6px;
  }

  .mode-icon {
    font-size: 12px;
  }

  .mode-text {
    font-size: 12px;
  }

  .start-button {
    height: 40px;
    font-size: 13px;
  }
}

/* Улучшения для touch-устройств */
@media (hover: none) and (pointer: coarse) {
  .mode-button {
    min-height: 50px;
  }

  .start-button {
    min-height: 48px;
  }

  .exit-button {
    min-height: 36px;
    padding: 8px 12px;
  }

  /* Увеличиваем области касания */
  .setting-checkbox :deep(.ant-checkbox-wrapper) {
    padding: 8px 0;
  }
}

/* Улучшения для пользователей, предпочитающих убрать анимацию */
@media (prefers-reduced-motion: reduce) {
  .mode-button,
  .start-button,
  .exit-button,
  .setting-checkbox {
    transition: none;
  }

  .start-button:not(:disabled):hover {
    transform: none;
  }
}

/* Высококонтрастный режим */
@media (prefers-contrast: high) {
  .interview-trainer {
    background: #ffffff;
    border: 2px solid #000000;
  }

  .trainer-card {
    border: 2px solid #000000;
  }

  .mode-button {
    border-color: #000000 !important;
  }

  .mode-button:focus-visible {
    outline: 3px solid #000000;
  }

  .start-button:focus-visible {
    outline: 3px solid #000000;
  }
}

/* Улучшенная фокусировка для клавиатурной навигации */
.mode-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.start-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.start-button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.start-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>
