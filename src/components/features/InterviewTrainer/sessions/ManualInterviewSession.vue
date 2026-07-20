<script setup lang="ts">
import type { Question, QuestionStatus } from '@/types/interview'
import { message } from 'ant-design-vue'
import { computed, onUnmounted, ref } from 'vue'
import { useInterviewStore } from '@/stores/interview'
import { sanitizedContent } from '@/utils/helpers/answerHelpers'
import AIAnswerCard from '../components/Evaluation/AIAnswerCard.vue'
import QuestionCard from '../components/Questions/QuestionCard.vue'
import QuestionNav from '../components/Questions/QuestionNav.vue'
import QuestionStatusActions from '../components/Questions/QuestionStatusActions.vue'
import QuestionTags from '../components/Questions/QuestionTags.vue'
import Progress from '../components/Shared/Progress.vue'

interface Emits {
  (e: 'saveAiToUserAnswer', question: Question, aiAnswer: string): void
}

const emit = defineEmits<Emits>()

const interviewStore = useInterviewStore()

const questions = computed(() => interviewStore.sessionQuestionsList)
const currentQuestion = computed(() => interviewStore.currentQuestion!)
const currentQuestionIndex = computed(() => interviewStore.currentQuestionIndex)
const progress = computed(() => interviewStore.progress)
const interviewSettings = computed(() => interviewStore.interviewSettings)

const showAIAnswer = ref(false)
const showUserAnswer = ref(false)

// Лимиты и кулдауны для генерации ответов (с привязкой к ID вопроса)
const MAX_AI_ATTEMPTS = 3
const aiAttempts = ref<Record<string, number>>({})
const aiCooldown = ref(0)
let aiTimer: number | null = null

function isQuestionAnswered(questionId: string): boolean {
  return !!interviewStore.getUserAnswer(questionId)
}

const hasUserAnswer = computed(() => {
  return !!(currentQuestion.value?.userAnswer && currentQuestion.value.userAnswer.trim().length > 0)
})

function startAiCooldown() {
  if (aiTimer)
    clearInterval(aiTimer)
  aiCooldown.value = 10
  aiTimer = window.setInterval(() => {
    aiCooldown.value--
    if (aiCooldown.value <= 0) {
      clearInterval(aiTimer!)
      aiTimer = null
    }
  }, 1000)
}

async function setQuestionStatus(status: QuestionStatus) {
  if (!currentQuestion.value?.id) {
    return
  }

  try {
    await interviewStore.updateQuestionStatus(currentQuestion.value.id, status)
  }
  catch (error) {
    console.error('Error updating status:', error)
    message.error('Ошибка при обновлении статуса вопроса')
  }
}

async function toggleAnswerVisibility() {
  if (showAIAnswer.value) {
    hideAnswer()
  }
  else {
    // Если ответ уже есть, не дергаем API, просто показываем!
    if (currentQuestion.value?.aiAnswer) {
      showAIAnswer.value = true
      showUserAnswer.value = false
    }
    else {
      await generateAIAnswer()
    }
  }
}

function toggleUserAnswerVisibility() {
  showUserAnswer.value = !showUserAnswer.value
  if (showUserAnswer.value) {
    showAIAnswer.value = false
  }
}

function hideAnswer() {
  showAIAnswer.value = false
  showUserAnswer.value = false
}

async function generateAIAnswer() {
  const qId = currentQuestion.value?.id
  if (!qId)
    return

  // Проверяем лимиты попыток для ТЕКУЩЕГО вопроса
  const attempts = aiAttempts.value[qId] || 0
  if (attempts >= MAX_AI_ATTEMPTS) {
    message.warning('Лимит генерации ответов (3 раза) для этого вопроса исчерпан.')
    return
  }

  // Проверяем глобальный кулдаун
  if (aiCooldown.value > 0) {
    message.warning(`Подождите ${aiCooldown.value} сек. перед следующей генерацией.`)
    return
  }

  try {
    aiAttempts.value[qId] = attempts + 1
    startAiCooldown()

    await interviewStore.generateAnswerForQuestion(qId)
    message.success('Ответ сгенерирован!')
    showAIAnswer.value = true
    showUserAnswer.value = false
  }
  catch (error) {
    console.error('Error generating answer:', error)
    message.error('Не удалось сгенерировать ответ')
  }
}

function navigateToNextQuestion() {
  interviewStore.nextQuestion()
  hideAnswer()
}

function navigateToPreviousQuestion() {
  interviewStore.previousQuestion()
  hideAnswer()
}

function completeInterview() {
  interviewStore.finishInterview()
}

function navigateToQuestion(index: number) {
  if (index >= 0 && index < questions.value.length) {
    interviewStore.currentQuestionIndex = index
    hideAnswer()
  }
}

function handleSaveAiToUserAnswer(aiAnswer: string) {
  emit('saveAiToUserAnswer', currentQuestion.value, aiAnswer)
}

onUnmounted(() => {
  if (aiTimer)
    clearInterval(aiTimer)
})
</script>

<template>
  <div class="interview-session">
    <a-card title="Режим собеседования" class="session-card" :bordered="false">
      <Progress
        v-if="interviewSettings.showProgress"
        :progress="progress"
        :current-index="currentQuestionIndex"
        :total="questions.length"
      />

      <div class="question-section">
        <QuestionCard
          :question="currentQuestion!"
          :question-number="currentQuestionIndex + 1"
          :show-answer-toggle="true"
          :show-user-answer-toggle="hasUserAnswer"
          :answer-visible="showAIAnswer"
          :user-answer-visible="showUserAnswer"
          :answer-generating="interviewStore.isGeneratingAnswer"
          @toggle-answer="toggleAnswerVisibility"
          @toggle-user-answer="toggleUserAnswerVisibility"
        >
          <template #tags="{ tags }">
            <QuestionTags :tags="tags" />
          </template>
        </QuestionCard>

        <!-- Блок пользовательского ответа -->
        <a-card
          v-if="showUserAnswer && hasUserAnswer"
          class="user-answer-card"
          :class="{ expanded: showUserAnswer }"
        >
          <template #title>
            <div class="user-answer-header">
              <span class="user-answer-title">📝 Ваш ответ</span>
              <a-button
                type="text"
                size="small"
                @click="toggleUserAnswerVisibility"
              >
                Скрыть
              </a-button>
            </div>
          </template>
          <div
            class="answer-text"
            v-html="sanitizedContent(currentQuestion.userAnswer)"
          />
        </a-card>

        <QuestionStatusActions
          :current-status="currentQuestion?.status"
          @status-change="setQuestionStatus"
        />

        <AIAnswerCard
          v-if="showAIAnswer && currentQuestion.aiAnswer"
          :answer="currentQuestion.aiAnswer"
          :answer-generating="interviewStore.isGeneratingAnswer"
          mode="manual"
          @regenerate="generateAIAnswer"
          @close="hideAnswer"
          @save-to-user-answer="handleSaveAiToUserAnswer"
        />
      </div>

      <div class="fixed-navigation-section">
        <QuestionNav
          :questions="questions"
          :current-index="currentQuestionIndex"
          :is-question-answered="isQuestionAnswered"
          @previous="navigateToPreviousQuestion"
          @next="navigateToNextQuestion"
          @finish="completeInterview"
          @go-to="navigateToQuestion"
        />
      </div>
    </a-card>
  </div>
</template>

<style scoped>
@import '@/assets/styles/markdown-content.scss';

.interview-session {
  height: 100%;
}

.session-card {
  height: 100%;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.user-answer-card {
  border: 1px solid var(--ant-color-success-border);
  background: var(--ant-color-success-bg);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.user-answer-card.expanded {
  border-color: var(--ant-color-success);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.user-answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-answer-title {
  font-weight: 600;
  color: var(--ant-color-success);
  display: flex;
  align-items: center;
  gap: 8px;
}

.fixed-navigation-section {
  position: sticky;
  bottom: 0;
  background: var(--ant-color-bg-container);
  padding: 16px 0;
  margin-top: auto;
  flex-shrink: 0;
  z-index: 10;
}

@media (max-width: 768px) {
  .fixed-navigation-section {
    padding: 12px 0;
  }

  .user-answer-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .user-answer-header :deep(.ant-btn) {
    align-self: flex-end;
  }

  .question-section {
    gap: 8px;
  }
}
</style>
