<script setup lang="ts">
import type { InterviewSession, QARecord } from '@/types/history.ts'
import { message } from 'ant-design-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { HistoryService } from '@/services/historyService.ts'
import { useAuthStore } from '@/stores/auth.ts'
import { useInterviewStore } from '@/stores/interview'
import AIAnswerCard from '../components/Evaluation/AIAnswerCard.vue'
import AnswerEvaluation from '../components/Evaluation/AnswerEvaluation.vue'
import QuestionCard from '../components/Questions/QuestionCard.vue'
import QuestionNav from '../components/Questions/QuestionNav.vue'
import Progress from '../components/Shared/Progress.vue'

const interviewStore = useInterviewStore()
const authStore = useAuthStore()

const questions = computed(() => interviewStore.sessionQuestionsList)
const currentQuestion = computed(() => interviewStore.currentQuestion!)
const currentQuestionIndex = computed(() => interviewStore.currentQuestionIndex)
const progress = computed(() => interviewStore.progress)
const isEvaluating = computed(() => interviewStore.isEvaluating)
const showAIAnswer = ref(false)
const interviewSettings = computed(() => interviewStore.interviewSettings)

// Добавляем ключ для принудительного пересоздания AnswerEvaluation
const answerEvaluationKey = ref(0)

const currentUserAnswer = computed(() => {
  return interviewStore.getUserAnswer(currentQuestion.value.id!)
})

const totalScore = computed(() => {
  const answeredQuestions = interviewStore.userAnswers.filter(a => a.evaluation)
  if (answeredQuestions.length === 0)
    return null

  const total = answeredQuestions.reduce((sum, answer) => {
    return sum + (answer.evaluation?.score || 0)
  }, 0)

  return total / answeredQuestions.length
})

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

async function finishInterview() {
  // 1. Показываем лоадер
  message.loading({ content: 'Сохраняем результаты...', key: 'saveProgress' })

  try {
    // 2. Если юзер авторизован, собираем данные для истории
    if (authStore.isAuthenticated && authStore.user) {
      // Формируем красивый список вопросов и ответов
      const qaList: QARecord[] = interviewStore.userAnswers.map((answer) => {
        const questionObj = questions.value.find(q => q.id === answer.questionId)
        return {
          question: questionObj?.text || 'Неизвестный вопрос',
          userAnswer: answer.userAnswer,
          score: answer.evaluation?.score || 0,
          feedback: answer.evaluation?.feedback || 'Нет обратной связи',
        }
      })

      // Собираем объект сессии
      const sessionData: Omit<InterviewSession, 'id'> = {
        userId: authStore.user.uid,
        specialty: questions.value[0]?.category || 'frontend',
        difficulty: questions.value[0]?.difficulty || 'middle',
        date: new Date().toISOString(),
        averageScore: totalScore.value || 0,
        qaList,
      }

      // Отправляем в Firebase!
      await HistoryService.saveSession(sessionData)
    }

    // 3. Завершаем локально
    interviewStore.finishInterview()

    // 4. Уведомляем об успехе
    const scoreMsg = totalScore.value !== null
      ? `Ваш средний балл: ${totalScore.value.toFixed(1)}/10`
      : ''

    message.success({
      content: `Собеседование завершено! ${scoreMsg}. Результаты сохранены в профиле.`,
      key: 'saveProgress',
      duration: 3,
    })
  }
  catch (error) {
    console.error('Ошибка сохранения прогресса:', error)
    message.error({ content: 'Собеседование завершено, но произошла ошибка при сохранении в историю.', key: 'saveProgress', duration: 3 })
    // Все равно завершаем локально, чтобы не блочить UI
    interviewStore.finishInterview()
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
    <a-card title="Собеседование с ИИ" class="session-card" :bordered="false">
      <Progress
        v-if="interviewSettings.showProgress"
        :progress="progress"
        :current-index="currentQuestionIndex"
        :total="questions.length"
        :show-score="true"
        :score="totalScore"
      />

      <div class="question-section">
        <QuestionCard
          :question="currentQuestion"
          :question-number="currentQuestionIndex + 1"
        />
      </div>

      <AnswerEvaluation
        v-if="interviewSettings.enableAnswerInput"
        :key="answerEvaluationKey"
        :question-id="currentQuestion.id!"
        :question-text="currentQuestion.text"
        :evaluating="isEvaluating"
        :user-answer="currentUserAnswer"
        :ai-answer-loading="interviewStore.isGeneratingAnswer"
        :is-last-question="interviewStore.isLastQuestion"
        @submit="handleAnswerSubmit"
        @skip="handleSkipQuestion"
        @next="handleNextQuestion"
        @finish="finishInterview"
        @edit="handleEditAnswer"
        @show-ai-answer="handleShowAIAnswer"
      />

      <div v-else class="navigation-section">
        <QuestionNav
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
  border-radius: 12px;
  border: 1px solid var(--ant-color-border-secondary);
  background: var(--ant-color-bg-container);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
}

.session-card :deep(.ant-card-head) {
  border-bottom: 1px solid var(--ant-color-border-secondary);
}

.session-card :deep(.ant-card-head-title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--ant-color-text);
}

.question-section {
  margin-bottom: 24px;
}

.navigation-section {
  margin-top: 24px;
}

@media (max-width: 768px) {
  .ai-interview-session {
    padding: 10px;
  }
}
</style>
