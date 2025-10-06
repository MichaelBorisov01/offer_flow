<script setup lang="ts">
import type { AISettings, Question } from '@/types/interview'
import { message } from 'ant-design-vue'
import { computed, reactive, ref } from 'vue'
import { AIService } from '@/services/aiService'
import { useInterviewStore } from '@/stores/interview'

const emit = defineEmits<{
  (e: 'questions-generated'): void
}>()
const interviewStore = useInterviewStore()
const isGenerating = ref(false)

const aiSettings = reactive<AISettings>({
  field: 'frontend',
  difficulty: 'middle',
  questionsCount: 5,
  technology: 'vue',
})

const aiStatus = ref<'connected' | 'fallback' | 'error'>('fallback')

const aiStatusMessage = computed(() => {
  const messages = {
    connected: 'Режим ИИ: Подключен к Hugging Face API',
    fallback: 'Режим ИИ: Используются локальные вопросы (добавьте Hugging Face API ключ)',
    error: 'Режим ИИ: Ошибка подключения, используются локальные вопросы',
  }
  return messages[aiStatus.value]
})

const aiQuestions = ref<Question[]>([])

// Технологии для разных специализаций
const technologies = {
  frontend: [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'vue', label: 'Vue.js' },
    { value: 'react', label: 'React' },
    { value: 'angular', label: 'Angular' },
    { value: 'typescript', label: 'TypeScript' },
  ],
  backend: [
    { value: 'nodejs', label: 'Node.js' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'php', label: 'PHP' },
  ],
  fullstack: [
    { value: 'mern', label: 'MERN Stack' },
    { value: 'mean', label: 'MEAN Stack' },
    { value: 'vue-node', label: 'Vue.js + Node.js' },
  ],
  devops: [
    { value: 'docker', label: 'Docker' },
    { value: 'kubernetes', label: 'Kubernetes' },
    { value: 'aws', label: 'AWS' },
  ],
  mobile: [
    { value: 'react-native', label: 'React Native' },
    { value: 'flutter', label: 'Flutter' },
    { value: 'ios', label: 'iOS' },
    { value: 'android', label: 'Android' },
  ],
}

const availableTechnologies = computed(() =>
  technologies[aiSettings.field as keyof typeof technologies] || technologies.frontend,
)

const showTechnologySelect = computed(() =>
  ['frontend', 'backend', 'fullstack', 'devops', 'mobile'].includes(aiSettings.field),
)

const hasQuestions = computed(() => aiQuestions.value.length > 0)

function getDifficultyColor(difficulty: string) {
  const colors = { junior: 'green', middle: 'orange', senior: 'red' }
  return colors[difficulty as keyof typeof colors] || 'blue'
}

function handleFieldChange() {
  // Сбрасываем технологию при изменении специализации
  aiSettings.technology = availableTechnologies.value[0]?.value
}

async function generateQuestions() {
  isGenerating.value = true

  try {
    const questions = await AIService.generateQuestions(aiSettings)
    aiQuestions.value = questions

    // Сохраняем вопросы в хранилище
    interviewStore.questions = questions

    message.success(`Сгенерировано ${questions.length} вопросов!`)
    emit('questions-generated') // Уведомляем родительский компонент
  }
  catch (error) {
    console.error('Error generating questions:', error)
    aiStatus.value = 'error'
    message.error('Ошибка при генерации вопросов')
  }
  finally {
    isGenerating.value = false
  }
}

function clearQuestions() {
  aiQuestions.value = []
  interviewStore.questions = []
  message.info('Вопросы очищены')
}
</script>

<template>
  <div class="ai-setup">
    <div class="ai-status">
      <a-alert
        :message="aiStatusMessage"
        :type="aiStatusType"
        show-icon
        style="margin-bottom: 16px;"
      />
    </div>

    <h3>Настройки генерации вопросов ИИ</h3>

    <a-form layout="vertical" class="ai-settings-form">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-form-item label="Специализация" required>
            <a-select
              v-model:value="aiSettings.field"
              size="large"
              @change="handleFieldChange"
            >
              <a-select-option value="frontend">
                Frontend
              </a-select-option>
              <a-select-option value="backend">
                Backend
              </a-select-option>
              <a-select-option value="fullstack">
                Fullstack
              </a-select-option>
              <a-select-option value="devops">
                DevOps
              </a-select-option>
              <a-select-option value="mobile">
                Mobile
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>

        <a-col :span="8">
          <a-form-item label="Уровень сложности" required>
            <a-select v-model:value="aiSettings.difficulty" size="large">
              <a-select-option value="junior">
                Junior
              </a-select-option>
              <a-select-option value="middle">
                Middle
              </a-select-option>
              <a-select-option value="senior">
                Senior
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>

        <a-col :span="8">
          <a-form-item label="Количество вопросов" required>
            <a-select v-model:value="aiSettings.questionsCount" size="large">
              <a-select-option value="5">
                5 вопросов
              </a-select-option>
              <a-select-option value="10">
                10 вопросов
              </a-select-option>
              <a-select-option value="15">
                15 вопросов
              </a-select-option>
              <a-select-option value="20">
                20 вопросов
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <!-- Динамические технологии в зависимости от специализации -->
      <a-form-item v-if="showTechnologySelect" label="Технология">
        <a-select v-model:value="aiSettings.technology" size="large">
          <a-select-option
            v-for="tech in availableTechnologies"
            :key="tech.value"
            :value="tech.value"
          >
            {{ tech.label }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item>
        <a-button
          type="primary"
          :loading="isGenerating"
          size="large"
          @click="generateQuestions"
        >
          {{ hasQuestions ? 'Сгенерировать новые вопросы' : 'Сгенерировать вопросы' }}
        </a-button>

        <a-button
          v-if="hasQuestions"
          style="margin-left: 8px;"
          size="large"
          @click="clearQuestions"
        >
          Очистить вопросы
        </a-button>
      </a-form-item>
    </a-form>

    <!-- Предпросмотр сгенерированных вопросов -->
    <div v-if="hasQuestions" class="questions-preview">
      <a-divider />

      <h4>Сгенерированные вопросы ({{ aiQuestions.length }})</h4>

      <a-alert
        message="Вопросы готовы! Теперь вы можете начать собеседование."
        type="success"
        show-icon
        style="margin-bottom: 16px;"
      />

      <a-list
        :data-source="aiQuestions"
        item-layout="vertical"
        class="preview-list"
      >
        <template #renderItem="{ item, index }">
          <a-list-item class="preview-item">
            <a-list-item-meta>
              <template #title>
                <div class="question-preview">
                  <span class="question-text">{{ item.text }}</span>
                  <a-tag color="green">
                    AI
                  </a-tag>
                </div>
              </template>

              <template #description>
                <div class="preview-meta">
                  <a-tag :color="getDifficultyColor(item.difficulty)">
                    {{ item.difficulty }}
                  </a-tag>
                  <a-tag color="blue">
                    {{ item.category }}
                  </a-tag>
                </div>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </div>

    <!-- Инструкция по настройке API -->
    <!-- <AIInstructions v-if="aiStatus === 'fallback'" /> -->
  </div>
</template>

<style scoped>
.ai-setup {
  max-width: 900px;
  margin: 0 auto;
}

.ai-settings-form {
  margin-bottom: 24px;
}

.questions-preview {
  margin-top: 24px;
}

.preview-list {
  max-height: 400px;
  overflow-y: auto;
}

.preview-item {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  margin-bottom: 8px;
  padding: 12px;
}

.question-preview {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.question-text {
  flex: 1;
  line-height: 1.4;
}

.preview-meta {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
</style>
