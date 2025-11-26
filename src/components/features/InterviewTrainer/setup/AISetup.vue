<script setup lang="ts">
import type { AISettings, Question } from '@/types/interview'
import { message } from 'ant-design-vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { AIService } from '@/services/aiService'
import { QuestionService } from '@/services/questionService'
import { useInterviewStore } from '@/stores/interview'
import { getDifficultyColor } from '@/utils/helpers/questionHelpers'

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
const savingQuestionIds = ref<Set<string>>(new Set())
const isSavingAll = ref(false)
const lastMessageTime = ref<number>(0)
const MESSAGE_COOLDOWN = 2000

const aiSettings = reactive<AISettings>({
  specialty: props.initialSettings?.specialty || 'frontend',
  difficulty: props.initialSettings?.difficulty || 'middle',
  questionsCount: props.initialSettings?.questionsCount || 5,
  technology: props.initialSettings?.technology || 'vue',
  skill: props.initialSettings?.skill || 'hard',
})

const aiStatus = ref<'connected' | 'fallback' | 'error'>('fallback')

const aiStatusMessage = computed(() => {
  const messages = {
    connected: 'Режим ИИ: Подключен к Hugging Face API',
    fallback: 'Режим ИИ: Используются локальные вопросы (не добавлен Hugging Face API ключ)',
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
  technologies[aiSettings.specialty as keyof typeof technologies] || technologies.frontend,
)

const showTechnologySelect = computed(() =>
  aiSettings.skill === 'hard'
  && ['frontend', 'backend', 'fullstack', 'devops', 'mobile'].includes(aiSettings.specialty),
)

const showSpecialtyAndDifficulty = computed(() => aiSettings.skill === 'hard')

const hasQuestions = computed(() => aiQuestions.value.length > 0)

function showMessage(type: 'success' | 'warning' | 'error' | 'info', content: string, duration?: number) {
  const now = Date.now()
  if (now - lastMessageTime.value < MESSAGE_COOLDOWN) {
    return
  }

  lastMessageTime.value = now
  message[type](content, duration)
}

function handleSkillChange() {
  if (aiSettings.skill === 'soft') {
    aiSettings.specialty = 'soft-skills'
    aiSettings.difficulty = 'middle'
    aiSettings.technology = ''
  }
  else {
    aiSettings.specialty = 'frontend'
    aiSettings.difficulty = 'middle'
    aiSettings.technology = 'vue'
  }
}

function handleFieldChange() {
  aiSettings.technology = availableTechnologies.value[0]?.value || ''
}

async function generateQuestions() {
  isGenerating.value = true

  try {
    const questions = await AIService.generateQuestions(aiSettings)
    aiQuestions.value = questions.map((q, index) => ({
      ...q,
      tempId: `ai-${Date.now()}-${index}`,
    }))

    interviewStore.questions = aiQuestions.value
    emit('questionsGenerated')
  }
  catch (error) {
    console.error('Error generating questions:', error)
    aiStatus.value = 'error'
    showMessage('error', 'Ошибка при генерации вопросов')
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
  showMessage('info', 'Вопросы очищены')
}

function isDuplicateQuestion(question: Question): boolean {
  const savedQuestions = interviewStore.questions.filter(q => q.id && !q.tempId)

  return savedQuestions.some(existingQuestion =>
    existingQuestion.text.trim().toLowerCase() === question.text.trim().toLowerCase(),
  )
}

async function saveQuestionToDB(question: Question, tempId: string) {
  if (savingQuestionIds.value.has(tempId)) {
    return
  }

  savingQuestionIds.value.add(tempId)

  try {
    if (isDuplicateQuestion(question)) {
      showMessage('warning', 'Этот вопрос уже есть в вашей коллекции')
      return
    }

    await QuestionService.addQuestion({
      text: question.text,
      category: question.category,
      difficulty: question.difficulty,
      tags: [...(question.tags || []), 'ai-generated'],
      createdAt: new Date(),
    })

    showMessage('success', 'Вопрос сохранен в вашу коллекцию!')
    await interviewStore.loadUserQuestions()
  }
  catch (error) {
    console.error('Error saving question:', error)
    showMessage('error', 'Ошибка при сохранении вопроса')
  }
  finally {
    savingQuestionIds.value.delete(tempId)
  }
}

async function saveAllQuestions() {
  if (!hasQuestions.value)
    return

  if (isSavingAll.value) {
    return
  }

  isSavingAll.value = true

  try {
    let savedCount = 0
    let skippedCount = 0

    for (const question of aiQuestions.value) {
      if (savingQuestionIds.value.has(question.tempId!)) {
        skippedCount++
        continue
      }

      if (isDuplicateQuestion(question)) {
        skippedCount++
        continue
      }

      savingQuestionIds.value.add(question.tempId!)

      try {
        await QuestionService.addQuestion({
          text: question.text,
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

    await interviewStore.loadUserQuestions()

    if (savedCount > 0) {
      showMessage('success', `Сохранено вопросов: ${savedCount}${skippedCount > 0 ? `, пропущено дубликатов: ${skippedCount}` : ''}`)
    }
    else if (skippedCount > 0) {
      showMessage('info', 'Все вопросы уже есть в вашей коллекции')
    }
    else {
      showMessage('info', 'Нет вопросов для сохранения')
    }
  }
  catch (error) {
    console.error('Error saving all questions:', error)
    showMessage('error', 'Ошибка при сохранении вопросов')
  }
  finally {
    isSavingAll.value = false
  }
}

watch(aiSettings, (newSettings) => {
  emit('settingsChanged', { ...newSettings })
}, { deep: true })

onMounted(() => {
  if (props.initialSettings) {
    Object.assign(aiSettings, props.initialSettings)
  }
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
      <a-form-item label="Тип навыков">
        <a-radio-group v-model:value="aiSettings.skill" @change="handleSkillChange">
          <a-radio value="hard">
            Hard Skills (технические)
          </a-radio>
          <a-radio value="soft">
            Soft Skills (социальные)
          </a-radio>
        </a-radio-group>
      </a-form-item>

      <a-row :gutter="16">
        <a-col v-if="showSpecialtyAndDifficulty" :span="8">
          <a-form-item label="Специализация">
            <a-select
              v-model:value="aiSettings.specialty"
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

        <a-col v-if="showSpecialtyAndDifficulty" :span="8">
          <a-form-item label="Уровень сложности">
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

        <a-col :span="showSpecialtyAndDifficulty ? 8 : 24">
          <a-form-item label="Количество вопросов">
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
        :message="aiSettings.skill === 'hard' ? 'Вопросы готовы! Вы можете сохранить их в свою коллекцию.' : 'Soft skills вопросы готовы! Вы можете сохранить их в свою коллекцию.'"
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
  max-width: 550px;
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
