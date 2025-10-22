<script setup lang="ts">
import type { AISettings, Question } from '@/types/interview'
import { message } from 'ant-design-vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { AIService } from '@/services/aiService'
import { QuestionService } from '@/services/questionService'
import { useInterviewStore } from '@/stores/interview'

interface Props {
  initialSettings?: AISettings
}

interface Emits {
  (e: 'questionsGenerated'): void
  (e: 'settingsChanged', settings: AISettings): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const interviewStore = useInterviewStore()
const isGenerating = ref(false)
const savingQuestionIds = ref<Set<string>>(new Set()) // Для отслеживания сохранения конкретных вопросов
const isSavingAll = ref(false) // Отдельный флаг для сохранения всех вопросов

const aiSettings = reactive<AISettings>({
  field: props.initialSettings?.field || 'frontend',
  difficulty: props.initialSettings?.difficulty || 'middle',
  questionsCount: props.initialSettings?.questionsCount || 5,
  technology: props.initialSettings?.technology || 'vue',
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

const aiStatusType = computed(() => {
  const types = {
    connected: 'success',
    fallback: 'warning',
    error: 'error',
  }
  return types[aiStatus.value]
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
  aiSettings.technology = availableTechnologies.value[0]?.value || ''
}

async function generateQuestions() {
  isGenerating.value = true

  try {
    const questions = await AIService.generateQuestions(aiSettings)
    // Добавляем временные ID для отслеживания сохранения
    aiQuestions.value = questions.map((q, index) => ({
      ...q,
      tempId: `ai-${Date.now()}-${index}`, // Временный ID для отслеживания
    }))

    // Сохраняем вопросы в хранилище
    interviewStore.questions = aiQuestions.value

    emit('questionsGenerated') // Уведомляем родительский компонент
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
  savingQuestionIds.value.clear()
  isSavingAll.value = false
  message.info('Вопросы очищены')
}

// Проверка на дубликаты - проверяем только сохраненные вопросы из БД
function isDuplicateQuestion(question: Question): boolean {
  // Получаем сохраненные вопросы из store (те, что уже в БД)
  const savedQuestions = interviewStore.questions.filter(q => q.id && !q.tempId)

  return savedQuestions.some(existingQuestion =>
    existingQuestion.text.trim().toLowerCase() === question.text.trim().toLowerCase(),
  )
}

// Сохранение отдельного вопроса в БД
async function saveQuestionToDB(question: Question, tempId: string) {
  if (savingQuestionIds.value.has(tempId)) {
    return // Уже сохраняется
  }

  // Проверка на дубликаты
  if (isDuplicateQuestion(question)) {
    message.warning('Этот вопрос уже есть в вашей коллекции')
    return
  }

  savingQuestionIds.value.add(tempId)

  try {
    // Сохраняем вопрос в базу данных
    await QuestionService.addQuestion({
      text: question.text,
      type: 'text',
      category: question.category,
      difficulty: question.difficulty,
      tags: [...(question.tags || []), 'ai-generated'],
      createdAt: new Date(),
    })

    message.success('Вопрос сохранен в вашу коллекцию!')

    // Обновляем локальный список вопросов в store
    await interviewStore.loadUserQuestions()
  }
  catch (error) {
    console.error('Error saving question:', error)
    message.error('Ошибка при сохранении вопроса')
    throw error
  }
  finally {
    savingQuestionIds.value.delete(tempId)
  }
}

// Сохранение всех вопросов
async function saveAllQuestions() {
  if (!hasQuestions.value)
    return

  isSavingAll.value = true

  try {
    let savedCount = 0
    let skippedCount = 0

    for (const question of aiQuestions.value) {
      // Пропускаем уже сохраняемые вопросы
      if (savingQuestionIds.value.has(question.tempId!)) {
        skippedCount++
        continue
      }

      // Проверка на дубликаты
      if (isDuplicateQuestion(question)) {
        skippedCount++
        continue
      }

      savingQuestionIds.value.add(question.tempId!)

      try {
        await QuestionService.addQuestion({
          text: question.text,
          type: 'text',
          category: question.category,
          difficulty: question.difficulty,
          tags: [...(question.tags || []), 'ai-generated'],
          createdAt: new Date(),
        })
        savedCount++
      }
      finally {
        savingQuestionIds.value.delete(question.tempId!)
      }
    }

    // Обновляем локальный список вопросов в store
    await interviewStore.loadUserQuestions()

    if (savedCount > 0) {
      message.success(`Сохранено вопросов: ${savedCount}${skippedCount > 0 ? `, пропущено дубликатов: ${skippedCount}` : ''}`)
    }
    else if (skippedCount > 0) {
      message.info('Все вопросы уже есть в вашей коллекции')
    }
  }
  catch (error) {
    console.error('Error saving all questions:', error)
    message.error('Ошибка при сохранении вопросов')
  }
  finally {
    isSavingAll.value = false
  }
}

// Отслеживаем изменения настроек и уведомляем родительский компонент
watch(aiSettings, (newSettings) => {
  emit('settingsChanged', { ...newSettings })
}, { deep: true })

// При монтировании применяем начальные настройки
onMounted(() => {
  if (props.initialSettings) {
    Object.assign(aiSettings, props.initialSettings)
  }
  // Проверяем доступность AI
  const hasApiKey = !!import.meta.env.VITE_HUGGING_FACE_API_KEY
  aiStatus.value = hasApiKey ? 'connected' : 'fallback'
})
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

      <div class="preview-header">
        <h4>Сгенерированные вопросы ({{ aiQuestions.length }})</h4>
        <a-button
          type="primary"
          size="small"
          :loading="isSavingAll"
          :disabled="isSavingAll"
          @click="saveAllQuestions"
        >
          Сохранить все вопросы
        </a-button>
      </div>

      <a-alert
        message="Вопросы готовы! Вы можете сохранить их в свою коллекцию."
        type="success"
        show-icon
        style="margin-bottom: 16px;"
      />

      <a-list
        :data-source="aiQuestions"
        item-layout="vertical"
        class="preview-list"
      >
        <template #renderItem="{ item }">
          <a-list-item class="preview-item">
            <a-list-item-meta>
              <template #title>
                <div class="question-preview">
                  <span class="question-text">{{ item.text }}</span>
                  <div class="question-actions">
                    <a-tag color="green">
                      AI
                    </a-tag>
                    <a-button
                      type="primary"
                      size="small"
                      :loading="savingQuestionIds.has(item.tempId!)"
                      class="save-single-button"
                      @click="saveQuestionToDB(item, item.tempId!)"
                    >
                      Сохранить
                    </a-button>
                  </div>
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
                  <div v-if="item.tags && item.tags.length" class="preview-tags">
                    <a-tag
                      v-for="tag in item.tags"
                      :key="tag"
                      color="default"
                      size="small"
                    >
                      {{ tag }}
                    </a-tag>
                  </div>
                </div>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </div>
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

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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
  transition: all 0.3s ease;
}

.preview-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
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

.question-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.save-single-button {
  background: #52c41a;
  border-color: #52c41a;
  color: white;
  padding: 0 12px;
  height: 28px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.save-single-button:hover {
  background: #73d13d;
  border-color: #73d13d;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(82, 196, 26, 0.3);
}

.save-single-button:active {
  transform: translateY(0);
}

.preview-meta {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.preview-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
</style>
