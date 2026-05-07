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

const aiStatus = ref<'checking' | 'connected' | 'error'>('checking')

const aiStatusMessage = computed(() => {
  const messages = {
    checking: 'Режим ИИ: Установка защищенного соединения с сервером...',
    connected: 'Режим ИИ: Подключен через безопасный API',
    error: 'Режим ИИ: Сервер недоступен, временно используются локальные вопросы',
  }
  return messages[aiStatus.value]
})

const aiStatusType = computed(() => {
  const types = {
    checking: 'info',
    connected: 'success',
    error: 'warning',
  }
  return types[aiStatus.value] as 'info' | 'success' | 'warning'
})

const aiQuestions = ref<Question[]>([])

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

onMounted(async () => {
  if (props.initialSettings) {
    Object.assign(aiSettings, props.initialSettings)
  }

  // Пингуем наш бэкенд, чтобы убедиться, что всё работает
  const isConnected = await AIService.testConnection()
  aiStatus.value = isConnected ? 'connected' : 'error'
})
</script>

<template>
  <div class="ai-setup">
    <div class="ai-status">
      <a-spin :spinning="aiStatus === 'checking'">
        <a-alert
          :message="aiStatusMessage"
          :type="aiStatusType"
          show-icon
          class="status-alert"
        />
      </a-spin>
    </div>

    <h3 class="section-title">
      Настройки генерации вопросов ИИ
    </h3>

    <a-form layout="vertical" class="ai-settings-form">
      <a-form-item label="Тип навыков" class="form-item-mobile">
        <a-radio-group v-model:value="aiSettings.skill" class="radio-group-mobile" @change="handleSkillChange">
          <a-radio value="hard" class="radio-option">
            Hard Skills
          </a-radio>
          <a-radio value="soft" class="radio-option">
            Soft Skills
          </a-radio>
        </a-radio-group>
      </a-form-item>

      <a-row :gutter="[16, 8]" class="settings-row">
        <a-col v-if="showSpecialtyAndDifficulty" :xs="24" :sm="12" :md="8" class="settings-col">
          <a-form-item label="Специализация" class="form-item-mobile">
            <a-select
              v-model:value="aiSettings.specialty"
              size="large"
              class="select-mobile"
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

        <a-col v-if="showSpecialtyAndDifficulty" :xs="24" :sm="12" :md="8" class="settings-col">
          <a-form-item v-if="showTechnologySelect" label="Технология" class="form-item-mobile">
            <a-select v-model:value="aiSettings.technology" size="large" class="select-mobile">
              <a-select-option
                v-for="tech in availableTechnologies"
                :key="tech.value"
                :value="tech.value"
              >
                {{ tech.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>

        <a-col
          v-if="showSpecialtyAndDifficulty"
          :xs="24" :sm="24" :md="showSpecialtyAndDifficulty ? 8 : 24" class="settings-col"
        >
          <a-form-item label="Уровень сложности" class="form-item-mobile">
            <a-select v-model:value="aiSettings.difficulty" size="large" class="select-mobile">
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
      </a-row>

      <a-form-item label="Количество вопросов" class="form-item-mobile">
        <a-select v-model:value="aiSettings.questionsCount" size="large" class="select-mobile">
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

      <a-form-item class="actions-form-item">
        <div class="action-buttons">
          <a-button
            type="primary"
            :loading="isGenerating"
            size="large"
            class="generate-button"
            @click="generateQuestions"
          >
            {{ hasQuestions ? 'Сгенерировать новые вопросы' : 'Сгенерировать вопросы' }}
          </a-button>

          <a-button
            v-if="hasQuestions"
            size="large"
            class="clear-button"
            @click="clearQuestions"
          >
            Очистить вопросы
          </a-button>
        </div>
      </a-form-item>
    </a-form>

    <div v-if="hasQuestions" class="questions-preview">
      <a-divider class="mobile-divider" />

      <div class="preview-header">
        <h4 class="preview-title">
          Сгенерированные вопросы ({{ aiQuestions.length }})
        </h4>
        <a-button
          type="primary"
          size="large"
          :loading="isSavingAll"
          :disabled="isSavingAll"
          class="save-all-button"
          @click="saveAllQuestions"
        >
          Сохранить все вопросы
        </a-button>
      </div>

      <a-alert
        :message="aiSettings.skill === 'hard' ? 'Вопросы готовы! Вы можете сохранить их в свою коллекцию.' : 'Soft skills вопросы готовы! Вы можете сохранить их в свою коллекцию.'"
        type="success"
        show-icon
        class="success-alert"
      />

      <a-list
        :data-source="aiQuestions"
        item-layout="vertical"
        class="preview-list"
      >
        <template #renderItem="{ item }">
          <a-list-item class="preview-item">
            <a-list-item-meta class="preview-meta">
              <template #title>
                <div class="question-preview">
                  <span class="question-text">{{ item.text }}</span>
                  <div class="question-actions">
                    <a-tag color="green" class="ai-tag">
                      AI
                    </a-tag>
                    <a-button
                      type="primary"
                      size="large"
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
                <div class="preview-meta-tags">
                  <a-tag :color="getDifficultyColor(item.difficulty)" class="meta-tag">
                    {{ item.difficulty }}
                  </a-tag>
                  <a-tag color="blue" class="meta-tag">
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
  padding: 0 8px;
}

.status-alert {
  margin-bottom: 16px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #262626;
}

.ai-settings-form {
  margin-bottom: 24px;
}

.form-item-mobile :deep(.ant-form-item-label) {
  padding-bottom: 6px;
}

.form-item-mobile :deep(.ant-form-item-label > label) {
  font-size: 14px;
  font-weight: 500;
  height: auto;
}

.radio-group-mobile {
  width: 100%;
}

.radio-group-mobile :deep(.ant-radio-wrapper) {
  display: flex;
  align-items: center;
  margin-right: 16px;
  font-size: 14px;
}

.radio-option {
  padding: 8px 0;
}

.settings-row {
  margin-bottom: 0;
}

.settings-col {
  margin-bottom: 8px;
}

.select-mobile {
  width: 100%;
}

.select-mobile :deep(.ant-select-selector) {
  height: 44px !important;
  border-radius: 8px;
}

.select-mobile :deep(.ant-select-selection-item) {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.actions-form-item {
  margin-bottom: 0;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.generate-button,
.clear-button,
.save-all-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-button {
  border: 1px solid #d9d9d9;
  background: #fff;
}

.questions-preview {
  margin-top: 24px;
}

.mobile-divider {
  margin: 20px 0;
}

.preview-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.preview-title {
  margin: 0;
  color: #262626;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.save-all-button {
  width: 100%;
}

.success-alert {
  margin-bottom: 16px;
}

.preview-list {
  max-height: 500px;
  overflow-y: auto;
}

.preview-item {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  background: #fff;
}

.preview-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.preview-meta :deep(.ant-list-item-meta-content) {
  width: 100%;
}

.question-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.question-text {
  line-height: 1.5;
  font-size: 15px;
  color: #262626;
  word-break: break-word;
}

.question-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ai-tag {
  margin: 0;
  font-size: 12px;
  padding: 2px 8px;
}

.save-single-button {
  background: #52c41a;
  border-color: #52c41a;
  color: white;
  padding: 0 16px;
  height: 36px;
  font-size: 14px;
  border-radius: 6px;
  flex-shrink: 0;
}

.save-single-button:hover {
  background: #73d13d;
  border-color: #73d13d;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(82, 196, 26, 0.3);
}

.preview-meta-tags {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.meta-tag {
  margin: 0;
  font-size: 12px;
  padding: 2px 8px;
}

/* Планшеты */
@media (min-width: 768px) {
  .ai-setup {
    padding: 0 16px;
  }

  .section-title {
    font-size: 22px;
  }

  .action-buttons {
    flex-direction: row;
    gap: 12px;
  }

  .generate-button,
  .clear-button {
    width: auto;
    flex: 1;
  }

  .preview-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .preview-title {
    text-align: left;
  }

  .save-all-button {
    width: auto;
    min-width: 200px;
  }

  .question-preview {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }

  .question-text {
    max-width: 70%;
  }
}

/* Десктоп */
@media (min-width: 1024px) {
  .ai-setup {
    padding: 0;
  }

  .settings-row {
    margin-bottom: 0;
  }

  .question-text {
    max-width: 550px;
  }
}

/* Очень маленькие экраны */
@media (max-width: 360px) {
  .section-title {
    font-size: 18px;
  }

  .question-text {
    font-size: 14px;
  }

  .generate-button,
  .clear-button,
  .save-all-button,
  .save-single-button {
    font-size: 14px;
    height: 40px;
  }

  .preview-item {
    padding: 12px;
  }
}

/* Улучшение скролла на мобильных */
.preview-list::-webkit-scrollbar {
  width: 4px;
}

.preview-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.preview-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.preview-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
