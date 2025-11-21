<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { ProgressSection } from '@/components/shared/ProgressSection'
import { QuestionCard } from '@/components/shared/QuestionCard'
import { QuestionNavigation } from '@/components/shared/QuestionNavigation'
import { useInterviewStore } from '@/stores/interview'
import AIAnswerCard from '../shared/AIAnswerCard.vue'
import AnswerEvaluation from '../shared/AnswerEvaluation.vue'

const interviewStore = useInterviewStore()

const questions = computed(() => interviewStore.sessionQuestionsList)
const currentQuestion = computed(() => interviewStore.currentQuestion!)
const currentQuestionIndex = computed(() => interviewStore.currentQuestionIndex)
const progress = computed(() => interviewStore.progress)
const isEvaluating = computed(() => interviewStore.isEvaluating)
const showAIAnswer = ref(false)
const interviewSettings = computed(() => interviewStore.interviewSettings)

// Добавляем ключ для принудительного пересоздания AnswerEvaluation
const answerEvaluationKey = ref(0)

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

function nextQuestion() {
  interviewStore.nextQuestion()
  showAIAnswer.value = false
  // Сбрасываем ключ для пересоздания AnswerEvaluation
  answerEvaluationKey.value++
}

function previousQuestion() {
  interviewStore.previousQuestion()
  showAIAnswer.value = false
  // Сбрасываем ключ для пересоздания AnswerEvaluation
  answerEvaluationKey.value++
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
  showAIAnswer.value = false
  // Сбрасываем ключ для пересоздания AnswerEvaluation
  answerEvaluationKey.value++
}

function handleNextQuestion() {
  interviewStore.nextQuestion()
  showAIAnswer.value = false
  // Сбрасываем ключ для пересоздания AnswerEvaluation
  answerEvaluationKey.value++
}

function handleEditAnswer() {
  showAIAnswer.value = false
}

async function handleShowAIAnswer() {
  if (!currentQuestion.value?.id)
    return

  showAIAnswer.value = true

  try {
    await interviewStore.generateAnswerForQuestion(currentQuestion.value.id!)
    message.success('Ответ ИИ сгенерирован!')
  }
  catch {
    message.error('Не удалось сгенерировать ответ ИИ')
    showAIAnswer.value = false
  }
}

function goToQuestion(index: number) {
  if (index >= 0 && index < questions.value.length) {
    interviewStore.currentQuestionIndex = index
    showAIAnswer.value = false
    // Сбрасываем ключ для пересоздания AnswerEvaluation
    answerEvaluationKey.value++
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

// Следим за изменением текущего вопроса и сбрасываем состояние
watch(currentQuestionIndex, () => {
  showAIAnswer.value = false
  answerEvaluationKey.value++
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
      <ProgressSection
        v-if="interviewSettings.showProgress"
        :progress="progress"
        :current-index="currentQuestionIndex"
        :total="questions.length"
        :show-score="true"
        :score="totalScore"
      />

      <!-- Текущий вопрос -->
      <div class="question-section">
        <QuestionCard
          :question="currentQuestion"
          :question-number="currentQuestionIndex + 1"
        />
      </div>

      <!-- Компонент оценки ответа -->
      <AnswerEvaluation
        v-if="interviewSettings.enableAnswerInput"
        :key="answerEvaluationKey"
        :question-id="currentQuestion.id!"
        :question-text="currentQuestion.text"
        :evaluating="isEvaluating"
        :user-answer="currentUserAnswer"
        :ai-answer-loading="interviewStore.isGeneratingAnswer"
        @submit="handleAnswerSubmit"
        @skip="handleSkipQuestion"
        @next="handleNextQuestion"
        @edit="handleEditAnswer"
        @show-ai-answer="handleShowAIAnswer"
      />

      <!-- Навигация -->
      <div v-else class="navigation-section">
        <QuestionNavigation
          :questions="questions"
          :current-index="currentQuestionIndex"
          :is-evaluating="isEvaluating"
          :is-question-answered="isQuestionAnswered"
          @previous="previousQuestion"
          @next="nextQuestion"
          @finish="finishInterview"
          @go-to="goToQuestion"
        />
      </div>

      <!-- Ответ ИИ (по требованию) -->
      <AIAnswerCard
        v-if="showAIAnswer && currentQuestion.aiAnswer"
        :answer="currentQuestion.aiAnswer"
        :answer-generating="interviewStore.isGeneratingAnswer"
        mode="ai"
        style="margin-top: 16px;"
        @regenerate="handleShowAIAnswer"
        @close="showAIAnswer = false"
      />
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

.question-section {
  margin-bottom: 24px;
}

.navigation-section {
  margin-top: 24px;
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
