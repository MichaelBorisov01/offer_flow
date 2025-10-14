<script setup lang="ts">
import type { InterviewMode } from '@/composables/useInterviewMode'
import type { AISettings, InterviewSettings } from '@/types/interview'
import { message } from 'ant-design-vue'
import { computed, watch } from 'vue'
import { useInterviewMode } from '@/composables/useInterviewMode'
import { useInterviewStore } from '@/stores/interview'
import AIInterviewSession from './AIInterviewSession.vue'
import AISetup from './AISetup.vue'
import InterviewSession from './InterviewSession.vue'
import ManualSetup from './ManualSetup.vue'

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

function getStartButtonText() {
  const count = questions.value.length
  return `Начать подготовку (${count})`
}

function startInterview() {
  if (questions.value.length === 0) {
    message.error('Добавьте вопросы для начала собеседования')
    return
  }

  // Обновляем настройки в хранилище с правильной типизацией
  interviewStore.interviewSettings = {
    showProgress: interviewSettings.value.showProgress,
    showQuestionMeta: interviewSettings.value.showQuestionMeta,
    enableAnswerInput: interviewSettings.value.enableAnswerInput,
    filterByStatus: interviewSettings.value.filterByStatus || '',
  }

  interviewStore.startInterview()
}

function exitInterview() {
  interviewStore.isInterviewStarted = false
  interviewStore.clearUserAnswers()
  message.info('Собеседование прервано')
}

// Следим за изменением режима и очищаем вопросы
watch(mode, (newMode, oldMode) => {
  if (newMode !== oldMode) {
    interviewStore.questions = []
  }
})

function updateQuestionFilter(selectedStatuses: 'known' | 'repeat' | 'hard') {
  const newSettings: InterviewSettings = {
    ...interviewSettings.value,
    filterByStatus: selectedStatuses,
  }
  setInterviewSettings(newSettings)
}
</script>

<template>
  <div class="interview-trainer">
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

            <a-form-item v-if="mode === 'manual'">
              <a-checkbox
                v-model:checked="interviewSettings.showQuestionMeta"
                @change="handleSettingsChange"
              >
                Показывать метаданные вопросов
              </a-checkbox>
            </a-form-item>

            <a-form-item v-if="mode === 'manual'" label="Фильтр по статусам:">
              <a-checkbox-group
                :value="interviewSettings.filterByStatus || ''"
                @change="updateQuestionFilter"
              >
                <a-checkbox value="known">
                  Знаю
                </a-checkbox>
                <a-checkbox value="repeat">
                  Повторить
                </a-checkbox>
                <a-checkbox value="hard">
                  Сложно
                </a-checkbox>
              </a-checkbox-group>
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
                message="В ИИ вы сможете отвечать на вопросы и получать автоматическую оценку ваших ответов."
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
          {{ getStartButtonText() }}
        </a-button>
      </div>

      <div v-else>
        <InterviewSession v-if="mode === 'manual'" />
        <AIInterviewSession v-else />
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.interview-trainer {
  padding: 20px;
}

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
