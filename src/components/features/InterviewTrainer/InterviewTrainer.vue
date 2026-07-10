<script setup lang="ts">
import type { AISettings, Question } from '@/types/interview'
import { message } from 'ant-design-vue'
import { computed } from 'vue'
import AppFooter from '@/components/shared/AppFooter.vue'
import { useInterviewMode } from '@/composables/useInterviewMode'
import { useInterviewStore } from '@/stores/interview'
import { announceToScreenReader } from '@/utils/a11y'

// Импорты сессий и сетапов
import AIInterviewSession from './sessions/AIInterviewSession.vue'
import ManualInterviewSession from './sessions/ManualInterviewSession.vue'
import AISetup from './setup/AISetup.vue'
import ManualSetup from './setup/ManualSetup.vue'
import TrainerWelcome from './TrainerWelcome.vue'

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

function handleModeChange(newMode: 'manual' | 'ai') {
  setMode(newMode)
  interviewStore.questions = []
  announceToScreenReader(`Режим изменен на ${newMode === 'manual' ? 'ручной' : 'искусственный интеллект'}`)
}

function handleQuestionsGenerated() {
  message.success('Вопросы сгенерированы! Теперь можно начать собеседование.')
}

function handleAISettingsChanged(newSettings: AISettings) {
  setAISettings(newSettings)
}

function handleSettingsChange() {
  setInterviewSettings({ ...interviewSettings.value })
}

function startInterview() {
  if (questions.value.length === 0)
    return

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
  announceToScreenReader('Собеседование прервано.')
}

async function saveAiToUserAnswer(question: Question, aiAnswer: string) {
  if (!question.id)
    return
  try {
    await interviewStore.updateUserAnswer(question.id, aiAnswer)
    message.success('Ответ ИИ сохранен как ваш ответ!')
  }
  catch (error) {
    console.error('Save AI to user answer error:', error)
    message.error('Ошибка при сохранении ответа ИИ')
  }
}
</script>

<template>
  <div class="interview-trainer">
    <div id="a11y-announcer" aria-live="polite" aria-atomic="true" class="sr-only" />

    <div class="trainer-wrapper">
      <div v-if="isInterviewStarted" class="active-interview-header">
        <a-button danger shape="round" @click="exitInterview">
          Прервать собеседование
        </a-button>
      </div>

      <div class="glass-card">
        <div v-if="!isInterviewStarted" class="setup-container">
          <TrainerWelcome
            :mode="mode"
            :has-questions="questions.length > 0"
            @update:mode="handleModeChange"
            @start="startInterview"
          />

          <div class="setup-forms-area">
            <ManualSetup
              v-if="mode === 'manual'"
              @save-ai-to-user-answer="saveAiToUserAnswer"
            />
            <AISetup
              v-else
              :initial-settings="aiSettings"
              @questions-generated="handleQuestionsGenerated"
              @settings-changed="handleAISettingsChanged"
            />
          </div>

          <div class="extra-settings">
            <a-divider>Дополнительные опции</a-divider>
            <div class="settings-row">
              <a-checkbox
                v-model:checked="interviewSettings.showProgress"
                @change="handleSettingsChange"
              >
                Показывать шкалу прогресса
              </a-checkbox>

              <a-checkbox
                v-if="mode === 'ai'"
                v-model:checked="interviewSettings.enableAnswerInput"
                @change="handleSettingsChange"
              >
                Оценивать мои ответы (ИИ)
              </a-checkbox>
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
      </div>
    </div>

    <AppFooter v-if="!isInterviewStarted" class="trainer-footer" />
  </div>
</template>

<style scoped>
.interview-trainer {
  padding: 24px;
}

.trainer-wrapper {
  max-width: 900px;
  margin: 0 auto;
}

.glass-card {
  background: var(--ant-color-bg-container);
  border: 1px solid var(--ant-color-border-secondary);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.active-interview-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.setup-forms-area {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px dashed var(--ant-color-border);
}

.extra-settings {
  margin-top: 32px;
}

.settings-row {
  display: flex;
  gap: 24px;
  justify-content: center;
}

.trainer-footer {
  margin-top: 40px;
}

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

@media (max-width: 768px) {
  .interview-trainer { padding: 12px; }
  .glass-card { padding: 24px 16px; border-radius: 16px; }
  .settings-row { flex-direction: column; align-items: center; gap: 12px; }
}
</style>
