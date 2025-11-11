<script setup lang="ts">
import type { QuestionStatus } from '@/types/interview'
import { message } from 'ant-design-vue'
import { computed, ref } from 'vue'
import { ProgressSection } from '@/components/shared/ProgressSection'
import { QuestionCard } from '@/components/shared/QuestionCard'
import { QuestionNavigation } from '@/components/shared/QuestionNavigation'
import { QuestionStatusActions } from '@/components/shared/QuestionStatusActions'
import { QuestionTags } from '@/components/shared/QuestionTags'
import { useInterviewStore } from '@/stores/interview'
import AIAnswerCard from '../shared/AIAnswerCard.vue'

const interviewStore = useInterviewStore()

const questions = computed(() => interviewStore.sessionQuestionsList)
const currentQuestion = computed(() => interviewStore.currentQuestion!)
const currentQuestionIndex = computed(() => interviewStore.currentQuestionIndex)
const progress = computed(() => interviewStore.progress)
const interviewSettings = computed(() => interviewStore.interviewSettings)

const answerVisible = ref(false)
const answerGenerating = ref(false)

function isQuestionAnswered(questionId: string): boolean {
  return !!interviewStore.getUserAnswer(questionId)
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
          :answer-visible="answerVisible"
          :answer-generating="answerGenerating"
          @toggle-answer="toggleAnswerVisibility"
        >
          <template #tags="{ tags }">
            <QuestionTags :tags="tags" />
          </template>
        </QuestionCard>

        <QuestionStatusActions
          :current-status="currentQuestion?.status"
          @status-change="setQuestionStatus"
        />

        <AIAnswerCard
          v-if="answerVisible && currentQuestion.aiAnswer"
          :answer="currentQuestion.aiAnswer"
          :loading="answerGenerating"
          @regenerate="generateAIAnswer"
          @close="hideAnswer"
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
  .interview-session {
    padding: 12px;
  }

  .fixed-navigation-section {
    padding: 12px 0;
  }

  .fixed-navigation-section :deep(.ant-space) {
    width: 100%;
    justify-content: space-between;
  }

  .fixed-navigation-section :deep(.ant-btn) {
    flex: 1;
  }
}
</style>
