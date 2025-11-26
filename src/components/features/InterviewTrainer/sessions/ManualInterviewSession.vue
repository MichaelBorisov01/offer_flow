<script setup lang="ts">
import type { Question, QuestionStatus } from '@/types/interview'
import { message } from 'ant-design-vue'
import { computed, ref } from 'vue'
import { ProgressSection } from '@/components/shared/ProgressSection'
import { QuestionCard } from '@/components/shared/QuestionCard'
import { QuestionNavigation } from '@/components/shared/QuestionNavigation'
import { QuestionStatusActions } from '@/components/shared/QuestionStatusActions'
import { QuestionTags } from '@/components/shared/QuestionTags'
import { useInterviewStore } from '@/stores/interview'
import AIAnswerCard from '../shared/AIAnswerCard.vue'

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

function isQuestionAnswered(questionId: string): boolean {
  return !!interviewStore.getUserAnswer(questionId)
}

const hasUserAnswer = computed(() => {
  return !!(currentQuestion.value?.userAnswer && currentQuestion.value.userAnswer.trim().length > 0)
})

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
    await generateAIAnswer()
  }
}

function toggleUserAnswerVisibility() {
  showUserAnswer.value = !showUserAnswer.value
  // Скрываем AI ответ при показе пользовательского
  if (showUserAnswer.value) {
    showAIAnswer.value = false
  }
}

function hideAnswer() {
  showAIAnswer.value = false
  showUserAnswer.value = false
}

async function generateAIAnswer() {
  if (!currentQuestion.value?.id)
    return

  try {
    await interviewStore.generateAnswerForQuestion(currentQuestion.value.id)
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
</script>

<template>
  <div class="interview-session">
    <a-card title="Режим собеседования" class="session-card">
      <ProgressSection
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
          <div class="user-answer-content">
            {{ currentQuestion.userAnswer }}
          </div>
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
        <QuestionNavigation
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
.interview-session {
   height: 100%;
}

.session-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.question-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.user-answer-card {
  border: 1px solid #e6f7ff;
  background: #f6ffed;
  transition: all 0.3s ease;
}

.user-answer-card.expanded {
  border-color: #b7eb8f;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.1);
}

.user-answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-answer-title {
  font-weight: 600;
  color: #52c41a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-answer-content {
  padding: 8px 0;
  line-height: 1.6;
  color: #262626;
  white-space: pre-line;
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
