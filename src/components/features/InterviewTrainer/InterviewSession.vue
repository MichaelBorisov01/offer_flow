<script setup lang="ts">
import { computed } from 'vue'
import { useInterviewStore } from '@/stores/interview'

const interviewStore = useInterviewStore()

const questions = computed(() => interviewStore.questions)
const currentQuestion = computed(() => interviewStore.currentQuestion!)
const currentQuestionIndex = computed(() => interviewStore.currentQuestionIndex)
const progress = computed(() => interviewStore.progress)
const interviewSettings = computed(() => interviewStore.interviewSettings)
const isLastQuestion = computed(() => interviewStore.isLastQuestion)

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

function nextQuestion() {
  interviewStore.nextQuestion()
}

function previousQuestion() {
  interviewStore.previousQuestion()
}

function finishInterview() {
  interviewStore.finishInterview()
}

function goToQuestion(index: number) {
  if (index >= 0 && index < questions.value.length) {
    interviewStore.currentQuestionIndex = index
  }
}
</script>

<template>
  <div class="interview-session">
    <a-card title="Режим собеседования" class="session-card">
      <!-- Прогресс бар -->
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

      <!-- Текущий вопрос -->
      <div class="question-section">
        <a-card :title="`Вопрос ${currentQuestionIndex + 1}`" class="question-card">
          <template #extra>
            <a-space v-if="interviewSettings.showQuestionMeta">
              <a-tag :color="getDifficultyColor(currentQuestion.difficulty)">
                {{ getDifficultyLabel(currentQuestion.difficulty) }}
              </a-tag>
              <a-tag :color="getCategoryColor(currentQuestion.category)">
                {{ getCategoryLabel(currentQuestion.category) }}
              </a-tag>
            </a-space>
          </template>

          <p class="question-text">
            {{ currentQuestion.text }}
          </p>

          <div v-if="currentQuestion.tags && currentQuestion.tags.length && interviewSettings.showQuestionMeta" class="question-meta">
            <a-tag
              v-for="(tag, index) in currentQuestion.tags"
              :key="index"
              color="blue"
              size="small"
            >
              {{ tag }}
            </a-tag>
          </div>
        </a-card>
      </div>

      <!-- Инструкция -->
      <div class="instruction-section">
        <a-alert
          message="Режим подготовки"
          description="Отвечайте на вопросы устно. После ответа переходите к следующему вопросу."
          type="info"
          show-icon
        />
      </div>

      <!-- Навигация -->
      <div class="navigation-section">
        <a-space>
          <a-button
            :disabled="currentQuestionIndex === 0"
            size="large"
            @click="previousQuestion"
          >
            ← Предыдущий вопрос
          </a-button>

          <a-button
            v-if="!isLastQuestion"
            type="primary"
            size="large"
            @click="nextQuestion"
          >
            Следующий вопрос →
          </a-button>

          <a-button
            v-else
            type="primary"
            size="large"
            @click="finishInterview"
          >
            Завершить собеседование
          </a-button>
        </a-space>
      </div>

      <!-- Быстрая навигация по вопросам -->
      <div v-if="interviewSettings.showProgress" class="quick-navigation">
        <a-divider />
        <h4>Быстрая навигация:</h4>
        <a-space wrap>
          <a-button
            v-for="(question, index) in questions"
            :key="index"
            :type="currentQuestionIndex === index ? 'primary' : 'default'"
            size="small"
            @click="goToQuestion(index)"
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
  padding: 20px;
}

.session-card {
  max-width: 900px;
  margin: 0 auto;
}

.progress-section {
  margin-bottom: 24px;
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
  margin-bottom: 24px;
}

.question-card {
  background: #fafafa;
  border: 2px solid #e8f4ff;
}

.question-text {
  font-size: 18px;
  line-height: 1.6;
  margin: 0;
  color: #262626;
  font-weight: 500;
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
  margin-top: 24px;
}

.quick-navigation h4 {
  margin-bottom: 12px;
  color: #8c8c8c;
}
</style>
