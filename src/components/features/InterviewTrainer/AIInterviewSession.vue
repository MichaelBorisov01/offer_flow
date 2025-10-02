<script setup lang="ts">
import { CheckCircleOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useInterviewStore } from '@/stores/interview'
import AIAnswerCard from './AIAnswerCard.vue'
import AnswerEvaluation from './AnswerEvaluation.vue'

const interviewStore = useInterviewStore()

const questions = computed(() => interviewStore.questions)
const currentQuestion = computed(() => interviewStore.currentQuestion!)
const currentQuestionIndex = computed(() => interviewStore.currentQuestionIndex)
const progress = computed(() => interviewStore.progress)
const isEvaluating = computed(() => interviewStore.isEvaluating)
const showAIAnswer = ref(false)

// Вычисляем текущий ответ пользователя
const currentUserAnswer = computed(() => {
  return interviewStore.getUserAnswer(currentQuestion.value.id!)
})

// Вычисляем общий счет
const totalScore = computed(() => {
  const answeredQuestions = interviewStore.userAnswers.filter(a => a.evaluation)
  if (answeredQuestions.length === 0)
    return null

  const total = answeredQuestions.reduce((sum, answer) => {
    return sum + (answer.evaluation?.score || 0)
  }, 0)

  return total / answeredQuestions.length
})

// Проверяем, отвечен ли вопрос
function isQuestionAnswered(questionId: string): boolean {
  return !!interviewStore.getUserAnswer(questionId)
}

// Тип кнопки для навигации
function getQuestionButtonType(index: number): string {
  const question = questions.value[index]
  if (!question?.id)
    return 'default'

  if (isQuestionAnswered(question.id)) {
    return currentQuestionIndex.value === index ? 'primary' : 'dashed'
  }

  return currentQuestionIndex.value === index ? 'primary' : 'default'
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

// Обработчики событий
async function handleAnswerSubmit(answer: string) {
  try {
    await interviewStore.submitAnswer(
      currentQuestion.value.id!,
      currentQuestion.value.text,
      answer,
    )
  }
  catch (error) {
    console.error('Error submitting answer:', error)
  }
}

function handleSkipQuestion() {
  interviewStore.nextQuestion()
}

function handleNextQuestion() {
  interviewStore.nextQuestion()
  showAIAnswer.value = false
}

function handleEditAnswer() {
  showAIAnswer.value = false
}

async function handleShowAIAnswer() {
  try {
    await interviewStore.generateAnswerForQuestion(currentQuestion.value.id!)
    showAIAnswer.value = true
  }
  catch {
    message.error('Не удалось сгенерировать ответ ИИ')
  }
}

function goToQuestion(index: number) {
  if (index >= 0 && index < questions.value.length) {
    interviewStore.currentQuestionIndex = index
    showAIAnswer.value = false
  }
}

// При завершении собеседования показываем итоги
function finishInterview() {
  interviewStore.finishInterview()

  if (totalScore.value !== null) {
    message.success(`Собеседование завершено! Ваш средний балл: ${totalScore.value.toFixed(1)}/10`)
  }
  else {
    message.success('Собеседование завершено!')
  }
}

// Автоматически завершаем собеседование когда все вопросы отвечены
watch(() => interviewStore.userAnswers.length, (newCount) => {
  if (newCount === questions.value.length && !interviewStore.isLastQuestion) {
    finishInterview()
  }
})

onMounted(() => {
  // Сбрасываем ответы при начале нового собеседования
  interviewStore.clearUserAnswers()
})
</script>

<template>
  <div class="ai-interview-session">
    <a-card title="Собеседование с ИИ" class="session-card">
      <!-- Прогресс бар -->
      <div class="progress-section">
        <a-progress
          :percent="progress"
          :show-info="false"
          status="active"
          class="progress-bar"
        />
        <div class="progress-info">
          <span>Вопрос {{ currentQuestionIndex + 1 }} из {{ questions.length }}</span>
          <span class="progress-percent">{{ progress }}%</span>
          <span v-if="totalScore !== null" class="score-info">
            Средний балл: {{ totalScore.toFixed(1) }}/10
          </span>
        </div>
      </div>

      <!-- Текущий вопрос -->
      <div class="question-section">
        <a-card :title="`Вопрос ${currentQuestionIndex + 1}`" class="question-card">
          <template #extra>
            <a-space>
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

          <div v-if="currentQuestion.tags && currentQuestion.tags.length" class="question-meta">
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

      <!-- Компонент оценки ответа -->
      <AnswerEvaluation
        :question-id="currentQuestion.id!"
        :question-text="currentQuestion.text"
        :evaluating="isEvaluating"
        :user-answer="currentUserAnswer"
        @submit="handleAnswerSubmit"
        @skip="handleSkipQuestion"
        @next="handleNextQuestion"
        @edit="handleEditAnswer"
        @show-ai-answer="handleShowAIAnswer"
      />

      <!-- Ответ ИИ (по требованию) -->
      <AIAnswerCard
        v-if="showAIAnswer && currentQuestion.aiAnswer"
        :answer="currentQuestion.aiAnswer"
        style="margin-top: 16px;"
        @close="showAIAnswer = false"
      />

      <!-- Быстрая навигация -->
      <div class="quick-navigation">
        <a-divider />
        <h4>Прогресс вопросов:</h4>
        <a-space wrap>
          <a-button
            v-for="(question, index) in questions"
            :key="index"
            :type="getQuestionButtonType(index)"
            size="small"
            :disabled="isEvaluating"
            @click="goToQuestion(index)"
          >
            {{ index + 1 }}
            <CheckCircleOutlined v-if="isQuestionAnswered(question.id!)" />
          </a-button>
        </a-space>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.ai-interview-session {
  padding: 20px;
}

.session-card {
  max-width: 1000px;
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
  flex-wrap: wrap;
  gap: 8px;
}

.progress-percent {
  font-weight: 500;
  color: #1890ff;
}

.score-info {
  font-weight: 600;
  color: #52c41a;
  background: #f6ffed;
  padding: 2px 8px;
  border-radius: 4px;
}

.question-section {
  margin-bottom: 24px;
}

.question-card {
  background: #fafafa;
  border: 2px solid #e8f4ff;
}

.question-text {
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
  color: #262626;
  font-weight: 500;
}

.quick-navigation {
  margin-top: 24px;
}

.quick-navigation h4 {
  margin-bottom: 12px;
  color: #8c8c8c;
}

@media (max-width: 768px) {
  .progress-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .ai-interview-session {
    padding: 10px;
  }
}
</style>
