<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, ref } from 'vue'
import { useInterviewStore } from '@/stores/interview'
import AISetup from './AISetup.vue'
import InterviewSession from './InterviewSession.vue'
import ManualSetup from './ManualSetup.vue'

const interviewStore = useInterviewStore()

const mode = ref<'manual' | 'ai'>('manual')
const questions = computed(() => interviewStore.questions)
const isInterviewStarted = computed(() => interviewStore.isInterviewStarted)
const interviewSettings = computed(() => interviewStore.interviewSettings)

function startInterview() {
  if (questions.value.length > 0) {
    interviewStore.startInterview()
  }
  else {
    message.error('Добавьте вопросы для начала подготовки')
  }
}

function exitInterview() {
  interviewStore.isInterviewStarted = false
  message.info('Подготовка прервана')
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
        <AISetup v-else />

        <!-- Настройки собеседования -->
        <a-card title="Настройки просмотра" style="margin-top: 24px;">
          <a-form layout="vertical">
            <a-form-item>
              <a-checkbox v-model:checked="interviewSettings.showProgress">
                Показывать прогресс
              </a-checkbox>
            </a-form-item>

            <a-form-item>
              <a-checkbox v-model:checked="interviewSettings.showQuestionMeta">
                Показывать метаданные вопросов
              </a-checkbox>
            </a-form-item>
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
        <InterviewSession />
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
