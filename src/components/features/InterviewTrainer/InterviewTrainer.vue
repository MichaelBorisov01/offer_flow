<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, ref, watch } from 'vue'
import { useInterviewStore } from '@/stores/interview'
import AIInterviewSession from './AIInterviewSession.vue'
import AISetup from './AISetup.vue'
import InterviewSession from './InterviewSession.vue'
import ManualSetup from './ManualSetup.vue'

const interviewStore = useInterviewStore()

const mode = ref<'manual' | 'ai'>('manual')
const questions = computed(() => interviewStore.questions)
const isInterviewStarted = computed(() => interviewStore.isInterviewStarted)
const interviewSettings = computed(() => interviewStore.interviewSettings)

// Обработчик сгенерированных вопросов от ИИ
function handleQuestionsGenerated() {
  message.success('Вопросы сгенерированы! Теперь можно начать собеседование.')
}

function getStartButtonText() {
  return `Начать подготовку`
}

function startInterview() {
  if (questions.value.length === 0) {
    message.error('Добавьте вопросы для начала собеседования')
    return
  }

  // Обновляем настройки в хранилище
  interviewStore.interviewSettings = {
    ...interviewStore.interviewSettings,
    ...interviewSettings.value,
  }

  interviewStore.startInterview()
}

function exitInterview() {
  interviewStore.isInterviewStarted = false
  interviewStore.clearUserAnswers()
  message.info('Собеседование прервано')
}

watch(mode, () => {
  interviewStore.questions = []
})
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
        <a-radio-group v-model:value="mode" class="mode-selector" button-style="solid">
          <a-radio-button value="manual">
            Ручной режим
          </a-radio-button>
          <a-radio-button value="ai">
            Режим с ИИ
          </a-radio-button>
        </a-radio-group>

        <a-divider />

        <!-- Контент в зависимости от режима -->
        <ManualSetup v-if="mode === 'manual'" />
        <AISetup v-else @questions-generated="handleQuestionsGenerated" />

        <!-- Настройки собеседования -->
        <a-card title="Настройки просмотра" style="margin-top: 24px;">
          <a-form layout="vertical">
            <a-form-item>
              <a-checkbox v-model:checked="interviewSettings.showProgress">
                Показывать прогресс
              </a-checkbox>
            </a-form-item>

            <a-form-item v-if="mode === 'manual'">
              <a-checkbox v-model:checked="interviewSettings.showQuestionMeta">
                Показывать метаданные вопросов
              </a-checkbox>
            </a-form-item>

            <!-- Дополнительные настройки для ИИ режима -->
            <div v-if="mode === 'ai'">
              <a-form-item>
                <a-checkbox v-model:checked="interviewSettings.enableAnswerInput">
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
