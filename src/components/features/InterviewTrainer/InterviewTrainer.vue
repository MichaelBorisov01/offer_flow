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
  <div>
    <a-card title="Тренажер собеседований" class="trainer-card">
      <template #extra>
        <a-button
          v-if="isInterviewStarted"
          danger
          size="small"
          @click="exitInterview"
        >
          Выйти из собеседования
        </a-button>
      </template>

      <div v-if="!isInterviewStarted">
        <p>Добро пожаловать в тренажер собеседований! Выберите режим работы:</p>

        <!-- Режимы работы -->
        <a-radio-group
          v-model:value="mode"
          class="mode-selector"
          button-style="solid"
          @change="handleModeChange"
        >
          <a-radio-button value="manual">
            Ручной режим
          </a-radio-button>
          <a-radio-button value="ai">
            Режим с ИИ
          </a-radio-button>
        </a-radio-group>

        <a-divider />

        <!-- Контент в зависимости от режима -->
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

        <!-- Настройки собеседования -->
        <a-card title="Настройки просмотра" style="margin-top: 24px;">
          <a-form layout="vertical">
            <a-form-item>
              <a-checkbox
                v-model:checked="interviewSettings.showProgress"
                @change="handleSettingsChange"
              >
                Показывать прогресс
              </a-checkbox>
            </a-form-item>

            <!-- Дополнительные настройки для ИИ режима -->
            <div v-if="mode === 'ai'">
              <a-form-item>
                <a-checkbox
                  v-model:checked="interviewSettings.enableAnswerInput"
                  @change="handleSettingsChange"
                >
                  Включить ввод ответа на вопрос
                </a-checkbox>
              </a-form-item>

              <a-alert
                v-if="interviewSettings.enableAnswerInput"
                message="В режиме с ИИ вы сможете отвечать на вопросы и получать оценку ваших ответов."
                type="info"
                show-icon
                style="margin-top: 8px;"
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
          Начать подготовку
        </a-button>
      </div>

      <div v-else>
        <ManualInterviewSession
          v-if="mode === 'manual'"
          @save-ai-to-user-answer="saveAiToUserAnswer"
        />
        <AIInterviewSession v-else />
      </div>
    </a-card>

    <AppFooter />
  </div>
</template>

<style scoped>
.trainer-card {
  max-width: 800px;
  margin: 0 auto;
}

.mode-selector {
  margin: 20px 0;
  width: 100%;
}

.mode-selector :deep(.ant-radio-button-wrapper) {
  width: 50%;
  text-align: center;
}

.start-button {
  margin-top: 24px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
</style>
