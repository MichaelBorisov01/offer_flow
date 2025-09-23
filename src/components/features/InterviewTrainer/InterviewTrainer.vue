<template>
  <div class="interview-trainer">
    <a-card title="Тренажер собеседований" class="trainer-card">
      <template #extra>
        <a-button 
          v-if="isInterviewStarted" 
          @click="exitInterview" 
          danger 
          size="small"
        >
          Выйти из собеседования
        </a-button>
      </template>

      <div v-if="!isInterviewStarted">
        <p>Добро пожаловать в тренажер собеседований! Выберите режим работы:</p>
        
        <!-- Режимы работы -->
        <a-radio-group v-model:value="mode" class="mode-selector" button-style="solid">
          <a-radio-button value="manual">Ручной режим</a-radio-button>
          <a-radio-button value="ai">Режим с ИИ</a-radio-button>
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
          @click="startInterview"
          class="start-button"
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

<script setup lang="ts">
import { ref, computed } from 'vue';
import ManualSetup from './ManualSetup.vue';
import InterviewSession from './InterviewSession.vue';
import AISetup from './AISetup.vue';
import { useInterviewStore } from '@/stores/interview';
import { message } from 'ant-design-vue';

const interviewStore = useInterviewStore();

const mode = ref<'manual' | 'ai'>('manual');
const questions = computed(() => interviewStore.questions);
const isInterviewStarted = computed(() => interviewStore.isInterviewStarted);
const interviewSettings = computed(() => interviewStore.interviewSettings);

const startInterview = () => {
  if (questions.value.length > 0) {
    interviewStore.startInterview();
  } else {
    message.error('Добавьте вопросы для начала подготовки');
  }
};

const exitInterview = () => {
  interviewStore.isInterviewStarted = false;
  message.info('Подготовка прервана');
};
</script>

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