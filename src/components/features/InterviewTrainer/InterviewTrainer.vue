<script setup lang="ts">
import type { InterviewMode } from '@/composables/useInterviewMode'
import type { AISettings, Question } from '@/types/interview'
import { message } from 'ant-design-vue'
import { computed, watch } from 'vue'
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

// Обработчик сгенерированных вопросов от ИИ
function handleQuestionsGenerated() {
  message.success('Вопросы сгенерированы! Теперь можно начать собеседование.')
}

// Обработчик изменения настроек ИИ
function handleAISettingsChanged(newSettings: AISettings) {
  setAISettings(newSettings)
}

function handleModeChange(event: any) {
  const newMode = event.target.value as InterviewMode
  setMode(newMode)
  // При смене режима очищаем вопросы
  interviewStore.questions = []
}

// Обработчик изменения настроек
function handleSettingsChange() {
  setInterviewSettings({ ...interviewSettings.value })
}

function startInterview() {
  if (questions.value.length === 0) {
    message.error('Добавьте вопросы для начала собеседования')
    return
  }

  // Обновляем настройки в хранилище с правильной типизацией
  interviewStore.interviewSettings = {
    showProgress: interviewSettings.value.showProgress,
    enableAnswerInput: interviewSettings.value.enableAnswerInput,
  }

  interviewStore.startInterview()
}

function exitInterview() {
  interviewStore.isInterviewStarted = false
  interviewStore.isSessionActive = false
  interviewStore.clearUserAnswers()
  message.info('Собеседование прервано')
}

// Обработчик сохранения ответа ИИ как пользовательского ответа
async function saveAiToUserAnswer(question: Question, aiAnswer: string) {
  if (!question.id)
    return

  try {
    await interviewStore.updateUserAnswer(question.id, aiAnswer)
    message.success('Ответ ИИ сохранен как ваш ответ!')
  }
  catch (error) {
    console.error('Error saving AI answer to user answer:', error)
    message.error('Ошибка при сохранении ответа ИИ')
  }
}

// Следим за изменением режима и очищаем вопросы
watch(mode, (newMode, oldMode) => {
  if (newMode !== oldMode) {
    interviewStore.questions = []
  }
})
</script>

<template>
  <div class="interview-trainer">
    <a-card class="trainer-card">
      <template #extra>
        <a-button
          v-if="isInterviewStarted"
          danger
          size="small"
          class="exit-button"
          @click="exitInterview"
        >
          <span class="exit-text full-text">Выйти из собеседования</span>
          <span class="exit-text short-text">Выйти</span>
        </a-button>
      </template>

      <div v-if="!isInterviewStarted" class="setup-container">
        <div class="welcome-section">
          <p class="welcome-text">
            Добро пожаловать в тренажер собеседований! Выберите режим работы:
          </p>

          <!-- Режимы работы -->
          <a-radio-group
            v-model:value="mode"
            class="mode-selector"
            button-style="solid"
            @change="handleModeChange"
          >
            <a-radio-button value="manual" class="mode-button">
              <div class="mode-content">
                <span class="mode-icon">✋</span>
                <span class="mode-text">Ручной режим</span>
              </div>
            </a-radio-button>
            <a-radio-button value="ai" class="mode-button">
              <div class="mode-content">
                <span class="mode-icon">🤖</span>
                <span class="mode-text">Режим с ИИ</span>
              </div>
            </a-radio-button>
          </a-radio-group>
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

        <a-card title="Настройки собеседования" class="settings-card">
          <a-form layout="vertical">
            <a-form-item class="setting-item">
              <a-checkbox
                v-model:checked="interviewSettings.showProgress"
                class="setting-checkbox"
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
              />
            </div>
          </a-form>
        </a-card>

        <a-button
          type="primary"
          size="large"
          :disabled="questions.length === 0"
          class="start-button"
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

.welcome-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
}

.mode-selector {
  margin: 0 auto;
  max-width: 400px;
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

.setting-item {
  margin-bottom: 12px;
}

.setting-checkbox {
  font-size: 14px;
}

.ai-settings {
  margin-top: 16px;
}

.info-alert {
  margin-top: 12px;
}

.start-button {
  margin-top: 32px;
  width: 100%;
  max-width: 300px;
  height: 48px;
  font-weight: 600;
  border-radius: 8px;
  display: block;
  margin-left: auto;
  margin-right: auto;
  transition: all 0.3s ease;
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

.trainer-footer {
  margin-top: 32px;
}

.interview-container {
  min-height: 400px;
}

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

@media (max-width: 1024px) {
  .interview-trainer {
    padding: 12px;
  }

  .trainer-card {
    max-width: 900px;
  }

  .welcome-text {
    font-size: 15px;
  }

  .mode-selector {
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

  .welcome-text {
    font-size: 14px;
    margin-bottom: 16px;
    text-align: left;
  }

  .mode-selector {
    max-width: 100%;
    flex-direction: column;
    border-radius: 12px;
    overflow: visible;
    gap: 8px;
    box-shadow: none;
  }

  .mode-button {
    border-radius: 8px !important;
    padding: 12px 16px;
    border: 1px solid #d9d9d9 !important;
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

  .start-button {
    margin-top: 24px;
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
}

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
