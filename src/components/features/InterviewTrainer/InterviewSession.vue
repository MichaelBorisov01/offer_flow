<script setup lang="ts">
import { BulbOutlined, CheckOutlined, ExclamationOutlined, RedoOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, ref } from 'vue'
import { useInterviewStore } from '@/stores/interview'
import AIAnswerCard from './AIAnswerCard.vue'

const interviewStore = useInterviewStore()

const questions = computed(() => interviewStore.sessionQuestionsList)
const currentQuestion = computed(() => interviewStore.currentQuestion!)
const currentQuestionIndex = computed(() => interviewStore.currentQuestionIndex)
const progress = computed(() => interviewStore.progress)
const interviewSettings = computed(() => interviewStore.interviewSettings)
const isLastQuestion = computed(() => interviewStore.isLastQuestion)

const answerVisible = ref(false)
const answerGenerating = ref(false)

async function setQuestionStatus(status: 'known' | 'repeat' | 'hard') {
  if (!currentQuestion.value?.id) {
    return
  }

  try {
    await interviewStore.updateQuestionStatus(currentQuestion.value.id, status)
    await interviewStore.loadUserQuestions()
  }
  catch (error) {
    console.error('Error updating status:', error)
    message.error('Ошибка при обновлении статуса вопроса')
  }
}

async function toggleAnswerVisibility() {
  if (answerVisible.value) {
    hideAnswer()
  }
  else {
    await generateAIAnswer()
  }
}

function hideAnswer() {
  answerVisible.value = false
}

async function generateAIAnswer() {
  if (!currentQuestion.value?.id)
    return

  answerGenerating.value = true
  answerVisible.value = true

  try {
    await interviewStore.generateAnswerForQuestion(currentQuestion.value.id)
    message.success('Ответ сгенерирован!')
  }
  catch (error) {
    console.error('Error generating answer:', error)
    message.error('Не удалось сгенерировать ответ')
  }
  finally {
    answerGenerating.value = false
  }
}

function getDifficultyColor(difficulty: string) {
  const colors = { junior: 'green', middle: 'orange', senior: 'red' }
  return colors[difficulty as keyof typeof colors] || 'blue'
}

function getDifficultyLabel(difficulty: string) {
  const labels = { junior: 'Junior', middle: 'Middle', senior: 'Senior' }
  return labels[difficulty as keyof typeof labels] || difficulty
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    'javascript': 'gold',
    'vue': 'green',
    'react': 'blue',
    'typescript': 'geekblue',
    'html-css': 'purple',
    'algorithms': 'orange',
    'database': 'red',
    'system-design': 'cyan',
    'soft-skills': 'lime',
    'nodejs': 'green',
  }
  return colors[category] || 'default'
}

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    'javascript': 'JavaScript',
    'vue': 'Vue.js',
    'react': 'React',
    'typescript': 'TypeScript',
    'html-css': 'HTML/CSS',
    'algorithms': 'Алгоритмы',
    'database': 'Базы данных',
    'system-design': 'System Design',
    'soft-skills': 'Soft Skills',
    'nodejs': 'Node.js',
  }
  return labels[category] || category
}

function navigateToNextQuestion() {
  interviewStore.nextQuestion()
}

function navigateToPreviousQuestion() {
  interviewStore.previousQuestion()
}

function completeInterview() {
  interviewStore.finishInterview()
}

function navigateToQuestion(index: number) {
  if (index >= 0 && index < questions.value.length) {
    interviewStore.currentQuestionIndex = index
  }
}
</script>

<template>
  <div class="interview-session">
    <a-card title="Режим собеседования" class="session-card">
      <div v-if="interviewSettings.showProgress" class="progress-section">
        <a-progress
          :percent="progress"
          :show-info="false"
          status="active"
          class="progress-bar"
        />
        <div class="progress-info">
          <span>Вопрос {{ currentQuestionIndex + 1 }} из {{ questions.length }}</span>
          <span class="progress-percent">{{ progress }}%</span>
        </div>
      </div>

      <div class="question-section">
        <a-card :title="`Вопрос ${currentQuestionIndex + 1}`" class="question-card">
          <template #extra>
            <a-space>
              <a-tag :color="getDifficultyColor(currentQuestion?.difficulty)">
                {{ getDifficultyLabel(currentQuestion?.difficulty) }}
              </a-tag>
              <a-tag :color="getCategoryColor(currentQuestion?.category)">
                {{ getCategoryLabel(currentQuestion?.category) }}
              </a-tag>
              <a-button
                type="link"
                :loading="answerGenerating"
                size="small"
                @click="toggleAnswerVisibility"
              >
                <BulbOutlined />
                {{ answerVisible ? 'Скрыть ответ' : 'Развернуть ответ' }}
              </a-button>
            </a-space>
          </template>

          <div class="question-content">
            <p class="question-text">
              {{ currentQuestion?.text }}
            </p>

            <div v-if="currentQuestion?.tags && currentQuestion.tags.length" class="question-tags">
              <a-tag
                v-for="(tag, index) in currentQuestion.tags"
                :key="index"
                color="blue"
                size="small"
                class="tag-item"
              >
                {{ tag }}
              </a-tag>
            </div>
          </div>
        </a-card>

        <!-- Кнопки статусов вопроса -->
        <div class="status-actions">
          <a-button
            :type="currentQuestion?.status === 'known' ? 'primary' : 'default'"
            :ghost="currentQuestion?.status !== 'known'"
            class="status-button"
            @click="() => setQuestionStatus('known')"
          >
            <CheckOutlined />
            Знаю
          </a-button>
          <a-button
            :type="currentQuestion?.status === 'repeat' ? 'primary' : 'default'"
            :ghost="currentQuestion?.status !== 'repeat'"
            class="status-button"
            @click="() => setQuestionStatus('repeat')"
          >
            <RedoOutlined />
            Повторить
          </a-button>
          <a-button
            :type="currentQuestion?.status === 'hard' ? 'primary' : 'default'"
            :ghost="currentQuestion?.status !== 'hard'"
            class="status-button"
            @click="() => setQuestionStatus('hard')"
          >
            <ExclamationOutlined />
            Сложно
          </a-button>
        </div>

        <AIAnswerCard
          v-if="answerVisible && currentQuestion.aiAnswer"
          :answer="currentQuestion.aiAnswer"
          :loading="answerGenerating"
          @regenerate="generateAIAnswer"
          @close="hideAnswer"
        />
      </div>

      <div class="fixed-navigation-section">
        <a-space>
          <a-button
            :disabled="currentQuestionIndex === 0"
            size="large"
            @click="navigateToPreviousQuestion"
          >
            ← Предыдущий вопрос
          </a-button>

          <a-button
            v-if="!isLastQuestion"
            type="primary"
            size="large"
            @click="navigateToNextQuestion"
          >
            Следующий вопрос →
          </a-button>

          <a-button
            v-else
            type="primary"
            size="large"
            @click="completeInterview"
          >
            Завершить собеседование
          </a-button>
        </a-space>
      </div>

      <div v-if="interviewSettings.showProgress" class="quick-navigation">
        <a-divider />
        <h4>Быстрая навигация:</h4>
        <a-space wrap>
          <a-button
            v-for="(question, index) in questions"
            :key="index"
            :type="currentQuestionIndex === index ? 'primary' : 'default'"
            :class="`question-button ${question.status ? `status-${question.status}` : ''}`"
            size="small"
            @click="navigateToQuestion(index)"
          >
            {{ index + 1 }}
          </a-button>
        </a-space>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.interview-session {
   height: 100%;
}

.session-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.progress-section {
  margin-bottom: 20px;
}

.progress-bar {
  margin-bottom: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #8c8c8c;
}

.progress-percent {
  font-weight: 500;
  color: #1890ff;
}

.question-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.question-card {
  flex-shrink: 0;
}

.question-content {
  padding: 8px 0;
}

.question-text {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 12px;
  color: #333;
}

.question-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tag-item {
  margin: 0;
}

.status-actions {
   display: flex;
  gap: 8px;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 16px;
}

.status-button {
  min-width: 100px;
  height: 40px;
  font-weight: 500;
}

.status-button:not(.ant-btn-primary) {
  background-color: white;
  border-color: #d9d9d9;
  color: #595959;
}

.status-button:not(.ant-btn-primary):hover {
  border-color: #1890ff;
  color: #1890ff;
}

.instruction-section {
  margin-bottom: 24px;
}

.navigation-section {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.quick-navigation {
 flex-shrink: 0;
  margin-top: 16px;
}

.quick-navigation h4 {
  margin-bottom: 12px;
  color: #8c8c8c;
}

.fixed-navigation-section {
  position: sticky;
  bottom: 0;
  background: white;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: auto;
  flex-shrink: 0;
  z-index: 10;
}

/* Базовые стили для кнопок навигации по вопросам */
:deep(.question-button.status-known) {
  background-color: #f6ffed;
  border-color: #b7eb8f;
  color: #52c41a;
}

:deep(.question-button.status-repeat) {
  background-color: #fff7e6;
  border-color: #ffd591;
  color: #fa8c16;
}

:deep(.question-button.status-hard) {
  background-color: #fff2f0;
  border-color: #ffccc7;
  color: #ff4d4f;
}

/* Стили для активной кнопки навигации */
:deep(.question-button.ant-btn-primary.status-known) {
  background-color: #52c41a;
  border-color: #52c41a;
  color: white;
}

:deep(.question-button.ant-btn-primary.status-repeat) {
  background-color: #fa8c16;
  border-color: #fa8c16;
  color: white;
}

:deep(.question-button.ant-btn-primary.status-hard) {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
  color: white;
}

:deep(.question-button.ant-btn-primary) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  font-weight: 600;
  transform: scale(1.05);
}

:deep(.question-button.ant-btn-primary) {
  position: relative;
}

:deep(.question-button.ant-btn-primary::after) {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid currentColor;
  border-radius: 6px;
  opacity: 0.3;
}

@media (max-width: 768px) {
  .interview-session {
    padding: 12px;
  }

  .question-text {
    font-size: 16px;
    line-height: 1.5;
  }

  .tag-item {
    max-width: 120px;
    font-size: 11px;
  }

  .status-actions {
    flex-direction: column;
    gap: 8px;
  }

  .status-button {
    min-width: auto;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .question-text {
    font-size: 15px;
  }

  .tag-item {
    max-width: 100px;
  }
}

@media (max-width: 768px) {
  .status-actions {
    flex-direction: column;
  }

  .fixed-navigation-section {
    padding: 12px 0;
  }

  .fixed-navigation-section .ant-space {
    width: 100%;
    justify-content: space-between;
  }

  .fixed-navigation-section .ant-btn {
    flex: 1;
  }
}
</style>
